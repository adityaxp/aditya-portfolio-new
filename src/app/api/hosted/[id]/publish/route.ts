import { NextRequest, NextResponse } from "next/server";
import { isAnalyticsAuthenticated } from "@/lib/analyticsAuth";
import { MAX_HOSTED_FILES } from "@/lib/hosted";
import { hostedDoc, isSameOrigin } from "@/lib/hostedServer";

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

  const files = await ref.collection("files").get();
  if (files.empty || files.size > MAX_HOSTED_FILES ||
      (item.data()?.kind === "file" && files.size !== 1)) {
    return NextResponse.json({ error: "Invalid file count" }, { status: 400 });
  }

  await ref.update({
    status: "ready",
    fileCount: files.size,
    totalBytes: files.docs.reduce((total, file) => total + file.data().size, 0),
  });
  return NextResponse.json({ success: true });
}
