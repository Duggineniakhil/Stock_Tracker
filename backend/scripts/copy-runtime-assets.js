const fs = require('fs');
const path = require('path');

const sourceDirectory = path.resolve(__dirname, '..', 'db');
const targetDirectory = path.resolve(__dirname, '..', 'dist', 'db');
const runtimeAssets = ['schema.sql', 'migrations.sql'];

fs.mkdirSync(targetDirectory, { recursive: true });

for (const asset of runtimeAssets) {
  fs.copyFileSync(
    path.join(sourceDirectory, asset),
    path.join(targetDirectory, asset),
  );
}
