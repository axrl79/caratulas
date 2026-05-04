import React, { useState } from "react";
import {
  Categoria, FIELDS, personFields, peritajeFields,
  FieldKey, FormData, CATEGORY_FIELD_RULES
} from "../data/diccionarios";
import { getFieldType, allowsDecimals } from "../data/fieldTypes";
import { normalizeDecimalToPoint } from "../data/normalizeDecimal";
import {
  onlyNumbers,
  onlyLetters,
  onlyNumbersMaxDecimals,
  sanitizeCoordinate,
  sanitizeNurej,
  sanitizeDimensiones,
} from "../data/inputSanitizers";

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

  const EXCLUDED: FieldKey[] = [
    "titulo", "interesado", "ingNombre", "rni",
    "tienePlanos", "numPlanos", "numCopias", ...peritajeFields,
  ];

  const shouldShowField = (key: FieldKey) =>
    cat.active.includes(key) && categoryRules.hasOwnProperty(key);

  const sanitizeInput = (key: FieldKey, rawValue: string): string => {
    const fieldType = getFieldType(key);

    // ── Casos especiales con lógica propia ──
    if (key === "coordenadas")  return sanitizeCoordinate(rawValue);
    if (key === "nurej")        return sanitizeNurej(rawValue);
    if (key === "dimensiones")  return sanitizeDimensiones(rawValue);

    // ── Por tipo de dato ──
    switch (fieldType) {
      case "decimal2":    return onlyNumbersMaxDecimals(rawValue, 2);
      case "decimal3":    return onlyNumbersMaxDecimals(rawValue, 3);
      case "numeral":     return onlyNumbers(rawValue);
      case "literal":     return onlyLetters(rawValue);
      case "ambos":
      case "coordenadas":
      case "dimensiones":
      default:            return rawValue; // texto libre sin restricción
    }
  };

  const handleBlockedChange = (key: FieldKey, rawValue: string) => {
    const sanitized = sanitizeInput(key, rawValue);
    handleInputChange(key, sanitized);
  };

  const updateInteresado = (idx: number, value: string) => {
    const next = [...interesados];
    next[idx] = value;
    setInteresados(next);
    handleInteresadosChange?.(next);
  };
  const addInteresado = () => {
    setInteresados([...interesados, ""]);
    handleInteresadosChange?.([...interesados, ""]);
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
    padding: "clamp(20px, 5vw, 40px)", boxShadow: C.glow, backdropFilter: "blur(12px)",
  };
  const secLabel: React.CSSProperties = {
    fontSize: "0.85em", textTransform: "uppercase", letterSpacing: 2, color: C.accent,
    fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
  };
  const inputStyle = (): React.CSSProperties => ({
  width: "100%", minWidth: 0, background: C.inputBg,
  border: `1.5px solid ${C.border}`,
  borderRadius: 10, padding: "14px 16px", color: C.textMain, fontSize: "1em",
  outline: "none", transition: "all 0.2s",
});
  const labelStyle: React.CSSProperties = {
  fontSize: "0.85em", textTransform: "uppercase", letterSpacing: 1, color: C.textSec,
  fontWeight: 700, display: "flex", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap",
  minHeight: "2.4em",   // ← altura mínima fija para que todos los labels ocupen lo mismo
};
  const btnPrimary: React.CSSProperties = {
    background: C.accent, color: themeMode === "light" ? "#fff" : C.deepGreen,
    border: "none", borderRadius: 10, padding: "14px 32px",
    fontWeight: 700, fontSize: "1em", cursor: "pointer",
    boxShadow: `0 4px 14px ${C.border}`,
  };
  const btnSecondary: React.CSSProperties = {
    background: C.btnSecBg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "14px 32px", color: C.textMain, fontSize: "1em", cursor: "pointer", fontWeight: 600,
  };
  const btnSmall: React.CSSProperties = {
    background: C.accentLight, border: `1px solid ${C.accent}`, borderRadius: 8,
    padding: "6px 14px", color: C.accent, fontWeight: 700, fontSize: "0.85em", cursor: "pointer",
  };
  const btnRemove: React.CSSProperties = {
    background: "transparent", border: `1px solid #ef4444`, borderRadius: 8,
    padding: "6px 12px", color: "#ef4444", fontWeight: 700, fontSize: "0.85em", cursor: "pointer",
  };

  // ── Renderizado de input con BLOQUEO (onFocus activa la guía, onMouseEnter eliminado) ──
  const renderInput = (key: FieldKey, labelOverride?: string) => {
    const field = FIELDS.find(f => f.key === key);
    if (!field) return null;
    const rule = categoryRules[key];
    const value = formData[key] || "";
    const isRequired = rule?.required ?? false;
    const isDecimalField = rule?.decimals === true;
    const fieldType = getFieldType(key);
    const isNumeral = fieldType === "numeral";
    const isLiteral = fieldType === "literal";
    const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => handleBlockedChange(key, e.target.value);

    let placeholder = `Ingresa ${field.label.toLowerCase()}`;
    if (isDecimalField) placeholder += " (solo números: ej: 1.5)";
    else if (isNumeral) placeholder += " (solo números)";
    else if (isLiteral) placeholder += " (solo letras)";

    let typeBadge = null;
    if (isDecimalField || isNumeral) typeBadge = <span style={{ color: C.accent, fontSize: "0.7em" }}>🔢 solo números</span>;
    else if (isLiteral) typeBadge = <span style={{ color: C.accent, fontSize: "0.7em" }}>🔤 solo letras</span>;

    return (
      <div key={key} style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>
          {labelOverride ?? field.label}
          {typeBadge}
        </label>
        <input
          type="text"
          value={value}
          onChange={changeHandler}
          onFocus={() => {
            setActiveGuideKey(key);
            // Autocomplete especiales al hacer foco si el campo está vacío
            if (key === "ingNombre" && !value) {
              handleInputChange(key, "Ing. ");
            }
          }}
          placeholder={placeholder}
          style={{ ...inputStyle(), marginTop: "auto" }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
        />
      </div>
    );
  };

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: "1.8em", color: C.textMain, fontWeight: 800, marginBottom: 10 }}>{cat.label}</div>
        <div style={{ display: "inline-block", background: C.accentLight, color: C.accent, fontSize: "0.9em", fontWeight: 800, padding: "6px 14px", borderRadius: 8 }}>
          {cat.code} • {cat.disciplina}
        </div>
      </div>

      {/* Título (siempre visible, sin onMouseEnter) */}
      <div style={{ marginBottom: 32 }}>
        <div style={secLabel}>
          Título del Proyecto
          <span style={{ flex: 1, height: 1, background: C.border }} />
        </div>
        <label style={labelStyle}>
          Título del Proyecto 
        </label>
        <input
          type="text"
          value={formData.titulo || ""}
          onChange={e => {
            let val = e.target.value;
            handleInputChange("titulo", val);
          }}
          onFocus={() => {
            setActiveGuideKey("titulo");
            if (!formData.titulo) handleInputChange("titulo", '"');
          }}
          placeholder="Ingresa el título completo del proyecto"
          style={inputStyle()}
          onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
        />
      </div>

      {/* Datos del Proyecto */}
      {(projectFields.length > 0 || peritajeActiveFields.length > 0) && (
        <>
          <div style={secLabel}>
            Datos del Proyecto
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginBottom: 40, alignItems: "end" }}>
  {peritajeActiveFields.map(f => renderInput(f.key))}
  {projectFields.map(f => renderInput(f.key))}
</div>
        </>
      )}

      {/* Interesados */}
      {cat.active.includes("interesado") && cat.code !== "INP1" && (

        <>
          <div style={secLabel}>
            Interesado(s)
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div>
            <label style={labelStyle}>Interesado 1 </label>
            <input
              type="text"
              value={formData.interesado || ""}
              onChange={e => handleBlockedChange("interesado", e.target.value)}
              onFocus={() => setActiveGuideKey("interesado")} // ← solo onFocus
              placeholder="Nombre completo"
              style={inputStyle()}
              onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>
          {interesados.map((val, idx) => (
            <div key={idx} style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Interesado {idx + 2}</label>
                <input
                  type="text"
                  value={val}
                  onChange={e => updateInteresado(idx, e.target.value)}
                  placeholder="Nombre completo"
                  style={inputStyle()}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
              <button onClick={() => removeInteresado(idx)} style={{ ...btnRemove, marginTop: 34 }}>− Quitar</button>
            </div>
          ))}
          <button onClick={addInteresado} style={{ ...btnSmall, marginTop: 16, marginBottom: 40 }}>+ Agregar otro</button>
        </>
      )}

      {/* Nombre del Juzgado — solo INP1, reemplaza al interesado */}
{cat.code === "INP1" && (
  <>
    <div style={secLabel}>
      Nombre del Juzgado
      <span style={{ flex: 1, height: 1, background: C.border }} />
    </div>
    <div>
      <label style={labelStyle}>Nombre del Juzgado</label>
      <input
        type="text"
        value={formData.nombreJuzgado || ""}
        onChange={e => handleInputChange("nombreJuzgado", e.target.value)}
        onFocus={() => setActiveGuideKey("nombreJuzgado")}
        placeholder="Ej: Juzgado 1° Civil de La Paz"
        style={inputStyle()}
        onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
        onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
      />
    </div>
    <div style={{ marginBottom: 40 }} />
  </>
)}

      {/* Responsables */}

      {/* ── Campos especiales para INT1 e INP1 ── */}
{(cat.code === "INT1" || cat.code === "INP1") && (
  <>
    <div style={secLabel}>
      Especialización del Informe
      <span style={{ flex: 1, height: 1, background: C.border }} />
    </div>
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 24,
      marginBottom: 40,
      alignItems: "end",
    }}>
      {/* Campo 1: Área de Ingeniería */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>
          Área de Ingeniería
          <span style={{ color: C.accent, fontSize: "0.7em" }}>
            ej: Sistemas, Industrial, Civil
          </span>
        </label>
        <input
          type="text"
          value={formData.areaIngenieria || ""}
          onChange={e => handleInputChange("areaIngenieria", e.target.value)}
          onFocus={() => setActiveGuideKey("areaIngenieria")}
          placeholder="Ej: Sistemas, Industrial, Civil..."
          style={{ ...inputStyle(), marginTop: "auto" }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
        />
      </div>

      {/* Campo 2: Tema de Ingeniería */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>
          Tema de Ingeniería
          <span style={{ color: C.accent, fontSize: "0.7em" }}>
            ej: Base de Datos, Maquinaria, Estructuras
          </span>
        </label>
        <input
          type="text"
          value={formData.temaIngenieria || ""}
          onChange={e => handleInputChange("temaIngenieria", e.target.value)}
          onFocus={() => setActiveGuideKey("temaIngenieria")}
          placeholder="Ej: Base de Datos, Maquinaria..."
          style={{ ...inputStyle(), marginTop: "auto" }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
        />
      </div>
    </div>
  </>
)}
      {responsibleFields.filter(f => f.key !== "interesado").length > 0 && (
        <>
          <div style={secLabel}>
            Responsable Principal
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
            {responsibleFields.filter(f => f.key !== "interesado").map(f => renderInput(f.key))}
          </div>
        </>
      )}

      {/* Planos */}
      {cat.hasPlanos && (
        <>
          <div style={secLabel}>
            Planos
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <label style={{
            display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
            background: C.inputBg, border: `1.5px solid ${tienePlanos ? C.accent : C.border}`,
            borderRadius: 12, padding: "16px 20px", marginBottom: 20,
          }}>
            <div
              onClick={() => {
                const next = !tienePlanos;
                setTienePlanos(next);
                handleInputChange("tienePlanos", String(next));
                if (!next) handleInputChange("numPlanos", "");
              }}
              style={{
                width: 22, height: 22, borderRadius: 6,
                border: `2px solid ${tienePlanos ? C.accent : C.border}`,
                background: tienePlanos ? C.accent : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              {tienePlanos && <span style={{ color: "#fff", fontSize: 14 }}>✓</span>}
            </div>
            <span
              style={{ fontWeight: tienePlanos ? 700 : 500, color: C.textMain, cursor: "pointer" }}
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
          {tienePlanos && (
            <div>
              <label style={labelStyle}>Número de Planos </label>
              <input
                type="text"
                value={formData.numPlanos || ""}
                onChange={e => handleBlockedChange("numPlanos", e.target.value)}
                placeholder="Ej: 5 (solo números)"
                style={inputStyle()}
                onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
          )}
          <div style={{ marginBottom: 40 }} />
        </>
      )}

      {/* Copias */}
      {cat.active.includes("numCopias") && (
        <>
          <div style={secLabel}>
            Copias
            <span style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <div>
            <label style={labelStyle}>Número de Copias </label>
            <input
              type="text"
              value={formData.numCopias || ""}
              onChange={e => handleBlockedChange("numCopias", e.target.value)}
              placeholder="Ej: 3 (solo números)"
              style={inputStyle()}
              onFocusCapture={e => { e.currentTarget.style.borderColor = C.accent; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>
        </>
      )}

      {/* Botones */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 48 }}>
        <button onClick={goBack} style={btnSecondary}>← Volver</button>
        <button onClick={goToStep3} style={btnPrimary}>Siguiente →</button>
      </div>
    </div>
  );
}