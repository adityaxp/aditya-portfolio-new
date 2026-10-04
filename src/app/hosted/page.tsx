"use client";

import ProtectedPage from "@/components/analytics/ProtectedPage";
import HostedManager from "@/components/hosted/HostedManager";

export default function HostedAdminPage() {
  return (
    <ProtectedPage destination="hosted files">
      <HostedManager />
    </ProtectedPage>
  );
}
