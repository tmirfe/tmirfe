$(document).ready(function(){
    //TODO  --solo explorer
    if ($.browser.msie){
        $('fieldset div').css('padding','0px 6px 0px');
        $('#txtSave,#txtGuardar').css('margin','4px 0px 4px');
        $('input[type=password]').css('width','150px');
        $('legend').css('margin-left','10px');
    }
    //TODO para quitar la margen entre div del form, --solo chrome
    if (!($.browser.msie || $.browser.mozilla)) $('#contenido form div').css('margin','0px');
    var ID= "";
    $('#txtSave').button({
        icons:{
            primary: "ui-icon-locked"
        }
    });
$('#txtGuardar').button({
    icons:{
        primary: "ui-icon-locked"
    }
});
$('.btnDelete').button({
    icons:{
        primary: "ui-icon-scissors"
    },
    text: false
});
$('.btnDeleteAll').button({
    icons:{
        primary: "ui-icon-scissors"
    },
    text: false
});
$('.btnAdd').button({
    icons:{
        primary: "ui-icon-plusthick"
    },
    text: false
});
$('.btnUpdate').button({
    icons:{
        primary: "ui-icon-pencil"
    },
    text: false
});
$('.btnSave').button({
    icons:{
        primary: "ui-icon-disk"
    },
    text: false
});
$('.btnCancel').button({
    icons:{
        primary: "ui-icon-close"
    },
    text: false
});
    
$('#dialogo').dialog({
    autoOpen: false,
    modal: true,
    title: "Información",
    width: 300,
    minWidth: 300,
    maxWidth: 400,
    show: "fold",
    hide: "scale",
    buttons: {
        'Si': function() {      
            DeleteUser(ID);
            $(this).dialog('close');
        // window.setTimeout(function(){$(location).attr('href','vw_usuario.php')},400);
        },
        'Cancelar': function() {
            $(this).dialog('close');
        }
    }
});
$('#dialogo2').dialog({
    autoOpen: false,
    modal: true,
    title: "Información",
    width: 300,
    minWidth: 300,
    maxWidth: 400,
    show: "fold",
    hide: "scale",
    buttons: {
        'Si': function() {      
            $(this).dialog('close');
            deleteUsers();
        },
        'Cancelar': function() {
            $(this).dialog('close');
        }
    }
});
$('#dialogo3').dialog({
    autoOpen: false,
    modal: true,
    title: "Créditos",
    width: 300,
    minWidth: 300,
    maxWidth: 400,
    show: "fold",
    hide: "scale"
});
$('#msjGx').dialog({
    autoOpen: false,
    closeOnEscape: false,
    modal: true,
    title: "Información",
    width: 300,
    minWidth: 300,
    maxWidth: 400,
    show: "fold",
    hide: "scale",
    buttons: {
        'Aceptar': function() {      
            $(this).dialog('close');
            window.setTimeout(function(){$(location).attr('href','vw_menu.php')},400);
        }
    }
});
$('#msjOK').dialog({
    autoOpen: false,
    closeOnEscape: false,
    modal: true,
    title: "Información",
    width: 330,
    minWidth: 330,
    maxWidth: 400,
    show: "fold",
    hide: "scale",
    buttons: {
        'Si': function() {      
            $(this).dialog('close');
            window.setTimeout(function(){$(location).attr('href','vw_info.php')},300);
        },
        'No': function() {      
           $(this).dialog('close');
        }
    }
});

$('#msjTutorial').dialog({
   autoOpen: false,
   closeOnEscape: false,
   modal: true,
   title: "Información",
   width: 330,
   minWidth: 330,
   maxWidth: 400,
   show: "fold",
   hide: "scale",
   buttons: {
       'Si': function() {      
           $(this).dialog('close');
           window.setTimeout(function(){$(location).attr('href','vw_info.php')},300);
       },
       'No': function() {      
          $(this).dialog('close');
          window.setTimeout(function(){$(location).attr('href','vw_menu.php')},300);
       }
   }
});

$('#msjGame').dialog({
   autoOpen: false,
   closeOnEscape: false,
   modal: true,
   title: "Información",
   width: 330,
   minWidth: 330,
   maxWidth: 400,
   show: "fold",
   hide: "scale",
   buttons: {
       'Si': function() {      
           $(this).dialog('close');
           window.setTimeout(function(){$(location).attr('href','vw_game.php')},300);
       },
       'No': function() {      
          $(this).dialog('close');
          window.setTimeout(function(){$(location).attr('href','vw_menu.php')},300);
       }
   }
});


$('#msjFirst').dialog({
    autoOpen: false,
    modal: true,
    title: "<small>Información</small>",
    width: 284,
    height:100,
    minWidth: 284,
    maxWidth: 400,
    show: "fold",
    hide: "scale"
});
    
// $('#txtSave').addClass('ui-icon ui-icon-calendar');
$.datepicker.setDefaults($.datepicker.regional["es"]);
    $('input[name=txtFecha],#exportDI,#exportDF').datepicker({
        minDate: new Date(1930, 1 - 1, 1),
        yearRange: "1930:2020",
        showOn:'button',
        buttonText: 'Selecciona una fecha',
        buttonImage:'CSS/images/calendario.jpg',
        buttonImageOnly: true,
        changeMonth: true,
        changeYear: true,
        dateFormat: "yy-mm-dd" 
    });
    //TODO agregar Info
    $('#txtSave').click(function(){
        validarUsuario();
    });
    //TODO Estilo tabla img
    $('#images img').addClass('ui-corner-all');
    if (!$.browser.msie)$('#images img').button();
    $('#images').on('click','img',function(){
        var id=$(this).attr('id');
        ajaxShowImage(id)
        $('#msg div').addClass('msg');
        return false;
    });
    //TODO add user
    $('.btnAdd').click(function(){
        $('#filaNew').removeClass('filaNew');
    })
    $('.btnCancel').click(function(){
        $('#filaNew').addClass('filaNew');
        $('#filaNew').find('input').val(""); 
        $("#error").css("display", "none");
        $(".error").remove();
    })
    //TODO eliminar user
    $('.btnDelete').live('click',function(){
        var id=$(this).parent('span').attr('id');
        ID=id;//la puse global
        $("#dialogo").dialog( "open" );
    //DeleteUser(id);
    });
    //TODO elimar todo
    $('.btnDeleteAll').live('click',function(){
        $("#dialogo2").dialog("open");
    });
    //TODO chekear
    $('a.marcar').click(function(){
        $("#tblUsuarios input[type=checkbox]:checkbox:not(:checked)").attr("checked", "checked");
    });
    $('a.desmarcar').click(function(){
        $("#tblUsuarios input[type=checkbox]:checkbox:checked").removeAttr("checked");
    });
    //TODO modificar
    $("table tr .modo").live('click',function(){//colocar id la imagne y acceder por ella como en btnCancel
        var id=$(this).parent('span').attr('id');
        $("#f"+id).hide('fast',function(){
            $("#f"+id+"s").show('fast');
            selectItem($("#f"+id).find('td').eq(4).text());
        });
        $('.btnCancelar').button({
            icons:{
                primary: "ui-icon-close"
            },
            text: false
        });
        $('.btnGuardar').button({
            icons:{
                primary: "ui-icon-disk"
            },
            text: false
        });
        return false;
    });
    $('.btnCancelar').live('click',function(){
        var id=$(this).parent('span').attr('id');
        $("#f"+id+"s").hide('fast',function(){
            $("#f"+id).show('fast');
        }) ;
    });
    $('#btnCredito').click(function(){
        $("#dialogo3").dialog( "open" );
    })
});

function selectItem(name){
    $('option').each(function(){
        if($(this).text()==name){
            $(this).attr("selected",true);
            return;
        }
    })
}

function deleteUsers(){
    $('#tblUsuarios tr').each(function(index){ //TODO recorrer cada tr
        $(this).children("td").each(function (index1) { //recorrer cada td
            switch (index1) {
                case 0:
                    var checkbox = $(this).find('input[type=checkbox]');
                    if ($(checkbox).is(':checked')){
                        var id = $(checkbox).parent().attr('id');
                        DeleteUser(id);
                    }
            }
        });
    });
}
function existSession(){
    if($('#IDsession').val()!=""){
        $(location).attr('href','vw_game.php');
    }else{
        $("#msjFirst").html("<small>Debe ingresar primero la información</small>");
        $("#msjFirst").dialog( "open" );
        //alert("Debe ingresar primero la informacion");
    }
}
function permitirPrueba(){
    if($('#IDsession').val()==""){
        $("#msjOK").html("<small>Acepta usted participar voluntariamente de esta prueba, y que los datos puedan ser usados en las investigaciones derivadas</small>");
        $("#msjOK").dialog( "open" );
    }else $(location).attr('href','vw_info.php');
}

function permitirPrueba2(){
       $("#msjTutorial").html("<small>Acepta usted participar voluntariamente de esta prueba, y que los datos puedan ser usados en las investigaciones derivadas</small>");
       $("#msjTutorial").dialog( "open" );
   }

function iniciarGame(){
   $("#msjGame").html("<small>&iquest;Desea comenzar el test?</small>");
   $("#msjGame").dialog( "open" );
}

function permitirGame(){
   if($('#IDsession').val()==""){
   	permitirPrueba2();
   }else iniciarGame();
}

function defaultAction(event){
    if(event.keyCode == 13)
    {
        validarUsuario();
    }
}

function validarUsuario()
{
    var res= validaciones();
        if(res=='si'){
            $("#error").css("display", "block");
            return;
        }
        $("#error").css("display", "none");
        ajaxExisteUser();
}