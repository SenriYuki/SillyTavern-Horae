/**
 * Horae - 核心管理器
 * 负责元数据的存储、解析、聚合
 */

import { parseStoryDate, calculateRelativeTime, calculateDetailedRelativeTime, generateTimeReference, formatRelativeTime, formatFullDateTime } from '../utils/timeUtils.js';

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
                    
                    // 检测消耗状态标记，视为删除
                    const consumedPatterns = /[\(（](已消耗|已用完|已销毁|消耗殆尽|消耗|用尽)[\)）]/;
                    const holderConsumed = /^(消耗|已消耗|已用完|消耗殆尽|用尽|无)$/;
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
                        // 只合并实际存在的字段
                        const mergedItem = { ...existingItem };
                        if (newInfo.icon) mergedItem.icon = newInfo.icon;
                        // importance：只升不降（空 < ! < !!），仅在 AI 累积时生效
                        const _impRank = { '': 0, '!': 1, '!!': 2 };
                        const _newR = _impRank[newInfo.importance] ?? 0;
                        const _oldR = _impRank[existingItem.importance] ?? 0;
                        mergedItem.importance = _newR >= _oldR ? (newInfo.importance || '') : (existingItem.importance || '');
                        if (newInfo.holder !== undefined) mergedItem.holder = newInfo.holder;
                        if (newInfo.location !== undefined) mergedItem.location = newInfo.location;
                        // 非空描述才覆盖
                        if (newInfo.description !== undefined && newInfo.description.trim()) {
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
                const protectedFields = ['gender', 'race']; // 性别/种族极少改变
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

    /** 根据剧情时间推移计算NPC当前年龄 */
    calcCurrentAge(npcInfo, currentStoryDate) {
        const original = npcInfo.age || '';
        const refDate = npcInfo._ageRefDate || '';
        
        // 无法推算的情况：无年龄、无参考日期、无当前日期
        if (!original || !refDate || !currentStoryDate) {
            return { display: original, original, changed: false };
        }
        
        const ageNum = parseInt(original);
        if (isNaN(ageNum)) {
            // 非数字年龄，无法推算
            return { display: original, original, changed: false };
        }
        
        const refParsed = parseStoryDate(refDate);
        const curParsed = parseStoryDate(currentStoryDate);
        
        // 需要两者都是 standard 类型且有年份才能推算
        if (!refParsed || !curParsed || refParsed.type !== 'standard' || curParsed.type !== 'standard') {
            return { display: original, original, changed: false };
        }
        if (!refParsed.year || !curParsed.year) {
            return { display: original, original, changed: false };
        }
        
        let yearDiff = curParsed.year - refParsed.year;
        
        // 月日判断是否已过生日
        if (refParsed.month && curParsed.month) {
            if (curParsed.month < refParsed.month || 
                (curParsed.month === refParsed.month && (curParsed.day || 1) < (refParsed.day || 1))) {
                yearDiff -= 1;
            }
        }
        
        if (yearDiff <= 0) {
            return { display: original, original, changed: false };
        }
        
        const currentAge = ageNum + yearDiff;
        return { 
            display: String(currentAge), 
            original, 
            changed: true 
        };
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

    /** 生成紧凑的上下文注入内容（skipLast: swipe时跳过末尾N条消息） */
    generateCompactPrompt(skipLast = 0) {
        const state = this.getLatestState(skipLast);
        const lines = [];
        
        // 状态快照头
        lines.push('[当前状态快照——对比本回合剧情，仅在<horae>中输出发生实质变化的字段]');
        
        const sendTimeline = this.settings?.sendTimeline !== false;
        const sendCharacters = this.settings?.sendCharacters !== false;
        const sendItems = this.settings?.sendItems !== false;
        
        // 时间
        if (state.timestamp.story_date) {
            const fullDateTime = formatFullDateTime(state.timestamp.story_date, state.timestamp.story_time);
            lines.push(`[时间|${fullDateTime}]`);
            
            // 时间参考
            if (sendTimeline) {
                const timeRef = generateTimeReference(state.timestamp.story_date);
                if (timeRef && timeRef.type === 'standard') {
                    // 标准日历
                    lines.push(`[时间参考|昨天=${timeRef.yesterday}|前天=${timeRef.dayBefore}|3天前=${timeRef.threeDaysAgo}]`);
                } else if (timeRef && timeRef.type === 'fantasy') {
                    // 奇幻日历
                    lines.push(`[时间参考|奇幻日历模式，参见剧情轨迹中的相对时间标记]`);
                }
            }
        }
        
        // 场景
        if (state.scene.location) {
            let sceneStr = `[场景|${state.scene.location}`;
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
                    lines.push(`[场景记忆|${entry.desc}]`);
                }
                // 附带父级地点描述（如「酒馆·大厅」→ 同时发送「酒馆」的描述）
                const sepMatch = loc.match(/[·・\-\/\|]/);
                if (sepMatch) {
                    const parent = loc.substring(0, sepMatch.index).trim();
                    if (parent && locMem[parent] && locMem[parent].desc && parent !== entry?._matchedName) {
                        lines.push(`[场景记忆:${parent}|${locMem[parent].desc}]`);
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
                lines.push(`[在场|${charStrs.join('|')}]`);
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
                    lines.push(`[情绪|${moodEntries.join('|')}]`);
                }
            }
            
            // 关系网络（仅在场角色相关的关系，从 chat[0] 读取，零AI输出token）
            if (this.settings?.sendRelationships) {
                const rels = this.getRelationshipsForCharacters(presentChars);
                if (rels.length > 0) {
                    lines.push('\n[关系网络]');
                    for (const r of rels) {
                        const noteStr = r.note ? `(${r.note})` : '';
                        lines.push(`${r.from}→${r.to}: ${r.type}${noteStr}`);
                    }
                }
            }
        }
        
        // 物品
        if (sendItems) {
            const items = Object.entries(state.items);
            if (items.length > 0) {
                lines.push('\n[物品清单]');
                for (const [name, info] of items) {
                    const id = info._id || '???';
                    const icon = info.icon || '';
                    const imp = info.importance === '!!' ? '关键' : info.importance === '!' ? '重要' : '';
                    const desc = info.description ? ` | ${info.description}` : '';
                    const holder = info.holder || '';
                    const loc = info.location ? `@${info.location}` : '';
                    const impTag = imp ? `[${imp}]` : '';
                    lines.push(`#${id} ${icon}${name}${impTag}${desc} = ${holder}${loc}`);
                }
            } else {
                lines.push('\n[物品清单] (空)');
            }
        }
        
        // 好感度
        if (sendCharacters) {
            const affections = Object.entries(state.affection).filter(([_, v]) => v !== 0);
            if (affections.length > 0) {
                const affStr = affections.map(([k, v]) => `${k}:${v > 0 ? '+' : ''}${v}`).join('|');
                lines.push(`[好感|${affStr}]`);
            }
            
            // NPC信息
            const npcs = Object.entries(state.npcs);
            if (npcs.length > 0) {
                lines.push('\n[已知NPC]');
                for (const [name, info] of npcs) {
                    const id = info._id || '?';
                    const app = info.appearance || '';
                    const per = info.personality || '';
                    const rel = info.relationship || '';
                    // 主体：N编号 名｜外貌=性格@关系
                    let npcStr = `N${id} ${name}`;
                    if (app || per || rel) {
                        npcStr += `｜${app}=${per}@${rel}`;
                    }
                    // 扩展字段
                    const extras = [];
                    if (info._aliases?.length) extras.push(`曾用名:${info._aliases.join('/')}`);
                    if (info.gender) extras.push(`性别:${info.gender}`);
                    if (info.age) {
                        const ageResult = this.calcCurrentAge(info, state.timestamp.story_date);
                        extras.push(`年龄:${ageResult.display}`);
                    }
                    if (info.race) extras.push(`种族:${info.race}`);
                    if (info.job) extras.push(`职业:${info.job}`);
                    if (info.note) extras.push(`补充:${info.note}`);
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
            lines.push('\n[待办事项]');
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
            const allRpgNames = new Set([
                ...Object.keys(rpg.bars), ...Object.keys(rpg.status || {}),
                ...Object.keys(rpg.skills), ...Object.keys(rpg.attributes || {})
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

            if (sendBars && Object.keys(rpg.bars).length > 0) {
                lines.push('\n[RPG状态]');
                for (const [name, bars] of Object.entries(rpg.bars)) {
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const npc = state.npcs[name];
                    const pre = npc?._id ? `N${npc._id} ` : '';
                    const parts = [];
                    for (const [type, val] of Object.entries(bars)) {
                        const label = val[2] || _barNames[type] || type.toUpperCase();
                        parts.push(`${label} ${val[0]}/${val[1]}`);
                    }
                    const sts = rpg.status?.[name];
                    if (sts?.length > 0) parts.push(`状态:${sts.join('/')}`);
                    if (parts.length > 0) lines.push(`${pre}${name}: ${parts.join(' | ')}`);
                }
                for (const [name, effects] of Object.entries(rpg.status || {})) {
                    if (rpg.bars[name] || effects.length === 0) continue;
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const npc = state.npcs[name];
                    const pre = npc?._id ? `N${npc._id} ` : '';
                    lines.push(`${pre}${name}: 状态:${effects.join('/')}`);
                }
            }

            if (sendSkills && Object.keys(rpg.skills).length > 0) {
                const hasAny = Object.entries(rpg.skills).some(([n, arr]) =>
                    arr?.length > 0 && (!filterRpg || rpgAllowed.has(n)));
                if (hasAny) {
                    lines.push('\n[技能列表]');
                    for (const [name, skills] of Object.entries(rpg.skills)) {
                        if (!skills?.length) continue;
                        if (filterRpg && !rpgAllowed.has(name)) continue;
                        const npc = state.npcs[name];
                        const pre = npc?._id ? `N${npc._id} ` : '';
                        lines.push(`${pre}${name}:`);
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
                lines.push('\n[多维属性]');
                for (const [name, vals] of Object.entries(rpg.attributes)) {
                    if (filterRpg && !rpgAllowed.has(name)) continue;
                    const npc = state.npcs[name];
                    const pre = npc?._id ? `N${npc._id} ` : '';
                    const parts = attrCfg.map(a => `${a.name}${vals[a.key] ?? '?'}`);
                    lines.push(`${pre}${name}: ${parts.join(' | ')}`);
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
            // 被活跃摘要压缩的事件不发送；摘要为 inactive 时其 _summaryId 事件不发送
            const events = allEvents.filter(e => {
                if (e.event?._compressedBy && activeSumIds.has(e.event._compressedBy)) return false;
                if (e.event?._summaryId && !activeSumIds.has(e.event._summaryId)) return false;
                return true;
            });
            if (events.length > 0) {
                lines.push('\n[剧情轨迹]');
                
                const currentDate = state.timestamp?.story_date || '';
                
                const getLevelMark = (level) => {
                    if (level === '关键') return '★';
                    if (level === '重要') return '●';
                    return '○';
                };
                
                const getRelativeDesc = (eventDate) => {
                    if (!eventDate || !currentDate) return '';
                    const result = calculateDetailedRelativeTime(eventDate, currentDate);
                    if (result.days === null || result.days === undefined) return '';
                    
                    const { days, fromDate, toDate } = result;
                    
                    if (days === 0) return '(今天)';
                    if (days === 1) return '(昨天)';
                    if (days === 2) return '(前天)';
                    if (days === 3) return '(大前天)';
                    if (days === -1) return '(明天)';
                    if (days === -2) return '(后天)';
                    if (days === -3) return '(大后天)';
                    
                    if (days >= 4 && days <= 13 && fromDate) {
                        const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
                        const weekday = fromDate.getDay();
                        return `(上周${WEEKDAY_NAMES[weekday]})`;
                    }
                    
                    if (days >= 20 && days < 60 && fromDate && toDate) {
                        const fromMonth = fromDate.getMonth();
                        const toMonth = toDate.getMonth();
                        if (fromMonth !== toMonth) {
                            return `(上个月${fromDate.getDate()}号)`;
                        }
                    }
                    
                    if (days >= 300 && fromDate && toDate) {
                        const fromYear = fromDate.getFullYear();
                        const toYear = toDate.getFullYear();
                        if (fromYear < toYear) {
                            const fromMonth = fromDate.getMonth() + 1;
                            return `(去年${fromMonth}月)`;
                        }
                    }
                    
                    if (days > 0 && days < 30) return `(${days}天前)`;
                    if (days > 0) return `(${Math.round(days / 30)}个月前)`;
                    if (days === -999 || days === -998 || days === -997) return '';
                    return '';
                };
                
                const sortedEvents = [...events].sort((a, b) => {
                    return (a.messageIndex || 0) - (b.messageIndex || 0);
                });
                
                const criticalAndImportant = sortedEvents.filter(e => 
                    e.event?.level === '关键' || e.event?.level === '重要' || e.event?.level === '摘要' || e.event?.isSummary
                );
                const contextDepth = this.settings?.contextDepth ?? 15;
                const normalAll = sortedEvents.filter(e => 
                    (e.event?.level === '一般' || !e.event?.level) && !e.event?.isSummary
                );
                const normalEvents = contextDepth === 0 ? [] : normalAll.slice(-contextDepth);
                
                const allToShow = [...criticalAndImportant, ...normalEvents]
                    .sort((a, b) => (a.messageIndex || 0) - (b.messageIndex || 0));
                
                for (const e of allToShow) {
                    const isSummary = e.event?.isSummary || e.event?.level === '摘要';
                    if (isSummary) {
                        lines.push(`📋 [摘要]: ${e.event.summary}`);
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
        
        // 自定义表格数据（合并全局和本地）
        const chat = this.getChat();
        const firstMsg = chat?.[0];
        const localTables = firstMsg?.horae_meta?.customTables || [];
        const resolvedGlobal = this._getResolvedGlobalTables();
        const allTables = [...resolvedGlobal, ...localTables];
        for (const table of allTables) {
            const rows = table.rows || 2;
            const cols = table.cols || 2;
            const data = table.data || {};
            
            // 有内容或有填表说明才输出
            const hasContent = Object.values(data).some(v => v && v.trim());
            const hasPrompt = table.prompt && table.prompt.trim();
            if (!hasContent && !hasPrompt) continue;
            
            const tableName = table.name || '自定义表格';
            lines.push(`\n[${tableName}](${rows - 1}行×${cols - 1}列)`);
            
            if (table.prompt && table.prompt.trim()) {
                lines.push(`(填写要求: ${table.prompt.trim()})`);
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
                const label = data[`0-${c}`] || (c === 0 ? '表头' : `列${c}`);
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
                lines.push(`(共${rows - 1}行，第${lastDataRow + 1}-${rows - 1}行暂无数据)`);
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
                const emptyColNames = emptyCols.map(c => data[`0-${c}`] || `列${c}`);
                lines.push(`(${emptyColNames.join('、')}：暂无数据，如剧情中已有相关信息请填写)`);
            }
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

    /** 解析AI回复中的horae标签 */
    parseHoraeTag(message) {
        if (!message) return null;
        
        // 提取所有 <horae> 块并选择包含有效字段的块（防止其他插件生成的同名标签干扰）
        let match = null;
        const allHoraeMatches = [...message.matchAll(/<horae>([\s\S]*?)<\/horae>/gi)];
        const horaeFieldPattern = /^(time|timestamp|location|atmosphere|scene_desc|characters|costume|item[!]*|item-|event|affection|npc|agenda|agenda-|rel|mood):/m;
        if (allHoraeMatches.length > 1) {
            match = allHoraeMatches.find(m => horaeFieldPattern.test(m[1])) || allHoraeMatches[0];
        } else if (allHoraeMatches.length === 1) {
            match = allHoraeMatches[0];
        }
        if (!match) {
            match = message.match(/<!--horae([\s\S]*?)-->/i);
        }
        
        const allEventMatches = [...message.matchAll(/<horaeevent>([\s\S]*?)<\/horaeevent>/gi)];
        const eventMatch = allEventMatches.length > 1
            ? (allEventMatches.find(m => /^event:/m.test(m[1])) || allEventMatches[0])
            : allEventMatches[0] || null;
        const tableMatches = [...message.matchAll(/<horaetable[:：]\s*(.+?)>([\s\S]*?)<\/horaetable>/gi)];
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
            // scene_desc:地点的固定物理特征描述
            else if (trimmedLine.startsWith('scene_desc:')) {
                result.scene.scene_desc = trimmedLine.substring(11).trim();
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
                    if (levelRaw === '关键' || levelRaw.toLowerCase() === 'critical') {
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
            result.rpg = { bars: {}, status: {}, skills: [], removedSkills: [], attributes: {} };
            for (const rm of rpgMatches) {
                const rpgContent = rm[1].trim();
                for (const rpgLine of rpgContent.split('\n')) {
                    const trimmed = rpgLine.trim();
                    if (trimmed) this._parseRpgLine(trimmed, result.rpg);
                }
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
            for (const item of parsed.agenda) {
                if (deletedSet.has(item.text)) continue;
                const isDupe = meta.agenda.some(a => a.text === item.text);
                if (!isDupe) {
                    meta.agenda.push(item);
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
            meta._rpgChanges = parsed.rpg;
        }
        
        return meta;
    }

    /** 解析单行 RPG 数据 */
    _parseRpgLine(line, rpg) {
        // 属性条: key:owner=cur/max 或 key:owner=cur/max(显示名)
        const barMatch = line.match(/^([a-zA-Z]\w*):(.+?)=(\d+)\s*\/\s*(\d+)(?:\((.+?)\))?$/i);
        if (barMatch && !/^(status|skill)$/i.test(barMatch[1])) {
            const type = barMatch[1].toLowerCase();
            const owner = barMatch[2].trim();
            const current = parseInt(barMatch[3]);
            const max = parseInt(barMatch[4]);
            const label = barMatch[5]?.trim() || null;
            if (!rpg.bars[owner]) rpg.bars[owner] = {};
            rpg.bars[owner][type] = label ? [current, max, label] : [current, max];
            return;
        }
        // status:N01 Name=效果1/效果2
        if (line.startsWith('status:')) {
            const str = line.substring(7).trim();
            const eq = str.indexOf('=');
            if (eq > 0) {
                const owner = str.substring(0, eq).trim();
                const val = str.substring(eq + 1).trim();
                rpg.status[owner] = (!val || /^(正常|无|none)$/i.test(val))
                    ? [] : val.split('/').map(s => s.trim()).filter(Boolean);
            }
            return;
        }
        // skill:N01 Name|技能名|等级|效果
        if (line.startsWith('skill:')) {
            const parts = line.substring(6).trim().split('|').map(s => s.trim());
            if (parts.length >= 2) {
                rpg.skills.push({ owner: parts[0], name: parts[1], level: parts[2] || '', desc: parts[3] || '' });
            }
            return;
        }
        // skill-:N01 Name|技能名
        if (line.startsWith('skill-:')) {
            const parts = line.substring(7).trim().split('|').map(s => s.trim());
            if (parts.length >= 2) {
                rpg.removedSkills.push({ owner: parts[0], name: parts[1] });
            }
            return;
        }
        // attr:N01 Name|key=val|key=val...
        if (line.startsWith('attr:')) {
            const parts = line.substring(5).trim().split('|').map(s => s.trim());
            if (parts.length >= 2) {
                const owner = parts[0];
                const vals = {};
                for (let i = 1; i < parts.length; i++) {
                    const kv = parts[i].match(/^(\w+)=(\d+)$/);
                    if (kv) vals[kv[1].toLowerCase()] = parseInt(kv[2]);
                }
                if (Object.keys(vals).length) {
                    if (!rpg.attributes) rpg.attributes = {};
                    rpg.attributes[owner] = vals;
                }
            }
        }
    }

    /** 通过 N编号 解析归属者的规范名称 */
    _resolveRpgOwner(ownerStr) {
        const m = ownerStr.match(/^N(\d+)\s+(.+)$/);
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
            return m[2].trim();
        }
        return ownerStr.trim();
    }

    /** 合并 RPG 变更到 chat[0].horae_meta.rpg */
    _mergeRpgData(changes) {
        const chat = this.getChat();
        if (!chat?.length || !changes) return;
        const first = chat[0];
        if (!first.horae_meta) first.horae_meta = createEmptyMeta();
        if (!first.horae_meta.rpg) first.horae_meta.rpg = { bars: {}, status: {}, skills: {} };
        const rpg = first.horae_meta.rpg;

        for (const [raw, barData] of Object.entries(changes.bars || {})) {
            const owner = this._resolveRpgOwner(raw);
            if (!rpg.bars[owner]) rpg.bars[owner] = {};
            Object.assign(rpg.bars[owner], barData);
        }
        for (const [raw, effects] of Object.entries(changes.status || {})) {
            const owner = this._resolveRpgOwner(raw);
            if (!rpg.status) rpg.status = {};
            rpg.status[owner] = effects;
        }
        for (const sk of (changes.skills || [])) {
            const owner = this._resolveRpgOwner(sk.owner);
            if (!rpg.skills[owner]) rpg.skills[owner] = [];
            const idx = rpg.skills[owner].findIndex(s => s.name === sk.name);
            if (idx >= 0) {
                if (sk.level) rpg.skills[owner][idx].level = sk.level;
                if (sk.desc) rpg.skills[owner][idx].desc = sk.desc;
            } else {
                rpg.skills[owner].push({ name: sk.name, level: sk.level, desc: sk.desc });
            }
        }
        for (const sk of (changes.removedSkills || [])) {
            const owner = this._resolveRpgOwner(sk.owner);
            if (rpg.skills[owner]) {
                rpg.skills[owner] = rpg.skills[owner].filter(s => s.name !== sk.name);
            }
        }
        // 多维属性
        for (const [raw, vals] of Object.entries(changes.attributes || {})) {
            const owner = this._resolveRpgOwner(raw);
            if (!rpg.attributes) rpg.attributes = {};
            rpg.attributes[owner] = { ...(rpg.attributes[owner] || {}), ...vals };
        }
    }

    /** 从所有消息重建 RPG 全局数据（保留用户手动编辑） */
    rebuildRpgData() {
        const chat = this.getChat();
        if (!chat?.length) return;
        const first = chat[0];
        if (!first.horae_meta) first.horae_meta = createEmptyMeta();
        const old = first.horae_meta.rpg || {};
        // 保留用户手动添加的技能
        const userSkills = {};
        for (const [owner, arr] of Object.entries(old.skills || {})) {
            const ua = (arr || []).filter(s => s._userAdded);
            if (ua.length) userSkills[owner] = ua;
        }
        // 保留用户手动删除记录和手动填写的属性
        const deletedSkills = old._deletedSkills || [];
        const userAttrs = old.attributes || {};

        first.horae_meta.rpg = { bars: {}, status: {}, skills: {}, attributes: { ...userAttrs }, _deletedSkills: deletedSkills };
        for (let i = 1; i < chat.length; i++) {
            const changes = chat[i]?.horae_meta?._rpgChanges;
            if (changes) this._mergeRpgData(changes);
        }
        // 回填用户手动添加的技能
        const rpg = first.horae_meta.rpg;
        for (const [owner, arr] of Object.entries(userSkills)) {
            if (!rpg.skills[owner]) rpg.skills[owner] = [];
            for (const sk of arr) {
                if (!rpg.skills[owner].some(s => s.name === sk.name)) rpg.skills[owner].push(sk);
            }
        }
        // 过滤用户手动删除的技能
        for (const del of deletedSkills) {
            if (rpg.skills[del.owner]) {
                rpg.skills[del.owner] = rpg.skills[del.owner].filter(s => s.name !== del.name);
                if (!rpg.skills[del.owner].length) delete rpg.skills[del.owner];
            }
        }
    }

    /** 获取 RPG 全局数据（chat[0] 累积） */
    getRpgData() {
        return this.getChat()?.[0]?.horae_meta?.rpg || { bars: {}, status: {}, skills: {}, attributes: {} };
    }

    /**
     * 构建到指定消息位置的 RPG 快照（不修改 chat[0]）
     * @param {number} skipLast - 跳过末尾N条消息（swipe时=1）
     */
    getRpgStateAt(skipLast = 0) {
        const chat = this.getChat();
        if (!chat?.length) return { bars: {}, status: {}, skills: {}, attributes: {} };
        const end = Math.max(1, chat.length - skipLast);
        const snapshot = { bars: {}, status: {}, skills: {}, attributes: {} };
        const first = chat[0];
        const rpgMeta = first?.horae_meta?.rpg || {};

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

        // 从消息中累积属性（snapshot 是独立对象，不污染 chat[0]）
        const _resolve = (raw) => this._resolveRpgOwner(raw);
        for (let i = 1; i < end; i++) {
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
                    if (sk.level) snapshot.skills[owner][idx].level = sk.level;
                    if (sk.desc) snapshot.skills[owner][idx].desc = sk.desc;
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
            const rels = chat[i]?.horae_meta?.relationships;
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
        // 从消息重放 AI 写入的 scene_desc（按时间顺序，后覆盖前），跳过已删除的
        for (let i = 1; i < chat.length; i++) {
            const meta = chat[i]?.horae_meta;
            if (meta?.scene?.scene_desc && meta?.scene?.location) {
                const loc = meta.scene.location;
                if (deletedNames.has(loc)) continue;
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

    /** 处理AI回复，解析标签并存储元数据 */
    processAIResponse(messageIndex, messageContent) {
        let parsed = this.parseHoraeTag(messageContent);
        
        // 标签解析失败时，自动 fallback 到宽松格式解析
        if (!parsed) {
            parsed = this.parseLooseFormat(messageContent);
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

            // 场景记忆：将 scene_desc 存入 locationMemory
            if (parsed.scene?.scene_desc && parsed.scene?.location) {
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

    /** 将表格更新写入 chat[0]（本地表格）或 per-card overlay（全局表格） */
    applyTableUpdates(tableUpdates) {
        if (!tableUpdates || tableUpdates.length === 0) return;

        const chat = this.getChat();
        if (!chat || chat.length === 0) return;

        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.customTables) firstMsg.horae_meta.customTables = [];

        const localTables = firstMsg.horae_meta.customTables;
        const resolvedGlobal = this._getResolvedGlobalTables();

        for (const update of tableUpdates) {
            const updateName = (update.name || '').trim();
            let table = localTables.find(t => (t.name || '').trim() === updateName);
            let isGlobal = false;
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

            // 全局表格：将维度变更同步回 per-card overlay
            if (isGlobal) {
                const perCardData = firstMsg.horae_meta?.globalTableData;
                if (perCardData?.[updateName]) {
                    perCardData[updateName].rows = table.rows;
                    perCardData[updateName].cols = table.cols;
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

        // 需要在覆写 meta 时保留的全局/摘要相关字段
        const PRESERVE_KEYS = [
            'autoSummaries', 'customTables', 'globalTableData',
            'locationMemory', 'relationships', 'tableContributions'
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

            // 跳过已有元数据
            const hasEvents = message.horae_meta?.events?.length > 0 || message.horae_meta?.event?.summary;
            if (message.horae_meta && (
                message.horae_meta.timestamp?.story_date ||
                hasEvents ||
                Object.keys(message.horae_meta.costumes || {}).length > 0
            )) {
                skipped++;
                if (progressCallback) {
                    progressCallback(Math.round((i + 1) / chat.length * 100), i + 1, chat.length);
                }
                continue;
            }

            // 保留已有 meta 上的全局数据和事件标记
            const existing = message.horae_meta;
            const preserved = {};
            if (existing) {
                for (const key of PRESERVE_KEYS) {
                    if (existing[key] !== undefined) preserved[key] = existing[key];
                }
                // 保留事件上的摘要标记（_compressedBy / _summaryId）
                if (existing.events?.length > 0) preserved._existingEvents = existing.events;
            }

            const parsed = this.parseHoraeTag(message.mes);
            
            if (parsed) {
                const meta = this.mergeParsedToMeta(null, parsed);
                if (meta._tableUpdates) {
                    meta.tableContributions = meta._tableUpdates;
                    delete meta._tableUpdates;
                }
                // 恢复保留字段
                Object.assign(meta, preserved);
                delete meta._existingEvents;
                this.setMessageMeta(i, meta);
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
                        Object.assign(meta, preserved);
                        delete meta._existingEvents;
                        this.setMessageMeta(i, meta);
                        processed++;
                    }
                } catch (error) {
                    console.error(`[Horae] 分析消息 #${i} 失败:`, error);
                }
            } else {
                const meta = createEmptyMeta();
                Object.assign(meta, preserved);
                delete meta._existingEvents;
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
        const userName = this.context?.name1 || '主角';
        const charName = this.context?.name2 || '角色';
        
        if (this.settings?.customSystemPrompt) {
            const custom = this.settings.customSystemPrompt
                .replace(/\{\{user\}\}/gi, userName)
                .replace(/\{\{char\}\}/gi, charName);
            return custom + this.generateLocationMemoryPrompt() + this.generateCustomTablesPrompt() + this.generateRelationshipPrompt() + this.generateMoodPrompt() + this.generateRpgPrompt();
        }
        
        const sceneDescLine = this.settings?.sendLocationMemory ? '\nscene_desc:地点固定物理特征（见场景记忆规则，触发时才写）' : '';
        const relLine = this.settings?.sendRelationships ? '\nrel:角色A>角色B=关系类型|备注（见关系网络规则，触发时才写）' : '';
        const moodLine = this.settings?.sendMood ? '\nmood:角色名=情绪/心理状态（见情绪追踪规则，触发时才写）' : '';
        return `
【Horae记忆系统】（以下示例仅为示范，勿直接原句用于正文！）

═══ 核心原则：变化驱动 ═══
★★★ 在写<horae>标签前，先判断本回合哪些信息发生了实质变化 ★★★
  ① 场景基础（time/location/characters/costume）→ 每回合必填
  ② 其他所有字段 → 严格遵守各自的【触发条件】，无变化则完全不写该行
  ③ 已记录的NPC/物品若无新信息 → 禁止输出！重复输出无变化的数据=浪费token
  ④ 部分字段变化 → 使用增量更新，只写变化的部分
  ⑤ NPC首次出场 → npc:和affection:两行都必须写！

═══ 标签格式 ═══
每次回复末尾必须写入两个标签：
<horae>
time:日期 时间（必填）
location:地点（必填。多级地点用·分隔，如「酒馆·大厅」「皇宫·王座间」。同一地点每次必须使用完全一致的名称）
atmosphere:氛围${sceneDescLine}
characters:在场角色名,逗号分隔（必填）
costume:角色名=服装描述（必填，每人一行，禁止分号合并）
item/item!/item!!:见物品规则（触发时才写）
item-:物品名（物品消耗/丢失时删除。见物品规则，触发时才写）
affection:角色名=好感度（★NPC首次出场必填初始值！之后仅好感变化时更新）
npc:角色名|外貌=性格@关系~扩展字段（★NPC首次出场必填完整信息！之后仅变化时更新）
agenda:日期|内容（新待办触发时才写）
agenda-:内容关键词（待办已完成/失效时才写，系统自动移除匹配的待办）${relLine}${moodLine}
</horae>
<horaeevent>
event:重要程度|事件简述（30-50字，重要程度：一般/重要/关键，记录本条消息中的事件摘要，用于剧情追溯）
</horaeevent>

═══ 【物品】触发条件与规则 ═══
参照[物品清单]中的编号(#ID)，严格按以下条件决定是否输出。

【何时写】（满足任一条件才输出）
  ✦ 获得新物品 → item:/item!:/item!!:
  ✦ 已有物品的数量/归属/位置/性质发生改变 → item:（仅写变化部分）
  ✦ 物品消耗/丢失/用完 → item-:物品名
【何时不写】
  ✗ 物品无任何变化 → 禁止输出任何item行
  ✗ 物品仅被提及但无状态改变 → 不写

【格式】
  新获得：item:emoji物品名(数量)|描述=持有者@精确位置（可省略描述字段。除非该物品有特殊含意，如礼物、纪念品，则添加描述）
  新获得(重要)：item!:emoji物品名(数量)|描述=持有者@精确位置（重要物品，描述必填：外观+功能+来源）
  新获得(关键)：item!!:emoji物品名(数量)|描述=持有者@精确位置（关键道具，描述必须详细）
  已有物品变化：item:emoji物品名(新数量)=新持有者@新位置（仅更新变化的部分，不写|则保留原描述）
  消耗/丢失：item-:物品名

【字段级规则】
  · 描述：记录物品本质属性（外观/功能/来源），普通物品可省略，重要/关键物品首次必填
    ★ 外观特征（颜色、材质、大小等，便于后续一致性描写）
    ★ 功能/用途
    ★ 来源（谁给的/如何获得）
       - 示例（以下内容中若有示例仅为示范，勿直接原句用于正文！）：
         - 示例1：item!:🌹永生花束|深红色玫瑰永生花，黑色缎带束扎，C赠送给U的情人节礼物=U@U房间书桌上
         - 示例2：item!:🎫幸运十连抽券|闪着金光的纸质奖券，可在系统奖池进行一次十连抽的新手福利=U@空间戒指
         - 示例3：item!!:🏧位面货币自动兑换机|看起来像个小型的ATM机，能按即时汇率兑换各位面货币=U@酒馆吧台
  · 数量：单件不写(1)/(1个)/(1把)等，只有计量单位才写括号如(5斤)(1L)(1箱)
  · 位置：必须是精确固定地点
    ❌ 某某人身前地上、某某人脚边、某某人旁边、地板、桌子上
    ✅ 酒馆大厅地板、餐厅吧台上、家中厨房、背包里、U的房间桌子上
  · 禁止将固定家具和建筑设施计入物品
  · 临时借用≠归属转移


示例（麦酒生命周期）：
  获得：item:🍺陈酿麦酒(50L)|杂物间翻出的麦酒，口感酸涩=U@酒馆后厨食材柜
  量变：item:🍺陈酿麦酒(25L)=U@酒馆后厨食材柜
  用完：item-:陈酿麦酒

═══ 【NPC】触发条件与规则 ═══
格式：npc:名|外貌=性格@与${userName}的关系~性别:值~年龄:值~种族:值~职业:值
分隔符：| 分名字，= 分外貌与性格，@ 分关系，~ 分扩展字段(key:value)

【何时写】（满足任一条件才输出该NPC的npc:行）
  ✦ 首次出场 → 完整格式，全部字段+全部~扩展字段（性别/年龄/种族/职业），缺一不可
  ✦ 外貌永久变化（如受伤留疤、换了发型、穿戴改变）→ 只写外貌字段
  ✦ 性格发生转变（如经历重大事件后性格改变）→ 只写性格字段
  ✦ 与${userName}的关系定位改变（如从客人变成朋友）→ 只写关系字段
  ✦ 获得关于该NPC的新信息（之前不知道的身高/体重等）→ 追加到对应字段
  ✦ ~扩展字段本身发生变化（如职业变了）→ 只写变化的~扩展字段
【何时不写】
  ✗ NPC在场但无新信息 → 禁止写npc:行
  ✗ NPC暂时离场后回来，信息无变化 → 禁止重写
  ✗ 想用同义词/缩写重写已有描述 → 严禁！
    ❌ "肌肉发达/满身战斗伤痕"→"肌肉强壮/伤疤"（换词≠更新）
    ✅ "肌肉发达/满身战斗伤痕/重伤"→"肌肉发达/满身战斗伤痕"（伤愈，移除过时状态）

【增量更新示例】（以NPC沃尔为例）
  首次：npc:沃尔|银灰色披毛/绿眼睛/身高220cm/满身战斗伤痕=沉默寡言的重装佣兵@${userName}的第一个客人~性别:男~年龄:约35~种族:狼兽人~职业:佣兵
  只更新关系：npc:沃尔|=@${userName}的男朋友
  只追加外貌：npc:沃尔|银灰色披毛/绿眼睛/身高220cm/满身战斗伤痕/左臂绷带
  只更新性格：npc:沃尔|=不再沉默/偶尔微笑
  只改职业：npc:沃尔|~职业:退役佣兵
（注意：未变化的字段和~扩展字段完全不写！系统自动保留原有数据！）

【关系描述规范】
  必须包含对象名且准确：❌客人 ✅${userName}的新访客 / ❌债主 ✅持有${userName}欠条的人 / ❌房东 ✅${userName}的房东 / ❌男朋友 ✅${userName}的男朋友 / ❌恩人 ✅救了${userName}一命的人 / ❌霸凌者 ✅欺负${userName}的人 / ❌暗恋者 ✅暗恋${userName}的人 / ❌仇人 ✅被${userName}杀掉了生父
  附属关系需写出所属NPC名：✅伊凡的猎犬; ${userName}客人的宠物 / 伊凡的女朋友; ${userName}的客人 / ${userName}的闺蜜; 伊凡的妻子 / ${userName}的继父; 伊凡的父亲 / ${userName}的情夫; 伊凡的弟弟 / ${userName}的闺蜜; ${userName}的丈夫的情妇; 插足${userName}与伊凡夫妻关系的第三者

═══ 【好感度】触发条件 ═══
仅记录NPC对${userName}的好感度（禁止记录${userName}自己）。每人一行，禁止数值后加注解。

【何时写】
  ✦ NPC首次出场 → 按关系判定初始值（陌生0-20/熟人30-50/朋友50-70/恋人70-90）
  ✦ 互动导致好感度实质变化 → affection:名=新总值
【何时不写】
  ✗ 好感度无变化 → 不写

═══ 【待办事项】触发条件 ═══
【何时写（新增）】
  ✦ 剧情中出现新的约定/计划/行程/任务/伏笔 → agenda:日期|内容
  格式：agenda:订立日期|内容（相对时间须括号标注绝对日期）
  示例：agenda:2026/02/10|艾伦邀请${userName}情人节晚上约会(2026/02/14 18:00)
【何时写（完成删除）— 极重要！】
  ✦ 待办事项已完成/已失效/已取消 → 必须用 agenda-: 标记删除
  格式：agenda-:待办内容（写入已完成事项的内容关键词即可自动移除）
  示例：agenda-:艾伦邀请${userName}情人节晚上约会
  ⚠ 严禁用 agenda:内容(完成) 这种方式！必须用 agenda-: 前缀！
  ⚠ 严禁重复写入已存在的待办内容！
【何时不写】
  ✗ 已有待办无变化 → 禁止每回合重复已有待办
  ✗ 待办已完成 → 禁止用 agenda: 加括号标注完成，必须用 agenda-:

═══ 时间格式规则 ═══
禁止"Day 1"/"第X天"等模糊格式，必须使用具体日历日期。
- 现代：年/月/日 时:分（如 2026/2/4 15:00）
- 历史：该年代日期（如 1920/3/15 14:00）
- 奇幻/架空：该世界观日历（如 霜降月第三日 黄昏）
${this.generateLocationMemoryPrompt()}${this.generateCustomTablesPrompt()}${this.generateRelationshipPrompt()}${this.generateMoodPrompt()}${this.generateRpgPrompt()}${this._generateAntiParaphrasePrompt()}
═══ 最终强制提醒 ═══
${this._generateMustTagsReminder()}

【每回合必写字段——缺任何一项=不合格！】
  ✅ time: ← 当前日期时间
  ✅ location: ← 当前地点
  ✅ atmosphere: ← 氛围
  ✅ characters: ← 当前在场所有角色名，逗号分隔（绝对不能省略！）
  ✅ costume: ← 每个在场角色各一行服装描述
  ✅ event: ← 重要程度|事件摘要

【NPC首次登场时额外必写——缺一不可！】
  ✅ npc:名|外貌=性格@关系~性别:值~年龄:值~种族:值~职业:值
  ✅ affection:该NPC名=初始好感度（陌生0-20/熟人30-50/朋友50-70/恋人70-90）

以上字段不存在"可写可不写"的情况——它们是强制性的。
`;
    }

    getDefaultSystemPrompt() {
        const sceneDescLine = this.settings?.sendLocationMemory ? '\nscene_desc:地点固定物理特征（见场景记忆规则，触发时才写）' : '';
        const relLine = this.settings?.sendRelationships ? '\nrel:角色A>角色B=关系类型|备注（见关系网络规则，触发时才写）' : '';
        const moodLine = this.settings?.sendMood ? '\nmood:角色名=情绪/心理状态（见情绪追踪规则，触发时才写）' : '';
        return `【Horae记忆系统】（以下示例仅为示范，勿直接原句用于正文！）

═══ 核心原则：变化驱动 ═══
★★★ 在写<horae>标签前，先判断本回合哪些信息发生了实质变化 ★★★
  ① 场景基础（time/location/characters/costume）→ 每回合必填
  ② 其他所有字段 → 严格遵守各自的【触发条件】，无变化则完全不写该行
  ③ 已记录的NPC/物品若无新信息 → 禁止输出！重复输出无变化的数据=浪费token
  ④ 部分字段变化 → 使用增量更新，只写变化的部分
  ⑤ NPC首次出场 → npc:和affection:两行都必须写！

═══ 标签格式 ═══
每次回复末尾必须写入两个标签：
<horae>
time:日期 时间（必填）
location:地点（必填。多级地点用·分隔，如「酒馆·大厅」「皇宫·王座间」。同一地点每次必须使用完全一致的名称）
atmosphere:氛围${sceneDescLine}
characters:在场角色名,逗号分隔（必填）
costume:角色名=服装描述（必填，每人一行，禁止分号合并）
item/item!/item!!:见物品规则（触发时才写）
item-:物品名（物品消耗/丢失时删除。见物品规则，触发时才写）
affection:角色名=好感度（★NPC首次出场必填初始值！之后仅好感变化时更新）
npc:角色名|外貌=性格@关系~扩展字段（★NPC首次出场必填完整信息！之后仅变化时更新）
agenda:日期|内容（新待办触发时才写）
agenda-:内容关键词（待办已完成/失效时才写，系统自动移除匹配的待办）${relLine}${moodLine}
</horae>
<horaeevent>
event:重要程度|事件简述（30-50字，重要程度：一般/重要/关键，记录本条消息中的事件摘要，用于剧情追溯）
</horaeevent>

═══ 【物品】触发条件与规则 ═══
参照[物品清单]中的编号(#ID)，严格按以下条件决定是否输出。

【何时写】（满足任一条件才输出）
  ✦ 获得新物品 → item:/item!:/item!!:
  ✦ 已有物品的数量/归属/位置/性质发生改变 → item:（仅写变化部分）
  ✦ 物品消耗/丢失/用完 → item-:物品名
【何时不写】
  ✗ 物品无任何变化 → 禁止输出任何item行
  ✗ 物品仅被提及但无状态改变 → 不写

【格式】
  新获得：item:emoji物品名(数量)|描述=持有者@精确位置（可省略描述字段。除非该物品有特殊含意，如礼物、纪念品，则添加描述）
  新获得(重要)：item!:emoji物品名(数量)|描述=持有者@精确位置（重要物品，描述必填：外观+功能+来源）
  新获得(关键)：item!!:emoji物品名(数量)|描述=持有者@精确位置（关键道具，描述必须详细）
  已有物品变化：item:emoji物品名(新数量)=新持有者@新位置（仅更新变化的部分，不写|则保留原描述）
  消耗/丢失：item-:物品名

【字段级规则】
  · 描述：记录物品本质属性（外观/功能/来源），普通物品可省略，重要/关键物品首次必填
    ★ 外观特征（颜色、材质、大小等，便于后续一致性描写）
    ★ 功能/用途
    ★ 来源（谁给的/如何获得）
       - 示例（以下内容中若有示例仅为示范，勿直接原句用于正文！）：
         - 示例1：item!:🌹永生花束|深红色玫瑰永生花，黑色缎带束扎，C赠送给U的情人节礼物=U@U房间书桌上
         - 示例2：item!:🎫幸运十连抽券|闪着金光的纸质奖券，可在系统奖池进行一次十连抽的新手福利=U@空间戒指
         - 示例3：item!!:🏧位面货币自动兑换机|看起来像个小型的ATM机，能按即时汇率兑换各位面货币=U@酒馆吧台
  · 数量：单件不写(1)/(1个)/(1把)等，只有计量单位才写括号如(5斤)(1L)(1箱)
  · 位置：必须是精确固定地点
    ❌ 某某人身前地上、某某人脚边、某某人旁边、地板、桌子上
    ✅ 酒馆大厅地板、餐厅吧台上、家中厨房、背包里、U的房间桌子上
  · 禁止将固定家具和建筑设施计入物品
  · 临时借用≠归属转移


示例（麦酒生命周期）：
  获得：item:🍺陈酿麦酒(50L)|杂物间翻出的麦酒，口感酸涩=U@酒馆后厨食材柜
  量变：item:🍺陈酿麦酒(25L)=U@酒馆后厨食材柜
  用完：item-:陈酿麦酒

═══ 【NPC】触发条件与规则 ═══
格式：npc:名|外貌=性格@与{{user}}的关系~性别:值~年龄:值~种族:值~职业:值
分隔符：| 分名字，= 分外貌与性格，@ 分关系，~ 分扩展字段(key:value)

【何时写】（满足任一条件才输出该NPC的npc:行）
  ✦ 首次出场 → 完整格式，全部字段+全部~扩展字段（性别/年龄/种族/职业），缺一不可
  ✦ 外貌永久变化（如受伤留疤、换了发型、穿戴改变）→ 只写外貌字段
  ✦ 性格发生转变（如经历重大事件后性格改变）→ 只写性格字段
  ✦ 与{{user}}的关系定位改变（如从客人变成朋友）→ 只写关系字段
  ✦ 获得关于该NPC的新信息（之前不知道的身高/体重等）→ 追加到对应字段
  ✦ ~扩展字段本身发生变化（如职业变了）→ 只写变化的~扩展字段
【何时不写】
  ✗ NPC在场但无新信息 → 禁止写npc:行
  ✗ NPC暂时离场后回来，信息无变化 → 禁止重写
  ✗ 想用同义词/缩写重写已有描述 → 严禁！
    ❌ "肌肉发达/满身战斗伤痕"→"肌肉强壮/伤疤"（换词≠更新）
    ✅ "肌肉发达/满身战斗伤痕/重伤"→"肌肉发达/满身战斗伤痕"（伤愈，移除过时状态）

【增量更新示例】（以NPC沃尔为例）
  首次：npc:沃尔|银灰色披毛/绿眼睛/身高220cm/满身战斗伤痕=沉默寡言的重装佣兵@{{user}}的第一个客人~性别:男~年龄:约35~种族:狼兽人~职业:佣兵
  只更新关系：npc:沃尔|=@{{user}}的男朋友
  只追加外貌：npc:沃尔|银灰色披毛/绿眼睛/身高220cm/满身战斗伤痕/左臂绷带
  只更新性格：npc:沃尔|=不再沉默/偶尔微笑
  只改职业：npc:沃尔|~职业:退役佣兵
（注意：未变化的字段和~扩展字段完全不写！系统自动保留原有数据！）

【关系描述规范】
  必须包含对象名且准确：❌客人 ✅{{user}}的新访客 / ❌债主 ✅持有{{user}}欠条的人 / ❌房东 ✅{{user}}的房东 / ❌男朋友 ✅{{user}}的男朋友 / ❌恩人 ✅救了{{user}}一命的人 / ❌霸凌者 ✅欺负{{user}}的人 / ❌暗恋者 ✅暗恋{{user}}的人 / ❌仇人 ✅被{{user}}杀掉了生父
  附属关系需写出所属NPC名：✅伊凡的猎犬; {{user}}客人的宠物 / 伊凡的女朋友; {{user}}的客人 / {{user}}的闺蜜; 伊凡的妻子 / {{user}}的继父; 伊凡的父亲 / {{user}}的情夫; 伊凡的弟弟 / {{user}}的闺蜜; {{user}}的丈夫的情妇; 插足{{user}}与伊凡夫妻关系的第三者

═══ 【好感度】触发条件 ═══
仅记录NPC对{{user}}的好感度（禁止记录{{user}}自己）。每人一行，禁止数值后加注解。

【何时写】
  ✦ NPC首次出场 → 按关系判定初始值（陌生0-20/熟人30-50/朋友50-70/恋人70-90）
  ✦ 互动导致好感度实质变化 → affection:名=新总值
【何时不写】
  ✗ 好感度无变化 → 不写

═══ 【待办事项】触发条件 ═══
【何时写（新增）】
  ✦ 剧情中出现新的约定/计划/行程/任务/伏笔 → agenda:日期|内容
  格式：agenda:订立日期|内容（相对时间须括号标注绝对日期）
  示例：agenda:2026/02/10|艾伦邀请{{user}}情人节晚上约会(2026/02/14 18:00)
【何时写（完成删除）— 极重要！】
  ✦ 待办事项已完成/已失效/已取消 → 必须用 agenda-: 标记删除
  格式：agenda-:待办内容（写入已完成事项的内容关键词即可自动移除）
  示例：agenda-:艾伦邀请{{user}}情人节晚上约会
  ⚠ 严禁用 agenda:内容(完成) 这种方式！必须用 agenda-: 前缀！
  ⚠ 严禁重复写入已存在的待办内容！
【何时不写】
  ✗ 已有待办无变化 → 禁止每回合重复已有待办
  ✗ 待办已完成 → 禁止用 agenda: 加括号标注完成，必须用 agenda-:

═══ 时间格式规则 ═══
禁止"Day 1"/"第X天"等模糊格式，必须使用具体日历日期。
- 现代：年/月/日 时:分（如 2026/2/4 15:00）
- 历史：该年代日期（如 1920/3/15 14:00）
- 奇幻/架空：该世界观日历（如 霜降月第三日 黄昏）

═══ 最终强制提醒 ═══
你的回复末尾必须包含 <horae>...</horae> 和 <horaeevent>...</horaeevent> 两个标签。
缺少任何一个标签=不合格。

【每回合必写字段——缺任何一项=不合格！】
  ✅ time: ← 当前日期时间
  ✅ location: ← 当前地点
  ✅ atmosphere: ← 氛围
  ✅ characters: ← 当前在场所有角色名，逗号分隔（绝对不能省略！）
  ✅ costume: ← 每个在场角色各一行服装描述
  ✅ event: ← 重要程度|事件摘要

【NPC首次登场时额外必写——缺一不可！】
  ✅ npc:名|外貌=性格@关系~性别:值~年龄:值~种族:值~职业:值
  ✅ affection:该NPC名=初始好感度（陌生0-20/熟人30-50/朋友50-70/恋人70-90）

以上字段不存在"可写可不写"的情况——它们是强制性的。`;
    }

    getDefaultTablesPrompt() {
        return `═══ 自定义表格规则 ═══
上方有用户自定义表格，根据"填写要求"填写数据。
★ 格式：<horaetable:表格名> 标签内，每行一个单元格 → 行,列:内容
★★ 坐标说明：第0行和第0列是表头，数据从1,1开始。行号=数据行序号，列号=数据列序号
★★★ 填写原则 ★★★
  - 空单元格且剧情中已有对应信息 → 必须填写！不要遗漏！
  - 已有内容且无变化 → 不重复写
  - 该行/列确实无对应剧情信息 → 留空
  - 禁止输出"(空)""-""无"等占位符
  - 🔒标记的行/列为只读数据，禁止修改其内容
  - 新增行请在现有最大行号之后追加，新增列请在现有最大列号之后追加`;
    }

    getDefaultLocationPrompt() {
        return `═══ 【场景记忆】触发条件 ═══
格式：scene_desc:位于…。该地点的固定物理特征描述（50-150字）
场景记忆记录地点的核心布局和永久性特征（建筑结构、固定家具、空间特点），用于保持跨回合的场景描写一致性。

【地点／位于 格式】★★★ 严格遵守层级规则 ★★★
  · 描述开头先写「位于」标明该地点相对于直接上级的方位，再写该地点自身的物理特征
  · 子级地点（含·分隔符的地名）：「位于」只写相对于父级建筑内部的方位（如哪一楼、哪个方向），绝对禁止包含父级的外部地理位置
  · 父级/顶级地点：「位于」才写外部地理位置（如哪个大陆、哪片森林旁）
  · 系统会自动同时发送父级描述给AI，子级无需也不应重复父级信息
    ✓ 无名酒馆·客房203 → scene_desc:位于2楼东侧。边间，采光佳，单人木床靠墙，窗户朝东
    ✓ 无名酒馆·大厅 → scene_desc:位于1楼。挑高木质空间，正中是长吧台，散落数张圆桌
    ✓ 无名酒馆 → scene_desc:位于OO大陆北方XX森林边上。两层木石结构，一楼大厅和吧台，二楼客房区
    ✗ 无名酒馆·客房203 → scene_desc:位于OO大陆北方XX森林边上的无名酒馆2楼…（❌ 子级禁止写父级的外部地理信息）
    ✗ 无名酒馆·大厅 → scene_desc:位于森林边上的无名酒馆1楼…（❌ 同上）
【地名规范】
  · 多级地点用·分隔：建筑·区域（如「无名酒馆·大厅」「皇宫·地牢」）
  · 同一地点必须始终使用与上方[场景|...]中完全一致的名称，禁止缩写或改写
  · 不同建筑的同名区域各自独立记录（如「无名酒馆·大厅」和「皇宫·大厅」是不同地点）
【何时写】
  ✦ 首次到达一个新地点 → 必须写scene_desc，描述该地点的固定物理特征
  ✦ 地点发生永久性物理变化（如被破坏、重新装修）→ 写更新后的scene_desc
【何时不写】
  ✗ 回到已记录的旧地点且无物理变化 → 不写
  ✗ 季节/天气/氛围变化 → 不写（这些是临时变化，不属于固定特征）
【描述规范】
  · 只写固定/永久性的物理特征：空间结构、建筑材质、固定家具、窗户朝向、标志性装饰
  · 不写临时性状态：当前光照、天气、人群、季节装饰、临时摆放的物品
  · 禁止照搬场景记忆原文到正文，将其作为背景参考，以当前时间/天气/光线/角色视角重新描写
  · 上方[场景记忆|...]是系统已记录的该地点特征，描写该场景时保持这些核心要素不变，同时根据时间/季节/剧情自由发挥变化细节`;
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
        const resolvedGlobal = this._getResolvedGlobalTables();
        const allTables = [...resolvedGlobal, ...localTables];
        if (allTables.length === 0) return '';

        let prompt = '\n' + (this.settings?.customTablesPrompt || this.getDefaultTablesPrompt());

        // 为每个表格生成带坐标的示例
        for (const table of allTables) {
            const tableName = table.name || '自定义表格';
            const rows = table.rows || 2;
            const cols = table.cols || 2;
            prompt += `\n★ 表格「${tableName}」尺寸：${rows - 1}行×${cols - 1}列（数据区行号1-${rows - 1}，列号1-${cols - 1}）`;
            prompt += `\n示例（填写空单元格或更新有变化的单元格）：
<horaetable:${tableName}>
1,1:内容A
1,2:内容B
2,1:内容C
</horaetable>`;
            break;
        }

        return prompt;
    }

    getDefaultRelationshipPrompt() {
        const userName = this.context?.name1 || '{{user}}';
        return `═══ 【关系网络】触发条件 ═══
格式：rel:角色A>角色B=关系类型|备注
系统会自动记录和显示角色间的关系网络，当角色间关系发生变化时输出。

【何时写】（满足任一条件才输出）
  ✦ 两个角色之间确立/定义了新关系 → rel:角色A>角色B=关系类型
  ✦ 已有关系发生变化（如从同事变成朋友）→ rel:角色A>角色B=新关系类型
  ✦ 关系中有重要细节需要备注 → 加|备注
【何时不写】
  ✗ 关系无变化 → 不写
  ✗ 已记录过的关系且无更新 → 不写

【规范】
  · 角色A和角色B都必须使用准确全名
  · 关系类型用简洁词描述：朋友、恋人、上下级、师徒、宿敌、合作伙伴等
  · 备注字段可选，记录关系的特殊细节
  · 包含${userName}的关系也要记录
  示例：
    rel:${userName}>沃尔=雇佣关系|${userName}经营酒馆，沃尔是常客
    rel:沃尔>艾拉=暗恋|沃尔对艾拉有好感但未表白
    rel:${userName}>艾拉=闺蜜`;
    }

    getDefaultMoodPrompt() {
        return `═══ 【情绪/心理状态追踪】触发条件 ═══
格式：mood:角色名=情绪状态（简洁词组，如"紧张/不安"、"开心/期待"、"愤怒"、"平静但警惕"）
系统会追踪在场角色的情绪变化，帮助保持角色心理状态的连贯性。

【何时写】（满足任一条件才输出）
  ✦ 角色情绪发生明显变化（如从平静变为愤怒）→ mood:角色名=新情绪
  ✦ 角色首次出场时有明显的情绪特征 → mood:角色名=当前情绪
【何时不写】
  ✗ 角色情绪无变化 → 不写
  ✗ 角色不在场 → 不写
【规范】
  · 情绪描述用1-4个词，用/分隔复合情绪
  · 只记录在场角色的情绪`;
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
        const userName = this.context?.name1 || '主角';
        return `
═══ 反转述模式（Anti-Paraphrase） ═══
当前用户使用反转述写法：${userName}的行动/对话由${userName}自行在USER消息中描写，你（AI）不再重复描述${userName}的部分。
因此，你在撰写本回合的<horae>标签时，必须把"紧接在你这条回复之前的那条USER消息"中发生的情节也一并纳入结算：
  ✦ USER消息中出现的物品获取/消耗 → 写入对应item:/item-:行
  ✦ USER消息中出现的场景转移 → 更新location:
  ✦ USER消息中出现的NPC互动/好感变化 → 更新affection:
  ✦ USER消息中出现的情节推进 → 在<horaeevent>中一并概括
  ✦ 总之：本条<horae>应同时覆盖"上一条USER消息"和"你本条AI回复"两部分的所有变化
`;
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
        // 自定义提示词优先
        if (this.settings.customRpgPrompt) {
            return '\n' + this.settings.customRpgPrompt
                .replace(/\{\{user\}\}/gi, this.context?.name1 || '主角')
                .replace(/\{\{char\}\}/gi, this.context?.name2 || 'AI');
        }
        return '\n' + this.getDefaultRpgPrompt();
    }

    /** RPG 默认提示词 */
    getDefaultRpgPrompt() {
        const sendBars = this.settings?.sendRpgBars !== false;
        const sendSkills = this.settings?.sendRpgSkills !== false;
        const sendAttrs = this.settings?.sendRpgAttributes !== false;
        if (!sendBars && !sendSkills && !sendAttrs) return '';
        const userName = this.context?.name1 || '主角';
        const barCfg = this.settings?.rpgBarConfig || [
            { key: 'hp', name: 'HP' }, { key: 'mp', name: 'MP' }, { key: 'sp', name: 'SP' }
        ];
        const attrCfg = this.settings?.rpgAttributeConfig || [];
        let p = `═══ 【RPG】 ═══\n你的回复末尾必须包含<horaerpg>标签。归属格式同NPC编号：N编号 全名，${userName}直接写名字不加N。\n`;
        if (sendBars) {
            p += `\n【属性条——每回合必写，缺少=不合格！】\n`;
            p += `必须为 characters: 中每个在场角色输出全部属性条和状态：\n`;
            for (const bar of barCfg) {
                if (bar.key === 'hp') {
                    p += `  ✅ hp:归属=当前/最大\n`;
                } else {
                    p += `  ✅ ${bar.key}:归属=当前/最大(${bar.name})  ← 首次必须标注显示名\n`;
                }
            }
            p += `  ✅ status:归属=效果1/效果2  ← 无异常写 =正常\n`;
            p += `规则：\n`;
            p += `  - 战斗/受伤/施法/消耗 → 合理扣减；恢复/休息 → 合理回增\n`;
            p += `  - 每个在场角色的每个属性条都必须写，漏写任何一人=不合格\n`;
            p += `  - 即使本回合数值无变化，也必须写出当前值\n`;
        }
        if (sendAttrs && attrCfg.length > 0) {
            p += `\n【多维属性】仅首次登场或属性变化时写，无变化可省略\n`;
            p += `  attr:归属|${attrCfg.map(a => `${a.key}=数值`).join('|')}\n`;
            p += `  数值范围0-100。属性含义：${attrCfg.map(a => `${a.key}(${a.name})`).join('、')}\n`;
        }
        if (sendSkills) {
            p += `\n【技能】仅习得/升级/失去时写，无变化可省略\n`;
            p += `  skill:归属|技能名|等级|效果描述\n`;
            p += `  skill-:归属|技能名\n`;
        }
        return p;
    }

    /** 动态生成必须包含的标签提醒（RPG 开启时追加 <horaerpg>） */
    _generateMustTagsReminder() {
        const tags = ['<horae>...</horae>', '<horaeevent>...</horaeevent>'];
        const rpgActive = this.settings?.rpgMode &&
            (this.settings.sendRpgBars !== false || this.settings.sendRpgSkills !== false || this.settings.sendRpgAttributes !== false);
        if (rpgActive) tags.push('<horaerpg>...</horaerpg>');
        const count = tags.length === 2 ? '两个' : `${tags.length}个`;
        return `你的回复末尾必须包含 ${tags.join(' 和 ')} ${count}标签。\n缺少任何一个标签=不合格。`;
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
                if (levelRaw === '关键' || levelRaw.toLowerCase() === 'critical') {
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
        const tableMatches = [...message.matchAll(/<horaetable[:：]\s*(.+?)>([\s\S]*?)<\/horaetable>/gi)];
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
