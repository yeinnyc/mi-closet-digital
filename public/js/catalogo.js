import { api, imageUrl } from './api.js';

export function renderCatalogo(root, state, openModal, toast){
  const categories=['Todos',...state.meta.categories];
  root.innerHTML=`<div class="section-head"><h2>Mi ropa <span class="muted">(${state.items.length})</span></h2><button id="add-item" class="btn btn-primary">+ Agregar artículo</button></div>
  <div class="toolbar"><input id="search-items" class="input" placeholder="Buscar por nombre, color o descripción"><div id="filters" class="filters">${categories.map(c=>`<button class="filter ${state.catalogFilter===c?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
  <div id="catalog-grid" class="catalog-grid"></div>`;
  root.querySelector('#add-item').onclick=()=>openItemForm(null,state,openModal,toast);
  root.querySelector('#search-items').oninput=e=>{state.catalogSearch=e.target.value;draw();};
  root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{state.catalogFilter=b.dataset.cat;renderCatalogo(root,state,openModal,toast);});
  draw();
  function draw(){
    const q=(state.catalogSearch||'').toLowerCase(); const f=state.catalogFilter;
    const items=state.items.filter(i=>(f==='Todos'||i.category===f)&&(!q||`${i.name} ${i.color} ${i.description}`.toLowerCase().includes(q)));
    const grid=root.querySelector('#catalog-grid');
    grid.innerHTML=items.length?items.map(item=>`<article class="card item-card"><div class="item-photo">${item.frontImage?`<img src="${escAttr(imageUrl(item.frontImage))}" alt="${escAttr(item.name)}">`:'Sin imagen'}</div><div class="item-info"><h3>${esc(item.name)}</h3><p>${esc(item.category)} · ${esc(item.color)}</p><div class="actions"><button class="btn btn-secondary edit" data-id="${escAttr(item.id)}">Editar</button><button class="btn btn-danger del" data-id="${escAttr(item.id)}">Eliminar</button></div></div></article>`).join(''):`<div class="card empty">No hay artículos que coincidan.</div>`;
    grid.querySelectorAll('.edit').forEach(b=>b.onclick=()=>openItemForm(state.items.find(i=>String(i.id)===b.dataset.id),state,openModal,toast));
    grid.querySelectorAll('.del').forEach(b=>b.onclick=async()=>{if(!confirm('¿Eliminar este artículo y sus fotos?'))return;try{await api.deleteItem(b.dataset.id);state.items=await api.items().then(r=>r.items);toast('Artículo eliminado.');renderCatalogo(root,state,openModal,toast);}catch(e){toast(e.message);}});
  }
}

function openItemForm(item,state,openModal,toast){
  const edit=Boolean(item); const cats=state.meta.categories;
  openModal(edit?'Editar artículo':'Agregar artículo',`<form id="item-form"><div class="form-grid"><div class="field"><label>Nombre</label><input class="input" name="name" value="${escAttr(item?.name||'')}" required></div><div class="field"><label>Categoría</label><select class="select" name="category">${cats.map(c=>`<option ${c===item?.category?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="field"><label>Color</label><input class="input" name="color" value="${escAttr(item?.color||'')}" required></div><div class="field"><label>Foto frente ${edit?'(opcional)':'(obligatoria)'}</label><input type="file" name="frontImage" accept="image/jpeg,image/png,image/webp" ${edit?'':'required'}></div><div class="field"><label>Foto espalda (opcional)</label><input type="file" name="backImage" accept="image/jpeg,image/png,image/webp"></div><div class="field full"><label>Descripción</label><textarea class="textarea" name="description">${esc(item?.description||'')}</textarea></div></div><div class="form-actions"><button type="button" class="btn btn-secondary" id="cancel">Cancelar</button><button class="btn btn-primary">Guardar</button></div></form>`);
  const form=document.querySelector('#item-form'); document.querySelector('#cancel').onclick=()=>document.querySelector('#modal-close').click();
  form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form);try{if(edit)fd.append('id',item.id);const result=edit?await api.updateItem(fd):await api.createItem(fd);state.items=await api.items().then(r=>r.items);document.querySelector('#modal-close').click();toast(edit?'Artículo actualizado.':'Artículo guardado.');renderCatalogo(document.querySelector('#view-catalogo'),state,openModal,toast);}catch(err){toast(err.message);}};
}

function esc(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function escAttr(s){return esc(s).replace(/"/g,'&quot;');}

