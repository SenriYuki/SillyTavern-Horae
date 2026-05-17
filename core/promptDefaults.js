/**
 * Prompt default resource loader
 * - Loads prompts/<lang>/*.txt
 * - Provides sync lookup from in-memory cache
 */

const _cache = new Map(); // lang -> prompts object | null
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
    vectorQueryRewriteTailPrompt: 'vectorQueryRewriteTailPrompt.txt',
});

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

export async function initPromptDefaults(basePath, preferredLang = 'en') {
    _basePath = String(basePath || '').replace(/\/+$/, '');
    await ensurePromptDefaults(preferredLang);
}

export async function ensurePromptDefaults(lang) {
    const candidates = _candidateLangs(lang);
    for (const c of candidates) {
        await _loadLang(c);
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
