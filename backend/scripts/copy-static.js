const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'db');
const distDbDir = path.join(__dirname, '..', 'dist', 'db');

fs.mkdirSync(distDbDir, { recursive: true });

for (const filename of ['schema.sql', 'migrations.sql']) {
  const source = path.join(dbDir, filename);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, path.join(distDbDir, filename));
  }
}
