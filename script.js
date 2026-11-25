(() => {
  'use strict';
  const OWNER = 'elimchiscareni';
  const REPO = 'presenter-site';
  const RELEASES_URL = `https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=30`;
  const LATEST_URL = `https://github.com/${OWNER}/${REPO}/releases/latest`;
  const CACHE_KEY = 'presenter-site-releases-v1';
  const CACHE_MAX_AGE = 15 * 60 * 1000;

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  // Accessible responsive navigation.
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Deschide meniul');
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Închide meniul' : 'Deschide meniul');
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
    document.addEventListener('click', (event) => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 980) closeMenu(); });
  }

  const byId = (id) => document.getElementById(id);
  const readableDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };
  const formatSize = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Instalator EXE';
    const mb = bytes / (1024 * 1024);
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  };
  const stableReleases = (items) => (Array.isArray(items) ? items : [])
    .filter((item) => item && !item.draft && !item.prerelease)
    .sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0));

  function makeReleaseCard(release, index) {
    const article = document.createElement('article');
    article.className = 'release-card';
    const version = document.createElement('div');
    version.className = 'release-version';
    version.textContent = release.tag_name || 'Versiune';
    const content = document.createElement('div');
    content.className = 'release-content';
    const title = document.createElement('strong');
    title.textContent = release.name || `Presenter ${release.tag_name || ''}`;
    if (index === 0) {
      const badge = document.createElement('span');
      badge.className = 'release-badge';
      badge.textContent = 'Cea mai recentă';
      title.append(' ', badge);
    }
    const notes = document.createElement('p');
    const text = (release.body || 'Detaliile acestei actualizări nu au fost adăugate încă.').trim();
    notes.textContent = text.length > 900 ? `${text.slice(0, 897)}…` : text;
    const meta = document.createElement('div');
    meta.className = 'release-meta';
    const date = readableDate(release.published_at || release.created_at);
    meta.textContent = date ? `Publicată la ${date}` : 'Lansare publicată';
    const actions = document.createElement('div');
    actions.className = 'release-actions';
    if (release.html_url) {
      const link = document.createElement('a');
      link.className = 'text-link';
      link.href = release.html_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Detalii pe GitHub ↗';
      actions.append(link);
    }
    const exe = (release.assets || []).find((asset) => typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.exe'));
    if (exe && exe.browser_download_url) {
      const download = document.createElement('a');
      download.className = 'text-link';
      download.href = exe.browser_download_url;
      download.rel = 'noopener';
      download.textContent = 'Descarcă instalatorul ↓';
      actions.append(download);
    }
    content.append(title, notes, meta);
    if (actions.childElementCount) content.append(actions);
    article.append(version, content);
    return article;
  }

  function showReleases(items) {
    const list = byId('releaseList');
    if (!list) return;
    const releases = stableReleases(items);
    list.replaceChildren();
    if (!releases.length) {
      const message = document.createElement('p');
      message.className = 'release-loading';
      message.textContent = 'Nu există momentan lansări stabile publicate. Consultă pagina lansărilor de pe GitHub.';
      list.append(message);
      return;
    }
    releases.forEach((release, index) => list.append(makeReleaseCard(release, index)));
  }

  function showLatest(releases) {
    const currentVersion = byId('currentVersion');
    const releaseDate = byId('releaseDate');
    const downloadButton = byId('downloadButton');
    const fileSize = byId('fileSize');
    const status = byId('downloadStatus');
    const latest = stableReleases(releases)[0];
    if (!latest) return;
    if (currentVersion) currentVersion.textContent = latest.tag_name || latest.name || 'Disponibilă';
    if (releaseDate) {
      const date = readableDate(latest.published_at || latest.created_at);
      releaseDate.textContent = date ? `Publicată la ${date}` : 'Ultima versiune stabilă';
    }
    const installer = (latest.assets || []).find((asset) => typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.exe'));
    if (downloadButton) {
      if (installer && installer.browser_download_url) {
        downloadButton.href = installer.browser_download_url;
        downloadButton.removeAttribute('target');
        if (fileSize) fileSize.textContent = formatSize(installer.size);
        if (status) status.textContent = `Instalator disponibil: ${installer.name}`;
      } else {
        downloadButton.href = latest.html_url || LATEST_URL;
        downloadButton.target = '_blank';
        downloadButton.rel = 'noopener';
        if (fileSize) fileSize.textContent = 'Vezi lansarea';
        if (status) status.textContent = 'Deschide pagina lansării pentru fișierul de instalare.';
      }
    }
  }

  function applyReleaseData(items) {
    const published = stableReleases(items);
    if (!published.length) throw new Error('Nu există versiuni stabile disponibile.');
    showLatest(published);
    showReleases(published);
  }

  function readCache() {
    try {
      const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (saved && Array.isArray(saved.items) && Date.now() - saved.savedAt < CACHE_MAX_AGE) return saved.items;
    } catch (_) { /* localStorage poate fi dezactivat; continuăm fără cache. */ }
    return null;
  }
  function saveCache(items) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items })); }
    catch (_) { /* cache opțional */ }
  }

  async function loadReleases() {
    const downloadButton = byId('downloadButton');
    if (downloadButton) downloadButton.href = LATEST_URL;
    const cached = readCache();
    if (cached) {
      try { applyReleaseData(cached); } catch (_) { /* cerem date proaspete mai jos */ }
    }
    try {
      const response = await fetch(RELEASES_URL, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      const items = await response.json();
      applyReleaseData(items);
      saveCache(items);
    } catch (error) {
      const status = byId('downloadStatus');
      if (status && !cached) status.textContent = 'Informațiile automate nu sunt disponibile momentan. Poți deschide pagina oficială a lansărilor GitHub.';
      const list = byId('releaseList');
      if (list && !cached) {
        list.replaceChildren();
        const note = document.createElement('p');
        note.className = 'release-loading';
        note.textContent = 'Nu am putut încărca istoricul automat. Deschide pagina lansărilor pentru lista completă.';
        const link = document.createElement('a');
        link.className = 'text-link'; link.href = `${LATEST_URL.replace('/latest','')}`; link.target = '_blank'; link.rel = 'noopener';
        link.textContent = 'Vezi lansările pe GitHub ↗';
        list.append(note, link);
      }
      if (cached) {
        const statusEl = byId('downloadStatus');
        if (statusEl) statusEl.textContent = 'Afișăm informațiile salvate anterior; nu am putut verifica dacă există o versiune mai nouă.';
      }
    }
  }

  if (byId('downloadButton') || byId('releaseList')) loadReleases();
})();
