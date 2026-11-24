#!/usr/bin/env bash
# =====================================================================
# Cuidarte+ v1.2 · EP3 · Bateria completa de pruebas de seguridad
#
# Ejecuta los cuatro enfoques del plan y guarda cada salida con su
# encabezado de trazabilidad en ../evidencias/v1.2/seguridad/.
#
#   S1  Sondas dirigidas      (autenticacion, acceso, entradas, config)
#   S2  SCA de dependencias   (npm audit)
#   S3  SCA de imagen         (Trivy)
#   S4  SAST del codigo       (ESLint + eslint-plugin-security)
#   S5  DAST en ejecucion     (OWASP ZAP baseline, SPA y API)
#
# Uso:
#   bash ejecutar-seguridad.sh              # sin sufijo
#   bash ejecutar-seguridad.sh ANTES        # linea base, antes de mitigar
#   bash ejecutar-seguridad.sh DESPUES      # tras aplicar las correcciones
#
# Requisitos: Docker en ejecucion, ambiente levantado y semilla cargada.
# =====================================================================
set -uo pipefail

SUFIJO="${1:-}"
[ -n "$SUFIJO" ] && SUFIJO="-$SUFIJO"
EJECUTOR="${EJECUTOR:-no declarado}"
export MSYS_NO_PATHCONV=1

AQUI="$(cd "$(dirname "$0")" && pwd)"
BASE="$(cd "$AQUI/.." && pwd)"
APP="$BASE/codigo/cuidarte-plus-v1.2"
EV="$BASE/evidencias/v1.2/seguridad"
ZAPDIR="$EV/zap"
mkdir -p "$EV" "$ZAPDIR"
cp -f "$AQUI/zap/rules.tsv" "$ZAPDIR/rules.tsv"

# Ruta en formato Windows para los montajes de Docker Desktop.
ZAPWIN="$(cd "$ZAPDIR" && pwd -W 2>/dev/null || echo "$ZAPDIR")"

paso() { echo; echo "### $* ###"; }

encabezado() {
    echo "====================================================================="
    echo "Cuidarte+ v1.2 · EP3 · $1"
    echo "Herramienta: $2"
    echo "Enfoque    : $3"
    echo "Fecha de ejecucion : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Ejecutor           : $EJECUTOR"
    echo "====================================================================="
    echo
}

# ---------------------------------------------------------------------
# S4 · SAST: analisis estatico del codigo propio
# ---------------------------------------------------------------------
paso "S4 · Analisis estatico (ESLint + eslint-plugin-security)"
{
    encabezado "Anexo S4 · Analisis estatico de seguridad (SAST)" \
        "ESLint con eslint-plugin-security (API) y eslint-plugin-jsx-a11y (SPA)" \
        "revisar el codigo SIN ejecutarlo: inyeccion, eval, innerHTML, accesibilidad"
    echo "--- API · reglas de seguridad ---------------------------------------"
    ( cd "$APP/api" && npx eslint . 2>&1 ); echo "codigo de salida: $?  (0 = sin hallazgos)"
    echo
    echo "--- SPA · reglas de seguridad y accesibilidad -----------------------"
    ( cd "$APP/web" && npx eslint . 2>&1 ); echo "codigo de salida: $?  (0 = sin hallazgos)"
    echo
    echo "--- Consistencia de formato (Prettier) ------------------------------"
    ( cd "$APP/api" && npx prettier --check . 2>&1 | tail -3 ); echo "codigo de salida: $?"
    ( cd "$APP/web" && npx prettier --check . 2>&1 | tail -3 ); echo "codigo de salida: $?"
    echo "====================================================================="
} > "$EV/Anexo_S4_sast-eslint$SUFIJO.txt" 2>&1

# ---------------------------------------------------------------------
# S2 · SCA: dependencias declaradas
# ---------------------------------------------------------------------
paso "S2 · Analisis de dependencias (npm audit)"
{
    encabezado "Anexo S2 · Analisis de dependencias (SCA)" \
        "npm audit (avisos del registro npm)" \
        "librerias de terceros con vulnerabilidades publicadas"
    echo "Criterio: en produccion cualquier severidad bloquea; en desarrollo,"
    echo "solo alta y critica, porque ese codigo no se despliega."
    echo
    for proyecto in api web; do
        echo "--- ${proyecto^^} · dependencias de produccion ----------------------"
        ( cd "$APP/$proyecto" && npm audit --omit=dev --audit-level=low 2>&1 | grep -v "^npm notice" )
        echo "codigo de salida: ${PIPESTATUS[0]:-0}"
        echo
        echo "--- ${proyecto^^} · todas las dependencias ------------------------"
        ( cd "$APP/$proyecto" && npm audit --audit-level=high 2>&1 | tail -20 | grep -v "^npm notice" )
        echo
    done
    echo "====================================================================="
} > "$EV/Anexo_S2_npm-audit$SUFIJO.txt" 2>&1

# ---------------------------------------------------------------------
# S3 · SCA de imagen: lo que npm audit no ve
# ---------------------------------------------------------------------
paso "S3 · Escaneo de imagenes (Trivy)"
TRIVY=(docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache/ aquasec/trivy:latest)
{
    encabezado "Anexo S3 · Escaneo de imagenes de contenedor" \
        "Trivy (analisis de composicion sobre el artefacto desplegable)" \
        "vulnerabilidades del sistema base y de los paquetes de la imagen"
    for imagen in cuidarte-plus-v12-api cuidarte-plus-v12-web; do
        echo "--- Imagen: $imagen:latest ------------------------------------"
        "${TRIVY[@]}" image --scanners vuln --severity LOW,MEDIUM,HIGH,CRITICAL \
            --no-progress "$imagen:latest" 2>&1
        echo
    done
    echo "--- Control: usuario con el que corre la API (no debe ser root) -----"
    docker run --rm --entrypoint id cuidarte-plus-v12-api:latest 2>&1
    echo "====================================================================="
} > "$EV/Anexo_S3_trivy-imagenes$SUFIJO.txt" 2>&1

# ---------------------------------------------------------------------
# S5 · DAST: la aplicacion en ejecucion
# ---------------------------------------------------------------------
paso "S5 · Escaneo dinamico (OWASP ZAP baseline)"
ZAP=(docker run --rm --add-host=host.docker.internal:host-gateway -v "$ZAPWIN":/zap/wrk/:rw ghcr.io/zaproxy/zaproxy:stable)

"${ZAP[@]}" zap-baseline.py -t http://host.docker.internal:5173 \
    -c rules.tsv -r "zap-spa$SUFIJO.html" -w "zap-spa$SUFIJO.md" -I \
    > "$ZAPDIR/zap-spa$SUFIJO-consola.txt" 2>&1
echo "ZAP SPA  -> $(tail -1 "$ZAPDIR/zap-spa$SUFIJO-consola.txt")"

"${ZAP[@]}" zap-baseline.py -t http://host.docker.internal:3000/api/v1/salud \
    -c rules.tsv -r "zap-api$SUFIJO.html" -w "zap-api$SUFIJO.md" -I \
    > "$ZAPDIR/zap-api$SUFIJO-consola.txt" 2>&1
echo "ZAP API  -> $(grep -E '^FAIL-NEW' "$ZAPDIR/zap-api$SUFIJO-consola.txt" | tail -1)"

# ---------------------------------------------------------------------
# S1 · Sondas dirigidas · AL FINAL
#
# La sonda SEG-A6 agota a proposito la ventana del limitador de
# autenticacion. Si se ejecutara antes, todo lo demas recibiria HTTP 429.
# ---------------------------------------------------------------------
paso "S1 · Sondas dirigidas de seguridad"
bash "$AQUI/desbloquear-usuarios.sh" > /dev/null 2>&1
( cd "$APP" && docker compose restart api > /dev/null 2>&1 )
curl -s --retry 30 --retry-delay 1 --retry-connrefused --retry-all-errors -m 60 -o /dev/null http://localhost:3000/api/v1/salud

# Se invoca con ruta relativa a proposito: MSYS_NO_PATHCONV=1, necesario para
# los montajes de Docker, impide que Git Bash traduzca la ruta POSIX, y Node
# en Windows no sabe resolver /c/Users/... como ruta de modulo.
cd "$AQUI" && EJECUTOR="$EJECUTOR" SALIDA="Anexo_S1_sondas-seguridad$SUFIJO.txt" \
    node sondas-seguridad.mjs 2>&1 | tail -25

echo
echo "====================================================================="
echo "Bateria de seguridad terminada. Evidencia en:"
echo "  $EV"
echo "====================================================================="
