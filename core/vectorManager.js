/**
 * Horae - 向量记忆管理器
 * 基于 Transformers.js 的本地向量检索系统
 *
 * 数据按 chatId 隔离，向量存 IndexedDB，轻量索引存 chat[0].horae_meta.vectorIndex
 */

import { calculateDetailedRelativeTime } from '../utils/timeUtils.js';
import { t2s } from '../utils/zhConvert.js';
import { tNodeForLang, detectEffectiveAiLang } from './i18n.js';

const DB_NAME = 'HoraeVectors';
const DB_VERSION = 1;
const STORE_NAME = 'vectors';

const MODEL_CONFIG = {
    'Xenova/bge-small-zh-v1.5': { dimensions: 512, prefix: null },
    'Xenova/multilingual-e5-small': { dimensions: 384, prefix: { query: 'query: ', passage: 'passage: ' } },
};

const EMPTY_KEYWORD_TABLE = {
    intent: { first: [], last: [] },
    patterns: {
        costume: [], mood: [], gift: [],
        importantItem: [], importantEvent: [],
        ceremony: [], promise: [], loss: [], revelation: [], power: [],
    },
    categories: {},
    moodWords: [],
    giftKws: [],
    costumeFiller: [],
    eventLevels: { important: [], key: [] },
};

export class VectorManager {
    constructor() {
        this.worker = null;
        // 结构化标签需排除在 termCounts 外，避免污染 IDF
        if (!VectorManager._STRUCT_TAGS_SET) {
            VectorManager._STRUCT_TAGS_SET = new Set([
                'Event', 'NPC', 'Location', 'Characters', 'Time', 'RPG',
                'Structured', 'Context', 'equip', 'unequip', 'base',
            ]);
        }
        this.db = null;
        this.chatId = null;
        this.vectors = new Map();
        this.isReady = false;
        this.isLoading = false;
        this.isApiMode = false;
        this.dimensions = 0;
        this.modelName = '';
        this._apiUrl = '';
        this._apiKey = '';
        this._apiModel = '';
        this.termCounts = new Map();
        this.totalDocuments = 0;
        this._pendingCallbacks = new Map();
        this._callId = 0;
    }

    // ========================================
    // 生命周期
    // ========================================

    async initModel(model, dtype, onProgress) {
        if (this.isLoading) return;
        this.isLoading = true;
        this.isReady = false;
        this.modelName = model;

        try {
            await this._disposeWorker();

            const workerUrl = new URL('../utils/embeddingWorker.js', import.meta.url);
            this.worker = new Worker(workerUrl, { type: 'module' });

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('模型加载超时（5分钟）')), 300000);

                this.worker.onmessage = (e) => {
                    const { type, data, dimensions: dims } = e.data;
                    if (type === 'progress' && onProgress) {
                        onProgress(data);
                    } else if (type === 'ready') {
                        this.dimensions = dims;
                        this.isReady = true;
                        clearTimeout(timeout);
                        resolve();
                    } else if (type === 'error') {
                        clearTimeout(timeout);
                        reject(new Error(e.data.message));
                    } else if (type === 'result' || type === 'disposed') {
                        const cb = this._pendingCallbacks.get(e.data.id);
                        if (cb) {
                            this._pendingCallbacks.delete(e.data.id);
                            cb.resolve(e.data);
                        }
                    }
                };

                this.worker.onerror = (err) => {
                    clearTimeout(timeout);
                    reject(new Error(err.message || 'Worker 加载失败'));
                };

                this.worker.postMessage({ type: 'init', data: { model, dtype: dtype || 'q8' } });
            });

            this.worker.onmessage = (e) => {
                const msg = e.data;
                if (msg.type === 'result' || msg.type === 'error' || msg.type === 'disposed') {
                    const cb = this._pendingCallbacks.get(msg.id);
                    if (cb) {
                        this._pendingCallbacks.delete(msg.id);
                        if (msg.type === 'error') cb.reject(new Error(msg.message));
                        else cb.resolve(msg);
                    }
                }
            };

            console.log(`[Horae Vector] 模型已加载: ${model} (${this.dimensions}维)`);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 初始化 API 模式（OpenAI 兼容的 embedding endpoint）
     */
    async initApi(url, key, model) {
        if (this.isLoading) return;
        this.isLoading = true;
        this.isReady = false;

        try {
            await this._disposeWorker();

            this.isApiMode = true;
            this._apiUrl = url.replace(/\/+$/, '');
            this._apiKey = key;
            this._apiModel = model;
            this.modelName = model;

            // 探测维度：发一条测试文本
            const testResult = await this._embedApi(['test']);
            if (!testResult?.vectors?.[0]) {
                throw new Error('API 连接失败或返回格式异常，请检查地址、密钥和模型名称是否正确');
            }
            this.dimensions = testResult.vectors[0].length;
            this.isReady = true;
            console.log(`[Horae Vector] API 模式已就绪: ${model} (${this.dimensions}维)`);
        } finally {
            this.isLoading = false;
        }
    }

    async dispose() {
        await this._disposeWorker();
        this.vectors.clear();
        this.termCounts.clear();
        this.totalDocuments = 0;
        this.chatId = null;
        this.isReady = false;
        this.isApiMode = false;
        this._apiUrl = '';
        this._apiKey = '';
        this._apiModel = '';
    }

    async _disposeWorker() {
        if (this.worker) {
            try {
                this.worker.postMessage({ type: 'dispose' });
                await new Promise(r => setTimeout(r, 200));
            } catch (_) { /* ignore */ }
            this.worker.terminate();
            this.worker = null;
        }
        this._pendingCallbacks.clear();
    }

    /**
     * 切换聊天：加载对应 chatId 的向量索引
     */
    async loadChat(chatId, chat) {
        this.chatId = chatId;
        this.vectors.clear();
        this.termCounts.clear();
        this.totalDocuments = 0;

        if (!chatId) return;

        try {
            await this._openDB();
            const stored = await this._loadAllVectors();
            const staleKeys = [];
            for (const item of stored) {
                if (item.messageIndex >= chat.length) {
                    staleKeys.push(item.messageIndex);
                    continue;
                }
                const meta = chat[item.messageIndex]?.horae_meta;
                const doc = this.buildVectorDocument(meta);
                if (!doc || this._hashString(doc) !== item.hash) {
                    staleKeys.push(item.messageIndex);
                    continue;
                }
                this.vectors.set(item.messageIndex, {
                    vector: item.vector,
                    hash: item.hash,
                    document: item.document,
                });
                this._updateTermCounts(item.document, 1);
                this.totalDocuments++;
            }
            if (staleKeys.length > 0) {
                for (const idx of staleKeys) await this._deleteVector(idx);
                console.log(`[Horae Vector] 清理了 ${staleKeys.length} 条过期/分支外向量`);
            }
            console.log(`[Horae Vector] 已加载 ${this.vectors.size} 条向量 (chatId: ${chatId})`);
        } catch (err) {
            console.warn('[Horae Vector] 加载向量索引失败:', err);
        }
    }

    // ========================================
    // 文档构建
    // ========================================

    /**
     * 将 horae_meta 序列化为检索文本
     * 事件摘要为核心（占主要权重），场景/角色/NPC 为辅
     * 去掉物品、服装、心情等噪音，让 embedding 集中在语义关键内容
     */
    buildVectorDocument(meta) {
        if (!meta) return '';
        if (meta._skipHorae) return '';

        const eventTexts = [];
        if (meta.events?.length > 0) {
            for (const evt of meta.events) {
                if (evt.isSummary || evt.level === '摘要' || evt._summaryId) continue;
                if (evt.summary) eventTexts.push(evt.summary);
            }
        }

        const npcTexts = [];
        if (meta.npcs) {
            for (const [name, info] of Object.entries(meta.npcs)) {
                let s = name;
                if (info.appearance) s += ` ${info.appearance}`;
                if (info.relationship) s += ` ${info.relationship}`;
                npcTexts.push(s);
            }
        }

        if (eventTexts.length === 0 && npcTexts.length === 0) return '';

        // 单事件一行、段落空行分隔；保留语义边界
        const eventBlock = eventTexts.length > 0
            ? eventTexts.map((evt, i) => `[Event ${i + 1}] ${evt}`).join('\n')
            : '';

        const contextLines = [];
        if (npcTexts.length > 0) {
            for (const t of npcTexts) contextLines.push(`[NPC] ${t}`);
        }
        if (meta.scene?.location) contextLines.push(`[Location] ${meta.scene.location}`);
        const chars = meta.scene?.characters_present || [];
        if (chars.length > 0) contextLines.push(`[Characters] ${chars.join(', ')}`);
        if (meta.timestamp?.story_date) {
            const time = meta.timestamp.story_time
                ? `${meta.timestamp.story_date} ${meta.timestamp.story_time}`
                : meta.timestamp.story_date;
            contextLines.push(`[Time] ${time}`);
        }

        const rpgLines = [];
        const rpg = meta._rpgChanges;
        if (rpg) {
            if (rpg.levels && Object.keys(rpg.levels).length > 0) {
                for (const [owner, lv] of Object.entries(rpg.levels)) {
                    rpgLines.push(`[RPG] ${owner} → Lv.${lv}`);
                }
            }
            for (const eq of (rpg.equipment || [])) {
                rpgLines.push(`[RPG] ${eq.owner} equip ${eq.name}(${eq.slot})`);
            }
            for (const u of (rpg.unequip || [])) {
                rpgLines.push(`[RPG] ${u.owner} unequip ${u.name}(${u.slot})`);
            }
            for (const bc of (rpg.baseChanges || [])) {
                if (bc.field === 'level') rpgLines.push(`[RPG] base ${bc.path} → Lv.${bc.value}`);
            }
        }

        const blocks = [];
        if (eventBlock) blocks.push(eventBlock);
        if (contextLines.length > 0) blocks.push(contextLines.join('\n'));
        if (rpgLines.length > 0) blocks.push(rpgLines.join('\n'));

        return blocks.join('\n\n');
    }

    // ========================================
    // 索引操作
    // ========================================

    async addMessage(messageIndex, meta) {
        if (!this.isReady || !this.chatId) return;
        if (meta?._skipHorae) return;

        const doc = this.buildVectorDocument(meta);
        if (!doc) return;

        const hash = this._hashString(doc);
        const existing = this.vectors.get(messageIndex);
        if (existing && existing.hash === hash) return;

        const text = this._prepareText(doc, false);
        const result = await this._embed([text]);
        if (!result || !result.vectors?.[0]) return;

        const vector = result.vectors[0];

        if (existing) {
            this._updateTermCounts(existing.document, -1);
        } else {
            this.totalDocuments++;
        }

        this.vectors.set(messageIndex, { vector, hash, document: doc });
        this._updateTermCounts(doc, 1);
        await this._saveVector(messageIndex, { vector, hash, document: doc });
    }

    async removeMessage(messageIndex) {
        const existing = this.vectors.get(messageIndex);
        if (!existing) return;

        this._updateTermCounts(existing.document, -1);
        this.totalDocuments--;
        this.vectors.delete(messageIndex);
        await this._deleteVector(messageIndex);
    }

    /**
     * 批量建索引（用于历史记录）
     * @returns {{ indexed: number, skipped: number }}
     */
    async batchIndex(chat, onProgress) {
        if (!this.isReady || !this.chatId) return { indexed: 0, skipped: 0 };

        const tasks = [];
        for (let i = 0; i < chat.length; i++) {
            const meta = chat[i].horae_meta;
            if (!meta || chat[i].is_user) continue;
            if (meta._skipHorae) continue;
            const doc = this.buildVectorDocument(meta);
            if (!doc) continue;
            const hash = this._hashString(doc);
            const existing = this.vectors.get(i);
            if (existing && existing.hash === hash) continue;
            tasks.push({ messageIndex: i, document: doc, hash });
        }

        if (tasks.length === 0) return { indexed: 0, skipped: chat.length };

        const batchSize = this.isApiMode ? 64 : 16;
        let indexed = 0;

        for (let b = 0; b < tasks.length; b += batchSize) {
            const batch = tasks.slice(b, b + batchSize);
            const texts = batch.map(t => this._prepareText(t.document, false));
            const result = await this._embed(texts);
            if (!result?.vectors) continue;

            for (let j = 0; j < batch.length; j++) {
                const task = batch[j];
                const vector = result.vectors[j];
                if (!vector) continue;

                const old = this.vectors.get(task.messageIndex);
                if (old) {
                    this._updateTermCounts(old.document, -1);
                } else {
                    this.totalDocuments++;
                }

                this.vectors.set(task.messageIndex, {
                    vector,
                    hash: task.hash,
                    document: task.document,
                });
                this._updateTermCounts(task.document, 1);
                await this._saveVector(task.messageIndex, { vector, hash: task.hash, document: task.document });
                indexed++;
            }

            if (onProgress) {
                onProgress({ current: Math.min(b + batchSize, tasks.length), total: tasks.length });
            }
        }

        return { indexed, skipped: chat.length - tasks.length };
    }

    async clearIndex() {
        this.vectors.clear();
        this.termCounts.clear();
        this.totalDocuments = 0;
        if (this.chatId) await this._clearVectors();
    }

    // ========================================
    // 查询与召回
    // ========================================

    /**
     * 构建状态查询文本（当前场景/角色/事件）
     */
    buildStateQuery(currentState, lastMeta) {
        const parts = [];

        // 优先使用上一条 AI 消息时间；无则回退到当前聚合状态时间
        const storyDate = lastMeta?.timestamp?.story_date || currentState.timestamp?.story_date || '';
        const storyTime = lastMeta?.timestamp?.story_time || currentState.timestamp?.story_time || '';
        if (storyDate || storyTime) {
            const timeText = [storyDate, storyTime].filter(Boolean).join(' ');
            parts.push(`时间 ${timeText}`);
        }

        if (currentState.scene?.location) parts.push(currentState.scene.location);

        const chars = currentState.scene?.characters_present || [];
        for (const c of chars) {
            parts.push(c);
            if (currentState.costumes?.[c]) parts.push(currentState.costumes[c]);
        }

        if (lastMeta?.events?.length > 0) {
            for (const evt of lastMeta.events) {
                if (evt.summary) parts.push(evt.summary);
            }
        }

        return parts.filter(Boolean).join(' ');
    }

    /**
     * 构建合并召回查询文本
     */
    buildMergedRecallQuery(stateQuery, userQuery) {
        const sections = [];
        if (stateQuery) sections.push(`[当前情境] ${stateQuery}`);
        if (userQuery) sections.push(`[玩家输入] ${userQuery}`);
        return sections.join('\n').trim();
    }

    /**
     * 清理用户消息为查询文本
     */
    cleanUserMessage(rawMessage) {
        if (!rawMessage) return '';
        return rawMessage
            .replace(/<[^>]*>/g, '')
            .replace(/[\[\]]/g, '')
            .trim()
            .substring(0, 300);
    }

    /**
     * 向量检索
     * @param {string} queryText
     * @param {number} topK
     * @param {number} threshold
     * @param {Set<number>} excludeIndices - 排除的消息索引（已在上下文中）
     * @returns {Promise<Array<{messageIndex: number, similarity: number, document: string}>>}
     */
    async search(queryText, topK = 5, threshold = 0.72, excludeIndices = new Set(), pureMode = false) {
        if (!this.isReady || !queryText || this.vectors.size === 0) return [];

        const prepared = this._prepareText(queryText, true);
        console.log('[Horae Vector] 开始 embedding 查询...');
        console.log(`[Horae Vector] 实际检索阈值: ${Number(threshold).toFixed(4)} | topK=${topK} | pureMode=${!!pureMode}`);
        const result = await this._embed([prepared]);
        if (!result?.vectors?.[0]) {
            console.warn('[Horae Vector] embedding 返回空结果:', result);
            return [];
        }

        const queryVec = result.vectors[0];
        console.log(`[Horae Vector] 查询向量维度: ${queryVec.length}，开始对比 ${this.vectors.size} 条...`);

        const scored = [];
        const allScored = [];
        let searchedCount = 0;

        for (const [msgIdx, entry] of this.vectors) {
            if (excludeIndices.has(msgIdx)) continue;
            searchedCount++;
            const sim = this._dotProduct(queryVec, entry.vector);
            allScored.push({ messageIndex: msgIdx, similarity: sim, document: entry.document });
            if (sim >= threshold) {
                scored.push({ messageIndex: msgIdx, similarity: sim, document: entry.document });
            }
        }

        allScored.sort((a, b) => b.similarity - a.similarity);
        const bestSim = allScored.length > 0 ? allScored[0].similarity : 0;
        console.log(`[Horae Vector] 搜索了 ${searchedCount} 条 | 最高相似度=${bestSim.toFixed(4)} | 超过阈值(${threshold}): ${scored.length} 条`);
        if (scored.length === 0 && allScored.length > 0) {
            console.log(`[Horae Vector] 阈值下 Top-5 候选:`);
            for (const c of allScored.slice(0, 5)) {
                console.log(`  #${c.messageIndex} sim=${c.similarity.toFixed(4)} | ${c.document.substring(0, 60)}`);
            }
        }

        scored.sort((a, b) => b.similarity - a.similarity);

        const adjusted = pureMode ? scored : this._adjustThresholdByFrequency(scored, threshold);
        if (!pureMode) console.log(`[Horae Vector] 频率过滤后: ${adjusted.length} 条`);

        const deduped = this._deduplicateResults(adjusted);
        console.log(`[Horae Vector] 去重后: ${deduped.length} 条`);

        return deduped.slice(0, topK);
    }

    /**
     * 噪声文档惩罚（IDF）
     * 平均 IDF 过低说明文档由必然高频词主导（如主角名+场景），略上调阈值
     */
    _adjustThresholdByFrequency(results, baseThreshold) {
        if (results.length < 2 || this.totalDocuments < 10) return results;

        const N = this.totalDocuments;
        return results.filter(r => {
            const terms = this._extractKeyTerms(r.document);
            if (terms.length === 0) return true;

            let idfSum = 0;
            for (const term of terms) {
                const df = this.termCounts.get(term) || 0;
                // 平滑 IDF：log((N+1)/(df+1))
                idfSum += Math.log((N + 1) / (df + 1));
            }
            const avgIdf = idfSum / terms.length;

            // avgIdf < 0.5 视为通用词主导，按比例上调阈值，封顶 +0.025
            if (avgIdf < 0.5) {
                const penalty = (0.5 - avgIdf) * 0.05;
                return r.similarity >= baseThreshold + penalty;
            }
            return true;
        });
    }

    /**
     * 策略C：折叠高度相似的结果
     */
    _deduplicateResults(results) {
        if (results.length <= 1) return results;

        const kept = [results[0]];
        for (let i = 1; i < results.length; i++) {
            const candidate = results[i];
            let isDuplicate = false;
            for (const existing of kept) {
                const mutualSim = this._dotProduct(
                    this.vectors.get(existing.messageIndex)?.vector || [],
                    this.vectors.get(candidate.messageIndex)?.vector || []
                );
                if (mutualSim > 0.92) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) kept.push(candidate);
        }
        return kept;
    }

    // ========================================
    // 召回 Prompt 构建
    // ========================================

    /**
     * 智能召回：结构化查询 + 向量搜索并行，合并结果
     */
    async generateRecallPrompt(horaeManager, skipLast, settings, extraExcludeIndices = new Set()) {
        const chat = horaeManager.getChat();
        const state = horaeManager.getLatestState(skipLast);
        const topK = settings.vectorTopK || 5;
        const threshold = settings.vectorThreshold ?? 0.72;

        // 关键词表随 AI 输出语言加载，中文作兜底
        this._refreshKeywordTable(settings);

        // 开启 rerank 时 embedding 走宽松召回（低阈值+大候选池），交给 rerank 精排
        const useRerank = !!(settings.vectorRerankEnabled && settings.vectorRerankModel);
        const recallTopK = useRerank
            ? Math.max(topK, settings.vectorRerankCandidates || topK * 5)
            : topK;
        // 非 rerank 路径下，索引规模越大相应上调阈值
        const recallThreshold = useRerank
            ? (settings.vectorRerankRecallThreshold ?? 0.3)
            : this._dynamicThreshold(threshold);

        let rawUserMsg = '';
        for (let i = chat.length - 1; i >= 0; i--) {
            if (chat[i].is_user) { rawUserMsg = chat[i].mes || ''; break; }
        }
        const userQuery = this.cleanUserMessage(rawUserMsg);

        // 构建统一查询：使用最近一条 AI 元数据补充“当前情境”
        let lastMetaForQuery = null;
        for (let i = chat.length - 1 - skipLast; i >= 0; i--) {
            if (!chat[i].is_user && chat[i].horae_meta && !chat[i].horae_meta._skipHorae) {
                lastMetaForQuery = chat[i].horae_meta;
                break;
            }
        }
        const stateQueryForRecall = this.buildStateQuery(state, lastMetaForQuery);
        const mergedRecallQuery = this.buildMergedRecallQuery(stateQueryForRecall, userQuery);

        const EXCLUDE_RECENT = 5;
        const excludeIndices = new Set();
        for (let i = Math.max(0, chat.length - EXCLUDE_RECENT); i < chat.length; i++) {
            excludeIndices.add(i);
        }
        if (extraExcludeIndices && typeof extraExcludeIndices[Symbol.iterator] === 'function') {
            for (const idx of extraExcludeIndices) {
                if (Number.isInteger(idx) && idx >= 0 && idx < chat.length) {
                    excludeIndices.add(idx);
                }
            }
        }
        if (excludeIndices.size > EXCLUDE_RECENT) {
            console.log(`[Horae Vector] 额外排除已在Prompt中的楼层: +${excludeIndices.size - EXCLUDE_RECENT}`);
        }

        const merged = new Map();

        const pureMode = !!settings.vectorPureMode;
        if (pureMode) console.log('[Horae Vector] 纯向量模式已启用，跳过关键词启发式');
        if (useRerank) console.log(`[Horae Vector] Rerank 模式：embedding 召回阈值=${recallThreshold} / 候选=${recallTopK}`);

        const structuredResults = this._structuredQuery(userQuery, chat, state, excludeIndices, topK, pureMode);
        console.log(`[Horae Vector] 结构化查询: ${structuredResults.length} 条命中`);
        for (const r of structuredResults) {
            merged.set(r.messageIndex, r);
        }

        const hybridResults = await this._hybridSearch(userQuery, state, horaeManager, skipLast, settings, excludeIndices, recallTopK, recallThreshold, pureMode);
        console.log(`[Horae Vector] 向量混合搜索: ${hybridResults.length} 条命中`);
        for (const r of hybridResults) {
            if (!merged.has(r.messageIndex)) {
                merged.set(r.messageIndex, r);
            }
        }

        // 相关角色 = 用户消息提及 + 当前在场；只用于 RRF 加分，不改 cosine
        const relevantChars = new Set(state.scene?.characters_present || []);
        const allKnownChars = new Set();
        for (let i = 0; i < chat.length; i++) {
            const m = chat[i].horae_meta;
            if (!m || m._skipHorae) continue;
            (m.scene?.characters_present || []).forEach(c => allKnownChars.add(c));
            if (m.npcs) Object.keys(m.npcs).forEach(c => allKnownChars.add(c));
        }
        for (const c of allKnownChars) {
            if (userQuery && userQuery.includes(c)) relevantChars.add(c);
        }

        let results = Array.from(merged.values())
            .filter(r => !chat[r.messageIndex]?.horae_meta?._skipHorae);

        // RRF 融合：结构化、向量、角色相关三路独立排名，score = Σ 1/(K+rank)
        const RRF_K = 60;
        const fusionScore = new Map();
        const addRanker = (list, weight = 1) => {
            list.forEach((r, idx) => {
                const cur = fusionScore.get(r.messageIndex) || 0;
                fusionScore.set(r.messageIndex, cur + weight / (RRF_K + idx));
            });
        };
        addRanker(structuredResults, 1.0);
        addRanker(hybridResults, 1.0);
        if (relevantChars.size > 0) {
            for (const r of results) {
                const meta = chat[r.messageIndex]?.horae_meta;
                if (!meta || meta._skipHorae) continue;
                const docChars = new Set([
                    ...(meta.scene?.characters_present || []),
                    ...Object.keys(meta.npcs || {}),
                ]);
                let hasRelevant = false;
                for (const c of relevantChars) {
                    if (docChars.has(c)) { hasRelevant = true; break; }
                }
                if (hasRelevant) {
                    const cur = fusionScore.get(r.messageIndex) || 0;
                    fusionScore.set(r.messageIndex, cur + 1 / (RRF_K + 0));
                    r.source = (r.source || '') + '+char';
                }
            }
            console.log(`[Horae Vector] 角色相关性 RRF bonus: 相关角色=[${[...relevantChars].join(',')}]`);
        }

        for (const r of results) r._fusionScore = fusionScore.get(r.messageIndex) || 0;
        results.sort((a, b) => (b._fusionScore - a._fusionScore) || (b.similarity - a.similarity));

        // Rerank：对候选结果做二次精排
        let rerankDebug = null;
        if (useRerank && results.length > 1) {
            const rerankCandidates = results.slice(0, recallTopK);
            const rerankQuery = mergedRecallQuery || userQuery || this.buildStateQuery(state, null);
            if (rerankQuery) {
                try {
                    const useFullText = !!settings.vectorRerankFullText;
                    const _stripTags = settings.vectorStripTags || '';
                    const currentDateForRerank = state.timestamp?.story_date;
                    // Rerank 文档 = 时间头 + 结构化 metadata + 可选全文片段（≤1200 字）
                    const rerankDocs = rerankCandidates.map(r => {
                        const meta = chat[r.messageIndex]?.horae_meta;
                        const timeTag = this._buildTimeTag(meta?.timestamp, currentDateForRerank);
                        const head = timeTag ? `${timeTag}\n` : '';
                        const baseDoc = r.document || '';
                        if (useFullText) {
                            const fullText = this._extractCleanText(chat[r.messageIndex]?.mes, _stripTags);
                            const snippet = fullText ? fullText.substring(0, 1200) : '';
                            if (snippet) return `${head}${baseDoc}\n---\n${snippet}`;
                            return `${head}${baseDoc}`;
                        }
                        return `${head}${baseDoc}`;
                    });
                    console.log(`[Horae Vector] Rerank 输入: ${rerankCandidates.length} 条候选 / 模式=${useFullText ? '全文精排' : '摘要排序'}`);

                    const reranked = await this._rerank(
                        rerankQuery,
                        rerankDocs,
                        rerankCandidates.length,
                        settings
                    );
                    if (reranked && reranked.length > 0) {
                        const minScore = this._effectiveRerankMinScore(settings);
                        const passed = reranked.filter(rr => (rr.relevance_score ?? 0) >= minScore);
                        const dropped = reranked.length - passed.length;
                        console.log(`[Horae Vector] Rerank 完成: ${reranked.length} 条 → 阈值=${minScore.toFixed(2)} 通过=${passed.length} 丢弃=${dropped}`);
                        // 全部被阈值砍光、但最高分仍 ≥ 0.35 时保留 Top1，避免完全静默
                        let finalReranked = passed;
                        if (passed.length === 0 && reranked[0] && (reranked[0].relevance_score ?? 0) >= 0.35) {
                            finalReranked = [reranked[0]];
                            console.log(`[Horae Vector] Rerank 全部被阈值过滤，但最高分=${reranked[0].relevance_score?.toFixed(3)} 仍过保底线，保留 Top1`);
                        }
                        results = finalReranked.map(rr => {
                            const original = rerankCandidates[rr.index];
                            return {
                                ...original,
                                similarity: rr.relevance_score,
                                source: (original.source || '') + (useFullText ? '+rerank-full' : '+rerank'),
                            };
                        });
                        rerankDebug = {
                            enabled: true,
                            minScore,
                            useFullText,
                            candidates: rerankCandidates.map((r, i) => ({
                                messageIndex: r.messageIndex,
                                docPreview: (rerankDocs[i] || '').substring(0, 120),
                                priorScore: r.similarity,
                                source: r.source,
                            })),
                            output: reranked.map(rr => ({
                                index: rr.index,
                                messageIndex: rerankCandidates[rr.index]?.messageIndex,
                                relevance: rr.relevance_score,
                                passed: (rr.relevance_score ?? 0) >= minScore,
                            })),
                            passedCount: passed.length,
                            droppedCount: dropped,
                            retainedTop1: passed.length === 0 && finalReranked.length > 0,
                        };
                    }
                } catch (err) {
                    console.warn('[Horae Vector] Rerank 失败，使用原始排序:', err.message);
                    rerankDebug = { enabled: true, error: err.message };
                }
            }
        }

        results = results.slice(0, topK);
        // Fallback 机制已移除：主查询已统一为“当前情境 + 玩家输入”

        console.log(`[Horae Vector] === 最终合并: ${results.length} 条 ===`);
        for (const r of results) {
            console.log(`  #${r.messageIndex} sim=${r.similarity.toFixed(3)} [${r.source}]`);
        }

        const currentDate = state.timestamp?.story_date;
        const fullTextCount = Math.min(settings.vectorFullTextCount ?? 3, topK);
        const fullTextThreshold = settings.vectorFullTextThreshold ?? 0.9;
        const recallText = results.length === 0
            ? ''
            : this._buildRecallText(results, currentDate, chat, fullTextCount, fullTextThreshold, settings.vectorStripTags || '');
        if (recallText) console.log(`[Horae Vector] 召回文本 (${recallText.length}字):\n${recallText}`);

        this._lastDebugInfo = {
            timestamp: Date.now(),
            chatId: this.chatId,
            indexedCount: this.vectors.size,
            query: {
                user: userQuery,
                state: stateQueryForRecall,
                merged: mergedRecallQuery,
            },
            settings: {
                topK,
                threshold,
                effectiveThreshold: recallThreshold,
                useRerank,
                pureMode,
                rerankCandidates: recallTopK,
                rerankRecallThreshold: useRerank ? recallThreshold : null,
                rerankMinScore: useRerank ? this._effectiveRerankMinScore(settings) : null,
            },
            structured: structuredResults.map(r => ({
                messageIndex: r.messageIndex,
                similarity: r.similarity,
                source: r.source,
                docPreview: (r.document || '').substring(0, 120),
            })),
            embedding: hybridResults.map(r => ({
                messageIndex: r.messageIndex,
                similarity: r.similarity,
                source: r.source,
                docPreview: (r.document || '').substring(0, 120),
            })),
            relevantChars: [...relevantChars],
            rerank: rerankDebug,
            final: results.map(r => ({
                messageIndex: r.messageIndex,
                similarity: r.similarity,
                source: r.source,
            })),
            recallText,
        };

        return recallText;
    }

    // 索引规模越大，噪声越多；非 rerank 路径下随之略提阈值，最多 +0.05
    _dynamicThreshold(baseThreshold) {
        const N = this.totalDocuments;
        if (N <= 50) return baseThreshold;
        const bump = Math.min(0.05, Math.log10(N / 50) * 0.04);
        const effective = Math.min(0.95, baseThreshold + bump);
        if (bump > 0.005) console.log(`[Horae Vector] 动态阈值: ${baseThreshold} → ${effective.toFixed(3)} (已索引 ${N} 条)`);
        return effective;
    }

    _effectiveRerankMinScore(settings) {
        const v = parseFloat(settings?.vectorRerankMinScore);
        return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
    }

    getLastDebugInfo() {
        return this._lastDebugInfo || null;
    }

    // ========================================
    // 关键词表（按 AI 输出语言加载）
    // ========================================

    _refreshKeywordTable(settings) {
        let activeLang = 'en';
        try { activeLang = detectEffectiveAiLang(settings); } catch { /* ignore */ }
        const primary = tNodeForLang(activeLang, 'vectorKeywords') || {};
        // 中文词库始终作兜底，兼容繁简混排
        const fallback = tNodeForLang('zh-CN', 'vectorKeywords') || {};
        this._keywordTable = this._mergeKeywordTable(primary, fallback);
        this._activeKeywordLang = activeLang;
    }

    _getKeywordTable() {
        return this._keywordTable || EMPTY_KEYWORD_TABLE;
    }

    _mergeKeywordTable(a, b) {
        const mergeArr = (x = [], y = []) => {
            const out = [];
            const seen = new Set();
            for (const v of [...(x || []), ...(y || [])]) {
                if (typeof v !== 'string' || !v) continue;
                if (seen.has(v)) continue;
                seen.add(v);
                out.push(v);
            }
            return out;
        };
        const mergeMap = (x = {}, y = {}) => {
            const out = {};
            const keys = new Set([...Object.keys(x || {}), ...Object.keys(y || {})]);
            for (const k of keys) out[k] = mergeArr(x?.[k], y?.[k]);
            return out;
        };
        return {
            intent: mergeMap(a.intent, b.intent),
            patterns: mergeMap(a.patterns, b.patterns),
            categories: mergeMap(a.categories, b.categories),
            moodWords: mergeArr(a.moodWords, b.moodWords),
            giftKws: mergeArr(a.giftKws, b.giftKws),
            costumeFiller: mergeArr(a.costumeFiller, b.costumeFiller),
            eventLevels: mergeMap(a.eventLevels, b.eventLevels),
        };
    }

    _anyTermIncluded(text, terms) {
        if (!text || !Array.isArray(terms)) return false;
        for (const term of terms) {
            if (typeof term === 'string' && term && text.includes(term)) return true;
        }
        return false;
    }

    _getRecallLabels() {
        const lang = this._activeKeywordLang || 'en';
        const labels = tNodeForLang(lang, 'vectorRecall');
        const fb = tNodeForLang('en', 'vectorRecall') || {};
        const pick = (k, def) => {
            const v = labels?.[k];
            if (typeof v === 'string' && v) return v;
            const fv = fb[k];
            return (typeof fv === 'string' && fv) ? fv : def;
        };
        return {
            header: pick('header', '[Memory Recall — historical fragments related to the current scene, for reference only, not part of the current context]'),
            fullText: pick('fullText', '[Full text recall]'),
            scene: pick('scene', 'Scene'),
            npc: pick('npc', 'NPC'),
        };
    }

    // ========================================
    // 结构化查询（精准，不需要向量）
    // ========================================

    /**
     * 从用户消息解析意图，直接查询 horae_meta 结构化数据
     */
    _structuredQuery(userQuery, chat, state, excludeIndices, topK, pureMode = false) {
        if (!userQuery || chat.length === 0) return [];

        const table = this._getKeywordTable();

        const knownChars = new Set();
        for (let i = 0; i < chat.length; i++) {
            const m = chat[i].horae_meta;
            if (!m || m._skipHorae) continue;
            (m.scene?.characters_present || []).forEach(c => knownChars.add(c));
            if (m.npcs) Object.keys(m.npcs).forEach(c => knownChars.add(c));
        }

        const mentionedChars = [];
        for (const c of knownChars) {
            if (userQuery.includes(c)) mentionedChars.push(c);
        }

        const isFirst = this._anyTermIncluded(userQuery, table.intent?.first);
        const isLast = this._anyTermIncluded(userQuery, table.intent?.last);

        const hasCostumeKw = this._anyTermIncluded(userQuery, table.patterns?.costume);
        const hasMoodKw = this._anyTermIncluded(userQuery, table.patterns?.mood);
        const hasGiftKw = this._anyTermIncluded(userQuery, table.patterns?.gift);
        const hasImportantItemKw = this._anyTermIncluded(userQuery, table.patterns?.importantItem);
        const hasImportantEventKw = this._anyTermIncluded(userQuery, table.patterns?.importantEvent);
        const hasCeremonyKw = this._anyTermIncluded(userQuery, table.patterns?.ceremony);
        const hasPromiseKw = this._anyTermIncluded(userQuery, table.patterns?.promise);
        const hasLossKw = this._anyTermIncluded(userQuery, table.patterns?.loss);
        const hasRevelationKw = this._anyTermIncluded(userQuery, table.patterns?.revelation);
        const hasPowerKw = this._anyTermIncluded(userQuery, table.patterns?.power);

        const results = [];

        if (isFirst && mentionedChars.length > 0) {
            for (const charName of mentionedChars) {
                const idx = this._findFirstAppearance(chat, charName, excludeIndices);
                if (idx !== -1) {
                    results.push({ messageIndex: idx, similarity: 1.0, document: `[Structured] First appearance of ${charName}`, source: 'structured' });
                    console.log(`[Horae Vector] 结构化查询: "${charName}" 首次出现于 #${idx}`);
                }
            }
        }

        if (isLast && mentionedChars.length > 0 && hasCostumeKw) {
            const costumeKw = this._extractCostumeKeywords(userQuery, mentionedChars);
            if (costumeKw) {
                for (const charName of mentionedChars) {
                    const idx = this._findLastCostume(chat, charName, costumeKw, excludeIndices);
                    if (idx !== -1) {
                        results.push({ messageIndex: idx, similarity: 1.0, document: `[Structured] ${charName} wore ${costumeKw}`, source: 'structured' });
                        console.log(`[Horae Vector] 结构化查询: "${charName}" 上次穿 "${costumeKw}" 于 #${idx}`);
                    }
                }
            }
        }

        if (hasCostumeKw && !isFirst && !isLast && mentionedChars.length === 0) {
            const costumeKw = this._extractCostumeKeywords(userQuery, []);
            if (costumeKw) {
                const matches = this._findCostumeMatches(chat, costumeKw, excludeIndices, topK);
                for (const m of matches) {
                    results.push({ messageIndex: m.idx, similarity: 0.95, document: `[Structured] Costume match: ${costumeKw}`, source: 'structured' });
                }
            }
        }

        if (isLast && hasMoodKw) {
            const moodKw = this._extractMoodKeyword(userQuery);
            if (moodKw) {
                const targetChar = mentionedChars[0] || null;
                const idx = this._findLastMood(chat, targetChar, moodKw, excludeIndices);
                if (idx !== -1) {
                    results.push({ messageIndex: idx, similarity: 1.0, document: `[Structured] Mood match: ${moodKw}`, source: 'structured' });
                    console.log(`[Horae Vector] 结构化查询: 上次 "${moodKw}" 于 #${idx}`);
                }
            }
        }

        if (hasGiftKw) {
            const giftResults = this._findGiftItems(chat, mentionedChars, excludeIndices, topK);
            for (const r of giftResults) {
                results.push(r);
                console.log(`[Horae Vector] 结构化查询: gift #${r.messageIndex} [${r.document}]`);
            }
        }

        if (hasImportantItemKw) {
            const impResults = this._findImportantItems(chat, excludeIndices, topK);
            for (const r of impResults) {
                results.push(r);
                console.log(`[Horae Vector] 结构化查询: important item #${r.messageIndex} [${r.document}]`);
            }
        }

        if (hasImportantEventKw) {
            const evtResults = this._findImportantEvents(chat, excludeIndices, topK);
            for (const r of evtResults) {
                results.push(r);
                console.log(`[Horae Vector] 结构化查询: important event #${r.messageIndex} [${r.document}]`);
            }
        }

        // 纯向量模式下跳过关键词启发式（主题事件搜索、事件词组匹配），完全依赖向量语义
        if (!pureMode) {
            if (hasCeremonyKw || hasPromiseKw || hasLossKw || hasRevelationKw || hasPowerKw) {
                const thematicResults = this._findThematicEvents(chat, {
                    ceremony: hasCeremonyKw, promise: hasPromiseKw,
                    loss: hasLossKw, revelation: hasRevelationKw, power: hasPowerKw,
                }, excludeIndices, topK);
                for (const r of thematicResults) {
                    results.push(r);
                    console.log(`[Horae Vector] 结构化查询: thematic #${r.messageIndex} [${r.document}]`);
                }
            }

            const existingIds = new Set(results.map(r => r.messageIndex));
            const eventMatches = this._eventKeywordSearch(userQuery, chat, mentionedChars, existingIds, excludeIndices, topK);
            for (const m of eventMatches) {
                results.push(m);
            }
        }

        const withContext = this._expandContextWindow(results, chat, excludeIndices);
        return withContext.slice(0, topK);
    }

    /**
     * 上下文窗口扩展：对每个命中消息，把前后相邻的 AI 消息也加进来
     * RP 中相邻消息是连续事件，天然相关
     */
    _expandContextWindow(results, chat, excludeIndices) {
        const resultIds = new Set(results.map(r => r.messageIndex));
        const contextToAdd = [];

        for (const r of results) {
            const idx = r.messageIndex;

            for (let i = idx - 1; i >= Math.max(0, idx - 3); i--) {
                if (excludeIndices.has(i) || resultIds.has(i)) continue;
                const m = chat[i].horae_meta;
                if (!chat[i].is_user && this._hasOriginalEvents(m)) {
                    contextToAdd.push({
                        messageIndex: i,
                        similarity: r.similarity * 0.85,
                        document: `[Context] Pre-context of #${idx}`,
                        source: 'context',
                    });
                    resultIds.add(i);
                    break;
                }
            }

            for (let i = idx + 1; i <= Math.min(chat.length - 1, idx + 3); i++) {
                if (excludeIndices.has(i) || resultIds.has(i)) continue;
                const m = chat[i].horae_meta;
                if (!chat[i].is_user && this._hasOriginalEvents(m)) {
                    contextToAdd.push({
                        messageIndex: i,
                        similarity: r.similarity * 0.85,
                        document: `[Context] Post-context of #${idx}`,
                        source: 'context',
                    });
                    resultIds.add(i);
                    break;
                }
            }
        }

        if (contextToAdd.length > 0) {
            console.log(`[Horae Vector] 上下文扩展: +${contextToAdd.length} 条`);
            for (const c of contextToAdd) console.log(`  #${c.messageIndex} [${c.document}]`);
        }

        const all = [...results, ...contextToAdd];
        all.sort((a, b) => b.similarity - a.similarity);
        return all;
    }

    /**
     * 事件关键词搜索：从用户文本直接扫描已知类别词汇，扩展后搜索事件摘要
     */
    _eventKeywordSearch(userQuery, chat, mentionedChars, skipIds, excludeIndices, limit) {
        const detected = this._detectCategoryTerms(userQuery);
        if (detected.length === 0) return [];

        const expanded = this._expandByCategory(detected);
        console.log(`[Horae Vector] 事件搜索: 检测到=[${detected.join(',')}] 扩展后=[${expanded.join(',')}]`);

        const scored = [];
        for (let i = 0; i < chat.length; i++) {
            if (excludeIndices.has(i) || skipIds.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta || meta._skipHorae) continue;

            const searchText = this._buildSearchableText(meta);
            if (!searchText) continue;

            let matchCount = 0;
            const matched = [];
            for (const kw of expanded) {
                if (searchText.includes(kw)) {
                    matchCount++;
                    matched.push(kw);
                }
            }

            if (matchCount >= 2 || (matchCount >= 1 && mentionedChars.some(c => searchText.includes(c)))) {
                scored.push({
                    messageIndex: i,
                    similarity: 0.85 + matchCount * 0.02,
                    document: `[Event match] ${matched.join(',')}`,
                    source: 'structured',
                    _matchCount: matchCount,
                });
            }
        }

        scored.sort((a, b) => b._matchCount - a._matchCount || b.similarity - a.similarity);
        const top = scored.slice(0, limit);
        if (top.length > 0) {
            console.log(`[Horae Vector] 事件搜索命中 ${top.length} 条:`);
            for (const r of top) console.log(`  #${r.messageIndex} matches=${r._matchCount} [${r.document}]`);
        }
        return top;
    }

    _buildSearchableText(meta) {
        const parts = [];
        if (meta.events) {
            for (const evt of meta.events) {
                if (evt.isSummary || evt.level === '摘要' || evt._summaryId) continue;
                if (evt.summary) parts.push(evt.summary);
            }
        }
        if (meta.scene?.location) parts.push(meta.scene.location);
        if (meta.npcs) {
            for (const [name, info] of Object.entries(meta.npcs)) {
                parts.push(name);
                if (info.description) parts.push(info.description);
            }
        }
        if (meta.items) {
            for (const [name, info] of Object.entries(meta.items)) {
                parts.push(name);
                if (info.location) parts.push(info.location);
            }
        }
        return parts.join(' ');
    }

    /**
     * 直接从用户文本中扫描已知类别词汇（无需分词）
     */
    _detectCategoryTerms(text) {
        const normalized = t2s(text);
        const categories = this._getKeywordTable().categories || {};
        const found = [];
        for (const terms of Object.values(categories)) {
            if (!Array.isArray(terms)) continue;
            for (const term of terms) {
                if (typeof term !== 'string' || !term) continue;
                // 中文走 t2s 简体归一，其他语言原样匹配
                if (normalized.includes(term) || text.includes(term)) {
                    found.push(term);
                }
            }
        }
        return [...new Set(found)];
    }

    /**
     * 将检测到的词扩展到同类别的所有词
     */
    _expandByCategory(keywords) {
        const expanded = new Set(keywords);
        const categories = this._getKeywordTable().categories || {};
        for (const kw of keywords) {
            for (const terms of Object.values(categories)) {
                if (Array.isArray(terms) && terms.includes(kw)) {
                    for (const t of terms) expanded.add(t);
                }
            }
        }
        return [...expanded];
    }

    _findFirstAppearance(chat, charName, excludeIndices) {
        for (let i = 0; i < chat.length; i++) {
            if (excludeIndices.has(i)) continue;
            const m = chat[i].horae_meta;
            if (!m || m._skipHorae) continue;
            if (m.npcs && m.npcs[charName]) return i;
            if (m.scene?.characters_present?.includes(charName)) return i;
        }
        return -1;
    }

    _findLastCostume(chat, charName, costumeKw, excludeIndices) {
        for (let i = chat.length - 1; i >= 0; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta || meta._skipHorae) continue;
            const costume = meta.costumes?.[charName];
            if (costume && costume.includes(costumeKw)) return i;
        }
        return -1;
    }

    _findCostumeMatches(chat, costumeKw, excludeIndices, limit) {
        const matches = [];
        for (let i = chat.length - 1; i >= 0 && matches.length < limit; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta || meta._skipHorae) continue;
            const costumes = meta.costumes;
            if (!costumes) continue;
            for (const v of Object.values(costumes)) {
                if (v && v.includes(costumeKw)) { matches.push({ idx: i }); break; }
            }
        }
        return matches;
    }

    _findLastMood(chat, charName, moodKw, excludeIndices) {
        for (let i = chat.length - 1; i >= 0; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta || meta._skipHorae) continue;
            const mood = meta.mood;
            if (!mood) continue;
            if (charName) {
                if (mood[charName] && mood[charName].includes(moodKw)) return i;
            } else {
                for (const v of Object.values(mood)) {
                    if (v && v.includes(moodKw)) return i;
                }
            }
        }
        return -1;
    }

    _extractCostumeKeywords(query, chars) {
        let cleaned = query;
        for (const c of chars) cleaned = cleaned.replace(c, '');
        const fillers = this._getKeywordTable().costumeFiller || [];
        // 长词优先剥离，防止短词先匹配截断长词
        const sortedFillers = [...fillers].sort((a, b) => b.length - a.length);
        for (const f of sortedFillers) {
            if (!f) continue;
            cleaned = cleaned.split(f).join('');
        }
        cleaned = cleaned.trim();
        return cleaned.length >= 2 ? cleaned : '';
    }

    _extractMoodKeyword(query) {
        const moodWords = this._getKeywordTable().moodWords || [];
        for (const w of moodWords) {
            if (typeof w === 'string' && w && query.includes(w)) return w;
        }
        return '';
    }

    /**
     * 查找与礼物/赠品相关的消息
     * 通过 item.holder 变化或事件文本中的赠送关键词定位
     */
    _findGiftItems(chat, mentionedChars, excludeIndices, limit) {
        const giftKws = this._getKeywordTable().giftKws || [];
        const results = [];
        const seen = new Set();

        for (let i = chat.length - 1; i >= 0 && results.length < limit; i--) {
            if (excludeIndices.has(i) || seen.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta || meta._skipHorae) continue;

            let matched = false;
            const matchedItems = [];

            if (meta.items) {
                for (const [name, info] of Object.entries(meta.items)) {
                    const imp = info.importance || '';
                    const holder = info.holder || '';
                    const holderMatchesChar = mentionedChars.length === 0 || mentionedChars.some(c => holder.includes(c));

                    if ((imp === '!' || imp === '!!') && holderMatchesChar) {
                        matched = true;
                        matchedItems.push(`${imp === '!!' ? 'key' : 'important'}:${name}`);
                    }
                }
            }

            if (!matched && meta.events) {
                for (const evt of meta.events) {
                    if (evt.isSummary || evt.level === '摘要' || evt._summaryId) continue;
                    const text = evt.summary || '';
                    if (giftKws.some(kw => text.includes(kw))) {
                        if (mentionedChars.length === 0 || mentionedChars.some(c => text.includes(c))) {
                            matched = true;
                            matchedItems.push(text.substring(0, 20));
                        }
                    }
                }
            }

            if (matched) {
                seen.add(i);
                results.push({
                    messageIndex: i,
                    similarity: 0.95,
                    document: `[Structured] Gift/keepsake: ${matchedItems.join('; ')}`,
                    source: 'structured',
                });
            }
        }
        return results;
    }

    /**
     * 查找包含重要/关键物品的消息（importance '!' 或 '!!'）
     */
    _findImportantItems(chat, excludeIndices, limit) {
        const results = [];
        for (let i = chat.length - 1; i >= 0 && results.length < limit; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta || meta._skipHorae || !meta.items) continue;

            const importantNames = [];
            for (const [name, info] of Object.entries(meta.items)) {
                if (info.importance === '!' || info.importance === '!!') {
                    importantNames.push(`${info.importance === '!!' ? '★' : '☆'}${info.icon || ''}${name}`);
                }
            }
            if (importantNames.length > 0) {
                results.push({
                    messageIndex: i,
                    similarity: 0.95,
                    document: `[Structured] Important item: ${importantNames.join(', ')}`,
                    source: 'structured',
                });
            }
        }
        return results;
    }

    /**
     * 查找重要/关键级别的事件
     */
    _findImportantEvents(chat, excludeIndices, limit) {
        const levels = this._getKeywordTable().eventLevels || {};
        const importantLevels = new Set(levels.important || []);
        const keyLevels = new Set(levels.key || []);
        const results = [];
        for (let i = chat.length - 1; i >= 0 && results.length < limit; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta || meta._skipHorae || !meta.events) continue;

            for (const evt of meta.events) {
                if (evt.isSummary || evt.level === '摘要' || evt._summaryId) continue;
                const isKey = keyLevels.has(evt.level);
                const isImp = importantLevels.has(evt.level);
                if (isKey || isImp) {
                    results.push({
                        messageIndex: i,
                        similarity: isKey ? 1.0 : 0.95,
                        document: `[Structured] ${evt.level} event: ${(evt.summary || '').substring(0, 30)}`,
                        source: 'structured',
                    });
                    break;
                }
            }
        }
        return results;
    }

    /**
     * 主题事件搜索：仪式 / 承诺 / 失去 / 揭露 / 能力变化
     * 用当前语言的关键词表做事件文本精准匹配
     */
    _findThematicEvents(chat, flags, excludeIndices, limit) {
        const activeCategories = [];
        if (flags.ceremony) activeCategories.push('ceremony');
        if (flags.promise) activeCategories.push('promise');
        if (flags.loss) activeCategories.push('loss');
        if (flags.revelation) activeCategories.push('revelation');
        if (flags.power) activeCategories.push('power');

        const categories = this._getKeywordTable().categories || {};
        const searchTerms = new Set();
        for (const cat of activeCategories) {
            const terms = categories[cat];
            if (Array.isArray(terms)) for (const t of terms) searchTerms.add(t);
        }
        if (searchTerms.size === 0) return [];

        const results = [];
        for (let i = chat.length - 1; i >= 0 && results.length < limit; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta || meta._skipHorae || !meta.events) continue;

            for (const evt of meta.events) {
                if (evt.isSummary || evt.level === '摘要' || evt._summaryId) continue;
                const raw = evt.summary || '';
                const normalized = t2s(raw);
                const hits = [...searchTerms].filter(t => normalized.includes(t) || raw.includes(t));
                if (hits.length > 0) {
                    results.push({
                        messageIndex: i,
                        similarity: 0.90 + Math.min(hits.length, 5) * 0.02,
                        document: `[Structured] Thematic(${activeCategories.join('+')}): ${hits.join(',')}`,
                        source: 'structured',
                    });
                    break;
                }
            }
        }
        return results;
    }

    // ========================================
    // 向量+关键词混合搜索（兜底）
    // ========================================

    async _hybridSearch(userQuery, state, horaeManager, skipLast, settings, excludeIndices, topK, threshold, pureMode = false) {
        if (!this.isReady || this.vectors.size === 0) return [];

        // 跳过 user 消息，取最近一条 AI 消息的完整 meta（含 events）
        const chat = horaeManager.getChat();
        let lastMeta = null;
        for (let i = chat.length - 1 - skipLast; i >= 0; i--) {
            if (!chat[i].is_user && chat[i].horae_meta && !chat[i].horae_meta._skipHorae) {
                lastMeta = chat[i].horae_meta;
                break;
            }
        }

        const stateQuery = this.buildStateQuery(state, lastMeta);
        const mergedQuery = this.buildMergedRecallQuery(stateQuery, userQuery);
        if (!mergedQuery) return [];

        // 严格使用用户设置阈值
        const mergedThreshold = threshold;

        let results = await this.search(mergedQuery, topK * 2, mergedThreshold, excludeIndices, pureMode);
        results = results.map(r => ({ ...r, source: 'merged' }));
        console.log(`[Horae Vector] 合并查询搜索: ${results.length} 条 | threshold=${mergedThreshold.toFixed(2)}`);

        results.sort((a, b) => b.similarity - a.similarity);
        results = this._deduplicateResults(results).slice(0, topK);

        console.log(`[Horae Vector] 混合搜索结果: ${results.length} 条`);
        for (const r of results) {
            console.log(`  #${r.messageIndex} sim=${r.similarity.toFixed(4)} [${r.source}] | ${r.document.substring(0, 80)}`);
        }

        return results;
    }

    _buildRecallText(results, currentDate, chat, fullTextCount = 3, fullTextThreshold = 0.9, stripTags = '') {
        const labels = this._getRecallLabels();
        const lines = [labels.header];
        const eventLevels = this._getKeywordTable().eventLevels || {};
        const importantLevels = new Set(eventLevels.important || []);
        const keyLevels = new Set(eventLevels.key || []);

        for (let rank = 0; rank < results.length; rank++) {
            const r = results[rank];
            const meta = chat[r.messageIndex]?.horae_meta;
            if (!meta || meta._skipHorae) continue;

            const isFullText = fullTextCount > 0 && rank < fullTextCount && r.similarity >= fullTextThreshold;

            if (isFullText) {
                const rawText = this._extractCleanText(chat[r.messageIndex]?.mes, stripTags);
                if (rawText) {
                    const timeTag = this._buildTimeTag(meta?.timestamp, currentDate);
                    lines.push(`#${r.messageIndex} ${timeTag ? timeTag + ' ' : ''}${labels.fullText}\n${rawText}`);
                    continue;
                }
            }

            const parts = [];

            const timeTag = this._buildTimeTag(meta?.timestamp, currentDate);
            if (timeTag) parts.push(timeTag);

            if (meta?.scene?.location) parts.push(`${labels.scene}:${meta.scene.location}`);

            const chars = meta?.scene?.characters_present || [];
            const costumes = meta?.costumes || {};
            for (const c of chars) {
                parts.push(costumes[c] ? `${c}(${costumes[c]})` : c);
            }

            if (meta?.events?.length > 0) {
                for (const evt of meta.events) {
                    if (evt.isSummary || evt.level === '摘要') continue;
                    const mark = keyLevels.has(evt.level) ? '★' : importantLevels.has(evt.level) ? '●' : '○';
                    if (evt.summary) parts.push(`${mark}${evt.summary}`);
                }
            }

            if (meta?.npcs) {
                for (const [name, info] of Object.entries(meta.npcs)) {
                    let s = `${labels.npc}:${name}`;
                    if (info.relationship) s += `(${info.relationship})`;
                    parts.push(s);
                }
            }

            if (meta?.items && Object.keys(meta.items).length > 0) {
                for (const [name, info] of Object.entries(meta.items)) {
                    let s = `${info.icon || ''}${name}`;
                    if (info.holder) s += `=${info.holder}`;
                    parts.push(s);
                }
            }

            if (parts.length > 0) {
                lines.push(`#${r.messageIndex} ${parts.join(' | ')}`);
            }
        }

        return lines.length > 1 ? lines.join('\n') : '';
    }

    _extractCleanText(mes, stripTags) {
        if (!mes) return '';
        let text = mes
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '');
        if (stripTags) {
            const tags = stripTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
            for (const tag of tags) {
                const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                text = text.replace(new RegExp(`<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?</${escaped}>`, 'gi'), '');
            }
        }
        return text.replace(/<[^>]*>/g, '').trim();
    }

    /**
     * 构建时间标签：(相对时间 绝对日期 时间)
     * 例：(前天 霜降月第一日 19:10) 或 (今天 07:55)
     */
    _buildTimeTag(timestamp, currentDate) {
        if (!timestamp) return '';

        const storyDate = timestamp.story_date;
        const storyTime = timestamp.story_time;
        const parts = [];

        if (storyDate && currentDate) {
            const relDesc = this._getRelativeTimeDesc(storyDate, currentDate);
            if (relDesc) {
                parts.push(relDesc.replace(/[()]/g, ''));
            }
        }

        if (storyDate) parts.push(storyDate);
        if (storyTime) parts.push(storyTime);

        if (parts.length === 0) return '';

        const combined = parts.join(' ');
        return `(${combined})`;
    }

    _getRelativeTimeDesc(eventDate, currentDate) {
        if (!eventDate || !currentDate) return '';
        const result = calculateDetailedRelativeTime(eventDate, currentDate);
        if (result.days === null || result.days === undefined) return '';

        const { days, fromDate, toDate } = result;
        if (days === 0) return '(今天)';
        if (days === 1) return '(昨天)';
        if (days === 2) return '(前天)';
        if (days === 3) return '(大前天)';
        if (days >= 4 && days <= 13 && fromDate) {
            const WD = ['日', '一', '二', '三', '四', '五', '六'];
            return `(上周${WD[fromDate.getDay()]})`;
        }
        if (days >= 20 && days < 60 && fromDate && toDate && fromDate.getMonth() !== toDate.getMonth()) {
            return `(上个月${fromDate.getDate()}号)`;
        }
        if (days >= 300 && fromDate && toDate && fromDate.getFullYear() < toDate.getFullYear()) {
            return `(去年${fromDate.getMonth() + 1}月)`;
        }
        if (days > 0 && days < 30) return `(${days}天前)`;
        if (days > 0) return `(${Math.round(days / 30)}个月前)`;
        return '';
    }

    // ========================================
    // Worker 通信
    // ========================================

    _embed(texts) {
        if (this.isApiMode) return this._embedApi(texts);
        if (!this.worker) return Promise.resolve(null);
        const id = ++this._callId;
        return new Promise((resolve, reject) => {
            this._pendingCallbacks.set(id, { resolve, reject });
            this.worker.postMessage({ type: 'embed', id, data: { texts } });
            setTimeout(() => {
                if (this._pendingCallbacks.has(id)) {
                    this._pendingCallbacks.delete(id);
                    reject(new Error('Embedding 超时'));
                }
            }, 30000);
        });
    }

    _isGeminiEmbeddingEndpoint() {
        return /gemini|googleapis|generativelanguage|v1beta/i.test(`${this._apiUrl || ''} ${this._apiModel || ''}`);
    }

    _isGoogleGenerativeLanguageUrl(rawUrl) {
        return /googleapis\.com|generativelanguage/i.test(rawUrl || '');
    }

    _geminiEmbeddingBase() {
        return String(this._apiUrl || '')
            .replace(/\/+$/, '')
            .replace(/\/chat\/completions$/i, '')
            .replace(/\/embeddings$/i, '')
            .replace(/\/v\d+(beta\d*|alpha\d*)?(?:\/.*)?$/i, '');
    }

    _buildApiEmbeddingRequest(texts) {
        if (!this._isGeminiEmbeddingEndpoint()) {
            const base = String(this._apiUrl || '').replace(/\/+$/, '').replace(/\/embeddings$/i, '');
            return {
                endpoint: `${base}/embeddings`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._apiKey}`,
                },
                body: JSON.stringify({
                    model: this._apiModel,
                    input: texts,
                }),
                parseVectors: json => {
                    if (!json.data || !Array.isArray(json.data)) {
                        const wrapped = new Error('API 返回格式异常：缺少 data 数组');
                        wrapped.code = 'FORMAT';
                        throw wrapped;
                    }
                    return json.data
                        .sort((a, b) => a.index - b.index)
                        .map(d => d.embedding);
                },
            };
        }

        const base = this._geminiEmbeddingBase();
        const modelName = String(this._apiModel || '').startsWith('models/') ? String(this._apiModel) : `models/${this._apiModel}`;
        const isGoogle = this._isGoogleGenerativeLanguageUrl(base);
        const endpoint = `${base}/v1beta/${modelName}:batchEmbedContents${isGoogle ? `?key=${encodeURIComponent(this._apiKey)}` : ''}`;
        const headers = { 'Content-Type': 'application/json' };
        if (!isGoogle) headers.Authorization = `Bearer ${this._apiKey}`;

        return {
            endpoint,
            headers,
            body: JSON.stringify({
                requests: texts.map(text => ({
                    model: modelName,
                    content: { parts: [{ text }] },
                })),
            }),
            parseVectors: json => {
                if (!json.embeddings || !Array.isArray(json.embeddings)) {
                    const wrapped = new Error('Gemini API 返回格式异常：缺少 embeddings 数组');
                    wrapped.code = 'FORMAT';
                    throw wrapped;
                }
                return json.embeddings.map(e => e.values);
            },
        };
    }

    async _embedApi(texts) {
        const req = this._buildApiEmbeddingRequest(texts);
        let resp;
        try {
            resp = await fetch(req.endpoint, {
                method: 'POST',
                headers: req.headers,
                body: req.body,
            });
        } catch (err) {
            console.error('[Horae Vector] API embedding 网络异常:', err);
            const wrapped = new Error(err?.message || 'Network error');
            // TypeError 通常是 CORS、DNS 解析失败、连接被拒绝等浏览器层 fetch 失败
            if (err instanceof TypeError) {
                wrapped.code = 'NETWORK';
            } else if (/timeout|timed out/i.test(err?.message || '')) {
                wrapped.code = 'TIMEOUT';
            } else if (/socket hang up|ECONNRESET|ECONNREFUSED/i.test(err?.message || '')) {
                wrapped.code = 'NETWORK';
            } else {
                wrapped.code = 'UNKNOWN';
            }
            wrapped.cause = err;
            throw wrapped;
        }

        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            const wrapped = new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
            wrapped.status = resp.status;
            wrapped.body = errText.slice(0, 500);
            console.error('[Horae Vector] API embedding HTTP 错误:', wrapped);
            throw wrapped;
        }

        try {
            const json = await resp.json();
            const vectors = req.parseVectors(json);
            if (!Array.isArray(vectors) || vectors.some(v => !Array.isArray(v))) {
                const wrapped = new Error('API 返回格式异常：向量数据无效');
                wrapped.code = 'FORMAT';
                throw wrapped;
            }
            return { vectors };
        } catch (err) {
            if (err.code === 'FORMAT') throw err;
            const wrapped = new Error(err?.message || 'Invalid JSON response');
            wrapped.code = 'FORMAT';
            console.error('[Horae Vector] API embedding 响应解析失败:', err);
            throw wrapped;
        }
    }

    /**
     * Rerank API 调用（Cohere/Jina/Qwen 兼容格式）
     * @returns {Array<{index: number, relevance_score: number}>}
     */
    async _rerank(query, documents, topN, settings) {
        const baseUrl = (settings.vectorRerankUrl || settings.vectorApiUrl || '').replace(/\/+$/, '');
        const apiKey = settings.vectorRerankKey || settings.vectorApiKey || '';
        const model = settings.vectorRerankModel || '';

        if (!baseUrl || !model) throw new Error('Rerank API 地址或模型未配置');

        const endpoint = `${baseUrl}/rerank`;
        console.log(`[Horae Vector] Rerank 请求: ${documents.length} 条候选 → ${endpoint}`);

        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                query,
                documents,
                top_n: topN,
            }),
        });

        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            throw new Error(`Rerank API ${resp.status}: ${errText.slice(0, 200)}`);
        }

        const json = await resp.json();
        const results = json.results || json.data;
        if (!Array.isArray(results)) {
            throw new Error('Rerank API 返回格式异常：缺少 results 数组');
        }

        return results.map(r => ({
            index: r.index,
            relevance_score: r.relevance_score ?? r.score ?? 0,
        })).sort((a, b) => b.relevance_score - a.relevance_score);
    }

    // ========================================
    // IndexedDB
    // ========================================

    async _openDB() {
        if (this.db) {
            try {
                this.db.transaction(STORE_NAME, 'readonly');
                return;
            } catch (_) {
                console.warn('[Horae Vector] DB connection stale, reconnecting...');
                try { this.db.close(); } catch (__) {}
                this.db = null;
            }
        }
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    store.createIndex('chatId', 'chatId', { unique: false });
                }
            };
            req.onblocked = () => {
                console.warn('[Horae Vector] DB upgrade blocked by another tab, closing old connection');
            };
            req.onsuccess = () => {
                this.db = req.result;
                this.db.onversionchange = () => {
                    this.db.close();
                    this.db = null;
                    console.log('[Horae Vector] DB closed due to version change in another tab');
                };
                this.db.onclose = () => { this.db = null; };
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    }

    async _saveVector(messageIndex, data) {
        await this._openDB();
        const key = `${this.chatId}_${messageIndex}`;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put({
                key,
                chatId: this.chatId,
                messageIndex,
                vector: data.vector,
                hash: data.hash,
                document: data.document,
            });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }

    async _loadAllVectors() {
        await this._openDB();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const index = tx.objectStore(STORE_NAME).index('chatId');
            const req = index.getAll(this.chatId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    async _deleteVector(messageIndex) {
        await this._openDB();
        const key = `${this.chatId}_${messageIndex}`;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(key);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }

    async _clearVectors() {
        await this._openDB();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('chatId');
            const req = index.openCursor(this.chatId);
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }

    // ========================================
    // 工具函数
    // ========================================

    _hasOriginalEvents(meta) {
        if (meta?._skipHorae) return false;
        if (!meta?.events?.length) return false;
        return meta.events.some(e => !e.isSummary && e.level !== '摘要' && !e._summaryId);
    }

    _dotProduct(a, b) {
        if (!a || !b || a.length !== b.length) return 0;
        let sum = 0;
        for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
        return sum;
    }

    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString(36);
    }

    _extractKeyTerms(document) {
        // 排除结构化前缀，否则会以高频污染 IDF
        const STRUCT_TAGS = VectorManager._STRUCT_TAGS_SET;
        return document
            .split(/[\s|,，。！？：；、()\[\]（）\n]+/)
            .filter(t => t.length >= 2 && t.length <= 20 && !STRUCT_TAGS.has(t));
    }

    _updateTermCounts(document, delta) {
        const terms = this._extractKeyTerms(document);
        const unique = new Set(terms);
        for (const term of unique) {
            const prev = this.termCounts.get(term) || 0;
            const next = prev + delta;
            if (next <= 0) this.termCounts.delete(term);
            else this.termCounts.set(term, next);
        }
    }

    _prepareText(text, isQuery) {
        const cfg = MODEL_CONFIG[this.modelName];
        if (cfg?.prefix) {
            return isQuery ? `${cfg.prefix.query}${text}` : `${cfg.prefix.passage}${text}`;
        }
        return text;
    }
}

export const vectorManager = new VectorManager();
