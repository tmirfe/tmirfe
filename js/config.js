/* ==========================================================================
   T-Mirfe 2.0 - Configuracion
   Todo parametro que afecte la presentacion o la puntuacion vive aqui,
   y se guarda dentro de cada registro para que la aplicacion sea reproducible.
   ========================================================================== */

var CONFIG = {

  version: '2.0.0-esqueleto',

  /* --- Emociones y estimulos ------------------------------------------- */

  // El orden de esta lista es el orden FIJO de los botones de respuesta.
  // Se conserva el de la version de 2013 (Miedo, Alegria, Tristeza, Asco, Sorpresa, Ira).
  emociones: [
    { clave: 'miedo',    etiqueta: 'Miedo'    },
    { clave: 'alegria',  etiqueta: 'Alegría'  },
    { clave: 'tristeza', etiqueta: 'Tristeza' },
    { clave: 'asco',     etiqueta: 'Asco'     },
    { clave: 'sorpresa', etiqueta: 'Sorpresa' },
    { clave: 'ira',      etiqueta: 'Ira'      }
  ],

  intensidades: [1, 2, 3, 4],

  rutaFotos: 'fotos/',

  /* Los archivos llevan nombres opacos a proposito. Con nombres del tipo
     miedo_3.jpg, cualquiera que mirara el codigo de la pagina o mantuviera
     pulsada la imagen veria la respuesta. El orden del mapa reproduce el de
     las columnas de la base de 2013. */
  estimulos: [
    { emocion: 'tristeza', intensidad: 1, archivo: 'e01.jpg' },
    { emocion: 'tristeza', intensidad: 2, archivo: 'e02.jpg' },
    { emocion: 'tristeza', intensidad: 3, archivo: 'e03.jpg' },
    { emocion: 'tristeza', intensidad: 4, archivo: 'e04.jpg' },
    { emocion: 'sorpresa', intensidad: 1, archivo: 'e05.jpg' },
    { emocion: 'sorpresa', intensidad: 2, archivo: 'e06.jpg' },
    { emocion: 'sorpresa', intensidad: 3, archivo: 'e07.jpg' },
    { emocion: 'sorpresa', intensidad: 4, archivo: 'e08.jpg' },
    { emocion: 'alegria',  intensidad: 1, archivo: 'e09.jpg' },
    { emocion: 'alegria',  intensidad: 2, archivo: 'e10.jpg' },
    { emocion: 'alegria',  intensidad: 3, archivo: 'e11.jpg' },
    { emocion: 'alegria',  intensidad: 4, archivo: 'e12.jpg' },
    { emocion: 'miedo',    intensidad: 1, archivo: 'e13.jpg' },
    { emocion: 'miedo',    intensidad: 2, archivo: 'e14.jpg' },
    { emocion: 'miedo',    intensidad: 3, archivo: 'e15.jpg' },
    { emocion: 'miedo',    intensidad: 4, archivo: 'e16.jpg' },
    { emocion: 'ira',      intensidad: 1, archivo: 'e17.jpg' },
    { emocion: 'ira',      intensidad: 2, archivo: 'e18.jpg' },
    { emocion: 'ira',      intensidad: 3, archivo: 'e19.jpg' },
    { emocion: 'ira',      intensidad: 4, archivo: 'e20.jpg' },
    { emocion: 'asco',     intensidad: 1, archivo: 'e21.jpg' },
    { emocion: 'asco',     intensidad: 2, archivo: 'e22.jpg' },
    { emocion: 'asco',     intensidad: 3, archivo: 'e23.jpg' },
    { emocion: 'asco',     intensidad: 4, archivo: 'e24.jpg' }
  ],

  /* Fotografias de practica. Ninguna es del test, de modo que nadie llega a la
     prueba con un estimulo ya visto.
       p1  toma alterna de alegria intensidad 4, descartada en la seleccion
       p2  desprecio, emocion que el estudio excluyo del diseno
       p3  desprecio
     La practica NO da retroalimentacion de acierto. Solo ensena el mecanismo
     y el ritmo. Decir al participante si acerto seria entrenarlo, y entrenar
     el reconocimiento es justamente lo que la prueba no puede hacer antes de
     medirlo. */
  practica: [
    { archivo: 'p1.jpg' },
    { archivo: 'p2.jpg' },
    { archivo: 'p3.jpg' }
  ],

  msRetroalimentacion: 1600,   // cuanto dura el aviso de mecanica en la practica

  /* --- Calibracion motora (observacion de Norvey, 13-08-2026) --------------
     Bloque corto entre la practica y el test: en el centro aparece el NOMBRE
     de una emocion y la persona toca su boton lo mas rapido que puede. Como no
     hay juicio emocional, la latencia captura solo la busqueda de la etiqueta
     y el movimiento del dedo hasta cada boton. Restada de la latencia del
     test, deja una estimacion mas limpia del tiempo de reconocimiento. */
  calibracion: {
    activa: true,
    ensayosPorEmocion: 2,     // 12 toques en total, menos de un minuto
    msExposicion: 6000,       // misma ventana que el test
    msMascara: 800            // pausa breve entre toques
  },

  /* --- Cronometria ------------------------------------------------------ */

  msExposicion: 6000,   // ventana de respuesta, igual a la de 2013
  msMascara:    2000,   // pantalla gris con cruz de fijacion entre ensayos
  msMinimoValido: 200,  // por debajo de esto no es una decision, es anticipacion

  // Si la pestana pasa a segundo plano, el navegador deja de emitir fotogramas
  // y requestAnimationFrame no dispara. Sin este respaldo el ensayo se quedaria
  // congelado con la imagen en pantalla. Pasado este plazo se arranca igual y
  // el ensayo queda marcado.
  msRespaldoPintado: 250,

  /* --- Presentacion ----------------------------------------------------- */
  // Modo revisado (opcion B). El fondo iguala el gris medio del fondo de las
  // 24 fotografias, promediado sobre 96 muestras de esquina: 151,151,151.
  presentacion: {
    modo: 'revisado-2026',
    fondoEnsayo: '#979797',
    altoImagenVh: 58,        // alto objetivo del estimulo, en % de la altura util
    relacionImagen: 700/850  // ancho/alto nativo de los estimulos
  },

  /* --- Identidad grafica ------------------------------------------------ */
  /* Verde institucional muestreado del propio logosimbolo oficial descargado de
     udea.edu.co (color dominante de los trazos opacos: rgb 14,110,60). Es la
     fuente mas fiable disponible sin el manual, cuyos PDF rechazan la descarga
     automatica. Conviene confirmarlo contra la Resolucion Rectoral 48342. */
  marca: {
    verde:       '#0e6e3c',
    verdeOscuro: '#0a5a30',
    verdeClaro:  '#1a8f56'
  },

  /* --- Normas de 2013 ---------------------------------------------------
     Porcentaje de acierto REAL de la muestra de Medellin (n = 252),
     recalculado a partir de la base original separando acierto (codigo 2)
     de error respondido (codigo 1) y de no respuesta (codigo 0).
     Difiere de lo publicado en la tesis, que sumaba las tres categorias
     en una sola escala de 0 a 48.                                        */

  normas2013: {
    n: 252,
    aciertoPorEmocion: {
      alegria:  93.55,
      ira:      90.28,
      sorpresa: 86.41,
      tristeza: 83.63,
      asco:     80.65,
      miedo:    71.73
    },
    // Latencia media en segundos, por emocion e intensidad (1 a 4).
    latenciaPorEmocion: {
      tristeza: [2.86, 2.62, 2.56, 2.51],
      sorpresa: [2.84, 2.60, 2.37, 2.37],
      alegria:  [2.36, 2.29, 2.15, 2.11],
      miedo:    [3.38, 3.18, 3.05, 3.08],
      ira:      [2.98, 2.54, 2.42, 2.34],
      asco:     [2.81, 2.71, 2.65, 2.53]
    },
    noRespuestaPorIntensidad: [13.2, 6.6, 4.7, 3.6],  // porcentaje

    // Baremos publicados en 2013. OJO: estan en la escala antigua de 0 a 48
    // (2 acierto, 1 error respondido, 0 sin respuesta). No son comparables
    // con el puntaje de acierto de 0 a 24. Se conservan solo para calcular
    // el "indice compatible 2013" del informe.
    baremosEscalaAntigua: { p25: 41, p50: 44, p75: 46, maximo: 48 },

    /* Distribucion completa de los 252 participantes en la escala de 0 a 48,
       recuperada de la salida original del SPSS (20 de marzo de 2013). Permite
       dar un percentil real en vez de interpolar entre tres baremos.
       El percentil solo se calcula sobre el indice compatible, que se construye
       exactamente igual que aquel puntaje. */
    distribucionIndice: {
      12: 1, 13: 1, 14: 1, 16: 1, 22: 1, 26: 4, 29: 1, 31: 2, 33: 2, 34: 1,
      35: 4, 36: 3, 37: 6, 38: 4, 39: 10, 40: 10, 41: 18, 42: 23, 43: 19,
      44: 28, 45: 32, 46: 33, 47: 24, 48: 23
    },

    // Tiempo total de la prueba en 2013, en segundos (Tabla 11 de la tesis).
    // Se informa como referencia, nunca como percentil: los tiempos absolutos
    // no son comparables entre un computador de 2013 y un telefono de hoy.
    tiempoTotalMedioSeg: 58.6
  },

  /* --- Envio de datos ---------------------------------------------------
     Mientras no haya backend, la aplicacion funciona igual y guarda en el
     navegador. Al conectar Supabase se llenan url y anonKey.

     recoleccionAbierta es la compuerta etica: mientras sea false, la app solo
     envia las aplicaciones de prueba del equipo (enlace con ?c=prueba), que el
     analisis excluye. Se pone en true el dia que el comite de etica apruebe. */
  supabase: {
    url: '',        // Project URL, https://<proyecto>.supabase.co
    anonKey: '',    // clave publicable (sb_publishable_...); es publica por diseno
    tabla: 'aplicaciones',
    recoleccionAbierta: false,
    cohortePrueba: 'prueba'
  },

  /* --- Varios ----------------------------------------------------------- */
  cohortePorDefecto: 'sin-cohorte',
  claveAlmacenamiento: 'tmirfe_v2'
};
