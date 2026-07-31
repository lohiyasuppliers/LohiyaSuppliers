"use client";

import { useEffect, useRef } from "react";
import type { CrmLocationPin } from "@/lib/crm-data";

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  fitBounds: (bounds: unknown, options?: { padding: [number, number] }) => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (html: string) => LeafletMarker;
};

type LeafletLib = {
  map: (el: HTMLElement) => LeafletMap;
  tileLayer: (url: string, opts: { attribution: string }) => { addTo: (map: LeafletMap) => void };
  marker: (pos: [number, number]) => LeafletMarker;
  latLngBounds: (points: [number, number][]) => unknown;
};

declare global {
  interface Window {
    L?: LeafletLib;
  }
}

function loadLeaflet(): Promise<LeafletLib> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet-css", "1");
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet failed"));
    };
    script.onerror = () => reject(new Error("Leaflet load error"));
    document.body.appendChild(script);
  });
}

export function CrmInteractiveMap({
  locations,
  highlightState,
}: {
  locations: CrmLocationPin[];
  highlightState?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let map: LeafletMap | null = null;
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        el.innerHTML = "";
        map = L.map(el).setView([22.5937, 78.9629], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
        }).addTo(map);

        const filtered = highlightState
          ? locations.filter((l) => l.state === highlightState)
          : locations;

        const points: [number, number][] = [];
        for (const loc of filtered) {
          const pos: [number, number] = [loc.lat, loc.lng];
          points.push(pos);
          const popup = `
            <div style="font-family:sans-serif;font-size:12px;min-width:160px">
              <strong>${loc.company}</strong><br/>
              ${loc.name}<br/>
              <span style="color:#666">${loc.fullAddress}</span><br/>
              ${loc.phone ? `📞 ${loc.phone}<br/>` : ""}
              <span style="color:#666">${loc.orderCount} orders · ${loc.clientType}</span>
            </div>
          `;
          L.marker(pos).addTo(map!).bindPopup(popup);
        }

        if (points.length === 1) {
          map.setView(points[0], 8);
        } else if (points.length > 1) {
          map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
        }
      })
      .catch(() => {
        if (el) el.innerHTML = "<p class='p-4 text-sm text-gray-500'>Map could not load</p>";
      });

    return () => {
      cancelled = true;
    };
  }, [locations, highlightState]);

  return (
    <div
      ref={ref}
      className="h-[320px] sm:h-[420px] w-full rounded-xl overflow-hidden border bg-slate-100 z-0"
    />
  );
}
