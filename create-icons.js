const fs = require('fs');
const path = require('path');

// Criar um ícone simples em formato PNG usando canvas (se disponível)
// Como fallback, vamos criar um arquivo SVG que pode ser usado como ícone

const createIcon = (size) => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${size/8}"/>
  <rect x="${size/8}" y="${size/4}" width="${size*3/4}" height="${size/16}" fill="white" rx="${size/32}"/>
  <rect x="${size/8}" y="${size/3}" width="${size*5/8}" height="${size/16}" fill="white" rx="${size/32}"/>
  <rect x="${size/8}" y="${size/2}" width="${size/2}" height="${size/16}" fill="white" rx="${size/32}"/>
  <rect x="${size/8}" y="${size*2/3}" width="${size*3/8}" height="${size/16}" fill="white" rx="${size/32}"/>
  <circle cx="${size*3/4}" cy="${size*11/24}" r="${size/12}" fill="white"/>
  <text x="${size*3/4}" y="${size*11/24 + size/24}" text-anchor="middle" fill="#2563eb" font-family="Arial, sans-serif" font-size="${size/8}" font-weight="bold">A</text>
</svg>`;
  
  return svg;
};

// Criar ícones SVG
fs.writeFileSync('public/icon-192x192.svg', createIcon(192));
fs.writeFileSync('public/icon-512x512.svg', createIcon(512));

// Para compatibilidade, também criar como PNG (usando data URI)
const createPNGDataURI = (size) => {
  // Um ícone simples em base64 (1x1 pixel azul)
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
};

// Criar arquivos de placeholder
fs.writeFileSync('public/icon-192x192.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
fs.writeFileSync('public/icon-512x512.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));

console.log('Ícones criados com sucesso!');
