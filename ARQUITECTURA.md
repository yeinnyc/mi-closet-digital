# MI CLOSET DIGITAL V2 — Arquitectura

## Fuente de verdad
- Google Sheets: datos de artículos y looks.
- Google Drive: fotografías de artículos y visuales de looks.
- Google Apps Script: persistencia y operaciones sobre Sheets/Drive.
- Node/Express: API segura, validaciones y orquestación.
- OpenAI: análisis de prendas, asesoría y generación visual, únicamente bajo acción explícita.

## Flujo de datos

```text
INTERFAZ
   |
   v
NODE / API
   |-----------------------> OPENAI (solo cuando corresponde)
   |
   v
GOOGLE APPS SCRIPT
   |                 |
   v                 v
GOOGLE SHEETS     GOOGLE DRIVE
```

## Reglas de negocio
1. Los artículos se identifican por el ID de Google Sheets.
2. La IA recibe los artículos existentes y sus IDs.
3. El backend valida nuevamente todos los IDs devueltos por IA.
4. Un look con vestido no puede tener superior ni inferior.
5. Un look guardado debe tener al menos un artículo válido.
6. En V2, un look generado por asesoría solo se guarda después de generar su visual.
7. Generar visual es una acción explícita para evitar consumo innecesario de créditos.
8. Los visuales se guardan en Drive mediante Apps Script.
9. Los datos existentes de la hoja LOOKS son compatibles: las columnas nuevas se agregan después de VISUAL.

## Compatibilidad LOOKS
Columnas existentes conservadas:
ID, NOMBRE, SUPERIOR, INFERIOR, VESTIDO, ZAPATOS, BOLSO, ACCESORIOS, FECHA, ESTADO, VISUAL.

Nuevas columnas al final:
CHAQUETA, DESCRIPCIÓN, ESTILISMO.

No se reordenan ni eliminan columnas existentes.
