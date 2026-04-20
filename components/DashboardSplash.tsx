"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./DashboardSplash.module.css";
import wordmarkWhite from "@/public/brand/inspire-wordmark-white.png";

const FULL_ANIMATION_MS = 3800;
const REDUCED_ANIMATION_MS = 840;

export function DashboardSplash() {
  const [isVisible, setIsVisible] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    setMotionReady(true);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncPreference);
      return () => mediaQuery.removeEventListener("change", syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, []);

  useEffect(() => {
    if (!motionReady || !isVisible) {
      return;
    }

    const duration = prefersReducedMotion ? REDUCED_ANIMATION_MS : FULL_ANIMATION_MS;
    const earlyReveal = window.setTimeout(() => setContentVisible(true), Math.round(duration * 0.8));
    const splashEnd = window.setTimeout(() => setIsVisible(false), duration);

    return () => {
      window.clearTimeout(earlyReveal);
      window.clearTimeout(splashEnd);
    };
  }, [isVisible, motionReady, prefersReducedMotion]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={[
        styles.overlay,
        prefersReducedMotion ? styles.overlayReduced : "",
        contentVisible ? styles.revealReady : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <div className={styles.atmosphere} />
      <div className={styles.logoStage}>
        <Image
          src={wordmarkWhite}
          alt=""
          className={styles.wordmark}
          priority
        />
        <span className={`${styles.dot} ${styles.dotLeft}`} aria-hidden="true" />
        <span className={`${styles.dot} ${styles.dotRight}`} aria-hidden="true" />
      </div>
      <p className={styles.missionStatement}>
        <span>Making learning fun</span>
        <span>for everyone.</span>
      </p>
    </div>
  );
}
