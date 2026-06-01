"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { captureSquare } from "@/lib/capture";

/**
 * Plain 1:1 viewfinder. On capture, returns the JPEG blob to the parent.
 */
export default function CameraCapture({
  onCapture,
  onCancel,
  hint,
}: {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  hint?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);

  const start = useCallback(async () => {
    setError(null);
    setReady(false);
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1440 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        const mark = () => setReady(true);
        v.onloadeddata = mark;
        v.oncanplay = mark;
        v.onplaying = mark;
        try {
          await v.play();
        } catch {
          /* autoplay quirk */
        }
        window.setTimeout(() => setReady((p) => p || true), 3000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kameru se nepodařilo spustit");
    }
  }, []);

  useEffect(() => {
    start();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [start]);

  const shoot = async () => {
    const v = videoRef.current;
    if (!v) return;
    setBusy(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 160);
    try {
      const blob = await captureSquare(v);
      onCapture(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Focení selhalo");
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "#000", overflow: "hidden", borderRadius: "var(--radius-sm)", border: "3px solid var(--text)" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {flash && <div style={{ position: "absolute", inset: 0, background: "#fff" }} />}
        {!ready && !error && (
          <div className="type-label" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            Spouštím kameru…
          </div>
        )}
        {error && (
          <div className="type-body" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: 20 }}>
            {error}
          </div>
        )}
      </div>

      {hint && (
        <p className="type-label" style={{ color: "var(--muted)", marginTop: 10, textAlign: "center" }}>{hint}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>Zpět</button>
        <button className="btn btn-sun" style={{ flex: 1.6 }} onClick={shoot} disabled={!ready || busy}>
          {busy ? "Ukládám…" : "Vyfotit a zalít"}
        </button>
      </div>
    </div>
  );
}
