/* ==========================================================================
   T-Mirfe 2.0 - Motor de ensayo y cronometria

   Tres cuidados que la version de 2013 no tuvo:
   1. Todas las imagenes se precargan y decodifican ANTES de empezar, de modo
      que ninguna demora de red o de decodificacion entre en la latencia.
   2. El cronometro arranca cuando el fotograma con la imagen ya esta pintado
      (doble requestAnimationFrame), no cuando se ejecuta la linea de codigo.
   3. La latencia se toma del sello de tiempo del evento de hardware
      (event.timeStamp), no del momento en que corre el manejador.
   ========================================================================== */

var ENSAYO = (function () {

  var imagenes = {};        // 'alegria_3' -> HTMLImageElement precargado
  var secuencia = [];
  var indice = 0;
  var t0 = null;            // instante en que el estimulo quedo pintado
  var tInicioEnsayo = null;
  var temporizador = null;
  var respaldo = null;
  var respondido = false;
  var onsetPorRespaldo = false;   // el cronometro arranco sin fotograma confirmado
  var interrumpido = false;       // la pestana perdio el foco durante el ensayo
  var enPractica = false;
  var enCalibracion = false;      // bloque de calibracion motora
  var alTerminar = null;

  var elImagen, elMascara, elRejilla, elProgreso, elRetro, elPalabra;

  /* Si la persona sale de la aplicacion en mitad de un ensayo (una notificacion,
     una llamada), la latencia de ese ensayo deja de ser interpretable. No se
     descarta el dato, se marca, y la decision de excluirlo se toma al analizar. */

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && t0 !== null) {
      interrumpido = true;
      DATOS.anotarIncidencia('la pestana paso a segundo plano durante un ensayo');
    }
  });

  /* --- Precarga ---------------------------------------------------------- */

  function listaArchivos() {
    return CONFIG.estimulos.map(function (e) {
      return { emocion: e.emocion, intensidad: e.intensidad, archivo: e.archivo };
    });
  }

  // Se precargan las 24 del test y las 3 de practica, para que ninguna demora
  // de red entre en la latencia ni en el ritmo del tutorial.
  function precargar(alProgreso) {
    var items = listaArchivos().concat(CONFIG.practica.map(function (p) {
      return { emocion: null, intensidad: null, archivo: p.archivo };
    }));
    var hechos = 0;
    return Promise.all(items.map(function (it) {
      return new Promise(function (resolver) {
        var img = new Image();
        img.decoding = 'sync';
        img.onload = function () {
          var fin = function () {
            imagenes[it.archivo] = img;
            hechos++;
            if (alProgreso) alProgreso(hechos, items.length);
            resolver(true);
          };
          if (img.decode) img.decode().then(fin).catch(fin); else fin();
        };
        img.onerror = function () {
          DATOS.anotarIncidencia('no se pudo cargar una imagen', it.archivo);
          hechos++;
          if (alProgreso) alProgreso(hechos, items.length);
          resolver(false);
        };
        img.src = CONFIG.rutaFotos + it.archivo;
      });
    }));
  }

  /* --- Aleatorizacion restringida ----------------------------------------
     Dos condiciones heredadas del diseno original:
       la misma emocion no puede aparecer dos veces seguidas
       el mismo grado de intensidad no puede aparecer dos veces seguido      */

  function barajar(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function esValida(s) {
    for (var i = 1; i < s.length; i++) {
      if (s[i].emocion === s[i - 1].emocion) return false;
      if (s[i].intensidad === s[i - 1].intensidad) return false;
    }
    return true;
  }

  function compatible(it, previo) {
    return !previo || (it.emocion !== previo.emocion && it.intensidad !== previo.intensidad);
  }

  /* Barajar y reintentar NO sirve aqui: la probabilidad de que una permutacion
     al azar de las 24 fotografias cumpla las dos restricciones a la vez es del
     orden de 1 en 3000, asi que el metodo fallaba una parte apreciable de las
     veces. Se construye la secuencia paso a paso.

     En cada posicion se toman los estimulos que no repiten ni la emocion ni la
     intensidad del anterior, y entre ellos se prefiere el que pertenezca a la
     emocion y la intensidad con mas estimulos aun sin colocar. Esa es la
     heuristica que evita quedarse sin salida al final. Los empates, que son la
     mayoria, se resuelven al azar. Si aun asi se cierra el paso, se retrocede. */

  function construir(base) {
    var restantes = barajar(base.slice());
    var s = [];
    var quedanEmocion = {}, quedanIntensidad = {};
    restantes.forEach(function (it) {
      quedanEmocion[it.emocion] = (quedanEmocion[it.emocion] || 0) + 1;
      quedanIntensidad[it.intensidad] = (quedanIntensidad[it.intensidad] || 0) + 1;
    });

    function paso(previo) {
      if (!restantes.length) return true;

      var candidatos = [];
      restantes.forEach(function (it) {
        if (compatible(it, previo)) {
          candidatos.push({ it: it, peso: quedanEmocion[it.emocion] + quedanIntensidad[it.intensidad] });
        }
      });
      if (!candidatos.length) return false;

      var maximo = Math.max.apply(null, candidatos.map(function (c) { return c.peso; }));
      var mejores = barajar(candidatos.filter(function (c) { return c.peso === maximo; }));
      var resto   = barajar(candidatos.filter(function (c) { return c.peso !== maximo; }));
      var orden   = mejores.concat(resto).map(function (c) { return c.it; });

      for (var k = 0; k < orden.length; k++) {
        var it = orden[k];
        restantes.splice(restantes.indexOf(it), 1);
        quedanEmocion[it.emocion]--; quedanIntensidad[it.intensidad]--;
        s.push(it);

        if (paso(it)) return true;

        s.pop();
        quedanEmocion[it.emocion]++; quedanIntensidad[it.intensidad]++;
        restantes.push(it);   // el orden de `restantes` es indiferente
      }
      return false;
    }

    return paso(null) ? s : null;
  }

  function generarSecuencia() {
    var base = listaArchivos();
    var s = construir(base);
    if (s && s.length === base.length && esValida(s)) return s;
    DATOS.anotarIncidencia('no se pudo construir una secuencia valida');
    return barajar(base.slice());
  }

  /* --- Botonera ----------------------------------------------------------- */

  function montarBotones() {
    elRejilla.innerHTML = '';
    CONFIG.emociones.forEach(function (em) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton-emocion';
      b.dataset.emocion = em.clave;
      b.textContent = em.etiqueta;
      elRejilla.appendChild(b);
    });
    var enFila = window.innerWidth >= 760;
    elRejilla.classList.toggle('en-fila', enFila);
    DATOS.anotarPresentacion({ disposicion_botones: enFila ? 'fila' : 'rejilla' });
  }

  function habilitar(si) {
    elRejilla.classList.toggle('inactiva', !si);
    Array.prototype.forEach.call(elRejilla.children, function (b) { b.disabled = !si; });
  }

  function limpiarSeleccion() {
    Array.prototype.forEach.call(elRejilla.children, function (b) { b.classList.remove('elegido'); });
  }

  /* --- Ciclo de un ensayo -------------------------------------------------- */

  function mostrarMascara(ms, luego) {
    elImagen.style.visibility = 'hidden';
    if (elPalabra) elPalabra.hidden = true;
    elMascara.classList.add('visible');
    setTimeout(function () {
      elMascara.classList.remove('visible');
      luego();
    }, ms);
  }

  function siguiente() {
    if (indice >= secuencia.length) { terminar(); return; }

    var it = secuencia[indice];
    respondido = false;
    onsetPorRespaldo = false;
    interrumpido = (document.visibilityState === 'hidden');
    limpiarSeleccion();
    habilitar(false);
    tInicioEnsayo = performance.now();

    var esCal = enCalibracion;
    if (esCal) {
      elPalabra.textContent = it.etiqueta;
    } else {
      var img = imagenes[it.archivo];
      elImagen.src = img ? img.src : CONFIG.rutaFotos + it.archivo;
    }

    var arrancado = false;
    var arrancar = function (porRespaldo) {
      if (arrancado) return;
      arrancado = true;
      clearTimeout(respaldo);
      if (esCal) {
        elPalabra.hidden = false;
      } else {
        elImagen.style.visibility = 'visible';
        medirImagen();
      }
      t0 = performance.now();
      onsetPorRespaldo = porRespaldo;
      habilitar(true);
      temporizador = setTimeout(vencer,
        esCal ? CONFIG.calibracion.msExposicion : CONFIG.msExposicion);
    };

    // El respaldo se arma ANTES de decodificar, porque el ensayo se puede
    // quedar colgado de dos maneras distintas: que decode() no resuelva (imagen
    // que no alcanzo a precargarse, red lenta) o que requestAnimationFrame no
    // dispare (pestana en segundo plano). Cubre las dos.
    respaldo = setTimeout(function () { arrancar(true); }, CONFIG.msRespaldoPintado);

    if (esCal) {
      // La palabra no necesita decodificarse: se revela y se espera el
      // fotograma pintado, igual que con la fotografia.
      elPalabra.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { arrancar(false); });
      });
    } else {
      var pintar = function () {
        elImagen.style.visibility = 'visible';
        // Camino normal: el cronometro arranca cuando el fotograma con la
        // imagen ya esta compuesto en pantalla.
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { arrancar(false); });
        });
      };
      if (elImagen.decode) elImagen.decode().then(pintar).catch(pintar); else pintar();
    }
  }

  function instanteDe(evt) {
    var ahora = performance.now();
    if (evt && typeof evt.timeStamp === 'number' && evt.timeStamp > 0 &&
        Math.abs(evt.timeStamp - ahora) < 5000) {
      return evt.timeStamp;
    }
    return ahora;
  }

  function responder(evt) {
    var b = evt.target.closest ? evt.target.closest('.boton-emocion') : null;
    if (!b || respondido || t0 === null) return;
    evt.preventDefault();

    var t1 = instanteDe(evt);
    respondido = true;
    clearTimeout(temporizador);
    clearTimeout(respaldo);
    b.classList.add('elegido');
    habilitar(false);

    cerrarEnsayo({
      respondio: true,
      respuesta: b.dataset.emocion,
      tr_ms: +(t1 - t0).toFixed(1),
      margen_toque: margenDeToque(evt, b)
    });
  }

  /* Cuanto se acerco el dedo al borde del boton, de 0 (centro) a 1 (borde).
     Un valor alto significa que estuvo a punto de tocar el de al lado. No
     corrige nada por si mismo, pero permite estimar despues cuantas respuestas
     pudieron ser un toque equivocado y no una eleccion. Lo pidio Norvey el
     13 de agosto de 2026. */

  function margenDeToque(evt, boton) {
    try {
      var r = boton.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      var x = (typeof evt.clientX === 'number') ? evt.clientX : null;
      var y = (typeof evt.clientY === 'number') ? evt.clientY : null;
      if (x === null || y === null) return null;
      var dx = Math.abs(x - (r.left + r.width / 2)) / (r.width / 2);
      var dy = Math.abs(y - (r.top + r.height / 2)) / (r.height / 2);
      return +Math.max(dx, dy).toFixed(3);
    } catch (e) { return null; }
  }

  function vencer() {
    if (respondido) return;
    respondido = true;
    clearTimeout(respaldo);
    habilitar(false);
    cerrarEnsayo({ respondio: false, respuesta: null, tr_ms: null });
  }

  function cerrarEnsayo(res) {
    var it = secuencia[indice];
    if (enCalibracion) {
      DATOS.anotarCalibracion({
        orden: indice + 1,
        objetivo: it.emocion,
        respondio: res.respondio,
        respuesta: res.respuesta,
        tr_ms: res.tr_ms,
        onset_por_respaldo: onsetPorRespaldo,
        interrumpido: interrumpido,
        margen_toque: (typeof res.margen_toque === 'undefined') ? null : res.margen_toque
      });
    } else {
      DATOS.anotarEnsayo({
        orden: indice + 1,
        emocion: it.emocion,
        intensidad: it.intensidad,
        archivo: it.archivo,
        respondio: res.respondio,
        respuesta: res.respuesta,
        tr_ms: res.tr_ms,
        t_onset_ms: t0 === null ? null : +t0.toFixed(1),
        demora_pintado_ms: (t0 === null || tInicioEnsayo === null) ? null : +(t0 - tInicioEnsayo).toFixed(1),
        onset_por_respaldo: onsetPorRespaldo,
        interrumpido: interrumpido,
        margen_toque: (typeof res.margen_toque === 'undefined') ? null : res.margen_toque
      }, enPractica);
    }

    t0 = null;
    indice++;
    if (elProgreso) elProgreso.style.width = (100 * indice / secuencia.length) + '%';

    if (enPractica) {
      mostrarRetroalimentacion(res, function () {
        mostrarMascara(CONFIG.msMascara, siguiente);
      });
    } else {
      mostrarMascara(enCalibracion ? CONFIG.calibracion.msMascara : CONFIG.msMascara, siguiente);
    }
  }

  /* Retroalimentacion SOLO de mecanica, nunca de acierto. Decirle al
     participante si acerto seria entrenarlo en la discriminacion que la prueba
     va a medir tres minutos despues. */

  function mostrarRetroalimentacion(res, luego) {
    elImagen.style.visibility = 'hidden';
    var texto, sub;
    if (res.respondio) {
      texto = 'Respondió en ' + (res.tr_ms / 1000).toFixed(1).replace('.', ',') + ' s';
      sub = 'Así de rápido, sin equivocarse.';
    } else {
      texto = 'Se acabó el tiempo';
      sub = 'Son ' + (CONFIG.msExposicion / 1000) + ' segundos por fotografía. Si no responde, se pierde ese punto.';
    }
    elRetro.innerHTML = '<strong>' + texto + '</strong><span>' + sub + '</span>';
    elRetro.classList.add('visible');
    setTimeout(function () {
      elRetro.classList.remove('visible');
      luego();
    }, CONFIG.msRetroalimentacion);
  }

  function terminar() {
    elImagen.style.visibility = 'hidden';
    if (elPalabra) elPalabra.hidden = true;
    var fueCalibracion = enCalibracion;
    enCalibracion = false;
    if (typeof alTerminar === 'function') alTerminar(enPractica, fueCalibracion);
  }

  /* --- Arranque ------------------------------------------------------------ */

  // Se toma en el primer ensayo y no se repite. getBoundingClientRect no
  // depende de que haya fotogramas, asi que funciona aunque la pestana este
  // en segundo plano.
  var imagenMedida = false;
  function medirImagen() {
    if (imagenMedida) return;
    var r = elImagen.getBoundingClientRect();
    if (!r.width || !r.height) return;
    imagenMedida = true;
    DATOS.anotarPresentacion({
      ancho_imagen_css: Math.round(r.width),
      alto_imagen_css: Math.round(r.height)
    });
  }

  function iniciar(opciones) {
    enPractica = !!opciones.practica;
    enCalibracion = false;
    alTerminar = opciones.alTerminar;

    elImagen   = document.getElementById('img-estimulo');
    elMascara  = document.getElementById('mascara');
    elRejilla  = document.getElementById('rejilla-respuestas');
    elProgreso = document.getElementById('progreso-relleno');
    elRetro    = document.getElementById('retro');
    elPalabra  = document.getElementById('palabra-cue');

    montarBotones();
    elRejilla.removeEventListener('pointerdown', responder);
    elRejilla.addEventListener('pointerdown', responder);

    if (enPractica) {
      secuencia = CONFIG.practica.map(function (p) {
        return { emocion: null, intensidad: null, archivo: p.archivo };
      });
    } else {
      secuencia = generarSecuencia();
    }
    if (elProgreso) elProgreso.style.width = '0%';

    indice = 0;
    imagenMedida = false;
    document.body.style.background = CONFIG.presentacion.fondoEnsayo;

    // Los parametros se anotan aqui, no al cargar la pagina, para que el
    // registro guarde los que realmente rigieron esta aplicacion.
    DATOS.anotarPresentacion({
      modo: CONFIG.presentacion.modo,
      fondo: CONFIG.presentacion.fondoEnsayo,
      ms_exposicion: CONFIG.msExposicion,
      ms_mascara: CONFIG.msMascara
    });

    // Pausa breve en gris antes del primer estimulo, para que nadie responda
    // por inercia al boton con el que arranco la prueba.
    setTimeout(siguiente, 800);
  }

  /* --- Calibracion motora (observacion de Norvey) --------------------------
     Doce toques, dos por boton, en orden aleatorio sin repetir boton seguido.
     Mismo motor de cronometria que el test. */

  function secuenciaCalibracion() {
    var base = [];
    CONFIG.emociones.forEach(function (em) {
      for (var r = 0; r < CONFIG.calibracion.ensayosPorEmocion; r++) {
        base.push({ emocion: em.clave, etiqueta: em.etiqueta, intensidad: null, archivo: null });
      }
    });
    for (var intento = 0; intento < 500; intento++) {
      var s = barajar(base.slice());
      var ok = true;
      for (var i = 1; i < s.length; i++) {
        if (s[i].emocion === s[i - 1].emocion) { ok = false; break; }
      }
      if (ok) return s;
    }
    return barajar(base.slice());
  }

  function calibrar(opciones) {
    enPractica = false;
    enCalibracion = true;
    alTerminar = opciones.alTerminar;

    elImagen   = document.getElementById('img-estimulo');
    elMascara  = document.getElementById('mascara');
    elRejilla  = document.getElementById('rejilla-respuestas');
    elProgreso = document.getElementById('progreso-relleno');
    elRetro    = document.getElementById('retro');
    elPalabra  = document.getElementById('palabra-cue');

    montarBotones();
    elRejilla.removeEventListener('pointerdown', responder);
    elRejilla.addEventListener('pointerdown', responder);

    secuencia = secuenciaCalibracion();
    indice = 0;
    if (elProgreso) elProgreso.style.width = '0%';
    document.body.style.background = CONFIG.presentacion.fondoEnsayo;
    elImagen.style.visibility = 'hidden';

    DATOS.anotarPresentacion({
      calibracion_motora: {
        ensayos: secuencia.length,
        ms_exposicion: CONFIG.calibracion.msExposicion,
        ms_mascara: CONFIG.calibracion.msMascara
      }
    });

    setTimeout(siguiente, 600);
  }

  return {
    precargar: precargar,
    iniciar: iniciar,
    calibrar: calibrar,
    generarSecuencia: generarSecuencia   // expuesta para poder verificarla
  };
})();
