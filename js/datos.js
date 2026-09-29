/* ==========================================================================
   T-Mirfe 2.0 - Registro y exportacion de datos
   Regla central: respuesta, acierto y latencia se guardan SIEMPRE por separado.
   Nunca se colapsan en un solo numero, que fue el defecto de la version 2013.
   ========================================================================== */

var DATOS = (function () {

  var registro = null;

  /* --- Identificadores -------------------------------------------------- */

  function idAnonimo() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    var s = '';
    for (var i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }

  function cohorteDeUrl() {
    var m = /[?&]c=([^&#]+)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : CONFIG.cohortePorDefecto;
  }

  /* --- Contexto del aparato ---------------------------------------------
     Se guarda para poder controlarlo despues como covariable. Los tiempos
     absolutos no son comparables entre un telefono y un computador, pero el
     analisis que interesa (gradiente por intensidad) es intrasujeto y por lo
     tanto cada persona sirve de su propio control.                        */

  function contextoAparato() {
    var toque = (navigator.maxTouchPoints || 0) > 0;
    return {
      tipo_entrada: toque ? 'tactil' : 'puntero',
      puntos_toque: navigator.maxTouchPoints || 0,
      ancho_pantalla: window.screen ? window.screen.width : null,
      alto_pantalla: window.screen ? window.screen.height : null,
      ancho_ventana: window.innerWidth,
      alto_ventana: window.innerHeight,
      densidad_pixeles: +((window.devicePixelRatio || 1).toFixed(3)),
      agente: navigator.userAgent,
      idioma: navigator.language,
      zona_horaria: (Intl && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
      origen_tiempo: (performance && performance.timeOrigin) ? Math.round(performance.timeOrigin) : null
    };
  }

  /* --- Ciclo de vida del registro ---------------------------------------- */

  function iniciar() {
    registro = {
      id: idAnonimo(),
      version_app: CONFIG.version,
      cohorte: cohorteDeUrl(),
      inicio: new Date().toISOString(),
      fin: null,
      consentimiento: null,
      participante: {},
      aparato: contextoAparato(),
      presentacion: {
        modo: CONFIG.presentacion.modo,
        fondo: CONFIG.presentacion.fondoEnsayo,
        ms_exposicion: CONFIG.msExposicion,
        ms_mascara: CONFIG.msMascara,
        orden_botones: CONFIG.emociones.map(function (e) { return e.clave; }),
        disposicion_botones: null,   // 'fila' o 'rejilla', se fija al montar
        ancho_imagen_css: null,
        alto_imagen_css: null
      },
      practica: [],
      calibracion: [],
      ensayos: [],
      resumen: null,
      incidencias: []
    };
    return registro;
  }

  function actual() { return registro; }

  function anotarConsentimiento(aceptado) {
    registro.consentimiento = { aceptado: !!aceptado, momento: new Date().toISOString() };
  }

  function anotarParticipante(obj) {
    registro.participante = obj;
    if (obj.anio_nacimiento) {
      registro.participante.edad = new Date().getFullYear() - Number(obj.anio_nacimiento);
    }
  }

  function anotarPresentacion(campos) {
    for (var k in campos) if (campos.hasOwnProperty(k)) registro.presentacion[k] = campos[k];
  }

  function anotarIncidencia(texto, extra) {
    registro.incidencias.push({ momento: new Date().toISOString(), texto: texto, extra: extra || null });
  }

  /* --- Ensayos -----------------------------------------------------------
     Cada ensayo guarda cuatro cosas independientes:
       respondio   true / false
       respuesta   la emocion elegida, o null
       acierto     1 / 0, o null si no respondio
       tr_ms       latencia desde que la imagen quedo pintada, o null       */

  function anotarEnsayo(e, esPractica) {
    var fila = {
      orden: e.orden,
      emocion: e.emocion,
      intensidad: e.intensidad,
      archivo: e.archivo,
      respondio: e.respondio,
      respuesta: e.respuesta,
      // En la practica no hay emocion objetivo declarada, asi que tampoco hay
      // acierto que calcular: esos ensayos ensenan el mecanismo, no se puntuan.
      acierto: (!e.respondio || e.emocion === null) ? null : (e.respuesta === e.emocion ? 1 : 0),
      tr_ms: e.tr_ms,
      tr_bajo_minimo: (e.tr_ms !== null && e.tr_ms < CONFIG.msMinimoValido),
      censurado: !e.respondio,
      t_onset_ms: e.t_onset_ms,
      demora_pintado_ms: e.demora_pintado_ms,
      // Banderas de calidad. No excluyen nada por si mismas: la decision se
      // toma al analizar, pero el dato queda marcado en el origen.
      onset_por_respaldo: !!e.onset_por_respaldo,
      interrumpido: !!e.interrumpido,
      // 0 = el dedo cayo en el centro del boton, 1 = justo en el borde.
      // Sirve para estimar cuantas respuestas pudieron ser un toque errado.
      margen_toque: (e.margen_toque === undefined) ? null : e.margen_toque
    };
    if (esPractica) registro.practica.push(fila); else registro.ensayos.push(fila);
    return fila;
  }

  /* Calibracion motora: en el centro aparece el nombre de una emocion y la
     persona toca su boton. 'correcto' significa que toco el boton pedido; la
     latencia captura busqueda de la etiqueta mas movimiento, sin juicio
     emocional. */

  function anotarCalibracion(e) {
    var fila = {
      orden: e.orden,
      objetivo: e.objetivo,
      respondio: e.respondio,
      respuesta: e.respuesta,
      correcto: e.respondio ? (e.respuesta === e.objetivo ? 1 : 0) : null,
      tr_ms: e.tr_ms,
      tr_bajo_minimo: (e.tr_ms !== null && e.tr_ms < CONFIG.msMinimoValido),
      censurado: !e.respondio,
      onset_por_respaldo: !!e.onset_por_respaldo,
      interrumpido: !!e.interrumpido,
      margen_toque: (e.margen_toque === undefined) ? null : e.margen_toque
    };
    registro.calibracion.push(fila);
    return fila;
  }

  /* --- Resumen -----------------------------------------------------------
     Se calculan dos puntajes:
       aciertos           0 a 24, la medida real de reconocimiento
       indice_compat_2013 0 a 48, reproduciendo la escala antigua
                          (2 acierto, 1 error respondido, 0 sin respuesta)
                          solo para poder comparar con los baremos de 2013.  */

  function cerrar() {
    var ens = registro.ensayos;
    var aciertos = 0, respondidos = 0, compat = 0, sumaTr = 0, nTr = 0;
    var porEmocion = {}, porIntensidad = {};

    CONFIG.emociones.forEach(function (em) {
      porEmocion[em.clave] = { aciertos: 0, total: 0, sin_respuesta: 0, suma_tr: 0, n_tr: 0 };
    });
    CONFIG.intensidades.forEach(function (i) {
      porIntensidad[i] = { aciertos: 0, total: 0, sin_respuesta: 0, suma_tr: 0, n_tr: 0 };
    });

    ens.forEach(function (f) {
      var pe = porEmocion[f.emocion], pi = porIntensidad[f.intensidad];
      pe.total++; pi.total++;

      if (!f.respondio) {
        pe.sin_respuesta++; pi.sin_respuesta++;
      } else {
        respondidos++;
        compat += (f.acierto === 1) ? 2 : 1;
        if (f.acierto === 1) { aciertos++; pe.aciertos++; pi.aciertos++; }
        if (f.tr_ms !== null) {
          sumaTr += f.tr_ms; nTr++;
          pe.suma_tr += f.tr_ms; pe.n_tr++;
          pi.suma_tr += f.tr_ms; pi.n_tr++;
        }
      }
    });

    // Patron de confusiones: que respondio cuando fallo. 'miedo>sorpresa': 2
    var confusiones = {};
    ens.forEach(function (f) {
      if (f.respondio && f.acierto === 0 && f.respuesta) {
        var k = f.emocion + '>' + f.respuesta;
        confusiones[k] = (confusiones[k] || 0) + 1;
      }
    });

    // Resumen de la calibracion motora: mediana por boton, para poder restar
    // despues el componente motor de la latencia de cada ensayo del test.
    function mediana(v) {
      if (!v.length) return null;
      var s = v.slice().sort(function (a, b) { return a - b; });
      var m = Math.floor(s.length / 2);
      return s.length % 2 ? Math.round(s[m]) : Math.round((s[m - 1] + s[m]) / 2);
    }
    var cal = registro.calibracion || [];
    var calPorBoton = {};
    CONFIG.emociones.forEach(function (em) {
      var filas = cal.filter(function (f) { return f.objetivo === em.clave; });
      var ts = filas.filter(function (f) { return f.correcto === 1 && f.tr_ms !== null; })
                    .map(function (f) { return f.tr_ms; });
      calPorBoton[em.clave] = {
        n: filas.length,
        tr_mediana_ms: mediana(ts),
        errores: filas.filter(function (f) { return f.correcto === 0; }).length,
        sin_respuesta: filas.filter(function (f) { return !f.respondio; }).length
      };
    });
    var calTs = cal.filter(function (f) { return f.correcto === 1 && f.tr_ms !== null; })
                   .map(function (f) { return f.tr_ms; });

    function media(o) { return o.n_tr ? Math.round(o.suma_tr / o.n_tr) : null; }
    Object.keys(porEmocion).forEach(function (k) { porEmocion[k].tr_medio_ms = media(porEmocion[k]); });
    Object.keys(porIntensidad).forEach(function (k) { porIntensidad[k].tr_medio_ms = media(porIntensidad[k]); });

    registro.resumen = {
      n_ensayos: ens.length,
      ensayos_marcados: ens.filter(function (f) {
        return f.interrumpido || f.onset_por_respaldo || f.tr_bajo_minimo;
      }).length,
      aciertos: aciertos,
      porcentaje_acierto: ens.length ? +(100 * aciertos / ens.length).toFixed(2) : null,
      respondidos: respondidos,
      sin_respuesta: ens.length - respondidos,
      indice_compat_2013: compat,
      tr_medio_ms: nTr ? Math.round(sumaTr / nTr) : null,
      tr_total_ms: sumaTr ? Math.round(sumaTr) : null,
      calibracion: cal.length ? {
        n: cal.length,
        tr_mediana_ms: mediana(calTs),
        errores: cal.filter(function (f) { return f.correcto === 0; }).length,
        por_boton: calPorBoton
      } : null,
      por_emocion: porEmocion,
      por_intensidad: porIntensidad,
      confusiones: confusiones
    };
    registro.fin = new Date().toISOString();
    guardarLocal();
    return registro.resumen;
  }

  /* --- Persistencia ------------------------------------------------------ */

  function guardarLocal() {
    try {
      var previos = JSON.parse(localStorage.getItem(CONFIG.claveAlmacenamiento) || '[]');
      previos = previos.filter(function (r) { return r.id !== registro.id; });
      previos.push(registro);
      localStorage.setItem(CONFIG.claveAlmacenamiento, JSON.stringify(previos));
      localStorage.setItem(CONFIG.claveAlmacenamiento + '_hecho', registro.inicio || '1');
    } catch (err) {
      anotarIncidencia('no se pudo guardar en el navegador', String(err));
    }
  }

  /* Deteccion de repeticiones. La marca queda en el navegador al terminar una
     aplicacion, de modo que atrapa el caso realista (la misma persona repite en
     el mismo telefono). No atrapa a quien cambie de aparato o borre los datos
     del navegador, pero para un estudio anonimo en linea ese es el techo. */

  function yaRespondio() {
    try { return !!localStorage.getItem(CONFIG.claveAlmacenamiento + '_hecho'); }
    catch (err) { return false; }
  }

  function todosLosRegistros() {
    try { return JSON.parse(localStorage.getItem(CONFIG.claveAlmacenamiento) || '[]'); }
    catch (err) { return []; }
  }

  /* --- Exportacion ------------------------------------------------------- */

  var COLUMNAS = [
    'id', 'cohorte', 'version_app', 'inicio', 'fin',
    'sexo', 'anio_nacimiento', 'edad', 'ciudad_residencia', 'ciudad_fuera_de_lista', 'crianza',
    'estado_civil', 'nivel_educativo', 'ocupacion',
    'tipo_entrada', 'ancho_ventana', 'alto_ventana', 'densidad_pixeles',
    'modo_presentacion', 'ms_exposicion',
    'fase', 'orden', 'emocion', 'intensidad', 'respondio', 'respuesta', 'acierto',
    'tr_ms', 'censurado', 'tr_bajo_minimo', 'onset_por_respaldo', 'interrumpido',
    'margen_toque'
  ];

  function aFilasLargas(r) {
    var p = r.participante || {}, a = r.aparato || {}, pr = r.presentacion || {};
    var prefijo = [
      r.id, r.cohorte, r.version_app, r.inicio, r.fin,
      p.sexo, p.anio_nacimiento, p.edad, p.ciudad_residencia,
      p.ciudad_fuera_de_lista ? 1 : 0, p.crianza,
      p.estado_civil, p.nivel_educativo, p.ocupacion,
      a.tipo_entrada, a.ancho_ventana, a.alto_ventana, a.densidad_pixeles,
      pr.modo, pr.ms_exposicion
    ];
    var filas = (r.calibracion || []).map(function (f) {
      return prefijo.concat([
        'calibracion', f.orden, f.objetivo, '', f.respondio ? 1 : 0,
        f.respuesta === null ? '' : f.respuesta,
        f.correcto === null ? '' : f.correcto,
        f.tr_ms === null ? '' : f.tr_ms, f.censurado ? 1 : 0, f.tr_bajo_minimo ? 1 : 0,
        f.onset_por_respaldo ? 1 : 0, f.interrumpido ? 1 : 0,
        f.margen_toque === null || f.margen_toque === undefined ? '' : f.margen_toque
      ]);
    });
    return filas.concat(r.ensayos.map(function (f) {
      return prefijo.concat([
        'test', f.orden, f.emocion, f.intensidad, f.respondio ? 1 : 0,
        f.respuesta === null ? '' : f.respuesta,
        f.acierto === null ? '' : f.acierto,
        f.tr_ms === null ? '' : f.tr_ms, f.censurado ? 1 : 0, f.tr_bajo_minimo ? 1 : 0,
        f.onset_por_respaldo ? 1 : 0, f.interrumpido ? 1 : 0,
        f.margen_toque === null || f.margen_toque === undefined ? '' : f.margen_toque
      ]);
    }));
  }

  function aCsv(registros) {
    function celda(v) {
      if (v === null || v === undefined) return '';
      var s = String(v);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var lineas = [COLUMNAS.join(';')];
    registros.forEach(function (r) {
      aFilasLargas(r).forEach(function (fila) { lineas.push(fila.map(celda).join(';')); });
    });
    return '﻿' + lineas.join('\r\n');   // BOM para que Excel lea las tildes
  }

  function descargar(nombre, contenido, tipo) {
    var blob = new Blob([contenido], { type: tipo + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function descargarPropio() {
    var sello = (registro.inicio || '').replace(/[:.]/g, '-').slice(0, 19);
    descargar('tmirfe_' + sello + '.json', JSON.stringify(registro, null, 2), 'application/json');
    descargar('tmirfe_' + sello + '.csv', aCsv([registro]), 'text/csv');
  }

  function descargarTodo() {
    var todos = todosLosRegistros();
    if (!todos.length) { alert('No hay registros guardados en este navegador.'); return; }
    descargar('tmirfe_todos.csv', aCsv(todos), 'text/csv');
    descargar('tmirfe_todos.json', JSON.stringify(todos, null, 2), 'application/json');
  }

  /* --- Envio remoto (queda listo para cuando exista el proyecto) ---------- */

  /* Se reintenta ante fallos de red o del servidor (5xx), no ante rechazos
     (4xx): un registro repetido o invalido no mejora insistiendo.
     No se usa keepalive: algunos navegadores lo rechazan en peticiones con
     verificacion previa (CORS), y las de Supabase la necesitan. */
  var ESPERAS_REINTENTO = [1500, 4000];

  function enviar() {
    var sb = CONFIG.supabase;
    if (!sb.url || !sb.anonKey) {
      return Promise.resolve({ enviado: false, motivo: 'sin backend configurado' });
    }
    if (!sb.recoleccionAbierta && registro.cohorte !== sb.cohortePrueba) {
      return Promise.resolve({ enviado: false, motivo: 'recoleccion cerrada' });
    }
    var cuerpo = JSON.stringify({ id: registro.id, cohorte: registro.cohorte, contenido: registro });
    var encabezados = {
      'Content-Type': 'application/json',
      'apikey': sb.anonKey,
      'Prefer': 'return=minimal'
    };
    // Las claves antiguas (anon) son JWT y tambien iban como Bearer. Las nuevas
    // (sb_publishable_...) no lo son, y en ese encabezado se rechazan.
    if (/^eyJ/.test(sb.anonKey)) encabezados['Authorization'] = 'Bearer ' + sb.anonKey;

    function intento(n) {
      return fetch(sb.url + '/rest/v1/' + sb.tabla, {
        method: 'POST', headers: encabezados, body: cuerpo
      }).then(function (r) {
        if (r.ok) return { enviado: true, estado: r.status, intentos: n + 1 };
        if (r.status >= 500 && n < ESPERAS_REINTENTO.length) return esperar(n);
        return { enviado: false, estado: r.status, intentos: n + 1 };
      }).catch(function (e) {
        if (n < ESPERAS_REINTENTO.length) return esperar(n);
        anotarIncidencia('fallo el envio remoto', String(e));
        return { enviado: false, motivo: String(e), intentos: n + 1 };
      });
    }
    function esperar(n) {
      return new Promise(function (listo) {
        setTimeout(function () { listo(intento(n + 1)); }, ESPERAS_REINTENTO[n]);
      });
    }
    return intento(0);
  }

  return {
    iniciar: iniciar, actual: actual,
    anotarConsentimiento: anotarConsentimiento,
    anotarParticipante: anotarParticipante,
    anotarPresentacion: anotarPresentacion,
    anotarIncidencia: anotarIncidencia,
    anotarEnsayo: anotarEnsayo,
    anotarCalibracion: anotarCalibracion,
    cerrar: cerrar,
    yaRespondio: yaRespondio,
    todosLosRegistros: todosLosRegistros,
    descargarPropio: descargarPropio,
    descargarTodo: descargarTodo,
    enviar: enviar
  };
})();
