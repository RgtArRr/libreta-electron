var sql = require('sql.js');
var fs = require('fs');
$ = jQuery = require("jquery");

var filebuffer = fs.readFileSync('resources/libreta.sqlite');
var db = new database(filebuffer);
var form = new LibretaForm();

getNotas();
form.draw(function () {
    if (form.idlibreta === null) {
        db.writeDB("INSERT INTO libreta(titulo, contenido, created_at) VALUES ('" + form.titulo.html() + "', '" + form.contenido.val() + "', (datetime('now','localtime')))");
    } else {
        db.writeDB("UPDATE libreta set titulo = '" + form.titulo.html() + "', contenido = '" + form.contenido.val() + "', update_at = (datetime('now','localtime')) where id_libreta = '" + form.idlibreta + "'");
    }
    getNotas();
    toogleView();
});


//Utilidad para leer y escribir en la bd.
function database(filebuffer) {
    this.db = new SQL.Database(filebuffer);

    this.writeDB = function (query) {
        var res = this.db.exec(query);
        var data = this.db.export();
        var buffer = new Buffer(data);
        fs.writeFileSync("resources/libreta.sqlite", buffer);
        return res;
    };

    this.readDB = function (query) {
        return this.db.exec(query);
    };
}


function LibretaForm() {
    this.idlibreta = null;
    this.titulo = null;
    this.contenido = null;
    this.draw = function (onSave) {
        var div1 = createNode("div", "titulo nuevaNotaContainer");
        var div2 = createNode("div", "container-fluid nuevaNotaContainer");
        var div3 = createNode("div", "modal-body");
        var div4 = createNode("div", "lines");
        var div5 = createNode("div", "modal-footer footer nuevaNotaContainer");
        this.contenido = createNode("textarea", false);
        this.titulo = createNode("h4", "modal-title");
        var buttonClose1 = createNode("button", "close");
        var buttonClose2 = createNode("button", "btn btn-secondary");
        var buttonGuardar = createNode("button", "btn btn-primary");
        buttonClose1.attr("type", "button");
        buttonClose1.append(createNode("span", false).html("&times"));
        buttonClose1.click(function () {
            toogleView();
        });
        buttonClose2.attr("type", "button");
        buttonClose2.html("Cerrar");
        buttonClose2.click(function () {
            toogleView();
        });
        buttonGuardar.attr("type", "button");
        buttonGuardar.html("Guardar");
        buttonGuardar.click(function () {
            onSave();
        });
        this.contenido.attr("id", "contenido");
        this.titulo.attr("contenteditable", "true");
        div3.append(div4);
        div3.append(this.contenido);
        div2.append(div3);
        div1.append(buttonClose1);
        div1.append(this.titulo);
        div5.append(buttonClose2);
        div5.append(buttonGuardar);
        this.titulo.html("Nuevo");
        $("body").append(div1);
        $("body").append(div2);
        $("body").append(div5);
    };

    this.load = function (id) {
        this.clear();
        this.idlibreta = id;
        var res = db.readDB("SELECT * FROM libreta where id_libreta = '" + this.idlibreta + "'");
        this.titulo.html(res[0].values[0][1]);
        this.contenido.val(res[0].values[0][2]);
        toogleView();
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
    var res = db.readDB("SELECT * FROM (SELECT id_libreta, substr(titulo,0,12), substr(contenido, 0,23), created_at, update_at FROM libreta ORDER BY created_at DESC) ORDER BY update_at DESC");
    $.each(res[0].values, function (iii, nnn) {
        $("#notas").append(libretaCard(nnn));
    });
}

//Generar html de cada "nota" que se crea
function libretaCard(libreta) {
    var divRow = createNode("div", "col-sm-4");
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
        timestampText.html(timeSince(new Date(((libreta[4] === null) ? libreta[3] : libreta[4]))));
    }, 3000);

    divRow.on('destroyed', function (e) {
        clearInterval(idInterval);
    });
    return divRow;
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
var b = true;
function toogleView() {
    if (b) {
        $(".mainContainer").show();
        $(".nuevaNotaContainer").hide();
        b = false;
    } else {
        $(".mainContainer").hide();
        $(".nuevaNotaContainer").show();
        $(window).trigger('resize');
        b = true;
    }
}

toogleView();

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
    var viewportWidth = win.width() - 135;
    var viewportHeight = win.height() - 165;
    if (viewportHeight > 0) {
        $('#contenido').width(viewportWidth);
        $('#contenido').height(viewportHeight);
        $(".lines").height(viewportHeight);
    }
});

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
