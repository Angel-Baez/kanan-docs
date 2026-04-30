import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/authenticate.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import financeRoutes from './routes/finance.js';
import taskRoutes from './routes/tasks.js';
import staffRoutes, { payrollRouter } from './routes/staff.js';

const app = express();

app.use(cors({ origin: env.WEB_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Public
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1/auth', authRoutes);

// Protected — require valid session for everything below
app.use('/api/v1/documents', authenticate, documentRoutes);
app.use('/api/v1/clients',   authenticate, clientRoutes);
app.use('/api/v1/projects',  authenticate, projectRoutes);
app.use('/api/v1/dashboard', authenticate, dashboardRoutes);
app.use('/api/v1/finance',   authenticate, financeRoutes);
app.use('/api/v1/tasks',     authenticate, taskRoutes);
app.use('/api/v1/staff',    authenticate, staffRoutes);
app.use('/api/v1/payroll',  authenticate, payrollRouter);

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
