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
      'No estÃƒÂ¡ configurada la variable GOOGLE_APPS_SCRIPT_URL en Render.'
    );

  }

}


/* =========================================================
   COMUNICACIÃƒâ€œN CON GOOGLE APPS SCRIPT
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
      'Google Apps Script devolviÃƒÂ³ una respuesta no vÃƒÂ¡lida.'
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
      'Google Apps Script rechazÃƒÂ³ la solicitud.'
    );

  }


  return result;

}

/* =========================================================
   POST /api/asesoria
   ASESORÃƒÂA DE IMAGEN PERSONALIZADA
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
            'Elegante, femenino y cÃƒÂ³modo',

          objetivos: [
            'verse mÃƒÂ¡s alta',
            'alargar visualmente las piernas',
            'definir la cintura',
            'equilibrar los hombros',
            'disimular los brazos',
            'disimular el abdomen',
            'marcar la silueta',
            'verse mÃƒÂ¡s estilizada'
          ],

          mangas: [
            '3/4',
            'largas'
          ],

          prendas_preferidas: [
            'blusas',
            'camisas',
            'busos',
            'suÃƒÂ©teres',
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

Tu función es crear DOS propuestas de look visual para la usuaria.

REGLA ABSOLUTA:
Solo puedes utilizar prendas, zapatos, bolsos y accesorios que existan realmente en el armario digital proporcionado.

NO inventes prendas.
NO inventes colores de prendas.
NO inventes IDs.
NO utilices IDs que no aparezcan en PRENDAS ACTUALES DEL ARMARIO.

Cada propuesta debe utilizar los IDs reales de los artículos.

OBJETIVOS DE IMAGEN:
- favorecer una estatura petite de 151 cm;
- alargar visualmente las piernas;
- definir la cintura;
- equilibrar visualmente los hombros;
- disimular brazos y abdomen;
- crear una silueta más estilizada;
- mantener un estilo elegante, femenino y cómodo.

La usuaria quiere propuestas creativas que puedan sacarla de lo habitual, pero sin perder elegancia, feminidad, comodidad ni favorecimiento de la silueta.

Respeta sus preferencias de color.
Evita amarillo, fucsia y colores excesivamente brillantes.

Si existen suficientes prendas apropiadas, crea DOS looks claramente diferentes entre sí.

Si una categoría no es necesaria, déjala vacía.

FORMATO OBLIGATORIO:
Devuelve ÚNICAMENTE JSON válido.
NO escribas Markdown.
NO escribas explicaciones fuera del JSON.

La estructura EXACTA debe ser:

{
  "looks": [
    {
      "name": "Nombre del Look 1",
      "description": "Descripción breve del look.",
      "top": "ID o cadena vacía",
      "jacket": "ID o cadena vacía",
      "bottom": "ID o cadena vacía",
      "onePiece": "ID o cadena vacía",
      "shoes": "ID o cadena vacía",
      "bag": "ID o cadena vacía",
      "accessories": ["ID", "ID"],
      "styling": "Explicación breve de por qué favorece la silueta y cómo llevarlo."
    },
    {
      "name": "Nombre del Look 2",
      "description": "Descripción breve del look.",
      "top": "ID o cadena vacía",
      "jacket": "ID o cadena vacía",
      "bottom": "ID o cadena vacía",
      "onePiece": "ID o cadena vacía",
      "shoes": "ID o cadena vacía",
      "bag": "ID o cadena vacía",
      "accessories": ["ID", "ID"],
      "styling": "Explicación breve de por qué favorece la silueta y cómo llevarlo."
    }
  ]
}

IMPORTANTE:
- "top", "jacket", "bottom", "onePiece", "shoes" y "bag" deben contener únicamente IDs existentes.
- "accessories" debe contener únicamente IDs existentes.
- Si no hay un artículo apropiado para una categoría, utiliza "".
- No repitas necesariamente las mismas prendas en los dos looks.
- Los dos looks deben ser visualmente diferentes cuando el armario lo permita.

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

      let looks;

      try {

        looks =
          JSON.parse(
            respuesta.output_text || '{}'
          );

      } catch (parseError) {

        console.error(
          'Respuesta JSON inválida de la IA:',
          respuesta.output_text
        );

        throw new Error(
          'La IA no devolvió una estructura de looks válida.'
        );

      }

      res.json({

        ok: true,

        looks:
          looks.looks || []

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
          'No fue posible generar la asesorÃƒÂ­a.'

      });

    }

  }
);

/* =========================================================
   GET /api/items
   OBTENER TODOS LOS ARTÃƒÂCULOS
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
        'Error obteniendo artÃƒÂ­culos:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudieron cargar los artÃƒÂ­culos.'

      });

    }

  }
);



/* =========================================================
   POST /api/analyze
   ANALIZAR ARTÃCULO CON IA - FRENTE + ESPALDA
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
            'Las fotografÃ­as de frente y espalda son obligatorias.'

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
            'Las imÃ¡genes deben ser JPG, PNG o WEBP.'

        });

      }


      /*
       * Convertir ambas imÃ¡genes a Base64
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
`Analiza estas DOS fotografÃ­as del MISMO artÃ­culo de vestir o accesorio para un armario digital.

La primera imagen corresponde al FRENTE.
La segunda imagen corresponde a la ESPALDA.

Debes analizar ambas imÃ¡genes conjuntamente y tratarlas como UN SOLO ARTÃCULO.

REGLA DE FIDELIDAD:

  REGLA PRIORITARIA PARA EL COLOR:
Identifica el color principal Ãºnicamente por lo que se observa directamente en las fotografÃ­as.
Distingue cuidadosamente tonos similares, especialmente vino tinto, borgoÃ±a, rojo, rosa, fucsia y morado.
No determines el color por el nombre, contexto o tipo de prenda.
Si visualmente es vino tinto, no lo clasifiques como fucsia.

Nunca inventes caracterÃ­sticas que no sean visibles en ninguna de las dos fotografÃ­as.

No supongas cÃ³mo es una parte que no puede observarse.

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
- diseÃ±os
- detalles de la espalda

Si una caracterÃ­stica solamente es visible en una de las fotografÃ­as, puedes describirla.

Si una caracterÃ­stica no es visible en ninguna de las dos fotografÃ­as, NO la inventes.

La descripciÃ³n debe basarse exclusivamente en lo que puede observarse en el frente y la espalda.

Devuelve ÃšNICAMENTE un JSON vÃ¡lido con estos campos:

- name: nombre corto y especÃ­fico del artÃ­culo.
- category: EXACTAMENTE una de estas opciones: Busos, Camisas, Pantalones, Jeans, Vestidos, Faldas, Chaquetas, Zapatos, Bolsos, Accesorios, Otros.
- color: color principal visible.
- description: descripciÃ³n breve y Ãºtil que indique el tipo de artÃ­culo, color, estilo y caracterÃ­sticas realmente visibles en cualquiera de las dos fotografÃ­as.

Si tienes dudas sobre la categorÃ­a, utiliza "Otros".`

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
          'La IA respondiÃ³ en un formato que no se pudo interpretar.'
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
        'Error analizando artÃ­culo con IA:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudieron analizar las fotografÃ­as.'

      });

    }

  }
);

/* =========================================================
   POST /api/asesoria/visual
========================================================= */

app.post('/api/asesoria/visual', async (req, res) => {
  try {

    const { look, modelImage } = req.body || {};

    if (!look) {
      return res.status(400).json({
        ok: false,
        error: 'Falta el look.'
      });
    }

    if (!modelImage) {
      return res.status(400).json({
        ok: false,
        error: 'Falta la imagen del modelo de referencia.'
      });
    }

    const closetResult = await callGoogleApi({
      action: 'list'
    });

    const closet = closetResult.items || [];

    const ids = [
      look.top,
      look.jacket,
      look.bottom,
      look.onePiece,
      look.shoes,
      look.bag,
      ...(Array.isArray(look.accessories)
        ? look.accessories
        : [])
    ].filter(Boolean);

    const selectedItems = closet.filter(item =>
      ids.some(id =>
        String(id) === String(item.id)
      )
    );

    if (!selectedItems.length) {
      return res.status(400).json({
        ok: false,
        error: 'No se encontraron las prendas del look.'
      });
    }

    const imageInputs = [];

    const modelBuffer = await fs.readFile(
      path.join(__dirname, 'public', 'modelo-referencia.png')
    );

    imageInputs.push(
      await OpenAI.toFile(
        modelBuffer,
        'modelo-referencia.png',
        { type: 'image/png' }
      )
    );

    for (const item of selectedItems) {

      const originalUrl =
        item?.frontImage?.url ||
        item?.frontImage ||
        item?.imageUrl ||
        item?.image ||
        '';

      if (!originalUrl) continue;

      const imageResponse = await fetch(originalUrl);

      if (!imageResponse.ok) {
        console.warn('No se pudo descargar imagen:', item.id);
        continue;
      }

      const buffer = Buffer.from(
        await imageResponse.arrayBuffer()
      );

      const mimeType =
        imageResponse.headers.get('content-type') || 'image/jpeg';

      imageInputs.push(
        await OpenAI.toFile(
          buffer,
          String(item.id) + '.jpg',
          { type: mimeType }
        )
      );
    }


    const prompt = `
Crea una imagen visual de asesoría de moda utilizando
EXACTAMENTE el modelo de referencia de la primera imagen.

Conserva el estilo visual del modelo de referencia.
Debe parecer una presentación profesional de moda.

Utiliza ÚNICAMENTE las prendas mostradas en las imágenes
posteriores.

NO inventes prendas.
NO agregues prendas que no estén en las imágenes.
NO cambies colores.
NO cambies diseños.
NO sustituyas las prendas.

Look:
${look.description || ''}

Estilismo:
${look.styling || ''}

Muestra el look completo de cuerpo entero.
Fondo limpio y neutro.
Sin texto.
Sin logotipos inventados.
`;

    const result = await openai.images.edit({
      model: 'gpt-image-2.5-sunburst',
      image: imageInputs,
      prompt,
      quality: 'high',
      size: 'auto',
      background: 'opaque'
    });

    res.json({
      ok: true,
      imageBase64: result.data[0].b64_json,
      mimeType: 'image/png'
    });

  } catch (error) {

    console.error(
      'Error generando visual de asesoría:',
      error
    );

    res.status(500).json({
      ok: false,
      error:
        error.message ||
        'No se pudo generar el visual del look.'
    });
  }
});

 /* =========================================================
   POST /api/clean-image
========================================================= */

app.post('/api/clean-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: 'No se recibiÃ³ ninguna imagen.'
      })
    }

    const imageFile = await OpenAI.toFile(
      req.file.buffer,
      req.file.originalname,
      { type: req.file.mimetype }
    )

    const result = await openai.images.edit({
      model: 'gpt-image-2.5-sunburst',
      image: imageFile,
      prompt: 'Convierte esta fotografÃ­a en una fotografÃ­a profesional de catÃ¡logo del artÃ­culo original. REGLA ABSOLUTA: el resultado debe mostrar ÃšNICAMENTE el artÃ­culo, sin ninguna persona. Si la prenda estÃ¡ siendo usada por una persona, elimina completamente cabeza, cabello, rostro, cuello, brazos, manos, piernas, cuerpo y cualquier parte humana. Conserva exclusivamente la prenda. MantÃ©n exactamente su forma, corte, proporciones, color real, material, textura, tejido, estampados, costuras, botones, cremalleras, bolsillos, cierres, hebillas, herrajes, asas y logotipos visibles. Si alguna parte estÃ¡ oculta por el cuerpo, reconstruirla Ãºnicamente cuando pueda deducirse claramente de las partes visibles, sin inventar caracterÃ­sticas. Elimina completamente el fondo y todos los objetos del entorno. Coloca Ãºnicamente el artÃ­culo sobre fondo blanco puro, limpio y uniforme. Centra el artÃ­culo, muÃ©stralo completo cuando sea posible y mejora moderadamente la iluminaciÃ³n y nitidez. Debe parecer una fotografÃ­a real de producto. La fidelidad al artÃ­culo original tiene prioridad absoluta sobre la estÃ©tica. NO conservar ninguna parte de la persona. NO cambiar el diseÃ±o, color, corte ni proporciones. NO convertirlo en ilustraciÃ³n.',
      quality: 'high',
      size: 'auto',
      background: 'opaque'
    })

    res.json({
      ok: true,
      imageBase64: result.data[0].b64_json,
      mimeType: 'image/png'
    })

  } catch (error) {
    console.error('Error al limpiar imagen con IA:', error)

    res.status(500).json({
      ok: false,
      error: 'No se pudo generar la imagen de catÃ¡logo.'
    })
  }
})
/* =========================================================
   POST /api/items
   CREAR ARTÃƒÂCULO
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
            'Nombre, categorÃ­a y color son obligatorios.'

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
        'Error guardando artÃ­culo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo guardar el artÃ­culo.'

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
            'Falta el ID del artÃƒÂ­culo.'

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
            'Nombre, categorÃƒÂ­a y color son obligatorios.'

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
        'Error actualizando artÃƒÂ­culo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo actualizar el artÃƒÂ­culo.'

      });

    }

  }
);


/* =========================================================
   DELETE /api/items/:id
   ELIMINAR ARTÃƒÂCULO
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
            'Falta el ID del artÃƒÂ­culo.'

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
          'ArtÃƒÂ­culo eliminado.'

      });


    } catch (error) {

      console.error(
        'Error eliminando artÃƒÂ­culo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo eliminar el artÃƒÂ­culo.'

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

