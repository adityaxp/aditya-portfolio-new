import { AdminThemeProvider } from "@/components/admin/AdminTheme";

export default function AdminLoading() {
  return <AdminThemeProvider>
    <div className="admin-shell admin-loading-shell" role="status" aria-label="Loading workspace">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top"><span className="admin-skeleton admin-skeleton-brand" /><span className="admin-skeleton admin-skeleton-button" /></div>
        <div className="admin-sidebar-nav"><span className="admin-skeleton admin-skeleton-nav" /><span className="admin-skeleton admin-skeleton-nav" /></div>
      </aside>
      <main className="admin-workspace admin-loading-content">
        <span className="admin-skeleton admin-skeleton-heading" />
        <span className="admin-skeleton admin-skeleton-toolbar" />
        <div className="admin-skeleton-panel">
          <span className="admin-skeleton admin-skeleton-panel-title" />
          {Array.from({ length: 5 }, (_, index) => <div className="admin-skeleton-row" key={index}><span className="admin-skeleton admin-skeleton-icon" /><span className="admin-skeleton admin-skeleton-name" /><span className="admin-skeleton admin-skeleton-meta" /></div>)}
        </div>
      </main>
    </div>
  </AdminThemeProvider>;
}
