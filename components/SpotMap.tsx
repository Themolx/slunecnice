"use client";
import { useEffect, useRef } from "react";

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  kind: "planting" | "water";
  color: string; // fill color
  border?: string; // border color (e.g. dryness); defaults to ink
  size: number; // diameter in px
  emoji?: string; // optional glyph inside
}

interface SpotMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  grayscale?: boolean;
  onMarkerClick?: (id: string) => void;
  onMapClick?: (lat: number, lon: number) => void;
  pickPin?: { lat: number; lon: number } | null; // a draggable-ish target pin
}

const PRAHA: [number, number] = [14.42, 50.075];

interface MapLike {
  remove: () => void;
  on: (e: string, cb: (ev?: unknown) => void) => void;
  project: (ll: [number, number]) => { x: number; y: number };
  flyTo?: (opts: { center: [number, number]; zoom?: number; duration?: number; essential?: boolean }) => void;
}

export default function SpotMap({
  markers,
  center = PRAHA,
  zoom = 11.5,
  height = "100%",
  onMarkerClick,
  onMapClick,
  pickPin = null,
}: SpotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapLike | null>(null);
  const markerEls = useRef<HTMLDivElement[]>([]);
  const pinEl = useRef<HTMLDivElement | null>(null);

  // keep latest callbacks/markers without re-initialising the map
  const markersRef = useRef(markers);
  const pinRef = useRef(pickPin);
  const clickRef = useRef(onMarkerClick);
  const mapClickRef = useRef(onMapClick);
  markersRef.current = markers;
  pinRef.current = pickPin;
  clickRef.current = onMarkerClick;
  mapClickRef.current = onMapClick;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;

    const init = async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !mapRef.current) return;

      const style =
        process.env.NEXT_PUBLIC_MAP_STYLE ||
        "https://tiles.openfreemap.org/styles/positron";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m: MapLike = new (maplibre as any).Map({
        container: mapRef.current,
        style,
        center,
        zoom,
        maxZoom: 18,
      });
      mapInstance.current = m;

      const buildMarkers = () => {
        if (!overlayRef.current) return;
        overlayRef.current.innerHTML = "";
        markerEls.current = markersRef.current.map((mk) => {
          const el = document.createElement("div");
          el.style.cssText = `
            position:absolute; display:flex; align-items:center; justify-content:center;
            width:${mk.size}px; height:${mk.size}px; border-radius:0;
            background:${mk.color};
            border:4px solid ${mk.border ?? "#161410"};
            box-sizing:border-box; cursor:${clickRef.current ? "pointer" : "default"};
            transform:translate(-50%,-50%); pointer-events:auto;
            font-size:${Math.max(11, mk.size * 0.5)}px; line-height:1;
            box-shadow:0 1px 3px rgba(0,0,0,0.25);
          `;
          if (mk.emoji) el.textContent = mk.emoji;
          if (clickRef.current) {
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              clickRef.current?.(mk.id);
            });
          }
          overlayRef.current!.appendChild(el);
          return el;
        });

        // pick pin
        pinEl.current = null;
        if (pinRef.current) {
          const p = document.createElement("div");
          p.style.cssText = `
            position:absolute; width:26px; height:26px; transform:translate(-50%,-100%);
            pointer-events:none; font-size:26px; line-height:1; filter:drop-shadow(0 2px 2px rgba(0,0,0,.4));
          `;
          p.textContent = "";
          overlayRef.current!.appendChild(p);
          pinEl.current = p;
        }
      };

      const sync = () => {
        markersRef.current.forEach((mk, i) => {
          const el = markerEls.current[i];
          if (!el) return;
          const { x, y } = m.project([mk.lon, mk.lat]);
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
        });
        if (pinEl.current && pinRef.current) {
          const { x, y } = m.project([pinRef.current.lon, pinRef.current.lat]);
          pinEl.current.style.left = `${x}px`;
          pinEl.current.style.top = `${y}px`;
        }
      };

      m.on("load", () => {
        buildMarkers();
        sync();
      });
      m.on("render", sync);

      if (mapClickRef.current) {
        m.on("click", (ev?: unknown) => {
          const e = ev as { lngLat?: { lat: number; lng: number } } | undefined;
          if (e?.lngLat) mapClickRef.current?.(e.lngLat.lat, e.lngLat.lng);
        });
      }

      // expose a rebuild hook on the element for marker updates
      (mapRef.current as unknown as { _rebuild?: () => void })._rebuild = () => {
        buildMarkers();
        sync();
      };
    };

    init().catch(console.error);
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markerEls.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rebuild markers when the data changes (after initial mount)
  useEffect(() => {
    const el = mapRef.current as unknown as { _rebuild?: () => void } | null;
    el?._rebuild?.();
  }, [markers, pickPin]);

  // Smoothly fly to a new center (e.g. when the user's GPS location arrives).
  const centerKey = center ? `${center[0].toFixed(5)},${center[1].toFixed(5)}` : "";
  useEffect(() => {
    const m = mapInstance.current;
    if (m && center) m.flyTo?.({ center, zoom, duration: 1050, essential: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
        }}
      />
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          borderRadius: "inherit",
        }}
      />
    </div>
  );
}
