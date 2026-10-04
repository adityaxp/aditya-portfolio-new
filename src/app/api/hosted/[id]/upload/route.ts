import { NextRequest, NextResponse } from "next/server";
import { isAnalyticsAuthenticated } from "@/lib/analyticsAuth";
import { storageBucket } from "@/lib/firebaseAdmin";
import { isHostedPath, MAX_PROXY_UPLOAD_BYTES } from "@/lib/hosted";
import { fileDocId, hostedDoc, isSameOrigin } from "@/lib/hostedServer";

export const runtime = "nodejs";

export async function PUT(
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
  const path = req.nextUrl.searchParams.get("path");
  if (!ref || !path || !isHostedPath(path)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const item = await ref.get();
  if (!item.exists || item.data()?.status !== "uploading") {
    return NextResponse.json({ error: "Upload is unavailable" }, { status: 404 });
  }

  const lengthHeader = req.headers.get("content-length");
  const declaredSize = lengthHeader === null ? null : Number(lengthHeader);
  const contentType = req.headers.get("content-type") || "application/octet-stream";
  if (
    (declaredSize !== null &&
      (!Number.isSafeInteger(declaredSize) || declaredSize < 0 ||
        declaredSize > MAX_PROXY_UPLOAD_BYTES)) ||
    contentType.length > 150 || !/^[\w.+-]+\/[\w.+-]+$/.test(contentType)
  ) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.length > MAX_PROXY_UPLOAD_BYTES ||
      (declaredSize !== null && bytes.length !== declaredSize)) {
    return NextResponse.json({ error: "Incomplete upload" }, { status: 400 });
  }

  const storagePath = `hosted/${id}/${fileDocId(path)}`;
  try {
    await storageBucket.file(storagePath).save(bytes, {
      resumable: false,
      metadata: { contentType },
    });
  } catch (error) {
    console.error("Hosted upload failed", error);
    return NextResponse.json(
      { error: "Storage write failed. Check the service account's bucket access." },
      { status: 502 },
    );
  }
  return NextResponse.json({ success: true });
}
