import dotenv from 'dotenv';

dotenv.config();

const rawPort = process.env.PORT ?? '3001';
const parsedPort = Number.parseInt(rawPort, 10);

export const env = {
  port: Number.isNaN(parsedPort) ? 3001 : parsedPort,
  nodeEnv: process.env.NODE_ENV ?? 'development'
};