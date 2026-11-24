# Resultados de la ejecución — EP3 Cuidarte+ v1.2

**Fecha de ejecución:** 23 de noviembre de 2026
**Ejecutor:** Eder Valdivia
**Ambiente:** Docker local · API `http://localhost:3000/api/v1` · SPA `http://localhost:5173`
**Versión bajo prueba:** Cuidarte+ v1.2 (derivada de la v1.1 de la EP2)

Todas las cifras de este archivo salen de los anexos de esta misma carpeta.
Cada anexo lleva su encabezado con fecha, ejecutor y herramienta, y se regenera
con un comando (ver `docs/07_Paso_a_Paso_Reproducir_EP3.md`).

Las columnas **ANTES** y **DESPUÉS** corresponden a la ejecución previa y
posterior a las correcciones de la EP3, sobre el mismo software y con las mismas
herramientas.

---

## 1. Pruebas de seguridad

| Enfoque | Herramienta | Qué detecta | ANTES | DESPUÉS | Anexo |
|---|---|---|---|---|---|
| Análisis estático (SAST) | ESLint + `eslint-plugin-security` | Patrones inseguros en el código propio | 0 hallazgos | **0 hallazgos** | `S4` |
| Accesibilidad estática | ESLint `jsx-a11y` | Defectos de accesibilidad en la SPA | 0 hallazgos | **0 hallazgos** | `S4` |
| Dependencias (SCA) | `npm audit` | CVE en librerías declaradas | 3 avisos en producción (2 altas) | **0** | `S2` |
| Imagen de contenedor | Trivy | CVE del sistema base y de la imagen | API 33 (8 altas) · SPA 239 (1 crítica, 57 altas) | **API 11 (0 altas) · SPA 1 (0 altas)** | `S3` |
| Dinámico (DAST) · SPA | OWASP ZAP baseline | Lo que el servidor emite en ejecución | 2 FAIL · 2 WARN · 64 PASS | **0 FAIL · 1 WARN · 67 PASS** | `zap/` |
| Dinámico (DAST) · API | OWASP ZAP baseline | Cabeceras y fugas de la API | 0 FAIL · 1 WARN · 67 PASS | **0 FAIL · 1 WARN · 67 PASS** | `zap/` |
| Pruebas dirigidas | Sondas propias (29 casos) | Lógica de negocio: quién puede qué | 27 de 29 | **29 de 29** | `S1` |

### Detalle de las sondas por enfoque

| Enfoque | Casos | ANTES | DESPUÉS |
|---|---|---|---|
| A · Autenticación y sesión | SEG-A1 a SEG-A6 | 6 de 6 | **6 de 6** |
| B · Control de acceso | SEG-B1 a SEG-B7 | 7 de 7 | **7 de 7** |
| C · Validación de entradas | SEG-C1 a SEG-C11 | 10 de 11 | **11 de 11** |
| D · Configuración y exposición | SEG-D1 a SEG-D5 | 4 de 5 | **5 de 5** |

Los dos casos que fallaban eran **SEG-C7** (petición de origen ajeno respondía
HTTP 500 en vez de 401) y **SEG-D2** (archivos estáticos servidos sin cabeceras
de seguridad).

---

## 2. Pruebas automatizadas

| Tipo | Herramienta | Alcance | Resultado | Duración | Anexo |
|---|---|---|---|---|---|
| Unitarias e integración | Jest | 132 pruebas, 6 suites | **132 de 132** · 89,85 % de líneas | ~25 s | `A0` |
| Comportamiento (BDD) | Cucumber | 6 escenarios, 34 pasos | **6 de 6** · 34 de 34 pasos | ~14 s | `A0` |
| API REST | Postman + Newman | 26 peticiones, 58 aserciones | **58 de 58** · 0 fallos | **4,3 s** | `A2` |
| Interfaz de usuario | Playwright | 7 casos trazados al ERS | **7 de 7** | **8,4 s** | `A1` |
| No funcional | Lighthouse | 4 categorías, 17 criterios de accesibilidad | **Rendimiento 100 · Accesibilidad 100 · Buenas prácticas 100 · SEO 91** | 15,4 s | `A3` |
| Carga | k6 | 200 usuarios concurrentes, 45 s | **7.414 iteraciones · 0,00 % de error** | 46,0 s | `A4` |

### Umbrales del ERS verificados por k6

| Escenario | Requisito | Umbral | Medido | Veredicto |
|---|---|---|---|---|
| Exámenes de un paciente | NFR-PERF-1 | p95 ≤ 300 ms | **127 ms** | CUMPLE |
| Listado de pacientes | NFR-PERF-2 | p95 ≤ 2000 ms | **84 ms** | CUMPLE |
| Healthcheck | NFR-DIS-3 | p95 ≤ 300 ms | **44 ms** | CUMPLE |
| Concurrencia | NFR-PERF-3 | 200 usuarios | **200** | CUMPLE |
| Tasa de error | NFR-DIS-1 | < 1 % | **0,00 %** | CUMPLE |

Comparación con la medición de la EP2 (12 de octubre de 2026): el escenario de
exámenes pasó de p95 = 222 ms a **127 ms**, y el listado de 265 ms a **84 ms**.
La mejora no es fruto de una optimización deliberada: es el efecto de la
actualización de dependencias y de la imagen base.

### Impacto de la automatización (IE5 / IE6)

| Prueba | Ejecución automatizada | Equivalente manual estimado | Reducción |
|---|---|---|---|
| 7 casos de interfaz | 8,4 s | ~10,5 min (90 s por caso) | **98,7 %** |
| 58 aserciones de API | 4,3 s | ~29 min (30 s por aserción) | **99,8 %** |
| 17 criterios de accesibilidad | 15,4 s | 2 a 3 horas de revisión | **99,8 %** |
| 7.414 peticiones con 200 usuarios | 46,0 s | No reproducible a mano | — |

> El argumento de fondo no es el ahorro de tiempo sino la **frecuencia**: una
> prueba manual de diez minutos se ejecuta una vez y se abandona; una de nueve
> segundos se ejecuta en cada cambio.

---

## 3. Defectos detectados y su cierre

| ID | Defecto | Criticidad | Detectado por | Estado |
|---|---|---|---|---|
| INC-EP3-01 | Archivos estáticos servidos sin cabeceras de seguridad | Grave | SEG-D2 · ZAP 10021, 10063 | **Cerrado** |
| INC-EP3-02 | HTTP 500 ante cabecera `Origin` no permitida | Grave | SEG-C7 | **Cerrado** |
| INC-EP3-03 | 3 dependencias de producción con avisos nuevos | Grave | `npm audit` | **Cerrado** |
| INC-EP3-04 | Imagen de la SPA con base sin parches (1 crítica, 57 altas) | Grave | Trivy | **Cerrado** |
| INC-EP3-05 | Datos clínicos almacenables en caché; sin COEP | Moderado | ZAP 10049, 90004 | **Cerrado** |
| INC-EP3-06 | `npm` incluido en la imagen de producción (6 altas) | Moderado | Trivy | **Cerrado** |

Ninguno fue detectado por las 132 pruebas unitarias ni por los 6 escenarios BDD.
No es una falla de esa batería: verifica el comportamiento del dominio, y estos
defectos viven en la configuración del servidor, en las dependencias y en la
imagen de contenedor.

---

## 4. Índice de anexos

### Seguridad — `seguridad/`

| Anexo | Archivo | Contenido |
|---|---|---|
| S1 | `Anexo_S1_sondas-seguridad-{ANTES,DESPUES}.txt` | 29 sondas dirigidas en 4 enfoques |
| S2 | `Anexo_S2_npm-audit-{ANTES,DESPUES}.txt` | Análisis de dependencias de API y SPA |
| S3 | `Anexo_S3_trivy-imagenes-{ANTES,DESPUES}.txt` | Escaneo de las dos imágenes de contenedor |
| S4 | `Anexo_S4_sast-eslint-{ANTES,DESPUES}.txt` | Análisis estático y consistencia de formato |
| — | `zap/zap-spa-{ANTES,DESPUES}.html` | Informe navegable de ZAP sobre la SPA |
| — | `zap/zap-api-{ANTES,DESPUES}.html` | Informe navegable de ZAP sobre la API |
| — | `zap/*-consola.txt` y `*.md` | Salida de consola y resumen de cada escaneo |
| — | `zap/rules.tsv` | Reglas del escaneo, trazadas a requisitos del ERS |

### Automatización — `automatizacion/`

| Anexo | Archivo | Contenido |
|---|---|---|
| A0 | `Anexo_A0_jest-y-bdd-DESPUES.txt` | Jest con cobertura y escenarios Cucumber |
| A1 | `Anexo_A1_playwright-ui-{ANTES,DESPUES}.txt` | 7 casos de interfaz |
| A2 | `Anexo_A2_newman-api-{ANTES,DESPUES}.txt` | 26 peticiones y 58 aserciones |
| A3 | `Anexo_A3_lighthouse-{ANTES,DESPUES}.txt` | Rendimiento y accesibilidad |
| — | `lighthouse-spa-{ANTES,DESPUES}.html` | Informe navegable de Lighthouse |
| A4 | `Anexo_A4_k6-carga-{ANTES,DESPUES}.txt` | Prueba de carga con 200 usuarios |

### Figuras — `capturas/`

| Archivo | Contenido |
|---|---|
| `diagrama_controles.png` / `.svg` | Diagrama de controles de seguridad automatizados (IE3) |
| `ui_01_acceso-*.png` | Pantalla de acceso |
| `ui_02_pacientes-*.png` | Listado de pacientes con filtro aplicado |
| `ui_03_examenes-*.png` | Ficha clínica de un paciente |
| `ui_04_examen-creado-*.png` | Examen registrado desde la interfaz |
| `ui_05_auditoria-*.png` | Registro de auditoría con la acción recién ejecutada |
| `ui_06_paciente-*.png` | Vista del rol PACIENTE, sin menú de auditoría |

---

## 5. Advertencias sobre la lectura de los anexos

- **`npm audit` devuelve 1 y k6 devuelve 99 cuando hay hallazgos o umbrales
  incumplidos.** No es un fallo de ejecución: es el resultado de la prueba.
- **El HTTP 429 es un control funcionando.** El limitador de autenticación y el
  bloqueo por cuenta (RF-1.3) se activan a propósito durante la sonda SEG-A6.
  Por eso esa sonda se ejecuta al final de la batería.
- **La sonda SEG-D2 cita el nombre del archivo con hash** (`index-ChxVu1Vz.js`).
  Ese nombre cambia con cada compilación de la SPA; lo que se verifica es el
  archivo que la página realmente carga, no uno fijo.
- **Los anexos no contienen secretos.** Las credenciales que aparecen son las de
  la semilla de QA, públicas a propósito y válidas solo en `localhost`.
