# Fragmentos del software original de 2013

Dos archivos recuperados del disco antiguo, fechados el **26 de diciembre de
2012**. Son lo único que sobrevive del T-Mirfe original, una aplicación PHP que
estuvo alojada en `tmirfe.hol.es` y desapareció con el hosting.

Se conservan **sin modificar**, como documentación histórica del instrumento.
No forman parte de la aplicación actual y no se ejecutan.

| Archivo | Qué es |
|---|---|
| `js_core.js` | Capa de interfaz: diálogos, administración de usuarios, navegación |
| `vw_tutorial.php` | La pantalla del tutorial, con su lógica de temporización |

Falta `vw_game.php`, que era donde vivía el ensayo real y la puntuación. Por eso
**estos archivos no resuelven de dónde salió la codificación 0/1/2**.

## Lo que sí documentan

### El texto del consentimiento de 2013

En `js_core.js`, líneas 323 y 329:

> «Acepta usted participar voluntariamente de esta prueba, y que los datos
> puedan ser usados en las investigaciones derivadas»

Era un diálogo de Sí o No, sin texto largo ni información sobre riesgos,
tratamiento de datos o derecho de retiro.

### El orden de los botones

`Miedo, Alegría, Tristeza, Asco, Sorpresa, Ira`. Coincide exactamente con el que
la versión actual conserva, deducido de una captura de pantalla de la tesis.

### La temporización, y una contradicción

En `vw_tutorial.php`:

- `var seg = 6000` para la fotografía. Coincide con los seis segundos que
  reporta la tesis.
- `seg = 4000` para la pantalla en blanco.
- Pero el mensaje en pantalla dice «Saldrá una imagen en blanco durante 3
  segundos».
- Y la tesis reporta **dos** segundos.

Tres cifras distintas para lo mismo. Como falta `vw_game.php`, no se puede saber
cuál regía en la prueba real. La versión actual usa dos segundos, que es lo que
dice la tesis.

### La máscara era blanca

`$("#imgShow").attr('src','Fotos/blanco.jpg')`. Confirma el fogonazo de
luminancia entre una fotografía gris y la siguiente, que la versión actual
corrige con gris medio y cruz de fijación.

### El tutorial entrenaba

Este es el hallazgo con más consecuencias. El tutorial de 2013 **decía si la
respuesta era correcta** y obligaba a repetir hasta acertar:

```
"Correcto!! Ha finalizado el tutorial"
"Te haz equivocado!! intentalo nuevamente"
```

Es exactamente el entrenamiento en la discriminación que la prueba iba a medir
tres minutos después. La versión actual da retroalimentación solo de mecánica,
nunca de acierto, y esta es la confirmación de que esa decisión era necesaria.

A favor del diseño original: el estímulo del tutorial era `Fotos/Smiley.png`, un
dibujo, no una de las 24 fotografías. Así que no hubo preexposición a los
estímulos del test.

### La cronometría era imprecisa

Se usaba `jquery.timer.js` sobre jQuery 1.7.2, es decir, un envoltorio de
`setTimeout`. Eso concuerda con lo que aparece en los datos: latencias de 6,54 y
7,08 segundos en una ventana nominal de seis.

### El tamaño del estímulo

```html
<img id="imgShow" src="Fotos/trans.png" style="width: 40%; height: 40%;">
```
```css
.pics img { width: 400px; height: 400px }
```

La hoja de estilo fija 400 × 400 para fotografías de 700 × 850. Si esa regla
llegó a aplicarse, los rostros se mostraron deformados. El estilo en línea la
sobrescribe, así que probablemente no ocurrió, pero no se puede descartar sin
`vw_game.php`.

## Qué falta

`vw_game.php` y los archivos que invoca (`js_ajax.js`, `js_validaciones.js`,
`vw_info.php`, `vw_menu.php`, `vw_usuario.php`) y el esquema de la base de
datos. Ahí estaría la respuesta al 0/1/2.
