# MI CLOSET DIGITAL

Primera versión funcional de la aplicación.

## Qué hace

- Agregar un artículo subiendo una foto.
- Analizar la foto con IA.
- La IA propone nombre, categoría, color y descripción.
- Puedes corregir los datos.
- Guardar el artículo.
- Ver automáticamente los artículos en **Mi ropa**.
- Buscar y filtrar por categoría.
- Guardar las imágenes y datos en el computador.

## Requisitos

- Node.js 20 o superior recomendado.
- Una API key de OpenAI.

## Instalación

1. Abre una terminal dentro de esta carpeta.
2. Ejecuta:

```bash
npm install
```

3. Copia `.env.example` y crea un archivo llamado `.env`.
4. En `.env` coloca tu clave:

```env
OPENAI_API_KEY=tu_clave
OPENAI_MODEL=gpt-5.6-luna
PORT=3000
```

5. Ejecuta:

```bash
npm start
```

6. Abre en el navegador:

`http://localhost:3000`

## Importante

La clave de OpenAI se usa únicamente en el servidor. No se coloca en `public/app.js`.

## Próxima fase

- Editar/eliminar artículos.
- Detalle de cada artículo.
- Crear looks automáticamente con IA.
- Guardar looks.
- Calendario para asignar looks a fechas.
- Favoritos.
- Estadísticas del closet.
- Base de datos real para usar la aplicación desde varios dispositivos.
