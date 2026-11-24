# Comparación: nuestra EV2, el ejemplo Atlas y lo que exige la EP3

**Caso B — Cuidarte+** · ISY1102 · Sección 003V
Eder Valdivia · Marcelo Morales · Docente: Mauricio Andrés Velásquez Silva

Este documento responde a la pregunta con la que empezó el trabajo: **qué nos
falta.** Compara tres cosas —lo que entregamos en la EP2, lo que hizo el grupo
de Atlas en su EP3 y lo que el encargo oficial exige— y de ahí sale la lista de
lo que se implementó en esta carpeta.

---

## 1. Las fuentes y cuál manda

| Documento | Qué es | Peso para esta entrega |
|---|---|---|
| `EP3_ISY1102_Estudiante Presentación.pdf` | Pauta oficial de la **defensa** (24 %) | **Fuente de verdad** de lo oral |
| `Script_Presentacion.pdf` | Pauta oficial del **encargo** (11 %) | **Fuente de verdad** del informe |
| `Guia_Paso_a_Paso_EP3.pdf` | Guía de apoyo del docente | Mapa, no contrato |
| `Laminas-EFT.pdf` | Evaluación Final Transversal | **No aplica a la EP3** |

Los dos PDF de pauta coinciden en los cinco indicadores (IE1/IE2 30 %,
IE5/IE6 24 %, IE7/IE8 20 %, IE3/IE4 14 %, IE9/IE10 12 %). Donde la guía
discrepa, manda la pauta.

### Tres trampas de la guía, verificadas

**a) El índice de seis secciones no reemplaza los cinco apartados.** La guía
muestra una «plantilla oficial» de seis secciones (introducción, criterios,
plan, casos, ejecución, mejora). El encargo exige **cinco contenidos con título
propio**: ajustes de EP1/EP2, resultados de seguridad, resultados de
automatización, mitigación de defectos y preservación de calidad/normativa.
Armar el informe solo con el índice de la guía deja fuera los apartados que se
califican. Nuestro informe lleva los cinco, numerados, y además la estructura
larga heredada de la EP2.

**b) `Laminas-EFT.pdf` es de otra evaluación.** Está en la misma carpeta, pero
describe nueve apartados, archivo `ET_SECCION_GRUPO_X.pdf`, Arial 14 y
ponderación 8 % + 32 %. La EP3 es Arial 12 en títulos / 11 en cuerpo y
11 % + 24 %. Copiar ese formato es perder puntos de forma evitable.

**c) Las herramientas sugeridas no son obligatorias, pero su *función* sí.** La
guía nombra Cypress/Playwright, Postman y Lighthouse. Lo que la rúbrica evalúa
es que se reconozca **qué detecta cada enfoque**. Nosotros usamos exactamente
esas tres —más ZAP, Trivy, npm audit y k6— y en el informe cada una aparece con
su función, no solo con su nombre.

---

## 2. Qué ya teníamos de la EP2 y qué le faltaba

El repositorio `seguridad-calidad-software-ev2` dejó una base sólida, pero
orientada a **detectar defectos sembrados**, que es lo que pedía la EP2. La EP3
pide otra cosa: **optimizar el aseguramiento** sobre el software ya corregido.

| Capacidad | EP2 (v1.1) | Qué exige la EP3 | Brecha |
|---|---|---|---|
| Pruebas unitarias e integración | 132 pruebas Jest, 89,8 % líneas | Se mantiene como regresión | Ninguna |
| BDD (Cucumber) | 6 escenarios, 34 pasos | Se mantiene | Ninguna |
| SAST (ESLint + plugin security) | Ejecutado | Se mantiene y se re-ejecuta | Ninguna |
| SCA de dependencias (npm audit) | Ejecutado | Re-ejecución con fecha EP3 | **Avisos nuevos** |
| Rendimiento | Script propio + JMeter `.jmx` | Prueba de carga automatizada | Herramienta estándar |
| **DAST (OWASP ZAP)** | **Definido en el pipeline, nunca ejecutado** | Ejecución con evidencia | **Faltaba por completo** |
| **Escaneo de imagen (Trivy)** | **Definido, nunca ejecutado** | Ejecución con evidencia | **Faltaba por completo** |
| **Pruebas de interfaz automatizadas** | **No existían** | Cypress/Playwright | **Faltaba por completo** |
| **Colección de API (Postman)** | **No existía** | Postman/Newman | **Faltaba por completo** |
| **Auditoría no funcional (Lighthouse)** | Script de contraste propio | Lighthouse | **Faltaba por completo** |
| **Diagrama de controles ↔ normativa** | **No existía** | IE3 = 14 % | **Faltaba por completo** |
| **Plan de mantenimiento** | **No existía** | IE7 = 20 % | **Faltaba por completo** |

> **El hallazgo más importante de esta comparación:** la EP2 *declaraba* ZAP y
> Trivy en el workflow de CI, con el argumento de que requerían servicios
> externos. Eso es defendible como diseño, pero la EP3 evalúa **evidencia
> ejecutada**. Un control declarado y nunca corrido no vale puntos en IE1 ni en
> IE6, y —más importante— no detecta nada. Al ejecutarlos por primera vez en
> esta EP3 aparecieron cuatro defectos reales que el pipeline declarado habría
> encontrado hace un mes.

---

## 3. Qué hizo el grupo de Atlas y qué tomamos de ahí

El repositorio `seguridad-calidad-software-ev3-atlas` es un buen modelo de
**organización del entregable**. Lo que adoptamos y lo que hicimos distinto:

| Aspecto | Atlas | Cuidarte+ (nosotros) | Por qué |
|---|---|---|---|
| Documento de trampas de la guía | Sí | Sí, adaptado | La guía es la misma para todos |
| Carpetas `seguridad/` y `automatizacion/` | Sí | Sí | Separa enfoque estático de dinámico |
| Evidencia con fecha y ejecutor | Sí | Sí, en cada anexo | Trazabilidad (IE9) |
| Automatización de interfaz | Playwright, 1 flujo | Playwright, **7 casos trazados al ERS** | La rúbrica pide casos, no un recorrido |
| Pruebas de API | `probar.ps1` (PowerShell) | **Colección Postman + Newman** | La guía nombra Postman; además es portable |
| Carga | k6, 200 VU | k6, 200 VU con **umbrales del ERS como `thresholds`** | La prueba falla sola si se incumple |
| DAST | ZAP baseline, antes/después | ZAP baseline **sobre SPA y API**, antes/después | La API también se expone |
| No funcional | Lighthouse «si cabe» | **Lighthouse ejecutado**, con umbrales | IE5 pide eficiencia demostrada |
| Diagrama | Mermaid + PNG | Mermaid + **PNG generado por script** | Reproducible, no dibujado a mano |
| Mitigación | Cabeceras nginx (8 → 4 avisos) | **4 defectos corregidos y re-verificados** | Más evidencia de impacto |
| Estado final | 3 incidentes graves abiertos | **0 incidentes abiertos de los detectados** | Punto de partida distinto |

### Dos diferencias de fondo

**Atlas partía de un software con incidentes graves abiertos** (p95 de 1,28 s,
CVE altos en Express, sin TLS). Su EP3 es, con razón, un trabajo de
*mitigación parcial con plan*. Nosotros partimos de la v1.1, que cerró sus
catorce incidentes en la EP2, de modo que nuestra EP3 es un trabajo de
**ampliación de cobertura**: aplicar enfoques que nunca se habían aplicado y
corregir lo que aparece.

**Atlas documentó que no podía usar GitHub Actions** (el token no tenía el
scope `workflow`) y justificó scripts locales como puerta de calidad. Nosotros
sí tenemos el pipeline de la EP2, así que el argumento no aplica: lo que
hacemos es **ejecutar localmente las puertas que el pipeline declaraba y no
corría**, y proponer su incorporación efectiva en el plan de mantenimiento.

---

## 4. Lo que se implementó en esta carpeta

| Brecha detectada | Implementación | Evidencia |
|---|---|---|
| Sin DAST ejecutado | `seguridad/ejecutar-seguridad.sh` corre ZAP baseline contra SPA y API | `evidencias/v1.2/seguridad/zap/` |
| Sin escaneo de imagen | Trivy sobre `cuidarte-plus-v12-api` y `-web` | `Anexo_S3_trivy-imagenes-*.txt` |
| Sin pruebas dirigidas de seguridad | `seguridad/sondas-seguridad.mjs`: 29 sondas en 4 enfoques | `Anexo_S1_sondas-seguridad-*.txt` |
| Sin automatización de interfaz | `automatizacion/ui-flujo-playwright.mjs`: 7 casos | `Anexo_A1_playwright-ui-*.txt` + 6 capturas |
| Sin colección de API | `automatizacion/postman/`: 26 peticiones, 58 aserciones | `Anexo_A2_newman-api-*.txt` |
| Sin auditoría no funcional | `automatizacion/lighthouse-spa.mjs` | `Anexo_A3_lighthouse-*.txt` + informe HTML |
| Sin prueba de carga estándar | `automatizacion/carga-k6.mjs` + `carga-k6.js` | `Anexo_A4_k6-carga-*.txt` |
| Sin diagrama de controles | `docs/03_Diagrama_controles.md` + PNG generado | `capturas/diagrama_controles.png` |
| Sin plan de mantenimiento | `docs/04_Mitigacion_y_mantenimiento.md` | — |
| Sin informe EP3 | `docs/06_Informe_EP3_Cuidarte+.md` → `entrega/*.docx` | — |

---

## 5. Prioridad de trabajo según los pesos de la rúbrica

Los pesos se repiten en encargo y defensa, así que ordenan el esfuerzo:

| Peso | Encargo | Defensa | Dónde está en esta carpeta |
|---|---|---|---|
| **30 %** | IE1 enfoques y herramientas de seguridad | IE2 exponerlos | Informe §2 · `docs/05` diapositivas 3-5 |
| **24 %** | IE5 automatización | IE6 evidencia de impacto | Informe §3 · `docs/05` diapositivas 6-9 |
| **20 %** | IE7 plan de mantenimiento | IE8 comunicarlo | Informe §5 · `docs/04` · `docs/05` diapositiva 11 |
| **14 %** | IE3 diagramas | IE4 explicarlos | Informe §2.7 · `docs/03` |
| **12 %** | IE9 documentación | IE10 recursos visuales | Todo `docs/` y `evidencias/` |

El orden de trabajo que de ahí se desprende está en
[`01_Plan_de_pasos_EP3.md`](01_Plan_de_pasos_EP3.md).

---

## 6. Qué no hacer

- No usar la estructura, el formato ni el nombre de archivo de `Laminas-EFT.pdf`.
- No copiar el caso Atlas: nuestro caso es **Cuidarte+**, con pacientes,
  exámenes médicos y documentos clínicos. Los datos de salud cambian el
  encuadre legal (ley 19.628, dato sensible).
- No presentar capturas de la EP2 como «automatización de la EP3». Toda la
  evidencia de esta carpeta tiene fecha de ejecución de noviembre de 2026 y se
  regenera con un comando.
- No declarar cerrado un hallazgo sin su re-ejecución. Cada corrección de esta
  entrega tiene su par `-ANTES` / `-DESPUES`.
- No afirmar que se usó SonarQube o JMeter: están definidos en el proyecto desde
  la EP2, pero **no se ejecutaron** en esta iteración, y así se dice en el
  informe.
