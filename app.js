/* Sabaq MVP — one record per lesson drives packages, debts, parent view and payroll.
   No server: state lives in localStorage, demo data is generated relative to today.
   Roles: owner (#/o/...), teacher (#/t), parent (#/p), public catalogue (#/catalog). */
(function () {
'use strict';

/* ------------------------------------------------------------------ utils */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => Math.round(n).toLocaleString('ru-RU') + ' ₸';
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
const T = iso(TODAY);
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS1 = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const DOWF = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const fdate = s => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const fdow = s => { const d = parse(s); return `${DOW[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const rel = s => s === T ? 'сегодня' : s === iso(addDays(TODAY, -1)) ? 'вчера' : s === iso(addDays(TODAY, 1)) ? 'завтра' : fdow(s);
const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const hhmm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('');
const uid = p => p + Math.random().toString(36).slice(2, 8);
const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
const lessonsWord = n => `${n} ${plural(Math.abs(n), 'занятие', 'занятия', 'занятий')}`;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ------------------------------------------------------------------ icons (stroke, 20px) */
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 4.15a3.5 3.5 0 0 1 0 6.7',
  cal: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19zM4 10h16M8 3v4M16 3v4',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5M16 14.5h.01',
  store: 'M4 9.5 5.5 4h13L20 9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5 11.5V20h14v-8.5M10 20v-5h4v5',
  out: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
  check: 'M5 12.5 10 17l9-10',
  x: 'M6 6l12 12M18 6 6 18',
  alert: 'M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18',
  chev: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  up: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  down: 'M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 20.5a7 7 0 0 1 14 0',
  book: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2',
  coins: 'M9 10a5 2.5 0 1 0 0-.01M4 10v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4M10 6.5c.9-.6 2.4-1 4-1 2.8 0 5 1.1 5 2.5v4c0 1.2-1.6 2.2-3.8 2.4',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  reset: 'M4 12a8 8 0 1 0 2.3-5.6L4 8.5M4 4v4.5h4.5',
  teacher: 'M3 5h18v11H3zM8 20h8M12 16v4M7 9h6M7 12h4',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;

/* ------------------------------------------------------------------ demo data */
const KEY = 'sabaq-mvp-v1';
function seed() {
  const rnd = mulberry(20261120);
  const pick = a => a[Math.floor(rnd() * a.length)];
  const teachers = [
    { id: 't1', name: 'Айгерим Нурланова', subject: 'Математика', rate: 12000 },
    { id: 't2', name: 'Данияр Сейтказы', subject: 'Английский', rate: 14000 },
    { id: 't3', name: 'Тимур Ахметов', subject: 'Программирование', rate: 13000 },
    { id: 't4', name: 'Сауле Жумабаева', subject: 'Подготовка к НИШ', rate: 10000 },
  ];
  const rooms = [{ id: 'r1', name: 'Аудитория 1' }, { id: 'r2', name: 'Аудитория 2' }, { id: 'r3', name: 'Аудитория 3' }, { id: 'r4', name: 'Компьютерный класс' }];
  const groups = [
    { id: 'g1', name: 'ЕНТ: математика, вечерняя', subject: 'ЕНТ', teacherId: 't1', roomId: 'r1', slots: [{ dow: 1, start: '18:00', dur: 90 }, { dow: 3, start: '18:00', dur: 90 }, { dow: 5, start: '18:00', dur: 90 }], capacity: 12, pkgLessons: 12, pkgPrice: 36000, age: '11 класс' },
    { id: 'g2', name: 'ЕНТ: математика, субботняя', subject: 'ЕНТ', teacherId: 't1', roomId: 'r1', slots: [{ dow: 6, start: '10:00', dur: 120 }], capacity: 10, pkgLessons: 4, pkgPrice: 16000, age: '10–11 класс' },
    { id: 'g3', name: 'IELTS 6.5', subject: 'Английский', teacherId: 't2', roomId: 'r2', slots: [{ dow: 2, start: '19:00', dur: 90 }, { dow: 4, start: '19:00', dur: 90 }], capacity: 8, pkgLessons: 8, pkgPrice: 40000, age: 'от 15 лет' },
    { id: 'g4', name: 'English Kids', subject: 'Английский', teacherId: 't2', roomId: 'r2', slots: [{ dow: 1, start: '16:00', dur: 60 }, { dow: 3, start: '16:00', dur: 60 }], capacity: 10, pkgLessons: 8, pkgPrice: 28000, age: '7–10 лет' },
    { id: 'g5', name: 'Python для детей', subject: 'Программирование', teacherId: 't3', roomId: 'r4', slots: [{ dow: 2, start: '16:30', dur: 90 }, { dow: 4, start: '16:30', dur: 90 }], capacity: 10, pkgLessons: 8, pkgPrice: 32000, age: '10–14 лет' },
    { id: 'g6', name: 'Подготовка к НИШ', subject: 'НИШ', teacherId: 't4', roomId: 'r3', slots: [{ dow: 1, start: '15:00', dur: 90 }, { dow: 3, start: '15:00', dur: 90 }, { dow: 5, start: '15:00', dur: 90 }], capacity: 12, pkgLessons: 12, pkgPrice: 33000, age: '5–6 класс' },
  ];
  const kids = ['Арман Касымов', 'Алия Серикова', 'Данияр Омаров', 'Мадина Ахметова', 'Ерасыл Жаксылыков', 'Айша Тлеубаева', 'Нурсултан Бекенов', 'Камила Исаева', 'Тимур Ли',
    'Дана Мухамеджанова', 'Санжар Абдрахманов', 'Аружан Калиева', 'Ильяс Нургалиев', 'Жансая Оспанова', 'Алихан Сулейменов', 'Томирис Байжанова', 'Олжас Каримов', 'Сабина Ким',
    'Рамазан Есенов', 'Айым Жумагулова', 'Максим Петров', 'Зарина Ахмедова', 'Бекзат Турсунов', 'Асель Нуртаева', 'Диас Мамыров', 'Амина Жунусова', 'Ерлан Сапаров', 'Карина Цой',
    'Нурлан Абенов', 'Медина Кенжебаева', 'Адиль Рахимов', 'Аяна Утепова', 'Темирлан Иманов', 'Софья Пак', 'Арсен Бакытов', 'Динара Ержанова', 'Мирас Ахметжанов', 'Инкар Садыкова'];
  const split = [['g1', 9], ['g2', 6], ['g3', 6], ['g4', 7], ['g5', 6], ['g6', 4]];
  const moms = ['Гульнара', 'Сауле', 'Айгуль', 'Жанна', 'Асем', 'Динара', 'Ольга', 'Мариям'];
  const dads = ['Ержан', 'Марат', 'Бауыржан', 'Нурлан', 'Серик', 'Андрей'];
  const parentOf = full => {
    const sur = full.split(' ')[1]; const mom = rnd() < 0.7;
    const male = /(ов|ев|ин)$/.test(sur) ? sur : sur.replace(/(ова|ева|ина)$/, m => m.slice(0, -1));
    const fem = /(ова|ева|ина)$/.test(sur) ? sur : /(ов|ев|ин)$/.test(sur) ? sur + 'а' : sur;
    return mom ? `${pick(moms)} ${fem}` : `${pick(dads)} ${male}`;
  };
  const students = []; let k = 0;
  split.forEach(([gid, n]) => { for (let i = 0; i < n; i++) { const name = kids[k++]; students.push({ id: 's' + k, name, gid, parent: parentOf(name), phone: `+7 7${pick(['01', '05', '07', '47', '77'])} ${100 + Math.floor(rnd() * 899)} ${pad(Math.floor(rnd() * 99))} ${pad(Math.floor(rnd() * 99))}`, since: iso(addDays(TODAY, -28 - Math.floor(rnd() * 200))) }); } });

  // lessons for weeks -4..+3 around today
  const monday = addDays(TODAY, -((TODAY.getDay() + 6) % 7));
  const lessons = [];
  const start = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
  for (let d = start; d < addDays(monday, 28); d = addDays(d, 1)) {
    groups.forEach(g => g.slots.forEach(sl => { if (sl.dow === d.getDay()) lessons.push(mkLesson(g, iso(d), sl)); }));
  }
  // mark the past; leave one recent lesson unmarked so the dashboard has something to flag
  const past = lessons.filter(l => l.date < T).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const leaveOpen = [...past].reverse().find(l => l.gid === 'g5');
  past.forEach(l => {
    if (l === leaveOpen) return;
    l.status = 'held';
    students.filter(s => s.gid === l.gid).forEach(s => { const r = rnd(); l.marks[s.id] = r < 0.86 ? 'p' : r < 0.93 ? 'a' : 'e'; });
  });
  // payments follow real behaviour: a parent buys the next package when the current one runs out;
  // a few families stop paying in the last weeks and fall into debt
  const payments = [];
  const lateFrom = iso(addDays(TODAY, -16));
  students.forEach(s => {
    const g = groups.find(x => x.id === s.gid);
    const late = rnd() < 0.2;
    let bal = Math.floor(rnd() * 4);
    payments.push({ id: uid('p'), sid: s.id, date: iso(start), amount: 0, lessons: bal, method: 'import' });
    const pay = d => { payments.push({ id: uid('p'), sid: s.id, date: d, amount: g.pkgPrice, lessons: g.pkgLessons, method: rnd() < 0.82 ? 'kaspi' : 'cash' }); bal += g.pkgLessons; };
    if (bal < 2) pay(iso(addDays(start, Math.floor(rnd() * 3))));
    past.filter(l => l.gid === g.id && l.status === 'held').forEach(l => {
      if (bal <= 0 && !(late && l.date >= lateFrom)) pay(iso(addDays(parse(l.date), -Math.floor(rnd() * 3))) < iso(start) ? iso(start) : iso(addDays(parse(l.date), -Math.floor(rnd() * 3))));
      const m = l.marks[s.id]; if (m === 'p' || m === 'a') bal -= 1;
    });
    if (!late && bal <= 3 && rnd() < 0.8) pay(iso(addDays(TODAY, -Math.floor(rnd() * 4))));
  });
  const leads = [{ id: uid('l'), name: 'Мама Алана, 9 лет', phone: '+7 701 555 21 40', gid: 'g4', date: iso(addDays(TODAY, -1)), status: 'new' }];
  return { v: 4, seededOn: T, center: { name: 'IQ Academy', city: 'Алматы', address: 'ул. Байзакова, 280' }, policy: { chargeAbsent: true }, teachers, rooms, groups, students, lessons, payments, leads, sent: [] };
}
function mkLesson(g, date, sl) { return { id: `${g.id}_${date}_${sl.start}`, gid: g.id, date, start: sl.start, dur: sl.dur, status: 'planned', marks: {} }; }

let S;
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  const stale = S && (TODAY - parse(S.seededOn)) / 864e5 > 6;
  if (!S || S.v !== 4 || stale) { S = seed(); save(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: keep in memory */ } }

/* ------------------------------------------------------------------ derived data (one record → everything) */
const G = id => S.groups.find(g => g.id === id);
const TCH = id => S.teachers.find(t => t.id === id);
const ROOM = id => S.rooms.find(r => r.id === id);
const STU = id => S.students.find(s => s.id === id);
const perLesson = g => g.pkgPrice / g.pkgLessons;
const charges = m => m === 'p' || (m === 'a' && S.policy.chargeAbsent);
function ledger(sid) {
  const s = STU(sid); const rows = [];
  S.payments.filter(p => p.sid === sid).forEach(p => rows.push({ date: p.date, kind: 'pay', p }));
  S.lessons.filter(l => l.gid === s.gid && l.status === 'held' && l.marks[sid]).forEach(l => rows.push({ date: l.date, kind: 'lesson', l, m: l.marks[sid] }));
  return rows.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'pay' ? -1 : 1));
}
function balance(sid) {
  let b = 0; S.payments.forEach(p => { if (p.sid === sid) b += p.lessons; });
  const s = STU(sid);
  S.lessons.forEach(l => { if (l.gid === s.gid && l.status === 'held' && charges(l.marks[sid])) b -= 1; });
  return b;
}
const debt = sid => { const b = balance(sid); return b < 0 ? -b * perLesson(G(STU(sid).gid)) : 0; };
const inMonth = (d, ref = TODAY) => d.slice(0, 7) === iso(ref).slice(0, 7);
const unmarked = () => S.lessons.filter(l => l.status === 'planned' && (l.date < T || (l.date === T && mins(l.start) + l.dur <= new Date().getHours() * 60 + new Date().getMinutes()))).sort((a, b) => a.date.localeCompare(b.date));
const groupStudents = gid => S.students.filter(s => s.gid === gid);
function payroll(ref = TODAY) {
  return S.teachers.map(t => {
    const ls = S.lessons.filter(l => l.status === 'held' && inMonth(l.date, ref) && G(l.gid).teacherId === t.id);
    return { t, n: ls.length, sum: ls.length * t.rate };
  });
}

/* ------------------------------------------------------------------ toast / modal */
let toastTimer;
function toast(msg) { const el = $('#toast'); el.innerHTML = `<span class="dot"></span>${esc(msg)}`; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200); }
let lastFocus;
function modal(html, onReady) {
  const m = $('#modal'); lastFocus = document.activeElement;
  m.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false;
  const f = m.querySelector('input,select,button:not([data-close])'); if (f) f.focus();
  onReady && onReady(m.firstElementChild);
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; lastFocus && lastFocus.focus && lastFocus.focus(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
document.addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });

/* fake but stable QR-like pattern (demo: real Kaspi QR needs a merchant contract) */
function qrSvg(text) {
  const n = 25, r = mulberry([...text].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)); let cells = '';
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#0F3355"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#0F3355"/>`;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    if (!inF && r() < 0.48) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" role="img" aria-label="QR-код для оплаты"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#0F3355">${cells}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
}

/* ------------------------------------------------------------------ router */
const routes = [];
const route = (re, fn) => routes.push([re, fn]);
function render() {
  const h = location.hash.slice(1) || '/';
  for (const [re, fn] of routes) { const m = h.match(re); if (m) { document.getElementById('app').innerHTML = fn(...m.slice(1)); window.scrollTo(0, 0); after.forEach(f => f()); after = []; return; } }
  location.hash = '/';
}
let after = [];
window.addEventListener('hashchange', render);

/* ------------------------------------------------------------------ login */
route(/^\/$/, () => `
<div class="lp">
  <header class="lp-top"><div class="lp-in">
    <a href="#/" class="brand"><img class="mk" src="icons/mark.svg" alt=""><img src="img/logo_sabaq.png" alt="Sabaq"></a>
    <nav class="lp-nav"><a href="#how" data-scroll>Как работает</a><a href="#roles" data-scroll>Кабинеты</a><a href="#price" data-scroll>Цена</a><a href="#/catalog">Каталог мест</a></nav>
    <a class="btn" href="#roles" data-scroll>Войти в демо</a>
  </div></header>

  <section class="lp-hero">
    <div class="lp-in">
      <p class="lp-kicker"><span class="dot"></span>Учёт для частных учебных центров Казахстана</p>
      <h1>Каждый урок посчитан.</h1>
      <p class="lp-lead">Преподаватель отмечает урок — Sabaq сам списывает занятие с абонемента, показывает долг, сообщает родителю и начисляет зарплату. Без вечерней сверки Excel и Kaspi.</p>
      <div class="lp-cta"><a class="btn lg" href="#roles" data-scroll>Открыть демо</a><a class="btn lg ghost" href="#/catalog">Свободные места</a></div>
    </div>
    <div class="lp-stage"><figure class="lp-shot"><img src="img/dashboard.jpg" alt="Главная владельца в Sabaq: оплаты, долги и уроки, которые нужно отметить" width="1800" height="1125"></figure></div>
  </section>

  <section class="lp-facts"><div class="lp-in">
    <div><b>&lt;&nbsp;0,3&nbsp;%</b><span>несписанных уроков — цель пилотов (сейчас в центрах 1–2&nbsp;%)</span></div>
    <div><b>10&nbsp;секунд</b><span>чтобы отметить урок с телефона — все «пришли» по умолчанию</span></div>
    <div><b>0&nbsp;споров</b><span>о зарплате: она считается из тех же отметок, что и списания</span></div>
  </div></section>

  <section class="lp-how" id="how"><div class="lp-in">
    <h2>Одно нажатие — пять результатов</h2>
    <p class="lp-sub">Так выглядит урок в Sabaq. Раньше это пять разных мест: тетрадь, Excel, Kaspi, WhatsApp и расчёт зарплаты.</p>
    <ol class="lp-steps">
      <li><span class="n">1</span><b>Урок отмечен</b><span>Преподаватель нажимает «Урок проведён» — только отсутствующих надо отметить отдельно.</span></li>
      <li><span class="n">2</span><b>Абонементы списаны</b><span>Пропуск по уважительной переносится, без причины — по правилу центра.</span></li>
      <li><span class="n">3</span><b>Долг виден сразу</b><span>Если занятия закончились, владелец видит сумму и шлёт напоминание.</span></li>
      <li><span class="n">4</span><b>Родитель в курсе</b><span>В кабинете — остаток занятий и оплата через Kaspi QR в два касания.</span></li>
      <li><span class="n">5</span><b>Зарплата начислена</b><span>Урок × ставка, по каждому преподавателю, с выгрузкой в файл.</span></li>
    </ol>
  </div></section>

  <section class="lp-roles" id="roles"><div class="lp-in">
    <h2>Кабинет для каждого</h2>
    <p class="lp-sub">Демо-центр «${esc(S.center.name)}», ${esc(S.center.city)}. Пароль не нужен — выберите, кем войти.</p>
    <div class="lp-grid">
      <a class="lp-role main" href="#/o/home"><span class="ic">${ic('home', 22)}</span><b>Владелец центра</b><span>Оплаты, долги, расписание, зарплаты и всё, что требует внимания.</span><em>Открыть кабинет ${ic('chev', 14)}</em></a>
      <a class="lp-role" href="#/t/today"><span class="ic">${ic('teacher', 22)}</span><b>Преподаватель</b><span>Отметка урока, мои занятия, группы и зарплата за месяц.</span><em>Открыть кабинет ${ic('chev', 14)}</em></a>
      <a class="lp-role" href="#/p/home"><span class="ic">${ic('user', 22)}</span><b>Родитель</b><span>Сколько занятий осталось, расписание и оплата через Kaspi QR.</span><em>Открыть кабинет ${ic('chev', 14)}</em></a>
      <a class="lp-role" href="#/s/home"><span class="ic">${ic('book', 22)}</span><b>Ученик</b><span>Следующий урок, посещаемость и серия без пропусков.</span><em>Открыть кабинет ${ic('chev', 14)}</em></a>
    </div>
  </div></section>

  <section class="lp-price" id="price"><div class="lp-in">
    <div><h2>Одна цена, всё включено</h2><p class="lp-sub">Меньше 1&nbsp;% оборота центра — при потерях 2–4&nbsp;% без учёта. Переносим ваш Excel сами и помогаем по вечерам, пока идут занятия.</p></div>
    <div class="lp-plan"><div class="small muted">Тариф «Рост», до 300 учеников</div><div class="lp-amount">35 000 ₸<span>/ месяц</span></div>
      <ul><li>Все кабинеты: владелец, преподаватели, родители, ученики</li><li>Kaspi QR, напоминания, зарплата, импорт из Excel</li><li>Данные хранятся в Казахстане</li></ul>
      <a class="btn lg" href="#roles" data-scroll style="width:100%">Попробовать демо</a><div class="small muted" style="margin-top:10px;text-align:center">Пилот — 14 дней бесплатно</div></div>
  </div></section>

  <footer class="lp-foot"><div class="lp-in">
    <span class="brand"><img class="mk" src="icons/mark.svg" alt=""><span>© 2026 Sabaq · Алматы</span></span>
    <span class="muted">Учебный MVP · данные демонстрационные и хранятся в этом браузере</span>
    <button class="btn ghost sm" data-act="reset">${ic('reset', 14)}Сбросить демо</button>
  </div></footer>
</div>`);


/* ------------------------------------------------------------------ avatars: illustrated, deterministic per name (no real photos) */
const hashStr = t => [...String(t)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const AV_BG = ['#DCEBF5', '#DFF2EF', '#FBEADB', '#EAE5F5', '#FBF1D3', '#E3E9EF', '#F6E1E4'];
const AV_SKIN = ['#F3D2B5', '#E9BE98', '#D9A57A', '#C68A5E', '#A86F49'];
const AV_HAIR = ['#24180F', '#3A271B', '#5B3A24', '#1E2433', '#7B4A2A', '#A0652F'];
const AV_SHIRT = ['#0F3355', '#13A19E', '#5B6B7D', '#C9372C', '#7C5CBF', '#D08A2C', '#2F6F4F'];
function avatar(name, size = 28) {
  const h = hashStr(name), r = k => (h >>> (k * 3)) % 997;
  const bg = AV_BG[r(1) % AV_BG.length], skin = AV_SKIN[r(2) % AV_SKIN.length], hair = AV_HAIR[r(3) % AV_HAIR.length], shirt = AV_SHIRT[r(4) % AV_SHIRT.length];
  const style = r(5) % 4, glasses = r(6) % 5 === 0;
  const hairBack = style === 2 ? `<path d="M9 21c0-8 4-13 11-13s11 5 11 13v12H9z" fill="${hair}"/>` : '';
  const hairTop = [
    `<path d="M11 18c0-6 4-9 9-9s9 3 9 9c-2-3-5-4-9-4s-7 1-9 4z" fill="${hair}"/>`,
    `<path d="M11 19c-1-7 3-11 9-11s10 4 9 11c-1-2-3-4-6-4-2 1-5 1-7 0-3 0-4 2-5 4z" fill="${hair}"/>`,
    `<path d="M11 19c0-7 4-10 9-10s9 3 9 10c-3-1-6-4-7-6-2 3-6 5-11 6z" fill="${hair}"/>`,
    `<path d="M12 16c1-4 4-6 8-6s7 2 8 6c-2-1-5-2-8-2s-6 1-8 2z" fill="${hair}"/>`][style];
  const gl = glasses ? `<g fill="none" stroke="#1E2433" stroke-width=".9"><circle cx="16.6" cy="20.6" r="2.3"/><circle cx="23.4" cy="20.6" r="2.3"/><path d="M18.9 20.6h2.2"/></g>` : '';
  return `<svg class="avsvg" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" fill="${bg}"/>${hairBack}
    <path d="M7 40c1-7 6-10 13-10s12 3 13 10z" fill="${shirt}"/><rect x="17" y="25" width="6" height="6" rx="2" fill="${skin}"/>
    <ellipse cx="20" cy="20" rx="8.2" ry="9" fill="${skin}"/>${hairTop}
    <circle cx="16.8" cy="20.8" r=".95" fill="#1E2433"/><circle cx="23.2" cy="20.8" r=".95" fill="#1E2433"/>${gl}
    <path d="M17.6 24.6c1.4 1.1 3.4 1.1 4.8 0" fill="none" stroke="#7A4030" stroke-width=".9" stroke-linecap="round"/></svg>`;
}
const AVA = (name, cls = '') => `<span class="av pic ${cls}" title="${esc(name)}">${avatar(name, cls === 'xl' ? 56 : 28)}</span>`;
/* the learning centre's own logo (a client brand, distinct from Sabaq) */
const ORG_LOGO = `<svg class="orglogo" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#F0642D"/><path d="M9 13.5c4-1.6 7.4-1.2 11 1.2v15c-3.6-2.4-7-2.8-11-1.2z" fill="#fff"/><path d="M31 13.5c-4-1.6-7.4-1.2-11 1.2v15c3.6-2.4 7-2.8 11-1.2z" fill="#FFD9C7"/><circle cx="20" cy="9.5" r="2.4" fill="#fff"/></svg>`;
/* ------------------------------------------------------------------ owner shell */
const ROLE = {
  o: { base: '#/o/', who: () => ['Ерлан Касенов', 'Владелец'], nav: () => [['home', 'home', 'Главная', unmarked().length + S.leads.filter(l => l.status === 'new').length], ['students', 'users', 'Ученики'], ['schedule', 'cal', 'Расписание'], ['finance', 'wallet', 'Финансы'], ['catalog', 'store', 'Каталог']] },
  t: { base: '#/t/', who: () => [TCH(teacherId).name, 'Преподаватель'], nav: () => [['today', 'check', 'Отметить урок', tOpen().length], ['lessons', 'cal', 'Мои занятия'], ['groups', 'users', 'Мои группы'], ['pay', 'wallet', 'Зарплата'], ['profile', 'user', 'Профиль']] },
  p: { base: '#/p/', who: () => [STU(childId).parent, 'Родитель'], nav: () => [['home', 'home', 'Главная'], ['schedule', 'cal', 'Расписание'], ['payments', 'wallet', 'Оплаты', debt(childId) ? '!' : 0], ['profile', 'user', 'Профиль']] },
  s: { base: '#/s/', who: () => [STU(childId).name, 'Ученик'], nav: () => [['home', 'home', 'Главная'], ['schedule', 'cal', 'Расписание'], ['attendance', 'book', 'Посещаемость'], ['profile', 'user', 'Профиль']] },
};
const OTHER = [['o', '#/o/home', 'home', 'Владелец'], ['t', '#/t/today', 'teacher', 'Преподаватель'], ['p', '#/p/home', 'user', 'Родитель'], ['s', '#/s/home', 'book', 'Ученик']];
const MK = '<img class="mk" src="icons/mark.svg" alt="">';
function shell(active, body, role = 'o') {
  const R = ROLE[role], [meName, meSub] = R.who(), nav = R.nav();
  const title = (nav.find(n => n[0] === active) || [0, 0, ''])[2];
  return `<div class="shell"><aside class="side">
    <div class="logo brand">${MK}<img src="img/logo_sabaq.png" alt="Sabaq"></div>
    <div class="org"><span class="sq img">${ORG_LOGO}</span><div><b>${esc(S.center.name)}</b><span>${esc(S.center.city)} · ${role === 'o' ? S.students.length + ' учеников' : meSub.toLowerCase()}</span></div></div>
    <nav class="nav" aria-label="Разделы">${nav.map(([k, i, t, b]) => `<a href="${R.base}${k}" class="${active === k ? 'on' : ''}"${active === k ? ' aria-current="page"' : ''}>${ic(i)}<span>${t}</span>${b ? `<span class="badge">${b}</span>` : ''}</a>`).join('')}
      <div class="cap alt">Демо: другие роли</div>${OTHER.filter(o => o[0] !== role).map(o => `<a class="alt" href="${o[1]}">${ic(o[2])}<span>${o[3]}</span></a>`).join('')}</nav>
    <div class="bottom"><div class="me">${AVA(meName)}<div><b>${esc(meName)}</b><span>${esc(meSub)}</span></div><a href="#/" class="btn ghost sm" style="margin-left:auto" aria-label="Выйти">${ic('out', 14)}</a></div></div>
  </aside><main class="main">
    <div class="topbar"><span class="brand tb-brand">${MK}</span><div class="crumb">${esc(S.center.name)} / <b>${title}</b></div>
      ${role === 'o' ? `<label class="search">${ic('users', 15)}<span class="sr">Поиск ученика</span><input data-input="gsearch" placeholder="Найти ученика" value="${active === 'students' ? esc(studentQuery) : ''}"><span class="kbd">Enter</span></label>` : `<a href="#/" class="btn ghost sm topexit">${ic('out', 14)}Выйти</a>`}</div>
    <div class="content">${body}</div></main></div>`;
}
const head = (title, sub, actions = '') => `<div class="head"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="row">${actions}</div></div>`;
const who = (name, sub) => `<div class="who">${AVA(name)}<div><div>${esc(name)}</div>${sub ? `<div class="small muted">${sub}</div>` : ''}</div></div>`;
const balPill = b => b < 0 ? `<span class="pill bad">долг ${Math.abs(b)}</span>` : b <= 1 ? `<span class="pill warn">${lessonsWord(b)}</span>` : `<span class="pill ok">${lessonsWord(b)}</span>`;

/* dashboard */
route(/^\/o\/home$/, () => {
  const pays = S.payments.filter(p => p.method !== 'import' && inMonth(p.date));
  const paid = pays.reduce((a, p) => a + p.amount, 0);
  const debtors = S.students.map(s => ({ s, d: debt(s.id) })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
  const totalDebt = debtors.reduce((a, x) => a + x.d, 0);
  const seats = S.groups.reduce((a, g) => a + g.capacity, 0), filled = S.students.length;
  const um = unmarked(); const leads = S.leads.filter(l => l.status === 'new');
  const low = S.students.filter(s => { const b = balance(s.id); return b >= 0 && b <= 1; });
  // payments per week, last 6 weeks
  const mon = addDays(TODAY, -((TODAY.getDay() + 6) % 7));
  const weeks = [...Array(4)].map((_, i) => { const a = addDays(mon, (i - 3) * 7), b = addDays(a, 7); return { a, sum: S.payments.filter(p => p.method !== 'import' && p.date >= iso(a) && p.date < iso(b)).reduce((x, p) => x + p.amount, 0) }; });
  const mx = Math.max(...weeks.map(w => w.sum), 1);
  const attn = [
    ...um.map(l => `<div><span class="i bad">${ic('clock', 16)}</span><div><b>Урок не отмечен</b><div class="small muted">${esc(G(l.gid).name)} · ${rel(l.date)}, ${l.start} · ${esc(TCH(G(l.gid).teacherId).name)}</div></div><button class="btn sm" data-act="mark" data-id="${l.id}">Отметить</button></div>`),
    ...leads.map(l => `<div><span class="i ok">${ic('store', 16)}</span><div><b>Заявка на пробный урок</b><div class="small muted">${esc(l.name)} · ${esc(G(l.gid).name)} · ${esc(l.phone)}</div></div><button class="btn sm ghost" data-act="lead-done" data-id="${l.id}">Связались</button></div>`),
    ...debtors.slice(0, 3).map(x => `<div><span class="i warn">${ic('coins', 16)}</span><div><b>${esc(x.s.name)}: долг ${money(x.d)}</b><div class="small muted">${esc(x.s.parent)} · ${esc(G(x.s.gid).name)}</div></div><button class="btn sm ghost" data-act="remind" data-id="${x.s.id}">Напомнить</button></div>`),
  ];
  return shell('home', `${head(`Добрый день`, `${DOWF[TODAY.getDay()]}, ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]} · ${esc(S.center.name)}`, `<a class="btn ghost" href="#/o/schedule">${ic('cal', 18)}Расписание</a><button class="btn" data-act="add-student">${ic('plus', 18)}Ученик</button>`)}
  <div class="strip">
    <div class="hl"><div class="v num">${money(paid)}</div><div class="l">оплаты за ${MONTHS1[TODAY.getMonth()]}</div></div>
    <div><div class="v num ${totalDebt ? 'red' : ''}">${money(totalDebt)}</div><div class="l">долги родителей · ${debtors.length} ${plural(debtors.length, 'ученик', 'ученика', 'учеников')}</div></div>
    <div><div class="v num">${Math.round(filled / seats * 100)}%</div><div class="l">заполнены группы · ${filled} из ${seats} мест</div></div>
    <div><div class="v num ${um.length ? 'red' : 'teal'}">${um.length}</div><div class="l">неотмеченных уроков${um.length ? '' : ' — всё списано'}</div></div>
  </div>
  <div class="cols">
    <section class="panel"><h2>Требует внимания</h2>${attn.length ? `<div class="attn">${attn.join('')}</div>` : `<div class="empty">Всё отмечено и оплачено. Хороший день.</div>`}</section>
    <div class="stack">
      <section class="panel"><h2>Оплаты по неделям</h2><div class="bars">${weeks.map((w, i) => `<div class="b ${i === 3 ? 'now' : ''}"><em>${w.sum ? Math.round(w.sum / 1000) + 'K' : '—'}</em><i style="height:${Math.max(2, w.sum / mx * 110)}px"></i><span>${w.a.getDate()}.${pad(w.a.getMonth() + 1)}</span></div>`).join('')}</div></section>
      <section class="panel"><h2>Группы</h2><div class="occ">${S.groups.map(g => { const n = groupStudents(g.id).length; return `<div class="o"><span>${esc(g.name)}</span><span class="muted num">${n}/${g.capacity}</span><div class="track"><i style="width:${n / g.capacity * 100}%"></i></div></div>`; }).join('')}</div></section>
      ${low.length ? `<section class="panel"><h2>Абонемент заканчивается</h2><div class="small muted" style="margin:-8px 0 10px">Осталось 0–1 занятие — родителю пора продлить</div>${low.slice(0, 5).map(s => `<div class="row" style="justify-content:space-between;padding:6px 0">${who(s.name, esc(G(s.gid).name))}${balPill(balance(s.id))}</div>`).join('')}</section>` : ''}
    </div>
  </div>`);
});

/* students */
let studentFilter = 'all', studentQuery = '';
route(/^\/o\/students$/, () => {
  const list = S.students.filter(s => (studentFilter === 'all' || (studentFilter === 'debt' ? balance(s.id) < 0 : s.gid === studentFilter)) && s.name.toLowerCase().includes(studentQuery.toLowerCase()));
  return shell('students', `${head('Ученики', `${S.students.length} ${plural(S.students.length, 'ученик', 'ученика', 'учеников')} в ${S.groups.length} группах`, `<button class="btn ghost" data-act="import">${ic('up', 18)}Импорт из Excel</button><button class="btn" data-act="add-student">${ic('plus', 18)}Ученик</button>`)}
  <section class="panel">
    <div class="row" style="margin-bottom:12px">
      <div class="field" style="flex:1;min-width:200px"><label class="sr" for="q">Поиск</label><input id="q" placeholder="Поиск по имени" value="${esc(studentQuery)}" data-input="q"></div>
      <div class="field"><label class="sr" for="gf">Группа</label><select id="gf" data-input="gf"><option value="all">Все группы</option><option value="debt" ${studentFilter === 'debt' ? 'selected' : ''}>Только с долгом</option>${S.groups.map(g => `<option value="${g.id}" ${studentFilter === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
    </div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ученик</th><th>Группа</th><th>Родитель</th><th class="r">Абонемент</th></tr></thead><tbody>
    ${list.map(s => `<tr class="link" data-go="#/o/s/${s.id}" tabindex="0"><td>${who(s.name)}</td><td>${esc(G(s.gid).name)}</td><td><div>${esc(s.parent)}</div><div class="small muted">${esc(s.phone)}</div></td><td class="r">${balPill(balance(s.id))}${debt(s.id) ? `<div class="small red num" style="margin-top:4px">${money(debt(s.id))}</div>` : ''}</td></tr>`).join('') || `<tr><td colspan="4"><div class="empty">Никого не нашли. Проверьте фильтр или добавьте ученика.</div></td></tr>`}
    </tbody></table></div>
  </section>`);
});

/* student card */
route(/^\/o\/s\/(\w+)$/, id => {
  const s = STU(id); if (!s) return shell('students', `<div class="empty">Ученик не найден. <a href="#/o/students">К списку</a></div>`);
  const g = G(s.gid), b = balance(id), rows = ledger(id).reverse();
  const n = Math.max(g.pkgLessons, b);
  const pips = [...Array(Math.min(n, 24))].map((_, i) => `<i class="${i < b ? 'left' : ''}"></i>`).join('') + (b < 0 ? [...Array(Math.min(-b, 12))].map(() => '<i class="debt"></i>').join('') : '');
  const held = rows.filter(r => r.kind === 'lesson'); const present = held.filter(r => r.m === 'p').length;
  return shell('students', `<a href="#/o/students" class="btn ghost sm" style="margin-bottom:16px">${ic('back', 16)}Ученики</a>
  ${head(esc(s.name), `${esc(g.name)} · ${esc(TCH(g.teacherId).name)} · с ${fdate(s.since)}`, `<button class="btn ghost" data-act="remind" data-id="${id}">${ic('send', 18)}Напомнить родителю</button><button class="btn teal" data-act="pay" data-id="${id}">${ic('coins', 18)}Принять оплату</button>`)}
  <div class="cols">
    <div class="stack">
      <section class="panel"><h2>Абонемент</h2>
        <div class="balance"><span class="big num ${b < 0 ? 'red' : ''}">${b}</span><span class="muted">${b < 0 ? `${plural(-b, 'занятие', 'занятия', 'занятий')} в долг · ${money(debt(id))}` : `${plural(b, 'занятие осталось', 'занятия осталось', 'занятий осталось')}`}</span></div>
        <div class="pips" aria-hidden="true">${pips}</div>
        <p class="small muted" style="margin-top:14px">Пакет: ${lessonsWord(g.pkgLessons)} за ${money(g.pkgPrice)} (${money(perLesson(g))} за урок). ${S.policy.chargeAbsent ? 'Пропуск без уважительной причины списывается.' : 'Пропуски не списываются.'}</p>
      </section>
      <section class="panel"><h2>История</h2><div class="hist">${rows.slice(0, 30).map(r => r.kind === 'pay'
        ? `<div><span class="small muted">${fdate(r.date)}</span><span>${r.p.method === 'import' ? 'Перенос остатка из Excel' : `Оплата ${r.p.method === 'kaspi' ? 'Kaspi QR' : 'наличными'} · ${money(r.p.amount)}`}</span><b class="teal num">${r.p.lessons >= 0 ? '+' : ''}${r.p.lessons}</b></div>`
        : `<div><span class="small muted">${fdate(r.date)}</span><span>${r.m === 'p' ? 'Был на уроке' : r.m === 'a' ? 'Пропуск без причины' : 'Пропуск по уважительной'}</span><b class="num ${charges(r.m) ? '' : 'muted'}">${charges(r.m) ? '−1' : '0'}</b></div>`).join('')}</div></section>
    </div>
    <div class="stack">
      <section class="panel"><h2>Родитель</h2>${who(s.parent, esc(s.phone))}<p class="small muted" style="margin-top:12px">Видит остаток занятий и платит через Kaspi QR в своём кабинете.</p><a class="btn ghost sm" style="margin-top:12px" href="#/p/child/${id}">Открыть как родитель</a></section>
      <section class="panel"><h2>Посещаемость</h2><div class="balance"><span class="big num" style="font-size:44px">${held.length ? Math.round(present / held.length * 100) : 0}%</span><span class="muted">${present} из ${held.length} уроков</span></div></section>
    </div>
  </div>`);
});

/* schedule */
let weekOffset = 0;
route(/^\/o\/schedule$/, () => {
  const mon = addDays(TODAY, -((TODAY.getDay() + 6) % 7) + weekOffset * 7);
  const days = [...Array(6)].map((_, i) => addDays(mon, i));
  const H0 = 9 * 60, H1 = 21 * 60, PX = 0.9; const height = (H1 - H0) * PX;
  const hours = []; for (let h = 9; h <= 20; h++) hours.push(h);
  const cols = days.map(d => {
    const ds = iso(d);
    const ls = S.lessons.filter(l => l.date === ds).sort((a, b) => mins(a.start) - mins(b.start));
    // overlapping lessons (different rooms) share the column side by side
    const ends = []; ls.forEach(l => { let k = ends.findIndex(e => e <= mins(l.start)); if (k < 0) k = ends.length; ends[k] = mins(l.start) + l.dur; l._lane = k; });
    ls.forEach(l => { l._n = 1 + Math.max(...ls.filter(o => mins(o.start) < mins(l.start) + l.dur && mins(l.start) < mins(o.start) + o.dur).map(o => o._lane)); });
    const um = unmarked();
    return `<div class="tc" style="height:${height}px">${hours.map(h => `<div class="hl" style="top:${(h * 60 - H0) * PX}px"></div>`).join('')}
      ${ls.map(l => { const g = G(l.gid); const miss = um.includes(l); const w = 100 / l._n; return `<button class="lesson ${l.status === 'held' ? 'held' : ''} ${miss ? 'miss' : ''}" style="top:${(mins(l.start) - H0) * PX}px;height:${l.dur * PX - 3}px;left:calc(${l._lane * w}% + 4px);width:calc(${w}% - 8px);right:auto" data-act="mark" data-id="${l.id}" title="${esc(g.name)}, ${esc(ROOM(g.roomId).name)}, ${esc(TCH(g.teacherId).name)}"><b>${esc(g.name)}</b>${l.start}–${hhmm(mins(l.start) + l.dur)}<br>${esc(TCH(g.teacherId).name.split(' ')[0])}</button>`; }).join('')}</div>`;
  });
  return shell('schedule', `${head('Расписание', `${days[0].getDate()} ${MONTHS[days[0].getMonth()]} — ${days[5].getDate()} ${MONTHS[days[5].getMonth()]}`, `<button class="btn ghost" data-act="week" data-d="-1" aria-label="Прошлая неделя">${ic('back', 18)}</button><button class="btn ghost" data-act="week" data-d="0">Эта неделя</button><button class="btn ghost" data-act="week" data-d="1" aria-label="Следующая неделя">${ic('chev', 18)}</button><button class="btn" data-act="add-group">${ic('plus', 18)}Группа</button>`)}
  <div class="week">
    <div class="dh"></div>${days.map(d => `<div class="dh ${iso(d) === T ? 'today' : ''}">${DOWF[d.getDay()]}<span>${d.getDate()} ${MONTHS[d.getMonth()]}</span></div>`).join('')}
    <div class="hours" style="height:${height}px">${hours.map(h => `<div style="top:${Math.max(2, (h * 60 - H0) * PX - 7)}px">${h}:00</div>`).join('')}</div>${cols.join('')}
  </div>
  <div class="legend"><span><i style="background:var(--tealbg);border-left:3px solid var(--teal)"></i>запланирован</span><span><i style="background:#EEF2F6"></i>проведён и списан</span><span><i style="background:var(--redbg)"></i>прошёл, но не отмечен</span><span>Нажмите на урок, чтобы отметить посещаемость. Sabaq не даст поставить преподавателя или аудиторию в два места сразу.</span></div>`);
});

/* finance */
route(/^\/o\/finance$/, () => {
  const pays = S.payments.filter(p => p.method !== 'import').sort((a, b) => b.date.localeCompare(a.date));
  const month = pays.filter(p => inMonth(p.date));
  const kaspi = month.filter(p => p.method === 'kaspi').reduce((a, p) => a + p.amount, 0), cash = month.filter(p => p.method === 'cash').reduce((a, p) => a + p.amount, 0);
  const earned = S.lessons.filter(l => l.status === 'held' && inMonth(l.date)).reduce((a, l) => a + Object.values(l.marks).filter(charges).length * perLesson(G(l.gid)), 0);
  const pr = payroll(); const prSum = pr.reduce((a, x) => a + x.sum, 0);
  const debtors = S.students.map(s => ({ s, d: debt(s.id), b: balance(s.id) })).filter(x => x.d > 0).sort((a, b) => b.d - a.d);
  return shell('finance', `${head('Финансы', `${MONTHS1[TODAY.getMonth()][0].toUpperCase() + MONTHS1[TODAY.getMonth()].slice(1)} ${TODAY.getFullYear()}`, `<button class="btn ghost" data-act="csv">${ic('down', 18)}Зарплата в CSV</button>`)}
  <div class="strip">
    <div class="hl"><div class="v num">${money(kaspi + cash)}</div><div class="l">поступило · Kaspi ${Math.round(kaspi / Math.max(kaspi + cash, 1) * 100)}%</div></div>
    <div><div class="v num">${money(earned)}</div><div class="l">заработано уроками (списано)</div></div>
    <div><div class="v num">${money(prSum)}</div><div class="l">зарплата преподавателей</div></div>
    <div><div class="v num">${money(earned - prSum)}</div><div class="l">остаётся центру до аренды и налогов</div></div>
  </div>
  <div class="cols">
    <div class="stack">
      <section class="panel"><h2>Зарплата из посещаемости</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Преподаватель</th><th class="r">Уроков</th><th class="r">Ставка</th><th class="r">К выплате</th></tr></thead><tbody>
        ${pr.map(x => `<tr><td>${who(x.t.name, esc(x.t.subject))}</td><td class="r num">${x.n}</td><td class="r num">${money(x.t.rate)}</td><td class="r num"><b>${money(x.sum)}</b></td></tr>`).join('')}
      </tbody></table></div><p class="small muted" style="margin-top:10px">Считается только по отмеченным урокам — споров «сколько я провёл» нет.</p></section>
      <section class="panel"><h2>Последние оплаты</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Дата</th><th>Ученик</th><th>Способ</th><th class="r">Сумма</th></tr></thead><tbody>
        ${pays.slice(0, 12).map(p => `<tr class="link" data-go="#/o/s/${p.sid}"><td class="num">${fdate(p.date)}</td><td>${esc(STU(p.sid).name)}</td><td>${p.method === 'kaspi' ? '<span class="pill ok">Kaspi QR · авто</span>' : '<span class="pill n">наличные</span>'}</td><td class="r num">${money(p.amount)}</td></tr>`).join('')}
      </tbody></table></div></section>
    </div>
    <div class="stack">
      <section class="panel"><h2>Должники</h2>${debtors.length ? debtors.map(x => `<div class="row" style="justify-content:space-between;padding:8px 0;border-top:1px solid var(--line2)"><a href="#/o/s/${x.s.id}" style="color:inherit;text-decoration:none">${who(x.s.name, `${lessonsWord(-x.b)} в долг`)}</a><div class="row"><b class="red num">${money(x.d)}</b><button class="btn sm ghost" data-act="remind" data-id="${x.s.id}">Напомнить</button></div></div>`).join('') : `<div class="empty">Долгов нет.</div>`}</section>
      <section class="panel"><h2>Правило абонемента</h2>
        <label class="row" style="justify-content:space-between;cursor:pointer;flex-wrap:nowrap"><span style="flex:1">Списывать занятие за пропуск без уважительной причины</span><input type="checkbox" data-input="policy" ${S.policy.chargeAbsent ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--teal)"></label>
        <p class="small muted" style="margin-top:8px">Пропуск по уважительной причине всегда переносится. Правило сразу пересчитывает остатки всех учеников.</p></section>
    </div>
  </div>`);
});

/* owner: catalogue + leads */
route(/^\/o\/catalog$/, () => {
  const leads = [...S.leads].sort((a, b) => b.date.localeCompare(a.date));
  return shell('catalog', `${head('Каталог', 'Свободные места публикуются из расписания сами — без ручных объявлений', `<a class="btn ghost" href="#/catalog">${ic('store', 18)}Открыть как родитель</a>`)}
  <div class="cols">
    <section class="panel"><h2>Что видят родители</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Группа</th><th>Дни</th><th class="r">Свободно</th></tr></thead><tbody>
      ${S.groups.map(g => { const free = g.capacity - groupStudents(g.id).length; return `<tr><td>${esc(g.name)}<div class="small muted">${esc(g.age)} · ${money(perLesson(g))} за урок</div></td><td>${g.slots.map(s => DOW[s.dow]).join(', ')} ${g.slots[0].start}</td><td class="r">${free > 0 ? `<span class="pill ok">${free} ${plural(free, 'место', 'места', 'мест')}</span>` : '<span class="pill n">мест нет</span>'}</td></tr>`; }).join('')}
    </tbody></table></div></section>
    <section class="panel"><h2>Заявки на пробный урок</h2>${leads.length ? leads.map(l => `<div class="row" style="justify-content:space-between;padding:10px 0;border-top:1px solid var(--line2)">${who(l.name, `${esc(G(l.gid).name)} · ${esc(l.phone)} · ${rel(l.date)}`)}${l.status === 'new' ? `<button class="btn sm" data-act="lead-done" data-id="${l.id}">Связались</button>` : '<span class="pill n">обработана</span>'}</div>`).join('') : '<div class="empty">Пока заявок нет. Они появятся, когда родители запишутся в каталоге.</div>'}</section>
  </div>`);
});

/* ------------------------------------------------------------------ attendance marking (shared by owner modal and teacher screen) */
function markRows(l, draft) {
  return groupStudents(l.gid).map(s => { const m = draft[s.id] || 'p'; const b = balance(s.id); return `<div class="st"><div>${esc(s.name)}<small>${b < 0 ? `в долг ${-b}` : `осталось ${b}`}</small></div>
    <div class="seg" role="radiogroup" aria-label="${esc(s.name)}">${[['p', 'Был'], ['a', 'Нет'], ['e', 'Уваж.']].map(([k, t]) => `<button type="button" class="${k} ${m === k ? 'on' : ''}" role="radio" aria-checked="${m === k}" data-act="setmark" data-sid="${s.id}" data-m="${k}">${t}</button>`).join('')}</div></div>`; }).join('');
}
function commitMarks(l, draft) {
  const g = G(l.gid), t = TCH(g.teacherId); const before = {};
  groupStudents(l.gid).forEach(s => { before[s.id] = balance(s.id); });
  const wasHeld = l.status === 'held';
  l.marks = {}; groupStudents(l.gid).forEach(s => { l.marks[s.id] = draft[s.id] || 'p'; }); l.status = 'held';
  const studs = groupStudents(l.gid);
  const came = studs.filter(s => l.marks[s.id] === 'p').length;
  const charged = studs.filter(s => charges(l.marks[s.id])).length;
  const intoDebt = studs.filter(s => balance(s.id) < 0 && before[s.id] >= 0 || (balance(s.id) < 0 && balance(s.id) < before[s.id]));
  const lastOne = studs.filter(s => balance(s.id) === 0 && before[s.id] > 0);
  S.sent.push({ lid: l.id, date: T, n: studs.length });
  save();
  const steps = [
    ['check', '', `Урок отмечен`, `${came} из ${studs.length} пришли`],
    ['book', '', `Списано с абонементов`, `−${charged} ${plural(charged, 'занятие', 'занятия', 'занятий')}`],
    intoDebt.length ? ['coins', 'r', `Долг: ${intoDebt.slice(0, 2).map(s => s.name.split(' ')[0]).join(', ')}${intoDebt.length > 2 ? ' и др.' : ''}`, money(intoDebt.reduce((a, s) => a + perLesson(g) * Math.min(1, -balance(s.id)), 0))] :
      lastOne.length ? ['bell', '', `Абонемент закончился: ${lastOne.slice(0, 2).map(s => s.name.split(' ')[0]).join(', ')}`, 'родителю предложено продлить'] : ['coins', '', 'Долгов не появилось', '0 ₸'],
    ['send', '', `Родителям ушёл остаток занятий`, `${studs.length} ${plural(studs.length, 'сообщение', 'сообщения', 'сообщений')}`],
    ['wallet', '', `Зарплата: ${t.name.split(' ')[0]}`, wasHeld ? 'уже начислена' : `+${money(t.rate)}`],
  ];
  return `<div class="chain">${steps.map((s, i) => `<div style="animation-delay:${i * 0.28}s"><span class="k ${s[1]}">${ic(s[0], 15)}</span><b>${esc(s[2])}</b><span class="v num">${esc(s[3])}</span></div>`).join('')}</div>`;
}

/* ------------------------------------------------------------------ cabinets: teacher, parent, student */
let teacherId = 't1', teacherLesson = null, teacherDraft = {}, teacherDone = null, childId = 's1', payMonth = 0;
const TPHONE = { t1: '+7 701 214 55 10', t2: '+7 707 388 12 04', t3: '+7 747 509 33 61', t4: '+7 777 120 48 92' };
const tLessons = () => S.lessons.filter(l => G(l.gid).teacherId === teacherId);
const tOpen = () => tLessons().filter(l => l.status === 'planned' && l.date <= T);
const byTime = (a, b) => (a.date + a.start).localeCompare(b.date + b.start);
const statusPill = l => l.status === 'held' ? '<span class="pill ok">проведён</span>' : unmarked().includes(l) ? '<span class="pill bad">не отмечен</span>' : l.date === T ? '<span class="pill warn">сегодня</span>' : '<span class="pill n">запланирован</span>';
function attendance(sid) { const s = STU(sid); const held = S.lessons.filter(l => l.gid === s.gid && l.status === 'held' && l.marks[sid]); const p = held.filter(l => l.marks[sid] === 'p').length; return { held, p, pct: held.length ? Math.round(p / held.length * 100) : 0 }; }
function pipsFor(b, n) { return [...Array(Math.min(Math.max(n, b), 24))].map((_, i) => `<i class="${i < b ? 'left' : ''}"></i>`).join('') + (b < 0 ? [...Array(Math.min(-b, 12))].map(() => '<i class="debt"></i>').join('') : ''); }
const kv = rows => `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
const presentOf = l => Object.values(l.marks).filter(m => m === 'p').length;

/* teacher */
route(/^\/t(?:\/(\w+))?$/, page => {
  page = ['today', 'lessons', 'groups', 'pay', 'profile'].includes(page) ? page : 'today';
  const t = TCH(teacherId), mine = tLessons(), first = t.name.split(' ')[0];
  if (page === 'today') {
    const list = [...mine.filter(l => l.status === 'planned' && l.date < T), ...mine.filter(l => l.date === T)].sort(byTime);
    const next = mine.filter(l => l.date > T).sort(byTime).slice(0, 4);
    if (!teacherLesson || !list.find(l => l.id === teacherLesson)) { const f = list.find(l => l.status === 'planned') || list[0]; teacherLesson = f ? f.id : null; teacherDraft = {}; }
    const L = S.lessons.find(l => l.id === teacherLesson);
    if (L && L.status === 'held' && !Object.keys(teacherDraft).length) teacherDraft = { ...L.marks };
    const open = list.filter(l => l.status === 'planned').length;
    const n = L ? groupStudents(L.gid).length : 0;
    const title = open ? `${open} ${plural(open, 'урок', 'урока', 'уроков')} к отметке` : list.length ? 'всё отмечено' : 'сегодня уроков нет';
    const left = `<section class="panel"><h2>Сегодня и неотмеченные</h2>${list.length ? `<div class="lessonpick">${list.map(l => { const g = G(l.gid); return `<button class="${l.id === teacherLesson ? 'on' : ''}" data-act="tpick" data-id="${l.id}"><span class="t num">${l.start}</span><span><b>${esc(g.name)}</b><div class="small muted">${rel(l.date)} · ${esc(ROOM(g.roomId).name)}</div></span>${l.status === 'held' ? '<span class="pill ok">отмечен</span>' : l.date < T ? '<span class="pill bad">просрочен</span>' : '<span class="pill n">к отметке</span>'}</button>`; }).join('')}</div>` : '<div class="empty">Сегодня уроков нет — отмечать нечего.</div>'}</section>
      <section class="panel"><h2>Дальше</h2>${next.map(l => `<div class="line"><span>${rel(l.date)}, ${l.start}</span><span class="muted">${esc(G(l.gid).name)}</span></div>`).join('') || '<div class="muted">Не запланировано</div>'}</section>`;
    let right = '<section class="panel empty">Выберите урок, чтобы отметить посещаемость.</section>';
    if (L && teacherDone === L.id) right = `<section class="panel"><h2>Готово. Вот что сделал Sabaq</h2><div id="chain"></div><button class="btn ghost" style="margin-top:14px" data-act="tedit">Исправить отметки</button></section>`;
    else if (L) right = `<section class="panel"><h2>${esc(G(L.gid).name)}<span class="act small muted" style="font-weight:400">${rel(L.date)}, ${L.start}</span></h2><div class="small muted" style="margin:-6px 0 8px">По умолчанию все пришли — отметьте только отсутствующих</div><div class="mark">${markRows(L, teacherDraft)}</div>
          <button class="btn teal lg" style="width:100%;margin-top:16px" data-act="tcommit">${ic('check', 20)}${L.status === 'held' ? 'Сохранить исправления' : `Урок проведён · ${n} ${plural(n, 'ученик', 'ученика', 'учеников')}`}</button></section>`;
    const [pick, nextP] = left.split('<section class="panel"><h2>Дальше</h2>');
    return shell('today', `${head(`${esc(first)}, ${title}`, `${DOWF[TODAY.getDay()]}, ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}`)}<div class="cols t-today"><div class="stack">${pick}</div><div class="stack">${right}<section class="panel"><h2>Дальше</h2>${nextP}</div></div>`, 't');
  }
  if (page === 'lessons') {
    const mon = addDays(TODAY, -((TODAY.getDay() + 6) % 7)), end = addDays(mon, 13);
    const ls = mine.filter(l => l.date >= iso(mon) && l.date <= iso(end)).sort(byTime);
    const days = [...new Set(ls.map(l => l.date))];
    return shell('lessons', `${head('Мои занятия', `${mon.getDate()} ${MONTHS[mon.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]} · ${ls.length} ${plural(ls.length, 'урок', 'урока', 'уроков')}`)}
    <section class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>День</th><th>Время</th><th>Группа</th><th>Аудитория</th><th class="r">Учеников</th><th class="r">Статус</th></tr></thead><tbody>
    ${days.map(d => ls.filter(l => l.date === d).map((l, i) => { const g = G(l.gid), can = l.status === 'planned' && l.date <= T; return `<tr class="${can ? 'link' : ''}" ${can ? `data-act="tpick" data-id="${l.id}"` : ''}><td>${i ? '' : `<b>${rel(d)}</b>`}</td><td class="num">${l.start}–${hhmm(mins(l.start) + l.dur)}</td><td>${esc(g.name)}</td><td class="muted">${esc(ROOM(g.roomId).name)}</td><td class="r num">${l.status === 'held' ? `${presentOf(l)} из ${Object.keys(l.marks).length}` : groupStudents(g.id).length}</td><td class="r">${statusPill(l)}</td></tr>`; }).join('')).join('')}
    </tbody></table></div></section>`, 't');
  }
  if (page === 'groups') {
    const gs = S.groups.filter(g => g.teacherId === teacherId);
    return shell('groups', `${head('Мои группы', `${gs.length} ${plural(gs.length, 'группа', 'группы', 'групп')} · ${gs.reduce((a, g) => a + groupStudents(g.id).length, 0)} учеников`)}
    <div class="stack">${gs.map(g => `<section class="panel"><h2>${esc(g.name)}<span class="act small muted" style="font-weight:400">${g.slots.map(x => DOW[x.dow]).join(', ')} в ${g.slots[0].start} · ${esc(ROOM(g.roomId).name)}</span></h2>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ученик</th><th>Посещаемость</th><th class="r">Абонемент</th></tr></thead><tbody>
      ${groupStudents(g.id).map(s => { const a = attendance(s.id); return `<tr><td>${who(s.name)}</td><td><div class="meter"><i style="width:${a.pct}%"></i></div><span class="small muted">${a.pct}% · ${a.p} из ${a.held.length}</span></td><td class="r">${balPill(balance(s.id))}</td></tr>`; }).join('')}
      </tbody></table></div></section>`).join('')}</div>`, 't');
  }
  if (page === 'pay') {
    const ref = new Date(TODAY.getFullYear(), TODAY.getMonth() - payMonth, 1);
    const held = mine.filter(l => l.status === 'held' && inMonth(l.date, ref)).sort(byTime).reverse();
    return shell('pay', `${head('Зарплата', 'Считается только по отмеченным урокам · выплата до 5 числа следующего месяца', `<div class="seg"><button class="${payMonth === 0 ? 'on' : ''}" data-act="tmonth" data-m="0">${MONTHS1[TODAY.getMonth()]}</button><button class="${payMonth === 1 ? 'on' : ''}" data-act="tmonth" data-m="1">${MONTHS1[(TODAY.getMonth() + 11) % 12]}</button></div>`)}
    <div class="strip">
      <div class="hl"><div class="v num">${money(held.length * t.rate)}</div><div class="l">начислено за ${MONTHS1[ref.getMonth()]}</div></div>
      <div><div class="v num">${held.length}</div><div class="l">проведённых уроков</div></div>
      <div><div class="v num">${money(t.rate)}</div><div class="l">ставка за урок</div></div>
      <div><div class="v num">${held.reduce((a, l) => a + presentOf(l), 0)}</div><div class="l">учеников пришло на уроки</div></div>
    </div>
    <section class="panel"><h2>Начисления</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Дата</th><th>Группа</th><th class="r">Пришли</th><th class="r">Сумма</th></tr></thead><tbody>
    ${held.map(l => `<tr><td class="num">${fdow(l.date)}, ${l.start}</td><td>${esc(G(l.gid).name)}</td><td class="r num">${presentOf(l)} из ${Object.keys(l.marks).length}</td><td class="r num"><b>${money(t.rate)}</b></td></tr>`).join('') || `<tr><td colspan="4"><div class="empty">В этом месяце уроков ещё не было.</div></td></tr>`}
    </tbody></table></div></section>`, 't');
  }
  const gs = S.groups.filter(g => g.teacherId === teacherId), st = gs.flatMap(g => groupStudents(g.id));
  const att = st.length ? Math.round(st.reduce((a, s) => a + attendance(s.id).pct, 0) / st.length) : 0;
  return shell('profile', `${head('Профиль')}
  <div class="cols"><section class="panel"><div class="prof">${AVA(t.name, 'xl')}<div><h2 style="font-size:20px">${esc(t.name)}</h2><div class="muted">${esc(t.subject)} · ${esc(S.center.name)}</div></div></div>
    ${kv([['Телефон', esc(TPHONE[t.id] || '—')], ['Ставка', money(t.rate) + ' за урок'], ['Группы', gs.map(g => esc(g.name)).join('<br>')], ['Учеников', st.length], ['Средняя посещаемость', att + '%']])}</section>
  <section class="panel"><h2>Демо: другой преподаватель</h2><div class="field"><label for="tsel">Преподаватель</label><select id="tsel" data-input="teacher">${S.teachers.map(x => `<option value="${x.id}" ${x.id === teacherId ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div></section></div>`, 't');
});

/* parent + student share the child's data */
function lessonsAhead(g, n = 14) { return S.lessons.filter(l => l.gid === g.id && l.date >= T && l.date < iso(addDays(TODAY, n)) && l.status === 'planned').sort(byTime); }
function scheduleTable(s) {
  const g = G(s.gid), ls = lessonsAhead(g);
  return `<section class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>День</th><th>Время</th><th>Занятие</th><th>Аудитория</th><th>Преподаватель</th></tr></thead><tbody>
  ${ls.map(l => `<tr><td><b>${rel(l.date)}</b></td><td class="num">${l.start}–${hhmm(mins(l.start) + l.dur)}</td><td>${esc(g.name)}</td><td class="muted">${esc(ROOM(g.roomId).name)}</td><td>${esc(TCH(g.teacherId).name)}</td></tr>`).join('') || `<tr><td colspan="5"><div class="empty">Ближайших уроков нет.</div></td></tr>`}
  </tbody></table></div></section>`;
}
function balanceCard(s, payable) {
  const g = G(s.gid), b = balance(s.id);
  return `<div class="parent-balance"><div class="small" style="color:#B6C7D8">${esc(s.name.split(' ')[0])} · ${esc(g.name)}</div>
    <div class="row" style="align-items:baseline;margin-top:10px"><span class="big num">${b}</span><span style="color:#C4D3E2">${b < 0 ? plural(-b, 'занятие в долг', 'занятия в долг', 'занятий в долг') : plural(b, 'занятие осталось', 'занятия осталось', 'занятий осталось')}</span></div>
    <div class="pips" aria-hidden="true">${pipsFor(b, g.pkgLessons)}</div>
    <p>${b < 0 ? `К оплате ${money(debt(s.id))}.` : b <= 1 ? 'Абонемент почти закончился — пора продлить.' : 'Списывается только за проведённые уроки.'}</p>
    ${payable ? `<button class="btn lg" style="width:100%;margin-top:16px" data-act="ppay" data-id="${s.id}">${ic('qr', 20)}Оплатить через Kaspi QR</button>` : ''}</div>`;
}
const histRows = rows => `<div class="hist">${rows.map(r => r.kind === 'pay' ? `<div><span class="small muted">${fdate(r.date)}</span><span>${r.p.method === 'import' ? 'Остаток перенесён' : 'Оплата ' + money(r.p.amount)}</span><b class="teal">+${r.p.lessons}</b></div>` : `<div><span class="small muted">${fdate(r.date)}</span><span>${r.m === 'p' ? 'Был на уроке' : r.m === 'a' ? 'Пропуск без причины' : 'Пропуск по уважительной'}</span><b class="${charges(r.m) ? '' : 'muted'}">${charges(r.m) ? '−1' : '0'}</b></div>`).join('') || '<div class="muted">Пока пусто</div>'}</div>`;
const childSelect = () => `<div class="field"><label for="psel">Ученик</label><select id="psel" data-input="child">${S.students.map(x => `<option value="${x.id}" ${x.id === childId ? 'selected' : ''}>${esc(x.name)} — ${esc(G(x.gid).name)}</option>`).join('')}</select></div>`;

route(/^\/p\/child\/(\w+)$/, id => { if (STU(id)) childId = id; return parentPage('home'); });
route(/^\/p(?:\/(\w+))?$/, page => parentPage(page));
function parentPage(page) {
  page = ['home', 'schedule', 'payments', 'profile'].includes(page) ? page : 'home';
  if (!STU(childId)) childId = S.students[0].id;
  const s = STU(childId), g = G(s.gid), tc = TCH(g.teacherId), first = s.name.split(' ')[0], att = attendance(s.id);
  if (page === 'home') {
    const up = lessonsAhead(g, 7).slice(0, 4);
    return shell('home', `${head(`${esc(s.parent.split(' ')[0])}, здравствуйте`, `${esc(s.name)} · ${esc(g.name)}`)}
    <div class="cols"><div class="stack">${balanceCard(s, true)}
      <section class="panel"><h2>Ближайшие уроки<a class="act small" href="#/p/schedule">Все</a></h2>${up.map(l => `<div class="line"><span><b>${rel(l.date)}</b>, ${l.start}</span><span class="muted">${esc(ROOM(g.roomId).name)} · ${esc(tc.name.split(' ')[0])}</span></div>`).join('') || '<div class="muted">Не запланированы</div>'}</section></div>
    <div class="stack"><section class="panel"><h2>Что списано и оплачено<a class="act small" href="#/p/payments">Все</a></h2>${histRows(ledger(s.id).reverse().slice(0, 7))}</section>
      <section class="panel"><h2>Посещаемость</h2><div class="balance"><span class="big num" style="font-size:40px">${att.pct}%</span><span class="muted">${att.p} из ${att.held.length} уроков</span></div><div class="meter" style="margin-top:14px"><i style="width:${att.pct}%"></i></div></section></div></div>`, 'p');
  }
  if (page === 'schedule') return shell('schedule', `${head('Расписание', `${esc(first)} · ${esc(g.name)} · ближайшие две недели`)}${scheduleTable(s)}`, 'p');
  if (page === 'payments') {
    const pays = S.payments.filter(p => p.sid === s.id && p.method !== 'import').sort((a, b) => b.date.localeCompare(a.date));
    return shell('payments', `${head('Оплаты', `${esc(first)} · пакет ${lessonsWord(g.pkgLessons)} за ${money(g.pkgPrice)}`, `<button class="btn teal" data-act="ppay" data-id="${s.id}">${ic('qr', 18)}Оплатить</button>`)}
    <div class="strip">
      <div class="hl"><div class="v num">${money(pays.reduce((a, p) => a + p.amount, 0))}</div><div class="l">оплачено всего</div></div>
      <div><div class="v num ${debt(s.id) ? 'red' : ''}">${money(debt(s.id))}</div><div class="l">к оплате сейчас</div></div>
      <div><div class="v num">${balance(s.id)}</div><div class="l">занятий осталось</div></div>
      <div><div class="v num">${att.held.filter(l => charges(l.marks[s.id])).length}</div><div class="l">занятий списано</div></div>
    </div>
    <div class="cols"><section class="panel"><h2>Платежи</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Дата</th><th>Способ</th><th class="r">Занятий</th><th class="r">Сумма</th></tr></thead><tbody>
      ${pays.map(p => `<tr><td class="num">${fdate(p.date)}</td><td>${p.method === 'kaspi' ? '<span class="pill ok">Kaspi QR</span>' : '<span class="pill n">наличные</span>'}</td><td class="r num">+${p.lessons}</td><td class="r num"><b>${money(p.amount)}</b></td></tr>`).join('') || `<tr><td colspan="4"><div class="empty">Платежей пока нет.</div></td></tr>`}
      </tbody></table></div></section>
    <section class="panel"><h2>История списаний</h2>${histRows(ledger(s.id).reverse().filter(r => r.kind === 'lesson').slice(0, 12))}</section></div>`, 'p');
  }
  return shell('profile', `${head('Профиль')}
  <div class="cols"><section class="panel"><div class="prof">${AVA(s.parent, 'xl')}<div><h2 style="font-size:20px">${esc(s.parent)}</h2><div class="muted">Родитель · ${esc(s.phone)}</div></div></div>
    ${kv([['Ребёнок', esc(s.name)], ['Группа', esc(g.name)], ['Преподаватель', `${esc(tc.name)}<br><span class="muted">${esc(TPHONE[tc.id] || '')}</span>`], ['Расписание', `${g.slots.map(x => DOW[x.dow]).join(', ')} в ${g.slots[0].start}`], ['Учится с', fdate(s.since)]])}</section>
  <div class="stack"><section class="panel"><h2>Учебный центр</h2>${kv([['Название', esc(S.center.name)], ['Адрес', `${esc(S.center.address)}, ${esc(S.center.city)}`], ['WhatsApp', '+7 727 355 40 40'], ['Часы работы', 'пн–сб, 9:00–21:00']])}</section>
    <section class="panel"><h2>Демо: другой ребёнок</h2>${childSelect()}</section></div></div>`, 'p');
}

/* student */
route(/^\/s(?:\/(\w+))?$/, page => {
  page = ['home', 'schedule', 'attendance', 'profile'].includes(page) ? page : 'home';
  if (!STU(childId)) childId = S.students[0].id;
  const s = STU(childId), g = G(s.gid), tc = TCH(g.teacherId), first = s.name.split(' ')[0], att = attendance(s.id);
  let streak = 0; for (const l of [...att.held].sort(byTime).reverse()) { if (l.marks[s.id] === 'p') streak++; else break; }
  if (page === 'home') {
    const nx = lessonsAhead(g, 14)[0];
    return shell('home', `${head(`Привет, ${esc(first)}!`, `${esc(g.name)} · ${esc(tc.name)}`)}
    <div class="cols"><div class="stack">
      <section class="panel next"><div class="small muted">Следующий урок</div>${nx ? `<div class="nx">${rel(nx.date)}, ${nx.start}</div><div class="muted">${esc(g.name)} · ${esc(ROOM(g.roomId).name)} · ${esc(tc.name)}</div>` : '<div class="nx">Не запланирован</div>'}</section>
      ${balanceCard(s, false)}</div>
    <div class="stack"><section class="panel"><h2>Посещаемость<a class="act small" href="#/s/attendance">Подробнее</a></h2><div class="balance"><span class="big num" style="font-size:44px">${att.pct}%</span><span class="muted">${att.p} из ${att.held.length} уроков</span></div><div class="meter" style="margin-top:14px"><i style="width:${att.pct}%"></i></div></section>
      <section class="panel"><h2>Серия без пропусков</h2><div class="balance"><span class="big num" style="font-size:44px">${streak}</span><span class="muted">${plural(streak, 'урок подряд', 'урока подряд', 'уроков подряд')}</span></div></section></div></div>`, 's');
  }
  if (page === 'schedule') return shell('schedule', `${head('Расписание', 'Ближайшие две недели')}${scheduleTable(s)}`, 's');
  if (page === 'attendance') {
    const rows = [...att.held].sort(byTime).reverse();
    return shell('attendance', `${head('Посещаемость', `${att.pct}% · ${att.p} из ${att.held.length} уроков`)}
    <section class="panel"><div class="dots" aria-hidden="true">${[...rows].reverse().map(l => `<i class="${l.marks[s.id]}"></i>`).join('')}</div><div class="legend" style="margin:10px 0 6px"><span><i style="background:var(--acc)"></i>был</span><span><i style="background:var(--red)"></i>пропуск</span><span><i style="background:#B4BDC8"></i>уважительная</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Дата</th><th>Занятие</th><th class="r">Отметка</th></tr></thead><tbody>
    ${rows.map(l => `<tr><td class="num">${fdow(l.date)}, ${l.start}</td><td>${esc(g.name)}</td><td class="r">${l.marks[s.id] === 'p' ? '<span class="pill ok">был</span>' : l.marks[s.id] === 'a' ? '<span class="pill bad">пропуск</span>' : '<span class="pill n">уважительная</span>'}</td></tr>`).join('')}
    </tbody></table></div></section>`, 's');
  }
  return shell('profile', `${head('Профиль')}
  <div class="cols"><section class="panel"><div class="prof">${AVA(s.name, 'xl')}<div><h2 style="font-size:20px">${esc(s.name)}</h2><div class="muted">Ученик · ${esc(S.center.name)}</div></div></div>
    ${kv([['Группа', esc(g.name)], ['Возраст группы', esc(g.age)], ['Преподаватель', esc(tc.name)], ['Расписание', `${g.slots.map(x => DOW[x.dow]).join(', ')} в ${g.slots[0].start}`], ['Родитель', esc(s.parent)], ['Учится с', fdate(s.since)]])}</section>
  <section class="panel"><h2>Демо: другой ученик</h2>${childSelect()}</section></div>`, 's');
});

/* ------------------------------------------------------------------ public catalogue */
let catFilter = 'all';
route(/^\/catalog$/, () => {
  const subj = [...new Set(S.groups.map(g => g.subject))];
  const gs = S.groups.filter(g => catFilter === 'all' || g.subject === catFilter);
  return `<div class="pub"><header class="pubtop"><div class="in"><a href="#/" class="brand"><img class="mk" src="icons/mark.svg" alt=""><img src="img/logo_sabaq.png" alt="Sabaq"></a><nav><a href="#/catalog" class="on">Каталог</a><a href="#/">Для учебных центров</a></nav><div class="right"><a class="btn ghost sm" href="#/">Войти</a></div></div></header>
  <section class="pubhero"><span class="live"><span class="dot"></span>Обновляется из расписания центров</span><h1>Свободные места в учебных центрах ${esc(S.center.city)}</h1><p>Не объявление месячной давности: набранная группа исчезает отсюда сама. Первый урок — пробный и бесплатный.</p></section>
  <div class="filters" role="group" aria-label="Направление"><button class="chip ${catFilter === 'all' ? 'on' : ''}" data-act="cat" data-v="all">Все</button>${subj.map(x => `<button class="chip ${catFilter === x ? 'on' : ''}" data-act="cat" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
  <div class="offers">${gs.map(g => { const n = groupStudents(g.id).length, free = g.capacity - n; return `<article class="offer"><div><h3>${esc(g.name)}</h3><div class="meta">${esc(S.center.name)} · ${esc(S.center.address)} · ${esc(g.age)}<br>${g.slots.map(s => DOW[s.dow]).join(', ')} в ${g.slots[0].start} · ${money(perLesson(g))} за урок, пакетом ${money(g.pkgPrice)}</div></div>
    <div class="seats"><div class="s" aria-hidden="true">${[...Array(g.capacity)].map((_, i) => `<i class="${i >= n ? 'free' : ''}"></i>`).join('')}</div><span>${free > 0 ? `свободно ${free} из ${g.capacity}` : 'группа набрана'}</span></div>
    ${free > 0 ? `<button class="btn" data-act="trial" data-id="${g.id}">Пробный урок</button>` : `<button class="btn ghost" disabled>Мест нет</button>`}</article>`; }).join('')}</div><footer class="pubfoot"><span>© 2026 Sabaq</span><span>Места — из живого расписания центров</span></footer></div>`;
});

/* ------------------------------------------------------------------ actions */
const A = {};
A.reset = () => { localStorage.removeItem(KEY); S = seed(); save(); teacherDone = null; teacherLesson = null; toast('Демо-данные созданы заново'); render(); };
A.week = el => { const d = +el.dataset.d; weekOffset = d === 0 ? 0 : weekOffset + d; render(); };
A['lead-done'] = el => { const l = S.leads.find(x => x.id === el.dataset.id); l.status = 'done'; save(); toast('Заявка обработана'); render(); };
A.cat = el => { catFilter = el.dataset.v; render(); };
A.tpick = el => { teacherLesson = el.dataset.id; teacherDraft = {}; teacherDone = null; if (location.hash !== '#/t/today') location.hash = '/t/today'; else render(); };
A.tmonth = el => { payMonth = +el.dataset.m; render(); };
A.tedit = () => { teacherDone = null; render(); };
A.setmark = el => {
  const draft = $('#modal').hidden ? teacherDraft : modalDraft;
  draft[el.dataset.sid] = el.dataset.m;
  el.parentElement.querySelectorAll('button').forEach(b => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
};
A.tcommit = () => {
  const L = S.lessons.find(l => l.id === teacherLesson);
  const html = commitMarks(L, teacherDraft); teacherDone = L.id; render(); $('#chain').innerHTML = html;
};
A.remind = el => {
  const s = STU(el.dataset.id), g = G(s.gid), b = balance(s.id);
  const text = b < 0 ? `Здравствуйте, ${s.parent.split(' ')[0]}! ${s.name.split(' ')[0]} посетил(а) ${lessonsWord(-b)} сверх абонемента в группе «${g.name}». К оплате ${money(debt(s.id))}. Оплатить можно по Kaspi QR в кабинете Sabaq. ${S.center.name}`
    : `Здравствуйте, ${s.parent.split(' ')[0]}! У ${s.name.split(' ')[0]} ${b <= 1 ? 'заканчивается абонемент' : 'осталось ' + lessonsWord(b)} в группе «${g.name}». Продлить можно по Kaspi QR в кабинете Sabaq. ${S.center.name}`;
  modal(`<h2>Напоминание в WhatsApp</h2><div class="sub">${esc(s.parent)} · ${esc(s.phone)}</div><div class="field"><label for="rt">Текст</label><textarea id="rt" rows="5" style="border:1px solid var(--line);border-radius:8px;padding:10px 12px;resize:vertical">${esc(text)}</textarea></div><div class="actions"><button class="btn ghost" data-close>Закрыть</button><button class="btn teal" id="copy">${ic('send', 18)}Скопировать текст</button></div>`, d => {
    $('#copy', d).onclick = async () => { const v = $('#rt', d).value; try { await navigator.clipboard.writeText(v); } catch (e) { $('#rt', d).select(); document.execCommand('copy'); } closeModal(); toast('Текст скопирован — вставьте в чат WhatsApp'); };
  });
};
function payDialog(s, fromParent) {
  const g = G(s.gid);
  modal(`<h2>${fromParent ? 'Оплата через Kaspi QR' : 'Принять оплату'}</h2><div class="sub">${esc(s.name)} · ${esc(g.name)}</div>
    <form id="pf">
      <div class="field"><label for="pk">Пакет</label><select id="pk">${[1, 2].map(k => `<option value="${k}">${lessonsWord(g.pkgLessons * k)} — ${money(g.pkgPrice * k)}</option>`).join('')}</select></div>
      ${fromParent ? `<div class="qr">${qrSvg(s.id + g.id)}<div class="small muted" style="margin-top:8px">Отсканируйте в приложении Kaspi.kz · демо-код</div></div>` : `<div class="field"><label for="pm">Способ</label><select id="pm"><option value="kaspi">Kaspi QR</option><option value="cash">Наличные</option></select></div>`}
      <div class="actions"><button type="button" class="btn ghost" data-close>Отмена</button><button class="btn teal" type="submit">${fromParent ? 'Я оплатил(а) в Kaspi' : 'Провести оплату'}</button></div>
    </form>`, d => {
    $('#pf', d).onsubmit = e => {
      e.preventDefault(); const k = +$('#pk', d).value;
      S.payments.push({ id: uid('p'), sid: s.id, date: T, amount: g.pkgPrice * k, lessons: g.pkgLessons * k, method: fromParent ? 'kaspi' : $('#pm', d).value }); save(); closeModal();
      toast(fromParent ? `Оплата ${money(g.pkgPrice * k)} прошла и сразу видна центру` : `Оплата ${money(g.pkgPrice * k)} проведена: +${lessonsWord(g.pkgLessons * k)}`); render();
    };
  });
}
A.pay = el => payDialog(STU(el.dataset.id), false);
A.ppay = el => payDialog(STU(el.dataset.id), true);
let modalDraft = {};
A.mark = el => {
  const l = S.lessons.find(x => x.id === el.dataset.id), g = G(l.gid);
  if (l.date > T) { toast(`Этот урок ещё впереди — ${rel(l.date)} в ${l.start}`); return; }
  modalDraft = l.status === 'held' ? { ...l.marks } : {};
  modal(`<h2>${esc(g.name)}</h2><div class="sub">${rel(l.date)}, ${l.start} · ${esc(TCH(g.teacherId).name)} · ${esc(ROOM(g.roomId).name)}</div>
    <div id="mbox"><div class="mark">${markRows(l, modalDraft)}</div><div class="actions"><button class="btn ghost" data-close>Отмена</button><button class="btn teal" id="mok">${ic('check', 18)}${l.status === 'held' ? 'Сохранить' : 'Урок проведён'}</button></div></div>`, d => {
    $('#mok', d).onclick = () => { $('#mbox', d).innerHTML = commitMarks(l, modalDraft) + `<div class="actions"><button class="btn" data-close>Готово</button></div>`; render(); };
  });
};
A.trial = el => {
  const g = G(el.dataset.id);
  modal(`<h2>Пробный урок</h2><div class="sub">${esc(g.name)} · ${g.slots.map(s => DOW[s.dow]).join(', ')} в ${g.slots[0].start}</div>
    <form id="tf"><div class="field"><label for="tn">Как к вам обращаться</label><input id="tn" required placeholder="Например, мама Алана" autocomplete="name"></div>
    <div class="field"><label for="tp">Телефон для WhatsApp</label><input id="tp" required inputmode="tel" placeholder="+7 7__ ___ __ __" autocomplete="tel"></div>
    <div class="actions"><button type="button" class="btn ghost" data-close>Отмена</button><button class="btn" type="submit">Отправить заявку</button></div></form>`, d => {
    $('#tf', d).onsubmit = e => { e.preventDefault(); S.leads.push({ id: uid('l'), name: $('#tn', d).value.trim(), phone: $('#tp', d).value.trim(), gid: g.id, date: T, status: 'new' }); save(); closeModal(); toast('Заявка отправлена центру — вам напишут в WhatsApp'); };
  });
};
A['add-student'] = () => {
  modal(`<h2>Новый ученик</h2><div class="sub">Остаток занятий можно перенести из старой таблицы</div>
    <form id="sf"><div class="field"><label for="sn">Имя и фамилия</label><input id="sn" required></div>
    <div class="grid2"><div class="field"><label for="sp">Родитель</label><input id="sp" required></div><div class="field"><label for="st">Телефон</label><input id="st" required inputmode="tel" placeholder="+7 7__ ___ __ __"></div></div>
    <div class="field"><label for="sg">Группа</label><select id="sg">${S.groups.map(g => { const free = g.capacity - groupStudents(g.id).length; return `<option value="${g.id}" ${free <= 0 ? 'disabled' : ''}>${esc(g.name)} — ${free > 0 ? 'свободно ' + free : 'мест нет'}</option>`; }).join('')}</select></div>
    <div class="field"><label for="so">Перенести остаток занятий (если был)</label><input id="so" type="number" value="0" min="-20" max="50"></div>
    <div class="actions"><button type="button" class="btn ghost" data-close>Отмена</button><button class="btn" type="submit">Добавить ученика</button></div></form>`, d => {
    $('#sf', d).onsubmit = e => {
      e.preventDefault(); const id = uid('s');
      S.students.push({ id, name: $('#sn', d).value.trim(), parent: $('#sp', d).value.trim(), phone: $('#st', d).value.trim(), gid: $('#sg', d).value, since: T });
      const o = +$('#so', d).value || 0; if (o) S.payments.push({ id: uid('p'), sid: id, date: T, amount: 0, lessons: o, method: 'import' });
      save(); closeModal(); toast('Ученик добавлен'); location.hash = '/o/s/' + id;
    };
  });
};
A.import = () => {
  modal(`<h2>Импорт из Excel</h2><div class="sub">Сохраните таблицу как CSV: имя; родитель; телефон; группа; остаток занятий</div>
    <div class="field"><label for="fi">Файл CSV</label><input id="fi" type="file" accept=".csv,text/csv" style="padding-top:8px"></div>
    <div id="ires" class="small muted" style="margin-top:10px">Группа — точное название из Sabaq, например «${esc(S.groups[0].name)}».</div>
    <div class="actions"><button class="btn ghost" id="tpl">${ic('down', 18)}Шаблон</button><button class="btn ghost" data-close>Закрыть</button></div>`, d => {
    $('#tpl', d).onclick = () => download('sabaq-import-template.csv', `имя;родитель;телефон;группа;остаток\nАлан Сеитов;Жанар Сеитова;+7 701 000 00 00;${S.groups[3].name};4\n`);
    $('#fi', d).onchange = async e => {
      const f = e.target.files[0]; if (!f) return; const text = await f.text(); let ok = 0; const bad = [];
      text.split(/\r?\n/).slice(1).filter(x => x.trim()).forEach((line, i) => {
        const [name, parent, phone, gname, left] = line.split(/[;,\t]/).map(x => (x || '').trim());
        const g = S.groups.find(x => x.name.toLowerCase() === (gname || '').toLowerCase());
        if (!name || !g) { bad.push(i + 2); return; }
        const id = uid('s'); S.students.push({ id, name, parent: parent || '—', phone: phone || '—', gid: g.id, since: T });
        if (+left) S.payments.push({ id: uid('p'), sid: id, date: T, amount: 0, lessons: +left, method: 'import' }); ok++;
      });
      save(); $('#ires', d).innerHTML = `<span class="pill ok">Добавлено: ${ok}</span> ${bad.length ? `<span class="pill bad">Не распознаны строки: ${bad.join(', ')}</span> — проверьте название группы` : ''}`; render();
    };
  });
};
A['add-group'] = () => {
  modal(`<h2>Новая группа</h2><div class="sub">Sabaq проверит, свободны ли преподаватель и аудитория</div>
    <form id="gf2"><div class="field"><label for="gn">Название</label><input id="gn" required placeholder="Например, ЕНТ: физика"></div>
    <div class="grid2"><div class="field"><label for="gt">Преподаватель</label><select id="gt">${S.teachers.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="gr">Аудитория</label><select id="gr">${S.rooms.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="gd">День</label><select id="gd">${[1, 2, 3, 4, 5, 6].map(i => `<option value="${i}">${DOWF[i]}</option>`).join('')}</select></div>
    <div class="field"><label for="gs">Начало</label><input id="gs" type="time" value="18:00" step="900" required></div>
    <div class="field"><label for="gu">Длительность, мин</label><input id="gu" type="number" value="90" min="30" max="240" step="15"></div>
    <div class="field"><label for="gc">Мест</label><input id="gc" type="number" value="10" min="1" max="40"></div>
    <div class="field"><label for="gl">Занятий в пакете</label><input id="gl" type="number" value="8" min="1" max="48"></div>
    <div class="field"><label for="gp">Цена пакета, ₸</label><input id="gp" type="number" value="32000" min="0" step="500"></div></div>
    <div id="gerr"></div>
    <div class="actions"><button type="button" class="btn ghost" data-close>Отмена</button><button class="btn" type="submit">Создать группу</button></div></form>`, d => {
    $('#gf2', d).onsubmit = e => {
      e.preventDefault();
      const sl = { dow: +$('#gd', d).value, start: $('#gs', d).value, dur: +$('#gu', d).value };
      const tId = $('#gt', d).value, rId = $('#gr', d).value; const a0 = mins(sl.start), a1 = a0 + sl.dur;
      for (const g of S.groups) for (const x of g.slots) {
        if (x.dow !== sl.dow) continue; const b0 = mins(x.start), b1 = b0 + x.dur; if (a0 >= b1 || b0 >= a1) continue;
        const who = g.teacherId === tId ? `${TCH(tId).name} в это время ведёт «${g.name}»` : g.roomId === rId ? `${ROOM(rId).name} занята группой «${g.name}»` : null;
        if (who) { $('#gerr', d).innerHTML = `<div class="err">${esc(who)} (${DOWF[x.dow]}, ${x.start}–${hhmm(b1)}). Выберите другое время${g.teacherId === tId ? ' или преподавателя' : ' или аудиторию'}.</div>`; return; }
      }
      const g = { id: uid('g'), name: $('#gn', d).value.trim(), subject: TCH(tId).subject, teacherId: tId, roomId: rId, slots: [sl], capacity: +$('#gc', d).value, pkgLessons: +$('#gl', d).value, pkgPrice: +$('#gp', d).value, age: 'по записи' };
      S.groups.push(g);
      for (let i = 0; i < 28; i++) { const day = addDays(TODAY, i); if (day.getDay() === sl.dow) S.lessons.push(mkLesson(g, iso(day), sl)); }
      save(); closeModal(); toast(`Группа «${g.name}» создана и уже видна в каталоге`); render();
    };
  });
};
A.csv = () => {
  const rows = [['Преподаватель', 'Предмет', 'Уроков', 'Ставка', 'К выплате'], ...payroll().map(x => [x.t.name, x.t.subject, x.n, x.t.rate, x.sum])];
  download(`sabaq-зарплата-${iso(TODAY).slice(0, 7)}.csv`, '﻿' + rows.map(r => r.join(';')).join('\n')); toast('Файл зарплаты скачан');
};
function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

document.addEventListener('click', e => {
  const sc = e.target.closest('[data-scroll]');
  if (sc) { e.preventDefault(); const t = document.getElementById(sc.getAttribute('href').slice(1)); if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
  const el = e.target.closest('[data-act]'); if (el && A[el.dataset.act]) { e.preventDefault(); A[el.dataset.act](el); return; }
  const go = e.target.closest('[data-go]'); if (go && !e.target.closest('a,button')) location.hash = go.dataset.go.slice(1);
});
document.addEventListener('keydown', e => { const go = e.target.closest && e.target.closest('[data-go]'); if (go && e.key === 'Enter') location.hash = go.dataset.go.slice(1); });
document.addEventListener('input', e => {
  const k = e.target.dataset.input; if (!k) return;
  if (k === 'q') { studentQuery = e.target.value; const pos = e.target.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); }
});
document.addEventListener('change', e => {
  const k = e.target.dataset.input; if (!k) return;
  if (k === 'gf') { studentFilter = e.target.value; render(); }
  if (k === 'gsearch') { studentQuery = e.target.value; studentFilter = 'all'; if (location.hash !== '#/o/students') location.hash = '/o/students'; else render(); }
  if (k === 'policy') { S.policy.chargeAbsent = e.target.checked; save(); toast(e.target.checked ? 'Пропуски без причины теперь списываются' : 'Пропуски больше не списываются — остатки пересчитаны'); render(); }
  if (k === 'teacher') { teacherId = e.target.value; teacherLesson = null; teacherDone = null; render(); }
  if (k === 'child') { childId = e.target.value; render(); }
});

load(); render();
})();
