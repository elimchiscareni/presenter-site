(() => {
  'use strict';

  const owner = 'elimchiscareni';
  const repo = 'presenter-site';
  const releasesUrl = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=30`;
  const latestFallback = `https://github.com/${owner}/${repo}/releases/latest`;

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Închide meniul' : 'Deschide meniul');
    });
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Deschide meniul');
      });
    });
  }

  function readableDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ro-RO', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Instalator EXE';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function createReleaseCard(release, index) {
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
    const rawNotes = (release.body || 'Detaliile acestei actualizări nu au fost adăugate încă.').trim();
    notes.textContent = rawNotes.length > 520 ? `${rawNotes.slice(0, 517)}…` : rawNotes;

    const meta = document.createElement('div');
    meta.className = 'release-meta';
    const date = readableDate(release.published_at || release.created_at);
    meta.textContent = date ? `Publicată la ${date}` : 'Lansare publicată';

    const link = document.createElement('a');
    link.className = 'text-link release-link';
    link.href = release.html_url || latestFallback;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Detalii pe GitHub ↗';

    content.append(title, notes, meta, link);
    article.append(version, content);
    return article;
  }

  function renderReleases(releases) {
    const releaseList = document.getElementById('releaseList');
    if (!releaseList) return;

    releaseList.replaceChildren();
    const published = releases.filter((item) => !item.draft && !item.prerelease);
    if (!published.length) {
      releaseList.textContent = 'Nu există încă lansări stabile publicate.';
      return;
    }

    published.forEach((release, index) => {
      releaseList.appendChild(createReleaseCard(release, index));
    });
  }

  async function loadReleases() {
    const downloadButton = document.getElementById('downloadButton');
    if (downloadButton) downloadButton.href = latestFallback;

    try {
      const response = await fetch(releasesUrl, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!response.ok) throw new Error(`GitHub API: ${response.status}`);

      const releases = await response.json();
      const published = releases.filter((item) => !item.draft && !item.prerelease);
      if (!published.length) throw new Error('Nu există lansări stabile publicate.');

      const latest = published[0];
      const installer = (latest.assets || []).find((asset) =>
        typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.exe')
      );

      setText('#currentVersion', latest.tag_name || latest.name || 'Disponibilă');
      setText('#releaseDate', readableDate(latest.published_at || latest.created_at));

      if (installer && downloadButton) {
        downloadButton.href = installer.browser_download_url;
        downloadButton.setAttribute('download', installer.name);
        setText('#fileSize', formatSize(installer.size));
        setText('#downloadStatus', `Instalator disponibil: ${installer.name}`);
      } else if (downloadButton) {
        downloadButton.href = latest.html_url || latestFallback;
        setText('#fileSize', 'Vezi lansarea');
        setText('#downloadStatus', 'Deschide pagina lansării pentru fișierul de instalare.');
      }

      renderReleases(published);
    } catch (error) {
      setText('#currentVersion', '1.3.0');
      setText('#fileSize', 'Instalator Windows');
      setText('#downloadStatus', 'Nu am putut actualiza automat informațiile. Poți deschide pagina lansărilor GitHub.');

      const releaseList = document.getElementById('releaseList');
      if (releaseList) {
        releaseList.replaceChildren();
        const fallback = document.createElement('article');
        fallback.className = 'release-card';
        const version = document.createElement('div');
        version.className = 'release-version';
        version.textContent = 'v1.3.0';
        const content = document.createElement('div');
        content.className = 'release-content';
        const title = document.createElement('strong');
        title.textContent = 'Presenter 1.3.0';
        const note = document.createElement('p');
        note.textContent = 'Istoricul complet nu este disponibil momentan. Consultă pagina lansărilor GitHub.';
        const link = document.createElement('a');
        link.className = 'text-link';
        link.href = latestFallback;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Deschide lansările GitHub ↗';
        content.append(title, note, link);
        fallback.append(version, content);
        releaseList.appendChild(fallback);
      }
    }
  }

  if (document.getElementById('downloadButton') || document.getElementById('releaseList')) {
    loadReleases();
  }
})();
