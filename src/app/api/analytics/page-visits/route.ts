import { NextResponse } from "next/server";
import { isAnalyticsAuthenticated } from "@/lib/analyticsAuth";
import { mapAnalyticsDoc } from "@/lib/analyticsFirestore";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    if (!(await isAnalyticsAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await db
      .collection("page_visits")
      .orderBy("timestamp", "desc")
      .get();

    const records = snapshot.docs.map((doc) =>
      mapAnalyticsDoc(doc.id, doc.data()),
    );

    return NextResponse.json({ records });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch page visits" },
      { status: 500 },
    );
  }
}
