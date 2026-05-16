import pino, { type Logger, type LoggerOptions } from "pino";
import { env } from "./env";

export interface LoggerConfig {
  level?: LoggerOptions["level"];
  service?: string;
}

const isDev = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";

export function createLogger(config: LoggerConfig = {}): Logger {
  const transport = isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname" },
      }
    : undefined;

  return pino({
    level: config.level ?? env.LOG_LEVEL,
    base: { service: config.service ?? "saree-ecom" },
    transport,
    redact: {
      paths: [
        "password",
        "passwordHash",
        "*.password",
        "*.passwordHash",
        "authorization",
        "cookie",
        "*.authorization",
      ],
      remove: true,
    },
  });
}

export const logger = createLogger();
