/**
 * Horae - 国际化 (i18n) 模块
 *
 * 语言检测优先级：
 *   用户设置 (settings.uiLanguage) → SillyTavern 界面语言 → 浏览器语言 → 英文兜底
 *
 * 回退链：
 *   中文语言 → zh-CN 回退
 *   非中文语言 → en 回退
 *
 * 使用方式：
 *   import { t, setLanguage, getLanguage, isZhLocale } from './i18n.js';
 *   t('settings.title')          // → 对应当前语言的翻译
 *   t('settings.count', { n: 5 }) // → 插值: "共 5 条"
 */

const _localeCache = {};
let _currentLang = null;
let _fallbackData = null;
let _currentData = null;
let _pluginBasePath = '';
let _zhFallback = null;
let _enFallback = null;

const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ko', 'ja', 'ru'];
const DEFAULT_LANG = 'en';
const ZH_LANGS = new Set(['zh-CN', 'zh-TW']);

function _normalizeLang(raw) {
    if (!raw) return null;
    const lower = raw.toLowerCase().replace(/_/g, '-');
    if (lower === 'zh-cn' || lower === 'zh-hans') return 'zh-CN';
    if (lower === 'zh-tw' || lower === 'zh-hant' || lower === 'zh-hk' || lower === 'zh-mo') return 'zh-TW';
    if (lower === 'zh') return null;
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('ko')) return 'ko';
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('ru')) return 'ru';
    return null;
}

function _resolveAmbiguousZh() {
    try {
        const navLangs = navigator.languages || [navigator.language];
        for (const l of navLangs) {
            const lower = l.toLowerCase().replace(/_/g, '-');
            if (lower === 'zh-tw' || lower === 'zh-hant' || lower === 'zh-hk' || lower === 'zh-mo') return 'zh-TW';
            if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-sg') return 'zh-CN';
        }
    } catch { /* ignore */ }
    return 'zh-CN';
}

function _detectLanguage(settings) {
    if (settings?.uiLanguage && settings.uiLanguage !== 'auto') {
        const n = _normalizeLang(settings.uiLanguage);
        if (n && SUPPORTED_LANGS.includes(n)) return n;
    }

    try {
        const stLang = document.documentElement.lang
                    || document.querySelector('html')?.getAttribute('lang');
        if (stLang) {
            const lower = stLang.toLowerCase().replace(/_/g, '-');
            if (lower === 'zh') {
                return _resolveAmbiguousZh();
            }
            const n = _normalizeLang(stLang);
            if (n && SUPPORTED_LANGS.includes(n)) return n;
        }
    } catch { /* ignore */ }

    try {
        const navLangs = navigator.languages || [navigator.language];
        for (const l of navLangs) {
            const lower = l.toLowerCase().replace(/_/g, '-');
            if (lower === 'zh') {
                return _resolveAmbiguousZh();
            }
            const n = _normalizeLang(l);
            if (n && SUPPORTED_LANGS.includes(n)) return n;
        }
    } catch { /* ignore */ }

    return DEFAULT_LANG;
}

async function _loadLocale(lang) {
    if (_localeCache[lang]) return _localeCache[lang];
    try {
        const url = `${_pluginBasePath}/locales/${lang}.json`;
        const resp = await fetch(url);
        if (!resp.ok) {
            console.warn(`[Horae i18n] Failed to load locale ${lang}: ${resp.status}`);
            return null;
        }
        const data = await resp.json();
        _localeCache[lang] = data;
        return data;
    } catch (e) {
        console.warn(`[Horae i18n] Error loading locale ${lang}:`, e);
        return null;
    }
}

function _resolveNode(data, key) {
    if (!data) return undefined;
    const parts = key.split('.');
    let node = data;
    for (const p of parts) {
        if (node == null || typeof node !== 'object') return undefined;
        node = node[p];
    }
    return node;
}

function _resolve(data, key) {
    const node = _resolveNode(data, key);
    return typeof node === 'string' ? node : undefined;
}

function _interpolate(template, vars) {
    if (!vars || !template) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

/**
 * 翻译函数。根据 key 返回当前语言的文本，支持 {{var}} 插值。
 * 回退链：当前语言 → 语系回退(中文→zh-CN, 其他→en) → key本身
 */
export function t(key, vars) {
    let val = _resolve(_currentData, key);
    if (val === undefined) val = _resolve(_fallbackData, key);
    if (val === undefined) return key;
    return _interpolate(val, vars);
}

/**
 * 获取当前 UI 语言代码
 */
export function getLanguage() {
    return _currentLang || DEFAULT_LANG;
}

/**
 * 当前语言是否为中文（简体或繁体）
 */
export function isZhLocale() {
    return ZH_LANGS.has(_currentLang);
}

/**
 * 当前语言是否为简体中文
 */
export function isSimplifiedChinese() {
    return _currentLang === 'zh-CN';
}

/**
 * 检测实际生效的 AI 输出语言代码
 * 优先级：aiOutputLanguage → uiLanguage → 自动检测的当前语言 → 'en'
 */
export function detectEffectiveAiLang(settings) {
    const aiLang = settings?.aiOutputLanguage || 'auto';
    if (aiLang !== 'auto' && SUPPORTED_LANGS.includes(aiLang)) return aiLang;
    const uiLang = settings?.uiLanguage || 'auto';
    if (uiLang !== 'auto' && SUPPORTED_LANGS.includes(uiLang)) return uiLang;
    return _currentLang || DEFAULT_LANG;
}

/**
 * 检测实际生效的 AI 输出语言是否为中文
 */
export function detectEffectiveAiLangIsZh(settings) {
    return ZH_LANGS.has(detectEffectiveAiLang(settings));
}

function _pickFallback(lang) {
    return ZH_LANGS.has(lang) ? _zhFallback : _enFallback;
}

/**
 * Translate using a specific loaded locale. Used for data that follows AI output language
 * rather than the current UI language.
 */
export function tForLang(lang, key, vars) {
    const target = _normalizeLang(lang) || _currentLang || DEFAULT_LANG;
    let val = _resolve(_localeCache[target], key);
    if (val === undefined) val = _resolve(_pickFallback(target), key);
    if (val === undefined) return key;
    return _interpolate(val, vars);
}

/**
 * 取指定语言下的任意节点（字符串 / 数组 / 对象）
 * 主要用于加载关键词表、正则源等非字符串数据；目标和兜底都缺失时返回 undefined
 */
export function tNodeForLang(lang, key) {
    const target = _normalizeLang(lang) || _currentLang || DEFAULT_LANG;
    const node = _resolveNode(_localeCache[target], key);
    if (node !== undefined) return node;
    return _resolveNode(_pickFallback(target), key);
}

/**
 * 切换 UI 语言并重新加载翻译
 */
export async function setLanguage(lang) {
    let target;
    if (lang === 'auto') {
        target = _detectLanguage(null);
    } else {
        const normalized = _normalizeLang(lang);
        target = (normalized && SUPPORTED_LANGS.includes(normalized)) ? normalized : DEFAULT_LANG;
    }

    const data = await _loadLocale(target);
    if (data) {
        _currentLang = target;
        _currentData = data;
        _fallbackData = _pickFallback(target);
    } else if (target !== DEFAULT_LANG) {
        console.warn(`[Horae i18n] Locale ${target} not found, falling back to ${DEFAULT_LANG}`);
        _currentLang = DEFAULT_LANG;
        _currentData = _enFallback;
        _fallbackData = _enFallback;
    }
    return _currentLang;
}

/**
 * 初始化 i18n 模块（应在插件加载时调用一次）
 */
export async function initI18n(basePath, settings) {
    _pluginBasePath = basePath.replace(/\/+$/, '');

    _zhFallback = await _loadLocale('zh-CN') || {};
    _enFallback = await _loadLocale('en') || {};
    await Promise.all(SUPPORTED_LANGS.map(lang => _loadLocale(lang)));

    const detected = _detectLanguage(settings);

    const data = await _loadLocale(detected);
    if (data) {
        _currentLang = detected;
        _currentData = data;
    } else {
        _currentLang = DEFAULT_LANG;
        _currentData = _enFallback;
    }

    _fallbackData = _pickFallback(_currentLang);

    console.log(`[Horae i18n] Language: ${_currentLang}`);
    return _currentLang;
}

export { SUPPORTED_LANGS, DEFAULT_LANG };
