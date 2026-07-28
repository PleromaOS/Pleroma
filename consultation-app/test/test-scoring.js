/**
 * Pleroma — Selection engine tests (v2).
 *
 * Tests the new selectStyle() and buildBarberSpec() APIs against
 * representative family + texture + refinement combinations.
 *
 * Run with: node test/test-scoring.js
 */
"use strict";

const fs    = require("fs");
const path  = require("path");
const assert = require("assert");

// Load modules
const scoring  = require("../app/js/scoring.js");
const catalog  = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../app/data/haircuts.json"), "utf8")
);

// ── Basic catalog sanity ────────────────────────────────────────────────────

assert.strictEqual(catalog.length, 17, `Expected 17 styles, got ${catalog.length}`);

const familyIds = [...new Set(catalog.map((s) => s.styleFamily))];
assert.strictEqual(familyIds.length, 10, `Expected 10 families, got ${familyIds.length}: ${familyIds}`);

catalog.forEach((s) => {
  assert.ok(Array.isArray(s.textures) && s.textures.length > 0,
    `${s.styleId} ${s.styleName} must have at least one texture`);
  assert.ok(s.textures.every((t) => ["Straight","Wavy","Curly","Coily"].includes(t)),
    `${s.styleId} has an invalid texture value`);
});

console.log(`✓ Catalog: ${catalog.length} styles across ${familyIds.length} families`);

// ── Helpers ─────────────────────────────────────────────────────────────────

function run(title, familyId, texture, refinements) {
  const style = scoring.selectStyle(catalog, familyId, texture, refinements);
  const spec  = style ? scoring.buildBarberSpec(style, refinements) : [];

  console.log(`\n=== ${title} ===`);
  console.log(`  family: ${familyId}  texture: ${texture}`);
  console.log(`  refinements: ${JSON.stringify(refinements)}`);
  if (style) {
    console.log(`  → ${style.styleName} (${style.styleId})`);
    spec.forEach((r) => console.log(`     ${r.label}: ${r.value}`));
  } else {
    console.log("  → no match");
  }
  return { style, spec };
}

// ── Test 1: Buzz Cut selection ──────────────────────────────────────────────

{
  const { style, spec } = run(
    "Buzz/Crew — Wavy, all-over buzz selected",
    "Buzz/Crew",
    "Wavy",
    {
      texture: "Wavy",
      selectedStyleId: "HC-001",
      length: "All-over buzz",
      sides: "Fade",
      fadeHeight: "Low/mid",
      hairline: "Defined",
    }
  );
  assert.ok(style, "Should find a style");
  assert.strictEqual(style.styleId, "HC-001", "Should be Buzz Cut");
  assert.ok(spec.length > 0, "Spec should have rows");
  assert.ok(spec.some((r) => r.label === "Texture" && r.value === "Wavy"), "Texture row should appear");
  assert.ok(spec.some((r) => r.label === "Sides & back"), "Sides row should appear");
  console.log("  ✓ passed");
}

// ── Test 2: Crew Cut fallback (no explicit selectsStyle) ────────────────────

{
  const { style } = run(
    "Buzz/Crew — Straight, no explicit selection (fallback to first match)",
    "Buzz/Crew",
    "Straight",
    { texture: "Straight", sides: "Taper", hairline: "Natural" }
  );
  assert.ok(style, "Should find a style");
  assert.strictEqual(style.styleFamily, "Buzz/Crew");
  assert.ok(style.textures.includes("Straight"), "Style must support Straight texture");
  console.log("  ✓ passed");
}

// ── Test 3: Caesar Cut via explicit selection ────────────────────────────────

{
  const { style } = run(
    "Buzz/Crew — Curly, Caesar selected",
    "Buzz/Crew",
    "Curly",
    { texture: "Curly", selectedStyleId: "HC-003", sides: "Fade", fadeHeight: "High/skin", hairline: "Defined" }
  );
  assert.ok(style, "Should find a style");
  assert.strictEqual(style.styleId, "HC-003", "Should be Caesar Cut");
  console.log("  ✓ passed");
}

// ── Test 4: Crop with Natural Curl finish (Coily) ───────────────────────────

{
  const { style, spec } = run(
    "Crop — Coily, Natural Curl finish",
    "Crop",
    "Coily",
    { texture: "Coily", finish: "Natural Curl", sides: "Fade", fadeHeight: "Low/mid", hairline: "Natural" }
  );
  assert.ok(style, "Should find a style");
  assert.strictEqual(style.styleFamily, "Crop");
  assert.ok(style.textures.includes("Coily"), "Crop must support Coily");
  assert.ok(spec.some((r) => r.label === "Finish" && r.value === "Natural Curl"));
  console.log("  ✓ passed");
}

// ── Test 5: Modern Pompadour selected by contrast question ──────────────────

{
  const { style } = run(
    "Pompadour — Wavy, modern (fade) selected",
    "Pompadour",
    "Wavy",
    { texture: "Wavy", selectedStyleId: "HC-006", sides: "Fade", fadeHeight: "High/skin", part: "None", lengthTrajectory: "Maintain" }
  );
  assert.ok(style);
  assert.strictEqual(style.styleId, "HC-006", "Should be Modern Pompadour");
  console.log("  ✓ passed");
}

// ── Test 6: Classic Pompadour selected ──────────────────────────────────────

{
  const { style } = run(
    "Pompadour — Straight, classic (taper) selected",
    "Pompadour",
    "Straight",
    { texture: "Straight", selectedStyleId: "HC-005", sides: "Taper", part: "Side", lengthTrajectory: "Cut shorter" }
  );
  assert.ok(style);
  assert.strictEqual(style.styleId, "HC-005", "Should be Classic Pompadour");
  console.log("  ✓ passed");
}

// ── Test 7: Classic Men's Haircut with styling variant ──────────────────────

{
  const { style, spec } = run(
    "Classic Men's Haircut — Straight, Blowdried",
    "Classic Men's Haircut",
    "Straight",
    { texture: "Straight", styling: "Blowdried", sides: "Fade", fadeHeight: "Low/mid", neckline: "Squared" }
  );
  assert.ok(style);
  assert.strictEqual(style.styleFamily, "Classic Men's Haircut");
  assert.ok(style.textures.includes("Straight"));
  assert.ok(spec.some((r) => r.label === "Styling" && r.value === "Blowdried"));
  console.log("  ✓ passed");
}

// ── Test 8: Comb Over Fade selected ─────────────────────────────────────────

{
  const { style } = run(
    "Comb Over — Wavy, faded (HC-009 selected)",
    "Comb Over",
    "Wavy",
    { texture: "Wavy", selectedStyleId: "HC-009", sides: "Fade", fadeHeight: "Low/mid", partLine: "Hard", combDir: "Left-to-right" }
  );
  assert.ok(style);
  assert.strictEqual(style.styleId, "HC-009");
  console.log("  ✓ passed");
}

// ── Test 9: Flat Top — Coily only ───────────────────────────────────────────

{
  const { style } = run(
    "Flat Top — Coily",
    "Flat Top",
    "Coily",
    { texture: "Coily", topHeight: "High", hairline: "Sharp", sides: "Fade", fadeHeight: "High/skin" }
  );
  assert.ok(style);
  assert.strictEqual(style.styleId, "HC-010");
  console.log("  ✓ passed");
}

// ── Test 10: Flat Top texture guard — should NOT match Straight ─────────────

{
  const { style } = run(
    "Flat Top — Straight (should not match)",
    "Flat Top",
    "Straight",
    { texture: "Straight" }
  );
  assert.strictEqual(style, null, "Flat Top should not match Straight texture");
  console.log("  ✓ passed (correctly returned null)");
}

// ── Test 11: Mohawk vs Fauxhawk ──────────────────────────────────────────────

{
  const r1 = run("Mohawk — Straight, full hawk", "Mohawk", "Straight",
    { texture: "Straight", selectedStyleId: "HC-011", sides: "Shaved to skin", neckline: "V-shape" });
  assert.strictEqual(r1.style.styleId, "HC-011");

  const r2 = run("Mohawk — Curly, fauxhawk", "Mohawk", "Curly",
    { texture: "Curly", selectedStyleId: "HC-012", neckline: "Squared" });
  assert.strictEqual(r2.style.styleId, "HC-012");
  console.log("  ✓ both passed");
}

// ── Test 12: Afro/Textured — natural vs fade ─────────────────────────────────

{
  const r1 = run("Afro/Textured — Coily, natural", "Afro/Textured", "Coily",
    { texture: "Coily", selectedStyleId: "HC-013", sides: "Natural" });
  assert.strictEqual(r1.style.styleId, "HC-013");

  const r2 = run("Afro/Textured — Curly, fade", "Afro/Textured", "Curly",
    { texture: "Curly", selectedStyleId: "HC-014", sides: "Fade", fadeHeight: "High/skin" });
  assert.strictEqual(r2.style.styleId, "HC-014");
  console.log("  ✓ both passed");
}

// ── Test 13: Mullet — modern vs classic ──────────────────────────────────────

{
  const r1 = run("Mullet — Curly, modern", "Mullet", "Curly",
    { texture: "Curly", selectedStyleId: "HC-015", sides: "Fade", backLength: "Long" });
  assert.strictEqual(r1.style.styleId, "HC-015");

  const r2 = run("Mullet — Straight, classic", "Mullet", "Straight",
    { texture: "Straight", selectedStyleId: "HC-016", sides: "Natural", backLength: "Short" });
  assert.strictEqual(r2.style.styleId, "HC-016");
  console.log("  ✓ both passed");
}

// ── Test 14: Fringe ───────────────────────────────────────────────────────────

{
  const { style, spec } = run(
    "Fringe — Wavy",
    "Fringe",
    "Wavy",
    { texture: "Wavy", hairline: "Defined", sides: "Fade", fadeHeight: "Low/mid" }
  );
  assert.ok(style);
  assert.strictEqual(style.styleId, "HC-017");
  assert.ok(spec.some((r) => r.label === "Hairline" && r.value === "Defined"));
  console.log("  ✓ passed");
}

// ── Test 15: Spec row ordering ────────────────────────────────────────────────

{
  const style = catalog.find((s) => s.styleId === "HC-002"); // Crew Cut
  const refinements = {
    texture: "Wavy",
    sides: "Fade",
    fadeHeight: "Low/mid",
    hairline: "Natural",
    length: "Short",
  };
  const spec = scoring.buildBarberSpec(style, refinements);

  // texture should come before sides, sides before fadeHeight
  const keys = spec.map((r) => r.label);
  const texIdx    = keys.indexOf("Texture");
  const sidesIdx  = keys.indexOf("Sides & back");
  const fadeIdx   = keys.indexOf("Fade height");
  assert.ok(texIdx < sidesIdx, "Texture should precede Sides in spec");
  assert.ok(sidesIdx < fadeIdx, "Sides should precede Fade height in spec");
  console.log("  ✓ spec ordering correct");
}

// ─────────────────────────────────────────────────────────────────────────────

console.log("\n✓ All tests passed.");
