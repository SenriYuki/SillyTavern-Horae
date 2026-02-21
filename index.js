/**
 * Horae - 时光记忆插件 
 * 基于时间锚点的AI记忆增强系统
 * 
 * 作者: SenriYuki
 * 版本: 1.5.1
 */

import { renderExtensionTemplateAsync, getContext, extension_settings } from '/scripts/extensions.js';
import { getSlideToggleOptions, saveSettingsDebounced, eventSource, event_types } from '/script.js';
import { slideToggle } from '/lib.js';

import { horaeManager, createEmptyMeta } from './core/horaeManager.js';
import { calculateRelativeTime, calculateDetailedRelativeTime, formatRelativeTime, generateTimeReference, getCurrentSystemTime, formatStoryDate, formatFullDateTime, parseStoryDate } from './utils/timeUtils.js';

// ============================================
// 常量定义
// ============================================
const EXTENSION_NAME = 'horae';
const EXTENSION_FOLDER = `third-party/SillyTavern-Horae`;
const TEMPLATE_PATH = `${EXTENSION_FOLDER}/assets/templates`;
const VERSION = '1.5.1';

// 配套正则规则（自动注入ST原生正则系统）
const HORAE_REGEX_RULES = [
    {
        id: 'horae_hide',
        scriptName: 'Horae - 隐藏状态标签',
        description: '隐藏<horae>状态标签，不显示在正文，不发送给AI',
        findRegex: '/(?:<horae>[\\s\\S]*?<\\/horae>|<!--horae[\\s\\S]*?-->|(?:^|\\n)(?:time|location|atmosphere|characters|costume|item-?!{0,2}|affection|npc|agenda-?|rel|mood|scene_desc):[^\\n]+(?:\\n(?:time|location|atmosphere|characters|costume|item-?!{0,2}|affection|npc|agenda-?|rel|mood|scene_desc):[^\\n]+)*)/gim',
        replaceString: '',
        trimStrings: [],
        placement: [2],
        disabled: false,
        markdownOnly: true,
        promptOnly: true,
        runOnEdit: true,
        substituteRegex: 0,
        minDepth: null,
        maxDepth: null,
    },
    {
        id: 'horae_event_display_only',
        scriptName: 'Horae - 隐藏事件标签',
        description: '隐藏<horaeevent>事件标签的显示，不发送给AI',
        findRegex: '/<horaeevent>[\\s\\S]*?<\\/horaeevent>/gim',
        replaceString: '',
        trimStrings: [],
        placement: [2],
        disabled: false,
        markdownOnly: true,
        promptOnly: true,
        runOnEdit: true,
        substituteRegex: 0,
        minDepth: null,
        maxDepth: null,
    },
    {
        id: 'horae_table_hide',
        scriptName: 'Horae - 隐藏表格标签',
        description: '隐藏<horaetable>标签，不显示在正文，不发送给AI',
        findRegex: '/<horaetable[:\\uff1a][\\s\\S]*?<\\/horaetable>/gim',
        replaceString: '',
        trimStrings: [],
        placement: [2],
        disabled: false,
        markdownOnly: true,
        promptOnly: true,
        runOnEdit: true,
        substituteRegex: 0,
        minDepth: null,
        maxDepth: null,
    },
];

// ============================================
// 默认设置
// ============================================
const DEFAULT_SETTINGS = {
    enabled: true,
    autoParse: true,
    injectContext: true,
    showMessagePanel: true,
    contextDepth: 15,
    injectionPosition: 1,
    lastStoryDate: '',
    lastStoryTime: '',
    favoriteNpcs: [],  // 用户标记的星标NPC列表
    pinnedNpcs: [],    // 用户手动标记的重要角色列表（特殊边框）
    // 发送给AI的内容控制
    sendTimeline: true,    // 发送剧情轨迹（关闭则无法计算相对时间）
    sendCharacters: true,  // 发送角色信息（服装、好感度）
    sendItems: true,       // 发送物品栏
    customTables: [],      // 自定义表格 [{id, name, rows, cols, data, prompt}]
    customSystemPrompt: '',      // 自定义系统注入提示词（空=使用默认）
    customBatchPrompt: '',       // 自定义AI摘要提示词（空=使用默认）
    customAnalysisPrompt: '',    // 自定义AI分析提示词（空=使用默认）
    customCompressPrompt: '',    // 自定义剧情压缩提示词（空=使用默认）
    aiScanIncludeNpc: false,     // AI摘要是否提取NPC
    aiScanIncludeAffection: false, // AI摘要是否提取好感度
    aiScanIncludeScene: false,    // AI摘要是否提取场景记忆
    aiScanIncludeRelationship: false, // AI摘要是否提取关系网络
    panelWidth: 100,               // 消息面板宽度百分比（50-100）
    themeMode: 'dark',             // 插件主题：dark / light / custom-{index}
    customCSS: '',                 // 用户自定义CSS
    customThemes: [],              // 导入的美化主题 [{name, author, variables, css}]
    globalTables: [],              // 全局表格（跨角色卡共享）
    showTopIcon: true,             // 显示顶部导航栏图标
    customTablesPrompt: '',        // 自定义表格填写规则提示词（空=使用默认）
    sendLocationMemory: false,     // 发送场景记忆（地点固定特征描述）
    customLocationPrompt: '',      // 自定义场景记忆提示词（空=使用默认）
    sendRelationships: false,      // 发送关系网络
    sendMood: false,               // 发送情绪/心理状态追踪
    customRelationshipPrompt: '',  // 自定义关系网络提示词（空=使用默认）
    customMoodPrompt: '',          // 自定义情绪追踪提示词（空=使用默认）
    // 自动摘要
    autoSummaryEnabled: false,      // 自动摘要开关
    autoSummaryKeepRecent: 10,      // 保留最近N条消息不压缩
    autoSummaryBufferMode: 'messages', // 'messages' | 'tokens'
    autoSummaryBufferLimit: 20,     // 缓冲阈值（楼层数或Token数）
    autoSummaryUseCustomApi: false, // 是否使用独立API端点
    autoSummaryApiUrl: '',          // 独立API端点地址（OpenAI兼容）
    autoSummaryApiKey: '',          // 独立API密钥
    autoSummaryModel: '',           // 独立API模型名称
};

// ============================================
// 全局变量
// ============================================
let settings = { ...DEFAULT_SETTINGS };
let doNavbarIconClick = null;
let isInitialized = false;
let _isSummaryGeneration = false;
let _summaryInProgress = false;
let itemsMultiSelectMode = false;  // 物品多选模式
let selectedItems = new Set();     // 选中的物品名称
let longPressTimer = null;         // 长按计时器
let agendaMultiSelectMode = false; // 待办多选模式
let selectedAgendaIndices = new Set(); // 选中的待办索引
let agendaLongPressTimer = null;   // 待办长按计时器
let timelineMultiSelectMode = false; // 时间线多选模式
let selectedTimelineEvents = new Set(); // 选中的事件（"msgIndex-eventIndex"格式）
let timelineLongPressTimer = null;  // 时间线长按计时器

// ============================================
// 工具函数
// ============================================


/** 自动注入配套正则到ST原生正则系统（始终置于末尾，避免与其他正则冲突） */
function ensureRegexRules() {
    if (!extension_settings.regex) extension_settings.regex = [];

    let changed = 0;
    for (const rule of HORAE_REGEX_RULES) {
        const idx = extension_settings.regex.findIndex(r => r.id === rule.id);
        if (idx !== -1) {
            // 保留用户的 disabled 状态，移除旧位置
            const userDisabled = extension_settings.regex[idx].disabled;
            extension_settings.regex.splice(idx, 1);
            extension_settings.regex.push({ ...rule, disabled: userDisabled });
            changed++;
        } else {
            extension_settings.regex.push({ ...rule });
            changed++;
        }
    }

    if (changed > 0) {
        saveSettingsDebounced();
        console.log(`[Horae] 配套正则已同步至列表末尾（共 ${HORAE_REGEX_RULES.length} 条）`);
    }
}

/** 获取HTML模板 */
async function getTemplate(name) {
    return await renderExtensionTemplateAsync(TEMPLATE_PATH, name);
}

/**
 * 检查是否为新版导航栏
 */
function isNewNavbarVersion() {
    return typeof doNavbarIconClick === 'function';
}

/**
 * 初始化导航栏点击函数
 */
async function initNavbarFunction() {
    try {
        const scriptModule = await import('/script.js');
        if (scriptModule.doNavbarIconClick) {
            doNavbarIconClick = scriptModule.doNavbarIconClick;
        }
    } catch (error) {
        console.warn(`[Horae] doNavbarIconClick 不可用，使用旧版抽屉模式`);
    }
}

/**
 * 加载设置
 */
function loadSettings() {
    if (extension_settings[EXTENSION_NAME]) {
        settings = { ...DEFAULT_SETTINGS, ...extension_settings[EXTENSION_NAME] };
    } else {
        extension_settings[EXTENSION_NAME] = { ...DEFAULT_SETTINGS };
    }
}

/**
 * 保存设置
 */
function saveSettings() {
    extension_settings[EXTENSION_NAME] = settings;
    saveSettingsDebounced();
}

/**
 * 显示 Toast 消息
 */
function showToast(message, type = 'info') {
    if (window.toastr) {
        toastr[type](message, 'Horae');
    } else {
        console.log(`[Horae] ${type}: ${message}`);
    }
}

/** 获取当前对话的自定义表格 */
function getChatTables() {
    const context = getContext();
    if (!context?.chat?.length) return [];
    
    const firstMessage = context.chat[0];
    if (firstMessage?.horae_meta?.customTables) {
        return firstMessage.horae_meta.customTables;
    }
    
    // 兼容旧版：检查chat数组属性
    if (context.chat.horae_tables) {
        return context.chat.horae_tables;
    }
    
    return [];
}

/** 设置当前对话的自定义表格 */
function setChatTables(tables) {
    const context = getContext();
    if (!context?.chat?.length) return;
    
    if (!context.chat[0].horae_meta) {
        context.chat[0].horae_meta = createEmptyMeta();
    }
    
    // 快照 baseData 用于回退
    for (const table of tables) {
        table.baseData = JSON.parse(JSON.stringify(table.data || {}));
        table.baseRows = table.rows || 2;
        table.baseCols = table.cols || 2;
    }
    
    context.chat[0].horae_meta.customTables = tables;
    getContext().saveChat();
}

/** 获取全局表格列表（返回结构+当前卡片数据的合并结果） */
function getGlobalTables() {
    const templates = settings.globalTables || [];
    const chat = horaeManager.getChat();
    if (!chat?.[0]) return templates.map(t => ({ ...t }));

    const firstMsg = chat[0];
    if (!firstMsg.horae_meta) return templates.map(t => ({ ...t }));
    if (!firstMsg.horae_meta.globalTableData) firstMsg.horae_meta.globalTableData = {};
    const perCardData = firstMsg.horae_meta.globalTableData;

    return templates.map(template => {
        const name = (template.name || '').trim();
        const overlay = perCardData[name];
        if (overlay) {
            return {
                id: template.id,
                name: template.name,
                prompt: template.prompt,
                lockedRows: template.lockedRows || [],
                lockedCols: template.lockedCols || [],
                lockedCells: template.lockedCells || [],
                data: overlay.data || {},
                rows: overlay.rows ?? template.rows,
                cols: overlay.cols ?? template.cols,
                baseData: overlay.baseData,
                baseRows: overlay.baseRows ?? template.baseRows,
                baseCols: overlay.baseCols ?? template.baseCols,
            };
        }
        // 无 per-card 数据：只返回表头
        const headerData = {};
        for (const key of Object.keys(template.data || {})) {
            const [r, c] = key.split('-').map(Number);
            if (r === 0 || c === 0) headerData[key] = template.data[key];
        }
        return {
            ...template,
            data: headerData,
            baseData: {},
            baseRows: template.baseRows ?? template.rows ?? 2,
            baseCols: template.baseCols ?? template.cols ?? 2,
        };
    });
}

/** 保存全局表格列表（结构存设置，数据存当前卡片） */
function setGlobalTables(tables) {
    const chat = horaeManager.getChat();

    // 保存 per-card 数据到当前卡片
    if (chat?.[0]) {
        if (!chat[0].horae_meta) return;
        if (!chat[0].horae_meta.globalTableData) chat[0].horae_meta.globalTableData = {};
        const perCardData = chat[0].horae_meta.globalTableData;

        // 清除已被删除的表格的 per-card 数据
        const currentNames = new Set(tables.map(t => (t.name || '').trim()).filter(Boolean));
        for (const key of Object.keys(perCardData)) {
            if (!currentNames.has(key)) delete perCardData[key];
        }

        for (const table of tables) {
            const name = (table.name || '').trim();
            if (!name) continue;
            perCardData[name] = {
                data: JSON.parse(JSON.stringify(table.data || {})),
                rows: table.rows || 2,
                cols: table.cols || 2,
                baseData: JSON.parse(JSON.stringify(table.data || {})),
                baseRows: table.rows || 2,
                baseCols: table.cols || 2,
            };
        }
    }

    // 只保存结构（表头）到全局设置
    settings.globalTables = tables.map(table => {
        const headerData = {};
        for (const key of Object.keys(table.data || {})) {
            const [r, c] = key.split('-').map(Number);
            if (r === 0 || c === 0) headerData[key] = table.data[key];
        }
        return {
            id: table.id,
            name: table.name,
            rows: table.rows || 2,
            cols: table.cols || 2,
            data: headerData,
            prompt: table.prompt || '',
            lockedRows: table.lockedRows || [],
            lockedCols: table.lockedCols || [],
            lockedCells: table.lockedCells || [],
        };
    });
    saveSettings();
}

/** 获取指定scope的表格 */
function getTablesByScope(scope) {
    return scope === 'global' ? getGlobalTables() : getChatTables();
}

/** 保存指定scope的表格 */
function setTablesByScope(scope, tables) {
    if (scope === 'global') {
        setGlobalTables(tables);
    } else {
        setChatTables(tables);
    }
}

/** 获取合并后的所有表格（用于提示词注入） */
function getAllTables() {
    return [...getGlobalTables(), ...getChatTables()];
}

// ============================================
// 待办事项（Agenda）存储 — 跟随当前对话
// ============================================

/**
 * 获取用户手动创建的待办事项（存储在 chat[0]）
 */
function getUserAgenda() {
    const context = getContext();
    if (!context?.chat?.length) return [];
    
    const firstMessage = context.chat[0];
    if (firstMessage?.horae_meta?.agenda) {
        return firstMessage.horae_meta.agenda;
    }
    return [];
}

/**
 * 设置用户手动创建的待办事项（存储在 chat[0]）
 */
function setUserAgenda(agenda) {
    const context = getContext();
    if (!context?.chat?.length) return;
    
    if (!context.chat[0].horae_meta) {
        context.chat[0].horae_meta = createEmptyMeta();
    }
    
    context.chat[0].horae_meta.agenda = agenda;
    getContext().saveChat();
}

/**
 * 获取所有待办事项（用户 + AI写入），统一格式返回
 * 每项: { text, date, source: 'user'|'ai', done, createdAt, _msgIndex? }
 */
function getAllAgenda() {
    const all = [];
    
    // 1. 用户手动创建的
    const userItems = getUserAgenda();
    for (const item of userItems) {
        all.push({
            text: item.text,
            date: item.date || '',
            source: item.source || 'user',
            done: !!item.done,
            createdAt: item.createdAt || 0,
            _store: 'user',
            _index: all.length
        });
    }
    
    // 2. AI写入的（存储在各条消息的 horae_meta.agenda）
    const context = getContext();
    if (context?.chat) {
        for (let i = 1; i < context.chat.length; i++) {
            const meta = context.chat[i].horae_meta;
            if (meta?.agenda?.length > 0) {
                for (const item of meta.agenda) {
                    // 去重：检查是否已存在相同内容
                    const isDupe = all.some(a => a.text === item.text);
                    if (!isDupe) {
                        all.push({
                            text: item.text,
                            date: item.date || '',
                            source: 'ai',
                            done: !!item.done,
                            createdAt: item.createdAt || 0,
                            _store: 'msg',
                            _msgIndex: i,
                            _index: all.length
                        });
                    }
                }
            }
        }
    }
    
    return all;
}

/**
 * 根据全局索引切换待办完成状态
 */
function toggleAgendaDone(agendaItem, done) {
    const context = getContext();
    if (!context?.chat) return;
    
    if (agendaItem._store === 'user') {
        const agenda = getUserAgenda();
        // 按text查找（更可靠）
        const found = agenda.find(a => a.text === agendaItem.text);
        if (found) {
            found.done = done;
            setUserAgenda(agenda);
        }
    } else if (agendaItem._store === 'msg') {
        const msg = context.chat[agendaItem._msgIndex];
        if (msg?.horae_meta?.agenda) {
            const found = msg.horae_meta.agenda.find(a => a.text === agendaItem.text);
            if (found) {
                found.done = done;
                getContext().saveChat();
            }
        }
    }
}

/**
 * 删除指定的待办事项
 */
function deleteAgendaItem(agendaItem) {
    const context = getContext();
    if (!context?.chat) return;
    
    if (agendaItem._store === 'user') {
        const agenda = getUserAgenda();
        const idx = agenda.findIndex(a => a.text === agendaItem.text);
        if (idx !== -1) {
            agenda.splice(idx, 1);
            setUserAgenda(agenda);
        }
    } else if (agendaItem._store === 'msg') {
        const msg = context.chat[agendaItem._msgIndex];
        if (msg?.horae_meta?.agenda) {
            const idx = msg.horae_meta.agenda.findIndex(a => a.text === agendaItem.text);
            if (idx !== -1) {
                msg.horae_meta.agenda.splice(idx, 1);
                getContext().saveChat();
            }
        }
    }
}

/**
 * 导出表格为JSON
 */
function exportTable(tableIndex, scope = 'local') {
    const tables = getTablesByScope(scope);
    const table = tables[tableIndex];
    if (!table) return;

    const exportData = JSON.stringify(table, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `horae_table_${table.name || tableIndex}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('表格已导出', 'success');
}

/**
 * 导入表格
 */
function importTable(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const tableData = JSON.parse(e.target.result);
            if (!tableData || typeof tableData !== 'object') {
                throw new Error('无效的表格数据');
            }
            
            const newTable = {
                id: Date.now().toString(),
                name: tableData.name || '导入的表格',
                rows: tableData.rows || 2,
                cols: tableData.cols || 2,
                data: tableData.data || {},
                prompt: tableData.prompt || ''
            };
            
            const tables = getChatTables();
            tables.push(newTable);
            setChatTables(tables);
            
            renderCustomTablesList();
            showToast('表格已导入', 'success');
        } catch (err) {
            showToast('导入失败: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

// ============================================
// UI 渲染函数
// ============================================

/**
 * 更新状态页面显示
 */
function updateStatusDisplay() {
    const state = horaeManager.getLatestState();
    
    // 更新时间显示（标准日历显示周几）
    const dateEl = document.getElementById('horae-current-date');
    const timeEl = document.getElementById('horae-current-time');
    if (dateEl) {
        const dateStr = state.timestamp?.story_date || '--/--';
        const parsed = parseStoryDate(dateStr);
        // 标准日历添加周几
        if (parsed && parsed.type === 'standard') {
            dateEl.textContent = formatStoryDate(parsed, true);
        } else {
            dateEl.textContent = dateStr;
        }
    }
    if (timeEl) timeEl.textContent = state.timestamp?.story_time || '--:--';
    
    // 更新地点显示
    const locationEl = document.getElementById('horae-current-location');
    if (locationEl) locationEl.textContent = state.scene?.location || '未设置';
    
    // 更新氛围
    const atmosphereEl = document.getElementById('horae-current-atmosphere');
    if (atmosphereEl) atmosphereEl.textContent = state.scene?.atmosphere || '';
    
    // 更新服装列表（仅显示在场角色的服装）
    const costumesEl = document.getElementById('horae-costumes-list');
    if (costumesEl) {
        const presentChars = state.scene?.characters_present || [];
        const allCostumes = Object.entries(state.costumes || {});
        // 筛选：仅保留 characters_present 中的角色
        const entries = presentChars.length > 0
            ? allCostumes.filter(([char]) => presentChars.some(p => p === char || char.includes(p) || p.includes(char)))
            : allCostumes;
        if (entries.length === 0) {
            costumesEl.innerHTML = '<div class="horae-empty-hint">暂无在场角色服装记录</div>';
        } else {
            costumesEl.innerHTML = entries.map(([char, costume]) => `
                <div class="horae-costume-item">
                    <span class="horae-costume-char">${char}</span>
                    <span class="horae-costume-desc">${costume}</span>
                </div>
            `).join('');
        }
    }
    
    // 更新物品快速列表
    const itemsEl = document.getElementById('horae-items-quick');
    if (itemsEl) {
        const entries = Object.entries(state.items || {});
        if (entries.length === 0) {
            itemsEl.innerHTML = '<div class="horae-empty-hint">暂无物品追踪</div>';
        } else {
            itemsEl.innerHTML = entries.map(([name, info]) => {
                const icon = info.icon || '📦';
                const holderStr = info.holder ? `<span class="holder">${info.holder}</span>` : '';
                const locationStr = info.location ? `<span class="location">@ ${info.location}</span>` : '';
                return `<div class="horae-item-tag">${icon} ${name} ${holderStr} ${locationStr}</div>`;
            }).join('');
        }
    }
}

/**
 * 更新时间线显示
 */
function updateTimelineDisplay() {
    const filterLevel = document.getElementById('horae-timeline-filter')?.value || 'all';
    const searchKeyword = (document.getElementById('horae-timeline-search')?.value || '').trim().toLowerCase();
    let events = horaeManager.getEvents(0, filterLevel);
    const listEl = document.getElementById('horae-timeline-list');
    
    if (!listEl) return;
    
    // 关键字筛选
    if (searchKeyword) {
        events = events.filter(e => {
            const summary = (e.event?.summary || '').toLowerCase();
            const date = (e.timestamp?.story_date || '').toLowerCase();
            const level = (e.event?.level || '').toLowerCase();
            return summary.includes(searchKeyword) || date.includes(searchKeyword) || level.includes(searchKeyword);
        });
    }
    
    if (events.length === 0) {
        const filterText = filterLevel === 'all' ? '' : `「${filterLevel}」级别的`;
        const searchText = searchKeyword ? `含「${searchKeyword}」的` : '';
        listEl.innerHTML = `
            <div class="horae-empty-state">
                <i class="fa-regular fa-clock"></i>
                <span>暂无${searchText}${filterText}事件记录</span>
            </div>
        `;
        return;
    }
    
    const state = horaeManager.getLatestState();
    const currentDate = state.timestamp?.story_date || getCurrentSystemTime().date;
    
    // 更新多选按钮状态
    const msBtn = document.getElementById('horae-btn-timeline-multiselect');
    if (msBtn) {
        msBtn.classList.toggle('active', timelineMultiSelectMode);
        msBtn.title = timelineMultiSelectMode ? '退出多选' : '多选模式';
    }
    
    // 获取摘要映射（summaryId → entry），用于判定压缩状态
    const chat = horaeManager.getChat();
    const summaries = chat?.[0]?.horae_meta?.autoSummaries || [];
    const activeSummaryIds = new Set(summaries.filter(s => s.active).map(s => s.id));
    
    listEl.innerHTML = events.reverse().map(e => {
        const isSummary = e.event?.isSummary || e.event?.level === '摘要';
        const compressedBy = e.event?._compressedBy;
        const summaryId = e.event?._summaryId;
        
        // 已被压缩的事件：当对应摘要处于 active 状态时隐藏
        if (compressedBy && activeSummaryIds.has(compressedBy)) {
            return '';
        }
        // 摘要事件：inactive 时渲染为折叠指示条（保留切换按钮）
        if (summaryId && !activeSummaryIds.has(summaryId)) {
            const summaryEntry = summaries.find(s => s.id === summaryId);
            const rangeStr = summaryEntry ? `#${summaryEntry.range[0]}-#${summaryEntry.range[1]}` : '';
            return `
            <div class="horae-timeline-item summary horae-summary-collapsed" data-message-id="${e.messageIndex}" data-summary-id="${summaryId}">
                <div class="horae-timeline-summary-icon"><i class="fa-solid fa-file-lines"></i></div>
                <div class="horae-timeline-content">
                    <div class="horae-timeline-summary"><span class="horae-level-badge summary">摘要</span>已展开为原始事件</div>
                    <div class="horae-timeline-meta">${rangeStr} · ${summaryEntry?.auto ? '自动' : '手动'}摘要</div>
                </div>
                <div class="horae-summary-actions">
                    <button class="horae-summary-toggle-btn" data-summary-id="${summaryId}" title="切换为摘要">
                        <i class="fa-solid fa-compress"></i>
                    </button>
                    <button class="horae-summary-delete-btn" data-summary-id="${summaryId}" title="删除摘要">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>`;
        }
        
        const result = calculateDetailedRelativeTime(
            e.timestamp?.story_date || '',
            currentDate
        );
        const relTime = result.relative;
        const levelClass = isSummary ? 'summary' :
                          e.event?.level === '关键' ? 'critical' : 
                          e.event?.level === '重要' ? 'important' : '';
        const levelBadge = e.event?.level ? `<span class="horae-level-badge ${levelClass}">${e.event.level}</span>` : '';
        
        const dateStr = e.timestamp?.story_date || '?';
        const parsed = parseStoryDate(dateStr);
        const displayDate = (parsed && parsed.type === 'standard') ? formatStoryDate(parsed, true) : dateStr;
        
        const eventKey = `${e.messageIndex}-${e.eventIndex || 0}`;
        const isSelected = selectedTimelineEvents.has(eventKey);
        const selectedClass = isSelected ? 'selected' : '';
        const checkboxDisplay = timelineMultiSelectMode ? 'flex' : 'none';
        
        // 被标记为已压缩但摘要为 inactive 的事件，显示虚线框
        const isRestoredFromCompress = compressedBy && !activeSummaryIds.has(compressedBy);
        const compressedClass = isRestoredFromCompress ? 'horae-compressed-restored' : '';
        
        if (isSummary) {
            const summaryContent = e.event?.summary || '';
            const summaryDisplay = summaryContent || '<span class="horae-summary-hint">点击编辑添加摘要内容。</span>';
            const summaryEntry = summaryId ? summaries.find(s => s.id === summaryId) : null;
            const isActive = summaryEntry?.active;
            const rangeStr = summaryEntry ? `#${summaryEntry.range[0]}-#${summaryEntry.range[1]}` : '';
            // 有 summaryId 的摘要事件带切换/删除按钮
            const toggleBtns = summaryId ? `
                <div class="horae-summary-actions">
                    <button class="horae-summary-toggle-btn" data-summary-id="${summaryId}" title="${isActive ? '切换为原始时间线' : '切换为摘要'}">
                        <i class="fa-solid ${isActive ? 'fa-expand' : 'fa-compress'}"></i>
                    </button>
                    <button class="horae-summary-delete-btn" data-summary-id="${summaryId}" title="删除摘要">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>` : '';
            return `
            <div class="horae-timeline-item horae-editable-item summary ${selectedClass}" data-message-id="${e.messageIndex}" data-event-key="${eventKey}" data-summary-id="${summaryId || ''}">
                <div class="horae-item-checkbox" style="display: ${checkboxDisplay}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="horae-timeline-summary-icon">
                    <i class="fa-solid fa-file-lines"></i>
                </div>
                <div class="horae-timeline-content">
                    <div class="horae-timeline-summary">${levelBadge}${summaryDisplay}</div>
                    <div class="horae-timeline-meta">${rangeStr ? rangeStr + ' · ' : ''}${summaryEntry?.auto ? '自动' : ''}摘要 · 消息 #${e.messageIndex}</div>
                </div>
                ${toggleBtns}
                <button class="horae-item-edit-btn" data-edit-type="event" data-message-id="${e.messageIndex}" data-event-index="${e.eventIndex || 0}" title="编辑" style="${timelineMultiSelectMode || summaryId ? 'display:none' : ''}">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
            `;
        }
        
        const restoreBtn = isRestoredFromCompress ? `
                <button class="horae-summary-toggle-btn horae-btn-inline-toggle" data-summary-id="${compressedBy}" title="切换回摘要">
                    <i class="fa-solid fa-compress"></i>
                </button>` : '';
        
        return `
            <div class="horae-timeline-item horae-editable-item ${levelClass} ${selectedClass} ${compressedClass}" data-message-id="${e.messageIndex}" data-event-key="${eventKey}">
                <div class="horae-item-checkbox" style="display: ${checkboxDisplay}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="horae-timeline-time">
                    <div class="date">${displayDate}</div>
                    <div>${e.timestamp?.story_time || ''}</div>
                </div>
                <div class="horae-timeline-content">
                    <div class="horae-timeline-summary">${levelBadge}${e.event?.summary || '未记录'}</div>
                    <div class="horae-timeline-meta">${relTime} · 消息 #${e.messageIndex}</div>
                </div>
                ${restoreBtn}
                <button class="horae-item-edit-btn" data-edit-type="event" data-message-id="${e.messageIndex}" data-event-index="${e.eventIndex || 0}" title="编辑" style="${timelineMultiSelectMode ? 'display:none' : ''}">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
        `;
    }).join('');
    
    // 绑定事件
    listEl.querySelectorAll('.horae-timeline-item').forEach(item => {
        const eventKey = item.dataset.eventKey;
        
        if (timelineMultiSelectMode) {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (eventKey) toggleTimelineSelection(eventKey);
            });
        } else {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.horae-item-edit-btn') || e.target.closest('.horae-summary-actions')) return;
                scrollToMessage(item.dataset.messageId);
            });
            item.addEventListener('mousedown', (e) => startTimelineLongPress(e, eventKey));
            item.addEventListener('touchstart', (e) => startTimelineLongPress(e, eventKey), { passive: false });
            item.addEventListener('mouseup', cancelTimelineLongPress);
            item.addEventListener('mouseleave', cancelTimelineLongPress);
            item.addEventListener('touchend', cancelTimelineLongPress);
            item.addEventListener('touchmove', cancelTimelineLongPress, { passive: true });
            item.addEventListener('touchcancel', cancelTimelineLongPress);
        }
    });
    
    // 摘要切换/删除按钮
    listEl.querySelectorAll('.horae-summary-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSummaryActive(btn.dataset.summaryId);
        });
    });
    listEl.querySelectorAll('.horae-summary-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSummary(btn.dataset.summaryId);
        });
    });
    
    bindEditButtons();
}

/** 批量隐藏/显示聊天消息楼层（调用酒馆原生 /hide /unhide） */
async function setMessagesHidden(chat, indices, hidden) {
    if (!indices?.length) return;
    try {
        const slashModule = await import('/scripts/slash-commands.js');
        const exec = slashModule.executeSlashCommandsWithOptions;
        const cmd = hidden ? '/hide' : '/unhide';
        for (const idx of indices) {
            if (!chat[idx] || idx === 0) continue;
            await exec(`${cmd} ${idx}`);
        }
    } catch (e) {
        console.warn('[Horae] 无法调用酒馆原生隐藏命令，回退到手动设置:', e);
        for (const idx of indices) {
            if (!chat[idx] || idx === 0) continue;
            chat[idx].is_hidden = hidden;
            const $el = $(`.mes[mesid="${idx}"]`);
            if (hidden) $el.attr('is_hidden', 'true');
            else $el.removeAttr('is_hidden');
        }
        await getContext().saveChat();
    }
}

/** 从摘要条目中取回所有关联的消息索引 */
function getSummaryMsgIndices(entry) {
    if (!entry) return [];
    const fromEvents = (entry.originalEvents || []).map(e => e.msgIdx);
    if (entry.range) {
        for (let i = entry.range[0]; i <= entry.range[1]; i++) fromEvents.push(i);
    }
    return [...new Set(fromEvents)];
}

/** 切换摘要的 active 状态（摘要视图 ↔ 原始时间线） */
async function toggleSummaryActive(summaryId) {
    if (!summaryId) return;
    const chat = horaeManager.getChat();
    const sums = chat?.[0]?.horae_meta?.autoSummaries;
    if (!sums) return;
    const entry = sums.find(s => s.id === summaryId);
    if (!entry) return;
    entry.active = !entry.active;
    // 同步消息可见性：active=摘要模式→隐藏原消息，inactive=原始模式→显示原消息
    const indices = getSummaryMsgIndices(entry);
    await setMessagesHidden(chat, indices, entry.active);
    await getContext().saveChat();
    updateTimelineDisplay();
}

/** 删除摘要并恢复原始事件的压缩标记 */
async function deleteSummary(summaryId) {
    if (!summaryId) return;
    if (!confirm('删除此摘要？原始事件将恢复为普通时间线。')) return;
    
    const chat = horaeManager.getChat();
    const firstMeta = chat?.[0]?.horae_meta;
    if (!firstMeta?.autoSummaries) return;
    
    const idx = firstMeta.autoSummaries.findIndex(s => s.id === summaryId);
    if (idx === -1) return;
    
    const removedEntry = firstMeta.autoSummaries[idx];
    
    // 清除所有消息中对应的 _compressedBy 标记和摘要事件
    for (let i = 0; i < chat.length; i++) {
        const meta = chat[i]?.horae_meta;
        if (!meta?.events) continue;
        meta.events = meta.events.filter(evt => evt._summaryId !== summaryId);
        for (const evt of meta.events) {
            if (evt._compressedBy === summaryId) delete evt._compressedBy;
        }
    }
    
    firstMeta.autoSummaries.splice(idx, 1);
    
    // 恢复被隐藏的楼层
    const indices = getSummaryMsgIndices(removedEntry);
    await setMessagesHidden(chat, indices, false);
    
    await getContext().saveChat();
    updateTimelineDisplay();
    showToast('摘要已删除，原始事件已恢复', 'success');
}

/**
 * 更新待办事项显示
 */
function updateAgendaDisplay() {
    const listEl = document.getElementById('horae-agenda-list');
    if (!listEl) return;
    
    const agenda = getAllAgenda();
    
    if (agenda.length === 0) {
        listEl.innerHTML = '<div class="horae-empty-hint">暂无待办事项</div>';
        // 退出多选模式（如果所有待办被删完了）
        if (agendaMultiSelectMode) exitAgendaMultiSelect();
        return;
    }
    
    listEl.innerHTML = agenda.map((item, index) => {
        const sourceIcon = item.source === 'ai'
            ? '<i class="fa-solid fa-robot horae-agenda-source-ai" title="AI记录"></i>'
            : '<i class="fa-solid fa-user horae-agenda-source-user" title="用户添加"></i>';
        const dateDisplay = item.date ? `<span class="horae-agenda-date"><i class="fa-regular fa-calendar"></i> ${escapeHtml(item.date)}</span>` : '';
        
        // 多选模式：显示 checkbox
        const checkboxHtml = agendaMultiSelectMode
            ? `<label class="horae-agenda-select-check"><input type="checkbox" ${selectedAgendaIndices.has(index) ? 'checked' : ''} data-agenda-select="${index}"></label>`
            : '';
        const selectedClass = agendaMultiSelectMode && selectedAgendaIndices.has(index) ? ' selected' : '';
        
        return `
            <div class="horae-agenda-item${selectedClass}" data-agenda-idx="${index}">
                ${checkboxHtml}
                <div class="horae-agenda-body">
                    <div class="horae-agenda-meta">${sourceIcon}${dateDisplay}</div>
                    <div class="horae-agenda-text">${escapeHtml(item.text)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    const currentAgenda = agenda;
    
    listEl.querySelectorAll('.horae-agenda-item').forEach(el => {
        const idx = parseInt(el.dataset.agendaIdx);
        
        if (agendaMultiSelectMode) {
            // 多选模式：点击切换选中
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleAgendaSelection(idx);
            });
        } else {
            // 普通模式：点击编辑，长按进入多选
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = currentAgenda[idx];
                if (item) openAgendaEditModal(item);
            });
            
            // 长按进入多选模式（仅绑定在 agenda item 上）
            el.addEventListener('mousedown', (e) => startAgendaLongPress(e, idx));
            el.addEventListener('touchstart', (e) => startAgendaLongPress(e, idx), { passive: true });
            el.addEventListener('mouseup', cancelAgendaLongPress);
            el.addEventListener('mouseleave', cancelAgendaLongPress);
            el.addEventListener('touchmove', cancelAgendaLongPress, { passive: true });
            el.addEventListener('touchend', cancelAgendaLongPress);
            el.addEventListener('touchcancel', cancelAgendaLongPress);
        }
    });
}

// ---- 待办多选模式 ----

function startAgendaLongPress(e, agendaIdx) {
    if (agendaMultiSelectMode) return;
    agendaLongPressTimer = setTimeout(() => {
        enterAgendaMultiSelect(agendaIdx);
    }, 800);
}

function cancelAgendaLongPress() {
    if (agendaLongPressTimer) {
        clearTimeout(agendaLongPressTimer);
        agendaLongPressTimer = null;
    }
}

function enterAgendaMultiSelect(initialIdx) {
    agendaMultiSelectMode = true;
    selectedAgendaIndices.clear();
    if (initialIdx !== undefined && initialIdx !== null) {
        selectedAgendaIndices.add(initialIdx);
    }
    
    const bar = document.getElementById('horae-agenda-multiselect-bar');
    if (bar) bar.style.display = 'flex';
    
    // 隐藏添加按钮
    const addBtn = document.getElementById('horae-btn-add-agenda');
    if (addBtn) addBtn.style.display = 'none';
    
    updateAgendaDisplay();
    updateAgendaSelectedCount();
    showToast('已进入多选模式，点击选择待办事项', 'info');
}

function exitAgendaMultiSelect() {
    agendaMultiSelectMode = false;
    selectedAgendaIndices.clear();
    
    const bar = document.getElementById('horae-agenda-multiselect-bar');
    if (bar) bar.style.display = 'none';
    
    // 恢复添加按钮
    const addBtn = document.getElementById('horae-btn-add-agenda');
    if (addBtn) addBtn.style.display = '';
    
    updateAgendaDisplay();
}

function toggleAgendaSelection(idx) {
    if (selectedAgendaIndices.has(idx)) {
        selectedAgendaIndices.delete(idx);
    } else {
        selectedAgendaIndices.add(idx);
    }
    
    // 更新该条目的UI
    const item = document.querySelector(`#horae-agenda-list .horae-agenda-item[data-agenda-idx="${idx}"]`);
    if (item) {
        const cb = item.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = selectedAgendaIndices.has(idx);
        item.classList.toggle('selected', selectedAgendaIndices.has(idx));
    }
    
    updateAgendaSelectedCount();
}

function selectAllAgenda() {
    const items = document.querySelectorAll('#horae-agenda-list .horae-agenda-item');
    items.forEach(item => {
        const idx = parseInt(item.dataset.agendaIdx);
        if (!isNaN(idx)) selectedAgendaIndices.add(idx);
    });
    updateAgendaDisplay();
    updateAgendaSelectedCount();
}

function updateAgendaSelectedCount() {
    const countEl = document.getElementById('horae-agenda-selected-count');
    if (countEl) countEl.textContent = selectedAgendaIndices.size;
}

async function deleteSelectedAgenda() {
    if (selectedAgendaIndices.size === 0) {
        showToast('没有选中任何待办事项', 'warning');
        return;
    }
    
    const confirmed = confirm(`确定要删除选中的 ${selectedAgendaIndices.size} 条待办事项吗？\n\n此操作不可撤销。`);
    if (!confirmed) return;
    
    // 获取当前完整的 agenda 列表，按索引倒序删除
    const agenda = getAllAgenda();
    const sortedIndices = Array.from(selectedAgendaIndices).sort((a, b) => b - a);
    
    for (const idx of sortedIndices) {
        const item = agenda[idx];
        if (item) {
            deleteAgendaItem(item);
        }
    }
    
    await getContext().saveChat();
    showToast(`已删除 ${selectedAgendaIndices.size} 条待办事项`, 'success');
    
    exitAgendaMultiSelect();
}

// ============================================
// 时间线多选模式 & 长按插入菜单
// ============================================

/** 时间线长按开始（弹出插入菜单） */
function startTimelineLongPress(e, eventKey) {
    if (timelineMultiSelectMode) return;
    timelineLongPressTimer = setTimeout(() => {
        e.preventDefault?.();
        showTimelineContextMenu(e, eventKey);
    }, 800);
}

/** 取消时间线长按 */
function cancelTimelineLongPress() {
    if (timelineLongPressTimer) {
        clearTimeout(timelineLongPressTimer);
        timelineLongPressTimer = null;
    }
}

/** 显示时间线长按上下文菜单 */
function showTimelineContextMenu(e, eventKey) {
    closeTimelineContextMenu();
    const [msgIdx, evtIdx] = eventKey.split('-').map(Number);
    
    const menu = document.createElement('div');
    menu.id = 'horae-timeline-context-menu';
    menu.className = 'horae-context-menu';
    menu.innerHTML = `
        <div class="horae-context-item" data-action="insert-event-above">
            <i class="fa-solid fa-arrow-up"></i> 在上方添加事件
        </div>
        <div class="horae-context-item" data-action="insert-event-below">
            <i class="fa-solid fa-arrow-down"></i> 在下方添加事件
        </div>
        <div class="horae-context-separator"></div>
        <div class="horae-context-item" data-action="insert-summary-above">
            <i class="fa-solid fa-file-lines"></i> 在上方插入摘要
        </div>
        <div class="horae-context-item" data-action="insert-summary-below">
            <i class="fa-solid fa-file-lines"></i> 在下方插入摘要
        </div>
        <div class="horae-context-separator"></div>
        <div class="horae-context-item danger" data-action="delete">
            <i class="fa-solid fa-trash-can"></i> 删除此事件
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // 阻止菜单自身的所有事件冒泡（防止移动端抽屉收回）
    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(evType => {
        menu.addEventListener(evType, (ev) => ev.stopPropagation());
    });
    
    // 定位
    const rect = e.target.closest('.horae-timeline-item')?.getBoundingClientRect();
    if (rect) {
        let top = rect.bottom + 4;
        let left = rect.left + rect.width / 2 - 90;
        if (top + menu.offsetHeight > window.innerHeight) top = rect.top - menu.offsetHeight - 4;
        if (left < 8) left = 8;
        if (left + 180 > window.innerWidth) left = window.innerWidth - 188;
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    } else {
        menu.style.top = `${(e.clientY || e.touches?.[0]?.clientY || 100)}px`;
        menu.style.left = `${(e.clientX || e.touches?.[0]?.clientX || 100)}px`;
    }
    
    // 绑定菜单项操作（click + touchend 双绑定确保移动端可用）
    menu.querySelectorAll('.horae-context-item').forEach(item => {
        let handled = false;
        const handler = (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            ev.preventDefault();
            if (handled) return;
            handled = true;
            const action = item.dataset.action;
            closeTimelineContextMenu();
            handleTimelineContextAction(action, msgIdx, evtIdx, eventKey);
        };
        item.addEventListener('click', handler);
        item.addEventListener('touchend', handler);
    });
    
    // 点击菜单外区域关闭（仅用 click，不用 touchstart 避免抢占移动端触摸）
    setTimeout(() => {
        const dismissHandler = (ev) => {
            if (menu.contains(ev.target)) return;
            closeTimelineContextMenu();
            document.removeEventListener('click', dismissHandler, true);
        };
        document.addEventListener('click', dismissHandler, true);
    }, 100);
}

/** 关闭时间线上下文菜单 */
function closeTimelineContextMenu() {
    const menu = document.getElementById('horae-timeline-context-menu');
    if (menu) menu.remove();
}

/** 处理时间线上下文菜单操作 */
async function handleTimelineContextAction(action, msgIdx, evtIdx, eventKey) {
    const chat = horaeManager.getChat();
    
    if (action === 'delete') {
        if (!confirm('确定删除此事件？')) return;
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta) return;
        if (meta.events && evtIdx < meta.events.length) {
            meta.events.splice(evtIdx, 1);
        } else if (meta.event && evtIdx === 0) {
            delete meta.event;
        }
        await getContext().saveChat();
        showToast('已删除事件', 'success');
        updateTimelineDisplay();
        updateStatusDisplay();
        return;
    }
    
    const isAbove = action.includes('above');
    const isSummary = action.includes('summary');
    
    if (isSummary) {
        openTimelineSummaryModal(msgIdx, evtIdx, isAbove);
    } else {
        openTimelineInsertEventModal(msgIdx, evtIdx, isAbove);
    }
}

/** 打开插入事件弹窗 */
function openTimelineInsertEventModal(refMsgIdx, refEvtIdx, isAbove) {
    const state = horaeManager.getLatestState();
    const currentDate = state.timestamp?.story_date || '';
    const currentTime = state.timestamp?.story_time || '';
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-timeline"></i> ${isAbove ? '在上方' : '在下方'}添加事件
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>日期</label>
                        <input type="text" id="insert-event-date" value="${currentDate}" placeholder="如 2026/2/14">
                    </div>
                    <div class="horae-edit-field">
                        <label>时间</label>
                        <input type="text" id="insert-event-time" value="${currentTime}" placeholder="如 15:00">
                    </div>
                    <div class="horae-edit-field">
                        <label>重要程度</label>
                        <select id="insert-event-level" class="horae-select">
                            <option value="一般">一般</option>
                            <option value="重要">重要</option>
                            <option value="关键">关键</option>
                        </select>
                    </div>
                    <div class="horae-edit-field">
                        <label>事件摘要</label>
                        <textarea id="insert-event-summary" rows="3" placeholder="描述此事件的摘要..."></textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 添加
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    document.getElementById('edit-modal-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        const date = document.getElementById('insert-event-date').value.trim();
        const time = document.getElementById('insert-event-time').value.trim();
        const level = document.getElementById('insert-event-level').value;
        const summary = document.getElementById('insert-event-summary').value.trim();
        
        if (!summary) { showToast('请输入事件摘要', 'warning'); return; }
        
        const newEvent = {
            is_important: level === '重要' || level === '关键',
            level: level,
            summary: summary
        };
        
        const chat = horaeManager.getChat();
        const meta = chat[refMsgIdx]?.horae_meta;
        if (!meta) { closeEditModal(); return; }
        if (!meta.events) meta.events = [];
        
        const newTimestamp = { story_date: date, story_time: time };
        if (!meta.timestamp) meta.timestamp = {};
        
        const insertIdx = isAbove ? refEvtIdx + 1 : refEvtIdx;
        meta.events.splice(insertIdx, 0, newEvent);
        
        if (date && !meta.timestamp.story_date) {
            meta.timestamp.story_date = date;
            meta.timestamp.story_time = time;
        }
        
        await getContext().saveChat();
        closeEditModal();
        updateTimelineDisplay();
        updateStatusDisplay();
        showToast('事件已添加', 'success');
    });
    
    document.getElementById('edit-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        closeEditModal();
    });
}

/** 打开插入摘要弹窗 */
function openTimelineSummaryModal(refMsgIdx, refEvtIdx, isAbove) {
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-file-lines"></i> ${isAbove ? '在上方' : '在下方'}插入摘要
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>摘要内容</label>
                        <textarea id="insert-summary-text" rows="5" placeholder="在此输入摘要内容，用于替代被删除的中间时间线...&#10;&#10;提示：请勿删除开头的时间线，否则相对时间计算和年龄自动推进功能将会失效。"></textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 插入摘要
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    document.getElementById('edit-modal-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        const summaryText = document.getElementById('insert-summary-text').value.trim();
        if (!summaryText) { showToast('请输入摘要内容', 'warning'); return; }
        
        const newEvent = {
            is_important: true,
            level: '摘要',
            summary: summaryText,
            isSummary: true
        };
        
        const chat = horaeManager.getChat();
        const meta = chat[refMsgIdx]?.horae_meta;
        if (!meta) { closeEditModal(); return; }
        if (!meta.events) meta.events = [];
        
        const insertIdx = isAbove ? refEvtIdx + 1 : refEvtIdx;
        meta.events.splice(insertIdx, 0, newEvent);
        
        await getContext().saveChat();
        closeEditModal();
        updateTimelineDisplay();
        updateStatusDisplay();
        showToast('摘要已插入', 'success');
    });
    
    document.getElementById('edit-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        closeEditModal();
    });
}

/** 进入时间线多选模式 */
function enterTimelineMultiSelect(initialKey) {
    timelineMultiSelectMode = true;
    selectedTimelineEvents.clear();
    if (initialKey) selectedTimelineEvents.add(initialKey);
    
    const bar = document.getElementById('horae-timeline-multiselect-bar');
    if (bar) bar.style.display = 'flex';
    
    updateTimelineDisplay();
    updateTimelineSelectedCount();
    showToast('已进入多选模式，点击选择事件', 'info');
}

/** 退出时间线多选模式 */
function exitTimelineMultiSelect() {
    timelineMultiSelectMode = false;
    selectedTimelineEvents.clear();
    
    const bar = document.getElementById('horae-timeline-multiselect-bar');
    if (bar) bar.style.display = 'none';
    
    updateTimelineDisplay();
}

/** 切换时间线事件选中状态 */
function toggleTimelineSelection(eventKey) {
    if (selectedTimelineEvents.has(eventKey)) {
        selectedTimelineEvents.delete(eventKey);
    } else {
        selectedTimelineEvents.add(eventKey);
    }
    
    const item = document.querySelector(`.horae-timeline-item[data-event-key="${eventKey}"]`);
    if (item) {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = selectedTimelineEvents.has(eventKey);
        item.classList.toggle('selected', selectedTimelineEvents.has(eventKey));
    }
    updateTimelineSelectedCount();
}

/** 全选时间线事件 */
function selectAllTimelineEvents() {
    document.querySelectorAll('#horae-timeline-list .horae-timeline-item').forEach(item => {
        const key = item.dataset.eventKey;
        if (key) selectedTimelineEvents.add(key);
    });
    updateTimelineDisplay();
    updateTimelineSelectedCount();
}

/** 更新时间线选中计数 */
function updateTimelineSelectedCount() {
    const el = document.getElementById('horae-timeline-selected-count');
    if (el) el.textContent = selectedTimelineEvents.size;
}

/** 选择压缩模式弹窗 */
function showCompressModeDialog(eventCount, msgRange) {
    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'horae-modal' + (settings.themeMode === 'light' ? ' horae-light' : '');
        modal.innerHTML = `
            <div class="horae-modal-content" style="max-width: 420px;">
                <div class="horae-modal-header"><span>压缩模式</span></div>
                <div class="horae-modal-body" style="padding: 16px;">
                    <p style="margin: 0 0 12px; color: var(--horae-text-muted); font-size: 13px;">
                        已选中 <strong style="color: var(--horae-primary-light);">${eventCount}</strong> 条事件，
                        涵盖消息 #${msgRange[0]} ~ #${msgRange[1]}
                    </p>
                    <label style="display: flex; align-items: flex-start; gap: 8px; padding: 10px; border: 1px solid var(--horae-border); border-radius: 6px; cursor: pointer; margin-bottom: 8px;">
                        <input type="radio" name="horae-compress-mode" value="event" checked style="margin-top: 3px;">
                        <div>
                            <div style="font-size: 13px; color: var(--horae-text); font-weight: 500;">事件压缩</div>
                            <div style="font-size: 11px; color: var(--horae-text-muted); margin-top: 2px;">从已提取的事件摘要文本压缩，速度快，但信息仅限于时间线已记录的内容</div>
                        </div>
                    </label>
                    <label style="display: flex; align-items: flex-start; gap: 8px; padding: 10px; border: 1px solid var(--horae-border); border-radius: 6px; cursor: pointer;">
                        <input type="radio" name="horae-compress-mode" value="fulltext" style="margin-top: 3px;">
                        <div>
                            <div style="font-size: 13px; color: var(--horae-text); font-weight: 500;">全文摘要</div>
                            <div style="font-size: 11px; color: var(--horae-text-muted); margin-top: 2px;">回读选中事件所在消息的完整正文进行摘要，细节更丰富，但消耗更多 Token</div>
                        </div>
                    </label>
                </div>
                <div class="horae-modal-footer">
                    <button class="horae-btn" id="horae-compress-cancel">取消</button>
                    <button class="horae-btn primary" id="horae-compress-confirm">继续</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#horae-compress-confirm').addEventListener('click', () => {
            const mode = modal.querySelector('input[name="horae-compress-mode"]:checked').value;
            modal.remove();
            resolve(mode);
        });
        modal.querySelector('#horae-compress-cancel').addEventListener('click', () => { modal.remove(); resolve(null); });
        modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); resolve(null); } });
    });
}

/** AI智能压缩选中的时间线事件为一条摘要 */
async function compressSelectedTimelineEvents() {
    if (selectedTimelineEvents.size < 2) {
        showToast('请至少选择2条事件进行压缩', 'warning');
        return;
    }
    
    const chat = horaeManager.getChat();
    const events = [];
    for (const key of selectedTimelineEvents) {
        const [msgIdx, evtIdx] = key.split('-').map(Number);
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta) continue;
        const evtsArr = meta.events || (meta.event ? [meta.event] : []);
        const evt = evtsArr[evtIdx];
        if (!evt) continue;
        const date = meta.timestamp?.story_date || '?';
        const time = meta.timestamp?.story_time || '';
        events.push({
            key, msgIdx, evtIdx,
            date, time,
            level: evt.level || '一般',
            summary: evt.summary || '',
            isSummary: evt.isSummary || evt.level === '摘要'
        });
    }
    
    if (events.length < 2) {
        showToast('有效事件不足2条', 'warning');
        return;
    }
    
    events.sort((a, b) => a.msgIdx - b.msgIdx || a.evtIdx - b.evtIdx);
    
    const msgRange = [events[0].msgIdx, events[events.length - 1].msgIdx];
    const mode = await showCompressModeDialog(events.length, msgRange);
    if (!mode) return;
    
    let sourceText;
    if (mode === 'fulltext') {
        // 收集涉及的消息全文
        const msgIndices = [...new Set(events.map(e => e.msgIdx))].sort((a, b) => a - b);
        const fullTexts = msgIndices.map(idx => {
            const msg = chat[idx];
            const date = msg?.horae_meta?.timestamp?.story_date || '';
            const time = msg?.horae_meta?.timestamp?.story_time || '';
            const timeStr = [date, time].filter(Boolean).join(' ');
            return `【#${idx}${timeStr ? ' ' + timeStr : ''}】\n${msg?.mes || ''}`;
        });
        sourceText = fullTexts.join('\n\n');
    } else {
        sourceText = events.map(e => {
            const timeStr = e.time ? `${e.date} ${e.time}` : e.date;
            return `[${e.level}] ${timeStr}: ${e.summary}`;
        }).join('\n');
    }
    
    let cancelled = false;
    let cancelResolve = null;
    const cancelPromise = new Promise(resolve => { cancelResolve = resolve; });

    const fetchAbort = new AbortController();
    const _origFetch = window.fetch;
    window.fetch = function(input, init = {}) {
        if (!cancelled) {
            const ourSignal = fetchAbort.signal;
            if (init.signal && typeof AbortSignal.any === 'function') {
                init.signal = AbortSignal.any([init.signal, ourSignal]);
            } else {
                init.signal = ourSignal;
            }
        }
        return _origFetch.call(this, input, init);
    };

    const overlay = document.createElement('div');
    overlay.className = 'horae-progress-overlay' + (settings.themeMode === 'light' ? ' horae-light' : '');
    overlay.innerHTML = `
        <div class="horae-progress-container">
            <div class="horae-progress-title">AI 压缩中...</div>
            <div class="horae-progress-bar"><div class="horae-progress-fill" style="width: 50%"></div></div>
            <div class="horae-progress-text">${mode === 'fulltext' ? '正在回读全文生成摘要...' : '正在生成摘要...'}</div>
            <button class="horae-progress-cancel"><i class="fa-solid fa-xmark"></i> 取消压缩</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.horae-progress-cancel').addEventListener('click', () => {
        if (cancelled) return;
        if (!confirm('取消后摘要将不会保存，确定取消？')) return;
        cancelled = true;
        fetchAbort.abort();
        try { getContext().stopGeneration(); } catch (_) {}
        cancelResolve();
        overlay.remove();
        window.fetch = _origFetch;
        showToast('已取消压缩', 'info');
    });
    
    try {
        const context = getContext();
        const userName = context?.name1 || '主角';
        const eventText = events.map(e => {
            const timeStr = e.time ? `${e.date} ${e.time}` : e.date;
            return `[${e.level}] ${timeStr}: ${e.summary}`;
        }).join('\n');

        const fullTemplate = settings.customCompressPrompt || getDefaultCompressPrompt();
        const section = parseCompressPrompt(fullTemplate, mode);
        const prompt = section
            .replace(/\{\{events\}\}/gi, mode === 'event' ? sourceText : eventText)
            .replace(/\{\{fulltext\}\}/gi, mode === 'fulltext' ? sourceText : '')
            .replace(/\{\{count\}\}/gi, String(events.length))
            .replace(/\{\{user\}\}/gi, userName);

        _isSummaryGeneration = true;
        let response;
        try {
            const genPromise = getContext().generateRaw(prompt, null, false, false);
            response = await Promise.race([genPromise, cancelPromise]);
        } finally {
            _isSummaryGeneration = false;
            window.fetch = _origFetch;
        }
        
        if (cancelled) return;
        
        if (!response || !response.trim()) {
            overlay.remove();
            showToast('AI未返回有效摘要', 'warning');
            return;
        }
        
        const summaryText = response.trim();
        
        // 非破坏性压缩：将原始事件和摘要存入 autoSummaries
        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.autoSummaries) firstMsg.horae_meta.autoSummaries = [];
        
        // 收集被压缩的原始事件备份
        const originalEvents = events.map(e => ({
            msgIdx: e.msgIdx,
            evtIdx: e.evtIdx,
            event: { ...chat[e.msgIdx]?.horae_meta?.events?.[e.evtIdx] },
            timestamp: chat[e.msgIdx]?.horae_meta?.timestamp
        }));
        
        const summaryId = `cs_${Date.now()}`;
        const summaryEntry = {
            id: summaryId,
            range: [events[0].msgIdx, events[events.length - 1].msgIdx],
            summaryText,
            originalEvents,
            active: true,
            createdAt: new Date().toISOString(),
            auto: false
        };
        firstMsg.horae_meta.autoSummaries.push(summaryEntry);
        
        // 标记原始事件为已压缩（不删除）
        for (const e of events) {
            const meta = chat[e.msgIdx]?.horae_meta;
            if (meta?.events?.[e.evtIdx]) {
                meta.events[e.evtIdx]._compressedBy = summaryId;
            }
        }
        
        // 在最早的消息位置插入摘要事件
        const firstEvent = events[0];
        const firstMeta = chat[firstEvent.msgIdx]?.horae_meta;
        if (firstMeta) {
            if (!firstMeta.events) firstMeta.events = [];
            firstMeta.events.push({
                is_important: true,
                level: '摘要',
                summary: summaryText,
                isSummary: true,
                _summaryId: summaryId
            });
        }
        
        // 隐藏被压缩的消息楼层
        const compressedMsgIndices = [...new Set(events.map(e => e.msgIdx))];
        await setMessagesHidden(chat, compressedMsgIndices, true);
        
        await context.saveChat();
        overlay.remove();
        exitTimelineMultiSelect();
        updateTimelineDisplay();
        updateStatusDisplay();
        showToast(`已将 ${events.length} 条事件${mode === 'fulltext' ? '（全文模式）' : ''}压缩为摘要`, 'success');
    } catch (err) {
        window.fetch = _origFetch;
        overlay.remove();
        if (cancelled || err?.name === 'AbortError') return;
        console.error('[Horae] 压缩失败:', err);
        showToast('AI压缩失败: ' + (err.message || '未知错误'), 'error');
    }
}

/** 删除选中的时间线事件 */
async function deleteSelectedTimelineEvents() {
    if (selectedTimelineEvents.size === 0) {
        showToast('没有选中任何事件', 'warning');
        return;
    }
    
    const confirmed = confirm(`确定要删除选中的 ${selectedTimelineEvents.size} 条剧情轨迹吗？\n\n可通过「刷新」按钮旁的撤销恢复。`);
    if (!confirmed) return;
    
    const chat = horaeManager.getChat();
    
    // 按消息分组，倒序删除事件索引
    const msgMap = new Map();
    for (const key of selectedTimelineEvents) {
        const [msgIdx, evtIdx] = key.split('-').map(Number);
        if (!msgMap.has(msgIdx)) msgMap.set(msgIdx, []);
        msgMap.get(msgIdx).push(evtIdx);
    }
    
    for (const [msgIdx, evtIndices] of msgMap) {
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta) continue;
        
        if (meta.events && meta.events.length > 0) {
            const sorted = evtIndices.sort((a, b) => b - a);
            for (const ei of sorted) {
                if (ei < meta.events.length) {
                    meta.events.splice(ei, 1);
                }
            }
        } else if (meta.event && evtIndices.includes(0)) {
            delete meta.event;
        }
    }
    
    await getContext().saveChat();
    showToast(`已删除 ${selectedTimelineEvents.size} 条剧情轨迹`, 'success');
    exitTimelineMultiSelect();
    updateStatusDisplay();
}

/**
 * 打开待办事项添加/编辑弹窗
 * @param {Object|null} agendaItem - 编辑时传入完整 agenda 对象，新增时传 null
 */
function openAgendaEditModal(agendaItem = null) {
    const isEdit = agendaItem !== null;
    const currentText = isEdit ? (agendaItem.text || '') : '';
    const currentDate = isEdit ? (agendaItem.date || '') : '';
    const title = isEdit ? '编辑待办' : '添加待办';
    
    closeEditModal();
    
    const deleteBtn = isEdit ? `
                    <button id="agenda-modal-delete" class="horae-btn danger">
                        <i class="fa-solid fa-trash"></i> 删除
                    </button>` : '';
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-list-check"></i> ${title}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>订立日期 (选填)</label>
                        <input type="text" id="agenda-edit-date" value="${escapeHtml(currentDate)}" placeholder="如 2026/02/10">
                    </div>
                    <div class="horae-edit-field">
                        <label>内容</label>
                        <textarea id="agenda-edit-text" rows="3" placeholder="输入待办事项，相对时间请标注绝对时间，例如：艾伦邀请艾莉絲於情人節晚上(2026/02/14 18:00)约会">${escapeHtml(currentText)}</textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="agenda-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="agenda-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                    ${deleteBtn}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    setTimeout(() => {
        const textarea = document.getElementById('agenda-edit-text');
        if (textarea) textarea.focus();
    }, 100);
    
    document.getElementById('horae-edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'horae-edit-modal') closeEditModal();
    });
    
    document.getElementById('agenda-modal-save').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const text = document.getElementById('agenda-edit-text').value.trim();
        const date = document.getElementById('agenda-edit-date').value.trim();
        if (!text) {
            showToast('内容不能为空', 'warning');
            return;
        }
        
        if (isEdit) {
            // 编辑现有项
            const context = getContext();
            if (agendaItem._store === 'user') {
                const agenda = getUserAgenda();
                const found = agenda.find(a => a.text === agendaItem.text);
                if (found) {
                    found.text = text;
                    found.date = date;
                }
                setUserAgenda(agenda);
            } else if (agendaItem._store === 'msg' && context?.chat) {
                const msg = context.chat[agendaItem._msgIndex];
                if (msg?.horae_meta?.agenda) {
                    const found = msg.horae_meta.agenda.find(a => a.text === agendaItem.text);
                    if (found) {
                        found.text = text;
                        found.date = date;
                    }
                    getContext().saveChat();
                }
            }
        } else {
            // 新增
            const agenda = getUserAgenda();
            agenda.push({ text, date, source: 'user', done: false, createdAt: Date.now() });
            setUserAgenda(agenda);
        }
        
        closeEditModal();
        updateAgendaDisplay();
        showToast(isEdit ? '待办已更新' : '待办已添加', 'success');
    });
    
    document.getElementById('agenda-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeEditModal();
    });
    
    // 删除按钮（仅编辑模式）
    const deleteEl = document.getElementById('agenda-modal-delete');
    if (deleteEl && isEdit) {
        deleteEl.addEventListener('click', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            if (!confirm('确定要删除这条待办事项吗？此操作无法撤销。')) return;
            
            deleteAgendaItem(agendaItem);
            closeEditModal();
            updateAgendaDisplay();
            showToast('待办已删除', 'info');
        });
    }
}

/**
 * 更新角色页面显示
 */
function updateCharactersDisplay() {
    const state = horaeManager.getLatestState();
    const presentChars = state.scene?.characters_present || [];
    const favoriteNpcs = settings.favoriteNpcs || [];
    
    // 获取角色卡主角色名（用于置顶和特殊样式）
    const context = getContext();
    const mainCharName = context?.name2 || '';
    
    // 在场角色
    const presentEl = document.getElementById('horae-present-characters');
    if (presentEl) {
        if (presentChars.length === 0) {
            presentEl.innerHTML = '<div class="horae-empty-hint">暂无记录</div>';
        } else {
            presentEl.innerHTML = presentChars.map(char => {
                const isMainChar = mainCharName && char.includes(mainCharName);
                return `
                    <div class="horae-character-badge ${isMainChar ? 'main-character' : ''}">
                        <i class="fa-solid fa-user"></i>
                        ${char}
                    </div>
                `;
            }).join('');
        }
    }
    
    // 好感度 - 分层显示：重要角色 > 在场角色 > 其他
    const affectionEl = document.getElementById('horae-affection-list');
    const pinnedNpcsAff = settings.pinnedNpcs || [];
    if (affectionEl) {
        const entries = Object.entries(state.affection || {});
        if (entries.length === 0) {
            affectionEl.innerHTML = '<div class="horae-empty-hint">暂无好感度记录</div>';
        } else {
            // 判断是否为重要角色
            const isMainCharAff = (key) => {
                if (pinnedNpcsAff.includes(key)) return true;
                if (mainCharName && key.includes(mainCharName)) return true;
                return false;
            };
            const mainCharAffection = entries.filter(([key]) => isMainCharAff(key));
            const presentAffection = entries.filter(([key]) => 
                !isMainCharAff(key) && presentChars.some(char => key.includes(char))
            );
            const otherAffection = entries.filter(([key]) => 
                !isMainCharAff(key) && !presentChars.some(char => key.includes(char))
            );
            
            const renderAffection = (arr, isMainChar = false) => arr.map(([key, value]) => {
                const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                const valueClass = numValue > 0 ? 'positive' : numValue < 0 ? 'negative' : 'neutral';
                const level = horaeManager.getAffectionLevel(numValue);
                const mainClass = isMainChar ? 'main-character' : '';
                return `
                    <div class="horae-affection-item horae-editable-item ${mainClass}" data-char="${key}" data-value="${numValue}">
                        ${isMainChar ? '<i class="fa-solid fa-crown main-char-icon"></i>' : ''}
                        <span class="horae-affection-name">${key}</span>
                        <span class="horae-affection-value ${valueClass}">${numValue > 0 ? '+' : ''}${numValue}</span>
                        <span class="horae-affection-level">${level}</span>
                        <button class="horae-item-edit-btn horae-affection-edit-btn" data-edit-type="affection" data-char="${key}" title="编辑好感度">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </div>
                `;
            }).join('');
            
            let html = '';
            // 角色卡角色置顶
            if (mainCharAffection.length > 0) {
                html += renderAffection(mainCharAffection, true);
            }
            if (presentAffection.length > 0) {
                if (mainCharAffection.length > 0) {
                    html += '<div class="horae-affection-divider"></div>';
                }
                html += renderAffection(presentAffection);
            }
            if (otherAffection.length > 0) {
                if (mainCharAffection.length > 0 || presentAffection.length > 0) {
                    html += '<div class="horae-affection-divider"></div>';
                }
                html += renderAffection(otherAffection);
            }
            affectionEl.innerHTML = html;
        }
    }
    
    // NPC列表 - 分层显示：重要角色 > 星标角色 > 普通角色
    const npcEl = document.getElementById('horae-npc-list');
    const pinnedNpcs = settings.pinnedNpcs || [];
    if (npcEl) {
        const entries = Object.entries(state.npcs || {});
        if (entries.length === 0) {
            npcEl.innerHTML = '<div class="horae-empty-hint">暂无角色记录</div>';
        } else {
            // 判断是否为重要角色（角色卡主角 或 手动标记）
            const isMainChar = (name) => {
                if (pinnedNpcs.includes(name)) return true;
                if (mainCharName && name.includes(mainCharName)) return true;
                return false;
            };
            const mainCharEntries = entries.filter(([name]) => isMainChar(name));
            const favoriteEntries = entries.filter(([name]) => 
                !isMainChar(name) && favoriteNpcs.includes(name)
            );
            const normalEntries = entries.filter(([name]) => 
                !isMainChar(name) && !favoriteNpcs.includes(name)
            );
            
            const renderNpc = (name, info, isFavorite, isMainChar = false) => {
                let descHtml = '';
                if (info.appearance || info.personality || info.relationship) {
                    if (info.appearance) descHtml += `<span class="horae-npc-appearance">${info.appearance}</span>`;
                    if (info.personality) descHtml += `<span class="horae-npc-personality">${info.personality}</span>`;
                    if (info.relationship) descHtml += `<span class="horae-npc-relationship">${info.relationship}</span>`;
                } else if (info.description) {
                    descHtml = `<span class="horae-npc-legacy">${info.description}</span>`;
                } else {
                    descHtml = '<span class="horae-npc-legacy">无描述</span>';
                }
                
                // 扩展信息行（年龄/种族/职业）
                const extraTags = [];
                if (info.race) extraTags.push(info.race);
                if (info.age) {
                    const ageResult = horaeManager.calcCurrentAge(info, state.timestamp?.story_date);
                    if (ageResult.changed) {
                        extraTags.push(`<span class="horae-age-calc" title="原始:${ageResult.original} (已推算时间推移)">${ageResult.display}岁</span>`);
                    } else {
                        extraTags.push(info.age);
                    }
                }
                if (info.job) extraTags.push(info.job);
                if (extraTags.length > 0) {
                    descHtml += `<span class="horae-npc-extras">${extraTags.join(' · ')}</span>`;
                }
                if (info.note) {
                    descHtml += `<span class="horae-npc-note">${info.note}</span>`;
                }
                
                const starClass = isFavorite ? 'favorite' : '';
                const mainClass = isMainChar ? 'main-character' : '';
                const starIcon = isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star';
                
                // 性别图标映射
                let genderIcon, genderClass;
                if (isMainChar) {
                    genderIcon = 'fa-solid fa-crown';
                    genderClass = 'horae-gender-main';
                } else {
                    const g = (info.gender || '').toLowerCase();
                    if (/^(男|male|m|雄|公|♂)$/.test(g)) {
                        genderIcon = 'fa-solid fa-person';
                        genderClass = 'horae-gender-male';
                    } else if (/^(女|female|f|雌|母|♀)$/.test(g)) {
                        genderIcon = 'fa-solid fa-person-dress';
                        genderClass = 'horae-gender-female';
                    } else {
                        genderIcon = 'fa-solid fa-user';
                        genderClass = 'horae-gender-unknown';
                    }
                }
                
                return `
                    <div class="horae-npc-item horae-editable-item ${starClass} ${mainClass}" data-npc-name="${name}" data-npc-gender="${info.gender || ''}">
                        <div class="horae-npc-header">
                            <div class="horae-npc-name"><i class="${genderIcon} ${genderClass}"></i> ${name}</div>
                            <div class="horae-npc-actions">
                                <button class="horae-item-edit-btn" data-edit-type="npc" data-edit-name="${name}" title="编辑" style="opacity:1;position:static;">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button class="horae-npc-star" title="${isFavorite ? '取消星标' : '添加星标'}">
                                    <i class="${starIcon}"></i>
                                </button>
                            </div>
                        </div>
                        <div class="horae-npc-details">${descHtml}</div>
                    </div>
                `;
            };
            
            // 性别过滤栏
            let html = `
                <div class="horae-gender-filter">
                    <button class="horae-gender-btn active" data-filter="all" title="全部">全部</button>
                    <button class="horae-gender-btn" data-filter="male" title="男性"><i class="fa-solid fa-person"></i></button>
                    <button class="horae-gender-btn" data-filter="female" title="女性"><i class="fa-solid fa-person-dress"></i></button>
                    <button class="horae-gender-btn" data-filter="other" title="其他/未知"><i class="fa-solid fa-user"></i></button>
                </div>
            `;
            
            // 角色卡角色区域（置顶）
            if (mainCharEntries.length > 0) {
                html += '<div class="horae-npc-section main-character-section">';
                html += '<div class="horae-npc-section-title"><i class="fa-solid fa-crown"></i> 主要角色</div>';
                html += mainCharEntries.map(([name, info]) => renderNpc(name, info, false, true)).join('');
                html += '</div>';
            }
            
            // 星标NPC区域
            if (favoriteEntries.length > 0) {
                if (mainCharEntries.length > 0) {
                    html += '<div class="horae-npc-section-divider"></div>';
                }
                html += '<div class="horae-npc-section favorite-section">';
                html += '<div class="horae-npc-section-title"><i class="fa-solid fa-star"></i> 星标NPC</div>';
                html += favoriteEntries.map(([name, info]) => renderNpc(name, info, true)).join('');
                html += '</div>';
            }
            
            // 普通NPC区域
            if (normalEntries.length > 0) {
                if (mainCharEntries.length > 0 || favoriteEntries.length > 0) {
                    html += '<div class="horae-npc-section-divider"></div>';
                }
                html += '<div class="horae-npc-section">';
                if (mainCharEntries.length > 0 || favoriteEntries.length > 0) {
                    html += '<div class="horae-npc-section-title">其他NPC</div>';
                }
                html += normalEntries.map(([name, info]) => renderNpc(name, info, false)).join('');
                html += '</div>';
            }
            
            npcEl.innerHTML = html;
            
            npcEl.querySelectorAll('.horae-npc-star').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const npcItem = btn.closest('.horae-npc-item');
                    const npcName = npcItem.dataset.npcName;
                    toggleNpcFavorite(npcName);
                });
            });
            
            bindEditButtons();
            
            npcEl.querySelectorAll('.horae-gender-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    npcEl.querySelectorAll('.horae-gender-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filter = btn.dataset.filter;
                    npcEl.querySelectorAll('.horae-npc-item').forEach(item => {
                        if (filter === 'all') {
                            item.style.display = '';
                        } else {
                            const g = (item.dataset.npcGender || '').toLowerCase();
                            let match = false;
                            if (filter === 'male') match = /^(男|male|m|雄|公)$/.test(g);
                            else if (filter === 'female') match = /^(女|female|f|雌|母)$/.test(g);
                            else if (filter === 'other') match = !(/^(男|male|m|雄|公)$/.test(g) || /^(女|female|f|雌|母)$/.test(g));
                            item.style.display = match ? '' : 'none';
                        }
                    });
                });
            });
        }
    }
    
    // 关系网络渲染
    if (settings.sendRelationships) {
        updateRelationshipDisplay();
    }
}

/**
 * 更新关系网络显示
 */
function updateRelationshipDisplay() {
    const listEl = document.getElementById('horae-relationship-list');
    if (!listEl) return;
    
    const relationships = horaeManager.getRelationships();
    
    if (relationships.length === 0) {
        listEl.innerHTML = '<div class="horae-empty-hint">暂无关系记录，AI会在角色互动时自动记录</div>';
        return;
    }
    
    const html = relationships.map((rel, idx) => `
        <div class="horae-relationship-item" data-rel-index="${idx}">
            <div class="horae-rel-content">
                <span class="horae-rel-from">${rel.from}</span>
                <span class="horae-rel-arrow">→</span>
                <span class="horae-rel-to">${rel.to}</span>
                <span class="horae-rel-type">${rel.type}</span>
                ${rel.note ? `<span class="horae-rel-note">${rel.note}</span>` : ''}
            </div>
            <div class="horae-rel-actions">
                <button class="horae-rel-edit" title="编辑"><i class="fa-solid fa-pen"></i></button>
                <button class="horae-rel-delete" title="删除"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
    
    listEl.innerHTML = html;
    
    // 绑定编辑/删除事件
    listEl.querySelectorAll('.horae-rel-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.closest('.horae-relationship-item').dataset.relIndex);
            openRelationshipEditModal(idx);
        });
    });
    
    listEl.querySelectorAll('.horae-rel-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = parseInt(btn.closest('.horae-relationship-item').dataset.relIndex);
            const rels = horaeManager.getRelationships();
            const rel = rels[idx];
            if (!confirm(`确定删除 ${rel.from} → ${rel.to} 的关系？`)) return;
            rels.splice(idx, 1);
            horaeManager.setRelationships(rels);
            await getContext().saveChat();
            updateRelationshipDisplay();
            showToast('关系已删除', 'info');
        });
    });
}

function openRelationshipEditModal(editIndex = null) {
    closeEditModal();
    const rels = horaeManager.getRelationships();
    const isEdit = editIndex !== null && editIndex >= 0;
    const existing = isEdit ? rels[editIndex] : { from: '', to: '', type: '', note: '' };
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-diagram-project"></i> ${isEdit ? '编辑关系' : '添加关系'}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>角色A</label>
                        <input type="text" id="horae-rel-from" value="${escapeHtml(existing.from)}" placeholder="角色名（关系发起方）">
                    </div>
                    <div class="horae-edit-field">
                        <label>角色B</label>
                        <input type="text" id="horae-rel-to" value="${escapeHtml(existing.to)}" placeholder="角色名（关系接收方）">
                    </div>
                    <div class="horae-edit-field">
                        <label>关系类型</label>
                        <input type="text" id="horae-rel-type" value="${escapeHtml(existing.type)}" placeholder="如：朋友、恋人、上下级、师徒">
                    </div>
                    <div class="horae-edit-field">
                        <label>备注（可选）</label>
                        <input type="text" id="horae-rel-note" value="${escapeHtml(existing.note || '')}" placeholder="关系的补充说明">
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="horae-rel-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="horae-rel-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    document.getElementById('horae-edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'horae-edit-modal') closeEditModal();
    });
    
    document.getElementById('horae-rel-modal-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        const from = document.getElementById('horae-rel-from').value.trim();
        const to = document.getElementById('horae-rel-to').value.trim();
        const type = document.getElementById('horae-rel-type').value.trim();
        const note = document.getElementById('horae-rel-note').value.trim();
        
        if (!from || !to || !type) {
            showToast('角色名和关系类型不能为空', 'warning');
            return;
        }
        
        if (isEdit) {
            rels[editIndex] = { from, to, type, note };
        } else {
            rels.push({ from, to, type, note });
        }
        
        horaeManager.setRelationships(rels);
        await getContext().saveChat();
        updateRelationshipDisplay();
        closeEditModal();
        showToast(isEdit ? '关系已更新' : '关系已添加', 'success');
    });
    
    document.getElementById('horae-rel-modal-cancel').addEventListener('click', () => closeEditModal());
}

/**
 * 切换NPC星标状态
 */
function toggleNpcFavorite(npcName) {
    if (!settings.favoriteNpcs) {
        settings.favoriteNpcs = [];
    }
    
    const index = settings.favoriteNpcs.indexOf(npcName);
    if (index > -1) {
        // 取消星标
        settings.favoriteNpcs.splice(index, 1);
        showToast(`已取消 ${npcName} 的星标`, 'info');
    } else {
        // 添加星标
        settings.favoriteNpcs.push(npcName);
        showToast(`已将 ${npcName} 添加到星标`, 'success');
    }
    
    saveSettings();
    updateCharactersDisplay();
}

/**
 * 更新物品页面显示
 */
function updateItemsDisplay() {
    const state = horaeManager.getLatestState();
    const listEl = document.getElementById('horae-items-full-list');
    const filterEl = document.getElementById('horae-items-filter');
    const holderFilterEl = document.getElementById('horae-items-holder-filter');
    const searchEl = document.getElementById('horae-items-search');
    
    if (!listEl) return;
    
    const filterValue = filterEl?.value || 'all';
    const holderFilter = holderFilterEl?.value || 'all';
    const searchQuery = (searchEl?.value || '').trim().toLowerCase();
    let entries = Object.entries(state.items || {});
    
    if (holderFilterEl) {
        const currentHolder = holderFilterEl.value;
        const holders = new Set();
        entries.forEach(([name, info]) => {
            if (info.holder) holders.add(info.holder);
        });
        
        // 保留当前选项，更新选项列表
        const holderOptions = ['<option value="all">所有人</option>'];
        holders.forEach(holder => {
            holderOptions.push(`<option value="${holder}" ${holder === currentHolder ? 'selected' : ''}>${holder}</option>`);
        });
        holderFilterEl.innerHTML = holderOptions.join('');
    }
    
    // 搜索物品 - 按关键字
    if (searchQuery) {
        entries = entries.filter(([name, info]) => {
            const searchTarget = `${name} ${info.icon || ''} ${info.description || ''} ${info.holder || ''} ${info.location || ''}`.toLowerCase();
            return searchTarget.includes(searchQuery);
        });
    }
    
    // 筛选物品 - 按重要程度
    if (filterValue !== 'all') {
        entries = entries.filter(([name, info]) => info.importance === filterValue);
    }
    
    // 筛选物品 - 按持有人
    if (holderFilter !== 'all') {
        entries = entries.filter(([name, info]) => info.holder === holderFilter);
    }
    
    if (entries.length === 0) {
        let emptyMsg = '暂无追踪的物品';
        if (filterValue !== 'all' || holderFilter !== 'all' || searchQuery) {
            emptyMsg = '没有符合筛选条件的物品';
        }
        listEl.innerHTML = `
            <div class="horae-empty-state">
                <i class="fa-solid fa-box-open"></i>
                <span>${emptyMsg}</span>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = entries.map(([name, info]) => {
        const icon = info.icon || '📦';
        const importance = info.importance || '';
        // 支持两种格式：""/"!"/"!!" 和 "一般"/"重要"/"关键"
        const isCritical = importance === '!!' || importance === '关键';
        const isImportant = importance === '!' || importance === '重要';
        const importanceClass = isCritical ? 'critical' : isImportant ? 'important' : 'normal';
        // 显示中文标签
        const importanceLabel = isCritical ? '关键' : isImportant ? '重要' : '';
        const importanceBadge = importanceLabel ? `<span class="horae-item-importance ${importanceClass}">${importanceLabel}</span>` : '';
        
        // 修复显示格式：持有者 · 位置
        let positionStr = '';
        if (info.holder && info.location) {
            positionStr = `<span class="holder">${info.holder}</span> · ${info.location}`;
        } else if (info.holder) {
            positionStr = `<span class="holder">${info.holder}</span> 持有`;
        } else if (info.location) {
            positionStr = `位于 ${info.location}`;
        } else {
            positionStr = '位置未知';
        }
        
        const isSelected = selectedItems.has(name);
        const selectedClass = isSelected ? 'selected' : '';
        const checkboxDisplay = itemsMultiSelectMode ? 'flex' : 'none';
        const description = info.description || '';
        const descHtml = description ? `<div class="horae-full-item-desc">${description}</div>` : '';
        
        return `
            <div class="horae-full-item horae-editable-item ${importanceClass} ${selectedClass}" data-item-name="${name}">
                <div class="horae-item-checkbox" style="display: ${checkboxDisplay}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="horae-full-item-icon horae-item-emoji">
                    ${icon}
                </div>
                <div class="horae-full-item-info">
                    <div class="horae-full-item-name">${name} ${importanceBadge}</div>
                    <div class="horae-full-item-location">${positionStr}</div>
                    ${descHtml}
                </div>
                <button class="horae-item-edit-btn" data-edit-type="item" data-edit-name="${name}" title="编辑">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
        `;
    }).join('');
    
    bindItemsEvents();
    bindEditButtons();
}

/**
 * 绑定编辑按钮事件
 */
function bindEditButtons() {
    document.querySelectorAll('.horae-item-edit-btn').forEach(btn => {
        // 移除旧的监听器（避免重复绑定）
        btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll('.horae-item-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const editType = btn.dataset.editType;
            const editName = btn.dataset.editName;
            const messageId = btn.dataset.messageId;
            
            if (editType === 'item') {
                openItemEditModal(editName);
            } else if (editType === 'npc') {
                openNpcEditModal(editName);
            } else if (editType === 'event') {
                const eventIndex = parseInt(btn.dataset.eventIndex) || 0;
                openEventEditModal(parseInt(messageId), eventIndex);
            } else if (editType === 'affection') {
                const charName = btn.dataset.char;
                openAffectionEditModal(charName);
            }
        });
    });
}

/**
 * 打开物品编辑弹窗
 */
function openItemEditModal(itemName) {
    const state = horaeManager.getLatestState();
    const item = state.items?.[itemName];
    if (!item) {
        showToast('找不到该物品', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-pen"></i> 编辑物品
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>物品名称</label>
                        <input type="text" id="edit-item-name" value="${itemName}" placeholder="物品名称">
                    </div>
                    <div class="horae-edit-field">
                        <label>图标 (emoji)</label>
                        <input type="text" id="edit-item-icon" value="${item.icon || ''}" maxlength="2" placeholder="📦">
                    </div>
                    <div class="horae-edit-field">
                        <label>重要程度</label>
                        <select id="edit-item-importance">
                            <option value="" ${!item.importance || item.importance === '一般' || item.importance === '' ? 'selected' : ''}>一般</option>
                            <option value="!" ${item.importance === '!' || item.importance === '重要' ? 'selected' : ''}>重要 !</option>
                            <option value="!!" ${item.importance === '!!' || item.importance === '关键' ? 'selected' : ''}>关键 !!</option>
                        </select>
                    </div>
                    <div class="horae-edit-field">
                        <label>描述 (特殊功能/来源等)</label>
                        <textarea id="edit-item-desc" placeholder="如：爱丽丝在约会时赠送的">${item.description || ''}</textarea>
                    </div>
                    <div class="horae-edit-field">
                        <label>持有者</label>
                        <input type="text" id="edit-item-holder" value="${item.holder || ''}" placeholder="角色名">
                    </div>
                    <div class="horae-edit-field">
                        <label>位置</label>
                        <input type="text" id="edit-item-location" value="${item.location || ''}" placeholder="如：背包、口袋、家里茶几上">
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    document.getElementById('edit-modal-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const newName = document.getElementById('edit-item-name').value.trim();
        if (!newName) {
            showToast('物品名称不能为空', 'error');
            return;
        }
        
        const newData = {
            icon: document.getElementById('edit-item-icon').value || item.icon,
            importance: document.getElementById('edit-item-importance').value,
            description: document.getElementById('edit-item-desc').value,
            holder: document.getElementById('edit-item-holder').value,
            location: document.getElementById('edit-item-location').value
        };
        
        // 更新所有消息中的该物品
        const chat = horaeManager.getChat();
        const nameChanged = newName !== itemName;
        
        for (let i = 0; i < chat.length; i++) {
            const meta = chat[i].horae_meta;
            if (meta?.items?.[itemName]) {
                if (nameChanged) {
                    // 名称改变：删除旧名，创建新名
                    meta.items[newName] = { ...meta.items[itemName], ...newData };
                    delete meta.items[itemName];
                } else {
                    // 名称未变：直接更新
                    Object.assign(meta.items[itemName], newData);
                }
            }
        }
        
        await getContext().saveChat();
        closeEditModal();
        updateItemsDisplay();
        updateStatusDisplay();
        showToast(nameChanged ? '物品已重命名并更新' : '物品已更新', 'success');
    });
    
    document.getElementById('edit-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeEditModal();
    });
}

/**
 * 打开好感度编辑弹窗
 */
function openAffectionEditModal(charName) {
    const state = horaeManager.getLatestState();
    const currentValue = state.affection?.[charName] || 0;
    const numValue = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue) || 0;
    const level = horaeManager.getAffectionLevel(numValue);
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-heart"></i> 编辑好感度: ${charName}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>当前好感度</label>
                        <input type="number" step="0.1" id="edit-affection-value" value="${numValue}" placeholder="0-100">
                    </div>
                    <div class="horae-edit-field">
                        <label>好感等级</label>
                        <span class="horae-affection-level-preview">${level}</span>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="edit-modal-delete" class="horae-btn danger">
                        <i class="fa-solid fa-trash"></i> 删除
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    // 实时更新好感等级预览
    document.getElementById('edit-affection-value').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 0;
        const newLevel = horaeManager.getAffectionLevel(val);
        document.querySelector('.horae-affection-level-preview').textContent = newLevel;
    });
    
    document.getElementById('edit-modal-save').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const newValue = parseFloat(document.getElementById('edit-affection-value').value) || 0;
        
        const chat = horaeManager.getChat();
        let lastMessageWithAffection = -1;
        
        for (let i = chat.length - 1; i >= 0; i--) {
            const meta = chat[i].horae_meta;
            if (meta?.affection?.[charName] !== undefined) {
                lastMessageWithAffection = i;
                break;
            }
        }
        
        if (lastMessageWithAffection >= 0) {
            chat[lastMessageWithAffection].horae_meta.affection[charName] = { 
                type: 'absolute', 
                value: newValue 
            };
        } else {
            const lastMeta = chat[chat.length - 1]?.horae_meta;
            if (lastMeta) {
                if (!lastMeta.affection) lastMeta.affection = {};
                lastMeta.affection[charName] = { type: 'absolute', value: newValue };
            }
        }
        
        getContext().saveChat();
        closeEditModal();
        updateCharactersDisplay();
        showToast('好感度已更新', 'success');
    });

    // 删除该角色的全部好感度记录
    document.getElementById('edit-modal-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!confirm(`确定删除「${charName}」的好感度记录？将从所有消息中移除。`)) return;
        const chat = horaeManager.getChat();
        let removed = 0;
        for (let i = 0; i < chat.length; i++) {
            const meta = chat[i].horae_meta;
            if (meta?.affection?.[charName] !== undefined) {
                delete meta.affection[charName];
                removed++;
            }
        }
        getContext().saveChat();
        closeEditModal();
        updateCharactersDisplay();
        showToast(`已删除「${charName}」的好感度（${removed} 条记录）`, 'info');
    });
    
    document.getElementById('edit-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeEditModal();
    });
}

/**
 * 打开NPC编辑弹窗
 */
function openNpcEditModal(npcName) {
    const state = horaeManager.getLatestState();
    const npc = state.npcs?.[npcName];
    if (!npc) {
        showToast('找不到该角色', 'error');
        return;
    }
    
    const isPinned = (settings.pinnedNpcs || []).includes(npcName);
    
    // 性别选项
    const genderVal = npc.gender || '';
    const genderOptions = [
        { val: '', label: '未知' },
        { val: '男', label: '男' },
        { val: '女', label: '女' },
        { val: '其他', label: '其他' }
    ].map(o => `<option value="${o.val}" ${genderVal === o.val ? 'selected' : ''}>${o.label}</option>`).join('');
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-pen"></i> 编辑角色: ${npcName}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                            <input type="checkbox" id="edit-npc-pinned" ${isPinned ? 'checked' : ''}>
                            <i class="fa-solid fa-crown" style="color:${isPinned ? '#b388ff' : '#666'}"></i>
                            标记为重要角色（置顶+特殊边框）
                        </label>
                    </div>
                    <div class="horae-edit-field-row">
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>性别</label>
                            <select id="edit-npc-gender">${genderOptions}</select>
                        </div>
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>年龄${(() => {
                                const ar = horaeManager.calcCurrentAge(npc, state.timestamp?.story_date);
                                return ar.changed ? ` <span style="font-weight:normal;color:var(--horae-accent)">(当前推算:${ar.display})</span>` : '';
                            })()}</label>
                            <input type="text" id="edit-npc-age" value="${npc.age || ''}" placeholder="如：25、约35">
                        </div>
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>种族</label>
                            <input type="text" id="edit-npc-race" value="${npc.race || ''}" placeholder="如：人类、精灵">
                        </div>
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>职业</label>
                            <input type="text" id="edit-npc-job" value="${npc.job || ''}" placeholder="如：佣兵、学生">
                        </div>
                    </div>
                    <div class="horae-edit-field">
                        <label>外貌特征</label>
                        <textarea id="edit-npc-appearance" placeholder="如：金发碧眼的年轻女性">${npc.appearance || ''}</textarea>
                    </div>
                    <div class="horae-edit-field">
                        <label>性格</label>
                        <input type="text" id="edit-npc-personality" value="${npc.personality || ''}" placeholder="如：开朗活泼">
                    </div>
                    <div class="horae-edit-field">
                        <label>身份关系</label>
                        <input type="text" id="edit-npc-relationship" value="${npc.relationship || ''}" placeholder="如：主角的邻居">
                    </div>
                    <div class="horae-edit-field">
                        <label>补充说明</label>
                        <input type="text" id="edit-npc-note" value="${npc.note || ''}" placeholder="其他重要信息（可选）">
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-delete" class="horae-btn danger" style="background:#c62828;color:#fff;margin-right:auto;">
                        <i class="fa-solid fa-trash"></i> 删除角色
                    </button>
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    // 删除NPC
    document.getElementById('edit-modal-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!confirm(`确定要删除角色「${npcName}」吗？\n\n此操作将从所有聊天记录中移除该角色的信息，且无法恢复。`)) return;
        
        const chat = horaeManager.getChat();
        for (let i = 0; i < chat.length; i++) {
            const meta = chat[i].horae_meta;
            if (meta?.npcs?.[npcName]) {
                delete meta.npcs[npcName];
            }
            // 同时清除好感度中的相关记录
            if (meta?.affection?.[npcName]) {
                delete meta.affection[npcName];
            }
        }
        
        // 从星标列表移除
        if (settings.pinnedNpcs) {
            const pinIdx = settings.pinnedNpcs.indexOf(npcName);
            if (pinIdx !== -1) {
                settings.pinnedNpcs.splice(pinIdx, 1);
                saveSettings();
            }
        }
        
        await getContext().saveChat();
        closeEditModal();
        refreshAllDisplays();
        showToast(`角色「${npcName}」已删除`, 'success');
    });
    
    // 保存NPC编辑
    document.getElementById('edit-modal-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const chat = horaeManager.getChat();
        const newAge = document.getElementById('edit-npc-age').value;
        const newData = {
            appearance: document.getElementById('edit-npc-appearance').value,
            personality: document.getElementById('edit-npc-personality').value,
            relationship: document.getElementById('edit-npc-relationship').value,
            gender: document.getElementById('edit-npc-gender').value,
            age: newAge,
            race: document.getElementById('edit-npc-race').value,
            job: document.getElementById('edit-npc-job').value,
            note: document.getElementById('edit-npc-note').value
        };
        
        // 如果手动修改了年龄，更新参考日期
        const currentState = horaeManager.getLatestState();
        const ageChanged = newAge !== (npc.age || '');
        if (ageChanged && newAge) {
            newData._ageRefDate = currentState.timestamp?.story_date || '';
        }
        
        // 处理重要角色标记
        const newPinned = document.getElementById('edit-npc-pinned').checked;
        if (!settings.pinnedNpcs) settings.pinnedNpcs = [];
        const pinIdx = settings.pinnedNpcs.indexOf(npcName);
        if (newPinned && pinIdx === -1) {
            settings.pinnedNpcs.push(npcName);
        } else if (!newPinned && pinIdx !== -1) {
            settings.pinnedNpcs.splice(pinIdx, 1);
        }
        saveSettings();
        
        for (let i = 0; i < chat.length; i++) {
            const meta = chat[i].horae_meta;
            if (meta?.npcs?.[npcName]) {
                Object.assign(meta.npcs[npcName], newData);
            }
        }
        
        await getContext().saveChat();
        closeEditModal();
        updateCharactersDisplay();
        showToast('角色已更新', 'success');
    });
    
    document.getElementById('edit-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeEditModal();
    });
}

/** 打开事件编辑弹窗 */
function openEventEditModal(messageId, eventIndex = 0) {
    const meta = horaeManager.getMessageMeta(messageId);
    if (!meta) {
        showToast('找不到该消息的元数据', 'error');
        return;
    }
    
    // 兼容新旧事件格式
    const eventsArr = meta.events || (meta.event ? [meta.event] : []);
    const event = eventsArr[eventIndex] || {};
    const totalEvents = eventsArr.length;
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-pen"></i> 编辑事件 #${messageId}${totalEvents > 1 ? ` (${eventIndex + 1}/${totalEvents})` : ''}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>事件级别</label>
                        <select id="edit-event-level">
                            <option value="一般" ${event.level === '一般' || !event.level ? 'selected' : ''}>一般</option>
                            <option value="重要" ${event.level === '重要' ? 'selected' : ''}>重要</option>
                            <option value="关键" ${event.level === '关键' ? 'selected' : ''}>关键</option>
                            <option value="摘要" ${event.level === '摘要' ? 'selected' : ''}>摘要</option>
                        </select>
                    </div>
                    <div class="horae-edit-field">
                        <label>事件摘要</label>
                        <textarea id="edit-event-summary" placeholder="描述这个事件...">${event.summary || ''}</textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-delete" class="horae-btn danger">
                        <i class="fa-solid fa-trash"></i> 删除
                    </button>
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    document.getElementById('edit-modal-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const chat = horaeManager.getChat();
        const chatMeta = chat[messageId]?.horae_meta;
        if (chatMeta) {
            const newLevel = document.getElementById('edit-event-level').value;
            const newSummary = document.getElementById('edit-event-summary').value.trim();
            
            // 防呆提示：摘要为空等同于删除
            if (!newSummary) {
                if (!confirm('事件摘要为空！\n\n保存后此事件将被删除。\n\n确定要删除此事件吗？')) {
                    return;
                }
                // 用户确认删除，执行删除逻辑
                if (!chatMeta.events) {
                    chatMeta.events = chatMeta.event ? [chatMeta.event] : [];
                }
                if (chatMeta.events.length > eventIndex) {
                    chatMeta.events.splice(eventIndex, 1);
                }
                delete chatMeta.event;
                
                await getContext().saveChat();
                closeEditModal();
                updateTimelineDisplay();
                showToast('事件已删除', 'success');
                return;
            }
            
            // 确保events数组存在
            if (!chatMeta.events) {
                chatMeta.events = chatMeta.event ? [chatMeta.event] : [];
            }
            
            // 更新或添加事件
            const isSummaryLevel = newLevel === '摘要';
            if (chatMeta.events[eventIndex]) {
                chatMeta.events[eventIndex] = {
                    is_important: newLevel === '重要' || newLevel === '关键',
                    level: newLevel,
                    summary: newSummary,
                    ...(isSummaryLevel ? { isSummary: true } : {})
                };
            } else {
                chatMeta.events.push({
                    is_important: newLevel === '重要' || newLevel === '关键',
                    level: newLevel,
                    summary: newSummary,
                    ...(isSummaryLevel ? { isSummary: true } : {})
                });
            }
            
            // 清除旧格式
            delete chatMeta.event;
        }
        
        await getContext().saveChat();
        closeEditModal();
        updateTimelineDisplay();
        showToast('事件已更新', 'success');
    });
    
    // 删除事件（带确认）
    document.getElementById('edit-modal-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (confirm('确定要删除这个事件吗？\n\n⚠️ 此操作无法撤销！')) {
            const chat = horaeManager.getChat();
            const chatMeta = chat[messageId]?.horae_meta;
            if (chatMeta) {
                // 确保events数组存在
                if (!chatMeta.events) {
                    chatMeta.events = chatMeta.event ? [chatMeta.event] : [];
                }
                
                // 删除指定索引的事件
                if (chatMeta.events.length > eventIndex) {
                    chatMeta.events.splice(eventIndex, 1);
                }
                
                // 清除旧格式
                delete chatMeta.event;
                
                getContext().saveChat();
                closeEditModal();
                updateTimelineDisplay();
                showToast('事件已删除', 'success');
            }
        }
    });
    
    document.getElementById('edit-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeEditModal();
    });
}

/**
 * 关闭编辑弹窗
 */
function closeEditModal() {
    const modal = document.getElementById('horae-edit-modal');
    if (modal) modal.remove();
}

/** 阻止编辑弹窗事件冒泡 */
function preventModalBubble() {
    const targets = [
        document.getElementById('horae-edit-modal'),
        ...document.querySelectorAll('.horae-edit-modal-backdrop')
    ].filter(Boolean);

    targets.forEach(modal => {
        // 继承主题模式
        if (settings.themeMode === 'light') modal.classList.add('horae-light');

        ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(evType => {
            modal.addEventListener(evType, (e) => {
                e.stopPropagation();
            });
        });
    });
}

// ============================================
// Excel风格自定义表格功能
// ============================================

let activeContextMenu = null;

/**
 * 渲染自定义表格列表
 */
function renderCustomTablesList() {
    const listEl = document.getElementById('horae-custom-tables-list');
    if (!listEl) return;

    const globalTables = getGlobalTables();
    const chatTables = getChatTables();

    if (globalTables.length === 0 && chatTables.length === 0) {
        listEl.innerHTML = `
            <div class="horae-custom-tables-empty">
                <i class="fa-solid fa-table-cells"></i>
                <div>暂无自定义表格</div>
                <div style="font-size:11px;opacity:0.7;margin-top:4px;">点击下方按钮添加表格</div>
            </div>
        `;
        return;
    }

    /** 渲染单个表格 */
    function renderOneTable(table, idx, scope) {
        const rows = table.rows || 2;
        const cols = table.cols || 2;
        const data = table.data || {};
        const lockedRows = new Set(table.lockedRows || []);
        const lockedCols = new Set(table.lockedCols || []);
        const lockedCells = new Set(table.lockedCells || []);
        const isGlobal = scope === 'global';
        const scopeIcon = isGlobal ? 'fa-globe' : 'fa-bookmark';
        const scopeLabel = isGlobal ? '全局' : '本地';
        const scopeTitle = isGlobal ? '全局表格，所有对话共享' : '本地表格，仅当前对话';

        let tableHtml = '<table class="horae-excel-table">';
        for (let r = 0; r < rows; r++) {
            const rowLocked = lockedRows.has(r);
            tableHtml += '<tr>';
            for (let c = 0; c < cols; c++) {
                const cellKey = `${r}-${c}`;
                const cellValue = data[cellKey] || '';
                const isHeader = r === 0 || c === 0;
                const tag = isHeader ? 'th' : 'td';
                const cellLocked = rowLocked || lockedCols.has(c) || lockedCells.has(cellKey);
                const charLen = [...cellValue].reduce((sum, ch) => sum + (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
                const inputSize = Math.max(4, Math.min(charLen + 2, 40));
                const lockedClass = cellLocked ? ' horae-cell-locked' : '';
                tableHtml += `<${tag} data-row="${r}" data-col="${c}" class="${lockedClass}">`;
                tableHtml += `<input type="text" value="${escapeHtml(cellValue)}" size="${inputSize}" data-scope="${scope}" data-table="${idx}" data-row="${r}" data-col="${c}" placeholder="${isHeader ? '表头' : ''}">`;
                tableHtml += `</${tag}>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</table>';

        return `
            <div class="horae-excel-table-container" data-table-index="${idx}" data-scope="${scope}">
                <div class="horae-excel-table-header">
                    <div class="horae-excel-table-title">
                        <i class="fa-solid ${scopeIcon}" title="${scopeTitle}" style="color:${isGlobal ? 'var(--horae-accent)' : 'var(--horae-primary-light)'}; cursor:pointer;" data-toggle-scope="${idx}" data-scope="${scope}"></i>
                        <span class="horae-table-scope-label" data-toggle-scope="${idx}" data-scope="${scope}" title="点击切换全局/本地">${scopeLabel}</span>
                        <input type="text" value="${escapeHtml(table.name || '')}" placeholder="表格名称" data-table-name="${idx}" data-scope="${scope}">
                    </div>
                    <div class="horae-excel-table-actions">
                        <button class="clear-table-data-btn" title="清空数据（保留表头）" data-table-index="${idx}" data-scope="${scope}">
                            <i class="fa-solid fa-eraser"></i>
                        </button>
                        <button class="export-table-btn" title="导出表格" data-table-index="${idx}" data-scope="${scope}">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <button class="delete-table-btn danger" title="删除表格" data-table-index="${idx}" data-scope="${scope}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                <div class="horae-excel-table-wrapper">
                    ${tableHtml}
                </div>
                <div class="horae-table-prompt-row">
                    <input type="text" value="${escapeHtml(table.prompt || '')}" placeholder="提示词：告诉AI如何填写此表格..." data-table-prompt="${idx}" data-scope="${scope}">
                </div>
            </div>
        `;
    }

    let html = '';
    if (globalTables.length > 0) {
        html += `<div class="horae-tables-group-label"><i class="fa-solid fa-globe"></i> 全局表格</div>`;
        html += globalTables.map((t, i) => renderOneTable(t, i, 'global')).join('');
    }
    if (chatTables.length > 0) {
        html += `<div class="horae-tables-group-label"><i class="fa-solid fa-bookmark"></i> 本地表格（当前对话）</div>`;
        html += chatTables.map((t, i) => renderOneTable(t, i, 'local')).join('');
    }
    listEl.innerHTML = html;

    bindExcelTableEvents();
}

/**
 * HTML转义
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

/**
 * 绑定Excel表格事件
 */
function bindExcelTableEvents() {
    /** 从元素属性获取scope */
    const getScope = (el) => el.dataset.scope || el.closest('[data-scope]')?.dataset.scope || 'local';

    // 单元格输入事件 - 自动保存 + 动态调整宽度
    document.querySelectorAll('.horae-excel-table input').forEach(input => {
        input.addEventListener('change', (e) => {
            const scope = getScope(e.target);
            const tableIndex = parseInt(e.target.dataset.table);
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            const value = e.target.value;

            const tables = getTablesByScope(scope);
            if (!tables[tableIndex]) return;
            if (!tables[tableIndex].data) tables[tableIndex].data = {};
            const key = `${row}-${col}`;
            if (value.trim()) {
                tables[tableIndex].data[key] = value;
            } else {
                delete tables[tableIndex].data[key];
            }
            // 用户手动编辑数据单元格时，清除 AI 贡献记录防止 rebuild 回填旧值
            if (row > 0 && col > 0) {
                purgeTableContributions((tables[tableIndex].name || '').trim(), scope);
            }
            setTablesByScope(scope, tables);
        });
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            const charLen = [...val].reduce((sum, ch) => sum + (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
            e.target.size = Math.max(4, Math.min(charLen + 2, 40));
        });
    });

    // 表格名称输入事件
    document.querySelectorAll('input[data-table-name]').forEach(input => {
        input.addEventListener('change', (e) => {
            const scope = getScope(e.target);
            const tableIndex = parseInt(e.target.dataset.tableName);
            const tables = getTablesByScope(scope);
            if (!tables[tableIndex]) return;
            tables[tableIndex].name = e.target.value;
            setTablesByScope(scope, tables);
        });
    });

    // 表格提示词输入事件
    document.querySelectorAll('input[data-table-prompt]').forEach(input => {
        input.addEventListener('change', (e) => {
            const scope = getScope(e.target);
            const tableIndex = parseInt(e.target.dataset.tablePrompt);
            const tables = getTablesByScope(scope);
            if (!tables[tableIndex]) return;
            tables[tableIndex].prompt = e.target.value;
            setTablesByScope(scope, tables);
        });
    });

    // 导出表格按钮
    document.querySelectorAll('.export-table-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const scope = getScope(btn);
            const tableIndex = parseInt(btn.dataset.tableIndex);
            exportTable(tableIndex, scope);
        });
    });

    // 删除表格按钮
    document.querySelectorAll('.delete-table-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const container = btn.closest('.horae-excel-table-container');
            const scope = getScope(container);
            const tableIndex = parseInt(container.dataset.tableIndex);
            deleteCustomTable(tableIndex, scope);
        });
    });

    // 清空表格数据按钮（保留表头）
    document.querySelectorAll('.clear-table-data-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const scope = getScope(btn);
            const tableIndex = parseInt(btn.dataset.tableIndex);
            clearTableData(tableIndex, scope);
        });
    });

    // 全局/本地切换
    document.querySelectorAll('[data-toggle-scope]').forEach(el => {
        el.addEventListener('click', (e) => {
            const currentScope = el.dataset.scope;
            const tableIndex = parseInt(el.dataset.toggleScope);
            toggleTableScope(tableIndex, currentScope);
        });
    });
    
    // 所有单元格长按/右键显示菜单
    document.querySelectorAll('.horae-excel-table th, .horae-excel-table td').forEach(cell => {
        let pressTimer = null;

        const startPress = (e) => {
            pressTimer = setTimeout(() => {
                const tableContainer = cell.closest('.horae-excel-table-container');
                const tableIndex = parseInt(tableContainer.dataset.tableIndex);
                const scope = tableContainer.dataset.scope || 'local';
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                showTableContextMenu(e, tableIndex, row, col, scope);
            }, 500);
        };

        const cancelPress = () => {
            if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        };

        cell.addEventListener('mousedown', (e) => { e.stopPropagation(); startPress(e); });
        cell.addEventListener('touchstart', (e) => { e.stopPropagation(); startPress(e); }, { passive: false });
        cell.addEventListener('mouseup', (e) => { e.stopPropagation(); cancelPress(); });
        cell.addEventListener('mouseleave', cancelPress);
        cell.addEventListener('touchend', (e) => { e.stopPropagation(); cancelPress(); });
        cell.addEventListener('touchcancel', cancelPress);

        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const tableContainer = cell.closest('.horae-excel-table-container');
            const tableIndex = parseInt(tableContainer.dataset.tableIndex);
            const scope = tableContainer.dataset.scope || 'local';
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            showTableContextMenu(e, tableIndex, row, col, scope);
        });
    });

}

/** 显示表格右键菜单 */
let contextMenuCloseHandler = null;

function showTableContextMenu(e, tableIndex, row, col, scope = 'local') {
    hideContextMenu();

    const tables = getTablesByScope(scope);
    const table = tables[tableIndex];
    if (!table) return;
    const lockedRows = new Set(table.lockedRows || []);
    const lockedCols = new Set(table.lockedCols || []);
    const lockedCells = new Set(table.lockedCells || []);
    const cellKey = `${row}-${col}`;
    const isCellLocked = lockedCells.has(cellKey) || lockedRows.has(row) || lockedCols.has(col);

    const isRowHeader = col === 0;
    const isColHeader = row === 0;
    const isCorner = row === 0 && col === 0;

    let menuItems = '';

    // 行操作（第一列所有行 / 任何单元格都能添加行）
    if (isCorner) {
        menuItems += `
            <div class="horae-context-menu-item" data-action="add-row-below"><i class="fa-solid fa-plus"></i> 添加行</div>
            <div class="horae-context-menu-item" data-action="add-col-right"><i class="fa-solid fa-plus"></i> 添加列</div>
        `;
    } else if (isColHeader) {
        const colLocked = lockedCols.has(col);
        menuItems += `
            <div class="horae-context-menu-item" data-action="add-col-left"><i class="fa-solid fa-arrow-left"></i> 左侧添加列</div>
            <div class="horae-context-menu-item" data-action="add-col-right"><i class="fa-solid fa-arrow-right"></i> 右侧添加列</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item" data-action="toggle-lock-col"><i class="fa-solid ${colLocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${colLocked ? '解锁此列' : '锁定此列'}</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item danger" data-action="delete-col"><i class="fa-solid fa-trash-can"></i> 删除此列</div>
        `;
    } else if (isRowHeader) {
        const rowLocked = lockedRows.has(row);
        menuItems += `
            <div class="horae-context-menu-item" data-action="add-row-above"><i class="fa-solid fa-arrow-up"></i> 上方添加行</div>
            <div class="horae-context-menu-item" data-action="add-row-below"><i class="fa-solid fa-arrow-down"></i> 下方添加行</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item" data-action="toggle-lock-row"><i class="fa-solid ${rowLocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${rowLocked ? '解锁此行' : '锁定此行'}</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item danger" data-action="delete-row"><i class="fa-solid fa-trash-can"></i> 删除此行</div>
        `;
    } else {
        // 普通数据单元格
        menuItems += `
            <div class="horae-context-menu-item" data-action="add-row-above"><i class="fa-solid fa-arrow-up"></i> 上方添加行</div>
            <div class="horae-context-menu-item" data-action="add-row-below"><i class="fa-solid fa-arrow-down"></i> 下方添加行</div>
            <div class="horae-context-menu-item" data-action="add-col-left"><i class="fa-solid fa-arrow-left"></i> 左侧添加列</div>
            <div class="horae-context-menu-item" data-action="add-col-right"><i class="fa-solid fa-arrow-right"></i> 右侧添加列</div>
        `;
    }

    // 所有非角落单元格都可以锁定/解锁单格
    if (!isCorner) {
        const cellLocked = lockedCells.has(cellKey);
        menuItems += `
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item" data-action="toggle-lock-cell"><i class="fa-solid ${cellLocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${cellLocked ? '解锁此格' : '锁定此格'}</div>
        `;
    }
    
    const menu = document.createElement('div');
    menu.className = 'horae-context-menu';
    if (settings.themeMode === 'light') menu.classList.add('horae-light');
    menu.innerHTML = menuItems;
    
    // 获取位置
    const x = e.clientX || e.touches?.[0]?.clientX || 100;
    const y = e.clientY || e.touches?.[0]?.clientY || 100;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    document.body.appendChild(menu);
    activeContextMenu = menu;
    
    // 确保菜单不超出屏幕
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
    
    // 绑定菜单项点击 - 执行操作后关闭菜单
    menu.querySelectorAll('.horae-context-menu-item').forEach(item => {
        item.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            const action = item.dataset.action;
            hideContextMenu();
            setTimeout(() => {
                executeTableAction(tableIndex, row, col, action, scope);
            }, 10);
        });
        
        item.addEventListener('touchend', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            const action = item.dataset.action;
            hideContextMenu();
            setTimeout(() => {
                executeTableAction(tableIndex, row, col, action, scope);
            }, 10);
        });
    });
    
    ['click', 'touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(eventType => {
        menu.addEventListener(eventType, (ev) => {
            ev.stopPropagation();
            ev.stopImmediatePropagation();
        });
    });
    
    // 延迟绑定，避免当前事件触发
    setTimeout(() => {
        contextMenuCloseHandler = (ev) => {
            if (activeContextMenu && !activeContextMenu.contains(ev.target)) {
                hideContextMenu();
            }
        };
        document.addEventListener('click', contextMenuCloseHandler, true);
        document.addEventListener('touchstart', contextMenuCloseHandler, true);
    }, 50);
    
    e.preventDefault();
    e.stopPropagation();
}

/**
 * 隐藏右键菜单
 */
function hideContextMenu() {
    if (contextMenuCloseHandler) {
        document.removeEventListener('click', contextMenuCloseHandler, true);
        document.removeEventListener('touchstart', contextMenuCloseHandler, true);
        contextMenuCloseHandler = null;
    }
    
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
}

/**
 * 执行表格操作
 */
function executeTableAction(tableIndex, row, col, action, scope = 'local') {
    // 先将DOM中未提交的输入值写入data，防止正在编辑的值丢失
    const container = document.querySelector(`.horae-excel-table-container[data-table-index="${tableIndex}"][data-scope="${scope}"]`);
    if (container) {
        const tbl = getTablesByScope(scope)[tableIndex];
        if (tbl) {
            if (!tbl.data) tbl.data = {};
            container.querySelectorAll('.horae-excel-table input[data-table]').forEach(inp => {
                const r = parseInt(inp.dataset.row);
                const c = parseInt(inp.dataset.col);
                tbl.data[`${r}-${c}`] = inp.value;
            });
        }
    }

    const tables = getTablesByScope(scope);
    const table = tables[tableIndex];
    if (!table) return;

    const oldRows = table.rows || 2;
    const oldCols = table.cols || 2;
    const oldData = table.data || {};
    const newData = {};

    switch (action) {
        case 'add-row-above':
            table.rows = oldRows + 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                newData[`${r >= row ? r + 1 : r}-${c}`] = val;
            }
            table.data = newData;
            break;

        case 'add-row-below':
            table.rows = oldRows + 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                newData[`${r > row ? r + 1 : r}-${c}`] = val;
            }
            table.data = newData;
            break;

        case 'add-col-left':
            table.cols = oldCols + 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                newData[`${r}-${c >= col ? c + 1 : c}`] = val;
            }
            table.data = newData;
            break;

        case 'add-col-right':
            table.cols = oldCols + 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                newData[`${r}-${c > col ? c + 1 : c}`] = val;
            }
            table.data = newData;
            break;

        case 'delete-row':
            if (oldRows <= 2) { showToast('表格至少需要2行', 'warning'); return; }
            table.rows = oldRows - 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                if (r === row) continue;
                newData[`${r > row ? r - 1 : r}-${c}`] = val;
            }
            table.data = newData;
            purgeTableContributions((table.name || '').trim(), scope);
            break;

        case 'delete-col':
            if (oldCols <= 2) { showToast('表格至少需要2列', 'warning'); return; }
            table.cols = oldCols - 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                if (c === col) continue;
                newData[`${r}-${c > col ? c - 1 : c}`] = val;
            }
            table.data = newData;
            purgeTableContributions((table.name || '').trim(), scope);
            break;

        case 'toggle-lock-row': {
            if (!table.lockedRows) table.lockedRows = [];
            const idx = table.lockedRows.indexOf(row);
            if (idx >= 0) {
                table.lockedRows.splice(idx, 1);
                showToast(`已解锁第 ${row + 1} 行`, 'info');
            } else {
                table.lockedRows.push(row);
                showToast(`已锁定第 ${row + 1} 行（AI无法编辑）`, 'success');
            }
            break;
        }

        case 'toggle-lock-col': {
            if (!table.lockedCols) table.lockedCols = [];
            const idx = table.lockedCols.indexOf(col);
            if (idx >= 0) {
                table.lockedCols.splice(idx, 1);
                showToast(`已解锁第 ${col + 1} 列`, 'info');
            } else {
                table.lockedCols.push(col);
                showToast(`已锁定第 ${col + 1} 列（AI无法编辑）`, 'success');
            }
            break;
        }

        case 'toggle-lock-cell': {
            if (!table.lockedCells) table.lockedCells = [];
            const cellKey = `${row}-${col}`;
            const idx = table.lockedCells.indexOf(cellKey);
            if (idx >= 0) {
                table.lockedCells.splice(idx, 1);
                showToast(`已解锁单元格 [${row},${col}]`, 'info');
            } else {
                table.lockedCells.push(cellKey);
                showToast(`已锁定单元格 [${row},${col}]（AI无法编辑）`, 'success');
            }
            break;
        }
    }

    setTablesByScope(scope, tables);
    renderCustomTablesList();
}

/**
 * 添加新的2x2表格
 */
function addNewExcelTable(scope = 'local') {
    const tables = getTablesByScope(scope);

    tables.push({
        id: Date.now().toString(),
        name: '',
        rows: 2,
        cols: 2,
        data: {},
        baseData: {},
        baseRows: 2,
        baseCols: 2,
        prompt: '',
        lockedRows: [],
        lockedCols: [],
        lockedCells: []
    });

    setTablesByScope(scope, tables);
    renderCustomTablesList();
    showToast(scope === 'global' ? '已添加全局表格' : '已添加本地表格', 'success');
}

/**
 * 删除表格
 */
function deleteCustomTable(index, scope = 'local') {
    if (!confirm('确定要删除此表格吗？')) return;

    const tables = getTablesByScope(scope);
    const deletedTable = tables[index];
    const deletedName = (deletedTable?.name || '').trim();
    tables.splice(index, 1);
    setTablesByScope(scope, tables);

    // 清除所有消息中引用该表格名的 tableContributions
    const chat = horaeManager.getChat();
    if (deletedName) {
        for (let i = 0; i < chat.length; i++) {
            const meta = chat[i]?.horae_meta;
            if (meta?.tableContributions) {
                meta.tableContributions = meta.tableContributions.filter(
                    tc => (tc.name || '').trim() !== deletedName
                );
                if (meta.tableContributions.length === 0) {
                    delete meta.tableContributions;
                }
            }
        }
    }

    // 全局表格：清除 per-card overlay
    if (scope === 'global' && deletedName && chat?.[0]?.horae_meta?.globalTableData) {
        delete chat[0].horae_meta.globalTableData[deletedName];
    }

    horaeManager.rebuildTableData();
    getContext().saveChat();
    renderCustomTablesList();
    showToast('表格已删除', 'info');
}

/** 清除指定表格的所有 tableContributions，并在当前消息记录用户编辑快照 */
function purgeTableContributions(tableName, scope = 'local') {
    if (!tableName) return;
    const chat = horaeManager.getChat();
    if (!chat?.length) return;

    // 收集当前完整数据快照（数据单元格 r>=1, c>=1）
    const tables = getTablesByScope(scope);
    const table = tables.find(t => (t.name || '').trim() === tableName);
    const snapshot = {};
    if (table?.data) {
        for (const [key, val] of Object.entries(table.data)) {
            const [r, c] = key.split('-').map(Number);
            if (r >= 1 && c >= 1 && val) snapshot[key] = val;
        }
    }

    // 在最后一条消息上记录用户编辑快照（替换同一消息上旧的同名快照）
    const lastIdx = chat.length - 1;
    if (lastIdx >= 0) {
        const lastMsg = chat[lastIdx];
        if (lastMsg?.horae_meta?.tableContributions) {
            lastMsg.horae_meta.tableContributions = lastMsg.horae_meta.tableContributions.filter(
                tc => !((tc.name || '').trim() === tableName && tc._isUserEdit)
            );
        }
    }
    if (lastIdx >= 0 && Object.keys(snapshot).length > 0) {
        const lastMsg = chat[lastIdx];
        if (!lastMsg.horae_meta) lastMsg.horae_meta = createEmptyMeta();
        if (!lastMsg.horae_meta.tableContributions) lastMsg.horae_meta.tableContributions = [];
        lastMsg.horae_meta.tableContributions.push({
            name: tableName,
            updates: snapshot,
            _isUserEdit: true
        });
    }

    // 同步 baseData（header + 结构，仅保留表头，不含数据单元格）
    if (table) {
        const headerOnly = {};
        for (const [key, val] of Object.entries(table.data || {})) {
            const [r, c] = key.split('-').map(Number);
            if (r === 0 || c === 0) headerOnly[key] = val;
        }
        table.baseData = headerOnly;
        table.baseRows = table.rows;
        table.baseCols = table.cols;
    }
    if (scope === 'global' && chat[0]?.horae_meta?.globalTableData?.[tableName]) {
        const overlay = chat[0].horae_meta.globalTableData[tableName];
        const headerOnly = {};
        for (const [key, val] of Object.entries(overlay.data || {})) {
            const [r, c] = key.split('-').map(Number);
            if (r === 0 || c === 0) headerOnly[key] = val;
        }
        overlay.baseData = headerOnly;
        overlay.baseRows = overlay.rows;
        overlay.baseCols = overlay.cols;
    }
}

/** 清空表格数据区（保留第0行和第0列的表头） */
function clearTableData(index, scope = 'local') {
    if (!confirm('确定要清空此表格的数据区吗？表头将保留。\n\n将同时清除 AI 历史填写记录，防止旧数据回流。')) return;

    const tables = getTablesByScope(scope);
    if (!tables[index]) return;
    const table = tables[index];
    const data = table.data || {};
    const tableName = (table.name || '').trim();

    // 删除所有 row>0 且 col>0 的单元格数据
    for (const key of Object.keys(data)) {
        const [r, c] = key.split('-').map(Number);
        if (r > 0 && c > 0) {
            delete data[key];
        }
    }

    table.data = data;

    // 同步更新 baseData（清除数据区，保留表头）
    if (table.baseData) {
        for (const key of Object.keys(table.baseData)) {
            const [r, c] = key.split('-').map(Number);
            if (r > 0 && c > 0) {
                delete table.baseData[key];
            }
        }
    }

    // 清除所有消息中该表格的 tableContributions（防止 rebuildTableData 回放旧数据）
    const chat = horaeManager.getChat();
    if (tableName) {
        for (let i = 0; i < chat.length; i++) {
            const meta = chat[i]?.horae_meta;
            if (meta?.tableContributions) {
                meta.tableContributions = meta.tableContributions.filter(
                    tc => (tc.name || '').trim() !== tableName
                );
                if (meta.tableContributions.length === 0) {
                    delete meta.tableContributions;
                }
            }
        }
    }

    // 全局表格：同步清除 per-card overlay 的数据区和 baseData
    if (scope === 'global' && tableName && chat?.[0]?.horae_meta?.globalTableData?.[tableName]) {
        const overlay = chat[0].horae_meta.globalTableData[tableName];
        // 清 overlay.data 数据区
        for (const key of Object.keys(overlay.data || {})) {
            const [r, c] = key.split('-').map(Number);
            if (r > 0 && c > 0) delete overlay.data[key];
        }
        // 清 overlay.baseData 数据区
        if (overlay.baseData) {
            for (const key of Object.keys(overlay.baseData)) {
                const [r, c] = key.split('-').map(Number);
                if (r > 0 && c > 0) delete overlay.baseData[key];
            }
        }
    }

    setTablesByScope(scope, tables);
    horaeManager.rebuildTableData();
    getContext().saveChat();
    renderCustomTablesList();
    showToast('表格数据已清空', 'info');
}

/** 切换表格的全局/本地属性 */
function toggleTableScope(tableIndex, currentScope) {
    const newScope = currentScope === 'global' ? 'local' : 'global';
    const label = newScope === 'global' ? '全局（所有对话共享，数据按角色卡独立）' : '本地（仅当前对话）';
    if (!confirm(`将此表格转为${label}？`)) return;

    const srcTables = getTablesByScope(currentScope);
    if (!srcTables[tableIndex]) return;
    const table = JSON.parse(JSON.stringify(srcTables[tableIndex]));
    const tableName = (table.name || '').trim();

    // 从全局转本地时，清除旧的 per-card overlay
    if (currentScope === 'global' && tableName) {
        const chat = horaeManager.getChat();
        if (chat?.[0]?.horae_meta?.globalTableData) {
            delete chat[0].horae_meta.globalTableData[tableName];
        }
    }

    // 从源列表移除
    srcTables.splice(tableIndex, 1);
    setTablesByScope(currentScope, srcTables);

    // 加入目标列表
    const dstTables = getTablesByScope(newScope);
    dstTables.push(table);
    setTablesByScope(newScope, dstTables);

    renderCustomTablesList();
    getContext().saveChat();
    showToast(`表格已转为${label}`, 'success');
}


/**
 * 绑定物品列表事件
 */
function bindItemsEvents() {
    const items = document.querySelectorAll('#horae-items-full-list .horae-full-item');
    
    items.forEach(item => {
        const itemName = item.dataset.itemName;
        if (!itemName) return;
        
        // 长按进入多选模式
        item.addEventListener('mousedown', (e) => startLongPress(e, itemName));
        item.addEventListener('touchstart', (e) => startLongPress(e, itemName), { passive: true });
        item.addEventListener('mouseup', cancelLongPress);
        item.addEventListener('mouseleave', cancelLongPress);
        item.addEventListener('touchend', cancelLongPress);
        item.addEventListener('touchcancel', cancelLongPress);
        
        // 多选模式下点击切换选中
        item.addEventListener('click', () => {
            if (itemsMultiSelectMode) {
                toggleItemSelection(itemName);
            }
        });
    });
}

/**
 * 开始长按计时
 */
function startLongPress(e, itemName) {
    if (itemsMultiSelectMode) return; // 已在多选模式
    
    longPressTimer = setTimeout(() => {
        enterMultiSelectMode(itemName);
    }, 800); // 800ms 长按触发（延长防止误触）
}

/**
 * 取消长按
 */
function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

/**
 * 进入多选模式
 */
function enterMultiSelectMode(initialItem) {
    itemsMultiSelectMode = true;
    selectedItems.clear();
    if (initialItem) {
        selectedItems.add(initialItem);
    }
    
    // 显示多选工具栏
    const bar = document.getElementById('horae-items-multiselect-bar');
    if (bar) bar.style.display = 'flex';
    
    // 隐藏提示
    const hint = document.querySelector('#horae-tab-items .horae-items-hint');
    if (hint) hint.style.display = 'none';
    
    updateItemsDisplay();
    updateSelectedCount();
    
    showToast('已进入多选模式', 'info');
}

/**
 * 退出多选模式
 */
function exitMultiSelectMode() {
    itemsMultiSelectMode = false;
    selectedItems.clear();
    
    // 隐藏多选工具栏
    const bar = document.getElementById('horae-items-multiselect-bar');
    if (bar) bar.style.display = 'none';
    
    // 显示提示
    const hint = document.querySelector('#horae-tab-items .horae-items-hint');
    if (hint) hint.style.display = 'block';
    
    updateItemsDisplay();
}

/**
 * 切换物品选中状态
 */
function toggleItemSelection(itemName) {
    if (selectedItems.has(itemName)) {
        selectedItems.delete(itemName);
    } else {
        selectedItems.add(itemName);
    }
    
    // 更新UI
    const item = document.querySelector(`#horae-items-full-list .horae-full-item[data-item-name="${itemName}"]`);
    if (item) {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = selectedItems.has(itemName);
        item.classList.toggle('selected', selectedItems.has(itemName));
    }
    
    updateSelectedCount();
}

/**
 * 全选物品
 */
function selectAllItems() {
    const items = document.querySelectorAll('#horae-items-full-list .horae-full-item');
    items.forEach(item => {
        const name = item.dataset.itemName;
        if (name) selectedItems.add(name);
    });
    updateItemsDisplay();
    updateSelectedCount();
}

/**
 * 更新选中数量显示
 */
function updateSelectedCount() {
    const countEl = document.getElementById('horae-items-selected-count');
    if (countEl) countEl.textContent = selectedItems.size;
}

/**
 * 删除选中的物品
 */
async function deleteSelectedItems() {
    if (selectedItems.size === 0) {
        showToast('没有选中任何物品', 'warning');
        return;
    }
    
    // 确认对话框
    const confirmed = confirm(`确定要删除选中的 ${selectedItems.size} 个物品吗？\n\n此操作会从所有历史记录中移除这些物品，不可撤销。`);
    if (!confirmed) return;
    
    // 从所有消息的 meta 中删除这些物品
    const chat = horaeManager.getChat();
    const itemsToDelete = Array.from(selectedItems);
    
    for (let i = 0; i < chat.length; i++) {
        const meta = chat[i].horae_meta;
        if (meta && meta.items) {
            for (const itemName of itemsToDelete) {
                if (meta.items[itemName]) {
                    delete meta.items[itemName];
                }
            }
        }
    }
    
    // 保存更改
    await getContext().saveChat();
    
    showToast(`已删除 ${itemsToDelete.length} 个物品`, 'success');
    
    exitMultiSelectMode();
    updateStatusDisplay();
}

/**
 * 刷新所有显示
 */
function refreshAllDisplays() {
    updateStatusDisplay();
    updateAgendaDisplay();
    updateTimelineDisplay();
    updateCharactersDisplay();
    updateItemsDisplay();
    updateLocationMemoryDisplay();
    updateTokenCounter();
}

/** 刷新所有已展开的底部面板 */
function refreshVisiblePanels() {
    document.querySelectorAll('.horae-message-panel').forEach(panelEl => {
        const msgEl = panelEl.closest('.mes');
        if (!msgEl) return;
        const msgId = parseInt(msgEl.getAttribute('mesid'));
        if (isNaN(msgId)) return;
        const chat = horaeManager.getChat();
        const meta = chat?.[msgId]?.horae_meta;
        if (!meta) return;
        const contentEl = panelEl.querySelector('.horae-panel-content');
        if (contentEl) {
            contentEl.innerHTML = buildPanelContent(msgId, meta);
            bindPanelEvents(panelEl);
        }
    });
}

/**
 * 更新场景记忆列表显示
 */
function updateLocationMemoryDisplay() {
    const listEl = document.getElementById('horae-location-list');
    if (!listEl) return;
    
    const locMem = horaeManager.getLocationMemory();
    const entries = Object.entries(locMem);
    const currentLoc = horaeManager.getLatestState()?.scene?.location || '';
    
    if (entries.length === 0) {
        listEl.innerHTML = `
            <div class="horae-empty-state">
                <i class="fa-solid fa-map-location-dot"></i>
                <span>暂无场景记忆</span>
                <span style="font-size:11px;opacity:0.6;margin-top:4px;">开启「设置 → 场景记忆」后，AI会在首次到达新地点时自动记录</span>
            </div>`;
        return;
    }
    
    // 按父级分组：「酒馆·大厅」→ parent=酒馆, child=大厅
    const SEP = /[·・\-\/\|]/;
    const groups = {};   // { parentName: { info?, children: [{name,info}] } }
    const standalone = []; // 无子级的独立条目
    
    for (const [name, info] of entries) {
        const sepMatch = name.match(SEP);
        if (sepMatch) {
            const parent = name.substring(0, sepMatch.index).trim();
            if (!groups[parent]) groups[parent] = { children: [] };
            groups[parent].children.push({ name, info });
            // 如果恰好也存在同名的父级条目，关联
            if (locMem[parent]) groups[parent].info = locMem[parent];
        } else if (groups[name]) {
            groups[name].info = info;
        } else {
            // 检查是否已有子级引用
            const hasChildren = entries.some(([n]) => n !== name && n.startsWith(name) && SEP.test(n.charAt(name.length)));
            if (hasChildren) {
                if (!groups[name]) groups[name] = { children: [] };
                groups[name].info = info;
            } else {
                standalone.push({ name, info });
            }
        }
    }
    
    const buildCard = (name, info, indent = false) => {
        const isCurrent = name === currentLoc || currentLoc.includes(name) || name.includes(currentLoc);
        const currentClass = isCurrent ? 'horae-location-current' : '';
        const currentBadge = isCurrent ? '<span class="horae-loc-current-badge">当前</span>' : '';
        const dateStr = info.lastUpdated ? new Date(info.lastUpdated).toLocaleDateString() : '';
        const indentClass = indent ? ' horae-loc-child' : '';
        const displayName = indent ? name.split(SEP).pop().trim() : name;
        return `
            <div class="horae-location-card ${currentClass}${indentClass}" data-location-name="${escapeHtml(name)}">
                <div class="horae-loc-header">
                    <div class="horae-loc-name"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(displayName)} ${currentBadge}</div>
                    <div class="horae-loc-actions">
                        <button class="horae-loc-edit" title="编辑"><i class="fa-solid fa-pen"></i></button>
                        <button class="horae-loc-delete" title="删除"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="horae-loc-desc">${info.desc || '<span class="horae-empty-hint">暂无描述</span>'}</div>
                ${dateStr ? `<div class="horae-loc-date">更新于 ${dateStr}</div>` : ''}
            </div>`;
    };
    
    let html = '';
    // 渲染有子级的分组
    for (const [parentName, group] of Object.entries(groups)) {
        const isParentCurrent = currentLoc.startsWith(parentName);
        html += `<div class="horae-loc-group${isParentCurrent ? ' horae-loc-group-active' : ''}">
            <div class="horae-loc-group-header" data-parent="${escapeHtml(parentName)}">
                <i class="fa-solid fa-chevron-${isParentCurrent ? 'down' : 'right'} horae-loc-fold-icon"></i>
                <i class="fa-solid fa-building"></i> <strong>${escapeHtml(parentName)}</strong>
                <span class="horae-loc-group-count">${group.children.length + (group.info ? 1 : 0)}</span>
            </div>
            <div class="horae-loc-group-body" style="display:${isParentCurrent ? 'block' : 'none'};">`;
        if (group.info) html += buildCard(parentName, group.info, false);
        for (const child of group.children) html += buildCard(child.name, child.info, true);
        html += '</div></div>';
    }
    // 渲染独立条目
    for (const { name, info } of standalone) html += buildCard(name, info, false);
    
    listEl.innerHTML = html;
    
    // 折叠切换
    listEl.querySelectorAll('.horae-loc-group-header').forEach(header => {
        header.addEventListener('click', () => {
            const body = header.nextElementSibling;
            const icon = header.querySelector('.horae-loc-fold-icon');
            const hidden = body.style.display === 'none';
            body.style.display = hidden ? 'block' : 'none';
            icon.className = `fa-solid fa-chevron-${hidden ? 'down' : 'right'} horae-loc-fold-icon`;
        });
    });
    
    listEl.querySelectorAll('.horae-loc-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.closest('.horae-location-card').dataset.locationName;
            openLocationEditModal(name);
        });
    });
    
    listEl.querySelectorAll('.horae-loc-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const name = btn.closest('.horae-location-card').dataset.locationName;
            if (!confirm(`确定删除场景「${name}」的记忆？`)) return;
            const chat = horaeManager.getChat();
            if (chat?.[0]?.horae_meta?.locationMemory) {
                delete chat[0].horae_meta.locationMemory[name];
                await getContext().saveChat();
                updateLocationMemoryDisplay();
                showToast(`场景「${name}」已删除`, 'info');
            }
        });
    });
}

/**
 * 打开场景记忆编辑弹窗
 */
function openLocationEditModal(locationName) {
    closeEditModal();
    const locMem = horaeManager.getLocationMemory();
    const isNew = !locationName || !locMem[locationName];
    const existing = isNew ? { desc: '' } : locMem[locationName];
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-map-location-dot"></i> ${isNew ? '添加地点' : '编辑场景记忆'}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>地点名称</label>
                        <input type="text" id="horae-loc-edit-name" value="${escapeHtml(locationName || '')}" placeholder="如：无名酒馆·大厅" ${isNew ? '' : 'readonly'}>
                    </div>
                    <div class="horae-edit-field">
                        <label>场景描述</label>
                        <textarea id="horae-loc-edit-desc" rows="5" placeholder="描述该地点的固定物理特征...">${escapeHtml(existing.desc || '')}</textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="horae-loc-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="horae-loc-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    document.getElementById('horae-edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'horae-edit-modal') closeEditModal();
    });
    
    document.getElementById('horae-loc-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        const name = document.getElementById('horae-loc-edit-name').value.trim();
        const desc = document.getElementById('horae-loc-edit-desc').value.trim();
        if (!name) { showToast('地点名称不能为空', 'warning'); return; }
        
        const chat = horaeManager.getChat();
        if (!chat?.length) return;
        if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
        if (!chat[0].horae_meta.locationMemory) chat[0].horae_meta.locationMemory = {};
        
        const now = new Date().toISOString();
        if (isNew) {
            chat[0].horae_meta.locationMemory[name] = { desc, firstSeen: now, lastUpdated: now, _userEdited: true };
        } else {
            if (!isNew && locationName !== name) {
                delete chat[0].horae_meta.locationMemory[locationName];
            }
            chat[0].horae_meta.locationMemory[name] = { ...existing, desc, lastUpdated: now, _userEdited: true };
        }
        
        await getContext().saveChat();
        closeEditModal();
        updateLocationMemoryDisplay();
        showToast(isNew ? '地点已添加' : '场景记忆已更新', 'success');
    });
    
    document.getElementById('horae-loc-cancel').addEventListener('click', () => closeEditModal());
}

/**
 * 合并两个地点的场景记忆
 */
function openLocationMergeModal() {
    closeEditModal();
    const locMem = horaeManager.getLocationMemory();
    const entries = Object.entries(locMem);
    
    if (entries.length < 2) {
        showToast('至少需要2个地点才能合并', 'warning');
        return;
    }
    
    const options = entries.map(([name]) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-code-merge"></i> 合并地点
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-setting-hint" style="margin-bottom: 12px;">
                        <i class="fa-solid fa-circle-info"></i>
                        选择两个地点合并为一个。被合并地点的描述将追加到目标地点。
                    </div>
                    <div class="horae-edit-field">
                        <label>来源地点（将被删除）</label>
                        <select id="horae-merge-source">${options}</select>
                    </div>
                    <div class="horae-edit-field">
                        <label>目标地点（保留）</label>
                        <select id="horae-merge-target">${options}</select>
                    </div>
                    <div id="horae-merge-preview" class="horae-merge-preview" style="display:none;">
                        <strong>合并预览：</strong><br><span id="horae-merge-preview-text"></span>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="horae-merge-confirm" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> 合并
                    </button>
                    <button id="horae-merge-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();
    
    if (entries.length >= 2) {
        document.getElementById('horae-merge-target').selectedIndex = 1;
    }
    
    document.getElementById('horae-edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'horae-edit-modal') closeEditModal();
    });
    
    const updatePreview = () => {
        const source = document.getElementById('horae-merge-source').value;
        const target = document.getElementById('horae-merge-target').value;
        const previewEl = document.getElementById('horae-merge-preview');
        const textEl = document.getElementById('horae-merge-preview-text');
        
        if (source === target) {
            previewEl.style.display = 'block';
            textEl.textContent = '来源和目标不能相同';
            return;
        }
        
        const sourceDesc = locMem[source]?.desc || '';
        const targetDesc = locMem[target]?.desc || '';
        const merged = targetDesc + (targetDesc && sourceDesc ? '\n' : '') + sourceDesc;
        previewEl.style.display = 'block';
        textEl.textContent = `「${source}」→「${target}」\n合并后描述: ${merged.substring(0, 100)}${merged.length > 100 ? '...' : ''}`;
    };
    
    document.getElementById('horae-merge-source').addEventListener('change', updatePreview);
    document.getElementById('horae-merge-target').addEventListener('change', updatePreview);
    updatePreview();
    
    document.getElementById('horae-merge-confirm').addEventListener('click', async (e) => {
        e.stopPropagation();
        const source = document.getElementById('horae-merge-source').value;
        const target = document.getElementById('horae-merge-target').value;
        
        if (source === target) {
            showToast('来源和目标不能相同', 'warning');
            return;
        }
        
        if (!confirm(`确定将「${source}」合并到「${target}」？\n「${source}」将被删除。`)) return;
        
        const chat = horaeManager.getChat();
        const mem = chat?.[0]?.horae_meta?.locationMemory;
        if (!mem) return;
        
        const sourceDesc = mem[source]?.desc || '';
        const targetDesc = mem[target]?.desc || '';
        mem[target].desc = targetDesc + (targetDesc && sourceDesc ? '\n' : '') + sourceDesc;
        mem[target].lastUpdated = new Date().toISOString();
        delete mem[source];
        
        await getContext().saveChat();
        closeEditModal();
        updateLocationMemoryDisplay();
        showToast(`已将「${source}」合并到「${target}」`, 'success');
    });
    
    document.getElementById('horae-merge-cancel').addEventListener('click', () => closeEditModal());
}

function updateTokenCounter() {
    const el = document.getElementById('horae-token-value');
    if (!el) return;
    try {
        const dataPrompt = horaeManager.generateCompactPrompt();
        const rulesPrompt = horaeManager.generateSystemPromptAddition();
        const combined = `${dataPrompt}\n${rulesPrompt}`;
        const tokens = estimateTokens(combined);
        el.textContent = `≈ ${tokens.toLocaleString()}`;
    } catch {
        el.textContent = '--';
    }
}

/**
 * 滚动到指定消息
 */
function scrollToMessage(messageId) {
    const messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
    if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageEl.classList.add('horae-highlight');
        setTimeout(() => messageEl.classList.remove('horae-highlight'), 2000);
    }
}

/** 应用顶部图标可见性 */
function applyTopIconVisibility() {
    const show = settings.showTopIcon !== false;
    if (show) {
        $('#horae_drawer').show();
    } else {
        // 先关闭抽屉再隐藏
        if ($('#horae_drawer_icon').hasClass('openIcon')) {
            $('#horae_drawer_icon').toggleClass('openIcon closedIcon');
            $('#horae_drawer_content').toggleClass('openDrawer closedDrawer').hide();
        }
        $('#horae_drawer').hide();
    }
    // 同步两处开关
    $('#horae-setting-show-top-icon').prop('checked', show);
    $('#horae-ext-show-top-icon').prop('checked', show);
}

/** 应用消息面板宽度设置 */
function applyPanelWidth() {
    const width = Math.max(50, Math.min(100, settings.panelWidth || 100));
    document.querySelectorAll('.horae-message-panel').forEach(panel => {
        panel.style.maxWidth = width < 100 ? `${width}%` : '';
    });
}

/** 内置预设主题 */
const BUILTIN_THEMES = {
    'sakura': {
        name: '樱花粉',
        variables: {
            '--horae-primary': '#ec4899', '--horae-primary-light': '#f472b6', '--horae-primary-dark': '#be185d',
            '--horae-accent': '#fb923c', '--horae-success': '#34d399', '--horae-warning': '#fbbf24',
            '--horae-danger': '#f87171', '--horae-info': '#60a5fa',
            '--horae-bg': '#1f1018', '--horae-bg-secondary': '#2d1825', '--horae-bg-hover': '#3d2535',
            '--horae-border': 'rgba(236, 72, 153, 0.15)', '--horae-text': '#fce7f3', '--horae-text-muted': '#d4a0b9',
            '--horae-shadow': '0 4px 20px rgba(190, 24, 93, 0.2)'
        }
    },
    'forest': {
        name: '森林绿',
        variables: {
            '--horae-primary': '#059669', '--horae-primary-light': '#34d399', '--horae-primary-dark': '#047857',
            '--horae-accent': '#fbbf24', '--horae-success': '#10b981', '--horae-warning': '#f59e0b',
            '--horae-danger': '#ef4444', '--horae-info': '#60a5fa',
            '--horae-bg': '#0f1a14', '--horae-bg-secondary': '#1a2e22', '--horae-bg-hover': '#2a3e32',
            '--horae-border': 'rgba(16, 185, 129, 0.15)', '--horae-text': '#d1fae5', '--horae-text-muted': '#6ee7b7',
            '--horae-shadow': '0 4px 20px rgba(4, 120, 87, 0.2)'
        }
    },
    'ocean': {
        name: '海洋蓝',
        variables: {
            '--horae-primary': '#3b82f6', '--horae-primary-light': '#60a5fa', '--horae-primary-dark': '#1d4ed8',
            '--horae-accent': '#f59e0b', '--horae-success': '#10b981', '--horae-warning': '#f59e0b',
            '--horae-danger': '#ef4444', '--horae-info': '#93c5fd',
            '--horae-bg': '#0c1929', '--horae-bg-secondary': '#162a45', '--horae-bg-hover': '#1e3a5f',
            '--horae-border': 'rgba(59, 130, 246, 0.15)', '--horae-text': '#dbeafe', '--horae-text-muted': '#93c5fd',
            '--horae-shadow': '0 4px 20px rgba(29, 78, 216, 0.2)'
        }
    }
};

/** 获取当前主题对象（内置或自定义） */
function resolveTheme(mode) {
    if (BUILTIN_THEMES[mode]) return BUILTIN_THEMES[mode];
    if (mode.startsWith('custom-')) {
        const idx = parseInt(mode.split('-')[1]);
        return (settings.customThemes || [])[idx] || null;
    }
    return null;
}

/** 应用主题模式（dark / light / 内置预设 / custom-{index}） */
function applyThemeMode() {
    const mode = settings.themeMode || 'dark';
    const isLight = mode === 'light';
    const theme = resolveTheme(mode);

    // 切换 horae-light 类
    const targets = [
        document.getElementById('horae_drawer'),
        ...document.querySelectorAll('.horae-message-panel'),
        ...document.querySelectorAll('.horae-modal')
    ].filter(Boolean);
    targets.forEach(el => el.classList.toggle('horae-light', isLight));

    // 注入主题变量
    let themeStyleEl = document.getElementById('horae-theme-vars');
    if (theme && theme.variables) {
        if (!themeStyleEl) {
            themeStyleEl = document.createElement('style');
            themeStyleEl.id = 'horae-theme-vars';
            document.head.appendChild(themeStyleEl);
        }
        const vars = Object.entries(theme.variables)
            .map(([k, v]) => `  ${k}: ${v};`)
            .join('\n');
        const selectors = '#horae_drawer,\n.horae-message-panel,\n.horae-modal,\n.horae-context-menu,\n.horae-progress-overlay';
        themeStyleEl.textContent = `${selectors} {\n${vars}\n}`;
    } else {
        if (themeStyleEl) themeStyleEl.remove();
    }

    // 注入主题附带CSS
    let themeCssEl = document.getElementById('horae-theme-css');
    if (theme && theme.css) {
        if (!themeCssEl) {
            themeCssEl = document.createElement('style');
            themeCssEl.id = 'horae-theme-css';
            document.head.appendChild(themeCssEl);
        }
        themeCssEl.textContent = theme.css;
    } else {
        if (themeCssEl) themeCssEl.remove();
    }
}

/** 注入用户自定义CSS */
function applyCustomCSS() {
    let styleEl = document.getElementById('horae-custom-style');
    const css = (settings.customCSS || '').trim();
    if (!css) {
        if (styleEl) styleEl.remove();
        return;
    }
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'horae-custom-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
}

/** 导出当前美化为JSON文件 */
function exportTheme() {
    const theme = {
        name: '我的Horae美化',
        author: '',
        version: '1.0',
        variables: {},
        css: settings.customCSS || ''
    };
    // 读取当前主题变量
    const root = document.getElementById('horae_drawer');
    if (root) {
        const style = getComputedStyle(root);
        const varNames = [
            '--horae-primary', '--horae-primary-light', '--horae-primary-dark',
            '--horae-accent', '--horae-success', '--horae-warning', '--horae-danger', '--horae-info',
            '--horae-bg', '--horae-bg-secondary', '--horae-bg-hover',
            '--horae-border', '--horae-text', '--horae-text-muted',
            '--horae-shadow', '--horae-radius', '--horae-radius-sm'
        ];
        varNames.forEach(name => {
            const val = style.getPropertyValue(name).trim();
            if (val) theme.variables[name] = val;
        });
    }
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'horae-theme.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('美化已导出', 'info');
}

/** 导入美化JSON文件 */
function importTheme() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const theme = JSON.parse(text);
            if (!theme.variables || typeof theme.variables !== 'object') {
                showToast('无效的美化文件：缺少 variables 字段', 'error');
                return;
            }
            theme.name = theme.name || file.name.replace('.json', '');
            if (!settings.customThemes) settings.customThemes = [];
            settings.customThemes.push(theme);
            saveSettings();
            refreshThemeSelector();
            showToast(`已导入美化「${theme.name}」`, 'success');
        } catch (err) {
            showToast('美化文件解析失败', 'error');
            console.error('[Horae] 导入美化失败:', err);
        }
    });
    input.click();
}

/** 刷新主题选择器下拉选项 */
function refreshThemeSelector() {
    const sel = document.getElementById('horae-setting-theme-mode');
    if (!sel) return;
    // 清除动态选项（内置预设 + 用户导入）
    sel.querySelectorAll('option:not([value="dark"]):not([value="light"])').forEach(o => o.remove());
    // 内置预设主题
    for (const [key, t] of Object.entries(BUILTIN_THEMES)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `🎨 ${t.name}`;
        sel.appendChild(opt);
    }
    // 用户导入的主题
    const themes = settings.customThemes || [];
    themes.forEach((t, i) => {
        const opt = document.createElement('option');
        opt.value = `custom-${i}`;
        opt.textContent = `📁 ${t.name}`;
        sel.appendChild(opt);
    });
    sel.value = settings.themeMode || 'dark';
}

/** 删除已导入的自定义主题 */
function deleteCustomTheme(index) {
    const themes = settings.customThemes || [];
    if (!themes[index]) return;
    if (!confirm(`确定删除美化「${themes[index].name}」？`)) return;
    const currentMode = settings.themeMode || 'dark';
    themes.splice(index, 1);
    settings.customThemes = themes;
    // 如果删除的是当前使用的主题，回退暗色
    if (currentMode === `custom-${index}` || (currentMode.startsWith('custom-') && parseInt(currentMode.split('-')[1]) >= index)) {
        settings.themeMode = 'dark';
        applyThemeMode();
    }
    saveSettings();
    refreshThemeSelector();
    showToast('美化已删除', 'info');
}

/**
 * 为消息添加元数据面板
 */
function addMessagePanel(messageEl, messageIndex) {
    const existingPanel = messageEl.querySelector('.horae-message-panel');
    if (existingPanel) return;
    
    const meta = horaeManager.getMessageMeta(messageIndex);
    if (!meta) return;
    
    // 格式化时间（标准日历添加周几）
    let time = '--';
    if (meta.timestamp?.story_date) {
        const parsed = parseStoryDate(meta.timestamp.story_date);
        if (parsed && parsed.type === 'standard') {
            time = formatStoryDate(parsed, true);
        } else {
            time = meta.timestamp.story_date;
        }
        if (meta.timestamp.story_time) {
            time += ' ' + meta.timestamp.story_time;
        }
    }
    // 兼容新旧事件格式
    const eventsArr = meta.events || (meta.event ? [meta.event] : []);
    const eventSummary = eventsArr.length > 0 
        ? eventsArr.map(e => e.summary).join(' | ') 
        : '无特殊事件';
    const charCount = meta.scene?.characters_present?.length || 0;
    
    const panelHtml = `
        <div class="horae-message-panel" data-message-id="${messageIndex}">
            <div class="horae-panel-toggle">
                <div class="horae-panel-icon">
                    <i class="fa-regular fa-clock"></i>
                </div>
                <div class="horae-panel-summary">
                    <span class="horae-summary-time">${time}</span>
                    <span class="horae-summary-divider">|</span>
                    <span class="horae-summary-event">${eventSummary}</span>
                    <span class="horae-summary-divider">|</span>
                    <span class="horae-summary-chars">${charCount}人在场</span>
                </div>
                <div class="horae-panel-actions">
                    <button class="horae-btn-rescan" title="重新扫描此消息">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                    <button class="horae-btn-expand" title="展开/收起">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="horae-panel-content" style="display: none;">
                ${buildPanelContent(messageIndex, meta)}
            </div>
        </div>
    `;
    
    const mesTextEl = messageEl.querySelector('.mes_text');
    if (mesTextEl) {
        mesTextEl.insertAdjacentHTML('afterend', panelHtml);
        const panelEl = messageEl.querySelector('.horae-message-panel');
        bindPanelEvents(panelEl);
        if (!settings.showMessagePanel && panelEl) {
            panelEl.style.display = 'none';
        }
        // 应用自定义宽度
        const w = Math.max(50, Math.min(100, settings.panelWidth || 100));
        if (w < 100 && panelEl) {
            panelEl.style.maxWidth = `${w}%`;
        }
        // 继承主题模式
        if (settings.themeMode === 'light' && panelEl) {
            panelEl.classList.add('horae-light');
        }
    }
}

/**
 * 构建已删除物品显示
 */
function buildDeletedItemsDisplay(deletedItems) {
    if (!deletedItems || deletedItems.length === 0) {
        return '';
    }
    return deletedItems.map(item => `
        <div class="horae-deleted-item-tag">
            <i class="fa-solid fa-xmark"></i> ${item}
        </div>
    `).join('');
}

/**
 * 构建待办事项编辑行
 */
function buildAgendaEditorRows(agenda) {
    if (!agenda || agenda.length === 0) {
        return '';
    }
    return agenda.map(item => `
        <div class="horae-editor-row horae-agenda-edit-row">
            <input type="text" class="agenda-date" style="flex:0 0 90px;max-width:90px;" value="${escapeHtml(item.date || '')}" placeholder="日期">
            <input type="text" class="agenda-text" style="flex:1 1 0;min-width:0;" value="${escapeHtml(item.text || '')}" placeholder="待办内容（相对时间请标注绝对日期）">
            <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

/** 关系网络面板渲染 — 数据源为 chat[0].horae_meta，不消耗 AI 输出 */
function buildPanelRelationships(meta) {
    if (!settings.sendRelationships) return '';
    const presentChars = meta.scene?.characters_present || [];
    const rels = horaeManager.getRelationshipsForCharacters(presentChars);
    if (rels.length === 0) return '';
    
    const rows = rels.map(r => {
        const noteStr = r.note ? ` <span class="horae-rel-note-sm">(${r.note})</span>` : '';
        return `<div class="horae-panel-rel-row">${r.from} <span class="horae-rel-arrow-sm">→</span> ${r.to}: <strong>${r.type}</strong>${noteStr}</div>`;
    }).join('');
    
    return `
        <div class="horae-panel-row full-width">
            <label><i class="fa-solid fa-diagram-project"></i> 关系网络</label>
            <div class="horae-panel-relationships">${rows}</div>
        </div>`;
}

function buildPanelMoodEditable(meta) {
    if (!settings.sendMood) return '';
    const moodEntries = Object.entries(meta.mood || {});
    const rows = moodEntries.map(([char, emotion]) => `
        <div class="horae-editor-row horae-mood-row">
            <span class="mood-char">${escapeHtml(char)}</span>
            <input type="text" class="mood-emotion" value="${escapeHtml(emotion)}" placeholder="情绪状态">
            <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
    return `
        <div class="horae-panel-row full-width">
            <label><i class="fa-solid fa-face-smile"></i> 情绪状态</label>
            <div class="horae-mood-editor">${rows}</div>
            <button class="horae-btn-add-mood"><i class="fa-solid fa-plus"></i> 添加</button>
        </div>`;
}

function buildPanelContent(messageIndex, meta) {
    const costumeRows = Object.entries(meta.costumes || {}).map(([char, costume]) => `
        <div class="horae-editor-row">
            <input type="text" class="char-input" value="${char}" placeholder="角色名">
            <input type="text" value="${costume}" placeholder="服装描述">
            <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
    
    // 物品分类由主页面管理，底部栏不显示
    const itemRows = Object.entries(meta.items || {}).map(([name, info]) => {
        return `
            <div class="horae-editor-row horae-item-row">
                <input type="text" class="item-icon" value="${info.icon || ''}" placeholder="📦" maxlength="2">
                <input type="text" class="item-name" value="${name}" placeholder="物品名">
                <input type="text" class="item-holder" value="${info.holder || ''}" placeholder="持有者">
                <input type="text" class="item-location" value="${info.location || ''}" placeholder="位置">
                <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="horae-editor-row horae-item-desc-row">
                <input type="text" class="item-description" value="${info.description || ''}" placeholder="物品描述">
            </div>
        `;
    }).join('');
    
    // 获取前一条消息的好感总值
    const prevTotals = {};
    const chat = horaeManager.getChat();
    for (let i = 0; i < messageIndex; i++) {
        const m = chat[i]?.horae_meta;
        if (m?.affection) {
            for (const [k, v] of Object.entries(m.affection)) {
                let val = 0;
                if (typeof v === 'object' && v !== null) {
                    if (v.type === 'absolute') val = parseInt(v.value) || 0;
                    else if (v.type === 'relative') val = (prevTotals[k] || 0) + (parseInt(v.value) || 0);
                } else {
                    val = (prevTotals[k] || 0) + (parseInt(v) || 0);
                }
                prevTotals[k] = val;
            }
        }
    }
    
    const affectionRows = Object.entries(meta.affection || {}).map(([key, value]) => {
        // 解析当前层的值
        let delta = 0, newTotal = 0;
        const prevVal = prevTotals[key] || 0;
        
        if (typeof value === 'object' && value !== null) {
            if (value.type === 'absolute') {
                newTotal = parseInt(value.value) || 0;
                delta = newTotal - prevVal;
            } else if (value.type === 'relative') {
                delta = parseInt(value.value) || 0;
                newTotal = prevVal + delta;
            }
        } else {
            delta = parseInt(value) || 0;
            newTotal = prevVal + delta;
        }
        
        const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
        return `
            <div class="horae-editor-row horae-affection-row" data-char="${key}" data-prev="${prevVal}">
                <span class="affection-char">${key}</span>
                <input type="text" class="affection-delta" value="${deltaStr}" placeholder="±变化">
                <input type="number" class="affection-total" value="${newTotal}" placeholder="总值">
                <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    }).join('');
    
    // 兼容新旧事件格式
    const eventsArr = meta.events || (meta.event ? [meta.event] : []);
    const firstEvent = eventsArr[0] || {};
    const eventLevel = firstEvent.level || '';
    const eventSummary = firstEvent.summary || '';
    const multipleEventsNote = eventsArr.length > 1 ? `<span class="horae-note">（此消息有${eventsArr.length}条事件，仅显示第一条）</span>` : '';
    
    return `
        <div class="horae-panel-grid">
            <div class="horae-panel-row">
                <label><i class="fa-regular fa-clock"></i> 时间</label>
                <div class="horae-panel-value">
                    <input type="text" class="horae-input-datetime" placeholder="日期 时间（如 2026/2/4 15:00）" value="${(() => {
                        let val = meta.timestamp?.story_date || '';
                        if (meta.timestamp?.story_time) val += (val ? ' ' : '') + meta.timestamp.story_time;
                        return val;
                    })()}">
                </div>
            </div>
            <div class="horae-panel-row">
                <label><i class="fa-solid fa-location-dot"></i> 地点</label>
                <div class="horae-panel-value">
                    <input type="text" class="horae-input-location" value="${meta.scene?.location || ''}" placeholder="场景位置">
                </div>
            </div>
            <div class="horae-panel-row">
                <label><i class="fa-solid fa-cloud"></i> 氛围</label>
                <div class="horae-panel-value">
                    <input type="text" class="horae-input-atmosphere" value="${meta.scene?.atmosphere || ''}" placeholder="场景氛围">
                </div>
            </div>
            <div class="horae-panel-row">
                <label><i class="fa-solid fa-users"></i> 在场</label>
                <div class="horae-panel-value">
                    <input type="text" class="horae-input-characters" value="${(meta.scene?.characters_present || []).join(', ')}" placeholder="角色名，用逗号分隔">
                </div>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-shirt"></i> 服装变化</label>
                <div class="horae-costume-editor">${costumeRows}</div>
                <button class="horae-btn-add-costume"><i class="fa-solid fa-plus"></i> 添加</button>
            </div>
            ${buildPanelMoodEditable(meta)}
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-box-open"></i> 物品获得/变化</label>
                <div class="horae-items-editor">${itemRows}</div>
                <button class="horae-btn-add-item"><i class="fa-solid fa-plus"></i> 添加</button>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-trash-can"></i> 物品消耗/删除</label>
                <div class="horae-deleted-items-display">${buildDeletedItemsDisplay(meta.deletedItems)}</div>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-bookmark"></i> 事件 ${multipleEventsNote}</label>
                <div class="horae-event-editor">
                    <select class="horae-input-event-level">
                        <option value="">无</option>
                        <option value="一般" ${eventLevel === '一般' ? 'selected' : ''}>一般</option>
                        <option value="重要" ${eventLevel === '重要' ? 'selected' : ''}>重要</option>
                        <option value="关键" ${eventLevel === '关键' ? 'selected' : ''}>关键</option>
                    </select>
                    <input type="text" class="horae-input-event-summary" value="${eventSummary}" placeholder="事件摘要">
                </div>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-heart"></i> 好感度</label>
                <div class="horae-affection-editor">${affectionRows}</div>
                <button class="horae-btn-add-affection"><i class="fa-solid fa-plus"></i> 添加</button>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-list-check"></i> 待办事项</label>
                <div class="horae-agenda-editor">${buildAgendaEditorRows(meta.agenda)}</div>
                <button class="horae-btn-add-agenda-row"><i class="fa-solid fa-plus"></i> 添加</button>
            </div>
            ${buildPanelRelationships(meta)}
        </div>
        <div class="horae-panel-rescan">
            <div class="horae-rescan-label"><i class="fa-solid fa-rotate"></i> 重新扫描此消息</div>
            <div class="horae-rescan-buttons">
                <button class="horae-btn-quick-scan horae-btn" title="从现有文本中提取格式化数据（不消耗API）">
                    <i class="fa-solid fa-bolt"></i> 快速解析
                </button>
                <button class="horae-btn-ai-analyze horae-btn" title="使用AI分析消息内容（消耗API）">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> AI分析
                </button>
            </div>
        </div>
        <div class="horae-panel-footer">
            <button class="horae-btn-save horae-btn"><i class="fa-solid fa-check"></i> 保存</button>
            <button class="horae-btn-cancel horae-btn"><i class="fa-solid fa-xmark"></i> 取消</button>
            <button class="horae-btn-open-drawer horae-btn" title="打开 Horae 面板"><i class="fa-solid fa-clock-rotate-left"></i></button>
        </div>
    `;
}

/**
 * 绑定面板事件
 */
function bindPanelEvents(panelEl) {
    if (!panelEl) return;
    
    const messageId = parseInt(panelEl.dataset.messageId);
    const toggleEl = panelEl.querySelector('.horae-panel-toggle');
    const contentEl = panelEl.querySelector('.horae-panel-content');
    const expandBtn = panelEl.querySelector('.horae-btn-expand');
    
    // 展开/收起 - 点击整个横条或展开按钮都会展开
    const rescanBtn = panelEl.querySelector('.horae-btn-rescan');
    toggleEl?.addEventListener('click', (e) => {
        if (e.target.closest('.horae-btn-expand') || e.target.closest('.horae-btn-rescan')) return;
        togglePanel();
    });
    
    expandBtn?.addEventListener('click', togglePanel);
    
    // 重新扫描此消息
    rescanBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        rescanMessageMeta(messageId, panelEl);
    });
    
    function togglePanel() {
        const isHidden = contentEl.style.display === 'none';
        contentEl.style.display = isHidden ? 'block' : 'none';
        const icon = expandBtn.querySelector('i');
        icon.className = isHidden ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    }
    
    // 标记面板已修改
    let panelDirty = false;
    contentEl?.addEventListener('input', () => { panelDirty = true; });
    contentEl?.addEventListener('change', () => { panelDirty = true; });
    
    panelEl.querySelector('.horae-btn-save')?.addEventListener('click', () => {
        savePanelData(panelEl, messageId);
        panelDirty = false;
    });
    
    panelEl.querySelector('.horae-btn-cancel')?.addEventListener('click', () => {
        if (panelDirty && !confirm('有未保存的更改，确定关闭？')) return;
        contentEl.style.display = 'none';
        panelDirty = false;
    });
    
    panelEl.querySelector('.horae-btn-open-drawer')?.addEventListener('click', () => {
        const drawerIcon = $('#horae_drawer_icon');
        const drawerContent = $('#horae_drawer_content');
        const isOpen = drawerIcon.hasClass('openIcon');
        if (isOpen) {
            drawerIcon.removeClass('openIcon').addClass('closedIcon');
            drawerContent.removeClass('openDrawer').addClass('closedDrawer').css('display', 'none');
        } else {
            // 关闭其他抽屉
            $('.openDrawer').not('#horae_drawer_content').not('.pinnedOpen').css('display', 'none')
                .removeClass('openDrawer').addClass('closedDrawer');
            $('.openIcon').not('#horae_drawer_icon').not('.drawerPinnedOpen')
                .removeClass('openIcon').addClass('closedIcon');
            drawerIcon.removeClass('closedIcon').addClass('openIcon');
            drawerContent.removeClass('closedDrawer').addClass('openDrawer').css('display', '');
        }
    });
    
    panelEl.querySelector('.horae-btn-add-costume')?.addEventListener('click', () => {
        const editor = panelEl.querySelector('.horae-costume-editor');
        const emptyHint = editor.querySelector('.horae-empty-hint');
        if (emptyHint) emptyHint.remove();
        
        editor.insertAdjacentHTML('beforeend', `
            <div class="horae-editor-row">
                <input type="text" class="char-input" placeholder="角色名">
                <input type="text" placeholder="服装描述">
                <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `);
        bindDeleteButtons(editor);
    });
    
    panelEl.querySelector('.horae-btn-add-mood')?.addEventListener('click', () => {
        const editor = panelEl.querySelector('.horae-mood-editor');
        if (!editor) return;
        editor.insertAdjacentHTML('beforeend', `
            <div class="horae-editor-row horae-mood-row">
                <input type="text" class="mood-char" placeholder="角色名">
                <input type="text" class="mood-emotion" placeholder="情绪状态">
                <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `);
        bindDeleteButtons(editor);
    });
    
    panelEl.querySelector('.horae-btn-add-item')?.addEventListener('click', () => {
        const editor = panelEl.querySelector('.horae-items-editor');
        const emptyHint = editor.querySelector('.horae-empty-hint');
        if (emptyHint) emptyHint.remove();
        
        editor.insertAdjacentHTML('beforeend', `
            <div class="horae-editor-row horae-item-row">
                <input type="text" class="item-icon" placeholder="📦" maxlength="2">
                <input type="text" class="item-name" placeholder="物品名">
                <input type="text" class="item-holder" placeholder="持有者">
                <input type="text" class="item-location" placeholder="位置">
                <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="horae-editor-row horae-item-desc-row">
                <input type="text" class="item-description" placeholder="物品描述">
            </div>
        `);
        bindDeleteButtons(editor);
    });
    
    panelEl.querySelector('.horae-btn-add-affection')?.addEventListener('click', () => {
        const editor = panelEl.querySelector('.horae-affection-editor');
        const emptyHint = editor.querySelector('.horae-empty-hint');
        if (emptyHint) emptyHint.remove();
        
        editor.insertAdjacentHTML('beforeend', `
            <div class="horae-editor-row horae-affection-row" data-char="" data-prev="0">
                <input type="text" class="affection-char-input" placeholder="角色名">
                <input type="text" class="affection-delta" value="+0" placeholder="±变化">
                <input type="number" class="affection-total" value="0" placeholder="总值">
                <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `);
        bindDeleteButtons(editor);
        bindAffectionInputs(editor);
    });
    
    // 添加待办事项行
    panelEl.querySelector('.horae-btn-add-agenda-row')?.addEventListener('click', () => {
        const editor = panelEl.querySelector('.horae-agenda-editor');
        const emptyHint = editor.querySelector('.horae-empty-hint');
        if (emptyHint) emptyHint.remove();
        
        editor.insertAdjacentHTML('beforeend', `
            <div class="horae-editor-row horae-agenda-edit-row">
                <input type="text" class="agenda-date" style="flex:0 0 90px;max-width:90px;" value="" placeholder="日期">
                <input type="text" class="agenda-text" style="flex:1 1 0;min-width:0;" value="" placeholder="待办内容（相对时间请标注绝对日期）">
                <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `);
        bindDeleteButtons(editor);
    });
    
    // 绑定好感度输入联动
    bindAffectionInputs(panelEl.querySelector('.horae-affection-editor'));
    
    // 绑定现有删除按钮
    bindDeleteButtons(panelEl);
    
    // 快速解析按钮（不消耗API）
    panelEl.querySelector('.horae-btn-quick-scan')?.addEventListener('click', async () => {
        const chat = horaeManager.getChat();
        const message = chat[messageId];
        if (!message) {
            showToast('无法获取消息内容', 'error');
            return;
        }
        
        // 先尝试解析标准标签
        let parsed = horaeManager.parseHoraeTag(message.mes);
        
        // 如果没有标签，尝试宽松解析
        if (!parsed) {
            parsed = horaeManager.parseLooseFormat(message.mes);
        }
        
        if (parsed) {
            // 获取现有元数据并合并
            const existingMeta = horaeManager.getMessageMeta(messageId) || createEmptyMeta();
            const newMeta = horaeManager.mergeParsedToMeta(existingMeta, parsed);
            // 处理表格更新
            if (newMeta._tableUpdates) {
                horaeManager.applyTableUpdates(newMeta._tableUpdates);
                delete newMeta._tableUpdates;
            }
            // 处理已完成待办
            if (parsed.deletedAgenda && parsed.deletedAgenda.length > 0) {
                horaeManager.removeCompletedAgenda(parsed.deletedAgenda);
            }
            horaeManager.setMessageMeta(messageId, newMeta);
            
            const contentEl = panelEl.querySelector('.horae-panel-content');
            if (contentEl) {
                contentEl.innerHTML = buildPanelContent(messageId, newMeta);
                bindPanelEvents(panelEl);
            }
            
            getContext().saveChat();
            refreshAllDisplays();
            showToast('快速解析完成！', 'success');
        } else {
            showToast('未能从文本中提取到格式化数据，请尝试AI分析', 'warning');
        }
    });
    
    // AI分析按钮（消耗API）
    panelEl.querySelector('.horae-btn-ai-analyze')?.addEventListener('click', async () => {
        const chat = horaeManager.getChat();
        const message = chat[messageId];
        if (!message) {
            showToast('无法获取消息内容', 'error');
            return;
        }
        
        const btn = panelEl.querySelector('.horae-btn-ai-analyze');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 分析中...';
        btn.disabled = true;
        
        try {
            // 调用AI分析
            const result = await analyzeMessageWithAI(message.mes);
            
            if (result) {
                const existingMeta = horaeManager.getMessageMeta(messageId) || createEmptyMeta();
                const newMeta = horaeManager.mergeParsedToMeta(existingMeta, result);
                if (newMeta._tableUpdates) {
                    horaeManager.applyTableUpdates(newMeta._tableUpdates);
                    delete newMeta._tableUpdates;
                }
                // 处理已完成待办
                if (result.deletedAgenda && result.deletedAgenda.length > 0) {
                    horaeManager.removeCompletedAgenda(result.deletedAgenda);
                }
                horaeManager.setMessageMeta(messageId, newMeta);
                
                const contentEl = panelEl.querySelector('.horae-panel-content');
                if (contentEl) {
                    contentEl.innerHTML = buildPanelContent(messageId, newMeta);
                    bindPanelEvents(panelEl);
                }
                
                getContext().saveChat();
                refreshAllDisplays();
                showToast('AI分析完成！', 'success');
            } else {
                showToast('AI分析未返回有效数据', 'warning');
            }
        } catch (error) {
            console.error('[Horae] AI分析失败:', error);
            showToast('AI分析失败: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

/**
 * 绑定删除按钮事件
 */
function bindDeleteButtons(container) {
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => btn.closest('.horae-editor-row')?.remove();
    });
}

/**
 * 绑定好感度输入框联动
 */
function bindAffectionInputs(container) {
    if (!container) return;
    
    container.querySelectorAll('.horae-affection-row').forEach(row => {
        const deltaInput = row.querySelector('.affection-delta');
        const totalInput = row.querySelector('.affection-total');
        const prevVal = parseFloat(row.dataset.prev) || 0;
        
        deltaInput?.addEventListener('input', () => {
            const deltaStr = deltaInput.value.replace(/[^\d\.\-+]/g, '');
            const delta = parseFloat(deltaStr) || 0;
            totalInput.value = parseFloat((prevVal + delta).toFixed(2));
        });
        
        totalInput?.addEventListener('input', () => {
            const total = parseFloat(totalInput.value) || 0;
            const delta = parseFloat((total - prevVal).toFixed(2));
            deltaInput.value = delta >= 0 ? `+${delta}` : `${delta}`;
        });
    });
}

/** 重新扫描消息并更新面板（完全替换） */
function rescanMessageMeta(messageId, panelEl) {
    // 从DOM获取最新的消息内容（用户可能已编辑）
    const messageEl = panelEl.closest('.mes');
    if (!messageEl) {
        showToast('无法找到消息元素', 'error');
        return;
    }
    
    // 获取文本内容（包括隐藏的horae标签）
    // 先尝试从chat数组获取最新内容
    const context = window.SillyTavern?.getContext?.() || getContext?.();
    let messageContent = '';
    
    if (context?.chat?.[messageId]) {
        messageContent = context.chat[messageId].mes;
    }
    
    // 如果chat中没有或为空，从DOM获取
    if (!messageContent) {
        const mesTextEl = messageEl.querySelector('.mes_text');
        if (mesTextEl) {
            messageContent = mesTextEl.innerHTML;
        }
    }
    
    if (!messageContent) {
        showToast('无法获取消息内容', 'error');
        return;
    }
    
    const parsed = horaeManager.parseHoraeTag(messageContent);
    
    if (parsed) {
        // 完全替换（不合并）
        const existingMeta = horaeManager.getMessageMeta(messageId);
        const newMeta = createEmptyMeta();
        
        newMeta.timestamp = parsed.timestamp || {};
        newMeta.scene = parsed.scene || {};
        newMeta.costumes = parsed.costumes || {};
        newMeta.items = parsed.items || {};
        newMeta.deletedItems = parsed.deletedItems || [];
        // 兼容新旧事件格式
        newMeta.events = parsed.events || (parsed.event ? [parsed.event] : []);
        newMeta.affection = parsed.affection || {};
        newMeta.agenda = parsed.agenda || [];
        
        // 只保留原有的NPC数据（如果新解析中没有）
        if (parsed.npcs && Object.keys(parsed.npcs).length > 0) {
            newMeta.npcs = parsed.npcs;
        } else if (existingMeta?.npcs) {
            newMeta.npcs = existingMeta.npcs;
        }
        
        // 无新agenda则保留旧数据
        if (newMeta.agenda.length === 0 && existingMeta?.agenda?.length > 0) {
            newMeta.agenda = existingMeta.agenda;
        }
        
        // 处理已完成待办
        if (parsed.deletedAgenda && parsed.deletedAgenda.length > 0) {
            horaeManager.removeCompletedAgenda(parsed.deletedAgenda);
        }
        
        horaeManager.setMessageMeta(messageId, newMeta);
        getContext().saveChat();
        
        panelEl.remove();
        addMessagePanel(messageEl, messageId);
        
        // 同时刷新主显示
        refreshAllDisplays();
        
        showToast('已重新扫描并更新', 'success');
    } else {
        // 无标签，清空数据（保留NPC）
        const existingMeta = horaeManager.getMessageMeta(messageId);
        const newMeta = createEmptyMeta();
        if (existingMeta?.npcs) {
            newMeta.npcs = existingMeta.npcs;
        }
        horaeManager.setMessageMeta(messageId, newMeta);
        
        panelEl.remove();
        addMessagePanel(messageEl, messageId);
        refreshAllDisplays();
        
        showToast('未找到Horae标签，已清空数据', 'warning');
    }
}

/**
 * 保存面板数据
 */
function savePanelData(panelEl, messageId) {
    // 获取现有的 meta，保留面板中没有编辑区的数据（如 NPC）
    const existingMeta = horaeManager.getMessageMeta(messageId);
    const meta = createEmptyMeta();
    
    // 保留原有的 NPC 数据（因为面板中没有 NPC 编辑区）
    if (existingMeta?.npcs) {
        meta.npcs = JSON.parse(JSON.stringify(existingMeta.npcs));
    }
    
    // 分离日期时间
    const datetimeVal = (panelEl.querySelector('.horae-input-datetime')?.value || '').trim();
    const clockMatch = datetimeVal.match(/\b(\d{1,2}:\d{2})\s*$/);
    if (clockMatch) {
        meta.timestamp.story_time = clockMatch[1];
        meta.timestamp.story_date = datetimeVal.substring(0, datetimeVal.lastIndexOf(clockMatch[1])).trim();
    } else {
        meta.timestamp.story_date = datetimeVal;
        meta.timestamp.story_time = '';
    }
    meta.timestamp.absolute = new Date().toISOString();
    
    // 场景
    meta.scene.location = panelEl.querySelector('.horae-input-location')?.value || '';
    meta.scene.atmosphere = panelEl.querySelector('.horae-input-atmosphere')?.value || '';
    const charsInput = panelEl.querySelector('.horae-input-characters')?.value || '';
    meta.scene.characters_present = charsInput.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    
    // 服装
    panelEl.querySelectorAll('.horae-costume-editor .horae-editor-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 2) {
            const char = inputs[0].value.trim();
            const costume = inputs[1].value.trim();
            if (char && costume) {
                meta.costumes[char] = costume;
            }
        }
    });
    
    // 情绪
    panelEl.querySelectorAll('.horae-mood-editor .horae-mood-row').forEach(row => {
        const charEl = row.querySelector('.mood-char');
        const emotionInput = row.querySelector('.mood-emotion');
        const char = (charEl?.tagName === 'INPUT' ? charEl.value : charEl?.textContent)?.trim();
        const emotion = emotionInput?.value?.trim();
        if (char && emotion) meta.mood[char] = emotion;
    });
    
    // 物品配对处理
    const itemMainRows = panelEl.querySelectorAll('.horae-items-editor .horae-item-row');
    const itemDescRows = panelEl.querySelectorAll('.horae-items-editor .horae-item-desc-row');
    const latestState = horaeManager.getLatestState();
    const existingItems = latestState.items || {};
    
    itemMainRows.forEach((row, idx) => {
        const iconInput = row.querySelector('.item-icon');
        const nameInput = row.querySelector('.item-name');
        const holderInput = row.querySelector('.item-holder');
        const locationInput = row.querySelector('.item-location');
        const descRow = itemDescRows[idx];
        const descInput = descRow?.querySelector('.item-description');
        
        if (nameInput) {
            const name = nameInput.value.trim();
            if (name) {
                // 从物品栏获取已保存的importance，底部栏不再编辑分类
                const existingImportance = existingItems[name]?.importance || existingMeta?.items?.[name]?.importance || '';
                meta.items[name] = {
                    icon: iconInput?.value.trim() || null,
                    importance: existingImportance,  // 保留物品栏的分类
                    holder: holderInput?.value.trim() || null,
                    location: locationInput?.value.trim() || '',
                    description: descInput?.value.trim() || ''
                };
            }
        }
    });
    
    // 事件
    const eventLevel = panelEl.querySelector('.horae-input-event-level')?.value;
    const eventSummary = panelEl.querySelector('.horae-input-event-summary')?.value;
    if (eventLevel && eventSummary) {
        meta.events = [{
            is_important: eventLevel === '重要' || eventLevel === '关键',
            level: eventLevel,
            summary: eventSummary
        }];
    }
    
    panelEl.querySelectorAll('.horae-affection-editor .horae-affection-row').forEach(row => {
        const charSpan = row.querySelector('.affection-char');
        const charInput = row.querySelector('.affection-char-input');
        const totalInput = row.querySelector('.affection-total');
        
        const key = charSpan?.textContent?.trim() || charInput?.value?.trim() || '';
        const total = parseFloat(totalInput?.value) || 0;
        
        if (key) {
            meta.affection[key] = { type: 'absolute', value: total };
        }
    });
    
    // 兼容旧格式
    panelEl.querySelectorAll('.horae-affection-editor .horae-editor-row:not(.horae-affection-row)').forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 2) {
            const key = inputs[0].value.trim();
            const value = inputs[1].value.trim();
            if (key && value) {
                meta.affection[key] = value;
            }
        }
    });
    
    const agendaItems = [];
    panelEl.querySelectorAll('.horae-agenda-editor .horae-agenda-edit-row').forEach(row => {
        const dateInput = row.querySelector('.agenda-date');
        const textInput = row.querySelector('.agenda-text');
        const date = dateInput?.value?.trim() || '';
        const text = textInput?.value?.trim() || '';
        if (text) {
            // 保留原 source
            const existingAgendaItem = existingMeta?.agenda?.find(a => a.text === text);
            const source = existingAgendaItem?.source || 'user';
            agendaItems.push({ date, text, source, done: false });
        }
    });
    if (agendaItems.length > 0) {
        meta.agenda = agendaItems;
    } else if (existingMeta?.agenda?.length > 0) {
        // 无编辑行时保留原有待办
        meta.agenda = existingMeta.agenda;
    }
    
    horaeManager.setMessageMeta(messageId, meta);
    
    // 同步写入正文标签
    injectHoraeTagToMessage(messageId, meta);
    
    getContext().saveChat();
    
    showToast('保存成功！', 'success');
    refreshAllDisplays();
    
    // 更新面板摘要
    const summaryTime = panelEl.querySelector('.horae-summary-time');
    const summaryEvent = panelEl.querySelector('.horae-summary-event');
    const summaryChars = panelEl.querySelector('.horae-summary-chars');
    
    if (summaryTime) {
        if (meta.timestamp.story_date) {
            const parsed = parseStoryDate(meta.timestamp.story_date);
            let dateDisplay = meta.timestamp.story_date;
            if (parsed && parsed.type === 'standard') {
                dateDisplay = formatStoryDate(parsed, true);
            }
            summaryTime.textContent = dateDisplay + (meta.timestamp.story_time ? ' ' + meta.timestamp.story_time : '');
        } else {
            summaryTime.textContent = '--';
        }
    }
    if (summaryEvent) {
        summaryEvent.textContent = meta.event?.summary || '无特殊事件';
    }
    if (summaryChars) {
        summaryChars.textContent = `${meta.scene.characters_present.length}人在场`;
    }
}

/** 构建 <horae> 标签字符串 */
function buildHoraeTagFromMeta(meta) {
    const lines = [];
    
    if (meta.timestamp?.story_date) {
        let timeLine = `time:${meta.timestamp.story_date}`;
        if (meta.timestamp.story_time) timeLine += ` ${meta.timestamp.story_time}`;
        lines.push(timeLine);
    }
    
    if (meta.scene?.location) {
        lines.push(`location:${meta.scene.location}`);
    }
    
    if (meta.scene?.atmosphere) {
        lines.push(`atmosphere:${meta.scene.atmosphere}`);
    }
    
    if (meta.scene?.characters_present?.length > 0) {
        lines.push(`characters:${meta.scene.characters_present.join(',')}`);
    }
    
    if (meta.costumes) {
        for (const [char, costume] of Object.entries(meta.costumes)) {
            if (char && costume) {
                lines.push(`costume:${char}=${costume}`);
            }
        }
    }
    
    if (meta.items) {
        for (const [name, info] of Object.entries(meta.items)) {
            if (!name) continue;
            const imp = info.importance === '!!' ? '!!' : info.importance === '!' ? '!' : '';
            const icon = info.icon || '';
            const desc = info.description ? `|${info.description}` : '';
            const holder = info.holder || '';
            const loc = info.location ? `@${info.location}` : '';
            lines.push(`item${imp}:${icon}${name}${desc}=${holder}${loc}`);
        }
    }
    
    // deleted items
    if (meta.deletedItems?.length > 0) {
        for (const item of meta.deletedItems) {
            lines.push(`item-:${item}`);
        }
    }
    
    if (meta.affection) {
        for (const [name, value] of Object.entries(meta.affection)) {
            if (!name) continue;
            if (typeof value === 'object') {
                if (value.type === 'relative') {
                    lines.push(`affection:${name}${value.value}`);
                } else {
                    lines.push(`affection:${name}=${value.value}`);
                }
            } else {
                lines.push(`affection:${name}=${value}`);
            }
        }
    }
    
    // npcs（使用新格式：npc:名|外貌=性格@关系~扩展字段）
    if (meta.npcs) {
        for (const [name, info] of Object.entries(meta.npcs)) {
            if (!name) continue;
            const app = info.appearance || '';
            const per = info.personality || '';
            const rel = info.relationship || '';
            let npcLine = '';
            if (app || per || rel) {
                npcLine = `npc:${name}|${app}=${per}@${rel}`;
            } else {
                npcLine = `npc:${name}`;
            }
            const extras = [];
            if (info.gender) extras.push(`性别:${info.gender}`);
            if (info.age) extras.push(`年龄:${info.age}`);
            if (info.race) extras.push(`种族:${info.race}`);
            if (info.job) extras.push(`职业:${info.job}`);
            if (info.note) extras.push(`补充:${info.note}`);
            if (extras.length > 0) npcLine += `~${extras.join('~')}`;
            lines.push(npcLine);
        }
    }
    
    if (meta.agenda?.length > 0) {
        for (const item of meta.agenda) {
            if (item.text) {
                const datePart = item.date ? `${item.date}|` : '';
                lines.push(`agenda:${datePart}${item.text}`);
            }
        }
    }
    
    if (lines.length === 0) return '';
    return `<horae>\n${lines.join('\n')}\n</horae>`;
}

/** 构建 <horaeevent> 标签字符串 */
function buildHoraeEventTagFromMeta(meta) {
    const events = meta.events || (meta.event ? [meta.event] : []);
    if (events.length === 0) return '';
    
    const lines = events
        .filter(e => e.summary)
        .map(e => `event:${e.level || '一般'}|${e.summary}`);
    
    if (lines.length === 0) return '';
    return `<horaeevent>\n${lines.join('\n')}\n</horaeevent>`;
}

/** 同步注入正文标签 */
function injectHoraeTagToMessage(messageId, meta) {
    try {
        const chat = horaeManager.getChat();
        if (!chat?.[messageId]) return;
        
        const message = chat[messageId];
        let mes = message.mes;
        
        // === 处理 <horae> 标签 ===
        const newHoraeTag = buildHoraeTagFromMeta(meta);
        const hasHoraeTag = /<horae>[\s\S]*?<\/horae>/i.test(mes);
        
        if (hasHoraeTag) {
            mes = newHoraeTag
                ? mes.replace(/<horae>[\s\S]*?<\/horae>/gi, newHoraeTag)
                : mes.replace(/<horae>[\s\S]*?<\/horae>/gi, '').trim();
        } else if (newHoraeTag) {
            mes = mes.trimEnd() + '\n\n' + newHoraeTag;
        }
        
        // === 处理 <horaeevent> 标签 ===
        const newEventTag = buildHoraeEventTagFromMeta(meta);
        const hasEventTag = /<horaeevent>[\s\S]*?<\/horaeevent>/i.test(mes);
        
        if (hasEventTag) {
            mes = newEventTag
                ? mes.replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, newEventTag)
                : mes.replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, '').trim();
        } else if (newEventTag) {
            mes = mes.trimEnd() + '\n' + newEventTag;
        }
        
        message.mes = mes;
        console.log(`[Horae] 已同步写入消息 #${messageId} 的标签`);
    } catch (error) {
        console.error(`[Horae] 写入标签失败:`, error);
    }
}

// ============================================
// 抽屉面板交互
// ============================================

/**
 * 打开/关闭抽屉（旧版兼容模式）
 */
function openDrawerLegacy() {
    const drawerIcon = $('#horae_drawer_icon');
    const drawerContent = $('#horae_drawer_content');
    
    if (drawerIcon.hasClass('closedIcon')) {
        // 关闭其他抽屉
        $('.openDrawer').not('#horae_drawer_content').not('.pinnedOpen').addClass('resizing').each((_, el) => {
            slideToggle(el, {
                ...getSlideToggleOptions(),
                onAnimationEnd: (elem) => elem.closest('.drawer-content')?.classList.remove('resizing'),
            });
        });
        $('.openIcon').not('#horae_drawer_icon').not('.drawerPinnedOpen').toggleClass('closedIcon openIcon');
        $('.openDrawer').not('#horae_drawer_content').not('.pinnedOpen').toggleClass('closedDrawer openDrawer');

        drawerIcon.toggleClass('closedIcon openIcon');
        drawerContent.toggleClass('closedDrawer openDrawer');

        drawerContent.addClass('resizing').each((_, el) => {
            slideToggle(el, {
                ...getSlideToggleOptions(),
                onAnimationEnd: (elem) => elem.closest('.drawer-content')?.classList.remove('resizing'),
            });
        });
    } else {
        drawerIcon.toggleClass('openIcon closedIcon');
        drawerContent.toggleClass('openDrawer closedDrawer');

        drawerContent.addClass('resizing').each((_, el) => {
            slideToggle(el, {
                ...getSlideToggleOptions(),
                onAnimationEnd: (elem) => elem.closest('.drawer-content')?.classList.remove('resizing'),
            });
        });
    }
}

/**
 * 初始化抽屉
 */
async function initDrawer() {
    const toggle = $('#horae_drawer .drawer-toggle');
    
    if (isNewNavbarVersion()) {
        toggle.on('click', doNavbarIconClick);
        console.log(`[Horae] 使用新版导航栏模式`);
    } else {
        $('#horae_drawer_content').attr('data-slide-toggle', 'hidden').css('display', 'none');
        toggle.on('click', openDrawerLegacy);
        console.log(`[Horae] 使用旧版抽屉模式`);
    }
}

/**
 * 初始化标签页切换
 */
function initTabs() {
    $('.horae-tab').on('click', function() {
        const tabId = $(this).data('tab');
        
        $('.horae-tab').removeClass('active');
        $(this).addClass('active');
        
        $('.horae-tab-content').removeClass('active');
        $(`#horae-tab-${tabId}`).addClass('active');
        
        switch(tabId) {
            case 'status':
                updateStatusDisplay();
                break;
            case 'timeline':
                updateAgendaDisplay();
                updateTimelineDisplay();
                break;
            case 'characters':
                updateCharactersDisplay();
                break;
            case 'items':
                updateItemsDisplay();
                break;
        }
    });
}

// ============================================
// 清理无主物品功能
// ============================================

/**
 * 初始化设置页事件
 */
function initSettingsEvents() {
    $('#horae-setting-enabled').on('change', function() {
        settings.enabled = this.checked;
        saveSettings();
    });
    
    $('#horae-setting-auto-parse').on('change', function() {
        settings.autoParse = this.checked;
        saveSettings();
    });
    
    $('#horae-setting-inject-context').on('change', function() {
        settings.injectContext = this.checked;
        saveSettings();
    });
    
    $('#horae-setting-show-panel').on('change', function() {
        settings.showMessagePanel = this.checked;
        saveSettings();
        document.querySelectorAll('.horae-message-panel').forEach(panel => {
            panel.style.display = this.checked ? '' : 'none';
        });
    });
    
    $('#horae-setting-show-top-icon').on('change', function() {
        settings.showTopIcon = this.checked;
        saveSettings();
        applyTopIconVisibility();
    });
    
    $('#horae-setting-context-depth').on('change', function() {
        settings.contextDepth = parseInt(this.value);
        if (isNaN(settings.contextDepth) || settings.contextDepth < 0) settings.contextDepth = 15;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });
    
    $('#horae-setting-injection-position').on('change', function() {
        settings.injectionPosition = parseInt(this.value) || 1;
        saveSettings();
    });
    
    $('#horae-btn-scan-all, #horae-btn-scan-history').on('click', scanHistoryWithProgress);
    $('#horae-btn-ai-scan').on('click', batchAIScan);
    $('#horae-btn-undo-ai-scan').on('click', undoAIScan);
    
    $('#horae-timeline-filter').on('change', updateTimelineDisplay);
    $('#horae-timeline-search').on('input', updateTimelineDisplay);
    
    $('#horae-btn-add-agenda').on('click', () => openAgendaEditModal(null));
    $('#horae-btn-add-relationship').on('click', () => openRelationshipEditModal(null));
    $('#horae-btn-add-location').on('click', () => openLocationEditModal(null));
    $('#horae-btn-merge-locations').on('click', openLocationMergeModal);
    
    $('#horae-btn-agenda-select-all').on('click', selectAllAgenda);
    $('#horae-btn-agenda-delete').on('click', deleteSelectedAgenda);
    $('#horae-btn-agenda-cancel-select').on('click', exitAgendaMultiSelect);
    
    $('#horae-btn-timeline-multiselect').on('click', () => {
        if (timelineMultiSelectMode) {
            exitTimelineMultiSelect();
        } else {
            enterTimelineMultiSelect(null);
        }
    });
    $('#horae-btn-timeline-select-all').on('click', selectAllTimelineEvents);
    $('#horae-btn-timeline-compress').on('click', compressSelectedTimelineEvents);
    $('#horae-btn-timeline-delete').on('click', deleteSelectedTimelineEvents);
    $('#horae-btn-timeline-cancel-select').on('click', exitTimelineMultiSelect);
    
    $('#horae-items-search').on('input', updateItemsDisplay);
    $('#horae-items-filter').on('change', updateItemsDisplay);
    $('#horae-items-holder-filter').on('change', updateItemsDisplay);
    
    $('#horae-btn-items-select-all').on('click', selectAllItems);
    $('#horae-btn-items-delete').on('click', deleteSelectedItems);
    $('#horae-btn-items-cancel-select').on('click', exitMultiSelectMode);
    
    $('#horae-btn-items-refresh').on('click', () => {
        updateItemsDisplay();
        showToast('物品列表已刷新', 'info');
    });
    
    $('#horae-setting-send-timeline').on('change', function() {
        settings.sendTimeline = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });
    
    $('#horae-setting-send-characters').on('change', function() {
        settings.sendCharacters = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });
    
    $('#horae-setting-send-items').on('change', function() {
        settings.sendItems = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });
    
    $('#horae-setting-send-location-memory').on('change', function() {
        settings.sendLocationMemory = this.checked;
        saveSettings();
        $('#horae-location-prompt-group').toggle(this.checked);
        $('.horae-tab[data-tab="locations"]').toggle(this.checked);
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });
    
    $('#horae-setting-send-relationships').on('change', function() {
        settings.sendRelationships = this.checked;
        saveSettings();
        $('#horae-relationship-section').toggle(this.checked);
        $('#horae-relationship-prompt-group').toggle(this.checked);
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        if (this.checked) updateRelationshipDisplay();
    });
    
    $('#horae-setting-send-mood').on('change', function() {
        settings.sendMood = this.checked;
        saveSettings();
        $('#horae-mood-prompt-group').toggle(this.checked);
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    // 自动摘要折叠面板
    $('#horae-autosummary-collapse-toggle').on('click', function() {
        const body = $('#horae-autosummary-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 自动摘要设置
    $('#horae-setting-auto-summary').on('change', function() {
        settings.autoSummaryEnabled = this.checked;
        saveSettings();
        $('#horae-auto-summary-options').toggle(this.checked);
    });
    $('#horae-setting-auto-summary-keep').on('change', function() {
        settings.autoSummaryKeepRecent = Math.max(3, parseInt(this.value) || 10);
        this.value = settings.autoSummaryKeepRecent;
        saveSettings();
    });
    $('#horae-setting-auto-summary-mode').on('change', function() {
        settings.autoSummaryBufferMode = this.value;
        saveSettings();
        updateAutoSummaryHint();
    });
    $('#horae-setting-auto-summary-limit').on('change', function() {
        settings.autoSummaryBufferLimit = Math.max(5, parseInt(this.value) || 20);
        this.value = settings.autoSummaryBufferLimit;
        saveSettings();
    });
    $('#horae-setting-auto-summary-custom-api').on('change', function() {
        settings.autoSummaryUseCustomApi = this.checked;
        saveSettings();
        $('#horae-auto-summary-api-options').toggle(this.checked);
    });
    $('#horae-setting-auto-summary-api-url').on('input', function() {
        settings.autoSummaryApiUrl = this.value;
        saveSettings();
    });
    $('#horae-setting-auto-summary-api-key').on('input', function() {
        settings.autoSummaryApiKey = this.value;
        saveSettings();
    });
    $('#horae-setting-auto-summary-model').on('input', function() {
        settings.autoSummaryModel = this.value;
        saveSettings();
    });
    
    $('#horae-setting-panel-width').on('change', function() {
        let val = parseInt(this.value) || 100;
        val = Math.max(50, Math.min(100, val));
        this.value = val;
        settings.panelWidth = val;
        saveSettings();
        applyPanelWidth();
    });

    // 主题模式切换
    $('#horae-setting-theme-mode').on('change', function() {
        settings.themeMode = this.value;
        saveSettings();
        applyThemeMode();
    });

    // 美化导入/导出/删除
    $('#horae-btn-theme-export').on('click', exportTheme);
    $('#horae-btn-theme-import').on('click', importTheme);
    $('#horae-btn-theme-delete').on('click', function() {
        const mode = settings.themeMode || 'dark';
        if (!mode.startsWith('custom-')) {
            showToast('仅可删除导入的自定义美化', 'warning');
            return;
        }
        deleteCustomTheme(parseInt(mode.split('-')[1]));
    });

    // 自定义CSS
    $('#horae-custom-css').on('change', function() {
        settings.customCSS = this.value;
        saveSettings();
        applyCustomCSS();
    });
    
    $('#horae-btn-refresh').on('click', refreshAllDisplays);
    
    $('#horae-btn-add-table-local').on('click', () => addNewExcelTable('local'));
    $('#horae-btn-add-table-global').on('click', () => addNewExcelTable('global'));
    $('#horae-btn-import-table').on('click', () => {
        $('#horae-import-table-file').trigger('click');
    });
    $('#horae-import-table-file').on('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importTable(file);
            e.target.value = ''; // 清空以便可以再次选择同一文件
        }
    });
    renderCustomTablesList();
    
    $('#horae-btn-export').on('click', exportData);
    $('#horae-btn-import').on('click', importData);
    $('#horae-btn-clear').on('click', clearAllData);
    
    // 好感度显示/隐藏（不可用hidden类名，酒馆全局有display:none规则）
    $('#horae-affection-toggle').on('click', function() {
        const list = $('#horae-affection-list');
        const icon = $(this).find('i');
        if (list.is(':visible')) {
            list.hide();
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
            $(this).addClass('horae-eye-off');
        } else {
            list.show();
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
            $(this).removeClass('horae-eye-off');
        }
    });
    
    // 自定义提示词
    $('#horae-custom-system-prompt').on('input', function() {
        const val = this.value;
        // 与默认一致时视为未自定义
        settings.customSystemPrompt = (val.trim() === horaeManager.getDefaultSystemPrompt().trim()) ? '' : val;
        $('#horae-system-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });
    
    $('#horae-custom-batch-prompt').on('input', function() {
        const val = this.value;
        settings.customBatchPrompt = (val.trim() === getDefaultBatchPrompt().trim()) ? '' : val;
        $('#horae-batch-prompt-count').text(val.length);
        saveSettings();
    });
    
    $('#horae-btn-reset-system-prompt').on('click', () => {
        if (!confirm('确定恢复系统注入提示词为默认值？')) return;
        settings.customSystemPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultSystemPrompt();
        $('#horae-custom-system-prompt').val(def);
        $('#horae-system-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast('已恢复默认提示词', 'success');
    });
    
    $('#horae-btn-reset-batch-prompt').on('click', () => {
        if (!confirm('确定恢复AI摘要提示词为默认值？')) return;
        settings.customBatchPrompt = '';
        saveSettings();
        const def = getDefaultBatchPrompt();
        $('#horae-custom-batch-prompt').val(def);
        $('#horae-batch-prompt-count').text(def.length);
        showToast('已恢复默认提示词', 'success');
    });

    // AI分析提示词
    $('#horae-custom-analysis-prompt').on('input', function() {
        const val = this.value;
        settings.customAnalysisPrompt = (val.trim() === getDefaultAnalysisPrompt().trim()) ? '' : val;
        $('#horae-analysis-prompt-count').text(val.length);
        saveSettings();
    });

    $('#horae-btn-reset-analysis-prompt').on('click', () => {
        if (!confirm('确定恢复AI分析提示词为默认值？')) return;
        settings.customAnalysisPrompt = '';
        saveSettings();
        const def = getDefaultAnalysisPrompt();
        $('#horae-custom-analysis-prompt').val(def);
        $('#horae-analysis-prompt-count').text(def.length);
        showToast('已恢复默认提示词', 'success');
    });

    // 剧情压缩提示词
    $('#horae-custom-compress-prompt').on('input', function() {
        const val = this.value;
        settings.customCompressPrompt = (val.trim() === getDefaultCompressPrompt().trim()) ? '' : val;
        $('#horae-compress-prompt-count').text(val.length);
        saveSettings();
    });

    $('#horae-btn-reset-compress-prompt').on('click', () => {
        if (!confirm('确定恢复剧情压缩提示词为默认值？')) return;
        settings.customCompressPrompt = '';
        saveSettings();
        const def = getDefaultCompressPrompt();
        $('#horae-custom-compress-prompt').val(def);
        $('#horae-compress-prompt-count').text(def.length);
        showToast('已恢复默认提示词', 'success');
    });

    // 表格填写规则提示词
    $('#horae-custom-tables-prompt').on('input', function() {
        const val = this.value;
        settings.customTablesPrompt = (val.trim() === horaeManager.getDefaultTablesPrompt().trim()) ? '' : val;
        $('#horae-tables-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-btn-reset-tables-prompt').on('click', () => {
        if (!confirm('确定恢复表格填写规则提示词为默认值？')) return;
        settings.customTablesPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultTablesPrompt();
        $('#horae-custom-tables-prompt').val(def);
        $('#horae-tables-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast('已恢复默认提示词', 'success');
    });

    // 场景记忆提示词
    $('#horae-custom-location-prompt').on('input', function() {
        const val = this.value;
        settings.customLocationPrompt = (val.trim() === horaeManager.getDefaultLocationPrompt().trim()) ? '' : val;
        $('#horae-location-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-btn-reset-location-prompt').on('click', () => {
        if (!confirm('确定恢复场景记忆提示词为默认值？')) return;
        settings.customLocationPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultLocationPrompt();
        $('#horae-custom-location-prompt').val(def);
        $('#horae-location-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast('已恢复默认提示词', 'success');
    });

    // 关系网络提示词
    $('#horae-custom-relationship-prompt').on('input', function() {
        const val = this.value;
        settings.customRelationshipPrompt = (val.trim() === horaeManager.getDefaultRelationshipPrompt().trim()) ? '' : val;
        $('#horae-relationship-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-btn-reset-relationship-prompt').on('click', () => {
        if (!confirm('确定恢复关系网络提示词为默认值？')) return;
        settings.customRelationshipPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultRelationshipPrompt();
        $('#horae-custom-relationship-prompt').val(def);
        $('#horae-relationship-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast('已恢复默认提示词', 'success');
    });

    // 情绪追踪提示词
    $('#horae-custom-mood-prompt').on('input', function() {
        const val = this.value;
        settings.customMoodPrompt = (val.trim() === horaeManager.getDefaultMoodPrompt().trim()) ? '' : val;
        $('#horae-mood-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-btn-reset-mood-prompt').on('click', () => {
        if (!confirm('确定恢复情绪追踪提示词为默认值？')) return;
        settings.customMoodPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultMoodPrompt();
        $('#horae-custom-mood-prompt').val(def);
        $('#horae-mood-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast('已恢复默认提示词', 'success');
    });

    // 提示词区域折叠切换
    $('#horae-prompt-collapse-toggle').on('click', function() {
        const body = $('#horae-prompt-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 自定义CSS区域折叠切换
    $('#horae-css-collapse-toggle').on('click', function() {
        const body = $('#horae-css-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });
}

/**
 * 同步设置到UI
 */
function _refreshSystemPromptDisplay() {
    if (settings.customSystemPrompt) return;
    const def = horaeManager.getDefaultSystemPrompt();
    $('#horae-custom-system-prompt').val(def);
    $('#horae-system-prompt-count').text(def.length);
}

function syncSettingsToUI() {
    $('#horae-setting-enabled').prop('checked', settings.enabled);
    $('#horae-setting-auto-parse').prop('checked', settings.autoParse);
    $('#horae-setting-inject-context').prop('checked', settings.injectContext);
    $('#horae-setting-show-panel').prop('checked', settings.showMessagePanel);
    $('#horae-setting-show-top-icon').prop('checked', settings.showTopIcon !== false);
    $('#horae-ext-show-top-icon').prop('checked', settings.showTopIcon !== false);
    $('#horae-setting-context-depth').val(settings.contextDepth);
    $('#horae-setting-injection-position').val(settings.injectionPosition);
    $('#horae-setting-send-timeline').prop('checked', settings.sendTimeline);
    $('#horae-setting-send-characters').prop('checked', settings.sendCharacters);
    $('#horae-setting-send-items').prop('checked', settings.sendItems);
    
    applyTopIconVisibility();
    
    // 场景记忆
    $('#horae-setting-send-location-memory').prop('checked', !!settings.sendLocationMemory);
    $('#horae-location-prompt-group').toggle(!!settings.sendLocationMemory);
    $('.horae-tab[data-tab="locations"]').toggle(!!settings.sendLocationMemory);
    
    // 关系网络
    $('#horae-setting-send-relationships').prop('checked', !!settings.sendRelationships);
    $('#horae-relationship-section').toggle(!!settings.sendRelationships);
    $('#horae-relationship-prompt-group').toggle(!!settings.sendRelationships);
    
    // 情绪追踪
    $('#horae-setting-send-mood').prop('checked', !!settings.sendMood);
    $('#horae-mood-prompt-group').toggle(!!settings.sendMood);
    
    // 自动摘要
    $('#horae-setting-auto-summary').prop('checked', !!settings.autoSummaryEnabled);
    $('#horae-auto-summary-options').toggle(!!settings.autoSummaryEnabled);
    $('#horae-setting-auto-summary-keep').val(settings.autoSummaryKeepRecent || 10);
    $('#horae-setting-auto-summary-mode').val(settings.autoSummaryBufferMode || 'messages');
    $('#horae-setting-auto-summary-limit').val(settings.autoSummaryBufferLimit || 20);
    $('#horae-setting-auto-summary-custom-api').prop('checked', !!settings.autoSummaryUseCustomApi);
    $('#horae-auto-summary-api-options').toggle(!!settings.autoSummaryUseCustomApi);
    $('#horae-setting-auto-summary-api-url').val(settings.autoSummaryApiUrl || '');
    $('#horae-setting-auto-summary-api-key').val(settings.autoSummaryApiKey || '');
    $('#horae-setting-auto-summary-model').val(settings.autoSummaryModel || '');
    updateAutoSummaryHint();

    const sysPrompt = settings.customSystemPrompt || horaeManager.getDefaultSystemPrompt();
    const batchPromptVal = settings.customBatchPrompt || getDefaultBatchPrompt();
    const analysisPromptVal = settings.customAnalysisPrompt || getDefaultAnalysisPrompt();
    const compressPromptVal = settings.customCompressPrompt || getDefaultCompressPrompt();
    const tablesPromptVal = settings.customTablesPrompt || horaeManager.getDefaultTablesPrompt();
    const locationPromptVal = settings.customLocationPrompt || horaeManager.getDefaultLocationPrompt();
    const relPromptVal = settings.customRelationshipPrompt || horaeManager.getDefaultRelationshipPrompt();
    const moodPromptVal = settings.customMoodPrompt || horaeManager.getDefaultMoodPrompt();
    $('#horae-custom-system-prompt').val(sysPrompt);
    $('#horae-custom-batch-prompt').val(batchPromptVal);
    $('#horae-custom-analysis-prompt').val(analysisPromptVal);
    $('#horae-custom-compress-prompt').val(compressPromptVal);
    $('#horae-custom-tables-prompt').val(tablesPromptVal);
    $('#horae-custom-location-prompt').val(locationPromptVal);
    $('#horae-custom-relationship-prompt').val(relPromptVal);
    $('#horae-custom-mood-prompt').val(moodPromptVal);
    $('#horae-system-prompt-count').text(sysPrompt.length);
    $('#horae-batch-prompt-count').text(batchPromptVal.length);
    $('#horae-analysis-prompt-count').text(analysisPromptVal.length);
    $('#horae-compress-prompt-count').text(compressPromptVal.length);
    $('#horae-tables-prompt-count').text(tablesPromptVal.length);
    $('#horae-location-prompt-count').text(locationPromptVal.length);
    $('#horae-relationship-prompt-count').text(relPromptVal.length);
    $('#horae-mood-prompt-count').text(moodPromptVal.length);
    
    // 面板宽度
    $('#horae-setting-panel-width').val(settings.panelWidth || 100);
    applyPanelWidth();

    // 主题模式
    refreshThemeSelector();
    applyThemeMode();

    // 自定义CSS
    $('#horae-custom-css').val(settings.customCSS || '');
    applyCustomCSS();
}

// ============================================
// 核心功能
// ============================================

/**
 * 带进度显示的历史扫描
 */
async function scanHistoryWithProgress() {
    const overlay = document.createElement('div');
    overlay.className = 'horae-progress-overlay' + (settings.themeMode === 'light' ? ' horae-light' : '');
    overlay.innerHTML = `
        <div class="horae-progress-container">
            <div class="horae-progress-title">正在扫描历史记录...</div>
            <div class="horae-progress-bar">
                <div class="horae-progress-fill" style="width: 0%"></div>
            </div>
            <div class="horae-progress-text">准备中...</div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    const fillEl = overlay.querySelector('.horae-progress-fill');
    const textEl = overlay.querySelector('.horae-progress-text');
    
    try {
        const result = await horaeManager.scanAndInjectHistory(
            (percent, current, total) => {
                fillEl.style.width = `${percent}%`;
                textEl.textContent = `处理中... ${current}/${total}`;
            },
            null // 不使用AI分析，只解析已有标签
        );
        
        horaeManager.rebuildTableData();
        
        await getContext().saveChat();
        
        showToast(`扫描完成！处理 ${result.processed} 条，跳过 ${result.skipped} 条`, 'success');
        refreshAllDisplays();
        renderCustomTablesList();
    } catch (error) {
        console.error('[Horae] 扫描失败:', error);
        showToast('扫描失败: ' + error.message, 'error');
    } finally {
        overlay.remove();
    }
}

/** 默认的批量摘要提示词模板 */
function getDefaultBatchPrompt() {
    return `你是剧情分析助手。请逐条分析以下对话记录，为每条消息提取【时间】【剧情事件】和【物品变化】。

核心原则：
- 只提取文本中明确出现的信息，禁止编造
- 每条消息独立分析，用 ===消息#编号=== 分隔

{{messages}}

【输出格式】每条消息按以下格式输出：

===消息#编号===
<horae>
time:日期 时间（从文本中提取，如 2026/2/4 15:00 或 霜降月第三日 黄昏）
item:emoji物品名(数量)|描述=持有者@位置（新获得的物品，普通物品可省描述）
item!:emoji物品名(数量)|描述=持有者@位置（重要物品，描述必填）
item-:物品名（消耗/丢失/用完的物品）
</horae>
<horaeevent>
event:重要程度|事件简述（30-50字，重要程度：一般/重要/关键）
</horaeevent>

【规则】
· time：从文本中提取当前场景的日期时间，必填（没有明确时间则根据上下文推断）
· event：本条消息中发生的关键剧情，每条消息至少一个 event
· 物品仅在获得、消耗、状态改变时记录，无变化则不写 item 行
· item格式：emoji前缀如🔑🍞，单件不写(1)，位置需精确（❌地上 ✅酒馆大厅桌上）
· 重要程度判断：日常对话=一般，推动剧情=重要，关键转折=关键
· {{user}} 是主角名`;
}

/** 默认的AI分析提示词模板 */
function getDefaultAnalysisPrompt() {
    return `请分析以下文本，提取关键信息并以指定格式输出。核心原则：只提取文本中明确提到的信息，没有的字段不写，禁止编造。

【文本内容】
{{content}}

【输出格式】
<horae>
time:日期 时间（必填，如 2026/2/4 15:00 或 霜降月第一日 19:50）
location:当前地点（必填）
atmosphere:氛围
characters:在场角色,逗号分隔（必填）
costume:角色名=完整服装描述（必填，每人一行，禁止分号合并）
item:emoji物品名(数量)|描述=持有者@精确位置（仅新获得或有变化的物品）
item!:emoji物品名(数量)|描述=持有者@精确位置（重要物品，描述必填）
item!!:emoji物品名(数量)|描述=持有者@精确位置（关键道具，描述必须详细）
item-:物品名（消耗/丢失的物品）
affection:角色名=好感度数值（仅NPC对{{user}}的好感，禁止记录{{user}}自己，禁止数值后加注解）
npc:角色名|外貌=性格@与{{user}}的关系~性别:男或女~年龄:数字~种族:种族名~职业:职业名
agenda:订立日期|待办内容（仅在出现新约定/计划/伏笔时写入，相对时间须括号标注绝对日期）
agenda-:内容关键词（待办已完成/失效/取消时写入，系统自动移除匹配的待办）
</horae>
<horaeevent>
event:重要程度|事件简述（30-50字，一般/重要/关键）
</horaeevent>

【触发条件】只在满足条件时才输出对应字段：
· 物品：仅新获得、数量/归属/位置改变、消耗丢失时写。无变化不写。单件不写(1)。emoji前缀如🔑🍞。
· NPC：首次出场必须完整（含~性别/年龄/种族/职业）。之后仅变化的字段写，无变化不写。
  分隔符：| 分名字，= 分外貌和性格，@ 分关系，~ 分扩展字段
· 好感度：首次按关系判定（陌生0-20/熟人30-50/朋友50-70），之后仅变化时写。
· 待办：仅出现新约定/计划/伏笔时写。已完成/失效的待办用 agenda-: 移除。
  新增：agenda:2026/02/10|艾伦邀请{{user}}情人节晚上约会(2026/02/14 18:00)
  完成：agenda-:艾伦邀请{{user}}情人节晚上约会
· event：放在<horaeevent>内，不放在<horae>内。`;
}

let _autoSummaryRanThisTurn = false;

/**
 * 自动摘要生成入口
 * useProfile=true 时允许切换连接配置（仅在AI回复后的顺序模式使用）
 * useProfile=false 时直接调用 generateRaw（并行安全）
 */
async function generateForSummary(prompt) {
    if (settings.autoSummaryUseCustomApi && settings.autoSummaryApiUrl && settings.autoSummaryApiKey && settings.autoSummaryModel) {
        return await generateWithDirectApi(prompt);
    }
    return await getContext().generateRaw(prompt, null, false, false);
}

/** 直接请求 OpenAI 兼容端点，完全独立于酒馆主连接，支持真并行 */
async function generateWithDirectApi(prompt) {
    let url = settings.autoSummaryApiUrl.trim();
    if (!url.endsWith('/chat/completions')) {
        url = url.replace(/\/+$/, '') + '/chat/completions';
    }
    const body = {
        model: settings.autoSummaryModel.trim(),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        stream: false
    };
    console.log(`[Horae] 独立API请求: ${url}, 模型: ${body.model}`);
    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.autoSummaryApiKey.trim()}`
            },
            body: JSON.stringify(body)
        });
        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            throw new Error(`独立API返回 ${resp.status}: ${errText.slice(0, 200)}`);
        }
        const data = await resp.json();
        return data?.choices?.[0]?.message?.content || '';
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            throw new Error('独立API请求被浏览器拦截（CORS），请确认端点地址或在酒馆 config.yaml 中启用 enableCorsProxy');
        }
        throw err;
    }
}

/** 自动摘要：检查是否需要触发 */
async function checkAutoSummary() {
    if (!settings.autoSummaryEnabled || !settings.sendTimeline) return;
    if (_summaryInProgress) return;
    _summaryInProgress = true;
    
    try {
        const chat = horaeManager.getChat();
        if (!chat?.length) return;
        
        const keepRecent = settings.autoSummaryKeepRecent || 10;
        const bufferLimit = settings.autoSummaryBufferLimit || 20;
        const bufferMode = settings.autoSummaryBufferMode || 'messages';
        
        const totalMsgs = chat.length;
        const cutoff = Math.max(1, totalMsgs - keepRecent);
        
        // 收集已被活跃摘要覆盖的消息索引（无论 is_hidden 是否生效都排除）
        const summarizedIndices = new Set();
        const existingSums = chat[0]?.horae_meta?.autoSummaries || [];
        for (const s of existingSums) {
            if (!s.active || !s.range) continue;
            for (let r = s.range[0]; r <= s.range[1]; r++) {
                summarizedIndices.add(r);
            }
        }
        
        const bufferMsgIndices = [];
        let bufferTokens = 0;
        for (let i = 1; i < cutoff; i++) {
            if (chat[i]?.is_hidden || summarizedIndices.has(i)) continue;
            bufferMsgIndices.push(i);
            if (bufferMode === 'tokens') {
                bufferTokens += estimateTokens(chat[i]?.mes || '');
            }
        }
        
        let shouldTrigger = false;
        if (bufferMode === 'tokens') {
            shouldTrigger = bufferTokens > bufferLimit;
        } else {
            shouldTrigger = bufferMsgIndices.length > bufferLimit;
        }
        
        console.log(`[Horae] 自动摘要检查：${bufferMsgIndices.length}条缓冲消息(${bufferMode === 'tokens' ? bufferTokens + 'tok' : bufferMsgIndices.length + '条'})，阈值${bufferLimit}，${shouldTrigger ? '触发' : '未达阈值'}`);
        
        if (!shouldTrigger || bufferMsgIndices.length === 0) return;
        
        const bufferEvents = [];
        for (const i of bufferMsgIndices) {
            const meta = chat[i]?.horae_meta;
            if (!meta?.events) continue;
            for (let j = 0; j < meta.events.length; j++) {
                const evt = meta.events[j];
                if (!evt?.summary || evt._compressedBy || evt.isSummary) continue;
                bufferEvents.push({
                    msgIdx: i, evtIdx: j,
                    date: meta.timestamp?.story_date || '?',
                    time: meta.timestamp?.story_time || '',
                    level: evt.level || '一般',
                    summary: evt.summary
                });
            }
        }
        
        showToast(`自动摘要：正在压缩 ${bufferMsgIndices.length} 条消息...`, 'info');
        
        const context = getContext();
        const userName = context?.name1 || '主角';
        
        const msgIndices = [...bufferMsgIndices].sort((a, b) => a - b);
        const fullTexts = msgIndices.map(idx => {
            const msg = chat[idx];
            const d = msg?.horae_meta?.timestamp?.story_date || '';
            const t = msg?.horae_meta?.timestamp?.story_time || '';
            return `【#${idx}${d ? ' ' + d : ''}${t ? ' ' + t : ''}】\n${msg?.mes || ''}`;
        });
        const sourceText = fullTexts.join('\n\n');
        
        const eventText = bufferEvents.map(e => `[${e.level}] ${e.date}${e.time ? ' ' + e.time : ''}: ${e.summary}`).join('\n');
        const fullTemplate = settings.customCompressPrompt || getDefaultCompressPrompt();
        const section = parseCompressPrompt(fullTemplate, 'fulltext');
        const prompt = section
            .replace(/\{\{events\}\}/gi, eventText)
            .replace(/\{\{fulltext\}\}/gi, sourceText)
            .replace(/\{\{count\}\}/gi, String(bufferEvents.length))
            .replace(/\{\{user\}\}/gi, userName)
            + '\n\n【重要】只输出纯文本摘要，禁止输出任何XML标签（如<horae>、<horaeevent>等）。';
        
        const response = await generateForSummary(prompt);
        if (!response?.trim()) {
            showToast('自动摘要：AI返回为空', 'warning');
            return;
        }
        
        // 清洗 AI 回复中的 horae 标签，只保留纯文本摘要
        let summaryText = response.trim()
            .replace(/<horae>[\s\S]*?<\/horae>/gi, '')
            .replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, '')
            .replace(/<!--horae[\s\S]*?-->/gi, '')
            .trim();
        if (!summaryText) {
            showToast('自动摘要：清洗标签后内容为空', 'warning');
            return;
        }

        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.autoSummaries) firstMsg.horae_meta.autoSummaries = [];
        
        const originalEvents = bufferEvents.map(e => ({
            msgIdx: e.msgIdx, evtIdx: e.evtIdx,
            event: { ...chat[e.msgIdx]?.horae_meta?.events?.[e.evtIdx] },
            timestamp: chat[e.msgIdx]?.horae_meta?.timestamp
        }));
        
        const summaryId = `as_${Date.now()}`;
        firstMsg.horae_meta.autoSummaries.push({
            id: summaryId,
            range: [msgIndices[0], msgIndices[msgIndices.length - 1]],
            summaryText,
            originalEvents,
            active: true,
            createdAt: new Date().toISOString(),
            auto: true
        });
        
        // 标记原始事件为已压缩（active 时隐藏原始事件显示摘要）
        for (const e of bufferEvents) {
            const meta = chat[e.msgIdx]?.horae_meta;
            if (meta?.events?.[e.evtIdx]) {
                meta.events[e.evtIdx]._compressedBy = summaryId;
            }
        }
        
        // 在最早的有事件的消息上插入摘要事件（该消息必定有 horae_meta）
        const targetIdx = bufferEvents[0].msgIdx;
        const targetMeta = chat[targetIdx].horae_meta;
        if (!targetMeta.events) targetMeta.events = [];
        targetMeta.events.push({
            is_important: true,
            level: '摘要',
            summary: summaryText,
            isSummary: true,
            _summaryId: summaryId
        });
        
        // /hide 被摘要的消息楼层（省 token，active 时不发送给 AI）
        await setMessagesHidden(chat, msgIndices, true);
        
        await context.saveChat();
        updateTimelineDisplay();
        showToast(`自动摘要完成：#${msgIndices[0]}-#${msgIndices[msgIndices.length - 1]}`, 'success');
    } catch (err) {
        console.error('[Horae] 自动摘要失败:', err);
        showToast(`自动摘要失败: ${err.message || err}`, 'error');
    } finally {
        _summaryInProgress = false;
    }
}

/** 默认的剧情压缩提示词（含事件压缩和全文摘要两段，以分隔线区分） */
function getDefaultCompressPrompt() {
    return `=====【事件压缩】=====
你是剧情压缩助手。请将以下{{count}}条剧情事件压缩为一段简洁的摘要（100-200字），保留关键信息和因果关系。

{{events}}

要求：
- 按时间顺序叙述，保留重要转折点
- 人名、地名必须保留原文
- 输出纯文本摘要，不要添加任何标记或格式
- 不要遗漏「关键」和「重要」级别的事件
- {{user}} 是主角名
- 语言风格：简洁客观的叙事体

=====【全文摘要】=====
你是剧情压缩助手。请阅读以下对话记录，将其压缩为一段精炼的剧情摘要（150-300字），保留关键信息和因果关系。

{{fulltext}}

要求：
- 按时间顺序叙述，保留重要转折点和关键细节
- 人名、地名必须保留原文
- 输出纯文本摘要，不要添加任何标记或格式
- 保留人物的关键对话和情绪变化
- {{user}} 是主角名
- 语言风格：简洁客观的叙事体`;
}

/** 从压缩提示词模板中按模式提取对应的 prompt 段 */
function parseCompressPrompt(template, mode) {
    const eventRe = /=+【事件压缩】=+/;
    const fulltextRe = /=+【全文摘要】=+/;
    const eMatch = template.match(eventRe);
    const fMatch = template.match(fulltextRe);
    if (eMatch && fMatch) {
        const eStart = eMatch.index + eMatch[0].length;
        const fStart = fMatch.index + fMatch[0].length;
        if (eMatch.index < fMatch.index) {
            const eventSection = template.substring(eStart, fMatch.index).trim();
            const fulltextSection = template.substring(fStart).trim();
            return mode === 'fulltext' ? fulltextSection : eventSection;
        } else {
            const fulltextSection = template.substring(fStart, eMatch.index).trim();
            const eventSection = template.substring(eStart).trim();
            return mode === 'fulltext' ? fulltextSection : eventSection;
        }
    }
    // 无分隔线：整段当通用 prompt
    return template;
}

/** 根据缓冲模式动态更新缓冲上限的说明文案 */
function updateAutoSummaryHint() {
    const hintEl = document.getElementById('horae-auto-summary-limit-hint');
    if (!hintEl) return;
    const mode = settings.autoSummaryBufferMode || 'messages';
    if (mode === 'tokens') {
        hintEl.innerHTML = '填入Token上限。超过后触发自动压缩。<br>' +
            '<small>参考：Claude ≈ 80K~200K · GPT-4o ≈ 128K · Gemini ≈ 1M~2M<br>' +
            '建议设为模型上下文窗口的 30%~50%，留出足够空间给其他内容。</small>';
    } else {
        hintEl.innerHTML = '填入楼层数（消息条数）。超过后触发自动压缩。<br>' +
            '<small>即「保留最近消息数」之外的多余消息达到此数量时，自动将其压缩为摘要。</small>';
    }
}

/** 估算文本的token数（CJK按1.5、其余按0.4） */
function estimateTokens(text) {
    if (!text) return 0;
    const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
    const rest = text.length - cjk;
    return Math.ceil(cjk * 1.5 + rest * 0.4);
}

/** AI智能摘要 — 批量分析历史消息，暂存结果后弹出审阅视窗 */
async function batchAIScan() {
    const chat = horaeManager.getChat();
    if (!chat || chat.length === 0) {
        showToast('当前没有聊天记录', 'warning');
        return;
    }

    const targets = [];
    for (let i = 0; i < chat.length; i++) {
        const msg = chat[i];
        if (msg.is_user || !msg.mes || msg.mes.trim().length < 20) continue;
        const meta = msg.horae_meta;
        if (meta?.events?.length > 0 && !meta?._aiScanned) continue;
        targets.push({ index: i, text: msg.mes });
    }

    if (targets.length === 0) {
        showToast('所有消息已有记忆数据，无需扫描', 'info');
        return;
    }

    const scanConfig = await showAIScanConfigDialog(targets.length);
    if (!scanConfig) return;
    const { tokenLimit, includeNpc, includeAffection, includeScene, includeRelationship } = scanConfig;

    const batches = [];
    let currentBatch = [], currentTokens = 0;
    for (const t of targets) {
        const tokens = estimateTokens(t.text);
        if (currentBatch.length > 0 && currentTokens + tokens > tokenLimit) {
            batches.push(currentBatch);
            currentBatch = [];
            currentTokens = 0;
        }
        currentBatch.push(t);
        currentTokens += tokens;
    }
    if (currentBatch.length > 0) batches.push(currentBatch);

    const confirmMsg = `预计分 ${batches.length} 批处理，消耗 ${batches.length} 次生成\n\n· 再次扫描会覆盖上次的AI摘要结果\n· 扫描后可「撤销摘要」还原\n\n是否继续？`;
    if (!confirm(confirmMsg)) return;

    const scanResults = await executeBatchScan(batches, { includeNpc, includeAffection, includeScene, includeRelationship });
    if (scanResults.length === 0) {
        showToast('未提取到任何摘要数据', 'warning');
        return;
    }
    showScanReviewModal(scanResults, { includeNpc, includeAffection, includeScene, includeRelationship });
}

/** 执行批量扫描，返回暂存结果（不写入chat） */
async function executeBatchScan(batches, options = {}) {
    const { includeNpc, includeAffection, includeScene, includeRelationship } = options;
    let cancelled = false;
    let cancelResolve = null;
    const cancelPromise = new Promise(resolve => { cancelResolve = resolve; });

    // 用于真正中止HTTP请求的AbortController（fetch层面）
    const fetchAbort = new AbortController();
    const _origFetch = window.fetch;
    window.fetch = function(input, init = {}) {
        if (!cancelled) {
            const ourSignal = fetchAbort.signal;
            if (init.signal && typeof AbortSignal.any === 'function') {
                init.signal = AbortSignal.any([init.signal, ourSignal]);
            } else {
                init.signal = ourSignal;
            }
        }
        return _origFetch.call(this, input, init);
    };

    const overlay = document.createElement('div');
    overlay.className = 'horae-progress-overlay' + (settings.themeMode === 'light' ? ' horae-light' : '');
    overlay.innerHTML = `
        <div class="horae-progress-container">
            <div class="horae-progress-title">AI 智能摘要中...</div>
            <div class="horae-progress-bar">
                <div class="horae-progress-fill" style="width: 0%"></div>
            </div>
            <div class="horae-progress-text">准备中...</div>
            <button class="horae-progress-cancel"><i class="fa-solid fa-xmark"></i> 取消摘要</button>
        </div>
    `;
    document.body.appendChild(overlay);
    const fillEl = overlay.querySelector('.horae-progress-fill');
    const textEl = overlay.querySelector('.horae-progress-text');
    const context = getContext();
    const userName = context?.name1 || '主角';

    // 取消：中止fetch请求 + stopGeneration + Promise.race跳出
    overlay.querySelector('.horae-progress-cancel').addEventListener('click', () => {
        if (cancelled) return;
        if (!confirm('取消后已完成的摘要将不会保存，确定取消？')) return;
        cancelled = true;
        fetchAbort.abort();
        try { context.stopGeneration(); } catch (_) {}
        cancelResolve();
        overlay.remove();
        showToast('已取消摘要生成', 'info');
    });
    const scanResults = [];

    // 动态构建允许的标签
    let allowedTags = 'time、item、event';
    let forbiddenNote = '禁止输出 agenda/costume/location/atmosphere/characters';
    if (!includeNpc) forbiddenNote += '/npc';
    if (!includeAffection) forbiddenNote += '/affection';
    if (!includeScene) forbiddenNote += '/scene_desc';
    if (!includeRelationship) forbiddenNote += '/rel';
    forbiddenNote += ' 等其他标签';
    if (includeNpc) allowedTags += '、npc';
    if (includeAffection) allowedTags += '、affection';
    if (includeScene) allowedTags += '、scene_desc';
    if (includeRelationship) allowedTags += '、rel';

    for (let b = 0; b < batches.length; b++) {
        if (cancelled) break;
        const batch = batches[b];
        textEl.textContent = `第 ${b + 1}/${batches.length} 批（${batch.length} 条消息）...`;
        fillEl.style.width = `${Math.round((b / batches.length) * 100)}%`;

        const messagesBlock = batch.map(t => `【消息#${t.index}】\n${t.text}`).join('\n\n');

        // 自定义摘要prompt或默认
        let batchPrompt;
        if (settings.customBatchPrompt) {
            batchPrompt = settings.customBatchPrompt
                .replace(/\{\{user\}\}/gi, userName)
                .replace(/\{\{messages\}\}/gi, messagesBlock);
        } else {
            let extraFormat = '';
            let extraRules = '';
            if (includeNpc) {
                extraFormat += `\nnpc:角色名|外貌=性格@与${userName}的关系~性别:值~年龄:值~种族:值~职业:值（仅首次出场或信息变化时）`;
                extraRules += `\n· NPC：首次出场完整记录（含~扩展字段），之后仅变化时写`;
            }
            if (includeAffection) {
                extraFormat += `\naffection:角色名=好感度数值（仅NPC对${userName}的好感，从文本中提取已有数值）`;
                extraRules += `\n· 好感度：仅从文本中提取明确出现的好感度数值，禁止自行推断`;
            }
            if (includeScene) {
                extraFormat += `\nlocation:当前地点名（场景发生的地点，多级用·分隔如「酒馆·大厅」）\nscene_desc:位于…。该地点的固定物理特征描述（50-150字，仅首次到达或发生永久变化时写）`;
                extraRules += `\n· 场景：location行写地点名（每条消息都写），scene_desc行仅在首次到达新地点时才写，子级地点仅写相对父级的方位`;
            }
            if (includeRelationship) {
                extraFormat += `\nrel:角色A>角色B=关系类型|备注（角色间关系发生变化时输出）`;
                extraRules += `\n· 关系：仅在关系新建或变化时写，格式 rel:角色A>角色B=关系类型，备注可选`;
            }

            batchPrompt = `你是剧情分析助手。请逐条分析以下对话记录，为每条消息提取【${allowedTags}】。

核心原则：
- 只提取文本中明确出现的信息，禁止编造
- 每条消息独立分析，用 ===消息#编号=== 分隔
- 严格只输出 ${allowedTags} 标签，${forbiddenNote}

${messagesBlock}

【输出格式】每条消息按以下格式输出：

===消息#编号===
<horae>
time:日期 时间（从文本中提取，如 2026/2/4 15:00 或 霜降月第三日 黄昏）
item:emoji物品名(数量)|描述=持有者@位置（新获得的物品，普通物品可省描述）
item!:emoji物品名(数量)|描述=持有者@位置（重要物品，描述必填）
item-:物品名（消耗/丢失/用完的物品）${extraFormat}
</horae>
<horaeevent>
event:重要程度|事件简述（30-50字，重要程度：一般/重要/关键）
</horaeevent>

【规则】
· time：从文本中提取当前场景的日期时间，必填（没有明确时间则根据上下文推断）
· event：本条消息中发生的关键剧情，每条消息至少一个 event
· 物品仅在获得、消耗、状态改变时记录，无变化则不写 item 行
· item格式：emoji前缀如🔑🍞，单件不写(1)，位置需精确（❌地上 ✅酒馆大厅桌上）
· 重要程度判断：日常对话=一般，推动剧情=重要，关键转折=关键
· ${userName} 是主角名${extraRules}
· 再次强调：只允许 ${allowedTags}，${forbiddenNote}`;
        }

        try {
            const response = await Promise.race([
                context.generateRaw({ prompt: batchPrompt }),
                cancelPromise.then(() => null)
            ]);
            if (cancelled) break;
            if (response) {
                const segments = response.split(/===消息#(\d+)===/);
                for (let s = 1; s < segments.length; s += 2) {
                    const msgIndex = parseInt(segments[s]);
                    const content = segments[s + 1] || '';
                    if (isNaN(msgIndex)) continue;
                    const parsed = horaeManager.parseHoraeTag(content);
                    if (parsed) {
                        parsed.costumes = {};
                        if (!includeScene) parsed.scene = {};
                        parsed.agenda = [];
                        parsed.deletedAgenda = [];
                        parsed.deletedItems = [];
                        if (!includeNpc) parsed.npcs = {};
                        if (!includeAffection) parsed.affection = {};
                        if (!includeRelationship) parsed.relationships = [];

                        const existingMeta = horaeManager.getMessageMeta(msgIndex) || createEmptyMeta();
                        const newMeta = horaeManager.mergeParsedToMeta(existingMeta, parsed);
                        if (newMeta._tableUpdates) {
                            newMeta.tableContributions = newMeta._tableUpdates;
                            delete newMeta._tableUpdates;
                        }
                        newMeta._aiScanned = true;

                        const chatRef = horaeManager.getChat();
                        const preview = (chatRef[msgIndex]?.mes || '').substring(0, 60);
                        scanResults.push({ msgIndex, newMeta, preview, _deleted: false });
                    }
                }
            }
        } catch (err) {
            if (cancelled || err?.name === 'AbortError') break;
            console.error(`[Horae] 第 ${b + 1} 批摘要失败:`, err);
        }

        if (b < batches.length - 1 && !cancelled) {
            textEl.textContent = `第 ${b + 1} 批完成，等待中...`;
            await Promise.race([
                new Promise(r => setTimeout(r, 2000)),
                cancelPromise
            ]);
        }
    }
    // 恢复原生fetch
    window.fetch = _origFetch;
    if (!cancelled) overlay.remove();
    return cancelled ? [] : scanResults;
}

/** 从暂存结果中按分类提取审阅条目 */
function extractReviewCategories(scanResults) {
    const categories = { events: [], items: [], npcs: [], affection: [], scenes: [], relationships: [] };

    for (let ri = 0; ri < scanResults.length; ri++) {
        const r = scanResults[ri];
        if (r._deleted) continue;
        const meta = r.newMeta;

        if (meta.events?.length > 0) {
            for (let ei = 0; ei < meta.events.length; ei++) {
                categories.events.push({
                    resultIndex: ri, field: 'events', subIndex: ei,
                    msgIndex: r.msgIndex,
                    time: meta.timestamp?.story_date || '',
                    level: meta.events[ei].level || '一般',
                    text: meta.events[ei].summary || ''
                });
            }
        }

        for (const [name, info] of Object.entries(meta.items || {})) {
            const desc = info.description || '';
            const loc = [info.holder, info.location ? `@${info.location}` : ''].filter(Boolean).join('');
            categories.items.push({
                resultIndex: ri, field: 'items', key: name,
                msgIndex: r.msgIndex,
                text: `${info.icon || ''}${name}`,
                sub: loc,
                desc: desc
            });
        }

        for (const [name, info] of Object.entries(meta.npcs || {})) {
            categories.npcs.push({
                resultIndex: ri, field: 'npcs', key: name,
                msgIndex: r.msgIndex,
                text: name,
                sub: [info.appearance, info.personality, info.relationship].filter(Boolean).join(' / ')
            });
        }

        for (const [name, val] of Object.entries(meta.affection || {})) {
            categories.affection.push({
                resultIndex: ri, field: 'affection', key: name,
                msgIndex: r.msgIndex,
                text: name,
                sub: `${typeof val === 'object' ? val.value : val}`
            });
        }

        // 场景记忆
        if (meta.scene?.location && meta.scene?.scene_desc) {
            categories.scenes.push({
                resultIndex: ri, field: 'scene', key: meta.scene.location,
                msgIndex: r.msgIndex,
                text: meta.scene.location,
                sub: meta.scene.scene_desc
            });
        }

        // 关系网络
        if (meta.relationships?.length > 0) {
            for (let rri = 0; rri < meta.relationships.length; rri++) {
                const rel = meta.relationships[rri];
                categories.relationships.push({
                    resultIndex: ri, field: 'relationships', subIndex: rri,
                    msgIndex: r.msgIndex,
                    text: `${rel.from} → ${rel.to}`,
                    sub: `${rel.type}${rel.note ? ' | ' + rel.note : ''}`
                });
            }
        }
    }

    // 好感度去重：同名NPC只保留最后一次（最终值）
    const affMap = new Map();
    for (const item of categories.affection) {
        affMap.set(item.text, item);
    }
    categories.affection = [...affMap.values()];

    // 场景去重：同名地点只保留最后一次描述
    const sceneMap = new Map();
    for (const item of categories.scenes) {
        sceneMap.set(item.text, item);
    }
    categories.scenes = [...sceneMap.values()];

    categories.events.sort((a, b) => (a.time || '').localeCompare(b.time || '') || a.msgIndex - b.msgIndex);
    return categories;
}

/** 审阅条目唯一标识 */
function makeReviewKey(item) {
    if (item.field === 'events') return `${item.resultIndex}-events-${item.subIndex}`;
    if (item.field === 'relationships') return `${item.resultIndex}-relationships-${item.subIndex}`;
    return `${item.resultIndex}-${item.field}-${item.key}`;
}

/** 摘要审阅弹窗 — 按分类展示，支持逐条删除和补充摘要 */
function showScanReviewModal(scanResults, scanOptions) {
    const categories = extractReviewCategories(scanResults);
    const deletedSet = new Set();

    const tabs = [
        { id: 'events', label: '剧情轨迹', icon: 'fa-clock-rotate-left', items: categories.events },
        { id: 'items', label: '物品', icon: 'fa-box-open', items: categories.items },
        { id: 'npcs', label: '角色', icon: 'fa-user', items: categories.npcs },
        { id: 'affection', label: '好感度', icon: 'fa-heart', items: categories.affection },
        { id: 'scenes', label: '场景', icon: 'fa-map-location-dot', items: categories.scenes },
        { id: 'relationships', label: '关系', icon: 'fa-people-arrows', items: categories.relationships }
    ].filter(t => t.items.length > 0);

    if (tabs.length === 0) {
        showToast('未提取到任何摘要数据', 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'horae-modal horae-review-modal' + (settings.themeMode === 'light' ? ' horae-light' : '');

    const activeTab = tabs[0].id;
    const tabsHtml = tabs.map(t =>
        `<button class="horae-review-tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
            <i class="fa-solid ${t.icon}"></i> ${t.label} <span class="tab-count">${t.items.length}</span>
        </button>`
    ).join('');

    const panelsHtml = tabs.map(t => {
        const itemsHtml = t.items.map(item => {
            const itemKey = escapeHtml(makeReviewKey(item));
            const levelAttr = item.level ? ` data-level="${escapeHtml(item.level)}"` : '';
            const levelBadge = item.level ? `<span class="horae-level-badge ${item.level === '关键' ? 'critical' : item.level === '重要' ? 'important' : ''}" style="font-size:10px;margin-right:4px;">${escapeHtml(item.level)}</span>` : '';
            const descHtml = item.desc ? `<div class="horae-review-item-sub" style="font-style:italic;opacity:0.8;">📝 ${escapeHtml(item.desc)}</div>` : '';
            return `<div class="horae-review-item" data-key="${itemKey}"${levelAttr}>
                <div class="horae-review-item-body">
                    <div class="horae-review-item-title">${levelBadge}${escapeHtml(item.text)}</div>
                    ${item.sub ? `<div class="horae-review-item-sub">${escapeHtml(item.sub)}</div>` : ''}
                    ${descHtml}
                    ${item.time ? `<div class="horae-review-item-sub">${escapeHtml(item.time)}</div>` : ''}
                    <div class="horae-review-item-msg">#${item.msgIndex}</div>
                </div>
                <button class="horae-review-delete-btn" data-key="${itemKey}" title="删除/恢复">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>`;
        }).join('');
        return `<div class="horae-review-panel ${t.id === activeTab ? 'active' : ''}" data-panel="${t.id}">
            ${itemsHtml || '<div class="horae-review-empty">暂无数据</div>'}
        </div>`;
    }).join('');

    const totalCount = tabs.reduce((s, t) => s + t.items.length, 0);

    modal.innerHTML = `
        <div class="horae-modal-content">
            <div class="horae-modal-header">
                <span>摘要审阅</span>
                <span style="font-size:12px;color:var(--horae-text-muted);">共 ${totalCount} 条</span>
            </div>
            <div class="horae-review-tabs">${tabsHtml}</div>
            <div class="horae-review-body">${panelsHtml}</div>
            <div class="horae-modal-footer horae-review-footer">
                <div class="horae-review-stats">已删除 <strong id="horae-review-del-count">0</strong> 条</div>
                <div class="horae-review-actions">
                    <button class="horae-btn" id="horae-review-cancel"><i class="fa-solid fa-xmark"></i> 取消</button>
                    <button class="horae-btn primary" id="horae-review-rescan" disabled style="opacity:0.5;"><i class="fa-solid fa-wand-magic-sparkles"></i> 补充摘要</button>
                    <button class="horae-btn primary" id="horae-review-confirm"><i class="fa-solid fa-check"></i> 确认保存</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // tab 切换
    modal.querySelectorAll('.horae-review-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            modal.querySelectorAll('.horae-review-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.horae-review-panel').forEach(p => p.classList.remove('active'));
            tabBtn.classList.add('active');
            modal.querySelector(`.horae-review-panel[data-panel="${tabBtn.dataset.tab}"]`)?.classList.add('active');
        });
    });

    // 删除/恢复切换
    modal.querySelectorAll('.horae-review-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            const itemEl = btn.closest('.horae-review-item');
            if (deletedSet.has(key)) {
                deletedSet.delete(key);
                itemEl.classList.remove('deleted');
                btn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            } else {
                deletedSet.add(key);
                itemEl.classList.add('deleted');
                btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
            }
            updateReviewStats();
        });
    });

    function updateReviewStats() {
        const count = deletedSet.size;
        modal.querySelector('#horae-review-del-count').textContent = count;
        const rescanBtn = modal.querySelector('#horae-review-rescan');
        rescanBtn.disabled = count === 0;
        rescanBtn.style.opacity = count === 0 ? '0.5' : '1';
        for (const t of tabs) {
            const remain = t.items.filter(i => !deletedSet.has(makeReviewKey(i))).length;
            const badge = modal.querySelector(`.horae-review-tab[data-tab="${t.id}"] .tab-count`);
            if (badge) badge.textContent = remain;
        }
    }

    // 确认保存
    modal.querySelector('#horae-review-confirm').addEventListener('click', async () => {
        applyDeletedToResults(scanResults, deletedSet, categories);
        let saved = 0;
        for (const r of scanResults) {
            if (r._deleted) continue;
            const m = r.newMeta;
            const hasData = (m.events?.length > 0) || Object.keys(m.items || {}).length > 0 ||
                Object.keys(m.npcs || {}).length > 0 || Object.keys(m.affection || {}).length > 0 ||
                m.timestamp?.story_date || (m.scene?.scene_desc) || (m.relationships?.length > 0);
            if (!hasData) continue;
            m._aiScanned = true;
            // 场景记忆写入 locationMemory
            if (m.scene?.location && m.scene?.scene_desc) {
                horaeManager._updateLocationMemory(m.scene.location, m.scene.scene_desc);
            }
            // 关系网络合并
            if (m.relationships?.length > 0) {
                horaeManager._mergeRelationships(m.relationships);
            }
            horaeManager.setMessageMeta(r.msgIndex, m);
            saved++;
        }
        horaeManager.rebuildTableData();
        await getContext().saveChat();
        modal.remove();
        showToast(`已保存 ${saved} 条摘要`, 'success');
        refreshAllDisplays();
        renderCustomTablesList();
    });

    // 取消
    const closeModal = () => { if (confirm('取消将丢弃所有摘要结果，是否继续？')) modal.remove(); };
    modal.querySelector('#horae-review-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    // 补充摘要 — 对已删除条目所在楼层重跑
    modal.querySelector('#horae-review-rescan').addEventListener('click', async () => {
        const deletedMsgIndices = new Set();
        for (const key of deletedSet) {
            const ri = parseInt(key.split('-')[0]);
            if (!isNaN(ri) && scanResults[ri]) deletedMsgIndices.add(scanResults[ri].msgIndex);
        }
        if (deletedMsgIndices.size === 0) return;
        if (!confirm(`将对 ${deletedMsgIndices.size} 条消息重新生成摘要，消耗至少 1 次生成。\n\n是否继续？`)) return;

        applyDeletedToResults(scanResults, deletedSet, categories);

        const chat = horaeManager.getChat();
        const rescanTargets = [];
        for (const idx of deletedMsgIndices) {
            if (chat[idx]?.mes) rescanTargets.push({ index: idx, text: chat[idx].mes });
        }
        if (rescanTargets.length === 0) return;

        modal.remove();

        const tokenLimit = 80000;
        const rescanBatches = [];
        let cb = [], ct = 0;
        for (const t of rescanTargets) {
            const tk = estimateTokens(t.text);
            if (cb.length > 0 && ct + tk > tokenLimit) { rescanBatches.push(cb); cb = []; ct = 0; }
            cb.push(t); ct += tk;
        }
        if (cb.length > 0) rescanBatches.push(cb);

        const newResults = await executeBatchScan(rescanBatches, scanOptions);
        const merged = scanResults.filter(r => !r._deleted).concat(newResults);
        showScanReviewModal(merged, scanOptions);
    });
}

/** 将删除标记应用到 scanResults 的实际数据 */
function applyDeletedToResults(scanResults, deletedSet, categories) {
    const deleteMap = new Map();
    const allItems = [...categories.events, ...categories.items, ...categories.npcs, ...categories.affection, ...categories.scenes, ...categories.relationships];
    for (const key of deletedSet) {
        const item = allItems.find(i => makeReviewKey(i) === key);
        if (!item) continue;
        if (!deleteMap.has(item.resultIndex)) {
            deleteMap.set(item.resultIndex, { events: new Set(), items: new Set(), npcs: new Set(), affection: new Set(), scene: new Set(), relationships: new Set() });
        }
        const dm = deleteMap.get(item.resultIndex);
        if (item.field === 'events') dm.events.add(item.subIndex);
        else if (item.field === 'relationships') dm.relationships.add(item.subIndex);
        else if (item.field === 'scene') dm.scene.add(item.key);
        else dm[item.field]?.add(item.key);
    }

    for (const [ri, dm] of deleteMap) {
        const meta = scanResults[ri]?.newMeta;
        if (!meta) continue;
        if (dm.events.size > 0 && meta.events) {
            const indices = [...dm.events].sort((a, b) => b - a);
            for (const idx of indices) meta.events.splice(idx, 1);
        }
        if (dm.relationships.size > 0 && meta.relationships) {
            const indices = [...dm.relationships].sort((a, b) => b - a);
            for (const idx of indices) meta.relationships.splice(idx, 1);
        }
        if (dm.scene.size > 0 && meta.scene) {
            meta.scene = {};
        }
        for (const name of dm.items) delete meta.items?.[name];
        for (const name of dm.npcs) delete meta.npcs?.[name];
        for (const name of dm.affection) delete meta.affection?.[name];

        const hasData = (meta.events?.length > 0) || Object.keys(meta.items || {}).length > 0 ||
            Object.keys(meta.npcs || {}).length > 0 || Object.keys(meta.affection || {}).length > 0 ||
            (meta.scene?.scene_desc) || (meta.relationships?.length > 0);
        if (!hasData) scanResults[ri]._deleted = true;
    }
}

/** AI摘要配置弹窗 */
function showAIScanConfigDialog(targetCount) {
    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'horae-modal' + (settings.themeMode === 'light' ? ' horae-light' : '');
        modal.innerHTML = `
            <div class="horae-modal-content" style="max-width: 420px;">
                <div class="horae-modal-header">
                    <span>AI 智能摘要</span>
                </div>
                <div class="horae-modal-body" style="padding: 16px;">
                    <p style="margin: 0 0 12px; color: var(--horae-text-muted); font-size: 13px;">
                        检测到 <strong style="color: var(--horae-primary-light);">${targetCount}</strong> 条待分析消息
                    </p>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--horae-text);">
                        每批 Token 上限
                        <input type="number" id="horae-ai-scan-token-limit" value="80000" min="10000" max="1000000" step="10000"
                            style="flex:1; padding: 6px 10px; background: var(--horae-bg); border: 1px solid var(--horae-border); border-radius: 4px; color: var(--horae-text); font-size: 13px;">
                    </label>
                    <p style="margin: 8px 0 12px; color: var(--horae-text-muted); font-size: 11px;">
                        值越大每批消息越多、生成次数越少，但可能超出模型限制。<br>
                        Claude ≈ 80K~200K · Gemini ≈ 100K~1000K · GPT-4o ≈ 80K~128K
                    </p>
                    <div style="border-top: 1px solid var(--horae-border); padding-top: 12px;">
                        <p style="margin: 0 0 8px; font-size: 12px; color: var(--horae-text);">额外提取项（可选）</p>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--horae-text); margin-bottom: 6px; cursor: pointer;">
                            <input type="checkbox" id="horae-scan-include-npc" ${settings.aiScanIncludeNpc ? 'checked' : ''}>
                            NPC 角色信息
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--horae-text); cursor: pointer;">
                            <input type="checkbox" id="horae-scan-include-affection" ${settings.aiScanIncludeAffection ? 'checked' : ''}>
                            好感度
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--horae-text); margin-top: 6px; cursor: pointer;">
                            <input type="checkbox" id="horae-scan-include-scene" ${settings.aiScanIncludeScene ? 'checked' : ''}>
                            场景记忆（地点物理特征描述）
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--horae-text); margin-top: 6px; cursor: pointer;">
                            <input type="checkbox" id="horae-scan-include-relationship" ${settings.aiScanIncludeRelationship ? 'checked' : ''}>
                            关系网络
                        </label>
                        <p style="margin: 6px 0 0; color: var(--horae-text-muted); font-size: 10px;">
                            从历史文本中提取信息，提取后可在审阅弹窗中逐条调整。
                        </p>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button class="horae-btn" id="horae-ai-scan-cancel">取消</button>
                    <button class="horae-btn primary" id="horae-ai-scan-confirm">继续</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#horae-ai-scan-confirm').addEventListener('click', () => {
            const val = parseInt(modal.querySelector('#horae-ai-scan-token-limit').value) || 80000;
            const includeNpc = modal.querySelector('#horae-scan-include-npc').checked;
            const includeAffection = modal.querySelector('#horae-scan-include-affection').checked;
            const includeScene = modal.querySelector('#horae-scan-include-scene').checked;
            const includeRelationship = modal.querySelector('#horae-scan-include-relationship').checked;
            settings.aiScanIncludeNpc = includeNpc;
            settings.aiScanIncludeAffection = includeAffection;
            settings.aiScanIncludeScene = includeScene;
            settings.aiScanIncludeRelationship = includeRelationship;
            saveSettings();
            modal.remove();
            resolve({ tokenLimit: Math.max(10000, val), includeNpc, includeAffection, includeScene, includeRelationship });
        });
        modal.querySelector('#horae-ai-scan-cancel').addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });
        modal.addEventListener('click', e => {
            if (e.target === modal) { modal.remove(); resolve(null); }
        });
    });
}

/** 撤销AI摘要 — 清除所有 _aiScanned 标记的数据 */
async function undoAIScan() {
    const chat = horaeManager.getChat();
    if (!chat || chat.length === 0) return;

    let count = 0;
    for (let i = 0; i < chat.length; i++) {
        if (chat[i].horae_meta?._aiScanned) count++;
    }

    if (count === 0) {
        showToast('没有找到AI摘要数据', 'info');
        return;
    }

    if (!confirm(`将清除 ${count} 条消息的AI摘要数据（事件和物品）。\n手动编辑的数据不受影响。\n\n是否继续？`)) return;

    for (let i = 0; i < chat.length; i++) {
        const meta = chat[i].horae_meta;
        if (!meta?._aiScanned) continue;
        meta.events = [];
        meta.items = {};
        delete meta._aiScanned;
        horaeManager.setMessageMeta(i, meta);
    }

    horaeManager.rebuildTableData();
    await getContext().saveChat();
    showToast(`已撤销 ${count} 条消息的AI摘要数据`, 'success');
    refreshAllDisplays();
    renderCustomTablesList();
}

/**
 * 导出数据
 */
function exportData() {
    const chat = horaeManager.getChat();
    const exportObj = {
        version: VERSION,
        exportTime: new Date().toISOString(),
        data: chat.map((msg, index) => ({
            index,
            horae_meta: msg.horae_meta || null
        })).filter(item => item.horae_meta)
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horae_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('数据已导出', 'success');
}

/**
 * 导入数据
 */
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const importObj = JSON.parse(text);
            
            if (!importObj.data || !Array.isArray(importObj.data)) {
                throw new Error('无效的数据格式');
            }
            
            const chat = horaeManager.getChat();
            let imported = 0;
            
            for (const item of importObj.data) {
                if (item.index >= 0 && item.index < chat.length && item.horae_meta) {
                    chat[item.index].horae_meta = item.horae_meta;
                    imported++;
                }
            }
            
            await getContext().saveChat();
            showToast(`成功导入 ${imported} 条记录`, 'success');
            refreshAllDisplays();
        } catch (error) {
            console.error('[Horae] 导入失败:', error);
            showToast('导入失败: ' + error.message, 'error');
        }
    };
    input.click();
}

/**
 * 清除所有数据
 */
async function clearAllData() {
    if (!confirm('确定要清除所有 Horae 元数据吗？此操作不可恢复！')) {
        return;
    }
    
    const chat = horaeManager.getChat();
    for (const msg of chat) {
        delete msg.horae_meta;
    }
    
    await getContext().saveChat();
    showToast('所有数据已清除', 'warning');
    refreshAllDisplays();
}

/** 使用AI分析消息内容 */
async function analyzeMessageWithAI(messageContent) {
    const context = getContext();
    const userName = context?.name1 || '主角';

    let analysisPrompt;
    if (settings.customAnalysisPrompt) {
        analysisPrompt = settings.customAnalysisPrompt
            .replace(/\{\{user\}\}/gi, userName)
            .replace(/\{\{content\}\}/gi, messageContent);
    } else {
        analysisPrompt = getDefaultAnalysisPrompt()
            .replace(/\{\{user\}\}/gi, userName)
            .replace(/\{\{content\}\}/gi, messageContent);
    }

    try {
        const response = await context.generateRaw({ prompt: analysisPrompt });
        
        if (response) {
            const parsed = horaeManager.parseHoraeTag(response);
            return parsed;
        }
    } catch (error) {
        console.error('[Horae] AI分析调用失败:', error);
        throw error;
    }
    
    return null;
}

// ============================================
// 事件监听
// ============================================

/**
 * AI回复接收时触发
 */
async function onMessageReceived(messageId) {
    if (!settings.enabled || !settings.autoParse) return;
    _autoSummaryRanThisTurn = false;

    const chat = horaeManager.getChat();
    const message = chat[messageId];
    
    if (!message || message.is_user) return;
    
    // regenerate/swipe 检测：若已有 meta 则为重新生成，清空旧数据再解析
    const isRegenerate = !!(message.horae_meta?.timestamp?.absolute);
    if (isRegenerate) {
        message.horae_meta = createEmptyMeta();
    }
    
    const hasTag = horaeManager.processAIResponse(messageId, message.mes);
    
    if (isRegenerate) {
        horaeManager.rebuildTableData();
        horaeManager.rebuildRelationships();
        horaeManager.rebuildLocationMemory();
    }
    
    getContext().saveChat();
    refreshAllDisplays();
    renderCustomTablesList();
    
    setTimeout(() => {
        const messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
        if (messageEl) {
            addMessagePanel(messageEl, messageId);
        }
    }, 100);

    // AI回复后顺序触发自动摘要（并行路径若已执行则跳过）
    if (!isRegenerate && settings.autoSummaryEnabled && settings.sendTimeline) {
        setTimeout(() => {
            if (!_autoSummaryRanThisTurn) {
                checkAutoSummary();
            }
        }, 1500);
    }
}

/**
 * 消息删除时触发 — 重建表格数据
 */
function onMessageDeleted() {
    if (!settings.enabled) return;
    
    horaeManager.rebuildTableData();
    horaeManager.rebuildRelationships();
    horaeManager.rebuildLocationMemory();
    getContext().saveChat();
    
    refreshAllDisplays();
    renderCustomTablesList();
}

/**
 * 消息编辑时触发 — 重新解析该消息并重建表格
 */
function onMessageEdited(messageId) {
    if (!settings.enabled) return;
    
    const chat = horaeManager.getChat();
    const message = chat[messageId];
    if (!message || message.is_user) return;
    
    // 完全重置该消息的 meta，从新正文重新解析
    message.horae_meta = createEmptyMeta();
    
    horaeManager.processAIResponse(messageId, message.mes);
    
    horaeManager.rebuildTableData();
    horaeManager.rebuildRelationships();
    horaeManager.rebuildLocationMemory();
    getContext().saveChat();
    
    refreshAllDisplays();
    renderCustomTablesList();
    refreshVisiblePanels();
}

/** 注入上下文（数据+规则合并注入） */
async function onPromptReady(eventData) {
    if (_isSummaryGeneration) return;
    if (!settings.enabled || !settings.injectContext) return;
    if (eventData.dryRun) return;
    
    try {
        // swipe/regenerate检测
        let skipLast = 0;
        const chat = horaeManager.getChat();
        if (chat && chat.length > 0) {
            const lastMsg = chat[chat.length - 1];
            if (lastMsg && !lastMsg.is_user && lastMsg.horae_meta && (
                lastMsg.horae_meta.timestamp?.story_date ||
                lastMsg.horae_meta.scene?.location ||
                Object.keys(lastMsg.horae_meta.items || {}).length > 0 ||
                Object.keys(lastMsg.horae_meta.costumes || {}).length > 0 ||
                Object.keys(lastMsg.horae_meta.affection || {}).length > 0 ||
                Object.keys(lastMsg.horae_meta.npcs || {}).length > 0 ||
                (lastMsg.horae_meta.events || []).length > 0
            )) {
                skipLast = 1;
                console.log('[Horae] 检测到swipe/regenerate，跳过末尾消息的旧记忆');
            }
        }

        const dataPrompt = horaeManager.generateCompactPrompt(skipLast);
        const rulesPrompt = horaeManager.generateSystemPromptAddition();
        const combinedPrompt = `${dataPrompt}\n${rulesPrompt}`;

        const position = settings.injectionPosition;
        if (position === 0) {
            eventData.chat.push({ role: 'system', content: combinedPrompt });
        } else {
            eventData.chat.splice(-position, 0, { role: 'system', content: combinedPrompt });
        }
        
        console.log(`[Horae] 已注入上下文，位置: -${position}${skipLast ? '（已跳过末尾消息）' : ''}`);
    } catch (error) {
        console.error('[Horae] 注入上下文失败:', error);
    }
}

/**
 * 聊天切换时触发
 */
async function onChatChanged() {
    if (!settings.enabled) return;
    
    horaeManager.init(getContext(), settings);
    
    refreshAllDisplays();
    renderCustomTablesList();
    
    setTimeout(() => {
        document.querySelectorAll('.mes:not(.horae-processed)').forEach(messageEl => {
            const messageId = parseInt(messageEl.getAttribute('mesid'));
            if (!isNaN(messageId)) {
                const msg = horaeManager.getChat()[messageId];
                if (msg && !msg.is_user && msg.horae_meta) {
                    addMessagePanel(messageEl, messageId);
                }
                messageEl.classList.add('horae-processed');
            }
        });
    }, 500);
}

/** 消息渲染时触发 */
function onMessageRendered(messageId) {
    if (!settings.enabled || !settings.showMessagePanel) return;
    
    setTimeout(() => {
        const messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
        if (messageEl) {
            const msg = horaeManager.getChat()[messageId];
            if (msg && !msg.is_user) {
                addMessagePanel(messageEl, messageId);
                messageEl.classList.add('horae-processed');
            }
        }
    }, 100);
}

/** swipe切换分页时触发 — 从当前mes重新解析并刷新底部栏 */
function onSwipePanel(messageId) {
    if (!settings.enabled || !settings.showMessagePanel) return;
    
    setTimeout(() => {
        const messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
        if (!messageEl) return;
        
        const msg = horaeManager.getChat()[messageId];
        if (!msg || msg.is_user) return;
        
        const parsed = horaeManager.parseHoraeTag(msg.mes || '');
        if (parsed) {
            const newMeta = createEmptyMeta();
            newMeta.timestamp = parsed.timestamp || {};
            newMeta.scene = parsed.scene || {};
            newMeta.costumes = parsed.costumes || {};
            newMeta.items = parsed.items || {};
            newMeta.deletedItems = parsed.deletedItems || [];
            newMeta.events = parsed.events || (parsed.event ? [parsed.event] : []);
            newMeta.affection = parsed.affection || {};
            newMeta.npcs = parsed.npcs || {};
            newMeta.agenda = parsed.agenda || [];
            horaeManager.setMessageMeta(messageId, newMeta);
        }
        
        // swipe 可能改变表格贡献，重建表格数据
        horaeManager.rebuildTableData();
        
        // 移除旧面板并重建
        const oldPanel = messageEl.querySelector('.horae-message-panel');
        if (oldPanel) oldPanel.remove();
        addMessagePanel(messageEl, messageId);
    }, 150);
}

// ============================================
// 初始化
// ============================================

jQuery(async () => {
    console.log(`[Horae] 开始加载 v${VERSION}...`);

    await initNavbarFunction();
    loadSettings();
    ensureRegexRules();

    $('#extensions-settings-button').after(await getTemplate('drawer'));

    // 在扩展面板中注入顶部图标开关
    const extToggleHtml = `
        <div id="horae-ext-settings" class="inline-drawer" style="margin-top:4px;">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Horae 时光记忆</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label" style="margin:6px 0;">
                    <input type="checkbox" id="horae-ext-show-top-icon" checked>
                    <span>显示顶部导航栏图标</span>
                </label>
            </div>
        </div>
    `;
    $('#extensions_settings2').append(extToggleHtml);
    
    // 绑定扩展面板内的图标开关（折叠切换由 SillyTavern 全局处理器自动管理）
    $('#horae-ext-show-top-icon').on('change', function() {
        settings.showTopIcon = this.checked;
        saveSettings();
        applyTopIconVisibility();
    });

    await initDrawer();
    initTabs();
    initSettingsEvents();
    syncSettingsToUI();
    
    horaeManager.init(getContext(), settings);
    
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, onMessageReceived);
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
    eventSource.on(event_types.MESSAGE_RENDERED, onMessageRendered);
    eventSource.on(event_types.MESSAGE_SWIPED, onSwipePanel);
    eventSource.on(event_types.MESSAGE_DELETED, onMessageDeleted);
    eventSource.on(event_types.MESSAGE_EDITED, onMessageEdited);
    
    // 并行自动摘要：用户发消息时并行触发（独立API走直接HTTP，不影响主连接）
    if (event_types.USER_MESSAGE_RENDERED) {
        eventSource.on(event_types.USER_MESSAGE_RENDERED, () => {
            if (!settings.autoSummaryEnabled || !settings.sendTimeline) return;
            _autoSummaryRanThisTurn = true;
            checkAutoSummary().catch((e) => {
                console.warn('[Horae] 并行自动摘要失败，将在AI回复后重试:', e);
                _autoSummaryRanThisTurn = false;
            });
        });
    }
    
    refreshAllDisplays();
    
    isInitialized = true;
    console.log(`[Horae] v${VERSION} 加载完成！作者: SenriYuki`);
});