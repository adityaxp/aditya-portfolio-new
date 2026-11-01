"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdminIcon from "@/components/admin/AdminIcon";
import HostedItemPreview from "@/components/hosted/HostedItemPreview";
import {
  formatBytes,
  isHostedPath,
  MAX_HOSTED_FILES,
  MAX_HOSTED_FILE_BYTES,
  MAX_PROXY_UPLOAD_BYTES,
  shouldSkipFolderPath,
  type HostedDownload,
  type HostedItem,
} from "@/lib/hosted";

type UploadMode = "file" | "folder";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...options });
  if (response.status === 401) {
    window.dispatchEvent(new Event("admin-session-required"));
    throw new Error("Session expired");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function uploadToStorage(
  url: string,
  file: File,
  contentType: string,
  onProgress: (loaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const direct = url.startsWith("https://");
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => onProgress(event.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let serverMessage = "";
        if (!direct) {
          try {
            serverMessage = (JSON.parse(xhr.responseText) as { error?: string }).error || "";
          } catch {
            // The response may come from the hosting platform rather than our API.
          }
        }
        reject(new Error(serverMessage ||
          `Storage upload failed (${xhr.status}). ${direct ? "Check bucket CORS." : "Please retry."}`));
      }
    };
    xhr.onerror = () => reject(new Error(direct
      ? "Storage upload failed. Check bucket CORS and your connection."
      : "Upload connection failed. Please retry."));
    xhr.send(file);
  });
}

export default function HostedManager() {
  const [items, setItems] = useState<HostedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<UploadMode>("file");
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [activity, setActivity] = useState<HostedDownload[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const uploadDialog = useRef<HTMLDialogElement>(null);
  const activityDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = uploadDialog.current;
    if (!dialog) return;
    if (showUpload && !dialog.open) dialog.showModal();
    if (!showUpload && dialog.open) dialog.close();
  }, [showUpload]);

  useEffect(() => {
    const dialog = activityDialog.current;
    if (!dialog) return;
    if (activityId && !dialog.open) dialog.showModal();
    if (!activityId && dialog.open) dialog.close();
  }, [activityId]);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ items: HostedItem[] }>("/api/hosted");
      setItems(data.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api<{ items: HostedItem[] }>("/api/hosted")
      .then((data) => {
        if (active) setItems(data.items);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load files");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectFiles = (selection: FileList | null) => {
    const all = Array.from(selection ?? []);
    const selected = mode === "folder"
      ? all.filter((file) => !shouldSkipFolderPath(file.webkitRelativePath))
      : all;
    setFiles(selected);
    setSkippedCount(all.length - selected.length);
    setError("");
    if (selected.length) {
      setTitle(mode === "folder"
        ? selected[0].webkitRelativePath.split("/")[0]
        : selected[0].name);
    } else {
      setTitle("");
    }
  };

  const resetForm = () => {
    setFiles([]);
    setSkippedCount(0);
    setTitle("");
    setDraftId(null);
    setProgress(0);
    setStatus("");
    if (fileInput.current) fileInput.current.value = "";
    if (folderInput.current) folderInput.current.value = "";
  };

  const upload = async () => {
    const selected = files
      .filter((file) => mode !== "folder" || !shouldSkipFolderPath(file.webkitRelativePath))
      .map((file) => ({
        file,
        path: mode === "folder" ? file.webkitRelativePath : file.name,
      }));
    if (!title.trim() || title.trim().length > 120) {
      setError("Enter a title under 120 characters.");
      return;
    }
    if (!selected.length || selected.length > MAX_HOSTED_FILES ||
        selected.some(({ file, path }) =>
          !isHostedPath(path) || file.size > MAX_HOSTED_FILE_BYTES)) {
      setError(`Choose 1-${MAX_HOSTED_FILES} files, each up to ${formatBytes(MAX_HOSTED_FILE_BYTES)}.`);
      return;
    }
    if (new Set(selected.map(({ path }) => path)).size !== selected.length) {
      setError("The selection contains duplicate paths.");
      return;
    }

    setBusy(true);
    setError("");
    setProgress(0);
    try {
      let id = draftId;
      if (!id) {
        const created = await api<{ id: string }>("/api/hosted", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), kind: mode }),
        });
        id = created.id;
        setDraftId(id);
        await refresh();
      }

      const totalBytes = selected.reduce((sum, { file }) => sum + file.size, 0);
      const uploadedBytes = selected.map(() => 0);
      let completedCount = 0;
      let nextIndex = 0;
      let failure: unknown = null;
      const updateProgress = () => {
        const ratio = totalBytes > 0
          ? uploadedBytes.reduce((sum, bytes) => sum + bytes, 0) / totalBytes
          : completedCount / selected.length;
        setProgress(Math.min(99, Math.round(ratio * 100)));
      };
      const worker = async () => {
        while (nextIndex < selected.length && !failure) {
          const index = nextIndex++;
          const { file, path } = selected[index];
          const contentType = file.type || "application/octet-stream";
          try {
            let uploadUrl: string;
            if (file.size <= MAX_PROXY_UPLOAD_BYTES) {
              uploadUrl = `/api/hosted/${id}/upload?path=${encodeURIComponent(path)}`;
            } else {
              const signed = await api<{ url: string }>(`/api/hosted/${id}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path, size: file.size, contentType }),
              });
              uploadUrl = signed.url;
            }
            await uploadToStorage(uploadUrl, file, contentType, (loaded) => {
              uploadedBytes[index] = Math.min(file.size, loaded);
              updateProgress();
            });
            await api(`/api/hosted/${id}/files`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path }),
            });
            uploadedBytes[index] = file.size;
            completedCount += 1;
            setStatus(`Uploaded ${completedCount} of ${selected.length} files`);
            updateProgress();
          } catch (cause) {
            failure = cause;
          }
        }
      };
      setStatus(`Uploading ${selected.length} files`);
      await Promise.all(Array.from({ length: Math.min(4, selected.length) }, worker));
      if (failure) throw failure;

      setStatus("Publishing...");
      await api(`/api/hosted/${id}/publish`, { method: "POST" });
      setProgress(100);
      resetForm();
      await refresh();
      setStatus("Published. Your link is ready to share.");
      setShowUpload(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed");
      setStatus("Upload paused. Retry, or delete the draft below.");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: HostedItem) => {
    if (!window.confirm(`Delete "${item.title}" and all its files?`)) return;
    setError("");
    try {
      await api(`/api/hosted/${item.id}`, { method: "DELETE" });
      if (draftId === item.id) resetForm();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Delete failed");
    }
  };

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/hosted/${id}`);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy link.");
    }
  };

  const showActivity = async (id: string) => {
    if (activityId === id) {
      setActivityId(null);
      return;
    }
    setActivityId(id);
    setActivity([]);
    setActivityLoading(true);
    setError("");
    try {
      const data = await api<{ downloads: HostedDownload[] }>(`/api/hosted/${id}/downloads`);
      setActivity(data.downloads);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load activity");
    } finally {
      setActivityLoading(false);
    }
  };

  return (
    <main className="hosted-manager min-h-[calc(100svh-72px)] px-6 pb-12 pt-8 md:px-10 md:pt-9">
      <div className="mx-auto max-w-6xl">
        <div className="hosted-manager-header">
          <h1 className="admin-page-heading">Files</h1>
          <button type="button" className="hosted-toolbar-button" onClick={() => setShowUpload(true)} aria-haspopup="dialog" aria-controls="hosted-upload-panel">
            <AdminIcon name="plus" size={17} /> Upload
          </button>
        </div>
        {!showUpload && status ? <p className="hosted-status" role="status">{status}</p> : null}
        <dialog id="hosted-upload-panel" ref={uploadDialog} className="hosted-dialog" onClose={() => setShowUpload(false)} onCancel={(event) => { if (busy) event.preventDefault(); }} aria-labelledby="hosted-upload-title">
          <div className="hosted-dialog-header"><div><h2 id="hosted-upload-title">Upload files</h2><p>Choose a file or folder to share.</p></div><button type="button" className="hosted-icon-button" disabled={busy} onClick={() => setShowUpload(false)} aria-label="Close upload"><AdminIcon name="x" size={18} /></button></div>
          <div className="hosted-dialog-body">
          <div className="admin-mode-switch mt-5 inline-flex border" role="group" aria-label="Upload type">
            {(["file", "folder"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                disabled={busy || Boolean(draftId)}
                onClick={() => {
                  setMode(option);
                  setFiles([]);
                  setSkippedCount(0);
                  setTitle("");
                }}
                className="min-w-24 px-4 py-2 text-sm font-medium capitalize disabled:opacity-50"
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="hosted-picker-field block text-sm font-medium text-granite">
              {mode === "folder" ? "Folder" : "File"}
              <span className="hosted-picker-control"><AdminIcon name={mode === "folder" ? "folder" : "file"} size={17} /><span>{files.length ? mode === "folder" ? files[0]?.webkitRelativePath.split("/")[0] : files[0]?.name : `Choose ${mode}`}</span></span>
              {mode === "folder" ? (
                <input
                  ref={(node) => {
                    folderInput.current = node;
                    node?.setAttribute("webkitdirectory", "");
                  }}
                  type="file"
                  multiple
                  disabled={busy || Boolean(draftId)}
                  onChange={(event) => selectFiles(event.target.files)}
                  className="hosted-picker-input"
                />
              ) : (
                <input
                  ref={fileInput}
                  type="file"
                  disabled={busy || Boolean(draftId)}
                  onChange={(event) => selectFiles(event.target.files)}
                  className="hosted-picker-input"
                />
              )}
            </label>
            <label className="block text-sm font-medium text-granite">
              Display name
              <input
                value={title}
                maxLength={120}
                disabled={busy || Boolean(draftId)}
                onChange={(event) => setTitle(event.target.value)}
                className="admin-field mt-2 block w-full border px-3 py-2 text-ink-black outline-none disabled:opacity-50"
              />
            </label>
          </div>

          {files.length > 0 ? (
            <p className="mt-3 text-sm text-granite">
              {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(files.reduce((sum, file) => sum + file.size, 0))}
              {skippedCount > 0 ? ` · ${skippedCount} Git/dependency/environment file${skippedCount === 1 ? "" : "s"} skipped` : ""}
            </p>
          ) : skippedCount > 0 ? (
            <p className="mt-3 text-sm text-granite">{skippedCount} Git/dependency/environment files skipped</p>
          ) : null}

          {busy ? (
            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-black/10">
                <div className="h-full bg-signal-orange transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 break-all text-sm text-granite">{progress}% · {status}</p>
            </div>
          ) : status ? <p className="mt-4 text-sm text-granite">{status}</p> : null}
          {error ? <p role="alert" className="admin-danger mt-4 text-sm">{error}</p> : null}

          <button
            type="button"
            disabled={busy || files.length === 0}
            onClick={() => void upload()}
            className="mt-5 rounded-lg bg-signal-orange px-5 py-2.5 text-sm font-medium text-white hover:bg-clay-brown disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Uploading..." : draftId ? "Retry upload" : "Upload and publish"}
          </button>
          </div>
        </dialog>

        <section className="admin-panel hosted-files-panel">
          <div className="hosted-files-heading">
            <div><h2>Your files</h2><span>{loading ? <span className="admin-skeleton admin-skeleton-count" aria-label="Loading files" /> : `${items.length} item${items.length === 1 ? "" : "s"}`}</span></div>
            <div className="hosted-heading-actions">{copiedId ? <span role="status">Link copied</span> : null}<button type="button" onClick={() => void refresh()} className="hosted-icon-button" aria-label="Refresh files" title="Refresh files"><AdminIcon name="refresh" size={17} /></button></div>
          </div>
          {loading ? (
            <div className="hosted-skeleton-list" role="status" aria-label="Loading files">
              {Array.from({ length: 5 }, (_, index) => <div className="admin-skeleton-row" key={index}><span className="admin-skeleton admin-skeleton-icon" /><span className="admin-skeleton admin-skeleton-name" /><span className="admin-skeleton admin-skeleton-meta" /></div>)}
            </div>
          ) : items.length === 0 ? (
            <div className="hosted-empty"><AdminIcon name="folder" size={24} /><p>No hosted files yet.</p><button type="button" onClick={() => setShowUpload(true)}>Upload a file</button></div>
          ) : (
            <><div className="hosted-file-columns"><span>Name</span><span>Created</span><span>Downloads</span><span>Actions</span></div><ul className="hosted-file-list">
              {items.map((item) => (
                <li key={item.id} className="hosted-file-item">
                  <div className="hosted-file-row">
                    <HostedItemPreview item={item} />
                    <div className="hosted-file-name">
                      {item.status === "ready" ? <Link href={`/hosted/${item.id}`} target="_blank">{item.title}</Link> : <strong>{item.title}</strong>}
                      <span>{item.status === "ready" ? `${item.kind === "folder" ? `${item.fileCount} files` : "File"} · ${formatBytes(item.totalBytes)}` : "Unfinished upload"}</span>
                    </div>
                    <span className="hosted-file-date">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</span>
                    <span className="hosted-file-downloads">{item.status === "ready" ? item.downloadCount.toLocaleString() : "—"}</span>
                    <div className="hosted-file-actions">
                      {item.status === "ready" ? <>
                        <button type="button" onClick={() => void copyLink(item.id)} className="hosted-icon-button" aria-label={`Copy link to ${item.title}`} title={copiedId === item.id ? "Copied" : "Copy link"}><AdminIcon name="link" size={16} /></button>
                        <button type="button" aria-expanded={activityId === item.id} onClick={() => void showActivity(item.id)} className="hosted-icon-button" aria-label={`Activity for ${item.title}`} title="Activity"><AdminIcon name="chart" size={16} /></button>
                      </> : null}
                      <button type="button" disabled={busy} onClick={() => void remove(item)} className="hosted-icon-button is-danger" aria-label={`Delete ${item.title}`} title="Delete"><AdminIcon name="trash" size={16} /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul></>
          )}
        </section>
        <dialog ref={activityDialog} className="hosted-dialog hosted-activity-dialog" onClose={() => setActivityId(null)} aria-labelledby="hosted-activity-title">
          <div className="hosted-dialog-header"><div><h2 id="hosted-activity-title">Download activity</h2><p>{items.find((item) => item.id === activityId)?.title ?? "Hosted file"}</p></div><button type="button" className="hosted-icon-button" onClick={() => setActivityId(null)} aria-label="Close activity"><AdminIcon name="x" size={18} /></button></div>
          <div className="hosted-activity-body">
            {activityLoading ? <p className="hosted-dialog-empty">Loading activity…</p> : error ? <p className="hosted-dialog-empty admin-danger" role="alert">{error}</p> : activity.length === 0 ? <p className="hosted-dialog-empty">No downloads yet.</p> : (
              <ul className="hosted-activity-list">
                {activity.map((download) => (
                  <li key={download.id}>
                    <div className="hosted-activity-primary"><span>{download.path ?? "Folder ZIP"}</span><time>{download.createdAt ? new Date(download.createdAt).toLocaleString() : "—"}</time></div>
                    <div className="hosted-activity-details">
                      <span>{download.ip ?? "Unknown IP"}</span>
                      <span>{[download.city, download.country].filter(Boolean).join(", ") || "Unknown location"}</span>
                      <span>{[download.browser, download.os, download.deviceModel ?? download.deviceType].filter(Boolean).join(" · ") || "Unknown device"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </dialog>
      </div>
    </main>
  );
}
