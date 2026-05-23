/** Horae - 时间工具函数 */

/** 中文周几映射 */
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

/** 季节名称 */
const SEASONS = ['冬季', '冬季', '春季', '春季', '春季', '夏季', '夏季', '夏季', '秋季', '秋季', '秋季', '冬季'];

/** 中文数字映射 */
const CHINESE_NUMS = {
    '零': 0, '〇': 0,
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '廿': 20, '廿一': 21, '廿二': 22, '廿三': 23, '廿四': 24, '廿五': 25,
    '廿六': 26, '廿七': 27, '廿八': 28, '廿九': 29, '三十': 30,
    '三十一': 31, '卅': 30, '卅一': 31,
    // 元年=1（其余如正月/腊月这些农历俗称暂不收，避免与公历月份冲突）
    '元': 1
};

/** 当前生效的自定义日历，未启用为 null */
let _customCalendar = null;

/** 装填或清空自定义日历；月名/天数对不上即视为无效配置，避免半截数据误判 */
export function setCustomCalendar(cfg) {
    if (!cfg || !cfg.enabled) { _customCalendar = null; return; }
    const names = Array.isArray(cfg.monthNames)
        ? cfg.monthNames.map(s => String(s || '').trim()).filter(Boolean)
        : [];
    const days = Array.isArray(cfg.monthDays)
        ? cfg.monthDays.map(n => parseInt(n, 10)).filter(n => Number.isFinite(n) && n > 0)
        : [];
    if (!names.length || names.length !== days.length) { _customCalendar = null; return; }
    const offsets = [];
    let acc = 0;
    for (const d of days) { offsets.push(acc); acc += d; }
    _customCalendar = { monthNames: names, monthDays: days, monthOffsets: offsets, yearLength: acc };
}

/** 返回当前自定义日历配置（未启用为 null） */
export function getActiveCustomCalendar() {
    return _customCalendar;
}

/** 中文数字短串转整数（一/二/.../三十一/廿X/卅X，兼容十一~十九、二十一~三十一） */
function _cnNumToInt(s) {
    if (!s) return null;
    if (CHINESE_NUMS[s] !== undefined) return CHINESE_NUMS[s];
    // 十X / 二十X / 三十X 这类组合 CHINESE_NUMS 没全列，这里兜底
    let m = s.match(/^([一二三四五六七八九])?十([一二三四五六七八九])?$/);
    if (m) {
        const tens = m[1] ? CHINESE_NUMS[m[1]] : 1;
        const ones = m[2] ? CHINESE_NUMS[m[2]] : 0;
        return tens * 10 + ones;
    }
    m = s.match(/^([廿卅])([一二三四五六七八九])?$/);
    if (m) {
        const base = m[1] === '廿' ? 20 : 30;
        const ones = m[2] ? CHINESE_NUMS[m[2]] : 0;
        return base + ones;
    }
    return null;
}

/** 逐位中文数字年份（二〇二四 / 一九九九），不支持千/百位写法 */
function _cnYearToInt(s) {
    if (!s) return null;
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    let n = 0;
    for (const ch of s) {
        const v = CHINESE_NUMS[ch];
        if (v === undefined || v > 9) return null;
        n = n * 10 + v;
    }
    return n || null;
}

/** 从日期字符串中提取日数 */
function extractDayNumber(dateStr) {
    if (!dateStr) return null;
    
    const arabicMatch = dateStr.match(/(?:第|Day\s*|day\s*)(\d+)(?:日)?/i) ||
                       dateStr.match(/(\d+)(?:日|号)/);
    if (arabicMatch) return parseInt(arabicMatch[1]);
    
    // 中文数字匹配
    const sortedEntries = Object.entries(CHINESE_NUMS).sort((a, b) => b[0].length - a[0].length);
    
    for (const [cn, num] of sortedEntries) {
        const patterns = [
            new RegExp(`第${cn}日`),
            new RegExp(`第${cn}(?![\u4e00-\u9fa5])`),  // 第X 后面不跟汉字
            new RegExp(`[月]${cn}日`),
            new RegExp(`${cn}日`)
        ];
        
        for (const pattern of patterns) {
            if (pattern.test(dateStr)) {
                return num;
            }
        }
    }
    
    const anyNumMatch = dateStr.match(/(\d+)/);
    if (anyNumMatch) return parseInt(anyNumMatch[1]);
    
    return null;
}

/** 月名按长度倒序匹配，避免短月名（春之月）吞掉长月名（春之月初始） */
function _parseCustomDate(s) {
    const cal = _customCalendar;
    if (!cal) return null;
    const order = cal.monthNames
        .map((name, i) => ({ name, i }))
        .sort((a, b) => b.name.length - a.name.length);
    for (const { name, i } of order) {
        const nameEsc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reYear = new RegExp(`(?:^|[^\\d\\u4e00-\\u9fa5])([零〇一二三四五六七八九十廿卅元]+|\\d+)年\\s*${nameEsc}\\s*([零〇一二三四五六七八九十廿卅]+|\\d+)日?`);
        const my = s.match(reYear);
        if (my) {
            const year = /^\d+$/.test(my[1]) ? parseInt(my[1], 10) : _cnNumToInt(my[1]);
            const day = /^\d+$/.test(my[2]) ? parseInt(my[2], 10) : _cnNumToInt(my[2]);
            if (year !== null && day !== null && day >= 1 && day <= cal.monthDays[i]) {
                return { year, monthIndex: i, day, type: 'custom' };
            }
        }
        const re = new RegExp(`${nameEsc}\\s*([零〇一二三四五六七八九十廿卅]+|\\d+)日?`);
        const m = s.match(re);
        if (m) {
            const day = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : _cnNumToInt(m[1]);
            if (day !== null && day >= 1 && day <= cal.monthDays[i]) {
                return { monthIndex: i, day, type: 'custom' };
            }
        }
    }
    return null;
}

/** 自定义日历的线性日序号，用于跨月跨年减法 */
function _customLinearDay(parsed) {
    const cal = _customCalendar;
    if (!cal || parsed.type !== 'custom') return null;
    const year = parsed.year ?? 0;
    return year * cal.yearLength + cal.monthOffsets[parsed.monthIndex] + (parsed.day - 1);
}

/** 从日期字符串中提取月份标识：仅识别「非数字月名」（春之月/霜降月） */
function extractMonthIdentifier(dateStr) {
    if (!dateStr) return null;
    const monthMatch = dateStr.match(/([^\s\d]+月)/);
    if (monthMatch) return monthMatch[1];
    return null;
}

/** 解析剧情日期字符串 */
export function parseStoryDate(dateStr) {
    if (!dateStr) return null;
    
    // 清理AI写的周几标注
    let cleanStr = dateStr.trim();
    
    const aiWeekdayMatch = cleanStr.match(/\(([日一二三四五六])\)/);
    cleanStr = cleanStr.replace(/\s*\([日一二三四五六]\)\s*/g, ' ').trim();
    
    // 无效日期按奇幻日历处理
    if (/[xX]{2}|[?？]{2}/.test(cleanStr)) {
        return { 
            type: 'fantasy',
            raw: dateStr.trim(),
            aiWeekday: aiWeekdayMatch ? aiWeekdayMatch[1] : undefined
        };
    }
    
    // 标准数字格式
    const fullMatch = cleanStr.match(/^(\d{4,})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (fullMatch) {
        const year = parseInt(fullMatch[1]);
        const month = parseInt(fullMatch[2]);
        const day = parseInt(fullMatch[3]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { year, month, day, type: 'standard' };
        }
    }
    
    const shortMatch = cleanStr.match(/^(\d{1,2})[\/\-](\d{1,2})(?:\s|$)/);
    if (shortMatch) {
        const month = parseInt(shortMatch[1]);
        const day = parseInt(shortMatch[2]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { month, day, type: 'standard' };
        }
    }
    
    // X年M月D日格式
    // 这个必须在纯 X月X日 之前，否则会丢失年份
    const yearCnMatch = cleanStr.match(/(\d+)年\s*(\d{1,2})月(\d{1,2})日?/);
    if (yearCnMatch) {
        const year = parseInt(yearCnMatch[1]);
        const month = parseInt(yearCnMatch[2]);
        const day = parseInt(yearCnMatch[3]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            // 提取历法前缀
            const fullMatchStr = yearCnMatch[0];
            const prefixEnd = cleanStr.indexOf(fullMatchStr);
            const calendarPrefix = cleanStr.substring(0, prefixEnd).trim() || undefined;
            return { year, month, day, type: 'standard', calendarPrefix };
        }
    }
    
    // X月X日格式
    const cnMatch = cleanStr.match(/(\d{1,2})月(\d{1,2})日?/);
    if (cnMatch) {
        const month = parseInt(cnMatch[1]);
        const day = parseInt(cnMatch[2]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { month, day, type: 'standard' };
        }
    }

    // 历法/纪年前缀 + 年月日（"萬曆十五年八月十六日" / "公元前2024年八月十六日" / "贞观元年五月廿八"）
    // 前缀首字必须是「非空白、非数字、非中文数字、非年月日」的普通字符，避免吃掉"二〇二四"这种纯年份
    const eraMatch = cleanStr.match(/^([^\s\d零〇一二三四五六七八九十廿卅元年月日][^\s年月日]*?)([零〇一二三四五六七八九十廿卅元]+|\d+)年\s*([零〇一二三四五六七八九十廿卅元]+|\d+)月([零〇一二三四五六七八九十廿卅元]+|\d+)日?/);
    if (eraMatch) {
        const calendarPrefix = eraMatch[1].trim() || undefined;
        const year = /^\d+$/.test(eraMatch[2]) ? parseInt(eraMatch[2], 10) : _cnNumToInt(eraMatch[2]);
        const month = /^\d+$/.test(eraMatch[3]) ? parseInt(eraMatch[3], 10) : _cnNumToInt(eraMatch[3]);
        const day = /^\d+$/.test(eraMatch[4]) ? parseInt(eraMatch[4], 10) : _cnNumToInt(eraMatch[4]);
        if (year !== null && year >= 1 && month !== null && month >= 1 && month <= 12 && day !== null && day >= 1 && day <= 31) {
            return { year, month, day, type: 'standard', calendarPrefix };
        }
    }

    // 纪年（任意前缀，含中文/阿拉伯年）+ 阿拉伯月日（"玄昭十五年 8/16" / "万历15年 8/16" / "2024年 8/16" / "贞观元年8/16"）
    // 前缀允许为空（纯阿拉伯/中文数字年），且 \s* 允许年与 M/D 之间有无空白；优先级必须高于 fantasy 兜底
    const yearSlashMatch = cleanStr.match(/^([^\s\d零〇一二三四五六七八九十廿卅元年月日]?[^\s年月日]*?)([零〇一二三四五六七八九十廿卅元]+|\d+)年\s*(\d{1,2})[\/\-](\d{1,2})\b/);
    if (yearSlashMatch) {
        const calendarPrefix = yearSlashMatch[1].trim() || undefined;
        const yearRaw = yearSlashMatch[2];
        let year;
        if (/^\d+$/.test(yearRaw)) {
            year = parseInt(yearRaw, 10);
        } else {
            year = _cnNumToInt(yearRaw);
            if (year === null) year = _cnYearToInt(yearRaw);
        }
        const month = parseInt(yearSlashMatch[3], 10);
        const day = parseInt(yearSlashMatch[4], 10);
        if (year !== null && year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { year, month, day, type: 'standard', calendarPrefix };
        }
    }

    // 中/阿年份 + 中文月日（"二〇二四年八月十六日" / "2024年八月十六日"）
    // 必须放在纯中文月日之前，否则会丢失年份
    const cnYearMixedMatch = cleanStr.match(/(\d+|[零〇一二三四五六七八九]+)年\s*([零〇一二三四五六七八九十廿卅]+)月([零〇一二三四五六七八九十廿卅]+)日?/);
    if (cnYearMixedMatch) {
        const year = _cnYearToInt(cnYearMixedMatch[1]);
        const month = _cnNumToInt(cnYearMixedMatch[2]);
        const day = _cnNumToInt(cnYearMixedMatch[3]);
        if (year !== null && month !== null && day !== null && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const fullMatchStr = cnYearMixedMatch[0];
            const prefixEnd = cleanStr.indexOf(fullMatchStr);
            const calendarPrefix = cleanStr.substring(0, prefixEnd).trim() || undefined;
            return { year, month, day, type: 'standard', calendarPrefix };
        }
    }

    // 纯中文月日（"八月十六日" / "十二月廿八日" / "六月二十三日"），按公历处理
    // 月名包含非数字字符的奇幻日历（春之月/霜降月）走下方 fantasy 分支
    const cnMonthDayMatch = cleanStr.match(/([零〇一二三四五六七八九十廿卅]+)月([零〇一二三四五六七八九十廿卅]+)日?/);
    if (cnMonthDayMatch) {
        const month = _cnNumToInt(cnMonthDayMatch[1]);
        const day = _cnNumToInt(cnMonthDayMatch[2]);
        if (month !== null && day !== null && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return { month, day, type: 'standard' };
        }
    }

    // 自定义日历：月名匹配优先于奇幻兜底，否则 春之月十五日 会被当作 monthId="春之月"
    if (_customCalendar) {
        const custom = _parseCustomDate(cleanStr);
        if (custom) return custom;
    }

    // 奇幻日历格式
    const monthId = extractMonthIdentifier(cleanStr);
    const dayNum = extractDayNumber(cleanStr);
    
    if (monthId || dayNum !== null) {
        return { 
            monthId: monthId,
            day: dayNum,
            type: 'fantasy',
            raw: dateStr.trim(),
            aiWeekday: aiWeekdayMatch ? aiWeekdayMatch[1] : undefined
        };
    }
    
    return null;
}

/** 计算两个日期之间的天数差 */
export function calculateRelativeTime(fromDate, toDate) {
    if (!fromDate || !toDate) return null;
    
    // 去掉尾部时间部分（如 "15:00" / "下午" / "酉时"），保留完整日期进行比较
    const stripTime = (s) => s.trim()
        .replace(/\s+\d{1,2}[:：]\d{2}.*$/, '')
        .replace(/\s+(凌晨|早上|上午|中午|下午|傍晚|晚上|深夜|子时|丑时|寅时|卯时|辰时|巳时|午时|未时|申时|酉时|戌时|亥时).*$/i, '')
        .trim();
    const fromDateOnly = stripTime(fromDate);
    const toDateOnly = stripTime(toDate);
    
    if (fromDateOnly === toDateOnly) {
        return 0;
    }
    
    const from = parseStoryDate(fromDate);
    const to = parseStoryDate(toDate);
    
    if (!from || !to) return null;
    
    // 自定义日历：必须两端都是 custom 才能算，跨历法返 null
    if (from.type === 'custom' || to.type === 'custom') {
        if (from.type !== 'custom' || to.type !== 'custom') return null;
        const f = _customLinearDay(from);
        const t = _customLinearDay(to);
        return (f === null || t === null) ? null : t - f;
    }

    // 标准格式精确计算
    if (from.type === 'standard' && to.type === 'standard') {
        // 跨历法前缀（萬曆 vs 崇禎、公元前 vs 现代）没有统一时间轴，相对时间标为未知
        const fromPrefix = from.calendarPrefix || '';
        const toPrefix = to.calendarPrefix || '';
        if (fromPrefix !== toPrefix) return null;

        const defaultYear = 2024;
        const fromYear = from.year || to.year || defaultYear;
        const toYear = to.year || from.year || defaultYear;
        
        const fromObj = new Date(0);
        fromObj.setFullYear(fromYear, from.month - 1, from.day);
        const toObj = new Date(0);
        toObj.setFullYear(toYear, to.month - 1, to.day);
        
        const diffTime = toObj.getTime() - fromObj.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }
    
    if (from.type === 'fantasy' || to.type === 'fantasy') {
        const fromDay = from.day;
        const toDay = to.day;
        const fromMonth = from.monthId || from.month;
        const toMonth = to.monthId || to.month;
        
        // 同月精确计算
        if (fromMonth && toMonth && fromMonth === toMonth && 
            fromDay !== null && toDay !== null) {
            return toDay - fromDay;
        }
        
        // 跨月：旧逻辑用「日」大小猜先后，在西幻/架空月名日历上极易误判（如 霜月3日 vs 火月25日）
        if (fromDay !== null && toDay !== null) {
            if (fromMonth && toMonth && fromMonth !== toMonth) {
                return null;
            }
            return toDay - fromDay;
        }
        
        return -999;
    }
    
    return null;
}

function getCalendarMonthDiff(fromDate, toDate) {
    if (!(fromDate instanceof Date) || Number.isNaN(fromDate.getTime())) return null;
    if (!(toDate instanceof Date) || Number.isNaN(toDate.getTime())) return null;
    return (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth());
}

function getWeekDiffByMonday(fromDate, toDate) {
    if (!(fromDate instanceof Date) || Number.isNaN(fromDate.getTime())) return null;
    if (!(toDate instanceof Date) || Number.isNaN(toDate.getTime())) return null;
    const DAY_MS = 86400000;
    const WEEK_MS = DAY_MS * 7;
    const weekStartUtc = (date) => {
        const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        const day = (date.getDay() + 6) % 7;
        return utc - day * DAY_MS;
    };
    return Math.round((weekStartUtc(toDate) - weekStartUtc(fromDate)) / WEEK_MS);
}

export function getRelativeTimeMeta(days, options = {}) {
    if (days === null || days === undefined) return { key: 'unknown', days };
    if (days === -999) return { key: 'special_earlier', days };
    if (days === -998) return { key: 'special_after', days };
    if (days === -997) return { key: 'special_before', days };

    if (days === 0) return { key: 'today', days };
    if (days === 1) return { key: 'yesterday', days };
    if (days === 2) return { key: 'day_before_yesterday', days };
    if (days === 3) return { key: 'three_days_ago', days };
    if (days === -1) return { key: 'tomorrow', days };
    if (days === -2) return { key: 'day_after_tomorrow', days };
    if (days === -3) return { key: 'in_three_days', days };

    const { fromDate, toDate } = options;
    if (days > 0) {
        if (days < 7) return { key: 'days_ago', days, value: days };

        if (days >= 4 && days <= 13 && fromDate) {
            const weekDiff = toDate ? getWeekDiffByMonday(fromDate, toDate) : 1;
            if (weekDiff === 1) return { key: 'last_weekday', days, weekday: fromDate.getDay() };
            if (weekDiff === 2) return { key: 'week_before_last_weekday', days, weekday: fromDate.getDay() };
        }

        if (days >= 7 && days < 60 && fromDate && toDate) {
            const monthDiff = getCalendarMonthDiff(fromDate, toDate);
            if (monthDiff === 1) return { key: 'last_month_day', days, month: fromDate.getMonth() + 1, day: fromDate.getDate() };
        }

        if (days >= 300 && fromDate && toDate) {
            const yearDiff = toDate.getFullYear() - fromDate.getFullYear();
            if (yearDiff === 1) return { key: 'last_year_date', days, month: fromDate.getMonth() + 1, day: fromDate.getDate() };
            if (yearDiff === 2) return { key: 'year_before_last_date', days, month: fromDate.getMonth() + 1, day: fromDate.getDate() };
        }

        if (days < 30) return { key: 'days_ago', days, value: days };
        if (days < 365) {
            const monthDiff = fromDate && toDate ? getCalendarMonthDiff(fromDate, toDate) : null;
            return { key: 'months_ago', days, value: Math.max(1, monthDiff && monthDiff > 0 ? monthDiff : Math.floor(days / 30)) };
        }

        const years = Math.floor(days / 365);
        const months = Math.round((days % 365) / 30);
        if (months > 0 && years < 5) return { key: 'years_months_ago', days, years, months };
        return { key: 'years_ago', days, years };
    }

    const absDays = Math.abs(days);
    if (absDays < 7) return { key: 'days_later', days, absDays, value: absDays };

    if (absDays >= 4 && absDays <= 13 && fromDate) {
        const weekDiff = toDate ? getWeekDiffByMonday(fromDate, toDate) : -1;
        if (weekDiff === -1) return { key: 'next_weekday', days, absDays, weekday: fromDate.getDay() };
        if (weekDiff === -2) return { key: 'week_after_next_weekday', days, absDays, weekday: fromDate.getDay() };
    }

    if (absDays >= 7 && absDays < 60 && fromDate && toDate) {
        const monthDiff = getCalendarMonthDiff(fromDate, toDate);
        if (monthDiff === -1) return { key: 'next_month_day', days, absDays, month: fromDate.getMonth() + 1, day: fromDate.getDate() };
    }

    if (absDays < 30) return { key: 'days_later', days, absDays, value: absDays };
    if (absDays < 365) {
        const monthDiff = fromDate && toDate ? getCalendarMonthDiff(fromDate, toDate) : null;
        return { key: 'months_later', days, absDays, value: Math.max(1, monthDiff && monthDiff < 0 ? Math.abs(monthDiff) : Math.floor(absDays / 30)) };
    }

    const years = Math.floor(absDays / 365);
    const months = Math.round((absDays % 365) / 30);
    if (months > 0 && years < 5) return { key: 'years_months_later', days, absDays, years, months };
    return { key: 'years_later', days, absDays, years };
}

/** 格式化相对时间描述 */
export function formatRelativeTime(days, options = {}) {
    const meta = getRelativeTimeMeta(days, options);
    switch (meta.key) {
        case 'unknown': return '未知';
        case 'special_earlier': return '较早';
        case 'special_after': return '之后';
        case 'special_before': return '之前';
        case 'today': return '今天';
        case 'yesterday': return '昨天';
        case 'day_before_yesterday': return '前天';
        case 'three_days_ago': return '大前天';
        case 'tomorrow': return '明天';
        case 'day_after_tomorrow': return '后天';
        case 'in_three_days': return '大后天';
        case 'last_weekday': return `上周${WEEKDAY_NAMES[meta.weekday]}`;
        case 'week_before_last_weekday': return `上上周${WEEKDAY_NAMES[meta.weekday]}`;
        case 'next_weekday': return `下周${WEEKDAY_NAMES[meta.weekday]}`;
        case 'week_after_next_weekday': return `下下周${WEEKDAY_NAMES[meta.weekday]}`;
        case 'last_month_day': return `上个月${meta.day}号`;
        case 'next_month_day': return `下个月${meta.day}号`;
        case 'last_year_date': return `去年${meta.month}月${meta.day}日`;
        case 'year_before_last_date': return `前年${meta.month}月${meta.day}日`;
        case 'days_ago': return `${meta.value}天前`;
        case 'days_later': return `${meta.value}天后`;
        case 'months_ago': return `${meta.value}个月前`;
        case 'months_later': return `${meta.value}个月后`;
        case 'years_months_ago': return `${meta.years}年${meta.months}个月前`;
        case 'years_months_later': return `${meta.years}年${meta.months}个月后`;
        case 'years_ago': return `${meta.years}年前`;
        case 'years_later': return `${meta.years}年后`;
        default: return '未知';
    }
}

/** 格式化剧情日期为标准格式 */
export function formatStoryDate(dateObj, includeWeekday = false) {
    if (!dateObj) return '';
    // 自定义日历：用月名+日数组成显示串
    if (dateObj.type === 'custom' && _customCalendar) {
        const name = _customCalendar.monthNames[dateObj.monthIndex] || '?';
        const yr = dateObj.year ? `${dateObj.year}年` : '';
        return `${yr}${name}${dateObj.day}日`;
    }
    // 奇幻日历保留原始字符串
    if (dateObj.raw && !dateObj.month) {
        let result = dateObj.raw;
        if (includeWeekday && dateObj.aiWeekday && !result.includes(`(${dateObj.aiWeekday})`)) {
            result += ` (${dateObj.aiWeekday})`;
        }
        return result;
    }
    
    let dateStr = '';
    const prefix = dateObj.calendarPrefix || '';
    
    if (dateObj.year) {
        if (prefix) {
            // 保留历法前缀
            dateStr = `${prefix}${dateObj.year}年${dateObj.month}月${dateObj.day}日`;
        } else {
            dateStr = `${dateObj.year}/${dateObj.month}/${dateObj.day}`;
        }
    } else if (dateObj.month && dateObj.day) {
        dateStr = `${dateObj.month}/${dateObj.day}`;
    }
    
    if (includeWeekday && dateObj.month && dateObj.day) {
        const refYear = dateObj.year || new Date().getFullYear();
        // setFullYear 避免年份自动偏移
        const date = new Date(0);
        date.setFullYear(refYear, dateObj.month - 1, dateObj.day);
        const weekday = WEEKDAY_NAMES[date.getDay()];
        dateStr += ` (${weekday})`;
    }
    
    return dateStr;
}

/** 格式化完整的剧情日期时间 */
export function formatFullDateTime(dateStr, timeStr) {
    const parsed = parseStoryDate(dateStr);
    if (!parsed) return dateStr + (timeStr ? ' ' + timeStr : '');
    
    const dateWithWeekday = formatStoryDate(parsed, true);
    return dateWithWeekday + (timeStr ? ' ' + timeStr : '');
}

/** 获取当前系统时间 */
export function getCurrentSystemTime() {
    const now = new Date();
    return {
        date: `${now.getMonth() + 1}/${now.getDate()}`,
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    };
}

/** 生成时间参考信息 */
export function generateTimeReference(currentDate) {
    const current = parseStoryDate(currentDate);
    if (!current) return null;
    
    if (current.type === 'fantasy' || current.type === 'custom') {
        return {
            current: currentDate,
            type: current.type,
            note: current.type === 'custom'
                ? '自定义日历模式，相对日期由插件自动计算'
                : '奇幻日历模式，相对日期由插件自动计算'
        };
    }
    
    const refYear = current.year || new Date().getFullYear();
    const baseDate = new Date(0);
    baseDate.setFullYear(refYear, current.month - 1, current.day);
    
    const getDateString = (daysOffset) => {
        const d = new Date(baseDate.getTime());
        d.setDate(d.getDate() + daysOffset);
        const weekday = WEEKDAY_NAMES[d.getDay()];
        return `${d.getMonth() + 1}/${d.getDate()} (${weekday})`;
    };
    
    return {
        current: currentDate,
        type: 'standard',
        yesterday: getDateString(-1),
        dayBefore: getDateString(-2),
        threeDaysAgo: getDateString(-3),
        tomorrow: getDateString(1)
    };
}

/** 计算两个日期之间的详细差异 */
export function calculateDetailedRelativeTime(fromDateStr, toDateStr) {
    const days = calculateRelativeTime(fromDateStr, toDateStr);
    if (days === null) return { days: null, relative: '未知' };
    
    const from = parseStoryDate(fromDateStr);
    const to = parseStoryDate(toDateStr);
    
    let fromDate = null;
    let toDate = null;
    
    if (from?.type === 'standard' && to?.type === 'standard') {
        const defaultYear = new Date().getFullYear();
        const fromYear = from.year || to.year || defaultYear;
        const toYear = to.year || from.year || defaultYear;
        fromDate = new Date(0);
        fromDate.setFullYear(fromYear, from.month - 1, from.day);
        toDate = new Date(0);
        toDate.setFullYear(toYear, to.month - 1, to.day);
    }
    
    const relative = formatRelativeTime(days, { fromDate, toDate });
    
    return { days, fromDate, toDate, relative };
}

/** 从当前日期减去指定天数 */
export function subtractDays(dateStr, days) {
    const parsed = parseStoryDate(dateStr);
    if (!parsed || parsed.type === 'fantasy') return dateStr;

    if (parsed.type === 'custom' && _customCalendar) {
        const cal = _customCalendar;
        const linear = _customLinearDay(parsed) - days;
        if (linear < 0) return dateStr;
        const year = Math.floor(linear / cal.yearLength);
        let rem = linear - year * cal.yearLength;
        let mi = 0;
        for (; mi < cal.monthDays.length; mi++) {
            if (rem < cal.monthDays[mi]) break;
            rem -= cal.monthDays[mi];
        }
        const yr = parsed.year != null ? `${year}年` : '';
        return `${yr}${cal.monthNames[mi]}${rem + 1}日`;
    }

    const refYear = parsed.year || 2024;
    const date = new Date(0);
    date.setFullYear(refYear, parsed.month - 1, parsed.day);
    date.setDate(date.getDate() - days);
    
    if (parsed.year) {
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** 十二地支 → 起始小时（初=首小时，正=次小时） */
const EARTHLY_BRANCH_HOURS = {
    '子': 23, '丑': 1, '寅': 3, '卯': 5,
    '辰': 7, '巳': 9, '午': 11, '未': 13,
    '申': 15, '酉': 17, '戌': 19, '亥': 21
};

/** 获取时间段描述 */
export function getTimeOfDay(timeStr) {
    if (!timeStr) return '';
    
    let hour = null;
    
    const match24 = timeStr.match(/(\d{1,2})[:：]/);
    if (match24) {
        hour = parseInt(match24[1]);
    }
    
    const matchCN = timeStr.match(/(凌晨|早上|上午|中午|下午|傍晚|晚上|深夜)/);
    if (matchCN) {
        return matchCN[1];
    }
    
    // 十二地支时辰兜底（子丑寅卯辰巳午未申酉戌亥 + 可选"时"/"初"/"正"）
    if (hour === null) {
        const branchMatch = timeStr.match(/([子丑寅卯辰巳午未申酉戌亥])时?(?:初|正)?/);
        if (branchMatch) {
            const base = EARTHLY_BRANCH_HOURS[branchMatch[0].charAt(0)];
            if (base !== undefined) {
                hour = /正/.test(branchMatch[0]) ? (base + 1) % 24 : base;
            }
        }
    }
    
    if (hour !== null) {
        if (hour >= 0 && hour < 5) return '凌晨';
        if (hour >= 5 && hour < 8) return '早上';
        if (hour >= 8 && hour < 11) return '上午';
        if (hour >= 11 && hour < 13) return '中午';
        if (hour >= 13 && hour < 17) return '下午';
        if (hour >= 17 && hour < 19) return '傍晚';
        if (hour >= 19 && hour < 23) return '晚上';
        return '深夜';
    }
    
    return '';
}
