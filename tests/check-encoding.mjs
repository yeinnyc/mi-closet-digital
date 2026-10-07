import fs from 'fs';
import path from 'path';

const files = [
  'server.js',
  'public/index.html',
  'public/styles.css',
  'public/js/api.js',
  'public/js/app.js',
  'public/js/catalogo.js',
  'public/js/looks.js',
  'public/js/asesoria.js',
  'lib/google-api.js',
  'lib/openai-service.js',
  'lib/validators.js'
];

const badPatterns = ['Ã', 'Â', '�'];
const errors = [];

for (const file of files) {
  const full = path.resolve(file);
  const buffer = fs.readFileSync(full);

  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    errors.push(`${file}: contiene BOM; debe ser UTF-8 sin BOM.`);
  }

  const text = buffer.toString('utf8');
  for (const pattern of badPatterns) {
    if (text.includes(pattern)) {
      errors.push(`${file}: contiene texto con posible corrupción de codificación (${JSON.stringify(pattern)}).`);
      break;
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('OK: codificación UTF-8 validada.');
