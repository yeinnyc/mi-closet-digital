# MI CLOSET DIGITAL V2

Nueva arquitectura sobre la infraestructura existente: Google Sheets + Google Drive + Google Apps Script + Node/Express + OpenAI.

## Principios
- No modifica los datos existentes por sí sola.
- La aplicación lee y escribe mediante Apps Script.
- La IA nunca puede seleccionar IDs que no existan en el armario; el backend vuelve a validar.
- Generar visual es una acción explícita y separada de la asesoría de texto.
- Guardar un look exige un visual generado.
- La clave de OpenAI solo existe en el servidor.

## Puesta en marcha
1. Copia `.env.example` como `.env`.
2. Completa `GOOGLE_APPS_SCRIPT_URL` y `OPENAI_API_KEY`.
3. Ejecuta `npm install`.
4. Ejecuta `npm run check`.
5. Ejecuta `npm start`.
6. Abre `http://localhost:3000`.

## Importante
La versión entregada incluye el frontend y backend V2. Antes de usar el guardado ampliado de LOOKS, el Apps Script debe recibir la versión compatible incluida en `apps-script/Code.gs`. No pegues esa versión sobre el Apps Script productivo sin hacer primero una copia/versionado en Apps Script.
