import { api } from './api.js';

export function renderAsesoria(root,state,toast){
  const profile=state.meta?.profile||{
    altura:'',
    medidas:{busto:'',cintura:'',cadera:''},
    preferencias:{estilos:'',colores_favorecen:'',colores_no_usar:''}
  };

  const estilos=['Elegante','Casual','Clásico','Femenino','Romántico','Natural','Moderno','Minimalista','Sofisticado','Deportivo','Bohemio'];
  const colores=['Negro','Blanco','Beige','Camel','Café','Gris','Azul marino','Azul','Verde','Oliva','Vinotinto','Rojo','Rosa','Fucsia','Morado','Lila','Amarillo','Naranja'];

  const selectedStyles=String(profile.preferencias?.estilos||'').split(',').map(x=>x.trim()).filter(Boolean);
  const selectedFav=String(profile.preferencias?.colores_favorecen||'').split(',').map(x=>x.trim()).filter(Boolean);
  const selectedNo=String(profile.preferencias?.colores_no_usar||'').split(',').map(x=>x.trim()).filter(Boolean);

  root.innerHTML=`
    <div class="advice-layout">
      <div class="card advice-panel">
        <div class="section-head"><h2>Asesoría de imagen</h2></div>
        <p class="proposal-meta">La asesoría usa tu perfil y únicamente las prendas reales registradas en Mi ropa.</p>

        <div class="card" style="padding:16px;margin-bottom:18px">
          <div class="section-head"><h3>Mi perfil de asesoría</h3></div>

          <div class="form-grid">
            <div class="field">
              <label>Estatura</label>
              <input id="profile-altura" class="input" value="${escAttr(profile.altura||'')}" placeholder="Ej. 151 cm">
            </div>
            <div class="field">
              <label>Busto</label>
              <input id="profile-busto" class="input" value="${escAttr(profile.medidas?.busto||'')}" placeholder="Ej. 95 cm">
            </div>
            <div class="field">
              <label>Cintura</label>
              <input id="profile-cintura" class="input" value="${escAttr(profile.medidas?.cintura||'')}" placeholder="Ej. 80 cm">
            </div>
            <div class="field">
              <label>Cadera</label>
              <input id="profile-cadera" class="input" value="${escAttr(profile.medidas?.cadera||'')}" placeholder="Ej. 95 cm">
            </div>
          </div>

          <div class="field" style="margin-top:14px">
            <label>Estilo personal</label>
            <div class="profile-options" id="profile-styles">
              ${estilos.map(x=>chip('style',x,selectedStyles.includes(x))).join('')}
            </div>
          </div>

          <div class="field" style="margin-top:14px">
            <label>Colores que me favorecen</label>
            <div class="profile-options" id="profile-fav-colors">
              ${colores.map(x=>chip('fav',x,selectedFav.includes(x))).join('')}
            </div>
          </div>

          <div class="field" style="margin-top:14px">
            <label>Colores que no quiero usar</label>
            <div class="profile-options" id="profile-no-colors">
              ${colores.map(x=>chip('no',x,selectedNo.includes(x))).join('')}
            </div>
          </div>

          <div class="form-actions" style="margin-top:16px">
            <button id="btn-save-profile" class="btn btn-primary">GUARDAR PERFIL</button>
          </div>
        </div>

        <textarea id="advice-query" class="textarea" placeholder="Ejemplo: quiero vestirme de gris para una reunión, ¿qué puedo usar?"></textarea>

        <div class="actions" style="margin-top:12px">
          <button id="btn-advice" class="btn btn-secondary">ASESORARME</button>
          <button id="btn-proposals" class="btn btn-primary">PROPONER 2 LOOKS</button>
        </div>

        <div id="advice-result" style="margin-top:18px"></div>
      </div>

      <aside class="card advice-side">
        <h3>Perfil aplicado</h3>
        <div id="profile-summary" class="profile-list"></div>
      </aside>
    </div>`;

  updateSummary();

  root.querySelectorAll('.profile-chip').forEach(b=>{
    b.onclick=()=>b.classList.toggle('selected');
  });

  root.querySelector('#btn-save-profile').onclick=async()=>{
    const btn=root.querySelector('#btn-save-profile');
    btn.disabled=true;
    btn.textContent='GUARDANDO...';

    try{
      const data={
        altura:root.querySelector('#profile-altura').value.trim(),
        busto:root.querySelector('#profile-busto').value.trim(),
        cintura:root.querySelector('#profile-cintura').value.trim(),
        cadera:root.querySelector('#profile-cadera').value.trim(),
        estilos:getSelected('style').join(', '),
        colores_favorecen:getSelected('fav').join(', '),
        colores_no_usar:getSelected('no').join(', ')
      };

      const r=await api.updateProfile(data);
      state.meta.profile=r.profile||null;
      updateSummary();
      toast('Perfil guardado correctamente.');
    }catch(e){
      toast(e.message);
    }finally{
      btn.disabled=false;
      btn.textContent='GUARDAR PERFIL';
    }
  };

  root.querySelector('#btn-advice').onclick=async()=>runText();
  root.querySelector('#btn-proposals').onclick=async()=>runLooks();

  async function runText(){
    const q=root.querySelector('#advice-query').value.trim();
    if(!q)return toast('Escribe primero qué quieres consultar.');
    setBusy(true);
    try{
      const r=await api.advice(q,false);
      root.querySelector('#advice-result').innerHTML=`<div class="card" style="padding:16px"><div class="advice-text">${format(r.answer)}</div></div>`;
    }catch(e){toast(e.message);}
    finally{setBusy(false);}
  }

  async function runLooks(){
    const q=root.querySelector('#advice-query').value.trim();
    if(!q)return toast('Escribe primero qué quieres consultar.');
    if(!state.items.length)return toast('No hay prendas disponibles.');
    setBusy(true);
    try{
      const r=await api.advice(q,true);
      root.querySelector('#advice-result').innerHTML=`<div class="proposal-grid">${r.looks.map((look,i)=>proposal(look,i)).join('')}</div>`;
      bindProposals(r.looks);
    }catch(e){toast(e.message);}
    finally{setBusy(false);}
  }

  function proposal(look,i){
    const names=[look.top,look.jacket,look.bottom,look.onePiece,look.shoes,look.bag,...(look.accessories||[])]
      .filter(Boolean)
      .map(id=>state.items.find(x=>String(x.id)===String(id))?.name)
      .filter(Boolean);

    return `<article class="proposal" data-index="${i}">
      <h3>${esc(look.name)}</h3>
      <p>${esc(look.description)}</p>
      <div class="proposal-visual" id="visual-${i}">Visual pendiente</div>
      <p class="proposal-meta"><strong>Prendas:</strong> ${esc(names.join(' · ')||'Sin prendas')}</p>
      <p class="proposal-meta"><strong>Estilismo:</strong> ${esc(look.styling)}</p>
      <div class="actions">
        <button class="btn btn-primary generate" data-index="${i}">GENERAR VISUAL</button>
        <button class="btn btn-secondary save" data-index="${i}" disabled>GUARDAR LOOK</button>
      </div>
    </article>`;
  }

  function bindProposals(looks){
    root.querySelectorAll('.generate').forEach(b=>b.onclick=async()=>{
      const i=Number(b.dataset.index),look=looks[i];
      b.disabled=true;
      b.textContent='GENERANDO...';

      try{
        const r=await api.visual(look);
        look.generatedImage=r.imageBase64;
        look.generatedImageMimeType=r.mimeType;
        root.querySelector(`#visual-${i}`).innerHTML=`<img src="data:${r.mimeType};base64,${r.imageBase64}" alt="Visual ${escAttr(look.name)}">`;
        root.querySelector(`.save[data-index="${i}"]`).disabled=false;
        b.textContent='VISUAL GENERADO';
        toast('Visual generado.');
      }catch(e){
        b.disabled=false;
        b.textContent='GENERAR VISUAL';
        toast(e.message);
      }
    });

    root.querySelectorAll('.save').forEach(b=>b.onclick=async()=>{
      const i=Number(b.dataset.index),look=looks[i];
      if(!look.generatedImage)return toast('Genera primero el visual.');
      b.disabled=true;
      b.textContent='GUARDANDO...';

      try{
        const r=await api.createLook(look);
        state.looks.unshift(r.look);
        b.textContent='GUARDADO';
        toast('Look guardado correctamente.');
      }catch(e){
        b.disabled=false;
        b.textContent='GUARDAR LOOK';
        toast(e.message);
      }
    });
  }

  function chip(type,label,selected){
    return `<button type="button" class="profile-chip${selected?' selected':''}" data-type="${type}" data-value="${escAttr(label)}">${esc(label)}</button>`;
  }

  function getSelected(type){
    return [...root.querySelectorAll(`.profile-chip[data-type="${type}"].selected`)].map(x=>x.dataset.value);
  }

  function updateSummary(){
    const p=state.meta?.profile;
    if(!p){
      root.querySelector('#profile-summary').innerHTML='<div>No hay perfil guardado.</div>';
      return;
    }

    root.querySelector('#profile-summary').innerHTML=`
      <div><strong>Estatura</strong><br>${esc(p.altura||'No registrada')}</div>
      <div><strong>Medidas</strong><br>Busto: ${esc(p.medidas?.busto||'—')} · Cintura: ${esc(p.medidas?.cintura||'—')} · Cadera: ${esc(p.medidas?.cadera||'—')}</div>
      <div><strong>Estilo</strong><br>${esc(p.preferencias?.estilos||'No registrado')}</div>
      <div><strong>Colores que favorecen</strong><br>${esc(p.preferencias?.colores_favorecen||'No registrados')}</div>
      <div><strong>Colores que no quiero usar</strong><br>${esc(p.preferencias?.colores_no_usar||'Ninguno')}</div>`;
  }

  function setBusy(b){
    root.querySelector('#btn-advice').disabled=b;
    root.querySelector('#btn-proposals').disabled=b;
  }
}

function format(text){
  return esc(text)
    .replace(/^### (.+)$/gm,'<strong>$1</strong>')
    .replace(/^## (.+)$/gm,'<strong>$1</strong>')
    .replace(/^\- (.+)$/gm,'• $1')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\n/g,'<br>');
}

function esc(s){
  return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function escAttr(s){
  return esc(s).replace(/"/g,'&quot;');
}
