import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatBytes, type HostedFile } from "@/lib/hosted";
import { hostedDoc, serializeHostedItem } from "@/lib/hostedServer";

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
    <main className="min-h-svh bg-canvas-cream">
      <header className="border-b border-ink-black/10 bg-lifted-cream px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-ink-black hover:text-signal-orange">
            Aditya Balsane
          </Link>
          <span className="text-xs font-medium uppercase text-slate-gray">Hosted files</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="mb-2 text-sm text-slate-gray">
          {item.kind === "folder" ? "Folder" : "File"} · {formatBytes(item.totalBytes)}
        </p>
        <h1 className="break-words text-3xl font-semibold text-ink-black sm:text-4xl">
          {item.title}
        </h1>

        {single ? (
          <div className="mt-8">
            <a
              className="inline-flex items-center justify-center rounded-md bg-ink-black px-5 py-3 text-sm font-medium text-white hover:bg-charcoal"
              href={`/hosted/${id}/file?path=${encodeURIComponent(single.path)}`}
            >
              Download file
            </a>
            {single.contentType.startsWith("image/") ? (
              <div className="relative mt-8 h-[60vh] min-h-72 w-full overflow-hidden border border-ink-black/10 bg-white">
                <Image
                  src={previewUrl}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            ) : single.contentType === "application/pdf" ? (
              <iframe
                title={`${item.title} preview`}
                src={previewUrl}
                className="mt-8 h-[70vh] min-h-96 w-full border border-ink-black/10 bg-white"
              />
            ) : null}
          </div>
        ) : (
          <section className="mt-8">
            <a
              className="inline-flex items-center justify-center rounded-md bg-ink-black px-5 py-3 text-sm font-medium text-white hover:bg-charcoal"
              href={`/hosted/${id}/archive`}
            >
              Download folder (.zip)
            </a>
            <details className="mt-9 border-t border-ink-black/10">
              <summary className="cursor-pointer py-4 text-sm font-medium text-granite">
                Browse {files.length} file{files.length === 1 ? "" : "s"}
              </summary>
              <ul className="divide-y divide-ink-black/10 border-t border-ink-black/10">
                {files.map((file) => (
                  <li key={file.path} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <span className="min-w-0 break-all text-sm text-ink-black">{file.path}</span>
                    <a
                      className="shrink-0 text-sm font-medium text-link-blue hover:underline"
                      href={`/hosted/${id}/file?path=${encodeURIComponent(file.path)}`}
                    >
                      Download · {formatBytes(file.size)}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}
