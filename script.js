(() => {
  const owner = 'elimchiscareni';
  const repo = 'presenter-site';
  const releasesUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const latestFallback = `https://github.com/${owner}/${repo}/releases/latest`;
  const downloadButton = document.getElementById('downloadButton');
  const currentVersion = document.getElementById('currentVersion');
  const releaseDate = document.getElementById('releaseDate');
  const fileSize = document.getElementById('fileSize');
  const downloadStatus = document.getElementById('downloadStatus');
  const releaseList = document.getElementById('releaseList');
  document.getElementById('year').textContent = new Date().getFullYear();

  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  menuToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Închide meniul' : 'Deschide meniul');
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  function readableDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Instalator';
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }

  function renderReleases(releases) {
    releaseList.replaceChildren();
    const published = releases.filter(item => !item.draft);
    if (!published.length) {
      releaseList.textContent = 'Nu există încă lansări publicate.';
      return;
    }
    published.slice(0, 8).forEach((release, index) => {
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
        title.appendChild(badge);
      }
      const notes = document.createElement('p');
      notes.textContent = (release.body || 'Detaliile acestei actualizări nu au fost adăugate încă.').trim();
      const meta = document.createElement('div');
      meta.className = 'release-meta';
      meta.textContent = `Publicată la ${readableDate(release.published_at || release.created_at)}`;
      content.append(title, notes, meta);
      article.append(version, content);
      releaseList.appendChild(article);
    });
  }

  async function loadReleases() {
    downloadButton.href = latestFallback;
    try {
      const response = await fetch(releasesUrl, {
        headers: { 'Accept': 'application/vnd.github+json' }
      });
      if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
      const releases = await response.json();
      const published = releases.filter(item => !item.draft);
      if (!published.length) throw new Error('Nu există lansări publicate.');
      const latest = published[0];
      const installer = (latest.assets || []).find(asset => asset.name.toLowerCase().endsWith('.exe'));
      currentVersion.textContent = latest.tag_name || latest.name || 'Disponibilă';
      releaseDate.textContent = readableDate(latest.published_at || latest.created_at);
      if (installer) {
        downloadButton.href = installer.browser_download_url;
        fileSize.textContent = formatSize(installer.size);
        downloadStatus.textContent = `Se descarcă instalatorul ${installer.name}`;
        downloadButton.setAttribute('download', installer.name);
      } else {
        downloadButton.href = latest.html_url || latestFallback;
        fileSize.textContent = 'Vezi lansarea';
        downloadStatus.textContent = 'Deschide pagina lansării pentru fișierul de instalare.';
      }
      renderReleases(published);
    } catch (error) {
      currentVersion.textContent = '1.3.0';
      releaseDate.textContent = '';
      downloadStatus.textContent = 'Nu am putut actualiza automat informațiile. Deschide pagina lansărilor GitHub.';
      fileSize.textContent = 'Instalator Windows';
      releaseList.innerHTML = '<article class="release-card"><div class="release-version">v1.3.0</div><div class="release-content"><strong>Presenter 1.3.0</strong><p>Prima versiune publică Presenter disponibilă pentru descărcare de pe site-ul oficial.</p><div class="release-meta">Vezi <a class="text-link" href="' + latestFallback + '" target="_blank" rel="noopener">lansarea pe GitHub ↗</a></div></div></article>';
    }
  }
  loadReleases();
})();
