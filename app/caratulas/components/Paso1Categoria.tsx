import React from "react";
import { ESTRUCTURA_CATEGORIAS, CATEGORIAS, Disciplina } from "../data/diccionarios";

interface Paso1CategoriaProps {
  C: any;
  themeMode: "light" | "dark" | "engineering";
  mainCat: string;
  setMainCat: (cat: string) => void;
  subCat: Disciplina | "";
  setSubCat: (cat: Disciplina | "") => void;
  selectedCat: number | null;
  setSelectedCat: (idx: number | null) => void;
  setActiveGuideKey: (key: string | null) => void;
  goToStep2: () => void;
}

export default function Paso1Categoria({
  C, themeMode, mainCat, setMainCat, subCat, setSubCat,
  selectedCat, setSelectedCat, setActiveGuideKey, goToStep2
}: Paso1CategoriaProps) {

  // Estilos locales
  const card: React.CSSProperties = { background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 40, boxShadow: C.glow, backdropFilter: "blur(12px)", transition: "all 0.3s ease" };
  const secLabel: React.CSSProperties = { fontSize: "0.85em", textTransform: "uppercase", letterSpacing: 2, color: C.accent, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 };
  const btnPrimary: React.CSSProperties = { background: C.accent, color: themeMode === "light" ? "#fff" : C.deepGreen, border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 700, fontSize: "1em", cursor: "pointer", transition: "all 0.2s", boxShadow: `0 4px 14px ${C.border}` };
  
  const listBtnStyle = (isActive: boolean): React.CSSProperties => ({
    width: "100%", textAlign: "left", padding: "14px 18px", borderRadius: 10, 
    background: isActive ? C.accentLight : "transparent", 
    border: `2px solid ${isActive ? C.accent : "transparent"}`, 
    color: isActive ? (themeMode==="light" ? C.accent : C.textMain) : C.textMain, 
    fontSize: "1em", fontWeight: isActive ? 800 : 600, 
    cursor: "pointer", transition: "all 0.2s", marginBottom: 6, fontFamily: "inherit"
  });

  return (
    <div style={card}>
      <div style={{ fontSize: "2em", color: C.textMain, fontWeight: 800, marginBottom: 8 }}>
        Selecciona la <span style={{ color: C.accent }}>Especialidad</span>
      </div>
      <div style={{ fontSize: "1.05em", color: C.textMuted, marginBottom: 36 }}>
        Pasa el cursor sobre las opciones para ver su definición en el Asistente Técnico a la derecha.
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
        {/* Columna 1 */}
        <div>
          <div style={secLabel}>1. Categoría Principal</div>
          <div style={{ background: C.inputBg, padding: 12, borderRadius: 14, border: `1px solid ${C.border}`, minHeight: 350 }}>
            {Object.keys(ESTRUCTURA_CATEGORIAS).map(main => (
              <button 
                key={main} 
                onClick={() => { setMainCat(main); setSubCat(""); setSelectedCat(null); setActiveGuideKey(main); }} 
                onMouseEnter={() => setActiveGuideKey(main)}
                style={listBtnStyle(mainCat === main)}
                onMouseOver={(e) => { if(mainCat !== main) e.currentTarget.style.background = C.btnSecHover }}
                onMouseOut={(e) => { if(mainCat !== main) e.currentTarget.style.background = "transparent" }}
              >
                {main}
              </button>
            ))}
          </div>
        </div>

        {/* Columna 2 */}
        <div style={{ opacity: mainCat ? 1 : 0.4, pointerEvents: mainCat ? "auto" : "none", transition: "opacity 0.3s" }}>
          <div style={secLabel}>2. Disciplina Secundaria</div>
          <div style={{ background: C.inputBg, padding: 12, borderRadius: 14, border: `1px solid ${C.border}`, minHeight: 350 }}>
            {mainCat ? ESTRUCTURA_CATEGORIAS[mainCat].map(sub => (
              <button 
                key={sub} 
                onClick={() => { setSubCat(sub as Disciplina); setSelectedCat(null); setActiveGuideKey(sub); }} 
                onMouseEnter={() => setActiveGuideKey(sub)}
                style={listBtnStyle(subCat === sub)}
                onMouseOver={(e) => { if(subCat !== sub) e.currentTarget.style.background = C.btnSecHover }}
                onMouseOut={(e) => { if(subCat !== sub) e.currentTarget.style.background = "transparent" }}
              >
                {sub}
              </button>
            )) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: C.textMuted, fontStyle: "italic" }}>
                Selecciona una Categoría Principal primero
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proyectos Oficiales */}
      {subCat && (
        <>
          <div style={{ width: "100%", height: 1, background: C.border, marginBottom: 32 }} />
          <div style={secLabel}>3. Formato de Proyecto Oficial</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {CATEGORIAS.map((c, i) => {
              if (c.disciplina !== subCat) return null;
              const isSelected = selectedCat === i;
              return (
                <button 
                  key={c.code} 
                  onClick={() => { setSelectedCat(i); setActiveGuideKey(c.label); }} 
                  onMouseEnter={() => setActiveGuideKey(c.label)}
                  style={{ background: isSelected ? C.accentLight : C.inputBg, border: `2px solid ${isSelected ? C.accent : C.border}`, borderRadius: 14, padding: "24px 20px", cursor: "pointer", textAlign: "left", color: C.textMain, transition: "all 0.2s ease", boxShadow: isSelected ? `0 0 0 4px ${C.border}` : "none" }}
                  onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.borderColor = C.accent }}
                  onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.borderColor = C.border }}
                >
                  <span style={{ display: "inline-block", background: isSelected ? C.accent : C.border, color: isSelected ? (themeMode==="light" ? "#fff" : C.deepGreen) : C.textMain, fontWeight: 800, fontSize: "0.9em", padding: "6px 12px", borderRadius: 8, marginBottom: 12, letterSpacing: 1 }}>{c.code}</span>
                  <div style={{ fontSize: "1.05em", lineHeight: 1.5, fontWeight: isSelected ? 700 : 500 }}>{c.label}</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <button onClick={goToStep2} style={{...btnPrimary, opacity: selectedCat !== null ? 1 : 0.5, cursor: selectedCat !== null ? "pointer" : "not-allowed"}} onMouseOver={(e)=> selectedCat !== null && (e.currentTarget.style.transform="translateY(-2px)")} onMouseOut={(e)=>e.currentTarget.style.transform="translateY(0)"}>
          Continuar al Formulario →
        </button>
      </div>
    </div>
  );
}