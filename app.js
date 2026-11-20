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
    { id: 't1', name: 'Айгерим Нурланова', subject: 'Математика', rate: 6000 },
    { id: 't2', name: 'Данияр Сейтказы', subject: 'Английский', rate: 7000 },
    { id: 't3', name: 'Тимур Ахметов', subject: 'Программирование', rate: 6500 },
    { id: 't4', name: 'Сауле Жумабаева', subject: 'Подготовка к НИШ', rate: 5500 },
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
  for (let d = addDays(monday, -28); d < addDays(monday, 28); d = addDays(d, 1)) {
    groups.forEach(g => g.slots.forEach(sl => { if (sl.dow === d.getDay()) lessons.push(mkLesson(g, iso(d), sl)); }));
  }
  const payments = [];
  students.forEach(s => {
    const g = groups.find(x => x.id === s.gid);
    payments.push({ id: uid('p'), sid: s.id, date: iso(addDays(TODAY, -28)), amount: 0, lessons: Math.floor(rnd() * 6) - 1, method: 'import' });
    payments.push({ id: uid('p'), sid: s.id, date: iso(addDays(TODAY, -27 + Math.floor(rnd() * 14))), amount: g.pkgPrice, lessons: g.pkgLessons, method: rnd() < 0.8 ? 'kaspi' : 'cash' });
    if (rnd() < 0.35) payments.push({ id: uid('p'), sid: s.id, date: iso(addDays(TODAY, -12 + Math.floor(rnd() * 12))), amount: g.pkgPrice, lessons: g.pkgLessons, method: rnd() < 0.85 ? 'kaspi' : 'cash' });
  });
  // mark the past; leave one recent lesson unmarked so the dashboard has something to flag
  const past = lessons.filter(l => l.date < T).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const leaveOpen = [...past].reverse().find(l => l.gid === 'g5');
  past.forEach(l => {
    if (l === leaveOpen) return;
    l.status = 'held';
    students.filter(s => s.gid === l.gid).forEach(s => { const r = rnd(); l.marks[s.id] = r < 0.86 ? 'p' : r < 0.93 ? 'a' : 'e'; });
  });
  const leads = [{ id: uid('l'), name: 'Мама Алана, 9 лет', phone: '+7 701 555 21 40', gid: 'g4', date: iso(addDays(TODAY, -1)), status: 'new' }];
  return { v: 1, seededOn: T, center: { name: 'IQ Academy', city: 'Алматы', address: 'ул. Байзакова, 280' }, policy: { chargeAbsent: true }, teachers, rooms, groups, students, lessons, payments, leads, sent: [] };
}
function mkLesson(g, date, sl) { return { id: `${g.id}_${date}_${sl.start}`, gid: g.id, date, start: sl.start, dur: sl.dur, status: 'planned', marks: {} }; }

let S;
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  const stale = S && (TODAY - parse(S.seededOn)) / 864e5 > 6;
  if (!S || S.v !== 1 || stale) { S = seed(); save(); }
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
<main class="login">
  <section class="login-hero">
    <img src="img/logo_sabaq_light.png" alt="Sabaq">
    <div class="pitch">
      <h1>Каждый урок посчитан</h1>
      <p>Преподаватель отмечает урок — и Sabaq сам списывает занятие с абонемента, обновляет долг, сообщает родителю и начисляет зарплату.</p>
      <div class="ledger-demo" aria-hidden="true">
        <div><span class="dot"></span>Урок «ЕНТ: математика» проведён<b>10 учеников</b></div>
        <div><span class="dot"></span>Списано с абонементов<b>−10 занятий</b></div>
        <div><span class="dot"></span>Родителям: «осталось 7 занятий»<b>отправлено</b></div>
        <div><span class="dot"></span>Зарплата преподавателя<b>+6 000 ₸</b></div>
      </div>
    </div>
    <div class="foot">MVP · данные демонстрационные и хранятся только в этом браузере</div>
  </section>
  <section class="login-side">
    <h2>Войти как</h2>
    <p class="muted">Учебный центр «${esc(S.center.name)}», ${esc(S.center.city)}. Пароль в демо не нужен.</p>
    <div class="roles">
      <a class="role owner" href="#/o/home"><span class="ic">${ic('home', 22)}</span><span><b>Владелец центра</b><span>Деньги, долги, расписание, зарплаты</span></span>${ic('chev')}</a>
      <a class="role" href="#/t"><span class="ic">${ic('teacher', 22)}</span><span><b>Преподаватель</b><span>Отметить урок за 10 секунд, с телефона</span></span>${ic('chev')}</a>
      <a class="role" href="#/p"><span class="ic">${ic('user', 22)}</span><span><b>Родитель</b><span>Сколько занятий осталось, оплата через Kaspi QR</span></span>${ic('chev')}</a>
      <a class="role" href="#/catalog"><span class="ic">${ic('store', 22)}</span><span><b>Каталог для родителей</b><span>Свободные места из живого расписания</span></span>${ic('chev')}</a>
    </div>
    <p class="note">Демо пересоздаётся раз в неделю. <button class="btn ghost sm" data-act="reset">${ic('reset', 16)}Сбросить демо-данные</button></p>
  </section>
</main>`);

/* ------------------------------------------------------------------ owner shell */
function shell(active, body) {
  const n = unmarked().length + S.leads.filter(l => l.status === 'new').length;
  const nav = [['home', 'home', 'Главная', n], ['students', 'users', 'Ученики'], ['schedule', 'cal', 'Расписание'], ['finance', 'wallet', 'Финансы'], ['catalog', 'store', 'Каталог']];
  return `<div class="shell"><aside class="side">
    <img class="logo" src="img/logo_sabaq_light.png" alt="Sabaq">
    <div class="center">${esc(S.center.name)} · ${esc(S.center.city)}</div>
    <nav class="nav" aria-label="Разделы">${nav.map(([k, i, t, b]) => `<a href="#/o/${k}" class="${active === k ? 'on' : ''}"${active === k ? ' aria-current="page"' : ''}>${ic(i)}<span>${t}</span>${b ? `<span class="badge">${b}</span>` : ''}</a>`).join('')}</nav>
    <div class="bottom nav"><a href="#/t">${ic('teacher')}<span>Вид преподавателя</span></a><a href="#/p">${ic('user')}<span>Вид родителя</span></a><a href="#/">${ic('out')}<span>Сменить роль</span></a></div>
  </aside><main class="main">${body}</main></div>`;
}
const head = (title, sub, actions = '') => `<div class="head"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="row">${actions}</div></div>`;
const who = (name, sub) => `<div class="who"><span class="av">${esc(initials(name))}</span><div><div>${esc(name)}</div>${sub ? `<div class="small muted">${sub}</div>` : ''}</div></div>`;
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
      <section class="panel"><h2>Родитель</h2>${who(s.parent, esc(s.phone))}<p class="small muted" style="margin-top:12px">Видит остаток занятий и платит через Kaspi QR в своём кабинете.</p><a class="btn ghost sm" style="margin-top:12px" href="#/p/${id}">Открыть как родитель</a></section>
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

/* ------------------------------------------------------------------ teacher (mobile) */
let teacherId = 't1', teacherLesson = null, teacherDraft = {}, teacherDone = null;
route(/^\/t$/, () => {
  const t = TCH(teacherId);
  const mine = S.lessons.filter(l => G(l.gid).teacherId === teacherId);
  const today = mine.filter(l => l.date === T).sort((a, b) => a.start.localeCompare(b.start));
  const overdue = mine.filter(l => l.status === 'planned' && l.date < T);
  const next = mine.filter(l => l.date > T).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 2);
  const list = [...overdue, ...today];
  if (!teacherLesson || !list.find(l => l.id === teacherLesson)) { const firstOpen = list.find(l => l.status === 'planned') || list[0]; teacherLesson = firstOpen ? firstOpen.id : null; teacherDraft = {}; }
  const L = S.lessons.find(l => l.id === teacherLesson);
  if (L && L.status === 'held' && !Object.keys(teacherDraft).length) teacherDraft = { ...L.marks };
  return `<div class="mobile"><div class="screen">
  <header class="mtop"><div class="bar"><img src="img/logo_sabaq_light.png" alt="Sabaq"><a class="exit" href="#/">Выйти</a></div>
    <h1>${esc(t.name.split(' ')[0])}, ${(n => n ? `${n} ${plural(n, 'урок', 'урока', 'уроков')} к отметке` : list.length ? 'всё отмечено' : 'сегодня уроков нет')(list.filter(l => l.status === 'planned').length)}</h1>
    <p>${DOWF[TODAY.getDay()]}, ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]} · <label for="tsel" class="sr">Преподаватель</label><select id="tsel" data-input="teacher" style="background:transparent;border:0;color:#B6C7D8;font-size:14px">${S.teachers.map(x => `<option value="${x.id}" ${x.id === teacherId ? 'selected' : ''} style="color:#0F3355">${esc(x.name)}</option>`).join('')}</select></p></header>
  <div class="mbody">
    ${list.length ? `<div class="lessonpick">${list.map(l => { const g = G(l.gid); return `<button class="${l.id === teacherLesson ? 'on' : ''}" data-act="tpick" data-id="${l.id}"><span class="t num">${l.start}</span><span><b>${esc(g.name)}</b><div class="small muted">${rel(l.date)} · ${esc(ROOM(g.roomId).name)}</div></span>${l.status === 'held' ? '<span class="pill ok">отмечен</span>' : l.date < T ? '<span class="pill bad">просрочен</span>' : '<span class="pill n">к отметке</span>'}</button>`; }).join('')}</div>` : `<div class="mcard empty">Отмечать нечего. Ближайшие уроки: ${next.map(l => `${rel(l.date)} в ${l.start}`).join(', ') || 'не запланированы'}.</div>`}
    ${L ? (teacherDone === L.id ? `<div class="mcard"><h2 style="margin-bottom:6px">Готово. Вот что сделал Sabaq</h2><div id="chain"></div></div>
      <button class="btn ghost" data-act="tedit">Исправить отметки</button>` : `<div class="mcard"><h2 style="margin-bottom:4px">${esc(G(L.gid).name)}</h2><div class="small muted" style="margin-bottom:10px">По умолчанию все пришли — отметьте только отсутствующих</div><div class="mark">${markRows(L, teacherDraft)}</div></div>`) : ''}
  </div>
  ${L && teacherDone !== L.id ? `<div class="sticky-cta"><button class="btn teal lg" data-act="tcommit">${ic('check', 20)}${L.status === 'held' ? 'Сохранить исправления' : `Урок проведён · ${groupStudents(L.gid).length} ${plural(groupStudents(L.gid).length, 'ученик', 'ученика', 'учеников')}`}</button></div>` : ''}
  </div></div>`;
});

/* ------------------------------------------------------------------ parent (mobile) */
route(/^\/p(?:\/(\w+))?$/, sid => {
  const s = STU(sid) || STU('s1'); const g = G(s.gid); const b = balance(s.id);
  const rows = ledger(s.id).reverse().slice(0, 8);
  const upcoming = S.lessons.filter(l => l.gid === g.id && l.date >= T && l.status === 'planned').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 3);
  const pips = [...Array(Math.min(Math.max(g.pkgLessons, b), 24))].map((_, i) => `<i class="${i < b ? 'left' : ''}"></i>`).join('') + (b < 0 ? [...Array(Math.min(-b, 12))].map(() => '<i class="debt"></i>').join('') : '');
  return `<div class="mobile"><div class="screen">
  <header class="mtop"><div class="bar"><img src="img/logo_sabaq_light.png" alt="Sabaq"><a class="exit" href="#/">Выйти</a></div>
    <h1>${esc(s.parent.split(' ')[0])}, здравствуйте</h1><p><label for="psel" class="sr">Ребёнок</label><select id="psel" data-input="child" style="background:transparent;border:0;color:#B6C7D8;font-size:14px">${S.students.map(x => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''} style="color:#0F3355">${esc(x.name)}</option>`).join('')}</select></p></header>
  <div class="mbody">
    <div class="parent-balance"><div class="small" style="color:#B6C7D8">${esc(s.name.split(' ')[0])} · ${esc(g.name)}</div>
      <div class="row" style="align-items:baseline;margin-top:8px"><span class="big num">${b}</span><span style="color:#C4D3E2">${b < 0 ? plural(-b, 'занятие в долг', 'занятия в долг', 'занятий в долг') : plural(b, 'занятие осталось', 'занятия осталось', 'занятий осталось')}</span></div>
      <div class="pips" aria-hidden="true">${pips}</div>
      <p>${b < 0 ? `К оплате ${money(debt(s.id))}. Оплатите, чтобы ${esc(s.name.split(' ')[0])} продолжал заниматься.` : b <= 1 ? 'Абонемент почти закончился — продлите заранее.' : 'Списывается только за проведённые уроки.'}</p>
      <button class="btn teal lg" style="width:100%;margin-top:14px" data-act="ppay" data-id="${s.id}">${ic('qr', 20)}Оплатить через Kaspi QR</button></div>
    <div class="mcard"><h3 style="margin-bottom:8px">Ближайшие уроки</h3>${upcoming.map(l => `<div class="row" style="justify-content:space-between;padding:6px 0"><span>${rel(l.date)}</span><span class="muted">${l.start} · ${esc(ROOM(g.roomId).name)}</span></div>`).join('') || '<div class="muted">Не запланированы</div>'}</div>
    <div class="mcard"><h3 style="margin-bottom:4px">Что списано и оплачено</h3><div class="hist">${rows.map(r => r.kind === 'pay' ? `<div><span class="small muted">${fdate(r.date)}</span><span>${r.p.method === 'import' ? 'Остаток перенесён' : 'Оплата ' + money(r.p.amount)}</span><b class="teal">+${r.p.lessons}</b></div>` : `<div><span class="small muted">${fdate(r.date)}</span><span>${r.m === 'p' ? 'Урок проведён' : r.m === 'a' ? 'Пропуск' : 'Пропуск, перенесён'}</span><b class="${charges(r.m) ? '' : 'muted'}">${charges(r.m) ? '−1' : '0'}</b></div>`).join('')}</div></div>
    <p class="small muted" style="text-align:center;padding:8px">Вопрос по оплате — центр «${esc(S.center.name)}» отвечает в WhatsApp</p>
  </div></div></div>`;
});

/* ------------------------------------------------------------------ public catalogue */
let catFilter = 'all';
route(/^\/catalog$/, () => {
  const subj = [...new Set(S.groups.map(g => g.subject))];
  const gs = S.groups.filter(g => catFilter === 'all' || g.subject === catFilter);
  return `<div class="pub"><header class="pubtop"><div class="in"><img src="img/logo_sabaq.png" alt="Sabaq"><span class="muted small" style="margin-left:auto">Каталог · ${esc(S.center.city)}</span><a class="btn ghost sm" href="#/">Войти</a></div></header>
  <section class="pubhero"><span class="live"><span class="dot"></span>Места обновляются из расписания центров</span><h1 style="margin-top:12px">Свободные места в учебных центрах Алматы</h1><p>Не объявление месячной давности: если группа набрана, она пропадёт отсюда сама. Первый урок — пробный.</p></section>
  <div class="filters" role="group" aria-label="Направление"><button class="chip ${catFilter === 'all' ? 'on' : ''}" data-act="cat" data-v="all">Все</button>${subj.map(x => `<button class="chip ${catFilter === x ? 'on' : ''}" data-act="cat" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
  <div class="offers">${gs.map(g => { const n = groupStudents(g.id).length, free = g.capacity - n; return `<article class="offer"><div><h3>${esc(g.name)}</h3><div class="meta">${esc(S.center.name)} · ${esc(S.center.address)} · ${esc(g.age)}<br>${g.slots.map(s => DOW[s.dow]).join(', ')} в ${g.slots[0].start} · ${money(perLesson(g))} за урок, пакетом ${money(g.pkgPrice)}</div></div>
    <div class="seats"><div class="s" aria-hidden="true">${[...Array(g.capacity)].map((_, i) => `<i class="${i >= n ? 'free' : ''}"></i>`).join('')}</div><span>${free > 0 ? `свободно ${free} из ${g.capacity}` : 'группа набрана'}</span></div>
    ${free > 0 ? `<button class="btn" data-act="trial" data-id="${g.id}">Пробный урок</button>` : `<button class="btn ghost" disabled>Мест нет</button>`}</article>`; }).join('')}</div></div>`;
});

/* ------------------------------------------------------------------ actions */
const A = {};
A.reset = () => { localStorage.removeItem(KEY); S = seed(); save(); teacherDone = null; teacherLesson = null; toast('Демо-данные созданы заново'); render(); };
A.week = el => { const d = +el.dataset.d; weekOffset = d === 0 ? 0 : weekOffset + d; render(); };
A['lead-done'] = el => { const l = S.leads.find(x => x.id === el.dataset.id); l.status = 'done'; save(); toast('Заявка обработана'); render(); };
A.cat = el => { catFilter = el.dataset.v; render(); };
A.tpick = el => { teacherLesson = el.dataset.id; teacherDraft = {}; teacherDone = null; render(); };
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
  if (k === 'policy') { S.policy.chargeAbsent = e.target.checked; save(); toast(e.target.checked ? 'Пропуски без причины теперь списываются' : 'Пропуски больше не списываются — остатки пересчитаны'); render(); }
  if (k === 'teacher') { teacherId = e.target.value; teacherLesson = null; teacherDone = null; render(); }
  if (k === 'child') { location.hash = '/p/' + e.target.value; }
});

load(); render();
})();
