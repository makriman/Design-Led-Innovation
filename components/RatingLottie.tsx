"use client";

import { createElement } from "react";
import Script from "next/script";

const ratingAnimationMap: Record<number, string> = {
  1: "/lottie/rating-1.json",
  2: "/lottie/rating-2.json",
  3: "/lottie/rating-3.json",
  4: "/lottie/rating-4.json",
  5: "/lottie/rating-5.json",
};

const ratingToneMap: Record<number, string> = {
  1: "Let’s diagnose what went wrong.",
  2: "Good signal. We can improve quickly.",
  3: "Solid start. A few tweaks can lift this.",
  4: "Strong class momentum. Nice work.",
  5: "Excellent session. Celebrate and repeat what worked.",
};

type RatingLottieProps = {
  rating: number;
};

export function RatingLottie({ rating }: RatingLottieProps) {
  const safeRating = Math.max(1, Math.min(5, rating || 3));
  const src = ratingAnimationMap[safeRating];
  const playbackSpeed = safeRating >= 4 ? 1 : safeRating === 3 ? 0.95 : 0.85;

  return (
    <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/10 p-4">
      <Script
        src="https://unpkg.com/@lottiefiles/lottie-player@2.0.12/dist/lottie-player.js"
        strategy="afterInteractive"
      />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Live class vibe</p>
      <div className="mt-1 grid items-center gap-3 sm:grid-cols-[132px_1fr]">
        <div className="mx-auto h-[116px] w-[116px] rounded-full bg-white/70 p-1 shadow-sm">
          {createElement("lottie-player", {
            key: `rating-${safeRating}`,
            src,
            loop: true,
            autoplay: true,
            mode: "normal",
            speed: String(playbackSpeed),
            style: { width: "108px", height: "108px" },
          } as Record<string, unknown>)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {rating > 0 ? `You selected ${rating}/5` : "Pick a rating to start feedback"}
          </p>
          <p className="text-sm text-slate-600">
            {ratingToneMap[safeRating]}
          </p>
        </div>
      </div>
    </section>
  );
}
