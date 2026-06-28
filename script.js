/* =========================================================
   NSS Talent Hunt 2083 — Application logic
   Pure vanilla JS. No frameworks.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Supabase init ---------- */
  let supabase = null;
  try {
    if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      supabase = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY,
      );
    }
  } catch (err) {
    console.warn("Supabase init failed:", err);
  }

  /* ---------- Club definitions ---------- */
  const CLUBS = [
    {
      id: "literature",
      name: "Literature",
      emoji: "✶",
      blurb: "Words, voices, ideas",
      question: "What domains interest you?",
      examples: "Creative Writing, Poetry, Public Speaking, Debate, Journalism",
      field: "literature_interest",
    },
    {
      id: "sports",
      name: "Sports & Games",
      emoji: "⚽",
      blurb: "Compete & lead",
      question: "Which sports interest you?",
      examples:
        "Football, Basketball, Volleyball, Badminton, Chess, Table Tennis, Athletics",
      field: "sports_interest",
    },
    {
      id: "stem",
      name: "STEM",
      emoji: "⚛",
      blurb: "Code, build, research",
      question: "What STEM fields excite you?",
      examples:
        "Programming, Robotics, AI, Research, Hackathons, Electronics, Web Development",
      field: "stem_interest",
    },
    {
      id: "arts",
      name: "Arts & Crafts",
      emoji: "✎",
      blurb: "Color, form & craft",
      question: "What arts interest you?",
      examples:
        "Painting, Sketching, Digital Art, Photography, Crafts, Decoration",
      field: "arts_interest",
    },
    {
      id: "social",
      name: "Social & Volunteering",
      emoji: "❤",
      blurb: "Lead with empathy",
      question: "What causes move you?",
      examples:
        "Community Service, Leadership, Campaigns, Blood Donation, Environment",
      field: "social_interest",
    },
    {
      id: "entertainment",
      name: "Entertainment",
      emoji: "♪",
      blurb: "Perform & electrify",
      question: "What performance arts interest you?",
      examples:
        "Singing, Dancing, Acting, Anchoring, Comedy, Beatboxing, Music, DJ",
      field: "entertainment_interest",
    },
  ];

  const RATING_LABELS = [
    "",
    "Curious",
    "Interested",
    "Keen",
    "Excited",
    "All in 🔥",
  ];

  /* ---------- State ---------- */
  const state = {
    currentStep: 1,
    selectedClubs: new Set(),
    eagerness: 0,
    submitting: false,
    submitted: false,
  };

  /* ---------- DOM references ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const form = $("#registrationForm");
  const stepFill = $("#stepFill");
  const stepItems = $$(".step");
  const formSteps = $$(".form-step");
  const clubCardsEl = $("#clubCards");
  const clubCounter = $("#clubCounter");
  const dynamicQuestions = $("#dynamicQuestions");
  const starsEl = $("#stars");
  const ratingLabel = $("#ratingLabel");
  const eagernessInput = $("#eagerness");
  const submitBtn = $("#submitBtn");
  const formAlert = $("#formAlert");
  const successScreen = $("#successScreen");
  const regIdEl = $("#regId");

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    buildClubCards();
    buildStars();
    bindEvents();
    initRevealOnScroll();
    initScrollProgress();
    setupKeyboardNav();
    initHeroCanvas();    
    animateCounters();
  }

  /* =========================================================
     CLUB CARDS (Step 2)
     ========================================================= */
  function buildClubCards() {
    clubCardsEl.innerHTML = CLUBS.map(
      (c) => `
      <div class="club-card" data-club="${c.id}" tabindex="0" role="checkbox" aria-checked="false">
        <input type="checkbox" name="clubs" value="${c.id}" />
        <span class="club-emoji" aria-hidden="true">${c.emoji}</span>
        <span class="club-info">
          <h4>${c.name}</h4>
          <p>${c.blurb}</p>
        </span>
        <span class="club-check" aria-hidden="true">✓</span>
      </div>
    `,
    ).join("");

    $$(".club-card").forEach((card) => {
      const input = card.querySelector("input");
      card.addEventListener("click", () => {
        toggleClub(card, input);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggleClub(card, input);
        }
      });
    });
  }

  function toggleClub(card, input) {
    const clubId = card.dataset.club;
    const willSelect = !input.checked;

    if (willSelect && state.selectedClubs.size >= 3) {
      flashCounter();
      return;
    }
    input.checked = willSelect;
    syncClubCard(card, input);
  }

  function syncClubCard(card, input) {
    const clubId = card.dataset.club;
    if (input.checked) {
      state.selectedClubs.add(clubId);
      card.classList.add("selected");
      card.setAttribute("aria-checked", "true");
    } else {
      state.selectedClubs.delete(clubId);
      card.classList.remove("selected");
      card.setAttribute("aria-checked", "false");
    }
    updateClubCounter();
    buildDynamicQuestions();
  }

  function updateClubCounter() {
    const n = state.selectedClubs.size;
    clubCounter.textContent = `${n} of 3 selected`;
    clubCounter.classList.toggle("warn", n >= 3);
  }

  function flashCounter() {
    clubCounter.classList.add("warn");
    clubCounter.textContent = "Maximum 3 clubs — remove one to add another.";
    setTimeout(() => updateClubCounter(), 1800);
  }

  /* =========================================================
     DYNAMIC QUESTIONS (Step 3)
     ========================================================= */
  function buildDynamicQuestions() {
    if (state.selectedClubs.size === 0) {
      dynamicQuestions.innerHTML = `<p class="empty-note">Select clubs in Step 2 to see questions here.</p>`;
      return;
    }
    const selected = CLUBS.filter((c) => state.selectedClubs.has(c.id));
    dynamicQuestions.innerHTML = selected
      .map(
        (c, i) => `
      <div class="question-block" data-field="${c.field}">
        <label for="q_${c.id}">${c.name}: ${c.question}</label>
        <p class="examples">Examples — ${c.examples}</p>
        <textarea id="q_${c.id}" name="${c.field}" rows="3"
          placeholder="Tell us about your interests in ${c.name.toLowerCase()}..."
          aria-describedby="err_${c.id}"></textarea>
        <small class="field-error" id="err_${c.id}" role="alert"></small>
      </div>
    `,
      )
      .join("");
  }

  /* =========================================================
     STARS (Step 4)
     ========================================================= */
  function buildStars() {
    starsEl.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("button");
      star.type = "button";
      star.className = "star";
      star.dataset.value = i;
      star.setAttribute("role", "radio");
      star.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`);
      star.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`;
      star.addEventListener("click", () => setRating(i));
      star.addEventListener("mouseenter", () => previewRating(i));
      star.addEventListener("mouseleave", () => previewRating(state.eagerness));
      star.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          setRating(Math.min(5, i + 1));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          setRating(Math.max(1, i - 1));
        }
      });
      starsEl.appendChild(star);
    }
  }

  function setRating(value) {
    state.eagerness = value;
    eagernessInput.value = value;
    previewRating(value);
    ratingLabel.textContent = RATING_LABELS[value] || "Tap a star";
  }

  function previewRating(value) {
    $$(".star").forEach((s) => {
      const v = parseInt(s.dataset.value, 10);
      s.classList.toggle("active", v <= value);
      s.setAttribute("aria-checked", v === value ? "true" : "false");
    });
  }

  /* =========================================================
     STEP NAVIGATION
     ========================================================= */
  function goToStep(target) {
    if (target === state.currentStep) return;
    if (target > state.currentStep && !validateStep(state.currentStep)) return;

    state.currentStep = target;
    formSteps.forEach((fs) => {
      const n = parseInt(fs.dataset.step, 10);
      const active = n === target;
      fs.classList.toggle("is-active", active);
      fs.setAttribute("aria-hidden", active ? "false" : "true");
      fs.disabled = !active;
    });

    // Update stepper
    stepItems.forEach((s) => {
      const n = parseInt(s.dataset.step, 10);
      s.classList.toggle("active", n === target);
      s.classList.toggle("done", n < target);
      s.setAttribute("aria-selected", n === target ? "true" : "false");
    });

    // Progress fill
    stepFill.style.width = (target / 4) * 100 + "%";

    // Scroll into view
    $(".register").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Stepper click navigation ---------- */
  function setupKeyboardNav() {
    stepItems.forEach((s) => {
      s.addEventListener("click", () => {
        const n = parseInt(s.dataset.step, 10);
        if (n < state.currentStep) goToStep(n);
      });
      s.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          s.click();
        }
      });
    });
  }

  /* =========================================================
     VALIDATION
     ========================================================= */
  function setError(input, message) {
    input.classList.add("invalid");
    const err =
      document.getElementById(input.id + "Error") ||
      document.getElementById(input.getAttribute("aria-describedby"));
    if (err) {
      err.textContent = message;
      err.classList.add("show");
    }
  }
  function clearError(input) {
    input.classList.remove("invalid");
    const err =
      document.getElementById(input.id + "Error") ||
      document.getElementById(input.getAttribute("aria-describedby"));
    if (err) {
      err.textContent = "";
      err.classList.remove("show");
    }
  }

  function validateName(v) {
    if (!v || v.trim().length < 3) return "Please enter at least 3 characters.";
    return "";
  }
  function validatePhone(v) {
    if (!/^[9]\d{9}$/.test(v))
      return "Enter a valid Nepali number (10 digits, starts with 9).";
    return "";
  }
  function validateEmail(v) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      return "Enter a valid email address.";
    return "";
  }
  function validateRoll(v) {
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 1 || n > 910)
      return "Roll number must be between 1 and 910.";
    return "";
  }

  function validateStep(step) {
    let ok = true;
    hideAlert();

    if (step === 1) {
      const name = $("#fullName");
      const grade = $("#grade");
      const section = $("#section");
      const roll = $("#rollNumber");
      const phone = $("#phone");
      const email = $("#email");
      const social = $("#socialContact");

      const checks = [
        [name, validateName(name.value)],
        [grade, !grade.value ? "Please select your grade." : ""],
        [section, !section.value ? "Please select your section." : ""],
        [roll, validateRoll(roll.value)],
        [phone, validatePhone(phone.value.trim())],
        [email, validateEmail(email.value.trim())],
        [social, !social.value.trim() ? "This field is required." : ""],
      ];
      checks.forEach(([el, msg]) => {
        if (msg) {
          setError(el, msg);
          ok = false;
        } else clearError(el);
      });
    }

    if (step === 2) {
      if (state.selectedClubs.size === 0) {
        showAlert("Please choose at least one club to continue.");
        ok = false;
      }
    }

    if (step === 3) {
      $$("#dynamicQuestions textarea").forEach((t) => {
        if (!t.value.trim()) {
          setError(t, "This field is required.");
          ok = false;
        } else if (t.value.trim().length < 2) {
          setError(t, "Please write a bit more.");
          ok = false;
        } else {
          clearError(t);
        }
      });
    }

    if (step === 4) {
      if (!state.eagerness || state.eagerness < 1) {
        showAlert("Please rate your eagerness.");
        ok = false;
      }
    }

    return ok;
  }

  /* =========================================================
     REAL-TIME VALIDATION
     ========================================================= */
  function bindValidation() {
    const name = $("#fullName");
    name.addEventListener("input", () => {
      const m = validateName(name.value);
      m ? setError(name, m) : clearError(name);
    });

    const grade = $("#grade");
    grade.addEventListener("change", () => {
      populateSections(grade.value);
      clearError(grade);
    });

    const section = $("#section");
    section.addEventListener("change", () => clearError(section));

    const roll = $("#rollNumber");
    roll.addEventListener("input", () => {
      const m = validateRoll(roll.value);
      m ? setError(roll, m) : clearError(roll);
    });

    const phone = $("#phone");
    phone.addEventListener("input", () => {
      // Strip non-digits, cap at 10
      phone.value = phone.value.replace(/\D/g, "").slice(0, 10);
      const m = validatePhone(phone.value);
      m ? setError(phone, m) : clearError(phone);
    });

    const email = $("#email");
    email.addEventListener("blur", () => {
      const m = validateEmail(email.value.trim());
      m ? setError(email, m) : clearError(email);
    });
    email.addEventListener("input", () => {
      if (email.classList.contains("invalid")) {
        const m = validateEmail(email.value.trim());
        m ? setError(email, m) : clearError(email);
      }
    });

    const social = $("#socialContact");
    social.addEventListener("input", () => {
      social.value.trim()
        ? clearError(social)
        : setError(social, "This field is required.");
    });
  }

  function populateSections(grade) {
    const section = $("#section");
    section.innerHTML = "";
    if (!grade) {
      section.disabled = true;
      section.innerHTML =
        '<option value="" disabled selected>Select grade first</option>';
      return;
    }
    const prefix = grade === "11" ? "D" : "M";
    section.disabled = false;
    section.innerHTML =
      `<option value="" disabled selected>Select section</option>` +
      Array.from({ length: 18 }, (_, i) => {
        const v = prefix + (i + 1);
        return `<option value="${v}">${v}</option>`;
      }).join("");
  }

  /* =========================================================
     FORM ALERT
     ========================================================= */
  function showAlert(msg) {
    formAlert.textContent = "⚠ " + msg;
    formAlert.classList.add("error");
    formAlert.hidden = false;
  }
  function hideAlert() {
    formAlert.hidden = true;
    formAlert.textContent = "";
    formAlert.classList.remove("error");
  }

  /* =========================================================
     SUBMISSION
     ========================================================= */
  async function handleSubmit(e) {
    e.preventDefault();
    if (state.submitting || state.submitted) return;

    // Validate all steps
    if (!validateStep(1)) {
      goToStep(1);
      return;
    }
    if (!validateStep(2)) {
      goToStep(2);
      return;
    }
    if (!validateStep(3)) {
      goToStep(3);
      return;
    }
    if (!validateStep(4)) {
      goToStep(4);
      return;
    }

    // Build payload
    const payload = {
      full_name: $("#fullName").value.trim(),
      grade: parseInt($("#grade").value, 10),
      section: $("#section").value,
      roll_number: parseInt($("#rollNumber").value, 10),
      phone: $("#phone").value.trim(),
      email: $("#email").value.trim(),
      social_contact: $("#socialContact").value.trim(),
      clubs: Array.from(state.selectedClubs),
      eagerness: state.eagerness,
    };

    // Add per-club interest answers
    CLUBS.forEach((c) => {
      const ta = document.querySelector(
        `#dynamicQuestions textarea[name="${c.field}"]`,
      );
      payload[c.field] = ta && ta.value.trim() ? ta.value.trim() : null;
    });

    // Loading state
    state.submitting = true;
    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;
    hideAlert();

    try {
      if (!supabase) {
        throw new Error(
          "Supabase is not configured. Please set credentials in config.js.",
        );
      }

      const { error } = await supabase.from("registrations").insert([payload]);

      if (error) throw error;

      // Success
      state.submitted = true;
      const id = generateFallbackId(payload);
      showSuccess(id);
    } catch (err) {
      console.error(err);
      const msg =
        err && err.message
          ? err.message
          : "Something went wrong. Please try again.";
      showAlert(msg);
      state.submitting = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
    }
  }

  function generateFallbackId(p) {
    return "NSS-" + Date.now().toString(36).toUpperCase().slice(-6);
  }

  function showSuccess(id) {
    regIdEl.textContent = id;
    successScreen.hidden = false;
    form.parentElement.style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => launchConfetti(), 250);
  }

  /* =========================================================
     CONFETTI (pure vanilla canvas)
     ========================================================= */
  function launchConfetti() {
    const canvas = $("#confettiCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const colors = [
      "#2563EB",
      "#60a5fa",
      "#a855f7",
      "#fbbf24",
      "#34d399",
      "#f472b6",
    ];
    const pieces = [];
    const N = 140;

    for (let i = 0; i < N; i++) {
      pieces.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 200,
        r: 4 + Math.random() * 6,
        c: colors[Math.floor(Math.random() * colors.length)],
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vrot: -0.2 + Math.random() * 0.4,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    let running = true;
    let frames = 0;
    const maxFrames = 360;

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rot += p.vrot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.max(0, 1 - frames / maxFrames);
        if (p.shape === "rect") {
          ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      frames++;
      if (running && frames < maxFrames) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    tick();
  }

  /* =========================================================
     RESET
     ========================================================= */
  function resetForm() {
    form.reset();
    state.currentStep = 1;
    state.selectedClubs.clear();
    state.eagerness = 0;
    state.submitting = false;
    state.submitted = false;

    $$(".club-card").forEach((c) => {
      c.classList.remove("selected");
      c.setAttribute("aria-checked", "false");
    });
    $$(".field-error").forEach((e) => {
      e.textContent = "";
      e.classList.remove("show");
    });
    $$(".invalid").forEach((e) => e.classList.remove("invalid"));
    $$(".star").forEach((s) => s.classList.remove("active"));
    ratingLabel.textContent = "Tap a star";
    eagernessInput.value = "";

    populateSections("");
    buildDynamicQuestions();
    updateClubCounter();

    submitBtn.classList.remove("is-loading");
    submitBtn.disabled = false;

    successScreen.hidden = true;
    form.parentElement.style.display = "";

    goToStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* =========================================================
     SCROLL PROGRESS + REVEAL
     ========================================================= */
  function initScrollProgress() {
    const bar = $("#scrollProgress");
    let ticking = false;
    let limit = 0;

    function updateLimit() {
      const h = document.documentElement;
      limit = h.scrollHeight - h.clientHeight;
    }

    window.addEventListener("resize", updateLimit);
    updateLimit();

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const scrolled = limit > 0 ? window.scrollY / limit : 0;
            bar.style.width = scrolled * 100 + "%";
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true },
    );
  }

  function initRevealOnScroll() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in-view");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    // Stagger reveal elements relative to their closest section/container, not globally
    const containers = $$(
      "section, header, .club-grid, .form-card, .success-card",
    );
    containers.forEach((container) => {
      const reveals = Array.from(
        container.querySelectorAll(":scope > .reveal, :scope > * > .reveal"),
      );
      reveals.forEach((el, i) => {
        el.style.transitionDelay = i * 50 + "ms";
      });
    });

    $$(".reveal").forEach((el) => {
      io.observe(el);
    });
  }

  /* =========================================================
     COPY BUTTON
     ========================================================= */
  function bindCopy() {
    const copyBtn = $("#copyId");
    copyBtn.addEventListener("click", async () => {
      const text = regIdEl.textContent;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1800);
      } catch {
        copyBtn.textContent = "Copy failed";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1800);
      }
    });
  }

  /* =========================================================
     EVENT BINDINGS
     ========================================================= */
  function bindEvents() {
    // Next / Back buttons
    $$(".next-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = parseInt(btn.dataset.next, 10);
        goToStep(target);
      });
    });
    $$(".back-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = parseInt(btn.dataset.back, 10);
        goToStep(target);
      });
    });

    // Submit
    form.addEventListener("submit", handleSubmit);

    // Real-time validation
    bindValidation();

    // Reset
    $("#resetForm").addEventListener("click", resetForm);

    // Copy ID
    bindCopy();
  }

  /* ---------- Go ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* =========================================================
   HERO CANVAS — animated particle mesh
   ========================================================= */
  function initHeroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const COLORS = ["#2563EB", "#7c3aed", "#60a5fa", "#a855f7", "#3b82f6"];
    const PARTICLE_COUNT = 55;
    let W,
      H,
      particles = [],
      animId;

    function resize() {
      const section = canvas.parentElement?.parentElement;
      W = section ? section.offsetWidth : window.innerWidth;
      H = section ? section.offsetHeight : 440;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    }

    function makeParticle() {
      return {
        x: Math.random() * (W || 900),
        y: Math.random() * (H || 440),
        r: 1.5 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.25 + Math.random() * 0.45,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(37,99,235,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener(
      "resize",
      () => {
        cancelAnimationFrame(animId);
        init();
        draw();
      },
      { passive: true },
    );
  }

  /* =========================================================
   HERO STAT COUNTERS
   ========================================================= */
  function animateCounters() {
    function countUp(el, target, duration) {
      if (!el) return;
      const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent =
          Math.round(ease * target) + (target === 900 ? "+" : "");
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            countUp(document.getElementById("statClubs"), 6, 900);
            countUp(document.getElementById("statStudents"), 900, 1400);
            io.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );

    const statsEl = document.querySelector(".hero-stats");
    if (statsEl) io.observe(statsEl);
  }
})();
