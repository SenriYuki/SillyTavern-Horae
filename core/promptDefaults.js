/**
 * Prompt default resource loader
 * - Loads prompts/<lang>/*.txt (main defaults)
 * - Loads prompts/<lang>/presets/<presetName>/*.txt (built-in presets)
 * - Provides sync lookup from in-memory cache
 */

const _cache = new Map(); // lang -> prompts object | null
const _presetCache = new Map(); // `${lang}::${presetName}` -> prompts object | null
let _basePath = '';
const _promptFileMap = Object.freeze({
    customSystemPrompt: 'customSystemPrompt.txt',
    customAntiParaphrasePrompt: 'customAntiParaphrasePrompt.txt',
    customBatchPrompt: 'customBatchPrompt.txt',
    customAnalysisPrompt: 'customAnalysisPrompt.txt',
    customCompressPrompt: 'customCompressPrompt.txt',
    customAutoSummaryPrompt: 'customAutoSummaryPrompt.txt',
    customAutoResummaryPrompt: 'customAutoResummaryPrompt.txt',
    customTablesPrompt: 'customTablesPrompt.txt',
    customLocationPrompt: 'customLocationPrompt.txt',
    customRelationshipPrompt: 'customRelationshipPrompt.txt',
    customMoodPrompt: 'customMoodPrompt.txt',
    customRpgPrompt: 'customRpgPrompt.txt',
    vectorQueryRewriteSystemPrompt: 'vectorQueryRewriteSystemPrompt.txt',
});

const _PRESET_FILE_KEYS = Object.freeze([
    'customSystemPrompt',
    'customBatchPrompt',
    'customAnalysisPrompt',
]);

export const BUILTIN_PRESET_IDS = Object.freeze(['default', 'vector-summary']);

function _normalizeLf(text) {
    return typeof text === 'string' ? text.replace(/\r\n?/g, '\n') : text;
}

function _normalizeLang(raw) {
    if (!raw) return 'en';
    const lower = String(raw).toLowerCase().replace(/_/g, '-');
    if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-sg') return 'zh-CN';
    if (lower === 'zh-tw' || lower === 'zh-hant' || lower === 'zh-hk' || lower === 'zh-mo') return 'zh-TW';
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('ko')) return 'ko';
    if (lower.startsWith('ru')) return 'ru';
    if (lower === 'zh') return 'zh-CN';
    return 'en';
}

function _candidateLangs(lang) {
    const n = _normalizeLang(lang);
    // Only use close locale fallback here.
    // Hardcoded defaults in callers remain the final fallback, so we must not
    // force unrelated languages (e.g. English) to consume zh-CN prompt assets.
    if (n === 'zh-TW') return ['zh-TW', 'zh-CN'];
    return [n];
}

async function _loadLang(lang) {
    if (!lang) return null;
    if (_cache.has(lang)) return _cache.get(lang);
    if (!_basePath) return null;

    const prompts = {};
    const entries = Object.entries(_promptFileMap);

    await Promise.all(entries.map(async ([key, filename]) => {
        const url = `${_basePath}/prompts/${lang}/${filename}`;
        try {
            const resp = await fetch(url);
            if (!resp.ok) return;
            const text = _normalizeLf(await resp.text());
            if (typeof text === 'string' && text.trim().length > 0) {
                prompts[key] = text;
            }
        } catch {
            // Ignore single-file failures; caller fallback handles missing keys.
        }
    }));

    if (Object.keys(prompts).length === 0) {
        _cache.set(lang, null);
        return null;
    }

    _cache.set(lang, prompts);
    return prompts;
}

async function _loadPresetLang(lang, presetName) {
    if (!lang || !presetName) return null;
    const cacheKey = `${lang}::${presetName}`;
    if (_presetCache.has(cacheKey)) return _presetCache.get(cacheKey);
    if (!_basePath) return null;

    // 'default' preset is intentionally empty: loading it falls back to main defaults.
    if (presetName === 'default') {
        _presetCache.set(cacheKey, {});
        return {};
    }

    const prompts = {};
    await Promise.all(_PRESET_FILE_KEYS.map(async (key) => {
        const filename = _promptFileMap[key];
        if (!filename) return;
        const url = `${_basePath}/prompts/${lang}/presets/${presetName}/${filename}`;
        try {
            const resp = await fetch(url);
            if (!resp.ok) return;
            const text = _normalizeLf(await resp.text());
            if (typeof text === 'string' && text.trim().length > 0) {
                prompts[key] = text;
            }
        } catch {
            // Ignore single-file failures; caller can fall back to main defaults.
        }
    }));

    if (Object.keys(prompts).length === 0) {
        _presetCache.set(cacheKey, null);
        return null;
    }

    _presetCache.set(cacheKey, prompts);
    return prompts;
}

export async function initPromptDefaults(basePath, preferredLang = 'en') {
    _basePath = String(basePath || '').replace(/\/+$/, '');
    await ensurePromptDefaults(preferredLang);
    await ensurePresetPrompts(preferredLang);
}

export async function ensurePromptDefaults(lang) {
    const candidates = _candidateLangs(lang);
    for (const c of candidates) {
        await _loadLang(c);
    }
}

export async function ensurePresetPrompts(lang, presetName = null) {
    const candidates = _candidateLangs(lang);
    const presets = presetName ? [presetName] : BUILTIN_PRESET_IDS;
    for (const c of candidates) {
        await Promise.all(presets.map(p => _loadPresetLang(c, p)));
    }
}

export function getPromptDefaultSync(lang, key) {
    if (!key) return '';
    const candidates = _candidateLangs(lang);
    for (const c of candidates) {
        const prompts = _cache.get(c);
        if (!prompts || typeof prompts !== 'object') continue;
        const val = prompts[key];
        if (typeof val === 'string' && val.length > 0) return _normalizeLf(val);
    }
    return '';
}

export function getPresetPromptsSync(lang, presetName) {
    if (!presetName) return null;
    if (presetName === 'default') return {};
    const candidates = _candidateLangs(lang);
    for (const c of candidates) {
        const cacheKey = `${c}::${presetName}`;
        const prompts = _presetCache.get(cacheKey);
        if (prompts && typeof prompts === 'object' && Object.keys(prompts).length > 0) {
            return { ...prompts };
        }
    }
    return null;
}
