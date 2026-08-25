<?php
$permiso = '1';
include_once '../Configuracion/InclusionBasica.php';
?>
<!DOCTYPE html>
<html>
    <head>
        <title>Test de psicologia</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link rel="stylesheet" type="text/css" href="CSS/jquery-ui-1.8.21.custom.css">
        <link rel="stylesheet" type="text/css" href="CSS/generic.css">
        <script type="text/javascript"  src="JS/jquery-1.7.2.min.js"></script>
        <script type="text/javascript"  src="JS/jquery.timer.js"></script>
        <script type="text/javascript" src="JS/jquery-ui-1.8.21.custom.min.js"></script>
        <script type="text/javascript" src="JS/jquery.ui.datepicker-es.js"></script>
        <script type="text/javascript" src="JS/jquery.countdown.js"></script>
        <script type="text/javascript" src="JS/js_core.js"></script>  
        <script type="text/javascript" src="JS/js_validaciones.js"></script>  
        <script type="text/javascript" src="JS/js_ajax.js"></script>
    </head>
    <script>
        var seg = 6000;
        var stopTimer = false;
        var timer;
        var firstTime = true;
        var clk = false;
        clicked = false;
        $(document).ready(function() {
        $.fn.message = function(mensaje, position, evento)  {
        $( "#dialog" ).html(mensaje);
            $( "#dialog" ).dialog({
            title: "Tutorial",
            autoOpen: true,
            show: evento,
            height: 100,
            weight: 100,
            position: { my: "center top", at: position, of: window }
        });
        };
        $('.botons input').button();
            $("#imgShow").message('Comienza el Test', "left", "fade");
            timer = $.timer(function() {
                if(seg == 6000) {
                    clk = false;
                    if(firstTime) $("#imgShow").message('Saldra una imagen en blanco durante 3 segundos', "left", "blind");
                    else  $("#imgShow").message('Recuerda: blanca durante 3 segundos. Emoci&oacute;n durante 6!!', "left", "blind");
                    $("#imgShow").attr('src','Fotos/blanco.jpg');
                    seg = 4000;
                }
                else {
                if(clicked) {
                   firstTime = true;
                   $( "#dialog").dialog( "close" );
                   	permitirGame();
                   }
                else if(firstTime) $("#imgShow").message('y una foto con una emoci&oacute;n durante seis segundos', "left", "clip");
                else {
                     $("#imgShow").message('&iquest;Qu&eacute; expresa la imagen? Selecciona la emoci&oacute;n', "left", "Blind");
                           clk = true;
                           timer.pause();
                           stopTimer = true;
                        }
                if(clicked) {
                        clicked = false;
                        firstTime = true;
                        } else firstTime = false;

                    $("#imgShow").attr('src','Fotos/Smiley.png');
                    seg = 6000;
                }
                if(!stopTimer)timer.set({ time : seg, autostart : true });
            });
            timer.set({ time : seg, autostart : true });
        });        
    </script>
    <style type="text/css">
        /*.pics { margin:10px auto;width:400px }*/
        .pics img { width: 400px; height: 400px }
        .botons input{width: 100px;height: 100px;font-size: medium}

    </style>
    <script>
        $(document).ready(function(){
            $(":button").click(function(event){
              if(clk) {
            	  btnFeel = $(this).attr("id");
						if(btnFeel == 'Alegria') {
							clk = false;
	                  $("#imgShow").attr('src','Fotos/blanco.jpg');
	                  btnFeel = $(this).attr("value");
	                  seg = 4000;
	 						$( "#dialog").dialog( "close" );
	                  $("#dialog").message("Correcto!! Ha finalizado el tutorial", "center", "fade")
	                  timer.set({ time : seg, autostart : true });
	                  timer.reset();
	                  timer.play();
	                  stopTimer = false;
	                  clicked = true;
	                  $(this).removeClass('ui-state-focus');
						} else {
							$(this).dialog( "close" );
							$(this).message("Te haz equivocado!! intentalo nuevamente ", "left", "fade")
						}
              } else $(this).removeClass('ui-state-focus');
            });
        })
    </script>
    <body>
        <div id="contenedor">
            <div id="cabecera">
                <img src="CSS/images/logo.png" width="500" height="150">                
            </div>   
            <div id="contenido">
                <?php include 'vw_session.php'; ?>
                <div class="desc">
                  <div></div>
                </div>
                <center>
                    <div class="pics" >
                        <img id="imgShow"  src="Fotos/trans.png" style="width: 40%; height: 40%;"></img>
                    </div>
                    <div class="botons">
                        <input id="Miedo" class="test" type="button" value="Miedo"></input>
                        <input id="Alegria" type="button" value="Alegr&iacute;a"></input>
                        <input id="Tristeza" type="button" value="Tristeza"></input>
                        <input id="Asco" type="button" value="Asco"></input>
                        <input id="Sorpresa" type="button" value="Sorpresa"></input>
                        <input id="Ira" type="button" value="Ira"></input>
                    </div>
                </center>
                <div id="msjGame"></div>
                <div id="msjTutorial"></div>
                <div class="toggler">
                <div id="dialog" class="ui-widget-content ui-corner-all" hidden=true>
                  <p>

                  </p>
                 </div>
                  </div>
                <br>
            </div>  
            <?php include 'vw_pie.html';?>
        </div>    
    </body>
</html>
