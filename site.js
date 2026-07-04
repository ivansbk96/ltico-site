/* ==========================================================================
   site.js — общая логика: бургер-меню, галерея и отрисовка каталога
   Требует, чтобы catalog.js (и, если есть галерея, gallery.js) были
   подключены ДО этого файла.

   Страница каталога сообщает своё направление через
   <body data-direction="logistics"> или <body data-direction="special">.
   Без этого атрибута сетка/фильтры каталога просто не рендерятся —
   так безопасно подключать site.js на страницах без каталога (главная).
   ========================================================================== */

let pageDirection = null;
let activeCat = "all";

/* иконка-заглушка по направлению (пока нет реальных фото) */
function phIcon(dir){
  const c = dir === "logistics" ? "#8FA0C9" : "#C2825A";
  return dir === "logistics"
    ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="'+c+'" stroke-width="1.4"/><circle cx="7" cy="17" r="1.4" stroke="'+c+'" stroke-width="1.4"/><circle cx="17" cy="17" r="1.4" stroke="'+c+'" stroke-width="1.4"/></svg>'
    : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M4 18v-4l4-1 2-4h3l2 3 3 1v5z" stroke="'+c+'" stroke-width="1.4" stroke-linejoin="round"/><circle cx="8" cy="18" r="1.4" stroke="'+c+'" stroke-width="1.4"/><circle cx="17" cy="18" r="1.4" stroke="'+c+'" stroke-width="1.4"/></svg>';
}
const fmtNum = n => n.toLocaleString("ru-RU");

/* блок цены по типу */
function priceBlock(e){
  const p = e.price;
  if(p.type === "request"){
    return '<button type="button" class="req-btn" data-modal-dir="'+e.direction+'" data-modal-name="'+e.name+'">Узнать цену</button>';
  }
  if(p.type === "shift"){
    return '<div><span class="price"><span class="from">от</span> '+fmtNum(p.from)+' ₽<small>/'+p.unit+'</small></span>'+
           '<div class="shift-note">смена 7+1 (7 ч работы + 1 ч доставка)</div></div>';
  }
  if(p.type === "trip"){
    const mats = p.materials ? '<div class="mat">'+p.materials.map(m=>'<span>'+m+'</span>').join('')+'</div>' : '';
    return '<div><span class="price"><span class="from">от</span> '+fmtNum(p.from)+' ₽<small>/'+p.unit+'</small></span>'+mats+'</div>';
  }
  return '';
}

/* техника текущей страницы: только её направление + активный фильтр категории */
function itemsForPage(){
  if(!pageDirection || typeof EQUIPMENT === "undefined") return [];
  return EQUIPMENT.filter(e => e.direction === pageDirection &&
    (activeCat === "all" || e.category === activeCat));
}

function renderGrid(){
  const grid = document.getElementById("grid");
  if(!grid) return;
  const items = itemsForPage();
  grid.innerHTML = items.map(e => {
    const cat = CATEGORIES.find(c => c.id === e.category);
    const isReq = e.price.type === "request";
    const img = e.image ? '<img src="'+e.image+'" alt="'+e.name+'">' : phIcon(e.direction);
    return '<div class="card"><div class="ph">'+img+'</div><div class="bd">'+
      '<div class="tag">'+cat.label+'</div>'+
      '<h3>'+e.name+'</h3>'+
      '<div class="sp">'+e.specs+'</div>'+
      '<div class="foot'+(isReq?'':' col')+'">'+
        priceBlock(e)+
        (isReq ? '' : '<button type="button" class="more" data-modal-dir="'+e.direction+'" data-modal-name="'+e.name+'">Оставить заявку →</button>')+
      '</div></div></div>';
  }).join('');
}

/* фильтры категорий — только категории текущего направления страницы */
function buildFilters(){
  const f = document.getElementById("filters");
  if(!f || !pageDirection) return;
  let html = '<button class="on" data-c="all">Все</button>';
  CATEGORIES.filter(c => c.direction === pageDirection).forEach(c => {
    html += '<button data-c="'+c.id+'">'+c.label+'</button>';
  });
  f.innerHTML = html;
  f.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => setCat(b.dataset.c));
  });
}
function setCat(c){
  activeCat = c;
  document.querySelectorAll("#filters button").forEach(b =>
    b.classList.toggle("on", b.dataset.c === c));
  renderGrid();
}

/* применить категорию из адреса (?cat=) при заходе по ссылке из мега-меню */
function applyUrlFilter(){
  const cat = new URLSearchParams(location.search).get("cat");
  if(cat) activeCat = cat;
  if(activeCat !== "all"){
    document.querySelectorAll("#filters button").forEach(b =>
      b.classList.toggle("on", b.dataset.c === activeCat));
  }
}

/* бургер-меню */
function initBurger(){
  const burger = document.getElementById("burger");
  const mega = document.getElementById("mega");
  if(burger && mega){
    burger.addEventListener("click", () => mega.classList.toggle("open"));
  }
  const log = document.getElementById("menu-logistics");
  const sp = document.getElementById("menu-special");
  if(typeof CATEGORIES === "undefined") return;
  if(log){
    log.innerHTML = '<a href="logistika.html">Все</a>';
    CATEGORIES.filter(c => c.direction === "logistics").forEach(c => {
      log.innerHTML += '<a href="logistika.html?cat='+c.id+'">'+c.label+'</a>';
    });
  }
  if(sp){
    CATEGORIES.filter(c => c.direction === "special").forEach(c => {
      sp.innerHTML += '<a href="stroytehnika.html?cat='+c.id+'">'+c.label+'</a>';
    });
  }
}

/* поля модалки заявки, разные для логистики и спецтехники */
const MODAL_FIELDS = {
  logistics: [
    { name: "route",  label: "Маршрут (откуда — куда)", placeholder: "Откуда — куда" },
    { name: "weight", label: "Вес и габариты груза",     placeholder: "Например, 12 т / 14×3×3,5 м" }
  ],
  special: [
    { name: "address",   label: "Адрес работы",       placeholder: "Город, объект" },
    { name: "specifics", label: "Специфика работы",   placeholder: "Например, рытьё котлована" }
  ]
};

/* модалка заявки: открывается по клику на кнопку карточки, поля зависят от направления */
function openModal(direction, name){
  const overlay = document.getElementById("modal-overlay");
  if(!overlay) return;
  const dirLabel = direction === "logistics" ? "Логистика" : "Спецтехника";
  document.getElementById("modal-title").textContent = "Заявка на: " + name;
  document.getElementById("modal-subject").value = "Заявка с сайта LTICO — " + dirLabel + " — " + name;

  const extra = MODAL_FIELDS[direction] || [];
  document.getElementById("modal-fields").innerHTML =
    '<div class="field"><label for="modal-name">Имя</label>'+
    '<input id="modal-name" name="name" type="text" placeholder="Как к вам обращаться" required></div>'+
    '<div class="field"><label for="modal-phone">Телефон</label>'+
    '<input id="modal-phone" name="phone" type="tel" placeholder="+7 ___ ___-__-__" required></div>'+
    extra.map((f,i) => '<div class="field"><label for="modal-f'+i+'">'+f.label+'</label>'+
      '<input id="modal-f'+i+'" name="'+f.name+'" type="text" placeholder="'+f.placeholder+'"></div>').join('')+
    '<div class="field full"><label for="modal-message">Комментарий</label>'+
    '<textarea id="modal-message" name="message" rows="4" placeholder="'+
      (direction === "special" ? "Например: объём работ и задачи" : "Тип груза, сроки, особые условия")+
    '"></textarea></div>';

  overlay.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => overlay.classList.add("open"));
  document.getElementById("modal-name").focus();
}
function closeModal(){
  const overlay = document.getElementById("modal-overlay");
  if(!overlay) return;
  overlay.classList.remove("open");
  document.body.classList.remove("modal-open");
  overlay.hidden = true;
}
function initModal(){
  const overlay = document.getElementById("modal-overlay");
  if(!overlay) return;
  document.getElementById("modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if(e.target === overlay) closeModal(); });
  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-modal-dir]");
    if(btn) openModal(btn.dataset.modalDir, btn.dataset.modalName);
  });
}

/* горизонтальная фото-лента "Знакомство с компанией" */
function initGallery(){
  const track = document.getElementById("gallery-track");
  if(!track || typeof GALLERY === "undefined") return;
  track.innerHTML = GALLERY.map(p =>
    '<div class="gs-item">'+
      (p.src
        ? '<img src="'+p.src+'" alt="'+p.caption+'">'
        : '<div class="gs-ph">'+p.caption+'</div>')+
    '</div>'
  ).join('');
  const prev = document.getElementById("gallery-prev");
  const next = document.getElementById("gallery-next");
  const step = () => track.clientWidth * 0.8;
  if(prev) prev.addEventListener("click", () => track.scrollBy({left:-step(), behavior:"smooth"}));
  if(next) next.addEventListener("click", () => track.scrollBy({left:step(), behavior:"smooth"}));
}

document.addEventListener("DOMContentLoaded", () => {
  pageDirection = document.body.dataset.direction || null;
  initBurger();
  buildFilters();
  applyUrlFilter();
  renderGrid();
  initGallery();
  initModal();
});
