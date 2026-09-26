// Auto-generated from quiz-data.json. Regenerate, do not hand-edit.
import type { StyleRecord } from "./build-request.ts";

const S = (id: string, slug: string, display: string, len: string,
           lenLabel: string, family: string, defaultSides: string,
           variations: string[]): StyleRecord =>
  ({ id, slug, display, len, lenLabel, family, defaultSides,
     imageDir: `${id}-${slug}`, variations });

export const STYLES: StyleRecord[] = [
  S("01","buzz-cut","Buzz Cut","very-short","Very short","Buzz/Crew","low-taper",["guard-1","guard-2","guard-3","with-taper"]),
  S("02","flat-top","Flat Top","very-short","Very short","Flat Top","high-fade",["classic","high-boxy","tapered"]),
  S("03","crew-cut","Crew Cut","short","Short","Buzz/Crew","mid-fade",["classic","textured-top","longer-top","with-fade"]),
  S("04","caesar","Caesar","short","Short","Buzz/Crew","low-fade",["classic","textured","short-fringe"]),
  S("05","textured-crop","Textured Crop","short","Short","Crop","mid-fade",["short","medium","heavy-fringe","messy"]),
  S("06","edgar-cut","Edgar Cut","short","Short","Edgar Cut","high-fade",["classic-blunt","textured","high-contrast"]),
  S("07","fauxhawk","Fauxhawk","short","Short","Mohawk","mid-fade",["subtle","textured","high-contrast"]),
  S("08","quiff","Quiff","medium","Medium","Quiff","mid-fade",["classic","textured","high-volume","low-key"]),
  S("09","slick-back","Slick Back","medium","Medium","Slick Back","mid-fade",["sleek-classic","textured","undercut","longer"]),
  S("10","classic-pompadour","Classic Pompadour","medium","Medium","Pompadour","low-fade",["classic","high-volume","tapered"]),
  S("11","modern-pompadour","Modern Pompadour","medium","Medium","Pompadour","high-fade",["with-fade","textured","sleek"]),
  S("12","classic-mens","Classic Mens","medium","Medium","Classic Mens","low-taper",["short","medium","side-part"]),
  S("13","comb-over","Comb Over","medium","Medium","Comb Over","low-taper",["classic","side-part","textured"]),
  S("14","comb-over-fade","Comb Over Fade","medium","Medium","Comb Over","mid-fade",["low-fade","mid-fade","high-fade"]),
  S("15","curtains","Curtains / Middle Part","medium","Medium","Curtains","natural",["short","medium","long","textured"]),
  S("16","curly-afro","Curly Afro","medium","Medium","Afro/Textured","natural",["short","medium","high-volume","tapered"]),
  S("17","afro-fade","Afro Fade","medium","Medium","Afro/Textured","mid-fade",["low","mid","high","temple-fade"]),
  S("18","mohawk","Mohawk","medium","Medium","Mohawk","high-fade",["classic","wide","narrow"]),
  S("19","modern-mullet","Modern Mullet","medium-long","Medium-long","Mullet","mid-fade",["subtle","classic-modern","extreme"]),
  S("20","classic-mullet","Classic Mullet","long","Long","Mullet","natural",["classic","textured","long"]),
  S("21","wolf-cut","Wolf Cut","long","Long","Wolf Cut","natural",["short","medium","long","heavy-layers"]),
];
