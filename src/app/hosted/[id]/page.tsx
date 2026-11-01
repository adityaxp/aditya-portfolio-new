import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatBytes, type HostedFile } from "@/lib/hosted";
import { hostedDoc, serializeHostedItem } from "@/lib/hostedServer";
import AdminIcon from "@/components/admin/AdminIcon";
import "./share.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function HostedItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ref = hostedDoc(id);
  if (!ref) notFound();
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.status !== "ready") notFound();

  const item = serializeHostedItem(id, snapshot.data()!);
  const filesSnapshot = await ref.collection("files").get();
  const files = filesSnapshot.docs
    .map((doc) => doc.data() as HostedFile)
    .sort((a, b) => a.path.localeCompare(b.path));
  const single = item.kind === "file" ? files[0] : null;
  const previewUrl = single
    ? `/hosted/${id}/file?path=${encodeURIComponent(single.path)}&inline=1`
    : "";

  return (
    <main className="share-page">
      <header className="share-header">
        <div className="share-header-inner">
          <Link href="/" className="share-brand">aditya<span className="share-brand-dot">.</span></Link>
          <span className="share-header-label">Shared with you</span>
        </div>
      </header>

      <div className="share-content">
        <section className="share-hero">
          <div className="share-hero-icon"><AdminIcon name={single ? "file" : "folder"} size={28} /></div>
          <p className="share-eyebrow">{single ? "Shared file" : "Shared folder"}</p>
          <h1>{item.title}</h1>
          <div className="share-meta">
            <span>{formatBytes(item.totalBytes)}</span>
            {!single ? <><span className="share-meta-dot" /> <span>{files.length} files</span></> : null}
          </div>
          <a className="share-download-primary" href={single ? `/hosted/${id}/file?path=${encodeURIComponent(single.path)}` : `/hosted/${id}/archive`}>
            <AdminIcon name="download" size={19} /> {single ? "Download file" : "Download folder"}
            {!single ? <span className="share-download-format">ZIP</span> : null}
          </a>
        </section>

        {single ? (
          single.contentType.startsWith("image/") ? (
            <div className="share-preview relative h-[60vh] min-h-72 w-full overflow-hidden">
              <Image src={previewUrl} alt={item.title} fill unoptimized className="object-contain" />
            </div>
          ) : single.contentType === "application/pdf" ? (
            <iframe title={`${item.title} preview`} src={previewUrl} className="share-preview h-[70vh] min-h-96 w-full" />
          ) : null
        ) : (
          <details className="share-files">
            <summary className="share-files-heading"><h2>Inside this folder</h2><span className="share-files-count">{files.length} files</span><span className="share-files-toggle"><span className="share-files-show">Show files</span><span className="share-files-hide">Hide files</span><span className="share-files-chevron" aria-hidden="true" /></span></summary>
            <ul className="share-file-list">
              {files.map((file) => {
                const parts = file.path.split("/");
                const name = parts.pop() || file.path;
                const folder = parts.join("/");
                return (
                  <li key={file.path} className="share-file-row">
                    <span className="share-file-icon"><AdminIcon name="file" size={19} /></span>
                    <span className="share-file-details" title={file.path}>
                      <strong>{name}</strong>
                      {folder ? <small>{folder}</small> : null}
                    </span>
                    <span className="share-file-size">{formatBytes(file.size)}</span>
                    <a className="share-file-download" href={`/hosted/${id}/file?path=${encodeURIComponent(file.path)}`} aria-label={`Download ${name}`} title={`Download ${name}`}><AdminIcon name="download" size={18} /></a>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </div>
    </main>
  );
}
