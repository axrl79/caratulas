import React, { useState, useEffect, useRef } from "react";
import { Categoria, FIELDS, personFields, controlFields, FieldKey, FormData } from "../data/diccionarios";
import { generarCaratulaPDF, CARATULA_ASSETS } from "../generarPDF";

// ── Constantes IDÉNTICAS a generarPDF.ts ──────────────────────────────────
const W_MM       = 215.9;
const H_MM       = 279.4;
const PDF_GRID_W = 38.25;
const GRID_TO_MM = W_MM / PDF_GRID_W;
const g2mm       = (v: number) => v * GRID_TO_MM;

const GLOBAL_Y_OFFSET = 0;
const Y_OFFSET = {
  header:      0,
  visado:     -5,
  titulos:     0,
  tituloProyY: 0,
  dataRows:    0,
  secInferior: 0,
  interesado:  0,
  conformidad: 0,
  selloFirma:  0,
  rni:         0,
  nombre:      0,
  sha256:      3,
};

// Offsets de logo — idénticos a generarPDF.ts
type LogoOffset = { x: number; y: number; scale?: number };
const LOGO_OFFSET: Record<string, LogoOffset> = {
  "Estructural": { x: 0.7, y: 0.5 },
  "Sanitario":   { x: 0,   y: 1,   scale: 0.8 },
};

const ROW_STEP_GRID  = 1.275;
const LINE_H_MM      = g2mm(ROW_STEP_GRID);
const EXTRA_LINE_MM  = LINE_H_MM;
const LEFT_COL_EXTRA = LINE_H_MM;

const BASE         = GLOBAL_Y_OFFSET;
const leftColDelta = LEFT_COL_EXTRA + Y_OFFSET.secInferior;

const G = {
  visado:        { x: 7.274,  y: 10.126 },
  catPrincipal:  { x: 5.204,  y: 11.131 },
  tituloCatY:    12.556,
  subtituloY:    13.809,
  tituloProyLab: { x: 14.971, y: 14.891 },
  primeraFila:   16.736,
  interesadoLab: { x: 3.989,  y: 27.597 },
  conformidad:   { x: 14.971, y: 27.477 },
  selloFirma:    { x: 3.989,  y: 36.014 },
  rniLab:        { x: 3.989,  y: 42.703 },
  nombreLab:     { x: 3.989,  y: 43.544 },
  codigo:        { x: 33.0,   y: 9.8    }, // ← igual que generarPDF.ts
};

const IMG_LAYOUT = {
  narrowLeft: { gx: 3.55,  gy: 0.8,  maxWmm: g2mm(10.6), maxHmm: g2mm(7.85) },
  wideTop:    { gx: 13.8,  gy: 1.74, maxWmm: g2mm(17.8),  maxHmm: g2mm(7.9)  },
};

const INTERESADO_FONT_SIZE    = 9;
const INTERESADO_LINE_SPACING = 1.5; // mm

const tituloProyYmm = g2mm(G.tituloProyLab.y) + EXTRA_LINE_MM + Y_OFFSET.tituloProyY + BASE;
const infBaseMm     = leftColDelta + BASE;

// Helpers de posicionamiento
const pctX = (mm: number) => `${(mm / W_MM) * 100}%`;
const pctY = (mm: number) => `${(mm / H_MM) * 100}%`;
const infY = (gridY: number, extraOffset: number = 0) =>
  pctY(g2mm(gridY) + infBaseMm + extraOffset);

const FIELD_LABELS: Record<string, string> = {
  titulo:             "TÍTULO DEL PROYECTO:",
  coordenadas:        "COORDENADAS (LAT. – LONG.):",
  municipio:          "MUNICIPIO:",
  zona:               "ZONA:",
  calle:              "CALLE:",
  ubicacionInst:      "UBICACIÓN DE LA INSTALACIÓN:",
  niveles:            "NÚMERO DE NIVELES:",
  superfConstruir:    "SUPERFICIE A CONSTRUIR (m²):",
  superfConstruida:   "SUPERFICIE CONSTRUIDA (m²):",
  superfTablero:      "SUPERFICIE DEL TABLERO (m²):",
  superfTableroCon:   "SUPERFICIE DEL TABLERO A CONSTRUIR (m²):",
  superfReforzar:     "SUPERFICIE A REFORZAR (m²):",
  superfTerreno:      "SUPERFICIE DEL TERRENO (m²):",
  superfProspeccion:  "SUPERFICIE DE PROSPECCIÓN (m²):",
  areaMuroCon:        "ÁREA DE MURO DE CONTENCIÓN A CONSTRUIR (m²):",
  areaMuroRef:        "ÁREA DE MURO DE CONTENCIÓN A REFORZAR (m²):",
  areaMuroHA:         "ÁREA DE MURO DE HORMIGÓN ARMADO (m²):",
  areaMuroHC:         "ÁREA DE MURO DE HORMIGÓN CICLÓPEO (m²):",
  areaMuroEst:        "ÁREA DE ESTRIBOS (m²):",
  areaEstribos:       "ÁREA DE ESTRIBOS (m²):",
  areaMuro:           "ÁREA DE MURO DE CONTENCIÓN (m²):",
  luzPuente:          "LUZ DEL PUENTE (m):",
  altMuro:            "ALTURA MÁXIMA TOTAL DE MURO (m):",
  volMovTierras:      "VOLUMEN DE MOVIMIENTO DE TIERRAS (m³):",
  volDemolicion:      "VOLUMEN DE DEMOLICIÓN (m³):",
  numArtefactos:      "NÚMERO DE ARTEFACTOS SANITARIOS:",
  longSistema:        "LONGITUD DEL SISTEMA (m):",
  potenciaInst:       "POTENCIA INSTALADA (kW):",
  potenciaDem:        "POTENCIA DEMANDADA (kW):",
  tensionAlim:        "TENSIÓN DE ALIMENTACIÓN (V):",
  pesoTotal:          "PESO TOTAL DEL EQUIPO (kg):",
  dimensiones:        "DIMENSIONES DEL EQUIPO (m):",
  fuenteEnergia:      "FUENTE DE ENERGÍA:",
  funcionPrincipal:   "FUNCIÓN PRINCIPAL:",
  norma:              "NORMA DE DISEÑO:",
  normaVerif:         "NORMA DE VERIFICACIÓN:",
  normaAplicacion:    "NORMA DE APLICACIÓN:",
  interesado:         "NOMBRE DEL INTERESADO (S):",
  ingNombre:          "NOMBRE ING. PROYECTISTA:",
  rni:                "R.N.I.:",
  distritoJudicial:   "DISTRITO JUDICIAL:",
  nurej:              "NUREJ:",
  nombreJuzgado:      "NOMBRE DEL JUZGADO:",
};

const PERSON_FIELDS_LIST: FieldKey[]   = ["interesado", "ingNombre", "rni"];
const CONTROL_FIELDS_EXTRA: FieldKey[] = ["tienePlanos", "numPlanos", "numCopias"];

const mainCatDisplay: Record<string, string[]> = {
  "Estructural":            ["ESTRUCTURAL"],
  "Sanitario":              ["SANITARIO"],
  "Geológico - Geotécnico": ["GEOLÓGICO -", "GEOTÉCNICO"],
  "Eléctrico":              ["ELÉCTRICO"],
  "Mecánico":               ["MECÁNICO"],
  "Ingeniería en General":  ["INGENIERÍA EN GENERAL"],
};

// ── Algoritmo de layout de filas — IDÉNTICO a drawDataFields en generarPDF.ts ──
// Devuelve array de { key, yMm } con la posición Y real de cada campo
function calcDataFieldPositions(
  dataFields: string[],
  formData: FormData,
  separadorYmm: number,
  cuadroBottomMm: number,
  mmToPx: number  // solo para estimar el lineH aproximado en mm
): { key: string; yMm: number; labelLines: number; valueLines: number }[] {
  if (dataFields.length === 0) return [];

  // lineH aproximado a 8.5pt en mm  (1pt = 0.352778mm, lineH ≈ fontSize*1.2)
  const lineHmm = 8.5 * 0.352778 * 1.2;

  // ── PASO 1: estimar líneas de cada campo ──
  // En la preview no tenemos jsPDF para splitTextToSize, así que
  // estimamos cuántos caracteres caben por línea según el ancho disponible.
  const dataX        = g2mm(G.tituloProyLab.x) + 2;
  const dataColRight = g2mm(35.586) - 3;
  const maxWmm       = dataColRight - dataX;

  // Ancho de un carácter aprox a 8.5pt helvetica (monospace approx)
  const charWmm = 8.5 * 0.352778 * 0.55; // factor empírico

  const camposConLineas = dataFields.map(k => {
    const val   = (formData[k as keyof FormData] as string) || "";
    const label = (FIELD_LABELS[k] ?? `${k.toUpperCase()}:`) + " ";
    const lwMm  = label.length * charWmm * 0.9; // bold es un poco más ancho
    const availW = maxWmm - lwMm;
    if (!val || availW <= 0) return 1;
    const charsPerLine = Math.max(1, Math.floor(availW / charWmm));
    return Math.max(1, Math.ceil(val.length / charsPerLine));
  });

  // ── PASO 2: gap uniforme (igual que generarPDF.ts) ──
  const totalLineas       = camposConLineas.reduce((a, b) => a + b, 0);
  const espacioDisponible = cuadroBottomMm - separadorYmm - 3;
  const GAP_MAX = 5;
  const GAP_MIN = 0.8;
  const espacioParaGaps = espacioDisponible - lineHmm * totalLineas;
  const gapEntreCampos  = Math.min(GAP_MAX, Math.max(GAP_MIN, espacioParaGaps / Math.max(1, dataFields.length)));

  // ── PASO 3: calcular posición Y de cada campo ──
  let cy = separadorYmm + 3;
  return dataFields.map((k, idx) => {
    const yMm       = cy;
    const nLines    = camposConLineas[idx];
    cy += lineHmm * nLines + gapEntreCampos;
    return { key: k, yMm, labelLines: 1, valueLines: nLines };
  });
}

// ── Props ─────────────────────────────────────────────────────────────────
interface Paso3PreviaProps {
  C: any;
  themeMode: "light" | "dark" | "engineering";
  cat: Categoria;
  formData: FormData;
  documentQRUrl: string;
  documentSHA256: string;
  mainCat: string;
  goBack: () => void;
  goToStep4: () => void;
  activeGuideKey: string | null;
  setActiveGuideKey: (key: string | null) => void;
  filesMemoria: File[];
  setFilesMemoria: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanos: File[];
  setFilesPlanos: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanosArq: File[];
  setFilesPlanosArq: React.Dispatch<React.SetStateAction<File[]>>;
  onEnviarABD: () => Promise<void>;
}

export default function Paso3Previa({
  C, themeMode, cat, formData, documentQRUrl, documentSHA256, mainCat, goBack, goToStep4,
  activeGuideKey, setActiveGuideKey,
  filesMemoria, setFilesMemoria,
  filesPlanos, setFilesPlanos,
  filesPlanosArq, setFilesPlanosArq,
  onEnviarABD,
}: Paso3PreviaProps) {

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError]               = useState<string>("");
  const [imgCentro, setImgCentro]       = useState<string | null>(null);
  const [imgIzq, setImgIzq]             = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState<string | null>(null);
  const [zoomOpen, setZoomOpen]         = useState(false);
  const [zoomLevel, setZoomLevel]       = useState(1);

  const ZOOM_MIN  = 0.5;
  const ZOOM_MAX  = 3;
  const ZOOM_STEP = 0.2;

  const handleZoomIn    = () => setZoomLevel(z => Math.min(z + ZOOM_STEP, ZOOM_MAX));
  const handleZoomOut   = () => setZoomLevel(z => Math.max(z - ZOOM_STEP, ZOOM_MIN));
  const handleZoomReset = () => setZoomLevel(1);
  const handleWheel     = (e: React.WheelEvent) => {
    e.preventDefault(); e.stopPropagation();
    setZoomLevel(z => Math.min(Math.max(z - e.deltaY * 0.001, ZOOM_MIN), ZOOM_MAX));
  };

  const isDark = themeMode !== "light";
  const ASPECT = W_MM / H_MM;

  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(600);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setPreviewW(e.contentRect.width);
    });
    ro.observe(el);
    setPreviewW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const allControlFields = new Set([
    ...controlFields, ...CONTROL_FIELDS_EXTRA, ...PERSON_FIELDS_LIST, "titulo", "nombreJuzgado",
  ]);
  const dataFields = cat.active.filter(k => !allControlFields.has(k));

  useEffect(() => {
    const load = (url: string, setter: (s: string | null) => void) => {
      fetch(url).then(r => r.ok ? r.blob() : null).then(blob => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onload = () => setter(reader.result as string);
        reader.readAsDataURL(blob);
      }).catch(() => {});
    };
    load(CARATULA_ASSETS.imagenCentro, setImgCentro);
    load(CARATULA_ASSETS.logoEspecialidad(mainCat ?? ""), setImgIzq);
  }, [mainCat]);

  const handleGeneratePDF = async () => {
    setIsGenerating(true); setError("");
    try {
      await generarCaratulaPDF(formData, cat, documentQRUrl, "letter", documentSHA256, mainCat);
      goToStep4();
    } catch {
      setError("Error al generar el PDF. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDrop = (e: React.DragEvent, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    e.preventDefault(); setDragOver(null);
    setter(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };
  const removeFile = (i: number, files: File[], setter: React.Dispatch<React.SetStateAction<File[]>>) =>
    setter(files.filter((_, idx) => idx !== i));
  const openFilePicker = (setter: React.Dispatch<React.SetStateAction<File[]>>, e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "file"; input.multiple = true;
    input.onchange = () => { if (input.files) setter(prev => [...prev, ...Array.from(input.files!)]); };
    input.click();
  };

  // ── Estilos ──
  const card: React.CSSProperties = {
    background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20,
    padding: "clamp(20px, 5vw, 40px)", boxShadow: C.glow, backdropFilter: "blur(12px)",
  };
  const secLabel: React.CSSProperties = {
    fontSize: "0.82em", textTransform: "uppercase", letterSpacing: 2,
    color: C.accent, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
  };
  const btnPrimary: React.CSSProperties = {
    background: C.accent, color: themeMode === "light" ? "#fff" : C.deepGreen,
    border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 700, fontSize: "1em",
    cursor: isGenerating ? "not-allowed" : "pointer", opacity: isGenerating ? 0.7 : 1,
    transition: "all 0.2s", boxShadow: `0 4px 14px ${C.border}`,
  };
  const btnSecondary: React.CSSProperties = {
    background: C.btnSecBg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "14px 32px", color: C.textMain, fontSize: "1em",
    cursor: isGenerating ? "not-allowed" : "pointer", opacity: isGenerating ? 0.7 : 1,
    fontWeight: 600,
  };

  // ── DocUploadZone ──────────────────────────────────────────────────────
  const DocUploadZone = ({
    label, guideKey, files, setter, dragId, icon,
  }: {
    label: string; guideKey: string; files: File[];
    setter: React.Dispatch<React.SetStateAction<File[]>>;
    dragId: string; icon: string;
  }) => {
    const isHovered = dragOver === dragId;
    const isActive  = activeGuideKey === dragId;
    return (
      <div
        style={{
          marginBottom: 16, border: `2px dashed ${isActive || isHovered ? C.accent : C.border}`,
          borderRadius: 14, background: isActive || isHovered
            ? (isDark ? "rgba(34,197,94,0.10)" : "rgba(16,185,129,0.07)")
            : C.boxBg,
          transition: "all 0.2s ease", overflow: "hidden", cursor: "pointer",
          boxShadow: isActive ? `0 0 0 2px ${C.accent}` : "none",
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(dragId); }}
        onDragLeave={() => setDragOver(null)}
        onDrop={e => handleDrop(e, setter)}
        onClick={() => setActiveGuideKey(guideKey)}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: files.length > 0 ? `1px solid ${C.border}` : "none",
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: "0.82em", textTransform: "uppercase", letterSpacing: 1.5, color: C.textSec, fontWeight: 800 }}>{label}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {files.length > 0 && (
              <span style={{ background: C.accent, color: themeMode === "light" ? "#fff" : C.deepGreen, borderRadius: 20, padding: "2px 10px", fontSize: "0.75em", fontWeight: 800 }}>
                {files.length} archivo{files.length > 1 ? "s" : ""}
              </span>
            )}
            <button onClick={(e) => openFilePicker(setter, e)} style={{ fontSize: "0.82em", color: themeMode === "light" ? "#fff" : C.deepGreen, fontWeight: 700, background: C.accent, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
              + Subir
            </button>
          </div>
        </div>
        {files.length === 0 ? (
          <div style={{ padding: "18px 16px", textAlign: "center", color: C.textMuted, fontSize: "0.82em", fontWeight: 500 }}>
            {isHovered ? "✅ Suelta aquí para agregar" : 'Haz clic en "+ Subir" o arrastra archivos aquí'}
          </div>
        ) : (
          <div style={{ padding: "10px 14px" }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", marginBottom: 4, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 8, fontSize: "0.8em" }}>
                <span style={{ color: C.textMain, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>📄 {f.name}</span>
                <span style={{ color: C.textMuted, fontSize: "0.85em", marginLeft: 8, flexShrink: 0 }}>
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                  <button onClick={e => { e.stopPropagation(); removeFile(i, files, setter); }} style={{ marginLeft: 8, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 800, fontSize: "1em", padding: "0 2px" }}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Vista previa ──────────────────────────────────────────────────────
  const PdfPreviewContent = ({ widthPx }: { widthPx?: number }) => {
    const effectiveMmToPx = (widthPx ?? previewW) / W_MM;
    // fs: convierte pt → px  (1pt = 0.352778mm, luego mm → px)
    const fs = (pt: number) => `${Math.max(pt * 0.352778 * effectiveMmToPx, widthPx ? 7 : 5)}px`;

    // ── Separador Y (aproximado, igual que el PDF) ──
    const approxTituloLines = Math.ceil(
      ((formData.titulo || "").length * 8.5 * 0.352778 * 0.55) /
      (g2mm(35.586) - 3 - (g2mm(G.tituloProyLab.x) + 2) - (("TÍTULO DEL PROYECTO: ").length * 8.5 * 0.352778 * 0.55))
    ) || 1;
    const lineHmm    = 8.5 * 0.352778 * 1.2;
    const separadorYmm  = tituloProyYmm + lineHmm * Math.max(1, approxTituloLines) + 1;
    const cuadroBottomMm = g2mm(27.642) + BASE;

    // ── Posiciones de filas de datos ──
    const fieldPositions = calcDataFieldPositions(
      dataFields, formData, separadorYmm, cuadroBottomMm, effectiveMmToPx
    );

    // ── Centro columna izquierda ── idéntico al PDF
    const centerLeftColMm = g2mm(2.1 + 10.6 / 2);

    // ── Código x,y ──
    const codeXmm = g2mm(G.codigo.x);
    const codeYmm = g2mm(G.codigo.y) + leftColDelta + Y_OFFSET.header + BASE;

    // ── Logo izquierdo con offset ──
    const off: LogoOffset       = LOGO_OFFSET[mainCat ?? ""] ?? { x: 0, y: 0 };
    const logoScale             = off.scale ?? 1;
    const logoLeftMm            = g2mm(IMG_LAYOUT.narrowLeft.gx) + g2mm(off.x);
    const logoTopMm             = g2mm(IMG_LAYOUT.narrowLeft.gy) + LEFT_COL_EXTRA + Y_OFFSET.header + BASE + g2mm(off.y);
    const logoMaxWmm            = IMG_LAYOUT.narrowLeft.maxWmm * logoScale;
    const logoMaxHmm            = IMG_LAYOUT.narrowLeft.maxHmm * logoScale;

    // ── Título principal (INT1/INP1) ──
    const isInformeEspecial   = cat.code === "INT1" || cat.code === "INP1";
    const tituloPrincipal     = isInformeEspecial && formData.areaIngenieria
      ? `${cat.titulo_caratula} ${(formData.areaIngenieria).toUpperCase()}`
      : cat.titulo_caratula;
    const subtituloPrincipal  = isInformeEspecial && formData.temaIngenieria
      ? `– ${formData.temaIngenieria}`
      : cat.subtitulo_caratula;
    const tituloFontSize      = tituloPrincipal.length > 30 ? 13 : 16;

    // ── Interesados / INP1 ──
    const isINP1    = cat.code === "INP1";
    const labelInt  = isINP1 ? "NOMBRE DEL JUZGADO:" : "NOMBRE DEL INTERESADO (S):";
    const nombresInt = isINP1
      ? [formData.nombreJuzgado || ""].filter(Boolean)
      : [formData.interesado || "", ...(formData.interesados || [])].filter(Boolean);

    // ── QR — misma posición que el PDF ──
    const qrXmm   = g2mm(G.conformidad.x) + 0;
    const qrYmm   = g2mm(G.conformidad.y) + infBaseMm + Y_OFFSET.conformidad - 5.5;
    const qrSizeMm = 33;

    // ── SELLO DE CONFORMIDAD label ──
    const selloLabXmm = g2mm(G.conformidad.x) + 34;
    const selloLabYmm = g2mm(G.conformidad.y) + infBaseMm + Y_OFFSET.conformidad - 3;

    // ── SHA-256 ──
    const sha256Ymm = g2mm(G.nombreLab.y) + infBaseMm + Y_OFFSET.nombre + Y_OFFSET.sha256 + LINE_H_MM + 1;

    // ── Líneas guía SVG ──
    const hLines = [
      { x: 14.936, y: 14.941, l: 20.606 },
      { x: 4.037,  y: 27.642, l: 10.809 },
      { x: 14.936, y: 27.642, l: 20.606 },
      { x: 3.946,  y: 36.064, l: 10.899 },
      { x: 3.946,  y: 42.749, l: 10.899 },
      { x: 3.946,  y: 46.304, l: 10.899 },
      { x: 14.936, y: 46.304, l: 20.606 },
    ];
    const vLines = [
      { x: 14.891, y: 14.994, l: 1.809  },
      { x: 35.586, y: 14.994, l: 1.809  },
      { x: 14.891, y: 16.833, l: 10.764 },
      { x: 35.586, y: 16.833, l: 10.764 },
      { x: 3.901,  y: 27.694, l: 0.682  },
      { x: 14.891, y: 27.694, l: 0.682  },
      { x: 35.586, y: 27.694, l: 0.682  },
      { x: 3.901,  y: 28.377, l: 5.25   },
      { x: 14.891, y: 28.377, l: 5.25   },
      { x: 35.586, y: 28.377, l: 5.25   },
      { x: 3.901,  y: 33.627, l: 2.392  },
      { x: 14.891, y: 33.627, l: 2.392  },
      { x: 35.586, y: 33.627, l: 2.392  },
      { x: 3.901,  y: 36.117, l: 6.587  },
      { x: 14.891, y: 36.117, l: 6.587  },
      { x: 35.586, y: 36.117, l: 6.587  },
      { x: 3.901,  y: 42.801, l: 3.457  },
      { x: 14.891, y: 42.801, l: 3.457  },
      { x: 35.586, y: 42.801, l: 3.457  },
    ];

    const catLines = mainCatDisplay[mainCat ?? ""] ?? [(mainCat || "").toUpperCase()];

    return (
      <div style={{
        position: "relative", width: "100%",
        paddingBottom: `${(1 / ASPECT) * 100}%`,
        background: "#ffffff", fontFamily: "Helvetica, Arial, sans-serif",
        color: "#000", border: "1px solid #d1d5db", borderRadius: 8,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden", userSelect: "none",
      }}>
        <div style={{ position: "absolute", inset: 0 }}>

          {/* ── Líneas guía SVG ── */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            viewBox={`0 0 ${W_MM} ${H_MM}`} preserveAspectRatio="none">
            <defs><style>{`.gl{stroke:#1f3863;stroke-width:0.3;stroke-dasharray:1 1;fill:none}`}</style></defs>
            {hLines.map((l, i) => (
              <line key={`h${i}`} className="gl"
                x1={g2mm(l.x)} y1={g2mm(l.y) + BASE} x2={g2mm(l.x + l.l)} y2={g2mm(l.y) + BASE} />
            ))}
            {vLines.map((l, i) => (
              <line key={`v${i}`} className="gl"
                x1={g2mm(l.x)} y1={g2mm(l.y) + BASE} x2={g2mm(l.x)} y2={g2mm(l.y + l.l) + BASE} />
            ))}
          </svg>

          {/* ── Logo izquierdo con LOGO_OFFSET ── */}
          {imgIzq && (
            <img src={imgIzq} alt="" style={{
              position: "absolute",
              left:      pctX(logoLeftMm),
              top:       pctY(logoTopMm),
              maxWidth:  pctX(logoMaxWmm),
              maxHeight: pctY(logoMaxHmm),
              objectFit: "contain",
            }} />
          )}

          {/* ── Logo centro ── */}
          {imgCentro && (
            <img src={imgCentro} alt="" style={{
              position: "absolute",
              left:      pctX(g2mm(IMG_LAYOUT.wideTop.gx)),
              top:       pctY(g2mm(IMG_LAYOUT.wideTop.gy) + LEFT_COL_EXTRA + Y_OFFSET.header + BASE),
              maxWidth:  pctX(IMG_LAYOUT.wideTop.maxWmm),
              maxHeight: pctY(IMG_LAYOUT.wideTop.maxHmm),
              objectFit: "contain",
            }} />
          )}

          {/* ── Código (PSA1, etc.) — alineado a la derecha igual que el PDF ── */}
          <div style={{
            position: "absolute",
            right:  pctX(W_MM - codeXmm),
            top:    pctY(codeYmm),
            fontSize: fs(18), fontWeight: 900,
            borderBottom: `${0.4 * effectiveMmToPx}px solid #000`,
            paddingBottom: `${1 * effectiveMmToPx}px`,
          }}>
            {cat.code}
          </div>

          {/* ── VISADO ── */}
          <div style={{
            position: "absolute",
            left:      pctX(centerLeftColMm),
            top:       pctY(g2mm(G.visado.y) + leftColDelta + Y_OFFSET.visado + BASE),
            transform: "translateX(-50%)",
            fontSize: fs(12), fontWeight: 900, textAlign: "center", whiteSpace: "nowrap",
          }}>
            VISADO
          </div>

          {/* ── Categoría principal ── */}
          {catLines.map((line, i) => (
            <div key={i} style={{
              position: "absolute",
              left:      pctX(centerLeftColMm),
              top:       pctY(g2mm(G.catPrincipal.y) + leftColDelta + Y_OFFSET.visado + BASE + i * g2mm(1.1)),
              transform: "translateX(-50%)",
              fontSize: fs(11), fontWeight: 700, textAlign: "center", whiteSpace: "nowrap",
            }}>
              {line}
            </div>
          ))}

          {/* ── Título disciplina ── */}
          <div style={{
            position: "absolute", left: 0, right: 0,
            top: pctY(g2mm(G.tituloCatY) + Y_OFFSET.titulos + BASE),
            textAlign: "center", fontSize: fs(tituloFontSize),
            fontWeight: 900, textTransform: "uppercase", color: "#0f2419", letterSpacing: 1, padding: "0 4px",
          }}>
            {tituloPrincipal}
          </div>

          {/* ── Subtítulo disciplina ── */}
          <div style={{
            position: "absolute", left: 0, right: 0,
            top: pctY(g2mm(G.subtituloY) + Y_OFFSET.titulos + BASE),
            textAlign: "center", fontSize: fs(14), fontWeight: 700, fontStyle: "italic", color: "#444",
          }}>
            {subtituloPrincipal}
          </div>

          {/* ── TÍTULO DEL PROYECTO ── */}
          <div style={{
            position: "absolute",
            left:  pctX(g2mm(G.tituloProyLab.x) + 2),
            top:   pctY(tituloProyYmm),
            right: pctX(W_MM - g2mm(35.586) + 3),
            fontSize: fs(8.5),
            display: "flex", flexWrap: "wrap", gap: `${0.5 * effectiveMmToPx}px`,
          }}>
            <span style={{ fontWeight: 900, whiteSpace: "nowrap" }}>TÍTULO DEL PROYECTO: </span>
            <span style={{ fontWeight: 400 }}>{(formData.titulo || "").toUpperCase()}</span>
          </div>

          {/* ── Filas de datos — posicionadas con el mismo algoritmo del PDF ── */}
          {fieldPositions.map(({ key: k, yMm }) => {
            const label = (FIELD_LABELS[k] ?? `${k.toUpperCase()}:`) + " ";
            const valor = (formData[k as keyof FormData] as string) || "";
            return (
              <div key={k} style={{
                position: "absolute",
                left:  pctX(g2mm(G.tituloProyLab.x) + 2),
                top:   pctY(yMm),
                right: pctX(W_MM - g2mm(35.586) + 3),
                fontSize: fs(8.5),
                display: "flex", flexWrap: "wrap", gap: `${0.5 * effectiveMmToPx}px`,
              }}>
                <span style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{label}</span>
                <span style={{ fontWeight: 400 }}>{valor}</span>
              </div>
            );
          })}

          {/* ── NOMBRE DEL INTERESADO / JUZGADO ── */}
          <div style={{
            position: "absolute",
            left:  pctX(g2mm(G.interesadoLab.x) + 2),
            top:   infY(G.interesadoLab.y, Y_OFFSET.interesado),
            width: pctX(g2mm(14.891) - g2mm(3.6)),
            fontSize: fs(8.5),
          }}>
            <div style={{ fontWeight: 900 }}>{labelInt}</div>
            <div style={{ fontWeight: 400, marginTop: `${4 * effectiveMmToPx}px` }}>
              {nombresInt.map((n, i) => (
                <div key={i} style={{ marginBottom: `${INTERESADO_LINE_SPACING * effectiveMmToPx}px` }}>{n}</div>
              ))}
            </div>
          </div>

          {/* ── SELLO DE CONFORMIDAD label ── */}
          <div style={{
            position: "absolute",
            left: pctX(selloLabXmm),
            top:  pctY(selloLabYmm),
            fontSize: fs(7.5), fontWeight: 900,
          }}>
            SELLO DE CONFORMIDAD:
          </div>

          {/* ── QR — posición idéntica al PDF ── */}
          {documentQRUrl && (
            <img src={documentQRUrl} alt="QR" style={{
              position: "absolute",
              left:   pctX(qrXmm),
              top:    pctY(qrYmm),
              width:  pctX(qrSizeMm),
              height: pctY(qrSizeMm),
              objectFit: "contain",
            }} />
          )}

          {/* ── SELLO Y FIRMA ── */}
          <div style={{
            position: "absolute",
            left:     pctX(g2mm(G.selloFirma.x) + 2),
            top:      infY(G.selloFirma.y, Y_OFFSET.selloFirma),
            fontSize: fs(8.5), fontWeight: 900,
          }}>
            SELLO Y FIRMA ING. PROYECTISTA:
          </div>

          {/* ── R.N.I. ── */}
          <div style={{
            position: "absolute",
            left:     pctX(g2mm(G.rniLab.x) + 2),
            top:      infY(G.rniLab.y, Y_OFFSET.rni),
            fontSize: fs(INTERESADO_FONT_SIZE),
            display: "flex", gap: `${0.5 * effectiveMmToPx}px`,
          }}>
            <span style={{ fontWeight: 900 }}>R.N.I.:</span>
            <span style={{ fontWeight: 400 }}>{formData.rni || ""}</span>
          </div>

          {/* ── NOMBRE ING. ── */}
          <div style={{
            position: "absolute",
            left:     pctX(g2mm(G.nombreLab.x) + 2),
            top:      infY(G.nombreLab.y, Y_OFFSET.nombre),
            right:    pctX(W_MM - g2mm(14.891) + 1),
            fontSize: fs(INTERESADO_FONT_SIZE),
            display: "flex", flexWrap: "wrap", gap: `${0.5 * effectiveMmToPx}px`,
          }}>
            <span style={{ fontWeight: 900, whiteSpace: "nowrap" }}>NOMBRE:</span>
            <span style={{ fontWeight: 400 }}>{formData.ingNombre || ""}</span>
          </div>

          {/* ── SHA-256 ── */}
          {documentSHA256 && (
            <div style={{
              position: "absolute",
              left:  pctX(g2mm(G.rniLab.x)),
              top:   pctY(sha256Ymm),
              right: pctX(W_MM - g2mm(14.891)),
              fontSize: fs(7), fontFamily: "monospace",
              color: "#3c3c3c", wordBreak: "break-all", lineHeight: 1.4,
              display: "flex", flexWrap: "wrap", gap: `${0.3 * effectiveMmToPx}px`,
            }}>
              <span style={{ fontWeight: 700, fontFamily: "Helvetica, Arial", whiteSpace: "nowrap" }}>ID SHA-256: </span>
              <span>{documentSHA256}</span>
            </div>
          )}

        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={card}>

      {/* ── LIGHTBOX CON ZOOM ── */}
      {zoomOpen && (
        <div
          onClick={() => { setZoomOpen(false); setZoomLevel(1); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
            backdropFilter: "blur(8px)", overflow: "hidden",
          }}
        >
          {/* Barra controles */}
          <div onClick={e => e.stopPropagation()} style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 10000,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px 20px", background: "rgba(0,0,0,0.60)", backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
          }}>
            <button onClick={handleZoomOut} disabled={zoomLevel <= ZOOM_MIN}
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, width: 36, height: 36, fontSize: "1.2em", cursor: zoomLevel <= ZOOM_MIN ? "not-allowed" : "pointer", opacity: zoomLevel <= ZOOM_MIN ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="range" min={ZOOM_MIN * 100} max={ZOOM_MAX * 100} step={ZOOM_STEP * 100}
                value={Math.round(zoomLevel * 100)} onChange={e => setZoomLevel(Number(e.target.value) / 100)}
                style={{ width: 120, accentColor: "#22c55e", cursor: "pointer" }} />
              <span style={{ color: "#fff", fontSize: "0.82em", fontWeight: 700, minWidth: 42, textAlign: "center", background: "rgba(255,255,255,0.10)", borderRadius: 6, padding: "2px 8px" }}>
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
            <button onClick={handleZoomIn} disabled={zoomLevel >= ZOOM_MAX}
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, width: 36, height: 36, fontSize: "1.2em", cursor: zoomLevel >= ZOOM_MAX ? "not-allowed" : "pointer", opacity: zoomLevel >= ZOOM_MAX ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            <button onClick={handleZoomReset}
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", color: "#ccc", borderRadius: 8, padding: "0 12px", height: 36, fontSize: "0.76em", fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}>1:1</button>
            <div style={{ flex: 1 }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72em", fontWeight: 500 }}>🖱 Rueda del mouse para zoom</span>
            <button onClick={() => { setZoomOpen(false); setZoomLevel(1); }}
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, width: 36, height: 36, fontSize: "1.1em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>

          {/* Documento escalado */}
          <div onClick={e => e.stopPropagation()} onWheel={handleWheel}
            style={{ marginTop: 60, flex: 1, width: "100%", overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 24px 40px", boxSizing: "border-box" }}>
            <div style={{
              width: 820, flexShrink: 0, transformOrigin: "top center",
              transform: `scale(${zoomLevel})`,
              marginBottom: `${(zoomLevel - 1) * 820 * (H_MM / W_MM)}px`,
              marginLeft:   `${(zoomLevel - 1) * 820 / 2}px`,
              marginRight:  `${(zoomLevel - 1) * 820 / 2}px`,
              transition: "transform 0.12s ease",
              borderRadius: 8, boxShadow: "0 24px 80px rgba(0,0,0,0.7)", overflow: "hidden",
            }}>
              <PdfPreviewContent widthPx={820} />
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: "2em", color: C.textMain, fontWeight: 800, marginBottom: 8 }}>Vista Previa</div>
      <div style={{ fontSize: "1.05em", color: C.textMuted, marginBottom: 36 }}>
        Verifica los datos antes de exportar el documento PDF oficial.
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 24, fontSize: "0.9em", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "clamp(16px, 4vw, 36px)", flexWrap: "wrap", marginBottom: 40 }}>

        {/* COLUMNA IZQUIERDA — preview */}
        <div style={{ flex: "1 1 360px", minWidth: 0 }}>
          <div style={{ ...secLabel, marginBottom: 8 }}>📄 Documento Final (Mismo que PDF)</div>
          <div style={{ fontSize: "0.74em", color: C.textMuted, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            <span>🔍</span>
            <span>Haz clic en el documento para ampliar y revisar los datos</span>
          </div>
          <div
            ref={previewRef}
            onClick={() => setZoomOpen(true)}
            style={{ width: "100%", overflow: "hidden", cursor: "zoom-in", borderRadius: 8, transition: "box-shadow 0.2s", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
            onMouseOver={e => (e.currentTarget.style.boxShadow = `0 4px 24px ${C.accent}55`)}
            onMouseOut={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.10)")}
            title="Clic para ampliar"
          >
            <PdfPreviewContent />
          </div>
        </div>

        {/* COLUMNA DERECHA — documentos */}
        <div style={{ flex: "1 1 240px", maxWidth: "100%" }}>
          <div style={{ ...secLabel, marginBottom: 16 }}>📎 Documentos Complementarios</div>
          <div style={{ fontSize: "0.8em", color: C.textMuted, marginBottom: 16, lineHeight: 1.6, fontWeight: 500, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
            💡 Presiona <strong>+ Subir</strong> para adjuntar archivos · Haz clic en el área para ver la guía.
          </div>
          <DocUploadZone label="Memorias de Cálculo"    guideKey="memorias"  files={filesMemoria}   setter={setFilesMemoria}   dragId="memorias"  icon="🧮" />
          <DocUploadZone label="Planos"                 guideKey="planos"    files={filesPlanos}    setter={setFilesPlanos}    dragId="planos"    icon="📐" />
          <DocUploadZone label="Planos Arquitectónicos" guideKey="planosArq" files={filesPlanosArq} setter={setFilesPlanosArq} dragId="planosArq" icon="🏛️" />
          {(filesMemoria.length + filesPlanos.length + filesPlanosArq.length) > 0 && (
            <div style={{ marginTop: 10, textAlign: "center", fontSize: "0.8em", color: C.accent, fontWeight: 700 }}>
              ✅ {filesMemoria.length + filesPlanos.length + filesPlanosArq.length} archivo(s) agregados
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
        <button onClick={goBack} disabled={isGenerating} style={{ ...btnSecondary, flex: "1 1 auto" }}
          onMouseOver={e => { if (!isGenerating) e.currentTarget.style.background = C.btnSecHover; }}
          onMouseOut={e => { if (!isGenerating) e.currentTarget.style.background = C.btnSecBg; }}>
          ← Editar datos
        </button>
        <button onClick={handleGeneratePDF} disabled={isGenerating} style={{ ...btnPrimary, flex: "1 1 auto" }}
          onMouseOver={e => { if (!isGenerating) e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
          {isGenerating ? "Generando..." : "Generar Documento →"}
        </button>
      </div>
    </div>
  );
}