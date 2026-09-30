import { Generator, getConfig } from '@tanstack/router-generator';
const root = process.cwd();
await new Generator({ root, config: getConfig({ target: 'react', routeToken: 'layout', indexToken: 'page' }, root) }).run();
