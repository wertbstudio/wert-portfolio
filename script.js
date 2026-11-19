(() => {
  'use strict';
  const grid = document.querySelector('#project-grid');
  const projects = typeof PROJECTS !== 'undefined' ? PROJECTS : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const safeURL = (value) => {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; }
    catch { return null; }
  };
  function createPreview(project) {
    const href = safeURL(project.url);
    const preview = element(href ? 'a' : 'div', 'project-preview');
    preview.dataset.project = project.id;
    if (href) {
      preview.href = href;
      preview.target = '_blank';
      preview.rel = 'noopener noreferrer';
      preview.setAttribute('aria-label', `Открыть сайт ${project.title} (в новой вкладке)`);
    }
    preview.style.setProperty('--project-accent', /^#[0-9a-f]{6}$/i.test(project.accent) ? project.accent : '#6366f1');
    const fallback = element('div', 'preview-fallback');
    fallback.setAttribute('aria-hidden', 'true');
    const browser = element('div', `mock-browser mock-${['dentapro', 'forma', 'industry'].includes(project.id) ? project.id : 'dentapro'}`);
    const bar = element('div', 'browser-bar');
    for (let i = 0; i < 3; i++) bar.append(element('i'));
    bar.append(element('span', '', safeURL(project.url) ? new URL(project.url).hostname : 'website'));
    const site = element('div', 'mock-site');
    site.append(element('div', 'mock-logo', project.title), element('div', 'mock-nav', 'О нас   Услуги   Контакты'));
    const headings = { dentapro: 'Ваша улыбка. Наша забота.', forma: 'Пространство для жизни.', industry: 'Детейлинг без компромиссов.' };
    site.append(element('div', 'mock-heading', headings[project.id] || project.subtitle), element('div', 'mock-caption', project.subtitle), element('div', 'mock-button', 'Узнать больше'), element('div', 'mock-shape'));
    browser.append(bar, site);
    fallback.append(browser);
    preview.append(fallback);
    if (project.image && /^(?:\.\/)?assets\/[\w./-]+\.(?:png|jpe?g|webp|avif)$/i.test(project.image) && !project.image.includes('..')) {
      const image = element('img');
      image.alt = `Скриншот сайта ${project.title}`;
      image.loading = 'lazy'; image.decoding = 'async';
      image.addEventListener('load', () => { preview.classList.add('has-screenshot'); fallback.hidden = true; }, { once: true });
      image.addEventListener('error', () => image.remove(), { once: true });
      image.src = project.image;
      preview.append(image);
    }
    return preview;
  }
  function renderProjects(category = 'all') {
    const filtered = projects.filter(p => category === 'all' || p.category === category);
    grid.replaceChildren();
    for (const project of filtered) {
      const card = element('article', 'project-card');
      const body = element('div', 'project-body');
      const content = element('div', 'project-content');
      content.append(element('span', 'project-category', project.category));
      const titleRow = element('div', 'project-title-row');
      titleRow.append(element('h3', '', project.title), element('span', 'project-number', String(projects.indexOf(project) + 1).padStart(2, '0')));
      content.append(titleRow, element('p', 'project-subtitle', project.subtitle), element('p', 'project-description', project.description), element('p', 'project-benefit', project.benefit));
      const tags = element('div', 'tags');
      (project.tags || []).forEach(tag => tags.append(element('span', 'tag', tag)));
      content.append(tags);
      body.append(content);
      const href = safeURL(project.url);
      if (href) {
        const link = element('a', 'project-link', 'Открыть живой сайт');
        link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `Открыть живой сайт ${project.title} (в новой вкладке)`);
        const arrow = element('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true'); link.append(arrow);
        body.append(link);
      }
      card.append(createPreview(project), body); grid.append(card);
    }
    if (!filtered.length) grid.append(element('p', 'empty-state', 'В этой категории скоро появятся новые проекты.'));
    document.querySelector('#filter-status').textContent = `Показано проектов: ${filtered.length}`;
  }
  document.querySelector('#project-count').textContent = projects.length;
  document.querySelector('#filter-count').textContent = projects.length;
  document.querySelector('#year').textContent = new Date().getFullYear();
  renderProjects();
  document.querySelector('.hero-actions a[href="#projects"]').addEventListener('click', event => {
    // Прокручиваем к самому заголовку, минуя верхний отступ секции и надпись «Портфолио».
    event.preventDefault();
    const heading = document.querySelector('#projects h2');
    heading.closest('.reveal')?.classList.add('visible');
    window.scrollTo({
      top: Math.max(0, window.scrollY + heading.getBoundingClientRect().top - 27),
      behavior: reduceMotion ? 'instant' : 'smooth',
    });
  });
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    renderProjects(button.dataset.filter);
  }));
  document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => { document.querySelector('#site-type').value = link.dataset.service; }));
  const menu = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); mobileNav.hidden = true; }
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); mobileNav.hidden = !open; });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => { if (!e.target.closest('.header')) closeMenu(); });
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
    document.documentElement.classList.add('js-reveal');
    document.querySelectorAll('.reveal').forEach(node => observer.observe(node));
  }
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(button => {
      button.addEventListener('pointermove', e => { const rect = button.getBoundingClientRect(); button.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * .12}px, ${(e.clientY - rect.top - rect.height / 2) * .18}px)`; });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('#form-status');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type=submit]');
    if (button.disabled) return;
    const data = Object.fromEntries(new FormData(form));
    const contact = data.contact.trim();
    if (!/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact) && !/^https:\/\/t\.me\/[a-zA-Z][a-zA-Z0-9_]{4,31}\/?$/.test(contact) && !(/^\+?[\d\s().-]+$/.test(contact) && contact.replace(/\D/g, '').length >= 10 && contact.replace(/\D/g, '').length <= 15)) {
      status.dataset.state = 'error'; status.textContent = 'Укажите телефон с кодом страны или Telegram в формате @username.'; document.querySelector('#contact-input').focus(); return;
    }
    button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = 'Отправляем заявку…';
    status.textContent = ''; status.dataset.state = '';
    try {
      const response = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Не удалось отправить заявку. Попробуйте позже или напишите @wertbst в Telegram.');
      status.dataset.state = 'success'; status.textContent = 'Заявка отправлена! Свяжусь с вами по указанному контакту.'; form.reset();
    } catch (error) {
      status.dataset.state = 'error'; status.textContent = ['TimeoutError', 'AbortError'].includes(error.name) ? 'Ответ задерживается. Чтобы уточнить получение заявки, напишите @wertbst в Telegram.' : error.message;
    } finally {
      button.disabled = false; button.removeAttribute('aria-busy'); button.replaceChildren(document.createTextNode('Обсудить мой проект '), element('span', '', '↗'));
    }
  });
})();
