// iScatter 1.0 Copyright (c) 2013 by The Open University, UK 
function typeOf(t) {
    var e = typeof t;
    return "object" === e && (t ? t instanceof Array && (e = "array") : e = "null"), e
}

function same_value(t, e) {
    var i = typeOf(t),
        s = typeOf(e);
    if (i !== s) return !1;
    if ("array" === i) {
        if (t.length != e.length) return !1;
        t.sort(), e.sort();
        for (var r = 0; r < t.length; r++)
            if (!same_value(t[r], e[r])) return !1;
        return !0
    }
    if ("object" === s) {
        var n = Object.keys(t),
            a = Object.keys(e);
        if (!same_value(n, a)) return !1;
        for (var r = 0; r < n.length; r++)
            if (!same_value(t[n[r]], e[n[r]])) return !1;
        return !0
    }
    return t === e
}

function Attribute(t) {
    if ("object" != typeOf(t)) throw "not an object";
    if ("string" != typeOf(t.id)) throw "id is missing or isn't a string";
    if ("string" != typeOf(t.name)) throw t.id + ": name is missing or isn't a string";
    if ("string" != typeOf(t.description)) throw t.id + ": description is missing or isn't a string";
    if (-1 == ["number", "string", "date"].indexOf(t.type)) throw t.id + ": type is missing or not one of 'number', 'string', 'date";
    if (-1 == ["nominal", "ordinal", "interval", "ratio"].indexOf(t.level)) throw t.id + ": level is missing or not one of 'nominal, 'ordinal', 'interval', 'ratio'";
    if ("string" == t.type && ["interval", "ratio"].indexOf(t.level) >= 0) throw t.id + ": interval or ratio attribute must be of numeric or date type";
    if ("string" != typeOf(t.unit)) throw t.id + ": unit is missing or isn't a string";
    return this._name = t.name, this._description = t.description, this._type = t.type, this._level = t.level, this._unit = t.unit, this._decimals = -1, this._date = d3.time.format.iso, this
}

function Schema(t) {
    if ("string" === typeOf(t) && (t = loadTable(t)), "array" !== typeOf(t)) throw "schema is missing or not an array of attributes";
    if (0 == t.length) throw "schema is empty";
    for (var e = 0; e < t.length; e++) try {
        var i = new Attribute(t[e]),
            s = t[e].id;
        if (s in this) throw "duplicate attribute id " + s;
        this[s] = i
    } catch (r) {
        throw "attribute " + r
    }
    return this
}

function Dataset(t) {
    return t instanceof Schema ? (this._name = "a dataset", this._description = "", this._schema = t, this.bag = !1, this.attributes = t.attributes(), this.tuples = [], this.ids = [], this.observers = [], void 0) : null
}

function loadTable(t) {
    var e = new XMLHttpRequest;
    e.overrideMimeType && e.overrideMimeType("text/csv"), e.open("GET", t, !1), e.setRequestHeader("Accept", "text/csv"), e.send(null);
    var i = e.status;
    return 0 === i || 304 === i || i >= 200 && 300 > i ? d3.csv.parse(e.responseText) : null
}

function Datasubset(t) {
    return !t instanceof Dataset ? null : (Dataset.call(this, t.schema()), this.superset = t, this.filter = null, this.superset.addObserver(this), void 0)
}

function View(t, e, i) {
    this.controller = i, this.colourRange = d3.scale.category20(), this.sets = [t], this.colours = ["blue"], this.rlines = [
        []
    ], this.content = {
        x: {
            attr: "",
            attrs: t.schema().attributes()
        },
        y: {
            attr: "",
            attrs: t.schema().attributes()
        },
        a: {
            attr: "",
            attrs: t.schema().attributes().filter(function(e) {
                return ["interval", "ratio"].indexOf(t.schema().attribute(e).level()) > -1
            })
        }
    }, this.present = {
        duration: 1e3,
        colour: {
            axis: "black",
            label: "black",
            title: "black",
            header: "black"
        },
        size: {
            circle: 3,
            line: 2,
            axis: 1
        },
        font: {
            label: "10pt sans-serif",
            title: "12pt",
            set: "14pt bold",
            subset: "12pt"
        },
        attr: {},
        x: {
            ticks: 5,
            scale: null
        },
        y: {
            ticks: 5,
            scale: null
        }
    };
    var s, r, n, a, o = t.schema().attributes();
    for (s = 0; s < o.length; s++) r = o[s], n = t.schema().attribute(r), a = t.values(r), this.present.attr[r] = "string" == n.type() || "nominal" == n.level() ? {
        scale: "ord",
        domain: a.asSet()
    } : "date" == n.type() ? {
        scale: "utc",
        domain: [a[0], a[a.length - 1]]
    } : {
        scale: 1,
        domain: [a[0], a[a.length - 1]]
    }, this.present.attr[r].stats = t.statistics(r);
    t.addObserver(this), this.id = "#" + e, this.svg = d3.select(this.id);
    var l = +this.svg.attr("width"),
        h = +this.svg.attr("height");
    this.margin = {
        left: 60,
        right: 60,
        top: 30,
        bottom: 40
    };
    var c = l - this.margin.left - this.margin.right,
        u = h - this.margin.top - this.margin.bottom;
    return this.present.x.range = [0, c], this.present.y.range = [u, 0], this.plot = this.svg.append("svg:svg").attr("x", this.margin.left).attr("y", this.margin.top).attr("width", c).attr("height", u).attr("pointer-events", "all").datum(this).call(d3.behavior.zoom().on("zoom", i.zoom)), this.plot.append("svg:rect").attr("id", "background").attr("width", c).attr("height", u).attr("class", "plotArea").attr("opacity", "0").datum(this).on("dblclick", i.autoZoom).call(d3.behavior.drag().on("drag", i.drag)), this.plot.append("svg:g").attr("id", "lines"), this.plot.append("svg:g").attr("id", "circles"), this.svg.datum(this), this.svg.append("svg:image").classed("click help", !0).attr("x", l - 50).attr("y", 0).attr("width", 16).attr("height", 16).attr("xlink:href", "./icons/glyphicons_194_circle_question_mark.png").on("click", i.showHelp).append("title").text("guided tour"), this.svg.append("svg:image").classed("click settings", !0).attr("x", l - 25).attr("y", 0).attr("width", 16).attr("height", 16).attr("xlink:href", "./icons/glyphicons_136_cogwheel.png").datum(this).on("click", i.changeChart, !1).append("title").text("general settings"), this.svg.append("svg:text").attr("class", "set title").attr("y", this.margin.top - 10).attr("x", l / 2).attr("text-anchor", "middle").style("fill", this.present.colour.header).text(this.sets[0].name()).datum(this).on("click", i.changeSubsets).append("svg:title").text(this.sets[0].description()), this.svg.append("svg:text").attr("class", "x title").attr("y", h - 5).style("fill", this.present.colour.title).datum(this).on("click", i.changeX).attr("text-anchor", "middle"), this.svg.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + (h - this.margin.bottom) + ")"), this.svg.append("svg:text").attr("class", "y title").attr("x", 5).style("fill", this.present.colour.title).datum(this).on("click", i.changeY).attr("text-anchor", "middle"), this.svg.append("svg:g").attr("class", "y axis").attr("transform", "translate(" + this.margin.left + ",0)"), this
}

function Controller(t, e) {
    this._view = new View(t, e, this);
    var i = t.schema().attributes();
    this._view.attribute("x", i[0]), this._view.attribute("y", i[1]), this.refs = {};
    for (var s = 0; s < i.length; s++) {
        var r = t.schema().attribute(i[s]);
        "nominal" !== r.level() && (this.refs[i[s]] = ["Benchmark 1", "Benchmark 2"])
    }
    this.stats = {
        min: "minimum",
        max: "maximum",
        uq: "upper quartile",
        lq: "lower quartile",
        midrange: "mid-range"
    }, this.subsets = [], this.colours = function(t) {
        var e = ["#FF0000", "#FF9900", "#ACD1E9", "#00CC00", "#003399", "#660099", "#CC0000", "#FF6600", "#FFCC00", "#99FF00", "#009999", "#330099", "#CC0066"];
        return e[t % e.length]
    }, this._view.colour(t, this.colours(0)), this.chosen = new Datasubset(t).name("chosen").description("Selected data points"), this._view.subset(this.chosen, 1), this._view.colour(this.chosen, this.colours(1));
    var n = this;
    this.shown = new Datasubset(t).name("shown").description("Visible data points").intension(function(t) {
        var e = n.view(),
            i = e.attribute("x"),
            s = e.attribute("y"),
            r = e.present.attr[i].domain,
            a = e.present.attr[s].domain;
        return t[i] >= r[0] && t[i] <= r[r.length - 1] && t[s] >= a[0] && t[s] <= a[a.length - 1]
    }), this.all = new Datasubset(t).name("all").description("All data points").intension(function() {
        return !0
    }), this.subsets.push(this.shown), this.subsets.push(this.all), d3.select("body").datum(this._view).on("click", n.clearTooltip, !1).on("keypress", function(t) {
        switch (String.fromCharCode(d3.event.keyCode || d3.event.charCode)) {
            case "+":
            case "-":
                n.zoom(t);
                break;
            case "=":
                n.autoZoom(t);
                break;
            case "?":
                n.showHelp(t);
                break;
            case "l":
                t.pan(-2 * t.size("circle"), 0);
                break;
            case "u":
                t.pan(0, -2 * t.size("circle"));
                break;
            case "r":
                t.pan(2 * t.size("circle"), 0);
                break;
            case "d":
                t.pan(0, t.size("circle"))
        }
    })
}
Array.prototype.asSet || (Array.prototype.asSet = function() {
    for (var t = [], e = 0; e < this.length; e++) - 1 == t.indexOf(this[e]) && t.push(this[e]);
    return t
}), Array.prototype.difference || (Array.prototype.difference = function(t) {
    for (var e = [], i = 0; i < this.length; i++) - 1 == t.indexOf(this[i]) && e.push(this[i]);
    return e
}), Array.prototype.intersection || (Array.prototype.intersection = function(t) {
    for (var e = [], i = 0; i < this.length; i++) - 1 != t.indexOf(this[i]) && e.push(this[i]);
    return e
}), Attribute.prototype.name = function() {
    return this._name
}, Attribute.prototype.description = function() {
    return this._description
}, Attribute.prototype.type = function() {
    return this._type
}, Attribute.prototype.level = function() {
    return this._level
}, Attribute.prototype.unit = function() {
    return this._unit
}, Attribute.prototype.decimals = function(t) {
    return 0 == arguments.length ? this._decimals : ("number" === this.type() && (this._decimals = t), this)
}, Attribute.prototype.date = function(t) {
    return arguments.length ? (this._date = d3.time.format.utc(t), this) : "date" === this.type() ? this._date : void 0
}, Attribute.prototype.appropriate = function(t) {
    return "string" === this.type() || "nominal" === this.level() ? "ord" === t : "date" === this.type() ? "utc" === t : "log" === t || "number" == typeof t
}, Schema.prototype.attributes = function() {
    return Object.keys(this)
}, Schema.prototype.attribute = function(t) {
    return "string" !== typeOf(t) ? void 0 : this.hasOwnProperty(t) ? this[t] : null
}, Schema.prototype.accepts = function(t) {
    if ("object" !== typeOf(t)) return void 0;
    var e = this.attributes(),
        i = Object.keys(t);
    if (e.difference(i).length) return !1;
    if (i.difference(e).length) return !1;
    for (attribute in t) {
        var s = t[attribute],
            r = typeOf(s),
            n = this[attribute].type();
        if ("date" === n) {
            if ("string" === r) {
                if (s = this[attribute].date().parse(s), null === s) return !1;
                t[attribute] = s;
                continue
            }
            if ("number" === r) {
                t[attribute] = new Date(s);
                continue
            }
            if (!(s instanceof Date)) return !1
        }
        if ("number" !== n || "string" !== r) {
            if (r != n) return !1
        } else {
            if (isNaN(+s) || isNaN(parseFloat(s, 10))) return !1;
            t[attribute] = +s
        }
    }
    return !0
}, Schema.prototype.project = function(t, e) {
    for (a in e)
        if (t[a] !== e[a]) return !1;
    return !0
}, Dataset.prototype.schema = function() {
    return this._schema
}, Dataset.prototype.name = function(t) {
    switch (typeOf(t)) {
        case "string":
            return this._name = t, this;
        case "undefined":
            return this._name;
        default:
            return void 0
    }
}, Dataset.prototype.size = function() {
    return this.ids.length
}, Dataset.prototype.description = function(t) {
    switch (typeOf(t)) {
        case "string":
            return this._description = t, this;
        case "undefined":
            return this._description;
        default:
            return void 0
    }
}, Dataset.prototype.statistics = function(t) {
    var e = "ratio",
        i = [];
    if (arguments.length > 0) {
        var s = this.schema().attribute(t);
        if (!s) return void 0;
        e = s.level()
    }
    switch (e) {
        case "ratio":
        case "interval":
            i = i.concat(["mean", "range", "midrange", "stddev"]);
        case "ordinal":
            i = i.concat(["min", "lq", "median", "uq", "max"]);
        case "nominal":
            i = i.concat(["count", "mode"])
    }
    return i
}, Dataset.prototype.multiset = function(t) {
    switch (typeOf(t)) {
        case "undefined":
            return this.bag;
        default:
            return void 0
    }
}, Dataset.prototype.tuple = function(t) {
    if (this.ids.indexOf(t) < 0) return null;
    for (var e = this.tuples[t], i = {}, s = 0; s < e.length; s++) i[this.attributes[s]] = e[s];
    return i
}, Dataset.prototype.match = function(t) {
    for (var e = [], i = 0; i < this.ids.length; i++) {
        var s = this.ids[i];
        this.schema().project(this.tuple(s), t) && e.push(s)
    }
    return e
}, Dataset.prototype.extension = function() {
    for (var t = [], e = 0; e < this.ids.length; e++) t.push(this.tuple(this.ids[e]));
    return t
}, Dataset.prototype.addTuples = function(t) {
    var e, i = [],
        s = this.schema();
    switch (typeOf(t)) {
        case "string":
            e = loadTable(t);
            break;
        case "array":
            e = t;
            break;
        default:
            e = [t]
    }
    if (!e || !t) return null;
    for (var r = 0; r < e.length; r++) {
        var n = e[r];
        if (s.accepts(n) && (this.multiset() || 0 == this.match(n).length)) {
            var a = new Array(this.attributes.length);
            for (attribute in n) a[this.attributes.indexOf(attribute)] = n[attribute];
            i.push(this.tuples.length), this.ids.push(this.tuples.length), this.tuples.push(a)
        }
    }
    if (i.length)
        for (var r = 0; r < this.observers.length; r++) this.observers[r].update(this);
    return this
}, Dataset.prototype.removeTuples = function(t) {
    "array" !== typeOf(t) && (t = [t]);
    var e = this.ids.intersection(t);
    if (e.length) {
        this.ids = this.ids.difference(e);
        for (var i = 0; i < this.observers.length; i++) this.observers[i].update(this)
    }
    return this
}, Dataset.prototype.values = function(t) {
    var e = [];
    if (!this.schema().attribute(t)) return void 0;
    for (var i = 0; i < this.ids.length; i++) e.push(this.tuple(this.ids[i])[t]);
    var s = typeOf(e[0]);
    return "number" === s ? e.sort(function(t, e) {
        return t - e
    }) : "object" === s ? e.sort(function(t, e) {
        return e > t ? -1 : t > e ? 1 : 0
    }) : e.sort(), e
}, Dataset.prototype.calcPercentile = function(t, e) {
    var i = this.values(t),
        s = Math.round(e * i.length + .5) - 1;
    return s == i.length ? i[s - 1] : i[s]
}, Dataset.prototype.calcMode = function(t) {
    var e, i, s, r, n = this.values(t);
    "number" == typeOf(n[0]) ? n.push(n[n.length - 1] + 1) : n.push(n[n.length - 1] + "_"), s = n[0], r = 1, e = [], i = 0;
    for (var a = 1; a < n.length; a++) n[a] == s ? r++ : (r == i ? e.push(s) : r > i && (e = [s], i = r), s = n[a], r = 1);
    return e
}, Dataset.prototype.calcMean = function(t) {
    for (var e = this.values(t), i = 0, s = 0; s < e.length; s++) i += +e[s];
    var r = i / e.length;
    return "date" === this.schema().attribute(t).type() ? new Date(r) : r
}, Dataset.prototype.calcStdDev = function(t) {
    for (var e = +this.calcMean(t), i = this.values(t), s = 0, r = 0; r < i.length; r++) s += (+i[r] - e) * (+i[r] - e);
    return Math.sqrt(s / i.length)
}, Dataset.prototype.getStat = function(t, e) {
    if (!this.statistics(e) || -1 == this.statistics(e).indexOf(t)) return void 0;
    if ("count" != t && 0 == this.getStat("count", e)) return null;
    var i, s = this.schema().attribute(e).decimals();
    switch (t) {
        case "count":
            i = this.values(e).length;
            break;
        case "min":
            i = this.calcPercentile(e, 0);
            break;
        case "lq":
            i = this.calcPercentile(e, .25);
            break;
        case "median":
            i = this.calcPercentile(e, .5);
            break;
        case "uq":
            i = this.calcPercentile(e, .75);
            break;
        case "max":
            i = this.calcPercentile(e, 1);
            break;
        case "mode":
            i = this.calcMode(e);
            break;
        case "mean":
            i = this.calcMean(e);
            break;
        case "stddev":
            i = this.calcStdDev(e);
            break;
        case "range":
            i = +this.getStat("max", e) - +this.getStat("min", e);
            break;
        case "midrange":
            i = (+this.getStat("max", e) + +this.getStat("min", e)) / 2, "date" === this.schema().attribute(e).type() && (i = new Date(i));
            break;
        default:
            throw "Program Error: stat not caught"
    }
    return -1 == s || "array" === typeOf(i) ? i : +i.toFixed(s)
}, Dataset.prototype.partition = function(t, e) {
    var i = this.schema().attribute(t);
    if (!i) return null;
    if (i.type() !== typeOf(e) && !("date" === i.type() && e instanceof Date)) return null;
    var s, r = this.values(t),
        n = 0,
        a = 0;
    for (s = 0; s < r.length; s++) r[s] < e ? n++ : r[s] > e && a++;
    return [n, r.length - n - a, a]
}, Dataset.prototype.percentileRank = function(t, e) {
    var i = this.partition(t, e);
    return (i[0] + .5 * i[1]) / (i[0] + i[1] + i[2]) * 100
}, Dataset.prototype.addObserver = function(t) {
    return t && "function" === typeOf(t.update) ? (-1 == this.observers.indexOf(t) && this.observers.push(t), this) : null
}, Dataset.prototype.removeObserver = function(t) {
    var e = this.observers.indexOf(t);
    return e > -1 && this.observers.splice(e, 1), this
}, Datasubset.prototype = Object.create(Dataset.prototype), Datasubset.prototype.update = function() {
    var t, e, i = this.superset.match({});
    if (this.filter) {
        var s = i.filter(function(t) {
            return this.intension()(this.superset.tuple(t))
        }, this);
        t = this.ids.difference(s), e = s.difference(this.ids)
    } else t = this.ids.difference(i), e = []; if (e.length || t.length) {
        this.ids = this.ids.difference(t).concat(e);
        for (var r = 0; r < this.observers.length; r++) this.observers[r].update(this)
    }
    return this
}, Datasubset.prototype.intension = function(t) {
    switch (typeOf(t)) {
        case "undefined":
            return this.filter;
        case "function":
            return this.filter = t, this.update();
        case "null":
            return this.filter = null, this;
        default:
            return void 0
    }
}, Datasubset.prototype.addTuples = function(t) {
    if (this.filter) return this;
    "array" !== typeOf(t) && (t = [t]);
    var e = t.intersection(this.superset.match({})).difference(this.ids);
    if (e.length) {
        this.ids = this.ids.concat(e);
        for (var i = 0; i < this.observers.length; i++) this.observers[i].update(this)
    }
    return this
}, Datasubset.prototype.removeTuples = function(t) {
    if (this.filter) return this;
    "array" !== typeOf(t) && (t = [t]);
    var e = this.ids.intersection(t);
    if (e.length) {
        this.ids = this.ids.difference(e);
        for (var i = 0; i < this.observers.length; i++) this.observers[i].update(this)
    }
    return this
}, Datasubset.prototype.tuple = function(t) {
    return this.ids.indexOf(t) < 0 ? null : this.superset.tuple(t)
}, View.prototype.pan = function(t, e) {
    if (this.present.x.scale.invert) {
        var i = this.content.x.attr,
            s = this.present.attr[i].domain[0],
            r = this.present.attr[i].domain[1],
            n = this.present.x.scale(s) - t,
            a = this.present.x.scale(r) - t;
        s = this.present.x.scale.invert(n), r = this.present.x.scale.invert(a), this.present.attr[i].domain = [s, r]
    }
    if (this.present.y.scale.invert) {
        var o = this.content.y.attr,
            l = this.present.attr[o].domain[0],
            h = this.present.attr[o].domain[1],
            c = this.present.y.scale(l) - e,
            u = this.present.y.scale(h) - e;
        l = this.present.y.scale.invert(c), h = this.present.y.scale.invert(u), this.present.attr[o].domain = [l, h]
    }
    this.update()
}, View.prototype.zoom = function(t) {
    if (0 == arguments.length) {
        var e, i, s;
        if (e = this.attribute("x"), !e) return;
        if (i = this.sets[0].schema().attribute(e), s = this.sets[0].values(e), this.present.attr[e].domain = "string" == i.type() || "nominal" == i.level() ? s.asSet() : [s[0], s[s.length - 1]], e = this.attribute("y"), !e) return;
        return i = this.sets[0].schema().attribute(e), s = this.sets[0].values(e), this.present.attr[e].domain = "string" == i.type() || "nominal" == i.level() ? s.asSet() : [s[0], s[s.length - 1]], this.update()
    }
    var e, r, n, a, o, l, h, c = 1.1809926614295303,
        u = t ? 1 / c : c;
    this.present.x.scale.invert && (e = this.content.x.attr, r = this.present.attr[e].domain[0], n = this.present.attr[e].domain[1], a = this.present.x.scale(r), l = this.present.x.scale(n), h = (l - a) / 2, o = a + h, h *= u, a = o - h, l = o + h, r = this.present.x.scale.invert(a), n = this.present.x.scale.invert(l), this.present.attr[e].domain = [r, n]), this.present.y.scale.invert && (e = this.content.y.attr, r = this.present.attr[e].domain[0], n = this.present.attr[e].domain[1], l = this.present.y.scale(r), a = this.present.y.scale(n), h = (l - a) / 2, o = a + h, h *= u, a = o - h, l = o + h, r = this.present.y.scale.invert(l), n = this.present.y.scale.invert(a), this.present.attr[e].domain = [r, n]), this.update()
}, View.prototype.ticks = function(t, e) {
    if ("x" != t && "y" != t) return null;
    return void 0 == e ? this.svg.select(".axis." + t).selectAll(".tick")[0].length : "number" != typeOf(e) || 1 > e ? null : (this.present[t].ticks = e, this.updateAxis(t))
}, View.prototype.updateAxis = function(t) {
    var e = this.content[t].attr,
        i = this.sets[0].schema().attribute(e);
    if (null == i) return this;
    var s, r, n = this.sets[0].values(e),
        a = this.present[t].range,
        o = this.present.attr[e].scale,
        l = this.present.size.circle,
        h = "The axis scale is ";
    switch (o) {
        case "ord":
            s = d3.scale.ordinal(), h += "ordinal.";
            break;
        case "log":
            s = d3.scale.log(), h += "logarithmic with base 10.";
            break;
        case "utc":
            s = d3.time.scale.utc(), h += "UTC time.";
            break;
        case 1:
            s = d3.scale.linear(), h += "linear.";
            break;
        default:
            s = d3.scale.pow().exponent(o), h += "a power of " + o + "."
    }
    "ord" == o ? (s.domain(n.asSet()).rangePoints(a, 1), r = s.copy().rangePoints("x" == t ? [this.margin.left + l, this.svg.attr("width") - this.margin.right - l] : [this.svg.attr("height") - this.margin.bottom - l, this.margin.top + l], 1)) : (s.domain(this.present.attr[e].domain).range(a), r = s.copy().range("x" == t ? [this.margin.left + l, this.svg.attr("width") - this.margin.right - l] : [this.svg.attr("height") - this.margin.bottom - l, this.margin.top + l])), this.present[t].scale = s, this.svg.select(".title." + t).style("font", this.present.font.title).text(i.name() + (i.unit() ? " (" + i.unit() + ")" : "")).append("svg:title").text(i.description() + "\n" + h);
    var c = this.svg.select(".axis." + t).call(d3.svg.axis().orient("x" == t ? "bottom" : "left").ticks(this.present[t].ticks).scale(r)).datum(this).on("click", function(e) {
        e.controller.changeAxisScale(e, t)
    });
    return c.selectAll("line").style("stroke-width", this.present.size.axis).style("stroke", this.present.colour.axis), c.selectAll("path").style("stroke-width", this.present.size.axis).style("stroke", this.present.colour.axis), c.selectAll("text").style("font", this.present.font.label).style("fill", this.present.colour.label), this
}, View.prototype.updatePoints = function() {
    function t(t, e) {
        return t.name() + ": " + ("date" == t.type() ? t.date()(e) : e) + " " + t.unit()
    }
    var e, i, s, r, n = this.sets[0].match({}),
        a = [],
        o = this.sets[0].schema(),
        l = this.content.a.attr,
        h = this.content.x.attr,
        c = this.content.y.attr;
    l && (i = this.sets[0].values(l)[0], s = this.present.size.circle * this.present.size.circle);
    for (var u = 0; u < n.length; u++) {
        var p = this.sets[0].tuple(n[u]);
        if (void 0 != p[h] && void 0 != p[c]) {
            for (var d = [], f = 1; f < this.sets.length; f++) this.sets[f].tuple(n[u]) && d.push(f);
            d.push(0);
            var g = "";
            e = o.attribute(h), g += t(e, p[h]) + "\n", e = o.attribute(c), g += t(e, p[c]);
            var m = {};
            m[h] = p[h], m[c] = p[c];
            var v = this.sets[0].match(m).difference([n[u]]);
            v.unshift(n[u]);
            for (var y = this.sets[0].schema().attributes(), b = 0; b < v.length; b++) {
                g += "\n---";
                var x = this.sets[0].tuple(v[b]);
                e = o.attribute(l), e && (g += "\n" + t(e, x[l]));
                for (var f = 0; f < y.length; f++) y[f] !== h && y[f] !== c && y[f] !== l && (e = o.attribute(y[f]), g += "\n" + t(e, x[y[f]]))
            }
            r = l ? Math.sqrt(p[l] * s / i) : this.present.size.circle, a.push({
                id: n[u],
                tip: g,
                sets: d,
                x: this.present.x.scale(p[h]),
                y: this.present.y.scale(p[c]),
                r: r
            })
        }
    }
    var w = this.plot.select("#circles").selectAll("circle").data(a, function(t) {
            return t.id
        }),
        k = this.colours,
        C = this;
    return w.enter().append("circle").attr("r", 0).attr("cx", function(t) {
        return t.x
    }).attr("cy", function(t) {
        return t.y
    }).on("mouseover", function(t) {
        C.showSets(t.id)
    }).on("mouseout", function() {
        C.update()
    }).on("click", function(t) {
        C.controller.toggleCircle(t.id)
    }).append("svg:title"), w.style("fill", function(t) {
        return k[t.sets[0]]
    }).transition().duration(this.present.duration).attr("r", function(t) {
        return t.r
    }).attr("cx", function(t) {
        return t.x
    }).attr("cy", function(t) {
        return t.y
    }).select("title").text(function(t) {
        return t.tip
    }), w.exit().remove(), w.sort(function(t, e) {
        return e.r - t.r
    }), this
}, View.prototype.updateLegend = function() {
    function t(e, i) {
        var s = "array" === typeOf(i);
        if (!s) return i instanceof Date ? e.date()(i) : i;
        for (var r = "[", n = 0; n < i.length; n++) r += t(e, i[n]), i.length - 1 > n && (r += ", ");
        return r + "]"
    }
    for (var e = this.colours, i = this.margin.top, s = [], r = 1; r < this.sets.length; r++) {
        var n = this.sets[r],
            a = n.size(),
            o = n.description() + " (" + a + " point" + (1 != a ? "s)" : ")");
        if (this.content.x.attr) {
            var l = this.present.attr[this.content.x.attr].stats,
                h = n.schema().attribute(this.content.x.attr);
            o += "\n" + h.name() + ":";
            for (var c = 0; c < l.length; c++) {
                var u = n.getStat(l[c], this.content.x.attr);
                null != u && (o += "\n	" + l[c] + " = " + t(h, u))
            }
        }
        if (this.content.y.attr) {
            var l = this.present.attr[this.content.y.attr].stats,
                h = n.schema().attribute(this.content.y.attr);
            o += "\n" + h.name() + ":";
            for (var c = 0; c < l.length; c++) {
                var u = n.getStat(l[c], this.content.y.attr);
                null != u && (o += "\n	" + l[c] + " = " + t(h, u))
            }
        }
        if (this.content.a.attr) {
            var l = this.present.attr[this.content.a.attr].stats,
                h = n.schema().attribute(this.content.a.attr);
            o += "\n" + h.name() + ":";
            for (var c = 0; c < l.length; c++) {
                var u = n.getStat(l[c], this.content.a.attr);
                null != u && (o += "\n	" + l[c] + " = " + t(h, u))
            }
        }
        s.push({
            name: n.name(),
            tip: o,
            index: r
        })
    }
    var p = this.svg.selectAll(".subset.title").data(s, function(t) {
            return t.name
        }),
        d = this,
        f = p.enter().append("svg:g").attr("class", "subset title click").attr("transform", function(t) {
            return "translate(" + (d.svg.attr("width") - d.margin.right) + "," + (i + 20 * t.index) + ")"
        }).on("mouseover", function(t) {
            d.showPoints(d.sets[t.index])
        }).on("mouseout", function() {
            d.update()
        }).on("click", function(t) {
            d.controller.changeRefLines(t.index)
        }).style("opacity", "0");
    return f.append("circle").attr("cx", 10).attr("cy", 5).attr("r", 5), f.append("svg:text").text(function(t) {
        return t.name
    }).attr("x", 20).attr("y", 10).append("svg:title"), p.select("title").text(function(t) {
        return t.tip
    }), p.select("circle").transition().duration(this.present.duration).style("fill", function(t) {
        return e[t.index]
    }).style("stroke", function(t) {
        return e[t.index]
    }), p.transition().duration(this.present.duration).style("opacity", 1).attr("transform", function(t) {
        return "translate(" + (d.svg.attr("width") - d.margin.right) + "," + (i + 20 * t.index) + ")"
    }), p.exit().transition().duration(this.present.duration).style("opacity", 0).remove(), this
}, View.prototype.updateRefLines = function() {
    var t, e, i, s, r, n, a, o, l, h = this.colours,
        c = (this.sets, this.present.x.range[0]),
        u = this.present.x.range[1],
        p = this.present.y.range[1],
        d = this.present.y.range[0],
        f = [];
    for (e = 0; e < this.rlines.length; e++)
        for (t = 0; t < this.rlines[e].length; t++)
            if (i = this.rlines[e][t], null !== i.val && (i.attr === this.content.x.attr || i.attr === this.content.y.attr) && (s = i.val || this.sets[e].getStat(i.ref, i.attr), null !== s)) {
                "array" === typeOf(s) && (s = s[0]), i.attr === this.content.y.attr ? (a = o = this.present.y.scale(s), r = c, n = u) : (r = n = this.present.x.scale(s), a = d, o = p);
                var g = this.sets[e].partition(i.attr, s),
                    m = this.sets[0].schema().attribute(i.attr);
                l = i.ref + " = " + ("date" == m.type() ? m.date()(s) : s) + " " + m.unit() + "\n\nPoints " + (i.attr == this.content.x.attr ? "left: " + g[0] : "above: " + g[2]) + "\nPoints on: " + g[1] + "\nPoints " + (i.attr == this.content.x.attr ? "right: " + g[2] : "below: " + g[0]), f.push({
                    set: e,
                    id: this.sets[e].name() + i.attr + i.ref,
                    tip: l,
                    x1: r,
                    x2: n,
                    y1: a,
                    y2: o
                })
            }
    var v = this.plot.select("#lines").selectAll("line").data(f, function(t) {
        return t.id
    });
    return v.enter().append("svg:line").attr("x1", function(t) {
        return t.x1
    }).attr("x2", function(t) {
        return t.x2
    }).attr("y1", function(t) {
        return t.y1
    }).attr("y2", function(t) {
        return t.y2
    }).style("opacity", 0).append("svg:title"), v.select("title").text(function(t) {
        return t.tip
    }), v.style("stroke", function(t) {
        return h[t.set]
    }).style("stroke-width", this.present.size.line).transition().duration(this.present.duration).attr("x1", function(t) {
        return t.x1
    }).attr("x2", function(t) {
        return t.x2
    }).attr("y1", function(t) {
        return t.y1
    }).attr("y2", function(t) {
        return t.y2
    }).style("opacity", 1), v.exit().transition().duration(this.present.duration).style("opacity", 0).remove(), v.sort(function(t, e) {
        return e.set - t.set
    }), this
}, View.prototype.attribute = function(t, e) {
    return "x" != t && "y" != t && "a" != t ? null : void 0 == e ? this.content[t].attr : this.content[t].attrs.indexOf(e) < 0 && ("a" != t || "" != e) ? null : (this.content[t].attr = e, this.update())
}, View.prototype.attributes = function(t, e) {
    if ("x" != t && "y" != t && "a" != t) return null;
    if (void 0 == e) return this.content[t].attrs;
    if ("string" === typeOf(e) && (e = [e]), "array" !== typeOf(e)) return null;
    for (var i = [], s = 0; s < e.length; s++) {
        var r = e[s];
        this.present.attr[r] && ("a" == t && ["interval", "ratio"].indexOf(this.sets[0].schema().attribute(r).level()) < 0 || i.push(r))
    }
    return i.length ? (this.content[t].attrs = i, "" !== this.content[t].attr && i.indexOf(this.content[t].attr) < 0 ? (this.content[t].attr = i[0], this.update()) : this) : this
}, View.prototype.subset = function(t, e) {
    if ("number" == typeof t) return this.sets[t];
    var i = this.sets.indexOf(t);
    if (arguments.length < 2) return i;
    if (!(t instanceof Dataset) || "number" != typeof e) return null;
    if (1 > i) {
        if (1 > e) return null;
        t.addObserver(this), this.sets.splice(e, 0, t), this.colours.splice(e, 0, this.colourRange(this.sets.length)), this.rlines.splice(e, 0, [])
    } else {
        t.removeObserver(this), this.sets.splice(i, 1);
        var s = this.colours.splice(i, 1)[0],
            r = this.rlines.splice(i, 1)[0];
        e > 0 && (t.addObserver(this), this.sets.splice(e, 0, t), this.colours.splice(e, 0, s), this.rlines.splice(e, 0, r))
    }
    return this.update(), this
}, View.prototype.statistics = function(t, e) {
    return this.present.attr[t] ? void 0 === e ? this.present.attr[t].stats : "array" !== typeOf(e) ? null : (this.present.attr[t].stats = e.intersection(this.sets[0].statistics(t)), this.updateLegend()) : null
}, View.prototype.reference = function(t, e, i, s) {
    var r, n, a, o = this.sets.indexOf(t);
    if (0 > o) return null;
    var l = t.schema().attribute(e);
    if (!l) return null;
    if ("string" != typeof i) return null;
    var h = t.statistics(e).indexOf(i) > -1;
    if (null !== s)
        if (void 0 === s) {
            if (!h) return null
        } else if (h || typeof s != l.type()) return null;
    for (a = -1, r = 0; r < this.rlines[o].length; r++) n = this.rlines[o][r], n.attr == e && n.ref == i && (a = r);
    return 0 > a ? this.rlines[o].push({
        attr: e,
        ref: i,
        val: s
    }) : this.rlines[o][a].val = s, this.updateRefLines()
}, View.prototype.references = function(t, e) {
    var i, s, r = {},
        n = this.sets.indexOf(t);
    if (0 > n) return null;
    if (!t.schema().attribute(e)) return null;
    for (i = 0; i < this.rlines[n].length; i++) s = this.rlines[n][i], s.attr == e && null !== s.val && (r[s.ref] = t.statistics(s.attr).indexOf(s.ref) > -1 ? t.getStat(s.ref, s.attr) : s.val);
    return r
}, View.prototype.update = function() {
    var t = this.svg.attr("width"),
        e = this.svg.attr("height"),
        i = t - this.margin.left - this.margin.right,
        s = e - this.margin.top - this.margin.bottom,
        r = this.present.size.circle;
    return this.present.x.range = [r, i - r], this.present.y.range = [s - r, r], this.plot.attr("x", this.margin.left).attr("y", this.margin.top).attr("width", i).attr("height", s), this.plot.select("rect").attr("width", i).attr("height", s), this.svg.select(".set.title").attr("y", this.margin.top - 10), this.svg.select(".x.title").attr("x", this.margin.left + i / 2), this.svg.select(".x.axis").attr("transform", "translate(0," + (e - this.margin.bottom) + ")"), this.svg.select(".y.title").attr("y", e - this.margin.bottom - s / 2).attr("dominant-baseline", "text-before-edge").attr("transform", "rotate(-90,5," + (e - this.margin.bottom - s / 2) + ")"), this.svg.select(".y.axis").attr("transform", "translate(" + this.margin.left + ",0)"), this.updateLegend() && this.updateAxis("x") && this.updateAxis("y") && this.updatePoints() && this.updateRefLines() ? this : null
}, View.prototype.scale = function(t, e) {
    if (!this.present.attr[t]) return null;
    if (void 0 == e) return this.present.attr[t].scale;
    var i = this.sets[0].schema().attribute(t);
    return i.appropriate(e) ? (this.present.attr[t].scale = e, this.update()) : null
}, View.prototype.domain = function(t, e) {
    if (!this.present.attr[t]) return null;
    if (void 0 == e) return this.present.attr[t].domain;
    this.present.attr[t].domain = e
    return this.update()
}, View.prototype.colour = function(t, e) {
    var i = this.sets.indexOf(t),
        s = arguments.length < 2;
    if (0 > i) switch (t) {
        case "axis":
            return s ? this.present.colour.axis : (this.present.colour.axis = e, this.updateAxis("x") && this.updateAxis("y") ? this : null);
        case "label":
            return s ? this.present.colour.label : (this.present.colour.label = e, this.updateAxis("x") && this.updateAxis("y") ? this : null);
        case "title":
            return s ? this.present.colour.title : (this.present.colour.title = e, this.svg.select(".x.title").style("fill", e), this.svg.select(".y.title").style("fill", e), this);
        case "header":
            return s ? this.present.colour.header : (this.present.colour.header = e, this.svg.select(".set.title").style("fill", e), this);
        default:
            return null
    }
    return 1 == arguments.length ? this.colours[i] : (this.colours[i] = e, this.update())
}, View.prototype.size = function(t, e) {
    var i = arguments.length < 2;
    if (!i && 0 >= e) return null;
    switch (t) {
        case "axis":
            return i ? this.present.size.axis : (this.present.size.axis = e, this.updateAxis("x") && this.updateAxis("y") ? this : null);
        case "line":
            return i ? this.present.size.line : (this.present.size.line = e, this.updateRefLines());
        case "circle":
            return i ? this.present.size.circle : (this.present.size.circle = e, this.updatePoints());
        case "left":
        case "right":
        case "top":
        case "bottom":
            return i ? this.margin[t] : (this.margin[t] = e, this.update());
        default:
            return null
    }
}, View.prototype.font = function(t, e) {
    if (["set", "subset", "title", "label"].indexOf(t) < 0) return null;
    if (arguments.length < 2) return this.present.font[t];
    if ("string" != typeof e) return null;
    switch (this.present.font[t] = e, t) {
        case "label":
        case "title":
            return this.updateAxis("x") && this.updateAxis("y") ? this : null;
        case "set":
            return this.svg.select(".set.title").style("font", e), this;
        case "subset":
            return this.updateLegend()
    }
}, View.prototype.duration = function(t) {
    return arguments.length ? "number" != typeof t || 0 > t ? null : (this.present.duration = t, this) : this.present.duration
}, View.prototype.showPoints = function(t) {
    var e = this.sets.indexOf(t);
    if (0 > e) return null;
    var i = this.svg.selectAll("g#circles circle");
    return i.filter(function(t) {
        return -1 != t.sets.indexOf(e)
    }).style("fill", this.colours[e]), i.filter(function(t) {
        return -1 == t.sets.indexOf(e)
    }).transition().duration(this.present.duration).attr("r", 0), this
}, View.prototype.showSets = function(t) {
    if (!this.sets[0].tuple(t)) return null;
    var e = this.svg.selectAll("g#circles circle").filter(function(e) {
        return e.id == t
    }).datum().sets;
    return this.svg.selectAll(".subset.title").filter(function(t) {
        return -1 == e.indexOf(t.index)
    }).transition().duration(this.present.duration).style("opacity", 0), this
}, Controller.prototype.createTooltip = function(t, e) {
    var i = d3.select("body").append("div").attr("id", t).attr("class", "tooltip").style("left", d3.event.pageX + "px").style("top", d3.event.pageY + "px").on("click", function() {
        event.stopPropagation()
    });
    return e && i.append("img").attr("src", "./icons/glyphicons_197_remove.png").attr("width", 16).attr("height", 16).classed("click", !0).on("click", this.clearTooltip), i
}, Controller.prototype.view = function() {
    return this._view
}, Controller.prototype.addSubsets = function(t) {
    var e = this.view().sets[0],
        i = e.schema().attribute(t);
    if (!i) return null;
    for (var s = e.values(t).asSet(), r = 0; r < s.length; r++) this.subsets.splice(-2, 0, new Datasubset(e).name(s[r] + "").description(i.name() + " = " + s[r]).intension(function(e) {
        return e[t] == s[r]
    }))
}, Controller.prototype.references = function(t, e) {
    return void 0 === e ? this.refs[t] : (this.refs[t] = e, this)
}, Controller.prototype.zoom = function(t) {
    var e, i = t.duration(),
        s = String.fromCharCode(d3.event.keyCode || d3.event.charCode);
    if ("+" === s) e = !0;
    else if ("-" === s) e = !1;
    else {
        if ("mousewheel" !== d3.event.sourceEvent.type && "DOMMouseScroll" !== d3.event.sourceEvent.type) return;
        e = d3.event.sourceEvent.wheelDelta ? d3.event.sourceEvent.wheelDelta > 1 : d3.event.sourceEvent.detail < 1
    }
    t.duration(0), t.zoom(e), t.controller.shown.update(), t.duration(i)
}, Controller.prototype.autoZoom = function(t) {
    t.zoom(), t.controller.shown.update()
}, Controller.prototype.drag = function(t) {
    var e = t.duration();
    switch (this.getAttribute("class")) {
        case "plotArea":
            t.duration(0), t.pan(d3.event.dx, d3.event.dy), t.controller.shown.update(), t.duration(e)
    }
}, Controller.prototype.showHelp = function(t) {
    function e(e) {
        var s = e == i.length - 1,
            r = i[e].element,
            n = e > 0 ? [{
                name: "Back"
            }] : [];
        return n.push(s ? {
            name: "Close"
        } : {
            name: "Next"
        }), guiders.createGuider(jQuery.extend({
            description: Controller.helpString[i[e].id],
            next: s ? void 0 : i[e + 1].id,
            buttons: n,
            attachTo: r ? t.id + " " + r : void 0,
            autoFocus: !0,
            closeOnEscape: !0,
            position: 3,
            xButton: !0
        }, i[e]))
    }
    var i = [{
        id: "ghwelcome",
        title: "Welcome to the iScatter tour",
        overlay: !0
    }, {
        id: "ghconcepts",
        title: "Main Concepts",
        overlay: !0,
        onShow: function() {
            t.zoom().size("circle", 2), t.subset(t.controller.shown, -1), t.subset(t.controller.all, -1), t.controller.chosen.removeTuples(t.controller.chosen.match({}))
        }
    }, {
        id: "ghsettings",
        title: "Bubble chart / Settings",
        position: 9,
        element: ".settings",
        highlight: t.id + " .settings"
    }, {
        id: "ghcharttitle",
        title: "Data set / Chart title",
        position: 12,
        element: ".set.title"
    }, {
        id: "ghlegend",
        title: "Subsets / Legend",
        position: 3,
        element: ".subset.title text"
    }, {
        id: "ghcircles",
        title: "Data Points / Circles",
        position: 3,
        element: " "
    }, {
        id: "ghlines",
        title: "Statistics / Reference lines",
        position: 12,
        element: ".subset.title text"
    }, {
        id: "ghplot",
        title: "Pan & zoom / Plot area",
        position: 3,
        element: " "
    }, {
        id: "ghaxistitle",
        title: "Attribute / Axis title",
        position: 6,
        element: ".x.title"
    }, {
        id: "ghaxisvalue",
        title: "Scale / Axis value",
        position: 7,
        element: "g.x.axis text"
    }, {
        id: "ghsummary",
        title: "Summary",
        overlay: !0
    }];
    e(0).show();
    for (var s = 1; s < i.length; s++) e(s)
}, Controller.prototype.clearTooltip = function() {
    d3.selectAll(".tooltip").transition().duration(200).style("transition-delay", "0 !important").style("-moz-transition-delay", "0 !important").style("-webkit-transition-delay", "0 !important").style("opacity", 0).remove()
}, Controller.prototype.changeChart = function(t) {
    d3.event.target.getBoundingClientRect();
    event.stopPropagation();
    var e = t.controller.createTooltip("chart-options");
    e.append("h3").text("Animation Options");
    var i = e.append("div").attr("id", "animation-options");
    i.append("label").text("Transition duration (ms):").append("input").attr("type", "text").attr("size", 3).attr("value", t.duration()).on("change", function() {
        isNaN(parseInt(this.value)) || t.duration(parseInt(this.value))
    }), e.append("h3").text("Tick Options");
    var i = e.append("div").attr("id", "tick-options");
    i.append("label").text("X axis ticks (approximate):").append("input").attr("type", "text").attr("size", 3).attr("value", t.ticks("x")).on("change", function() {
        isNaN(parseInt(this.value)) || t.ticks("x", parseInt(this.value))
    }), i.append("label").text("Y axis ticks (approximate):").append("input").attr("type", "text").attr("size", 3).attr("value", t.ticks("y")).on("change", function() {
        isNaN(parseInt(this.value)) || t.ticks("y", parseInt(this.value))
    }), e.append("h3").text("Circle Options");
    var s = e.append("div").attr("id", "circle-options"),
        r = t.sets[0].schema(),
        n = t.attribute("a"),
        a = t.attributes("a").map(function(t) {
            return {
                id: t,
                name: r.attribute(t).name()
            }
        }).sort(function(t, e) {
            return t.name < e.name ? -1 : 1
        });
    a.push({
        id: "",
        name: "undefined"
    }), circleAttrEnter = s.append("label").text("Circle area attribute:").append("select").on("change", function() {
        t.attribute("a", this.value)
    }).selectAll("option").data(a), circleAttrEnter.enter().append("option").attr("value", function(t) {
        return t.id
    }).attr("selected", function(t) {
        return t.id === n ? "selected" : null
    }).text(function(t) {
        return t.name
    }), s.append("label").text("Circle minimum radius:").append("input").attr("type", "text").attr("size", 3).attr("value", t.size("circle")).on("change", function() {
        isNaN(parseInt(this.value)) || t.size("circle", parseInt(this.value))
    })
}, Controller.prototype.showSubsets = function(t, e) {
    for (var i, s = this._view, r = this.subsets, n = r[0], a = n.schema().attribute(t), o = a ? a.name() : "", l = 0; l < r.length; l++) n = r[l], i = -1 != s.subset(n), -1 != n.description().indexOf(o) && (e && !i ? (s.subset(n, 999), s.colour(n, this.colours(n == this.shown ? 0 : l + 2))) : !e && i && s.subset(n, -1));
    return this
}, Controller.prototype.changeSubsets = function(t) {
    var e = (d3.event.target.getBoundingClientRect(), t.controller.subsets);
    event.stopPropagation();
    var i = t.controller.createTooltip("select-subsets").selectAll("p").data(e).text(function(t) {
            return t.name()
        }),
        s = i.enter().append("p").attr("class", "selection");
    s.insert("input").attr("type", "checkbox").attr("id", function(t) {
        return t.name()
    }).attr("name", function(t, e) {
        return e
    }).attr("checked", function(e) {
        return t.subset(e) > 1 ? "checked" : void 0
    }).on("change", function(e, i) {
        t.subset(e, this.checked ? 999 : -1), e == t.controller.shown ? t.colour(e, t.controller.colours(0)) : t.colour(e, t.controller.colours(i + 2))
    }).on("click", function() {
        d3.event.stopPropagation()
    }), s.append("label").attr("for", function(t) {
        return t.name()
    }).text(function(t) {
        return t.description()
    }), i.exit().remove()
}, Controller.displayAxisConfig = function(t, e) {
    var i = (d3.event.target.getBoundingClientRect(), t.attributes(e)),
        s = t.sets[0].schema(),
        r = i.map(function(t) {
            return {
                id: t,
                name: s.attribute(t).name()
            }
        }).sort(function(t, e) {
            return t.name < e.name ? -1 : 1
        }),
        n = t.attribute(e);
    event.stopPropagation();
    var a = t.controller.createTooltip(e + "-axis-config").selectAll("p").data(r).text(function(t) {
        return t.name
    });
    a.enter().append("p").attr("class", function(t) {
        return "selection" + (t.id === n ? " selected" : "")
    }).text(function(t) {
        return t.name
    }).on("click", function(i) {
        t.attribute(e, i.id), t.controller.clearTooltip()
    }), a.exit().remove()
}, Controller.prototype.changeX = function(t) {
    Controller.displayAxisConfig(t, "x")
}, Controller.prototype.changeY = function(t) {
    Controller.displayAxisConfig(t, "y")
}, Controller.prototype.changeAxisScale = function(t, e) {
    for (var i = (d3.event.target.getBoundingClientRect(), [{
        id: "ord",
        name: "Ordinal"
    }, {
        id: "log",
        name: "Logarithmic"
    }, {
        id: 1,
        name: "Linear"
    }, {
        id: 2,
        name: "Quadratic"
    }, {
        id: 5,
        name: "Cubic"
    }, {
        id: 10,
        name: "Power of 10"
    }, {
        id: "utc",
        name: "Time"
    }]), s = [], r = t.sets[0].schema(), n = t.attribute(e), a = r.attribute(n), o = t.scale(n), l = 0; l < i.length; l++) a.appropriate(i[l].id) && s.push(i[l]);
    event.stopPropagation();
    var h = t.controller.createTooltip(e + "-axis-scale").selectAll("p").data(s).text(function(t) {
        return t.name
    });
    h.enter().append("p").attr("class", function(t) {
        return "selection" + (t.id === o ? " selected" : "")
    }).text(function(t) {
        return t.name
    }).on("click", function(e) {
        t.scale(n, e.id), t.controller.clearTooltip()
    }), h.exit().remove()
}, Controller.prototype.toggleCircle = function(t) {
    this.chosen.tuple(t) ? this.chosen.removeTuples(t) : this.chosen.addTuples(t)
}, Controller.prototype.changeRefLines = function(t) {
    var e = this,
        i = (d3.event.target.getBoundingClientRect(), this.view()),
        s = i.sets[t],
        r = s.schema(),
        n = [i.attribute("x"), i.attribute("y")],
        a = [];
    event.stopPropagation();
    var o, l;
    for (o = 0; o < (n[0] === n[1] ? 1 : 2); o++) {
        a[o] = [], a[o].name = r.attribute(n[o]).name();
        var h = i.references(s, n[o]),
            c = i.statistics(n[o]).difference(["range", "count", "stddev"]);
        c = ["min", "lq", "mean", "median", "midrange", "uq", "max", "mode"].intersection(c);
        var u = this.refs[n[o]];
        if (u)
            for (l = 0; l < u.length; l++) a[o].push({
                attribute: n[o],
                name: u[l],
                value: void 0 === h[u[l]] ? "" : h[u[l]] + "",
                isStat: !1
            });
        for (l = 0; l < c.length; l++) a[o].push({
            attribute: n[o],
            name: c[l],
            value: void 0 != h[c[l]],
            isStat: !0
        })
    }
    var p = i.controller.createTooltip("set-options");
    p.append("h3").text("Reference Lines");
    var d = p.selectAll(".axis").data(a);
    d.enter().append("div").attr("class", "axis").append("h4").text(function(t) {
        return t.name
    });
    var f = d.selectAll(".axis").data(function(t) {
        return t
    });
    f.enter().append("label").text(function(t) {
        return e.stats[t.name] || t.name
    }).insert("input").attr("name", function(t) {
        return t.attribute + "[" + t.name.toLowerCase().replace(" ", "-") + "]"
    }).attr("type", function(t) {
        return t.isStat ? "checkbox" : "numeric"
    }).attr("value", function(t) {
        return t.value
    }).property("checked", function(t) {
        return t.value
    }).on("change", function(t) {
        t.isStat && this.checked ? i.reference(s, t.attribute, t.name) : t.isStat || isNaN(parseFloat(this.value, 10)) ? i.reference(s, t.attribute, t.name, null) : i.reference(s, t.attribute, t.name, parseFloat(this.value, 10))
    })
}, Controller.helpString = {}, Controller.helpString.ghwelcome = '<p>iScatter displays interactive scatterplots for data exploration.</p><p>This guided tour shows how to explore a given data set. Just follow the step by step instructions on the screen, <em>without</em> quitting the tour.<p/><p>To learn how to create data sets and display them on your own web pages, see the <a href="http://michel.wermelinger.ws/chezmichel/software/iScatter/">iScatter site</a>.<p><p>Clicking the "Next" button will change the chart to a "ready" state for the tour. If you don\'t wish that to happen yet, press ESC to quit now, and click the "?" icon when you\'re ready to resume the tour.</p>', Controller.helpString.ghconcepts = '<p>iScatter displays multi-variate data, i.e. each data point has two or more <strong>attributes</strong>. For example, a survey dataset may have one data point per person, with three attributes: gender, age and opinion (coded as 1=dislike, 2=indifferent, 3=like).</p><p>A <strong>scatter plot</strong> shows one attribute in the x axis, another in the y axis, and one circle for each data point. A <strong>bubble chart</strong> shows a third attribute as the area of circles: bigger circles for larger values.</p><p>Each attribute has a <a href="http://en.wikipedia.org/wiki/Level_of_measurement"><strong>level of measurement</strong></a>: nominal, ordinal, interval or ratio. In the example, gender is nominal (non-comparable), opinion is ordinal (comparable but not by how much) and age is a ratio attribute. The measurement level restricts the available <strong>statistics</strong>. For example, the mode (most frequent value) can be computed for any attribute, the maximum for non-nominal attributes, and the mean (average) for interval and ratio attributes.</p><p>A data set can have multiple <strong>subsets</strong>, e.g. all female responders or those that responded "dislike". iScatter computes statistics per attribute and per subset (e.g. the mean male age).</p>', Controller.helpString.ghsettings = "<ol><li>Click on the icon: a dialog of general options appears.</li><li>Click on the circle radius box and change the value to 5. Press ENTER to see the effect.</li><li>Select an attribute for the circle area to create a bubble chart. Only interval and ratio attributes are listed, if there are any.</li><li>Click anywhere outside the dialog window to close it.</li></ol>", Controller.helpString.ghcharttitle = 'The chart title is the name of the data set. Every data set has 3 special subsets:  <strong>"chosen"</strong> (all user-selected data points), <strong>"shown"</strong> (all visible data points) and <strong>"all"</strong> (the whole dataset).<ol><li>Hover the mouse on the chart title to see a description of the data set (if the data creator supplied one).</li><li>Click on the chart title to get a menu of available subsets.</li><li>Select the "visible" and "all" subsets.</li><li>Click anywhere else on the screen to close the menu.</li></ol>', Controller.helpString.ghlegend = 'The legend lists the currently displayed subsets. The "chosen" subset is always listed. A data point belonging to multiple subsets is coloured according to the first matching subset in the legend. <ol><li>Hover the mouse on "all" to see the points and the statistics (of the current x, y and area attributes) for the whole data set.</li><li>Hover the mouse on "chosen". No points can be seen because none were selected yet.</li></ol>', Controller.helpString.ghcircles = 'If multiple data points have the same x, y and area values, only the front circle can be seen and selected – others hide behind it, but info about them is available.<ol><li>Hover on a circle to see <em>all</em> attribute values of <em>all</em> data points with the same x/y/area values. The legend hides the subsets the front circle does not belong to.</li><li>Click on a circle to select it, i.e. to add it to the "chosen" subset. A second click deselects the point, but leave it selected for this tour.</li><li>Hover on "chosen" to see the updated statistics and the just selected point.</li></ol>', Controller.helpString.ghlines = 'A <strong>reference</strong> line shows a statistical value – or a fixed value you choose – for an attribute of a subset. The line, in the subset\'s colour, is horizontal for the y attribute, otherwise vertical.<ol><li>Click on "chosen" to open a dialog of possible reference lines.</li><li>Select the mean value, if available, or another statistics. A line appears. Click outside to dialog to close it.</li><li>Hover the mouse on the line to see the exact statistical value.</li><li>Select a few more points. The line moves if the value changes.</li><li>Repeat steps 1 to 3 for "all" and "visible", choosing the same statistics for the same attribute. The reference lines will overlap, as the subsets are currently equal.</li></ol>', Controller.helpString.ghplot = 'The plot area is where the data points are shown as circles.<ol><li>Hover the mouse on "shown". Note the number of points.</li><li>Hover on the reference line for "shown". Note the value.</li><li>Press the mouse button in an empty spot of the plot area, i.e. not on a circle, and drag it in any direction to <strong>pan</strong> the display. Make sure some points disappear. Release the mouse button.</li><li>Repeat steps 1 and 2. Note any updates. The reference lines for "shown" and "all" should now be be apart.</li><li>Put the mouse cursor on an empty spot of the plot area. Move the mouse wheel up and down to <strong>zoom</strong> in and out.</li><li>Repeat step 4.</li><li>Double-click an empty spot of the plot area. This <strong>auto-zooms</strong> the display to fit all data points.</li><li>Hover the mouse on "shown" and "all": they are now the same.</li></ol>', Controller.helpString.ghaxistitle = "The axes titles are the names of the currently displayed attributes, with units (if given by the data creator) in parentheses.<ol><li>Hover the mouse on the y axis title to see a description of that attribute (if the data creator provided one).</li><li>Click on the y axis title to get a menu of available attributes for that axis. The current attribute is highlighted.</li><li>Select another attribute. You can display the same attribute in both axes.</li><li>Click anywhere else to close the menu.</li></ol>", Controller.helpString.ghaxisvalue = "Nominal and ordinal attributes are displayed on a ordinal <strong>scale</strong>, but interval and ratio attributes can use a linear, power (e.g. quadratic) or logarithmic (base 10) scale.<ol><li>Click on any x or y axis value to get a menu of the available scales for that axis. The current scale is highlighted.</li><li>Select a different scale, if available. If both x and y attributes are ordinal, you should click the axes titles to change the attributes.</li></ol>", Controller.helpString.ghsummary = 'iScatter computes common statistics for each attribute of:<ul><li>the whole dataset ("all" subset);</li><li>each subset defined by the data set provider;</li><li>two subsets defined by you ("chosen" and "visible").</ul><p>Statistics are automatically updated for your subsets as you select and deselect points, or pan and zoom the display. Due to the use of measurement levels, meaningless statistics are not computed.</p><p>You can change anytime which attributes, which subsets and which reference lines (statistics) are displayed. This makes it easy to visually compare statistics for any pair of subsets or attributes.</p><p><em>All</em> elements of the chart are interactive: they can be hovered on to get more information on demand, without cluttering the display, and they can be clicked to change the display.</p><p>Queries, comments and suggestions are welcome and can be made on the <a href="http://michel.wermelinger.ws/chezmichel/software/iScatter/">iScatter site</a>.';