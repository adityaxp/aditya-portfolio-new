import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { HOSTED_COLLECTION } from "@/lib/hosted";
import { isSameOrigin, serializeHostedItem } from "@/lib/hostedServer";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await db
    .collection(HOSTED_COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return NextResponse.json({
    items: await Promise.all(snapshot.docs.map(async (doc) => {
      const item = serializeHostedItem(doc.id, doc.data());
      if (item.kind === "file" && item.status === "ready" && !item.previewPath) {
        const file = await doc.ref.collection("files").limit(1).get();
        item.previewPath = file.docs[0]?.data().path;
        item.previewContentType = file.docs[0]?.data().contentType;
      }
      return item;
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
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
