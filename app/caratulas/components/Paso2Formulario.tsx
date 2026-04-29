import React, { useState } from "react";
import {
  Categoria, FIELDS, personFields, peritajeFields,
  FieldKey, FormData, CATEGORY_FIELD_RULES
} from "../data/diccionarios";

interface Paso2FormularioProps {
  C: any;
  themeMode: "light" | "dark" | "engineering";
  cat: Categoria;
  formData: FormData;
  handleInputChange: (key: FieldKey, value: string) => void;
  handleInteresadosChange?: (list: string[]) => void;
  setActiveGuideKey: (key: string | null) => void;
  goBack: () => void;
  goToStep3: () => void;
}

export default function Paso2Formulario({
  C, themeMode, cat, formData, handleInputChange,
  handleInteresadosChange, setActiveGuideKey, goBack, goToStep3
}: Paso2FormularioProps) {

  const [interesados, setInteresados] = useState<string[]>(
    formData.interesados ?? []
  );
  const [tienePlanos, setTienePlanos] = useState<boolean>(
    formData.tienePlanos === "true"
  );

  const categoryRules = CATEGORY_FIELD_RULES[cat.code] || {};

  // ── titulo se excluye del grid: se renderiza fijo arriba ──
  const EXCLUDED: FieldKey[] = [
    "titulo",
    "interesado", "ingNombre", "rni",
    "tienePlanos", "numPlanos", "numCopias",
    ...peritajeFields,
  ];

  const shouldShowField = (key: FieldKey) =>
    cat.active.includes(key) && categoryRules.hasOwnProperty(key);

  const isNumericField = (key: FieldKey) => {
    const rule = categoryRules[key];
    return rule?.decimals || FIELDS.find(f => f.key === key)?.type === "number";
  };

  const validateDecimal = (value: string, key: FieldKey) => {
    const rule = categoryRules[key];
    if (!rule?.decimals || !value) return true;
    return /^\d+(\.\d+)?$/.test(value);
  };

  const updateInteresado = (idx: number, value: string) => {
    const next = [...interesados];
    next[idx] = value;
    setInteresados(next);
    handleInteresadosChange?.(next);
  };
  const addInteresado = () => {
    const next = [...interesados, ""];
    setInteresados(next);
    handleInteresadosChange?.(next);
  };
  const removeInteresado = (idx: number) => {
    const next = interesados.filter((_, i) => i !== idx);
    setInteresados(next);
    handleInteresadosChange?.(next);
  };

  const projectFields = FIELDS.filter(f =>
    !EXCLUDED.includes(f.key) && shouldShowField(f.key)
  );
  const responsibleFields = FIELDS.filter(f =>
    personFields.includes(f.key) && shouldShowField(f.key)
  );
  const peritajeActiveFields = FIELDS.filter(f =>
    peritajeFields.includes(f.key) && shouldShowField(f.key)
  );

  // ── Estilos ──
  const card: React.CSSProperties = {
    background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 20,
    padding: 40, boxShadow: C.glow, backdropFilter: "blur(12px)", transition: "all 0.3s ease",
  };
  const secLabel: React.CSSProperties = {
    fontSize: "0.85em", textTransform: "uppercase", letterSpacing: 2, color: C.accent,
    fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
  };
  const inputStyle = (isInvalid = false): React.CSSProperties => ({
    width: "100%", background: C.inputBg,
    border: `1.5px solid ${isInvalid ? "#ef4444" : C.border}`,
    borderRadius: 10, padding: "14px 16px", color: C.textMain, fontSize: "1em",
    outline: "none", transition: "all 0.2s", fontFamily: "inherit",
  });
  const labelStyle: React.CSSProperties = {
    fontSize: "0.85em", textTransform: "uppercase", letterSpacing: 1, color: C.textSec,
    fontWeight: 700, display: "flex", alignItems: "center", marginBottom: 10,
  };
  const btnPrimary: React.CSSProperties = {
    background: C.accent, color: themeMode === "light" ? "#fff" : C.deepGreen,
    border: "none", borderRadius: 10, padding: "14px 32px",
    fontWeight: 700, fontSize: "1em", cursor: "pointer", transition: "all 0.2s",
    boxShadow: `0 4px 14px ${C.border}`,
  };
  const btnSecondary: React.CSSProperties = {
    background: C.btnSecBg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "14px 32px", color: C.textMain, fontSize: "1em", cursor: "pointer",
    transition: "all 0.2s", fontWeight: 600,
  };
  const btnSmall: React.CSSProperties = {
    background: C.accentLight, border: `1px solid ${C.accent}`, borderRadius: 8,
    padding: "6px 14px", color: C.accent, fontWeight: 700, fontSize: "0.85em",
    cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
  };
  const btnRemove: React.CSSProperties = {
    background: "transparent", border: `1px solid #ef4444`, borderRadius: 8,
    padding: "6px 12px", color: "#ef4444", fontWeight: 700, fontSize: "0.85em",
    cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
  };

  // ── Renderizado genérico de un input ──
  const renderInput = (key: FieldKey, labelOverride?: string) => {
    const field = FIELDS.find(f => f.key === key);
    if (!field) return null;
    const rule = categoryRules[key];
    const value = formData[key] || "";
    const isInvalid = !!(rule?.decimals && value && !validateDecimal(value, key));
    const isCoords = key === "coordenadas";
    const isRequired = rule?.required ?? false;

    return (
      <div key={key} style={{ gridColumn: (field.full || isCoords) ? "1/-1" : "auto" }}>
        <label style={labelStyle}>
          {labelOverride ?? field.label}
          {isRequired
            ? <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>
            : <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 6, textTransform: "none" }}>(Opcional)</span>
          }
          {isCoords && (
            <span style={{ color: C.accent, textTransform: "none", fontWeight: 500, fontSize: "0.9em", marginLeft: 8 }}>
              (Usa el mapa del panel derecho)
            </span>
          )}
        </label>
        <input
          type={isNumericField(key) ? "number" : field.type}
          step={rule?.decimals ? "0.01" : "1"}
          value={value}
          onChange={e => handleInputChange(key, e.target.value)}
          onMouseEnter={() => setActiveGuideKey(key)}
          onFocus={() => setActiveGuideKey(key)}
          placeholder={`Ingresa ${field.label.toLowerCase()}${rule?.decimals ? " (ej: 1.048)" : ""}`}
          style={inputStyle(isInvalid)}
          onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.border}`; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = isInvalid ? "#ef4444" : C.border; e.currentTarget.style.boxShadow = "none"; }}
        />
        {isInvalid && (
          <div style={{ fontSize: "0.75em", color: "#ef4444", marginTop: 4, fontWeight: 600 }}>
            ⚠️ Ingresa un número decimal válido (ej: 1.048)
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={card}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: "1.8em", color: C.textMain, fontWeight: 800, marginBottom: 10 }}>
          {cat.label}
        </div>
        <div style={{ display: "inline-block", background: C.accentLight, color: C.accent, fontSize: "0.9em", fontWeight: 800, padding: "6px 14px", borderRadius: 8, letterSpacing: 1 }}>
          {cat.code} • {cat.disciplina}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TÍTULO DEL PROYECTO — siempre visible, fijo
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <div style={secLabel}>
          Título del Proyecto
          <span style={{ flex: 1, height: 1, background: C.border }} />
        </div>
        <label style={labelStyle}>
          Título del Proyecto
          <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>
        </label>
        <input
          type="text"
          value={formData.titulo || ""}
          onChange={e => handleInputChange("titulo", e.target.value)}
          onMouseEnter={() => setActiveGuideKey("titulo")}
          onFocus={() => setActiveGuideKey("titulo")}
          placeholder='Ingresa el título completo del proyecto'
          style={inputStyle()}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = C.accent;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${C.border}`;
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════
          SECCIÓN 1: DATOS DEL PROYECTO
      ══════════════════════════════════════════════════ */}
      {(projectFields.length > 0 || peritajeActiveFields.length > 0) && (
        <>
          <div style={secLabel}>
            Datos del Proyecto
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
            {peritajeActiveFields.map(f => renderInput(f.key))}
            {projectFields.map(f => renderInput(f.key))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          SECCIÓN 2: INTERESADOS
      ══════════════════════════════════════════════════ */}
      {cat.active.includes("interesado") && (
        <>
          <div style={secLabel}>
            Nombre del (de los) Interesado(s)
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
            {/* Interesado principal */}
            <div>
              <label style={labelStyle}>
                Interesado 1
                <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>
              </label>
              <input
                type="text"
                value={formData.interesado || ""}
                onChange={e => handleInputChange("interesado", e.target.value)}
                onMouseEnter={() => setActiveGuideKey("interesado")}
                onFocus={() => setActiveGuideKey("interesado")}
                placeholder="Nombre completo del interesado"
                style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.border}`; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Interesados adicionales */}
            {interesados.map((val, idx) => (
              <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Interesado {idx + 2}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={e => updateInteresado(idx, e.target.value)}
                    placeholder={`Nombre del interesado ${idx + 2}`}
                    style={inputStyle()}
                    onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.border}`; }}
                    onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
                <button onClick={() => removeInteresado(idx)} style={{ ...btnRemove, marginTop: 34 }}>
                  − Quitar
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 40 }}>
            <button onClick={addInteresado} style={btnSmall}>
              + Agregar otro interesado
            </button>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          SECCIÓN 3: RESPONSABLES
      ══════════════════════════════════════════════════ */}
      {responsibleFields.filter(f => f.key !== "interesado").length > 0 && (
        <>
          <div style={secLabel}>
            Responsables
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
            {responsibleFields
              .filter(f => f.key !== "interesado")
              .map(f => renderInput(f.key))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          SECCIÓN 4: PLANOS
      ══════════════════════════════════════════════════ */}
      {cat.hasPlanos && (
        <>
          <div style={secLabel}>
            Planos
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
              background: C.inputBg, border: `1.5px solid ${tienePlanos ? C.accent : C.border}`,
              borderRadius: 12, padding: "16px 20px", transition: "all 0.2s",
            }}>
              <div
                onClick={() => {
                  const next = !tienePlanos;
                  setTienePlanos(next);
                  handleInputChange("tienePlanos", String(next));
                  if (!next) handleInputChange("numPlanos", "");
                }}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${tienePlanos ? C.accent : C.border}`,
                  background: tienePlanos ? C.accent : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", cursor: "pointer",
                }}
              >
                {tienePlanos && (
                  <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                    <path d="M1 5L5 9L12 1" stroke={themeMode === "light" ? "#fff" : "#000"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span
                style={{ fontSize: "1em", fontWeight: tienePlanos ? 700 : 500, color: C.textMain, cursor: "pointer" }}
                onClick={() => {
                  const next = !tienePlanos;
                  setTienePlanos(next);
                  handleInputChange("tienePlanos", String(next));
                  if (!next) handleInputChange("numPlanos", "");
                }}
              >
                Cuenta con Planos
              </span>
            </label>
          </div>

          {tienePlanos && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 16, animation: "fadeIn 0.2s ease" }}>
              <div>
                <label style={labelStyle}>
                  Número de Planos
                  <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numPlanos || ""}
                  onChange={e => handleInputChange("numPlanos", e.target.value)}
                  placeholder="Ej: 5"
                  style={inputStyle()}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.border}`; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 40 }} />
        </>
      )}

      {/* ══════════════════════════════════════════════════
          SECCIÓN 5: NÚMERO DE COPIAS
      ══════════════════════════════════════════════════ */}
      {cat.active.includes("numCopias") && (
        <>
          <div style={secLabel}>
            Copias
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
            <div>
              <label style={labelStyle}>
                Número de Copias
                <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.numCopias || ""}
                onChange={e => handleInputChange("numCopias", e.target.value)}
                placeholder="Ej: 3"
                style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.border}`; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Botones ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 48 }}>
        <button
          onClick={goBack}
          style={btnSecondary}
          onMouseOver={e => e.currentTarget.style.background = C.btnSecHover}
          onMouseOut={e => e.currentTarget.style.background = C.btnSecBg}
        >
          ← Volver
        </button>
        <button
          onClick={goToStep3}
          style={btnPrimary}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          Generar Vista Previa →
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}