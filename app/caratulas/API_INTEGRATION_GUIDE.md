# 📡 Guía de Integración de APIs - Sistema de Caratulas

## 🎯 Resumen

El sistema de caratulas ahora está integrado completamente con las APIs de convenios-lake para guardar todos los datos en una base de datos centralizada.

---

## 🏗️ Flujo Completo de Integración

### 1. **Paso 1-3: Recolección de Datos**
- El usuario llena el formulario en los pasos 1-3
- Los datos se almacenan en `formData` (estado de React)
- Se genera el PDF con todos los campos completados

### 2. **Paso 4: Descarga y Envío a BD**
- El usuario ve el botón **"📤 Enviar a Base de Datos"**
- Al hacer clic, se dispara la función `handleEnviarABD()`
- El flujo de envío es automático y transparente

### 3. **Proceso de Envío Automático**

```
[1] Generar PDF como Blob
    ↓
[2] Enviar Categoría a API
    ↓
[3] Crear Registro (Visado) en BD
    ↓
[4] Subir PDF como Archivo
    ↓
[✅] Mostrar código de referencia (cod_hash)
```

---

## 📂 Archivos Nuevos Creados

### 1. **`app/caratulas/data/apiIntegration.ts`** ⭐ PRINCIPAL
Servicio completo de integración con las APIs:

#### Funciones principales:

```typescript
// 1. Mapea FormData del sistema a formato de API
mapFormDataToRegistro(formData, categoria): RegistroPayload

// 2. Envía categoría a la API (si no existe)
enviarCategoria(categoria): Promise<ApiResponse>

// 3. Crea el registro (visado) en la BD
enviarRegistro(formData, categoria): Promise<ApiResponse>

// 4. Sube archivos PDF
enviarArchivos(registroId, files, tipo): Promise<ApiResponse>

// 5. Flujo completo automático
enviarCaratulaCompleta(formData, categoria, pdfFile): Promise<ApiResponse>

// 6. Utilidad: convierte Blob a File
blobToFile(blob, filename): File
```

---

## 🔄 Mapeo de Campos: Sistema Local → API

| Campo Local | Campo API | Requerido | Notas |
|------------|----------|----------|-------|
| `titulo` | `titulo` | ✅ | Mismo nombre |
| `interesado` | `interesado` | ✅ | Se toma el primero |
| `ingNombre` | `ing_nombre` | ✅ | Nombre del ingeniero |
| `rni` | `rni` | ✅ | RNI del ingeniero |
| `coordenadas` | `coordenadas` | ❌ | Lat, Long separados |
| `municipio` | `municipio` | ❌ | Municipio |
| `zona` | `zona` | ❌ | Zona |
| `calle` | `calle` | ❌ | Calle/dirección |
| `niveles` | `niveles` | ❌ | Número (int) |
| `superfConstruir` | `superf_construir` | ❌ | Número con decimales |
| `superfTerreno` | `superf_terreno` | ❌ | Número con decimales |
| `tienePlanos` | `tiene_planos` | ❌ | Boolean |
| `numPlanos` | `num_planos` | ❌ | Número (int) |
| `numCopias` | `num_copias` | ❌ | Número (int) |
| `norma` | `norma` | ❌ | Norma de diseño |
| `normaVerif` | `norma_verif` | ❌ | Norma verificación |
| `normaAplicacion` | `norma_aplicacion` | ❌ | Norma técnica |

---

## 🛠️ Cambios Realizados

### 1. **`app/caratulas/components/Paso4Descarga.tsx`**
- ✅ Agregado estado `isUploading` para manejar carga
- ✅ Agregado estado `uploadStatus` para mensajes de error/éxito
- ✅ Nuevo botón: "📤 Enviar a Base de Datos"
- ✅ Mensajes de estado en tiempo real
- ✅ Manejo de errores con feedback visual

### 2. **`app/caratulas/Caratulas.tsx`**
- ✅ Nueva función: `generatePDFBlob()` - genera PDF en memoria
- ✅ Pasadas nuevas props a Paso4Descarga:
  - `generatePDFBlob`
  - `documentQRUrl`
  - `documentSHA256`
  - `mainCat`

---

## 🚀 Cómo Funciona el Envío

### Flujo Técnico:

```typescript
async function handleEnviarABD() {
  // 1. Genera PDF como Blob (en memoria, sin descargar)
  const pdfBlob = await generatePDFBlob("letter");
  const pdfFile = blobToFile(pdfBlob, filename);

  // 2. Llama a la función principal de envío
  const result = await enviarCaratulaCompleta(
    formData,        // datos del formulario
    cat,             // categoría seleccionada
    pdfFile          // PDF generado
  );

  // 3. Muestra resultado al usuario
  if (result.success) {
    // ✅ Éxito - muestra cod_hash
  } else {
    // ❌ Error - muestra mensaje
  }
}
```

---

## 📡 Endpoints API Utilizados

### 1. **POST `/api/visados/categorias`**
```json
{
  "code": "PES1",
  "nombre": "Proyecto Estructural - Edificación",
  "descripcion": "..."
}
```
**Respuesta:** `{ success: true, data: {...} }`

### 2. **POST `/api/visados/registros`**
```json
{
  "titulo": "Edificación Residencial 3 niveles",
  "categoria_code": "PES1",
  "interesado": "Juan Pérez López",
  "ing_nombre": "Ing. Carlos Mamani",
  "rni": "12345",
  "coordenadas": "-16.5000, -68.1500",
  "municipio": "La Paz",
  "zona": "Sopocachi",
  "calle": "Av. 6 de Agosto #123",
  "niveles": 3,
  "norma": "CBH-87",
  "norma_verif": "NB 1225001",
  "norma_aplicacion": "Sísmica",
  "superf_construir": 450.5,
  "superf_terreno": 200,
  "tiene_planos": true,
  "num_planos": 5,
  "num_copias": 3
}
```
**Respuesta:** `{ data: { id: 1, cod_hash: "VIS-A3F8C2" } }`

### 3. **POST `/api/visados/archivos`** (multipart/form-data)
```
Form Data:
- registro_id: 1
- tipo: PLANO
- files: [PDF file]
```
**Respuesta:** `{ success: true, data: {...} }`

---

## ✅ Checklist de Funcionamiento

- [x] Mapeo de datos de formulario a API
- [x] Función para generar PDF como Blob
- [x] Envío de categoría
- [x] Creación de registro con todos los campos
- [x] Subida de archivos
- [x] Manejo de errores
- [x] Mensajes de estado en interfaz
- [x] Código de referencia en respuesta

---

## 🐛 Posibles Errores y Soluciones

### Error: "Error: faltan datos necesarios"
**Causa:** Las props no se están pasando correctamente
**Solución:** Verificar que `Caratulas.tsx` pase todas las props a `Paso4Descarga`

### Error: "Error al enviar categoría"
**Causa:** La categoría ya existe en la BD
**Solución:** Esto es normal, el sistema continúa. Se ignora el error.

### Error: "Error al crear registro"
**Causa:** Campos requeridos vacíos
**Solución:** Asegurar que titulo, interesado, ing_nombre, rni estén completos

### Error: CORS o "Error de red"
**Causa:** La API no es accesible desde el frontend
**Solución:** Configurar CORS en el servidor backend

---

## 🔐 Seguridad y Validación

- ✅ Validación de campos requeridos en apiIntegration.ts
- ✅ Conversión segura de tipos (strings → numbers, booleans)
- ✅ Manejo de decimales con coma y punto
- ✅ Logging en consola para debugging
- ✅ Errores amigables para el usuario

---

## 📋 Próximas Mejoras Opcionales

1. **Subida de múltiples archivos**
   - Permitir subir memorias, planos adicionales
   - Tipo de archivo seleccionable (PLANO, MEMORIA, INFORME)

2. **Validación en cliente**
   - Verificar datos antes de enviar
   - Mostrar campos faltantes

3. **Reintentos automáticos**
   - Si falla, reintentar 3 veces
   - Con backoff exponencial

4. **Descarga del PDF después de envío**
   - Generar automáticamente como descarga
   - Mostrar confirmación con nombre de archivo

5. **Historial de envíos**
   - Guardar registro de códigos enviados
   - Permitir re-descargar caratulas previas

---

## 📞 Debugging

Si algo no funciona:

1. **Abre la consola del navegador** (F12)
2. **Mira el tab "Console"** para logs detallados
3. **Mira el tab "Network"** para ver las llamadas API
4. **Verifica que la URL de API sea correcta:**
   ```typescript
   const API_BASE_URL = "https://convenios-lake.vercel.app";
   ```

---

**¡Sistema integrado y listo para usar! 🎉**
