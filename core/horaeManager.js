/**
 * Horae - 核心管理器
 * 负责元数据的存储、解析、聚合
 */

import { parseStoryDate, calculateDetailedRelativeTime, generateTimeReference, formatFullDateTime, getRelativeTimeMeta } from '../utils/timeUtils.js';
import { detectEffectiveAiLangIsZh, detectEffectiveAiLang } from './i18n.js';
import { getPromptDefaultSync } from './promptDefaults.js';

/**
 * @typedef {Object} HoraeTimestamp
 * @property {string} story_date - 剧情日期，如 "10/1"
 * @property {string} story_time - 剧情时间，如 "15:00" 或 "下午"
 * @property {string} absolute - ISO格式的实际时间戳
 */

/**
 * @typedef {Object} HoraeScene
 * @property {string} location - 场景地点
 * @property {string[]} characters_present - 在场角色列表
 * @property {string} atmosphere - 场景氛围
 */

/**
 * @typedef {Object} HoraeEvent
 * @property {boolean} is_important - 是否重要事件
 * @property {string} level - 事件级别：一般/重要/关键
 * @property {string} summary - 事件摘要
 */

/**
 * @typedef {Object} HoraeItemInfo
 * @property {string|null} icon - emoji图标
 * @property {string|null} holder - 持有者
 * @property {string} location - 位置描述
 */

/**
 * @typedef {Object} HoraeMeta
 * @property {HoraeTimestamp} timestamp
 * @property {HoraeScene} scene
 * @property {Object.<string, string>} costumes - 角色服装 {角色名: 服装描述}
 * @property {Object.<string, HoraeItemInfo>} items - 物品追踪
 * @property {HoraeEvent|null} event
 * @property {Object.<string, string|number>} affection - 好感度
 * @property {Object.<string, {description: string, first_seen: string}>} npcs - 临时NPC
 */

/** 创建空的元数据对象 */
export function createEmptyMeta() {
    return {
        timestamp: {
            story_date: '',
            story_time: '',
            absolute: ''
        },
        scene: {
            location: '',
            characters_present: [],
            atmosphere: ''
        },
        costumes: {},
        items: {},
        deletedItems: [],
        events: [],
        affection: {},
        npcs: {},
        agenda: [],
        deletedAgenda: [],
        mood: {},
        relationships: [],
    };
}

/**
 * 提取物品的基本名称（去掉末尾的数量括号）
 * "新鲜牛大骨(5斤)" → "新鲜牛大骨"
 * "清水(9L)" → "清水"
 * "简易急救包" → "简易急救包"（无数量，不变）
 * "简易急救包(已开封)" → 不变（非数字开头的括号不去掉）
 */
// 个体量词：1个 = 就一个，可省略。纯量词(个)(把)也无意义
const COUNTING_CLASSIFIERS = '个把条块张根口份枚只颗支件套双对碗杯盘盆串束扎';
// 容器/批量单位：1箱 = 一箱(里面有很多)，不可省略
// 度量单位(斤/L/kg等)：有实际计量意义，不可省略

// 物品ID：3位数字左补零，如 001, 002, ...
function padItemId(id) { return String(id).padStart(3, '0'); }

export function getItemBaseName(name) {
    return name
        .replace(/[\(（][\d][\d\.\/]*[a-zA-Z\u4e00-\u9fff]*[\)）]$/, '')  // 数字+任意单位
        .replace(new RegExp(`[\\(（][${COUNTING_CLASSIFIERS}][\\)）]$`), '')  // 纯个体量词（AI错误格式）
        .trim();
}

/** 按基本名查找已有物品 */
function findExistingItemByBaseName(stateItems, newName) {
    const newBase = getItemBaseName(newName);
    if (stateItems[newName]) return newName;
    for (const existingName of Object.keys(stateItems)) {
        if (getItemBaseName(existingName) === newBase) {
            return existingName;
        }
    }
    return null;
}

/** Horae 管理器 */
class HoraeManager {
    constructor() {
        this.context = null;
        this.settings = null;
    }

    /** 初始化管理器 */
    init(context, settings) {
        this.context = context;
        this.settings = settings;
    }

    /** 获取 AI 输出语言代码 (zh-CN / zh-TW / en / ja / ko / ru) */
    _getAiOutputLang() {
        return detectEffectiveAiLang(this.settings);
    }

    /** AI 输出语言是否为中文（简体/繁体） */
    _isAiOutputChinese() {
        return detectEffectiveAiLangIsZh(this.settings);
    }

    /** 根据 AI 输出语言获取事件摘要的字数/字符限制描述 */
    _getEventCharLimit() {
        const lang = this._getAiOutputLang();
        if (lang === 'zh-CN' || lang === 'zh-TW') return '30-50字';
        if (lang === 'ko') return '50-80자';
        if (lang === 'ja') return '40-70文字';
        if (lang === 'ru') return '80-150 символов';
        return '80-130 chars';
    }

    /** 根据语言返回用户/角色默认名 */
    _getDefaultNames() {
        const lang = this._getAiOutputLang();
        const userName = this.context?.name1;
        const charName = this.context?.name2;
        const defaults = {
            'zh-CN': ['主角', '角色'], 'zh-TW': ['主角', '角色'],
            'ja': ['主人公', 'キャラ'], 'ko': ['주인공', '캐릭터'],
            'ru': ['протагонист', 'персонаж'],
        };
        const [du, dc] = defaults[lang] || ['protagonist', 'character'];
        return [userName || du, charName || dc];
    }

    _getPromptDefaultFromResource(key, vars = null) {
        const lang = this._getAiOutputLang();
        let text = getPromptDefaultSync(lang, key) || '';
        if (!text) return '';
        if (vars && typeof vars === 'object') {
            for (const [k, v] of Object.entries(vars)) {
                const val = (v == null) ? '' : String(v);
                text = text.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), val);
            }
        }
        return text;
    }

    /** 获取当前聊天记录 */
    getChat() {
        return this.context?.chat || [];
    }

    /** 获取消息元数据 */
    getMessageMeta(messageIndex) {
        const chat = this.getChat();
        if (messageIndex < 0 || messageIndex >= chat.length) return null;
        return chat[messageIndex].horae_meta || null;
    }

    /** 设置消息元数据 */
    setMessageMeta(messageIndex, meta) {
        const chat = this.getChat();
        if (messageIndex < 0 || messageIndex >= chat.length) return;
        chat[messageIndex].horae_meta = meta;
    }

    /** 聚合所有消息元数据，获取最新状态 */
    getLatestState(skipLast = 0) {
        const chat = this.getChat();
        const state = createEmptyMeta();
        state._previousLocation = '';
        const end = Math.max(0, chat.length - skipLast);

        for (let i = 0; i < end; i++) {
            const meta = chat[i].horae_meta;
            if (!meta) continue;
            if (meta._skipHorae) continue;

            if (meta.timestamp?.story_date) {
                state.timestamp.story_date = meta.timestamp.story_date;
            }
            if (meta.timestamp?.story_time) {
                state.timestamp.story_time = meta.timestamp.story_time;
            }

            if (meta.scene?.location) {
                state._previousLocation = state.scene.location;
                state.scene.location = meta.scene.location;
            }
            if (meta.scene?.atmosphere) {
                state.scene.atmosphere = meta.scene.atmosphere;
            }
            if (meta.scene?.characters_present?.length > 0) {
                state.scene.characters_present = [...meta.scene.characters_present];
            }

            if (meta.costumes) {
                Object.assign(state.costumes, meta.costumes);
            }

            // 物品：合并更新
            if (meta.items) {
                for (let [name, newInfo] of Object.entries(meta.items)) {
                    // 去掉无意义的数量标记
                    // (1) 裸数字1 → 去掉
                    name = name.replace(/[\(（]1[\)）]$/, '').trim();
                    // 个体量词+数字1 → 去掉
                    name = name.replace(new RegExp(`[\\(（]1[${COUNTING_CLASSIFIERS}][\\)）]$`), '').trim();
                    // 纯个体量词 → 去掉
                    name = name.replace(new RegExp(`[\\(（][${COUNTING_CLASSIFIERS}][\\)）]$`), '').trim();
                    // 度量/容器单位保留

                    // 数量为0视为消耗，自动删除
                    const zeroMatch = name.match(/[\(（]0[a-zA-Z\u4e00-\u9fff]*[\)）]$/);
                    if (zeroMatch) {
                        const baseName = getItemBaseName(name);
                        for (const itemName of Object.keys(state.items)) {
                            if (getItemBaseName(itemName).toLowerCase() === baseName.toLowerCase()) {
                                delete state.items[itemName];
                                console.log(`[Horae] 物品数量归零自动删除: ${itemName}`);
                            }
                        }
                        continue;
                    }

                    // 检测消耗状态标记，视为删除（简繁中+英文兼容）
                    const consumedPatterns = /[\(（](已消耗|已用完|已销毁|已銷毀|消耗殆尽|消耗殆盡|消耗|用尽|用盡|consumed|used\s*up|destroyed|depleted)[\)）]/i;
                    const holderConsumed = /^(消耗|已消耗|已用完|消耗殆尽|消耗殆盡|用尽|用盡|无|無|consumed|used\s*up|depleted|none)$/i;
                    if (consumedPatterns.test(name) || holderConsumed.test(newInfo.holder || '')) {
                        const cleanName = name.replace(consumedPatterns, '').trim();
                        const baseName = getItemBaseName(cleanName || name);
                        for (const itemName of Object.keys(state.items)) {
                            if (getItemBaseName(itemName).toLowerCase() === baseName.toLowerCase()) {
                                delete state.items[itemName];
                                console.log(`[Horae] 物品已消耗自动删除: ${itemName}`);
                            }
                        }
                        continue;
                    }

                    // 基本名匹配已有物品
                    const existingKey = findExistingItemByBaseName(state.items, name);

                    if (existingKey) {
                        const existingItem = state.items[existingKey];
                        const mergedItem = { ...existingItem };
                        const locked = !!existingItem._locked;
                        if (!locked && newInfo.icon) mergedItem.icon = newInfo.icon;
                        if (!locked) {
                            const _impRank = { '': 0, '!': 1, '!!': 2 };
                            const _newR = _impRank[newInfo.importance] ?? 0;
                            const _oldR = _impRank[existingItem.importance] ?? 0;
                            mergedItem.importance = _newR >= _oldR ? (newInfo.importance || '') : (existingItem.importance || '');
                        }
                        if (newInfo.holder !== undefined) mergedItem.holder = newInfo.holder;
                        if (newInfo.location !== undefined) mergedItem.location = newInfo.location;
                        if (!locked && newInfo.description !== undefined && newInfo.description.trim()) {
                            mergedItem.description = newInfo.description;
                        }
                        if (!mergedItem.description) mergedItem.description = existingItem.description || '';

                        if (existingKey !== name) {
                            delete state.items[existingKey];
                        }
                        state.items[name] = mergedItem;
                    } else {
                        state.items[name] = newInfo;
                    }
                }
            }

            // 处理已删除物品
            if (meta.deletedItems && meta.deletedItems.length > 0) {
                for (const deletedItem of meta.deletedItems) {
                    const deleteBase = getItemBaseName(deletedItem).toLowerCase();
                    for (const itemName of Object.keys(state.items)) {
                        const itemBase = getItemBaseName(itemName).toLowerCase();
                        if (itemName.toLowerCase() === deletedItem.toLowerCase() ||
                            itemBase === deleteBase) {
                            delete state.items[itemName];
                        }
                    }
                }
            }

            // 好感度：支持绝对值和相对值
            if (meta.affection) {
                for (const [key, value] of Object.entries(meta.affection)) {
                    if (typeof value === 'object' && value !== null) {
                        // 新格式：{type: 'absolute'|'relative', value: number|string}
                        if (value.type === 'absolute') {
                            state.affection[key] = value.value;
                        } else if (value.type === 'relative') {
                            const delta = parseFloat(value.value) || 0;
                            state.affection[key] = (state.affection[key] || 0) + delta;
                        }
                    } else {
                        // 旧格式兼容
                        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                        state.affection[key] = (state.affection[key] || 0) + numValue;
                    }
                }
            }

            // NPC：逐字段合并，保留_id
            if (meta.npcs) {
                // 可更新字段 vs 受保护字段
                const updatableFields = ['appearance', 'personality', 'relationship', 'age', 'job', 'note'];
                const protectedFields = ['gender', 'race', 'birthday'];
                for (const [name, newNpc] of Object.entries(meta.npcs)) {
                    const existing = state.npcs[name];
                    if (existing) {
                        for (const field of updatableFields) {
                            if (newNpc[field] !== undefined) existing[field] = newNpc[field];
                        }
                        // age变更时记录剧情日期作为基准
                        if (newNpc.age !== undefined && newNpc.age !== '') {
                            if (!existing._ageRefDate) {
                                existing._ageRefDate = state.timestamp.story_date || '';
                            }
                            const oldAgeNum = parseInt(existing.age);
                            const newAgeNum = parseInt(newNpc.age);
                            if (!isNaN(oldAgeNum) && !isNaN(newAgeNum) && oldAgeNum !== newAgeNum) {
                                existing._ageRefDate = state.timestamp.story_date || '';
                            }
                        }
                        // 受保护字段：仅在未设定时才填入
                        for (const field of protectedFields) {
                            if (newNpc[field] !== undefined && !existing[field]) {
                                existing[field] = newNpc[field];
                            }
                        }
                        if (newNpc.last_seen) existing.last_seen = newNpc.last_seen;
                    } else {
                        state.npcs[name] = {
                            appearance: newNpc.appearance || '',
                            personality: newNpc.personality || '',
                            relationship: newNpc.relationship || '',
                            gender: newNpc.gender || '',
                            age: newNpc.age || '',
                            race: newNpc.race || '',
                            job: newNpc.job || '',
                            birthday: newNpc.birthday || '',
                            note: newNpc.note || '',
                            _ageRefDate: newNpc.age ? (state.timestamp.story_date || '') : '',
                            first_seen: newNpc.first_seen || new Date().toISOString(),
                            last_seen: newNpc.last_seen || new Date().toISOString()
                        };
                    }
                }
            }
            // 情绪状态（覆盖式）
            if (meta.mood) {
                for (const [charName, emotion] of Object.entries(meta.mood)) {
                    state.mood[charName] = emotion;
                }
            }
        }

        // 过滤用户已删除的NPC（防回滚）
        const deletedNpcs = chat[0]?.horae_meta?._deletedNpcs;
        if (deletedNpcs?.length) {
            for (const name of deletedNpcs) {
                delete state.npcs[name];
                delete state.affection[name];
                delete state.costumes[name];
                delete state.mood[name];
                if (state.scene.characters_present) {
                    state.scene.characters_present = state.scene.characters_present.filter(c => c !== name);
                }
            }
        }

        // 为无ID物品分配ID
        let maxId = 0;
        for (const info of Object.values(state.items)) {
            if (info._id) {
                const num = parseInt(info._id, 10);
                if (num > maxId) maxId = num;
            }
        }
        for (const info of Object.values(state.items)) {
            if (!info._id) {
                maxId++;
                info._id = padItemId(maxId);
            }
        }

        // 为无ID的NPC分配ID
        let maxNpcId = 0;
        for (const info of Object.values(state.npcs)) {
            if (info._id) {
                const num = parseInt(info._id, 10);
                if (num > maxNpcId) maxNpcId = num;
            }
        }
        for (const info of Object.values(state.npcs)) {
            if (!info._id) {
                maxNpcId++;
                info._id = padItemId(maxNpcId);
            }
        }

        return state;
    }

    /** 解析生日字符串，支持 yyyy-mm-dd / yyyy/mm/dd / mm-dd / mm/dd */
    _parseBirthday(str) {
        if (!str) return null;
        let m = str.match(/(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
        if (m) return { year: parseInt(m[1]), month: parseInt(m[2]), day: parseInt(m[3]) };
        m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
        if (m) return { year: null, month: parseInt(m[1]), day: parseInt(m[2]) };
        return null;
    }

    /** 根据剧情时间推移计算NPC当前年龄（优先使用生日精确计算） */
    calcCurrentAge(npcInfo, currentStoryDate) {
        const original = npcInfo.age || '';
        if (!original || !currentStoryDate) {
            return { display: original, original, changed: false };
        }

        const ageNum = parseInt(original);
        if (isNaN(ageNum)) {
            return { display: original, original, changed: false };
        }

        const curParsed = parseStoryDate(currentStoryDate);
        if (!curParsed || curParsed.type !== 'standard' || !curParsed.year) {
            return { display: original, original, changed: false };
        }

        const bdParsed = this._parseBirthday(npcInfo.birthday);

        // ── 有完整生日(含年份)：精确计算 ──
        if (bdParsed?.year) {
            let age = curParsed.year - bdParsed.year;
            if (bdParsed.month && curParsed.month) {
                if (curParsed.month < bdParsed.month ||
                    (curParsed.month === bdParsed.month && (curParsed.day || 1) < (bdParsed.day || 1))) {
                    age -= 1;
                }
            }
            age = Math.max(0, age);
            return { display: String(age), original, changed: age !== ageNum };
        }

        // 以下两种情况都需要 _ageRefDate
        const refDate = npcInfo._ageRefDate || '';
        if (!refDate) return { display: original, original, changed: false };

        const refParsed = parseStoryDate(refDate);
        if (!refParsed || refParsed.type !== 'standard' || !refParsed.year) {
            return { display: original, original, changed: false };
        }

        // ── 仅有月日生日：用 refDate+age 推算出生年，再精确计算 ──
        if (bdParsed?.month) {
            let birthYear = refParsed.year - ageNum;
            if (refParsed.month) {
                const refBeforeBd = refParsed.month < bdParsed.month ||
                    (refParsed.month === bdParsed.month && (refParsed.day || 1) < (bdParsed.day || 1));
                if (refBeforeBd) birthYear -= 1;
            }
            let currentAge = curParsed.year - birthYear;
            if (curParsed.month) {
                const curBeforeBd = curParsed.month < bdParsed.month ||
                    (curParsed.month === bdParsed.month && (curParsed.day || 1) < (bdParsed.day || 1));
                if (curBeforeBd) currentAge -= 1;
            }
            if (currentAge <= ageNum) return { display: original, original, changed: false };
            return { display: String(currentAge), original, changed: true };
        }

        // ── 无生日：退回旧逻辑 ──
        let yearDiff = curParsed.year - refParsed.year;
        if (refParsed.month && curParsed.month) {
            if (curParsed.month < refParsed.month ||
                (curParsed.month === refParsed.month && (curParsed.day || 1) < (refParsed.day || 1))) {
                yearDiff -= 1;
            }
        }
        if (yearDiff <= 0) return { display: original, original, changed: false };
        return { display: String(ageNum + yearDiff), original, changed: true };
    }

    /** 通过ID查找物品 */
    findItemById(items, id) {
        const normalizedId = id.replace(/^#/, '').trim();
        for (const [name, info] of Object.entries(items)) {
            if (info._id === normalizedId || info._id === padItemId(parseInt(normalizedId, 10))) {
                return [name, info];
            }
        }
        return null;
    }

    /** 获取事件列表（limit=0表示不限制数量） */
    getEvents(limit = 0, filterLevel = 'all', skipLast = 0) {
        const chat = this.getChat();
        const end = Math.max(0, chat.length - skipLast);
        const events = [];

        for (let i = 0; i < end; i++) {
            const meta = chat[i].horae_meta;
            if (meta?._skipHorae) continue;

            const metaEvents = meta?.events || (meta?.event ? [meta.event] : []);

            for (let j = 0; j < metaEvents.length; j++) {
                const evt = metaEvents[j];
                if (!evt?.summary) continue;

                if (filterLevel !== 'all' && evt.level !== filterLevel) {
                    continue;
                }

                events.push({
                    messageIndex: i,
                    eventIndex: j,
                    timestamp: meta.timestamp,
                    event: evt
                });

                if (limit > 0 && events.length >= limit) break;
            }
            if (limit > 0 && events.length >= limit) break;
        }

        return events;
    }

    /** 获取重要事件列表（兼容旧调用） */
    getImportantEvents(limit = 0) {
        return this.getEvents(limit, 'all');
    }

    _isTrackableAiMessage(msg) {
        if (!msg || msg.is_user) return false;
        if (msg.horae_meta?._skipHorae) return false;
        return true;
    }

    _resolveAutoSummaryKeepStart(skipLast = 0) {
        if (!this.settings?.autoSummaryEnabled) return null;

        const keepRaw = parseInt(this.settings?.autoSummaryKeepRecent, 10);
        const keepCount = Math.max(0, Number.isFinite(keepRaw) ? keepRaw : 10);
        const chat = this.getChat();
        const end = Math.max(0, chat.length - Math.max(0, skipLast));
        const allAiIndices = [];

        for (let i = 0; i < end; i++) {
            if (this._isTrackableAiMessage(chat[i])) allAiIndices.push(i);
        }

        if (allAiIndices.length === 0) return null;
        if (keepCount <= 0) return end;
        if (allAiIndices.length <= keepCount) return 0;
        return allAiIndices[allAiIndices.length - keepCount];
    }

    _isMessageHiddenForPrompt(messageIndex, effectiveHiddenSet = null) {
        if (effectiveHiddenSet instanceof Set) {
            return effectiveHiddenSet.has(messageIndex);
        }
        return !!this.getChat()?.[messageIndex]?.is_hidden;
    }

    /** 生成紧凑的上下文注入内容（skipLast: swipe时跳过末尾N条消息） */
    generateCompactPrompt(skipLast = 0, options = {}) {
        const state = this.getLatestState(skipLast);
        const lines = [];
        const effectiveHiddenSet = options?.effectiveHiddenSet instanceof Set ? options.effectiveHiddenSet : null;

        const lang = this._getAiOutputLang();
        const L = (zh, en, ja, ko, ru) => {
            if (lang === 'zh-CN' || lang === 'zh-TW') return zh;
            if (lang === 'ja') return ja;
            if (lang === 'ko') return ko;
            if (lang === 'ru') return ru;
            return en;
        };

        // 状态快照头
        if (!options?.noStatusHead) {
            lines.push(L(
                '[当前状态快照——对比本回合剧情，仅在<horae>中输出发生实质变化的字段]',
                '[Current State Snapshot — compare with this round\'s plot, only output substantively changed fields in <horae>]',
                '[現在の状態スナップショット——今回のストーリーと比較し、実質的に変化したフィールドのみ<horae>に出力]',
                '[현재 상태 스냅샷——이번 라운드의 스토리와 비교하여 실질적으로 변경된 필드만 <horae>에 출력]',
                '[Снимок текущего состояния — сравните с сюжетом этого раунда, выводите в <horae> только существенно изменившиеся поля]',
            ));
        }


        const includeTimeline = options?.includeTimeline !== false;
        const sendTimeline = includeTimeline && this.settings?.sendTimeline !== false;
        const sendCharacters = this.settings?.sendCharacters !== false;
        const sendItems = this.settings?.sendItems !== false;

        // 时间
        if (state.timestamp.story_date) {
            const fullDateTime = formatFullDateTime(state.timestamp.story_date, state.timestamp.story_time);
            lines.push(`[${L('时间', 'Time', '時間', '시간', 'Время')}|${fullDateTime}]`);

            // 时间参考
            if (sendTimeline) {
                const timeRef = generateTimeReference(state.timestamp.story_date);
                if (timeRef && timeRef.type === 'standard') {
                    lines.push(`[${L('时间参考', 'Time Ref', '時間参考', '시간 참조', 'Время (справка)')}|${L('昨天', 'yesterday', '昨日', '어제', 'вчера')}=${timeRef.yesterday}|${L('前天', 'day before', '一昨日', '그저께', 'позавчера')}=${timeRef.dayBefore}|${L('3天前', '3 days ago', '3日前', '3일 전', '3 дня назад')}=${timeRef.threeDaysAgo}]`);
                } else if (timeRef && timeRef.type === 'fantasy') {
                    lines.push(`[${L('时间参考', 'Time Ref', '時間参考', '시간 참조', 'Время (справка)')}|${L('奇幻日历模式，参见剧情轨迹中的相对时间标记', 'Fantasy calendar mode, see relative time markers in story timeline', 'ファンタジー暦モード、ストーリー軌跡の相対時間マーカーを参照', '판타지 달력 모드, 스토리 궤적의 상대 시간 마커 참조', 'Режим фэнтезийного календаря, см. относительные метки времени в сюжетной линии')}]`);
                }
            }
        }

        // 场景
        if (state.scene.location) {
            let sceneStr = `[${L('场景', 'Scene', 'シーン', '장면', 'Сцена')}|${state.scene.location}`;
            if (state.scene.atmosphere) {
                sceneStr += `|${state.scene.atmosphere}`;
            }
            sceneStr += ']';
            lines.push(sceneStr);

            if (this.settings?.sendLocationMemory) {
                const locMem = this.getLocationMemory();
                const loc = state.scene.location;
                const entry = this._findLocationMemory(loc, locMem, state._previousLocation);
                if (entry?.desc) {
                    lines.push(`[${L('场景记忆', 'Scene Memory', 'シーン記憶', '장면 기억', 'Память сцены')}|${entry.desc}]`);
                }
                const sepMatch = loc.match(/[·・\-\/\|]/);
                if (sepMatch) {
                    const parent = loc.substring(0, sepMatch.index).trim();
                    if (parent && locMem[parent] && locMem[parent].desc && parent !== entry?._matchedName) {
                        lines.push(`[${L('场景记忆', 'Scene Memory', 'シーン記憶', '장면 기억', 'Память сцены')}:${parent}|${locMem[parent].desc}]`);
                    }
                }
            }
        }

        // 在场角色和服装
        if (sendCharacters) {
            const presentChars = state.scene.characters_present || [];

            if (presentChars.length > 0) {
                const charStrs = [];
                for (const char of presentChars) {
                    // 模糊匹配服装
                    const costumeKey = Object.keys(state.costumes || {}).find(
                        k => k === char || k.includes(char) || char.includes(k)
                    );
                    if (costumeKey && state.costumes[costumeKey]) {
                        charStrs.push(`${char}(${state.costumes[costumeKey]})`);
                    } else {
                        charStrs.push(char);
                    }
                }
                lines.push(`[${L('在场', 'Present', '出席', '참석', 'Присутствуют')}|${charStrs.join('|')}]`);
            }

            // 情绪状态（仅在场角色，变化驱动）
            if (this.settings?.sendMood) {
                const moodEntries = [];
                for (const char of presentChars) {
                    if (state.mood[char]) {
                        moodEntries.push(`${char}:${state.mood[char]}`);
                    }
                }
                if (moodEntries.length > 0) {
                    lines.push(`[${L('情绪', 'Mood', '感情', '감정', 'Настроение')}|${moodEntries.join('|')}]`);
                }
            }

            // 关系网络（仅在场角色相关的关系，从 chat[0] 读取，零AI输出token）
            if (this.settings?.sendRelationships) {
                const rels = this.getRelationshipsForCharacters(presentChars);
                if (rels.length > 0) {
                    lines.push(`\n[${L('关系网络', 'Relationship Network', '関係ネットワーク', '관계 네트워크', 'Сеть отношений')}]`);
                    for (const r of rels) {
                        const noteStr = r.note ? `(${r.note})` : '';
                        lines.push(`${r.from}→${r.to}: ${r.type}${noteStr}`);
                    }
                }
            }
        }

        // 物品（已装备的物品不在此处显示，避免重复）
        if (sendItems) {
            const items = Object.entries(state.items);
            // 收集已装备物品名集合
            const equippedNames = new Set();
            if (this.settings?.rpgMode && !!this.settings.sendRpgEquipment) {
                const rpgData = this.getRpgStateAt(skipLast);
                for (const [, slots] of Object.entries(rpgData.equipment || {})) {
                    for (const [, eqItems] of Object.entries(slots)) {
                        for (const eq of eqItems) equippedNames.add(eq.name);
                    }
                }
            }
            const unequipped = items.filter(([name]) => !equippedNames.has(name));
            if (unequipped.length > 0) {
                lines.push(`\n[${L('物品清单', 'Item List', 'アイテムリスト', '아이템 목록', 'Список предметов')}]`);
                for (const [name, info] of unequipped) {
                    const id = info._id || '???';
                    const icon = info.icon || '';
                    const imp = (info.importance === '!!' || info.importance === '关键' || info.importance === '關鍵') ? L('关键', 'critical', '重要', '핵심', 'критич.') : (info.importance === '!' || info.importance === '重要') ? L('重要', 'important', '重要', '중요', 'важно') : '';
                    const desc = info.description ? ` | ${info.description}` : '';
                    const holder = info.holder || '';
                    const loc = info.location ? `@${info.location}` : '';
                    const impTag = imp ? `[${imp}]` : '';
                    lines.push(`#${id} ${icon}${name}${impTag}${desc} = ${holder}${loc}`);
                }
            } else {
                lines.push(`\n[${L('物品清单', 'Item List', 'アイテムリスト', '아이템 목록', 'Список предметов')}] (${L('空', 'empty', '空', '비어있음', 'пусто')})`);
            }
        }

        // 好感度
        if (sendCharacters) {
            const affections = Object.entries(state.affection).filter(([_, v]) => v !== 0);
            if (affections.length > 0) {
                const affStr = affections.map(([k, v]) => `${k}:${v > 0 ? '+' : ''}${v}`).join('|');
                lines.push(`[${L('好感', 'Affection', '好感度', '호감도', 'Расположение')}|${affStr}]`);
            }

            // NPC信息
            const npcs = Object.entries(state.npcs);
            if (npcs.length > 0) {
                const mainCharName = this.context?.name2 || '';
                const pinnedNpcs = Array.isArray(this.settings?.pinnedNpcs) ? this.settings.pinnedNpcs : [];
                const favoriteNpcs = Array.isArray(this.settings?.favoriteNpcs) ? this.settings.favoriteNpcs : [];
                const sendMainCharacterPersonality = this.settings?.sendMainCharacterPersonality === true;
                const isMainCharacter = (name) => {
                    if (pinnedNpcs.includes(name)) return true;
                    if (favoriteNpcs.includes(name)) return true;
                    if (mainCharName && name.includes(mainCharName)) return true;
                    return false;
                };
                console.log(
                    `[Horae][MainPersonality] generateCompactPrompt: sendMainCharacterPersonality=${sendMainCharacterPersonality} sendCharacters=${this.settings?.sendCharacters !== false} mainCharName="${mainCharName}" pinnedNpcs=${JSON.stringify(pinnedNpcs)} favoriteNpcs=${JSON.stringify(favoriteNpcs)} npcCount=${npcs.length}`
                );
                lines.push(`\n[${L('已知NPC', 'Known NPCs', '既知NPC', '알려진 NPC', 'Известные NPC')}]`);
                for (const [name, info] of npcs) {
                    const id = info._id || '?';
                    const app = info.appearance || '';
                    const mainByPinned = pinnedNpcs.includes(name);
                    const mainByFavorite = favoriteNpcs.includes(name);
                    const mainByName = !!(mainCharName && name.includes(mainCharName));
                    const mainMatched = mainByPinned || mainByFavorite || mainByName;
                    const originalPer = info.personality || '';
                    const per = (!sendMainCharacterPersonality && isMainCharacter(name))
                        ? ''
                        : (info.personality || '');
                    const rel = info.relationship || '';
                    console.log(
                        `[Horae][MainPersonality] npc="${name}" id=${id} mainMatched=${mainMatched} byPinned=${mainByPinned} byFavorite=${mainByFavorite} byName=${mainByName} originalPerLen=${originalPer.length} sentPerLen=${per.length}`
                    );
                    // 主体：N编号 名｜外貌=性格@关系
                    let npcStr = `N${id} ${name}`;
                    if (app || per || rel) {
                        npcStr += `｜${app}=${per}@${rel}`;
                    }
                    console.log(`[Horae][MainPersonality] npcLine: ${npcStr}`);
                    // 扩展字段
                    const extras = [];
                    if (info._aliases?.length) extras.push(`${L('曾用名', 'aliases', '旧名', '이전 이름', 'псевдонимы')}:${info._aliases.join('/')}`);
                    if (info.gender) extras.push(`${L('性别', 'gender', '性別', '성별', 'пол')}:${info.gender}`);
                    if (info.age) {
                        const ageResult = this.calcCurrentAge(info, state.timestamp.story_date);
                        extras.push(`${L('年龄', 'age', '年齢', '나이', 'возраст')}:${ageResult.display}`);
                    }
                    if (info.race) extras.push(`${L('种族', 'race', '種族', '종족', 'раса')}:${info.race}`);
                    if (info.job) extras.push(`${L('职业', 'occupation', '職業', '직업', 'профессия')}:${info.job}`);
                    if (info.birthday) extras.push(`${L('生日', 'birthday', '誕生日', '생일', 'день рождения')}:${info.birthday}`);
                    if (info.note) extras.push(`${L('补充', 'notes', '備考', '비고', 'примечания')}:${info.note}`);
                    if (extras.length > 0) npcStr += `~${extras.join('~')}`;
                    lines.push(npcStr);
                }
            }
        }

        // 待办事项
        const chatForAgenda = this.getChat();
        const allAgendaItems = [];
        const seenTexts = new Set();
        const deletedTexts = new Set(chatForAgenda?.[0]?.horae_meta?._deletedAgendaTexts || []);
        const userAgenda = chatForAgenda?.[0]?.horae_meta?.agenda || [];
        for (const item of userAgenda) {
            if (item._deleted || deletedTexts.has(item.text)) continue;
            if (!seenTexts.has(item.text)) {
                allAgendaItems.push(item);
                seenTexts.add(item.text);
            }
        }
        // AI写入的（swipe时跳过末尾消息）
        const agendaEnd = Math.max(0, (chatForAgenda?.length || 0) - skipLast);
        if (chatForAgenda) {
            for (let i = 1; i < agendaEnd; i++) {
                const msgAgenda = chatForAgenda[i].horae_meta?.agenda;
                if (msgAgenda?.length > 0) {
                    for (const item of msgAgenda) {
                        if (item._deleted || deletedTexts.has(item.text)) continue;
                        if (!seenTexts.has(item.text)) {
                            allAgendaItems.push(item);
                            seenTexts.add(item.text);
                        }
                    }
                }
            }
        }
        const activeAgenda = allAgendaItems.filter(a => !a.done);
        if (activeAgenda.length > 0) {
            lines.push(`\n[${L('待办事项', 'Agenda', '予定事項', '할 일 목록', 'Список дел')}]`);
            for (const item of activeAgenda) {
                const datePrefix = item.date ? `${item.date} ` : '';
                lines.push(`· ${datePrefix}${item.text}`);
            }
        }

        // RPG 状态（仅启用时注入，按在场角色过滤）
        if (this.settings?.rpgMode) {
            const rpg = this.getRpgStateAt(skipLast);
            const sendBars = this.settings?.sendRpgBars !== false;
            const sendSkills = this.settings?.sendRpgSkills !== false;

            // 属性条名称映射
            const _barCfg = this.settings?.rpgBarConfig || [];
            const _barNames = {};
            for (const b of _barCfg) _barNames[b.key] = b.name;

            // 按在场角色过滤 RPG 数据（无场景数据时发送全部）
            const presentChars = state.scene.characters_present || [];
            const userName = this.context?.name1 || '';
            const _cUoB = !!this.settings?.rpgBarsUserOnly;
            const _cUoS = !!this.settings?.rpgSkillsUserOnly;
            const _cUoA = !!this.settings?.rpgAttrsUserOnly;
            const _cUoE = !!this.settings?.rpgEquipmentUserOnly;
            const _cUoR = !!this.settings?.rpgReputationUserOnly;
            const _cUoL = !!this.settings?.rpgLevelUserOnly;
            const _cUoC = !!this.settings?.rpgCurrencyUserOnly;
            const allRpgNames = new Set([
                ...Object.keys(rpg.bars), ...Object.keys(rpg.status || {}),
                ...Object.keys(rpg.skills), ...Object.keys(rpg.attributes || {}),
                ...Object.keys(rpg.reputation || {}), ...Object.keys(rpg.equipment || {}),
                ...Object.keys(rpg.levels || {}), ...Object.keys(rpg.xp || {}),
                ...Object.keys(rpg.currency || {}),
            ]);
            const rpgAllowed = new Set();
            if (presentChars.length > 0) {
                for (const p of presentChars) {
                    const n = p.trim();
                    if (!n) continue;
                    if (allRpgNames.has(n)) { rpgAllowed.add(n); continue; }
                    if (n === userName && allRpgNames.has(userName)) { rpgAllowed.add(userName); continue; }
                    for (const rn of allRpgNames) {
                        if (rn.includes(n) || n.includes(rn)) { rpgAllowed.add(rn); break; }
                    }
                }
            }
            const filterRpg = rpgAllowed.size > 0;
            // userOnly时构建行不带角色名前缀
            const _ctxPre = (name, isUo) => {
                if (isUo) return '';
                const npc = state.npcs[name];
                return npc?._id ? `N${npc._id} ${name}: ` : `${name}: `;
            };

            if (sendBars && Object.keys(rpg.bars).length > 0) {
                lines.push(`\n[${L('RPG状态', 'RPG Status', 'RPGステータス', 'RPG 상태', 'RPG-статус')}]`);
                for (const [name, bars] of Object.entries(rpg.bars)) {
                    if (_cUoB && name !== userName) continue;
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const parts = [];
                    for (const [type, val] of Object.entries(bars)) {
                        const label = val[2] || _barNames[type] || type.toUpperCase();
                        parts.push(`${label} ${val[0]}/${val[1]}`);
                    }
                    const sts = rpg.status?.[name];
                    if (sts?.length > 0) parts.push(`${L('状态', 'status', 'ステータス', '상태', 'статус')}:${sts.join('/')}`);
                    if (parts.length > 0) lines.push(`${_ctxPre(name, _cUoB)}${parts.join(' | ')}`);
                }
                for (const [name, effects] of Object.entries(rpg.status || {})) {
                    if (rpg.bars[name] || effects.length === 0) continue;
                    if (_cUoB && name !== userName) continue;
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    lines.push(`${_ctxPre(name, _cUoB)}${L('状态', 'status', 'ステータス', '상태', 'статус')}:${effects.join('/')}`);
                }
            }

            if (sendSkills && Object.keys(rpg.skills).length > 0) {
                const hasAny = Object.entries(rpg.skills).some(([n, arr]) =>
                    arr?.length > 0 && (!_cUoS || n === userName) && (!filterRpg || rpgAllowed.has(n)));
                if (hasAny) {
                    lines.push(`\n[${L('技能列表', 'Skill List', 'スキルリスト', '스킬 목록', 'Список навыков')}]`);
                    for (const [name, skills] of Object.entries(rpg.skills)) {
                        if (!skills?.length) continue;
                        if (_cUoS && name !== userName) continue;
                        if (filterRpg && !rpgAllowed.has(name)) continue;
                        if (!_cUoS) {
                            const npc = state.npcs[name];
                            const pre = npc?._id ? `N${npc._id} ` : '';
                            lines.push(`${pre}${name}:`);
                        }
                        for (const sk of skills) {
                            const lv = sk.level ? ` ${sk.level}` : '';
                            const desc = sk.desc ? ` | ${sk.desc}` : '';
                            lines.push(`  ${sk.name}${lv}${desc}`);
                        }
                    }
                }
            }

            const sendAttrs = this.settings?.sendRpgAttributes !== false;
            const attrCfg = this.settings?.rpgAttributeConfig || [];
            if (sendAttrs && attrCfg.length > 0 && Object.keys(rpg.attributes || {}).length > 0) {
                lines.push(`\n[${L('多维属性', 'Attributes', '多次元属性', '다차원 속성', 'Атрибуты')}]`);
                for (const [name, vals] of Object.entries(rpg.attributes)) {
                    if (_cUoA && name !== userName) continue;
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const parts = attrCfg.map(a => `${a.name}${vals[a.key] ?? '?'}`);
                    lines.push(`${_ctxPre(name, _cUoA)}${parts.join(' | ')}`);
                }
            }

            // 装备（按角色独立格位，包含完整物品描述以节省 token）
            const sendEq = !!this.settings?.sendRpgEquipment;
            const eqPerChar = (rpg.equipmentConfig?.perChar) || {};
            const storedEq = this.getChat()?.[0]?.horae_meta?.rpg?.equipment || {};
            if (sendEq && Object.keys(rpg.equipment || {}).length > 0) {
                let hasEqData = false;
                for (const [name, slots] of Object.entries(rpg.equipment)) {
                    if (_cUoE && name !== userName) continue;
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const ownerCfg = eqPerChar[name];
                    const validEqSlots = (ownerCfg && Array.isArray(ownerCfg.slots))
                        ? new Set(ownerCfg.slots.map(s => s.name)) : null;
                    const deletedEqSlots = ownerCfg ? new Set(ownerCfg._deletedSlots || []) : new Set();
                    const parts = [];
                    for (const [slotName, items] of Object.entries(slots)) {
                        if (deletedEqSlots.has(slotName)) continue;
                        if (validEqSlots && validEqSlots.size > 0 && !validEqSlots.has(slotName)) continue;
                        for (const item of items) {
                            const attrStr = Object.entries(item.attrs || {}).map(([k, v]) => `${k}${v >= 0 ? '+' : ''}${v}`).join(',');
                            const stored = storedEq[name]?.[slotName]?.find(e => e.name === item.name);
                            const desc = stored?._itemMeta?.description || '';
                            const descPart = desc ? ` "${desc}"` : '';
                            parts.push(`[${slotName}]${item.name}${attrStr ? `{${attrStr}}` : ''}${descPart}`);
                        }
                    }
                    if (parts.length > 0) {
                        if (!hasEqData) { lines.push(`\n[${L('装备', 'Equipment', '装備', '장비', 'Снаряжение')}]`); hasEqData = true; }
                        lines.push(`${_ctxPre(name, _cUoE)}${parts.join(' | ')}`);
                    }
                }
            }

            // 声望（需开关开启）
            const sendRep = !!this.settings?.sendRpgReputation;
            const repConfig = rpg.reputationConfig || { categories: [] };
            if (sendRep && Object.keys(rpg.reputation || {}).length > 0) {
                const validRepNames = new Set(repConfig.categories.map(c => c.name));
                const deletedRepNames = new Set(repConfig._deletedCategories || []);
                let hasRepData = false;
                for (const [name, cats] of Object.entries(rpg.reputation)) {
                    if (_cUoR && name !== userName) continue;
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const parts = [];
                    for (const [catName, data] of Object.entries(cats)) {
                        if ((validRepNames.size > 0 && !validRepNames.has(catName)) || deletedRepNames.has(catName)) continue;
                        const repValue = data && typeof data === 'object' ? data.value : data;
                        const subItems = data && typeof data === 'object' ? data.subItems : null;
                        const subText = Object.entries(subItems || {})
                            .filter(([, v]) => v !== undefined && v !== null && v !== '')
                            .map(([k, v]) => `${k}:${typeof v === 'number' && v > 0 ? '+' : ''}${v}`)
                            .join(' / ');
                        parts.push(`${catName}:${repValue}${subText ? `（${subText}）` : ''}`);
                    }
                    if (parts.length > 0) {
                        if (!hasRepData) { lines.push(`\n[${L('声望', 'Reputation', '名声', '명성', 'Репутация')}]`); hasRepData = true; }
                        lines.push(`${_ctxPre(name, _cUoR)}${parts.join(' | ')}`);
                    }
                }
            }

            // 等级
            const sendLvl = !!this.settings?.sendRpgLevel;
            if (sendLvl && (Object.keys(rpg.levels || {}).length > 0 || Object.keys(rpg.xp || {}).length > 0)) {
                const allLvlNames = new Set([...Object.keys(rpg.levels || {}), ...Object.keys(rpg.xp || {})]);
                let hasLvlData = false;
                for (const name of allLvlNames) {
                    if (_cUoL && name !== userName) continue;
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const lv = rpg.levels?.[name];
                    const xp = rpg.xp?.[name];
                    if (lv == null && !xp) continue;
                    if (!hasLvlData) { lines.push(`\n[${L('等级', 'Level', 'レベル', '레벨', 'Уровень')}]`); hasLvlData = true; }
                    let lvStr = lv != null ? `Lv.${lv}` : '';
                    if (xp) lvStr += ` (${L('经验', 'XP', '経験', '경험', 'опыт')}: ${xp[0]}/${xp[1]})`;
                    lines.push(`${_ctxPre(name, _cUoL)}${lvStr.trim()}`);
                }
            }

            // 货币
            const sendCur = !!this.settings?.sendRpgCurrency;
            const curConfig = rpg.currencyConfig || { denominations: [] };
            if (sendCur && curConfig.denominations.length > 0 && Object.keys(rpg.currency || {}).length > 0) {
                let hasCurData = false;
                for (const [name, coins] of Object.entries(rpg.currency)) {
                    if (_cUoC && name !== userName) continue;
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const parts = [];
                    for (const d of curConfig.denominations) {
                        const val = coins[d.name];
                        if (val != null) parts.push(`${d.name}×${val}`);
                    }
                    if (parts.length > 0) {
                        if (!hasCurData) { lines.push(`\n[${L('货币', 'Currency', '通貨', '화폐', 'Валюта')}]`); hasCurData = true; }
                        lines.push(`${_ctxPre(name, _cUoC)}${parts.join(', ')}`);
                    }
                }
            }

            // 据点（从快照读取，支持楼层倒回）
            if (!!this.settings?.sendRpgStronghold) {
                const shNodes = rpg.strongholds || [];
                if (shNodes.length > 0) {
                    lines.push(`\n[${L('据点', 'Stronghold', '拠点', '거점', 'Опорный пункт')}]`);
                    function _shTreeStr(nodes, parentId, indent) {
                        const children = nodes.filter(n => (n.parent || null) === parentId);
                        let str = '';
                        for (const c of children) {
                            const lvStr = c.level != null ? ` Lv.${c.level}` : '';
                            str += `${'  '.repeat(indent)}${c.name}${lvStr}`;
                            if (c.desc) str += ` — ${c.desc}`;
                            str += '\n';
                            str += _shTreeStr(nodes, c.id, indent + 1);
                        }
                        return str;
                    }
                    lines.push(_shTreeStr(shNodes, null, 0).trimEnd());
                }
            }
        }

        // 剧情轨迹
        if (sendTimeline) {
            const allEvents = this.getEvents(0, 'all', skipLast);
            // 过滤掉被活跃摘要覆盖的原始事件（_compressedBy 且摘要为 active）
            const timelineChat = this.getChat();
            const autoSums = timelineChat?.[0]?.horae_meta?.autoSummaries || [];
            const activeSumIds = new Set(autoSums.filter(s => s.active).map(s => s.id));
            const keepStart = this._resolveAutoSummaryKeepStart(skipLast);
            // 被活跃摘要压缩的事件不发送；摘要为 inactive 时其 _summaryId 事件不发送
            const events = allEvents.filter(e => {
                if (e.event?._compressedBy && activeSumIds.has(e.event._compressedBy)) return false;
                if (e.event?._summaryId && !activeSumIds.has(e.event._summaryId)) return false;
                if (Number.isInteger(keepStart) && e.messageIndex >= keepStart) {
                    // keepRecent 只跳过“尾部可见楼层”；隐藏楼层仍允许作为历史轨迹注入
                    if (!this._isMessageHiddenForPrompt(e.messageIndex, effectiveHiddenSet)) return false;
                }
                return true;
            });
            if (events.length > 0) {
                lines.push(`\n[${L('剧情轨迹', 'Story Timeline', 'ストーリー軌跡', '스토리 궤적', 'Сюжетная линия')}]`);

                const currentDate = state.timestamp?.story_date || '';

                const getLevelMark = (level) => {
                    if (level === '关键' || level === '關鍵') return '★';
                    if (level === '重要') return '●';
                    return '○';
                };

                const getRelativeDesc = (eventDate) => {
                    if (!eventDate || !currentDate) return '';
                    const result = calculateDetailedRelativeTime(eventDate, currentDate);
                    if (result.days === null || result.days === undefined) return '';

                    const meta = getRelativeTimeMeta(result.days, { fromDate: result.fromDate, toDate: result.toDate });
                    const weekdayLabel = (weekday) => L(
                        ['日', '一', '二', '三', '四', '五', '六'][weekday],
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekday],
                        ['日', '月', '火', '水', '木', '金', '土'][weekday],
                        ['일', '월', '화', '수', '목', '금', '토'][weekday],
                        ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][weekday],
                    );

                    switch (meta.key) {
                        case 'today': return `(${L('今天', 'today', '今日', '오늘', 'сегодня')})`;
                        case 'yesterday': return `(${L('昨天', 'yesterday', '昨日', '어제', 'вчера')})`;
                        case 'day_before_yesterday': return `(${L('前天', 'day before yesterday', '一昨日', '그저께', 'позавчера')})`;
                        case 'three_days_ago': return `(${L('大前天', '3 days ago', '3日前', '그끄저께', '3 дня назад')})`;
                        case 'tomorrow': return `(${L('明天', 'tomorrow', '明日', '내일', 'завтра')})`;
                        case 'day_after_tomorrow': return `(${L('后天', 'day after tomorrow', '明後日', '모레', 'послезавтра')})`;
                        case 'in_three_days': return `(${L('大后天', 'in 3 days', '3日後', '글피', 'через 3 дня')})`;
                        case 'last_weekday': {
                            const wd = weekdayLabel(meta.weekday);
                            return `(${L(`上周${wd}`, `last ${wd}`, `先週${wd}`, `지난주 ${wd}`, `прошлый ${wd}`)})`;
                        }
                        case 'week_before_last_weekday': {
                            const wd = weekdayLabel(meta.weekday);
                            return `(${L(`上上周${wd}`, `the week before last ${wd}`, `先々週${wd}`, `지지난주 ${wd}`, `позапрошлый ${wd}`)})`;
                        }
                        case 'next_weekday': {
                            const wd = weekdayLabel(meta.weekday);
                            return `(${L(`下周${wd}`, `next ${wd}`, `来週${wd}`, `다음주 ${wd}`, `следующий ${wd}`)})`;
                        }
                        case 'week_after_next_weekday': {
                            const wd = weekdayLabel(meta.weekday);
                            return `(${L(`下下周${wd}`, `the week after next ${wd}`, `再来週${wd}`, `다다음주 ${wd}`, `через неделю после следующей ${wd}`)})`;
                        }
                        case 'last_month_day':
                            return `(${L(`上个月${meta.day}号`, `last month ${meta.day}th`, `先月${meta.day}日`, `지난달 ${meta.day}일`, `прошлый месяц ${meta.day}-го`)})`;
                        case 'next_month_day':
                            return `(${L(`下个月${meta.day}号`, `next month ${meta.day}th`, `来月${meta.day}日`, `다음달 ${meta.day}일`, `следующий месяц ${meta.day}-го`)})`;
                        case 'last_year_date':
                            return `(${L(`去年${meta.month}月`, `last year month ${meta.month}`, `去年${meta.month}月`, `작년 ${meta.month}월`, `прошлый год, ${meta.month}-й мес.`)})`;
                        case 'year_before_last_date':
                            return `(${L(`前年${meta.month}月`, `the year before last month ${meta.month}`, `一昨年${meta.month}月`, `재작년 ${meta.month}월`, `позапрошлый год, ${meta.month}-й мес.`)})`;
                        case 'days_ago':
                            return `(${L(`${meta.value}天前`, `${meta.value} days ago`, `${meta.value}日前`, `${meta.value}일 전`, `${meta.value} дн. назад`)})`;
                        case 'days_later':
                            return `(${L(`${meta.value}天后`, `in ${meta.value} days`, `${meta.value}日後`, `${meta.value}일 후`, `через ${meta.value} дн.`)})`;
                        case 'weeks_ago':
                            return `(${L(`${meta.value}周前`, `${meta.value} weeks ago`, `${meta.value}週間前`, `${meta.value}주 전`, `${meta.value} нед. назад`)})`;
                        case 'weeks_later':
                            return `(${L(`${meta.value}周后`, `in ${meta.value} weeks`, `${meta.value}週間後`, `${meta.value}주 후`, `через ${meta.value} нед.`)})`;
                        case 'months_ago':
                            return `(${L(`${meta.value}个月前`, `${meta.value} months ago`, `${meta.value}ヶ月前`, `${meta.value}개월 전`, `${meta.value} мес. назад`)})`;
                        case 'months_later':
                            return `(${L(`${meta.value}个月后`, `in ${meta.value} months`, `${meta.value}ヶ月後`, `${meta.value}개월 후`, `через ${meta.value} мес.`)})`;
                        case 'years_months_ago':
                            return `(${L(`${meta.years}年${meta.months}个月前`, `${meta.years} years ${meta.months} months ago`, `${meta.years}年${meta.months}ヶ月前`, `${meta.years}년 ${meta.months}개월 전`, `${meta.years} г. ${meta.months} мес. назад`)})`;
                        case 'years_months_later':
                            return `(${L(`${meta.years}年${meta.months}个月后`, `in ${meta.years} years ${meta.months} months`, `${meta.years}年${meta.months}ヶ月後`, `${meta.years}년 ${meta.months}개월 후`, `через ${meta.years} г. ${meta.months} мес.`)})`;
                        case 'years_ago':
                            return `(${L(`${meta.years}年前`, `${meta.years} years ago`, `${meta.years}年前`, `${meta.years}년 전`, `${meta.years} лет назад`)})`;
                        case 'years_later':
                            return `(${L(`${meta.years}年后`, `in ${meta.years} years`, `${meta.years}年後`, `${meta.years}년 후`, `через ${meta.years} лет`)})`;
                        default:
                            return '';
                    }
                };

                const sortedEvents = [...events].sort((a, b) => {
                    return (a.messageIndex || 0) - (b.messageIndex || 0);
                });

                const criticalAndImportant = sortedEvents.filter(e =>
                    e.event?.level === '关键' || e.event?.level === '關鍵' || e.event?.level === '重要' || e.event?.level === '摘要' || e.event?.isSummary
                );
                const depthRaw = parseInt(this.settings?.contextDepth, 10);
                const contextDepth = Number.isFinite(depthRaw) ? Math.max(0, depthRaw) : 15;
                const normalEventsAll = sortedEvents.filter(e =>
                    (e.event?.level === '一般' || !e.event?.level) && !e.event?.isSummary
                );
                const normalEvents = contextDepth > 0 ? normalEventsAll.slice(-contextDepth) : [];

                const allToShow = [...criticalAndImportant, ...normalEvents]
                    .sort((a, b) => (a.messageIndex || 0) - (b.messageIndex || 0));

                // 预构建 summaryId→日期范围 映射，让摘要事件带上时间跨度
                const _sumDateRanges = {};
                for (const s of autoSums) {
                    if (!s.active || !s.originalEvents?.length) continue;
                    const dates = s.originalEvents.map(oe => oe.timestamp?.story_date).filter(Boolean);
                    if (dates.length > 0) {
                        const first = dates[0], last = dates[dates.length - 1];
                        _sumDateRanges[s.id] = first === last ? first : `${first}~${last}`;
                    }
                }

                for (const e of allToShow) {
                    const isSummary = e.event?.isSummary || e.event?.level === '摘要';
                    if (isSummary) {
                        const dateRange = e.event?._summaryId ? _sumDateRanges[e.event._summaryId] : '';
                        const dateTag = dateRange ? `·${dateRange}` : '';
                        const relTag = dateRange ? getRelativeDesc(dateRange.split('~')[0]) : '';
                        lines.push(`📋 [${L('摘要', 'Summary', '要約', '요약', 'Сводка')}${dateTag}]${relTag}: ${e.event.summary}`);
                    } else {
                        const mark = getLevelMark(e.event?.level);
                        const date = e.timestamp?.story_date || '?';
                        const time = e.timestamp?.story_time || '';
                        const timeStr = time ? `${date} ${time}` : date;
                        const relativeDesc = getRelativeDesc(e.timestamp?.story_date);
                        const msgNum = e.messageIndex !== undefined ? `#${e.messageIndex}` : '';
                        lines.push(`${mark} ${msgNum} ${timeStr}${relativeDesc}: ${e.event.summary}`);
                    }
                }
            }
        }

        // 自定义表格数据（合并全局、角色和本地）
        const chat = this.getChat();
        const firstMsg = chat?.[0];
        const localTables = firstMsg?.horae_meta?.customTables || [];
        const resolvedCharacter = this._getResolvedCharacterTables();
        const resolvedGlobal = this._getResolvedGlobalTables();
        const allTables = [...resolvedGlobal, ...resolvedCharacter, ...localTables];
        const tableDebug = [];
        let tableEmittedCount = 0;
        for (const table of allTables) {
            const rows = table.rows || 2;
            const cols = table.cols || 2;
            const data = table.data || {};

            // 有内容或有填表说明才输出
            const hasContent = Object.values(data).some(v => v && v.trim());
            const hasPrompt = table.prompt && table.prompt.trim();
            tableDebug.push({
                name: (table.name || '').trim(),
                rows,
                cols,
                hasContent,
                hasPrompt: !!hasPrompt,
                promptLen: (table.prompt || '').trim().length,
            });
            if (!hasContent && !hasPrompt) continue;
            tableEmittedCount++;

            const tableName = table.name || L('自定义表格', 'Custom Table', 'カスタムテーブル', '커스텀 테이블', 'Пользовательская таблица');
            lines.push(`\n[${tableName}](${rows - 1}${L('行', 'rows', '行', '행', 'строк')}×${cols - 1}${L('列', 'cols', '列', '열', 'столбцов')})`);

            if (table.prompt && table.prompt.trim()) {
                lines.push(`(${L('填写要求', 'Instructions', '記入要件', '작성 요구사항', 'Инструкции')}: ${table.prompt.trim()})`);
            }

            // 检测最后有内容的行（含行标题列）
            let lastDataRow = 0;
            for (let r = rows - 1; r >= 1; r--) {
                for (let c = 0; c < cols; c++) {
                    if (data[`${r}-${c}`] && data[`${r}-${c}`].trim()) {
                        lastDataRow = r;
                        break;
                    }
                }
                if (lastDataRow > 0) break;
            }
            if (lastDataRow === 0) lastDataRow = 1;

            const lockedRows = new Set(table.lockedRows || []);
            const lockedCols = new Set(table.lockedCols || []);
            const lockedCells = new Set(table.lockedCells || []);

            // 输出表头行（带坐标标注）
            const headerRow = [];
            for (let c = 0; c < cols; c++) {
                const label = data[`0-${c}`] || (c === 0 ? L('表头', 'Header', '見出し', '헤더', 'Заголовок') : `${L('列', 'Col', '列', '열', 'Столбец')}${c}`);
                const coord = `[0,${c}]`;
                headerRow.push(lockedCols.has(c) ? `${coord}${label}🔒` : `${coord}${label}`);
            }
            lines.push(headerRow.join(' | '));

            // 输出数据行（带坐标标注）
            for (let r = 1; r <= lastDataRow; r++) {
                const rowData = [];
                for (let c = 0; c < cols; c++) {
                    const coord = `[${r},${c}]`;
                    if (c === 0) {
                        const label = data[`${r}-0`] || `${r}`;
                        rowData.push(lockedRows.has(r) ? `${coord}${label}🔒` : `${coord}${label}`);
                    } else {
                        const val = data[`${r}-${c}`] || '';
                        rowData.push(lockedCells.has(`${r}-${c}`) ? `${coord}${val}🔒` : `${coord}${val}`);
                    }
                }
                lines.push(rowData.join(' | '));
            }

            // 标注被省略的尾部空行
            if (lastDataRow < rows - 1) {
                lines.push(`(${L(
                    `共${rows - 1}行，第${lastDataRow + 1}-${rows - 1}行暂无数据`,
                    `${rows - 1} rows total, rows ${lastDataRow + 1}-${rows - 1} have no data`,
                    `全${rows - 1}行、第${lastDataRow + 1}-${rows - 1}行はデータなし`,
                    `총 ${rows - 1}행, ${lastDataRow + 1}-${rows - 1}행 데이터 없음`,
                    `всего ${rows - 1} строк, строки ${lastDataRow + 1}-${rows - 1} пусты`,
                )})`);
            }

            // 提示完全空的数据列
            const emptyCols = [];
            for (let c = 1; c < cols; c++) {
                let colHasData = false;
                for (let r = 1; r < rows; r++) {
                    if (data[`${r}-${c}`] && data[`${r}-${c}`].trim()) { colHasData = true; break; }
                }
                if (!colHasData) emptyCols.push(c);
            }
            if (emptyCols.length > 0) {
                const emptyColNames = emptyCols.map(c => data[`0-${c}`] || `${L('列', 'Col', '列', '열', 'Столбец')}${c}`);
                lines.push(`(${emptyColNames.join(L('、', ', ', '、', ', ', ', '))}${L('：暂无数据，如剧情中已有相关信息请填写', ': no data yet, please fill in if relevant info exists in the story', '：データなし、ストーリーに関連情報があれば記入してください', ': 데이터 없음, 스토리에 관련 정보가 있으면 작성해 주세요', ': нет данных, заполните, если в сюжете есть соответствующая информация')})`);
            }
        }
        if (allTables.length > 0) {
            console.log(
                `[Horae][TableDebug] generateCompactPrompt table section: total=${allTables.length}, emitted=${tableEmittedCount}, skipLast=${skipLast}`
            );
            console.log(`[Horae][TableDebug] generateCompactPrompt table details: ${JSON.stringify(tableDebug)}`);
        }

        return lines.join('\n');
    }

    /** 获取好感度等级描述 */
    getAffectionLevel(value) {
        if (value >= 80) return '挚爱';
        if (value >= 60) return '亲密';
        if (value >= 40) return '好感';
        if (value >= 20) return '友好';
        if (value >= 0) return '中立';
        if (value >= -20) return '冷淡';
        if (value >= -40) return '厌恶';
        if (value >= -60) return '敌视';
        return '仇恨';
    }

    /**
     * 根据用户配置的标签列表（逗号分隔），
     * 整段移除对应标签及其内容（含可选属性），
     * 防止小剧场等自定义区块内的 horae 标签污染正文解析。
     */
    _stripCustomTags(text, tagList) {
        if (!text || !tagList) return text;
        const tags = tagList.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
        for (const tag of tags) {
            const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            text = text.replace(new RegExp(`<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?</${escaped}>`, 'gi'), '');
        }
        return text;
    }

    /** 解析AI回复中的horae标签 */
    parseHoraeTag(message) {
        if (!message) return null;

        // 剥离 <think>/<thinking> 块，防止思维链内的 horae 标签污染解析
        message = message.replace(/<think(?:ing)?[\s>][\s\S]*?<\/think(?:ing)?>/gi, '');

        // 提取所有 <horae> 块；多块时优先选最靠后的有效块（正文末尾的才是真正输出）
        let match = null;
        const allHoraeMatches = [...message.matchAll(/<horae>([\s\S]*?)<\/horae>/gi)];
        const horaeFieldPattern = /^(time|timestamp|location|atmosphere|scene_desc|characters|costume|item[!]*|item-|event|affection|npc|agenda|agenda-|rel|mood):/m;
        if (allHoraeMatches.length > 1) {
            match = [...allHoraeMatches].reverse().find(m => horaeFieldPattern.test(m[1]))
                || allHoraeMatches[allHoraeMatches.length - 1];
        } else if (allHoraeMatches.length === 1) {
            match = allHoraeMatches[0];
        }
        if (!match) {
            match = message.match(/<!--horae([\s\S]*?)-->/i);
        }

        const allEventMatches = [...message.matchAll(/<horaeevent>([\s\S]*?)<\/horaeevent>/gi)];
        const eventMatch = allEventMatches.length > 1
            ? ([...allEventMatches].reverse().find(m => /^event:/m.test(m[1])) || allEventMatches[allEventMatches.length - 1])
            : allEventMatches[0] || null;
        const tableMatches = [...message.matchAll(/<horaetable[:：]\s*(.+?)>([\s\S]*?)<\/horaetable(?:[:：][^>]*)?>/gi)];
        const rpgMatches = [...message.matchAll(/<horaerpg>([\s\S]*?)<\/horaerpg>/gi)];

        if (!match && !eventMatch && tableMatches.length === 0 && rpgMatches.length === 0) return null;

        const content = match ? match[1].trim() : '';
        const eventContent = eventMatch ? eventMatch[1].trim() : '';
        const lines = content.split('\n').concat(eventContent.split('\n'));

        const result = {
            timestamp: {},
            costumes: {},
            items: {},
            deletedItems: [],
            events: [],
            affection: {},
            npcs: {},
            scene: {},
            agenda: [],
            deletedAgenda: [],
            mood: {},
            relationships: [],
        };

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // time:10/1 15:00 或 time:小镇历永夜2931年 2月1日(五) 20:30
            if (trimmedLine.startsWith('time:')) {
                const timeStr = trimmedLine.substring(5).trim();
                // 从末尾分离 HH:MM 时钟时间
                const clockMatch = timeStr.match(/\b(\d{1,2}:\d{2})\s*$/);
                if (clockMatch) {
                    result.timestamp.story_time = clockMatch[1];
                    result.timestamp.story_date = timeStr.substring(0, timeStr.lastIndexOf(clockMatch[1])).trim();
                } else {
                    // 无时钟时间，整个字符串作为日期
                    result.timestamp.story_date = timeStr;
                    result.timestamp.story_time = '';
                }
            }
            // location:咖啡馆二楼
            else if (trimmedLine.startsWith('location:')) {
                result.scene.location = trimmedLine.substring(9).trim();
            }
            // atmosphere:轻松
            else if (trimmedLine.startsWith('atmosphere:')) {
                result.scene.atmosphere = trimmedLine.substring(11).trim();
            }
            // scene_desc:地点的固定物理特征描述（支持同一回复多场景配对）
            else if (trimmedLine.startsWith('scene_desc:')) {
                const desc = trimmedLine.substring(11).trim();
                result.scene.scene_desc = desc;
                if (result.scene.location && desc) {
                    if (!result.scene._descPairs) result.scene._descPairs = [];
                    result.scene._descPairs.push({ location: result.scene.location, desc });
                }
            }
            // characters:爱丽丝,鲍勃
            else if (trimmedLine.startsWith('characters:')) {
                const chars = trimmedLine.substring(11).trim();
                result.scene.characters_present = chars.split(/[,，]/).map(c => c.trim()).filter(Boolean);
            }
            // costume:爱丽丝=白色连衣裙
            else if (trimmedLine.startsWith('costume:')) {
                const costumeStr = trimmedLine.substring(8).trim();
                const eqIndex = costumeStr.indexOf('=');
                if (eqIndex > 0) {
                    const char = costumeStr.substring(0, eqIndex).trim();
                    const costume = costumeStr.substring(eqIndex + 1).trim();
                    result.costumes[char] = costume;
                }
            }
            // item-:物品名 表示物品已消耗/删除
            else if (trimmedLine.startsWith('item-:')) {
                const itemName = trimmedLine.substring(6).trim();
                const cleanName = itemName.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, '').trim();
                if (cleanName) {
                    result.deletedItems.push(cleanName);
                }
            }
            // item:🍺劣质麦酒|描述=酒馆@吧台 / item!:📜重要物品|特殊功能描述=角色@位置 / item!!:💎关键物品=@位置
            else if (trimmedLine.startsWith('item!!:') || trimmedLine.startsWith('item!:') || trimmedLine.startsWith('item:')) {
                let importance = '';  // 一般用空字符串
                let itemStr;
                if (trimmedLine.startsWith('item!!:')) {
                    importance = '!!';  // 关键
                    itemStr = trimmedLine.substring(7).trim();
                } else if (trimmedLine.startsWith('item!:')) {
                    importance = '!';   // 重要
                    itemStr = trimmedLine.substring(6).trim();
                } else {
                    itemStr = trimmedLine.substring(5).trim();
                }

                const eqIndex = itemStr.indexOf('=');
                if (eqIndex > 0) {
                    let itemNamePart = itemStr.substring(0, eqIndex).trim();
                    const rest = itemStr.substring(eqIndex + 1).trim();

                    let icon = null;
                    let itemName = itemNamePart;
                    let description = undefined;  // undefined = 合并时不覆盖原有描述

                    const emojiMatch = itemNamePart.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}])/u);
                    if (emojiMatch) {
                        icon = emojiMatch[1];
                        itemNamePart = itemNamePart.substring(icon.length).trim();
                    }

                    const pipeIndex = itemNamePart.indexOf('|');
                    if (pipeIndex > 0) {
                        itemName = itemNamePart.substring(0, pipeIndex).trim();
                        const descText = itemNamePart.substring(pipeIndex + 1).trim();
                        if (descText) description = descText;
                    } else {
                        itemName = itemNamePart;
                    }

                    // 去掉无意义的数量标记
                    itemName = itemName.replace(/[\(（]1[\)）]$/, '').trim();
                    itemName = itemName.replace(new RegExp(`[\\(（]1[${COUNTING_CLASSIFIERS}][\\)）]$`), '').trim();
                    itemName = itemName.replace(new RegExp(`[\\(（][${COUNTING_CLASSIFIERS}][\\)）]$`), '').trim();

                    const atIndex = rest.indexOf('@');
                    const itemInfo = {
                        icon: icon,
                        importance: importance,
                        holder: atIndex >= 0 ? (rest.substring(0, atIndex).trim() || null) : (rest || null),
                        location: atIndex >= 0 ? (rest.substring(atIndex + 1).trim() || '') : ''
                    };
                    if (description !== undefined) itemInfo.description = description;
                    result.items[itemName] = itemInfo;
                }
            }
            // event:重要|爱丽丝坦白了秘密
            else if (trimmedLine.startsWith('event:')) {
                const eventStr = trimmedLine.substring(6).trim();
                const parts = eventStr.split('|');
                if (parts.length >= 2) {
                    const levelRaw = parts[0].trim();
                    const summary = parts.slice(1).join('|').trim();

                    let level = '一般';
                    if (levelRaw === '关键' || levelRaw === '關鍵' || levelRaw.toLowerCase() === 'critical') {
                        level = '关键';
                    } else if (levelRaw === '重要' || levelRaw.toLowerCase() === 'important') {
                        level = '重要';
                    }

                    result.events.push({
                        is_important: level === '重要' || level === '关键',
                        level: level,
                        summary: summary
                    });
                }
            }
            // affection:鲍勃=65 或 affection:鲍勃+5（兼容新旧格式）
            // 容忍AI附加注解如 affection:汤姆=18(+0)|观察到xxx，只提取名字和数值
            else if (trimmedLine.startsWith('affection:')) {
                const affStr = trimmedLine.substring(10).trim();
                // 新格式：角色名=数值（绝对值，允许带正负号如 =+28 或 =-15）
                const absoluteMatch = affStr.match(/^(.+?)=\s*([+\-]?\d+\.?\d*)/);
                if (absoluteMatch) {
                    const key = absoluteMatch[1].trim();
                    const value = parseFloat(absoluteMatch[2]);
                    result.affection[key] = { type: 'absolute', value: value };
                } else {
                    // 旧格式：角色名+/-数值（相对值，无=号）— 允许数值后跟任意注解
                    const relativeMatch = affStr.match(/^(.+?)([+\-]\d+\.?\d*)/);
                    if (relativeMatch) {
                        const key = relativeMatch[1].trim();
                        const value = relativeMatch[2];
                        result.affection[key] = { type: 'relative', value: value };
                    }
                }
            }
            // npc:名|外貌=性格@关系~性别:男~年龄:25~种族:人类~职业:佣兵~补充:xxx
            // 使用 ~ 分隔扩展字段（key:value），不依赖顺序
            else if (trimmedLine.startsWith('npc:')) {
                const npcStr = trimmedLine.substring(4).trim();
                const npcInfo = this._parseNpcFields(npcStr);
                const name = npcInfo._name;
                delete npcInfo._name;

                if (name) {
                    npcInfo.last_seen = new Date().toISOString();
                    if (!result.npcs[name]) {
                        npcInfo.first_seen = new Date().toISOString();
                    }
                    result.npcs[name] = npcInfo;
                }
            }
            // agenda-:已完成待办内容 / agenda:订立日期|内容
            else if (trimmedLine.startsWith('agenda-:')) {
                const delStr = trimmedLine.substring(8).trim();
                if (delStr) {
                    const pipeIdx = delStr.indexOf('|');
                    const text = pipeIdx > 0 ? delStr.substring(pipeIdx + 1).trim() : delStr;
                    if (text) {
                        result.deletedAgenda.push(text);
                    }
                }
            }
            else if (trimmedLine.startsWith('agenda:')) {
                const agendaStr = trimmedLine.substring(7).trim();
                const pipeIdx = agendaStr.indexOf('|');
                let dateStr = '', text = '';
                if (pipeIdx > 0) {
                    dateStr = agendaStr.substring(0, pipeIdx).trim();
                    text = agendaStr.substring(pipeIdx + 1).trim();
                } else {
                    text = agendaStr;
                }
                if (text) {
                    // 检测 AI 用括号标记完成的情况，自动归入 deletedAgenda
                    const doneMatch = text.match(/[\(（](完成|已完成|done|finished|completed|失效|取消|已取消)[\)）]\s*$/i);
                    if (doneMatch) {
                        const cleanText = text.substring(0, text.length - doneMatch[0].length).trim();
                        if (cleanText) result.deletedAgenda.push(cleanText);
                    } else {
                        result.agenda.push({ date: dateStr, text, source: 'ai', done: false });
                    }
                }
            }
            // rel:角色A>角色B=关系类型|备注
            else if (trimmedLine.startsWith('rel:')) {
                const relStr = trimmedLine.substring(4).trim();
                const arrowIdx = relStr.indexOf('>');
                const eqIdx = relStr.indexOf('=');
                if (arrowIdx > 0 && eqIdx > arrowIdx) {
                    const from = relStr.substring(0, arrowIdx).trim();
                    const to = relStr.substring(arrowIdx + 1, eqIdx).trim();
                    const rest = relStr.substring(eqIdx + 1).trim();
                    const pipeIdx = rest.indexOf('|');
                    const type = pipeIdx > 0 ? rest.substring(0, pipeIdx).trim() : rest;
                    const note = pipeIdx > 0 ? rest.substring(pipeIdx + 1).trim() : '';
                    if (from && to && type) {
                        result.relationships.push({ from, to, type, note });
                    }
                }
            }
            // mood:角色名=情绪状态
            else if (trimmedLine.startsWith('mood:')) {
                const moodStr = trimmedLine.substring(5).trim();
                const eqIdx = moodStr.indexOf('=');
                if (eqIdx > 0) {
                    const charName = moodStr.substring(0, eqIdx).trim();
                    const emotion = moodStr.substring(eqIdx + 1).trim();
                    if (charName && emotion) {
                        result.mood[charName] = emotion;
                    }
                }
            }
        }

        // 解析自定义表格数据
        if (tableMatches.length > 0) {
            result.tableUpdates = [];
            for (const tm of tableMatches) {
                const tableName = tm[1].trim();
                const tableContent = tm[2].trim();
                const updates = this._parseTableCellEntries(tableContent);

                if (Object.keys(updates).length > 0) {
                    result.tableUpdates.push({ name: tableName, updates });
                }
            }
        }

        // 解析 RPG 数据
        if (rpgMatches.length > 0) {
            result.rpg = { bars: {}, status: {}, skills: [], removedSkills: [], attributes: {}, reputation: {}, equipment: [], unequip: [], levels: {}, xp: {}, currency: [], baseChanges: [] };
            const rm = [...rpgMatches].reverse().find(m => String(m[1] || '').trim()) || rpgMatches[rpgMatches.length - 1];
            const rpgContent = rm[1].trim();
            for (const rpgLine of rpgContent.split('\n')) {
                const trimmed = rpgLine.trim();
                if (trimmed) this._parseRpgLine(trimmed, result.rpg);
            }
        }

        return result;
    }

    /** 将解析结果合并到元数据 */
    mergeParsedToMeta(baseMeta, parsed) {
        const meta = baseMeta ? JSON.parse(JSON.stringify(baseMeta)) : createEmptyMeta();

        if (parsed.timestamp?.story_date) {
            meta.timestamp.story_date = parsed.timestamp.story_date;
        }
        if (parsed.timestamp?.story_time) {
            meta.timestamp.story_time = parsed.timestamp.story_time;
        }
        meta.timestamp.absolute = new Date().toISOString();

        if (parsed.scene?.location) {
            meta.scene.location = parsed.scene.location;
        }
        if (parsed.scene?.atmosphere) {
            meta.scene.atmosphere = parsed.scene.atmosphere;
        }
        if (parsed.scene?.scene_desc) {
            meta.scene.scene_desc = parsed.scene.scene_desc;
        }
        if (parsed.scene?.characters_present?.length > 0) {
            meta.scene.characters_present = parsed.scene.characters_present;
        }

        if (parsed.costumes) {
            Object.assign(meta.costumes, parsed.costumes);
        }

        if (parsed.items) {
            Object.assign(meta.items, parsed.items);
        }

        if (parsed.deletedItems && parsed.deletedItems.length > 0) {
            if (!meta.deletedItems) meta.deletedItems = [];
            meta.deletedItems = [...new Set([...meta.deletedItems, ...parsed.deletedItems])];
        }

        // 支持新格式（events数组）和旧格式（单个event）
        if (parsed.events && parsed.events.length > 0) {
            meta.events = parsed.events;
        } else if (parsed.event) {
            // 兼容旧格式：转换为数组
            meta.events = [parsed.event];
        }

        if (parsed.affection) {
            Object.assign(meta.affection, parsed.affection);
        }

        if (parsed.npcs) {
            Object.assign(meta.npcs, parsed.npcs);
        }

        // 追加AI写入的待办（跳过用户已手动删除的）
        if (parsed.agenda && parsed.agenda.length > 0) {
            if (!meta.agenda) meta.agenda = [];
            const chat0 = this.getChat()?.[0];
            const deletedSet = new Set(chat0?.horae_meta?._deletedAgendaTexts || []);
            const localDeletedSet = new Set(parsed.deletedAgenda || []);
            for (const item of parsed.agenda) {
                if (deletedSet.has(item.text)) continue;
                if (localDeletedSet.has(item.text)) continue;
                const isDupe = meta.agenda.some(a => a.text === item.text);
                if (!isDupe) {
                    meta.agenda.push(item);
                }
            }
        }

        if (parsed.deletedAgenda && parsed.deletedAgenda.length > 0) {
            if (!meta.deletedAgenda) meta.deletedAgenda = [];
            for (const text of parsed.deletedAgenda) {
                const normalized = String(text || '').trim();
                if (!normalized) continue;
                if (!meta.deletedAgenda.includes(normalized)) {
                    meta.deletedAgenda.push(normalized);
                }
            }
        }

        // 关系网络：存入当前消息（后续由 processAIResponse 合并到 chat[0]）
        if (parsed.relationships && parsed.relationships.length > 0) {
            if (!meta.relationships) meta.relationships = [];
            meta.relationships = parsed.relationships;
        }

        // 情绪状态
        if (parsed.mood && Object.keys(parsed.mood).length > 0) {
            if (!meta.mood) meta.mood = {};
            Object.assign(meta.mood, parsed.mood);
        }

        // tableUpdates 作为副属性传递
        if (parsed.tableUpdates) {
            meta._tableUpdates = parsed.tableUpdates;
        }

        if (parsed.rpg) {
            const r = parsed.rpg;
            const hasContent = Object.keys(r.bars || {}).length > 0
                || Object.keys(r.status || {}).length > 0
                || (r.skills || []).length > 0
                || (r.removedSkills || []).length > 0
                || Object.keys(r.attributes || {}).length > 0
                || Object.keys(r.reputation || {}).length > 0
                || (r.equipment || []).length > 0
                || (r.unequip || []).length > 0
                || Object.keys(r.levels || {}).length > 0
                || Object.keys(r.xp || {}).length > 0
                || (r.currency || []).length > 0
                || (r.baseChanges || []).length > 0;
            if (hasContent) {
                meta._rpgChanges = parsed.rpg;
            }
        }

        return meta;
    }

    /** 解析单行 RPG 数据 */
    _parseRpgLine(line, rpg) {
        const _uoName = this.context?.name1 || '主角';
        const _uoB = !!this.settings?.rpgBarsUserOnly;
        const _uoS = !!this.settings?.rpgSkillsUserOnly;
        const _uoA = !!this.settings?.rpgAttrsUserOnly;
        const _uoE = !!this.settings?.rpgEquipmentUserOnly;
        const _uoR = !!this.settings?.rpgReputationUserOnly;
        const _uoL = !!this.settings?.rpgLevelUserOnly;
        const _uoC = !!this.settings?.rpgCurrencyUserOnly;

        // 通用：检测行是否为无owner的userOnly格式（首段含=即正常格式，否则可能是UO格式）
        // 属性条: 正常 key:owner=cur/max 或 userOnly key:cur/max(显示名)
        const barNormal = line.match(/^([a-zA-Z]\w*):(.+?)=(\d+)\s*\/\s*(\d+)(?:\((.+?)\))?$/i);
        const barUo = _uoB ? line.match(/^([a-zA-Z]\w*):(\d+)\s*\/\s*(\d+)(?:\((.+?)\))?$/i) : null;
        if (barNormal && !/^(status|skill)$/i.test(barNormal[1])) {
            const type = barNormal[1].toLowerCase();
            const owner = _uoB ? _uoName : barNormal[2].trim();
            const current = parseInt(barNormal[3]);
            const max = parseInt(barNormal[4]);
            const label = barNormal[5]?.trim() || null;
            if (!rpg.bars[owner]) rpg.bars[owner] = {};
            rpg.bars[owner][type] = label ? [current, max, label] : [current, max];
            return;
        }
        if (barUo && !/^(status|skill)$/i.test(barUo[1])) {
            const type = barUo[1].toLowerCase();
            const current = parseInt(barUo[2]);
            const max = parseInt(barUo[3]);
            const label = barUo[4]?.trim() || null;
            if (!rpg.bars[_uoName]) rpg.bars[_uoName] = {};
            rpg.bars[_uoName][type] = label ? [current, max, label] : [current, max];
            return;
        }
        // status
        if (line.startsWith('status:')) {
            const str = line.substring(7).trim();
            const eq = str.indexOf('=');
            if (_uoB && eq < 0) {
                rpg.status[_uoName] = (!str || /^(正常|无|無|none|normal|clear)$/i.test(str))
                    ? [] : str.split('/').map(s => s.trim()).filter(Boolean);
            } else if (eq > 0) {
                const owner = _uoB ? _uoName : str.substring(0, eq).trim();
                const val = str.substring(eq + 1).trim();
                rpg.status[owner] = (!val || /^(正常|无|無|none|normal|clear)$/i.test(val))
                    ? [] : val.split('/').map(s => s.trim()).filter(Boolean);
            }
            return;
        }
        // skill
        if (line.startsWith('skill:')) {
            const parts = line.substring(6).trim().split('|').map(s => s.trim());
            if (_uoS && parts.length >= 1) {
                rpg.skills.push({ owner: _uoName, name: parts[0], level: parts[1] || '', desc: parts[2] || '' });
            } else if (parts.length >= 2) {
                rpg.skills.push({ owner: parts[0], name: parts[1], level: parts[2] || '', desc: parts[3] || '' });
            }
            return;
        }
        // skill-
        if (line.startsWith('skill-:')) {
            const parts = line.substring(7).trim().split('|').map(s => s.trim());
            if (_uoS && parts.length >= 1) {
                rpg.removedSkills.push({ owner: _uoName, name: parts[0] });
            } else if (parts.length >= 2) {
                rpg.removedSkills.push({ owner: parts[0], name: parts[1] });
            }
            return;
        }
        // equip
        if (line.startsWith('equip:')) {
            const parts = line.substring(6).trim().split('|').map(s => s.trim());
            const minParts = _uoE ? 2 : 3;
            if (parts.length >= minParts) {
                const owner = _uoE ? _uoName : parts[0];
                const slot = _uoE ? parts[0] : parts[1];
                const itemName = _uoE ? parts[1] : parts[2];
                const attrPart = _uoE ? parts[2] : parts[3];
                const attrs = {};
                if (attrPart) {
                    for (const kv of attrPart.split(',')) {
                        const m = kv.trim().match(/^(.+?)=(-?\d+)$/);
                        if (m) attrs[m[1].trim()] = parseInt(m[2]);
                    }
                }
                if (!rpg.equipment) rpg.equipment = [];
                rpg.equipment.push({ owner, slot, name: itemName, attrs });
            }
            return;
        }
        // unequip
        if (line.startsWith('unequip:')) {
            const parts = line.substring(8).trim().split('|').map(s => s.trim());
            const minParts = _uoE ? 2 : 3;
            if (parts.length >= minParts) {
                if (!rpg.unequip) rpg.unequip = [];
                if (_uoE) {
                    rpg.unequip.push({ owner: _uoName, slot: parts[0], name: parts[1] });
                } else {
                    rpg.unequip.push({ owner: parts[0], slot: parts[1], name: parts[2] });
                }
            }
            return;
        }
        // rep
        if (line.startsWith('rep:')) {
            const parts = line.substring(4).trim().split('|').map(s => s.trim());
            if (_uoR && parts.length >= 1) {
                const kv = parts[0].match(/^(.+?)=(-?\d+)$/);
                if (kv) {
                    if (!rpg.reputation) rpg.reputation = {};
                    if (!rpg.reputation[_uoName]) rpg.reputation[_uoName] = {};
                    rpg.reputation[_uoName][kv[1].trim()] = parseInt(kv[2]);
                }
            } else if (parts.length >= 2) {
                const owner = parts[0];
                const kv = parts[1].match(/^(.+?)=(-?\d+)$/);
                if (kv) {
                    if (!rpg.reputation) rpg.reputation = {};
                    if (!rpg.reputation[owner]) rpg.reputation[owner] = {};
                    rpg.reputation[owner][kv[1].trim()] = parseInt(kv[2]);
                }
            }
            return;
        }
        // level
        if (line.startsWith('level:')) {
            const str = line.substring(6).trim();
            if (_uoL) {
                const val = parseInt(str);
                if (!isNaN(val)) {
                    if (!rpg.levels) rpg.levels = {};
                    rpg.levels[_uoName] = val;
                }
            } else {
                const eq = str.indexOf('=');
                if (eq > 0) {
                    const owner = str.substring(0, eq).trim();
                    const val = parseInt(str.substring(eq + 1).trim());
                    if (!isNaN(val)) {
                        if (!rpg.levels) rpg.levels = {};
                        rpg.levels[owner] = val;
                    }
                }
            }
            return;
        }
        // xp
        if (line.startsWith('xp:')) {
            const str = line.substring(3).trim();
            if (_uoL) {
                const m = str.match(/^(\d+)\s*\/\s*(\d+)$/);
                if (m) {
                    if (!rpg.xp) rpg.xp = {};
                    rpg.xp[_uoName] = [parseInt(m[1]), parseInt(m[2])];
                }
            } else {
                const eq = str.indexOf('=');
                if (eq > 0) {
                    const owner = str.substring(0, eq).trim();
                    const valStr = str.substring(eq + 1).trim();
                    const m = valStr.match(/^(\d+)\s*\/\s*(\d+)$/);
                    if (m) {
                        if (!rpg.xp) rpg.xp = {};
                        rpg.xp[owner] = [parseInt(m[1]), parseInt(m[2])];
                    }
                }
            }
            return;
        }
        // currency
        if (line.startsWith('currency:')) {
            const parts = line.substring(9).trim().split('|').map(s => s.trim());
            if (_uoC && parts.length >= 1) {
                const kvStr = parts.length >= 2 ? parts[1] : parts[0];
                const kv = kvStr.match(/^(.+?)=([+-]?\d+)$/);
                if (kv) {
                    if (!rpg.currency) rpg.currency = [];
                    const rawVal = kv[2];
                    const isDelta = rawVal.startsWith('+') || rawVal.startsWith('-');
                    rpg.currency.push({ owner: _uoName, name: kv[1].trim(), value: parseInt(rawVal), isDelta });
                }
            } else if (parts.length >= 2) {
                const owner = parts[0];
                const kv = parts[1].match(/^(.+?)=([+-]?\d+)$/);
                if (kv) {
                    if (!rpg.currency) rpg.currency = [];
                    const rawVal = kv[2];
                    const isDelta = rawVal.startsWith('+') || rawVal.startsWith('-');
                    rpg.currency.push({ owner, name: kv[1].trim(), value: parseInt(rawVal), isDelta });
                }
            }
            return;
        }
        // attr
        if (line.startsWith('attr:')) {
            const parts = line.substring(5).trim().split('|').map(s => s.trim());
            if (parts.length >= 1) {
                let owner, startIdx;
                if (_uoA) {
                    owner = _uoName;
                    startIdx = 0;
                } else {
                    owner = parts[0];
                    startIdx = 1;
                }
                const vals = {};
                for (let i = startIdx; i < parts.length; i++) {
                    const kv = parts[i].match(/^(\w+)=(\d+)$/);
                    if (kv) vals[kv[1].toLowerCase()] = parseInt(kv[2]);
                }
                if (Object.keys(vals).length) {
                    if (!rpg.attributes) rpg.attributes = {};
                    rpg.attributes[owner] = vals;
                }
            }
            return;
        }
        // base:据点路径=等级 或 base:据点路径|desc=描述
        // 路径用 > 分隔层级，如 base:主角庄园>锻造区>锻造炉=2
        if (line.startsWith('base:')) {
            if (!rpg.baseChanges) rpg.baseChanges = [];
            const raw = line.substring(5).trim();
            const pipeIdx = raw.indexOf('|');
            if (pipeIdx >= 0) {
                const path = raw.substring(0, pipeIdx).trim();
                const rest = raw.substring(pipeIdx + 1).trim();
                const kv = rest.match(/^(desc|level)=(.+)$/);
                if (kv) {
                    rpg.baseChanges.push({ path, field: kv[1], value: kv[2].trim() });
                }
            } else {
                const eqIdx = raw.indexOf('=');
                if (eqIdx >= 0) {
                    const path = raw.substring(0, eqIdx).trim();
                    const val = raw.substring(eqIdx + 1).trim();
                    const numVal = parseInt(val);
                    if (!isNaN(numVal)) {
                        rpg.baseChanges.push({ path, field: 'level', value: numVal });
                    } else {
                        rpg.baseChanges.push({ path, field: 'desc', value: val });
                    }
                }
            }
        }
    }

    /** 解析归属者：优先 N 编号 → 占位符替换 → NPC/user 别名反查 */
    _resolveRpgOwner(ownerStr) {
        if (ownerStr == null) return ownerStr;
        let raw = String(ownerStr).trim();
        if (!raw) return raw;

        const _user = this.context?.name1 || '';
        const _char = this.context?.name2 || '';
        if (_user) raw = raw.replace(/\{\{\s*user\s*\}\}/gi, _user);
        if (_char) raw = raw.replace(/\{\{\s*char\s*\}\}/gi, _char);

        const m = raw.match(/^N(\d+)\s+(.+)$/);
        if (m) {
            const npcId = m[1];
            const padded = padItemId(parseInt(npcId, 10));
            const chat = this.getChat();
            for (let i = chat.length - 1; i >= 0; i--) {
                const npcs = chat[i]?.horae_meta?.npcs;
                if (!npcs) continue;
                for (const [name, info] of Object.entries(npcs)) {
                    if (String(info._id) === npcId || info._id === padded) return name;
                }
            }
            raw = m[2].trim();
        }

        const chat = this.getChat();
        if (chat?.length) {
            for (let i = chat.length - 1; i >= 0; i--) {
                const npcs = chat[i]?.horae_meta?.npcs;
                if (!npcs) continue;
                if (npcs[raw]) return raw;
                for (const [name, info] of Object.entries(npcs)) {
                    if (info?._aliases?.includes(raw)) return name;
                }
            }
            const userAliases = chat[0]?.horae_meta?._userAliases;
            if (_user && Array.isArray(userAliases) && userAliases.includes(raw)) {
                return _user;
            }
        }

        return raw;
    }

    /** 合并 RPG 变更到 chat[0].horae_meta.rpg
     *  @param {boolean} [readOnly=false] rebuild 路径设为 true，跳过物品转移等破坏性操作
     */
    _mergeRpgData(changes, readOnly = false) {
        const chat = this.getChat();
        if (!chat?.length || !changes) return;
        const first = chat[0];
        if (!first.horae_meta) first.horae_meta = createEmptyMeta();
        if (!first.horae_meta.rpg) first.horae_meta.rpg = { bars: {}, status: {}, skills: {} };
        const rpg = first.horae_meta.rpg;

        const _mUN = this.context?.name1 || '主角';

        for (const [raw, barData] of Object.entries(changes.bars || {})) {
            const owner = this._resolveRpgOwner(raw);
            if (this.settings?.rpgBarsUserOnly && owner !== _mUN) continue;
            if (!rpg.bars[owner]) rpg.bars[owner] = {};
            Object.assign(rpg.bars[owner], barData);
        }
        for (const [raw, effects] of Object.entries(changes.status || {})) {
            const owner = this._resolveRpgOwner(raw);
            if (this.settings?.rpgBarsUserOnly && owner !== _mUN) continue;
            if (!rpg.status) rpg.status = {};
            rpg.status[owner] = effects;
        }
        const _deletedSkillSet = new Set((rpg._deletedSkills || []).map(d => `${d.owner}\0${d.name}`));
        for (const sk of (changes.skills || [])) {
            const owner = this._resolveRpgOwner(sk.owner);
            if (this.settings?.rpgSkillsUserOnly && owner !== _mUN) continue;
            if (_deletedSkillSet.has(`${owner}\0${sk.name}`)) continue;
            if (!rpg.skills[owner]) rpg.skills[owner] = [];
            const idx = rpg.skills[owner].findIndex(s => s.name === sk.name);
            if (idx >= 0) {
                if (sk.level != null) rpg.skills[owner][idx].level = sk.level;
                if (sk.desc != null) rpg.skills[owner][idx].desc = sk.desc;
            } else {
                rpg.skills[owner].push({ name: sk.name, level: sk.level, desc: sk.desc });
            }
        }
        for (const sk of (changes.removedSkills || [])) {
            const owner = this._resolveRpgOwner(sk.owner);
            if (this.settings?.rpgSkillsUserOnly && owner !== _mUN) continue;
            if (rpg.skills[owner]) {
                rpg.skills[owner] = rpg.skills[owner].filter(s => s.name !== sk.name);
            }
        }
        // 多维属性
        for (const [raw, vals] of Object.entries(changes.attributes || {})) {
            const owner = this._resolveRpgOwner(raw);
            if (this.settings?.rpgAttrsUserOnly && owner !== _mUN) continue;
            if (!rpg.attributes) rpg.attributes = {};
            rpg.attributes[owner] = { ...(rpg.attributes[owner] || {}), ...vals };
        }
        // 装备：按角色独立格位配置
        if (changes.equipment?.length > 0 || changes.unequip?.length > 0) {
            if (!rpg.equipmentConfig) rpg.equipmentConfig = { locked: false, perChar: {} };
            if (!rpg.equipmentConfig.perChar) rpg.equipmentConfig.perChar = {};
            if (!rpg.equipment) rpg.equipment = {};
            const _getOwnerSlots = (owner) => {
                const pc = rpg.equipmentConfig.perChar[owner];
                if (!pc || !Array.isArray(pc.slots)) return { valid: new Set(), deleted: new Set(), maxMap: {}, locked: !!rpg.equipmentConfig.locked };
                return {
                    valid: new Set(pc.slots.map(s => s.name)),
                    deleted: new Set(pc._deletedSlots || []),
                    maxMap: Object.fromEntries(pc.slots.map(s => [s.name, s.maxCount ?? 1])),
                    locked: !!rpg.equipmentConfig.locked,
                };
            };
            const _findAndTakeItem = (name) => {
                if (readOnly) return null;
                const state = this.getLatestState();
                const itemInfo = state?.items?.[name];
                if (!itemInfo) return null;
                const meta = { icon: itemInfo.icon || '', description: itemInfo.description || '', importance: itemInfo.importance || '', _id: itemInfo._id || '', _locked: itemInfo._locked || false };
                for (let k = chat.length - 1; k >= 0; k--) {
                    if (chat[k]?.horae_meta?.items?.[name]) { delete chat[k].horae_meta.items[name]; break; }
                }
                return meta;
            };
            const _returnItemFromEquip = (entry, owner) => {
                if (readOnly) return;
                if (!first.horae_meta.items) first.horae_meta.items = {};
                const m = entry._itemMeta || {};
                first.horae_meta.items[entry.name] = {
                    icon: m.icon || '📦', description: m.description || '', importance: m.importance || '',
                    holder: owner, location: '', _id: m._id || '', _locked: m._locked || false,
                };
            };
            for (const u of (changes.unequip || [])) {
                const owner = this._resolveRpgOwner(u.owner);
                if (this.settings?.rpgEquipmentUserOnly && owner !== _mUN) continue;
                if (!rpg.equipment[owner]?.[u.slot]) continue;
                const removed = rpg.equipment[owner][u.slot].find(e => e.name === u.name);
                rpg.equipment[owner][u.slot] = rpg.equipment[owner][u.slot].filter(e => e.name !== u.name);
                if (removed) _returnItemFromEquip(removed, owner);
                if (!rpg.equipment[owner][u.slot].length) delete rpg.equipment[owner][u.slot];
                if (rpg.equipment[owner] && !Object.keys(rpg.equipment[owner]).length) delete rpg.equipment[owner];
            }
            for (const eq of (changes.equipment || [])) {
                const slotName = eq.slot;
                const owner = this._resolveRpgOwner(eq.owner);
                if (this.settings?.rpgEquipmentUserOnly && owner !== _mUN) continue;
                const { valid, deleted, maxMap, locked } = _getOwnerSlots(owner);
                if (locked && (valid.size === 0 || !valid.has(slotName) || deleted.has(slotName))) continue;
                if (valid.size > 0 && (!valid.has(slotName) || deleted.has(slotName))) continue;
                if (!rpg.equipment[owner]) rpg.equipment[owner] = {};
                if (!rpg.equipment[owner][slotName]) rpg.equipment[owner][slotName] = [];
                const existing = rpg.equipment[owner][slotName].findIndex(e => e.name === eq.name);
                if (existing >= 0) {
                    rpg.equipment[owner][slotName][existing].attrs = eq.attrs;
                } else {
                    const maxCount = maxMap[slotName] ?? 1;
                    if (rpg.equipment[owner][slotName].length >= maxCount) {
                        const bumped = rpg.equipment[owner][slotName].shift();
                        if (bumped) _returnItemFromEquip(bumped, owner);
                    }
                    const itemMeta = _findAndTakeItem(eq.name);
                    rpg.equipment[owner][slotName].push({ name: eq.name, attrs: eq.attrs || {}, ...(itemMeta ? { _itemMeta: itemMeta } : {}) });
                }
            }
        }
        // 声望：只接受 reputationConfig 中已定义且未删除的分类（配置为空时不限制）
        if (changes.reputation && Object.keys(changes.reputation).length > 0) {
            const _cfgs = this.getChat()?.[0]?.horae_meta?._rpgConfigs;
            const repCfg = _cfgs?.reputationConfig || rpg.reputationConfig || { categories: [], _deletedCategories: [] };
            if (!rpg.reputationConfig) rpg.reputationConfig = repCfg;
            if (!rpg.reputation) rpg.reputation = {};
            const validNames = new Set((repCfg.categories || []).map(c => c.name));
            const deleted = new Set(repCfg._deletedCategories || []);
            for (const [raw, cats] of Object.entries(changes.reputation)) {
                const owner = this._resolveRpgOwner(raw);
                if (this.settings?.rpgReputationUserOnly && owner !== _mUN) continue;
                if (!rpg.reputation[owner]) rpg.reputation[owner] = {};
                for (const [catName, val] of Object.entries(cats)) {
                    if (deleted.has(catName)) continue;
                    if (validNames.size > 0 && !validNames.has(catName)) continue;
                    const cfg = rpg.reputationConfig.categories.find(c => c.name === catName);
                    const clamped = Math.max(cfg?.min ?? -100, Math.min(cfg?.max ?? 100, val));
                    if (!rpg.reputation[owner][catName]) {
                        rpg.reputation[owner][catName] = { value: clamped, subItems: {} };
                    } else if (!rpg.reputation[owner][catName]._userEdited) {
                        rpg.reputation[owner][catName].value = clamped;
                    }
                }
            }
        }
        // 等级
        for (const [raw, val] of Object.entries(changes.levels || {})) {
            const owner = this._resolveRpgOwner(raw);
            if (this.settings?.rpgLevelUserOnly && owner !== _mUN) continue;
            if (!rpg.levels) rpg.levels = {};
            rpg.levels[owner] = val;
        }
        // 经验值
        for (const [raw, val] of Object.entries(changes.xp || {})) {
            const owner = this._resolveRpgOwner(raw);
            if (this.settings?.rpgLevelUserOnly && owner !== _mUN) continue;
            if (!rpg.xp) rpg.xp = {};
            rpg.xp[owner] = val;
        }
        // 货币：只接受 currencyConfig 中已定义的币种（配置为空时不限制）
        if (changes.currency?.length > 0) {
            const _cfgs2 = this.getChat()?.[0]?.horae_meta?._rpgConfigs;
            const curCfg = _cfgs2?.currencyConfig || rpg.currencyConfig || { denominations: [] };
            if (!rpg.currencyConfig) rpg.currencyConfig = curCfg;
            if (!rpg.currency) rpg.currency = {};
            const validDenoms = new Set((curCfg.denominations || []).map(d => d.name));
            for (const c of changes.currency) {
                const owner = this._resolveRpgOwner(c.owner);
                if (this.settings?.rpgCurrencyUserOnly && owner !== _mUN) continue;
                if (validDenoms.size > 0 && !validDenoms.has(c.name)) continue;
                if (!rpg.currency[owner]) rpg.currency[owner] = {};
                if (c.isDelta) {
                    rpg.currency[owner][c.name] = (rpg.currency[owner][c.name] || 0) + c.value;
                } else {
                    rpg.currency[owner][c.name] = c.value;
                }
            }
        }
        // 据点变更（跳过用户已删除的节点，防回滚）
        if (changes.baseChanges?.length > 0) {
            if (!rpg.strongholds) rpg.strongholds = [];
            const deletedSh = rpg._deletedStrongholds || [];
            for (const bc of changes.baseChanges) {
                const pathParts = bc.path.split('>').map(s => s.trim()).filter(Boolean);
                let parentId = null;
                let targetNode = null;
                let blocked = false;
                for (const part of pathParts) {
                    const parentName = parentId ? (rpg.strongholds.find(n => n.id === parentId)?.name || null) : null;
                    if (deletedSh.some(d => d.name === part && (d.parent || null) === parentName)) {
                        blocked = true;
                        break;
                    }
                    targetNode = rpg.strongholds.find(n => n.name === part && (n.parent || null) === parentId);
                    if (!targetNode) {
                        targetNode = { id: 'sh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: part, level: null, desc: '', parent: parentId };
                        rpg.strongholds.push(targetNode);
                    }
                    parentId = targetNode.id;
                }
                if (blocked || !targetNode) continue;
                if (bc.field === 'level') targetNode.level = typeof bc.value === 'number' ? bc.value : parseInt(bc.value);
                else if (bc.field === 'desc') targetNode.desc = String(bc.value);
            }
        }
    }

    /** 从所有消息重建 RPG 全局数据（保留用户手动编辑）
     *  config 从 horae_meta._rpgConfigs（顶层键）读取，不依赖 rpg 内部字段。
     */
    rebuildRpgData() {
        const chat = this.getChat();
        if (!chat?.length) return;
        const first = chat[0];
        if (!first.horae_meta) first.horae_meta = createEmptyMeta();
        if (!first.horae_meta.rpg) first.horae_meta.rpg = {};
        const rpg = first.horae_meta.rpg;

        // ── 从 _rpgConfigs 权威来源读取 config，fallback 到 rpg 内部（旧数据迁移） ──
        const cfgs = first.horae_meta._rpgConfigs || {};
        const repCfg = cfgs.reputationConfig || rpg.reputationConfig || { categories: [], _deletedCategories: [] };
        const eqCfg = cfgs.equipmentConfig || rpg.equipmentConfig || { locked: false, perChar: {} };
        const curCfg = cfgs.currencyConfig || rpg.currencyConfig || { denominations: [] };
        const shs = cfgs.strongholds || rpg.strongholds || [];
        const delShs = cfgs._deletedStrongholds || rpg._deletedStrongholds || [];
        const delSkills = cfgs._deletedSkills || rpg._deletedSkills || [];

        // ── 保留用户手动数据 ──
        const userSkills = {};
        for (const [owner, arr] of Object.entries(rpg.skills || {})) {
            const ua = (arr || []).filter(s => s._userAdded);
            if (ua.length) userSkills[owner] = ua;
        }
        const userAttrs = rpg.attributes || {};
        const oldReputation = rpg.reputation ? JSON.parse(JSON.stringify(rpg.reputation)) : {};
        const oldLevels = rpg.levels ? JSON.parse(JSON.stringify(rpg.levels)) : {};
        const oldXp = rpg.xp ? JSON.parse(JSON.stringify(rpg.xp)) : {};
        const oldCurrency = rpg.currency ? JSON.parse(JSON.stringify(rpg.currency)) : {};

        // ── 只重置可重放的数据字段 ──
        rpg.bars = {};
        rpg.status = {};
        rpg.skills = {};
        rpg.attributes = { ...userAttrs };
        rpg.reputation = {};
        rpg.equipment = {};
        rpg.levels = {};
        rpg.xp = {};
        rpg.currency = {};

        // ── config 从权威来源写入 rpg（供 _mergeRpgData 使用） ──
        rpg.reputationConfig = repCfg;
        rpg.equipmentConfig = eqCfg;
        rpg.currencyConfig = curCfg;
        rpg._deletedSkills = delSkills;
        rpg.strongholds = JSON.parse(JSON.stringify(shs));
        rpg._deletedStrongholds = JSON.parse(JSON.stringify(delShs));

        // ── 从所有消息重放 _rpgChanges ──
        for (let i = 0; i < chat.length; i++) {
            const changes = chat[i]?.horae_meta?._rpgChanges;
            if (changes) this._mergeRpgData(changes, true);
        }

        // ── 回填用户手动添加的技能 ──
        for (const [owner, arr] of Object.entries(userSkills)) {
            if (!rpg.skills[owner]) rpg.skills[owner] = [];
            for (const sk of arr) {
                if (!rpg.skills[owner].some(s => s.name === sk.name)) rpg.skills[owner].push(sk);
            }
        }
        for (const del of delSkills) {
            if (rpg.skills[del.owner]) {
                rpg.skills[del.owner] = rpg.skills[del.owner].filter(s => s.name !== del.name);
                if (!rpg.skills[del.owner].length) delete rpg.skills[del.owner];
            }
        }

        // ── 回填手动设置的等级/经验/货币；已有回放值优先，避免覆盖历史变化 ──
        for (const [owner, val] of Object.entries(oldLevels)) {
            if (rpg.levels[owner] === undefined) rpg.levels[owner] = val;
        }
        for (const [owner, val] of Object.entries(oldXp)) {
            if (rpg.xp[owner] === undefined) rpg.xp[owner] = val;
        }
        for (const [owner, coins] of Object.entries(oldCurrency)) {
            if (!rpg.currency[owner]) rpg.currency[owner] = {};
            for (const [name, val] of Object.entries(coins || {})) {
                if (rpg.currency[owner][name] === undefined) rpg.currency[owner][name] = val;
            }
        }

        // ── 回填用户设置的声望 ──
        const deletedRepCats = new Set(rpg.reputationConfig?._deletedCategories || []);
        const validRepCats = new Set((rpg.reputationConfig?.categories || []).map(c => c.name));
        for (const [owner, cats] of Object.entries(oldReputation)) {
            if (!rpg.reputation[owner]) rpg.reputation[owner] = {};
            for (const [catName, data] of Object.entries(cats)) {
                if (deletedRepCats.has(catName)) continue;
                if (validRepCats.size > 0 && !validRepCats.has(catName)) continue;
                if (!rpg.reputation[owner][catName]) {
                    rpg.reputation[owner][catName] = data;
                } else {
                    rpg.reputation[owner][catName].subItems = data.subItems || {};
                    if (data._userEdited) {
                        rpg.reputation[owner][catName].value = data.value;
                        rpg.reputation[owner][catName]._userEdited = true;
                    }
                }
            }
        }

        // ── 同步回 _rpgConfigs 权威存储 ──
        first.horae_meta._rpgConfigs = {
            reputationConfig: rpg.reputationConfig,
            equipmentConfig: rpg.equipmentConfig,
            currencyConfig: rpg.currencyConfig,
            _deletedSkills: rpg._deletedSkills,
            strongholds: rpg.strongholds,
            _deletedStrongholds: rpg._deletedStrongholds,
        };
    }

    /** 获取 RPG 全局数据（chat[0] 累积） */
    getRpgData() {
        return this.getChat()?.[0]?.horae_meta?.rpg || {
            bars: {}, status: {}, skills: {}, attributes: {},
            reputation: {}, reputationConfig: { categories: [], _deletedCategories: [] },
            equipment: {}, equipmentConfig: { locked: false, perChar: {} },
            levels: {}, xp: {},
            currency: {}, currencyConfig: { denominations: [] },
        };
    }

    /**
     * 构建到指定消息位置的 RPG 快照（不修改 chat[0]）
     * @param {number} skipLast - 跳过末尾N条消息（swipe时=1）
     */
    getRpgStateAt(skipLast = 0) {
        const chat = this.getChat();
        if (!chat?.length) return { bars: {}, status: {}, skills: {}, attributes: {}, reputation: {}, equipment: {}, levels: {}, xp: {}, currency: {}, strongholds: [] };
        const end = Math.max(1, chat.length - skipLast);
        const first = chat[0];
        const rpgMeta = first?.horae_meta?.rpg || {};
        const _cfgs = first?.horae_meta?._rpgConfigs || {};
        // 据点：优先从 _rpgConfigs 读取
        const userStrongholds = (_cfgs.strongholds || rpgMeta.strongholds || []).filter(n => n._userAdded);
        const deletedSh = _cfgs._deletedStrongholds || rpgMeta._deletedStrongholds || [];
        const snapshot = {
            bars: {}, status: {}, skills: {}, attributes: {}, reputation: {}, equipment: {},
            levels: {}, xp: {}, currency: {},
            strongholds: JSON.parse(JSON.stringify(userStrongholds)),
        };

        // 用户手动编辑的数据
        const userSkills = {};
        for (const [owner, arr] of Object.entries(rpgMeta.skills || {})) {
            const ua = (arr || []).filter(s => s._userAdded);
            if (ua.length) userSkills[owner] = ua;
        }
        const deletedSkills = rpgMeta._deletedSkills || [];
        const userAttrs = {};
        for (const [owner, vals] of Object.entries(rpgMeta.attributes || {})) {
            userAttrs[owner] = { ...vals };
        }
        const userLevels = rpgMeta.levels || {};
        const userXp = rpgMeta.xp || {};
        const userCurrency = rpgMeta.currency || {};

        // 装备格位配置（优先从 _rpgConfigs 读取）
        const _eqCfg = _cfgs.equipmentConfig || rpgMeta.equipmentConfig || { locked: false, perChar: {} };
        const _eqPerChar = _eqCfg.perChar || {};

        // 从消息中累积属性（snapshot 是独立对象，不污染 chat[0]）
        const _resolve = (raw) => this._resolveRpgOwner(raw);
        for (let i = 0; i < end; i++) {
            const changes = chat[i]?.horae_meta?._rpgChanges;
            if (!changes) continue;
            for (const [raw, barData] of Object.entries(changes.bars || {})) {
                const owner = _resolve(raw);
                if (!snapshot.bars[owner]) snapshot.bars[owner] = {};
                Object.assign(snapshot.bars[owner], barData);
            }
            for (const [raw, effects] of Object.entries(changes.status || {})) {
                const owner = _resolve(raw);
                snapshot.status[owner] = effects;
            }
            for (const sk of (changes.skills || [])) {
                const owner = _resolve(sk.owner);
                if (!snapshot.skills[owner]) snapshot.skills[owner] = [];
                const idx = snapshot.skills[owner].findIndex(s => s.name === sk.name);
                if (idx >= 0) {
                    if (sk.level != null) snapshot.skills[owner][idx].level = sk.level;
                    if (sk.desc != null) snapshot.skills[owner][idx].desc = sk.desc;
                } else {
                    snapshot.skills[owner].push({ name: sk.name, level: sk.level, desc: sk.desc });
                }
            }
            for (const sk of (changes.removedSkills || [])) {
                const owner = _resolve(sk.owner);
                if (snapshot.skills[owner]) {
                    snapshot.skills[owner] = snapshot.skills[owner].filter(s => s.name !== sk.name);
                }
            }
            for (const [raw, vals] of Object.entries(changes.attributes || {})) {
                const owner = _resolve(raw);
                snapshot.attributes[owner] = { ...(snapshot.attributes[owner] || {}), ...vals };
            }
            for (const [raw, cats] of Object.entries(changes.reputation || {})) {
                const owner = _resolve(raw);
                if (!snapshot.reputation[owner]) snapshot.reputation[owner] = {};
                for (const [catName, val] of Object.entries(cats)) {
                    if (!snapshot.reputation[owner][catName]) {
                        snapshot.reputation[owner][catName] = { value: val, subItems: {} };
                    } else {
                        snapshot.reputation[owner][catName].value = val;
                    }
                }
            }
            // 装备
            for (const u of (changes.unequip || [])) {
                const owner = _resolve(u.owner);
                if (!snapshot.equipment[owner]?.[u.slot]) continue;
                snapshot.equipment[owner][u.slot] = snapshot.equipment[owner][u.slot].filter(e => e.name !== u.name);
                if (!snapshot.equipment[owner][u.slot].length) delete snapshot.equipment[owner][u.slot];
                if (!Object.keys(snapshot.equipment[owner] || {}).length) delete snapshot.equipment[owner];
            }
            for (const eq of (changes.equipment || [])) {
                const owner = _resolve(eq.owner);
                const ownerCfg = _eqPerChar[owner];
                const maxCount = (ownerCfg && Array.isArray(ownerCfg.slots))
                    ? (ownerCfg.slots.find(s => s.name === eq.slot)?.maxCount ?? 1) : 1;
                if (!snapshot.equipment[owner]) snapshot.equipment[owner] = {};
                if (!snapshot.equipment[owner][eq.slot]) snapshot.equipment[owner][eq.slot] = [];
                const idx = snapshot.equipment[owner][eq.slot].findIndex(e => e.name === eq.name);
                if (idx >= 0) {
                    snapshot.equipment[owner][eq.slot][idx].attrs = eq.attrs;
                } else {
                    while (snapshot.equipment[owner][eq.slot].length >= maxCount) snapshot.equipment[owner][eq.slot].shift();
                    snapshot.equipment[owner][eq.slot].push({ name: eq.name, attrs: eq.attrs || {} });
                }
            }
            // 等级/经验
            for (const [raw, val] of Object.entries(changes.levels || {})) {
                snapshot.levels[_resolve(raw)] = val;
            }
            for (const [raw, val] of Object.entries(changes.xp || {})) {
                snapshot.xp[_resolve(raw)] = val;
            }
            // 货币（优先从 _rpgConfigs 读取配置）
            const validDenoms = new Set(
                ((_cfgs.currencyConfig || rpgMeta.currencyConfig)?.denominations || []).map(d => d.name)
            );
            for (const c of (changes.currency || [])) {
                if (validDenoms.size && !validDenoms.has(c.name)) continue;
                const owner = _resolve(c.owner);
                if (!snapshot.currency[owner]) snapshot.currency[owner] = {};
                if (c.isDelta) {
                    snapshot.currency[owner][c.name] = (snapshot.currency[owner][c.name] || 0) + c.value;
                } else {
                    snapshot.currency[owner][c.name] = c.value;
                }
            }
            // 据点累积（与 _mergeRpgData 同逻辑，跳过已删除节点）
            if (changes.baseChanges?.length > 0) {
                for (const bc of changes.baseChanges) {
                    const pathParts = bc.path.split('>').map(s => s.trim()).filter(Boolean);
                    let parentId = null;
                    let targetNode = null;
                    let blocked = false;
                    for (const part of pathParts) {
                        const parentName = parentId ? (snapshot.strongholds.find(n => n.id === parentId)?.name || null) : null;
                        if (deletedSh.some(d => d.name === part && (d.parent || null) === parentName)) { blocked = true; break; }
                        targetNode = snapshot.strongholds.find(n => n.name === part && (n.parent || null) === parentId);
                        if (!targetNode) {
                            targetNode = { id: 'sh_' + i + '_' + Math.random().toString(36).slice(2, 6), name: part, level: null, desc: '', parent: parentId };
                            snapshot.strongholds.push(targetNode);
                        }
                        parentId = targetNode.id;
                    }
                    if (blocked || !targetNode) continue;
                    if (bc.field === 'level') targetNode.level = typeof bc.value === 'number' ? bc.value : parseInt(bc.value);
                    else if (bc.field === 'desc') targetNode.desc = String(bc.value);
                }
            }
        }

        // 合入用户手动属性（AI数据优先覆盖）
        for (const [owner, vals] of Object.entries(userAttrs)) {
            if (!snapshot.attributes[owner]) snapshot.attributes[owner] = {};
            for (const [k, v] of Object.entries(vals)) {
                if (snapshot.attributes[owner][k] === undefined) snapshot.attributes[owner][k] = v;
            }
        }
        // 回填用户手动技能
        for (const [owner, arr] of Object.entries(userSkills)) {
            if (!snapshot.skills[owner]) snapshot.skills[owner] = [];
            for (const sk of arr) {
                if (!snapshot.skills[owner].some(s => s.name === sk.name)) snapshot.skills[owner].push(sk);
            }
        }
        // 过滤用户手动删除
        for (const del of deletedSkills) {
            if (snapshot.skills[del.owner]) {
                snapshot.skills[del.owner] = snapshot.skills[del.owner].filter(s => s.name !== del.name);
                if (!snapshot.skills[del.owner].length) delete snapshot.skills[del.owner];
            }
        }
        // 回填手动设置的等级/经验/货币；已有回放值优先
        for (const [owner, val] of Object.entries(userLevels)) {
            if (snapshot.levels[owner] === undefined) snapshot.levels[owner] = val;
        }
        for (const [owner, val] of Object.entries(userXp)) {
            if (snapshot.xp[owner] === undefined) snapshot.xp[owner] = val;
        }
        for (const [owner, coins] of Object.entries(userCurrency)) {
            if (!snapshot.currency[owner]) snapshot.currency[owner] = {};
            for (const [name, val] of Object.entries(coins || {})) {
                if (snapshot.currency[owner][name] === undefined) snapshot.currency[owner][name] = val;
            }
        }
        // 声望：合入用户细项，_userEdited 的主数值优先于 AI 回放结果
        const repConfig = rpgMeta.reputationConfig || { categories: [], _deletedCategories: [] };
        const validRepNames = new Set((repConfig.categories || []).map(c => c.name));
        const deletedRepNames = new Set(repConfig._deletedCategories || []);
        const userRep = rpgMeta.reputation || {};
        for (const [owner, cats] of Object.entries(userRep)) {
            if (!snapshot.reputation[owner]) snapshot.reputation[owner] = {};
            for (const [catName, data] of Object.entries(cats)) {
                if (deletedRepNames.has(catName) || (validRepNames.size > 0 && !validRepNames.has(catName))) continue;
                if (!snapshot.reputation[owner][catName]) {
                    snapshot.reputation[owner][catName] = { ...data };
                } else {
                    snapshot.reputation[owner][catName].subItems = data.subItems || {};
                    if (data._userEdited) {
                        snapshot.reputation[owner][catName].value = data.value;
                        snapshot.reputation[owner][catName]._userEdited = true;
                    }
                }
            }
        }
        // 移除快照中已删除的声望分类
        for (const [owner, cats] of Object.entries(snapshot.reputation)) {
            for (const catName of Object.keys(cats)) {
                if (deletedRepNames.has(catName) || (validRepNames.size > 0 && !validRepNames.has(catName))) {
                    delete cats[catName];
                }
            }
            if (!Object.keys(cats).length) delete snapshot.reputation[owner];
        }
        snapshot.reputationConfig = repConfig;
        // 装备：按角色过滤已删除格位
        for (const [owner, slots] of Object.entries(snapshot.equipment)) {
            const ownerCfg = _eqPerChar[owner];
            if (!ownerCfg || !Array.isArray(ownerCfg.slots)) continue;
            const validEqSlots = new Set(ownerCfg.slots.map(s => s.name));
            const deletedEqSlots = new Set(ownerCfg._deletedSlots || []);
            for (const slotName of Object.keys(slots)) {
                if (deletedEqSlots.has(slotName) || (validEqSlots.size > 0 && !validEqSlots.has(slotName))) {
                    delete slots[slotName];
                }
            }
            if (!Object.keys(slots).length) delete snapshot.equipment[owner];
        }
        snapshot.equipmentConfig = _eqCfg;
        // 货币配置
        snapshot.currencyConfig = rpgMeta.currencyConfig || { denominations: [] };
        return snapshot;
    }

    /** 合并关系数据到 chat[0].horae_meta */
    _mergeRelationships(newRels) {
        const chat = this.getChat();
        if (!chat?.length || !newRels?.length) return;
        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.relationships) firstMsg.horae_meta.relationships = [];
        const existing = firstMsg.horae_meta.relationships;
        for (const rel of newRels) {
            const idx = existing.findIndex(r => r.from === rel.from && r.to === rel.to);
            if (idx >= 0) {
                if (existing[idx]._userEdited) continue;
                existing[idx].type = rel.type;
                if (rel.note) existing[idx].note = rel.note;
            } else {
                existing.push({ ...rel });
            }
        }
    }

    /** 从所有消息重建 chat[0] 的关系网络（用于编辑/删除后回推） */
    rebuildRelationships() {
        const chat = this.getChat();
        if (!chat?.length) return;
        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        // 保留用户手动编辑的关系，其余重建
        const userEdited = (firstMsg.horae_meta.relationships || []).filter(r => r._userEdited);
        firstMsg.horae_meta.relationships = [...userEdited];
        for (let i = 1; i < chat.length; i++) {
            const meta = chat[i]?.horae_meta;
            if (!meta || meta._skipHorae) continue;
            const rels = meta.relationships;
            if (rels?.length) this._mergeRelationships(rels);
        }
    }

    /** 从所有消息重建 chat[0] 的场景记忆（用于编辑/删除/重新生成后回推） */
    rebuildLocationMemory() {
        const chat = this.getChat();
        if (!chat?.length) return;
        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        const existing = firstMsg.horae_meta.locationMemory || {};
        const rebuilt = {};
        const deletedNames = new Set();
        // 保留用户手动创建/编辑的条目，记录已删除的条目
        for (const [name, info] of Object.entries(existing)) {
            if (info._deleted) {
                deletedNames.add(name);
                rebuilt[name] = { ...info };
                continue;
            }
            if (info._userEdited) rebuilt[name] = { ...info };
        }
        // 从消息重放 AI 写入的 scene_desc（按时间顺序，后覆盖前），跳过已删除/用户编辑的
        for (let i = 1; i < chat.length; i++) {
            const meta = chat[i]?.horae_meta;
            if (!meta || meta._skipHorae) continue;
            const pairs = meta?.scene?._descPairs;
            if (pairs?.length > 0) {
                for (const p of pairs) {
                    if (deletedNames.has(p.location)) continue;
                    if (rebuilt[p.location]?._userEdited) continue;
                    rebuilt[p.location] = {
                        desc: p.desc,
                        firstSeen: rebuilt[p.location]?.firstSeen || new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    };
                }
            } else if (meta?.scene?.scene_desc && meta?.scene?.location) {
                const loc = meta.scene.location;
                if (deletedNames.has(loc)) continue;
                if (rebuilt[loc]?._userEdited) continue;
                rebuilt[loc] = {
                    desc: meta.scene.scene_desc,
                    firstSeen: rebuilt[loc]?.firstSeen || new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
            }
        }
        firstMsg.horae_meta.locationMemory = rebuilt;
    }

    getRelationships() {
        const chat = this.getChat();
        return chat?.[0]?.horae_meta?.relationships || [];
    }

    /** 设置关系网络（用户手动编辑时） */
    setRelationships(relationships) {
        const chat = this.getChat();
        if (!chat?.length) return;
        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        firstMsg.horae_meta.relationships = relationships;
    }

    /** 获取指定角色相关的关系（无在场角色时返回空数组） */
    getRelationshipsForCharacters(charNames) {
        if (!charNames?.length) return [];
        const rels = this.getRelationships();
        const nameSet = new Set(charNames);
        return rels.filter(r => nameSet.has(r.from) || nameSet.has(r.to));
    }

    /** 全局删除已完成的待办事项 */
    removeCompletedAgenda(deletedTexts) {
        const chat = this.getChat();
        if (!chat || deletedTexts.length === 0) return;

        const isMatch = (agendaText, deleteText) => {
            if (!agendaText || !deleteText) return false;
            // 精确匹配 或 互相包含（允许AI缩写/扩写）
            return agendaText === deleteText ||
                agendaText.includes(deleteText) ||
                deleteText.includes(agendaText);
        };

        if (chat[0]?.horae_meta?.agenda) {
            chat[0].horae_meta.agenda = chat[0].horae_meta.agenda.filter(
                a => !deletedTexts.some(dt => isMatch(a.text, dt))
            );
        }

        for (let i = 1; i < chat.length; i++) {
            if (chat[i]?.horae_meta?.agenda?.length > 0) {
                chat[i].horae_meta.agenda = chat[i].horae_meta.agenda.filter(
                    a => !deletedTexts.some(dt => isMatch(a.text, dt))
                );
            }
        }
    }

    /** 写入/更新场景记忆到 chat[0] */
    _updateLocationMemory(locationName, desc) {
        const chat = this.getChat();
        if (!chat?.length || !locationName || !desc) return;
        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.locationMemory) firstMsg.horae_meta.locationMemory = {};
        const mem = firstMsg.horae_meta.locationMemory;
        const now = new Date().toISOString();

        // 子级地点去重：若子级描述的"位于"部分重复了父级的地理信息，则自动缩减
        const sepMatch = locationName.match(/[·・\-\/\|]/);
        if (sepMatch) {
            const parentName = locationName.substring(0, sepMatch.index).trim();
            const parentEntry = mem[parentName];
            if (parentEntry?.desc) {
                desc = this._deduplicateChildDesc(desc, parentEntry.desc, parentName);
            }
        }

        if (mem[locationName]) {
            if (mem[locationName]._userEdited || mem[locationName]._deleted) return;
            mem[locationName].desc = desc;
            mem[locationName].lastUpdated = now;
        } else {
            mem[locationName] = { desc, firstSeen: now, lastUpdated: now };
        }
        console.log(`[Horae] 场景记忆已更新: ${locationName}`);
    }

    /**
     * 子级描述去重：检测子级描述是否包含父级的地理位置信息，若包含则替换为相对位置
     */
    _deduplicateChildDesc(childDesc, parentDesc, parentName) {
        if (!childDesc || !parentDesc) return childDesc;
        // 提取父级的"位于"部分
        const parentLocMatch = parentDesc.match(/^位于(.+?)[。\.]/);
        if (!parentLocMatch) return childDesc;
        const parentLocInfo = parentLocMatch[1].trim();
        // 若子级描述也包含父级的地理位置关键词（超过一半的字重合），则认为冗余
        const parentKeywords = parentLocInfo.replace(/[，,、的]/g, ' ').split(/\s+/).filter(k => k.length >= 2);
        if (parentKeywords.length === 0) return childDesc;
        const childLocMatch = childDesc.match(/^位于(.+?)[。\.]/);
        if (!childLocMatch) return childDesc;
        const childLocInfo = childLocMatch[1].trim();
        let matchCount = 0;
        for (const kw of parentKeywords) {
            if (childLocInfo.includes(kw)) matchCount++;
        }
        // 超过一半关键词重合，判定子级抄了父级地理位置
        if (matchCount >= Math.ceil(parentKeywords.length / 2)) {
            const shortName = parentName.length > 4 ? parentName.substring(0, 4) + '…' : parentName;
            const restDesc = childDesc.substring(childLocMatch[0].length).trim();
            return `位于${shortName}内。${restDesc}`;
        }
        return childDesc;
    }

    /** 获取场景记忆 */
    getLocationMemory() {
        const chat = this.getChat();
        return chat?.[0]?.horae_meta?.locationMemory || {};
    }

    /**
     * 智能匹配场景记忆（复合地名支持）
     * 优先级：精确匹配 → 拆分回退父级 → 上下文推断 → 放弃
     */
    _findLocationMemory(currentLocation, locMem, previousLocation = '') {
        if (!currentLocation || !locMem || Object.keys(locMem).length === 0) return null;

        const tag = (name) => ({ ...locMem[name], _matchedName: name });

        if (locMem[currentLocation]) return tag(currentLocation);

        // 曾用名匹配：检查所有条目的 _aliases 数组
        for (const [name, info] of Object.entries(locMem)) {
            if (info._aliases?.includes(currentLocation)) return tag(name);
        }

        const SEP = /[·・\-\/|]/;
        const parts = currentLocation.split(SEP).map(s => s.trim()).filter(Boolean);

        if (parts.length > 1) {
            for (let i = parts.length - 1; i >= 1; i--) {
                const partial = parts.slice(0, i).join('·');
                if (locMem[partial]) return tag(partial);
                for (const [name, info] of Object.entries(locMem)) {
                    if (info._aliases?.includes(partial)) return tag(name);
                }
            }
        }

        if (previousLocation) {
            const prevParts = previousLocation.split(SEP).map(s => s.trim()).filter(Boolean);
            const prevParent = prevParts[0] || previousLocation;
            const curParent = parts[0] || currentLocation;

            if (prevParent !== curParent && prevParent.includes(curParent)) {
                if (locMem[prevParent]) return tag(prevParent);
            }
        }

        return null;
    }

    /**
     * 获取全局表格的当前卡片数据（per-card overlay）
     * 全局表格的结构（表头、名称、提示词、锁定）共享，数据按角色卡分离
     */
    _getResolvedGlobalTables() {
        const templates = this.settings?.globalTables || [];
        const chat = this.getChat();
        if (!chat?.[0] || templates.length === 0) return [];

        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.globalTableData) firstMsg.horae_meta.globalTableData = {};
        const perCardData = firstMsg.horae_meta.globalTableData;

        const result = [];
        for (const template of templates) {
            const name = (template.name || '').trim();
            if (!name) continue;

            if (!perCardData[name]) {
                // 首次在此卡使用：从模板初始化（含迁移旧数据）
                const initData = JSON.parse(JSON.stringify(template.data || {}));
                perCardData[name] = {
                    data: initData,
                    rows: template.rows || 2,
                    cols: template.cols || 2,
                    baseData: JSON.parse(JSON.stringify(initData)),
                    baseRows: template.rows || 2,
                    baseCols: template.cols || 2,
                };
            } else {
                // 同步全局模板的表头到 per-card（用户可能在别处改了表头）
                const templateData = template.data || {};
                for (const key of Object.keys(templateData)) {
                    const [r, c] = key.split('-').map(Number);
                    if (r === 0 || c === 0) {
                        perCardData[name].data[key] = templateData[key];
                    }
                }
            }

            const overlay = perCardData[name];
            result.push({
                name: template.name,
                prompt: template.prompt,
                lockedRows: template.lockedRows || [],
                lockedCols: template.lockedCols || [],
                lockedCells: template.lockedCells || [],
                data: overlay.data,
                rows: overlay.rows,
                cols: overlay.cols,
                baseData: overlay.baseData,
                baseRows: overlay.baseRows,
                baseCols: overlay.baseCols,
            });
        }
        return result;
    }

    /**
     * 获取角色表格的当前对话数据（per-chat overlay）
     * 角色表格的结构（表头、名称、提示词、锁定）绑定角色卡，数据按对话分离
     */
    _getResolvedCharacterTables() {
        const charId = this.context?.characterId;
        if (charId == null) return [];
        const charData = this.context?.characters?.[charId]?.data;
        if (!charData?.extensions?.horae?.charTables) return [];

        const templates = charData.extensions.horae.charTables;
        const chat = this.getChat();
        if (!chat?.[0] || templates.length === 0) return [];

        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.charTableData) firstMsg.horae_meta.charTableData = {};
        const perChatData = firstMsg.horae_meta.charTableData;

        const result = [];
        for (const template of templates) {
            const name = (template.name || '').trim();
            if (!name) continue;

            if (!perChatData[name]) {
                const initData = JSON.parse(JSON.stringify(template.data || {}));
                perChatData[name] = {
                    data: initData,
                    rows: template.rows || 2,
                    cols: template.cols || 2,
                    baseData: JSON.parse(JSON.stringify(initData)),
                    baseRows: template.rows || 2,
                    baseCols: template.cols || 2,
                };
            } else {
                const templateData = template.data || {};
                for (const key of Object.keys(templateData)) {
                    const [r, c] = key.split('-').map(Number);
                    if (r === 0 || c === 0) {
                        perChatData[name].data[key] = templateData[key];
                    }
                }
            }

            const overlay = perChatData[name];
            result.push({
                name: template.name,
                prompt: template.prompt,
                lockedRows: template.lockedRows || [],
                lockedCols: template.lockedCols || [],
                lockedCells: template.lockedCells || [],
                data: overlay.data,
                rows: overlay.rows,
                cols: overlay.cols,
                baseData: overlay.baseData,
                baseRows: overlay.baseRows,
                baseCols: overlay.baseCols,
            });
        }
        return result;
    }

    /** 处理AI回复，解析标签并存储元数据 */
    processAIResponse(messageIndex, messageContent) {
        // 根据用户配置的剔除标签，整块移除小剧场等自定义区块，防止其内部的 horae 标签污染正文解析
        const cleanedContent = this._stripCustomTags(messageContent, this.settings?.vectorStripTags);
        let parsed = this.parseHoraeTag(cleanedContent);

        // 标签解析失败时，自动 fallback 到宽松格式解析
        if (!parsed) {
            parsed = this.parseLooseFormat(cleanedContent);
            if (parsed) {
                console.log(`[Horae] #${messageIndex} 未检测到标签，已通过宽松解析提取数据`);
            }
        }

        if (parsed) {
            const existingMeta = this.getMessageMeta(messageIndex);
            const newMeta = this.mergeParsedToMeta(existingMeta, parsed);

            // 处理表格更新
            if (newMeta._tableUpdates) {
                // 记录表格贡献，用于回退
                newMeta.tableContributions = newMeta._tableUpdates;
                this.applyTableUpdates(newMeta._tableUpdates);
                delete newMeta._tableUpdates;
            }

            // 处理AI标记已完成的待办
            if (parsed.deletedAgenda && parsed.deletedAgenda.length > 0) {
                this.removeCompletedAgenda(parsed.deletedAgenda);
            }

            // 场景记忆：将 scene_desc 存入 locationMemory（支持同一回复多场景配对）
            const descPairs = parsed.scene?._descPairs;
            if (descPairs?.length > 0) {
                for (const p of descPairs) {
                    this._updateLocationMemory(p.location, p.desc);
                }
            } else if (parsed.scene?.scene_desc && parsed.scene?.location) {
                this._updateLocationMemory(parsed.scene.location, parsed.scene.scene_desc);
            }

            // 关系网络：合并到 chat[0].horae_meta.relationships
            if (parsed.relationships && parsed.relationships.length > 0) {
                this._mergeRelationships(parsed.relationships);
            }

            this.setMessageMeta(messageIndex, newMeta);

            // RPG 数据：合并到 chat[0].horae_meta.rpg
            if (newMeta._rpgChanges) {
                this._mergeRpgData(newMeta._rpgChanges);
            }
            return true;
        } else {
            // 无标签，创建空元数据
            if (!this.getMessageMeta(messageIndex)) {
                this.setMessageMeta(messageIndex, createEmptyMeta());
            }
            return false;
        }
    }

    /**
     * 解析NPC字段
     * 格式: 名|外貌=性格@关系~性别:男~年龄:25~种族:人类~职业:佣兵~补充:xxx
     */
    _parseNpcFields(npcStr) {
        const info = {};
        if (!npcStr) return { _name: '' };

        // 1. 分离扩展字段
        const tildeParts = npcStr.split('~');
        const mainPart = tildeParts[0].trim(); // 名|外貌=性格@关系

        for (let i = 1; i < tildeParts.length; i++) {
            const kv = tildeParts[i].trim();
            if (!kv) continue;
            const colonIdx = kv.indexOf(':');
            if (colonIdx <= 0) continue;
            const key = kv.substring(0, colonIdx).trim();
            const value = kv.substring(colonIdx + 1).trim();
            if (!value) continue;

            // 关键词匹配
            if (/^(性别|gender|sex)$/i.test(key)) info.gender = value;
            else if (/^(年龄|age|年纪)$/i.test(key)) info.age = value;
            else if (/^(种族|race|族裔|族群)$/i.test(key)) info.race = value;
            else if (/^(职业|job|class|职务|身份)$/i.test(key)) info.job = value;
            else if (/^(生日|birthday|birth)$/i.test(key)) info.birthday = value;
            else if (/^(补充|note|备注|其他)$/i.test(key)) info.note = value;
        }

        // 2. 解析主体
        let name = '';
        const pipeIdx = mainPart.indexOf('|');
        if (pipeIdx > 0) {
            name = mainPart.substring(0, pipeIdx).trim();
            const descPart = mainPart.substring(pipeIdx + 1).trim();

            const hasNewFormat = descPart.includes('=') || descPart.includes('@');

            if (hasNewFormat) {
                const atIdx = descPart.indexOf('@');
                let beforeAt = atIdx >= 0 ? descPart.substring(0, atIdx) : descPart;
                const relationship = atIdx >= 0 ? descPart.substring(atIdx + 1).trim() : '';

                const eqIdx = beforeAt.indexOf('=');
                const appearance = eqIdx >= 0 ? beforeAt.substring(0, eqIdx).trim() : beforeAt.trim();
                const personality = eqIdx >= 0 ? beforeAt.substring(eqIdx + 1).trim() : '';

                if (appearance) info.appearance = appearance;
                if (personality) info.personality = personality;
                if (relationship) info.relationship = relationship;
            } else {
                const parts = descPart.split('|').map(s => s.trim());
                if (parts[0]) info.appearance = parts[0];
                if (parts[1]) info.personality = parts[1];
                if (parts[2]) info.relationship = parts[2];
            }
        } else {
            name = mainPart.trim();
        }

        info._name = name;
        return info;
    }

    /**
     * 解析表格单元格数据
     * 格式: 每行一格 1,1:内容 或 单行多格用 | 分隔
     */
    _parseTableCellEntries(text) {
        const updates = {};
        if (!text) return updates;

        const cellRegex = /^(\d+)[,\-](\d+)[:：]\s*(.*)$/;

        for (const line of text.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // 按 | 分割
            const segments = trimmed.split(/\s*[|｜]\s*/);

            for (const seg of segments) {
                const s = seg.trim();
                if (!s) continue;

                const m = s.match(cellRegex);
                if (m) {
                    const r = parseInt(m[1]);
                    const c = parseInt(m[2]);
                    const value = m[3].trim();
                    // 过滤空标记
                    if (value && !/^[\(\（]?空[\)\）]?$/.test(value) && !/^[-—]+$/.test(value)) {
                        updates[`${r}-${c}`] = value;
                    }
                }
            }
        }

        return updates;
    }

    /** 将表格更新写入 chat[0]（本地表格）、角色表格 overlay 或全局表格 overlay */
    applyTableUpdates(tableUpdates) {
        if (!tableUpdates || tableUpdates.length === 0) return;

        const chat = this.getChat();
        if (!chat || chat.length === 0) return;

        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.customTables) firstMsg.horae_meta.customTables = [];

        const localTables = firstMsg.horae_meta.customTables;
        const resolvedCharacter = this._getResolvedCharacterTables();
        const resolvedGlobal = this._getResolvedGlobalTables();

        for (const update of tableUpdates) {
            const updateName = (update.name || '').trim();
            let table = localTables.find(t => (t.name || '').trim() === updateName);
            let isGlobal = false;
            let isCharacter = false;
            if (!table) {
                table = resolvedCharacter.find(t => (t.name || '').trim() === updateName);
                isCharacter = !!table;
            }
            if (!table) {
                table = resolvedGlobal.find(t => (t.name || '').trim() === updateName);
                isGlobal = true;
            }
            if (!table) {
                console.warn(`[Horae] 表格 "${updateName}" 不存在，跳过`);
                continue;
            }

            if (!table.data) table.data = {};
            const lockedRows = new Set(table.lockedRows || []);
            const lockedCols = new Set(table.lockedCols || []);
            const lockedCells = new Set(table.lockedCells || []);

            // 用户编辑快照：先清除所有数据单元格再整体写入
            if (update._isUserEdit) {
                for (const key of Object.keys(table.data)) {
                    const [r, c] = key.split('-').map(Number);
                    if (r >= 1 && c >= 1) delete table.data[key];
                }
            }

            let updatedCount = 0;
            let blockedCount = 0;

            for (const [key, value] of Object.entries(update.updates)) {
                const [r, c] = key.split('-').map(Number);

                // 用户编辑不受 header 保护和锁定限制
                if (!update._isUserEdit) {
                    if (r === 0 || c === 0) {
                        const existing = table.data[key];
                        if (existing && existing.trim()) continue;
                    }

                    if (lockedRows.has(r) || lockedCols.has(c) || lockedCells.has(key)) {
                        blockedCount++;
                        continue;
                    }
                }

                table.data[key] = value;
                updatedCount++;

                if (r + 1 > (table.rows || 2)) table.rows = r + 1;
                if (c + 1 > (table.cols || 2)) table.cols = c + 1;
            }

            // 全局/角色表格：将维度变更同步回 overlay
            if (isGlobal) {
                const perCardData = firstMsg.horae_meta?.globalTableData;
                if (perCardData?.[updateName]) {
                    perCardData[updateName].rows = table.rows;
                    perCardData[updateName].cols = table.cols;
                }
            }
            if (isCharacter) {
                const perChatData = firstMsg.horae_meta?.charTableData;
                if (perChatData?.[updateName]) {
                    perChatData[updateName].rows = table.rows;
                    perChatData[updateName].cols = table.cols;
                }
            }

            if (blockedCount > 0) {
                console.log(`[Horae] 表格 "${updateName}" 拦截 ${blockedCount} 个锁定单元格的修改`);
            }
            console.log(`[Horae] 表格 "${updateName}" 已更新 ${updatedCount} 个单元格`);
        }
    }

    /** 重建表格数据（消息删除/编辑后保持一致性） */
    rebuildTableData(maxIndex = -1) {
        const chat = this.getChat();
        if (!chat || chat.length === 0) return;

        const firstMsg = chat[0];
        const limit = maxIndex >= 0 ? Math.min(maxIndex + 1, chat.length) : chat.length;

        // 辅助：重置单个表格到 baseData
        const resetTable = (table) => {
            if (table.baseData) {
                table.data = JSON.parse(JSON.stringify(table.baseData));
            } else {
                if (!table.data) { table.data = {}; return; }
                const keysToDelete = [];
                for (const key of Object.keys(table.data)) {
                    const [r, c] = key.split('-').map(Number);
                    if (r >= 1 && c >= 1) keysToDelete.push(key);
                }
                for (const key of keysToDelete) delete table.data[key];
            }
            if (table.baseRows !== undefined) {
                table.rows = table.baseRows;
            } else if (table.baseData) {
                let calcRows = 2, calcCols = 2;
                for (const key of Object.keys(table.baseData)) {
                    const [r, c] = key.split('-').map(Number);
                    if (r === 0 && c + 1 > calcCols) calcCols = c + 1;
                    if (c === 0 && r + 1 > calcRows) calcRows = r + 1;
                }
                table.rows = calcRows;
                table.cols = calcCols;
            }
            if (table.baseCols !== undefined) {
                table.cols = table.baseCols;
            }
        };

        // 1a. 重置本地表格
        const localTables = firstMsg.horae_meta?.customTables || [];
        for (const table of localTables) {
            resetTable(table);
        }

        // 1b. 重置全局表格的 per-card overlay
        const perCardData = firstMsg.horae_meta?.globalTableData || {};
        for (const overlay of Object.values(perCardData)) {
            resetTable(overlay);
        }

        // 1c. 重置角色表格的 per-chat overlay
        const charTableOverlays = firstMsg.horae_meta?.charTableData || {};
        for (const overlay of Object.values(charTableOverlays)) {
            resetTable(overlay);
        }

        // 2. 预扫描：找到每个表格最后一个 _isUserEdit 所在的消息索引
        const lastUserEditIdx = new Map();
        for (let i = 0; i < limit; i++) {
            const meta = chat[i]?.horae_meta;
            if (meta?.tableContributions) {
                for (const tc of meta.tableContributions) {
                    if (tc._isUserEdit) {
                        lastUserEditIdx.set((tc.name || '').trim(), i);
                    }
                }
            }
        }

        // 3. 按消息顺序回放 tableContributions（截断到 limit）
        // 防御：如果某表格存在用户编辑快照，跳过该快照之前的所有 AI 贡献
        let totalApplied = 0;
        for (let i = 0; i < limit; i++) {
            const meta = chat[i]?.horae_meta;
            if (meta?.tableContributions && meta.tableContributions.length > 0) {
                const filtered = meta.tableContributions.filter(tc => {
                    if (tc._isUserEdit) return true;
                    const name = (tc.name || '').trim();
                    const ueIdx = lastUserEditIdx.get(name);
                    if (ueIdx !== undefined && i <= ueIdx) return false;
                    return true;
                });
                if (filtered.length > 0) {
                    this.applyTableUpdates(filtered);
                    totalApplied++;
                }
            }
        }

        console.log(`[Horae] 表格数据已重建，回放了 ${totalApplied} 条消息的表格贡献（截止到#${limit - 1}）`);
    }

    /** 扫描并注入历史记录 */
    async scanAndInjectHistory(progressCallback, analyzeCallback = null) {
        const chat = this.getChat();
        let processed = 0;
        let skipped = 0;

        const PRESERVE_KEYS = [
            'autoSummaries', 'customTables', 'globalTableData', 'charTableData',
            'locationMemory', 'relationships', 'tableContributions',
            'rpg', '_rpgChanges',
            '_deletedNpcs', '_deletedAgendaTexts',
            '_rpgConfigs', '_pendingScanReview', '_userAddedNpcs'
        ];

        for (let i = 0; i < chat.length; i++) {
            const message = chat[i];

            if (message.is_user) {
                skipped++;
                if (progressCallback) {
                    progressCallback(Math.round((i + 1) / chat.length * 100), i + 1, chat.length);
                }
                continue;
            }

            const existing = message.horae_meta;
            const preserved = {};
            const oldEvents = [];
            const wasSkipped = !!existing?._skipHorae;

            if (existing) {
                for (const key of PRESERVE_KEYS) {
                    if (existing[key] !== undefined) preserved[key] = existing[key];
                }
                if (existing.events?.length > 0) {
                    for (const evt of existing.events) {
                        if (evt._compressedBy || evt._summaryId || evt.isSummary) {
                            oldEvents.push(evt);
                        }
                    }
                }
            }

            const _applyPreserved = (meta) => {
                Object.assign(meta, preserved);
                if (wasSkipped) meta._skipHorae = true;
                if (oldEvents.length > 0) {
                    if (!meta.events) meta.events = [];
                    const nonSummaryFlags = oldEvents.filter(e => !e.isSummary);
                    const summaryEvts = oldEvents.filter(e => e.isSummary);
                    for (const flag of nonSummaryFlags) {
                        if (!flag._compressedBy) continue;
                        const match = meta.events.find(e =>
                            !e.isSummary && !e._compressedBy &&
                            e.summary && flag.summary &&
                            e.summary === flag.summary
                        );
                        if (match) match._compressedBy = flag._compressedBy;
                    }
                    for (const sEvt of summaryEvts) {
                        if (!sEvt._summaryId) continue;
                        const exists = meta.events.some(e => e._summaryId === sEvt._summaryId);
                        if (!exists) {
                            meta.events.push({
                                summary: sEvt.summary,
                                level: sEvt.level || '摘要',
                                isSummary: true,
                                _summaryId: sEvt._summaryId,
                            });
                        }
                    }
                }
            };

            const parsed = this.parseHoraeTag(message.mes);

            if (parsed) {
                const meta = this.mergeParsedToMeta(null, parsed);
                if (meta._tableUpdates) {
                    meta.tableContributions = meta._tableUpdates;
                    delete meta._tableUpdates;
                }
                _applyPreserved(meta);
                this.setMessageMeta(i, meta);
                if (parsed.deletedAgenda?.length > 0) {
                    this.removeCompletedAgenda(parsed.deletedAgenda);
                }
                processed++;
            } else if (analyzeCallback) {
                try {
                    const analyzed = await analyzeCallback(message.mes);
                    if (analyzed) {
                        const meta = this.mergeParsedToMeta(null, analyzed);
                        if (meta._tableUpdates) {
                            meta.tableContributions = meta._tableUpdates;
                            delete meta._tableUpdates;
                        }
                        _applyPreserved(meta);
                        this.setMessageMeta(i, meta);
                        if (analyzed.deletedAgenda?.length > 0) {
                            this.removeCompletedAgenda(analyzed.deletedAgenda);
                        }
                        processed++;
                    }
                } catch (error) {
                    console.error(`[Horae] 分析消息 #${i} 失败:`, error);
                }
            } else {
                const meta = createEmptyMeta();
                _applyPreserved(meta);
                this.setMessageMeta(i, meta);
                processed++;
            }

            if (progressCallback) {
                progressCallback(Math.round((i + 1) / chat.length * 100), i + 1, chat.length);
            }
        }

        return { processed, skipped };
    }

    generateSystemPromptAddition() {
        const [userName, charName] = this._getDefaultNames();
        const locationPrompt = this.generateLocationMemoryPrompt();
        const tablesPrompt = this.generateCustomTablesPrompt();
        const relationshipPrompt = this.generateRelationshipPrompt();
        const moodPrompt = this.generateMoodPrompt();
        const rpgPrompt = this.generateRpgPrompt();
        const antiParaphrasePrompt = this._generateAntiParaphrasePrompt();
        const subs = locationPrompt + tablesPrompt + relationshipPrompt + moodPrompt + rpgPrompt + antiParaphrasePrompt;
        console.log(
            `[Horae][TableDebug] generateSystemPromptAddition: subsLen=${subs.length}, tableRulesLen=${tablesPrompt.length}, locationLen=${locationPrompt.length}, relationshipLen=${relationshipPrompt.length}, moodLen=${moodPrompt.length}, rpgLen=${rpgPrompt.length}, antiParaLen=${antiParaphrasePrompt.length}, customSystemPrompt=${!!this.settings?.customSystemPrompt}`
        );

        if (this.settings?.customSystemPrompt) {
            const custom = this.settings.customSystemPrompt
                .replace(/\{\{user\}\}/gi, userName)
                .replace(/\{\{char\}\}/gi, charName);
            return custom + subs;
        }

        const base = this.getDefaultSystemPrompt({ systemPromptAddition: subs })
            .replace(/\{\{user\}\}/gi, userName)
            .replace(/\{\{char\}\}/gi, charName);
        return '\n' + base;
    }

    getDefaultSystemPrompt(vars = null) {
        const mergedVars = { systemPromptAddition: '', ...(vars || {}) };
        return this._getPromptDefaultFromResource('customSystemPrompt', mergedVars);
    }

    getDefaultTablesPrompt() {
        return this._getPromptDefaultFromResource('customTablesPrompt');
    }

    getDefaultLocationPrompt() {
        return this._getPromptDefaultFromResource('customLocationPrompt');
    }

    generateLocationMemoryPrompt() {
        if (!this.settings?.sendLocationMemory) return '';
        const custom = this.settings?.customLocationPrompt;
        if (custom) {
            const userName = this.context?.name1 || '主角';
            const charName = this.context?.name2 || '角色';
            return '\n' + custom.replace(/\{\{user\}\}/gi, userName).replace(/\{\{char\}\}/gi, charName);
        }
        return '\n' + this.getDefaultLocationPrompt();
    }

    generateCustomTablesPrompt() {
        const chat = this.getChat();
        const firstMsg = chat?.[0];
        const localTables = firstMsg?.horae_meta?.customTables || [];
        const resolvedCharacter = this._getResolvedCharacterTables();
        const resolvedGlobal = this._getResolvedGlobalTables();
        const allTables = [...resolvedGlobal, ...resolvedCharacter, ...localTables];
        const normalizeValue = (value) => {
            if (value == null) return '';
            return typeof value === 'string' ? value.trim() : String(value).trim();
        };
        const describeTable = (table, scope, index) => {
            const data = table?.data || {};
            let nonEmptyCells = 0;
            for (const value of Object.values(data)) {
                if (normalizeValue(value)) nonEmptyCells++;
            }
            const promptText = normalizeValue(table?.prompt);
            return {
                scope,
                index,
                name: normalizeValue(table?.name),
                rows: table?.rows || 0,
                cols: table?.cols || 0,
                promptLen: promptText.length,
                hasPrompt: !!promptText,
                nonEmptyCells,
            };
        };
        const debugTables = [
            ...resolvedGlobal.map((table, index) => describeTable(table, 'global', index)),
            ...resolvedCharacter.map((table, index) => describeTable(table, 'character', index)),
            ...localTables.map((table, index) => describeTable(table, 'local', index)),
        ];
        console.log(
            `[Horae][TableDebug] generateCustomTablesPrompt input: global=${resolvedGlobal.length}, character=${resolvedCharacter.length}, local=${localTables.length}, total=${allTables.length}`
        );
        if (debugTables.length > 0) {
            console.log(`[Horae][TableDebug] generateCustomTablesPrompt tables: ${JSON.stringify(debugTables)}`);
        }
        if (allTables.length === 0) {
            console.log('[Horae][TableDebug] generateCustomTablesPrompt skipped: no tables found');
            return '';
        }

        let prompt = '\n' + (this.settings?.customTablesPrompt || this.getDefaultTablesPrompt());
        const lang = this._getAiOutputLang();
        const L = (zh, en, ja, ko, ru) => {
            if (lang === 'zh-CN' || lang === 'zh-TW') return zh;
            if (lang === 'ja') return ja;
            if (lang === 'ko') return ko;
            if (lang === 'ru') return ru;
            return en;
        };

        for (const table of allTables) {
            const tableName = table.name || L('自定义表格', 'Custom Table', 'カスタムテーブル', '사용자 정의 테이블', 'Пользовательская таблица');
            const rows = table.rows || 2;
            const cols = table.cols || 2;
            prompt += L(
                `\n★ 表格「${tableName}」尺寸：${rows - 1}行×${cols - 1}列（数据区行号1-${rows - 1}，列号1-${cols - 1}）`,
                `\n★ Table "${tableName}" size: ${rows - 1} rows × ${cols - 1} cols (data area: rows 1-${rows - 1}, cols 1-${cols - 1})`,
                `\n★ テーブル「${tableName}」サイズ：${rows - 1}行×${cols - 1}列（データ領域：行1-${rows - 1}、列1-${cols - 1}）`,
                `\n★ 테이블「${tableName}」크기: ${rows - 1}행×${cols - 1}열 (데이터 영역: 행 1-${rows - 1}, 열 1-${cols - 1})`,
                `\n★ Таблица «${tableName}» размер: ${rows - 1} строк × ${cols - 1} столбцов (область данных: строки 1-${rows - 1}, столбцы 1-${cols - 1})`
            );
            const sA = L('内容A', 'ContentA', '内容A', '내용A', 'СодержимоеA');
            const sB = L('内容B', 'ContentB', '内容B', '내용B', 'СодержимоеB');
            const sC = L('内容C', 'ContentC', '内容C', '내용C', 'СодержимоеC');
            const exLabel = L(
                '示例（填写空单元格或更新有变化的单元格）',
                'Example (fill empty cells or update changed cells)',
                '例（空のセルを埋めるか、変更のあるセルを更新）',
                '예시 (빈 셀을 채우거나 변경된 셀을 업데이트)',
                'Пример (заполните пустые ячейки или обновите изменённые)'
            );
            prompt += `\n${exLabel}：
<horaetable:${tableName}>
1,1:${sA}
1,2:${sB}
2,1:${sC}
</horaetable>`;
            break;
        }

        const ruleSource = this.settings?.customTablesPrompt ? 'custom' : 'default';
        console.log(
            `[Horae][TableDebug] generateCustomTablesPrompt output: len=${prompt.length}, ruleSource=${ruleSource}, hasHoraetableTemplate=${prompt.includes('<horaetable:')}`
        );
        return prompt;
    }

    getDefaultRelationshipPrompt() {
        const userName = this.context?.name1 || '{{user}}';
        return this._getPromptDefaultFromResource('customRelationshipPrompt', { userName });
    }

    getDefaultMoodPrompt() {
        return this._getPromptDefaultFromResource('customMoodPrompt');
    }

    generateRelationshipPrompt() {
        if (!this.settings?.sendRelationships) return '';
        const custom = this.settings?.customRelationshipPrompt;
        if (custom) {
            const userName = this.context?.name1 || '主角';
            const charName = this.context?.name2 || '角色';
            return '\n' + custom.replace(/\{\{user\}\}/gi, userName).replace(/\{\{char\}\}/gi, charName);
        }
        return '\n' + this.getDefaultRelationshipPrompt();
    }

    _generateAntiParaphrasePrompt() {
        if (!this.settings?.antiParaphraseMode) return '';
        const lang = this._getAiOutputLang();
        const defaults = { 'zh-CN': '主角', 'zh-TW': '主角', 'ja': '主人公', 'ko': '주인공', 'ru': 'протагонист' };
        const userName = this.context?.name1 || (defaults[lang] || 'protagonist');
        const text = this._getPromptDefaultFromResource('customAntiParaphrasePrompt', { userName });
        if (!text || !text.trim()) return '';
        return '\n' + text.trim();
    }

    generateMoodPrompt() {
        if (!this.settings?.sendMood) return '';
        const custom = this.settings?.customMoodPrompt;
        if (custom) {
            const userName = this.context?.name1 || '主角';
            const charName = this.context?.name2 || '角色';
            return '\n' + custom.replace(/\{\{user\}\}/gi, userName).replace(/\{\{char\}\}/gi, charName);
        }
        return '\n' + this.getDefaultMoodPrompt();
    }

    /** RPG 提示词（rpgMode 开启才注入） */
    generateRpgPrompt() {
        if (!this.settings?.rpgMode) return '';
        const customPrompt = this.settings?.customRpgPrompt || '';
        if (customPrompt.trim()) return '\n' + this._resolveRpgPromptTemplate(customPrompt);
        return '\n' + this.getDefaultRpgPromptResolved();
    }

    /** RPG 默认提示词（资源优先，支持分段占位符） */
    getDefaultRpgPromptResolved() {
        const fromResource = this._getPromptDefaultFromResource('customRpgPrompt');
        if (!fromResource || !fromResource.trim()) return this.getDefaultRpgPrompt();
        return this._resolveRpgPromptTemplate(fromResource);
    }

    _resolveRpgPromptTemplate(template) {
        let out = String(template || '');
        if (/\[\[\s*rpg\./i.test(out)) {
            const lang = this._getAiOutputLang();
            const sections = this._extractRpgPromptSections(this.getDefaultRpgPrompt(), lang);
            out = this._renderRpgPromptSectionTemplate(out, sections);
        }
        const [userName, charName] = this._getDefaultNames();
        return out
            .replace(/\{\{user\}\}/gi, userName)
            .replace(/\{\{char\}\}/gi, charName);
    }

    _getRpgSectionHeadingsByLang(lang) {
        if (lang === 'ja') {
            return {
                bars: '【ステータスバー——毎ターン必須、欠落＝不合格！】',
                attrs: '【多次元属性】初登場時または属性変化時のみ記載、変化なしなら省略可',
                skills: '【スキル】習得/レベルアップ/喪失時のみ記載、変化なしなら省略可',
                equipment: '【装備】キャラクターが装備/解除した時に記載、変化なしなら省略可',
                reputation: '【評判】評判が変化した時のみ記載、変化なしなら省略可',
                level: '【レベルと経験値】レベルアップ/ダウンまたは経験値変化時のみ記載、変化なしなら省略可',
                currency: '【通貨——取引/拾得/消費が発生した時は必ず記載！】',
                stronghold: '【拠点/基地】拠点の状態が変化した時に記載（アップグレード/建設/破壊/説明更新）、変化なしなら省略可。既存の拠点名は下記「現在の拠点」と完全一致させる — 省略・言い換え・接頭辞変形は禁止',
            };
        }
        if (lang === 'ko') {
            return {
                bars: '【스테이터스 바 — 매 턴 필수, 누락 = 불합격!】',
                attrs: '【다차원 속성】첫 등장 또는 속성 변화 시에만 기재, 변화 없으면 생략 가능',
                skills: '【스킬】습득/승급/상실 시에만 기재, 변화 없으면 생략 가능',
                equipment: '【장비】캐릭터가 장비 착용/해제 시 기재, 변화 없으면 생략 가능',
                reputation: '【평판】평판 변화 시에만 기재, 변화 없으면 생략 가능',
                level: '【레벨과 경험치】레벨 업/다운 또는 경험치 변화 시에만 기재, 변화 없으면 생략 가능',
                currency: '【화폐 — 거래/획득/소비 발생 시 필수 기재!】',
                stronghold: '【거점/기지】거점 상태 변화 시 기재(업그레이드/건설/파괴/설명 변경), 변화 없으면 생략 가능. 기존 거점은 아래 \'현재 거점\'에 표시된 이름과 정확히 일치해야 함 — 줄임/변형/접두사 변형 금지',
            };
        }
        if (lang === 'ru') {
            return {
                bars: '[Шкалы статуса — обязательны каждый ход, пропуск = провал!]',
                attrs: '[Многомерные атрибуты] Записывайте только при первом появлении или изменении; пропускайте, если без изменений',
                skills: '[Навыки] Записывайте только при изучении/повышении/потере; пропускайте, если без изменений',
                equipment: '[Снаряжение] Записывайте при экипировке/снятии; пропускайте, если без изменений',
                reputation: '[Репутация] Записывайте только при изменении репутации; пропускайте, если без изменений',
                level: '[Уровень и опыт] Записывайте только при повышении/понижении уровня или изменении опыта; пропускайте, если без изменений',
                currency: '[Валюта — ОБЯЗАТЕЛЬНО записывать при любой сделке/подборе/трате!]',
                stronghold: '[Крепости] Записывайте при изменении статуса крепости (улучшение/строительство/разрушение/обновление описания); пропускайте, если без изменений. Существующие крепости ДОЛЖНЫ использовать точно такие же названия, как в списке ниже — сокращения, переименования и варианты с префиксами запрещены',
            };
        }
        if (lang !== 'zh-CN' && lang !== 'zh-TW') {
            return {
                bars: '[Status Bars — required every turn, missing = fail!]',
                attrs: '[Multi-Dimensional Attributes] Write only on first appearance or attribute change; skip if unchanged',
                skills: '[Skills] Write only when learned/upgraded/lost; skip if unchanged',
                equipment: '[Equipment] Write when character equips/unequips; skip if unchanged',
                reputation: '[Reputation] Write only when reputation changes; skip if unchanged',
                level: '[Level & XP] Write only on level-up/down or XP change; skip if unchanged',
                currency: '[Currency — MUST write on any trade/pickup/spending!]',
                stronghold: '[Strongholds] Write when stronghold status changes (upgrade/build/destroy/description update); skip if unchanged. Existing strongholds MUST always use the exact same name as listed in "Current strongholds" below — no abbreviations, rewrites, or prefixed variants of existing names',
            };
        }
        return {
            bars: '【属性条——每回合必写，缺少=不合格！】',
            attrs: '【多维属性】仅首次登场或属性变化时写，无变化可省略',
            skills: '【技能】仅习得/升级/失去时写，无变化可省略',
            equipment: '【装备】角色穿戴/卸下装备时写，无变化可省略',
            reputation: '【声望】仅声望变化时写，无变化可省略',
            level: '【等级与经验值】仅升级/降级或经验变化时写，无变化可省略',
            currency: '【货币——发生交易/拾取/消费时必写！】',
            stronghold: '【据点/基地】据点状态变化时写（升级/建造/损毁/描述变更），无变化可省略。已有据点必须始终使用与下方「当前据点」完全一致的名称，禁止对已有名称做缩写/改写/加前缀变体',
        };
    }

    _extractRpgPromptSections(promptText, lang) {
        const empty = {
            full: '',
            header: '',
            bars: '',
            attrs: '',
            skills: '',
            equipment: '',
            reputation: '',
            level: '',
            currency: '',
            stronghold: '',
        };
        if (!promptText || typeof promptText !== 'string') return empty;

        const headings = this._getRpgSectionHeadingsByLang(lang);
        const keys = ['bars', 'attrs', 'skills', 'equipment', 'reputation', 'level', 'currency', 'stronghold'];
        const marks = [];
        for (const key of keys) {
            const h = headings[key];
            if (!h) continue;
            const idx = promptText.indexOf(h);
            if (idx >= 0) marks.push({ key, idx });
        }
        marks.sort((a, b) => a.idx - b.idx);

        const out = { ...empty, full: promptText.trimEnd() };
        out.header = marks.length > 0 ? promptText.slice(0, marks[0].idx).trimEnd() : promptText.trimEnd();

        for (let i = 0; i < marks.length; i++) {
            const start = marks[i].idx;
            const end = i + 1 < marks.length ? marks[i + 1].idx : promptText.length;
            out[marks[i].key] = promptText.slice(start, end).trimEnd();
        }
        return out;
    }

    _renderRpgPromptSectionTemplate(template, sections) {
        if (!template || typeof template !== 'string') return template || '';
        const map = {
            full: sections.full || '',
            header: sections.header || '',
            bars: sections.bars || '',
            attrs: sections.attrs || '',
            skills: sections.skills || '',
            equipment: sections.equipment || '',
            reputation: sections.reputation || '',
            level: sections.level || '',
            currency: sections.currency || '',
            stronghold: sections.stronghold || '',
        };
        return template.replace(/\[\[\s*rpg\.(full|header|bars|attrs|skills|equipment|reputation|level|currency|stronghold)\s*\]\]/gi, (_, key) => {
            const k = String(key || '').toLowerCase();
            return map[k] ?? '';
        });
    }

    /** RPG 默认提示词 */
    getDefaultRpgPrompt() {
        const sendBars = this.settings?.sendRpgBars !== false;
        const sendSkills = this.settings?.sendRpgSkills !== false;
        const sendAttrs = this.settings?.sendRpgAttributes !== false;
        const sendEq = !!this.settings?.sendRpgEquipment;
        const sendRep = !!this.settings?.sendRpgReputation;
        const sendLvl = !!this.settings?.sendRpgLevel;
        const sendCur = !!this.settings?.sendRpgCurrency;
        const sendSh = !!this.settings?.sendRpgStronghold;
        if (!sendBars && !sendSkills && !sendAttrs && !sendEq && !sendRep && !sendLvl && !sendCur && !sendSh) return '';
        const lang = this._getAiOutputLang();
        const L = (zh, en, ja, ko, ru) => {
            if (lang === 'zh-CN' || lang === 'zh-TW') return zh;
            if (lang === 'ja') return ja;
            if (lang === 'ko') return ko;
            if (lang === 'ru') return ru;
            return en;
        };
        const userName = this.context?.name1 || L('主角', 'protagonist', '主人公', '주인공', 'протагонист');
        const uoBars = !!this.settings?.rpgBarsUserOnly;
        const uoSkills = !!this.settings?.rpgSkillsUserOnly;
        const uoAttrs = !!this.settings?.rpgAttrsUserOnly;
        const uoEq = !!this.settings?.rpgEquipmentUserOnly;
        const uoRep = !!this.settings?.rpgReputationUserOnly;
        const uoLvl = !!this.settings?.rpgLevelUserOnly;
        const uoCur = !!this.settings?.rpgCurrencyUserOnly;
        const anyUo = uoBars || uoSkills || uoAttrs || uoEq || uoRep || uoLvl || uoCur;
        const allUo = uoBars && uoSkills && uoAttrs && uoEq && uoRep && uoLvl && uoCur;
        const barCfg = this.settings?.rpgBarConfig || [
            { key: 'hp', name: 'HP' }, { key: 'mp', name: 'MP' }, { key: 'sp', name: 'SP' }
        ];
        const attrCfg = this.settings?.rpgAttributeConfig || [];
        const own = L('归属', 'owner', '所有者', '소유자', 'владелец');
        const commaSep = L('、', ', ', '、', ', ', ', ');
        const semiSep = L('；', '; ', '；', '; ', '; ');
        const attrMeaning = (a) => a.desc ? `${a.key}(${a.name}: ${a.desc})` : `${a.key}(${a.name})`;
        const barDefinition = (bar) => {
            const meta = [];
            if (bar.min !== undefined || bar.max !== undefined) meta.push(`${bar.min ?? 0}~${bar.max ?? 100}`);
            if (bar.defaultMax !== undefined) meta.push(`${L('默认上限', 'default max', '既定最大値', '기본 최대치', 'макс. по умолчанию')}${bar.defaultMax}`);
            if (bar.required === false) meta.push(L('可省略', 'optional', '省略可', '생략 가능', 'необязательно'));
            if (bar.desc) meta.push(bar.desc);
            return `${bar.key}(${bar.name}${meta.length ? `: ${meta.join(semiSep)}` : ''})`;
        };
        const equipSlotText = (slot) => slot.desc
            ? `${slot.name}(×${slot.maxCount ?? 1}: ${slot.desc})`
            : `${slot.name}(×${slot.maxCount ?? 1})`;
        const repDefinition = (cat) => {
            const meta = [];
            meta.push(`${cat.min ?? -100}~${cat.max ?? 100}`);
            if (cat.default !== undefined) meta.push(`${L('默认', 'default', '既定値', '기본값', 'по умолчанию')}${cat.default}`);
            if (cat.subItems?.length) meta.push(`${L('细项', 'sub-items', 'サブ項目', '하위 항목', 'подэлементы')}:${cat.subItems.join(commaSep)}`);
            return `  - ${cat.name}（${meta.join(semiSep)}）`;
        };
        const currencyRateText = (denoms) => {
            if (!Array.isArray(denoms) || denoms.length < 2) return '';
            const sorted = [...denoms].sort((a, b) => (parseInt(a.rate, 10) || 1) - (parseInt(b.rate, 10) || 1));
            const base = parseInt(sorted[0]?.rate, 10) || 1;
            return sorted.map(d => `${(parseInt(d.rate, 10) || 1) / base}${d.name}`).join(' = ');
        };
        let p = L(
            `═══ 【RPG】 ═══\n你的回复末尾必须包含<horaerpg>标签。`,
            `═══ [RPG] ═══\nYour reply MUST include a <horaerpg> tag at the end.`,
            `═══ 【RPG】 ═══\nあなたの返信の末尾に必ず<horaerpg>タグを含めてください。`,
            `═══ 【RPG】 ═══\n답변 끝에 반드시 <horaerpg> 태그를 포함해야 합니다.`,
            `═══ [RPG] ═══\nВаш ответ ДОЛЖЕН включать тег <horaerpg> в конце.`
        );
        if (allUo) {
            p += L(
                `所有RPG数据仅追踪${userName}一人，格式中不含归属字段。禁止为NPC输出任何RPG行。\n`,
                `All RPG data tracks ${userName} only. Format has no owner field. Do NOT output RPG lines for NPCs.\n`,
                `すべてのRPGデータは${userName}のみを追跡します。フォーマットに所有者フィールドはありません。NPCのRPG行を出力しないでください。\n`,
                `모든 RPG 데이터는 ${userName}만 추적합니다. 형식에 소유자 필드가 없습니다. NPC의 RPG 행을 출력하지 마세요.\n`,
                `Все RPG-данные отслеживают только ${userName}. Формат не содержит поля владельца. НЕ выводите RPG-строки для NPC.\n`
            );
        } else if (anyUo) {
            p += L(
                `归属格式同NPC编号：N编号 全名，${userName}直接写名字不加N。部分模块仅追踪${userName}（以下会标注）。\n`,
                `Owner format follows NPC numbering: N## full name. ${userName} uses name directly without N. Some modules track ${userName} only (marked below).\n`,
                `所有者形式はNPC番号に従います：N番号 フルネーム。${userName}はNなしで直接名前を書きます。一部のモジュールは${userName}のみを追跡します（以下に記載）。\n`,
                `소유자 형식은 NPC 번호를 따릅니다: N번호 전체 이름. ${userName}은(는) N 없이 직접 이름을 씁니다. 일부 모듈은 ${userName}만 추적합니다(아래 표시).\n`,
                `Формат владельца следует нумерации NPC: N## полное имя. ${userName} пишется напрямую без N. Некоторые модули отслеживают только ${userName} (отмечено ниже).\n`
            );
        } else {
            p += L(
                `归属格式同NPC编号：N编号 全名，${userName}直接写名字不加N。\n`,
                `Owner format follows NPC numbering: N## full name. ${userName} uses name directly without N.\n`,
                `所有者形式はNPC番号に従います：N番号 フルネーム。${userName}はNなしで直接名前を書きます。\n`,
                `소유자 형식은 NPC 번호를 따릅니다: N번호 전체 이름. ${userName}은(는) N 없이 직접 이름을 씁니다.\n`,
                `Формат владельца следует нумерации NPC: N## полное имя. ${userName} пишется напрямую без N.\n`
            );
        }
        if (sendBars) {
            p += L(
                `\n【属性条——每回合必写，缺少=不合格！】\n`,
                `\n[Status Bars — required every turn, missing = fail!]\n`,
                `\n【ステータスバー——毎ターン必須、欠落＝不合格！】\n`,
                `\n【스테이터스 바 — 매 턴 필수, 누락 = 불합격!】\n`,
                `\n[Шкалы статуса — обязательны каждый ход, пропуск = провал!]\n`
            );
            if (uoBars) {
                p += L(
                    `仅输出${userName}的属性条和状态：\n`,
                    `Only output ${userName}'s status bars and status:\n`,
                    `${userName}のステータスバーとステータスのみを出力：\n`,
                    `${userName}의 스테이터스 바와 상태만 출력:\n`,
                    `Выводите только шкалы статуса и состояние ${userName}:\n`
                );
                for (const bar of barCfg) {
                    p += L(
                        `  ✅ ${bar.key}:当前/最大(${bar.name})  ← 首次必须标注显示名\n`,
                        `  ✅ ${bar.key}:current/max(${bar.name})  ← must label display name on first use\n`,
                        `  ✅ ${bar.key}:現在値/最大値(${bar.name})  ← 初回は表示名を必ず記載\n`,
                        `  ✅ ${bar.key}:현재/최대(${bar.name})  ← 첫 사용 시 표시 이름 필수\n`,
                        `  ✅ ${bar.key}:текущее/макс(${bar.name})  ← при первом использовании укажите отображаемое имя\n`
                    );
                }
                p += L(
                    `  ✅ status:效果1/效果2  ← 无异常写 正常\n`,
                    `  ✅ status:effect1/effect2  ← if no ailments write normal\n`,
                    `  ✅ status:効果1/効果2  ← 異常なしなら 正常 と記載\n`,
                    `  ✅ status:효과1/효과2  ← 이상 없으면 정상 기재\n`,
                    `  ✅ status:эффект1/эффект2  ← если нет отклонений, пишите нормально\n`
                );
            } else {
                p += L(
                    `必须为 characters: 中每个在场角色输出全部属性条和状态：\n`,
                    `MUST output ALL status bars and status for EVERY present character in characters: list:\n`,
                    `characters: リスト内のすべての登場キャラクターについて、全ステータスバーとステータスを出力する必要があります：\n`,
                    `characters: 목록의 모든 등장 캐릭터에 대해 전체 스테이터스 바와 상태를 출력해야 합니다:\n`,
                    `НЕОБХОДИМО вывести ВСЕ шкалы статуса и состояние для КАЖДОГО присутствующего персонажа в списке characters:\n`
                );
                for (const bar of barCfg) {
                    p += L(
                        `  ✅ ${bar.key}:归属=当前/最大(${bar.name})  ← 首次必须标注显示名\n`,
                        `  ✅ ${bar.key}:${own}=current/max(${bar.name})  ← must label display name on first use\n`,
                        `  ✅ ${bar.key}:${own}=現在値/最大値(${bar.name})  ← 初回は表示名を必ず記載\n`,
                        `  ✅ ${bar.key}:${own}=현재/최대(${bar.name})  ← 첫 사용 시 표시 이름 필수\n`,
                        `  ✅ ${bar.key}:${own}=текущее/макс(${bar.name})  ← при первом использовании укажите отображаемое имя\n`
                    );
                }
                p += L(
                    `  ✅ status:归属=效果1/效果2  ← 无异常写 =正常\n`,
                    `  ✅ status:${own}=effect1/effect2  ← if no ailments write =normal\n`,
                    `  ✅ status:${own}=効果1/効果2  ← 異常なしなら =正常 と記載\n`,
                    `  ✅ status:${own}=효과1/효과2  ← 이상 없으면 =정상 기재\n`,
                    `  ✅ status:${own}=эффект1/эффект2  ← если нет отклонений, пишите =нормально\n`
                );
            }
            p += L(`规则：\n`, `Rules:\n`, `ルール：\n`, `규칙:\n`, `Правила:\n`);
            if (barCfg.length > 0) {
                const defs = barCfg.map(barDefinition).join(commaSep);
                p += L(
                    `  已注册属性条: ${defs}\n`,
                    `  Registered status bars: ${defs}\n`,
                    `  登録済みステータスバー: ${defs}\n`,
                    `  등록된 스테이터스 바: ${defs}\n`,
                    `  Зарегистрированные шкалы статуса: ${defs}\n`
                );
            }
            p += L(
                `  - 战斗/受伤/施法/消耗 → 合理扣减；恢复/休息 → 合理回增\n`,
                `  - Combat/injury/casting/consumption → reasonable deduction; recovery/rest → reasonable increase\n`,
                `  - 戦闘/負傷/詠唱/消費 → 合理的に減少；回復/休息 → 合理的に増加\n`,
                `  - 전투/부상/시전/소모 → 합리적 감소; 회복/휴식 → 합리적 증가\n`,
                `  - Бой/ранение/заклинание/расход → обоснованное уменьшение; восстановление/отдых → обоснованное увеличение\n`
            );
            if (!uoBars) {
                p += L(
                    `  - 每个在场角色的每个属性条都必须写，漏写任何一人=不合格\n`,
                    `  - Every present character's every status bar MUST be written; missing anyone = fail\n`,
                    `  - 登場中の各キャラクターのすべてのステータスバーを書く必要があります；誰か一人でも漏れ＝不合格\n`,
                    `  - 등장 중인 모든 캐릭터의 모든 스테이터스 바를 작성해야 합니다; 누구 하나라도 누락 = 불합격\n`,
                    `  - Каждая шкала каждого присутствующего персонажа ДОЛЖНА быть записана; пропуск кого-либо = провал\n`
                );
            }
            p += L(
                `  - 即使本回合数值无变化，也必须写出当前值\n`,
                `  - Even if values didn't change this turn, MUST still write current values\n`,
                `  - 今回のターンで数値に変化がなくても、現在の値を必ず記載すること\n`,
                `  - 이번 턴에 수치 변화가 없더라도 현재 값을 반드시 기재할 것\n`,
                `  - Даже если значения не изменились в этом ходу, НЕОБХОДИМО записать текущие значения\n`
            );
        }
        if (sendAttrs && attrCfg.length > 0) {
            p += L(
                `\n【多维属性】仅首次登场或属性变化时写，无变化可省略\n`,
                `\n[Multi-Dimensional Attributes] Write only on first appearance or attribute change; skip if unchanged\n`,
                `\n【多次元属性】初登場時または属性変化時のみ記載、変化なしなら省略可\n`,
                `\n【다차원 속성】첫 등장 또는 속성 변화 시에만 기재, 변화 없으면 생략 가능\n`,
                `\n[Многомерные атрибуты] Записывайте только при первом появлении или изменении; пропускайте, если без изменений\n`
            );
            if (uoAttrs) {
                p += `  attr:${attrCfg.map(a => `${a.key}=value`).join('|')}\n`;
            } else {
                p += `  attr:${own}|${attrCfg.map(a => `${a.key}=value`).join('|')}\n`;
            }
            p += L(
                `  数值范围0-100。属性含义：${attrCfg.map(attrMeaning).join('、')}\n`,
                `  Value range 0-100. Attribute meanings: ${attrCfg.map(attrMeaning).join(', ')}\n`,
                `  数値範囲0-100。属性の意味：${attrCfg.map(attrMeaning).join('、')}\n`,
                `  수치 범위 0-100. 속성 의미: ${attrCfg.map(attrMeaning).join(', ')}\n`,
                `  Диапазон значений 0-100. Значения атрибутов: ${attrCfg.map(attrMeaning).join(', ')}\n`
            );
        }
        if (sendSkills) {
            p += L(
                `\n【技能】仅习得/升级/失去时写，无变化可省略\n`,
                `\n[Skills] Write only when learned/upgraded/lost; skip if unchanged\n`,
                `\n【スキル】習得/レベルアップ/喪失時のみ記載、変化なしなら省略可\n`,
                `\n【스킬】습득/승급/상실 시에만 기재, 변화 없으면 생략 가능\n`,
                `\n[Навыки] Записывайте только при изучении/повышении/потере; пропускайте, если без изменений\n`
            );
            if (uoSkills) {
                p += L(
                    `  skill:技能名|等级|效果描述\n  skill-:技能名\n`,
                    `  skill:skill name|level|effect description\n  skill-:skill name\n`,
                    `  skill:スキル名|レベル|効果説明\n  skill-:スキル名\n`,
                    `  skill:스킬명|레벨|효과 설명\n  skill-:스킬명\n`,
                    `  skill:название навыка|уровень|описание эффекта\n  skill-:название навыка\n`
                );
            } else {
                p += L(
                    `  skill:归属|技能名|等级|效果描述\n  skill-:归属|技能名\n`,
                    `  skill:${own}|skill name|level|effect description\n  skill-:${own}|skill name\n`,
                    `  skill:${own}|スキル名|レベル|効果説明\n  skill-:${own}|スキル名\n`,
                    `  skill:${own}|스킬명|레벨|효과 설명\n  skill-:${own}|스킬명\n`,
                    `  skill:${own}|название навыка|уровень|описание эффекта\n  skill-:${own}|название навыка\n`
                );
            }
        }
        if (sendEq) {
            const eqCfg = this._getRpgEquipmentConfig();
            const perChar = eqCfg.perChar || {};
            const present = new Set(this.getLatestState()?.scene?.characters_present || []);
            const hasAnySlots = Object.values(perChar).some(c => c.slots?.length > 0);
            if (hasAnySlots) {
                p += L(
                    `\n【装备】角色穿戴/卸下装备时写，无变化可省略\n`,
                    `\n[Equipment] Write when character equips/unequips; skip if unchanged\n`,
                    `\n【装備】キャラクターが装備/解除した時に記載、変化なしなら省略可\n`,
                    `\n【장비】캐릭터가 장비 착용/해제 시 기재, 변화 없으면 생략 가능\n`,
                    `\n[Снаряжение] Записывайте при экипировке/снятии; пропускайте, если без изменений\n`
                );
                if (uoEq) {
                    p += L(
                        `  equip:格位名|装备名|属性1=值,属性2=值\n  unequip:格位名|装备名\n`,
                        `  equip:slot name|item name|stat1=value,stat2=value\n  unequip:slot name|item name\n`,
                        `  equip:スロット名|アイテム名|属性1=値,属性2=値\n  unequip:スロット名|アイテム名\n`,
                        `  equip:슬롯명|아이템명|속성1=값,속성2=값\n  unequip:슬롯명|아이템명\n`,
                        `  equip:слот|предмет|стат1=значение,стат2=значение\n  unequip:слот|предмет\n`
                    );
                    const userCfg = perChar[userName];
                    if (userCfg?.slots?.length) {
                        const slotNames = userCfg.slots.map(equipSlotText).join(commaSep);
                        const formText = userCfg.currentForm && userCfg.forms?.length
                            ? ` ${L('当前形态', 'current form', '現在形態', '현재 형태', 'текущая форма')}:${(userCfg.forms.find(f => f.id === userCfg.currentForm)?.name || userCfg.currentForm)}`
                            : '';
                        p += L(`  格位${formText}: ${slotNames}\n`, `  Slots${formText}: ${slotNames}\n`, `  スロット${formText}: ${slotNames}\n`, `  슬롯${formText}: ${slotNames}\n`, `  Слоты${formText}: ${slotNames}\n`);
                    }
                } else {
                    p += L(
                        `  equip:归属|格位名|装备名|属性1=值,属性2=值\n  unequip:归属|格位名|装备名\n`,
                        `  equip:${own}|slot name|item name|stat1=value,stat2=value\n  unequip:${own}|slot name|item name\n`,
                        `  equip:${own}|スロット名|アイテム名|属性1=値,属性2=値\n  unequip:${own}|スロット名|アイテム名\n`,
                        `  equip:${own}|슬롯명|아이템명|속성1=값,속성2=값\n  unequip:${own}|슬롯명|아이템명\n`,
                        `  equip:${own}|слот|предмет|стат1=значение,стат2=значение\n  unequip:${own}|слот|предмет\n`
                    );
                    for (const [o, cfg] of Object.entries(perChar)) {
                        if (!cfg.slots?.length) continue;
                        if (present.size > 0 && !present.has(o)) continue;
                        const slotNames = cfg.slots.map(equipSlotText).join(commaSep);
                        const formText = cfg.currentForm && cfg.forms?.length
                            ? ` ${L('当前形态', 'current form', '現在形態', '현재 형태', 'текущая форма')}:${(cfg.forms.find(f => f.id === cfg.currentForm)?.name || cfg.currentForm)}`
                            : '';
                        p += L(`  ${o} 格位${formText}: ${slotNames}\n`, `  ${o} slots${formText}: ${slotNames}\n`, `  ${o} スロット${formText}: ${slotNames}\n`, `  ${o} 슬롯${formText}: ${slotNames}\n`, `  ${o} слоты${formText}: ${slotNames}\n`);
                    }
                }
                p += L(
                    `  ⚠ 每个角色只能使用其当前形态已注册的格位。属性值为整数。\n  ⚠ 形态切换时，不兼容装备视为未激活，不要自动卸下或写回物品栏。\n  ⚠ 普通衣物非赋魔或特殊材料不应有高属性值。\n`,
                    `  ⚠ Each character may only use slots registered for the current form. Stat values must be integers.\n  ⚠ When form changes, incompatible equipment is inactive; do not auto-unequip or return it to inventory.\n  ⚠ Normal clothing without enchantment or special materials should NOT have high stat values.\n`,
                    `  ⚠ 各キャラクターは現在形態の登録済みスロットのみ使用可能。属性値は整数であること。\n  ⚠ 形態変化時、非対応装備は未アクティブ扱い。自動で解除したりインベントリに戻さないこと。\n  ⚠ エンチャントや特殊素材のない普通の衣服には高い属性値を付けないこと。\n`,
                    `  ⚠ 각 캐릭터는 현재 형태에 등록된 슬롯만 사용할 수 있습니다. 속성값은 정수여야 합니다.\n  ⚠ 형태 변경 시 호환되지 않는 장비는 비활성 상태입니다. 자동으로 해제하거나 인벤토리로 돌려보내지 마세요.\n  ⚠ 마법 부여나 특수 재료가 없는 일반 의류에는 높은 속성값을 부여하지 마세요.\n`,
                    `  ⚠ Каждый персонаж может использовать только слоты текущей формы. Значения характеристик — целые числа.\n  ⚠ При смене формы несовместимое снаряжение неактивно; не снимайте его автоматически и не возвращайте в инвентарь.\n  ⚠ Обычная одежда без зачарования или особых материалов НЕ должна иметь высоких значений характеристик.\n`
                );
                if (eqCfg.locked) {
                    p += L(
                        `  ⚠ 装备格位已锁定：禁止创造新格位，未列出的格位会被忽略。\n`,
                        `  ⚠ Equipment slots are locked: do NOT create new slots; unlisted slots will be ignored.\n`,
                        `  ⚠ 装備スロットはロック中：新規スロット作成禁止。未記載スロットは無視されます。\n`,
                        `  ⚠ 장비 슬롯이 잠겨 있습니다: 새 슬롯을 만들지 마세요. 목록에 없는 슬롯은 무시됩니다.\n`,
                        `  ⚠ Слоты снаряжения заблокированы: не создавайте новые слоты; отсутствующие в списке будут проигнорированы.\n`
                    );
                }
            }
        }
        if (sendRep) {
            const repConfig = this._getRpgReputationConfig();
            if (repConfig.categories.length > 0) {
                const repDefs = repConfig.categories.map(repDefinition).join('\n');
                p += L(
                    `\n【声望】仅声望变化时写，无变化可省略\n`,
                    `\n[Reputation] Write only when reputation changes; skip if unchanged\n`,
                    `\n【評判】評判が変化した時のみ記載、変化なしなら省略可\n`,
                    `\n【평판】평판 변화 시에만 기재, 변화 없으면 생략 가능\n`,
                    `\n[Репутация] Записывайте только при изменении репутации; пропускайте, если без изменений\n`
                );
                if (uoRep) {
                    p += L(
                        `  rep:声望分类名=当前值\n`,
                        `  rep:category name=current value\n`,
                        `  rep:評判カテゴリ名=現在値\n`,
                        `  rep:평판 분류명=현재값\n`,
                        `  rep:категория=текущее значение\n`
                    );
                } else {
                    p += L(
                        `  rep:归属|声望分类名=当前值\n`,
                        `  rep:${own}|category name=current value\n`,
                        `  rep:${own}|評判カテゴリ名=現在値\n`,
                        `  rep:${own}|평판 분류명=현재값\n`,
                        `  rep:${own}|категория=текущее значение\n`
                    );
                }
                p += L(
                    `  已注册的声望分类：\n${repDefs}\n`,
                    `  Registered reputation categories:\n${repDefs}\n`,
                    `  登録済みの評判カテゴリ：\n${repDefs}\n`,
                    `  등록된 평판 분류:\n${repDefs}\n`,
                    `  Зарегистрированные категории репутации:\n${repDefs}\n`
                );
                p += L(
                    `  ⚠ 禁止创造新的声望分类。只允许使用上述已注册的分类名。\n`,
                    `  ⚠ Do NOT create new reputation categories. Only use the registered names above.\n`,
                    `  ⚠ 新しい評判カテゴリを作成しないでください。上記の登録済みカテゴリ名のみ使用可。\n`,
                    `  ⚠ 새로운 평판 분류를 만들지 마세요. 위에 등록된 분류명만 사용하세요.\n`,
                    `  ⚠ НЕ создавайте новые категории репутации. Используйте только зарегистрированные названия выше.\n`
                );
            }
        }
        if (sendLvl) {
            p += L(
                `\n【等级与经验值】仅升级/降级或经验变化时写，无变化可省略\n`,
                `\n[Level & XP] Write only on level-up/down or XP change; skip if unchanged\n`,
                `\n【レベルと経験値】レベルアップ/ダウンまたは経験値変化時のみ記載、変化なしなら省略可\n`,
                `\n【레벨과 경험치】레벨 업/다운 또는 경험치 변화 시에만 기재, 변화 없으면 생략 가능\n`,
                `\n[Уровень и опыт] Записывайте только при повышении/понижении уровня или изменении опыта; пропускайте, если без изменений\n`
            );
            if (uoLvl) {
                p += L(
                    `  level:等级数值\n  xp:当前经验/升级所需\n`,
                    `  level:level number\n  xp:current XP/needed for level-up\n`,
                    `  level:レベル数値\n  xp:現在の経験値/レベルアップに必要な値\n`,
                    `  level:레벨 수치\n  xp:현재 경험치/레벨업 필요치\n`,
                    `  level:число уровня\n  xp:текущий опыт/необходимо для повышения\n`
                );
            } else {
                p += L(
                    `  level:归属=等级数值\n  xp:归属=当前经验/升级所需\n`,
                    `  level:${own}=level number\n  xp:${own}=current XP/needed for level-up\n`,
                    `  level:${own}=レベル数値\n  xp:${own}=現在の経験値/レベルアップに必要な値\n`,
                    `  level:${own}=레벨 수치\n  xp:${own}=현재 경험치/레벨업 필요치\n`,
                    `  level:${own}=число уровня\n  xp:${own}=текущий опыт/необходимо для повышения\n`
                );
            }
            p += L(`  经验值获取参考：\n`, `  XP gain reference:\n`, `  経験値獲得の参考：\n`, `  경험치 획득 참고:\n`, `  Справка по получению опыта:\n`);
            p += L(
                `  - 与角色等级相近或更强的挑战：获得较多经验(10~50+)\n  - 等级差 ≥10 的低级挑战：仅得 1 点经验\n  - 日常活动/对话/探索：少量经验(1~5)\n  - 升级所需经验随等级递增：建议 升级所需 = 等级 × 100\n`,
                `  - Challenge near or above character level: more XP (10~50+)\n  - Level gap ≥10 trivial challenge: only 1 XP\n  - Daily activities/dialogue/exploration: small XP (1~5)\n  - XP needed increases with level: suggested formula = level × 100\n`,
                `  - キャラクターレベルに近いまたはそれ以上の挑戦：多くの経験値(10~50+)\n  - レベル差≥10の簡単な挑戦：1経験値のみ\n  - 日常活動/会話/探索：少量の経験値(1~5)\n  - レベルアップに必要な経験値はレベルに応じて増加：推奨式 = レベル × 100\n`,
                `  - 캐릭터 레벨에 가깝거나 더 강한 도전: 많은 경험치(10~50+)\n  - 레벨 차이 ≥10인 사소한 도전: 1 경험치만\n  - 일상 활동/대화/탐험: 소량의 경험치(1~5)\n  - 레벨업 필요 경험치는 레벨에 따라 증가: 권장 공식 = 레벨 × 100\n`,
                `  - Испытание близкое к уровню персонажа или выше: больше опыта (10~50+)\n  - Разница уровней ≥10, тривиальное испытание: только 1 очко опыта\n  - Повседневные действия/диалог/исследование: немного опыта (1~5)\n  - Необходимый опыт растёт с уровнем: рекомендуемая формула = уровень × 100\n`
            );
        }
        if (sendCur) {
            const curConfig = this._getRpgCurrencyConfig();
            if (curConfig.denominations.length > 0) {
                const denomNames = curConfig.denominations.map(d => d.name).join(commaSep);
                const rateText = currencyRateText(curConfig.denominations);
                p += L(
                    `\n【货币——发生交易/拾取/消费时必写！】\n`,
                    `\n[Currency — MUST write on any trade/pickup/spending!]\n`,
                    `\n【通貨——取引/拾得/消費が発生した時は必ず記載！】\n`,
                    `\n【화폐 — 거래/획득/소비 발생 시 필수 기재!】\n`,
                    `\n[Валюта — ОБЯЗАТЕЛЬНО записывать при любой сделке/подборе/трате!]\n`
                );
                if (uoCur) {
                    p += L(`格式: currency:币名=±变化量\n`, `Format: currency:denomination=±amount\n`, `形式: currency:通貨名=±変化量\n`, `형식: currency:화폐명=±변화량\n`, `Формат: currency:валюта=±сумма\n`);
                    p += L(`示例:\n`, `Examples:\n`, `例：\n`, `예시:\n`, `Примеры:\n`);
                    p += `  currency:${curConfig.denominations[0].name}=+10\n  currency:${curConfig.denominations[0].name}=-3\n`;
                    if (curConfig.denominations.length > 1) p += `  currency:${curConfig.denominations[1].name}=+50\n`;
                    p += L(
                        `也可写绝对值: currency:币名=数量\n`,
                        `Absolute value also OK: currency:denomination=amount\n`,
                        `絶対値も可: currency:通貨名=数量\n`,
                        `절대값도 가능: currency:화폐명=수량\n`,
                        `Абсолютное значение тоже допустимо: currency:валюта=количество\n`
                    );
                } else {
                    p += L(`格式: currency:归属|币名=±变化量\n`, `Format: currency:${own}|denomination=±amount\n`, `形式: currency:${own}|通貨名=±変化量\n`, `형식: currency:${own}|화폐명=±변화량\n`, `Формат: currency:${own}|валюта=±сумма\n`);
                    p += L(`示例:\n`, `Examples:\n`, `例：\n`, `예시:\n`, `Примеры:\n`);
                    p += `  currency:${userName}|${curConfig.denominations[0].name}=+10\n  currency:${userName}|${curConfig.denominations[0].name}=-3\n`;
                    if (curConfig.denominations.length > 1) p += `  currency:${userName}|${curConfig.denominations[1].name}=+50\n`;
                    p += L(
                        `也可写绝对值: currency:归属|币名=数量\n`,
                        `Absolute value also OK: currency:${own}|denomination=amount\n`,
                        `絶対値も可: currency:${own}|通貨名=数量\n`,
                        `절대값도 가능: currency:${own}|화폐명=수량\n`,
                        `Абсолютное значение тоже допустимо: currency:${own}|валюта=количество\n`
                    );
                }
                p += L(`已注册币种: ${denomNames}\n`, `Registered denominations: ${denomNames}\n`, `登録済み通貨: ${denomNames}\n`, `등록된 화폐: ${denomNames}\n`, `Зарегистрированные валюты: ${denomNames}\n`);
                if (rateText) {
                    p += L(`兑换率: ${rateText}\n`, `Exchange rates: ${rateText}\n`, `為替レート: ${rateText}\n`, `환율: ${rateText}\n`, `Курсы обмена: ${rateText}\n`);
                }
                p += L(
                    `⚠ 禁止使用未注册的币种名。任何涉及金钱的行为（买卖/拾取/奖赏/偷窃）都必须写 currency 行。\n`,
                    `⚠ Do NOT use unregistered denomination names. Any money-related action (buy/sell/pickup/reward/theft) MUST include a currency line.\n`,
                    `⚠ 未登録の通貨名を使用しないでください。金銭に関わるすべての行動（売買/拾得/報酬/窃盗）にはcurrency行を必ず含めること。\n`,
                    `⚠ 등록되지 않은 화폐명을 사용하지 마세요. 금전 관련 모든 행동(매매/획득/보상/절도)에는 반드시 currency 행을 포함해야 합니다.\n`,
                    `⚠ НЕ используйте незарегистрированные названия валют. Любое действие с деньгами (покупка/продажа/подбор/награда/кража) ДОЛЖНО содержать строку currency.\n`
                );
            }
        }
        if (!!this.settings?.sendRpgStronghold) {
            const rpg = this.getChat()?.[0]?.horae_meta?.rpg;
            const nodes = rpg?.strongholds || [];
            p += L(
                `\n【据点/基地】据点状态变化时写（升级/建造/损毁/描述变更），无变化可省略。已有据点必须始终使用与下方「当前据点」完全一致的名称，禁止对已有名称做缩写/改写/加前缀变体\n`,
                `\n[Strongholds] Write when stronghold status changes (upgrade/build/destroy/description update); skip if unchanged. Existing strongholds MUST always use the exact same name as listed in "Current strongholds" below — no abbreviations, rewrites, or prefixed variants of existing names\n`,
                `\n【拠点/基地】拠点の状態が変化した時に記載（アップグレード/建設/破壊/説明更新）、変化なしなら省略可。既存の拠点名は下記「現在の拠点」と完全一致させる — 省略・言い換え・接頭辞変形は禁止\n`,
                `\n【거점/기지】거점 상태 변화 시 기재(업그레이드/건설/파괴/설명 변경), 변화 없으면 생략 가능. 기존 거점은 아래 '현재 거점'에 표시된 이름과 정확히 일치해야 함 — 줄임/변형/접두사 변형 금지\n`,
                `\n[Крепости] Записывайте при изменении статуса крепости (улучшение/строительство/разрушение/обновление описания); пропускайте, если без изменений. Существующие крепости ДОЛЖНЫ использовать точно такие же названия, как в списке ниже — сокращения, переименования и варианты с префиксами запрещены\n`
            );
            p += L(
                `格式: base:据点路径=等级 或 base:据点路径|desc=描述\n路径用 > 分隔层级\n`,
                `Format: base:stronghold path=level or base:stronghold path|desc=description\nUse > to separate hierarchy levels\n`,
                `形式: base:拠点パス=レベル または base:拠点パス|desc=説明\nパスは > で階層を区切る\n`,
                `형식: base:거점 경로=레벨 또는 base:거점 경로|desc=설명\n경로는 > 로 계층 구분\n`,
                `Формат: base:путь крепости=уровень или base:путь крепости|desc=описание\nИспользуйте > для разделения уровней иерархии\n`
            );
            p += L(`示例:\n`, `Examples:\n`, `例：\n`, `예시:\n`, `Примеры:\n`);
            p += L(
                `  base:主角庄园=3\n  base:主角庄园>锻造区>锻造炉=2\n  base:主角庄园|desc=坐落于河谷的石砌庄园，配有围墙和瞭望塔\n`,
                `  base:Hero's Manor=3\n  base:Hero's Manor>Forge Area>Furnace=2\n  base:Hero's Manor|desc=Stone manor in a river valley with walls and watchtower\n`,
                `  base:主人公の館=3\n  base:主人公の館>鍛冶場>溶鉱炉=2\n  base:主人公の館|desc=川の谷にある石造りの館、壁と見張り塔付き\n`,
                `  base:주인공의 저택=3\n  base:주인공의 저택>대장간>용광로=2\n  base:주인공의 저택|desc=성벽과 망루가 있는 강 계곡의 석조 저택\n`,
                `  base:Поместье героя=3\n  base:Поместье героя>Кузница>Печь=2\n  base:Поместье героя|desc=Каменное поместье в речной долине со стенами и сторожевой башней\n`
            );
            if (nodes.length > 0) {
                const rootNodes = nodes.filter(n => !n.parent);
                const summary = rootNodes.map(r => {
                    const kids = nodes.filter(n => n.parent === r.id);
                    const kidStr = kids.length > 0 ? `(${kids.map(k => k.name).join(commaSep)})` : '';
                    return `${r.name}${r.level != null ? ' Lv.' + r.level : ''}${kidStr}`;
                }).join(semiSep);
                p += L(`当前据点: ${summary}\n`, `Current strongholds: ${summary}\n`, `現在の拠点: ${summary}\n`, `현재 거점: ${summary}\n`, `Текущие крепости: ${summary}\n`);
            }
        }
        return p;
    }

    /** 获取当前对话的装备配置 */
    _getRpgEquipmentConfig() {
        const meta = this.getChat()?.[0]?.horae_meta;
        return meta?._rpgConfigs?.equipmentConfig || meta?.rpg?.equipmentConfig || { locked: false, perChar: {} };
    }

    /** 获取当前对话的声望配置 */
    _getRpgReputationConfig() {
        const rpg = this.getChat()?.[0]?.horae_meta?.rpg;
        return rpg?.reputationConfig || { categories: [], _deletedCategories: [] };
    }

    /** 获取当前对话的货币配置 */
    _getRpgCurrencyConfig() {
        const rpg = this.getChat()?.[0]?.horae_meta?.rpg;
        return rpg?.currencyConfig || { denominations: [] };
    }

    /** 动态生成必须包含的标签提醒（RPG 开启时追加 <horaerpg>） */
    _generateMustTagsReminder() {
        const tags = ['<horae>...</horae>', '<horaeevent>...</horaeevent>'];
        const rpgActive = this.settings?.rpgMode &&
            (this.settings.sendRpgBars !== false || this.settings.sendRpgSkills !== false ||
                this.settings.sendRpgAttributes !== false || !!this.settings.sendRpgReputation ||
                !!this.settings.sendRpgEquipment || !!this.settings.sendRpgLevel || !!this.settings.sendRpgCurrency ||
                !!this.settings.sendRpgStronghold);
        if (rpgActive) tags.push('<horaerpg>...</horaerpg>');
        const lang = this._getAiOutputLang();
        const joined = tags.join(' and ');
        if (lang === 'zh-CN' || lang === 'zh-TW') {
            const count = tags.length === 2 ? '两个' : `${tags.length}个`;
            return `你的回复末尾必须包含 ${tags.join(' 和 ')} ${count}标签。\n缺少任何一个标签=不合格。`;
        }
        if (lang === 'ja') {
            return `あなたの返信の末尾には必ず ${joined}（合計${tags.length}個のタグ）を含めてください。\nいずれかのタグが欠けている＝不合格。`;
        }
        if (lang === 'ko') {
            return `당신의 답변 끝에 반드시 ${joined} (총 ${tags.length}개 태그)를 포함해야 합니다.\n태그가 하나라도 빠지면 = 불합격.`;
        }
        if (lang === 'ru') {
            return `Ваш ответ ДОЛЖЕН заканчиваться ${joined} (всего ${tags.length} тегов).\nОтсутствие любого тега = недопустимо.`;
        }
        return `Your reply MUST end with ${joined} (${tags.length} tags total).\nMissing any tag = unacceptable.`;
    }

    /** 宽松正则解析（不需要标签包裹） */
    parseLooseFormat(message) {
        const result = {
            timestamp: {},
            costumes: {},
            items: {},
            deletedItems: [],
            events: [],  // 支持多个事件
            affection: {},
            npcs: {},
            scene: {},
            agenda: [],   // 待办事项
            deletedAgenda: []  // 已完成的待办事项
        };

        let hasAnyData = false;

        const patterns = {
            time: /time[:：]\s*(.+?)(?:\n|$)/gi,
            location: /location[:：]\s*(.+?)(?:\n|$)/gi,
            atmosphere: /atmosphere[:：]\s*(.+?)(?:\n|$)/gi,
            characters: /characters[:：]\s*(.+?)(?:\n|$)/gi,
            costume: /costume[:：]\s*(.+?)(?:\n|$)/gi,
            item: /item(!{0,2})[:：]\s*(.+?)(?:\n|$)/gi,
            itemDelete: /item-[:：]\s*(.+?)(?:\n|$)/gi,
            event: /event[:：]\s*(.+?)(?:\n|$)/gi,
            affection: /affection[:：]\s*(.+?)(?:\n|$)/gi,
            npc: /npc[:：]\s*(.+?)(?:\n|$)/gi,
            agendaDelete: /agenda-[:：]\s*(.+?)(?:\n|$)/gi,
            agenda: /agenda[:：]\s*(.+?)(?:\n|$)/gi
        };

        // time
        let match;
        while ((match = patterns.time.exec(message)) !== null) {
            const timeStr = match[1].trim();
            const clockMatch = timeStr.match(/\b(\d{1,2}:\d{2})\s*$/);
            if (clockMatch) {
                result.timestamp.story_time = clockMatch[1];
                result.timestamp.story_date = timeStr.substring(0, timeStr.lastIndexOf(clockMatch[1])).trim();
            } else {
                result.timestamp.story_date = timeStr;
                result.timestamp.story_time = '';
            }
            hasAnyData = true;
        }

        // location
        while ((match = patterns.location.exec(message)) !== null) {
            result.scene.location = match[1].trim();
            hasAnyData = true;
        }

        // atmosphere
        while ((match = patterns.atmosphere.exec(message)) !== null) {
            result.scene.atmosphere = match[1].trim();
            hasAnyData = true;
        }

        // characters
        while ((match = patterns.characters.exec(message)) !== null) {
            result.scene.characters_present = match[1].trim().split(/[,，]/).map(c => c.trim()).filter(Boolean);
            hasAnyData = true;
        }

        // costume
        while ((match = patterns.costume.exec(message)) !== null) {
            const costumeStr = match[1].trim();
            const eqIndex = costumeStr.indexOf('=');
            if (eqIndex > 0) {
                const char = costumeStr.substring(0, eqIndex).trim();
                const costume = costumeStr.substring(eqIndex + 1).trim();
                result.costumes[char] = costume;
                hasAnyData = true;
            }
        }

        // item
        while ((match = patterns.item.exec(message)) !== null) {
            const exclamations = match[1] || '';
            const itemStr = match[2].trim();
            let importance = '';  // 一般用空字符串
            if (exclamations === '!!') importance = '!!';  // 关键
            else if (exclamations === '!') importance = '!';  // 重要

            const eqIndex = itemStr.indexOf('=');
            if (eqIndex > 0) {
                let itemNamePart = itemStr.substring(0, eqIndex).trim();
                const rest = itemStr.substring(eqIndex + 1).trim();

                let icon = null;
                let itemName = itemNamePart;
                const emojiMatch = itemNamePart.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}])/u);
                if (emojiMatch) {
                    icon = emojiMatch[1];
                    itemName = itemNamePart.substring(icon.length).trim();
                }

                let description = undefined;  // undefined = 没有描述字段，合并时不覆盖原有描述
                const pipeIdx = itemName.indexOf('|');
                if (pipeIdx > 0) {
                    const descText = itemName.substring(pipeIdx + 1).trim();
                    if (descText) description = descText;  // 只有非空才设置
                    itemName = itemName.substring(0, pipeIdx).trim();
                }

                // 去掉无意义的数量标记
                itemName = itemName.replace(/[\(（]1[\)）]$/, '').trim();
                itemName = itemName.replace(new RegExp(`[\\(（]1[${COUNTING_CLASSIFIERS}][\\)）]$`), '').trim();
                itemName = itemName.replace(new RegExp(`[\\(（][${COUNTING_CLASSIFIERS}][\\)）]$`), '').trim();

                const atIndex = rest.indexOf('@');
                const itemInfo = {
                    icon: icon,
                    importance: importance,
                    holder: atIndex >= 0 ? (rest.substring(0, atIndex).trim() || null) : (rest || null),
                    location: atIndex >= 0 ? (rest.substring(atIndex + 1).trim() || '') : ''
                };
                if (description !== undefined) itemInfo.description = description;
                result.items[itemName] = itemInfo;
                hasAnyData = true;
            }
        }

        // item-
        while ((match = patterns.itemDelete.exec(message)) !== null) {
            const itemName = match[1].trim().replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, '').trim();
            if (itemName) {
                result.deletedItems.push(itemName);
                hasAnyData = true;
            }
        }

        // event
        while ((match = patterns.event.exec(message)) !== null) {
            const eventStr = match[1].trim();
            const parts = eventStr.split('|');
            if (parts.length >= 2) {
                const levelRaw = parts[0].trim();
                const summary = parts.slice(1).join('|').trim();

                let level = '一般';
                if (levelRaw === '关键' || levelRaw === '關鍵' || levelRaw.toLowerCase() === 'critical') {
                    level = '关键';
                } else if (levelRaw === '重要' || levelRaw.toLowerCase() === 'important') {
                    level = '重要';
                }

                result.events.push({
                    is_important: level === '重要' || level === '关键',
                    level: level,
                    summary: summary
                });
                hasAnyData = true;
            }
        }

        // affection
        while ((match = patterns.affection.exec(message)) !== null) {
            const affStr = match[1].trim();
            // 绝对值格式
            const absMatch = affStr.match(/^(.+?)=\s*([+\-]?\d+\.?\d*)/);
            if (absMatch) {
                result.affection[absMatch[1].trim()] = { type: 'absolute', value: parseFloat(absMatch[2]) };
                hasAnyData = true;
            } else {
                // 相对值格式 name+/-数值（无=号）
                const relMatch = affStr.match(/^(.+?)([+\-]\d+\.?\d*)/);
                if (relMatch) {
                    result.affection[relMatch[1].trim()] = { type: 'relative', value: relMatch[2] };
                    hasAnyData = true;
                }
            }
        }

        // npc
        while ((match = patterns.npc.exec(message)) !== null) {
            const npcStr = match[1].trim();
            const npcInfo = this._parseNpcFields(npcStr);
            const name = npcInfo._name;
            delete npcInfo._name;

            if (name) {
                npcInfo.last_seen = new Date().toISOString();
                result.npcs[name] = npcInfo;
                hasAnyData = true;
            }
        }

        // agenda-:（须在 agenda 之前解析）
        while ((match = patterns.agendaDelete.exec(message)) !== null) {
            const delStr = match[1].trim();
            if (delStr) {
                const pipeIdx = delStr.indexOf('|');
                const text = pipeIdx > 0 ? delStr.substring(pipeIdx + 1).trim() : delStr;
                if (text) {
                    result.deletedAgenda.push(text);
                    hasAnyData = true;
                }
            }
        }

        // agenda
        while ((match = patterns.agenda.exec(message)) !== null) {
            const agendaStr = match[1].trim();
            const pipeIdx = agendaStr.indexOf('|');
            let dateStr = '', text = '';
            if (pipeIdx > 0) {
                dateStr = agendaStr.substring(0, pipeIdx).trim();
                text = agendaStr.substring(pipeIdx + 1).trim();
            } else {
                text = agendaStr;
            }
            if (text) {
                const doneMatch = text.match(/[\(（](完成|已完成|done|finished|completed|失效|取消|已取消)[\)）]\s*$/i);
                if (doneMatch) {
                    const cleanText = text.substring(0, text.length - doneMatch[0].length).trim();
                    if (cleanText) { result.deletedAgenda.push(cleanText); hasAnyData = true; }
                } else {
                    result.agenda.push({ date: dateStr, text, source: 'ai', done: false });
                    hasAnyData = true;
                }
            }
        }

        // 表格更新
        const tableMatches = [...message.matchAll(/<horaetable[:：]\s*(.+?)>([\s\S]*?)<\/horaetable(?:[:：][^>]*)?>/gi)];
        if (tableMatches.length > 0) {
            result.tableUpdates = [];
            for (const tm of tableMatches) {
                const tableName = tm[1].trim();
                const tableContent = tm[2].trim();
                const updates = this._parseTableCellEntries(tableContent);

                if (Object.keys(updates).length > 0) {
                    result.tableUpdates.push({ name: tableName, updates });
                    hasAnyData = true;
                }
            }
        }

        return hasAnyData ? result : null;
    }
}

// 导出单例
export const horaeManager = new HoraeManager();
