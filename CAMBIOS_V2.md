# V2 — Base estabilizada

Esta versión corrige tres problemas de infraestructura detectados durante la puesta en marcha:

- Codificación UTF-8 consistente y sin BOM en los archivos de código.
- Detección automática de mojibake (`Ã`, `Â`, `�`) mediante `npm run check`.
- Acceso a imágenes de Google Drive mediante `/api/image`, con compatibilidad para `/api/image?id=...` y `/api/image/ID`.

No modifica Google Sheets, Google Drive ni las URLs almacenadas en los datos.

El archivo `.env` no se incluye. Debe conservarse el `.env` actual y sustituir únicamente los archivos del proyecto por esta versión.
