import { PRODUCTS, COLOUR_STORIES, STYLE_LABEL, SIZE_LABEL } from "./catalog.js";
import { SHOP_PHOTOS } from "./shop-photos.js";
const MARKETPLACE_URL = location.origin + location.pathname;
const byId = id => PRODUCTS.find(p => p.id === id);

/* =====================================================================
   UTIL
   ===================================================================== */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const inr = n => "₹" + Number(n).toLocaleString("en-IN");
const store = {
  get(k, d){ try{ const v = localStorage.getItem("kg_site3_"+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("kg_site3_"+k, JSON.stringify(v)); }catch(e){} }
};
const newId = p => p + "-" + (Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2,4)).toUpperCase();
const fmtDate = t => new Date(t).toLocaleString("en-IN", {day:"numeric", month:"short", hour:"numeric", minute:"2-digit"});
const fmtDay = s => s ? new Date(s + "T00:00:00").toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric"}) : "";
function shade(hex, amt){
  const n = parseInt(hex.slice(1), 16); let r = n>>16, g = (n>>8)&255, b = n&255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t-r)*p + r); g = Math.round((t-g)*p + g); b = Math.round((t-b)*p + b);
  return "#" + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}

/* =====================================================================
   LANTERN ARTWORK  (SVG, drawn from product data)
   ===================================================================== */
let _u = 0;
function patternDefs(motif, a, u){
  if (motif === "khan") {
    const pat = (id, base, dia, dot) => `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${base}"/><path d="M7 2.2 11.8 7 7 11.8 2.2 7Z" fill="${dia}"/><circle cx="7" cy="7" r="1.4" fill="${dot}"/><circle cx="0" cy="0" r="1.5" fill="${dot}"/><circle cx="14" cy="0" r="1.5" fill="${dot}"/><circle cx="0" cy="14" r="1.5" fill="${dot}"/><circle cx="14" cy="14" r="1.5" fill="${dot}"/></pattern>`;
    return pat(`pa${u}`, a.c1, shade(a.c1, .18), a.c3) + pat(`pb${u}`, a.c2, shade(a.c2, .18), a.c3);
  }
  if (motif === "jaali") {
    const pat = (id, base) => `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${base}"/><circle cx="8" cy="8" r="4.6" fill="${a.glow}"/><circle cx="8" cy="8" r="2" fill="${base}"/><circle cx="0" cy="0" r="1.8" fill="${a.glow}"/><circle cx="16" cy="0" r="1.8" fill="${a.glow}"/><circle cx="0" cy="16" r="1.8" fill="${a.glow}"/><circle cx="16" cy="16" r="1.8" fill="${a.glow}"/></pattern>`;
    return pat(`pa${u}`, a.c1) + pat(`pb${u}`, a.c2);
  }
  if (motif === "kraft") {
    const pat = (id, base) => `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${base}"/><path d="M0 2h8M0 6h8" stroke="${shade(base,-.25)}" stroke-width="1" opacity=".55"/><path d="M2 0v8M6 0v8" stroke="${shade(base,.2)}" stroke-width=".8" opacity=".5"/></pattern>`;
    return pat(`pa${u}`, a.c1) + pat(`pb${u}`, a.c2);
  }
  return "";
}
function tails(cols, y0, spread, len, n){
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = -spread/2 + spread * (n === 1 ? .5 : i/(n-1));
    const L = len * (0.78 + 0.22 * Math.abs(Math.sin(i*1.7 + 0.4)));
    const sway = (i - (n-1)/2) * 2.2;
    s += `<path d="M${x.toFixed(1)} ${y0} Q${(x+sway).toFixed(1)} ${(y0+L*.5).toFixed(1)} ${(x+sway*1.6).toFixed(1)} ${(y0+L).toFixed(1)}" stroke="${cols[i % cols.length]}" stroke-width="6.5" fill="none"/>`;
  }
  return s;
}
function panelMark(a){
  if (!a.panel) return "";
  if (a.panel === "logo") {
    return `<circle r="30" fill="#FBF4E6"/><circle r="17" fill="none" stroke="${a.c1}" stroke-width="4"/><path d="M0 -10 9 6 -9 6Z" fill="${a.c2}"/>`;
  }
  const t = String(a.panel).slice(0, 8);
  const fs = t.length <= 2 ? 26 : t.length <= 4 ? 19 : t.length <= 6 ? 14 : 11.5;
  return `<circle r="31" fill="#FBF4E6"/><circle r="27" fill="none" stroke="${a.c1}" stroke-width="1.5" stroke-dasharray="3 3"/><text y="${fs*.36}" text-anchor="middle" font-family="Yatra One, Georgia, serif" font-size="${fs}" fill="${a.c1}">${esc(t)}</text>`;
}
function drawAkash(a, u, fA, fB){
  const R = 90, r = 54, n = 16, pts = [];
  for (let i = 0; i < n; i++) { const ang = (-90 + i*22.5) * Math.PI/180, rad = i % 2 ? r : R; pts.push([rad*Math.cos(ang), rad*Math.sin(ang)]); }
  let s = tails([a.c1, a.c2, a.c3], 44, 70, 118, 9);
  for (let i = 0; i < n; i++) {
    const p1 = pts[i], p2 = pts[(i+1) % n];
    const mid = (-90 + (i+.5)*22.5);
    const light = Math.cos((mid + 125) * Math.PI/180);
    const d = `M0 0L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z`;
    s += `<path d="${d}" fill="${i % 2 ? fB : fA}"/>`;
    s += `<path d="${d}" fill="${light > 0 ? "#fff" : "#000"}" opacity="${(light > 0 ? .16*light : .24*-light).toFixed(3)}"/>`;
  }
  s += `<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${a.c3}" stroke-width="2" stroke-linejoin="round"/>`;
  for (let i = 0; i < n; i += 2) s += `<line x1="0" y1="0" x2="${pts[i][0].toFixed(1)}" y2="${pts[i][1].toFixed(1)}" stroke="${shade(a.c3,-.15)}" stroke-width="1" opacity=".55"/>`;
  if (a.panel) { s += panelMark(a); }
  else {
    s += `<circle r="33" fill="${a.glow}"/><circle r="33" fill="none" stroke="${a.c3}" stroke-width="3"/>`;
    for (let i = 0; i < 8; i++) s += `<ellipse cx="0" cy="-17" rx="6" ry="13" fill="${a.c1 === "#F7F0E2" ? a.c3 : a.c2}" opacity=".9" transform="rotate(${i*45})"/>`;
    s += `<circle r="7" fill="${a.c1 === "#F7F0E2" ? a.c3 : a.c1}"/>`;
  }
  s += `<path d="M-9 -88 L9 -88 L5 -98 L-5 -98Z" fill="${a.c3}"/>`;
  return {svg:s, top:-98};
}
function drawStar(a, u, fA){
  const R = 90, r = 38, pts = [];
  for (let i = 0; i < 10; i++) { const ang = (-90 + i*36) * Math.PI/180, rad = i % 2 ? r : R; pts.push([rad*Math.cos(ang), rad*Math.sin(ang)]); }
  let s = "";
  for (let k = 0; k < 7; k++) { const x = -14 + k*4.6; s += `<path d="M${x.toFixed(1)} 36 Q${(x+1).toFixed(1)} 80 ${(x+2).toFixed(1)} 120" stroke="${k%2 ? a.c2 : a.c3}" stroke-width="3" fill="none"/>`; }
  s += `<circle cx="0" cy="38" r="6" fill="${a.c2}"/>`;
  for (let i = 0; i < 10; i++) {
    const p1 = pts[i], p2 = pts[(i+1) % 10];
    s += `<path d="M0 0L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z" fill="${i % 2 ? shade(a.c1,-.22) : a.c1}"/>`;
  }
  s += `<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${shade(a.c1,-.35)}" stroke-width="1.5" stroke-linejoin="round"/>`;
  for (let i = 0; i < 5; i++) s += `<circle cx="0" cy="-40" r="5" fill="${a.glow}" transform="rotate(${i*72})"/>`;
  s += `<circle r="12" fill="${a.glow}"/><circle r="6" fill="${a.c2}"/>`;
  return {svg:s, top:-90};
}
function drawButterfly(a, u, fA, fB){
  const up = `M0 -12 C-30 -80 -98 -96 -102 -46 C-106 -4 -50 8 0 4Z`;
  const lo = `M0 8 C-40 10 -82 30 -72 66 C-62 98 -16 60 0 26Z`;
  const wing = sx => `<g transform="scale(${sx} 1)">
    <path d="${up}" fill="${fA}" stroke="${a.c3}" stroke-width="5" stroke-linejoin="round"/>
    <path d="${up}" fill="#000" opacity=".08" transform="translate(0 6) scale(.92)"/>
    <circle cx="-64" cy="-44" r="14" fill="${a.glow}"/><circle cx="-64" cy="-44" r="6" fill="${fB}"/>
    <circle cx="-36" cy="-24" r="6" fill="${a.glow}"/><circle cx="-86" cy="-24" r="4.5" fill="${a.glow}"/>
    <path d="${lo}" fill="${fB}" stroke="${a.c3}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="-46" cy="50" r="10" fill="${a.glow}"/><circle cx="-26" cy="34" r="4" fill="${a.glow}"/></g>`;
  let s = tails([a.c1, a.c2, a.c3], 50, 34, 80, 5);
  s += wing(1) + wing(-1);
  s += `<ellipse cx="0" cy="2" rx="9" ry="50" fill="${shade(a.c3 === "#FBF4E6" ? "#24205A" : a.c3, -.35)}"/>`;
  for (let k = -3; k <= 3; k++) s += `<path d="M-8 ${k*12} Q0 ${k*12+4} 8 ${k*12}" stroke="${a.glow}" stroke-width="1.6" fill="none" opacity=".8"/>`;
  s += `<path d="M-3 -46 Q-12 -70 -24 -78 M3 -46 Q12 -70 24 -78" stroke="${shade(a.c3 === "#FBF4E6" ? "#24205A" : a.c3,-.35)}" stroke-width="2.5" fill="none"/><circle cx="-24" cy="-78" r="3.5" fill="${a.c2}"/><circle cx="24" cy="-78" r="3.5" fill="${a.c2}"/>`;
  return {svg:s, top:-50};
}
function q(p0, p1, p2, t){ const m = 1-t; return [m*m*p0[0] + 2*m*t*p1[0] + t*t*p2[0], m*m*p0[1] + 2*m*t*p1[1] + t*t*p2[1]]; }
function drawKaranji(a, u, fA, fB){
  const B1 = [-24,-26], C1 = [-60,-76], T = [0,-92], C2 = [60,-76], B2 = [24,-26];
  let s = tails([a.c1, a.c2, a.c3], 60, 56, 104, 7);
  for (let i = 0; i < 6; i++) {
    const rot = i*60;
    let g = `<path d="M${B1}Q${C1} ${T}Q${C2} ${B2}Z" fill="${i % 2 ? fB : fA}"/>`;
    g += `<path d="M${B1}Q${C1} ${T}Q${C2} ${B2}Z" fill="#000" opacity="${(0.05 + 0.1*Math.max(0, Math.cos((rot-140)*Math.PI/180))).toFixed(3)}"/>`;
    for (let t = .12; t < .96; t += .14) { const p = q(B1, C1, T, t); g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.2" fill="${a.c3}"/>`; }
    for (let t = .06; t < .9; t += .14) { const p = q(T, C2, B2, t); g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.2" fill="${a.c3}"/>`; }
    g += `<path d="M0 -36 Q-8 -58 0 -74 Q8 -58 0 -36Z" fill="${a.glow}" opacity=".9"/>`;
    s += `<g transform="rotate(${rot})">${g}</g>`;
  }
  s += `<circle r="33" fill="${a.c3}"/><circle r="25" fill="${a.glow}"/>`;
  for (let i = 0; i < 6; i++) s += `<circle cx="0" cy="-14" r="5" fill="${a.c1}" transform="rotate(${i*60+30})"/>`;
  s += `<circle r="6" fill="${a.c2}"/>`;
  return {svg:s, top:-94};
}
function drawMatka(a, u, fA, fB){
  const pot = `M-30 -82 L30 -82 L26 -70 Q22 -62 30 -56 C86 -40 94 46 42 70 Q0 82 -42 70 C-94 46 -86 -40 -30 -56 Q-22 -62 -26 -70Z`;
  let s = "";
  [-22, 0, 22].forEach((x, i) => {
    s += `<path d="M${x} 74 L${x+i-1} 112" stroke="${a.c3}" stroke-width="2"/>`;
    s += `<circle cx="${x+i-1}" cy="${92}" r="4" fill="${a.c2}"/>`;
    for (let k = 0; k < 6; k++) s += `<path d="M${x+i-1} 112 L${x+i-1 + (k-2.5)*2.2} 134" stroke="${k%2 ? a.c2 : a.c3}" stroke-width="2.2"/>`;
  });
  s += `<clipPath id="cp${u}"><path d="${pot}"/></clipPath>`;
  s += `<path d="${pot}" fill="${fA}"/>`;
  s += `<g clip-path="url(#cp${u})">
     <rect x="-110" y="-26" width="220" height="28" fill="${fB}"/>`;
  for (let x = -100; x <= 100; x += 16) s += `<path d="M${x} -26 L${x+8} -14 L${x+16} -26Z" fill="${a.c3}"/>`;
  for (let x = -84; x <= 84; x += 24) s += `<path d="M${x} -8 L${x+6} -2 L${x} 4 L${x-6} -2Z" fill="${a.glow}"/>`;
  s += `<rect x="-110" y="30" width="220" height="10" fill="${a.c3}"/>`;
  for (let x = -96; x <= 96; x += 14) s += `<circle cx="${x}" cy="50" r="3.4" fill="${a.glow}"/>`;
  s += `<ellipse cx="-34" cy="-6" rx="22" ry="44" fill="#fff" opacity=".1"/>
        <path d="M30 -60 C90 -40 92 50 40 74 L120 74 L120 -70Z" fill="#000" opacity=".16"/></g>`;
  s += `<path d="${pot}" fill="none" stroke="${shade(a.c3,-.2)}" stroke-width="2"/>`;
  s += `<rect x="-34" y="-90" width="68" height="10" rx="3" fill="${a.c3}"/><rect x="-26" y="-74" width="52" height="5" fill="${fB}"/>`;
  return {svg:s, top:-90};
}
function lanternBody(p, art){
  const a = art || p.art, u = ++_u, motif = p.motif || "";
  const defs = patternDefs(motif, a, u);
  const fA = defs ? `url(#pa${u})` : a.c1, fB = defs ? `url(#pb${u})` : a.c2;
  const fn = {akash:drawAkash, star:drawStar, butterfly:drawButterfly, karanji:drawKaranji, matka:drawMatka}[p.shape] || drawAkash;
  const r = fn(a, u, fA, fB);
  return {defs, svg:r.svg, top:r.top, u};
}
function lanternSVG(p, opts={}){
  const art = Object.assign({}, p.art, opts.art || {});
  const b = lanternBody(p, art);
  const u = b.u;
  const scale = (p.scale || (p.size === "big" ? 1 : .84)) * (opts.zoom || 1);
  const cx = 150, cy = p.shape === "butterfly" ? 170 : 160;
  const topY = cy + b.top * scale;
  let tier = "";
  if (p.tier) {
    const t = lanternBody(p, Object.assign({}, art, {c1:art.c2, c2:art.c1}));
    tier = `<defs>${t.defs}</defs><g transform="translate(${cx} ${topY - 34}) scale(${scale*.36})">${t.svg}</g>`;
  }
  const cordTop = p.tier ? topY - 34 + t2top(p, scale) : topY;
  return `<svg viewBox="0 0 300 360" role="img" aria-label="${esc(p.name)}" xmlns="http://www.w3.org/2000/svg">
    <defs>${b.defs}<radialGradient id="gl${u}"><stop offset="0" stop-color="${art.glow}" stop-opacity=".55"/><stop offset=".55" stop-color="${art.glow}" stop-opacity=".12"/><stop offset="1" stop-color="${art.glow}" stop-opacity="0"/></radialGradient></defs>
    <rect width="300" height="360" fill="${art.bg}"/>
    <circle cx="${cx}" cy="${cy}" r="175" fill="url(#gl${u})"/>
    <path d="M${cx} 0 V${cordTop.toFixed(1)}" stroke="${shade(art.bg,-.55)}" stroke-width="2"/>
    ${p.tier ? `<path d="M${cx} ${(topY-34).toFixed(1)} V${topY.toFixed(1)}" stroke="${shade(art.bg,-.55)}" stroke-width="2"/>` : ""}
    <g transform="translate(${cx} ${cy}) scale(${scale})">${b.svg}</g>
    ${tier}
  </svg>`;
}
function t2top(p, scale){ return -98 * scale * .36; }
function plateHTML(p, art){
  if (p.photo) return `<img src="${esc(p.photo)}" alt="${esc(p.name)}" style="width:100%;height:100%;object-fit:cover;display:block">`;
  return lanternSVG(p, {art});
}
function laneSVG(){
  const shapes = ["akash","butterfly","matka","star","karanji","akash","matka","butterfly","star","akash","karanji","matka"];
  const palettes = [["#EE8A1F","#C8336E","#F5B731"],["#F5B731","#E8604C","#17775A"],["#C8336E","#F5B731","#FBF4E6"],["#F5B731","#EE8A1F","#FBF4E6"],["#17775A","#F5B731","#E8604C"],["#E8604C","#F5B731","#FBF4E6"]];
  let s = `<path d="M-10 18 Q600 96 1210 18" stroke="#C9C2EA" stroke-opacity=".5" stroke-width="1.6" fill="none"/>`;
  const N = shapes.length;
  for (let i = 0; i < N; i++) {
    const x = 60 + i * (1080/(N-1));
    const t = (x + 10)/1220, y = (1-t)*(1-t)*18 + 2*(1-t)*t*96 + t*t*18;
    const drop = [26, 44, 18, 52, 30, 40, 22, 48, 34, 20, 46, 28][i];
    const pal = palettes[i % palettes.length];
    const fake = {shape:shapes[i], art:{c1:pal[0], c2:pal[1], c3:pal[2], glow:"#FFE2A0"}};
    const b = lanternBody(fake, fake.art);
    const sc = .32, top = y + drop;
    s += `<g class="swing" style="animation-delay:${(-i*0.9).toFixed(1)}s"><path d="M${x.toFixed(1)} ${y.toFixed(1)} V${top.toFixed(1)}" stroke="#C9C2EA" stroke-opacity=".55" stroke-width="1.2"/>
      <circle cx="${x.toFixed(1)}" cy="${(top - b.top*sc).toFixed(1)}" r="36" fill="#FFD58A" opacity=".08"/>
      <defs>${b.defs}</defs><g transform="translate(${x.toFixed(1)} ${(top - b.top*sc).toFixed(1)}) scale(${sc})">${b.svg}</g></g>`;
  }
  return s;
}
function brandMark(){
  const fake = {shape:"akash", art:{c1:"#EE8A1F", c2:"#C8336E", c3:"#F5B731", glow:"#FFE2A0"}};
  const b = lanternBody(fake, fake.art);
  return `<svg viewBox="-105 -102 210 250" aria-hidden="true"><g>${b.svg}</g></svg>`;
}
function sealSVG(i){
  const pal = [["#EE8A1F","#C8336E","#24205A"],["#17775A","#F5B731","#24205A"],["#C8336E","#F5B731","#3A2F86"],["#F5B731","#17775A","#8E1F4C"],["#E8604C","#FBF4E6","#17775A"]][i % 5];
  let s = `<svg viewBox="0 0 72 72" aria-hidden="true"><rect width="72" height="72" fill="${pal[2]}"/>`;
  for (let k = 0; k < 12; k++) s += `<path d="M36 36 L${(36+40*Math.cos(k*Math.PI/6)).toFixed(1)} ${(36+40*Math.sin(k*Math.PI/6)).toFixed(1)} L${(36+40*Math.cos((k+.5)*Math.PI/6)).toFixed(1)} ${(36+40*Math.sin((k+.5)*Math.PI/6)).toFixed(1)}Z" fill="${k%2?pal[0]:pal[1]}" opacity=".9"/>`;
  s += `<circle cx="36" cy="36" r="14" fill="${pal[2]}"/><circle cx="36" cy="36" r="8" fill="#FFD58A"/></svg>`;
  return s;
}

/* =====================================================================
   STATE
   ===================================================================== */
const S = {
  cart: store.get("cart", []),          // [{key,id,qty,custom}]
  msgs: store.get("msgs", []),
  ctx: store.get("ctx", {}),
  flow: store.get("flow", null),
  co: store.get("co", {mode:"delivery", plan:"full", method:"upi"}),
  coStep: 1,
  orders: store.get("orders", []),
  enquiries: store.get("enquiries", []),
  status: store.get("status", {}),
  households: store.get("households", [{id:"h1", name:"Household 1", cap:""},{id:"h2", name:"Household 2", cap:""},{id:"h3", name:"Household 3", cap:""}]),
  made: store.get("made", {}),
  shop: {size:"all", style:"all", sort:"featured", q:""},
  lastOrder: store.get("lastOrder", null),
  deskTab: "orders", deskFilter: "all",
  priceNoted: store.get("priceNoted", false),
  remote: {orders:[], enquiries:[], status:{}},
};
const saveCart = () => { store.set("cart", S.cart); updateCartCount(); };
const saveChat = () => { store.set("msgs", S.msgs.slice(-80)); store.set("ctx", S.ctx); store.set("flow", S.flow); };

/* =====================================================================
   SHARED ORDERS AND MAKERS’ DESK
   ===================================================================== */
let online = false, testPayments = false, placing = false, signedIn = false;
let deskBusy = false, deskRead=0;
const demoStatus = store.get("demoStatus",{});
async function api(action, fields = {}) {
  const r = await fetch("/.netlify/functions/market", {
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action,...fields}), cache:"no-store"
  });
  const data=await r.json().catch(()=>({error:"The shop service could not be reached. Please retry."}));
  if (!r.ok || data.error) throw Object.assign(new Error(data.error || "Please try again."),{status:r.status});
  return data;
}
function money(o) {
  const paid=o.balanceReceived ? o.total : (o.manualPaid || o.paidNow || 0);
  return {paid,due:o.total-paid,label:paid===o.total ? "Paid in full" : paid>0 ? "Part payment received" : o.payStatus};
}
const receipts = () => store.get("receipts",[]);
function loginPage(message="") {
  signedIn=false;deskRead++;
  S.remote={orders:[],enquiries:[],status:{}};
  $("#deskBody").innerHTML='<form id="deskLogin" class="box stack"><h1 class="display">Makers’ desk</h1><p>Sign in to manage orders, quotes and household assignments.</p><label for="deskPassword">Makers’ password</label><input id="deskPassword" class="inp" type="password" required autocomplete="current-password"><button class="btn btn-main">Sign in</button><p role="status" id="deskMessage"></p></form>';
  $("#deskMessage").textContent=message;
  $("#deskLogin").onsubmit=async e=>{
    e.preventDefault();
    const button=e.target.querySelector("button");
    button.disabled=true;
    try {await api("login",{password:$("#deskPassword").value}); await refreshDesk();}
    catch(err){$("#deskMessage").textContent=err.message;}
    finally{button.disabled=false;}
  };
}
async function refreshDesk(quiet=false) {
  const request=++deskRead;
  try {
    const {orders,enquiries,settings}=await api("desk");
    if(currentView()!=="makers-desk" || request!==deskRead) return;
    if(quiet && (deskBusy || $("#deskBody").contains(document.activeElement))) return;
    signedIn=true;
    S.remote={orders,enquiries,status:Object.fromEntries([...orders,...enquiries].map(o=>[o.id,o]))};
    S.households=settings.households; S.made=settings.made;
    renderDesk();
  } catch(e) {
    if(request===deskRead && currentView()==="makers-desk" && (!quiet || e.status===401)) loginPage(e.status===401 ? "" : e.message);
  }
}
async function modifyDesk(action,fields) {
  if(deskBusy || !signedIn) return;
  deskBusy=true;
  $("#deskBody").inert=true;
  try {
    await api(action,fields);
    await refreshDesk();
    toast("Saved");
  } catch(e) { await refreshDesk(); toast(e.message); }
  finally {deskBusy=false;$("#deskBody").inert=false;}
}

/* =====================================================================
   PRODUCT CARDS & SHEET
   ===================================================================== */
const ICON_HAND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L4 14.6a1.6 1.6 0 0 1 2.6-1.8L7 13.3"/></svg>`;
function priceHTML(p){
  if (p.price == null) return `<span class="price" style="font-size:15.5px">Quoted per order</span>`;
  return `<span class="price">${inr(p.price)}</span><small style="font-size:12px;color:var(--ink-3)">proposed</small>`;
}
function cardHTML(p, usePhoto = false){
  const quote = p.price == null;
  const photo = usePhoto === true ? SHOP_PHOTOS[p.id] : null;
  return `<article class="pcard">
    <button class="plate${photo ? " plate-photo" : ""}" data-act="details" data-id="${p.id}" aria-label="View ${esc(p.name)}">${photo ? `<img src="${esc(photo.src)}" alt="${esc(photo.alt)}" width="900" height="1080" loading="lazy" decoding="async" style="object-position:${photo.position}">` : plateHTML(p)}</button>
    ${photo ? `<div class="photo-caption"><span>Reference photo</span><a href="${esc(photo.credit)}" target="_blank" rel="noopener" aria-label="Photo source and licence for ${esc(p.name)}">Photo credit ↗</a></div>` : ""}
    <div class="pb">
      <div class="pname">${esc(p.name)}</div>
      <div class="tags"><span class="tag ${p.size}">${SIZE_LABEL[p.size]}</span><span class="tag ${p.style}">${STYLE_LABEL[p.style]}</span>${p.premium && p.style !== "custom" ? `<span class="tag">Premium</span>` : ""}</div>
      <p class="pdesc">${esc(p.desc)}</p>
      <div class="maker">${ICON_HAND}Artisan-made in Mahim</div>
      <div class="pricerow">${priceHTML(p)}</div>
      <div class="pbtns">
        ${quote ? `<button class="btn btn-add" data-act="quote" data-id="${p.id}">Get a quote</button>`
                : p.personalise ? `<button class="btn btn-add" data-act="details" data-id="${p.id}">Personalise</button>`
                : `<button class="btn btn-add" data-act="add" data-id="${p.id}">Add to cart</button>`}
        <button class="btn btn-ghost" data-act="details" data-id="${p.id}">View details</button>
      </div>
    </div>
  </article>`;
}
let sheetState = null, sheetOpener=null;
function openSheet(id){
  const p = byId(id); if (!p) return;
  sheetOpener=document.activeElement;
  for(const el of $$("header,main,.botnav")) el.inert=true;
  sheetState = {id, qty:1, name:"", colour:COLOUR_STORIES[0].id};
  renderSheet();
  $("#scrim").classList.add("on"); $("#sheet").classList.add("on");
  document.body.style.overflow = "hidden";
  setTimeout(() => { const b = $("#sheet .sheet-close"); b && b.focus(); }, 60);
}
function sheetArt(p){
  if (!p.personalise) return null;
  const c = COLOUR_STORIES.find(c => c.id === sheetState.colour);
  return {c1:c.c1, c2:c.c2, c3:c.c3, bg:c.bg, panel: sheetState.name ? sheetState.name.trim().slice(0,8) : "Aa"};
}
function renderSheet(){
  const p = byId(sheetState.id), quote = p.price == null;
  const occ = p.size === "small" ? "Homes, balconies, windows and entrances" : "Larger homes, societies, offices, hotels and events";
  $("#sheet").innerHTML = `<button class="sheet-close" data-act="closeSheet" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  <div class="sheet-in">
    <div class="plate" id="sheetPlate" style="background:${(sheetArt(p) || p.art).bg}">${plateHTML(p, sheetArt(p))}</div>
    <div class="sheet-body">
      <div class="tags"><span class="tag ${p.size}">${SIZE_LABEL[p.size]}</span><span class="tag ${p.style}">${STYLE_LABEL[p.style]}</span>${p.premium && p.style !== "custom" ? `<span class="tag">Premium</span>` : ""}</div>
      <h2>${esc(p.name)}</h2>
      <p style="color:var(--ink-2)">${esc(p.desc)}</p>
      <div class="pricerow">${priceHTML(p)}</div>
      <dl class="facts">
        <dt>Made from</dt><dd>${esc(p.material)}</dd>
        <dt>Size</dt><dd>${SIZE_LABEL[p.size]}. ${occ}.</dd>
        <dt>Made by</dt><dd>Artisan households of Kandil Galli, Mahim. Hand-cut and hand-assembled.</dd>
        <dt>Lighting</dt><dd>Use a ready-made LED fitting rather than a flame inside paper or fabric.</dd>
        ${quote || p.personalise || p.style === "custom" ? `<dt>Booking</dt><dd>Made to order with a 30% advance.</dd>` : ""}
      </dl>
      ${p.personalise ? `
        <div class="field" id="fName"><label for="persName">Name or initials to cut into the panel</label>
          <input class="inp" id="persName" maxlength="8" value="${esc(sheetState.name)}" placeholder="Up to 8 letters">
          <span class="hint">Simple letters cut best by hand. The makers will confirm the layout with you.</span>
          <span class="err">Add a name or initials to continue.</span></div>
        <div class="field"><label>Colour story</label><div class="swatches">${COLOUR_STORIES.map(c => `<button class="swatch" data-act="colour" data-c="${c.id}" aria-pressed="${sheetState.colour === c.id}"><i style="background:linear-gradient(90deg,${c.c1} 50%,${c.c2} 50%)"></i>${c.name}</button>`).join("")}</div></div>` : ""}
      ${quote ? `<button class="btn btn-add btn-wide" data-act="quote" data-id="${p.id}">Request a quote</button>
                 <p style="font-size:14px;color:var(--ink-2)">Opens a short guided chat. The makers call you back with a price.</p>`
      : `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <div class="qty" aria-label="Quantity"><button data-act="sq-" aria-label="Decrease">−</button><span id="sq">${sheetState.qty}</span><button data-act="sq+" aria-label="Increase">+</button></div>
          <button class="btn btn-add" style="flex:1" data-act="sheetAdd">Add to cart, ${inr(p.price * sheetState.qty)}</button>
        </div>`}
      <button class="btn btn-ghost" data-act="askAbout" data-id="${p.id}">Ask the shop about this</button>
    </div>
  </div>`;
  const inp = $("#persName");
  if (inp) inp.addEventListener("input", e => { sheetState.name = e.target.value; $("#sheetPlate").innerHTML = plateHTML(p, sheetArt(p)); $("#sheetPlate").style.background = sheetArt(p).bg; $("#fName").classList.remove("bad"); });
}
function closeSheet(){
  $("#scrim").classList.remove("on"); $("#sheet").classList.remove("on");
  document.body.style.overflow = ""; sheetState = null;
  for(const el of $$("header,main,.botnav")) el.inert=false;
  if(sheetOpener?.isConnected) sheetOpener.focus({preventScroll:true});
}

/* =====================================================================
   CART
   ===================================================================== */
function addToCart(id, qty=1, custom=null){
  const p = byId(id); if (!p || p.price == null) return;
  const key = id + (custom ? "|" + custom.text + "|" + custom.colour : "");
  const line = S.cart.find(l => l.key === key);
  if ((line?.qty || 0)+qty>999) return toast("For more than 999 pieces, request a bulk quote.");
  if (line) line.qty += qty; else S.cart.push({key, id, qty, custom});
  saveCart();
  toast(`Added ${p.name}${qty > 1 ? " × " + qty : ""}`, "#cart", "View cart");
  if (currentView() === "cart") renderCart();
}
const cartCount = () => S.cart.reduce((a, l) => a + l.qty, 0);
const cartTotal = () => S.cart.reduce((a, l) => a + l.qty * (byId(l.id)?.price || 0), 0);
const cartHasCustom = () => S.cart.some(l => byId(l.id)?.personalise);
function updateCartCount(){
  const n = cartCount();
  $("#cartCount").textContent = n;
  const d = $("#navDot"); d.textContent = n; d.hidden = !n;
}
function lineArt(l){
  const p = byId(l.id);
  if (!l.custom) return null;
  const c = COLOUR_STORIES.find(c => c.id === l.custom.colour) || COLOUR_STORIES[0];
  return {c1:c.c1, c2:c.c2, c3:c.c3, bg:c.bg, panel:l.custom.text};
}
function lineMeta(l){
  const p = byId(l.id);
  let m = `${SIZE_LABEL[p.size]}, ${STYLE_LABEL[p.style].toLowerCase()}`;
  if (l.custom) m += `. Panel: “${esc(l.custom.text)}”, ${COLOUR_STORIES.find(c => c.id === l.custom.colour)?.name.toLowerCase()}`;
  return m;
}
function renderCart(){
  const body = $("#cartBody");
  if (!S.cart.length) {
    body.innerHTML = `<div class="empty" style="margin-bottom:40px"><p style="font-size:18px;font-weight:600;color:var(--ink)">Your cart is empty</p><p style="margin-top:6px">Ask the shop assistant for ideas, or browse every design.</p>
      <div class="actions" style="justify-content:center;margin-top:14px"><a class="btn btn-main" href="#chat">Ask the shop</a><a class="btn btn-ghost" href="#shop">Browse kandils</a></div></div>`;
    return;
  }
  const total = cartTotal();
  body.innerHTML = `<div class="cols">
    <div>${S.cart.map(l => { const p = byId(l.id); return `
      <div class="line">
        <div class="thumb">${plateHTML(p, lineArt(l))}</div>
        <div>
          <div class="line-top"><span class="line-name">${esc(p.name)}</span><b>${inr(p.price * l.qty)}</b></div>
          <div class="line-meta">${lineMeta(l)}</div>
          <div class="line-meta">${inr(p.price)} each, proposed price</div>
          <div class="line-bot">
            <div class="qty" aria-label="Quantity for ${esc(p.name)}"><button data-act="q-" data-key="${esc(l.key)}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-act="q+" data-key="${esc(l.key)}" aria-label="Increase">+</button></div>
            <button class="linkbtn" data-act="remove" data-key="${esc(l.key)}">Remove</button>
          </div>
        </div>
      </div>`; }).join("")}
      <div class="actions" style="margin-top:14px"><a class="btn btn-ghost" href="#shop">Keep browsing</a><a class="btn btn-ghost" href="#chat">Back to the assistant</a></div>
    </div>
    <div class="sticky"><div class="box">
      <h3>Order summary</h3>
      ${S.cart.map(l => `<div class="sumrow"><span>${esc(byId(l.id).name)} × ${l.qty}</span><span>${inr(byId(l.id).price * l.qty)}</span></div>`).join("")}
      <div class="sumrow"><span>Delivery</span><span class="muted">Confirmed by the makers<br>before dispatch</span></div>
      <div class="sumrow total"><span>Total</span><span>${inr(total)}</span></div>
      <p style="font-size:13.5px;color:var(--ink-2);margin:8px 0 12px">Pay in full, or book with a 30% advance (${inr(Math.round(total*.3))}) and pay the rest on delivery or pickup.</p>
      <a class="btn btn-main btn-wide" href="#checkout" data-act="toCheckout">Checkout</a>
    </div></div>
  </div>`;
}

/* =====================================================================
   CHECKOUT
   ===================================================================== */
function renderCheckout(){
  const body = $("#checkoutBody");
  if (!S.cart.length) { body.innerHTML = `<div class="empty" style="margin-bottom:40px">Your cart is empty. <a href="#shop">Browse kandils</a> first.</div>`; return; }
  const st = S.coStep, c = S.co, total = cartTotal();
  if (!["cash","online","arrange"].includes(c.method) || (c.method==="online" && !online)) c.method=online ? "online" : "arrange";
  if (c.method==="cash" && (c.mode!=="pickup" || c.plan==="advance" || cartHasCustom())) c.method=online ? "online" : "arrange";
  const steps = ["Your details", "Delivery or pickup", "Review order"];
  const summary = `<div class="box"><h3>Itemised summary</h3>
    ${S.cart.map(l => { const p = byId(l.id); return `<div class="sumrow"><span>${esc(p.name)} × ${l.qty}${l.custom ? `<br><small style="color:var(--ink-3)">Panel “${esc(l.custom.text)}”</small>` : ""}</span><span>${inr(p.price * l.qty)}</span></div>`; }).join("")}
    <div class="sumrow"><span>${c.mode === "pickup" ? "Pickup from the lane" : "Delivery"}</span><span class="muted">${c.mode === "pickup" ? "Free" : "Confirmed before dispatch"}</span></div>
    <div class="sumrow total"><span>Order total</span><span>${inr(total)}</span></div></div>`;
  let main = "";
  if (st === 1) main = `<div class="stack">
      <div class="field" id="f-name"><label for="coName">Full name</label><input class="inp" id="coName" autocomplete="name" maxlength="120" value="${esc(c.name)}"><span class="err">Enter your name so the makers know who the order is for.</span></div>
      <div class="field" id="f-phone"><label for="coPhone">Mobile number</label><input class="inp" id="coPhone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="17" placeholder="10-digit mobile number" value="${esc(c.phone)}"><span class="hint">The makers call or message this number about your order.</span><span class="err">Enter a 10-digit Indian mobile number, starting with 6, 7, 8 or 9.</span></div>
      <button class="btn btn-main" data-act="coNext">Continue to delivery</button></div>`;
  if (st === 2) main = `<div class="stack">
      <label class="choice"><input type="radio" name="mode" value="delivery" ${c.mode !== "pickup" ? "checked" : ""}><div><b>Deliver to me</b><span>Courier or local delivery arranged by the makers. Charges depend on size and are confirmed before dispatch.</span></div></label>
      <label class="choice"><input type="radio" name="mode" value="pickup" ${c.mode === "pickup" ? "checked" : ""}><div><b>Pick up from Kandil Galli</b><span>Collect from the lane in Mahim West, near Mahim station. Free.</span></div></label>
      <div id="addrFields" class="stack" ${c.mode === "pickup" ? "hidden" : ""}>
        <div class="field" id="f-addr"><label for="coAddr">House, building and street</label><input class="inp" id="coAddr" autocomplete="street-address" maxlength="250" value="${esc(c.addr)}"><span class="err">Enter the delivery address.</span></div>
        <div class="two">
          <div class="field" id="f-city"><label for="coCity">Area and city</label><input class="inp" id="coCity" maxlength="120" value="${esc(c.city)}" placeholder="e.g. Dadar, Mumbai"><span class="err">Enter the area and city.</span></div>
          <div class="field" id="f-pin"><label for="coPin">PIN code</label><input class="inp" id="coPin" inputmode="numeric" maxlength="6" value="${esc(c.pin)}"><span class="err">Enter a 6-digit PIN code.</span></div>
        </div>
      </div>
      <div class="field"><label for="coDate">Preferred ${c.mode === "pickup" ? "pickup" : "delivery"} date (optional)</label><input class="inp" id="coDate" type="date" min="${new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})}" value="${esc(c.date)}"><span class="hint">Booking ahead? Choose a date and pay a 30% advance on the next step.</span></div>
      <div class="field"><label for="coNotes">Notes for the makers (optional)</label><textarea class="inp" id="coNotes" maxlength="500" rows="2">${esc(c.notes)}</textarea></div>
      <div class="actions"><button class="btn btn-ghost" data-act="coBack">Back</button><button class="btn btn-main" data-act="coNext">Review order</button></div></div>`;
  if (st === 3) {
    const adv = Math.round(total * .3);
    const needsAdvance = cartHasCustom();
    main = `<div class="stack">
      <div class="box">
        <h3>Delivering to</h3>
        <p><b>${esc(c.name)}</b>, ${esc(c.phone)}</p>
        <p style="color:var(--ink-2)">${c.mode === "pickup" ? "Pickup from Kandil Galli, Mahim West" : esc([c.addr, c.city, c.pin].filter(Boolean).join(", "))}${c.date ? `. Preferred date ${fmtDay(c.date)}` : ""}</p>
        <button class="linkbtn" data-act="coGoto" data-s="2">Change</button>
      </div>
      <div>
        <h3 style="font-family:var(--body);font-weight:600;font-size:18px;margin-bottom:8px">How would you like to pay?</h3>
        <div class="stack" style="gap:10px">
          <label class="choice"><input type="radio" name="plan" value="full" ${c.plan !== "advance" ? "checked" : ""}><div><b>Pay in full, ${inr(total)}</b><span>Covers the price of the kandils${c.mode === "delivery" ? " except any delivery charge" : ""}.</span></div></label>
          <label class="choice"><input type="radio" name="plan" value="advance" ${c.plan === "advance" ? "checked" : ""}><div><b>Book with a 30% advance, ${inr(adv)}</b><span>The advance pays for materials and books your order. Balance ${inr(total - adv)} on ${c.mode === "pickup" ? "pickup" : "delivery"}.${needsAdvance ? " Personalised pieces are always booked with an advance or paid in full." : ""}</span></div></label>
        </div>
        ${c.plan === "advance" ? `<div class="split"><div><small>Advance</small><b>${inr(adv)}</b></div><div><small>Balance later</small><b>${inr(total - adv)}</b></div></div>` : ""}
      </div>
      <div>
        <h3 style="font-family:var(--body);font-weight:600;font-size:18px;margin-bottom:8px">Payment method</h3>
        <div class="paytabs" role="group" aria-label="Payment method">
          ${online ? `<button class="paytab" data-act="method" data-m="online" aria-pressed="${c.method==="online"}">Pay online<small>Razorpay${testPayments?" · test mode":""}</small></button>` : ""}
          <button class="paytab" data-act="method" data-m="arrange" aria-pressed="${c.method==="arrange"}">Arrange with makers<small>Payment after confirmation</small></button>
          <button class="paytab" data-act="method" data-m="cash" aria-pressed="${c.method==="cash"}" ${c.mode!=="pickup" || needsAdvance || c.plan==="advance" ? "disabled" : ""}>Pay at pickup<small>Standard pickup orders</small></button>
        </div>
        <p class="hint">${c.method==="online" ? "Place your order, then choose UPI, card or net banking on the secure payment page. Available methods depend on the merchant account." : c.method==="cash" ? "Pay when you collect your kandils in Mahim." : "The makers will call to confirm your order and arrange payment. Your receipt shows the amount outstanding."}</p>
      </div>
      <div class="actions"><button class="btn btn-ghost" data-act="coBack">Back</button><button class="btn btn-add" style="flex:1" data-act="pay">Place order</button></div>
      <p id="checkoutError" role="alert"></p>

    </div>`;
  }
  body.innerHTML = `<ol class="steps">${steps.map((s, i) => `<li class="${i+1 === st ? "on" : i+1 < st ? "done" : ""}">${s}</li>`).join("")}</ol>
    <div class="cols"><div>${main}</div><div class="sticky">${summary}</div></div>`;
  $$('input[name="mode"]').forEach(r => r.addEventListener("change", e => { collectCo(); S.co.mode = e.target.value; store.set("co", S.co); renderCheckout(); }));
  $$('input[name="plan"]').forEach(r => r.addEventListener("change", e => { collectCo(); S.co.plan = e.target.value; if (S.co.plan === "advance" && S.co.method === "cash") S.co.method = online ? "online" : "arrange"; store.set("co", S.co); renderCheckout(); }));
}

function collectCo(){
  const v = id => { const el = $("#" + id); return el ? el.value.trim() : undefined; };
  const map = {coName:"name", coPhone:"phone", coAddr:"addr", coCity:"city", coPin:"pin", coDate:"date", coNotes:"notes"};
  Object.entries(map).forEach(([id, k]) => { const x = v(id); if (x !== undefined) S.co[k] = x; });
  store.set("co", S.co);
}
function flag(id, bad){ const f = $("#" + id); if (f) f.classList.toggle("bad", !!bad); return !bad; }
function validStep(st){
  const c = S.co; let ok = true;
  if (st === 1) {
    ok = flag("f-name", !c.name || c.name.length < 2) && ok;
    const ph = (c.phone || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    ok = flag("f-phone", !/^[6-9]\d{9}$/.test(ph)) && ok;
    if (ok) { c.phone = ph; store.set("co", c); }
  }
  if (st === 2 && c.mode !== "pickup") {
    ok = flag("f-addr", !c.addr || c.addr.length < 4) && ok;
    ok = flag("f-city", !c.city || c.city.length < 2) && ok;
    ok = flag("f-pin", !/^[1-9]\d{5}$/.test(c.pin || "")) && ok;
  }
  if(st===2 && $("#coDate") && !$("#coDate").reportValidity()) return false;
  if (!ok) { const b = $(".field.bad input, .field.bad select"); b && b.focus(); }
  return ok;
}
async function runPayment(){
  if (placing || !S.cart.length) return;
  collectCo();
  const items=S.cart.map(({id,qty,custom})=>({id,qty,custom}));
  const details={...S.co};
  const fingerprint=JSON.stringify([items,details]);
  let pending=store.get("pendingOrder",{});
  if(pending?.fingerprint!==fingerprint) pending={token:crypto.randomUUID(),fingerprint};
  store.set("pendingOrder",pending);
  placing=true;
  $("#payCard").innerHTML='<div class="spinner"></div><p>Sending your order to the makers…</p>';
  $("#payOverlay").classList.add("on");
  try {
    const {id}=await api("order",{items,details,token:pending.token});
    const saved=receipts().filter(r=>r.id!==id);
    saved.unshift({id,token:pending.token});
    store.set("receipts",saved);
    S.cart=[]; saveCart();
    store.set("pendingOrder",null);
    S.coStep=1; S.co.notes="";S.co.date="";store.set("co",S.co);
    location.hash="track/"+pending.token;
  } catch(e) { $("#checkoutError").textContent=e.message; }
  finally { placing=false;$("#payOverlay").classList.remove("on"); }
}
const STATUSES = [["new","New order"],["accepted","Accepted"],["production","In production"],["ready","Ready for dispatch"],["delivered","Delivered"]];
async function renderOrder(){
  const body=$("#orderBody"), saved=receipts();
  const token=location.hash.startsWith("#track/") ? location.hash.slice(7) : saved[0]?.token;
  if (!token) {
    body.innerHTML='<div class="pagehead"><h1>My orders</h1><p>After checkout, your receipt will appear here.</p><a href="#shop">Browse kandils</a></div>';
    return;
  }
  const hash=location.hash;
  body.innerHTML='<p class="box" role="status">Opening your receipt…</p>';
  try {
    const {order:o,paymentCheck}=await api("track",{token});
    if (location.hash!==hash) return;
    const m=money(o), index=STATUSES.findIndex(([s])=>s===o.status);
    const pay=o.method==="online" && !o.paidNow && !o.balanceReceived;
    body.innerHTML=`<div class="pagehead"><h1>Thank you, ${esc(o.customer.name.split(" ")[0])}</h1><p>Order ${esc(o.id)} has reached the makers’ desk.</p></div>
      <div class="cols"><div class="stack"><section class="box"><h3>Order progress</h3><ol class="timeline">${STATUSES.map(([s,label],i)=>`<li class="${i<index?"done":i===index?"now":""}"><div>${s==="ready" && o.mode==="pickup" ? "Ready for pickup" : label}</div></li>`).join("")}</ol></section>
      <section class="box"><h3>Payment</h3><p>${esc(m.label)}${o.testPayment?" · Test payment":""}</p><div class="sumrow"><span>Received</span><b>${inr(m.paid)}</b></div><div class="sumrow"><span>Outstanding</span><b>${inr(m.due)}</b></div>
      ${o.method==="arrange" && !m.paid ? `<p>The makers will contact you on ${esc(o.customer.phone)} to confirm availability and arrange ${o.plan==="advance"?"the 30% advance":"payment"} of ${inr(o.requested)}.</p>`:""}
      ${pay && !paymentCheck.includes("Contact the makers") ? `<button class="btn btn-add" id="payLink">Pay ${inr(o.requested)} with Razorpay</button>`:""}
      <p id="payNote" role="status">${esc(paymentCheck)}</p></section></div>
      <div class="box sticky"><h3>Your order</h3>${o.items.map(i=>`<div class="sumrow"><span>${esc(i.name)} × ${i.qty}${i.custom?`<br>Panel “${esc(i.custom.text)}” · ${esc(COLOUR_STORIES.find(c=>c.id===i.custom.colour)?.name)}`:""}</span><span>${inr(i.price*i.qty)}</span></div>`).join("")}
      <div class="sumrow total"><span>Total</span><b>${inr(o.total)}</b></div><p>${esc(o.address)}${o.date ? " · "+fmtDay(o.date):""}</p>${o.mode==="delivery"?"<p>Delivery charges will be confirmed separately.</p>":""}</div></div>
      <div class="order-tools"><button class="btn btn-ghost" id="refreshReceipt">Refresh status</button><a href="#shop">Continue shopping</a></div>
      <div class="box"><h3>Private receipt link</h3><p>Save this link to check your order on another device. Anyone with the link can see these order details.</p><input class="inp" readonly aria-label="Private receipt link" id="receiptUrl"></div>
      ${saved.length>1?`<div class="box"><h3>Orders on this device</h3>${saved.map(r=>`<p><a href="#track/${esc(r.token)}">${esc(r.id)}</a></p>`).join("")}</div>`:""}`;
    $("#receiptUrl").value=MARKETPLACE_URL+"#track/"+token;
    $("#receiptUrl").onclick=e=>e.target.select();
    $("#refreshReceipt").onclick=renderOrder;
    if ($("#payLink")) $("#payLink").onclick=async e=>{
      e.target.disabled=true;
      try{const {url}=await api("pay",{token});location.assign(url);}
      catch(err){$("#payNote").textContent=err.message;e.target.disabled=false;}
    };
  } catch(e) {
    if(location.hash!==hash) return;
    body.innerHTML=`<div class="box"><h3>Receipt unavailable</h3><p>${esc(e.message)}</p><button class="btn btn-ghost" id="retryReceipt">Try again</button></div>`;
    $("#retryReceipt").onclick=renderOrder;
  }
}

/* =====================================================================
   CHAT ASSISTANT
   ===================================================================== */
const STARTERS = ["Show me small kandils","Show me big kandils","Show me traditional designs","Show me colourful and contemporary designs","Show me premium fabric kandils","I want something under ₹500","I am looking for bulk orders","I want a customised kandil","Help me choose a design","Tell me about the artisans"];
const BOT_AVATAR = () => `<span class="avatar">${(() => { const f = {shape:"akash", art:{c1:"#EE8A1F", c2:"#C8336E", c3:"#F5B731", glow:"#FFE2A0"}}; const b = lanternBody(f, f.art); return `<svg viewBox="-100 -105 200 230" aria-hidden="true">${b.defs ? `<defs>${b.defs}</defs>` : ""}${b.svg}</svg>`; })()}</span>`;
let avatarCache = null;

function welcome(){
  return {from:"bot", hello:true, text:"Discover handmade kandils crafted by generations of artisan families in Mahim.\n\nWhat are you looking for today?", chips:STARTERS};
}
function filterProducts(f){
  let list = PRODUCTS.slice();
  if (f.size) list = list.filter(p => p.size === f.size);
  if (f.style === "premium") list = list.filter(p => p.premium);
  else if (f.style) list = list.filter(p => p.style === f.style);
  if (f.shape) list = list.filter(p => p.shape === f.shape || (f.shape === "akash" && p.shape === "akash"));
  if (f.max != null) list = list.filter(p => p.price != null && p.price <= f.max);
  if (f.min != null) list = list.filter(p => p.price != null && p.price >= f.min);
  if (f.sort === "asc") list = list.filter(p => p.price != null).sort((a, b) => a.price - b.price);
  if (f.sort === "desc") list = list.filter(p => p.price != null).sort((a, b) => b.price - a.price);
  return list;
}
function describe(f){
  const bits = [];
  if (f.style === "premium") bits.push("premium"); else if (f.style) bits.push(f.style === "fabric" ? "fabric" : f.style === "custom" ? "custom" : f.style);
  if (f.size) bits.push(f.size);
  const shapeName = {akash:"akash kandils", star:"paper stars", butterfly:"butterfly kandils", karanji:"karanji kandils", matka:"matka kandils"}[f.shape];
  return bits.join(" ") + " " + (shapeName || "kandils");
}
function priceNote(){
  if (S.priceNoted) return null;
  S.priceNoted = true; store.set("priceNoted", true);
  return "Prices here are proposed catalogue prices within the lane’s current bands. The artisan households will confirm them.";
}
function parse(t){
  const s = " " + t.toLowerCase().replace(/[’']/g, "") + " ";
  const has = re => re.test(s);
  const f = {};
  if (has(/\b(small|smaller|mini|little|balcon|window|entrance|doorway|shelf|puja)/)) f.size = "small";
  if (has(/\b(big|bigger|large|larger|grand|huge|statement)\b/)) f.size = "big";
  if (has(/\b(traditional|classic|old.?style|heritage design)/)) f.style = "traditional";
  if (has(/\b(contemporary|modern|colou?rful|trendy|trend|new design|minimal|jaali|kraft|jute|two.?tone|bright)/)) f.style = "contemporary";
  if (has(/\b(fabric|cloth|khan|khun|textile)/)) f.style = "fabric";
  if (has(/\bpremium|luxur|fancy|special/) && !f.style) f.style = "premium";
  if (has(/\bakash\b/)) f.shape = "akash";
  if (has(/\bstars?\b/)) f.shape = "star";
  if (has(/\bbutterfl/)) f.shape = "butterfly";
  if (has(/\bkaranji|gujiya/)) f.shape = "karanji";
  if (has(/\bmatka|\bpot\b/)) f.shape = "matka";
  const m = s.match(/(under|below|less than|within|upto|up to|max(?:imum)?|budget(?: of| is)?|around|about)\s*(?:rs\.?|₹|inr)?\s*([\d,]{2,})/) || s.match(/(?:rs\.?|₹)\s*([\d,]{2,})\s*(?:or less|max|budget)/);
  if (m) f.max = parseInt((m[2] || m[1]).replace(/,/g, ""), 10);
  const over = s.match(/(above|over|more than)\s*(?:rs\.?|₹)?\s*([\d,]{3,})/);
  if (over) f.min = parseInt(over[2].replace(/,/g, ""), 10);
  if (has(/\b(cheap|cheapest|affordable|lowest|least expensive|low budget|inexpensive|economical|lowest price)/)) f.sort = "asc";
  if (has(/\b(most expensive|costliest|priciest|highest price|best you have|top end)/)) f.sort = "desc";
  return f;
}
function reply(text, fromChip){
  const s = " " + text.toLowerCase().replace(/[’']/g, "") + " ";
  const has = re => re.test(s);
  if (has(/\b(cancel|stop|start over|reset|nevermind|never mind)\b/) && S.flow) { S.flow = null; return {text:"No problem, I’ve stopped that. What would you like to look at?", chips:STARTERS.slice(0,6)}; }
  if (has(/\b(hi|hello|hey|namaste|namaskar|hii)\b/) && s.trim().split(/\s+/).length <= 3) return {text:"Namaste! Happy to help. Are you shopping for your home, or planning something bigger?", chips:["Show me small kandils","Show me big kandils","I am looking for bulk orders","Help me choose a design"]};
  if (has(/\b(thank|thanks|thx|dhanyavad|shukriya)/)) return {text:"You’re welcome! The makers will be glad. Anything else you’d like to see?", chips:["View my cart","Show me big kandils","Tell me about the artisans"]};
  const named = PRODUCTS.filter(p => s.includes(p.name.toLowerCase().replace(/[’']/g, ""))).sort((a, b) => b.name.length - a.name.length)[0];
  if (named) {S.ctx={size:named.size,style:named.style}; return {text:`${named.name}: ${named.desc} It is ${named.size === "small" ? "a small kandil, for homes, balconies and entrances" : "a big kandil, for larger spaces and celebrations"}${named.price == null ? ", quoted per order." : `, at a proposed ${inr(named.price)}.`}`, products:[named.id], chips:[named.price == null ? "Plan a bulk order" : "Show me similar designs", "Which one is the most affordable?", "Help me choose a design"]};}
  if (has(/show me similar/)) { const f2 = Object.assign({}, S.ctx); return {text:"Here are designs in the same family.", products:filterProducts(f2.size || f2.style ? f2 : {}).map(p => p.id).slice(0, 8), chips:["Which one is the most affordable?","Show me big kandils"]}; }
  if (has(/\b(bulk|wholesale|bigger celebration|large order|many pieces|quantity|plan a bulk)/)) return startBulk(null, true);
  if (has(/\b(societ(y|ies)|offices?|corporate|weddings?|hotels?|cafes?|café|mandals?|events?)\b/) && !has(/\b(small|mini)\b/)) { S.ctx = {size:"big"}; return {text:"For societies, offices, weddings, hotels and events, these big kandils work best. Big pieces are made only to order, so if you need several, I can set up a bulk enquiry and the makers will call you with a quote.", products:filterProducts({size:"big"}).map(p => p.id), chips:["Plan a bulk order","Which one is the most affordable?","I want a customised kandil"], note:priceNote()}; }
  if (has(/personalise a small/)) { openSheet("name-kandil"); return {text:"I’ve opened the personalised kandil. Type a name or initials and pick a colour story to see it.", chips:["Show me small kandils","View my cart"]}; }
  if (has(/\b(custom|customi[sz]|personali[sz]|monogram|logo|my name|names?\b)/)) {
    S.ctx = {style:"custom"};
    return {text:"Two ways to make one your own: a small kandil with a name or initials hand-cut into one panel, or a big made-to-order piece with your logo or monogram, quoted per order.", products:["name-kandil","logo-kandil","society-statement"], chips:["Personalise a small kandil","Plan a bulk order","Show me big kandils"]};
  }
  if (has(/\b(help me choose|choose|suggest|recommend|not sure|confused|gift|which should|help me pick|help me decide)/) && !has(/most|cheap|affordable/)) return startChoose();
  if (has(/\b(artisans?|makers?|who makes|families|family|history|heritage|story|lane|kandil galli)\b/) && !has(/show me/)) return {text:"Kandil Galli is a lane in Mahim West where about 20 to 40 artisan families, mostly Marathi, have made akash kandils since at least the late 1940s. The households we met have two to three generations of making behind them.\n\nMost makers work in the evenings, after full day jobs, cutting and assembling every kandil by hand. They agree prices together so no one undercuts a neighbour.", actions:[{label:"Read their story", href:"#craft"}], chips:["How is a kandil made?","Which festivals?","Show me traditional designs"]};
  if (has(/how is|how are|made\b|process|handmade|hand made|hand-cut/)) return {text:"Materials are bought in bulk in late September. Patterns are cut by hand into paper or fabric, pasted and fitted onto a reusable frame face by face, then finished with tails and tassels. The lane avoids printed imitations and factory production.", actions:[{label:"See the process", href:"#craft"}], chips:["Show me traditional designs","Tell me about the artisans"]};
  if (has(/\b(festival|eid|diwali|christmas|new year|navratri|ganesh)/)) return {text:"The lane lights many festivals. The craft reportedly began with Eid lanterns, Diwali is the busiest season, and paper stars go up for Christmas. In the Konkan and Goa, akash kandils stay up until New Year.", products: has(/christmas|star/) ? ["paper-star","akash-mini","akash-classic"] : ["akash-classic","butterfly","karanji","matka"], chips:["Show me paper stars","Show me big kandils"]};
  if (has(/\b(deliver|delivery|shipping|ship|courier|pickup|pick up|collect)/)) return {text:"You can pick up free from the lane in Mahim West, or have it delivered. Delivery is arranged by the makers; the charge depends on size and is confirmed before dispatch. Big pieces are made to order, so book a little ahead.", chips:["Show me small kandils","I am looking for bulk orders"]};
  if (has(/\b(pay|payment|upi|card|cod|cash|advance|emi)/)) return {text:"You can arrange payment with the makers or pay at the stall for eligible pickup orders. Choose a 30% advance or full payment. The checkout lists the options available for your order.", chips:["View my cart","Show me small kandils"]};
  if (has(/\b(led|bulb|light it|flame|candle|diya|safe|safety|wire|wiring)/)) return {text:"Use a ready-made, certified LED fitting rather than a candle or diya inside paper or fabric. The makers never wire anything themselves.", chips:["Show me small kandils","Show me big kandils"]};
  if (has(/\b(cart|basket|checkout|my order|view my cart)/)) {
    if (!S.cart.length) return {text:"Your cart is empty for now. Shall I show you a few favourites?", chips:["Show me small kandils","Show me big kandils"]};
    return {text:`You have ${cartCount()} ${cartCount() === 1 ? "piece" : "pieces"} in your cart, ${inr(cartTotal())} in all.`, actions:[{label:"View cart", href:"#cart"},{label:"Checkout", href:"#checkout", main:true}], chips:["Show me more designs"]};
  }
  if (has(/size|how big|dimension|height|cm\b|inch/)) return {text:"For now the shop has two sizes. Small kandils suit homes, balconies, windows and entrances. Big kandils suit larger homes, societies, offices, hotels and events. The makers can confirm exact measurements for any design when they call.", chips:["Show me small kandils","Show me big kandils"]};

  // product discovery
  let f = parse(text);
  const isStarter = STARTERS.includes(text.trim());
  const refining = !isStarter && has(/\b(something|only|those|these|that|which|any|also|them|of these|from these|one|ones)\b/);
  const any = f.size || f.style || f.shape || f.max != null || f.min != null || f.sort;
  if (has(/\b(all|everything|whole|full catalogue|show me more|more designs|more options|anything)\b/) && !any) { S.ctx = {}; return {text:"Here’s the whole catalogue, small and big. Tap any kandil for details.", products:PRODUCTS.map(p => p.id), chips:["Show me small kandils","Show me big kandils","Which one is the most affordable?"], actions:[{label:"Browse with filters", href:"#shop"}]}; }
  if (!any) {
    const stop = new Set(["show","want","kandil","kandils","with","have","about","tell","what","does","your","please","some","looking","would","like","need"]);
    const words = s.split(/[^a-z0-9]+/).filter(w => w.length > 3 && !stop.has(w));
    const hits = PRODUCTS.filter(p => words.some(w => (p.name + " " + p.desc).toLowerCase().includes(w)));
    if (hits.length && hits.length < PRODUCTS.length) return {text:"Here’s what I found for that.", products:hits.map(p => p.id).slice(0, 8), chips:["Which one is the most affordable?","Show me big kandils","Help me choose a design"]};
    return {text:"I didn’t quite follow that. I can show you small or big kandils, find designs within a budget, help with a bulk or custom order, or tell you about the makers.", chips:STARTERS.slice(0, 6)};
  }
  let ctx;
  if (!isStarter && (refining || ((f.sort || f.max != null || f.min != null) && !f.size && !f.style && !f.shape))) ctx = Object.assign({}, S.ctx, f);
  else ctx = f;
  if (f.style && !f.shape && ctx.shape && !refining) delete ctx.shape;
  let list = filterProducts(ctx);
  let lead;
  if (!list.length && ctx.size && (ctx.style || ctx.shape)) {
    const relaxed = Object.assign({}, ctx); delete relaxed.size;
    list = filterProducts(relaxed);
    if (list.length) { lead = `We don’t have ${describe(ctx)} in the catalogue yet, but here are the ${describe(relaxed)} we do have.`; ctx = relaxed; }
  }
  if (!list.length && ctx.max != null) {
    const cheapest = filterProducts(Object.assign({}, ctx, {max:null, sort:"asc"})).slice(0, 4);
    return {text:`Nothing in ${describe(ctx)} comes in under ${inr(ctx.max)} right now. These are the most affordable ones instead.`, products:cheapest.map(p => p.id), chips:["Show me small kandils","Help me choose a design"]};
  }
  if (!list.length) return {text:"I couldn’t find a match for that combination. Here are the small and big favourites instead.", products:["akash-classic","butterfly","akash-grand","khan-akash"], chips:STARTERS.slice(0,5)};
  S.ctx = ctx;
  if (ctx.sort) list = list.slice(0, 5);
  if (!lead) {
    const d = describe(ctx);
    if (ctx.sort === "asc") lead = Object.keys(S.ctx).length > 1 ? `From the ${d}, these are the most affordable.` : "Here are the most affordable options in the catalogue, lowest price first.";
    else if (ctx.sort === "desc") lead = `Here are the most premium ${d}, highest price first.`;
    else if (ctx.max != null) lead = `Here ${list.length === 1 ? "is one" : "are " + list.length} ${d} at ${inr(ctx.max)} or less.`;
    else if (ctx.style === "traditional" && !ctx.shape) lead = `Here are our traditional ${ctx.size ? ctx.size + " " : ""}kandils: akash, butterfly, karanji, matka${ctx.size === "big" ? "" : " and paper stars"}.`;
    else if (ctx.style === "contemporary") lead = `These are the lane’s newer looks: jaali cut-work in white and beige, earthy kraft and jute, and two-tone brights${ctx.size ? ", in " + ctx.size : ""}.`;
    else if (ctx.style === "fabric") lead = `Our fabric kandils are the lane’s premium pieces, including the khan-fabric designs new this season.`;
    else if (ctx.style === "premium") lead = `Our premium pieces: fabric kandils and made-to-order custom work.`;
    else if (ctx.size === "small" && !ctx.style && !ctx.shape) lead = `Absolutely! Here are our small handmade kandils, ${list.length} designs for homes, balconies and entrances.`;
    else if (ctx.size === "big" && !ctx.style && !ctx.shape) lead = `Here are our big kandils, for larger homes, societies, offices and celebrations. Statement pieces are quoted per order.`;
    else lead = `Here are our ${d}.`;
  }
  const chips = [];
  if (!ctx.sort) chips.push("Which one is the most affordable?");
  if (ctx.size !== "small") chips.push("Show me small kandils"); else chips.push("Show me something traditional");
  if (ctx.size !== "big") chips.push("Show me big kandils"); else chips.push("I am looking for bulk orders");
  if (ctx.style !== "fabric") chips.push("Show me premium fabric kandils");
  chips.push("Help me choose a design");
  return {text:lead, products:list.map(p => p.id), chips:chips.slice(0, 4), note:priceNote()};
}

/* guided flows */
function startChoose(){
  S.flow = {type:"choose", step:"where", data:{}};
  return {text:"Happy to help you choose. Where will the kandil hang?", chips:["A balcony or window","Our entrance or doorway","A society or office","A big celebration or event"], flowChips:true};
}
function chooseStep(t){
  const d = S.flow.data, s = t.toLowerCase();
  if (S.flow.step === "where") {
    if (/celebration|event/.test(s)) { S.flow = null; return startBulk(null, true, "A celebration needs a bit of planning, so let’s do it properly."); }
    d.size = /society|office/.test(s) ? "big" : "small";
    S.flow.step = "style";
    return {text:"Lovely. Which look feels right?", chips:["Traditional","Colourful and contemporary","Premium fabric","Surprise me"], flowChips:true};
  }
  if (S.flow.step === "style") {
    d.style = /traditional/.test(s) ? "traditional" : /contemp|colou?r|modern/.test(s) ? "contemporary" : /fabric|premium/.test(s) ? "fabric" : null;
    S.flow.step = "budget";
    return {text:"And roughly what would you like to spend on each piece?", chips: d.size === "big" ? ["Up to ₹1,000","Up to ₹1,500","No fixed budget"] : ["Under ₹200","Under ₹500","Under ₹1,000","No fixed budget"], flowChips:true};
  }
  if (S.flow.step === "budget") {
    const n = s.replace(/,/g, "").match(/(\d{2,})/);
    d.max = n ? parseInt(n[1], 10) : null;
    S.flow = null;
    let f = {size:d.size, style:d.style, max:d.max};
    let list = filterProducts(f), lead;
    if (!list.length && f.style) { f = {size:d.size, max:d.max}; list = filterProducts(f); lead = `I don’t have that look in your budget, so here are the closest ${d.size} pieces.`; }
    if (!list.length) { f = {size:d.size, sort:"asc"}; list = filterProducts(f).slice(0, 4); lead = `Nothing fits that budget exactly. These are the most affordable ${d.size} kandils.`; }
    S.ctx = f;
    const where = d.size === "big" ? "a society or office" : "your home";
    return {text: lead || `For ${where}, these are my picks. ${list[0] ? `If you want just one, I’d start with the ${list[0].name}.` : ""}`, products:list.map(p => p.id).slice(0, 8), chips:["Which one is the most affordable?","Show me all designs","I want a customised kandil"], note:priceNote()};
  }
}
const BULK_DESIGNS = ["Traditional akash","Butterfly","Karanji","Matka","Paper stars","Jaali, white and beige","Kraft and jute","Fabric, khan-style","Logo or monogram","Society statement piece"];
const BULK_CUSTOM = ["Colour preferences","Names or monograms","Logos","A custom design","Special quantities","No customisation"];
function startBulk(design, inChat, lead){
  S.flow = {type:"bulk", step:"name", data:{designs: design ? [design] : []}};
  const m = {text:(lead ? lead + " " : "") + "Lovely, let’s plan your celebration. I’ll ask a few quick questions and the makers will call you with a quote.\n\nFirst, who should the quote be for? Type your name, or your society or organisation’s name.", chips:["Cancel"], flowChips:true, placeholder:"Name or organisation"};
  return m;
}
function bulkSummary(d){
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : "";
  return `<div class="summary-card"><dl>${row("For", d.name)}${row("Mobile", d.phone)}${row("Occasion", d.occasion)}${row("Size", d.size)}${row("Designs", (d.designs || []).join(", "))}${row("Quantity", d.qty)}${row("Needed by", d.date ? fmtDay(d.date) : "Not sure yet")}${row("Customisation", (d.custom || []).join(", "))}${row("Details", d.customNote)}${row("Deliver to", d.location)}</dl></div>`;
}
async function bulkStep(t, raw){
  const d = S.flow.data, st = S.flow.step;
  const ask = (step, msg) => { S.flow.step = step; return msg; };
  if (st === "name") {
    if (t.trim().length < 2) return {text:"Please type a name so the makers know who to call.", flowChips:true, chips:["Cancel"]};
    d.name = t.trim();
    return ask("phone", {text:`Thanks, ${d.name}. Which mobile number can the makers call you on?`, flowChips:true, chips:["Cancel"], placeholder:"10-digit mobile number", inputmode:"tel"});
  }
  if (st === "phone") {
    const ph = t.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(ph)) return {text:"That doesn’t look like a 10-digit mobile number. Could you check it? It should start with 6, 7, 8 or 9.", flowChips:true, chips:["Cancel"], placeholder:"10-digit mobile number", inputmode:"tel"};
    d.phone = ph;
    return ask("occasion", {text:"What’s the occasion?", chips:["Housing society","Office","Wedding","Hotel or café","Event or mandal","Something else"], flowChips:true});
  }
  if (st === "occasion") { d.occasion = t; return ask("size", {text:"Small kandils, big ones, or a mix?", chips:["Small kandils","Big kandils","A mix of both"], flowChips:true}); }
  if (st === "size") { d.size = t.replace(/ kandils/i, ""); return ask("designs", {text:"Which designs would you like? Pick as many as you like, then tap Done.", multi:BULK_DESIGNS, selected:(d.designs || []).slice(), flowChips:true}); }
  if (st === "designs") { const selected=S.msgs.at(-2)?.selected; d.designs=selected?.length && t===selected.join(", ") ? selected.slice() : [t]; return ask("qty", {text:"About how many pieces in all? Choose a range or type a number.", chips:["Up to 25","25 to 50","50 to 100","More than 100"], flowChips:true, placeholder:"Number of pieces", inputmode:"numeric"}); }
  if (st === "qty") {
    if (!/^\d{1,7}$/.test(t) && !["Up to 25","25 to 50","50 to 100","More than 100"].includes(t)) return {text:"Enter a positive number of pieces or choose a range.",chips:["Up to 25","25 to 50","50 to 100","More than 100"],flowChips:true};
    if (/^\d+$/.test(t.trim())) { const n = parseInt(t, 10); if (n < 1) return {text:"Please enter at least one piece.", flowChips:true}; d.qty = n + " pieces"; } else d.qty = t;
    return ask("date", {text:"When do you need them? Big pieces are made in the makers’ evening hours, so earlier bookings are easier to fit.", date:true, chips:["Not sure yet"], flowChips:true});
  }
  if (st === "date") { if(t!=="Not sure yet" && (!/^\d{4}-\d{2}-\d{2}$/.test(t) || !Number.isFinite(Date.parse(t)) || new Date(t).toISOString().slice(0,10)!==t || t<new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}))) return {text:"Choose today or a later date, or tap Not sure yet.",date:true,chips:["Not sure yet"],flowChips:true}; d.date = /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ""; return ask("custom", {text:"Would you like anything customised? Pick all that apply.", multi:BULK_CUSTOM, selected:(d.custom || []).slice(), flowChips:true}); }
  if (st === "custom") {
    d.custom = t.split(", ").filter(Boolean);
    if (!d.custom.length || d.custom.includes("No customisation")) { d.custom = ["None"]; return ask("location", {text:"Where should they be delivered? Area and city is enough for now.", flowChips:true, chips:["Pickup from Kandil Galli"], placeholder:"e.g. Powai, Mumbai"}); }
    return ask("customNote", {text:"Tell me a little more: the colours, the name or initials, or what the logo is. The makers will confirm details on the call.", chips:["Skip"], flowChips:true, placeholder:"Colours, names, logo…"});
  }
  if (st === "customNote") { d.customNote = /^skip$/i.test(t) ? "" : t; return ask("location", {text:"Where should they be delivered? Area and city is enough for now.", flowChips:true, chips:["Pickup from Kandil Galli"], placeholder:"e.g. Powai, Mumbai"}); }
  if (st === "location") {
    if (t.trim().length < 2) return {text:"Please add an area and city, or choose pickup.", flowChips:true, chips:["Pickup from Kandil Galli"]};
    d.location = t.trim();
    return ask("review", {text:"Here’s your enquiry. Does this look right?", html:bulkSummary(d), chips:["Send enquiry","Start over"], flowChips:true});
  }
  if (st === "review") {
    if (/start over/i.test(t)) return startBulk();
    if (/send/i.test(t)) {
      d.token ||= crypto.randomUUID();
      saveChat();
      let enq;
      try {enq=await api("enquiry",{token:d.token,details:d});}
      catch(e){return {text:e.message+" Your enquiry is still here.",chips:["Send enquiry","Start over"],flowChips:true};}
      S.flow = null;
      return {text:`Your enquiry ${enq.id} is with the makers. Someone from the lane will call ${d.phone} to talk through designs and send a quote at the lane’s agreed prices.\n\nTo book, you’ll pay a 30% advance; the balance is due on delivery.`, success:true, chips:["Show me big kandils","Tell me about the artisans"]};
    }
    return {text:"Tap Send enquiry when you’re ready, or Start over to change something.", chips:["Send enquiry","Start over"], flowChips:true};
  }
}

/* chat render */
function msgHTML(m, i, last){
  if (m.from === "me") return `<div class="msg me"><div class="msg-body"><div class="bubble">${esc(m.text)}</div></div></div>`;
  const active = last && !m.typing;
  let h = `<div class="msg bot">${avatarCache}<div class="msg-body"><div class="who">Kandil Galli</div>`;
  if (m.typing) return h + `<div class="bubble typing" aria-label="Typing"><i></i><i></i><i></i></div></div></div>`;
  const paras = String(m.text || "").split("\n\n").map(p => `<p>${esc(p)}</p>`).join("");
  h += `<div class="bubble">${m.hello ? `<span class="hello">Namaste!<span class="deva">नमस्ते</span></span><b style="font-weight:600">Welcome to Kandil Galli.</b>` : ""}${m.success ? `<p style="color:var(--emerald);font-weight:700;margin-bottom:6px">Enquiry sent</p>` : ""}${paras}${m.html || ""}</div>`;
  if (m.products && m.products.length) h += `<div class="rail">${m.products.map(id => byId(id)).filter(Boolean).map(cardHTML).join("")}</div>`;
  if (m.note) h += `<div class="note">${esc(m.note)}</div>`;
  if (m.actions) h += `<div class="actions">${m.actions.map(a => `<a class="btn ${a.main ? "btn-main" : "btn-ghost"}" href="${a.href}">${esc(a.label)}</a>`).join("")}</div>`;
  if (m.multi) {
    const sel = m.selected || [];
    h += `<div class="chips ${active ? "" : "off"}">${m.multi.map(o => `<button class="chip" ${active?"":"disabled"} data-act="toggle" data-i="${i}" data-v="${esc(o)}" aria-pressed="${sel.includes(o)}">${esc(o)}</button>`).join("")}
      <button class="chip go" ${active?"":"disabled"} data-act="multiDone" data-i="${i}">Done${sel.length ? ` (${sel.length})` : ""}</button></div>`;
  }
  if (m.date && active) h += `<div class="inline-form"><label class="sr" for="dateIn">Date</label><input type="date" id="dateIn" min="${new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})}"><button class="btn btn-main" data-act="dateDone">Use this date</button></div>`;
  if (m.chips && m.chips.length) h += `<div class="chips ${active ? "" : "off"}">${m.chips.map(c => `<button class="chip${/^(Send enquiry|Plan a bulk order)$/.test(c) ? " go" : ""}" ${active?"":"disabled"} data-act="chip" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
  return h + `</div></div>`;
}
function renderThread(scroll=true){
  if (!avatarCache) avatarCache = BOT_AVATAR();
  if (!S.msgs.length) S.msgs.push(welcome());
  const lastBot = S.msgs.map(m => m.from).lastIndexOf("bot");
  $("#thread").innerHTML = S.msgs.map((m, i) => msgHTML(m, i, i === lastBot && i === S.msgs.length - 1)).join("");
  const lm = S.msgs[S.msgs.length - 1];
  const inp = $("#chatInput");
  inp.placeholder = (lm && lm.placeholder) || "Ask about designs, prices, bulk orders…";
  inp.setAttribute("inputmode", (lm && lm.inputmode) || "text");
  if (scroll) requestAnimationFrame(() => {
    if (S.msgs.length < 2) return;
    const mine = $$("#thread .msg.me"); const target = mine[mine.length - 1];
    if (target) target.scrollIntoView({block:"start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  });
}
let busy = false;
async function send(text, fromChip=false){
  text = String(text || "").trim();
  if (!text || busy) return;
  busy=true;
  S.msgs.push({from:"me", text});
  let r;
  if (/^(cancel|stop)$/i.test(text) && S.flow) { S.flow = null; r = {text:"Okay, cancelled. What would you like to see?", chips:STARTERS.slice(0,6)}; }
  else if (S.flow && S.flow.type === "bulk") r = await bulkStep(text);
  else if (S.flow && S.flow.type === "choose") r = chooseStep(text) || reply(text, fromChip);
  else r = reply(text, fromChip);
  busy = true;
  S.msgs.push({from:"bot", typing:true});
  renderThread();
  setTimeout(() => {
    S.msgs.pop();
    S.msgs.push(Object.assign({from:"bot"}, r));
    busy = false;
    saveChat(); renderThread();
  }, 420 + Math.min(500, (r.text || "").length * 2));
}
function pushBot(r){ S.msgs.push(Object.assign({from:"bot"}, r)); saveChat(); }

/* =====================================================================
   SHOP
   ===================================================================== */
function renderFilters(){
  const f = S.shop;
  const chip = (group, val, label) => `<button class="chip" data-act="filter" data-g="${group}" data-v="${val}" aria-pressed="${f[group] === val}">${label}</button>`;
  $("#filterRow").innerHTML = chip("size","all","All sizes") + chip("size","small","Small") + chip("size","big","Big") + `<span class="sep"></span>` +
    chip("style","all","All designs") + chip("style","traditional","Traditional") + chip("style","contemporary","Contemporary") + chip("style","fabric","Fabric") + chip("style","premium","Premium") + chip("style","custom","Custom") + `<span class="sep"></span>` +
    `<label class="sr" for="sortSel">Sort</label><select id="sortSel" class="sortsel"><option value="featured">Featured</option><option value="asc" ${f.sort === "asc" ? "selected" : ""}>Price: low to high</option><option value="desc" ${f.sort === "desc" ? "selected" : ""}>Price: high to low</option></select>`;
  $("#sortSel").addEventListener("change", e => { S.shop.sort = e.target.value; renderShop(); });
}
function renderShop(){
  const f = S.shop;
  let list = PRODUCTS.filter(p =>
    (f.size === "all" || p.size === f.size) &&
    (f.style === "all" || (f.style === "premium" ? p.premium : p.style === f.style)) &&
    (!f.q || (p.name + " " + p.desc + " " + p.style + " " + p.size + " " + p.shape + " " + (p.material || "")).toLowerCase().includes(f.q.toLowerCase())));
  if (f.sort === "asc") list = list.filter(p => p.price != null).sort((a, b) => a.price - b.price).concat(list.filter(p => p.price == null));
  if (f.sort === "desc") list = list.filter(p => p.price != null).sort((a, b) => b.price - a.price).concat(list.filter(p => p.price == null));
  $("#shopGrid").innerHTML = list.map(p => cardHTML(p, true)).join("");
  $("#shopEmpty").innerHTML = list.length ? "" : `<div class="empty">No kandils match that search. <button class="linkbtn" data-act="clearFilters">Clear filters</button> or <a href="#chat">ask the shop</a>.</div>`;
  renderFilters();
}

/* =====================================================================
   STORY content
   ===================================================================== */
function renderStory(){
  const tick = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>`;
  $("#innovList").innerHTML = [
    "Moved from bamboo to reusable frames in some households, saving time and cost",
    "Added fabric lanterns, including khan-fabric designs new this season, at up to about ₹2,200",
    "New designs every season, following trends",
    "Prices agreed together, so no one undercuts a neighbour",
    "Materials bought in bulk to lower costs",
    "Big kandils for societies and offices, made only to order",
    "Phone pre-orders taken before the season",
    "Paper stars and festival lanterns beyond Diwali, in some households",
  ].map(t => `<div>${tick}<span>${t}</span></div>`).join("");
  const makers = [
    ["The households of Kavle Wadi and Kadri Wadi","The two clusters in Mahim West that reports name as the heart of the lane.","Free Press Journal, 2026"],
    ["Two to three generations at the frame","The makers we met have made kandils continuously across two to three generations; one maker is reported to be fourth-generation.","Field visit, 7 Nov 2026; LocalSamosa"],
    ["The women who cut and assemble","Kandil making is family work, often done after household chores. Much of the cutting and assembly is theirs.","DNA, 2018"],
    ["The younger hands","Some young family members help after their day jobs, and are open to running online orders for the lane.","Field visit, 7 Nov 2026"],
    ["Neighbours who learned the craft","Mostly Marathi families, with at least one Punjabi family who learned the craft from neighbours.","DNA, 2018"],
  ];
  $("#makerCards").innerHTML = makers.map((m, i) => `<div class="makercard"><div class="seal">${sealSVG(i)}</div><div><b>${m[0]}</b><p>${m[1]}</p><small>Source: ${m[2]}</small></div></div>`).join("");
}

/* =====================================================================
   QR
   ===================================================================== */
function qrUrl(){ const o = store.get("qrUrl", ""); return o || (MARKETPLACE_URL.startsWith("http") ? MARKETPLACE_URL : location.href.split("#")[0]); }
function qrMatrix(url){
  if (typeof window.qrcode !== "function") return null;
  const q = window.qrcode(0, "M"); q.addData(url); q.make();
  const n = q.getModuleCount(), m = [];
  for (let r = 0; r < n; r++) { m.push([]); for (let c = 0; c < n; c++) m[r].push(q.isDark(r, c)); }
  return m;
}
function qrSVG(url, opts={}){
  const m = qrMatrix(url);
  if (!m) throw new Error("QR generator unavailable.");
  const n = m.length, pad = 4, size = n + pad*2;
  let d = "";
  for (let r = 0; r < n; r++) { let c = 0; while (c < n) { if (m[r][c]) { const s0 = c; while (c < n && m[r][c]) c++; d += `M${s0+pad} ${r+pad}h${c-s0}v1h-${c-s0}z`; } else c++; } }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#24205A"/></svg>`;
}
function renderQR(){
  const url = qrUrl();
  $("#qrBig").innerHTML = qrSVG(url);
  $("#qrUrlText").textContent = url;
  $("#qrUrlInput").value = store.get("qrUrl", "") || "";
  $("#qrUrlInput").placeholder = MARKETPLACE_URL.startsWith("http") ? MARKETPLACE_URL : "https://";
}
function renderMiniQR(){ const el = $("#qrMini"); if (el) el.innerHTML = qrSVG(qrUrl()); }
function brandedQRSVG(){
  const url = qrUrl(), m = qrMatrix(url);
  const inner = qrSVG(url).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const n = m ? m.length + 8 : 33;
  const W = 600, H = 880, qs = 400, qx = (W - qs)/2, qy = 272;
  const lane = laneSVG();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="36" fill="#24205A"/>
  <svg x="0" y="0" width="${W}" height="190" viewBox="300 0 600 190" preserveAspectRatio="xMidYMin meet">${lane}</svg>
  <text x="${W/2}" y="236" text-anchor="middle" font-family="Yatra One, Georgia, serif" font-size="46" fill="#FBF4E6">Kandil Galli</text>
  <rect x="${qx-18}" y="${qy-18}" width="${qs+36}" height="${qs+36}" rx="26" fill="#fff"/>
  <svg x="${qx}" y="${qy}" width="${qs}" height="${qs}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">${inner}</svg>
  <text x="${W/2}" y="${qy+qs+80}" text-anchor="middle" font-family="Mukta, Arial, sans-serif" font-weight="600" font-size="28" fill="#FBF4E6">Scan to shop handmade kandils</text>
  <text x="${W/2}" y="${qy+qs+116}" text-anchor="middle" font-family="Mukta, Arial, sans-serif" font-size="20" fill="#C9C2EA">Generations of craft. A brighter way to celebrate.</text>
  <text x="${W/2}" y="${qy+qs+150}" text-anchor="middle" font-family="Mukta, Arial, sans-serif" font-size="18" fill="#C9C2EA">No app needed. Kandil Galli, Mahim West, Mumbai</text>
</svg>`;
}
async function brandedQRPNG(){
  const svg = brandedQRSVG();
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], {type:"image/svg+xml"}));
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement("canvas"); c.width = 1200; c.height = 1760;
  const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, 1200, 1760);
  URL.revokeObjectURL(url);
  return await new Promise(r => c.toBlob(r, "image/png"));
}
async function download(kind){
  const msg = $("#dlMsg"); msg.textContent = "";
  try {
    const data = kind === "png" ? await brandedQRPNG() : brandedQRSVG();
    const filename = `kandil-galli-qr.${kind}`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], {type:"image/svg+xml"})); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),60000); msg.textContent = "Download started: "+filename;
  } catch (e) {
    msg.textContent = "Download failed. Try again.";
  }
}

/* =====================================================================
   MAKERS' DESK
   ===================================================================== */
function allOrders(){
  const map = new Map();
  S.orders.filter(o=>o.sample).forEach(o => map.set(o.id, o));
  S.remote.orders.forEach(o => { if (!map.has(o.id)) map.set(o.id, Object.assign({remote:true}, o)); });
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}
function allEnquiries(){
  const map = new Map();
  S.enquiries.filter(o=>o.sample).forEach(o => map.set(o.id, o));
  S.remote.enquiries.forEach(o => { if (!map.has(o.id)) map.set(o.id, o); });
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}
function stOf(id){ return Object.assign({status:"new",household:"",balanceReceived:false},S.remote.status[id] || demoStatus[id] || {}); }
function setSt(id,patch){
  if(!S.remote.status[id]) {demoStatus[id]={...stOf(id),...patch};store.set("demoStatus",demoStatus); renderDesk();return;}
  const [field,value]=Object.entries(patch)[0];return modifyDesk("change",{id,field,value});
}
function householdLoad(hid){
  return allOrders().filter(o => stOf(o.id).household === hid && stOf(o.id).status !== "delivered").reduce((a, o) => a + o.items.reduce((x, i) => x + i.qty, 0), 0);
}
function renderDesk(){
  if(!signedIn) return loginPage();
  const orders = allOrders(), enqs = allEnquiries();
  const counts = {}; STATUSES.forEach(s => counts[s[0]] = 0);
  orders.forEach(o => counts[stOf(o.id).status]++);
  const advance = orders.reduce((a,o)=>a+money({...o,...stOf(o.id)}).paid,0);
  const due=orders.reduce((a,o)=>a+money({...o,...stOf(o.id)}).due,0);

  const tab = S.deskTab;
  let content = "";
  if (tab === "orders") {
    const f = S.deskFilter;
    const shown = orders.filter(o => f === "all" || stOf(o.id).status === f);
    content = `<div class="filterrow" style="padding-top:14px"><button class="chip" data-act="deskFilter" data-v="all" aria-pressed="${f === "all"}">All (${orders.length})</button>${STATUSES.map(s => `<button class="chip" data-act="deskFilter" data-v="${s[0]}" aria-pressed="${f === s[0]}">${s[1]} (${counts[s[0]]})</button>`).join("")}</div>
    <div class="list">${shown.length ? shown.map(o => { const st = stOf(o.id), lbl = STATUSES.find(s => s[0] === st.status)?.[1]; const payment=money({...o,...st}); const pieces = o.items.reduce((a, i) => a + i.qty, 0); return `
      <article class="order">
        <div class="order-top"><div><span class="order-id">${o.id}</span> <span class="pill s-${st.status}">${lbl}</span> ${o.sample ? `<span class="pill sample">Sample</span>` : ""}</div><span class="order-when">${fmtDate(o.createdAt)}</span></div>
        <div class="order-grid">
          <div><h4>Ordered</h4>${o.items.map(i => `<div>${esc(i.name)} × ${i.qty}${i.custom ? ` <span style="color:var(--ink-3)">(panel “${esc(i.custom.text)}”, ${esc(COLOUR_STORIES.find(c => c.id === i.custom.colour)?.name || "")})</span>` : ""}</div>`).join("")}<div style="color:var(--ink-3);font-size:13.5px">${pieces} ${pieces === 1 ? "piece" : "pieces"}, ${inr(o.total)}</div></div>
          <div><h4>Customer</h4><div>${esc(o.customer.name)}</div><div><a href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a></div><div style="color:var(--ink-2);font-size:13.5px">${o.mode === "pickup" ? "Pickup at the lane" : "Delivery: " + esc(o.address)}${o.date ? `<br>Wanted by ${fmtDay(o.date)}` : ""}${o.notes ? `<br>Note: ${esc(o.notes)}` : ""}</div></div>
          <div><h4>Payment</h4><div>${esc(payment.label)}${o.testPayment?" · Test payment":""}</div><div style="font-size:13.5px;color:var(--ink-2)">Received ${inr(payment.paid)}, outstanding ${inr(payment.due)}</div>
          ${o.method==="arrange" ? `<label>Total received (₹)<input class="inp" type="number" min="0" max="${o.total}" step="1" data-act="manualPaid" data-id="${o.id}" value="${payment.paid}"></label>`
          : o.balance && (o.method!=="online" || o.paidNow) ? `<label><input type="checkbox" data-act="balRecv" data-id="${o.id}" ${st.balanceReceived ? "checked":""}> Balance received</label>` : ""}
</div>
        </div>
        <div class="order-ctrl">
          <div class="field"><label for="st-${o.id}" style="font-size:13px">Order status</label><select class="inp" id="st-${o.id}" data-act="setStatus" data-id="${o.id}">${STATUSES.map(s => `<option value="${s[0]}" ${s[0] === st.status ? "selected" : ""}>${s[1]}</option>`).join("")}</select></div>
          <div class="field"><label for="hh-${o.id}" style="font-size:13px">Made by</label><select class="inp" id="hh-${o.id}" data-act="setHousehold" data-id="${o.id}"><option value="">Not assigned</option>${S.households.map(h => { const l = householdLoad(h.id); return `<option value="${h.id}" ${st.household === h.id ? "selected" : ""}>${esc(h.name)}${h.cap ? ` (${l}/${h.cap})` : ""}</option>`; }).join("")}</select></div>
        </div>
      </article>`; }).join("") : `<div class="empty">${orders.length ? "No orders with this status." : `No orders yet. Place an order from the shop and it appears here.`}<div class="actions" style="justify-content:center;margin-top:12px"><a class="btn btn-ghost" href="#shop">Open the shop</a><button class="btn btn-ghost" data-act="sample">Load sample orders</button></div></div>`}</div>`;
  }
  if (tab === "bulk") {
    const ES = ["New","Called","Quote sent","Booked with advance","Closed"];
    content = `<div class="list">${enqs.length ? enqs.map(e => `<article class="order">
      <div class="order-top"><div><span class="order-id">${e.id}</span> <span class="pill s-${e.status === "New" ? "new" : e.status === "Closed" ? "delivered" : "accepted"}">${esc(stOf(e.id).estatus || e.status)}</span> ${e.sample ? `<span class="pill sample">Sample</span>` : ""}</div><span class="order-when">${fmtDate(e.createdAt)}</span></div>
      <div class="order-grid">
        <div><h4>Request</h4><div>${esc(e.occasion)}, ${esc(e.size)}</div><div>${esc(e.qty)}</div><div style="color:var(--ink-2);font-size:13.5px">${esc((e.designs || []).join(", ") || "No design preference")}</div></div>
        <div><h4>Contact</h4><div>${esc(e.name)}</div><div><a href="tel:${esc(e.phone)}">${esc(e.phone)}</a></div><div style="color:var(--ink-2);font-size:13.5px">${esc(e.location)}${e.date ? `<br>Needed by ${fmtDay(e.date)}` : "<br>Date not fixed"}</div></div>
        <div><h4>Customisation</h4><div>${esc((e.custom || []).join(", "))}</div>${e.customNote ? `<div style="color:var(--ink-2);font-size:13.5px">${esc(e.customNote)}</div>` : ""}</div>
      </div>
      <div class="order-ctrl"><div class="field"><label style="font-size:13px" for="es-${e.id}">Enquiry status</label><select class="inp" id="es-${e.id}" data-act="setEnq" data-id="${e.id}">${ES.map(s => `<option ${s === (stOf(e.id).estatus || e.status) ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="field"><label style="font-size:13px" for="eh-${e.id}">Lead household</label><select class="inp" id="eh-${e.id}" data-act="setHousehold" data-id="${e.id}"><option value="">Not assigned</option>${S.households.map(h => `<option value="${h.id}" ${stOf(e.id).household === h.id ? "selected" : ""}>${esc(h.name)}</option>`).join("")}</select></div></div>
    </article>`).join("") : `<div class="empty">No bulk enquiries yet. They arrive here from “Planning a bigger celebration?” in the shop.</div>`}</div>`;
  }
  if (tab === "households") {
    content = `<div style="padding:16px 0"><p style="color:var(--ink-2);max-width:62ch">Households join by choice, and each has its own evening hours. Set a weekly capacity only if a household wants one; assignments then show how full it is. Rename households as the collective decides.</p>
      <div class="box" style="margin-top:14px"><div class="hh" style="font-size:13px;color:var(--ink-3);font-weight:600"><span>Household</span><span>Pieces a week</span><span></span></div>
      ${S.households.map(h => { const l = householdLoad(h.id), pct = h.cap ? Math.min(100, Math.round(l / h.cap * 100)) : 0; return `<div class="hh"><div><input class="inp" style="padding:8px 10px" value="${esc(h.name)}" data-act="hhName" data-id="${h.id}" aria-label="Household name"><div style="font-size:13px;color:var(--ink-3);margin-top:4px">${l} ${l === 1 ? "piece" : "pieces"} in open orders${h.cap ? "" : ", no capacity set"}</div>${h.cap ? `<div class="load ${l > h.cap ? "over" : ""}"><i style="width:${pct}%"></i></div>` : ""}</div><input class="inp" style="padding:8px 10px" type="number" min="0" inputmode="numeric" placeholder="Not set" value="${esc(h.cap)}" data-act="hhCap" data-id="${h.id}" aria-label="Weekly capacity"><button class="iconbtn" style="width:40px;height:40px;background:var(--surface-2)" data-act="hhDel" data-id="${h.id}" aria-label="Remove ${esc(h.name)}">×</button></div>`; }).join("")}
      <button class="btn btn-ghost" style="margin-top:12px" data-act="hhAdd">Add a household</button></div></div>`;
  }
  if (tab === "log") {
    const sold = {}; orders.forEach(o => o.items.forEach(i => sold[i.id] = (sold[i.id] || 0) + i.qty));
    content = `<div style="padding:16px 0"><p style="color:var(--ink-2);max-width:62ch">One line per design: made, sold through this shop, left over. Planning next season from records means makers no longer need to under-produce.</p>
      <div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>Design</th><th>Size</th><th>Made</th><th>Ordered here</th><th>Left over</th></tr></thead><tbody>
      ${PRODUCTS.filter(p => p.price != null).map(p => { const made = S.made[p.id] ?? ""; const s = sold[p.id] || 0; return `<tr><td>${esc(p.name)}</td><td>${SIZE_LABEL[p.size]}</td><td><input type="number" min="0" inputmode="numeric" value="${esc(made)}" data-act="made" data-id="${p.id}" aria-label="Made: ${esc(p.name)}"></td><td>${s}</td><td>${made === "" ? "–" : Math.max(0, made - s)}</td></tr>`; }).join("")}
      </tbody></table></div></div>`;
  }
  $("#deskBody").innerHTML = `<div class="desk-head"><div><h1>Makers’ desk</h1><p style="color:var(--ink-2)">Orders and enquiries for the artisan households.</p></div>
      <span class="order-tools"><button class="btn btn-ghost" data-act="refreshDesk">Refresh desk</button><button class="linkbtn" data-act="signOut">Sign out</button>
</span></div>
    ${orders.some(o=>o.sample) ? '<p class="note">Sample records are included in these figures. Remove samples to see actual shop totals.</p>' : ""}
    <div class="stats">
      <div class="stat"><b>${counts.new}</b><span>New orders</span></div>
      <div class="stat"><b>${counts.accepted + counts.production}</b><span>Accepted or in production</span></div>
      <div class="stat"><b>${inr(advance)}</b><span>Payments received</span></div>
      <div class="stat"><b>${enqs.filter(e => (stOf(e.id).estatus || e.status) === "New").length}</b><span>New bulk enquiries</span></div>
    </div>
    <div class="tabs" role="tablist">
      ${[["orders","Orders"],["bulk","Bulk enquiries"],["households","Households"],["log","Sales log"]].map(t => `<button role="tab" aria-selected="${tab === t[0]}" data-act="deskTab" data-v="${t[0]}">${t[1]}</button>`).join("")}
    </div>
    ${content}
    ${orders.some(o => o.sample) || enqs.some(e => e.sample) ? `<button class="linkbtn" data-act="clearSamples">Remove sample orders</button>` : (orders.length ? `<button class="linkbtn" data-act="sample">Add sample orders</button>` : "")}
    <p style="font-size:13.5px;color:var(--ink-3);padding:4px 0 30px">Balance outstanding across these orders: ${inr(due)}.</p>`;
}
function loadSamples(){
  if(S.orders.some(o=>o.sample)) return toast("Sample orders are already loaded.");
  const mk = (name, phone, items, plan, mode, addr, mins) => {
    const total = items.reduce((a, i) => a + i.qty * byId(i.id).price, 0), paid = plan === "advance" ? Math.round(total*.3) : total;
    return {id:newId("KG"), sample:true, createdAt:Date.now() - mins*60000, items:items.map(i => ({id:i.id, name:byId(i.id).name, size:byId(i.id).size, qty:i.qty, price:byId(i.id).price, custom:i.custom || null})), total, plan, paidNow:paid, balance:total - paid, method:"upi", payStatus: plan === "advance" ? "30% advance paid (demo)" : "Paid in full (demo)", mode, address:addr, date:"", notes:"", customer:{name, phone}};
  };
  S.orders.push(
    mk("Sample customer A", "9800000001", [{id:"akash-classic", qty:2},{id:"paper-star", qty:3}], "full", "pickup", "Pickup from Kandil Galli", 95),
    mk("Sample customer B", "9800000002", [{id:"khan-akash", qty:1}], "advance", "delivery", "Shivaji Park, Dadar, Mumbai, 400028", 240),
    mk("Sample customer C", "9800000003", [{id:"name-kandil", qty:1, custom:{text:"Asha", colour:"indigo"}},{id:"butterfly", qty:1}], "advance", "delivery", "Thane West, 400601", 600)
  );
  S.enquiries.push({id:newId("BQ"), sample:true, createdAt:Date.now() - 300*60000, status:"New", name:"Sample housing society", phone:"9800000004", occasion:"Housing society", size:"Big", designs:["Traditional akash","Society statement piece"], qty:"25 to 50", date:"", custom:["Colour preferences","Names or monograms"], customNote:"Society name on the statement piece", location:"Bandra West, Mumbai"});
  store.set("orders", S.orders); store.set("enquiries", S.enquiries);
  renderDesk();
}

/* =====================================================================
   ROUTER & EVENTS
   ===================================================================== */
const VIEWS = ["chat","shop","cart","checkout","order","celebrate","craft","qr","makers-desk"];
function currentView(){ if(location.hash.startsWith("#track/")) return "order"; const h = location.hash.replace("#", ""); return VIEWS.includes(h) ? h : "chat"; }
function route(){
  if(sheetState) closeSheet();
  const v = currentView();
  VIEWS.forEach(x => $("#view-" + x).classList.toggle("on", x === v));
  $$("[data-nav]").forEach(a => a.toggleAttribute("aria-current", false));
  $$(`[data-nav="${v}"]`).forEach(a => a.setAttribute("aria-current", "page"));
  $("#foot").style.display = v === "chat" ? "none" : "";
  if (v !== "chat") window.scrollTo(0, 0);
  if (v === "chat") { renderThread(false); renderMiniQR(); requestAnimationFrame(() => window.scrollTo(0, S.msgs.length > 2 ? document.body.scrollHeight : 0)); }
  if (v === "shop") {$("#shopSearch").value=S.shop.q;renderShop();}
  if (v === "cart") renderCart();
  if (v === "checkout") { if (S.coStep < 1) S.coStep = 1; renderCheckout(); }
  if (v === "order") renderOrder();
  if (v === "celebrate") $("#celebrateRail").innerHTML = PRODUCTS.filter(p => p.size === "big" && (p.style === "custom" || p.style === "traditional")).map(cardHTML).join("");
  if (v === "craft") renderStory();
  if (v === "qr") renderQR();
  if (v === "makers-desk") {$("#deskBody").innerHTML='<p class="box">Opening the makers’ desk…</p>';refreshDesk();}
  document.title = {chat:"Kandil Galli", shop:"All kandils | Kandil Galli", cart:"Cart | Kandil Galli", checkout:"Checkout | Kandil Galli", order:"Order placed | Kandil Galli", celebrate:"Bulk and custom | Kandil Galli", craft:"Our craft | Kandil Galli", qr:"QR card | Kandil Galli", "makers-desk":"Makers’ desk | Kandil Galli"}[v];
}
let toastT;
function toast(text, href, label){
  const t = $("#toast");
  t.innerHTML = `<span>${esc(text)}</span>${href ? `<a href="${href}">${esc(label)}</a>` : ""}`;
  t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600);
}
function goChatAndSend(text, chip=true){
  if (currentView() !== "chat") { location.hash = "chat"; setTimeout(() => send(text, chip), 120); }
  else send(text, chip);
}

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  if (act==="ideas" && S.flow) {toast("Finish this conversation or type Cancel for new suggestions."); return;}
  switch (act) {
    case "chip": send(el.dataset.v, true); break;
    case "ideas": if (!busy && !S.flow) { pushBot({text:"Here are a few things I can help with.", chips:STARTERS}); renderThread(); } break;
    case "toggle": {
      const m = S.msgs[+el.dataset.i]; m.selected = m.selected || [];
      const v = el.dataset.v;
      if (v === "No customisation") m.selected = m.selected.includes(v) ? [] : [v];
      else { m.selected = m.selected.filter(x => x !== "No customisation"); m.selected.includes(v) ? m.selected.splice(m.selected.indexOf(v), 1) : m.selected.push(v); }
      saveChat(); renderThread(false); break;
    }
    case "multiDone": { const m = S.msgs[+el.dataset.i]; send((m.selected && m.selected.length) ? m.selected.join(", ") : (S.flow && S.flow.step === "custom" ? "No customisation" : "No preference"), true); break; }
    case "dateDone": { const v = $("#dateIn").value; if (!v || !$("#dateIn").reportValidity()) { $("#dateIn").focus(); return; } send(v, true); break; }
    case "add": addToCart(id); break;
    case "details": openSheet(id); break;
    case "closeSheet": closeSheet(); break;
    case "sq-": sheetState.qty = Math.max(1, sheetState.qty - 1); renderSheet(); break;
    case "sq+": sheetState.qty = Math.min(50, sheetState.qty + 1); renderSheet(); break;
    case "colour": sheetState.colour = el.dataset.c; renderSheet(); break;
    case "sheetAdd": {
      const p = byId(sheetState.id);
      if (p.personalise) { const n = (sheetState.name || "").trim(); if (!n) { $("#fName").classList.add("bad"); $("#persName").focus(); return; } addToCart(p.id, sheetState.qty, {text:n, colour:sheetState.colour}); }
      else addToCart(p.id, sheetState.qty);
      closeSheet(); break;
    }
    case "askAbout": { const p = byId(id); closeSheet(); goChatAndSend(`Tell me about the ${p.name}`, false); break; }
    case "quote": { const p = byId(id); closeSheet(); const design = p.id === "logo-kandil" ? "Logo or monogram" : "Society statement piece";
      const go = () => { S.msgs.push({from:"me", text:`I’d like a quote for the ${p.name}`}); pushBot(startBulk(design)); renderThread(); };
      if (currentView() !== "chat") { location.hash = "chat"; setTimeout(go, 120); } else go(); break; }
    case "startBulk": { const go = () => { if (busy) return; S.msgs.push({from:"me", text:"I’m planning a bigger celebration"}); pushBot(startBulk()); renderThread(); };
      if (currentView() !== "chat") { location.hash = "chat"; setTimeout(go, 120); } else go(); break; }
    case "q-": case "q+": { const l = S.cart.find(l => l.key === el.dataset.key); if (!l) return; if(act==="q+" && l.qty>=999) return toast("For more than 999 pieces, request a bulk quote."); l.qty += act === "q+" ? 1 : -1; if (l.qty < 1) S.cart = S.cart.filter(x => x !== l); saveCart(); renderCart(); break; }
    case "remove": S.cart = S.cart.filter(l => l.key !== el.dataset.key); saveCart(); renderCart(); break;
    case "toCheckout": S.coStep = 1; break;
    case "filter": S.shop[el.dataset.g] = el.dataset.v; renderShop(); break;
    case "clearFilters": S.shop = {size:"all", style:"all", sort:"featured", q:""}; $("#shopSearch").value = ""; renderShop(); break;
    case "coNext": collectCo(); if (validStep(S.coStep)) { S.coStep = Math.min(3, S.coStep + 1); renderCheckout(); window.scrollTo(0, 0); } break;
    case "coBack": collectCo(); S.coStep = Math.max(1, S.coStep - 1); renderCheckout(); window.scrollTo(0, 0); break;
    case "coGoto": collectCo(); S.coStep = +el.dataset.s; renderCheckout(); break;
    case "method": collectCo(); S.co.method = el.dataset.m; store.set("co", S.co); renderCheckout(); break;
    case "pay": runPayment(); break;
    case "dlPng": download("png"); break;
    case "dlSvg": download("svg"); break;
    case "shareShop": {
      const url=qrUrl();
      const share=async()=>{
        try {
          if(navigator.share) await navigator.share({title:"Kandil Galli",url});
          else {await navigator.clipboard.writeText(url);toast("Shop link copied");}
        } catch(err) {
          if(err.name==="AbortError") return;
          const range=document.createRange();range.selectNodeContents($("#qrUrlText"));
          const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
          toast("Shop link selected. Use Copy to share it.");
        }
      };
      share();break;
    }
    case "qrSave": { const v = $("#qrUrlInput").value.trim(); let ok=false, url; try {url=new URL(v);ok=["http:","https:"].includes(url.protocol) && !url.username && !url.password && url.href.length<=1500 && !!qrMatrix(url.href);}catch{} $("#qrUrlInput").closest(".field").classList.toggle("bad", !ok); if (ok) { store.set("qrUrl", url.href); renderQR(); renderMiniQR(); toast("QR code updated"); } break; }
    case "qrReset": store.set("qrUrl", ""); renderQR(); toast("QR code reset to the marketplace link"); break;
    case "refreshDesk": refreshDesk(); break;
    case "signOut": api("logout").then(()=>loginPage()).catch(e=>toast(e.message));break;
    case "deskTab": S.deskTab = el.dataset.v; renderDesk(); break;
    case "deskFilter": S.deskFilter = el.dataset.v; renderDesk(); break;
    case "sample": loadSamples(); break;
    case "clearSamples": S.orders = S.orders.filter(o => !o.sample); S.enquiries = S.enquiries.filter(o => !o.sample); store.set("orders", S.orders); store.set("enquiries", S.enquiries); renderDesk(); break;
    case "hhAdd": modifyDesk("settings",{edit:act});break;
    case "hhDel": if(S.households.length<2) toast("Keep at least one household."); else modifyDesk("settings",{edit:act,id});break;
  }
});
document.addEventListener("change", e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  if (act==="setStatus") setSt(id,{status:el.value});
  if (act==="setHousehold") setSt(id,{household:el.value});
  if (act==="setEnq") setSt(id,{estatus:el.value});
  if (act==="balRecv") setSt(id,{balanceReceived:el.checked});
  if (act==="manualPaid") modifyDesk("manualPaid",{id,value:Number(el.value)});
  if (["hhCap","hhName","made"].includes(act)) {
    const value=act==="hhName" || el.value==="" ? el.value : Number(el.value);
    modifyDesk("settings",{edit:act,id,value});
  }
});
$("#chatForm").addEventListener("submit", e => { e.preventDefault(); const i = $("#chatInput"); if(busy) return; const v = i.value; i.value = ""; send(v, false); });
document.addEventListener("input", e => { const f = e.target.closest(".field.bad"); if (f) f.classList.remove("bad"); });
$("#shopSearch").addEventListener("input", e => { S.shop.q = e.target.value.trim(); renderShop(); });
$("#scrim").addEventListener("click", closeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape" && sheetState) closeSheet(); });
document.addEventListener("click", e => { const a = e.target.closest('a[data-filter]'); if (a) { S.shop = {size:"all", style:a.dataset.filter, sort:"featured", q:""}; } }, true);
window.addEventListener("hashchange", route);
setInterval(()=>{
  if(!document.hidden && !deskBusy && signedIn && currentView()==="makers-desk" && !$("#deskBody").contains(document.activeElement)) refreshDesk(true);
},30000);

/* boot */
$("#brandMark").innerHTML = brandMark();
$("#laneSvg").innerHTML = laneSVG();
$("#laneSvg2").innerHTML = laneSVG();
updateCartCount();
const returned=new URL(location.href).searchParams.get("receipt");
if(returned) {
  const receipt=receipts().find(r=>r.id===returned);
  history.replaceState(null,"",location.pathname+(receipt?"#track/"+receipt.token:"#order"));
}
route();
api("config").then(c=>{online=c.online;testPayments=c.test;if(currentView()==="checkout" && S.coStep===3) renderCheckout();}).catch(()=>{});
window.addEventListener("load", () => { if (currentView() === "qr") renderQR(); renderMiniQR(); });
