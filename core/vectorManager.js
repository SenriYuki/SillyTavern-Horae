/**
 * Horae - 向量记忆管理器
 * 基于 Transformers.js 的本地向量检索系统
 *
 * 数据按 chatId 隔离，向量存 IndexedDB，轻量索引存 chat[0].horae_meta.vectorIndex
 */

import { calculateDetailedRelativeTime } from '../utils/timeUtils.js';

const DB_NAME = 'HoraeVectors';
const DB_VERSION = 1;
const STORE_NAME = 'vectors';

const MODEL_CONFIG = {
    'Xenova/bge-small-zh-v1.5': { dimensions: 512, prefix: null },
    'Xenova/multilingual-e5-small': { dimensions: 384, prefix: { query: 'query: ', passage: 'passage: ' } },
};

const TERM_CATEGORIES = {
    medical: ['包扎', '伤口', '治疗', '救治', '处理伤', '疗伤', '敷药', '上药', '受伤', '负伤', '照料', '护理', '急救', '止血', '绷带', '缝合', '卸甲', '疗养', '中毒', '解毒', '昏迷', '苏醒'],
    combat: ['打架', '打斗', '战斗', '冲突', '交手', '攻击', '击败', '斩杀', '对抗', '格斗', '厮杀', '砍', '劈', '刺', '伏击', '围攻', '决斗', '比武', '防御', '撤退', '逃跑', '追击'],
    cooking: ['做饭', '烹饪', '煮', '炒', '烤', '喂食', '吃饭', '喝粥', '餐', '料理', '膳食', '厨房', '食材', '美食', '下厨', '烘焙'],
    clothing: ['换衣', '更衣', '穿衣', '脱衣', '衣物', '换装', '浴袍', '内衣', '连衣裙', '衬衫'],
    emotion_positive: ['开心', '高兴', '快乐', '欢喜', '喜悦', '愉快', '满足', '感动', '温馨', '幸福'],
    emotion_negative: ['生气', '愤怒', '暴怒', '发火', '恼怒', '难过', '伤心', '悲伤', '哭泣', '落泪', '害怕', '恐惧', '惊恐', '委屈', '失落', '焦虑', '羞耻', '愧疚', '崩溃'],
    movement: ['拖', '搬', '抱', '背', '扶', '抬', '推', '拉', '带走', '转移', '搀扶', '安顿'],
    social: ['告白', '表白', '道歉', '拥抱', '亲吻', '握手', '初次', '重逢', '求婚', '订婚', '结婚'],
    gift: ['礼物', '赠送', '送给', '信物', '定情', '戒指', '项链', '手链', '花束', '巧克力', '贺卡', '纪念品', '嫁妆', '聘礼', '徽章', '勋章', '宝石', '收下', '转赠'],
    ceremony: ['婚礼', '葬礼', '仪式', '典礼', '庆典', '节日', '祭祀', '加冕', '册封', '宣誓', '洗礼', '成人礼', '毕业', '庆祝', '纪念日', '生日', '周年', '祭典', '开幕', '闭幕', '庆功', '宴会', '舞会'],
    revelation: ['秘密', '真相', '揭露', '坦白', '暴露', '发现', '真实身份', '隐瞒', '谎言', '欺骗', '伪装', '冒充', '真名', '血统', '身世', '卧底', '间谍', '告密', '揭穿', '拆穿'],
    promise: ['承诺', '誓言', '约定', '保证', '发誓', '立誓', '契约', '盟约', '许诺', '约好', '守护', '效忠', '誓约'],
    loss: ['死亡', '去世', '牺牲', '离别', '分离', '告别', '失去', '消失', '陨落', '凋零', '永别', '丧失', '阵亡', '殉职', '送别', '诀别', '夭折'],
    power: ['觉醒', '升级', '进化', '突破', '衰退', '失去能力', '解封', '封印', '变身', '异变', '获得力量', '魔力', '能力', '天赋', '血脉', '继承', '传承', '修炼', '领悟'],
    intimate: ['亲热', '缠绵', '情事', '春宵', '欢爱', '共度', '同床', '肌肤之亲', '亲密', '暧昧', '挑逗', '诱惑', '勾引', '撩拨', '调情', '情动', '动情', '欲望', '渴望', '贪恋', '索求', '迎合', '纠缠', '痴缠', '沉沦', '迷恋', '沉溺', '喘息', '颤抖', '呻吟', '娇喘', '低吟', '求饶', '失控', '隐忍', '克制', '放纵', '贪婪', '温存', '余韵', '缱绻', '旖旎', '性交', '内射', '颜射', '性行为', '中出', '射精', '性器', '交配', '野合', '欢爱', '高潮'],
    body_contact: ['抚摸', '触碰', '贴近', '依偎', '搂抱', '吻', '啃咬', '舔', '吮', '摩挲', '揉捏', '按压', '握住', '牵手', '十指相扣', '额头相抵', '耳鬓厮磨', '脸红', '心跳', '身体', '肌肤', '锁骨', '脖颈', '耳垂', '嘴唇', '腰肢', '后背', '发丝', '指尖', '掌心'],
};

export class VectorManager {
    constructor() {
        this.worker = null;
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
            for (const item of stored) {
                this.vectors.set(item.messageIndex, {
                    vector: item.vector,
                    hash: item.hash,
                    document: item.document,
                });
                this._updateTermCounts(item.document, 1);
                this.totalDocuments++;
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

        const parts = [];

        for (const t of eventTexts) parts.push(t);

        for (const t of npcTexts) parts.push(t);

        if (meta.scene?.location) parts.push(meta.scene.location);

        const chars = meta.scene?.characters_present || [];
        if (chars.length > 0) parts.push(chars.join(' '));

        if (meta.timestamp?.story_date) {
            parts.push(meta.timestamp.story_time
                ? `${meta.timestamp.story_date} ${meta.timestamp.story_time}`
                : meta.timestamp.story_date);
        }

        return parts.join(' | ');
    }

    // ========================================
    // 索引操作
    // ========================================

    async addMessage(messageIndex, meta) {
        if (!this.isReady || !this.chatId) return;

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
            const doc = this.buildVectorDocument(meta);
            if (!doc) continue;
            const hash = this._hashString(doc);
            const existing = this.vectors.get(i);
            if (existing && existing.hash === hash) continue;
            tasks.push({ messageIndex: i, document: doc, hash });
        }

        if (tasks.length === 0) return { indexed: 0, skipped: chat.length };

        const batchSize = this.isApiMode ? 8 : 16;
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
     * 策略B：高频内容惩罚
     * 只在文档中 >80% 的词都是公共词（出现在 >60% 文档中）时才轻微提高阈值，
     * 避免角色名等必然高频词误杀有效结果。
     */
    _adjustThresholdByFrequency(results, baseThreshold) {
        if (results.length < 2 || this.totalDocuments < 10) return results;

        return results.filter(r => {
            const terms = this._extractKeyTerms(r.document);
            if (terms.length === 0) return true;

            let commonCount = 0;
            for (const term of terms) {
                const count = this.termCounts.get(term) || 0;
                if (count / this.totalDocuments > 0.6) commonCount++;
            }
            const commonRatio = commonCount / terms.length;

            if (commonRatio > 0.8) {
                const penalty = (commonRatio - 0.8) * 0.1;
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
    async generateRecallPrompt(horaeManager, skipLast, settings) {
        const chat = horaeManager.getChat();
        const state = horaeManager.getLatestState(skipLast);
        const topK = settings.vectorTopK || 5;
        const threshold = settings.vectorThreshold ?? 0.72;

        let rawUserMsg = '';
        for (let i = chat.length - 1; i >= 0; i--) {
            if (chat[i].is_user) { rawUserMsg = chat[i].mes || ''; break; }
        }
        const userQuery = this.cleanUserMessage(rawUserMsg);

        const EXCLUDE_RECENT = 5;
        const excludeIndices = new Set();
        for (let i = Math.max(0, chat.length - EXCLUDE_RECENT); i < chat.length; i++) {
            excludeIndices.add(i);
        }

        const merged = new Map();

        const pureMode = !!settings.vectorPureMode;
        if (pureMode) console.log('[Horae Vector] 纯向量模式已启用，跳过关键词启发式');

        const structuredResults = this._structuredQuery(userQuery, chat, state, excludeIndices, topK, pureMode);
        console.log(`[Horae Vector] 结构化查询: ${structuredResults.length} 条命中`);
        for (const r of structuredResults) {
            merged.set(r.messageIndex, r);
        }

        const hybridResults = await this._hybridSearch(userQuery, state, horaeManager, skipLast, settings, excludeIndices, topK, threshold, pureMode);
        console.log(`[Horae Vector] 向量混合搜索: ${hybridResults.length} 条命中`);
        for (const r of hybridResults) {
            if (!merged.has(r.messageIndex)) {
                merged.set(r.messageIndex, r);
            }
        }

        // 多人卡角色相关性加权：
        // 收集"相关角色" = 用户消息中提到的角色 + 当前在场角色
        // 对涉及相关角色的结果施加小幅正向加权，优先召回相关事件
        // 不过滤任何结果，确保跨角色引用（如向A提起B）仍能召回
        const relevantChars = new Set(state.scene?.characters_present || []);
        const allKnownChars = new Set();
        for (let i = 0; i < chat.length; i++) {
            const m = chat[i].horae_meta;
            if (!m) continue;
            (m.scene?.characters_present || []).forEach(c => allKnownChars.add(c));
            if (m.npcs) Object.keys(m.npcs).forEach(c => allKnownChars.add(c));
        }
        for (const c of allKnownChars) {
            if (userQuery && userQuery.includes(c)) relevantChars.add(c);
        }

        let results = Array.from(merged.values());
        if (relevantChars.size > 0) {
            for (const r of results) {
                const meta = chat[r.messageIndex]?.horae_meta;
                if (!meta) continue;
                const docChars = new Set([
                    ...(meta.scene?.characters_present || []),
                    ...Object.keys(meta.npcs || {}),
                ]);
                let hasRelevant = false;
                for (const c of relevantChars) {
                    if (docChars.has(c)) { hasRelevant = true; break; }
                }
                if (hasRelevant) {
                    r.similarity += 0.03;
                }
            }
            console.log(`[Horae Vector] 角色加权: 相关角色=[${[...relevantChars].join(',')}]`);
        }

        results.sort((a, b) => b.similarity - a.similarity);

        // Rerank：对候选结果做二次精排
        if (settings.vectorRerankEnabled && settings.vectorRerankModel && results.length > 1) {
            const rerankCandidates = results.slice(0, topK * 3);
            const rerankQuery = userQuery || this.buildStateQuery(state, null);
            if (rerankQuery) {
                try {
                    const useFullText = !!settings.vectorRerankFullText;
                    const rerankDocs = rerankCandidates.map(r => {
                        if (useFullText) {
                            const fullText = this._extractCleanText(chat[r.messageIndex]?.mes);
                            return fullText || r.document;
                        }
                        return r.document;
                    });
                    console.log(`[Horae Vector] Rerank 模式: ${useFullText ? '全文精排' : '摘要排序'}`);

                    const reranked = await this._rerank(
                        rerankQuery,
                        rerankDocs,
                        topK,
                        settings
                    );
                    if (reranked && reranked.length > 0) {
                        console.log(`[Horae Vector] Rerank 完成: ${reranked.length} 条`);
                        results = reranked.map(rr => {
                            const original = rerankCandidates[rr.index];
                            return {
                                ...original,
                                similarity: rr.relevance_score,
                                source: original.source + (useFullText ? '+rerank-full' : '+rerank'),
                            };
                        });
                    }
                } catch (err) {
                    console.warn('[Horae Vector] Rerank 失败，使用原始排序:', err.message);
                }
            }
        }

        results = results.slice(0, topK);

        console.log(`[Horae Vector] === 最终合并: ${results.length} 条 ===`);
        for (const r of results) {
            console.log(`  #${r.messageIndex} sim=${r.similarity.toFixed(3)} [${r.source}]`);
        }

        if (results.length === 0) return '';

        const currentDate = state.timestamp?.story_date;
        const fullTextCount = Math.min(settings.vectorFullTextCount ?? 3, topK);
        const fullTextThreshold = settings.vectorFullTextThreshold ?? 0.9;
        const recallText = this._buildRecallText(results, currentDate, chat, fullTextCount, fullTextThreshold);
        console.log(`[Horae Vector] 召回文本 (${recallText.length}字):\n${recallText}`);
        return recallText;
    }

    // ========================================
    // 结构化查询（精准，不需要向量）
    // ========================================

    /**
     * 从用户消息解析意图，直接查询 horae_meta 结构化数据
     */
    _structuredQuery(userQuery, chat, state, excludeIndices, topK, pureMode = false) {
        if (!userQuery || chat.length === 0) return [];

        const knownChars = new Set();
        for (let i = 0; i < chat.length; i++) {
            const m = chat[i].horae_meta;
            if (!m) continue;
            (m.scene?.characters_present || []).forEach(c => knownChars.add(c));
            if (m.npcs) Object.keys(m.npcs).forEach(c => knownChars.add(c));
        }

        const mentionedChars = [];
        for (const c of knownChars) {
            if (userQuery.includes(c)) mentionedChars.push(c);
        }

        const isFirst = /第一次|初次|首次|初见|初遇|最早|一开始/.test(userQuery);
        const isLast = /上次|上一次|最后一次|最近一次|之前/.test(userQuery);

        const hasCostumeKw = /穿|戴|换|衣|裙|裤|袍|衫|装|鞋/.test(userQuery);
        const hasMoodKw = /生气|愤怒|开心|高兴|难过|伤心|哭|害怕|恐惧|害羞|羞耻|得意|满足|嫉妒|悲伤|焦虑|紧张|兴奋|感动|温柔|冷漠/.test(userQuery);
        const hasGiftKw = /礼物|赠送|送给|送的|信物|定情|收到|收下|转赠|聘礼|嫁妆|纪念品|贺卡/.test(userQuery);
        const hasImportantItemKw = /重要.{0,2}(物品|东西|道具|宝物)|关键.{0,2}(物品|东西|道具|宝物)|珍贵|宝贝|宝物|神器|秘宝|圣物/.test(userQuery);
        const hasImportantEventKw = /重要.{0,2}(事|事件|经历)|关键.{0,2}(事|事件|转折)|大事|转折|里程碑/.test(userQuery);
        const hasCeremonyKw = /婚礼|葬礼|仪式|典礼|庆典|节日|祭祀|加冕|册封|宣誓|洗礼|成人礼|庆祝|宴会|舞会|祭典/.test(userQuery);
        const hasPromiseKw = /承诺|誓言|约定|保证|发誓|立誓|契约|盟约|许诺/.test(userQuery);
        const hasLossKw = /死亡|去世|牺牲|离别|分离|告别|失去|消失|陨落|永别|诀别|阵亡/.test(userQuery);
        const hasRevelationKw = /秘密|真相|揭露|坦白|暴露|真实身份|隐瞒|谎言|欺骗|伪装|冒充|真名|血统|身世|揭穿/.test(userQuery);
        const hasPowerKw = /觉醒|升级|进化|突破|衰退|失去能力|解封|封印|变身|异变|获得力量|血脉|继承|传承|领悟/.test(userQuery);

        const results = [];

        if (isFirst && mentionedChars.length > 0) {
            for (const charName of mentionedChars) {
                const idx = this._findFirstAppearance(chat, charName, excludeIndices);
                if (idx !== -1) {
                    results.push({ messageIndex: idx, similarity: 1.0, document: `[结构化] ${charName}首次出现`, source: 'structured' });
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
                        results.push({ messageIndex: idx, similarity: 1.0, document: `[结构化] ${charName}穿${costumeKw}`, source: 'structured' });
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
                    results.push({ messageIndex: m.idx, similarity: 0.95, document: `[结构化] 服装匹配:${costumeKw}`, source: 'structured' });
                }
            }
        }

        if (isLast && hasMoodKw) {
            const moodKw = this._extractMoodKeyword(userQuery);
            if (moodKw) {
                const targetChar = mentionedChars[0] || null;
                const idx = this._findLastMood(chat, targetChar, moodKw, excludeIndices);
                if (idx !== -1) {
                    results.push({ messageIndex: idx, similarity: 1.0, document: `[结构化] 情绪匹配:${moodKw}`, source: 'structured' });
                    console.log(`[Horae Vector] 结构化查询: 上次 "${moodKw}" 于 #${idx}`);
                }
            }
        }

        if (hasGiftKw) {
            const giftResults = this._findGiftItems(chat, mentionedChars, excludeIndices, topK);
            for (const r of giftResults) {
                results.push(r);
                console.log(`[Horae Vector] 结构化查询: 礼物/赠品 #${r.messageIndex} [${r.document}]`);
            }
        }

        if (hasImportantItemKw) {
            const impResults = this._findImportantItems(chat, excludeIndices, topK);
            for (const r of impResults) {
                results.push(r);
                console.log(`[Horae Vector] 结构化查询: 重要物品 #${r.messageIndex} [${r.document}]`);
            }
        }

        if (hasImportantEventKw) {
            const evtResults = this._findImportantEvents(chat, excludeIndices, topK);
            for (const r of evtResults) {
                results.push(r);
                console.log(`[Horae Vector] 结构化查询: 重要事件 #${r.messageIndex} [${r.document}]`);
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
                    console.log(`[Horae Vector] 结构化查询: 主题事件 #${r.messageIndex} [${r.document}]`);
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
                        document: `[上文] #${idx}的前置事件`,
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
                        document: `[下文] #${idx}的后续事件`,
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
            if (!meta) continue;

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
                    document: `[事件匹配] ${matched.join(',')}`,
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
     * 直接从用户文本中扫描 TERM_CATEGORIES 中的已知词汇（无需分词）
     */
    _detectCategoryTerms(text) {
        const found = [];
        for (const terms of Object.values(TERM_CATEGORIES)) {
            for (const term of terms) {
                if (text.includes(term)) {
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
        for (const kw of keywords) {
            for (const terms of Object.values(TERM_CATEGORIES)) {
                if (terms.includes(kw)) {
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
            if (!m) continue;
            if (m.npcs && m.npcs[charName]) return i;
            if (m.scene?.characters_present?.includes(charName)) return i;
        }
        return -1;
    }

    _findLastCostume(chat, charName, costumeKw, excludeIndices) {
        for (let i = chat.length - 1; i >= 0; i--) {
            if (excludeIndices.has(i)) continue;
            const costume = chat[i].horae_meta?.costumes?.[charName];
            if (costume && costume.includes(costumeKw)) return i;
        }
        return -1;
    }

    _findCostumeMatches(chat, costumeKw, excludeIndices, limit) {
        const matches = [];
        for (let i = chat.length - 1; i >= 0 && matches.length < limit; i--) {
            if (excludeIndices.has(i)) continue;
            const costumes = chat[i].horae_meta?.costumes;
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
            const mood = chat[i].horae_meta?.mood;
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
        cleaned = cleaned.replace(/上次|上一次|最后一次|之前|穿|戴|换|的|了|过|着|那件|那套|那个/g, '').trim();
        return cleaned.length >= 2 ? cleaned : '';
    }

    _extractMoodKeyword(query) {
        const moodWords = ['生气', '愤怒', '开心', '高兴', '难过', '伤心', '哭泣', '害怕', '恐惧', '害羞', '羞耻', '得意', '满足', '嫉妒', '悲伤', '焦虑', '紧张', '兴奋', '感动', '温柔', '冷漠', '暴怒', '委屈', '失落'];
        for (const w of moodWords) {
            if (query.includes(w)) return w;
        }
        return '';
    }

    /**
     * 查找与礼物/赠品相关的消息
     * 通过 item.holder 变化或事件文本中的赠送关键词定位
     */
    _findGiftItems(chat, mentionedChars, excludeIndices, limit) {
        const giftKws = ['赠送', '送给', '收到', '收下', '转赠', '信物', '定情', '礼物', '聘礼', '嫁妆'];
        const results = [];
        const seen = new Set();

        for (let i = chat.length - 1; i >= 0 && results.length < limit; i--) {
            if (excludeIndices.has(i) || seen.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta) continue;

            let matched = false;
            const matchedItems = [];

            if (meta.items) {
                for (const [name, info] of Object.entries(meta.items)) {
                    const imp = info.importance || '';
                    const holder = info.holder || '';
                    const holderMatchesChar = mentionedChars.length === 0 || mentionedChars.some(c => holder.includes(c));

                    if ((imp === '!' || imp === '!!') && holderMatchesChar) {
                        matched = true;
                        matchedItems.push(`${imp === '!!' ? '关键' : '重要'}:${name}`);
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
                    document: `[结构化] 礼物/赠品: ${matchedItems.join('; ')}`,
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
            if (!meta?.items) continue;

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
                    document: `[结构化] 重要物品: ${importantNames.join(', ')}`,
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
        const results = [];
        for (let i = chat.length - 1; i >= 0 && results.length < limit; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta?.events) continue;

            for (const evt of meta.events) {
                if (evt.isSummary || evt.level === '摘要' || evt._summaryId) continue;
                if (evt.level === '重要' || evt.level === '关键') {
                    results.push({
                        messageIndex: i,
                        similarity: evt.level === '关键' ? 1.0 : 0.95,
                        document: `[结构化] ${evt.level}事件: ${(evt.summary || '').substring(0, 30)}`,
                        source: 'structured',
                    });
                    break;
                }
            }
        }
        return results;
    }

    /**
     * 主题事件搜索：仪式/承诺/失去/揭露/能力变化
     * 结合事件文本和 TERM_CATEGORIES 做精准匹配
     */
    _findThematicEvents(chat, flags, excludeIndices, limit) {
        const activeCategories = [];
        if (flags.ceremony) activeCategories.push('ceremony');
        if (flags.promise) activeCategories.push('promise');
        if (flags.loss) activeCategories.push('loss');
        if (flags.revelation) activeCategories.push('revelation');
        if (flags.power) activeCategories.push('power');

        const searchTerms = new Set();
        for (const cat of activeCategories) {
            if (TERM_CATEGORIES[cat]) {
                for (const t of TERM_CATEGORIES[cat]) searchTerms.add(t);
            }
        }
        if (searchTerms.size === 0) return [];

        const results = [];
        for (let i = chat.length - 1; i >= 0 && results.length < limit; i--) {
            if (excludeIndices.has(i)) continue;
            const meta = chat[i].horae_meta;
            if (!meta?.events) continue;

            for (const evt of meta.events) {
                if (evt.isSummary || evt.level === '摘要' || evt._summaryId) continue;
                const text = evt.summary || '';
                const hits = [...searchTerms].filter(t => text.includes(t));
                if (hits.length > 0) {
                    results.push({
                        messageIndex: i,
                        similarity: 0.90 + Math.min(hits.length, 5) * 0.02,
                        document: `[结构化] 主题事件(${activeCategories.join('+')}): ${hits.join(',')}`,
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

        const lastIdx = Math.max(0, horaeManager.getChat().length - 1 - skipLast);
        const lastMeta = horaeManager.getMessageMeta(lastIdx);
        const stateQuery = this.buildStateQuery(state, lastMeta);

        const merged = new Map();

        if (userQuery) {
            const intentThreshold = Math.max(threshold - 0.25, 0.4);
            const intentResults = await this.search(userQuery, topK * 2, intentThreshold, excludeIndices, pureMode);
            console.log(`[Horae Vector] 意图搜索: ${intentResults.length} 条`);
            for (const r of intentResults) {
                merged.set(r.messageIndex, { ...r, source: 'intent' });
            }
        }

        if (stateQuery) {
            const stateResults = await this.search(stateQuery, topK * 2, threshold, excludeIndices, pureMode);
            console.log(`[Horae Vector] 状态搜索: ${stateResults.length} 条`);
            for (const r of stateResults) {
                const existing = merged.get(r.messageIndex);
                if (!existing || r.similarity > existing.similarity) {
                    merged.set(r.messageIndex, { ...r, source: existing ? 'both' : 'state' });
                }
            }
        }

        let results = Array.from(merged.values());
        results.sort((a, b) => b.similarity - a.similarity);
        results = this._deduplicateResults(results).slice(0, topK);

        console.log(`[Horae Vector] 混合搜索结果: ${results.length} 条`);
        for (const r of results) {
            console.log(`  #${r.messageIndex} sim=${r.similarity.toFixed(4)} [${r.source}] | ${r.document.substring(0, 80)}`);
        }

        return results;
    }

    _buildRecallText(results, currentDate, chat, fullTextCount = 3, fullTextThreshold = 0.9) {
        const lines = ['[记忆回溯——以下为与当前情境相关的历史片段，仅供参考，非当前上下文]'];

        for (let rank = 0; rank < results.length; rank++) {
            const r = results[rank];
            const meta = chat[r.messageIndex]?.horae_meta;
            if (!meta) continue;

            const isFullText = fullTextCount > 0 && rank < fullTextCount && r.similarity >= fullTextThreshold;

            if (isFullText) {
                const rawText = this._extractCleanText(chat[r.messageIndex]?.mes);
                if (rawText) {
                    const timeTag = this._buildTimeTag(meta?.timestamp, currentDate);
                    lines.push(`#${r.messageIndex} ${timeTag ? timeTag + ' ' : ''}[全文回顾]\n${rawText}`);
                    continue;
                }
            }

            const parts = [];

            const timeTag = this._buildTimeTag(meta?.timestamp, currentDate);
            if (timeTag) parts.push(timeTag);

            if (meta?.scene?.location) parts.push(`场景:${meta.scene.location}`);

            const chars = meta?.scene?.characters_present || [];
            const costumes = meta?.costumes || {};
            for (const c of chars) {
                parts.push(costumes[c] ? `${c}(${costumes[c]})` : c);
            }

            if (meta?.events?.length > 0) {
                for (const evt of meta.events) {
                    if (evt.isSummary || evt.level === '摘要') continue;
                    const mark = evt.level === '关键' ? '★' : evt.level === '重要' ? '●' : '○';
                    if (evt.summary) parts.push(`${mark}${evt.summary}`);
                }
            }

            if (meta?.npcs) {
                for (const [name, info] of Object.entries(meta.npcs)) {
                    let s = `NPC:${name}`;
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

    _extractCleanText(mes) {
        if (!mes) return '';
        return mes
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
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

    async _embedApi(texts) {
        const endpoint = `${this._apiUrl}/embeddings`;
        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._apiKey}`,
                },
                body: JSON.stringify({
                    model: this._apiModel,
                    input: texts,
                }),
            });
            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
            }
            const json = await resp.json();
            if (!json.data || !Array.isArray(json.data)) {
                throw new Error('API 返回格式异常：缺少 data 数组');
            }
            const vectors = json.data
                .sort((a, b) => a.index - b.index)
                .map(d => d.embedding);
            return { vectors };
        } catch (err) {
            console.error('[Horae Vector] API embedding 失败:', err);
            throw err;
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
        if (this.db) return;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    store.createIndex('chatId', 'chatId', { unique: false });
                }
            };
            req.onsuccess = () => { this.db = req.result; resolve(); };
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
        return document
            .split(/[\s|,，。！？：；、()\[\]（）\n]+/)
            .filter(t => t.length >= 2 && t.length <= 20);
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
