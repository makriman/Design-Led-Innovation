"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshInsightsButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshInsights() {
    setError(null);
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRefresh: true }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not refresh insights.");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={refreshInsights} variant="outline" className="min-w-56">
        {isRefreshing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Refreshing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh insights
          </span>
        )}
      </Button>
      {error ? <p className="text-base text-red-700">{error}</p> : null}
    </div>
  );
}
