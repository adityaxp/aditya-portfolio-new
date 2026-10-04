import { NextRequest, NextResponse } from "next/server";
import { isAnalyticsAuthenticated } from "@/lib/analyticsAuth";
import { db } from "@/lib/firebaseAdmin";
import { HOSTED_COLLECTION } from "@/lib/hosted";
import { isSameOrigin, serializeHostedItem } from "@/lib/hostedServer";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAnalyticsAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await db
    .collection(HOSTED_COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return NextResponse.json({
    items: snapshot.docs.map((doc) => serializeHostedItem(doc.id, doc.data())),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAnalyticsAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as
    | { title?: unknown; kind?: unknown }
    | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 120 || !["file", "folder"].includes(String(body?.kind))) {
    return NextResponse.json({ error: "Invalid title or type" }, { status: 400 });
  }

  const ref = db.collection(HOSTED_COLLECTION).doc();
  await ref.set({
    title,
    kind: body?.kind,
    status: "uploading",
    fileCount: 0,
    totalBytes: 0,
    downloadCount: 0,
    createdAt: new Date(),
  });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
