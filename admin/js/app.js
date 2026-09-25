const API_BASE = '/api';
const TOKEN_KEY = 'tpg_admin_token';
const USER_KEY = 'tpg_admin_user';
const AdminApp = { routes: {}, currentRoute: null };

function saveToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }
function saveUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
function clearUser() { localStorage.removeItem(USER_KEY); }

function logout() {
  clearToken();
  clearUser();
  AdminApp.navigate('login');
}

async function apiRequest(method, endpoint, body, isUpload = false) {
  const url = API_BASE + endpoint;
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (body !== undefined) {
    if (isUpload) {
      opts.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  try {
    const res = await fetch(url, opts);
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }
    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    if (!res.ok) {
      const msg = (data && data.message) || (data && data.error) || (typeof data === 'string' && data) || ('Request failed: ' + res.status);
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    if (err.message && err.message.includes('Session expired')) throw err;
    throw err;
  }
}

function apiGet(endpoint) { return apiRequest('GET', endpoint); }
function apiPost(endpoint, body) { return apiRequest('POST', endpoint, body); }
function apiPut(endpoint, body) { return apiRequest('PUT', endpoint, body); }
function apiPatch(endpoint, body) { return apiRequest('PATCH', endpoint, body); }
function apiDel(endpoint) { return apiRequest('DELETE', endpoint); }
function apiUpload(endpoint, file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiRequest('POST', endpoint, fd, true);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  const bgMap = {
    success: 'linear-gradient(135deg,#2ea771,#1f8f5e)',
    error: 'linear-gradient(135deg,#e05353,#c83e3e)',
    info: 'linear-gradient(135deg,#1687c8,#0f6fa8)',
    warning: 'linear-gradient(135deg,#f4a624,#d98b10)'
  };
  el.className = 'toast toast-' + type;
  el.style.cssText = 'padding:12px 18px;border-radius:6px;color:#fff;font-size:13px;font-weight:600;margin-bottom:8px;box-shadow:0 8px 24px rgba(0,0,0,.3);background:' + (bgMap[type] || bgMap.info) + ';';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
  setTimeout(() => el.remove(), 3500);
}

function confirmDialog(msg) {
  return Promise.resolve(confirm(msg));
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString();
}

function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

function showModal(title, bodyHtml, footHtml) {
  const bg = document.getElementById('modal-bg');
  if (!bg) return;
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHtml;
  $('#modal-foot').innerHTML = footHtml || '';
  bg.classList.add('show');
}

function hideModal() {
  const bg = document.getElementById('modal-bg');
  if (!bg) return;
  bg.classList.remove('show');
  $('#modal-body').innerHTML = '';
  $('#modal-foot').innerHTML = '';
}

function imagePickerInput(initialUrl, onSelectCallback) {
  const safeUrl = escapeHtml(initialUrl || '');
  const hasInitial = !!safeUrl;
  const html = `<div class="img-picker">
    <div style="position:relative;width:100%;max-height:140px;margin-bottom:8px;">
      <img class="image-preview" src="${safeUrl}" style="width:100%;max-height:140px;object-fit:cover;border:1px solid var(--line);border-radius:4px;display:${hasInitial ? 'block' : 'none'};">
      <div class="img-preview-fallback" style="width:100%;height:140px;${hasInitial ? 'display:none;' : 'display:grid;'}place-items:center;background:var(--navy2);border:1px dashed var(--line);border-radius:4px;font-size:28px;color:var(--mist);">
        <span style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span>🖼️</span>
          <small style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;">No Image</small>
        </span>
      </div>
    </div>
    <input type="hidden" class="img-url-input" value="${safeUrl}">
    <button type="button" class="btn btn-secondary pick-btn"><i>📤</i> Upload</button>
    <button type="button" class="icon-btn browse-btn" title="Browse library">🗂️</button>
    <input type="file" accept="image/*,video/*,.pdf" class="img-file" hidden>
  </div>`;
  setTimeout(() => {
    const containers = $$('.img-picker');
    containers.forEach(picker => {
      if (picker.dataset.bound) return;
      picker.dataset.bound = '1';
      const pickBtn = picker.querySelector('.pick-btn');
      const fileInput = picker.querySelector('.img-file');
      const browseBtn = picker.querySelector('.browse-btn');
      const hiddenInput = picker.querySelector('.img-url-input');
      const preview = picker.querySelector('.image-preview');
      const fallback = picker.querySelector('.img-preview-fallback');

      function showImage(url) {
        if (!url) {
          preview.removeAttribute('src');
          preview.style.display = 'none';
          if (fallback) fallback.style.display = 'grid';
          return;
        }
        preview.onerror = () => {
          preview.style.display = 'none';
          if (fallback) fallback.style.display = 'grid';
        };
        preview.onload = () => {
          preview.style.display = 'block';
          if (fallback) fallback.style.display = 'none';
        };
        preview.src = url;
      }

      if (hasInitial) {
        preview.onerror = () => {
          preview.style.display = 'none';
          if (fallback) fallback.style.display = 'grid';
        };
        preview.onload = () => {
          preview.style.display = 'block';
          if (fallback) fallback.style.display = 'none';
        };
      }

      pickBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const res = await apiUpload('/media/upload', file);
          const url = (res && (res.url || res.path || (res.data && (res.data.url || res.data.path)))) || '';
          if (url) {
            hiddenInput.value = url;
            showImage(url);
            toast('Uploaded successfully', 'success');
            if (onSelectCallback) onSelectCallback(url);
          } else {
            toast('Upload succeeded but no URL returned', 'warning');
          }
        } catch (err) {
          toast('Upload failed: ' + err.message, 'error');
        }
        fileInput.value = '';
      });
      browseBtn.addEventListener('click', async () => {
        try {
          const media = await apiGet('/media?limit=200');
          const items = (media && (media.items || media.data || (Array.isArray(media) ? media : []))) || [];
          const grid = items.map(m => {
            const murl = m.url || m.file_path || m.path || '';
            const mtype = m.type || m.file_type || '';
            const mname = m.name || m.original_name || murl;
            const isImage = mtype === 'image' || mtype.startsWith('image/') || (murl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(murl));
            let thumb;
            if (isImage) {
              thumb = `<div style="position:relative;width:100%;height:90px;">
                <img src="${escapeHtml(murl)}" style="width:100%;height:90px;object-fit:cover;border-radius:4px;display:block;" class="lib-thumb">
                <div class="lib-thumb-fallback" style="position:absolute;inset:0;display:none;place-items:center;background:var(--navy2);border-radius:4px;font-size:24px;">🖼️</div>
              </div>`;
            } else {
              thumb = `<div style="width:100%;height:90px;display:grid;place-items:center;background:var(--navy2);border-radius:4px;font-size:28px;">${mtype === 'video' || mtype.startsWith('video/') ? '🎬' : mname.endsWith('.pdf') || mtype.includes('pdf') ? '📕' : '📄'}</div>`;
            }
            return `<div class="media-lib-item" data-url="${escapeHtml(murl)}" style="cursor:pointer;padding:6px;border:1px solid var(--line);border-radius:6px;background:var(--navy2);">
              ${thumb}
              <div style="font-size:11px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mist);">${escapeHtml(mname)}</div>
            </div>`;
          }).join('');
          showModal('Media Library', `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-height:420px;overflow:auto;padding:4px;">
              ${grid || '<div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--mist);">No media items found.</div>'}
            </div>
          `, `<button class="btn btn-secondary" id="lib-cancel">Close</button>`);
          $$('#modal-body .lib-thumb').forEach(img => {
            img.onerror = () => {
              img.style.display = 'none';
              const fb = img.parentElement.querySelector('.lib-thumb-fallback');
              if (fb) fb.style.display = 'grid';
            };
          });
          $('#lib-cancel').addEventListener('click', hideModal);
          $$('.media-lib-item').forEach(el => {
            el.addEventListener('click', () => {
              const u = el.getAttribute('data-url');
              hiddenInput.value = u;
              showImage(u);
              hideModal();
              toast('Selected from library', 'success');
              if (onSelectCallback) onSelectCallback(u);
            });
          });
        } catch (err) {
          toast('Failed to load media: ' + err.message, 'error');
        }
      });
    });
  }, 0);
  return html;
}

AdminApp.registerRoute = function(name, cfg) {
  this.routes[name] = typeof cfg === 'object' ? cfg : { render: cfg, title: name, subtitle: '' };
};

AdminApp.navigate = function(route) {
  if (!route) route = 'login';
  window.location.hash = '#' + route;
};

function parseHash() {
  const h = window.location.hash.replace(/^#/, '');
  return h || 'dashboard';
}

function handleRoute() {
  const route = parseHash();
  const token = getToken();
  if (route !== 'login' && !token) {
    AdminApp.navigate('login');
    return;
  }
  const r = AdminApp.routes[route];
  if (!r) { AdminApp.navigate('dashboard'); return; }
  AdminApp.currentRoute = route;
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  if (route === 'login') {
    if (loginView) loginView.style.display = '';
    if (appView) appView.style.display = 'none';
    if (r.render) r.render(null);
    return;
  }
  if (loginView) loginView.style.display = 'none';
  if (appView) appView.style.display = '';
  $$('#sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-route') === route);
  });
  const linkText = document.querySelector('#sidebar-nav a[data-route="' + route + '"]')?.textContent || r.title || '';
  const crumb = document.getElementById('crumb-page');
  const crumbSep = document.getElementById('crumb-sep');
  if (crumb) crumb.textContent = linkText;
  if (crumbSep) crumbSep.style.display = route === 'dashboard' ? 'none' : 'inline';
  document.getElementById('page-title').textContent = r.title || '';
  document.getElementById('page-subtitle').textContent = r.subtitle || '';
  const container = document.getElementById('page-content');
  container.innerHTML = '';
  const user = getUser();
  if (user) {
    const un = document.getElementById('user-name');
    const ua = document.getElementById('user-avatar');
    if (un) un.textContent = user.name || user.email || 'Admin';
    if (ua) ua.textContent = (user.name || user.email || 'A').charAt(0).toUpperCase();
  }
  if (r.render) {
    (async () => {
      try {
        await r.render(container);
      } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="card"><div style="color:var(--danger);padding:16px;">Failed to load, check console.</div></div>';
        toast('Failed to load: ' + err.message, 'error');
      }
    })();
  }
}

window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', () => {
  $$('#sidebar-nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      AdminApp.navigate(a.getAttribute('data-route'));
    });
  });
  const lb = document.getElementById('logout-btn');
  if (lb) lb.addEventListener('click', logout);
  const mc = document.getElementById('modal-close');
  const mbg = document.getElementById('modal-bg');
  if (mc) mc.addEventListener('click', hideModal);
  if (mbg) mbg.addEventListener('click', (e) => { if (e.target === mbg) hideModal(); });
  handleRoute();
});

AdminApp.registerRoute('login', {
  title: 'Login',
  render: function() {
    document.getElementById('login-view').style.display = '';
    document.getElementById('app-view').style.display = 'none';
    const form = document.getElementById('login-form');
    const errDiv = document.getElementById('login-error');
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      errDiv.style.display = 'none';
      try {
        const res = await apiPost('/auth/login', { email, password });
        const token = res && (res.token || res.accessToken || (res.data && (res.data.token || res.data.accessToken)));
        const user = res && (res.user || (res.data && res.data.user)) || { email, name: email.split('@')[0] };
        if (!token) throw new Error('No token received');
        saveToken(token);
        saveUser(user);
        toast('Login successful', 'success');
        AdminApp.navigate('dashboard');
      } catch (err) {
        errDiv.textContent = err.message || 'Login failed';
        errDiv.style.display = 'block';
      }
    });
  }
});

AdminApp.registerRoute('dashboard', {
  title: 'Dashboard',
  subtitle: 'Site overview and enquiries',
  render: async function(container) {
    const [stats, ftp, db, hero, groupIntro] = await Promise.all([
      apiGet('/enquiries/stats').catch(() => ({ total: 0, new: 0 })),
      apiGet('/media/ftp-test').catch(() => ({ ok: false, message: 'N/A' })),
      apiGet('/settings/db-status').catch(() => ({ ok: false, message: 'N/A' })),
      apiGet('/content/hero').catch(() => ({ updated_at: null })),
      apiGet('/content/group-intro').catch(() => ({ updated_at: null }))
    ]);
    const total = stats.total ?? stats.totalEnquiries ?? 0;
    const newCnt = stats.new ?? stats.newEnquiries ?? stats.unread ?? 0;
    const ftpOk = ftp.ok || ftp.status === 'ok' || ftp.connected;
    const dbOk = db.ok || db.status === 'ok' || db.connected;
    function rel(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      const diff = Date.now() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return mins + ' min ago';
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return hrs + ' hrs ago';
      const days = Math.floor(hrs / 24);
      return days + ' days ago';
    }
    const tiles = [
      ['hero', '★', 'Hero Section', 'Edit landing banner', 'var(--orange)'],
      ['group-intro', '🏢', 'Group Intro', 'About & milestones', 'var(--blue)'],
      ['companies', '🏬', 'Companies', 'Group companies index', 'var(--success)'],
      ['building-div', '🏗️', 'Building Div.', 'Building contracting', 'var(--gold)'],
      ['technical-div', '⚙️', 'Technical Div.', 'Engineering & MEP', 'var(--purple)'],
      ['technologies', '💡', 'Technologies', 'Innovation pillars', 'var(--blue)'],
      ['techbolt', '⚡', 'TECHBOLT', 'Product page', 'var(--orange)'],
      ['media-proof', '🏆', 'Media/Proof', 'Awards & testimonials', 'var(--gold)'],
      ['distribution', '🚚', 'Distribution', 'Network & regions', 'var(--success)'],
      ['contact', '📧', 'Contact', 'Contact & footer', 'var(--blue)'],
      ['navigation', '🧭', 'Navigation', 'Menu links', 'var(--slate2)'],
      ['enquiries', '✉️', 'Enquiries', (newCnt ? newCnt + ' new' : 'No new msgs'), 'var(--danger)'],
      ['media-library', '🖼️', 'Media Library', 'FTP media files', 'var(--blue)'],
      ['settings', '⚙️', 'Settings', 'System config', 'var(--mist)']
    ];
    container.innerHTML = `
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-num">${total}</div>
          <div class="stat-label">Total Enquiries</div>
        </div>
        <div class="stat-card" style="--blue: var(--orange);">
          <div class="stat-num" style="color: var(--orange);">${newCnt}</div>
          <div class="stat-label">New Enquiries</div>
        </div>
        <div class="stat-card" style="--blue: var(--blue);">
          <div style="margin-bottom:4px;"><span class="status-pill status-${ftpOk ? 'ok' : 'err'}"><span class="status-dot"></span>FTP ${ftpOk ? 'Online' : 'Offline'}</span></div>
          <div class="stat-label" style="margin-top:6px;">FTP Connection</div>
        </div>
        <div class="stat-card" style="--blue: var(--success);">
          <div style="margin-bottom:4px;"><span class="status-pill status-${dbOk ? 'ok' : 'err'}"><span class="status-dot"></span>DB ${dbOk ? 'Healthy' : 'Issue'}</span></div>
          <div class="stat-label" style="margin-top:6px;">Database Status</div>
        </div>
      </div>
      <div class="card mt-24">
        <div class="flex-between mb-16">
          <h3>Quick Access</h3>
        </div>
        <div class="tile-nav">
          ${tiles.map(t => `
            <a class="tile" data-go="${t[0]}" href="#${t[0]}">
              <div class="tile-icon" style="background:linear-gradient(135deg, ${t[4]}, ${t[4]}cc);">${t[1]}</div>
              <b>${t[2]}</b>
              <small>${t[3]}</small>
            </a>
          `).join('')}
        </div>
      </div>
      <div class="card mt-24">
        <div class="flex-between mb-16">
          <h3>Recent Content Updates</h3>
        </div>
        <div class="list-item">
          <div class="item-no">01</div>
          <div class="item-main"><b>Hero Section</b><small>Last updated ${rel(hero.updated_at || hero.updatedAt)}</small></div>
          <div class="list-actions"><span class="badge badge-read">Published</span></div>
        </div>
        <div class="list-item">
          <div class="item-no">02</div>
          <div class="item-main"><b>Group Introduction</b><small>Last updated ${rel(groupIntro.updated_at || groupIntro.updatedAt)}</small></div>
          <div class="list-actions"><span class="badge badge-read">Published</span></div>
        </div>
      </div>
    `;
    $$('.tile[data-go]').forEach(t => {
      t.addEventListener('click', (e) => { e.preventDefault(); AdminApp.navigate(t.getAttribute('data-go')); });
    });
  }
});

AdminApp.registerRoute('hero', {
  title: 'Hero Section',
  subtitle: 'Edit the landing page hero banner',
  render: async function(container) {
    const hero = await apiGet('/content/hero').catch(() => ({}));
    container.innerHTML = `
      <div class="card">
        <form id="hero-form">
          <div class="grid-2">
            <div>
              <label>Kicker</label>
              <input type="text" id="h-kicker" value="${escapeHtml(hero.kicker || '')}">
              <label>Heading Main</label>
              <input type="text" id="h-heading_main" value="${escapeHtml(hero.heading_main || hero.title || '')}">
              <label>Heading Span (highlight)</label>
              <input type="text" id="h-heading_span" value="${escapeHtml(hero.heading_span || hero.subtitle || '')}">
              <label>Description</label>
              <textarea id="h-description" style="min-height:100px;">${escapeHtml(hero.description || hero.tagline || '')}</textarea>
            </div>
            <div>
              <label>CTA Text</label>
              <input type="text" id="h-cta_text" value="${escapeHtml(hero.cta_text || '')}">
              <label>CTA Link</label>
              <input type="text" id="h-cta_link" value="${escapeHtml(hero.cta_link || '')}">
              <label>Hero Image</label>
              ${imagePickerInput(hero.image_url || hero.backgroundImage || '')}
            </div>
          </div>
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save Hero</button>
          </div>
        </form>
      </div>
    `;
    $('#hero-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        kicker: $('#h-kicker').value,
        heading_main: $('#h-heading_main').value,
        heading_span: $('#h-heading_span').value,
        description: $('#h-description').value,
        cta_text: $('#h-cta_text').value,
        cta_link: $('#h-cta_link').value,
        image_url: $('#hero-form .img-url-input').value
      };
      try {
        await apiPut('/content/hero', payload);
        toast('Hero section saved', 'success');
      } catch (err) {
        toast('Save failed: ' + err.message, 'error');
      }
    });
  }
});

AdminApp.registerRoute('group-intro', {
  title: 'Group Introduction',
  subtitle: 'Group overview + facts',
  render: async function(container) {
    const [intro, facts] = await Promise.all([
      apiGet('/content/group-intro').catch(() => ({})),
      apiGet('/content/facts').catch(() => ([]))
    ]);
    let factsArr = Array.isArray(facts) ? facts : (facts.items || facts.data || []);
    function renderFacts() {
      return factsArr.map((f, i) => `
        <div class="list-item fact-row" data-i="${i}">
          <div class="item-no">${String(i + 1).padStart(2, '0')}</div>
          <div class="item-main" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <input type="text" class="fact-value" value="${escapeHtml(f.fact_value || f.value || f.number || '')}" placeholder="Value (e.g. 15+)">
            <input type="text" class="fact-label" value="${escapeHtml(f.fact_label || f.label || '')}" placeholder="Label (e.g. Years Experience)">
          </div>
          <div class="list-actions">
            <button class="icon-btn fact-up" title="Up" ${i === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
            <button class="icon-btn fact-dn" title="Down" ${i === factsArr.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
            <button class="icon-btn fact-del" title="Delete" style="color:var(--danger);">✕</button>
          </div>
        </div>
      `).join('');
    }
    container.innerHTML = `
      <div class="card">
        <form id="gi-form">
          <label>Kicker</label>
          <input type="text" id="gi-kicker" value="${escapeHtml(intro.kicker || '')}">
          <label>Heading Main</label>
          <input type="text" id="gi-heading_main" value="${escapeHtml(intro.heading_main || intro.heading || '')}">
          <label>Heading Span</label>
          <input type="text" id="gi-heading_span" value="${escapeHtml(intro.heading_span || '')}">
          <label>Description</label>
          <textarea id="gi-description" style="min-height:130px;">${escapeHtml(intro.description || '')}</textarea>
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save Overview</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Facts & Figures</h3>
          <div class="flex gap-8">
            <button class="btn btn-secondary" id="facts-save">Save Order</button>
            <button class="btn btn-gold" id="fact-add">+ Add Fact</button>
          </div>
        </div>
        <div id="facts-list">${renderFacts()}</div>
      </div>
    `;
    $('#gi-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        kicker: $('#gi-kicker').value,
        heading_main: $('#gi-heading_main').value,
        heading_span: $('#gi-heading_span').value,
        description: $('#gi-description').value
      };
      try {
        await apiPut('/content/group-intro', payload);
        toast('Group overview saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    });
    function bindFacts() {
      $$('.fact-row').forEach(row => {
        const i = +row.getAttribute('data-i');
        row.querySelector('.fact-up').onclick = () => {
          if (i === 0) return;
          [factsArr[i - 1], factsArr[i]] = [factsArr[i], factsArr[i - 1]];
          $('#facts-list').innerHTML = renderFacts();
          bindFacts();
        };
        row.querySelector('.fact-dn').onclick = () => {
          if (i === factsArr.length - 1) return;
          [factsArr[i + 1], factsArr[i]] = [factsArr[i], factsArr[i + 1]];
          $('#facts-list').innerHTML = renderFacts();
          bindFacts();
        };
        row.querySelector('.fact-del').onclick = async () => {
          const ok = await confirmDialog('Delete this fact?');
          if (!ok) return;
          const f = factsArr[i];
          if (f.id) {
            try { await apiDel('/content/facts/' + f.id); } catch (_) {}
          }
          factsArr.splice(i, 1);
          $('#facts-list').innerHTML = renderFacts();
          bindFacts();
          toast('Deleted', 'success');
        };
        row.querySelector('.fact-value').onchange = async () => {
          factsArr[i].fact_value = row.querySelector('.fact-value').value;
          if (factsArr[i].id) {
            try { await apiPut('/content/facts/' + factsArr[i].id, factsArr[i]); } catch (_) {}
          }
        };
        row.querySelector('.fact-label').onchange = async () => {
          factsArr[i].fact_label = row.querySelector('.fact-label').value;
          if (factsArr[i].id) {
            try { await apiPut('/content/facts/' + factsArr[i].id, factsArr[i]); } catch (_) {}
          }
        };
      });
    }
    bindFacts();
    $('#fact-add').onclick = async () => {
      try {
        const created = await apiPost('/content/facts', { fact_value: '', fact_label: '' });
        factsArr.push(created || { fact_value: '', fact_label: '' });
      } catch (_) {
        factsArr.push({ fact_value: '', fact_label: '' });
      }
      $('#facts-list').innerHTML = renderFacts();
      bindFacts();
    };
    $('#facts-save').onclick = async () => {
      const ordered = factsArr.map((f, i) => ({
        id: f.id, fact_value: f.fact_value || f.value || f.number || '', fact_label: f.fact_label || f.label || '', sort_order: i + 1
      }));
      try {
        await apiPost('/content/facts/reorder', { items: ordered });
        toast('Facts order saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    };
  }
});

AdminApp.registerRoute('companies', {
  title: 'Companies Index',
  subtitle: '4 company cards',
  render: async function(container) {
    const data = await apiGet('/content/companies').catch(() => ([]));
    const companies = Array.isArray(data) ? data : (data.items || data.data || []);
    function renderTable() {
      return `
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Logo</th><th>Name</th><th>Description</th><th>Anchor</th><th>Actions</th></tr></thead>
            <tbody>
              ${companies.map((c, i) => `
                <tr data-id="${c.id || i}">
                  <td><input type="number" class="co-order" value="${c.sort_order || c.order || i + 1}" style="width:60px;padding:4px;text-align:center;"></td>
                  <td>
                    <div style="min-width:180px;">
                      ${imagePickerInput(c.logo || c.logo_url || '')}
                    </div>
                  </td>
                  <td><b><input type="text" class="co-name" value="${escapeHtml(c.name || '')}" style="background:transparent;border:none;color:var(--paper);padding:4px;width:100%;"></b></td>
                  <td><input type="text" class="co-desc" value="${escapeHtml(c.description || '')}" style="background:transparent;border:none;color:var(--mist);padding:4px;width:100%;"></td>
                  <td><input type="text" class="co-href" value="${escapeHtml(c.anchor_href || c.href || '')}" style="background:transparent;border:none;color:var(--mist);padding:4px;width:140px;"></td>
                  <td>
                    <div class="list-actions">
                      <button class="icon-btn co-save" title="Save">💾</button>
                      <button class="icon-btn co-del" title="Delete" style="color:var(--danger);">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    container.innerHTML = `
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Companies (${companies.length})</h3>
          <button class="btn btn-gold" id="co-add">+ Add Company</button>
        </div>
        <div id="co-table">${renderTable()}</div>
      </div>
    `;
    function bindRows() {
      $$('#co-table tr[data-id]').forEach(row => {
        const id = row.getAttribute('data-id');
        const isNew = isNaN(+id);
        row.querySelector('.co-save').onclick = async () => {
          const payload = {
            sort_order: +row.querySelector('.co-order').value || 1,
            logo_url: row.querySelector('.img-url-input').value,
            name: row.querySelector('.co-name').value,
            description: row.querySelector('.co-desc').value,
            anchor_href: row.querySelector('.co-href').value
          };
          try {
            if (!isNaN(+id) && companies.find(c => c.id == id)) {
              await apiPut('/content/companies/' + id, payload);
            } else {
              const created = await apiPost('/content/companies', payload);
              if (created && created.id) { row.setAttribute('data-id', created.id); }
            }
            toast('Company saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        };
        row.querySelector('.co-del').onclick = async () => {
          const ok = await confirmDialog('Delete this company?');
          if (!ok) return;
          if (!isNaN(+id)) {
            try { await apiDel('/content/companies/' + id); } catch (_) {}
          }
          const idx = companies.findIndex(c => (c.id == id));
          if (idx >= 0) companies.splice(idx, 1);
          $('#co-table').innerHTML = renderTable();
          bindRows();
          toast('Deleted', 'success');
        };
      });
    }
    bindRows();
    $('#co-add').onclick = async () => {
      try {
        const created = await apiPost('/content/companies', { name: 'New Company', description: '', logo_url: '', anchor_href: '' });
        companies.push(created || { name: 'New Company', description: '' });
      } catch (_) {
        companies.push({ name: 'New Company', description: '' });
      }
      $('#co-table').innerHTML = renderTable();
      bindRows();
    };
  }
});

function renderDivision(slug, title, subtitle) {
  return {
    title: title,
    subtitle: subtitle,
    render: async function(container) {
      const division = await apiGet('/content/divisions/' + slug).catch(() => ({}));
      const divId = division.id || slug;
      const servicesRaw = await apiGet('/content/division-services/' + divId).catch(() => ([]));
      let services = Array.isArray(servicesRaw) ? servicesRaw : (servicesRaw.items || servicesRaw.data || []);
      const col1Title = slug === 'building' ? 'Earthworks' : 'Engineering';
      const col2Title = slug === 'building' ? 'Project Support' : 'Technical Support';
      function splitServices(list) {
        const col1 = list.filter(s => s.column === 1 || (s.sort_order || s.order || 0) % 2 === 1);
        const col2 = list.filter(s => s.column === 2 || (s.sort_order || s.order || 0) % 2 === 0);
        return [col1, col2];
      }
      let [col1, col2] = splitServices(services);
      function renderServices() {
        function colHtml(list, colNum) {
          return `
            <div class="card" style="margin:0;background:var(--navy2);">
              <div class="flex-between mb-12">
                <input type="text" class="col-title" data-col="${colNum}" value="${escapeHtml(colNum === 1 ? col1Title : col2Title)}" style="background:transparent;border:none;color:var(--paper);font-weight:700;padding:4px;">
                <button class="btn btn-gold add-svc" data-col="${colNum}" style="padding:6px 10px;font-size:12px;">+ Add</button>
              </div>
              ${list.map((s, i) => `
                <div class="list-item svc-row" data-id="${s.id || ''}" data-col="${colNum}" data-i="${i}">
                  <div class="item-no">${String(i + 1).padStart(2, '0')}</div>
                  <div class="item-main">
                    <input type="text" class="svc-title" value="${escapeHtml(s.title || s.name || '')}" placeholder="Service title" style="width:100%;background:transparent;border:none;color:var(--paper);padding:2px;margin-bottom:2px;">
                    <input type="text" class="svc-desc" value="${escapeHtml(s.description || s.desc || '')}" placeholder="Short description" style="width:100%;background:transparent;border:none;color:var(--mist);padding:2px;font-size:12px;">
                  </div>
                  <div class="list-actions">
                    <button class="icon-btn svc-save" title="Save">💾</button>
                    <button class="icon-btn svc-del" title="Delete" style="color:var(--danger);">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
        return `<div class="grid-2">${colHtml(col1, 1)}${colHtml(col2, 2)}</div>`;
      }
      container.innerHTML = `
        <div class="card">
          <form id="div-form">
            <div class="grid-2">
              <div>
                <label>Chapter Label</label>
                <input type="text" id="d-chapter" value="${escapeHtml(division.chapter_label || division.title || '')}">
                <label>Division Logo</label>
                ${imagePickerInput(division.logo || division.logo_url || '')}
                <label>Heading Main</label>
                <input type="text" id="d-heading_main" value="${escapeHtml(division.heading_main || division.heading || '')}">
                <label>Heading Span</label>
                <input type="text" id="d-heading_span" value="${escapeHtml(division.heading_span || '')}">
              </div>
              <div>
                <label>Summary</label>
                <textarea id="d-summary" style="min-height:100px;">${escapeHtml(division.summary || division.overview || '')}</textarea>
                <label>Media Image</label>
                ${imagePickerInput(division.media_image || division.image_url || '')}
                <label>Media Label</label>
                <input type="text" id="d-media_label" value="${escapeHtml(division.media_label || '')}">
                <label>CTA Text</label>
                <input type="text" id="d-cta_text" value="${escapeHtml(division.cta_text || '')}">
                <label>CTA Link</label>
                <input type="text" id="d-cta_link" value="${escapeHtml(division.cta_link || '')}">
              </div>
            </div>
            <div class="save-bar mt-24">
              <button type="submit" class="btn">Save Division</button>
            </div>
          </form>
        </div>
        <div class="card">
          <div class="flex-between mb-16">
            <h3>Service Columns</h3>
          </div>
          <div id="svc-wrap">${renderServices()}</div>
        </div>
      `;
      $('#div-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          chapter_label: $('#d-chapter').value,
          logo_url: $('#div-form .img-url-input').value,
          heading_main: $('#d-heading_main').value,
          heading_span: $('#d-heading_span').value,
          summary: $('#d-summary').value,
          media_image_url: $$('#div-form .img-url-input')[1]?.value || '',
          media_label: $('#d-media_label').value,
          cta_text: $('#d-cta_text').value,
          cta_link: $('#d-cta_link').value
        };
        try {
          await apiPut('/content/divisions/' + slug, payload);
          toast('Division saved', 'success');
        } catch (err) { toast('Save failed: ' + err.message, 'error'); }
      });
      function bindServices() {
        $$('.svc-row').forEach(row => {
          const id = row.getAttribute('data-id');
          const col = +row.getAttribute('data-col');
          const i = +row.getAttribute('data-i');
          const list = col === 1 ? col1 : col2;
          row.querySelector('.svc-save').onclick = async () => {
            const svcTitle = row.querySelector('.svc-title').value;
            const svcDesc = row.querySelector('.svc-desc').value;
            const payload = {
              division_id: divId,
              column: col,
              column_title_text: $$('.col-title[data-col='+col+']').value,
              title: svcTitle,
              description: svcDesc,
              service_text: svcTitle + ' — ' + svcDesc,
              sort_order: i + 1
            };
            try {
              if (id) {
                await apiPut('/content/division-services/' + id, payload);
              } else {
                const created = await apiPost('/content/division-services', payload);
                if (created && created.id) row.setAttribute('data-id', created.id);
              }
              toast('Service saved', 'success');
            } catch (err) { toast('Save failed: ' + err.message, 'error'); }
          };
          row.querySelector('.svc-del').onclick = async () => {
            const ok = await confirmDialog('Delete this service?');
            if (!ok) return;
            if (id) { try { await apiDel('/content/division-services/' + id); } catch (_) {} }
            list.splice(i, 1);
            $('#svc-wrap').innerHTML = renderServices();
            bindServices();
            toast('Deleted', 'success');
          };
        });
        $$('.add-svc').forEach(btn => {
          btn.onclick = async () => {
            const col = +btn.getAttribute('data-col');
            const list = col === 1 ? col1 : col2;
            try {
              const created = await apiPost('/content/division-services', {
                division_id: divId, column: col, column_title_text: $$('.col-title[data-col='+col+']').value, title: 'New Service', description: '', service_text: 'New Service — '
              });
              list.push(created || { title: 'New Service', description: '' });
            } catch (_) {
              list.push({ title: 'New Service', description: '' });
            }
            $('#svc-wrap').innerHTML = renderServices();
            bindServices();
          };
        });
      }
      bindServices();
    }
  };
}

AdminApp.registerRoute('building-div', renderDivision('building', 'Building Contracting Division', 'Building & construction services'));
AdminApp.registerRoute('technical-div', renderDivision('technical', 'Technical Services Division', 'MEP, engineering & maintenance'));

AdminApp.registerRoute('technologies', {
  title: 'Technologies Division',
  subtitle: '',
  render: async function(container) {
    const [tech, steps] = await Promise.all([
      apiGet('/content/technologies').catch(() => ({})),
      apiGet('/content/process-steps').catch(() => ([]))
    ]);
    let stepArr = Array.isArray(steps) ? steps : (steps.items || steps.data || []);
    if (stepArr.length === 0) stepArr = [{ step_num: 1, step_text: '' }, { step_num: 2, step_text: '' }, { step_num: 3, step_text: '' }, { step_num: 4, step_text: '' }];
    function renderSteps() {
      return stepArr.map((s, i) => `
        <div class="list-item step-row" data-i="${i}">
          <div class="item-no">
            <input type="number" class="step-num" value="${s.step_num || s.order || i + 1}" style="width:60px;padding:4px;text-align:center;">
          </div>
          <div class="item-main">
            <input type="text" class="step-text" value="${escapeHtml(s.step_text || s.text || s.description || '')}" placeholder="Process step description" style="width:100%;background:transparent;border:none;color:var(--paper);padding:4px;">
          </div>
          <div class="list-actions">
            <button class="icon-btn step-save" title="Save">💾</button>
            <button class="icon-btn step-up" title="Up" ${i === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
            <button class="icon-btn step-dn" title="Down" ${i === stepArr.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
            <button class="icon-btn step-del" title="Delete" style="color:var(--danger);">✕</button>
          </div>
        </div>
      `).join('');
    }
    container.innerHTML = `
      <div class="card">
        <form id="tech-form">
          <div class="grid-2">
            <div>
              <label>Chapter Label</label>
              <input type="text" id="t-chapter" value="${escapeHtml(tech.chapter_label || '')}">
              <label>Logo</label>
              ${imagePickerInput(tech.logo || tech.logo_url || '')}
              <label>Heading Main</label>
              <input type="text" id="t-heading_main" value="${escapeHtml(tech.heading_main || tech.heading || '')}">
              <label>Heading Span</label>
              <input type="text" id="t-heading_span" value="${escapeHtml(tech.heading_span || '')}">
            </div>
            <div>
              <label>Description</label>
              <textarea id="t-description" style="min-height:120px;">${escapeHtml(tech.description || tech.intro || '')}</textarea>
              <label>Product Image</label>
              ${imagePickerInput(tech.product_image || tech.image_url || '')}
              <label>Product Label</label>
              <input type="text" id="t-product_label" value="${escapeHtml(tech.product_label || '')}">
            </div>
          </div>
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save Technologies</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Process Steps (4)</h3>
          <button class="btn btn-gold" id="step-add">+ Add Step</button>
        </div>
        <div id="step-list">${renderSteps()}</div>
      </div>
    `;
    $('#tech-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        chapter_label: $('#t-chapter').value,
        logo_url: $$('#tech-form .img-url-input')[0]?.value || '',
        heading_main: $('#t-heading_main').value,
        heading_span: $('#t-heading_span').value,
        description: $('#t-description').value,
        product_image_url: $$('#tech-form .img-url-input')[1]?.value || '',
        product_label: $('#t-product_label').value
      };
      try {
        await apiPut('/content/technologies', payload);
        toast('Technologies section saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    });
    function bindSteps() {
      $$('.step-row').forEach(row => {
        const i = +row.getAttribute('data-i');
        row.querySelector('.step-num').onchange = () => { stepArr[i].step_num = +row.querySelector('.step-num').value || 1; };
        row.querySelector('.step-text').onchange = () => { stepArr[i].step_text = row.querySelector('.step-text').value; };
        row.querySelector('.step-save').onclick = async () => {
          const payload = { step_num: +row.querySelector('.step-num').value || 1, step_text: row.querySelector('.step-text').value, sort_order: i + 1 };
          try {
            if (stepArr[i].id) await apiPut('/content/process-steps/' + stepArr[i].id, payload);
            else {
              const created = await apiPost('/content/process-steps', payload);
              if (created && created.id) stepArr[i].id = created.id;
            }
            toast('Step saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        };
        row.querySelector('.step-up').onclick = () => {
          if (i === 0) return;
          [stepArr[i - 1], stepArr[i]] = [stepArr[i], stepArr[i - 1]];
          $('#step-list').innerHTML = renderSteps();
          bindSteps();
        };
        row.querySelector('.step-dn').onclick = () => {
          if (i === stepArr.length - 1) return;
          [stepArr[i + 1], stepArr[i]] = [stepArr[i], stepArr[i + 1]];
          $('#step-list').innerHTML = renderSteps();
          bindSteps();
        };
        row.querySelector('.step-del').onclick = async () => {
          const ok = await confirmDialog('Delete this step?');
          if (!ok) return;
          if (stepArr[i].id) { try { await apiDel('/content/process-steps/' + stepArr[i].id); } catch (_) {} }
          stepArr.splice(i, 1);
          $('#step-list').innerHTML = renderSteps();
          bindSteps();
          toast('Deleted', 'success');
        };
      });
    }
    bindSteps();
    $('#step-add').onclick = async () => {
      try {
        const created = await apiPost('/content/process-steps', { step_num: stepArr.length + 1, step_text: '' });
        stepArr.push(created || { step_num: stepArr.length + 1, step_text: '' });
      } catch (_) {
        stepArr.push({ step_num: stepArr.length + 1, step_text: '' });
      }
      $('#step-list').innerHTML = renderSteps();
      bindSteps();
    };
  }
});

AdminApp.registerRoute('techbolt', {
  title: 'TECHBOLT Product',
  subtitle: '',
  render: async function(container) {
    const [tb, specsRaw, benefitsRaw] = await Promise.all([
      apiGet('/content/techbolt').catch(() => ({})),
      apiGet('/content/techbolt-specs').catch(() => ([])),
      apiGet('/content/benefits').catch(() => ([]))
    ]);
    let specs = Array.isArray(specsRaw) ? specsRaw : (specsRaw.items || specsRaw.data || []);
    if (specs.length === 0) specs = [{ spec_value: '', spec_unit: '', spec_label: '' }, { spec_value: '', spec_unit: '', spec_label: '' }, { spec_value: '', spec_unit: '', spec_label: '' }];
    let benefits = Array.isArray(benefitsRaw) ? benefitsRaw : (benefitsRaw.items || benefitsRaw.data || []);
    if (benefits.length === 0) benefits = [
      { benefit_num: '01', benefit_heading: '', benefit_description: '' },
      { benefit_num: '02', benefit_heading: '', benefit_description: '' },
      { benefit_num: '03', benefit_heading: '', benefit_description: '' },
      { benefit_num: '04', benefit_heading: '', benefit_description: '' }
    ];
    function renderSpecs() {
      return specs.map((s, i) => `
        <tr data-i="${i}">
          <td><input type="text" class="sp-val" value="${escapeHtml(s.spec_value || s.value || '')}" placeholder="Value" style="width:100%;padding:6px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);"></td>
          <td><input type="text" class="sp-unit" value="${escapeHtml(s.spec_unit || s.unit || '')}" placeholder="Unit" style="width:100%;padding:6px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);"></td>
          <td><input type="text" class="sp-label" value="${escapeHtml(s.spec_label || s.label || '')}" placeholder="Label" style="width:100%;padding:6px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);"></td>
          <td>
            <div class="list-actions">
              <button class="icon-btn sp-up" ${i === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
              <button class="icon-btn sp-dn" ${i === specs.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
              <button class="icon-btn sp-save">💾</button>
              <button class="icon-btn sp-del" style="color:var(--danger);">✕</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
    function renderBenefits() {
      return benefits.map((b, i) => `
        <div class="list-item ben-row" data-i="${i}">
          <div class="item-no"><input type="text" class="ben-num" value="${escapeHtml(b.benefit_num || b.num || String(i + 1).padStart(2, '0'))}" style="width:60px;padding:4px;text-align:center;"></div>
          <div class="item-main">
            <input type="text" class="ben-head" value="${escapeHtml(b.benefit_heading || b.heading || '')}" placeholder="Benefit heading" style="width:100%;background:transparent;border:none;color:var(--paper);padding:2px;margin-bottom:2px;">
            <input type="text" class="ben-desc" value="${escapeHtml(b.benefit_description || b.description || '')}" placeholder="Short description" style="width:100%;background:transparent;border:none;color:var(--mist);padding:2px;font-size:12px;">
          </div>
          <div class="list-actions">
            <button class="icon-btn ben-up" ${i === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
            <button class="icon-btn ben-dn" ${i === benefits.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
            <button class="icon-btn ben-save">💾</button>
            <button class="icon-btn ben-del" style="color:var(--danger);">✕</button>
          </div>
        </div>
      `).join('');
    }
    container.innerHTML = `
      <div class="card">
        <form id="tb-form">
          <div class="grid-2">
            <div>
              <label>Watermark</label>
              <input type="text" id="tb-watermark" value="${escapeHtml(tb.watermark || '')}">
              <label>Chapter Label</label>
              <input type="text" id="tb-chapter" value="${escapeHtml(tb.chapter_label || '')}">
              <label>Logo</label>
              ${imagePickerInput(tb.logo || tb.logo_url || '')}
              <label>Heading Main</label>
              <input type="text" id="tb-heading_main" value="${escapeHtml(tb.heading_main || tb.name || '')}">
              <label>Heading Span</label>
              <input type="text" id="tb-heading_span" value="${escapeHtml(tb.heading_span || tb.tagline || '')}">
            </div>
            <div>
              <label>Description</label>
              <textarea id="tb-description" style="min-height:130px;">${escapeHtml(tb.description || '')}</textarea>
              <label>Product Image</label>
              ${imagePickerInput(tb.product_image || tb.image_url || '')}
              <label>CTA Text</label>
              <input type="text" id="tb-cta_text" value="${escapeHtml(tb.cta_text || '')}">
              <label>CTA Link</label>
              <input type="text" id="tb-cta_link" value="${escapeHtml(tb.cta_link || '')}">
            </div>
          </div>
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save Product</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Technical Specifications (3)</h3>
          <button class="btn btn-gold" id="sp-add">+ Add Spec</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Value</th><th>Unit</th><th>Label</th><th>Actions</th></tr></thead>
            <tbody id="sp-body">${renderSpecs()}</tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Benefits (4)</h3>
          <button class="btn btn-gold" id="ben-add">+ Add Benefit</button>
        </div>
        <div id="ben-list">${renderBenefits()}</div>
      </div>
    `;
    $('#tb-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        watermark: $('#tb-watermark').value,
        chapter_label: $('#tb-chapter').value,
        logo_url: $$('#tb-form .img-url-input')[0]?.value || '',
        heading_main: $('#tb-heading_main').value,
        heading_span: $('#tb-heading_span').value,
        description: $('#tb-description').value,
        product_image_url: $$('#tb-form .img-url-input')[1]?.value || '',
        cta_text: $('#tb-cta_text').value,
        cta_link: $('#tb-cta_link').value
      };
      try {
        await apiPut('/content/techbolt', payload);
        toast('TECHBOLT saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    });
    function bindSpecs() {
      $$('#sp-body tr').forEach(tr => {
        const i = +tr.getAttribute('data-i');
        tr.querySelector('.sp-val').onchange = () => { specs[i].spec_value = tr.querySelector('.sp-val').value; };
        tr.querySelector('.sp-unit').onchange = () => { specs[i].spec_unit = tr.querySelector('.sp-unit').value; };
        tr.querySelector('.sp-label').onchange = () => { specs[i].spec_label = tr.querySelector('.sp-label').value; };
        tr.querySelector('.sp-save').onclick = async () => {
          const payload = {
            spec_value: tr.querySelector('.sp-val').value,
            spec_unit: tr.querySelector('.sp-unit').value,
            spec_label: tr.querySelector('.sp-label').value,
            sort_order: i + 1
          };
          try {
            if (specs[i].id) await apiPut('/content/techbolt-specs/' + specs[i].id, payload);
            else {
              const created = await apiPost('/content/techbolt-specs', payload);
              if (created && created.id) specs[i].id = created.id;
            }
            toast('Spec saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        };
        tr.querySelector('.sp-up').onclick = () => {
          if (i === 0) return;
          [specs[i - 1], specs[i]] = [specs[i], specs[i - 1]];
          $('#sp-body').innerHTML = renderSpecs();
          bindSpecs();
        };
        tr.querySelector('.sp-dn').onclick = () => {
          if (i === specs.length - 1) return;
          [specs[i + 1], specs[i]] = [specs[i], specs[i + 1]];
          $('#sp-body').innerHTML = renderSpecs();
          bindSpecs();
        };
        tr.querySelector('.sp-del').onclick = async () => {
          const ok = await confirmDialog('Delete this spec?');
          if (!ok) return;
          if (specs[i].id) { try { await apiDel('/content/techbolt-specs/' + specs[i].id); } catch (_) {} }
          specs.splice(i, 1);
          $('#sp-body').innerHTML = renderSpecs();
          bindSpecs();
          toast('Deleted', 'success');
        };
      });
    }
    bindSpecs();
    $('#sp-add').onclick = async () => {
      try {
        const created = await apiPost('/content/techbolt-specs', { spec_value: '', spec_unit: '', spec_label: '' });
        specs.push(created || { spec_value: '', spec_unit: '', spec_label: '' });
      } catch (_) {
        specs.push({ spec_value: '', spec_unit: '', spec_label: '' });
      }
      $('#sp-body').innerHTML = renderSpecs();
      bindSpecs();
    };
    function bindBenefits() {
      $$('.ben-row').forEach(row => {
        const i = +row.getAttribute('data-i');
        row.querySelector('.ben-num').onchange = () => { benefits[i].benefit_num = row.querySelector('.ben-num').value; };
        row.querySelector('.ben-head').onchange = () => { benefits[i].benefit_heading = row.querySelector('.ben-head').value; };
        row.querySelector('.ben-desc').onchange = () => { benefits[i].benefit_description = row.querySelector('.ben-desc').value; };
        row.querySelector('.ben-save').onclick = async () => {
          const payload = {
            benefit_num: row.querySelector('.ben-num').value,
            benefit_heading: row.querySelector('.ben-head').value,
            benefit_description: row.querySelector('.ben-desc').value,
            sort_order: i + 1
          };
          try {
            if (benefits[i].id) await apiPut('/content/benefits/' + benefits[i].id, payload);
            else {
              const created = await apiPost('/content/benefits', payload);
              if (created && created.id) benefits[i].id = created.id;
            }
            toast('Benefit saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        };
        row.querySelector('.ben-up').onclick = () => {
          if (i === 0) return;
          [benefits[i - 1], benefits[i]] = [benefits[i], benefits[i - 1]];
          $('#ben-list').innerHTML = renderBenefits();
          bindBenefits();
        };
        row.querySelector('.ben-dn').onclick = () => {
          if (i === benefits.length - 1) return;
          [benefits[i + 1], benefits[i]] = [benefits[i], benefits[i + 1]];
          $('#ben-list').innerHTML = renderBenefits();
          bindBenefits();
        };
        row.querySelector('.ben-del').onclick = async () => {
          const ok = await confirmDialog('Delete this benefit?');
          if (!ok) return;
          if (benefits[i].id) { try { await apiDel('/content/benefits/' + benefits[i].id); } catch (_) {} }
          benefits.splice(i, 1);
          $('#ben-list').innerHTML = renderBenefits();
          bindBenefits();
          toast('Deleted', 'success');
        };
      });
    }
    bindBenefits();
    $('#ben-add').onclick = async () => {
      try {
        const created = await apiPost('/content/benefits', { benefit_num: String(benefits.length + 1).padStart(2, '0'), benefit_heading: '', benefit_description: '' });
        benefits.push(created || { benefit_num: String(benefits.length + 1).padStart(2, '0'), benefit_heading: '', benefit_description: '' });
      } catch (_) {
        benefits.push({ benefit_num: String(benefits.length + 1).padStart(2, '0'), benefit_heading: '', benefit_description: '' });
      }
      $('#ben-list').innerHTML = renderBenefits();
      bindBenefits();
    };
  }
});

AdminApp.registerRoute('media-proof', {
  title: 'Media / Proof Section',
  subtitle: '',
  render: async function(container) {
    const [proof, filmsRaw, testimonial] = await Promise.all([
      apiGet('/content/proof').catch(() => ({})),
      apiGet('/content/films').catch(() => ([])),
      apiGet('/content/testimonial').catch(() => ({}))
    ]);
    let films = Array.isArray(filmsRaw) ? filmsRaw : (filmsRaw.items || filmsRaw.data || []);
    function renderFilms() {
      return films.map((f, i) => `
        <tr data-i="${i}">
          <td><div style="min-width:140px;">${imagePickerInput(f.thumbnail || f.thumbnail_url || f.image_url || '')}</div></td>
          <td><input type="text" class="fm-cat" value="${escapeHtml(f.category || '')}" placeholder="Category" style="width:100%;padding:6px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);"></td>
          <td><input type="text" class="fm-title" value="${escapeHtml(f.title || '')}" placeholder="Title" style="width:100%;padding:6px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);"></td>
          <td><input type="text" class="fm-url" value="${escapeHtml(f.video_url || f.url || '')}" placeholder="https://..." style="width:100%;padding:6px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);"></td>
          <td>
            <select class="fm-size" style="padding:6px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);">
              <option value="large" ${(f.size || 'normal') === 'large' ? 'selected' : ''}>Large</option>
              <option value="normal" ${(f.size || 'normal') === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="product" ${f.size === 'product' ? 'selected' : ''}>Product</option>
            </select>
          </td>
          <td>
            <div class="list-actions">
              <button class="icon-btn fm-up" ${i === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
              <button class="icon-btn fm-dn" ${i === films.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
              <button class="icon-btn fm-save">💾</button>
              <button class="icon-btn fm-del" style="color:var(--danger);">✕</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
    container.innerHTML = `
      <div class="card">
        <form id="proof-form">
          <label>Kicker</label>
          <input type="text" id="pf-kicker" value="${escapeHtml(proof.kicker || '')}">
          <label>Heading</label>
          <input type="text" id="pf-heading" value="${escapeHtml(proof.heading || proof.title || '')}">
          <label>Description</label>
          <textarea id="pf-description" style="min-height:100px;">${escapeHtml(proof.description || '')}</textarea>
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save Proof Section</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Films (3)</h3>
          <button class="btn btn-gold" id="fm-add">+ Add Film</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Thumbnail</th><th>Category</th><th>Title</th><th>Video URL</th><th>Size</th><th>Actions</th></tr></thead>
            <tbody id="fm-body">${renderFilms()}</tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <form id="test-form">
          <h3>Testimonial</h3>
          <label>Label</label>
          <input type="text" id="t-label" value="${escapeHtml(testimonial.label || '')}">
          <label>Quote</label>
          <textarea id="t-quote" style="min-height:100px;">${escapeHtml(testimonial.quote || testimonial.text || '')}</textarea>
          <label>Note</label>
          <input type="text" id="t-note" value="${escapeHtml(testimonial.note || testimonial.author || '')}">
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save Testimonial</button>
          </div>
        </form>
      </div>
    `;
    $('#proof-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiPut('/content/proof', {
          kicker: $('#pf-kicker').value,
          heading: $('#pf-heading').value,
          description: $('#pf-description').value
        });
        toast('Proof section saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    });
    $('#test-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiPut('/content/testimonial', {
          label: $('#t-label').value,
          quote: $('#t-quote').value,
          note: $('#t-note').value
        });
        toast('Testimonial saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    });
    function bindFilms() {
      $$('#fm-body tr').forEach(tr => {
        const i = +tr.getAttribute('data-i');
        tr.querySelector('.fm-save').onclick = async () => {
          const payload = {
            thumbnail_url: tr.querySelector('.img-url-input').value,
            category: tr.querySelector('.fm-cat').value,
            title: tr.querySelector('.fm-title').value,
            video_url: tr.querySelector('.fm-url').value,
            size: tr.querySelector('.fm-size').value,
            sort_order: i + 1
          };
          try {
            if (films[i].id) await apiPut('/content/films/' + films[i].id, payload);
            else {
              const created = await apiPost('/content/films', payload);
              if (created && created.id) films[i].id = created.id;
            }
            toast('Film saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        };
        tr.querySelector('.fm-up').onclick = () => {
          if (i === 0) return;
          [films[i - 1], films[i]] = [films[i], films[i - 1]];
          $('#fm-body').innerHTML = renderFilms();
          bindFilms();
        };
        tr.querySelector('.fm-dn').onclick = () => {
          if (i === films.length - 1) return;
          [films[i + 1], films[i]] = [films[i], films[i + 1]];
          $('#fm-body').innerHTML = renderFilms();
          bindFilms();
        };
        tr.querySelector('.fm-del').onclick = async () => {
          const ok = await confirmDialog('Delete this film?');
          if (!ok) return;
          if (films[i].id) { try { await apiDel('/content/films/' + films[i].id); } catch (_) {} }
          films.splice(i, 1);
          $('#fm-body').innerHTML = renderFilms();
          bindFilms();
          toast('Deleted', 'success');
        };
      });
    }
    bindFilms();
    $('#fm-add').onclick = async () => {
      try {
        const created = await apiPost('/content/films', { category: '', title: '', video_url: '', size: 'normal' });
        films.push(created || { category: '', title: '', video_url: '', size: 'normal' });
      } catch (_) {
        films.push({ category: '', title: '', video_url: '', size: 'normal' });
      }
      $('#fm-body').innerHTML = renderFilms();
      bindFilms();
    };
  }
});

AdminApp.registerRoute('distribution', {
  title: 'Distribution',
  subtitle: '',
  render: async function(container) {
    const [dist, reqsRaw] = await Promise.all([
      apiGet('/content/distribution').catch(() => ({})),
      apiGet('/content/distribution-requirements').catch(() => ([]))
    ]);
    let reqs = Array.isArray(reqsRaw) ? reqsRaw : (reqsRaw.items || reqsRaw.data || []);
    function renderReqs() {
      return reqs.map((r, i) => `
        <div class="list-item req-row" data-i="${i}">
          <div class="item-no">${String(i + 1).padStart(2, '0')}</div>
          <div class="item-main">
            <input type="text" class="req-text" value="${escapeHtml(r.req_text || r.text || r.description || '')}" placeholder="Requirement bullet point" style="width:100%;background:transparent;border:none;color:var(--paper);padding:4px;">
          </div>
          <div class="list-actions">
            <button class="icon-btn req-up" ${i === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
            <button class="icon-btn req-dn" ${i === reqs.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
            <button class="icon-btn req-save">💾</button>
            <button class="icon-btn req-del" style="color:var(--danger);">✕</button>
          </div>
        </div>
      `).join('');
    }
    container.innerHTML = `
      <div class="card">
        <form id="dist-form">
          <label>Chapter Label</label>
          <input type="text" id="d-chapter" value="${escapeHtml(dist.chapter_label || '')}">
          <label>Heading Main</label>
          <input type="text" id="d-heading_main" value="${escapeHtml(dist.heading_main || dist.heading || '')}">
          <label>Heading Span</label>
          <input type="text" id="d-heading_span" value="${escapeHtml(dist.heading_span || '')}">
          <label>Description</label>
          <textarea id="d-description" style="min-height:100px;">${escapeHtml(dist.description || dist.intro || '')}</textarea>
          <div class="form-row">
            <div>
              <label>Form Label</label>
              <input type="text" id="d-form_label" value="${escapeHtml(dist.form_label || '')}">
            </div>
            <div>
              <label>Form Heading</label>
              <input type="text" id="d-form_heading" value="${escapeHtml(dist.form_heading || '')}">
            </div>
          </div>
          <label>Form Button Text</label>
          <input type="text" id="d-form_button_text" value="${escapeHtml(dist.form_button_text || '')}">
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save Distribution</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Distribution Requirements</h3>
          <button class="btn btn-gold" id="req-add">+ Add Requirement</button>
        </div>
        <div id="req-list">${renderReqs()}</div>
      </div>
    `;
    $('#dist-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiPut('/content/distribution', {
          chapter_label: $('#d-chapter').value,
          heading_main: $('#d-heading_main').value,
          heading_span: $('#d-heading_span').value,
          description: $('#d-description').value,
          form_label: $('#d-form_label').value,
          form_heading: $('#d-form_heading').value,
          form_button_text: $('#d-form_button_text').value
        });
        toast('Distribution saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    });
    function bindReqs() {
      $$('.req-row').forEach(row => {
        const i = +row.getAttribute('data-i');
        row.querySelector('.req-text').onchange = () => { reqs[i].req_text = row.querySelector('.req-text').value; };
        row.querySelector('.req-save').onclick = async () => {
          const payload = { req_text: row.querySelector('.req-text').value, sort_order: i + 1 };
          try {
            if (reqs[i].id) await apiPut('/content/distribution-requirements/' + reqs[i].id, payload);
            else {
              const created = await apiPost('/content/distribution-requirements', payload);
              if (created && created.id) reqs[i].id = created.id;
            }
            toast('Requirement saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        };
        row.querySelector('.req-up').onclick = () => {
          if (i === 0) return;
          [reqs[i - 1], reqs[i]] = [reqs[i], reqs[i - 1]];
          $('#req-list').innerHTML = renderReqs();
          bindReqs();
        };
        row.querySelector('.req-dn').onclick = () => {
          if (i === reqs.length - 1) return;
          [reqs[i + 1], reqs[i]] = [reqs[i], reqs[i + 1]];
          $('#req-list').innerHTML = renderReqs();
          bindReqs();
        };
        row.querySelector('.req-del').onclick = async () => {
          const ok = await confirmDialog('Delete this requirement?');
          if (!ok) return;
          if (reqs[i].id) { try { await apiDel('/content/distribution-requirements/' + reqs[i].id); } catch (_) {} }
          reqs.splice(i, 1);
          $('#req-list').innerHTML = renderReqs();
          bindReqs();
          toast('Deleted', 'success');
        };
      });
    }
    bindReqs();
    $('#req-add').onclick = async () => {
      try {
        const created = await apiPost('/content/distribution-requirements', { req_text: '' });
        reqs.push(created || { req_text: '' });
      } catch (_) {
        reqs.push({ req_text: '' });
      }
      $('#req-list').innerHTML = renderReqs();
      bindReqs();
    };
  }
});

AdminApp.registerRoute('contact', {
  title: 'Contact & Footer',
  subtitle: '',
  render: async function(container) {
    const [contact, seo, linksRaw] = await Promise.all([
      apiGet('/content/contact').catch(() => ({})),
      apiGet('/content/seo').catch(() => ({})),
      apiGet('/content/nav-links').catch(() => ([]))
    ]);
    let links = Array.isArray(linksRaw) ? linksRaw : (linksRaw.items || linksRaw.data || []);
    function renderLinks() {
      return links.map((l, i) => `
        <div class="list-item link-row" data-i="${i}">
          <div class="item-no">${String(i + 1).padStart(2, '0')}</div>
          <div class="item-main" style="display:grid;grid-template-columns:1fr 1.5fr;gap:10px;">
            <input type="text" class="ln-label" value="${escapeHtml(l.label || '')}" placeholder="Label" style="background:transparent;border:none;color:var(--paper);padding:2px;">
            <input type="text" class="ln-href" value="${escapeHtml(l.href || l.url || '')}" placeholder="URL / Anchor" style="background:transparent;border:none;color:var(--mist);padding:2px;">
          </div>
          <div class="list-actions">
            <button class="icon-btn ln-up" ${i === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
            <button class="icon-btn ln-dn" ${i === links.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
            <button class="icon-btn ln-save">💾</button>
            <button class="icon-btn ln-del" style="color:var(--danger);">✕</button>
          </div>
        </div>
      `).join('');
    }
    container.innerHTML = `
      <div class="card">
        <form id="con-form">
          <div class="grid-2">
            <div>
              <label>Logo</label>
              ${imagePickerInput(contact.logo || contact.logo_url || '')}
              <label>Kicker</label>
              <input type="text" id="c-kicker" value="${escapeHtml(contact.kicker || '')}">
              <label>Heading</label>
              <input type="text" id="c-heading" value="${escapeHtml(contact.heading || contact.title || '')}">
              <label>Description</label>
              <textarea id="c-description" style="min-height:100px;">${escapeHtml(contact.description || contact.text || '')}</textarea>
            </div>
            <div>
              <label>Email</label>
              <input type="email" id="c-email" value="${escapeHtml(contact.email || '')}">
              <label>Footer Left Text</label>
              <input type="text" id="c-footer_left" value="${escapeHtml(contact.footer_left || '')}">
              <label>Footer Right Text</label>
              <input type="text" id="c-footer_right" value="${escapeHtml(contact.footer_right || '')}">
            </div>
          </div>
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save Contact</button>
          </div>
        </form>
      </div>
      <div class="card">
        <form id="seo-form">
          <h3>SEO Settings</h3>
          <label>Site Title</label>
          <input type="text" id="seo-title" value="${escapeHtml(seo.site_title || seo.title || '')}">
          <label>Meta Description</label>
          <textarea id="seo-desc" style="min-height:90px;">${escapeHtml(seo.meta_description || seo.description || '')}</textarea>
          <div class="save-bar mt-24">
            <button type="submit" class="btn">Save SEO</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Nav Links</h3>
          <button class="btn btn-gold" id="ln-add">+ Add Link</button>
        </div>
        <div id="ln-list">${renderLinks()}</div>
      </div>
    `;
    $('#con-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiPut('/content/contact', {
          logo_url: $('#con-form .img-url-input').value,
          kicker: $('#c-kicker').value,
          heading: $('#c-heading').value,
          description: $('#c-description').value,
          email: $('#c-email').value,
          footer_left: $('#c-footer_left').value,
          footer_right: $('#c-footer_right').value
        });
        toast('Contact saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    });
    $('#seo-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiPut('/content/seo', {
          site_title: $('#seo-title').value,
          meta_description: $('#seo-desc').value
        });
        toast('SEO saved', 'success');
      } catch (err) { toast('Save failed: ' + err.message, 'error'); }
    });
    function bindLinks() {
      $$('.link-row').forEach(row => {
        const i = +row.getAttribute('data-i');
        row.querySelector('.ln-label').onchange = () => { links[i].label = row.querySelector('.ln-label').value; };
        row.querySelector('.ln-href').onchange = () => { links[i].href = row.querySelector('.ln-href').value; };
        row.querySelector('.ln-save').onclick = async () => {
          const payload = {
            label: row.querySelector('.ln-label').value,
            href: row.querySelector('.ln-href').value,
            sort_order: i + 1
          };
          try {
            if (links[i].id) await apiPut('/content/nav-links/' + links[i].id, payload);
            else {
              const created = await apiPost('/content/nav-links', payload);
              if (created && created.id) links[i].id = created.id;
            }
            toast('Link saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        };
        row.querySelector('.ln-up').onclick = () => {
          if (i === 0) return;
          [links[i - 1], links[i]] = [links[i], links[i - 1]];
          $('#ln-list').innerHTML = renderLinks();
          bindLinks();
        };
        row.querySelector('.ln-dn').onclick = () => {
          if (i === links.length - 1) return;
          [links[i + 1], links[i]] = [links[i], links[i + 1]];
          $('#ln-list').innerHTML = renderLinks();
          bindLinks();
        };
        row.querySelector('.ln-del').onclick = async () => {
          const ok = await confirmDialog('Delete this link?');
          if (!ok) return;
          if (links[i].id) { try { await apiDel('/content/nav-links/' + links[i].id); } catch (_) {} }
          links.splice(i, 1);
          $('#ln-list').innerHTML = renderLinks();
          bindLinks();
          toast('Deleted', 'success');
        };
      });
    }
    bindLinks();
    $('#ln-add').onclick = async () => {
      try {
        const created = await apiPost('/content/nav-links', { label: 'New Link', href: '#' });
        links.push(created || { label: 'New Link', href: '#' });
      } catch (_) {
        links.push({ label: 'New Link', href: '#' });
      }
      $('#ln-list').innerHTML = renderLinks();
      bindLinks();
    };
  }
});

AdminApp.registerRoute('navigation', {
  title: 'Navigation Menu',
  subtitle: 'Main website navigation',
  render: async function(container) {
    const data = await apiGet('/content/nav-links').catch(() => ([]));
    let links = Array.isArray(data) ? data : (data.items || data.data || []);
    function renderTable() {
      const sorted = links.slice().sort((a, b) => (a.sort_order || a.order || 0) - (b.sort_order || b.order || 0));
      links = sorted;
      return `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Label</th><th>URL / Anchor</th><th>Visible</th><th>Actions</th></tr></thead>
            <tbody>
              ${sorted.map((l, i) => `
                <tr data-id="${l.id || i}">
                  <td>
                    <div class="flex gap-8">
                      <button class="icon-btn nv-up" ${i === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
                      <input type="number" class="nv-order" value="${l.sort_order || l.order || i + 1}" style="width:60px;padding:6px 8px;text-align:center;">
                      <button class="icon-btn nv-dn" ${i === sorted.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
                    </div>
                  </td>
                  <td><input type="text" class="nv-label" value="${escapeHtml(l.label || '')}" style="background:transparent;border:none;color:var(--paper);padding:4px;width:100%;"></td>
                  <td><input type="text" class="nv-href" value="${escapeHtml(l.href || l.url || '')}" style="background:transparent;border:none;color:var(--mist);padding:4px;width:100%;"></td>
                  <td>
                    <div class="checkbox-wrap" style="padding:0;">
                      <input type="checkbox" class="nv-vis" ${l.visible !== false ? 'checked' : ''}>
                    </div>
                  </td>
                  <td>
                    <div class="list-actions">
                      <button class="icon-btn nv-save">💾</button>
                      <button class="icon-btn nv-del" style="color:var(--danger);">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="card mt-24">
          <h3>Preview</h3>
          <div style="padding:14px 18px;background:var(--navy2);border:1px solid var(--line);border-radius:5px;display:flex;gap:18px;flex-wrap:wrap;">
            ${sorted.filter(x => x.visible !== false).map(x => `<div style="padding:8px 4px;color:var(--paper);font-size:13px;font-weight:600;">${escapeHtml(x.label)}</div>`).join('')}
          </div>
        </div>
      `;
    }
    container.innerHTML = `
      <div class="card">
        <div class="flex-between mb-16">
          <h3>Menu Items (${links.length})</h3>
          <button class="btn btn-gold" id="nv-add">+ Add Menu Item</button>
        </div>
        <div id="nv-wrap">${renderTable()}</div>
      </div>
    `;
    function bindRows() {
      $$('#nv-wrap tbody tr').forEach(tr => {
        const id = tr.getAttribute('data-id');
        const i = Array.from(tr.parentNode.children).indexOf(tr);
        tr.querySelector('.nv-save').onclick = async () => {
          const payload = {
            label: tr.querySelector('.nv-label').value,
            href: tr.querySelector('.nv-href').value,
            sort_order: +tr.querySelector('.nv-order').value || 1,
            visible: tr.querySelector('.nv-vis').checked
          };
          try {
            if (!isNaN(+id) && links.find(l => l.id == id)) {
              await apiPut('/content/nav-links/' + id, payload);
            } else {
              const created = await apiPost('/content/nav-links', payload);
              if (created && created.id) tr.setAttribute('data-id', created.id);
            }
            toast('Link saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        };
        tr.querySelector('.nv-up').onclick = () => {
          if (i === 0) return;
          [links[i - 1], links[i]] = [links[i], links[i - 1]];
          links.forEach((l, idx) => l.sort_order = idx + 1);
          $('#nv-wrap').innerHTML = renderTable();
          bindRows();
        };
        tr.querySelector('.nv-dn').onclick = () => {
          if (i === links.length - 1) return;
          [links[i + 1], links[i]] = [links[i], links[i + 1]];
          links.forEach((l, idx) => l.sort_order = idx + 1);
          $('#nv-wrap').innerHTML = renderTable();
          bindRows();
        };
        tr.querySelector('.nv-del').onclick = async () => {
          const ok = await confirmDialog('Delete this menu item?');
          if (!ok) return;
          if (!isNaN(+id)) { try { await apiDel('/content/nav-links/' + id); } catch (_) {} }
          const idx = links.findIndex(l => l.id == id);
          if (idx >= 0) links.splice(idx, 1);
          $('#nv-wrap').innerHTML = renderTable();
          bindRows();
          toast('Deleted', 'success');
        };
        tr.querySelector('.nv-vis').onchange = async () => {
          links[i].visible = tr.querySelector('.nv-vis').checked;
          $('#nv-wrap').innerHTML = renderTable();
          bindRows();
        };
        tr.querySelector('.nv-order').onchange = () => {
          links[i].sort_order = +tr.querySelector('.nv-order').value || 1;
        };
      });
    }
    bindRows();
    $('#nv-add').onclick = async () => {
      try {
        const created = await apiPost('/content/nav-links', { label: 'New Item', href: '/', sort_order: links.length + 1, visible: true });
        links.push(created || { label: 'New Item', href: '/', visible: true });
      } catch (_) {
        links.push({ label: 'New Item', href: '/', visible: true });
      }
      $('#nv-wrap').innerHTML = renderTable();
      bindRows();
    };
  }
});

AdminApp.registerRoute('enquiries', {
  title: 'Distributor Enquiries',
  subtitle: '',
  render: async function(container) {
    let currentFilter = '';
    async function fetchData() {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (currentFilter === 'new') params.set('read', '0');
      else if (currentFilter === 'read') params.set('read', '1');
      const qs = params.toString();
      const data = await apiGet('/enquiries' + (qs ? '?' + qs : ''));
      return Array.isArray(data) ? data : (data.items || data.data || []);
    }
    let list = await fetchData();
    function render() {
      return `
        <div class="flex gap-8 mb-16">
          <button class="btn ${currentFilter === '' ? '' : 'btn-secondary'}" data-filter="">All</button>
          <button class="btn ${currentFilter === 'new' ? '' : 'btn-secondary'}" data-filter="new">New</button>
          <button class="btn ${currentFilter === 'read' ? '' : 'btn-secondary'}" data-filter="read">Read</button>
          <div style="flex:1;"></div>
          <button class="btn" id="export-csv">📥 CSV Export</button>
        </div>
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Company</th><th>Country</th><th>Contact</th><th>Email</th><th>Phone</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                ${list.map(e => `
                  <tr data-id="${e.id}">
                    <td><b>${escapeHtml(e.company_name || e.company || '—')}</b></td>
                    <td>${escapeHtml(e.country || '—')}</td>
                    <td>${escapeHtml(e.contact_name || e.name || '—')}</td>
                    <td>${escapeHtml(e.email || '—')}</td>
                    <td>${escapeHtml(e.phone || '—')}</td>
                    <td style="white-space:nowrap;">${formatDate(e.created_at || e.date)}</td>
                    <td><span class="badge badge-${e.read || e.status === 'read' ? 'read' : 'new'}">${e.read || e.status === 'read' ? 'Read' : 'New'}</span></td>
                    <td>
                      <div class="list-actions">
                        <button class="icon-btn e-view" title="View">👁</button>
                        <button class="icon-btn e-mark" title="Mark read/unread">📬</button>
                        <button class="icon-btn e-del" title="Delete" style="color:var(--danger);">🗑</button>
                      </div>
                    </td>
                  </tr>
                `).join('') || '<tr><td colspan="8" style="padding:30px;text-align:center;color:var(--mist);">No enquiries yet.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
    container.innerHTML = `<div id="enq-wrap">${render()}</div>`;
    function bind() {
      $$('[data-filter]').forEach(b => b.onclick = async () => {
        currentFilter = b.getAttribute('data-filter');
        list = await fetchData();
        $('#enq-wrap').innerHTML = render();
        bind();
      });
      $$('#enq-wrap tbody tr[data-id]').forEach(tr => {
        const id = tr.getAttribute('data-id');
        const e = list.find(x => x.id == id) || {};
        tr.querySelector('.e-view').onclick = () => {
          showModal('Enquiry Details', `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;margin-bottom:14px;">
              <div><div class="muted" style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Company</div><b>${escapeHtml(e.company_name || e.company || '—')}</b></div>
              <div><div class="muted" style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Country</div>${escapeHtml(e.country || '—')}</div>
              <div><div class="muted" style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Contact</div>${escapeHtml(e.contact_name || e.name || '—')}</div>
              <div><div class="muted" style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Email</div><a href="mailto:${escapeHtml(e.email || '')}" style="color:var(--blue);">${escapeHtml(e.email || '—')}</a></div>
              <div><div class="muted" style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Phone</div>${escapeHtml(e.phone || '—')}</div>
              <div><div class="muted" style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Created</div>${formatDate(e.created_at || e.date)}</div>
              <div style="grid-column:1/-1;"><div class="muted" style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Capability / Interest</div><div>${escapeHtml(e.capability || e.subject || '—')}</div></div>
              ${e.message ? `<div style="grid-column:1/-1;"><div class="muted" style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Message</div><div style="padding:12px;background:var(--navy2);border:1px solid var(--line);border-radius:5px;white-space:pre-wrap;line-height:1.6;">${escapeHtml(e.message)}</div></div>` : ''}
            </div>
          `, `<button class="btn btn-secondary" id="e-close">Close</button>`);
          $('#e-close').onclick = hideModal;
          if (!e.read && e.id) {
            try { apiPatch('/enquiries/' + e.id + '/read', { read: true }); e.read = true; } catch (_) {}
          }
        };
        tr.querySelector('.e-mark').onclick = async () => {
          const wasRead = e.read || e.status === 'read';
          try {
            await apiPatch('/enquiries/' + id + '/read', { read: !wasRead });
            e.read = !wasRead;
            toast(wasRead ? 'Marked as new' : 'Marked as read', 'success');
            $('#enq-wrap').innerHTML = render();
            bind();
          } catch (err) { toast('Failed: ' + err.message, 'error'); }
        };
        tr.querySelector('.e-del').onclick = async () => {
          const ok = await confirmDialog('Delete this enquiry permanently?');
          if (!ok) return;
          try {
            await apiDel('/enquiries/' + id);
            list = list.filter(x => x.id != id);
            toast('Deleted', 'success');
            $('#enq-wrap').innerHTML = render();
            bind();
          } catch (err) { toast('Delete failed: ' + err.message, 'error'); }
        };
      });
      $('#export-csv').onclick = async () => {
        try {
          const res = await fetch(API_BASE + '/enquiries/export/csv', {
            headers: getToken() ? { 'Authorization': 'Bearer ' + getToken() } : {}
          });
          if (res.status === 401) { logout(); return; }
          if (!res.ok) throw new Error('Export failed: ' + res.status);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'enquiries-' + new Date().toISOString().slice(0, 10) + '.csv';
          a.click();
          URL.revokeObjectURL(url);
          toast('Exported CSV', 'success');
        } catch (err) { toast('Export failed: ' + err.message, 'error'); }
      };
    }
    bind();
  }
});

AdminApp.registerRoute('media-library', {
  title: 'Media Library (FTP)',
  subtitle: '',
  render: async function(container) {
    let currentType = '';
    async function fetchList() {
      const p = new URLSearchParams({ page: '1', limit: '50' });
      if (currentType) p.set('type', currentType);
      const qs = p.toString();
      const data = await apiGet('/media' + (qs ? '?' + qs : ''));
      return Array.isArray(data) ? data : (data.items || data.data || []);
    }
    let list = await fetchList();
    function typeOf(f) {
      const t = f.file_type || f.type || '';
      if (t.startsWith('image/') || t === 'image') return 'image';
      if (t.startsWith('video/') || t === 'video') return 'video';
      if (t.includes('pdf')) return 'pdf';
      const n = (f.original_name || f.name || f.file_path || f.path || f.url || '').toLowerCase();
      if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(n)) return 'image';
      if (/\.(mp4|webm|mov|avi)$/.test(n)) return 'video';
      if (n.endsWith('.pdf')) return 'pdf';
      return 'other';
    }
    function render() {
      return `
        <div class="flex-between mb-16">
          <div class="flex gap-8">
            <button class="btn ${currentType === '' ? '' : 'btn-secondary'}" data-type="">All</button>
            <button class="btn ${currentType === 'image' ? '' : 'btn-secondary'}" data-type="image">Images</button>
            <button class="btn ${currentType === 'video' ? '' : 'btn-secondary'}" data-type="video">Videos</button>
            <button class="btn ${currentType === 'pdf' ? '' : 'btn-secondary'}" data-type="pdf">PDFs</button>
          </div>
          <div class="flex gap-8">
            <input type="file" id="ml-upload" accept="image/*,video/*,.pdf" multiple hidden>
            <label class="btn btn-gold" for="ml-upload" style="cursor:pointer;">⬆ Upload</label>
          </div>
        </div>
        <div class="card">
          <div class="media-grid">
            ${list.map(f => {
              const t = typeOf(f);
              const url = f.url || f.file_path || f.path || '';
              const fname = f.name || f.original_name || url;
              const thumb = t === 'image'
                ? `<div style="position:relative;width:100%;height:140px;">
                    <img class="ml-card-img" src="${escapeHtml(url)}" style="width:100%;height:140px;object-fit:cover;border-radius:6px 6px 0 0;display:block;">
                    <div class="ml-card-fb" style="position:absolute;top:0;left:0;width:100%;height:140px;display:none;place-items:center;background:var(--navy2);font-size:36px;border-radius:6px 6px 0 0;">🖼️</div>
                   </div>`
                : `<div style="height:140px;display:grid;place-items:center;background:var(--navy2);font-size:40px;border-radius:6px 6px 0 0;">${t === 'video' ? '🎬' : t === 'pdf' ? '📕' : '📄'}</div>`;
              return `
                <div class="media-card" data-id="${f.id || ''}" data-url="${escapeHtml(url)}">
                  <button class="icon-btn ml-del" title="Delete" style="position:absolute;top:6px;right:6px;color:var(--danger);background:rgba(0,0,0,.6);border-color:rgba(255,255,255,.15);">✕</button>
                  <div style="position:relative;cursor:pointer;" class="ml-preview">${thumb}</div>
                  <div class="media-info">
                    <b title="${escapeHtml(fname)}">${escapeHtml(fname || 'Untitled')}</b>
                    <small>${escapeHtml(f.size || f.file_size || '')}${(f.size || f.file_size) && (f.uploaded_at || f.created_at || f.date) ? ' · ' : ''}${formatDate(f.uploaded_at || f.created_at || f.date)}</small>
                  </div>
                </div>
              `;
            }).join('') || '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--mist);">No media files. Click Upload to add some.</div>'}
          </div>
        </div>
      `;
    }
    container.innerHTML = `<div id="ml-wrap">${render()}</div>`;
    function bind() {
      $$('[data-type]').forEach(b => b.onclick = async () => {
        currentType = b.getAttribute('data-type');
        list = await fetchList();
        $('#ml-wrap').innerHTML = render();
        bind();
      });
      $$('.media-card').forEach(card => {
        const id = card.getAttribute('data-id');
        const url = card.getAttribute('data-url');
        card.querySelector('.ml-del').onclick = async (ev) => {
          ev.stopPropagation();
          const ok = await confirmDialog('Delete this file?');
          if (!ok) return;
          try {
            if (id) await apiDel('/media/' + id);
            list = list.filter(x => (x.id != id) && ((x.url || x.file_path) !== url));
            toast('Deleted', 'success');
            $('#ml-wrap').innerHTML = render();
            bind();
          } catch (err) { toast('Delete failed: ' + err.message, 'error'); }
        };
        card.querySelector('.ml-preview').onclick = () => {
          const t = typeOf(list.find(x => (x.id == id) || ((x.url || x.file_path) === url)) || {});
          const content = t === 'image'
            ? `<img src="${escapeHtml(url)}" style="max-width:100%;max-height:60vh;border-radius:6px;">`
            : t === 'video'
            ? `<video controls src="${escapeHtml(url)}" style="max-width:100%;max-height:60vh;border-radius:6px;"></video>`
            : `<iframe src="${escapeHtml(url)}" style="width:100%;height:70vh;border:1px solid var(--line);border-radius:6px;"></iframe>`;
          showModal('Preview', content, `<button class="btn btn-secondary" id="pv-close">Close</button>`);
          $('#pv-close').onclick = hideModal;
        };
        const cardImg = card.querySelector('.ml-card-img');
        const cardFb = card.querySelector('.ml-card-fb');
        if (cardImg) {
          cardImg.onerror = () => {
            cardImg.style.display = 'none';
            if (cardFb) cardFb.style.display = 'grid';
          };
          cardImg.onload = () => {
            cardImg.style.display = 'block';
            if (cardFb) cardFb.style.display = 'none';
          };
        }
      });
      const upl = document.getElementById('ml-upload');
      if (upl && !upl.dataset.bound) {
        upl.dataset.bound = '1';
        upl.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files || []);
          for (const file of files) {
            try {
              await apiUpload('/media/upload', file);
              toast('Uploaded: ' + file.name, 'success');
            } catch (err) {
              toast('Upload failed: ' + file.name + ': ' + err.message, 'error');
            }
          }
          list = await fetchList();
          $('#ml-wrap').innerHTML = render();
          bind();
          upl.value = '';
        });
      }
    }
    bind();
  }
});

AdminApp.registerRoute('settings', {
  title: 'System Settings',
  subtitle: '',
  render: async function(container) {
    let ftpData = await apiGet('/settings/ftp').catch(() => ({}));
    const user = getUser() || {};
    const isSuper = !!(user.role === 'super_admin' || user.role === 'Super Admin' || user.isSuper);
    let admins = [];
    if (isSuper) { admins = await apiGet('/settings/admins').catch(() => ([])); if (!Array.isArray(admins)) admins = admins.items || admins.data || []; }
    function renderTabs(active, ftpStatus) {
      function ftpTab() {
        return `
          <form id="ftp-form">
            <div class="form-row">
              <div><label>Host</label><input type="text" id="ftp-host" value="${escapeHtml(ftpData.host || '')}"></div>
              <div><label>Port</label><input type="number" id="ftp-port" value="${escapeHtml(ftpData.port || '21')}"></div>
            </div>
            <div class="form-row">
              <div><label>Username</label><input type="text" id="ftp-user" value="${escapeHtml(ftpData.user || ftpData.username || '')}"></div>
              <div><label>Password</label><input type="password" id="ftp-pass" value="${escapeHtml(ftpData.password || '')}"></div>
            </div>
            <label>Base Path</label>
            <input type="text" id="ftp-base" value="${escapeHtml(ftpData.base_path || ftpData.basePath || '')}">
            <label>Public URL <small style="color:var(--mist);font-weight:400;">(optional — leave blank, images are served via the built-in proxy)</small></label>
            <input type="text" id="ftp-public" value="${escapeHtml(ftpData.public_url || ftpData.publicUrl || '')}" placeholder="Leave blank to use built-in proxy">
            <div style="margin:12px 0;">
              ${ftpStatus ? `<span class="status-pill status-${ftpStatus.ok ? 'ok' : 'err'}"><span class="status-dot"></span>${ftpStatus.ok ? 'Connection successful' : (ftpStatus.message || 'Connection failed')}</span>` : ''}
            </div>
            <div class="save-bar mt-24">
              <button type="button" class="btn btn-secondary" id="ftp-test">Test FTP Connection</button>
              <button type="submit" class="btn">Save FTP Settings</button>
            </div>
          </form>
          <div class="card mt-24" style="border:1px solid var(--gold);background:rgba(244,166,36,.07);">
            <div class="flex-between">
              <div>
                <b>🔧 Fix Existing Media URLs</b>
                <p style="color:var(--mist);margin:6px 0 0;">If previously uploaded images are not showing, click this to rewrite all stored URLs to use the built-in proxy. This is safe to run multiple times.</p>
              </div>
              <button class="btn btn-gold" id="fix-urls-btn" style="white-space:nowrap;flex-shrink:0;margin-left:16px;">Fix All URLs</button>
            </div>
            <div id="fix-urls-result" style="margin-top:10px;display:none;"></div>
          </div>
        `;
      }
      function secTab() {
        return `
          <form id="sec-form" style="max-width:560px;">
            <label>Current Password</label>
            <input type="password" id="sec-cur">
            <label>New Password</label>
            <input type="password" id="sec-new">
            <label>Confirm New Password</label>
            <input type="password" id="sec-conf">
            <div class="save-bar mt-24">
              <button type="submit" class="btn">Update Password</button>
            </div>
          </form>
        `;
      }
      function adminTab() {
        if (!isSuper) return '<div class="card"><p>Only super admins can manage users.</p></div>';
        return `
          <div class="card">
            <div class="flex-between mb-16">
              <h3>Admin Users (${admins.length})</h3>
              <button class="btn btn-gold" id="adm-add">+ Add Admin</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                  ${admins.map((a, i) => `
                    <tr data-id="${a.id || i}">
                      <td><input type="text" class="ad-name" value="${escapeHtml(a.name || '')}" style="background:transparent;border:none;color:var(--paper);padding:4px;width:100%;"></td>
                      <td><input type="email" class="ad-email" value="${escapeHtml(a.email || '')}" style="background:transparent;border:none;color:var(--mist);padding:4px;width:100%;"></td>
                      <td>
                        <select class="ad-role" style="background:transparent;border:none;color:var(--paper);padding:4px;">
                          <option value="admin" ${(a.role || 'admin') === 'admin' ? 'selected' : ''}>Admin</option>
                          <option value="super_admin" ${a.role === 'super_admin' || a.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>
                        </select>
                      </td>
                      <td>
                        <div class="list-actions">
                          <button class="icon-btn ad-save">💾</button>
                          <button class="icon-btn ad-del" style="color:var(--danger);">✕</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      return `
        <div class="tabs">
          <div class="tab ${active === 'ftp' ? 'active' : ''}" data-tab="ftp">FTP</div>
          <div class="tab ${active === 'sec' ? 'active' : ''}" data-tab="sec">Security</div>
          ${isSuper ? `<div class="tab ${active === 'adm' ? 'active' : ''}" data-tab="adm">Admins</div>` : ''}
        </div>
        <div id="tab-content">
          ${active === 'ftp' ? ftpTab() : active === 'sec' ? secTab() : adminTab()}
        </div>
      `;
    }
    let activeTab = 'ftp';
    let ftpStatus = null;
    container.innerHTML = renderTabs(activeTab, ftpStatus);
    function bind(active) {
      $$('.tab').forEach(t => t.onclick = () => {
        activeTab = t.getAttribute('data-tab');
        container.innerHTML = renderTabs(activeTab, ftpStatus);
        bind(activeTab);
      });
      if (active === 'ftp') {
        $('#ftp-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          try {
            ftpData = await apiPut('/settings/ftp', {
              host: $('#ftp-host').value,
              port: +$('#ftp-port').value || 21,
              user: $('#ftp-user').value,
              password: $('#ftp-pass').value,
              base_path: $('#ftp-base').value,
              public_url: $('#ftp-public').value
            });
            toast('FTP settings saved', 'success');
          } catch (err) { toast('Save failed: ' + err.message, 'error'); }
        });
        $('#ftp-test').onclick = async () => {
          try {
            ftpStatus = await apiGet('/media/ftp-test');
            toast(ftpStatus.ok || ftpStatus.status === 'ok' || ftpStatus.connected ? 'FTP connection OK' : 'FTP connection failed', ftpStatus.ok || ftpStatus.status === 'ok' || ftpStatus.connected ? 'success' : 'error');
          } catch (err) {
            ftpStatus = { ok: false, message: err.message };
            toast('FTP test failed: ' + err.message, 'error');
          }
          container.innerHTML = renderTabs(activeTab, ftpStatus);
          bind(activeTab);
        };
        $('#fix-urls-btn').onclick = async () => {
          const btn = $('#fix-urls-btn');
          const resultEl = $('#fix-urls-result');
          btn.disabled = true;
          btn.textContent = 'Working…';
          try {
            const res = await apiRequest('POST', '/media/fix-urls');
            resultEl.style.display = '';
            resultEl.innerHTML = `<span class="status-pill status-ok"><span class="status-dot"></span>${escapeHtml(res.message || 'Done')}</span>`;
            toast(res.message || 'URLs fixed', 'success');
          } catch (err) {
            resultEl.style.display = '';
            resultEl.innerHTML = `<span class="status-pill status-err"><span class="status-dot"></span>${escapeHtml(err.message)}</span>`;
            toast('Fix failed: ' + err.message, 'error');
          }
          btn.disabled = false;
          btn.textContent = 'Fix All URLs';
        };
      } else if (active === 'sec') {
        $('#sec-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const cur = $('#sec-cur').value;
          const np = $('#sec-new').value;
          const cf = $('#sec-conf').value;
          if (!cur || !np) { toast('Please fill all fields', 'error'); return; }
          if (np.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
          if (np !== cf) { toast('Passwords do not match', 'error'); return; }
          try {
            await apiPost('/auth/change-password', { current_password: cur, new_password: np });
            toast('Password updated', 'success');
            e.target.reset();
          } catch (err) { toast('Update failed: ' + err.message, 'error'); }
        });
      } else if (active === 'adm') {
        $$('tbody tr[data-id]').forEach(tr => {
          const id = tr.getAttribute('data-id');
          tr.querySelector('.ad-save').onclick = async () => {
            const payload = {
              name: tr.querySelector('.ad-name').value,
              email: tr.querySelector('.ad-email').value,
              role: tr.querySelector('.ad-role').value
            };
            try {
              if (!isNaN(+id) && admins.find(a => a.id == id)) {
                await apiPut('/settings/admins/' + id, payload);
              } else {
                const pw = prompt('Set password for new admin:');
                if (!pw) { toast('Password required', 'error'); return; }
                const created = await apiPost('/settings/admins', { ...payload, password: pw });
                if (created && created.id) tr.setAttribute('data-id', created.id);
              }
              toast('Admin saved', 'success');
            } catch (err) { toast('Save failed: ' + err.message, 'error'); }
          };
          tr.querySelector('.ad-del').onclick = async () => {
            const ok = await confirmDialog('Delete this admin?');
            if (!ok) return;
            if (!isNaN(+id)) { try { await apiDel('/settings/admins/' + id); } catch (_) {} }
            const idx = admins.findIndex(a => a.id == id);
            if (idx >= 0) admins.splice(idx, 1);
            container.innerHTML = renderTabs(activeTab, ftpStatus);
            bind(activeTab);
            toast('Deleted', 'success');
          };
        });
        $('#adm-add').onclick = () => {
          admins.push({ name: '', email: '', role: 'admin' });
          container.innerHTML = renderTabs(activeTab, ftpStatus);
          bind(activeTab);
        };
      }
    }
    bind(activeTab);
  }
});

// ============================================================
// PRODUCTS
// ============================================================
AdminApp.registerRoute('products', {
  title: 'Products',
  subtitle: 'Manage the products shown on the Products page',
  render: async function(container) {
    const res = await apiGet('/content/products').catch(() => ({ data: [] }));
    let products = Array.isArray(res) ? res : (res.data || []);

    function renderList() {
      if (!products.length) {
        return '<p style="color:var(--mist);padding:24px 0;">No products yet. Click "+ Add Product" to create one.</p>';
      }
      return products.map((p, i) => `
        <div class="list-item prod-row" data-id="${p.id || ''}">
          <div class="item-no">${String(i + 1).padStart(2, '0')}</div>
          <div style="width:60px;height:46px;flex-shrink:0;border-radius:4px;overflow:hidden;background:var(--navy2);display:flex;align-items:center;justify-content:center;">
            ${p.image_url
              ? `<img src="${escapeHtml(p.image_url)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
              : `<span style="font-size:22px;">📦</span>`}
          </div>
          <div class="item-main" style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.name || '')}</div>
            <div style="color:var(--mist);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.short_description || '')}</div>
          </div>
          <div style="flex-shrink:0;">
            <span class="badge ${p.is_active ? 'badge-ok' : 'badge-err'}" style="font-size:11px;padding:3px 8px;border-radius:10px;background:${p.is_active ? 'rgba(46,167,113,.18)' : 'rgba(224,83,83,.18)'};color:${p.is_active ? 'var(--success)' : 'var(--danger)'};">
              ${p.is_active ? 'Active' : 'Hidden'}
            </span>
          </div>
          <div class="list-actions">
            <button class="icon-btn prod-edit" title="Edit">✏️</button>
            <button class="icon-btn prod-del" title="Delete" style="color:var(--danger);">🗑</button>
          </div>
        </div>
      `).join('');
    }

    function renderPage() {
      container.innerHTML = `
        <div class="card">
          <div class="flex-between mb-16">
            <h3>All Products (${products.length})</h3>
            <button class="btn btn-gold" id="prod-add">+ Add Product</button>
          </div>
          <div id="prod-list">${renderList()}</div>
        </div>
      `;
      bindList();
    }

    function openForm(product) {
      const isNew = !product || !product.id;
      const p = product || {};
      showModal(
        isNew ? 'Add Product' : 'Edit Product',
        `<div style="display:grid;gap:14px;">
          <div>
            <label style="display:block;margin-bottom:6px;font-size:12px;color:var(--mist);text-transform:uppercase;letter-spacing:.06em;">Product Name *</label>
            <input id="pf-name" type="text" value="${escapeHtml(p.name || '')}" placeholder="e.g. TECHBOLT 313 Round Pile Breaker" style="width:100%;padding:10px 12px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);font-size:14px;">
          </div>
          <div>
            <label style="display:block;margin-bottom:6px;font-size:12px;color:var(--mist);text-transform:uppercase;letter-spacing:.06em;">Short Description</label>
            <textarea id="pf-desc" rows="4" placeholder="Brief description shown in the popup..." style="width:100%;padding:10px 12px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);font-size:14px;resize:vertical;">${escapeHtml(p.short_description || '')}</textarea>
          </div>
          <div>
            <label style="display:block;margin-bottom:6px;font-size:12px;color:var(--mist);text-transform:uppercase;letter-spacing:.06em;">Product Image</label>
            ${imagePickerInput(p.image_url || '')}
          </div>
          <div class="grid-2" style="gap:12px;">
            <div>
              <label style="display:block;margin-bottom:6px;font-size:12px;color:var(--mist);text-transform:uppercase;letter-spacing:.06em;">Category</label>
              <input id="pf-cat" type="text" value="${escapeHtml(p.category || 'TECHBOLT')}" style="width:100%;padding:10px 12px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);font-size:14px;">
            </div>
            <div>
              <label style="display:block;margin-bottom:6px;font-size:12px;color:var(--mist);text-transform:uppercase;letter-spacing:.06em;">Sort Order</label>
              <input id="pf-order" type="number" value="${p.sort_order !== undefined ? p.sort_order : products.length}" style="width:100%;padding:10px 12px;background:var(--navy2);border:1px solid var(--line);border-radius:4px;color:var(--paper);font-size:14px;">
            </div>
          </div>
          <div>
            <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;">
              <input id="pf-active" type="checkbox" ${p.is_active !== 0 ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;">
              <span>Active (visible on products page)</span>
            </label>
          </div>
        </div>`,
        `<button class="btn btn-secondary" id="pf-cancel">Cancel</button>
         <button class="btn btn-gold" id="pf-save">${isNew ? 'Add Product' : 'Save Changes'}</button>`
      );

      $('#pf-cancel').onclick = hideModal;

      $('#pf-save').onclick = async () => {
        const name = $('#pf-name').value.trim();
        if (!name) { toast('Product name is required', 'error'); return; }

        const payload = {
          name,
          short_description: $('#pf-desc').value.trim(),
          image_url: document.querySelector('#modal-body .img-url-input')?.value || p.image_url || '',
          category: $('#pf-cat').value.trim() || 'TECHBOLT',
          sort_order: parseInt($('#pf-order').value, 10) || 0,
          is_active: $('#pf-active').checked ? 1 : 0
        };

        try {
          if (isNew) {
            const created = await apiPost('/content/products', payload);
            products.push(created.data || created);
            toast('Product added', 'success');
          } else {
            const updated = await apiPut('/content/products/' + p.id, payload);
            const idx = products.findIndex(x => x.id == p.id);
            if (idx >= 0) products[idx] = updated.data || updated;
            toast('Product saved', 'success');
          }
          hideModal();
          $('#prod-list').innerHTML = renderList();
          $('[data-id]') && bindList();
          // re-render full page to update count
          const hdr = document.querySelector('.card h3');
          if (hdr) hdr.textContent = `All Products (${products.length})`;
          $('#prod-list').innerHTML = renderList();
          bindList();
        } catch (err) {
          toast('Save failed: ' + err.message, 'error');
        }
      };
    }

    function bindList() {
      $$('.prod-row').forEach(row => {
        const id = row.getAttribute('data-id');
        const p = products.find(x => String(x.id) === String(id)) || {};

        row.querySelector('.prod-edit').onclick = () => openForm(p);

        row.querySelector('.prod-del').onclick = async () => {
          const ok = await confirmDialog(`Delete "${p.name}"?`);
          if (!ok) return;
          try {
            await apiDel('/content/products/' + id);
            products = products.filter(x => String(x.id) !== String(id));
            toast('Product deleted', 'success');
            $('#prod-list').innerHTML = renderList();
            bindList();
            const hdr = document.querySelector('.card h3');
            if (hdr) hdr.textContent = `All Products (${products.length})`;
          } catch (err) {
            toast('Delete failed: ' + err.message, 'error');
          }
        };
      });

      document.getElementById('prod-add') && (document.getElementById('prod-add').onclick = () => openForm(null));
    }

    renderPage();
  }
});
