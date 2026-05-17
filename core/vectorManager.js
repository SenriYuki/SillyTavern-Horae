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
const DB_VERSION = 1;
const STORE_NAME = 'vectors';
const RECALL_CACHE_LIMIT = 16;

const MODEL_CONFIG = {
    'Xenova/bge-small-zh-v1.5': { dimensions: 512, prefix: null },
    'Xenova/multilingual-e5-small': { dimensions: 384, prefix: { query: 'query: ', passage: 'passage: ' } },
};

const QUERY_REWRITE_PROMPT_KEY = 'vectorQueryRewriteSystemPrompt';
const QUERY_REWRITE_TAIL_PROMPT_KEY = 'vectorQueryRewriteTailPrompt';
const QUERY_REWRITE_CONTEXT_LIMIT = 4;
const QUERY_REWRITE_MAX_QUERIES = 6;
const QUERY_REWRITE_MAX_QUERY_LENGTH = 220;
const QUERY_REWRITE_REQUEST_DEFAULTS = Object.freeze({
    temperature: 0.1,
    top_p: 0.8,
    max_tokens: 800,
    stream: false,
    enable_thinking: false,
});

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
        this._lastDebugInfo = null;
        this._recallCache = new Map();
        this._recallCacheLimit = RECALL_CACHE_LIMIT;
        this._keywordTable = EMPTY_KEYWORD_TABLE;
        this._activeKeywordLang = 'en';
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
        this.clearRecallCache('dispose');
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
        this.clearRecallCache('chat-reload');
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
     * 仅保留事件摘要与 RPG 变更，避免时间/地点/人物等上下文噪音
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

        // 单事件一行、段落空行分隔；保留语义边界
        const eventBlock = eventTexts.length > 0
            ? eventTexts.join('\n')
            : '';

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

        if (!eventBlock && rpgLines.length === 0) return '';

        const blocks = [];
        if (eventBlock) blocks.push(eventBlock);
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
        this.clearRecallCache('vector-index-updated');
    }

    async removeMessage(messageIndex) {
        const existing = this.vectors.get(messageIndex);
        if (!existing) return;

        this._updateTermCounts(existing.document, -1);
        this.totalDocuments--;
        this.vectors.delete(messageIndex);
        await this._deleteVector(messageIndex);
        this.clearRecallCache('vector-index-updated');
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

        if (indexed > 0) this.clearRecallCache('vector-batch-reindexed');
        return { indexed, skipped: chat.length - tasks.length };
    }

    async clearIndex() {
        this.vectors.clear();
        this.termCounts.clear();
        this.totalDocuments = 0;
        this.clearRecallCache('vector-index-cleared');
        if (this.chatId) await this._clearVectors();
    }

    clearRecallCache(reason = '') {
        const hadEntries = this._recallCache.size > 0;
        this._recallCache.clear();
        if (hadEntries && reason) {
            console.log(`[Horae Vector] 清空召回缓存: ${reason}`);
        }
    }

    _getRecallCache(cacheKey) {
        if (!cacheKey) return null;
        const entry = this._recallCache.get(cacheKey);
        if (!entry) return null;
        this._recallCache.delete(cacheKey);
        this._recallCache.set(cacheKey, entry);
        return this._clonePlain(entry);
    }

    _setRecallCache(cacheKey, entry) {
        if (!cacheKey || !entry) return;
        if (this._recallCache.has(cacheKey)) this._recallCache.delete(cacheKey);
        this._recallCache.set(cacheKey, this._clonePlain(entry));
        while (this._recallCache.size > this._recallCacheLimit) {
            const oldestKey = this._recallCache.keys().next().value;
            if (oldestKey === undefined) break;
            this._recallCache.delete(oldestKey);
        }
    }

    _clonePlain(value) {
        if (value === null || value === undefined) return value;
        if (typeof globalThis?.structuredClone === 'function') {
            try {
                return globalThis.structuredClone(value);
            } catch (_) { /* fall through */ }
        }
        return JSON.parse(JSON.stringify(value));
    }

    _applyCachedRecallDebugInfo(entry) {
        const debugInfo = this._clonePlain(entry?.debugInfo) || {};
        const now = Date.now();
        const prevCache = debugInfo.cache || {};
        const originalTimestamp = prevCache.originalTimestamp || debugInfo.computedAt || debugInfo.timestamp || null;
        debugInfo.timestamp = now;
        debugInfo.cache = {
            ...prevCache,
            key: entry?.keySig || prevCache.key || '',
            hit: true,
            size: this._recallCache.size,
            limit: this._recallCacheLimit,
            originalTimestamp,
            reusedAt: now,
        };
        this._lastDebugInfo = debugInfo;
    }

    _buildRecallCacheKey(chat, state, skipLast, settings, excludeIndices, queryInfo = {}) {
        const effectiveEnd = Math.max(0, (Array.isArray(chat) ? chat.length : 0) - Math.max(0, skipLast));
        const payload = {
            chatId: this.chatId || '',
            effectiveEnd,
            indexedCount: this.vectors.size,
            totalDocuments: this.totalDocuments,
            queries: {
                user: queryInfo.userQuery || '',
                state: queryInfo.stateQuery || '',
                merged: queryInfo.mergedQuery || '',
            },
            exclude: [...(excludeIndices || [])].sort((a, b) => a - b),
            stateSig: this._buildRecallStateSignature(state),
            chatSig: this._buildRecallChatSignature(chat, effectiveEnd),
            settingsSig: this._buildRecallSettingsSignature(settings),
            modelSig: this._buildRecallModelSignature(settings),
            keywordLang: this._activeKeywordLang || 'en',
        };
        return JSON.stringify(payload);
    }

    _buildRecallStateSignature(state) {
        const present = [...new Set(state?.scene?.characters_present || [])]
            .filter(Boolean)
            .sort((a, b) => String(a).localeCompare(String(b)));
        const costumePairs = present.map(name => [name, state?.costumes?.[name] || '']);
        return this._hashString(JSON.stringify({
            timestamp: {
                story_date: state?.timestamp?.story_date || '',
                story_time: state?.timestamp?.story_time || '',
            },
            scene: {
                location: state?.scene?.location || '',
                characters_present: present,
            },
            costumes: costumePairs,
        }));
    }

    _buildRecallChatSignature(chat, endExclusive = null) {
        if (!Array.isArray(chat) || chat.length === 0) return 'empty';
        const end = Math.max(0, Math.min(
            Number.isInteger(endExclusive) ? endExclusive : chat.length,
            chat.length
        ));
        if (end === 0) return 'empty';
        const parts = [];
        for (let i = 0; i < end; i++) {
            parts.push(this._buildRecallMessageSignature(chat[i], i));
        }
        const forward = parts.join('|');
        const backward = [...parts].reverse().join('|');
        return `${end}:${this._hashString(forward)}:${this._hashString(backward)}`;
    }

    _buildRecallMessageSignature(msg, index) {
        if (!msg) return `missing:${index}`;
        if (msg.is_user) {
            return `u:${index}:${this._hashString(this.cleanUserMessage(msg.mes || ''))}`;
        }
        const metaSig = this._hashString(JSON.stringify(this._buildRecallMetaSnapshot(msg.horae_meta)));
        const textSig = this._hashString(String(msg.mes || ''));
        return `${msg.is_system ? 's' : 'a'}:${index}:${textSig}:${metaSig}`;
    }

    _buildRecallMetaSnapshot(meta) {
        if (!meta) return null;
        const sortEntries = (obj) => Object.entries(obj || {})
            .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
        return {
            skipHorae: !!meta._skipHorae,
            timestamp: {
                story_date: meta?.timestamp?.story_date || '',
                story_time: meta?.timestamp?.story_time || '',
            },
            scene: {
                location: meta?.scene?.location || '',
                scene_desc: meta?.scene?.scene_desc || '',
                characters_present: [...new Set(meta?.scene?.characters_present || [])]
                    .filter(Boolean)
                    .sort((a, b) => String(a).localeCompare(String(b))),
            },
            costumes: sortEntries(meta?.costumes).map(([name, value]) => [name, value || '']),
            mood: sortEntries(meta?.mood).map(([name, value]) => [name, value || '']),
            npcs: sortEntries(meta?.npcs).map(([name, info]) => [name, {
                description: info?.description || '',
                relationship: info?.relationship || '',
                gender: info?.gender || '',
                age: info?.age || '',
                race: info?.race || '',
                occupation: info?.occupation || '',
            }]),
            items: sortEntries(meta?.items).map(([name, info]) => [name, {
                icon: info?.icon || '',
                holder: info?.holder || '',
                location: info?.location || '',
                importance: info?.importance || '',
                quantity: info?.quantity ?? '',
                description: info?.description || '',
            }]),
            events: (meta?.events || []).map(evt => ({
                level: evt?.level || '',
                summary: evt?.summary || '',
                isSummary: !!evt?.isSummary,
                summaryId: evt?._summaryId || '',
                isImportant: !!evt?.is_important,
            })),
            rpg: this._buildRecallRpgSnapshot(meta?._rpgChanges),
        };
    }

    _buildRecallRpgSnapshot(rpg) {
        if (!rpg) return null;
        const sortEntries = (obj) => Object.entries(obj || {})
            .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
        return {
            levels: sortEntries(rpg.levels).map(([name, value]) => [name, value ?? '']),
            equipment: (rpg.equipment || []).map(eq => [eq?.owner || '', eq?.name || '', eq?.slot || '']),
            unequip: (rpg.unequip || []).map(eq => [eq?.owner || '', eq?.name || '', eq?.slot || '']),
            baseChanges: (rpg.baseChanges || []).map(change => [
                change?.path || '',
                change?.field || '',
                change?.value ?? '',
            ]),
        };
    }

    _buildRecallSettingsSignature(settings) {
        const rewriteConfig = this._resolveQueryRewriteConfig(settings);
        const rewriteEnabled = settings?.vectorQueryRewriteEnabled === true;
        return this._hashString(JSON.stringify({
            topK: settings.vectorTopK || 5,
            threshold: settings.vectorThreshold ?? 0.72,
            pureMode: !!settings.vectorPureMode,
            fullTextCount: settings.vectorFullTextCount ?? 3,
            fullTextThreshold: settings.vectorFullTextThreshold ?? 0.9,
            stripTags: settings.vectorStripTags || '',
            rerankEnabled: !!settings.vectorRerankEnabled,
            rerankModel: settings.vectorRerankModel || '',
            rerankFullText: !!settings.vectorRerankFullText,
            rerankCandidates: settings.vectorRerankCandidates || 25,
            rerankRecallThreshold: settings.vectorRerankRecallThreshold ?? 0.3,
            rerankMinScore: this._effectiveRerankMinScore(settings),
            queryRewriteEnabled: rewriteEnabled,
            queryRewriteEndpoint: rewriteEnabled ? (rewriteConfig.endpoint || '') : '',
            queryRewriteModel: rewriteEnabled ? (rewriteConfig.model || '') : '',
            queryRewriteConfigured: rewriteEnabled && !!(rewriteConfig.endpoint && rewriteConfig.apiKey && rewriteConfig.model),
            queryRewriteLang: rewriteEnabled ? (this._activeKeywordLang || 'en') : '',
        }));
    }

    _buildRecallModelSignature(settings) {
        return this._hashString(JSON.stringify({
            isApiMode: !!this.isApiMode,
            modelName: this.modelName || '',
            dimensions: this.dimensions || 0,
            apiUrl: this.isApiMode ? (this._apiUrl || '') : '',
            apiModel: this.isApiMode ? (this._apiModel || '') : '',
            rerankUrl: settings.vectorRerankUrl || settings.vectorApiUrl || '',
            rerankModel: settings.vectorRerankModel || '',
        }));
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
        // if (stateQuery) sections.push(`[当前情境] ${stateQuery}`);
        // if (userQuery) sections.push(`[玩家输入] ${userQuery}`);
        if (stateQuery) sections.push(`在"${stateQuery}"的背景下`);
        if (userQuery) sections.push(`玩家试图 ${userQuery}`);
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
     * @param {Map<number, Set<string>>} excludeReasonMap - 排除原因映射（可选）
     * @returns {Promise<Array<{messageIndex: number, similarity: number, document: string}>>}
     */
    async search(queryText, topK = 5, threshold = 0.72, excludeIndices = new Set(), pureMode = false, excludeReasonMap = null) {
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
        const excludedByIndex = [];
        const belowThreshold = [];
        let searchedCount = 0;

        const resolveExcludeReasons = (msgIdx) => {
            if (!(excludeReasonMap instanceof Map)) return ['unknown'];
            const reasons = excludeReasonMap.get(msgIdx);
            if (!reasons) return ['unknown'];
            if (Array.isArray(reasons)) return reasons.length > 0 ? reasons : ['unknown'];
            if (reasons instanceof Set) return reasons.size > 0 ? [...reasons] : ['unknown'];
            return [String(reasons)];
        };

        for (const [msgIdx, entry] of this.vectors) {
            if (excludeIndices.has(msgIdx)) {
                excludedByIndex.push({ messageIndex: msgIdx, reasons: resolveExcludeReasons(msgIdx) });
                continue;
            }
            searchedCount++;
            const sim = this._dotProduct(queryVec, entry.vector);
            allScored.push({ messageIndex: msgIdx, similarity: sim, document: entry.document });
            if (sim >= threshold) {
                scored.push({ messageIndex: msgIdx, similarity: sim, document: entry.document });
            } else {
                belowThreshold.push({ messageIndex: msgIdx, similarity: sim, document: entry.document });
            }
        }

        if (excludedByIndex.length > 0) {
            excludedByIndex.sort((a, b) => a.messageIndex - b.messageIndex);
            console.log(`[Horae Vector] 排除索引过滤: ${excludedByIndex.length} 条未参与相似度计算`);
            for (const x of excludedByIndex) {
                console.log(`  #${x.messageIndex} | reason=${x.reasons.join('+')}`);
            }
        }

        allScored.sort((a, b) => b.similarity - a.similarity);
        const bestSim = allScored.length > 0 ? allScored[0].similarity : 0;
        console.log(`[Horae Vector] 搜索了 ${searchedCount} 条 | 最高相似度=${bestSim.toFixed(4)} | 超过阈值(${threshold}): ${scored.length} 条`);
        if (belowThreshold.length > 0) {
            belowThreshold.sort((a, b) => b.similarity - a.similarity);
            console.log(`[Horae Vector] 阈值过滤: ${belowThreshold.length} 条低于阈值(${threshold})`);
            for (const x of belowThreshold) {
                console.log(`  #${x.messageIndex} sim=${x.similarity.toFixed(4)} | reason=below-threshold`);
            }
        }
        if (scored.length === 0 && allScored.length > 0) {
            console.log(`[Horae Vector] 阈值下 Top-5 候选:`);
            for (const c of allScored.slice(0, 5)) {
                console.log(`  #${c.messageIndex} sim=${c.similarity.toFixed(4)} | ${c.document.substring(0, 60)}`);
            }
        }

        scored.sort((a, b) => b.similarity - a.similarity);

        const adjusted = pureMode ? scored : this._adjustThresholdByFrequency(scored, threshold);
        if (!pureMode) {
            const adjustedIds = new Set(adjusted.map(x => x.messageIndex));
            const removedByFrequency = scored.filter(x => !adjustedIds.has(x.messageIndex));
            console.log(`[Horae Vector] 频率过滤后: ${adjusted.length} 条 | 过滤 ${removedByFrequency.length} 条`);
            for (const x of removedByFrequency) {
                console.log(`  #${x.messageIndex} sim=${x.similarity.toFixed(4)} | reason=frequency-adjusted-threshold`);
            }
        }

        const deduped = this._deduplicateResults(adjusted);
        const dedupedIds = new Set(deduped.map(x => x.messageIndex));
        const removedByDedup = adjusted.filter(x => !dedupedIds.has(x.messageIndex));
        console.log(`[Horae Vector] 去重后: ${deduped.length} 条 | 过滤 ${removedByDedup.length} 条`);
        for (const x of removedByDedup) {
            console.log(`  #${x.messageIndex} sim=${x.similarity.toFixed(4)} | reason=deduplicated`);
        }

        return deduped.slice(0, topK);
    }

    /**
     * 多路 Query Rewrite 向量检索：每个 Q 独立召回，再按 messageIndex 合并去重。
     * @param {string[]} queryTexts
     * @param {number} topK
     * @param {number} threshold
     * @param {Set<number>} excludeIndices
     * @param {boolean} pureMode
     * @param {Map<number, Set<string>>} excludeReasonMap
     */
    async searchQueryVariants(queryTexts, topK = 5, threshold = 0.72, excludeIndices = new Set(), pureMode = false, excludeReasonMap = null) {
        if (!this.isReady || this.vectors.size === 0) return [];

        const queries = this._normalizeQueryRewriteQueries(queryTexts);
        if (queries.length === 0) return [];

        const prepared = queries.map(q => this._prepareText(q, true));
        console.log(`[Horae Vector] 开始 Query Rewrite 多路 embedding 查询: ${queries.length} 个 Q`);
        console.log(`[Horae Vector] 多路检索阈值: ${Number(threshold).toFixed(4)} | topK=${topK} | pureMode=${!!pureMode}`);

        const result = await this._embed(prepared);
        if (!result?.vectors?.length) {
            console.warn('[Horae Vector] Query Rewrite embedding 返回空结果:', result);
            return [];
        }

        const resolveExcludeReasons = (msgIdx) => {
            if (!(excludeReasonMap instanceof Map)) return ['unknown'];
            const reasons = excludeReasonMap.get(msgIdx);
            if (!reasons) return ['unknown'];
            if (Array.isArray(reasons)) return reasons.length > 0 ? reasons : ['unknown'];
            if (reasons instanceof Set) return reasons.size > 0 ? [...reasons] : ['unknown'];
            return [String(reasons)];
        };

        const excludedByIndex = [];
        for (const msgIdx of excludeIndices || []) {
            excludedByIndex.push({ messageIndex: msgIdx, reasons: resolveExcludeReasons(msgIdx) });
        }
        if (excludedByIndex.length > 0) {
            excludedByIndex.sort((a, b) => a.messageIndex - b.messageIndex);
            console.log(`[Horae Vector] 多路检索排除索引: ${excludedByIndex.length} 条未参与相似度计算`);
            for (const x of excludedByIndex) {
                console.log(`  #${x.messageIndex} | reason=${x.reasons.join('+')}`);
            }
        }

        const merged = new Map();
        const RRF_K = 60;
        const perQueryLimit = Math.max(1, topK);
        const vectorCount = Math.min(queries.length, result.vectors.length);

        for (let qi = 0; qi < vectorCount; qi++) {
            const queryVec = result.vectors[qi];
            if (!Array.isArray(queryVec)) continue;

            const scored = [];
            const allScored = [];
            let searchedCount = 0;

            for (const [msgIdx, entry] of this.vectors) {
                if (excludeIndices.has(msgIdx)) continue;
                searchedCount++;
                const sim = this._dotProduct(queryVec, entry.vector);
                const row = { messageIndex: msgIdx, similarity: sim, document: entry.document };
                allScored.push(row);
                if (sim >= threshold) scored.push(row);
            }

            allScored.sort((a, b) => b.similarity - a.similarity);
            scored.sort((a, b) => b.similarity - a.similarity);
            const adjusted = pureMode ? scored : this._adjustThresholdByFrequency(scored, threshold);
            const deduped = this._deduplicateResults(adjusted).slice(0, perQueryLimit);
            const bestSim = allScored.length > 0 ? allScored[0].similarity : 0;
            console.log(`[Horae Vector] Q${qi + 1}: 搜索 ${searchedCount} 条 | 最高相似度=${bestSim.toFixed(4)} | 过阈值=${scored.length} | 入池=${deduped.length}`);
            console.log(`  Q${qi + 1}: ${queries[qi]}`);

            deduped.forEach((r, rank) => {
                const hit = {
                    queryIndex: qi,
                    query: queries[qi],
                    similarity: r.similarity,
                    rank: rank + 1,
                };
                const contribution = 1 / (RRF_K + rank);
                const existing = merged.get(r.messageIndex);
                if (!existing) {
                    merged.set(r.messageIndex, {
                        ...r,
                        queryHits: [hit],
                        _queryFusionScore: contribution,
                    });
                    return;
                }

                existing.queryHits.push(hit);
                existing._queryFusionScore = (existing._queryFusionScore || 0) + contribution;
                if (r.similarity > existing.similarity) {
                    existing.similarity = r.similarity;
                    existing.document = r.document;
                }
            });
        }

        const results = [...merged.values()]
            .sort((a, b) => ((b._queryFusionScore || 0) - (a._queryFusionScore || 0)) || (b.similarity - a.similarity))
            .slice(0, topK);

        console.log(`[Horae Vector] Query Rewrite 多路合并: ${results.length} 条`);
        for (const r of results) {
            const hitSummary = (r.queryHits || [])
                .map(h => `Q${h.queryIndex + 1}#${h.rank}:${h.similarity.toFixed(3)}`)
                .join(', ');
            console.log(`  #${r.messageIndex} sim=${r.similarity.toFixed(4)} rrf=${(r._queryFusionScore || 0).toFixed(4)} | ${hitSummary}`);
        }

        return results;
    }

    _formatRewriteQuerySource(queryHits) {
        if (!Array.isArray(queryHits) || queryHits.length === 0) return 'Q';
        const indices = [...new Set(queryHits
            .map(hit => Number.isInteger(hit?.queryIndex) ? hit.queryIndex : null)
            .filter(idx => idx !== null && idx >= 0))]
            .sort((a, b) => a - b);
        if (indices.length === 0) return 'Q';
        return indices.map(idx => `Q${idx + 1}`).join(',');
    }

    _appendSourceLabel(source, label) {
        const base = String(source || '').trim();
        if (!base) return label;
        return /^Q\d+(?:,Q\d+)*$/.test(base)
            ? `${base},${label}`
            : `${base}+${label}`;
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
    async generateRecallPrompt(horaeManager, skipLast, settings, extraExcludeIndices = new Set(), options = {}) {
        const chat = horaeManager.getChat();
        const state = horaeManager.getLatestState(skipLast);
        const effectiveEnd = Math.max(0, chat.length - Math.max(0, skipLast));
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
        const excludeReasonMap = new Map();
        const addExcludeReason = (idx, reason) => {
            if (!excludeReasonMap.has(idx)) excludeReasonMap.set(idx, new Set());
            excludeReasonMap.get(idx).add(reason);
        };
        let visibleExcludedCount = 0;
        for (let i = 0; i < effectiveEnd; i++) {
            const msg = chat[i];
            if (!msg || msg.is_user || msg.is_hidden) continue;
            if (!msg.horae_meta || msg.horae_meta._skipHorae) continue;
            excludeIndices.add(i);
            addExcludeReason(i, 'visible-message');
            visibleExcludedCount++;
        }
        for (let i = Math.max(0, effectiveEnd - EXCLUDE_RECENT); i < effectiveEnd; i++) {
            excludeIndices.add(i);
            addExcludeReason(i, 'recent-window');
        }
        if (extraExcludeIndices && typeof extraExcludeIndices[Symbol.iterator] === 'function') {
            for (const idx of extraExcludeIndices) {
                if (Number.isInteger(idx) && idx >= 0 && idx < effectiveEnd) {
                    excludeIndices.add(idx);
                    addExcludeReason(idx, 'already-in-prompt');
                }
            }
        }
        const promptExcludedCount = [...excludeReasonMap.values()]
            .reduce((count, reasons) => count + (reasons.has('already-in-prompt') ? 1 : 0), 0);
        if (visibleExcludedCount > 0) {
            console.log(`[Horae Vector] 排除未隐藏楼层: ${visibleExcludedCount} 条`);
        }
        if (promptExcludedCount > 0) {
            console.log(`[Horae Vector] 额外排除已在Prompt中的楼层: ${promptExcludedCount} 条`);
        }
        if (excludeIndices.size > 0) {
            const sortedExcluded = [...excludeIndices].sort((a, b) => a - b);
            console.log(`[Horae Vector] 本次检索排除楼层明细: ${sortedExcluded.length} 条`);
            for (const idx of sortedExcluded) {
                const reasons = [...(excludeReasonMap.get(idx) || ['unknown'])];
                console.log(`  #${idx} | reason=${reasons.join('+')}`);
            }
        }

        const cacheKey = this._buildRecallCacheKey(
            chat,
            state,
            skipLast,
            settings,
            excludeIndices,
            {
                userQuery,
                stateQuery: stateQueryForRecall,
                mergedQuery: mergedRecallQuery,
            }
        );
        const cacheKeySig = this._hashString(cacheKey);
        const cachedRecall = this._getRecallCache(cacheKey);
        if (cachedRecall) {
            console.log(`[Horae Vector] 召回缓存命中: key=${cacheKeySig} / size=${this._recallCache.size}`);
            this._applyCachedRecallDebugInfo({
                ...cachedRecall,
                keySig: cachedRecall.keySig || cacheKeySig,
            });
            return cachedRecall.recallText || '';
        }
        console.log(`[Horae Vector] 召回缓存未命中: key=${cacheKeySig}`);

        const rewriteInfo = await this._resolveRecallRewriteInfo(chat, settings, options);
        const rewriteQueries = rewriteInfo?.queries || [];
        const rewriteIntent = rewriteInfo?.intent || '';

        const merged = new Map();

        const pureMode = !!settings.vectorPureMode;
        if (pureMode) console.log('[Horae Vector] 纯向量模式已启用，跳过关键词启发式');
        if (useRerank) console.log(`[Horae Vector] Rerank 模式：embedding 召回阈值=${recallThreshold} / 候选=${recallTopK}`);

        const structuredResults = this._structuredQuery(userQuery, chat, state, excludeIndices, topK, pureMode);
        console.log(`[Horae Vector] 结构化查询: ${structuredResults.length} 条命中`);
        for (const r of structuredResults) {
            merged.set(r.messageIndex, r);
        }

        const hybridResults = await this._hybridSearch(
            userQuery,
            state,
            horaeManager,
            skipLast,
            settings,
            excludeIndices,
            excludeReasonMap,
            recallTopK,
            recallThreshold,
            pureMode,
            { rewriteQueries }
        );
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
                    r.source = this._appendSourceLabel(r.source, 'char');
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
            const rerankQuery = rewriteIntent || mergedRecallQuery || userQuery || this.buildStateQuery(state, null);
            const rerankQuerySource = rewriteIntent ? 'rewrite-intent' : 'fallback-merged';
            if (rerankQuery) {
                try {
                    const useFullText = !!settings.vectorRerankFullText;
                    const _stripTags = settings.vectorStripTags || '';
                    const currentDateForRerank = state.timestamp?.story_date;
                    // Rerank 文档 = 时间头 + 结构化 metadata + 可选全文片段（全文模式）
                    const rerankDocs = rerankCandidates.map(r => {
                        const meta = chat[r.messageIndex]?.horae_meta;
                        const timeTag = this._buildTimeTag(meta?.timestamp, currentDateForRerank);
                        const head = timeTag ? `${timeTag}\n` : '';
                        const baseDoc = r.document || '';
                        if (useFullText) {
                            const fullText = this._extractCleanText(chat[r.messageIndex]?.mes, _stripTags);
                            const snippet = fullText || '';
                            if (snippet) return `${head}${baseDoc}\n---\n${snippet}`;
                            return `${head}${baseDoc}`;
                        }
                        return `${head}${baseDoc}`;
                    });
                    console.log(`[Horae Vector] Rerank 输入: ${rerankCandidates.length} 条候选 / 模式=${useFullText ? '全文精排' : '摘要排序'}`);

                    let rerankPlan = null;
                    let rerankDocsForDebug = rerankDocs;
                    let reranked = [];
                    if (useFullText) {
                        rerankPlan = this._buildRerankBatchPlan(rerankQuery, rerankDocs, 32768);
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
                        results = passed.map(rr => {
                            const original = rerankCandidates[rr.index];
                            return {
                                ...original,
                                similarity: rr.relevance_score,
                                source: (original.source || '') + (useFullText ? '+rerank-full' : '+rerank'),
                            };
                        });
                        rerankDebug = {
                            enabled: true,
                            query: rerankQuery,
                            querySource: rerankQuerySource,
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
                    rerankDebug = { enabled: true, query: rerankQuery, querySource: rerankQuerySource, error: err.message };
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

        const debugTimestamp = Date.now();
        this._lastDebugInfo = {
            timestamp: debugTimestamp,
            computedAt: debugTimestamp,
            chatId: this.chatId,
            indexedCount: this.vectors.size,
            query: {
                user: userQuery,
                state: stateQueryForRecall,
                merged: mergedRecallQuery,
                rewriteIntent,
                rewriteQueries,
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
                queryHits: r.queryHits || null,
                docPreview: (r.document || '').substring(0, 120),
            })),
            rewrite: rewriteInfo,
            relevantChars: [...relevantChars],
            rerank: rerankDebug,
            final: results.map(r => ({
                messageIndex: r.messageIndex,
                similarity: r.similarity,
                source: r.source,
            })),
            recallText,
            cache: {
                key: cacheKeySig,
                hit: false,
                size: this._recallCache.size,
                limit: this._recallCacheLimit,
            },
        };

        this._setRecallCache(cacheKey, {
            keySig: cacheKeySig,
            recallText,
            debugInfo: this._lastDebugInfo,
        });
        if (this._lastDebugInfo?.cache) {
            this._lastDebugInfo.cache.size = this._recallCache.size;
        }

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

    async _hybridSearch(userQuery, state, horaeManager, skipLast, settings, excludeIndices, excludeReasonMap, topK, threshold, pureMode = false, options = {}) {
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

        const rewriteQueries = Array.isArray(options?.rewriteQueries) ? options.rewriteQueries : [];
        let results = [];
        if (rewriteQueries.length > 0) {
            results = await this.searchQueryVariants(
                rewriteQueries,
                topK * 2,
                mergedThreshold,
                excludeIndices,
                pureMode,
                excludeReasonMap
            );
            results = results.map(r => ({ ...r, source: this._formatRewriteQuerySource(r.queryHits) }));
            console.log(`[Horae Vector] Query Rewrite 多路搜索: queries=${rewriteQueries.length} / 命中=${results.length} 条 | threshold=${mergedThreshold.toFixed(2)}`);
        } else {
            results = await this.search(mergedQuery, topK * 2, mergedThreshold, excludeIndices, pureMode, excludeReasonMap);
            results = results.map(r => ({ ...r, source: 'merged' }));
            console.log(`[Horae Vector] 合并查询搜索: ${results.length} 条 | threshold=${mergedThreshold.toFixed(2)}`);
        }

        results.sort((a, b) => ((b._queryFusionScore || 0) - (a._queryFusionScore || 0)) || (b.similarity - a.similarity));
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
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<horae>[\s\S]+?<\/horae>/gi, '')
            .replace(/<horaeevent>[\s\S]+?<\/horaeevent>/gi, '')
            .replace(/[\r\n]+/g, "");
        if (stripTags) {
            const tags = stripTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
            for (const tag of tags) {
                const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                text = text.replace(new RegExp(`<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?</${escaped}>`, 'gi'), '');
            }
        }
        // return text.replace(/<[^>]*>/g, '').trim();
        return text;
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
            case 'tomorrow': return '(明天)';
            case 'day_after_tomorrow': return '(后天)';
            case 'in_three_days': return '(大后天)';
            case 'last_weekday': return `(上周${WD[meta.weekday]})`;
            case 'week_before_last_weekday': return `(上上周${WD[meta.weekday]})`;
            case 'next_weekday': return `(下周${WD[meta.weekday]})`;
            case 'week_after_next_weekday': return `(下下周${WD[meta.weekday]})`;
            case 'last_month_day': return `(上个月${meta.day}号)`;
            case 'next_month_day': return `(下个月${meta.day}号)`;
            case 'last_year_date': return `(去年${meta.month}月)`;
            case 'year_before_last_date': return `(前年${meta.month}月)`;
            case 'days_ago': return `(${meta.value}天前)`;
            case 'days_later': return `(${meta.value}天后)`;
            case 'weeks_ago': return `(${meta.value}周前)`;
            case 'weeks_later': return `(${meta.value}周后)`;
            case 'months_ago': return `(${meta.value}个月前)`;
            case 'months_later': return `(${meta.value}个月后)`;
            case 'years_months_ago': return `(${meta.years}年${meta.months}个月前)`;
            case 'years_months_later': return `(${meta.years}年${meta.months}个月后)`;
            case 'years_ago': return `(${meta.years}年前)`;
            case 'years_later': return `(${meta.years}年后)`;
            default: return '';
        }
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

    async rewriteQuery(chat, settings) {
        const config = this._resolveQueryRewriteConfig(settings);
        if (!config.endpoint) throw new Error('Query Rewrite API 地址未配置');
        if (!config.apiKey) throw new Error('Query Rewrite API 密钥未配置，且无法复用 Embedding API 密钥');
        if (!config.model) throw new Error('Query Rewrite 模型未配置');

        const conversationMessages = this._collectQueryRewriteConversation(chat, settings, QUERY_REWRITE_CONTEXT_LIMIT);
        const latestUserMessage = conversationMessages[conversationMessages.length - 1];
        if (!latestUserMessage || latestUserMessage.role !== 'user') {
            throw new Error('未找到可用于 Query Rewrite 的最新用户消息');
        }
        const messages = this._buildQueryRewriteMessages(chat, settings, conversationMessages);

        const body = {
            model: config.model,
            temperature: QUERY_REWRITE_REQUEST_DEFAULTS.temperature,
            top_p: QUERY_REWRITE_REQUEST_DEFAULTS.top_p,
            max_tokens: QUERY_REWRITE_REQUEST_DEFAULTS.max_tokens,
            stream: QUERY_REWRITE_REQUEST_DEFAULTS.stream,
            enable_thinking: QUERY_REWRITE_REQUEST_DEFAULTS.enable_thinking,
            messages,
        };

        let resp;
        try {
            resp = await fetch(config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify(body),
                signal: (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function')
                    ? AbortSignal.timeout(30000)
                    : undefined,
            });
        } catch (err) {
            const wrapped = new Error(err?.message || 'Network error');
            if (err instanceof TypeError) wrapped.code = 'NETWORK';
            else if (/timeout|timed out/i.test(err?.message || '')) wrapped.code = 'TIMEOUT';
            else wrapped.code = 'UNKNOWN';
            wrapped.cause = err;
            throw wrapped;
        }

        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            const wrapped = new Error(`Query Rewrite API ${resp.status}: ${errText.slice(0, 200)}`);
            wrapped.status = resp.status;
            wrapped.body = errText.slice(0, 500);
            throw wrapped;
        }

        let json;
        try {
            json = await resp.json();
        } catch (err) {
            const wrapped = new Error(err?.message || 'Invalid JSON response');
            wrapped.code = 'FORMAT';
            throw wrapped;
        }

        const rawText = this._extractChatCompletionText(json);
        const parsed = this._parseQueryRewriteResponse(rawText);

        return {
            endpoint: config.endpoint,
            model: config.model,
            messages,
            rawText,
            intent: parsed.intent,
            queries: parsed.queries,
            usage: json?.usage || null,
            response: json,
        };
    }

    prepareRecallRewrite(chat, settings) {
        return this._tryRewriteRecallQuery(chat, settings);
    }

    async _resolveRecallRewriteInfo(chat, settings, options = {}) {
        if (options?.rewriteInfo) {
            return this._normalizeRecallRewriteInfo(options.rewriteInfo, settings);
        }
        if (options?.rewritePromise) {
            try {
                const info = await options.rewritePromise;
                return this._normalizeRecallRewriteInfo(info, settings);
            } catch (err) {
                console.warn('[Horae Vector] 预启动 Query Rewrite 失败，回退合并查询:', err?.message || err);
                return this._buildQueryRewriteBaseInfo(settings, {
                    enabled: settings?.vectorQueryRewriteEnabled === true,
                    error: err?.message || String(err),
                    code: err?.code || null,
                    status: err?.status || null,
                });
            }
        }
        return this._tryRewriteRecallQuery(chat, settings);
    }

    _buildQueryRewriteBaseInfo(settings, overrides = {}) {
        const config = this._resolveQueryRewriteConfig(settings);
        const enabled = settings?.vectorQueryRewriteEnabled === true;
        return {
            enabled,
            configured: enabled && !!(config.endpoint && config.apiKey && config.model),
            endpoint: config.endpoint || '',
            model: config.model || '',
            intent: '',
            queries: [],
            ...overrides,
        };
    }

    _normalizeRecallRewriteInfo(info, settings) {
        const base = this._buildQueryRewriteBaseInfo(settings);
        const merged = { ...base, ...(info || {}) };
        return {
            ...merged,
            intent: this._sanitizeQueryRewriteText(merged.intent || ''),
            queries: this._normalizeQueryRewriteQueries(merged.queries || []),
        };
    }

    async _tryRewriteRecallQuery(chat, settings) {
        const config = this._resolveQueryRewriteConfig(settings);
        const baseInfo = this._buildQueryRewriteBaseInfo(settings);

        if (settings?.vectorQueryRewriteEnabled !== true) {
            return { ...baseInfo, enabled: false, reason: 'disabled' };
        }

        if (!baseInfo.configured) {
            const missing = [];
            if (!config.endpoint) missing.push('endpoint');
            if (!config.apiKey) missing.push('apiKey');
            if (!config.model) missing.push('model');
            return { ...baseInfo, reason: `missing-${missing.join('-') || 'config'}` };
        }

        try {
            const rewritten = await this.rewriteQuery(chat, settings);
            const queries = this._normalizeQueryRewriteQueries(rewritten.queries);
            console.log(`[Horae Vector] Query Rewrite 完成: intent=${rewritten.intent ? 'yes' : 'no'} / queries=${queries.length}`);
            for (let i = 0; i < queries.length; i++) {
                console.log(`  Q${i + 1}: ${queries[i]}`);
            }
            if (rewritten.intent) console.log(`  INTENT: ${rewritten.intent}`);

            return {
                ...baseInfo,
                enabled: true,
                intent: rewritten.intent || '',
                queries,
                rawText: rewritten.rawText || '',
                usage: rewritten.usage || null,
            };
        } catch (err) {
            console.warn('[Horae Vector] Query Rewrite 失败，回退合并查询:', err?.message || err);
            return {
                ...baseInfo,
                enabled: true,
                error: err?.message || String(err),
                code: err?.code || null,
                status: err?.status || null,
            };
        }
    }

    _resolveQueryRewriteConfig(settings) {
        const rewriteUrl = String(settings?.vectorQueryRewriteUrl || '').trim();
        const rewriteKey = String(settings?.vectorQueryRewriteKey || '').trim();
        const embedUrl = String(settings?.vectorApiUrl || '').trim();
        const embedKey = String(settings?.vectorApiKey || '').trim();

        return {
            endpoint: this._buildChatCompletionsEndpoint(rewriteUrl || embedUrl),
            apiKey: rewriteKey || embedKey,
            model: String(settings?.vectorQueryRewriteModel || '').trim(),
        };
    }

    _buildChatCompletionsEndpoint(rawUrl) {
        const base = String(rawUrl || '')
            .trim()
            .replace(/\/+$/, '')
            .replace(/\/embeddings$/i, '')
            .replace(/\/chat\/completions$/i, '');
        return base ? `${base}/chat/completions` : '';
    }

    _buildQueryRewriteMessages(chat, settings, conversationMessages = null) {
        const systemPrompt = this._getQueryRewriteSystemPrompt(settings);
        const tailPrompt = this._getQueryRewriteTailPrompt(settings);
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        const conversation = Array.isArray(conversationMessages)
            ? conversationMessages
            : this._collectQueryRewriteConversation(chat, settings, QUERY_REWRITE_CONTEXT_LIMIT);
        messages.push(...conversation);
        if (tailPrompt) {
            messages.push({ role: 'user', content: tailPrompt });
        }
        return messages;
    }

    _getQueryRewriteSystemPrompt(settings) {
        const lang = detectEffectiveAiLang(settings);
        return getPromptDefaultSync(lang, QUERY_REWRITE_PROMPT_KEY)
            || getPromptDefaultSync('en', QUERY_REWRITE_PROMPT_KEY)
            || '';
    }

    _getQueryRewriteTailPrompt(settings) {
        const lang = detectEffectiveAiLang(settings);
        return getPromptDefaultSync(lang, QUERY_REWRITE_TAIL_PROMPT_KEY)
            || getPromptDefaultSync('en', QUERY_REWRITE_TAIL_PROMPT_KEY)
            || '';
    }

    _collectQueryRewriteConversation(chat, settings, limit = 4) {
        const stripTags = settings?.vectorStripTags || '';
        const collected = [];
        let expectUser = true;

        for (let i = (Array.isArray(chat) ? chat.length : 0) - 1; i >= 0 && collected.length < limit; i--) {
            const msg = chat[i];
            if (!msg || msg.is_hidden || typeof msg.is_user !== 'boolean') continue;
            if (!!msg.is_user !== expectUser) continue;

            const content = this._extractConversationText(msg.mes, stripTags);
            if (!content) continue;

            collected.push({
                index: i,
                role: msg.is_user ? 'user' : 'assistant',
                content,
            });
            expectUser = !expectUser;
        }

        return collected.reverse().map(({ role, content }) => ({ role, content }));
    }

    _extractConversationText(mes, stripTags) {
        if (!mes) return '';

        let text = String(mes)
            .replace(/<think(?:ing)?(?:\s[^>]*)?>[\s\S]*?<\/think(?:ing)?>/gi, ' ')
            .replace(/<!--[\s\S]*?-->/g, ' ')
            .replace(/<horae>[\s\S]*?<\/horae>/gi, ' ')
            .replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, ' ');

        if (stripTags) {
            const tags = stripTags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
            for (const tag of tags) {
                const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                text = text.replace(new RegExp(`<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?</${escaped}>`, 'gi'), ' ');
            }
        }

        return text
            .replace(/<[^>]*>/g, ' ')
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]{2,}/g, ' ')
            .trim();
    }

    _extractChatCompletionText(json) {
        const content = json?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim()) {
            return content.trim();
        }
        if (Array.isArray(content)) {
            const joined = content.map(part => {
                if (typeof part === 'string') return part;
                if (typeof part?.text === 'string') return part.text;
                if (typeof part?.content === 'string') return part.content;
                return '';
            }).join('').trim();
            if (joined) return joined;
        }
        const wrapped = new Error('Query Rewrite 响应格式异常：缺少 choices[0].message.content');
        wrapped.code = 'FORMAT';
        throw wrapped;
    }

    _parseQueryRewriteResponse(text) {
        const lines = String(text || '')
            .replace(/\r\n?/g, '\n')
            .replace(/\\n/g, '\n')
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        let intent = '';
        const queries = [];

        for (const rawLine of lines) {
            const line = rawLine
                .replace(/^\s*(?:[-*•]\s*)?(?:\d+[\.)、]\s*)?/, '')
                .trim();
            const intentMatch = line.match(/^INTENT\s*[:：]\s*(.+)$/i);
            if (intentMatch) {
                intent = intentMatch[1].trim();
                continue;
            }
            const queryMatch = line.match(/^Q\s*\d*\s*[:：]\s*(.+)$/i);
            if (queryMatch) {
                const query = this._sanitizeQueryRewriteText(queryMatch[1]);
                if (query) queries.push(query);
            }
        }

        return {
            intent: this._sanitizeQueryRewriteText(intent),
            queries: this._normalizeQueryRewriteQueries(queries),
        };
    }

    _sanitizeQueryRewriteText(text, maxLength = QUERY_REWRITE_MAX_QUERY_LENGTH) {
        return String(text || '')
            .trim()
            .replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, maxLength);
    }

    _normalizeQueryRewriteQueries(queries) {
        const seen = new Set();
        const normalized = [];
        for (const raw of Array.isArray(queries) ? queries : []) {
            const query = this._sanitizeQueryRewriteText(raw);
            if (!query) continue;
            const key = query.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            normalized.push(query);
            if (normalized.length >= QUERY_REWRITE_MAX_QUERIES) break;
        }
        return normalized;
    }

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
        // Conservative estimate: CJK ~= 1 token, others ~= 0.3~0.4 token/char, then add safety margin.
        const rough = (cjkCount * 1.35) + (otherCount * 0.45);
        return Math.ceil((rough + 8) * 1.18);
    }

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
                try { this.db.close(); } catch (__) { }
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
