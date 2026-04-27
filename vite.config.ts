import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    external: ['@node-rs/argon2', '@node-rs/bcrypt'],
  },
  optimizeDeps: {
    exclude: ['@node-rs/argon2', '@node-rs/bcrypt'],
  },
  build: {
    rollupOptions: {
      external: ['@node-rs/argon2-wasm32-wasi'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack/react-query')) return 'tanstack-react-query'
            if (id.includes('@tanstack/react-router')) return 'tanstack-react-router'
            if (id.includes('@tanstack/react-form')) return 'tanstack-react-form'
            if (id.includes('@tanstack/react-start')) return 'tanstack-react-start'
            if (id.includes('@tanstack/react-router-ssr-query'))
              return 'tanstack-react-router-ssr-query'
            if (id.includes('react-dom')) return 'react-dom'
            if (id.includes('react')) return 'react'
            if (id.includes('drizzle-orm') || id.includes('postgres'))
              return 'db-vendor'
            return 'vendor'
          }
        },
      },
    },
  },
  plugins: [
    devtools(),
    tanstackStart({
      srcDirectory: 'src',
      router: {
        entry: 'app/router',
        routesDirectory: 'app/routes',
        generatedRouteTree: 'app/routeTree.gen.ts',
      },
      start: {
        entry: 'app/start',
      },
      client: {
        entry: 'app/client',
      },
      sitemap: {
        enabled: true,
        host: 'https://www.ishop.hr',
      },
    }),
    // https://tanstack.com/start/latest/docs/framework/react/guide/hosting
    nitro({
      rollupConfig: {
        external: ['@node-rs/argon2', '@node-rs/bcrypt'],
      },
    }),

    viteReact(),
    babel({
      presets: [
        reactCompilerPreset({
          target: '19',
        }),
      ],
    }),

    tailwindcss(),
  ],
})
