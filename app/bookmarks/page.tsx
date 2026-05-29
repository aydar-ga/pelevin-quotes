import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";

export default async function BookmarksPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/?signIn=1");
  redirect("/?panel=account");
}
