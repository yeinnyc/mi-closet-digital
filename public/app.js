
/* =========================================================
   MI CLOSET DIGITAL
   APP.JS
   ========================================================= */

/* =========================================================
   ESTADO
   ========================================================= */

   let addSelectedFile = null;

const state = {
  items: [],
  looks: [],

  view: 'home',
  filter: 'Todas',
  search: '',

  selectedId: null,
  selectedLookId: null,

 look: {
  top: null,
  jacket: null,
  bottom: null,
  onePiece: null,
  shoes: null,
  bag: null,
  accessories: []
}
};


/* =========================================================
   CATEGORÍAS
   ========================================================= */

const categories = [
  'Todas',
  'Busos',
  'Camisas',
  'Pantalones',
  'Jeans',
  'Vestidos',
  'Faldas',
  'Chaquetas',
  'Zapatos',
  'Bolsos',
  'Accesorios',
  'Otros'
];


/* =========================================================
   UTILIDADES
   ========================================================= */

const $ = selector => document.querySelector(selector);

const esc = (value = '') =>
  String(value).replace(
    /[&<>'"]/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char])
  );


function toast(message) {
  const element = $('#toast');

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.classList.add('show');

  setTimeout(() => {
    element.classList.remove('show');
  }, 2200);
}


/* =========================================================
   IMÁGENES
   ========================================================= */

async function convertTransparentToWebP(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const maxSize = 2200;
        const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (webpBlob) => {
            if (!webpBlob) {
              reject(new Error('No se pudo generar WebP.'));
              return;
            }

            resolve(webpBlob);
          },
          'image/webp',
          0.88
        );
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('No se pudo cargar la imagen.'));
    };

    img.src = URL.createObjectURL(blob);
  });
}

function getImageUrl(item) {
  const originalUrl =
    item?.frontImage?.url ||
    item?.frontImage ||
    item?.imageUrl ||
    item?.image ||
    '';

  if (!originalUrl) {
    return '';
  }

  const url = String(originalUrl).trim();

  // Google Drive: convertir al formato Googleusercontent
let match = url.match(/[?&]id=([^&]+)/i);

if (match && match[1]) {
    return (
        'https://lh3.googleusercontent.com/d/' +
        encodeURIComponent(match[1]) +
        '=w1000'
    );
}

  match = url.match(/\/file\/d\/([^/]+)/i);

  if (match && match[1]) {
    return (
      'https://drive.google.com/uc?export=view&id=' +
      encodeURIComponent(match[1])
    );
  }

  match = url.match(/\/d\/([^/]+)/i);

  if (match && match[1]) {
    return (
      'https://drive.google.com/uc?export=view&id=' +
      encodeURIComponent(match[1])
    );
  }

  return url;
}


/* =========================================================
   ESTILOS PARA DETALLE / EDICIÓN / LOOKS
   ========================================================= */

function injectDetailStyles() {

  if ($('#detail-styles')) {
    return;
  }

  const style = document.createElement('style');

  style.id = 'detail-styles';

  style.textContent = `

    /* =========================
       DETALLE ARTÍCULO
       ========================= */

    .detail-overlay,
    .edit-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.65);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    }

    .detail-modal {
      width: min(900px, 100%);
      max-height: 92vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      position: relative;
    }

    .detail-close {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 3;
      width: 38px;
      height: 38px;
      border: 0;
      border-radius: 50%;
      background: #111;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
    }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .detail-photo {
      min-height: 500px;
      background: #f2f2f2;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .detail-photo img {
      width: 100%;
      height: 100%;
      min-height: 500px;
      object-fit: contain;
      display: block;
    }

    .detail-no-image {
      color: #777;
      font-size: 14px;
    }

    .detail-info {
      padding: 42px 35px 35px;
    }

    .detail-category {
      font-size: 11px;
      letter-spacing: 1.5px;
      color: #777;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .detail-title {
      font-size: 30px;
      line-height: 1.15;
      margin: 0 0 25px;
      color: #111;
    }

    .detail-field {
      border-bottom: 1px solid #e5e5e5;
      padding: 14px 0;
    }

    .detail-field-label {
      font-size: 10px;
      letter-spacing: 1.2px;
      color: #777;
      margin-bottom: 5px;
    }

    .detail-field-value {
      font-size: 15px;
      color: #111;
    }

    .detail-description {
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .detail-actions {
      display: flex;
      gap: 10px;
      margin-top: 28px;
      flex-wrap: wrap;
    }

    .detail-actions button {
      flex: 1;
      min-width: 120px;
    }

    .detail-delete {
      width: 100%;
      margin-top: 10px;
      min-height: 38px;
    }


    /* =========================
       EDICIÓN
       ========================= */

    .edit-modal {
      width: min(600px, 100%);
      max-height: 92vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 12px;
      padding: 30px;
      box-sizing: border-box;
    }

    .edit-modal h2 {
      margin-top: 0;
      margin-bottom: 22px;
    }

    .edit-preview {
      width: 100%;
      height: 220px;
      background: #f2f2f2;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .edit-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .edit-file {
      margin-bottom: 20px;
    }

    .edit-actions {
      display: flex;
      gap: 10px;
      margin-top: 25px;
    }

    .edit-actions button {
      flex: 1;
    }


    /* =========================
       LOOKS
       ========================= */

    .looks-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 25px;
    }

    .look-section-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 18px;
    }

    .look-section-title strong {
      font-size: 15px;
      letter-spacing: .5px;
    }

    .look-section-title span {
      font-size: 13px;
      color: #777;
    }

    .look-preview-panel {
      margin-bottom: 25px;
    }

    .look-preview {
      min-height: 170px;
      border: 1px dashed #d5d5d5;
      border-radius: 10px;
      padding: 18px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .look-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 130px;
      gap: 8px;
      color: #777;
      text-align: center;
    }

    .look-empty-icon {
      width: 40px;
      height: 40px;
      border: 1px solid #bbb;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 5px;
    }

    .look-items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 180px));
      gap: 14px;
    }

    .look-item {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      background: #fff;
      position: relative;
      transition: .15s ease;
    }

    .look-item:hover {
      border-color: #111;
    }

    .look-item.selected {
      border: 2px solid #111;
    }

    .look-item-image {
      height: 150px;
      background: #f3f3f3;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .look-item-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .look-item-info {
      padding: 9px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .look-item-info strong {
      font-size: 12px;
      text-transform: uppercase;
    }

    .look-item-info span {
      font-size: 11px;
      color: #777;
    }

    .look-selected {
      position: absolute;
      top: 7px;
      right: 7px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #111;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .selected-look-grid {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 15px;
    }

    .selected-look-item {
      width: 120px;
      text-align: center;
    }

    .selected-look-item img,
    .selected-look-item .item-image-empty {
      width: 120px;
      height: 145px;
      object-fit: contain;
      background: #f3f3f3;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .selected-look-item span {
      display: block;
      margin-top: 7px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .look-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin: 25px 0;
    }


    /* =========================
       LOOKS GUARDADOS
       ========================= */

    .saved-looks-panel {
      margin-top: 35px;
    }

    .saved-looks-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fill, minmax(280px, 1fr));
      gap: 18px;
    }

    .saved-look-card {
      border: 1px solid #ddd;
      border-radius: 10px;
      background: #fff;
      overflow: hidden;
    }

    .saved-look-header {
      padding: 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .saved-look-name {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .saved-look-items {
      padding: 15px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .saved-look-item {
      width: 75px;
      text-align: center;
    }

    .saved-look-item img,
    .saved-look-item .item-image-empty {
      width: 75px;
      height: 85px;
      object-fit: contain;
      background: #f3f3f3;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .saved-look-item span {
      display: block;
      margin-top: 4px;
      font-size: 9px;
      line-height: 1.2;
    }

    .saved-look-actions {
      padding: 12px 15px 15px;
      display: flex;
      gap: 8px;
    }

    .saved-look-actions button {
      flex: 1;
    }

    .saved-look-date {
      color: #777;
      font-size: 10px;
      margin-top: 3px;
    }


    @media (max-width: 700px) {

      .detail-overlay,
      .edit-overlay {
        padding: 10px;
      }

      .detail-modal {
        max-height: 96vh;
      }

      .detail-layout {
        grid-template-columns: 1fr;
      }

      .detail-photo {
        min-height: 330px;
        max-height: 400px;
      }

      .detail-photo img {
        min-height: 330px;
        max-height: 400px;
      }

      .detail-info {
        padding: 25px 20px;
      }

      .detail-title {
        font-size: 24px;
      }

      .edit-modal {
        padding: 22px;
      }

      .edit-actions {
        flex-direction: column;
      }

      .looks-header {
        flex-direction: column;
      }

      .look-items-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }

      .look-actions {
        flex-direction: column;
      }

      .look-actions button {
        width: 100%;
      }

      .saved-looks-grid {
        grid-template-columns: 1fr;
      }
    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   CARGAR ARTÍCULOS
   ========================================================= */

async function loadItems() {

  try {

    const response =
      await fetch('/api/items');

    const text =
      await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        'El servidor devolvió una respuesta no válida.'
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        'No se pudieron cargar los artículos.'
      );
    }

    state.items =
      Array.isArray(data.items)
        ? data.items
        : [];

    render();

  } catch (error) {

    console.error(
      'Error cargando artículos:',
      error
    );

    state.items = [];

    render();

    toast(
      error.message ||
      'No se pudieron cargar los artículos.'
    );
  }
}


/* =========================================================
   CARGAR LOOKS
   ========================================================= */

async function loadLooks() {

  try {

    const response =
      await fetch('/api/looks');

    const text =
      await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        'El servidor devolvió una respuesta no válida.'
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        'No se pudieron cargar los looks.'
      );
    }

    state.looks =
      Array.isArray(data.looks)
        ? data.looks
        : [];

    if (state.view === 'looks') {
      renderLooks();
    }

  } catch (error) {

    console.error(
      'Error cargando looks:',
      error
    );

    state.looks = [];

  }
}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function setView(view, filter) {

  state.view = view;

  if (filter) {
    state.filter = filter;
  }

  render();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


/* =========================================================
   EVENTOS GLOBALES
   ========================================================= */

document.addEventListener(
  'click',
  event => {

    /* =============================
       NAVEGACIÓN
       ============================= */

    const viewButton =
      event.target.closest(
        '[data-view]'
      );

    if (viewButton) {

      setView(
        viewButton.dataset.view,
        viewButton.dataset.filter
      );

      return;
    }


    /* =============================
       ELIMINAR ARTÍCULO
       ============================= */

    const deleteButton =
      event.target.closest(
        '[data-delete]'
      );

    if (deleteButton) {

      event.stopPropagation();

      deleteItem(
        deleteButton.dataset.delete
      );

      return;
    }


    /* =============================
       ABRIR DETALLE
       ============================= */

    const itemCard =
      event.target.closest(
        '[data-item-id]'
      );

    if (itemCard) {

      openDetail(
        itemCard.dataset.itemId
      );
    }

  }
);


/* =========================================================
   RENDER PRINCIPAL
   ========================================================= */

function render() {

  [
    'home',
    'ropa',
    'add',
    'looks',
    'asesoria',
    'config'
  ].forEach(id => {

    const section =
      $('#' + id);

    if (section) {

      section.classList.toggle(
        'hidden',
        state.view !== id
      );
    }

  });


  document
    .querySelectorAll('nav button')
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.view ===
          state.view &&
        (
          !button.dataset.filter ||
          button.dataset.filter ===
            state.filter
        )
      );

    });


  if (state.view === 'home') {
    renderHome();
  }

  if (state.view === 'ropa') {
    renderRopa();
  }

  if (state.view === 'add') {
    renderAdd();
  }

  if (state.view === 'looks') {
    renderLooks();
  }

  if (state.view === 'asesoria') {
  renderAsesoria();
}

  if (state.view === 'config') {
    renderConfig();
  }

}


/* =========================================================
   INICIO
   ========================================================= */

function renderHome() {

  const counts = {

    prendas:
      state.items.filter(
        item =>
          ![
            'Zapatos',
            'Bolsos',
            'Accesorios'
          ].includes(item.category)
      ).length,

    zapatos:
      state.items.filter(
        item =>
          item.category ===
          'Zapatos'
      ).length,

    bolsos:
      state.items.filter(
        item =>
          item.category ===
          'Bolsos'
      ).length,

    accesorios:
      state.items.filter(
        item =>
          item.category ===
          'Accesorios'
      ).length
  };


  $('#home').innerHTML = `

    <h1>MI CLOSET</h1>

    <p class="subtitle">
      Tu armario, organizado y
      listo para crear nuevos looks.
    </p>

    <div class="grid">

      <div class="stat">
        <div class="label">PRENDAS</div>
        <strong>${counts.prendas}</strong>
      </div>

      <div class="stat">
        <div class="label">ZAPATOS</div>
        <strong>${counts.zapatos}</strong>
      </div>

      <div class="stat">
        <div class="label">BOLSOS</div>
        <strong>${counts.bolsos}</strong>
      </div>

      <div class="stat">
        <div class="label">ACCESORIOS</div>
        <strong>${counts.accesorios}</strong>
      </div>

    </div>

    <div style="margin:28px 0">

      <button
        class="btn"
        data-view="add">

        + AGREGAR ARTÍCULO

      </button>

    </div>

    <div class="panel">

      <b>ÚLTIMOS ARTÍCULOS</b>

      <div style="height:18px"></div>

      ${renderItemGrid(
        state.items.slice(0, 4)
      )}

    </div>

  `;
}


/* =========================================================
   MI ROPA
   ========================================================= */

function renderRopa() {

  const filtered =
    state.items.filter(item => {

      const categoryOk =
        state.filter === 'Todas' ||
        item.category ===
          state.filter;

      const q =
        state.search
          .toLowerCase()
          .trim();

      const text = `
        ${item.name || ''}
        ${item.category || ''}
        ${item.color || ''}
        ${item.description || ''}
      `.toLowerCase();

      return (
        categoryOk &&
        (!q || text.includes(q))
      );

    });


  $('#ropa').innerHTML = `

    <h1>MI ROPA</h1>

    <p class="subtitle">
      Todos tus artículos,
      organizados en un solo lugar.
    </p>

    <div class="toolbar">

      <input
        id="search"
        class="search"
        placeholder="Buscar una prenda..."
        value="${esc(state.search)}"
      >

      <button
        class="btn"
        data-view="add">

        + AGREGAR

      </button>

    </div>

    <div class="filters">

      ${categories
        .map(category => `

          <button
            class="filter ${
              state.filter === category
                ? 'active'
                : ''
            }"
            data-cat="${esc(category)}">

            ${esc(category)}

          </button>

        `)
        .join('')}

    </div>

    ${renderItemGrid(filtered)}

  `;


  const search = $('#search');

  if (search) {

    search.addEventListener(
      'input',
      event => {

        state.search =
          event.target.value;

        const cursorPosition =
          event.target.selectionStart ??
          state.search.length;

        renderRopa();

        const newSearch =
          $('#search');

        if (newSearch) {

          newSearch.focus();

          newSearch.setSelectionRange(
            cursorPosition,
            cursorPosition
          );
        }

      }
    );
  }


  document
    .querySelectorAll('[data-cat]')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          state.filter =
            button.dataset.cat;

          renderRopa();

        }
      );

    });

}


/* =========================================================
   TARJETAS DE ARTÍCULOS
   ========================================================= */

function renderItemGrid(items) {

  if (
    !Array.isArray(items) ||
    !items.length
  ) {

    return `
      <div class="empty">
        Aún no tienes
        artículos guardados.
      </div>
    `;
  }


  return `

    <div class="items-grid">

      ${items.map(item => {

        const imageUrl =
          getImageUrl(item);

        return `

          <article
            class="item-card"
            data-item-id="${esc(item.id)}">

            ${
              imageUrl

              ? `

                <img
                  src="${esc(imageUrl)}"
                  alt="${esc(
                    item.name ||
                    'Artículo'
                  )}"
                  loading="lazy"
                >

              `

              : `

                <div
                  class="item-image-empty">

                  Sin imagen

                </div>

              `
            }

            <div class="item-info">

              <div class="item-name">
                ${esc(
                  item.name || ''
                )}
              </div>

              <div class="item-meta">

                ${esc(
                  item.category || ''
                )}

                ·

                ${esc(
                  item.color || ''
                )}

              </div>

              <button
                class="btn-delete"
                data-delete="${esc(item.id)}">

                ELIMINAR

              </button>

            </div>

          </article>

        `;

      }).join('')}

    </div>

  `;
}


/* =========================================================
   DETALLE ARTÍCULO
   ========================================================= */

function openDetail(id) {

  const item =
    state.items.find(
      current =>
        String(current.id) ===
        String(id)
    );

  if (!item) {

    toast(
      'No se encontró el artículo.'
    );

    return;
  }

  state.selectedId =
    String(item.id);

  injectDetailStyles();

  const imageUrl =
    getImageUrl(item);

  const overlay =
    document.createElement('div');

  overlay.className =
    'detail-overlay';

  overlay.id =
    'detail-overlay';

  overlay.innerHTML = `

    <div class="detail-modal">

      <button
        class="detail-close"
        id="detail-close"
        aria-label="Cerrar">

        ×

      </button>

      <div class="detail-layout">

        <div class="detail-photo">

          ${
            imageUrl

            ? `

              <img
                src="${esc(imageUrl)}"
                alt="${esc(
                  item.name ||
                  'Artículo'
                )}"
              >

            `

            : `

              <div
                class="detail-no-image">

                Sin imagen

              </div>

            `
          }

        </div>

        <div class="detail-info">

          <div class="detail-category">

            ${esc(
              item.category || ''
            )}

          </div>

          <h2 class="detail-title">

            ${esc(
              item.name ||
              'Sin nombre'
            )}

          </h2>

          <div class="detail-field">

            <div class="detail-field-label">
              COLOR
            </div>

            <div class="detail-field-value">

              ${esc(
                item.color ||
                'Sin especificar'
              )}

            </div>

          </div>

          <div class="detail-field">

            <div class="
              detail-field-label">

              DESCRIPCIÓN

            </div>

            <div class="
              detail-field-value
              detail-description">

              ${esc(
                item.description ||
                'Sin descripción.'
              )}

            </div>

          </div>

          <div class="detail-actions">

            <button
              class="btn"
              id="detail-edit">

              EDITAR

            </button>

            <button
              class="btn secondary"
              id="detail-back">

              VOLVER

            </button>

          </div>

          <button
            class="
              btn-delete
              detail-delete"
            id="detail-delete">

            ELIMINAR ARTÍCULO

          </button>

        </div>

      </div>

    </div>

  `;

  document.body.appendChild(
    overlay
  );


  $('#detail-close')
    .addEventListener(
      'click',
      closeDetail
    );


  $('#detail-back')
    .addEventListener(
      'click',
      closeDetail
    );


  $('#detail-edit')
    .addEventListener(
      'click',
      () => openEdit(item)
    );


  $('#detail-delete')
    .addEventListener(
      'click',
      event => {

        event.stopPropagation();

        deleteItem(item.id);

      }
    );


  overlay.addEventListener(
    'click',
    event => {

      if (
        event.target === overlay
      ) {

        closeDetail();

      }

    }
  );

}


/* =========================================================
   CERRAR DETALLE
   ========================================================= */

function closeDetail() {

  const overlay =
    $('#detail-overlay');

  if (overlay) {
    overlay.remove();
  }

  state.selectedId =
    null;
}


/* =========================================================
   EDITAR ARTÍCULO
   ========================================================= */

function openEdit(item) {

  injectDetailStyles();

  closeDetail();

  const overlay =
    document.createElement('div');

  overlay.className =
    'edit-overlay';

  overlay.id =
    'edit-overlay';

  const imageUrl =
    getImageUrl(item);

  overlay.innerHTML = `

    <div class="edit-modal">

      <h2>
        EDITAR ARTÍCULO
      </h2>

      <div class="edit-preview">

        ${
          imageUrl

          ? `

            <img
              id="edit-preview-img"
              src="${esc(imageUrl)}"
              alt="${esc(
                item.name ||
                'Artículo'
              )}"
            >

          `

          : `

            <span>
              Sin imagen
            </span>

          `
        }

      </div>

      <div class="edit-file">

        <label>
          <b>CAMBIAR FOTO</b>
        </label>

        <input
          id="edit-file"
          type="file"
          accept="
            image/jpeg,
            image/png,
            image/webp
          "
        >

      </div>

      <div class="fields">

        <div class="field">

          <label>NOMBRE</label>

          <input
            id="edit-name"
            value="${esc(
              item.name || ''
            )}"
          >

        </div>

        <div class="field">

          <label>CATEGORÍA</label>

          <select id="edit-category">

            ${categories
              .filter(
                category =>
                  category !== 'Todas'
              )
              .map(
                category => `

                  <option
                    value="${esc(category)}"
                    ${
                      category ===
                      item.category
                        ? 'selected'
                        : ''
                    }>

                    ${esc(category)}

                  </option>

                `
              )
              .join('')}

          </select>

        </div>

        <div class="field">

          <label>COLOR</label>

          <input
            id="edit-color"
            value="${esc(
              item.color || ''
            )}"
          >

        </div>

        <div class="field">

          <label>DESCRIPCIÓN</label>

          <textarea
            id="edit-description"
          >${esc(
            item.description || ''
          )}</textarea>

        </div>

      </div>

      <div class="edit-actions">

        <button
          class="btn secondary"
          id="edit-cancel">

          CANCELAR

        </button>

        <button
          class="btn"
          id="edit-save">

          GUARDAR CAMBIOS

        </button>

      </div>

      <div
        id="edit-status"
        class="status">
      </div>

    </div>

  `;

  document.body.appendChild(
    overlay
  );


  $('#edit-cancel')
    .addEventListener(
      'click',
      () => overlay.remove()
    );


  $('#edit-file')
    .addEventListener(
      'change',
      event => {

        const file =
          event.target.files[0];

        if (!file) {
          return;
        }

        if (
          !file.type.startsWith(
            'image/'
          )
        ) {

          toast(
            'Selecciona una imagen válida.'
          );

          event.target.value =
            '';

          return;
        }

        if (
          file.size >
          8 * 1024 * 1024
        ) {

          toast(
            'La imagen no puede superar 8 MB.'
          );

          event.target.value =
            '';

          return;
        }

        const preview =
          $('#edit-preview-img');

        const newUrl =
          URL.createObjectURL(file);

        if (preview) {

          preview.src =
            newUrl;

        } else {

          const container =
            document.querySelector(
              '.edit-preview'
            );

          if (container) {

            container.innerHTML = `

              <img
                id="edit-preview-img"
                src="${newUrl}"
                alt="Nueva imagen"
              >

            `;

          }

        }

      }
    );


  $('#edit-save')
    .addEventListener(
      'click',
      () => updateItem(item.id)
    );


  overlay.addEventListener(
    'click',
    event => {

      if (
        event.target === overlay
      ) {

        overlay.remove();

      }

    }
  );

}


/* =========================================================
   ACTUALIZAR ARTÍCULO
   ========================================================= */

async function updateItem(id) {

  const name =
    $('#edit-name')
      ?.value
      .trim() || '';

  const category =
    $('#edit-category')
      ?.value || '';

  const color =
    $('#edit-color')
      ?.value
      .trim() || '';

  const description =
    $('#edit-description')
      ?.value
      .trim() || '';

  const file =
    $('#edit-file')
      ?.files?.[0] || null;


  if (!name) {
    toast(
      'Escribe el nombre del artículo.'
    );
    return;
  }

  if (!category) {
    toast(
      'Selecciona una categoría.'
    );
    return;
  }

  if (!color) {
    toast(
      'Escribe el color del artículo.'
    );
    return;
  }

  if (file) {

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      toast(
        'Selecciona una imagen válida.'
      );

      return;
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {

      toast(
        'La imagen no puede superar 8 MB.'
      );

      return;
    }
  }


  const formData =
    new FormData();

  formData.append(
    'id',
    id
  );

  formData.append(
    'name',
    name
  );

  formData.append(
    'category',
    category
  );

  formData.append(
    'color',
    color
  );

  formData.append(
    'description',
    description
  );

  if (file) {
    formData.append(
      'image',
      file
    );
  }


  const button =
    $('#edit-save');

  const status =
    $('#edit-status');

  if (!button) {

    toast(
      'No se encontró el botón de guardado.'
    );

    return;
  }


  button.disabled = true;

  button.textContent =
    'GUARDANDO...';

  if (status) {
    status.textContent =
      'Guardando cambios...';
  }


  try {

    const response =
      await fetch(
        '/api/items/update',
        {
          method: 'POST',
          body: formData
        }
      );

    const text =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(text);
    } catch {
      throw new Error(
        'El servidor devolvió una respuesta no válida.'
      );
    }

    if (!response.ok) {

      throw new Error(
        data.error ||
        'No se pudieron guardar los cambios.'
      );
    }

    if (
      !data.item ||
      !data.item.id
    ) {

      throw new Error(
        'El servidor no devolvió correctamente el artículo actualizado.'
      );
    }


    const index =
      state.items.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );


    if (index !== -1) {

      state.items[index] =
        data.item;

    } else {

      state.items.push(
        data.item
      );
    }


    $('#edit-overlay')
      ?.remove();

    toast(
      'Artículo actualizado correctamente.'
    );

    render();

  } catch (error) {

    console.error(
      'Error actualizando artículo:',
      error
    );

    toast(
      error.message ||
      'No se pudieron guardar los cambios.'
    );

    button.disabled =
      false;

    button.textContent =
      'GUARDAR CAMBIOS';

    if (status) {
      status.textContent =
        '';
    }

  }

}


/* =========================================================
   ELIMINAR ARTÍCULO
   ========================================================= */

async function deleteItem(id) {

  const item =
    state.items.find(
      currentItem =>
        String(currentItem.id) ===
        String(id)
    );

  if (!item) {

    toast(
      'No se encontró el artículo.'
    );

    return;
  }


  const confirmed =
    confirm(
      `¿Quieres eliminar "${item.name}"?`
    );

  if (!confirmed) {
    return;
  }


  try {

    const response =
      await fetch(
        `/api/items/${encodeURIComponent(id)}`,
        {
          method: 'DELETE'
        }
      );

    const text =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(text);
    } catch {
      throw new Error(
        'El servidor devolvió una respuesta no válida.'
      );
    }

    if (!response.ok) {

      throw new Error(
        data.error ||
        'No se pudo eliminar el artículo.'
      );
    }


    state.items =
      state.items.filter(
        currentItem =>
          String(currentItem.id) !==
          String(id)
      );


    closeDetail();

    toast(
      'Artículo eliminado.'
    );

    render();

  } catch (error) {

    console.error(
      'Error eliminando artículo:',
      error
    );

    toast(
      error.message ||
      'No se pudo eliminar el artículo.'
    );

  }

}


/* =========================================================
   AGREGAR ARTÍCULO
   ========================================================= */

let frontFile = null;
let backFile = null;

function renderAdd() {

  $('#add').innerHTML = `
    <h1>AGREGAR ARTÍCULO</h1>

    <p class="subtitle">
      Agrega una foto del frente. La foto de espalda es opcional.
    </p>

    <div class="add-mobile-layout">

      <div class="add-photo-panel">

        <h2 class="add-photo-title">
          FOTOS DEL ARTÍCULO
        </h2>

        <div class="photo-view-section">

          <h3>FRENTE</h3>

          <div id="dropzone-front" class="add-dropzone">

            <div id="drop-content-front" class="drop-content">

              <div class="camera-icon">+</div>

              <strong>AGREGAR FOTO</strong>

              <span>Foto de frente</span>

            </div>

            <img
              id="preview-front"
              alt="Vista previa del frente"
            >

          </div>

          <input
            id="file-camera-front"
            type="file"
            accept="image/*"
            capture="environment"

            hidden
          >

        
          <input
            id="file-gallery-front"
            type="file"
            accept="image/*"
            hidden
          >
</div>

        <div class="photo-view-section">

          <h3>ESPALDA</h3>

          <div id="dropzone-back" class="add-dropzone">

            <div id="drop-content-back" class="drop-content">

              <div class="camera-icon">+</div>

              <strong>AGREGAR FOTO</strong>

              <span>Foto de espalda</span>

            </div>

            <img
              id="preview-back"
              alt="Vista previa de la espalda"
            >

          </div>

          <input
            id="file-camera-back"
            type="file"
            accept="image/*"
            capture="environment"

            hidden
          >

        
          <input
            id="file-gallery-back"
            type="file"
            accept="image/*"
            hidden
          >
</div><div id="status" class="status"></div>

        <div
          id="photo-source-modal"
          hidden
          style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);align-items:flex-end;justify-content:center;padding:16px;box-sizing:border-box;"
        >
          <div
            style="width:min(420px,100%);background:#fff;border-radius:22px;padding:20px;box-sizing:border-box;box-shadow:0 20px 60px rgba(0,0,0,.25);"
          >
            <div
              style="font-size:18px;font-weight:700;text-align:center;margin-bottom:16px;"
            >
              AGREGAR FOTO
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <button
                id="photo-source-camera"
                type="button"
                style="border:1px solid #ddd;border-radius:16px;background:#f5f5f5;padding:18px 10px;font-weight:700;font-size:14px;cursor:pointer;"
              >
                C?MARA
              </button>

              <button
                id="photo-source-gallery"
                type="button"
                style="border:1px solid #ddd;border-radius:16px;background:#f5f5f5;padding:18px 10px;font-weight:700;font-size:14px;cursor:pointer;"
              >
                GALER?A
              </button>
            </div>

            <button
              id="photo-source-cancel"
              type="button"
              style="width:100%;margin-top:12px;border:0;background:transparent;padding:12px;font-weight:600;font-size:14px;cursor:pointer;"
            >
              CANCELAR
            </button>
          </div>
        </div>

      </div>

      <div class="add-data-panel">

        <div class="fields">

          <div class="field">

            <label>CATEGORÍA</label>

            <select id="category">

              ${categories
                .filter(category => category !== 'Todas')
                .map(category => `
                  <option value="${esc(category)}">
                    ${esc(category)}
                  </option>
                `)
                .join('')}

            </select>

          </div>

          <div class="field">

            <label>NOMBRE</label>

            <input
              id="name"
              placeholder="Ej. Buso rojo"
            >

          </div>

          <div class="field">

            <label>COLOR</label>

            <input
              id="color"
              placeholder="Ej. Rojo vinotinto"
            >

          </div>

          <div class="field">

            <label>
              DESCRIPCIÓN
              <span class="optional-label">OPCIONAL</span>
            </label>

            <textarea
              id="description"
              placeholder="Descripción del artículo..."
            ></textarea>

          </div>

        </div>

        <div class="add-actions">

          <button
            class="btn secondary"
            data-view="home">

            CANCELAR

          </button>

          <button
            id="save"
            class="btn"
            disabled>

            GUARDAR ARTÍCULO

          </button>

        </div>

        <p class="small-note">
          La foto de frente es obligatoria. La foto de espalda es opcional.
        </p>

      </div>

    </div>
  `;


  const dropzoneFront = $('#dropzone-front');
  const dropzoneBack = $('#dropzone-back');

  const cameraInputFront = $('#file-camera-front');
  const cameraInputBack = $('#file-camera-back');

  const galleryInputFront = $('#file-gallery-front');
  const galleryInputBack = $('#file-gallery-back');

  const photoSourceModal = $('#photo-source-modal');
  const photoSourceCamera = $('#photo-source-camera');
  const photoSourceGallery = $('#photo-source-gallery');
  const photoSourceCancel = $('#photo-source-cancel');

  const saveButton = $('#save');


  if (
    !dropzoneFront ||
    !dropzoneBack ||
    !cameraInputFront ||
    !cameraInputBack
  ) {
    return;
  }




  function validateImage(file) {

    if (!file) {
      return false;
    }

    if (!file.type.startsWith('image/')) {

      toast('Selecciona una imagen valida.');

      return false;
    }

    if (file.size > 8 * 1024 * 1024) {

      toast('La imagen no puede superar 8 MB.');

      return false;
    }

    return true;
  }


  function updateSaveButton() {

    if (!saveButton) {
      return;
    }

    saveButton.disabled =
      !frontFile;

  }


  function showPreview(file, previewId, contentId) {

    const preview =
      document.getElementById(previewId);

    const dropContent =
      document.getElementById(contentId);

    if (!preview) {
      return;
    }

    const imageUrl =
      URL.createObjectURL(file);

    preview.src = imageUrl;
    preview.alt = 'Vista previa';
    preview.style.display = 'block';

    preview.onload = () => {
      URL.revokeObjectURL(imageUrl);
    };

    if (dropContent) {
      dropContent.style.display = 'none';
    }

  }
  async function normalizeImageForProcessing(file) {

    if (
      file.type !== 'image/avif' &&
      file.type !== 'image/heic' &&
      file.type !== 'image/heif'
    ) {
      return file;
    }

    const bitmap =
      await createImageBitmap(file);

    const canvas =
      document.createElement('canvas');

    canvas.width =
      bitmap.width;

    canvas.height =
      bitmap.height;

    const context =
      canvas.getContext('2d');

    context.drawImage(
      bitmap,
      0,
      0
    );

    bitmap.close();

    const blob =
      await new Promise((resolve, reject) => {

        canvas.toBlob(
          result => {

            if (result) {
              resolve(result);
            } else {
              reject(
                new Error(
                  'No se pudo convertir la imagen.'
                )
              );
            }

          },
          'image/jpeg',
          0.92
        );

      });

    return new File(
      [blob],
      file.name.replace(
        /\.(avif|heic|heif)$/i,
        '.jpg'
      ),
      {
        type: 'image/jpeg'
      }
    );

  }




async function identifyItemWithAI(imageFile) {

    try {

      $('#status').textContent =
        'Foto procesada. La IA esta identificando la prenda...';

      const formData =
        new FormData();

      formData.append(
        'frontImage',
        imageFile
      );

      const response =
        await fetch(
          '/api/analyze',
          {
            method: 'POST',
            body: formData
          }
        );

      const text =
        await response.text();

      let data;

      try {

        data =
          JSON.parse(text);

      } catch {

        throw new Error(
          'La IA devolvio una respuesta no valida.'
        );

      }

      if (!response.ok) {

        throw new Error(
          data.error ||
          'No se pudo identificar la prenda.'
        );

      }

      if (!data.analysis) {

        throw new Error(
          'La IA no devolvio los datos de la prenda.'
        );

      }

      const ai =
        data.analysis;

      const name =
        String(ai.name || '').trim();

      const category =
        String(ai.category || '').trim();

      const color =
        String(ai.color || '').trim();

      const description =
        String(ai.description || '').trim();

      if (!name || !category || !color) {

        throw new Error(
          'La IA no pudo identificar completamente la prenda.'
        );

      }

      $('#name').value =
        name;

      $('#category').value =
        category;

      $('#color').value =
        color;

      $('#description').value =
        description;

      $('#status').textContent =
        'Prenda identificada. Revisa los datos y guarda el ART\u00CDCULO.';

      return true;

    } catch (error) {

      console.error(
        'Error identificando ARTÍCULO con IA:',
        error
      );

      toast(
        error.message ||
        'No se pudo identificar la prenda.'
      );

      $('#status').textContent =
        'Foto cargada. Puedes completar los datos manualmente.';

      return false;

    }

  }




































async function selectFrontFile(file) {

    if (!validateImage(file)) {
      return;
    }

    try {

      $('#status').textContent = 'Procesando foto de frente...';

      const processingFile = await normalizeImageForProcessing(file);

      const module = await import('https://esm.sh/@imgly/background-removal@1.7.0');
      const cleanBlob = await module.removeBackground(processingFile);
      const optimizedBlob = await convertTransparentToWebP(cleanBlob);

      frontFile = new File(
        [optimizedBlob],
        file.name,
        { type: optimizedBlob.type || 'image/webp' }
      );

      showPreview(frontFile, 'preview-front', 'drop-content-front');

  await identifyItemWithAI(frontFile);

      $('#status').textContent = backFile
        ? 'Fotos de frente y espalda cargadas.'
        : 'Foto de frente procesada. La foto de espalda es opcional.';

      updateSaveButton();

    } catch (error) {

      console.error('Error al eliminar fondo:', error);

      toast('No se pudo limpiar la foto. Se conservará la original.');

      frontFile = file;

      showPreview(file, 'preview-front', 'drop-content-front');

      $('#status').textContent = backFile
        ? 'Fotos de frente y espalda cargadas.'
        : 'Foto de frente cargada. La foto de espalda es opcional.';

      updateSaveButton();

    }

  }

  async function selectBackFile(file) {

    if (!validateImage(file)) {
      return;
    }

    try {

      $('#status').textContent = 'Procesando foto de espalda...';

      const processingFile = await normalizeImageForProcessing(file);

      const module = await import('https://esm.sh/@imgly/background-removal@1.7.0');
      const cleanBlob = await module.removeBackground(processingFile);
      const optimizedBlob = await convertTransparentToWebP(cleanBlob);

      backFile = new File(
        [optimizedBlob],
        file.name,
        { type: optimizedBlob.type || 'image/webp' }
      );

      showPreview(backFile, 'preview-back', 'drop-content-back');

      $('#status').textContent = frontFile
        ? 'Fotos de frente y espalda cargadas.'
        : 'Foto de espalda procesada. Ahora agrega la foto de frente.';

      updateSaveButton();

    } catch (error) {

      console.error('Error al eliminar fondo:', error);

      toast('No se pudo limpiar la foto. Se conservará la original.');

      backFile = file;

      showPreview(file, 'preview-back', 'drop-content-back');

      $('#status').textContent = frontFile
        ? 'Fotos de frente y espalda cargadas.'
        : 'Foto de espalda cargada. Ahora agrega la foto de frente.';

      updateSaveButton();

    }

  }

  let photoSourceTarget = null;

  function openPhotoSource(target) {
    photoSourceTarget = target;
    photoSourceModal.hidden = false;
    photoSourceModal.style.display = 'flex';
  }

  function closePhotoSource() {
    photoSourceTarget = null;
    photoSourceModal.hidden = true;
    photoSourceModal.style.display = 'none';
  }

  dropzoneFront.addEventListener(
    'click',
    () => openPhotoSource('front')
  );


  cameraInputFront.addEventListener(
    'change',
    () => {

      const file =
        cameraInputFront.files?.[0];

      if (file) {
        selectFrontFile(file);
      }

    }
  );


  dropzoneBack.addEventListener(
    'click',
    () => openPhotoSource('back')
  );


  cameraInputBack.addEventListener(
    'change',
    () => {

      const file =
        cameraInputBack.files?.[0];

      if (file) {
        selectBackFile(file);
      }

    }
  );

  

  photoSourceCamera.addEventListener(
    'click',
    () => {
      const target = photoSourceTarget;
      closePhotoSource();

      if (target === 'front') {
        cameraInputFront.value = '';
        cameraInputFront.click();
      } else if (target === 'back') {
        cameraInputBack.value = '';
        cameraInputBack.click();
      }
    }
  );

  photoSourceGallery.addEventListener(
    'click',
    () => {
      const target = photoSourceTarget;
      closePhotoSource();

      if (target === 'front') {
        galleryInputFront.value = '';
        galleryInputFront.click();
      } else if (target === 'back') {
        galleryInputBack.value = '';
        galleryInputBack.click();
      }
    }
  );

  photoSourceCancel.addEventListener(
    'click',
    closePhotoSource
  );

  photoSourceModal.addEventListener(
    'click',
    event => {
      if (event.target === photoSourceModal) {
        closePhotoSource();
      }
    }
  );

  galleryInputFront.addEventListener(
    'change',
    () => {
      const file = galleryInputFront.files?.[0];

      if (file) {
        selectFrontFile(file);
      }
    }
  );

  galleryInputBack.addEventListener(
    'change',
    () => {
      const file = galleryInputBack.files?.[0];

      if (file) {
        selectBackFile(file);
      }
    }
  );updateSaveButton();


  saveButton?.addEventListener(
    'click',
    saveItem
  );

}

/* =========================================================
   GUARDAR ARTÍCULO
   FRENTE + ESPALDA
========================================================= */

async function saveItem() {

  if (!frontFile) {
    toast('Agrega la foto de frente.');
    return;
  }

  if (frontFile.size > 20 * 1024 * 1024) {
    toast('La foto de frente no puede superar 8 MB.');
    return;
  }

  if (backFile && backFile.size > 20 * 1024 * 1024) {
    toast('La foto de espalda no puede superar 8 MB.');
    return;
  }

  const saveButton = $('#save');

  if (!saveButton) {
    return;
  }

  const name = $('#name').value.trim();
  const category = $('#category').value.trim();
  const color = $('#color').value.trim();
  const description = $('#description').value.trim();


  if (
    !$('#name').value.trim() ||
    !$('#category').value.trim() ||
    !$('#color').value.trim()
  ) {

    toast(
      'Completa nombre, categor\u00EDa y color antes de guardar.'
    );

    return;

  }

  saveButton.disabled = true;

  saveButton.textContent =
    'GUARDANDO...';

  $('#status').textContent =
    'Guardando el ARTÍCULO...';

  try {

    const formData =
      new FormData();

    formData.append(
      'frontImage',
      frontFile
    );

    if (backFile) {
      formData.append(
        'backImage',
        backFile
      );
    }

    formData.append(
      'name',
      name
    );

    formData.append(
      'category',
      category
    );

    formData.append(
      'color',
      color
    );

    formData.append(
      'description',
      description
    );

    const response =
      await fetch(
        '/api/items',
        {
          method: 'POST',
          body: formData
        }
      );

    const text =
      await response.text();

    let data;

    try {

      data =
        JSON.parse(text);

    } catch {

      throw new Error(
        'El servidor devolvio una respuesta no valida.'
      );

    }

    if (!response.ok) {

      throw new Error(
        data.error ||
        'No se pudo guardar.'
      );

    }

    if (
      !data.item ||
      !data.item.id
    ) {

      throw new Error(
        'El servidor no devolvio correctamente el ARTÍCULO guardado.'
      );

    }

    state.items.unshift(
      data.item
    );

    state.filter =
      'Todas';

    state.search =
      '';

    frontFile = null;
    backFile = null;

    toast(
      'ARTÍCULO identificado y guardado correctamente.'
    );

    setTimeout(
      () => {
        setView('ropa');
      },
      500
    );

  } catch (error) {

    console.error(
      'Error identificando/guardando ARTÍCULO:',
      error
    );

    toast(
      error.message ||
      'No se pudo procesar el ARTÍCULO.'
    );

    saveButton.disabled =
      false;

    saveButton.textContent =
      'GUARDAR ARTÍCULO';

    $('#status').textContent =
      '';

  }

}
function renderLooks() {

  const tops =
  state.items.filter(
    item =>
      [
        'Busos',
        'Camisas'
      ].includes(
        item.category
      )
  );

const jackets =
  state.items.filter(
    item =>
      item.category ===
      'Chaquetas'
  );

  const bottoms =
    state.items.filter(
      item =>
        [
          'Pantalones',
          'Jeans',
          'Faldas'
        ].includes(
          item.category
        )
    );

  const onePieces =
    state.items.filter(
      item =>
        item.category ===
        'Vestidos'
    );

  const shoes =
    state.items.filter(
      item =>
        item.category ===
        'Zapatos'
    );

  const bags =
    state.items.filter(
      item =>
        item.category ===
        'Bolsos'
    );

  const accessories =
    state.items.filter(
      item =>
        item.category ===
        'Accesorios'
    );


  $('#looks').innerHTML = `

    <div class="looks-header">

      <div>

        <h1>
          MIS LOOKS
        </h1>

        <p class="subtitle">
          Crea, guarda y consulta
          tus combinaciones.
        </p>

      </div>

      <button
        class="btn secondary"
        data-view="home">

        VOLVER

      </button>

    </div>


    <!-- =================================================
         LOOKS GUARDADOS
         ================================================= -->

    ${renderSavedLooks()}


    <!-- =================================================
         CREAR LOOK
         ================================================= -->

    <div class="panel">

      <div class="look-section-title">

        <strong>
          CREAR LOOK
        </strong>

        <span>
          Combina las prendas de tu closet.
        </span>

      </div>

    </div>


    <!-- =================================================
         LOOK ACTUAL
         ================================================= -->

    <div class="panel look-preview-panel">

      <div class="look-section-title">

        <strong>
          TU LOOK
        </strong>

        <span>
          Selecciona los artículos
          que quieres combinar.
        </span>

      </div>

      <div
        id="look-preview"
        class="look-preview">

        ${renderLookPreview()}

      </div>

    </div>


    <!-- =================================================
         PARTE SUPERIOR
         ================================================= -->

    <div class="panel">

      <div class="look-section-title">

        <strong>
          PARTE SUPERIOR
        </strong>

        <span>
          Busos o camisas
        </span>

      </div>

      ${renderLookSelector(
        tops,
        'top'
      )}

    </div>

        <!-- =================================================
         CHAQUETAS / ABRIGOS
         ================================================= -->

    <div class="panel">

      <div class="look-section-title">

        <strong>
          CHAQUETAS / ABRIGOS
        </strong>

        <span>
          Chaquetas y prendas exteriores
        </span>

      </div>

      ${renderLookSelector(
        jackets,
        'jacket'
      )}

    </div>

    <!-- =================================================
         PARTE INFERIOR
         ================================================= -->

    <div class="panel">

      <div class="look-section-title">

        <strong>
          PARTE INFERIOR
        </strong>

        <span>
          Pantalón, jean o falda
        </span>

      </div>

      ${renderLookSelector(
        bottoms,
        'bottom'
      )}

    </div>


    <!-- =================================================
         VESTIDO
         ================================================= -->

    <div class="panel">

      <div class="look-section-title">

        <strong>
          VESTIDO
        </strong>

        <span>
          Alternativa de una sola pieza
        </span>

      </div>

      ${renderLookSelector(
        onePieces,
        'onePiece'
      )}

    </div>


    <!-- =================================================
         ZAPATOS
         ================================================= -->

    <div class="panel">

      <div class="look-section-title">

        <strong>
          ZAPATOS
        </strong>

      </div>

      ${renderLookSelector(
        shoes,
        'shoes'
      )}

    </div>


    <!-- =================================================
         BOLSO
         ================================================= -->

    <div class="panel">

      <div class="look-section-title">

        <strong>
          BOLSO
        </strong>

      </div>

      ${renderLookSelector(
        bags,
        'bag'
      )}

    </div>


    <!-- =================================================
         ACCESORIOS
         ================================================= -->

    <div class="panel">

      <div class="look-section-title">

        <strong>
          ACCESORIOS
        </strong>

        <span>
          Puedes seleccionar varios.
        </span>

      </div>

      ${renderLookSelector(
        accessories,
        'accessories',
        true
      )}

    </div>


    <!-- =================================================
         ACCIONES
         ================================================= -->

    <div class="look-actions">

      <button
        class="btn secondary"
        id="clear-look">

        LIMPIAR LOOK

      </button>

      <button
        class="btn"
        id="complete-look">

        COMPLETAR LOOK

      </button>

    </div>

  `;


  /* =====================================================
     SELECCIÓN DE ARTÍCULOS
     ===================================================== */

  document
    .querySelectorAll(
      '[data-look-select]'
    )
    .forEach(card => {

      card.addEventListener(
        'click',
        () => {

          selectLookItem(
            card.dataset.lookSelect,
            card.dataset.lookSlot
          );

        }
      );

    });


  /* =====================================================
     LIMPIAR LOOK
     ===================================================== */

  $('#clear-look')
    ?.addEventListener(
      'click',
      () => {

        state.look = {
          top: null,
          bottom: null,
          onePiece: null,
          shoes: null,
          bag: null,
          accessories: []
        };

        renderLooks();

      }
    );


  /* =====================================================
     COMPLETAR LOOK
     ===================================================== */

  $('#complete-look')
    ?.addEventListener(
      'click',
      saveLook
    );

}


/* =========================================================
   MOSTRAR LOOKS GUARDADOS
   ========================================================= */

function renderSavedLooks() {

  if (
    !Array.isArray(state.looks) ||
    state.looks.length === 0
  ) {

    return `

      <div class="panel saved-looks-panel">

        <div class="look-section-title">

          <strong>
            MIS LOOKS GUARDADOS
          </strong>

          <span>
            Todavía no tienes looks guardados.
          </span>

        </div>

      </div>

    `;
  }


  return `

    <div class="
      panel
      saved-looks-panel
    ">

      <div class="look-section-title">

        <strong>
          MIS LOOKS GUARDADOS
        </strong>

        <span>
          Aquí encontrarás las combinaciones
          que hayas guardado.
        </span>

      </div>

      <div class="saved-looks-grid">

        ${state.looks
          .map(
            look =>
              renderSavedLookCard(
                look
              )
          )
          .join('')}

      </div>

    </div>

  `;
}


/* =========================================================
   TARJETA DE LOOK GUARDADO
   ========================================================= */

function renderSavedLookCard(look) {

  const selectedItems =
    getItemsFromLook(look);


  return `

    <div
      class="saved-look-card">

      <div class="saved-look-header">

        <div>

          <div class="saved-look-name">

            ${esc(
              look.name ||
              'LOOK SIN NOMBRE'
            )}

          </div>

          ${
            look.date
              ? `
                <div class="saved-look-date">
                  ${esc(
                    formatDate(
                      look.date
                    )
                  )}
                </div>
              `
              : ''
          }

        </div>

      </div>


      <div class="saved-look-items">

        ${
          selectedItems.length

          ? selectedItems
              .map(
                item =>
                  renderSavedLookItem(
                    item
                  )
              )
              .join('')

          : `
              <div class="empty">
                Artículos no disponibles.
              </div>
            `
        }

      </div>


      <div class="saved-look-actions">

        <button
          class="btn secondary"
          data-load-look="${esc(
            look.id
          )}">

          USAR LOOK

        </button>

        <button
          class="btn-delete"
          data-delete-look="${esc(
            look.id
          )}">

          ELIMINAR

        </button>

      </div>

    </div>

  `;
}


/* =========================================================
   ARTÍCULO DE LOOK GUARDADO
   ========================================================= */

function renderSavedLookItem(item) {

  const imageUrl =
    getImageUrl(item);

  return `

    <div class="saved-look-item">

      ${
        imageUrl

        ? `

          <img
            src="${esc(imageUrl)}"
            alt="${esc(
              item.name ||
              'Artículo'
            )}"
            loading="lazy"
          >

        `

        : `

          <div
            class="item-image-empty">

            Sin imagen

          </div>

        `
      }

      <span>
        ${esc(
          item.name ||
          'Artículo'
        )}
      </span>

    </div>

  `;
}


/* =========================================================
   OBTENER ARTÍCULOS DE UN LOOK
   ========================================================= */

function getItemsFromLook(look) {

  if (!look) {
    return [];
  }


  const result = [];

  const addItemById = id => {

    if (!id) {
      return;
    }

    const item =
      state.items.find(
        current =>
          String(current.id) ===
          String(id)
      );

    if (item) {
      result.push(item);
    }

  };


  addItemById(
    look.top
  );

  addItemById(
    look.bottom
  );

  addItemById(
    look.onePiece
  );

  addItemById(
    look.shoes
  );

  addItemById(
    look.bag
  );


  const accessories =
    parseAccessories(
      look.accessories
    );

  accessories.forEach(
    id =>
      addItemById(id)
  );


  return result;
}


/* =========================================================
   ACCESORIOS
   ========================================================= */

function parseAccessories(value) {

  if (Array.isArray(value)) {

    return value
      .map(item => {

        if (
          typeof item ===
          'object'
        ) {
          return item.id;
        }

        return item;

      })
      .filter(Boolean);
  }


  if (
    typeof value ===
    'string'
  ) {

    const clean =
      value.trim();

    if (!clean) {
      return [];
    }


    try {

      const parsed =
        JSON.parse(clean);

      if (Array.isArray(parsed)) {

        return parsed
          .map(item => {

            if (
              typeof item ===
              'object'
            ) {
              return item.id;
            }

            return item;

          })
          .filter(Boolean);
      }

    } catch {
      // Continuar con formato separado por coma
    }


    return clean
      .split(',')
      .map(
        value =>
          value.trim()
      )
      .filter(Boolean);
  }


  return [];
}


/* =========================================================
   FECHA
   ========================================================= */

function formatDate(value) {

  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    'es-CO',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );
}


/* =========================================================
   SELECTOR DE ARTÍCULOS PARA LOOK
   ========================================================= */

function renderLookSelector(
  items,
  slot,
  multiple = false
) {

  if (
    !Array.isArray(items) ||
    !items.length
  ) {

    return `

      <div class="empty">

        No tienes artículos
        disponibles en esta categoría.

      </div>

    `;
  }


  return `

    <div class="look-items-grid">

      ${items
        .map(item => {

          const imageUrl =
            getImageUrl(item);

          let selected =
            false;


          if (multiple) {

            selected =
              state.look.accessories
                .some(
                  selectedItem =>
                    String(
                      selectedItem.id
                    ) ===
                    String(item.id)
                );

          } else {

            selected =
              state.look[slot] &&
              String(
                state.look[slot].id
              ) ===
              String(item.id);

          }


          return `

            <div
              class="
                look-item
                ${selected
                  ? 'selected'
                  : ''}
              "
              data-look-select="${esc(
                item.id
              )}"
              data-look-slot="${esc(
                slot
              )}">

              <div class="look-item-image">

                ${
                  imageUrl

                  ? `

                    <img
                      src="${esc(
                        imageUrl
                      )}"
                      alt="${esc(
                        item.name ||
                        'Artículo'
                      )}"
                      loading="lazy"
                    >

                  `

                  : `

                    <div
                      class="
                        item-image-empty
                      ">

                      Sin imagen

                    </div>

                  `
                }


                ${
                  selected

                  ? `

                    <div
                      class="
                        look-selected
                      ">

                      ✔️

                    </div>

                  `

                  : ''

                }

              </div>


              <div class="look-item-info">

                <strong>

                  ${esc(
                    item.name ||
                    'Sin nombre'
                  )}

                </strong>

                <span>

                  ${esc(
                    item.color ||
                    ''
                  )}

                </span>

              </div>

            </div>

          `;

        })
        .join('')}

    </div>

  `;
}


/* =========================================================
   SELECCIONAR ARTÍCULO PARA LOOK
   ========================================================= */

function selectLookItem(
  id,
  slot
) {

  const item =
    state.items.find(
      currentItem =>
        String(currentItem.id) ===
        String(id)
    );

  if (!item) {
    return;
  }


  /* =====================================================
     ACCESORIOS - MÚLTIPLES
     ===================================================== */

  if (
    slot === 'accessories'
  ) {

    const exists =
      state.look.accessories
        .some(
          selectedItem =>
            String(
              selectedItem.id
            ) ===
            String(item.id)
        );


    if (exists) {

      state.look.accessories =
        state.look.accessories.filter(
          selectedItem =>
            String(
              selectedItem.id
            ) !==
            String(item.id)
        );

    } else {

      state.look.accessories.push(
        item
      );

    }


    renderLooks();

    return;
  }


  /* =====================================================
     VESTIDO
     ===================================================== */

  if (
    slot === 'onePiece'
  ) {

    const alreadySelected =
      state.look.onePiece &&
      String(
        state.look.onePiece.id
      ) ===
      String(item.id);


    state.look.onePiece =
      alreadySelected
        ? null
        : item;


    /*
      Un vestido no puede combinarse
      con parte superior e inferior.
    */

    if (
      state.look.onePiece
    ) {

      state.look.top =
        null;

      state.look.bottom =
        null;

    }


    renderLooks();

    return;
  }


  /* =====================================================
     SUPERIOR / INFERIOR / ZAPATOS / BOLSO
     ===================================================== */

  const alreadySelected =
    state.look[slot] &&
    String(
      state.look[slot].id
    ) ===
    String(item.id);


  state.look[slot] =
    alreadySelected
      ? null
      : item;


  /*
    Si se selecciona parte superior
    o inferior, se elimina vestido.
  */

  if (
    state.look.top ||
    state.look.bottom
  ) {

    state.look.onePiece =
      null;

  }


  renderLooks();

}


/* =========================================================
   VISTA PREVIA DEL LOOK
   ========================================================= */

function renderLookPreview() {

  const selected = [];


  if (state.look.top) {
    selected.push(
      state.look.top
    );
  }

  if (state.look.bottom) {
    selected.push(
      state.look.bottom
    );
  }

  if (state.look.onePiece) {
    selected.push(
      state.look.onePiece
    );
  }

  if (state.look.shoes) {
    selected.push(
      state.look.shoes
    );
  }

  if (state.look.bag) {
    selected.push(
      state.look.bag
    );
  }

  if (
    Array.isArray(
      state.look.accessories
    )
  ) {

    selected.push(
      ...state.look.accessories
    );

  }


  if (!selected.length) {

    return `

      <div class="look-empty">

        <div class="look-empty-icon">
          +
        </div>

        <strong>
          TU LOOK ESTÁ VACÍO
        </strong>

        <span>
          Selecciona artículos
          para comenzar.
        </span>

      </div>

    `;
  }


  return `

    <div class="selected-look-grid">

      ${selected
        .map(item => {

          const imageUrl =
            getImageUrl(item);

          return `

            <div
              class="selected-look-item">

              ${
                imageUrl

                ? `

                  <img
                    src="${esc(
                      imageUrl
                    )}"
                    alt="${esc(
                      item.name ||
                      'Artículo'
                    )}"
                  >

                `

                : `

                  <div
                    class="
                      item-image-empty
                    ">

                    Sin imagen

                  </div>

                `
              }

              <span>

                ${esc(
                  item.name ||
                  'Artículo'
                )}

              </span>

            </div>

          `;

        })
        .join('')}

    </div>

  `;
}


/* =========================================================
   GUARDAR LOOK
   ========================================================= */

async function saveLook() {

  const top =
    state.look.top
      ? state.look.top.id
      : null;

    const jacket =
    state.look.jacket
      ? state.look.jacket.id
      : null;

  const bottom =
    state.look.bottom
      ? state.look.bottom.id
      : null;

  const onePiece =
    state.look.onePiece
      ? state.look.onePiece.id
      : null;

  const shoes =
    state.look.shoes
      ? state.look.shoes.id
      : null;

  const bag =
    state.look.bag
      ? state.look.bag.id
      : null;

  const accessories =
    state.look.accessories.map(
      item => item.id
    );


  /* =====================================================
     VALIDAR
     ===================================================== */

  if (
    !top &&
    !jacket &&
    !bottom &&
    !onePiece &&
    !shoes &&
    !bag &&
    accessories.length === 0
  ) {

    toast(
      'Selecciona al menos un artículo para crear el look.'
    );

    return;
  }


  /* =====================================================
     NOMBRE
     ===================================================== */

  const name =
    prompt(
      '¿Cómo quieres llamar este look?'
    );

  if (name === null) {
    return;
  }

  const cleanName =
    name.trim();

  if (!cleanName) {

    toast(
      'Escribe un nombre para el look.'
    );

    return;
  }


  const button =
    $('#complete-look');

  if (button) {

    button.disabled =
      true;

    button.textContent =
      'GUARDANDO...';

  }


  try {

    const response =
      await fetch(
        '/api/looks',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              name: cleanName,
              top,
              jacket,
              bottom,
              onePiece,
              shoes,
              bag,
              accessories
            })
        }
      );


    const text =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(text);
    } catch {
      throw new Error(
        'El servidor devolvió una respuesta no válida.'
      );
    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        'No se pudo guardar el look.'
      );
    }


    if (
      !data.look ||
      !data.look.id
    ) {

      throw new Error(
        'El servidor no devolvió correctamente el look guardado.'
      );
    }


    if (
      !Array.isArray(
        state.looks
      )
    ) {

      state.looks = [];

    }


    state.looks.unshift(
      data.look
    );


    toast(
      'Look guardado correctamente.'
    );


    /* =================================================
       LIMPIAR CREADOR
       ================================================= */

    state.look = {
      top: null,
      jacket: null,
      bottom: null,
      onePiece: null,
      shoes: null,
      bag: null,
      accessories: []
    };


    renderLooks();


  } catch (error) {

    console.error(
      'Error guardando look:',
      error
    );

    toast(
      error.message ||
      'No se pudo guardar el look.'
    );


    if (button) {

      button.disabled =
        false;

      button.textContent =
        'COMPLETAR LOOK';

    }

  }

}


/* =========================================================
   USAR LOOK GUARDADO
   ========================================================= */

function loadSavedLook(id) {

  const look =
    state.looks.find(
      current =>
        String(current.id) ===
        String(id)
    );

  if (!look) {

    toast(
      'No se encontró el look.'
    );

    return;
  }


  const findItem = itemId => {

    if (!itemId) {
      return null;
    }

    return state.items.find(
      item =>
        String(item.id) ===
        String(itemId)
    ) || null;

  };


  state.look = {

    top:
      findItem(
        look.top
      ),

    bottom:
      findItem(
        look.bottom
      ),

    onePiece:
      findItem(
        look.onePiece
      ),

    shoes:
      findItem(
        look.shoes
      ),

    bag:
      findItem(
        look.bag
      ),

    accessories:
      parseAccessories(
        look.accessories
      )
        .map(
          itemId =>
            findItem(itemId)
        )
        .filter(Boolean)

  };


  toast(
    'Look cargado en el creador.'
  );

  renderLooks();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


/* =========================================================
   ELIMINAR LOOK
   ========================================================= */

async function deleteLook(id) {

  const look =
    state.looks.find(
      current =>
        String(current.id) ===
        String(id)
    );

  if (!look) {

    toast(
      'No se encontró el look.'
    );

    return;
  }


  const confirmed =
    confirm(
      `¿Quieres eliminar el look "${look.name}"?`
    );

  if (!confirmed) {
    return;
  }


  try {

    const response =
      await fetch(
        `/api/looks/${encodeURIComponent(id)}`,
        {
          method: 'DELETE'
        }
      );


    const text =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(text);
    } catch {
      throw new Error(
        'El servidor devolvió una respuesta no válida.'
      );
    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        'No se pudo eliminar el look.'
      );
    }


    state.looks =
      state.looks.filter(
        current =>
          String(current.id) !==
          String(id)
      );


    toast(
      'Look eliminado.'
    );

    renderLooks();

  } catch (error) {

    console.error(
      'Error eliminando look:',
      error
    );

    toast(
      error.message ||
      'No se pudo eliminar el look.'
    );

  }

}


/* =========================================================
   EVENTOS DE LOOKS
   ========================================================= */

document.addEventListener(
  'click',
  event => {

    const loadButton =
      event.target.closest(
        '[data-load-look]'
      );

    if (loadButton) {

      event.stopPropagation();

      loadSavedLook(
        loadButton.dataset.loadLook
      );

      return;
    }


    const deleteButton =
      event.target.closest(
        '[data-delete-look]'
      );

    if (deleteButton) {

      event.stopPropagation();

      deleteLook(
        deleteButton.dataset.deleteLook
      );

      return;
    }

  }
);


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function renderConfig() {

  $('#config').innerHTML = `

    <h1>
      CONFIGURACIÓN
    </h1>

    <p class="subtitle">
      Configuración básica
      de MI CLOSET DIGITAL.
    </p>

    <div class="panel">

      <b>
        Almacenamiento
      </b>

      <p class="small-note">

        Tus artículos se almacenan
        en Google Sheets y las
        fotografías en Google Drive.

      </p>

    </div>

  `;
}

/* =========================================================
   ASESORÍA DE IMAGEN
   ========================================================= */

function renderAsesoria() {

  $('#asesoria').innerHTML = `

    <h1>
      ASESORÍA DE IMAGEN
    </h1>

    <p class="subtitle">
      Tu asesora de imagen personalizada.
    </p>

    <div class="panel">

      <div class="look-section-title">

        <strong>
          MI PERFIL
        </strong>

        <span>
          Información que la IA utilizará
          para personalizar tus recomendaciones.
        </span>

      </div>

      <div class="grid">

        <div class="stat">
          <div class="label">ESTATURA</div>
          <strong>151 cm</strong>
        </div>

        <div class="stat">
          <div class="label">BUSTO</div>
          <strong>95 cm</strong>
        </div>

        <div class="stat">
          <div class="label">CINTURA</div>
          <strong>80 cm</strong>
        </div>

        <div class="stat">
          <div class="label">CADERA</div>
          <strong>95 cm</strong>
        </div>

      </div>

      <p>
        <b>Preferencias de estilo:</b>
        elegante, femenino y cómodo.
      </p>

      <p>
        <b>Objetivos:</b>
        verte más alta, alargar visualmente
        las piernas, definir la cintura,
        equilibrar los hombros y estilizar
        la silueta.
      </p>

      <p>
        <b>Preferencias de mangas:</b>
        ¾ y largas.
      </p>

      <p>
        <b>Colores favoritos:</b>
        negro, vino tinto y beige.
      </p>

      <p>
        <b>Colores a evitar:</b>
        amarillo y fucsia.
      </p>

      <p>
        <b>Estilo de asesoría:</b>
        creativo, respetando tu figura y estilo.
      </p>

    </div>

    <div class="panel">

      <div class="look-section-title">

        <strong>
          ¿QUÉ QUIERES CONSULTAR?
        </strong>

      </div>

    <div>

  <div style="display:flex; flex-direction:column; gap:16px;">

  <label
    for="consulta-asesoria"
    style="font-weight:700;"
  >
    ESCRIBE TU CONSULTA
  </label>

  <textarea
    id="consulta-asesoria"
    rows="6"
    style="width:100%; box-sizing:border-box; resize:vertical;"
    placeholder="Ejemplo: Necesito un look elegante para trabajar el miércoles, que me haga ver más alta y disimule mis brazos."
  ></textarea>

  <button
    id="btn-asesorar"
    class="btn"
    type="button"
    style="align-self:flex-start;"
  >
    ASESORARME
  </button>

</div>

<div
  id="respuesta-asesoria"
  style="margin-top:24px;"
></div>

</div>

    </div>

  `;

  $('#btn-asesorar').addEventListener(
    'click',
    async () => {

      const consulta =
        $('#consulta-asesoria').value.trim();

      const respuesta =
        $('#respuesta-asesoria');

      if (!consulta) {

        respuesta.innerHTML =
          '<p>Escribe primero tu consulta.</p>';

        return;
      }

      respuesta.innerHTML =
  '<p>Analizando tu consulta...</p>';

try {

  const response =
    await fetch('/api/asesoria', {

      method: 'POST',

      headers: {
        'Content-Type':
          'application/json'
      },

      body:
        JSON.stringify({
          consulta
        })

    });


  const data =
    await response.json();


  if (!response.ok || !data.ok) {

    throw new Error(
      data.error ||
      'No fue posible obtener la asesoría.'
    );

  }


  const respuestaFormateada =
  data.answer
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<strong>$1</strong>')
    .replace(/^## (.+)$/gm, '<strong>$1</strong>')
    .replace(/^\- (.+)$/gm, '\u2022 $1')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

respuesta.innerHTML = `
  <div style="
    position:relative;
    line-height:1.7;
    font-size:15px;
    padding-top:45px;
    user-select:text;
    -webkit-user-select:text;
  ">

    <button
      id="btn-copiar-asesoria"
      type="button"
      title="Copiar respuesta"
      style="
        position:absolute;
        top:0;
        right:0;
        width:38px;
        height:38px;
        border:0;
        border-radius:10px;
        background:#222;
        color:white;
        cursor:pointer;
        display:flex;
        align-items:center;
        justify-content:center;
      "
    >
      💡
    </button>

    ${respuestaFormateada}

  </div>
`;

document
  .getElementById('btn-copiar-asesoria')
  .addEventListener('click', async () => {

    await navigator.clipboard.writeText(
      data.answer
    );

    const boton =
      document.getElementById(
        'btn-copiar-asesoria'
      );

    boton.innerHTML = '✔️';

    setTimeout(() => {

      boton.innerHTML = `
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="9" y="9" width="11" height="11" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;

    }, 1500);

  });

} catch (error) {

  console.error(
    'Error en asesoría:',
    error
  );

  respuesta.innerHTML = `

    <p>
      No fue posible generar la asesoría.
    </p>

    <p>
      ${error.message}
    </p>

  `;
  }

  }

);
}

/* =========================================================
   INICIO DE LA APLICACIÓN
   ========================================================= */

injectDetailStyles();

loadItems();

loadLooks();


/* =========================================================
   SERVICE WORKER / PWA
   ========================================================= */

if (
  'serviceWorker' in navigator
) {

  window.addEventListener(
    'load',
    () => {

      navigator.serviceWorker
        .register(
          '/service-worker.js'
        )
        .then(
          () => {

            console.log(
              'Service Worker registrado correctamente.'
            );

          }
        )
        .catch(
          error => {

            console.error(
              'Error al registrar Service Worker:',
              error
            );

          }
        );

    }
  );

}
