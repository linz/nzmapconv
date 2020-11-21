var nzmapconv = nzmapconv || {};
var LINZ = LINZ || {};
nzmapconv.entryFields = []
nzmapconv.CoordEntry = function (entryfield) {
    this.entryField = entryfield;
    this.id = entryfield.attr('id');
    var cstypelist = [];
    var cscodes = entryfield.data('coordsys');
    if (cscodes == null) cscodes = this.id
    if (cscodes != null) {
        for (var cscode of cscodes.split(" ")) {
            var cs = null;
            switch (cscode) {
                case 'nz260': cs = new LINZ.CoordType.NZMS260MapRef(); break;
                case 'nztopo50': cs = new LINZ.CoordType.Topo50MapRef(); break;
                case 'nzgd49': cs = new LINZ.CoordType.LatLon('NZGD1949'); break;
                case 'nzgd2000': cs = new LINZ.CoordType.LatLon('NZGD2000'); break;
                case 'nzmg': cs = new LINZ.CoordType.Projection('NZMG'); break;
                case 'nztm': cs = new LINZ.CoordType.Projection('NZTM'); break;
            };
            if (cs !== null) cstypelist.push(cs);
        }
    }
    this.cstypelist = cstypelist;
    if (cstypelist.length == 1) {
        var format = entryfield.data('format');
        if (format != null) {
            var options = {}
            for (var opt of format.match(/\b\w+\:\w+\b/g)) {
                var kv = opt.split(':');
                options[kv[0]] = kv[1];
            }
            cstypelist[0].setOptions(options);
        }
    }
    this.preKeyText = '';
    var current = this;
    // Handle key events (13=calc, otherwise check validity)
    entryfield.keydown(function (e) { current.onKeyDown(e); });
    entryfield.keyup(function (e) { current.onKeyUp(e); });
    // Paste event - check validity and try to convert
    entryfield.on('paste', function () {
        setTimeout(function () {
            current.onPaste();
        }, 4); // Apparently 4ms is official timeout
    });
    entryfield.click(function () { $(this).select(); });
    if (entryfield.hasClass('addcopybutton')) {
        entryfield.wrap($('<div>'));
        var copybutton = $("<input>");
        copybutton.addClass("copybutton");
        copybutton.click(function () {
            current.copyToClipboard();
            return false
        });
        copybutton.insertAfter(entryfield);

    }
    this.setTitle();
    nzmapconv.entryFields.push(current);

}

/* Optional callback function.  Probably should be event? */
nzmapconv.fieldConverted = null;

nzmapconv.CoordEntry.prototype.clearField = function (coord) {
    this.entryField.val("");
    this.entryField.removeClass('invalidcoord');
}

nzmapconv.CoordEntry.prototype.setCoord = function (coord) {
    if (this.cstypelist.length == 1) {
        var coordstr = "";
        if (coord != undefined) this.entryField.val(this.cstypelist[0].format(coord));
        this.preKeyText = this.entryField.val();
    }
}

nzmapconv.CoordEntry.prototype.copyToClipboard = function () {
    var entryfield = this.entryField;
    var text = entryfield.val();
    if (text != "") {
        entryfield.focus();
        entryfield.select();
        document.execCommand("Copy", false, null);

    }
}

nzmapconv.CoordEntry.prototype.setTitle = function () {
    if (this.cstypelist.length == 1) {
        this.entryField.prop('title', 'E.g. ' + this.cstypelist[0].example());
    }
}


nzmapconv.CoordEntry.prototype.clearOtherFields = function () {
    var current = this;
    $.each(nzmapconv.entryFields, function () {
        if (this !== current) this.clearField();
    });
}

nzmapconv.CoordEntry.prototype.setOtherFields = function (coord) {
    var current = this;
    $.each(nzmapconv.entryFields, function () {
        if (this !== current) this.setCoord(coord);
    });
}

nzmapconv.CoordEntry.applyToClass = function (cls, func) {
    $.each(nzmapconv.entryFields, function () {
        if ($('div.' + cls + ' #' + this.id).length) func(this);
    });
}

nzmapconv.CoordEntry.reloadOptions = function (cls, func) {
    $.each(nzmapconv.entryFields, function () {
        this.setTitle();
    });
}

nzmapconv.CoordEntry.prototype.tryConvert = function (fireEvent) {
    for (var cstype of this.cstypelist) {
        var coord = cstype.parse(this.entryField.val());
        if (coord !== undefined) {
            this.setOtherFields(coord);
            this.entryField.select();
            this.preKeyText = this.entryField.val();
            if (fireEvent && nzmapconv.CoordEntry.fieldConverted) nzmapconv.CoordEntry.fieldConverted(this);
            return;
        }
        this.setInvalidClass();
    }
}


nzmapconv.CoordEntry.prototype.onKeyDown = function (e) {
    this.preKeyText = this.entryField.val();
}

nzmapconv.CoordEntry.prototype.onKeyUp = function (e) {
    if (e.keyCode == 13) {
        this.tryConvert(true);
    }
    else if (this.entryField.val() != this.preKeyText) {
        this.clearOtherFields();
        this.setInvalidClass();
    }
}

nzmapconv.CoordEntry.prototype.text = function () {
    return this.entryField.val();
}

nzmapconv.CoordEntry.prototype.setText = function (newtext) {
    this.entryField.val(newtext);
    this.tryConvert(false); /* Don't fire conversion event as assume from resetting history...*/
}

nzmapconv.CoordEntry.prototype.onPaste = function () {
    this.tryConvert(true);
}

nzmapconv.CoordEntry.prototype.setInvalidClass = function () {
    var coordstr = this.entryField.val();
    var isvalid = false;
    if (coordstr != '') {
        for (var cstype of this.cstypelist) {
            coord = cstype.parse(this.entryField.val());
            if (coord !== undefined) {
                isvalid = true;
                break;
            }
        }
    }
    if (isvalid) {
        this.entryField.removeClass('invalidcoord');
    }
    else {
        this.entryField.addClass('invalidcoord');
    }
}

nzmapconv.CoordEntry.prototype.setCoordOptions = function (options) {
    for (var cstype of this.cstypelist) {
        cstype.setOptions(options);
    }
}