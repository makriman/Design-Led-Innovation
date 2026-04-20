"use client";

import type { CSSProperties } from "react";
import styles from "./ConfettiBurst.module.css";

type ConfettiBurstProps = {
  active: boolean;
};

const colors = ["#1a1aff", "#4d6bff", "#94a3ff", "#ffffff", "#f5a623"];

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  if (!active) {
    return null;
  }

  return (
    <div className={styles.confetti} aria-hidden="true">
      {Array.from({ length: 36 }).map((_, index) => {
        const style = {
          "--x": `${(index * 17) % 100}%`,
          "--dx": `${((index % 2 === 0 ? 1 : -1) * (18 + ((index * 7) % 54))) | 0}px`,
          "--d": `${1.3 + ((index * 13) % 7) * 0.19}s`,
          "--t": `${(index % 10) * 0.06}s`,
          "--r": `${(index * 29) % 360}deg`,
          "--c": colors[index % colors.length],
        } as CSSProperties;

        return <span key={index} className={styles.piece} style={style} />;
      })}
    </div>
  );
}
