
  // ═══════ CONFIGURATION ═══════
  const BOOK_PRICE         = 250;
  const DELIVERY_KARNATAKA = 60;
  const DELIVERY_OTHER     = 80;
  const UPI_ID             = "9741813787@ybl";         // REPLACE
  const WHATSAPP_NUMBER    = "917892099079";           // REPLACE
  const GOOGLE_SCRIPT_URL  = "https://script.google.com/macros/s/AKfycbxwdgFrMXDiQn-MdnhsnP9E3t1wFPjBqpkkoxnbSqD4eT8p0bwfLCbXMvR9UxPeCI1wWQ/exec"; // REPLACE
  // ═════════════════════════════

  let qty      = 1;
  let region   = "karnataka";
  let lang     = "en";
  let orderRef = "";

  // ── ORDER REF: LSN-YYYYMMDD-XXXXXX ──
  function generateOrderRef() {
    const now  = new Date();
    const date = now.getFullYear().toString()
               + String(now.getMonth() + 1).padStart(2, "0")
               + String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(100000 + Math.random() * 900000);
    return "LSN-" + date + "-" + rand;
  }

  function getDelivery() { return region === "karnataka" ? DELIVERY_KARNATAKA : DELIVERY_OTHER; }
  function getTotal()    { return qty * BOOK_PRICE + getDelivery(); }
  function fmt(n)        { return "\u20B9" + n.toLocaleString("en-IN"); }

  // ── LANGUAGE SWITCH ──
  function setLang(l) {
    lang = l;
    document.body.classList.toggle("lang-kn", l === "kn");
    document.getElementById("langEN").classList.toggle("active", l === "en");
    document.getElementById("langKN").classList.toggle("active", l === "kn");

    // Switch all [data-en] / [data-kn] text nodes
    document.querySelectorAll("[data-en]").forEach(el => {
      // skip elements that are managed dynamically (UPI button mid-animation)
      if (el.id === "upiPayBtnText" || el.id === "upiIdText") return;
      el.textContent = el.getAttribute("data-" + l);
    });

    // Switch placeholders
    document.querySelectorAll("[data-placeholder-en]").forEach(el => {
      el.placeholder = el.getAttribute("data-placeholder-" + l);
    });

    // Refresh UPI button label
    const upiBtn = document.getElementById("upiPayBtnText");
    if (upiBtn) upiBtn.textContent = upiBtn.getAttribute("data-" + l);

    updateBreakdown();
  }

  // ── PRICE BREAKDOWN ──
  function updateBreakdown() {
    const regionLabel = region === "karnataka"
      ? (lang === "kn" ? "ಕರ್ನಾಟಕ" : "Karnataka")
      : (lang === "kn" ? "ಇತರ ರಾಜ್ಯ" : "Other State");

    document.getElementById("qtyDisplay").textContent  = qty;
    document.getElementById("pb_qty").textContent      = qty;
    document.getElementById("pb_books").textContent    = fmt(qty * BOOK_PRICE);
    document.getElementById("pb_region").textContent   = regionLabel;
    document.getElementById("pb_delivery").textContent = fmt(getDelivery());
    document.getElementById("pb_total").textContent    = fmt(getTotal());
  }

  function changeQty(d) {
    qty = Math.max(1, Math.min(10, qty + d));
    updateBreakdown();
  }

  function setRegion(r) {
    region = r;
    document.getElementById("btn-karnataka").classList.toggle("selected", r === "karnataka");
    document.getElementById("btn-other").classList.toggle("selected", r === "other");
    updateBreakdown();
  }

  // ── NAVIGATION ──
  function goTo(pageId, stepNum) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
    for (let i = 1; i <= 4; i++) {
      const s = document.getElementById("step" + i);
      s.classList.remove("active", "done");
      if (i < stepNum)       s.classList.add("done");
      else if (i === stepNum) s.classList.add("active");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setErr(id, show) {
    document.getElementById(id).classList.toggle("has-error", show);
  }

  function goToReview() {
    const name    = document.getElementById("inp_name").value.trim();
    const phone   = document.getElementById("inp_phone").value.trim();
    const address = document.getElementById("inp_address").value.trim();
    const pin     = document.getElementById("inp_pin").value.trim();
    const state   = document.getElementById("inp_state").value.trim();

    setErr("f_name",    !name);
    setErr("f_phone",   !/^[6-9]\d{9}$/.test(phone));
    setErr("f_address", !address);
    setErr("f_pin",     !/^\d{6}$/.test(pin));
    setErr("f_state",   !state);
    if (!name || !/^[6-9]\d{9}$/.test(phone) || !address || !/^\d{6}$/.test(pin) || !state) return;

    const regionLabel = region === "karnataka"
      ? (lang === "kn" ? "ಕರ್ನಾಟಕ" : "Karnataka")
      : (lang === "kn" ? "ಇತರ ರಾಜ್ಯ" : "Other State");

    document.getElementById("rev_qty").textContent      = qty + (lang === "kn" ? " ಪ್ರತಿ" : (qty > 1 ? " copies" : " copy"));
    document.getElementById("rev_books").textContent    = fmt(qty * BOOK_PRICE);
    document.getElementById("rev_delivery").textContent = fmt(getDelivery()) + " (" + regionLabel + ")";
    document.getElementById("rev_total").textContent    = fmt(getTotal());
    document.getElementById("rev_name").textContent     = name;
    document.getElementById("rev_phone").textContent    = phone;
    document.getElementById("rev_address").textContent  = address;
    document.getElementById("rev_pin").textContent      = pin;
    document.getElementById("rev_state").textContent    = state;

    goTo("pageReview", 3);
  }

  function goToPayment() {
    orderRef = generateOrderRef();
    document.getElementById("pay_orderRef").textContent = orderRef;
    const total = getTotal();
    document.getElementById("pay_amount").innerHTML = fmt(total);

    // Build UPI deep link with amount, name, order ref pre-filled
    const upiLink = "upi://pay"
      + "?pa=" + encodeURIComponent(UPI_ID)
      + "&pn=" + encodeURIComponent("Rajath Kumar S")
      + "&am=" + total
      + "&cu=INR"
      + "&tn=" + encodeURIComponent("Order " + orderRef);

    document.getElementById("upiDeepLink").href = upiLink;
    document.getElementById("upiPayAmt").textContent = fmt(total);

    // Detect mobile vs desktop and show the right UI
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                  || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

    document.querySelectorAll(".mobile-only").forEach(el => {
      el.style.display = isMobile ? "block" : "none";
    });
    document.querySelectorAll(".desktop-only").forEach(el => {
      el.style.display = isMobile ? "none" : "block";
    });

    goTo("pagePayment", 4);
  }

  function openUPI(e) {
    // Let the href do its job; also update button text briefly
    const btn = document.getElementById("upiPayBtnText");
    const orig = btn.getAttribute("data-" + lang);
    btn.textContent = lang === "kn" ? "UPI ಅಪ್ಲಿಕೇಶನ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ..." : "Opening UPI app...";
    setTimeout(() => { btn.textContent = orig; }, 3000);
  }

  function copyUPI() {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      const el = document.getElementById("upiIdText");
      el.textContent = lang === "kn" ? "ನಕಲಿಸಲಾಗಿದೆ!" : "Copied!";
      setTimeout(() => el.textContent = UPI_ID, 1500);
    });
  }

  function submitOrder() {
    const txn = document.getElementById("inp_txn").value.trim();
    setErr("f_txn", !txn);
    if (!txn) return;

    const btn = document.querySelector("#pagePayment .btn-primary");
    btn.disabled = true;
    btn.querySelector("span").textContent = lang === "kn" ? "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ..." : "Submitting...";

    const payload = {
      order_ref  : orderRef,
      timestamp  : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      name       : document.getElementById("inp_name").value.trim(),
      phone      : document.getElementById("inp_phone").value.trim(),
      address    : document.getElementById("inp_address").value.trim(),
      state      : document.getElementById("inp_state").value.trim(),
      pincode    : document.getElementById("inp_pin").value.trim(),
      region     : region === "karnataka" ? "Karnataka" : "Other State",
      qty        : qty,
      book_total : qty * BOOK_PRICE,
      delivery   : getDelivery(),
      amount     : getTotal(),
      txn_id     : txn
    };

    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).finally(() => {
      document.getElementById("successRef").textContent = orderRef;
      document.getElementById("waLink").href =
        "https://wa.me/" + WHATSAPP_NUMBER +
        "?text=Hi%2C%20I%20placed%20an%20order%20%E2%80%94%20Ref%3A%20" + encodeURIComponent(orderRef);
      goTo("pageSuccess", 5);
      document.querySelectorAll(".step").forEach(s => s.classList.remove("active", "done"));
    });
  }

  // Init
  updateBreakdown();
