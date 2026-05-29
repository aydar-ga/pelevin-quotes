import { redirect } from "next/navigation";

export default function SignInPage() {
  redirect("/?signIn=1");
}
