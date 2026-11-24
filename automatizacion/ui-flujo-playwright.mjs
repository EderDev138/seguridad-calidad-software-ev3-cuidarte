/**
 * =====================================================================
 * Cuidarte+ v1.2 · EP3 · Automatizacion de pruebas funcionales de interfaz
 *
 * Herramienta: Playwright (navegador Chromium real, sin interfaz grafica).
 * Funcion en el plan: automatizar el recorrido de usuario de extremo a
 * extremo, que las pruebas de API no cubren porque no pasan por el
 * navegador: renderizado, navegacion por rol, formularios y foco.
 *
 * Casos cubiertos (trazabilidad al ERS):
 *   UI-01  RF-1.1  Inicio de sesion del administrador
 *   UI-02  RF-2.2  Listado de pacientes y busqueda
 *   UI-03  RF-4.1  Flujo escalonado paciente -> examenes (NFR-USAB-4)
 *   UI-04  RF-3.1  Registro de un examen nuevo
 *   UI-05  RF-5    El registro de auditoria refleja la accion anterior
 *   UI-06  NFR-SEG-4  El menu de auditoria no se ofrece al rol PACIENTE
 *   UI-07  RF-1.2  Cierre de sesion
 *
 * Uso:
 *   npm install
 *   npx playwright install chromium
 *   node ui-flujo-playwright.mjs
 *
 * Salida: ../evidencias/v1.2/automatizacion/Anexo_A1_playwright-ui.txt
 *         ../evidencias/v1.2/capturas/ui_*.png
 * =====================================================================
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const WEB = process.env.WEB ?? 'http://localhost:5173';
const CLAVE = process.env.CLAVE_QA ?? 'Cuidarte2026!';
const EVIDENCIA = path.resolve(AQUI, '..', 'evidencias', 'v1.2');
const SUFIJO = process.env.SUFIJO_EVIDENCIA ?? '';
const SALIDA = path.join(EVIDENCIA, 'automatizacion', `Anexo_A1_playwright-ui${SUFIJO}.txt`);
const CAPTURAS = path.join(EVIDENCIA, 'capturas');

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.mkdirSync(CAPTURAS, { recursive: true });

const lineas = [];
const casos = [];

function registrar(texto = '') {
  console.log(texto);
  lineas.push(texto);
}

function caso(id, requisito, titulo, paso, detalle) {
  casos.push({ id, requisito, titulo, paso, detalle });
  registrar(`${paso ? '[ OK ]' : '[FALLA]'} ${id}  ${titulo}`);
  if (detalle) registrar(`        ${detalle}`);
}

const inicio = Date.now();
registrar('=====================================================================');
registrar('Cuidarte+ v1.2 · EP3 · Pruebas funcionales de interfaz (Playwright)');
registrar('=====================================================================');
registrar(`Fecha de ejecucion : ${new Date().toISOString()}`);
registrar(`Ejecutor           : ${process.env.EJECUTOR ?? 'no declarado'}`);
registrar(`SPA bajo prueba    : ${WEB}`);
registrar(`Node               : ${process.version}`);
registrar('=====================================================================');
registrar();

const navegador = await chromium.launch({ headless: true });
const contexto = await navegador.newContext({ viewport: { width: 1366, height: 900 } });
const pagina = await contexto.newPage();

// Los errores de consola del navegador son parte de la evidencia: un error de
// CSP o de red aparece aqui y no en el resultado funcional.
const erroresConsola = [];
pagina.on('console', (mensaje) => {
  if (mensaje.type() === 'error') erroresConsola.push(mensaje.text());
});

const tipoExamen = `Hemograma de control EP3 ${new Date().toISOString().slice(11, 19)}`;

try {
  // --- UI-01 Inicio de sesion ---------------------------------------
  await pagina.goto(WEB, { waitUntil: 'domcontentloaded' });
  await pagina.waitForSelector('#nombreUsuario', { timeout: 20000 });
  await pagina.screenshot({ path: path.join(CAPTURAS, `ui_01_acceso${SUFIJO}.png`), fullPage: true });

  await pagina.fill('#nombreUsuario', 'admin1');
  await pagina.fill('#password', CLAVE);
  await pagina.click('button[type="submit"]');

  await pagina.waitForSelector('#titulo-pacientes', { timeout: 20000 });
  const identidad = await pagina.locator('.cabecera__sesion').first().innerText();
  caso('UI-01', 'RF-1.1', 'Inicio de sesion del administrador', true, `cabecera: ${identidad.replace(/\s+/g, ' ').trim()}`);

  // --- UI-02 Listado y busqueda -------------------------------------
  const filasIniciales = await pagina.locator('table.tabla tbody tr').count();
  await pagina.fill('#busqueda-paciente', 'Perez');
  await pagina.waitForTimeout(300);
  const filasFiltradas = await pagina.locator('table.tabla tbody tr').count();
  await pagina.screenshot({ path: path.join(CAPTURAS, `ui_02_pacientes${SUFIJO}.png`), fullPage: true });
  caso(
    'UI-02',
    'RF-2.2',
    'Listado de pacientes y filtro de busqueda',
    filasIniciales > 0 && filasFiltradas > 0 && filasFiltradas <= filasIniciales,
    `${filasIniciales} fichas en el listado, ${filasFiltradas} tras filtrar por "Perez"`,
  );

  // --- UI-03 Flujo escalonado paciente -> examenes -------------------
  await pagina.locator('table.tabla tbody tr button', { hasText: 'Ver examenes' }).first().click();
  await pagina.waitForSelector('#titulo-examenes', { timeout: 20000 });
  const tituloExamenes = await pagina.locator('#titulo-examenes').innerText();
  await pagina.screenshot({ path: path.join(CAPTURAS, `ui_03_examenes${SUFIJO}.png`), fullPage: true });
  caso('UI-03', 'RF-4.1', 'Flujo escalonado paciente -> examenes (NFR-USAB-4)', true, `seccion: ${tituloExamenes.replace(/\s+/g, ' ').trim()}`);

  // --- UI-04 Registro de un examen nuevo -----------------------------
  await pagina.getByLabel(/tipo/i).first().fill(tipoExamen);
  const descripcion = pagina.getByLabel(/descripcion/i).first();
  if (await descripcion.count()) {
    await descripcion.fill('Examen creado por la automatizacion de la EP3.');
  }
  await pagina.getByRole('button', { name: /registrar/i }).first().click();
  await pagina.waitForSelector(`text=${tipoExamen}`, { timeout: 20000 });
  await pagina.screenshot({ path: path.join(CAPTURAS, `ui_04_examen-creado${SUFIJO}.png`), fullPage: true });
  caso('UI-04', 'RF-3.1', 'Registro de un examen nuevo desde la interfaz', true, `examen "${tipoExamen}" visible en la ficha`);

  // --- UI-05 Auditoria refleja la accion -----------------------------
  await pagina.getByRole('button', { name: 'Auditoria', exact: true }).first().click();
  await pagina.waitForSelector('#titulo-auditoria', { timeout: 20000 });
  await pagina.waitForTimeout(500);
  const textoAuditoria = await pagina.locator('#titulo-auditoria').locator('..').innerText();
  const registraCreacion = /CREAR|CREACION|EXAMEN/i.test(textoAuditoria);
  await pagina.screenshot({ path: path.join(CAPTURAS, `ui_05_auditoria${SUFIJO}.png`), fullPage: true });
  caso('UI-05', 'RF-5', 'El registro de auditoria contiene la accion ejecutada', registraCreacion, registraCreacion ? 'la tabla de auditoria incluye la creacion del examen' : 'no se encontro el registro de la creacion');

  // --- UI-07 Cierre de sesion ---------------------------------------
  await pagina.getByRole('button', { name: /cerrar sesion/i }).first().click();
  await pagina.waitForSelector('#nombreUsuario', { timeout: 20000 });
  caso('UI-07', 'RF-1.2', 'Cierre de sesion devuelve a la pantalla de acceso', true, 'formulario de acceso visible tras cerrar sesion');

  // --- UI-06 El rol PACIENTE no recibe el menu de auditoria ----------
  await pagina.fill('#nombreUsuario', 'paciente1');
  await pagina.fill('#password', CLAVE);
  await pagina.click('button[type="submit"]');
  await pagina.waitForSelector('#titulo-pacientes', { timeout: 20000 });
  const menuAuditoria = await pagina.getByRole('button', { name: 'Auditoria', exact: true }).count();
  const fichasPaciente = await pagina.locator('table.tabla tbody tr').count();
  await pagina.screenshot({ path: path.join(CAPTURAS, `ui_06_paciente${SUFIJO}.png`), fullPage: true });
  caso(
    'UI-06',
    'NFR-SEG-4',
    'El rol PACIENTE no ve el menu de auditoria y solo su propia ficha',
    menuAuditoria === 0 && fichasPaciente === 1,
    `menu de auditoria: ${menuAuditoria === 0 ? 'ausente' : 'PRESENTE'} · fichas visibles: ${fichasPaciente}`,
  );
} catch (error) {
  caso('UI-FALLO', '—', 'Excepcion durante la ejecucion', false, error.message);
  await pagina
    .screenshot({ path: path.join(CAPTURAS, `ui_99_fallo${SUFIJO}.png`), fullPage: true })
    .catch(() => null);
} finally {
  await navegador.close();
}

// =====================================================================
// Resumen y medicion de eficiencia (IE5 / IE6)
// =====================================================================
const duracionMs = Date.now() - inicio;
const total = casos.length;
const pasaron = casos.filter((c) => c.paso).length;

registrar();
registrar('=====================================================================');
registrar('RESUMEN DE LA EJECUCION AUTOMATIZADA DE INTERFAZ');
registrar('=====================================================================');
registrar('ID         REQUISITO    RESULTADO  CASO');
registrar('---------  -----------  ---------  --------------------------------');
for (const c of casos) {
  registrar(
    `${c.id.padEnd(9)}  ${c.requisito.padEnd(11)}  ${(c.paso ? 'APRUEBA' : 'FALLA').padEnd(9)}  ${c.titulo}`,
  );
}
registrar('---------  -----------  ---------  --------------------------------');
registrar(`Total: ${total} casos · aprueban ${pasaron} · fallan ${total - pasaron}`);
registrar(`Duracion de la ejecucion automatizada: ${(duracionMs / 1000).toFixed(1)} s`);
registrar(
  `Equivalente manual estimado: ${total} casos x 90 s de operacion humana = ${((total * 90) / 60).toFixed(1)} min`,
);
registrar(
  `Reduccion de tiempo: ${(((total * 90000 - duracionMs) / (total * 90000)) * 100).toFixed(1)} %`,
);
registrar(`Errores de consola del navegador: ${erroresConsola.length}`);
for (const error of erroresConsola.slice(0, 10)) registrar(`  - ${error}`);
registrar('=====================================================================');

fs.writeFileSync(SALIDA, lineas.join('\n') + '\n', 'utf8');
console.log(`\nEvidencia escrita en ${SALIDA}`);
process.exitCode = pasaron === total ? 0 : 1;
