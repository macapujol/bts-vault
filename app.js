/* BTS Merch Vault — app
   Datos: archivo data.json en un repositorio privado de GitHub (API de contenidos).
   Esta app no contiene datos ni credenciales: el token se guarda solo en el navegador de cada dispositivo. */
"use strict";

/* ═════════ Constantes ═════════ */
const ARTISTS = ["BTS", "RM", "JIN", "AGUST D", "J-HOPE", "Jimin", "V", "Jungkook"];
const SOLO_ARTISTS = ARTISTS.slice(1);
const MEMBERS = [
  { key: "all", label: "Todo" }, { key: "BTS", label: "BTS" }, { key: "RM", label: "RM" },
  { key: "JIN", label: "Jin" }, { key: "AGUST D", label: "Suga" }, { key: "J-HOPE", label: "J-Hope" },
  { key: "Jimin", label: "Jimin" }, { key: "V", label: "V" }, { key: "Jungkook", label: "Jungkook" },
];
const CATS = ["Album", "Single", "LIVE SHOW", "MUSTER", "Video/Documental", "Media", "VARIETY SHOW", "MEMORIES", "SEASON'S GREETINGS", "SEASON PACKAGE"];
const FMTS = ["CD", "BLU-RAY", "DVD", "Vinyl", "Cassette", "Digital Code", "NFC", "Photobook", "CD+DVD", "CD+BLU-RAY", "Set Book/DVD", "Otros"];
const ORIGS = ["Corea", "Japón", "US/Global", "Otro"];
const FLAGS = (() => {
  const us = (() => { let st = ""; for (let i = 0; i < 13; i += 2) st += `<rect y="${(i * 16 / 13).toFixed(2)}" width="24" height="${(16 / 13).toFixed(2)}" fill="#b22234"/>`;
    let stars = ""; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) stars += `<circle cx="${1.6 + c * 2.3}" cy="${1.5 + r * 2.4}" r=".5" fill="#fff"/>`;
    return `<rect width="24" height="16" fill="#fff"/>${st}<rect width="10.5" height="8.6" fill="#3c3b6e"/>${stars}`; })();
  const tri = a => `<g transform="rotate(${a} 12 8)"><path d="M9.6 2.1h4.8M9.6 3.3h4.8M9.6 4.5h4.8" stroke="#111" stroke-width=".55"/></g>`;
  const kr = `<rect width="24" height="16" fill="#fff"/><path d="M8.8 8a3.2 3.2 0 0 1 6.4 0a1.6 1.6 0 0 1-3.2 0a1.6 1.6 0 0 0-3.2 0z" fill="#cd2e3a"/><path d="M8.8 8a3.2 3.2 0 0 0 6.4 0a1.6 1.6 0 0 0-3.2 0a1.6 1.6 0 0 1-3.2 0z" fill="#0047a0"/>${[-56.3, 56.3, 123.7, -123.7].map(tri).join("")}`;
  const jp = `<rect width="24" height="16" fill="#fff"/><circle cx="12" cy="8" r="4.8" fill="#bc002d"/>`;
  const other = `<rect width="24" height="16" fill="#e9e9ee"/><g fill="none" stroke="#7a7a8c" stroke-width=".9"><circle cx="12" cy="8" r="5.2"/><ellipse cx="12" cy="8" rx="2.3" ry="5.2"/><path d="M6.8 8h10.4"/></g>`;
  return { "Corea": kr, "Japón": jp, "US/Global": us, "Otro": other };
})();
const STATES = [
  { key: "Lo tengo", label: "Lo tengo", short: "Lo tengo", cls: "have" },
  { key: "Comprado/En camino", label: "Comprado / en camino", short: "En camino", cls: "way" },
  { key: "No lo tengo", label: "No lo tengo", short: "Me falta", cls: "miss" },
];
const stateOf = k => STATES.find(s => s.key === k) || STATES[2];
const LS = { cfg: "vault:cfg", cache: "vault:cache", ui: "vault:ui", theme: "vault:theme" };

/* ═════════ Utilidades ═════════ */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtDate = iso => (iso ? iso.split("-").reverse().join("/") : "");
const ls = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin espacio o bloqueado */ } },
  del(k) { try { localStorage.removeItem(k); } catch { } },
};
function utf8ToB64(str) {
  const bytes = new TextEncoder().encode(str); let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64ToUtf8(b64) {
  const bin = atob(String(b64).replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}
const b64url = s => utf8ToB64(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return b64ToUtf8(s); };

/* ═════════ Datos: normalización y mezcla ═════════ */
function isoFromDisplay(s) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || "").trim());
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}
function norm(raw) {
  const r = raw || {};
  let fecha = typeof r.fecha === "string" ? r.fecha.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) fecha = isoFromDisplay(r.fechaDisplay || fecha);
  return {
    id: String(r.id ?? uid()), nombre: String(r.nombre || "").trim(), artista: String(r.artista || "BTS"),
    era: String(r.era || "").trim(), precio: Math.max(0, Math.round(Number(r.precio) || 0)),
    categoria: String(r.categoria || "Media"), formato: String(r.formato || "Otros"), edicion: String(r.edicion || "").trim(),
    origen: String(r.origen || "Corea"), fecha, imagen: String(r.imagen || "").trim(),
    estado: STATES.some(s => s.key === r.estado) ? r.estado : "No lo tengo", deseos: !!r.deseos, mod: Number(r.mod) || 0,
  };
}
function normData(d) {
  const arr = Array.isArray(d) ? d : (d && d.items) || [];
  const del = (d && !Array.isArray(d) && d.deleted && typeof d.deleted === "object") ? d.deleted : {};
  return { items: arr.map(norm).filter(i => i.nombre), deleted: del };
}
function pruneDeleted(del) {
  const limit = Date.now() - 180 * 864e5, out = {};
  for (const k in del) if (del[k] > limit) out[k] = del[k];
  return out;
}
function mergeData(a, b) {
  const del = { ...a.deleted };
  for (const k in b.deleted) del[k] = Math.max(del[k] || 0, b.deleted[k]);
  const map = new Map();
  for (const it of [...a.items, ...b.items]) {
    const cur = map.get(it.id);
    if (!cur || (it.mod || 0) > (cur.mod || 0)) map.set(it.id, it);
  }
  const items = [];
  for (const [id, it] of map) if (!(del[id] && del[id] >= (it.mod || 0))) items.push(it);
  return { items, deleted: del };
}
const byIdSort = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
function canon(d) {
  const it = [...d.items].sort(byIdSort).map(i => JSON.stringify(norm(i)));
  const dl = Object.keys(d.deleted).sort().map(k => k + ":" + d.deleted[k]);
  return it.join("|") + "#" + dl.join(",");
}
const sameData = (a, b) => canon(a) === canon(b);
function serialize(d) {
  const items = [...d.items].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  return `{"version":1,"updated":${Date.now()},"deleted":${JSON.stringify(d.deleted)},\n"items":[\n${items.map(i => JSON.stringify(i)).join(",\n")}\n]}\n`;
}

/* ═════════ Estado ═════════ */
const S = {
  items: [], deleted: {}, rev: 0,
  member: "all", era: "all", view: "grid", sortAsc: false, filtersOpen: false,
  filters: { search: "", categoria: [], formato: [], origen: [], estado: "", deseos: false },
  modal: null, cfg: null, status: { state: "off", msg: "" },
};
const Sync = { busy: false, again: false, timer: null, last: 0 };
const byId = id => S.items.find(i => i.id === id);
const persistLocal = () => ls.set(LS.cache, { items: S.items, deleted: S.deleted });
const saveUI = () => ls.set(LS.ui, { view: S.view, sortAsc: S.sortAsc, member: S.member, era: S.era });
function touch() { S.rev++; persistLocal(); scheduleSync(); }

/* ═════════ Eras ═════════ */
function eraList() {
  const first = new Map();
  S.items.forEach(i => {
    if (!i.era || (S.member !== "all" && i.artista !== S.member)) return;
    const d = i.fecha || "9999";
    if (!first.has(i.era) || d < first.get(i.era)) first.set(i.era, d);
  });
  return [...first.entries()].sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0])).map(e => e[0]);
}
function renderEnav() {
  const el = $("#enav"), left = el.scrollLeft, list = eraList();
  if (S.era !== "all" && !list.includes(S.era)) S.era = "all";
  $("#enavwrap").hidden = !list.length;
  el.innerHTML = [["all", "Todas las eras"], ...list.map(e => [e, e])].map(([k, l]) =>
    `<button class="${S.era === k ? "on" : ""}" data-act="era" data-val="${esc(k)}">${esc(l)}</button>`).join("");
  el.scrollLeft = left;
  updateArrows();
}

/* ═════════ Filtros y agrupación ═════════ */
function matchesBase(i) {
  const f = S.filters;
  if (S.member !== "all" && i.artista !== S.member) return false;
  if (S.era !== "all" && i.era !== S.era) return false;
  const q = f.search.trim().toLowerCase();
  if (q && !(`${i.nombre} ${i.edicion} ${i.era} ${i.artista} ${i.categoria} ${i.formato}`.toLowerCase().includes(q))) return false;
  if (f.categoria.length && !f.categoria.includes(i.categoria)) return false;
  if (f.formato.length && !f.formato.includes(i.formato)) return false;
  if (f.origen.length && !f.origen.includes(i.origen)) return false;
  return true;
}
function visibleItems() {
  const f = S.filters;
  return S.items.filter(i => matchesBase(i) && (!f.estado || i.estado === f.estado) && (!f.deseos || i.deseos));
}
const chipCount = () => S.filters.categoria.length + S.filters.formato.length + S.filters.origen.length;
const hasFilters = () => !!(S.filters.search || chipCount() || S.filters.estado || S.filters.deseos);

function cmpDate(a, b) {
  const x = a.fecha, y = b.fecha;
  if (!x && !y) return a.nombre.localeCompare(b.nombre);
  if (!x) return 1;
  if (!y) return -1;
  if (x !== y) return S.sortAsc ? x.localeCompare(y) : y.localeCompare(x);
  return a.nombre.localeCompare(b.nombre) || a.edicion.localeCompare(b.edicion);
}
const sorted = arr => [...arr].sort(cmpDate);

function groupItems(items) {
  const out = [], used = new Set();
  const take = fn => { const r = items.filter(i => !used.has(i.id) && fn(i)); r.forEach(i => used.add(i.id)); return r; };
  const push = (label, arr) => { if (arr.length) out.push({ label, items: arr }); };
  const kr = i => i.origen !== "Japón", jp = i => i.origen === "Japón";
  const comeback = i => i.artista === "BTS" && (i.categoria === "Album" || i.categoria === "Single");
  const live = i => i.categoria === "LIVE SHOW" || i.categoria === "Video/Documental";

  push("Korean Comeback", sorted(take(i => comeback(i) && kr(i))));
  const subs = SOLO_ARTISTS.map(a => ({ label: a, items: sorted(take(i => i.artista === a)) })).filter(s => s.items.length);
  if (subs.length) out.push({ label: "Soloist", subs });
  push("Japanese Comeback", sorted(take(i => comeback(i) && jp(i))));
  push("Live Shows & Video", [...sorted(take(i => live(i) && kr(i))), ...sorted(take(i => live(i) && jp(i)))]);
  push("Fanmeeting & Muster", [...sorted(take(i => i.categoria === "MUSTER" && kr(i))), ...sorted(take(i => i.categoria === "MUSTER" && jp(i)))]);
  push("Memories", sorted(take(i => i.categoria === "MEMORIES")));
  push("Season's Greetings", sorted(take(i => i.categoria === "SEASON'S GREETINGS")));
  push("Season Package", sorted(take(i => i.categoria === "SEASON PACKAGE")));
  push("Media & Otros", sorted(take(() => true)));
  return out;
}

/* ═════════ Render ═════════ */
const flagHTML = o => `<span class="country" title="${esc(o)}"><svg viewBox="0 0 24 16" aria-label="${esc(o)}">${FLAGS[o] || FLAGS["Otro"]}</svg></span>`;
const imgHTML = it => (it.imagen ? `<img src="${esc(it.imagen)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : "");
const nameHTML = it => `<strong>${esc(it.nombre)}</strong>${it.edicion ? ` <span class="ed">· ${esc(it.edicion)}</span>` : ""}`;

function renderCard(it) {
  const s = stateOf(it.estado);
  return `<article class="card" data-act="edit" data-id="${esc(it.id)}">
    <div class="cover">${imgHTML(it)}
      ${it.deseos ? `<span class="wish-star" title="En lista de deseos">★</span>` : ""}
      <button class="qs st-${s.cls}" data-act="pop" data-id="${esc(it.id)}" aria-label="Cambiar estado">${s.cls === "have" ? "✓" : s.cls === "way" ? "→" : "✗"}</button>
    </div>
    <div class="card-body">
      <div class="card-name">${nameHTML(it)}</div>
      <div class="artist">${esc(it.artista)}</div>
      ${it.precio ? `<div class="price"><small>JPY</small> ¥${it.precio.toLocaleString("en-US")}</div>` : ""}
      <div class="card-meta">${it.fecha ? `<span>${fmtDate(it.fecha)}</span>` : ""}<span class="fmt">${esc(it.formato)}</span>${flagHTML(it.origen)}</div>
      <span class="badge st-${s.cls}">${s.short}</span>
    </div></article>`;
}
function renderRow(it) {
  const s = stateOf(it.estado);
  return `<div class="row" data-act="edit" data-id="${esc(it.id)}">
    <div class="thumb">${imgHTML(it)}</div>
    <div class="row-info"><div class="row-name">${nameHTML(it)}${it.deseos ? ` <span class="row-star">★</span>` : ""}</div>
      <div class="row-sub">${esc(it.artista)} · ${esc(it.categoria)} · ${esc(it.formato)}${it.fecha ? " · " + fmtDate(it.fecha) : ""}${flagHTML(it.origen)}</div></div>
    <button class="badge st-${s.cls}" data-act="pop" data-id="${esc(it.id)}">${s.short} ▾</button>
  </div>`;
}
function groupHTML(g) {
  const grid = S.view === "grid", one = grid ? renderCard : renderRow;
  const wrap = html => `<div class="${grid ? "grid" : "list"}">${html}</div>`;
  const count = g.subs ? g.subs.reduce((n, s) => n + s.items.length, 0) : g.items.length;
  const body = g.subs
    ? g.subs.map(s => (S.member === "all" ? `<div class="subhead">${esc(s.label)}</div>` : "") + wrap(s.items.map(one).join(""))).join("")
    : wrap(g.items.map(one).join(""));
  return `<section><div class="divider"><i></i><span>${esc(g.label)}<em>${count}</em></span><i></i></div>${body}</section>`;
}
function renderList() {
  const host = $("#list"), items = visibleItems();
  if (!S.items.length) {
    const on = cfgOk();
    host.innerHTML = `<div class="empty"><h2>Aún no hay items</h2><p>${on
      ? (Sync.busy ? "Cargando tu colección desde GitHub…" : "El archivo data.json está vacío o no existe todavía. Impórtalo desde Ajustes.")
      : "Conecta tu repositorio de GitHub en Ajustes para cargar tu colección."}</p>
      <button class="btn-primary" style="height:40px" data-act="settings">Abrir ajustes</button></div>`;
    return;
  }
  if (!items.length) {
    host.innerHTML = `<div class="empty"><h2>Sin resultados</h2><p>Prueba con otros filtros o agrega un item nuevo.</p></div>`;
    return;
  }
  host.innerHTML = groupItems(items).map(groupHTML).join("");
}
function renderBanner() {
  const scope = S.items.filter(i => (S.member === "all" || i.artista === S.member) && (S.era === "all" || i.era === S.era));
  const have = scope.filter(i => i.estado === "Lo tengo").length;
  const pct = scope.length ? Math.round(have / scope.length * 100) : 0;
  const m = MEMBERS.find(x => x.key === S.member);
  $("#banner").innerHTML = `<div class="eyebrow">${S.era === "all" ? "colección personal" : S.member === "all" ? "Mi Colección BTS" : esc(m.label)}</div>
    <h1>${S.era !== "all" ? esc(S.era) : S.member === "all" ? "Mi Colección BTS" : esc(m.label)}</h1>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="progress-label">${have} de ${scope.length} items · ${pct}% completado</div>`;
}
function renderStats() {
  const el = $("#stats"), left = el.scrollLeft, f = S.filters;
  const base = S.items.filter(matchesBase);
  const n = k => base.filter(i => i.estado === k).length;
  const btn = (cls, label, count, on, val) => `<button class="stat ${cls}${on ? " on" : ""}" data-act="stat" data-val="${val}"><span class="n">${count}</span><span class="l">${label}</span></button>`;
  el.innerHTML = btn("all", "Todo", base.length, !f.estado && !f.deseos, "")
    + btn("have", "Lo tengo", n("Lo tengo"), f.estado === "Lo tengo", "Lo tengo")
    + btn("way", "En camino", n("Comprado/En camino"), f.estado === "Comprado/En camino", "Comprado/En camino")
    + btn("miss", "Me falta", n("No lo tengo"), f.estado === "No lo tengo", "No lo tengo")
    + btn("wish", "★ Deseos", base.filter(i => i.deseos).length, f.deseos, "wish");
  el.scrollLeft = left;
}
function renderFilters() {
  const el = $("#filters"); el.hidden = !S.filtersOpen;
  if (!S.filtersOpen) return;
  const group = (title, key, list, label = v => v) => `<div class="fg"><h3>${title}</h3><div class="chips">${list.map(v =>
    `<button class="chip${S.filters[key].includes(v) ? " on" : ""}" data-act="chip" data-key="${key}" data-val="${esc(v)}">${esc(label(v))}</button>`).join("")}</div></div>`;
  const orig = `<div class="fg"><h3>Origen</h3><div class="chips">${ORIGS.map(v =>
    `<button class="chip chip-flag${S.filters.origen.includes(v) ? " on" : ""}" data-act="chip" data-key="origen" data-val="${esc(v)}">${flagHTML(v)}${esc(v)}</button>`).join("")}</div></div>`;
  el.innerHTML = group("Categoría", "categoria", CATS) + group("Formato", "formato", FMTS) + orig;
}
function renderMeta() {
  const n = visibleItems().length, hf = hasFilters();
  $("#meta").innerHTML = `<span>${n} resultado${n === 1 ? "" : "s"}</span>${hf ? `<button data-act="clear">✕ Limpiar filtros</button>` : ""}<span class="grow"></span>
    <button data-act="sort">${S.sortAsc ? "Más antiguos primero ↑" : "Más recientes primero ↓"}</button>`;
  const fb = $("#filterbtn");
  fb.classList.toggle("on", S.filtersOpen || chipCount() > 0);
  fb.textContent = "Filtros" + (chipCount() ? ` (${chipCount()})` : "");
}
function renderChrome() {
  document.querySelectorAll('.seg button').forEach(b => b.classList.toggle("on", b.dataset.val === S.view));
  document.querySelectorAll('#mnav button').forEach(b => b.classList.toggle("on", b.dataset.val === S.member));
}
function renderAll() { renderEnav(); renderChrome(); renderBanner(); renderFilters(); renderStats(); renderMeta(); renderList(); }

function buildMnav() {
  $("#mnav").innerHTML = MEMBERS.map(m => `<button data-act="member" data-val="${esc(m.key)}">${esc(m.label)}</button>`).join("");
}
function updateArrows() {
  ["mnav", "enav"].forEach(id => {
    const nav = document.getElementById(id), wrap = nav && nav.parentElement;
    if (!wrap) return;
    const l = wrap.querySelector(".navarrow.l"), r = wrap.querySelector(".navarrow.r");
    l.hidden = !(nav.scrollLeft > 2);
    r.hidden = !(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 2);
  });
}
function centerActiveMember(smooth, sel = "#mnav") {
  const nav = $(sel), b = nav.querySelector(".on");
  if (!b) return;
  const left = nav.scrollLeft + (b.getBoundingClientRect().left - nav.getBoundingClientRect().left) - (nav.clientWidth - b.offsetWidth) / 2;
  if (nav.scrollTo) nav.scrollTo({ left, behavior: smooth ? "smooth" : "auto" }); else nav.scrollLeft = left;
}

/* ═════════ Popover de estado ═════════ */
function closePop() { const p = $("#pop"); p.hidden = true; p.dataset.for = ""; }
function openPop(btn, id) {
  const it = byId(id), pop = $("#pop");
  if (!it) return;
  if (!pop.hidden && pop.dataset.for === id) return closePop();
  pop.dataset.for = id;
  pop.innerHTML = STATES.map(s => `<button class="${it.estado === s.key ? "cur" : ""}" data-act="setstate" data-id="${esc(id)}" data-val="${esc(s.key)}"><span class="dot st-${s.cls}"></span>${esc(s.label)}</button>`).join("")
    + `<div class="sep"></div><button data-act="togglewish" data-id="${esc(id)}"><span style="width:8px;text-align:center;color:var(--wish)">★</span>${it.deseos ? "Quitar de deseos" : "Agregar a deseos"}</button>`;
  pop.hidden = false;
  const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  const left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
  let top = r.bottom + 6;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
  pop.style.left = left + "px"; pop.style.top = top + "px";
}

/* ═════════ Modales ═════════ */
const overlay = inner => `<div class="overlay" data-act="overlay"><div class="sheet" role="dialog" aria-modal="true">${inner}</div></div>`;
const previewHTML = url => (url ? `<div class="preview"><img src="${esc(url)}" alt="" referrerpolicy="no-referrer"></div>` : "");

function itemFormHTML() {
  const m = S.modal, d = m.draft;
  const sel = (field, list, cur) => {
    const l = !cur || list.includes(cur) ? list : [...list, cur];
    return `<select data-field="${field}">${l.map(v => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
  };
  return overlay(`
    <div class="sheet-head"><h2>${m.isNew ? "Nuevo item" : "Editar item"}</h2><button class="x" data-act="close" aria-label="Cerrar">×</button></div>
    <div class="sheet-body">
      <div class="field"><label>Nombre *</label><input data-field="nombre" value="${esc(d.nombre)}" placeholder="Ej: MAP OF THE SOUL: 7" autocomplete="off"></div>
      <div class="two"><div class="field"><label>Artista</label>${sel("artista", ARTISTS, d.artista)}</div><div class="field"><label>Categoría</label>${sel("categoria", CATS, d.categoria)}</div></div>
      <div class="two"><div class="field"><label>Formato</label>${sel("formato", FMTS, d.formato)}</div><div class="field"><label>Origen</label>${sel("origen", ORIGS, d.origen)}</div></div>
      <div class="two"><div class="field"><label>Edición</label><input data-field="edicion" value="${esc(d.edicion)}" placeholder="Regular, Type A…" autocomplete="off"></div>
        <div class="field"><label>Fecha</label><input type="date" data-field="fecha" value="${esc(d.fecha)}"></div></div>
      <div class="field"><label>Estado</label><div class="opts">${STATES.map(s => `<button type="button" class="opt${d.estado === s.key ? " on st-" + s.cls : ""}" data-act="dstate" data-val="${esc(s.key)}"><span class="dot st-${s.cls}"></span>${esc(s.label)}</button>`).join("")}
        <button type="button" class="opt wish${d.deseos ? " on" : ""}" data-act="dwish">${d.deseos ? "★ En lista de deseos" : "☆ Agregar a lista de deseos"}</button></div></div>
      <div class="two"><div class="field"><label>Era / proyecto</label><input data-field="era" value="${esc(d.era)}" placeholder="MAP OF THE SOUL…" autocomplete="off"></div>
        <div class="field"><label>Precio de referencia (¥)</label><input data-field="precio" type="number" inputmode="numeric" min="0" value="${d.precio || ""}" placeholder="0"></div></div>
      <div class="field"><label>URL de imagen</label><input data-field="imagen" value="${esc(d.imagen)}" placeholder="https://…" inputmode="url" autocapitalize="off" autocomplete="off"><div id="preview-host">${previewHTML(d.imagen)}</div></div>
    </div>
    <div class="sheet-foot">
      <button class="btn-ghost" data-act="close">Cancelar</button>
      <button id="savebtn" class="btn-primary" data-act="save"${d.nombre.trim() ? "" : " disabled"}>${m.isNew ? "Agregar" : "Guardar cambios"}</button>
      ${m.isNew ? "" : `<button class="btn-danger" data-act="askdel">Eliminar este item</button>`}
    </div>`);
}
function confirmHTML() {
  const d = S.modal.back.draft;
  return overlay(`
    <div class="sheet-head"><h2>¿Eliminar este item?</h2><button class="x" data-act="canceldel" aria-label="Cerrar">×</button></div>
    <div class="sheet-body"><p class="note"><b>${esc(d.nombre)}</b>${d.edicion ? " · " + esc(d.edicion) : ""}<br>Se quitará de tu colección en todos tus dispositivos. Esta acción no se puede deshacer.</p></div>
    <div class="sheet-foot"><button class="btn-ghost" data-act="canceldel">Cancelar</button><button class="btn-danger" style="flex:1;flex-basis:auto" data-act="confirmdel">Eliminar</button></div>`);
}
function settingsHTML() {
  const c = S.cfg || {};
  return overlay(`
    <div class="sheet-head"><h2>Sincronización y datos</h2><button class="x" data-act="close" aria-label="Cerrar">×</button></div>
    <div class="sheet-body">
      <p class="note">Tus datos viven en un archivo <b>data.json</b> dentro de un repositorio <b>privado</b> de GitHub. Cada dispositivo necesita el token una sola vez.</p>
      <div class="field"><label>Repositorio de datos (usuario/repositorio)</label><input id="cfg-repo" value="${esc(c.owner && c.repo ? c.owner + "/" + c.repo : "")}" placeholder="tu-usuario/bts-vault-data" autocapitalize="off" autocorrect="off" spellcheck="false"></div>
      <div class="two"><div class="field"><label>Rama</label><input id="cfg-branch" value="${esc(c.branch || "main")}" autocapitalize="off" spellcheck="false"></div>
        <div class="field"><label>Archivo</label><input id="cfg-path" value="${esc(c.path || "data.json")}" autocapitalize="off" spellcheck="false"></div></div>
      <div class="field"><label>Token de acceso</label><input id="cfg-token" type="password" value="${esc(c.token || "")}" placeholder="github_pat_…" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div id="cfg-msg" class="msg" hidden></div>
      <div class="btn-row"><button class="btn-primary" style="height:40px;flex:1" data-act="cfgsave">Guardar y probar</button><button class="btn-ghost" data-act="syncnow">Sincronizar ahora</button></div>

      <div class="section-title">Configurar otro dispositivo</div>
      <p class="note">Copia un enlace que ya trae la configuración (incluye el token: trátalo como una contraseña). Si instalaste la app en la pantalla de inicio del iPhone, pega el enlace aquí abajo dentro de la app.</p>
      <button class="btn-ghost" data-act="cfglink"${cfgOk() ? "" : " disabled"}>Copiar enlace de configuración</button>
      <div class="field"><label>Pegar enlace de configuración</label><input id="cfg-from" placeholder="https://…#cfg=…" autocapitalize="off" autocorrect="off" spellcheck="false"></div>
      <button class="btn-ghost" data-act="cfgfrom">Aplicar enlace</button>

      <div class="section-title">Datos</div>
      <p class="note">Excel no se conecta solo con la página: la fuente de verdad es data.json en GitHub. Descarga un Excel actualizado cuando quieras, o sube uno para actualizar la colección.</p>
      <div class="btn-row"><button class="btn-primary" style="height:40px;flex:1" data-act="exportxlsx">Descargar Excel (.xlsx)</button>
        <label class="btn-ghost file-btn">Importar Excel / JSON<input id="imp-file" type="file" accept=".xlsx,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label></div>
      <div class="btn-row"><button class="btn-ghost" data-act="export">Exportar JSON (copia)</button></div>
      <div class="field"><label>O pega un JSON (por ejemplo, el de tu app anterior)</label><textarea id="imp-text" placeholder='[{"id":"3","nombre":"…","estado":"Lo tengo"}]' spellcheck="false"></textarea></div>
      <button class="btn-ghost" data-act="imptext">Importar texto pegado</button>

      <div class="section-title">Sesión</div>
      <button class="btn-danger" data-act="cfgclear">Quitar token de este dispositivo</button>
    </div>`);
}
function renderModal(resetScroll) {
  const host = $("#modal"), body = host.querySelector(".sheet-body"), top = body ? body.scrollTop : 0;
  host.innerHTML = !S.modal ? "" : S.modal.type === "settings" ? settingsHTML() : S.modal.type === "confirm" ? confirmHTML() : itemFormHTML();
  host.hidden = !S.modal;
  document.body.classList.toggle("lock", !!S.modal);
  const nb = host.querySelector(".sheet-body");
  if (nb && !resetScroll) nb.scrollTop = top;
}
function closeModal() { S.modal = null; renderModal(true); }
function openSettings() { closePop(); S.modal = { type: "settings" }; renderModal(true); }
function openNew() {
  closePop();
  S.modal = { type: "item", isNew: true, draft: norm({ id: "tmp", nombre: "x", artista: S.member === "all" ? "BTS" : S.member, categoria: "Album", formato: "CD", origen: "Corea", estado: "No lo tengo" }) };
  S.modal.draft.nombre = ""; renderModal(true);
}
function openEdit(id) {
  const it = byId(id); if (!it) return;
  closePop(); S.modal = { type: "item", isNew: false, draft: { ...it } }; renderModal(true);
}

/* ═════════ Acciones sobre items ═════════ */
function patchItem(id, patch) {
  S.items = S.items.map(i => (i.id === id ? { ...i, ...patch, mod: Date.now() } : i));
  touch(); renderAll();
}
function saveDraft() {
  const d = S.modal.draft; d.nombre = d.nombre.trim();
  if (!d.nombre) return;
  d.mod = Date.now();
  if (S.modal.isNew) { d.id = uid(); S.items = [...S.items, norm(d)]; }
  else S.items = S.items.map(i => (i.id === d.id ? norm(d) : i));
  closeModal(); touch(); renderAll();
}
function deleteItem(id) {
  S.items = S.items.filter(i => i.id !== id); S.deleted[id] = Date.now();
  closeModal(); touch(); renderAll(); toast("Item eliminado");
}

/* ═════════ Tema, avisos y estado de sincronización ═════════ */
function syncThemeIcon() {
  $("#themebtn").textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☀" : "☾";
}
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem(LS.theme, next); } catch { }
  syncThemeIcon();
}
let toastTimer = null;
function toast(msg, ms = 3200) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}
function setStatus(state, msg = "") {
  const prev = S.status; S.status = { state, msg };
  const b = $("#syncbtn");
  b.dataset.state = state;
  b.textContent = state === "busy" ? "⟳" : "☁";
  b.title = { off: "Sin configurar: toca para conectar GitHub", idle: "Conectado", busy: "Sincronizando…", ok: "Sincronizado", err: msg || "Error de sincronización" }[state];
  if (state === "err" && (prev.state !== "err" || prev.msg !== msg)) toast(msg, 6000);
}

/* ═════════ Sincronización con GitHub ═════════ */
const cfgOk = () => !!(S.cfg && S.cfg.owner && S.cfg.repo && S.cfg.token);
const ghHeaders = (cfg = S.cfg) => ({ Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json" });
const ghFileUrl = (cfg = S.cfg) => `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path.split("/").map(encodeURIComponent).join("/")}`;
async function errMsg(r) {
  let t = ""; try { t = (await r.json()).message || ""; } catch { }
  if (r.status === 401) return "Token inválido o vencido.";
  if (r.status === 403) return "GitHub rechazó la petición (403). " + (t || "Revisa los permisos del token.");
  if (r.status === 404) return "No encuentro el repositorio, o el token no tiene acceso a él.";
  return `GitHub respondió ${r.status}. ${t}`;
}
const isNetErr = e => /Failed to fetch|NetworkError|Load failed|network/i.test(String(e && e.message));

function applyData(d) {
  S.items = d.items; S.deleted = pruneDeleted(d.deleted);
  persistLocal(); renderAll();
}
function scheduleSync(ms = 1800) {
  if (!cfgOk()) return;
  clearTimeout(Sync.timer); Sync.timer = setTimeout(syncNow, ms);
}
async function syncNow() {
  if (!cfgOk()) { setStatus("off"); return; }
  if (Sync.busy) { Sync.again = true; return; }
  Sync.busy = true; Sync.again = false; setStatus("busy");
  try {
    let done = false, lastErr = "";
    for (let n = 0; n < 4 && !done; n++) {
      const r = await fetch(`${ghFileUrl()}?ref=${encodeURIComponent(S.cfg.branch)}&t=${Date.now()}`, { headers: ghHeaders(), cache: "no-store" });
      let remote = null, sha = null;
      if (r.status !== 404) {
        if (!r.ok) throw new Error(await errMsg(r));
        const j = await r.json(); sha = j.sha;
        if (!j.content) throw new Error("GitHub no devolvió el contenido de data.json.");
        try { remote = normData(JSON.parse(b64ToUtf8(j.content))); } catch { throw new Error("El archivo de datos no es un JSON válido."); }
      }
      const local = { items: S.items, deleted: S.deleted };
      const merged = remote ? mergeData(local, remote) : local;
      const revAtMerge = S.rev;
      applyData(merged);
      const needPush = remote ? !sameData(merged, remote) : merged.items.length > 0;
      if (!needPush) {
        if (!remote) toast("No existe data.json en el repositorio. Impórtalo desde Ajustes.", 5000);
        done = true; break;
      }
      const body = { message: `Actualiza colección (${merged.items.length} items)`, content: utf8ToB64(serialize(merged)), branch: S.cfg.branch };
      if (sha) body.sha = sha;
      const pr = await fetch(ghFileUrl(), { method: "PUT", headers: { ...ghHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (pr.ok) { done = true; if (S.rev !== revAtMerge) Sync.again = true; break; }
      if (pr.status === 409 || pr.status === 422) { lastErr = await errMsg(pr); continue; }   // otro dispositivo escribió primero: reintentar
      throw new Error(await errMsg(pr));
    }
    if (!done) throw new Error("Hubo un conflicto al guardar; se reintentará. " + lastErr);
    Sync.last = Date.now(); setStatus("ok");
  } catch (e) {
    setStatus("err", isNetErr(e) ? "Sin conexión. Tus cambios quedan en este dispositivo y se subirán después." : e.message);
  } finally {
    Sync.busy = false;
    if (Sync.again) { Sync.again = false; scheduleSync(800); }
  }
}
async function testConn(cfg) {
  try {
    const h = ghHeaders(cfg);
    const r = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, { headers: h, cache: "no-store" });
    if (!r.ok) throw new Error(await errMsg(r));
    const repo = await r.json();
    if (repo.permissions && repo.permissions.push === false) throw new Error("El token solo puede leer. Necesita el permiso «Contents: Read and write».");
    const b = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`, { headers: h, cache: "no-store" });
    if (b.status === 404) throw new Error(`La rama «${cfg.branch}» no existe${repo.default_branch ? ` (la principal es «${repo.default_branch}»)` : ""}. Si el repositorio está vacío, crea primero un README.`);
    if (!b.ok) throw new Error(await errMsg(b));
    return repo.private === false ? "Conectado, pero ese repositorio es PÚBLICO: cualquiera podría ver tu colección." : "";
  } catch (e) {
    if (isNetErr(e)) throw new Error("No hay conexión con GitHub.");
    throw e;
  }
}

/* ═════════ Configuración ═════════ */
function parseRepo(s) {
  s = String(s || "").trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
  const p = s.split("/");
  return p.length >= 2 && p[0] && p[1] ? [p[0], p[1]] : null;
}
function cfgFromString(str) {
  const i = String(str || "").indexOf("cfg=");
  if (i < 0) return null;
  try {
    const o = JSON.parse(unb64url(str.slice(i + 4).trim().split(/[&\s]/)[0]));
    if (!o.o || !o.r || !o.t) return null;
    return { owner: o.o, repo: o.r, branch: o.b || "main", path: o.p || "data.json", token: o.t };
  } catch { return null; }
}
function applyHashConfig() {
  if (!location.hash.includes("cfg=")) return;
  const cfg = cfgFromString(location.hash);
  history.replaceState(null, "", location.pathname + location.search);
  if (cfg) { S.cfg = cfg; ls.set(LS.cfg, cfg); setTimeout(() => toast("Configuración cargada ✓"), 300); }
}
function cfgMsg(text, kind = "") {
  const el = $("#cfg-msg"); if (!el) return;
  el.hidden = false; el.className = "msg " + kind; el.textContent = text;
}
async function cfgSave() {
  const rp = parseRepo($("#cfg-repo").value), token = $("#cfg-token").value.trim();
  const branch = $("#cfg-branch").value.trim() || "main", path = ($("#cfg-path").value.trim() || "data.json").replace(/^\/+/, "");
  if (!rp) return cfgMsg("Escribe el repositorio como usuario/repositorio.", "err");
  if (!token) return cfgMsg("Falta el token de acceso.", "err");
  const cfg = { owner: rp[0], repo: rp[1], branch, path, token };
  cfgMsg("Probando conexión…");
  try {
    const warn = await testConn(cfg);
    S.cfg = cfg; ls.set(LS.cfg, cfg);
    closeModal(); toast(warn || "Conectado a GitHub ✓", warn ? 6000 : 3200);
    setStatus("idle"); syncNow();
  } catch (e) { cfgMsg(e.message, "err"); }
}
function cfgFrom() {
  const cfg = cfgFromString($("#cfg-from").value);
  if (!cfg) return cfgMsg("Ese enlace no trae una configuración válida.", "err");
  S.cfg = cfg; ls.set(LS.cfg, cfg);
  closeModal(); toast("Configuración aplicada ✓"); setStatus("idle"); syncNow();
}
function cfgLink() {
  if (!cfgOk()) return;
  const c = S.cfg, url = location.origin + location.pathname + "#cfg=" + b64url(JSON.stringify({ o: c.owner, r: c.repo, b: c.branch, p: c.path, t: c.token }));
  const fallback = () => window.prompt("Copia este enlace (contiene tu token):", url);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => toast("Enlace copiado. Trátalo como una contraseña."), fallback);
  else fallback();
}
function cfgClear() {
  if (!window.confirm("¿Quitar el token de este dispositivo? Tus datos locales se conservan.")) return;
  S.cfg = null; ls.del(LS.cfg); setStatus("off"); closeModal(); toast("Token eliminado de este dispositivo");
}

/* ═════════ Exportar / importar ═════════ */
function exportJSON() {
  const blob = new Blob([serialize({ items: S.items, deleted: S.deleted })], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `bts-vault-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importData(text, fromExcel = false) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return toast("Eso no parece un JSON válido."); }
  const d = normData(parsed);
  if (!d.items.length) return toast("No encontré items en ese JSON.");
  const full = fromExcel || !!(parsed && !Array.isArray(parsed) && parsed.version);   // copia completa exportada por esta app
  if (!window.confirm(fromExcel
    ? `Actualizar la colección con ${d.items.length} filas del Excel? Se actualizan todos los campos de los items que ya existen (mismo nombre, edición, formato, origen y artista) y se agregan los nuevos. Nada se borra.`
    : full
    ? `Restaurar ${d.items.length} items de la copia? Los que ya existan se sobrescribirán con los de la copia.`
    : `Importar ${d.items.length} items? En los que ya existan se actualizará el estado y la lista de deseos; los que falten se agregarán.`)) return;
  const now = Date.now();
  const key = i => [i.nombre, i.edicion, i.formato, i.origen, i.artista].join("|").toLowerCase();
  const byKey = new Map(S.items.map(i => [key(i), i.id]));
  const map = new Map(S.items.map(i => [i.id, i]));
  let upd = 0, add = 0;
  d.items.forEach(imp => {
    const same = map.get(imp.id);
    const id = same && same.nombre.toLowerCase() === imp.nombre.toLowerCase() ? imp.id : byKey.get(key(imp));
    if (id && map.has(id)) {
      const cur = map.get(id);
      map.set(id, full ? { ...imp, id, mod: now } : { ...cur, estado: imp.estado, deseos: imp.deseos, mod: now }); upd++;
    } else {
      const nid = map.has(imp.id) ? uid() : imp.id;
      map.set(nid, { ...imp, id: nid, mod: now }); add++; delete S.deleted[nid];
    }
  });
  S.items = [...map.values()]; touch(); renderAll();
  toast(`Importado: ${upd} actualizados, ${add} nuevos`, 5000);
}

/* ═════════ Excel (SheetJS se carga solo al usarlo) ═════════ */
const XL_ORIG = { "Corea": "Korea", "Japón": "Japan", "US/Global": "US", "Otro": "Other" };
const XL_ORIG_R = { korea: "Corea", japan: "Japón", us: "US/Global", other: "Otro", otro: "Otro", corea: "Corea", "japón": "Japón", "us/global": "US/Global" };
const XL_ST = { "Lo tengo": "Owned", "No lo tengo": "Not Owned", "Comprado/En camino": "In transit" };
const XL_ST_R = { owned: "Lo tengo", "not owned": "No lo tengo", "in transit": "Comprado/En camino" };
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => ok(window.XLSX); s.onerror = () => no(new Error("No se pudo cargar la librería de Excel (¿sin conexión?)."));
    document.head.appendChild(s);
  });
}
async function exportXLSX() {
  try {
    const X = await loadXLSX();
    const rows = groupItems(S.items).flatMap(g => g.subs ? g.subs.flatMap(s => s.items) : g.items).map(i => ({
      "Name": i.nombre, "Artist": i.artista, "Era": i.era, "Category": i.categoria, "Type": i.formato, "Edition": i.edicion,
      "Origin": XL_ORIG[i.origen] || i.origen, "Release Date": i.fecha ? new Date(i.fecha + "T00:00:00Z") : "", "URL Imagen": i.imagen,
      "My Collection ": XL_ST[i.estado], "Wishlist": i.deseos, "Reference price (Yen)": i.precio || "",
    }));
    const ws = X.utils.json_to_sheet(rows, { cellDates: true }), wb = X.utils.book_new();
    ws["!cols"] = [40, 10, 22, 14, 12, 18, 9, 13, 30, 13, 9, 14].map(w => ({ wch: w }));
    X.utils.book_append_sheet(wb, ws, "Inventario TOTAL");
    X.writeFile(wb, `Inventario_BTS_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) { toast(e.message, 5000); }
}
async function importXLSX(file) {
  try {
    const X = await loadXLSX();
    const wb = X.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const rows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const get = (r, k) => { const key = Object.keys(r).find(x => x.trim().toLowerCase() === k.toLowerCase()); return key ? r[key] : ""; };
    const items = rows.filter(r => String(get(r, "Name")).trim()).map(r => {
      const d = get(r, "Release Date");
      const fecha = d instanceof Date ? new Date(d.getTime() + 12 * 36e5).toISOString().slice(0, 10) : isoFromDisplay(d);
      return {
        nombre: String(get(r, "Name")).trim(), artista: String(get(r, "Artist")).trim() || "BTS", era: String(get(r, "Era")).trim(),
        categoria: String(get(r, "Category")).trim() || "Media", formato: String(get(r, "Type")).trim() || "Otros", edicion: String(get(r, "Edition")).trim(),
        origen: XL_ORIG_R[String(get(r, "Origin")).trim().toLowerCase()] || (String(get(r, "Origin")).trim() ? "Otro" : "Corea"), fecha, imagen: String(get(r, "URL Imagen")).trim(),
        estado: XL_ST_R[String(get(r, "My Collection")).trim().toLowerCase()] || "No lo tengo",
        deseos: get(r, "Wishlist") === true || /^(true|1|si|sí|x)$/i.test(String(get(r, "Wishlist"))), precio: Number(get(r, "Reference price (Yen)")) || 0,
      };
    });
    if (!items.length) return toast("No encontré filas con la columna «Name».");
    importData(JSON.stringify(items.map((i, n) => ({ ...i, id: "x" + n }))), true);
  } catch (e) { toast(e.message, 5000); }
}

/* ═════════ Eventos ═════════ */
function onAction(act, el, e) {
  const { id, val, key } = el.dataset;
  switch (act) {
    case "edit": return openEdit(id);
    case "pop": return openPop(el, id);
    case "setstate": closePop(); return patchItem(id, { estado: val });
    case "togglewish": closePop(); return patchItem(id, { deseos: !(byId(id) || {}).deseos });
    case "member": S.member = val; S.era = "all"; saveUI(); renderAll(); centerActiveMember(true); return $("#enav").scrollTo ? $("#enav").scrollTo({ left: 0 }) : undefined;
    case "navscroll": {
      const nav = document.getElementById(el.dataset.for), dx = Number(el.dataset.dir) * nav.clientWidth * 0.7;
      if (nav.scrollBy) nav.scrollBy({ left: dx, behavior: "smooth" }); else nav.scrollLeft += dx;
      return setTimeout(updateArrows, 350);
    }
    case "era": S.era = val; saveUI(); renderAll(); return centerActiveMember(true, "#enav");
    case "view": S.view = val; saveUI(); renderChrome(); return renderList();
    case "new": return openNew();
    case "filters": S.filtersOpen = !S.filtersOpen; renderFilters(); return renderMeta();
    case "chip": {
      const arr = S.filters[key], i = arr.indexOf(val);
      S.filters[key] = i >= 0 ? arr.filter(v => v !== val) : [...arr, val];
      renderFilters(); renderStats(); renderMeta(); return renderList();
    }
    case "stat":
      if (val === "wish") { S.filters.deseos = !S.filters.deseos; S.filters.estado = ""; }
      else { S.filters.estado = S.filters.estado === val ? "" : val; S.filters.deseos = false; }
      renderStats(); renderMeta(); return renderList();
    case "clear":
      S.filters = { search: "", categoria: [], formato: [], origen: [], estado: "", deseos: false }; $("#q").value = "";
      return renderAll();
    case "sort": S.sortAsc = !S.sortAsc; saveUI(); renderMeta(); return renderList();
    case "theme": return toggleTheme();
    case "settings": return openSettings();
    case "overlay": if (e.target === el) closeModal(); return;
    case "close": return closeModal();
    case "dstate": S.modal.draft.estado = val; return renderModal();
    case "dwish": S.modal.draft.deseos = !S.modal.draft.deseos; return renderModal();
    case "save": return saveDraft();
    case "askdel": S.modal = { type: "confirm", back: S.modal }; return renderModal(true);
    case "canceldel": S.modal = S.modal.back; return renderModal(true);
    case "confirmdel": return deleteItem(S.modal.back.draft.id);
    case "cfgsave": return cfgSave();
    case "cfgfrom": return cfgFrom();
    case "cfglink": return cfgLink();
    case "cfgclear": return cfgClear();
    case "syncnow": toast("Sincronizando…", 1500); return syncNow();
    case "export": return exportJSON();
    case "exportxlsx": return exportXLSX();
    case "imptext": return importData($("#imp-text").value);
  }
}
function bindEvents() {
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!e.target.closest("#pop") && !(el && el.dataset.act === "pop")) closePop();
    if (el) onAction(el.dataset.act, el, e);
  });
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.id === "q") { S.filters.search = t.value; renderMeta(); renderStats(); return renderList(); }
    const f = t.dataset && t.dataset.field;
    if (f && S.modal && S.modal.draft) {
      S.modal.draft[f] = f === "precio" ? Math.max(0, Math.round(Number(t.value) || 0)) : t.value;
      if (f === "nombre") { const b = $("#savebtn"); if (b) b.disabled = !t.value.trim(); }
    }
  });
  document.addEventListener("change", e => {
    const t = e.target, f = t.dataset && t.dataset.field;
    if (f && S.modal && S.modal.draft) {
      S.modal.draft[f] = t.value;
      if (f === "imagen") { const h = $("#preview-host"); if (h) h.innerHTML = previewHTML(t.value.trim()); }
    }
    if (t.id === "imp-file" && t.files && t.files[0]) {
      const file = t.files[0]; t.value = "";
      if (/\.xlsx?$/i.test(file.name)) importXLSX(file);
      else { const rd = new FileReader(); rd.onload = () => importData(String(rd.result)); rd.readAsText(file); }
    }
  });
  document.addEventListener("error", e => { if (e.target && e.target.tagName === "IMG") e.target.style.display = "none"; }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closePop(); if (S.modal) closeModal(); } });
  window.addEventListener("scroll", closePop, { passive: true });
  window.addEventListener("resize", () => { closePop(); updateArrows(); });
  document.addEventListener("scroll", e => { if (e.target.classList && e.target.classList.contains("mnav")) updateArrows(); }, true);
  window.addEventListener("online", () => scheduleSync(300));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleSync(300); });
  setInterval(() => { if (!document.hidden && !S.modal) scheduleSync(0); }, 90000);
}

/* ═════════ Arranque ═════════ */
function boot() {
  applyHashConfig();
  if (!S.cfg) S.cfg = ls.get(LS.cfg);
  const cache = ls.get(LS.cache);
  if (cache) { const d = normData(cache); S.items = d.items; S.deleted = d.deleted; }
  const ui = ls.get(LS.ui, {}) || {};
  S.view = ui.view === "list" ? "list" : "grid"; S.sortAsc = !!ui.sortAsc;
  S.member = MEMBERS.some(m => m.key === ui.member) ? ui.member : "all"; S.era = typeof ui.era === "string" ? ui.era : "all";
  buildMnav(); syncThemeIcon(); bindEvents(); renderAll(); centerActiveMember(false); centerActiveMember(false, "#enav"); updateArrows();
  setStatus(cfgOk() ? "idle" : "off");
  if (cfgOk()) syncNow(); else if (!S.items.length) openSettings();
}
window.__vault = { S, Sync, mergeData, normData, serialize, groupItems, syncNow, onAction, renderAll };   // utilidades de depuración
boot();
