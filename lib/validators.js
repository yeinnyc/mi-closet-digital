export const CATEGORIES = [
  'Busos','Camisas','Pantalones','Jeans','Vestidos','Faldas',
  'Chaquetas','Zapatos','Bolsos','Accesorios','Otros'
];

export function cleanText(value) {
  return String(value ?? '').trim();
}

export function validateItemPayload(data, requireImage = false) {
  const name = cleanText(data.name);
  const category = cleanText(data.category);
  const color = cleanText(data.color);
  const description = cleanText(data.description);
  if (!name) throw new Error('El nombre del artÃ­culo es obligatorio.');
  if (!CATEGORIES.includes(category)) throw new Error('La categorÃ­a del artÃ­culo no es vÃ¡lida.');
  if (!color) throw new Error('El color del artÃ­culo es obligatorio.');
  if (requireImage && !data.imageBase64) throw new Error('La foto de frente es obligatoria.');
  return { name, category, color, description };
}

export function normalizeId(value) {
  const id = cleanText(value);
  return id || null;
}

export function normalizeAccessories(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeId).filter(Boolean))];
}

export function validateLookAgainstCloset(look, items) {
  const available = new Map(items.map(item => [String(item.id), item]));
  const ids = [look.top, look.jacket, look.bottom, look.onePiece, look.shoes, look.bag, ...normalizeAccessories(look.accessories)]
    .map(normalizeId).filter(Boolean);
  if (!ids.length) throw new Error('El look no contiene prendas.');
  const missing = ids.filter(id => !available.has(String(id)));
  if (missing.length) throw new Error(`El look contiene artÃ­culos inexistentes: ${missing.join(', ')}`);
  const onePiece = normalizeId(look.onePiece);
  const top = normalizeId(look.top);
  const bottom = normalizeId(look.bottom);
  if (onePiece && (top || bottom)) throw new Error('Un look con vestido no puede tener superior o inferior.');
  return true;
}

export function sanitizeAiLook(look, items) {
  const available = new Set(items.map(item => String(item.id)));

  function extractId(value) {
    const text = cleanText(value);
    if (!text) return '';

    const match = text.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    return match ? match[0] : '';
  }

  const fields = ['top','jacket','bottom','onePiece','shoes','bag'];

  const cleaned = {
    name: cleanText(look?.name),
    description: cleanText(look?.description),
    styling: cleanText(look?.styling),
    top: '',
    jacket: '',
    bottom: '',
    onePiece: '',
    shoes: '',
    bag: '',
    accessories: []
  };

  for (const field of fields) {
    const id = extractId(look?.[field]);
    cleaned[field] = id && available.has(String(id)) ? id : '';
  }

  cleaned.accessories = (Array.isArray(look?.accessories) ? look.accessories : [])
    .map(extractId)
    .filter(id => available.has(String(id)));

  if (!cleaned.name) {
    throw new Error('La IA devolvió un look sin nombre.');
  }

  if (
    !cleaned.top &&
    !cleaned.jacket &&
    !cleaned.bottom &&
    !cleaned.onePiece &&
    !cleaned.shoes &&
    !cleaned.bag &&
    !cleaned.accessories.length
  ) {
    throw new Error(`La IA devolvió un look vacío: ${cleaned.name}`);
  }

  if (cleaned.onePiece) {
    cleaned.top = '';
    cleaned.bottom = '';
  }

  return cleaned;
}

