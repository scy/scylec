var clean  = require("gulp-clean")
  , marked = require("gulp-marked")
  , sass   = require("gulp-sass")
  , wrap   = require("gulp-wrap")

var scylecRenderer = function () {
	var r = new marked.Renderer(), heading_before = "", in_slide = false;
	(function (old_heading) {
		r.heading = function (text, level) {
			var ret = "";
			if (text === "~") {
				text = arguments[0] = heading_before;
			}
			heading_before = text;
			if (in_slide) {
				ret += "</article>\n";
				in_slide = false;
			}
			if (level === 6) {
				arguments[1] = 3;
				ret += "<article class=\"slide\">\n";
				in_slide = true;
			}
			return ret + old_heading.apply(this, arguments);
		};
	})(r.heading);
	(function (old_hr) {
		r.hr = function () {
			if (in_slide) {
				in_slide = false;
				return "</article>\n";
			}
			return old_hr.apply(this, arguments);
		};
	})(r.hr);
	(function (old_image) {
		r.image = function (href, title, text) {
			if (typeof title === "string") {
				var class_match = title.match(/^~([0-9a-zA-Z_-]+)(?:\s*(.+))?$/);
				if (class_match) {
					var css_class = class_match[1];
					title = class_match[2];
				}
			}
			return '<img src="' + href + '" alt="' + text + '"'
				+ (title ? ' title="' + title + '"' : '')
				+ (css_class ? ' class="' + css_class + '"' : '')
				+ (this.options.xhtml ? '/>' : '>');
		};
	})(r.image);
	return r;
};

var defaults = {
	dest: "html",
	assetDest: "html/asset",
	assetFiles: [ "src/asset/*" ],
	jsFiles: [ "src/*.js" ],
	mdFiles: [ "src/*.md" ],
	scssFiles: [ "src/*.scss" ],
	template: "src/template.html",
	fixLexer: true,
	mdRenderer: scylecRenderer()
};

var scylec = function (gulp, opts) {
	// Merge opts with defaults.
	opts = (typeof opts == 'undefined') ? {} : opts;
	for (var key in defaults) {
		if (typeof opts[key] == "undefined") {
			opts[key] = defaults[key];
		}
	}

	if (opts.fixLexer) {
		marked.Lexer.prototype.lex = function (src) {
			src = src
				.replace(/\r\n|\r/g, "\n")
				.replace(/\t/g, "    ")
				.replace(/\u2424/g, "\n");
			return this.token(src, true);
		};
	}

	// Task for cleaning the destination directory.
	gulp.task("scylec-clean", function () {
		return gulp.src(opts.dest, { read: false })
			.pipe(clean());
	});

	// Task for copying assets over.
	gulp.task("scylec-asset", function () {
		return gulp.src(opts.assetFiles)
			.pipe(gulp.dest(opts.assetDest));
	});

	// Task for copying the JavaScript.
	// TODO: Minify and concatenate.
	gulp.task("scylec-js", function () {
		return gulp.src(opts.jsFiles)
			.pipe(gulp.dest(opts.dest));
	});

	// Task for compiling the markdown files.
	gulp.task("scylec-markdown", function () {
		return gulp.src(opts.mdFiles)
			.pipe(marked({
				renderer: opts.mdRenderer
			}))
			.pipe(wrap({ src: opts.template }))
			.pipe(gulp.dest(opts.dest));
	});

	// Task for compiling the SCSS styles.
	gulp.task("scylec-scss", function () {
		return gulp.src(opts.scssFiles)
			.pipe(sass())
			.pipe(gulp.dest(opts.dest));
	});

	// Task for everything.
	gulp.task("scylec-all", [ "scylec-clean", "scylec-scss", "scylec-js", "scylec-asset", "scylec-markdown" ]);

	// Task for watching.
	gulp.task("scylec-watch", function () {
		gulp.watch(opts.assetFiles, [ "scylec-asset" ]);
		gulp.watch(opts.jsFiles, [ "scylec-js" ]);
		gulp.watch([opts.mdFiles, opts.template], [ "scylec-markdown" ]);
		gulp.watch(opts.scssFiles, [ "scylec-scss" ]);
	});

	// Task for everything _and_ watching.
	gulp.task("scylec", [ "scylec-all", "scylec-watch" ]);
};

module.exports = scylec;
