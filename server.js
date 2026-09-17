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

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    cb(
      null,
      allowed.includes(file.mimetype)
    );
  }
});


/* =========================================================
   CONFIGURACIÓN EXPRESS
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
   VALIDAR CONEXIÓN CON GOOGLE
   ========================================================= */

function validateGoogleApi() {

  if (!GOOGLE_APPS_SCRIPT_URL) {

    throw new Error(
      'No está configurada la variable GOOGLE_APPS_SCRIPT_URL en Render.'
    );
  }
}


/* =========================================================
   LLAMAR GOOGLE APPS SCRIPT
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


  const text =
    await response.text();


  let result;

  try {

    result =
      JSON.parse(text);

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
   OBTENER ARTÍCULOS DESDE GOOGLE SHEETS
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
   GUARDAR ARTÍCULO
   ========================================================= */

app.post(
  '/api/items',
  upload.single('image'),

  async (req, res) => {

    try {

      /* ---------------------------------------------------
         VALIDAR FOTO
         --------------------------------------------------- */

      if (!req.file) {

        return res.status(400).json({

          ok: false,

          error:
            'La foto es obligatoria.'
        });
      }


      /* ---------------------------------------------------
         DATOS DEL FORMULARIO
         --------------------------------------------------- */

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


      /* ---------------------------------------------------
         CONVERTIR FOTO A BASE64
         --------------------------------------------------- */

      const imageBase64 =
        req.file.buffer.toString(
          'base64'
        );


      /* ---------------------------------------------------
         ENVIAR A GOOGLE
         --------------------------------------------------- */

      const result =
        await callGoogleApi({

          action: 'create',

          name:
            name.trim(),

          category:
            category.trim(),

          color:
            color.trim(),

          description:
            (description || '').trim(),

          imageBase64:
            imageBase64,

          imageMimeType:
            req.file.mimetype
        });


      /* ---------------------------------------------------
         RESPONDER A LA APLICACIÓN
         --------------------------------------------------- */

      res.status(201).json({

        ok: true,

        item:
          result.item
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
   RUTA DE PRUEBA
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

        google:
          result
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
   SERVIR LA APLICACIÓN
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