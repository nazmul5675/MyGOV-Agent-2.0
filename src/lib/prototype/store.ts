import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import type {
  PrototypeAssistantMessageRecord,
  PrototypeCaseEventRecord,
  PrototypeCaseRecord,
  PrototypeDataset,
  PrototypeFileRecord,
  PrototypeNotificationRecord,
  PrototypeReminderRecord,
  PrototypeUserRecord,
} from "@/types/prototype";

type MutableGlobal = typeof globalThis & {
  __MYGOV_PROTOTYPE_STORE__?: PrototypeDataset;
};

function readJsonFile<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "src", "data", "prototype", filename);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function loadPrototypeState(): PrototypeDataset {
  return {
    users: readJsonFile<PrototypeUserRecord[]>("users.json"),
    cases: readJsonFile<PrototypeCaseRecord[]>("cases.json"),
    caseEvents: readJsonFile<PrototypeCaseEventRecord[]>("case-events.json"),
    files: readJsonFile<PrototypeFileRecord[]>("files.json"),
    notifications: readJsonFile<PrototypeNotificationRecord[]>("notifications.json"),
    reminders: readJsonFile<PrototypeReminderRecord[]>("reminders.json"),
    chatSeeds: readJsonFile<PrototypeAssistantMessageRecord[]>("chat-seeds.json"),
  };
}

export function getPrototypeStore() {
  const mutableGlobal = globalThis as MutableGlobal;
  if (!mutableGlobal.__MYGOV_PROTOTYPE_STORE__) {
    mutableGlobal.__MYGOV_PROTOTYPE_STORE__ = loadPrototypeState();
  }

  return mutableGlobal.__MYGOV_PROTOTYPE_STORE__;
}

export function resetPrototypeStore() {
  const mutableGlobal = globalThis as MutableGlobal;
  mutableGlobal.__MYGOV_PROTOTYPE_STORE__ = loadPrototypeState();
  return mutableGlobal.__MYGOV_PROTOTYPE_STORE__;
}
