import corePackage from "../../packages/energy-core/package.json" with { type: "json" };
// @ts-check
import { defineConfig } from 'astro/config';
import cesium from 'vite-plugin-cesium';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import pkg from './package.json' with { type: 'json' };

/** @type {import('astro').AstroIntegration} */
const initializeClientI18next = {
  name: 'initialize-client-i18next',
  hooks: {
    'astro:config:setup': ({ injectScript }) => {
      injectScript('before-hydration', `import '@/i18n/client';`);
    },
  },
};

const developmentRoutes = {
  name: 'development-routes',
  configureServer(
    /** @type {{ middlewares: { use: (handler: (request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse, next: () => void) => void) => void } }} */ server,
  ) {
    server.middlewares.use((request, response, next) => {
      if (!request.url) return next();

      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/') {
        const locale = /^de/i.test(request.headers['accept-language'] ?? '')
          ? 'de'
          : 'en';
        response.statusCode = 302;
        response.setHeader('Location', `/${locale}${url.search}`);
        response.end();
        return;
      }

      const neutralMatch = /^\/delete\/([^/]+)$/.exec(url.pathname);
      if (neutralMatch) {
        const locale = /^de/i.test(request.headers['accept-language'] ?? '')
          ? 'de'
          : 'en';
        response.statusCode = 302;
        response.setHeader(
          'Location',
          `/${locale}/delete/${neutralMatch[1]}${url.search}`,
        );
        response.end();
        return;
      }

      const localizedMatch = /^\/(de|en)\/delete\/[^/]+$/.exec(url.pathname);
      if (localizedMatch) {
        request.url = `/${localizedMatch[1]}/delete${url.search}`;
      }
      next();
    });
  },
};

// https://astro.build/config
export default defineConfig({
  integrations: [react(), initializeClientI18next],
  i18n: {
    defaultLocale: 'en',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
      fallbackType: 'redirect',
    },
  },
  vite: {
    plugins: [developmentRoutes, cesium({}), tailwindcss()],
    define: {
      // react-draggable >=4.6.0 references process.env.DRAGGABLE_DEBUG at
      // runtime; without this define `process` is undefined in the browser
      // and dragging throws "process is not defined".
      'process.env.DRAGGABLE_DEBUG': 'false',
      __FRONTEND_VERSION__: JSON.stringify(pkg.version),
      __CORE_VERSION__: JSON.stringify(
        corePackage.version,
      ),
    },
    optimizeDeps: {
      include: ['cesium', 'resium'],
    },
    server: {
      proxy: {
        '/api': 'http://apisix:9080',
      },
    },
  },
});
