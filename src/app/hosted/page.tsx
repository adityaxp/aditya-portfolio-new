import { redirect } from "next/navigation";

export default function HostedAdminPage() {
  redirect("/admin?tab=hosted");
}
