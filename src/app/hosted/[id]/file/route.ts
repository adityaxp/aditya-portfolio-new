import { NextRequest, NextResponse } from "next/server";
import { storageBucket } from "@/lib/firebaseAdmin";
import { isHostedPath, type HostedFile } from "@/lib/hosted";
import { fileDocId, hostedDoc } from "@/lib/hostedServer";
import { recordHostedDownload } from "@/lib/hostedDownloads";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const path = req.nextUrl.searchParams.get("path");
  const ref = hostedDoc(id);
  if (!ref || !path || !isHostedPath(path)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await ref.get();
  if (!item.exists || item.data()?.status !== "ready") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fileSnapshot = await ref.collection("files").doc(fileDocId(path)).get();
  const file = fileSnapshot.data() as HostedFile | undefined;
  if (!file || file.path !== path || !file.storagePath.startsWith(`hosted/${id}/`)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const inline = req.nextUrl.searchParams.get("inline") === "1" &&
    (file.contentType === "application/pdf" || file.contentType.startsWith("image/"));
  const filename = path.split("/").at(-1) || "download";
  const safeFilename = filename.replace(/["\\\r\n]/g, "_");
  const [url] = await storageBucket.file(file.storagePath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000,
    responseDisposition: `${inline ? "inline" : "attachment"}; filename="${safeFilename}"`,
  });
  const response = NextResponse.redirect(url, 302);
  response.headers.set("Cache-Control", "private, no-store");
  if (!inline) {
    await recordHostedDownload(req, response, ref, "file", path);
  }
  return response;
}
