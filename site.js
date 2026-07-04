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
function priceBlock(p){
  if(p.type === "request"){
    return '<a class="req-btn" href="kontakty.html#form">Узнать цену</a>';
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
        priceBlock(e.price)+
        (isReq ? '' : '<a class="more" href="kontakty.html#form">Оставить заявку →</a>')+
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
});
