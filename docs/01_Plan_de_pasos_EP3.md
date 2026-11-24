# Plan de pasos — EP3 Cuidarte+

**Grupo:** Eder Valdivia · Marcelo Morales
**Caso B:** Cuidarte+ (sistema de exámenes médicos) · ISY1102 · Sección 003V
**Docente:** Mauricio Andrés Velásquez Silva
**Ponderación:** encargo grupal 11 % + defensa individual 24 % = 35 %

Plan basado en el encargo y la pauta oficiales. La guía paso a paso se usa como
apoyo; las discrepancias están en
[`00_Comparacion_EV2_y_ejemplo_Atlas.md`](00_Comparacion_EV2_y_ejemplo_Atlas.md).

---

## Objetivo de la EP3

Sobre el mismo Cuidarte+ de la EP2, ahora en su versión 1.2:

1. Ejecutar y documentar **pruebas de seguridad**, explicando qué detecta cada
   enfoque (IE1 · 30 %).
2. Incorporar **automatización** funcional y no funcional con ahorro de tiempo y
   recursos demostrable (IE5 · 24 %).
3. Evaluar y proponer un **plan de mantenimiento** ligado a calidad, seguridad y
   normativa (IE7 · 20 %).
4. Elaborar el **diagrama** de integración de controles automatizados con
   criterios normativos y legales (IE3 · 14 %).
5. **Documentar** resultados de automatización y mejora continua (IE9 · 12 %).

Y, como apartado obligatorio del encargo, abrir con los **ajustes de la EP1 y la
EP2** según la retroalimentación recibida.

---

## Punto de partida: qué se hereda de la EP2

| Pieza | Estado al cerrar la EP2 | Qué hace la EP3 con ella |
|---|---|---|
| v1.0 auditada, 14 defectos sembrados | Documentada | Queda como material histórico; no es el SUT |
| v1.1 corregida, 14 incidentes cerrados | 31 de 34 casos aprobados | **Punto de partida de la v1.2** |
| 132 pruebas Jest · 89,8 % de líneas | Verde | Regresión obligatoria en cada cambio |
| 6 escenarios BDD en Gherkin | Verde | Regresión obligatoria |
| ESLint + `eslint-plugin-security` | Verde | Se re-ejecuta como puerta |
| `npm audit` | Verde en octubre | **Se re-ejecuta: aparecen avisos nuevos** |
| OWASP ZAP | Declarado en CI, **nunca ejecutado** | **Se ejecuta por primera vez** |
| Trivy | Declarado en CI, **nunca ejecutado** | **Se ejecuta por primera vez** |
| SonarQube | Declarado, requiere servidor | No se ejecuta; se declara así en el informe |
| JMeter `.jmx` | Artefacto formal, no ejecutado | Se sustituye por k6 en esta iteración |

---

## Orden de trabajo

### Paso 0 — Ambiente (no saltar)

```powershell
cd ev3\codigo\cuidarte-plus-v1.2
copy .env.example .env     # completar los tres secretos
docker compose up -d --build
docker compose --profile semilla run --rm semilla
```

Comprobación: tres contenedores sanos, SPA en `http://localhost:5173`, API en
`http://localhost:3000/api/v1/salud` devolviendo `version 1.2.0`.

### Paso 1 — Ajustes de EP1 y EP2 (apartado 1 del encargo)

1. Revisar la retroalimentación del docente y los incidentes heredados.
2. Decidir por cada punto: cerrado, mitigado o aceptado con plan.
3. Redactar [`02_Ajustes_EP1_EP2.md`](02_Ajustes_EP1_EP2.md) y volcarlo en la
   sección 1 del informe.

### Paso 2 — Pruebas de seguridad (IE1 · 30 %)

Un enfoque no es una herramienta: la herramienta es el instrumento, el enfoque
es **qué clase de defecto puede encontrar**. Se ejecutan cinco:

| Enfoque | Herramienta | Qué ve que las demás no ven |
|---|---|---|
| SAST — análisis estático | ESLint + `eslint-plugin-security` | El código antes de ejecutarlo |
| SCA — dependencias | `npm audit` | Las librerías de terceros |
| SCA — imagen | Trivy | El sistema base que nadie escribió |
| DAST — dinámico | OWASP ZAP baseline | Lo que el servidor realmente envía |
| Pruebas dirigidas | `sondas-seguridad.mjs` | La lógica de negocio: quién puede qué |

```bash
cd ev3/seguridad
EJECUTOR="Su Nombre" bash ejecutar-seguridad.sh ANTES
```

En el informe: tabla enfoque → herramienta → función → hallazgo → criticidad.

### Paso 3 — Automatización (IE5 · 24 %)

```bash
cd ev3/automatizacion
npm install && npx playwright install chromium
EJECUTOR="Su Nombre" bash ejecutar-automatizacion.sh
```

| Tipo | Herramienta | Qué automatiza |
|---|---|---|
| Funcional de interfaz | Playwright | El recorrido del usuario en el navegador |
| Funcional de servicios | Postman + Newman | Los endpoints y sus respuestas |
| No funcional | Lighthouse | Rendimiento percibido y accesibilidad |
| No funcional de carga | k6 | 200 usuarios concurrentes del ERS |
| Regresión | Jest + Cucumber | Lo que la EP2 dejó verificado |

Cada script **mide e imprime su propia duración**, que es la cifra que sostiene
el argumento de eficiencia en el informe y en la defensa.

### Paso 4 — Mitigación de los defectos encontrados

Corregir en la v1.2, volver a construir y **re-ejecutar la batería completa** con
sufijo `DESPUES`. Un hallazgo no está cerrado hasta que la misma prueba que lo
detectó pasa.

### Paso 5 — Diagrama de controles (IE3 · 14 %)

```bash
node ev3/scripts/generar-diagrama.mjs
```

Produce `evidencias/v1.2/capturas/diagrama_controles.png`. La lectura del
diagrama está en [`03_Diagrama_controles.md`](03_Diagrama_controles.md) y hay que
**ensayar su explicación oral**: IE4 evalúa explicarlo, no haberlo dibujado.

### Paso 6 — Mantenimiento (IE7 · 20 %)

[`04_Mitigacion_y_mantenimiento.md`](04_Mitigacion_y_mantenimiento.md): qué se
re-ejecuta, con qué frecuencia, quién responde, qué evidencia deja y qué norma
preserva. Es el segundo indicador de mayor peso y el que más se olvida.

### Paso 7 — Informe (IE9 · 12 %)

[`06_Informe_EP3_Cuidarte+.md`](06_Informe_EP3_Cuidarte+.md) con los **cinco
apartados obligatorios** y la generación del `.docx`:

```bash
node ev3/scripts/generar-informe-docx.mjs
```

Formato de la pauta: Arial 12 en títulos, Arial 11 en cuerpo, interlineado 1,5,
texto justificado y portada con nombre completo de cada integrante, carrera,
sección, docente y fecha.

### Paso 8 — Defensa (24 %)

[`05_Guion_Oral_EP3.md`](05_Guion_Oral_EP3.md): 10 minutos + 5 de preguntas.
**Los dos integrantes deben poder exponer todo el proyecto**, porque el orden lo
define el docente al azar y la nota es individual.

### Paso 9 — Entrega por AVA

Informe en Word o PDF más el material de apoyo, el día de la evaluación.
La lista de verificación está en
[`07_Paso_a_Paso_Reproducir_EP3.md`](07_Paso_a_Paso_Reproducir_EP3.md).

---

## Reparto del trabajo

| Tarea | Responsable principal | Apoyo |
|---|---|---|
| Ambiente, Docker y semilla | Eder Valdivia | Marcelo Morales |
| Pruebas de seguridad y mitigación | Eder Valdivia | Marcelo Morales |
| Automatización funcional y no funcional | Marcelo Morales | Eder Valdivia |
| Diagrama de controles | Marcelo Morales | Eder Valdivia |
| Informe y formato de la pauta | Ambos | — |
| Guion y ensayo de la defensa | Ambos | — |

El reparto organiza la ejecución; **no reparte el conocimiento**. La defensa es
individual y cada integrante responde por el proyecto completo.
