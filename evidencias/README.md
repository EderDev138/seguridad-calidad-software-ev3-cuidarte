# Evidencias — EP3 Cuidarte+

Toda la evidencia de esta entrega se **genera por script**, no se captura a
mano. Una evidencia que solo su autor puede producir es testimonio; una que
cualquiera puede regenerar es prueba.

## Estructura

```
evidencias/
└── v1.2/
    ├── RESULTADOS_EP3.md          Consolidado de todas las ejecuciones
    ├── seguridad/                 Anexos S1 a S4 y los informes de ZAP
    │   └── zap/                   Informes HTML, resúmenes y consola
    ├── automatizacion/            Anexos A0 a A4 y el informe de Lighthouse
    └── capturas/                  Diagrama de controles y capturas de interfaz
```

## Nomenclatura

| Parte | Significado |
|---|---|
| `Anexo_S#` | Evidencia de **seguridad** |
| `Anexo_A#` | Evidencia de **automatización** |
| `-ANTES` | Ejecución previa a las correcciones de la EP3 |
| `-DESPUES` | Ejecución posterior a las correcciones, con el mismo comando |

La comparación entre ambas versiones del mismo anexo es la evidencia del
impacto, que es lo que el indicador IE6 evalúa.

## Encabezado de cada anexo

Todo archivo de texto empieza con el mismo bloque:

```
=====================================================================
Cuidarte+ v1.2 · EP3 · <título del anexo>
Herramienta: <herramienta y para qué sirve>
Enfoque    : <qué clase de defecto puede encontrar>
Fecha de ejecucion : <fecha ISO en UTC>
Ejecutor           : <quién la corrió>
=====================================================================
```

Sin ese encabezado una salida de consola no es evidencia: no se sabe cuándo se
obtuvo, con qué versión ni contra qué ambiente.

## Cómo regenerarla

```bash
cd ../automatizacion && EJECUTOR="Su Nombre" bash ejecutar-automatizacion.sh
cd ../seguridad      && EJECUTOR="Su Nombre" bash ejecutar-seguridad.sh
cd ../scripts        && node generar-diagrama.mjs
```

Si al ejecutarlos obtiene resultados distintos a los documentados en
`v1.2/RESULTADOS_EP3.md`, **eso es un hallazgo**: anótelo en vez de ajustar el
informe.

## Qué no contienen estos archivos

- **No contienen secretos.** Las credenciales que aparecen son las de la semilla
  de QA, públicas a propósito y válidas solo en `localhost`. Los secretos reales
  —claves de JWT y de base de datos— viven en un `.env` que no se versiona.
- **No contienen datos personales reales.** Los pacientes de la semilla son
  ficticios, con RUT válidos en su dígito verificador pero sin titular. La ley
  19.628 prohíbe usar datos reales de salud en un ambiente de pruebas.
