# Paso a paso para reproducir la EP3

**Caso B — Cuidarte+ v1.2** · ISY1102 · Sección 003V

Cualquiera debería poder tomar esta carpeta, seguir estos pasos y obtener los
mismos números del informe. Si obtiene resultados distintos, **eso es un
hallazgo**: anótelo, no lo maquille.

---

## 0. Requisitos

| Herramienta | Versión usada | Cómo se obtiene |
|---|---|---|
| Docker Desktop | 29.9.3 | https://www.docker.com |
| Node.js | 22.16.0 (o superior) | https://nodejs.org |
| Git Bash o WSL | — | Para los scripts `.sh` |

Las imágenes de OWASP ZAP (3,75 GB), Trivy (264 MB) y k6 (111 MB) se descargan
la primera vez. Conviene dejarlas bajando antes de empezar:

```bash
docker pull ghcr.io/zaproxy/zaproxy:stable
docker pull aquasec/trivy:latest
docker pull grafana/k6:latest
```

---

## 1. Levantar el ambiente

```bash
cd ev3/codigo/cuidarte-plus-v1.2
cp .env.example .env
```

Complete los tres secretos del `.env`. Genere cada uno con un valor distinto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

```bash
docker compose up -d --build
docker compose --profile semilla run --rm semilla
```

**Comprobación.** No avance sin esto:

```bash
docker compose ps          # tres servicios: db, api, web — los tres healthy
curl http://localhost:3000/api/v1/salud
```

Debe responder `{"estado":"operativo","version":"1.2.0",...}`.

| Recurso | URL |
|---|---|
| SPA | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| Healthcheck | http://localhost:3000/api/v1/salud |

Usuarios de prueba, contraseña común `Cuidarte2026!`: `admin1`, `medico1`,
`medico2`, `paciente1`, `paciente2`.

> Esa credencial es pública a propósito y **solo válida en el ambiente QA
> local**. Está documentada en `api/src/infrastructure/adapters/postgres/seed.sql`.

---

## 2. Instalar las herramientas de automatización

```bash
cd ev3/automatizacion
npm install
npx playwright install chromium
```

Son unos 320 paquetes y un navegador de 91 MB. Solo la primera vez.

---

## 3. Ejecutar la batería de automatización

```bash
cd ev3/automatizacion
EJECUTOR="Su Nombre" bash ejecutar-automatizacion.sh
```

Duración aproximada: **3 minutos**. Qué debe obtener:

| Paso | Herramienta | Resultado esperado |
|---|---|---|
| A0 | Jest + Cucumber | 132 de 132 pruebas · 6 de 6 escenarios · ~89,8 % de líneas |
| A2 | Newman | 26 peticiones · 58 aserciones · 0 fallos · ~5 s |
| A1 | Playwright | 7 de 7 casos · ~9 s · 6 capturas |
| A3 | Lighthouse | Rendimiento 100 · Accesibilidad 100 · Buenas prácticas 100 |
| A4 | k6 | 0 % de error · todos los umbrales cumplidos |

Cada herramienta por separado:

```bash
npm run api          # Postman/Newman
npm run ui           # Playwright
npm run nofuncional  # Lighthouse
npm run carga        # k6
```

---

## 4. Ejecutar la batería de seguridad

```bash
cd ev3/seguridad
EJECUTOR="Su Nombre" bash ejecutar-seguridad.sh
```

Duración aproximada: **6 minutos**, casi todos de los dos escaneos de ZAP.
Qué debe obtener:

| Paso | Herramienta | Resultado esperado |
|---|---|---|
| S4 | ESLint + Prettier | 0 hallazgos en API y SPA |
| S2 | `npm audit` | 0 vulnerabilidades en producción |
| S3 | Trivy | API: 11 (0 altas) · SPA: 1 (0 altas) |
| S5 | OWASP ZAP | SPA y API: 0 FAIL-NEW |
| S1 | Sondas | 29 de 29 aprueban |

---

## 5. Regenerar el diagrama y el informe

```bash
cd ev3/scripts
npm install
node generar-diagrama.mjs        # evidencias/v1.2/capturas/diagrama_controles.png
node generar-informe-docx.mjs    # entrega/Informe_EP3_Cuidarte+.docx
```

El `.docx` sale con Arial 12 en títulos, Arial 11 en cuerpo, interlineado 1,5,
texto justificado y la portada completa. **La fuente de verdad es el Markdown**
de `docs/06_Informe_EP3_Cuidarte+.md`: corrija ahí y vuelva a generar.

---

## 6. Si algo falla

### «HTTP 429» al iniciar sesión

El limitador de autenticación tiene una ventana de 15 minutos y el bloqueo por
cuenta (RF-1.3) vive en la base de datos: **reiniciar el contenedor no lo
limpia**. Ambas cosas son controles funcionando, no errores.

```bash
cd ev3/seguridad
bash desbloquear-usuarios.sh
cd ../codigo/cuidarte-plus-v1.2 && docker compose restart api
```

Los dos lanzadores hacen esto solos antes de empezar.

### Las sondas abortan con «no fue posible autenticar»

Falta la semilla:

```bash
cd ev3/codigo/cuidarte-plus-v1.2
docker compose --profile semilla run --rm semilla
```

### ZAP o Trivy fallan con «mkdir ... Access is denied»

Git Bash está traduciendo las rutas de los montajes de Docker. Anteponga la
variable:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W)":/zap/wrk/:rw ...
```

Los lanzadores ya la exportan.

### k6 termina con código 99

**No es un fallo de ejecución:** es el código con el que k6 avisa de que algún
umbral (`threshold`) no se cumplió. Es el resultado de la prueba y así se
documenta. Lo mismo con `npm audit`, que devuelve 1 cuando hay hallazgos.

### Playwright no encuentra el navegador

```bash
cd ev3/automatizacion && npx playwright install chromium
```

---

## 7. Lista de verificación antes de entregar

### Contenido

- [ ] El informe tiene los **cinco apartados obligatorios** del encargo, cada uno con título propio.
- [ ] El apartado 1 explica los ajustes según la retroalimentación de la EP1 y la EP2.
- [ ] Cada enfoque de prueba de seguridad aparece con **su función**, no solo con el nombre de la herramienta.
- [ ] Los resultados de automatización incluyen **la medición de tiempo** que sostiene el argumento de eficiencia.
- [ ] El diagrama de controles está insertado como figura y se explica en el texto.
- [ ] El plan de mantenimiento dice **cuándo, quién, qué se re-ejecuta y qué norma preserva**.
- [ ] Toda cifra del informe tiene su anexo correspondiente en `evidencias/`.
- [ ] No se afirma haber usado ninguna herramienta que no se ejecutó.

### Formato

- [ ] Títulos en Arial 12, cuerpo en Arial 11.
- [ ] Interlineado 1,5 y texto justificado.
- [ ] Portada con **nombre completo de cada integrante**, carrera, sección, docente y fecha.
- [ ] La **carrera** está completada con el nombre exacto de la malla (está como marcador en el generador).
- [ ] Capturas legibles: las de esta entrega están a 2× de escala.
- [ ] Archivo en Word o PDF. **No** usar el nombre `ET_SECCION_GRUPO_X.pdf`: ese es el formato de la EFT, no de la EP3.

### Entrega y ensayo

- [ ] Informe subido a AVA el día de la evaluación.
- [ ] Material de apoyo de la defensa subido junto al informe.
- [ ] Defensa ensayada por **los dos integrantes**, cada uno sobre el proyecto completo.
- [ ] Banco de preguntas de `05_Guion_Oral_EP3.md` repasado.
- [ ] El ambiente levanta y la batería corre, por si el docente pide una demostración.
