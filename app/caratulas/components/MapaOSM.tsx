"use client";

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Custom pin SVG como Data URI para no depender de CDN ──────────────────
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36">
  <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="%23ef4444"/>
  <circle cx="12" cy="12" r="5" fill="white"/>
</svg>`;

const customIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:36px;
    background-image:url('data:image/svg+xml,${PIN_SVG}');
    background-size:cover;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
    animation: pinDrop .25s cubic-bezier(.22,1.2,.36,1) both;
  "></div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

// ── Tipos ─────────────────────────────────────────────────────────────────
interface Coords {
  lat: number;
  lng: number;
}

interface MapaOSMProps {
  onCoordsChange?: (lat: number, lng: number) => void;
  coordenadasActuales?: string;
  /** Altura del mapa. Default "220px". Pasa "100%" si el padre tiene altura fija. */
  height?: string;
  /** Punto central inicial [lat, lng]. Default La Paz, Bolivia. */
  center?: [number, number];
  zoom?: number;
  /** Label que se muestra sobre el mapa */
  label?: string;
  /** Desactiva la interacción (solo lectura) */
  readOnly?: boolean;
}

// ── Subcomponente interno de eventos ──────────────────────────────────────
function ClickHandler({
  onPlace,
}: {
  onPlace: (latlng: L.LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onPlace(e.latlng);
    },
  });
  return null;
}

// ── Componente principal ──────────────────────────────────────────────────
export default function MapaOSM({
  onCoordsChange,
  height = "220px",
  center = [-16.4897, -68.1193],
  zoom = 13,
  label = "Selecciona una ubicación",
  readOnly = false,
}: MapaOSMProps) {
  const [pos, setPos] = useState<L.LatLng | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePlace = useCallback(
    (latlng: L.LatLng) => {
      if (readOnly) return;
      setPos(latlng);
      onCoordsChange?.(latlng.lat, latlng.lng);
    },
    [readOnly, onCoordsChange]
  );

  const coordsText = pos
    ? `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`
    : null;

  const handleCopy = () => {
    if (!coordsText) return;
    navigator.clipboard.writeText(coordsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleClear = () => {
    setPos(null);
  };

  return (
    <>
      {/* ── Estilos inyectados ── */}
      <style>{`
        @keyframes pinDrop {
          from { transform: translateY(-18px) scale(.8); opacity: 0; }
          to   { transform: translateY(0)      scale(1); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mapa-osm-wrapper {
          --radius: 10px;
          --bg: #ffffff;
          --surface: #f8fafc;
          --border: #e2e8f0;
          --text-primary: #0f172a;
          --text-muted: #64748b;
          --accent: #ef4444;
          --accent-light: #fef2f2;
          --green: #22c55e;
          font-family: 'DM Sans', 'Geist', system-ui, sans-serif;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.04);
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .mapa-osm-header {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px 8px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          flex-shrink: 0;
        }
        .mapa-osm-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }
        .mapa-osm-dot.active {
          background: var(--green);
          box-shadow: 0 0 0 3px rgba(34,197,94,.18);
        }
        .mapa-osm-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -.01em;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mapa-osm-badge {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-muted);
          background: var(--border);
          padding: 2px 7px;
          border-radius: 99px;
          flex-shrink: 0;
        }

        /* ── Mapa ── */
        .mapa-osm-map {
          flex: 1;
          position: relative;
        }
        .mapa-osm-map .leaflet-container {
          height: 100% !important;
          width: 100% !important;
          cursor: crosshair !important;
          font-family: inherit;
        }
        /* Ocultar atribución en vistas pequeñas para no abarrotar */
        .mapa-osm-map .leaflet-control-attribution {
          font-size: 9px !important;
          opacity: .6;
        }
        /* Zoom controls más pequeños */
        .mapa-osm-map .leaflet-control-zoom a {
          width: 24px !important;
          height: 24px !important;
          line-height: 24px !important;
          font-size: 14px !important;
        }

        /* ── Overlay hint ── */
        .mapa-osm-hint {
          position: absolute;
          top: 8px; left: 50%;
          transform: translateX(-50%);
          z-index: 500;
          background: rgba(15,23,42,.72);
          color: #fff;
          font-size: 10.5px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 99px;
          backdrop-filter: blur(6px);
          pointer-events: none;
          white-space: nowrap;
          letter-spacing: .01em;
        }

        /* ── Footer coords ── */
        .mapa-osm-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          flex-shrink: 0;
          min-height: 34px;
          animation: fadeSlideUp .2s ease both;
        }
        .mapa-osm-coords {
          flex: 1;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .mapa-osm-coords-placeholder {
          color: var(--text-muted);
          font-weight: 400;
        }
        .mapa-osm-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text-muted);
          cursor: pointer;
          transition: all .15s ease;
          white-space: nowrap;
          letter-spacing: .01em;
          flex-shrink: 0;
        }
        .mapa-osm-btn:hover {
          background: var(--accent-light);
          border-color: var(--accent);
          color: var(--accent);
        }
        .mapa-osm-btn.success {
          background: #f0fdf4;
          border-color: var(--green);
          color: #15803d;
        }
        .mapa-osm-btn-clear {
          padding: 3px 7px;
          color: var(--text-muted);
        }
        .mapa-osm-btn-clear:hover {
          background: #fef2f2;
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>

      <div className="mapa-osm-wrapper">
        {/* Header */}
        <div className="mapa-osm-header">
          <div className={`mapa-osm-dot ${pos ? "active" : ""}`} />
          <span className="mapa-osm-label">{label}</span>
          {readOnly && <span className="mapa-osm-badge">Solo lectura</span>}
        </div>

        {/* Mapa */}
        <div className="mapa-osm-map" style={{ height }}>
          {!pos && !readOnly && (
            <div className="mapa-osm-hint">
              Clic para fijar ubicación
            </div>
          )}
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            attributionControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {!readOnly && <ClickHandler onPlace={handlePlace} />}
            {pos && <Marker position={pos} icon={customIcon} />}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="mapa-osm-footer">
          {coordsText ? (
            <>
              {/* Icono pin pequeño */}
              <svg width="11" height="14" viewBox="0 0 24 36" style={{ flexShrink: 0 }}>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#ef4444"/>
                <circle cx="12" cy="12" r="5" fill="white"/>
              </svg>
              <span className="mapa-osm-coords">{coordsText}</span>
              <button
                className={`mapa-osm-btn ${copied ? "success" : ""}`}
                onClick={handleCopy}
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
              {!readOnly && (
                <button className="mapa-osm-btn mapa-osm-btn-clear" onClick={handleClear} title="Borrar pin">
                  ✕
                </button>
              )}
            </>
          ) : (
            <span className="mapa-osm-coords mapa-osm-coords-placeholder">
              Sin ubicación seleccionada
            </span>
          )}
        </div>
      </div>
    </>
  );
}