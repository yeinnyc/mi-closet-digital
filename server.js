import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || 'gpt-5.6-luna';


/* =========================================================
   CARPETAS
========================================================= */

const DATA_DIR =
  path.join(__dirname, 'data');

const UPLOADS_DIR =
  path.join(__dirname, 'uploads');

await fs.mkdir(
  DATA_DIR,
  { recursive: true }
);

await fs.mkdir(
  UPLOADS_DIR,
  { recursive: true }
);


/* =========================================================
   MULTER
========================================================= */

const upload = multer({

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 8 * 1024 * 1024
  },

  fileFilter: (_req, file, cb) => {

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {

      cb(null, true);

    } else {

      cb(
        new Error(
          'La imagen debe ser JPG, PNG o WEBP.'
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
    path.join(
      __dirname,
      'public'
    )
  )
);


/* =========================================================
   VALIDAR GOOGLE APPS SCRIPT
========================================================= */

function validateGoogleApi() {

  if (
    !GOOGLE_APPS_SCRIPT_URL
  ) {

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

  const response =
    await fetch(
      GOOGLE_APPS_SCRIPT_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body:
          JSON.stringify(data)

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


  if (
    result.ok === false
  ) {

    throw new Error(
      result.error ||
      'Google Apps Script rechazó la solicitud.'
    );

  }


  return result;

}

/* =========================================================
   POST /api/asesoria
   ASESORÍA DE IMAGEN PERSONALIZADA
========================================================= */

app.post(
  '/api/asesoria',
  async (req, res) => {
    
  console.log('>>> ENTRO A /api/asesoria');

    try {

      const consulta =
        String(req.body?.consulta || '').trim();

      if (!consulta) {

        return res.status(400).json({

          ok: false,

          error:
            'La consulta es obligatoria.'

        });

      }


      const closetResult =
        await callGoogleApi({
          action: 'list'
        });


      const closet =
        closetResult.items || [];


      const perfil = {

        altura: '151 cm',

        medidas: {
          busto: '95 cm',
          cintura: '80 cm',
          cadera: '95 cm'
        },

        preferencias: {

          estilo:
            'Elegante, femenino y cómodo',

          objetivos: [
            'verse más alta',
            'alargar visualmente las piernas',
            'definir la cintura',
            'equilibrar los hombros',
            'disimular los brazos',
            'disimular el abdomen',
            'marcar la silueta',
            'verse más estilizada'
          ],

          mangas: [
            '3/4',
            'largas'
          ],

          prendas_preferidas: [
            'blusas',
            'camisas',
            'busos',
            'suéteres',
            'pantalones',
            'jeans',
            'chaquetas',
            'blazers',
            'prendas de punto'
          ],

          calzado_preferido: [
            'botines',
            'tenis'
          ],

          colores_favoritos: [
            'negro',
            'vino tinto',
            'beige'
          ],

          colores_que_no_le_gustan: [
            'amarillo',
            'fucsia',
            'colores excesivamente brillantes'
          ],

          falda:
            'No es una prenda de preferencia habitual.',

          tipo_de_asesoria:
  'Creativa: proponer opciones nuevas sin perder elegancia, feminidad, comodidad y favorecimiento de la silueta.'
        }

      };


      const respuesta =
        await openai.responses.create({

          model:
            OPENAI_MODEL,

          input: [

            {

              role: 'system',

              content: [

                {

                  type: 'input_text',

                  text:
`Eres una asesora profesional de imagen personal.

Tu función es asesorar a la usuaria utilizando EXCLUSIVAMENTE
su perfil físico, sus preferencias y las prendas que realmente
tiene registradas en su armario digital.

Debes dar recomendaciones prácticas, concretas y personalizadas.

Prioridades de imagen:
- favorecer una estatura petite de 151 cm;
- alargar visualmente las piernas;
- definir la cintura;
- equilibrar visualmente los hombros;
- disimular brazos y abdomen;
- crear una silueta más estilizada;
- mantener un estilo elegante, femenino y cómodo.

La usuaria quiere recomendaciones creativas que puedan sacarla
de lo habitual, pero sin ignorar sus preferencias.

No debes imponer colores que ella haya indicado que no le gustan.
Sí puedes proponer nuevos colores que probablemente armonicen
con sus preferencias, explicando cómo incorporarlos.

Cuando la consulta solicite un look, utiliza primero las prendas
que realmente aparecen en el armario digital.

No inventes prendas que no estén registradas como disponibles.
Si falta una prenda necesaria, indícalo claramente y propone
una alternativa utilizando las prendas disponibles.

Responde en español.

Evita respuestas genéricas. Explica brevemente POR QUÉ cada
recomendación favorece sus objetivos.

PERFIL DE LA USUARIA:
${JSON.stringify(perfil, null, 2)}

PRENDAS ACTUALES DEL ARMARIO:
${JSON.stringify(closet, null, 2)}

CONSULTA DE LA USUARIA:
${consulta}`

                }

              ]

            }

          ]

        });


      res.json({

        ok: true,

        answer:
          respuesta.output_text || ''

      });


    } catch (error) {

      console.error(
        'Error en /api/asesoria:',
        error
      );

      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No fue posible generar la asesoría.'

      });

    }

  }
);

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

        items:
          result.items || []

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
   POST /api/analyze
   ANALIZAR ARTÍCULO CON IA
========================================================= */

app.post(
  '/api/analyze',
  upload.single('image'),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          ok: false,

          error:
            'La foto es obligatoria.'

        });

      }


      const allowedTypes = [

        'image/jpeg',

        'image/png',

        'image/webp'

      ];


      if (
        !allowedTypes.includes(
          req.file.mimetype
        )
      ) {

        return res.status(400).json({

          ok: false,

          error:
            'La imagen debe ser JPG, PNG o WEBP.'

        });

      }


      /*
       * Convertir la imagen a Base64
       */

      const imageBase64 =
        req.file.buffer.toString(
          'base64'
        );


      /*
       * Crear Data URL válida
       */

      const imageDataUrl =
        `data:${req.file.mimetype};base64,${imageBase64}`;


      /*
       * Enviar imagen a OpenAI
       */

      const response =
        await openai.responses.create({

          model:
            OPENAI_MODEL,

          input: [

            {

              role: 'user',

              content: [

                {

                  type:
                    'input_text',

                  text:
`Analiza esta fotografía de una prenda, zapato, bolso o accesorio para un armario digital.

Devuelve ÚNICAMENTE un JSON válido con estos campos:

- name: nombre corto y específico del artículo.
- category: EXACTAMENTE una de estas opciones: Busos, Camisas, Pantalones, Jeans, Vestidos, Faldas, Chaquetas, Zapatos, Bolsos, Accesorios, Otros.
- color: color principal visible.
- description: descripción breve y útil que indique tipo de prenda o artículo, color, estilo y características visibles.

No inventes marcas, materiales, estampados ni características que no sean visibles.

Si tienes dudas sobre la categoría, utiliza "Otros".`

                },

                {

                  type:
                    'input_image',

                  image_url:
                    imageDataUrl,

                  detail:
                    'high'

                }

              ]

            }

          ],


          /*
           * Respuesta estructurada
           */

          text: {

            format: {

              type:
                'json_schema',

              name:
                'clothing_analysis',

              strict:
                true,

              schema: {

                type:
                  'object',

                properties: {

                  name: {

                    type:
                      'string'

                  },

                  category: {

                    type:
                      'string',

                    enum: [

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

                    ]

                  },

                  color: {

                    type:
                      'string'

                  },

                  description: {

                    type:
                      'string'

                  }

                },

                required: [

                  'name',

                  'category',

                  'color',

                  'description'

                ],

                additionalProperties:
                  false

              }

            }

          }

        });


      /*
       * Convertir respuesta a objeto
       */

      let analysis;


      try {

        analysis =
          JSON.parse(
            response.output_text
          );

      } catch {

        throw new Error(
          'La IA respondió en un formato que no se pudo interpretar.'
        );

      }


      /*
       * Responder al navegador
       */

      res.json({

        ok: true,

        analysis

      });


    } catch (error) {

      console.error(
        'Error analizando artículo con IA:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo analizar la imagen.'

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

          error:
            'La foto es obligatoria.'

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
        req.file.buffer.toString(
          'base64'
        );


      const result =
        await callGoogleApi({

          action:
            'create',

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


      const data = {

        action:
          'update',

        id:
          id.trim(),

        name:
          name.trim(),

        category:
          category.trim(),

        color:
          color.trim(),

        description:
          (description || '').trim()

      };


      /*
       * La imagen es opcional al editar.
       */

      if (req.file) {

        data.imageBase64 =
          req.file.buffer.toString(
            'base64'
          );

        data.imageMimeType =
          req.file.mimetype;

      }


      const result =
        await callGoogleApi(
          data
        );


      res.json({

        ok: true,

        item:
          result.item

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

          action:
            'delete',

          id:
            id

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

          action:
            'listLooks'

        });


      res.json({

        ok: true,

        looks:
          result.looks || []

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


      if (
        !name ||
        !name.trim()
      ) {

        return res.status(400).json({

          ok: false,

          error:
            'El nombre del look es obligatorio.'

        });

      }


      const result =
        await callGoogleApi({

          action:
            'createLook',

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
            Array.isArray(
              accessories
            )
              ? accessories
              : []

        });


      res.status(201).json({

        ok: true,

        look:
          result.look

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


      if (
        !name ||
        !name.trim()
      ) {

        return res.status(400).json({

          ok: false,

          error:
            'El nombre del look es obligatorio.'

        });

      }


      const result =
        await callGoogleApi({

          action:
            'updateLook',

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
            Array.isArray(
              accessories
            )
              ? accessories
              : []

        });


      res.json({

        ok: true,

        look:
          result.look

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

          action:
            'deleteLook',

          id:
            id

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
   MANEJO DE ERRORES
========================================================= */

app.use(
  (
    error,
    _req,
    res,
    _next
  ) => {

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

console.log('RUTA /api/asesoria REGISTRADA');

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