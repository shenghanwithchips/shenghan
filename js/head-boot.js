(function (win, doc) {
  var root = doc.documentElement;

  root.classList.remove("fonts-ready");
  root.classList.add("fonts-loading");

  function markFontsReady() {
    root.classList.add("fonts-ready");
    root.classList.remove("fonts-loading");
  }

  if (!doc.fonts || !doc.fonts.load) {
    markFontsReady();
  } else {
    Promise.all([
      doc.fonts.load('400 1em "Instrument Serif"'),
      doc.fonts.load('italic 1em "Instrument Serif"'),
      doc.fonts.load('400 1em Geist'),
    ])
      .then(markFontsReady)
      .catch(markFontsReady);
    win.setTimeout(markFontsReady, 480);
  }

  try {
    if (sessionStorage.getItem("portfolio-scroll-work")) {
      sessionStorage.removeItem("portfolio-scroll-work");
      root.classList.add("scroll-work-pending");
      doc.addEventListener(
        "DOMContentLoaded",
        function () {
          var work = doc.getElementById("work");
          if (work) {
            win.scrollTo(0, work.offsetTop);
          }
          root.classList.remove("scroll-work-pending");
        },
        { once: true },
      );
    }
  } catch (_) {
    /* ignore */
  }
})(window, document);
