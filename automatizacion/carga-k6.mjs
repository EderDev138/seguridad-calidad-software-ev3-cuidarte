/**
 * =====================================================================
 * Cuidarte+ v1.2 · EP3 · Lanzador de la prueba de carga (k6)
 *
 * Resuelve lo que el script de k6 no puede resolver por si mismo:
 *   1. Obtiene un token valido y el identificador de un paciente real,
 *      para que la carga se ejecute contra datos existentes y no mida
 *      una sucesion de 404.
 *   2. Lanza k6 en contenedor (sin instalarlo en el equipo).
 *   3. Guarda la salida con el encabezado de trazabilidad del informe.
 *
 * Uso:  npm run carga
 * Salida: ../evidencias/v1.2/automatizacion/Anexo_A4_k6-carga.txt
 * =====================================================================
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API ?? 'http://localhost:3000/api/v1';
const API_CONTENEDOR = process.env.API_BASE ?? 'http://host.docker.internal:3000/api/v1';
const CLAVE = process.env.CLAVE_QA ?? 'Cuidarte2026!';
const SALIDA_DIR = path.resolve(AQUI, '..', 'evidencias', 'v1.2', 'automatizacion');
const SUFIJO = process.env.SUFIJO_EVIDENCIA ?? '';
const SALIDA = path.join(SALIDA_DIR, `Anexo_A4_k6-carga${SUFIJO}.txt`);

fs.mkdirSync(SALIDA_DIR, { recursive: true });

// --- 1. Datos de la corrida -------------------------------------------
const sesion = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombreUsuario: 'admin1', password: CLAVE }),
}).then((r) => r.json());

if (!sesion?.token) {
  console.error('No fue posible autenticar a admin1. Levante el ambiente y cargue la semilla.');
  console.error('Si el servidor responde 429, ejecute ../seguridad/desbloquear-usuarios.sh');
  process.exit(2);
}

const pacientes = await fetch(`${API}/pacientes`, {
  headers: { Authorization: `Bearer ${sesion.token}` },
}).then((r) => r.json());
const pacienteId = Array.isArray(pacientes) && pacientes.length > 0 ? pacientes[0].id : 1;

// --- 2. Ejecucion de k6 en contenedor ---------------------------------
const encabezado = [
  '=====================================================================',
  'Cuidarte+ v1.2 · EP3 · Anexo A4 · Prueba de carga automatizada',
  'Herramienta: k6 (Grafana), ejecutada en contenedor',
  'Enfoque: prueba NO funcional de rendimiento y disponibilidad',
  `Fecha de ejecucion : ${new Date().toISOString()}`,
  `Ejecutor           : ${process.env.EJECUTOR ?? 'no declarado'}`,
  `API bajo prueba    : ${API_CONTENEDOR}`,
  `Paciente de prueba : id ${pacienteId}`,
  'Umbrales del ERS   : NFR-PERF-1 p95<=300ms · NFR-PERF-2 p95<=2000ms',
  '                     NFR-DIS-3 p95<=300ms · NFR-DIS-1 errores<1%',
  'Concurrencia       : 200 usuarios (NFR-PERF-3), 1 peticion/segundo cada uno',
  '=====================================================================',
  '',
].join('\n');

console.log(encabezado);

const argumentos = [
  'run',
  '--rm',
  '-i',
  '--add-host=host.docker.internal:host-gateway',
  '-e',
  `API_BASE=${API_CONTENEDOR}`,
  '-e',
  `TOKEN=${sesion.token}`,
  '-e',
  `PACIENTE_ID=${pacienteId}`,
  'grafana/k6:latest',
  'run',
  '-',
];

const guion = fs.readFileSync(path.join(AQUI, 'carga-k6.js'), 'utf8');
const proceso = spawnSync('docker', argumentos, {
  input: guion,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

const salida = `${proceso.stdout ?? ''}${proceso.stderr ?? ''}`;
console.log(salida);

const veredicto = [
  '',
  '=====================================================================',
  `Codigo de salida de k6: ${proceso.status}`,
  'Nota: k6 devuelve 99 cuando algun umbral (threshold) no se cumple. Eso no',
  'es un fallo de ejecucion: es el resultado de la prueba, y como tal se',
  'documenta en el informe.',
  '=====================================================================',
].join('\n');

console.log(veredicto);
fs.writeFileSync(SALIDA, encabezado + salida + veredicto + '\n', 'utf8');
console.log(`\nEvidencia escrita en ${SALIDA}`);
process.exitCode = proceso.status === 0 ? 0 : 1;
