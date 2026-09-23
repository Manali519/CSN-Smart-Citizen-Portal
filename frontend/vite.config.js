import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const certPath = path.resolve(process.cwd(), 'certs', 'localhost+1.pem');
const keyPath = path.resolve(process.cwd(), 'certs', 'localhost+1-key.pem');
const hasLocalCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.PORT || '3000');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port,
      strictPort: true,
      https: hasLocalCert
        ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          }
        : false,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port,
      strictPort: true,
      https: hasLocalCert
        ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          }
        : false,
    },
  };
});
