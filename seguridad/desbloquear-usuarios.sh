#!/usr/bin/env bash
# =====================================================================
# Cuidarte+ v1.2 · EP3 · Reinicio del bloqueo por intentos fallidos
#
# El control RF-1.3 bloquea la cuenta durante LOGIN_MINUTOS_BLOQUEO tras
# LOGIN_MAX_INTENTOS fallos, y el bloqueo vive en la base de datos: no se
# limpia reiniciando el contenedor de la API.
#
# Este script devuelve los usuarios de la semilla a su estado inicial para
# poder repetir la bateria de pruebas sin esperar la ventana de bloqueo.
# NO desactiva el control: solo reinicia el contador del ambiente QA.
#
# Uso (desde esta carpeta):
#   bash desbloquear-usuarios.sh
# =====================================================================
set -euo pipefail

PROYECTO="${PROYECTO:-../codigo/cuidarte-plus-v1.2}"

cd "$(dirname "$0")/$PROYECTO"

docker compose exec -T db psql -U "${POSTGRES_USER:-cuidarte}" -d "${POSTGRES_DB:-cuidarte}" <<'SQL'
UPDATE usuario
   SET intentos_fallidos = 0,
       bloqueado_hasta   = NULL
 WHERE nombre_usuario IN ('admin1', 'medico1', 'medico2', 'paciente1', 'paciente2');

-- Las cuentas senuelo que crea la sonda de fuerza bruta no se reutilizan.
DELETE FROM usuario WHERE nombre_usuario LIKE 'sonda.bruta.%';

SELECT nombre_usuario, intentos_fallidos, bloqueado_hasta
  FROM usuario
 WHERE nombre_usuario IN ('admin1', 'medico1', 'medico2', 'paciente1', 'paciente2')
 ORDER BY nombre_usuario;
SQL

echo
echo "Bloqueos reiniciados. Reinicie tambien la API para limpiar el limitador por IP:"
echo "  docker compose restart api"
