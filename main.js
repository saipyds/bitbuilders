/* ═══════════════════════════════════════════
   BITBUILDERS — MAIN SCRIPT
   Reads games.json → builds cards → filter → modal / lightbox
═══════════════════════════════════════════ */

'use strict';

// ── Placeholder colours per card (cycles if more than 10) ──
const CARD_COLORS = [
  '#0f2d1a', // dark green
  '#1a0f2d', // dark purple
  '#2d1a0f', // dark orange
  '#0f1a2d', // dark blue
  '#2d0f1a', // dark red
  '#1a2d0f', // olive
  '#0f2d2d', // dark teal
  '#2d2d0f', // dark yellow-green
  '#1a0f0f', // dark maroon
  '#0f0f2d', // dark navy
  '#2d1a1a', // dark brick
  '#1a1a0f', // dark moss
  '#0f2d1f', // dark emerald
];

const CARD_ACCENT = [
  '#6fcf00', '#a78bfa', '#fb923c', '#4fc3f7',
  '#ff4f4f', '#84cc16', '#22d3ee', '#ffd966',
  '#f472b6', '#38bdf8', '#ef4444', '#bef264',
  '#34d399',
];

// ── DOM refs ──
const grid          = document.getElementById('card-grid');
const emptyState    = document.getElementById('empty-state');
const filterBtns    = document.querySelectorAll('.filter-btn');
const gameCount     = document.getElementById('game-count');
const animCount     = document.getElementById('anim-count');

// Game modal
const gameBackdrop  = document.getElementById('game-backdrop');
const gameFrame     = document.getElementById('game-frame');
const modalTitle    = document.getElementById('modal-game-title');
const modalBuilder  = document.getElementById('modal-builder-name');
const closeGameBtn  = document.getElementById('close-game-modal');

// Animation lightbox
const animBackdrop  = document.getElementById('anim-backdrop');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxBuild = document.getElementById('lightbox-builder');
const closeAnimBtn  = document.getElementById('close-anim-lightbox');

// ── State ──
let allItems    = [];
let activeFilter = 'all';

// ══════════════════════════════════════════
// FETCH + BOOT
// ══════════════════════════════════════════
async function boot() {
  try {
    const res = await fetch('games.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allItems = await res.json();
  } catch (err) {
    console.error('Could not load games.json:', err);
    allItems = [];
  }

  // Update stat counters
  const games = allItems.filter(i => i.type === 'game');
  const anims = allItems.filter(i => i.type === 'animation');
  gameCount.textContent = games.length;
  animCount.textContent = anims.length;

  renderCards(allItems);
  setupFilter();
  setupModal();
  setupLightbox();
}

// ══════════════════════════════════════════
// RENDER CARDS
// ══════════════════════════════════════════
function renderCards(items) {
  // Clear existing cards
  grid.innerHTML = '';

  if (items.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  items.forEach((item, idx) => {
    const card = makeCard(item, idx);
    grid.appendChild(card);
  });
}

function makeCard(item, idx) {
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute(
    'aria-label',
    `${item.type === 'game' ? 'Play' : 'View'} ${item.title} by ${item.builder}`
  );

  const bgColor = CARD_COLORS[idx % CARD_COLORS.length];
  const accent  = CARD_ACCENT[idx % CARD_ACCENT.length];

  // ── Thumbnail ──
  const thumb = document.createElement('div');
  thumb.className = 'card-thumb';
  thumb.style.background = bgColor;
  thumb.style.borderBottom = `2px solid ${accent}`;

  if (item.type === 'animation' && item.src) {
    // Show the actual GIF
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = `${item.title} animation`;
    img.loading = 'lazy';
    thumb.appendChild(img);
  } else {
    // Coloured placeholder with title
    const label = document.createElement('div');
    label.className = 'card-thumb-label';
    label.style.color = accent;
    label.textContent = item.title;
    thumb.appendChild(label);

    // Play icon
    const playIcon = document.createElement('div');
    playIcon.className = 'play-icon';
    playIcon.setAttribute('aria-hidden', 'true');
    playIcon.textContent = '▶';
    playIcon.style.color = accent;
    thumb.appendChild(playIcon);
  }

  // ── Card body ──
  const body = document.createElement('div');
  body.className = 'card-body';

  const badge = document.createElement('span');
  badge.className = `card-type-badge badge-${item.type}`;
  badge.textContent = item.type === 'game' ? 'GAME' : 'ANIMATION';

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = item.title;

  const builder = document.createElement('p');
  builder.className = 'card-builder';
  builder.textContent = item.builder;

  body.appendChild(badge);
  body.appendChild(title);
  body.appendChild(builder);

  card.appendChild(thumb);
  card.appendChild(body);

  // ── Click / keyboard handler ──
  const open = () => {
    if (item.type === 'game') openGame(item);
    else openAnimation(item);
  };

  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  return card;
}

// ══════════════════════════════════════════
// FILTER
// ══════════════════════════════════════════
function setupFilter() {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      if (filter === activeFilter) return;

      // Update active state
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeFilter = filter;

      // Filter items
      const filtered = filter === 'all'
        ? allItems
        : allItems.filter(i => i.type === filter);

      renderCards(filtered);
    });
  });
}

// ══════════════════════════════════════════
// GAME MODAL
// ══════════════════════════════════════════
function openGame(item) {
  modalTitle.textContent  = item.title;
  modalBuilder.textContent = `by ${item.builder}`;
  gameFrame.src = item.path + '/index.html';
  gameBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  closeGameBtn.focus();
}

function closeGame() {
  gameBackdrop.hidden = true;
  // Stop the game by clearing src
  gameFrame.src = 'about:blank';
  document.body.style.overflow = '';
}

function setupModal() {
  closeGameBtn.addEventListener('click', closeGame);

  // Close on backdrop click (outside modal shell)
  gameBackdrop.addEventListener('click', (e) => {
    if (e.target === gameBackdrop) closeGame();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!gameBackdrop.hidden) closeGame();
      if (!animBackdrop.hidden) closeAnimation();
    }
  });
}

// ══════════════════════════════════════════
// ANIMATION LIGHTBOX
// ══════════════════════════════════════════
function openAnimation(item) {
  lightboxImg.src     = item.src;
  lightboxImg.alt     = `${item.title} animation`;
  lightboxTitle.textContent  = item.title;
  lightboxBuild.textContent  = `by ${item.builder}`;
  animBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  closeAnimBtn.focus();
}

function closeAnimation() {
  animBackdrop.hidden = true;
  lightboxImg.src = '';
  document.body.style.overflow = '';
}

function setupLightbox() {
  closeAnimBtn.addEventListener('click', closeAnimation);

  animBackdrop.addEventListener('click', (e) => {
    if (e.target === animBackdrop) closeAnimation();
  });
}

// ══════════════════════════════════════════
// START
// ══════════════════════════════════════════
boot();