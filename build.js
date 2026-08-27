const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(dist, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(dist, 'style.css'));
fs.cpSync(path.join(__dirname, 'src'), path.join(dist, 'src'), { recursive: true });

console.log('✓ Static build complete: dist/ populated with index.html, style.css, and src/');