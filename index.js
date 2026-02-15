/**
 * Horae - 时光记忆插件 
 * 基于时间锚点的AI记忆增强系统
 * 
 * 作者: SenriYuki
 * 版本: 1.0.0
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
const VERSION = '1.0.0';

// 配套正则规则（自动注入ST原生正则系统）
const HORAE_REGEX_RULES = [
    {
        id: 'horae_hide',
        scriptName: 'Horae - 隐藏状态标签',
        description: '隐藏<horae>状态标签，不显示在正文，不发送给AI',
        findRegex: '/(?:<horae>[\\s\\S]*?<\\/horae>|<!--horae[\\s\\S]*?-->|(?:^|\\n)(?:time|location|atmosphere|characters|costume|item-?!{0,2}|affection|npc|agenda-?):[^\\n]+(?:\\n(?:time|location|atmosphere|characters|costume|item-?!{0,2}|affection|npc|agenda-?):[^\\n]+)*)/gim',
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
        description: '隐藏<horaeevent>事件标签的显示，但仍发送给AI用于追溯剧情',
        findRegex: '/<horaeevent>[\\s\\S]*?<\\/horaeevent>/gim',
        replaceString: '',
        trimStrings: [],
        placement: [2],
        disabled: false,
        markdownOnly: true,
        promptOnly: false,
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
    customTables: []       // 自定义表格 [{id, name, rows, cols, data, prompt}]
};

// ============================================
// 全局变量
// ============================================
let settings = { ...DEFAULT_SETTINGS };
let doNavbarIconClick = null;
let isInitialized = false;
let itemsMultiSelectMode = false;  // 物品多选模式
let selectedItems = new Set();     // 选中的物品名称
let longPressTimer = null;         // 长按计时器
let agendaMultiSelectMode = false; // 待办多选模式
let selectedAgendaIndices = new Set(); // 选中的待办索引
let agendaLongPressTimer = null;   // 待办长按计时器

// ============================================
// 工具函数
// ============================================

/** 自动注入配套正则到ST原生正则系统（首次安装时自动执行，用户可在正则面板管理） */
function ensureRegexRules() {
    if (!extension_settings.regex) extension_settings.regex = [];

    let injected = 0;
    for (const rule of HORAE_REGEX_RULES) {
        const idx = extension_settings.regex.findIndex(r => r.id === rule.id);
        if (idx === -1) {
            extension_settings.regex.push({ ...rule });
            injected++;
        } else {
            // 已存在则同步更新正则内容（版本升级时自动修复），保留用户的 disabled 状态
            const userDisabled = extension_settings.regex[idx].disabled;
            extension_settings.regex[idx] = { ...rule, disabled: userDisabled };
        }
    }

    if (injected > 0) {
        saveSettingsDebounced();
        console.log(`[Horae] 已自动注入 ${injected} 条配套正则规则`);
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
function exportTable(tableIndex) {
    const tables = getChatTables();
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
            
            // 确保有必要的字段
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
    let events = horaeManager.getEvents(50, filterLevel);
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
    
    listEl.innerHTML = events.reverse().map(e => {
            const result = calculateDetailedRelativeTime(
            e.timestamp?.story_date || '',
            currentDate
        );
        const relTime = result.relative;
        const levelClass = e.event?.level === '关键' ? 'critical' : 
                          e.event?.level === '重要' ? 'important' : '';
        const levelBadge = e.event?.level ? `<span class="horae-level-badge ${levelClass}">${e.event.level}</span>` : '';
        
        // 标准日历显示周几
        const dateStr = e.timestamp?.story_date || '?';
        const parsed = parseStoryDate(dateStr);
        const displayDate = (parsed && parsed.type === 'standard') ? formatStoryDate(parsed, true) : dateStr;
        
        return `
            <div class="horae-timeline-item horae-editable-item ${levelClass}" data-message-id="${e.messageIndex}">
                <div class="horae-timeline-time">
                    <div class="date">${displayDate}</div>
                    <div>${e.timestamp?.story_time || ''}</div>
                </div>
                <div class="horae-timeline-content">
                    <div class="horae-timeline-summary">${levelBadge}${e.event?.summary || '未记录'}</div>
                    <div class="horae-timeline-meta">${relTime} · 消息 #${e.messageIndex}</div>
                </div>
                <button class="horae-item-edit-btn" data-edit-type="event" data-message-id="${e.messageIndex}" data-event-index="${e.eventIndex || 0}" title="编辑">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
        `;
    }).join('');
    
    listEl.querySelectorAll('.horae-timeline-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.horae-item-edit-btn')) return;
            const messageId = item.dataset.messageId;
            scrollToMessage(messageId);
        });
    });
    
    bindEditButtons();
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
                    <button id="agenda-modal-delete" class="menu_button danger">
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
                    <button id="agenda-modal-save" class="menu_button primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="agenda-modal-cancel" class="menu_button">
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
                const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
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
            // 判断是否为重要角色（角色卡主角 或 用户手动标记）
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
                
                // 扩展信息行（年龄/种族/职业，紧凑显示）
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
                    <button id="edit-modal-save" class="menu_button primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="edit-modal-cancel" class="menu_button">
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
    const numValue = typeof currentValue === 'number' ? currentValue : parseInt(currentValue) || 0;
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
                        <input type="number" id="edit-affection-value" value="${numValue}" placeholder="0-100">
                    </div>
                    <div class="horae-edit-field">
                        <label>好感等级</label>
                        <span class="horae-affection-level-preview">${level}</span>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="menu_button primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="edit-modal-cancel" class="menu_button">
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
        const val = parseInt(e.target.value) || 0;
        const newLevel = horaeManager.getAffectionLevel(val);
        document.querySelector('.horae-affection-level-preview').textContent = newLevel;
    });
    
    document.getElementById('edit-modal-save').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const newValue = parseInt(document.getElementById('edit-affection-value').value) || 0;
        
        // 更新所有消息中的好感度（设为绝对值）
        const chat = horaeManager.getChat();
        let lastMessageWithAffection = -1;
        
        // 找到最后一条有该角色好感度的消息
        for (let i = chat.length - 1; i >= 0; i--) {
            const meta = chat[i].horae_meta;
            if (meta?.affection?.[charName] !== undefined) {
                lastMessageWithAffection = i;
                break;
            }
        }
        
        if (lastMessageWithAffection >= 0) {
            // 更新最后一条消息的好感度为绝对值
            chat[lastMessageWithAffection].horae_meta.affection[charName] = { 
                type: 'absolute', 
                value: newValue 
            };
        } else {
            // 如果没有找到，在最后一条消息添加
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
                    <button id="edit-modal-delete" class="menu_button danger" style="background:#c62828;color:#fff;margin-right:auto;">
                        <i class="fa-solid fa-trash"></i> 删除角色
                    </button>
                    <button id="edit-modal-save" class="menu_button primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="edit-modal-cancel" class="menu_button">
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
        
        // 如果用户手动修改了年龄，更新参考日期
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
                        </select>
                    </div>
                    <div class="horae-edit-field">
                        <label>事件摘要</label>
                        <textarea id="edit-event-summary" placeholder="描述这个事件...">${event.summary || ''}</textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-delete" class="menu_button danger">
                        <i class="fa-solid fa-trash"></i> 删除
                    </button>
                    <button id="edit-modal-save" class="menu_button primary">
                        <i class="fa-solid fa-check"></i> 保存
                    </button>
                    <button id="edit-modal-cancel" class="menu_button">
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
            if (chatMeta.events[eventIndex]) {
                chatMeta.events[eventIndex] = {
                    is_important: newLevel === '重要' || newLevel === '关键',
                    level: newLevel,
                    summary: newSummary
                };
            } else {
                chatMeta.events.push({
                    is_important: newLevel === '重要' || newLevel === '关键',
                    level: newLevel,
                    summary: newSummary
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
    // 阻止事件冒泡
    const targets = [
        document.getElementById('horae-edit-modal'),
        ...document.querySelectorAll('.horae-edit-modal-backdrop')
    ].filter(Boolean);
    
    targets.forEach(modal => {
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
    
    const tables = getChatTables();
    
    if (tables.length === 0) {
        listEl.innerHTML = `
            <div class="horae-custom-tables-empty">
                <i class="fa-solid fa-table-cells"></i>
                <div>暂无自定义表格</div>
                <div style="font-size:11px;opacity:0.7;margin-top:4px;">点击下方按钮添加（表格跟随当前对话保存）</div>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = tables.map((table, tableIndex) => {
        const rows = table.rows || 2;
        const cols = table.cols || 2;
        const data = table.data || {};
        
        // 生成表格HTML
        let tableHtml = '<table class="horae-excel-table">';
        for (let r = 0; r < rows; r++) {
            tableHtml += '<tr>';
            for (let c = 0; c < cols; c++) {
                const cellKey = `${r}-${c}`;
                const cellValue = data[cellKey] || '';
                const isHeader = r === 0 || c === 0;
                const tag = isHeader ? 'th' : 'td';
                // 动态计算输入框宽度
                const charLen = [...cellValue].reduce((sum, ch) => sum + (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
                const inputSize = Math.max(4, Math.min(charLen + 2, 40));
                tableHtml += `<${tag} data-row="${r}" data-col="${c}">`;
                tableHtml += `<input type="text" value="${escapeHtml(cellValue)}" size="${inputSize}" data-table="${tableIndex}" data-row="${r}" data-col="${c}" placeholder="${isHeader ? '表头' : ''}">`;
                tableHtml += `</${tag}>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</table>';
        
        return `
            <div class="horae-excel-table-container" data-table-index="${tableIndex}">
                <div class="horae-excel-table-header">
                    <div class="horae-excel-table-title">
                        <i class="fa-solid fa-table"></i>
                        <input type="text" value="${escapeHtml(table.name || '')}" placeholder="表格名称" data-table-name="${tableIndex}">
                    </div>
                    <div class="horae-excel-table-actions">
                        <button class="export-table-btn" title="导出表格" data-table-index="${tableIndex}">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <button class="delete-table-btn danger" title="删除表格">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                <div class="horae-excel-table-wrapper">
                    ${tableHtml}
                </div>
                <div class="horae-table-prompt-row">
                    <input type="text" value="${escapeHtml(table.prompt || '')}" placeholder="提示词：告诉AI如何填写此表格..." data-table-prompt="${tableIndex}">
                </div>
            </div>
        `;
    }).join('');
    
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
    // 单元格输入事件 - 自动保存 + 动态调整宽度
    document.querySelectorAll('.horae-excel-table input').forEach(input => {
        input.addEventListener('change', (e) => {
            const tableIndex = parseInt(e.target.dataset.table);
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            const value = e.target.value;
            
            const tables = getChatTables();
            if (!tables[tableIndex].data) {
                tables[tableIndex].data = {};
            }
            tables[tableIndex].data[`${row}-${col}`] = value;
            setChatTables(tables);
        });
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            const charLen = [...val].reduce((sum, ch) => sum + (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
            e.target.size = Math.max(4, Math.min(charLen + 2, 40));
        });
    });
    
    // 表格名称输入事件
    document.querySelectorAll('[data-table-name]').forEach(input => {
        input.addEventListener('change', (e) => {
            const tableIndex = parseInt(e.target.dataset.tableName);
            const tables = getChatTables();
            tables[tableIndex].name = e.target.value;
            setChatTables(tables);
        });
    });
    
    // 表格提示词输入事件
    document.querySelectorAll('[data-table-prompt]').forEach(input => {
        input.addEventListener('change', (e) => {
            const tableIndex = parseInt(e.target.dataset.tablePrompt);
            const tables = getChatTables();
            tables[tableIndex].prompt = e.target.value;
            setChatTables(tables);
        });
    });
    
    // 导出表格按钮
    document.querySelectorAll('.export-table-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tableIndex = parseInt(btn.dataset.tableIndex);
            exportTable(tableIndex);
        });
    });
    
    // 删除表格按钮
    document.querySelectorAll('.delete-table-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const container = btn.closest('.horae-excel-table-container');
            const tableIndex = parseInt(container.dataset.tableIndex);
            deleteCustomTable(tableIndex);
        });
    });
    
    // 表头长按显示右键菜单
    document.querySelectorAll('.horae-excel-table th').forEach(th => {
        let pressTimer = null;
        
        const startPress = (e) => {
            pressTimer = setTimeout(() => {
                const tableContainer = th.closest('.horae-excel-table-container');
                const tableIndex = parseInt(tableContainer.dataset.tableIndex);
                const row = parseInt(th.dataset.row);
                const col = parseInt(th.dataset.col);
                showTableContextMenu(e, tableIndex, row, col);
            }, 500);
        };
        
        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };
        
        th.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startPress(e);
        });
        th.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            startPress(e);
        }, { passive: false });
        th.addEventListener('mouseup', (e) => {
            e.stopPropagation();
            cancelPress();
        });
        th.addEventListener('mouseleave', cancelPress);
        th.addEventListener('touchend', (e) => {
            e.stopPropagation();
            cancelPress();
        });
        th.addEventListener('touchcancel', cancelPress);
        
        // 右键菜单
        th.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const tableContainer = th.closest('.horae-excel-table-container');
            const tableIndex = parseInt(tableContainer.dataset.tableIndex);
            const row = parseInt(th.dataset.row);
            const col = parseInt(th.dataset.col);
            showTableContextMenu(e, tableIndex, row, col);
        });
    });
    
}

/** 显示表格右键菜单 */
let contextMenuCloseHandler = null;

function showTableContextMenu(e, tableIndex, row, col) {
    hideContextMenu();
    
    const isRowHeader = col === 0 && row > 0;  // 第一列（非第一行）= 行操作
    const isColHeader = row === 0 && col > 0;  // 第一行（非第一列）= 列操作
    const isCorner = row === 0 && col === 0;   // 左上角
    
    let menuItems = '';
    
    if (isCorner) {
        menuItems = `
            <div class="horae-context-menu-item" data-action="add-row-below"><i class="fa-solid fa-plus"></i> 添加行</div>
            <div class="horae-context-menu-item" data-action="add-col-right"><i class="fa-solid fa-plus"></i> 添加列</div>
        `;
    } else if (isColHeader) {
        menuItems = `
            <div class="horae-context-menu-item" data-action="add-col-left"><i class="fa-solid fa-arrow-left"></i> 左侧添加列</div>
            <div class="horae-context-menu-item" data-action="add-col-right"><i class="fa-solid fa-arrow-right"></i> 右侧添加列</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item danger" data-action="delete-col"><i class="fa-solid fa-trash-can"></i> 删除此列</div>
        `;
    } else if (isRowHeader) {
        menuItems = `
            <div class="horae-context-menu-item" data-action="add-row-above"><i class="fa-solid fa-arrow-up"></i> 上方添加行</div>
            <div class="horae-context-menu-item" data-action="add-row-below"><i class="fa-solid fa-arrow-down"></i> 下方添加行</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item danger" data-action="delete-row"><i class="fa-solid fa-trash-can"></i> 删除此行</div>
        `;
    } else {
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'horae-context-menu';
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
                executeTableAction(tableIndex, row, col, action);
            }, 10);
        });
        
        item.addEventListener('touchend', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            const action = item.dataset.action;
            hideContextMenu();
            setTimeout(() => {
                executeTableAction(tableIndex, row, col, action);
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
function executeTableAction(tableIndex, row, col, action) {
    const tables = getChatTables();
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
                const newRow = r >= row ? r + 1 : r;
                newData[`${newRow}-${c}`] = val;
            }
            table.data = newData;
            break;
            
        case 'add-row-below':
            table.rows = oldRows + 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                const newRow = r > row ? r + 1 : r;
                newData[`${newRow}-${c}`] = val;
            }
            table.data = newData;
            break;
            
        case 'add-col-left':
            table.cols = oldCols + 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                const newCol = c >= col ? c + 1 : c;
                newData[`${r}-${newCol}`] = val;
            }
            table.data = newData;
            break;
            
        case 'add-col-right':
            table.cols = oldCols + 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                const newCol = c > col ? c + 1 : c;
                newData[`${r}-${newCol}`] = val;
            }
            table.data = newData;
            break;
            
        case 'delete-row':
            if (oldRows <= 2) {
                showToast('表格至少需要2行', 'warning');
                return;
            }
            table.rows = oldRows - 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                if (r === row) continue;
                const newRow = r > row ? r - 1 : r;
                newData[`${newRow}-${c}`] = val;
            }
            table.data = newData;
            break;
            
        case 'delete-col':
            if (oldCols <= 2) {
                showToast('表格至少需要2列', 'warning');
                return;
            }
            table.cols = oldCols - 1;
            for (const [key, val] of Object.entries(oldData)) {
                const [r, c] = key.split('-').map(Number);
                if (c === col) continue;
                const newCol = c > col ? c - 1 : c;
                newData[`${r}-${newCol}`] = val;
            }
            table.data = newData;
            break;
    }
    
    setChatTables(tables);
    renderCustomTablesList();
}

/**
 * 添加新的2x2表格
 */
function addNewExcelTable() {
    const tables = getChatTables();
    
    tables.push({
        id: Date.now().toString(),
        name: '',
        rows: 2,
        cols: 2,
        data: {},
        baseData: {},
        baseRows: 2,
        baseCols: 2,
        prompt: ''
    });
    
    setChatTables(tables);
    renderCustomTablesList();
    showToast('已添加新表格', 'success');
}

/**
 * 删除表格
 */
function deleteCustomTable(index) {
    if (!confirm('确定要删除此表格吗？')) return;
    
    const tables = getChatTables();
    tables.splice(index, 1);
    setChatTables(tables);
    renderCustomTablesList();
    showToast('表格已删除', 'info');
}

/**
 * 绑定物品列表事件（长按、点击）
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
    }
}

/**
 * 构建已删除物品显示
 */
function buildDeletedItemsDisplay(deletedItems) {
    if (!deletedItems || deletedItems.length === 0) {
        return '<div class="horae-empty-hint">无物品消耗</div>';
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
        return '<div class="horae-empty-hint">无待办事项</div>';
    }
    return agenda.map(item => `
        <div class="horae-editor-row horae-agenda-edit-row">
            <input type="text" class="agenda-date" style="flex:0 0 90px;max-width:90px;" value="${escapeHtml(item.date || '')}" placeholder="日期">
            <input type="text" class="agenda-text" style="flex:1 1 0;min-width:0;" value="${escapeHtml(item.text || '')}" placeholder="待办内容（相对时间请标注绝对日期）">
            <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

/**
 * 构建面板详细内容
 */
function buildPanelContent(messageIndex, meta) {
    const costumeRows = Object.entries(meta.costumes || {}).map(([char, costume]) => `
        <div class="horae-editor-row">
            <input type="text" class="char-input" value="${char}" placeholder="角色名">
            <input type="text" value="${costume}" placeholder="服装描述">
            <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('') || '<div class="horae-empty-hint">无服装变化</div>';
    
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
    }).join('') || '<div class="horae-empty-hint">无物品变化</div>';
    
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
    }).join('') || '<div class="horae-empty-hint">无好感度变化</div>';
    
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
        </div>
        <div class="horae-panel-rescan">
            <div class="horae-rescan-label"><i class="fa-solid fa-rotate"></i> 重新扫描此消息</div>
            <div class="horae-rescan-buttons">
                <button class="horae-btn-quick-scan menu_button" title="从现有文本中提取格式化数据（不消耗API）">
                    <i class="fa-solid fa-bolt"></i> 快速解析
                </button>
                <button class="horae-btn-ai-analyze menu_button" title="使用AI分析消息内容（消耗API）">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> AI分析
                </button>
            </div>
        </div>
        <div class="horae-panel-footer">
            <button class="horae-btn-save menu_button"><i class="fa-solid fa-check"></i> 保存</button>
            <button class="horae-btn-cancel menu_button"><i class="fa-solid fa-xmark"></i> 取消</button>
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
    
    panelEl.querySelector('.horae-btn-save')?.addEventListener('click', () => {
        savePanelData(panelEl, messageId);
    });
    
    panelEl.querySelector('.horae-btn-cancel')?.addEventListener('click', () => {
        contentEl.style.display = 'none';
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
        const prevVal = parseInt(row.dataset.prev) || 0;
        
        deltaInput?.addEventListener('input', () => {
            const deltaStr = deltaInput.value.replace(/[^\d\-+]/g, '');
            const delta = parseInt(deltaStr) || 0;
            totalInput.value = prevVal + delta;
        });
        
        totalInput?.addEventListener('input', () => {
            const total = parseInt(totalInput.value) || 0;
            const delta = total - prevVal;
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
        const total = parseInt(totalInput?.value) || 0;
        
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
    
    $('#horae-setting-context-depth').on('change', function() {
        settings.contextDepth = parseInt(this.value) || 15;
        saveSettings();
    });
    
    $('#horae-setting-injection-position').on('change', function() {
        settings.injectionPosition = parseInt(this.value) || 1;
        saveSettings();
    });
    
    $('#horae-btn-scan-all, #horae-btn-scan-history').on('click', scanHistoryWithProgress);
    
    $('#horae-timeline-filter').on('change', updateTimelineDisplay);
    $('#horae-timeline-search').on('input', updateTimelineDisplay);
    
    $('#horae-btn-add-agenda').on('click', () => openAgendaEditModal(null));
    
    $('#horae-btn-agenda-select-all').on('click', selectAllAgenda);
    $('#horae-btn-agenda-delete').on('click', deleteSelectedAgenda);
    $('#horae-btn-agenda-cancel-select').on('click', exitAgendaMultiSelect);
    
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
    });
    
    $('#horae-setting-send-characters').on('change', function() {
        settings.sendCharacters = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
    });
    
    $('#horae-setting-send-items').on('change', function() {
        settings.sendItems = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
    });
    
    $('#horae-btn-refresh').on('click', refreshAllDisplays);
    
    $('#horae-btn-add-table').on('click', addNewExcelTable);
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
}

/**
 * 同步设置到UI
 */
function syncSettingsToUI() {
    $('#horae-setting-enabled').prop('checked', settings.enabled);
    $('#horae-setting-auto-parse').prop('checked', settings.autoParse);
    $('#horae-setting-inject-context').prop('checked', settings.injectContext);
    $('#horae-setting-show-panel').prop('checked', settings.showMessagePanel);
    $('#horae-setting-context-depth').val(settings.contextDepth);
    $('#horae-setting-injection-position').val(settings.injectionPosition);
    $('#horae-setting-send-timeline').prop('checked', settings.sendTimeline);
    $('#horae-setting-send-characters').prop('checked', settings.sendCharacters);
    $('#horae-setting-send-items').prop('checked', settings.sendItems);
}

// ============================================
// 核心功能
// ============================================

/**
 * 带进度显示的历史扫描
 */
async function scanHistoryWithProgress() {
    const overlay = document.createElement('div');
    overlay.className = 'horae-progress-overlay';
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
    
    const analysisPrompt = `请分析以下文本，提取关键信息并以指定格式输出。核心原则：只提取文本中明确提到的信息，没有的字段不写，禁止编造。

【文本内容】
${messageContent}

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
affection:角色名=好感度数值（仅NPC对${userName}的好感，禁止记录${userName}自己，禁止数值后加注解）
npc:角色名|外貌=性格@与${userName}的关系~性别:男或女~年龄:数字~种族:种族名~职业:职业名
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
  新增：agenda:2026/02/10|艾伦邀请${userName}情人节晚上约会(2026/02/14 18:00)
  完成：agenda-:艾伦邀请${userName}情人节晚上约会
· event：放在<horaeevent>内，不放在<horae>内。`;

    try {
        const response = await context.generateRaw(analysisPrompt, null, false, false);
        
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
    
    const chat = horaeManager.getChat();
    const message = chat[messageId];
    
    if (!message || message.is_user) return;
    
    console.log(`[Horae] 处理新消息 #${messageId}`);
    
    const hasTag = horaeManager.processAIResponse(messageId, message.mes);
    
    if (hasTag) {
        console.log(`[Horae] 从消息 #${messageId} 解析到元数据`);
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
}

/**
 * 消息删除时触发 — 重建表格数据
 */
function onMessageDeleted() {
    if (!settings.enabled) return;
    
    console.log('[Horae] 检测到消息删除，重建表格数据...');
    horaeManager.rebuildTableData();
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
    
    console.log(`[Horae] 检测到消息 #${messageId} 编辑，重新解析...`);
    
    // 重新解析这条消息
    horaeManager.processAIResponse(messageId, message.mes);
    
    horaeManager.rebuildTableData();
    getContext().saveChat();
    
    refreshAllDisplays();
    renderCustomTablesList();
}

/**
 * 准备注入上下文
 */
async function onPromptReady(eventData) {
    if (!settings.enabled || !settings.injectContext) return;
    if (eventData.dryRun) return;
    
    try {
        const prompt = horaeManager.generateCompactPrompt();
        const systemAddition = horaeManager.generateSystemPromptAddition();
        
        const combinedPrompt = `${prompt}\n${systemAddition}`;
        
        // 注入到上下文
        const position = settings.injectionPosition;
        if (position === 0) {
            eventData.chat.push({ role: 'system', content: combinedPrompt });
    } else {
            eventData.chat.splice(-position, 0, { role: 'system', content: combinedPrompt });
        }
        
        console.log(`[Horae] 已注入上下文，位置: -${position}`);
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

/**
 * 消息渲染时触发
 */
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

// ============================================
// 初始化
// ============================================

jQuery(async () => {
    console.log(`[Horae] 开始加载 v${VERSION}...`);

    await initNavbarFunction();
    loadSettings();
    ensureRegexRules();
    
    $('#extensions-settings-button').after(await getTemplate('drawer'));

    await initDrawer();
    initTabs();
    initSettingsEvents();
    syncSettingsToUI();
    
    horaeManager.init(getContext(), settings);
    
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, onMessageReceived);
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
    eventSource.on(event_types.MESSAGE_RENDERED, onMessageRendered);
    eventSource.on(event_types.MESSAGE_SWIPED, onMessageRendered); // 修复滑动分页后面板消失
    eventSource.on(event_types.MESSAGE_DELETED, onMessageDeleted); // 消息删除时重建表格数据
    eventSource.on(event_types.MESSAGE_EDITED, onMessageEdited);   // 消息编辑时重建表格数据
    
    refreshAllDisplays();
    
    isInitialized = true;
    console.log(`[Horae] v${VERSION} 加载完成！作者: SenriYuki`);
});
