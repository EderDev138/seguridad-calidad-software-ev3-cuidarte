# =====================================================================
# Imagen de la API de Cuidarte+ — build multi-stage
#
# Controles de seguridad del contenedor:
#  * Imagen base alpine minima -> menos paquetes = menos CVE (verificable con
#    `trivy image`).
#  * `npm ci --omit=dev` -> las dependencias de desarrollo no llegan al runtime.
#  * Usuario NO root -> una ejecucion de codigo arbitrario no obtiene root en
#    el contenedor.
#  * HEALTHCHECK -> soporta el objetivo de disponibilidad (NFR-DIS-1/3).
#  * dumb-init como PID 1 -> propaga SIGTERM para el apagado ordenado
#    (NFR-DIS-2, ventana de mantenimiento).
# =====================================================================

FROM node:24-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:24-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache dumb-init \
    && addgroup -S cuidarte && adduser -S cuidarte -G cuidarte

COPY --from=dependencias /app/node_modules ./node_modules
COPY --chown=cuidarte:cuidarte package.json ./
COPY --chown=cuidarte:cuidarte src ./src

# El storage de documentos debe pertenecer al usuario de la aplicacion.
RUN mkdir -p /app/storage-documentos && chown -R cuidarte:cuidarte /app/storage-documentos

# ---------------------------------------------------------------------
# CORRECCION DE LA EP3 · incidente INC-EP3-06
#
# La imagen base node:24-alpine incluye npm, y npm trae empaquetadas sus
# propias copias de undici, brace-expansion y otras librerias. Trivy las
# reporta como vulnerabilidades de la imagen (6 altas en el escaneo previo),
# y `npm audit` NO puede verlas porque no figuran en package.json: no son
# dependencias de la aplicacion, son herramientas del entorno de construccion
# que viajaron al artefacto desplegable.
#
# La aplicacion no necesita ningun gestor de paquetes para ejecutarse: arranca
# con `node src/server.js` y su healthcheck usa `node -e`. Las dependencias ya
# vienen instaladas desde la etapa anterior. Eliminarlos reduce la superficie
# de ataque y elimina esas alertas en su origen, en vez de justificarlas.
#
# Es, ademas, el ejemplo mas claro de por que un solo enfoque de analisis no
# basta: este defecto es invisible para el SAST y para el SCA de dependencias,
# y solo aparece al escanear la imagen.
# ---------------------------------------------------------------------
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm /usr/local/bin/npx \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg

ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_DIR=/app/storage-documentos

USER cuidarte
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/v1/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
