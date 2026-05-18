const SAVE_REQUEST_PATHS = new Set([
    '/api/chats/save',
    '/api/chats/group/save',
]);

const HOOK_KEY = Symbol.for('horae.saveRequestGzipFetchHook');

function isRequest(input) {
    return typeof Request !== 'undefined' && input instanceof Request;
}

function isBlob(value) {
    return typeof Blob !== 'undefined' && value instanceof Blob;
}

function isUrlSearchParams(value) {
    return typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams;
}

function isFormData(value) {
    return typeof FormData !== 'undefined' && value instanceof FormData;
}

function isReadableStream(value) {
    return typeof ReadableStream !== 'undefined' && value instanceof ReadableStream;
}

function getRequestUrl(input) {
    if (typeof input === 'string') return input;
    if (typeof URL !== 'undefined' && input instanceof URL) return input.href;
    if (isRequest(input)) return input.url;
    return '';
}

function isSaveRequestUrl(url) {
    if (!url) return false;

    try {
        const parsed = new URL(url, window.location.href);
        return [...SAVE_REQUEST_PATHS].some(path => parsed.pathname === path || parsed.pathname.endsWith(path));
    } catch (_) {
        const path = String(url).split('?')[0];
        return SAVE_REQUEST_PATHS.has(path);
    }
}

function getRequestMethod(input, init) {
    return String(init?.method || (isRequest(input) ? input.method : '') || 'GET').toUpperCase();
}

function buildHeaders(input, init) {
    if (init?.headers) return new Headers(init.headers);
    if (isRequest(input)) return new Headers(input.headers);
    return new Headers();
}

function copyRequestOptions(input, init) {
    const requestOptions = {};
    if (!isRequest(input)) return requestOptions;

    const optionKeys = [
        'cache',
        'credentials',
        'integrity',
        'keepalive',
        'mode',
        'redirect',
        'referrer',
        'referrerPolicy',
        'signal',
    ];

    for (const key of optionKeys) {
        if (init && Object.prototype.hasOwnProperty.call(init, key)) continue;
        const value = input[key];
        if (value !== undefined) requestOptions[key] = value;
    }

    return requestOptions;
}

function normalizeBody(body) {
    if (body == null) return null;
    if (typeof body === 'string') {
        return body.length > 0 ? { body, contentType: 'text/plain;charset=UTF-8' } : null;
    }
    if (isBlob(body)) {
        return body.size > 0 ? { body, contentType: body.type || '' } : null;
    }
    if (body instanceof ArrayBuffer) {
        return body.byteLength > 0 ? { body, contentType: '' } : null;
    }
    if (ArrayBuffer.isView(body)) {
        return body.byteLength > 0 ? { body, contentType: '' } : null;
    }
    if (isUrlSearchParams(body)) {
        const text = body.toString();
        return text.length > 0 ? { body: text, contentType: 'application/x-www-form-urlencoded;charset=UTF-8' } : null;
    }
    if (isFormData(body) || isReadableStream(body)) return null;
    return null;
}

async function getCompressibleBody(input, init) {
    if (Object.prototype.hasOwnProperty.call(init || {}, 'body')) {
        return normalizeBody(init.body);
    }

    if (!isRequest(input) || input.bodyUsed || !input.body) {
        return null;
    }

    const bodyBlob = await input.clone().blob();
    return bodyBlob.size > 0 ? { body: bodyBlob, contentType: bodyBlob.type || '' } : null;
}

async function gzipBody(body) {
    if (typeof CompressionStream !== 'function') return null;

    const source = isBlob(body) ? body : new Blob([body]);
    const compressedStream = source.stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBlob = await new Response(compressedStream).blob();

    return compressedBlob.size > 0 ? compressedBlob : null;
}

function buildUncompressedRetry(input, init, method, originalHeaders, bodyInfo) {
    const headers = new Headers(originalHeaders);
    headers.delete('Content-Encoding');
    headers.delete('Content-Length');

    if (bodyInfo.contentType && !headers.has('Content-Type')) {
        headers.set('Content-Type', bodyInfo.contentType);
    }

    const retryInit = {
        ...copyRequestOptions(input, init),
        ...(init || {}),
        method,
        headers,
        body: bodyInfo.body,
    };

    return {
        input: isRequest(input) ? input.url : input,
        init: retryInit,
    };
}

/**
 * Installs a single fetch wrapper that gzip-compresses SillyTavern chat save bodies.
 * The wrapper intentionally never sets Content-Length because browsers forbid it.
 */
export function installSaveRequestGzipFetchHook({ isEnabled = () => true, logger = console } = {}) {
    const existing = window[HOOK_KEY];
    if (existing?.wrappedFetch) {
        existing.isEnabled = isEnabled;
        existing.logger = logger;
        return existing;
    }

    const state = {
        originalFetch: window.fetch.bind(window),
        wrappedFetch: null,
        isEnabled,
        logger,
    };

    state.wrappedFetch = async function horaeSaveRequestGzipFetch(input, init) {
        try {
            if (!state.isEnabled()) {
                return state.originalFetch(input, init);
            }

            const url = getRequestUrl(input);
            if (!isSaveRequestUrl(url)) {
                return state.originalFetch(input, init);
            }

            const method = getRequestMethod(input, init);
            if (!['POST', 'PUT', 'PATCH'].includes(method)) {
                return state.originalFetch(input, init);
            }

            const originalHeaders = buildHeaders(input, init);
            if (originalHeaders.has('Content-Encoding')) {
                return state.originalFetch(input, init);
            }

            const bodyInfo = await getCompressibleBody(input, init);
            if (!bodyInfo) {
                return state.originalFetch(input, init);
            }

            const compressedBody = await gzipBody(bodyInfo.body);
            if (!compressedBody) {
                return state.originalFetch(input, init);
            }

            const headers = new Headers(originalHeaders);
            if (bodyInfo.contentType && !headers.has('Content-Type')) {
                headers.set('Content-Type', bodyInfo.contentType);
            }
            headers.set('Content-Encoding', 'gzip');
            headers.delete('Content-Length');

            const compressedInit = {
                ...(init || {}),
                method,
                headers,
                body: compressedBody,
            };

            try {
                const response = await state.originalFetch(input, compressedInit);
                if (!response?.ok) {
                    state.logger?.warn?.(`[Horae] Gzip save request returned ${response?.status || 'non-OK'}, retrying uncompressed.`);
                    const retry = buildUncompressedRetry(input, init, method, originalHeaders, bodyInfo);
                    return await state.originalFetch(retry.input, retry.init);
                }
                return response;
            } catch (err) {
                state.logger?.warn?.('[Horae] Gzip save request failed, retrying uncompressed:', err);
                const retry = buildUncompressedRetry(input, init, method, originalHeaders, bodyInfo);
                return await state.originalFetch(retry.input, retry.init);
            }
        } catch (err) {
            state.logger?.warn?.('[Horae] Gzip save request skipped:', err);
            return state.originalFetch(input, init);
        }
    };

    window.fetch = state.wrappedFetch;
    window[HOOK_KEY] = state;
    return state;
}
