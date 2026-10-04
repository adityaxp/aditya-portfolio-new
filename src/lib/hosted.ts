export const HOSTED_COLLECTION = "hosted_items";
export const MAX_HOSTED_FILES = 1000;
export const MAX_HOSTED_FILE_BYTES = 500 * 1024 * 1024;
export const MAX_PROXY_UPLOAD_BYTES = 3 * 1024 * 1024;

export type HostedFile = {
  path: string;
  storagePath: string;
  size: number;
  contentType: string;
};

export type HostedItem = {
  id: string;
  title: string;
  kind: "file" | "folder";
  status: "uploading" | "ready";
  fileCount: number;
  totalBytes: number;
  downloadCount: number;
  createdAt: string;
};

export type HostedDownload = {
  id: string;
  kind: "file" | "folder";
  path: string | null;
  visitorId: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  deviceModel: string | null;
  createdAt: string;
};

export function isHostedId(id: string): boolean {
  return /^[A-Za-z0-9]{20}$/.test(id);
}

export function isHostedPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 1024 &&
    !/[\\\u0000-\u001f\u007f]/.test(path) &&
    path.split("/").every((part) =>
      part.length > 0 && part.length <= 255 && part !== "." && part !== "..",
    )
  );
}

export function shouldSkipFolderPath(path: string): boolean {
  return path.split("/").some((part) =>
    part === ".git" ||
    part === "node_modules" ||
    part === ".next" ||
    part === ".DS_Store" ||
    part === ".env" ||
    part.startsWith(".env."),
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)) - 1, 2);
  return `${(bytes / 1024 ** (index + 1)).toFixed(1)} ${units[index]}`;
}
