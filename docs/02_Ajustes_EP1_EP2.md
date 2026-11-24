# Ajustes respecto de la EP1 y la EP2

**Caso B — Cuidarte+** · ISY1102 · Sección 003V
Eder Valdivia · Marcelo Morales · Docente: Mauricio Andrés Velásquez Silva
Fecha de referencia del ambiente: **23 de noviembre de 2026**

Este documento corresponde al **primer apartado obligatorio del encargo**:
«puntos abordados en las evaluaciones parciales previas con ajustes basados en
la retroalimentación y el feedback entregado por el docente».

---

## 1. Qué se hereda

### De la EP1 — especificación y plan

La EP1 dejó el ERS del Caso B y el plan de pruebas inicial. La EP2 detectó que
**nueve de los catorce incidentes tenían su origen en un vacío de
especificación**: un requisito que no se escribe no se implementa, no se prueba
y termina siendo un defecto. De ahí salió el documento de 23 requisitos
adicionales (`EV2/docs/03_Requerimientos_Adicionales_ERS_v1.2.md`), que es la
base sobre la que esta EP3 sigue verificando: los identificadores NFR-SEG-10
(cabeceras), NFR-SEG-11 (limitación de peticiones) y NFR-SEG-13 (gestión de
secretos) que se citan a lo largo de esta entrega vienen de ahí.

### De la EP2 — auditoría y corrección

| Resultado de la EP2 | Estado al cerrar | Decisión en la EP3 |
|---|---|---|
| 14 incidentes detectados en la v1.0 | Los 14 cerrados en la v1.1 | Se mantienen como regresión |
| 34 casos de prueba · 45/45 requisitos cubiertos | 31 aprobados, 3 observados | Se amplía la cobertura, no se rehace |
| 132 pruebas Jest · 89,8 % de líneas | Verde | **Regresión obligatoria en la v1.2** |
| 6 escenarios BDD · 34 pasos | Verde | **Regresión obligatoria en la v1.2** |
| Pipeline de 9 etapas en GitHub Actions | 5 etapas activas, 4 declaradas | **Se ejecutan las declaradas** |

---

## 2. Retroalimentación aplicada

> **Nota de honestidad metodológica.** No existe un documento escrito de
> retroalimentación del docente en el repositorio de la EP2. Los ajustes que
> siguen se derivan de (a) los **casos observados** que la propia EP2 dejó
> anotados como pendientes en su sección 6.2 y (b) lo que el encargo de la EP3
> exige explícitamente. Donde no hay feedback documentado, se dice así en vez
> de inventarlo.

### Ajuste 1 — Un control declarado no es un control ejecutado

**Observación de la EP2.** El workflow `calidad-y-seguridad.yml` define nueve
etapas, pero solo cinco se ejecutan. Las cuatro restantes —SonarQube, Trivy y
OWASP ZAP (dos variantes)— quedaron «definidas como diseño de referencia»
porque requieren servicios externos, tokens o un ambiente levantado.

**Por qué era un problema.** El argumento es razonable para un pipeline de
integración continua, pero produjo un efecto que la EP3 dejó a la vista: en la
v1.1 nadie había ejecutado nunca un escaneo dinámico ni un escaneo de imagen.
**Al ejecutarlos por primera vez en esta EP3 aparecieron cuatro defectos
reales**, dos de ellos de criticidad grave. Estaban ahí desde octubre.

**Ajuste aplicado.** Las puertas que no caben en el pipeline se ejecutan
**localmente, con un comando y con evidencia fechada**:

```bash
cd ev3/seguridad      && bash ejecutar-seguridad.sh
cd ev3/automatizacion && bash ejecutar-automatizacion.sh
```

El plan de mantenimiento fija cuándo vuelven a correr y quién responde.

### Ajuste 2 — La cobertura de pruebas no es cobertura de riesgos

**Observación de la EP2.** 89,8 % de líneas cubiertas y 132 pruebas verdes
conviven con cuatro defectos de seguridad que ninguna prueba detectaba.

**Por qué.** Las pruebas de la EP2 verifican el **comportamiento del dominio**:
que el caso de uso haga lo que el requisito dice. Ninguna de ellas mira lo que
el servidor **emite por la red** (cabeceras HTTP), ni lo que la imagen de
contenedor **contiene** (sistema base), ni lo que ocurre cuando llega una
petición **con una cabecera inesperada**. Son capas que las pruebas unitarias no
alcanzan por construcción, no por descuido.

**Ajuste aplicado.** Se agregaron tres capas de verificación que no existían:
sondas dirigidas de seguridad sobre la API en ejecución, escaneo dinámico con
OWASP ZAP y escaneo de la imagen con Trivy.

### Ajuste 3 — Evidencia regenerable, no capturas sueltas

**Observación de la EP2.** La evidencia ya se generaba por script
(`capturar-evidencia.sh`), lo que fue un acierto que esta EP3 conserva y amplía.

**Ajuste aplicado.** Todo anexo de esta entrega lleva encabezado con **fecha de
ejecución, ejecutor, versión bajo prueba y comando**, y existe en dos versiones:
`-ANTES` (antes de mitigar) y `-DESPUES` (tras corregir). La comparación entre
ambas es la evidencia del impacto, que es lo que IE6 evalúa.

### Ajuste 4 — Faltaban los dos indicadores que más pesan después de seguridad

**Observación.** La EP2 no tenía diagrama de controles ligado a normativa
(IE3 · 14 %) ni plan de mantenimiento (IE7 · 20 %). Juntos son el 34 % de la
nota del encargo.

**Ajuste aplicado.** [`03_Diagrama_controles.md`](03_Diagrama_controles.md) y
[`04_Mitigacion_y_mantenimiento.md`](04_Mitigacion_y_mantenimiento.md), ambos
con su figura y su tabla de responsables.

### Ajuste 5 — No afirmar lo que no se ejecutó

**Ajuste aplicado.** SonarQube y JMeter siguen definidos en el proyecto desde la
EP2 (`sonar-project.properties`, `api/jmeter/cuidarte-carga.jmx`), pero **no se
ejecutaron en esta iteración**. El informe lo dice en esos términos y la prueba
de carga se hace con k6, que sí se ejecutó. Declarar una herramienta que no se
corrió es el error más fácil de detectar en una defensa.

---

## 3. Qué cambia en esta iteración: de la v1.1 a la v1.2

| Cambio | Archivo | Motivo |
|---|---|---|
| Rechazo CORS controlado, sin error interno | `api/.../middleware/seguridad.js` | INC-EP3-02 |
| `Cache-Control: no-store` en toda respuesta de la API | `api/.../middleware/seguridad.js` | INC-EP3-05 · ley 19.628 |
| `Cross-Origin-Embedder-Policy` | `api/.../middleware/seguridad.js` | INC-EP3-05 |
| Cabeceras de seguridad en todo `location` de nginx | `web/cabeceras-seguridad.conf` (nuevo) | INC-EP3-01 |
| Base de la imagen de la SPA actualizada | `web/Dockerfile` | INC-EP3-04 |
| `multer` 2.4.0 → 2.5.0, `body-parser` y `qs` parcheados | `api/package.json` | INC-EP3-03 |
| Batería de automatización nueva | `automatizacion/` | IE5 |
| Batería de seguridad nueva | `seguridad/` | IE1 |

El detalle de cada incidente, con su evidencia antes y después, está en el
informe, sección 2, y en
[`04_Mitigacion_y_mantenimiento.md`](04_Mitigacion_y_mantenimiento.md).

---

## 4. Lo que NO cambia, y por qué

- **La v1.0 no se toca.** Sigue siendo el material de laboratorio de la EP2, con
  sus 14 defectos documentados. No es el sistema bajo prueba de la EP3.
- **Las pruebas de la EP2 no se modifican.** Si se ajustaran para que pasen, la
  comparación entre versiones dejaría de significar nada. Se ejecutan tal cual y
  siguen dando 132/132.
- **El ERS no se reescribe.** Los 23 requisitos adicionales propuestos en la EP2
  siguen siendo una propuesta; esta EP3 los usa como criterio de verificación,
  no los da por aprobados.
