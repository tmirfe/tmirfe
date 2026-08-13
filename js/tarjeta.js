/* ==========================================================================
   T-Mirfe 2.0 - Tarjeta de resultados en PNG

   El participante no tiene nada que hacer con un JSON. Lo que quiere es una
   imagen que pueda guardar y mostrarle a alguien. Se dibuja a mano en un
   lienzo en vez de fotografiar la pantalla: asi el resultado es igual en todos
   los telefonos, cabe en un chat y no arrastra la interfaz.

   Todo se dibuja con la API de Canvas y el logo va incrustado como data URI,
   de modo que la descarga funciona incluso abriendo la aplicacion con doble
   clic, sin servidor.
   ========================================================================== */

var TARJETA = (function () {

  var A = 1080, ALTO = 1350;   // vertical, encaja bien en un chat

  var C = {
    verde:      '#0e6e3c',
    verdeClaro: '#1a8f56',
    tinta:      '#1c2321',
    suave:      '#5a6663',
    papel:      '#ffffff',
    papelAlt:   '#f4f6f5',
    borde:      '#d8dedb',
    azul:       '#4b7fa8'
  };

  function fuente(px, peso) {
    return (peso || 400) + ' ' + px + 'px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  }

  function redondeado(g, x, y, an, al, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + an, y, x + an, y + al, r);
    g.arcTo(x + an, y + al, x, y + al, r);
    g.arcTo(x, y + al, x, y, r);
    g.arcTo(x, y, x + an, y, r);
    g.closePath();
  }

  function barra(g, x, y, an, al, proporcion, color, marca) {
    g.fillStyle = C.papelAlt;
    redondeado(g, x, y, an, al, al / 2); g.fill();
    g.strokeStyle = C.borde; g.lineWidth = 2;
    redondeado(g, x, y, an, al, al / 2); g.stroke();

    var w = Math.max(0, Math.min(1, proporcion)) * an;
    if (w > 2) {
      g.save();
      redondeado(g, x, y, an, al, al / 2); g.clip();
      g.fillStyle = color;
      g.fillRect(x, y, w, al);
      g.restore();
    }
    if (typeof marca === 'number') {
      var mx = x + Math.max(0, Math.min(1, marca)) * an;
      g.fillStyle = 'rgba(28,35,33,0.55)';
      g.fillRect(mx - 2, y - 4, 4, al + 8);
    }
  }

  function nombreEmocion(clave) {
    var e = CONFIG.emociones.filter(function (x) { return x.clave === clave; })[0];
    return e ? e.etiqueta : clave;
  }

  /* --- Dibujo -------------------------------------------------------------- */

  function dibujar(g, r, percentil, logo) {
    g.fillStyle = C.papel;
    g.fillRect(0, 0, A, ALTO);

    var m = 80;             // margen
    var y = 74;

    if (logo) {
      var lw = 300, lh = lw * (logo.height / logo.width);
      g.drawImage(logo, m, y, lw, lh);
      y += lh + 46;
    } else {
      y += 20;
    }

    g.fillStyle = C.verde;
    g.font = fuente(58, 700);
    g.fillText('T-Mirfe', m, y);
    y += 34;
    g.fillStyle = C.suave;
    g.font = fuente(21, 400);
    g.fillText('Reconocimiento facial de emociones', m, y);
    y += 44;

    // Marcador
    var altoCaja = 200;
    g.fillStyle = C.papelAlt;
    redondeado(g, m, y, A - 2 * m, altoCaja, 20); g.fill();

    g.textAlign = 'center';
    var cx = A / 2;
    g.fillStyle = C.verde;
    g.font = fuente(120, 700);
    g.fillText(String(r.aciertos), cx - 26, y + 128);
    g.fillStyle = C.suave;
    g.font = fuente(48, 400);
    g.fillText('/24', cx + 66, y + 128);
    g.font = fuente(24, 400);
    g.fillText('emociones reconocidas de 24', cx, y + 168);
    g.textAlign = 'left';
    y += altoCaja + 52;

    // Percentil
    if (percentil !== null && percentil !== undefined) {
      g.fillStyle = C.tinta;
      g.font = fuente(28, 700);
      g.fillText('Percentil ' + percentil, m, y);
      g.fillStyle = C.suave;
      g.font = fuente(21, 400);
      g.fillText('frente a la muestra de Medellín de 2013', m + 230, y);
      y += 22;

      var anB = A - 2 * m;
      var grad = g.createLinearGradient(m, 0, m + anB, 0);
      grad.addColorStop(0, '#d9e3de');
      grad.addColorStop(1, C.verdeClaro);
      g.fillStyle = grad;
      redondeado(g, m, y, anB, 16, 8); g.fill();
      var px = m + (percentil / 100) * anB;
      g.fillStyle = C.verde;
      redondeado(g, px - 4, y - 7, 8, 30, 4); g.fill();
      y += 66;
    }

    // Perfil por emocion
    g.fillStyle = C.tinta;
    g.font = fuente(28, 700);
    g.fillText('Por emoción', m, y);
    y += 30;

    var claves = Object.keys(r.por_emocion).sort(function (a, b) {
      return r.por_emocion[b].aciertos - r.por_emocion[a].aciertos;
    });
    var anBarra = A - 2 * m - 250;
    claves.forEach(function (k) {
      var d = r.por_emocion[k];
      g.fillStyle = C.suave;
      g.font = fuente(22, 400);
      g.fillText(nombreEmocion(k), m, y + 18);
      barra(g, m + 150, y + 2, anBarra, 22, d.aciertos / d.total, C.verdeClaro,
            (CONFIG.normas2013.aciertoPorEmocion[k] || 0) / 100);
      g.fillStyle = C.suave;
      g.font = fuente(21, 400);
      g.textAlign = 'right';
      g.fillText(d.aciertos + '/' + d.total, A - m, y + 18);
      g.textAlign = 'left';
      y += 38;
    });
    y += 22;

    // Gradiente por intensidad
    g.fillStyle = C.tinta;
    g.font = fuente(28, 700);
    g.fillText('Cuanto más sutil, más cuesta', m, y);
    y += 30;

    CONFIG.intensidades.forEach(function (i) {
      var d = r.por_intensidad[i];
      g.fillStyle = C.suave;
      g.font = fuente(22, 400);
      g.fillText('Intensidad ' + i, m, y + 18);
      barra(g, m + 150, y + 2, anBarra, 22, d.aciertos / d.total, C.azul);
      g.fillStyle = C.suave;
      g.font = fuente(21, 400);
      g.textAlign = 'right';
      g.fillText(d.aciertos + '/' + d.total, A - m, y + 18);
      g.textAlign = 'left';
      y += 38;
    });

    // Pie
    var yPie = ALTO - 92;
    g.strokeStyle = C.borde;
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(m, yPie); g.lineTo(A - m, yPie); g.stroke();
    g.fillStyle = C.suave;
    g.font = fuente(20, 400);
    g.fillText('Programa de Psicología · Universidad de Antioquia', m, yPie + 34);
    if (r.tr_medio_ms) {
      g.textAlign = 'right';
      g.fillText('Respondió en ' + (r.tr_medio_ms / 1000).toFixed(1).replace('.', ',') +
                 ' s por fotografía', A - m, yPie + 34);
      g.textAlign = 'left';
    }
    g.fillStyle = C.borde;
    g.font = fuente(18, 400);
    g.fillText('Esta prueba no es un diagnóstico.', m, yPie + 62);
  }

  /* --- Generacion ----------------------------------------------------------- */

  function generar(r, percentil) {
    return new Promise(function (resolver) {
      var lienzo = document.createElement('canvas');
      lienzo.width = A; lienzo.height = ALTO;
      var g = lienzo.getContext('2d');

      var pintar = function (logo) {
        try { dibujar(g, r, percentil, logo); } catch (e) {
          DATOS.anotarIncidencia('fallo al dibujar la tarjeta', String(e));
        }
        resolver(lienzo);
      };

      if (typeof MARCA_UDEA === 'string' && MARCA_UDEA) {
        var img = new Image();
        img.onload = function () { pintar(img); };
        img.onerror = function () { pintar(null); };
        img.src = MARCA_UDEA;
      } else {
        pintar(null);
      }
    });
  }

  function descargar(r, percentil) {
    return generar(r, percentil).then(function (lienzo) {
      return new Promise(function (resolver) {
        var fin = function (blob) {
          if (!blob) { resolver(false); return; }
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'mi-resultado-tmirfe.png';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          resolver(true);
        };
        if (lienzo.toBlob) lienzo.toBlob(fin, 'image/png');
        else fin(null);
      });
    });
  }

  return { generar: generar, descargar: descargar };
})();
