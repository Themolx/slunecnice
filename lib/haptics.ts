// Tiny haptic feedback helper. No-op where the Vibration API is unavailable
// (most desktops, iOS Safari outside of some contexts).
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export const tap = () => haptic(8);
export const snap = () => haptic(14);
export const success = () => haptic([14, 40, 22]);
