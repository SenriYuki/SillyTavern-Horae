/**
 * Horae 记忆检索增强模块
 * 在 _hybridSearch 返回结果后执行后处理，叠加三层权重
 * 不修改原有向量逻辑
 */

/**
 * 从 horaeManager 的情绪状态中提取标签文本
 * 情绪格式：{ 角色名: ["珍重/安心/郑重承诺"] }
 */
export function extractEmotionTags(horaeManager) {
    try {
        const state = horaeManager?.getLatestState?.();
        if (!state) return [];
        const tags = [];
        for (const charName of Object.keys(state)) {
            const emotions = state[charName];
            if (Array.isArray(emotions)) {
                for (const e of emotions) {
                    tags.push(...e.split('/').map(t => t.trim()).filter(Boolean));
                }
            }
        }
        return tags;
    } catch {
        return [];
    }
}

/**
 * 简单中文分词：按标点和空格切分，过滤短词
 */
function tokenize(text) {
    return text
        .split(/[\s，。！？、；：""''（）【】\n]+/)
        .map(t => t.trim())
        .filter(t => t.length >= 2);
}

/**
 * 三层加权后处理
 * @param {Array} results       _hybridSearch 返回的结果数组
 * @param {string} queryText    本次检索的原始 query
 * @param {number} currentMsgIndex  当前消息楼层号
 * @param {Array<string>} emotionTags  当前情绪标签列表
 * @param {Object} options      可选参数覆盖
 * @returns {Array}             重新排序后的结果
 */
export function boostMemoryScores(results, queryText, currentMsgIndex, emotionTags = [], options = {}) {
    const {
        decayLambda = 0.003,      // 时间衰减系数（越大遗忘越快）
        decayFloor = 0.70,        // 最旧记忆的权重底线（保留70%）
        keywordBonus = 0.15,      // 关键词命中最大加成
        emotionBoost = 1.3,       // 情绪匹配乘数
    } = options;

    const queryTokens = tokenize(queryText);

    return results.map(r => {
        let score = r.relevance_score ?? r.score ?? r.similarity ?? 0.5;

        // === 层1：时间衰减 ===
        // messageIndex 越小 = 越久远，衰减越多
        const msgDist = Math.max(0, currentMsgIndex - (r.messageIndex ?? r.index ?? currentMsgIndex));
        const recencyFactor = decayFloor + (1 - decayFloor) * Math.exp(-decayLambda * msgDist);
        score = score * recencyFactor;

        // === 层2：关键词命中加成 ===
        // query 分词后命中记忆原文，最多加 keywordBonus
        const text = (r.text ?? r.content ?? r.document ?? '').toLowerCase();
        if (queryTokens.length > 0 && text) {
            const hits = queryTokens.filter(kw => text.includes(kw)).length;
            const ratio = hits / queryTokens.length;
            score += keywordBonus * Math.min(ratio, 1);
        }

        // === 层3：情绪共鸣加成 ===
        // 当前情绪标签出现在记忆文本中 → ×1.3
        if (emotionTags.length > 0 && text) {
            const matched = emotionTags.some(tag => text.includes(tag));
            if (matched) score *= emotionBoost;
        }

        return {
            ...r,
            relevance_score: Math.min(1.0, score),
            _boosted: true,
        };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
}
