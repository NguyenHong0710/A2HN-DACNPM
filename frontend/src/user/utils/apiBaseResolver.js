const API_PREFIX = '/api'; 
const HEALTH_PATH = '/api/login'; 
const CACHE_KEY = 'api_origin_cache';

const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/\/+$/, '');
};

const parseFallbackPorts = () => {
  const defaults = ['8000', '8080', '8888'];
  const raw = import.meta.env.VITE_API_FALLBACK_PORTS || '';
  if (!raw || typeof raw !== 'string') return defaults;
  const parsed = raw.split(',').map((item) => item.trim()).filter((item) => /^\d{2,5}$/.test(item));
  return parsed.length ? [...new Set(parsed)] : defaults;
};

const buildCandidateOrigins = () => {
  const hardcodedLaravel = 'http://127.0.0.1:8000';
  const envOrigin = normalizeOrigin(import.meta.env.VITE_API_ORIGIN || '');
  const envApiBase = normalizeOrigin(import.meta.env.VITE_API_BASE_URL || '');
  const cachedOrigin = normalizeOrigin(localStorage.getItem(CACHE_KEY) || '');
  const host = window.location.hostname || 'localhost';
  const fallbackPorts = parseFallbackPorts();

  const hostCandidates = fallbackPorts.flatMap((port) => [
    `http://${host}:${port}`,
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
  ]);

  const candidates = [
    hardcodedLaravel,
    envOrigin,
    envApiBase,
    cachedOrigin,
    ...hostCandidates,
  ].filter(Boolean);

  return [...new Set(candidates)];
};

const probeOrigin = async (origin, nativeFetch) => {
  const url = `${origin}${HEALTH_PATH}`;
  try {
    const res = await nativeFetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'omit',
    });
    // 200, 405, 401 đều có nghĩa là Server đang sống tại Port này
    return res.status === 200 || res.status === 405 || res.status === 401;
  } catch (err) {
    return false;
  }
};

const resolveApiOrigin = (() => {
  let resolvingPromise = null;
  return (nativeFetch) => {
    if (resolvingPromise) return resolvingPromise;
    resolvingPromise = (async () => {
      const origins = buildCandidateOrigins();
      for (const origin of origins) {
        const ok = await probeOrigin(origin, nativeFetch);
        if (ok) {
          localStorage.setItem(CACHE_KEY, origin);
          return origin;
        }
      }
      return 'http://127.0.0.1:8000'; 
    })();
    return resolvingPromise;
  };
})();

// HÀM ĐÃ SỬA 1: Kiểm tra xem có cần ghi lại URL không (Tránh nhân đôi)
const shouldRewriteUrl = (input) => {
  const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
  
  // Nếu đã có cổng 8000 hoặc localhost:8000 thì ĐỪNG rewrite nữa
  if (urlStr.includes(':8000/api') || urlStr.includes('127.0.0.1:8000')) {
    return false;
  }

  return urlStr.includes('/api/') || urlStr.includes('/nongsan-api/');
};

// HÀM ĐÃ SỬA 2: Xử lý gộp URL thông minh
const rewriteUrl = (input, origin) => {
  if (!origin) return input;
  
  let path = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);

  // Xử lý prefix cũ nếu có
  if (path.includes('/nongsan-api')) {
    path = path.replace('/nongsan-api', '');
  }

  // Nếu path là URL tuyệt đối nhưng sai port (localhost:3000), lấy từ đoạn /api trở đi
  if (path.startsWith('http')) {
    const apiIndex = path.indexOf('/api/');
    if (apiIndex !== -1) {
      path = path.substring(apiIndex);
    }
  }

  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  const rewritten = `${cleanOrigin}/${cleanPath}`;

  if (typeof input === 'string') return rewritten;
  if (input instanceof URL) return new URL(rewritten);
  if (typeof Request !== 'undefined' && input instanceof Request) {
    return new Request(rewritten, input);
  }
  return rewritten;
};

export const installApiFetchAdapter = () => {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if (window.__apiFetchAdapterInstalled) return;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    if (!shouldRewriteUrl(input)) {
      return nativeFetch(input, init);
    }
    const origin = await resolveApiOrigin(nativeFetch);
    const rewritten = rewriteUrl(input, origin);
    
    // Log để bạn kiểm tra trong Console (F12)
    console.log(`🚀 Request gửi đi: ${rewritten}`);
    
    return nativeFetch(rewritten, init);
  };

  window.__apiFetchAdapterInstalled = true;
};