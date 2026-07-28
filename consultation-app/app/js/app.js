/**
 * Pleroma Consultation App — UI wiring (v3).
 *
 * Implements the family-first flow:
 *   1. Texture questions (binary, 2 steps) → resolves to Straight|Wavy|Curly|Coily
 *   2. Skin tone (1 step) → light | medium | deep
 *   3. Family picker (grid of up to 10 family cards, filtered by texture)
 *   4. Refinement questions (binary or multi, linked via next IDs in data.js)
 *   5. Results: single selected style + haircut image viewer + barber spec table
 *   6. Feedback: accuracy rating (Does this look like what you were picturing?)
 *   7. Show Barber: clean full-screen spec to hand to the barber
 */
(function () {
  "use strict";

  // ─── Data ─────────────────────────────────────────────────────────────────

  let HAIRCUTS = [];

  const {
    TEXTURE_QUESTIONS,
    TEXTURE_START,
    SKIN_TONE_QUESTIONS,
    SKIN_TONE_START,
    FAMILIES,
    QUESTIONS,
  } = window.PleromaData;
  const { selectStyle, buildBarberSpec } = window.PleromaScoring;

  // ─── Image helpers ────────────────────────────────────────────────────────

  const FADE_FOLDER = {
    low:  "low-fade",
    mid:  "mid-fade",
    high: "high-fade",
  };

  function haircutImagePath(styleId, skinTone, fadeHeight) {
    const fade = FADE_FOLDER[fadeHeight] || "mid-fade";
    const tone = skinTone || "medium";
    return `images/haircuts/${styleId}/${tone}/${fade}/left.png`;
  }

  /**
   * Resolve a choice image path, substituting {tone} with the current skin tone.
   * Falls back to "medium" if tone is not yet known.
   */
  function resolveImage(path, skinTone) {
    if (!path) return null;
    return path.replace("{tone}", skinTone || "medium");
  }

  // ─── Avatar helpers (Quick Pick / fallback) ───────────────────────────────

  const AVATAR_PALETTE = [
    "#14532d", "#a5822f", "#8a3324", "#2f4a63",
    "#5b3a29", "#3c6e47", "#7a5c1e", "#4a4e69",
  ];

  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function avatarColorFor(style) {
    const key = style.styleFamily || style.styleName || style.styleId || "";
    return AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];
  }

  function initialsFor(style) {
    const words = (style.styleName || "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // ─── Screen navigation ────────────────────────────────────────────────────

  const screens = Array.from(document.querySelectorAll(".screen"));

  function showScreen(name) {
    screens.forEach((el) => {
      el.classList.toggle("active", el.dataset.screen === name);
    });
    window.scrollTo(0, 0);
  }

  // ─── Quick Pick grid + detail ─────────────────────────────────────────────

  const haircutGridEl = document.getElementById("haircutGrid");
  const detailCardEl  = document.getElementById("detailCard");

  function renderGrid() {
    haircutGridEl.innerHTML = "";
    HAIRCUTS.forEach((style) => {
      const card = document.createElement("div");
      card.className = "haircut-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");

      const topVibe = style.vibeTags && style.vibeTags[0];
      const imgPath = haircutImagePath(style.styleId, "medium", "mid");
      const color   = avatarColorFor(style);
      const initials = initialsFor(style);

      card.innerHTML = `
        <div class="haircut-card-img-wrap">
          <img class="haircut-card-img" src="${imgPath}" alt="${style.styleName}" />
          <div class="haircut-card-img-fallback" style="background:${color}">${initials}</div>
        </div>
        <div class="card-name">${style.styleName}</div>
        <div class="card-tags">
          <span class="tag">${style.maintenanceLevel} maint.</span>
          ${topVibe ? `<span class="tag tag-accent">${topVibe}</span>` : ""}
        </div>
      `;

      // Image fallback
      const img = card.querySelector(".haircut-card-img");
      const fallback = card.querySelector(".haircut-card-img-fallback");
      img.addEventListener("error", () => {
        img.style.display = "none";
        fallback.style.display = "flex";
      });

      card.addEventListener("click", () => openDetail(style));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openDetail(style);
      });
      haircutGridEl.appendChild(card);
    });
  }

  function openDetail(style) {
    const textureList = (style.textures || []).join(", ");
    const variantHtml =
      style.finishVariants
        ? `<div class="attr-item"><div class="attr-label">Finish variants</div><div class="attr-value">${style.finishVariants.join(", ")}</div></div>`
        : style.stylingVariants
        ? `<div class="attr-item"><div class="attr-label">Styling variants</div><div class="attr-value">${style.stylingVariants.join(", ")}</div></div>`
        : "";

    const imgPath  = haircutImagePath(style.styleId, "medium", "mid");
    const color    = avatarColorFor(style);
    const initials = initialsFor(style);

    detailCardEl.innerHTML = `
      <div class="detail-avatar-row">
        <div class="detail-img-wrap" style="width:120px;height:160px;border-radius:12px;overflow:hidden;background:${color};position:relative;">
          <img src="${imgPath}" alt="${style.styleName}" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <div style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#fff">${initials}</div>
        </div>
      </div>
      <h2 class="detail-name">${style.styleName}</h2>
      <p class="detail-family">${style.styleFamily}</p>
      <p class="detail-description">${style.description}</p>
      <div class="attr-grid">
        <div class="attr-item"><div class="attr-label">Maintenance</div><div class="attr-value">${style.maintenanceLevel}</div></div>
        <div class="attr-item"><div class="attr-label">Hair texture</div><div class="attr-value">${textureList}</div></div>
        <div class="attr-item"><div class="attr-label">Vibe</div><div class="attr-value">${(style.vibeTags || []).join(", ")}</div></div>
        ${variantHtml}
      </div>
      ${style.upsellTag ? `<div class="upsell-banner">${style.upsellTag}</div>` : ""}
    `;
    showScreen("quick-detail");
  }

  // ─── Personalized flow state ───────────────────────────────────────────────

  // Phase: "texture" | "skinTone" | "family" | "refinement"
  let flowPhase = "texture";

  let currentTextureId  = null;
  let textureHistory    = [];

  let currentSkinToneId = null;
  let skinToneHistory   = [];

  let resolvedTexture   = null;

  let chosenFamilyId      = null;
  let currentQuestionId   = null;
  let refinementHistory   = [];
  let refinements         = {};

  // Step count: texture(2) + skinTone(1) + family(1) + refinements(~4)
  const PROGRESS_STEPS_APPROX = 8;
  let stepIndex = 0;

  // ─── Question screen helpers ───────────────────────────────────────────────

  const questionTextEl    = document.getElementById("questionText");
  const choiceListEl      = document.getElementById("choiceList");
  const progressLabelEl   = document.getElementById("progressLabel");
  const progressBarFillEl = document.getElementById("progressBarFill");

  function setProgress(step, total) {
    progressLabelEl.textContent = `Step ${step} of ${total}`;
    progressBarFillEl.style.width = `${Math.min(100, Math.round((step / total) * 100))}%`;
  }

  function renderQuestion(question, texture, onChoice) {
    questionTextEl.textContent = question.text;
    choiceListEl.innerHTML = "";

    const skinTone = refinements.skinTone || "medium";

    const visibleChoices = question.choices.filter((c) => {
      if (!c.textureOnly) return true;
      return texture && c.textureOnly.includes(texture);
    });

    const hasImages = visibleChoices.some((c) => c.image);

    if (hasImages) {
      // Illustrated grid layout
      const cols = visibleChoices.length >= 3 ? "choice-list-illustrated-3" : "choice-list-illustrated";
      choiceListEl.className = `choice-list ${cols}`;

      visibleChoices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.className = "btn choice-btn-illustrated";

        const imgSrc = resolveImage(choice.image, skinTone);
        btn.innerHTML = `
          <img class="choice-img" src="${imgSrc}" alt="${choice.label}" />
          <span class="choice-label-text">${choice.label}</span>
        `;

        // Image fallback — hide broken image, keep label readable
        const img = btn.querySelector(".choice-img");
        img.addEventListener("error", () => { img.style.display = "none"; });

        btn.addEventListener("click", () => onChoice(choice));
        choiceListEl.appendChild(btn);
      });

    } else {
      // Text-only layouts (original behaviour)
      const isBinary = question.type !== "multi" && visibleChoices.length <= 2;

      if (isBinary) {
        choiceListEl.className = "choice-list";
        visibleChoices.forEach((choice) => {
          const btn = document.createElement("button");
          btn.className = "btn choice-btn";
          btn.textContent = choice.label;
          btn.addEventListener("click", () => onChoice(choice));
          choiceListEl.appendChild(btn);
        });
      } else {
        choiceListEl.className = "choice-list choice-list-multi";
        visibleChoices.forEach((choice) => {
          const btn = document.createElement("button");
          btn.className = "btn choice-btn choice-btn-multi";
          btn.textContent = choice.label;
          btn.addEventListener("click", () => onChoice(choice));
          choiceListEl.appendChild(btn);
        });
      }
    }

    showScreen("question");
  }

  // ─── Phase 1: Texture ─────────────────────────────────────────────────────

  function startPersonalizedFlow() {
    flowPhase = "texture";
    textureHistory    = [];
    skinToneHistory   = [];
    refinementHistory = [];
    refinements       = {};
    resolvedTexture   = null;
    chosenFamilyId    = null;
    currentQuestionId = null;
    stepIndex = 1;

    currentTextureId = TEXTURE_START;
    renderTextureQuestion();
  }

  function renderTextureQuestion() {
    const q = TEXTURE_QUESTIONS[currentTextureId];
    setProgress(stepIndex, PROGRESS_STEPS_APPROX);
    renderQuestion(q, null, onTextureChoice);
  }

  function onTextureChoice(choice) {
    if (choice.specValue && choice.specKey === "texture") {
      resolvedTexture = choice.specValue;
      refinements.texture = resolvedTexture;
      textureHistory.push(currentTextureId);
      stepIndex = 3;
      startSkinTonePhase();
      return;
    }
    textureHistory.push(currentTextureId);
    currentTextureId = choice.next;
    stepIndex++;
    renderTextureQuestion();
  }

  // ─── Phase 2: Skin tone ───────────────────────────────────────────────────

  function startSkinTonePhase() {
    flowPhase = "skinTone";
    skinToneHistory   = [];
    currentSkinToneId = SKIN_TONE_START;
    renderSkinToneQuestion();
  }

  function renderSkinToneQuestion() {
    const q = SKIN_TONE_QUESTIONS[currentSkinToneId];
    setProgress(stepIndex, PROGRESS_STEPS_APPROX);
    renderQuestion(q, null, onSkinToneChoice);
  }

  function onSkinToneChoice(choice) {
    refinements.skinTone = choice.specValue;
    skinToneHistory.push(currentSkinToneId);
    stepIndex = 4;
    showFamilyPicker();
  }

  // ─── Phase 3: Family picker ───────────────────────────────────────────────

  const familyGridEl            = document.getElementById("familyGrid");
  const familyProgressLabelEl   = document.getElementById("familyProgressLabel");
  const familyProgressBarFillEl = document.getElementById("familyProgressBarFill");

  function showFamilyPicker() {
    flowPhase = "family";

    familyProgressLabelEl.textContent = `Step 4 of ${PROGRESS_STEPS_APPROX}`;
    familyProgressBarFillEl.style.width = `${Math.round((4 / PROGRESS_STEPS_APPROX) * 100)}%`;

    const skinTone = refinements.skinTone || "medium";

    const compatible = FAMILIES.filter(
      (f) => f.textures.includes(resolvedTexture)
    );

    familyGridEl.innerHTML = "";
    compatible.forEach((family) => {
      const card = document.createElement("button");
      card.className = "family-card";

      const tone     = family.imageTone || skinTone;
      const styleId  = family.representativeStyleId;
      const imgPath  = styleId ? `images/haircuts/${styleId}/${tone}/mid-fade/left.png` : null;

      card.innerHTML = imgPath ? `
        <img class="family-card-img" src="${imgPath}" alt="${family.name}" />
        <div class="family-card-img-fallback"><span>${family.emoji}</span></div>
        <span class="family-name">${family.name}</span>
        <span class="family-desc">${family.description}</span>
      ` : `
        <span class="family-emoji">${family.emoji}</span>
        <span class="family-name">${family.name}</span>
        <span class="family-desc">${family.description}</span>
      `;

      if (imgPath) {
        const img      = card.querySelector(".family-card-img");
        const fallback = card.querySelector(".family-card-img-fallback");
        img.addEventListener("error", () => {
          img.style.display = "none";
          fallback.style.display = "flex";
        });
      }

      card.addEventListener("click", () => onFamilyChosen(family));
      familyGridEl.appendChild(card);
    });

    showScreen("family-picker");
  }

  function onFamilyChosen(family) {
    chosenFamilyId    = family.id;
    flowPhase         = "refinement";
    refinementHistory = [];
    stepIndex         = 5;
    currentQuestionId = family.startQuestion;
    renderRefinementQuestion();
  }

  // ─── Phase 4: Refinement questions ────────────────────────────────────────

  function renderRefinementQuestion() {
    const q = QUESTIONS[currentQuestionId];
    if (!q) {
      showResults();
      return;
    }
    setProgress(stepIndex, PROGRESS_STEPS_APPROX);
    renderQuestion(q, resolvedTexture, onRefinementChoice);
  }

  function onRefinementChoice(choice) {
    if (choice.selectsStyle) {
      refinements.selectedStyleId = choice.selectsStyle;
    }
    if (choice.specKey) {
      refinements[choice.specKey] = choice.specValue;
    }

    refinementHistory.push(currentQuestionId);
    stepIndex = Math.min(stepIndex + 1, PROGRESS_STEPS_APPROX);

    if (choice.next === null || choice.next === undefined) {
      showResults();
    } else {
      currentQuestionId = choice.next;
      renderRefinementQuestion();
    }
  }

  // ─── Results ──────────────────────────────────────────────────────────────

  const resultSpecEl = document.getElementById("resultSpec");
  let _resultStyle         = null;
  let _resultSkin          = null;
  let _resultFade          = null;
  let _consultationId      = null;   // UUID from Supabase, used to link feedback

  function showResults() {
    const style = selectStyle(HAIRCUTS, chosenFamilyId, resolvedTexture, refinements);

    if (!style) {
      resultSpecEl.innerHTML = `<p class="error-msg">Sorry — no match found for that combination. Try starting over.</p>`;
      showScreen("results");
      return;
    }

    _resultStyle = style;
    _resultSkin  = refinements.skinTone  || "medium";
    _resultFade  = refinements.fadeHeight || "mid";

    const specRows = buildBarberSpec(style, refinements);

    const rowsHtml = specRows
      .map(
        (row) => `
        <div class="spec-row">
          <span class="spec-label">${row.label}</span>
          <span class="spec-value">${row.value}</span>
        </div>`
      )
      .join("");

    const variantNote =
      style.finishVariants
        ? `<p class="result-variant-note">Finish variants: ${style.finishVariants.join(" · ")}</p>`
        : style.stylingVariants
        ? `<p class="result-variant-note">Styling options: ${style.stylingVariants.join(" · ")}</p>`
        : "";

    const imgPath  = haircutImagePath(style.styleId, _resultSkin, _resultFade);
    const color    = avatarColorFor(style);
    const initials = initialsFor(style);

    resultSpecEl.innerHTML = `
      <div class="result-image-wrap" id="resultImgWrap">
        <img
          class="result-image"
          id="resultImg"
          src="${imgPath}"
          alt="${style.styleName} — side view"
        />
        <div class="result-img-fallback" id="resultImgFallback" style="background:${color}">${initials}</div>
      </div>

      <div class="result-info">
        <h2 class="result-style-name">${style.styleName}</h2>
        <p class="result-family-name">${style.styleFamily}</p>
      </div>

      <p class="result-description">${style.description}</p>
      ${variantNote}

      <div class="spec-table">
        <div class="spec-table-header">Barber Spec</div>
        ${rowsHtml}
      </div>
      ${style.upsellTag ? `<div class="upsell-banner">${style.upsellTag}</div>` : ""}
    `;

    // Image load/error handling
    const imgEl      = document.getElementById("resultImg");
    const fallbackEl = document.getElementById("resultImgFallback");

    function showFallback() {
      imgEl.style.display = "none";
      fallbackEl.style.display = "flex";
    }
    imgEl.addEventListener("error", showFallback);
    if (imgEl.complete && imgEl.naturalWidth === 0) showFallback();

    showScreen("results");

    // Persist to Supabase (fire-and-forget)
    const specRows = buildBarberSpec(style, refinements);
    window.PleromaDB.saveConsultation({
      styleId:     style.styleId,
      styleName:   style.styleName,
      styleFamily: style.styleFamily,
      texture:     refinements.texture    || null,
      skinTone:    refinements.skinTone   || null,
      fadeHeight:  refinements.fadeHeight || null,
      refinements: refinements,
      barberSpec:  specRows,
    }).then((id) => { _consultationId = id; });
  }

  // ─── Feedback screen ──────────────────────────────────────────────────────

  const feedbackChoicesEl = document.getElementById("feedbackChoices");

  function showFeedback() {
    feedbackChoicesEl.innerHTML = "";
    const ratings = [
      { label: "Exactly it", value: "100" },
      { label: "Pretty close", value: "80" },
      { label: "Somewhat", value: "60" },
      { label: "Not really", value: "40" },
    ];

    ratings.forEach((r) => {
      const btn = document.createElement("button");
      btn.className = "btn choice-btn";
      btn.textContent = r.label;
      btn.addEventListener("click", () => {
        window.PleromaDB.saveFeedback({
          consultationId: _consultationId || null,
          styleId:        _resultStyle ? _resultStyle.styleId   : "unknown",
          styleName:      _resultStyle ? _resultStyle.styleName : "unknown",
          texture:        refinements.texture    || null,
          skinTone:       _resultSkin            || null,
          fadeHeight:     _resultFade            || null,
          rating:         Number(r.value),
        });
        showScreen("landing");
      });
      feedbackChoicesEl.appendChild(btn);
    });

    showScreen("feedback");
  }

  // ─── Show Barber screen ───────────────────────────────────────────────────

  const barberSpecEl = document.getElementById("barberSpec");

  function showBarberScreen() {
    if (!_resultStyle) return;

    const specRows = buildBarberSpec(_resultStyle, refinements);
    const rowsHtml = specRows
      .map((row) => `
        <div class="spec-row">
          <span class="spec-label">${row.label}</span>
          <span class="spec-value">${row.value}</span>
        </div>`)
      .join("");

    const imgPath  = haircutImagePath(_resultStyle.styleId, _resultSkin, _resultFade);
    const color    = avatarColorFor(_resultStyle);
    const initials = initialsFor(_resultStyle);

    barberSpecEl.innerHTML = `
      <div class="result-image-wrap" style="max-width:240px;margin:0 auto 20px;">
        <img
          class="result-image"
          src="${imgPath}"
          alt="${_resultStyle.styleName}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        />
        <div class="result-img-fallback" style="background:${color}">${initials}</div>
      </div>
      <h2 style="text-align:center;font-size:24px;font-weight:800;margin:0 0 4px">${_resultStyle.styleName}</h2>
      <p style="text-align:center;color:var(--color-ink-soft);font-size:14px;margin:0 0 20px">${_resultStyle.styleFamily}</p>
      <div class="spec-table">${rowsHtml}</div>
      ${_resultStyle.upsellTag ? `<div class="upsell-banner" style="margin-top:14px">${_resultStyle.upsellTag}</div>` : ""}
    `;

    showScreen("barber");
  }

  // ─── Back navigation ──────────────────────────────────────────────────────

  function handleQuestionBack() {
    if (flowPhase === "texture") {
      if (textureHistory.length === 0) {
        showScreen("landing");
        return;
      }
      currentTextureId = textureHistory.pop();
      stepIndex = Math.max(1, stepIndex - 1);
      renderTextureQuestion();

    } else if (flowPhase === "skinTone") {
      if (textureHistory.length > 0) {
        currentTextureId = textureHistory.pop();
        resolvedTexture  = null;
        flowPhase        = "texture";
        stepIndex        = Math.max(1, textureHistory.length + 1);
        renderTextureQuestion();
      } else {
        showScreen("landing");
      }

    } else if (flowPhase === "family") {
      flowPhase = "skinTone";
      stepIndex = 3;
      renderSkinToneQuestion();

    } else if (flowPhase === "refinement") {
      if (refinementHistory.length === 0) {
        chosenFamilyId = null;
        refinements    = { texture: resolvedTexture, skinTone: refinements.skinTone };
        showFamilyPicker();
        return;
      }
      currentQuestionId = refinementHistory.pop();
      stepIndex = Math.max(5, stepIndex - 1);
      renderRefinementQuestion();
    }
  }

  function handleFamilyBack() {
    flowPhase = "skinTone";
    stepIndex = 3;
    renderSkinToneQuestion();
  }

  // ─── Event wiring ─────────────────────────────────────────────────────────

  document.getElementById("btnQuick").addEventListener("click", () => {
    showScreen("quick-grid");
  });

  document.getElementById("btnPersonalized").addEventListener("click", () => {
    startPersonalizedFlow();
  });

  document.getElementById("btnQuickBack").addEventListener("click", () => {
    showScreen("landing");
  });

  document.getElementById("btnDetailBack").addEventListener("click", () => {
    showScreen("quick-grid");
  });

  document.getElementById("btnQuestionBack").addEventListener("click", handleQuestionBack);
  document.getElementById("btnFamilyBack").addEventListener("click", handleFamilyBack);

  document.getElementById("btnStartOver").addEventListener("click", () => {
    showScreen("landing");
  });

  document.getElementById("btnShowBarber").addEventListener("click", () => {
    showBarberScreen();
  });

  document.getElementById("btnBarberBack").addEventListener("click", () => {
    showScreen("results");
  });

  document.getElementById("btnRateIt").addEventListener("click", () => {
    showFeedback();
  });

  document.getElementById("btnFeedbackSkip").addEventListener("click", () => {
    showScreen("landing");
  });

  document.getElementById("brandHome").addEventListener("click", () => {
    showScreen("landing");
  });

  // ─── Boot ─────────────────────────────────────────────────────────────────

  // Data bundled as window.PleromaHaircuts (haircuts-data.js) — works on
  // both file:// and http:// without a fetch() call.
  if (window.PleromaHaircuts && window.PleromaHaircuts.length) {
    HAIRCUTS = window.PleromaHaircuts;
    renderGrid();
  } else {
    // Fallback: try fetching (works when served over HTTP)
    fetch("data/haircuts.json")
      .then((res) => res.json())
      .then((data) => {
        HAIRCUTS = data;
        renderGrid();
      })
      .catch((err) => {
        console.error("Failed to load haircuts.json", err);
        haircutGridEl.innerHTML = `<p style="color:#b3432b">Could not load haircut catalog.</p>`;
      });
  }

  showScreen("landing");
})();
