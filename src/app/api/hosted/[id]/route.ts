import { NextRequest, NextResponse } from "next/server";
import { isAnalyticsAuthenticated } from "@/lib/analyticsAuth";
import { storageBucket } from "@/lib/firebaseAdmin";
import { hostedDoc, isSameOrigin } from "@/lib/hostedServer";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAnalyticsAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const { id } = await params;
  const ref = hostedDoc(id);
  if (!ref) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await ref.get();
  if (!item.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await storageBucket.deleteFiles({ prefix: `hosted/${id}/`, force: true });
  await ref.firestore.recursiveDelete(ref);
  return NextResponse.json({ success: true });
}
