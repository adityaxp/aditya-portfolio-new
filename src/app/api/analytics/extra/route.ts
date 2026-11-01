import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { HOSTED_COLLECTION } from "@/lib/hosted";
import type { EngagementEvent } from "@/lib/analyticsTypes";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [eventsSnapshot, hostedSnapshot] = await Promise.all([
      db.collection("portfolio_events").orderBy("timestamp", "desc").get(),
      db.collection(HOSTED_COLLECTION).get(),
    ]);
    const events: EngagementEvent[] = eventsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, type: data.type, sessionId: data.sessionId, target: data.target ?? null, path: data.path ?? "/", durationMs: data.durationMs ?? null, timestamp: data.timestamp?.toDate?.().toISOString() ?? null };
    });
    const hosted = hostedSnapshot.docs.map((doc) => ({ id: doc.id, title: String(doc.data().title ?? "File"), downloads: Number(doc.data().downloadCount ?? 0) }));
    return NextResponse.json({ events, hosted });
  } catch {
    return NextResponse.json({ error: "Could not load insights" }, { status: 500 });
  }
}
