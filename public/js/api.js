let csrfToken = null;

function setCsrfToken(token) {
  if (typeof token === 'string' && token.length > 20) {
    csrfToken = token;
  }
}

async function fetchCsrfToken() {
  const response = await fetch('/api/auth/csrf', {
    method: 'GET',
    credentials: 'same-origin'
  });

  if (!response.ok) {
    throw new Error('Failed to initialize security token.');
  }

  const payload = await response.json();
  setCsrfToken(payload?.csrfToken);
}

async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && path !== '/api/auth/login') {
    if (!csrfToken) {
      await fetchCsrfToken();
    }

    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(path, {
    headers,
    credentials: 'same-origin',
    ...options
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || 'Request failed.';
    throw new Error(message);
  }

  if (data?.csrfToken) {
    setCsrfToken(data.csrfToken);
  }

  return data;
}

function showMessage(targetId, text, type = 'success') {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.textContent = text;
  target.className = `message ${type}`;
}

function clearMessage(targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.textContent = '';
  target.className = 'message';
}

async function ensureAuth() {
  try {
    const me = await apiRequest('/api/auth/me');
    if (me?.csrfToken) {
      setCsrfToken(me.csrfToken);
    }
  } catch (error) {
    window.location.href = '/login.html';
  }
}

async function logout() {
  await apiRequest('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}
