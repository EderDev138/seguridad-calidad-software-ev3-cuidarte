/**
 * =====================================================================
 * Cuidarte+ v1.2 · EP3 · Sondas de pruebas de seguridad
 *
 * Ejecuta las pruebas de seguridad que la guia de la EP3 exige verificar
 * "segun la funcion de cada enfoque":
 *
 *   A. Autenticacion y gestion de sesion      (OWASP A07)
 *   B. Control de acceso y autorizacion       (OWASP A01)
 *   C. Validacion y sanitizacion de entradas  (OWASP A03 — SQLi, XSS, CSRF)
 *   D. Configuracion y exposicion de informacion (OWASP A05)
 *
 * Cada sonda es una prueba NEGATIVA o de control: declara el resultado
 * que la aplicacion DEBE dar y falla si lo obtenido difiere. El valor de
 * la evidencia esta en que es ejecutable: cualquiera puede volver a
 * correrla y obtener la misma tabla.
 *
 * Uso:
 *   node sondas-seguridad.mjs                 # ambiente por defecto
 *   API=http://localhost:3000/api/v1 node sondas-seguridad.mjs
 *
 * Salida: ../evidencias/v1.2/seguridad/Anexo_S1_sondas-seguridad.txt
 * Codigo de salida: 0 si todas las sondas pasan, 1 si alguna falla.
 * =====================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API ?? 'http://localhost:3000/api/v1';
const WEB = process.env.WEB ?? 'http://localhost:5173';
const CLAVE = process.env.CLAVE_QA ?? 'Cuidarte2026!';
const SALIDA = path.resolve(
  AQUI,
  '..',
  'evidencias',
  'v1.2',
  'seguridad',
  process.env.SALIDA ?? 'Anexo_S1_sondas-seguridad.txt',
);

const lineas = [];
const resultados = [];

function registrar(texto = '') {
  console.log(texto);
  lineas.push(texto);
}

/**
 * Registra el resultado de una sonda.
 *
 * @param {string} id       identificador del caso (SEG-A1, SEG-C3, ...)
 * @param {string} enfoque  enfoque de prueba al que pertenece
 * @param {string} titulo   que se verifica
 * @param {string} esperado resultado que exige el requisito
 * @param {string} obtenido resultado real de la ejecucion
 * @param {boolean} paso    si obtenido satisface a esperado
 */
function sonda(id, enfoque, titulo, esperado, obtenido, paso) {
  resultados.push({ id, enfoque, titulo, esperado, obtenido, paso });
  registrar(`${paso ? '[ OK ]' : '[FALLA]'} ${id}  ${titulo}`);
  registrar(`        esperado: ${esperado}`);
  registrar(`        obtenido: ${obtenido}`);
}

/** Peticion HTTP que nunca lanza: devuelve estado, cabeceras y cuerpo. */
async function pedir(url, opciones = {}) {
  try {
    const respuesta = await fetch(url, { redirect: 'manual', ...opciones });
    const texto = await respuesta.text();
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch {
      json = null;
    }
    return {
      estado: respuesta.status,
      cabeceras: respuesta.headers,
      texto,
      json,
    };
  } catch (error) {
    return { estado: 0, cabeceras: new Headers(), texto: String(error.message), json: null };
  }
}

const json = (cuerpo) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo),
});

const conToken = (token, extra = {}) => ({
  ...extra,
  headers: { Authorization: `Bearer ${token}`, ...(extra.headers ?? {}) },
});

async function iniciarSesion(nombreUsuario, password = CLAVE) {
  const r = await pedir(`${API}/auth/login`, json({ nombreUsuario, password }));
  return { estado: r.estado, token: r.json?.token ?? null, cuerpo: r.json };
}

// =====================================================================
// Encabezado de trazabilidad
// =====================================================================
const inicio = Date.now();
registrar('=====================================================================');
registrar('Cuidarte+ v1.2 · EP3 · Pruebas de seguridad ejecutadas (sondas)');
registrar('=====================================================================');
registrar(`Fecha de ejecucion : ${new Date().toISOString()}`);
registrar(`Ejecutor           : ${process.env.EJECUTOR ?? 'no declarado'}`);
registrar(`API bajo prueba    : ${API}`);
registrar(`SPA bajo prueba    : ${WEB}`);
registrar(`Node               : ${process.version}`);
registrar('Enfoques: A autenticacion/sesion · B control de acceso ·');
registrar('          C validacion de entradas · D configuracion y exposicion');
registrar('=====================================================================');
registrar();

// --- Sesiones de trabajo ---------------------------------------------
const admin = await iniciarSesion('admin1');
const medico = await iniciarSesion('medico1');
const paciente = await iniciarSesion('paciente1');

if (!admin.token || !paciente.token) {
  registrar('ABORTADO: no fue posible autenticar a los usuarios de prueba.');
  registrar(`  admin1   -> HTTP ${admin.estado}`);
  registrar(`  paciente1 -> HTTP ${paciente.estado}`);
  registrar('Verifique que el ambiente este levantado y la semilla cargada:');
  registrar('  docker compose up -d --build');
  registrar('  docker compose --profile semilla run --rm semilla');
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, lineas.join('\n') + '\n', 'utf8');
  process.exit(2);
}

// =====================================================================
// A. Autenticacion y gestion de sesion · OWASP A07 · NFR-SEG-9, SEG-11
// =====================================================================
registrar('--- A. Autenticacion y gestion de sesion -----------------------------');

sonda(
  'SEG-A1',
  'Autenticacion',
  'Credencial valida devuelve sesion con token firmado',
  'HTTP 200 y token presente',
  `HTTP ${admin.estado}, token ${admin.token ? 'presente' : 'ausente'}`,
  admin.estado === 200 && Boolean(admin.token),
);

const claveMala = await iniciarSesion('admin1', 'ClaveQueNoCorresponde1!');
const mensajeMalo = claveMala.cuerpo?.mensaje ?? '';
const usuarioInexistente = await iniciarSesion('no.existe.jamas', 'ClaveQueNoCorresponde1!');
sonda(
  'SEG-A2',
  'Autenticacion',
  'Credencial invalida se rechaza sin revelar si el usuario existe',
  'HTTP 401 y el mismo mensaje para usuario inexistente',
  `HTTP ${claveMala.estado} / ${usuarioInexistente.estado}; mensaje "${mensajeMalo}"`,
  claveMala.estado === 401 &&
    usuarioInexistente.estado === 401 &&
    mensajeMalo === (usuarioInexistente.cuerpo?.mensaje ?? ''),
);

const sinToken = await pedir(`${API}/pacientes`);
sonda(
  'SEG-A3',
  'Autenticacion',
  'Recurso protegido exige sesion',
  'HTTP 401 sin cabecera Authorization',
  `HTTP ${sinToken.estado}`,
  sinToken.estado === 401,
);

const partes = admin.token.split('.');
const tokenAlterado = `${partes[0]}.${partes[1]}.${'A'.repeat(partes[2].length)}`;
const firmaMala = await pedir(`${API}/pacientes`, conToken(tokenAlterado));
sonda(
  'SEG-A4',
  'Autenticacion',
  'Token con firma alterada se rechaza',
  'HTTP 401 al manipular la firma del JWT',
  `HTTP ${firmaMala.estado}`,
  firmaMala.estado === 401,
);

// Sesion desechable para no invalidar la del resto de las sondas.
const desechable = await iniciarSesion('medico2');
const antesLogout = await pedir(`${API}/auth/yo`, conToken(desechable.token));
await pedir(`${API}/auth/logout`, conToken(desechable.token, { method: 'POST' }));
const despuesLogout = await pedir(`${API}/auth/yo`, conToken(desechable.token));
sonda(
  'SEG-A5',
  'Sesion',
  'El cierre de sesion revoca el token emitido (RF-1.2)',
  'HTTP 200 antes del logout y 401 al reutilizar el mismo token',
  `antes HTTP ${antesLogout.estado}, despues HTTP ${despuesLogout.estado}`,
  antesLogout.estado === 200 && despuesLogout.estado === 401,
);

/*
 * Sonda de fuerza bruta (SEG-A6).
 *
 * Dos razones para que se ejecute AL FINAL y sobre una cuenta propia:
 *
 *  1. El bloqueo por intentos fallidos (RF-1.3) es por CUENTA y persiste en la
 *     base de datos durante LOGIN_MINUTOS_BLOQUEO. Si la sonda atacara a
 *     `admin1`, dejaria inutilizable al usuario que el resto de las sondas
 *     necesita, y reiniciar el contenedor no lo desbloquearia.
 *  2. El limitador de /auth/login (NFR-SEG-11) es por IP y su ventana es de
 *     15 minutos, de modo que cualquier inicio de sesion posterior recibiria
 *     429 y ese 429 se confundiria con un fallo de la aplicacion.
 *
 * La cuenta atacada la crea la propia sonda por autorregistro, con rol
 * PACIENTE y sin ficha asociada: queda bloqueada y no afecta a nada mas.
 * La tabla de resumen se ordena por ID para que el informe la lea en su
 * posicion logica dentro del enfoque A.
 */
async function sondaFuerzaBruta() {
  const usuarioSenuelo = `sonda.bruta.${Date.now()}`;
  const registro = await pedir(
    `${API}/auth/registro`,
    json({
      nombreUsuario: usuarioSenuelo,
      email: `${usuarioSenuelo}@prueba.test`,
      password: 'ClaveSenueloEP3-2026!',
    }),
  );
  if (registro.estado !== 201) {
    sonda(
      'SEG-A6',
      'Sesion',
      'El limitador de peticiones frena la fuerza bruta (NFR-SEG-11, RF-1.3)',
      'cuenta senuelo creada y bloqueada tras los intentos fallidos',
      `no se pudo crear la cuenta senuelo (HTTP ${registro.estado})`,
      false,
    );
    return;
  }

  const estados = [];
  for (let intento = 1; intento <= 14; intento += 1) {
    const r = await pedir(
      `${API}/auth/login`,
      json({ nombreUsuario: usuarioSenuelo, password: `clave.incorrecta.${intento}` }),
    );
    estados.push(r.estado);
    if (r.estado === 429) break;
  }

  // Con la cuenta ya bloqueada, la credencial CORRECTA tambien debe rebotar:
  // eso distingue un bloqueo real de un simple rechazo de credencial.
  const conClaveBuena = await pedir(
    `${API}/auth/login`,
    json({ nombreUsuario: usuarioSenuelo, password: 'ClaveSenueloEP3-2026!' }),
  );

  sonda(
    'SEG-A6',
    'Sesion',
    'El limitador de peticiones frena la fuerza bruta (NFR-SEG-11, RF-1.3)',
    'HTTP 429 antes de 14 intentos y la cuenta queda bloqueada incluso con la clave correcta',
    `secuencia ${estados.join(',')} · con clave correcta HTTP ${conClaveBuena.estado}`,
    estados.includes(429) && conClaveBuena.estado === 429,
  );
}

registrar();

// =====================================================================
// B. Control de acceso y autorizacion · OWASP A01 · NFR-SEG-4, RB-1 a RB-3
// =====================================================================
registrar('--- B. Control de acceso y autorizacion ------------------------------');

const auditoriaPaciente = await pedir(`${API}/auditoria`, conToken(paciente.token));
sonda(
  'SEG-B1',
  'Control de acceso',
  'Un paciente no accede al registro de auditoria (RF-5)',
  'HTTP 403',
  `HTTP ${auditoriaPaciente.estado}`,
  auditoriaPaciente.estado === 403,
);

const escribirPaciente = await pedir(
  `${API}/pacientes`,
  conToken(paciente.token, json({ rut: '15181064-2', nombres: 'Intruso', apellidos: 'Prueba' })),
);
sonda(
  'SEG-B2',
  'Control de acceso',
  'Un paciente no crea fichas clinicas (RB-2)',
  'HTTP 403',
  `HTTP ${escribirPaciente.estado}`,
  escribirPaciente.estado === 403,
);

// El control se aplica en el backend, no solo en la interfaz: se prueba con
// la API directa y no a traves de la SPA.
const fichasAdmin = await pedir(`${API}/pacientes`, conToken(admin.token));
const fichasPaciente = await pedir(`${API}/pacientes`, conToken(paciente.token));
const totalAdmin = Array.isArray(fichasAdmin.json) ? fichasAdmin.json.length : -1;
const totalPaciente = Array.isArray(fichasPaciente.json) ? fichasPaciente.json.length : -1;
sonda(
  'SEG-B3',
  'Control de acceso',
  'El listado de pacientes se filtra por titularidad (RB-1)',
  'el administrador ve todas las fichas y el paciente solo la suya (1)',
  `admin ${totalAdmin} fichas, paciente ${totalPaciente} ficha(s)`,
  totalAdmin > 1 && totalPaciente === 1,
);

// IDOR: el paciente pide una ficha que no es la suya.
const propias = Array.isArray(fichasPaciente.json) ? fichasPaciente.json.map((f) => f.id) : [];
const ajena = (Array.isArray(fichasAdmin.json) ? fichasAdmin.json : []).find(
  (f) => !propias.includes(f.id),
);
const idor = ajena
  ? await pedir(`${API}/pacientes/${ajena.id}`, conToken(paciente.token))
  : { estado: -1 };
sonda(
  'SEG-B4',
  'Control de acceso',
  'Referencia directa a objeto ajeno (IDOR) bloqueada',
  'HTTP 403 o 404 al pedir la ficha de otro paciente',
  `HTTP ${idor.estado} (ficha ${ajena?.id ?? 'no disponible'})`,
  idor.estado === 403 || idor.estado === 404,
);

const examenesAjenos = ajena
  ? await pedir(`${API}/pacientes/${ajena.id}/examenes`, conToken(paciente.token))
  : { estado: -1 };
sonda(
  'SEG-B5',
  'Control de acceso',
  'Los examenes de otro paciente no son legibles',
  'HTTP 403 o 404',
  `HTTP ${examenesAjenos.estado}`,
  examenesAjenos.estado === 403 || examenesAjenos.estado === 404,
);

const escalada = await pedir(
  `${API}/auth/registro`,
  json({
    nombreUsuario: `intruso.${Date.now()}`,
    email: `intruso.${Date.now()}@prueba.test`,
    password: 'ClaveDePrueba2026!',
    rol: 'ADMIN',
  }),
);
sonda(
  'SEG-B6',
  'Control de acceso',
  'El autorregistro no permite elegir el rol (escalada de privilegios)',
  'HTTP 400: el campo rol no esta declarado en el esquema',
  `HTTP ${escalada.estado}`,
  escalada.estado === 400,
);

const usuariosMedico = await pedir(`${API}/usuarios`, conToken(medico.token));
sonda(
  'SEG-B7',
  'Control de acceso',
  'La gestion de usuarios queda reservada al administrador',
  'HTTP 403 para el rol MEDICO',
  `HTTP ${usuariosMedico.estado}`,
  usuariosMedico.estado === 403,
);

registrar();

// =====================================================================
// C. Validacion y sanitizacion de entradas · OWASP A03
// =====================================================================
registrar('--- C. Validacion y sanitizacion de entradas ------------------------');

const inyeccionesLogin = [
  "' OR '1'='1' --",
  "admin1'--",
  "'; DROP TABLE usuario; --",
  "' UNION SELECT NULL,NULL,NULL --",
];
const estadosInyeccion = [];
for (const carga of inyeccionesLogin) {
  const r = await pedir(`${API}/auth/login`, json({ nombreUsuario: carga, password: carga }));
  estadosInyeccion.push(`${r.estado}`);
}
sonda(
  'SEG-C1',
  'Validacion de entradas',
  'Inyeccion SQL en el formulario de acceso (consultas parametrizadas)',
  'ningun 200: todas las cargas se rechazan con 400 o 401',
  `estados ${estadosInyeccion.join(',')}`,
  !estadosInyeccion.includes('200'),
);

/*
 * Se comprueba con una lectura autenticada y no con un nuevo login: el
 * limitador de /auth/login responderia 429 por los intentos fallidos
 * anteriores y el 429 se confundiria con un fallo de la base de datos.
 */
const sigueViva = await pedir(`${API}/pacientes`, conToken(admin.token));
const filasVivas = Array.isArray(sigueViva.json) ? sigueViva.json.length : -1;
sonda(
  'SEG-C2',
  'Validacion de entradas',
  'La base de datos sobrevive a la carga destructiva (DROP TABLE)',
  'HTTP 200 y la tabla de pacientes sigue devolviendo registros',
  `HTTP ${sigueViva.estado}, ${filasVivas} fichas legibles`,
  sigueViva.estado === 200 && filasVivas > 0,
);

const rutaInyectada = await pedir(
  `${API}/pacientes/${encodeURIComponent('1 OR 1=1')}`,
  conToken(admin.token),
);
sonda(
  'SEG-C3',
  'Validacion de entradas',
  'Parametro de ruta no numerico se rechaza antes del dominio',
  'HTTP 400',
  `HTTP ${rutaInyectada.estado}`,
  rutaInyectada.estado === 400,
);

const filtroInyectado = await pedir(
  `${API}/auditoria?entidad=${encodeURIComponent("paciente' OR 1=1 --")}`,
  conToken(admin.token),
);
sonda(
  'SEG-C4',
  'Validacion de entradas',
  'Filtro de consulta con carga SQL se rechaza o se trata como texto',
  'HTTP 400, o 200 sin exponer registros de otras entidades',
  `HTTP ${filtroInyectado.estado}`,
  filtroInyectado.estado === 400 ||
    (filtroInyectado.estado === 200 &&
      !JSON.stringify(filtroInyectado.json ?? {}).includes('OR 1=1')),
);

// --- XSS almacenado: se escribe la carga y se relee tal como la entrega la API
const CARGA_XSS = '<script>alert(document.cookie)</script>';
const pacientesLista = Array.isArray(fichasAdmin.json) ? fichasAdmin.json : [];
const pacienteObjetivo = pacientesLista[0];
let examenXss = null;
if (pacienteObjetivo) {
  const creado = await pedir(
    `${API}/examenes`,
    conToken(medico.token ?? admin.token, json({
      pacienteId: pacienteObjetivo.id,
      tipo: `Sonda XSS ${Date.now()}`,
      descripcion: `Prueba EP3 ${CARGA_XSS}`,
      fechaExamen: new Date().toISOString().slice(0, 10),
    })),
  );
  examenXss = creado.json ?? null;
}
const releido = examenXss?.id
  ? await pedir(`${API}/examenes/${examenXss.id}`, conToken(admin.token))
  : { estado: -1, cabeceras: new Headers(), texto: '' };
const tipoContenido = releido.cabeceras.get('content-type') ?? '';
sonda(
  'SEG-C5',
  'Validacion de entradas',
  'XSS almacenado: la carga se devuelve como dato JSON y no como HTML ejecutable',
  'Content-Type application/json y cabecera X-Content-Type-Options: nosniff',
  `HTTP ${releido.estado}, Content-Type "${tipoContenido}", nosniff "${releido.cabeceras.get('x-content-type-options') ?? 'ausente'}"`,
  releido.estado === 200 &&
    tipoContenido.includes('application/json') &&
    releido.cabeceras.get('x-content-type-options') === 'nosniff',
);

const csp = (await pedir(`${WEB}/`)).cabeceras.get('content-security-policy') ?? '';
sonda(
  'SEG-C6',
  'Validacion de entradas',
  'La SPA declara Content-Security-Policy que bloquea script en linea',
  "CSP con script-src 'self' y sin 'unsafe-inline' en script-src",
  csp ? `CSP: ${csp.slice(0, 120)}...` : 'CSP ausente',
  csp.includes("script-src 'self'") && !csp.includes("script-src 'self' 'unsafe-inline'"),
);

// --- CSRF: la API autentica por cabecera, no por cookie
const respuestaLogin = await pedir(`${API}/auth/login`, json({ nombreUsuario: 'admin1', password: CLAVE }));
const ponerCookie = respuestaLogin.cabeceras.get('set-cookie');
const csrfCruzado = await pedir(`${API}/pacientes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'http://sitio-malicioso.test' },
  body: JSON.stringify({ rut: '15181064-2', nombres: 'CSRF', apellidos: 'Prueba' }),
});
sonda(
  'SEG-C7',
  'Validacion de entradas',
  'CSRF: la sesion no viaja en cookie y una peticion de origen ajeno sin token falla',
  'sin cabecera Set-Cookie en el login y HTTP 401 en la peticion cruzada',
  `Set-Cookie ${ponerCookie ? 'presente' : 'ausente'}, peticion cruzada HTTP ${csrfCruzado.estado}`,
  !ponerCookie && csrfCruzado.estado === 401,
);

const origenAjeno = await pedir(`${API}/salud`, { headers: { Origin: 'http://sitio-malicioso.test' } });
const permitido = origenAjeno.cabeceras.get('access-control-allow-origin');
sonda(
  'SEG-C8',
  'Validacion de entradas',
  'La politica CORS no habilita origenes arbitrarios',
  'sin Access-Control-Allow-Origin para un origen no declarado (o distinto de *)',
  `Access-Control-Allow-Origin: ${permitido ?? 'ausente'}`,
  permitido === null || (permitido !== '*' && permitido !== 'http://sitio-malicioso.test'),
);

const campoExtra = await pedir(
  `${API}/pacientes`,
  conToken(admin.token, json({
    rut: '15181064-2',
    nombres: 'Mass',
    apellidos: 'Assignment',
    eliminadoEn: null,
    id: 1,
  })),
);
sonda(
  'SEG-C9',
  'Validacion de entradas',
  'Asignacion masiva: un campo no declarado invalida la peticion',
  'HTTP 400 (esquema estricto)',
  `HTTP ${campoExtra.estado}`,
  campoExtra.estado === 400,
);

const textoDesbordado = await pedir(
  `${API}/examenes`,
  conToken(admin.token, json({
    pacienteId: pacienteObjetivo?.id ?? 1,
    tipo: 'Sonda de longitud',
    descripcion: 'A'.repeat(5000),
  })),
);
sonda(
  'SEG-C10',
  'Validacion de entradas',
  'Texto libre sobredimensionado se rechaza (vector de agotamiento de memoria)',
  'HTTP 400 con descripcion de 5.000 caracteres (maximo 2.000)',
  `HTTP ${textoDesbordado.estado}`,
  textoDesbordado.estado === 400,
);

// --- Subida de documentos: tipo real frente a tipo declarado
let subidaFalsa = { estado: -1 };
if (examenXss?.id) {
  const formulario = new FormData();
  // Un ejecutable de Windows (firma MZ) declarado como PDF.
  const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  formulario.append('archivo', new Blob([bytes], { type: 'application/pdf' }), 'informe.pdf');
  subidaFalsa = await pedir(`${API}/examenes/${examenXss.id}/documentos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin.token}` },
    body: formulario,
  });
}
sonda(
  'SEG-C11',
  'Validacion de entradas',
  'Documento con tipo declarado falso se rechaza por su contenido real',
  'HTTP 400: la validacion no confia en la extension ni en el Content-Type',
  `HTTP ${subidaFalsa.estado}`,
  subidaFalsa.estado === 400,
);

registrar();

// =====================================================================
// D. Configuracion y exposicion de informacion · OWASP A05
// =====================================================================
registrar('--- D. Configuracion y exposicion de informacion --------------------');

const CABECERAS_EXIGIDAS = [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'strict-transport-security',
];

async function revisarCabeceras(id, url, etiqueta) {
  const r = await pedir(url);
  const faltan = CABECERAS_EXIGIDAS.filter((c) => !r.cabeceras.get(c));
  sonda(
    id,
    'Configuracion',
    `Cabeceras de seguridad en ${etiqueta}`,
    `las ${CABECERAS_EXIGIDAS.length} cabeceras de NFR-SEG-10 presentes`,
    faltan.length === 0 ? 'todas presentes' : `faltan ${faltan.join(', ')}`,
    faltan.length === 0,
  );
  return { estado: r.estado, faltan };
}

await revisarCabeceras('SEG-D1', `${WEB}/`, 'la pagina principal de la SPA');

// Los archivos estaticos los sirve otro bloque `location` de nginx: el escaneo
// pasivo de ZAP los visita igual que la pagina principal.
const indice = await pedir(`${WEB}/`);
const assetEncontrado = indice.texto.match(/\/assets\/[A-Za-z0-9._-]+\.(?:js|css)/);
const rutaAsset = assetEncontrado ? assetEncontrado[0] : '/assets/index.js';
await revisarCabeceras('SEG-D2', `${WEB}${rutaAsset}`, `un archivo estatico (${rutaAsset})`);

const salud = await pedir(`${API}/salud`);
const delata = ['x-powered-by', 'server'].filter((c) => {
  const valor = salud.cabeceras.get(c);
  return valor && !/^nginx$/i.test(valor);
});
sonda(
  'SEG-D3',
  'Configuracion',
  'La API no revela el motor ni su version en las cabeceras',
  'sin X-Powered-By y sin version en Server',
  delata.length === 0
    ? 'ninguna cabecera delatora'
    : delata.map((c) => `${c}: ${salud.cabeceras.get(c)}`).join(' · '),
  delata.length === 0,
);

const errorForzado = await pedir(`${API}/pacientes/999999`, conToken(admin.token));
const cuerpoError = errorForzado.texto;
const filtra = /at\s+\w+|node_modules|\/app\/src|Error:\s+\w+Error/.test(cuerpoError);
sonda(
  'SEG-D4',
  'Configuracion',
  'Los errores no devuelven traza de pila ni rutas del servidor',
  'HTTP 404 con mensaje de negocio y sin traza',
  `HTTP ${errorForzado.estado}, traza ${filtra ? 'PRESENTE' : 'ausente'}`,
  !filtra && errorForzado.estado >= 400,
);

const noExiste = await pedir(`${WEB}/.env`);
sonda(
  'SEG-D5',
  'Configuracion',
  'Los archivos de configuracion no se sirven desde la SPA',
  'la peticion a /.env no devuelve el archivo (200 con el index de la SPA o 404)',
  `HTTP ${noExiste.estado}, contiene secretos: ${/JWT_SECRET|POSTGRES_PASSWORD/.test(noExiste.texto) ? 'SI' : 'no'}`,
  !/JWT_SECRET|POSTGRES_PASSWORD/.test(noExiste.texto),
);

registrar();

// =====================================================================
// Sonda diferida: agota la ventana del limitador de autenticacion
// =====================================================================
registrar('--- A (diferido). Limitador de autenticacion ------------------------');
registrar('Se ejecuta al final porque bloquea /auth/login durante 15 minutos.');
await sondaFuerzaBruta();
registrar();

// =====================================================================
// Resumen
// =====================================================================
// Se ordena por ID para que la tabla se lea por enfoque y no por el orden de
// ejecucion, que esta condicionado por el limitador.
resultados.sort((a, b) =>
  a.id.localeCompare(b.id, 'es', { numeric: true, sensitivity: 'base' }),
);
const total = resultados.length;
const pasaron = resultados.filter((r) => r.paso).length;
const fallaron = total - pasaron;
const duracion = ((Date.now() - inicio) / 1000).toFixed(1);

registrar('=====================================================================');
registrar('RESUMEN DE LAS SONDAS DE SEGURIDAD');
registrar('=====================================================================');
registrar('ID         ENFOQUE                RESULTADO  CASO');
registrar('---------  ---------------------  ---------  ------------------------');
for (const r of resultados) {
  registrar(
    `${r.id.padEnd(9)}  ${r.enfoque.padEnd(21)}  ${(r.paso ? 'APRUEBA' : 'FALLA').padEnd(9)}  ${r.titulo}`,
  );
}
registrar('---------  ---------------------  ---------  ------------------------');
registrar(`Total: ${total} sondas · aprueban ${pasaron} · fallan ${fallaron} · ${duracion} s`);
registrar('=====================================================================');

const porEnfoque = {};
for (const r of resultados) {
  porEnfoque[r.enfoque] ??= { total: 0, pasaron: 0 };
  porEnfoque[r.enfoque].total += 1;
  if (r.paso) porEnfoque[r.enfoque].pasaron += 1;
}
registrar();
registrar('Por enfoque de prueba:');
for (const [enfoque, dato] of Object.entries(porEnfoque)) {
  registrar(`  ${enfoque.padEnd(22)} ${dato.pasaron}/${dato.total}`);
}

if (fallaron > 0) {
  registrar();
  registrar('HALLAZGOS A DOCUMENTAR EN EL INFORME:');
  for (const r of resultados.filter((x) => !x.paso)) {
    registrar(`  ${r.id} · ${r.titulo}`);
    registrar(`      esperado: ${r.esperado}`);
    registrar(`      obtenido: ${r.obtenido}`);
  }
}

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, lineas.join('\n') + '\n', 'utf8');
console.log(`\nEvidencia escrita en ${SALIDA}`);
process.exitCode = fallaron > 0 ? 1 : 0;
