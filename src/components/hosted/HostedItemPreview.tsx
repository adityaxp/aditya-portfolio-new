"use client";

import Image from "next/image";
import { useState } from "react";
import AdminIcon from "@/components/admin/AdminIcon";
import type { HostedItem } from "@/lib/hosted";

export default function HostedItemPreview({ item }: { item: HostedItem }) {
  const [loaded, setLoaded] = useState(false);
  const type = item.previewContentType ?? "";
  const isImage = item.kind === "file" && type.startsWith("image/");
  const isVideo = item.kind === "file" && type.startsWith("video/");
  const src = item.previewPath
    ? `/hosted/${item.id}/file?path=${encodeURIComponent(item.previewPath)}&inline=1`
    : "";
  const icon = item.kind === "folder" ? "folder" : isImage ? "image" : isVideo ? "video" : "file";

  return (
    <span className="hosted-file-preview" aria-hidden="true">
      <AdminIcon name={icon} size={18} />
      {src && isImage ? (
        <Image src={src} alt="" fill unoptimized sizes="36px" className={`hosted-media-preview${loaded ? " is-loaded" : ""}`} onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
      ) : null}
      {src && isVideo ? (
        <video src={`${src}#t=0.1`} muted playsInline preload="metadata" className={`hosted-media-preview${loaded ? " is-loaded" : ""}`} onLoadedData={() => setLoaded(true)} onError={() => setLoaded(false)} />
      ) : null}
    </span>
  );
}
