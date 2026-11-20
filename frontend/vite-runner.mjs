import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, createServer, preview } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))
const aliasNames = [
  '@', '@components', '@features', '@hooks', '@lib', '@stores', '@pages',
  '@data', '@assets', '@routes', '@services',
]

const config = {
  configFile: false,
  root,
  plugins: [react()],
  resolve: {
    alias: Object.fromEntries(aliasNames.map((name) => [
      name,
      path.resolve(root, name === '@' ? 'src' : `src/${name.slice(1)}`),
    ])),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
      '/media': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
    },
  },
}

const command = process.argv[2] || 'dev'

if (command === 'build') {
  await build(config)
} else if (command === 'preview') {
  const server = await preview(config)
  server.printUrls()
} else if (command === 'dev') {
  const server = await createServer(config)
  await server.listen()
  server.printUrls()
} else {
  throw new Error(`Unknown Vite command: ${command}`)
}
