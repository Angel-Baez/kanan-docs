import { z } from 'zod';

const schema = z.object({
  MONGODB_URI: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  WEB_URL: z.string().default('http://localhost:5173'),
});

export const env = schema.parse(process.env);
