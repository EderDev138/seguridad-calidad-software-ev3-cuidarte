/**
 * =====================================================================
 * Cuidarte+ v1.2 · EP3 · Generador del diagrama de controles
 *
 * Produce la figura que el informe usa para el indicador IE3 (14 %):
 * la integracion de los controles de seguridad automatizados con el
 * cumplimiento normativo y legal.
 *
 * Se genera por script y no se dibuja a mano para que la figura sea
 * reproducible y se pueda corregir sin rehacerla: si cambia una puerta
 * de calidad, se edita aqui y se vuelve a generar.
 *
 * Uso:  node scripts/generar-diagrama.mjs
 * Salida: evidencias/v1.2/capturas/diagrama_controles.png (y .svg)
 * =====================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/*
 * Playwright se instala una sola vez, en `automatizacion/`. Esta carpeta lo
 * toma de alli en vez de duplicar la dependencia y el navegador descargado.
 */
async function cargarChromium() {
  try {
    return (await import('playwright')).chromium;
  } catch {
    const ruta = path.resolve(AQUI, '..', 'automatizacion', 'node_modules', 'playwright', 'index.mjs');
    if (!fs.existsSync(ruta)) {
      console.error('Falta Playwright. Ejecute `npm install` en la carpeta automatizacion/.');
      process.exit(2);
    }
    return (await import(pathToFileURL(ruta).href)).chromium;
  }
}

const chromium = await cargarChromium();
const SALIDA = path.resolve(AQUI, '..', 'evidencias', 'v1.2', 'capturas');
fs.mkdirSync(SALIDA, { recursive: true });

// --- Criterios normativos y su color en la figura ---------------------
const NORMAS = {
  datos: { color: '#1d4ed8', etiqueta: 'Ley 19.628 / 21.719 · datos personales sensibles de salud' },
  ciber: { color: '#b91c1c', etiqueta: 'Ley 21.663 · ciberseguridad e informacion de incidentes' },
  acceso: { color: '#047857', etiqueta: 'Ley 20.422 · accesibilidad universal (WCAG 2.1 AA)' },
  owasp: { color: '#b45309', etiqueta: 'OWASP Top 10 y ASVS · buenas practicas de la industria' },
  iso: { color: '#6d28d9', etiqueta: 'ISO/IEC 25010 y ISO/IEC/IEEE 29119 · calidad y pruebas' },
};

// --- Etapas del ciclo y las puertas automatizadas de cada una ---------
const ETAPAS = [
  {
    numero: '1',
    titulo: 'Codigo fuente',
    subtitulo: 'lo que se escribe',
    controles: [
      { texto: 'JWT 15 min + bcrypt costo 12', norma: 'ciber' },
      { texto: 'RBAC en el backend (RB-1 a RB-3)', norma: 'ciber' },
      { texto: 'Esquemas Zod estrictos', norma: 'owasp' },
      { texto: 'SQL parametrizado', norma: 'owasp' },
      { texto: 'Baja logica + auditoria', norma: 'datos' },
    ],
    puertas: [
      { texto: 'ESLint + plugin security (SAST)', norma: 'owasp' },
      { texto: 'ESLint jsx-a11y (accesibilidad)', norma: 'acceso' },
      { texto: 'Jest 132 pruebas + cobertura', norma: 'iso' },
      { texto: 'Cucumber 6 escenarios BDD', norma: 'iso' },
    ],
  },
  {
    numero: '2',
    titulo: 'Dependencias',
    subtitulo: 'lo que se hereda',
    controles: [
      { texto: 'Versiones fijadas en package.json', norma: 'iso' },
      { texto: 'package-lock.json versionado', norma: 'iso' },
    ],
    puertas: [
      { texto: 'npm audit produccion: 0 tolerancia', norma: 'ciber' },
      { texto: 'npm audit desarrollo: alta y critica', norma: 'ciber' },
    ],
  },
  {
    numero: '3',
    titulo: 'Imagen de contenedor',
    subtitulo: 'lo que se despliega',
    controles: [
      { texto: 'Build multi-stage sin codigo fuente', norma: 'owasp' },
      { texto: 'Usuario no privilegiado (uid 100)', norma: 'ciber' },
      { texto: 'no-new-privileges en compose', norma: 'ciber' },
    ],
    puertas: [
      { texto: 'Trivy: base del sistema operativo', norma: 'ciber' },
      { texto: 'Trivy: paquetes de la imagen', norma: 'ciber' },
    ],
  },
  {
    numero: '4',
    titulo: 'Ambiente en ejecucion',
    subtitulo: 'lo que el usuario recibe',
    controles: [
      { texto: 'Cabeceras helmet (API)', norma: 'owasp' },
      { texto: 'Cabeceras nginx en toda respuesta', norma: 'owasp' },
      { texto: 'Cache-Control: no-store', norma: 'datos' },
      { texto: 'CORS restringido por origen', norma: 'owasp' },
      { texto: 'Limitador por IP y por cuenta', norma: 'ciber' },
    ],
    puertas: [
      { texto: 'Sondas de seguridad: 29 casos', norma: 'ciber' },
      { texto: 'OWASP ZAP baseline (SPA y API)', norma: 'owasp' },
      { texto: 'Newman: 26 peticiones, 58 asserts', norma: 'iso' },
      { texto: 'Playwright: 7 casos de interfaz', norma: 'iso' },
      { texto: 'Lighthouse: accesibilidad 100 %', norma: 'acceso' },
      { texto: 'k6: 200 usuarios concurrentes', norma: 'iso' },
    ],
  },
  {
    numero: '5',
    titulo: 'Veredicto',
    subtitulo: 'lo que se autoriza',
    controles: [
      { texto: 'Trazabilidad caso -> requisito', norma: 'iso' },
      { texto: 'Evidencia con fecha y ejecutor', norma: 'iso' },
      { texto: 'Registro de auditoria consultable', norma: 'datos' },
    ],
    puertas: [
      { texto: 'Si una puerta falla, no se despliega', norma: 'iso' },
      { texto: 'Hallazgo abierto -> plan con plazo', norma: 'ciber' },
    ],
  },
];

// --- Geometria --------------------------------------------------------
const ANCHO = 1560;
const COL_ANCHO = 282;
const COL_GAP = 20;
const MARGEN_X = 24;
const Y_ETAPAS = 128;
const ALTO_CAJA = 34;
const GAP_CAJA = 7;

function columnaX(indice) {
  return MARGEN_X + indice * (COL_ANCHO + COL_GAP);
}

function cajas(items, x, yInicio) {
  return items
    .map((item, i) => {
      const y = yInicio + i * (ALTO_CAJA + GAP_CAJA);
      const color = NORMAS[item.norma].color;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${COL_ANCHO}" height="${ALTO_CAJA}" rx="5"
                fill="#ffffff" stroke="#d6dae1" stroke-width="1"/>
          <rect x="${x}" y="${y}" width="5" height="${ALTO_CAJA}" rx="2.5" fill="${color}"/>
          <text x="${x + 15}" y="${y + 22}" class="item">${item.texto}</text>
        </g>`;
    })
    .join('');
}

const columnas = ETAPAS.map((etapa, i) => {
  const x = columnaX(i);
  const yControles = Y_ETAPAS + 86;
  const yPuertasTitulo = yControles + etapa.controles.length * (ALTO_CAJA + GAP_CAJA) + 26;
  const yPuertas = yPuertasTitulo + 16;
  const alto = yPuertas + etapa.puertas.length * (ALTO_CAJA + GAP_CAJA) - Y_ETAPAS + 18;

  const flecha =
    i < ETAPAS.length - 1
      ? `<path d="M ${x + COL_ANCHO + 3} ${Y_ETAPAS + 34} l 13 0" stroke="#8a93a0"
                stroke-width="2" marker-end="url(#punta)"/>`
      : '';

  return `
    <g>
      <rect x="${x}" y="${Y_ETAPAS}" width="${COL_ANCHO}" height="${alto}" rx="10"
            fill="#f6f7f9" stroke="#c9ced6" stroke-width="1.2"/>
      <circle cx="${x + 26}" cy="${Y_ETAPAS + 32}" r="15" fill="#13344f"/>
      <text x="${x + 26}" y="${Y_ETAPAS + 38}" class="numero">${etapa.numero}</text>
      <text x="${x + 50}" y="${Y_ETAPAS + 29}" class="etapa">${etapa.titulo}</text>
      <text x="${x + 50}" y="${Y_ETAPAS + 46}" class="subetapa">${etapa.subtitulo}</text>

      <text x="${x + 12}" y="${yControles - 12}" class="rotulo">CONTROL EN EL PRODUCTO</text>
      ${cajas(etapa.controles, x + 12, yControles)}

      <text x="${x + 12}" y="${yPuertasTitulo + 4}" class="rotulo">PUERTA AUTOMATIZADA QUE LO VERIFICA</text>
      ${cajas(etapa.puertas, x + 12, yPuertas)}
      ${flecha}
    </g>`;
}).join('');

const alturaMaxima = Math.max(
  ...ETAPAS.map(
    (e) =>
      Y_ETAPAS +
      86 +
      e.controles.length * (ALTO_CAJA + GAP_CAJA) +
      42 +
      e.puertas.length * (ALTO_CAJA + GAP_CAJA),
  ),
);
const Y_LEYENDA = alturaMaxima + 44;
const ALTO = Y_LEYENDA + 200;

const leyenda = Object.values(NORMAS)
  .map((norma, i) => {
    const y = Y_LEYENDA + 62 + i * 24;
    return `
      <rect x="${MARGEN_X + 18}" y="${y - 11}" width="13" height="13" rx="3" fill="${norma.color}"/>
      <text x="${MARGEN_X + 40}" y="${y}" class="leyenda">${norma.etiqueta}</text>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}"
     viewBox="0 0 ${ANCHO} ${ALTO}" font-family="Arial, Helvetica, sans-serif">
  <defs>
    <marker id="punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7"
            orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8a93a0"/>
    </marker>
    <style>
      .titulo    { font-size: 27px; font-weight: bold; fill: #13344f; }
      .bajada    { font-size: 14.5px; fill: #4a5361; }
      .etapa     { font-size: 16px; font-weight: bold; fill: #13344f; }
      .subetapa  { font-size: 12px; fill: #6b7482; font-style: italic; }
      .numero    { font-size: 15px; font-weight: bold; fill: #ffffff; text-anchor: middle; }
      .rotulo    { font-size: 10.5px; font-weight: bold; fill: #6b7482; letter-spacing: 0.6px; }
      .item      { font-size: 12.5px; fill: #1f2733; }
      .leyenda   { font-size: 13px; fill: #1f2733; }
      .leytitulo { font-size: 13.5px; font-weight: bold; fill: #13344f; letter-spacing: 0.4px; }
      .pie       { font-size: 12px; fill: #6b7482; }
    </style>
  </defs>

  <rect width="${ANCHO}" height="${ALTO}" fill="#ffffff"/>

  <text x="${MARGEN_X}" y="44" class="titulo">
    Integracion de controles de seguridad automatizados · Cuidarte+ v1.2
  </text>
  <text x="${MARGEN_X}" y="70" class="bajada">
    Cada control del producto tiene una puerta automatizada que lo verifica, y cada puerta responde a un criterio normativo o legal.
  </text>
  <text x="${MARGEN_X}" y="92" class="bajada">
    El color de la barra izquierda indica el criterio que el control preserva. ISY1102 · Evaluacion Parcial N.º 3 · Caso B: Cuidarte+
  </text>

  ${columnas}

  <rect x="${MARGEN_X}" y="${Y_LEYENDA}" width="${ANCHO - MARGEN_X * 2}" height="${ALTO - Y_LEYENDA - 26}"
        rx="10" fill="#f6f7f9" stroke="#c9ced6" stroke-width="1.2"/>
  <text x="${MARGEN_X + 18}" y="${Y_LEYENDA + 24}" class="leytitulo">
    CRITERIO NORMATIVO Y LEGAL QUE CADA CONTROL PRESERVA
  </text>
  ${leyenda}

  <text x="${ANCHO - MARGEN_X}" y="${ALTO - 12}" class="pie" text-anchor="end">
    Generado con scripts/generar-diagrama.mjs · Eder Valdivia y Marcelo Morales · Seccion 003V
  </text>
</svg>`;

fs.writeFileSync(path.join(SALIDA, 'diagrama_controles.svg'), svg, 'utf8');

// --- Exportacion a PNG para insertarlo en el informe y las diapositivas
const navegador = await chromium.launch({ headless: true });
const pagina = await navegador.newPage({
  viewport: { width: ANCHO, height: ALTO },
  deviceScaleFactor: 2,
});
await pagina.setContent(
  `<html><body style="margin:0">${svg}</body></html>`,
  { waitUntil: 'load' },
);
await pagina.screenshot({ path: path.join(SALIDA, 'diagrama_controles.png') });
await navegador.close();

console.log(`Diagrama generado (${ANCHO} x ${ALTO} px, escala 2x):`);
console.log(`  ${path.join(SALIDA, 'diagrama_controles.png')}`);
console.log(`  ${path.join(SALIDA, 'diagrama_controles.svg')}`);
