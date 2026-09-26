// The style catalogue and its photos.
//
// This is the one thing the app reads straight from the database instead of
// through a door, because it is public: the same 21 styles for everyone, no
// personal data. The database allows strangers to read exactly these two
// tables and nothing else.

import { IS_DEMO, PUBLISHABLE_KEY, SUPABASE_URL } from "../config";

export type Style = {
  id: string;
  display: string;
  len: string;
  maintenance: "Low" | "Medium" | "High" | "Variable";
  textures: string[];
  photo: string | null; // best reference photo for the client's texture, if we have one
};

type StyleRow = Omit<Style, "photo">;
type RefRow = { style_id: string; texture: string | null; storage_path: string };

const headers = { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}` };
const photoUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/style-library/${encodeURI(path)}`;

// Only styles that work on this texture are offered (the texture hard filter).
// Each gets the photo of that style on that texture if one has been checked,
// otherwise any checked photo of the style, otherwise none.
export async function stylesFor(texture: string): Promise<Style[]> {
  const [styles, refs] = IS_DEMO ? [DEMO_STYLES, [] as RefRow[]] : await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/styles?select=id,display,len,maintenance,textures&order=id`, { headers })
      .then((r) => r.json() as Promise<StyleRow[]>),
    fetch(`${SUPABASE_URL}/rest/v1/style_references?select=style_id,texture,storage_path&verified=eq.true`, { headers })
      .then((r) => r.json() as Promise<RefRow[]>),
  ]);

  return styles
    .filter((s) => s.textures.includes(texture))
    .map((s) => {
      const same = refs.find((r) => r.style_id === s.id && r.texture === texture);
      const any = refs.find((r) => r.style_id === s.id);
      const pick = same ?? any;
      return { ...s, photo: pick ? photoUrl(pick.storage_path) : null };
    });
}

// Used only in demo mode. The live app always reads the database.
const DEMO_STYLES: StyleRow[] = [
  ["01", "Buzz Cut", "very-short", "Low", "straight-fine,straight-coarse,wavy,curly,coily"],
  ["02", "Flat Top", "very-short", "High", "straight-fine,straight-coarse,wavy,curly,coily"],
  ["03", "Crew Cut", "short", "Low", "straight-fine,straight-coarse,wavy,curly,coily"],
  ["04", "Caesar", "short", "Low", "straight-fine,straight-coarse,wavy,curly"],
  ["05", "Textured Crop", "short", "Medium", "straight-fine,straight-coarse,wavy,curly,coily"],
  ["06", "Edgar Cut", "short", "Medium", "straight-fine,straight-coarse,wavy,curly,coily"],
  ["07", "Fauxhawk", "short", "Medium", "straight-fine,straight-coarse,wavy,curly"],
  ["08", "Quiff", "medium", "High", "straight-fine,straight-coarse,wavy"],
  ["09", "Slick Back", "medium", "High", "straight-fine,straight-coarse,wavy"],
  ["10", "Classic Pompadour", "medium", "High", "straight-fine,straight-coarse,wavy"],
  ["11", "Modern Pompadour", "medium", "High", "straight-fine,straight-coarse,wavy"],
  ["12", "Classic Mens", "medium", "Low", "straight-fine,straight-coarse,wavy,curly"],
  ["13", "Comb Over", "medium", "Medium", "straight-fine,straight-coarse,wavy"],
  ["14", "Comb Over Fade", "medium", "Medium", "straight-fine,straight-coarse,wavy"],
  ["15", "Curtains / Middle Part", "medium", "Medium", "straight-fine,straight-coarse,wavy,curly"],
  ["16", "Curly Afro", "medium", "Medium", "curly,coily"],
  ["17", "Afro Fade", "medium", "Medium", "curly,coily"],
  ["18", "Mohawk", "medium", "High", "straight-fine,straight-coarse,wavy,curly,coily"],
  ["19", "Modern Mullet", "medium-long", "Medium", "straight-fine,straight-coarse,wavy,curly"],
  ["20", "Classic Mullet", "long", "Medium", "straight-fine,straight-coarse,wavy"],
  ["21", "Wolf Cut", "long", "High", "straight-fine,straight-coarse,wavy,curly"],
].map(([id, display, len, maintenance, t]) => ({
  id, display, len, maintenance: maintenance as StyleRow["maintenance"], textures: t.split(","),
}));
