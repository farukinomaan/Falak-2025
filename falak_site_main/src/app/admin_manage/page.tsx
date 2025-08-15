import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminManage from "@/components/admin/AdminManage";
import { getRoleForEmail } from "@/lib/actions/adminAggregations";

export default async function AdminManagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");
  const roleRes = await getRoleForEmail(session.user.email);
  const role = roleRes.ok ? roleRes.data : undefined;
  if (!role) {
    // No role -> redirect home
    redirect("/");
  }
  return <AdminManage role={role} />;
}

