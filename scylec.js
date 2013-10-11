(function ($) {
'use strict';



// The current display mode. By default, we do nothing to the markup and are therefore in (manu)script mode.
var mode = 'script';



// Whether the DOM is ready.
var isReady = false;

// Things that should run as soon as the DOM has been loaded. We’ll attach some functions here, but the user can also
// use scylec.onReady() to attach more handlers. Since these were registered after ours, they run after scylec has been
// completely initialized.
var onReadyHandlers = [];

// Push another handler to the onReadyHandlers or, if the DOM is already ready, run it immediately.
var onReady = function (handler) {
	onReadyHandlers.push(handler);
	if (isReady) {
		runReadyHandlers();
	}
};

// The function that runs all the onReadyHandlers.
var runReadyHandlers = function () {
	var handler;
	// We can safely assume that the DOM is now ready.
	window.scylec.isReady = isReady = true;
	while (handler = onReadyHandlers.shift()) {
		handler.apply(window.scylec);
	}
};

// Run the onReadyHandlers as soon as the DOM is ready.
$(function () {
	runReadyHandlers();
});



// The body.
var $body;
onReady(function () {
	$body = $('body:first');
});

// The original markup. We’ll use that to extract pieces from it.
var $markup = $('<div />', {
	id: 'scylec-markup'
});

// Copy over the original markup on ready to always have a backup.
onReady(function () {
	$body.find('> *').clone().appendTo($markup);
});



// The viewport we’re going to display stuff in.
var $viewport = $('<div />', {
	id: 'scylec-viewport'
});

// Attach the viewport to the body after removing the original body.
onReady(function () {
	$viewport.appendTo($body);
});



// Set the mode, update the body class etc.
var setMode = function (newmode) {
	$body.removeClass('scylec-mode-' + mode).addClass('scylec-mode-' + newmode);
	mode = newmode;
	return newmode;
};
// Initially set the mode.
onReady(function () {
	setMode(mode);
});



// The navigation bar.
var $nav = $('<div id="scylec-nav"><span class="scylec-curslide">?</span> / <span class="scylec-slidecount">?</span></div>');

// Attach the navbar to the body.
onReady(function () {
	$nav.appendTo($body);
});

// Show and hide nav.
var showNav = function () {
	$nav.addClass('visible');
};
var hideNav = function () {
	$nav.removeClass('visible');
};

// Show and hide nav when the mouse moves.
var _move2navEnable = function () {
	var move2navTimeout = null;
	$(document).on('mousemove.scylec_move2nav', function () {
		if (move2navTimeout) {
			clearTimeout(move2navTimeout);
		}
		move2navTimeout = setTimeout(function () {
			move2navTimeout = null;
			hideNav();
		}, 2000);
		showNav();
	});
};
var _move2navDisable = function () {
	$(document).off('.scylec_move2nav');
};



// The blanking div.
var $blank = $('<div />', {
	id: 'scylec-blanker'
});
onReady(function () {
	$blank.appendTo($body);
});

// Toggle screen blanking.
var toggleBlank = function () {
	$body.toggleClass('scylec-blank');
};



// Keyboard navigation.
var _keynavEnable = function () {
	$(document).on('keydown.scylec_keynav', function (ev) {
		console.log(ev.which);
		switch (ev.which) {
			case 33:
			case 37:
			case 38:
				prevSlide();
				return false;
				break;
			case 34:
			case 39:
			case 40:
				nextSlide();
				return false;
				break;
			case 116: // "play" on a Logitech presenter
			case 27: // second press on "play" on a Logitech presenter
			case 190: // "blank" on a Logitech presenter
				toggleBlank();
				return false;
				break;
		}
	});
};
var _keynavDisable = function () {
	$(document).off('.scylec_keynav');
};



// All the slides in the document.
var $slides;
onReady(function () {
	$slides = $markup.find('h1, h2, .slide');
});

// The current slide, counting from 1. 0 means “no current slide”.
var slideidx = 0;



// Change mode to presentation.
var doPresentation = function () {
	// If we don’t have slides, we can’t do a presentation.
	if (!$slides.length) {
		return false;
	}
	// If we are already in presentation mode, there’s nothing to do.
	if (mode == 'presentation') {
		return true;
	}
	// If this is the first time we switch to presentation mode, we have to load the first slide.
	if (!slideidx) {
		gotoSlide(1);
		$nav.find('.scylec-slidecount').text($slides.length);
	}
	// Throw away ALL the body, we're presenting based on $slides. But keep our nav and viewport there.
	$body.empty().append($nav).append($viewport);
	_move2navEnable();
	_keynavEnable();
	setMode('presentation');
};



// Show a specific slide.
var gotoSlide = function (to) {
	to = parseInt(to, 10);
	if (to > $slides.length || to < 1) {
		return false;
	}
	var $slide = $($slides.get(to - 1));
	$viewport.empty().append($slide.clone());
	slideidx = to;
	$nav.find('.scylec-curslide').text(slideidx);
	return to;
};

// Get the currently active slide.
var getSlideNum = function () {
	return slideidx;
};

// Previous and next slides.
var prevSlide = function () {
	gotoSlide(getSlideNum() - 1);
};
var nextSlide = function () {
	gotoSlide(getSlideNum() + 1);
};



// Register our global object.
window.scylec = (typeof window.scylec == 'object') ? window.scylec : {};

// Phase 1: Things that should be available before document.ready.
$.extend(window.scylec, {
	isReady: false,
	onReady: onReady
});

// Phase 2: Things that should be available after document.ready.
$.extend(window.scylec, {
	doPresentation: doPresentation,
	getSlideNum: getSlideNum,
	gotoSlide: gotoSlide,
	hideNav: hideNav,
	nextSlide: nextSlide,
	prevSlide: prevSlide,
	showNav: showNav,
	toggleBlank: toggleBlank
});



})(jQuery);
