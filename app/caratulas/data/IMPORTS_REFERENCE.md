# 📖 Guía de Importaciones - Estructura Modular de Diccionarios

## 📁 Estructura de Archivos

```
data/
├── diccionarios.ts          (INDEX - re-exporta todo)
├── types.ts                 (Tipos e interfaces)
├── categories.ts            (Categorías de proyectos)
├── fields.ts                (Definiciones de campos)
├── fieldRules.ts            (Reglas de validación por categoría)
├── logos.ts                 (Logos y assets)
└── themes.ts                (Temas y estilos)
```

## ✅ Importaciones por Componente

### **page.tsx** (Principal)
```typescript
import { 
  THEMES, CATEGORIAS, QR_ORDER,
  Disciplina, FieldKey, FormData, Categoria 
} from "./data/diccionarios";
```

### **Paso1Categoria.tsx**
```typescript
import { 
  ESTRUCTURA_CATEGORIAS, CATEGORIAS, Disciplina 
} from "../data/diccionarios";
```

### **Paso2Formulario.tsx** ⭐ (Más cambios)
```typescript
import { 
  Categoria, FIELDS, personFields, FieldKey, 
  FormData, CATEGORY_FIELD_RULES 
} from "../data/diccionarios";
```

### **Paso3Previa.tsx** ⭐ (Más cambios)
```typescript
import { 
  Categoria, FIELDS, personFields, FieldKey, 
  FormData, CATEGORY_FIELD_RULES 
} from "../data/diccionarios";
```

### **Paso4Descarga.tsx**
```typescript
import { Categoria, FormData } from "../data/diccionarios";
```

### **FieldGuide.tsx** ⭐ (Más cambios)
```typescript
import { Categoria, CATEGORY_LOGOS } from "./data/diccionarios";
```

### **generarPDF.ts** ⭐ (Más cambios)
```typescript
import { 
  FieldKey, Categoria, CATEGORY_FIELD_RULES 
} from "./data/diccionarios";
import { CARATULA_ASSETS } from "./data/diccionarios";
```

### **ModalAjustes.tsx**
```typescript
import { THEMES, FONT_STYLES, FONT_SIZES } from "../data/diccionarios";
```

### **Cabecera.tsx**
Sin cambios en importaciones (no usa diccionarios)

---

## 🎯 Qué se modifica en cada archivo

### **types.ts**
- Agregar/editar tipos base
- Cambiar nombre de campos (FieldKey)
- Agregar nuevas disciplinas

### **categories.ts**
- Agregar nuevas categorías (PES1, PES2, etc.)
- Cambiar etiquetas de categorías
- Modificar campos activos por categoría

### **fields.ts**
- Agregar/quitar campos del formulario
- Cambiar labels de campos
- Cambiar tipos de inputs (text, number)

### **fieldRules.ts**
- **MÁS IMPORTANTE**: Modificar reglas del Excel
- Cambiar si un campo es requerido/opcional
- Cambiar si un campo necesita decimales

### **logos.ts**
- Cambiar rutas de logos
- Agregar nuevas imágenes

### **themes.ts**
- Modificar colores
- Cambiar fuentes disponibles
- Ajustar tamaños de fuente

---

## 🔄 Flujo de Actualización

### Si necesitas **agregar una nueva categoría**:
1. ✏️ Edita `categories.ts` → `CATEGORIAS` array
2. ✏️ Edita `fieldRules.ts` → `CATEGORY_FIELD_RULES` con código (ej: "PES6")
3. ✅ Los componentes (Paso2, Paso3, generarPDF) usan estas reglas automáticamente

### Si necesitas **agregar un nuevo campo**:
1. ✏️ Edita `types.ts` → agrega a `FieldKey` type
2. ✏️ Edita `fields.ts` → agrega a `FIELDS` array
3. ✏️ Edita `fieldRules.ts` → para cada categoría que use este campo
4. ✅ Los componentes lo detectarán automáticamente

### Si necesitas **cambiar reglas del Excel**:
1. ✏️ Edita `fieldRules.ts` → `CATEGORY_FIELD_RULES[catCode]`
2. ✅ Paso2 mostrará/ocultará dinámicamente
3. ✅ generarPDF solo incluirá campos activos

### Si necesitas **cambiar colores/temas**:
1. ✏️ Edita `themes.ts` → THEMES objeto
2. ✅ Cambio automático en toda la app

---

## 🚀 Ventajas de esta estructura

| Aspecto | Beneficio |
|---------|-----------|
| **Separación de responsabilidades** | Fácil encontrar qué modificar |
| **Mantenibilidad** | Cambios localizados sin romper otros |
| **Escalabilidad** | Agregar categorías sin tocar componentes |
| **Tipo seguridad** | TypeScript valida importaciones |
| **Re-exportación central** | `diccionarios.ts` como proxy |

---

## ⚠️ Errores comunes

### ❌ Importar directamente del archivo específico
```typescript
// MAL
import { FIELDS } from "../data/fields";
```

### ✅ Importar desde diccionarios.ts
```typescript
// BIEN
import { FIELDS } from "../data/diccionarios";
```

---

## 📝 Checklist para nuevos cambios

- [ ] Identifiqué qué se modifica (tipo, categoría, campo, regla, logo, tema)
- [ ] Edité el archivo correcto
- [ ] Re-exporté en `diccionarios.ts` si es nuevo
- [ ] Actualizacé los imports en componentes que lo usan
- [ ] Sin errores TypeScript ✅

---

**Última actualización**: 2024