"use client";

import ProtectedPage from "@/components/analytics/ProtectedPage";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default function PortfolioAnalyticsPage() {
  return (
    <ProtectedPage destination="analytics panel">
      <AnalyticsDashboard />
    </ProtectedPage>
  );
}
