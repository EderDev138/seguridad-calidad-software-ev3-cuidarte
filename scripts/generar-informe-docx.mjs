/**
 * =====================================================================
 * Cuidarte+ v1.2 · EP3 · Generador del informe en Word
 *
 * Convierte `docs/06_Informe_EP3_Cuidarte+.md` en un .docx que cumple los
 * aspectos formales de la pauta:
 *
 *   - Titulos en Arial 12          - Interlineado 1,5
 *   - Cuerpo en Arial 11           - Texto justificado
 *   - Portada con nombre completo de cada integrante, carrera, seccion,
 *     docente y fecha
 *
 * Por que un conversor y no un documento escrito a mano: el informe tiene una
 * sola fuente de verdad, el archivo Markdown. Si se corrige una cifra, se
 * corrige en un lugar y se vuelve a generar. Mantener dos copias del mismo
 * texto garantiza que tarde o temprano digan cosas distintas.
 *
 * Uso:
 *   cd ev3/scripts && npm install && node generar-informe-docx.mjs
 * Salida: entrega/Informe_EP3_Cuidarte+.docx
 * =====================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  PageBreak,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  PageNumber,
} from 'docx';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(AQUI, '..');
const ORIGEN = path.join(BASE, 'docs', '06_Informe_EP3_Cuidarte+.md');
const DESTINO = path.join(BASE, 'entrega', 'Informe_EP3_Cuidarte+.docx');

// --- Datos de la portada ---------------------------------------------
const PORTADA = {
  institucion: 'Duoc UC · Escuela de Informatica y Telecomunicaciones',
  asignatura: 'ISY1102 — Seguridad y Calidad en el Desarrollo de Software',
  evaluacion: 'Evaluacion Parcial N.º 3',
  titulo: 'Optimizando el aseguramiento de la calidad\ny seguridad del software',
  subtitulo: 'Caso B: Cuidarte+ — sistema de examenes medicos',
  integrantes: ['Eder Valdivia', 'Marcelo Morales'],
  // Complete la carrera exacta segun su malla antes de entregar.
  carrera: 'Ingenieria en Informatica',
  seccion: 'Seccion 003V',
  docente: 'Mauricio Andres Velasquez Silva',
  fecha: '23 de noviembre de 2026',
};

const ARIAL = 'Arial';
const CUERPO = 22; // 11 pt, en medios puntos
const TITULO = 24; // 12 pt
const INTERLINEADO = { line: 360, lineRule: 'auto' }; // 1,5 lineas
const NAVY = '13344F';
const GRIS_CABECERA = 'E8EBEE';

// =====================================================================
// 1. Analizador del subconjunto de Markdown que usa el informe
// =====================================================================

/**
 * Divide una linea en fragmentos con su formato (negrita, cursiva, codigo).
 * Resuelve tambien los enlaces `[texto](destino)`, de los que conserva el
 * texto: un .docx impreso no se navega.
 */
function fragmentos(texto) {
  const limpio = texto.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  const partes = [];
  const patron = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let ultimo = 0;
  let encontrado;
  while ((encontrado = patron.exec(limpio)) !== null) {
    if (encontrado.index > ultimo) {
      partes.push({ texto: limpio.slice(ultimo, encontrado.index) });
    }
    const t = encontrado[0];
    if (t.startsWith('**')) partes.push({ texto: t.slice(2, -2), negrita: true });
    else if (t.startsWith('`')) partes.push({ texto: t.slice(1, -1), codigo: true });
    else partes.push({ texto: t.slice(1, -1), cursiva: true });
    ultimo = patron.lastIndex;
  }
  if (ultimo < limpio.length) partes.push({ texto: limpio.slice(ultimo) });
  return partes.length > 0 ? partes : [{ texto: limpio }];
}

function runs(texto, opciones = {}) {
  return fragmentos(texto).map(
    (parte) =>
      new TextRun({
        text: parte.texto,
        bold: parte.negrita || opciones.negrita,
        italics: parte.cursiva || opciones.cursiva,
        font: parte.codigo ? 'Consolas' : ARIAL,
        size: parte.codigo ? CUERPO - 2 : (opciones.tamano ?? CUERPO),
        color: opciones.color,
      }),
  );
}

function parrafo(texto, opciones = {}) {
  return new Paragraph({
    alignment: opciones.alineacion ?? AlignmentType.JUSTIFIED,
    spacing: { ...INTERLINEADO, before: opciones.antes ?? 0, after: opciones.despues ?? 120 },
    children: runs(texto, opciones),
    ...(opciones.extra ?? {}),
  });
}

function titulo(texto, nivel) {
  const niveles = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
  };
  return new Paragraph({
    heading: niveles[nivel] ?? HeadingLevel.HEADING_4,
    alignment: AlignmentType.LEFT,
    spacing: { ...INTERLINEADO, before: nivel <= 2 ? 300 : 200, after: 120 },
    keepNext: true,
    children: [
      new TextRun({
        text: texto.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/\*\*/g, ''),
        bold: true,
        font: ARIAL,
        size: TITULO,
        color: NAVY,
      }),
    ],
  });
}

function celda(texto, { cabecera = false, ancho } = {}) {
  return new TableCell({
    width: ancho ? { size: ancho, type: WidthType.PERCENTAGE } : undefined,
    shading: cabecera
      ? { type: ShadingType.CLEAR, color: 'auto', fill: GRIS_CABECERA }
      : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 276, lineRule: 'auto', before: 0, after: 0 },
        children: runs(texto, { negrita: cabecera, tamano: CUERPO - 2 }),
      }),
    ],
  });
}

function tabla(filas) {
  const columnas = filas[0].length;
  const ancho = Math.floor(100 / columnas);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: 'B4BAC2' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: 'B4BAC2' },
      left: { style: BorderStyle.SINGLE, size: 2, color: 'B4BAC2' },
      right: { style: BorderStyle.SINGLE, size: 2, color: 'B4BAC2' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'D4D9DE' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'D4D9DE' },
    },
    rows: filas.map(
      (fila, i) =>
        new TableRow({
          tableHeader: i === 0,
          children: fila.map((texto) => celda(texto, { cabecera: i === 0, ancho })),
        }),
    ),
  });
}

function bloqueCodigo(lineas) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: 'auto', before: 120, after: 160 },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F4F5F7' },
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D4D9DE' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D4D9DE' },
      left: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D4D9DE' },
    },
    children: lineas.flatMap((linea, i) => [
      ...(i > 0 ? [new TextRun({ break: 1 })] : []),
      new TextRun({ text: linea, font: 'Consolas', size: 18 }),
    ]),
  });
}

function imagen(rutaRelativa, pie) {
  const ruta = path.resolve(BASE, rutaRelativa.replace(/^\.\.\//, ''));
  if (!fs.existsSync(ruta)) {
    return [parrafo(`[No se encontro la figura: ${rutaRelativa}]`, { cursiva: true })];
  }
  // El ancho util de una pagina carta con margenes normales es de 16,5 cm.
  const ANCHO_UTIL = 620;
  const datos = fs.readFileSync(ruta);
  const dimensiones = tamanoPng(datos);
  const alto = Math.round((ANCHO_UTIL * dimensiones.alto) / dimensiones.ancho);
  const salida = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 },
      children: [
        new ImageRun({
          data: datos,
          type: 'png',
          transformation: { width: ANCHO_UTIL, height: alto },
        }),
      ],
    }),
  ];
  if (pie) {
    salida.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: runs(pie, { cursiva: true, tamano: CUERPO - 3, color: '5A6472' }),
      }),
    );
  }
  return salida;
}

/** Lee ancho y alto de la cabecera IHDR de un PNG. */
function tamanoPng(buffer) {
  return { ancho: buffer.readUInt32BE(16), alto: buffer.readUInt32BE(20) };
}

// =====================================================================
// 2. Recorrido del Markdown
// =====================================================================
function convertir(markdown) {
  const lineas = markdown.split(/\r?\n/);
  const hijos = [];
  let i = 0;
  let saltarPortada = true;

  while (i < lineas.length) {
    const linea = lineas[i];

    // El encabezado de nivel 1 y el bloque de portada del .md se reemplazan
    // por la portada formal; se omiten hasta el primer separador.
    if (saltarPortada) {
      if (/^---\s*$/.test(linea)) {
        saltarPortada = false;
      }
      i += 1;
      continue;
    }

    // Separador horizontal
    if (/^---\s*$/.test(linea)) {
      hijos.push(
        new Paragraph({
          spacing: { before: 60, after: 140 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D4D9DE' } },
          children: [new TextRun({ text: '', font: ARIAL, size: 2 })],
        }),
      );
      i += 1;
      continue;
    }

    // Titulos
    const encabezado = linea.match(/^(#{1,6})\s+(.*)$/);
    if (encabezado) {
      hijos.push(titulo(encabezado[2], encabezado[1].length));
      i += 1;
      continue;
    }

    // Imagen con pie opcional en la linea siguiente en cursiva
    const img = linea.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (img) {
      hijos.push(...imagen(img[2], img[1]));
      i += 1;
      continue;
    }

    // Bloque de codigo
    if (/^```/.test(linea)) {
      const bloque = [];
      i += 1;
      while (i < lineas.length && !/^```/.test(lineas[i])) {
        bloque.push(lineas[i]);
        i += 1;
      }
      i += 1;
      hijos.push(bloqueCodigo(bloque));
      continue;
    }

    // Tabla
    if (/^\|/.test(linea) && i + 1 < lineas.length && /^\|[\s:|-]+\|?\s*$/.test(lineas[i + 1])) {
      const filas = [];
      while (i < lineas.length && /^\|/.test(lineas[i])) {
        if (!/^\|[\s:|-]+\|?\s*$/.test(lineas[i])) {
          filas.push(
            lineas[i]
              .replace(/^\|/, '')
              .replace(/\|\s*$/, '')
              .split('|')
              .map((c) => c.trim()),
          );
        }
        i += 1;
      }
      hijos.push(tabla(filas));
      hijos.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
      continue;
    }

    // Cita
    if (/^>\s?/.test(linea)) {
      const bloque = [];
      while (i < lineas.length && /^>/.test(lineas[i])) {
        bloque.push(lineas[i].replace(/^>\s?/, ''));
        i += 1;
      }
      hijos.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { ...INTERLINEADO, before: 120, after: 160 },
          indent: { left: 340 },
          border: { left: { style: BorderStyle.SINGLE, size: 10, color: NAVY } },
          children: runs(bloque.join(' ').trim(), { cursiva: true }),
        }),
      );
      continue;
    }

    // Lista con vinetas
    if (/^\s*[-*]\s+/.test(linea)) {
      while (i < lineas.length && /^\s*[-*]\s+/.test(lineas[i])) {
        const nivel = Math.floor((lineas[i].match(/^\s*/)[0].length || 0) / 2);
        hijos.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { ...INTERLINEADO, after: 60 },
            numbering: { reference: 'vinetas', level: Math.min(nivel, 2) },
            children: runs(lineas[i].replace(/^\s*[-*]\s+/, '')),
          }),
        );
        i += 1;
      }
      continue;
    }

    // Lista numerada
    if (/^\s*\d+\.\s+/.test(linea)) {
      while (i < lineas.length && /^\s*\d+\.\s+/.test(lineas[i])) {
        hijos.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { ...INTERLINEADO, after: 60 },
            numbering: { reference: 'numeros', level: 0 },
            children: runs(lineas[i].replace(/^\s*\d+\.\s+/, '')),
          }),
        );
        i += 1;
      }
      continue;
    }

    // Linea en blanco
    if (linea.trim() === '') {
      i += 1;
      continue;
    }

    // Parrafo: se unen las lineas consecutivas (Markdown las considera una sola)
    const bloque = [];
    while (
      i < lineas.length &&
      lineas[i].trim() !== '' &&
      !/^(#{1,6}\s|\||>|```|---|\s*[-*]\s|\s*\d+\.\s|!\[)/.test(lineas[i])
    ) {
      bloque.push(lineas[i].trim());
      i += 1;
    }
    hijos.push(parrafo(bloque.join(' ')));
  }

  return hijos;
}

// =====================================================================
// 3. Portada
// =====================================================================
function portada() {
  const linea = (texto, opciones = {}) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { ...INTERLINEADO, before: opciones.antes ?? 0, after: opciones.despues ?? 100 },
      children: [
        new TextRun({
          text: texto,
          bold: opciones.negrita ?? false,
          font: ARIAL,
          size: opciones.tamano ?? CUERPO,
          color: opciones.color,
        }),
      ],
    });

  const elementos = [
    linea(PORTADA.institucion, { antes: 1200, tamano: CUERPO, color: '5A6472' }),
    linea(PORTADA.asignatura, { negrita: true, tamano: TITULO, color: NAVY, despues: 600 }),
    linea(PORTADA.evaluacion, { negrita: true, tamano: 32, color: NAVY, despues: 200 }),
  ];

  for (const parte of PORTADA.titulo.split('\n')) {
    elementos.push(linea(parte, { negrita: true, tamano: 28, color: NAVY, despues: 60 }));
  }
  elementos.push(linea(PORTADA.subtitulo, { tamano: TITULO, color: '5A6472', despues: 900 }));

  elementos.push(linea('Integrantes', { negrita: true, tamano: TITULO, color: NAVY, despues: 60 }));
  for (const integrante of PORTADA.integrantes) {
    elementos.push(linea(integrante, { despues: 40 }));
  }

  elementos.push(
    linea(PORTADA.carrera, { antes: 320, despues: 40 }),
    linea(PORTADA.seccion, { despues: 40 }),
    linea(`Docente: ${PORTADA.docente}`, { despues: 40 }),
    linea(PORTADA.fecha, { despues: 0 }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  return elementos;
}

// =====================================================================
// 4. Ensamblado del documento
// =====================================================================
if (!fs.existsSync(ORIGEN)) {
  console.error(`No se encuentra el informe de origen: ${ORIGEN}`);
  process.exit(2);
}
fs.mkdirSync(path.dirname(DESTINO), { recursive: true });

const documento = new Document({
  creator: PORTADA.integrantes.join(' y '),
  title: `Informe EP3 — ${PORTADA.subtitulo}`,
  description: `${PORTADA.asignatura} · ${PORTADA.evaluacion}`,
  styles: {
    default: {
      document: {
        run: { font: ARIAL, size: CUERPO },
        paragraph: { spacing: INTERLINEADO, alignment: AlignmentType.JUSTIFIED },
      },
      heading1: { run: { font: ARIAL, size: TITULO, bold: true, color: NAVY } },
      heading2: { run: { font: ARIAL, size: TITULO, bold: true, color: NAVY } },
      heading3: { run: { font: ARIAL, size: TITULO, bold: true, color: NAVY } },
      heading4: { run: { font: ARIAL, size: TITULO, bold: true, color: NAVY } },
    },
  },
  numbering: {
    config: [
      {
        reference: 'vinetas',
        levels: [0, 1, 2].map((nivel) => ({
          level: nivel,
          format: LevelFormat.BULLET,
          text: ['•', '◦', '▪'][nivel],
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 360 + nivel * 300, hanging: 240 } },
            run: { font: ARIAL, size: CUERPO },
          },
        })),
      },
      {
        reference: 'numeros',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 360, hanging: 240 } },
              run: { font: ARIAL, size: CUERPO },
            },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${PORTADA.asignatura} · ${PORTADA.evaluacion} · `,
                  font: ARIAL,
                  size: 16,
                  color: '7A838F',
                }),
                new TextRun({ children: [PageNumber.CURRENT], font: ARIAL, size: 16, color: '7A838F' }),
              ],
            }),
          ],
        }),
      },
      children: [...portada(), ...convertir(fs.readFileSync(ORIGEN, 'utf8'))],
    },
  ],
});

const buffer = await Packer.toBuffer(documento);
fs.writeFileSync(DESTINO, buffer);
console.log('Informe generado con el formato de la pauta:');
console.log(`  ${DESTINO}`);
console.log(`  ${(buffer.length / 1024).toFixed(0)} kB · Arial 12 titulos / Arial 11 cuerpo ·`);
console.log('  interlineado 1,5 · texto justificado · portada completa');
