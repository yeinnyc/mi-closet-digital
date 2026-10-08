import { toFile } from 'openai/uploads';
export function createOpenAIService({ openai, textModel, imageModel }) {
  return {
    async analyzeItem(imageBuffer, mimeType) {
      const response = await openai.responses.create({
        model: textModel,
        input: [{
          role: 'user',
          content: [
            { type: 'input_text', text: 'Analiza esta fotografÃƒÂ­a para un armario digital. Devuelve SOLO JSON. CategorÃƒÂ­a EXACTA: Busos, Camisas, Pantalones, Jeans, Vestidos, Faldas, Chaquetas, Zapatos, Bolsos, Accesorios u Otros. No inventes caracterÃƒÂ­sticas no visibles. Campos: name, category, color, description.' },
            { type: 'input_image', image_url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`, detail: 'high' }
          ]
        }],
        text: {
          format: {
            type: 'json_schema',
            name: 'clothing_analysis',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                category: { type: 'string', enum: ['Busos','Camisas','Pantalones','Jeans','Vestidos','Faldas','Chaquetas','Zapatos','Bolsos','Accesorios','Otros'] },
                color: { type: 'string' },
                description: { type: 'string' }
              },
              required: ['name','category','color','description']
            }
          }
        }
      });
      return JSON.parse(response.output_text);
    },

    async advise({ query, profile, closet }) {
      const prompt = `Eres asesora profesional de imagen. Responde en espaÃƒÂ±ol. Utiliza exclusivamente informaciÃƒÂ³n del perfil y del armario recibido. Cuando propongas prendas, utiliza ÃƒÂºnicamente artÃƒÂ­culos reales del armario. Nunca inventes prendas, colores ni IDs. Aplica exclusivamente las caracteristicas fisicas, objetivos, estilos y preferencias de color indicados en el PERFIL. No asumas caracteristicas que no esten definidas en el PERFIL.

PERFIL:
${JSON.stringify(profile, null, 2)}

ARMARIO:
${JSON.stringify(closet, null, 2)}

CONSULTA:
${query}`;
      const response = await openai.responses.create({
        model: textModel,
        input: [{ role: 'system', content: [{ type: 'input_text', text: prompt }] }]
      });
      return response.output_text || '';
    },

    async proposeLooks({ query, profile, closet }) {
      const prompt = `Crea DOS propuestas de look utilizando las caracteristicas y preferencias definidas en el PERFIL.

REGLAS ABSOLUTAS:

1. UTILIZA ÚNICAMENTE PRENDAS REALES DEL ARMARIO.
Usa exclusivamente los IDs existentes en ARMARIO.
No inventes IDs, prendas, colores, características ni artículos.
Cada ID seleccionado debe corresponder exactamente a un artículo existente en el ARMARIO.

FORMATO OBLIGATORIO DE LOS IDs:
Los campos top, jacket, bottom, onePiece, shoes y bag deben contener ÚNICAMENTE el ID del artículo.
Los elementos de accessories también deben contener ÚNICAMENTE sus IDs.
NO escribas el nombre de la prenda.
NO escribas "ID:".
NO agregues descripciones, nombres, etiquetas, explicaciones ni ningún otro texto junto al ID.

Ejemplo correcto:
"shoes": "8c190618-f576-4d2c-950c-2b5c8438fa00"

Ejemplo incorrecto:
"shoes": "Botines negros de caña corta — ID: 8c190618-f576-4d2c-950c-2b5c8438fa00"

2. ESTRUCTURA OBLIGATORIA DEL LOOK.

Existen únicamente dos estructuras válidas:

A) LOOK DE DOS PIEZAS:
- un superior: Camisa, Buso u otra prenda superior disponible;
- un inferior: Pantalón, Jean o Falda disponible;
- zapatos obligatorios.

B) LOOK CON VESTIDO:
- un vestido;
- zapatos obligatorios.

Un look con vestido NO puede incluir simultáneamente superior ni inferior.

3. ZAPATOS:
Los zapatos son OBLIGATORIOS en todos los looks.
Si existen artículos de categoría Zapatos en el ARMARIO, selecciona uno que sea apropiado para el conjunto, la ocasión, el clima, el estilo y las proporciones de la usuaria.
Nunca dejes el campo shoes vacío cuando exista un zapato apropiado en el ARMARIO.

4. CHAQUETA:
La chaqueta es opcional.
Inclúyela únicamente cuando sea apropiada para la ocasión, el clima, la combinación, las proporciones de la usuaria o cuando mejore claramente el resultado.
No agregues una chaqueta simplemente para completar campos.

5. BOLSO:
El bolso es opcional.
Selecciona uno únicamente cuando exista un bolso apropiado y combine con el look y la ocasión.
No inventes bolsos.

6. ACCESORIOS:
Los accesorios son opcionales.
Utilízalos únicamente si existen en el ARMARIO y realmente son adecuados para el look.
No agregues accesorios por obligación.
Prioriza pocos accesorios bien seleccionados sobre una combinación recargada.

7. COLORES NO PERMITIDOS:
Los colores indicados en PERFIL como "colores_no_usar" están PROHIBIDOS.
No selecciones prendas cuyo color corresponda a un color marcado como no usar.
No propongas, recomiendes ni describas esos colores como parte del look.
Si una prenda del ARMARIO tiene un color no permitido, descártala aunque combine con otras prendas.

8. FAVORECIMIENTO:
Cada look debe aplicar las características, proporciones, estilo y análisis cromático definidos en el PERFIL.
Prioriza las combinaciones que favorezcan visualmente a la usuaria petite, apliquen las proporciones, objetivos y preferencias definidos en el PERFIL.

9. NO REPETIR LOOKS:
Las DOS propuestas deben ser realmente diferentes.
No repitas exactamente la misma combinación de prendas.
Puedes reutilizar prendas individuales, pero no debes repetir la misma combinación completa.
Cuando existan alternativas apropiadas en el ARMARIO, cambia al menos uno de los elementos principales y procura variar también zapatos, bolso, chaqueta o accesorios.
No generes dos propuestas que sean prácticamente el mismo look con cambios mínimos.

10. PRIORIDAD:
Cuando existan varias combinaciones posibles, prioriza en este orden:
- favorecimiento visual;
- colorimetría;
- compatibilidad entre prendas;
- ocasión y contexto;
- proporciones indicadas en el PERFIL;
- comodidad;
- practicidad;
- variedad respecto de otros looks;
- aprovechamiento del ARMARIO.

10. VALIDACIÓN FINAL:
Antes de devolver cada look, verifica:
- ¿Todos los IDs existen en ARMARIO?
- ¿Cada campo de selección contiene únicamente un ID?
- ¿El look tiene una estructura válida?
- ¿Tiene zapatos?
- ¿El vestido está correctamente separado de superior/inferior?
- ¿La chaqueta, bolso y accesorios son realmente adecuados?
- ¿El look favorece a la usuaria?
- ¿Las DOS propuestas son diferentes?
- ¿Estoy evitando repetir una combinación ya propuesta?

PERFIL:
${JSON.stringify(profile, null, 2)}

ARMARIO:
${JSON.stringify(closet, null, 2)}

CONSULTA:
${query}`;

      const uuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

      const optionalId = {
        anyOf: [
          { type: 'string', enum: [''] },
          { type: 'string', pattern: uuidPattern }
        ]
      };

      const response = await openai.responses.create({
        model: textModel,
        input: [{ role: 'system', content: [{ type: 'input_text', text: prompt }] }],
        text: {
          format: {
            type: 'json_schema',
            name: 'look_proposals',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                looks: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 2,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      top: optionalId,
                      jacket: optionalId,
                      bottom: optionalId,
                      onePiece: optionalId,
                      shoes: { type: 'string', pattern: uuidPattern },
                      bag: optionalId,
                      accessories: {
                        type: 'array',
                        items: { type: 'string', pattern: uuidPattern }
                      },
                      styling: { type: 'string' }
                    },
                    required: ['name','description','top','jacket','bottom','onePiece','shoes','bag','accessories','styling']
                  }
                }
              },
              required: ['looks']
            }
          }
        }
      });

      return JSON.parse(response.output_text);
    },
    async generateVisual({ modelImageBuffer, selectedImages, prompt }) {
      const inputs = [await toFile(modelImageBuffer, 'modelo-referencia.png', { type: 'image/png' })];
      for (const image of selectedImages) {
        inputs.push(await toFile(image.buffer, `${image.id}.jpg`, { type: image.mimeType || 'image/jpeg' }));
      }
      const result = await openai.images.edit({
        model: imageModel,
        image: inputs,
        prompt,
        quality: 'high',
        size: 'auto',
        background: 'opaque'
      });
      if (!result?.data?.[0]?.b64_json) throw new Error('OpenAI no devolviÃƒÂ³ el visual.');
      return result.data[0].b64_json;
    }
  };
}
