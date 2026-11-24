# Demostración de extremo a extremo — EP3 Cuidarte+

**Levantar, probar y mostrar.** Esta guía es para el día de la evaluación: qué
escribir, en qué orden, cuánto tarda cada cosa y qué decir mientras corre.

Hay tres recorridos según el tiempo del que dispongas:

| Recorrido | Duración | Cuándo usarlo |
|---|---|---|
| **A · Express** | **~20 segundos** | Durante la defensa, con el ambiente ya levantado |
| **B · Completa** | ~12 minutos | Si el docente pide ver toda la batería |
| **C · Desde cero** | ~25 minutos | Para verificar reproducibilidad en otro equipo |

> **Regla de oro:** nunca ejecutes OWASP ZAP en vivo durante los 10 minutos de
> la defensa. Tarda entre dos y cuatro minutos y no puedes rellenar ese silencio.
> Para ZAP muestra la evidencia ya generada o la ejecución de GitHub Actions.

---

## 0. Antes del día de la evaluación

Esto se hace **una vez**, con calma, no en la sala.

```bash
# 1. Descargar las imágenes pesadas (ZAP son 3,75 GB)
docker pull ghcr.io/zaproxy/zaproxy:stable
docker pull aquasec/trivy:latest
docker pull grafana/k6:latest

# 2. Instalar las herramientas de automatización
cd ev3/automatizacion
npm install
npx playwright install chromium

# 3. Instalar el generador del informe
cd ../scripts
npm install
```

Comprobación de que quedó todo:

```bash
docker images | grep -E "zaproxy|trivy|k6"     # tres líneas
ls ev3/automatizacion/node_modules/playwright  # existe
```

**El día anterior**, deja el ambiente levantado y verificado. Arrancar en frío
delante del docente es un riesgo que no hace falta correr.

---

## 1. Levantar el ambiente

```bash
cd ev3/codigo/cuidarte-plus-v1.2
cp .env.example .env
```

Completa los tres secretos del `.env`. Genera cada uno distinto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

```bash
docker compose up -d --build --wait
docker compose --profile semilla run --rm semilla
```

| Situación | Tiempo |
|---|---|
| Primera vez, construyendo imágenes | 3 a 5 min |
| Con las imágenes ya construidas | ~25 s |
| Solo reiniciar lo que ya existe | ~5 s |

### Comprobación obligatoria

No avances sin esto:

```bash
docker compose ps
curl http://localhost:3000/api/v1/salud
```

Debes ver tres servicios `healthy` y la respuesta
`{"estado":"operativo","version":"1.2.0",...}`.

| Recurso | URL |
|---|---|
| Pantalla | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| Healthcheck | http://localhost:3000/api/v1/salud |

Usuarios, contraseña común `Cuidarte2026!`: `admin1` (administrador),
`medico1`, `medico2`, `paciente1`, `paciente2`.

### Dejar el ambiente en estado limpio

El bloqueo por intentos fallidos (RF-1.3) vive en la base de datos y el
limitador por IP tiene una ventana de 15 minutos. Si ejecutaste la batería hace
poco, **reinicia ambos antes de la demostración**:

```bash
cd ev3/seguridad
bash desbloquear-usuarios.sh
cd ../codigo/cuidarte-plus-v1.2 && docker compose restart api
```

Los dos lanzadores lo hacen solos, pero para la demo express conviene hacerlo a
mano para que nada tarde de más.

---

## 2. Recorrido A — Demo express (~20 segundos)

Tres comandos, en **este orden**. El orden importa: las sondas agotan a
propósito la ventana del limitador de autenticación, así que van al final.

### A.1 · API — 9 segundos

```bash
cd ev3/automatizacion
npm run api
```

**Qué sale:** 26 peticiones, 58 aserciones, 0 fallos.

**Qué decir mientras corre:**
> «Esta es la colección de Postman ejecutada sin interfaz, con Newman. Valida
> los endpoints, los códigos de respuesta y las reglas de autorización
> directamente contra la API. Incluye casos negativos: RUT con dígito
> verificador incorrecto, intento de elegir el rol al registrarse, inyección SQL
> en el formulario de acceso. Todos deben devolver 400 o 403; si alguno
> devolviera 200, la colección falla.»

### A.2 · Interfaz — 6 segundos

```bash
npm run ui
```

**Qué sale:** 7 de 7 casos, con el tiempo de ejecución y la reducción respecto
del equivalente manual.

**Qué decir:**
> «Playwright abre un Chromium real y recorre la aplicación: inicio de sesión,
> listado de pacientes, ficha clínica, registro de un examen, auditoría y cierre
> de sesión. Siete casos, cada uno trazado a un requisito del ERS. El último
> verifica que un paciente no vea el menú de auditoría y solo acceda a su propia
> ficha. Tarda unos seis segundos; hacerlo a mano son unos diez minutos.»

Después del comando, **abre una captura**: `evidencias/v1.2/capturas/`. La más
útil es `ui_05_auditoria-DESPUES.png`, por lo que se explica en A.3.

### A.3 · Seguridad — 4 segundos

```bash
cd ../seguridad
node sondas-seguridad.mjs
```

**Qué sale:** 29 de 29 sondas, agrupadas por enfoque.

**Qué decir:**
> «Veintinueve pruebas negativas sobre la lógica de este sistema, en cuatro
> enfoques: autenticación y sesión, control de acceso, validación de entradas y
> configuración. Esto es lo que ninguna herramienta genérica puede saber, porque
> depende de nuestras reglas: que un paciente solo vea su ficha, que un médico no
> administre usuarios.»

**El remate, con la captura de auditoría en pantalla:**
> «Y esto es lo más gráfico de toda la evaluación. Aquí están las cargas de
> inyección que acabamos de enviar, guardadas en la tabla de auditoría **como
> texto**: `' OR '1'='1' --`, `'; DROP TABLE usuario; --`. Que aparezcan como
> dato y no como instrucción ejecutada demuestra tres cosas a la vez: las
> consultas están parametrizadas, el sistema sobrevivió al `DROP TABLE`, y el
> registro de auditoría deja traza del intento, que es lo que la ley 21.663
> exige para poder reconstruir un incidente.»

---

## 3. Recorrido B — Demo completa (~12 minutos)

Si el docente pide ver toda la batería. Dos comandos.

### B.1 · Automatización — ~3 minutos

```bash
cd ev3/automatizacion
EJECUTOR="Eder Valdivia" bash ejecutar-automatizacion.sh
```

| Paso | Herramienta | Resultado esperado | Tiempo |
|---|---|---|---|
| Preparación | — | Reinicia bloqueos y limitador | ~10 s |
| A0 | Jest + Cucumber | 132 de 132 · 6 de 6 · 89,85 % | ~40 s |
| A2 | Newman | 58 de 58 aserciones | ~5 s |
| A1 | Playwright | 7 de 7 casos | ~8 s |
| A3 | Lighthouse | 100 / 100 / 100 | ~17 s |
| A4 | k6 | 200 usuarios · 0 % error | ~60 s |

El tramo largo es k6: 45 segundos de carga más el arranque del contenedor.
Aprovecha ese minuto para explicar el dimensionamiento:

> «Cada usuario virtual hace una petición por segundo. Con 200 usuarios son
> 12.000 por minuto, que es exactamente el supuesto con el que dimensionamos el
> limitador por IP. Una carga mayor mediría el limitador en vez de la
> aplicación, y los HTTP 429 resultantes se confundirían con fallos.»

### B.2 · Seguridad — ~8 minutos

```bash
cd ../seguridad
EJECUTOR="Eder Valdivia" bash ejecutar-seguridad.sh
```

| Paso | Herramienta | Resultado esperado | Tiempo |
|---|---|---|---|
| S4 | ESLint + Prettier | 0 hallazgos | ~30 s |
| S2 | `npm audit` | 0 en producción | ~15 s |
| S3 | Trivy | API 11 (0 altas) · SPA 1 | ~60 s |
| S5 | OWASP ZAP, SPA y API | 0 FAIL en ambos | **~5 min** |
| S1 | Sondas | 29 de 29 | ~10 s |

---

## 4. Recorrido C — Verificación desde cero (~25 minutos)

Para demostrar que la evidencia es reproducible en otro equipo.

```bash
git clone https://github.com/EderDev138/seguridad-calidad-software-ev3-cuidarte.git
cd seguridad-calidad-software-ev3-cuidarte

# Ambiente
cd codigo/cuidarte-plus-v1.2
cp .env.example .env            # completar los tres secretos
docker compose up -d --build --wait
docker compose --profile semilla run --rm semilla

# Herramientas
cd ../../automatizacion && npm install && npx playwright install chromium

# Baterías
EJECUTOR="Su Nombre" bash ejecutar-automatizacion.sh
cd ../seguridad && EJECUTOR="Su Nombre" bash ejecutar-seguridad.sh
```

Compara el resultado con `evidencias/v1.2/RESULTADOS_EP3.md`. **Si obtienes
números distintos, eso es un hallazgo**: anótalo en vez de ajustar el informe.

---

## 5. Qué mostrar en pantalla, y en qué orden

Ten estas pestañas abiertas **antes** de empezar. Cambiar de ventana buscando un
archivo mientras hablas es lo que arruina una demostración.

| Orden | Qué | Dónde |
|---|---|---|
| 1 | La aplicación funcionando | http://localhost:5173 |
| 2 | Terminal para la demo express | En la carpeta `ev3` |
| 3 | El diagrama de controles | `evidencias/v1.2/capturas/diagrama_controles.png` |
| 4 | La captura de auditoría | `evidencias/v1.2/capturas/ui_05_auditoria-DESPUES.png` |
| 5 | ZAP antes y después | `evidencias/v1.2/seguridad/zap/zap-spa-ANTES.html` y `-DESPUES.html` |
| 6 | El pipeline en verde | [Actions del repositorio](https://github.com/EderDev138/seguridad-calidad-software-ev3-cuidarte/actions) |

### El contraste de ZAP, que es la diapositiva más persuasiva

Abre los dos informes HTML lado a lado:

| | ANTES | DESPUÉS |
|---|---|---|
| Fallos | **2** | **0** |
| Avisos | 2 | 1 |
| Reglas aprobadas | 64 | **67** |

> «Los dos fallos eran la ausencia de `X-Content-Type-Options` y de
> `Permissions-Policy`, pero no en la página principal: **en los archivos
> estáticos**. La causa es que en nginx, cuando un bloque `location` declara una
> cabecera, reemplaza las heredadas en vez de ampliarlas. Nuestra configuración
> parecía correcta y por eso ninguna revisión de código lo detectó. Para verlo
> hay que pedir el archivo y mirar la respuesta.»

### El pipeline, para cerrar

> «Y esto ya no es una propuesta. Las tres puertas que la EP2 declaraba y nunca
> ejecutaba —Trivy, ZAP y las sondas— están en el pipeline y corren en cada
> cambio, en dos minutos y medio. Entre las tres habrían detectado cinco de los
> seis defectos en el momento en que se introdujeron.»

---

## 6. Si algo falla en vivo

Que algo falle no es el problema; quedarse en blanco sí. Ten esto a mano.

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `HTTP 429` al iniciar sesión | El limitador o el bloqueo por cuenta están activos. **Es un control funcionando** | Dilo en voz alta: «esto es RF-1.3 haciendo su trabajo». Ejecuta `bash seguridad/desbloquear-usuarios.sh` y `docker compose restart api` |
| Las sondas abortan con «no fue posible autenticar» | Falta la semilla | `docker compose --profile semilla run --rm semilla` |
| Playwright no encuentra el navegador | Falta el Chromium | `npx playwright install chromium`. En vivo, salta a la evidencia ya generada |
| ZAP o Trivy: «Access is denied» | Git Bash traduce las rutas de los montajes | Los lanzadores exportan `MSYS_NO_PATHCONV=1`; si lo corres a mano, antepónselo |
| k6 termina con código 99 | Un umbral no se cumplió | **No es un fallo de ejecución**: es el resultado de la prueba. Lee cuál umbral y explícalo |
| `npm audit` termina con código 1 | Hay hallazgos | Lo mismo: es el resultado, no un error |
| Docker no responde | Docker Desktop se durmió | Ábrelo, espera a que diga *running*, y `docker compose up -d --wait` |
| Nada funciona | Lo que sea | **Plan B:** toda la evidencia está en el repositorio y el pipeline está en verde. Muestra `RESULTADOS_EP3.md`, las capturas y la ejecución de Actions. La evidencia regenerable sirve precisamente para esto |

> **El plan B no es una derrota.** Si la demostración falla y respondes
> mostrando evidencia fechada, reproducible y un pipeline en verde, estás
> demostrando justamente lo que la evaluación mide.

---

## 7. Lista de verificación del día

**La noche anterior**

- [ ] `docker compose up -d --wait` y los tres servicios `healthy`
- [ ] Semilla cargada y `curl /api/v1/salud` responde `1.2.0`
- [ ] Demo express ejecutada entera, sin fallos
- [ ] Bloqueos reiniciados después del ensayo
- [ ] Informe `.docx` con la carrera completada en la portada
- [ ] Informe y material de apoyo subidos a AVA

**Diez minutos antes**

- [ ] Docker Desktop abierto y corriendo
- [ ] `docker compose ps` muestra los tres servicios sanos
- [ ] `bash seguridad/desbloquear-usuarios.sh` y `docker compose restart api`
- [ ] Las seis pestañas de la sección 5 abiertas
- [ ] Terminal en la carpeta `ev3`, con la fuente agrandada
- [ ] Notificaciones del sistema silenciadas

**Durante**

- [ ] Ejecutar en el orden A.1 → A.2 → A.3, nunca al revés
- [ ] No ejecutar ZAP ni la batería completa en vivo
- [ ] Cerrar con el plan de mantenimiento y el pipeline: es el 20 % de la nota

---

## 8. Resumen en una pantalla

```
LEVANTAR
  cd ev3/codigo/cuidarte-plus-v1.2
  docker compose up -d --build --wait
  docker compose --profile semilla run --rm semilla
  curl http://localhost:3000/api/v1/salud        -> version 1.2.0

LIMPIAR ANTES DE LA DEMO
  bash ../../seguridad/desbloquear-usuarios.sh
  docker compose restart api

PROBAR Y MOSTRAR  (20 segundos, en este orden)
  cd ../../automatizacion && npm run api         -> 58 de 58 aserciones
                             npm run ui          -> 7 de 7 casos
  cd ../seguridad && node sondas-seguridad.mjs   -> 29 de 29 sondas

MOSTRAR SIN EJECUTAR
  evidencias/v1.2/capturas/diagrama_controles.png
  evidencias/v1.2/capturas/ui_05_auditoria-DESPUES.png
  evidencias/v1.2/seguridad/zap/zap-spa-ANTES.html  vs  -DESPUES.html
  Actions del repositorio: cinco etapas en verde en 2,5 min
```
