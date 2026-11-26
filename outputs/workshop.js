const chapters = Array.from(document.querySelectorAll('.chapter'));
const photos = Array.from(document.querySelectorAll('.project-stack img'));
const projectNumber = document.querySelector('#project-number');
const wideMotion = matchMedia('(min-width:950px) and (prefers-reduced-motion:no-preference)');
document.documentElement.classList.add('enhanced');

let scheduled = false;
let current = 0;
function updateProject() {
  scheduled = false;
  if (!wideMotion.matches) return;
  const readingLine = innerHeight * 0.53;
  let next = 0;
  chapters.forEach((chapter, index) => {
    if (chapter.getBoundingClientRect().top <= readingLine) next = index;
  });
  if (next === current) return;
  photos[current].classList.remove('active');
  photos[next].classList.add('active');
  projectNumber.textContent = String(next + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
  projectNumber.parentElement.style.setProperty('--chapter', next + 1);
  current = next;
}
function scheduleUpdate() {
  if (!scheduled && wideMotion.matches) {
    scheduled = true;
    requestAnimationFrame(updateProject);
  }
}
addEventListener('scroll', scheduleUpdate, { passive: true });
addEventListener('resize', scheduleUpdate, { passive: true });
wideMotion.addEventListener('change', scheduleUpdate);
scheduleUpdate();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.2 });
  document.querySelectorAll('.section-head, .contact-section h2').forEach(element => observer.observe(element));
}

const siteMenu = document.querySelector('#site-menu');
const menuTrigger = siteMenu.querySelector('.menu-trigger');
const menuCaption = menuTrigger.querySelector('.menu-trigger-caption');
const menuPanel = siteMenu.querySelector('.menu-panel');
const menuBackdrop = document.querySelector('.menu-backdrop');
const hoverCapable = matchMedia('(hover: hover) and (pointer: fine)');
let menuPinned = false;
let menuHovered = false;

function updateMenu() {
  const open = menuPinned || menuHovered;
  siteMenu.classList.toggle('is-open', open);
  siteMenu.classList.toggle('is-pinned', menuPinned);
  menuBackdrop.classList.toggle('is-visible', open);
  menuTrigger.setAttribute('aria-expanded', String(open));
  menuTrigger.setAttribute('aria-label', menuPinned ? 'Закрыть меню' : menuHovered ? 'Закрепить меню' : 'Открыть меню');
  menuCaption.textContent = menuPinned ? 'ЗАКРЫТЬ' : 'МЕНЮ';
  menuPanel.setAttribute('aria-hidden', String(!open));
  menuPanel.inert = !open;
  menuBackdrop.setAttribute('aria-hidden', String(!open));
  menuBackdrop.tabIndex = open ? 0 : -1;
}

menuTrigger.addEventListener('click', () => {
  menuPinned = !menuPinned;
  menuHovered = false;
  updateMenu();
});

siteMenu.addEventListener('pointerenter', () => {
  if (hoverCapable.matches && !menuPinned) {
    menuHovered = true;
    updateMenu();
  }
});

siteMenu.addEventListener('pointerleave', () => {
  if (!menuPinned) {
    menuHovered = false;
    updateMenu();
  }
});

function closeMenu() {
  menuPinned = false;
  menuHovered = false;
  updateMenu();
}

menuBackdrop.addEventListener('click', () => {
  closeMenu();
  menuTrigger.focus({ preventScroll: true });
});

menuPanel.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    closeMenu();
    menuTrigger.focus({ preventScroll: true });
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && siteMenu.classList.contains('is-open')) {
    closeMenu();
    menuTrigger.focus({ preventScroll: true });
  }
});

hoverCapable.addEventListener('change', () => {
  menuHovered = false;
  updateMenu();
});

updateMenu();

const workflowList = document.querySelector('.workflow-steps');
const workflowSteps = Array.from(workflowList.querySelectorAll('.workflow-step'));
function sizeWorkflowTrack() {
  const narrow = matchMedia('(max-width: 800px)').matches;
  const first = workflowSteps[0];
  const last = workflowSteps.at(-1);
  const distance = narrow ? last.offsetTop - first.offsetTop : last.offsetLeft - first.offsetLeft;
  workflowList.style.setProperty(narrow ? '--track-height' : '--track-width', `${distance}px`);
  updateWorkflowLine();
}
function updateWorkflowLine() {
  const narrow = matchMedia('(max-width: 800px)').matches;
  const firstTop = workflowSteps[0].getBoundingClientRect().top + 17;
  const lastTop = workflowSteps.at(-1).getBoundingClientRect().top + 17;
  const raw = narrow
    ? (innerHeight * .65 - firstTop) / Math.max(1, lastTop - firstTop)
    : (innerHeight * .82 - firstTop) / Math.max(1, innerHeight * .44);
  const progress = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : Math.max(0, Math.min(1, raw));
  workflowList.style.setProperty('--line-progress', progress);
}
let workflowLineQueued = false;
addEventListener('scroll', () => {
  if (workflowLineQueued) return;
  workflowLineQueued = true;
  requestAnimationFrame(() => { workflowLineQueued = false; updateWorkflowLine(); });
}, { passive: true });
addEventListener('resize', sizeWorkflowTrack, { passive: true });
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateWorkflowLine);
new ResizeObserver(sizeWorkflowTrack).observe(workflowList);
sizeWorkflowTrack();

const serviceDetails = Array.from(document.querySelectorAll('.service-list details'));
serviceDetails.forEach(activeDetail => {
  activeDetail.addEventListener('toggle', () => {
    if (activeDetail.open) serviceDetails.forEach(otherDetail => {
      if (otherDetail !== activeDetail) otherDetail.open = false;
    });
  });
});

const serviceSection = document.querySelector('#services');
const serviceStage = document.querySelector('#service-stage');
const servicePosition = document.querySelector('#service-position');
const serviceCards = serviceDetails.map((detail, index) => {
  const card = document.createElement('article');
  card.className = 'service-card';
  card.setAttribute('role', 'button');

  const top = document.createElement('div');
  top.className = 'service-card-top';
  const number = document.createElement('span');
  number.className = 'service-card-number';
  number.textContent = `${String(index + 1).padStart(2, '0')} / ${String(serviceDetails.length).padStart(2, '0')}`;
  const drawing = detail.querySelector('.service-figure').cloneNode(true);
  drawing.setAttribute('class', 'service-card-drawing');
  top.append(number, drawing);

  const title = document.createElement('h3');
  title.id = `service-card-title-${index}`;
  title.textContent = detail.querySelector('.service-label').textContent;
  const description = document.createElement('p');
  description.id = `service-card-description-${index}`;
  description.textContent = detail.querySelector(':scope > p').textContent;
  card.setAttribute('aria-labelledby', title.id);
  card.setAttribute('aria-describedby', description.id);
  const workLabel = document.createElement('span');
  workLabel.className = 'service-work-label';
  workLabel.textContent = 'ВЫПОЛНЯЕМ';
  const workList = document.createElement('ul');
  detail.querySelectorAll('li').forEach(item => {
    const workItem = document.createElement('li');
    workItem.textContent = item.textContent;
    workList.append(workItem);
  });
  card.append(top, title, description, workLabel, workList);
  card.addEventListener('click', () => setActiveService(index));
  serviceStage.append(card);
  return card;
});

let activeService = 0;
function setActiveService(index) {
  activeService = (index + serviceCards.length) % serviceCards.length;
  serviceCards.forEach((card, cardIndex) => {
    let position = (cardIndex - activeService + serviceCards.length) % serviceCards.length;
    if (position > serviceCards.length / 2) position -= serviceCards.length;
    const distance = Math.abs(position);
    card.style.setProperty('--position', position);
    card.style.setProperty('--card-rotate', position === 0 ? '0deg' : position < 0 ? '-3deg' : '3deg');
    card.style.setProperty('--card-y', position === 0 ? '-12px' : position % 2 ? '12px' : '-2px');
    card.style.setProperty('--card-scale', position === 0 ? '1' : '.94');
    card.style.zIndex = String(10 - distance);
    card.classList.toggle('is-active', position === 0);
    card.tabIndex = distance <= 1 ? 0 : -1;
    card.inert = distance > 1;
    card.setAttribute('aria-hidden', String(distance > 1));
    card.setAttribute('aria-pressed', String(position === 0));
  });
  servicePosition.textContent = `${String(activeService + 1).padStart(2, '0')} / ${String(serviceCards.length).padStart(2, '0')}`;
}

document.querySelector('#service-prev').addEventListener('click', () => setActiveService(activeService - 1));
document.querySelector('#service-next').addEventListener('click', () => setActiveService(activeService + 1));
serviceStage.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  setActiveService(activeService + (event.key === 'ArrowRight' ? 1 : -1));
  serviceCards[activeService].focus();
});
let serviceTouch = null;
let suppressServiceClickUntil = 0;
serviceStage.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse') return;
  serviceTouch = { x: event.clientX, y: event.clientY };
});
serviceStage.addEventListener('pointerup', event => {
  if (!serviceTouch) return;
  const dx = event.clientX - serviceTouch.x;
  const dy = event.clientY - serviceTouch.y;
  serviceTouch = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    suppressServiceClickUntil = Date.now() + 400;
    setActiveService(activeService + (dx < 0 ? 1 : -1));
  }
});
serviceStage.addEventListener('pointercancel', () => { serviceTouch = null; });
serviceStage.addEventListener('click', event => {
  if (Date.now() < suppressServiceClickUntil) { event.preventDefault(); event.stopPropagation(); }
}, true);
setActiveService(0);
serviceSection.classList.add('services-ready');

const reviewForm = document.querySelector('#review-form');
const reviewsList = document.querySelector('#reviews-list');
const reviewsCount = document.querySelector('#reviews-count');
const reviewStatus = document.querySelector('#review-status');
const reviewNav = document.querySelector('#review-nav');
const reviewPosition = document.querySelector('#review-position');
let reviewItems = [];
let activeReview = 0;

function showReview(index) {
  if (!reviewItems.length) return;
  activeReview = (index + reviewItems.length) % reviewItems.length;
  reviewItems.forEach((item, itemIndex) => {
    let position = (itemIndex - activeReview + reviewItems.length) % reviewItems.length;
    if (position > reviewItems.length / 2) position -= reviewItems.length;
    if (reviewItems.length === 2 && itemIndex !== activeReview) position = itemIndex < activeReview ? -1 : 1;
    const distance = Math.abs(position);
    item.style.setProperty('--review-position', position);
    item.style.setProperty('--review-rotate', position === 0 ? '0deg' : position < 0 ? '-3deg' : '3deg');
    item.style.setProperty('--review-scale', position === 0 ? '1' : '.94');
    item.style.zIndex = String(10 - distance);
    item.classList.toggle('is-current', position === 0);
    item.tabIndex = distance <= 1 ? 0 : -1;
    item.inert = distance > 1;
    item.setAttribute('aria-hidden', String(distance > 1));
    item.setAttribute('aria-pressed', String(position === 0));
  });
  reviewPosition.textContent = `${String(activeReview + 1).padStart(2, '0')} / ${String(reviewItems.length).padStart(2, '0')}`;
}

document.querySelector('#review-prev').addEventListener('click', () => showReview(activeReview - 1));
document.querySelector('#review-next').addEventListener('click', () => showReview(activeReview + 1));

function renderReviews(reviews) {
  reviewsList.replaceChildren();
  reviewsCount.textContent = String(reviews.length).padStart(2, '0');
  reviewsList.classList.toggle('has-reviews', reviews.length > 0);
  reviewNav.hidden = reviews.length < 2;
  if (!reviews.length) {
    const empty = document.createElement('p');
    empty.className = 'reviews-empty';
    empty.textContent = 'Пока нет опубликованных отзывов. Если вы уже работали с нами, поделитесь впечатлением.';
    reviewsList.append(empty);
    reviewItems = [];
    return;
  }
  reviewItems = reviews.map(review => {
    const item = document.createElement('article');
    item.className = 'review-item';
    item.setAttribute('role', 'button');
    const head = document.createElement('div');
    head.className = 'review-item-head';
    const name = document.createElement('h3');
    name.textContent = review.name;
    const rating = document.createElement('span');
    rating.className = 'review-rating';
    rating.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    rating.setAttribute('aria-label', `Оценка: ${review.rating} из 5`);
    const body = document.createElement('p');
    body.textContent = review.text;
    const date = document.createElement('time');
    date.dateTime = review.date;
    date.textContent = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(review.date));
    head.append(name, rating);
    item.append(head, body, date);
    item.addEventListener('click', () => showReview(reviewItems.indexOf(item)));
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showReview(reviewItems.indexOf(item)); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showReview(activeReview + (event.key === 'ArrowRight' ? 1 : -1)); reviewItems[activeReview].focus(); }
    });
    reviewsList.append(item);
    return item;
  });
  showReview(0);
}

async function loadReviews() {
  try {
    const response = await fetch('/api/reviews');
    if (!response.ok) throw new Error();
    const data = await response.json();
    renderReviews(data.reviews);
  } catch {
    reviewStatus.textContent = 'Отзывы доступны при запуске сайта через сервер.';
  }
}

reviewForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = reviewForm.querySelector('button[type="submit"]');
  const data = new FormData(reviewForm);
  button.disabled = true;
  reviewStatus.textContent = 'Публикуем отзыв…';
  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.get('name'), rating: data.get('rating'), text: data.get('text') })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось опубликовать отзыв.');
    reviewForm.reset();
    reviewStatus.textContent = 'Спасибо! Ваш отзыв опубликован.';
    await loadReviews();
  } catch (error) {
    reviewStatus.textContent = location.protocol === 'file:' ? 'Для публикации откройте сайт через сервер.' : error.message;
  } finally {
    button.disabled = false;
  }
});

loadReviews();
