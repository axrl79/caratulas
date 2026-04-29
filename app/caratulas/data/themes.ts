// ─────────────────────────────────────────────────────────────────────────
// TEMAS Y ESTILOS
// ─────────────────────────────────────────────────────────────────────────

export const THEMES = {
  dark: {
    name: "Oscuro",
    deepGreen: "#0f2419",
    bgGrad: "linear-gradient(160deg, #0f2419 0%, #1a3a2a 50%, #0a1a12 100%)",
    headerGrad: "linear-gradient(90deg, rgba(15,36,25,0.9), rgba(26,58,42,0.9))",
    cardBg: "rgba(255,255,255,0.03)", textMain: "#ffffff", textSec: "#a8d5b5", textMuted: "#8ca896",
    accent: "#4e9e6a", accentHover: "#3a7a52", accentLight: "#d4edd9",
    border: "rgba(74,158,106,0.35)", borderFocus: "#4e9e6a", glow: "0 8px 32px rgba(0,0,0,0.4)",
    inputBg: "rgba(0,0,0,0.2)", boxBg: "rgba(0,0,0,0.4)", tabBgActive: "#4e9e6a", tabTextActive: "#0f2419",
    btnSecBg: "rgba(255,255,255,0.05)", btnSecHover: "rgba(255,255,255,0.1)",
  },
  light: {
    name: "Claro",
    deepGreen: "#0f2419",
    bgGrad: "linear-gradient(160deg, #f4faf6 0%, #e8f4ec 50%, #dcfce7 100%)",
    headerGrad: "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(240,253,244,0.9))",
    cardBg: "rgba(255,255,255,0.8)", textMain: "#0f2419", textSec: "#2d5a3d", textMuted: "#5b7a66",
    accent: "#16a34a", accentHover: "#15803d", accentLight: "#dcfce7",
    border: "rgba(22,163,74,0.25)", borderFocus: "#16a34a", glow: "0 8px 30px rgba(0,0,0,0.06)",
    inputBg: "#ffffff", boxBg: "#f0fdf4", tabBgActive: "#16a34a", tabTextActive: "#ffffff",
    btnSecBg: "rgba(22,163,74,0.05)", btnSecHover: "rgba(22,163,74,0.1)",
  },
  engineering: {
    name: "Verde SIB",
    deepGreen: "#021209",
    bgGrad: "linear-gradient(160deg, #051f11 0%, #0a3821 50%, #020d07 100%)",
    headerGrad: "linear-gradient(90deg, rgba(5,31,17,0.95), rgba(10,56,33,0.95))",
    cardBg: "rgba(34, 197, 94, 0.04)", textMain: "#ffffff", textSec: "#4ade80", textMuted: "#86efac",
    accent: "#22c55e", accentHover: "#16a34a", accentLight: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.4)", borderFocus: "#4ade80", glow: "0 8px 32px rgba(34, 197, 94, 0.15)",
    inputBg: "rgba(0,0,0,0.4)", boxBg: "rgba(0,0,0,0.6)", tabBgActive: "#22c55e", tabTextActive: "#021209",
    btnSecBg: "rgba(34, 197, 94, 0.05)", btnSecHover: "rgba(34, 197, 94, 0.15)",
  }
};

export const FONT_STYLES = [
  { id: "'Inter', sans-serif", name: 'Inter', desc: 'Moderno y limpio' },
  { id: "'Poppins', sans-serif", name: 'Poppins', desc: 'Geométrico' },
  { id: "'Roboto', sans-serif", name: 'Roboto', desc: 'Profesional' },
  { id: "'Playfair Display', serif", name: 'Playfair', desc: 'Elegante' },
  { id: "'JetBrains Mono', monospace", name: 'JetBrains', desc: 'Técnico' },
];

export const FONT_SIZES = [
  { value: '12px', label: 'Pequeño' },
  { value: '14px', label: 'Estándar' },
  { value: '16px', label: 'Grande' },
  { value: '18px', label: 'Extra Grande' },
];