import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { mapAnalyticsDoc } from "@/lib/analyticsFirestore";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await db
      .collection("cv_downloads")
      .orderBy("timestamp", "desc")
      .get();

    const records = snapshot.docs.map((doc) =>
      mapAnalyticsDoc(doc.id, doc.data()),
    );

    return NextResponse.json({ records });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch CV downloads" },
      { status: 500 },
    );
  }
}
