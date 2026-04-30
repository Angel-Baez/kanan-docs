import { z } from 'zod';

const schema = z.object({
  MONGODB_URI: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  WEB_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32).default('kanan-dev-secret-change-in-production-!!'),
  JWT_REFRESH_SECRET: z.string().min(32).default('kanan-dev-refresh-secret-change-in-prod!'),
});

export const env = schema.parse(process.env);
