import { redirect } from "next/navigation";

export default function PortfolioAnalyticsPage() {
  redirect("/admin?tab=analytics");
}
