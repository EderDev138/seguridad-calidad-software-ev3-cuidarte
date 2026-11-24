# Mitigación de defectos y plan de mantenimiento — Cuidarte+ v1.2

**Indicadores IE7 (encargo, 20 %) e IE8 (defensa, 20 %).**
Corresponde a los apartados obligatorios 4 y 5 del encargo: «propuestas de
mitigación a defectos identificados» y «propuestas para preservar la calidad del
software y los aspectos normativos y legales».

---

## 1. Defectos identificados en la EP3

Los seis hallazgos salieron de ejecutar, por primera vez sobre este software,
los enfoques que la EP2 había declarado pero no corrido. Ninguno fue detectado
por las 132 pruebas unitarias ni por los 6 escenarios BDD: no es un fallo de esa
batería, es que verifica otra capa.

| ID | Defecto | Criticidad | Detectado por | Estado |
|---|---|---|---|---|
| INC-EP3-01 | Los archivos estáticos de la SPA se servían **sin ninguna cabecera de seguridad** | **Grave** | Sonda SEG-D2 y OWASP ZAP (reglas 10021, 10063) | **Cerrado** |
| INC-EP3-02 | Toda petición con cabecera `Origin` no permitida devolvía **HTTP 500**, incluido el healthcheck público | **Grave** | Sonda SEG-C7 | **Cerrado** |
| INC-EP3-03 | Tres dependencias de producción con avisos publicados después de la EP2 | **Grave** | `npm audit` | **Cerrado** |
| INC-EP3-04 | Imagen de la SPA sobre una base sin parches: 1 crítica y 57 altas | **Grave** | Trivy | **Cerrado** |
| INC-EP3-05 | Respuestas con datos clínicos almacenables en caché; sin aislamiento de origen cruzado | Moderado | OWASP ZAP (reglas 10049, 90004) | **Cerrado** |
| INC-EP3-06 | La imagen de la API llevaba `npm` al ambiente de producción, con 6 vulnerabilidades altas en sus librerías empaquetadas | Moderado | Trivy | **Cerrado** |

### INC-EP3-01 · Cabeceras ausentes en los archivos estáticos

**Qué pasaba.** El bloque `server` de nginx declaraba las seis cabeceras de
NFR-SEG-10 y se asumía que se heredaban. En nginx **no se heredan**: en cuanto
un `location` declara su propio `add_header`, sustituye por completo el conjunto
del nivel superior. Como `location /assets/` añadía su `Cache-Control`, todos
los `.js` y `.css` —es decir, **la totalidad del código que el navegador
ejecuta**— se servían sin `Content-Security-Policy`, sin `X-Frame-Options`, sin
`X-Content-Type-Options` y sin las demás.

**Por qué es grave.** Un archivo JavaScript servido sin `X-Content-Type-Options`
puede ser reinterpretado por el navegador; sin CSP, la política de la aplicación
no acompaña al recurso. El defecto convivía con una configuración que *parecía*
correcta, y por eso ninguna revisión de código lo había detectado: para verlo
hay que pedir el archivo y mirar la respuesta.

**Mitigación aplicada.** Las cabeceras se extrajeron a
`web/cabeceras-seguridad.conf` y se incluyen explícitamente en cada `location`.
La herencia dejó de ser un supuesto.

**Verificación.** Sonda SEG-D2 pasa de FALLA a APRUEBA; ZAP pasa de 2 FAIL-NEW a
**0 FAIL-NEW** y de 64 a 67 reglas aprobadas.

### INC-EP3-02 · Error interno ante un origen no permitido

**Qué pasaba.** El middleware de CORS rechazaba el origen con
`callback(new Error(...))`. Ese error no es un error de dominio, de modo que
llegaba al manejador final y se convertía en un HTTP 500.

**Por qué es grave.** Tres consecuencias medidas: *(a)* cualquiera podía generar
errores 500 a voluntad con solo enviar una cabecera, inundando el log y las
alertas de monitoreo (NFR-DIS-1); *(b)* el código de respuesta atribuía al
servidor un rechazo que es, por definición, una decisión de política del
navegador; *(c)* una petición no autenticada devolvía 500 en vez del 401 que
corresponde, enmascarando el control realmente aplicado.

**Mitigación aplicada.** `callback(null, false)`: la petición sigue su curso sin
emitir las cabeceras `Access-Control-Allow-*`. El navegador bloquea la lectura
—que es lo que CORS debe hacer— y la petición recibe el código que le toca.

**Verificación.** `GET /salud` con origen ajeno: 500 → **200**.
`POST /pacientes` sin token con origen ajeno: 500 → **401**.

### INC-EP3-03 · Dependencias con avisos nuevos

**Qué pasaba.** `npm audit` en octubre daba cero. En noviembre daba tres avisos
en dependencias de producción: `body-parser` (alta), `multer` (alta) y `qs`
(moderada), todos por denegación de servicio.

**Por qué importa.** El código no cambió; cambió lo que se sabe de él. Es el
argumento central del plan de mantenimiento: **un proyecto sin cambios no es un
proyecto sin riesgo nuevo.**

**Mitigación aplicada.** `multer` 2.4.0 → 2.5.0 y actualización de las
transitivas `body-parser` y `qs`.

**Verificación.** `npm audit --omit=dev`: 3 avisos → **0 vulnerabilidades**,
en la API y en la SPA.

### INC-EP3-04 · Base de la imagen de la SPA sin parches

**Qué pasaba.** El `Dockerfile` fijaba `nginx:1.29-alpine`. Esa etiqueta quedó
anclada a Alpine 3.23.4: **239 vulnerabilidades conocidas, 1 crítica
(`CVE-2026-111497`, escritura fuera de límites en el decodificador Brotli) y 57
altas**, en bibliotecas del sistema que nginx enlaza.

**Por qué es grave.** Ninguna proviene del código propio. Es deuda heredada de
no actualizar la base, y el comentario del propio `Dockerfile` afirmaba que la
imagen tenía «el número mínimo de CVE»: una afirmación que nadie había
verificado porque Trivy nunca se había ejecutado.

**Mitigación aplicada.** Base actualizada a `nginx:1.31-alpine` (Alpine 3.24.4).

**Verificación.** Imagen de la SPA: **239 → 1** (0 críticas, 0 altas).

### INC-EP3-05 · Caché de datos clínicos y aislamiento de origen

**Qué pasaba.** Las respuestas de la API eran almacenables en caché y faltaba
`Cross-Origin-Embedder-Policy`.

**Por qué importa.** Toda respuesta de esta API transporta datos de salud, que
la ley 19.628 clasifica como **dato sensible**. Una copia en la caché del
navegador o de un proxy sobrevive al cierre de sesión y queda al alcance de
quien use después el mismo equipo.

**Mitigación aplicada.** `Cache-Control: no-store` en toda respuesta de la API y
en el documento HTML de la SPA; `Cross-Origin-Embedder-Policy: credentialless` y
`Cross-Origin-Opener-Policy: same-origin`. Los archivos con hash en el nombre
conservan caché larga, que no expone ningún dato.

**Verificación.** ZAP: la regla 10049 pasa de «Storable and Cacheable Content» a
**«Non-Storable Content»**; la regla 90004 pasa a PASS.

### INC-EP3-06 · El gestor de paquetes viajaba al ambiente de producción

**Qué pasaba.** La imagen base `node:24-alpine` incluye `npm`, y `npm` empaqueta
sus propias copias de `undici`, `brace-expansion` y otras librerías. Trivy
reportaba **6 vulnerabilidades altas** en ellas.

**Por qué es interesante.** `npm audit` **no puede verlas**: no figuran en
`package.json`. No son dependencias de la aplicación, son herramientas del
entorno de construcción que viajaron al artefacto desplegable. Es el ejemplo más
claro de por qué un solo enfoque de análisis no basta.

**Mitigación aplicada.** La imagen de ejecución elimina `npm`, `npx` y `yarn`.
La aplicación no los necesita: arranca con `node src/server.js` y su healthcheck
usa `node -e`.

**Verificación.** La sección «Node.js (node-pkg)» desaparece del informe de
Trivy: **19 hallazgos → 0**.

---

## 2. Resultado consolidado de la mitigación

| Medida | Antes | Después |
|---|---|---|
| Sondas de seguridad aprobadas | 27 de 29 | **29 de 29** |
| OWASP ZAP sobre la SPA · FAIL-NEW | 2 | **0** |
| OWASP ZAP sobre la SPA · reglas aprobadas | 64 | **67** |
| OWASP ZAP sobre la API · FAIL-NEW | 0 | **0** |
| `npm audit` producción (API) | 3 avisos (2 altas) | **0** |
| Trivy · imagen de la SPA | 239 (1 crítica, 57 altas) | **1 (0 críticas, 0 altas)** |
| Trivy · imagen de la API | 33 (8 altas) | **11 (0 altas)** |
| Pruebas Jest | 132 de 132 | **132 de 132** |
| Escenarios BDD | 6 de 6 | **6 de 6** |

Ninguna corrección rompió nada: la regresión heredada de la EP2 sigue verde.
Esa es la razón de ejecutarla **después** de cada cambio y no solo antes.

---

## 3. Plan de mantenimiento

Objetivo: preservar calidad, seguridad y cumplimiento normativo en las
iteraciones futuras del producto. El plan responde a cuatro preguntas por cada
actividad: **cuándo, quién, qué se re-ejecuta y qué evidencia deja.**

### 3.1 Actividades por frecuencia

| Frecuencia | Actividad | Responsable | Evidencia | Criterio que preserva |
|---|---|---|---|---|
| **Cada cambio de código** | `npm run verify` en `api/` (formato, ESLint, Jest con cobertura, BDD, `npm audit`) | Quien integra el cambio | Salida del pipeline | ISO/IEC 25010 · NFR-CAL-1 a 5 |
| **Cada cambio de interfaz** | `npm run ui` (Playwright) y `npm run nofuncional` (Lighthouse) | Responsable de frontend | `Anexo_A1`, `Anexo_A3` | Ley 20.422 · NFR-USAB |
| **Cada cambio de API** | `npm run api` (colección Postman con Newman) | Responsable de backend | `Anexo_A2` | ISO/IEC 29119 |
| **Semanal** | `npm audit` en API y SPA, aunque no haya cambios | Rol de seguridad del equipo | `Anexo_S2` fechado | Ley 21.663 |
| **Cada candidato a release** | `bash ejecutar-seguridad.sh` completo (sondas, Trivy, ZAP, SAST) | Rol de seguridad del equipo | Carpeta `evidencias/<version>/seguridad/` | Ley 21.663 · OWASP |
| **Cada candidato a release** | `npm run carga` (k6, 200 usuarios) y comparación con los umbrales del ERS | Rol de rendimiento | `Anexo_A4` | NFR-PERF-1/2/3 |
| **Mensual** | Reconstrucción de las imágenes base y nuevo escaneo con Trivy | Rol de despliegue | `Anexo_S3` fechado | Ley 21.663 |
| **Trimestral** | Revisión de hallazgos abiertos y de la normativa aplicable | Equipo completo | Acta breve | Ley 19.628 / 21.719 |
| **Antes de salir de localhost** | HTTPS obligatorio, rotación de `JWT_SECRET` y `POSTGRES_PASSWORD`, revisión de `CORS_ORIGENES` | Rol de despliegue | Lista de verificación de despliegue | NFR-SEG-1 · NFR-SEG-13 |

> **La actividad semanal es la que más cuesta defender y la más importante.**
> INC-EP3-03 demuestra por qué: el código no había cambiado desde octubre y, aun
> así, aparecieron dos vulnerabilidades altas en dependencias de producción. Un
> plan que solo re-ejecute controles «cuando se toca el código» no las habría
> visto.

### 3.2 Automatización del plan: incorporar las puertas que faltan al pipeline

La EP2 dejó cinco de las nueve etapas activas en GitHub Actions. El plan de
mantenimiento propone incorporar las cuatro restantes, por orden de valor
respecto del esfuerzo:

| Prioridad | Etapa | Qué hace falta | Beneficio |
|---|---|---|---|
| 1 | **Trivy** sobre las dos imágenes | Nada: corre en el propio runner | Habría detectado INC-EP3-04 y INC-EP3-06 en octubre |
| 2 | **OWASP ZAP baseline** | Levantar el `docker compose` en el runner | Habría detectado INC-EP3-01 y INC-EP3-05 |
| 3 | **Sondas de seguridad** | Lo mismo que ZAP | Habría detectado INC-EP3-02 |
| 4 | **SonarQube** | Servidor y token de servicio | Deuda técnica y duplicación; el de menor urgencia |

Las tres primeras no requieren servicios externos y cubren cinco de los seis
hallazgos de esta EP3.

> **Estado: implementado.** Las tres puertas están en
> `.github/workflows/calidad-y-seguridad-ep3.yml` y se ejecutan en cada cambio.
> El workflow levanta el ambiente completo en el runner, carga la semilla y
> aplica las sondas, la colección de Postman y los dos escaneos de ZAP; en
> paralelo construye las dos imágenes y las escanea con Trivy. Una puerta en
> rojo detiene el pipeline, de modo que el criterio de salida de §3.3 deja de
> depender de que alguien se acuerde de ejecutar la batería.
>
> Lighthouse y k6 **no** se incorporaron, y la razón está documentada en el
> propio workflow: sus umbrales miden rendimiento percibido y no son
> comparables entre ejecuciones en un runner compartido. Siguen como actividad
> de ambiente local. Declarar en el pipeline una medición que no se puede
> sostener sería repetir exactamente el error que esta EP3 corrige.

### 3.3 Criterio de salida a producción

El software **no se autoriza** mientras exista alguna de estas condiciones:

1. Una puerta automatizada en rojo sin excepción documentada y con plazo.
2. Una vulnerabilidad **crítica o alta** en dependencias de producción o en las
   imágenes de contenedor.
3. Un hallazgo de ZAP clasificado como FAIL según `.zap/rules.tsv`, que son las
   reglas trazadas a un requisito del ERS.
4. Cobertura de líneas por debajo del umbral de `jest.config.js`.
5. Exposición fuera de `localhost` sin TLS, sin secretos rotados y sin
   `CORS_ORIGENES` revisado.

**Estado actual de la v1.2:** las cinco condiciones se cumplen. Las seis
vulnerabilidades detectadas en esta EP3 están cerradas y verificadas. Queda
abierta, como deuda conocida y documentada, la exposición sin TLS, que es una
decisión de ambiente y no de software: el ambiente QA corre en `localhost`.

### 3.4 Lo que no se automatiza y por qué

| Actividad | Por qué sigue siendo manual |
|---|---|
| Revisión de accesibilidad con lector de pantalla | Lighthouse verifica 17 criterios automatizables; WCAG 2.1 AA tiene más de 50, y los restantes exigen juicio humano |
| Revisión de la base legal del tratamiento de datos | Ninguna herramienta decide si una finalidad es legítima |
| Revisión del modelo de amenazas ante un requisito nuevo | Es un ejercicio de diseño, no de verificación |
| Validación de que los datos de QA no son datos reales | Control de proceso, no de código: la ley 19.628 lo exige y la semilla lo documenta |

Decir qué **no** cubre la automatización es parte del plan. Un plan que afirme
cubrirlo todo describe un sistema que no existe.
