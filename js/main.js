(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- EDIT: demo shop products ---- */
  var DEMO_ITEMS = [
    { name: "Wireless Earbuds", price: 499, stock: 8 },
    { name: "Phone Case", price: 149, stock: 5 },
    { name: "Sneakers", price: 1299, stock: 3 }
  ];
  var LOW_STOCK = 4;

  /* ---- Footer year ---- */
  $("#year").textContent = new Date().getFullYear();

  /* ---- Mobile menu ---- */
  var nav = $("#nav"), menuBtn = $(".menu-btn");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* ---- Header shadow on scroll ---- */
  var header = $(".site-header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---- Highlight current section in the menu ---- */
  if ("IntersectionObserver" in window) {
    var links = {};
    $$("nav a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          $$("nav a.active").forEach(function (a) { a.classList.remove("active"); });
          links[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---- Photos: drop images/<name>.jpg|jpeg|png|webp and it appears automatically ---- */
  $$(".photo[data-photo]").forEach(function (box) {
    var exts = ["jpg", "jpeg", "png", "webp"];
    (function tryNext(i) {
      if (i >= exts.length) return;
      var img = new Image();
      img.onload = function () { img.alt = box.dataset.alt || ""; box.appendChild(img); box.classList.add("has-img"); };
      img.onerror = function () { tryNext(i + 1); };
      img.src = "images/" + box.dataset.photo + "." + exts[i];
    })(0);
  });

  /* ---- Live demo: mini POS ---- */
  var items = DEMO_ITEMS.map(function (i) { return { n: i.name, p: i.price, s: i.stock, max: i.stock, q: 0 }; });
  var list = $("#items"), totalEl = $("#total"), msg = $("#msg");
  function peso(v) { return "₱" + v.toLocaleString("en-PH"); }
  function draw() {
    var total = 0;
    list.innerHTML = "";
    items.forEach(function (it, i) {
      total += it.q * it.p;
      var left = it.s - it.q;
      var row = document.createElement("div"); row.className = "row";
      var info = document.createElement("div");
      var name = document.createElement("div"); name.textContent = it.n; name.style.fontWeight = "600";
      var st = document.createElement("small");
      st.textContent = left === 0 ? "Out of stock" : left <= LOW_STOCK ? "Low stock: " + left + " left" : "In stock: " + left;
      if (left <= LOW_STOCK) st.className = "low";
      info.appendChild(name); info.appendChild(st);
      var qty = document.createElement("div"); qty.className = "qty";
      var minus = btn("−", "Remove one " + it.n, i, -1, it.q === 0);
      var out = document.createElement("output"); out.textContent = it.q;
      var plus = btn("+", "Add one " + it.n, i, 1, left === 0);
      qty.appendChild(minus); qty.appendChild(out); qty.appendChild(plus);
      var price = document.createElement("div"); price.className = "price"; price.textContent = peso(it.p);
      row.appendChild(info); row.appendChild(qty); row.appendChild(price);
      list.appendChild(row);
    });
    totalEl.textContent = peso(total);
  }
  function btn(label, aria, i, d, off) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = label; b.setAttribute("aria-label", aria);
    b.dataset.i = i; b.dataset.d = d; b.disabled = off; return b;
  }
  list.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.disabled) return;
    var it = items[+b.dataset.i], q = it.q + +b.dataset.d;
    if (q >= 0 && q <= it.s) it.q = q;
    msg.textContent = ""; draw();
  });
  $("#checkout").addEventListener("click", function () {
    var sum = 0;
    items.forEach(function (it) { sum += it.q * it.p; it.s -= it.q; it.q = 0; });
    msg.textContent = sum ? "Order placed: " + peso(sum) + ". Stock updated." : "Add an item first.";
    draw();
  });
  $("#restock").addEventListener("click", function () {
    items.forEach(function (it) { it.s = it.max; it.q = 0; });
    msg.textContent = "Stock restored."; draw();
  });
  draw();

  /* ---- Email forms (contact + ask a question): open the email app, copy as fallback ---- */
  function copy(text) {
    function fb() {
      try { var t = document.createElement("textarea"); t.value = text; t.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(t); t.select(); var ok = document.execCommand("copy"); document.body.removeChild(t); return ok; }
      catch (e) { return false; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fb(); });
    return Promise.resolve(fb());
  }
  function setupForm(form, required, makeSubject, makeBody) {
    var out = $(".form-msg", form);
    function note(text, err) { out.textContent = text; out.className = "form-msg" + (err ? " err" : ""); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form), bad = false;
      required.forEach(function (k) {
        var f = form.elements[k], v = (d.get(k) || "").trim();
        var ok = v && (k !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
        f.classList.toggle("invalid", !ok); if (!ok) bad = true;
      });
      if (bad) { note("Please complete the highlighted fields and use a valid email.", true); return; }
      var a = $("a[href^='mailto:']"), to = a ? a.getAttribute("href").slice(7) : "";
      var body = makeBody(d);
      copy(body).then(function (ok) {
        window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(makeSubject(d)) + "&body=" + encodeURIComponent(body);
        note(ok ? "Your email app should open. If it does not, your message was copied. Paste it into an email to " + to + "." : "If your email app did not open, please email " + to + " directly.");
      });
    });
    $$("input,textarea", form).forEach(function (f) { f.addEventListener("input", function () { f.classList.remove("invalid"); }); });
  }
  setupForm($("#contactForm"), ["name", "email", "message"],
    function (d) { return "Project inquiry: " + d.get("type"); },
    function (d) { return "Name: " + d.get("name") + "\nEmail: " + d.get("email") + "\nI need: " + d.get("type") + "\n\n" + d.get("message"); });
  setupForm($("#askForm"), ["question", "email"],
    function () { return "Question from your portfolio"; },
    function (d) { return "Email: " + d.get("email") + "\n\nQuestion:\n" + d.get("question"); });
})();
