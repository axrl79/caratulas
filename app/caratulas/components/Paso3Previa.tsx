import React, { useState, useEffect, useRef } from "react";
import { Categoria, FIELDS, personFields, controlFields, FieldKey, FormData } from "../data/diccionarios";
import { generarCaratulaPDF, CARATULA_ASSETS } from "../generarPDF";

// ── Constantes idénticas a generarPDF.ts ─────────────────────────────────
const W_MM   = 215.9;
const H_MM   = 279.4;
const PDF_GRID_W = 38.25;
const GRID_TO_MM = W_MM / PDF_GRID_W;
const g2mm = (v: number) => v * GRID_TO_MM;

// Offsets (deben coincidir con generarPDF.ts)
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
  sha256:      0,
};

const ROW_STEP_GRID   = 1.275;
const LINE_H_MM       = g2mm(ROW_STEP_GRID);
const EXTRA_LINE_MM   = LINE_H_MM;   // EXTRA_LINE_BELOW_TITULO_MM en generarPDF
const LEFT_COL_EXTRA  = LINE_H_MM;   // EXTRA_LINE_LEFT_COL_MM

// leftColDelta idéntico al PDF
const leftColDelta = LEFT_COL_EXTRA + Y_OFFSET.secInferior;

// Coordenadas base (iguales a generarPDF.ts)
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
  codigo:        { x: 33.0,   y: 7.55  },
};

// Layout imágenes — idéntico a generarPDF.ts
const IMG_LAYOUT = {
  narrowLeft: { gx: 3.55,  gy: 0.8,  maxWmm: g2mm(10.6), maxHmm: g2mm(7.85) },
  wideTop:    { gx: 15.05, gy: 1.74, maxWmm: g2mm(17.8),  maxHmm: g2mm(7.9)  },
};

// Conversión a % del contenedor (para posicionamiento CSS)
const W_GRID = PDF_GRID_W;
const H_GRID = H_MM / GRID_TO_MM;            // = 38.25 * (279.4/215.9) ≈ 49.47

const pctX  = (mm: number) => `${(mm / W_MM)  * 100}%`;
const pctY  = (mm: number) => `${(mm / H_MM)  * 100}%`;
const gx    = (g: number)  => pctX(g2mm(g));
const gy    = (g: number)  => pctY(g2mm(g));

// tituloProyYmm — idéntico al PDF
const BASE           = GLOBAL_Y_OFFSET;
const tituloProyYmm  = g2mm(G.tituloProyLab.y) + EXTRA_LINE_MM + Y_OFFSET.tituloProyY + BASE;
const infBaseMm      = leftColDelta + BASE;

// Helpers para sección inferior (igual que el PDF)
const infY = (gridY: number, extraOffset: number = 0) =>
  pctY(g2mm(gridY) + infBaseMm + extraOffset);

const FIELD_LABELS: Record<string, string> = {
  titulo:          "TÍTULO DEL PROYECTO:",
  niveles:         "NÚMERO DE NIVELES:",
  altMuro:         "ALTURA MÁXIMA ÚTIL DE MURO (m):",
  luzPuente:       "LUZ DEL PUENTE (m):",
  coordenadas:     "COORDENADAS (LAT. – LONG.):",
  municipio:       "MUNICIPIO:",
  zona:            "ZONA:",
  calle:           "CALLE:",
  superfConstruir: "SUPERFICIE A CONSTRUIR (m²):",
  superfTablero:   "SUPERFICIE DEL TABLERO A CONSTRUIR (m²):",
  superfReforzar:  "SUPERFICIE A REFORZAR (m²):",
  areaMuroCon:     "ÁREA DE MURO DE CONTENCIÓN A CONSTRUIR (m²):",
  areaMuroRef:     "ÁREA DE MURO DE CONTENCIÓN A REFORZAR (m²):",
  areaMuroHA:      "ÁREA DE MURO DE CONTENCIÓN DE HORMIGÓN ARMADO (m²):",
  areaMuroHC:      "ÁREA DE MURO DE CONTENCIÓN DE HORMIGÓN CICLÓPEO (m²):",
  norma:           "NORMA DE DISEÑO:",
  interesado:      "NOMBRE DEL INTERESADO (S):",
  ingNombre:       "NOMBRE ING. PROYECTISTA:",
  rni:             "R.N.I.:",
};

const PERSON_FIELDS_LIST: FieldKey[] = ["interesado", "ingNombre", "rni"];

// mainCat display lines (igual que generarPDF)
const mainCatDisplay: Record<string, string[]> = {
  "Estructural":            ["ESTRUCTURAL"],
  "Sanitario":              ["SANITARIO"],
  "Geológico - Geotécnico": ["GEOLÓGICO -", "GEOTÉCNICO"],
  "Eléctrico":              ["ELÉCTRICO"],
  "Mecánico":               ["MECÁNICO"],
  "Ingeniería en General":  ["INGENIERÍA EN", "GENERAL"],
};

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
  // Estados de archivos — viven en el padre para que FieldGuide también los vea
  filesMemoria: File[];
  setFilesMemoria: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanos: File[];
  setFilesPlanos: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanosArq: File[];
  setFilesPlanosArq: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function Paso3Previa({
  C, themeMode, cat, formData, documentQRUrl, documentSHA256, mainCat, goBack, goToStep4, activeGuideKey, setActiveGuideKey,
  filesMemoria, setFilesMemoria,
  filesPlanos, setFilesPlanos,
  filesPlanosArq, setFilesPlanosArq,
}: Paso3PreviaProps) {

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [imgCentro, setImgCentro] = useState<string | null>(null);
  const [imgIzq, setImgIzq] = useState<string | null>(null);

  const [dragOver, setDragOver]             = useState<string | null>(null);

  const isDark = themeMode !== "light";
  const ASPECT = W_MM / H_MM;

  // Escala dinámica: mide el contenedor para calcular px reales
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
  // Factor de escala: 215.9mm = ancho real del PDF
  // En la preview, 1mm = previewW / 215.9 px
  const mmToPx = previewW / W_MM;
  const fs = (pt: number) => `${Math.max(pt * mmToPx * 0.352778, 5)}px`;
  // 1pt = 0.352778mm, luego * mmToPx = px en pantalla

  // cat.active es la fuente de verdad — igual que generarPDF.ts.
  // No usamos CATEGORY_FIELD_RULES aquí porque tiene desincronías con cat.active
  // y solo sirve para validación en el formulario (Paso2).
  const dataFields = cat.active.filter(
    k => !PERSON_FIELDS_LIST.includes(k) && k !== "titulo" && !controlFields.includes(k)
  );

  // ── Cargar imágenes igual que generarPDF ──
  useEffect(() => {
    const load = (url: string, setter: (s: string | null) => void) => {
      fetch(url)
        .then(r => r.ok ? r.blob() : null)
        .then(blob => {
          if (!blob) return;
          const reader = new FileReader();
          reader.onload = () => setter(reader.result as string);
          reader.readAsDataURL(blob);
        }).catch(() => {});
    };
    load(CARATULA_ASSETS.imagenCentro,                  setImgCentro);
    load(CARATULA_ASSETS.logoEspecialidad(mainCat ?? ""), setImgIzq);
  }, [mainCat]);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      await generarCaratulaPDF(formData, cat, documentQRUrl, "letter", documentSHA256, mainCat);
      goToStep4();
    } catch {
      setError("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Upload helpers ──
  const handleDrop = (e: React.DragEvent, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    e.preventDefault(); setDragOver(null);
    setter(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (e.target.files) setter(prev => [...prev, ...Array.from(e.target.files!)]);
  };
  const removeFile = (i: number, files: File[], setter: React.Dispatch<React.SetStateAction<File[]>>) =>
    setter(files.filter((_, idx) => idx !== i));

  // ── Estilos generales ──
  const card: React.CSSProperties = {
    background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20,
    padding: 40, boxShadow: C.glow, backdropFilter: "blur(12px)", transition: "all 0.3s ease",
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
    transition: "all 0.2s", fontWeight: 600,
  };

  // ── DocUploadZone ────────────────────────────────────────────────────
  const DocUploadZone = ({
    label, guideKey, files, setter, dragId, icon,
  }: {
    label: string; guideKey: string; files: File[];
    setter: React.Dispatch<React.SetStateAction<File[]>>;
    dragId: string; icon: string;
  }) => {
    const isHovered = dragOver === dragId;
    const isActive = activeGuideKey === dragId;
    return (
      <div
        style={{
          marginBottom: 16, border: `2px dashed ${isActive ? C.accent : isHovered ? C.accent : C.border}`,
          borderRadius: 14,
          background: isActive
            ? (isDark ? "rgba(34,197,94,0.10)" : "rgba(16,185,129,0.07)")
            : isHovered ? (isDark ? "rgba(34,197,94,0.06)" : "rgba(16,185,129,0.04)") : C.boxBg,
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
            <span style={{ fontSize: "0.75em", color: C.accent, fontWeight: 700, border: `1px solid ${C.accent}`, borderRadius: 6, padding: "3px 8px" }}>+ Subir</span>
          </div>
        </div>
        {files.length === 0 ? (
          <div style={{ padding: "18px 16px", textAlign: "center", color: C.textMuted, fontSize: "0.82em", fontWeight: 500 }}>
            {isHovered ? "✅ Suelta aquí para agregar" : "Arrastra archivos aquí o haz clic para seleccionar"}
          </div>
        ) : (
          <div style={{ padding: "10px 14px" }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", marginBottom: 4, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 8, fontSize: "0.8em" }}>
                <span style={{ color: C.textMain, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>📄 {f.name}</span>
                <span style={{ color: C.textMuted, fontSize: "0.85em", marginLeft: 8, flexShrink: 0 }}>
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                  <button onClick={e => { e.stopPropagation(); removeFile(i, files, setter); }}
                    style={{ marginLeft: 8, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 800, fontSize: "1em", padding: "0 2px" }}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}
        {/* El input de archivos se maneja desde el panel derecho (FieldGuide) */}
      </div>
    );
  };

  // ── Vista previa FIEL al PDF ────────────────────────────────────────────
  //
  // Toda la lógica de posicionamiento replica exactamente las fórmulas de
  // generarPDF.ts: mismos offsets, mismo leftColDelta, mismo tituloProyYmm,
  // mismo espaciado dinámico de filas, mismo centrado del VISADO, etc.
  //
  const PdfPreview = () => {
    // Centro de la columna izquierda (igual que en generarPDF)
    const centerLeftColMm = g2mm(2.5 + 10.6 / 2);

    // Líneas horizontales — idénticas a drawGridLines en generarPDF
    const hLines = [
      { x: 14.936, y: 14.941, l: 20.606 },
      { x: 4.037,  y: 27.642, l: 10.809 },
      { x: 14.936, y: 27.642, l: 20.606 },
      { x: 3.946,  y: 36.064, l: 10.899 },
      { x: 3.946,  y: 42.749, l: 10.899 },
      { x: 3.946,  y: 46.304, l: 10.899 },
      { x: 14.936, y: 46.304, l: 20.606 },
    ];
    // Líneas verticales (segmentos separados, igual que el PDF)
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

    // Espaciado dinámico filas (replica lógica del PDF)
    const cuadroBottomMm    = g2mm(27.642) + BASE;
    // separadorY aproximado (1 línea después del tituloProyY + algo de altura de texto)
    const approxLineHeightMm = 3.2; // ~8.5pt en mm
    const separadorYmm       = tituloProyYmm + approxLineHeightMm + 1;
    const espacioDisponible  = cuadroBottomMm - separadorYmm - 3;
    const espacioPorCampo    = Math.min(LINE_H_MM, espacioDisponible / Math.max(1, dataFields.length));

    // mainCat lines
    const catLines = mainCatDisplay[mainCat ?? ""] ?? [(mainCat || "").toUpperCase()];

    // Posición código (alineado derecha)
    const codeXmm = g2mm(G.codigo.x);
    const codeYmm = g2mm(G.codigo.y) + leftColDelta + Y_OFFSET.header + BASE;

    return (
      <div style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${(1 / ASPECT) * 100}%`,
        background: "#ffffff",
        fontFamily: "Helvetica, Arial, sans-serif",
        color: "#000",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        overflow: "hidden",
        userSelect: "none",
      }}>
        <div style={{ position: "absolute", inset: 0 }}>

          {/* ── Líneas guía SVG (azul, igual que drawGridLines) ── */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            viewBox={`0 0 ${W_MM} ${H_MM}`}
            preserveAspectRatio="none"
          >
            <defs>
              <style>{`
                .gl { stroke:#1f3863; stroke-width:0.3; stroke-dasharray:1 1; fill:none; }
              `}</style>
            </defs>
            {hLines.map((l, i) => (
              <line key={`h${i}`} className="gl"
                x1={g2mm(l.x)} y1={g2mm(l.y) + BASE}
                x2={g2mm(l.x + l.l)} y2={g2mm(l.y) + BASE}
              />
            ))}
            {vLines.map((l, i) => (
              <line key={`v${i}`} className="gl"
                x1={g2mm(l.x)} y1={g2mm(l.y) + BASE}
                x2={g2mm(l.x)} y2={g2mm(l.y + l.l) + BASE}
              />
            ))}
          </svg>

          {/* ── Imagen izquierda (logo especialidad) ── */}
          {imgIzq && (
            <img src={imgIzq} alt="" style={{
              position: "absolute",
              left:   pctX(g2mm(IMG_LAYOUT.narrowLeft.gx)),
              top:    pctY(g2mm(IMG_LAYOUT.narrowLeft.gy) + LEFT_COL_EXTRA + Y_OFFSET.header + BASE),
              maxWidth:  pctX(IMG_LAYOUT.narrowLeft.maxWmm),
              maxHeight: pctY(IMG_LAYOUT.narrowLeft.maxHmm),
              objectFit: "contain",
            }} />
          )}

          {/* ── Imagen centro ── */}
          {imgCentro && (
            <img src={imgCentro} alt="" style={{
              position: "absolute",
              left:   pctX(g2mm(IMG_LAYOUT.wideTop.gx)),
              top:    pctY(g2mm(IMG_LAYOUT.wideTop.gy) + LEFT_COL_EXTRA + Y_OFFSET.header + BASE),
              maxWidth:  pctX(IMG_LAYOUT.wideTop.maxWmm),
              maxHeight: pctY(IMG_LAYOUT.wideTop.maxHmm),
              objectFit: "contain",
            }} />
          )}

          {/* ── Código categoría (PES1, etc.) alineado a la derecha ── */}
          <div style={{
            position: "absolute",
            right: pctX(W_MM - codeXmm),
            top:   pctY(codeYmm),
            fontSize: fs(18), fontWeight: 900,
            textAlign: "right",
          }}>
            {cat.code}
          </div>

          {/* ── VISADO (centrado en columna izquierda, con offset visado) ── */}
          <div style={{
            position: "absolute",
            left: pctX(centerLeftColMm),
            top:  pctY(g2mm(G.visado.y) + leftColDelta + Y_OFFSET.visado + BASE),
            transform: "translateX(-50%)",
            fontSize: fs(14), fontWeight: 900,
            textAlign: "center", lineHeight: 1.4,
            whiteSpace: "nowrap",
          }}>
            VISADO
          </div>

          {/* ── CAT. PRINCIPAL (centrado, con offset visado) ── */}
          {catLines.map((line, i) => (
            <div key={i} style={{
              position: "absolute",
              left: pctX(centerLeftColMm),
              top:  pctY(g2mm(G.catPrincipal.y) + leftColDelta + Y_OFFSET.visado + BASE + i * g2mm(1.1)),
              transform: "translateX(-50%)",
              fontSize: fs(11), fontWeight: 700,
              textAlign: "center", whiteSpace: "nowrap",
            }}>
              {line}
            </div>
          ))}

          {/* ── Título categoría (centrado horizontalmente) ── */}
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            top: pctY(g2mm(G.tituloCatY) + Y_OFFSET.titulos + BASE),
            textAlign: "center",
            fontSize: fs(16), fontWeight: 900,
            textTransform: "uppercase", color: "#0f2419", letterSpacing: 1,
          }}>
            {cat.titulo_caratula}
          </div>

          {/* ── Subtítulo categoría ── */}
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            top: pctY(g2mm(G.subtituloY) + Y_OFFSET.titulos + BASE),
            textAlign: "center",
            fontSize: fs(14), fontWeight: 700, fontStyle: "italic", color: "#444",
          }}>
            {cat.subtitulo_caratula}
          </div>

          {/* ── TÍTULO DEL PROYECTO ── */}
          <div style={{
            position: "absolute",
            left: pctX(g2mm(G.tituloProyLab.x) + 2),
            top:  pctY(tituloProyYmm),
            right: pctX(W_MM - g2mm(35.586) + 3),
            fontSize: fs(8.5),
            display: "flex", flexWrap: "wrap", gap: `${1 * mmToPx}px`,
          }}>
            <span style={{ fontWeight: 900, whiteSpace: "nowrap" }}>TÍTULO DEL PROYECTO: </span>
            <span style={{ fontWeight: 400 }}>{(formData.titulo || "").toUpperCase()}</span>
          </div>

          {/* ── Filas de datos (espaciado dinámico igual que el PDF) ── */}
          {dataFields.map((k, idx) => {
            const rowYmm = separadorYmm + 3 + idx * espacioPorCampo;
            return (
              <div key={k} style={{
                position: "absolute",
                left:  pctX(g2mm(G.tituloProyLab.x) + 2),
                top:   pctY(rowYmm),
                right: pctX(W_MM - g2mm(35.586) + 3),
                fontSize: fs(8.5),
                display: "flex", flexWrap: "wrap", gap: `${1 * mmToPx}px`,
              }}>
                <span style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{FIELD_LABELS[k]} </span>
                <span style={{ fontWeight: 400 }}>{formData[k as keyof FormData] || ""}</span>
              </div>
            );
          })}

          {/* ════════════════════════════════════════════
              SECCIÓN INFERIOR — mismo infBaseMm que el PDF
              ════════════════════════════════════════════ */}

          {/* ── NOMBRE DEL INTERESADO (S) ── */}
          <div style={{
            position: "absolute",
            left: pctX(g2mm(G.interesadoLab.x) + 2),
            top:  infY(G.interesadoLab.y, Y_OFFSET.interesado),
            width: pctX(g2mm(14.891) - g2mm(3.6)),
            fontSize: fs(8.5),
          }}>
            <div style={{ fontWeight: 900 }}>NOMBRE DEL INTERESADO (S):</div>
            <div style={{ fontWeight: 400, marginTop: `${4 * mmToPx}px`, whiteSpace: "pre-line" }}>
            {[
              formData.interesado || "",
              ...(formData.interesados || []),
            ].filter(Boolean).join("\n")}
          </div>
          </div>

          {/* ── SELLO DE CONFORMIDAD + QR ── */}
          <div style={{
            position: "absolute",
            left:  pctX(g2mm(G.conformidad.x) + 2),
            top:   infY(G.conformidad.y, Y_OFFSET.conformidad),
            width: pctX(g2mm(35.586) - g2mm(G.conformidad.x) - 4),
            fontSize: fs(7.5),
          }}>
            <div style={{ fontWeight: 900 }}>SELLO DE CONFORMIDAD:</div>
            {/* QR: 30mm × 30mm igual que el PDF */}
            {documentQRUrl && (
              <img src={documentQRUrl} alt="QR" style={{
                display: "block",
                marginTop: `${g2mm(0.5) * mmToPx}px`,
                width:  "25mm",
                height: "25mm",
              }} />
            )}
          </div>

          {/* ── SELLO Y FIRMA ING. PROYECTISTA ── */}
          <div style={{
            position: "absolute",
            left: pctX(g2mm(G.selloFirma.x) + 2),
            top:  infY(G.selloFirma.y, Y_OFFSET.selloFirma),
            fontSize: fs(8.5), fontWeight: 900,
          }}>
            SELLO Y FIRMA ING. PROYECTISTA:
          </div>

          {/* ── R.N.I. ── */}
          <div style={{
            position: "absolute",
            left: pctX(g2mm(G.rniLab.x) + 2),
            top:  infY(G.rniLab.y, Y_OFFSET.rni),
            fontSize: fs(8.5),
            display: "flex", gap: `${1 * mmToPx}px`,
          }}>
            <span style={{ fontWeight: 900 }}>R.N.I.:</span>
            <span style={{ fontWeight: 400 }}>{formData.rni || ""}</span>
          </div>

          {/* ── NOMBRE ING. ── */}
          <div style={{
            position: "absolute",
            left: pctX(g2mm(G.nombreLab.x) + 2),
            top:  infY(G.nombreLab.y, Y_OFFSET.nombre),
            fontSize: fs(8.5),
            display: "flex", gap: `${1 * mmToPx}px`,
          }}>
            <span style={{ fontWeight: 900 }}>NOMBRE:</span>
            <span style={{ fontWeight: 400 }}>{formData.ingNombre || ""}</span>
          </div>

          {/* ── SHA256 debajo de NOMBRE (igual que el PDF) ── */}
          {documentSHA256 && (
            <div style={{
              position: "absolute",
              left: pctX(g2mm(G.rniLab.x)),
              top:  pctY(g2mm(G.nombreLab.y) + infBaseMm + Y_OFFSET.nombre + Y_OFFSET.sha256 + LINE_H_MM + 1),
              width: pctX(g2mm(14.891) - g2mm(3.6)),
              fontSize: fs(5.5),
              fontFamily: "monospace",
              color: "#3c3c3c",
              wordBreak: "break-all",
              lineHeight: 1.5,
            }}>
              <span style={{ fontWeight: 700, fontFamily: "Helvetica, Arial" }}>ID SHA-256: </span>
              {documentSHA256.substring(0, Math.ceil(documentSHA256.length / 2))}
              <br />
              {documentSHA256.substring(Math.ceil(documentSHA256.length / 2))}
            </div>
          )}

        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={card}>
      <div style={{ fontSize: "2em", color: C.textMain, fontWeight: 800, marginBottom: 8 }}>Vista Previa</div>
      <div style={{ fontSize: "1.05em", color: C.textMuted, marginBottom: 36 }}>
        Verifica los datos antes de exportar el documento PDF oficial.
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 24, fontSize: "0.9em", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 36, flexWrap: "wrap", marginBottom: 40 }}>

        {/* COLUMNA IZQUIERDA: preview + SHA256 + QR */}
        <div style={{ flex: "2", minWidth: 360 }}>
          <div style={{ ...secLabel, marginBottom: 16 }}>📄 Documento Final (Mismo que PDF)</div>
          <div ref={previewRef}><PdfPreview /></div>

          {/* SHA256 + QR debajo de la preview */}
          <div style={{
            marginTop: 20, display: "grid", gridTemplateColumns: "1fr auto",
            gap: 20, alignItems: "start", background: C.boxBg,
            border: `1px solid ${C.border}`, borderRadius: 16, padding: 20,
          }}>
            <div>
              <div style={{ ...secLabel, marginBottom: 10, fontSize: "0.75em" }}>🔐 ID del Trámite (SHA-256)</div>
              <div style={{ fontFamily: "monospace", fontSize: "9.5px", color: C.accent, wordBreak: "break-all", lineHeight: 1.8, background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, letterSpacing: 1 }}>
                {documentSHA256 || "Generando identificador..."}
              </div>
              <div style={{ fontSize: "0.75em", color: C.textMuted, marginTop: 8, fontWeight: 500 }}>
                Código único que identifica este trámite en la base de datos
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ ...secLabel, marginBottom: 4, fontSize: "0.75em" }}>📱 QR ID</div>
              {documentQRUrl ? (
                <div style={{ background: "#fff", padding: 10, borderRadius: 12, border: `2px solid ${C.border}`, boxShadow: C.glow }}>
                  <img src={documentQRUrl} alt="QR ID" style={{ display: "block", width: "25mm", height: "25mm" }} />
                </div>
              ) : (
                <div style={{ width: 120, height: 120, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: 12, border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: "0.75em", fontWeight: 600 }}>
                  Generando...
                </div>
              )}
              <div style={{ fontSize: "0.7em", color: C.textMuted, fontWeight: 500, textAlign: "center", maxWidth: 120 }}>
                Escanear para ver metadata
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: botones de acceso a documentos complementarios */}
        <div style={{ flex: "0 0 auto", minWidth: 240, maxWidth: 280 }}>
          <div style={{ ...secLabel, marginBottom: 16 }}>📎 Documentos Complementarios</div>
          <div style={{ fontSize: "0.8em", color: C.textMuted, marginBottom: 16, lineHeight: 1.6, fontWeight: 500, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
            💡 Haz clic para abrir el panel de carga en el asistente.
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

      {/* Botones de navegación */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <button onClick={goBack} disabled={isGenerating} style={btnSecondary}
          onMouseOver={e => { if (!isGenerating) e.currentTarget.style.background = C.btnSecHover; }}
          onMouseOut={e => { if (!isGenerating) e.currentTarget.style.background = C.btnSecBg; }}>
          ← Editar datos
        </button>
        <button onClick={handleGeneratePDF} disabled={isGenerating} style={btnPrimary}
          onMouseOver={e => { if (!isGenerating) e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
          {isGenerating ? "Generando Documento..." : "Generar Documento Final →"}
        </button>
      </div>
    </div>
  );
}