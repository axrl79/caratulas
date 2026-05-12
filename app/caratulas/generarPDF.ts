import jsPDF from "jspdf";
import { FieldKey, Categoria, CATEGORY_FIELD_RULES, FormData, controlFields } from "./data/diccionarios";

/** Rutas bajo `public/` para imágenes de la carátula */
export const CARATULA_ASSETS = {
  imagenCentro: "/imagencentro.jpg",
  selloForCode: (code: string) => `/caratulas/sello-${code}.png`,
  selloDefault: "/caratulas/sello.png",
  logoEspecialidad: (mainCat: string): string => {
    const map: Record<string, string> = {
      "Estructural":            "/especialidades/logo_estructural_car.png",
      "Sanitario":              "/especialidades/logo_sanitario_car.png",
      "Geológico - Geotécnico": "/especialidades/logo_geologico_car.png",
      "Eléctrico":              "/especialidades/logo_electrico_car.png",
      "Mecánico":               "/especialidades/logo_mecanico_car.png",
      "Ingeniería en General":  "/especialidades/logo_ingenieria_gral_car.png",
    };
    return map[mainCat] ?? "/especialidades/logo_estructural_car.png";
  },
} as const;

// Offsets individuales por especialidad para el logo izquierdo.
// Positivo en x → mueve a la derecha. Positivo en y → mueve hacia abajo.
// Solo afecta a las especialidades listadas; el resto queda en { x:0, y:0 }.
type LogoOffset = { x: number; y: number; scale?: number };
const LOGO_OFFSET: Record<string, LogoOffset> = {
  "Estructural": { x: 0.7, y: 0.5 },
  "Sanitario":   { x: 0,   y: 1,   scale: 0.8 }, // ← 0.6 = 60% del tamaño original
};

const PERSON_FIELDS: FieldKey[] = ["interesado", "ingNombre", "rni"];
const CONTROL_FIELDS_EXTRA: FieldKey[] = ["tienePlanos", "numPlanos", "numCopias"];

const W = 215.9;
const W_A4 = 210;
const PDF_GRID_W = 38.25;
const GRID_TO_MM = W / PDF_GRID_W;
const g2mm = (v: number) => v * GRID_TO_MM;

const GLOBAL_Y_OFFSET = 0;

const Y_OFFSET = {
  header:       0,
  visado:      -5,
  titulos:      0,
  tituloProyY:  0,
  dataRows:     0,
  secInferior:  0,
  interesado:   0,
  conformidad:  0,
  selloFirma:   0,
  rni:          0,
  nombre:       0,
  sha256:       3,
};

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
  codigo:        { x: 33.0,   y: 9.8    },
};

const INTERESADO_FONT_SIZE    = 9;
const INTERESADO_LINE_SPACING = 1.5;

const ROW_STEP_GRID = 1.275;
const LINE_H_MM = g2mm(ROW_STEP_GRID);
const EXTRA_LINE_BELOW_TITULO_MM = LINE_H_MM;
const EXTRA_LINE_LEFT_COL_MM     = LINE_H_MM;

const IMG_LAYOUT = {
  narrowLeft: { gx: 3.55,  gy: 0.8,  maxWmm: g2mm(10.6), maxHmm: g2mm(7.85) },
  wideTop:    { gx: 13.8, gy: 1.74, maxWmm: g2mm(17.8),  maxHmm: g2mm(7.9)  },
};

const FIELD_LABELS: Partial<Record<FieldKey, string>> = {
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

// ── Helpers ────────────────────────────────────────────────────────────────
async function loadOptionalDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("read"));
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

function dataUrlImageFormat(dataUrl: string): "PNG" | "JPEG" {
  return dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg") ? "JPEG" : "PNG";
}

function addImageFitted(doc: jsPDF, dataUrl: string, x: number, y: number, maxW: number, maxH: number): Promise<void> {
  const fmt = dataUrlImageFormat(dataUrl);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const rw = img.naturalWidth || img.width;
      const rh = img.naturalHeight || img.height;
      if (!rw || !rh) { resolve(); return; }
      const scale = Math.min(maxW / rw, maxH / rh);
      try { doc.addImage(dataUrl, fmt, x, y, rw * scale, rh * scale); } catch { /* skip */ }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });
}

async function placeCaratulaImages(
  doc: jsPDF,
  centro: string | null,
  izq: string | null,
  topOffset: number,
  mainCat?: string
) {
  if (centro) {
    await addImageFitted(
      doc, centro,
      g2mm(IMG_LAYOUT.wideTop.gx),
      g2mm(IMG_LAYOUT.wideTop.gy) + topOffset,
      IMG_LAYOUT.wideTop.maxWmm,
      IMG_LAYOUT.wideTop.maxHmm
    );
  }
  if (izq) {
    const off: LogoOffset = LOGO_OFFSET[mainCat ?? ""] ?? { x: 0, y: 0 };
    const scale = off.scale ?? 1;
    await addImageFitted(
      doc, izq,
      g2mm(IMG_LAYOUT.narrowLeft.gx) + g2mm(off.x),
      g2mm(IMG_LAYOUT.narrowLeft.gy) + topOffset + g2mm(off.y),
      IMG_LAYOUT.narrowLeft.maxWmm * scale,
      IMG_LAYOUT.narrowLeft.maxHmm * scale
    );
  }
}

function drawGridLines(doc: jsPDF, dy: number) {
  doc.setDrawColor(31, 56, 99);
  doc.setLineWidth(0.75);
  doc.setLineDashPattern([2, 2], 0);

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

  hLines.forEach(({ x, y, l }) => doc.line(g2mm(x), g2mm(y) + dy, g2mm(x + l), g2mm(y) + dy));
  vLines.forEach(({ x, y, l }) => doc.line(g2mm(x), g2mm(y) + dy, g2mm(x), g2mm(y + l) + dy));
  doc.setLineDashPattern([], 0);
}

function fitTextToWidth(
  doc: jsPDF, text: string, maxWidth: number, startSize: number, minSize: number = 6
): { lines: string[], fontSize: number } {
  let size = startSize;
  while (size >= minSize) {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth);
    if (lines.length === 1) return { lines, fontSize: size };
    size -= 0.5;
  }
  doc.setFontSize(minSize);
  return { lines: doc.splitTextToSize(text, maxWidth), fontSize: minSize };
}

function drawInteresados(
  doc: jsPDF,
  formData: FormData,
  xBase: number,
  yLabel: number,
  maxW: number,
  catCode?: string
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  
  // Para INP1, mostrar "NOMBRE DEL JUZGADO:" en lugar de "NOMBRE DEL INTERESADO (S):"
  const isINP1 = catCode === "INP1";
  const labelText = isINP1 ? "NOMBRE DEL JUZGADO:" : "NOMBRE DEL INTERESADO (S):";
  doc.text(labelText, xBase, yLabel);

  // Para INP1, usar nombreJuzgado; para otros, usar interesados
  const nombres = isINP1
    ? [formData.nombreJuzgado || ""].filter(Boolean)
    : [formData.interesado || "", ...(formData.interesados || [])].filter(Boolean);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(INTERESADO_FONT_SIZE);

  const lineH = doc.getTextDimensions("A").h;
  let yNombre = yLabel + 4;
  nombres.forEach((nombre) => {
    const lines = doc.splitTextToSize(nombre, maxW);
    doc.text(lines, xBase, yNombre);
    yNombre += lineH * lines.length + INTERESADO_LINE_SPACING;
  });

  return yNombre;
}

function drawDataFields(
  doc: jsPDF,
  formData: FormData,
  dataFields: string[],
  dataX: number,
  maxW: number,
  separadorY: number,
  cuadroBottom: number
) {
  if (dataFields.length === 0) return;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const lineH = doc.getTextDimensions("A").h;

  // ── PASO 1: pre-calcular líneas reales de cada campo ──
  const camposConLineas = dataFields.map(k => {
    const val   = (formData[k as keyof FormData] as string) || "";
    const label = (FIELD_LABELS[k as FieldKey] ?? `${k.toUpperCase()}:`) + " ";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const lw = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    return doc.splitTextToSize(val, maxW - lw).length;
  });

  // ── PASO 2: calcular espacio disponible y gap óptimo ──
  const espacioDisponible = cuadroBottom - separadorY - 3;
  const totalAltura       = camposConLineas.reduce((sum, n) => sum + lineH * n, 0);
  const espacioParaGaps   = espacioDisponible - totalAltura;
  const numGaps           = dataFields.length; // gap después de cada campo (incluyendo último como padding)

  // Gap ideal: distribuir el espacio sobrante entre todos los campos
  // Mínimo 0.8mm para que no queden pegados, máximo 5mm para que no queden muy separados
  const GAP_MAX = 5;
  const GAP_MIN = 0.8;
  const gapFinal = Math.min(GAP_MAX, Math.max(GAP_MIN, espacioParaGaps / numGaps));

  // ── PASO 3: si aun así no cabe, reducir fontSize de todos ──
  // Calcular altura total con el gap mínimo
  const alturaConGapMin = totalAltura + GAP_MIN * numGaps;
  let fontSizeGlobal = 8.5;
  if (alturaConGapMin > espacioDisponible) {
    // Reducir font hasta que quepa
    let fs = 8.5;
    while (fs >= 6) {
      fs -= 0.25;
      doc.setFontSize(fs);
      const lh = doc.getTextDimensions("A").h;
      const totalH = dataFields.reduce((sum, k) => {
        const val   = (formData[k as keyof FormData] as string) || "";
        const label = (FIELD_LABELS[k as FieldKey] ?? `${k.toUpperCase()}:`) + " ";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fs);
        const lw = doc.getTextWidth(label);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fs);
        return sum + lh * doc.splitTextToSize(val, maxW - lw).length;
      }, 0);
      if (totalH + GAP_MIN * numGaps <= espacioDisponible) {
        fontSizeGlobal = fs;
        break;
      }
    }
    fontSizeGlobal = Math.max(fontSizeGlobal, 6);
  }

  // ── PASO 4: dibujar ──
  doc.setFontSize(fontSizeGlobal);
  const lineHFinal = doc.getTextDimensions("A").h;

  // Recalcular gap final con el fontSize definitivo
  const totalAlturaFinal   = dataFields.reduce((sum, k) => {
    const val   = (formData[k as keyof FormData] as string) || "";
    const label = (FIELD_LABELS[k as FieldKey] ?? `${k.toUpperCase()}:`) + " ";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSizeGlobal);
    const lw = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSizeGlobal);
    return sum + lineHFinal * doc.splitTextToSize(val, maxW - lw).length;
  }, 0);
  const espacioParaGapsFinal = (cuadroBottom - separadorY - 3) - totalAlturaFinal;
  const gapFinalAjustado     = Math.min(GAP_MAX, Math.max(GAP_MIN, espacioParaGapsFinal / numGaps));

  let cy = separadorY + 3;

  dataFields.forEach((k) => {
    const val    = (formData[k as keyof FormData] as string) || "";
    const label  = (FIELD_LABELS[k as FieldKey] ?? `${k.toUpperCase()}:`) + " ";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSizeGlobal);
    const lw     = doc.getTextWidth(label);
    const availW = maxW - lw;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSizeGlobal);
    const lines  = doc.splitTextToSize(val, availW);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSizeGlobal);
    doc.text(label, dataX, cy);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSizeGlobal);
    doc.text(lines.length > 0 ? lines : [""], dataX + lw, cy);

    cy += lineHFinal * lines.length + gapFinalAjustado;
  });
}

// ── FUNCIÓN PRINCIPAL ──────────────────────────────────────────────────────
export async function generarCaratulaPDF(
  formData: FormData,
  cat: Categoria,
  qrDataUrl: string,
  format: "letter" | "a4" = "letter",
  sha256?: string,
  mainCat?: string
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format });
  const pageWidth = format === "a4" ? W_A4 : W;

  const BASE          = GLOBAL_Y_OFFSET;
  const leftColDelta  = EXTRA_LINE_LEFT_COL_MM + Y_OFFSET.secInferior;
  const tituloProyYmm = g2mm(G.tituloProyLab.y) + EXTRA_LINE_BELOW_TITULO_MM + Y_OFFSET.tituloProyY + BASE;

  console.log("mainCat recibido:", mainCat);

  const [imgCentro, imgIzq] = await Promise.all([
    loadOptionalDataUrl(CARATULA_ASSETS.imagenCentro),
    loadOptionalDataUrl(CARATULA_ASSETS.logoEspecialidad(mainCat ?? "")),
  ]);

  drawGridLines(doc, BASE);
  await placeCaratulaImages(doc, imgCentro, imgIzq, EXTRA_LINE_LEFT_COL_MM + Y_OFFSET.header + BASE, mainCat);

  // ── VISADO / CAT. PRINCIPAL ──
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const centerLeftCol = g2mm(2.1 + 10.6 / 2);
  doc.text("VISADO", centerLeftCol, g2mm(G.visado.y) + leftColDelta + Y_OFFSET.visado + BASE, { align: "center" });

  const mainCatDisplay: Record<string, string[]> = {
    "Estructural":            ["ESTRUCTURAL"],
    "Sanitario":              ["SANITARIO"],
    "Geológico - Geotécnico": ["GEOLÓGICO - GEOTÉCNICO"],
    "Eléctrico":              ["ELÉCTRICO"],
    "Mecánico":               ["MECÁNICO"],
    "Ingeniería en General":  ["INGENIERÍA EN GENERAL"],
  };

  const mainCatLines = mainCatDisplay[mainCat ?? ""] ?? [(mainCat || "").toUpperCase()];
  mainCatLines.forEach((line, i) => {
    doc.text(line, centerLeftCol, g2mm(G.catPrincipal.y) + leftColDelta + Y_OFFSET.visado + BASE + (i * 5), { align: "center" });
  });

  // ── Código ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  const codeX = g2mm(G.codigo.x);
  const codeY = g2mm(G.codigo.y) + leftColDelta + Y_OFFSET.header + BASE;
  doc.text(cat.code, codeX, codeY, { align: "right" });
  const codeW = doc.getTextWidth(cat.code);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(codeX - codeW, codeY + 1, codeX, codeY + 1);

  // ── Título y subtítulo categoría ──
// Para INT1 e INP1: título incluye el área, subtítulo incluye el tema
const isInformeEspecial = cat.code === "INT1" || cat.code === "INP1";
const tituloPrincipal = isInformeEspecial && formData.areaIngenieria
  ? `${cat.titulo_caratula} ${formData.areaIngenieria.toUpperCase()}`
  : cat.titulo_caratula;
const subtituloPrincipal = isInformeEspecial && formData.temaIngenieria
  ? `– ${formData.temaIngenieria}`
  : cat.subtitulo_caratula;

doc.setFont("helvetica", "bold");
doc.setFontSize(16);

// Si el título es largo, reducir fuente para que quepa en una línea
const tituloLinesFit = doc.splitTextToSize(tituloPrincipal, pageWidth - g2mm(4));
const tituloFontSize = tituloLinesFit.length > 1 ? 13 : 16;
doc.setFontSize(tituloFontSize);
doc.text(tituloPrincipal, pageWidth / 2, g2mm(G.tituloCatY) + Y_OFFSET.titulos + BASE, { align: "center" });

doc.setFontSize(14);
doc.text(subtituloPrincipal, pageWidth / 2, g2mm(G.subtituloY) + Y_OFFSET.titulos + BASE, { align: "center" });

  // ── TÍTULO DEL PROYECTO ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const tituloLab = "TÍTULO DEL PROYECTO: ";
  const labW      = doc.getTextWidth(tituloLab);
  doc.text(tituloLab, g2mm(G.tituloProyLab.x) + 2, tituloProyYmm);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const dataColRight = g2mm(35.586) - 3;
  const dataX        = g2mm(G.tituloProyLab.x) + 2;
  const tituloVal    = (formData.titulo || "").toUpperCase();
  const tituloLines  = doc.splitTextToSize(tituloVal, dataColRight - dataX - labW);
  doc.text(tituloLines, dataX + labW, tituloProyYmm);

  // ── Separador ──
  const nLineas        = Math.max(1, tituloLines.length);
  const alturaPorLinea = doc.getTextDimensions("A").h;
  const separadorY     = tituloProyYmm + (alturaPorLinea * nLineas) + 1;
  doc.setDrawColor(31, 56, 99);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([], 0);
  doc.line(g2mm(14.891), separadorY, g2mm(35.586), separadorY);
  doc.setLineDashPattern([2, 2], 0);

  // ── FILAS DE DATOS ──
  const allControlFields = new Set([...controlFields, ...CONTROL_FIELDS_EXTRA, ...PERSON_FIELDS, "titulo", "nombreJuzgado"]);
  const dataFields   = cat.active.filter(k => !allControlFields.has(k as FieldKey));
  const maxW         = dataColRight - dataX;
  const cuadroBottom = g2mm(27.642) + BASE;

  drawDataFields(doc, formData, dataFields, dataX, maxW, separadorY, cuadroBottom);

  // ── SECCIÓN INFERIOR ──
  const infBase        = leftColDelta + Y_OFFSET.secInferior + BASE;
  const interesadoX    = g2mm(G.interesadoLab.x) + 2;
  const interesadoMaxW = g2mm(14.891) - g2mm(3.6);

  drawInteresados(doc, formData, interesadoX, g2mm(G.interesadoLab.y) + infBase + Y_OFFSET.interesado, interesadoMaxW, cat.code);

  // SELLO DE CONFORMIDAD + QR
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("SELLO DE CONFORMIDAD:", g2mm(G.conformidad.x) + 34, g2mm(G.conformidad.y) + infBase + Y_OFFSET.conformidad - 3);
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", g2mm(G.conformidad.x) + 0, g2mm(G.conformidad.y) + infBase + Y_OFFSET.conformidad + -5.5, 33, 33);
  }

  // SELLO Y FIRMA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("SELLO Y FIRMA ING. PROYECTISTA:", g2mm(G.selloFirma.x) + 2, g2mm(G.selloFirma.y) + infBase + Y_OFFSET.selloFirma);

  // R.N.I.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(INTERESADO_FONT_SIZE);
  const rniLabelW = doc.getTextWidth("R.N.I.: ");
  doc.text("R.N.I.:", g2mm(G.rniLab.x) + 2, g2mm(G.rniLab.y) + infBase + Y_OFFSET.rni);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(INTERESADO_FONT_SIZE);
  doc.text(formData.rni || "", g2mm(G.rniLab.x) + 2 + rniLabelW, g2mm(G.rniLab.y) + infBase + Y_OFFSET.rni);

  // NOMBRE ING.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(INTERESADO_FONT_SIZE);
  const nomLabelW = doc.getTextWidth("NOMBRE: ");
  doc.text("NOMBRE:", g2mm(G.nombreLab.x) + 2, g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(INTERESADO_FONT_SIZE);
  const nomMaxW  = g2mm(14.891) - (g2mm(G.nombreLab.x) + 2) - nomLabelW - 1;
  const nomLines = doc.splitTextToSize(formData.ingNombre || "", nomMaxW);
  doc.text(nomLines, g2mm(G.nombreLab.x) + 2 + nomLabelW, g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre);

  // SHA-256
  if (sha256) {
    const sha256Y   = g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre + Y_OFFSET.sha256 + LINE_H_MM + 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const shaLabel  = "ID SHA-256: ";
    doc.text(shaLabel, g2mm(G.rniLab.x), sha256Y);
    const shaLabelW = doc.getTextWidth(shaLabel);
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.text(sha256, g2mm(G.rniLab.x) + shaLabelW, sha256Y);
  }

  const filename = `${cat.code}_${(formData.titulo || "caratula").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

// ── VERSIÓN BLOB ───────────────────────────────────────────────────────────
export async function generarCaratulaPDFBlob(
  formData: FormData,
  cat: Categoria,
  qrDataUrl: string,
  format: "letter" | "a4" = "letter",
  sha256?: string,
  mainCat?: string
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format });
  const pageWidth = format === "a4" ? W_A4 : W;

  const BASE          = GLOBAL_Y_OFFSET;
  const leftColDelta  = EXTRA_LINE_LEFT_COL_MM + Y_OFFSET.secInferior;
  const tituloProyYmm = g2mm(G.tituloProyLab.y) + EXTRA_LINE_BELOW_TITULO_MM + Y_OFFSET.tituloProyY + BASE;

  const [imgCentro, imgIzq] = await Promise.all([
    loadOptionalDataUrl(CARATULA_ASSETS.imagenCentro),
    loadOptionalDataUrl(CARATULA_ASSETS.logoEspecialidad(mainCat ?? "")),
  ]);

  drawGridLines(doc, BASE);
  await placeCaratulaImages(doc, imgCentro, imgIzq, EXTRA_LINE_LEFT_COL_MM + Y_OFFSET.header + BASE, mainCat);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const centerLeftCol = g2mm(2.1 + 10.6 / 2);
  doc.text("VISADO", centerLeftCol, g2mm(G.visado.y) + leftColDelta + Y_OFFSET.visado + BASE, { align: "center" });

  const mainCatDisplay: Record<string, string[]> = {
    "Estructural":            ["ESTRUCTURAL"],
    "Sanitario":              ["SANITARIO"],
    "Geológico - Geotécnico": ["GEOLÓGICO - GEOTÉCNICO"],
    "Eléctrico":              ["ELÉCTRICO"],
    "Mecánico":               ["MECÁNICO"],
    "Ingeniería en General":  ["INGENIERÍA EN GENERAL"],
  };
  const mainCatLines = mainCatDisplay[mainCat ?? ""] ?? [(mainCat || "").toUpperCase()];
  mainCatLines.forEach((line, i) => {
    doc.text(line, centerLeftCol, g2mm(G.catPrincipal.y) + leftColDelta + Y_OFFSET.visado + BASE + (i * 5), { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  const codeX = g2mm(G.codigo.x);
  const codeY = g2mm(G.codigo.y) + leftColDelta + Y_OFFSET.header + BASE;
  doc.text(cat.code, codeX, codeY, { align: "right" });
  const codeW = doc.getTextWidth(cat.code);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(codeX - codeW, codeY + 1, codeX, codeY + 1);

  // ── Título y subtítulo categoría ──
// Para INT1 e INP1: título incluye el área, subtítulo incluye el tema
const isInformeEspecial = cat.code === "INT1" || cat.code === "INP1";
const tituloPrincipal = isInformeEspecial && formData.areaIngenieria
  ? `${cat.titulo_caratula} ${formData.areaIngenieria.toUpperCase()}`
  : cat.titulo_caratula;
const subtituloPrincipal = isInformeEspecial && formData.temaIngenieria
  ? `– ${formData.temaIngenieria}`
  : cat.subtitulo_caratula;

doc.setFont("helvetica", "bold");
doc.setFontSize(16);

// Si el título es largo, reducir fuente para que quepa en una línea
const tituloLinesFit = doc.splitTextToSize(tituloPrincipal, pageWidth - g2mm(4));
const tituloFontSize = tituloLinesFit.length > 1 ? 13 : 16;
doc.setFontSize(tituloFontSize);
doc.text(tituloPrincipal, pageWidth / 2, g2mm(G.tituloCatY) + Y_OFFSET.titulos + BASE, { align: "center" });

doc.setFontSize(14);
doc.text(subtituloPrincipal, pageWidth / 2, g2mm(G.subtituloY) + Y_OFFSET.titulos + BASE, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const tituloLab = "TÍTULO DEL PROYECTO: ";
  const labW      = doc.getTextWidth(tituloLab);
  doc.text(tituloLab, g2mm(G.tituloProyLab.x) + 2, tituloProyYmm);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const dataColRight = g2mm(35.586) - 3;
  const dataX        = g2mm(G.tituloProyLab.x) + 2;
  const tituloVal    = (formData.titulo || "").toUpperCase();
  const tituloLines  = doc.splitTextToSize(tituloVal, dataColRight - dataX - labW);
  doc.text(tituloLines, dataX + labW, tituloProyYmm);

  const nLineas        = Math.max(1, tituloLines.length);
  const alturaPorLinea = doc.getTextDimensions("A").h;
  const separadorY     = tituloProyYmm + (alturaPorLinea * nLineas) + 1;
  doc.setDrawColor(31, 56, 99);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([], 0);
  doc.line(g2mm(14.891), separadorY, g2mm(35.586), separadorY);
  doc.setLineDashPattern([2, 2], 0);

  const PERSON_FIELDS_LOCAL: FieldKey[]  = ["interesado", "ingNombre", "rni"];
  const CONTROL_FIELDS_LOCAL: FieldKey[] = ["tienePlanos", "numPlanos", "numCopias"];
  const allControlFields = new Set([...controlFields, ...CONTROL_FIELDS_LOCAL, ...PERSON_FIELDS_LOCAL, "titulo", "nombreJuzgado"]);
  const dataFields   = cat.active.filter(k => !allControlFields.has(k as FieldKey));
  const maxW         = dataColRight - dataX;
  const cuadroBottom = g2mm(27.642) + BASE;

  drawDataFields(doc, formData, dataFields, dataX, maxW, separadorY, cuadroBottom);

  const infBase        = leftColDelta + Y_OFFSET.secInferior + BASE;
  const interesadoX    = g2mm(G.interesadoLab.x) + 2;
  const interesadoMaxW = g2mm(14.891) - g2mm(3.6);

  drawInteresados(doc, formData, interesadoX, g2mm(G.interesadoLab.y) + infBase + Y_OFFSET.interesado, interesadoMaxW, cat.code);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("SELLO DE CONFORMIDAD:", g2mm(G.conformidad.x) + 2, g2mm(G.conformidad.y) + infBase + Y_OFFSET.conformidad);
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", g2mm(G.conformidad.x) + 2, g2mm(G.conformidad.y) + infBase + Y_OFFSET.conformidad + 3, 25, 25);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("SELLO Y FIRMA ING. PROYECTISTA:", g2mm(G.selloFirma.x) + 2, g2mm(G.selloFirma.y) + infBase + Y_OFFSET.selloFirma);

  // R.N.I.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(INTERESADO_FONT_SIZE);
  const rniLabelW = doc.getTextWidth("R.N.I.: ");
  doc.text("R.N.I.:", g2mm(G.rniLab.x) + 2, g2mm(G.rniLab.y) + infBase + Y_OFFSET.rni);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(INTERESADO_FONT_SIZE);
  doc.text(formData.rni || "", g2mm(G.rniLab.x) + 2 + rniLabelW, g2mm(G.rniLab.y) + infBase + Y_OFFSET.rni);

  // NOMBRE ING.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(INTERESADO_FONT_SIZE);
  const nomLabelW = doc.getTextWidth("NOMBRE: ");
  doc.text("NOMBRE:", g2mm(G.nombreLab.x) + 2, g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(INTERESADO_FONT_SIZE);
  const nomMaxW  = g2mm(14.891) - (g2mm(G.nombreLab.x) + 2) - nomLabelW - 1;
  const nomLines = doc.splitTextToSize(formData.ingNombre || "", nomMaxW);
  doc.text(nomLines, g2mm(G.nombreLab.x) + 2 + nomLabelW, g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre);

  // SHA-256
  if (sha256) {
    const sha256Y   = g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre + Y_OFFSET.sha256 + LINE_H_MM + 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const shaLabel  = "ID SHA-256: ";
    doc.text(shaLabel, g2mm(G.rniLab.x), sha256Y);
    const shaLabelW = doc.getTextWidth(shaLabel);
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    doc.text(sha256, g2mm(G.rniLab.x) + shaLabelW, sha256Y);
  }

  return doc.output("blob");
}