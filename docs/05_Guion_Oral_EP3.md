# Guion de la defensa — EP3 Cuidarte+

**10 minutos de exposición + 5 de preguntas · defensa individual (24 %)**
Eder Valdivia · Marcelo Morales · ISY1102 · Sección 003V

> **Lea esto primero.** La pauta dice que «aunque el proyecto se trabaja de
> forma grupal, **la defensa es individual**» y que el orden lo define el
> docente al azar. Por eso este guion está escrito para que **una sola persona
> lo exponga completo en 10 minutos**. Al final hay una variante de reparto por
> si el docente pide una exposición conjunta. Prepárense para la primera: si se
> aprenden solo «su parte», la nota de quien no pueda explicar el resto se
> resiente, porque la pauta advierte que en ese caso «se asumirá que no
> participó activamente».

---

## Lo que la pauta exige que aparezca

La presentación **debe** contener estos cinco puntos. Son los de la pauta
oficial, no los de la guía:

1. Ejecución de pruebas de seguridad.
2. Resultados obtenidos en las pruebas de seguridad.
3. Resultados obtenidos en las pruebas automatizadas.
4. Reflexiones sobre calidad, seguridad y aspectos normativos y legales.
5. **Plan de mantenimiento para futuras iteraciones.**

El quinto es el que más se olvida y vale el 20 % de la defensa (IE8). No lo deje
para los últimos treinta segundos.

---

## Estructura en 10 minutos

| Tramo | Minutos | Diapositivas | Indicador | Peso |
|---|---|---|---|---|
| Apertura y ajustes de EP1/EP2 | 0:00 – 1:00 | 1–2 | — | — |
| **Enfoques y herramientas de seguridad** | 1:00 – 3:30 | 3–4 | **IE2** | **24 %** |
| Resultados de seguridad y mitigación | 3:30 – 5:00 | 5–6 | IE2 | — |
| **Automatización y evidencia de impacto** | 5:00 – 7:00 | 7–8 | **IE6** | **20 %** |
| Diagrama de controles y normativa | 7:00 – 8:00 | 9 | IE4 | 14 % |
| **Plan de mantenimiento** | 8:00 – 9:20 | 10 | **IE8** | **20 %** |
| Reflexión y veredicto | 9:20 – 10:00 | 11 | IE10 | 12 % |

---

## Guion

### Diapositiva 1 — Apertura (0:00 – 0:30)

> «Buenos días. Soy [nombre]. Presento la Evaluación Parcial 3 del caso
> Cuidarte+, el sistema de exámenes médicos que venimos trabajando desde la
> EP1. El trabajo lo hicimos con [compañero], y esta fase se trata de
> **optimizar el aseguramiento de la calidad y la seguridad** del software que
> en la EP2 dejamos corregido.»

### Diapositiva 2 — De dónde venimos (0:30 – 1:00)

> «En la EP2 auditamos la versión 1.0, encontramos catorce defectos y los
> cerramos en la versión 1.1. Esa versión tenía 132 pruebas automatizadas
> verdes y casi 90 % de cobertura.
>
> El ajuste más importante que hicimos para la EP3 sale de revisar esa entrega
> con ojo crítico: nuestro pipeline **declaraba** nueve puertas de calidad,
> pero solo ejecutaba cinco. ZAP y Trivy estaban escritos y nunca se habían
> corrido. En esta EP3 los ejecutamos por primera vez, y aparecieron **seis
> defectos reales** que estaban ahí desde octubre.»

**Si solo recuerda una frase de toda la defensa, que sea esta: un control
declarado no es un control ejecutado.**

### Diapositiva 3 — Los cinco enfoques (1:00 – 2:30) · IE2

Esta es la diapositiva de mayor peso. No lea la tabla: explique **qué ve cada
enfoque que los demás no pueden ver**.

> «Usamos cinco enfoques de prueba de seguridad, y lo importante no es la
> herramienta sino qué clase de defecto puede encontrar cada una.
>
> **Análisis estático, con ESLint y su plugin de seguridad.** Lee el código sin
> ejecutarlo. Encuentra patrones peligrosos: `eval`, concatenación de SQL,
> expresiones regulares que se pueden colgar. Lo que **no** puede ver es qué
> responde el servidor, porque nunca lo enciende.
>
> **Análisis de dependencias, con `npm audit`.** Mira las librerías que
> declaramos. El 90 % del código que se despliega no lo escribimos nosotros.
> No ve el sistema operativo de la imagen.
>
> **Análisis de la imagen, con Trivy.** Mira el contenedor completo: el Alpine
> base, nginx, todo lo que viaja al servidor. Esa capa no la escribió nadie del
> equipo, pero el riesgo es nuestro.
>
> **Análisis dinámico, con OWASP ZAP.** Levanta la aplicación, la recorre como
> lo haría un atacante y revisa lo que el servidor realmente envía. Ve las
> cabeceras HTTP, que es algo que ningún análisis de código puede deducir.
>
> **Pruebas dirigidas, con sondas propias.** Veintinueve casos negativos sobre
> la lógica de negocio: inyección SQL, XSS, CSRF, escalada de privilegios,
> referencias directas a objetos ajenos. Esto ninguna herramienta genérica lo
> sabe, porque depende de **nuestras** reglas: que un paciente solo vea su
> ficha, que un médico no administre usuarios.»

### Diapositiva 4 — Qué encontró cada uno (2:30 – 3:30) · IE2

> «Los seis defectos se repartieron así:
>
> ZAP y una sonda detectaron, cada uno por su lado, que **todos los archivos
> JavaScript y CSS de la aplicación se servían sin ninguna cabecera de
> seguridad**. La causa es sutil: en nginx, cuando un bloque `location` declara
> una cabecera, **reemplaza** las del nivel superior en vez de sumarlas.
> Nuestra configuración *parecía* correcta, y por eso ninguna revisión de
> código lo había visto.
>
> Una sonda detectó que cualquier petición con una cabecera `Origin` no
> permitida devolvía **error 500**, incluido el healthcheck público. Cualquiera
> podía inundar nuestro log de errores con una sola cabecera.
>
> `npm audit` detectó tres vulnerabilidades nuevas en dependencias de
> producción. **El código no había cambiado desde octubre**; cambió lo que se
> sabe de esas librerías.
>
> Trivy detectó que la imagen de la pantalla tenía **239 vulnerabilidades, una
> crítica y 57 altas**, porque la etiqueta de nginx que habíamos fijado se
> quedó anclada a un Alpine sin parches. Y detectó algo que `npm audit` no
> puede ver: que la imagen de la API llevaba `npm` a producción, con seis
> vulnerabilidades altas en sus propias librerías.»

### Diapositiva 5 — Resultados consolidados (3:30 – 4:15)

Muestre la tabla antes/después. Deje que los números hablen.

| Medida | Antes | Después |
|---|---|---|
| Sondas de seguridad | 27 de 29 | **29 de 29** |
| OWASP ZAP · fallos en la SPA | 2 | **0** |
| OWASP ZAP · reglas aprobadas | 64 | **67** |
| `npm audit` producción | 3 avisos (2 altas) | **0** |
| Trivy · imagen de la SPA | 239 (1 crítica, 57 altas) | **1** |
| Trivy · imagen de la API | 33 (8 altas) | **11 (0 altas)** |

### Diapositiva 6 — Cómo se corrigió (4:15 – 5:00)

> «Las cabeceras se sacaron a un archivo único que ahora se incluye
> explícitamente en cada bloque de nginx: la herencia dejó de ser un supuesto.
> El rechazo de CORS pasó a ser controlado, sin error interno. Subimos la base
> de la imagen y parchamos las tres dependencias. Y sacamos `npm` de la imagen
> de producción, porque la aplicación no lo necesita para correr.
>
> Después de cada corrección volvimos a ejecutar **toda** la batería, incluidas
> las 132 pruebas de la EP2. Siguen en 132 de 132: ninguna corrección rompió
> nada. Por eso la regresión se ejecuta después del cambio, y no solo antes.»

### Diapositiva 7 — Automatización (5:00 – 6:00) · IE6

> «Incorporamos cuatro herramientas de automatización que no existían en la
> EP2, una por cada cosa que había que cubrir.
>
> **Playwright** recorre la aplicación en un navegador real: inicio de sesión,
> listado de pacientes, ficha, registro de un examen, auditoría, cierre de
> sesión. Siete casos, cada uno trazado a un requisito del ERS.
>
> **Postman con Newman** valida la API directamente: 26 peticiones y 58
> aserciones, sin pasar por la pantalla. Ahí es donde comprobamos que el
> control de acceso está en el servidor y no solo en la interfaz.
>
> **Lighthouse** mide rendimiento y accesibilidad sobre la pantalla real.
>
> **k6** levanta 200 usuarios concurrentes, que es el número que exige el ERS.»

### Diapositiva 8 — El impacto, en números (6:00 – 7:00) · IE6

Esta es la diapositiva que responde «¿optimizaron tiempo y recursos?». Sea
concreto.

> «Los siete casos de interfaz corren en **9 segundos**. Hacerlos a mano, con
> una persona operando el navegador, toma del orden de **10 minutos**. Es una
> reducción del 98 %.
>
> Las 58 aserciones de API corren en **5 segundos**.
>
> Lighthouse revisa **17 criterios de accesibilidad en 18 segundos**; esa misma
> revisión punto por punto es trabajo de dos a tres horas.
>
> k6 genera **más de 7.400 peticiones en 45 segundos** con 0 % de error y todos
> los umbrales del ERS cumplidos: p95 de 127 milisegundos contra un límite de
> 300.
>
> Pero el ahorro de tiempo no es lo más importante. Lo importante es que **esto
> se puede repetir en cada cambio**. Una prueba manual de diez minutos se hace
> una vez y se deja de hacer. Una de nueve segundos se hace siempre.»

### Diapositiva 9 — Diagrama de controles (7:00 – 8:00) · IE4

Muestre `diagrama_controles.png` y explíquelo, no lo describa.

> «El diagrama tiene cinco columnas: las cinco etapas por las que pasa el
> software, desde el código que escribimos hasta el veredicto de despliegue.
>
> En cada columna hay dos filas. Arriba, el control que protege el producto.
> Abajo, la puerta automatizada que comprueba que ese control sigue ahí. El
> color indica qué ley o estándar preserva.
>
> Un ejemplo completo, de punta a punta: la **ley 19.628** clasifica los datos
> de salud como dato sensible. El control que lo protege es
> `Cache-Control: no-store`, para que una ficha clínica no quede en la caché
> del navegador después de cerrar sesión. La puerta que lo verifica es la regla
> 10049 de OWASP ZAP. Y la evidencia es el archivo
> `zap-spa-DESPUES-consola.txt`, con fecha y ejecutor.
>
> Eso es lo que queremos decir con *verificar el cumplimiento*: no es
> declararlo en el informe, es que una herramienta lo compruebe sola y deje
> registro.»

### Diapositiva 10 — Plan de mantenimiento (8:00 – 9:20) · IE8

**No se salte esta diapositiva.** Vale el 20 %.

> «El plan responde cuatro preguntas por cada actividad: cuándo, quién, qué se
> re-ejecuta y qué evidencia deja.
>
> **En cada cambio de código**, la batería completa de la API: formato,
> análisis estático, 132 pruebas con cobertura, escenarios BDD y auditoría de
> dependencias. Responsable: quien integra el cambio.
>
> **En cada cambio de interfaz**, Playwright y Lighthouse. En cada cambio de
> API, la colección de Postman.
>
> **Semanalmente**, `npm audit`, **aunque no haya cambios**. Esta es la
> actividad que más cuesta justificar y la más importante: nuestro código no
> cambió en un mes y aun así aparecieron dos vulnerabilidades altas. Un plan
> que solo verifique cuando se toca el código no las habría visto.
>
> **En cada candidato a release**, la batería de seguridad completa y la prueba
> de carga.
>
> **Mensualmente**, reconstruir las imágenes base y volver a escanearlas. Eso
> es lo que habría evitado las 239 vulnerabilidades de la imagen de la pantalla.
>
> Y una propuesta concreta de mejora continua: incorporar al pipeline las tres
> puertas que hoy corremos a mano —Trivy, ZAP y las sondas—. No necesitan
> servicios externos, y entre las tres habrían detectado **cinco de los seis
> defectos** de esta evaluación en el momento en que se introdujeron.»

### Diapositiva 11 — Reflexión y veredicto (9:20 – 10:00) · IE10

> «Tres conclusiones.
>
> **Sobre calidad.** 90 % de cobertura y 132 pruebas verdes convivían con seis
> defectos de seguridad. No es que las pruebas estuvieran mal: es que verifican
> el comportamiento del dominio, y estos defectos vivían en capas que ninguna
> prueba unitaria alcanza. La cobertura mide líneas ejecutadas, no riesgos
> cubiertos.
>
> **Sobre seguridad y normativa.** Cuidarte+ trata datos de salud, que la ley
> 19.628 define como dato sensible. Eso cambia el estándar exigible: no basta
> con que el sistema funcione, tiene que poder demostrar que protege. Por eso
> cada control del diagrama tiene su puerta y su evidencia fechada.
>
> **Veredicto.** Los seis defectos detectados están cerrados y verificados con
> la misma prueba que los encontró. La versión 1.2 cumple el criterio de salida
> que definimos. Queda abierta, documentada, la exposición sin TLS, que es una
> decisión de ambiente: hoy corre en localhost.
>
> Gracias. Quedo atento a sus preguntas.»

---

> **Para la demostración en vivo**, el guion de qué ejecutar y en qué orden
> está en [`08_Demo_End_to_End.md`](08_Demo_End_to_End.md): tres comandos,
> veinte segundos, y un plan B por si algo falla delante del docente.

## Banco de preguntas (5 minutos)

### Sobre herramientas y enfoques

**¿Por qué ZAP y no solo revisar el código?**
Porque el análisis estático no puede saber qué cabeceras emite nginx en tiempo
de ejecución. De hecho, nuestro defecto más grave era invisible en el código:
la configuración se veía correcta y el comportamiento de nginx no era el que
suponíamos. Hizo falta pedir el archivo y mirar la respuesta.

**¿Por qué Playwright además de la colección de Postman?**
Cubren cosas distintas. Postman verifica que la API responda lo correcto;
Playwright verifica que el usuario pueda **llegar** a esa respuesta: que el
botón exista, que el formulario envíe, que el menú de auditoría no aparezca
para un paciente. Un control puede estar bien en la API y ser inalcanzable en
la pantalla.

**¿Por qué Trivy si ya tienen `npm audit`?**
Miran universos distintos. `npm audit` lee `package.json`: solo ve lo que
declaramos. Trivy escanea la imagen completa. El caso más claro es
INC-EP3-06: la imagen llevaba `npm` a producción con seis vulnerabilidades
altas en sus propias librerías. `npm audit` no podía verlas, porque `npm` no es
una dependencia de nuestra aplicación.

**¿Usaron SonarQube o JMeter?**
No en esta iteración. Están definidos en el proyecto desde la EP2
(`sonar-project.properties` y `api/jmeter/cuidarte-carga.jmx`), pero SonarQube
requiere un servidor y un token de servicio que no tenemos. La prueba de carga
la hicimos con k6, que sí ejecutamos. Preferimos decirlo así antes que afirmar
una herramienta que no corrimos.

### Sobre normativa

**¿Qué ley aplica a los datos que maneja Cuidarte+?**
La 19.628, actualizada por la 21.719. Los datos de salud son **dato sensible**,
lo que exige base legal para tratarlos, finalidad acotada y medidas de
seguridad. También aplica la 21.663 de ciberseguridad, por gestión de
vulnerabilidades y registro de actividad, y la 20.422 de accesibilidad, porque
los propios pacientes consultan sus exámenes en la pantalla.

**¿Cómo verificaron el cumplimiento legal?**
Convirtiendo cada exigencia en un control y cada control en una puerta
automatizada. La ley 19.628 obliga a proteger el dato sensible: el control es
`Cache-Control: no-store`, la puerta es la regla 10049 de ZAP, la evidencia es
el log fechado. La ley 20.422 obliga a accesibilidad: el control son las
etiquetas y el contraste, la puerta es Lighthouse con un umbral de 90 %, y
obtuvimos 100 %.

**¿La contraseña de prueba en el repositorio no es un riesgo?**
Es una credencial pública a propósito, declarada como tal en el archivo de
semilla, y solo válida en el ambiente QA local. Los secretos reales —claves de
JWT y de base de datos— se leen de un `.env` que no se versiona. La rotación de
esos secretos antes de salir de localhost está en el plan de mantenimiento.

### Sobre riesgos y decisiones

**¿Cuál de los seis defectos pesa más y por qué?**
El de las cabeceras ausentes en los archivos estáticos. Afectaba al 100 % del
código que el navegador ejecuta, llevaba ahí desde la EP2 y era invisible tanto
para las pruebas como para la revisión de código. Los otros tienen impacto
acotado o requieren condiciones más específicas.

**¿Cómo priorizaron?**
Por dos criterios combinados: alcance (cuántas respuestas afecta) y
explotabilidad (qué necesita un atacante). Las cabeceras afectaban a todo y no
requerían nada; por eso fueron primero. El error 500 por CORS afectaba a todos
los endpoints y bastaba una cabecera; fue el segundo.

**¿El sistema está listo para producción?**
Para el ambiente evaluado, sí: los seis hallazgos están cerrados y verificados,
y se cumplen las cinco condiciones del criterio de salida. Para producción real
falta lo que el plan de mantenimiento identifica como deuda conocida: HTTPS,
rotación de secretos y revisión de los orígenes CORS. No es software defectuoso,
es un ambiente que todavía es QA.

**Si tuvieran una semana más, ¿qué harían?**
Incorporar Trivy, ZAP y las sondas al pipeline de GitHub Actions. Hoy corren con
un comando, pero dependen de que alguien lo escriba. Esa dependencia es
exactamente lo que falló entre la EP2 y la EP3.

---

## Variante: exposición conjunta

Si el docente pide una sola exposición de los dos integrantes, repártanla así,
**sin cambiar el contenido**:

| Quién | Tiempo | Diapositivas | Foco |
|---|---|---|---|
| Primer expositor | 0:00 – 5:00 | 1–6 | Contexto, ajustes, enfoques, resultados y mitigación |
| Segundo expositor | 5:00 – 10:00 | 7–11 | Automatización, diagrama, mantenimiento y veredicto |

Las preguntas las responde **cualquiera de los dos**, indistintamente. Ensayen
también el reparto cruzado: quien expuso la primera mitad debe poder responder
sobre la segunda.
