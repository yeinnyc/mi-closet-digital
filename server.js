import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_APPS_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL;


/* =========================================================
   CARPETAS
========================================================= */

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(UPLOADS_DIR, { recursive: true });


/* =========================================================
   MULTER
========================================================= */

const upload = multer({

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 8 * 1024 * 1024
  },

  fileFilter: (_req, file, cb) => {

    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'El archivo seleccionado no es una imagen válida.'
        )
      );
    }

  }

});


/* =========================================================
   EXPRESS
========================================================= */

app.use(
  express.json({
    limit: '2mb'
  })
);

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);


/* =========================================================
   VALIDAR GOOGLE APPS SCRIPT
========================================================= */

function validateGoogleApi() {

  if (!GOOGLE_APPS_SCRIPT_URL) {

    throw new Error(
      'No está configurada la variable GOOGLE_APPS_SCRIPT_URL en Render.'
    );

  }

}


/* =========================================================
   COMUNICACIÓN CON GOOGLE APPS SCRIPT
========================================================= */

async function callGoogleApi(data) {

  validateGoogleApi();

  const response = await fetch(
    GOOGLE_APPS_SCRIPT_URL,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(data)

    }
  );


  const text = await response.text();

  let result;


  try {

    result = JSON.parse(text);

  } catch {

    throw new Error(
      'Google Apps Script devolvió una respuesta no válida.'
    );

  }


  if (!response.ok) {

    throw new Error(
      result.error ||
      'Error al comunicarse con Google Apps Script.'
    );

  }


  if (result.ok === false) {

    throw new Error(
      result.error ||
      'Google Apps Script rechazó la solicitud.'
    );

  }


  return result;

}


/* =========================================================
   GET /api/items
   OBTENER TODOS LOS ARTÍCULOS
========================================================= */

app.get(
  '/api/items',
  async (_req, res) => {

    try {

      const result =
        await callGoogleApi({
          action: 'list'
        });


      res.json({

        ok: true,

        items: result.items || []

      });

    } catch (error) {

      console.error(
        'Error obteniendo artículos:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudieron cargar los artículos.'

      });

    }

  }
);


/* =========================================================
   POST /api/items
   CREAR ARTÍCULO
========================================================= */

app.post(
  '/api/items',
  upload.single('image'),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          ok: false,

          error: 'La foto es obligatoria.'

        });

      }


      const {
        name,
        category,
        color,
        description
      } = req.body;


      if (
        !name ||
        !category ||
        !color
      ) {

        return res.status(400).json({

          ok: false,

          error:
            'Nombre, categoría y color son obligatorios.'

        });

      }


      const imageBase64 =
        req.file.buffer.toString('base64');


      const result =
        await callGoogleApi({

          action: 'create',

          name: name.trim(),

          category: category.trim(),

          color: color.trim(),

          description:
            (description || '').trim(),

          imageBase64:

            imageBase64,

          imageMimeType:

            req.file.mimetype

        });


      res.status(201).json({

        ok: true,

        item: result.item

      });


    } catch (error) {

      console.error(
        'Error guardando artículo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo guardar el artículo.'

      });

    }

  }
);


/* =========================================================
   POST /api/items/update
   ACTUALIZAR ARTÍCULO
========================================================= */

app.post(
  '/api/items/update',
  upload.single('image'),
  async (req, res) => {

    try {

      const {
        id,
        name,
        category,
        color,
        description
      } = req.body;


      if (!id) {

        return res.status(400).json({

          ok: false,

          error:
            'Falta el ID del artículo.'

        });

      }


      if (!name || !category || !color) {

        return res.status(400).json({

          ok: false,

          error:
            'Nombre, categoría y color son obligatorios.'

        });

      }


      const data = {

        action: 'update',

        id: id.trim(),

        name: name.trim(),

        category: category.trim(),

        color: color.trim(),

        description:
          (description || '').trim()

      };


      /*
       * La imagen es opcional al editar.
       *
       * Si el usuario seleccionó una nueva imagen,
       * la enviamos también a Google Apps Script.
       */

      if (req.file) {

        data.imageBase64 =
          req.file.buffer.toString('base64');

        data.imageMimeType =
          req.file.mimetype;

      }


      const result =
        await callGoogleApi(data);


      res.json({

        ok: true,

        item: result.item

      });


    } catch (error) {

      console.error(
        'Error actualizando artículo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo actualizar el artículo.'

      });

    }

  }
);


/* =========================================================
   DELETE /api/items/:id
   ELIMINAR ARTÍCULO
========================================================= */

app.delete(
  '/api/items/:id',
  async (req, res) => {

    try {

      const id =
        req.params.id;


      if (!id) {

        return res.status(400).json({

          ok: false,

          error:
            'Falta el ID del artículo.'

        });

      }


      const result =
        await callGoogleApi({

          action: 'delete',

          id: id

        });


      res.json({

        ok: true,

        message:
          result.message ||
          'Artículo eliminado.'

      });


    } catch (error) {

      console.error(
        'Error eliminando artículo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo eliminar el artículo.'

      });

    }

  }
);


/* =========================================================
   GET /api/looks
   OBTENER TODOS LOS LOOKS
========================================================= */

app.get(
  '/api/looks',
  async (_req, res) => {

    try {

      const result =
        await callGoogleApi({
          action: 'listLooks'
        });


      res.json({

        ok: true,

        looks: result.looks || []

      });

    } catch (error) {

      console.error(
        'Error obteniendo looks:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudieron cargar los looks.'

      });

    }

  }
);


/* =========================================================
   POST /api/looks
   CREAR LOOK
========================================================= */

app.post(
  '/api/looks',
  async (req, res) => {

    try {

      const {
        name,
        top,
        bottom,
        onePiece,
        shoes,
        bag,
        accessories
      } = req.body;


      if (!name || !name.trim()) {

        return res.status(400).json({

          ok: false,

          error:
            'El nombre del look es obligatorio.'

        });

      }


      const result =
        await callGoogleApi({

          action: 'createLook',

          name:
            name.trim(),

          top:
            top || '',

          bottom:
            bottom || '',

          onePiece:
            onePiece || '',

          shoes:
            shoes || '',

          bag:
            bag || '',

          accessories:
            Array.isArray(accessories)
              ? accessories
              : []

        });


      res.status(201).json({

        ok: true,

        look: result.look

      });


    } catch (error) {

      console.error(
        'Error creando look:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo crear el look.'

      });

    }

  }
);


/* =========================================================
   POST /api/looks/update
   ACTUALIZAR LOOK
========================================================= */

app.post(
  '/api/looks/update',
  async (req, res) => {

    try {

      const {
        id,
        name,
        top,
        bottom,
        onePiece,
        shoes,
        bag,
        accessories
      } = req.body;


      if (!id) {

        return res.status(400).json({

          ok: false,

          error:
            'Falta el ID del look.'

        });

      }


      if (!name || !name.trim()) {

        return res.status(400).json({

          ok: false,

          error:
            'El nombre del look es obligatorio.'

        });

      }


      const result =
        await callGoogleApi({

          action: 'updateLook',

          id:
            id.trim(),

          name:
            name.trim(),

          top:
            top || '',

          bottom:
            bottom || '',

          onePiece:
            onePiece || '',

          shoes:
            shoes || '',

          bag:
            bag || '',

          accessories:
            Array.isArray(accessories)
              ? accessories
              : []

        });


      res.json({

        ok: true,

        look: result.look

      });


    } catch (error) {

      console.error(
        'Error actualizando look:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo actualizar el look.'

      });

    }

  }
);


/* =========================================================
   DELETE /api/looks/:id
   ELIMINAR LOOK
========================================================= */

app.delete(
  '/api/looks/:id',
  async (req, res) => {

    try {

      const id =
        req.params.id;


      if (!id) {

        return res.status(400).json({

          ok: false,

          error:
            'Falta el ID del look.'

        });

      }


      const result =
        await callGoogleApi({

          action: 'deleteLook',

          id: id

        });


      res.json({

        ok: true,

        message:
          result.message ||
          'Look eliminado.'

      });


    } catch (error) {

      console.error(
        'Error eliminando look:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo eliminar el look.'

      });

    }

  }
);


/* =========================================================
   PRUEBA GOOGLE APPS SCRIPT
========================================================= */

app.get(
  '/api/test-google',
  async (_req, res) => {

    try {

      validateGoogleApi();


      const response =
        await fetch(
          GOOGLE_APPS_SCRIPT_URL +
          '?action=ping'
        );


      const result =
        await response.json();


      res.json({

        ok: true,

        google: result

      });


    } catch (error) {

      console.error(
        'Error probando Google:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message

      });

    }

  }
);


/* =========================================================
   MANEJO DE ERRORES
========================================================= */

app.use(
  (error, _req, res, _next) => {

    console.error(
      'Error del servidor:',
      error
    );


    res.status(400).json({

      ok: false,

      error:
        error.message ||
        'Error procesando la solicitud.'

    });

  }
);


/* =========================================================
   RUTA FINAL
========================================================= */

app.use(
  (_req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        'public',
        'index.html'
      )
    );

  }
);


/* =========================================================
   INICIAR SERVIDOR
========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      `MI CLOSET DIGITAL: http://localhost:${PORT}`
    );


    console.log(

      GOOGLE_APPS_SCRIPT_URL

        ? 'Google Apps Script: CONFIGURADO'

        : 'Google Apps Script: NO CONFIGURADO'

    );

  }
);