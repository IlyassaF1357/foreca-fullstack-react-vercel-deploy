import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import { logger } from './utils/logger.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

/**
 * Membuat instance Express app. Dipisah dari server agar mudah di-test
 * (supertest mengimpor app tanpa harus listen ke port).
 */
export function createApp() {
  const app = express();

  // Keamanan dasar header HTTP.
  app.use(helmet());

  // CORS: hanya izinkan origin frontend yang dikonfigurasi.
  app.use(
    cors({
      origin(origin, cb) {
        // Izinkan tools tanpa origin (curl/Postman) dan origin yang terdaftar.
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin tidak diizinkan oleh CORS: ${origin}`));
      },
    })
  );

  // Body parser JSON (untuk endpoint non-multipart bila ada).
  app.use(express.json({ limit: '1mb' }));

  // Logging request ringan.
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });

  // Root info.
  app.get('/', (_req, res) => {
    res.json({
      service: 'Foreca Backend (BFF)',
      version: '1.0.0',
      endpoints: ['/api/health', '/api/model-info', '/api/inspect', '/api/analyze', '/api/history'],
    });
  });

  // API.
  app.use('/api', apiRouter);

  // 404 + error handler (harus paling akhir).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
