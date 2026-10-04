import "server-only";

import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { HOSTED_COLLECTION, isHostedId, type HostedItem } from "@/lib/hosted";

export function hostedDoc(id: string) {
  if (!isHostedId(id)) return null;
  return db.collection(HOSTED_COLLECTION).doc(id);
}

export function fileDocId(path: string): string {
  return createHash("sha256").update(path).digest("hex");
}

export function serializeHostedItem(
  id: string,
  data: FirebaseFirestore.DocumentData,
): HostedItem {
  return {
    id,
    title: data.title,
    kind: data.kind,
    status: data.status,
    fileCount: data.fileCount ?? 0,
    totalBytes: data.totalBytes ?? 0,
    downloadCount: data.downloadCount ?? 0,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
  };
}

export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
