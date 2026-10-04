"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
    window.location.reload();
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
    <main className="min-h-svh bg-canvas-cream">
      <header className="border-b border-ink-black/10 bg-lifted-cream px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink-black">Hosted files</h1>
          <Link href="/portfolio-analytics" className="text-sm text-link-blue hover:underline">
            Portfolio analytics
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <section className="border-b border-ink-black/10 pb-10">
          <h2 className="text-lg font-semibold">Upload</h2>
          <div className="mt-5 inline-flex overflow-hidden rounded-md border border-ink-black/20" role="group" aria-label="Upload type">
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
                className={`min-w-24 px-4 py-2 text-sm font-medium capitalize disabled:opacity-50 ${mode === option ? "bg-ink-black text-white" : "bg-white text-ink-black"}`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-granite">
              {mode === "folder" ? "Choose folder" : "Choose file"}
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
                  className="mt-2 block w-full text-sm text-ink-black file:mr-4 file:rounded-md file:border file:border-ink-black/20 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium disabled:opacity-50"
                />
              ) : (
                <input
                  ref={fileInput}
                  type="file"
                  disabled={busy || Boolean(draftId)}
                  onChange={(event) => selectFiles(event.target.files)}
                  className="mt-2 block w-full text-sm text-ink-black file:mr-4 file:rounded-md file:border file:border-ink-black/20 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium disabled:opacity-50"
                />
              )}
            </label>
            <label className="block text-sm font-medium text-granite">
              Link title
              <input
                value={title}
                maxLength={120}
                disabled={busy || Boolean(draftId)}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 block w-full rounded-md border border-ink-black/20 bg-white px-3 py-2 text-ink-black outline-none focus:border-link-blue disabled:opacity-50"
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
          {error ? <p role="alert" className="mt-4 text-sm text-signal-orange">{error}</p> : null}

          <button
            type="button"
            disabled={busy || files.length === 0}
            onClick={() => void upload()}
            className="mt-5 rounded-md bg-ink-black px-5 py-2.5 text-sm font-medium text-white hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Uploading..." : draftId ? "Retry upload" : "Upload and publish"}
          </button>
        </section>

        <section className="pt-9">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Your links</h2>
            <button type="button" onClick={() => void refresh()} className="text-sm text-link-blue hover:underline">Refresh</button>
          </div>
          {loading ? (
            <p className="py-8 text-sm text-granite">Loading...</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-sm text-granite">No hosted files yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink-black/10 border-y border-ink-black/10">
              {items.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-ink-black">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-gray">
                        {item.status === "ready" ? `${item.kind} · ${item.fileCount} file${item.fileCount === 1 ? "" : "s"} · ${formatBytes(item.totalBytes)} · ${item.downloadCount} download${item.downloadCount === 1 ? "" : "s"}` : "Unfinished upload"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-sm">
                      {item.status === "ready" ? (
                        <>
                          <Link href={`/hosted/${item.id}`} target="_blank" className="text-link-blue hover:underline">Open</Link>
                          <button type="button" onClick={() => void copyLink(item.id)} className="text-link-blue hover:underline">
                            {copiedId === item.id ? "Copied" : "Copy link"}
                          </button>
                          <button type="button" aria-expanded={activityId === item.id} onClick={() => void showActivity(item.id)} className="text-link-blue hover:underline">
                            Activity
                          </button>
                        </>
                      ) : null}
                      <button type="button" disabled={busy} onClick={() => void remove(item)} className="text-signal-orange hover:underline disabled:opacity-50">Delete</button>
                    </div>
                  </div>
                  {activityId === item.id ? (
                    <div className="mt-4 border-t border-ink-black/10 pt-3">
                      <p className="mb-2 text-xs font-medium text-granite">Recent downloads</p>
                      {activityLoading ? <p className="text-sm text-granite">Loading...</p> : activity.length === 0 ? (
                        <p className="text-sm text-granite">No downloads yet.</p>
                      ) : (
                        <div className="w-full overflow-x-auto">
                          <table className="w-full min-w-[900px] border-collapse text-left text-xs text-granite">
                            <thead>
                              <tr className="border-b border-ink-black/10 text-slate-gray">
                                {(["Date", "File", "IP", "Country", "City", "Browser", "OS", "Device"] as const).map((label) => (
                                  <th key={label} scope="col" className="px-2 py-2 font-medium first:pl-0 last:pr-0">{label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activity.map((download) => (
                                <tr key={download.id} className="border-b border-ink-black/10 align-top last:border-0">
                                  <td className="whitespace-nowrap px-2 py-2 pl-0">{download.createdAt ? new Date(download.createdAt).toLocaleString() : "—"}</td>
                                  <td className="max-w-64 break-all px-2 py-2">{download.path ?? "Folder ZIP"}</td>
                                  <td className="px-2 py-2">{download.ip ?? "—"}</td>
                                  <td className="px-2 py-2">{download.country ?? "—"}</td>
                                  <td className="px-2 py-2">{download.city ?? "—"}</td>
                                  <td className="px-2 py-2">{download.browser ?? "—"}</td>
                                  <td className="px-2 py-2">{download.os ?? "—"}</td>
                                  <td className="px-2 py-2 pr-0">{download.deviceModel ? `${download.deviceType ?? "Device"} · ${download.deviceModel}` : download.deviceType ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
