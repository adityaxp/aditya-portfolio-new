import { NextResponse } from "next/server";
import { isAnalyticsAuthenticated } from "@/lib/analyticsAuth";
import { hostedDoc } from "@/lib/hostedServer";
import type { HostedDownload } from "@/lib/hosted";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAnalyticsAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ref = hostedDoc(id);
  if (!ref) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await ref.get();
  if (!item.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshot = await ref.collection("downloads")
    .orderBy("createdAt", "desc")
    .limit(25)
    .get();
  const downloads: HostedDownload[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      kind: data.kind,
      path: data.path ?? null,
      visitorId: data.visitorId,
      ip: data.ip ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      browser: data.browser ?? null,
      os: data.os ?? null,
      deviceType: data.deviceType ?? null,
      deviceModel: data.deviceModel ?? null,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
    };
  });
  return NextResponse.json({ downloads });
}
