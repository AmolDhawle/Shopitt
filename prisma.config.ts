import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// const DATABASE_URL = process.env.DATABASE_URL;

// if (!DATABASE_URL) throw new Error("DATABASE_URL must be defined");

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL')!, // Prisma CLI now reads this for migrations & client
  },
});
