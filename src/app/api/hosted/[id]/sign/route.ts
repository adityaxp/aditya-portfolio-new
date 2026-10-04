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

  const body = (await req.json().catch(() => null)) as
    | { path?: unknown; size?: unknown; contentType?: unknown }
    | null;
  const path = body?.path;
  const size = body?.size;
  const contentType = body?.contentType;
  if (
    typeof path !== "string" || !isHostedPath(path) ||
    typeof size !== "number" || !Number.isSafeInteger(size) ||
    size < 0 || size > MAX_HOSTED_FILE_BYTES ||
    typeof contentType !== "string" || contentType.length > 150 ||
    !/^[\w.+-]+\/[\w.+-]+$/.test(contentType)
  ) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const storagePath = `hosted/${id}/${fileDocId(path)}`;
  const [url] = await storageBucket.file(storagePath).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 60 * 60 * 1000,
    contentType,
  });
  return NextResponse.json({ url });
}
