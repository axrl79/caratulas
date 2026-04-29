import { THEMES, FONT_STYLES, FONT_SIZES } from "../data/diccionarios";

interface ModalAjustesProps {
  show: boolean;
  onClose: () => void;
  C: any; 
  themeMode: keyof typeof THEMES;
  setThemeMode: (theme: keyof typeof THEMES) => void;
  appFont: string;
  setAppFont: (font: string) => void;
  appFontSize: string;
  setAppFontSize: (size: string) => void;
}

export default function ModalAjustes({
  show, onClose, C, themeMode, setThemeMode, 
  appFont, setAppFont, appFontSize, setAppFontSize
}: ModalAjustesProps) {
  
  if (!show) return null;

  const secLabel: React.CSSProperties = { 
    fontSize: "0.85em", textTransform: "uppercase", letterSpacing: 2, 
    color: C.accent, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 
  };

  const card: React.CSSProperties = { 
    background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20, 
    padding: 40, boxShadow: C.glow, backdropFilter: "blur(12px)", transition: "all 0.3s ease" 
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...card, width: 700, maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: C.textMuted, fontSize: 24, cursor: "pointer" }}>×</button>
        
        <div style={{ fontSize: "1.5em", fontWeight: 800, color: C.textMain, marginBottom: 8 }}>🎨 Apariencia y Accesibilidad</div>
        <div style={{ color: C.textMuted, marginBottom: 32, fontSize: "0.95em" }}>Personaliza el aspecto visual con temas, fuentes y estilos profesionales.</div>

        {/* TEMAS */}
        <div style={secLabel}>Modo de Interfaz</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(t => (
            <button key={t} onClick={() => setThemeMode(t)} style={{ padding: "20px 10px", borderRadius: 12, background: themeMode === t ? C.accentLight : C.inputBg, border: `2px solid ${themeMode === t ? C.accent : C.border}`, color: C.textMain, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
              {THEMES[t].name}
            </button>
          ))}
        </div>

        {/* FUENTES */}
        <div style={secLabel}>Estilo de Fuente</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
          {FONT_STYLES.map(font => (
            <button key={font.id} onClick={() => setAppFont(font.id)} style={{ padding: "16px", borderRadius: 12, textAlign: "left", background: appFont === font.id ? C.accentLight : C.inputBg, border: `2px solid ${appFont === font.id ? C.accent : C.border}`, color: C.textMain, cursor: "pointer" }}>
              <div style={{ fontFamily: font.id, fontWeight: 700, fontSize: "1.1em", marginBottom: 4 }}>{font.name}</div>
              <div style={{ fontSize: "0.8em", color: C.textMuted }}>{font.desc}</div>
            </button>
          ))}
        </div>

        {/* TAMAÑOS */}
        <div style={secLabel}>Tamaño de Letra</div>
        <div style={{ display: "flex", gap: 12 }}>
          {FONT_SIZES.map(size => (
            <button key={size.value} onClick={() => setAppFontSize(size.value)} style={{ flex: 1, padding: "12px", borderRadius: 12, background: appFontSize === size.value ? C.accentLight : C.inputBg, border: `2px solid ${appFontSize === size.value ? C.accent : C.border}`, color: C.textMain, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>
              {size.label} <br/><span style={{ fontSize: "0.8em", color: C.textMuted, fontWeight: 400 }}>{size.value}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}