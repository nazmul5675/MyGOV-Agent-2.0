import "server-only";

import { MongoClient } from "mongodb";

type MutableGlobal = typeof globalThis & {
  __mygovMongoClientPromise__?: Promise<MongoClient>;
};

export class MongoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MongoConfigError";
  }
}

function getMongoUri() {
  const value = process.env.MONGODB_URI?.trim();

  if (!value) {
    throw new MongoConfigError(
      "MongoDB is not configured. Add MONGODB_URI to your environment variables."
    );
  }

  return value;
}

export function getMongoDbName() {
  return (
    process.env.MONGODB_DB_NAME?.trim() ||
    process.env.MONGODB_DB?.trim() ||
    "mygov_agent_2"
  );
}

export function getMongoClient() {
  const mutableGlobal = globalThis as MutableGlobal;

  if (!mutableGlobal.__mygovMongoClientPromise__) {
    const client = new MongoClient(getMongoUri());
    mutableGlobal.__mygovMongoClientPromise__ = client.connect();
  }

  return mutableGlobal.__mygovMongoClientPromise__;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}
