import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './lib/db.js';
import { registerAuthRoutes } from './routes/authRoutes.js';
import { registerCompanyRoutes } from './routes/companyRoutes.js';
import { registerProductRoutes } from './routes/productRoutes.js';
import { registerSellerRoutes } from './routes/sellerRoutes.js';
import { registerUserRoutes } from './routes/userRoutes.js';

const PORT = process.env.PORT || 3001;

function registerFrontend(app) {
  const distPath = path.resolve(process.cwd(), '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function startServer() {
  const app = express();

  await initDb();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  registerProductRoutes(app);
  registerUserRoutes(app);
  registerAuthRoutes(app);
  registerSellerRoutes(app);
  registerCompanyRoutes(app);

  if (process.env.NODE_ENV === 'production') {
    registerFrontend(app);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
