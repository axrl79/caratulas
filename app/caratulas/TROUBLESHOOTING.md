# 🔍 Guía de Troubleshooting - Sistema de Caratulas

## 📋 Checklist Rápido

Antes de considerar que algo está "roto", verifica esto:

```
□ ¿Todos los campos del formulario están completados?
□ ¿Puedes ver el botón "📤 Enviar a Base de Datos" en Paso 4?
□ ¿Tienes conexión a internet?
□ ¿Abriste F12 (Consola) para ver los logs?
□ ¿El navegador muestra un error CORS?
```

---

## 🛠️ Procedimiento de Diagnóstico

### Paso 1: Abre la Consola del Navegador
```
Keyboard: F12 o Ctrl+Shift+I
Mouse: Click derecho → Inspeccionar → Tab "Console"
```

### Paso 2: Completa el Formulario y Haz Click en "Enviar a BD"

### Paso 3: Lee los Logs
Deberías ver mensajes como:
```
📤 Iniciando envío de caratula completa...
1️⃣ Enviando categoría...
2️⃣ Creando registro...
3️⃣ Subiendo archivos...
```

---

## 🔴 Errores Comunes y Soluciones

### Error 1: "Error: faltan datos necesarios"

**¿Qué significa?**
Las propiedades no se están pasando correctamente desde `Caratulas.tsx` a `Paso4Descarga.tsx`

**¿Cómo verificar?**
1. Abre: `app/caratulas/Caratulas.tsx`
2. Busca la línea: `<Paso4Descarga`
3. Verifica que tenga estas props:
   ```tsx
   <Paso4Descarga 
     C={C}
     themeMode={themeMode}
     cat={cat}
     formData={formData}
     downloadPDF={downloadPDF}
     generatePDFBlob={generatePDFBlob}    // ← DEBE ESTAR
     documentQRUrl={documentQRUrl}         // ← DEBE ESTAR
     documentSHA256={documentSHA256}       // ← DEBE ESTAR
     mainCat={mainCat}                     // ← DEBE ESTAR
     resetForm={resetForm}
   />
   ```

**Solución:**
- Si faltan props, copialas de la línea anterior
- Asegúrate de que `generatePDFBlob` esté definida en `Caratulas.tsx`

---

### Error 2: "Error al enviar categoría: Network error"

**¿Qué significa?**
La API no es accesible. Puede ser:
- Red está caída
- API está caída
- CORS bloqueado
- Firewall bloqueando

**¿Cómo verificar?**

En la Consola (F12):
```javascript
// Copia y pega esto en la consola:
fetch("https://convenios-lake.vercel.app/api/visados/categorias", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: "TEST", nombre: "Test" })
}).then(r => console.log("Status:", r.status))
  .catch(e => console.error("Error:", e));
```

**Resultado esperado:**
```
Status: 200  ← OK (categoría creada)
Status: 400  ← OK (error en validación, pero conectada)
Error: ...   ← PROBLEMA (red/CORS)
```

**Solución:**
- Verifica tu conexión a internet
- Intenta acceder a https://convenios-lake.vercel.app en el navegador
- Si no carga, la API está caída
- Si carga, pero falla el fetch → CORS issue en servidor

---

### Error 3: "Error al crear registro: Campos requeridos faltantes"

**¿Qué significa?**
Faltan campos obligatorios en el formulario.

**Campos requeridos:**
```
✅ titulo        (título del proyecto)
✅ interesado    (nombre del interesado)
✅ ingNombre     (nombre del ingeniero)
✅ rni           (RNI del ingeniero)
```

**¿Cómo verificar?**

En la Consola:
```javascript
// Verificar que todos los campos tienen valor
console.log({
  titulo: formData?.titulo,
  interesado: formData?.interesado,
  ingNombre: formData?.ingNombre,
  rni: formData?.rni
});
```

**Solución:**
- Vuelve a Paso 2 (Formulario)
- Completa TODOS los campos obligatorios
- Intenta enviar nuevamente

---

### Error 4: "❌ Error al subir archivos"

**¿Qué significa?**
El PDF se generó pero hay problema subiendo.

**Causas posibles:**
- PDF muy grande (>20MB)
- Problema de conectividad
- Servidor rechazando

**Solución:**
- Este error NO impide que el registro se cree
- El registro está en la BD con o sin PDF
- Intenta de nuevo, puede ser problema temporal

---

### Error 5: Botón "Enviar a BD" no aparece

**¿Qué significa?**
No llegaste a Paso 4, o no completaste pasos anteriores

**¿Cómo verificar?**
- ¿Estás en Paso 4 (Descargar)?
- ¿Seleccionaste una categoría en Paso 1?
- ¿Completaste el formulario en Paso 2?

**Solución:**
1. Ve a Paso 1
2. Selecciona categoría
3. Ve a Paso 2, completa todos los campos
4. Ve a Paso 3, revisa
5. Ve a Paso 4, deberías ver el botón

---

## 🔧 Debugging Avanzado

### Ver todos los datos que se envían

En la Consola (F12), pega esto:
```javascript
// Interceptar el envío
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log("🌐 Fetch:", args[0], args[1]);
  const res = await originalFetch(...args);
  const clone = res.clone();
  console.log("📊 Response:", res.status, await clone.text());
  return res;
};
```

Luego haz click en "Enviar a BD" y mira todo en la consola.

### Ver el estado interno de React

Si usas React DevTools:
1. Instala la extensión: "React Developer Tools"
2. F12 → "Components" tab
3. Busca "Paso4Descarga"
4. Mira el estado en la sección derecha

---

## 📊 Tab "Network" (F12)

Este es el mejor lugar para ver QUÉ se envía y QUÉ responde:

1. Abre F12
2. Tab: **Network**
3. (Deja esto abierto)
4. Haz click en "Enviar a BD"
5. Deberías ver requests a `convenios-lake.vercel.app`

**Busca estas llamadas:**
```
POST /api/visados/categorias     ← Envía categoría
POST /api/visados/registros       ← Crea registro
POST /api/visados/archivos        ← Sube PDF
```

**Para cada uno:**
- Click en el request
- Tab: "Response"
- Verifica la respuesta JSON

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "cod_hash": "VIS-XXXXXX"
  }
}
```

---

## 🚨 "CORS error" - El error más común

**¿Qué es CORS?**
Es un mecanismo de seguridad de navegadores. El servidor debe decirle al navegador: "Puedes hacer requests desde ese dominio".

**¿Cómo aparece?**
```
Error: Access to XMLHttpRequest at 'https://convenios-lake.vercel.app/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**¿Quién debe arreglarlo?**
El **servidor backend** de convenios-lake debe configurar:
```javascript
// En el backend (Node.js/Express):
app.use(cors({
  origin: "*", // O específicamente: "http://localhost:3000"
}));
```

**¿Qué puedes hacer tú?**
- Reporta el error al equipo de backend
- Muestra este error:
  ```
  CORS policy blocking requests from localhost:3000
  ```

**Workaround temporal (desarrollo):**
Usa un proxy CORS en desarrollo (NO para producción):
```javascript
// En apiIntegration.ts
const API_BASE_URL = "https://cors-anywhere.herokuapp.com/https://convenios-lake.vercel.app";
```

---

## ✅ Cómo Saber que TODO Funciona

1. **Llenar formulario** ✅
2. **Haz click en "Enviar a BD"** ✅
3. **Espera 2-3 segundos** ✅
4. **Ves el mensaje:** `✅ ¡Caratula enviada exitosamente! Código: VIS-XXXXXX` ✅
5. **En la BD existe el registro** ✅ (verifica en convenios-lake)

Si ves todos estos checkmarks → **FUNCIONA PERFECTO** 🎉

---

## 📞 Próximos Pasos

### Si todo funciona:
- ✅ Prueba con diferentes categorías
- ✅ Prueba con diferentes datos
- ✅ Verifica que los códigos (cod_hash) sean únicos

### Si algo no funciona:
1. Sigue el "Procedimiento de Diagnóstico" arriba
2. Copia el error exacto de la consola
3. Reporta con:
   - Error exacto
   - Screenshot de consola
   - Qué pasos hiciste
   - Qué categoría seleccionaste

---

## 📝 Ejemplo de Reporte de Error

```
❌ ERROR: No puedo enviar a BD

Pasos que hice:
1. Seleccioné "Proyecto Estructural - Edificación"
2. Completé todos los campos
3. Hice click en "Enviar a BD"

Error en consola:
"Error al enviar categoría: Network error"

Estoy en:
- Windows / Chrome
- Localhost:3000
- Conectado a internet ✅

Request en Network tab:
- POST /api/visados/categorias
- Status: (pendiente / failed)
- Response: Network error
```

---

**¡Buena suerte! Si necesitas ayuda, reporta con la máxima información posible.** 🚀
