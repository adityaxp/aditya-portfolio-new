"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ProtectedPage from "@/components/admin/ProtectedPage";
import AdminLoading from "@/components/admin/AdminLoading";
import HostedManager from "@/components/hosted/HostedManager";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

function AdminWorkspace() {
  const params = useSearchParams();
  const tab = (params.get("tab") ?? params.get("")) === "analytics" ? "analytics" : "hosted";

  return (
    <ProtectedPage>
      <AdminShell active={tab}>
        {tab === "hosted" ? <HostedManager /> : <AnalyticsDashboard />}
      </AdminShell>
    </ProtectedPage>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<AdminLoading />}><AdminWorkspace /></Suspense>;
}
