import { NextRequest, NextResponse } from "next/server";
import { isAnalyticsAuthenticated } from "@/lib/analyticsAuth";
import { storageBucket } from "@/lib/firebaseAdmin";
import { MAX_HOSTED_FILE_BYTES, isHostedPath } from "@/lib/hosted";
import { fileDocId, hostedDoc, isSameOrigin } from "@/lib/hostedServer";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAnalyticsAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const { id } = await params;
  const ref = hostedDoc(id);
  if (!ref) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await ref.get();
  if (!item.exists || item.data()?.status !== "uploading") {
    return NextResponse.json({ error: "Upload is unavailable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { path?: unknown } | null;
  const path = body?.path;
  if (typeof path !== "string" || !isHostedPath(path)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const storagePath = `hosted/${id}/${fileDocId(path)}`;
  const file = storageBucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists) return NextResponse.json({ error: "File missing" }, { status: 404 });

  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_HOSTED_FILE_BYTES) {
    await file.delete();
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  await ref.collection("files").doc(fileDocId(path)).set({
    path,
    storagePath,
    size,
    contentType: metadata.contentType || "application/octet-stream",
  });
  return NextResponse.json({ success: true });
}
