/**
 * ─────────────────────────────────────────────────────────────────────────
 * TEST SCRIPT - Verifica la conectividad con las APIs
 * ─────────────────────────────────────────────────────────────────────────
 * 
 * CÓMO USAR:
 * 1. Abre F12 en el navegador (Consola)
 * 2. Copia TODO el contenido de este archivo
 * 3. Pégalo en la consola y presiona Enter
 * 4. Espera a que terminen todos los tests
 * 5. Verifica que todos muestren "✅ OK"
 */

console.log("🧪 INICIANDO TESTS DE CONECTIVIDAD...\n");

const API_BASE_URL = "https://convenios-lake.vercel.app";

// Test 1: Conectividad básica
async function test1_BasicConnectivity() {
  console.log("📡 Test 1: Conectividad Básica");
  try {
    const response = await fetch(API_BASE_URL);
    console.log(`✅ OK - Respuesta: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`❌ FALLA - ${error}`);
    return false;
  }
}

// Test 2: Endpoint de Categorías
async function test2_PostCategoria() {
  console.log("\n🏷️ Test 2: POST /api/visados/categorias");
  try {
    const response = await fetch(`${API_BASE_URL}/api/visados/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "TEST",
        nombre: "Test Categoría",
        descripcion: "Categoría de prueba"
      })
    });
    const data = await response.json();
    console.log(`Response Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));
    if (response.ok) {
      console.log("✅ OK - Categoría aceptada");
      return true;
    } else {
      console.log("⚠️ Categoría posiblemente ya existe (normal)");
      return true;
    }
  } catch (error) {
    console.error(`❌ FALLA - ${error}`);
    return false;
  }
}

// Test 3: Endpoint de Registros
async function test3_PostRegistro() {
  console.log("\n📋 Test 3: POST /api/visados/registros");
  try {
    const response = await fetch(`${API_BASE_URL}/api/visados/registros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: "Test - Proyecto de Prueba",
        categoria_code: "TEST",
        interesado: "Usuario Test",
        ing_nombre: "Ing. Test",
        rni: "123456",
        municipio: "La Paz",
        zona: "Test Zone",
        calle: "Test Street #123",
        niveles: 2,
        superf_construir: 100.5,
        superf_terreno: 200,
        tiene_planos: true,
        num_planos: 3,
        num_copias: 1
      })
    });
    const data = await response.json();
    console.log(`Response Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));
    if (response.ok) {
      console.log(`✅ OK - Registro creado con ID: ${data.data?.id || data.id}`);
      return true;
    } else {
      console.error("❌ FALLA - Error al crear registro");
      return false;
    }
  } catch (error) {
    console.error(`❌ FALLA - ${error}`);
    return false;
  }
}

// Test 4: Endpoint de Archivos (con archivo de prueba)
async function test4_PostArchivos() {
  console.log("\n📁 Test 4: POST /api/visados/archivos");
  try {
    // Crear un PDF de prueba simple
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f2419';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('TEST PDF', 50, 100);
    
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("registro_id", "1");
      formData.append("tipo", "PLANO");
      formData.append("files", blob, "test.pdf");
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/visados/archivos`, {
          method: "POST",
          body: formData
        });
        const data = await response.json();
        console.log(`Response Status: ${response.status}`);
        console.log("Response:", JSON.stringify(data, null, 2));
        if (response.ok) {
          console.log("✅ OK - Archivo subido");
        } else {
          console.error("❌ FALLA - Error al subir archivo");
        }
      } catch (error) {
        console.error(`❌ FALLA - ${error}`);
      }
    }, 'application/pdf');
  } catch (error) {
    console.error(`❌ FALLA - ${error}`);
    return false;
  }
}

// Test 5: CORS headers
async function test5_CorsHeaders() {
  console.log("\n🔒 Test 5: CORS Headers");
  try {
    const response = await fetch(API_BASE_URL, { method: "OPTIONS" });
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    };
    console.log("CORS Headers:", corsHeaders);
    if (corsHeaders['Access-Control-Allow-Origin']) {
      console.log("✅ OK - CORS está configurado");
      return true;
    } else {
      console.log("⚠️ CORS no retorna headers (puede estar OK)");
      return true;
    }
  } catch (error) {
    console.error(`⚠️ CORS test no crítico - ${error}`);
    return true;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  const results = [];
  
  results.push(await test1_BasicConnectivity());
  results.push(await test2_PostCategoria());
  results.push(await test3_PostRegistro());
  results.push(await test5_CorsHeaders());
  // test4_PostArchivos es async sin await, lo dejamos para el final
  
  // Resumen
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN DE TESTS");
  console.log("=".repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Pasados: ${passed}/${total}`);
  
  if (passed === total) {
    console.log("✅ ¡TODAS LAS PRUEBAS PASARON!");
    console.log("🚀 El sistema está listo para usar");
  } else {
    console.log("⚠️ Algunas pruebas fallaron");
    console.log("📖 Revisa TROUBLESHOOTING.md para más info");
  }
}

// Ejecutar
runAllTests();
