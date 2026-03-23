const GITHUB_REPO = 'christopherkondora/klient-app';
const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

// ─── Platform detection ───
function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  return 'win';
}

const userPlatform = detectPlatform();

// ─── Navbar scroll effect ───
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('nav-scrolled');
  } else {
    navbar.classList.remove('nav-scrolled');
  }
});

// ─── Mobile menu ───
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileBtn?.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
});

// Close mobile menu on link click
mobileMenu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
});

// ─── Intersection Observer for reveal animations ───
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// ─── Persona card switching (linked to accordion) ───
const personaDetails = document.querySelectorAll('#audience details[data-persona]');
const personaCards = document.querySelectorAll('.persona-card');

personaDetails.forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    const target = detail.dataset.persona;

    // Close other details
    personaDetails.forEach((d) => {
      if (d !== detail && d.open) d.open = false;
    });

    // Crossfade cards
    personaCards.forEach((c) => {
      if (c.dataset.persona === target) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  });
});

// ─── Active nav link highlight ───
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY + 200;
  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    }
  });
});

// ─── Format bytes ───
function formatBytes(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

// ─── Format date ───
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Fetch releases from GitHub API ───
async function loadReleases() {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const releases = await response.json();

    if (!releases.length) {
      document.getElementById('releases-list').innerHTML =
        '<p class="text-center text-steel py-8">Még nincsenek release-ek.</p>';
      return;
    }

    // Set download links from latest release
    const latest = releases[0];
    setupDownloads(latest);

    // Set current version in hero badge and download section
    const versionEl = document.getElementById('current-version');
    const heroVersion = document.getElementById('hero-version');
    if (versionEl) versionEl.textContent = latest.tag_name;
    if (heroVersion) heroVersion.textContent = `${latest.tag_name} — Elérhető Windows és macOS rendszerre`;

    // Render release notes
    renderReleases(releases);
  } catch (err) {
    console.error('Failed to load releases:', err);
    document.getElementById('releases-list').innerHTML =
      '<p class="text-center text-steel py-8">Nem sikerült betölteni a release jegyzéket. <a href="https://github.com/' +
      GITHUB_REPO +
      '/releases" target="_blank" rel="noopener noreferrer" class="text-ash underline">Nézd meg a GitHubon →</a></p>';
  }
}

// ─── Setup download links from latest release ───
function setupDownloads(release) {
  const assets = release.assets || [];

  const winAsset = assets.find((a) => a.name.endsWith('.exe') && a.name.includes('Setup'));
  const macAsset = assets.find((a) => a.name.endsWith('.dmg'));

  const winBtn = document.getElementById('download-win');
  const macBtn = document.getElementById('download-mac');
  const winLabel = document.getElementById('download-win-label');
  const macLabel = document.getElementById('download-mac-label');
  const winSize = document.getElementById('download-win-size');
  const macSize = document.getElementById('download-mac-size');

  if (winAsset && winBtn) {
    winBtn.href = winAsset.browser_download_url;
    if (winLabel) winLabel.textContent = `Letöltés (.exe)`;
    if (winSize) winSize.textContent = formatBytes(winAsset.size);
  }

  if (macAsset && macBtn) {
    macBtn.href = macAsset.browser_download_url;
    if (macLabel) macLabel.textContent = `Letöltés (.dmg)`;
    if (macSize) macSize.textContent = formatBytes(macAsset.size);
  }

  // Highlight user's platform
  const primaryBtn = userPlatform === 'mac' ? macBtn : winBtn;
  const secondaryBtn = userPlatform === 'mac' ? winBtn : macBtn;
  if (primaryBtn) {
    primaryBtn.classList.add('ring-2', 'ring-ash/30');
    const badge = document.createElement('div');
    badge.className = 'text-[10px] font-bold uppercase tracking-wider text-ash mt-3';
    badge.textContent = 'A TE RENDSZERED';
    primaryBtn.appendChild(badge);
  }
}

// ─── Render release notes timeline ───
function renderReleases(releases) {
  const container = document.getElementById('releases-list');

  const html = releases
    .slice(0, 10)
    .map((release, i) => {
      const isLatest = i === 0;
      const body = release.body
        ? release.body
            .replace(/^### /gm, '<h4 class="text-sm font-semibold text-cream mt-4 mb-2">')
            .replace(/^## /gm, '<h3 class="text-base font-semibold text-cream mt-4 mb-2">')
            .replace(
              /^- (.*)/gm,
              '<li class="flex items-start gap-2 text-sm text-steel-light"><span class="text-ash mt-1 shrink-0">•</span><span>$1</span></li>'
            )
            .replace(/\n/g, '')
        : '<p class="text-sm text-steel">Nincs leírás ehhez a verzióhoz.</p>';

      return `
        <div class="relative pl-8 pb-8 ${i < releases.length - 1 ? 'border-l border-teal/20' : ''} ml-3">
          <div class="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full ${isLatest ? 'bg-ash glow-teal-sm' : 'bg-teal/40'} border-2 border-ink"></div>
          <div class="glass rounded-2xl p-6">
            <div class="flex items-center gap-3 mb-3 flex-wrap">
              <span class="text-lg font-bold">${release.tag_name}</span>
              ${isLatest ? '<span class="text-[10px] font-bold uppercase tracking-wider bg-ash/20 text-ash px-2 py-0.5 rounded-full">Legújabb</span>' : ''}
              <span class="text-xs text-steel ml-auto">${formatDate(release.published_at || release.created_at)}</span>
            </div>
            ${release.name && release.name !== release.tag_name ? `<p class="text-sm text-steel-light mb-3">${escapeHtml(release.name)}</p>` : ''}
            <div class="space-y-1">${body}</div>
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = html;
}

// ─── Escape HTML to prevent XSS ───
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Init ───
loadReleases();
