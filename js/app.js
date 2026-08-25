/* ==========================================================================
   T-Mirfe 2.0 - Flujo de la aplicacion
   ========================================================================== */

(function () {

  var pantallaActual = 'pantalla-portada';
  var precargaLista = false;

  /* --- Navegacion ---------------------------------------------------------- */

  function ir(id) {
    var previa = document.getElementById(pantallaActual);
    var nueva = document.getElementById(id);
    if (!nueva) return;
    if (previa) previa.classList.remove('activa');
    nueva.classList.add('activa');
    pantallaActual = id;
    document.body.classList.toggle('en-ensayo', id === 'pantalla-ensayo');
    if (id !== 'pantalla-ensayo') document.body.style.background = '';
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-ir]') : null;
    if (b && !b.disabled) ir(b.dataset.ir);
  });

  /* --- Portada -------------------------------------------------------------- */

  DATOS.iniciar();

  // La precarga arranca de fondo desde el primer momento, para que cuando la
  // persona termine de llenar el formulario ya no tenga que esperar.
  ENSAYO.precargar(function (hechos, total) {
    var pct = Math.round(100 * hechos / total);
    var barra = document.getElementById('barra-carga');
    var txt = document.getElementById('txt-carga');
    if (barra) barra.style.width = pct + '%';
    if (txt) txt.textContent = 'Cargando imágenes... ' + hechos + ' de ' + total;
  }).then(function () {
    precargaLista = true;
    if (pantallaActual === 'pantalla-carga') ir('pantalla-listo');
  });

  /* --- Consentimiento ------------------------------------------------------- */

  var casilla = document.getElementById('acepta-consentimiento');
  var btnAcepta = document.getElementById('btn-acepta');

  casilla.addEventListener('change', function () {
    btnAcepta.disabled = !casilla.checked;
  });

  btnAcepta.addEventListener('click', function () {
    DATOS.anotarConsentimiento(true);
  });

  /* --- Formulario ----------------------------------------------------------- */

  var selAnio = document.getElementById('sel-anio');
  var anioActual = new Date().getFullYear();
  // Desde los 18. En Colombia la mayoria de edad es a los 18, y la Resolucion
  // 8430 de 1993 exige, para menores, consentimiento de quien ejerce la patria
  // potestad (art. 25) mas el asentimiento del propio menor (art. 26). Una
  // casilla marcada en un telefono no cumple ninguna de las dos cosas.
  // El estudio de 2013 admitia desde los 15, lo cual conviene declarar como
  // limitacion. Para entrar a colegios hace falta otro protocolo.
  for (var a = anioActual - 18; a >= anioActual - 90; a--) {
    var op = document.createElement('option');
    op.value = a; op.textContent = a;
    selAnio.appendChild(op);
  }

  var form = document.getElementById('form-datos');
  var errorDatos = document.getElementById('error-datos');

  // Casi todo el mundo va a ser de Medellin o del area metropolitana, asi que
  // el desplegable ahorra escribir. El campo libre solo aparece si hace falta.
  var selCiudad = document.getElementById('sel-ciudad');
  var campoOtra = document.getElementById('campo-otra-ciudad');
  selCiudad.addEventListener('change', function () {
    var otra = selCiudad.value === 'OTRA';
    campoOtra.hidden = !otra;
    if (otra) campoOtra.querySelector('input').focus();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var datos = {};
    var faltan = [];

    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      var v = (el.value || '').trim();
      if (el.name === 'ciudad_residencia' || el.name === 'ciudad_otra') v = v.toUpperCase();
      datos[el.name] = v;
      if (el.required && !v) faltan.push(el.name);
    });

    if (faltan.length) {
      errorDatos.textContent = 'Faltan datos por responder.';
      errorDatos.hidden = false;
      return;
    }
    if (datos.ciudad_residencia === 'OTRA') {
      if (!datos.ciudad_otra) {
        errorDatos.textContent = 'Escriba su ciudad o municipio.';
        errorDatos.hidden = false;
        return;
      }
      // Se guarda el texto libre como ciudad, y aparte la marca de que no
      // salio del desplegable, para poder depurar la escritura al analizar.
      datos.ciudad_residencia = datos.ciudad_otra;
      datos.ciudad_fuera_de_lista = true;
    } else {
      datos.ciudad_fuera_de_lista = false;
    }
    delete datos.ciudad_otra;
    if (DATOS.yaRespondio()) {
      var seguir = confirm('En este dispositivo ya se respondió la prueba. ' +
        'Solo la primera aplicación es válida.\n\n¿Desea continuar de todos modos?');
      if (!seguir) return;
      DATOS.anotarIncidencia('posible repeticion: ya habia una aplicacion en este dispositivo');
    }

    errorDatos.hidden = true;
    DATOS.anotarParticipante(datos);
    ir('pantalla-instrucciones');
  });

  /* --- Instrucciones ---------------------------------------------------------- */

  var segundos = (CONFIG.msExposicion / 1000) + ' segundos';
  document.getElementById('txt-exposicion').textContent = segundos;
  Array.prototype.forEach.call(document.querySelectorAll('.txt-exposicion'), function (el) {
    el.textContent = segundos;
  });

  /* --- Tutorial guiado ---------------------------------------------------------
     Cinco pasos. Los cuatro primeros explican, el quinto lanza la practica.    */

  var pasos = document.querySelectorAll('#pantalla-tutorial .paso');
  var totalPasos = pasos.length;
  var pasoActual = 1;
  var puntos = document.getElementById('pasos-puntos');
  var btnAtras = document.getElementById('btn-paso-atras');
  var btnAdelante = document.getElementById('btn-paso-adelante');
  var navTutorial = document.getElementById('nav-tutorial');

  for (var p = 0; p < totalPasos; p++) {
    var punto = document.createElement('span');
    punto.className = 'paso-punto';
    puntos.appendChild(punto);
  }

  function mostrarPaso(n) {
    pasoActual = Math.min(Math.max(n, 1), totalPasos);
    Array.prototype.forEach.call(pasos, function (el) {
      el.classList.toggle('activo', Number(el.dataset.paso) === pasoActual);
    });
    Array.prototype.forEach.call(puntos.children, function (el, i) {
      el.classList.toggle('activo', i + 1 === pasoActual);
      el.classList.toggle('visto', i + 1 < pasoActual);
    });
    btnAtras.textContent = pasoActual === 1 ? 'Volver' : 'Atrás';
    // En el ultimo paso manda el boton de practica, no el de navegacion.
    btnAdelante.hidden = (pasoActual === totalPasos);
    navTutorial.style.justifyContent = btnAdelante.hidden ? 'flex-start' : '';
    window.scrollTo(0, 0);
  }

  btnAdelante.addEventListener('click', function () { mostrarPaso(pasoActual + 1); });
  btnAtras.addEventListener('click', function () {
    if (pasoActual === 1) ir('pantalla-instrucciones'); else mostrarPaso(pasoActual - 1);
  });

  // Botonera de demostracion del paso 2, con los mismos rotulos y el mismo
  // orden que la de la prueba, para que no haya ninguna sorpresa despues.
  var demoRejilla = document.getElementById('demo-rejilla');
  CONFIG.emociones.forEach(function (em) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton-emocion';
    b.dataset.emocion = em.clave;
    b.textContent = em.etiqueta;
    demoRejilla.appendChild(b);
  });
  if (window.innerWidth >= 760) demoRejilla.classList.add('en-fila');

  demoRejilla.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.boton-emocion') : null;
    if (!b) return;
    Array.prototype.forEach.call(demoRejilla.children, function (x) { x.classList.remove('elegido'); });
    b.classList.add('elegido');
    document.getElementById('nota-paso2').textContent =
      'Eso es. En la prueba, apenas toque el botón se pasa a la siguiente fotografía.';
  });

  mostrarPaso(1);

  /* --- Practica ------------------------------------------------------------- */

  document.getElementById('btn-practica').addEventListener('click', function () {
    ir('pantalla-ensayo');
    ENSAYO.iniciar({
      practica: true,
      alTerminar: function () {
        document.getElementById('titulo-listo').textContent = 'Ya sabe cómo es';
        document.getElementById('txt-listo').innerHTML =
          'Ahora viene la prueba: 24 fotografías, unos cuatro minutos.<br>' +
          'Recuerde responder <strong>lo más rápido que pueda, sin equivocarse</strong>.';
        ir(precargaLista ? 'pantalla-listo' : 'pantalla-carga');
      }
    });
  });

  /* --- Prueba ----------------------------------------------------------------- */

  document.getElementById('btn-empezar').addEventListener('click', function () {
    ir('pantalla-ensayo');
    ENSAYO.iniciar({
      practica: false,
      alTerminar: function () {
        var resumen = DATOS.cerrar();
        pintarResultado(resumen);
        DATOS.enviar().then(function (r) {
          if (!r.enviado) DATOS.anotarIncidencia('sin envio remoto', r.motivo || r.estado);
        });
        ir('pantalla-resultado');
      }
    });
  });

  /* --- Resultado ---------------------------------------------------------------
     Se informa el acierto sobre 24, que es la medida real. El indice compatible
     con 2013 se muestra solo dentro del detalle tecnico, para no confundir dos
     escalas que no significan lo mismo.                                        */

  function nombreEmocion(clave) {
    var e = CONFIG.emociones.filter(function (x) { return x.clave === clave; })[0];
    return e ? e.etiqueta : clave;
  }

  /* Percentil sobre la distribucion real de los 252 casos de 2013, no sobre
     una interpolacion entre baremos. Se usa la convencion de rango medio, que
     reparte a la mitad los empates: con puntajes muy agrupados hacia el techo,
     contar todos los empates como "por debajo" inflaria el resultado. */

  function percentil2013(indice) {
    var d = CONFIG.normas2013.distribucionIndice;
    var n = 0, menores = 0, iguales = 0;
    for (var k in d) {
      if (!d.hasOwnProperty(k)) continue;
      n += d[k];
      if (Number(k) < indice) menores += d[k];
      else if (Number(k) === indice) iguales = d[k];
    }
    if (!n) return null;
    return Math.max(1, Math.min(99, Math.round(100 * (menores + iguales / 2) / n)));
  }

  function pintarResultado(r) {
    ultimoResumen = r;
    document.getElementById('res-aciertos').textContent = r.aciertos;

    var pct = r.porcentaje_acierto;
    var frase;
    if (r.sin_respuesta > 0) {
      frase = 'Reconoció el ' + pct.toFixed(0) + '% de las expresiones. ' +
        'En ' + r.sin_respuesta + (r.sin_respuesta === 1 ? ' fotografía' : ' fotografías') +
        ' no alcanzó a responder dentro del tiempo.';
    } else {
      frase = 'Reconoció el ' + pct.toFixed(0) + '% de las expresiones y respondió a todas dentro del tiempo.';
    }
    document.getElementById('res-frase').textContent = frase;

    /* --- Percentil --- */
    var pc = percentil2013(r.indice_compat_2013);
    var caja = document.getElementById('res-percentil');
    if (pc === null) {
      caja.hidden = true;
    } else {
      var lectura;
      if (pc >= 75) lectura = 'por encima de la mayoría';
      else if (pc >= 50) lectura = 'por encima de la mitad';
      else if (pc >= 25) lectura = 'algo por debajo de la mitad';
      else lectura = 'por debajo de la mayoría';
      caja.innerHTML =
        '<div class="percentil-barra"><div class="percentil-marca" style="left:' + pc + '%"></div></div>' +
        '<p><strong>Percentil ' + pc + '</strong>. Su desempeño queda ' + lectura +
        ' de las 252 personas de Medellín que hicieron esta prueba en 2013.</p>' +
        '<p class="nota">La comparación se hace en la escala de aquel estudio, que reparte los puntos ' +
        'entre acierto, error y falta de respuesta, así que puede no coincidir con su porcentaje de acierto. ' +
        'Tenga en cuenta además que casi todo el mundo reconoce bien estas expresiones: la mitad de aquella ' +
        'muestra se concentró en apenas cuatro puntos de diferencia, de modo que fallar dos o tres fotografías ' +
        'mueve mucho el percentil.</p>';
      caja.hidden = false;
    }

    // Perfil por emocion, contra la norma real de 2013
    var perfil = document.getElementById('res-perfil');
    perfil.innerHTML = '';
    var claves = Object.keys(r.por_emocion).sort(function (x, y) {
      return r.por_emocion[y].aciertos - r.por_emocion[x].aciertos;
    });
    claves.forEach(function (k) {
      var d = r.por_emocion[k];
      var mio = 100 * d.aciertos / d.total;
      var norma = CONFIG.normas2013.aciertoPorEmocion[k];
      var fila = document.createElement('div');
      fila.className = 'perfil-fila';
      fila.innerHTML =
        '<div class="perfil-nombre">' + nombreEmocion(k) + '</div>' +
        '<div class="perfil-barra">' +
          '<div class="perfil-relleno" style="width:' + mio.toFixed(0) + '%"></div>' +
          '<div class="perfil-norma" style="left:' + norma.toFixed(0) + '%" ' +
               'title="Muestra de 2013: ' + norma.toFixed(1) + '%"></div>' +
        '</div>' +
        '<div class="perfil-cifra">' + d.aciertos + '/' + d.total + '</div>';
      perfil.appendChild(fila);
    });

    // Gradiente por intensidad: el efecto que la prueba mide de verdad
    var grad = document.getElementById('res-gradiente');
    grad.innerHTML = '';
    CONFIG.intensidades.forEach(function (i) {
      var d = r.por_intensidad[i];
      var mio = 100 * d.aciertos / d.total;
      var fila = document.createElement('div');
      fila.className = 'perfil-fila';
      fila.innerHTML =
        '<div class="perfil-nombre">Intensidad ' + i + '</div>' +
        '<div class="perfil-barra"><div class="perfil-relleno" style="width:' + mio.toFixed(0) + '%"></div></div>' +
        '<div class="perfil-cifra">' + d.aciertos + '/' + d.total + '</div>';
      grad.appendChild(fila);
    });

    // Tiempos por intensidad, contra la curva de 2013.
    // Se compara la FORMA, no el nivel: los tiempos absolutos de un telefono
    // de hoy no son comparables con los de un computador de 2013.
    var tiempos = document.getElementById('res-tiempos');
    var notaT = document.getElementById('res-tiempos-nota');
    tiempos.innerHTML = '';
    var hayTr = false;
    var lat2013 = CONFIG.normas2013.latenciaPorEmocion;
    var maxSeg = 0;
    CONFIG.intensidades.forEach(function (i) {
      var d = r.por_intensidad[i];
      if (d.tr_medio_ms !== null) maxSeg = Math.max(maxSeg, d.tr_medio_ms / 1000);
      var ref = 0, n = 0;
      Object.keys(lat2013).forEach(function (k) { ref += lat2013[k][i - 1]; n++; });
      maxSeg = Math.max(maxSeg, ref / n);
    });
    maxSeg = Math.max(maxSeg, 1) * 1.15;

    CONFIG.intensidades.forEach(function (i) {
      var d = r.por_intensidad[i];
      if (d.tr_medio_ms === null) return;
      hayTr = true;
      var seg = d.tr_medio_ms / 1000;
      var ref = 0, n = 0;
      Object.keys(lat2013).forEach(function (k) { ref += lat2013[k][i - 1]; n++; });
      ref = ref / n;
      var fila = document.createElement('div');
      fila.className = 'perfil-fila';
      fila.innerHTML =
        '<div class="perfil-nombre">Intensidad ' + i + '</div>' +
        '<div class="perfil-barra">' +
          '<div class="perfil-relleno azul" style="width:' + (100 * seg / maxSeg).toFixed(0) + '%"></div>' +
          '<div class="perfil-norma" style="left:' + (100 * ref / maxSeg).toFixed(0) + '%" ' +
               'title="Muestra de 2013: ' + ref.toFixed(2).replace('.', ',') + ' s"></div>' +
        '</div>' +
        '<div class="perfil-cifra">' + seg.toFixed(2).replace('.', ',') + ' s</div>';
      tiempos.appendChild(fila);
    });

    if (!hayTr) {
      tiempos.innerHTML = '<p class="nota">Sin tiempos registrados.</p>';
      notaT.textContent = '';
    } else {
      notaT.innerHTML = 'La línea vertical marca el promedio de 2013 en cada intensidad. ' +
        'Compare la <em>forma</em> de la curva, no la altura: los tiempos de un teléfono de hoy ' +
        'no son directamente comparables con los de un computador de hace más de diez años.';
    }

    // Confusiones: solo si las hubo
    var bloqueC = document.getElementById('res-confusiones-bloque');
    var listaC = document.getElementById('res-confusiones');
    var pares = Object.keys(r.confusiones || {}).sort(function (a, b) {
      return r.confusiones[b] - r.confusiones[a];
    });
    if (!pares.length) {
      bloqueC.hidden = true;
    } else {
      listaC.innerHTML = '';
      pares.slice(0, 4).forEach(function (k) {
        var p = k.split('>'), veces = r.confusiones[k];
        var fila = document.createElement('div');
        fila.className = 'confusion-fila';
        fila.innerHTML =
          '<span class="confusion-de">' + nombreEmocion(p[0]) + '</span>' +
          '<span class="confusion-flecha">se le pareció a</span>' +
          '<span class="confusion-a">' + nombreEmocion(p[1]) + '</span>' +
          '<span class="confusion-n">' + (veces === 1 ? 'una vez' : veces + ' veces') + '</span>';
        listaC.appendChild(fila);
      });
      bloqueC.hidden = false;
    }

    // Detalle tecnico
    var reg = DATOS.actual();
    var tec = document.getElementById('res-tecnico');
    tec.innerHTML =
      '<dl>' +
      '<dt>Identificador</dt><dd>' + reg.id + '</dd>' +
      '<dt>Cohorte</dt><dd>' + reg.cohorte + '</dd>' +
      '<dt>Aciertos</dt><dd>' + r.aciertos + ' de ' + r.n_ensayos + '</dd>' +
      '<dt>Sin respuesta</dt><dd>' + r.sin_respuesta + '</dd>' +
      '<dt>Latencia media</dt><dd>' + (r.tr_medio_ms === null ? 'sin dato' : r.tr_medio_ms + ' ms') + '</dd>' +
      '<dt>Tiempo respondiendo</dt><dd>' + (r.tr_total_ms === null ? 'sin dato' :
        (r.tr_total_ms / 1000).toFixed(1).replace('.', ',') + ' s ' +
        '<span class="nota">(en 2013 la prueba completa promedió ' +
        String(CONFIG.normas2013.tiempoTotalMedioSeg).replace('.', ',') + ' s)</span>') + '</dd>' +
      '<dt>Ensayos marcados</dt><dd>' + r.ensayos_marcados + ' de ' + r.n_ensayos + '</dd>' +
      '<dt>Índice compatible 2013</dt><dd>' + r.indice_compat_2013 + ' de 48 ' +
        '<span class="nota">(escala antigua, solo para comparar con los baremos de aquel estudio)</span></dd>' +
      '<dt>Modo de presentación</dt><dd>' + reg.presentacion.modo + '</dd>' +
      '<dt>Imagen</dt><dd>' + reg.presentacion.ancho_imagen_css + ' x ' +
        reg.presentacion.alto_imagen_css + ' px CSS, densidad ' + reg.aparato.densidad_pixeles + '</dd>' +
      '<dt>Entrada</dt><dd>' + reg.aparato.tipo_entrada + '</dd>' +
      '<dt>Incidencias</dt><dd>' + (reg.incidencias.length || 'ninguna') + '</dd>' +
      '</dl>';
  }

  /* El participante se lleva una imagen, no un archivo de datos. Los datos en
     bruto quedan en el detalle tecnico, que es donde los buscariamos nosotros. */

  var ultimoResumen = null;

  document.getElementById('btn-descargar').addEventListener('click', function () {
    var btn = this;
    if (!ultimoResumen) return;
    btn.disabled = true;
    var rotulo = btn.textContent;
    btn.textContent = 'Preparando...';
    TARJETA.descargar(ultimoResumen, percentil2013(ultimoResumen.indice_compat_2013))
      .then(function (ok) {
        btn.disabled = false;
        btn.textContent = ok ? 'Guardado' : rotulo;
        if (!ok) {
          document.getElementById('nota-descarga').textContent =
            'No se pudo generar la imagen en este navegador. Puede hacer una captura de pantalla.';
        }
      });
  });

  document.getElementById('enlace-datos').addEventListener('click', function (e) {
    e.preventDefault();
    DATOS.descargarPropio();
  });

  document.getElementById('btn-terminar').addEventListener('click', function () {
    ir('pantalla-cierre');
  });

  /* --- Utilidades de trabajo -------------------------------------------------
     Disponibles desde la consola del navegador mientras desarrollamos:
       TMIRFE.exportarTodo()     descarga todo lo guardado en este navegador
       TMIRFE.verificarOrden(n)  comprueba la aleatorizacion restringida       */

  window.TMIRFE = {
    exportarTodo: DATOS.descargarTodo,
    registros: DATOS.todosLosRegistros,
    pintarResultado: pintarResultado,   // expuestas para poder probar la pantalla final
    percentil2013: percentil2013,
    verificarOrden: function (n) {
      n = n || 2000;
      var fallos = 0;
      for (var k = 0; k < n; k++) {
        var s = ENSAYO.generarSecuencia();
        for (var i = 1; i < s.length; i++) {
          if (s[i].emocion === s[i - 1].emocion || s[i].intensidad === s[i - 1].intensidad) fallos++;
        }
      }
      console.log(n + ' secuencias generadas, ' + fallos + ' violaciones de la restriccion.');
      return fallos;
    }
  };

})();
