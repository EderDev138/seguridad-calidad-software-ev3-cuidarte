/**
 * =====================================================================
 * Cuidarte+ v1.2 · EP3 · Prueba de carga automatizada (k6)
 *
 * Herramienta: k6 (Grafana), ejecutada en contenedor.
 * Funcion en el plan: verificar los requisitos NO funcionales de
 * rendimiento y disponibilidad bajo la concurrencia que exige el ERS,
 * algo que ninguna prueba funcional puede demostrar.
 *
 * Umbrales del ERS verificados como `thresholds` de k6, de modo que la
 * prueba falle sola si se incumplen (no quedan a criterio del lector):
 *
 *   NFR-PERF-1  examenes de un paciente   p95 <=  300 ms
 *   NFR-PERF-2  listado de pacientes      p95 <= 2000 ms
 *   NFR-DIS-3   healthcheck               p95 <=  300 ms
 *   NFR-PERF-3  200 usuarios concurrentes
 *   NFR-DIS-1   tasa de error < 1 %
 *
 * DIMENSIONAMIENTO DE LA CARGA
 *
 * Cada usuario virtual ejecuta UNA peticion por segundo. Con 200 usuarios
 * eso son 12.000 peticiones/minuto, que es exactamente el supuesto con el
 * que se dimensiono el limitador general por IP (RATE_LIMIT_GENERAL =
 * 15.000). Una carga mayor mediria el limitador en vez del rendimiento de
 * la aplicacion, y los HTTP 429 resultantes se confundirian con fallos.
 *
 * No se ejecuta directamente: lo lanza `carga-k6.mjs`, que resuelve el
 * contenedor, la autenticacion y la escritura de la evidencia.
 * =====================================================================
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.API_BASE || 'http://host.docker.internal:3000/api/v1';
const TOKEN = __ENV.TOKEN || '';
const PACIENTE_ID = __ENV.PACIENTE_ID || '1';

export const options = {
  stages: [
    { duration: '10s', target: 200 },
    { duration: '30s', target: 200 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{escenario:listado}': ['p(95)<2000'],
    'http_req_duration{escenario:examenes}': ['p(95)<300'],
    'http_req_duration{escenario:salud}': ['p(95)<300'],
    'checks{escenario:listado}': ['rate>0.99'],
    'checks{escenario:examenes}': ['rate>0.99'],
    'checks{escenario:salud}': ['rate>0.99'],
  },
  summaryTrendStats: ['min', 'avg', 'med', 'p(95)', 'p(99)', 'max'],
};

const cabeceras = { Authorization: `Bearer ${TOKEN}` };

export default function () {
  // Una peticion por iteracion y un segundo de pausa: el perfil de un
  // usuario real operando la aplicacion, no una inundacion.
  const turno = __ITER % 3;

  if (turno === 0) {
    const r = http.get(`${BASE}/salud`, { tags: { escenario: 'salud' } });
    check(r, { 'salud responde 200': (x) => x.status === 200 }, { escenario: 'salud' });
  } else if (turno === 1) {
    const r = http.get(`${BASE}/pacientes`, {
      headers: cabeceras,
      tags: { escenario: 'listado' },
    });
    check(r, { 'listado responde 200': (x) => x.status === 200 }, { escenario: 'listado' });
  } else {
    const r = http.get(`${BASE}/pacientes/${PACIENTE_ID}/examenes`, {
      headers: cabeceras,
      tags: { escenario: 'examenes' },
    });
    check(r, { 'examenes responde 200': (x) => x.status === 200 }, { escenario: 'examenes' });
  }

  sleep(1);
}
