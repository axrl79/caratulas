import React from "react";
import { Categoria, FormData, CATEGORY_LOGOS, ESTRUCTURA_CATEGORIAS } from "../data/diccionarios";
import { DOCUMENTOS_COMPLEMENTARIOS, DocumentoComplementario } from "../data/documentosComplementarios";

interface Paso5DescargaProps {
  C: any;
  themeMode: string;
  documentSHA256: string;
  cat: Categoria;
  formData: FormData;
  downloadPDF: (format?: "letter" | "a4") => Promise<void>;
  resetForm: () => void;
}

export default function Paso5Descarga({
  C, themeMode, documentSHA256, cat, formData, downloadPDF, resetForm
}: Paso5DescargaProps) {
  const isLight = themeMode === "light";

  // ── Documentos disponibles para esta categoría ──
  const docsDisponibles = DOCUMENTOS_COMPLEMENTARIOS.filter(
    d => d.archivo !== null && d.categorias.includes(cat.code)
  );
  const archivos = docsDisponibles.filter(d => d.tipo === "archivo");
  const guias = docsDisponibles.filter(d => d.tipo === "guia");

  // ── Descargar un archivo individual ──
  const descargarArchivo = (doc: DocumentoComplementario) => {
    if (!doc.archivo) return;
    const extension = doc.archivo.split(".").pop() || "pdf";
    const a = document.createElement("a");
    a.href = `/${doc.archivo}`;
    a.download = doc.nombre + "." + extension;
    a.click();
  };

  // ── Descargar todos los complementos ──
  const descargarTodos = () => {
    docsDisponibles.forEach((doc, i) => {
      setTimeout(() => descargarArchivo(doc), i * 400);
    });
  };

  // ── Logo de categoría ──
  const mainCatKey = Object.keys(ESTRUCTURA_CATEGORIAS).find(k =>
    ESTRUCTURA_CATEGORIAS[k].includes(cat.disciplina as any)
  ) ?? null;
  const logoData = mainCatKey ? CATEGORY_LOGOS[mainCatKey] : null;

  // ── Estilos ──
  const card: React.CSSProperties = {
    background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20,
    padding: "clamp(20px, 5vw, 40px)", boxShadow: C.glow, backdropFilter: "blur(12px)",
  };
  const btnPrimary: React.CSSProperties = {
    background: C.accent, color: isLight ? "#fff" : C.deepGreen,
    border: "none", borderRadius: 10, padding: "14px 32px",
    fontWeight: 700, fontSize: "1em", cursor: "pointer",
    boxShadow: `0 4px 14px ${C.accent}60`, transition: "all 0.2s",
  };
  const btnSecondary: React.CSSProperties = {
    background: C.btnSecBg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "14px 32px", color: C.textMain, fontSize: "1em",
    cursor: "pointer", fontWeight: 600, transition: "all 0.2s",
  };
  const docBtn: React.CSSProperties = {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, background: C.inputBg, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "14px 18px", cursor: "pointer",
    transition: "all 0.2s", textAlign: "left",
  };
  const secLabel: React.CSSProperties = {
    fontSize: "0.8em", textTransform: "uppercase", letterSpacing: 2,
    color: C.accent, fontWeight: 800, marginBottom: 14,
    display: "flex", alignItems: "center", gap: 10,
  };

  return (
    <div style={card}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, justifyContent: "center" }}>
        {logoData && (
          <img
            src={isLight ? logoData.light : logoData.dark}
            alt={mainCatKey ?? ""}
            style={{ height: 40, width: "auto", objectFit: "contain", opacity: 0.9 }}
          />
        )}
        <div style={{ fontSize: "clamp(1.4em, 5vw, 2em)", color: C.textMain, fontWeight: 900 }}>
          ¡Documento <span style={{ color: C.accent }}>Listo</span>!
        </div>
      </div>

      <div style={{ fontSize: "1em", color: C.textMuted, marginBottom: 24 }}>
        El PDF oficial ha sido procesado y codificado correctamente.
      </div>

      {/* ── Nombre del archivo ── */}
      <div style={{
        background: C.boxBg, display: "inline-flex", alignItems: "center", gap: 10,
        padding: "12px 24px", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 36,
      }}>
        <span style={{ fontSize: "1.3em" }}>📄</span>
        <span style={{ fontSize: "0.95em", color: C.textSec, fontWeight: 700 }}>
          {cat.code}_{(formData.titulo || "caratula").replace(/\s+/g, "_")}.pdf
        </span>
      </div>

      {/* ── Hash de seguridad ── */}
      <div style={{
        background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
        border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.25)",
        borderRadius: 12, padding: "16px", marginBottom: 36, display: "inline-block", textAlign: "left"
      }}>
        <div style={{ fontSize: "0.75em", textTransform: "uppercase", letterSpacing: 1, color: isLight ? "#15803d" : "#10b981", fontWeight: 800, marginBottom: 6 }}>
          Código Hash (SHA256)
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "0.85em", fontWeight: 600, color: C.textMain, wordBreak: "break-all" }}>
          {documentSHA256}
        </div>
      </div>

      {/* ── Botón carátula ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={secLabel}>📋 Carátula Oficial</div>
        <button
          onClick={() => downloadPDF("letter")}
          style={{ ...btnPrimary, width: "100%", padding: "16px 32px", fontSize: "1.05em" }}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          ⬇️ Descargar Carátula (Carta)
        </button>
      </div>

      {/* ── Archivos complementarios ── */}
      {archivos.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={secLabel}>📁 Archivos Complementarios</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {archivos.map(doc => (
              <button
                key={doc.id}
                onClick={() => descargarArchivo(doc)}
                style={docBtn}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.background = C.accentLight;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.inputBg;
                }}
              >
                <span style={{ color: C.textMain, fontWeight: 600, fontSize: "0.9em" }}>
                  📄 {doc.nombre}
                </span>
                <span style={{
                  color: C.accent, fontWeight: 800, fontSize: "0.8em",
                  flexShrink: 0, background: C.accentLight,
                  padding: "4px 12px", borderRadius: 6,
                }}>
                  ⬇ Descargar
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Guías ── */}
      {guias.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={secLabel}>📖 Guías de Llenado</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {guias.map(doc => (
              <button
                key={doc.id}
                onClick={() => descargarArchivo(doc)}
                style={{ ...docBtn, borderColor: `${C.accent}40` }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.background = C.accentLight;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = `${C.accent}40`;
                  e.currentTarget.style.background = C.inputBg;
                }}
              >
                <span style={{ color: C.textMain, fontWeight: 600, fontSize: "0.9em" }}>
                  📖 {doc.nombre}
                </span>
                <span style={{
                  color: C.accent, fontWeight: 800, fontSize: "0.8em",
                  flexShrink: 0, background: C.accentLight,
                  padding: "4px 12px", borderRadius: 6,
                }}>
                  ⬇ Descargar
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Descargar todo ── */}
      {docsDisponibles.length > 1 && (
        <div style={{ marginBottom: 40 }}>
          <button
            onClick={descargarTodos}
            style={{ ...btnPrimary, width: "100%", background: C.boxBg, color: C.accent, border: `1px solid ${C.accent}` }}
            onMouseOver={e => e.currentTarget.style.background = C.accentLight}
            onMouseOut={e => e.currentTarget.style.background = C.boxBg}
          >
            📦 Descargar Todos los Complementos
          </button>
        </div>
      )}

      {/* ── Aviso si no hay complementos ── */}
      {docsDisponibles.length === 0 && (
        <div style={{
          background: C.boxBg, border: `1px dashed ${C.border}`,
          borderRadius: 12, padding: "24px", textAlign: "center",
          color: C.textMuted, fontSize: "0.9em", marginBottom: 40,
        }}>
          No hay documentos complementarios disponibles para esta categoría aún.
        </div>
      )}

      {/* ── Nueva carátula ── */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={resetForm}
          style={btnSecondary}
          onMouseOver={e => e.currentTarget.style.background = C.btnSecHover}
          onMouseOut={e => e.currentTarget.style.background = C.btnSecBg}
        >
          + Crear nueva carátula
        </button>
      </div>
    </div>
  );
}
