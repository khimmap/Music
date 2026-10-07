import { config as loadEnv } from 'dotenv';

// Load variables from apps/server/.env (if present) into process.env.
loadEnv();

function readNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment value: "${value}"`);
  }
  return parsed;
}

function readString(value: string | undefined, fallback: string): string {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  return value;
}

export interface ServerConfig {
  /** Port the HTTP + Socket.io server listens on. */
  port: number;
  /** Web client origin allowed by CORS (HTTP responses + Socket.io). */
  clientOrigin: string;
}

export const serverConfig: ServerConfig = {
  port: readNumber(process.env.PORT, 4000),
  clientOrigin: readString(process.env.CLIENT_ORIGIN, 'http://localhost:3000'),
};
