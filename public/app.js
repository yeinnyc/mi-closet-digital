const state = {
  items: [],
  view: 'home',
  filter: 'Todas',
  search: '',
  selectedId: null
};

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

const $ = selector => document.querySelector(selector);

const esc = (value = '') =>
  String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));

/* =========================================================
   ESTILOS DEL DETALLE Y EDICIÓN
   ========================================================= */

function injectDetailStyles() {
  if ($('#detail-styles')) return;

  const style = document.createElement('style');

  style.id = 'detail-styles';

  style.textContent = `
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

    .item-card {
      cursor: pointer;
    }

    .detail-delete {
      width: 100%;
      margin-top: 10px;
      min-height: 38px;
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
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   CARGAR ARTÍCULOS
   ========================================================= */

async function loadItems() {
  try {
    const response = await fetch('/api/items');

    const data = await response.json();

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

document.addEventListener('click', event => {

  const viewButton =
    event.target.closest('[data-view]');

  if (viewButton) {

    setView(
      viewButton.dataset.view,
      viewButton.dataset.filter
    );

    return;
  }

  const deleteButton =
    event.target.closest('[data-delete]');

  if (deleteButton) {

    event.stopPropagation();

    deleteItem(
      deleteButton.dataset.delete
    );

    return;
  }

  const itemCard =
    event.target.closest('[data-item-id]');

  if (itemCard) {

    openDetail(
      itemCard.dataset.itemId
    );
  }
});

/* =========================================================
   RENDER
   ========================================================= */

function render() {

  [
    'home',
    'ropa',
    'add',
    'looks',
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
        button.dataset.view === state.view &&
        (
          !button.dataset.filter ||
          button.dataset.filter === state.filter
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
          item.category === 'Zapatos'
      ).length,

    bolsos:
      state.items.filter(
        item =>
          item.category === 'Bolsos'
      ).length,

    accesorios:
      state.items.filter(
        item =>
          item.category === 'Accesorios'
      ).length
  };

  $('#home').innerHTML = `

    <h1>MI CLOSET</h1>

    <p class="subtitle">
      Tu armario, organizado y listo para crear nuevos looks.
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
        item.category === state.filter;

      const q =
        state.search
          .toLowerCase()
          .trim();

      const text =
        `${item.name || ''} ${item.category || ''} ${item.color || ''} ${item.description || ''}`
          .toLowerCase();

      return (
        categoryOk &&
        (!q || text.includes(q))
      );
    });

  $('#ropa').innerHTML = `

    <h1>MI ROPA</h1>

    <p class="subtitle">
      Todos tus artículos, organizados en un solo lugar.
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

      ${categories.map(category => `

        <button
          class="filter ${
            state.filter === category
              ? 'active'
              : ''
          }"
          data-cat="${esc(category)}">

          ${esc(category)}

        </button>

      `).join('')}

    </div>

    ${renderItemGrid(filtered)}
  `;

  const search =
    $('#search');

  if (search) {

    search.addEventListener(
      'input',
      event => {

        state.search =
          event.target.value;

        renderRopa();
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
   IMÁGENES
   ========================================================= */

function getImageUrl(item) {

  const originalUrl =
    item?.imageUrl ||
    item?.image ||
    '';

  if (!originalUrl) {
    return '';
  }

  const match =
    String(originalUrl).match(
      /[?&]id=([^&]+)/i
    );

  if (match && match[1]) {

    return (
      'https://drive.google.com/thumbnail?id=' +
      encodeURIComponent(match[1]) +
      '&sz=w1000'
    );
  }

  return originalUrl;
}

/* =========================================================
   TARJETAS
   ========================================================= */

function renderItemGrid(items) {

  if (
    !Array.isArray(items) ||
    !items.length
  ) {

    return `
      <div class="empty">
        Aún no tienes artículos guardados.
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
                    alt="${esc(item.name || 'Artículo')}"
                    loading="lazy"
                  >
                `
                : `
                  <div class="item-image-empty">
                    Sin imagen
                  </div>
                `
            }

            <div class="item-info">

              <div class="item-name">
                ${esc(item.name || '')}
              </div>

              <div class="item-meta">
                ${esc(item.category || '')}
                ·
                ${esc(item.color || '')}
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
   DETALLE
   ========================================================= */

function openDetail(id) {

  const item =
    state.items.find(
      current =>
        String(current.id) === String(id)
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
                  alt="${esc(item.name)}"
                >
              `
              : `
                <div class="detail-no-image">
                  Sin imagen
                </div>
              `
          }

        </div>

        <div class="detail-info">

          <div class="detail-category">
            ${esc(item.category || '')}
          </div>

          <h2 class="detail-title">
            ${esc(item.name || 'Sin nombre')}
          </h2>

          <div class="detail-field">

            <div class="detail-field-label">
              COLOR
            </div>

            <div class="detail-field-value">
              ${esc(item.color || 'Sin especificar')}
            </div>

          </div>

          <div class="detail-field">

            <div class="detail-field-label">
              DESCRIPCIÓN
            </div>

            <div class="detail-field-value detail-description">
              ${esc(item.description || 'Sin descripción.')}
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
            class="btn-delete detail-delete"
            id="detail-delete"
            data-delete="${esc(item.id)}">

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
      () => deleteItem(item.id)
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
   EDITAR
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

      <h2>EDITAR ARTÍCULO</h2>

      <div class="edit-preview">

        ${
          imageUrl
            ? `
              <img
                id="edit-preview-img"
                src="${esc(imageUrl)}"
                alt="${esc(item.name)}"
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
          accept="image/jpeg,image/png,image/webp"
        >

      </div>

      <div class="fields">

        <div class="field">

          <label>NOMBRE</label>

          <input
            id="edit-name"
            value="${esc(item.name || '')}"
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
              .map(category => `

                <option
                  value="${esc(category)}"
                  ${
                    category === item.category
                      ? 'selected'
                      : ''
                  }>

                  ${esc(category)}

                </option>

              `).join('')}

          </select>

        </div>

        <div class="field">

          <label>COLOR</label>

          <input
            id="edit-color"
            value="${esc(item.color || '')}"
          >

        </div>

        <div class="field">

          <label>DESCRIPCIÓN</label>

          <textarea id="edit-description">${esc(item.description || '')}</textarea>

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

        if (!file) return;

        const preview =
          $('#edit-preview-img');

        const newUrl =
          URL.createObjectURL(
            file
          );

        if (preview) {

          preview.src =
            newUrl;

        } else {

          const container =
            document.querySelector(
              '.edit-preview'
            );

          container.innerHTML = `

            <img
              id="edit-preview-img"
              src="${newUrl}"
              alt="Nueva imagen"
            >

          `;
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
    $('#edit-name').value.trim();

  const category =
    $('#edit-category').value;

  const color =
    $('#edit-color').value.trim();

  const description =
    $('#edit-description').value.trim();

  const file =
    $('#edit-file').files[0];


  /* =====================================================
     VALIDACIONES
  ===================================================== */

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


  /* =====================================================
     FORMULARIO
  ===================================================== */

  const formData =
    new FormData();


  /*
    IMPORTANTE:
    El ID identifica qué artículo vamos a modificar.
  */

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


  /*
    La fotografía es opcional al editar.
    Si el usuario selecciona una nueva,
    también se envía.
  */

  if (file) {

    formData.append(
      'image',
      file
    );

  }


  /* =====================================================
     BOTÓN
  ===================================================== */

  const button =
    $('#edit-save');


  button.disabled =
    true;


  button.textContent =
    'GUARDANDO...';


  $('#edit-status').textContent =
    'Guardando cambios...';


  /* =====================================================
     ENVIAR ACTUALIZACIÓN
  ===================================================== */

  try {

    const response =
      await fetch(
        '/api/items/update',
        {
          method: 'POST',
          body: formData
        }
      );


    const data =
      await response.json();


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


    /* =================================================
       ACTUALIZAR EL ARTÍCULO EN MEMORIA
    ================================================= */

    const index =
      state.items.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );


    if (index !== -1) {

      state.items[index] =
        data.item;

    }


    /* =================================================
       CERRAR VENTANA
    ================================================= */

    $('#edit-overlay')?.remove();


    /* =================================================
       MENSAJE
    ================================================= */

    toast(
      'Artículo actualizado correctamente.'
    );


    /* =================================================
       REDIBUJAR APP
    ================================================= */

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


    $('#edit-status').textContent =
      '';

  }

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
    }

    $('#edit-overlay')?.remove();

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

    $('#edit-status').textContent =
      '';
  }
}

/* =========================================================
   ELIMINAR
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

  if (!confirmed) return;

  try {

    const response =
      await fetch(
        `/api/items/${encodeURIComponent(id)}`,
        {
          method: 'DELETE'
        }
      );

    const data =
      await response.json();

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

function renderAdd() {

  $('#add').innerHTML = `

    <h1>AGREGAR ARTÍCULO</h1>

    <p class="subtitle">
      Sube una foto y completa los datos del artículo.
    </p>

    <div class="add-layout">

      <div class="panel">

        <div
          id="dropzone"
          class="dropzone">

          <div class="drop-content">

            <strong>
              SUBIR FOTO
            </strong>

            <span>
              JPG, PNG o WEBP · máximo 8 MB
            </span>

          </div>

          <img
            id="preview"
            alt="Vista previa"
          >

        </div>

        <input
          id="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
        >

        <div
          id="status"
          class="status">
        </div>

      </div>

      <div class="panel">

        <div class="fields">

          <div class="field">

            <label>NOMBRE</label>

            <input
              id="name"
              placeholder="Ej. Buso rojo"
            >

          </div>

          <div class="field">

            <label>CATEGORÍA</label>

            <select id="category">

              ${categories
                .filter(
                  category =>
                    category !== 'Todas'
                )
                .map(category => `

                  <option
                    value="${esc(category)}">

                    ${esc(category)}

                  </option>

                `).join('')}

            </select>

          </div>

          <div class="field">

            <label>COLOR</label>

            <input
              id="color"
              placeholder="Ej. Rojo vinotinto"
            >

          </div>

          <div class="field">

            <label>DESCRIPCIÓN</label>

            <textarea
              id="description"
              placeholder="Descripción del artículo..."
            ></textarea>

          </div>

        </div>

        <div class="actions">

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
          Puedes corregir cualquier dato antes de guardar.
        </p>

      </div>

    </div>
  `;

  const dropzone =
    $('#dropzone');

  const fileInput =
    $('#file');

  dropzone.addEventListener(
    'click',
    () => fileInput.click()
  );

  fileInput.addEventListener(
    'change',
    () => {

      if (
        fileInput.files &&
        fileInput.files[0]
      ) {

        analyze(
          fileInput.files[0]
        );
      }
    }
  );

  $('#save')
    .addEventListener(
      'click',
      saveItem
    );
}

function analyze(image) {

  const preview =
    $('#preview');

  preview.src =
    URL.createObjectURL(
      image
    );

  preview.style.display =
    'block';

  $('.drop-content').style.display =
    'none';

  $('#name').value =
    '';

  $('#category').value =
    'Busos';

  $('#color').value =
    '';

  $('#description').value =
    '';

  $('#status').textContent =
    'Foto cargada. Completa los datos del artículo y guárdalo.';

  $('#save').disabled =
    false;
}

/* =========================================================
   GUARDAR NUEVO ARTÍCULO
   ========================================================= */

async function saveItem() {

  const file =
    $('#file').files[0];

  if (!file) {

    toast(
      'Selecciona una foto.'
    );

    return;
  }

  const name =
    $('#name').value.trim();

  const category =
    $('#category').value;

  const color =
    $('#color').value.trim();

  const description =
    $('#description').value.trim();

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

  const formData =
    new FormData();

  formData.append(
    'image',
    file
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

  const saveButton =
    $('#save');

  saveButton.disabled =
    true;

  saveButton.textContent =
    'GUARDANDO...';

  $('#status').textContent =
    'Guardando en Google Drive y Google Sheets...';

  try {

    const response =
      await fetch(
        '/api/items',
        {
          method: 'POST',
          body: formData
        }
      );

    const data =
      await response.json();

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
        'El servidor no devolvió correctamente el artículo guardado.'
      );
    }

    state.items.unshift(
      data.item
    );

    state.filter =
      'Todas';

    state.search =
      '';

    toast(
      'Artículo guardado correctamente.'
    );

    setTimeout(
      () => {
        setView('ropa');
      },
      500
    );

  } catch (error) {

    console.error(
      'Error guardando artículo:',
      error
    );

    toast(
      error.message ||
      'No se pudo guardar.'
    );

    saveButton.disabled =
      false;

    saveButton.textContent =
      'GUARDAR ARTÍCULO';

    $('#status').textContent =
      '';
  }
}

/* =========================================================
   LOOKS
   ========================================================= */

function renderLooks() {

  $('#looks').innerHTML = `

    <h1>MIS LOOKS</h1>

    <p class="subtitle">
      Aquí construiremos el creador de looks con tus artículos.
    </p>

    <div class="panel look-placeholder">

      <button
        class="btn"
        data-view="ropa">

        VER MI ROPA

      </button>

    </div>
  `;
}

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function renderConfig() {

  $('#config').innerHTML = `

    <h1>CONFIGURACIÓN</h1>

    <p class="subtitle">
      Configuración básica de MI CLOSET DIGITAL.
    </p>

    <div class="panel">

      <b>Almacenamiento</b>

      <p class="small-note">
        Tus artículos se almacenan en Google Sheets y las fotografías en Google Drive.
      </p>

    </div>
  `;
}

/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {

  const element =
    $('#toast');

  element.textContent =
    message;

  element.classList.add(
    'show'
  );

  setTimeout(
    () => {

      element.classList.remove(
        'show'
      );

    },
    2200
  );
}

/* =========================================================
   INICIO
   ========================================================= */

injectDetailStyles();

loadItems();

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
        .then(() => {

          console.log(
            'Service Worker registrado correctamente.'
          );

        })
        .catch(error => {

          console.error(
            'Error al registrar Service Worker:',
            error
          );

        });

    }
  );
}