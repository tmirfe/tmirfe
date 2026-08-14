# T-Mirfe 2.0

Test de Medición del Índice de Reconocimiento Facial de la Emoción.
Reconstrucción del instrumento original (Restrepo Meneses y Sánchez Velásquez,
asesoría de Liliana Chaves Castaño, Universidad de Antioquia, 2013).

## En línea

**https://sugarmask.github.io/tmirfe/**

Publicado con GitHub Pages desde la rama `main`, carpeta raíz. Todo va con rutas
relativas, así que funciona igual en la raíz de un dominio o en un
subdirectorio.

Para separar grupos de aplicación, añadir la cohorte al enlace:
`https://sugarmask.github.io/tmirfe/?c=piloto`

Cada `git push` a `main` republica el sitio en menos de un minuto.

## Cómo se usa

Abrir `index.html` con doble clic. No necesita instalación, ni servidor, ni
conexión a internet. Funciona igual desde una carpeta local, desde una memoria
USB o publicado en la web.

Para separar aplicaciones por grupo, añadir un código de cohorte a la dirección:

    index.html?c=piloto
    index.html?c=udea2026

## Qué mide y cómo lo guarda

Veinticuatro fotografías: seis emociones básicas en cuatro intensidades. De cada
ensayo se guardan **cuatro cosas por separado**, que nunca se colapsan en un solo
número:

| Campo       | Significado                                        |
|-------------|----------------------------------------------------|
| `respondio` | si contestó dentro de la ventana de 6 segundos     |
| `respuesta` | la emoción que eligió, o vacío                     |
| `acierto`   | 1 o 0, vacío si no respondió                       |
| `tr_ms`     | latencia en milisegundos, vacía si no respondió    |

Esto corrige el defecto central de la versión de 2013, que sumaba las tres cosas
en una escala de 0 a 48 (2 acierto, 1 error respondido, 0 sin respuesta) y por
eso sobrestimaba el reconocimiento, sobre todo del miedo.

El informe final reporta el acierto sobre 24. El puntaje en la escala antigua se
calcula igual, pero queda dentro del detalle técnico y solo sirve para comparar
con los baremos de 2013.

## Cuidados de cronometría

1. Las 24 imágenes se precargan y decodifican antes de empezar.
2. El cronómetro arranca cuando el fotograma con la imagen ya está pintado
   (doble `requestAnimationFrame`), no cuando se ejecuta la línea de código.
3. La latencia se toma de `event.timeStamp`, que es el sello del evento de
   hardware, no del momento en que corre el manejador.
4. Se responde con `pointerdown`, no con `click`.
5. Se registra el contexto del aparato (táctil o puntero, tamaño de ventana,
   densidad de píxeles) para poder controlarlo como covariable.

Los tiempos absolutos no son comparables entre un teléfono y un computador. El
análisis que interesa, el gradiente por intensidad, es intrasujeto, así que cada
participante sirve de su propio control.

## Tutorial y práctica

Cinco pasos antes de la prueba: aparece un rostro, toque la emoción (con la
botonera real, que se puede tocar), tiene 6 segundos, entre una y otra hay una
cruz, y practique. Las demostraciones van sobre el mismo gris de la pantalla de
ensayo, para que ese fondo no sea una novedad cuando empiece a contar el reloj.

**La práctica no dice si acertó.** Solo informa de la mecánica: «Respondió en
2,4 s» o «Se acabó el tiempo». Decirle al participante si acertó sería
entrenarlo en la discriminación que la prueba va a medir tres minutos después.

**Los tres estímulos de práctica no están en el test.** Son las únicas
fotografías procesadas del archivo original que quedaron fuera de las 24:

| Archivo | Qué es |
|---|---|
| `p1.jpg` | Toma alterna de alegría intensidad 4, descartada en la selección |
| `p2.jpg` | Desprecio, emoción que el estudio excluyó del diseño |
| `p3.jpg` | Desprecio |

Así nadie llega a la prueba con un estímulo ya visto. El desprecio sirve porque
no está entre las seis opciones de respuesta, de modo que practicar con él no
enseña ninguna correspondencia que la prueba vaya a evaluar.

## Sin código personal

Hubo un campo que pedía un código mnemotécnico (dos letras del nombre de la
madre y el día de nacimiento) para emparejar aplicaciones sin identificar a
nadie. Se eliminó: exigía demasiado esfuerzo de comprensión en un formulario de
móvil para lo poco que aporta en un estudio transversal, y cada campo de más
cuesta abandonos.

El identificador lo genera el sistema, invisible para el participante. Las
repeticiones se detectan con una marca en el navegador, que atrapa el caso
realista (la misma persona repite en el mismo teléfono). Si alguna vez se
plantea un retest con emparejamiento, el campo se vuelve a poner en diez
minutos.

## El informe final

Seis bloques: aciertos sobre 24, percentil contra 2013, perfil por emoción,
gradiente por intensidad, tiempos de respuesta y patrón de confusiones.

**El percentil sale de la distribución real**, no de una interpolación entre
baremos. Los 252 puntajes de 2013 se recuperaron de la salida original del SPSS
y están en `config.js` (`distribucionIndice`). Se usa la convención de rango
medio, que reparte los empates a la mitad. Validación: la función devuelve 24,
50 y 75 para los puntajes 41, 44 y 46, que son exactamente los percentiles 25,
50 y 75 publicados en la tesis.

El percentil se calcula sobre el índice compatible con 2013, no sobre el acierto
sobre 24, porque es la única cifra construida igual que la de aquel estudio.

**Los tiempos se comparan en forma, no en nivel.** La marca vertical señala el
promedio de 2013 en cada intensidad, y el informe advierte explícitamente que la
altura no es comparable entre un teléfono de hoy y un computador de 2013.

**Las confusiones** muestran a qué se pareció cada emoción cuando falló. Solo
aparece el bloque si hubo errores.

## Nombres de archivo opacos

Los estímulos se llaman `e01.jpg` a `e24.jpg`, no `miedo_3.jpg`. Con nombres
descriptivos, quien mirara el código de la página o mantuviera pulsada la imagen
vería la respuesta. El mapa de qué es cada uno está en `config.js`, en el mismo
orden de las columnas de la base de 2013.

## Instrucción al participante

«Responda lo más rápido que pueda, sin equivocarse.» Es la fórmula estándar en
la literatura de tiempos de reacción. En 2013 se dijo a los participantes que
«mientras más rápido responda mayor será su puntuación», lo cual no era cierto:
la velocidad no entraba en el puntaje. Esa instrucción se reporta como limitación
del estudio original.

## Estructura

    index.html          todas las pantallas
    css/estilo.css      envoltorio institucional y pantalla de ensayo
    js/config.js        parámetros, mapa de estímulos, normas de 2013, colores
    js/datos.js         registro, resumen, exportación, envío
    js/ensayo.js        precarga, aleatorización, cronometría
    js/app.js           flujo de pantallas, tutorial, informe final
    fotos/              e01..e24 del test y p1..p3 de práctica
                        700 x 850, escala de grises, un solo actor

Todo es JavaScript clásico, sin módulos ni `fetch` de archivos locales, porque
los módulos no funcionan bajo el protocolo `file://` y la aplicación tiene que
poder abrirse con doble clic.

## Diseño de la pantalla de ensayo

Modo revisado 2026. El fondo es gris 151 (`#979797`), que es el promedio del
fondo de las 24 fotografías medido sobre 96 muestras de esquina. Así se elimina
el borde de contraste que producía el fondo negro de 2013 y el fogonazo de
luminancia de su máscara en blanco.

La pantalla de ensayo no lleva marca, ni color institucional, ni navegación. La
identidad de la Universidad va solo en el envoltorio.

Cada registro guarda los parámetros con que se aplicó (fondo, milisegundos de
exposición y de máscara, orden y disposición de los botones, tamaño de la
imagen), de modo que cualquier comparación futura sea analizable.

## Pendientes

- **Colores institucionales.** Los verdes de `config.js` se tomaron del tema web
  de udea.edu.co. Hay que reemplazarlos por los valores exactos del Manual de
  Identidad Institucional (Resolución Rectoral 48342 de 2021). El portal rechaza
  la descarga automática del PDF.
- **Escudo.** El espacio está reservado en la portada, vacío, a la espera de la
  autorización de uso de marca.
- **Backend.** Al crear el proyecto en Supabase, llenar `url` y `anonKey` en
  `config.js`. Mientras tanto la aplicación funciona igual y guarda en el
  navegador. La clave `anon public` es pública por diseño y puede ir en el
  código; la `service_role` no se comparte nunca.
- **Consentimiento.** El texto es un borrador y debe revisarlo la asesora antes
  de cualquier aplicación real.

## Utilidades de trabajo

Desde la consola del navegador:

    TMIRFE.exportarTodo()      descarga todo lo guardado en este navegador
    TMIRFE.registros()         devuelve los registros como objeto
    TMIRFE.verificarOrden()    comprueba la aleatorización restringida
