import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CATALOGUE = resolve(import.meta.dirname, 'src/data/products.json')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-url-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/admin' || req.url === '/admin/') {
            req.url = '/admin/index.html'
          }
          next()
        })
      },
    },

    /*  The catalogue, published at ONE stable unhashed URL.

        The JSON is also imported by the bundle, but a bundled copy is
        only as fresh as the last build the visitor's browser actually
        downloaded — and the browser holds the hashed bundle for a year.
        So a publish would reach a second device only after a rebuild
        AND a cache miss on the entry HTML, which is why devices sat on
        stale catalogues indefinitely.

        Emitting it separately gives the client something it can re-read
        at any time, under a name that never changes. */
    {
      name: 'catalogue-endpoint',
      configureServer(server) {
        /*  Dev has no build output, so it is served from source — and
            read per request, so editing the file shows up on reload. */
        server.middlewares.use((req, res, next) => {
          if (req.url?.split('?')[0] !== '/products.json') return next()
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(readFileSync(CATALOGUE, 'utf-8'))
        })
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'products.json',
          source: readFileSync(CATALOGUE, 'utf-8'),
        })
      },
    },
  ],

  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },

  build: {
    // Baseline chosen so Vite does not down-compile modern syntax we rely on.
    // Every one of these supports clip-path and CSS custom properties.
    target: ['es2020', 'chrome87', 'safari14', 'firefox78'],
    reportCompressedSize: true,

    /*  A multi-page build rather than a single-page app with a router.
        Two reasons, both load-bearing:

        1. A client-side router would cost roughly 10KB of JavaScript and
           force the threshold page — which currently ships none — to
           carry a routing runtime purely to navigate away from itself.
        2. Real document navigation lets the browser handle the change of
           page natively through cross-document view transitions, which
           run on the compositor and cost nothing.

        Each page therefore downloads only its own code. */
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        casa: resolve(import.meta.dirname, 'casa.html'),
        connect: resolve(import.meta.dirname, 'connect.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        collections: resolve(import.meta.dirname, 'collections.html'),
        range: resolve(import.meta.dirname, 'range.html'),
        product: resolve(import.meta.dirname, 'product.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html'),
      },
    },

    /*  Split per entry, so the threshold page does not download the Casa
        page's stylesheet before it can paint. With a single bundled
        stylesheet the entry page would pay for every section it cannot
        yet show. */
    cssCodeSplit: true,
  },

  /*  The swap this config promised from the start. Component source
      is untouched — preact/compat answers for react and react-dom, so
      every import keeps working. Measured before the switch: 57KB of
      gzipped framework for pages whose only running JavaScript is a
      1KB IntersectionObserver. The specific alias for react-dom/client
      must precede the bare react-dom one, or createRoot resolves
      against the wrong entry. */
  resolve: {
    alias: [
      { find: 'react-dom/client', replacement: 'preact/compat/client' },
      { find: 'react-dom', replacement: 'preact/compat' },
      { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' },
      { find: 'react', replacement: 'preact/compat' },
    ],
  },
})
