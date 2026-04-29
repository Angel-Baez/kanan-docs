import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import documentRoutes from './routes/documents.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import financeRoutes from './routes/finance.js';

const app = express();

app.use(cors({ origin: env.WEB_URL }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/finance', financeRoutes);

app.use(errorHandler);

connectDB(env.MONGODB_URI)
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`API lista en http://localhost:${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });
