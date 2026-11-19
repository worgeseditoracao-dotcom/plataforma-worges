const hero = document.querySelector('.hero');
const motion = document.querySelector('.hero-motion');
const heroImages = ['heroCoverLeft', 'heroCoverMain', 'heroCoverRight'].map(id => document.getElementById(id));
const heroTitle = document.getElementById('heroBookTitle');
const heroMeta = document.getElementById('heroBookMeta');
const heroCounter = document.getElementById('heroCounter');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let heroBooks = [];
let currentBook = 0;
let heroTimer;
let swapTimer;

function sourceImage(url) {
  // Wix's detail-page thumbnails are 285px wide; use their original media file in the hero.
  return url.split('/v1/')[0];
}

function renderHero(index, animate = true) {
  if (!heroBooks.length) return;
  currentBook = (index + heroBooks.length) % heroBooks.length;
  clearTimeout(swapTimer);
  if (animate && !reduceMotion.matches) motion.classList.add('is-changing');
  swapTimer = setTimeout(() => {
    // All catalogued covers take a turn in the main position, including collections.
    [heroBooks[(currentBook + 1) % heroBooks.length], heroBooks[currentBook], heroBooks[(currentBook + 2) % heroBooks.length]]
      .forEach((book, i) => { heroImages[i].src = sourceImage(book.cover); });
    const book = heroBooks[currentBook];
    heroTitle.textContent = book.title;
    heroMeta.textContent = `${book.kind === 'coletanea' ? 'Coletânea' : 'Livro'} · ${book.year}`;
    heroCounter.textContent = `${String(currentBook + 1).padStart(2, '0')} / ${String(heroBooks.length).padStart(2, '0')}`;
    motion.classList.remove('is-changing');
  }, animate && !reduceMotion.matches ? 360 : 0);
}

function startHero() {
  clearInterval(heroTimer);
  if (reduceMotion.matches || !heroBooks.length) return;
  heroTimer = setInterval(() => {
    if (!document.hidden && !hero.matches(':hover') && !hero.contains(document.activeElement)) renderHero(currentBook + 1);
  }, 5500);
}

fetch("https://rraitizanntzdurqdqkm.supabase.co/rest/v1/catalogo_publicado?select=*&order=date.desc.nullslast,id.asc", { headers: { apikey: "sb_publishable_VvOy5B3haLBPS7sIyfZ9gg_bHiBRbiy" }, cache: "no-store" }).then(response => {
  if (!response.ok) throw new Error('Acervo indisponível');
  return response.json();
}).then(books => {
  heroBooks = books.filter(book => book.cover).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  renderHero(0, false);
  startHero();
}).catch(() => { heroCounter.textContent = 'Conheça o acervo'; });

document.getElementById('heroPrev').addEventListener('click', () => { renderHero(currentBook - 1); startHero(); });
document.getElementById('heroNext').addEventListener('click', () => { renderHero(currentBook + 1); startHero(); });
reduceMotion.addEventListener?.('change', startHero);

const menuButton = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  mainNav.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  mainNav.classList.toggle('is-open', open);
});
mainNav.addEventListener('click', event => { if (event.target.closest('a,button')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
