import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'parallax-telemetry-server',
      configureServer(server) {
        server.middlewares.use('/api/parallax/save-telemetry', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const parallaxDir = path.resolve('.parallax');
                if (!fs.existsSync(parallaxDir)) {
                  fs.mkdirSync(parallaxDir, { recursive: true });
                }
                fs.writeFileSync(
                  path.join(parallaxDir, 'session.json'),
                  JSON.stringify(data.telemetry || data, null, 2),
                  'utf-8'
                );
                if (data.notes) {
                  fs.writeFileSync(
                    path.join(parallaxDir, 'notes.json'),
                    JSON.stringify(data.notes, null, 2),
                    'utf-8'
                  );
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, saved: true }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end();
          }
        });
      },
    },
  ],
  server: {
    port: 3000,
    open: false,
  },
});

