// Compatibility proxy mapping to stockService.ts
module.exports = require('./stockService.ts').default || require('./stockService.ts');
