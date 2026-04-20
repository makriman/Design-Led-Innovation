"use client";

import styles from "./RatingMoodAnimation.module.css";

const ratingToneMap: Record<number, { title: string; body: string }> = {
  1: {
    title: "Tough lesson signal",
    body: "Let us capture exactly what failed so the next plan is simpler and clearer.",
  },
  2: {
    title: "Needs adjustment",
    body: "Good insight. A few concrete fixes can improve the next class quickly.",
  },
  3: {
    title: "Mixed result",
    body: "Solid base. We can tighten timing and transitions for stronger flow.",
  },
  4: {
    title: "Strong momentum",
    body: "Great class energy. Keep what worked and optimize one small detail.",
  },
  5: {
    title: "Excellent session",
    body: "Fantastic outcome. Capture the pattern and repeat it in future lessons.",
  },
};

type RatingMoodAnimationProps = {
  rating: number;
};

function mouthPathForRating(rating: number) {
  if (rating <= 2) {
    return "M12 34 C20 22, 28 22, 36 34";
  }
  if (rating === 3) {
    return "M12 30 C20 30, 28 30, 36 30";
  }
  return "M12 26 C20 36, 28 36, 36 26";
}

export function RatingMoodAnimation({ rating }: RatingMoodAnimationProps) {
  const safeRating = Math.max(1, Math.min(5, rating || 3));
  const tone = ratingToneMap[safeRating];
  const motionClass = safeRating <= 2 ? styles.low : safeRating === 3 ? styles.mid : styles.high;

  return (
    <section className={`${styles.card} ${motionClass}`}>
      <p className={styles.label}>Class vibe</p>
      <div className={styles.layout}>
        <div className={styles.stage}>
          <div key={`face-${safeRating}`} className={styles.glow}>
            <svg className={styles.face} viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="18" cy="19" r="2.4" fill="#1a1aff" />
              <circle cx="30" cy="19" r="2.4" fill="#1a1aff" />
              <path
                d={mouthPathForRating(safeRating)}
                fill="none"
                stroke="#1a1aff"
                strokeWidth="2.7"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className={`${styles.sparkle} ${styles.sparkleTop}`} />
          <span className={`${styles.sparkle} ${styles.sparkleRight}`} />
          <span className={`${styles.sparkle} ${styles.sparkleBottom}`} />
        </div>
        <div>
          <p className={styles.copyTitle}>
            {rating > 0 ? `You selected ${rating}/5` : "Pick a rating to start feedback"}
          </p>
          <p className={styles.copyBody}>{tone.body}</p>
        </div>
      </div>
    </section>
  );
}
