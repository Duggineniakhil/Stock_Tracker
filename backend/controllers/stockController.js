// Compatibility proxy mapping to stockController.ts
module.exports = require('./stockController.ts').default || require('./stockController.ts');
