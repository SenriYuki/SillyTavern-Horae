/**
 * Horae - 向量记忆管理器
 * 基于 Transformers.js 的本地向量检索系统
 *
 * 数据按 chatId 隔离，向量存 IndexedDB，轻量索引存 chat[0].horae_meta.vectorIndex
 */

import { calculateDetailedRelativeTime, getRelativeTimeMeta } from '../utils/timeUtils.js';
import { t2s } from '../utils/zhConvert.js';
import { tNodeForLang, detectEffectiveAiLang } from './i18n.js';
import { getPromptDefaultSync } from './promptDefaults.js';

const DB_NAME = 'HoraeVectors';
const DB_VERSION = 2;
const STORE_NAME = 'vectors';
const SNAPSHOT_STORE = 'memorySnapshots';
const RECALL_CACHE_LIMIT = 16;
const SNAPSHOT_FORMAT = 'horae-memory-snapshot';
const SNAPSHOT_VERSION = '1.0';

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

// 番外/小剧场 (_skipHorae) 与 carryover 种子楼层 (_carryoverSeed) 共用排除规则：
// 不进向量索引、不参与结构化命中、不出现在召回结果里
function isMetaExcluded(meta) {
    return !meta || meta._skipHorae || meta._carryoverSeed;
}

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
        this._debugLog = false;
        // 召回结果 LRU 缓存：相同查询条件下避免重复 embedding/rerank 调用
        this._recallCache = new Map();
        this._recallCacheLimit = RECALL_CACHE_LIMIT;
        // 当前 chat 挂载的历史记忆快照：[{ id, label, modelName, dimensions, items: [{vector, document, mes, meta, originalIndex, ...}] }]
        this.snapshots = [];
    }

    /**
     * 详细调试日志（默认关闭）
     * 由 recall() 入口从 settings.vectorDebugLog 同步刷新 this._debugLog。
     * 用于排除原因/阈值过滤/频率过滤/去重过滤等明细日志，避免污染普通用户控制台。
     */
    _debug(...args) {
        if (this._debugLog) console.log(...args);
    }

    // ========================================
    // 生命周期
    // ========================================

    async initModel(model, dtype, onProgress) {
        if (this.isLoading) return;
        this.isLoading = true;
        this.isReady = false;
        this.modelName = model;
        this.clearRecallCache('embedding-model-reinit');

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
        this.clearRecallCache('embedding-api-reinit');

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
        this.snapshots = [];
        this.chatId = null;
        this.isReady = false;
        this.isApiMode = false;
        this._apiUrl = '';
        this._apiKey = '';
        this._apiModel = '';
        this.clearRecallCache('dispose');
    }

    /**
     * 召回缓存清理。索引或核心配置变化时调用，确保下一次召回重算。
     */
    clearRecallCache(reason = '') {
        if (this._recallCache.size === 0) return;
        if (this._debugLog && reason) {
            console.log(`[Horae Vector] 清空召回缓存（${this._recallCache.size}条）：${reason}`);
        }
        this._recallCache.clear();
    }

    _getRecallCache(key) {
        if (!this._recallCache.has(key)) return null;
        const value = this._recallCache.get(key);
        // 访问命中后挪到尾部，维持 LRU 顺序
        this._recallCache.delete(key);
        this._recallCache.set(key, value);
        return value;
    }

    _setRecallCache(key, value) {
        if (this._recallCache.has(key)) {
            this._recallCache.delete(key);
        }
        this._recallCache.set(key, value);
        while (this._recallCache.size > this._recallCacheLimit) {
            const oldestKey = this._recallCache.keys().next().value;
            if (oldestKey === undefined) break;
            this._recallCache.delete(oldestKey);
        }
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
        this.snapshots = [];
        this.clearRecallCache('loadChat');

        if (!chatId) return;

        try {
            await this._openDB();
            await this._loadSnapshotsForChat(chatId);
            const stored = await this._loadAllVectors();
            const staleKeys = [];
            for (const item of stored) {
                // IndexedDB 反序列化偶发返回字符串型 messageIndex，统一为整数避免与 chat 索引比较失效
                const normalizedIdx = this._normalizeMessageIndex(item.messageIndex);
                if (normalizedIdx === null || normalizedIdx >= chat.length) {
                    staleKeys.push(item.messageIndex);
                    continue;
                }
                const meta = chat[normalizedIdx]?.horae_meta;
                const doc = this.buildVectorDocument(meta);
                if (!doc || this._hashString(doc) !== item.hash) {
                    staleKeys.push(item.messageIndex);
                    continue;
                }
                this.vectors.set(normalizedIdx, {
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
            const snapCount = this.snapshots.reduce((a, s) => a + s.items.length, 0);
            const snapTxt = snapCount > 0 ? ` (+${snapCount} 条历史记忆, ${this.snapshots.length} 份快照)` : '';
            console.log(`[Horae Vector] 已加载 ${this.vectors.size} 条向量 (chatId: ${chatId})${snapTxt}`);
        } catch (err) {
            console.warn('[Horae Vector] 加载向量索引失败:', err);
        }
    }

    // ========================================
    // 文档构建
    // ========================================

    /**
     * 将 horae_meta 序列化为检索文本
     * 设计取舍：
     * - 事件摘要为主权重，独立首段
     * - 时间/地点/在场角色作为锚点（区分 4/1 vs 6/3 同类事件、跨地点同类事件）
     * - 不写英文标签（[Event]/[NPC] 等对中文 embedding 是无意义低 IDF token）
     * - 不写 NPC 外貌/性格/关系/服装/物品/情绪等高重复字段（IDF 噪声重灾区）
     * - RPG 变更使用中文短句
     */
    buildVectorDocument(meta) {
        if (isMetaExcluded(meta)) return '';

        const eventTexts = [];
        if (meta.events?.length > 0) {
            for (const evt of meta.events) {
                if (evt.isSummary || evt.level === '摘要' || evt._summaryId) continue;
                if (evt.summary) eventTexts.push(evt.summary);
            }
        }

        const anchorTokens = [];
        if (meta.scene?.location) anchorTokens.push(meta.scene.location);
        const chars = meta.scene?.characters_present || [];
        if (chars.length > 0) anchorTokens.push(chars.join(' '));
        if (meta.timestamp?.story_date) {
            anchorTokens.push(
                meta.timestamp.story_time
                    ? `${meta.timestamp.story_date} ${meta.timestamp.story_time}`
                    : meta.timestamp.story_date
            );
        }

        const rpgLines = [];
        const rpg = meta._rpgChanges;
        if (rpg) {
            if (rpg.levels && Object.keys(rpg.levels).length > 0) {
                for (const [owner, lv] of Object.entries(rpg.levels)) {
                    rpgLines.push(`${owner} 等级${lv}`);
                }
            }
            for (const eq of (rpg.equipment || [])) {
                rpgLines.push(`${eq.owner} 装备 ${eq.name}(${eq.slot})`);
            }
            for (const u of (rpg.unequip || [])) {
                rpgLines.push(`${u.owner} 卸下 ${u.name}(${u.slot})`);
            }
            for (const bc of (rpg.baseChanges || [])) {
                if (bc.field === 'level') rpgLines.push(`基地 ${bc.path} 等级${bc.value}`);
            }
        }

        if (eventTexts.length === 0 && anchorTokens.length === 0 && rpgLines.length === 0) return '';

        const blocks = [];
        if (eventTexts.length > 0) blocks.push(eventTexts.join('\n'));
        if (anchorTokens.length > 0) blocks.push(anchorTokens.join(' '));
        if (rpgLines.length > 0) blocks.push(rpgLines.join('\n'));

        return blocks.join('\n\n');
    }

    // ========================================
    // 索引操作
    // ========================================

    async addMessage(messageIndex, meta) {
        if (!this.isReady || !this.chatId) return;
        if (isMetaExcluded(meta)) return;

        const idx = this._normalizeMessageIndex(messageIndex);
        if (idx === null) return;

        const doc = this.buildVectorDocument(meta);
        if (!doc) return;

        const hash = this._hashString(doc);
        const existing = this.vectors.get(idx);
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

        this.vectors.set(idx, { vector, hash, document: doc });
        this._updateTermCounts(doc, 1);
        await this._saveVector(idx, { vector, hash, document: doc });
        this.clearRecallCache('addMessage');
    }

    async removeMessage(messageIndex) {
        const idx = this._normalizeMessageIndex(messageIndex);
        if (idx === null) return;
        const existing = this.vectors.get(idx);
        if (!existing) return;

        this._updateTermCounts(existing.document, -1);
        this.totalDocuments--;
        this.vectors.delete(idx);
        await this._deleteVector(idx);
        this.clearRecallCache('removeMessage');
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
            if (isMetaExcluded(meta)) continue;
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

        if (indexed > 0) this.clearRecallCache('batchIndex');
        return { indexed, skipped: chat.length - tasks.length };
    }

    async clearIndex() {
        this.vectors.clear();
        this.termCounts.clear();
        this.totalDocuments = 0;
        if (this.chatId) await this._clearVectors();
        this.clearRecallCache('clearIndex');
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
     * 向量检索：当前对话向量与已挂载的历史快照走同一池子、同阈值竞争
     * 命中条目用 snapKey 区分来源（快照），无 snapKey 即为当前对话条目
     * @param {string} queryText
     * @param {number} topK
     * @param {number} threshold
     * @param {Set<number>} excludeIndices
     * @returns {Promise<Array>}
     */
    async search(queryText, topK = 5, threshold = 0.72, excludeIndices = new Set(), pureMode = false) {
        const hasVectors = this.vectors.size > 0;
        const hasSnapshots = this.snapshots.length > 0;
        if (!this.isReady || !queryText || (!hasVectors && !hasSnapshots)) return [];

        const prepared = this._prepareText(queryText, true);
        this._debug('[Horae Vector] 开始 embedding 查询...');
        this._debug(`[Horae Vector] 实际检索阈值: ${Number(threshold).toFixed(4)} | topK=${topK} | pureMode=${!!pureMode}`);
        const result = await this._embed([prepared]);
        if (!result?.vectors?.[0]) {
            console.warn('[Horae Vector] embedding 返回空结果:', result);
            return [];
        }

        const queryVec = result.vectors[0];
        const snapEntries = hasSnapshots ? this._iterateSnapshotEntries() : [];
        this._debug(`[Horae Vector] 查询向量维度: ${queryVec.length}，开始对比 当前=${this.vectors.size} 条 + 快照=${snapEntries.length} 条`);

        const scored = [];
        const allScored = [];
        let currentSearched = 0;
        let currentHit = 0;
        let snapHit = 0;

        for (const [msgIdx, entry] of this.vectors) {
            if (this._isExcludedMessageIndex(excludeIndices, msgIdx)) continue;
            currentSearched++;
            const sim = this._dotProduct(queryVec, entry.vector);
            const hit = { messageIndex: msgIdx, similarity: sim, document: entry.document };
            allScored.push(hit);
            if (sim >= threshold) { scored.push(hit); currentHit++; }
        }

        // 快照与当前对话同池竞争：相同阈值、相同打分逻辑，仅以 snapKey 区分来源
        for (const f of snapEntries) {
            const sim = this._dotProduct(queryVec, f.entry.vector);
            const hit = {
                snapKey: f.snapKey,
                snapshotId: f.snapshotId,
                indexInSnap: f.indexInSnap,
                messageIndex: f.entry.originalIndex,
                similarity: sim,
                document: f.entry.document,
                source: 'snapshot',
            };
            allScored.push(hit);
            if (sim >= threshold) { scored.push(hit); snapHit++; }
        }

        allScored.sort((a, b) => b.similarity - a.similarity);
        const bestSim = allScored.length > 0 ? allScored[0].similarity : 0;
        this._debug(`[Horae Vector] 扫描 当前=${currentSearched}/快照=${snapEntries.length} | 最高=${bestSim.toFixed(4)} | 阈值(${threshold}) 命中 当前=${currentHit}/快照=${snapHit}`);
        if (this._debugLog && scored.length === 0 && allScored.length > 0) {
            console.log(`[Horae Vector] 阈值下 Top-5 候选:`);
            for (const c of allScored.slice(0, 5)) {
                const tag = c.snapKey ? `[snap ${c.snapshotId}#${c.messageIndex}]` : `#${c.messageIndex}`;
                console.log(`  ${tag} sim=${c.similarity.toFixed(4)} | ${c.document.substring(0, 60)}`);
            }
        }

        scored.sort((a, b) => b.similarity - a.similarity);

        const adjusted = pureMode ? scored : this._adjustThresholdByFrequency(scored, threshold);
        if (!pureMode) this._debug(`[Horae Vector] 频率过滤后: ${adjusted.length} 条`);

        const deduped = this._deduplicateResults(adjusted);
        this._debug(`[Horae Vector] 去重后: ${deduped.length} 条`);

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
            // 快照条目不参与当前对话的 IDF 统计，直接保留
            if (r.snapKey) return true;
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

        const getVec = (r) => {
            if (r.snapKey) return this._getSnapshotEntry(r.snapKey)?.vector || [];
            return this.vectors.get(r.messageIndex)?.vector || [];
        };

        const kept = [results[0]];
        for (let i = 1; i < results.length; i++) {
            const candidate = results[i];
            const candVec = getVec(candidate);
            let isDuplicate = false;
            for (const existing of kept) {
                const mutualSim = this._dotProduct(getVec(existing), candVec);
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
    async generateRecallPrompt(horaeManager, skipLast, settings, extraExcludeIndices = new Set(), aiTaskFn = null) {
        // 同步详细调试日志开关（每次召回入口刷新一次）
        this._debugLog = !!settings?.vectorDebugLog;

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
        let mergedRecallQuery = this.buildMergedRecallQuery(stateQueryForRecall, userQuery);

        const EXCLUDE_RECENT = 5;
        const effectiveEnd = Math.max(0, chat.length - Math.max(0, skipLast));
        const excludeIndices = new Set();
        // 所有未隐藏的 AI 楼层默认视为「prompt 内已可见」，避免召回与正文重复
        // is_hidden=true 的楼层 ST 不会发送，仍允许被召回作为历史记忆
        let visibleExcludedCount = 0;
        for (let i = 0; i < effectiveEnd; i++) {
            const msg = chat[i];
            if (!msg || msg.is_user || msg.is_hidden) continue;
            if (!msg.horae_meta || msg.horae_meta._skipHorae) continue;
            excludeIndices.add(i);
            visibleExcludedCount++;
        }
        for (let i = Math.max(0, effectiveEnd - EXCLUDE_RECENT); i < effectiveEnd; i++) {
            excludeIndices.add(i);
        }
        // skipLast 区间（swipe 中的尾部楼层）一并排除，避免召回到上一次 swipe 的内容
        for (let i = effectiveEnd; i < chat.length; i++) {
            excludeIndices.add(i);
        }
        let extraPromptExcludedCount = 0;
        if (extraExcludeIndices && typeof extraExcludeIndices[Symbol.iterator] === 'function') {
            for (const idx of extraExcludeIndices) {
                if (Number.isInteger(idx) && idx >= 0 && idx < chat.length) {
                    if (!excludeIndices.has(idx)) extraPromptExcludedCount++;
                    excludeIndices.add(idx);
                }
            }
        }
        if (visibleExcludedCount > 0) {
            this._debug(`[Horae Vector] 排除未隐藏 AI 楼层: ${visibleExcludedCount} 条`);
        }
        if (extraPromptExcludedCount > 0) {
            this._debug(`[Horae Vector] 额外排除已在 Prompt 中的楼层: ${extraPromptExcludedCount}`);
        }

        const pureMode = !!settings.vectorPureMode;

        // 召回结果缓存：同样的查询条件 + 同样的索引状态直接返回上次的 recallText
        // 索引/模型变化时由 clearRecallCache 主动清空，故 key 不需带 indexHash
        // 查 cache 放在 Query 重写之前——命中就完全跳过 LLM 重写调用，节省每次 500 token
        const queryRewriteEnabled = !!settings.vectorQueryRewriteEnabled;
        const queryRewriteSysHash = queryRewriteEnabled
            ? this._hashString(this._getQueryRewriteSystemPrompt(settings))
            : '';
        const cacheKey = JSON.stringify({
            c: this.chatId || '',
            e: effectiveEnd,
            n: this.vectors.size,
            q: this._hashString(`${mergedRecallQuery || ''}\x1f${userQuery || ''}\x1f${stateQueryForRecall || ''}`),
            x: this._hashString([...excludeIndices].sort((a, b) => a - b).join(',')),
            s: this._hashString(JSON.stringify({
                topK,
                threshold,
                recallTopK,
                recallThreshold,
                useRerank,
                pureMode,
                rerankModel: settings.vectorRerankModel || '',
                rerankFullText: !!settings.vectorRerankFullText,
                rerankCandidates: settings.vectorRerankCandidates,
                rerankRecallThreshold: settings.vectorRerankRecallThreshold,
                rerankMinScore: this._effectiveRerankMinScore(settings),
                rerankContextLimit: settings.vectorRerankContextLimit || 32768,
                snapMounted: this.snapshots.length,
                fullTextCount: settings.vectorFullTextCount,
                fullTextThreshold: settings.vectorFullTextThreshold,
                stripTags: settings.vectorStripTags || '',
                keywordLang: this._activeKeywordLang || '',
                antiParaphrase: !!settings.antiParaphraseMode,
            })),
            qr: queryRewriteEnabled ? `1|${queryRewriteSysHash}` : '0',
            m: this._hashString(`${this.modelName || ''}|${this.isApiMode ? this._apiUrl : ''}|${this.isApiMode ? this._apiModel : ''}`),
        });
        const cached = this._getRecallCache(cacheKey);
        if (cached) {
            this._debug(`[Horae Vector] 召回缓存命中 (key=${this._hashString(cacheKey)})`);
            this._lastDebugInfo = {
                ...cached.debug,
                timestamp: Date.now(),
                cacheHit: true,
            };
            return cached.recallText;
        }

        // Query 重写：让辅助 API 产出 INTENT + 5 条多角度查询，对短问句/代词多的场景效果最好
        // INTENT 替换原 merged query 作为 rerank query，5 条 Q 各跑一次 embedding 召回参与 RRF
        let rewriteResult = null;
        if (queryRewriteEnabled && typeof aiTaskFn === 'function') {
            try {
                rewriteResult = await this._performQueryRewrite(chat, skipLast, settings, aiTaskFn);
            } catch (err) {
                console.warn('[Horae Vector] Query 重写失败：', err?.message || err);
            }
        }
        if (rewriteResult?.intent) {
            mergedRecallQuery = rewriteResult.intent;
            this._debug(`[Horae Vector] Query 重写 INTENT: ${rewriteResult.intent}`);
        }

        const merged = new Map();
        // snapshot 条目用 snapKey 作主键，当前对话用 messageIndex，两者不重叠
        const keyOf = r => r.snapKey || r.messageIndex;

        if (pureMode) this._debug('[Horae Vector] 纯向量模式已启用，跳过关键词启发式');
        if (useRerank) this._debug(`[Horae Vector] Rerank 模式：embedding 召回阈值=${recallThreshold} / 候选=${recallTopK}`);

        const structuredResults = this._structuredQuery(userQuery, chat, state, excludeIndices, topK, pureMode);
        this._debug(`[Horae Vector] 结构化查询: ${structuredResults.length} 条命中`);
        for (const r of structuredResults) {
            merged.set(keyOf(r), r);
        }

        // hybridResults 同池产出，当前对话与已挂载快照按同一阈值竞争
        const hybridResults = await this._hybridSearch(userQuery, state, horaeManager, skipLast, settings, excludeIndices, recallTopK, recallThreshold, pureMode);
        const hybridSnapCount = hybridResults.filter(r => r.snapKey).length;
        this._debug(`[Horae Vector] 向量混合搜索: ${hybridResults.length} 条命中 (含快照 ${hybridSnapCount} 条)`);
        for (const r of hybridResults) {
            if (!merged.has(keyOf(r))) merged.set(keyOf(r), r);
        }

        const rewriteHits = [];
        if (rewriteResult?.queries?.length) {
            for (let qi = 0; qi < rewriteResult.queries.length; qi++) {
                const q = rewriteResult.queries[qi];
                if (!q) continue;
                try {
                    const subResults = await this.search(q, recallTopK, recallThreshold, excludeIndices, pureMode);
                    for (const r of subResults) {
                        const tagged = { ...r, source: r.snapKey ? `rewrite#${qi + 1}+snap` : `rewrite#${qi + 1}` };
                        rewriteHits.push(tagged);
                        if (!merged.has(keyOf(tagged))) merged.set(keyOf(tagged), tagged);
                    }
                } catch (err) {
                    this._debug(`[Horae Vector] Query 重写第 ${qi + 1} 条召回失败：${err?.message || err}`);
                }
            }
            this._debug(`[Horae Vector] Query 重写召回: ${rewriteHits.length} 条命中（去重前）`);
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
        for (const f of this._iterateSnapshotEntries()) {
            const m = f.entry.meta;
            if (!m) continue;
            (m.scene?.characters_present || []).forEach(c => allKnownChars.add(c));
            if (m.npcs) Object.keys(m.npcs).forEach(c => allKnownChars.add(c));
        }
        for (const c of allKnownChars) {
            if (userQuery && userQuery.includes(c)) relevantChars.add(c);
        }

        let results = Array.from(merged.values()).filter(r => {
            if (r.snapKey) return true;
            return !isMetaExcluded(chat[r.messageIndex]?.horae_meta);
        });

        // RRF 融合：结构化、向量、角色相关三路独立排名，score = Σ 1/(K+rank)
        const RRF_K = 60;
        const fusionScore = new Map();
        const addRanker = (list, weight = 1) => {
            list.forEach((r, idx) => {
                const k = keyOf(r);
                const cur = fusionScore.get(k) || 0;
                fusionScore.set(k, cur + weight / (RRF_K + idx));
            });
        };
        addRanker(structuredResults, 1.0);
        addRanker(hybridResults, 1.0);
        if (rewriteHits.length > 0) {
            // 重写查询的总权重与单路 embedding 持平，避免 5 路堆叠后挤掉原始召回
            const perQueryWeight = 1.0 / Math.max(1, rewriteResult?.queries?.length || 1);
            addRanker(rewriteHits, perQueryWeight);
        }
        if (relevantChars.size > 0) {
            for (const r of results) {
                const meta = r.snapKey
                    ? this._getSnapshotMeta(r.snapKey)
                    : chat[r.messageIndex]?.horae_meta;
                if (isMetaExcluded(meta)) continue;
                const docChars = new Set([
                    ...(meta.scene?.characters_present || []),
                    ...Object.keys(meta.npcs || {}),
                ]);
                let hasRelevant = false;
                for (const c of relevantChars) {
                    if (docChars.has(c)) { hasRelevant = true; break; }
                }
                if (hasRelevant) {
                    const k = keyOf(r);
                    const cur = fusionScore.get(k) || 0;
                    fusionScore.set(k, cur + 1 / (RRF_K + 0));
                    r.source = (r.source || '') + '+char';
                }
            }
            this._debug(`[Horae Vector] 角色相关性 RRF bonus: 相关角色=[${[...relevantChars].join(',')}]`);
        }

        for (const r of results) r._fusionScore = fusionScore.get(keyOf(r)) || 0;
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
                    const useUserContext = useFullText && !!settings.antiParaphraseMode;
                    const currentDateForRerank = state.timestamp?.story_date;
                    const rerankDocs = rerankCandidates.map(r => {
                        const snapEntry = r.snapKey ? this._getSnapshotEntry(r.snapKey) : null;
                        const meta = snapEntry ? snapEntry.meta : chat[r.messageIndex]?.horae_meta;
                        const timeTag = this._buildTimeTag(meta?.timestamp, currentDateForRerank);
                        const head = timeTag ? `${timeTag}\n` : '';
                        const baseDoc = r.document || '';
                        if (useFullText) {
                            const rawMes = snapEntry ? snapEntry.mes : chat[r.messageIndex]?.mes;
                            const fullText = this._extractCleanText(rawMes, _stripTags);
                            // 反转述模式开关下，rerank 输入贴回 USER 上一条；其它模式保持原状不污染评分语境
                            let userBlock = '';
                            if (useUserContext) {
                                const userMes = snapEntry
                                    ? (snapEntry.userPrecedingMes || '')
                                    : this._getPrecedingUserText(chat, r.messageIndex, _stripTags);
                                if (userMes) userBlock = `[USER]\n${userMes}\n[AI]\n`;
                            }
                            const snippet = fullText || '';
                            if (snippet) return `${head}${baseDoc}\n---\n${userBlock}${snippet}`;
                            return `${head}${baseDoc}`;
                        }
                        return `${head}${baseDoc}`;
                    });
                    console.log(`[Horae Vector] Rerank 输入: ${rerankCandidates.length} 条候选 / 模式=${useFullText ? '全文精排' : '摘要排序'}`);

                    let rerankPlan = null;
                    let rerankDocsForDebug = rerankDocs;
                    let reranked = [];
                    if (useFullText) {
                        // 全文模式按估算 token 预算分批，避免超出 reranker 上下文上限
                        const ctxLimit = Math.max(2048, parseInt(settings.vectorRerankContextLimit, 10) || 32768);
                        rerankPlan = this._buildRerankBatchPlan(rerankQuery, rerankDocs, ctxLimit);
                        rerankDocsForDebug = rerankPlan.documents;
                        if (rerankPlan.batches.length > 1 || rerankPlan.truncatedCount > 0) {
                            console.log(`[Horae Vector] Rerank 分批: batches=${rerankPlan.batches.length} / budget=${rerankPlan.docBudget} tokens / query=${rerankPlan.queryTokens} tokens / truncated=${rerankPlan.truncatedCount}`);
                        }

                        const merged = [];
                        for (let bi = 0; bi < rerankPlan.batches.length; bi++) {
                            const batch = rerankPlan.batches[bi];
                            console.log(`[Horae Vector] Rerank batch ${bi + 1}/${rerankPlan.batches.length}: docs=${batch.documents.length}, estTokens=${batch.estimatedTokens}`);
                            const batchReranked = await this._rerank(
                                rerankQuery,
                                batch.documents,
                                batch.documents.length,
                                settings
                            );
                            for (const rr of batchReranked) {
                                const globalIndex = batch.indices[rr.index];
                                if (globalIndex === undefined) continue;
                                merged.push({
                                    index: globalIndex,
                                    relevance_score: rr.relevance_score,
                                });
                            }
                        }

                        // 跨批次合并：同一条候选在多批中均出现时取最高分
                        const bestByIndex = new Map();
                        for (const rr of merged) {
                            const prev = bestByIndex.get(rr.index);
                            if (!prev || (rr.relevance_score ?? 0) > (prev.relevance_score ?? 0)) {
                                bestByIndex.set(rr.index, rr);
                            }
                        }
                        reranked = [...bestByIndex.values()].sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
                    } else {
                        reranked = await this._rerank(
                            rerankQuery,
                            rerankDocs,
                            rerankCandidates.length,
                            settings
                        );
                    }
                    if (reranked && reranked.length > 0) {
                        const minScore = this._effectiveRerankMinScore(settings);
                        const passed = reranked.filter(rr => (rr.relevance_score ?? 0) >= minScore);
                        const dropped = reranked.length - passed.length;
                        console.log(`[Horae Vector] Rerank 完成: ${reranked.length} 条 → 阈值=${minScore.toFixed(2)} 通过=${passed.length} 丢弃=${dropped}`);
                        // 阈值未过即整体丢弃；避免低相关度的 Top1 污染最终召回
                        const finalReranked = passed;
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
                                docPreview: (rerankDocsForDebug[i] || '').substring(0, 120),
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
                            retainedTop1: false,
                            batching: rerankPlan ? {
                                contextLimit: rerankPlan.contextLimit,
                                budgetTokens: rerankPlan.docBudget,
                                queryTokens: rerankPlan.queryTokens,
                                batchCount: rerankPlan.batches.length,
                                truncatedCount: rerankPlan.truncatedCount,
                                batches: rerankPlan.batches.map((b, idx) => ({
                                    batch: idx + 1,
                                    docs: b.documents.length,
                                    estimatedTokens: b.estimatedTokens,
                                })),
                            } : null,
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
        if (this._debugLog) {
            for (const r of results) {
                const tag = r.snapKey ? `[snap]#${r.messageIndex}` : `#${r.messageIndex}`;
                console.log(`  ${tag} sim=${r.similarity.toFixed(3)} [${r.source}]`);
            }
        }

        const currentDate = state.timestamp?.story_date;
        const fullTextCount = Math.min(settings.vectorFullTextCount ?? 3, topK);
        const fullTextThreshold = settings.vectorFullTextThreshold ?? 0.9;
        const recallText = results.length === 0
            ? ''
            : this._buildRecallText(results, currentDate, chat, fullTextCount, fullTextThreshold, settings.vectorStripTags || '', !!settings.antiParaphraseMode);
        if (recallText) this._debug(`[Horae Vector] 召回文本 (${recallText.length}字):\n${recallText}`);

        this._lastDebugInfo = {
            timestamp: Date.now(),
            chatId: this.chatId,
            indexedCount: this.vectors.size,
            snapshotCount: this.snapshots.reduce((a, s) => a + s.items.length, 0),
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
            embedding: hybridResults.filter(r => !r.snapKey).map(r => ({
                messageIndex: r.messageIndex,
                similarity: r.similarity,
                source: r.source,
                docPreview: (r.document || '').substring(0, 120),
            })),
            snapshot: (() => {
                const seen = new Map();
                for (const r of [...hybridResults, ...rewriteHits]) {
                    if (!r.snapKey || seen.has(r.snapKey)) continue;
                    seen.set(r.snapKey, r);
                }
                return [...seen.values()]
                    .sort((a, b) => b.similarity - a.similarity)
                    .map(r => ({
                        snapKey: r.snapKey,
                        snapshotId: r.snapshotId,
                        messageIndex: r.messageIndex,
                        similarity: r.similarity,
                        source: r.source,
                        docPreview: (r.document || '').substring(0, 120),
                    }));
            })(),
            relevantChars: [...relevantChars],
            rerank: rerankDebug,
            queryRewrite: rewriteResult ? {
                intent: rewriteResult.intent || '',
                queries: rewriteResult.queries || [],
                hits: rewriteHits.length,
            } : null,
            final: results.map(r => ({
                snapKey: r.snapKey || null,
                messageIndex: r.messageIndex,
                similarity: r.similarity,
                source: r.source,
            })),
            recallText,
            cacheHit: false,
        };

        this._setRecallCache(cacheKey, { recallText, debug: this._lastDebugInfo });

        return recallText;
    }

    /**
     * 取出 Query 重写的 system prompt：优先用户自定义，回落语言默认
     */
    _getQueryRewriteSystemPrompt(settings) {
        const custom = (settings?.vectorQueryRewriteSystemPrompt || '').trim();
        if (custom) return custom;
        let lang = 'en';
        try { lang = detectEffectiveAiLang(settings); } catch { /* ignore */ }
        const defaultPrompt = getPromptDefaultSync(lang, 'vectorQueryRewriteSystemPrompt')
            || getPromptDefaultSync('en', 'vectorQueryRewriteSystemPrompt');
        return defaultPrompt || '';
    }

    /**
     * 调用辅助 API 生成 INTENT + 5 条多角度查询。
     * @returns {{ intent: string, queries: string[] } | null}
     */
    async _performQueryRewrite(chat, skipLast, settings, aiTaskFn) {
        const systemPrompt = this._getQueryRewriteSystemPrompt(settings);
        if (!systemPrompt) return null;

        // 取最近若干轮上下文作为重写依据；只用文本片段，避免超长
        const RECENT_TURNS = 6;
        const effectiveEnd = Math.max(0, chat.length - Math.max(0, skipLast));
        const startIdx = Math.max(0, effectiveEnd - RECENT_TURNS);
        const recent = [];
        for (let i = startIdx; i < effectiveEnd; i++) {
            const m = chat[i];
            if (!m) continue;
            const role = m.is_user ? 'user' : 'assistant';
            const raw = (m.mes || '').replace(/<think(?:ing)?\b[\s\S]*?<\/think(?:ing)?>/gi, '');
            const clean = this._stripVolatileHoraeLines(raw).trim();
            if (!clean) continue;
            // 长消息保留首尾各 600 字，中间省略
            const trimmed = clean.length > 1500
                ? `${clean.slice(0, 600)}\n...（中间省略）...\n${clean.slice(-600)}`
                : clean;
            recent.push(`[${role}] ${trimmed}`);
        }
        if (recent.length === 0) return null;

        const fullPrompt = `${systemPrompt}\n\n---\n\n对话背景：\n${recent.join('\n\n')}`;

        const raw = await aiTaskFn(fullPrompt);
        if (typeof raw !== 'string' || !raw.trim()) return null;
        return this._parseQueryRewriteResponse(raw);
    }

    _parseQueryRewriteResponse(raw) {
        const text = String(raw || '').replace(/\r\n?/g, '\n');
        let intent = '';
        const queries = [];
        for (const line of text.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const intentMatch = trimmed.match(/^INTENT\s*[:：]\s*(.+)$/i);
            if (intentMatch) {
                intent = intentMatch[1].trim();
                continue;
            }
            const qMatch = trimmed.match(/^Q\s*[:：]\s*(.+)$/i);
            if (qMatch) {
                const q = qMatch[1].trim();
                if (q) queries.push(q);
            }
        }
        // 去重 + 最多 5 条
        const dedup = [];
        const seen = new Set();
        for (const q of queries) {
            const k = q.replace(/\s+/g, '').toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            dedup.push(q);
            if (dedup.length >= 5) break;
        }
        if (!intent && dedup.length === 0) return null;
        return { intent, queries: dedup };
    }

    // 索引规模越大，噪声越多；非 rerank 路径下随之略提阈值，最多 +0.05
    _dynamicThreshold(baseThreshold) {
        const N = this.totalDocuments;
        if (N <= 50) return baseThreshold;
        const bump = Math.min(0.05, Math.log10(N / 50) * 0.04);
        const effective = Math.min(0.95, baseThreshold + bump);
        if (bump > 0.005) this._debug(`[Horae Vector] 动态阈值: ${baseThreshold} → ${effective.toFixed(3)} (已索引 ${N} 条)`);
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
            memoryTag: pick('memoryTag', '[Past Memory]'),
            userTag: pick('userTag', '[USER]'),
            aiTag: pick('aiTag', '[AI]'),
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
        // 把快照里出现过的角色名也并进 knownChars，否则仅在历史里登场的角色无法触发结构化通道
        for (const f of this._iterateSnapshotEntries()) {
            const m = f.entry.meta;
            if (!m) continue;
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
                    this._debug(`[Horae Vector] 结构化查询: "${charName}" 首次出现于 #${idx}`);
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
                        this._debug(`[Horae Vector] 结构化查询: "${charName}" 上次穿 "${costumeKw}" 于 #${idx}`);
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
                    this._debug(`[Horae Vector] 结构化查询: 上次 "${moodKw}" 于 #${idx}`);
                }
            }
        }

        if (hasGiftKw) {
            const giftResults = this._findGiftItems(chat, mentionedChars, excludeIndices, topK);
            for (const r of giftResults) {
                results.push(r);
                this._debug(`[Horae Vector] 结构化查询: gift #${r.messageIndex} [${r.document}]`);
            }
        }

        if (hasImportantItemKw) {
            const impResults = this._findImportantItems(chat, excludeIndices, topK);
            for (const r of impResults) {
                results.push(r);
                this._debug(`[Horae Vector] 结构化查询: important item #${r.messageIndex} [${r.document}]`);
            }
        }

        if (hasImportantEventKw) {
            const evtResults = this._findImportantEvents(chat, excludeIndices, topK);
            for (const r of evtResults) {
                results.push(r);
                this._debug(`[Horae Vector] 结构化查询: important event #${r.messageIndex} [${r.document}]`);
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
                    this._debug(`[Horae Vector] 结构化查询: thematic #${r.messageIndex} [${r.document}]`);
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
            this._debug(`[Horae Vector] 上下文扩展: +${contextToAdd.length} 条`);
            if (this._debugLog) {
                for (const c of contextToAdd) console.log(`  #${c.messageIndex} [${c.document}]`);
            }
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
        this._debug(`[Horae Vector] 事件搜索: 检测到=[${detected.join(',')}] 扩展后=[${expanded.join(',')}]`);

        const scored = [];
        const matchHit = (searchText) => {
            const matched = [];
            for (const kw of expanded) {
                if (searchText.includes(kw)) matched.push(kw);
            }
            return matched;
        };

        for (let i = 0; i < chat.length; i++) {
            if (excludeIndices.has(i) || skipIds.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (isMetaExcluded(meta)) continue;

            const searchText = this._buildSearchableText(meta);
            if (!searchText) continue;

            const matched = matchHit(searchText);
            const matchCount = matched.length;
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

        // 同步扫描已挂载快照：跨对话的关键词命中也能进入结构化通道
        for (const f of this._iterateSnapshotEntries()) {
            const meta = f.entry.meta;
            if (isMetaExcluded(meta)) continue;
            const searchText = this._buildSearchableText(meta);
            if (!searchText) continue;

            const matched = matchHit(searchText);
            const matchCount = matched.length;
            if (matchCount >= 2 || (matchCount >= 1 && mentionedChars.some(c => searchText.includes(c)))) {
                scored.push({
                    snapKey: f.snapKey,
                    snapshotId: f.snapshotId,
                    indexInSnap: f.indexInSnap,
                    messageIndex: f.entry.originalIndex,
                    similarity: 0.85 + matchCount * 0.02,
                    document: `[Event match snap] ${matched.join(',')}`,
                    source: 'structured-snap',
                    _matchCount: matchCount,
                });
            }
        }

        scored.sort((a, b) => b._matchCount - a._matchCount || b.similarity - a.similarity);
        const top = scored.slice(0, limit);
        if (top.length > 0) {
            this._debug(`[Horae Vector] 事件搜索命中 ${top.length} 条:`);
            if (this._debugLog) {
                for (const r of top) {
                    const tag = r.snapKey ? `[snap ${r.snapshotId}#${r.messageIndex}]` : `#${r.messageIndex}`;
                    console.log(`  ${tag} matches=${r._matchCount} [${r.document}]`);
                }
            }
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
            if (isMetaExcluded(m)) continue;
            if (m.npcs && m.npcs[charName]) return i;
            if (m.scene?.characters_present?.includes(charName)) return i;
        }
        return -1;
    }

    _findLastCostume(chat, charName, costumeKw, excludeIndices) {
        for (let i = chat.length - 1; i >= 0; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (isMetaExcluded(meta)) continue;
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
            if (isMetaExcluded(meta)) continue;
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
            if (isMetaExcluded(meta)) continue;
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
            if (isMetaExcluded(meta)) continue;

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
            if (isMetaExcluded(meta) || !meta.items) continue;

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
            if (isMetaExcluded(meta) || !meta.events) continue;

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
            if (isMetaExcluded(meta) || !meta.events) continue;

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
        if (!this.isReady) return [];
        if (this.vectors.size === 0 && this.snapshots.length === 0) return [];

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
        results = results.map(r => ({ ...r, source: r.source || 'merged' }));
        this._debug(`[Horae Vector] 合并查询搜索: ${results.length} 条 | threshold=${mergedThreshold.toFixed(2)}`);

        results.sort((a, b) => b.similarity - a.similarity);
        results = this._deduplicateResults(results).slice(0, topK);

        this._debug(`[Horae Vector] 混合搜索结果: ${results.length} 条`);
        if (this._debugLog) {
            for (const r of results) {
                const tag = r.snapKey ? `[snap ${r.snapshotId}#${r.messageIndex}]` : `#${r.messageIndex}`;
                console.log(`  ${tag} sim=${r.similarity.toFixed(4)} [${r.source}] | ${r.document.substring(0, 80)}`);
            }
        }

        return results;
    }

    _buildRecallText(results, currentDate, chat, fullTextCount = 3, fullTextThreshold = 0.9, stripTags = '', antiParaphrase = false) {
        const labels = this._getRecallLabels();
        const lines = [labels.header];
        const eventLevels = this._getKeywordTable().eventLevels || {};
        const importantLevels = new Set(eventLevels.important || []);
        const keyLevels = new Set(eventLevels.key || []);
        const memTag = labels.memoryTag || '[历史记忆]';
        const userTag = labels.userTag || '[USER]';
        const aiTag = labels.aiTag || '[AI]';

        for (let rank = 0; rank < results.length; rank++) {
            const r = results[rank];
            const snapEntry = r.snapKey ? this._getSnapshotEntry(r.snapKey) : null;
            const meta = snapEntry ? snapEntry.meta : chat[r.messageIndex]?.horae_meta;
            if (isMetaExcluded(meta)) continue;

            const prefix = snapEntry ? `${memTag} ` : '';
            const idLabel = snapEntry ? `#${snapEntry.originalIndex >= 0 ? snapEntry.originalIndex : '?'}` : `#${r.messageIndex}`;
            const isFullText = fullTextCount > 0 && rank < fullTextCount && r.similarity >= fullTextThreshold;

            if (isFullText) {
                const rawMes = snapEntry ? snapEntry.mes : chat[r.messageIndex]?.mes;
                const rawText = this._extractCleanText(rawMes, stripTags);
                if (rawText) {
                    const timeTag = this._buildTimeTag(meta?.timestamp, currentDate);
                    // 反转述模式专用：把紧邻的 USER 文本贴回原文头部，避免“只看到 AI 一面之词”
                    let userBlock = '';
                    if (antiParaphrase) {
                        const userMes = snapEntry
                            ? (snapEntry.userPrecedingMes || '')
                            : this._getPrecedingUserText(chat, r.messageIndex, stripTags);
                        if (userMes) userBlock = `${userTag}\n${userMes}\n${aiTag}\n`;
                    }
                    lines.push(`${prefix}${idLabel} ${timeTag ? timeTag + ' ' : ''}${labels.fullText}\n${userBlock}${rawText}`);
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
                lines.push(`${prefix}${idLabel} ${parts.join(' | ')}`);
            }
        }

        return lines.length > 1 ? lines.join('\n') : '';
    }

    _getSnapshotEntry(snapKey) {
        if (!snapKey || typeof snapKey !== 'string') return null;
        const m = snapKey.match(/^snap_(.+?)_(-?\d+)_(\d+)$/);
        if (!m) return null;
        const [, sid, , idxInSnap] = m;
        const snap = this.snapshots.find(s => s.id === sid);
        if (!snap) return null;
        return snap.items[parseInt(idxInSnap, 10)] || null;
    }

    _getPrecedingUserText(chat, aiIndex, stripTags = '') {
        if (!Array.isArray(chat) || typeof aiIndex !== 'number' || aiIndex <= 0) return '';
        const prev = chat[aiIndex - 1];
        if (!prev || !prev.is_user) return '';
        const text = this._extractCleanText(prev.mes || '', stripTags);
        return text ? text.substring(0, 800) : '';
    }

    _getSnapshotMeta(snapKey) {
        const entry = this._getSnapshotEntry(snapKey);
        return entry ? entry.meta : null;
    }

    _stripVolatileHoraeLines(text) {
        // rerank/全文召回与 Query 重写阶段移除 horae 系列结构化标签：
        // - 内部数据已通过状态注入单独送达，留下来只会与 prompt 重复
        // - agenda / scene_desc / rpg / table 等字段对历史召回无信号价值
        let out = text.replace(/<horaeevent\b[^>]*>[\s\S]*?<\/horaeevent>/gi, '');
        out = out.replace(/<horae\b[^>]*>[\s\S]*?<\/horae>/gi, '');
        out = out.replace(/<horaerpg\b[^>]*>[\s\S]*?<\/horaerpg>/gi, '');
        out = out.replace(/<horaetable[:：][\s\S]*?<\/horaetable(?:[:：][^>]*)?>/gi, '');
        return out;
    }

    _extractCleanText(mes, stripTags) {
        if (!mes) return '';
        let text = mes
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '');
        text = this._stripVolatileHoraeLines(text);
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

        const meta = getRelativeTimeMeta(result.days, { fromDate: result.fromDate, toDate: result.toDate });
        const WD = ['日', '一', '二', '三', '四', '五', '六'];
        switch (meta.key) {
            case 'today': return '(今天)';
            case 'yesterday': return '(昨天)';
            case 'day_before_yesterday': return '(前天)';
            case 'three_days_ago': return '(大前天)';
            case 'last_weekday': return `(上周${WD[meta.weekday]})`;
            case 'week_before_last_weekday': return `(上上周${WD[meta.weekday]})`;
            case 'last_month_day': return `(上个月${meta.day}号)`;
            case 'last_year_date': return `(去年${meta.month}月${meta.day}日)`;
            case 'year_before_last_date': return `(前年${meta.month}月${meta.day}日)`;
            case 'days_ago': return `(${meta.value}天前)`;
            case 'months_ago': return `(${meta.value}个月前)`;
            case 'years_ago': return `(${meta.years}年前)`;
        }
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
     * 估算文本在 reranker 上的 token 数（保守估计）
     * CJK ≈ 1.35 token / char，其余 ≈ 0.45 token / char，加 18% 安全边际。
     */
    _estimateRerankTokens(text) {
        if (!text) return 0;
        const str = String(text);
        let cjkCount = 0;
        for (const ch of str) {
            const cp = ch.codePointAt(0);
            if (
                (cp >= 0x3400 && cp <= 0x4DBF) ||
                (cp >= 0x4E00 && cp <= 0x9FFF) ||
                (cp >= 0xF900 && cp <= 0xFAFF) ||
                (cp >= 0x3040 && cp <= 0x30FF) ||
                (cp >= 0xAC00 && cp <= 0xD7AF)
            ) {
                cjkCount++;
            }
        }
        const otherCount = Math.max(0, str.length - cjkCount);
        const rough = (cjkCount * 1.35) + (otherCount * 0.45);
        return Math.ceil((rough + 8) * 1.18);
    }

    /**
     * 按估算 token 数截断文本（二分查找最大可保留长度）
     */
    _truncateTextByEstimatedTokens(text, tokenLimit) {
        if (!text || tokenLimit <= 0) return '';
        const source = String(text);
        if (this._estimateRerankTokens(source) <= tokenLimit) return source;

        let low = 0;
        let high = source.length;
        let best = 0;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = source.substring(0, mid);
            if (this._estimateRerankTokens(candidate) <= tokenLimit) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return source.substring(0, best).trimEnd();
    }

    /**
     * 为全文 Rerank 构建分批方案
     * @param {string} query
     * @param {string[]} documents
     * @param {number} contextLimit 模型上下文上限（默认 32K，对应 Qwen3-Reranker 系列）
     * @returns {{ documents: string[], batches: Array<{indices:number[], documents:string[], estimatedTokens:number}>, truncatedCount:number, queryTokens:number, docBudget:number, contextLimit:number, safeUsageRatio:number, staticReserve:number }}
     */
    _buildRerankBatchPlan(query, documents, contextLimit = 32768) {
        const safeUsageRatio = 0.68;
        const staticReserve = 1800;
        const perDocOverhead = 24;

        const queryTokens = this._estimateRerankTokens(query);
        const docBudget = Math.max(
            1024,
            Math.floor(contextLimit * safeUsageRatio) - staticReserve - queryTokens
        );
        const maxSingleDocTokens = Math.max(768, docBudget - 256);

        const normalizedDocs = [];
        const docTokenEstimates = [];
        let truncatedCount = 0;

        for (const doc of documents || []) {
            let text = typeof doc === 'string' ? doc : String(doc ?? '');
            let estimated = this._estimateRerankTokens(text) + perDocOverhead;
            if (estimated > maxSingleDocTokens) {
                const allowedTokens = Math.max(512, maxSingleDocTokens - perDocOverhead);
                const trimmed = this._truncateTextByEstimatedTokens(text, allowedTokens);
                if (trimmed && trimmed.length < text.length) {
                    text = trimmed;
                    truncatedCount++;
                }
                estimated = this._estimateRerankTokens(text) + perDocOverhead;
            }
            normalizedDocs.push(text);
            docTokenEstimates.push(Math.max(perDocOverhead, estimated));
        }

        const batches = [];
        let currentIndices = [];
        let currentDocs = [];
        let currentTokens = 0;
        const flush = () => {
            if (currentIndices.length === 0) return;
            batches.push({
                indices: currentIndices,
                documents: currentDocs,
                estimatedTokens: currentTokens,
            });
            currentIndices = [];
            currentDocs = [];
            currentTokens = 0;
        };

        for (let i = 0; i < normalizedDocs.length; i++) {
            const nextTokens = docTokenEstimates[i];
            if (currentIndices.length > 0 && (currentTokens + nextTokens) > docBudget) {
                flush();
            }
            currentIndices.push(i);
            currentDocs.push(normalizedDocs[i]);
            currentTokens += nextTokens;
        }
        flush();

        return {
            documents: normalizedDocs,
            batches,
            truncatedCount,
            queryTokens,
            docBudget,
            contextLimit,
            safeUsageRatio,
            staticReserve,
        };
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
        this._debug(`[Horae Vector] Rerank 请求: ${documents.length} 条候选 → ${endpoint}`);

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
            req.onupgradeneeded = (event) => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    store.createIndex('chatId', 'chatId', { unique: false });
                }
                // V1→V2：新增独立 store 存放快照，按 chatId 索引
                if (event.oldVersion < 2 && !db.objectStoreNames.contains(SNAPSHOT_STORE)) {
                    const snap = db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'key' });
                    snap.createIndex('chatId', 'chatId', { unique: false });
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
        const normalizedIdx = this._normalizeMessageIndex(messageIndex);
        if (normalizedIdx === null) return;
        const key = `${this.chatId}_${normalizedIdx}`;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put({
                key,
                chatId: this.chatId,
                messageIndex: normalizedIdx,
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
        const normalizedIdx = this._normalizeMessageIndex(messageIndex);
        if (normalizedIdx === null) return;
        const key = `${this.chatId}_${normalizedIdx}`;
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
    // 历史记忆快照（导出/导入/加载/管理）
    // ========================================

    /**
     * 把当前 chat 的全部向量打包成快照对象（不含 IO）
     * sourceChat 用于补齐每条向量对应的原文与 meta；缺失则跳过该条
     * @param {Array} sourceChat ST chat 数组
     * @param {{ label?: string, sourceChatId?: string, sourceChatName?: string }} [info]
     */
    buildSnapshotFromCurrent(sourceChat, info = {}) {
        if (!Array.isArray(sourceChat)) throw new Error('无效的对话数据');
        if (!this.isReady) throw new Error('向量模型未就绪');
        if (this.vectors.size === 0) throw new Error('当前对话没有可导出的向量索引');

        const items = [];
        const sorted = [...this.vectors.entries()].sort((a, b) => a[0] - b[0]);
        for (const [idx, entry] of sorted) {
            const msg = sourceChat[idx];
            if (!msg || msg.is_user) continue;
            const meta = msg.horae_meta;
            if (isMetaExcluded(meta)) continue;
            // 原文剥掉 volatile 标签以减小体积；保留剧情文本
            const cleanedMes = this._stripVolatileHoraeLines(msg.mes || '').trim();
            // 顺手记下紧邻的上一条 USER 文本——反转述模式开启时 rerank/全文召回可借此还原玩家上下文
            // 读取侧自带开关判断，普通模式下不会用，仅做数据保留
            let userPrecedingMes = '';
            const prev = sourceChat[idx - 1];
            if (prev && prev.is_user) {
                userPrecedingMes = this._stripVolatileHoraeLines(prev.mes || '').trim().substring(0, 800);
            }
            const item = {
                originalIndex: idx,
                mes: cleanedMes,
                meta: this._cloneMetaForSnapshot(meta),
                document: entry.document,
                hash: entry.hash,
                vector: Array.from(entry.vector),
            };
            if (userPrecedingMes) item.userPrecedingMes = userPrecedingMes;
            items.push(item);
        }

        if (items.length === 0) throw new Error('没有可导出的有效条目');

        return {
            format: SNAPSHOT_FORMAT,
            version: SNAPSHOT_VERSION,
            exportTime: new Date().toISOString(),
            sourceChatId: info.sourceChatId || this.chatId || '',
            sourceChatName: info.sourceChatName || '',
            label: info.label || '',
            modelName: this.modelName || '',
            dimensions: this.dimensions || 0,
            isApiMode: !!this.isApiMode,
            count: items.length,
            items,
        };
    }

    _cloneMetaForSnapshot(meta) {
        // 只带召回展示需要的字段，避免把整份 horae_meta 塞进文件
        const out = {};
        if (meta.timestamp) {
            out.timestamp = {
                story_date: meta.timestamp.story_date || '',
                story_time: meta.timestamp.story_time || '',
            };
        }
        if (meta.scene) {
            out.scene = {
                location: meta.scene.location || '',
                characters_present: Array.isArray(meta.scene.characters_present)
                    ? [...meta.scene.characters_present]
                    : [],
            };
        }
        if (meta.costumes && Object.keys(meta.costumes).length) {
            out.costumes = { ...meta.costumes };
        }
        if (Array.isArray(meta.events) && meta.events.length) {
            out.events = meta.events
                .filter(e => e && !e.isSummary && e.level !== '摘要' && !e._summaryId)
                .map(e => ({
                    summary: e.summary || '',
                    level: e.level || '',
                    is_important: !!e.is_important,
                }));
        }
        if (meta.npcs && Object.keys(meta.npcs).length) {
            out.npcs = {};
            for (const [name, info] of Object.entries(meta.npcs)) {
                if (!info) continue;
                const n = {};
                if (info.relationship) n.relationship = info.relationship;
                if (info.description) n.description = info.description.substring(0, 200);
                if (Object.keys(n).length) out.npcs[name] = n;
            }
        }
        if (meta.items && Object.keys(meta.items).length) {
            out.items = {};
            for (const [name, info] of Object.entries(meta.items)) {
                if (!info) continue;
                const it = {};
                if (info.icon) it.icon = info.icon;
                if (info.holder) it.holder = info.holder;
                if (info.importance) it.importance = info.importance;
                if (Object.keys(it).length) out.items[name] = it;
            }
        }
        return out;
    }

    /**
     * 校验外部传入的 snapshot 数据合法性
     */
    _validateSnapshot(obj) {
        if (!obj || typeof obj !== 'object') throw new Error('快照文件格式无效');
        if (obj.format !== SNAPSHOT_FORMAT) throw new Error('不是 Horae 记忆快照文件');
        if (!Array.isArray(obj.items) || obj.items.length === 0) throw new Error('快照内容为空');
        if (!obj.dimensions || obj.dimensions <= 0) throw new Error('快照缺少维度信息');
        for (const it of obj.items) {
            if (!Array.isArray(it.vector) || it.vector.length !== obj.dimensions) {
                throw new Error('快照向量维度与声明不一致');
            }
        }
    }

    /**
     * 把快照写入当前 chat 名下；返回写入的 snapshotId
     * @param {object} snapshotObj 来自 buildSnapshotFromCurrent 或外部文件的对象
     * @param {string} [targetChatId] 默认当前 chatId
     */
    async importSnapshot(snapshotObj, targetChatId = null) {
        this._validateSnapshot(snapshotObj);
        const chatId = targetChatId || this.chatId;
        if (!chatId) throw new Error('未指定目标对话');

        if (this.isReady && this.dimensions && snapshotObj.dimensions !== this.dimensions) {
            throw new Error(`维度不匹配：快照 ${snapshotObj.dimensions} 维，当前模型 ${this.dimensions} 维。请切换到匹配的模型或重新导出快照。`);
        }

        await this._openDB();
        const snapshotId = `snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const key = `${chatId}__${snapshotId}`;
        const record = {
            key,
            chatId,
            snapshotId,
            payload: snapshotObj,
            importTime: Date.now(),
        };
        await new Promise((resolve, reject) => {
            const tx = this.db.transaction(SNAPSHOT_STORE, 'readwrite');
            tx.objectStore(SNAPSHOT_STORE).put(record);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });

        if (chatId === this.chatId) {
            this.snapshots.push(this._buildSnapshotRuntime(record));
            this.clearRecallCache('importSnapshot');
        }
        return snapshotId;
    }

    /**
     * 列出当前 chat 已挂载的快照（用于 UI 展示）
     */
    listSnapshots() {
        return this.snapshots.map(s => ({
            id: s.id,
            label: s.label,
            sourceChatName: s.sourceChatName,
            modelName: s.modelName,
            dimensions: s.dimensions,
            count: s.items.length,
            exportTime: s.exportTime,
            importTime: s.importTime,
        }));
    }

    async removeSnapshot(snapshotId) {
        if (!this.chatId) return false;
        await this._openDB();
        const key = `${this.chatId}__${snapshotId}`;
        await new Promise((resolve, reject) => {
            const tx = this.db.transaction(SNAPSHOT_STORE, 'readwrite');
            tx.objectStore(SNAPSHOT_STORE).delete(key);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
        const before = this.snapshots.length;
        this.snapshots = this.snapshots.filter(s => s.id !== snapshotId);
        if (this.snapshots.length !== before) this.clearRecallCache('removeSnapshot');
        return this.snapshots.length !== before;
    }

    /**
     * 读取目标 chat 名下的所有快照原始 payload，供链式传递（带记忆创建新对话）使用
     * 直接读 DB 不依赖当前已挂载的 snapshots，避免依赖 chat 切换时机
     */
    async exportSnapshotsForChat(chatId) {
        if (!chatId) return [];
        await this._openDB();
        const records = await new Promise((resolve, reject) => {
            const tx = this.db.transaction(SNAPSHOT_STORE, 'readonly');
            const req = tx.objectStore(SNAPSHOT_STORE).index('chatId').getAll(chatId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
        return records.map(r => r.payload).filter(Boolean);
    }

    async _loadSnapshotsForChat(chatId) {
        if (!chatId) return;
        await this._openDB();
        const records = await new Promise((resolve, reject) => {
            const tx = this.db.transaction(SNAPSHOT_STORE, 'readonly');
            const req = tx.objectStore(SNAPSHOT_STORE).index('chatId').getAll(chatId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
        this.snapshots = records
            .map(r => this._buildSnapshotRuntime(r))
            .filter(Boolean);
        // 维度跟当前模型不一致的快照直接禁用（点积会失效），日志提示
        if (this.dimensions && this.isReady) {
            const before = this.snapshots.length;
            this.snapshots = this.snapshots.filter(s => {
                if (s.dimensions === this.dimensions) return true;
                console.warn(`[Horae Vector] 快照「${s.label || s.id}」维度 ${s.dimensions} 与当前模型 ${this.dimensions} 不一致，已跳过`);
                return false;
            });
            if (before !== this.snapshots.length) this.clearRecallCache('snapshot-dim-mismatch');
        }
    }

    _buildSnapshotRuntime(record) {
        const p = record?.payload;
        if (!p || !Array.isArray(p.items)) return null;
        return {
            id: record.snapshotId,
            label: p.label || '',
            sourceChatName: p.sourceChatName || '',
            modelName: p.modelName || '',
            dimensions: p.dimensions || 0,
            exportTime: p.exportTime || '',
            importTime: record.importTime || 0,
            items: p.items.map(it => ({
                originalIndex: typeof it.originalIndex === 'number' ? it.originalIndex : -1,
                mes: it.mes || '',
                meta: it.meta || {},
                document: it.document || '',
                hash: it.hash || '',
                vector: Array.isArray(it.vector) ? it.vector : [],
                userPrecedingMes: it.userPrecedingMes || '',
            })),
        };
    }

    /**
     * 拿到全部快照的扁平条目，供召回阶段使用
     * 返回的 key 为 `snap_<snapshotId>_<originalIndex>`，避免与正常 messageIndex 数字冲突
     */
    _iterateSnapshotEntries() {
        const out = [];
        for (const snap of this.snapshots) {
            for (let i = 0; i < snap.items.length; i++) {
                const it = snap.items[i];
                if (!it.vector || it.vector.length === 0) continue;
                out.push({
                    snapshotId: snap.id,
                    indexInSnap: i,
                    snapKey: `snap_${snap.id}_${it.originalIndex}_${i}`,
                    entry: it,
                });
            }
        }
        return out;
    }

    // ========================================
    // 工具函数
    // ========================================

    _hasOriginalEvents(meta) {
        if (isMetaExcluded(meta)) return false;
        if (!meta?.events?.length) return false;
        return meta.events.some(e => !e.isSummary && e.level !== '摘要' && !e._summaryId);
    }

    /**
     * 规范化 messageIndex：兼容 IndexedDB 反序列化的字符串型 key
     * 召回时若不规范化，excludeIndices.has(number) 会漏掉 string 型旧索引，导致召回到 swipe 前的正文
     */
    _normalizeMessageIndex(messageIndex) {
        if (messageIndex == null) return null;
        const n = typeof messageIndex === 'number' ? messageIndex : parseInt(messageIndex, 10);
        return Number.isInteger(n) && n >= 0 ? n : null;
    }

    /**
     * Set 内部混用 number/string 时 has() 会失效；统一以规范化 key 判断排除
     */
    _isExcludedMessageIndex(excludeIndices, messageIndex) {
        if (!excludeIndices) return false;
        if (excludeIndices.has(messageIndex)) return true;
        const idx = this._normalizeMessageIndex(messageIndex);
        if (idx === null) return false;
        return excludeIndices.has(idx) || excludeIndices.has(String(idx));
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
