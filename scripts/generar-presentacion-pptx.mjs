/**
 * =====================================================================
 * Cuidarte+ v1.2 · EP3 · Generador de la presentacion de la defensa
 *
 * Produce `entrega/Presentacion_EP3_Cuidarte+.pptx` con las once
 * diapositivas que describe `docs/05_Guion_Oral_EP3.md`, en el mismo
 * orden y con el mismo minutaje.
 *
 * CRITERIO DE DISENO
 *
 * Una diapositiva de defensa no es un documento proyectado. La regla que
 * se aplica aqui es que la diapositiva muestre el DATO y la persona
 * aporte la EXPLICACION: por eso hay tablas y cifras grandes, y no
 * parrafos. El texto que se dice en voz alta va en las NOTAS DEL ORADOR
 * de cada diapositiva, tomado literalmente del guion, de modo que quien
 * expone lo tenga delante sin tenerlo que proyectar.
 *
 * El minutaje acumulado aparece en cada diapositiva, arriba a la derecha.
 * En una defensa de diez minutos con nota individual, perder el control
 * del tiempo cuesta mas caro que cualquier error de contenido.
 *
 * Uso:
 *   cd ev3/scripts && npm install && node generar-presentacion-pptx.mjs
 * =====================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(AQUI, '..');
const CAPTURAS = path.join(BASE, 'evidencias', 'v1.2', 'capturas');
const DESTINO = path.join(BASE, 'entrega', 'Presentacion_EP3_Cuidarte+.pptx');

fs.mkdirSync(path.dirname(DESTINO), { recursive: true });

// --- Identidad visual -------------------------------------------------
const NAVY = '13344F';
const NARANJA = 'C2410C';
const GRIS = '5A6472';
const GRIS_CLARO = 'E8EBEE';
const BLANCO = 'FFFFFF';
const VERDE = '15803D';
const ROJO = 'B91C1C';
const FUENTE = 'Arial';

const DATOS = {
  asignatura: 'ISY1102 · Seguridad y Calidad en el Desarrollo de Software',
  evaluacion: 'Evaluacion Parcial N.º 3',
  integrantes: 'Eder Valdivia · Marcelo Morales',
  seccion: 'Seccion 003V',
  docente: 'Docente: Mauricio Andres Velasquez Silva',
  fecha: '23 de noviembre de 2026',
};

const pres = new pptxgen();
/*
 * LAYOUT_WIDE son 13,33 x 7,5 pulgadas, que es el 16:9 de PowerPoint.
 * Cuidado: la constante LAYOUT_16x9 de pptxgenjs mide 10 x 5,625, y usarla
 * con estas coordenadas deja la mitad del contenido fuera de la lamina.
 */
pres.layout = 'LAYOUT_WIDE';
pres.author = DATOS.integrantes;
pres.company = 'Duoc UC';
pres.title = 'EP3 Cuidarte+ — Optimizando el aseguramiento de la calidad y seguridad';

const ANCHO = 13.33;
const MARGEN = 0.6;
const UTIL = ANCHO - MARGEN * 2;

// =====================================================================
// Plantilla comun de diapositiva
// =====================================================================

/**
 * Crea una diapositiva de contenido con su titulo, su minutaje y el pie.
 *
 * @param {string} titulo     enunciado de la diapositiva
 * @param {string} minutaje   tramo del guion, p. ej. "1:00 – 2:30"
 * @param {string} indicador  indicador de la rubrica que se juega aqui
 * @param {string} notas      texto del guion para las notas del orador
 */
function diapositiva(titulo, minutaje, indicador, notas) {
  const s = pres.addSlide();
  s.background = { color: BLANCO };

  // Banda superior
  s.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: ANCHO,
    h: 0.1,
    fill: { color: NAVY },
  });

  s.addText(titulo, {
    x: MARGEN,
    y: 0.32,
    w: UTIL - 2.3,
    h: 0.75,
    fontFace: FUENTE,
    fontSize: 22,
    bold: true,
    color: NAVY,
    valign: 'middle',
    shrinkText: true,
  });

  const etiqueta = indicador ? `${minutaje}  ·  ${indicador}` : minutaje;
  s.addText(etiqueta, {
    x: ANCHO - MARGEN - 2.6,
    y: 0.34,
    w: 2.6,
    h: 0.58,
    fontFace: FUENTE,
    fontSize: 12,
    color: GRIS,
    align: 'right',
    valign: 'middle',
  });

  // Pie
  s.addText(`${DATOS.asignatura}  ·  Caso B: Cuidarte+`, {
    x: MARGEN,
    y: 7.02,
    w: UTIL - 1,
    h: 0.3,
    fontFace: FUENTE,
    fontSize: 9,
    color: GRIS,
  });
  s.addText(String(pres.slides.length), {
    x: ANCHO - MARGEN - 1,
    y: 7.02,
    w: 1,
    h: 0.3,
    fontFace: FUENTE,
    fontSize: 9,
    color: GRIS,
    align: 'right',
  });

  if (notas) s.addNotes(notas);
  return s;
}

/** Tabla con la cabecera marcada y tipografia legible al proyectar. */
function tabla(s, filas, opciones = {}) {
  const cuerpo = filas.map((fila, i) =>
    fila.map((celda) => {
      const texto = typeof celda === 'object' ? celda.text : celda;
      const extra = typeof celda === 'object' ? celda.options ?? {} : {};
      return {
        text: String(texto),
        options: {
          fontFace: FUENTE,
          fontSize: opciones.fontSize ?? 13,
          color: i === 0 ? NAVY : '1F2733',
          bold: i === 0,
          fill: { color: i === 0 ? GRIS_CLARO : BLANCO },
          valign: 'middle',
          margin: 3,
          ...extra,
        },
      };
    }),
  );

  s.addTable(cuerpo, {
    x: opciones.x ?? MARGEN,
    y: opciones.y ?? 1.25,
    w: opciones.w ?? UTIL,
    colW: opciones.colW,
    border: { type: 'solid', color: 'C9CED6', pt: 0.5 },
    autoPage: false,
    ...(opciones.extra ?? {}),
  });
}

/** Cifra grande con su rotulo, para las diapositivas de resultados. */
function cifra(s, { x, y, w, valor, rotulo, color = NAVY }) {
  s.addText(String(valor), {
    x,
    y,
    w,
    h: 0.9,
    fontFace: FUENTE,
    fontSize: 40,
    bold: true,
    color,
    align: 'center',
  });
  s.addText(rotulo, {
    x,
    y: y + 0.88,
    w,
    h: 0.55,
    fontFace: FUENTE,
    fontSize: 12,
    color: GRIS,
    align: 'center',
    valign: 'top',
  });
}

/** Lista de puntos con vineta cuadrada en color de acento. */
function puntos(s, items, opciones = {}) {
  s.addText(
    items.map((t) => ({
      text: t,
      options: {
        bullet: { code: '25AA' },
        fontFace: FUENTE,
        fontSize: opciones.fontSize ?? 15,
        color: '1F2733',
        paraSpaceAfter: 10,
      },
    })),
    {
      x: opciones.x ?? MARGEN,
      y: opciones.y ?? 1.3,
      w: opciones.w ?? UTIL,
      h: opciones.h ?? 4.8,
      valign: 'top',
    },
  );
}

// =====================================================================
// 1 · Portada
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  s.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 3.02,
    w: ANCHO,
    h: 0.06,
    fill: { color: NARANJA },
  });

  s.addText(DATOS.asignatura, {
    x: MARGEN,
    y: 1.1,
    w: UTIL,
    h: 0.4,
    fontFace: FUENTE,
    fontSize: 14,
    color: 'A8B4C2',
  });

  s.addText('Optimizando el aseguramiento de\nla calidad y seguridad del software', {
    x: MARGEN,
    y: 1.6,
    w: UTIL,
    h: 1.4,
    fontFace: FUENTE,
    fontSize: 36,
    bold: true,
    color: BLANCO,
    lineSpacingMultiple: 1.05,
  });

  s.addText('Caso B: Cuidarte+  ·  sistema de examenes medicos  ·  version 1.2', {
    x: MARGEN,
    y: 3.3,
    w: UTIL,
    h: 0.45,
    fontFace: FUENTE,
    fontSize: 17,
    color: 'D4DCE4',
  });

  s.addText(
    [
      { text: DATOS.evaluacion, options: { bold: true, color: BLANCO, fontSize: 15 } },
      { text: '\n' + DATOS.integrantes, options: { color: 'D4DCE4', fontSize: 15 } },
      { text: '\n' + DATOS.seccion + '  ·  ' + DATOS.docente, options: { color: 'A8B4C2', fontSize: 13 } },
      { text: '\n' + DATOS.fecha, options: { color: 'A8B4C2', fontSize: 13 } },
    ],
    { x: MARGEN, y: 4.6, w: UTIL, h: 1.8, fontFace: FUENTE, lineSpacingMultiple: 1.25 },
  );

  s.addNotes(
    'Diapo 1 (0:00 - 0:30). Buenos dias. Soy [nombre]. Presento la Evaluacion ' +
      'Parcial 3 del caso Cuidarte+, el sistema de examenes medicos que venimos ' +
      'trabajando desde la EP1. El trabajo lo hicimos con [companero], y esta fase ' +
      'se trata de optimizar el aseguramiento de la calidad y la seguridad del ' +
      'software que en la EP2 dejamos corregido.',
  );
}

// =====================================================================
// 2 · De donde venimos
// =====================================================================
{
  const s = diapositiva(
    'De donde venimos: la EP2 cerro con todo en verde',
    '0:30 – 1:00',
    '',
    'Diapo 2. En la EP2 auditamos la version 1.0, encontramos catorce defectos y ' +
      'los cerramos en la version 1.1. Esa version tenia 132 pruebas automatizadas ' +
      'verdes y casi 90 % de cobertura. El ajuste mas importante que hicimos para ' +
      'la EP3 sale de revisar esa entrega con ojo critico: nuestro pipeline ' +
      'DECLARABA nueve puertas de calidad, pero solo ejecutaba cinco. ZAP y Trivy ' +
      'estaban escritos y nunca se habian corrido. En esta EP3 los ejecutamos por ' +
      'primera vez, y aparecieron seis defectos reales que estaban ahi desde octubre. ' +
      'Si se llevan una sola frase de toda la defensa, que sea esta.',
  );

  cifra(s, { x: MARGEN, y: 1.5, w: 2.9, valor: '14', rotulo: 'incidentes detectados\ny cerrados en la EP2' });
  cifra(s, { x: MARGEN + 3.0, y: 1.5, w: 2.9, valor: '132', rotulo: 'pruebas automatizadas\nen verde' });
  cifra(s, { x: MARGEN + 6.0, y: 1.5, w: 2.9, valor: '89,8 %', rotulo: 'cobertura de lineas' });
  cifra(s, {
    x: MARGEN + 9.0,
    y: 1.5,
    w: 2.9,
    valor: '5 de 9',
    rotulo: 'puertas del pipeline\nrealmente ejecutadas',
    color: ROJO,
  });

  s.addShape(pres.ShapeType.rect, {
    x: MARGEN,
    y: 3.95,
    w: UTIL,
    h: 1.5,
    fill: { color: GRIS_CLARO },
    line: { color: NAVY, width: 0 },
  });
  s.addShape(pres.ShapeType.rect, { x: MARGEN, y: 3.95, w: 0.09, h: 1.5, fill: { color: NARANJA } });
  s.addText('Un control declarado no es un control ejecutado.', {
    x: MARGEN + 0.4,
    y: 4.15,
    w: UTIL - 0.8,
    h: 0.55,
    fontFace: FUENTE,
    fontSize: 24,
    bold: true,
    color: NAVY,
  });
  s.addText(
    'OWASP ZAP y Trivy estaban definidos en el pipeline desde octubre. Nunca se ejecutaron. ' +
      'Los seis defectos de esta evaluacion estaban dentro de su alcance.',
    { x: MARGEN + 0.4, y: 4.72, w: UTIL - 0.8, h: 0.55, fontFace: FUENTE, fontSize: 14, color: GRIS },
  );

  s.addText(
    'Ajustes de la EP1 y la EP2  ·  apartado obligatorio 1 del encargo',
    { x: MARGEN, y: 5.7, w: UTIL, h: 0.35, fontFace: FUENTE, fontSize: 12, color: NARANJA, bold: true },
  );
  s.addText(
    'Ejecutar lo declarado  ·  reconocer que la cobertura de codigo no es cobertura de riesgos  ·  ' +
      'evidencia comparable ANTES/DESPUES  ·  cubrir diagrama y mantenimiento  ·  no afirmar lo que no se ejecuto',
    { x: MARGEN, y: 6.05, w: UTIL, h: 0.6, fontFace: FUENTE, fontSize: 13, color: '1F2733' },
  );
}

// =====================================================================
// 3 · Los cinco enfoques  · IE2 (30 %)
// =====================================================================
{
  const s = diapositiva(
    'Cinco enfoques: cada uno ve lo que los demas no pueden ver',
    '1:00 – 3:30',
    'IE2 · 30 %',
    'Diapo 3. Lo importante no es la herramienta sino que clase de defecto puede ' +
      'encontrar cada una. Analisis estatico: lee el codigo sin ejecutarlo, encuentra ' +
      'eval, concatenacion de SQL, expresiones regulares que se cuelgan; no puede ver ' +
      'que responde el servidor porque nunca lo enciende. npm audit: mira las librerias ' +
      'que declaramos, el 90 % del codigo que se despliega no lo escribimos nosotros. ' +
      'Trivy: mira el contenedor completo, el Alpine base, nginx; esa capa no la ' +
      'escribio nadie del equipo pero el riesgo es nuestro. ZAP: levanta la aplicacion ' +
      'y revisa lo que el servidor realmente envia, ve las cabeceras HTTP, algo que ' +
      'ningun analisis de codigo puede deducir. Sondas propias: 29 casos negativos ' +
      'sobre NUESTRAS reglas, que un paciente solo vea su ficha, que un medico no ' +
      'administre usuarios. Eso ninguna herramienta generica lo sabe.',
  );

  tabla(
    s,
    [
      ['Enfoque', 'Herramienta', 'Que detecta', 'Que NO puede ver'],
      ['Analisis estatico\n(SAST)', 'ESLint +\nplugin security', 'Patrones inseguros en el codigo, sin ejecutarlo', 'El comportamiento en ejecucion'],
      ['Dependencias\n(SCA)', 'npm audit', 'CVE en las librerias declaradas', 'Lo que no esta en package.json'],
      ['Imagen de\ncontenedor', 'Trivy', 'CVE del sistema base y de la imagen', 'El comportamiento de la aplicacion'],
      ['Analisis dinamico\n(DAST)', 'OWASP ZAP', 'Lo que el servidor realmente envia: cabeceras, fugas, cache', 'La logica de negocio'],
      [
        { text: 'Pruebas dirigidas', options: { bold: true, color: NARANJA } },
        { text: 'Sondas propias\n29 casos', options: { bold: true, color: NARANJA } },
        { text: 'Las reglas de ESTE sistema: quien puede ver que', options: { bold: true } },
        'Lo que nadie previo al escribirlas',
      ],
    ],
    { y: 1.3, colW: [2.2, 2.3, 4.5, 3.1], fontSize: 12.5 },
  );

  s.addText(
    'Ninguna herramienta generica sabe que en Cuidarte+ un paciente solo debe ver su propia ficha. ' +
      'Esa regla es RB-1 del ERS y su verificacion hay que escribirla.',
    { x: MARGEN, y: 4.75, w: UTIL, h: 0.5, fontFace: FUENTE, fontSize: 13, color: GRIS, italic: true },
  );
}

// =====================================================================
// 4 · Que encontro cada uno  · IE2
// =====================================================================
{
  const s = diapositiva(
    'Seis defectos reales en un software que estaba "en verde"',
    '2:30 – 3:30',
    'IE2 · 30 %',
    'Diapo 4. Los seis se repartieron asi. ZAP y una sonda detectaron, cada uno por ' +
      'su lado, que todos los archivos JavaScript y CSS se servian sin ninguna cabecera ' +
      'de seguridad: en nginx, cuando un location declara una cabecera, REEMPLAZA las ' +
      'del nivel superior en vez de sumarlas. La configuracion parecia correcta y por ' +
      'eso ninguna revision de codigo lo vio. Una sonda detecto que cualquier peticion ' +
      'con Origin no permitido devolvia error 500, incluido el healthcheck publico: ' +
      'cualquiera podia inundar el log con una sola cabecera. npm audit detecto tres ' +
      'vulnerabilidades nuevas en produccion, y el codigo no habia cambiado desde ' +
      'octubre. Trivy detecto 239 vulnerabilidades en la imagen de la pantalla, una ' +
      'critica, y que la imagen de la API llevaba npm a produccion.',
  );

  tabla(
    s,
    [
      ['ID', 'Defecto', 'Criticidad', 'Lo detecto'],
      ['INC-01', 'Los archivos estaticos se servian SIN ninguna cabecera de seguridad', { text: 'Grave', options: { color: ROJO, bold: true } }, 'Sonda SEG-D2\ny OWASP ZAP'],
      ['INC-02', 'Toda peticion con Origin ajeno devolvia HTTP 500, incluido /salud', { text: 'Grave', options: { color: ROJO, bold: true } }, 'Sonda SEG-C7'],
      ['INC-03', 'Tres dependencias de produccion con avisos nuevos', { text: 'Grave', options: { color: ROJO, bold: true } }, 'npm audit'],
      ['INC-04', 'Imagen de la SPA: 1 critica y 57 altas por base sin parches', { text: 'Grave', options: { color: ROJO, bold: true } }, 'Trivy'],
      ['INC-05', 'Datos clinicos almacenables en cache; sin aislamiento de origen', 'Moderado', 'OWASP ZAP'],
      ['INC-06', 'npm viajaba a la imagen de produccion, con 6 altas', 'Moderado', 'Trivy'],
    ],
    { y: 1.3, colW: [1.2, 6.8, 1.7, 2.4], fontSize: 12.5 },
  );

  s.addText(
    'Ninguno fue detectado por las 132 pruebas unitarias ni por los 6 escenarios BDD. ' +
      'No es una falla de esa bateria: verifica el dominio, y estos defectos viven en la configuracion, ' +
      'las dependencias y la imagen.',
    { x: MARGEN, y: 4.3, w: UTIL, h: 0.6, fontFace: FUENTE, fontSize: 13, color: GRIS, italic: true },
  );
}

// =====================================================================
// 5 · Resultados consolidados
// =====================================================================
{
  const s = diapositiva(
    'Antes y despues: los seis cerrados y verificados',
    '3:30 – 4:15',
    'IE2 · 30 %',
    'Diapo 5. Dejen que los numeros hablen. Las sondas pasan de 27 a 29 de 29. ZAP ' +
      'baja de 2 fallos a 0 y sube de 64 a 67 reglas aprobadas. npm audit en produccion ' +
      'pasa de 3 avisos, dos de ellos altos, a cero. Y Trivy sobre la imagen de la ' +
      'pantalla pasa de 239 vulnerabilidades, con una critica y 57 altas, a una sola de ' +
      'severidad media. Cada numero tiene su anexo con fecha y ejecutor en el repositorio.',
  );

  tabla(
    s,
    [
      ['Medida', 'ANTES', 'DESPUES'],
      ['Sondas dirigidas de seguridad', '27 de 29', { text: '29 de 29', options: { bold: true, color: VERDE } }],
      ['OWASP ZAP sobre la SPA · fallos', '2', { text: '0', options: { bold: true, color: VERDE } }],
      ['OWASP ZAP sobre la SPA · reglas aprobadas', '64', { text: '67', options: { bold: true, color: VERDE } }],
      ['npm audit en dependencias de produccion', '3 avisos (2 altas)', { text: '0', options: { bold: true, color: VERDE } }],
      ['Trivy · imagen de la SPA', '239 (1 critica, 57 altas)', { text: '1 (0 altas)', options: { bold: true, color: VERDE } }],
      ['Trivy · imagen de la API', '33 (8 altas)', { text: '11 (0 altas)', options: { bold: true, color: VERDE } }],
      ['Pruebas Jest y escenarios BDD', '132 de 132 · 6 de 6', { text: '132 de 132 · 6 de 6', options: { bold: true, color: VERDE } }],
    ],
    { y: 1.35, colW: [6.2, 3.5, 2.4], fontSize: 13.5 },
  );

  s.addText(
    'La ultima fila importa tanto como las otras: ninguna correccion rompio nada. Por eso la regresion ' +
      'se ejecuta DESPUES del cambio, y no solo antes.',
    { x: MARGEN, y: 5.1, w: UTIL, h: 0.5, fontFace: FUENTE, fontSize: 13, color: GRIS, italic: true },
  );
}

// =====================================================================
// 6 · Como se corrigio
// =====================================================================
{
  const s = diapositiva(
    'Como se corrigio cada uno',
    '4:15 – 5:00',
    '',
    'Diapo 6. Las cabeceras se sacaron a un archivo unico que ahora se incluye ' +
      'explicitamente en cada bloque de nginx: la herencia dejo de ser un supuesto. ' +
      'El rechazo de CORS paso a ser controlado, sin error interno. Subimos la base de ' +
      'la imagen y parchamos las tres dependencias. Y sacamos npm de la imagen de ' +
      'produccion, porque la aplicacion no lo necesita para correr. Despues de cada ' +
      'correccion volvimos a ejecutar toda la bateria, incluidas las 132 pruebas de la ' +
      'EP2. Siguen en 132 de 132.',
  );

  tabla(
    s,
    [
      ['Defecto', 'Correccion aplicada', 'Como se verifico'],
      ['INC-01', 'Cabeceras en un fragmento unico, incluido en cada bloque location de nginx', 'SEG-D2 pasa a APRUEBA · ZAP 2 fallos a 0'],
      ['INC-02', 'Rechazo de CORS controlado: callback(null, false) en vez de lanzar un error', '/salud 500 a 200 · POST sin token 500 a 401'],
      ['INC-03', 'multer 2.4.0 a 2.5.0; body-parser y qs actualizados', 'npm audit produccion: 3 a 0'],
      ['INC-04', 'Base de la imagen de nginx 1.29-alpine a 1.31-alpine', 'Trivy: 239 a 1'],
      ['INC-05', 'Cache-Control no-store y aislamiento de origen cruzado', 'ZAP 10049 pasa a "Non-Storable" · 90004 a PASS'],
      ['INC-06', 'La imagen de ejecucion elimina npm, npx y yarn', 'Trivy: la seccion node-pkg desaparece'],
    ],
    { y: 1.3, colW: [1.3, 6.3, 4.5], fontSize: 12.5 },
  );

  s.addText(
    'Ninguna correccion toco el codigo del dominio: los seis defectos vivian en la configuracion, ' +
      'las dependencias y la imagen.',
    { x: MARGEN, y: 4.65, w: UTIL, h: 0.5, fontFace: FUENTE, fontSize: 13, color: GRIS, italic: true },
  );
}

// =====================================================================
// 7 · Automatizacion  · IE6 (24 %)
// =====================================================================
{
  const s = diapositiva(
    'Cuatro herramientas de automatizacion que no existian',
    '5:00 – 6:00',
    'IE6 · 24 %',
    'Diapo 7. Incorporamos cuatro herramientas, una por cada cosa que habia que ' +
      'cubrir. Playwright recorre la aplicacion en un navegador real: inicio de sesion, ' +
      'listado, ficha, registro de un examen, auditoria, cierre de sesion. Siete casos, ' +
      'cada uno trazado a un requisito del ERS. Postman con Newman valida la API ' +
      'directamente, sin pasar por la pantalla: ahi comprobamos que el control de acceso ' +
      'esta en el servidor y no solo en la interfaz. Lighthouse mide rendimiento y ' +
      'accesibilidad sobre la pantalla real. Y k6 levanta 200 usuarios concurrentes, que ' +
      'es el numero que exige el ERS.',
  );

  tabla(
    s,
    [
      ['Tipo de prueba', 'Herramienta', 'Que automatiza', 'Resultado'],
      ['Funcional de interfaz', 'Playwright', '7 casos en un navegador real, trazados al ERS', { text: '7 de 7', options: { bold: true, color: VERDE } }],
      ['Funcional de servicios', 'Postman + Newman', '26 peticiones, 58 aserciones sobre la API', { text: '58 de 58', options: { bold: true, color: VERDE } }],
      ['No funcional', 'Lighthouse', 'Rendimiento, accesibilidad y buenas practicas', { text: '100 / 100 / 100', options: { bold: true, color: VERDE } }],
      ['No funcional de carga', 'k6', '200 usuarios concurrentes (NFR-PERF-3)', { text: '0,00 % de error', options: { bold: true, color: VERDE } }],
      ['Regresion heredada', 'Jest + Cucumber', '132 pruebas y 6 escenarios de la EP2', { text: '132 · 6', options: { bold: true, color: VERDE } }],
    ],
    { y: 1.35, colW: [3.0, 2.6, 4.8, 1.7], fontSize: 13 },
  );

  s.addText(
    'Umbrales del ERS verificados por k6:  NFR-PERF-1 p95 ≤ 300 ms → 127 ms  ·  ' +
      'NFR-PERF-2 p95 ≤ 2000 ms → 84 ms  ·  NFR-DIS-3 p95 ≤ 300 ms → 44 ms',
    { x: MARGEN, y: 4.35, w: UTIL, h: 0.5, fontFace: FUENTE, fontSize: 13, color: NAVY },
  );
  s.addText(
    'Los umbrales se declaran como thresholds de k6: la prueba falla sola si se incumplen, no queda a criterio del lector.',
    { x: MARGEN, y: 4.75, w: UTIL, h: 0.45, fontFace: FUENTE, fontSize: 12.5, color: GRIS, italic: true },
  );
}

// =====================================================================
// 8 · El impacto en numeros  · IE6
// =====================================================================
{
  const s = diapositiva(
    'El impacto: no es el tiempo que ahorra, es la frecuencia',
    '6:00 – 7:00',
    'IE6 · 24 %',
    'Diapo 8. Los siete casos de interfaz corren en unos 8 segundos; hacerlos a mano, ' +
      'con una persona operando el navegador, son unos 10 minutos. Las 58 aserciones de ' +
      'API, en 4 segundos. Lighthouse revisa 17 criterios de accesibilidad en 15 ' +
      'segundos, y esa misma revision punto por punto es trabajo de dos a tres horas. ' +
      'k6 genera mas de 7.400 peticiones en 45 segundos con 0 % de error. Pero el ahorro ' +
      'de tiempo no es lo mas importante. Lo importante es que esto se puede repetir en ' +
      'cada cambio: una prueba manual de diez minutos se hace una vez y se deja de ' +
      'hacer; una de ocho segundos se hace siempre.',
  );

  tabla(
    s,
    [
      ['Prueba', 'Automatizada', 'Equivalente manual', 'Reduccion'],
      ['7 casos de interfaz', { text: '8,4 s', options: { bold: true } }, '~10,5 min', { text: '98,7 %', options: { bold: true, color: VERDE } }],
      ['58 aserciones de API', { text: '4,3 s', options: { bold: true } }, '~29 min', { text: '99,8 %', options: { bold: true, color: VERDE } }],
      ['17 criterios de accesibilidad', { text: '15,4 s', options: { bold: true } }, '2 a 3 horas', { text: '99,8 %', options: { bold: true, color: VERDE } }],
      ['7.414 peticiones, 200 usuarios', { text: '46,0 s', options: { bold: true } }, 'No reproducible a mano', '—'],
    ],
    { y: 1.35, colW: [4.6, 2.6, 3.4, 1.5], fontSize: 13.5 },
  );

  s.addShape(pres.ShapeType.rect, { x: MARGEN, y: 3.95, w: UTIL, h: 1.5, fill: { color: GRIS_CLARO } });
  s.addShape(pres.ShapeType.rect, { x: MARGEN, y: 3.95, w: 0.09, h: 1.5, fill: { color: NARANJA } });
  s.addText('Una prueba manual de diez minutos se ejecuta una vez y se abandona.\nUna de ocho segundos se ejecuta en cada cambio.', {
    x: MARGEN + 0.4,
    y: 4.15,
    w: UTIL - 0.8,
    h: 1.1,
    fontFace: FUENTE,
    fontSize: 19,
    bold: true,
    color: NAVY,
    lineSpacingMultiple: 1.2,
  });

  s.addText(
    'La bateria funcional completa corre en menos de tres minutos. INC-03 lo demuestra: dos vulnerabilidades ' +
      'altas aparecieron sin que el codigo cambiara, y solo una ejecucion periodica podia encontrarlas.',
    { x: MARGEN, y: 6.15, w: UTIL, h: 0.55, fontFace: FUENTE, fontSize: 12.5, color: GRIS, italic: true },
  );
}

// =====================================================================
// 9 · Diagrama de controles  · IE4 (14 %)
// =====================================================================
{
  const s = diapositiva(
    'Integracion de los controles con el cumplimiento normativo',
    '7:00 – 8:00',
    'IE4 · 14 %',
    'Diapo 9. El diagrama tiene cinco columnas: las cinco etapas por las que pasa el ' +
      'software, desde el codigo que escribimos hasta el veredicto de despliegue. En cada ' +
      'columna hay dos filas: arriba el control que protege el producto, abajo la puerta ' +
      'automatizada que comprueba que ese control sigue ahi. El color indica que ley o ' +
      'estandar preserva. Un ejemplo completo de punta a punta: la ley 19.628 clasifica ' +
      'los datos de salud como dato sensible; el control es Cache-Control no-store, para ' +
      'que una ficha clinica no quede en la cache del navegador tras cerrar sesion; la ' +
      'puerta es la regla 10049 de OWASP ZAP; y la evidencia es el archivo ' +
      'zap-spa-DESPUES-consola.txt, con fecha y ejecutor. Eso es verificar el ' +
      'cumplimiento: no declararlo en el informe, sino que una herramienta lo compruebe ' +
      'sola y deje registro.',
  );

  const figura = path.join(CAPTURAS, 'diagrama_controles.png');
  if (fs.existsSync(figura)) {
    /*
     * La figura mide 1560 x 951 px. Ajustarla al ancho util daria 7,4
     * pulgadas de alto y se saldria de una diapositiva de 7,5 con
     * cabecera y pie. Se ajusta por ALTO al espacio disponible y se
     * centra horizontalmente.
     */
    const dimensiones = { ancho: 1560, alto: 951 };
    const h = 5.7;
    const w = (h * dimensiones.ancho) / dimensiones.alto;
    s.addImage({ path: figura, x: (ANCHO - w) / 2, y: 1.2, w, h });
  } else {
    s.addText('[Falta la figura: ejecute node scripts/generar-diagrama.mjs]', {
      x: MARGEN,
      y: 3,
      w: UTIL,
      h: 0.6,
      fontFace: FUENTE,
      fontSize: 16,
      color: ROJO,
      align: 'center',
    });
  }
}

// =====================================================================
// 10 · Plan de mantenimiento  · IE8 (20 %)
// =====================================================================
{
  const s = diapositiva(
    'Plan de mantenimiento: cuando, quien, que se re-ejecuta',
    '8:00 – 9:20',
    'IE8 · 20 %',
    'Diapo 10. El plan responde cuatro preguntas por cada actividad: cuando, quien, que ' +
      'se re-ejecuta y que evidencia deja. En cada cambio de codigo, la bateria completa ' +
      'de la API. En cada cambio de interfaz, Playwright y Lighthouse. Semanalmente, npm ' +
      'audit AUNQUE NO HAYA CAMBIOS: esta es la actividad que mas cuesta justificar y la ' +
      'mas importante, porque nuestro codigo no cambio en un mes y aun asi aparecieron ' +
      'dos vulnerabilidades altas. En cada candidato a release, la bateria de seguridad ' +
      'completa y la prueba de carga. Mensualmente, reconstruir las imagenes base, que es ' +
      'lo que habria evitado las 239 vulnerabilidades de la imagen de la pantalla. Y la ' +
      'propuesta de mejora continua ya esta implementada: las tres puertas que corriamos ' +
      'a mano estan en el pipeline y corren en cada cambio.',
  );

  tabla(
    s,
    [
      ['Frecuencia', 'Actividad', 'Responsable', 'Norma que preserva'],
      ['Cada cambio de codigo', 'Formato, SAST, 132 pruebas, BDD y npm audit', 'Quien integra', 'ISO/IEC 25010'],
      ['Cada cambio de interfaz', 'Playwright y Lighthouse', 'Frontend', 'Ley 20.422'],
      [{ text: 'Semanal', options: { bold: true, color: NARANJA } }, { text: 'npm audit, aunque no haya cambios', options: { bold: true } }, 'Seguridad', 'Ley 21.663'],
      ['Cada release candidato', 'Sondas, Trivy, ZAP y k6', 'Seguridad y rendimiento', 'Ley 21.663 · OWASP'],
      ['Mensual', 'Reconstruir las imagenes base y re-escanear', 'Despliegue', 'Ley 21.663'],
      ['Al salir de localhost', 'HTTPS, rotacion de secretos, revision de CORS', 'Despliegue', 'NFR-SEG-1 · SEG-13'],
    ],
    { y: 1.3, colW: [2.9, 4.9, 2.2, 2.1], fontSize: 12.5 },
  );

  s.addShape(pres.ShapeType.rect, { x: MARGEN, y: 4.3, w: UTIL, h: 1.15, fill: { color: GRIS_CLARO } });
  s.addShape(pres.ShapeType.rect, { x: MARGEN, y: 4.3, w: 0.09, h: 1.15, fill: { color: VERDE } });
  s.addText(
    'Mejora continua, ya implementada: Trivy, ZAP y las sondas estan en el pipeline y corren en cada cambio.',
    { x: MARGEN + 0.4, y: 4.42, w: UTIL - 0.8, h: 0.4, fontFace: FUENTE, fontSize: 15, bold: true, color: NAVY },
  );
  s.addText(
    'Cinco etapas en verde en 2,5 minutos. Entre las tres habrian detectado cinco de los seis defectos en el momento en que se introdujeron.',
    { x: MARGEN + 0.4, y: 4.82, w: UTIL - 0.8, h: 0.45, fontFace: FUENTE, fontSize: 13, color: GRIS },
  );
}

// =====================================================================
// 11 · Reflexion y veredicto  · IE10 (12 %)
// =====================================================================
{
  const s = diapositiva(
    'Reflexion y veredicto',
    '9:20 – 10:00',
    'IE10 · 12 %',
    'Diapo 11. Tres conclusiones. Sobre calidad: 90 % de cobertura y 132 pruebas verdes ' +
      'convivian con seis defectos de seguridad. No es que las pruebas estuvieran mal: ' +
      'verifican el comportamiento del dominio, y estos defectos vivian en capas que ' +
      'ninguna prueba unitaria alcanza. La cobertura mide lineas ejecutadas, no riesgos ' +
      'cubiertos. Sobre seguridad y normativa: Cuidarte+ trata datos de salud, que la ley ' +
      '19.628 define como dato sensible; eso cambia el estandar exigible, porque no basta ' +
      'con que el sistema funcione, tiene que poder demostrar que protege. Veredicto: los ' +
      'seis defectos estan cerrados y verificados con la misma prueba que los encontro, y ' +
      'la version 1.2 cumple el criterio de salida que definimos. Queda abierta, ' +
      'documentada, la exposicion sin TLS, que es una decision de ambiente: hoy corre en ' +
      'localhost. Gracias, quedo atento a sus preguntas.',
  );

  const bloques = [
    {
      titulo: 'Sobre la calidad',
      texto:
        '89,8 % de cobertura y 132 pruebas en verde convivian con seis defectos de seguridad. La cobertura mide lineas ejecutadas, no riesgos cubiertos.',
    },
    {
      titulo: 'Sobre los enfoques',
      texto:
        'Cada enfoque detecto algo que los otros cuatro no podian ver. La cobertura real surge de la combinacion, no de elegir bien una herramienta.',
    },
    {
      titulo: 'Sobre seguridad y normativa',
      texto:
        'Cuidarte+ trata dato sensible de salud. No basta con que el sistema funcione: tiene que poder demostrar que protege, con evidencia fechada.',
    },
  ];

  bloques.forEach((b, i) => {
    const x = MARGEN + i * (UTIL / 3);
    const w = UTIL / 3 - 0.3;
    s.addShape(pres.ShapeType.rect, { x, y: 1.35, w, h: 0.06, fill: { color: NARANJA } });
    s.addText(b.titulo, {
      x,
      y: 1.55,
      w,
      h: 0.45,
      fontFace: FUENTE,
      fontSize: 17,
      bold: true,
      color: NAVY,
    });
    s.addText(b.texto, {
      x,
      y: 2.05,
      w,
      h: 1.6,
      fontFace: FUENTE,
      fontSize: 13.5,
      color: '1F2733',
      valign: 'top',
    });
  });

  s.addShape(pres.ShapeType.rect, { x: MARGEN, y: 4.1, w: UTIL, h: 1.65, fill: { color: NAVY } });
  s.addText('Veredicto', {
    x: MARGEN + 0.45,
    y: 4.28,
    w: UTIL - 0.9,
    h: 0.4,
    fontFace: FUENTE,
    fontSize: 15,
    bold: true,
    color: 'A8B4C2',
  });
  s.addText(
    'Los seis defectos estan cerrados y verificados con la misma prueba que los detecto. ' +
      'La version 1.2 cumple las cinco condiciones del criterio de salida. Queda abierta, documentada, ' +
      'la exposicion sin TLS: es una decision de ambiente, no un defecto del software.',
    {
      x: MARGEN + 0.45,
      y: 4.68,
      w: UTIL - 0.9,
      h: 0.95,
      fontFace: FUENTE,
      fontSize: 15,
      color: BLANCO,
      lineSpacingMultiple: 1.15,
    },
  );

  s.addText('Gracias. Quedo atento a sus preguntas.', {
    x: MARGEN,
    y: 6.0,
    w: UTIL,
    h: 0.5,
    fontFace: FUENTE,
    fontSize: 18,
    bold: true,
    color: NAVY,
    align: 'center',
  });
}

// =====================================================================
await pres.writeFile({ fileName: DESTINO });
const tamano = (fs.statSync(DESTINO).size / 1024).toFixed(0);
console.log('Presentacion generada:');
console.log(`  ${DESTINO}`);
console.log(`  ${pres.slides.length} diapositivas · ${tamano} kB · 16:9`);
console.log('  Con notas del orador tomadas de docs/05_Guion_Oral_EP3.md');
