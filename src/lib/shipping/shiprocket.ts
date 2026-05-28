import "server-only";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getDdbDoc } from "@/lib/db/client";
import { tableName, TABLES } from "@/lib/db/tables";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Thin client for Shiprocket's external API — just the read-only pieces we
// need for live checkout rates (auth + courier serviceability). Shipment
// booking lands in a later phase once KYC + wallet are set up.
const BASE = "https://apiv2.shiprocket.in/v1/external";

// Shiprocket tokens are valid ~10 days, and Shiprocket THROTTLES repeated
// logins — so we must authenticate rarely and reuse the token. We cache it in
// two layers: an in-process variable (fast path) and the DynamoDB Ephemeral
// table (durable, shared across server restarts + serverless instances). With
// the DDB layer we only hit the login endpoint roughly once every 9 days,
// which keeps us well clear of the throttle.
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // 9 days, under the ~10-day life
const TOKEN_PK = "SHIPROCKET#TOKEN";
const TOKEN_SK = "META";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}
let memCache: CachedToken | null = null;

export interface ShiprocketCourier {
  courierName: string;
  ratePaise: number;
  etaDays: number;
}

function isConfigured(): boolean {
  return Boolean(env.SHIPROCKET_EMAIL && env.SHIPROCKET_PASSWORD && env.SHIPROCKET_PICKUP_PINCODE);
}

function ephemeralTable(): string {
  return tableName(TABLES.Ephemeral);
}

// L2 read — shared token from DynamoDB, surviving restarts.
async function loadTokenFromDdb(): Promise<CachedToken | null> {
  try {
    const res = await getDdbDoc().send(
      new GetCommand({ TableName: ephemeralTable(), Key: { pk: TOKEN_PK, sk: TOKEN_SK } }),
    );
    const token = res.Item?.token as string | undefined;
    const expiresAt = res.Item?.expiresAtMs as number | undefined;
    if (token && expiresAt && expiresAt > Date.now()) {
      return { token, expiresAt };
    }
  } catch (err) {
    logger.warn({ err }, "Shiprocket token DDB read failed");
  }
  return null;
}

async function saveTokenToDdb(entry: CachedToken): Promise<void> {
  try {
    await getDdbDoc().send(
      new PutCommand({
        TableName: ephemeralTable(),
        Item: {
          pk: TOKEN_PK,
          sk: TOKEN_SK,
          token: entry.token,
          expiresAtMs: entry.expiresAt,
          // DDB TTL attribute (epoch seconds) — auto-evicts after expiry.
          expiresAt: Math.floor(entry.expiresAt / 1000),
        },
      }),
    );
  } catch (err) {
    logger.warn({ err }, "Shiprocket token DDB write failed");
  }
}

async function getToken(): Promise<string | null> {
  if (!env.SHIPROCKET_EMAIL || !env.SHIPROCKET_PASSWORD) return null;

  // L1: in-process.
  if (memCache && memCache.expiresAt > Date.now()) return memCache.token;

  // L2: DynamoDB (survives restarts; shared across instances).
  const fromDdb = await loadTokenFromDdb();
  if (fromDdb) {
    memCache = fromDdb;
    return fromDdb.token;
  }

  // Cache miss → authenticate (rare).
  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD }),
      cache: "no-store",
    });
    if (!res.ok) {
      logger.error({ status: res.status }, "Shiprocket auth failed");
      return null;
    }
    const json = (await res.json()) as { token?: string };
    if (!json.token) return null;
    const entry: CachedToken = { token: json.token, expiresAt: Date.now() + TOKEN_TTL_MS };
    memCache = entry;
    await saveTokenToDdb(entry);
    return entry.token;
  } catch (err) {
    logger.error({ err }, "Shiprocket auth threw");
    return null;
  }
}

interface ServiceabilityResponse {
  data?: {
    available_courier_companies?: Array<{
      courier_name?: string;
      rate?: number; // rupees
      etd?: string;
      estimated_delivery_days?: string | number;
    }>;
  };
}

export interface ShiprocketRateInput {
  deliveryPincode: string;
  weightKg: number;
  cod: boolean;
}

// Returns the courier options Shiprocket can service for this pincode, or null
// when Shiprocket isn't configured / is unreachable / can't service the area.
// Null is the signal for callers to fall back to flat rates — checkout never
// breaks because of a Shiprocket hiccup.
export async function fetchShiprocketCouriers(
  input: ShiprocketRateInput,
): Promise<ShiprocketCourier[] | null> {
  if (!isConfigured()) return null;
  const token = await getToken();
  if (!token) return null;

  const params = new URLSearchParams({
    pickup_postcode: env.SHIPROCKET_PICKUP_PINCODE!,
    delivery_postcode: input.deliveryPincode,
    // Shiprocket expects weight in kg, minimum 0.5.
    weight: String(Math.max(0.5, input.weightKg)),
    cod: input.cod ? "1" : "0",
  });

  try {
    const res = await fetch(`${BASE}/courier/serviceability/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      logger.warn(
        { status: res.status, pincode: input.deliveryPincode },
        "Shiprocket serviceability non-200",
      );
      return null;
    }
    const json = (await res.json()) as ServiceabilityResponse;
    const companies = json.data?.available_courier_companies ?? [];
    const couriers: ShiprocketCourier[] = companies
      .map((c) => {
        const rate = typeof c.rate === "number" ? c.rate : NaN;
        const etaRaw = c.estimated_delivery_days ?? c.etd;
        const eta = Number(etaRaw);
        return {
          courierName: c.courier_name ?? "Courier",
          ratePaise: Math.round(rate * 100),
          etaDays: Number.isFinite(eta) && eta > 0 ? Math.round(eta) : 5,
        };
      })
      .filter((c) => Number.isFinite(c.ratePaise) && c.ratePaise >= 0);

    return couriers.length > 0 ? couriers : null;
  } catch (err) {
    logger.error({ err, pincode: input.deliveryPincode }, "Shiprocket serviceability threw");
    return null;
  }
}
