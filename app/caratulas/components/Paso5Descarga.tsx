import React from "react";

interface Paso5DescargaProps {
  C: any;
  themeMode: string;
  documentSHA256: string;
  downloadPDF: (format?: "letter" | "a4") => Promise<void>;
  resetForm: () => void;
}

export default function Paso5Descarga({
  C, themeMode, documentSHA256, downloadPDF, resetForm
}: Paso5DescargaProps) {
  const isLight = themeMode === "light";

  const card: React.CSSProperties = {
    background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20,
    padding: "clamp(20px, 5vw, 40px)", boxShadow: C.glow, backdropFilter: "blur(12px)",
    textAlign: "center", animation: "fadeIn 0.5s ease"
  };
  const btnPrimary: React.CSSProperties = {
    background: C.accent, color: isLight ? "#fff" : C.deepGreen,
    border: "none", borderRadius: 10, padding: "16px 32px",
    fontWeight: 800, fontSize: "1.1em", cursor: "pointer",
    boxShadow: `0 4px 14px ${C.accent}60`, transition: "all 0.2s",
    width: "100%", marginTop: 24, textTransform: "uppercase", letterSpacing: 1
  };
  const btnSecondary: React.CSSProperties = {
    background: C.btnSecBg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "16px 32px", color: C.textMain, fontSize: "1.1em",
    cursor: "pointer", fontWeight: 700, transition: "all 0.2s",
    width: "100%", marginTop: 12
  };

  return (
    <div style={card}>
      <div style={{ fontSize: "4em", marginBottom: 10 }}>🎉</div>
      <h2 style={{ fontSize: "1.8em", fontWeight: 900, marginBottom: 10, color: C.textMain }}>
        ¡Trámite Registrado con Éxito!
      </h2>
      <p style={{ color: C.textMuted, fontSize: "1.05em", marginBottom: 30, lineHeight: 1.5, maxWidth: 500, margin: "0 auto 30px auto" }}>
        Todos tus archivos y datos han sido procesados y almacenados de manera segura en el servidor del Departamento de Visados.
      </p>

      <div style={{
        background: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
        border: isLight ? "1px solid #bbf7d0" : "1px solid rgba(16, 185, 129, 0.25)",
        borderRadius: 16, padding: "20px", marginBottom: 30, display: "inline-block", textAlign: "left"
      }}>
        <div style={{ fontSize: "0.8em", textTransform: "uppercase", letterSpacing: 1, color: isLight ? "#15803d" : "#10b981", fontWeight: 800, marginBottom: 8 }}>
          Código de Referencia Único (Hash)
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "1.2em", fontWeight: 700, color: C.textMain, wordBreak: "break-all" }}>
          {documentSHA256}
        </div>
      </div>

      <button style={btnPrimary} onClick={() => downloadPDF("letter")}>
        📄 Descargar Carátula PDF
      </button>

      <button style={btnSecondary} onClick={resetForm}>
        ✨ Iniciar Nuevo Trámite
      </button>
    </div>
  );
}
