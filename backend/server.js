const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distServer = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(distServer)) {
    console.log('[server.js] dist/server.js not found, running TypeScript build...');
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('[server.js] Build complete.');
}

require(distServer);
