/**
 * Horae - 时光记忆插件 
 * 基于时间锚点的AI记忆增强系统
 * 
 * 作者: SenriYuki，柏柏
 * 版本: 1.13.5B
 */

import { renderExtensionTemplateAsync, getContext, extension_settings } from '/scripts/extensions.js';
import { getSlideToggleOptions, saveSettingsDebounced, eventSource, event_types, doNewChat } from '/script.js';
import { slideToggle } from '/lib.js';

import { horaeManager, createEmptyMeta, getItemBaseName } from './core/horaeManager.js';
import { createAgendaController } from './core/agendaController.js';
import { vectorManager } from './core/vectorManager.js';
import { calculateRelativeTime, calculateDetailedRelativeTime, formatRelativeTime, generateTimeReference, getCurrentSystemTime, formatStoryDate, formatFullDateTime, parseStoryDate } from './utils/timeUtils.js';
import { t, tForLang, initI18n, getLanguage, isZhLocale, setLanguage, detectEffectiveAiLangIsZh, detectEffectiveAiLang } from './core/i18n.js';
import { initPromptDefaults, ensurePromptDefaults, getPromptDefaultSync } from './core/promptDefaults.js';

// ============================================
// 常量定义
// ============================================
const EXTENSION_NAME = 'horae';
const EXTENSION_FOLDER = `third-party/SillyTavern-Horae`;
const TEMPLATE_PATH = `${EXTENSION_FOLDER}/assets/templates`;
const VERSION = '1.13.5B';
const DEFAULT_VECTOR_STRIP_TAGS = 'dream_status,Episode,details,think,thinking,Thinking';

// 配套正则规则（自动注入ST原生正则系统）
const HORAE_REGEX_RULES = [
    {
        id: 'horae_think_sanitize',
        scriptName: 'Horae - 思维链标签安全化',
        description: '将思维链内的<horae>等标签转为全角括号，防止DOM解析冲突与收束误吞',
        findRegex: '/<(\\/?horae(?:event|rpg|table[^>]*)?)>(?=[\\s\\S]*?<\\/think(?:ing)?>)/gi',
        replaceString: '‹$1›',
        trimStrings: [],
        placement: [2],
        disabled: false,
        markdownOnly: false,
        promptOnly: false,
        runOnEdit: true,
        substituteRegex: 0,
        minDepth: null,
        maxDepth: null,
    },
    {
        id: 'horae_hide',
        scriptName: 'Horae - 隐藏状态标签',
        description: '隐藏<horae>状态标签，不显示在正文，不发送给AI',
        findRegex: '/(?:<horae>(?:(?!<\\/think(?:ing)?>|<horae>)[\\s\\S])*?<\\/horae>|<!--horae[\\s\\S]*?-->)/gim',
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
        findRegex: '/<horaeevent>(?:(?!<\\/think(?:ing)?>|<horaeevent>)[\\s\\S])*?<\\/horaeevent>/gim',
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
        findRegex: '/<horaetable[:\\uff1a][\\s\\S]*?<\\/horaetable(?:[:\\uff1a][^>]*)?>/gim',
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
        id: 'horae_rpg_hide',
        scriptName: 'Horae - 隐藏RPG标签',
        description: '隐藏<horaerpg>标签，不显示在正文，不发送给AI',
        findRegex: '/<horaerpg>(?:(?!<\\/think(?:ing)?>|<horaerpg>)[\\s\\S])*?<\\/horaerpg>/gim',
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
    uiLanguage: 'auto',
    aiOutputLanguage: 'auto',
    enabled: true,
    autoParse: true,
    autoFillPrevTimelineOnSend: true, // 发送前自动补全上一条AI消息的时间线（默认关闭，避免静默误写历史）
    injectContext: true,
    injectCustomPrompts: true, // 是否在摘要/总结后台任务中注入自定义头尾提示词
    showMessagePanel: true,
    injectionDepthSource: 'system', // 注入深度来源: system(原逻辑) / preset(按完整提示词末尾偏移)
    injectionPosition: 0,
    timelineInjectionMode: 'separate', // inline(原逻辑合并注入) / separate(剧情轨迹独立前置)
    lastStoryDate: '',
    lastStoryTime: '',
    favoriteNpcs: [],  // 用户标记的星标NPC列表
    pinnedNpcs: [],    // 用户手动标记的重要角色列表（特殊边框）
    // 发送给AI的内容控制
    sendTimeline: true,    // 发送剧情轨迹（关闭则无法计算相对时间）
    contextDepth: 9999,      // 一般级别剧情轨迹数量,默认无限
    sendCharacters: true,  // 发送角色信息（在场角色、服装、NPC信息）
    sendCharacterAffection: true, // 发送角色好感度（子选项，默认开启）
    sendMainCharacterPersonality: false, // 发送主要角色性格（子选项，默认关闭）
    sendItems: true,       // 发送物品栏
    customTables: [],      // 自定义表格 [{id, name, rows, cols, data, prompt}]
    customSystemPrompt: '',      // 自定义系统注入提示词（空=使用默认）
    customBatchPrompt: '',       // 自定义AI摘要提示词（空=使用默认）
    customAnalysisPrompt: '',    // 自定义AI分析提示词（空=使用默认）
    customCompressPrompt: '',    // 自定义剧情压缩提示词（空=使用默认）
    customAutoSummaryPrompt: '', // 自定义自动摘要提示词（空=使用默认；独立于手动压缩）
    customAutoResummaryPrompt: '', // 自定义二次总结提示词（空=使用默认）
    customHeadPrompt: '',        // 摘要/总结任务自定义头部提示词
    customTailPrompt: '',        // 摘要/总结任务自定义尾部提示词
    aiScanIncludeNpc: false,     // AI摘要是否提取NPC
    aiScanIncludeAffection: false, // AI摘要是否提取好感度
    aiScanIncludeScene: false,    // AI摘要是否提取场景记忆
    aiScanIncludeRelationship: false, // AI摘要是否提取关系网络
    panelWidth: 100,               // 消息面板宽度百分比（50-100）
    panelOffset: 0,                // 消息面板右偏移量（px）
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
    autoSummaryEnabled: true,     // 自动摘要开关
    autoSummaryKeepRecent: 5,      // 保留最近N条AI消息不压缩（中间用户消息会随全文一起发送）
    autoSummarySourceMode: 'events', // 'fulltext'(全文+时间线) | 'events'(仅时间线事件)
    autoSummaryBufferMode: 'messages', // 'messages'(按AI条数) | 'tokens'
    autoSummaryBufferLimit: 10,     // 旧版缓冲阈值（迁移用）
    autoSummaryBufferMsgLimit: 12,  // 按AI条数触发的阈值
    autoSummaryBufferTokenLimit: 30000, // 按Token数触发的阈值
    autoSummaryResummaryThreshold: 7, // <=0 关闭二次总结；>0 时同层摘要达到此值触发更高层摘要（2->3->4...）
    autoSummaryBatchMaxMsgs: 50,    // 单次摘要最大消息条数
    autoSummaryBatchMaxTokens: 80000, // 单次摘要最大Token数
    autoSummaryUseCustomApi: false, // 旧字段（兼容保留，不再作为开关）
    autoSummaryApiUrl: '',          // 独立API端点地址（OpenAI兼容）
    autoSummaryApiKey: '',          // 独立API密钥
    autoSummaryModel: '',           // 独立API模型名称
    summaryShouldStream: false,      // 总结/补全生成是否使用流式传输
    subApiScopeAutoSummary: false,   // 副API应用范围：自动总结
    subApiScopeManualSummary: false, // 副API应用范围：手动总结（时间线压缩）
    subApiScopeBrief: false,        // 副API应用范围：摘要（预留）
    antiParaphraseMode: false,      // 反转述模式：AI回复时结算上一条USER的内容
    sideplayMode: false,            // 番外/小剧场模式：启用后可标记消息跳过Horae
    // RPG 模式
    rpgMode: false,                 // RPG 模式总开关
    sendRpgBars: true,              // 发送属性条（HP/MP/SP/状态）
    rpgBarsUserOnly: false,         // 属性条仅限主角
    sendRpgSkills: true,            // 发送技能列表
    rpgSkillsUserOnly: false,       // 技能仅限主角
    sendRpgAttributes: true,        // 发送多维属性面板
    rpgAttrsUserOnly: false,        // 属性面板仅限主角
    sendRpgReputation: true,        // 发送声望数据
    rpgReputationUserOnly: false,   // 声望仅限主角
    sendRpgEquipment: false,        // 发送装备栏（可选）
    rpgEquipmentUserOnly: false,    // 装备仅限主角
    sendRpgLevel: false,            // 发送等级/经验值
    rpgLevelUserOnly: false,        // 等级仅限主角
    sendRpgCurrency: false,         // 发送货币系统
    rpgCurrencyUserOnly: false,     // 货币仅限主角
    rpgUserOnly: false,             // RPG全局仅限主角（总开关，联动所有子模块）
    sendRpgStronghold: false,       // 发送据点/基地系统
    rpgBarConfig: [],
    rpgAttributeConfig: [],
    rpgAttrViewMode: 'radar',       // 'radar' 或 'text'
    customRpgPrompt: '',            // 自定义RPG提示词（空=默认）
    promptPresets: [],              // 提示词预设存档 [{name, prompts:{system,batch,...}}]
    equipmentTemplates: [],          // 装备格位模板（i18n 初始化后生成）
    rpgDiceEnabled: false,          // RPG骰子面板
    dicePosX: null,                 // 骰子面板拖拽位置X（null=默认右下角）
    dicePosY: null,                 // 骰子面板拖拽位置Y
    // 教学
    tutorialCompleted: false,       // 新用户导航教学是否已完成
    // 向量记忆
    vectorEnabled: false,
    vectorSource: 'local',             // 'local' = 本地模型, 'api' = 远程 API
    vectorModel: 'Xenova/bge-small-zh-v1.5',
    vectorDtype: 'q8',
    vectorApiUrl: 'https://api.siliconflow.cn/v1',                  // OpenAI 兼容 embedding API 地址
    vectorApiKey: '',                  // API 密钥
    vectorApiModel: 'Qwen/Qwen3-Embedding-8B',                // 远程 embedding 模型名称
    vectorQueryRewriteEnabled: true,   // 启用 Query 重写
    vectorQueryRewriteUrl: '',         // Query 重写 API 地址（留空=复用 embedding）
    vectorQueryRewriteKey: '',         // Query 重写 API 密钥（留空=复用 embedding）
    vectorQueryRewriteModel: 'Qwen/Qwen3.5-27B',       // Query 重写模型名称（留空=关闭）
    vectorPureMode: true,             // 纯向量模式（强模型优化，关闭关键词启发式）
    vectorRerankEnabled: true,        // 启用 Rerank 二次排序
    vectorRerankFullText: true,       // Rerank 使用全文而非摘要（需要长上下文模型如 Qwen3-Reranker）
    vectorRerankModel: 'Qwen/Qwen3-Reranker-4B',             // Rerank 模型名称
    vectorRerankUrl: '',               // Rerank API 地址（留空则复用 embedding 地址）
    vectorRerankKey: '',               // Rerank API 密钥（留空则复用 embedding 密钥）
    vectorRerankCandidates: 25,        // Rerank 候选条数（embedding 召回上限）
    vectorRerankRecallThreshold: 0.3,  // Rerank 路径的 embedding 召回阈值
    vectorRerankMinScore: 0.5,         // Rerank 最低分；低于此分丢弃
    vectorRecallPresets: [],           // 用户自定义召回参数预设
    vectorRecallPresetSelected: 'builtin:rerank',
    vectorTopK: 5,
    vectorThreshold: 0.72,
    vectorFullTextCount: 3,
    vectorFullTextThreshold: 0.9,
    vectorStripTags: DEFAULT_VECTOR_STRIP_TAGS,
};

const PROMPT_SETTING_KEYS = [
    'customSystemPrompt',
    'customBatchPrompt',
    'customAnalysisPrompt',
    'customCompressPrompt',
    'customAutoSummaryPrompt',
    'customAutoResummaryPrompt',
    'customHeadPrompt',
    'customTailPrompt',
    'customTablesPrompt',
    'customLocationPrompt',
    'customRelationshipPrompt',
    'customMoodPrompt',
    'customRpgPrompt',
];

// ============================================
// 全局变量
// ============================================
let settings = { ...DEFAULT_SETTINGS };
let doNavbarIconClick = null;
let isInitialized = false;
let _i18nReady = false;
let _isSummaryGeneration = false;
let _summaryInProgress = false;
let _chatFullyLoaded = false;
let _autoSummaryRanThisTurn = false;
let _vectorEnsureIndexPromise = null;
let _vectorEnsureIndexChatId = null;
let _vectorDeferredIndexKeys = new Set();
let itemsMultiSelectMode = false;  // 物品多选模式
let selectedItems = new Set();     // 选中的物品名称
let npcMultiSelectMode = false;     // NPC多选模式
let selectedNpcs = new Set();       // 选中的NPC名称
let timelineMultiSelectMode = false; // 时间线多选模式
let selectedTimelineEvents = new Set(); // 选中的事件（"msgIndex-eventIndex"格式）
let timelineLongPressTimer = null;  // 时间线长按计时器
const _panelAiAnalysisInProgress = new Set(); // 底部楼层面板 AI 分析中的消息索引
const _hideUnhideDebugStats = {
    hide: 0,
    unhide: 0,
    hideMsgs: 0,
    unhideMsgs: 0,
    batches: 0,
}; // debug stats
let _slashCommandExecutorPromise = null;

const agendaController = createAgendaController({
    getContext,
    createEmptyMeta,
    normalizeAgendaType: horaeManager.normalizeAgendaType.bind(horaeManager),
    t,
    escapeHtml,
    showToast,
    closeEditModal,
    preventModalBubble,
});

// ============================================
// 工具函数
// ============================================


/** 自动注入配套正则到ST原生正则系统（始终置于末尾，避免与其他正则冲突） */
async function getSlashCommandExecutor() {
    if (!_slashCommandExecutorPromise) {
        _slashCommandExecutorPromise = import('/scripts/slash-commands.js')
            .then((mod) => {
                const exec = mod?.executeSlashCommandsWithOptions;
                if (typeof exec !== 'function') {
                    throw new Error('executeSlashCommandsWithOptions is unavailable');
                }
                return exec;
            })
            .catch((err) => {
                _slashCommandExecutorPromise = null;
                throw err;
            });
    }
    return await _slashCommandExecutorPromise;
}

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

/* 使用酒馆方法进行token计算,但不会自动处理引号,暂时弃用 */
async function countTokensByText(text) {
    const exec = await getSlashCommandExecutor();
    const input = String(text ?? '');
    const result = await exec(`/tokens ${JSON.stringify(input)}`);
    const tokens = Number.parseInt(result?.pipe ?? '', 10);
    return Number.isFinite(tokens) ? tokens : 0;
}


/** 获取HTML模板 */
async function getTemplate(name) {
    return await renderExtensionTemplateAsync(TEMPLATE_PATH, name);
}

function _getDefaultRpgAttrConfig() {
    const lang = detectEffectiveAiLang(settings);
    const attrKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    return attrKeys.map(key => ({
        key,
        name: tForLang(lang, `rpgDefaults.attributes.${key}.name`),
        desc: tForLang(lang, `rpgDefaults.attributes.${key}.desc`),
    }));
}

function _getDefaultRpgBarConfig() {
    const lang = detectEffectiveAiLang(settings);
    return [
        { key: 'hp', color: '#22c55e' },
        { key: 'mp', color: '#6366f1' },
        { key: 'sp', color: '#f59e0b' },
    ].map(bar => ({
        ...bar,
        name: tForLang(lang, `rpgDefaults.bars.${bar.key}.name`),
        min: 0,
        max: 100,
        defaultMax: 100,
        required: true,
        desc: tForLang(lang, `rpgDefaults.bars.${bar.key}.desc`),
    }));
}

const HORAEEQ_TEMPLATE_ALIAS_MAP = {
    human: ['人类', '人類', 'Human', 'human', '人間', '인간', 'Человек'],
    orc: ['兽人', '獸人', '兽化人形', '獸化人形', 'ORC', 'orc', '欧克', '歐克', '奥克', '奧克', 'オーク', '오크', 'орк'],
    pigman: ['猪人', '豬人', '豚人', 'Pigfolk', 'pigfolk', 'Pigman', 'pigman', '돼지 수인', 'свинолюд'],
    winged: ['翼族', '翼人', '有翼种', '有翼種', 'winged', 'Winged', '날개족', 'крылатый'],
    centaur: ['人马', '人馬', 'Centaur', 'centaur', 'ケンタウロス', '켄타우로스', 'кентавр'],
    lamia: ['拉弥亚', '拉彌亞', 'lamia', 'Lamia', 'ラミア', '라미아', 'ламия', '蛇尾人', 'serpentine', 'Serpentine', '뱀꼬리족', 'змеинохвостый'],
    demon: ['恶魔', '惡魔', 'Demon', 'demon', '悪魔', '악마', 'демон'],
    kitsune: ['九尾狐', '狐妖', 'Kitsune', 'kitsune', 'Fox Spirit', 'fox spirit', '구미호', '여우 요괴', 'кицунэ', 'лисий дух'],
    shapeshifter: ['妖怪', '變身者', '变身者', 'Yokai', 'yokai', 'Youkai', 'youkai', 'Shapeshifter', 'shapeshifter', '変身者', '요괴', '변신자', 'ёкай', 'оборотень'],
    feathered_serpent: ['羽蛇人', 'Feathered Serpent', 'feathered serpent', '깃털뱀족', 'пернатый змей'],
};

const HORAEEQ_AMBIGUOUS_TEMPLATE_ALIASES = new Set([
    '兽人', '獸人', '獣人', 'beastfolk', 'beastman', 'beastwoman', '수인',
    '妖怪', 'yokai', 'youkai', 'monster', 'shapeshifter', '變身者', '变身者', '変身者',
]);

function _getDefaultEquipTemplates() {
    const lang = detectEffectiveAiLang(settings);
    const T = (key) => tForLang(lang, `equipmentTemplates.${key}`);
    const S = (key, { maxCount = 1, desc = false, nameKey = key } = {}) => {
        const slot = { name: T(`slots.${nameKey}.name`), maxCount };
        if (desc) slot.desc = T(`slots.${nameKey}.desc`);
        return slot;
    };
    const humanoid = () => [S('head'), S('torso'), S('hands'), S('belt'), S('legs'), S('feet'), S('neck'), S('amulet'), S('ring', { maxCount: 2 })];
    const tpl = (id, slots, forms = null, parts = []) => ({
        id,
        name: T(`templates.${id}.name`),
        aliases: HORAEEQ_TEMPLATE_ALIAS_MAP[id] || [],
        parts,
        slots,
        forms: forms || [{ id: 'default', name: T('forms.default'), slots }],
    });
    const serpentTailOrnament = () => S('serpentTailOrnament', { desc: true });
    const tailOrnament = (maxCount = 1) => S('tailOrnament', { maxCount, desc: true });
    return [
        tpl('human', humanoid(), null, ['humanoid']),
        tpl('orc', [S('head'), S('torso'), S('hands'), S('belt'), S('legs'), S('feet'), S('neck'), S('ring', { maxCount: 2 })], null, ['humanoid']),
        tpl('pigman', [S('head'), S('torso'), S('hands'), S('belt'), S('legs'), S('feet'), S('neck'), S('ring', { maxCount: 2 })], null, ['humanoid', 'tail_unwearable']),
        tpl('winged', [S('head'), S('torso'), S('hands'), S('belt'), S('legs'), S('feet'), S('wings', { desc: true }), S('neck'), S('ring', { maxCount: 2 })], null, ['humanoid', 'winged']),
        tpl('centaur', [S('head'), S('torso'), S('hands'), S('belt'), S('barding'), S('horseshoe', { maxCount: 4 }), S('neck'), S('ring', { maxCount: 2 })], null, ['humanoid', 'quadruped']),
        tpl('lamia', [S('head'), S('torso'), S('hands'), S('belt'), serpentTailOrnament(), S('neck'), S('amulet'), S('ring', { maxCount: 2 })], null, ['humanoid', 'serpentine']),
        tpl('demon', [S('head'), S('hornOrnament'), S('torso'), S('hands'), S('belt'), S('legs'), S('feet'), S('wings', { desc: true }), S('tail', { desc: true }), S('neck'), S('ring', { maxCount: 2 })], null, ['humanoid', 'winged', 'tail']),
        tpl('kitsune', humanoid(), [
            { id: 'human', name: T('forms.human'), slots: humanoid() },
            { id: 'hybrid', name: T('forms.hybridFox'), slots: [S('head'), S('torso'), S('hands'), S('belt'), S('legs'), S('feet'), tailOrnament(9), S('neck'), S('ring', { maxCount: 2 })] },
            { id: 'fox', name: T('forms.fox'), slots: [S('collar'), tailOrnament(9), S('clawGuard', { maxCount: 4 })] },
        ], ['humanoid', 'shapeshifter', 'tail']),
        tpl('shapeshifter', humanoid(), [
            { id: 'human', name: T('forms.human'), slots: humanoid() },
            { id: 'hybrid', name: T('forms.hybridBeast'), slots: [S('head'), S('torso'), S('hands'), S('belt'), S('legs'), S('feet'), S('tail', { desc: true }), S('neck'), S('ring', { maxCount: 2 })] },
            { id: 'animal', name: T('forms.animal'), slots: [S('collar'), S('tail', { desc: true }), S('clawGuard', { maxCount: 4 })] },
        ], ['humanoid', 'shapeshifter']),
        tpl('feathered_serpent', [S('head'), S('torso'), S('hands'), S('belt'), S('wings', { desc: true }), serpentTailOrnament(), S('neck'), S('ring', { maxCount: 2 })], null, ['humanoid', 'winged', 'serpentine']),
    ];
}

/** 遍历 DOM 中所有带 data-i18n 的元素，替换文本为当前语言翻译 */
function applyI18nToDOM(root) {
    const container = root || document;
    const appendTranslatedText = (el, text) => {
        el.textContent = '';
        if (text.includes('\n')) {
            const parts = text.split('\n');
            parts.forEach((line, i) => {
                el.appendChild(document.createTextNode(line));
                if (i < parts.length - 1) el.appendChild(document.createElement('br'));
            });
        } else {
            el.appendChild(document.createTextNode(text));
        }
    };
    container.querySelectorAll('[data-i18n]').forEach(el => {
        let rawKey = el.getAttribute('data-i18n');
        let target = 'content';
        const prefixMatch = rawKey.match(/^\[(\w+)\](.+)$/);
        if (prefixMatch) {
            target = prefixMatch[1];
            rawKey = prefixMatch[2];
        }
        const translated = t(rawKey);
        if (!translated || translated === rawKey) return;

        if (target === 'placeholder' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translated;
            return;
        }
        if (target === 'title') { el.title = translated; return; }
        if (el.tagName === 'OPTION') { el.textContent = translated; return; }

        const hasInteractive = el.querySelector('input, select, textarea, button');
        if (hasInteractive) {
            let replaced = false;
            for (const node of el.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    node.textContent = translated;
                    replaced = true;
                    break;
                }
            }
            if (!replaced) el.appendChild(document.createTextNode(translated));
            return;
        }

        const icons = [...el.childNodes].filter(n =>
            n.nodeType === Node.ELEMENT_NODE && (n.tagName === 'I' || n.tagName === 'SVG')
            && !n.getAttribute('data-i18n')
        );
        if (icons.length > 0) {
            const savedIcons = icons.map(ic => ic.cloneNode(true));
            el.textContent = '';
            if (savedIcons.length > 0) {
                el.appendChild(savedIcons[0]);
                el.appendChild(document.createTextNode(' '));
            }
            if (translated.includes('\n')) {
                const parts = translated.split('\n');
                parts.forEach((line, i) => {
                    el.appendChild(document.createTextNode(line));
                    if (i < parts.length - 1) el.appendChild(document.createElement('br'));
                });
            } else {
                el.appendChild(document.createTextNode(translated));
            }
            for (let si = 1; si < savedIcons.length; si++) {
                el.appendChild(savedIcons[si]);
            }
        } else {
            appendTranslatedText(el, translated);
        }
    });
    container.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translated = t(key);
        if (translated && translated !== key) el.title = translated;
    });
    container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated && translated !== key) el.placeholder = translated;
    });
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
let _isFirstTimeUser = false;

function _normalizeLf(text) {
    return typeof text === 'string' ? text.replace(/\r\n?/g, '\n') : text;
}

function _normalizePromptTextFields(obj, keys = PROMPT_SETTING_KEYS) {
    if (!obj || typeof obj !== 'object') return false;
    let changed = false;
    for (const key of keys) {
        const val = obj[key];
        if (typeof val !== 'string') continue;
        const normalized = _normalizeLf(val);
        if (normalized !== val) {
            obj[key] = normalized;
            changed = true;
        }
    }
    return changed;
}

function _normalizePromptSettingsInPlace() {
    let changed = _normalizePromptTextFields(settings, PROMPT_SETTING_KEYS);
    if (Array.isArray(settings.promptPresets)) {
        for (const preset of settings.promptPresets) {
            if (!preset || typeof preset !== 'object') continue;
            if (!preset.prompts || typeof preset.prompts !== 'object') continue;
            changed = _normalizePromptTextFields(preset.prompts, PROMPT_SETTING_KEYS) || changed;
        }
    }
    return changed;
}

const VECTOR_RECALL_PRESET_FIELDS = [
    'vectorPureMode',
    'vectorRerankEnabled',
    'vectorRerankFullText',
    'vectorRerankCandidates',
    'vectorRerankRecallThreshold',
    'vectorRerankMinScore',
    'vectorTopK',
    'vectorThreshold',
    'vectorFullTextCount',
    'vectorFullTextThreshold',
];

const BUILTIN_VECTOR_RECALL_PRESETS = [
    {
        id: 'small',
        labelKey: 'vector.presetSmall',
        values: {
            vectorPureMode: false,
            vectorRerankEnabled: false,
            vectorRerankFullText: false,
            vectorRerankCandidates: 25,
            vectorRerankRecallThreshold: 0.3,
            vectorRerankMinScore: 0.5,
            vectorTopK: 5,
            vectorThreshold: 0.72,
            vectorFullTextCount: 3,
            vectorFullTextThreshold: 0.9,
        },
    },
    {
        id: 'large',
        labelKey: 'vector.presetLarge',
        values: {
            vectorPureMode: true,
            vectorRerankEnabled: false,
            vectorRerankFullText: false,
            vectorRerankCandidates: 25,
            vectorRerankRecallThreshold: 0.3,
            vectorRerankMinScore: 0.5,
            vectorTopK: 8,
            vectorThreshold: 0.8,
            vectorFullTextCount: 3,
            vectorFullTextThreshold: 0.9,
        },
    },
    {
        id: 'rerank',
        labelKey: 'vector.presetRerank',
        values: {
            vectorPureMode: true,
            vectorRerankEnabled: true,
            vectorRerankFullText: true,
            vectorRerankCandidates: 20,
            vectorRerankRecallThreshold: 0.3,
            vectorRerankMinScore: 0.9,
            vectorTopK: 5,
            vectorThreshold: 0.85,
            vectorFullTextCount: 2,
            vectorFullTextThreshold: 0.9,
        },
    },
];

function _sanitizeVectorRecallPresetValues(values = {}) {
    const out = {};
    out.vectorPureMode = !!values.vectorPureMode;
    out.vectorRerankEnabled = !!values.vectorRerankEnabled;
    out.vectorRerankFullText = !!values.vectorRerankFullText;
    out.vectorRerankCandidates = Math.max(5, parseInt(values.vectorRerankCandidates, 10) || 25);
    const recallThreshold = parseFloat(values.vectorRerankRecallThreshold);
    out.vectorRerankRecallThreshold = Number.isFinite(recallThreshold) ? Math.min(0.8, Math.max(0, recallThreshold)) : 0.3;
    const minScore = parseFloat(values.vectorRerankMinScore);
    out.vectorRerankMinScore = Number.isFinite(minScore) ? Math.min(1, Math.max(0, minScore)) : 0.5;
    out.vectorTopK = Math.min(10, Math.max(1, parseInt(values.vectorTopK, 10) || 5));
    const threshold = parseFloat(values.vectorThreshold);
    out.vectorThreshold = Number.isFinite(threshold) ? Math.min(0.95, Math.max(0.3, threshold)) : 0.72;
    out.vectorFullTextCount = Math.min(5, Math.max(0, parseInt(values.vectorFullTextCount, 10) || 0));
    const fullTextThreshold = parseFloat(values.vectorFullTextThreshold);
    out.vectorFullTextThreshold = Number.isFinite(fullTextThreshold) ? Math.min(1, Math.max(0.6, fullTextThreshold)) : 0.9;
    return out;
}

// 清理已废弃的 vectorFallback* 字段
function _migrateLegacyVectorSettings(saved) {
    if (!saved || typeof saved !== 'object') return false;
    let changed = false;
    if ('vectorFallbackEnabled' in saved) { delete saved.vectorFallbackEnabled; changed = true; }
    if ('vectorFallbackMinScore' in saved) { delete saved.vectorFallbackMinScore; changed = true; }
    if ('vectorRerankScoreMode' in saved) { delete saved.vectorRerankScoreMode; changed = true; }
    return changed;
}

function _collectCurrentVectorRecallPresetValues() {
    const values = {};
    for (const key of VECTOR_RECALL_PRESET_FIELDS) values[key] = settings[key];
    return _sanitizeVectorRecallPresetValues(values);
}

function _applyVectorRecallPresetValues(values) {
    const sanitized = _sanitizeVectorRecallPresetValues(values);
    for (const key of VECTOR_RECALL_PRESET_FIELDS) settings[key] = sanitized[key];
}

function _normalizeVectorRecallPresetsInPlace() {
    let changed = false;
    if (!Array.isArray(settings.vectorRecallPresets)) {
        settings.vectorRecallPresets = [];
        changed = true;
    }
    const normalized = [];
    for (const preset of settings.vectorRecallPresets) {
        if (!preset || typeof preset !== 'object' || !preset.name || !preset.values) {
            changed = true;
            continue;
        }
        const clean = {
            name: String(preset.name).trim(),
            values: _sanitizeVectorRecallPresetValues(preset.values),
        };
        if (!clean.name) {
            changed = true;
            continue;
        }
        normalized.push(clean);
        if (JSON.stringify(clean) !== JSON.stringify(preset)) changed = true;
    }
    settings.vectorRecallPresets = normalized;
    return changed;
}

function _normalizeVectorStripTagsInPlace(saved = {}) {
    let changed = false;
    const normalized = typeof settings.vectorStripTags === 'string' ? settings.vectorStripTags.trim() : '';
    if (settings.vectorStripTags !== normalized) {
        settings.vectorStripTags = normalized;
        changed = true;
    }
    if (saved?._vectorStripTagsDefaultMigrated !== true && !normalized) {
        settings.vectorStripTags = DEFAULT_VECTOR_STRIP_TAGS;
        changed = true;
    }
    if (settings._vectorStripTagsDefaultMigrated !== true) {
        settings._vectorStripTagsDefaultMigrated = true;
        changed = true;
    }
    return changed;
}

function _normalizeRpgBarConfigInPlace() {
    if (!Array.isArray(settings.rpgBarConfig)) {
        settings.rpgBarConfig = [];
        return true;
    }
    let changed = false;
    settings.rpgBarConfig = settings.rpgBarConfig.map((bar, idx) => {
        const fallback = DEFAULT_SETTINGS.rpgBarConfig[idx] || {};
        const clean = {
            key: String(bar?.key || fallback.key || `bar${idx + 1}`).trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || `bar${idx + 1}`,
            name: String(bar?.name || fallback.name || bar?.key || `BAR${idx + 1}`).trim(),
            color: bar?.color || fallback.color || '#a78bfa',
            min: Number.isFinite(parseInt(bar?.min, 10)) ? parseInt(bar.min, 10) : (fallback.min ?? 0),
            max: Number.isFinite(parseInt(bar?.max, 10)) ? parseInt(bar.max, 10) : (fallback.max ?? 100),
            defaultMax: Number.isFinite(parseInt(bar?.defaultMax, 10)) ? parseInt(bar.defaultMax, 10) : (fallback.defaultMax ?? 100),
            required: bar?.required !== false,
            desc: String(bar?.desc || fallback.desc || '').trim(),
        };
        if (clean.max <= clean.min) clean.max = clean.min + 1;
        clean.defaultMax = Math.min(clean.max, Math.max(clean.min + 1, clean.defaultMax));
        if (JSON.stringify(clean) !== JSON.stringify(bar)) changed = true;
        return clean;
    });
    return changed;
}

function _ensureLocalizedRpgDefaults({ force = false } = {}) {
    if (!_i18nReady) return false;
    let changed = false;
    if (force || !Array.isArray(settings.rpgBarConfig) || !settings.rpgBarConfig.length) {
        settings.rpgBarConfig = _getDefaultRpgBarConfig();
        changed = true;
    }
    if (force || !Array.isArray(settings.rpgAttributeConfig) || !settings.rpgAttributeConfig.length) {
        settings.rpgAttributeConfig = _getDefaultRpgAttrConfig();
        changed = true;
    }
    if (force || !Array.isArray(settings.equipmentTemplates) || !settings.equipmentTemplates.length) {
        settings.equipmentTemplates = _getDefaultEquipTemplates();
        settings._equipmentTemplateV2Migrated = true;
        changed = true;
    }
    return changed;
}

function _normalizeEquipSlot(slot, idx = 0) {
    const name = String(slot?.name || '').trim();
    if (!name) return null;
    const maxCount = Math.max(1, parseInt(slot?.maxCount, 10) || 1);
    const clean = { name, maxCount };
    const desc = String(slot?.desc || '').trim();
    if (desc) clean.desc = desc;
    if (slot?.forms && Array.isArray(slot.forms)) clean.forms = slot.forms.map(String).filter(Boolean);
    return clean;
}

function _normalizeEquipTemplate(tpl, idx = 0) {
    if (!tpl || typeof tpl !== 'object') return null;
    const name = String(tpl.name || `Template ${idx + 1}`).trim();
    if (!name) return null;
    const baseSlots = (Array.isArray(tpl.slots) ? tpl.slots : []).map(_normalizeEquipSlot).filter(Boolean);
    let forms = Array.isArray(tpl.forms) ? tpl.forms.map((form, formIdx) => {
        const formSlots = (Array.isArray(form?.slots) ? form.slots : []).map(_normalizeEquipSlot).filter(Boolean);
        if (!formSlots.length) return null;
        return {
            id: String(form.id || `form_${formIdx + 1}`).trim() || `form_${formIdx + 1}`,
            name: String(form.name || form.id || `Form ${formIdx + 1}`).trim(),
            slots: formSlots,
        };
    }).filter(Boolean) : [];
    if (!forms.length && baseSlots.length) {
        const defaultFormName = _i18nReady ? tForLang(detectEffectiveAiLang(settings), 'equipmentTemplates.forms.default') : 'default';
        forms = [{ id: 'default', name: defaultFormName, slots: baseSlots }];
    }
    if (!baseSlots.length && forms.length) baseSlots.push(...forms[0].slots);
    if (!baseSlots.length) return null;
    const clean = {
        id: String(tpl.id || name).trim().toLowerCase().replace(/\s+/g, '_'),
        name,
        aliases: Array.isArray(tpl.aliases) ? tpl.aliases.map(a => String(a).trim()).filter(Boolean) : [name],
        parts: Array.isArray(tpl.parts) ? tpl.parts.map(p => String(p).trim()).filter(Boolean) : [],
        slots: baseSlots,
        forms,
    };
    return clean;
}

function _normalizeRpgEquipmentTemplatesInPlace() {
    if (!Array.isArray(settings.equipmentTemplates)) {
        settings.equipmentTemplates = [];
        return true;
    }
    let normalized = settings.equipmentTemplates.map(_normalizeEquipTemplate).filter(Boolean);
    let changed = JSON.stringify(normalized) !== JSON.stringify(settings.equipmentTemplates);
    if (_i18nReady && !settings._equipmentTemplateV2Migrated) {
        const hasOverlap = (tpl, list) => {
            const keys = new Set(_getEquipTemplateMatchAliases(tpl));
            return list.some(existing => _getEquipTemplateMatchAliases(existing).some(k => keys.has(k)));
        };
        for (const tpl of _getDefaultEquipTemplates().map(_normalizeEquipTemplate).filter(Boolean)) {
            if (!hasOverlap(tpl, normalized)) {
                normalized.push(tpl);
                changed = true;
            }
        }
        settings._equipmentTemplateV2Migrated = true;
        changed = true;
    }
    settings.equipmentTemplates = normalized;
    return changed;
}

function _normalizeRpgSettingsInPlace() {
    let changed = false;
    if (_normalizeRpgBarConfigInPlace()) changed = true;
    if (_normalizeRpgEquipmentTemplatesInPlace()) changed = true;
    return changed;
}

function _normalizeAutoSummarySettingsInPlace(saved = {}) {
    let changed = false;
    const legacyLimit = parseInt(saved.autoSummaryBufferLimit, 10);
    const mode = settings.autoSummaryBufferMode === 'tokens' ? 'tokens' : 'messages';
    if (settings.autoSummaryBufferMode !== mode) {
        settings.autoSummaryBufferMode = mode;
        changed = true;
    }

    if (settings.autoSummarySourceMode !== 'events' && settings.autoSummarySourceMode !== 'fulltext') {
        settings.autoSummarySourceMode = DEFAULT_SETTINGS.autoSummarySourceMode;
        changed = true;
    }

    if (saved.autoSummaryBufferMsgLimit === undefined) {
        const migrated = mode === 'messages' && Number.isFinite(legacyLimit) ? legacyLimit : DEFAULT_SETTINGS.autoSummaryBufferMsgLimit;
        settings.autoSummaryBufferMsgLimit = Math.max(5, parseInt(migrated, 10) || DEFAULT_SETTINGS.autoSummaryBufferMsgLimit);
        changed = true;
    } else {
        const msgLimit = Math.max(5, parseInt(settings.autoSummaryBufferMsgLimit, 10) || DEFAULT_SETTINGS.autoSummaryBufferMsgLimit);
        if (settings.autoSummaryBufferMsgLimit !== msgLimit) {
            settings.autoSummaryBufferMsgLimit = msgLimit;
            changed = true;
        }
    }

    if (saved.autoSummaryBufferTokenLimit === undefined) {
        const migrated = mode === 'tokens' && Number.isFinite(legacyLimit) && legacyLimit >= 1000
            ? legacyLimit
            : DEFAULT_SETTINGS.autoSummaryBufferTokenLimit;
        settings.autoSummaryBufferTokenLimit = Math.max(1000, parseInt(migrated, 10) || DEFAULT_SETTINGS.autoSummaryBufferTokenLimit);
        changed = true;
    } else {
        const tokenLimit = Math.max(1000, parseInt(settings.autoSummaryBufferTokenLimit, 10) || DEFAULT_SETTINGS.autoSummaryBufferTokenLimit);
        if (settings.autoSummaryBufferTokenLimit !== tokenLimit) {
            settings.autoSummaryBufferTokenLimit = tokenLimit;
            changed = true;
        }
    }

    const activeLimit = mode === 'tokens' ? settings.autoSummaryBufferTokenLimit : settings.autoSummaryBufferMsgLimit;
    if (settings.autoSummaryBufferLimit !== activeLimit) {
        settings.autoSummaryBufferLimit = activeLimit;
        changed = true;
    }
    return changed;
}

function loadSettings() {
    let changed = false;
    const saved = extension_settings[EXTENSION_NAME] || null;
    if (extension_settings[EXTENSION_NAME]) {
        settings = { ...DEFAULT_SETTINGS, ...extension_settings[EXTENSION_NAME] };
    } else {
        _isFirstTimeUser = true;
        extension_settings[EXTENSION_NAME] = { ...DEFAULT_SETTINGS };
        settings = { ...DEFAULT_SETTINGS };
    }
    if (!settings._autoFillPrevTimelineDefaultOffMigrated) {
        settings.autoFillPrevTimelineOnSend = false;
        settings._autoFillPrevTimelineDefaultOffMigrated = true;
        changed = true;
    }
    if (settings.subApiScopeBrief && !settings.autoFillPrevTimelineOnSend) {
        settings.autoFillPrevTimelineOnSend = true;
        changed = true;
    }
    if (_normalizeAutoSummarySettingsInPlace(saved || {}) || _normalizePromptSettingsInPlace() || _normalizeVectorRecallPresetsInPlace() || _normalizeVectorStripTagsInPlace(saved || {}) || _normalizeRpgSettingsInPlace()) changed = true;
    if (_migrateLegacyVectorSettings(settings)) changed = true;
    console.log(
        `[Horae][MainPersonality] loadSettings: saved=${saved?.sendMainCharacterPersonality} merged=${!!settings.sendMainCharacterPersonality} sendCharacters=${settings.sendCharacters !== false} pinnedNpcs=${JSON.stringify(settings.pinnedNpcs || [])}`
    );
    if (changed) saveSettings();
}

/** 迁移旧版属性配置到 DND 六维 */
function _migrateAttrConfig() {
    const cfg = settings.rpgAttributeConfig;
    if (!cfg || !Array.isArray(cfg)) return;
    const oldKeys = cfg.map(a => a.key).sort().join(',');
    // 旧版默认值（4维: con,int,spr,str）
    if (oldKeys === 'con,int,spr,str' && cfg.length === 4) {
        settings.rpgAttributeConfig = _getDefaultRpgAttrConfig();
        saveSettings();
        console.log('[Horae] 已自动迁移属性面板配置到 DND 六维');
    }
}

/**
 * 保存设置
 */
function saveSettings() {
    _normalizePromptTextFields(settings, PROMPT_SETTING_KEYS);
    extension_settings[EXTENSION_NAME] = settings;
    saveSettingsDebounced();
    eventSource.emit('horae:settingsChanged', { enabled: !!settings.enabled });
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
    if (!chat?.[0]) return templates.map(tbl => ({ ...tbl }));

    const firstMsg = chat[0];
    if (!firstMsg.horae_meta) return templates.map(tbl => ({ ...tbl }));
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
        const currentNames = new Set(tables.map(tbl => (tbl.name || '').trim()).filter(Boolean));
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
    if (scope === 'global') return getGlobalTables();
    if (scope === 'character') return getCharacterTables();
    return getChatTables();
}

/** 保存指定scope的表格 */
function setTablesByScope(scope, tables) {
    if (scope === 'global') {
        setGlobalTables(tables);
    } else if (scope === 'character') {
        setCharacterTables(tables);
    } else {
        setChatTables(tables);
    }
}

/** 获取当前角色卡的表格模板列表（结构存角色卡 extensions，数据存当前对话） */
function getCharacterTables() {
    const ctx = getContext();
    const charId = ctx?.characterId;
    if (charId == null) return [];

    const chars = ctx.characters;
    const charData = chars?.[charId]?.data;
    if (!charData?.extensions?.horae?.charTables) return [];

    const templates = charData.extensions.horae.charTables;
    const chat = horaeManager.getChat();
    if (!chat?.[0]?.horae_meta) return templates.map(tbl => ({ ...tbl, data: _headerOnly(tbl), baseData: {}, baseRows: tbl.rows || 2, baseCols: tbl.cols || 2 }));

    if (!chat[0].horae_meta.charTableData) chat[0].horae_meta.charTableData = {};
    const perChatData = chat[0].horae_meta.charTableData;

    return templates.map(template => {
        const name = (template.name || '').trim();
        const overlay = perChatData[name];
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
        return {
            ...template,
            data: _headerOnly(template),
            baseData: {},
            baseRows: template.baseRows ?? template.rows ?? 2,
            baseCols: template.baseCols ?? template.cols ?? 2,
        };
    });
}

function _headerOnly(template) {
    const headerData = {};
    for (const key of Object.keys(template.data || {})) {
        const [r, c] = key.split('-').map(Number);
        if (r === 0 || c === 0) headerData[key] = template.data[key];
    }
    return headerData;
}

/** 保存角色卡表格（结构存角色卡 extensions，数据存当前对话） */
function setCharacterTables(tables) {
    const ctx = getContext();
    const charId = ctx?.characterId;
    if (charId == null) return;

    const chars = ctx.characters;
    const charData = chars?.[charId]?.data;
    if (!charData) return;

    if (!charData.extensions) charData.extensions = {};
    if (!charData.extensions.horae) charData.extensions.horae = {};

    const chat = horaeManager.getChat();
    if (chat?.[0]) {
        if (!chat[0].horae_meta) return;
        if (!chat[0].horae_meta.charTableData) chat[0].horae_meta.charTableData = {};
        const perChatData = chat[0].horae_meta.charTableData;

        const currentNames = new Set(tables.map(tbl => (tbl.name || '').trim()).filter(Boolean));
        for (const key of Object.keys(perChatData)) {
            if (!currentNames.has(key)) delete perChatData[key];
        }

        for (const table of tables) {
            const name = (table.name || '').trim();
            if (!name) continue;
            perChatData[name] = {
                data: JSON.parse(JSON.stringify(table.data || {})),
                rows: table.rows || 2,
                cols: table.cols || 2,
                baseData: JSON.parse(JSON.stringify(table.data || {})),
                baseRows: table.rows || 2,
                baseCols: table.cols || 2,
            };
        }
    }

    charData.extensions.horae.charTables = tables.map(table => {
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

    fetch('/api/characters/merge-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            avatar: chars[charId].avatar,
            data: { extensions: { horae: { charTables: charData.extensions.horae.charTables } } }
        })
    }).catch(err => console.warn('[Horae] 保存角色卡表格失败:', err));

    saveSettings();
}

/** 获取合并后的所有表格（用于提示词注入） */
function getAllTables() {
    return [...getGlobalTables(), ...getCharacterTables(), ...getChatTables()];
}

// ============================================
// 悬念簿（Agenda）存储 — 跟随当前对话
// ============================================

function getUserAgenda() {
    return agendaController.getUserAgenda();
}

function setUserAgenda(agenda) {
    return agendaController.setUserAgenda(agenda);
}

function getAllAgenda() {
    return agendaController.getAllAgenda();
}

function toggleAgendaDone(agendaItem, done) {
    return agendaController.toggleAgendaDone(agendaItem, done);
}

function deleteAgendaItem(agendaItem) {
    return agendaController.deleteAgendaItem(agendaItem);
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
    showToast(t('toast.tableExported'), 'success');
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
                throw new Error(t('ui.invalidTableData'));
            }

            const newTable = {
                id: Date.now().toString(),
                name: tableData.name || t('ui.importedTable'),
                rows: tableData.rows || 2,
                cols: tableData.cols || 2,
                data: tableData.data || {},
                prompt: tableData.prompt || ''
            };

            // 设置 baseData 为完整导入数据，防止 rebuildTableData 时丢失
            newTable.baseData = JSON.parse(JSON.stringify(newTable.data));
            newTable.baseRows = newTable.rows;
            newTable.baseCols = newTable.cols;

            // 清除同名表格的旧 AI 贡献记录，防止 rebuild 时旧数据回流
            const importName = (newTable.name || '').trim();
            if (importName) {
                const chat = horaeManager.getChat();
                if (chat?.length) {
                    for (let i = 0; i < chat.length; i++) {
                        const meta = chat[i]?.horae_meta;
                        if (meta?.tableContributions) {
                            meta.tableContributions = meta.tableContributions.filter(
                                tc => (tc.name || '').trim() !== importName
                            );
                            if (meta.tableContributions.length === 0) {
                                delete meta.tableContributions;
                            }
                        }
                    }
                }
            }

            const tables = getChatTables();
            tables.push(newTable);
            setChatTables(tables);

            renderCustomTablesList();
            showToast(t('toast.tableImported'), 'success');
        } catch (err) {
            showToast(t('toast.importFailed', { error: err.message }), 'error');
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
    if (locationEl) locationEl.textContent = state.scene?.location || t('status.noLocation');

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
            costumesEl.innerHTML = `<div class="horae-empty-hint">${t('status.noCostumes')}</div>`;
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
            itemsEl.innerHTML = `<div class="horae-empty-hint">${t('status.noItems')}</div>`;
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
    // 渲染前先确保所有 active 摘要在 events 中都有卡片（缺失就补回，不会 deactivate 摘要）
    try { cleanOrphanSummaries(); } catch (e) { console.warn('[Horae] projectSummaryCards before render failed:', e); }
    try { repairSummaryCompressedMarkers(); } catch (e) { console.warn('[Horae] repairSummaryCompressedMarkers before render failed:', e); }

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
        const filterText = filterLevel === 'all' ? '' : t('ui.filterLevelOf', { level: filterLevel });
        const searchText = searchKeyword ? t('ui.searchContaining', { keyword: searchKeyword }) : '';
        listEl.innerHTML = `
            <div class="horae-empty-state">
                <i class="fa-regular fa-clock"></i>
                <span>${t('ui.noFilteredEvents', { search: searchText, filter: filterText })}</span>
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
        msBtn.title = timelineMultiSelectMode ? t('ui.exitMultiSelect') : t('ui.multiSelectMode');
    }

    // 获取摘要映射（summaryId → entry），用于判定压缩状态
    const chat = horaeManager.getChat();
    const summaries = chat?.[0]?.horae_meta?.autoSummaries || [];
    const activeSummaryIds = new Set(summaries.filter(s => s?.id && s.active !== false).map(s => s.id));
    const renderSummaryLevelBadge = (summaryEntry) => {
        const depth = _normalizeSummaryDepth(summaryEntry?.depth);
        return `<span class="horae-level-badge summary">${t('timeline.summaryBadge')} L${depth}</span>`;
    };

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
            const summaryBadge = renderSummaryLevelBadge(summaryEntry);
            return `
            <div class="horae-timeline-item summary horae-summary-collapsed" data-message-id="${e.messageIndex}" data-summary-id="${summaryId}">
                <div class="horae-timeline-summary-icon"><i class="fa-solid fa-file-lines"></i></div>
                <div class="horae-timeline-content">
                    <div class="horae-timeline-summary">${summaryBadge}${t('timeline.summaryExpanded')}</div>
                    <div class="horae-timeline-meta">${rangeStr} · ${summaryEntry?.auto ? t('timeline.autoSummary') : t('timeline.manualSummary')}</div>
                </div>
                <div class="horae-summary-actions">
                    <button class="horae-summary-toggle-btn" data-summary-id="${summaryId}" title="${t('tooltip.toggleSummary')}">
                        <i class="fa-solid fa-compress"></i>
                    </button>
                    <button class="horae-summary-delete-btn" data-summary-id="${summaryId}" title="${t('tooltip.deleteSummary')}">
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
            (e.event?.level === '关键' || e.event?.level === '關鍵') ? 'critical' :
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
            const summaryDisplay = summaryContent || `<span class="horae-summary-hint">${t('tooltip.editSummary')}</span>`;
            const summaryEntry = summaryId ? summaries.find(s => s.id === summaryId) : null;
            const isActive = summaryEntry?.active;
            const rangeStr = summaryEntry ? `#${summaryEntry.range[0]}-#${summaryEntry.range[1]}` : '';
            const summaryBadge = renderSummaryLevelBadge(summaryEntry);
            // 有 summaryId 的摘要事件带切换/删除/编辑按钮
            const toggleBtns = summaryId ? `
                <div class="horae-summary-actions">
                    <button class="horae-summary-edit-btn" data-summary-id="${summaryId}" data-message-id="${e.messageIndex}" data-event-index="${e.eventIndex || 0}" title="${t('tooltip.editSummary')}">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="horae-summary-toggle-btn" data-summary-id="${summaryId}" title="${isActive ? t('tooltip.expandToOriginal') : t('tooltip.toggleSummary')}">
                        <i class="fa-solid ${isActive ? 'fa-expand' : 'fa-compress'}"></i>
                    </button>
                    <button class="horae-summary-delete-btn" data-summary-id="${summaryId}" title="${t('tooltip.deleteSummary')}">
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
                    <div class="horae-timeline-summary">${summaryBadge}${summaryDisplay}</div>
                    <div class="horae-timeline-meta">${rangeStr ? rangeStr + ' · ' : ''}${summaryEntry?.auto ? t('timeline.autoSummary') : ''} ${t('timeline.summaryBadge')} · #${e.messageIndex}</div>
                </div>
                ${toggleBtns}
                <button class="horae-item-edit-btn" data-edit-type="event" data-message-id="${e.messageIndex}" data-event-index="${e.eventIndex || 0}" title="${t('common.edit')}" style="${timelineMultiSelectMode ? 'display:none' : ''}${!summaryId ? '' : 'display:none'}">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
            `;
        }

        const restoreBtn = isRestoredFromCompress ? `
                <button class="horae-summary-toggle-btn horae-btn-inline-toggle" data-summary-id="${compressedBy}" title="${t('tooltip.toggleSummary')}">
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
                    <div class="horae-timeline-summary">${levelBadge}${e.event?.summary || t('ui.noRecorded')}</div>
                    <div class="horae-timeline-meta">${relTime} · ${t('ui.messageLabel', { id: e.messageIndex })}</div>
                </div>
                ${restoreBtn}
                <button class="horae-item-edit-btn" data-edit-type="event" data-message-id="${e.messageIndex}" data-event-index="${e.eventIndex || 0}" title="${t('common.edit')}" style="${timelineMultiSelectMode ? 'display:none' : ''}">
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
                if (_timelineLongPressFired) { _timelineLongPressFired = false; return; }
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
    listEl.querySelectorAll('.horae-summary-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openSummaryEditModal(btn.dataset.summaryId, parseInt(btn.dataset.messageId), parseInt(btn.dataset.eventIndex));
        });
    });

    bindEditButtons();
}

/** 批量隐藏/显示聊天消息楼层（调用酒馆原生 /hide /unhide） */
async function setMessagesHidden(chat, indices, hidden) {
    if (!indices?.length) return;

    // 预设内存状态：先写 is_hidden，防止竞态 saveChat 覆盖
    for (const idx of indices) {
        if (chat[idx]) chat[idx].is_hidden = hidden;
    }

    try {
        const exec = await getSlashCommandExecutor();
        const cmd = hidden ? '/hide' : '/unhide';
        const action = hidden ? 'hide' : 'unhide';
        const msgCounterKey = hidden ? 'hideMsgs' : 'unhideMsgs';
        const batchId = ++_hideUnhideDebugStats.batches;

        const validIndices = [...new Set(indices.filter(idx => Number.isInteger(idx) && idx >= 0 && !!chat[idx]))]
            .sort((a, b) => a - b);
        const ranges = [];
        if (validIndices.length > 0) {
            let start = validIndices[0];
            let prev = validIndices[0];
            for (let i = 1; i < validIndices.length; i++) {
                const cur = validIndices[i];
                if (cur === prev + 1) {
                    prev = cur;
                    continue;
                }
                ranges.push([start, prev]);
                start = cur;
                prev = cur;
            }
            ranges.push([start, prev]);
        }

        console.log(`[Horae][Debug] /${action} batch#${batchId} start, indices=${indices.length}, valid=${validIndices.length}, ranges=${ranges.length}`);
        for (let i = 0; i < ranges.length; i++) {
            const [start, end] = ranges[i];
            const rangeArg = start === end ? `${start}` : `${start}-${end}`;
            const covered = end - start + 1;
            try {
                _hideUnhideDebugStats[action]++;
                _hideUnhideDebugStats[msgCounterKey] += covered;
                console.log(`[Horae][Debug] /${action} call#${_hideUnhideDebugStats[action]} (batch#${batchId} ${i + 1}/${ranges.length}) range=${rangeArg} covers=${covered}`);
                await exec(`${cmd} ${rangeArg}`);
            } catch (cmdErr) {
                console.warn(`[Horae] ${cmd} ${rangeArg} 失败:`, cmdErr);
            }
        }
        console.log(`[Horae][Debug] batch#${batchId} done, total /hide=${_hideUnhideDebugStats.hide} (msgs=${_hideUnhideDebugStats.hideMsgs}), total /unhide=${_hideUnhideDebugStats.unhide} (msgs=${_hideUnhideDebugStats.unhideMsgs})`);
    } catch (e) {
        console.warn('[Horae] 无法加载酒馆命令模块，回退到手动设置:', e);
    }

    // 后验证 + DOM 同步 + 强制 save（不依赖 /hide 是否成功）
    for (const idx of indices) {
        if (!chat[idx]) continue;
        chat[idx].is_hidden = hidden;
        const $el = $(`.mes[mesid="${idx}"]`);
        if (hidden) $el.attr('is_hidden', 'true');
        else $el.removeAttr('is_hidden');
    }
    await getContext().saveChat();
}

/** 归一化摘要层级：缺失/非法一律回落到 1 */
function _normalizeSummaryDepth(depth) {
    const n = parseInt(depth, 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.floor(n);
}

/** 从摘要条目中取回所有关联的消息索引 */
function getSummaryMsgIndices(entry) {
    if (!entry) return [];
    if (Array.isArray(entry.coveredIndices) && entry.coveredIndices.length) {
        const set = new Set(entry.coveredIndices);
        for (const e of (entry.originalEvents || [])) set.add(e.msgIdx);
        return [...set];
    }
    const fromEvents = (entry.originalEvents || []).map(e => e.msgIdx);
    if (entry.range) {
        for (let i = entry.range[0]; i <= entry.range[1]; i++) fromEvents.push(i);
    }
    return [...new Set(fromEvents)];
}

function _pickPreferredSummaryOwner(prev, next) {
    if (!prev) return next;
    if (!next) return prev;
    if ((next.depth || 1) !== (prev.depth || 1)) {
        return (next.depth || 1) > (prev.depth || 1) ? next : prev;
    }
    return (next.span || Number.MAX_SAFE_INTEGER) < (prev.span || Number.MAX_SAFE_INTEGER) ? next : prev;
}

async function _removeSummaryAndRestoreHierarchy(chat, summaryId) {
    if (!chat?.length || !summaryId) return { removedEntry: null, restoredChildren: [] };
    const firstMeta = chat?.[0]?.horae_meta;

    let removedEntry = null;
    if (Array.isArray(firstMeta?.autoSummaries)) {
        const idx = firstMeta.autoSummaries.findIndex(s => s?.id === summaryId);
        if (idx !== -1) {
            removedEntry = firstMeta.autoSummaries.splice(idx, 1)[0];
        }
    }

    const restoredChildren = [];
    if (removedEntry && Array.isArray(removedEntry.mergedSummaries) && removedEntry.mergedSummaries.length && Array.isArray(firstMeta?.autoSummaries)) {
        const existingIds = new Set(firstMeta.autoSummaries.filter(s => s?.id).map(s => s.id));
        for (const child of removedEntry.mergedSummaries) {
            if (!child?.id || existingIds.has(child.id)) continue;
            firstMeta.autoSummaries.push(child);
            existingIds.add(child.id);
            restoredChildren.push(child);
        }
    }

    const childOwnerByMsg = new Map();
    for (const child of restoredChildren) {
        const childId = child?.id;
        if (!childId) continue;
        const depth = _normalizeSummaryDepth(child?.depth);
        const childRange = _getSummaryEntryRange(child);
        const span = childRange ? Math.max(1, childRange[1] - childRange[0] + 1) : Number.MAX_SAFE_INTEGER;
        const owner = { id: childId, depth, span };
        for (const idx of getSummaryMsgIndices(child)) {
            if (!Number.isInteger(idx)) continue;
            const prev = childOwnerByMsg.get(idx);
            childOwnerByMsg.set(idx, _pickPreferredSummaryOwner(prev, owner));
        }
    }

    for (let i = 0; i < chat.length; i++) {
        const meta = chat[i]?.horae_meta;
        if (!Array.isArray(meta?.events)) continue;

        meta.events = meta.events.filter(evt => evt?._summaryId !== summaryId);

        const msgOwner = childOwnerByMsg.get(i);
        for (const evt of meta.events) {
            if (!evt || evt._compressedBy !== summaryId) continue;
            if (msgOwner?.id) evt._compressedBy = msgOwner.id;
            else delete evt._compressedBy;
        }
    }

    if (restoredChildren.length > 0) {
        cleanOrphanSummaries();
    }

    if (removedEntry) {
        const affected = new Set(
            getSummaryMsgIndices(removedEntry).filter(i => Number.isInteger(i) && i >= 0 && !!chat[i])
        );

        if (affected.size > 0) {
            const shouldHide = new Set();
            const activeSummaries = (firstMeta?.autoSummaries || []).filter(s => s?.id && s.active !== false);
            for (const s of activeSummaries) {
                for (const idx of getSummaryMsgIndices(s)) {
                    if (affected.has(idx)) shouldHide.add(idx);
                }
            }

            const toHide = [];
            const toShow = [];
            for (const idx of affected) {
                if (shouldHide.has(idx)) toHide.push(idx);
                else toShow.push(idx);
            }
            if (toShow.length > 0) await setMessagesHidden(chat, toShow, false);
            if (toHide.length > 0) await setMessagesHidden(chat, toHide, true);
        }
    }

    return { removedEntry, restoredChildren };
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
    if (!confirm(t('confirm.deleteSummary'))) return;

    const chat = horaeManager.getChat();
    await _removeSummaryAndRestoreHierarchy(chat, summaryId);

    await getContext().saveChat();
    updateTimelineDisplay();
    showToast(t('toast.saveSuccess'), 'success');
}

/** 打开摘要编辑弹窗，允许用户手动修改摘要内容 */
function openSummaryEditModal(summaryId, messageId, eventIndex) {
    closeEditModal();
    const chat = horaeManager.getChat();
    const firstMeta = chat?.[0]?.horae_meta;
    const summaryEntry = firstMeta?.autoSummaries?.find(s => s.id === summaryId);
    const meta = chat[messageId]?.horae_meta;
    const evtsArr = meta?.events || [];
    const evt = evtsArr[eventIndex];
    if (!evt) { showToast(t('toast.summaryNotFound'), 'error'); return; }
    // 优先读 autoSummaries.summaryText（持久化的真源），回退到 events 卡片上的 summary
    const currentText = (summaryEntry && typeof summaryEntry.summaryText === 'string' && summaryEntry.summaryText)
        ? summaryEntry.summaryText
        : (evt.summary || '');

    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal${isLightMode() ? ' horae-light' : ''}">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-pen"></i> ${t('ui.editSummary')}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('ui.summaryContent')}</label>
                        <textarea id="horae-summary-edit-text" rows="10" style="width:100%;min-height:180px;font-size:13px;line-height:1.6;">${escapeHtml(currentText)}</textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="horae-summary-edit-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.save')}
                    </button>
                    <button id="horae-summary-edit-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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

    document.getElementById('horae-summary-edit-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        const newText = document.getElementById('horae-summary-edit-text').value.trim();
        if (!newText) { showToast(t('toast.summaryEmpty'), 'warning'); return; }
        // autoSummaries.summaryText 是真源，永远写入；events 卡片是投影，存在则同步
        if (summaryEntry) summaryEntry.summaryText = newText;
        evt.summary = newText;
        if (typeof messageId === 'number' && messageId > 0) {
            try { injectHoraeTagToMessage(messageId, meta); } catch (e2) { /* ignore */ }
        }
        await getContext().saveChat();
        closeEditModal();
        updateTimelineDisplay();
        showToast(t('toast.saveSuccess'), 'success');
    });

    document.getElementById('horae-summary-edit-cancel').addEventListener('click', () => closeEditModal());
}

function updateAgendaDisplay() {
    return agendaController.updateAgendaDisplay();
}

function exitAgendaMultiSelect() {
    return agendaController.exitAgendaMultiSelect();
}

function selectAllAgenda() {
    return agendaController.selectAllAgenda();
}

async function deleteSelectedAgenda() {
    return agendaController.deleteSelectedAgenda();
}

// ============================================
// 时间线多选模式 & 长按插入菜单
// ============================================

/** 时间线长按开始（弹出插入菜单） */
let _timelineLongPressFired = false;
function startTimelineLongPress(e, eventKey) {
    if (timelineMultiSelectMode) return;
    _timelineLongPressFired = false;
    timelineLongPressTimer = setTimeout(() => {
        _timelineLongPressFired = true;
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
            <i class="fa-solid fa-arrow-up"></i> ${t('ui.contextInsertEventAbove')}
        </div>
        <div class="horae-context-item" data-action="insert-event-below">
            <i class="fa-solid fa-arrow-down"></i> ${t('ui.contextInsertEventBelow')}
        </div>
        <div class="horae-context-separator"></div>
        <div class="horae-context-item" data-action="insert-summary-above">
            <i class="fa-solid fa-file-lines"></i> ${t('ui.contextInsertSummaryAbove')}
        </div>
        <div class="horae-context-item" data-action="insert-summary-below">
            <i class="fa-solid fa-file-lines"></i> ${t('ui.contextInsertSummaryBelow')}
        </div>
        <div class="horae-context-separator"></div>
        <div class="horae-context-item danger" data-action="delete">
            <i class="fa-solid fa-trash-can"></i> ${t('ui.contextDeleteEvent')}
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
        if (!confirm(t('confirm.deleteTimeline', { n: 1 }))) return;
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta) return;
        if (meta.events && evtIdx < meta.events.length) {
            meta.events.splice(evtIdx, 1);
        } else if (meta.event && evtIdx === 0) {
            delete meta.event;
        }
        await getContext().saveChat();
        showToast(t('toast.saveSuccess'), 'success');
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
                    <i class="fa-solid fa-timeline"></i> ${t('modal.insertEvent')}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('label.date')}</label>
                        <input type="text" id="insert-event-date" value="${currentDate}" placeholder="2026/2/14">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.time')}</label>
                        <input type="text" id="insert-event-time" value="${currentTime}" placeholder="15:00">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.eventLevel')}</label>
                        <select id="insert-event-level" class="horae-select">
                            <option value="一般">${t('levels.normal')}</option>
                            <option value="重要">${t('levels.important')}</option>
                            <option value="关键">${t('levels.critical')}</option>
                        </select>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.eventSummary')}</label>
                        <textarea id="insert-event-summary" rows="3" placeholder="${t('placeholder.eventSummary')}"></textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.add')}
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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

        if (!summary) { showToast(t('toast.enterSummary'), 'warning'); return; }

        const newEvent = {
            is_important: level === '重要' || level === '关键' || level === '關鍵',
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
        showToast(t('toast.saveSuccess'), 'success');
    });

    document.getElementById('edit-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        closeEditModal();
    });
}

/** 打开插入摘要弹窗 */
function openTimelineSummaryModal(refMsgIdx, refEvtIdx, isAbove) {
    const chat = horaeManager.getChat();
    const chatLen = chat?.length || 0;
    const defaultFrom = Math.max(0, refMsgIdx - 10);
    const defaultTo = refMsgIdx;
    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-file-lines"></i> ${t('modal.insertSummary')}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('label.summaryContent')}</label>
                        <textarea id="insert-summary-text" rows="5" placeholder="${t('ui.insertSummaryPlaceholder')}"></textarea>
                    </div>
                    <div class="horae-edit-field" style="margin-top:8px;">
                        <label>${t('label.summaryRange')}</label>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <span>#</span>
                            <input type="number" id="insert-summary-from" min="0" max="${chatLen - 1}" value="${defaultFrom}" style="width:70px;" class="horae-input" />
                            <span>~</span>
                            <span>#</span>
                            <input type="number" id="insert-summary-to" min="0" max="${chatLen - 1}" value="${defaultTo}" style="width:70px;" class="horae-input" />
                            <span style="opacity:0.6;font-size:0.85em;">(${t('label.summaryRangeHint')})</span>
                        </div>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('modal.insertSummary')}
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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
        if (!summaryText) { showToast(t('toast.enterContent'), 'warning'); return; }

        const rangeFrom = parseInt(document.getElementById('insert-summary-from').value) || 0;
        const rangeTo = parseInt(document.getElementById('insert-summary-to').value) || refMsgIdx;
        const rMin = Math.max(0, Math.min(rangeFrom, rangeTo));
        const rMax = Math.min(chatLen - 1, Math.max(rangeFrom, rangeTo));

        const summaryId = `ms_${Date.now()}`;
        const newEvent = {
            is_important: true,
            level: '摘要',
            summary: summaryText,
            isSummary: true,
            _summaryId: summaryId
        };

        if (!chat?.length) { closeEditModal(); return; }
        const meta = chat[refMsgIdx]?.horae_meta;
        if (!meta) { closeEditModal(); return; }
        if (!meta.events) meta.events = [];

        const insertIdx = isAbove ? refEvtIdx + 1 : refEvtIdx;
        meta.events.splice(insertIdx, 0, newEvent);

        // 在 chat[0] 登记范围，让自动摘要跳过这些楼层
        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.autoSummaries) firstMsg.horae_meta.autoSummaries = [];
        firstMsg.horae_meta.autoSummaries.push({
            id: summaryId,
            range: [rMin, rMax],
            summaryText,
            originalEvents: [],
            depth: 1,
            active: true,
            createdAt: new Date().toISOString(),
            auto: false,
            manual: true
        });

        await getContext().saveChat();
        closeEditModal();
        updateTimelineDisplay();
        updateStatusDisplay();
        showToast(t('toast.saveSuccess'), 'success');
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
    showToast(t('toast.agendaMultiSelect'), 'info');
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
        modal.className = 'horae-modal' + (isLightMode() ? ' horae-light' : '');
        modal.innerHTML = `
            <div class="horae-modal-content" style="max-width: 420px;">
                <div class="horae-modal-header"><span>${t('ui.compressMode')}</span></div>
                <div class="horae-modal-body" style="padding: 16px;">
                    <p style="margin: 0 0 12px; color: var(--horae-text-muted); font-size: 13px;">
                        ${t('ui.selectedEventsInfo', { n: eventCount, from: msgRange[0], to: msgRange[1] })}
                    </p>
                    <label style="display: flex; align-items: flex-start; gap: 8px; padding: 10px; border: 1px solid var(--horae-border); border-radius: 6px; cursor: pointer; margin-bottom: 8px;">
                        <input type="radio" name="horae-compress-mode" value="event" checked style="margin-top: 3px;">
                        <div>
                            <div style="font-size: 13px; color: var(--horae-text); font-weight: 500;">${t('ui.eventCompress')}</div>
                            <div style="font-size: 11px; color: var(--horae-text-muted); margin-top: 2px;">${t('ui.eventCompressDesc')}</div>
                        </div>
                    </label>
                    <label style="display: flex; align-items: flex-start; gap: 8px; padding: 10px; border: 1px solid var(--horae-border); border-radius: 6px; cursor: pointer;">
                        <input type="radio" name="horae-compress-mode" value="fulltext" style="margin-top: 3px;">
                        <div>
                            <div style="font-size: 13px; color: var(--horae-text); font-weight: 500;">${t('ui.fulltextSummary')}</div>
                            <div style="font-size: 11px; color: var(--horae-text-muted); margin-top: 2px;">${t('ui.fulltextSummaryDesc')}</div>
                        </div>
                    </label>
                </div>
                <div class="horae-modal-footer">
                    <button class="horae-btn" id="horae-compress-cancel">${t('common.cancel')}</button>
                    <button class="horae-btn primary" id="horae-compress-confirm">${t('common.continue')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        preventModalBubble(modal);
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
        showToast(t('toast.insufficientEvents'), 'warning');
        return;
    }

    const chat = horaeManager.getChat();
    const _allSummaries = chat[0]?.horae_meta?.autoSummaries || [];
    const events = [];
    const _selectedSummaryIds = new Set();
    for (const key of selectedTimelineEvents) {
        const [msgIdx, evtIdx] = key.split('-').map(Number);
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta) continue;
        const evtsArr = meta.events || (meta.event ? [meta.event] : []);
        const evt = evtsArr[evtIdx];
        if (!evt) continue;
        if (evt._carryoverSeed) continue;
        const date = meta.timestamp?.story_date || '?';
        const time = meta.timestamp?.story_time || '';
        const isSummary = evt.isSummary || evt.level === '摘要';
        // _summaryId 缺失时通过 msgIdx + summaryText 反查（兼容旧版数据丢字段的场景）
        let _summaryId = evt._summaryId || null;
        if (isSummary && !_summaryId) {
            const sig = (evt.summary || '').slice(0, 40);
            const matched = _allSummaries.find(s => {
                const inRange = s.range && msgIdx >= s.range[0] && msgIdx <= s.range[1];
                if (!inRange) return false;
                if (!sig) return true;
                return s.summaryText === evt.summary
                    || (s.summaryText || '').slice(0, 40) === sig;
            });
            if (matched) _summaryId = matched.id;
        }
        if (isSummary && _summaryId) _selectedSummaryIds.add(_summaryId);
        events.push({
            key, msgIdx, evtIdx,
            date, time,
            level: evt.level || '一般',
            summary: evt.summary || '',
            isSummary,
            _summaryId
        });
    }

    if (events.length < 2) {
        showToast(t('toast.insufficientEvents'), 'warning');
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
    window.fetch = function (input, init = {}) {
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
    overlay.className = 'horae-progress-overlay' + (isLightMode() ? ' horae-light' : '');
    overlay.innerHTML = `
        <div class="horae-progress-container">
            <div class="horae-progress-title">${t('ui.aiCompressing')}</div>
            <div class="horae-progress-bar"><div class="horae-progress-fill" style="width: 50%"></div></div>
            <div class="horae-progress-text">${mode === 'fulltext' ? t('ui.generatingFulltextSummary') : t('ui.generatingSummary')}</div>
            <button class="horae-progress-cancel"><i class="fa-solid fa-xmark"></i> ${t('ui.cancelCompress')}</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.horae-progress-cancel').addEventListener('click', () => {
        if (cancelled) return;
        if (!confirm(t('confirm.compressCancel'))) return;
        cancelled = true;
        fetchAbort.abort();
        try { getContext().stopGeneration(); } catch (_) { }
        cancelResolve();
        overlay.remove();
        window.fetch = _origFetch;
        showToast(t('toast.scanCancelled'), 'info');
    });

    try {
        const context = getContext();
        const userName = context?.name1 || t('ui.protagonist');
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
            const genPromise = generateForSummary(prompt, { taskType: 'manualSummary' });
            response = await Promise.race([genPromise, cancelPromise]);
        } finally {
            _isSummaryGeneration = false;
            window.fetch = _origFetch;
        }

        if (cancelled) return;

        if (!response || !response.trim()) {
            overlay.remove();
            showToast(t('toast.aiNoValidSummary'), 'warning');
            return;
        }

        const cleanedText = response.trim()
            .replace(/<think(?:ing)?[\s>][\s\S]*?<\/think(?:ing)?>/gi, '')
            .replace(/<horae>[\s\S]*?<\/horae>/gi, '')
            .replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, '')
            .replace(/<!--horae[\s\S]*?-->/gi, '')
            .trim();
        const hasOpenSummaryTag = /<horaesummary>/i.test(cleanedText);
        const hasCloseSummaryTag = /<\/horaesummary>/i.test(cleanedText);
        if (hasOpenSummaryTag && !hasCloseSummaryTag) {
            overlay.remove();
            showToast('总结失败：AI回复截断', 'warning');
            return;
        }
        if (!hasOpenSummaryTag && !hasCloseSummaryTag) {
            overlay.remove();
            showToast('总结失败：AI回复掉格式', 'warning');
            return;
        }
        if (!hasOpenSummaryTag || !hasCloseSummaryTag) {
            overlay.remove();
            showToast('总结失败：AI回复掉格式', 'warning');
            return;
        }
        const summaryMatch = cleanedText.match(/<horaesummary>([\s\S]*?)<\/horaesummary>/i);
        let summaryText = (summaryMatch?.[1] || '').trim();
        if (!summaryText) {
            overlay.remove();
            showToast(t('toast.aiSummaryEmpty'), 'warning');
            return;
        }

        // 非破坏性压缩：将原始事件和摘要存入 autoSummaries
        const firstMsg = chat[0];
        if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
        if (!firstMsg.horae_meta.autoSummaries) firstMsg.horae_meta.autoSummaries = [];

        // 计算合并范围：旧摘要按其原 range 取并集，普通事件按 msgIdx
        let rangeMin = Infinity, rangeMax = -Infinity;
        for (const e of events) {
            if (e.isSummary && e._summaryId) {
                const oldEntry = _allSummaries.find(s => s.id === e._summaryId);
                if (oldEntry?.range && Array.isArray(oldEntry.range) && oldEntry.range.length >= 2) {
                    rangeMin = Math.min(rangeMin, oldEntry.range[0]);
                    rangeMax = Math.max(rangeMax, oldEntry.range[1]);
                    continue;
                }
            }
            rangeMin = Math.min(rangeMin, e.msgIdx);
            rangeMax = Math.max(rangeMax, e.msgIdx);
        }
        if (!isFinite(rangeMin) || !isFinite(rangeMax)) {
            rangeMin = events[0].msgIdx;
            rangeMax = events[events.length - 1].msgIdx;
        }

        // 继承被合并摘要的 originalEvents，便于后续删除时还原
        const ownOriginal = events
            .filter(e => !e.isSummary)
            .map(e => ({
                msgIdx: e.msgIdx,
                evtIdx: e.evtIdx,
                event: { ...chat[e.msgIdx]?.horae_meta?.events?.[e.evtIdx] },
                timestamp: chat[e.msgIdx]?.horae_meta?.timestamp
            }));
        const inheritedOriginal = [];
        for (const sid of _selectedSummaryIds) {
            const old = _allSummaries.find(s => s.id === sid);
            if (old?.originalEvents?.length) inheritedOriginal.push(...old.originalEvents);
        }
        const originalEvents = [...inheritedOriginal, ...ownOriginal];

        const summaryId = `cs_${Date.now()}`;
        const coveredIndices = [];
        for (let i = rangeMin; i <= rangeMax; i++) coveredIndices.push(i);
        let nextDepth = 1;
        if (_selectedSummaryIds.size > 0) {
            let maxDepth = 1;
            for (const sid of _selectedSummaryIds) {
                const old = _allSummaries.find(s => s.id === sid);
                maxDepth = Math.max(maxDepth, _normalizeSummaryDepth(old?.depth));
            }
            nextDepth = maxDepth + 1;
        }
        const summaryEntry = {
            id: summaryId,
            range: [rangeMin, rangeMax],
            coveredIndices,
            summaryText,
            originalEvents,
            depth: nextDepth,
            active: true,
            createdAt: new Date().toISOString(),
            auto: false
        };
        // 剔除被合并的旧 entry，避免重叠
        const mergedSummaries = [];
        if (_selectedSummaryIds.size > 0) {
            const retained = [];
            for (const s of firstMsg.horae_meta.autoSummaries) {
                if (s?.id && _selectedSummaryIds.has(s.id)) mergedSummaries.push(s);
                else retained.push(s);
            }
            firstMsg.horae_meta.autoSummaries = retained;
        }
        if (mergedSummaries.length > 0) summaryEntry.mergedSummaries = mergedSummaries;
        firstMsg.horae_meta.autoSummaries.push(summaryEntry);

        // 标记原始事件为已压缩，并清掉旧摘要卡片
        const compressedMsgIndices = [];
        for (let i = rangeMin; i <= rangeMax; i++) compressedMsgIndices.push(i);
        for (const msgIdx of compressedMsgIndices) {
            const meta = chat[msgIdx]?.horae_meta;
            if (!meta) continue;
            if (meta.event && !meta.events) {
                meta.events = [meta.event];
                delete meta.event;
            }
            if (!meta.events) continue;
            if (_selectedSummaryIds.size > 0) {
                meta.events = meta.events.filter(ev =>
                    !(ev?.isSummary && ev?._summaryId && _selectedSummaryIds.has(ev._summaryId))
                );
            }
            for (let j = 0; j < meta.events.length; j++) {
                if (meta.events[j] && !meta.events[j].isSummary) {
                    meta.events[j]._compressedBy = summaryId;
                }
            }
        }

        // 在 range 起点插入新摘要卡片
        const firstMeta = chat[rangeMin]?.horae_meta;
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

        // 隐藏范围内所有楼层（包括中间的 USER 消息）
        const hideIndices = [];
        for (let i = rangeMin; i <= rangeMax; i++) hideIndices.push(i);
        await setMessagesHidden(chat, hideIndices, true);

        await context.saveChat();
        overlay.remove();
        exitTimelineMultiSelect();
        updateTimelineDisplay();
        updateStatusDisplay();
        showToast(t('toast.eventsCompressed', { n: events.length }), 'success');
    } catch (err) {
        window.fetch = _origFetch;
        overlay.remove();
        if (cancelled || err?.name === 'AbortError') return;
        console.error('[Horae] 压缩失败:', err);
        showToast(t('toast.compressFailed', { error: err.message || 'unknown' }), 'error');
    }
}

/** 删除选中的时间线事件 */
async function deleteSelectedTimelineEvents() {
    if (selectedTimelineEvents.size === 0) {
        showToast(t('toast.insufficientEvents'), 'warning');
        return;
    }

    const confirmed = confirm(t('confirm.deleteTimeline', { n: selectedTimelineEvents.size }));
    if (!confirmed) return;

    const chat = horaeManager.getChat();

    // 按消息分组，倒序删除事件索引
    const msgMap = new Map();
    for (const key of selectedTimelineEvents) {
        const [msgIdx, evtIdx] = key.split('-').map(Number);
        if (!msgMap.has(msgIdx)) msgMap.set(msgIdx, []);
        msgMap.get(msgIdx).push(evtIdx);
    }

    // 收集被删除的摘要事件的 summaryId，用于级联清理
    const deletedSummaryIds = new Set();
    for (const [msgIdx, evtIndices] of msgMap) {
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta?.events) continue;
        for (const ei of evtIndices) {
            const evt = meta.events[ei];
            if (evt?._summaryId) deletedSummaryIds.add(evt._summaryId);
        }
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

    // 级联清理：删除摘要事件时同步清理并回退到子摘要层（如有）
    if (deletedSummaryIds.size > 0) {
        for (const summaryId of deletedSummaryIds) {
            await _removeSummaryAndRestoreHierarchy(chat, summaryId);
        }
    }

    await getContext().saveChat();
    showToast(t('toast.saveSuccess'), 'success');
    exitTimelineMultiSelect();
    updateTimelineDisplay();
    updateStatusDisplay();
}

function openAgendaEditModal(agendaItem = null) {
    return agendaController.openAgendaEditModal(agendaItem);
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
            presentEl.innerHTML = `<div class="horae-empty-hint">${t('characters.noRecords')}</div>`;
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
            affectionEl.innerHTML = `<div class="horae-empty-hint">${t('characters.noAffection')}</div>`;
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
                        <button class="horae-item-edit-btn horae-affection-edit-btn" data-edit-type="affection" data-char="${key}" title="${t('tooltip.editAffection')}">
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
            npcEl.innerHTML = `<div class="horae-empty-hint">${t('characters.noNpc')}</div>`;
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
                    descHtml = `<span class="horae-npc-legacy">${t('ui.noDescription')}</span>`;
                }

                // 扩展信息行（年龄/种族/职业）
                const extraTags = [];
                if (info.race) extraTags.push(info.race);
                if (info.age) {
                    const ageResult = horaeManager.calcCurrentAge(info, state.timestamp?.story_date);
                    if (ageResult.changed) {
                        extraTags.push(`<span class="horae-age-calc" title="${t('ui.ageCalcTitle', { original: ageResult.original })}">${ageResult.display}${t('ui.ageSuffix')}</span>`);
                    } else {
                        extraTags.push(info.age);
                    }
                }
                if (info.job) extraTags.push(info.job);
                if (extraTags.length > 0) {
                    descHtml += `<span class="horae-npc-extras">${extraTags.join(' · ')}</span>`;
                }
                if (info.birthday) {
                    descHtml += `<span class="horae-npc-birthday"><i class="fa-solid fa-cake-candles"></i>${info.birthday}</span>`;
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

                const isSelected = selectedNpcs.has(name);
                const selectedClass = isSelected ? 'selected' : '';
                const checkboxDisplay = npcMultiSelectMode ? 'flex' : 'none';
                return `
                    <div class="horae-npc-item horae-editable-item ${starClass} ${mainClass} ${selectedClass}" data-npc-name="${name}" data-npc-gender="${info.gender || ''}">
                        <div class="horae-npc-header">
                            <div class="horae-npc-select-cb" style="display:${checkboxDisplay};align-items:center;margin-right:6px;">
                                <input type="checkbox" ${isSelected ? 'checked' : ''}>
                            </div>
                            <div class="horae-npc-name"><i class="${genderIcon} ${genderClass}"></i> ${name}</div>
                            <div class="horae-npc-actions">
                                <button class="horae-item-edit-btn" data-edit-type="npc" data-edit-name="${name}" title="${t('common.edit')}" style="opacity:1;position:static;">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button class="horae-npc-star" title="${t('tooltip.starToggle')}">
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
                    <button class="horae-gender-btn active" data-filter="all" title="${t('characters.genderAll')}">${t('characters.genderAll')}</button>
                    <button class="horae-gender-btn" data-filter="male" title="${t('characters.genderMale')}"><i class="fa-solid fa-person"></i></button>
                    <button class="horae-gender-btn" data-filter="female" title="${t('characters.genderFemale')}"><i class="fa-solid fa-person-dress"></i></button>
                    <button class="horae-gender-btn" data-filter="other" title="${t('characters.genderOther')}"><i class="fa-solid fa-user"></i></button>
                </div>
            `;

            // 角色卡角色区域（置顶）
            if (mainCharEntries.length > 0) {
                html += '<div class="horae-npc-section main-character-section">';
                html += `<div class="horae-npc-section-title"><i class="fa-solid fa-crown"></i> ${t('ui.mainCharacters')}</div>`;
                html += mainCharEntries.map(([name, info]) => renderNpc(name, info, false, true)).join('');
                html += '</div>';
            }

            // 星标NPC区域
            if (favoriteEntries.length > 0) {
                if (mainCharEntries.length > 0) {
                    html += '<div class="horae-npc-section-divider"></div>';
                }
                html += '<div class="horae-npc-section favorite-section">';
                html += `<div class="horae-npc-section-title"><i class="fa-solid fa-star"></i> ${t('ui.starredNpcs')}</div>`;
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
                    html += `<div class="horae-npc-section-title">${t('ui.otherNpcs')}</div>`;
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

            // NPC 多选点击
            npcEl.querySelectorAll('.horae-npc-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!npcMultiSelectMode) return;
                    if (e.target.closest('.horae-item-edit-btn') || e.target.closest('.horae-npc-star')) return;
                    const name = item.dataset.npcName;
                    if (name) toggleNpcSelection(name);
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
        listEl.innerHTML = `<div class="horae-empty-hint">${t('characters.noRelationships')}</div>`;
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
                <button class="horae-rel-edit" title="${t('common.edit')}"><i class="fa-solid fa-pen"></i></button>
                <button class="horae-rel-delete" title="${t('common.delete')}"><i class="fa-solid fa-trash"></i></button>
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
            if (!confirm(t('confirm.deleteNpc', { name: `${rel.from} → ${rel.to}` }))) return;
            rels.splice(idx, 1);
            horaeManager.setRelationships(rels);
            // 同步清理各消息中的同方向关系数据，防止 rebuildRelationships 复活
            const chat = horaeManager.getChat();
            for (let i = 1; i < chat.length; i++) {
                const meta = chat[i]?.horae_meta;
                if (!meta?.relationships?.length) continue;
                const before = meta.relationships.length;
                meta.relationships = meta.relationships.filter(r => !(r.from === rel.from && r.to === rel.to));
                if (meta.relationships.length !== before) {
                    injectHoraeTagToMessage(i, meta);
                }
            }
            await getContext().saveChat();
            updateRelationshipDisplay();
            showToast(t('toast.saveSuccess'), 'info');
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
                    <i class="fa-solid fa-diagram-project"></i> ${isEdit ? t('modal.addRelationship') : t('modal.addRelationship')}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('placeholder.relFrom')}</label>
                        <input type="text" id="horae-rel-from" value="${escapeHtml(existing.from)}" placeholder="${t('placeholder.relFrom')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('placeholder.relTo')}</label>
                        <input type="text" id="horae-rel-to" value="${escapeHtml(existing.to)}" placeholder="${t('placeholder.relTo')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('placeholder.relType')}</label>
                        <input type="text" id="horae-rel-type" value="${escapeHtml(existing.type)}" placeholder="${t('placeholder.relType')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('placeholder.relNote')}</label>
                        <input type="text" id="horae-rel-note" value="${escapeHtml(existing.note || '')}" placeholder="${t('placeholder.relNote')}">
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="horae-rel-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.save')}
                    </button>
                    <button id="horae-rel-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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
            showToast(t('toast.relFieldsRequired'), 'warning');
            return;
        }

        if (isEdit) {
            const oldRel = rels[editIndex];
            rels[editIndex] = { from, to, type, note, _userEdited: true };
            // 同步更新各消息中的关系数据，防止 rebuildRelationships 复原旧值
            const chat = horaeManager.getChat();
            for (let i = 1; i < chat.length; i++) {
                const meta = chat[i]?.horae_meta;
                if (!meta?.relationships?.length) continue;
                let changed = false;
                for (let ri = 0; ri < meta.relationships.length; ri++) {
                    const r = meta.relationships[ri];
                    if (r.from === oldRel.from && r.to === oldRel.to) {
                        meta.relationships[ri] = { from, to, type, note };
                        changed = true;
                    }
                }
                if (changed) injectHoraeTagToMessage(i, meta);
            }
        } else {
            rels.push({ from, to, type, note });
        }

        horaeManager.setRelationships(rels);
        await getContext().saveChat();
        updateRelationshipDisplay();
        closeEditModal();
        showToast(t('toast.saveSuccess'), 'success');
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
        showToast(t('toast.starRemoved', { name: npcName }), 'info');
    } else {
        settings.favoriteNpcs.push(npcName);
        showToast(t('toast.starAdded', { name: npcName }), 'success');
    }

    saveSettings();
    updateCharactersDisplay();
}

/**
 * 比较物品名时忽略前导 emoji 和数量后缀，兼容“豆包(3个)”这类变体
 */
function getComparableItemName(name) {
    return getItemBaseName(String(name || '').replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, '').trim()).toLowerCase();
}

function isSameItemNameVariant(a, b) {
    const left = String(a || '').trim();
    const right = String(b || '').trim();
    if (!left || !right) return false;
    const leftBase = getComparableItemName(left);
    const rightBase = getComparableItemName(right);
    return left.toLowerCase() === right.toLowerCase() || (!!leftBase && leftBase === rightBase);
}

function resolveLatestItemEntry(itemName, state = horaeManager.getLatestState()) {
    const items = state?.items || {};
    if (Object.prototype.hasOwnProperty.call(items, itemName)) {
        return { name: itemName, info: items[itemName] };
    }
    const matchName = Object.keys(items).find(name => isSameItemNameVariant(name, itemName));
    return matchName ? { name: matchName, info: items[matchName] } : null;
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

    const multiSelectBtn = document.getElementById('horae-btn-items-multiselect');
    if (multiSelectBtn) {
        multiSelectBtn.classList.toggle('active', itemsMultiSelectMode);
        multiSelectBtn.title = itemsMultiSelectMode ? t('ui.exitMultiSelect') : t('ui.multiSelectMode');
    }

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
        const holderOptions = [`<option value="all">${t('ui.allHolders')}</option>`];
        holders.forEach(holder => {
            const holderHtml = escapeHtml(holder);
            holderOptions.push(`<option value="${holderHtml}" ${holder === currentHolder ? 'selected' : ''}>${holderHtml}</option>`);
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
        let emptyMsg = t('items.noItems');
        if (filterValue !== 'all' || holderFilter !== 'all' || searchQuery) {
            emptyMsg = t('ui.noFilteredItems');
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
        const nameHtml = escapeHtml(name);
        const iconHtml = escapeHtml(icon);
        const importance = info.importance || '';
        const isCritical = importance === '!!' || importance === '关键' || importance === '關鍵' || importance === 'critical';
        const isImportant = importance === '!' || importance === '重要' || importance === 'important';
        const importanceClass = isCritical ? 'critical' : isImportant ? 'important' : 'normal';
        const importanceLabel = isCritical ? t('levels.critical') : isImportant ? t('levels.important') : '';
        const importanceBadge = importanceLabel ? `<span class="horae-item-importance ${importanceClass}">${escapeHtml(importanceLabel)}</span>` : '';
        const holderHtml = escapeHtml(info.holder || '');
        const locationHtml = escapeHtml(info.location || '');

        // 修复显示格式：持有者 · 位置
        let positionStr = '';
        if (info.holder && info.location) {
            positionStr = `<span class="holder">${holderHtml}</span> · ${locationHtml}`;
        } else if (info.holder) {
            positionStr = `<span class="holder">${holderHtml}</span> ${escapeHtml(t('ui.heldBy'))}`;
        } else if (info.location) {
            positionStr = escapeHtml(t('ui.locatedAt', { location: info.location }));
        } else {
            positionStr = escapeHtml(t('ui.locationUnknown'));
        }

        const isSelected = selectedItems.has(name);
        const selectedClass = isSelected ? 'selected' : '';
        const checkboxDisplay = itemsMultiSelectMode ? 'flex' : 'none';
        const description = info.description || '';
        const descHtml = description ? `<div class="horae-full-item-desc">${escapeHtml(description)}</div>` : '';
        const isLocked = !!info._locked;
        const lockIcon = isLocked ? 'fa-lock' : 'fa-lock-open';
        const lockTitle = escapeHtml(isLocked ? t('ui.locked') : t('ui.clickToLock'));

        return `
            <div class="horae-full-item horae-editable-item ${importanceClass} ${selectedClass}" data-item-name="${nameHtml}">
                <div class="horae-item-checkbox" style="display: ${checkboxDisplay}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="horae-full-item-icon horae-item-emoji">
                    ${iconHtml}
                </div>
                <div class="horae-full-item-info">
                    <div class="horae-full-item-name">${nameHtml} ${importanceBadge}</div>
                    <div class="horae-full-item-location">${positionStr}</div>
                    ${descHtml}
                </div>
                ${(settings.rpgMode && settings.sendRpgEquipment) ? `<button class="horae-item-equip-btn" data-item-name="${nameHtml}" title="${escapeHtml(t('ui.equipToChar'))}"><i class="fa-solid fa-shirt"></i></button>` : ''}
                <button class="horae-item-lock-btn" data-item-name="${nameHtml}" title="${lockTitle}" style="opacity:${isLocked ? '1' : '0.35'}">
                    <i class="fa-solid ${lockIcon}"></i>
                </button>
                <button class="horae-item-edit-btn" data-edit-type="item" data-edit-name="${nameHtml}" title="${escapeHtml(t('common.edit'))}">
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
    const resolved = resolveLatestItemEntry(itemName, state);
    if (!resolved) {
        updateItemsDisplay();
        showToast(t('toast.itemNotFoundGeneric'), 'error');
        return;
    }
    const actualItemName = resolved.name;
    const item = resolved.info;

    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-pen"></i> ${t('common.edit')}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('placeholder.itemName')}</label>
                        <input type="text" id="edit-item-name" value="${escapeHtml(actualItemName)}" placeholder="${t('placeholder.itemName')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.icon')}</label>
                        <input type="text" id="edit-item-icon" value="${escapeHtml(item.icon || '')}" maxlength="2" placeholder="📦">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.importance')}</label>
                        <select id="edit-item-importance">
                            <option value="" ${!item.importance || item.importance === '一般' || item.importance === '' ? 'selected' : ''}>${t('levels.normal')}</option>
                            <option value="!" ${item.importance === '!' || item.importance === '重要' ? 'selected' : ''}>${t('levels.important')} !</option>
                            <option value="!!" ${item.importance === '!!' || item.importance === '关键' || item.importance === '關鍵' ? 'selected' : ''}>${t('levels.critical')} !!</option>
                        </select>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.description')}</label>
                        <textarea id="edit-item-desc" placeholder="${t('placeholder.itemDesc')}">${escapeHtml(item.description || '')}</textarea>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.holder')}</label>
                        <input type="text" id="edit-item-holder" value="${escapeHtml(item.holder || '')}" placeholder="${t('placeholder.holderName')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.location')}</label>
                        <input type="text" id="edit-item-location" value="${escapeHtml(item.location || '')}" placeholder="${t('placeholder.locationName')}">
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.save')}
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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
            showToast(t('toast.itemNameRequired'), 'error');
            return;
        }

        const newData = {
            icon: document.getElementById('edit-item-icon').value || item.icon,
            importance: document.getElementById('edit-item-importance').value,
            description: document.getElementById('edit-item-desc').value,
            holder: document.getElementById('edit-item-holder').value,
            location: document.getElementById('edit-item-location').value
        };

        // 更新所有消息中的该物品（含数量后缀变体，如 sword(3)）
        const chat = horaeManager.getChat();
        const nameChanged = newName !== actualItemName;

        for (let i = 0; i < chat.length; i++) {
            const meta = chat[i].horae_meta;
            if (!meta?.items) continue;
            const matchKey = Object.keys(meta.items).find(k =>
                isSameItemNameVariant(k, actualItemName)
            );
            if (!matchKey) continue;
            if (nameChanged) {
                meta.items[newName] = { ...meta.items[matchKey], ...newData };
                delete meta.items[matchKey];
            } else {
                Object.assign(meta.items[matchKey], newData);
            }
        }

        await getContext().saveChat();
        closeEditModal();
        updateItemsDisplay();
        updateStatusDisplay();
        showToast(t('toast.saveSuccess'), 'success');
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
                    <i class="fa-solid fa-heart"></i> ${t('modal.editAffection', { name: charName })}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('label.currentAffection')}</label>
                        <input type="number" step="0.1" id="edit-affection-value" value="${numValue}" placeholder="0-100">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.affectionLevel')}</label>
                        <span class="horae-affection-level-preview">${level}</span>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.save')}
                    </button>
                    <button id="edit-modal-delete" class="horae-btn danger">
                        <i class="fa-solid fa-trash"></i> ${t('common.delete')}
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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

        let affectedIdx;
        if (lastMessageWithAffection >= 0) {
            chat[lastMessageWithAffection].horae_meta.affection[charName] = {
                type: 'absolute',
                value: newValue
            };
            affectedIdx = lastMessageWithAffection;
        } else {
            affectedIdx = chat.length - 1;
            const lastMeta = chat[affectedIdx]?.horae_meta;
            if (lastMeta) {
                if (!lastMeta.affection) lastMeta.affection = {};
                lastMeta.affection[charName] = { type: 'absolute', value: newValue };
            }
        }
        getContext().saveChat();
        closeEditModal();
        updateCharactersDisplay();
        showToast(t('toast.saveSuccess'), 'success');
    });

    // 删除该角色的全部好感度记录
    document.getElementById('edit-modal-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!confirm(t('confirm.deleteNpc', { name: charName }))) return;
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
        showToast(t('toast.saveSuccess'), 'info');
    });

    document.getElementById('edit-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeEditModal();
    });
}

/**
 * 完整级联删除 NPC：从所有消息中清除目标角色的 npcs/affection/relationships/mood/costumes/RPG，
 * 并记录到 chat[0]._deletedNpcs 防止 rebuild 回滚。
 */
function _cascadeDeleteNpcs(names) {
    if (!names?.length) return;
    const chat = horaeManager.getChat();
    const nameSet = new Set(names);

    for (let i = 0; i < chat.length; i++) {
        const meta = chat[i].horae_meta;
        if (!meta) continue;
        let changed = false;
        for (const name of nameSet) {
            if (meta.npcs?.[name]) { delete meta.npcs[name]; changed = true; }
            if (meta.affection?.[name]) { delete meta.affection[name]; changed = true; }
            if (meta.costumes?.[name]) { delete meta.costumes[name]; changed = true; }
            if (meta.mood?.[name]) { delete meta.mood[name]; changed = true; }
        }
        if (meta.scene?.characters_present) {
            const before = meta.scene.characters_present.length;
            meta.scene.characters_present = meta.scene.characters_present.filter(c => !nameSet.has(c));
            if (meta.scene.characters_present.length !== before) changed = true;
        }
        if (meta.relationships?.length) {
            const before = meta.relationships.length;
            meta.relationships = meta.relationships.filter(r => !nameSet.has(r.from) && !nameSet.has(r.to));
            if (meta.relationships.length !== before) changed = true;
        }
        if (changed && i > 0) injectHoraeTagToMessage(i, meta);
    }

    // RPG 数据
    const rpg = chat[0]?.horae_meta?.rpg;
    if (rpg) {
        for (const name of nameSet) {
            for (const sub of ['bars', 'status', 'skills', 'attributes', 'reputation', 'levels', 'xp', 'currency']) {
                if (rpg[sub]?.[name]) delete rpg[sub][name];
            }
            if (rpg.equipment?.[name]) delete rpg.equipment[name];
            if (rpg.equipmentConfig?.perChar?.[name]) delete rpg.equipmentConfig.perChar[name];
        }
    }

    // 同步清理 _rpgConfigs，避免下次 rebuild 复活
    const _cfgs = chat[0]?.horae_meta?._rpgConfigs;
    if (_cfgs) {
        for (const name of nameSet) {
            if (_cfgs.equipmentConfig?.perChar?.[name]) {
                delete _cfgs.equipmentConfig.perChar[name];
            }
        }
    }

    // pinnedNpcs
    if (settings.pinnedNpcs) {
        settings.pinnedNpcs = settings.pinnedNpcs.filter(n => !nameSet.has(n));
        saveSettings();
    }

    // 防回滚：记录到 chat[0]
    if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
    if (!chat[0].horae_meta._deletedNpcs) chat[0].horae_meta._deletedNpcs = [];
    for (const name of nameSet) {
        if (!chat[0].horae_meta._deletedNpcs.includes(name)) {
            chat[0].horae_meta._deletedNpcs.push(name);
        }
    }
}

/**
 * 打开「手动添加 NPC」弹窗（精简版）
 * 字段：名字（必填）/ 别名 / 性别 / 外貌 / 性格 / 关系
 * 提交前检查：撞名（含 _aliases）→ 提示打开编辑或合并
 * 写入：chat[最后一条消息].horae_meta.npcs[名字]，并标记 chat[0].horae_meta._userAddedNpcs
 * 名字旁有 ✨ 按钮可触发 AI 从剧情中补全外貌/性格/关系
 */
function openNpcAddModal() {
    closeEditModal();
    const state = horaeManager.getLatestState();
    const existingNpcs = state.npcs || {};

    const genderOptions = [
        { val: '', label: t('ui.genderUnknown') },
        { val: '男', label: t('ui.genderMale') },
        { val: '女', label: t('ui.genderFemale') },
        { val: '__custom__', label: t('ui.genderCustom') }
    ].map(o => `<option value="${o.val}">${o.label}</option>`).join('');

    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-user-plus"></i> ${t('modal.addNpc')}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('label.npcName')} <span style="color:#e74c3c">*</span></label>
                        <div style="display:flex;gap:6px;align-items:center;">
                            <input type="text" id="add-npc-name" placeholder="${t('placeholder.npcNameRequired')}" style="flex:1;min-width:0;">
                            <button id="add-npc-ai-enrich" class="horae-btn" title="${t('tooltip.aiEnrichNpc')}" style="white-space:nowrap;padding:4px 10px;">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> ${t('label.aiEnrich')}
                            </button>
                        </div>
                        <span class="horae-setting-sub-hint">${t('ui.aiEnrichHint')}</span>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcAliases')} <span style="font-weight:normal;color:var(--horae-text-dim);font-size:11px">${t('label.npcAliasesHint')}</span></label>
                        <input type="text" id="add-npc-aliases" placeholder="${t('placeholder.npcAliases')}">
                    </div>
                    <div class="horae-edit-field-row">
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>${t('label.npcGender')}</label>
                            <select id="add-npc-gender">${genderOptions}</select>
                            <input type="text" id="add-npc-gender-custom" placeholder="${t('ui.customGenderPlaceholder')}" style="display:none;margin-top:4px;">
                        </div>
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>${t('label.npcAge')}</label>
                            <input type="text" id="add-npc-age" placeholder="${t('placeholder.npcAge')}">
                        </div>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcAppearance')}</label>
                        <textarea id="add-npc-appearance" placeholder="${t('placeholder.npcAppearance')}"></textarea>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcPersonality')}</label>
                        <input type="text" id="add-npc-personality" placeholder="${t('placeholder.npcPersonality')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcRelationship')}</label>
                        <input type="text" id="add-npc-relationship" placeholder="${t('placeholder.npcRelationship')}">
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="add-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.save')}
                    </button>
                    <button id="add-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();

    document.getElementById('add-npc-gender').addEventListener('change', function () {
        const customInput = document.getElementById('add-npc-gender-custom');
        customInput.style.display = this.value === '__custom__' ? 'block' : 'none';
        if (this.value !== '__custom__') customInput.value = '';
    });

    // ✨ AI 补全
    document.getElementById('add-npc-ai-enrich').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const name = document.getElementById('add-npc-name').value.trim();
        const aliasesRaw = document.getElementById('add-npc-aliases').value.trim();
        const aliases = aliasesRaw ? aliasesRaw.split(/[,，、\/]/).map(s => s.trim()).filter(Boolean) : [];
        if (!name) { showToast(t('toast.npcNameRequired'), 'warning'); return; }

        const btn = e.currentTarget;
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('common.loading')}`;
        try {
            const enriched = await aiEnrichNpc(name, aliases);
            if (!enriched) {
                showToast(t('toast.aiEnrichNoMessages', { name }), 'warning');
                return;
            }
            if (enriched.appearance) document.getElementById('add-npc-appearance').value = enriched.appearance;
            if (enriched.personality) document.getElementById('add-npc-personality').value = enriched.personality;
            if (enriched.relationship) document.getElementById('add-npc-relationship').value = enriched.relationship;
            if (enriched.age) document.getElementById('add-npc-age').value = enriched.age;
            if (enriched.gender) {
                const sel = document.getElementById('add-npc-gender');
                if (['男', '女'].includes(enriched.gender)) {
                    sel.value = enriched.gender;
                } else {
                    sel.value = '__custom__';
                    const ci = document.getElementById('add-npc-gender-custom');
                    ci.style.display = 'block';
                    ci.value = enriched.gender;
                }
            }
            showToast(t('toast.aiEnrichDone', { name, n: enriched._matchCount || 0 }), 'success');
        } catch (err) {
            console.error('[Horae] aiEnrichNpc 失败:', err);
            showToast(t('toast.aiEnrichFailed', { error: err.message || err }), 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    });

    document.getElementById('add-modal-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const newName = document.getElementById('add-npc-name').value.trim();
        if (!newName) { showToast(t('toast.npcNameRequired'), 'warning'); return; }

        const aliasesRaw = document.getElementById('add-npc-aliases').value.trim();
        const aliases = aliasesRaw ? aliasesRaw.split(/[,，、\/]/).map(s => s.trim()).filter(Boolean) : [];

        // 撞名检查：精确名 / 既有 _aliases 包含
        const lcName = newName.toLowerCase();
        const lcAliases = aliases.map(a => a.toLowerCase());
        let conflictName = null;
        for (const [exName, exNpc] of Object.entries(existingNpcs)) {
            if (exName.toLowerCase() === lcName) { conflictName = exName; break; }
            const exAliasesLc = (exNpc?._aliases || []).map(a => a.toLowerCase());
            if (exAliasesLc.includes(lcName) || lcAliases.some(a => exAliasesLc.includes(a) || a === exName.toLowerCase())) {
                conflictName = exName;
                break;
            }
        }
        if (conflictName) {
            const ok = confirm(t('confirm.npcAlreadyExists', { existing: conflictName, name: newName }));
            if (ok) {
                closeEditModal();
                openNpcEditModal(conflictName);
            }
            return;
        }

        const genderSel = document.getElementById('add-npc-gender').value;
        const newData = {
            appearance: document.getElementById('add-npc-appearance').value,
            personality: document.getElementById('add-npc-personality').value,
            relationship: document.getElementById('add-npc-relationship').value,
            gender: genderSel === '__custom__'
                ? document.getElementById('add-npc-gender-custom').value.trim()
                : genderSel,
            age: document.getElementById('add-npc-age').value,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
        };
        if (aliases.length) newData._aliases = aliases;

        const chat = horaeManager.getChat();
        if (!chat?.length) { showToast(t('toast.metaNotFound'), 'error'); return; }

        // 写入最后一条消息的 horae_meta.npcs，确保下次 rebuild 时该 NPC 出现
        const lastIdx = chat.length - 1;
        let targetMeta = chat[lastIdx].horae_meta;
        if (!targetMeta) {
            targetMeta = createEmptyMeta();
            chat[lastIdx].horae_meta = targetMeta;
        }
        if (!targetMeta.npcs) targetMeta.npcs = {};
        targetMeta.npcs[newName] = newData;

        // 标记到 chat[0]._userAddedNpcs，避免被「失踪过滤」当幽灵清掉
        if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
        if (!Array.isArray(chat[0].horae_meta._userAddedNpcs)) chat[0].horae_meta._userAddedNpcs = [];
        if (!chat[0].horae_meta._userAddedNpcs.includes(newName)) {
            chat[0].horae_meta._userAddedNpcs.push(newName);
        }

        // 同步从 _deletedNpcs 移除（防止用户先删后加被立刻吞回）
        const delList = chat[0].horae_meta._deletedNpcs;
        if (Array.isArray(delList)) {
            const di = delList.indexOf(newName);
            if (di !== -1) delList.splice(di, 1);
        }

        if (lastIdx > 0) injectHoraeTagToMessage(lastIdx, targetMeta);

        await getContext().saveChat();
        closeEditModal();
        refreshAllDisplays();
        showToast(t('toast.npcAdded', { name: newName }), 'success');
    });

    document.getElementById('add-modal-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeEditModal();
    });
}

/**
 * AI 补全：搜全 chat 中包含 name/aliases 的消息，最多取 20 条最相关的，发给 AI 提取角色档案
 * 返回 {appearance, personality, relationship, age, gender, _matchCount} 或 null（无匹配）
 */
async function aiEnrichNpc(name, aliases = []) {
    const chat = horaeManager.getChat();
    if (!chat?.length) return null;

    const keywords = [name, ...aliases].filter(Boolean);
    const matches = [];
    for (let i = 1; i < chat.length; i++) {
        const msg = chat[i];
        const text = msg?.mes || '';
        if (!text) continue;
        const hit = keywords.some(k => text.includes(k));
        if (hit) matches.push({ idx: i, text: text.slice(0, 1000), is_user: !!msg.is_user });
    }

    if (matches.length === 0) return null;

    // 优先取最近的 20 条
    const picked = matches.slice(-20);
    const matchCount = matches.length;

    const ctxBlock = picked.map(m => `[#${m.idx}${m.is_user ? '|USER' : '|AI'}] ${m.text}`).join('\n---\n');
    const targetLang = detectEffectiveAiLang(settings);
    const langName = targetLang === 'zh-CN' ? '简体中文' : targetLang === 'zh-TW' ? '繁體中文'
        : targetLang === 'ja' ? '日本語' : targetLang === 'ko' ? '한국어'
            : targetLang === 'ru' ? 'Русский' : 'English';

    const prompt = `You are an analyst extracting a character profile from roleplay messages.\n` +
        `Target character: "${name}"${aliases.length ? ` (also known as: ${aliases.join(', ')})` : ''}\n\n` +
        `Read the messages below and produce a concise profile. Output STRICT JSON only, no prose, no markdown:\n` +
        `{"appearance": "...", "personality": "...", "relationship": "...", "age": "...", "gender": "..."}\n\n` +
        `Rules:\n` +
        `- Output language: ${langName}\n` +
        `- Each field 1-2 short sentences max; leave empty string "" if not enough info.\n` +
        `- "gender" should be one of: 男 / 女 / or a short custom string / "" if unknown.\n` +
        `- "age" should be a short string like "20" / "约30岁" / "" if unknown.\n` +
        `- Stay faithful: never invent facts not present in the messages.\n\n` +
        `=== MESSAGES (${picked.length} of ${matchCount} hits) ===\n${ctxBlock}\n=== END ===`;

    let raw = '';
    try {
        raw = await generateForSummary(prompt);
    } catch (err) {
        throw new Error(t('toast.aiEnrichApiError', { error: err.message || String(err) }));
    }
    if (!raw || !raw.trim()) throw new Error(t('toast.aiEnrichEmpty'));

    // 剥 <think> 块
    raw = raw.replace(/<think[\s\S]*?<\/think>/gi, '').trim();
    // 抓第一个 JSON 块
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(t('toast.aiEnrichParseError'));

    let parsed;
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch (_) {
        throw new Error(t('toast.aiEnrichParseError'));
    }

    return {
        appearance: typeof parsed.appearance === 'string' ? parsed.appearance.trim() : '',
        personality: typeof parsed.personality === 'string' ? parsed.personality.trim() : '',
        relationship: typeof parsed.relationship === 'string' ? parsed.relationship.trim() : '',
        age: typeof parsed.age === 'string' ? parsed.age.trim() : '',
        gender: typeof parsed.gender === 'string' ? parsed.gender.trim() : '',
        _matchCount: matchCount,
    };
}

/**
 * 打开NPC编辑弹窗
 */
function openNpcEditModal(npcName) {
    const state = horaeManager.getLatestState();
    const npc = state.npcs?.[npcName];
    if (!npc) {
        showToast(t('toast.npcNotFound'), 'error');
        return;
    }

    const isPinned = (settings.pinnedNpcs || []).includes(npcName);

    // 性别选项：预设值以外的自动归入「自定义」
    const genderVal = npc.gender || '';
    const presetGenders = ['', '男', '女'];
    const isCustomGender = genderVal !== '' && !presetGenders.includes(genderVal);
    const genderOptions = [
        { val: '', label: t('ui.genderUnknown') },
        { val: '男', label: t('ui.genderMale') },
        { val: '女', label: t('ui.genderFemale') },
        { val: '__custom__', label: t('ui.genderCustom') }
    ].map(o => {
        const selected = isCustomGender ? o.val === '__custom__' : genderVal === o.val;
        return `<option value="${o.val}" ${selected ? 'selected' : ''}>${o.label}</option>`;
    }).join('');

    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-pen"></i> ${t('modal.editNpc')}: ${npcName}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('label.npcName')}${npc._aliases?.length ? ` <span style="font-weight:normal;color:var(--horae-text-dim)">(${npc._aliases.join(', ')})</span>` : ''}</label>
                        <input type="text" id="edit-npc-name" value="${npcName}" placeholder="${t('ui.npcNameChangePlaceholder')}">
                    </div>
                    <div class="horae-edit-field">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                            <input type="checkbox" id="edit-npc-pinned" ${isPinned ? 'checked' : ''}>
                            <i class="fa-solid fa-crown" style="color:${isPinned ? '#b388ff' : '#666'}"></i>
                            ${t('ui.pinAsMainChar')}
                        </label>
                    </div>
                    <div class="horae-edit-field-row">
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>${t('label.npcGender')}</label>
                            <select id="edit-npc-gender">${genderOptions}</select>
                            <input type="text" id="edit-npc-gender-custom" value="${isCustomGender ? genderVal : ''}" placeholder="${t('ui.customGenderPlaceholder')}" style="display:${isCustomGender ? 'block' : 'none'};margin-top:4px;">
                        </div>
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>${t('label.npcAge')}${(() => {
            const ar = horaeManager.calcCurrentAge(npc, state.timestamp?.story_date);
            return ar.changed ? ` <span style="font-weight:normal;color:var(--horae-accent)">(${t('ui.currentAgeCalc', { age: ar.display })})</span>` : '';
        })()}</label>
                            <input type="text" id="edit-npc-age" value="${npc.age || ''}" placeholder="${t('placeholder.npcAge')}">
                        </div>
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>${t('label.npcRace')}</label>
                            <input type="text" id="edit-npc-race" value="${npc.race || ''}" placeholder="${t('placeholder.npcRace')}">
                        </div>
                        <div class="horae-edit-field horae-edit-field-compact">
                            <label>${t('label.npcJob')}</label>
                            <input type="text" id="edit-npc-job" value="${npc.job || ''}" placeholder="${t('placeholder.npcJob')}">
                        </div>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcAppearance')}</label>
                        <textarea id="edit-npc-appearance" placeholder="${t('placeholder.npcAppearance')}">${npc.appearance || ''}</textarea>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcPersonality')}</label>
                        <input type="text" id="edit-npc-personality" value="${npc.personality || ''}" placeholder="${t('placeholder.npcPersonality')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcRelationship')}</label>
                        <input type="text" id="edit-npc-relationship" value="${npc.relationship || ''}" placeholder="${t('placeholder.npcRelationship')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcBirthday')} <span style="font-weight:normal;color:var(--horae-text-dim);font-size:11px">${t('label.npcBirthdayHint')}</span></label>
                        <input type="text" id="edit-npc-birthday" value="${npc.birthday || ''}" placeholder="${t('placeholder.npcBirthday')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.npcNote')}</label>
                        <input type="text" id="edit-npc-note" value="${npc.note || ''}" placeholder="${t('placeholder.npcNote')}">
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-delete" class="horae-btn danger" style="background:#c62828;color:#fff;margin-right:auto;">
                        <i class="fa-solid fa-trash"></i> ${t('common.delete')}
                    </button>
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.save')}
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    preventModalBubble();

    document.getElementById('edit-npc-gender').addEventListener('change', function () {
        const customInput = document.getElementById('edit-npc-gender-custom');
        customInput.style.display = this.value === '__custom__' ? 'block' : 'none';
        if (this.value !== '__custom__') customInput.value = '';
    });

    // 删除NPC（完整级联：npcs/affection/relationships/mood/costumes/RPG + 防回滚）
    document.getElementById('edit-modal-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!confirm(t('confirm.deleteNpc', { name: npcName }))) return;

        _cascadeDeleteNpcs([npcName]);

        await getContext().saveChat();
        closeEditModal();
        refreshAllDisplays();
        showToast(t('toast.saveSuccess'), 'success');
    });

    // 保存NPC编辑（支持改名 + 曾用名）
    document.getElementById('edit-modal-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const chat = horaeManager.getChat();
        const newName = document.getElementById('edit-npc-name').value.trim();
        const newAge = document.getElementById('edit-npc-age').value;
        const newData = {
            appearance: document.getElementById('edit-npc-appearance').value,
            personality: document.getElementById('edit-npc-personality').value,
            relationship: document.getElementById('edit-npc-relationship').value,
            gender: document.getElementById('edit-npc-gender').value === '__custom__'
                ? document.getElementById('edit-npc-gender-custom').value.trim()
                : document.getElementById('edit-npc-gender').value,
            age: newAge,
            race: document.getElementById('edit-npc-race').value,
            job: document.getElementById('edit-npc-job').value,
            birthday: document.getElementById('edit-npc-birthday').value.trim(),
            note: document.getElementById('edit-npc-note').value
        };

        if (!newName) { showToast(t('toast.npcNameRequired'), 'warning'); return; }

        const currentState = horaeManager.getLatestState();
        const ageChanged = newAge !== (npc.age || '');
        if (ageChanged && newAge) {
            const ageCalc = horaeManager.calcCurrentAge(npc, currentState.timestamp?.story_date);
            const storyDate = currentState.timestamp?.story_date || t('ui.noStoryDate');
            const confirmed = confirm(t('confirm.ageBaseChange', {
                original: npc.age || t('levels.none'),
                currentCalc: ageCalc.changed ? t('ui.ageBaseCurrentCalc', { age: ageCalc.display }) : '',
                newAge,
                storyDate
            }));
            if (!confirmed) return;
            newData._ageRefDate = storyDate;
        }

        const isRename = newName !== npcName;

        // 改名：级联迁移所有消息中的 key + 记录曾用名
        if (isRename) {
            const aliases = npc._aliases ? [...npc._aliases] : [];
            if (!aliases.includes(npcName)) aliases.push(npcName);
            newData._aliases = aliases;

            for (let i = 0; i < chat.length; i++) {
                const meta = chat[i].horae_meta;
                if (!meta) continue;
                let changed = false;
                if (meta.npcs?.[npcName]) {
                    meta.npcs[newName] = { ...meta.npcs[npcName], ...newData };
                    delete meta.npcs[npcName];
                    changed = true;
                }
                if (meta.affection?.[npcName]) {
                    meta.affection[newName] = meta.affection[npcName];
                    delete meta.affection[npcName];
                    changed = true;
                }
                if (meta.costumes?.[npcName]) {
                    meta.costumes[newName] = meta.costumes[npcName];
                    delete meta.costumes[npcName];
                    changed = true;
                }
                if (meta.mood?.[npcName]) {
                    meta.mood[newName] = meta.mood[npcName];
                    delete meta.mood[npcName];
                    changed = true;
                }
                if (meta.scene?.characters_present) {
                    const idx = meta.scene.characters_present.indexOf(npcName);
                    if (idx !== -1) { meta.scene.characters_present[idx] = newName; changed = true; }
                }
                if (meta.relationships?.length) {
                    for (const rel of meta.relationships) {
                        if (rel.from === npcName) { rel.from = newName; changed = true; }
                        if (rel.to === npcName) { rel.to = newName; changed = true; }
                    }
                }
                if (changed && i > 0) injectHoraeTagToMessage(i, meta);
            }

            // RPG 数据迁移
            const rpg = chat[0]?.horae_meta?.rpg;
            if (rpg) {
                for (const sub of ['bars', 'status', 'skills', 'attributes', 'reputation', 'levels', 'xp', 'currency']) {
                    if (rpg[sub]?.[npcName]) {
                        rpg[sub][newName] = rpg[sub][npcName];
                        delete rpg[sub][npcName];
                    }
                }
                if (rpg.equipment?.[npcName]) {
                    rpg.equipment[newName] = rpg.equipment[npcName];
                    delete rpg.equipment[npcName];
                }
                if (rpg.equipmentConfig?.perChar?.[npcName]) {
                    rpg.equipmentConfig.perChar[newName] = rpg.equipmentConfig.perChar[npcName];
                    delete rpg.equipmentConfig.perChar[npcName];
                }
            }

            // 同步 _rpgConfigs，避免旧名 perChar 被回填
            const _cfgs = chat[0]?.horae_meta?._rpgConfigs;
            if (_cfgs?.equipmentConfig?.perChar?.[npcName]) {
                _cfgs.equipmentConfig.perChar[newName] = _cfgs.equipmentConfig.perChar[npcName];
                delete _cfgs.equipmentConfig.perChar[npcName];
            }

            // pinnedNpcs 迁移
            if (settings.pinnedNpcs) {
                const idx = settings.pinnedNpcs.indexOf(npcName);
                if (idx !== -1) settings.pinnedNpcs[idx] = newName;
            }
        } else {
            // 未改名，只更新属性
            for (let i = 0; i < chat.length; i++) {
                const meta = chat[i].horae_meta;
                if (meta?.npcs?.[npcName]) {
                    Object.assign(meta.npcs[npcName], newData);
                    injectHoraeTagToMessage(i, meta);
                }
            }
        }

        // 处理重要角色标记
        const finalName = isRename ? newName : npcName;
        const newPinned = document.getElementById('edit-npc-pinned').checked;
        if (!settings.pinnedNpcs) settings.pinnedNpcs = [];
        const pinIdx = settings.pinnedNpcs.indexOf(finalName);
        if (newPinned && pinIdx === -1) {
            settings.pinnedNpcs.push(finalName);
        } else if (!newPinned && pinIdx !== -1) {
            settings.pinnedNpcs.splice(pinIdx, 1);
        }
        saveSettings();

        await getContext().saveChat();
        closeEditModal();
        refreshAllDisplays();
        showToast(t('toast.saveSuccess'), 'success');
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
        showToast(t('toast.metaNotFound'), 'error');
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
                    <i class="fa-solid fa-pen"></i> ${t('modal.editEvent', { id: messageId })}${totalEvents > 1 ? ` (${eventIndex + 1}/${totalEvents})` : ''}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('label.eventLevel')}</label>
                        <select id="edit-event-level">
                            <option value="一般" ${event.level === '一般' || !event.level ? 'selected' : ''}>${t('levels.normal')}</option>
                            <option value="重要" ${event.level === '重要' ? 'selected' : ''}>${t('levels.important')}</option>
                            <option value="关键" ${event.level === '关键' || event.level === '關鍵' ? 'selected' : ''}>${t('levels.critical')}</option>
                            <option value="摘要" ${event.level === '摘要' ? 'selected' : ''}>${t('levels.summary')}</option>
                        </select>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.eventSummary')}</label>
                        <textarea id="edit-event-summary" placeholder="${t('placeholder.eventSummary')}">${event.summary || ''}</textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="edit-modal-delete" class="horae-btn danger">
                        <i class="fa-solid fa-trash"></i> ${t('common.delete')}
                    </button>
                    <button id="edit-modal-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.save')}
                    </button>
                    <button id="edit-modal-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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
                if (!confirm(t('confirm.deleteTimeline', { n: 1 }))) {
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
                showToast(t('toast.saveSuccess'), 'success');
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
                    is_important: newLevel === '重要' || newLevel === '关键' || newLevel === '關鍵',
                    level: newLevel,
                    summary: newSummary,
                    ...(isSummaryLevel ? { isSummary: true } : {})
                };
            } else {
                chatMeta.events.push({
                    is_important: newLevel === '重要' || newLevel === '关键' || newLevel === '關鍵',
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
        showToast(t('toast.saveSuccess'), 'success');
    });

    // 删除事件（带确认）
    document.getElementById('edit-modal-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (confirm(t('confirm.deleteTimeline', { n: 1 }))) {
            const chat = horaeManager.getChat();
            const chatMeta = chat[messageId]?.horae_meta;
            if (chatMeta) {
                if (!chatMeta.events) {
                    chatMeta.events = chatMeta.event ? [chatMeta.event] : [];
                }
                if (chatMeta.events.length > eventIndex) {
                    chatMeta.events.splice(eventIndex, 1);
                }
                delete chatMeta.event;

                getContext().saveChat();
                closeEditModal();
                updateTimelineDisplay();
                showToast(t('toast.saveSuccess'), 'success');
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

/** 阻止弹窗事件冒泡 + 钉住抽屉防收合（统一防护） */
function preventModalBubble(modalEl) {
    const targets = modalEl
        ? [modalEl]
        : [document.getElementById('horae-edit-modal'), ...document.querySelectorAll('.horae-edit-modal-backdrop')].filter(Boolean);

    const drawerContent = document.getElementById('horae_drawer_content');
    const drawerIcon = document.getElementById('horae_drawer_icon');
    if (drawerContent) drawerContent.classList.add('pinnedOpen');
    if (drawerIcon) drawerIcon.classList.add('drawerPinnedOpen');

    targets.forEach(el => {
        if (isLightMode()) el.classList.add('horae-light');
        const block = (e) => { e.stopPropagation(); };
        for (const ev of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend']) {
            el.addEventListener(ev, block, false);
        }
    });

    const primary = targets[0];
    if (primary) {
        const observer = new MutationObserver(() => {
            if (!document.body.contains(primary)) {
                observer.disconnect();
                if (!document.querySelector('.horae-modal')) {
                    if (drawerContent) drawerContent.classList.remove('pinnedOpen');
                    if (drawerIcon) drawerIcon.classList.remove('drawerPinnedOpen');
                }
            }
        });
        observer.observe(document.body, { childList: true });
    }
}

// ============================================
// Excel风格自定义表格功能
// ============================================

// 每个表格独立的 Undo/Redo 栈，key = tableId
const TABLE_HISTORY_MAX = 20;
const _perTableUndo = {};  // { tableId: [snapshot, ...] }
const _perTableRedo = {};  // { tableId: [snapshot, ...] }

function _getTableId(scope, tableIndex) {
    const tables = getTablesByScope(scope);
    return tables[tableIndex]?.id || `${scope}_${tableIndex}`;
}

function _deepCopyOneTable(scope, tableIndex) {
    const tables = getTablesByScope(scope);
    if (!tables[tableIndex]) return null;
    return JSON.parse(JSON.stringify(tables[tableIndex]));
}

/** 在修改前调用：保存指定表格的快照到其独立 undo 栈 */
function pushTableSnapshot(scope, tableIndex) {
    if (tableIndex == null) return;
    const tid = _getTableId(scope, tableIndex);
    const snap = _deepCopyOneTable(scope, tableIndex);
    if (!snap) return;
    if (!_perTableUndo[tid]) _perTableUndo[tid] = [];
    _perTableUndo[tid].push({ scope, tableIndex, table: snap });
    if (_perTableUndo[tid].length > TABLE_HISTORY_MAX) _perTableUndo[tid].shift();
    _perTableRedo[tid] = [];
    _updatePerTableUndoRedoButtons(tid);
}

/** 撤回指定表格 */
function undoSingleTable(tid) {
    const stack = _perTableUndo[tid];
    if (!stack?.length) return;
    const snap = stack.pop();
    const tables = getTablesByScope(snap.scope);
    if (!tables[snap.tableIndex]) return;
    // 当前状态入 redo
    if (!_perTableRedo[tid]) _perTableRedo[tid] = [];
    _perTableRedo[tid].push({
        scope: snap.scope,
        tableIndex: snap.tableIndex,
        table: JSON.parse(JSON.stringify(tables[snap.tableIndex]))
    });
    tables[snap.tableIndex] = snap.table;
    setTablesByScope(snap.scope, tables);
    renderCustomTablesList();
    showToast(t('toast.tableUndone'), 'info');
}

/** 复原指定表格 */
function redoSingleTable(tid) {
    const stack = _perTableRedo[tid];
    if (!stack?.length) return;
    const snap = stack.pop();
    const tables = getTablesByScope(snap.scope);
    if (!tables[snap.tableIndex]) return;
    if (!_perTableUndo[tid]) _perTableUndo[tid] = [];
    _perTableUndo[tid].push({
        scope: snap.scope,
        tableIndex: snap.tableIndex,
        table: JSON.parse(JSON.stringify(tables[snap.tableIndex]))
    });
    tables[snap.tableIndex] = snap.table;
    setTablesByScope(snap.scope, tables);
    renderCustomTablesList();
    showToast(t('toast.tableRedone'), 'info');
}

function _updatePerTableUndoRedoButtons(tid) {
    const undoBtn = document.querySelector(`.horae-table-undo-btn[data-table-id="${tid}"]`);
    const redoBtn = document.querySelector(`.horae-table-redo-btn[data-table-id="${tid}"]`);
    if (undoBtn) undoBtn.disabled = !_perTableUndo[tid]?.length;
    if (redoBtn) redoBtn.disabled = !_perTableRedo[tid]?.length;
}

/** 切换聊天时清空所有 undo/redo 栈 */
function clearTableHistory() {
    for (const k of Object.keys(_perTableUndo)) delete _perTableUndo[k];
    for (const k of Object.keys(_perTableRedo)) delete _perTableRedo[k];
}

let activeContextMenu = null;

/**
 * 渲染自定义表格列表
 */
function renderCustomTablesList() {
    const listEl = document.getElementById('horae-custom-tables-list');
    if (!listEl) return;

    const globalTables = getGlobalTables();
    const charTables = getCharacterTables();
    const chatTables = getChatTables();

    if (globalTables.length === 0 && charTables.length === 0 && chatTables.length === 0) {
        listEl.innerHTML = `
            <div class="horae-custom-tables-empty">
                <i class="fa-solid fa-table-cells"></i>
                <div>${t('settings.customTables')}</div>
                <div style="font-size:11px;opacity:0.7;margin-top:4px;">${t('common.add')}</div>
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
        const scopeConfig = {
            global: { icon: 'fa-globe', label: t('ui.scopeGlobal'), title: t('ui.scopeGlobalDesc'), color: 'var(--horae-accent)' },
            character: { icon: 'fa-id-card', label: t('ui.scopeCharacter'), title: t('ui.scopeCharacterDesc'), color: 'var(--horae-warning)' },
            local: { icon: 'fa-bookmark', label: t('ui.scopeLocal'), title: t('ui.scopeLocalDesc'), color: 'var(--horae-primary-light)' },
        };
        const sc = scopeConfig[scope] || scopeConfig.local;
        const isGlobal = scope === 'global';
        const scopeIcon = sc.icon;
        const scopeLabel = sc.label;
        const scopeTitle = sc.title;

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
                tableHtml += `<input type="text" value="${escapeHtml(cellValue)}" size="${inputSize}" data-scope="${scope}" data-table="${idx}" data-row="${r}" data-col="${c}" placeholder="${isHeader ? t('ui.tableHeader') : ''}">`;
                tableHtml += `</${tag}>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</table>';

        const tid = table.id || `${scope}_${idx}`;
        const hasUndo = !!(_perTableUndo[tid]?.length);
        const hasRedo = !!(_perTableRedo[tid]?.length);

        return `
            <div class="horae-excel-table-container" data-table-index="${idx}" data-scope="${scope}" data-table-id="${tid}">
                <div class="horae-excel-table-header">
                    <div class="horae-excel-table-title">
                        <i class="fa-solid ${scopeIcon}" title="${scopeTitle}" style="color:${sc.color}; cursor:pointer;" data-toggle-scope="${idx}" data-scope="${scope}"></i>
                        <span class="horae-table-scope-label" data-toggle-scope="${idx}" data-scope="${scope}" title="${t('ui.clickToToggleScope')}">${scopeLabel}</span>
                        <input type="text" value="${escapeHtml(table.name || '')}" placeholder="${t('ui.tableName')}" data-table-name="${idx}" data-scope="${scope}">
                    </div>
                    <div class="horae-excel-table-actions">
                        <button class="horae-table-undo-btn" title="${t('ui.undoBtn')}" data-table-id="${tid}" ${hasUndo ? '' : 'disabled'}>
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>
                        <button class="horae-table-redo-btn" title="${t('ui.redoBtn')}" data-table-id="${tid}" ${hasRedo ? '' : 'disabled'}>
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                        <button class="clear-table-data-btn" title="${t('ui.clearDataBtn')}" data-table-index="${idx}" data-scope="${scope}">
                            <i class="fa-solid fa-eraser"></i>
                        </button>
                        <button class="export-table-btn" title="${t('ui.exportTableBtn')}" data-table-index="${idx}" data-scope="${scope}">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <button class="delete-table-btn danger" title="${t('ui.deleteTableBtn')}" data-table-index="${idx}" data-scope="${scope}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div><!-- header -->
                <div class="horae-excel-table-wrapper">
                    ${tableHtml}
                </div>
                <div class="horae-table-prompt-row">
                    <input type="text" value="${escapeHtml(table.prompt || '')}" placeholder="${t('ui.tablePromptPlaceholder')}" data-table-prompt="${idx}" data-scope="${scope}">
                </div>
            </div>
        `;
    }

    let html = '';
    if (globalTables.length > 0) {
        html += `<div class="horae-tables-group-label"><i class="fa-solid fa-globe"></i> ${t('ui.globalTables')}</div>`;
        html += globalTables.map((tbl, i) => renderOneTable(tbl, i, 'global')).join('');
    }
    if (charTables.length > 0) {
        const charName = getContext()?.name2 || '';
        html += `<div class="horae-tables-group-label"><i class="fa-solid fa-id-card"></i> ${t('ui.characterTables')}${charName ? ` (${charName})` : ''}</div>`;
        html += charTables.map((tbl, i) => renderOneTable(tbl, i, 'character')).join('');
    }
    if (chatTables.length > 0) {
        html += `<div class="horae-tables-group-label"><i class="fa-solid fa-bookmark"></i> ${t('ui.localTables')}</div>`;
        html += chatTables.map((tbl, i) => renderOneTable(tbl, i, 'local')).join('');
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
        input.addEventListener('focus', (e) => {
            e.target._horaeSnapshotPushed = false;
        });
        input.addEventListener('change', (e) => {
            const scope = getScope(e.target);
            const tableIndex = parseInt(e.target.dataset.table);
            if (!e.target._horaeSnapshotPushed) {
                pushTableSnapshot(scope, tableIndex);
                e.target._horaeSnapshotPushed = true;
            }
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
            pushTableSnapshot(scope, tableIndex);
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
            pushTableSnapshot(scope, tableIndex);
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

    // 每个表格独立的撤回/复原按钮
    document.querySelectorAll('.horae-table-undo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            undoSingleTable(btn.dataset.tableId);
        });
    });
    document.querySelectorAll('.horae-table-redo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            redoSingleTable(btn.dataset.tableId);
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
            <div class="horae-context-menu-item" data-action="add-row-below"><i class="fa-solid fa-plus"></i> ${t('ui.addRowBelow')}</div>
            <div class="horae-context-menu-item" data-action="add-col-right"><i class="fa-solid fa-plus"></i> ${t('ui.addColRight')}</div>
        `;
    } else if (isColHeader) {
        const colLocked = lockedCols.has(col);
        menuItems += `
            <div class="horae-context-menu-item" data-action="add-col-left"><i class="fa-solid fa-arrow-left"></i> ${t('ui.addColLeft')}</div>
            <div class="horae-context-menu-item" data-action="add-col-right"><i class="fa-solid fa-arrow-right"></i> ${t('ui.addColRight')}</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item" data-action="toggle-lock-col"><i class="fa-solid ${colLocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${colLocked ? t('ui.unlockCol') : t('ui.lockCol')}</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item danger" data-action="delete-col"><i class="fa-solid fa-trash-can"></i> ${t('ui.deleteCol')}</div>
        `;
    } else if (isRowHeader) {
        const rowLocked = lockedRows.has(row);
        menuItems += `
            <div class="horae-context-menu-item" data-action="add-row-above"><i class="fa-solid fa-arrow-up"></i> ${t('ui.addRowAbove')}</div>
            <div class="horae-context-menu-item" data-action="add-row-below"><i class="fa-solid fa-arrow-down"></i> ${t('ui.addRowBelow')}</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item" data-action="toggle-lock-row"><i class="fa-solid ${rowLocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${rowLocked ? t('ui.unlockRow') : t('ui.lockRow')}</div>
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item danger" data-action="delete-row"><i class="fa-solid fa-trash-can"></i> ${t('ui.deleteRow')}</div>
        `;
    } else {
        // 普通数据单元格
        menuItems += `
            <div class="horae-context-menu-item" data-action="add-row-above"><i class="fa-solid fa-arrow-up"></i> ${t('ui.addRowAbove')}</div>
            <div class="horae-context-menu-item" data-action="add-row-below"><i class="fa-solid fa-arrow-down"></i> ${t('ui.addRowBelow')}</div>
            <div class="horae-context-menu-item" data-action="add-col-left"><i class="fa-solid fa-arrow-left"></i> ${t('ui.addColLeft')}</div>
            <div class="horae-context-menu-item" data-action="add-col-right"><i class="fa-solid fa-arrow-right"></i> ${t('ui.addColRight')}</div>
        `;
    }

    // 所有非角落单元格都可以锁定/解锁单格
    if (!isCorner) {
        const cellLocked = lockedCells.has(cellKey);
        menuItems += `
            <div class="horae-context-menu-divider"></div>
            <div class="horae-context-menu-item" data-action="toggle-lock-cell"><i class="fa-solid ${cellLocked ? 'fa-lock-open' : 'fa-lock'}"></i> ${cellLocked ? t('ui.unlockCell') : t('ui.lockCell')}</div>
        `;
    }

    const menu = document.createElement('div');
    menu.className = 'horae-context-menu';
    if (isLightMode()) menu.classList.add('horae-light');
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
    pushTableSnapshot(scope, tableIndex);
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
            if (oldRows <= 2) { showToast(t('toast.tableMinRows'), 'warning'); return; }
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
            if (oldCols <= 2) { showToast(t('toast.tableMinCols'), 'warning'); return; }
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
                showToast(t('toast.rowUnlocked', { n: row + 1 }), 'info');
            } else {
                table.lockedRows.push(row);
                showToast(t('toast.rowLocked', { n: row + 1 }), 'success');
            }
            break;
        }

        case 'toggle-lock-col': {
            if (!table.lockedCols) table.lockedCols = [];
            const idx = table.lockedCols.indexOf(col);
            if (idx >= 0) {
                table.lockedCols.splice(idx, 1);
                showToast(t('toast.colUnlocked', { n: col + 1 }), 'info');
            } else {
                table.lockedCols.push(col);
                showToast(t('toast.colLocked', { n: col + 1 }), 'success');
            }
            break;
        }

        case 'toggle-lock-cell': {
            if (!table.lockedCells) table.lockedCells = [];
            const cellKey = `${row}-${col}`;
            const idx = table.lockedCells.indexOf(cellKey);
            if (idx >= 0) {
                table.lockedCells.splice(idx, 1);
                showToast(t('toast.cellUnlocked', { row, col }), 'info');
            } else {
                table.lockedCells.push(cellKey);
                showToast(t('toast.cellLocked', { row, col }), 'success');
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
    const toastKey = { global: 'toast.tableAddedGlobal', character: 'toast.tableAddedCharacter', local: 'toast.tableAddedLocal' };
    showToast(t(toastKey[scope] || toastKey.local), 'success');
}

/**
 * 删除表格
 */
function deleteCustomTable(index, scope = 'local') {
    if (!confirm(t('confirm.deleteTable'))) return;
    pushTableSnapshot(scope, index);

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
    // 角色表格：清除 per-chat overlay
    if (scope === 'character' && deletedName && chat?.[0]?.horae_meta?.charTableData) {
        delete chat[0].horae_meta.charTableData[deletedName];
    }

    horaeManager.rebuildTableData();
    getContext().saveChat();
    if ((scope === 'global' || scope === 'character') && typeof saveSettingsDebounced.flush === 'function') {
        saveSettingsDebounced.flush();
    }
    renderCustomTablesList();
    showToast(t('toast.saveSuccess'), 'info');
}

/** 清除指定表格的所有 tableContributions，将当前数据写入 baseData 作为新基准 */
function purgeTableContributions(tableName, scope = 'local') {
    if (!tableName) return;
    const chat = horaeManager.getChat();
    if (!chat?.length) return;

    // 清除所有消息中该表格的全部 tableContributions（AI 贡献 + 旧用户快照一并清除）
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

    // 将当前完整数据（含用户编辑）写入 baseData 作为新基准
    // 这样即使消息被滑动/重新生成，rebuildTableData 也能从正确的基准恢复
    const tables = getTablesByScope(scope);
    const table = tables.find(tbl => (tbl.name || '').trim() === tableName);
    if (table) {
        table.baseData = JSON.parse(JSON.stringify(table.data || {}));
        table.baseRows = table.rows;
        table.baseCols = table.cols;
    }
    if (scope === 'global' && chat[0]?.horae_meta?.globalTableData?.[tableName]) {
        const overlay = chat[0].horae_meta.globalTableData[tableName];
        overlay.baseData = JSON.parse(JSON.stringify(overlay.data || {}));
        overlay.baseRows = overlay.rows;
        overlay.baseCols = overlay.cols;
    }
    if (scope === 'character' && chat[0]?.horae_meta?.charTableData?.[tableName]) {
        const overlay = chat[0].horae_meta.charTableData[tableName];
        overlay.baseData = JSON.parse(JSON.stringify(overlay.data || {}));
        overlay.baseRows = overlay.rows;
        overlay.baseCols = overlay.cols;
    }
}

/** 清空表格数据区（保留第0行和第0列的表头） */
function clearTableData(index, scope = 'local') {
    if (!confirm(t('confirm.clearTableData'))) return;
    pushTableSnapshot(scope, index);

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

    // 全局/角色表格：同步清除 overlay 的数据区和 baseData
    const overlayKey = scope === 'global' ? 'globalTableData' : scope === 'character' ? 'charTableData' : null;
    if (overlayKey && tableName && chat?.[0]?.horae_meta?.[overlayKey]?.[tableName]) {
        const overlay = chat[0].horae_meta[overlayKey][tableName];
        for (const key of Object.keys(overlay.data || {})) {
            const [r, c] = key.split('-').map(Number);
            if (r > 0 && c > 0) delete overlay.data[key];
        }
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
    showToast(t('toast.saveSuccess'), 'info');
}

/** 切换表格的 scope：local → character → global → local */
function toggleTableScope(tableIndex, currentScope) {
    const scopeCycle = ['local', 'character', 'global'];
    const curIdx = scopeCycle.indexOf(currentScope);
    const newScope = scopeCycle[(curIdx + 1) % scopeCycle.length];

    if (newScope === 'character' && getContext()?.characterId == null) {
        showToast(t('toast.noCharacterCard'), 'warning');
        return;
    }

    const labelMap = {
        global: t('ui.scopeGlobalFull'),
        character: t('ui.scopeCharacterFull'),
        local: t('ui.scopeLocalFull'),
    };
    const label = labelMap[newScope];
    if (!confirm(t('confirm.convertTableScope', { scope: label }))) return;
    pushTableSnapshot(currentScope, tableIndex);

    const srcTables = getTablesByScope(currentScope);
    if (!srcTables[tableIndex]) return;
    const table = JSON.parse(JSON.stringify(srcTables[tableIndex]));
    const tableName = (table.name || '').trim();

    if (currentScope === 'global' && tableName) {
        const chat = horaeManager.getChat();
        if (chat?.[0]?.horae_meta?.globalTableData) {
            delete chat[0].horae_meta.globalTableData[tableName];
        }
    }
    if (currentScope === 'character' && tableName) {
        const chat = horaeManager.getChat();
        if (chat?.[0]?.horae_meta?.charTableData) {
            delete chat[0].horae_meta.charTableData[tableName];
        }
    }

    srcTables.splice(tableIndex, 1);
    setTablesByScope(currentScope, srcTables);

    const dstTables = getTablesByScope(newScope);
    dstTables.push(table);
    setTablesByScope(newScope, dstTables);

    renderCustomTablesList();
    getContext().saveChat();
    showToast(t('toast.tableScopeChanged', { scope: label }), 'success');
}


/**
 * 绑定物品列表事件
 */
function bindItemsEvents() {
    const items = document.querySelectorAll('#horae-items-full-list .horae-full-item');

    items.forEach(item => {
        const itemName = item.dataset.itemName;
        if (!itemName) return;

        // 多选模式下点击切换选中
        item.addEventListener('click', () => {
            if (itemsMultiSelectMode) {
                toggleItemSelection(itemName);
            }
        });
    });

    document.querySelectorAll('.horae-item-equip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            _openEquipItemDialog(btn.dataset.itemName);
        });
    });

    document.querySelectorAll('.horae-item-lock-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = btn.dataset.itemName;
            if (!name) return;
            const state = horaeManager.getLatestState();
            const resolved = resolveLatestItemEntry(name, state);
            if (!resolved) {
                updateItemsDisplay();
                return;
            }
            const actualName = resolved.name;
            const itemInfo = resolved.info;
            const chat = horaeManager.getChat();
            for (let i = chat.length - 1; i >= 0; i--) {
                const meta = chat[i]?.horae_meta;
                if (!meta?.items) continue;
                const key = Object.keys(meta.items).find(k => isSameItemNameVariant(k, actualName));
                if (key) {
                    meta.items[key]._locked = !meta.items[key]._locked;
                    getContext().saveChat();
                    updateItemsDisplay();
                    showToast(meta.items[key]._locked ? t('toast.itemLocked', { name: actualName }) : t('toast.itemUnlocked', { name: actualName }), meta.items[key]._locked ? 'success' : 'info');
                    return;
                }
            }
            const first = chat[0];
            if (!first.horae_meta) first.horae_meta = createEmptyMeta();
            if (!first.horae_meta.items) first.horae_meta.items = {};
            first.horae_meta.items[actualName] = { ...itemInfo, _locked: true };
            getContext().saveChat();
            updateItemsDisplay();
            showToast(t('toast.itemLocked', { name: actualName }), 'success');
        });
    });
}

// ═══════════════════════════════════════════════════
//  装备穿脱系统 — 物品栏 ↔ 装备栏 原子移动
// ═══════════════════════════════════════════════════

/**
 * 从物品栏穿戴到装备栏
 * @param {string} itemName 物品名
 * @param {string} owner    角色名
 * @param {string} slotName 格位名
 * @param {object} [replacedItem] 被替换的旧装备（自动归还物品栏）
 */
function _equipItemToChar(itemName, owner, slotName, replacedItem) {
    const chat = horaeManager.getChat();
    if (!chat?.length) return;
    const first = chat[0];
    if (!first.horae_meta) first.horae_meta = createEmptyMeta();
    const state = horaeManager.getLatestState();
    const resolved = resolveLatestItemEntry(itemName, state);
    if (!resolved) {
        updateItemsDisplay();
        showToast(t('toast.itemNotFound', { name: itemName }), 'warning');
        return;
    }
    const actualItemName = resolved.name;
    const itemInfo = resolved.info;

    if (!first.horae_meta.rpg) first.horae_meta.rpg = {};
    const rpg = first.horae_meta.rpg;
    if (!rpg.equipment) rpg.equipment = {};

    // 被替换的旧装备归还物品栏（在重建数组前执行）
    if (replacedItem) {
        _unequipToItems(owner, slotName, replacedItem.name, true);
    }

    // 确保目标数组存在（unequip 可能删除了空数组）
    if (!rpg.equipment[owner]) rpg.equipment[owner] = {};
    if (!rpg.equipment[owner][slotName]) rpg.equipment[owner][slotName] = [];

    // 构建装备条目（携带完整物品信息）
    const eqEntry = {
        name: actualItemName,
        attrs: {},
        _itemMeta: {
            icon: itemInfo.icon || '',
            description: itemInfo.description || '',
            importance: itemInfo.importance || '',
            _id: itemInfo._id || '',
            _locked: itemInfo._locked || false,
        },
    };
    // 已有装备属性（从 eqAttrMap 等来源）
    const existingEqData = _findExistingEquipAttrs(actualItemName);
    if (existingEqData) eqEntry.attrs = { ...existingEqData };

    rpg.equipment[owner][slotName].push(eqEntry);

    // 从物品栏中移除
    _removeItemFromState(actualItemName);

    getContext().saveChat();
}

/**
 * 脱下装备归还物品栏
 */
function _unequipToItems(owner, slotName, equipName, skipSave) {
    const chat = horaeManager.getChat();
    if (!chat?.length) return;
    const first = chat[0];
    if (!first.horae_meta?.rpg?.equipment?.[owner]?.[slotName]) return;

    const slotArr = first.horae_meta.rpg.equipment[owner][slotName];
    const idx = slotArr.findIndex(e => e.name === equipName);
    if (idx < 0) return;
    const removed = slotArr.splice(idx, 1)[0];

    // 清理空结构
    if (!slotArr.length) delete first.horae_meta.rpg.equipment[owner][slotName];
    if (first.horae_meta.rpg.equipment[owner] && !Object.keys(first.horae_meta.rpg.equipment[owner]).length) delete first.horae_meta.rpg.equipment[owner];

    // 归还到物品栏
    if (!first.horae_meta.items) first.horae_meta.items = {};
    const meta = removed._itemMeta || {};
    first.horae_meta.items[equipName] = {
        icon: meta.icon || '📦',
        description: meta.description || '',
        importance: meta.importance || '',
        holder: owner,
        location: '',
        _id: meta._id || '',
        _locked: meta._locked || false,
    };
    // 恢复装备属性到描述
    if (removed.attrs && Object.keys(removed.attrs).length > 0) {
        const attrStr = Object.entries(removed.attrs).map(([k, v]) => `${k}${v >= 0 ? '+' : ''}${v}`).join(', ');
        const desc = first.horae_meta.items[equipName].description;
        if (!desc.includes(attrStr)) {
            first.horae_meta.items[equipName].description = desc ? `${desc} (${attrStr})` : attrStr;
        }
    }

    if (!skipSave) getContext().saveChat();
}

function _removeItemFromState(itemName) {
    const chat = horaeManager.getChat();
    if (!chat?.length) return;
    for (let i = chat.length - 1; i >= 0; i--) {
        const meta = chat[i]?.horae_meta;
        if (!meta?.items) continue;
        const key = Object.keys(meta.items).find(k => isSameItemNameVariant(k, itemName));
        if (key) {
            delete meta.items[key];
            return;
        }
    }
}

function _findExistingEquipAttrs(itemName) {
    try {
        const rpg = horaeManager.getRpgStateAt(0);
        for (const [, slots] of Object.entries(rpg.equipment || {})) {
            for (const [, items] of Object.entries(slots)) {
                const found = items.find(e => isSameItemNameVariant(e.name, itemName));
                if (found?.attrs && Object.keys(found.attrs).length > 0) return { ...found.attrs };
            }
        }
    } catch (_) { /* ignore */ }
    return null;
}

/**
 * 打开装备穿戴对话框：选角色 → 选格位 → 穿戴
 */
function _openEquipItemDialog(itemName) {
    const cfgMap = _getEqConfigMap();
    const perChar = cfgMap.perChar || {};
    const candidates = Object.entries(perChar).filter(([, cfg]) => cfg.slots?.length > 0);
    if (!candidates.length) {
        showToast(t('toast.noEquipChars'), 'warning');
        return;
    }
    const state = horaeManager.getLatestState();
    const resolved = resolveLatestItemEntry(itemName, state);
    if (!resolved) {
        updateItemsDisplay();
        return;
    }
    const actualItemName = resolved.name;

    const modal = document.createElement('div');
    modal.className = 'horae-modal';

    let bodyHtml = `<div class="horae-edit-field"><label>${t('label.selectCharacter')}</label><select id="horae-equip-char">`;
    for (const [owner] of candidates) {
        bodyHtml += `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`;
    }
    bodyHtml += `</select></div>`;
    bodyHtml += `<div class="horae-edit-field"><label>${t('label.selectSlot')}</label><select id="horae-equip-slot"></select></div>`;
    bodyHtml += `<div id="horae-equip-conflict" style="color:#ef4444;font-size:.85em;margin-top:4px;display:none;"></div>`;

    modal.innerHTML = `
        <div class="horae-modal-content" style="max-width:400px;width:92vw;box-sizing:border-box;">
            <div class="horae-modal-header"><h3>${t('modal.addEquipment')}</h3></div>
            <div class="horae-modal-body">${bodyHtml}</div>
            <div class="horae-modal-footer">
                <button id="horae-equip-ok" class="horae-btn primary">${t('common.confirm')}</button>
                <button id="horae-equip-cancel" class="horae-btn">${t('common.cancel')}</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    preventModalBubble(modal);

    const charSel = modal.querySelector('#horae-equip-char');
    const slotSel = modal.querySelector('#horae-equip-slot');
    const conflictDiv = modal.querySelector('#horae-equip-conflict');

    const _updateSlots = () => {
        const owner = charSel.value;
        const cfg = perChar[owner];
        if (!cfg?.slots?.length) { slotSel.innerHTML = `<option>${t('levels.none')}</option>`; return; }
        const eqValues = _getEqValues();
        const ownerEq = eqValues[owner] || {};
        slotSel.innerHTML = cfg.slots.map(s => {
            const cur = (ownerEq[s.name] || []).length;
            const max = s.maxCount ?? 1;
            return `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${cur}/${max})</option>`;
        }).join('');
        _checkConflict();
    };

    const _checkConflict = () => {
        const owner = charSel.value;
        const slotName = slotSel.value;
        const cfg = perChar[owner];
        const slotCfg = cfg?.slots?.find(s => s.name === slotName);
        const max = slotCfg?.maxCount ?? 1;
        const eqValues = _getEqValues();
        const existing = eqValues[owner]?.[slotName] || [];
        if (existing.length >= max) {
            const oldest = existing[0];
            conflictDiv.style.display = '';
            conflictDiv.textContent = t('toast.slotConflict', { slot: slotName, max, oldest: oldest.name });
        } else {
            conflictDiv.style.display = 'none';
        }
    };

    charSel.addEventListener('change', _updateSlots);
    slotSel.addEventListener('change', _checkConflict);
    _updateSlots();

    modal.querySelector('#horae-equip-ok').onclick = () => {
        const owner = charSel.value;
        const slotName = slotSel.value;
        if (!owner || !slotName) return;
        const cfg = perChar[owner];
        const slotCfg = cfg?.slots?.find(s => s.name === slotName);
        const max = slotCfg?.maxCount ?? 1;
        const eqValues = _getEqValues();
        const existing = eqValues[owner]?.[slotName] || [];
        const replaced = existing.length >= max ? existing[0] : null;

        _equipItemToChar(actualItemName, owner, slotName, replaced);
        modal.remove();
        updateItemsDisplay();
        renderEquipmentValues();
        _bindEquipmentEvents();
        updateAllRpgHuds();
        showToast(t('toast.itemEquipped', { item: actualItemName, owner, slot: slotName }), 'success');
    };

    modal.querySelector('#horae-equip-cancel').onclick = () => modal.remove();
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
    const btn = document.getElementById('horae-btn-items-multiselect');
    if (btn) { btn.classList.add('active'); btn.title = t('ui.exitMultiSelect'); }

    // 隐藏提示
    const hint = document.querySelector('#horae-tab-items .horae-items-hint');
    if (hint) hint.style.display = 'none';

    updateItemsDisplay();
    updateSelectedCount();

    showToast(t('toast.agendaMultiSelect'), 'info');
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
    const btn = document.getElementById('horae-btn-items-multiselect');
    if (btn) { btn.classList.remove('active'); btn.title = t('ui.multiSelectMode'); }

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
    const item = Array.from(document.querySelectorAll('#horae-items-full-list .horae-full-item'))
        .find(el => el.dataset.itemName === itemName);
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
        showToast(t('toast.insufficientEvents'), 'warning');
        return;
    }

    // 确认对话框
    const confirmed = confirm(t('confirm.deleteTimeline', { n: selectedItems.size }));
    if (!confirmed) return;

    // 从所有消息的 meta 中删除这些物品
    const chat = horaeManager.getChat();
    const itemsToDelete = Array.from(selectedItems);

    for (let i = 0; i < chat.length; i++) {
        const meta = chat[i].horae_meta;
        if (meta && meta.items) {
            let changed = false;
            for (const itemName of itemsToDelete) {
                const keys = Object.keys(meta.items).filter(key => isSameItemNameVariant(key, itemName));
                for (const key of keys) {
                    delete meta.items[key];
                    changed = true;
                }
            }
            if (changed) injectHoraeTagToMessage(i, meta);
        }
    }

    // 保存更改
    await getContext().saveChat();

    showToast(t('toast.saveSuccess'), 'success');

    exitMultiSelectMode();
    updateStatusDisplay();
}

// ============================================
// NPC 多选模式
// ============================================

function enterNpcMultiSelect(initialName) {
    npcMultiSelectMode = true;
    selectedNpcs.clear();
    if (initialName) selectedNpcs.add(initialName);
    const bar = document.getElementById('horae-npc-multiselect-bar');
    if (bar) bar.style.display = 'flex';
    const btn = document.getElementById('horae-btn-npc-multiselect');
    if (btn) { btn.classList.add('active'); btn.title = t('ui.exitMultiSelect'); }
    updateCharactersDisplay();
    _updateNpcSelectedCount();
}

function exitNpcMultiSelect() {
    npcMultiSelectMode = false;
    selectedNpcs.clear();
    const bar = document.getElementById('horae-npc-multiselect-bar');
    if (bar) bar.style.display = 'none';
    const btn = document.getElementById('horae-btn-npc-multiselect');
    if (btn) { btn.classList.remove('active'); btn.title = t('ui.multiSelectMode'); }
    updateCharactersDisplay();
}

function toggleNpcSelection(name) {
    if (selectedNpcs.has(name)) selectedNpcs.delete(name);
    else selectedNpcs.add(name);
    const item = document.querySelector(`#horae-npc-list .horae-npc-item[data-npc-name="${name}"]`);
    if (item) {
        const cb = item.querySelector('.horae-npc-select-cb input');
        if (cb) cb.checked = selectedNpcs.has(name);
        item.classList.toggle('selected', selectedNpcs.has(name));
    }
    _updateNpcSelectedCount();
}

function _updateNpcSelectedCount() {
    const el = document.getElementById('horae-npc-selected-count');
    if (el) el.textContent = selectedNpcs.size;
}

async function deleteSelectedNpcs() {
    if (selectedNpcs.size === 0) { showToast(t('toast.insufficientEvents'), 'warning'); return; }
    if (!confirm(t('confirm.deleteNpc', { name: `${selectedNpcs.size}` }))) return;

    _cascadeDeleteNpcs(Array.from(selectedNpcs));
    await getContext().saveChat();
    showToast(t('toast.saveSuccess'), 'success');
    exitNpcMultiSelect();
    refreshAllDisplays();
}

// 异常状态 → FontAwesome 图标映射
const RPG_STATUS_ICONS = {
    '昏': 'fa-dizzy', '眩': 'fa-dizzy', '晕': 'fa-dizzy', '暈': 'fa-dizzy',
    '流血': 'fa-droplet', '出血': 'fa-droplet', '血': 'fa-droplet',
    '重伤': 'fa-heart-crack', '重傷': 'fa-heart-crack', '濒死': 'fa-heart-crack', '瀕死': 'fa-heart-crack',
    '冻': 'fa-snowflake', '凍': 'fa-snowflake', '冰': 'fa-snowflake', '寒': 'fa-snowflake',
    '石化': 'fa-gem', '钙化': 'fa-gem', '鈣化': 'fa-gem', '结晶': 'fa-gem', '結晶': 'fa-gem',
    '毒': 'fa-skull-crossbones', '腐蚀': 'fa-skull-crossbones', '腐蝕': 'fa-skull-crossbones',
    '火': 'fa-fire', '烧': 'fa-fire', '燒': 'fa-fire', '灼': 'fa-fire', '燃': 'fa-fire', '炎': 'fa-fire',
    '慢': 'fa-hourglass-half', '减速': 'fa-hourglass-half', '減速': 'fa-hourglass-half', '迟缓': 'fa-hourglass-half', '遲緩': 'fa-hourglass-half',
    '盲': 'fa-eye-slash', '失明': 'fa-eye-slash',
    '沉默': 'fa-comment-slash', '禁言': 'fa-comment-slash', '封印': 'fa-ban',
    '麻': 'fa-bolt', '痹': 'fa-bolt', '痺': 'fa-bolt', '电': 'fa-bolt', '電': 'fa-bolt', '雷': 'fa-bolt',
    '弱': 'fa-feather', '衰': 'fa-feather', '虚': 'fa-feather', '虛': 'fa-feather',
    '恐': 'fa-ghost', '惧': 'fa-ghost', '懼': 'fa-ghost', '惊': 'fa-ghost', '驚': 'fa-ghost',
    '乱': 'fa-shuffle', '亂': 'fa-shuffle', '混乱': 'fa-shuffle', '混亂': 'fa-shuffle', '狂暴': 'fa-shuffle',
    '眠': 'fa-moon', '睡': 'fa-moon', '催眠': 'fa-moon',
    '缚': 'fa-link', '縛': 'fa-link', '禁锢': 'fa-link', '禁錮': 'fa-link', '束': 'fa-link',
    '饥': 'fa-utensils', '飢': 'fa-utensils', '饿': 'fa-utensils', '餓': 'fa-utensils', '饥饿': 'fa-utensils', '飢餓': 'fa-utensils',
    '渴': 'fa-glass-water', '脱水': 'fa-glass-water', '脫水': 'fa-glass-water',
    '疲': 'fa-battery-quarter', '累': 'fa-battery-quarter', '倦': 'fa-battery-quarter', '乏': 'fa-battery-quarter',
    '伤': 'fa-bandage', '傷': 'fa-bandage', '创': 'fa-bandage', '創': 'fa-bandage',
    '愈': 'fa-heart-pulse', '恢复': 'fa-heart-pulse', '恢復': 'fa-heart-pulse', '再生': 'fa-heart-pulse',
    '隐': 'fa-user-secret', '隱': 'fa-user-secret', '伪装': 'fa-user-secret', '偽裝': 'fa-user-secret', '潜行': 'fa-user-secret', '潛行': 'fa-user-secret',
    '护盾': 'fa-shield', '護盾': 'fa-shield', '防御': 'fa-shield', '防禦': 'fa-shield', '铁壁': 'fa-shield', '鐵壁': 'fa-shield',
    '正常': 'fa-circle-check',
};

/** 根据异常状态文本匹配图标 */
function getStatusIcon(text) {
    for (const [kw, icon] of Object.entries(RPG_STATUS_ICONS)) {
        if (text.includes(kw)) return icon;
    }
    return 'fa-triangle-exclamation';
}

/** 根据配置获取属性条颜色 */
function getRpgBarColor(key) {
    const cfg = (settings.rpgBarConfig || []).find(b => b.key === key);
    return cfg?.color || '#6366f1';
}

/** 根据配置获取属性条显示名（用户自定义名 > AI标签 > 默认key大写） */
function getRpgBarName(key, aiLabel) {
    const cfg = (settings.rpgBarConfig || []).find(b => b.key === key);
    const cfgName = cfg?.name;
    if (cfgName && cfgName !== key.toUpperCase()) return cfgName;
    return aiLabel || cfgName || key.toUpperCase();
}

// ============================================
// RPG 骰子系统
// ============================================

const RPG_DICE_TYPES = [
    { faces: 4, label: 'D4' },
    { faces: 6, label: 'D6' },
    { faces: 8, label: 'D8' },
    { faces: 10, label: 'D10' },
    { faces: 12, label: 'D12' },
    { faces: 20, label: 'D20' },
    { faces: 100, label: 'D100' },
];

function rollDice(count, faces, modifier = 0) {
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(Math.ceil(Math.random() * faces));
    const sum = rolls.reduce((a, b) => a + b, 0) + modifier;
    const modStr = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '';
    return {
        notation: `${count}d${faces}${modStr}`,
        rolls,
        total: sum,
        display: `🎲 ${count}d${faces}${modStr} = [${rolls.join(', ')}]${modStr} = ${sum}`,
    };
}

function injectDiceToChat(text) {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) return;
    const cur = textarea.value;
    textarea.value = cur ? `${cur}\n${text}` : text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
}

let _diceAbort = null;
function renderDicePanel() {
    if (_diceAbort) { _diceAbort.abort(); _diceAbort = null; }
    const existing = document.getElementById('horae-rpg-dice-panel');
    if (existing) existing.remove();
    if (!settings.rpgMode || !settings.rpgDiceEnabled) return;

    _diceAbort = new AbortController();
    const sig = _diceAbort.signal;

    const btns = RPG_DICE_TYPES.map(d =>
        `<button class="horae-rpg-dice-btn" data-faces="${d.faces}">${d.label}</button>`
    ).join('');

    const html = `
        <div id="horae-rpg-dice-panel" class="horae-rpg-dice-panel">
            <div class="horae-rpg-dice-toggle" title="${t('tooltip.diceDraggable')}">
                <i class="fa-solid fa-dice-d20"></i>
            </div>
            <div class="horae-rpg-dice-body" style="display:none;">
                <div class="horae-rpg-dice-types">${btns}</div>
                <div class="horae-rpg-dice-config">
                    <label>${t('ui.diceCount')}<input type="number" id="horae-dice-count" value="1" min="1" max="20" class="horae-rpg-dice-input"></label>
                    <label>${t('ui.diceMod')}<input type="number" id="horae-dice-mod" value="0" min="-99" max="99" class="horae-rpg-dice-input"></label>
                </div>
                <div class="horae-rpg-dice-result" id="horae-dice-result"></div>
                <button id="horae-dice-inject" class="horae-rpg-dice-inject" style="display:none;">
                    <i class="fa-solid fa-paper-plane"></i> ${t('ui.diceInject')}
                </button>
            </div>
        </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    document.body.appendChild(wrapper.firstChild);

    const panel = document.getElementById('horae-rpg-dice-panel');
    if (!panel) return;

    _applyDicePos(panel);

    let lastResult = null;
    let selectedFaces = 20;

    // ---- 拖拽逻辑（mouse + touch 双端通用） ----
    const toggle = panel.querySelector('.horae-rpg-dice-toggle');
    let dragging = false, dragMoved = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;

    function onDragStart(e) {
        const ev = e.touches ? e.touches[0] : e;
        dragging = true; dragMoved = false;
        startX = ev.clientX; startY = ev.clientY;
        const rect = panel.getBoundingClientRect();
        origLeft = rect.left; origTop = rect.top;
        panel.style.transition = 'none';
    }
    function onDragMove(e) {
        if (!dragging) return;
        const ev = e.touches ? e.touches[0] : e;
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        if (!dragMoved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            dragMoved = true;
            // 首次移动时移除居中 transform，切换为绝对像素定位
            if (!panel.classList.contains('horae-dice-placed')) {
                panel.style.left = origLeft + 'px';
                panel.style.top = origTop + 'px';
                panel.classList.add('horae-dice-placed');
            }
        }
        if (!dragMoved) return;
        e.preventDefault();
        let nx = origLeft + dx, ny = origTop + dy;
        const vw = window.innerWidth, vh = window.innerHeight;
        nx = Math.max(0, Math.min(nx, vw - 48));
        ny = Math.max(0, Math.min(ny, vh - 48));
        panel.style.left = nx + 'px';
        panel.style.top = ny + 'px';
    }
    function onDragEnd() {
        if (!dragging) return;
        dragging = false;
        panel.style.transition = '';
        if (dragMoved) {
            panel.classList.add('horae-dice-placed');
            settings.dicePosX = parseInt(panel.style.left);
            settings.dicePosY = parseInt(panel.style.top);
            panel.classList.toggle('horae-dice-flip-down', settings.dicePosY < 300);
            saveSettings();
        }
    }
    toggle.addEventListener('mousedown', onDragStart, { signal: sig });
    document.addEventListener('mousemove', onDragMove, { signal: sig });
    document.addEventListener('mouseup', onDragEnd, { signal: sig });
    toggle.addEventListener('touchstart', onDragStart, { passive: false, signal: sig });
    document.addEventListener('touchmove', onDragMove, { passive: false, signal: sig });
    document.addEventListener('touchend', onDragEnd, { signal: sig });

    // 点击展开/收起（仅无拖拽时触发）
    toggle.addEventListener('click', () => {
        if (dragMoved) return;
        const body = panel.querySelector('.horae-rpg-dice-body');
        body.style.display = body.style.display === 'none' ? '' : 'none';
    }, { signal: sig });

    panel.querySelectorAll('.horae-rpg-dice-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.faces) === selectedFaces);
        btn.addEventListener('click', () => {
            selectedFaces = parseInt(btn.dataset.faces);
            panel.querySelectorAll('.horae-rpg-dice-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const count = parseInt(document.getElementById('horae-dice-count')?.value) || 1;
            const mod = parseInt(document.getElementById('horae-dice-mod')?.value) || 0;
            lastResult = rollDice(count, selectedFaces, mod);
            const resultEl = document.getElementById('horae-dice-result');
            if (resultEl) resultEl.textContent = lastResult.display;
            const injectBtn = document.getElementById('horae-dice-inject');
            if (injectBtn) injectBtn.style.display = '';
        }, { signal: sig });
    });

    document.getElementById('horae-dice-inject')?.addEventListener('click', () => {
        if (lastResult) {
            injectDiceToChat(lastResult.display);
            showToast(t('toast.diceInjected'), 'success');
        }
    }, { signal: sig });
}

/** 应用骰子面板保存的位置；坐标超出当前视口则自动重置 */
function _applyDicePos(panel) {
    if (settings.dicePosX != null && settings.dicePosY != null) {
        const vw = window.innerWidth, vh = window.innerHeight;
        if (settings.dicePosX > vw || settings.dicePosY > vh) {
            settings.dicePosX = null;
            settings.dicePosY = null;
            return;
        }
        const x = Math.max(0, Math.min(settings.dicePosX, vw - 48));
        const y = Math.max(0, Math.min(settings.dicePosY, vh - 48));
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.classList.add('horae-dice-placed');
        panel.classList.toggle('horae-dice-flip-down', y < 300);
    }
}

/** 渲染属性条配置列表 */
function renderBarConfig() {
    const list = document.getElementById('horae-rpg-bar-config-list');
    if (!list) return;
    const bars = settings.rpgBarConfig || [];
    list.innerHTML = bars.map((b, i) => `
        <div class="horae-rpg-config-row horae-rpg-bar-config-row" data-idx="${i}">
            <input class="horae-rpg-config-key" value="${escapeHtml(b.key)}" maxlength="10" data-idx="${i}" placeholder="key" title="${t('ui.rpgKeyHint')}" />
            <input class="horae-rpg-config-name" value="${escapeHtml(b.name)}" maxlength="8" data-idx="${i}" title="${t('ui.rpgDisplayNameHint')}" />
            <input class="horae-rpg-config-min" type="number" value="${b.min ?? 0}" data-idx="${i}" placeholder="${t('placeholder.rpgBarMin')}" title="${t('placeholder.rpgBarMin')}" />
            <input class="horae-rpg-config-max" type="number" value="${b.max ?? 100}" data-idx="${i}" placeholder="${t('placeholder.rpgBarMax')}" title="${t('placeholder.rpgBarMax')}" />
            <input class="horae-rpg-config-default-max" type="number" value="${b.defaultMax ?? b.max ?? 100}" data-idx="${i}" placeholder="${t('placeholder.rpgBarDefaultMax')}" title="${t('placeholder.rpgBarDefaultMax')}" />
            <input class="horae-rpg-config-desc" value="${escapeHtml(b.desc || '')}" data-idx="${i}" placeholder="${t('placeholder.rpgBarDesc')}" title="${t('ui.rpgDefinitionHint')}" />
            <label class="horae-rpg-config-required" title="${t('ui.rpgBarRequiredHint')}"><input type="checkbox" class="horae-rpg-config-required-check" data-idx="${i}" ${b.required !== false ? 'checked' : ''}>${t('ui.requiredShort')}</label>
            <input type="color" class="horae-rpg-config-color" value="${b.color}" data-idx="${i}" />
            <button class="horae-rpg-config-del" data-idx="${i}" title="${t('common.delete')}"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

/** 构建角色下拉选项（{{user}} + NPC列表） */
function buildCharacterOptions() {
    const userName = getContext().name1 || '{{user}}';
    let html = `<option value="__user__">${escapeHtml(userName)}</option>`;
    const state = horaeManager.getLatestState();
    for (const [name, info] of Object.entries(state.npcs || {})) {
        const prefix = info._id ? `N${info._id} ` : '';
        html += `<option value="${escapeHtml(name)}">${escapeHtml(prefix + name)}</option>`;
    }
    return html;
}

/** 在 Canvas 上绘制雷达图（自适应 DPI + 动态尺寸 + 跟随主题色） */
function drawRadarChart(canvas, values, config, maxVal = 100) {
    const n = config.length;
    if (n < 3) return;
    const dpr = window.devicePixelRatio || 1;

    // 从 CSS 变量读取颜色，自动跟随美化主题
    const themeRoot = canvas.closest('#horae_drawer') || canvas.closest('.horae-rpg-char-detail-body') || document.getElementById('horae_drawer') || document.body;
    const cs = getComputedStyle(themeRoot);
    const radarHex = cs.getPropertyValue('--horae-radar-color').trim() || cs.getPropertyValue('--horae-primary').trim() || '#7c3aed';
    const labelColor = cs.getPropertyValue('--horae-radar-label').trim() || cs.getPropertyValue('--horae-text').trim() || '#e2e8f0';
    const gridColor = cs.getPropertyValue('--horae-border').trim() || 'rgba(255,255,255,0.1)';
    const rr = parseInt(radarHex.slice(1, 3), 16) || 124;
    const rg = parseInt(radarHex.slice(3, 5), 16) || 58;
    const rb = parseInt(radarHex.slice(5, 7), 16) || 237;

    // 根据最长属性名动态选字号
    const maxNameLen = Math.max(...config.map(c => c.name.length));
    const fontSize = maxNameLen > 3 ? 11 : 12;

    const tmpCtx = canvas.getContext('2d');
    tmpCtx.font = `${fontSize}px sans-serif`;
    let maxLabelW = 0;
    for (const c of config) {
        const w = tmpCtx.measureText(`${c.name} ${maxVal}`).width;
        if (w > maxLabelW) maxLabelW = w;
    }

    // 动态布局：保证侧面标签不超出画布
    const labelGap = 18;
    const labelMargin = 4;
    const pad = Math.max(38, Math.ceil(maxLabelW) + labelGap + labelMargin);
    const r = 92;
    const cssW = Math.min(400, 2 * (r + pad));
    const cssH = cssW;
    const cx = cssW / 2, cy = cssH / 2;
    const actualR = Math.min(r, cx - pad);

    canvas.style.width = cssW + 'px';
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const angle = i => -Math.PI / 2 + (2 * Math.PI * i) / n;

    // 底层网格
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let lv = 1; lv <= 4; lv++) {
        ctx.beginPath();
        const lr = (actualR * lv) / 4;
        for (let i = 0; i <= n; i++) {
            const a = angle(i % n);
            const x = cx + lr * Math.cos(a), y = cy + lr * Math.sin(a);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    // 辐射线
    for (let i = 0; i < n; i++) {
        const a = angle(i);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + actualR * Math.cos(a), cy + actualR * Math.sin(a));
        ctx.stroke();
    }
    // 数据区
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
        const a = angle(i % n);
        const v = Math.min(maxVal, values[config[i % n].key] || 0);
        const dr = (v / maxVal) * actualR;
        const x = cx + dr * Math.cos(a), y = cy + dr * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.fillStyle = `rgba(${rr},${rg},${rb},0.25)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${rr},${rg},${rb},0.8)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    // 顶点圆点 + 标签
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
        const a = angle(i);
        const v = Math.min(maxVal, values[config[i].key] || 0);
        const dr = (v / maxVal) * actualR;
        ctx.beginPath();
        ctx.arc(cx + dr * Math.cos(a), cy + dr * Math.sin(a), 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rr},${rg},${rb},1)`;
        ctx.fill();
        const labelR = actualR + labelGap;
        const lx = cx + labelR * Math.cos(a);
        const ly = cy + labelR * Math.sin(a);
        ctx.fillStyle = labelColor;
        const cosA = Math.cos(a);
        ctx.textAlign = cosA < -0.1 ? 'right' : cosA > 0.1 ? 'left' : 'center';
        ctx.textBaseline = ly < cy - 5 ? 'bottom' : ly > cy + 5 ? 'top' : 'middle';
        ctx.fillText(`${config[i].name} ${v}`, lx, ly);
    }
}

/** 同步 RPG 分页可见性及各子区段显隐 */
function _syncRpgTabVisibility() {
    const sendBars = settings.rpgMode && settings.sendRpgBars !== false;
    const sendAttrs = settings.rpgMode && settings.sendRpgAttributes !== false;
    const sendSkills = settings.rpgMode && settings.sendRpgSkills !== false;
    const sendRep = settings.rpgMode && !!settings.sendRpgReputation;
    const sendEq = settings.rpgMode && !!settings.sendRpgEquipment;
    const sendLvl = settings.rpgMode && !!settings.sendRpgLevel;
    const sendCur = settings.rpgMode && !!settings.sendRpgCurrency;
    const sendSh = settings.rpgMode && !!settings.sendRpgStronghold;
    const hasContent = sendBars || sendAttrs || sendSkills || sendRep || sendEq || sendLvl || sendCur || sendSh;
    $('#horae-tab-btn-rpg').toggle(hasContent);
    $('#horae-rpg-bar-config-area').toggle(sendBars);
    $('#horae-rpg-attr-config-area').toggle(sendAttrs);
    $('.horae-rpg-manual-section').toggle(sendAttrs);
    $('.horae-rpg-skills-area').toggle(sendSkills);
    $('#horae-rpg-reputation-area').toggle(sendRep);
    $('#horae-rpg-equipment-area').toggle(sendEq);
    $('#horae-rpg-level-area').toggle(sendLvl);
    $('#horae-rpg-currency-area').toggle(sendCur);
    $('#horae-rpg-stronghold-area').toggle(sendSh);
}

/** 更新 RPG 分页（角色卡模式，按当前消息位置快照） */
function updateRpgDisplay() {
    if (!settings.rpgMode) return;
    const rpg = horaeManager.getRpgStateAt(0);
    const state = horaeManager.getLatestState();
    const container = document.getElementById('horae-tab-rpg');
    if (!container) return;

    const sendBars = settings.sendRpgBars !== false;
    const sendAttrs = settings.sendRpgAttributes !== false;
    const sendSkills = settings.sendRpgSkills !== false;
    const sendEq = !!settings.sendRpgEquipment;
    const sendRep = !!settings.sendRpgReputation;
    const sendLvl = !!settings.sendRpgLevel;
    const sendCur = !!settings.sendRpgCurrency;
    const sendSh = !!settings.sendRpgStronghold;
    const attrCfg = settings.rpgAttributeConfig || [];
    const hasAttrModule = sendAttrs && attrCfg.length > 0;
    const detailModules = [hasAttrModule, sendSkills, sendEq, sendRep, sendCur, sendSh].filter(Boolean).length;
    const moduleCount = [sendBars, hasAttrModule, sendSkills, sendEq, sendRep, sendLvl, sendCur, sendSh].filter(Boolean).length;
    const useCardLayout = detailModules >= 1 || moduleCount >= 2;

    // 配置区始终渲染
    renderBarConfig();
    renderAttrConfig();
    if (sendRep) {
        renderReputationConfig();
        renderReputationValues();
    }
    if (sendEq) {
        renderEquipmentValues();
        _bindEquipmentEvents();
    }
    if (sendCur) renderCurrencyConfig();
    if (sendLvl) renderLevelValues();
    if (sendSh) { renderStrongholdTree(); _bindStrongholdEvents(); }

    const barsSection = document.getElementById('horae-rpg-bars-section');
    const charCardsSection = document.getElementById('horae-rpg-char-cards');
    if (!barsSection || !charCardsSection) return;

    // 收集所有角色
    const allNames = new Set([
        ...Object.keys(rpg.bars || {}),
        ...Object.keys(rpg.status || {}),
        ...Object.keys(rpg.skills || {}),
        ...Object.keys(rpg.attributes || {}),
        ...Object.keys(rpg.reputation || {}),
        ...Object.keys(rpg.equipment || {}),
        ...Object.keys(rpg.levels || {}),
        ...Object.keys(rpg.xp || {}),
        ...Object.keys(rpg.currency || {}),
    ]);

    const _uoUserName = getContext().name1 || '';

    /** 构建单个角色的分页标签 HTML */
    function _buildCharTabs(name) {
        const tabs = [];
        const panels = [];
        const eid = name.replace(/[^a-zA-Z0-9]/g, '_');
        const _isU = (name === _uoUserName);
        const attrs = rpg.attributes?.[name] || {};
        const skills = rpg.skills?.[name] || [];
        const charEq = rpg.equipment?.[name] || {};
        const charRep = rpg.reputation?.[name] || {};
        const charCur = rpg.currency?.[name] || {};
        const charLv = rpg.levels?.[name];
        const charXp = rpg.xp?.[name];

        if (hasAttrModule && (!settings.rpgAttrsUserOnly || _isU)) {
            tabs.push({ id: `attr_${eid}`, label: t('ui.rpgTabAttr') });
            const hasAttrs = Object.keys(attrs).length > 0;
            const viewMode = settings.rpgAttrViewMode || 'radar';
            let html = '<div class="horae-rpg-attr-section">';
            html += `<div class="horae-rpg-attr-header"><span>${t('label.attributes')}</span><button class="horae-rpg-charattr-edit" data-char="${escapeHtml(name)}" title="${t('tooltip.addEditCharAttr')}"><i class="fa-solid fa-pen-to-square"></i></button></div>`;
            if (hasAttrs) {
                if (viewMode === 'radar') {
                    html += `<canvas class="horae-rpg-radar" data-char="${escapeHtml(name)}"></canvas>`;
                } else {
                    html += '<div class="horae-rpg-attr-text">';
                    for (const a of attrCfg) html += `<div class="horae-rpg-attr-row"><span>${escapeHtml(a.name)}</span><span>${attrs[a.key] ?? '?'}</span></div>`;
                    html += '</div>';
                }
            } else {
                html += `<div class="horae-rpg-skills-empty">${t('characters.noRecords')}</div>`;
            }
            html += '</div>';
            panels.push(html);
        }
        if (sendSkills && (!settings.rpgSkillsUserOnly || _isU)) {
            tabs.push({ id: `skill_${eid}`, label: t('ui.rpgTabSkill') });
            let html = '';
            if (skills.length > 0) {
                html += '<div class="horae-rpg-card-skills">';
                for (const sk of skills) {
                    html += `<details class="horae-rpg-skill-detail"><summary class="horae-rpg-skill-summary">${escapeHtml(sk.name)}`;
                    if (sk.level) html += ` <span class="horae-rpg-skill-lv">${escapeHtml(sk.level)}</span>`;
                    html += `<button class="horae-rpg-skill-del" data-owner="${escapeHtml(name)}" data-skill="${escapeHtml(sk.name)}" title="${t('common.delete')}"><i class="fa-solid fa-xmark"></i></button></summary>`;
                    if (sk.desc) html += `<div class="horae-rpg-skill-desc">${escapeHtml(sk.desc)}</div>`;
                    html += '</details>';
                }
                html += '</div>';
            } else {
                html += `<div class="horae-rpg-skills-empty">${t('ui.noSkills')}</div>`;
            }
            panels.push(html);
        }
        if (sendEq && (!settings.rpgEquipmentUserOnly || _isU)) {
            tabs.push({ id: `eq_${eid}`, label: t('ui.rpgTabEquip') });
            let html = '';
            const rawCharEq = _getEqValues()?.[name] || charEq;
            const cardCharCfg = _getCharEqConfig(name);
            const cardDeletedSlots = new Set(cardCharCfg._deletedSlots || []);
            const cardActiveSlots = _getActiveEqSlots(cardCharCfg);
            const cardActiveSlotNames = new Set(cardActiveSlots.map(s => s.name));
            const hasActiveSlotConfig = cardActiveSlotNames.size > 0;
            const activeForm = _getActiveEqForm(cardCharCfg);
            const inactiveTitle = t('ui.equipmentInactiveReason', { form: activeForm?.name || t('ui.defaultForm') });
            const slotEntries = Object.entries(rawCharEq).filter(([slotName, items]) =>
                !cardDeletedSlots.has(slotName) && Array.isArray(items) && items.length > 0);
            if (slotEntries.length > 0) {
                html += '<div class="horae-rpg-card-eq">';
                for (const [slotName, items] of slotEntries) {
                    for (const item of items) {
                        const attrStr = Object.entries(item.attrs || {}).map(([k, v]) => `${k}${v >= 0 ? '+' : ''}${v}`).join(', ');
                        const inactive = hasActiveSlotConfig && !cardActiveSlotNames.has(slotName);
                        html += `<div class="horae-rpg-card-eq-item${inactive ? ' horae-rpg-card-eq-item-inactive' : ''}"${inactive ? ` title="${escapeHtml(inactiveTitle)}"` : ''}>`;
                        if (inactive) html += `<span class="horae-rpg-eq-inactive-badge"><i class="fa-solid fa-triangle-exclamation"></i> ${t('ui.inactive')}</span> `;
                        html += `<span class="horae-rpg-card-eq-slot">[${escapeHtml(slotName)}]</span> ${escapeHtml(item.name)}`;
                        if (attrStr) html += ` <span class="horae-rpg-card-eq-attrs">(${attrStr})</span>`;
                        html += '</div>';
                    }
                }
                html += '</div>';
            } else {
                html += `<div class="horae-rpg-skills-empty">${t('ui.noEquipment')}</div>`;
            }
            panels.push(html);
        }
        if (sendRep && (!settings.rpgReputationUserOnly || _isU)) {
            tabs.push({ id: `rep_${eid}`, label: t('ui.rpgTabReputation') });
            let html = '';
            const catEntries = Object.entries(charRep);
            if (catEntries.length > 0) {
                html += '<div class="horae-rpg-card-rep">';
                for (const [catName, data] of catEntries) {
                    html += `<div class="horae-rpg-card-rep-row"><span>${escapeHtml(catName)}</span><span>${data.value}</span></div>`;
                }
                html += '</div>';
            } else {
                html += `<div class="horae-rpg-skills-empty">${t('ui.noReputationData')}</div>`;
            }
            panels.push(html);
        }
        // 等级/XP 现在直接显示在状态条上方，不再作为独立标签
        if (sendCur && (!settings.rpgCurrencyUserOnly || _isU)) {
            tabs.push({ id: `cur_${eid}`, label: t('ui.rpgTabCurrency') });
            const denomConfig = rpg.currencyConfig?.denominations || [];
            let html = '<div class="horae-rpg-card-cur">';
            const hasCur = denomConfig.some(d => charCur[d.name] != null);
            if (hasCur) {
                for (const d of denomConfig) {
                    const val = charCur[d.name] ?? 0;
                    const emojiStr = d.emoji ? `${d.emoji} ` : '';
                    html += `<div class="horae-rpg-card-cur-row"><span>${emojiStr}${escapeHtml(d.name)}</span><span>${val}</span></div>`;
                }
            } else {
                html += `<div class="horae-rpg-skills-empty">${t('ui.noCurrencyData')}</div>`;
            }
            html += '</div>';
            panels.push(html);
        }
        if (tabs.length === 0) return '';
        let html = '<div class="horae-rpg-card-tabs" data-char="' + escapeHtml(name) + '">';
        html += '<div class="horae-rpg-card-tab-bar">';
        for (let i = 0; i < tabs.length; i++) {
            html += `<button class="horae-rpg-card-tab-btn${i === 0 ? ' active' : ''}" data-idx="${i}">${tabs[i].label}</button>`;
        }
        html += '</div>';
        for (let i = 0; i < panels.length; i++) {
            html += `<div class="horae-rpg-card-tab-panel${i === 0 ? ' active' : ''}" data-idx="${i}">${panels[i]}</div>`;
        }
        html += '</div>';
        return html;
    }

    if (useCardLayout) {
        barsSection.style.display = '';
        const presentChars = new Set((state.scene?.characters_present || []).map(n => n.trim()).filter(Boolean));
        const userName = getContext().name1 || '';
        const inScene = [], offScene = [];
        for (const name of allNames) {
            let isInScene = presentChars.has(name);
            if (!isInScene && name === userName) {
                for (const p of presentChars) {
                    if (p.includes(name) || name.includes(p)) { isInScene = true; break; }
                }
            }
            if (!isInScene) {
                for (const p of presentChars) {
                    if (p.includes(name) || name.includes(p)) { isInScene = true; break; }
                }
            }
            (isInScene ? inScene : offScene).push(name);
        }
        const sortedNames = [...inScene, ...offScene];

        let barsHtml = '';
        for (const name of sortedNames) {
            const bars = rpg.bars[name];
            const effects = rpg.status?.[name] || [];
            const npc = state.npcs[name];
            const profession = npc?.personality?.split(/[,，]/)?.[0]?.trim() || '';
            const isPresent = inScene.includes(name);
            const charLv = rpg.levels?.[name];

            if (!isPresent) continue;
            const _isUser = (name === userName);
            barsHtml += '<div class="horae-rpg-char-block">';

            if (sendBars && (!settings.rpgBarsUserOnly || _isUser)) {
                barsHtml += '<div class="horae-rpg-char-card horae-rpg-bar-card">';
                // 角色名行: 名称 + 等级 + 状态图标 ...... 货币（右端）
                barsHtml += '<div class="horae-rpg-bar-card-header">';
                barsHtml += `<span class="horae-rpg-char-name">${escapeHtml(name)}</span>`;
                if (sendLvl && charLv != null && (!settings.rpgLevelUserOnly || _isUser)) barsHtml += `<span class="horae-rpg-lv-badge">Lv.${charLv}</span>`;
                for (const e of effects) {
                    barsHtml += `<i class="fa-solid ${getStatusIcon(e)} horae-rpg-hud-effect" title="${escapeHtml(e)}"></i>`;
                }
                let curRightHtml = '';
                const charCurTop = rpg.currency?.[name] || {};
                const denomCfgTop = rpg.currencyConfig?.denominations || [];
                if (sendCur && (!settings.rpgCurrencyUserOnly || _isUser) && denomCfgTop.length > 0) {
                    for (const d of denomCfgTop) {
                        const v = charCurTop[d.name];
                        if (v != null) curRightHtml += `<span class="horae-rpg-hud-cur-tag">${d.emoji || '💰'}${v}</span>`;
                    }
                }
                if (curRightHtml) barsHtml += `<span class="horae-rpg-bar-card-right">${curRightHtml}</span>`;
                barsHtml += '</div>';
                // XP 条
                const charXpTop = rpg.xp?.[name];
                if (sendLvl && (!settings.rpgLevelUserOnly || _isUser) && charXpTop && charXpTop[1] > 0) {
                    const xpPct = Math.min(100, Math.round(charXpTop[0] / charXpTop[1] * 100));
                    barsHtml += `<div class="horae-rpg-bar"><span class="horae-rpg-bar-label">XP</span><div class="horae-rpg-bar-track"><div class="horae-rpg-bar-fill" style="width:${xpPct}%;background:#a78bfa;"></div></div><span class="horae-rpg-bar-val">${charXpTop[0]}/${charXpTop[1]}</span></div>`;
                }
                if (bars) {
                    for (const [type, val] of Object.entries(bars)) {
                        const label = getRpgBarName(type, val[2]);
                        const cur = val[0], max = val[1];
                        const pct = max > 0 ? Math.min(100, Math.round(cur / max * 100)) : 0;
                        const color = getRpgBarColor(type);
                        barsHtml += `<div class="horae-rpg-bar"><span class="horae-rpg-bar-label">${escapeHtml(label)}</span><div class="horae-rpg-bar-track"><div class="horae-rpg-bar-fill" style="width:${pct}%;background:${color};"></div></div><span class="horae-rpg-bar-val">${cur}/${max}</span></div>`;
                    }
                }
                if (effects.length > 0) {
                    barsHtml += `<div class="horae-rpg-status-label">${t('ui.statusList')}</div><div class="horae-rpg-status-detail">`;
                    for (const e of effects) barsHtml += `<div class="horae-rpg-status-item"><i class="fa-solid ${getStatusIcon(e)} horae-rpg-status-icon"></i><span>${escapeHtml(e)}</span></div>`;
                    barsHtml += '</div>';
                }
                barsHtml += '</div>';
            }

            const tabContent = _buildCharTabs(name);
            if (tabContent) {
                barsHtml += `<details class="horae-rpg-char-detail"><summary class="horae-rpg-char-summary"><span class="horae-rpg-char-detail-name">${escapeHtml(name)}</span>`;
                if (sendLvl && (!settings.rpgLevelUserOnly || _isUser) && rpg.levels?.[name] != null) barsHtml += `<span class="horae-rpg-lv-badge">Lv.${rpg.levels[name]}</span>`;
                if (profession) barsHtml += `<span class="horae-rpg-char-prof">${escapeHtml(profession)}</span>`;
                barsHtml += `</summary><div class="horae-rpg-char-detail-body">${tabContent}</div></details>`;
            }
            barsHtml += '</div>';
        }
        barsSection.innerHTML = barsHtml;
        charCardsSection.innerHTML = '';
        charCardsSection.style.display = 'none';

        // 分页标签点击事件
        barsSection.querySelectorAll('.horae-rpg-card-tab-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const tabs = this.closest('.horae-rpg-card-tabs');
                const idx = this.dataset.idx;
                tabs.querySelectorAll('.horae-rpg-card-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.idx === idx));
                tabs.querySelectorAll('.horae-rpg-card-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.idx === idx));
            });
        });
    } else {
        charCardsSection.innerHTML = '';
        charCardsSection.style.display = 'none';
        let barsHtml = '';
        for (const name of allNames) {
            if (settings.rpgBarsUserOnly && name !== userName) continue;
            const bars = rpg.bars[name] || {};
            const effects = rpg.status?.[name] || [];
            if (!Object.keys(bars).length && !effects.length) continue;
            let h = `<div class="horae-rpg-char-card"><div class="horae-rpg-char-name">${escapeHtml(name)}</div>`;
            for (const [type, val] of Object.entries(bars)) {
                const label = getRpgBarName(type, val[2]);
                const cur = val[0], max = val[1];
                const pct = max > 0 ? Math.min(100, Math.round(cur / max * 100)) : 0;
                const color = getRpgBarColor(type);
                h += `<div class="horae-rpg-bar"><span class="horae-rpg-bar-label">${escapeHtml(label)}</span><div class="horae-rpg-bar-track"><div class="horae-rpg-bar-fill" style="width:${pct}%;background:${color};"></div></div><span class="horae-rpg-bar-val">${cur}/${max}</span></div>`;
            }
            if (effects.length > 0) {
                h += `<div class="horae-rpg-status-label">${t('ui.statusList')}</div><div class="horae-rpg-status-detail">`;
                for (const e of effects) h += `<div class="horae-rpg-status-item"><i class="fa-solid ${getStatusIcon(e)} horae-rpg-status-icon"></i><span>${escapeHtml(e)}</span></div>`;
                h += '</div>';
            }
            h += '</div>';
            barsHtml += h;
        }
        barsSection.innerHTML = barsHtml;
    }

    // 技能平铺列表：角色卡模式下隐藏
    const skillsSection = document.getElementById('horae-rpg-skills-section');
    if (skillsSection) {
        if (useCardLayout && sendSkills) {
            skillsSection.innerHTML = `<div class="horae-rpg-skills-empty">${t('ui.skillsInCard')}</div>`;
        } else {
            const hasSkills = Object.values(rpg.skills).some(arr => arr?.length > 0);
            let skillsHtml = '';
            if (hasSkills) {
                for (const [name, skills] of Object.entries(rpg.skills)) {
                    if (!skills?.length) continue;
                    if (settings.rpgSkillsUserOnly && name !== userName) continue;
                    skillsHtml += `<div class="horae-rpg-skill-group"><div class="horae-rpg-char-name">${escapeHtml(name)}</div>`;
                    for (const sk of skills) {
                        const lv = sk.level ? `<span class="horae-rpg-skill-lv">${escapeHtml(sk.level)}</span>` : '';
                        const desc = sk.desc ? `<div class="horae-rpg-skill-desc">${escapeHtml(sk.desc)}</div>` : '';
                        skillsHtml += `<div class="horae-rpg-skill-card"><div class="horae-rpg-skill-header"><span class="horae-rpg-skill-name">${escapeHtml(sk.name)}</span>${lv}<button class="horae-rpg-skill-del" data-owner="${escapeHtml(name)}" data-skill="${escapeHtml(sk.name)}" title="${t('common.delete')}"><i class="fa-solid fa-xmark"></i></button></div>${desc}</div>`;
                    }
                    skillsHtml += '</div>';
                }
            } else {
                skillsHtml = `<div class="horae-rpg-skills-empty">${t('ui.noSkillsAddManually')}</div>`;
            }
            skillsSection.innerHTML = skillsHtml;
        }
    }

    // 绘制雷达图
    document.querySelectorAll('.horae-rpg-radar').forEach(canvas => {
        const charName = canvas.dataset.char;
        const vals = rpg.attributes?.[charName] || {};
        drawRadarChart(canvas, vals, attrCfg);
    });

    updateAllRpgHuds();
}

/** 渲染属性面板配置列表 */
function renderAttrConfig() {
    const list = document.getElementById('horae-rpg-attr-config-list');
    if (!list) return;
    const attrs = settings.rpgAttributeConfig || [];
    list.innerHTML = attrs.map((a, i) => `
        <div class="horae-rpg-config-row" data-idx="${i}">
            <input class="horae-rpg-config-key" value="${escapeHtml(a.key)}" maxlength="10" data-idx="${i}" data-type="attr" placeholder="key" title="${t('ui.rpgKeyHint')}" />
            <input class="horae-rpg-config-name" value="${escapeHtml(a.name)}" maxlength="8" data-idx="${i}" data-type="attr" title="${t('ui.rpgDisplayNameHint')}" />
            <input class="horae-rpg-attr-desc" value="${escapeHtml(a.desc || '')}" placeholder="${t('label.description')}" data-idx="${i}" title="${t('ui.rpgDefinitionHint')}" />
            <button class="horae-rpg-attr-del" data-idx="${i}" title="${t('common.delete')}"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

// ============================================
// 声望系统 UI
// ============================================

/** 获取 _rpgConfigs 权威存储（顶层键，独立于 rpg 对象，不受 rebuild 影响） */
function _ensureRpgConfigs() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return null;
    if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
    if (!chat[0].horae_meta._rpgConfigs) {
        chat[0].horae_meta._rpgConfigs = {};
    }
    return chat[0].horae_meta._rpgConfigs;
}

/** 将 _rpgConfigs 同步到 rpg 对象上（供 _mergeRpgData 等内部函数使用） */
function _syncConfigsToRpg() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return;
    const meta = chat[0].horae_meta;
    if (!meta?._rpgConfigs) return;
    if (!meta.rpg) meta.rpg = {};
    const c = meta._rpgConfigs;
    if (c.reputationConfig) meta.rpg.reputationConfig = c.reputationConfig;
    if (c.equipmentConfig) meta.rpg.equipmentConfig = c.equipmentConfig;
    if (c.currencyConfig) meta.rpg.currencyConfig = c.currencyConfig;
    if (c._deletedSkills) meta.rpg._deletedSkills = c._deletedSkills;
    if (c._deletedStrongholds) meta.rpg._deletedStrongholds = c._deletedStrongholds;
}

function _getRepConfig() {
    const c = _ensureRpgConfigs();
    if (!c) return { categories: [], _deletedCategories: [] };
    if (!c.reputationConfig) {
        // 迁移：从 rpg 内部读旧数据
        const chat = horaeManager.getChat();
        const oldCfg = chat[0]?.horae_meta?.rpg?.reputationConfig;
        c.reputationConfig = oldCfg && oldCfg.categories?.length
            ? oldCfg
            : { categories: [], _deletedCategories: [] };
    }
    return c.reputationConfig;
}

function _getRepValues() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return {};
    if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
    if (!chat[0].horae_meta.rpg) chat[0].horae_meta.rpg = {};
    if (!chat[0].horae_meta.rpg.reputation) chat[0].horae_meta.rpg.reputation = {};
    return chat[0].horae_meta.rpg.reputation;
}

function _saveRepData() {
    _syncConfigsToRpg();
    getContext().saveChat();
}

/** 渲染声望分类配置列表 */
function renderReputationConfig() {
    const list = document.getElementById('horae-rpg-rep-config-list');
    if (!list) return;
    const config = _getRepConfig();
    if (!config.categories.length) {
        list.innerHTML = `<div class="horae-rpg-skills-empty">${t('ui.noReputationCategories')}</div>`;
        return;
    }
    list.innerHTML = config.categories.map((cat, i) => `
        <div class="horae-rpg-config-row" data-idx="${i}">
            <input class="horae-rpg-rep-name" value="${escapeHtml(cat.name)}" placeholder="${t('placeholder.reputationName')}" data-idx="${i}" />
            <input class="horae-rpg-rep-range" value="${cat.min}" type="number" style="width:48px" title="${t('label.minValue')}" data-idx="${i}" data-field="min" />
            <span style="opacity:.5">~</span>
            <input class="horae-rpg-rep-range" value="${cat.max}" type="number" style="width:48px" title="${t('label.maxValue')}" data-idx="${i}" data-field="max" />
            <button class="horae-rpg-btn-sm horae-rpg-rep-subitems" data-idx="${i}" title="${t('tooltip.editSubitems')}"><i class="fa-solid fa-list-ul"></i></button>
            <button class="horae-rpg-rep-del" data-idx="${i}" title="${t('common.delete')}"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

/** 渲染声望数值（每个角色的声望列表） */
function renderReputationValues() {
    const section = document.getElementById('horae-rpg-rep-values-section');
    if (!section) return;
    const config = _getRepConfig();
    const repValues = _getRepValues();
    if (!config.categories.length) { section.innerHTML = ''; return; }

    const allOwners = new Set(Object.keys(repValues));
    const rpg = horaeManager.getRpgStateAt(0);
    for (const name of Object.keys(rpg.bars || {})) allOwners.add(name);

    const _repUO = !!settings.rpgReputationUserOnly;
    const _userName = getContext().name1 || '';

    if (!allOwners.size) {
        section.innerHTML = `<div class="horae-rpg-skills-empty">${t('ui.noReputationValues')}</div>`;
        return;
    }

    let html = '';
    for (const owner of allOwners) {
        if (_repUO && owner !== _userName) continue;
        const ownerData = repValues[owner] || {};
        html += `<details class="horae-rpg-char-detail"><summary class="horae-rpg-char-summary"><span class="horae-rpg-char-detail-name">${escapeHtml(owner)} ${t('ui.reputation')}</span></summary><div class="horae-rpg-char-detail-body">`;
        for (const cat of config.categories) {
            const data = ownerData[cat.name] || { value: cat.default ?? 0, subItems: {} };
            const range = (cat.max ?? 100) - (cat.min ?? -100);
            const offset = data.value - (cat.min ?? -100);
            const pct = range > 0 ? Math.min(100, Math.round(offset / range * 100)) : 50;
            const color = data.value >= 0 ? '#22c55e' : '#ef4444';
            html += `<div class="horae-rpg-bar">
                <span class="horae-rpg-bar-label">${escapeHtml(cat.name)}</span>
                <div class="horae-rpg-bar-track"><div class="horae-rpg-bar-fill" style="width:${pct}%;background:${color};"></div></div>
                <span class="horae-rpg-bar-val horae-rpg-rep-val-edit" data-owner="${escapeHtml(owner)}" data-cat="${escapeHtml(cat.name)}" title="${t('common.edit')}">${data.value}</span>
            </div>`;
            if (Object.keys(data.subItems || {}).length > 0) {
                html += '<div style="padding-left:16px;opacity:.8;font-size:.85em;">';
                for (const [subName, subVal] of Object.entries(data.subItems)) {
                    html += `<div>${escapeHtml(subName)}: ${subVal}</div>`;
                }
                html += '</div>';
            }
        }
        html += '</div></details>';
    }
    section.innerHTML = html;
}


/** 弹出编辑声望分类细项的对话框 */
function _openRepSubItemsDialog(catIndex) {
    const config = _getRepConfig();
    const cat = config.categories[catIndex];
    if (!cat) return;
    const subItems = (cat.subItems || []).slice();
    const modal = document.createElement('div');
    modal.className = 'horae-modal';
    modal.innerHTML = `
        <div class="horae-modal-content" style="max-width:400px;width:92vw;box-sizing:border-box;">
            <div class="horae-modal-header"><h3>${t('ui.reputationSubitemTitle', { name: escapeHtml(cat.name) })}</h3></div>
            <div class="horae-modal-body">
                <p style="margin-bottom:8px;opacity:.7;font-size:.9em;">${t('ui.reputationSubitemHint')}</p>
                <div id="horae-rep-subitems-list"></div>
                <button id="horae-rep-subitems-add" class="horae-btn-add-rep-subitem"><i class="fa-solid fa-plus"></i> ${t('ui.addSubitem')}</button>
            </div>
            <div class="horae-modal-footer">
                <button id="horae-rep-subitems-ok" class="horae-btn primary">${t('common.confirm')}</button>
                <button id="horae-rep-subitems-cancel" class="horae-btn">${t('common.cancel')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    preventModalBubble(modal);

    function renderList() {
        const list = modal.querySelector('#horae-rep-subitems-list');
        list.innerHTML = subItems.map((s, i) => `
            <div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">
                <input class="horae-rpg-rep-subitem-input" value="${escapeHtml(s)}" data-idx="${i}" style="flex:1;" placeholder="${t('placeholder.subitemName')}" />
                <button class="horae-rpg-rep-subitem-del" data-idx="${i}" title="${t('common.delete')}"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `).join('');
    }
    renderList();

    modal.querySelector('#horae-rep-subitems-add').onclick = () => { subItems.push(''); renderList(); };
    modal.addEventListener('click', e => {
        if (e.target.closest('.horae-rpg-rep-subitem-del')) {
            const idx = parseInt(e.target.closest('.horae-rpg-rep-subitem-del').dataset.idx);
            subItems.splice(idx, 1);
            renderList();
        }
    });
    modal.addEventListener('input', e => {
        if (e.target.matches('.horae-rpg-rep-subitem-input')) {
            subItems[parseInt(e.target.dataset.idx)] = e.target.value.trim();
        }
    });
    modal.querySelector('#horae-rep-subitems-ok').onclick = () => {
        cat.subItems = subItems.filter(s => s);
        _saveRepData();
        modal.remove();
        renderReputationConfig();
    };
    modal.querySelector('#horae-rep-subitems-cancel').onclick = () => modal.remove();
}

/** 声望分类配置事件绑定 */
function _bindReputationConfigEvents() {
    const container = document.getElementById('horae-tab-rpg');
    if (!container) return;

    // 添加声望分类
    $('#horae-rpg-rep-add').off('click').on('click', () => {
        const config = _getRepConfig();
        config.categories.push({ name: t('ui.newReputation'), min: -100, max: 100, default: 0, subItems: [] });
        _saveRepData();
        renderReputationConfig();
        renderReputationValues();
    });

    // 名称/范围编辑
    $(container).off('input.repconfig').on('input.repconfig', '.horae-rpg-rep-name, .horae-rpg-rep-range', function () {
        const idx = parseInt(this.dataset.idx);
        const config = _getRepConfig();
        const cat = config.categories[idx];
        if (!cat) return;
        if (this.classList.contains('horae-rpg-rep-name')) {
            cat.name = this.value.trim();
        } else {
            const field = this.dataset.field;
            cat[field] = parseInt(this.value) || 0;
        }
        _saveRepData();
    });

    // 细项编辑按钮
    $(container).off('click.repsubitems').on('click.repsubitems', '.horae-rpg-rep-subitems', function () {
        _openRepSubItemsDialog(parseInt(this.dataset.idx));
    });

    // 删除声望分类
    $(container).off('click.repdel').on('click.repdel', '.horae-rpg-rep-del', function () {
        if (!confirm(t('confirm.deleteTable'))) return;
        const idx = parseInt(this.dataset.idx);
        const config = _getRepConfig();
        const deleted = config.categories.splice(idx, 1)[0];
        if (deleted?.name) {
            if (!config._deletedCategories) config._deletedCategories = [];
            config._deletedCategories.push(deleted.name);
            // 清除所有角色该分类的数值
            const repValues = _getRepValues();
            for (const owner of Object.keys(repValues)) {
                delete repValues[owner][deleted.name];
                if (!Object.keys(repValues[owner]).length) delete repValues[owner];
            }
        }
        _saveRepData();
        renderReputationConfig();
        renderReputationValues();
    });

    // 手动编辑声望数值
    $(container).off('click.repvaledit').on('click.repvaledit', '.horae-rpg-rep-val-edit', function () {
        const owner = this.dataset.owner;
        const catName = this.dataset.cat;
        const config = _getRepConfig();
        const cat = config.categories.find(c => c.name === catName);
        if (!cat) return;
        const repValues = _getRepValues();
        if (!repValues[owner]) repValues[owner] = {};
        if (!repValues[owner][catName]) repValues[owner][catName] = { value: cat.default ?? 0, subItems: {} };
        const current = repValues[owner][catName].value;
        const newVal = prompt(t('toast.reputationPrompt', { owner, cat: catName, min: cat.min ?? -100, max: cat.max ?? 100 }), current);
        if (newVal === null) return;
        const parsed = parseInt(newVal);
        if (isNaN(parsed)) return;
        repValues[owner][catName].value = Math.max(cat.min ?? -100, Math.min(cat.max ?? 100, parsed));
        repValues[owner][catName]._userEdited = true;
        _saveRepData();
        renderReputationValues();
    });

    // 导出声望配置
    $('#horae-rpg-rep-export').off('click').on('click', () => {
        const config = _getRepConfig();
        const data = { horae_reputation_config: { version: 1, categories: config.categories } };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'horae-reputation-config.json';
        a.click();
        URL.revokeObjectURL(a.href);
        showToast(t('toast.reputationExported'), 'success');
    });

    // 导入声望配置
    $('#horae-rpg-rep-import').off('click').on('click', () => {
        document.getElementById('horae-rpg-rep-import-file')?.click();
    });
    $('#horae-rpg-rep-import-file').off('change').on('change', function () {
        const file = this.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const imported = data?.horae_reputation_config;
                if (!imported?.categories?.length) {
                    showToast(t('toast.invalidFile'), 'error');
                    return;
                }
                if (!confirm(t('confirm.importReputation', { n: imported.categories.length }))) return;
                const config = _getRepConfig();
                const existingNames = new Set(config.categories.map(c => c.name));
                let added = 0;
                for (const cat of imported.categories) {
                    if (existingNames.has(cat.name)) continue;
                    config.categories.push({
                        name: cat.name,
                        min: cat.min ?? -100,
                        max: cat.max ?? 100,
                        default: cat.default ?? 0,
                        subItems: cat.subItems || [],
                    });
                    // 从删除黑名单中移除（如果之前删过同名的）
                    if (config._deletedCategories) {
                        config._deletedCategories = config._deletedCategories.filter(n => n !== cat.name);
                    }
                    added++;
                }
                _saveRepData();
                renderReputationConfig();
                renderReputationValues();
                showToast(t('toast.reputationImported', { n: added }), 'success');
            } catch (err) {
                showToast(t('toast.importFailed', { error: err.message }), 'error');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
}

// ============================================
// 装备栏 UI
// ============================================

/** 获取装备配置根对象 { locked, perChar: { name: { slots, _deletedSlots } } } */
function _getEqConfigMap() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return { locked: false, perChar: {} };
    if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
    if (!chat[0].horae_meta.rpg) chat[0].horae_meta.rpg = {};
    const c = _ensureRpgConfigs();
    // 优先从 _rpgConfigs 读取
    let cfg = c?.equipmentConfig || chat[0].horae_meta.rpg.equipmentConfig;
    if (!cfg) {
        cfg = { locked: false, perChar: {} };
        if (c) c.equipmentConfig = cfg;
        chat[0].horae_meta.rpg.equipmentConfig = cfg;
        return cfg;
    }
    // 旧格式迁移：{ slots: [...] } → { perChar: { owner: { slots } } }
    if (Array.isArray(cfg.slots)) {
        const oldSlots = cfg.slots;
        const locked = !!cfg.locked;
        const oldDeleted = cfg._deletedSlots || [];
        const eqValues = chat[0].horae_meta.rpg.equipment || {};
        const perChar = {};
        for (const owner of Object.keys(eqValues)) {
            perChar[owner] = { slots: JSON.parse(JSON.stringify(oldSlots)), _deletedSlots: [...oldDeleted] };
        }
        cfg = { locked, perChar };
    }
    if (!cfg.perChar) cfg.perChar = {};
    // 同步到两个存储位置
    if (c) c.equipmentConfig = cfg;
    chat[0].horae_meta.rpg.equipmentConfig = cfg;
    return cfg;
}

/** 获取某角色的装备格位配置 */
function _getCharEqConfig(owner) {
    const map = _getEqConfigMap();
    if (!map.perChar[owner]) map.perChar[owner] = { slots: [], _deletedSlots: [] };
    _normalizeCharEqConfig(map.perChar[owner]);
    return map.perChar[owner];
}

function _normalizeCharEqConfig(charCfg) {
    if (!charCfg) return;
    if (!Array.isArray(charCfg.slots)) charCfg.slots = [];
    if (!Array.isArray(charCfg._deletedSlots)) charCfg._deletedSlots = [];
    if (Array.isArray(charCfg.forms) && charCfg.forms.length) {
        charCfg.forms = charCfg.forms.map((form, idx) => ({
            id: String(form.id || `form_${idx + 1}`),
            name: String(form.name || form.id || `Form ${idx + 1}`),
            slots: (Array.isArray(form.slots) ? form.slots : []).map(_normalizeEquipSlot).filter(Boolean),
        })).filter(f => f.slots.length);
        if (!charCfg.currentForm || !charCfg.forms.some(f => f.id === charCfg.currentForm)) {
            charCfg.currentForm = charCfg.forms[0]?.id || 'default';
        }
        const active = _getActiveEqForm(charCfg);
        if (active?.slots?.length) charCfg.slots = JSON.parse(JSON.stringify(active.slots));
    } else if (charCfg.slots.length) {
        charCfg.forms = [{ id: 'default', name: t('ui.defaultForm'), slots: JSON.parse(JSON.stringify(charCfg.slots)) }];
        charCfg.currentForm = 'default';
    }
}

function _getActiveEqForm(charCfg) {
    if (!charCfg?.forms?.length) return null;
    return charCfg.forms.find(f => f.id === charCfg.currentForm) || charCfg.forms[0] || null;
}

function _getActiveEqSlots(charCfg) {
    const active = _getActiveEqForm(charCfg);
    return Array.isArray(active?.slots) && active.slots.length ? active.slots : (charCfg?.slots || []);
}

function _applyEqForm(charCfg, formId) {
    if (!charCfg?.forms?.length) return;
    const form = charCfg.forms.find(f => f.id === formId) || charCfg.forms[0];
    charCfg.currentForm = form.id;
    charCfg.slots = JSON.parse(JSON.stringify(form.slots));
}

function _normalizeEqTemplateMatchText(value) {
    return String(value || '')
        .trim()
        .toLocaleLowerCase()
        .normalize('NFKC')
        .replace(/[「」『』"'\s]/g, '');
}

function _getEquipTemplateMatchAliases(tpl) {
    const aliases = new Set([tpl?.name, tpl?.id, ...(tpl?.aliases || [])].filter(Boolean));
    return [...aliases].map(_normalizeEqTemplateMatchText).filter(Boolean);
}

function _findAutoEquipTemplateForRace(race) {
    const raceKey = _normalizeEqTemplateMatchText(race);
    if (!raceKey || HORAEEQ_AMBIGUOUS_TEMPLATE_ALIASES.has(raceKey)) return null;
    const tpls = (settings.equipmentTemplates || []).map(_normalizeEquipTemplate).filter(Boolean);
    const matches = tpls.filter(tpl => {
        const aliases = _getEquipTemplateMatchAliases(tpl);
        return aliases.includes(raceKey) && !aliases.some(a => a === raceKey && HORAEEQ_AMBIGUOUS_TEMPLATE_ALIASES.has(a));
    });
    return matches.length === 1 ? matches[0] : null;
}

function _applyEquipTemplateToCharConfig(charCfg, tpl, race) {
    const forms = JSON.parse(JSON.stringify(tpl.forms?.length ? tpl.forms : [{ id: 'default', name: t('ui.defaultForm'), slots: tpl.slots }]));
    charCfg.forms = forms;
    charCfg.currentForm = forms[0]?.id || 'default';
    _applyEqForm(charCfg, charCfg.currentForm);
    charCfg._deletedSlots = [];
    charCfg._template = tpl.name;
    charCfg._autoTemplate = true;
    charCfg._autoRace = race;
    charCfg._manualLocked = false;
}

function _autoApplyEquipmentTemplatesByRace({ persist = false } = {}) {
    if (!settings.rpgMode || !settings.sendRpgEquipment) return false;
    const state = horaeManager.getLatestState();
    const npcs = state?.npcs || {};
    if (!Object.keys(npcs).length) return false;
    const cfgMap = _getEqConfigMap();
    let changed = false;
    for (const [owner, info] of Object.entries(npcs)) {
        const race = String(info?.race || '').trim();
        if (!race) continue;
        const tpl = _findAutoEquipTemplateForRace(race);
        if (!tpl) continue;
        const charCfg = cfgMap.perChar[owner] || { slots: [], _deletedSlots: [] };
        _normalizeCharEqConfig(charCfg);
        const hasUserConfig = !!charCfg._manualLocked || ((charCfg.slots?.length || 0) > 0 && !charCfg._autoTemplate);
        if (hasUserConfig) continue;
        if (charCfg._autoTemplate && charCfg._template === tpl.name && charCfg._autoRace === race) continue;
        _applyEquipTemplateToCharConfig(charCfg, tpl, race);
        cfgMap.perChar[owner] = charCfg;
        changed = true;
    }
    if (changed) {
        _syncConfigsToRpg();
        if (persist) _saveEqData();
    }
    return changed;
}

function _getEqValues() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return {};
    if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
    if (!chat[0].horae_meta.rpg) chat[0].horae_meta.rpg = {};
    if (!chat[0].horae_meta.rpg.equipment) chat[0].horae_meta.rpg.equipment = {};
    return chat[0].horae_meta.rpg.equipment;
}

function _saveEqData() {
    getContext().saveChat();
}

/** renderEquipmentSlotConfig 已废弃，格位配置合并到角色装备面板 */
function renderEquipmentSlotConfig() { /* noop - per-char config in renderEquipmentValues */ }

/** 渲染统一装备面板（每角色独立格位 + 装备） */
function renderEquipmentValues() {
    const section = document.getElementById('horae-rpg-eq-values-section');
    if (!section) return;
    _autoApplyEquipmentTemplatesByRace({ persist: true });
    const eqValues = _getEqValues();
    const cfgMap = _getEqConfigMap();
    const lockBtn = document.getElementById('horae-rpg-eq-lock');
    if (lockBtn) {
        lockBtn.querySelector('i').className = cfgMap.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open';
        lockBtn.title = cfgMap.locked ? t('ui.equipLocked') : t('ui.equipUnlocked');
    }
    const rpg = horaeManager.getRpgStateAt(0);
    const allOwners = new Set([...Object.keys(eqValues), ...Object.keys(cfgMap.perChar), ...Object.keys(rpg.bars || {})]);
    const _eqUO = !!settings.rpgEquipmentUserOnly;
    const _eqUserName = getContext().name1 || '';

    if (!allOwners.size) {
        section.innerHTML = `<div class="horae-rpg-skills-empty">${t('ui.noEquipCharData')}</div>`;
        return;
    }

    let html = '';
    for (const owner of allOwners) {
        if (_eqUO && owner !== _eqUserName) continue;
        const charCfg = _getCharEqConfig(owner);
        const ownerSlots = eqValues[owner] || {};
        const deletedSlots = new Set(charCfg._deletedSlots || []);
        const activeSlots = _getActiveEqSlots(charCfg);
        const activeSlotNames = new Set(activeSlots.map(s => s.name));
        const activeForm = _getActiveEqForm(charCfg);
        const formSelectHtml = charCfg.forms?.length > 1 ? `
            <select class="horae-rpg-eq-form-select" data-owner="${escapeHtml(owner)}" title="${t('ui.equipmentFormHint')}">
                ${charCfg.forms.map(f => `<option value="${escapeHtml(f.id)}"${f.id === charCfg.currentForm ? ' selected' : ''}>${escapeHtml(f.name)}</option>`).join('')}
            </select>` : (activeForm ? `<span class="horae-rpg-eq-form-badge">${escapeHtml(activeForm.name)}</span>` : '');
        let hasItems = false;
        let itemsHtml = '';
        for (const slot of activeSlots) {
            if (deletedSlots.has(slot.name)) continue;
            const items = ownerSlots[slot.name] || [];
            if (items.length > 0) hasItems = true;
            const slotDesc = slot.desc ? `<span class="horae-rpg-eq-slot-desc" title="${escapeHtml(slot.desc)}">${escapeHtml(slot.desc)}</span>` : '';
            itemsHtml += `<div class="horae-rpg-eq-slot-group"><span class="horae-rpg-eq-slot-label">${escapeHtml(slot.name)} (${items.length}/${slot.maxCount ?? 1})${slotDesc}</span>`;
            if (items.length > 0) {
                for (const item of items) {
                    const attrStr = Object.entries(item.attrs || {}).map(([k, v]) => `<span class="horae-rpg-eq-attr">${escapeHtml(k)} ${v >= 0 ? '+' : ''}${v}</span>`).join(' ');
                    const meta = item._itemMeta || {};
                    const iconHtml = meta.icon ? `<span class="horae-rpg-eq-item-icon">${meta.icon}</span>` : '';
                    const descHtml = meta.description ? `<div class="horae-rpg-eq-item-desc">${escapeHtml(meta.description)}</div>` : '';
                    itemsHtml += `<div class="horae-rpg-eq-item">
                        <div class="horae-rpg-eq-item-header">
                            ${iconHtml}<span class="horae-rpg-eq-item-name">${escapeHtml(item.name)}</span> ${attrStr}
                            <button class="horae-rpg-eq-item-del" data-owner="${escapeHtml(owner)}" data-slot="${escapeHtml(slot.name)}" data-item="${escapeHtml(item.name)}" title="${t('tooltip.unequipReturn')}"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
                        </div>
                        ${descHtml}
                    </div>`;
                }
            } else {
                itemsHtml += `<div style="opacity:.4;font-size:.85em;padding:2px 0;">${t('ui.emptySlot')}</div>`;
            }
            itemsHtml += '</div>';
        }
        const inactiveEntries = [];
        for (const [slotName, items] of Object.entries(ownerSlots)) {
            if (!items?.length || activeSlotNames.has(slotName) || deletedSlots.has(slotName)) continue;
            for (const item of items) inactiveEntries.push({ slotName, item });
        }
        if (inactiveEntries.length) {
            hasItems = true;
            itemsHtml += `<div class="horae-rpg-eq-inactive-group">
                <div class="horae-rpg-eq-inactive-title"><i class="fa-solid fa-triangle-exclamation"></i> ${t('ui.equipmentInactiveTitle')}</div>`;
            for (const { slotName, item } of inactiveEntries) {
                const meta = item._itemMeta || {};
                const attrStr = Object.entries(item.attrs || {}).map(([k, v]) => `<span class="horae-rpg-eq-attr">${escapeHtml(k)} ${v >= 0 ? '+' : ''}${v}</span>`).join(' ');
                const descHtml = meta.description ? `<div class="horae-rpg-eq-item-desc">${escapeHtml(meta.description)}</div>` : '';
                const title = t('ui.equipmentInactiveReason', { form: activeForm?.name || t('ui.defaultForm') });
                itemsHtml += `<div class="horae-rpg-eq-item horae-rpg-eq-item-inactive" title="${escapeHtml(title)}">
                    <div class="horae-rpg-eq-item-header">
                        <span class="horae-rpg-eq-inactive-badge"><i class="fa-solid fa-triangle-exclamation"></i> ${t('ui.inactive')}</span>
                        ${meta.icon ? `<span class="horae-rpg-eq-item-icon">${meta.icon}</span>` : ''}
                        <span class="horae-rpg-eq-item-name">${escapeHtml(item.name)}</span> ${attrStr}
                        <span class="horae-rpg-eq-item-slot">${escapeHtml(slotName)}</span>
                        <button class="horae-rpg-eq-item-del" data-owner="${escapeHtml(owner)}" data-slot="${escapeHtml(slotName)}" data-item="${escapeHtml(item.name)}" title="${t('tooltip.unequipReturn')}"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
                    </div>
                    ${descHtml}
                    <div class="horae-rpg-eq-inactive-reason">${escapeHtml(title)}</div>
                </div>`;
            }
            itemsHtml += '</div>';
        }
        html += `<details class="horae-rpg-char-detail"${hasItems ? ' open' : ''}>
            <summary class="horae-rpg-char-summary">
                <span class="horae-rpg-char-detail-name">${t('ui.equipLabel', { owner: escapeHtml(owner) })}</span>
                ${formSelectHtml}
                <span style="flex:1;"></span>
                <button class="horae-rpg-btn-sm horae-rpg-eq-char-tpl" data-owner="${escapeHtml(owner)}" title="${t('tooltip.loadTemplate')}"><i class="fa-solid fa-shapes"></i></button>
                <button class="horae-rpg-btn-sm horae-rpg-eq-char-add-slot" data-owner="${escapeHtml(owner)}" title="${t('tooltip.addSlot')}"><i class="fa-solid fa-plus"></i></button>
                <button class="horae-rpg-btn-sm horae-rpg-eq-char-del-slot" data-owner="${escapeHtml(owner)}" title="${t('tooltip.deleteSlot')}"><i class="fa-solid fa-minus"></i></button>
            </summary>
            <div class="horae-rpg-char-detail-body">${itemsHtml}
                <button class="horae-rpg-btn-sm horae-rpg-eq-add-item" data-owner="${escapeHtml(owner)}" style="margin-top:6px;width:100%;"><i class="fa-solid fa-plus"></i> ${t('ui.addEquipManual')}</button>
            </div>
        </details>`;
    }
    section.innerHTML = html;
    // 隐藏旧的全局格位列表
    const oldList = document.getElementById('horae-rpg-eq-slot-list');
    if (oldList) oldList.innerHTML = '';
}

/** 手动添加装备对话框 */
function _openAddEquipDialog(owner) {
    const charCfg = _getCharEqConfig(owner);
    if (!charCfg.slots.length) { showToast(t('toast.noSlots', { owner }), 'warning'); return; }
    const modal = document.createElement('div');
    modal.className = 'horae-modal';
    modal.innerHTML = `
        <div class="horae-modal-content" style="max-width:420px;width:92vw;box-sizing:border-box;">
            <div class="horae-modal-header"><h3>${t('modal.addEquipment')}</h3></div>
            <div class="horae-modal-body">
                <div class="horae-edit-field">
                    <label>${t('label.slot')}</label>
                    <select id="horae-eq-add-slot">
                        ${charCfg.slots.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${s.maxCount ?? 1})</option>`).join('')}
                    </select>
                </div>
                <div class="horae-edit-field">
                    <label>${t('label.name')}</label>
                    <input id="horae-eq-add-name" type="text" placeholder="${t('placeholder.equipName')}" />
                </div>
                <div class="horae-edit-field">
                    <label>${t('label.attributes')}</label>
                    <textarea id="horae-eq-add-attrs" rows="4" placeholder="${t('placeholder.equipAttrs')}"></textarea>
                </div>
            </div>
            <div class="horae-modal-footer">
                <button id="horae-eq-add-ok" class="horae-btn primary">${t('common.confirm')}</button>
                <button id="horae-eq-add-cancel" class="horae-btn">${t('common.cancel')}</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    preventModalBubble(modal);
    modal.querySelector('#horae-eq-add-ok').onclick = () => {
        const slotName = modal.querySelector('#horae-eq-add-slot').value;
        const itemName = modal.querySelector('#horae-eq-add-name').value.trim();
        if (!itemName) { showToast(t('toast.equipNameRequired'), 'warning'); return; }
        const attrsText = modal.querySelector('#horae-eq-add-attrs').value;
        const attrs = {};
        for (const line of attrsText.split('\n')) {
            const m = line.trim().match(/^(.+?)=(-?\d+)$/);
            if (m) attrs[m[1].trim()] = parseInt(m[2]);
        }
        const eqValues = _getEqValues();
        if (!eqValues[owner]) eqValues[owner] = {};
        if (!eqValues[owner][slotName]) eqValues[owner][slotName] = [];
        const slotCfg = charCfg.slots.find(s => s.name === slotName);
        const maxCount = slotCfg?.maxCount ?? 1;
        if (eqValues[owner][slotName].length >= maxCount) {
            if (!confirm(t('confirm.importEquipment'))) return;
            const bumped = eqValues[owner][slotName].shift();
            if (bumped) _unequipToItems(owner, slotName, bumped.name, true);
        }
        eqValues[owner][slotName].push({ name: itemName, attrs, _itemMeta: {} });
        _saveEqData();
        modal.remove();
        renderEquipmentValues();
        _bindEquipmentEvents();
    };
    modal.querySelector('#horae-eq-add-cancel').onclick = () => modal.remove();
}

/** 装备栏事件绑定 */
function _bindEquipmentEvents() {
    const container = document.getElementById('horae-tab-rpg');
    if (!container) return;

    // 为角色加载模板
    $(container).off('click.eqchartpl').on('click.eqchartpl', '.horae-rpg-eq-char-tpl', function (e) {
        e.stopPropagation();
        const owner = this.dataset.owner;
        const tpls = (settings.equipmentTemplates || []).map(_normalizeEquipTemplate).filter(Boolean);
        if (!tpls.length) { showToast(t('toast.noTemplates'), 'warning'); return; }
        const modal = document.createElement('div');
        modal.className = 'horae-modal';
        let listHtml = tpls.map((tpl, i) => {
            const formStr = tpl.forms?.length > 1 ? tpl.forms.map(f => `${f.name}:${f.slots.map(s => s.name).join('、')}`).join(' / ') : tpl.slots.map(s => s.name).join('、');
            const partsStr = tpl.parts?.length ? `<div class="horae-rpg-tpl-parts">${escapeHtml(tpl.parts.join(' + '))}</div>` : '';
            return `<div class="horae-rpg-tpl-item" data-idx="${i}" style="cursor:pointer;">
                <div class="horae-rpg-tpl-name">${escapeHtml(tpl.name)}</div>
                <div class="horae-rpg-tpl-slots">${escapeHtml(formStr)}${partsStr}</div>
            </div>`;
        }).join('');
        modal.innerHTML = `
            <div class="horae-modal-content" style="max-width:400px;width:90vw;box-sizing:border-box;">
                <div class="horae-modal-header"><h3>${t('modal.selectTemplate', { owner: escapeHtml(owner) })}</h3></div>
                <div class="horae-modal-body" style="max-height:50vh;overflow-y:auto;">
                    <div style="margin-bottom:8px;font-size:11px;color:var(--horae-text-muted);">
                        ${t('ui.templateReplaceHint')}
                    </div>
                    ${listHtml}
                </div>
                <div class="horae-modal-footer">
                    <button class="horae-btn primary" id="horae-eq-tpl-save"><i class="fa-solid fa-floppy-disk"></i> ${t('ui.saveAsTemplate')}</button>
                    <button class="horae-btn" id="horae-eq-tpl-close">${t('common.cancel')}</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        preventModalBubble(modal);
        modal.querySelector('#horae-eq-tpl-close').onclick = () => modal.remove();
        modal.querySelector('#horae-eq-tpl-save').onclick = () => {
            const charCfg = _getCharEqConfig(owner);
            if (!charCfg.slots.length) { showToast(t('toast.noSlotsToSave', { owner }), 'warning'); return; }
            const name = prompt(t('label.name') + ':', '');
            if (!name?.trim()) return;
            settings.equipmentTemplates.push({
                name: name.trim(),
                aliases: [name.trim()],
                parts: ['manual'],
                slots: JSON.parse(JSON.stringify(_getActiveEqSlots(charCfg).map(s => ({ name: s.name, maxCount: s.maxCount ?? 1, ...(s.desc ? { desc: s.desc } : {}) })))),
                forms: JSON.parse(JSON.stringify(charCfg.forms?.length ? charCfg.forms : [{ id: 'default', name: t('ui.defaultForm'), slots: _getActiveEqSlots(charCfg) }])),
            });
            saveSettingsDebounced();
            modal.remove();
            showToast(t('toast.templateSaved', { name: name.trim() }), 'success');
        };
        modal.querySelectorAll('.horae-rpg-tpl-item').forEach(item => {
            item.onclick = () => {
                const idx = parseInt(item.dataset.idx);
                const tpl = tpls[idx];
                if (!tpl) return;
                const charCfg = _getCharEqConfig(owner);
                charCfg.forms = JSON.parse(JSON.stringify(tpl.forms?.length ? tpl.forms : [{ id: 'default', name: t('ui.defaultForm'), slots: tpl.slots }]));
                charCfg.currentForm = charCfg.forms[0]?.id || 'default';
                _applyEqForm(charCfg, charCfg.currentForm);
                charCfg._deletedSlots = [];
                charCfg._template = tpl.name;
                charCfg._manualLocked = true;
                _saveEqData();
                renderEquipmentValues();
                _bindEquipmentEvents();
                horaeManager.init(getContext(), settings);
                _refreshSystemPromptDisplay();
                updateTokenCounter();
                modal.remove();
                showToast(t('toast.templateLoaded', { owner, name: tpl.name }), 'success');
            };
        });
    });

    // 为角色添加格位
    $(container).off('click.eqcharaddslot').on('click.eqcharaddslot', '.horae-rpg-eq-char-add-slot', function (e) {
        e.stopPropagation();
        const owner = this.dataset.owner;
        const name = prompt(t('label.name') + ':', '');
        if (!name?.trim()) return;
        const maxStr = prompt(t('label.quantity') + ':', '1');
        const maxCount = Math.max(1, parseInt(maxStr) || 1);
        const charCfg = _getCharEqConfig(owner);
        if (charCfg.slots.some(s => s.name === name.trim())) { showToast(t('toast.slotExists'), 'warning'); return; }
        const newSlot = { name: name.trim(), maxCount };
        const activeForm = _getActiveEqForm(charCfg);
        if (activeForm) activeForm.slots.push(newSlot);
        charCfg.slots.push(newSlot);
        charCfg._manualLocked = true;
        if (charCfg._deletedSlots) charCfg._deletedSlots = charCfg._deletedSlots.filter(n => n !== name.trim());
        _saveEqData();
        renderEquipmentValues();
        _bindEquipmentEvents();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    // 为角色删除格位
    $(container).off('click.eqchardelslot').on('click.eqchardelslot', '.horae-rpg-eq-char-del-slot', function (e) {
        e.stopPropagation();
        const owner = this.dataset.owner;
        const charCfg = _getCharEqConfig(owner);
        if (!charCfg.slots.length) { showToast(t('toast.charNoSlots'), 'warning'); return; }
        const names = charCfg.slots.map(s => s.name);
        const name = prompt(t('toast.deleteSlotPrompt', { slots: names.join(', ') }), '');
        if (!name?.trim()) return;
        const idx = charCfg.slots.findIndex(s => s.name === name.trim());
        if (idx < 0) { showToast(t('toast.itemNotFound', { name: name.trim() }), 'warning'); return; }
        if (!confirm(t('confirm.deleteTable'))) return;
        const deleted = charCfg.slots.splice(idx, 1)[0];
        const activeForm = _getActiveEqForm(charCfg);
        if (activeForm) activeForm.slots = activeForm.slots.filter(s => s.name !== deleted.name);
        charCfg._manualLocked = true;
        if (!charCfg._deletedSlots) charCfg._deletedSlots = [];
        charCfg._deletedSlots.push(deleted.name);
        const eqValues = _getEqValues();
        if (eqValues[owner]) {
            delete eqValues[owner][deleted.name];
            if (!Object.keys(eqValues[owner]).length) delete eqValues[owner];
        }
        _saveEqData();
        renderEquipmentValues();
        _bindEquipmentEvents();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    // 切换角色当前形态。装备不会自动卸下，不兼容格位会显示为未激活。
    $(container).off('change.eqform').on('change.eqform', '.horae-rpg-eq-form-select', function (e) {
        e.stopPropagation();
        const owner = this.dataset.owner;
        const charCfg = _getCharEqConfig(owner);
        _applyEqForm(charCfg, this.value);
        charCfg._manualLocked = true;
        _saveEqData();
        renderEquipmentValues();
        _bindEquipmentEvents();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        showToast(t('toast.equipmentFormChanged', { owner, form: _getActiveEqForm(charCfg)?.name || this.value }), 'success');
    });
    $(container).off('click.eqform').on('click.eqform', '.horae-rpg-eq-form-select', function (e) {
        e.stopPropagation();
    });

    // 锁定/解锁
    $('#horae-rpg-eq-lock').off('click').on('click', () => {
        const cfgMap = _getEqConfigMap();
        cfgMap.locked = !cfgMap.locked;
        _saveEqData();
        const lockBtn = document.getElementById('horae-rpg-eq-lock');
        if (lockBtn) {
            lockBtn.querySelector('i').className = cfgMap.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open';
            lockBtn.title = cfgMap.locked ? t('ui.locked') : t('ui.clickToLock');
        }
    });

    // 卸下装备
    $(container).off('click.eqitemdel').on('click.eqitemdel', '.horae-rpg-eq-item-del', function () {
        const owner = this.dataset.owner;
        const slotName = this.dataset.slot;
        const itemName = this.dataset.item;
        _unequipToItems(owner, slotName, itemName, false);
        renderEquipmentValues();
        _bindEquipmentEvents();
        updateItemsDisplay();
        updateAllRpgHuds();
        showToast(t('toast.itemUnequipped', { item: itemName, owner, slot: slotName }), 'info');
    });

    // 手动添加装备
    $(container).off('click.eqadditem').on('click.eqadditem', '.horae-rpg-eq-add-item', function () {
        _openAddEquipDialog(this.dataset.owner);
    });

    // 导出全部装备配置
    $('#horae-rpg-eq-export').off('click').on('click', () => {
        const cfgMap = _getEqConfigMap();
        const blob = new Blob([JSON.stringify({ horae_equipment_config: { version: 2, perChar: cfgMap.perChar, locked: cfgMap.locked } }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'horae-equipment-config.json'; a.click();
        showToast(t('toast.equipmentExported'), 'success');
    });

    // 导入装备配置
    $('#horae-rpg-eq-import').off('click').on('click', () => {
        document.getElementById('horae-rpg-eq-import-file')?.click();
    });
    $('#horae-rpg-eq-import-file').off('change').on('change', function () {
        const file = this.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const imported = data?.horae_equipment_config;
                if (!imported) { showToast(t('toast.invalidFile'), 'error'); return; }
                if (imported.version === 2 && imported.perChar) {
                    if (!confirm(t('confirm.importEquipment'))) return;
                    const cfgMap = _getEqConfigMap();
                    for (const [owner, cfg] of Object.entries(imported.perChar)) {
                        cfgMap.perChar[owner] = JSON.parse(JSON.stringify(cfg));
                    }
                    if (imported.locked !== undefined) cfgMap.locked = imported.locked;
                } else if (imported.slots?.length) {
                    if (!confirm(t('confirm.importEquipment'))) return;
                    const cfgMap = _getEqConfigMap();
                    const eqValues = _getEqValues();
                    for (const owner of Object.keys(eqValues)) {
                        const charCfg = _getCharEqConfig(owner);
                        const existing = new Set(charCfg.slots.map(s => s.name));
                        for (const slot of imported.slots) {
                            if (!existing.has(slot.name)) charCfg.slots.push({ name: slot.name, maxCount: slot.maxCount ?? 1 });
                        }
                    }
                } else { showToast(t('toast.invalidFile'), 'error'); return; }
                _saveEqData();
                renderEquipmentValues();
                _bindEquipmentEvents();
                horaeManager.init(getContext(), settings);
                _refreshSystemPromptDisplay();
                updateTokenCounter();
                showToast(t('toast.equipmentImported'), 'success');
            } catch (err) { showToast(t('toast.importFailed', { error: err.message }), 'error'); }
        };
        reader.readAsText(file);
        this.value = '';
    });

    // 管理模板（全局模板增删）
    $('#horae-rpg-eq-preset').off('click').on('click', () => {
        _openEquipTemplateManageModal();
    });
}

/** 全局模板管理（增删模板，不加载到角色） */
function _openEquipTemplateManageModal() {
    const modal = document.createElement('div');
    modal.className = 'horae-modal';
    function _render() {
        const tpls = (settings.equipmentTemplates || []).map(_normalizeEquipTemplate).filter(Boolean);
        let listHtml = tpls.map((tpl, i) => {
            const slotsStr = tpl.forms?.length > 1
                ? tpl.forms.map(f => `${f.name}:${f.slots.map(s => s.name).join('、')}`).join(' / ')
                : tpl.slots.map(s => s.name).join('、');
            const partsStr = tpl.parts?.length ? `<div class="horae-rpg-tpl-parts">${escapeHtml(tpl.parts.join(' + '))}</div>` : '';
            return `<div class="horae-rpg-tpl-item"><div class="horae-rpg-tpl-name">${escapeHtml(tpl.name)}</div>
                <div class="horae-rpg-tpl-slots">${escapeHtml(slotsStr)}${partsStr}</div>
                <button class="horae-rpg-btn-sm horae-rpg-tpl-del" data-idx="${i}" title="${t('common.delete')}"><i class="fa-solid fa-trash"></i></button>
            </div>`;
        }).join('');
        if (!tpls.length) listHtml = `<div class="horae-rpg-skills-empty">${t('ui.noCustomTemplates')}</div>`;
        modal.innerHTML = `<div class="horae-modal-content" style="max-width:460px;width:90vw;box-sizing:border-box;">
            <div class="horae-modal-header"><h3>${t('modal.presetManager')}</h3></div>
            <div class="horae-modal-body" style="max-height:55vh;overflow-y:auto;">
                <div style="margin-bottom:6px;font-size:11px;color:var(--horae-text-muted);">${t('ui.templateManageHint')}</div>
                ${listHtml}
            </div>
            <div class="horae-modal-footer"><button class="horae-btn" id="horae-tpl-mgmt-close">${t('common.close')}</button></div>
        </div>`;
        modal.querySelector('#horae-tpl-mgmt-close').onclick = () => modal.remove();
        modal.querySelectorAll('.horae-rpg-tpl-del').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.idx);
                const tpl = settings.equipmentTemplates[idx];
                if (!confirm(t('confirm.deleteTheme', { name: tpl.name }))) return;
                settings.equipmentTemplates.splice(idx, 1);
                saveSettingsDebounced();
                _render();
            };
        });
    }
    document.body.appendChild(modal);
    preventModalBubble(modal);
    _render();
}

// ============ 货币系统配置 ============

function _getCurConfig() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return { denominations: [] };
    if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
    if (!chat[0].horae_meta.rpg) chat[0].horae_meta.rpg = {};
    const c = _ensureRpgConfigs();
    let cfg = c?.currencyConfig || chat[0].horae_meta.rpg.currencyConfig;
    if (!cfg) {
        cfg = { denominations: [] };
    }
    if (c) c.currencyConfig = cfg;
    chat[0].horae_meta.rpg.currencyConfig = cfg;
    return cfg;
}

function _saveCurData() {
    const ctx = getContext();
    if (ctx?.saveChat) ctx.saveChat();
}

function renderCurrencyConfig() {
    const list = document.getElementById('horae-rpg-cur-denom-list');
    if (!list) return;
    const config = _getCurConfig();
    if (!config.denominations.length) {
        list.innerHTML = `<div class="horae-rpg-skills-empty">${t('ui.noCurrencies')}</div>`;
        return;
    }
    list.innerHTML = config.denominations.map((d, i) => `
        <div class="horae-rpg-config-row" data-idx="${i}">
            <input class="horae-rpg-cur-emoji" value="${escapeHtml(d.emoji || '')}" placeholder="${t('placeholder.currencyEmoji')}" maxlength="2" data-idx="${i}" title="${t('label.icon')}" />
            <input class="horae-rpg-cur-name" value="${escapeHtml(d.name)}" placeholder="${t('placeholder.currencyName')}" data-idx="${i}" />
            <span style="opacity:.5;font-size:11px">${t('placeholder.currencyRate')}</span>
            <input class="horae-rpg-cur-rate" value="${d.rate}" type="number" min="1" style="width:60px" title="${t('placeholder.currencyRate')}" data-idx="${i}" />
            <button class="horae-rpg-cur-del" data-idx="${i}" title="${t('common.delete')}"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
    _renderCurrencyHint(config);
}

function _renderCurrencyHint(config) {
    const section = document.getElementById('horae-rpg-cur-values-section');
    if (!section) return;
    const denoms = config.denominations;
    if (denoms.length < 2) { section.innerHTML = ''; return; }
    const sorted = [...denoms].sort((a, b) => a.rate - b.rate);
    const base = sorted[0];
    const parts = sorted.map(d => `${d.rate / base.rate}${d.name}`).join(' = ');
    section.innerHTML = `<div class="horae-rpg-skills-empty" style="font-size:11px;opacity:.7">${t('ui.exchangeRate', { parts: escapeHtml(parts) })}</div>`;
}

function _bindCurrencyEvents() {
    // 添加币种
    $('#horae-rpg-cur-add').off('click').on('click', () => {
        const config = _getCurConfig();
        config.denominations.push({ name: t('ui.newCurrency'), rate: 1, emoji: '💰' });
        _saveCurData();
        renderCurrencyConfig();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    // 编辑币种 emoji
    $(document).off('change', '.horae-rpg-cur-emoji').on('change', '.horae-rpg-cur-emoji', function () {
        const config = _getCurConfig();
        const idx = parseInt(this.dataset.idx);
        config.denominations[idx].emoji = this.value.trim();
        _saveCurData();
    });

    // 编辑币种名称
    $(document).off('change', '.horae-rpg-cur-name').on('change', '.horae-rpg-cur-name', function () {
        const config = _getCurConfig();
        const idx = parseInt(this.dataset.idx);
        const oldName = config.denominations[idx].name;
        const newName = this.value.trim() || oldName;
        if (newName !== oldName) {
            config.denominations[idx].name = newName;
            _saveCurData();
            renderCurrencyConfig();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
        }
    });

    // 编辑兑换率
    $(document).off('change', '.horae-rpg-cur-rate').on('change', '.horae-rpg-cur-rate', function () {
        const config = _getCurConfig();
        const idx = parseInt(this.dataset.idx);
        const val = Math.max(1, parseInt(this.value) || 1);
        config.denominations[idx].rate = val;
        _saveCurData();
        renderCurrencyConfig();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    // 删除币种
    $(document).off('click', '.horae-rpg-cur-del').on('click', '.horae-rpg-cur-del', function () {
        const config = _getCurConfig();
        const idx = parseInt(this.dataset.idx);
        const name = config.denominations[idx].name;
        if (!confirm(t('confirm.deleteTable'))) return;
        config.denominations.splice(idx, 1);
        // 清除所有角色该币种的数值
        const chat = horaeManager.getChat();
        const curData = chat?.[0]?.horae_meta?.rpg?.currency;
        if (curData) {
            for (const owner of Object.keys(curData)) {
                delete curData[owner][name];
                if (!Object.keys(curData[owner]).length) delete curData[owner];
            }
        }
        _saveCurData();
        renderCurrencyConfig();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    // 导出
    $('#horae-rpg-cur-export').off('click').on('click', () => {
        const config = _getCurConfig();
        const blob = new Blob([JSON.stringify({ denominations: config.denominations }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'horae_currency_config.json';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    // 导入
    $('#horae-rpg-cur-import').off('click').on('click', () => {
        document.getElementById('horae-rpg-cur-import-file')?.click();
    });
    $('#horae-rpg-cur-import-file').off('change').on('change', function () {
        const file = this.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!imported.denominations?.length) { showToast(t('toast.invalidFile'), 'error'); return; }
                if (!confirm(t('confirm.importReputation', { n: imported.denominations.length }))) return;
                const config = _getCurConfig();
                const existingNames = new Set(config.denominations.map(d => d.name));
                let added = 0;
                for (const d of imported.denominations) {
                    if (existingNames.has(d.name)) continue;
                    config.denominations.push({ name: d.name, rate: d.rate ?? 1 });
                    added++;
                }
                _saveCurData();
                renderCurrencyConfig();
                horaeManager.init(getContext(), settings);
                _refreshSystemPromptDisplay();
                updateTokenCounter();
                showToast(t('toast.currencyImported', { n: added }), 'success');
            } catch (err) {
                showToast(t('toast.importFailed', { error: err.message }), 'error');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
}

// ══════════════ 据点/基地系统 ══════════════

function _getStrongholdData() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return [];
    if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
    if (!chat[0].horae_meta.rpg) chat[0].horae_meta.rpg = {};
    const c = _ensureRpgConfigs();
    let nodes = c?.strongholds || chat[0].horae_meta.rpg.strongholds;
    if (!nodes) nodes = [];
    if (c) c.strongholds = nodes;
    chat[0].horae_meta.rpg.strongholds = nodes;
    return nodes;
}
function _saveStrongholdData() { _syncConfigsToRpg(); getContext().saveChat(); }

function _genShId() { return 'sh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/** 构建子节点树 */
function _buildShTree(nodes, parentId) {
    return nodes
        .filter(n => (n.parent || null) === parentId)
        .map(n => ({ ...n, children: _buildShTree(nodes, n.id) }));
}

/** 渲染据点树形 UI */
function renderStrongholdTree() {
    const container = document.getElementById('horae-rpg-sh-tree');
    if (!container) return;
    const nodes = _getStrongholdData();
    if (!nodes.length) {
        container.innerHTML = `<div class="horae-rpg-skills-empty">${t('ui.noStrongholds')}</div>`;
        return;
    }
    const tree = _buildShTree(nodes, null);
    container.innerHTML = _renderShNodes(tree, 0);
}

function _renderShNodes(nodes, depth) {
    let html = '';
    for (const n of nodes) {
        const indent = depth * 16;
        const hasChildren = n.children && n.children.length > 0;
        const lvBadge = n.level != null ? `<span class="horae-rpg-hud-lv-badge" style="font-size:10px;">Lv.${n.level}</span>` : '';
        html += `<div class="horae-rpg-sh-node" data-id="${escapeHtml(n.id)}" style="padding-left:${indent}px;">`;
        html += `<div class="horae-rpg-sh-node-head">`;
        html += `<span class="horae-rpg-sh-node-name">${hasChildren ? '▼ ' : '• '}${escapeHtml(n.name)}</span>`;
        html += lvBadge;
        html += `<div class="horae-rpg-sh-node-actions">`;
        html += `<button class="horae-rpg-btn-sm horae-rpg-sh-add-child" data-id="${escapeHtml(n.id)}" title="${t('tooltip.addChild')}"><i class="fa-solid fa-plus"></i></button>`;
        html += `<button class="horae-rpg-btn-sm horae-rpg-sh-edit" data-id="${escapeHtml(n.id)}" title="${t('common.edit')}"><i class="fa-solid fa-pen"></i></button>`;
        html += `<button class="horae-rpg-btn-sm horae-rpg-sh-del" data-id="${escapeHtml(n.id)}" title="${t('common.delete')}"><i class="fa-solid fa-trash"></i></button>`;
        html += `</div></div>`;
        if (n.desc) {
            html += `<div class="horae-rpg-sh-node-desc" style="padding-left:${indent + 12}px;">${escapeHtml(n.desc)}</div>`;
        }
        if (hasChildren) html += _renderShNodes(n.children, depth + 1);
        html += '</div>';
    }
    return html;
}

function _openShEditDialog(nodeId) {
    const nodes = _getStrongholdData();
    const node = nodeId ? nodes.find(n => n.id === nodeId) : null;
    const isNew = !node;
    const modal = document.createElement('div');
    modal.className = 'horae-modal';
    modal.innerHTML = `
        <div class="horae-modal-content" style="max-width:400px;width:90vw;box-sizing:border-box;">
            <div class="horae-modal-header"><h3>${isNew ? t('ui.addStrongholdTitle') : t('ui.editStrongholdTitle')}</h3></div>
            <div class="horae-modal-body">
                <div class="horae-edit-field">
                    <label>${t('label.name')}</label>
                    <input id="horae-sh-name" type="text" value="${escapeHtml(node?.name || '')}" placeholder="${t('placeholder.strongholdName')}" />
                </div>
                <div class="horae-edit-field">
                    <label>${t('label.level')} (${t('common.skip').toLowerCase()})</label>
                    <input id="horae-sh-level" type="number" min="0" max="999" value="${node?.level ?? ''}" />
                </div>
                <div class="horae-edit-field">
                    <label>${t('label.description')}</label>
                    <textarea id="horae-sh-desc" rows="3" placeholder="${t('placeholder.strongholdDesc')}">${escapeHtml(node?.desc || '')}</textarea>
                </div>
            </div>
            <div class="horae-modal-footer">
                <button class="horae-btn primary" id="horae-sh-ok">${isNew ? t('common.add') : t('common.save')}</button>
                <button class="horae-btn" id="horae-sh-cancel">${t('common.cancel')}</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    preventModalBubble(modal);
    modal.querySelector('#horae-sh-ok').onclick = () => {
        const name = modal.querySelector('#horae-sh-name').value.trim();
        if (!name) { showToast(t('toast.strongholdNameRequired'), 'warning'); return; }
        const lvRaw = modal.querySelector('#horae-sh-level').value;
        const level = lvRaw !== '' ? parseInt(lvRaw) : null;
        const desc = modal.querySelector('#horae-sh-desc').value.trim();
        if (node) {
            node.name = name;
            node.level = level;
            node.desc = desc;
        }
        _saveStrongholdData();
        renderStrongholdTree();
        _bindStrongholdEvents();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        modal.remove();
    };
    modal.querySelector('#horae-sh-cancel').onclick = () => modal.remove();
    return modal;
}

function _bindStrongholdEvents() {
    const container = document.getElementById('horae-rpg-sh-tree');
    if (!container) return;

    // 添加根据点
    $('#horae-rpg-sh-add').off('click').on('click', () => {
        const nodes = _getStrongholdData();
        const modal = _openShEditDialog(null);
        modal.querySelector('#horae-sh-ok').onclick = () => {
            const name = modal.querySelector('#horae-sh-name').value.trim();
            if (!name) { showToast(t('toast.strongholdNameRequired'), 'warning'); return; }
            const lvRaw = modal.querySelector('#horae-sh-level').value;
            const level = lvRaw !== '' ? parseInt(lvRaw) : null;
            const desc = modal.querySelector('#horae-sh-desc').value.trim();
            nodes.push({ id: _genShId(), name, level, desc, parent: null, _userAdded: true });
            _saveStrongholdData();
            renderStrongholdTree();
            _bindStrongholdEvents();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
            modal.remove();
        };
    });

    // 添加子节点
    container.querySelectorAll('.horae-rpg-sh-add-child').forEach(btn => {
        btn.onclick = () => {
            const parentId = btn.dataset.id;
            const nodes = _getStrongholdData();
            const modal = _openShEditDialog(null);
            modal.querySelector('#horae-sh-ok').onclick = () => {
                const name = modal.querySelector('#horae-sh-name').value.trim();
                if (!name) { showToast(t('toast.nameRequired'), 'warning'); return; }
                const lvRaw = modal.querySelector('#horae-sh-level').value;
                const level = lvRaw !== '' ? parseInt(lvRaw) : null;
                const desc = modal.querySelector('#horae-sh-desc').value.trim();
                nodes.push({ id: _genShId(), name, level, desc, parent: parentId, _userAdded: true });
                _saveStrongholdData();
                renderStrongholdTree();
                _bindStrongholdEvents();
                horaeManager.init(getContext(), settings);
                modal.remove();
            };
        };
    });

    // 编辑
    container.querySelectorAll('.horae-rpg-sh-edit').forEach(btn => {
        btn.onclick = () => { _openShEditDialog(btn.dataset.id); };
    });

    // 删除（递归删除子节点 + 记录到 _deletedStrongholds 防回滚）
    container.querySelectorAll('.horae-rpg-sh-del').forEach(btn => {
        btn.onclick = () => {
            const nodes = _getStrongholdData();
            const id = btn.dataset.id;
            const node = nodes.find(n => n.id === id);
            if (!node) return;
            function countDescendants(pid) {
                const kids = nodes.filter(n => n.parent === pid);
                return kids.length + kids.reduce((s, k) => s + countDescendants(k.id), 0);
            }
            const desc = countDescendants(id);
            const childDesc = desc > 0 ? t('ui.andChildNodes', { n: desc }) : '';
            const msg = t('confirm.deleteStronghold', { name: node.name, childDesc }) + (desc > 0 ? ' ' + t('confirm.deleteStrongholdUndo') : '');
            if (!confirm(msg)) return;
            const chat = horaeManager.getChat();
            const rpg = chat?.[0]?.horae_meta?.rpg;
            if (rpg) {
                if (!rpg._deletedStrongholds) rpg._deletedStrongholds = [];
                const cfgs = _ensureRpgConfigs();
                if (cfgs && !cfgs._deletedStrongholds) cfgs._deletedStrongholds = rpg._deletedStrongholds;
                function collectDeleted(pid) {
                    const n = nodes.find(x => x.id === pid);
                    if (n) {
                        const parentNode = n.parent ? nodes.find(x => x.id === n.parent) : null;
                        const entry = { name: n.name, parent: parentNode?.name || null };
                        rpg._deletedStrongholds.push(entry);
                        if (cfgs && cfgs._deletedStrongholds !== rpg._deletedStrongholds) cfgs._deletedStrongholds.push(entry);
                    }
                    nodes.filter(x => x.parent === pid).forEach(k => collectDeleted(k.id));
                }
                collectDeleted(id);
            }
            function removeRecursive(pid) {
                const kids = nodes.filter(n => n.parent === pid);
                for (const k of kids) removeRecursive(k.id);
                const idx = nodes.findIndex(n => n.id === pid);
                if (idx >= 0) nodes.splice(idx, 1);
            }
            removeRecursive(id);
            _saveStrongholdData();
            renderStrongholdTree();
            _bindStrongholdEvents();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
        };
    });

    // 导出
    $('#horae-rpg-sh-export').off('click').on('click', () => {
        const data = _getStrongholdData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'horae_strongholds.json'; a.click();
    });
    // 导入
    $('#horae-rpg-sh-import').off('click').on('click', () => {
        document.getElementById('horae-rpg-sh-import-file')?.click();
    });
    $('#horae-rpg-sh-import-file').off('change').on('change', function () {
        const file = this.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!Array.isArray(imported)) throw new Error(t('ui.invalidFormat'));
                const nodes = _getStrongholdData();
                const existingNames = new Set(nodes.map(n => n.name));
                const idMap = {};
                let added = 0;
                for (const n of imported) {
                    if (!n.name) continue;
                    if (existingNames.has(n.name)) {
                        const existing = nodes.find(x => x.name === n.name);
                        if (existing && n.id) idMap[n.id] = existing.id;
                        continue;
                    }
                    const newId = _genShId();
                    if (n.id) idMap[n.id] = newId;
                    nodes.push({ id: newId, name: n.name, level: n.level ?? null, desc: n.desc || '', parent: n.parent || null });
                    existingNames.add(n.name);
                    added++;
                }
                for (const node of nodes) {
                    if (node.parent && idMap[node.parent]) {
                        node.parent = idMap[node.parent];
                    }
                }
                _saveStrongholdData();
                renderStrongholdTree();
                _bindStrongholdEvents();
                showToast(t('toast.strongholdImported', { n: added }), 'success');
            } catch (err) { showToast(t('toast.importFailed', { error: err.message }), 'error'); }
        };
        reader.readAsText(file);
        this.value = '';
    });
}

/** 渲染等级/经验值数据（配置面板） */
function renderLevelValues() {
    const section = document.getElementById('horae-rpg-level-values-section');
    if (!section) return;
    const snapshot = horaeManager.getRpgStateAt(0);
    const chat = horaeManager.getChat();
    const baseRpg = chat?.[0]?.horae_meta?.rpg || {};
    const mergedLevels = { ...(snapshot.levels || {}), ...(baseRpg.levels || {}) };
    const mergedXp = { ...(snapshot.xp || {}), ...(baseRpg.xp || {}) };
    const allNames = new Set([...Object.keys(mergedLevels), ...Object.keys(mergedXp), ...Object.keys(snapshot.bars || {})]);
    const _lvUO = !!settings.rpgLevelUserOnly;
    const _lvUserName = getContext().name1 || '';
    let html = `<div style="display:flex;justify-content:flex-end;margin-bottom:6px;"><button class="horae-rpg-btn-sm horae-rpg-lv-add" title="${t('ui.addLevelCharTitle')}"><i class="fa-solid fa-plus"></i> ${t('ui.addLevelChar')}</button></div>`;
    if (!allNames.size) {
        html += `<div class="horae-rpg-skills-empty">${t('ui.noLevelData')}</div>`;
    }
    for (const name of allNames) {
        if (_lvUO && name !== _lvUserName) continue;
        const lv = mergedLevels[name];
        const xp = mergedXp[name];
        const xpCur = xp ? xp[0] : 0;
        const xpMax = xp ? xp[1] : 0;
        const pct = xpMax > 0 ? Math.min(100, Math.round(xpCur / xpMax * 100)) : 0;
        html += `<div class="horae-rpg-lv-entry" data-char="${escapeHtml(name)}">`;
        html += `<div class="horae-rpg-lv-entry-header">`;
        html += `<span class="horae-rpg-lv-entry-name">${escapeHtml(name)}</span>`;
        html += `<span class="horae-rpg-hud-lv-badge">${lv != null ? 'Lv.' + lv : '--'}</span>`;
        html += `<button class="horae-rpg-btn-sm horae-rpg-lv-edit" data-char="${escapeHtml(name)}" title="${t('tooltip.editLevelXp')}"><i class="fa-solid fa-pen-to-square"></i></button>`;
        html += `</div>`;
        if (xpMax > 0) {
            html += `<div class="horae-rpg-lv-xp-row"><div class="horae-rpg-bar-track"><div class="horae-rpg-bar-fill" style="width:${pct}%;background:#a78bfa;"></div></div><span class="horae-rpg-lv-xp-label">${xpCur}/${xpMax} (${pct}%)</span></div>`;
        }
        html += '</div>';
    }
    section.innerHTML = html;

    const _lvEditHandler = (charName) => {
        const chat2 = horaeManager.getChat();
        if (!chat2?.length) return;
        if (!chat2[0].horae_meta) chat2[0].horae_meta = createEmptyMeta();
        if (!chat2[0].horae_meta.rpg) chat2[0].horae_meta.rpg = {};
        const rpgData = chat2[0].horae_meta.rpg;
        const curLv = rpgData.levels?.[charName] ?? '';
        const newLv = prompt(t('toast.levelPrompt', { name: charName }), curLv);
        if (newLv === null) return;
        const lvVal = parseInt(newLv);
        if (isNaN(lvVal) || lvVal < 0) { showToast(t('toast.invalidLevelNumber'), 'warning'); return; }
        if (!rpgData.levels) rpgData.levels = {};
        if (!rpgData.xp) rpgData.xp = {};
        rpgData.levels[charName] = lvVal;
        const xpMax = Math.max(100, lvVal * 100);
        const curXp = rpgData.xp[charName];
        if (!curXp || curXp[1] <= 0) {
            rpgData.xp[charName] = [0, xpMax];
        } else {
            rpgData.xp[charName] = [curXp[0], xpMax];
        }
        getContext().saveChat();
        renderLevelValues();
        updateAllRpgHuds();
        showToast(t('toast.levelSet', { name: charName, level: lvVal, xp: xpMax }), 'success');
    };

    section.querySelectorAll('.horae-rpg-lv-edit').forEach(btn => {
        btn.addEventListener('click', () => _lvEditHandler(btn.dataset.char));
    });

    const addBtn = section.querySelector('.horae-rpg-lv-add');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const charName = prompt(t('label.npcName') + ':');
            if (!charName?.trim()) return;
            _lvEditHandler(charName.trim());
        });
    }
}

/**
 * 构建单个角色在 HUD 中的 HTML
 * 布局: 角色名(+状态图标) | Lv.X 💵999 | XP条 | 属性条
 */
function _buildCharHudHtml(name, rpg) {
    const bars = rpg.bars[name] || {};
    const effects = rpg.status?.[name] || [];
    const charLv = rpg.levels?.[name];
    const charXp = rpg.xp?.[name];
    const charCur = rpg.currency?.[name] || {};
    const denomCfg = rpg.currencyConfig?.denominations || [];
    const sendLvl = !!settings.sendRpgLevel;
    const sendCur = !!settings.sendRpgCurrency;

    let html = '<div class="horae-rpg-hud-row">';

    // 第一行: 角色名 + 等级 + 状态图标 ....... 货币(右端)
    html += '<div class="horae-rpg-hud-header">';
    html += `<span class="horae-rpg-hud-name">${escapeHtml(name)}</span>`;
    if (sendLvl && charLv != null) html += `<span class="horae-rpg-hud-lv-badge">Lv.${charLv}</span>`;
    for (const e of effects) {
        html += `<i class="fa-solid ${getStatusIcon(e)} horae-rpg-hud-effect" title="${escapeHtml(e)}"></i>`;
    }
    // 货币：推到最右
    if (sendCur && denomCfg.length > 0) {
        let curHtml = '';
        for (const d of denomCfg) {
            const v = charCur[d.name];
            if (v == null) continue;
            curHtml += `<span class="horae-rpg-hud-cur-tag">${d.emoji || '💰'}${escapeHtml(String(v))}</span>`;
        }
        if (curHtml) html += `<span class="horae-rpg-hud-right">${curHtml}</span>`;
    }
    html += '</div>';

    // XP 条（如果有）
    if (sendLvl && charXp && charXp[1] > 0) {
        const pct = Math.min(100, Math.round(charXp[0] / charXp[1] * 100));
        html += `<div class="horae-rpg-hud-bar horae-rpg-hud-xp"><span class="horae-rpg-hud-lbl">XP</span><div class="horae-rpg-hud-track"><div class="horae-rpg-hud-fill" style="width:${pct}%;background:#a78bfa;"></div></div><span class="horae-rpg-hud-val">${charXp[0]}/${charXp[1]}</span></div>`;
    }

    // 属性条
    for (const [type, val] of Object.entries(bars)) {
        const label = getRpgBarName(type, val[2]);
        const cur = val[0], max = val[1];
        const pct = max > 0 ? Math.min(100, Math.round(cur / max * 100)) : 0;
        const color = getRpgBarColor(type);
        html += `<div class="horae-rpg-hud-bar"><span class="horae-rpg-hud-lbl">${escapeHtml(label)}</span><div class="horae-rpg-hud-track"><div class="horae-rpg-hud-fill" style="width:${pct}%;background:${color};"></div></div><span class="horae-rpg-hud-val">${cur}/${max}</span></div>`;
    }

    html += '</div>';
    return html;
}

/**
 * 从 present 列表与 RPG 数据中匹配在场角色
 */
function _matchPresentChars(present, rpg) {
    const userName = getContext().name1 || '';
    const allRpgNames = new Set([
        ...Object.keys(rpg.bars || {}), ...Object.keys(rpg.status || {}),
        ...Object.keys(rpg.skills || {}), ...Object.keys(rpg.attributes || {}),
        ...Object.keys(rpg.reputation || {}), ...Object.keys(rpg.equipment || {}),
        ...Object.keys(rpg.levels || {}), ...Object.keys(rpg.xp || {}),
        ...Object.keys(rpg.currency || {}),
    ]);
    const chars = [];
    for (const p of present) {
        const n = p.trim();
        if (!n) continue;
        let match = null;
        if (allRpgNames.has(n)) match = n;
        else if (n === userName && allRpgNames.has(userName)) match = userName;
        else {
            for (const rn of allRpgNames) {
                if (rn.includes(n) || n.includes(rn)) { match = rn; break; }
            }
        }
        if (match && !chars.includes(match)) chars.push(match);
    }
    return chars;
}

/** 为单个消息面板渲染 RPG HUD（简易状态条） */
function renderRpgHud(messageEl, messageIndex) {
    const old = messageEl.querySelector('.horae-rpg-hud');
    if (old) old.remove();
    if (!settings.rpgMode || settings.sendRpgBars === false) return;

    const _hChat = horaeManager.getChat();
    const chatLen = _hChat?.length || 0;
    const skip = Math.max(0, chatLen - messageIndex - 1);
    const rpg = horaeManager.getRpgStateAt(skip);
    const _hCfgs = _hChat?.[0]?.horae_meta?._rpgConfigs;
    if (!rpg.currencyConfig) rpg.currencyConfig = _hCfgs?.currencyConfig || _hChat?.[0]?.horae_meta?.rpg?.currencyConfig || { denominations: [] };

    const meta = horaeManager.getMessageMeta(messageIndex);
    const present = meta?.scene?.characters_present || [];
    if (present.length === 0) return;

    let chars = _matchPresentChars(present, rpg);
    if (settings.rpgBarsUserOnly) {
        const _huN = getContext().name1 || '';
        chars = chars.filter(n => n === _huN);
    }
    if (chars.length === 0) return;

    let html = '<div class="horae-rpg-hud">';
    for (const name of chars) html += _buildCharHudHtml(name, rpg);
    html += '</div>';

    const panel = messageEl.querySelector('.horae-message-panel');
    if (panel) {
        panel.insertAdjacentHTML('beforebegin', html);
        const hudEl = messageEl.querySelector('.horae-rpg-hud');
        if (hudEl) {
            const w = Math.max(50, Math.min(100, settings.panelWidth || 100));
            if (w < 100) hudEl.style.maxWidth = `${w}%`;
            const ofs = Math.max(0, settings.panelOffset || 0);
            if (ofs > 0) hudEl.style.marginLeft = `${ofs}px`;
            if (isLightMode()) hudEl.classList.add('horae-light');
        }
    }
}

/** 刷新所有可见面板的 RPG HUD */
function updateAllRpgHuds() {
    if (!settings.rpgMode || settings.sendRpgBars === false) return;
    // 单次前向遍历构建每条消息的 RPG 累积快照
    const chat = horaeManager.getChat();
    if (!chat?.length) return;
    const snapMap = _buildRpgSnapshotMap(chat);
    document.querySelectorAll('.mes').forEach(mesEl => {
        const id = parseInt(mesEl.getAttribute('mesid'));
        if (!isNaN(id)) _renderRpgHudFromSnapshot(mesEl, id, snapMap.get(id));
    });
}

/** 单次遍历构建消息→RPG快照的映射 */
function _buildRpgSnapshotMap(chat) {
    const map = new Map();
    const baseRpg = chat[0]?.horae_meta?.rpg || {};
    const acc = {
        bars: {}, status: {}, skills: {}, attributes: {},
        levels: { ...(baseRpg.levels || {}) },
        xp: { ...(baseRpg.xp || {}) },
        currency: JSON.parse(JSON.stringify(baseRpg.currency || {})),
    };
    const resolve = (raw) => horaeManager._resolveRpgOwner(raw);
    const _bCfgs = chat[0]?.horae_meta?._rpgConfigs;
    const curConfig = _bCfgs?.currencyConfig || baseRpg.currencyConfig || { denominations: [] };
    const validDenoms = new Set((curConfig.denominations || []).map(d => d.name));

    for (let i = 0; i < chat.length; i++) {
        const changes = chat[i]?.horae_meta?._rpgChanges;
        if (changes && i > 0) {
            for (const [raw, bd] of Object.entries(changes.bars || {})) {
                const o = resolve(raw);
                if (!acc.bars[o]) acc.bars[o] = {};
                Object.assign(acc.bars[o], bd);
            }
            for (const [raw, ef] of Object.entries(changes.status || {})) {
                acc.status[resolve(raw)] = ef;
            }
            for (const sk of (changes.skills || [])) {
                const o = resolve(sk.owner);
                if (!acc.skills[o]) acc.skills[o] = [];
                const idx = acc.skills[o].findIndex(s => s.name === sk.name);
                if (idx >= 0) { if (sk.level) acc.skills[o][idx].level = sk.level; if (sk.desc) acc.skills[o][idx].desc = sk.desc; }
                else acc.skills[o].push({ name: sk.name, level: sk.level, desc: sk.desc });
            }
            for (const sk of (changes.removedSkills || [])) {
                const o = resolve(sk.owner);
                if (acc.skills[o]) acc.skills[o] = acc.skills[o].filter(s => s.name !== sk.name);
            }
            for (const [raw, vals] of Object.entries(changes.attributes || {})) {
                const o = resolve(raw);
                acc.attributes[o] = { ...(acc.attributes[o] || {}), ...vals };
            }
            for (const [raw, val] of Object.entries(changes.levels || {})) {
                acc.levels[resolve(raw)] = val;
            }
            for (const [raw, val] of Object.entries(changes.xp || {})) {
                acc.xp[resolve(raw)] = val;
            }
            for (const c of (changes.currency || [])) {
                const o = resolve(c.owner);
                if (validDenoms.size > 0 && !validDenoms.has(c.name)) continue;
                if (!acc.currency[o]) acc.currency[o] = {};
                if (c.isDelta) {
                    acc.currency[o][c.name] = (acc.currency[o][c.name] || 0) + c.value;
                } else {
                    acc.currency[o][c.name] = c.value;
                }
            }
        }
        const snap = JSON.parse(JSON.stringify(acc));
        snap.currencyConfig = curConfig;
        map.set(i, snap);
    }
    return map;
}

/** 用预构建的快照渲染单条消息的 RPG HUD */
function _renderRpgHudFromSnapshot(messageEl, messageIndex, rpg) {
    const old = messageEl.querySelector('.horae-rpg-hud');
    if (old) old.remove();
    if (!rpg) return;

    const meta = horaeManager.getMessageMeta(messageIndex);
    const present = meta?.scene?.characters_present || [];
    if (present.length === 0) return;

    let chars = _matchPresentChars(present, rpg);
    if (settings.rpgBarsUserOnly) {
        const _huN = getContext().name1 || '';
        chars = chars.filter(n => n === _huN);
    }
    if (chars.length === 0) return;

    let html = '<div class="horae-rpg-hud">';
    for (const name of chars) html += _buildCharHudHtml(name, rpg);
    html += '</div>';

    const panel = messageEl.querySelector('.horae-message-panel');
    if (panel) {
        panel.insertAdjacentHTML('beforebegin', html);
        const hudEl = messageEl.querySelector('.horae-rpg-hud');
        if (hudEl) {
            const w = Math.max(50, Math.min(100, settings.panelWidth || 100));
            if (w < 100) hudEl.style.maxWidth = `${w}%`;
            const ofs = Math.max(0, settings.panelOffset || 0);
            if (ofs > 0) hudEl.style.marginLeft = `${ofs}px`;
            if (isLightMode()) hudEl.classList.add('horae-light');
        }
    }
}

/**
 * 刷新所有显示
 */
function refreshAllDisplays() {
    buildPanelContent._affCache = null;
    enforceHiddenState();
    updateStatusDisplay();
    updateAgendaDisplay();
    updateTimelineDisplay();
    updateCharactersDisplay();
    updateItemsDisplay();
    updateLocationMemoryDisplay();
    updateRpgDisplay();
    updateTokenCounter();
}

/** chat[0] 上的全局键——无法由 rebuild 系列函数重建，需在 meta 重置时保留 */
const _GLOBAL_META_KEYS = [
    'autoSummaries', '_deletedNpcs', '_deletedAgendaTexts',
    'locationMemory', 'relationships', 'rpg',
    '_rpgConfigs', '_pendingScanReview', '_userAddedNpcs',
];

function _saveGlobalMeta(meta) {
    if (!meta) return null;
    const saved = {};
    for (const key of _GLOBAL_META_KEYS) {
        if (meta[key] !== undefined) saved[key] = meta[key];
    }
    return Object.keys(saved).length ? saved : null;
}

function _restoreGlobalMeta(meta, saved) {
    if (!saved || !meta) return;
    // 空对象/空数组视为缺失（createEmptyMeta 会先放 {} 占位）
    const isEmptyObj = (v) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0;
    const isEmptyArr = (v) => Array.isArray(v) && v.length === 0;
    const isMissing = (v) => v === undefined || v === null || isEmptyObj(v) || isEmptyArr(v);
    for (const key of _GLOBAL_META_KEYS) {
        if (saved[key] === undefined) continue;
        if (isMissing(meta[key])) {
            meta[key] = saved[key];
            continue;
        }
        // rpg / _rpgConfigs 子键级回填
        if ((key === 'rpg' || key === '_rpgConfigs')
            && typeof saved[key] === 'object' && !Array.isArray(saved[key])
            && typeof meta[key] === 'object' && !Array.isArray(meta[key])) {
            for (const rk of Object.keys(saved[key])) {
                if (isMissing(meta[key][rk])) {
                    meta[key][rk] = saved[key][rk];
                }
            }
        }
    }
}

/**
 * 提取消息事件上的摘要压缩标记（_compressedBy / _summaryId），
 * 用于在 createEmptyMeta() 重置后恢复，防止摘要事件从时间线中逃逸
 */
function _saveCompressedFlags(meta) {
    if (!meta?.events?.length) return null;
    const flags = [];
    for (const evt of meta.events) {
        if (evt._compressedBy || evt._summaryId) {
            flags.push({
                summary: evt.summary || '',
                _compressedBy: evt._compressedBy || null,
                _summaryId: evt._summaryId || null,
                isSummary: !!evt.isSummary,
            });
        }
    }
    return flags.length ? flags : null;
}

/**
 * 将保存的压缩标记恢复到重新解析后的事件上；
 * 若新事件数量少于保存的标记，则将多出的摘要事件追加回去
 */
function _restoreCompressedFlags(meta, saved) {
    if (!saved?.length || !meta) return;
    if (!meta.events) meta.events = [];
    const nonSummaryFlags = saved.filter(f => !f.isSummary);
    const summaryFlags = saved.filter(f => f.isSummary);
    for (let i = 0; i < Math.min(nonSummaryFlags.length, meta.events.length); i++) {
        const evt = meta.events[i];
        if (evt.isSummary || evt._summaryId) continue;
        if (nonSummaryFlags[i]._compressedBy) {
            evt._compressedBy = nonSummaryFlags[i]._compressedBy;
        }
    }
    // 如果非摘要事件数量不匹配，按 summaryId 暴力匹配
    if (nonSummaryFlags.length > 0 && meta.events.length > 0) {
        const chat = horaeManager.getChat();
        const sums = chat?.[0]?.horae_meta?.autoSummaries || [];
        const activeSumIds = new Set(sums.filter(s => s?.id && s.active !== false).map(s => s.id));
        for (const evt of meta.events) {
            if (evt.isSummary || evt._summaryId || evt._compressedBy) continue;
            const matchFlag = nonSummaryFlags.find(f => f._compressedBy && activeSumIds.has(f._compressedBy));
            if (matchFlag) evt._compressedBy = matchFlag._compressedBy;
        }
    }
    // 将摘要卡片事件追加回去（processAIResponse 不会从原文解析出摘要卡片）
    for (const sf of summaryFlags) {
        const alreadyExists = meta.events.some(e => e._summaryId === sf._summaryId);
        if (!alreadyExists && sf._summaryId) {
            meta.events.push({
                summary: sf.summary,
                isSummary: true,
                _summaryId: sf._summaryId,
                level: '摘要',
            });
        }
    }
}

/**
 * 补齐活跃摘要覆盖范围内原始事件的压缩标记。
 * 只改事件标记，不隐藏 #0，避免影响 chat[0] 承载的全局元数据。
 */
function repairSummaryCompressedMarkers() {
    const chat = horaeManager.getChat();
    const sums = chat?.[0]?.horae_meta?.autoSummaries;
    if (!chat?.length || !sums?.length) return 0;

    const activeIds = new Set(sums.filter(s => s?.id && s.active !== false).map(s => s.id));
    let fixed = 0;

    for (const s of sums) {
        if (!s?.id || s.active === false) continue;
        for (const idx of getSummaryMsgIndices(s)) {
            if (!Number.isInteger(idx) || !chat[idx]) continue;
            const meta = chat[idx].horae_meta;
            if (!meta || meta._skipHorae) continue;
            if (meta.event && !meta.events) {
                meta.events = [meta.event];
                delete meta.event;
            }
            if (!Array.isArray(meta.events)) continue;

            for (const evt of meta.events) {
                if (!evt || evt.isSummary || evt._summaryId || evt._carryoverSeed) continue;
                if (!evt._compressedBy || !activeIds.has(evt._compressedBy)) {
                    evt._compressedBy = s.id;
                    fixed++;
                }
            }
        }
    }

    if (fixed > 0) {
        console.log(`[Horae] repairSummaryCompressedMarkers: 补齐 ${fixed} 个摘要压缩标记`);
        try { getContext().saveChat(); } catch (_) { }
    }
    return fixed;
}

/**
 * 摘要卡片完整性修复（「只补不杀」策略）：
 * 旧版：若 active 摘要的 events 卡片不见了，就关闭整个摘要、回退原始时间线
 *       → 导致玩了几层后摘要莫名「掉」回去
 * 新版：autoSummaries 是单一可信源；若 events 卡片缺失，就在范围首楼层补回一张虚拟卡片
 *       → events 数组变化（rebuild/分支/导入）也不会把用户审核保留的摘要弄丢
 * 返回修复的摘要数量（补回卡片的数量），保持函数名兼容旧调用点。
 */
function cleanOrphanSummaries() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return 0;
    const sums = chat[0]?.horae_meta?.autoSummaries;
    if (!sums?.length) return 0;

    let restored = 0;
    for (const s of sums) {
        if (s.active === false || !s.range || !s.id) continue;
        const summaryId = s.id;

        let cardFound = false;
        let cardMsgIdx = -1;
        for (let i = s.range[0]; i <= s.range[1] && i < chat.length; i++) {
            const evts = chat[i]?.horae_meta?.events;
            if (evts?.some(e => e._summaryId === summaryId && e.isSummary)) {
                cardFound = true;
                cardMsgIdx = i;
                break;
            }
        }
        if (cardFound) continue;

        // 卡片缺失但摘要仍 active → 在范围首条非 user 楼层补一张虚拟卡片回去
        const targetIdx = (() => {
            for (let i = s.range[0]; i <= s.range[1] && i < chat.length; i++) {
                if (i === 0) continue;
                if (chat[i] && !chat[i].is_user) return i;
            }
            for (let i = s.range[0]; i <= s.range[1] && i < chat.length; i++) {
                if (i > 0 && chat[i]) return i;
            }
            return -1;
        })();

        if (targetIdx === -1) {
            console.warn(`[Horae] cleanOrphanSummaries: 摘要 ${summaryId} 范围 [${s.range}] 内无可用消息，跳过补卡`);
            continue;
        }

        if (!chat[targetIdx].horae_meta) chat[targetIdx].horae_meta = createEmptyMeta();
        if (!Array.isArray(chat[targetIdx].horae_meta.events)) chat[targetIdx].horae_meta.events = [];

        // 摘要内容真源：summaryText（编辑后落点）→ summary → title → 兜底
        const cardText = (typeof s.summaryText === 'string' && s.summaryText)
            ? s.summaryText
            : (s.summary || s.title || `[${t('label.summary')}]`);
        chat[targetIdx].horae_meta.events.push({
            level: s.level || 'major',
            summary: cardText,
            timestamp: s.timestamp || chat[targetIdx].horae_meta.timestamp || null,
            isSummary: true,
            _summaryId: summaryId,
            _restored: true,
        });
        injectHoraeTagToMessage(targetIdx, chat[targetIdx].horae_meta);
        console.log(`[Horae] 摘要 ${summaryId} 卡片已在 #${targetIdx} 自动补回`);
        restored++;
    }
    if (restored > 0) {
        console.log(`[Horae] cleanOrphanSummaries: 自动补回了 ${restored} 张缺失的摘要卡片`);
    }
    return restored;
}

/**
 * 校验并修复摘要范围内消息的 is_hidden 和 _compressedBy 状态，
 * 防止 SillyTavern 重渲染或 saveChat 竞态导致隐藏/压缩标记丢失。
 * 会先「补回」缺失的摘要卡片（不再 deactivate），再对仍然有效的摘要补全标记。
 */
async function enforceHiddenState() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return;
    const sums = chat[0]?.horae_meta?.autoSummaries;
    if (!sums?.length) return;

    const cardsRestored = cleanOrphanSummaries();

    let fixed = 0;
    for (const s of sums) {
        if (!s?.id || s.active === false) continue;
        const summaryId = s.id;
        for (const i of getSummaryMsgIndices(s)) {
            if (!chat[i]) continue;
            if (!chat[i].is_hidden) {
                chat[i].is_hidden = true;
                fixed++;
                const $el = $(`.mes[mesid="${i}"]`);
                if ($el.length) $el.attr('is_hidden', 'true');
            }
            const events = chat[i].horae_meta?.events;
            if (events) {
                for (const evt of events) {
                    if (!evt.isSummary && !evt._summaryId && !evt._compressedBy) {
                        evt._compressedBy = summaryId;
                        fixed++;
                    }
                }
            }
        }
    }
    if (fixed > 0 || cardsRestored > 0) {
        console.log(`[Horae] enforceHiddenState: 修复 ${fixed} 处隐藏/压缩状态, 自动补回 ${cardsRestored} 张缺失摘要卡片`);
        await getContext().saveChat();
    }
}

/**
 * 手动一键修复：先「补回」缺失的摘要卡片，再对仍然有效的活跃摘要
 * 强制恢复 is_hidden + _compressedBy，并同步 DOM 属性。返回修复的条目数。
 */
function repairAllSummaryStates() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return 0;
    const sums = chat[0]?.horae_meta?.autoSummaries;
    if (!sums?.length) return 0;

    const cardsRestored = cleanOrphanSummaries();

    let fixed = 0;
    for (const s of sums) {
        if (!s?.id || s.active === false) continue;
        const summaryId = s.id;
        for (const i of getSummaryMsgIndices(s)) {
            if (!chat[i]) continue;
            if (!chat[i].is_hidden) {
                chat[i].is_hidden = true;
                fixed++;
            }
            const $el = $(`.mes[mesid="${i}"]`);
            if ($el.length) $el.attr('is_hidden', 'true');
            const events = chat[i].horae_meta?.events;
            if (events) {
                for (const evt of events) {
                    if (!evt.isSummary && !evt._summaryId && !evt._compressedBy) {
                        evt._compressedBy = summaryId;
                        fixed++;
                    }
                }
            }
        }
    }
    if (fixed > 0 || cardsRestored > 0) {
        console.log(`[Horae] repairAllSummaryStates: 修复 ${fixed} 处, 自动补回 ${cardsRestored} 张缺失摘要卡片`);
        getContext().saveChat();
    }
    return fixed + cardsRestored;
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
    const entries = Object.entries(locMem).filter(([, info]) => !info._deleted);
    const currentLoc = horaeManager.getLatestState()?.scene?.location || '';

    if (entries.length === 0) {
        listEl.innerHTML = `
            <div class="horae-empty-state">
                <i class="fa-solid fa-map-location-dot"></i>
                <span>${t('locations.noLocations')}</span>
                <span style="font-size:11px;opacity:0.6;margin-top:4px;">${t('locations.noLocationsHint')}</span>
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
        const currentBadge = isCurrent ? `<span class="horae-loc-current-badge">${t('ui.currentBadge')}</span>` : '';
        const dateStr = info.lastUpdated ? new Date(info.lastUpdated).toLocaleDateString() : '';
        const indentClass = indent ? ' horae-loc-child' : '';
        const displayName = indent ? name.split(SEP).pop().trim() : name;
        return `
            <div class="horae-location-card ${currentClass}${indentClass}" data-location-name="${escapeHtml(name)}">
                <div class="horae-loc-header">
                    <div class="horae-loc-name"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(displayName)} ${currentBadge}</div>
                    <div class="horae-loc-actions">
                        <button class="horae-loc-edit" title="${t('common.edit')}"><i class="fa-solid fa-pen"></i></button>
                        <button class="horae-loc-delete" title="${t('common.delete')}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="horae-loc-desc">${info.desc || `<span class="horae-empty-hint">${t('ui.noDescription')}</span>`}</div>
                ${dateStr ? `<div class="horae-loc-date">${dateStr}</div>` : ''}
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
            if (!confirm(t('confirm.deleteLocation', { name }))) return;
            const chat = horaeManager.getChat();
            if (chat?.[0]?.horae_meta?.locationMemory) {
                // 标记为已删除而非直接delete，防止rebuildLocationMemory从历史消息重建
                chat[0].horae_meta.locationMemory[name] = {
                    ...chat[0].horae_meta.locationMemory[name],
                    _deleted: true
                };
                await getContext().saveChat();
                updateLocationMemoryDisplay();
                showToast(t('toast.saveSuccess'), 'info');
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
                    <i class="fa-solid fa-map-location-dot"></i> ${isNew ? t('locations.addLocation') : t('modal.editLocation')}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-edit-field">
                        <label>${t('label.locationNameLabel')}</label>
                        <input type="text" id="horae-loc-edit-name" value="${escapeHtml(locationName || '')}" placeholder="${t('placeholder.locationName')}">
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.sceneDescription')}</label>
                        <textarea id="horae-loc-edit-desc" rows="5" placeholder="${t('placeholder.locationDesc')}">${escapeHtml(existing.desc || '')}</textarea>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="horae-loc-save" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.save')}
                    </button>
                    <button id="horae-loc-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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
        if (!name) { showToast(t('toast.locationNameRequired'), 'warning'); return; }

        const chat = horaeManager.getChat();
        if (!chat?.length) return;
        if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
        if (!chat[0].horae_meta.locationMemory) chat[0].horae_meta.locationMemory = {};
        const mem = chat[0].horae_meta.locationMemory;

        const now = new Date().toISOString();
        if (isNew) {
            mem[name] = { desc, firstSeen: now, lastUpdated: now, _userEdited: true };
        } else if (locationName !== name) {
            // 改名：级联更新子级 + 记录曾用名
            const SEP = /[·・\-\/\|]/;
            const oldEntry = mem[locationName] || {};
            const aliases = oldEntry._aliases || [];
            if (!aliases.includes(locationName)) aliases.push(locationName);
            delete mem[locationName];
            mem[name] = { ...oldEntry, desc, lastUpdated: now, _userEdited: true, _aliases: aliases };
            // 检测是否为父级改名，级联所有子级
            const childKeys = Object.keys(mem).filter(k => {
                const sepMatch = k.match(SEP);
                return sepMatch && k.substring(0, sepMatch.index).trim() === locationName;
            });
            for (const childKey of childKeys) {
                const sepMatch = childKey.match(SEP);
                const childPart = childKey.substring(sepMatch.index);
                const newChildKey = name + childPart;
                const childEntry = mem[childKey];
                const childAliases = childEntry._aliases || [];
                if (!childAliases.includes(childKey)) childAliases.push(childKey);
                delete mem[childKey];
                mem[newChildKey] = { ...childEntry, lastUpdated: now, _aliases: childAliases };
            }
        } else {
            mem[name] = { ...existing, desc, lastUpdated: now, _userEdited: true };
        }

        await getContext().saveChat();
        closeEditModal();
        updateLocationMemoryDisplay();
        showToast(t('toast.saveSuccess'), 'success');
    });

    document.getElementById('horae-loc-cancel').addEventListener('click', () => closeEditModal());
}

/**
 * 合并两个地点的场景记忆
 */
function openLocationMergeModal() {
    closeEditModal();
    const locMem = horaeManager.getLocationMemory();
    const entries = Object.entries(locMem).filter(([, info]) => !info._deleted);

    if (entries.length < 2) {
        showToast(t('toast.mergeMin2'), 'warning');
        return;
    }

    const options = entries.map(([name]) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');

    const modalHtml = `
        <div id="horae-edit-modal" class="horae-modal">
            <div class="horae-modal-content">
                <div class="horae-modal-header">
                    <i class="fa-solid fa-code-merge"></i> ${t('modal.mergeLocations')}
                </div>
                <div class="horae-modal-body horae-edit-modal-body">
                    <div class="horae-setting-hint" style="margin-bottom: 12px;">
                        <i class="fa-solid fa-circle-info"></i>
                        ${t('locations.mergeLocations')}
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.mergeSource')}</label>
                        <select id="horae-merge-source">${options}</select>
                    </div>
                    <div class="horae-edit-field">
                        <label>${t('label.mergeTarget')}</label>
                        <select id="horae-merge-target">${options}</select>
                    </div>
                    <div id="horae-merge-preview" class="horae-merge-preview" style="display:none;">
                        <strong>${t('ui.mergePreviewLabel')}</strong><br><span id="horae-merge-preview-text"></span>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button id="horae-merge-confirm" class="horae-btn primary">
                        <i class="fa-solid fa-check"></i> ${t('common.confirm')}
                    </button>
                    <button id="horae-merge-cancel" class="horae-btn">
                        <i class="fa-solid fa-xmark"></i> ${t('common.cancel')}
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
            textEl.textContent = t('ui.sameSourceTarget');
            return;
        }

        const sourceDesc = locMem[source]?.desc || '';
        const targetDesc = locMem[target]?.desc || '';
        const merged = targetDesc + (targetDesc && sourceDesc ? '\n' : '') + sourceDesc;
        previewEl.style.display = 'block';
        textEl.textContent = t('ui.mergePreview', { source, target, desc: merged.substring(0, 100) + (merged.length > 100 ? '...' : '') });
    };

    document.getElementById('horae-merge-source').addEventListener('change', updatePreview);
    document.getElementById('horae-merge-target').addEventListener('change', updatePreview);
    updatePreview();

    document.getElementById('horae-merge-confirm').addEventListener('click', async (e) => {
        e.stopPropagation();
        const source = document.getElementById('horae-merge-source').value;
        const target = document.getElementById('horae-merge-target').value;

        if (source === target) {
            showToast(t('toast.mergeSameError'), 'warning');
            return;
        }

        if (!confirm(t('confirm.deleteLocation', { name: source }))) return;

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
        showToast(t('toast.saveSuccess'), 'success');
    });

    document.getElementById('horae-merge-cancel').addEventListener('click', () => closeEditModal());
}

function updateTokenCounter() {
    const el = document.getElementById('horae-token-value');
    if (!el) return;
    try {
        const dataPrompt = horaeManager.generateCompactPrompt();
        const rulesPrompt = _shouldSkipSystemPromptInjectionOnSend()
            ? ''
            : horaeManager.generateSystemPromptAddition();
        const combined = rulesPrompt ? `${dataPrompt}\n${rulesPrompt}` : dataPrompt;
        const tokens = estimateTokens(combined);
        el.textContent = `≈ ${tokens.toLocaleString()}`;
    } catch (err) {
        console.warn('[Horae] Token 计数失败:', err);
        el.textContent = '--';
    }
}

/**
 * 滚动到指定消息（支持折叠/懒加载的消息展开跳转）
 */
async function scrollToMessage(messageId) {
    let messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
    if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageEl.classList.add('horae-highlight');
        setTimeout(() => messageEl.classList.remove('horae-highlight'), 2000);
        return;
    }
    // 消息不在 DOM 中（被酒馆折叠/懒加载），提示用户展开
    if (!confirm(t('confirm.jumpToFarMessage', { id: messageId }))) return;
    try {
        const exec = await getSlashCommandExecutor();
        await exec(`/go ${messageId}`);
        await new Promise(r => setTimeout(r, 300));
        messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
        if (messageEl) {
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageEl.classList.add('horae-highlight');
            setTimeout(() => messageEl.classList.remove('horae-highlight'), 2000);
        } else {
            showToast(t('toast.jumpFailed', { id: messageId }), 'warning');
        }
    } catch (err) {
        console.warn('[Horae] 跳转失败:', err);
        showToast(t('toast.jumpError', { error: err.message || 'unknown' }), 'error');
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

/** 应用消息面板宽度和偏移设置（底部栏 + RPG HUD 统一跟随） */
function applyPanelWidth() {
    const width = Math.max(50, Math.min(100, settings.panelWidth || 100));
    const offset = Math.max(0, settings.panelOffset || 0);
    const mw = width < 100 ? `${width}%` : '';
    const ml = offset > 0 ? `${offset}px` : '';
    document.querySelectorAll('.horae-message-panel, .horae-rpg-hud').forEach(el => {
        el.style.maxWidth = mw;
        el.style.marginLeft = ml;
    });
}

/** 内置预设主题 */
const BUILTIN_THEMES = {
    'sakura': {
        nameKey: 'themes.builtin.sakura',
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
        nameKey: 'themes.builtin.forest',
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
        nameKey: 'themes.builtin.ocean',
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

function isLightMode() {
    const mode = settings.themeMode || 'dark';
    if (mode === 'light') return true;
    const theme = resolveTheme(mode);
    return !!(theme && theme.isLight);
}

/** 应用主题模式（dark / light / 内置预设 / custom-{index}） */
function applyThemeMode() {
    const mode = settings.themeMode || 'dark';
    const theme = resolveTheme(mode);
    const isLight = mode === 'light' || !!(theme && theme.isLight);
    const hasCustomVars = !!(theme && theme.variables);

    // 切换 horae-light 类（日间模式需要此类激活 UI 细节样式如 checkbox 边框等）
    const targets = [
        document.getElementById('horae_drawer'),
        ...document.querySelectorAll('.horae-message-panel'),
        ...document.querySelectorAll('.horae-modal'),
        ...document.querySelectorAll('.horae-rpg-hud')
    ].filter(Boolean);
    targets.forEach(el => el.classList.toggle('horae-light', isLight));

    // 注入主题变量
    let themeStyleEl = document.getElementById('horae-theme-vars');
    if (hasCustomVars) {
        if (!themeStyleEl) {
            themeStyleEl = document.createElement('style');
            themeStyleEl.id = 'horae-theme-vars';
            document.head.appendChild(themeStyleEl);
        }
        const vars = Object.entries(theme.variables)
            .map(([k, v]) => `  ${k}: ${v};`)
            .join('\n');
        // 日间自定义主题：必须追加 .horae-light 选择器以覆盖 style.css 中同名类的默认变量
        const needsLightOverride = isLight && mode !== 'light';
        const selectors = needsLightOverride
            ? '#horae_drawer,\n#horae_drawer.horae-light,\n.horae-message-panel,\n.horae-message-panel.horae-light,\n.horae-modal,\n.horae-modal.horae-light,\n.horae-context-menu,\n.horae-context-menu.horae-light,\n.horae-rpg-hud,\n.horae-rpg-hud.horae-light,\n.horae-rpg-dice-panel,\n.horae-rpg-dice-panel.horae-light,\n.horae-progress-overlay,\n.horae-progress-overlay.horae-light'
            : '#horae_drawer,\n.horae-message-panel,\n.horae-modal,\n.horae-context-menu,\n.horae-rpg-hud,\n.horae-rpg-dice-panel,\n.horae-progress-overlay';
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
        name: t('themes.defaultExportName'),
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
    showToast(t('toast.configExported'), 'info');
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
                showToast(t('toast.themeInvalidFile'), 'error');
                return;
            }
            theme.name = theme.name || file.name.replace('.json', '');
            if (!settings.customThemes) settings.customThemes = [];
            settings.customThemes.push(theme);
            saveSettings();
            refreshThemeSelector();
            showToast(t('toast.themeImported', { name: theme.name }), 'success');
        } catch (err) {
            showToast(t('toast.themeParseFailed'), 'error');
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
    for (const [key, theme] of Object.entries(BUILTIN_THEMES)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `🎨 ${t(theme.nameKey)}`;
        sel.appendChild(opt);
    }
    // 用户导入的主题
    const themes = settings.customThemes || [];
    themes.forEach((theme, i) => {
        const opt = document.createElement('option');
        opt.value = `custom-${i}`;
        opt.textContent = `📁 ${theme.name}`;
        sel.appendChild(opt);
    });
    sel.value = settings.themeMode || 'dark';
}

/** 删除已导入的自定义主题 */
function deleteCustomTheme(index) {
    const themes = settings.customThemes || [];
    if (!themes[index]) return;
    if (!confirm(t('confirm.deleteTheme', { name: themes[index].name }))) return;
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
    showToast(t('toast.saveSuccess'), 'info');
}

// ============================================
// 自助美化工具 (Theme Designer)
// ============================================

function _tdHslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * Math.max(0, Math.min(1, c))).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function _tdHexToHsl(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function _tdHexToRgb(hex) {
    hex = hex.replace('#', '');
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

function _tdParseColorHsl(str) {
    if (!str) return { h: 265, s: 84, l: 58 };
    str = str.trim();
    if (str.startsWith('#')) return _tdHexToHsl(str);
    const hm = str.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (hm) return { h: +hm[1], s: +hm[2], l: +hm[3] };
    const rm = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rm) return _tdHexToHsl('#' + [rm[1], rm[2], rm[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join(''));
    return { h: 265, s: 84, l: 58 };
}

function _tdGenerateVars(hue, sat, brightness, accentHex, colorLight) {
    const isDark = brightness <= 50;
    const s = Math.max(15, sat);
    const pL = colorLight || 50;
    const v = {};
    if (isDark) {
        const bgL = 6 + (brightness / 50) * 10;
        v['--horae-primary'] = _tdHslToHex(hue, s, pL);
        v['--horae-primary-light'] = _tdHslToHex(hue, Math.max(s - 12, 25), Math.min(pL + 16, 90));
        v['--horae-primary-dark'] = _tdHslToHex(hue, Math.min(s + 5, 100), Math.max(pL - 14, 10));
        v['--horae-bg'] = _tdHslToHex(hue, Math.min(s, 22), bgL);
        v['--horae-bg-secondary'] = _tdHslToHex(hue, Math.min(s, 16), bgL + 5);
        v['--horae-bg-hover'] = _tdHslToHex(hue, Math.min(s, 14), bgL + 10);
        v['--horae-border'] = `rgba(255,255,255,0.1)`;
        v['--horae-text'] = _tdHslToHex(hue, 8, 90);
        v['--horae-text-muted'] = _tdHslToHex(hue, 6, 63);
        v['--horae-shadow'] = `0 4px 20px rgba(0,0,0,0.3)`;
    } else {
        const bgL = 92 + ((brightness - 50) / 50) * 5;
        v['--horae-primary'] = _tdHslToHex(hue, s, pL);
        v['--horae-primary-light'] = _tdHslToHex(hue, s, Math.max(pL - 8, 10));
        v['--horae-primary-dark'] = _tdHslToHex(hue, Math.max(s - 12, 25), Math.min(pL + 14, 85));
        v['--horae-bg'] = _tdHslToHex(hue, Math.min(s, 12), bgL);
        v['--horae-bg-secondary'] = _tdHslToHex(hue, Math.min(s, 10), bgL - 4);
        v['--horae-bg-hover'] = _tdHslToHex(hue, Math.min(s, 10), bgL - 8);
        v['--horae-border'] = `rgba(0,0,0,0.12)`;
        v['--horae-text'] = _tdHslToHex(hue, 8, 12);
        v['--horae-text-muted'] = _tdHslToHex(hue, 5, 38);
        v['--horae-shadow'] = `0 4px 20px rgba(0,0,0,0.08)`;
    }
    if (accentHex) v['--horae-accent'] = accentHex;
    v['--horae-success'] = '#10b981';
    v['--horae-warning'] = '#f59e0b';
    v['--horae-danger'] = '#ef4444';
    v['--horae-info'] = '#3b82f6';
    return v;
}

// Keep this list in sync with the fine-tuning picker variables.
const _TD_FINE_VAR_NAMES = [
    '--horae-primary',
    '--horae-primary-light',
    '--horae-primary-dark',
    '--horae-accent',
    '--horae-success',
    '--horae-warning',
    '--horae-danger',
    '--horae-info',
    '--horae-bg',
    '--horae-bg-secondary',
    '--horae-bg-hover',
    '--horae-text',
    '--horae-text-muted'
];

function _tdNormalizeOverrides(overrides) {
    const out = {};
    if (!overrides || typeof overrides !== 'object') return out;
    for (const key of _TD_FINE_VAR_NAMES) {
        const val = overrides[key];
        if (typeof val === 'string' && val.trim()) out[key] = val.trim();
    }
    return out;
}

function _tdInferOverridesFromTheme(themeVars, baseVars) {
    const out = {};
    if (!themeVars || typeof themeVars !== 'object') return out;
    for (const key of _TD_FINE_VAR_NAMES) {
        const tv = themeVars[key];
        if (typeof tv !== 'string' || !tv.trim()) continue;
        const themeVal = tv.trim();
        const baseVal = typeof baseVars?.[key] === 'string' ? baseVars[key].trim() : '';
        if (!baseVal || themeVal.toLowerCase() !== baseVal.toLowerCase()) {
            out[key] = themeVal;
        }
    }
    return out;
}

function _tdBuildImageCSS(images, opacities, bgHex, drawerBg) {
    const parts = [];
    // 顶部图标（#horae_drawer）
    if (images.drawer && bgHex) {
        const c = _tdHexToRgb(drawerBg || bgHex);
        const a = (1 - (opacities.drawer || 30) / 100).toFixed(2);
        parts.push(`#horae_drawer {
  background-image: linear-gradient(rgba(${c.r},${c.g},${c.b},${a}), rgba(${c.r},${c.g},${c.b},${a})), url('${images.drawer}') !important;
  background-size: auto, cover !important;
  background-position: center, center !important;
  background-repeat: no-repeat, no-repeat !important;
}`);
    }
    // 抽屉头部图片
    if (images.header) {
        parts.push(`#horae_drawer .drawer-header {
  background-image: url('${images.header}') !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}`);
    }
    // 抽屉背景图片
    const bodyBg = drawerBg || bgHex;
    if (images.body && bodyBg) {
        const c = _tdHexToRgb(bodyBg);
        const a = (1 - (opacities.body || 30) / 100).toFixed(2);
        parts.push(`.horae-tab-contents {
  background-image: linear-gradient(rgba(${c.r},${c.g},${c.b},${a}), rgba(${c.r},${c.g},${c.b},${a})), url('${images.body}') !important;
  background-size: auto, cover !important;
  background-position: center, center !important;
  background-repeat: no-repeat, no-repeat !important;
}`);
    } else if (drawerBg) {
        parts.push(`.horae-tab-contents { background-color: ${drawerBg} !important; }`);
    }
    // 底部消息栏图片 — 仅作用于收缩的 toggle 条，展开内容不叠加图片
    if (images.panel && bgHex) {
        const c = _tdHexToRgb(bgHex);
        const a = (1 - (opacities.panel || 30) / 100).toFixed(2);
        parts.push(`.horae-message-panel > .horae-panel-toggle {
  background-image: linear-gradient(rgba(${c.r},${c.g},${c.b},${a}), rgba(${c.r},${c.g},${c.b},${a})), url('${images.panel}') !important;
  background-size: auto, cover !important;
  background-position: center, center !important;
  background-repeat: no-repeat, no-repeat !important;
}`);
    }
    return parts.join('\n');
}

function openThemeDesigner() {
    document.querySelector('.horae-theme-designer')?.remove();

    const drawer = document.getElementById('horae_drawer');
    const cs = drawer ? getComputedStyle(drawer) : null;
    const priStr = cs?.getPropertyValue('--horae-primary').trim() || '#7c3aed';
    const accStr = cs?.getPropertyValue('--horae-accent').trim() || '#f59e0b';
    const initHsl = _tdParseColorHsl(priStr);

    // 尝试从当前自定义主题恢复全部设置
    let savedImages = { drawer: '', header: '', body: '', panel: '' };
    let savedImgOp = { drawer: 30, header: 50, body: 30, panel: 30 };
    let savedName = '', savedAuthor = '', savedDrawerBg = '';
    let savedDesigner = null;
    const curTheme = resolveTheme(settings.themeMode || 'dark');
    if (curTheme) {
        if (curTheme.images) savedImages = { ...savedImages, ...curTheme.images };
        if (curTheme.imageOpacity) savedImgOp = { ...savedImgOp, ...curTheme.imageOpacity };
        if (curTheme.name) savedName = curTheme.name;
        if (curTheme.author) savedAuthor = curTheme.author;
        if (curTheme.drawerBg) savedDrawerBg = curTheme.drawerBg;
        if (curTheme._designerState) savedDesigner = curTheme._designerState;
    }
    const savedOverrides = _tdNormalizeOverrides(savedDesigner?.overrides);

    const st = {
        hue: savedDesigner?.hue ?? initHsl.h,
        sat: savedDesigner?.sat ?? initHsl.s,
        colorLight: savedDesigner?.colorLight ?? initHsl.l,
        bright: savedDesigner?.bright ?? ((isLightMode()) ? 70 : 25),
        accent: savedDesigner?.accent ?? (accStr.startsWith('#') ? accStr : '#f59e0b'),
        images: savedImages,
        imgOp: savedImgOp,
        drawerBg: savedDrawerBg,
        rpgColor: savedDesigner?.rpgColor ?? '#000000',
        rpgOpacity: savedDesigner?.rpgOpacity ?? 85,
        diceColor: savedDesigner?.diceColor ?? '#1a1a2e',
        diceOpacity: savedDesigner?.diceOpacity ?? 15,
        radarColor: savedDesigner?.radarColor ?? '',
        radarLabel: savedDesigner?.radarLabel ?? '',
        overrides: { ...savedOverrides }
    };
    if (!Object.keys(st.overrides).length && curTheme?.variables) {
        const baseVars = _tdGenerateVars(st.hue, st.sat, st.bright, st.accent, st.colorLight);
        st.overrides = _tdInferOverridesFromTheme(curTheme.variables, baseVars);
    }

    const abortCtrl = new AbortController();
    const sig = abortCtrl.signal;

    const imgHtml = (key, label) => {
        const url = st.images[key] || '';
        const op = st.imgOp[key];
        return `<div class="htd-img-group">
        <div class="htd-img-label">${label}</div>
        <input type="text" id="htd-img-${key}" class="htd-input" placeholder="${t('placeholder.imageUrl')}" value="${escapeHtml(url)}">
        <div class="htd-img-ctrl"><span>${t('ui.visibility')} <em id="htd-imgop-${key}">${op}</em>%</span>
            <input type="range" class="htd-slider" id="htd-imgsl-${key}" min="5" max="100" value="${op}"></div>
        <img id="htd-imgpv-${key}" class="htd-img-preview" ${url ? `src="${escapeHtml(url)}"` : 'style="display:none;"'}>
    </div>`;
    };

    const modal = document.createElement('div');
    modal.className = 'horae-modal horae-theme-designer' + (isLightMode() ? ' horae-light' : '');
    modal.innerHTML = `
    <div class="horae-modal-content htd-content">
        <div class="htd-header"><i class="fa-solid fa-paint-roller"></i> ${t('ui.themeDesignerTitle')}</div>
        <div class="htd-body">
            <div class="htd-section">
                <div class="htd-section-title">${t('ui.quickColor')}</div>
                <div class="htd-field">
                    <span class="htd-label">${t('ui.hue')}</span>
                    <div class="htd-hue-bar" id="htd-hue-bar"><div class="htd-hue-ind" id="htd-hue-ind"></div></div>
                </div>
                <div class="htd-field">
                    <span class="htd-label">${t('ui.saturation')} <em id="htd-satv">${st.sat}</em>%</span>
                    <input type="range" class="htd-slider" id="htd-sat" min="10" max="100" value="${st.sat}">
                </div>
                <div class="htd-field">
                    <span class="htd-label">${t('ui.brightness')} <em id="htd-clv">${st.colorLight}</em></span>
                    <input type="range" class="htd-slider htd-colorlight" id="htd-cl" min="15" max="85" value="${st.colorLight}">
                </div>
                <div class="htd-field">
                    <span class="htd-label">${t('ui.dayNight')} <em id="htd-briv">${st.bright <= 50 ? t('ui.night') : t('ui.day')}</em></span>
                    <input type="range" class="htd-slider htd-daynight" id="htd-bri" min="0" max="100" value="${st.bright}">
                </div>
                <div class="htd-field">
                    <span class="htd-label">${t('ui.accentColor')}</span>
                    <div class="htd-color-row">
                        <input type="color" id="htd-accent" value="${st.accent}" class="htd-cpick">
                        <span class="htd-hex" id="htd-accent-hex">${st.accent}</span>
                    </div>
                </div>
                <div class="htd-swatches" id="htd-swatches"></div>
            </div>

            <div class="htd-section">
                <div class="htd-section-title htd-toggle" id="htd-fine-t">
                    <i class="fa-solid fa-sliders"></i> ${t('ui.fineColor')}
                    <i class="fa-solid fa-chevron-down htd-arrow"></i>
                </div>
                <div id="htd-fine-body" style="display:none;"></div>
            </div>

            <div class="htd-section">
                <div class="htd-section-title htd-toggle" id="htd-img-t">
                    <i class="fa-solid fa-image"></i> ${t('ui.decorImages')}
                    <i class="fa-solid fa-chevron-down htd-arrow"></i>
                </div>
                <div id="htd-imgs-section" style="display:none;">
                    ${imgHtml('drawer', t('ui.topIcon'))}
                    ${imgHtml('header', t('ui.drawerHeader'))}
                    ${imgHtml('body', t('ui.drawerBody'))}
                    <div class="htd-img-group">
                        <div class="htd-img-label">${t('ui.drawerBgColor')}</div>
                        <div class="htd-field">
                            <span class="htd-label"><em id="htd-dbg-hex">${st.drawerBg || t('ui.followTheme')}</em></span>
                            <div class="htd-color-row">
                                <input type="color" id="htd-dbg" value="${st.drawerBg || '#2d2d3c'}" class="htd-cpick">
                                <button class="horae-btn" id="htd-dbg-clear" style="font-size:10px;padding:2px 8px;">${t('ui.clearBtn')}</button>
                            </div>
                        </div>
                    </div>
                    ${imgHtml('panel', t('ui.bottomPanel'))}
                </div>
            </div>

            <div class="htd-section">
                <div class="htd-section-title htd-toggle" id="htd-rpg-t">
                    <i class="fa-solid fa-shield-halved"></i> ${t('ui.rpgStatusBar')}
                    <i class="fa-solid fa-chevron-down htd-arrow"></i>
                </div>
                <div id="htd-rpg-section" style="display:none;">
                    <div class="htd-field">
                        <span class="htd-label">${t('ui.backgroundColor')}</span>
                        <div class="htd-color-row">
                            <input type="color" id="htd-rpg-color" value="${st.rpgColor}" class="htd-cpick">
                            <span class="htd-hex" id="htd-rpg-color-hex">${st.rpgColor}</span>
                        </div>
                    </div>
                    <div class="htd-field">
                        <span class="htd-label">${t('ui.opacityLabel')} <em id="htd-rpg-opv">${st.rpgOpacity}</em>%</span>
                        <input type="range" class="htd-slider" id="htd-rpg-op" min="0" max="100" value="${st.rpgOpacity}">
                    </div>
                </div>
            </div>

            <div class="htd-section">
                <div class="htd-section-title htd-toggle" id="htd-dice-t">
                    <i class="fa-solid fa-dice-d20"></i> ${t('ui.dicePanel')}
                    <i class="fa-solid fa-chevron-down htd-arrow"></i>
                </div>
                <div id="htd-dice-section" style="display:none;">
                    <div class="htd-field">
                        <span class="htd-label">${t('ui.backgroundColor')}</span>
                        <div class="htd-color-row">
                            <input type="color" id="htd-dice-color" value="${st.diceColor}" class="htd-cpick">
                            <span class="htd-hex" id="htd-dice-color-hex">${st.diceColor}</span>
                        </div>
                    </div>
                    <div class="htd-field">
                        <span class="htd-label">${t('ui.visibility')} <em id="htd-dice-opv">${st.diceOpacity}</em>%</span>
                        <input type="range" class="htd-slider" id="htd-dice-op" min="0" max="100" value="${st.diceOpacity}">
                    </div>
                </div>
            </div>

            <div class="htd-section">
                <div class="htd-section-title htd-toggle" id="htd-radar-t">
                    <i class="fa-solid fa-chart-simple"></i> ${t('ui.radarChart')}
                    <i class="fa-solid fa-chevron-down htd-arrow"></i>
                </div>
                <div id="htd-radar-section" style="display:none;">
                    <div class="htd-field">
                        <span class="htd-label">${t('ui.dataColor')} <em style="opacity:.5">${t('ui.emptyFollowTheme')}</em></span>
                        <div class="htd-color-row">
                            <input type="color" id="htd-radar-color" value="${st.radarColor || priStr}" class="htd-cpick">
                            <span class="htd-hex" id="htd-radar-color-hex">${st.radarColor || t('ui.followTheme')}</span>
                            <button class="horae-btn" id="htd-radar-color-clear" style="font-size:10px;padding:2px 8px;">${t('ui.clearBtn')}</button>
                        </div>
                    </div>
                    <div class="htd-field">
                        <span class="htd-label">${t('ui.labelColor')} <em style="opacity:.5">${t('ui.emptyFollowText')}</em></span>
                        <div class="htd-color-row">
                            <input type="color" id="htd-radar-label" value="${st.radarLabel || '#e2e8f0'}" class="htd-cpick">
                            <span class="htd-hex" id="htd-radar-label-hex">${st.radarLabel || t('ui.followText')}</span>
                            <button class="horae-btn" id="htd-radar-label-clear" style="font-size:10px;padding:2px 8px;">${t('ui.clearBtn')}</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="htd-section htd-save-sec">
                <div class="htd-field"><span class="htd-label">${t('label.name')}</span><input type="text" id="htd-name" class="htd-input" placeholder="${t('placeholder.themeName')}" value="${escapeHtml(savedName)}"></div>
                <div class="htd-field"><span class="htd-label">${t('ui.authorLabel')}</span><input type="text" id="htd-author" class="htd-input" placeholder="${t('placeholder.anonymous')}" value="${escapeHtml(savedAuthor)}"></div>
                <div class="htd-btn-row">
                    <button class="horae-btn primary" id="htd-save"><i class="fa-solid fa-floppy-disk"></i> ${t('common.save')}</button>
                    <button class="horae-btn" id="htd-export"><i class="fa-solid fa-file-export"></i> ${t('common.export')}</button>
                    <button class="horae-btn" id="htd-reset"><i class="fa-solid fa-rotate-left"></i> ${t('common.reset')}</button>
                    <button class="horae-btn" id="htd-cancel"><i class="fa-solid fa-xmark"></i> ${t('common.cancel')}</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.appendChild(modal);
    preventModalBubble(modal);

    const hueBar = modal.querySelector('#htd-hue-bar');
    const hueInd = modal.querySelector('#htd-hue-ind');
    hueInd.style.left = `${(st.hue / 360) * 100}%`;
    hueInd.style.background = `hsl(${st.hue}, 100%, 50%)`;

    // ---- Live preview ----
    function update() {
        const base = _tdGenerateVars(st.hue, st.sat, st.bright, st.accent, st.colorLight);
        const vars = { ...base, ...st.overrides };

        // RPG HUD 背景变量（透明度：100=全透明, 0=不透明）
        if (st.rpgColor) {
            const rc = _tdHexToRgb(st.rpgColor);
            const ra = (1 - (st.rpgOpacity ?? 85) / 100).toFixed(2);
            vars['--horae-rpg-bg'] = `rgba(${rc.r},${rc.g},${rc.b},${ra})`;
        }
        // 骰子面板背景变量
        if (st.diceColor) {
            const dc = _tdHexToRgb(st.diceColor);
            const da = (1 - (st.diceOpacity ?? 15) / 100).toFixed(2);
            vars['--horae-dice-bg'] = `rgba(${dc.r},${dc.g},${dc.b},${da})`;
        }
        // 雷达图颜色变量
        if (st.radarColor) vars['--horae-radar-color'] = st.radarColor;
        if (st.radarLabel) vars['--horae-radar-label'] = st.radarLabel;

        let previewEl = document.getElementById('horae-designer-preview');
        if (!previewEl) { previewEl = document.createElement('style'); previewEl.id = 'horae-designer-preview'; document.head.appendChild(previewEl); }
        const cssLines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n');
        previewEl.textContent = `#horae_drawer, .horae-message-panel, .horae-modal, .horae-context-menu, .horae-rpg-hud, .horae-rpg-dice-panel, .horae-progress-overlay {\n${cssLines}\n}`;

        const isLight = st.bright > 50;
        drawer?.classList.toggle('horae-light', isLight);
        modal.classList.toggle('horae-light', isLight);
        document.querySelectorAll('.horae-message-panel').forEach(p => p.classList.toggle('horae-light', isLight));
        document.querySelectorAll('.horae-rpg-hud').forEach(h => h.classList.toggle('horae-light', isLight));
        document.querySelectorAll('.horae-rpg-dice-panel').forEach(d => d.classList.toggle('horae-light', isLight));

        let imgEl = document.getElementById('horae-designer-images');
        const imgCSS = _tdBuildImageCSS(st.images, st.imgOp, vars['--horae-bg'], st.drawerBg);
        if (imgCSS) {
            if (!imgEl) { imgEl = document.createElement('style'); imgEl.id = 'horae-designer-images'; document.head.appendChild(imgEl); }
            imgEl.textContent = imgCSS;
        } else { imgEl?.remove(); }

        const sw = modal.querySelector('#htd-swatches');
        const swKeys = ['--horae-primary', '--horae-primary-light', '--horae-primary-dark', '--horae-accent',
            '--horae-bg', '--horae-bg-secondary', '--horae-bg-hover', '--horae-text', '--horae-text-muted'];
        sw.innerHTML = swKeys.map(k =>
            `<div class="htd-swatch" style="background:${vars[k]}" title="${k.replace('--horae-', '')}: ${vars[k]}"></div>`
        ).join('');

        const fineBody = modal.querySelector('#htd-fine-body');
        if (fineBody.style.display !== 'none') {
            fineBody.querySelectorAll('.htd-fine-cpick').forEach(inp => {
                const vn = inp.dataset.vn;
                if (!st.overrides[vn] && vars[vn]?.startsWith('#')) {
                    inp.value = vars[vn];
                    inp.nextElementSibling.textContent = vars[vn];
                }
            });
        }
    }

    // ---- Hue bar drag ----
    let hueDrag = false;
    function onHue(e) {
        const r = hueBar.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const x = Math.max(0, Math.min(r.width, cx - r.left));
        st.hue = Math.round((x / r.width) * 360);
        hueInd.style.left = `${(st.hue / 360) * 100}%`;
        hueInd.style.background = `hsl(${st.hue}, 100%, 50%)`;
        st.overrides = {};
        update();
    }
    hueBar.addEventListener('mousedown', e => { hueDrag = true; onHue(e); }, { signal: sig });
    hueBar.addEventListener('touchstart', e => { hueDrag = true; onHue(e); }, { signal: sig, passive: true });
    document.addEventListener('mousemove', e => { if (hueDrag) onHue(e); }, { signal: sig });
    document.addEventListener('touchmove', e => { if (hueDrag) onHue(e); }, { signal: sig, passive: true });
    document.addEventListener('mouseup', () => hueDrag = false, { signal: sig, capture: true });
    document.addEventListener('touchend', () => hueDrag = false, { signal: sig, capture: true });

    // ---- Sliders ----
    modal.querySelector('#htd-sat').addEventListener('input', function () {
        st.sat = +this.value; modal.querySelector('#htd-satv').textContent = st.sat;
        st.overrides = {};
        update();
    }, { signal: sig });

    modal.querySelector('#htd-cl').addEventListener('input', function () {
        st.colorLight = +this.value; modal.querySelector('#htd-clv').textContent = st.colorLight;
        st.overrides = {};
        update();
    }, { signal: sig });

    modal.querySelector('#htd-bri').addEventListener('input', function () {
        st.bright = +this.value;
        modal.querySelector('#htd-briv').textContent = st.bright <= 50 ? t('ui.night') : t('ui.day');
        st.overrides = {};
        update();
    }, { signal: sig });

    modal.querySelector('#htd-accent').addEventListener('input', function () {
        st.accent = this.value;
        modal.querySelector('#htd-accent-hex').textContent = this.value;
        update();
    }, { signal: sig });

    // ---- Collapsible ----
    modal.querySelector('#htd-fine-t').addEventListener('click', () => {
        const body = modal.querySelector('#htd-fine-body');
        const show = body.style.display === 'none';
        body.style.display = show ? 'block' : 'none';
        if (show) buildFine();
    }, { signal: sig });
    modal.querySelector('#htd-img-t').addEventListener('click', () => {
        const sec = modal.querySelector('#htd-imgs-section');
        sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
    }, { signal: sig });

    // ---- Fine pickers ----
    const FINE_VARS = [
        ['--horae-primary', t('ui.primaryColor')], ['--horae-primary-light', t('ui.primaryLight')], ['--horae-primary-dark', t('ui.primaryDark')],
        ['--horae-accent', t('ui.accentColor')], ['--horae-success', t('ui.successColor')], ['--horae-warning', t('ui.warningColor')],
        ['--horae-danger', t('ui.dangerColor')], ['--horae-info', t('ui.infoColor')],
        ['--horae-bg', t('ui.bgColor')], ['--horae-bg-secondary', t('ui.bgSecondary')], ['--horae-bg-hover', t('ui.bgHover')],
        ['--horae-text', 'Text'], ['--horae-text-muted', 'Text Muted']
    ];
    function buildFine() {
        const c = modal.querySelector('#htd-fine-body');
        const base = _tdGenerateVars(st.hue, st.sat, st.bright, st.accent, st.colorLight);
        const vars = { ...base, ...st.overrides };
        c.innerHTML = FINE_VARS.map(([vn, label]) => {
            const val = vars[vn] || '#888888';
            const hex = val.startsWith('#') ? val : '#888888';
            return `<div class="htd-fine-row"><span>${label}</span>
                <input type="color" class="htd-fine-cpick" data-vn="${vn}" value="${hex}">
                <span class="htd-fine-hex">${val}</span></div>`;
        }).join('');
        c.querySelectorAll('.htd-fine-cpick').forEach(inp => {
            inp.addEventListener('input', () => {
                st.overrides[inp.dataset.vn] = inp.value;
                inp.nextElementSibling.textContent = inp.value;
                update();
            }, { signal: sig });
        });
    }

    // ---- Image inputs ----
    ['drawer', 'header', 'body', 'panel'].forEach(key => {
        const urlIn = modal.querySelector(`#htd-img-${key}`);
        const opSl = modal.querySelector(`#htd-imgsl-${key}`);
        const pv = modal.querySelector(`#htd-imgpv-${key}`);
        const opV = modal.querySelector(`#htd-imgop-${key}`);
        pv.onerror = () => pv.style.display = 'none';
        pv.onload = () => pv.style.display = 'block';
        urlIn.addEventListener('input', () => {
            st.images[key] = urlIn.value.trim();
            if (st.images[key]) pv.src = st.images[key]; else pv.style.display = 'none';
            update();
        }, { signal: sig });
        opSl.addEventListener('input', () => {
            st.imgOp[key] = +opSl.value;
            opV.textContent = opSl.value;
            update();
        }, { signal: sig });
    });

    // ---- Drawer bg color ----
    modal.querySelector('#htd-dbg').addEventListener('input', function () {
        st.drawerBg = this.value;
        modal.querySelector('#htd-dbg-hex').textContent = this.value;
        update();
    }, { signal: sig });
    modal.querySelector('#htd-dbg-clear').addEventListener('click', () => {
        st.drawerBg = '';
        modal.querySelector('#htd-dbg-hex').textContent = t('ui.followTheme');
        update();
    }, { signal: sig });

    // ---- RPG 状态栏 ----
    modal.querySelector('#htd-rpg-t').addEventListener('click', () => {
        const sec = modal.querySelector('#htd-rpg-section');
        sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
    }, { signal: sig });
    modal.querySelector('#htd-rpg-color').addEventListener('input', function () {
        st.rpgColor = this.value;
        modal.querySelector('#htd-rpg-color-hex').textContent = this.value;
        update();
    }, { signal: sig });
    modal.querySelector('#htd-rpg-op').addEventListener('input', function () {
        st.rpgOpacity = +this.value;
        modal.querySelector('#htd-rpg-opv').textContent = this.value;
        update();
    }, { signal: sig });

    // ---- 骰子面板 ----
    modal.querySelector('#htd-dice-t').addEventListener('click', () => {
        const sec = modal.querySelector('#htd-dice-section');
        sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
    }, { signal: sig });
    modal.querySelector('#htd-dice-color').addEventListener('input', function () {
        st.diceColor = this.value;
        modal.querySelector('#htd-dice-color-hex').textContent = this.value;
        update();
    }, { signal: sig });
    modal.querySelector('#htd-dice-op').addEventListener('input', function () {
        st.diceOpacity = +this.value;
        modal.querySelector('#htd-dice-opv').textContent = this.value;
        update();
    }, { signal: sig });

    // ---- 雷达图 ----
    modal.querySelector('#htd-radar-t').addEventListener('click', () => {
        const sec = modal.querySelector('#htd-radar-section');
        sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
    }, { signal: sig });
    modal.querySelector('#htd-radar-color').addEventListener('input', function () {
        st.radarColor = this.value;
        modal.querySelector('#htd-radar-color-hex').textContent = this.value;
        update();
    }, { signal: sig });
    modal.querySelector('#htd-radar-color-clear').addEventListener('click', () => {
        st.radarColor = '';
        modal.querySelector('#htd-radar-color-hex').textContent = t('ui.followTheme');
        update();
    }, { signal: sig });
    modal.querySelector('#htd-radar-label').addEventListener('input', function () {
        st.radarLabel = this.value;
        modal.querySelector('#htd-radar-label-hex').textContent = this.value;
        update();
    }, { signal: sig });
    modal.querySelector('#htd-radar-label-clear').addEventListener('click', () => {
        st.radarLabel = '';
        modal.querySelector('#htd-radar-label-hex').textContent = t('ui.followText');
        update();
    }, { signal: sig });

    // ---- Close ----
    function closeDesigner() {
        abortCtrl.abort();
        document.getElementById('horae-designer-preview')?.remove();
        document.getElementById('horae-designer-images')?.remove();
        modal.remove();
        applyThemeMode();
    }
    modal.querySelector('#htd-cancel').addEventListener('click', closeDesigner, { signal: sig });
    modal.addEventListener('click', e => { if (e.target === modal) closeDesigner(); }, { signal: sig });

    // ---- Save ----
    modal.querySelector('#htd-save').addEventListener('click', () => {
        const name = modal.querySelector('#htd-name').value.trim() || t('ui.customThemeName');
        const author = modal.querySelector('#htd-author').value.trim() || '';
        const base = _tdGenerateVars(st.hue, st.sat, st.bright, st.accent, st.colorLight);
        const vars = { ...base, ...st.overrides };
        if (st.rpgColor) {
            const rc = _tdHexToRgb(st.rpgColor);
            const ra = (1 - (st.rpgOpacity ?? 85) / 100).toFixed(2);
            vars['--horae-rpg-bg'] = `rgba(${rc.r},${rc.g},${rc.b},${ra})`;
        }
        if (st.diceColor) {
            const dc = _tdHexToRgb(st.diceColor);
            const da = (1 - (st.diceOpacity ?? 15) / 100).toFixed(2);
            vars['--horae-dice-bg'] = `rgba(${dc.r},${dc.g},${dc.b},${da})`;
        }
        if (st.radarColor) vars['--horae-radar-color'] = st.radarColor;
        if (st.radarLabel) vars['--horae-radar-label'] = st.radarLabel;
        const theme = {
            name, author, version: '1.0', variables: vars,
            images: { ...st.images }, imageOpacity: { ...st.imgOp },
            drawerBg: st.drawerBg,
            isLight: st.bright > 50,
            _designerState: { hue: st.hue, sat: st.sat, colorLight: st.colorLight, bright: st.bright, accent: st.accent, rpgColor: st.rpgColor, rpgOpacity: st.rpgOpacity, diceColor: st.diceColor, diceOpacity: st.diceOpacity, radarColor: st.radarColor, radarLabel: st.radarLabel, overrides: { ...st.overrides } },
            css: _tdBuildImageCSS(st.images, st.imgOp, vars['--horae-bg'], st.drawerBg)
        };
        if (!settings.customThemes) settings.customThemes = [];
        settings.customThemes.push(theme);
        settings.themeMode = `custom-${settings.customThemes.length - 1}`;
        abortCtrl.abort();
        document.getElementById('horae-designer-preview')?.remove();
        document.getElementById('horae-designer-images')?.remove();
        modal.remove();
        saveSettings();
        applyThemeMode();
        refreshThemeSelector();
        showToast(t('toast.themeSaved', { name }), 'success');
    }, { signal: sig });

    // ---- Export ----
    modal.querySelector('#htd-export').addEventListener('click', () => {
        const name = modal.querySelector('#htd-name').value.trim() || t('ui.customThemeName');
        const author = modal.querySelector('#htd-author').value.trim() || '';
        const base = _tdGenerateVars(st.hue, st.sat, st.bright, st.accent, st.colorLight);
        const vars = { ...base, ...st.overrides };
        if (st.rpgColor) {
            const rc = _tdHexToRgb(st.rpgColor);
            const ra = (1 - (st.rpgOpacity ?? 85) / 100).toFixed(2);
            vars['--horae-rpg-bg'] = `rgba(${rc.r},${rc.g},${rc.b},${ra})`;
        }
        if (st.diceColor) {
            const dc = _tdHexToRgb(st.diceColor);
            const da = (1 - (st.diceOpacity ?? 15) / 100).toFixed(2);
            vars['--horae-dice-bg'] = `rgba(${dc.r},${dc.g},${dc.b},${da})`;
        }
        if (st.radarColor) vars['--horae-radar-color'] = st.radarColor;
        if (st.radarLabel) vars['--horae-radar-label'] = st.radarLabel;
        const theme = {
            name, author, version: '1.0', variables: vars,
            images: { ...st.images }, imageOpacity: { ...st.imgOp },
            drawerBg: st.drawerBg,
            isLight: st.bright > 50,
            _designerState: { hue: st.hue, sat: st.sat, colorLight: st.colorLight, bright: st.bright, accent: st.accent, rpgColor: st.rpgColor, rpgOpacity: st.rpgOpacity, diceColor: st.diceColor, diceOpacity: st.diceOpacity, radarColor: st.radarColor, radarLabel: st.radarLabel, overrides: { ...st.overrides } },
            css: _tdBuildImageCSS(st.images, st.imgOp, vars['--horae-bg'], st.drawerBg)
        };
        const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `horae-${name}.json`; a.click();
        URL.revokeObjectURL(url);
        showToast(t('toast.themeExported'), 'info');
    }, { signal: sig });

    // ---- Reset ----
    modal.querySelector('#htd-reset').addEventListener('click', () => {
        st.hue = 265; st.sat = 84; st.colorLight = 50; st.bright = 25; st.accent = '#f59e0b';
        st.overrides = {}; st.drawerBg = '';
        st.rpgColor = '#000000'; st.rpgOpacity = 85;
        st.diceColor = '#1a1a2e'; st.diceOpacity = 15;
        st.radarColor = ''; st.radarLabel = '';
        st.images = { drawer: '', header: '', body: '', panel: '' };
        st.imgOp = { drawer: 30, header: 50, body: 30, panel: 30 };
        hueInd.style.left = `${(265 / 360) * 100}%`;
        hueInd.style.background = `hsl(265, 100%, 50%)`;
        modal.querySelector('#htd-sat').value = 84; modal.querySelector('#htd-satv').textContent = '84';
        modal.querySelector('#htd-cl').value = 50; modal.querySelector('#htd-clv').textContent = '50';
        modal.querySelector('#htd-bri').value = 25; modal.querySelector('#htd-briv').textContent = t('ui.night');
        modal.querySelector('#htd-accent').value = '#f59e0b';
        modal.querySelector('#htd-accent-hex').textContent = '#f59e0b';
        modal.querySelector('#htd-dbg-hex').textContent = t('ui.followTheme');
        modal.querySelector('#htd-rpg-color').value = '#000000';
        modal.querySelector('#htd-rpg-color-hex').textContent = '#000000';
        modal.querySelector('#htd-rpg-op').value = 85;
        modal.querySelector('#htd-rpg-opv').textContent = '85';
        modal.querySelector('#htd-dice-color').value = '#1a1a2e';
        modal.querySelector('#htd-dice-color-hex').textContent = '#1a1a2e';
        modal.querySelector('#htd-dice-op').value = 15;
        modal.querySelector('#htd-dice-opv').textContent = '15';
        modal.querySelector('#htd-radar-color-hex').textContent = t('ui.followTheme');
        modal.querySelector('#htd-radar-label-hex').textContent = t('ui.followText');
        ['drawer', 'header', 'body', 'panel'].forEach(k => {
            const u = modal.querySelector(`#htd-img-${k}`); if (u) u.value = '';
            const defOp = k === 'header' ? 50 : 30;
            const s = modal.querySelector(`#htd-imgsl-${k}`); if (s) s.value = defOp;
            const v = modal.querySelector(`#htd-imgop-${k}`); if (v) v.textContent = String(defOp);
            const p = modal.querySelector(`#htd-imgpv-${k}`); if (p) p.style.display = 'none';
        });
        const fBody = modal.querySelector('#htd-fine-body');
        if (fBody.style.display !== 'none') buildFine();
        update();
        showToast(t('toast.themeReset'), 'info');
    }, { signal: sig });

    update();
}

/**
 * 为消息添加元数据面板
 */
function addMessagePanel(messageEl, messageIndex) {
    try {
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
            : t('ui.noSpecialEvents');
        const charCount = meta.scene?.characters_present?.length || 0;
        const isSkipped = !!meta._skipHorae;
        const sideplayBtnStyle = settings.sideplayMode ? '' : 'display:none;';

        const panelHtml = `
        <div class="horae-message-panel${isSkipped ? ' horae-sideplay' : ''}" data-message-id="${messageIndex}">
            <div class="horae-panel-toggle">
                <div class="horae-panel-icon">
                    <i class="fa-regular ${isSkipped ? 'fa-eye-slash' : 'fa-clock'}"></i>
                </div>
                <div class="horae-panel-summary">
                    ${isSkipped ? `<span class="horae-sideplay-badge">${t('badge.sideplay')}</span>` : ''}
                    <span class="horae-summary-time">${isSkipped ? t('badge.noTracking') : time}</span>
                    <span class="horae-summary-divider">|</span>
                    <span class="horae-summary-event">${isSkipped ? t('badge.sideplayMarked') : eventSummary}</span>
                    <span class="horae-summary-divider">|</span>
                    <span class="horae-summary-chars">${isSkipped ? '' : charCount + ' ' + t('characters.present')}</span>
                </div>
                <div class="horae-panel-actions">
                    <button class="horae-btn-sideplay" title="${t('tooltip.sideplayMark')}" style="${sideplayBtnStyle}">
                        <i class="fa-solid ${isSkipped ? 'fa-eye' : 'fa-masks-theater'}"></i>
                    </button>
                    <button class="horae-btn-rescan" title="${t('tooltip.rescan')}">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                    <button class="horae-btn-expand" title="${t('tooltip.aiAnalysis')}">
                        <i class="fa-solid fa-magnifying-glass"></i>
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
            // 应用自定义宽度和偏移
            const w = Math.max(50, Math.min(100, settings.panelWidth || 100));
            if (w < 100 && panelEl) {
                panelEl.style.maxWidth = `${w}%`;
            }
            const ofs = Math.max(0, settings.panelOffset || 0);
            if (ofs > 0 && panelEl) {
                panelEl.style.marginLeft = `${ofs}px`;
            }
            // 继承主题模式
            if (isLightMode() && panelEl) {
                panelEl.classList.add('horae-light');
            }
            renderRpgHud(messageEl, messageIndex);
        }
    } catch (err) {
        console.error(`[Horae] addMessagePanel #${messageIndex} 失败:`, err);
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
 * 构建悬念簿编辑行
 */
function buildAgendaTypeOptions(selectedType = '计划') {
    const normalizedType = horaeManager.normalizeAgendaType(selectedType);
    return `
        <option value="计划" ${normalizedType === '计划' ? 'selected' : ''}>${t('timeline.plan')}</option>
        <option value="悬念" ${normalizedType === '悬念' ? 'selected' : ''}>${t('timeline.mystery')}</option>
    `;
}

function buildAgendaEditorRows(agenda) {
    if (!agenda || agenda.length === 0) {
        return '';
    }
    return agenda.map(item => `
        <div class="horae-editor-row horae-agenda-edit-row" data-agenda-type="${escapeHtml(horaeManager.normalizeAgendaType(item.type))}">
            <select class="horae-agenda-type-select">
                ${buildAgendaTypeOptions(item.type)}
            </select>
            <input type="text" class="horae-agenda-date" style="flex:0 0 90px;max-width:90px;" value="${escapeHtml(item.date || '')}" placeholder="${t('placeholder.agendaDate')}">
            <input type="text" class="horae-agenda-text" style="flex:1 1 0;min-width:0;" value="${escapeHtml(item.text || '')}" placeholder="${t('placeholder.agendaContentHint')}">
            <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
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
            <label><i class="fa-solid fa-diagram-project"></i> ${t('characters.relationships')}</label>
            <div class="horae-panel-relationships">${rows}</div>
        </div>`;
}

function buildPanelMoodEditable(meta) {
    if (!settings.sendMood) return '';
    const moodEntries = Object.entries(meta.mood || {});
    const rows = moodEntries.map(([char, emotion]) => `
        <div class="horae-editor-row horae-mood-row">
            <span class="mood-char">${escapeHtml(char)}</span>
            <input type="text" class="mood-emotion" value="${escapeHtml(emotion)}" placeholder="${t('placeholder.moodState')}"
            <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
    return `
        <div class="horae-panel-row full-width">
            <label><i class="fa-solid fa-face-smile"></i> ${t('ui.moodLabel')}</label>
            <div class="horae-mood-editor">${rows}</div>
            <button class="horae-btn-add-mood"><i class="fa-solid fa-plus"></i> ${t('common.add')}</button>
        </div>`;
}

function buildPanelContent(messageIndex, meta) {
    const costumeRows = Object.entries(meta.costumes || {}).map(([char, costume]) => `
        <div class="horae-editor-row">
            <input type="text" class="char-input" value="${escapeHtml(char)}" placeholder="${t('placeholder.holderName')}">
            <input type="text" value="${escapeHtml(costume)}" placeholder="${t('placeholder.costumeDesc')}">
            <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');

    // 物品分类由主页面管理，底部栏不显示
    const itemRows = Object.entries(meta.items || {}).map(([name, info]) => {
        return `
            <div class="horae-editor-row horae-item-row">
                <input type="text" class="horae-item-icon" value="${escapeHtml(info.icon || '')}" placeholder="📦" maxlength="2">
                <input type="text" class="horae-item-name" value="${escapeHtml(name)}" placeholder="${t('placeholder.itemName')}">
                <input type="text" class="horae-item-holder" value="${escapeHtml(info.holder || '')}" placeholder="${t('label.holder')}">
                <input type="text" class="horae-item-location" value="${escapeHtml(info.location || '')}" placeholder="${t('label.location')}">
                <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="horae-editor-row horae-item-desc-row">
                <input type="text" class="horae-item-description" value="${escapeHtml(info.description || '')}" placeholder="${t('placeholder.itemDesc')}">
            </div>
        `;
    }).join('');

    // 获取前一条消息的好感总值（使用缓存避免 O(n²) 重复遍历）
    const prevTotals = {};
    const chat = horaeManager.getChat();
    if (!buildPanelContent._affCache || buildPanelContent._affCacheLen !== chat.length) {
        buildPanelContent._affCache = [];
        buildPanelContent._affCacheLen = chat.length;
        const running = {};
        for (let i = 0; i < chat.length; i++) {
            const m = chat[i]?.horae_meta;
            if (m?.affection) {
                for (const [k, v] of Object.entries(m.affection)) {
                    let val = 0;
                    if (typeof v === 'object' && v !== null) {
                        if (v.type === 'absolute') val = parseFloat(v.value) || 0;
                        else if (v.type === 'relative') val = (running[k] || 0) + (parseFloat(v.value) || 0);
                    } else {
                        val = (running[k] || 0) + (parseFloat(v) || 0);
                    }
                    running[k] = val;
                }
            }
            buildPanelContent._affCache[i] = { ...running };
        }
    }
    if (messageIndex > 0 && buildPanelContent._affCache[messageIndex - 1]) {
        Object.assign(prevTotals, buildPanelContent._affCache[messageIndex - 1]);
    }

    const affectionRows = Object.entries(meta.affection || {}).map(([key, value]) => {
        // 解析当前层的值
        let delta = 0, newTotal = 0;
        const prevVal = prevTotals[key] || 0;

        if (typeof value === 'object' && value !== null) {
            if (value.type === 'absolute') {
                newTotal = parseFloat(value.value) || 0;
                delta = newTotal - prevVal;
            } else if (value.type === 'relative') {
                delta = parseFloat(value.value) || 0;
                newTotal = prevVal + delta;
            }
        } else {
            delta = parseFloat(value) || 0;
            newTotal = prevVal + delta;
        }

        const roundedDelta = Math.round(delta * 100) / 100;
        const roundedTotal = Math.round(newTotal * 100) / 100;
        const deltaStr = roundedDelta >= 0 ? `+${roundedDelta}` : `${roundedDelta}`;
        return `
            <div class="horae-editor-row horae-affection-row" data-char="${escapeHtml(key)}" data-prev="${prevVal}">
                <span class="horae-affection-char">${escapeHtml(key)}</span>
                <input type="text" class="horae-affection-delta" value="${deltaStr}" placeholder="${t('placeholder.affectionDelta')}">
                <input type="number" class="horae-affection-total" value="${roundedTotal}" placeholder="${t('placeholder.affectionTotal')}" step="any">
                <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    }).join('');

    // 兼容新旧事件格式
    const eventsArr = meta.events || (meta.event ? [meta.event] : []);
    const firstEvent = eventsArr[0] || {};
    const eventLevel = firstEvent.level || '';
    const eventSummary = firstEvent.summary || '';
    const multipleEventsNote = eventsArr.length > 1 ? `<span class="horae-note">${t('ui.multipleEventsNote', { n: eventsArr.length })}</span>` : '';

    return `
        <div class="horae-panel-grid">
            <div class="horae-panel-row">
                <label><i class="fa-regular fa-clock"></i> ${t('label.time')}</label>
                <div class="horae-panel-value">
                    <input type="text" class="horae-input-datetime" placeholder="${t('placeholder.dateTime')}" value="${escapeHtml((() => {
        let val = meta.timestamp?.story_date || '';
        if (meta.timestamp?.story_time) val += (val ? ' ' : '') + meta.timestamp.story_time;
        return val;
    })())}">
                </div>
            </div>
            <div class="horae-panel-row">
                <label><i class="fa-solid fa-location-dot"></i> ${t('label.location')}</label>
                <div class="horae-panel-value">
                    <input type="text" class="horae-input-location" value="${escapeHtml(meta.scene?.location || '')}" placeholder="${t('label.location')}">
                </div>
            </div>
            <div class="horae-panel-row">
                <label><i class="fa-solid fa-cloud"></i> ${t('label.atmosphere')}</label>
                <div class="horae-panel-value">
                    <input type="text" class="horae-input-atmosphere" value="${escapeHtml(meta.scene?.atmosphere || '')}" placeholder="${t('label.atmosphere')}">
                </div>
            </div>
            <div class="horae-panel-row">
                <label><i class="fa-solid fa-users"></i> ${t('characters.present')}</label>
                <div class="horae-panel-value">
                    <input type="text" class="horae-input-characters" value="${escapeHtml((meta.scene?.characters_present || []).join(', '))}" placeholder="${t('placeholder.charactersSeparated')}">
                </div>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-shirt"></i> ${t('status.costumes')}</label>
                <div class="horae-costume-editor">${costumeRows}</div>
                <button class="horae-btn-add-costume"><i class="fa-solid fa-plus"></i> ${t('common.add')}</button>
            </div>
            ${buildPanelMoodEditable(meta)}
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-box-open"></i> ${t('status.itemTracking')}</label>
                <div class="horae-items-editor">${itemRows}</div>
                <button class="horae-btn-add-item"><i class="fa-solid fa-plus"></i> ${t('common.add')}</button>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-trash-can"></i> ${t('items.deletedItems')}</label>
                <div class="horae-deleted-items-display">${buildDeletedItemsDisplay(meta.deletedItems)}</div>
            </div>
            <div class="horae-panel-row full-width horae-event-row">
                <div class="horae-event-header">
                    <label><i class="fa-solid fa-bookmark"></i> ${t('timeline.events')} ${multipleEventsNote}</label>
                    <select class="horae-input-event-level">
                        <option value="">${t('levels.none')}</option>
                        <option value="一般" ${eventLevel === '一般' ? 'selected' : ''}>${t('levels.normal')}</option>
                        <option value="重要" ${eventLevel === '重要' ? 'selected' : ''}>${t('levels.important')}</option>
                        <option value="关键" ${eventLevel === '关键' || eventLevel === '關鍵' ? 'selected' : ''}>${t('levels.critical')}</option>
                    </select>
                </div>
                <div class="horae-event-editor">
                    <textarea class="horae-input-event-summary" rows="3" placeholder="${t('placeholder.eventSummary')}">${escapeHtml(eventSummary)}</textarea>
                </div>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-heart"></i> ${t('characters.affection')}</label>
                <div class="horae-affection-editor">${affectionRows}</div>
                <button class="horae-btn-add-affection"><i class="fa-solid fa-plus"></i> ${t('common.add')}</button>
            </div>
            <div class="horae-panel-row full-width">
                <label><i class="fa-solid fa-list-check"></i> ${t('timeline.agenda')}</label>
                <div class="horae-agenda-editor">${buildAgendaEditorRows(meta.agenda)}</div>
                <button class="horae-btn-add-agenda-row"><i class="fa-solid fa-plus"></i> ${t('common.add')}</button>
            </div>
            ${buildPanelRelationships(meta)}
        </div>
        <div class="horae-panel-rescan">
            <div class="horae-rescan-label"><i class="fa-solid fa-rotate"></i> ${t('ui.rescanMessage')}</div>
            <div class="horae-rescan-buttons">
                <button class="horae-btn-quick-scan horae-btn" title="${t('ui.quickScanTitle')}">
                    <i class="fa-solid fa-bolt"></i> ${t('tooltip.quickScan')}
                </button>
                <button class="horae-btn-ai-analyze horae-btn" title="${t('ui.aiAnalyzeTitle')}">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> ${t('tooltip.aiAnalysis')}
                </button>
            </div>
        </div>
        <div class="horae-panel-footer">
            <button class="horae-btn-save horae-btn"><i class="fa-solid fa-check"></i> ${t('common.save')}</button>
            <button class="horae-btn-cancel horae-btn"><i class="fa-solid fa-xmark"></i> ${t('common.cancel')}</button>
            <button class="horae-btn-open-drawer horae-btn" title="${t('tooltip.openPanel')}"><i class="fa-solid fa-clock-rotate-left"></i></button>
        </div>
    `;
}

/**
 * 楼层面板 AI 分析入口守卫：
 * 1) 已有时间线先确认是否重跑
 * 2) 分析中则阻止重复触发
 * 3) 满足条件后执行传入的分析方法
 */
async function handlePanelAiAnalyzeAction(messageId, runAnalysis, options = {}) {
    if (typeof runAnalysis !== 'function') return false;

    const {
        reanalyzeConfirmText = '该楼层已有时间线数据，是否重新分析？',
        analyzingToastText = '正在分析中，请稍后',
    } = options;

    const existingMeta = horaeManager.getMessageMeta(messageId);
    const hasTimeline = _hasTimelineSummary(existingMeta);

    if (hasTimeline && !confirm(reanalyzeConfirmText)) {
        return false;
    }

    if (_panelAiAnalysisInProgress.has(messageId)) {
        showToast(analyzingToastText, 'info');
        return false;
    }

    _panelAiAnalysisInProgress.add(messageId);
    try {
        await runAnalysis();
        return true;
    } finally {
        _panelAiAnalysisInProgress.delete(messageId);
    }
}

function _hasTimelineSummary(meta) {
    const events = meta?.events || (meta?.event ? [meta.event] : []);
    return events.some(evt => evt?.summary && String(evt.summary).trim());
}

function _preserveRebuildControlFlags(targetMeta, sourceMeta) {
    if (!targetMeta || !sourceMeta) return;
    if (sourceMeta._skipHorae) targetMeta._skipHorae = true;
    if (sourceMeta._aiScanned) targetMeta._aiScanned = true;
    const savedFlags = _saveCompressedFlags(sourceMeta);
    if (savedFlags) _restoreCompressedFlags(targetMeta, savedFlags);
}

function _rebuildDerivedMetaCaches() {
    horaeManager.rebuildTableData();
    horaeManager.rebuildRelationships();
    horaeManager.rebuildLocationMemory();
    horaeManager.rebuildRpgData();
}

function autoResizePanelTextarea(textarea) {
    if (!(textarea instanceof HTMLTextAreaElement)) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 72)}px`;
}

function initPanelAutoResize(panelEl) {
    if (!panelEl) return;
    panelEl.querySelectorAll('.horae-input-event-summary').forEach(textarea => {
        if (!(textarea instanceof HTMLTextAreaElement)) return;
        autoResizePanelTextarea(textarea);
        if (textarea.dataset.horaeAutosizeBound === '1') return;
        textarea.dataset.horaeAutosizeBound = '1';
        const resize = () => autoResizePanelTextarea(textarea);
        textarea.addEventListener('input', resize);
        textarea.addEventListener('change', resize);
    });
}

/**
 * 绑定面板事件
 */
function bindPanelEvents(panelEl) {
    if (!panelEl) return;

    const messageId = parseInt(panelEl.dataset.messageId);
    const contentEl = panelEl.querySelector('.horae-panel-content');

    // 头部区域事件只绑定一次，避免重复绑定导致 toggle 互相抵消
    if (!panelEl._horaeBound) {
        panelEl._horaeBound = true;
        const toggleEl = panelEl.querySelector('.horae-panel-toggle');
        const expandBtn = panelEl.querySelector('.horae-btn-expand');
        const rescanBtn = panelEl.querySelector('.horae-btn-rescan');

        const togglePanel = () => {
            const isHidden = contentEl.style.display === 'none';
            contentEl.style.display = isHidden ? 'block' : 'none';
            if (isHidden) requestAnimationFrame(() => initPanelAutoResize(panelEl));
        };

        const sideplayBtn = panelEl.querySelector('.horae-btn-sideplay');

        toggleEl?.addEventListener('click', (e) => {
            if (e.target.closest('.horae-btn-expand') || e.target.closest('.horae-btn-rescan') || e.target.closest('.horae-btn-sideplay')) return;
            togglePanel();
        });
        expandBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handlePanelAiAnalyzeAction(messageId, () => runPanelAiAnalyze(expandBtn));
        });
        rescanBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            rescanMessageMeta(messageId, panelEl);
        });
        sideplayBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSideplay(messageId, panelEl).catch(err => {
                console.error(`[Horae] 切换番外标记失败 #${messageId}:`, err);
            });
        });
    }

    requestAnimationFrame(() => initPanelAutoResize(panelEl));

    // 标记面板已修改
    let panelDirty = false;
    contentEl?.addEventListener('input', () => { panelDirty = true; });
    contentEl?.addEventListener('change', () => { panelDirty = true; });

    panelEl.querySelector('.horae-btn-save')?.addEventListener('click', () => {
        savePanelData(panelEl, messageId);
        panelDirty = false;
    });

    panelEl.querySelector('.horae-btn-cancel')?.addEventListener('click', () => {
        if (panelDirty && !confirm(t('confirm.closeUnsaved'))) return;
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
                <input type="text" class="char-input" placeholder="${t('placeholder.holderName')}">
                <input type="text" placeholder="${t('placeholder.costumeDesc')}">
                <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `);
        bindDeleteButtons(editor);
    });

    panelEl.querySelector('.horae-btn-add-mood')?.addEventListener('click', () => {
        const editor = panelEl.querySelector('.horae-mood-editor');
        if (!editor) return;
        editor.insertAdjacentHTML('beforeend', `
            <div class="horae-editor-row horae-mood-row">
                <input type="text" class="mood-char" placeholder="${t('placeholder.holderName')}">
                <input type="text" class="mood-emotion" placeholder="${t('placeholder.moodState')}">
                <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
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
                <input type="text" class="horae-item-icon" placeholder="📦" maxlength="2">
                <input type="text" class="horae-item-name" placeholder="${t('placeholder.itemName')}">
                <input type="text" class="horae-item-holder" placeholder="${t('label.holder')}">
                <input type="text" class="horae-item-location" placeholder="${t('label.location')}">
                <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="horae-editor-row horae-item-desc-row">
                <input type="text" class="horae-item-description" placeholder="${t('placeholder.itemDesc')}">
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
                <input type="text" class="horae-affection-char-input" placeholder="${t('placeholder.holderName')}">
                <input type="text" class="horae-affection-delta" value="+0" placeholder="${t('placeholder.affectionDelta')}">
                <input type="number" class="horae-affection-total" value="0" placeholder="${t('placeholder.affectionTotal')}">
                <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `);
        bindDeleteButtons(editor);
        bindAffectionInputs(editor);
    });

    // 添加悬念簿行
    panelEl.querySelector('.horae-btn-add-agenda-row')?.addEventListener('click', () => {
        const editor = panelEl.querySelector('.horae-agenda-editor');
        const emptyHint = editor.querySelector('.horae-empty-hint');
        if (emptyHint) emptyHint.remove();

        editor.insertAdjacentHTML('beforeend', `
            <div class="horae-editor-row horae-agenda-edit-row" data-agenda-type="计划">
                <select class="horae-agenda-type-select">
                    ${buildAgendaTypeOptions('计划')}
                </select>
                <input type="text" class="horae-agenda-date" style="flex:0 0 90px;max-width:90px;" value="" placeholder="${t('placeholder.agendaDate')}">
                <input type="text" class="horae-agenda-text" style="flex:1 1 0;min-width:0;" value="" placeholder="${t('placeholder.agendaContentHint')}">
                <button class="horae-delete-btn"><i class="fa-solid fa-xmark"></i></button>
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
            showToast(t('toast.cannotGetContent'), 'error');
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
            // 全局同步
            if (parsed.relationships?.length > 0) {
                horaeManager._mergeRelationships(parsed.relationships);
            }
            if (parsed.scene?.scene_desc && parsed.scene?.location) {
                horaeManager._updateLocationMemory(parsed.scene.location, parsed.scene.scene_desc);
            }
            horaeManager.setMessageMeta(messageId, newMeta);

            const contentEl = panelEl.querySelector('.horae-panel-content');
            if (contentEl) {
                contentEl.innerHTML = buildPanelContent(messageId, newMeta);
                bindPanelEvents(panelEl);
            }

            getContext().saveChat();
            refreshAllDisplays();
            showToast(t('toast.saveSuccess'), 'success');
        } else {
            showToast(t('toast.noFormatData'), 'warning');
        }
    });

    async function runPanelAiAnalyze(btn) {
        const chat = horaeManager.getChat();
        const message = chat[messageId];
        if (!message) {
            showToast(t('toast.cannotGetContent'), 'error');
            return;
        }

        let originalText = '';
        if (btn) {
            originalText = btn.innerHTML;
            btn.innerHTML = btn.classList.contains('horae-btn-ai-analyze')
                ? `<i class="fa-solid fa-spinner fa-spin"></i> ${t('ui.analyzing')}`
                : `<i class="fa-solid fa-spinner fa-spin"></i>`;
            btn.disabled = true;
        }

        try {
            const result = await analyzeMessageWithAI(message.mes, { messageIndex: messageId });

            if (result) {
                const existingMeta = horaeManager.getMessageMeta(messageId) || createEmptyMeta();
                const shouldRebuild = _hasTimelineSummary(existingMeta);
                const baseMeta = shouldRebuild ? createEmptyMeta() : existingMeta;
                const newMeta = horaeManager.mergeParsedToMeta(baseMeta, result);
                if (shouldRebuild) {
                    _preserveRebuildControlFlags(newMeta, existingMeta);
                    if (newMeta._tableUpdates) {
                        newMeta.tableContributions = newMeta._tableUpdates;
                        delete newMeta._tableUpdates;
                    }
                } else if (newMeta._tableUpdates) {
                    horaeManager.applyTableUpdates(newMeta._tableUpdates);
                    delete newMeta._tableUpdates;
                }
                // 处理已完成待办
                if (result.deletedAgenda && result.deletedAgenda.length > 0) {
                    horaeManager.removeCompletedAgenda(result.deletedAgenda);
                }
                horaeManager.setMessageMeta(messageId, newMeta);
                if (shouldRebuild) {
                    _rebuildDerivedMetaCaches();
                } else {
                    // 全局同步（增量模式）
                    if (result.relationships?.length > 0) {
                        horaeManager._mergeRelationships(result.relationships);
                    }
                    if (result.scene?.scene_desc && result.scene?.location) {
                        horaeManager._updateLocationMemory(result.scene.location, result.scene.scene_desc);
                    }
                }
                injectHoraeTagToMessage(messageId, newMeta);

                const contentEl = panelEl.querySelector('.horae-panel-content');
                if (contentEl) {
                    contentEl.innerHTML = buildPanelContent(messageId, newMeta);
                    bindPanelEvents(panelEl);
                }

                getContext().saveChat();
                refreshAllDisplays();
                showToast(t('toast.saveSuccess'), 'success');

                // 更新面板摘要（收缩态）
                const summaryTime = panelEl.querySelector('.horae-summary-time');
                const summaryEvent = panelEl.querySelector('.horae-summary-event');
                const summaryChars = panelEl.querySelector('.horae-summary-chars');

                if (summaryTime) {
                    if (newMeta.timestamp.story_date) {
                        const parsed = parseStoryDate(newMeta.timestamp.story_date);
                        let dateDisplay = newMeta.timestamp.story_date;
                        if (parsed && parsed.type === 'standard') {
                            dateDisplay = formatStoryDate(parsed, true);
                        }
                        summaryTime.textContent = dateDisplay + (newMeta.timestamp.story_time ? ' ' + newMeta.timestamp.story_time : '');
                    } else {
                        summaryTime.textContent = '--';
                    }
                }
                if (summaryEvent) {
                    const evts = newMeta.events || (newMeta.event ? [newMeta.event] : []);
                    summaryEvent.textContent = evts.length > 0 ? evts.map(e => e.summary).join(' | ') : t('ui.noSpecialEvents');
                }
                if (summaryChars) {
                    summaryChars.textContent = t('ui.presentCount', { n: newMeta.scene.characters_present.length });
                }
            } else {
                showToast(t('toast.aiAnalysisNoData'), 'warning');
            }
        } catch (error) {
            console.error('[Horae] AI分析失败:', error);
            showToast(t('toast.aiAnalysisFailed', { error: error.message }), 'error');
        } finally {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    }

    // AI分析按钮（消耗API）
    panelEl.querySelector('.horae-btn-ai-analyze')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const btn = panelEl.querySelector('.horae-btn-ai-analyze');
        await handlePanelAiAnalyzeAction(messageId, () => runPanelAiAnalyze(btn));
    });
}

/**
 * 绑定删除按钮事件
 */
function bindDeleteButtons(container) {
    container.querySelectorAll('.horae-delete-btn').forEach(btn => {
        btn.onclick = () => {
            const row = btn.closest('.horae-editor-row');
            if (row?.classList.contains('horae-item-row')) {
                const descRow = row.nextElementSibling;
                if (descRow?.classList.contains('horae-item-desc-row')) {
                    descRow.remove();
                }
            }
            row?.remove();
        };
    });
}

/**
 * 绑定好感度输入框联动
 */
function bindAffectionInputs(container) {
    if (!container) return;

    container.querySelectorAll('.horae-affection-row').forEach(row => {
        const deltaInput = row.querySelector('.horae-affection-delta');
        const totalInput = row.querySelector('.horae-affection-total');
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

/** 切换消息的番外/小剧场标记 */
async function toggleSideplay(messageId, panelEl) {
    const meta = horaeManager.getMessageMeta(messageId);
    if (!meta) return;
    const wasSkipped = !!meta._skipHorae;
    meta._skipHorae = !wasSkipped;
    horaeManager.setMessageMeta(messageId, meta);

    // 关系网络/场景记忆会从全量消息重建，需排除番外消息后立即回收
    horaeManager.rebuildRelationships();
    horaeManager.rebuildLocationMemory();

    // 向量索引同步：番外消息从索引移除；取消番外则补回索引
    if (settings.vectorEnabled && vectorManager.isReady) {
        try {
            if (meta._skipHorae) {
                await vectorManager.removeMessage(messageId);
            } else {
                await vectorManager.addMessage(messageId, meta);
            }
        } catch (err) {
            console.warn(`[Horae] 同步番外向量索引失败 #${messageId}:`, err);
        }
    }

    await getContext().saveChat();

    // 重建面板
    const messageEl = panelEl.closest('.mes');
    if (messageEl) {
        panelEl.remove();
        addMessagePanel(messageEl, messageId);
    }
    refreshAllDisplays();
    showToast(meta._skipHorae ? t('badge.sideplayMarked') : t('toast.saveSuccess'), 'success');
}

/** 重新扫描消息并更新面板（完全替换） */
function rescanMessageMeta(messageId, panelEl) {
    // 从DOM获取最新的消息内容（用户可能已编辑）
    const messageEl = panelEl.closest('.mes');
    if (!messageEl) {
        showToast(t('toast.msgElementNotFound'), 'error');
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
        showToast(t('toast.cannotGetContent'), 'error');
        return;
    }

    const existingMeta = horaeManager.getMessageMeta(messageId) || createEmptyMeta();
    const shouldRebuild = _hasTimelineSummary(existingMeta);
    if (shouldRebuild && !confirm('该楼层已有时间线数据，是否重新分析？')) {
        return;
    }

    const parsed = horaeManager.parseHoraeTag(messageContent);

    if (parsed) {
        // 用 mergeParsedToMeta 以空 meta 为基础，确保所有字段一致处理
        const newMeta = horaeManager.mergeParsedToMeta(createEmptyMeta(), parsed);

        if (shouldRebuild) {
            _preserveRebuildControlFlags(newMeta, existingMeta);
        } else {
            // 只保留原有的NPC数据（如果新解析中没有）
            if ((!parsed.npcs || Object.keys(parsed.npcs).length === 0) && existingMeta?.npcs) {
                newMeta.npcs = existingMeta.npcs;
            }

            // 无新agenda则保留旧数据
            if ((!newMeta.agenda || newMeta.agenda.length === 0) && existingMeta?.agenda?.length > 0) {
                newMeta.agenda = existingMeta.agenda;
            }
            if ((!newMeta.deletedAgenda || newMeta.deletedAgenda.length === 0) && existingMeta?.deletedAgenda?.length > 0) {
                newMeta.deletedAgenda = existingMeta.deletedAgenda;
            }
        }

        // 处理表格更新
        if (shouldRebuild && newMeta._tableUpdates) {
            newMeta.tableContributions = newMeta._tableUpdates;
            delete newMeta._tableUpdates;
        } else if (newMeta._tableUpdates) {
            horaeManager.applyTableUpdates(newMeta._tableUpdates);
            delete newMeta._tableUpdates;
        }

        // 处理已完成待办
        if (parsed.deletedAgenda && parsed.deletedAgenda.length > 0) {
            horaeManager.removeCompletedAgenda(parsed.deletedAgenda);
        }

        horaeManager.setMessageMeta(messageId, newMeta);
        if (shouldRebuild) {
            _rebuildDerivedMetaCaches();
        } else {
            // 全局同步：关系网络合并到 chat[0]
            if (parsed.relationships?.length > 0) {
                horaeManager._mergeRelationships(parsed.relationships);
            }
            // 全局同步：场景记忆更新
            if (parsed.scene?.scene_desc && parsed.scene?.location) {
                horaeManager._updateLocationMemory(parsed.scene.location, parsed.scene.scene_desc);
            }
        }
        getContext().saveChat();

        panelEl.remove();
        addMessagePanel(messageEl, messageId);

        // 同时刷新主显示
        refreshAllDisplays();

        showToast(t('toast.saveSuccess'), 'success');
    } else {
        // 无标签，清空数据（保留NPC）
        const newMeta = createEmptyMeta();
        if (shouldRebuild) {
            _preserveRebuildControlFlags(newMeta, existingMeta);
        } else if (existingMeta?.npcs) {
            newMeta.npcs = existingMeta.npcs;
        }
        horaeManager.setMessageMeta(messageId, newMeta);
        if (shouldRebuild) {
            _rebuildDerivedMetaCaches();
        }

        panelEl.remove();
        addMessagePanel(messageEl, messageId);
        refreshAllDisplays();

        showToast(t('toast.noHoraeTagsFound'), 'warning');
    }
}

/**
 * 保存面板数据
 */
function savePanelData(panelEl, messageId) {
    // 获取现有的 meta，保留面板中没有编辑区的数据（如 NPC）
    const existingMeta = horaeManager.getMessageMeta(messageId);
    const meta = createEmptyMeta();

    // 保留面板中没有编辑区的数据
    if (existingMeta?.npcs) {
        meta.npcs = JSON.parse(JSON.stringify(existingMeta.npcs));
    }
    if (existingMeta?.relationships?.length) {
        meta.relationships = JSON.parse(JSON.stringify(existingMeta.relationships));
    }
    if (existingMeta?.scene?.scene_desc) {
        meta.scene.scene_desc = existingMeta.scene.scene_desc;
    }
    if (existingMeta?.mood && Object.keys(existingMeta.mood).length > 0) {
        meta.mood = JSON.parse(JSON.stringify(existingMeta.mood));
    }
    if (existingMeta?.deletedAgenda?.length > 0) {
        meta.deletedAgenda = JSON.parse(JSON.stringify(existingMeta.deletedAgenda));
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
        const iconInput = row.querySelector('.horae-item-icon');
        const nameInput = row.querySelector('.horae-item-name');
        const holderInput = row.querySelector('.horae-item-holder');
        const locationInput = row.querySelector('.horae-item-location');
        const descRow = itemDescRows[idx];
        const descInput = descRow?.querySelector('.horae-item-description');

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
            is_important: eventLevel === '重要' || eventLevel === '关键' || eventLevel === '關鍵',
            level: eventLevel,
            summary: eventSummary
        }];
    }

    panelEl.querySelectorAll('.horae-affection-editor .horae-affection-row').forEach(row => {
        const charSpan = row.querySelector('.horae-affection-char');
        const charInput = row.querySelector('.horae-affection-char-input');
        const totalInput = row.querySelector('.horae-affection-total');

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
        const typeSelect = row.querySelector('.horae-agenda-type-select');
        const dateInput = row.querySelector('.horae-agenda-date');
        const textInput = row.querySelector('.horae-agenda-text');
        const date = dateInput?.value?.trim() || '';
        const text = textInput?.value?.trim() || '';
        if (text) {
            const existingAgendaItem = existingMeta?.agenda?.find(a => a.text === text);
            const type = horaeManager.normalizeAgendaType(typeSelect?.value || row.dataset.agendaType || existingAgendaItem?.type || '计划');
            const source = existingAgendaItem?.source || 'user';
            agendaItems.push({ type, date, text, source, done: false });
        }
    });
    if (agendaItems.length > 0) {
        meta.agenda = agendaItems;
    } else if (existingMeta?.agenda?.length > 0) {
        // 无编辑行时保留原有待办
        meta.agenda = existingMeta.agenda;
    }

    horaeManager.setMessageMeta(messageId, meta);

    // 全局同步
    if (meta.relationships?.length > 0) {
        horaeManager._mergeRelationships(meta.relationships);
    }
    if (meta.scene?.scene_desc && meta.scene?.location) {
        horaeManager._updateLocationMemory(meta.scene.location, meta.scene.scene_desc);
    }

    // 同步写入正文标签
    injectHoraeTagToMessage(messageId, meta);

    getContext().saveChat();

    showToast(t('toast.saveSuccess'), 'success');
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
        const evts = meta.events || (meta.event ? [meta.event] : []);
        summaryEvent.textContent = evts.length > 0 ? evts.map(e => e.summary).join(' | ') : t('ui.noSpecialEvents');
    }
    if (summaryChars) {
        summaryChars.textContent = t('ui.presentCount', { n: meta.scene.characters_present.length });
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
            if (info.birthday) extras.push(`生日:${info.birthday}`);
            if (info.note) extras.push(`补充:${info.note}`);
            if (extras.length > 0) npcLine += `~${extras.join('~')}`;
            lines.push(npcLine);
        }
    }

    if (meta.agenda?.length > 0) {
        for (const item of meta.agenda) {
            if (item.text) {
                const agendaType = horaeManager.normalizeAgendaType(item.type);
                const datePart = item.date || '';
                lines.push(`hold:${agendaType}|${datePart}|${item.text}`);
            }
        }
    }

    if (meta.deletedAgenda?.length > 0) {
        for (const text of meta.deletedAgenda) {
            const normalized = String(text || '').trim();
            if (normalized) lines.push(`hold-:${normalized}`);
        }
    }

    if (meta.relationships?.length > 0) {
        for (const r of meta.relationships) {
            if (r.from && r.to && r.type) {
                lines.push(`rel:${r.from}>${r.to}=${r.type}${r.note ? '|' + r.note : ''}`);
            }
        }
    }

    if (meta.mood && Object.keys(meta.mood).length > 0) {
        for (const [char, emotion] of Object.entries(meta.mood)) {
            if (char && emotion) lines.push(`mood:${char}=${emotion}`);
        }
    }

    if (meta.scene?.scene_desc) {
        lines.push(`scene_desc:${meta.scene.scene_desc}`);
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
    $('.horae-tab').on('click', function () {
        const tabId = $(this).data('tab');

        $('.horae-tab').removeClass('active');
        $(this).addClass('active');

        $('.horae-tab-content').removeClass('active');
        $(`#horae-tab-${tabId}`).addClass('active');

        switch (tabId) {
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
    $('#horae-btn-restart-tutorial').on('click', () => startTutorial());

    $('#horae-setting-ui-language').val(settings.uiLanguage || 'auto').on('change', async function () {
        const prev = settings.uiLanguage;
        settings.uiLanguage = this.value;
        saveSettings();
        const newLang = await setLanguage(this.value === 'auto' ? 'auto' : this.value);
        await ensurePromptDefaults(detectEffectiveAiLang(settings));
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        applyI18nToDOM(document.getElementById('horae-drawer') || document);
        updateAutoSummaryHint();
        initTabs();
        refreshAllDisplays();
        if (prev !== this.value) {
            const langNames = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'en': 'English', 'ko': '한국어', 'ja': '日本語', 'auto': 'Auto' };
            alert(t('confirm.languageChanged', { lang: langNames[newLang] || newLang }));
        }
    });

    $('#horae-setting-ai-output-language').val(settings.aiOutputLanguage || 'auto').on('change', async function () {
        settings.aiOutputLanguage = this.value;
        saveSettings();
        await ensurePromptDefaults(detectEffectiveAiLang(settings));
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    $('#horae-setting-enabled').on('change', function () {
        settings.enabled = this.checked;
        saveSettings();
    });

    $('#horae-setting-auto-parse').on('change', function () {
        settings.autoParse = this.checked;
        saveSettings();
    });

    $('#horae-setting-auto-fill-prev-timeline').on('change', function () {
        settings.autoFillPrevTimelineOnSend = this.checked;
        saveSettings();
    });

    $('#horae-setting-inject-context').on('change', function () {
        settings.injectContext = this.checked;
        saveSettings();
    });

    $('#horae-setting-inject-custom-prompts').on('change', function () {
        settings.injectCustomPrompts = this.checked;
        saveSettings();
    });

    $('#horae-setting-show-panel').on('change', function () {
        settings.showMessagePanel = this.checked;
        saveSettings();
        document.querySelectorAll('.horae-message-panel').forEach(panel => {
            panel.style.display = this.checked ? '' : 'none';
        });
    });

    $('#horae-setting-show-top-icon').on('change', function () {
        settings.showTopIcon = this.checked;
        saveSettings();
        applyTopIconVisibility();
    });

    $('#horae-setting-injection-position').on('change', function () {
        const val = parseInt(this.value, 10);
        settings.injectionPosition = Number.isNaN(val) ? 1 : Math.max(0, val);
        saveSettings();
    });

    $('#horae-setting-injection-depth-source').on('change', function () {
        const v = String(this.value || 'system');
        settings.injectionDepthSource = (v === 'preset') ? 'preset' : 'system';
        saveSettings();
    });

    $('#horae-setting-timeline-injection-mode').on('change', function () {
        const v = String(this.value || 'inline');
        settings.timelineInjectionMode = (v === 'separate') ? 'separate' : 'inline';
        saveSettings();
    });

    $('#horae-btn-scan-all, #horae-btn-scan-history').on('click', scanHistoryWithProgress);
    $('#horae-btn-ai-scan').on('click', batchAIScan);
    $('#horae-btn-undo-ai-scan').on('click', undoAIScan);

    $('#horae-btn-fix-summaries').on('click', () => {
        const result = repairAllSummaryStates();
        if (result > 0) {
            updateTimelineDisplay();
            showToast(t('toast.fixedSummaryStates', { n: result }), 'success');
        } else {
            showToast(t('toast.fixedSummaryStates', { n: 0 }), 'info');
        }
    });
    $('#horae-btn-auto-summary-now').on('click', async () => {
        if (_summaryInProgress) {
            showToast('自动总结正在执行中', 'info');
            return;
        }
        if (!settings.enabled || !settings.autoSummaryEnabled || !settings.sendTimeline) {
            showToast('自动总结未启用（请检查总开关、自动总结、时间线发送）', 'warning');
            return;
        }
        showToast('已手动触发自动总结检查', 'info');
        try {
            await checkAutoSummary();
        } catch (err) {
            console.error('[Horae] manual auto-summary trigger failed:', err);
            showToast(t('toast.autoSummaryFailed', { error: err?.message || err }), 'error');
        }
    });

    $('#horae-timeline-filter').on('change', updateTimelineDisplay);
    $('#horae-timeline-search').on('input', updateTimelineDisplay);

    $('#horae-btn-add-agenda').on('click', () => openAgendaEditModal(null));
    $('#horae-btn-add-relationship').on('click', () => openRelationshipEditModal(null));
    $('#horae-btn-add-location').on('click', () => openLocationEditModal(null));
    $('#horae-btn-merge-locations').on('click', openLocationMergeModal);

    // RPG 属性条配置
    $(document).on('input', '.horae-rpg-config-key:not([data-type="attr"])', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgBarConfig?.[i]) {
            const val = this.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (val) settings.rpgBarConfig[i].key = val;
            saveSettings();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
        }
    });
    $(document).on('input', '.horae-rpg-config-name:not([data-type="attr"])', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgBarConfig?.[i]) {
            settings.rpgBarConfig[i].name = this.value.trim() || settings.rpgBarConfig[i].key.toUpperCase();
            saveSettings();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
        }
    });
    $(document).on('input', '.horae-rpg-config-desc', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgBarConfig?.[i]) {
            settings.rpgBarConfig[i].desc = this.value.trim();
            saveSettings();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
        }
    });
    $(document).on('input', '.horae-rpg-config-min, .horae-rpg-config-max, .horae-rpg-config-default-max', function () {
        const i = parseInt(this.dataset.idx);
        const bar = settings.rpgBarConfig?.[i];
        if (!bar) return;
        const n = parseInt(this.value, 10);
        if (!Number.isFinite(n)) return;
        if (this.classList.contains('horae-rpg-config-min')) bar.min = n;
        if (this.classList.contains('horae-rpg-config-max')) bar.max = n;
        if (this.classList.contains('horae-rpg-config-default-max')) bar.defaultMax = n;
        _normalizeRpgBarConfigInPlace();
        saveSettings();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });
    $(document).on('change', '.horae-rpg-config-required-check', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgBarConfig?.[i]) {
            settings.rpgBarConfig[i].required = this.checked;
            saveSettings();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
        }
    });
    $(document).on('input', '.horae-rpg-config-color', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgBarConfig?.[i]) {
            settings.rpgBarConfig[i].color = this.value;
            saveSettings();
        }
    });
    $(document).on('click', '.horae-rpg-config-del', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgBarConfig?.[i]) {
            settings.rpgBarConfig.splice(i, 1);
            saveSettings();
            renderBarConfig();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
        }
    });
    // 属性条：恢复默认
    $('#horae-rpg-bar-reset').on('click', () => {
        if (!confirm(t('confirm.restoreDefaultBars'))) return;
        settings.rpgBarConfig = _getDefaultRpgBarConfig();
        saveSettings(); renderBarConfig();
        horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
        showToast(t('toast.rpgBarsRestored'), 'success');
    });
    // 属性条：清理不在当前配置中的旧数据
    $('#horae-rpg-bar-clean').on('click', async () => {
        const chat = horaeManager.getChat();
        if (!chat?.length) { showToast(t('toast.noChatData'), 'warning'); return; }
        const validKeys = new Set((settings.rpgBarConfig || []).map(b => b.key));
        validKeys.add('status');
        const staleKeys = new Set();
        for (let i = 0; i < chat.length; i++) {
            const bars = chat[i]?.horae_meta?._rpgChanges?.bars;
            if (bars) for (const key of Object.keys(bars)) { if (!validKeys.has(key)) staleKeys.add(key); }
            const st = chat[i]?.horae_meta?._rpgChanges?.status;
            if (st) for (const key of Object.keys(st)) { if (!validKeys.has(key)) staleKeys.add(key); }
        }
        const globalBars = chat[0]?.horae_meta?.rpg?.bars;
        if (globalBars) for (const owner of Object.keys(globalBars)) {
            for (const key of Object.keys(globalBars[owner] || {})) { if (!validKeys.has(key)) staleKeys.add(key); }
        }
        if (staleKeys.size === 0) { showToast(t('toast.noStaleData'), 'success'); return; }
        const keyList = [...staleKeys].join('、');
        const ok = confirm(t('confirm.cleanStaleData'));
        if (!ok) return;
        let cleaned = 0;
        for (let i = 0; i < chat.length; i++) {
            const changes = chat[i]?.horae_meta?._rpgChanges;
            if (!changes) continue;
            for (const sub of ['bars', 'status']) {
                if (!changes[sub]) continue;
                for (const key of Object.keys(changes[sub])) {
                    if (staleKeys.has(key)) { delete changes[sub][key]; cleaned++; }
                }
            }
        }
        horaeManager.rebuildRpgData();
        await getContext().saveChat();
        refreshAllDisplays();
        showToast(t('toast.staleDataCleaned', { n: cleaned, keys: keyList }), 'success');
    });
    // 属性条：导出
    $('#horae-rpg-bar-export').on('click', () => {
        const blob = new Blob([JSON.stringify(settings.rpgBarConfig, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'horae-rpg-bars.json'; a.click(); URL.revokeObjectURL(a.href);
    });
    // 属性条：导入
    $('#horae-rpg-bar-import').on('click', () => document.getElementById('horae-rpg-bar-import-file')?.click());
    $('#horae-rpg-bar-import-file').on('change', function () {
        const file = this.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const arr = JSON.parse(reader.result);
                if (!Array.isArray(arr) || !arr.every(b => b.key && b.name)) throw new Error('invalid');
                settings.rpgBarConfig = arr;
                _normalizeRpgBarConfigInPlace();
                saveSettings(); renderBarConfig();
                horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
                showToast(t('toast.rpgBarsImported', { n: arr.length }), 'success');
            } catch (e) { showToast(t('toast.importFailed', { error: e.message }), 'error'); }
        };
        reader.readAsText(file);
        this.value = '';
    });
    // 属性面板：恢复默认
    $('#horae-rpg-attr-reset').on('click', () => {
        if (!confirm(t('confirm.restoreDefaultAttrs'))) return;
        settings.rpgAttributeConfig = _getDefaultRpgAttrConfig();
        saveSettings(); renderAttrConfig();
        horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
        showToast(t('toast.rpgBarsRestored'), 'success');
    });
    // 属性面板：导出
    $('#horae-rpg-attr-export').on('click', () => {
        const blob = new Blob([JSON.stringify(settings.rpgAttributeConfig, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'horae-rpg-attrs.json'; a.click(); URL.revokeObjectURL(a.href);
    });
    // 属性面板：导入
    $('#horae-rpg-attr-import').on('click', () => document.getElementById('horae-rpg-attr-import-file')?.click());
    $('#horae-rpg-attr-import-file').on('change', function () {
        const file = this.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const arr = JSON.parse(reader.result);
                if (!Array.isArray(arr) || !arr.every(a => a.key && a.name)) throw new Error('invalid');
                settings.rpgAttributeConfig = arr;
                saveSettings(); renderAttrConfig();
                horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
                showToast(t('toast.rpgAttrsImported', { n: arr.length }), 'success');
            } catch (e) { showToast(t('toast.importFailed', { error: e.message }), 'error'); }
        };
        reader.readAsText(file);
        this.value = '';
    });

    $('#horae-rpg-add-bar').on('click', () => {
        if (!settings.rpgBarConfig) settings.rpgBarConfig = [];
        const existing = new Set(settings.rpgBarConfig.map(b => b.key));
        let newKey = 'bar1';
        for (let n = 1; existing.has(newKey); n++) newKey = `bar${n}`;
        settings.rpgBarConfig.push({ key: newKey, name: newKey.toUpperCase(), color: '#a78bfa', min: 0, max: 100, defaultMax: 100, required: true, desc: '' });
        saveSettings();
        renderBarConfig();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    // 角色卡内编辑属性按钮
    $(document).on('click', '.horae-rpg-charattr-edit', function () {
        const charName = this.dataset.char;
        if (!charName) return;
        const form = document.getElementById('horae-rpg-charattr-form');
        if (!form) return;
        form.style.display = '';
        const attrCfg = settings.rpgAttributeConfig || [];
        const attrInputs = attrCfg.map(a =>
            `<div class="horae-rpg-charattr-row"><label>${escapeHtml(a.name)}(${escapeHtml(a.key)})</label><input type="number" class="horae-rpg-charattr-val" data-key="${escapeHtml(a.key)}" min="0" max="100" placeholder="0-100" /></div>`
        ).join('');
        form.innerHTML = `
            <div class="horae-rpg-form-title">${t('ui.editCharPrefix')} ${escapeHtml(charName)}</div>
            ${attrInputs}
            <div class="horae-rpg-form-actions">
                <button id="horae-rpg-charattr-save-inline" class="horae-rpg-btn-sm" data-char="${escapeHtml(charName)}">${t('common.save')}</button>
                <button id="horae-rpg-charattr-cancel-inline" class="horae-rpg-btn-sm horae-rpg-btn-muted">${t('common.cancel')}</button>
            </div>`;
        // 填入现有值
        const rpg = getContext().chat?.[0]?.horae_meta?.rpg;
        const existing = rpg?.attributes?.[charName] || {};
        form.querySelectorAll('.horae-rpg-charattr-val').forEach(inp => {
            const k = inp.dataset.key;
            if (existing[k] !== undefined) inp.value = existing[k];
        });
        form.querySelector('#horae-rpg-charattr-save-inline').addEventListener('click', function () {
            const name = this.dataset.char;
            const vals = {};
            let hasVal = false;
            form.querySelectorAll('.horae-rpg-charattr-val').forEach(inp => {
                const k = inp.dataset.key;
                const v = parseInt(inp.value);
                if (!isNaN(v)) { vals[k] = Math.max(0, Math.min(100, v)); hasVal = true; }
            });
            if (!hasVal) { showToast(t('toast.attrValueRequired'), 'warning'); return; }
            const chat = getContext().chat;
            if (!chat?.[0]?.horae_meta) return;
            if (!chat[0].horae_meta.rpg) chat[0].horae_meta.rpg = { bars: {}, status: {}, skills: {}, attributes: {} };
            if (!chat[0].horae_meta.rpg.attributes) chat[0].horae_meta.rpg.attributes = {};
            chat[0].horae_meta.rpg.attributes[name] = { ...(chat[0].horae_meta.rpg.attributes[name] || {}), ...vals };
            getContext().saveChat();
            form.style.display = 'none';
            updateRpgDisplay();
            showToast(t('toast.saveSuccess'), 'success');
        });
        form.querySelector('#horae-rpg-charattr-cancel-inline').addEventListener('click', () => {
            form.style.display = 'none';
        });
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // RPG 角色属性手动添加/编辑
    $('#horae-rpg-add-charattr').on('click', () => {
        const form = document.getElementById('horae-rpg-charattr-form');
        if (!form) return;
        if (form.style.display !== 'none') { form.style.display = 'none'; return; }
        const attrCfg = settings.rpgAttributeConfig || [];
        if (!attrCfg.length) { showToast(t('toast.noAttrConfig'), 'warning'); return; }
        const attrInputs = attrCfg.map(a =>
            `<div class="horae-rpg-charattr-row"><label>${escapeHtml(a.name)}(${escapeHtml(a.key)})</label><input type="number" class="horae-rpg-charattr-val" data-key="${escapeHtml(a.key)}" min="0" max="100" placeholder="0-100" /></div>`
        ).join('');
        form.innerHTML = `
            <select id="horae-rpg-charattr-owner">${buildCharacterOptions()}</select>
            ${attrInputs}
            <div class="horae-rpg-form-actions">
                <button id="horae-rpg-charattr-load" class="horae-rpg-btn-sm horae-rpg-btn-muted">${t('ui.loadExisting')}</button>
                <button id="horae-rpg-charattr-save" class="horae-rpg-btn-sm">${t('common.save')}</button>
                <button id="horae-rpg-charattr-cancel" class="horae-rpg-btn-sm horae-rpg-btn-muted">${t('common.cancel')}</button>
            </div>`;
        form.style.display = '';
        // 加载已有数据
        form.querySelector('#horae-rpg-charattr-load').addEventListener('click', () => {
            const ownerVal = form.querySelector('#horae-rpg-charattr-owner').value;
            const owner = ownerVal === '__user__' ? (getContext().name1 || '{{user}}') : ownerVal;
            const rpg = getContext().chat?.[0]?.horae_meta?.rpg;
            const existing = rpg?.attributes?.[owner] || {};
            form.querySelectorAll('.horae-rpg-charattr-val').forEach(inp => {
                const k = inp.dataset.key;
                if (existing[k] !== undefined) inp.value = existing[k];
            });
        });
        form.querySelector('#horae-rpg-charattr-save').addEventListener('click', () => {
            const ownerVal = form.querySelector('#horae-rpg-charattr-owner').value;
            const owner = ownerVal === '__user__' ? (getContext().name1 || '{{user}}') : ownerVal;
            const vals = {};
            let hasVal = false;
            form.querySelectorAll('.horae-rpg-charattr-val').forEach(inp => {
                const k = inp.dataset.key;
                const v = parseInt(inp.value);
                if (!isNaN(v)) { vals[k] = Math.max(0, Math.min(100, v)); hasVal = true; }
            });
            if (!hasVal) { showToast(t('toast.attrValueRequired'), 'warning'); return; }
            const chat = getContext().chat;
            if (!chat?.[0]?.horae_meta) return;
            if (!chat[0].horae_meta.rpg) chat[0].horae_meta.rpg = { bars: {}, status: {}, skills: {}, attributes: {} };
            if (!chat[0].horae_meta.rpg.attributes) chat[0].horae_meta.rpg.attributes = {};
            chat[0].horae_meta.rpg.attributes[owner] = { ...(chat[0].horae_meta.rpg.attributes[owner] || {}), ...vals };
            getContext().saveChat();
            form.style.display = 'none';
            updateRpgDisplay();
            showToast(t('toast.saveSuccess'), 'success');
        });
        form.querySelector('#horae-rpg-charattr-cancel').addEventListener('click', () => {
            form.style.display = 'none';
        });
    });

    // RPG 技能增删
    $('#horae-rpg-add-skill').on('click', () => {
        const form = document.getElementById('horae-rpg-skill-form');
        if (!form) return;
        if (form.style.display !== 'none') { form.style.display = 'none'; return; }
        form.innerHTML = `
            <select id="horae-rpg-skill-owner">${buildCharacterOptions()}</select>
            <input id="horae-rpg-skill-name" placeholder="${t('placeholder.skillName')}" maxlength="30" />
            <input id="horae-rpg-skill-level" placeholder="${t('placeholder.skillLevel')}" maxlength="10" />
            <input id="horae-rpg-skill-desc" placeholder="${t('placeholder.skillDesc')}" maxlength="80" />
            <div class="horae-rpg-form-actions">
                <button id="horae-rpg-skill-save" class="horae-rpg-btn-sm">${t('common.confirm')}</button>
                <button id="horae-rpg-skill-cancel" class="horae-rpg-btn-sm horae-rpg-btn-muted">${t('common.cancel')}</button>
            </div>`;
        form.style.display = '';
        form.querySelector('#horae-rpg-skill-save').addEventListener('click', () => {
            const ownerVal = form.querySelector('#horae-rpg-skill-owner').value;
            const skillName = form.querySelector('#horae-rpg-skill-name').value.trim();
            if (!skillName) { showToast(t('toast.skillNameRequired'), 'warning'); return; }
            const owner = ownerVal === '__user__' ? (getContext().name1 || '{{user}}') : ownerVal;
            const chat = getContext().chat;
            if (!chat?.[0]?.horae_meta) return;
            if (!chat[0].horae_meta.rpg) chat[0].horae_meta.rpg = { bars: {}, status: {}, skills: {} };
            if (!chat[0].horae_meta.rpg.skills[owner]) chat[0].horae_meta.rpg.skills[owner] = [];
            chat[0].horae_meta.rpg.skills[owner].push({
                name: skillName,
                level: form.querySelector('#horae-rpg-skill-level').value.trim(),
                desc: form.querySelector('#horae-rpg-skill-desc').value.trim(),
                _userAdded: true,
            });
            getContext().saveChat();
            form.style.display = 'none';
            updateRpgDisplay();
            showToast(t('toast.saveSuccess'), 'success');
        });
        form.querySelector('#horae-rpg-skill-cancel').addEventListener('click', () => {
            form.style.display = 'none';
        });
    });
    $(document).on('click', '.horae-rpg-skill-del', function () {
        const owner = this.dataset.owner;
        const skillName = this.dataset.skill;
        const chat = getContext().chat;
        const rpg = chat?.[0]?.horae_meta?.rpg;
        if (rpg?.skills?.[owner]) {
            rpg.skills[owner] = rpg.skills[owner].filter(s => s.name !== skillName);
            if (rpg.skills[owner].length === 0) delete rpg.skills[owner];
            if (!rpg._deletedSkills) rpg._deletedSkills = [];
            if (!rpg._deletedSkills.some(d => d.owner === owner && d.name === skillName)) {
                rpg._deletedSkills.push({ owner, name: skillName });
            }
            const _cfgDel = _ensureRpgConfigs();
            if (_cfgDel) _cfgDel._deletedSkills = rpg._deletedSkills;
            getContext().saveChat();
            updateRpgDisplay();
        }
    });

    // 属性面板配置
    $(document).on('input', '.horae-rpg-config-key[data-type="attr"]', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgAttributeConfig?.[i]) {
            const val = this.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (val) settings.rpgAttributeConfig[i].key = val;
            saveSettings(); horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
        }
    });
    $(document).on('input', '.horae-rpg-config-name[data-type="attr"]', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgAttributeConfig?.[i]) {
            settings.rpgAttributeConfig[i].name = this.value.trim() || settings.rpgAttributeConfig[i].key.toUpperCase();
            saveSettings(); horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
        }
    });
    $(document).on('input', '.horae-rpg-attr-desc', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgAttributeConfig?.[i]) {
            settings.rpgAttributeConfig[i].desc = this.value.trim();
            saveSettings();
        }
    });
    $(document).on('click', '.horae-rpg-attr-del', function () {
        const i = parseInt(this.dataset.idx);
        if (settings.rpgAttributeConfig?.[i]) {
            settings.rpgAttributeConfig.splice(i, 1);
            saveSettings(); renderAttrConfig();
            horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
        }
    });
    $('#horae-rpg-add-attr').on('click', () => {
        if (!settings.rpgAttributeConfig) settings.rpgAttributeConfig = [];
        const existing = new Set(settings.rpgAttributeConfig.map(a => a.key));
        let nk = 'attr1';
        for (let n = 1; existing.has(nk); n++) nk = `attr${n}`;
        settings.rpgAttributeConfig.push({ key: nk, name: nk.toUpperCase(), desc: '' });
        saveSettings(); renderAttrConfig();
        horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
    });
    $('#horae-rpg-attr-view-toggle').on('click', () => {
        settings.rpgAttrViewMode = settings.rpgAttrViewMode === 'radar' ? 'text' : 'radar';
        saveSettings(); updateRpgDisplay();
    });
    // 声望系统事件绑定
    _bindReputationConfigEvents();
    // 装备栏事件绑定
    _bindEquipmentEvents();
    // 货币系统事件绑定
    _bindCurrencyEvents();
    // 属性面板开关
    $('#horae-setting-rpg-attrs').on('change', function () {
        settings.sendRpgAttributes = this.checked;
        saveSettings();
        _syncRpgTabVisibility();
        horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
        updateRpgDisplay();
    });
    // RPG 自定义提示词
    $('#horae-custom-rpg-prompt').on('input', function () {
        const val = this.value;
        settings.customRpgPrompt = (val.trim() === horaeManager.getDefaultRpgPromptResolved().trim()) ? '' : val;
        $('#horae-rpg-prompt-count').text(val.length);
        saveSettings(); horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay(); updateTokenCounter();
    });
    $('#horae-btn-reset-rpg-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customRpgPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultRpgPromptResolved();
        $('#horae-custom-rpg-prompt').val(def);
        $('#horae-rpg-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings); _refreshSystemPromptDisplay(); updateTokenCounter();
    });

    // ── 提示词预设存档 ──
    const _PRESET_PROMPT_KEYS = [...PROMPT_SETTING_KEYS];
    function _collectCurrentPrompts() {
        const obj = {};
        for (const k of _PRESET_PROMPT_KEYS) obj[k] = _normalizeLf(settings[k] || '');
        return obj;
    }
    function _applyPresetPrompts(prompts) {
        for (const k of _PRESET_PROMPT_KEYS) settings[k] = _normalizeLf(prompts[k] || '');
        _normalizePromptTextFields(settings, _PRESET_PROMPT_KEYS);
        saveSettings();
        const pairs = [
            ['customSystemPrompt', 'horae-custom-system-prompt', 'horae-system-prompt-count', () => horaeManager.getDefaultSystemPrompt()],
            ['customBatchPrompt', 'horae-custom-batch-prompt', 'horae-batch-prompt-count', () => getDefaultBatchPrompt()],
            ['customAnalysisPrompt', 'horae-custom-analysis-prompt', 'horae-analysis-prompt-count', () => getDefaultAnalysisPrompt()],
            ['customCompressPrompt', 'horae-custom-compress-prompt', 'horae-compress-prompt-count', () => getDefaultCompressPrompt()],
            ['customAutoSummaryPrompt', 'horae-custom-auto-summary-prompt', 'horae-auto-summary-prompt-count', () => getDefaultAutoSummaryPrompt()],
            ['customAutoResummaryPrompt', 'horae-custom-auto-resummary-prompt', 'horae-auto-resummary-prompt-count', () => getDefaultAutoResummaryPrompt()],
            ['customHeadPrompt', 'horae-custom-head-prompt', 'horae-custom-head-prompt-count', () => ''],
            ['customTailPrompt', 'horae-custom-tail-prompt', 'horae-custom-tail-prompt-count', () => ''],
            ['customTablesPrompt', 'horae-custom-tables-prompt', 'horae-tables-prompt-count', () => horaeManager.getDefaultTablesPrompt()],
            ['customLocationPrompt', 'horae-custom-location-prompt', 'horae-location-prompt-count', () => horaeManager.getDefaultLocationPrompt()],
            ['customRelationshipPrompt', 'horae-custom-relationship-prompt', 'horae-relationship-prompt-count', () => horaeManager.getDefaultRelationshipPrompt()],
            ['customMoodPrompt', 'horae-custom-mood-prompt', 'horae-mood-prompt-count', () => horaeManager.getDefaultMoodPrompt()],
            ['customRpgPrompt', 'horae-custom-rpg-prompt', 'horae-rpg-prompt-count', () => horaeManager.getDefaultRpgPromptResolved()],
        ];
        for (const [key, textareaId, countId, getDefault] of pairs) {
            const val = settings[key] || getDefault();
            $(`#${textareaId}`).val(val);
            $(`#${countId}`).text(val.length);
        }
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        // 自动展开提示词区域，让用户看到加载结果
        const body = document.getElementById('horae-prompt-collapse-body');
        if (body) body.style.display = '';
    }
    function _renderPresetSelect() {
        const sel = $('#horae-prompt-preset-select');
        sel.empty();
        const presets = settings.promptPresets || [];
        if (presets.length === 0) {
            sel.append('<option value="-1">（无预设）</option>');
        } else {
            for (let i = 0; i < presets.length; i++) {
                sel.append(`<option value="${i}">${presets[i].name}</option>`);
            }
        }
    }
    _renderPresetSelect();

    $('#horae-prompt-preset-load').on('click', () => {
        const idx = parseInt($('#horae-prompt-preset-select').val());
        const presets = settings.promptPresets || [];
        if (idx < 0 || idx >= presets.length) { showToast(t('toast.selectPresetFirst'), 'warning'); return; }
        if (!confirm(t('confirm.importPromptsReplace'))) return;
        _applyPresetPrompts(presets[idx].prompts);
        showToast(t('toast.presetLoaded', { name: presets[idx].name }), 'success');
    });

    $('#horae-prompt-preset-save').on('click', () => {
        const idx = parseInt($('#horae-prompt-preset-select').val());
        const presets = settings.promptPresets || [];
        if (idx < 0 || idx >= presets.length) { showToast(t('toast.selectPresetFirst'), 'warning'); return; }
        if (!confirm(t('confirm.importPromptsReplace'))) return;
        presets[idx].prompts = _collectCurrentPrompts();
        saveSettings();
        showToast(t('toast.presetSaved', { name: presets[idx].name }), 'success');
    });

    $('#horae-prompt-preset-new').on('click', () => {
        const name = prompt(t('prompts.newPresetPrompt'));
        if (!name?.trim()) return;
        if (!settings.promptPresets) settings.promptPresets = [];
        settings.promptPresets.push({ name: name.trim(), prompts: _collectCurrentPrompts() });
        saveSettings();
        _renderPresetSelect();
        $('#horae-prompt-preset-select').val(settings.promptPresets.length - 1);
        showToast(t('toast.presetCreated', { name: name.trim() }), 'success');
    });

    $('#horae-prompt-preset-delete').on('click', () => {
        const idx = parseInt($('#horae-prompt-preset-select').val());
        const presets = settings.promptPresets || [];
        if (idx < 0 || idx >= presets.length) { showToast(t('toast.selectPresetFirst'), 'warning'); return; }
        if (!confirm(t('confirm.deleteTheme', { name: presets[idx].name }))) return;
        presets.splice(idx, 1);
        saveSettings();
        _renderPresetSelect();
        showToast(t('toast.saveSuccess'), 'success');
    });

    $('#horae-prompt-preset-export').on('click', () => {
        const data = { type: 'horae-prompts', version: VERSION, prompts: _collectCurrentPrompts() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `horae-prompts_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast(t('toast.promptsExported'), 'success');
    });

    $('#horae-prompt-preset-import').on('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (!data.prompts || data.type !== 'horae-prompts') throw new Error(t('toast.invalidFile'));
                if (!confirm(t('confirm.importPromptsReplace'))) return;
                _applyPresetPrompts(data.prompts);
                const body = document.getElementById('horae-prompt-collapse-body');
                if (body) body.style.display = '';
                showToast(t('toast.promptsImported'), 'success');
            } catch (err) {
                showToast(t('toast.importFailed', { error: err.message }), 'error');
            }
        };
        input.click();
    });

    // 一键恢复所有提示词为默认
    $('#horae-prompt-reset-all').on('click', () => {
        if (!confirm(t('confirm.restoreAllPrompts'))) return;
        for (const k of _PRESET_PROMPT_KEYS) settings[k] = '';
        saveSettings();
        const pairs = [
            ['customSystemPrompt', 'horae-custom-system-prompt', 'horae-system-prompt-count', () => horaeManager.getDefaultSystemPrompt()],
            ['customBatchPrompt', 'horae-custom-batch-prompt', 'horae-batch-prompt-count', () => getDefaultBatchPrompt()],
            ['customAnalysisPrompt', 'horae-custom-analysis-prompt', 'horae-analysis-prompt-count', () => getDefaultAnalysisPrompt()],
            ['customCompressPrompt', 'horae-custom-compress-prompt', 'horae-compress-prompt-count', () => getDefaultCompressPrompt()],
            ['customAutoSummaryPrompt', 'horae-custom-auto-summary-prompt', 'horae-auto-summary-prompt-count', () => getDefaultAutoSummaryPrompt()],
            ['customAutoResummaryPrompt', 'horae-custom-auto-resummary-prompt', 'horae-auto-resummary-prompt-count', () => getDefaultAutoResummaryPrompt()],
            ['customHeadPrompt', 'horae-custom-head-prompt', 'horae-custom-head-prompt-count', () => ''],
            ['customTailPrompt', 'horae-custom-tail-prompt', 'horae-custom-tail-prompt-count', () => ''],
            ['customTablesPrompt', 'horae-custom-tables-prompt', 'horae-tables-prompt-count', () => horaeManager.getDefaultTablesPrompt()],
            ['customLocationPrompt', 'horae-custom-location-prompt', 'horae-location-prompt-count', () => horaeManager.getDefaultLocationPrompt()],
            ['customRelationshipPrompt', 'horae-custom-relationship-prompt', 'horae-relationship-prompt-count', () => horaeManager.getDefaultRelationshipPrompt()],
            ['customMoodPrompt', 'horae-custom-mood-prompt', 'horae-mood-prompt-count', () => horaeManager.getDefaultMoodPrompt()],
            ['customRpgPrompt', 'horae-custom-rpg-prompt', 'horae-rpg-prompt-count', () => horaeManager.getDefaultRpgPromptResolved()],
        ];
        for (const [, textareaId, countId, getDefault] of pairs) {
            const val = getDefault();
            $(`#${textareaId}`).val(val);
            $(`#${countId}`).text(val.length);
        }
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        showToast(t('toast.promptsRestored'), 'success');
    });

    // ── Horae 全局配置 导出/导入/重置 ──
    const _SETTINGS_EXPORT_KEYS = [
        'enabled', 'autoParse', 'autoFillPrevTimelineOnSend', 'injectContext', 'injectCustomPrompts', 'showMessagePanel', 'showTopIcon',
        'injectionDepthSource', 'injectionPosition', 'timelineInjectionMode',
        'sendTimeline', 'contextDepth', 'sendCharacters', 'sendCharacterAffection', 'sendMainCharacterPersonality', 'sendItems',
        'sendLocationMemory', 'sendRelationships', 'sendMood',
        'antiParaphraseMode', 'sideplayMode',
        'aiScanIncludeNpc', 'aiScanIncludeAffection', 'aiScanIncludeScene', 'aiScanIncludeRelationship',
        'rpgMode', 'sendRpgBars', 'sendRpgSkills', 'sendRpgAttributes', 'sendRpgReputation',
        'sendRpgEquipment', 'sendRpgLevel', 'sendRpgCurrency', 'sendRpgStronghold', 'rpgDiceEnabled',
        'rpgBarsUserOnly', 'rpgSkillsUserOnly', 'rpgAttrsUserOnly', 'rpgReputationUserOnly',
        'rpgEquipmentUserOnly', 'rpgLevelUserOnly', 'rpgCurrencyUserOnly', 'rpgUserOnly',
        'rpgBarConfig', 'rpgAttributeConfig', 'rpgAttrViewMode', 'equipmentTemplates',
        'autoSummaryEnabled',
        ..._PRESET_PROMPT_KEYS,
    ];
    // 仅用于“恢复默认”：不影响导入/导出的键范围
    const _SETTINGS_RESET_EXTRA_KEYS = [
        'autoSummaryKeepRecent',
        'autoSummaryBufferMode',
        'autoSummarySourceMode',
        'autoSummaryBufferMsgLimit',
        'autoSummaryResummaryThreshold',
        'autoSummaryBatchMaxMsgs',
        'autoSummaryBatchMaxTokens',
    ];

    $('#horae-settings-export').on('click', () => {
        const payload = {};
        for (const k of _SETTINGS_EXPORT_KEYS) {
            if (settings[k] !== undefined) payload[k] = JSON.parse(JSON.stringify(settings[k]));
        }
        const data = { type: 'horae-settings', version: VERSION, settings: payload };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `horae-settings_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast(t('toast.configExported'), 'success');
    });

    $('#horae-settings-import').on('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return;
                const text = await file.text();
                const data = JSON.parse(text);
                if (data.type !== 'horae-settings' || !data.settings) {
                    showToast(t('toast.invalidFile'), 'error');
                    return;
                }
                const imported = data.settings;
                const keys = Object.keys(imported).filter(k => _SETTINGS_EXPORT_KEYS.includes(k));
                if (keys.length === 0) {
                    showToast(t('toast.invalidFile'), 'warning');
                    return;
                }
                if (!confirm(t('confirm.importSettings', { n: keys.length }))) return;
                for (const k of keys) {
                    settings[k] = JSON.parse(JSON.stringify(imported[k]));
                }
                _normalizeAutoSummarySettingsInPlace(imported);
                _normalizePromptSettingsInPlace();
                _normalizeVectorRecallPresetsInPlace();
                _migrateLegacyVectorSettings(settings);
                _ensureLocalizedRpgDefaults();
                _normalizeRpgSettingsInPlace();
                await ensurePromptDefaults(detectEffectiveAiLang(settings));
                saveSettings();
                syncSettingsToUI();
                try { renderBarConfig(); } catch (_) { }
                try { renderAttrConfig(); } catch (_) { }
                horaeManager.init(getContext(), settings);
                _refreshSystemPromptDisplay();
                updateTokenCounter();
                showToast(t('toast.settingsImported', { n: keys.length }), 'success');
            } catch (err) {
                console.error('[Horae] 导入配置失败:', err);
                showToast(t('toast.importFailed', { error: err.message }), 'error');
            }
        };
        input.click();
    });

    $('#horae-settings-reset').on('click', async () => {
        if (!confirm(t('confirm.resetAllSettings'))) return;
        const resetKeys = Array.from(new Set([..._SETTINGS_EXPORT_KEYS, ..._SETTINGS_RESET_EXTRA_KEYS]));
        for (const k of resetKeys) {
            if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, k)) {
                settings[k] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS[k]));
            }
        }
        _ensureLocalizedRpgDefaults({ force: true });
        _normalizeRpgSettingsInPlace();
        await ensurePromptDefaults(detectEffectiveAiLang(settings));
        saveSettings();
        syncSettingsToUI();
        try { renderBarConfig(); } catch (_) { }
        try { renderAttrConfig(); } catch (_) { }
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        showToast(t('toast.settingsRestored'), 'success');
    });

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

    $('#horae-btn-items-multiselect').on('click', () => {
        itemsMultiSelectMode ? exitMultiSelectMode() : enterMultiSelectMode();
    });
    $('#horae-btn-items-select-all').on('click', selectAllItems);
    $('#horae-btn-items-delete').on('click', deleteSelectedItems);
    $('#horae-btn-items-cancel-select').on('click', exitMultiSelectMode);

    $('#horae-btn-npc-add').on('click', (e) => {
        e.stopPropagation();
        openNpcAddModal();
    });
    $('#horae-btn-npc-multiselect').on('click', () => {
        npcMultiSelectMode ? exitNpcMultiSelect() : enterNpcMultiSelect();
    });
    $('#horae-btn-npc-select-all').on('click', () => {
        document.querySelectorAll('#horae-npc-list .horae-npc-item').forEach(el => {
            const name = el.dataset.npcName;
            if (name) selectedNpcs.add(name);
        });
        updateCharactersDisplay();
        _updateNpcSelectedCount();
    });
    $('#horae-btn-npc-delete').on('click', deleteSelectedNpcs);
    $('#horae-btn-npc-cancel-select').on('click', exitNpcMultiSelect);

    $('#horae-btn-items-refresh').on('click', () => {
        updateItemsDisplay();
        showToast(t('toast.itemsRefreshed'), 'info');
    });

    $('#horae-setting-send-timeline').on('change', function () {
        settings.sendTimeline = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-setting-context-depth').on('change', function () {
        const val = parseInt(this.value, 10);
        settings.contextDepth = Number.isNaN(val) ? 15 : Math.max(0, val);
        this.value = settings.contextDepth;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-setting-send-characters').on('change', function () {
        settings.sendCharacters = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-setting-send-character-affection').on('change', function () {
        settings.sendCharacterAffection = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-setting-send-main-character-personality').on('change', function () {
        settings.sendMainCharacterPersonality = this.checked;
        saveSettings();
        console.log(
            `[Horae][MainPersonality] setting changed: sendMainCharacterPersonality=${this.checked} sendCharacters=${settings.sendCharacters !== false} pinnedNpcs=${JSON.stringify(settings.pinnedNpcs || [])}`
        );
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-setting-send-items').on('change', function () {
        settings.sendItems = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-setting-send-location-memory').on('change', function () {
        settings.sendLocationMemory = this.checked;
        saveSettings();
        $('#horae-location-prompt-group').toggle(this.checked);
        $('.horae-tab[data-tab="locations"]').toggle(this.checked);
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    $('#horae-setting-send-relationships').on('change', function () {
        settings.sendRelationships = this.checked;
        saveSettings();
        $('#horae-relationship-section').toggle(this.checked);
        $('#horae-relationship-prompt-group').toggle(this.checked);
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        if (this.checked) updateRelationshipDisplay();
    });

    $('#horae-setting-send-mood').on('change', function () {
        settings.sendMood = this.checked;
        saveSettings();
        $('#horae-mood-prompt-group').toggle(this.checked);
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    $('#horae-setting-anti-paraphrase').on('change', function () {
        settings.antiParaphraseMode = this.checked;
        saveSettings();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
    });

    $('#horae-setting-sideplay-mode').on('change', function () {
        settings.sideplayMode = this.checked;
        saveSettings();
        document.querySelectorAll('.horae-message-panel').forEach(p => {
            const btn = p.querySelector('.horae-btn-sideplay');
            if (btn) btn.style.display = settings.sideplayMode ? '' : 'none';
        });
    });

    // RPG 模式
    $('#horae-setting-rpg-mode').on('change', function () {
        settings.rpgMode = this.checked;
        saveSettings();
        $('#horae-rpg-sub-options').toggle(this.checked);
        $('#horae-rpg-prompt-group').toggle(this.checked);
        _syncRpgTabVisibility();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        if (this.checked) updateRpgDisplay();
    });
    // RPG 仅限主角 - 总开关联动所有子模块
    const _rpgUoKeys = ['rpgBarsUserOnly', 'rpgSkillsUserOnly', 'rpgAttrsUserOnly', 'rpgReputationUserOnly', 'rpgEquipmentUserOnly', 'rpgLevelUserOnly', 'rpgCurrencyUserOnly'];
    const _rpgUoIds = ['bars', 'skills', 'attrs', 'reputation', 'equipment', 'level', 'currency'];
    function _syncRpgUserOnlyMaster() {
        const allOn = _rpgUoKeys.every(k => !!settings[k]);
        settings.rpgUserOnly = allOn;
        $('#horae-setting-rpg-user-only').prop('checked', allOn);
    }
    function _rpgUoRefresh() {
        saveSettings();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        updateRpgDisplay();
    }
    $('#horae-setting-rpg-user-only').on('change', function () {
        const val = this.checked;
        settings.rpgUserOnly = val;
        for (const k of _rpgUoKeys) settings[k] = val;
        for (const id of _rpgUoIds) $(`#horae-setting-rpg-${id}-uo`).prop('checked', val);
        _rpgUoRefresh();
    });
    for (let i = 0; i < _rpgUoIds.length; i++) {
        const id = _rpgUoIds[i], key = _rpgUoKeys[i];
        $(`#horae-setting-rpg-${id}-uo`).on('change', function () {
            settings[key] = this.checked;
            _syncRpgUserOnlyMaster();
            _rpgUoRefresh();
        });
    }
    // 各模块开关 + 子开关显示/隐藏
    const _rpgModulePairs = [
        { checkId: 'horae-setting-rpg-bars', settingKey: 'sendRpgBars', uoId: 'horae-setting-rpg-bars-uo' },
        { checkId: 'horae-setting-rpg-skills', settingKey: 'sendRpgSkills', uoId: 'horae-setting-rpg-skills-uo' },
        { checkId: 'horae-setting-rpg-attrs', settingKey: 'sendRpgAttributes', uoId: 'horae-setting-rpg-attrs-uo' },
        { checkId: 'horae-setting-rpg-reputation', settingKey: 'sendRpgReputation', uoId: 'horae-setting-rpg-reputation-uo' },
        { checkId: 'horae-setting-rpg-equipment', settingKey: 'sendRpgEquipment', uoId: 'horae-setting-rpg-equipment-uo' },
        { checkId: 'horae-setting-rpg-level', settingKey: 'sendRpgLevel', uoId: 'horae-setting-rpg-level-uo' },
        { checkId: 'horae-setting-rpg-currency', settingKey: 'sendRpgCurrency', uoId: 'horae-setting-rpg-currency-uo' },
    ];
    for (const m of _rpgModulePairs) {
        $(`#${m.checkId}`).on('change', function () {
            settings[m.settingKey] = this.checked;
            $(`#${m.uoId}`).closest('label').toggle(this.checked);
            saveSettings();
            _syncRpgTabVisibility();
            horaeManager.init(getContext(), settings);
            _refreshSystemPromptDisplay();
            updateTokenCounter();
            updateRpgDisplay();
        });
    }
    $('#horae-setting-rpg-stronghold').on('change', function () {
        settings.sendRpgStronghold = this.checked;
        saveSettings();
        _syncRpgTabVisibility();
        horaeManager.init(getContext(), settings);
        _refreshSystemPromptDisplay();
        updateTokenCounter();
        updateRpgDisplay();
    });
    $('#horae-setting-rpg-dice').on('change', function () {
        settings.rpgDiceEnabled = this.checked;
        saveSettings();
        renderDicePanel();
    });
    $('#horae-dice-reset-pos').on('click', () => {
        settings.dicePosX = null;
        settings.dicePosY = null;
        saveSettings();
        renderDicePanel();
        showToast(t('toast.saveSuccess'), 'success');
    });

    // 自动摘要折叠面板
    $('#horae-autosummary-collapse-toggle').on('click', function () {
        const body = $('#horae-autosummary-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 自动摘要设置
    $('#horae-setting-auto-summary').on('change', function () {
        settings.autoSummaryEnabled = this.checked;
        saveSettings();
        $('#horae-auto-summary-options').toggle(this.checked);
    });
    $('#horae-setting-auto-summary-keep').on('change', function () {
        settings.autoSummaryKeepRecent = Math.max(2, parseInt(this.value) || 10);
        this.value = settings.autoSummaryKeepRecent;
        saveSettings();
    });
    $('#horae-setting-auto-summary-mode').on('change', function () {
        settings.autoSummaryBufferMode = this.value === 'tokens' ? 'tokens' : 'messages';
        _syncAutoSummaryLegacyBufferLimit();
        _syncAutoSummaryTriggerLimitInput();
        saveSettings();
        updateAutoSummaryHint();
    });
    $('#horae-setting-auto-summary-source').on('change', function () {
        settings.autoSummarySourceMode = this.value === 'events' ? 'events' : 'fulltext';
        saveSettings();
    });
    $('#horae-setting-auto-summary-limit').on('change', function () {
        if (settings.autoSummaryBufferMode === 'tokens') {
            settings.autoSummaryBufferTokenLimit = Math.max(1000, parseInt(this.value, 10) || DEFAULT_SETTINGS.autoSummaryBufferTokenLimit);
        } else {
            settings.autoSummaryBufferMsgLimit = Math.max(5, parseInt(this.value, 10) || DEFAULT_SETTINGS.autoSummaryBufferMsgLimit);
        }
        _syncAutoSummaryLegacyBufferLimit();
        _syncAutoSummaryTriggerLimitInput();
        saveSettings();
    });
    $('#horae-setting-auto-summary-resummary-threshold').on('change', function () {
        const raw = parseInt(this.value, 10);
        if (!Number.isFinite(raw)) {
            settings.autoSummaryResummaryThreshold = 10;
        } else if (raw <= 0) {
            settings.autoSummaryResummaryThreshold = 0;
        } else {
            settings.autoSummaryResummaryThreshold = Math.max(2, raw);
        }
        this.value = settings.autoSummaryResummaryThreshold;
        saveSettings();
    });
    $('#horae-setting-auto-summary-batch-msgs').on('change', function () {
        settings.autoSummaryBatchMaxMsgs = Math.max(5, parseInt(this.value) || 50);
        this.value = settings.autoSummaryBatchMaxMsgs;
        saveSettings();
    });
    $('#horae-setting-auto-summary-batch-tokens').on('change', function () {
        settings.autoSummaryBatchMaxTokens = Math.max(10000, parseInt(this.value) || 80000);
        this.value = settings.autoSummaryBatchMaxTokens;
        saveSettings();
    });
    $('#horae-setting-auto-summary-api-url').on('input change', function () {
        settings.autoSummaryApiUrl = this.value;
        saveSettings();
    });
    $('#horae-setting-auto-summary-api-key').on('input change', function () {
        settings.autoSummaryApiKey = this.value;
        saveSettings();
    });
    $('#horae-setting-auto-summary-api-key-toggle').on('click', function () {
        const input = document.getElementById('horae-setting-auto-summary-api-key');
        if (!input) return;
        const icon = this.querySelector('i');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        if (icon) {
            icon.classList.toggle('fa-eye', !isPassword);
            icon.classList.toggle('fa-eye-slash', isPassword);
        }
    });
    $('#horae-setting-auto-summary-model').on('change', function () {
        settings.autoSummaryModel = this.value;
        saveSettings();
    });
    $('#horae-setting-summary-should-stream').on('change', function () {
        settings.summaryShouldStream = this.checked;
        saveSettings();
    });
    $('#horae-setting-sub-api-scope-auto-summary').on('change', function () {
        settings.subApiScopeAutoSummary = this.checked;
        saveSettings();
    });
    $('#horae-setting-sub-api-scope-manual-summary').on('change', function () {
        settings.subApiScopeManualSummary = this.checked;
        saveSettings();
    });
    $('#horae-setting-sub-api-scope-brief').on('change', function () {
        settings.subApiScopeBrief = this.checked;
        if (this.checked) {
            _ensureAutoFillPrevTimelineForSubApiBriefScope();
        }
        saveSettings();
    });

    $('#horae-btn-fetch-models').on('click', fetchAndPopulateModels);

    $('#horae-setting-panel-width').on('change', function () {
        let val = parseInt(this.value) || 100;
        val = Math.max(50, Math.min(100, val));
        this.value = val;
        settings.panelWidth = val;
        saveSettings();
        applyPanelWidth();
    });
    $('#horae-setting-panel-offset').on('input', function () {
        const val = Math.max(0, parseInt(this.value) || 0);
        settings.panelOffset = val;
        $('#horae-panel-offset-value').text(`${val}px`);
        saveSettings();
        applyPanelWidth();
    });

    // 主题模式切换
    $('#horae-setting-theme-mode').on('change', function () {
        settings.themeMode = this.value;
        saveSettings();
        applyThemeMode();
    });

    // 美化导入/导出/删除/自助美化
    $('#horae-btn-theme-export').on('click', exportTheme);
    $('#horae-btn-theme-import').on('click', importTheme);
    $('#horae-btn-theme-designer').on('click', openThemeDesigner);
    $('#horae-btn-theme-delete').on('click', function () {
        const mode = settings.themeMode || 'dark';
        if (!mode.startsWith('custom-')) {
            showToast(t('toast.onlyDeleteImported'), 'warning');
            return;
        }
        deleteCustomTheme(parseInt(mode.split('-')[1]));
    });

    // 自定义CSS
    $('#horae-custom-css').on('change', function () {
        settings.customCSS = this.value;
        saveSettings();
        applyCustomCSS();
    });

    $('#horae-btn-refresh').on('click', refreshAllDisplays);

    $('#horae-btn-add-table-local').on('click', () => addNewExcelTable('local'));
    $('#horae-btn-add-table-character').on('click', () => {
        if (getContext()?.characterId == null) {
            showToast(t('toast.noCharacterCard'), 'warning');
            return;
        }
        addNewExcelTable('character');
    });
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
    $('#horae-btn-carry-new-chat, #horae-btn-timeline-carry-new-chat').on('click', createNewChatWithCarryover);
    $('#horae-btn-clear').on('click', clearAllData);

    // 好感度显示/隐藏（不可用hidden类名，酒馆全局有display:none规则）
    $('#horae-affection-toggle').on('click', function () {
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
    $('#horae-custom-system-prompt').on('input', function () {
        const val = this.value;
        // 与默认一致时视为未自定义
        settings.customSystemPrompt = (val.trim() === horaeManager.getDefaultSystemPrompt().trim()) ? '' : val;
        $('#horae-system-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-custom-batch-prompt').on('input', function () {
        const val = this.value;
        settings.customBatchPrompt = (val.trim() === getDefaultBatchPrompt().trim()) ? '' : val;
        $('#horae-batch-prompt-count').text(val.length);
        saveSettings();
    });

    $('#horae-custom-head-prompt, #horae-custom-tail-prompt').on('input', function () {
        const isHead = this.id === 'horae-custom-head-prompt';
        const countSelector = this.id === 'horae-custom-head-prompt'
            ? '#horae-custom-head-prompt-count'
            : '#horae-custom-tail-prompt-count';
        settings[isHead ? 'customHeadPrompt' : 'customTailPrompt'] = this.value;
        $(countSelector).text(this.value.length);
        saveSettings();
    });

    $('#horae-btn-reset-system-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customSystemPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultSystemPrompt();
        $('#horae-custom-system-prompt').val(def);
        $('#horae-system-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast(t('toast.promptsRestored'), 'success');
    });

    $('#horae-btn-reset-batch-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customBatchPrompt = '';
        saveSettings();
        const def = getDefaultBatchPrompt();
        $('#horae-custom-batch-prompt').val(def);
        $('#horae-batch-prompt-count').text(def.length);
        showToast(t('toast.promptsRestored'), 'success');
    });

    // AI分析提示词
    $('#horae-custom-analysis-prompt').on('input', function () {
        const val = this.value;
        settings.customAnalysisPrompt = (val.trim() === getDefaultAnalysisPrompt().trim()) ? '' : val;
        $('#horae-analysis-prompt-count').text(val.length);
        saveSettings();
    });

    $('#horae-btn-reset-analysis-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customAnalysisPrompt = '';
        saveSettings();
        const def = getDefaultAnalysisPrompt();
        $('#horae-custom-analysis-prompt').val(def);
        $('#horae-analysis-prompt-count').text(def.length);
        showToast(t('toast.promptsRestored'), 'success');
    });

    // 剧情压缩提示词
    $('#horae-custom-compress-prompt').on('input', function () {
        const val = this.value;
        settings.customCompressPrompt = (val.trim() === getDefaultCompressPrompt().trim()) ? '' : val;
        $('#horae-compress-prompt-count').text(val.length);
        saveSettings();
    });

    $('#horae-btn-reset-compress-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customCompressPrompt = '';
        saveSettings();
        const def = getDefaultCompressPrompt();
        $('#horae-custom-compress-prompt').val(def);
        $('#horae-compress-prompt-count').text(def.length);
        showToast(t('toast.promptsRestored'), 'success');
    });

    // 自动摘要提示词
    $('#horae-custom-auto-summary-prompt').on('input', function () {
        const val = this.value;
        settings.customAutoSummaryPrompt = (val.trim() === getDefaultAutoSummaryPrompt().trim()) ? '' : val;
        $('#horae-auto-summary-prompt-count').text(val.length);
        saveSettings();
    });

    $('#horae-btn-reset-auto-summary-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customAutoSummaryPrompt = '';
        saveSettings();
        const def = getDefaultAutoSummaryPrompt();
        $('#horae-custom-auto-summary-prompt').val(def);
        $('#horae-auto-summary-prompt-count').text(def.length);
        showToast(t('toast.promptsRestored'), 'success');
    });

    // 二次总结提示词
    $('#horae-custom-auto-resummary-prompt').on('input', function () {
        const val = this.value;
        settings.customAutoResummaryPrompt = (val.trim() === getDefaultAutoResummaryPrompt().trim()) ? '' : val;
        $('#horae-auto-resummary-prompt-count').text(val.length);
        saveSettings();
    });

    $('#horae-btn-reset-auto-resummary-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customAutoResummaryPrompt = '';
        saveSettings();
        const def = getDefaultAutoResummaryPrompt();
        $('#horae-custom-auto-resummary-prompt').val(def);
        $('#horae-auto-resummary-prompt-count').text(def.length);
        showToast(t('toast.promptsRestored'), 'success');
    });

    // 表格填写规则提示词
    $('#horae-custom-tables-prompt').on('input', function () {
        const val = this.value;
        settings.customTablesPrompt = (val.trim() === horaeManager.getDefaultTablesPrompt().trim()) ? '' : val;
        $('#horae-tables-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-btn-reset-tables-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customTablesPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultTablesPrompt();
        $('#horae-custom-tables-prompt').val(def);
        $('#horae-tables-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast(t('toast.promptsRestored'), 'success');
    });

    // 场景记忆提示词
    $('#horae-custom-location-prompt').on('input', function () {
        const val = this.value;
        settings.customLocationPrompt = (val.trim() === horaeManager.getDefaultLocationPrompt().trim()) ? '' : val;
        $('#horae-location-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-btn-reset-location-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customLocationPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultLocationPrompt();
        $('#horae-custom-location-prompt').val(def);
        $('#horae-location-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast(t('toast.promptsRestored'), 'success');
    });

    // 关系网络提示词
    $('#horae-custom-relationship-prompt').on('input', function () {
        const val = this.value;
        settings.customRelationshipPrompt = (val.trim() === horaeManager.getDefaultRelationshipPrompt().trim()) ? '' : val;
        $('#horae-relationship-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-btn-reset-relationship-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customRelationshipPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultRelationshipPrompt();
        $('#horae-custom-relationship-prompt').val(def);
        $('#horae-relationship-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast(t('toast.promptsRestored'), 'success');
    });

    // 情绪追踪提示词
    $('#horae-custom-mood-prompt').on('input', function () {
        const val = this.value;
        settings.customMoodPrompt = (val.trim() === horaeManager.getDefaultMoodPrompt().trim()) ? '' : val;
        $('#horae-mood-prompt-count').text(val.length);
        saveSettings();
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
    });

    $('#horae-btn-reset-mood-prompt').on('click', () => {
        if (!confirm(t('confirm.restoreRpgPrompts'))) return;
        settings.customMoodPrompt = '';
        saveSettings();
        const def = horaeManager.getDefaultMoodPrompt();
        $('#horae-custom-mood-prompt').val(def);
        $('#horae-mood-prompt-count').text(def.length);
        horaeManager.init(getContext(), settings);
        updateTokenCounter();
        showToast(t('toast.promptsRestored'), 'success');
    });

    // 提示词区域折叠切换
    $('#horae-prompt-collapse-toggle').on('click', function () {
        const body = $('#horae-prompt-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 高级设置折叠切换
    $('#horae-advanced-collapse-toggle').on('click', function () {
        const body = $('#horae-advanced-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 副API折叠切换
    $('#horae-sub-api-collapse-toggle').on('click', function () {
        const body = $('#horae-sub-api-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 自定义表格折叠切换
    $('#horae-custom-tables-collapse-toggle').on('click', function () {
        const body = $('#horae-custom-tables-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 发送给AI的内容折叠切换
    $('#horae-send-to-ai-collapse-toggle').on('click', function () {
        const body = $('#horae-send-to-ai-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 自定义CSS区域折叠切换
    $('#horae-css-collapse-toggle').on('click', function () {
        const body = $('#horae-css-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    // 向量记忆区域折叠切换
    $('#horae-vector-collapse-toggle').on('click', function () {
        const body = $('#horae-vector-collapse-body');
        const icon = $(this).find('.horae-collapse-icon');
        body.slideToggle(200);
        icon.toggleClass('collapsed');
    });

    $('#horae-setting-vector-enabled').on('change', function () {
        settings.vectorEnabled = this.checked;
        saveSettings();
        $('#horae-vector-options').toggle(this.checked);
        if (this.checked && !vectorManager.isReady) {
            _initVectorModel();
        } else if (!this.checked) {
            vectorManager.dispose();
            _updateVectorStatus();
        }
    });

    $('#horae-setting-vector-source').on('change', function () {
        settings.vectorSource = this.value;
        saveSettings();
        _syncVectorSourceUI();
        if (settings.vectorEnabled) {
            vectorManager.clearIndex().then(() => {
                showToast(t('toast.vectorSourceChanged'), 'info');
                _initVectorModel();
            });
        }
    });

    $('#horae-setting-vector-model').on('change', function () {
        settings.vectorModel = this.value;
        saveSettings();
        if (settings.vectorEnabled) {
            vectorManager.clearIndex().then(() => {
                showToast(t('toast.modelChanged'), 'info');
                _initVectorModel();
            });
        }
    });

    $('#horae-setting-vector-dtype').on('change', function () {
        settings.vectorDtype = this.value;
        saveSettings();
        if (settings.vectorEnabled) {
            vectorManager.clearIndex().then(() => {
                showToast(t('toast.quantChanged'), 'info');
                _initVectorModel();
            });
        }
    });

    $('#horae-setting-vector-api-url').on('change', function () {
        settings.vectorApiUrl = this.value.trim();
        saveSettings();
    });

    $('#horae-setting-vector-api-key').on('change', function () {
        settings.vectorApiKey = this.value.trim();
        saveSettings();
    });

    $('#horae-setting-vector-api-model').on('change', function () {
        settings.vectorApiModel = this.value.trim();
        saveSettings();
        if (settings.vectorEnabled && settings.vectorSource === 'api') {
            vectorManager.clearIndex().then(() => {
                showToast(t('toast.apiModelChanged'), 'info');
                _initVectorModel();
            });
        }
    });

    $('#horae-setting-vector-query-rewrite-enabled').on('change', function () {
        settings.vectorQueryRewriteEnabled = this.checked;
        vectorManager.clearRecallCache('query-rewrite-setting-changed');
        saveSettings();
    });

    $('#horae-setting-vector-query-rewrite-url').on('change', function () {
        settings.vectorQueryRewriteUrl = this.value.trim();
        vectorManager.clearRecallCache('query-rewrite-setting-changed');
        saveSettings();
    });

    $('#horae-setting-vector-query-rewrite-key').on('change', function () {
        settings.vectorQueryRewriteKey = this.value.trim();
        vectorManager.clearRecallCache('query-rewrite-setting-changed');
        saveSettings();
    });

    $('#horae-setting-vector-query-rewrite-model-select').on('change', function () {
        settings.vectorQueryRewriteModel = this.value.trim();
        vectorManager.clearRecallCache('query-rewrite-setting-changed');
        saveSettings();
    });

    $('#horae-setting-vector-pure-mode').on('change', function () {
        settings.vectorPureMode = this.checked;
        saveSettings();
    });

    $('#horae-setting-vector-rerank-enabled').on('change', function () {
        settings.vectorRerankEnabled = this.checked;
        saveSettings();
        $('#horae-vector-rerank-options').toggle(this.checked);
    });

    $('#horae-setting-vector-rerank-fulltext').on('change', function () {
        settings.vectorRerankFullText = this.checked;
        saveSettings();
    });

    $('#horae-setting-vector-rerank-model').on('change', function () {
        settings.vectorRerankModel = this.value.trim();
        saveSettings();
    });

    $('#horae-btn-fetch-embed-models').on('click', fetchEmbeddingModels);
    $('#horae-btn-fetch-query-rewrite-models').on('click', fetchQueryRewriteModels);
    $('#horae-btn-fetch-rerank-models').on('click', fetchRerankModels);
    $('#horae-btn-test-vector-api').on('click', testVectorApiConnection);

    const loadSelectedVectorRecallPreset = () => {
        const preset = _getSelectedVectorRecallPreset();
        if (!preset) {
            showToast(t('toast.selectPresetFirst'), 'warning');
            return;
        }
        _applyVectorRecallPresetValues(preset.values);
        settings.vectorRecallPresetSelected = $('#horae-vector-recall-preset-select').val() || 'builtin:small';
        saveSettings();
        _syncVectorRecallPresetInputs();
        showToast(t('toast.presetLoaded', { name: preset.name }), 'success');
    };

    $('#horae-vector-recall-preset-select').on('change', loadSelectedVectorRecallPreset);
    $('#horae-vector-recall-preset-load').on('click', loadSelectedVectorRecallPreset);

    $('#horae-vector-recall-preset-save').on('click', () => {
        const preset = _getSelectedVectorRecallPreset();
        if (!preset) { showToast(t('toast.selectPresetFirst'), 'warning'); return; }
        if (preset.type !== 'custom') {
            showToast(t('toast.vectorBuiltinPresetReadonly'), 'warning');
            return;
        }
        settings.vectorRecallPresets[preset.index].values = _collectCurrentVectorRecallPresetValues();
        saveSettings();
        showToast(t('toast.presetSaved', { name: preset.name }), 'success');
    });

    $('#horae-vector-recall-preset-new').on('click', () => {
        const name = prompt(t('vector.newRecallPresetPrompt'));
        if (!name?.trim()) return;
        if (!Array.isArray(settings.vectorRecallPresets)) settings.vectorRecallPresets = [];
        settings.vectorRecallPresets.push({
            name: name.trim(),
            values: _collectCurrentVectorRecallPresetValues(),
        });
        settings.vectorRecallPresetSelected = `custom:${settings.vectorRecallPresets.length - 1}`;
        saveSettings();
        _renderVectorRecallPresetSelect();
        showToast(t('toast.presetCreated', { name: name.trim() }), 'success');
    });

    $('#horae-vector-recall-preset-delete').on('click', () => {
        const preset = _getSelectedVectorRecallPreset();
        if (!preset) { showToast(t('toast.selectPresetFirst'), 'warning'); return; }
        if (preset.type !== 'custom') {
            showToast(t('toast.vectorBuiltinPresetReadonly'), 'warning');
            return;
        }
        if (!confirm(t('confirm.deleteTheme', { name: preset.name }))) return;
        settings.vectorRecallPresets.splice(preset.index, 1);
        settings.vectorRecallPresetSelected = 'builtin:small';
        saveSettings();
        _renderVectorRecallPresetSelect();
        showToast(t('toast.saveSuccess'), 'success');
    });

    $('#horae-setting-vector-rerank-url').on('change', function () {
        settings.vectorRerankUrl = this.value.trim();
        saveSettings();
    });

    $('#horae-setting-vector-rerank-key').on('change', function () {
        settings.vectorRerankKey = this.value.trim();
        saveSettings();
    });

    $('#horae-setting-vector-rerank-candidates').on('change', function () {
        const v = parseInt(this.value, 10);
        settings.vectorRerankCandidates = (Number.isFinite(v) && v >= 5) ? v : 25;
        this.value = settings.vectorRerankCandidates;
        saveSettings();
    });

    $('#horae-setting-vector-rerank-recall-threshold').on('change', function () {
        const v = parseFloat(this.value);
        settings.vectorRerankRecallThreshold = (Number.isFinite(v) && v >= 0 && v <= 0.8) ? v : 0.3;
        this.value = settings.vectorRerankRecallThreshold;
        saveSettings();
    });

    $('#horae-setting-vector-rerank-min-score').on('change', function () {
        const v = parseFloat(this.value);
        settings.vectorRerankMinScore = (Number.isFinite(v) && v >= 0 && v <= 1) ? v : 0.5;
        this.value = settings.vectorRerankMinScore;
        saveSettings();
    });

    $('#horae-vector-debug-toggle').on('click', function () {
        const $body = $('#horae-vector-debug-body');
        const $icon = $(this).find('.horae-collapse-icon');
        const isHidden = $body.is(':hidden');
        $body.slideToggle(160);
        $icon.toggleClass('collapsed', !isHidden);
        if (isHidden) _renderVectorDebugInfo();
    });
    $('#horae-btn-vector-debug-refresh').on('click', _renderVectorDebugInfo);
    $('#horae-btn-vector-debug-copy').on('click', _copyVectorDebugInfo);

    $('#horae-setting-vector-topk').on('change', function () {
        settings.vectorTopK = parseInt(this.value) || 5;
        saveSettings();
    });

    $('#horae-setting-vector-threshold').on('change', function () {
        settings.vectorThreshold = parseFloat(this.value) || 0.72;
        saveSettings();
    });

    $('#horae-setting-vector-fulltext-count').on('change', function () {
        settings.vectorFullTextCount = parseInt(this.value) || 0;
        saveSettings();
    });

    $('#horae-setting-vector-fulltext-threshold').on('change', function () {
        settings.vectorFullTextThreshold = parseFloat(this.value) || 0.9;
        saveSettings();
    });

    $('#horae-setting-vector-strip-tags').on('change', function () {
        settings.vectorStripTags = this.value.trim();
        saveSettings();
    });

    $('#horae-btn-vector-build').on('click', _buildVectorIndex);
    $('#horae-btn-vector-clear').on('click', _clearVectorIndex);
}

/**
 * 同步设置到UI
 */
function _refreshSystemPromptDisplay() {
    const pairs = [
        ['customSystemPrompt', 'horae-custom-system-prompt', 'horae-system-prompt-count', () => horaeManager.getDefaultSystemPrompt()],
        ['customBatchPrompt', 'horae-custom-batch-prompt', 'horae-batch-prompt-count', () => getDefaultBatchPrompt()],
        ['customAnalysisPrompt', 'horae-custom-analysis-prompt', 'horae-analysis-prompt-count', () => getDefaultAnalysisPrompt()],
        ['customCompressPrompt', 'horae-custom-compress-prompt', 'horae-compress-prompt-count', () => getDefaultCompressPrompt()],
        ['customAutoSummaryPrompt', 'horae-custom-auto-summary-prompt', 'horae-auto-summary-prompt-count', () => getDefaultAutoSummaryPrompt()],
        ['customAutoResummaryPrompt', 'horae-custom-auto-resummary-prompt', 'horae-auto-resummary-prompt-count', () => getDefaultAutoResummaryPrompt()],
        ['customHeadPrompt', 'horae-custom-head-prompt', 'horae-custom-head-prompt-count', () => ''],
        ['customTailPrompt', 'horae-custom-tail-prompt', 'horae-custom-tail-prompt-count', () => ''],
        ['customTablesPrompt', 'horae-custom-tables-prompt', 'horae-tables-prompt-count', () => horaeManager.getDefaultTablesPrompt()],
        ['customLocationPrompt', 'horae-custom-location-prompt', 'horae-location-prompt-count', () => horaeManager.getDefaultLocationPrompt()],
        ['customRelationshipPrompt', 'horae-custom-relationship-prompt', 'horae-relationship-prompt-count', () => horaeManager.getDefaultRelationshipPrompt()],
        ['customMoodPrompt', 'horae-custom-mood-prompt', 'horae-mood-prompt-count', () => horaeManager.getDefaultMoodPrompt()],
        ['customRpgPrompt', 'horae-custom-rpg-prompt', 'horae-rpg-prompt-count', () => horaeManager.getDefaultRpgPromptResolved()],
    ];
    for (const [key, textareaId, countId, getDefault] of pairs) {
        if (settings[key]) continue;
        const def = getDefault();
        $(`#${textareaId}`).val(def);
        $(`#${countId}`).text(def.length);
    }
}

function _syncVectorSourceUI() {
    const isApi = settings.vectorSource === 'api';
    $('#horae-vector-local-options').toggle(!isApi);
    $('#horae-vector-api-options').toggle(isApi);
    $('#horae-vector-api-query-rewrite-section').toggle(isApi);
    $('#horae-vector-api-recall-options').toggle(isApi);
    $('#horae-vector-api-rerank-section').toggle(isApi);
}

function _upsertModelSelectValue(selectId, value) {
    const sel = document.getElementById(selectId);
    const nextValue = String(value || '').trim();
    if (!sel || !nextValue) return;

    const exists = Array.from(sel.options || []).some(opt => opt.value === nextValue);
    if (!exists) {
        const opt = document.createElement('option');
        opt.value = nextValue;
        opt.textContent = nextValue;
        sel.prepend(opt);
    }
    sel.value = nextValue;
}

function _renderVectorRecallPresetSelect() {
    const sel = document.getElementById('horae-vector-recall-preset-select');
    if (!sel) return;
    sel.innerHTML = '';

    for (const preset of BUILTIN_VECTOR_RECALL_PRESETS) {
        const opt = document.createElement('option');
        opt.value = `builtin:${preset.id}`;
        opt.textContent = t(preset.labelKey);
        sel.appendChild(opt);
    }

    const customPresets = Array.isArray(settings.vectorRecallPresets) ? settings.vectorRecallPresets : [];
    if (customPresets.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t('vector.customRecallPresets');
        customPresets.forEach((preset, index) => {
            const opt = document.createElement('option');
            opt.value = `custom:${index}`;
            opt.textContent = preset.name;
            group.appendChild(opt);
        });
        sel.appendChild(group);
    }

    const selected = settings.vectorRecallPresetSelected || 'builtin:small';
    sel.value = selected;
    if (sel.value !== selected) sel.value = 'builtin:small';
}

function _getSelectedVectorRecallPreset() {
    const selected = String($('#horae-vector-recall-preset-select').val() || settings.vectorRecallPresetSelected || 'builtin:small');
    if (selected.startsWith('builtin:')) {
        const id = selected.slice('builtin:'.length);
        const preset = BUILTIN_VECTOR_RECALL_PRESETS.find(p => p.id === id);
        return preset ? { type: 'builtin', id, name: t(preset.labelKey), values: preset.values } : null;
    }
    if (selected.startsWith('custom:')) {
        const idx = parseInt(selected.slice('custom:'.length), 10);
        const preset = settings.vectorRecallPresets?.[idx];
        return preset ? { type: 'custom', index: idx, name: preset.name, values: preset.values } : null;
    }
    return null;
}

function _formatDebugSimilarity(v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return '-';
    return v.toFixed(3);
}

function _renderVectorDebugInfo() {
    const $box = $('#horae-vector-debug-content');
    if (!$box.length) return;
    const info = (typeof vectorManager !== 'undefined' && vectorManager?.getLastDebugInfo) ? vectorManager.getLastDebugInfo() : null;
    if (!info) {
        $box.html(`<div class="horae-empty-hint">${t('vector.debugEmpty') || ''}</div>`);
        return;
    }
    const escape = (s) => $('<div>').text(s == null ? '' : String(s)).html();
    const ts = new Date(info.timestamp || Date.now()).toLocaleString();

    const rewriteIntent = info.query?.rewriteIntent || info.rewrite?.intent || '';
    const rewriteQueries = Array.isArray(info.query?.rewriteQueries)
        ? info.query.rewriteQueries
        : (Array.isArray(info.rewrite?.queries) ? info.rewrite.queries : []);
    const rewriteActive = info.rewrite?.enabled === true || !!rewriteIntent || rewriteQueries.length > 0;
    const rewriteResultLines = [];
    if (rewriteIntent) rewriteResultLines.push(`INTENT: ${rewriteIntent}`);
    rewriteQueries.forEach((q, i) => rewriteResultLines.push(`Q${i + 1}: ${q}`));
    if (rewriteResultLines.length === 0 && info.rewrite?.error) {
        rewriteResultLines.push(`ERROR: ${info.rewrite.error}`);
    } else if (rewriteResultLines.length === 0 && info.rewrite?.reason && info.rewrite.reason !== 'disabled') {
        rewriteResultLines.push(`- (${info.rewrite.reason})`);
    }

    const queryRows = [
        [t('vector.debugQueryUser'), info.query?.user],
        [t('vector.debugQueryState'), info.query?.state],
        rewriteActive
            ? [t('vector.debugQueryRewriteResult') || '重写结果', rewriteResultLines.join('\n')]
            : [t('vector.debugQueryMerged'), info.query?.merged],
    ].map(([k, v]) => `<div class="horae-vector-debug-row"><span class="horae-vector-debug-key">${escape(k)}</span><span class="horae-vector-debug-val">${escape(v || '-')}</span></div>`).join('');

    const settingsLine = info.settings
        ? `topK=${info.settings.topK} / threshold=${info.settings.threshold}${typeof info.settings.effectiveThreshold === 'number' && info.settings.effectiveThreshold !== info.settings.threshold ? ` (eff=${info.settings.effectiveThreshold.toFixed(3)})` : ''} / pureMode=${info.settings.pureMode} / rerank=${info.settings.useRerank}${info.settings.useRerank ? ` / minScore=${_formatDebugSimilarity(info.settings.rerankMinScore)} / candidates=${info.settings.rerankCandidates}` : ''}`
        : '';

    const renderHits = (rows) => {
        if (!rows || rows.length === 0) return `<div class="horae-empty-hint">${escape(t('vector.debugNone') || '-')}</div>`;
        return `<table class="horae-vector-debug-table"><thead><tr><th>#</th><th>${escape(t('vector.debugColScore'))}</th><th>${escape(t('vector.debugColSource'))}</th><th>${escape(t('vector.debugColPreview'))}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.messageIndex}</td><td>${_formatDebugSimilarity(r.similarity)}</td><td>${escape(r.source || '-')}</td><td>${escape(r.docPreview || '')}</td></tr>`).join('')}</tbody></table>`;
    };

    let rerankBlock = '';
    if (info.rerank) {
        if (info.rerank.error) {
            rerankBlock = `<div class="horae-empty-hint">${escape(t('vector.debugRerankError'))}: ${escape(info.rerank.error)}</div>`;
        } else if (info.rerank.enabled && Array.isArray(info.rerank.output)) {
            const rerankRows = info.rerank.output.map(r => `<tr class="${r.passed ? '' : 'horae-vector-debug-dropped'}"><td>${r.messageIndex ?? '-'}</td><td>${_formatDebugSimilarity(r.relevance)}</td><td>${r.passed ? '✓' : '✗'}</td></tr>`).join('');
            rerankBlock = `
                <div class="horae-vector-debug-row"><span class="horae-vector-debug-key">${escape(t('vector.debugRerankInfo'))}</span><span class="horae-vector-debug-val">minScore=${_formatDebugSimilarity(info.rerank.minScore)} / fullText=${info.rerank.useFullText} / passed=${info.rerank.passedCount}/${info.rerank.output.length}</span></div>
                <table class="horae-vector-debug-table"><thead><tr><th>#</th><th>${escape(t('vector.debugColScore'))}</th><th>${escape(t('vector.debugColPassed'))}</th></tr></thead><tbody>${rerankRows}</tbody></table>
            `;
        }
    }

    $box.html(`
        <div class="horae-vector-debug-meta">
            <span><i class="fa-regular fa-clock"></i> ${escape(ts)}</span>
            <span><i class="fa-solid fa-database"></i> ${escape(t('vector.debugIndexedCount'))}: ${info.indexedCount ?? '-'}</span>
        </div>
        <div class="horae-vector-debug-section">
            <div class="horae-vector-debug-title">${escape(t('vector.debugQueryTitle'))}</div>
            ${queryRows}
            <div class="horae-vector-debug-row"><span class="horae-vector-debug-key">${escape(t('vector.debugSettings'))}</span><span class="horae-vector-debug-val">${escape(settingsLine)}</span></div>
        </div>
        <div class="horae-vector-debug-section">
            <div class="horae-vector-debug-title">${escape(t('vector.debugStructured'))} (${(info.structured || []).length})</div>
            ${renderHits(info.structured)}
        </div>
        <div class="horae-vector-debug-section">
            <div class="horae-vector-debug-title">${escape(t('vector.debugEmbedding'))} (${(info.embedding || []).length})</div>
            ${renderHits(info.embedding)}
        </div>
        ${rerankBlock ? `<div class="horae-vector-debug-section"><div class="horae-vector-debug-title">${escape(t('vector.debugRerank'))}</div>${rerankBlock}</div>` : ''}
        <div class="horae-vector-debug-section">
            <div class="horae-vector-debug-title">${escape(t('vector.debugFinal'))} (${(info.final || []).length})</div>
            ${renderHits(info.final)}
        </div>
        <div class="horae-vector-debug-section">
            <div class="horae-vector-debug-title">${escape(t('vector.debugRecallText'))}</div>
            <pre class="horae-vector-debug-pre">${escape(info.recallText || '')}</pre>
        </div>
    `);
}

function _copyVectorDebugInfo() {
    const info = (typeof vectorManager !== 'undefined' && vectorManager?.getLastDebugInfo) ? vectorManager.getLastDebugInfo() : null;
    if (!info) {
        showToast(t('vector.debugEmpty'), 'info');
        return;
    }
    try {
        const text = JSON.stringify(info, null, 2);
        navigator.clipboard.writeText(text).then(
            () => showToast(t('vector.debugCopied'), 'success'),
            () => showToast(t('vector.debugCopyFailed'), 'error'),
        );
    } catch (err) {
        showToast(t('vector.debugCopyFailed') + ': ' + (err?.message || ''), 'error');
    }
}

function _syncVectorRecallPresetInputs() {
    $('#horae-setting-vector-pure-mode').prop('checked', !!settings.vectorPureMode);
    $('#horae-setting-vector-rerank-enabled').prop('checked', !!settings.vectorRerankEnabled);
    $('#horae-vector-rerank-options').toggle(!!settings.vectorRerankEnabled);
    $('#horae-setting-vector-rerank-fulltext').prop('checked', !!settings.vectorRerankFullText);
    $('#horae-setting-vector-rerank-candidates').val(settings.vectorRerankCandidates ?? 25);
    $('#horae-setting-vector-rerank-recall-threshold').val(settings.vectorRerankRecallThreshold ?? 0.3);
    $('#horae-setting-vector-rerank-min-score').val(settings.vectorRerankMinScore ?? 0.5);
    $('#horae-setting-vector-topk').val(settings.vectorTopK || 5);
    $('#horae-setting-vector-threshold').val(settings.vectorThreshold || 0.72);
    $('#horae-setting-vector-fulltext-count').val(settings.vectorFullTextCount ?? 3);
    $('#horae-setting-vector-fulltext-threshold').val(settings.vectorFullTextThreshold ?? 0.9);
}

function syncSettingsToUI() {
    $('#horae-setting-enabled').prop('checked', settings.enabled);
    $('#horae-setting-auto-parse').prop('checked', settings.autoParse);
    $('#horae-setting-auto-fill-prev-timeline').prop('checked', settings.autoFillPrevTimelineOnSend === true);
    $('#horae-setting-inject-context').prop('checked', settings.injectContext);
    $('#horae-setting-inject-custom-prompts').prop('checked', !!settings.injectCustomPrompts);
    $('#horae-setting-show-panel').prop('checked', settings.showMessagePanel);
    $('#horae-setting-show-top-icon').prop('checked', settings.showTopIcon !== false);
    $('#horae-ext-show-top-icon').prop('checked', settings.showTopIcon !== false);
    $('#horae-setting-injection-depth-source').val(settings.injectionDepthSource === 'preset' ? 'preset' : 'system');
    $('#horae-setting-injection-position').val(settings.injectionPosition);
    $('#horae-setting-timeline-injection-mode').val(settings.timelineInjectionMode === 'separate' ? 'separate' : 'inline');
    $('#horae-setting-send-timeline').prop('checked', settings.sendTimeline);
    $('#horae-setting-context-depth').val(Number.isFinite(parseInt(settings.contextDepth, 10)) ? Math.max(0, parseInt(settings.contextDepth, 10)) : 15);
    $('#horae-setting-send-characters').prop('checked', settings.sendCharacters);
    $('#horae-setting-send-character-affection').prop('checked', settings.sendCharacterAffection !== false);
    $('#horae-setting-send-main-character-personality').prop('checked', !!settings.sendMainCharacterPersonality);
    $('#horae-setting-send-items').prop('checked', settings.sendItems);
    console.log(
        `[Horae][MainPersonality] syncSettingsToUI: sendMainCharacterPersonality=${!!settings.sendMainCharacterPersonality} sendCharacters=${settings.sendCharacters !== false}`
    );

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

    // 反转述模式
    $('#horae-setting-anti-paraphrase').prop('checked', !!settings.antiParaphraseMode);
    // 番外模式
    $('#horae-setting-sideplay-mode').prop('checked', !!settings.sideplayMode);

    // RPG 模式
    $('#horae-setting-rpg-mode').prop('checked', !!settings.rpgMode);
    $('#horae-rpg-sub-options').toggle(!!settings.rpgMode);
    $('#horae-setting-rpg-bars').prop('checked', settings.sendRpgBars !== false);
    $('#horae-setting-rpg-attrs').prop('checked', settings.sendRpgAttributes !== false);
    $('#horae-setting-rpg-skills').prop('checked', settings.sendRpgSkills !== false);
    $('#horae-setting-rpg-user-only').prop('checked', !!settings.rpgUserOnly);
    $('#horae-setting-rpg-bars-uo').prop('checked', !!settings.rpgBarsUserOnly);
    $('#horae-setting-rpg-bars-uo').closest('label').toggle(settings.sendRpgBars !== false);
    $('#horae-setting-rpg-attrs-uo').prop('checked', !!settings.rpgAttrsUserOnly);
    $('#horae-setting-rpg-attrs-uo').closest('label').toggle(settings.sendRpgAttributes !== false);
    $('#horae-setting-rpg-skills-uo').prop('checked', !!settings.rpgSkillsUserOnly);
    $('#horae-setting-rpg-skills-uo').closest('label').toggle(settings.sendRpgSkills !== false);
    $('#horae-setting-rpg-reputation').prop('checked', !!settings.sendRpgReputation);
    $('#horae-setting-rpg-reputation-uo').prop('checked', !!settings.rpgReputationUserOnly);
    $('#horae-setting-rpg-reputation-uo').closest('label').toggle(!!settings.sendRpgReputation);
    $('#horae-setting-rpg-equipment').prop('checked', !!settings.sendRpgEquipment);
    $('#horae-setting-rpg-equipment-uo').prop('checked', !!settings.rpgEquipmentUserOnly);
    $('#horae-setting-rpg-equipment-uo').closest('label').toggle(!!settings.sendRpgEquipment);
    $('#horae-setting-rpg-level').prop('checked', !!settings.sendRpgLevel);
    $('#horae-setting-rpg-level-uo').prop('checked', !!settings.rpgLevelUserOnly);
    $('#horae-setting-rpg-level-uo').closest('label').toggle(!!settings.sendRpgLevel);
    $('#horae-setting-rpg-currency').prop('checked', !!settings.sendRpgCurrency);
    $('#horae-setting-rpg-currency-uo').prop('checked', !!settings.rpgCurrencyUserOnly);
    $('#horae-setting-rpg-currency-uo').closest('label').toggle(!!settings.sendRpgCurrency);
    $('#horae-setting-rpg-stronghold').prop('checked', !!settings.sendRpgStronghold);
    $('#horae-setting-rpg-dice').prop('checked', !!settings.rpgDiceEnabled);
    $('#horae-rpg-prompt-group').toggle(!!settings.rpgMode);
    _syncRpgTabVisibility();

    // 自动摘要
    $('#horae-setting-auto-summary').prop('checked', !!settings.autoSummaryEnabled);
    $('#horae-auto-summary-options').toggle(!!settings.autoSummaryEnabled);
    $('#horae-setting-auto-summary-keep').val(settings.autoSummaryKeepRecent || 10);
    $('#horae-setting-auto-summary-mode').val(settings.autoSummaryBufferMode || 'messages');
    $('#horae-setting-auto-summary-source').val(_getAutoSummarySourceMode());
    _syncAutoSummaryLegacyBufferLimit();
    _syncAutoSummaryTriggerLimitInput();
    updateAutoSummaryHint();
    {
        const raw = parseInt(settings.autoSummaryResummaryThreshold, 10);
        const thresholdVal = Number.isFinite(raw) ? raw : 10;
        $('#horae-setting-auto-summary-resummary-threshold').val(thresholdVal);
    }
    $('#horae-setting-auto-summary-batch-msgs').val(settings.autoSummaryBatchMaxMsgs || 50);
    $('#horae-setting-auto-summary-batch-tokens').val(settings.autoSummaryBatchMaxTokens || 80000);
    $('#horae-setting-auto-summary-api-url').val(settings.autoSummaryApiUrl || '');
    $('#horae-setting-auto-summary-api-key').val(settings.autoSummaryApiKey || '');
    $('#horae-setting-summary-should-stream').prop('checked', settings.summaryShouldStream !== false);
    $('#horae-setting-sub-api-scope-auto-summary').prop('checked', settings.subApiScopeAutoSummary !== false);
    $('#horae-setting-sub-api-scope-manual-summary').prop('checked', settings.subApiScopeManualSummary !== false);
    $('#horae-setting-sub-api-scope-brief').prop('checked', !!settings.subApiScopeBrief);
    // 如果已有保存的模型名，初始化 select 选项
    const _savedModel = settings.autoSummaryModel || '';
    const _modelSel = document.getElementById('horae-setting-auto-summary-model');
    if (_savedModel && _modelSel) {
        _modelSel.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = _savedModel;
        opt.textContent = _savedModel;
        opt.selected = true;
        _modelSel.appendChild(opt);
    }
    updateAutoSummaryHint();

    const sysPrompt = settings.customSystemPrompt || horaeManager.getDefaultSystemPrompt();
    const batchPromptVal = settings.customBatchPrompt || getDefaultBatchPrompt();
    const analysisPromptVal = settings.customAnalysisPrompt || getDefaultAnalysisPrompt();
    const compressPromptVal = settings.customCompressPrompt || getDefaultCompressPrompt();
    const autoSumPromptVal = settings.customAutoSummaryPrompt || getDefaultAutoSummaryPrompt();
    const autoResumPromptVal = settings.customAutoResummaryPrompt || getDefaultAutoResummaryPrompt();
    const customHeadPromptVal = settings.customHeadPrompt || '';
    const customTailPromptVal = settings.customTailPrompt || '';
    const tablesPromptVal = settings.customTablesPrompt || horaeManager.getDefaultTablesPrompt();
    const locationPromptVal = settings.customLocationPrompt || horaeManager.getDefaultLocationPrompt();
    const relPromptVal = settings.customRelationshipPrompt || horaeManager.getDefaultRelationshipPrompt();
    const moodPromptVal = settings.customMoodPrompt || horaeManager.getDefaultMoodPrompt();
    const rpgPromptVal = settings.customRpgPrompt || horaeManager.getDefaultRpgPromptResolved();
    $('#horae-custom-system-prompt').val(sysPrompt);
    $('#horae-custom-batch-prompt').val(batchPromptVal);
    $('#horae-custom-analysis-prompt').val(analysisPromptVal);
    $('#horae-custom-compress-prompt').val(compressPromptVal);
    $('#horae-custom-auto-summary-prompt').val(autoSumPromptVal);
    $('#horae-custom-auto-resummary-prompt').val(autoResumPromptVal);
    $('#horae-custom-head-prompt').val(customHeadPromptVal);
    $('#horae-custom-tail-prompt').val(customTailPromptVal);
    $('#horae-custom-tables-prompt').val(tablesPromptVal);
    $('#horae-custom-location-prompt').val(locationPromptVal);
    $('#horae-custom-relationship-prompt').val(relPromptVal);
    $('#horae-custom-mood-prompt').val(moodPromptVal);
    $('#horae-custom-rpg-prompt').val(rpgPromptVal);
    $('#horae-system-prompt-count').text(sysPrompt.length);
    $('#horae-batch-prompt-count').text(batchPromptVal.length);
    $('#horae-analysis-prompt-count').text(analysisPromptVal.length);
    $('#horae-compress-prompt-count').text(compressPromptVal.length);
    $('#horae-auto-summary-prompt-count').text(autoSumPromptVal.length);
    $('#horae-auto-resummary-prompt-count').text(autoResumPromptVal.length);
    $('#horae-custom-head-prompt-count').text(customHeadPromptVal.length);
    $('#horae-custom-tail-prompt-count').text(customTailPromptVal.length);
    $('#horae-tables-prompt-count').text(tablesPromptVal.length);
    $('#horae-location-prompt-count').text(locationPromptVal.length);
    $('#horae-relationship-prompt-count').text(relPromptVal.length);
    $('#horae-mood-prompt-count').text(moodPromptVal.length);
    $('#horae-rpg-prompt-count').text(rpgPromptVal.length);

    // 面板宽度和偏移
    $('#horae-setting-panel-width').val(settings.panelWidth || 100);
    const ofs = settings.panelOffset || 0;
    $('#horae-setting-panel-offset').val(ofs);
    $('#horae-panel-offset-value').text(`${ofs}px`);
    applyPanelWidth();

    // 主题模式
    refreshThemeSelector();
    applyThemeMode();

    // 自定义CSS
    $('#horae-custom-css').val(settings.customCSS || '');
    applyCustomCSS();

    // 向量记忆
    $('#horae-setting-vector-enabled').prop('checked', !!settings.vectorEnabled);
    $('#horae-vector-options').toggle(!!settings.vectorEnabled);
    $('#horae-setting-vector-source').val(settings.vectorSource || 'local');
    $('#horae-setting-vector-model').val(settings.vectorModel || 'Xenova/bge-small-zh-v1.5');
    $('#horae-setting-vector-dtype').val(settings.vectorDtype || 'q8');
    $('#horae-setting-vector-api-url').val(settings.vectorApiUrl || '');
    $('#horae-setting-vector-api-key').val(settings.vectorApiKey || '');
    $('#horae-setting-vector-query-rewrite-enabled').prop('checked', !!settings.vectorQueryRewriteEnabled);
    $('#horae-setting-vector-query-rewrite-url').val(settings.vectorQueryRewriteUrl || '');
    $('#horae-setting-vector-query-rewrite-key').val(settings.vectorQueryRewriteKey || '');
    _upsertModelSelectValue('horae-setting-vector-api-model', settings.vectorApiModel || '');
    _upsertModelSelectValue('horae-setting-vector-query-rewrite-model-select', settings.vectorQueryRewriteModel || '');
    $('#horae-setting-vector-pure-mode').prop('checked', !!settings.vectorPureMode);
    $('#horae-setting-vector-rerank-enabled').prop('checked', !!settings.vectorRerankEnabled);
    $('#horae-vector-rerank-options').toggle(!!settings.vectorRerankEnabled);
    $('#horae-setting-vector-rerank-fulltext').prop('checked', !!settings.vectorRerankFullText);
    _upsertModelSelectValue('horae-setting-vector-rerank-model', settings.vectorRerankModel || '');
    $('#horae-setting-vector-rerank-url').val(settings.vectorRerankUrl || '');
    $('#horae-setting-vector-rerank-key').val(settings.vectorRerankKey || '');
    $('#horae-setting-vector-rerank-candidates').val(settings.vectorRerankCandidates ?? 25);
    $('#horae-setting-vector-rerank-recall-threshold').val(settings.vectorRerankRecallThreshold ?? 0.3);
    _renderVectorRecallPresetSelect();
    _syncVectorRecallPresetInputs();
    $('#horae-setting-vector-strip-tags').val(settings.vectorStripTags || '');
    _syncVectorSourceUI();
    _updateVectorStatus();
}

// ============================================
// 向量记忆
// ============================================

function _deriveChatId(ctx) {
    if (ctx?.chatId) return ctx.chatId;
    const chat = ctx?.chat;
    if (chat?.length > 0 && chat[0].create_date) return `chat_${chat[0].create_date}`;
    return 'unknown';
}

function _updateVectorStatus() {
    const statusEl = document.getElementById('horae-vector-status-text');
    const countEl = document.getElementById('horae-vector-index-count');
    if (!statusEl) return;
    if (vectorManager.isLoading) {
        statusEl.textContent = t('common.loading');
    } else if (vectorManager.isReady) {
        const dimText = vectorManager.dimensions ? t('ui.vectorDimensions', { dim: vectorManager.dimensions }) : '';
        const nameText = vectorManager.isApiMode
            ? `API: ${vectorManager.modelName}`
            : vectorManager.modelName.split('/').pop();
        statusEl.textContent = `✓ ${nameText}${dimText}`;
    } else {
        statusEl.textContent = settings.vectorEnabled ? t('vector.modelNotLoaded') : t('vector.disabled');
    }
    if (countEl) {
        countEl.textContent = vectorManager.vectors.size > 0
            ? t('ui.vectorIndexCount', { n: vectorManager.vectors.size })
            : '';
    }
}

/** 计算当前聊天中缺失/过期的向量索引数量（仅统计可索引消息） */
function _countVectorIndexGap(chat) {
    if (!Array.isArray(chat) || chat.length === 0) return { missing: 0, indexable: 0, missingIndices: [] };

    let missing = 0;
    let indexable = 0;
    const missingIndices = [];
    const markMissing = (idx) => {
        missing++;
        missingIndices.push(idx);
    };

    for (let i = 0; i < chat.length; i++) {
        const msg = chat[i];
        if (!msg || msg.is_user) continue;

        const meta = msg.horae_meta;
        if (!meta || meta._skipHorae) continue;

        const doc = vectorManager.buildVectorDocument(meta);
        if (!doc) continue;

        indexable++;
        const existing = vectorManager.vectors.get(i);
        if (!existing) {
            markMissing(i);
            continue;
        }

        try {
            const hash = vectorManager._hashString(doc);
            if (existing.hash !== hash) markMissing(i);
        } catch (_) {
            markMissing(i);
        }
    }

    return { missing, indexable, missingIndices };
}

function _findPreviousAiIndexBeforeCurrentUser(chat) {
    if (!Array.isArray(chat) || chat.length < 2) return -1;

    const lastIndex = chat.length - 1;
    if (!chat[lastIndex]?.is_user) return -1;

    for (let i = lastIndex - 1; i >= 0; i--) {
        const msg = chat[i];
        if (!msg || msg.is_user) continue;
        if (msg.horae_meta?._skipHorae) continue;
        return i;
    }

    return -1;
}

function _scheduleDeferredVectorMessageIndex(messageIndex, chatId) {
    if (!Number.isInteger(messageIndex) || messageIndex < 0 || !chatId || chatId === 'unknown') return;

    const key = `${chatId}:${messageIndex}`;
    if (_vectorDeferredIndexKeys.has(key)) return;
    _vectorDeferredIndexKeys.add(key);

    setTimeout(async () => {
        try {
            if (!settings.vectorEnabled || !vectorManager.isReady) return;

            const currentChatId = _deriveChatId(getContext());
            if (currentChatId !== chatId) {
                console.log(`[Horae Vector] 后台补建跳过：聊天已切换 ${chatId} -> ${currentChatId}`);
                return;
            }

            const chat = horaeManager.getChat();
            if (!Array.isArray(chat)) return;

            if (vectorManager.chatId !== chatId) {
                await vectorManager.loadChat(chatId, chat);
            }

            const msg = chat[messageIndex];
            const meta = msg?.horae_meta;
            if (!msg || msg.is_user || !meta || meta._skipHorae) return;

            const doc = vectorManager.buildVectorDocument(meta);
            if (!doc) return;

            await vectorManager.addMessage(messageIndex, meta);
            console.log(`[Horae Vector] 后台补建完成：楼层 #${messageIndex}`);
        } catch (err) {
            console.warn(`[Horae Vector] 后台补建失败 #${messageIndex}:`, err);
        } finally {
            _vectorDeferredIndexKeys.delete(key);
            _updateVectorStatus();
        }
    }, 0);
}

/** 清理向量索引中的不可追踪楼层（user/无meta/番外/无可索引文档） */
async function _pruneVectorUntrackableEntries(chat) {
    if (!Array.isArray(chat) || vectorManager.vectors.size === 0) return 0;

    const staleIndices = [];
    for (const [idx] of vectorManager.vectors) {
        const msg = chat[idx];
        const meta = msg?.horae_meta;
        const doc = (!msg || msg.is_user || !meta || meta._skipHorae) ? '' : vectorManager.buildVectorDocument(meta);
        if (!doc) staleIndices.push(idx);
    }

    if (staleIndices.length === 0) return 0;

    for (const idx of staleIndices) {
        await vectorManager.removeMessage(idx);
    }
    console.log(`[Horae Vector] 已清理不可追踪索引: ${staleIndices.length} 条`);
    return staleIndices.length;
}

async function _ensureVectorIndexBeforeRecall() {
    if (!settings.vectorEnabled || !vectorManager.isReady) return;

    const chat = horaeManager.getChat();
    if (!chat || chat.length === 0) return;

    const ctx = getContext();
    const chatId = _deriveChatId(ctx);
    if (!chatId || chatId === 'unknown') return;

    if (_vectorEnsureIndexPromise) {
        await _vectorEnsureIndexPromise.catch(() => { });
    }

    if (vectorManager.chatId !== chatId) {
        await vectorManager.loadChat(chatId, chat);
        _updateVectorStatus();
    }

    await _pruneVectorUntrackableEntries(chat);

    const { missing, indexable, missingIndices } = _countVectorIndexGap(chat);
    if (missing <= 0) return;

    const previousAiIndex = _findPreviousAiIndexBeforeCurrentUser(chat);
    if (missing === 1 && missingIndices[0] === previousAiIndex) {
        console.log(`[Horae Vector] 仅上一条AI楼层 #${previousAiIndex} 缺失/过期，延后后台补建，不阻塞本轮发送`);
        return { deferredMessageIndex: previousAiIndex, chatId };
    }

    // showToast(`检测到 ${missing}/${indexable} 条向量索引缺失，正在补建索引。请勿切换或退出聊天。`, 'warning');

    if (missing > 1) {
        showToast(`检测到 ${missing} 条向量索引缺失，正在补建索引。请勿切换或退出聊天。`, 'warning');
    }

    const runChatId = chatId;
    _vectorEnsureIndexChatId = runChatId;
    _vectorEnsureIndexPromise = vectorManager.batchIndex(chat);

    try {
        const result = await _vectorEnsureIndexPromise;
        const currentChatId = _deriveChatId(getContext());
        if (currentChatId === runChatId) {
            // showToast(`向量索引补建完成：新增 ${result.indexed} 条，跳过 ${result.skipped} 条。`, 'success');
        } else {
            console.warn(`[Horae] 向量索引补建完成，但聊天已切换: ${runChatId} -> ${currentChatId}`);
        }
    } catch (err) {
        console.error('[Horae] 向量索引自动补建失败:', err);
        showToast(`向量索引补建失败：${err?.message || err}`, 'error');
    } finally {
        if (_vectorEnsureIndexChatId === runChatId) {
            _vectorEnsureIndexPromise = null;
            _vectorEnsureIndexChatId = null;
        }
        _updateVectorStatus();
    }
}

/** 检测是否为移动端（iOS/Android/小屏设备） */
function _isMobileDevice() {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
    return window.innerWidth <= 768 && ('ontouchstart' in window);
}

/**
 * 移动端本地向量安全检查：弹窗确认后才加载，防 OOM 闪退。
 * 返回 true = 允许继续加载，false = 用户拒绝或被拦截
 */
function _mobileLocalVectorGuard() {
    if (!_isMobileDevice()) return Promise.resolve(true);
    if (settings.vectorSource === 'api') return Promise.resolve(true);

    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'horae-modal';
        modal.innerHTML = `
        <div class="horae-modal-content" style="max-width:360px;">
            <div class="horae-modal-header"><i class="fa-solid fa-triangle-exclamation" style="color:#f59e0b;"></i> ${t('ui.localVectorWarningTitle')}</div>
            <div class="horae-modal-body" style="font-size:13px;line-height:1.6;">
                <p>${t('ui.localVectorWarningP1')}</p>
                <p>${t('ui.localVectorWarningP2')}</p>
            </div>
            <div class="horae-modal-footer" style="display:flex;gap:8px;justify-content:flex-end;padding:10px 16px;">
                <button id="horae-vec-guard-cancel" class="horae-btn" style="flex:1;">${t('ui.localVectorDontLoad')}</button>
                <button id="horae-vec-guard-ok" class="horae-btn" style="flex:1;opacity:0.7;">${t('ui.localVectorStillLoad')}</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        preventModalBubble(modal);

        modal.querySelector('#horae-vec-guard-cancel').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
        modal.querySelector('#horae-vec-guard-ok').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) { modal.remove(); resolve(false); }
        });
    });
}

async function _initVectorModel() {
    if (vectorManager.isLoading) return;

    // 移动端 + 本地模型：弹窗确认，默认不加载
    const allowed = await _mobileLocalVectorGuard();
    if (!allowed) {
        showToast(t('toast.vectorSkipped'), 'info');
        return;
    }

    const progressEl = document.getElementById('horae-vector-progress');
    const fillEl = document.getElementById('horae-vector-progress-fill');
    const textEl = document.getElementById('horae-vector-progress-text');
    if (progressEl) progressEl.style.display = 'block';

    try {
        if (settings.vectorSource === 'api') {
            const apiUrl = settings.vectorApiUrl;
            const apiKey = settings.vectorApiKey;
            const apiModel = settings.vectorApiModel;
            if (!apiUrl || !apiKey || !apiModel) {
                throw new Error('请填写完整的 API 地址、密钥和模型名称');
            }
            await vectorManager.initApi(apiUrl, apiKey, apiModel);
        } else {
            await vectorManager.initModel(
                settings.vectorModel || 'Xenova/bge-small-zh-v1.5',
                settings.vectorDtype || 'q8',
                (info) => {
                    if (info.status === 'progress' && fillEl && textEl) {
                        const pct = info.progress?.toFixed(0) || 0;
                        fillEl.style.width = `${pct}%`;
                        textEl.textContent = t('toast.vectorDownloading', { pct });
                    } else if (info.status === 'done' && textEl) {
                        textEl.textContent = t('common.loading');
                    }
                    _updateVectorStatus();
                }
            );
        }

        const ctx = getContext();
        const chatId = _deriveChatId(ctx);
        await vectorManager.loadChat(chatId, horaeManager.getChat());

        const displayName = settings.vectorSource === 'api'
            ? `API: ${settings.vectorApiModel}`
            : vectorManager.modelName.split('/').pop();
        showToast(t('toast.vectorModelLoaded', { name: displayName }), 'success');
    } catch (err) {
        console.error('[Horae] vector model load failed:', err);
        const friendly = settings.vectorSource === 'api' ? _vectorErrorHint(err) : (err?.message || String(err));
        showToast(t('toast.vectorModelFailed', { error: friendly }), 'error');
    } finally {
        if (progressEl) progressEl.style.display = 'none';
        _updateVectorStatus();
    }
}

async function _buildVectorIndex() {
    if (!vectorManager.isReady) {
        showToast(t('toast.vectorWaitModel'), 'warning');
        return;
    }

    const chat = horaeManager.getChat();
    if (!chat || chat.length === 0) {
        showToast(t('toast.insufficientEvents'), 'warning');
        return;
    }

    const progressEl = document.getElementById('horae-vector-progress');
    const fillEl = document.getElementById('horae-vector-progress-fill');
    const textEl = document.getElementById('horae-vector-progress-text');
    if (progressEl) progressEl.style.display = 'block';
    if (textEl) textEl.textContent = t('ui.buildingIndex');

    try {
        const result = await vectorManager.batchIndex(chat, ({ current, total }) => {
            const pct = Math.round((current / total) * 100);
            if (fillEl) fillEl.style.width = `${pct}%`;
            if (textEl) textEl.textContent = t('toast.vectorBuildProgress', { current, total });
        });

        showToast(t('toast.vectorBuildDone', { indexed: result.indexed, skipped: result.skipped }), 'success');
    } catch (err) {
        console.error('[Horae] vector index build failed:', err);
        showToast(t('toast.vectorBuildFailed', { error: err.message }), 'error');
    } finally {
        if (progressEl) progressEl.style.display = 'none';
        _updateVectorStatus();
    }
}

async function _clearVectorIndex() {
    if (!confirm(t('confirm.clearVectorIndex'))) return;
    await vectorManager.clearIndex();
    showToast(t('toast.vectorIndexCleared'), 'success');
    _updateVectorStatus();
}

// ============================================
// 核心功能
// ============================================

/**
 * 带进度显示的历史扫描
 */
async function scanHistoryWithProgress() {
    const overlay = document.createElement('div');
    overlay.className = 'horae-progress-overlay' + (isLightMode() ? ' horae-light' : '');
    overlay.innerHTML = `
        <div class="horae-progress-container">
            <div class="horae-progress-title">${t('ui.scanningHistory')}</div>
            <div class="horae-progress-bar">
                <div class="horae-progress-fill" style="width: 0%"></div>
            </div>
            <div class="horae-progress-text">${t('ui.preparing')}</div>
        </div>
    `;
    document.body.appendChild(overlay);

    const fillEl = overlay.querySelector('.horae-progress-fill');
    const textEl = overlay.querySelector('.horae-progress-text');

    try {
        const result = await horaeManager.scanAndInjectHistory(
            (percent, current, total) => {
                fillEl.style.width = `${percent}%`;
                textEl.textContent = t('toast.vectorProcessing', { current, total });
            },
            null // 不使用AI分析，只解析已有标签
        );

        horaeManager.rebuildTableData();
        horaeManager.rebuildRelationships();
        horaeManager.rebuildLocationMemory();
        horaeManager.rebuildRpgData();

        await getContext().saveChat();

        showToast(t('toast.vectorScanDone', { processed: result.processed, skipped: result.skipped }), 'success');
        refreshAllDisplays();
        renderCustomTablesList();
    } catch (error) {
        console.error('[Horae] 扫描失败:', error);
        showToast(t('toast.scanFailed', { error: error.message }), 'error');
    } finally {
        overlay.remove();
    }
}

function _getPromptDefaultFromResource(key) {
    const lang = detectEffectiveAiLang(settings);
    return getPromptDefaultSync(lang, key) || '';
}

/** 默认的批量摘要提示词模板 */
function getDefaultBatchPrompt() {
    return _getPromptDefaultFromResource('customBatchPrompt') || '';
}

function getDefaultAnalysisPrompt() {
    return _getPromptDefaultFromResource('customAnalysisPrompt') || '';
}

function _isSubApiScopeEnabled(taskType = '') {
    switch (taskType) {
        case 'autoSummary':
            return settings.subApiScopeAutoSummary !== false;
        case 'manualSummary':
            return settings.subApiScopeManualSummary !== false;
        case 'brief':
            return !!settings.subApiScopeBrief;
        default:
            return true;
    }
}

function _shouldSkipSystemPromptInjectionOnSend() {
    // 副API「摘要」开启后，发送新消息时不再把系统注入提示词送给主回复模型。
    return !!settings.subApiScopeBrief;
}

function _shouldInjectCustomPrompts(taskType = '', opts = {}) {
    if (!settings.injectCustomPrompts) return false;
    if (opts.injectCustomPrompts === false) return false;
    if (opts.injectCustomPrompts === true) return true;
    return ['autoSummary', 'manualSummary', 'brief'].includes(taskType);
}

function _getCustomPromptInjectionParts(taskType = '', opts = {}) {
    if (!_shouldInjectCustomPrompts(taskType, opts)) {
        return { head: '', tail: '' };
    }
    return {
        head: String(settings.customHeadPrompt || '').trim(),
        tail: String(settings.customTailPrompt || '').trim(),
    };
}

function _pushSystemPromptIfAny(messages, content) {
    const text = String(content || '').trim();
    if (text) messages.push({ role: 'system', content: text });
}

/**
 * 副API/主API统一生成入口（总结相关任务）
 * taskType:
 * - autoSummary: 自动总结/二次总结
 * - manualSummary: 手动时间线压缩总结
 * - brief: 摘要（预留）
 */
async function generateForSummary(prompt, options = {}) {
    const taskType = options?.taskType || '';
    const messageIndex = Number.isInteger(options?.messageIndex) ? options.messageIndex : null;
    // 从 DOM 补读一次副API设置，防止浏览器自动填充未触发 input 事件导致设置为空
    _syncSubApiSettingsFromDom();
    const scopeEnabled = _isSubApiScopeEnabled(taskType);
    const useCustom = scopeEnabled;
    const hasUrl = !!(settings.autoSummaryApiUrl && settings.autoSummaryApiUrl.trim());
    const hasKey = !!(settings.autoSummaryApiKey && settings.autoSummaryApiKey.trim());
    const hasModel = !!(settings.autoSummaryModel && settings.autoSummaryModel.trim());
    console.log(`[Horae] generateForSummary: task=${taskType || 'default'}, useCustom=${useCustom}, hasUrl=${hasUrl}, hasKey=${hasKey}, hasModel=${hasModel}`);
    if (useCustom && hasUrl && hasKey && hasModel) {
        console.log(`[Horae] 使用副API生成`);
        return await generateWithDirectApi(prompt, { ...options, taskType, messageIndex });
    }
    if (useCustom && (!hasUrl || !hasKey || !hasModel)) {
        const missing = [!hasUrl && 'API地址', !hasKey && 'API密钥', !hasModel && '模型名称'].filter(Boolean).join('、');
        console.warn(`[Horae] 副API已勾选但缺少: ${missing}，回退主API`);
        showToast(t('toast.subApiMissing', { missing }), 'warning');
    } else if (!scopeEnabled) {
        console.log(`[Horae] 副API未命中应用范围(task=${taskType || 'default'})，使用主API`);
    }
    const context = getContext();
    const defaultNoRecallMarker = !!(
        context?.mainApi === 'openai' &&
        settings.injectContext &&
        settings.vectorEnabled
    );
    const defaultNoContextInjectionMarker = !!(
        context?.mainApi === 'openai' &&
        settings.injectContext
    );
    const shouldMarkNoRecall = options?.noVectorRecallMarker ?? defaultNoRecallMarker;
    const shouldSkipContextInject = options?.noContextInjectionMarker ?? defaultNoContextInjectionMarker;
    const shouldSkipTimelineInject = !!options?.noTimelineInjectionMarker;
    const shouldSkipSystemInject = !!options?.noSystemPromptInjectionMarker;
    return await _generateForAiTasks(prompt, {
        taskType,
        messageIndex,
        noVectorRecallMarker: shouldMarkNoRecall,
        noContextInjectionMarker: shouldSkipContextInject,
        noTimelineInjectionMarker: shouldSkipTimelineInject,
        noSystemPromptInjectionMarker: shouldSkipSystemInject,
        injectCustomPrompts: options?.injectCustomPrompts,
    });
}

function _getSummaryEntryRange(entry) {
    if (!entry) return null;
    if (Array.isArray(entry.range) && entry.range.length >= 2) {
        const start = Number(entry.range[0]);
        const end = Number(entry.range[1]);
        if (Number.isInteger(start) && Number.isInteger(end)) {
            return [Math.min(start, end), Math.max(start, end)];
        }
    }
    const indices = getSummaryMsgIndices(entry).filter(Number.isInteger);
    if (!indices.length) return null;
    let min = Infinity, max = -Infinity;
    for (const idx of indices) {
        if (idx < min) min = idx;
        if (idx > max) max = idx;
    }
    return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : null;
}

function _buildAutoSummaryPrompt(userName, eventText, sourceText, count) {
    const autoSumTemplate = settings.customAutoSummaryPrompt || getDefaultAutoSummaryPrompt();
    return autoSumTemplate
        .replace(/\{\{events\}\}/gi, eventText || '')
        .replace(/\{\{fulltext\}\}/gi, sourceText || '')
        .replace(/\{\{count\}\}/gi, String(count || 0))
        .replace(/\{\{user\}\}/gi, userName || t('ui.protagonist'));
}

function _buildAutoResummaryPrompt(userName, eventText, count) {
    let autoResumTemplate = settings.customAutoResummaryPrompt || getDefaultAutoResummaryPrompt();
    // autoResumTemplate = `${_createNoContextInjectionMarker()}\n${autoResumTemplate}`
    // console.log(`二次总结提示词:\n${autoResumTemplate}`);
    return autoResumTemplate
        .replace(/\{\{events\}\}/gi, eventText || '')
        .replace(/\{\{fulltext\}\}/gi, '')
        .replace(/\{\{count\}\}/gi, String(count || 0))
        .replace(/\{\{user\}\}/gi, userName || t('ui.protagonist'));
}

function _cleanSummaryText(raw) {
    if (!raw || !String(raw).trim()) return '';
    return String(raw).trim()
        .replace(/<think(?:ing)?[\s>][\s\S]*?<\/think(?:ing)?>/gi, '')
        .replace(/<horae>[\s\S]*?<\/horae>/gi, '')
        .replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, '')
        .replace(/<!--horae[\s\S]*?-->/gi, '')
        .trim();
}

function _extractHoraeSummaryText(raw) {
    const cleaned = _cleanSummaryText(raw);
    if (!cleaned) return { ok: false, reason: 'empty', text: '' };

    const hasOpenSummaryTag = /<horaesummary>/i.test(cleaned);
    const hasCloseSummaryTag = /<\/horaesummary>/i.test(cleaned);
    if (hasOpenSummaryTag && !hasCloseSummaryTag) {
        return { ok: false, reason: 'truncated', text: '' };
    }
    if (!hasOpenSummaryTag && !hasCloseSummaryTag) {
        return { ok: false, reason: 'format_missing', text: '' };
    }
    if (!hasOpenSummaryTag || !hasCloseSummaryTag) {
        return { ok: false, reason: 'format_unclosed', text: '' };
    }

    const summaryMatch = cleaned.match(/<horaesummary>([\s\S]*?)<\/horaesummary>/i);
    const text = (summaryMatch?.[1] || '').trim();
    if (!text) return { ok: false, reason: 'empty', text: '' };
    return { ok: true, reason: 'ok', text };
}

function _showHoraeSummaryFormatWarning(_stageLabel, reason) {
    if (reason === 'truncated') {
        showToast('总结失败：AI回复截断', 'warning');
        return;
    }
    showToast('总结失败：AI回复掉格式', 'warning');
}

function _splitMsgIndicesByLimits(chat, indices, maxMsgs, maxTokens) {
    const sorted = [...new Set(indices || [])]
        .filter(i => Number.isInteger(i) && i >= 0 && chat?.[i])
        .sort((a, b) => a - b);
    if (!sorted.length) return [];
    const chunks = [];
    let current = [];
    let tokenCount = 0;
    for (const idx of sorted) {
        const tok = estimateTokens(chat[idx]?.mes || '');
        if (current.length > 0 && (current.length >= maxMsgs || tokenCount + tok > maxTokens)) {
            chunks.push(current);
            current = [];
            tokenCount = 0;
        }
        current.push(idx);
        tokenCount += tok;
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
}

function _splitTextsByLimits(texts, maxMsgs, maxTokens) {
    const list = (texts || []).filter(text => typeof text === 'string' && text.trim());
    if (!list.length) return [];
    const groups = [];
    let current = [];
    let tokenCount = 0;
    for (const text of list) {
        const tok = estimateTokens(text);
        if (current.length > 0 && (current.length >= maxMsgs || tokenCount + tok > maxTokens)) {
            groups.push(current);
            current = [];
            tokenCount = 0;
        }
        current.push(text);
        tokenCount += tok;
    }
    if (current.length > 0) groups.push(current);
    return groups;
}

function _splitResummaryEventsByLimits(eventRecords, maxEvents, maxTokens) {
    const records = (eventRecords || [])
        .filter(e => e && typeof e.summary === 'string' && e.summary.trim())
        .slice()
        .sort((a, b) => (a.msgIdx ?? 0) - (b.msgIdx ?? 0));
    if (!records.length) return [];

    const chunks = [];
    let current = [];
    let tokenCount = 0;
    for (const e of records) {
        const line = `[${e.level || '一般'}] ${e.date || '?'}${e.time ? ' ' + e.time : ''}: ${e.summary}`;
        const tok = estimateTokens(line);
        if (current.length > 0 && (current.length >= maxEvents || tokenCount + tok > maxTokens)) {
            chunks.push(current);
            current = [];
            tokenCount = 0;
        }
        current.push(e);
        tokenCount += tok;
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
}

function _pickAutoResummaryPlan(chat, cutoff, threshold) {
    const summaries = chat?.[0]?.horae_meta?.autoSummaries;
    if (!Array.isArray(summaries) || summaries.length === 0) return null;

    const normalized = [];
    for (const s of summaries) {
        if (!s?.id || s.active === false) continue;
        const depth = _normalizeSummaryDepth(s.depth);
        const range = _getSummaryEntryRange(s);
        if (!range) continue;
        const [start, end] = range;
        if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
        normalized.push({ id: s.id, depth, start, end, entry: s });
    }

    const eligible = [];
    for (const s of normalized) {
        const { depth, start, end } = s;
        // 允许 #0 起始的摘要参与二次总结（例如首段自动总结覆盖 #0-#N）
        if (start < 0 || end >= cutoff) continue;
        const overlappedByHigher = normalized.some(h =>
            h.depth > depth && !(h.end < start || h.start > end)
        );
        if (overlappedByHigher) continue;
        eligible.push(s);
    }
    if (!eligible.length) return null;

    const byDepth = new Map();
    for (const item of eligible) {
        if (!byDepth.has(item.depth)) byDepth.set(item.depth, []);
        byDepth.get(item.depth).push(item);
    }

    const depths = [...byDepth.keys()].sort((a, b) => a - b);
    for (const depth of depths) {
        const sameDepth = byDepth.get(depth)
            .slice()
            .sort((a, b) => a.start - b.start || a.end - b.end);
        if (sameDepth.length < threshold) continue;

        const anchors = sameDepth.slice(0, threshold);
        let windowStart = Math.min(...anchors.map(a => a.start));
        let windowEnd = Math.max(...anchors.map(a => a.end));

        const mergedMap = new Map();
        let changed = true;
        while (changed) {
            changed = false;
            for (const s of eligible) {
                if (s.depth > depth) continue;
                if (s.end < windowStart || s.start > windowEnd) continue;
                if (!mergedMap.has(s.id)) {
                    mergedMap.set(s.id, s);
                    changed = true;
                }
                if (s.start < windowStart) {
                    windowStart = s.start;
                    changed = true;
                }
                if (s.end > windowEnd) {
                    windowEnd = s.end;
                    changed = true;
                }
            }
        }

        const mergedEntries = [...mergedMap.values()]
            .sort((a, b) => a.start - b.start || a.end - b.end);
        const sameDepthCount = mergedEntries.filter(s => s.depth === depth).length;
        if (sameDepthCount < threshold) continue;

        return {
            depth,
            nextDepth: depth + 1,
            windowStart,
            windowEnd,
            mergedEntries,
        };
    }
    return null;
}

function _collectAutoResummaryPayload(chat, plan, cutoff) {
    if (!plan?.mergedEntries?.length) return null;
    const allSummaries = chat?.[0]?.horae_meta?.autoSummaries || [];
    const mergedSummaryIds = new Set(plan.mergedEntries.map(s => s.id));

    const blockedByHigherDepth = new Set();
    for (const s of allSummaries) {
        if (!s?.id || s.active === false || mergedSummaryIds.has(s.id)) continue;
        const depth = _normalizeSummaryDepth(s.depth);
        if (depth <= plan.depth) continue;
        const indices = getSummaryMsgIndices(s);
        for (const idx of indices) {
            if (Number.isInteger(idx) && idx >= plan.windowStart && idx <= plan.windowEnd && idx < cutoff) {
                blockedByHigherDepth.add(idx);
            }
        }
    }

    const coveredSet = new Set();
    for (let i = plan.windowStart; i <= plan.windowEnd; i++) {
        if (i < 0 || i >= cutoff || !chat?.[i]) continue;
        if (blockedByHigherDepth.has(i)) continue;
        if (chat[i]?.horae_meta?._skipHorae) continue;
        coveredSet.add(i);
    }
    for (const s of plan.mergedEntries) {
        const indices = getSummaryMsgIndices(s.entry);
        for (const idx of indices) {
            if (!Number.isInteger(idx) || idx < 0 || idx >= cutoff || !chat?.[idx]) continue;
            if (blockedByHigherDepth.has(idx)) continue;
            coveredSet.add(idx);
        }
    }
    const coveredIndices = [...coveredSet].sort((a, b) => a - b);
    if (!coveredIndices.length) return null;

    const activeSummaryIds = new Set(
        allSummaries
            .filter(s => s?.id && s.active !== false)
            .map(s => s.id)
    );
    const summarizedByMergedIndices = new Set();
    for (const s of plan.mergedEntries) {
        const indices = getSummaryMsgIndices(s.entry);
        for (const idx of indices) {
            if (Number.isInteger(idx)) summarizedByMergedIndices.add(idx);
        }
    }

    const eventRecords = [];
    const eventSeen = new Set();
    const sortedMergedEntries = [...plan.mergedEntries]
        .sort((a, b) => a.start - b.start || a.end - b.end);
    for (const s of sortedMergedEntries) {
        const cardText = (typeof s.entry?.summaryText === 'string' && s.entry.summaryText.trim())
            ? s.entry.summaryText.trim()
            : (s.entry?.summary || s.entry?.title || '');
        if (!cardText) continue;
        const anchorIdx = coveredIndices.find(i => i >= s.start && i <= s.end) ?? s.start ?? coveredIndices[0];
        const date = chat[anchorIdx]?.horae_meta?.timestamp?.story_date || '?';
        const time = chat[anchorIdx]?.horae_meta?.timestamp?.story_time || '';
        const key = `summary|${s.id}|${cardText}`;
        if (eventSeen.has(key)) continue;
        eventSeen.add(key);
        eventRecords.push({
            msgIdx: anchorIdx,
            date,
            time,
            level: `摘要L${s.depth}`,
            summary: cardText,
        });
    }

    // 仅补充窗口内“未被任何活跃摘要覆盖”的原始事件
    for (const msgIdx of coveredIndices) {
        if (summarizedByMergedIndices.has(msgIdx)) continue;
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta) continue;
        if (meta.event && !meta.events) {
            meta.events = [meta.event];
            delete meta.event;
        }
        if (!Array.isArray(meta.events)) continue;

        const date = meta.timestamp?.story_date || '?';
        const time = meta.timestamp?.story_time || '';
        for (let evtIdx = 0; evtIdx < meta.events.length; evtIdx++) {
            const evt = meta.events[evtIdx];
            if (!evt?.summary || evt._carryoverSeed) continue;
            if (evt.isSummary || evt._summaryId) continue;
            if (evt._compressedBy && activeSummaryIds.has(evt._compressedBy)) continue;

            const key = `${msgIdx}|${evtIdx}|${date}|${time}|${evt.level || '一般'}|${evt.summary}`;
            if (eventSeen.has(key)) continue;
            eventSeen.add(key);
            eventRecords.push({
                msgIdx,
                date,
                time,
                level: evt.level || '一般',
                summary: evt.summary,
            });
        }
    }

    eventRecords.sort((a, b) => a.msgIdx - b.msgIdx);

    const originalMap = new Map();
    const pushOriginal = (item) => {
        if (!item || typeof item !== 'object') return;
        const msgIdx = Number.isInteger(item.msgIdx) ? item.msgIdx : -1;
        const evtIdx = Number.isInteger(item.evtIdx) ? item.evtIdx : -1;
        const sum = item?.event?.summary || '';
        const key = `${msgIdx}|${evtIdx}|${sum}`;
        if (originalMap.has(key)) return;
        originalMap.set(key, {
            msgIdx,
            evtIdx,
            event: item.event ? { ...item.event } : item.event,
            timestamp: item.timestamp || null,
        });
    };

    for (const s of plan.mergedEntries) {
        const inherited = s.entry?.originalEvents;
        if (Array.isArray(inherited)) {
            for (const item of inherited) pushOriginal(item);
        }
    }
    for (const msgIdx of coveredIndices) {
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta) continue;
        if (meta.event && !meta.events) {
            meta.events = [meta.event];
            delete meta.event;
        }
        if (!Array.isArray(meta.events)) continue;
        for (let evtIdx = 0; evtIdx < meta.events.length; evtIdx++) {
            const evt = meta.events[evtIdx];
            if (!evt || evt.isSummary || evt._summaryId || evt._carryoverSeed) continue;
            pushOriginal({
                msgIdx,
                evtIdx,
                event: { ...evt },
                timestamp: meta.timestamp || null,
            });
        }
    }
    const originalEvents = [...originalMap.values()];

    return {
        depth: plan.depth,
        nextDepth: plan.nextDepth,
        mergedEntries: plan.mergedEntries,
        mergedSummaryIds,
        coveredIndices,
        range: [coveredIndices[0], coveredIndices[coveredIndices.length - 1]],
        eventRecords,
        originalEvents,
    };
}

async function _generateSummaryFromResummaryPayload(chat, payload, userName) {
    const maxMsgs = Math.max(5, parseInt(settings.autoSummaryBatchMaxMsgs, 10) || 50);
    const maxTokens = Math.max(10000, parseInt(settings.autoSummaryBatchMaxTokens, 10) || 80000);
    const chunks = _splitResummaryEventsByLimits(payload.eventRecords, maxMsgs, maxTokens);
    if (!chunks.length) return '';

    const chunkSummaries = [];
    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunk = chunks[chunkIdx];
        const remainChunks = chunks.length - chunkIdx - 1;
        const remainHint = ` (L${payload.depth}->L${payload.nextDepth}${remainChunks > 0 ? `, ${remainChunks} remaining` : ''})`;
        showToast(t('toast.autoSummaryProgress', {
            batch: chunkIdx + 1,
            total: chunks.length,
            remaining: remainHint
        }), 'info');

        const eventText = chunk.map(e => `[${e.level}] ${e.date}${e.time ? ' ' + e.time : ''}: ${e.summary}`).join('\n');

        const prompt = _buildAutoResummaryPrompt(userName, eventText, chunk.length);
        const response = await generateForSummary(prompt, { taskType: 'autoSummary', injectCustomPrompts: true });
        const extracted = _extractHoraeSummaryText(response);
        if (!extracted.ok) {
            _showHoraeSummaryFormatWarning('二次总结', extracted.reason);
            return '';
        }
        chunkSummaries.push(extracted.text);
    }
    if (chunkSummaries.length === 1) return chunkSummaries[0];

    let current = chunkSummaries.slice();
    let guard = 0;
    while (current.length > 1 && guard < 8) {
        guard++;
        let groups = _splitTextsByLimits(current, maxMsgs, maxTokens);
        if (groups.length === current.length && current.length > 1) {
            groups = [];
            for (let i = 0; i < current.length; i += 2) {
                groups.push(current.slice(i, i + 2));
            }
        }

        const next = [];
        for (const group of groups) {
            const eventText = group.map((text, i) => `[段${i + 1}] ${text}`).join('\n');
            const prompt = _buildAutoResummaryPrompt(userName, eventText, group.length);
            const response = await generateForSummary(prompt, { taskType: 'autoSummary', injectCustomPrompts: true });
            const extracted = _extractHoraeSummaryText(response);
            if (!extracted.ok) {
                _showHoraeSummaryFormatWarning('二次总结', extracted.reason);
                return '';
            }
            next.push(extracted.text);
        }
        current = next;
    }
    return current[0] || '';
}

async function _applyAutoResummary(chat, payload, summaryText) {
    if (!payload?.coveredIndices?.length || !summaryText) return null;
    const firstMsg = chat?.[0];
    if (!firstMsg) return null;
    if (!firstMsg.horae_meta) firstMsg.horae_meta = createEmptyMeta();
    if (!Array.isArray(firstMsg.horae_meta.autoSummaries)) firstMsg.horae_meta.autoSummaries = [];

    const summaryId = `as_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const mergedSummaryIds = payload.mergedSummaryIds;
    const mergedSummaries = [];
    const retainedSummaries = [];
    for (const s of firstMsg.horae_meta.autoSummaries) {
        if (s?.id && mergedSummaryIds.has(s.id)) mergedSummaries.push(s);
        else retainedSummaries.push(s);
    }
    firstMsg.horae_meta.autoSummaries = retainedSummaries;

    const summaryEntry = {
        id: summaryId,
        range: [...payload.range],
        coveredIndices: [...payload.coveredIndices],
        summaryText,
        originalEvents: payload.originalEvents || [],
        depth: payload.nextDepth,
        active: true,
        createdAt: new Date().toISOString(),
        auto: true
    };
    if (mergedSummaries.length > 0) summaryEntry.mergedSummaries = mergedSummaries;
    firstMsg.horae_meta.autoSummaries.push(summaryEntry);

    for (const msgIdx of payload.coveredIndices) {
        const meta = chat[msgIdx]?.horae_meta;
        if (!meta) continue;
        if (meta.event && !meta.events) {
            meta.events = [meta.event];
            delete meta.event;
        }
        if (!Array.isArray(meta.events)) continue;

        meta.events = meta.events.filter(evt => !(evt?._summaryId && mergedSummaryIds.has(evt._summaryId)));
        for (const evt of meta.events) {
            if (!evt || evt.isSummary || evt._summaryId || evt._carryoverSeed) continue;
            if (!evt._compressedBy || mergedSummaryIds.has(evt._compressedBy)) {
                evt._compressedBy = summaryId;
            }
        }
    }

    const targetIdx = payload.range[0];
    if (Number.isInteger(targetIdx) && chat[targetIdx]) {
        if (!chat[targetIdx].horae_meta) chat[targetIdx].horae_meta = createEmptyMeta();
        if (!Array.isArray(chat[targetIdx].horae_meta.events)) chat[targetIdx].horae_meta.events = [];
        chat[targetIdx].horae_meta.events.push({
            is_important: true,
            level: '摘要',
            summary: summaryText,
            isSummary: true,
            _summaryId: summaryId
        });
    }

    await setMessagesHidden(chat, [...payload.coveredIndices], true);
    return summaryId;
}

async function _runAutoResummaryIfNeeded(chat, cutoff) {
    const rawThreshold = parseInt(settings.autoSummaryResummaryThreshold, 10);
    const threshold = Number.isFinite(rawThreshold) ? rawThreshold : 10;
    if (threshold <= 0) return 0;
    const effectiveThreshold = Math.max(2, threshold);

    const maxRounds = 4;
    let rounds = 0;
    while (rounds < maxRounds) {
        const plan = _pickAutoResummaryPlan(chat, cutoff, effectiveThreshold);
        if (!plan) break;

        const payload = _collectAutoResummaryPayload(chat, plan, cutoff);
        if (!payload?.coveredIndices?.length) break;

        showToast(t('toast.autoSummaryProgress', {
            batch: payload.coveredIndices.length,
            total: payload.coveredIndices.length,
            remaining: ` (L${payload.depth}->L${payload.nextDepth})`
        }), 'info');

        const context = getContext();
        const userName = context?.name1 || t('ui.protagonist');
        const summaryText = await _generateSummaryFromResummaryPayload(chat, payload, userName);
        if (!summaryText) break;

        const summaryId = await _applyAutoResummary(chat, payload, summaryText);
        if (!summaryId) break;

        rounds++;
        await context.saveChat();
        updateTimelineDisplay();
        showToast(t('toast.autoSummaryDone', { from: payload.range[0], to: payload.range[1] }), 'success');
    }
    return rounds;
}

function _ensureAutoFillPrevTimelineForSubApiBriefScope() {
    if (!settings.subApiScopeBrief) return false;
    let changed = false;
    if (!settings.autoFillPrevTimelineOnSend) {
        settings.autoFillPrevTimelineOnSend = true;
        changed = true;
    }
    const autoFillEl = document.getElementById('horae-setting-auto-fill-prev-timeline');
    if (autoFillEl) autoFillEl.checked = true;
    return changed;
}

function _shouldStreamSummaryTasks() {
    return settings.summaryShouldStream !== false;
}

function _syncSubApiSettingsFromDom() {
    try {
        const urlEl = document.getElementById('horae-setting-auto-summary-api-url');
        const keyEl = document.getElementById('horae-setting-auto-summary-api-key');
        const modelEl = document.getElementById('horae-setting-auto-summary-model');
        const streamEl = document.getElementById('horae-setting-summary-should-stream');
        const autoSummaryScopeEl = document.getElementById('horae-setting-sub-api-scope-auto-summary');
        const manualSummaryScopeEl = document.getElementById('horae-setting-sub-api-scope-manual-summary');
        const briefScopeEl = document.getElementById('horae-setting-sub-api-scope-brief');
        let changed = false;
        if (streamEl && streamEl.checked !== (settings.summaryShouldStream !== false)) {
            settings.summaryShouldStream = streamEl.checked;
            changed = true;
        }
        if (autoSummaryScopeEl && autoSummaryScopeEl.checked !== (settings.subApiScopeAutoSummary !== false)) {
            settings.subApiScopeAutoSummary = autoSummaryScopeEl.checked;
            changed = true;
        }
        if (manualSummaryScopeEl && manualSummaryScopeEl.checked !== (settings.subApiScopeManualSummary !== false)) {
            settings.subApiScopeManualSummary = manualSummaryScopeEl.checked;
            changed = true;
        }
        if (briefScopeEl && briefScopeEl.checked !== !!settings.subApiScopeBrief) {
            settings.subApiScopeBrief = briefScopeEl.checked;
            changed = true;
        }
        if (_ensureAutoFillPrevTimelineForSubApiBriefScope()) {
            changed = true;
        }
        if (urlEl && urlEl.value && urlEl.value !== settings.autoSummaryApiUrl) {
            settings.autoSummaryApiUrl = urlEl.value;
            changed = true;
        }
        if (keyEl && keyEl.value && keyEl.value !== settings.autoSummaryApiKey) {
            settings.autoSummaryApiKey = keyEl.value;
            changed = true;
        }
        if (modelEl && modelEl.value && modelEl.value !== settings.autoSummaryModel) {
            settings.autoSummaryModel = modelEl.value;
            changed = true;
        }
        if (changed) saveSettings();
    } catch (_) { }
}

function _isGeminiEmbeddingEndpoint(rawUrl, model = '') {
    return /gemini|googleapis|generativelanguage|v1beta/i.test(`${rawUrl || ''} ${model || ''}`);
}

function _isGoogleGenerativeLanguageUrl(rawUrl) {
    return /googleapis\.com|generativelanguage/i.test(rawUrl || '');
}

function _geminiEmbeddingBase(rawUrl) {
    return String(rawUrl || '')
        .trim()
        .replace(/\/+$/, '')
        .replace(/\/chat\/completions$/i, '')
        .replace(/\/embeddings$/i, '')
        .replace(/\/v\d+(beta\d*|alpha\d*)?(?:\/.*)?$/i, '');
}

function _buildEmbeddingRequest(rawUrl, apiKey, model, texts) {
    const isGemini = _isGeminiEmbeddingEndpoint(rawUrl, model);
    if (!isGemini) {
        const base = String(rawUrl || '').trim().replace(/\/+$/, '').replace(/\/embeddings$/i, '');
        return {
            endpoint: `${base}/embeddings`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, input: texts }),
            parseVector: json => json?.data?.[0]?.embedding,
        };
    }

    const base = _geminiEmbeddingBase(rawUrl);
    const modelName = String(model || '').startsWith('models/') ? String(model) : `models/${model}`;
    const isGoogle = _isGoogleGenerativeLanguageUrl(base);
    const endpoint = `${base}/v1beta/${modelName}:batchEmbedContents${isGoogle ? `?key=${encodeURIComponent(apiKey)}` : ''}`;
    const headers = { 'Content-Type': 'application/json' };
    if (!isGoogle) headers.Authorization = `Bearer ${apiKey}`;
    return {
        endpoint,
        headers,
        body: JSON.stringify({
            requests: texts.map(text => ({
                model: modelName,
                content: { parts: [{ text }] },
            })),
        }),
        parseVector: json => json?.embeddings?.[0]?.values,
    };
}

/** 通用：从端点拉取模型列表 */
async function _fetchModelList(rawUrl, apiKey, purpose = 'any') {
    if (!rawUrl || !apiKey) throw new Error('请先填写 API 地址和密钥');
    const isGemini = _isGeminiEmbeddingEndpoint(rawUrl);
    if (isGemini) {
        const base = _geminiEmbeddingBase(rawUrl);
        const isGoogle = _isGoogleGenerativeLanguageUrl(base);
        const testUrl = `${base}/v1beta/models${isGoogle ? `?key=${encodeURIComponent(apiKey.trim())}` : ''}`;
        const headers = { 'Content-Type': 'application/json' };
        if (!isGoogle) headers.Authorization = `Bearer ${apiKey.trim()}`;
        const resp = await fetch(testUrl, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(15000)
        });
        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            throw new Error(`${resp.status}: ${errText.slice(0, 150)}`);
        }
        const data = await resp.json();
        return (data.models || [])
            .filter(m => {
                const methods = m.supportedGenerationMethods || [];
                if (methods.length === 0) return true;
                if (purpose === 'embedding') {
                    return methods.some(x => /embedContent|batchEmbedContents/i.test(x));
                }
                if (purpose === 'generation') {
                    return methods.some(x => /generateContent|streamGenerateContent/i.test(x));
                }
                return true;
            })
            .map(m => (m.name || '').replace(/^models\//, '') || m.displayName)
            .filter(Boolean);
    }

    let base = rawUrl.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/i, '').replace(/\/embeddings$/i, '');
    if (!base.endsWith('/v1')) base = base.replace(/\/+$/, '') + '/v1';
    const testUrl = `${base}/models`;
    const resp = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` },
        signal: AbortSignal.timeout(15000)
    });
    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`${resp.status}: ${errText.slice(0, 150)}`);
    }
    const data = await resp.json();
    return (data.data || data || []).map(m => m.id || m.name).filter(Boolean);
}

function _populateModelSelect(sel, models, prev = '') {
    if (!sel) return;

    const uniqueModels = [...new Set((models || []).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
    sel.innerHTML = '';

    for (const model of uniqueModels) {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        if (model === prev) opt.selected = true;
        sel.appendChild(opt);
    }

    if (prev && !uniqueModels.includes(prev)) {
        const opt = document.createElement('option');
        opt.value = prev;
        opt.textContent = t('toast.modelManual', { name: prev });
        opt.selected = true;
        sel.prepend(opt);
    }
}

/** 拉取 Embedding 模型列表并填充 <select> */
async function fetchEmbeddingModels() {
    const btn = document.getElementById('horae-btn-fetch-embed-models');
    const sel = document.getElementById('horae-setting-vector-api-model');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
    try {
        const url = ($('#horae-setting-vector-api-url').val() || settings.vectorApiUrl || '').trim();
        const key = ($('#horae-setting-vector-api-key').val() || settings.vectorApiKey || '').trim();
        const models = await _fetchModelList(url, key, 'embedding');
        if (!models.length) { showToast(t('toast.noModelsFetched'), 'warning'); return; }
        const prev = settings.vectorApiModel || '';
        _populateModelSelect(sel, models, prev);
        showToast(t('toast.fetchedModels', { n: models.length }), 'success');
    } catch (err) {
        showToast(t('toast.fetchModelsFailed', { error: err.message || err }), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i>'; }
    }
}

/** 拉取 Query 重写模型列表并填充 <select> */
async function fetchQueryRewriteModels() {
    const btn = document.getElementById('horae-btn-fetch-query-rewrite-models');
    const sel = document.getElementById('horae-setting-vector-query-rewrite-model-select');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
    try {
        const rewriteUrl = ($('#horae-setting-vector-query-rewrite-url').val() || settings.vectorQueryRewriteUrl || '').trim();
        const rewriteKey = ($('#horae-setting-vector-query-rewrite-key').val() || settings.vectorQueryRewriteKey || '').trim();
        const embedUrl = ($('#horae-setting-vector-api-url').val() || settings.vectorApiUrl || '').trim();
        const embedKey = ($('#horae-setting-vector-api-key').val() || settings.vectorApiKey || '').trim();
        const url = rewriteUrl || embedUrl;
        const key = rewriteKey || embedKey;
        const models = await _fetchModelList(url, key, 'generation');
        if (!models.length) { showToast(t('toast.noModelsFetched'), 'warning'); return; }
        const prev = settings.vectorQueryRewriteModel || '';
        _populateModelSelect(sel, models, prev);
        showToast(t('toast.fetchedModels', { n: models.length }), 'success');
    } catch (err) {
        showToast(t('toast.fetchModelsFailed', { error: err.message || err }), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i>'; }
    }
}

/** 测试向量 API 连线：发一条 embed 'ping' 验证 URL/Key/Model 三件套并报告维度 */
async function testVectorApiConnection() {
    const btn = document.getElementById('horae-btn-test-vector-api');
    const origHtml = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...'; }
    try {
        const url = ($('#horae-setting-vector-api-url').val() || settings.vectorApiUrl || '').trim();
        const key = ($('#horae-setting-vector-api-key').val() || settings.vectorApiKey || '').trim();
        const model = ($('#horae-setting-vector-api-model').val() || settings.vectorApiModel || '').trim();
        if (!url || !key || !model) {
            showToast(t('toast.vectorApiRequired'), 'warning');
            return;
        }
        const req = _buildEmbeddingRequest(url, key, model, ['ping']);
        let resp;
        try {
            resp = await fetch(req.endpoint, {
                method: 'POST',
                headers: req.headers,
                body: req.body,
            });
        } catch (err) {
            const wrapped = new Error(err?.message || 'Network error');
            wrapped.code = (err instanceof TypeError) ? 'NETWORK'
                : /timeout|timed out/i.test(err?.message || '') ? 'TIMEOUT'
                    : /socket hang up|ECONNRESET|ECONNREFUSED/i.test(err?.message || '') ? 'NETWORK'
                        : 'UNKNOWN';
            throw wrapped;
        }
        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            const wrapped = new Error(`HTTP ${resp.status}`);
            wrapped.status = resp.status;
            wrapped.body = errText.slice(0, 500);
            throw wrapped;
        }
        let json;
        try {
            json = await resp.json();
        } catch (_) {
            const wrapped = new Error('Invalid JSON');
            wrapped.code = 'FORMAT';
            throw wrapped;
        }
        const vec = req.parseVector(json);
        if (!Array.isArray(vec) || vec.length === 0) {
            const wrapped = new Error('Missing embedding data');
            wrapped.code = 'FORMAT';
            throw wrapped;
        }
        showToast(t('toast.vectorTestSuccess', { dim: vec.length }), 'success');
    } catch (err) {
        const friendly = _vectorErrorHint(err);
        showToast(t('toast.vectorTestFailed', { error: friendly }), 'error');
        console.error('[Horae] vector API test failed:', err);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = origHtml || '<i class="fa-solid fa-plug-circle-check"></i>'; }
    }
}

/** 拉取 Rerank 模型列表并填充 <select> */
async function fetchRerankModels() {
    const btn = document.getElementById('horae-btn-fetch-rerank-models');
    const sel = document.getElementById('horae-setting-vector-rerank-model');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
    try {
        const rerankUrl = ($('#horae-setting-vector-rerank-url').val() || settings.vectorRerankUrl || '').trim();
        const rerankKey = ($('#horae-setting-vector-rerank-key').val() || settings.vectorRerankKey || '').trim();
        const embedUrl = ($('#horae-setting-vector-api-url').val() || settings.vectorApiUrl || '').trim();
        const embedKey = ($('#horae-setting-vector-api-key').val() || settings.vectorApiKey || '').trim();
        const url = rerankUrl || embedUrl;
        const key = rerankKey || embedKey;
        const models = await _fetchModelList(url, key, 'any');
        if (!models.length) { showToast(t('toast.noModelsFetched'), 'warning'); return; }
        const prev = settings.vectorRerankModel || '';
        _populateModelSelect(sel, models, prev);
        showToast(t('toast.fetchedModels', { n: models.length }), 'success');
    } catch (err) {
        showToast(t('toast.fetchModelsFailed', { error: err.message || err }), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i>'; }
    }
}

/** 从副API拉取模型列表并填充下拉选单 */
async function _fetchSubApiModels() {
    _syncSubApiSettingsFromDom();
    const rawUrl = (settings.autoSummaryApiUrl || '').trim();
    const apiKey = (settings.autoSummaryApiKey || '').trim();
    if (!rawUrl || !apiKey) {
        showToast(t('toast.vectorApiRequired'), 'warning');
        return [];
    }
    const isGemini = /gemini/i.test(rawUrl) || /googleapis|generativelanguage/i.test(rawUrl);
    let testUrl, headers;
    if (isGemini) {
        let base = rawUrl.replace(/\/+$/, '').replace(/\/chat\/completions$/i, '').replace(/\/v\d+(beta\d*|alpha\d*)?(?:\/.*)?$/i, '');
        const isGoogle = /googleapis\.com|generativelanguage/i.test(base);
        testUrl = `${base}/v1beta/models` + (isGoogle ? `?key=${apiKey}` : '');
        headers = { 'Content-Type': 'application/json' };
        if (!isGoogle) headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
        let base = rawUrl.replace(/\/+$/, '').replace(/\/chat\/completions$/i, '');
        if (!base.endsWith('/v1')) base = base.replace(/\/+$/, '') + '/v1';
        testUrl = `${base}/models`;
        headers = { 'Authorization': `Bearer ${apiKey}` };
    }
    const resp = await fetch(testUrl, { method: 'GET', headers, signal: AbortSignal.timeout(15000) });
    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`${resp.status}: ${errText.slice(0, 150)}`);
    }
    const data = await resp.json();
    return isGemini
        ? (data.models || []).map(m => m.name?.replace('models/', '') || m.displayName).filter(Boolean)
        : (data.data || data || []).map(m => m.id || m.name).filter(Boolean);
}

/** 拉取模型列表并填充 <select> */
async function fetchAndPopulateModels() {
    const btn = document.getElementById('horae-btn-fetch-models');
    const sel = document.getElementById('horae-setting-auto-summary-model');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
    try {
        const models = await _fetchSubApiModels();
        if (!models.length) { showToast(t('toast.noModelsFetchedCheck'), 'warning'); return; }
        const prev = settings.autoSummaryModel || '';
        sel.innerHTML = '';
        for (const m of models.sort()) {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            if (m === prev) opt.selected = true;
            sel.appendChild(opt);
        }
        if (prev && !models.includes(prev)) {
            const opt = document.createElement('option');
            opt.value = prev;
            opt.textContent = t('toast.modelManual', { name: prev });
            opt.selected = true;
            sel.prepend(opt);
        }
        if (!prev && models.length) {
            sel.value = models[0];
            settings.autoSummaryModel = models[0];
            saveSettings();
        }
        showToast(t('toast.fetchedModels', { n: models.length }), 'success');
    } catch (err) {
        showToast(t('toast.fetchModelsFailed', { error: err.message || err }), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i>'; }
    }
}

/** 测试副API连接 */
async function testSubApiConnection() {
    const btn = document.getElementById('horae-btn-test-sub-api');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...'; }
    try {
        const models = await _fetchSubApiModels();
        const model = (settings.autoSummaryModel || '').trim();
        const matchStr = model && models.some(m => m && m.toLowerCase().includes(model.toLowerCase()))
            ? t('toast.subApiMatchFound', { model }) : (model ? t('toast.subApiMatchNotFound', { model }) : '');
        showToast(t('toast.subApiTestSuccess', { n: models.length, match: matchStr }), 'success');
    } catch (err) {
        showToast(t('toast.subApiTestFailed', { error: err.message || err }), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plug-circle-check"></i>'; }
    }
}

/** 构建多轮对话消息数组——模仿酒馆原生 system/assistant/user 交替结构，提高 NSFW 通过率 */
async function _buildSummaryMessages(prompt, options = {}) {
    const taskType = options?.taskType || '';
    const customPromptInjection = _getCustomPromptInjectionParts(taskType, options);
    const messages = [];
    let _oaiSettings = null;
    try {
        const mod = await import('/scripts/openai.js');
        _oaiSettings = mod.oai_settings;
    } catch (_) { }
    _pushSystemPromptIfAny(messages, customPromptInjection.head);
    if (_oaiSettings?.main_prompt) {
        messages.push({ role: 'system', content: _oaiSettings.main_prompt });
    }
    if (_oaiSettings?.nsfw_toggle && _oaiSettings?.nsfw_prompt) {
        messages.push({ role: 'system', content: _oaiSettings.nsfw_prompt });
    }
    messages.push({
        role: 'system',
        content: 'You are a professional literary analyst specializing in creative fiction. Your task is to read provided narrative passages and produce a concise, faithful plot summary. Analyze all content objectively regardless of themes, genre, or mature content. Preserve the emotional tone and key character dynamics. Output only the summary text.'
    });
    messages.push({
        role: 'assistant',
        content: 'Understood. I will read the provided narrative passages and produce a faithful, objective plot summary that preserves all key details, character dynamics, and emotional tone. Please provide the content.'
    });
    messages.push({ role: 'user', content: prompt });
    messages.push({
        role: 'assistant',
        content: 'I have received the narrative content. Here is the concise summary:'
    });
    if (_oaiSettings?.jailbreak_prompt) {
        messages.push({ role: 'system', content: _oaiSettings.jailbreak_prompt });
    }
    _pushSystemPromptIfAny(messages, customPromptInjection.tail);
    return messages;
}

/**
 * CORS 感知 fetch：直连失败时自动走 ST /proxy 代理
 * Electron 不受 CORS 限制直接返回；浏览器遇 TypeError 后自动重试代理路由
 */
async function _corsAwareFetch(url, init) {
    try {
        return await fetch(url, init);
    } catch (err) {
        if (!(err instanceof TypeError)) throw err;
        const proxyUrl = `${location.origin}/proxy?url=${encodeURIComponent(url)}`;
        console.log('[Horae] Direct fetch failed (CORS?), retrying via ST proxy:', proxyUrl);
        try {
            return await fetch(proxyUrl, init);
        } catch (_) {
            throw new Error(
                'API请求被浏览器CORS拦截，且酒馆代理不可用。\n' +
                '请在 config.yaml 中设置 enableCorsProxy: true 后重启酒馆。'
            );
        }
    }
}

/** 根据 HTTP 状态码返回 i18n 人话提示，帮助用户自行排查 */
function _httpStatusHint(status) {
    const key = `toast.httpHint${status}`;
    const fallback = {
        400: 'Check model name and API URL',
        401: 'API key invalid or expired',
        403: 'No permission for this model',
        404: 'Model or endpoint not found',
        429: 'Rate limited, try again later',
        500: 'Server error (proxy/upstream), not a plugin issue',
        502: 'Gateway error, proxy may be temporarily down',
        503: 'Service temporarily unavailable',
    };
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return fallback[status] || '';
}

/**
 * 向量 API 错误友好提示：根据 err.status 或 err.code 给出 i18n 人话
 * - status 数字 → 走 toast.vectorHint{status}
 * - code: NETWORK/TIMEOUT/FORMAT/UNKNOWN → 走 toast.vectorHint{Code}
 * 优先级：status > code > 原始 message
 */
function _vectorErrorHint(err) {
    if (!err) return '';
    if (err.status) {
        const key = `toast.vectorHint${err.status}`;
        const translated = t(key);
        if (translated && translated !== key) return translated;
        const generic = _httpStatusHint(err.status);
        if (generic) return generic;
        return `HTTP ${err.status}${err.body ? `: ${err.body.slice(0, 120)}` : ''}`;
    }
    if (err.code) {
        const codeKey = `toast.vectorHint${err.code.charAt(0).toUpperCase()}${err.code.slice(1).toLowerCase()}`;
        const translated = t(codeKey);
        if (translated && translated !== codeKey) return translated;
    }
    return err.message || String(err);
}

/** 直接请求API端点，完全独立于酒馆主连接，支持真并行 */
async function generateWithDirectApi(prompt, options = {}) {
    const taskType = options?.taskType || '';
    const messageIndex = Number.isInteger(options?.messageIndex) ? options.messageIndex : null;
    const shouldStream = _shouldStreamSummaryTasks();
    console.log(taskType, "taskType");
    const skipSnapshotTimelineInjection = taskType === 'autoSummary';
    const _model = settings.autoSummaryModel.trim();
    const _apiKey = settings.autoSummaryApiKey.trim();
    if (/gemini/i.test(_model)) {
        // return await _geminiNativeRequest(prompt, settings.autoSummaryApiUrl.trim(), _model, _apiKey);
    }
    let url = settings.autoSummaryApiUrl.trim();
    if (!url.endsWith('/chat/completions')) {
        // url = url.replace(/\/+$/, '') + '/chat/completions';
        url = url.replace(/\/+$/, '');
    }
    const customPromptInjection = _getCustomPromptInjectionParts(taskType, options);
    const messages = await _buildSummaryMessages(prompt, { taskType, ...options });
    const body = {
        model: settings.autoSummaryModel.trim(),
        messages,
        temperature: 0.7,
        max_tokens: 8192,
        stream: shouldStream
    };
    // 仅当端点疑似 Gemini 系渠道时才注入 safetySettings（纯 OpenAI 端点会拒绝未知字段返回 400）
    if (/gemini|google|generativelanguage/i.test(url) || /gemini/i.test(body.model)) {
        const blockNone = [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
        ];
        body.safety_settings = blockNone;
        body.safetySettings = blockNone;
    }
    console.log(`[Horae] 独立API请求: ${url}, 模型: ${body.model}`);

    // 酒馆助手部分
    const orderedPrompts = [];
    // const orderedPrompts = [
    //     "world_info_before",
    //     "char_description",
    //     "scenario",
    //     "world_info_after",
    //     "chat_history",
    //     "user_input",
    // ]
    const skipInjectionMarkers = [
        _createNoContextInjectionMarker(),
        _createNoTimelineInjectionMarker(),
        _createNoVectorRecallMarker(),
        _createNoSystemPromptInjectionMarker(),
    ].join('\n');
    // generateRaw 的 user_input 在 prompt-ready 阶段不一定落到 eventData.chat[].content，
    // 所以把 marker 明确作为 system prompt 放进 ordered_prompts，确保 onPromptReady 能识别并短路。
    orderedPrompts.push({ role: 'system', content: skipInjectionMarkers });
    _pushSystemPromptIfAny(orderedPrompts, customPromptInjection.head);
    // orderedPrompts.push('user_input');
    if (!skipSnapshotTimelineInjection) {
        console.log(`分析的楼层号:${messageIndex}`);
        const promptSplit = _buildPromptSplitBeforeMessage(messageIndex);
        const snapshotPrompt = _getSnapshotPromptBeforeMessage(messageIndex, promptSplit);
        const timelinePrompt = _getTimelinePromptBeforeMessage(messageIndex, promptSplit);

        if (timelinePrompt?.trim()) orderedPrompts.push({ role: 'system', content: timelinePrompt.trim() });
        if (snapshotPrompt?.trim()) orderedPrompts.push({ role: 'system', content: snapshotPrompt.trim() });
    } else {
        console.log('[Horae] autoSummary task: skip snapshot/timeline ordered_prompts injection (direct API)');
    }

    orderedPrompts.push('user_input');

    // 摘要才注入思维链
    if (taskType === "brief") {
        orderedPrompts.push({
            role: 'system', content: `【格式字面性声明】
<horae> 内每一行的结构是：字段名 + 英文冒号 + 值。
- 字段名（time、location、characters、costume、item、item!、item!!、item-、
  affection、npc、hold、hold-、event）必须原样英文输出，不得翻译为中文。
- 字段名与值之间的分隔符固定为英文冒号 :，不得替换为中文冒号 ：、竖线 |、
  等号 =、方括号包裹或其他任何形式。
- 值的内部分隔符（| = @ ~）按各字段原定义使用，不在本条限制内。

正确：
  time:1988/1/1 10:11
  hold:计划|1988/1/1 21:00|明早九点起床后去逛街(1988/1/2 09:00)
  hold:悬念|1988/1/1 23:00|黑袍人警告"三日后再见"，来历不明
  hold-:明早九点起床后去逛街(1988/1/2 09:00)
  hold-:黑袍人警告"三日后再见"，来历不明
  event:关键|U在酒馆向艾伦打听黑市商人下落，递出10金币后得知商人明晚在废弃码头出现。

错误：
  [时间|1988/1/1 10:11]
  time：1988/1/1 10:11
  [time] 1988/1/1 10:11
  event|关键|...（字段名后用了竖线而不是冒号）
  hold:威胁|...（类型只有"计划"和"悬念"，不存在其他类型名）
  hold-:计划|1988/1/1|黑袍人警告...（hold- 只能填写待核销正文，不带类型和订立日期）

【输出前思考】
在输出 <horae> 之前，先在 <thinking> 标签内完成分析，覆盖以下判断点（顺序和措辞自由）：

1. 本楼核心事件
   - 时间、地点、在场角色相比参考状态有无变化？
   - 用一两句话概括这一楼发生了什么。

2. 物品清点（对照参考状态逐一核对）
   - 本楼有无角色主动获取/消耗/丢弃符合记录标准的物品？
   - 参考状态里的物品是否被用完/损坏？需要时准备 item-。
   - 排除：临时日用品、环境道具、服装、普通食物。
   - 无变动则明确说"无物品变动"。

3. 悬念簿清算（分两步，先计划后悬念）

   【第一步：计划型清算】
   - 列出参考状态悬念簿里所有"计划"条目。
   - 逐条判断：当前时间是否已越过其截止时间？是否被执行/取消？
   - 需核销的，只把待核销条目的正文部分逐字抄下来准备 hold-。
   - 新产生的计划，检查是否与现存条目重复或需要合并。

   【第二步：悬念型清算】
   - 列出参考状态悬念簿里所有"悬念"条目。
   - 逐条判断：本楼文本中，该悬念是否已被解决、揭露、推翻、或彻底不可能再发生？
   - 🔴 只有"已经发生了"才能核销。"觉得该发生了""悬太久了"不是核销理由。
   - 不确定 → 明确写"保留，不动"。
   - 如果某条悬念有了新进展但未完全解决 → 准备 hold- 旧条目 + hold 更新后的条目。

   【第三步：新增检查】
   - 本楼是否出现了新的计划/承诺/约定？→ 考虑 hold:计划
   - 本楼是否出现了以下任一情况？→ 考虑 hold:悬念
     • 外部威胁/警告/倒计时
     • 未解之谜/异常线索/可疑现象
     • 某角色知道了什么但没说破（信息不对称）
     • 他人对{{user}}的承诺/{{user}}对他人的亏欠
     • 伏笔/预兆/不祥之兆
   - 新条目是否与现存条目重复？重复则不写。

4. NPC 与好感度
   - 有无新角色首次登场？
   - 现有 NPC 的关系/好感度是否被明文推动？（无明文描写不动）

5. event 融合判断
   - 本楼有几个值得记录的事件片段？若多于一个，现在就决定如何串联成一条。
   - 确认 event 写入 <horaeevent>，不会出现在 <horae> 内。

6. event 收笔位置确认
   - 【待分析文本】在哪个动作/对话处停止？我用一句自己的话概括最后发生了什么。
   - 我准备写的 event 最后一句，是否超出了原文最后一句的范围？
   - 若超出，裁掉多余部分。

7. 格式自检
   - 所有必填字段（time/location/characters/costume）是否齐全？
   - hold- 的文本是否逐字复制而非改写？
   - event 是否控制在 80-150 字、监控视角、无文学修饰？

思考结束后直接输出 <horae> 和 <horaeevent>，不要在两者之间插入任何解释。
` });

        orderedPrompts.push({
            role: 'assistant', content: `<thinking>
收到，我按检查点梳理，然后严格按 "英文字段名:值" 的字面语法输出。
字段名不翻译、字段名后只用英文冒号，值内部的 | = @ ~ 保持原定义。
event 唯一且只放在 <horaeevent> 内。

1. 本楼核心事件：` });
    }

    _pushSystemPromptIfAny(orderedPrompts, customPromptInjection.tail);

    // console.log(`副API组装提示词:\n${JSON.stringify(orderedPrompts)}`);

    const guardedUserInput = String(prompt ?? '');
    try {
        const resp = await TavernHelper.generateRaw({
            user_input: guardedUserInput,
            custom_api: {
                apiurl: url,        // 你的接口地址 仅v1结尾,不能带后缀
                key: _apiKey,       // 你的 API Key
                model: _model,      // 模型名
                source: "openai",   // 根据你的接口类型选择
            },
            ordered_prompts: orderedPrompts,
            should_stream: shouldStream,
            // overrides: {
            //     chat_history: {
            //         with_depth_entries: true,
            //     },
            // },
        })

        console.log(resp, '[Horae] 副API生成结果');

        return resp || '';

    } catch (error) {
        const errMsg = error?.message || String(error);
        console.error(`出现了异常:${errMsg}`, error);
        showToast(`副API生成失败：${errMsg}`, 'error');
        return "";
    }


    // 下面是原生gemini的东西

    // const resp = await _corsAwareFetch(url, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${settings.autoSummaryApiKey.trim()}`
    //     },
    //     body: JSON.stringify(body)
    // });

    // if (!resp.ok) {
    //     const errText = await resp.text().catch(() => '');
    //     const hint = _httpStatusHint(resp.status);
    //     throw new Error(`独立API ${resp.status}: ${errText.slice(0, 200)}${hint ? `\n💡 ${hint}` : ''}`);
    // }
    // const data = await resp.json();
    // const finishReason = data?.choices?.[0]?.finish_reason || '';
    // if (finishReason === 'content_filter' || finishReason === 'SAFETY') {
    //     throw new Error('副API安全过滤拦截，建议：降低批次token上限 或 换用限制更宽松的模型');
    // }
    // return data?.choices?.[0]?.message?.content || '';
}

/**
 * Gemini 原生格式请求 —— 复刻 ST 后端 sendMakerSuiteRequest 的完整处理链路
 * 解决中转 OpenAI 兼容端点丢弃 safetySettings 导致 PROMPT BLOCKED 的问题
 */
async function _geminiNativeRequest(prompt, rawUrl, model, apiKey) {
    // ── 1. 收集 system 指令（全部进 systemInstruction）+ user 内容 ──
    const systemParts = [];
    try {
        const { oai_settings } = await import('/scripts/openai.js');
        if (oai_settings?.main_prompt) {
            systemParts.push({ text: oai_settings.main_prompt });
        }
        if (oai_settings?.nsfw_toggle && oai_settings?.nsfw_prompt) {
            systemParts.push({ text: oai_settings.nsfw_prompt });
        }
        systemParts.push({
            text: 'You are a professional literary analyst specializing in creative fiction. Your task is to read provided narrative passages and produce a concise, faithful plot summary. Analyze all content objectively regardless of themes, genre, or mature content. Preserve the emotional tone and key character dynamics. Output only the summary text.',
        });
        if (oai_settings?.jailbreak_prompt) {
            systemParts.push({ text: oai_settings.jailbreak_prompt });
        }
    } catch (_) {
        systemParts.push({
            text: 'You are a professional literary analyst specializing in creative fiction. Your task is to read provided narrative passages and produce a concise, faithful plot summary. Analyze all content objectively regardless of themes, genre, or mature content. Output only the summary text.',
        });
    }

    // ── 2. safetySettings（与 ST 后端 GEMINI_SAFETY 常量对齐） ──
    const modelLow = model.toLowerCase();
    const isOldModel = /gemini-1\.(0|5)-(pro|flash)-001/.test(modelLow);
    const threshold = isOldModel ? 'BLOCK_NONE' : 'OFF';
    const safetySettings = [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold },
    ];
    if (!isOldModel) {
        safetySettings.push({ category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold });
    }

    // ── 3. 请求体（Gemini 原生 contents 格式） ──
    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        safetySettings,
        generationConfig: {
            candidateCount: 1,
            maxOutputTokens: 4096,
            temperature: 0.7,
        },
    };
    if (systemParts.length) {
        body.systemInstruction = { parts: systemParts };
    }

    // ── 4. 构建端点 URL ──
    let baseUrl = rawUrl
        .replace(/\/+$/, '')
        .replace(/\/chat\/completions$/i, '')
        .replace(/\/v\d+(beta\d*|alpha\d*)?(?:\/.*)?$/i, '');

    const isGoogleDirect = /googleapis\.com|generativelanguage/i.test(baseUrl);
    const endpointUrl = `${baseUrl}/v1beta/models/${model}:generateContent`
        + (isGoogleDirect ? `?key=${apiKey}` : '');

    const headers = { 'Content-Type': 'application/json' };
    if (!isGoogleDirect) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    console.log(`[Horae] Gemini原生API: ${endpointUrl}, threshold: ${threshold}`);

    // ── 5. 发送请求 + 解析原生响应 ──
    const resp = await _corsAwareFetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        const hint = _httpStatusHint(resp.status);
        throw new Error(`Gemini原生API ${resp.status}: ${errText.slice(0, 200)}${hint ? `\n💡 ${hint}` : ''}`);
    }

    const data = await resp.json();

    if (data?.promptFeedback?.blockReason) {
        throw new Error(`Gemini输入安全拦截: ${data.promptFeedback.blockReason}`);
    }

    const candidates = data?.candidates;
    if (!candidates?.length) {
        throw new Error('Gemini API未返回候选内容');
    }

    if (candidates[0]?.finishReason === 'SAFETY') {
        throw new Error('Gemini输出安全拦截，建议换用限制更宽松的模型');
    }

    const text = candidates[0]?.content?.parts
        ?.filter(p => !p.thought)
        ?.map(p => p.text)
        ?.join('\n\n') || '';

    if (!text) {
        throw new Error(`Gemini返回空内容 (finishReason: ${candidates[0]?.finishReason || '?'})`);
    }

    return text;
}

function _collectTailContinuousAutoSummaryEvents(chat, cutoff, summarizedIndices, manualSummaryMsgIndices) {
    if (!Array.isArray(chat) || cutoff <= 0) return [];

    const stream = [];
    for (let i = 0; i < cutoff; i++) {
        const msg = chat[i];
        if (!msg) continue;
        const meta = msg.horae_meta;
        if (!meta || meta._skipHorae) continue;
        if (meta.event && !meta.events) {
            meta.events = [meta.event];
            delete meta.event;
        }
        if (!Array.isArray(meta.events)) continue;
        for (let evtIdx = 0; evtIdx < meta.events.length; evtIdx++) {
            const evt = meta.events[evtIdx];
            if (!evt?.summary) continue;
            stream.push({ msgIdx: i, evtIdx, event: evt, meta, msg });
        }
    }
    if (!stream.length) return [];

    const pickedReverse = [];
    let started = false;
    for (let p = stream.length - 1; p >= 0; p--) {
        const item = stream[p];
        const evt = item.event;
        const msgIdx = item.msgIdx;

        const msgBlocked = summarizedIndices.has(msgIdx)
            || manualSummaryMsgIndices.has(msgIdx)
            || !!item.meta?._skipHorae;
        const evtBlocked = !!evt?._carryoverSeed
            || !!evt?.isSummary
            || !!evt?._summaryId
            || !!evt?._compressedBy;
        const isUncompressedTimeline = !!evt?.summary && !msgBlocked && !evtBlocked;

        if (!started) {
            if (!isUncompressedTimeline) break;
            started = true;
            pickedReverse.push(item);
            continue;
        }

        if (!isUncompressedTimeline) break;
        pickedReverse.push(item);
    }

    if (!pickedReverse.length) return [];
    return pickedReverse.reverse().map(item => ({
        msgIdx: item.msgIdx,
        evtIdx: item.evtIdx,
        date: item.meta?.timestamp?.story_date || '?',
        time: item.meta?.timestamp?.story_time || '',
        level: item.event?.level || '一般',
        summary: item.event?.summary || ''
    }));
}

function _isTrackableAiMessage(msg) {
    if (!msg || msg.is_user) return false;
    if (msg.horae_meta?._skipHorae) return false;
    return true;
}

function _resolveAutoSummaryKeepWindow(chat, keepRecent, options = {}) {
    const chatLength = Array.isArray(chat) ? chat.length : 0;
    const endExclusive = Math.max(0, Math.min(
        Number.isInteger(options?.endExclusive) ? options.endExclusive : chatLength,
        chatLength
    ));
    if (!Array.isArray(chat) || endExclusive <= 1) {
        return { keepStart: 0, totalAi: 0, keepAiIndices: [], allAiIndices: [] };
    }

    const allAiIndices = [];
    for (let i = 0; i < endExclusive; i++) {
        if (_isTrackableAiMessage(chat[i])) allAiIndices.push(i);
    }

    const keepCount = Math.max(0, parseInt(keepRecent, 10) || 0);
    if (allAiIndices.length === 0) {
        return { keepStart: 0, totalAi: 0, keepAiIndices: [], allAiIndices: [] };
    }
    if (keepCount <= 0) {
        return {
            keepStart: endExclusive,
            totalAi: allAiIndices.length,
            keepAiIndices: [],
            allAiIndices
        };
    }
    if (allAiIndices.length <= keepCount) {
        return {
            keepStart: 0,
            totalAi: allAiIndices.length,
            keepAiIndices: [...allAiIndices],
            allAiIndices
        };
    }

    const keepAiIndices = allAiIndices.slice(-keepCount);
    return {
        keepStart: keepAiIndices[0],
        totalAi: allAiIndices.length,
        keepAiIndices,
        allAiIndices
    };
}

function _collectActiveSummaryCoveredIndices(chat) {
    const covered = new Set();
    const sums = chat?.[0]?.horae_meta?.autoSummaries || [];
    for (const s of sums) {
        if (!s?.id || s.active === false) continue;
        for (const idx of getSummaryMsgIndices(s)) {
            if (Number.isInteger(idx) && idx >= 0) covered.add(idx);
        }
    }
    return covered;
}

/**
 * 纯判断：按「保留最近AI条数」计算自动显隐计划（不执行显隐）。
 * 返回：
 * - targetHideIndices：按当前配额应处于自动隐藏的楼层
 * - toHide：当前应新增隐藏的楼层
 * - toShow：当前应取消隐藏的楼层
 */
function _planAutoBufferVisibilityByKeepRecent(chat, keepRecent, activeSummaryCoveredIndices = null, options = {}) {
    const chatLength = Array.isArray(chat) ? chat.length : 0;
    const endExclusive = Math.max(0, Math.min(
        Number.isInteger(options?.endExclusive) ? options.endExclusive : chatLength,
        chatLength
    ));
    if (!Array.isArray(chat) || endExclusive <= 1) {
        return {
            keepStart: 0,
            keepAiIndices: [],
            allAiIndices: [],
            markedAutoHiddenIndices: [],
            targetHideIndices: [],
            toHide: [],
            toShow: [],
        };
    }

    const keepWindow = _resolveAutoSummaryKeepWindow(chat, keepRecent, { endExclusive });
    const keepStart = Math.max(0, Math.min(keepWindow.keepStart, endExclusive));
    const coveredSet = activeSummaryCoveredIndices instanceof Set
        ? new Set([...activeSummaryCoveredIndices].filter(i => Number.isInteger(i) && i >= 0 && i < endExclusive))
        : new Set([..._collectActiveSummaryCoveredIndices(chat)].filter(i => i < endExclusive));

    // 旧楼层自动隐藏策略：从第一条“应隐藏的AI楼层”开始，到 keepStart 前一层，连续作为隐藏候选。
    let firstHideAnchor = -1;
    for (const aiIdx of keepWindow.allAiIndices) {
        if (aiIdx >= keepStart) break;
        if (coveredSet.has(aiIdx)) continue;
        firstHideAnchor = aiIdx;
        break;
    }

    const targetHideSet = new Set();
    if (firstHideAnchor >= 0) {
        for (let i = firstHideAnchor; i < keepStart; i++) {
            const msg = chat[i];
            if (!msg) continue;
            if (msg.horae_meta?._skipHorae) continue;
            if (coveredSet.has(i)) continue;
            targetHideSet.add(i);
        }
    }

    const markedSet = new Set();
    for (let i = 0; i < endExclusive; i++) {
        if (chat[i]?.horae_meta?._autoBufferHidden) markedSet.add(i);
    }

    const toHide = [];
    for (const idx of targetHideSet) {
        if (!chat[idx]) continue;
        if (coveredSet.has(idx)) continue;
        if (!chat[idx].is_hidden) toHide.push(idx);
    }

    const toShow = [];
    for (const idx of markedSet) {
        if (targetHideSet.has(idx)) continue;
        if (!chat[idx]) continue;
        if (coveredSet.has(idx)) continue;
        toShow.push(idx);
    }

    return {
        keepStart,
        keepAiIndices: [...keepWindow.keepAiIndices],
        allAiIndices: [...keepWindow.allAiIndices],
        markedAutoHiddenIndices: [...markedSet].sort((a, b) => a - b),
        targetHideIndices: [...targetHideSet].sort((a, b) => a - b),
        toHide: toHide.sort((a, b) => a - b),
        toShow: toShow.sort((a, b) => a - b),
    };
}

function _buildPromptVisibilityContext(chat, skipLast = 0) {
    const effectiveHiddenSet = new Set();
    const ignoredBoundaryAiIndices = new Set();
    if (!Array.isArray(chat) || chat.length === 0) {
        return { effectiveHiddenSet, ignoredBoundaryAiIndices };
    }

    const endExclusive = Math.max(0, chat.length - Math.max(0, skipLast));
    for (let i = 0; i < endExclusive; i++) {
        if (chat[i]?.is_hidden) effectiveHiddenSet.add(i);
    }

    if (!settings.enabled || !settings.autoSummaryEnabled || !settings.sendTimeline) {
        return { effectiveHiddenSet, ignoredBoundaryAiIndices };
    }

    const keepRecent = Math.max(0, parseInt(settings.autoSummaryKeepRecent, 10) || 10);
    const promptKeepRecent = Math.max(0, keepRecent - 1);
    const activeCovered = _collectActiveSummaryCoveredIndices(chat);
    const realKeepWindow = _resolveAutoSummaryKeepWindow(chat, keepRecent, { endExclusive });
    const promptKeepWindow = _resolveAutoSummaryKeepWindow(chat, promptKeepRecent, { endExclusive });
    const promptKeepSet = new Set(promptKeepWindow.keepAiIndices || []);
    for (const idx of realKeepWindow.keepAiIndices || []) {
        if (!promptKeepSet.has(idx)) ignoredBoundaryAiIndices.add(idx);
    }

    const plan = _planAutoBufferVisibilityByKeepRecent(chat, promptKeepRecent, activeCovered, { endExclusive });

    for (const idx of plan.markedAutoHiddenIndices || []) {
        effectiveHiddenSet.delete(idx);
    }
    for (const idx of plan.targetHideIndices || []) {
        effectiveHiddenSet.add(idx);
    }

    return {
        effectiveHiddenSet,
        ignoredBoundaryAiIndices,
        keepRecent,
        promptKeepRecent,
    };
}

function _buildAutoSummaryBufferHideIndices(chat, keepStart, tailAiIndices, activeSummaryCoveredIndices) {
    if (!Array.isArray(chat) || chat.length <= 1) return [];
    if (!Array.isArray(tailAiIndices) || tailAiIndices.length === 0) return [];

    const start = Math.max(0, Math.min(...tailAiIndices));
    const end = Math.min(Math.max(0, keepStart) - 1, chat.length - 1);
    if (end < start) return [];

    const result = [];
    for (let i = start; i <= end; i++) {
        const msg = chat[i];
        if (!msg) continue;
        if (msg.horae_meta?._skipHorae) continue;
        if (activeSummaryCoveredIndices?.has(i)) continue;
        result.push(i);
    }
    return result;
}

async function _syncAutoSummaryBufferHidden(chat, targetHideIndices, activeSummaryCoveredIndices) {
    if (!Array.isArray(chat) || chat.length <= 1) return;

    const targetSet = new Set(
        (targetHideIndices || []).filter(i => Number.isInteger(i) && i >= 0 && i < chat.length && !!chat[i])
    );

    const markedSet = new Set();
    for (let i = 0; i < chat.length; i++) {
        if (chat[i]?.horae_meta?._autoBufferHidden) markedSet.add(i);
    }

    const toHide = [];
    for (const idx of targetSet) {
        if (!chat[idx].horae_meta) chat[idx].horae_meta = createEmptyMeta();
        chat[idx].horae_meta._autoBufferHidden = true;
        if (!chat[idx].is_hidden && !activeSummaryCoveredIndices?.has(idx)) {
            toHide.push(idx);
        }
    }

    const toUnhide = [];
    for (const idx of markedSet) {
        if (targetSet.has(idx)) continue;
        const msg = chat[idx];
        if (!msg?.horae_meta) continue;
        delete msg.horae_meta._autoBufferHidden;
        if (!activeSummaryCoveredIndices?.has(idx)) {
            toUnhide.push(idx);
        }
    }

    if (toUnhide.length > 0) await setMessagesHidden(chat, toUnhide, false);
    if (toHide.length > 0) await setMessagesHidden(chat, toHide, true);
}

/**
 * 一键执行自动显隐配额维护：
 * 按 keepRecent 计算后，自动完成隐藏/取消隐藏。
 * 调用方无需处理返回值或二次判断。
 */
async function _reconcileAutoBufferVisibilityByKeepRecent(chat, keepRecent, activeSummaryCoveredIndices = null) {
    if (!Array.isArray(chat) || chat.length <= 1) return;
    const coveredSet = activeSummaryCoveredIndices instanceof Set
        ? new Set([...activeSummaryCoveredIndices].filter(i => Number.isInteger(i) && i >= 0 && i < chat.length))
        : _collectActiveSummaryCoveredIndices(chat);
    const plan = _planAutoBufferVisibilityByKeepRecent(chat, keepRecent, coveredSet);
    await _syncAutoSummaryBufferHidden(chat, plan.targetHideIndices, coveredSet);
}

function _pickAutoSummaryBatchEvents(chat, eventCandidates, maxEvents, maxTokens) {
    const selected = [];
    const msgSet = new Set();
    let tokenCount = 0;

    for (const e of eventCandidates || []) {
        if (!Number.isInteger(e?.msgIdx) || !chat?.[e.msgIdx]) continue;
        const addTok = msgSet.has(e.msgIdx) ? 0 : estimateTokens(chat[e.msgIdx]?.mes || '');
        if (selected.length > 0 && (selected.length >= maxEvents || tokenCount + addTok > maxTokens)) break;
        selected.push(e);
        if (!msgSet.has(e.msgIdx)) {
            msgSet.add(e.msgIdx);
            tokenCount += addTok;
        }
    }

    return {
        events: selected,
        msgIndices: [...msgSet].sort((a, b) => a - b),
        tokenCount,
        remainingEvents: Math.max(0, (eventCandidates?.length || 0) - selected.length),
    };
}

/** 自动摘要：检查是否需要触发 */
async function checkAutoSummary() {
    if (!settings.enabled || !settings.autoSummaryEnabled || !settings.sendTimeline) return;
    if (_summaryInProgress) return;
    _summaryInProgress = true;

    try {
        const chat = horaeManager.getChat();
        if (!chat?.length) return;

        const keepRecent = Math.max(0, parseInt(settings.autoSummaryKeepRecent, 10) || 10);
        const bufferMode = settings.autoSummaryBufferMode || 'messages';
        const bufferLimit = _getAutoSummaryActiveBufferLimit();

        const keepWindow = _resolveAutoSummaryKeepWindow(chat, keepRecent);
        const cutoff = Math.max(0, Math.min(keepWindow.keepStart, chat.length));

        // 独立检查：当同层摘要达到阈值时，自动进行更高层级再总结（可级联）
        await _runAutoResummaryIfNeeded(chat, cutoff);

        // 收集已被摘要覆盖的消息索引（含展开状态，避免重复摘要）
        // 优先用 coveredIndices（实际压缩集合），旧 entry 才回退到 range 全展开
        const summarizedIndices = new Set();
        const existingSums = chat[0]?.horae_meta?.autoSummaries || [];
        for (const s of existingSums) {
            if (Array.isArray(s.coveredIndices) && s.coveredIndices.length) {
                for (const r of s.coveredIndices) summarizedIndices.add(r);
            } else if (s.range) {
                for (let r = s.range[0]; r <= s.range[1]; r++) summarizedIndices.add(r);
            }
        }

        // 兜底：扫描所有消息，找出含有手动插入摘要(isSummary)事件的消息索引
        const manualSummaryMsgIndices = new Set();
        for (let i = 0; i < cutoff; i++) {
            const meta = chat[i]?.horae_meta;
            const evts = meta?.events || (meta?.event ? [meta.event] : null);
            if (!evts?.length) continue;
            if (evts.some(e => e?._carryoverSeed)) {
                manualSummaryMsgIndices.add(i);
                continue;
            }
            if (evts.some(e => e.isSummary && !e._compressedBy)) {
                manualSummaryMsgIndices.add(i);
            }
        }

        // 首次摘要仅针对「尾部连续未压缩时间线段」：从末尾向前，遇到已摘要边界即停止
        const tailEventCandidates = _collectTailContinuousAutoSummaryEvents(
            chat,
            cutoff,
            summarizedIndices,
            manualSummaryMsgIndices
        );
        const tailMsgIndices = [...new Set(tailEventCandidates.map(e => e.msgIdx))].sort((a, b) => a - b);
        const tailAiIndices = tailMsgIndices.filter(i => _isTrackableAiMessage(chat[i]));
        const tailAiCount = tailAiIndices.length;
        const activeSummaryCoveredIndices = _collectActiveSummaryCoveredIndices(chat);
        const targetHideIndices = _buildAutoSummaryBufferHideIndices(
            chat,
            keepWindow.keepStart,
            tailAiIndices,
            activeSummaryCoveredIndices
        );
        await _syncAutoSummaryBufferHidden(chat, targetHideIndices, activeSummaryCoveredIndices);

        let bufferTokens = 0;
        if (bufferMode === 'tokens') {
            for (const i of targetHideIndices) {
                bufferTokens += estimateTokens(chat[i]?.mes || '');
            }
        }

        let shouldTrigger = false;
        if (bufferMode === 'tokens') {
            shouldTrigger = bufferTokens > bufferLimit;
        } else {
            shouldTrigger = tailAiCount >= bufferLimit;
        }

        const tailFloorList = [...tailMsgIndices];
        const tailFloorHint = tailFloorList.length ? tailFloorList.map(i => `#${i}`).join(', ') : 'none';
        const aiFloorHint = (keepWindow.allAiIndices || []).length
            ? keepWindow.allAiIndices.map(i => `#${i}`).join(', ')
            : 'none';
        console.log(`[Horae] 自动摘要检查：keepAI=${keepRecent}, totalAI=${keepWindow.totalAi}, keepStart=#${keepWindow.keepStart}, cutoff=${cutoff}, AI楼层=[${aiFloorHint}], 尾部连续未压缩AI=${tailAiCount}, 事件=${tailEventCandidates.length}(${bufferMode === 'tokens' ? bufferTokens + 'tok' : tailAiCount + '条AI'})，楼层=[${tailFloorHint}]，阈值${bufferLimit}，${shouldTrigger ? '触发' : '未达阈值'}`);

        if (!shouldTrigger || tailEventCandidates.length === 0 || tailAiCount === 0) return;

        let bufferEvents = [];
        let batchIndices = [];
        let selectedAiIndices = [];

        if (bufferMode === 'messages') {
            // messages模式：每次严格固定为“阈值条AI消息”，不受批量上限二次裁剪
            selectedAiIndices = [...tailAiIndices].slice(0, bufferLimit);
            if (!selectedAiIndices.length) return;

            const batchStart = selectedAiIndices[0];
            const batchEnd = selectedAiIndices[selectedAiIndices.length - 1];
            const expanded = [];
            for (let i = batchStart; i <= batchEnd; i++) {
                if (i < 0 || i >= cutoff || !chat[i]) continue;
                if (chat[i]?.horae_meta?._skipHorae) continue;
                if (activeSummaryCoveredIndices.has(i)) continue;
                expanded.push(i);
            }
            batchIndices = expanded;
            if (!batchIndices.length) return;

            const batchSet = new Set(batchIndices);
            bufferEvents = tailEventCandidates.filter(e => batchSet.has(e.msgIdx));
            if (!bufferEvents.length) return;
        } else {
            // tokens模式：沿用批量上限，避免单次输入过大
            const MAX_BATCH_EVENTS = settings.autoSummaryBatchMaxMsgs || 50;
            const MAX_BATCH_TOKENS = settings.autoSummaryBatchMaxTokens || 80000;
            const {
                events: pickedEvents,
                msgIndices: batchEventIndices
            } = _pickAutoSummaryBatchEvents(chat, tailEventCandidates, MAX_BATCH_EVENTS, MAX_BATCH_TOKENS);
            if (!pickedEvents.length || !batchEventIndices.length) return;

            const batchEventMsgIndices = [...batchEventIndices].sort((a, b) => a - b);
            batchIndices = [...batchEventMsgIndices];
            if (batchEventMsgIndices.length > 0) {
                const batchStart = batchEventMsgIndices[0];
                const batchEnd = batchEventMsgIndices[batchEventMsgIndices.length - 1];
                const expanded = [];
                for (let i = batchStart; i <= batchEnd; i++) {
                    if (i < 0 || i >= cutoff || !chat[i]) continue;
                    if (chat[i]?.horae_meta?._skipHorae) continue;
                    if (activeSummaryCoveredIndices.has(i)) continue;
                    expanded.push(i);
                }
                if (expanded.length > 0) batchIndices = expanded;
            }
            if (!batchIndices.length) return;
            bufferEvents = pickedEvents;
            selectedAiIndices = [...new Set(bufferEvents.map(e => e.msgIdx).filter(i => _isTrackableAiMessage(chat[i])))].sort((a, b) => a - b);
        }

        // 检测缓冲区消息的时间线/时间戳缺失情况
        const _missingTimestamp = [];
        const _missingEvents = [];
        for (const i of batchIndices) {
            if (chat[i]?.is_user) continue;
            const meta = chat[i]?.horae_meta;
            if (!meta?.timestamp?.story_date) _missingTimestamp.push(i);
            const hasEvt = bufferEvents.some(e => e.msgIdx === i);
            if (!hasEvt && !meta?.event?.summary) _missingEvents.push(i);
        }
        if (bufferEvents.length === 0 && _missingTimestamp.length === batchIndices.length) {
            showToast(t('toast.autoSummaryNoData'), 'warning');
            return;
        }
        if (_missingTimestamp.length > 0 || _missingEvents.length > 0) {
            const parts = [];
            if (_missingTimestamp.length > 0) {
                const floors = _missingTimestamp.length <= 8
                    ? _missingTimestamp.map(i => `#${i}`).join(', ')
                    : _missingTimestamp.slice(0, 6).map(i => `#${i}`).join(', ') + t('ui.floorsSuffix', { n: _missingTimestamp.length });
                parts.push(t('ui.missingTimestamp', { floors }));
            }
            if (_missingEvents.length > 0) {
                const floors = _missingEvents.length <= 8
                    ? _missingEvents.map(i => `#${i}`).join(', ')
                    : _missingEvents.slice(0, 6).map(i => `#${i}`).join(', ') + t('ui.floorsSuffix', { n: _missingEvents.length });
                parts.push(t('ui.missingTimeline', { floors }));
            }
            console.warn(`[Horae] 自动摘要数据缺失: ${parts.join(' | ')}`);
            if (_missingTimestamp.length > batchIndices.length * 0.5) {
                showToast(t('toast.autoSummaryWarning', { parts: parts.join('; ') }), 'warning');
            }
        }

        const selectedAiCount = selectedAiIndices.length;
        const remainingAi = Math.max(0, tailAiCount - selectedAiCount);
        const remainingHint = remainingAi > 0 ? ` (${remainingAi} remaining)` : '';
        const batchMsg = t('toast.autoSummaryProgress', { batch: selectedAiCount, total: tailAiCount, remaining: remainingHint });
        showToast(batchMsg, 'info');

        const context = getContext();
        const userName = context?.name1 || t('ui.protagonist');

        const msgIndices = [...batchIndices].sort((a, b) => a - b);
        const fullTexts = msgIndices.map(idx => {
            const msg = chat[idx];
            const d = msg?.horae_meta?.timestamp?.story_date || '';
            const tm = msg?.horae_meta?.timestamp?.story_time || '';
            return `【#${idx}${d ? ' ' + d : ''}${tm ? ' ' + tm : ''}】\n${_stripConfiguredTags(msg?.mes || '')}`;
        });
        const sourceText = fullTexts.join('\n\n');

        const eventText = bufferEvents.map(e => `[${e.level}] ${e.date}${e.time ? ' ' + e.time : ''}: ${e.summary}`).join('\n');
        const autoSumTemplate = settings.customAutoSummaryPrompt || getDefaultAutoSummaryPrompt();
        const includeFullText = _getAutoSummarySourceMode() === 'fulltext';
        const hasFullTextPlaceholder = /\{\{fulltext\}\}/i.test(autoSumTemplate);
        let prompt = autoSumTemplate
            .replace(/\{\{events\}\}/gi, eventText)
            .replace(/\{\{fulltext\}\}/gi, includeFullText ? sourceText : '')
            .replace(/\{\{count\}\}/gi, String(bufferEvents.length))
            .replace(/\{\{user\}\}/gi, userName);
        if (includeFullText && sourceText && !hasFullTextPlaceholder) {
            prompt += `\n\n【全文对话记录】：\n${sourceText}`;
        }

        const response = await generateForSummary(prompt, { taskType: 'autoSummary', injectCustomPrompts: true });
        if (!response?.trim()) {
            showToast(t('toast.autoSummaryEmpty'), 'warning');
            return;
        }

        const extracted = _extractHoraeSummaryText(response);
        if (!extracted.ok) {
            if (extracted.reason === 'empty') {
                showToast(t('toast.autoSummaryCleanedEmpty'), 'warning');
            } else {
                _showHoraeSummaryFormatWarning('自动总结', extracted.reason);
            }
            return;
        }
        let summaryText = extracted.text;
        if (!summaryText) {
            showToast(t('toast.autoSummaryCleanedEmpty'), 'warning');
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

        // range 显示用，coveredIndices 才是判定"已摘要"的权威集合
        const hideMin = msgIndices[0];
        const hideMax = msgIndices[msgIndices.length - 1];

        const summaryId = `as_${Date.now()}`;
        firstMsg.horae_meta.autoSummaries.push({
            id: summaryId,
            range: [hideMin, hideMax],
            coveredIndices: [...msgIndices],
            summaryText,
            originalEvents,
            depth: 1,
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

        // 卡片始终放到 range 起点，避免视觉上"跳一层"
        const targetIdx = msgIndices[0];
        if (!chat[targetIdx].horae_meta) chat[targetIdx].horae_meta = createEmptyMeta();
        const targetMeta = chat[targetIdx].horae_meta;
        if (!targetMeta.events) targetMeta.events = [];
        targetMeta.events.push({
            is_important: true,
            level: '摘要',
            summary: summaryText,
            isSummary: true,
            _summaryId: summaryId
        });

        for (const idx of msgIndices) {
            if (chat[idx]?.horae_meta?._autoBufferHidden) {
                delete chat[idx].horae_meta._autoBufferHidden;
            }
        }

        // 只 hide 实际进入 batch 的消息，避免误盖到其它 entry 范围内的消息
        await setMessagesHidden(chat, [...msgIndices], true);

        await context.saveChat();
        updateTimelineDisplay();
        showToast(t('toast.autoSummaryDone', { from: msgIndices[0], to: msgIndices[msgIndices.length - 1] }), 'success');
    } catch (err) {
        console.error('[Horae] auto summary failed:', err);
        showToast(t('toast.autoSummaryFailed', { error: err.message || err }), 'error');
    } finally {
        _summaryInProgress = false;
        // 权威存盘：补偿 onMessageReceived 因竞态保护而跳过的 save
        try {
            await enforceHiddenState();
            await getContext().saveChat();
        } catch (_) { }
    }
}

/** 默认的剧情压缩提示词（含事件压缩和全文摘要两段，以分隔线区分） */
function getDefaultCompressPrompt() {
    return _getPromptDefaultFromResource('customCompressPrompt') || '';
}

function getDefaultAutoSummaryPrompt() {
    return _getPromptDefaultFromResource('customAutoSummaryPrompt') || '';
}

/** 默认的二次总结提示词（仅基于时间线/已有摘要） */
function getDefaultAutoResummaryPrompt() {
    return _getPromptDefaultFromResource('customAutoResummaryPrompt') || '';
}

function parseCompressPrompt(template, mode) {
    const eventRe = /=+(?:【事件压缩】|\[Event Compression\]|\[イベント圧縮\]|\[이벤트 압축\]|\[Сжатие событий\])=+/;
    const fulltextRe = /=+(?:【全文摘要】|\[Full-text Summary\]|\[全文要約\]|\[전문 요약\]|\[Полное резюме\])=+/;
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
    return template;
}

function _getAutoSummarySourceMode() {
    return settings.autoSummarySourceMode === 'events' ? 'events' : 'fulltext';
}

function _getAutoSummaryActiveBufferLimit() {
    const mode = settings.autoSummaryBufferMode === 'tokens' ? 'tokens' : 'messages';
    if (mode === 'tokens') {
        return Math.max(1000, parseInt(settings.autoSummaryBufferTokenLimit, 10) || DEFAULT_SETTINGS.autoSummaryBufferTokenLimit);
    }
    return Math.max(5, parseInt(settings.autoSummaryBufferMsgLimit, 10) || DEFAULT_SETTINGS.autoSummaryBufferMsgLimit);
}

function _syncAutoSummaryLegacyBufferLimit() {
    settings.autoSummaryBufferLimit = _getAutoSummaryActiveBufferLimit();
}

function _syncAutoSummaryTriggerLimitInput() {
    const input = document.getElementById('horae-setting-auto-summary-limit');
    if (!input) return;
    const mode = settings.autoSummaryBufferMode === 'tokens' ? 'tokens' : 'messages';
    input.value = _getAutoSummaryActiveBufferLimit();
    if (mode === 'tokens') {
        input.min = '1000';
        input.max = '1000000';
        input.step = '1000';
    } else {
        input.min = '5';
        input.max = '99999';
        input.step = '1';
    }
}

/** 根据缓冲模式动态更新缓冲上限的说明文案 */
function updateAutoSummaryHint() {
    const hintEl = document.getElementById('horae-auto-summary-limit-hint');
    const mode = settings.autoSummaryBufferMode || 'messages';

    const labelEl = document.getElementById('horae-auto-summary-limit-label');
    if (labelEl) {
        labelEl.textContent = mode === 'tokens'
            ? t('settings.triggerThreshold')
            : t('settings.triggerThresholdMessages');
    }

    if (!hintEl) return;
    if (mode === 'tokens') {
        hintEl.innerHTML = t('ui.tokenModeHint') + '<br>' +
            '<small>' + t('ui.tokenModeHint2') + '<br>' +
            t('ui.tokenModeHint3') + '</small>';
    } else {
        hintEl.innerHTML = t('ui.messageModeHint') + '<br>' +
            '<small>' + t('ui.messageModeHint2') + '</small>';
    }
}

/** 估算文本的token数（CJK按1.5、其余按0.4） */
function estimateTokens(text) {
    if (!text) return 0;
    const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
    const rest = text.length - cjk;
    return Math.ceil(cjk * 1.5 + rest * 0.4);
}

/** 根据 vectorStripTags 配置的标签列表，整块移除对应内容（小剧场等），避免污染 AI 摘要/解析 */
function _stripConfiguredTags(text) {
    if (!text) return text;
    const tagList = settings.vectorStripTags;
    if (!tagList) return text;
    const tags = tagList.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
    for (const tag of tags) {
        const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(`<${escaped}(?:\\s[^>]*)?>[\\s\\S]*?</${escaped}>`, 'gi'), '');
    }
    return text.trim();
}

/** 判断消息是否为空层（同层系统等代码渲染的无实际叙事内容楼层） */
function isEmptyOrCodeLayer(mes) {
    if (!mes) return true;
    const stripped = mes
        .replace(/<[^>]*>/g, '')
        .replace(/\{\{[^}]*\}\}/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .trim();
    return stripped.length < 20;
}

/** AI智能摘要 — 批量分析历史消息，暂存结果后弹出审阅视窗 */
async function batchAIScan() {
    const chat = horaeManager.getChat();
    if (!chat || chat.length === 0) {
        showToast(t('toast.insufficientEvents'), 'warning');
        return;
    }

    const targets = [];
    let skippedEmpty = 0;
    const isAntiParaphrase = !!settings.antiParaphraseMode;
    for (let i = 0; i < chat.length; i++) {
        const msg = chat[i];
        if (msg.is_user) {
            if (isAntiParaphrase && i + 1 < chat.length && !chat[i + 1].is_user) {
                const nextMsg = chat[i + 1];
                const nextMeta = nextMsg.horae_meta;
                if (nextMeta?.events?.length > 0) { i++; continue; }
                if (isEmptyOrCodeLayer(nextMsg.mes) && isEmptyOrCodeLayer(msg.mes)) { i++; skippedEmpty++; continue; }
                const combined = `[USER行动]\n${_stripConfiguredTags(msg.mes)}\n\n[AI回复]\n${_stripConfiguredTags(nextMsg.mes)}`;
                targets.push({ index: i + 1, text: combined });
                i++;
            }
            continue;
        }
        if (isAntiParaphrase) continue;
        if (isEmptyOrCodeLayer(msg.mes)) { skippedEmpty++; continue; }
        const meta = msg.horae_meta;
        if (meta?.events?.length > 0) continue;
        targets.push({ index: i, text: _stripConfiguredTags(msg.mes) });
    }

    if (targets.length === 0) {
        const hint = skippedEmpty > 0 ? t('toast.skippedEmpty', { n: skippedEmpty }) : '';
        showToast(t('toast.allMessagesHaveTimeline', { hint }), 'info');
        return;
    }

    const scanConfig = await showAIScanConfigDialog(targets.length);
    if (!scanConfig) return;
    const { tokenLimit, includeNpc, includeAffection, includeScene, includeRelationship } = scanConfig;

    const batches = [];
    let currentBatch = [], currentTokens = 0;
    for (const target of targets) {
        const tokens = estimateTokens(target.text);
        if (currentBatch.length > 0 && currentTokens + tokens > tokenLimit) {
            batches.push(currentBatch);
            currentBatch = [];
            currentTokens = 0;
        }
        currentBatch.push(target);
        currentTokens += tokens;
    }
    if (currentBatch.length > 0) batches.push(currentBatch);

    const skippedHint = skippedEmpty > 0 ? '\n· ' + t('toast.skippedEmpty', { n: skippedEmpty }) : '';
    if (!confirm(t('confirm.aiScanConfirm', { batches: batches.length, skippedHint }))) return;

    const scanResults = await executeBatchScan(batches, { includeNpc, includeAffection, includeScene, includeRelationship });
    if (scanResults.length === 0) {
        showToast(t('toast.insufficientEvents'), 'warning');
        return;
    }
    showScanReviewModal(scanResults, { includeNpc, includeAffection, includeScene, includeRelationship });
}

/** 执行批量扫描，每批完成后立即写入 chat 并保存（防止中途崩溃丢失已扫描数据） */
async function executeBatchScan(batches, options = {}) {
    const { includeNpc, includeAffection, includeScene, includeRelationship } = options;
    let cancelled = false;
    let cancelResolve = null;
    const cancelPromise = new Promise(resolve => { cancelResolve = resolve; });

    // 用于真正中止HTTP请求的AbortController（fetch层面）
    const fetchAbort = new AbortController();
    const _origFetch = window.fetch;
    window.fetch = function (input, init = {}) {
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
    overlay.className = 'horae-progress-overlay' + (isLightMode() ? ' horae-light' : '');
    overlay.innerHTML = `
        <div class="horae-progress-container">
            <div class="horae-progress-title">${t('ui.analyzing')}</div>
            <div class="horae-progress-bar">
                <div class="horae-progress-fill" style="width: 0%"></div>
            </div>
            <div class="horae-progress-text">${t('ui.preparing')}</div>
            <button class="horae-progress-cancel"><i class="fa-solid fa-xmark"></i> ${t('ui.cancelSummary')}</button>
        </div>
    `;
    document.body.appendChild(overlay);
    const fillEl = overlay.querySelector('.horae-progress-fill');
    const textEl = overlay.querySelector('.horae-progress-text');
    const context = getContext();
    const userName = context?.name1 || t('ui.protagonist');

    // 取消：中止fetch请求 + stopGeneration + Promise.race跳出
    overlay.querySelector('.horae-progress-cancel').addEventListener('click', () => {
        if (cancelled) return;
        const hasPartial = scanResults.length > 0;
        const hint = hasPartial
            ? t('confirm.aiScanStopConfirm', { n: scanResults.length })
            : t('confirm.compressCancel');
        if (!confirm(hint)) return;
        cancelled = true;
        fetchAbort.abort();
        try { context.stopGeneration(); } catch (_) { }
        cancelResolve();
        overlay.remove();
        showToast(hasPartial ? t('toast.scanStopped', { n: scanResults.length }) : t('toast.scanCancelled'), 'info');
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
        textEl.textContent = t('toast.aiBatchDone', { n: `${b + 1}/${batches.length}` });
        fillEl.style.width = `${Math.round((b / batches.length) * 100)}%`;

        const messagesBlock = batch.map(msg => `【消息#${msg.index}】\n${msg.text}`).join('\n\n');

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
event:重要程度|事件描述
</horaeevent>

【规则】
· time：从文本中提取当前场景的日期时间，必填（没有明确时间则根据上下文推断）
· event：本条消息中发生的关键剧情，每条消息至少一个 event
· 物品仅在获得、消耗、状态改变时记录，无变化则不写 item 行
· item格式：emoji前缀如🔑🍞，单件不写(1)，位置需精确（❌地上 ✅酒馆大厅桌上）
· 重要程度判断：日常对话=一般，推动剧情=重要，关键转折=关键
· ${userName} 是主角名${extraRules}
· 再次强调：只允许 ${allowedTags}，${forbiddenNote}

═══ 【事件摘要(event)】撰写规则 ═══
★ 核心目标：为未来的AI提供无损的“前情提要”，必须具体且信息量密集，字数控制在80-150字。
★ 视角强制设定：【冷酷的监控摄像头视角】+【警察做笔录风格】。只能描写视觉可见的动作、听觉可闻的对话、以及明确写出的事实。禁止任何形式的文学修饰。
★ 必须包含以下关键要素（5W1H）：
  ① 核心互动：谁对谁做了什么/说了什么关键的话？（写出具体的动作或核心台词大意）
  ② 状态/情绪（仅限明文）：必须是文本中【明确写出】的心理或情绪。若原文只描写了客观动作（如支付报酬、走路、吃饭），摘要就只写动作，绝对禁止强行推导人物的“隐秘心态”或“深层动机”！
  ③ 新情报/结果：本回合推进了什么剧情？（获得了什么线索、达成了什么共识、发生了什么变故）
  ④ 伏笔/悬念（若有）：留下了什么未解决的问题？
★ 严禁泛泛而谈：
  ❌ 错误示范："U和艾伦在酒馆聊天，两人聊得很开心，最后约定下次再见。"（毫无细节）
  ✅ 正确示范："U在酒馆向艾伦打听黑市商人的下落，艾伦起初警惕，但在U递出10枚金币后，透露商人明晚会在废弃码头出现。艾伦对U的态度由戒备转为贪婪。两人约定明晚一起行动。"
★ 严禁无中生有：禁止写出原文未明确指出的情绪（禁止使用“这引出了...的珍视”、“体现了...的心态”等阅读理解句式）。
★ 严禁氛围总结：禁止出现“显得...带有生活气息”、“气氛变得...”等主观感悟。`;
        }

        try {
            const response = await Promise.race([
                _generateForAiTasks(batchPrompt),
                cancelPromise.then(() => null)
            ]);
            if (cancelled) break;
            if (!response) {
                console.warn(`[Horae] 第 ${b + 1} 批：AI 未返回内容`);
                showToast(t('toast.aiBatchNoContent', { n: b + 1 }), 'warning');
                continue;
            }
            const cleanedResponse = response.replace(/<think(?:ing)?[\s>][\s\S]*?<\/think(?:ing)?>/gi, '');
            const segments = cleanedResponse.split(/={2,}\s*(?:消息|[Mm]essage)\s*#\s*(\d+)\s*={2,}/);
            if (segments.length <= 1) {
                console.warn(`[Horae] 第 ${b + 1} 批：AI 回复格式不匹配（未找到 ===消息#N=== 分隔符）`, response.substring(0, 300));
                showToast(t('toast.aiBatchFormatError', { n: b + 1 }), 'warning');
                continue;
            }
            const batchWritten = [];
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

                    // 立即写入 chat
                    if (newMeta.scene?.location && newMeta.scene?.scene_desc) {
                        horaeManager._updateLocationMemory(newMeta.scene.location, newMeta.scene.scene_desc);
                    }
                    if (newMeta.relationships?.length > 0) {
                        horaeManager._mergeRelationships(newMeta.relationships);
                    }
                    horaeManager.setMessageMeta(msgIndex, newMeta);
                    injectHoraeTagToMessage(msgIndex, newMeta);

                    const chatRef = horaeManager.getChat();
                    const preview = (chatRef[msgIndex]?.mes || '').substring(0, 60);
                    scanResults.push({ msgIndex, newMeta, preview, _deleted: false });
                    batchWritten.push(msgIndex);
                }
            }
            // 每批完成后保存并更新 _pendingScanReview 标记
            if (batchWritten.length > 0) {
                const chatRef = horaeManager.getChat();
                if (chatRef?.[0]) {
                    if (!chatRef[0].horae_meta) chatRef[0].horae_meta = createEmptyMeta();
                    if (!chatRef[0].horae_meta._pendingScanReview) {
                        chatRef[0].horae_meta._pendingScanReview = {
                            msgIndices: [], options, startedAt: new Date().toISOString()
                        };
                    }
                    chatRef[0].horae_meta._pendingScanReview.msgIndices.push(...batchWritten);
                }
                horaeManager.rebuildTableData();
                try { await context.saveChat(); } catch (_) { }
            }
        } catch (err) {
            if (cancelled || err?.name === 'AbortError') break;
            console.error(`[Horae] 第 ${b + 1} 批摘要失败:`, err);
            showToast(t('toast.aiBatchFailed', { n: b + 1 }), 'error');
        }

        if (b < batches.length - 1 && !cancelled) {
            textEl.textContent = t('toast.aiBatchDone', { n: b + 1 });
            await Promise.race([
                new Promise(r => setTimeout(r, 2000)),
                cancelPromise
            ]);
        }
    }
    window.fetch = _origFetch;
    if (!cancelled) overlay.remove();
    return scanResults;
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
        { id: 'items', label: t('tabs.items'), icon: 'fa-box-open', items: categories.items },
        { id: 'npcs', label: t('tabs.characters'), icon: 'fa-user', items: categories.npcs },
        { id: 'affection', label: t('characters.affection'), icon: 'fa-heart', items: categories.affection },
        { id: 'scenes', label: t('tabs.locations'), icon: 'fa-map-location-dot', items: categories.scenes },
        { id: 'relationships', label: t('characters.relationships'), icon: 'fa-people-arrows', items: categories.relationships }
    ].filter(tab => tab.items.length > 0);

    if (tabs.length === 0) {
        showToast(t('toast.insufficientEvents'), 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'horae-modal horae-review-modal' + (isLightMode() ? ' horae-light' : '');

    const activeTab = tabs[0].id;
    const tabsHtml = tabs.map(tab =>
        `<button class="horae-review-tab ${tab.id === activeTab ? 'active' : ''}" data-tab="${tab.id}">
            <i class="fa-solid ${tab.icon}"></i> ${tab.label} <span class="tab-count">${tab.items.length}</span>
        </button>`
    ).join('');

    const panelsHtml = tabs.map(tab => {
        const itemsHtml = tab.items.map(item => {
            const itemKey = escapeHtml(makeReviewKey(item));
            const levelAttr = item.level ? ` data-level="${escapeHtml(item.level)}"` : '';
            const levelBadge = item.level ? `<span class="horae-level-badge ${(item.level === '关键' || item.level === '關鍵') ? 'critical' : item.level === '重要' ? 'important' : ''}" style="font-size:10px;margin-right:4px;">${escapeHtml(item.level)}</span>` : '';
            const descHtml = item.desc ? `<div class="horae-review-item-sub" style="font-style:italic;opacity:0.8;">📝 ${escapeHtml(item.desc)}</div>` : '';
            return `<div class="horae-review-item" data-key="${itemKey}"${levelAttr}>
                <div class="horae-review-item-body">
                    <div class="horae-review-item-title">${levelBadge}${escapeHtml(item.text)}</div>
                    ${item.sub ? `<div class="horae-review-item-sub">${escapeHtml(item.sub)}</div>` : ''}
                    ${descHtml}
                    ${item.time ? `<div class="horae-review-item-sub">${escapeHtml(item.time)}</div>` : ''}
                    <div class="horae-review-item-msg">#${item.msgIndex}</div>
                </div>
                <button class="horae-review-delete-btn" data-key="${itemKey}" title="${t('ui.deleteRestore')}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>`;
        }).join('');
        return `<div class="horae-review-panel ${tab.id === activeTab ? 'active' : ''}" data-panel="${tab.id}">
            ${itemsHtml || `<div class="horae-review-empty">${t('ui.noReviewData')}</div>`}
        </div>`;
    }).join('');

    const totalCount = tabs.reduce((s, tab) => s + tab.items.length, 0);

    modal.innerHTML = `
        <div class="horae-modal-content">
            <div class="horae-modal-header">
                <span>${t('ui.summaryReview')}</span>
                <span style="font-size:12px;color:var(--horae-text-muted);">${t('ui.totalCount', { n: totalCount })}</span>
            </div>
            <div class="horae-review-tabs">${tabsHtml}</div>
            <div class="horae-review-body">${panelsHtml}</div>
            <div class="horae-modal-footer horae-review-footer">
                <div class="horae-review-stats">${t('ui.deletedCount')} <strong id="horae-review-del-count">0</strong> ${t('ui.items')}</div>
                <div class="horae-review-actions">
                    <button class="horae-btn" id="horae-review-cancel"><i class="fa-solid fa-xmark"></i> ${t('common.cancel')}</button>
                    <button class="horae-btn primary" id="horae-review-rescan" disabled style="opacity:0.5;"><i class="fa-solid fa-wand-magic-sparkles"></i> ${t('ui.rescanSummary')}</button>
                    <button class="horae-btn primary" id="horae-review-confirm"><i class="fa-solid fa-check"></i> ${t('ui.confirmSave')}</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    preventModalBubble(modal);

    // tab 切换
    modal.querySelectorAll('.horae-review-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            modal.querySelectorAll('.horae-review-tab').forEach(el => el.classList.remove('active'));
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
        for (const tab of tabs) {
            const remain = tab.items.filter(i => !deletedSet.has(makeReviewKey(i))).length;
            const badge = modal.querySelector(`.horae-review-tab[data-tab="${tab.id}"] .tab-count`);
            if (badge) badge.textContent = remain;
        }
    }

    // 确认保存（数据已在扫描时写入 chat，此处只需处理用户删除的条目并清除待审阅标记）
    modal.querySelector('#horae-review-confirm').addEventListener('click', async () => {
        // applyDeletedToResults 会直接修改 scanResults[ri].newMeta（即 chat 中的 meta 引用）
        applyDeletedToResults(scanResults, deletedSet, categories);
        // 对被完全删空的 result，同步更新正文标签
        for (const r of scanResults) {
            if (!r._deleted) continue;
            injectHoraeTagToMessage(r.msgIndex, horaeManager.getMessageMeta(r.msgIndex) || createEmptyMeta());
        }
        // 对部分删除的 result，也需要重新注入标签（因为 applyDeletedToResults 修改了内容）
        if (deletedSet.size > 0) {
            for (const r of scanResults) {
                if (r._deleted) continue;
                injectHoraeTagToMessage(r.msgIndex, r.newMeta);
            }
        }
        // 清除待审阅标记
        const chat = horaeManager.getChat();
        if (chat?.[0]?.horae_meta?._pendingScanReview) {
            delete chat[0].horae_meta._pendingScanReview;
        }
        horaeManager.rebuildTableData();
        await getContext().saveChat();
        modal.remove();
        const saved = scanResults.filter(r => !r._deleted).length;
        showToast(t('toast.summariesSaved', { n: saved }), 'success');
        refreshAllDisplays();
        renderCustomTablesList();
    });

    // 取消（丢弃所有本次扫描写入的数据）
    const closeModal = async () => {
        if (!confirm(t('confirm.discardScanReview'))) return;
        const chat = horaeManager.getChat();
        // 回滚所有本次扫描写入的数据
        const pendingIndices = chat?.[0]?.horae_meta?._pendingScanReview?.msgIndices || [];
        const rollbackSet = new Set(pendingIndices);
        for (const r of scanResults) rollbackSet.add(r.msgIndex);
        for (const idx of rollbackSet) {
            const meta = chat?.[idx]?.horae_meta;
            if (!meta?._aiScanned) continue;
            meta.events = [];
            meta.items = {};
            meta.npcs = {};
            meta.affection = {};
            if (meta.scene) meta.scene = {};
            if (meta.relationships) meta.relationships = [];
            delete meta._aiScanned;
            injectHoraeTagToMessage(idx, meta);
        }
        if (chat?.[0]?.horae_meta?._pendingScanReview) {
            delete chat[0].horae_meta._pendingScanReview;
        }
        horaeManager.rebuildTableData();
        try { await getContext().saveChat(); } catch (_) { }
        modal.remove();
        showToast(t('toast.aiSummaryUndone', { n: rollbackSet.size }), 'info');
        refreshAllDisplays();
        renderCustomTablesList();
    };
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
        if (!confirm(t('confirm.clearAiSummary', { n: deletedMsgIndices.size }))) return;

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
        for (const target of rescanTargets) {
            const tk = estimateTokens(target.text);
            if (cb.length > 0 && ct + tk > tokenLimit) { rescanBatches.push(cb); cb = []; ct = 0; }
            cb.push(target); ct += tk;
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

/** 从已写入 chat 的数据中重建 scanResults（用于中断恢复后弹出审阅窗口） */
function rebuildScanResultsFromChat(msgIndices) {
    const chat = horaeManager.getChat();
    if (!chat) return [];
    const results = [];
    for (const idx of msgIndices) {
        const msg = chat[idx];
        if (!msg?.horae_meta?._aiScanned) continue;
        const meta = msg.horae_meta;
        const preview = (msg.mes || '').substring(0, 60);
        results.push({ msgIndex: idx, newMeta: meta, preview, _deleted: false });
    }
    return results;
}

/** 中断恢复弹窗（三按钮：审阅 / 丢弃 / 保留） */
function _showPendingScanRecoveryModal(chat, pending, count) {
    const modal = document.createElement('div');
    modal.className = 'horae-modal' + (isLightMode() ? ' horae-light' : '');
    modal.innerHTML = `
        <div class="horae-modal-content" style="max-width: 460px;">
            <div class="horae-modal-header">
                <i class="fa-solid fa-triangle-exclamation" style="color:var(--horae-warning,#f0ad4e);"></i>
                ${t('ui.pendingScanTitle')}
            </div>
            <div style="padding:16px;line-height:1.6;">
                ${t('ui.pendingScanDesc', { n: count })}
            </div>
            <div class="horae-modal-footer" style="gap:8px;flex-wrap:wrap;justify-content:center;">
                <button class="horae-btn primary" id="horae-recover-review">
                    <i class="fa-solid fa-magnifying-glass"></i> ${t('ui.openReview')}
                </button>
                <button class="horae-btn" id="horae-recover-keep">
                    <i class="fa-solid fa-check"></i> ${t('ui.keepData')}
                </button>
                <button class="horae-btn" id="horae-recover-discard" style="color:var(--horae-danger,#d9534f);">
                    <i class="fa-solid fa-trash-can"></i> ${t('ui.discardAll')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    preventModalBubble(modal);

    modal.querySelector('#horae-recover-review').addEventListener('click', () => {
        modal.remove();
        const rebuilt = rebuildScanResultsFromChat(pending.msgIndices);
        if (rebuilt.length > 0) {
            showScanReviewModal(rebuilt, pending.options || {});
        } else {
            delete chat[0].horae_meta._pendingScanReview;
            getContext().saveChat();
            showToast(t('toast.noAiSummaryData'), 'info');
        }
    });

    modal.querySelector('#horae-recover-keep').addEventListener('click', async () => {
        modal.remove();
        delete chat[0].horae_meta._pendingScanReview;
        await getContext().saveChat();
        showToast(t('toast.summariesSaved', { n: count }), 'success');
        refreshAllDisplays();
    });

    modal.querySelector('#horae-recover-discard').addEventListener('click', async () => {
        if (!confirm(t('confirm.discardScanReview'))) return;
        modal.remove();
        for (const idx of pending.msgIndices) {
            const meta = chat[idx]?.horae_meta;
            if (!meta?._aiScanned) continue;
            meta.events = [];
            meta.items = {};
            meta.npcs = {};
            meta.affection = {};
            if (meta.scene) meta.scene = {};
            if (meta.relationships) meta.relationships = [];
            delete meta._aiScanned;
            injectHoraeTagToMessage(idx, meta);
        }
        delete chat[0].horae_meta._pendingScanReview;
        horaeManager.rebuildTableData();
        await getContext().saveChat();
        showToast(t('toast.aiSummaryUndone', { n: count }), 'info');
        refreshAllDisplays();
        renderCustomTablesList();
    });

    modal.addEventListener('click', e => { if (e.target === modal) e.stopPropagation(); });
}

/** AI摘要配置弹窗 */
function showAIScanConfigDialog(targetCount) {
    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'horae-modal' + (isLightMode() ? ' horae-light' : '');
        modal.innerHTML = `
            <div class="horae-modal-content" style="max-width: 420px;">
                <div class="horae-modal-header">
                    <span>${t('settings.aiSmartSummary')}</span>
                </div>
                <div class="horae-modal-body" style="padding: 16px;">
                    <p style="margin: 0 0 12px; color: var(--horae-text-muted); font-size: 13px;">
                        检测到 <strong style="color: var(--horae-primary-light);">${targetCount}</strong> 条尚无时间线的消息（已有时间线的楼层自动跳过）
                    </p>
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--horae-text);">
                        ${t('ui.tokenLimitLabel')}
                        <input type="number" id="horae-ai-scan-token-limit" value="80000" min="10000" max="1000000" step="10000"
                            style="flex:1; padding: 6px 10px; background: var(--horae-bg); border: 1px solid var(--horae-border); border-radius: 4px; color: var(--horae-text); font-size: 13px;">
                    </label>
                    <p style="margin: 8px 0 12px; color: var(--horae-text-muted); font-size: 11px;">
                        ${t('ui.tokenLimitHint')}<br>
                        Claude ≈ 80K~200K · Gemini ≈ 100K~1000K · GPT-4o ≈ 80K~128K
                    </p>
                    <div style="border-top: 1px solid var(--horae-border); padding-top: 12px;">
                        <p style="margin: 0 0 8px; font-size: 12px; color: var(--horae-text);">${t('ui.extraExtractItems')}</p>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--horae-text); margin-bottom: 6px; cursor: pointer;">
                            <input type="checkbox" id="horae-scan-include-npc" ${settings.aiScanIncludeNpc ? 'checked' : ''}>
                            ${t('ui.npcCharInfo')}
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--horae-text); cursor: pointer;">
                            <input type="checkbox" id="horae-scan-include-affection" ${settings.aiScanIncludeAffection ? 'checked' : ''}>
                            ${t('characters.affection')}
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--horae-text); margin-top: 6px; cursor: pointer;">
                            <input type="checkbox" id="horae-scan-include-scene" ${settings.aiScanIncludeScene ? 'checked' : ''}>
                            ${t('ui.sceneMemory')}
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--horae-text); margin-top: 6px; cursor: pointer;">
                            <input type="checkbox" id="horae-scan-include-relationship" ${settings.aiScanIncludeRelationship ? 'checked' : ''}>
                            ${t('characters.relationships')}
                        </label>
                        <p style="margin: 6px 0 0; color: var(--horae-text-muted); font-size: 10px;">
                            ${t('ui.extractInfoHint')}
                        </p>
                    </div>
                    <div style="border-top: 1px solid var(--horae-border); padding-top: 12px; margin-top: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--horae-text);">
                            <i class="fa-solid fa-filter" style="font-size: 11px; opacity: .6;"></i>
                            ${t('ui.stripTagsLabel')}
                            <input type="text" id="horae-scan-strip-tags" value="${escapeHtml(settings.vectorStripTags || '')}" placeholder="snow, theater, side"
                                style="flex:1; padding: 5px 8px; background: var(--horae-bg); border: 1px solid var(--horae-border); border-radius: 4px; color: var(--horae-text); font-size: 12px;">
                        </label>
                        <p style="margin: 4px 0 0; color: var(--horae-text-muted); font-size: 10px;">
                            ${t('ui.stripTagsHint')}<br>
                            ${t('ui.stripTagsHint2')}
                        </p>
                    </div>
                </div>
                <div class="horae-modal-footer">
                    <button class="horae-btn" id="horae-ai-scan-cancel">${t('common.cancel')}</button>
                    <button class="horae-btn primary" id="horae-ai-scan-confirm">${t('ui.continueBtn')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        preventModalBubble(modal);

        modal.querySelector('#horae-ai-scan-confirm').addEventListener('click', () => {
            const val = parseInt(modal.querySelector('#horae-ai-scan-token-limit').value) || 80000;
            const includeNpc = modal.querySelector('#horae-scan-include-npc').checked;
            const includeAffection = modal.querySelector('#horae-scan-include-affection').checked;
            const includeScene = modal.querySelector('#horae-scan-include-scene').checked;
            const includeRelationship = modal.querySelector('#horae-scan-include-relationship').checked;
            const newStripTags = modal.querySelector('#horae-scan-strip-tags').value.trim();
            settings.aiScanIncludeNpc = includeNpc;
            settings.aiScanIncludeAffection = includeAffection;
            settings.aiScanIncludeScene = includeScene;
            settings.aiScanIncludeRelationship = includeRelationship;
            settings.vectorStripTags = newStripTags;
            $('#horae-setting-vector-strip-tags').val(newStripTags);
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
        showToast(t('toast.noAiSummaryData'), 'info');
        return;
    }

    if (!confirm(t('confirm.clearAiSummary', { n: count }))) return;

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
    showToast(t('toast.aiSummaryUndone', { n: count }), 'success');
    refreshAllDisplays();
    renderCustomTablesList();
}

function _deepCloneData(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function _normalizeMetaEvents(meta) {
    if (!meta) return [];
    if (meta.event && !meta.events) {
        meta.events = [meta.event];
        delete meta.event;
    }
    if (!Array.isArray(meta.events)) meta.events = [];
    return meta.events;
}

function _sanitizeCarryMessage(rawMessage) {
    const msg = _deepCloneData(rawMessage);
    if (!msg) return null;
    msg.is_hidden = false;

    if (!msg.horae_meta) return msg;

    const events = _normalizeMetaEvents(msg.horae_meta);
    msg.horae_meta.events = events.map(evt => {
        if (!evt || typeof evt !== 'object') return evt;
        const cleaned = { ...evt };
        delete cleaned._compressedBy;
        delete cleaned._summaryId;
        return cleaned;
    });
    delete msg.horae_meta.autoSummaries;
    return msg;
}

function _buildCarryoverCompensationBlocks(events, chunkSize = 8) {
    if (!Array.isArray(events) || events.length === 0) return [];

    const size = Math.max(1, parseInt(chunkSize, 10) || 8);
    const blocks = [];

    for (let i = 0; i < events.length; i += size) {
        const part = events.slice(i, i + size);
        const lines = part.map((evt, idx) => {
            const date = evt.date || '?';
            const time = evt.time ? ` ${evt.time}` : '';
            const level = evt.level || '一般';
            return `${idx + 1}. [${date}${time}] [${level}] ${evt.summary}`;
        });
        blocks.push(lines.join('\n'));
    }

    return blocks;
}

function _collectCarryoverRecapTexts(sourceChat, cutoffIndex) {
    const recapTexts = [];
    const seen = new Set();
    const cutoff = Number.isInteger(cutoffIndex) ? cutoffIndex : sourceChat.length;
    const coveredMsgIndices = new Set();
    const coveredSummaryIds = new Set();

    const pushRecap = (rawText) => {
        const text = typeof rawText === 'string' ? rawText.trim() : '';
        if (!text) return;
        const key = text.replace(/\s+/g, ' ').trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        recapTexts.push(text);
    };

    const firstMeta = sourceChat?.[0]?.horae_meta;
    const summaries = Array.isArray(firstMeta?.autoSummaries) ? [...firstMeta.autoSummaries] : [];
    summaries.sort((a, b) => {
        const aStart = Array.isArray(a?.range) ? (a.range[0] ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
        const bStart = Array.isArray(b?.range) ? (b.range[0] ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
        return aStart - bStart;
    });

    for (const s of summaries) {
        if (!s || typeof s !== 'object') continue;
        let include = true;

        if (Array.isArray(s.range) && s.range.length >= 2) {
            const rangeStart = Number.isInteger(s.range[0]) ? s.range[0] : Number.MAX_SAFE_INTEGER;
            const rangeEnd = Number.isInteger(s.range[1]) ? s.range[1] : Number.MAX_SAFE_INTEGER;
            if (rangeEnd >= cutoff) include = false;
            if (include) {
                for (let i = Math.max(1, rangeStart); i <= Math.min(cutoff - 1, rangeEnd); i++) {
                    coveredMsgIndices.add(i);
                }
            }
        }

        if (!include) continue;
        if (s.id) coveredSummaryIds.add(s.id);
        if (Array.isArray(s.coveredIndices)) {
            for (const idx of s.coveredIndices) {
                if (Number.isInteger(idx) && idx >= 1 && idx < cutoff) {
                    coveredMsgIndices.add(idx);
                }
            }
        }

        if (Array.isArray(s.range) && s.range.length >= 2) {
            const rangeEnd = Number.isInteger(s.range[1]) ? s.range[1] : Number.MAX_SAFE_INTEGER;
            if (rangeEnd >= cutoff) continue;
        }
        pushRecap(s.summaryText || s.summary || s.title || '');
    }

    const upperBound = Math.max(1, cutoff);
    const standaloneEvents = [];
    const standaloneSeen = new Set();
    for (let i = 1; i < upperBound; i++) {
        const meta = sourceChat?.[i]?.horae_meta;
        if (!meta) continue;
        const events = meta.events || (meta.event ? [meta.event] : []);
        for (const evt of events) {
            if (!evt || typeof evt !== 'object') continue;
            const summary = typeof evt.summary === 'string' ? evt.summary.trim() : '';
            if (!summary) continue;

            const isSummaryEvent = !!(evt.isSummary || evt.level === '摘要' || evt._summaryId);
            if (isSummaryEvent) {
                pushRecap(summary);
                continue;
            }

            if (evt._compressedBy && coveredSummaryIds.has(evt._compressedBy)) continue;
            if (coveredMsgIndices.has(i)) continue;

            const date = meta.timestamp?.story_date || '?';
            const time = meta.timestamp?.story_time || '';
            const level = evt.level || '一般';
            const key = `${i}|${date}|${time}|${level}|${summary}`;
            if (standaloneSeen.has(key)) continue;
            standaloneSeen.add(key);

            standaloneEvents.push({
                date,
                time,
                level,
                summary,
            });
        }
    }

    const compensationBlocks = _buildCarryoverCompensationBlocks(standaloneEvents, 8);
    for (const block of compensationBlocks) {
        pushRecap(block);
    }

    return recapTexts;
}

function _composeCarryoverRecapText(recapTexts) {
    if (!Array.isArray(recapTexts) || recapTexts.length === 0) return '';
    const lines = recapTexts.map((text, idx) => `${idx + 1}. ${text}`);
    return `【承接旧对话剧情回顾（共${recapTexts.length}条）】\n${lines.join('\n')}`;
}

function _buildImportObjectFromChat(chat) {
    return {
        version: VERSION,
        exportTime: new Date().toISOString(),
        data: (chat || [])
            .map((msg, index) => ({ index, horae_meta: _deepCloneData(msg?.horae_meta || null) }))
            .filter(item => item.horae_meta),
    };
}

function _getCarryVisibleIndices(chat, keepCount) {
    const result = { indices: [], aiCount: 0 };
    if (!Array.isArray(chat) || chat.length <= 1) return result;
    if (keepCount <= 0) return result;

    const selectedAiIndices = [];
    for (let i = chat.length - 1; i >= 1; i--) {
        const msg = chat[i];
        if (!msg || msg.is_hidden) continue;
        if (msg.is_user) continue;
        selectedAiIndices.push(i);
        if (selectedAiIndices.length >= keepCount) break;
    }

    if (selectedAiIndices.length === 0) return result;

    selectedAiIndices.sort((a, b) => a - b);
    const carryStart = selectedAiIndices[0];

    for (let i = carryStart; i < chat.length; i++) {
        const msg = chat[i];
        if (!msg || msg.is_hidden) continue;
        result.indices.push(i);
    }

    result.aiCount = selectedAiIndices.length;
    return result;
}

function _createCarryoverAnchorMessage() {
    const ctx = getContext();
    return {
        name: ctx?.name2 || 'Assistant',
        is_user: false,
        is_system: true,
        mes: '',
        is_hidden: true,
        horae_meta: createEmptyMeta(),
    };
}

function _stripFreshChatPreludeForCarryover(targetChat) {
    if (!Array.isArray(targetChat) || targetChat.length === 0) return 0;
    if (targetChat.some(msg => !!msg?.is_user)) return 0;

    const preludeCount = targetChat.length;
    if (preludeCount <= 0) return 0;

    // 保留第 1 层作为元数据锚点，其余开场白楼层移除
    const anchor = targetChat[0];
    anchor.mes = '';
    anchor.is_hidden = true;
    if (Array.isArray(anchor.swipes)) anchor.swipes = [];
    if (typeof anchor.swipe_id === 'number') anchor.swipe_id = 0;
    targetChat.splice(1);
    return preludeCount;
}

async function createNewChatWithCarryover() {
    const sourceChat = horaeManager.getChat();
    if (!Array.isArray(sourceChat) || sourceChat.length === 0) {
        showToast('当前对话没有可携带的数据', 'warning');
        return;
    }

    const keepRaw = parseInt(settings.autoSummaryKeepRecent, 10);
    const keepCount = Number.isFinite(keepRaw) && keepRaw >= 0 ? keepRaw : 10;
    const carryPlan = _getCarryVisibleIndices(sourceChat, keepCount);
    const carryIndices = carryPlan.indices;
    const carryAiCount = carryPlan.aiCount;
    const carryMessages = carryIndices.map(i => _sanitizeCarryMessage(sourceChat[i])).filter(Boolean);
    const carryStart = carryIndices.length > 0 ? carryIndices[0] : sourceChat.length;
    const recapTexts = _collectCarryoverRecapTexts(sourceChat, carryStart);
    const recapText = _composeCarryoverRecapText(recapTexts);
    const importObj = _buildImportObjectFromChat(sourceChat);

    if (importObj.data.length === 0 && carryMessages.length === 0 && !recapText) {
        showToast('当前对话没有可携带的数据', 'warning');
        return;
    }

    const confirmText = [
        `将按“保留AI条数=${keepCount}”携带最近 AI 楼层，并创建新对话。`,
        '',
        `将携带AI楼层：${carryAiCount} 条`,
        `实际携带消息：${carryMessages.length} 条（含夹带User）`,
        `旧剧情回顾：${recapTexts.length} 条`,
        '',
        '继续吗？',
    ].join('\n');
    if (!confirm(confirmText)) return;

    try {
        await getContext().saveChat();
        await doNewChat({ deleteCurrentChat: false });

        const targetChat = horaeManager.getChat();
        if (!Array.isArray(targetChat)) throw new Error('新对话创建失败');
        if (targetChat.length === 0) targetChat.push(_createCarryoverAnchorMessage());
        const removedPreludeCount = carryMessages.length > 0 ? _stripFreshChatPreludeForCarryover(targetChat) : 0;
        if (targetChat.length === 0) targetChat.push(_createCarryoverAnchorMessage());

        _importAsInitialState(importObj, targetChat, { includeTimeline: false });

        if (!targetChat[0].horae_meta) targetChat[0].horae_meta = createEmptyMeta();
        if (!Array.isArray(targetChat[0].horae_meta.events)) targetChat[0].horae_meta.events = [];
        targetChat[0].horae_meta.events = targetChat[0].horae_meta.events.filter(evt => !evt?._carryoverSeed);

        if (recapText) {
            targetChat[0].horae_meta.events.unshift({
                is_important: true,
                level: '摘要',
                summary: recapText,
                isSummary: true,
                _carryoverSeed: true,
            });
        }

        for (const msg of carryMessages) {
            targetChat.push(msg);
        }

        await getContext().saveChat();
        if (typeof getContext().reloadCurrentChat === 'function') {
            await getContext().reloadCurrentChat();
        }
        _rebuildGlobalDataForCurrentChat();
        refreshAllDisplays();
        renderCustomTablesList();

        showToast(`已创建新对话：AI ${carryAiCount} 条，实际消息 ${carryMessages.length} 条，旧剧情回顾 ${recapTexts.length} 条${removedPreludeCount > 0 ? `，已清理开场白 ${removedPreludeCount} 条` : ''}`, 'success');
    } catch (error) {
        console.error('[Horae] 创建携带记忆新对话失败:', error);
        showToast(`创建新对话失败: ${error.message || error}`, 'error');
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

    showToast(t('toast.configExported'), 'success');
}

/**
 * 导入数据（支持两种模式）
 */
function importData() {
    const mode = confirm(t('confirm.importMode')) ? 'match' : 'initial';

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
                throw new Error(t('toast.invalidDataFormat'));
            }

            const chat = horaeManager.getChat();

            if (mode === 'match') {
                let imported = 0;
                for (const item of importObj.data) {
                    if (item.index >= 0 && item.index < chat.length && item.horae_meta) {
                        chat[item.index].horae_meta = item.horae_meta;
                        imported++;
                    }
                }
                await getContext().saveChat();
                showToast(t('toast.recordsImported', { n: imported }), 'success');
            } else {
                _importAsInitialState(importObj, chat);
                await getContext().saveChat();
                showToast(t('toast.metaImportedAsInitial'), 'success');
            }
            refreshAllDisplays();
        } catch (error) {
            console.error('[Horae] 导入失败:', error);
            showToast(t('toast.importFailed', { error: error.message }), 'error');
        }
    };
    input.click();
}

/**
 * 从导出文件提取最终累积状态，写入当前对话的 chat[0] 作为初始元数据，
 * 适用于新聊天继承旧聊天的世界观数据。
 */
function _importAsInitialState(importObj, chat, options = {}) {
    const includeTimeline = options.includeTimeline !== false;
    const allMetas = importObj.data
        .sort((a, b) => a.index - b.index)
        .map(d => d.horae_meta)
        .filter(Boolean);

    if (!allMetas.length) throw new Error('导出文件中无有效元数据');
    if (!chat[0].horae_meta) chat[0].horae_meta = createEmptyMeta();
    const target = chat[0].horae_meta;

    // 累积 NPC
    for (const meta of allMetas) {
        if (meta.npcs) {
            for (const [name, info] of Object.entries(meta.npcs)) {
                if (!target.npcs) target.npcs = {};
                target.npcs[name] = { ...(target.npcs[name] || {}), ...info };
            }
        }
        if (meta.affection) {
            for (const [name, val] of Object.entries(meta.affection)) {
                if (!target.affection) target.affection = {};
                if (typeof val === 'object' && val.type === 'absolute') {
                    target.affection[name] = val.value;
                } else {
                    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
                    target.affection[name] = (target.affection[name] || 0) + num;
                }
            }
        }
        if (meta.items) {
            if (!target.items) target.items = {};
            Object.assign(target.items, meta.items);
        }
        if (meta.costumes) {
            if (!target.costumes) target.costumes = {};
            Object.assign(target.costumes, meta.costumes);
        }
        if (meta.mood) {
            if (!target.mood) target.mood = {};
            Object.assign(target.mood, meta.mood);
        }
        if (meta.timestamp?.story_date) {
            target.timestamp.story_date = meta.timestamp.story_date;
        }
        if (meta.timestamp?.story_time) {
            target.timestamp.story_time = meta.timestamp.story_time;
        }
        if (meta.scene?.location) target.scene.location = meta.scene.location;
        if (meta.scene?.atmosphere) target.scene.atmosphere = meta.scene.atmosphere;
        if (meta.scene?.characters_present?.length) {
            target.scene.characters_present = [...meta.scene.characters_present];
        }
    }

    const importedEvents = [];
    if (includeTimeline) {
        // 导入所有事件（含摘要事件），保留 _compressedBy / _summaryId 引用
        for (const meta of allMetas) {
            if (!meta.events?.length) continue;
            for (const evt of meta.events) {
                importedEvents.push({ ...evt });
            }
        }
        if (importedEvents.length > 0) {
            if (!target.events) target.events = [];
            target.events.push(...importedEvents);
        }

        // 导入自动摘要记录（来自源数据的 chat[0]）
        const srcFirstMeta = allMetas[0];
        if (srcFirstMeta?.autoSummaries?.length) {
            target.autoSummaries = srcFirstMeta.autoSummaries.map(s => ({ ...s }));
        }
    }

    // 关系网络
    const finalRels = [];
    for (const meta of allMetas) {
        if (meta.relationships?.length) {
            for (const r of meta.relationships) {
                const existing = finalRels.find(e => e.source === r.source && e.target === r.target);
                if (existing) Object.assign(existing, r);
                else finalRels.push({ ...r });
            }
        }
    }
    if (finalRels.length > 0) target.relationships = finalRels;

    // RPG 数据
    for (const meta of allMetas) {
        if (meta.rpg) {
            if (!target.rpg) target.rpg = {};
            for (const sub of ['bars', 'status', 'skills', 'attributes', 'reputation', 'levels', 'xp', 'currency', 'equipment']) {
                if (meta.rpg[sub]) {
                    if (!target.rpg[sub]) target.rpg[sub] = {};
                    Object.assign(target.rpg[sub], meta.rpg[sub]);
                }
            }
            if (meta.rpg.reputationConfig) target.rpg.reputationConfig = JSON.parse(JSON.stringify(meta.rpg.reputationConfig));
            if (meta.rpg.equipmentConfig) target.rpg.equipmentConfig = JSON.parse(JSON.stringify(meta.rpg.equipmentConfig));
            if (meta.rpg.currencyConfig) target.rpg.currencyConfig = JSON.parse(JSON.stringify(meta.rpg.currencyConfig));
            if (meta.rpg.strongholds?.length) target.rpg.strongholds = JSON.parse(JSON.stringify(meta.rpg.strongholds));
            if (meta.rpg._deletedSkills?.length) {
                if (!target.rpg._deletedSkills) target.rpg._deletedSkills = [];
                for (const d of meta.rpg._deletedSkills) {
                    if (!target.rpg._deletedSkills.some(e => e.owner === d.owner && e.name === d.name)) {
                        target.rpg._deletedSkills.push({ ...d });
                    }
                }
            }
            if (meta.rpg._deletedStrongholds?.length) {
                if (!target.rpg._deletedStrongholds) target.rpg._deletedStrongholds = [];
                for (const d of meta.rpg._deletedStrongholds) {
                    if (!target.rpg._deletedStrongholds.some(e => e.name === d.name && e.parent === d.parent)) {
                        target.rpg._deletedStrongholds.push({ ...d });
                    }
                }
            }
        }
        // 兼容：导入的数据可能在 _rpgConfigs 中
        if (meta._rpgConfigs) {
            if (!target._rpgConfigs) target._rpgConfigs = {};
            for (const ck of ['reputationConfig', 'equipmentConfig', 'currencyConfig', '_deletedSkills', 'strongholds', '_deletedStrongholds']) {
                if (meta._rpgConfigs[ck]) target._rpgConfigs[ck] = JSON.parse(JSON.stringify(meta._rpgConfigs[ck]));
            }
        }
    }

    // 将 rpg 内嵌的 config 回填到 _rpgConfigs（仅当 _rpgConfigs 缺失时）
    if (target.rpg) {
        if (!target._rpgConfigs) target._rpgConfigs = {};
        if (target.rpg.reputationConfig && !target._rpgConfigs.reputationConfig)
            target._rpgConfigs.reputationConfig = target.rpg.reputationConfig;
        if (target.rpg.equipmentConfig && !target._rpgConfigs.equipmentConfig)
            target._rpgConfigs.equipmentConfig = target.rpg.equipmentConfig;
        if (target.rpg.currencyConfig && !target._rpgConfigs.currencyConfig)
            target._rpgConfigs.currencyConfig = target.rpg.currencyConfig;
        if (target.rpg._deletedSkills && !target._rpgConfigs._deletedSkills)
            target._rpgConfigs._deletedSkills = target.rpg._deletedSkills;
        if (target.rpg.strongholds && !target._rpgConfigs.strongholds)
            target._rpgConfigs.strongholds = target.rpg.strongholds;
        if (target.rpg._deletedStrongholds && !target._rpgConfigs._deletedStrongholds)
            target._rpgConfigs._deletedStrongholds = target.rpg._deletedStrongholds;
    }

    // 自定义表格
    for (const meta of allMetas) {
        if (meta.tableContributions) {
            if (!target.tableContributions) target.tableContributions = {};
            Object.assign(target.tableContributions, meta.tableContributions);
        }
    }

    // 场景记忆
    for (const meta of allMetas) {
        if (meta.locationMemory) {
            if (!target.locationMemory) target.locationMemory = {};
            Object.assign(target.locationMemory, meta.locationMemory);
        }
    }

    // 悬念簿
    const seenAgenda = new Set();
    for (const meta of allMetas) {
        if (meta.agenda?.length) {
            if (!target.agenda) target.agenda = [];
            for (const item of meta.agenda) {
                if (!seenAgenda.has(item.text)) {
                    target.agenda.push({ ...item, type: horaeManager.normalizeAgendaType(item.type) });
                    seenAgenda.add(item.text);
                }
            }
        }
    }

    // 处理已删除物品
    for (const meta of allMetas) {
        if (meta.deletedItems?.length) {
            for (const name of meta.deletedItems) {
                if (target.items?.[name]) delete target.items[name];
            }
        }
    }

    const npcCount = Object.keys(target.npcs || {}).length;
    const itemCount = Object.keys(target.items || {}).length;
    const eventCount = importedEvents.length;
    const summaryCount = target.autoSummaries?.length || 0;
    console.log(`[Horae] 导入初始状态: ${npcCount} NPC, ${itemCount} 物品, ${eventCount} 事件, ${summaryCount} 摘要`);
}

/**
 * 清除所有数据
 */
async function clearAllData() {
    if (!confirm(t('confirm.clearAllMeta'))) {
        return;
    }

    const chat = horaeManager.getChat();
    for (const msg of chat) {
        delete msg.horae_meta;
    }

    await getContext().saveChat();
    showToast(t('toast.settingsRestored'), 'warning');
    refreshAllDisplays();
}

/**
 * AI任务生成入口
 * @param {string} prompt
 * @param {{ messageIndex?: number, noVectorRecallMarker?: boolean, noContextInjectionMarker?: boolean, noTimelineInjectionMarker?: boolean, noSystemPromptInjectionMarker?: boolean, injectCustomPrompts?: boolean }} opts
 */
async function _generateForAiTasks(prompt, opts = {}) {
    const {
        taskType = '',
        messageIndex = null,
        noVectorRecallMarker = false,
        noContextInjectionMarker = false,
        noTimelineInjectionMarker = false,
        noSystemPromptInjectionMarker = false,
    } = opts;
    const shouldStream = _shouldStreamSummaryTasks();
    const skipSnapshotTimelineInjection = taskType === 'autoSummary';
    const customPromptInjection = _getCustomPromptInjectionParts(taskType, opts);
    const orderedPrompts = [];
    const skipInjectionMarkers = [
        _createNoContextInjectionMarker(),
        _createNoTimelineInjectionMarker(),
        _createNoVectorRecallMarker(),
        _createNoSystemPromptInjectionMarker(),
    ].join('\n');
    // generateRaw 的 user_input 在 prompt-ready 阶段不一定落到 eventData.chat[].content，
    // 所以把 marker 明确作为 system prompt 放进 ordered_prompts，确保 onPromptReady 能识别并短路。
    orderedPrompts.push({ role: 'system', content: skipInjectionMarkers });
    _pushSystemPromptIfAny(orderedPrompts, customPromptInjection.head);

    if (!skipSnapshotTimelineInjection) {
        console.log(`分析的楼层:${messageIndex}`);
        const promptSplit = _buildPromptSplitBeforeMessage(messageIndex);
        const snapshotPrompt = _getSnapshotPromptBeforeMessage(messageIndex, promptSplit);
        const timelinePrompt = _getTimelinePromptBeforeMessage(messageIndex, promptSplit);

        if (timelinePrompt?.trim()) orderedPrompts.push({ role: 'system', content: timelinePrompt.trim() });
        if (snapshotPrompt?.trim()) orderedPrompts.push({ role: 'system', content: snapshotPrompt.trim() });
    } else {
        console.log('[Horae] autoSummary task: skip snapshot/timeline ordered_prompts injection');
    }

    orderedPrompts.push('user_input');

    // 摘要才注入思维链
    if (taskType === "brief") {
        orderedPrompts.push({
            role: 'system', content: `【格式字面性声明】
<horae> 内每一行的结构是：字段名 + 英文冒号 + 值。
- 字段名（time、location、characters、costume、item、item!、item!!、item-、
  affection、npc、hold、hold-、event）必须原样英文输出，不得翻译为中文。
- 字段名与值之间的分隔符固定为英文冒号 :，不得替换为中文冒号 ：、竖线 |、
  等号 =、方括号包裹或其他任何形式。
- 值的内部分隔符（| = @ ~）按各字段原定义使用，不在本条限制内。

正确：
  time:1988/1/1 10:11
  hold:计划|1988/1/1 21:00|明早九点起床后去逛街(1988/1/2 09:00)
  hold:悬念|1988/1/1 23:00|黑袍人警告"三日后再见"，来历不明
  hold-:明早九点起床后去逛街(1988/1/2 09:00)
  hold-:黑袍人警告"三日后再见"，来历不明
  event:关键|U在酒馆向艾伦打听黑市商人下落，递出10金币后得知商人明晚在废弃码头出现。

错误：
  [时间|1988/1/1 10:11]
  time：1988/1/1 10:11
  [time] 1988/1/1 10:11
  event|关键|...（字段名后用了竖线而不是冒号）
  hold:威胁|...（类型只有"计划"和"悬念"，不存在其他类型名）
  hold-:计划|1988/1/1|黑袍人警告...（hold- 只能填写待核销正文，不带类型和订立日期）

【输出前思考】
在输出 <horae> 之前，先在 <thinking> 标签内完成分析，覆盖以下判断点（顺序和措辞自由）：

1. 本楼核心事件
   - 时间、地点、在场角色相比参考状态有无变化？
   - 用一两句话概括这一楼发生了什么。

2. 物品清点（对照参考状态逐一核对）
   - 本楼有无角色主动获取/消耗/丢弃符合记录标准的物品？
   - 参考状态里的物品是否被用完/损坏？需要时准备 item-。
   - 排除：临时日用品、环境道具、服装、普通食物。
   - 无变动则明确说"无物品变动"。

3. 悬念簿清算（分两步，先计划后悬念）
   - 列出参考状态悬念簿里所有"计划"条目。
   - 逐条判断：当前时间是否已越过其截止时间？是否被执行/取消？
   - 需核销的，只把待核销条目的正文部分逐字抄下来准备 hold-。
   - 新产生的计划，检查是否与现存条目重复或需要合并。
   - 列出参考状态悬念簿里所有"悬念"条目。
   - 逐条判断：该悬念是否已被解决、揭露、推翻、或彻底不可能再发生？
   - 只有完全解决/失效才能核销；有新进展但未解决时，用 hold- 旧条目 + hold 新条目。

4. NPC 与好感度
   - 有无新角色首次登场？
   - 现有 NPC 的关系/好感度是否被明文推动？（无明文描写不动）

5. event 融合判断
   - 本楼有几个值得记录的事件片段？若多于一个，现在就决定如何串联成一条。
   - 确认 event 写入 <horaeevent>，不会出现在 <horae> 内。

6. event 收笔位置确认
   - 【待分析文本】在哪个动作/对话处停止？我用一句自己的话概括最后发生了什么。
   - 我准备写的 event 最后一句，是否超出了原文最后一句的范围？
   - 若超出，裁掉多余部分。

7. 格式自检
   - 所有必填字段（time/location/characters/costume）是否齐全？
   - hold- 的文本是否逐字复制而非改写？
   - event 是否控制在 80-150 字、监控视角、无文学修饰？

思考结束后直接输出 <horae> 和 <horaeevent>，不要在两者之间插入任何解释。
` });

        orderedPrompts.push({
            role: 'assistant', content: `<thinking>
收到，我按检查点梳理，然后严格按 "英文字段名:值" 的字面语法输出。
字段名不翻译、字段名后只用英文冒号，值内部的 | = @ ~ 保持原定义。
event 唯一且只放在 <horaeevent> 内。

1. 本楼核心事件：` });
    }

    _pushSystemPromptIfAny(orderedPrompts, customPromptInjection.tail);

    const resp = await TavernHelper.generateRaw({
        user_input: prompt,
        ordered_prompts: orderedPrompts,
        should_stream: shouldStream
    })

    return resp;
}

/** 使用AI分析消息内容（支持轻量上下文 + 上一条 USER 行动 + 角色身份） */
async function analyzeMessageWithAI(messageContent, opts = {}) {
    const {
        messageIndex,
        noContextInjectionMarker = false,
        noVectorRecallMarker = true,
        noTimelineInjectionMarker = true,
        noSystemPromptInjectionMarker = true,
    } = opts;
    const context = getContext();
    const userName = context?.name1 || t('ui.protagonist');

    let contextText = '';
    let previousUserMessage = '';

    if (typeof messageIndex === 'number' && messageIndex >= 0) {
        const chat = horaeManager.getChat();
        if (chat?.length) {
            const skipLast = Math.max(0, chat.length - messageIndex);
            const stateBeforeTarget = horaeManager.getLatestState(skipLast);
            contextText = _buildAnalysisContext(stateBeforeTarget, messageIndex, userName);

            for (let i = messageIndex - 1; i >= Math.max(0, messageIndex - 3); i--) {
                if (chat[i]?.is_user) {
                    previousUserMessage = _stripConfiguredTags(chat[i].mes || '')
                        .replace(/<horae>[\s\S]*?<\/horae>/gi, '')
                        .replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, '')
                        .trim();
                    if (previousUserMessage.length > 2000) previousUserMessage = previousUserMessage.slice(0, 2000) + '…';
                    break;
                }
            }
        }
    }

    // 去除正文里面的horae标签，避免AI照抄
    messageContent = messageContent
        .replace(/<horae>[\s\S]*?<\/horae>/gi, '')
        .replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, '')
        .replace(/<safe>/g, '')
        .replace(/[\r\n]+/g, '');

    const template = settings.customAnalysisPrompt || getDefaultAnalysisPrompt();
    const analysisLocationRules = settings.sendLocationMemory ? (horaeManager.generateLocationMemoryPrompt() || '') : '';
    const analysisRelationshipRules = settings.sendRelationships ? (horaeManager.generateRelationshipPrompt() || '') : '';
    const analysisEmotionRules = settings.sendMood ? (horaeManager.generateMoodPrompt() || '') : '';
    const analysisTableRules = horaeManager.generateCustomTablesPrompt() || '';
    let analysisPrompt = template
        .replace(/\{\{user\}\}/gi, userName)
        .replace(/\{\{context\}\}/gi, contextText)
        .replace(/\{\{previousUserMessage\}\}/gi, previousUserMessage)
        .replace(/\{\{content\}\}/gi, messageContent)
        .replace(/\{\{analysis_location_rules\}\}/gi, analysisLocationRules)
        .replace(/\{\{analysis_relationship_rules\}\}/gi, analysisRelationshipRules)
        .replace(/\{\{analysis_emotion_rules\}\}/gi, analysisEmotionRules)
        .replace(/\{\{analysis_table_rules\}\}/gi, analysisTableRules);

    // 去除无用内容
    analysisPrompt = analysisPrompt
        .replace(/<think(?:ing)?[\s>][\s\S]*?<\/think(?:ing)?>/gi, '')
        .replace(/<!--horae[\s\S]*?-->/gi, '')
        .replace(/<!--[\s\S]+?-->/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    try {
        const shouldMarkNoRecall = typeof noVectorRecallMarker === 'boolean'
            ? noVectorRecallMarker
            : !!(
                context?.mainApi === 'openai' &&
                settings.injectContext &&
                settings.vectorEnabled
            );
        console.log(`[Horae] 使用generateForSummary`)
        const response = await generateForSummary(analysisPrompt, {
            taskType: 'brief',
            messageIndex,
            noVectorRecallMarker: shouldMarkNoRecall,
            noContextInjectionMarker: !!noContextInjectionMarker,
            // noTimelineInjectionMarker: !!noTimelineInjectionMarker,
            noTimelineInjectionMarker: false,
            noSystemPromptInjectionMarker: !!noSystemPromptInjectionMarker,
        });

        if (response) {
            console.log(`AI分析结果:\n${response}`);
            const parsed = horaeManager.parseHoraeTag(response);
            return parsed;
        }
    } catch (error) {
        console.error('[Horae] AI分析调用失败:', error);
        throw error;
    }

    return null;
}

function _buildAnalysisContext(state, targetIndex, userName) {
    const lines = [];
    if (userName) lines.push(`- user: ${userName}`);
    const dateTime = [state?.timestamp?.story_date, state?.timestamp?.story_time].filter(Boolean).join(' ');
    if (dateTime) lines.push(`- time: ${dateTime}`);
    if (state?.scene?.location) lines.push(`- location: ${state.scene.location}`);
    if (state?.scene?.atmosphere) lines.push(`- atmosphere: ${state.scene.atmosphere}`);

    const present = state?.scene?.characters_present || [];
    if (present.length > 0) {
        const costumes = state?.costumes || {};
        const charText = present
            .slice(0, 12)
            .map(name => costumes[name] ? `${name}（${costumes[name]}）` : name)
            .join('、');
        lines.push(`- characters: ${charText}`);
    }

    const npcNames = Object.keys(state?.npcs || {});
    if (npcNames.length > 0) {
        const npcText = npcNames.slice(0, 15).map(name => {
            const npc = state.npcs[name];
            const rel = npc?.relationship || '';
            return rel ? `${name}(${rel})` : name;
        }).join('、');
        lines.push(`- npcs: ${npcText}`);
    }

    const items = Object.entries(state?.items || {}).slice(0, 20);
    if (items.length > 0) {
        const itemText = items.map(([name, info]) => {
            const holder = info?.holder ? `=${info.holder}` : '';
            const loc = info?.location ? `@${info.location}` : '';
            return `${info?.icon || ''}${name}${holder}${loc}`;
        }).join('；');
        lines.push(`- items: ${itemText}`);
    }

    const mood = Object.entries(state?.mood || {}).filter(([name]) => present.includes(name)).slice(0, 12);
    if (mood.length > 0) {
        lines.push(`- mood: ${mood.map(([name, val]) => `${name}:${val}`).join('；')}`);
    }

    return lines.join('\n');
}

/**
 * 发送前补齐上一条AI楼层：缺 horae/horaeevent 时触发。
 * 使用上下文增强的 analyzeMessageWithAI 进行完整分析（含轻量状态 + 上一条 USER 行动 + 角色身份），
 * 并通过 mergeParsedToMeta 写回所有已提取字段。
 * 只在「最后一条是USER消息」时触发，避免干扰 regenerate/swipe。
 */
async function _autoFillPreviousAiTimelineBeforeInjection(chat) {
    if (!settings.autoFillPrevTimelineOnSend) return;
    if (settings.sendTimeline === false) return;
    if (!Array.isArray(chat) || chat.length < 2) return;

    const lastIndex = chat.length - 1;
    const lastMsg = chat[lastIndex];
    if (!lastMsg?.is_user) return;

    let targetIndex = -1;
    for (let i = lastIndex - 1; i >= 0; i--) {
        const msg = chat[i];
        if (!msg || msg.is_user) continue;
        if (msg.horae_meta?._skipHorae) continue;
        targetIndex = i;
        break;
    }

    if (targetIndex < 0) return;

    const targetMsg = chat[targetIndex];
    const existingMeta = horaeManager.getMessageMeta(targetIndex) || createEmptyMeta();
    const existingEvents = Array.isArray(existingMeta.events)
        ? existingMeta.events
        : (existingMeta.event ? [existingMeta.event] : []);
    const hasTimeline = existingEvents.some(evt => evt?.summary && String(evt.summary).trim());
    if (hasTimeline) return;

    const sourceText = typeof targetMsg?.mes === 'string' ? targetMsg.mes.trim() : '';
    if (!sourceText) return;

    const cleanedTargetText = _stripConfiguredTags(sourceText)
        .replace(/<horae>[\s\S]*?<\/horae>/gi, '')
        .replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, '')
        .trim();
    const targetTextForAnalysis = cleanedTargetText || sourceText;

    console.log(`[Horae] 前置补全：检测到上一条AI楼层 #${targetIndex} 缺少时间线，尝试上下文增强分析`);
    showToast(t('toast.autoFillPrevTimelineStart', { id: targetIndex }), 'info');
    const autoFillFailedToast = '补全失败,请手动重试';

    let parsed = horaeManager.parseHoraeTag(sourceText);
    if (!parsed) {
        parsed = horaeManager.parseLooseFormat(sourceText);
    }
    const parsedEvents = Array.isArray(parsed?.events)
        ? parsed.events.filter(evt => evt?.summary && String(evt.summary).trim())
        : [];
    if (!parsed || parsedEvents.length === 0) {
        try {
            parsed = await analyzeMessageWithAI(targetTextForAnalysis, {
                messageIndex: targetIndex,
                noVectorRecallMarker: true,
                noTimelineInjectionMarker: true,
                noSystemPromptInjectionMarker: true,
            });
        } catch (err) {
            console.warn(`[Horae] 前置补全失败 #${targetIndex}:`, err);
            showToast(autoFillFailedToast, 'error');
            return;
        }
    }
    if (!parsed) {
        showToast(autoFillFailedToast, 'error');
        return;
    }

    const mergedMeta = horaeManager.mergeParsedToMeta(existingMeta, parsed);
    const mergedEvents = Array.isArray(mergedMeta?.events)
        ? mergedMeta.events.filter(evt => evt?.summary && String(evt.summary).trim())
        : [];
    if (mergedEvents.length === 0) {
        console.log(`[Horae] 前置补全跳过：#${targetIndex} 未提取到有效事件摘要`);
        showToast(autoFillFailedToast, 'error');
        return;
    }

    if (mergedMeta._tableUpdates) {
        horaeManager.applyTableUpdates(mergedMeta._tableUpdates);
        delete mergedMeta._tableUpdates;
    }
    if (parsed.deletedAgenda?.length > 0) {
        horaeManager.removeCompletedAgenda(parsed.deletedAgenda);
    }
    if (parsed.relationships?.length > 0) {
        horaeManager._mergeRelationships(parsed.relationships);
    }
    if (parsed.scene?.scene_desc && parsed.scene?.location) {
        horaeManager._updateLocationMemory(parsed.scene.location, parsed.scene.scene_desc);
    }

    horaeManager.setMessageMeta(targetIndex, mergedMeta);
    injectHoraeTagToMessage(targetIndex, mergedMeta);

    // 仅刷新目标楼层面板，避免全局刷新带来的卡顿
    try {
        const messageEl = document.querySelector(`.mes[mesid="${targetIndex}"]`);
        if (messageEl) {
            const oldPanel = messageEl.querySelector('.horae-message-panel');
            if (oldPanel) oldPanel.remove();
            addMessagePanel(messageEl, targetIndex);
            messageEl.classList.add('horae-processed');
        }
    } catch (err) {
        console.warn(`[Horae] 前置补全面板刷新失败 #${targetIndex}:`, err);
    }

    try {
        await getContext().saveChat();
    } catch (err) {
        console.warn('[Horae] 前置补全保存失败:', err);
        showToast(autoFillFailedToast, 'error');
        return;
    }

    console.log(`[Horae] 前置补全完成：已写回上一条AI楼层 #${targetIndex} 的完整解析结果`);
    // showToast(t('toast.autoFillPrevTimelineDone', { id: targetIndex }), 'success');
    return targetIndex;
}

// ============================================
// 数据层清理
// ============================================

/**
 * 将 <think>/<thinking> 块内残留的 horae 标签转为全角括号，
 * 防止酒馆原生收束思维链时因标签边界误判而贪婪吞掉正文。
 * 直接修改 message.mes，从数据源彻底消除隐患。
 */
function _sanitizeThinkBlockHoraeTags(mes) {
    if (!mes) return mes;
    return mes.replace(/<think(?:ing)?([\s>][\s\S]*?)<\/think(?:ing)?>/gi, (block) => {
        return block.replace(/<(\/?horae(?:event|rpg|table[^>]*)?)>/gi, '‹$1›');
    });
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

    let isRegenerate = false;
    try {
        const chat = horaeManager.getChat();
        const message = chat[messageId];

        if (!message || message.is_user) return;

        if (message.horae_meta?._skipHorae) return;

        // 数据层清理：将思维链内的 horae 标签转为全角，防止酒馆收束时误吞正文
        const sanitized = _sanitizeThinkBlockHoraeTags(message.mes);
        if (sanitized !== message.mes) {
            message.mes = sanitized;
        }

        const hasExistingMeta = !!(message.horae_meta?.timestamp?.absolute);

        // 判断是否为历史消息渲染（非新消息、非当前最新消息的重生成）
        // CHARACTER_MESSAGE_RENDERED 会为所有已有消息触发，包括页面加载和滚动加载
        if (hasExistingMeta && messageId < chat.length - 1) {
            return;
        }

        isRegenerate = hasExistingMeta;
        let savedFlags = null;
        let savedGlobal = null;
        if (isRegenerate) {
            savedFlags = _saveCompressedFlags(message.horae_meta);
            if (messageId === 0) savedGlobal = _saveGlobalMeta(message.horae_meta);
            message.horae_meta = createEmptyMeta();
        }

        horaeManager.processAIResponse(messageId, message.mes);

        if (isRegenerate) {
            _restoreCompressedFlags(message.horae_meta, savedFlags);
            if (savedGlobal) _restoreGlobalMeta(message.horae_meta, savedGlobal);
            horaeManager.rebuildTableData();
            horaeManager.rebuildRelationships();
            horaeManager.rebuildLocationMemory();
            horaeManager.rebuildRpgData();
        }

        if (!_summaryInProgress) {
            await getContext().saveChat();
        }
    } catch (err) {
        console.error(`[Horae] onMessageReceived 处理消息 #${messageId} 失败:`, err);
    }

    // 无论上面是否出错，面板渲染和显示刷新必须执行
    try {
        refreshAllDisplays();
        renderCustomTablesList();
    } catch (err) {
        console.error('[Horae] refreshAllDisplays 失败:', err);
    }

    setTimeout(() => {
        try {
            const messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
            if (messageEl) {
                const oldPanel = messageEl.querySelector('.horae-message-panel');
                if (oldPanel) oldPanel.remove();
                addMessagePanel(messageEl, messageId);
            }
        } catch (err) {
            console.error(`[Horae] 面板渲染 #${messageId} 失败:`, err);
        }
    }, 100);

    if (settings.vectorEnabled && vectorManager.isReady) {
        try {
            const meta = horaeManager.getMessageMeta(messageId);
            if (meta) {
                vectorManager.addMessage(messageId, meta).then(() => {
                    _updateVectorStatus();
                }).catch(err => console.warn('[Horae] 向量索引失败:', err));
            }
        } catch (err) {
            console.warn('[Horae] 向量处理失败:', err);
        }
    }

    if (!isRegenerate && settings.enabled && settings.autoSummaryEnabled && settings.sendTimeline) {
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
async function onMessageDeleted() {
    if (!settings.enabled) return;

    try {
        horaeManager.rebuildTableData();
        horaeManager.rebuildRelationships();
        horaeManager.rebuildLocationMemory();
        horaeManager.rebuildRpgData();

        const chat = horaeManager.getChat();
        if (settings.autoSummaryEnabled && settings.sendTimeline) {
            const keepRecent = Math.max(0, parseInt(settings.autoSummaryKeepRecent, 10) || 10);
            const activeCovered = _collectActiveSummaryCoveredIndices(chat);
            await _reconcileAutoBufferVisibilityByKeepRecent(chat, keepRecent, activeCovered);
        }

        await getContext().saveChat();
    } catch (err) {
        console.error('[Horae] onMessageDeleted 失败:', err);
    }

    refreshAllDisplays();
    renderCustomTablesList();
}

/**
 * 消息编辑时触发 — 重新解析该消息并重建表格
 * 延迟执行以确保 SillyTavern 自身的 post-edit 处理（updateMessage、refreshSwipeButtons 等）完成
 */
function onMessageEdited(messageId) {
    if (!settings.enabled) return;

    setTimeout(() => {
        try {
            const chat = horaeManager.getChat();
            const message = chat[messageId];
            if (!message || message.is_user) return;

            const savedFlags = _saveCompressedFlags(message.horae_meta);
            const savedGlobal = messageId === 0 ? _saveGlobalMeta(message.horae_meta) : null;
            message.horae_meta = createEmptyMeta();

            horaeManager.processAIResponse(messageId, message.mes);
            _restoreCompressedFlags(message.horae_meta, savedFlags);
            if (savedGlobal) _restoreGlobalMeta(message.horae_meta, savedGlobal);

            horaeManager.rebuildTableData();
            horaeManager.rebuildRelationships();
            horaeManager.rebuildLocationMemory();
            horaeManager.rebuildRpgData();
            getContext().saveChat();

            refreshAllDisplays();
            renderCustomTablesList();

            if (settings.showMessagePanel) {
                const messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
                if (messageEl) {
                    const oldPanel = messageEl.querySelector('.horae-message-panel');
                    if (oldPanel) oldPanel.remove();
                    addMessagePanel(messageEl, messageId);
                }
            }

            if (settings.vectorEnabled && vectorManager.isReady) {
                const meta = horaeManager.getMessageMeta(messageId);
                if (meta) {
                    vectorManager.addMessage(messageId, meta).catch(err =>
                        console.warn('[Horae] 向量重建失败:', err));
                }
            }
        } catch (err) {
            console.error(`[Horae] onMessageEdited #${messageId} 失败:`, err);
        }
    }, 200);
}

/**
 * 仅归一化用于 chat<->prompt 对位匹配
 */
function _normalizePromptMessageText(text) {
    if (!text) return '';
    return String(text)
        .replace(/<think[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking[\s\S]*?<\/thinking>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[\[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * 判断 chat.mes 与 eventData.chat.content 是否可视为同一条消息
 */
function _isLikelySameChatMessage(chatMes, promptContent) {
    const a = _normalizePromptMessageText(chatMes);
    const b = _normalizePromptMessageText(promptContent);
    if (!a || !b) return false;
    if (a === b) return true;

    const shortText = a.length <= b.length ? a : b;
    const longText = a.length <= b.length ? b : a;

    // 兼容被裁剪/包装后的内容
    if (shortText.length >= 48 && longText.includes(shortText)) return true;

    const probeLen = Math.min(80, shortText.length);
    if (probeLen >= 32) {
        const head = shortText.slice(0, probeLen);
        const tail = shortText.slice(-probeLen);
        if (longText.includes(head) && longText.includes(tail)) return true;
    }

    return false;
}

/**
 * 旧策略：仅按 eventData.chat 中 user/assistant 倒序计数
 */
function _resolveInsertIndexByPromptTurns(promptChat, position) {
    if (position === 0) {
        for (let i = promptChat.length - 1; i >= 0; i--) {
            if (promptChat[i].role === 'user' || promptChat[i].role === 'assistant') {
                return i + 1;
            }
        }
        return promptChat.length;
    }
    let count = 0;
    let insertIdx = promptChat.length;
    for (let i = promptChat.length - 1; i >= 0; i--) {
        if (promptChat[i].role === 'user' || promptChat[i].role === 'assistant') {
            count++;
            if (count >= position) {
                insertIdx = i;
                break;
            }
        }
    }
    return insertIdx;
}

/**
 * 以原始 chat 为基准定位注入点：
 * 1) 先把 chat 与 eventData.chat 的消息做尾部对位
 * 2) 再按 chat 的倒序第 position 条消息映射到 eventData.chat
 * 3) 对位失败时回退到旧策略
 */
function _resolveInsertIndexByChatAnchor(chat, promptChat, position) {
    if (!Array.isArray(promptChat) || promptChat.length === 0) return 0;
    if (!Array.isArray(chat) || chat.length === 0) return _resolveInsertIndexByPromptTurns(promptChat, position);

    const turnChatIndices = [];
    for (let i = 0; i < chat.length; i++) {
        const msg = chat[i];
        if (!msg) continue;
        if (typeof msg.is_user !== 'boolean') continue;
        turnChatIndices.push(i);
    }
    if (turnChatIndices.length === 0) return _resolveInsertIndexByPromptTurns(promptChat, position);

    const insertAfterLastTurn = position === 0;
    const targetListPos = insertAfterLastTurn
        ? (turnChatIndices.length - 1)
        : (turnChatIndices.length - position);
    const targetChatIdx = targetListPos >= 0 ? turnChatIndices[targetListPos] : turnChatIndices[0];

    // 从尾部开始做 role+内容匹配，避免误把前置示例对话当成真实 chat
    const mapped = new Map(); // chatIndex -> promptIndex
    let p = promptChat.length - 1;
    for (let c = chat.length - 1; c >= 0 && p >= 0; c--) {
        const msg = chat[c];
        if (!msg || typeof msg.is_user !== 'boolean') continue;

        const expectedRole = msg.is_user ? 'user' : 'assistant';
        let found = -1;
        for (let i = p; i >= 0; i--) {
            const row = promptChat[i];
            if (!row || (row.role !== 'user' && row.role !== 'assistant')) continue;
            if (row.role !== expectedRole) continue;
            if (_isLikelySameChatMessage(msg.mes || '', row.content || '')) {
                found = i;
                break;
            }
        }
        if (found !== -1) {
            mapped.set(c, found);
            p = found - 1;
        }
    }

    if (mapped.size === 0) {
        return _resolveInsertIndexByPromptTurns(promptChat, position);
    }

    if (insertAfterLastTurn) {
        if (mapped.has(targetChatIdx)) return Math.min(mapped.get(targetChatIdx) + 1, promptChat.length);
        const mappedPairs = Array.from(mapped.entries()).sort((a, b) => a[0] - b[0]);
        return Math.min(mappedPairs[mappedPairs.length - 1][1] + 1, promptChat.length);
    }

    // 精确命中
    if (mapped.has(targetChatIdx)) return mapped.get(targetChatIdx);

    // 近似：找“目标 chat 楼层及其之后”最早一个已映射楼层，在其前面插入
    const mappedPairs = Array.from(mapped.entries()).sort((a, b) => a[0] - b[0]);
    for (const [chatIdx, promptIdx] of mappedPairs) {
        if (chatIdx >= targetChatIdx) return promptIdx;
    }

    // 兜底：目标比所有已映射都新（极少见），插在最后一个映射楼层前
    return mappedPairs[mappedPairs.length - 1][1];
}

/**
 * 收集“已经在 prompt 中出现”的 chat 楼层索引，用于向量召回去重。
 * 通过从尾部开始的 role+内容匹配，将 eventData.chat 对位回原始 chat。
 */
function _collectPromptCoveredChatIndices(chat, promptChat) {
    const covered = new Set();
    if (!Array.isArray(chat) || !Array.isArray(promptChat) || chat.length === 0 || promptChat.length === 0) {
        return covered;
    }

    let p = promptChat.length - 1;
    for (let c = chat.length - 1; c >= 0 && p >= 0; c--) {
        const msg = chat[c];
        if (!msg || typeof msg.is_user !== 'boolean') continue;

        const expectedRole = msg.is_user ? 'user' : 'assistant';
        let found = -1;
        for (let i = p; i >= 0; i--) {
            const row = promptChat[i];
            if (!row || (row.role !== 'user' && row.role !== 'assistant')) continue;
            if (row.role !== expectedRole) continue;
            if (_isLikelySameChatMessage(msg.mes || '', row.content || '')) {
                found = i;
                break;
            }
        }
        if (found !== -1) {
            covered.add(c);
            p = found - 1;
        }
    }
    return covered;
}

/** 注入上下文（数据+规则合并注入） */
/**
 * Split Story Timeline section from compact data prompt for independent injection.
 */
function _splitTimelineSection(promptText) {
    if (!promptText) return { mainPrompt: '', timelinePrompt: '' };

    const lines = String(promptText).split('\n');
    const sectionHeaderRe = /^\[[^\]\n|]+\](?:\([^\n]*\))?$/;
    const timelineEntryRe = /^(?:\S+\s+#\d+\s+.+:\s+|\S+\s+\[[^\]]+\]:\s+)/u;

    let timelineStart = -1;
    let timelineEnd = lines.length;
    for (let i = 0; i < lines.length; i++) {
        const header = lines[i].trim();
        if (!header || !sectionHeaderRe.test(header)) continue;

        let end = lines.length;
        for (let j = i + 1; j < lines.length; j++) {
            const lineText = lines[j].trim();
            if (lineText && sectionHeaderRe.test(lineText)) {
                end = j;
                break;
            }
        }

        const block = lines.slice(i + 1, end);
        if (block.some(line => timelineEntryRe.test(line.trim()))) {
            timelineStart = i;
            timelineEnd = end;
            break;
        }
    }

    if (timelineStart === -1) {
        return { mainPrompt: promptText, timelinePrompt: '' };
    }

    let cutStart = timelineStart;
    while (cutStart > 0 && lines[cutStart - 1].trim() === '') {
        cutStart--;
    }

    const timelinePrompt = lines.slice(timelineStart, timelineEnd).join('\n').trim();
    const mainLines = [...lines.slice(0, cutStart), ...lines.slice(timelineEnd)];
    const mainPrompt = mainLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    return { mainPrompt, timelinePrompt };
}

/**
 * Resolve skipLast from analysis target message index.
 * The returned skipLast makes compact prompt include only messages before target message.
 */
function _resolveSkipLastBeforeMessage(messageIndex) {
    const chat = horaeManager.getChat();
    const chatLength = Array.isArray(chat) ? chat.length : 0;
    if (chatLength <= 0) return 0;
    if (!Number.isInteger(messageIndex) || messageIndex < 0) return 0;

    const clampedIndex = Math.min(messageIndex, chatLength);
    return Math.max(0, chatLength - clampedIndex);
}

/**
 * Build raw story timeline from all events before target index.
 * This path intentionally bypasses generateCompactPrompt timeline filtering rules.
 */
function _buildRawTimelinePromptBySkipLast(skipLast) {
    const events = horaeManager.getEvents(0, 'all', skipLast) || [];
    if (!events.length) return '';

    const lines = ['[剧情轨迹]'];
    for (const row of events) {
        const summary = String(row?.event?.summary || '').replace(/\s+/g, ' ').trim();
        if (!summary) continue;

        const msgNum = Number.isInteger(row?.messageIndex) ? `#${row.messageIndex}` : '#?';
        const date = row?.timestamp?.story_date || '?';
        const time = row?.timestamp?.story_time || '';
        const timeStr = time ? `${date} ${time}` : date;
        lines.push(`● ${msgNum} ${timeStr}: ${summary}`);
    }

    return lines.length > 1 ? lines.join('\n').trim() : '';
}

/**
 * Build snapshot/timeline split prompt before a target message.
 * If messageIndex is invalid, fallback to current behavior (full latest prompt).
 */
function _buildPromptSplitBeforeMessage(messageIndex) {
    const skipLast = _resolveSkipLastBeforeMessage(messageIndex);
    const snapshotPrompt = horaeManager.generateCompactPrompt(skipLast, { includeTimeline: false, noStatusHead: true });
    const timelinePrompt = _buildRawTimelinePromptBySkipLast(skipLast);
    if (snapshotPrompt) {

    }
    return {
        skipLast,
        snapshotPrompt: snapshotPrompt || '',
        timelinePrompt: timelinePrompt || '',
    };
}

/**
 * Get story timeline prompt before a target message index.
 */
function _getTimelinePromptBeforeMessage(messageIndex, preparedSplit = null) {
    const split = preparedSplit || _buildPromptSplitBeforeMessage(messageIndex);
    return split.timelinePrompt || '';
}

/**
 * Get state snapshot prompt before a target message index.
 */
function _getSnapshotPromptBeforeMessage(messageIndex, preparedSplit = null) {
    const split = preparedSplit || _buildPromptSplitBeforeMessage(messageIndex);
    return split.snapshotPrompt || '';
}

/**
 * 解析剧情轨迹在 "[Start a new Chat]" 周围的注入动作：
 * - 至少两个标识：替换第二个标识内容（用于兜底定位符场景）
 * - 仅一个标识：在该标识后插入
 * - 无标识：返回 null，让调用方回退到旧定位策略
 */
function _resolveTimelineInsertIndexByStartMarker(promptChat) {
    if (!Array.isArray(promptChat) || promptChat.length === 0) return null;
    const markerIndices = [];
    for (let i = 0; i < promptChat.length; i++) {
        const row = promptChat[i];
        if (!row || row.role !== 'system' || typeof row.content !== 'string') continue;
        if (row.content.includes('[Start a new Chat]')) {
            markerIndices.push(i);
            if (markerIndices.length >= 2) {
                return { mode: 'replace', index: markerIndices[1] };
            }
        }
    }
    if (markerIndices.length === 1) {
        return { mode: 'insert', index: markerIndices[0] + 1 };
    }
    return null;
}

const HORAE_INTERNAL_NO_VECTOR_RECALL_PREFIX = '[HORAE_INTERNAL:NO_VECTOR_RECALL:';
const HORAE_INTERNAL_NO_VECTOR_RECALL_RE = /\[HORAE_INTERNAL:NO_VECTOR_RECALL:[^\]]+\]/g;
const HORAE_INTERNAL_NO_CONTEXT_INJECTION_PREFIX = '[HORAE_INTERNAL:NO_CONTEXT_INJECTION:';
const HORAE_INTERNAL_NO_CONTEXT_INJECTION_RE = /\[HORAE_INTERNAL:NO_CONTEXT_INJECTION:[^\]]+\]/g;
const HORAE_INTERNAL_NO_TIMELINE_INJECTION_PREFIX = '[HORAE_INTERNAL:NO_TIMELINE_INJECTION:';
const HORAE_INTERNAL_NO_TIMELINE_INJECTION_RE = /\[HORAE_INTERNAL:NO_TIMELINE_INJECTION:[^\]]+\]/g;
const HORAE_INTERNAL_NO_SYSTEM_PROMPT_INJECTION_PREFIX = '[HORAE_INTERNAL:NO_SYSTEM_PROMPT_INJECTION:';
const HORAE_INTERNAL_NO_SYSTEM_PROMPT_INJECTION_RE = /\[HORAE_INTERNAL:NO_SYSTEM_PROMPT_INJECTION:[^\]]+\]/g;

function _createNoVectorRecallMarker() {
    return `${HORAE_INTERNAL_NO_VECTOR_RECALL_PREFIX}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}]`;
}

function _createNoContextInjectionMarker() {
    return `${HORAE_INTERNAL_NO_CONTEXT_INJECTION_PREFIX}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}]`;
}

function _createNoTimelineInjectionMarker() {
    return `${HORAE_INTERNAL_NO_TIMELINE_INJECTION_PREFIX}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}]`;
}

function _createNoSystemPromptInjectionMarker() {
    return `${HORAE_INTERNAL_NO_SYSTEM_PROMPT_INJECTION_PREFIX}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}]`;
}

function _stripNoVectorRecallMarkers(chatMessages) {
    if (!Array.isArray(chatMessages) || chatMessages.length === 0) return false;
    let found = false;
    for (let i = chatMessages.length - 1; i >= 0; i--) {
        const msg = chatMessages[i];
        if (!msg || typeof msg.content !== 'string') continue;
        if (!msg.content.includes(HORAE_INTERNAL_NO_VECTOR_RECALL_PREFIX)) continue;
        found = true;
        const cleaned = msg.content.replace(HORAE_INTERNAL_NO_VECTOR_RECALL_RE, '').trim();
        if (cleaned) {
            msg.content = cleaned;
        } else {
            chatMessages.splice(i, 1);
        }
    }
    return found;
}

function _stripNoContextInjectionMarkers(chatMessages) {
    if (!Array.isArray(chatMessages) || chatMessages.length === 0) return false;
    let found = false;
    for (let i = chatMessages.length - 1; i >= 0; i--) {
        const msg = chatMessages[i];
        if (!msg || typeof msg.content !== 'string') continue;
        if (!msg.content.includes(HORAE_INTERNAL_NO_CONTEXT_INJECTION_PREFIX)) continue;
        found = true;
        const cleaned = msg.content.replace(HORAE_INTERNAL_NO_CONTEXT_INJECTION_RE, '').trim();
        if (cleaned) {
            msg.content = cleaned;
        } else {
            chatMessages.splice(i, 1);
        }
    }
    return found;
}

function _stripNoTimelineInjectionMarkers(chatMessages) {
    if (!Array.isArray(chatMessages) || chatMessages.length === 0) return false;
    let found = false;
    for (let i = chatMessages.length - 1; i >= 0; i--) {
        const msg = chatMessages[i];
        if (!msg || typeof msg.content !== 'string') continue;
        if (!msg.content.includes(HORAE_INTERNAL_NO_TIMELINE_INJECTION_PREFIX)) continue;
        found = true;
        const cleaned = msg.content.replace(HORAE_INTERNAL_NO_TIMELINE_INJECTION_RE, '').trim();
        if (cleaned) {
            msg.content = cleaned;
        } else {
            chatMessages.splice(i, 1);
        }
    }
    return found;
}

function _stripNoSystemPromptInjectionMarkers(chatMessages) {
    if (!Array.isArray(chatMessages) || chatMessages.length === 0) return false;
    let found = false;
    for (let i = chatMessages.length - 1; i >= 0; i--) {
        const msg = chatMessages[i];
        if (!msg || typeof msg.content !== 'string') continue;
        if (!msg.content.includes(HORAE_INTERNAL_NO_SYSTEM_PROMPT_INJECTION_PREFIX)) continue;
        found = true;
        const cleaned = msg.content.replace(HORAE_INTERNAL_NO_SYSTEM_PROMPT_INJECTION_RE, '').trim();
        if (cleaned) {
            msg.content = cleaned;
        } else {
            chatMessages.splice(i, 1);
        }
    }
    return found;
}

function _resolvePromptReadySkipLast(chat) {
    if (!chat || chat.length === 0) return 0;
    const lastMsg = chat[chat.length - 1];
    if (lastMsg && !lastMsg.is_user && lastMsg.horae_meta && (
        lastMsg.horae_meta.timestamp?.story_date ||
        lastMsg.horae_meta.scene?.location ||
        Object.keys(lastMsg.horae_meta.items || {}).length > 0 ||
        Object.keys(lastMsg.horae_meta.costumes || {}).length > 0 ||
        Object.keys(lastMsg.horae_meta.affection || {}).length > 0 ||
        Object.keys(lastMsg.horae_meta.npcs || {}).length > 0 ||
        (lastMsg.horae_meta.events || []).length > 0 ||
        (lastMsg.horae_meta._rpgChanges && Object.keys(lastMsg.horae_meta._rpgChanges).length > 0)
    )) {
        return 1;
    }
    return 0;
}

function _collectVectorPromptExcludeIndices(chat, promptChat, promptVisibility) {
    const promptCoveredChatIndices = _collectPromptCoveredChatIndices(chat, promptChat);
    if (promptVisibility?.ignoredBoundaryAiIndices?.size > 0) {
        let removed = 0;
        for (const idx of promptVisibility.ignoredBoundaryAiIndices) {
            if (promptCoveredChatIndices.delete(idx)) removed++;
        }
        if (removed > 0) {
            console.log(`[Horae] Prompt边界缓冲已忽略 ${removed} 条楼层（keepRecent=${promptVisibility.keepRecent} -> prompt=${promptVisibility.promptKeepRecent}）`);
        }
    }
    return promptCoveredChatIndices;
}

function _getVectorRecallHiddenCandidateInfo(chat, skipLast = 0, promptCoveredChatIndices = new Set()) {
    const info = {
        eligible: 0,
        hiddenIndexable: 0,
        excludedRecent: 0,
        excludedPrompt: 0,
        effectiveEnd: 0,
    };
    if (!Array.isArray(chat) || chat.length === 0) return info;

    const effectiveEnd = Math.max(0, chat.length - Math.max(0, skipLast));
    const recentStart = Math.max(0, effectiveEnd - 5);
    info.effectiveEnd = effectiveEnd;

    for (let i = 0; i < effectiveEnd; i++) {
        const msg = chat[i];
        if (!msg || msg.is_user || !msg.is_hidden) continue;

        const meta = msg.horae_meta;
        if (!meta || meta._skipHorae) continue;

        const doc = vectorManager.buildVectorDocument(meta);
        if (!doc) continue;

        info.hiddenIndexable++;
        if (i >= recentStart) {
            info.excludedRecent++;
            continue;
        }
        if (promptCoveredChatIndices?.has?.(i)) {
            info.excludedPrompt++;
            continue;
        }

        info.eligible++;
    }

    return info;
}

async function _runVectorRecallBeforePromptReady(chat, promptChat, skipLast, promptVisibility, skipVectorRecallOnce) {
    let deferredVectorIndex = null;
    try {
        console.log(`[Horae] 向量检查: vectorEnabled=${settings.vectorEnabled}, isReady=${vectorManager.isReady}, vectors=${vectorManager.vectors.size}`);
        if (skipVectorRecallOnce) {
            console.log('[Horae] Internal no-recall marker detected, skip vector recall for this request');
            return '';
        }
        if (!settings.vectorEnabled || !vectorManager.isReady) return '';

        const promptCoveredChatIndices = _collectVectorPromptExcludeIndices(chat, promptChat, promptVisibility);
        if (promptCoveredChatIndices.size > 0) {
            console.log(`[Horae] Prompt已覆盖楼层: ${promptCoveredChatIndices.size}，召回将排除这些楼层`);
        }

        const candidateInfo = _getVectorRecallHiddenCandidateInfo(chat, skipLast, promptCoveredChatIndices);
        if (candidateInfo.eligible <= 0) {
            console.log(
                `[Horae] 无可召回隐藏楼层，跳过向量召回与 Query Rewrite ` +
                `(hiddenIndexable=${candidateInfo.hiddenIndexable}, recent=${candidateInfo.excludedRecent}, prompt=${candidateInfo.excludedPrompt})`
            );
            return '';
        }

        const recallRewritePromise = settings.vectorQueryRewriteEnabled === true
            ? vectorManager.prepareRecallRewrite(chat, settings)
            : null;

        deferredVectorIndex = await _ensureVectorIndexBeforeRecall();

        const recallPrompt = await vectorManager.generateRecallPrompt(
            horaeManager,
            skipLast,
            settings,
            promptCoveredChatIndices,
            { rewritePromise: recallRewritePromise }
        );
        console.log(`[Horae] 向量召回结果: ${recallPrompt ? recallPrompt.length + ' 字符' : '空'}`);
        return recallPrompt || '';
    } catch (err) {
        console.error('[Horae] 向量召回失败:', err);
        return '';
    } finally {
        if (deferredVectorIndex?.deferredMessageIndex >= 0) {
            _scheduleDeferredVectorMessageIndex(
                deferredVectorIndex.deferredMessageIndex,
                deferredVectorIndex.chatId
            );
        }
    }
}

async function onPromptReady(eventData) {
    const skipVectorRecallOnce = _stripNoVectorRecallMarkers(eventData?.chat);
    const skipContextInjectionOnce = _stripNoContextInjectionMarkers(eventData?.chat);
    const skipTimelineInjectionOnce = _stripNoTimelineInjectionMarkers(eventData?.chat);
    const skipSystemPromptInjectionOnce = _stripNoSystemPromptInjectionMarkers(eventData?.chat);
    console.log(
        `[Horae][TableDebug] onPromptReady markers: skipContext=${skipContextInjectionOnce}, skipTimeline=${skipTimelineInjectionOnce}, skipVector=${skipVectorRecallOnce}, skipSystem=${skipSystemPromptInjectionOnce}`
    );
    if (_isSummaryGeneration) return;
    if (skipContextInjectionOnce) {
        console.log('[Horae] Internal no-context marker detected, skip Horae context injection for this request');
        return;
    }
    if (!settings.enabled || !settings.injectContext) return;
    if (eventData.dryRun) return;

    try {
        const chat = horaeManager.getChat();
        const earlySkipLast = _resolvePromptReadySkipLast(chat);
        const earlyPromptVisibility = _buildPromptVisibilityContext(chat, earlySkipLast);
        const vectorRecallPromise = _runVectorRecallBeforePromptReady(
            chat,
            eventData.chat,
            earlySkipLast,
            earlyPromptVisibility,
            skipVectorRecallOnce
        );

        // 发送前：可选补全上一条AI楼层的时间线
        const autoFillPromise = _autoFillPreviousAiTimelineBeforeInjection(chat);
        const autoFilledIndex = await autoFillPromise;
        if (Number.isInteger(autoFilledIndex) && autoFilledIndex >= 0) {
            _scheduleDeferredVectorMessageIndex(autoFilledIndex, _deriveChatId(getContext()));
        }

        // swipe/regenerate检测
        const skipLast = _resolvePromptReadySkipLast(chat);
        if (skipLast > 0) {
            console.log('[Horae] 检测到swipe/regenerate，跳过末尾消息的旧记忆');
        }

        const eqAutoApplied = _autoApplyEquipmentTemplatesByRace({ persist: false });
        if (eqAutoApplied && getContext()?.saveChat) await getContext().saveChat();

        const promptVisibility = _buildPromptVisibilityContext(chat, skipLast);
        const effectiveHiddenSet = promptVisibility.effectiveHiddenSet;
        const rawDataPrompt = horaeManager.generateCompactPrompt(skipLast, {
            includeTimeline: !skipTimelineInjectionOnce,
            effectiveHiddenSet,
        });
        try {
            const npcLines = String(rawDataPrompt || '')
                .split(/\r?\n/)
                .filter(line => /^N[\d?]+\s+/.test(line.trim()))
                .slice(0, 100)
                .map(line => line.length > 220 ? `${line.slice(0, 220)}...` : line);
            console.log(
                `[Horae][MainPersonality] onPromptReady: sendMainCharacterPersonality=${!!settings.sendMainCharacterPersonality} sendCharacters=${settings.sendCharacters !== false} context.name2="${getContext()?.name2 || ''}" pinnedNpcs=${JSON.stringify(settings.pinnedNpcs || [])} npcLines=${npcLines.length}`
            );
            if (npcLines.length > 0) {
                console.log(`[Horae][MainPersonality] onPromptReady npc preview:\n${npcLines.join('\n')}`);
            }
        } catch (e) {
            console.warn('[Horae][MainPersonality] onPromptReady debug log failed:', e);
        }
        const timelineMode = settings.timelineInjectionMode === 'separate' ? 'separate' : 'inline';
        let dataPrompt = rawDataPrompt;
        let timelinePrompt = '';
        if (timelineMode === 'separate' && !skipTimelineInjectionOnce) {
            const split = _splitTimelineSection(rawDataPrompt);
            dataPrompt = split.mainPrompt;
            timelinePrompt = split.timelinePrompt;
        }
        if (skipTimelineInjectionOnce) {
            console.log('[Horae] Internal no-timeline marker detected, skip story timeline injection for this request');
        }

        const recallPrompt = await vectorRecallPromise;

        const skipByBriefScope = _shouldSkipSystemPromptInjectionOnSend();
        const skipSystemPromptOnSend = skipByBriefScope || skipSystemPromptInjectionOnce;
        const rulesPrompt = skipSystemPromptOnSend ? '' : horaeManager.generateSystemPromptAddition();
        const rulesHasHoraetableTag = rulesPrompt.includes('<horaetable:');
        const rulesHasTableKeyword = /(表格|custom table|horaetable|填写要求|instructions)/i.test(rulesPrompt);
        console.log(
            `[Horae][TableDebug] onPromptReady rules: skip=${skipSystemPromptOnSend}, skipByBriefScope=${skipByBriefScope}, skipByMarker=${skipSystemPromptInjectionOnce}, subApiScopeBrief=${!!settings.subApiScopeBrief}, rulesLen=${rulesPrompt.length}, hasHoraetableTag=${rulesHasHoraetableTag}, hasTableKeyword=${rulesHasTableKeyword}`
        );
        if (!skipSystemPromptOnSend && rulesPrompt) {
            const rulesPreview = rulesPrompt.length > 600 ? `${rulesPrompt.slice(0, 600)}...` : rulesPrompt;
            console.log(`[Horae][TableDebug] rulesPrompt preview:\n${rulesPreview}`);
        }
        if (skipSystemPromptOnSend) {
            if (skipSystemPromptInjectionOnce) {
                console.log('[Horae] Internal no-system marker detected, skip system injection prompt for this request');
            } else {
                console.log('[Horae] Sub-API brief scope enabled, skipped system injection prompt on send');
            }
        }

        let antiParaRef = '';
        if (settings.antiParaphraseMode && chat?.length) {
            for (let i = chat.length - 1; i >= 0; i--) {
                if (chat[i].is_user && chat[i].mes) {
                    const cleaned = chat[i].mes.replace(/<horae>[\s\S]*?<\/horae>/gi, '').replace(/<horaeevent>[\s\S]*?<\/horaeevent>/gi, '').trim();
                    if (cleaned) {
                        const truncated = cleaned.length > 2000 ? cleaned.slice(0, 2000) + '…' : cleaned;
                        antiParaRef = `\n【反转述参考 - USER上一条消息内容】\n${truncated}\n（请将以上USER行为一并纳入本条<horae>结算）`;
                    }
                    break;
                }
            }
        }

        const combinedPrompt = recallPrompt
            ? `${dataPrompt}\n${recallPrompt}${antiParaRef}${rulesPrompt ? `\n${rulesPrompt}` : ''}`
            : `${dataPrompt}${antiParaRef}${rulesPrompt ? `\n${rulesPrompt}` : ''}`;
        const combinedHasHoraetableTag = combinedPrompt.includes('<horaetable:');
        const combinedHasTableKeyword = /(表格|custom table|horaetable|填写要求|instructions)/i.test(combinedPrompt);
        console.log(
            `[Horae][TableDebug] combinedPrompt: len=${combinedPrompt.length}, dataLen=${dataPrompt.length}, recallLen=${recallPrompt.length}, antiParaLen=${antiParaRef.length}, rulesLen=${rulesPrompt.length}, hasHoraetableTag=${combinedHasHoraetableTag}, hasTableKeyword=${combinedHasTableKeyword}`
        );
        const positionRaw = parseInt(settings.injectionPosition, 10);
        const position = Number.isNaN(positionRaw) ? 1 : Math.max(0, positionRaw);
        const depthSource = settings.injectionDepthSource === 'preset' ? 'preset' : 'system';

        if (depthSource === 'preset') {
            // 预设 @D：不按聊天楼层定位，直接按完整提示词末尾偏移插入
            if (!skipTimelineInjectionOnce && timelinePrompt) {
                // 剧情轨迹保持与系统 @D 相同的定位逻辑
                const markerAction = _resolveTimelineInsertIndexByStartMarker(eventData.chat);
                if (markerAction?.mode === 'replace') {
                    eventData.chat[markerAction.index].content = timelinePrompt;
                    console.log(`[Horae] Story timeline replaced the 2nd [Start a new Chat] marker (preset@D)${skipLast ? ' (skip last message)' : ''}`);
                } else if (markerAction?.mode === 'insert') {
                    eventData.chat.splice(markerAction.index, 0, { role: 'system', content: timelinePrompt });
                    console.log(`[Horae] Story timeline injected after [Start a new Chat] (preset@D)${skipLast ? ' (skip last message)' : ''}`);
                } else {
                    const timelineDepth = 99999;
                    const timelineIdx = _resolveInsertIndexByChatAnchor(chat, eventData.chat, timelineDepth);
                    eventData.chat.splice(timelineIdx, 0, { role: 'system', content: timelinePrompt });
                    console.log(`[Horae] Start marker not found, fallback timeline injection at depth -${timelineDepth} (preset@D)${skipLast ? ' (skip last message)' : ''}`);
                }
            }
            const len = Array.isArray(eventData.chat) ? eventData.chat.length : 0;
            const insertIdx = Math.max(0, len - position);
            eventData.chat.splice(insertIdx, 0, { role: 'system', content: combinedPrompt });
            console.log(`[Horae] 已注入上下文（预设@D），位置: -${position}${skipLast ? '（已跳过末尾消息）' : ''}${recallPrompt ? '（含向量召回）' : ''}`);
        } else {
            // 系统 @D：保留原有按聊天楼层定位的注入逻辑
            if (!skipTimelineInjectionOnce && timelinePrompt) {
                const markerAction = _resolveTimelineInsertIndexByStartMarker(eventData.chat);
                if (markerAction?.mode === 'replace') {
                    eventData.chat[markerAction.index].content = timelinePrompt;
                    console.log(`[Horae] Story timeline replaced the 2nd [Start a new Chat] marker${skipLast ? ' (skip last message)' : ''}`);
                } else if (markerAction?.mode === 'insert') {
                    eventData.chat.splice(markerAction.index, 0, { role: 'system', content: timelinePrompt });
                    console.log(`[Horae] Story timeline injected after [Start a new Chat]${skipLast ? ' (skip last message)' : ''}`);
                } else {
                    const timelineDepth = 99999;
                    const timelineIdx = _resolveInsertIndexByChatAnchor(chat, eventData.chat, timelineDepth);
                    eventData.chat.splice(timelineIdx, 0, { role: 'system', content: timelinePrompt });
                    console.log(`[Horae] Start marker not found, fallback timeline injection at depth -${timelineDepth}${skipLast ? ' (skip last message)' : ''}`);
                }
            }

            const insertIdx = _resolveInsertIndexByChatAnchor(chat, eventData.chat, position);
            eventData.chat.splice(insertIdx, 0, { role: 'system', content: combinedPrompt });
            console.log(`[Horae] 已注入上下文，位置: -${position}${skipLast ? '（已跳过末尾消息）' : ''}${recallPrompt ? '（含向量召回）' : ''}`);
        }
    } catch (error) {
        console.error('[Horae] 注入上下文失败:', error);
    }
}

/**
 * 分支/聊天切换后重建全局数据，清理孤立摘要
 */
function _rebuildGlobalDataForCurrentChat() {
    const chat = horaeManager.getChat();
    if (!chat?.length) return;

    horaeManager.rebuildRelationships();
    horaeManager.rebuildLocationMemory();
    horaeManager.rebuildRpgData();

    // 清理孤立摘要：range 超出当前聊天长度的条目
    const sums = chat[0]?.horae_meta?.autoSummaries;
    if (sums?.length) {
        const chatLen = chat.length;
        const orphaned = [];
        for (let i = sums.length - 1; i >= 0; i--) {
            const s = sums[i];
            if (s.range && s.range[0] >= chatLen) {
                orphaned.push(sums.splice(i, 1)[0]);
            }
        }
        if (orphaned.length > 0) {
            // 清理孤立摘要在消息上留下的 _compressedBy 标记
            for (const s of orphaned) {
                for (let j = 0; j < chatLen; j++) {
                    const evts = chat[j]?.horae_meta?.events;
                    if (!evts) continue;
                    for (const e of evts) {
                        if (e._compressedBy === s.id) delete e._compressedBy;
                    }
                }
            }
            console.log(`[Horae] 清理了 ${orphaned.length} 条孤立摘要`);
        }
    }
}

/**
 * 聊天切换时触发
 */
async function onChatChanged() {
    if (!settings.enabled) return;
    _chatFullyLoaded = false;

    try {
        clearTableHistory();
        horaeManager.init(getContext(), settings);

        // ── 迁移旧数据：将 rpg 内嵌 config 提升到 _rpgConfigs 顶层键 ──
        const _mc = horaeManager.getChat();
        if (_mc?.length && _mc[0].horae_meta) {
            const _m = _mc[0].horae_meta;
            if (!_m._rpgConfigs) _m._rpgConfigs = {};
            const _rpg = _m.rpg;
            if (_rpg) {
                if (_rpg.reputationConfig && !_m._rpgConfigs.reputationConfig)
                    _m._rpgConfigs.reputationConfig = _rpg.reputationConfig;
                if (_rpg.equipmentConfig && !_m._rpgConfigs.equipmentConfig)
                    _m._rpgConfigs.equipmentConfig = _rpg.equipmentConfig;
                if (_rpg.currencyConfig && !_m._rpgConfigs.currencyConfig)
                    _m._rpgConfigs.currencyConfig = _rpg.currencyConfig;
                if (_rpg._deletedSkills && !_m._rpgConfigs._deletedSkills)
                    _m._rpgConfigs._deletedSkills = _rpg._deletedSkills;
                if (_rpg.strongholds && !_m._rpgConfigs.strongholds)
                    _m._rpgConfigs.strongholds = _rpg.strongholds;
                if (_rpg._deletedStrongholds && !_m._rpgConfigs._deletedStrongholds)
                    _m._rpgConfigs._deletedStrongholds = _rpg._deletedStrongholds;
            }
        }

        // ── 迁移旧数据：events 中的摘要卡片回流到 autoSummaries.summaryText ──
        // 旧版只存在 events 卡片中，没写到 autoSummaries[i].summaryText
        // → 这里一次性补回，让 autoSummaries 成为单一可信源
        try {
            const _mig = _mc?.[0]?.horae_meta;
            if (_mig?.autoSummaries?.length && _mc?.length) {
                const summaryById = new Map();
                for (const s of _mig.autoSummaries) {
                    if (s?.id) summaryById.set(s.id, s);
                }
                let backfilled = 0;
                for (let i = 1; i < _mc.length; i++) {
                    const evts = _mc[i]?.horae_meta?.events;
                    if (!evts?.length) continue;
                    for (const evt of evts) {
                        if (!evt?.isSummary || !evt._summaryId) continue;
                        const s = summaryById.get(evt._summaryId);
                        if (!s) continue;
                        if (!s.summaryText && evt.summary) {
                            s.summaryText = evt.summary;
                            backfilled++;
                        }
                    }
                }
                if (backfilled > 0) {
                    console.log(`[Horae] 摘要迁移：从 events 回填 ${backfilled} 条 summaryText 到 autoSummaries`);
                }
            }
        } catch (e) {
            console.warn('[Horae] 摘要迁移失败：', e);
        }

        _rebuildGlobalDataForCurrentChat();
        refreshAllDisplays();
        renderCustomTablesList();
        renderDicePanel();
    } catch (err) {
        console.error('[Horae] onChatChanged 初始化失败:', err);
    }
    _chatFullyLoaded = true;

    if (settings.vectorEnabled && vectorManager.isReady) {
        try {
            const ctx = getContext();
            const chatId = ctx?.chatId || _deriveChatId(ctx);
            vectorManager.loadChat(chatId, horaeManager.getChat()).then(() => {
                _updateVectorStatus();
            }).catch(err => console.warn('[Horae] 加载向量索引失败:', err));
        } catch (err) {
            console.warn('[Horae] 向量加载失败:', err);
        }
    }

    setTimeout(() => {
        try {
            horaeManager.init(getContext(), settings);
            renderCustomTablesList();

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

            // 中断恢复：检测是否有未审阅的 AI 扫描结果
            const _pChat = horaeManager.getChat();
            const _pending = _pChat?.[0]?.horae_meta?._pendingScanReview;
            if (_pending?.msgIndices?.length > 0) {
                const count = _pending.msgIndices.length;
                setTimeout(() => _showPendingScanRecoveryModal(_pChat, _pending, count), 1000);
            }
        } catch (err) {
            console.error('[Horae] onChatChanged 面板渲染失败:', err);
        }
    }, 500);
}

/** 消息渲染时触发 */
function onMessageRendered(messageId) {
    if (!settings.enabled) return;

    setTimeout(() => {
        try {
            const messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
            if (!messageEl) return;
            _sanitizeLeakedHoraeTags(messageEl);
            const msg = horaeManager.getChat()[messageId];
            if (msg && !msg.is_user && settings.showMessagePanel) {
                addMessagePanel(messageEl, messageId);
                messageEl.classList.add('horae-processed');
            }
        } catch (err) {
            console.error(`[Horae] onMessageRendered #${messageId} 失败:`, err);
        }
    }, 100);
}

/** 清理渲染后 DOM 中泄露的 horae 标签（万能兜底，不依赖思维链标签名） */
function _sanitizeLeakedHoraeTags(messageEl) {
    const mesBody = messageEl.querySelector('.mes_text');
    if (!mesBody) return;

    // Phase 1: 拆解浏览器将 <horae> 等未知标签解析成的真实 DOM 元素
    const ghostEls = mesBody.querySelectorAll('horae, horaeevent, horaerpg, horaetable');
    for (const el of ghostEls) {
        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
        el.remove();
    }
    // 拆解后合并相邻文本节点，恢复完整文本流
    mesBody.normalize();

    // Phase 2: 清理文本节点中残留的 horae 标签文字
    const walker = document.createTreeWalker(mesBody, NodeFilter.SHOW_TEXT, null, false);
    const horaePat = /<\/?horae(?:event|rpg|table[:\uff1a]?[^>]*)?>/gi;
    let node;
    while ((node = walker.nextNode())) {
        if (horaePat.test(node.textContent)) {
            horaePat.lastIndex = 0;
            node.textContent = node.textContent.replace(horaePat, '');
        }
    }
}

/** swipe切换分页时触发 — 重置meta、重新解析并刷新所有显示 */
function onSwipePanel(messageId) {
    if (!settings.enabled) return;

    setTimeout(() => {
        try {
            const msg = horaeManager.getChat()[messageId];
            if (!msg || msg.is_user) return;

            const savedFlags = _saveCompressedFlags(msg.horae_meta);
            const savedGlobal = messageId === 0 ? _saveGlobalMeta(msg.horae_meta) : null;
            msg.horae_meta = createEmptyMeta();
            horaeManager.processAIResponse(messageId, msg.mes);
            _restoreCompressedFlags(msg.horae_meta, savedFlags);
            if (savedGlobal) _restoreGlobalMeta(msg.horae_meta, savedGlobal);

            horaeManager.rebuildTableData();
            horaeManager.rebuildRelationships();
            horaeManager.rebuildLocationMemory();
            horaeManager.rebuildRpgData();
            getContext().saveChat();

            refreshAllDisplays();
            renderCustomTablesList();
        } catch (err) {
            console.error(`[Horae] onSwipePanel #${messageId} 失败:`, err);
        }

        if (settings.showMessagePanel) {
            const messageEl = document.querySelector(`.mes[mesid="${messageId}"]`);
            if (messageEl) {
                const oldPanel = messageEl.querySelector('.horae-message-panel');
                if (oldPanel) oldPanel.remove();
                addMessagePanel(messageEl, messageId);
            }
        }
    }, 150);
}

// ============================================
// 新用户导航教学
// ============================================

function _getTutorialSteps() {
    return [
        { title: t('tutorial.step1Title'), content: t('tutorial.step1Content'), tab: 'status', target: null, action: null },
        { title: t('tutorial.stepStatusTitle'), content: t('tutorial.stepStatusContent'), tab: 'status', target: '#horae-tab-status .horae-state-section', action: null },
        { title: t('tutorial.stepTimelineTitle'), content: t('tutorial.stepTimelineContent'), tab: 'timeline', target: '.horae-timeline-header', action: null },
        { title: t('tutorial.stepCharactersTitle'), content: t('tutorial.stepCharactersContent'), tab: 'characters', target: '#horae-tab-characters .horae-subsection', action: null },
        { title: t('tutorial.stepItemsTitle'), content: t('tutorial.stepItemsContent'), tab: 'items', target: '#horae-tab-items .horae-items-toolbar', action: null },
        { title: t('tutorial.step2Title'), content: t('tutorial.step2Content'), tab: 'settings', target: '#horae-btn-ai-scan', action: null },
        {
            title: t('tutorial.step3Title'), content: t('tutorial.step3Content'), tab: 'settings', target: '#horae-autosummary-collapse-toggle',
            action: () => { const b = document.getElementById('horae-autosummary-collapse-body'); if (b && b.style.display === 'none') document.getElementById('horae-autosummary-collapse-toggle')?.click(); }
        },
        {
            title: t('tutorial.step4Title'), content: t('tutorial.step4Content'), tab: 'settings', target: '#horae-vector-collapse-toggle',
            action: () => { const b = document.getElementById('horae-vector-collapse-body'); if (b && b.style.display === 'none') document.getElementById('horae-vector-collapse-toggle')?.click(); }
        },
        { title: t('tutorial.step5Title'), content: t('tutorial.step5Content'), tab: 'settings', target: '#horae-setting-context-depth', action: null },
        { title: t('tutorial.step6Title'), content: t('tutorial.step6Content'), tab: 'settings', target: '#horae-setting-injection-position', action: null },
        {
            title: t('tutorial.step7Title'), content: t('tutorial.step7Content'), tab: 'settings', target: '#horae-prompt-collapse-toggle',
            action: () => { const b = document.getElementById('horae-prompt-collapse-body'); if (b && b.style.display === 'none') document.getElementById('horae-prompt-collapse-toggle')?.click(); }
        },
        { title: t('tutorial.step8Title'), content: t('tutorial.step8Content'), tab: 'settings', target: '#horae-custom-tables-list', action: null },
        { title: t('tutorial.step9Title'), content: t('tutorial.step9Content'), tab: 'settings', target: '#horae-setting-send-location-memory', action: null },
        { title: t('tutorial.step10Title'), content: t('tutorial.step10Content'), target: null, action: null }
    ];
}

async function startTutorial() {
    let drawerOpened = false;
    const steps = _getTutorialSteps();

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const isLast = i === steps.length - 1;

        // 首个需要面板的步骤时打开抽屉；每步按自己的 tab 切换页面。
        if ((step.target || step.tab) && !drawerOpened) {
            const drawerIcon = $('#horae_drawer_icon');
            if (drawerIcon.hasClass('closedIcon')) {
                drawerIcon.trigger('click');
                await new Promise(r => setTimeout(r, 400));
            }
            drawerOpened = true;
        }

        if (step.tab) {
            const tabBtn = $(`.horae-tab[data-tab="${step.tab}"]`);
            if (tabBtn.length && tabBtn.is(':visible')) {
                tabBtn.trigger('click');
                await new Promise(r => setTimeout(r, 200));
            }
        }

        if (step.action) step.action();

        if (step.target) {
            await new Promise(r => setTimeout(r, 200));
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        const continued = await showTutorialStep(step, i + 1, steps.length, isLast);
        if (!continued) break;
    }

    settings.tutorialCompleted = true;
    saveSettings();
}

function showTutorialStep(step, current, total, isLast) {
    return new Promise(resolve => {
        document.querySelectorAll('.horae-tutorial-card').forEach(e => e.remove());
        document.querySelectorAll('.horae-tutorial-highlight').forEach(e => e.classList.remove('horae-tutorial-highlight'));

        // 高亮目标并定位插入点
        let highlightEl = null;
        let insertAfterEl = null;
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                highlightEl = targetEl.closest('.horae-settings-section') || targetEl;
                highlightEl.classList.add('horae-tutorial-highlight');
                insertAfterEl = highlightEl;
            }
        }

        const card = document.createElement('div');
        card.className = 'horae-tutorial-card' + (isLightMode() ? ' horae-light' : '');
        card.innerHTML = `
            <div class="horae-tutorial-card-head">
                <span class="horae-tutorial-step-indicator">${current}/${total}</span>
                <strong>${step.title}</strong>
            </div>
            <div class="horae-tutorial-card-body">${step.content}</div>
            <div class="horae-tutorial-card-foot">
                <button class="horae-tutorial-skip">${t('tutorial.skip')}</button>
                <button class="horae-tutorial-next">${isLast ? t('tutorial.done') : t('tutorial.next')}</button>
            </div>
        `;

        // 紧跟在目标区域后面插入，没有目标则放到设置页顶部
        if (insertAfterEl && insertAfterEl.parentNode) {
            insertAfterEl.parentNode.insertBefore(card, insertAfterEl.nextSibling);
        } else {
            const container = (step.tab && document.getElementById(`horae-tab-${step.tab}`))
                || document.getElementById('horae-tab-settings')
                || document.getElementById('horae_drawer_content');
            if (container) {
                container.insertBefore(card, container.firstChild);
            } else {
                document.body.appendChild(card);
            }
        }

        // 自动滚到高亮目标（教学卡片紧跟其后，一起可见）
        const scrollTarget = highlightEl || card;
        setTimeout(() => scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

        const cleanup = () => {
            if (highlightEl) highlightEl.classList.remove('horae-tutorial-highlight');
            card.remove();
        };
        card.querySelector('.horae-tutorial-next').addEventListener('click', () => { cleanup(); resolve(true); });
        card.querySelector('.horae-tutorial-skip').addEventListener('click', () => { cleanup(); resolve(false); });
    });
}

// ============================================
// 初始化
// ============================================

jQuery(async () => {
    console.log(`[Horae] 开始加载 v${VERSION}...`);

    await initNavbarFunction();
    loadSettings();
    ensureRegexRules();

    const pluginBasePath = `/scripts/extensions/${EXTENSION_FOLDER}`;
    await initI18n(pluginBasePath, settings);
    _i18nReady = true;
    await initPromptDefaults(pluginBasePath, detectEffectiveAiLang(settings));

    if (_ensureLocalizedRpgDefaults({ force: _isFirstTimeUser }) || _normalizeRpgSettingsInPlace()) {
        saveSettings();
    }

    $('#extensions-settings-button').after(await getTemplate('drawer'));
    applyI18nToDOM(document.getElementById('horae-drawer') || document);

    // 在扩展面板中注入顶部图标开关
    const extToggleHtml = `
        <div id="horae-ext-settings" class="inline-drawer" style="margin-top:4px;">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>${t('plugin.name')}</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label" style="margin:6px 0;">
                    <input type="checkbox" id="horae-ext-show-top-icon" checked>
                    <span>${t('settings.showTopIcon')}</span>
                </label>
            </div>
        </div>
    `;
    $('#extensions_settings2').append(extToggleHtml);

    // 绑定扩展面板内的图标开关（折叠切换由 SillyTavern 全局处理器自动管理）
    $('#horae-ext-show-top-icon').on('change', function () {
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

    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, () => {
        TavernHelper.injectPrompts([
            {
                id: "test_prompt_once",
                position: "in_chat",
                depth: 9999,
                role: "system",
                content: "[Start a new Chat]"
            }
        ], { once: true }); // 在D9999注入一个定位符
    });

    // 并行自动摘要：用户发消息时并行触发（独立API走直接HTTP，不影响主连接）
    if (event_types.USER_MESSAGE_RENDERED) {
        eventSource.on(event_types.USER_MESSAGE_RENDERED, () => {
            if (!settings.enabled || !settings.autoSummaryEnabled || !settings.sendTimeline) return;
            _autoSummaryRanThisTurn = true;
            checkAutoSummary().catch((e) => {
                console.warn('[Horae] 并行自动摘要失败，将在AI回复后重试:', e);
                _autoSummaryRanThisTurn = false;
            });
        });
    }

    refreshAllDisplays();

    if (settings.vectorEnabled) {
        setTimeout(() => _initVectorModel(), 1000);
    }

    renderDicePanel();

    // 新用户导航教学（仅完全没用过 Horae 的全新用户触发）
    if (_isFirstTimeUser) {
        setTimeout(() => startTutorial(), 800);
    }

    window.Horae = Object.freeze({
        version: VERSION,
        isEnabled: () => !!settings.enabled,
        getSettings: () => ({ ...settings }),
        getLatestState: (skipLast) => horaeManager.getLatestState(skipLast),
        getEvents: (limit, filterLevel) => horaeManager.getEvents(limit, filterLevel),
        getChat: () => horaeManager.getChat(),
    });

    isInitialized = true;
    _chatFullyLoaded = true;
    console.log(`[Horae] v${VERSION} 加载完成！作者: SenriYuki，柏柏`);
});
