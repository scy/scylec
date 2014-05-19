(function ($) {
"use strict";

var $doc  = $(document);
var $html = $("html:first");
var $body = $("body:first");
var $view = $body.find(".viewport:first");

var err = function(msg) {
	return new Error(msg);
};

// Google Analytics no-op fallback.
var gaev = function (act, lbl, val) {
	if (ga) {
		ga("send", "event", "scylec", act, lbl, val);
	}
};

// Track print requests.
var trackPrint = function () {
	gaev("print", "prepare");
};
if (window.matchMedia) {
	window.matchMedia("print").addListener(function (mql) {
		if (mql.matches) {
			trackPrint();
		}
	});
} else {
	window.onbeforeprint = trackPrint;
}

var enablePresKeys = function () {
	$doc.on("keydown.scylec_preskeys", function (ev) {
		switch (ev.which) {
			case 33:
			case 37:
			case 38:
				scylec.prev();
				return false;
				break;
			case 34:
			case 39:
			case 40:
				scylec.next();
				return false;
				break;
			case 116: // "play" on a Logitech presenter
			case 27: // second press on "play" on a Logitech presenter
				break;
			case 190: // "blank" on a Logitech presenter
				// scylec.toggleBlank();
				return false;
		}
	});
};

var disablePresKeys = function () {
	$doc.off(".scylec_preskeys");
};

var scylec = window.scylec = {

	init: function () {
		if (scylec.presActive()) {
			$html.removeClass("scylec-text");
			if (!scylec.currentSlide()) {
				scylec.go(0);
			}
			enablePresKeys();
		} else {
			$html.addClass("scylec-text");
			disablePresKeys();
		}
	},

	presActive: function () {
		return $html.hasClass("scylec-pres");
	},

	togglePres: function () {
		$html.toggleClass("scylec-pres");
		scylec.init();
		var isPres = scylec.presActive();
		gaev("modeChange", isPres ? "presentation" : "text");
		return isPres;
	},

	toggleBlank: function () {
		$html.toggleClass("scylec-blank");
	},

	slides: function () {
		return $view.find("> h1, > h2, > .slide");
	},

	slide: function (slide) {
		switch (typeof slide) {
			case "number":
				var ret = scylec.slides().get(slide);
				if (!ret) { throw err("no such slide"); }
				return $(ret);
			case "object":
				var $ret = scylec.slides().filter(slide);
				if (!$ret.length) { throw err("not a slide"); }
				return $ret.filter(":first");
			default:
				throw err("invalid type \"" + (typeof slide) + "\" for slide");
		}
	},

	currentSlide: function () {
		var cur = scylec.slides().filter(".scylec-current:first");
		return cur.length ? cur : null;
	},

	slideCount: function () {
		return scylec.slides().length;
	},

	slideNo: function (slide) {
		var $slide = scylec.slide(typeof slide == "undefined" ? scylec.currentSlide() : slide);
		return scylec.slides().index($slide);
	},

	go: function (slide) {
		var $slide = scylec.slide(slide);
		$slide.addClass("scylec-current");
		scylec.slides().not($slide).removeClass("scylec-current");
		gaev("slideChange", "number", scylec.slideNo());
		return $slide;
	},

	next: function () {
		var no = scylec.slideNo();
		if (no >= (scylec.slideCount() - 1)) {
			throw err("already at last slide");
		}
		return scylec.go(no + 1);
	},

	prev: function () {
		var no = scylec.slideNo();
		if (no <= 0) {
			throw err("already at first slide");
		}
		return scylec.go(no - 1);
	}

};

$(scylec.init);

$(function () {
	$("button").click(function () {
		scylec.togglePres();
		$(this).hide();
	}).show();
	if (document.location && document.location.search && document.location.search == "?pres" && !scylec.presActive()) {
		gaev("modeOnLoad", "presentation");
		$("button").hide();
		scylec.togglePres();
	}
});

})(jQuery);
