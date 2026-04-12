import { createClient } from "redis";

type AppRedisClient = ReturnType<typeof createClient>;

type RedisGlobalState = {
  client?: AppRedisClient;
  connectPromise?: Promise<AppRedisClient | null>;
  lastConnectAttemptMs?: number;
  lastWarningMs?: number;
};

const globalForRedis = globalThis as unknown as RedisGlobalState;
const REDIS_URL = process.env.REDIS_URL?.trim();
const CONNECT_RETRY_WINDOW_MS = 10_000;
const WARNING_COOLDOWN_MS = 15_000;

function shouldUseRedis() {
  return Boolean(REDIS_URL);
}

function warnRedis(message: string, error?: unknown) {
  const now = Date.now();
  if (
    globalForRedis.lastWarningMs &&
    now - globalForRedis.lastWarningMs < WARNING_COOLDOWN_MS
  ) {
    return;
  }
  globalForRedis.lastWarningMs = now;
  console.warn("[redis]", message, error);
}

function getOrCreateClient() {
  if (!globalForRedis.client) {
    const client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 1_500,
      },
    });

    client.on("error", (error) => {
      warnRedis("Client error", error);
    });

    globalForRedis.client = client;
  }

  return globalForRedis.client;
}

async function getRedisClient(): Promise<AppRedisClient | null> {
  if (!shouldUseRedis()) {
    return null;
  }

  const now = Date.now();
  if (
    !globalForRedis.connectPromise &&
    globalForRedis.lastConnectAttemptMs &&
    now - globalForRedis.lastConnectAttemptMs < CONNECT_RETRY_WINDOW_MS
  ) {
    return globalForRedis.client?.isReady ? globalForRedis.client : null;
  }

  const client = getOrCreateClient();
  if (client.isReady) {
    return client;
  }

  if (!globalForRedis.connectPromise) {
    globalForRedis.lastConnectAttemptMs = now;
    globalForRedis.connectPromise = client
      .connect()
      .then(() => client)
      .catch((error) => {
        warnRedis("Unable to connect", error);
        return null;
      })
      .finally(() => {
        globalForRedis.connectPromise = undefined;
      });
  }

  return globalForRedis.connectPromise;
}

export async function redisGet(key: string): Promise<string | null> {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    return await client.get(key);
  } catch (error) {
    warnRedis(`GET failed for key ${key}`, error);
    return null;
  }
}

export async function redisSetEx(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  try {
    const result = await client.set(key, value, { EX: ttlSeconds });
    return result === "OK";
  } catch (error) {
    warnRedis(`SET EX failed for key ${key}`, error);
    return false;
  }
}

export type RedisSetNxStatus = "acquired" | "exists" | "unavailable";

export async function redisSetNxEx(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<RedisSetNxStatus> {
  const client = await getRedisClient();
  if (!client) return "unavailable";

  try {
    const result = await client.set(key, value, { EX: ttlSeconds, NX: true });
    return result === "OK" ? "acquired" : "exists";
  } catch (error) {
    warnRedis(`SET NX EX failed for key ${key}`, error);
    return "unavailable";
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const raw = await redisGet(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    warnRedis(`JSON parse failed for key ${key}`, error);
    return null;
  }
}

export function isRedisConfigured() {
  return shouldUseRedis();
}
