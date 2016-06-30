var sql = require('sql.js');
var fs = require('fs');
$ = jQuery = require("jquery");
var fileDB = "resources/libreta.sqlite";
var db
try {
  var filebuffer = fs.readFileSync(fileDB);
  db = new database(filebuffer);
}catch (e) {
  db = new database(new sql.Database());
  db.writeDB("CREATE TABLE libreta (id_libreta integer NOT NULL PRIMARY KEY AUTOINCREMENT, titulo	text, contenido	text NOT NULL, created_at	text, update_at	text, delete_at	text);");
}
var form = new LibretaForm();
var footer = new Footer();
footer.draw();
getNotas();

var saveLibreta = function(){
  if (form.idlibreta === null) {
    db.writeDB("INSERT INTO libreta(titulo, contenido, created_at, update_at) VALUES ('" + form.titulo.html() + "', '" + form.contenido.val() + "', datetime('now','localtime'), datetime('now','localtime'))");
  } else {
    db.writeDB("UPDATE libreta set titulo = '" + form.titulo.html() + "', contenido = '" + form.contenido.val() + "', update_at = (datetime('now','localtime')) where id_libreta = '" + form.idlibreta + "'");
  }
  getNotas();
  toogleView("main");
}

form.draw(saveLibreta);

$("#btnNew").click(function(){
  toogleView("formNota");
  form.clear();
});


//Utilidad para leer y escribir en la bd.
function database(filebuffer) {
  this.db = new SQL.Database(filebuffer);

  this.writeDB = function (query) {
    var res = this.db.exec(query);
    var data = this.db.export();
    var buffer = new Buffer(data);
    fs.writeFileSync(fileDB, buffer);
    return res;
  };

  this.readDB = function (query) {
    return this.db.exec(query);
  };
}


function LibretaForm() {
  this.contenedor = null;
  this.idlibreta = null;
  this.titulo = null;
  this.contenido = null;
  this.lines = null
  this.draw = function () {
    this.contenedor = $("#formNota");
    this.contenido = createNode("textarea", false);
    this.titulo = createNode("h4", "titulo");
    this.lines = createNode("div", "lines");
    this.contenido.attr("id", "contenido");
    this.titulo.attr("contenteditable", "true");
    this.titulo.html("Nuevo");
    this.contenedor.append(this.titulo);
    this.contenedor.append(this.lines);
    this.contenedor.append(this.contenido);
  };

  this.load = function (id) {
    this.clear();
    this.idlibreta = id;
    var res = db.readDB("SELECT * FROM libreta where id_libreta = '" + this.idlibreta + "'");
    this.titulo.html(res[0].values[0][1]);
    this.contenido.val(res[0].values[0][2]);
    toogleView("formNota");
  };

  this.clear = function () {
    this.idlibreta = null;
    this.titulo.html("Nuevo");
    this.contenido.val("");
  };
}

//Obtener todas las notas
function getNotas() {
  $("#notas").html("");
  var res = db.readDB("SELECT id_libreta, substr(titulo,0,12), substr(contenido, 0,23), created_at, update_at FROM libreta ORDER BY update_at DESC");
  if(res[0]){
    $.each(res[0].values, function (iii, nnn) {
      $("#notas").append(libretaCard(nnn));
    });
  }
}

//Generar html de cada "nota" que se crea
function libretaCard(libreta) {
  var divRow = createNode("div", "col-xs-6 col-sm-4 col-md-4");
  var contenedorPrimary = createNode("div", "card");
  var contenedor = createNode("div", "card-block");
  var titulo = createNode("h4", "card-title");
  var contenido = createNode("div", "card-text");
  var timestampText = createNode("small", "text-muted");
  var timestamp = createNode("div", "card-text");
  timestamp.append(timestampText);
  contenedor.append(titulo);
  contenedor.append(createNode("hr", false));
  contenedor.append(contenido);
  contenedor.append(timestamp);
  contenedorPrimary.append(contenedor);
  titulo.html(libreta[1] + ((libreta[1].length === 11) ? "..." : ""));
  contenido.html(libreta[2] + ((libreta[2].length === 22) ? "..." : ""));
  contenedor.click(function () {
    form.load(libreta[0]);
  });
  divRow.append(contenedorPrimary);
  var idInterval = setNewInterval(function () {
    timestampText.html(timeSince(new Date(libreta[4])));
  }, 3000);

  divRow.on('destroyed', function (e) {
    clearInterval(idInterval);
  });
  return divRow;
}

function Footer(){
  var footer = null;
  var titulo = null;
  var toolbarFooter = null;
  var btnCancel = null;
  var btnSave = null;

  this.draw = function(){
    this.footer = createNode("footer", "toolbar toolbar-footer");
    this.titulo = createNode("h1", "title");
    this.toolbarFooter = createNode("div", "toolbar-actions");
    this.btnCancel = createNode("button", "btn btn-default");
    this.btnSave = createNode("button", "btn btn-primary pull-right");
    this.toolbarFooter.append(this.btnCancel);
    this.toolbarFooter.append(this.btnSave);
    this.footer.append(this.titulo);
    this.footer.append(this.toolbarFooter);
    this.btnCancel.html("Cerrar");
    this.btnSave.html("Guardar");
    this.titulo.html("Libreta de notas")
    this.btnCancel.click(function(){
      toogleView("main");
    });
    this.btnSave.click(function(){
      saveLibreta();
    });
    $("body .window").append(this.footer);
  };
}

//Utilidad para generar html
function createNode(etiqueta, Etclass) {
  var node = $("<" + etiqueta + "></" + etiqueta + ">");
  if (Etclass) {
    node.attr("class", Etclass);
  }
  return node;
}

//SPA, cambiar de vistas
function toogleView(vista) {
  if (vista == "main") {
    footer.titulo.show();
    footer.toolbarFooter.hide();
    form.contenedor.hide();
    $("#main").show();
    return;
  }
  if(vista == "formNota"){
    footer.titulo.hide();
    footer.toolbarFooter.show();
    form.contenedor.show();
    $("#main").hide();
    return;
  }
}

toogleView("main");

//Evento cuando se borra un elemento
(function ($) {
  $.event.special.destroyed = {
    remove: function (o) {
      if (o.handler) {
        o.handler();
      }
    }
  };
})(jQuery);


//"Resposive"
$(window).on('resize', function () {
  var win = $(this);
  var viewportWidth = win.width();
  var viewportHeight = win.height();
  if (viewportHeight > 0) {
    form.titulo.width(viewportWidth - 4);
    form.contenido.width(viewportWidth - 60);
    form.contenido.height(viewportHeight - 136);
    form.lines.height(viewportHeight - 130);
    $("#notas").height(viewportHeight-63);
  }
});
$(window).trigger('resize');

function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  if (seconds < 5) {
    return "ahora";
  } else if (seconds < 60) {
    return "hace " + seconds + " segundos";
  } else if (seconds < 3600) {
    minutes = Math.floor(seconds / 60);
    if (minutes > 1) {
      return "hace " + minutes + " minutos";
    } else {
      return "hace 1 minuto";
    }
  } else if (seconds < 86400) {
    hours = Math.floor(seconds / 3600);
    if (hours > 1) {
      return "hace " + hours + " horas";
    } else {
      return "hace 1 hora";
    }
  } else if (seconds < 172800) {
    days = Math.floor(seconds / 86400);
    if (days > 1) {
      return "hace" + days + " dias";
    } else {
      return "hace 1 dia";
    }
  } else {
    return date.getDate().toString() + " " + months[date.getMonth()] + ", " + date.getFullYear();
  }
}


//Ejecutar inmediatamente una funcion
function setNewInterval(fn, delay) {
  fn();
  return setInterval(fn, delay);
}
