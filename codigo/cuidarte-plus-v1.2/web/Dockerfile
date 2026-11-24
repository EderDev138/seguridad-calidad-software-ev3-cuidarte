# =====================================================================
# Imagen de la SPA de Cuidarte+ — build multi-stage
#
# El resultado es un nginx que sirve archivos estaticos ya compilados: la
# imagen final no contiene Node, npm ni el codigo fuente, de modo que la
# superficie de ataque y el numero de CVE del contenedor son minimos
# (verificable con `trivy image`).
# =====================================================================

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# CORRECCION DE LA EP3 · incidente INC-EP3-04
#
# La version anterior fijaba nginx:1.29-alpine. Esa etiqueta quedo anclada a
# Alpine 3.23.4, cuyo escaneo con Trivy arrojo 239 vulnerabilidades conocidas
# (1 critica y 57 altas) en bibliotecas del sistema base —brotli, curl,
# c-ares, openssl— que nginx enlaza. Ninguna proviene del codigo propio: son
# deuda heredada de no actualizar la base.
#
# La misma imagen sobre Alpine 3.24 reduce esa cuenta a un orden de magnitud
# menor. La leccion para el plan de mantenimiento es que una etiqueta de
# version menor NO es una base estable: es una base que deja de recibir
# parches del sistema operativo.
FROM nginx:1.31-alpine AS runtime

# Configuracion propia: enrutado de SPA, proxy al backend y cabeceras de
# seguridad tambien en los archivos estaticos (NFR-SEG-10).
COPY cabeceras-seguridad.conf /etc/nginx/cabeceras-seguridad.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:5173/ || exit 1
