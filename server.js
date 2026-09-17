import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'items.json');

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(UPLOADS_DIR, { recursive: true });
try { await fs.access(DATA_FILE); } catch { await fs.writeFile(DATA_FILE, '[]', 'utf8'); }

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

async function readItems() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeItems(items) {
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function extensionFromMime(mime) {
  return mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
}

function cleanAiResult(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

app.get('/api/items', async (_req, res) => {
  try {
    res.json(await readItems());
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron cargar los artículos.' });
  }
});

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Selecciona una imagen.' });
    if (!client) {
      return res.status(503).json({
        error: 'Falta OPENAI_API_KEY. Configura tu clave en el archivo .env y reinicia la aplicación.'
      });
    }

    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

    const response = await client.responses.create({
      model,
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Analiza la fotografía del artículo de mi armario. Devuelve SOLO un JSON válido con estos campos:
{
  "name": "nombre corto y natural del artículo",
  "category": "una de: Blusas, Camisas, Pantalones, Jeans, Vestidos, Faldas, Chaquetas, Zapatos, Bolsos, Accesorios, Otros",
  "color": "color principal en español",
  "description": "descripción breve y objetiva del artículo"
}

Reglas:
- Identifica el artículo visible, no inventes detalles que no puedan observarse.
- Si hay varios objetos, identifica el objeto principal del centro de la imagen.
- El nombre debe ser útil para un armario digital, por ejemplo: "Blusa blanca de manga corta".
- La categoría debe ser exactamente una de las opciones indicadas.
- Usa el color principal; si tiene varios colores, indica el dominante y menciona el estampado en la descripción.
- No incluyas precio, talla, marca ni ocasión salvo que sean evidentes; esos campos no hacen parte de esta respuesta.`
          },
          { type: 'input_image', image_url: dataUrl }
        ]
      }]
    });

    const result = cleanAiResult(response.output_text);
    res.json({ ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No fue posible analizar la imagen. Revisa tu clave API y vuelve a intentarlo.' });
  }
});

app.post('/api/items', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'La foto es obligatoria.' });

    const { name, category, color, description } = req.body;
    if (!name || !category || !color) {
      return res.status(400).json({ error: 'Nombre, categoría y color son obligatorios.' });
    }

    const id = crypto.randomUUID();
    const ext = extensionFromMime(req.file.mimetype);
    const filename = `${id}.${ext}`;
    await fs.writeFile(path.join(UPLOADS_DIR, filename), req.file.buffer);

    const item = {
      id,
      name: name.trim(),
      category: category.trim(),
      color: color.trim(),
      description: (description || '').trim(),
      image: `/uploads/${filename}`,
      createdAt: new Date().toISOString()
    };

    const items = await readItems();
    items.unshift(item);
    await writeItems(items);

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar el artículo.' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const items = await readItems();
    const item = items.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado.' });

    const imagePath = path.join(__dirname, item.image.replace(/^\//, ''));
    try { await fs.unlink(imagePath); } catch {}

    await writeItems(items.filter(x => x.id !== req.params.id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'No se pudo eliminar el artículo.' });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MI CLOSET DIGITAL: http://localhost:${PORT}`);
});
