import { api } from './api.js';
import { renderCatalogo } from './catalogo.js';
import { renderLooks } from './looks.js';
import { renderAsesoria } from './asesoria.js';

const state={items:[],looks:[],meta:{categories:[]},catalogFilter:'Todos',catalogSearch:''};
const views={dashboard:document.querySelector('#view-dashboard'),catalogo:document.querySelector('#view-catalogo'),looks:document.querySelector('#view-looks'),asesoria:document.querySelector('#view-asesoria')};
const titles={dashboard:'Inicio',catalogo:'Mi ropa',looks:'Mis looks',asesoria:'Asesoría de imagen'};
let current='dashboard';

function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),3200);}
function openModal(title,body){document.querySelector('#modal-title').textContent=title;document.querySelector('#modal-body').innerHTML=body;document.querySelector('#modal').classList.remove('hidden');}
document.querySelector('#modal-close').onclick=()=>document.querySelector('#modal').classList.add('hidden');
document.querySelector('#modal').addEventListener('click',e=>{if(e.target.id==='modal')document.querySelector('#modal').classList.add('hidden');});

document.querySelectorAll('.nav-item').forEach(btn=>btn.onclick=()=>show(btn.dataset.view));
document.querySelector('#btn-refresh').onclick=load;

async function load(){
  setStatus('Conectando...',false);
  try{const [meta,items,looks]=await Promise.all([api.meta(),api.items(),api.looks()]);state.meta=meta;state.items=Array.isArray(items.items)?items.items:[];state.looks=Array.isArray(looks.looks)?looks.looks:[];setStatus('Conectado',true);renderAll();}catch(e){setStatus('Error de conexión',false);toast(e.message);}
}
function setStatus(text,ok){document.querySelector('#api-status').textContent=text;document.querySelector('#api-dot').style.background=ok?'#22c55e':'#ef4444';}
function show(name){current=name;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));views[name].classList.add('active');document.querySelector('#page-title').textContent=titles[name];if(name==='catalogo')renderCatalogo(views.catalogo,state,openModal,toast);if(name==='looks')renderLooks(views.looks,state,openModal,toast);if(name==='asesoria')renderAsesoria(views.asesoria,state,toast);if(name==='dashboard')renderDashboard();}
function renderAll(){renderDashboard();if(current!=='dashboard')show(current);}
function renderDashboard(){const cats={};state.items.forEach(i=>cats[i.category]=(cats[i.category]||0)+1);const top=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,4);views.dashboard.innerHTML=`<div class="hero card"><h2>Tu armario, organizado y conectado.</h2><p>Mi Closet Digital V2 utiliza tus registros reales de Google Sheets y las imágenes de Google Drive. La IA solo interviene cuando tú la solicitas.</p></div><div class="dashboard-grid"><div class="metric card"><small>Prendas activas</small><strong>${state.items.length}</strong></div><div class="metric card"><small>Looks guardados</small><strong>${state.looks.length}</strong></div><div class="metric card"><small>Categorías</small><strong>${Object.keys(cats).length}</strong></div><div class="metric card"><small>Visuales guardados</small><strong>${state.looks.filter(l=>l.visual).length}</strong></div></div><div class="card" style="padding:20px"><div class="section-head"><h2>Resumen del armario</h2><button class="btn btn-secondary" id="go-catalog">Ver mi ropa</button></div><div class="filters">${top.map(([c,n])=>`<span class="filter active">${esc(c)}: ${n}</span>`).join('')||'<span class="proposal-meta">Sin datos</span>'}</div></div>`;views.dashboard.querySelector('#go-catalog').onclick=()=>show('catalogo');}
function esc(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
load();

