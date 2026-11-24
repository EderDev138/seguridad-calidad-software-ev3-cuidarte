/**
 * =====================================================================
 * Cuidarte+ v1.2 · EP3 · Automatizacion de pruebas NO funcionales
 *
 * Herramienta: Lighthouse (motor de auditoria de Google sobre Chromium).
 * Funcion en el plan: medir de forma automatizada los atributos de calidad
 * que no se expresan como caso funcional —rendimiento percibido,
 * accesibilidad y buenas practicas— sobre la pantalla real servida por
 * nginx, no sobre el codigo fuente.
 *
 * Por que importa en esta evaluacion:
 *   - Accesibilidad  -> Ley 20.422 y WCAG 2.1 AA (NFR-USAB-1 a NFR-USAB-3).
 *   - Rendimiento    -> NFR-PERF-1 (respuesta percibida por el usuario).
 *   - Buenas practicas -> incluye comprobaciones de seguridad del navegador.
 *
 * Umbrales declarados (si alguno no se cumple, el script devuelve 1):
 *   accesibilidad >= 0,90 · buenas practicas >= 0,90 · rendimiento >= 0,80
 *
 * Uso:
 *   npm install
 *   npm run nofuncional
 *
 * Salida: ../evidencias/v1.2/automatizacion/Anexo_A3_lighthouse.txt
 *         ../evidencias/v1.2/automatizacion/lighthouse-spa.html
 * =====================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const WEB = process.env.WEB ?? 'http://localhost:5173';
const SALIDA_DIR = path.resolve(AQUI, '..', 'evidencias', 'v1.2', 'automatizacion');
const SUFIJO = process.env.SUFIJO_EVIDENCIA ?? '';
const SALIDA = path.join(SALIDA_DIR, `Anexo_A3_lighthouse${SUFIJO}.txt`);

const UMBRALES = {
  accessibility: 0.9,
  'best-practices': 0.9,
  performance: 0.8,
};

const NOMBRE = {
  performance: 'Rendimiento',
  accessibility: 'Accesibilidad',
  'best-practices': 'Buenas practicas',
  seo: 'SEO',
};

fs.mkdirSync(SALIDA_DIR, { recursive: true });

const lineas = [];
const registrar = (texto = '') => {
  console.log(texto);
  lineas.push(texto);
};

/**
 * Chromium con el que se ejecuta la auditoria.
 *
 * Se reutiliza el navegador que Playwright ya descargo para las pruebas de
 * interfaz: asi la evidencia no depende de que el equipo tenga Chrome
 * instalado ni de su version, que cambiaria los resultados entre corridas.
 */
async function rutaDeChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    const { chromium } = await import('playwright');
    const ruta = chromium.executablePath();
    if (ruta && fs.existsSync(ruta)) return ruta;
  } catch {
    // Playwright no instalado: se deja que chrome-launcher busque Chrome.
  }
  return undefined;
}

const inicio = Date.now();
registrar('=====================================================================');
registrar('Cuidarte+ v1.2 · EP3 · Pruebas no funcionales automatizadas (Lighthouse)');
registrar('=====================================================================');
registrar(`Fecha de ejecucion : ${new Date().toISOString()}`);
registrar(`Ejecutor           : ${process.env.EJECUTOR ?? 'no declarado'}`);
registrar(`Pantalla auditada  : ${WEB}`);
registrar(`Node               : ${process.version}`);
registrar('Categorias: rendimiento · accesibilidad · buenas practicas · SEO');
registrar('=====================================================================');
registrar();

const chromePath = await rutaDeChrome();
const chrome = await chromeLauncher.launch({
  chromePath,
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

let resultado;
try {
  resultado = await lighthouse(
    WEB,
    { port: chrome.port, output: ['html', 'json'], logLevel: 'error' },
    {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        screenEmulation: { mobile: false, width: 1366, height: 900, deviceScaleFactor: 1, disabled: false },
        throttling: { rttMs: 40, throughputKbps: 10 * 1024, cpuSlowdownMultiplier: 1 },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
  );
} finally {
  await chrome.kill();
}

const lhr = resultado.lhr;
fs.writeFileSync(path.join(SALIDA_DIR, `lighthouse-spa${SUFIJO}.html`), resultado.report[0], 'utf8');
fs.writeFileSync(path.join(SALIDA_DIR, `lighthouse-spa${SUFIJO}.json`), resultado.report[1], 'utf8');

// --- Puntajes por categoria -------------------------------------------
registrar('--- Puntajes por categoria ------------------------------------------');
registrar('CATEGORIA            PUNTAJE  UMBRAL   RESULTADO');
registrar('-------------------  -------  -------  ---------');
let incumplidos = 0;
for (const [clave, categoria] of Object.entries(lhr.categories)) {
  const puntaje = categoria.score ?? 0;
  const umbral = UMBRALES[clave];
  const cumple = umbral === undefined || puntaje >= umbral;
  if (!cumple) incumplidos += 1;
  registrar(
    `${(NOMBRE[clave] ?? clave).padEnd(19)}  ${String(Math.round(puntaje * 100)).padStart(5)}%  ${
      umbral === undefined ? '    —  ' : `${String(Math.round(umbral * 100)).padStart(5)}%  `
    }  ${umbral === undefined ? 'informativo' : cumple ? 'CUMPLE' : 'NO CUMPLE'}`,
  );
}
registrar();

// --- Metricas de rendimiento ------------------------------------------
registrar('--- Metricas de rendimiento percibido -------------------------------');
const METRICAS = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'speed-index',
  'total-blocking-time',
  'cumulative-layout-shift',
  'interactive',
];
for (const clave of METRICAS) {
  const auditoria = lhr.audits[clave];
  if (auditoria) {
    registrar(`${auditoria.title.padEnd(42)} ${String(auditoria.displayValue ?? '—').padStart(10)}`);
  }
}
registrar();

// --- Accesibilidad: detalle de lo que se verifico ---------------------
const auditoriasA11y = lhr.categories.accessibility.auditRefs
  .map((ref) => lhr.audits[ref.id])
  .filter((a) => a && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual');
const a11yAprobadas = auditoriasA11y.filter((a) => a.score === 1);
const a11yFallidas = auditoriasA11y.filter((a) => a.score !== null && a.score < 1);

registrar('--- Accesibilidad (Ley 20.422 · WCAG 2.1 AA) -------------------------');
registrar(`Comprobaciones aplicables : ${auditoriasA11y.length}`);
registrar(`Aprobadas                 : ${a11yAprobadas.length}`);
registrar(`Con hallazgos             : ${a11yFallidas.length}`);
if (a11yFallidas.length > 0) {
  registrar();
  registrar('Hallazgos de accesibilidad:');
  for (const a of a11yFallidas) {
    registrar(`  - ${a.title}`);
    if (a.description) registrar(`      ${a.description.split('[')[0].trim()}`);
  }
} else {
  registrar('Sin hallazgos: todas las comprobaciones automatizables se aprueban.');
}
registrar();

// --- Buenas practicas: incluye comprobaciones de seguridad -------------
const auditoriasBP = lhr.categories['best-practices'].auditRefs
  .map((ref) => lhr.audits[ref.id])
  .filter((a) => a && a.score !== null && a.score < 1);
registrar('--- Buenas practicas con hallazgos -----------------------------------');
if (auditoriasBP.length === 0) {
  registrar('Sin hallazgos.');
} else {
  for (const a of auditoriasBP) registrar(`  - ${a.title}`);
}
registrar();

const duracion = ((Date.now() - inicio) / 1000).toFixed(1);
registrar('=====================================================================');
registrar(
  `Resultado: ${incumplidos === 0 ? 'todos los umbrales se cumplen' : `${incumplidos} umbral(es) no se cumplen`}`,
);
registrar(`Duracion de la auditoria automatizada: ${duracion} s`);
registrar('Equivalente manual: una revision de accesibilidad punto por punto');
registrar(`sobre ${auditoriasA11y.length} criterios toma del orden de 2 a 3 horas de trabajo.`);
registrar(`Informe navegable: ${path.join(SALIDA_DIR, 'lighthouse-spa.html')}`);
registrar('=====================================================================');

fs.writeFileSync(SALIDA, lineas.join('\n') + '\n', 'utf8');
console.log(`\nEvidencia escrita en ${SALIDA}`);
process.exitCode = incumplidos === 0 ? 0 : 1;
