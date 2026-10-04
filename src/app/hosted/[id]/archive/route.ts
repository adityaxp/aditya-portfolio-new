import { ZipArchive } from "archiver";
import { finished } from "node:stream/promises";
import { NextRequest, NextResponse } from "next/server";
import { storageBucket } from "@/lib/firebaseAdmin";
import { isHostedPath, type HostedFile } from "@/lib/hosted";
import { hostedDoc } from "@/lib/hostedServer";
import { recordHostedDownload } from "@/lib/hostedDownloads";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ref = hostedDoc(id);
  if (!ref) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await ref.get();
  if (!item.exists || item.data()?.status !== "ready" || item.data()?.kind !== "folder") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const archiveFile = storageBucket.file(`hosted/${id}/archive.zip`);
  try {
    const [exists] = await archiveFile.exists();
    if (!exists) {
      const snapshot = await ref.collection("files").get();
      if (snapshot.empty) {
        return NextResponse.json({ error: "Folder is empty" }, { status: 404 });
      }

      const files = snapshot.docs
        .map((doc) => doc.data() as HostedFile)
        .sort((a, b) => a.path.localeCompare(b.path));
      if (files.some((file) => !isHostedPath(file.path) ||
          !file.storagePath.startsWith(`hosted/${id}/`))) {
        return NextResponse.json({ error: "Invalid folder contents" }, { status: 500 });
      }

      const zip = new ZipArchive({ zlib: { level: 6 } });
      const destination = archiveFile.createWriteStream({
        resumable: true,
        metadata: { contentType: "application/zip" },
      });
      const uploadDone = finished(destination);
      void uploadDone.catch(() => {});
      zip.on("error", (error) => destination.destroy(error));
      zip.on("warning", (error) => destination.destroy(error));
      zip.pipe(destination);
      for (const file of files) {
        const source = storageBucket.file(file.storagePath).createReadStream();
        source.on("error", (error) => destination.destroy(error));
        zip.append(source, { name: file.path });
      }

      try {
        await Promise.all([zip.finalize(), uploadDone]);
      } catch (error) {
        zip.abort();
        destination.destroy();
        await uploadDone.catch(() => {});
        throw error;
      }
    }

    const filename = String(item.data()?.title || "folder")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 100) || "folder";
    const [url] = await archiveFile.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: `attachment; filename="${filename}.zip"`,
    });
    const response = NextResponse.redirect(url, 302);
    response.headers.set("Cache-Control", "private, no-store");
    await recordHostedDownload(req, response, ref, "folder", null);
    return response;
  } catch (error) {
    console.error("Hosted archive failed", error);
    return NextResponse.json({ error: "Could not prepare the folder download" }, { status: 500 });
  }
}
