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
      'No estÃƒÆ’Ã‚Â¡ configurada la variable GOOGLE_APPS_SCRIPT_URL en Render.'
    );

  }

}


/* =========================================================
   COMUNICACIÃƒÆ’Ã¢â‚¬Å“N CON GOOGLE APPS SCRIPT
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
      'Google Apps Script devolviÃƒÆ’Ã‚Â³ una respuesta no vÃƒÆ’Ã‚Â¡lida.'
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
      'Google Apps Script rechazÃƒÆ’Ã‚Â³ la solicitud.'
    );

  }


  return result;

}

/* =========================================================
   POST /api/asesoria
   ASESORÃƒÆ’Ã‚ÂA DE IMAGEN PERSONALIZADA
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
            'Elegante, femenino y cÃƒÆ’Ã‚Â³modo',

          objetivos: [
            'verse mÃƒÆ’Ã‚Â¡s alta',
            'alargar visualmente las piernas',
            'definir la cintura',
            'equilibrar los hombros',
            'disimular los brazos',
            'disimular el abdomen',
            'marcar la silueta',
            'verse mÃƒÆ’Ã‚Â¡s estilizada'
          ],

          mangas: [
            '3/4',
            'largas'
          ],

          prendas_preferidas: [
            'blusas',
            'camisas',
            'busos',
            'suÃƒÆ’Ã‚Â©teres',
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

Tu funciÃ³n es crear DOS propuestas de look visual para la usuaria.

REGLA ABSOLUTA:
Solo puedes utilizar prendas, zapatos, bolsos y accesorios que existan realmente en el armario digital proporcionado.

NO inventes prendas.
NO inventes colores de prendas.
NO inventes IDs.
NO utilices IDs que no aparezcan en PRENDAS ACTUALES DEL ARMARIO.

Cada propuesta debe utilizar los IDs reales de los artÃ­culos.

OBJETIVOS DE IMAGEN:
- favorecer una estatura petite de 151 cm;
- alargar visualmente las piernas;
- definir la cintura;
- equilibrar visualmente los hombros;
- disimular brazos y abdomen;
- crear una silueta mÃ¡s estilizada;
- mantener un estilo elegante, femenino y cÃ³modo.

La usuaria quiere propuestas creativas que puedan sacarla de lo habitual, pero sin perder elegancia, feminidad, comodidad ni favorecimiento de la silueta.

Respeta sus preferencias de color.
Evita amarillo, fucsia y colores excesivamente brillantes.

Si existen suficientes prendas apropiadas, crea DOS looks claramente diferentes entre sÃ­.

Si una categorÃ­a no es necesaria, dÃ©jala vacÃ­a.

FORMATO OBLIGATORIO:
Devuelve ÃšNICAMENTE JSON vÃ¡lido.
NO escribas Markdown.
NO escribas explicaciones fuera del JSON.

La estructura EXACTA debe ser:

{
  "looks": [
    {
      "name": "Nombre del Look 1",
      "description": "DescripciÃ³n breve del look.",
      "top": "ID o cadena vacÃ­a",
      "jacket": "ID o cadena vacÃ­a",
      "bottom": "ID o cadena vacÃ­a",
      "onePiece": "ID o cadena vacÃ­a",
      "shoes": "ID o cadena vacÃ­a",
      "bag": "ID o cadena vacÃ­a",
      "accessories": ["ID", "ID"],
      "styling": "ExplicaciÃ³n breve de por quÃ© favorece la silueta y cÃ³mo llevarlo."
    },
    {
      "name": "Nombre del Look 2",
      "description": "DescripciÃ³n breve del look.",
      "top": "ID o cadena vacÃ­a",
      "jacket": "ID o cadena vacÃ­a",
      "bottom": "ID o cadena vacÃ­a",
      "onePiece": "ID o cadena vacÃ­a",
      "shoes": "ID o cadena vacÃ­a",
      "bag": "ID o cadena vacÃ­a",
      "accessories": ["ID", "ID"],
      "styling": "ExplicaciÃ³n breve de por quÃ© favorece la silueta y cÃ³mo llevarlo."
    }
  ]
}

IMPORTANTE:
- "top", "jacket", "bottom", "onePiece", "shoes" y "bag" deben contener Ãºnicamente IDs existentes.
- "accessories" debe contener Ãºnicamente IDs existentes.
- Si no hay un artÃ­culo apropiado para una categorÃ­a, utiliza "".
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
          'Respuesta JSON invÃ¡lida de la IA:',
          respuesta.output_text
        );

        throw new Error(
          'La IA no devolviÃ³ una estructura de looks vÃ¡lida.'
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
          'No fue posible generar la asesorÃƒÆ’Ã‚Â­a.'

      });

    }

  }
);

/* =========================================================
   GET /api/items
   OBTENER TODOS LOS ARTÃƒÆ’Ã‚ÂCULOS
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
        'Error obteniendo artÃƒÆ’Ã‚Â­culos:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudieron cargar los artÃƒÆ’Ã‚Â­culos.'

      });

    }

  }
);



/* =========================================================
   POST /api/analyze
   ANALIZAR ARTÃƒÂCULO CON IA - FRENTE + ESPALDA
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
            'Las fotografÃƒÂ­as de frente y espalda son obligatorias.'

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
            'Las imÃƒÂ¡genes deben ser JPG, PNG o WEBP.'

        });

      }


      /*
       * Convertir ambas imÃƒÂ¡genes a Base64
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
`Analiza estas DOS fotografÃƒÂ­as del MISMO artÃƒÂ­culo de vestir o accesorio para un armario digital.

La primera imagen corresponde al FRENTE.
La segunda imagen corresponde a la ESPALDA.

Debes analizar ambas imÃƒÂ¡genes conjuntamente y tratarlas como UN SOLO ARTÃƒÂCULO.

REGLA DE FIDELIDAD:

  REGLA PRIORITARIA PARA EL COLOR:
Identifica el color principal ÃƒÂºnicamente por lo que se observa directamente en las fotografÃƒÂ­as.
Distingue cuidadosamente tonos similares, especialmente vino tinto, borgoÃƒÂ±a, rojo, rosa, fucsia y morado.
No determines el color por el nombre, contexto o tipo de prenda.
Si visualmente es vino tinto, no lo clasifiques como fucsia.

Nunca inventes caracterÃƒÂ­sticas que no sean visibles en ninguna de las dos fotografÃƒÂ­as.

No supongas cÃƒÂ³mo es una parte que no puede observarse.

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
- diseÃƒÂ±os
- detalles de la espalda

Si una caracterÃƒÂ­stica solamente es visible en una de las fotografÃƒÂ­as, puedes describirla.

Si una caracterÃƒÂ­stica no es visible en ninguna de las dos fotografÃƒÂ­as, NO la inventes.

La descripciÃƒÂ³n debe basarse exclusivamente en lo que puede observarse en el frente y la espalda.

Devuelve ÃƒÅ¡NICAMENTE un JSON vÃƒÂ¡lido con estos campos:

- name: nombre corto y especÃƒÂ­fico del artÃƒÂ­culo.
- category: EXACTAMENTE una de estas opciones: Busos, Camisas, Pantalones, Jeans, Vestidos, Faldas, Chaquetas, Zapatos, Bolsos, Accesorios, Otros.
- color: color principal visible.
- description: descripciÃƒÂ³n breve y ÃƒÂºtil que indique el tipo de artÃƒÂ­culo, color, estilo y caracterÃƒÂ­sticas realmente visibles en cualquiera de las dos fotografÃƒÂ­as.

Si tienes dudas sobre la categorÃƒÂ­a, utiliza "Otros".`

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
          'La IA respondiÃƒÂ³ en un formato que no se pudo interpretar.'
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
        'Error analizando artÃƒÂ­culo con IA:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudieron analizar las fotografÃƒÂ­as.'

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
Crea una imagen visual de asesorÃ­a de moda utilizando
EXACTAMENTE el modelo de referencia de la primera imagen.

Conserva el estilo visual del modelo de referencia.
Debe parecer una presentaciÃ³n profesional de moda.

Utiliza ÃšNICAMENTE las prendas mostradas en las imÃ¡genes
posteriores.

NO inventes prendas.
NO agregues prendas que no estÃ©n en las imÃ¡genes.
NO cambies colores.
NO cambies diseÃ±os.
NO sustituyas las prendas.

Look:
${look.description || ''}

Estilismo:
${look.styling || ''}

Muestra UN SOLO LOOK COMPLETO, de cuerpo entero, en una sola imagen continua. La persona debe verse completa desde la cabeza hasta los pies. NO hagas collage. NO hagas paneles. NO hagas vistas laterales. NO hagas vistas traseras. NO hagas acercamientos ni recortes de prendas. NO dividas la imagen en partes. Fondo limpio y neutro.
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
      'Error generando visual de asesorÃ­a:',
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
        error: 'No se recibiÃƒÂ³ ninguna imagen.'
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
      prompt: 'Convierte esta fotografÃƒÂ­a en una fotografÃƒÂ­a profesional de catÃƒÂ¡logo del artÃƒÂ­culo original. REGLA ABSOLUTA: el resultado debe mostrar ÃƒÅ¡NICAMENTE el artÃƒÂ­culo, sin ninguna persona. Si la prenda estÃƒÂ¡ siendo usada por una persona, elimina completamente cabeza, cabello, rostro, cuello, brazos, manos, piernas, cuerpo y cualquier parte humana. Conserva exclusivamente la prenda. MantÃƒÂ©n exactamente su forma, corte, proporciones, color real, material, textura, tejido, estampados, costuras, botones, cremalleras, bolsillos, cierres, hebillas, herrajes, asas y logotipos visibles. Si alguna parte estÃƒÂ¡ oculta por el cuerpo, reconstruirla ÃƒÂºnicamente cuando pueda deducirse claramente de las partes visibles, sin inventar caracterÃƒÂ­sticas. Elimina completamente el fondo y todos los objetos del entorno. Coloca ÃƒÂºnicamente el artÃƒÂ­culo sobre fondo blanco puro, limpio y uniforme. Centra el artÃƒÂ­culo, muÃƒÂ©stralo completo cuando sea posible y mejora moderadamente la iluminaciÃƒÂ³n y nitidez. Debe parecer una fotografÃƒÂ­a real de producto. La fidelidad al artÃƒÂ­culo original tiene prioridad absoluta sobre la estÃƒÂ©tica. NO conservar ninguna parte de la persona. NO cambiar el diseÃƒÂ±o, color, corte ni proporciones. NO convertirlo en ilustraciÃƒÂ³n.',
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
      error: 'No se pudo generar la imagen de catÃƒÂ¡logo.'
    })
  }
})
/* =========================================================
   POST /api/items
   CREAR ARTÃƒÆ’Ã‚ÂCULO
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
            'Nombre, categorÃƒÂ­a y color son obligatorios.'

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
        'Error guardando artÃƒÂ­culo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo guardar el artÃƒÂ­culo.'

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
            'Falta el ID del artÃƒÆ’Ã‚Â­culo.'

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
            'Nombre, categorÃƒÆ’Ã‚Â­a y color son obligatorios.'

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
        'Error actualizando artÃƒÆ’Ã‚Â­culo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo actualizar el artÃƒÆ’Ã‚Â­culo.'

      });

    }

  }
);


/* =========================================================
   DELETE /api/items/:id
   ELIMINAR ARTÃƒÆ’Ã‚ÂCULO
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
            'Falta el ID del artÃƒÆ’Ã‚Â­culo.'

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
          'ArtÃƒÆ’Ã‚Â­culo eliminado.'

      });


    } catch (error) {

      console.error(
        'Error eliminando artÃƒÆ’Ã‚Â­culo:',
        error
      );


      res.status(500).json({

        ok: false,

        error:
          error.message ||
          'No se pudo eliminar el artÃƒÆ’Ã‚Â­culo.'

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



