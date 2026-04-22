const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// 192x192 transparent PNG base64 (actually just a 1x1 pixel for simplicity, 
// but it's better to provide a true transparent or simple solid color PNG). 
// Here's a 1x1 transparent PNG:
const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const buf = Buffer.from(b64, 'base64');

fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), buf);
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), buf);

console.log('Icons created in /public');
