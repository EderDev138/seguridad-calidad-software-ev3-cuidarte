#!/usr/bin/env bash
# =====================================================================
# Cuidarte+ v1.2 · EP3 · Bateria completa de pruebas automatizadas
#
# Ejecuta las cuatro herramientas de automatizacion del plan y guarda su
# salida en ../evidencias/v1.2/automatizacion/.
#
#   A0  Regresion interna   (Jest + Cucumber, heredadas de la EP2)
#   A1  Interfaz de usuario (Playwright)  · funcional de extremo a extremo
#   A2  API REST            (Postman/Newman) · funcional de servicios
#   A3  No funcional        (Lighthouse) · rendimiento y accesibilidad
#   A4  Carga               (k6) · concurrencia del ERS
#
# Uso:
#   bash ejecutar-automatizacion.sh             # sin sufijo
#   bash ejecutar-automatizacion.sh DESPUES     # tras aplicar correcciones
#
# Requisitos: ambiente levantado, semilla cargada y `npm install` hecho en
# esta carpeta (incluye `npx playwright install chromium`).
# =====================================================================
set -uo pipefail

SUFIJO="${1:-}"
[ -n "$SUFIJO" ] && SUFIJO="-$SUFIJO"
export EJECUTOR="${EJECUTOR:-no declarado}"

AQUI="$(cd "$(dirname "$0")" && pwd)"
BASE="$(cd "$AQUI/.." && pwd)"
APP="$BASE/codigo/cuidarte-plus-v1.2"
EV="$BASE/evidencias/v1.2/automatizacion"
mkdir -p "$EV"

paso() { echo; echo "### $* ###"; }

# La ventana del limitador de autenticacion debe estar libre: de lo contrario
# los inicios de sesion de la bateria reciben 429 y las pruebas fallan por el
# ambiente y no por el software.
paso "Preparacion del ambiente"
bash "$BASE/seguridad/desbloquear-usuarios.sh" > /dev/null 2>&1
( cd "$APP" && docker compose restart api > /dev/null 2>&1 )
curl -s --retry 30 --retry-delay 1 --retry-connrefused --retry-all-errors -m 60 -o /dev/null http://localhost:3000/api/v1/salud
echo "API disponible y limitador de autenticacion reiniciado."

# ---------------------------------------------------------------------
# A0 · Regresion interna heredada de la EP2
# ---------------------------------------------------------------------
paso "A0 · Pruebas unitarias, de integracion y BDD (Jest + Cucumber)"
{
    echo "====================================================================="
    echo "Cuidarte+ v1.2 · EP3 · Anexo A0 · Regresion automatizada interna"
    echo "Herramientas: Jest (unitarias e integracion) y Cucumber (BDD en Gherkin)"
    echo "Enfoque: comprobar que las correcciones de la EP3 no rompen nada de"
    echo "         lo que la EP2 dejo verificado"
    echo "Fecha de ejecucion : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Ejecutor           : $EJECUTOR"
    echo "====================================================================="
    echo
    echo "--- Jest con cobertura ----------------------------------------------"
    ( cd "$APP/api" && npm run test:cov 2>&1 | tail -35 )
    echo
    echo "--- Escenarios de comportamiento (Cucumber) -------------------------"
    ( cd "$APP/api" && npm run test:bdd 2>&1 | tail -15 )
    echo "====================================================================="
} > "$EV/Anexo_A0_jest-y-bdd$SUFIJO.txt" 2>&1
tail -4 "$EV/Anexo_A0_jest-y-bdd$SUFIJO.txt"

# ---------------------------------------------------------------------
# A2 · API REST con Postman/Newman
# ---------------------------------------------------------------------
paso "A2 · Coleccion Postman ejecutada con Newman"
{
    echo "====================================================================="
    echo "Cuidarte+ v1.2 · EP3 · Anexo A2 · Pruebas automatizadas de API"
    echo "Herramienta: coleccion Postman ejecutada sin interfaz con Newman"
    echo "Enfoque: validacion de endpoints, codigos de respuesta y reglas de"
    echo "         autorizacion, directamente contra la API"
    echo "Fecha de ejecucion : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Ejecutor           : $EJECUTOR"
    echo "====================================================================="
    echo
    ( cd "$AQUI" && npx newman run postman/Cuidarte-EP3.postman_collection.json \
        -e postman/Cuidarte-EP3.postman_environment.json --reporters cli --color off 2>&1 )
    echo "codigo de salida de Newman: $?"
} > "$EV/Anexo_A2_newman-api$SUFIJO.txt" 2>&1
grep -E "assertions|requests|total run duration" "$EV/Anexo_A2_newman-api$SUFIJO.txt" | tail -3

# ---------------------------------------------------------------------
# A1 · Interfaz de usuario con Playwright
# ---------------------------------------------------------------------
paso "A1 · Flujo de interfaz con Playwright"
( cd "$AQUI" && SUFIJO_EVIDENCIA="$SUFIJO" node ui-flujo-playwright.mjs 2>&1 | tail -6 )

# ---------------------------------------------------------------------
# A3 · Pruebas no funcionales con Lighthouse
# ---------------------------------------------------------------------
paso "A3 · Rendimiento y accesibilidad con Lighthouse"
( cd "$AQUI" && SUFIJO_EVIDENCIA="$SUFIJO" node lighthouse-spa.mjs 2>&1 | sed -n '/Puntajes/,/^$/p' )

# ---------------------------------------------------------------------
# A4 · Carga con k6
# ---------------------------------------------------------------------
paso "A4 · Prueba de carga con k6 (200 usuarios concurrentes)"
( cd "$AQUI" && SUFIJO_EVIDENCIA="$SUFIJO" node carga-k6.mjs 2>&1 | grep -E "✓|✗|http_req_duration|http_req_failed|iterations\.|Codigo de salida" | tail -18 )

echo
echo "====================================================================="
echo "Bateria de automatizacion terminada. Evidencia en:"
echo "  $EV"
echo "====================================================================="
