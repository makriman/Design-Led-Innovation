import { redirect } from "next/navigation";
import { UnlockForm } from "@/components/UnlockForm";
import { isSessionUnlocked } from "@/lib/server-auth";

export default async function UnlockPage() {
  if (await isSessionUnlocked()) {
    redirect("/dashboard");
  }

  return <UnlockForm />;
}
