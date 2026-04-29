import { Categoria, FormData, CATEGORY_LOGOS, ESTRUCTURA_CATEGORIAS } from "../data/diccionarios";

interface Paso4DescargaProps {
  C: any;
  themeMode: "light" | "dark" | "engineering";
  cat: Categoria;
  formData: FormData;
  downloadPDF: (format: "letter" | "a4") => void;
  resetForm: () => void;
} 

export default function Paso4Descarga({
  C, themeMode, cat, formData, downloadPDF, resetForm
}: Paso4DescargaProps) {

  // Estilos locales
  const card: React.CSSProperties = { background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 40, boxShadow: C.glow, backdropFilter: "blur(12px)", transition: "all 0.3s ease", textAlign: "center" };
  const btnPrimary: React.CSSProperties = { background: C.accent, color: themeMode === "light" ? "#fff" : C.deepGreen, border: "none", borderRadius: 10, padding: "20px 64px", fontWeight: 700, fontSize: "1.1em", cursor: "pointer", transition: "all 0.2s", boxShadow: `0 8px 25px ${C.border}` };
  const btnSecondary: React.CSSProperties = { background: C.btnSecBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 32px", color: C.textMain, fontSize: "1em", cursor: "pointer", transition: "all 0.2s", fontWeight: 600 };
  const btnFormatContainer: React.CSSProperties = { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 };
  const btnFormat: React.CSSProperties = { ...btnPrimary, padding: "14px 32px", fontSize: "0.95em", flex: "1 1 200px" };
  const mainCatKey = Object.keys(ESTRUCTURA_CATEGORIAS).find(k =>
  ESTRUCTURA_CATEGORIAS[k].includes(cat.disciplina as any)
) ?? null;
const logoData = mainCatKey ? CATEGORY_LOGOS[mainCatKey] : null;

  return (
    <div style={{ ...card, padding: "80px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 10 }}>
  {logoData && (
    <img
      src={themeMode === "light" ? logoData.light : logoData.dark}
      alt={mainCatKey ?? ""}
      style={{ height: 44, width: "auto", objectFit: "contain", flexShrink: 0, opacity: 0.9 }}
    />
  )}
  <div style={{ fontSize: "2.5em", color: C.textMain, fontWeight: 900 }}>¡Documento <span style={{ color: C.accent }}>Listo</span>!</div>
</div>
      <div style={{ fontSize: "1.1em", color: C.textMuted, marginBottom: 40 }}>El PDF oficial ha sido procesado y codificado correctamente.</div>
      
      <div style={{ fontSize: "5em", marginBottom: 24, filter: themeMode !== "light" ? "drop-shadow(0 0 20px rgba(74,158,106,0.4))" : "drop-shadow(0 10px 20px rgba(0,0,0,0.1))" }}>📄</div>
      
      <div style={{ background: C.boxBg, display: "inline-block", padding: "16px 32px", borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 48 }}>
          <div style={{ fontSize: "1em", color: C.textSec, fontWeight: 700 }}>
            {cat.code}_{(formData.titulo || "caratula").replace(/\s+/g, "_")}.pdf
          </div>
      </div>
      
      <br />
      <div style={{ fontSize: "0.9em", color: C.textMuted, marginBottom: 24 }}>Selecciona el formato deseado:</div>
      <div style={btnFormatContainer}>
        <button 
          onClick={() => downloadPDF("letter")} 
          style={btnFormat}
          onMouseOver={(e)=>e.currentTarget.style.transform="translateY(-4px)"} 
          onMouseOut={(e)=>e.currentTarget.style.transform="translateY(0)"}
        >
          📋 Descargar (Carta)
        </button>
        <button 
          onClick={() => downloadPDF("a4")} 
          style={btnFormat}
          onMouseOver={(e)=>e.currentTarget.style.transform="translateY(-4px)"} 
          onMouseOut={(e)=>e.currentTarget.style.transform="translateY(0)"}
        >
          📋 Descargar (A4)
        </button>
      </div>
      
      <div style={{ marginTop: 48 }}>
          <button 
            onClick={resetForm} 
            style={btnSecondary} 
            onMouseOver={(e)=>e.currentTarget.style.background=C.btnSecHover} 
            onMouseOut={(e)=>e.currentTarget.style.background=C.btnSecBg}
          >
              + Crear nueva carátula
          </button>
      </div>
    </div>
  );
}