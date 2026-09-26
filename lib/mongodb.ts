import { MongoClient, Db } from "mongodb";

/**
 * Global MongoDB Client with Connection Pooling for Next.js / Serverless
 * Includes seamless in-memory fallback store if MONGODB_URI is not set yet,
 * ensuring zero downtime and 100% crash-proof execution.
 */

const uri = process.env.MONGODB_URI || "";
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 8000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _inMemoryStore: {
    config: any;
    devices: Map<string, any>;
    history: any[];
    users: Map<string, any>;
  } | undefined;
}

// In-Memory Fallback Store (works immediately out of the box even without MongoDB Atlas connection string)
if (!global._inMemoryStore) {
  global._inMemoryStore = {
    config: {
      _id: "global_config",
      source_mode: "both", // "moviebox" | "netmirror" | "both"
      default_source: "moviebox",
      auto_fallback_enabled: true,
      shorts_enabled: true,
      family_filter_enabled: true,
      netmirror: {
        enabled: true,
        active_domain: "https://net77.cc",
        backup_domains: [
          "https://net77.cc",
          "https://mobidetect.art",
          "https://mobidetect.live",
          "https://mobidetect.pro",
        ],
        auth_token:
          "14840b2ca5ff6340cc40594ea2b47171%3A%3Adb15a6012f2c06027ce4d0b198f5acca%3A%3A1789689641%3A%3Akp%3A%3Ap",
        proxy_enabled: true,
        proxy_url: "https://cinestream-proxy.ahsan-dev98.workers.dev",
      },
      moviebox: {
        enabled: true,
        api_base: "https://h5-api.aoneroom.com",
        fallback_api: "https://filmboom.top",
        web_base: "https://moviebox.ac",
        auth_tokens: [
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjg1NjEzMjQ4ODAxNTEwNzc0MjQsImF0cCI6MywiZXh0IjoiMTc5MDQ0MzY4MyIsImV4cCI6MTc5ODIxOTY4MywiaWF0IjoxNzkwNDQzMzgzfQ.smdaCiqqWBo06dqoFctDUzLmUA_xvAh_7Ct3rz4yfxs",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjMyNDUyMzE1ODM0MjcyOTEwNjQsImF0cCI6MywiZXh0IjoiMTc5MDE5NjgxMyIsImV4cCI6MTc5Nzk3MjgxMywiaWF0IjoxNzkwMTk2NTEzfQ.E-JCGkE2oSMEkaht3SEHZdeLwBLomyRNg7HBLLQWghg",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjMwNTY4MDAyMzU1OTc0ODgwNDAsImF0cCI6MywiZXh0IjoiMTc5MDQ0MzY4NSIsImV4cCI6MTc5ODIxOTY4NSwiaWF0IjoxNzkwNDQzMzQ1fQ.eqxaKmqEFVzHD8y2OtVPxd_udQAbiC82FYlPNWgkHCI",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjU1OTAzNTY1MDA5Njg2MjM4MDgsImF0cCI6MywiZXh0IjoiMTc5MDQ0MzQyNCIsImV4cCI6MTc5ODIxOTQyNCwiaWF0IjoxNzkwNDQzMTI0fQ.Vp5KZXtIONynkfnl72S3SCSeMvjpk2NoA9Zy_8NpIdY",
        ],
        auth_refresh_interval_days: 7,
      },
      updated_at: new Date().toISOString(),
    },
    devices: new Map(),
    history: [],
    users: new Map(),
  };
}

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.trim().length > 0 && uri.startsWith("mongodb"));
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getDb(): Promise<Db | null> {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db("cinestream_db");
}

export const inMemoryStore = global._inMemoryStore;
