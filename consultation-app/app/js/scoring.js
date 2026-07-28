/**
 * Pleroma — Selection engine (v2).
 *
 * Replaces the v1 additive point-scoring system. The family-first flow means
 * the client has already chosen a family and answered refinement questions;
 * this module's job is to:
 *
 *   1. selectStyle(catalog, familyId, texture, refinements)
 *      Find the one style in the catalog that matches the chosen family and
 *      any style-selecting refinement answers. If the family has only one
 *      style (or none of the refinement answers triggered a selectsStyle),
 *      the first matching family member compatible with the client's texture
 *      is returned.
 *
 *   2. buildBarberSpec(style, texture, refinements, questionMap)
 *      Turn the collected refinement answers into a human-readable barber
 *      spec: the style name, texture, and every recorded spec key/value in
 *      a clean label → value format, in the order the questions were asked.
 *
 * UMD wrapper: attaches PleromaScoring to window in the browser and exports
 * via module.exports in Node (for test/test-scoring.js).
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = mod;
  }
  if (typeof root !== "undefined") {
    root.PleromaScoring = mod;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  /**
   * Friendly display labels for refinement spec keys.
   * Keys not in this map are title-cased and displayed as-is.
   */
  const SPEC_LABELS = {
    texture: "Texture",
    length: "Top length",
    finish: "Finish",
    styling: "Styling",
    sides: "Sides & back",
    fadeHeight: "Fade height",
    hairline: "Hairline",
    neckline: "Neckline",
    part: "Part",
    partLine: "Part line",
    combDir: "Comb direction",
    topHeight: "Top height",
    lengthTrajectory: "Length today",
    backLength: "Back length",
  };

  /**
   * Return the first style in the catalog that belongs to the given family
   * and is compatible with the client's texture.
   *
   * @param {Object[]} catalog - haircuts.json array
   * @param {string}   familyId - e.g. "Buzz/Crew"
   * @param {string}   texture  - e.g. "Wavy"
   * @returns {Object|null}
   */
  function _firstFamilyMatch(catalog, familyId, texture) {
    return (
      catalog.find(
        (s) =>
          s.styleFamily === familyId &&
          Array.isArray(s.textures) &&
          s.textures.includes(texture)
      ) || null
    );
  }

  /**
   * Select the specific style based on family, texture, and refinement answers.
   *
   * The refinement flow may record a `selectedStyleId` when a choice has a
   * `selectsStyle` field. If it does, that style is returned (provided it also
   * matches the texture). Otherwise the first catalog match for the family +
   * texture is used as a fallback.
   *
   * @param {Object[]} catalog     - haircuts.json array
   * @param {string}   familyId    - chosen family id
   * @param {string}   texture     - resolved texture end-state
   * @param {Object}   refinements - { selectedStyleId?, texture, sides, ... }
   * @returns {Object|null} the matched style object, or null if nothing found
   */
  function selectStyle(catalog, familyId, texture, refinements) {
    // If a refinement question explicitly selected a style, use it.
    if (refinements.selectedStyleId) {
      const explicit = catalog.find(
        (s) => s.styleId === refinements.selectedStyleId
      );
      if (explicit) return explicit;
    }

    // Otherwise fall back to the first texture-compatible family member.
    return _firstFamilyMatch(catalog, familyId, texture);
  }

  /**
   * Build a human-readable barber spec from the collected answers.
   *
   * Returns an ordered array of { label, value } pairs — the UI can render
   * these however it likes (table rows, definition list, etc.).
   *
   * The `specOrder` array controls which keys appear and in what order.
   * Keys present in refinements but not in specOrder are appended at the end.
   *
   * @param {Object}   style       - the selected style object
   * @param {Object}   refinements - collected spec key/value pairs + selectedStyleId
   * @returns {{ label: string, value: string }[]}
   */
  function buildBarberSpec(style, refinements) {
    // Preferred display order for spec rows.
    const SPEC_ORDER = [
      "texture",
      "length",
      "finish",
      "styling",
      "sides",
      "fadeHeight",
      "hairline",
      "neckline",
      "part",
      "partLine",
      "combDir",
      "topHeight",
      "lengthTrajectory",
      "backLength",
    ];

    const rows = [];

    // Walk the preferred order first.
    for (const key of SPEC_ORDER) {
      if (Object.prototype.hasOwnProperty.call(refinements, key) && refinements[key]) {
        rows.push({
          label: SPEC_LABELS[key] || _titleCase(key),
          value: String(refinements[key]),
        });
      }
    }

    // Append any extra keys not covered by SPEC_ORDER.
    for (const key of Object.keys(refinements)) {
      if (key === "selectedStyleId") continue;
      if (SPEC_ORDER.includes(key)) continue;
      if (Object.prototype.hasOwnProperty.call(refinements, key) && refinements[key]) {
        rows.push({
          label: SPEC_LABELS[key] || _titleCase(key),
          value: String(refinements[key]),
        });
      }
    }

    return rows;
  }

  function _titleCase(str) {
    return str
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }

  return {
    selectStyle: selectStyle,
    buildBarberSpec: buildBarberSpec,
    // Expose internal for tests
    _firstFamilyMatch: _firstFamilyMatch,
  };
});
