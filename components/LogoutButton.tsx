"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/unlock/logout", { method: "POST" });
    router.push("/unlock");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className="min-h-10">
      Logout
    </Button>
  );
}
