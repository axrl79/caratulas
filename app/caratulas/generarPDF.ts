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

// Campos de persona
const PERSON_FIELDS: FieldKey[] = ["interesado", "ingNombre", "rni"];

// Dimensiones PDF carta
const W = 215.9;
const W_A4 = 210;

// Rejilla
const PDF_GRID_W = 38.25;
const GRID_TO_MM = W / PDF_GRID_W;
const g2mm = (v: number) => v * GRID_TO_MM;

// ── OFFSET GLOBAL ──────────────────────────────────────────────────────────
// Ajusta este valor para subir/bajar TODO el contenido del PDF (en mm).
// Positivo = baja, Negativo = sube.
const GLOBAL_Y_OFFSET = 0;

// ── OFFSETS INDIVIDUALES POR SECCIÓN ──────────────────────────────────────
// Úsalos para ajustar secciones específicas sin mover el resto.
const Y_OFFSET = {
  header:       0,    // Imágenes y código (PES1, etc.)
  visado:      -5,    // "VISADO / CAT. PRINCIPAL"
  titulos:      0,    // Título categoría y subtítulo
  tituloProyY:  0,    // Línea "TÍTULO DEL PROYECTO:"
  dataRows:     0,    // Filas de datos del proyecto
  secInferior:  0,    // Toda la sección inferior (interesado, QR, sello)
  interesado:   0,    // Solo el valor del interesado
  conformidad:  0,    // Sello de conformidad + QR
  selloFirma:   0,    // "SELLO Y FIRMA ING. PROYECTISTA"
  rni:          0,    // R.N.I.
  nombre:       0,    // NOMBRE ing.
  sha256:       0,    // Línea SHA256 (debajo de NOMBRE)
};

// Coordenadas base en grid units
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

const ROW_STEP_GRID = 1.275;
const LINE_H_MM = g2mm(ROW_STEP_GRID);
const EXTRA_LINE_BELOW_TITULO_MM = LINE_H_MM;
const EXTRA_LINE_LEFT_COL_MM     = LINE_H_MM;

// Imágenes
const IMG_LAYOUT = {
  narrowLeft: { gx: 3.55,  gy: 0.8, maxWmm: g2mm(10.6), maxHmm: g2mm(7.85) },
  wideTop:    { gx: 15.05, gy: 1.74, maxWmm: g2mm(17.8),  maxHmm: g2mm(7.9)  },
};
const FIELD_LABELS: Partial<Record<FieldKey, string>> = {
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

async function placeCaratulaImages(doc: jsPDF, centro: string | null, izq: string | null, topOffset: number) {
  if (centro) await addImageFitted(doc, centro, g2mm(IMG_LAYOUT.wideTop.gx),    g2mm(IMG_LAYOUT.wideTop.gy)    + topOffset, IMG_LAYOUT.wideTop.maxWmm,    IMG_LAYOUT.wideTop.maxHmm);
  if (izq)    await addImageFitted(doc, izq,    g2mm(IMG_LAYOUT.narrowLeft.gx), g2mm(IMG_LAYOUT.narrowLeft.gy) + topOffset, IMG_LAYOUT.narrowLeft.maxWmm, IMG_LAYOUT.narrowLeft.maxHmm);
}

// ── Líneas guía ────────────────────────────────────────────────────────────
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

function fitTextToWidth(doc: jsPDF, text: string, maxWidth: number, startSize: number, minSize: number = 6): { lines: string[], fontSize: number } {
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

  // Y base para toda la hoja
  const BASE = GLOBAL_Y_OFFSET;

  // Offsets calculados
  const leftColDelta  = EXTRA_LINE_LEFT_COL_MM  + Y_OFFSET.secInferior;
  const tituloProyYmm = g2mm(G.tituloProyLab.y) + EXTRA_LINE_BELOW_TITULO_MM + Y_OFFSET.tituloProyY + BASE;

  // Cargar imágenes
  console.log("mainCat recibido:", mainCat);
  const [imgCentro, imgIzq] = await Promise.all([
  loadOptionalDataUrl(CARATULA_ASSETS.imagenCentro),
  loadOptionalDataUrl(CARATULA_ASSETS.logoEspecialidad(mainCat ?? "")),
]);

  // ── Líneas guía ──
  drawGridLines(doc, BASE);

  // ── Imágenes header ──
  await placeCaratulaImages(doc, imgCentro, imgIzq, EXTRA_LINE_LEFT_COL_MM + Y_OFFSET.header + BASE);

  // ── VISADO / CAT. PRINCIPAL ──
 doc.setTextColor(0, 0, 0);
 doc.setFont("helvetica", "bold");
doc.setFontSize(14);
const centerLeftCol = g2mm(2.5 + 10.6 / 2); // centro de la columna izquierda
doc.text("VISADO", centerLeftCol, g2mm(G.visado.y) + leftColDelta + Y_OFFSET.visado + BASE, { align: "center" });

const mainCatDisplay: Record<string, string[]> = {
  "Estructural":            ["ESTRUCTURAL"],
  "Sanitario":              ["SANITARIO"],
  "Geológico - Geotécnico": ["GEOLÓGICO - GEOTÉCNICO"],
  "Eléctrico":              ["ELÉCTRICO"],
  "Mecánico":               ["MECÁNICO"],
  "Ingeniería en General":  ["INGENIERÍA EN", "GENERAL"],
};

const mainCatLines = mainCatDisplay[mainCat ?? ""] ?? [(mainCat || "").toUpperCase()];
mainCatLines.forEach((line, i) => {
  doc.text(line, centerLeftCol, g2mm(G.catPrincipal.y) + leftColDelta + Y_OFFSET.visado + BASE + (i * 5), { align: "center" });
});
  // ── Código categoría (PES1, etc.) ──
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
  doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text(cat.titulo_caratula, pageWidth / 2, g2mm(G.tituloCatY) + Y_OFFSET.titulos + BASE, { align: "center" });
doc.setFontSize(14);
doc.text(cat.subtitulo_caratula, pageWidth / 2, g2mm(G.subtituloY) + Y_OFFSET.titulos + BASE, { align: "center" });

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
  

  // ── LÍNEA SEPARADORA DEBAJO DEL TÍTULO ──
    const nLineas = Math.max(1, tituloLines.length);
  const alturaPorLinea = doc.getTextDimensions("A").h;
  const separadorY = tituloProyYmm + (alturaPorLinea * nLineas) + 1;
  doc.setDrawColor(31, 56, 99);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([], 0);
  doc.line(g2mm(14.891), separadorY, g2mm(35.586), separadorY);
  doc.setLineDashPattern([2, 2], 0);

  // ── FILAS DE DATOS ──
  const dataFields = cat.active.filter(
    k => !PERSON_FIELDS.includes(k) && k !== "titulo" && !controlFields.includes(k)
  );

  doc.setFontSize(8.5);
  const maxW = dataColRight - dataX;

  // Espaciado dinámico según campos disponibles
  const cuadroBottom = g2mm(27.642) + BASE;
  const espacioDisponible = cuadroBottom - separadorY - 3;
  const espacioPorCampo = Math.min(LINE_H_MM, espacioDisponible / Math.max(1, dataFields.length));

  let cy = separadorY + 3;

  dataFields.forEach(k => {
    const val   = formData[k] || "";
    const label = (FIELD_LABELS[k] ? FIELD_LABELS[k] : `${k.toUpperCase()}:`) + " ";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const lw = doc.getTextWidth(label);
    doc.text(label, dataX, cy);
    doc.setFont("helvetica", "normal");
    const availW = maxW - lw;
    const { lines, fontSize } = fitTextToWidth(doc, val, availW, 8.5);
    doc.setFontSize(fontSize);
    doc.text(lines.length > 0 ? lines : [""], dataX + lw, cy);
    doc.setFontSize(8.5);
    cy += espacioPorCampo * Math.max(1, lines.length);
  });

  // ── SECCIÓN INFERIOR ──
  const infBase = leftColDelta + Y_OFFSET.secInferior + BASE;

  // Etiqueta NOMBRE DEL INTERESADO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("NOMBRE DEL INTERESADO (S):", g2mm(G.interesadoLab.x) + 2, g2mm(G.interesadoLab.y) + infBase + Y_OFFSET.interesado);

  // Valor interesado (2 mm debajo de la etiqueta)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const interesadoW     = g2mm(14.891) - g2mm(3.6);
  const interesadosText = [formData.interesado || "", ...(formData.interesados || [])].filter(Boolean).join("\n");
  const interesadoLines = doc.splitTextToSize(interesadosText, interesadoW);
  doc.text(interesadoLines, g2mm(G.interesadoLab.x) + 2, g2mm(G.interesadoLab.y) + infBase + Y_OFFSET.interesado + 4);

  // Etiqueta SELLO DE CONFORMIDAD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("SELLO DE CONFORMIDAD:", g2mm(G.conformidad.x) + 2, g2mm(G.conformidad.y) + infBase + Y_OFFSET.conformidad);

  // QR en columna de conformidad (3.5 cm x 3.5 cm para escaneo fácil desde móviles)
  if (qrDataUrl) {
    const qrX = g2mm(G.conformidad.x) + 2;
    const qrY = g2mm(G.conformidad.y) + infBase + Y_OFFSET.conformidad + 3;
    const qrS = 25; // Reducido a 2.5cm por solicitud del usuario
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrS, qrS);
  }

  // SELLO Y FIRMA ING. PROYECTISTA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("SELLO Y FIRMA ING. PROYECTISTA:", g2mm(G.selloFirma.x) + 2, g2mm(G.selloFirma.y) + infBase + Y_OFFSET.selloFirma);

  // R.N.I.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const rniLabelW = doc.getTextWidth("R.N.I.: ");
  doc.text("R.N.I.:", g2mm(G.rniLab.x) + 2, g2mm(G.rniLab.y) + infBase + Y_OFFSET.rni);
  doc.setFont("helvetica", "normal");
  doc.text(formData.rni || "", g2mm(G.rniLab.x) + 2 + rniLabelW, g2mm(G.rniLab.y) + infBase + Y_OFFSET.rni);

  // NOMBRE ING.
  doc.setFont("helvetica", "bold");
  const nomLabelW = doc.getTextWidth("NOMBRE: ");
  doc.text("NOMBRE:", g2mm(G.nombreLab.x) + 2, g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre);
  doc.setFont("helvetica", "normal");
  doc.text(formData.ingNombre || "", g2mm(G.nombreLab.x) + 2 + nomLabelW, g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre);

  // ── SHA256 debajo de NOMBRE ──
  if (sha256) {
    const sha256Y = g2mm(G.nombreLab.y) + infBase + Y_OFFSET.nombre + Y_OFFSET.sha256 + LINE_H_MM + 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(60, 60, 60);
    doc.text("ID SHA-256:", g2mm(G.rniLab.x), sha256Y);
    doc.setFont("courier", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(30, 30, 30);
    // Partir el hash en 2 líneas de 32 chars para que entre en el ancho
    const half = Math.ceil(sha256.length / 2);
    doc.text(sha256.substring(0, half),  g2mm(G.rniLab.x), sha256Y + 3);
    doc.text(sha256.substring(half),     g2mm(G.rniLab.x), sha256Y + 6);
    doc.setTextColor(0, 0, 0);
  }

  // ── UNA SOLA HOJA: no se agrega segunda página ──
  const filename = `${cat.code}_${(formData.titulo || "caratula").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}