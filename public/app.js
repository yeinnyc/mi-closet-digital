const state = {
  items: [],
  view: 'home',
  filter: 'Todas',
  search: ''
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

const $ = (s) => document.querySelector(s);

const esc = (v = '') =>
  String(v).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));


/* =========================================================
   CARGAR ARTÍCULOS
========================================================= */

async function loadItems() {
  try {
    const r = await fetch('/api/items');
    state.items = await r.json();
    render();
  } catch (error) {
    console.error(error);
    toast('No se pudieron cargar los artículos.');
  }
}


/* =========================================================
   CAMBIAR DE VISTA
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
   NAVEGACIÓN
========================================================= */

document.addEventListener('click', e => {

  const button = e.target.closest('[data-view]');

  if (!button) return;

  setView(
    button.dataset.view,
    button.dataset.filter
  );
});


/* =========================================================
   ELIMINAR ARTÍCULO
========================================================= */

document.addEventListener('click', e => {

  const button = e.target.closest('[data-delete]');

  if (!button) return;

  const id = button.dataset.delete;

  deleteItem(id);
});


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function render() {

  ['home', 'ropa', 'add', 'looks', 'config'].forEach(id => {

    const section = $('#' + id);

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

    prendas: state.items.filter(
      i => !['Zapatos', 'Bolsos', 'Accesorios'].includes(i.category)
    ).length,

    zapatos: state.items.filter(
      i => i.category === 'Zapatos'
    ).length,

    bolsos: state.items.filter(
      i => i.category === 'Bolsos'
    ).length,

    accesorios: state.items.filter(
      i => i.category === 'Accesorios'
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

  const filtered = state.items.filter(item => {

    const categoryOk =
      state.filter === 'Todas' ||
      item.category === state.filter;

    const q =
      state.search.toLowerCase().trim();

    const text =
      `${item.name} ${item.category} ${item.color} ${item.description}`
        .toLowerCase();

    return categoryOk &&
      (!q || text.includes(q));
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
          class="filter ${state.filter === category ? 'active' : ''}"
          data-cat="${esc(category)}">
          ${esc(category)}
        </button>

      `).join('')}

    </div>


    ${renderItemGrid(filtered)}

  `;


  const search = $('#search');

  if (search) {

    search.addEventListener('input', e => {

      state.search = e.target.value;

      renderRopa();

    });

  }


  document
    .querySelectorAll('[data-cat]')
    .forEach(button => {

      button.addEventListener('click', () => {

        state.filter =
          button.dataset.cat;

        renderRopa();

      });

    });
}


/* =========================================================
   TARJETAS DE ARTÍCULOS
========================================================= */

function renderItemGrid(items) {

  if (!items.length) {

    return `
      <div class="empty">
        Aún no tienes artículos guardados.
      </div>
    `;

  }


  return `

    <div class="items-grid">

      ${items.map(item => `

        <article class="item-card">

          <img
            src="${esc(item.image)}"
            alt="${esc(item.name)}"
          >

          <div class="item-info">

            <div class="item-name">
              ${esc(item.name)}
            </div>

            <div class="item-meta">
              ${esc(item.category)}
              ·
              ${esc(item.color)}
            </div>

            <button
              class="btn-delete"
              data-delete="${esc(item.id)}">
              ELIMINAR
            </button>

          </div>

        </article>

      `).join('')}

    </div>

  `;
}


/* =========================================================
   ELIMINAR ARTÍCULO
========================================================= */

async function deleteItem(id) {

  const item = state.items.find(
    item => item.id === id
  );

  if (!item) {

    toast('No se encontró el artículo.');

    return;
  }


  const confirmed = confirm(
    `¿Quieres eliminar "${item.name}"?`
  );


  if (!confirmed) {
    return;
  }


  try {

    const response = await fetch(
      `/api/items/${id}`,
      {
        method: 'DELETE'
      }
    );


    const data = await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        'No se pudo eliminar el artículo.'
      );

    }


    state.items =
      state.items.filter(
        item => item.id !== id
      );


    toast('Artículo eliminado.');


    render();

  } catch (error) {

    console.error(error);

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
                .filter(c => c !== 'Todas')
                .map(c =>
                  `<option value="${esc(c)}">${esc(c)}</option>`
                )
                .join('')}

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


  const dropzone = $('#dropzone');

  const fileInput = $('#file');


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


  $('#save').addEventListener(
    'click',
    saveItem
  );
}


/* =========================================================
   CARGAR FOTO
========================================================= */

function analyze(image) {

  const preview = $('#preview');


  preview.src =
    URL.createObjectURL(image);

  preview.style.display =
    'block';


  $('.drop-content').style.display =
    'none';


  $('#name').value = '';

  $('#category').value = 'Busos';

  $('#color').value = '';

  $('#description').value = '';


  $('#status').textContent =
    'Foto cargada. Completa los datos del artículo y guárdalo.';


  $('#save').disabled = false;
}


/* =========================================================
   GUARDAR ARTÍCULO
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


    state.items.unshift(data);


    state.filter =
      'Todas';

    state.search =
      '';


    toast(
      'Artículo guardado.'
    );


    setTimeout(() => {

      setView('ropa');

    }, 500);


  } catch (error) {

    console.error(error);

    toast(
      error.message ||
      'No se pudo guardar.'
    );


    saveButton.disabled =
      false;

    saveButton.textContent =
      'GUARDAR ARTÍCULO';

  }
}


/* =========================================================
   MIS LOOKS
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

      <b>Versión inicial</b>

      <p class="small-note">
        Los artículos se guardan localmente en esta aplicación.
      </p>

    </div>

  `;
}


/* =========================================================
   MENSAJE
========================================================= */

function toast(msg) {

  const t =
    $('#toast');


  t.textContent =
    msg;


  t.classList.add(
    'show'
  );


  setTimeout(
    () => t.classList.remove('show'),
    2200
  );
}


/* =========================================================
   INICIAR APLICACIÓN
========================================================= */

loadItems();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => {
        console.log('Service Worker registrado correctamente.');
      })
      .catch(error => {
        console.error('Error al registrar Service Worker:', error);
      });
  });
}