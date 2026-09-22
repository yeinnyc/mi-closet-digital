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
    fileSize: 20 * 1024 * 1024
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
      'No estÃ¡ configurada la variable GOOGLE_APPS_SCRIPT_URL en Render.'
    );

  }

}


/* =========================================================
   COMUNICACIÃ“N CON GOOGLE APPS SCRIPT
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
      'Google Apps Script devolviÃ³ una respuesta no vÃ¡lida.'
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
      'Google Apps Script rechazÃ³ la solicitud.'
    );

  }


  return result;

}

/* =========================================================
   POST /api/asesoria
   ASESORÃA DE IMAGEN PERSONALIZADA
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
            'Elegante, femenino y cÃ³modo',

          objetivos: [
            'verse mÃ¡s alta',
            'alargar visualmente las piernas',
            'definir la cintura',
            'equilibrar los hombros',
            'disimular los brazos',
            'disimular el abdomen',
            'marcar la silueta',
            'verse mÃ¡s estilizada'
          ],

          mangas: [
            '3/4',
            'largas'
          ],

          prendas_preferidas: [
            'blusas',
            'camisas',
            'busos',
            'suÃ©teres',
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

Tu funciÃ³n es asesorar a la usuaria utilizando EXCLUSIVAMENTE
su perfil fÃ­sico, sus preferencias y las prendas que realmente
tiene registradas en su armario digital.

Debes dar recomendaciones prÃ¡cticas, concretas y personalizadas.

Prioridades de imagen:
- favorecer una estatura petite de 151 cm;
- alargar visualmente las piernas;
- definir la cintura;
- equilibrar visualmente los hombros;
- disimular brazos y abdomen;
- crear una silueta mÃ¡s estilizada;
- mantener un estilo elegante, femenino y cÃ³modo.

La usuaria quiere recomendaciones creativas que puedan sacarla
de lo habitual, pero sin ignorar sus preferencias.

No debes imponer colores que ella haya indicado que no le gustan.
SÃ­ puedes proponer nuevos colores que probablemente armonicen
con sus preferencias, explicando cÃ³mo incorporarlos.

Cuando la consulta solicite un look, utiliza primero las prendas
que realmente aparecen en el armario digital.

No inventes prendas que no estÃ©n registradas como disponibles.
Si falta una prenda necesaria, indÃ­calo claramente y propone
una alternativa utilizando las prendas disponibles.

Responde en espaÃ±ol.

Evita respuestas genÃ©ricas. Explica brevemente POR QUÃ‰ cada
recomendaciÃ³n favorece sus objetivos.

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
          'No fue posible generar la asesorÃ­a.'

      });

    }

  }
);

/* =========================================================
   GET /api/items
   OBTENER TODOS LOS ARTÃCULOS
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
        'Error obteniendo artÃ­culos:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudieron cargar los artÃ­culos.'

      });

    }

  }
);



/* =========================================================
   POST /api/analyze
   ANALIZAR ARTÍCULO CON IA - FRENTE + ESPALDA
========================================================= */

app.post(
  '/api/analyze',
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  async (req, res) => {

    try {

      const frontFile =
        req.files?.frontImage?.[0];

      const backFile =
        req.files?.backImage?.[0];


      if (!frontFile) {

        return res.status(400).json({

          ok: false,

          error:
            'Las fotografías de frente y espalda son obligatorias.'

        });

      }


      const allowedTypes = [

        'image/jpeg',

        'image/png',

        'image/webp'

      ];


      if (
        !allowedTypes.includes(
          frontFile.mimetype
        ) ||
        backFile &&
        !allowedTypes.includes(
          backFile.mimetype
        )
      ) {

        return res.status(400).json({

          ok: false,

          error:
            'Las imágenes deben ser JPG, PNG o WEBP.'

        });

      }


      /*
       * Convertir ambas imágenes a Base64
       */

      const frontBase64 =
        frontFile.buffer.toString(
          'base64'
        );

      const backBase64 =
        backFile
          ? backFile.buffer.toString('base64')
          : null;


      /*
       * Crear Data URLs
       */

      const frontImageDataUrl =
        `data:${frontFile.mimetype};base64,${frontBase64}`;

      const backImageDataUrl =
        backFile
          ? `data:${backFile.mimetype};base64,${backBase64}`
          : null;


      /*
       * Enviar FRENTE + ESPALDA a OpenAI
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
`Analiza estas DOS fotografías del MISMO artículo de vestir o accesorio para un armario digital.

La primera imagen corresponde al FRENTE.
La segunda imagen corresponde a la ESPALDA.

Debes analizar ambas imágenes conjuntamente y tratarlas como UN SOLO ARTÍCULO.

REGLA DE FIDELIDAD:

  REGLA PRIORITARIA PARA EL COLOR:
Identifica el color principal únicamente por lo que se observa directamente en las fotografías.
Distingue cuidadosamente tonos similares, especialmente vino tinto, borgoña, rojo, rosa, fucsia y morado.
No determines el color por el nombre, contexto o tipo de prenda.
Si visualmente es vino tinto, no lo clasifiques como fucsia.

Nunca inventes características que no sean visibles en ninguna de las dos fotografías.

No supongas cómo es una parte que no puede observarse.

No inventes:
- marcas
- logotipos
- materiales
- estampados
- bolsillos
- botones
- cierres
- mangas
- capuchas
- costuras
- adornos
- diseños
- detalles de la espalda

Si una característica solamente es visible en una de las fotografías, puedes describirla.

Si una característica no es visible en ninguna de las dos fotografías, NO la inventes.

La descripción debe basarse exclusivamente en lo que puede observarse en el frente y la espalda.

Devuelve ÚNICAMENTE un JSON válido con estos campos:

- name: nombre corto y específico del artículo.
- category: EXACTAMENTE una de estas opciones: Busos, Camisas, Pantalones, Jeans, Vestidos, Faldas, Chaquetas, Zapatos, Bolsos, Accesorios, Otros.
- color: color principal visible.
- description: descripción breve y útil que indique el tipo de artículo, color, estilo y características realmente visibles en cualquiera de las dos fotografías.

Si tienes dudas sobre la categoría, utiliza "Otros".`

                },

                {

                  type:
                    'input_image',

                  image_url:
                    frontImageDataUrl,

                  detail:
                    'high'

                },

                ...(backImageDataUrl
                  ? [{
                      type: 'input_image',
                      image_url: backImageDataUrl,
                      detail: 'high'
                    }]
                  : [])

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
          'No se pudieron analizar las fotografías.'

      });

    }

  }
);



/* =========================================================
   POST /api/items
   CREAR ARTÃCULO
========================================================= */

app.post(
  '/api/items',
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  async (req, res) => {

    try {

      const frontFile =
        req.files?.frontImage?.[0];

      const backFile =
        req.files?.backImage?.[0];


      if (!frontFile) {

        return res.status(400).json({

          ok: false,

          error:
            'La foto de frente es obligatoria.'

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


      const frontImageBase64 =
        frontFile.buffer.toString(
          'base64'
        );


      const backImageBase64 =
        backFile
          ? backFile.buffer.toString('base64')
          : null;


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

          frontImageBase64:
            frontImageBase64,

          frontImageMimeType:
            frontFile.mimetype,

          backImageBase64:
            backImageBase64,

          backImageMimeType:
            backFile?.mimetype || null

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
            'Falta el ID del artÃ­culo.'

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
            'Nombre, categorÃ­a y color son obligatorios.'

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
        'Error actualizando artÃ­culo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo actualizar el artÃ­culo.'

      });

    }

  }
);


/* =========================================================
   DELETE /api/items/:id
   ELIMINAR ARTÃCULO
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
            'Falta el ID del artÃ­culo.'

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
          'ArtÃ­culo eliminado.'

      });


    } catch (error) {

      console.error(
        'Error eliminando artÃ­culo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo eliminar el artÃ­culo.'

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
