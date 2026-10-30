/* Glass Pattern Studio v0.3 — glass catalog used for color matching.
   Three families, the way glass is sold: Cathedral (transparent, colour seen with light behind it), Opalescent (milky / opaque) and
   Streaky-Wispy (two colours swirled in one sheet; the swatch is the sheet's overall look, the 2nd colour is the streak).
   Codes are this app's own catalog numbers (C-, O-, S-), NOT manufacturer SKUs; RGB values are approximate "on a light table" colours
   compiled for matching, so check the real sheet before buying. Format: [code, name, family, r, g, b, streak?] */
const GLASS_FAMILIES = { C: 'Cathedral', O: 'Opalescent', S: 'Streaky' };
const GLASS_CATALOG = [
  // ---- Cathedral (transparent) ----
  ['C-100', 'Clear', 'C', 236, 238, 234], ['C-101', 'Clear seedy', 'C', 222, 230, 226], ['C-102', 'Crystal ice', 'C', 214, 228, 234],
  ['C-110', 'Pale yellow', 'C', 246, 236, 150], ['C-111', 'Lemon', 'C', 245, 222, 60], ['C-112', 'Gold', 'C', 236, 186, 30],
  ['C-120', 'Light amber', 'C', 228, 172, 84], ['C-121', 'Medium amber', 'C', 196, 120, 40], ['C-122', 'Dark amber', 'C', 140, 82, 30], ['C-123', 'Root beer', 'C', 92, 52, 26],
  ['C-130', 'Orange', 'C', 238, 120, 30], ['C-131', 'Pumpkin', 'C', 214, 92, 30], ['C-132', 'Flame red', 'C', 222, 66, 36],
  ['C-140', 'Cherry red', 'C', 200, 30, 40], ['C-141', 'Ruby red', 'C', 158, 20, 36], ['C-142', 'Garnet', 'C', 106, 20, 34],
  ['C-150', 'Pink', 'C', 236, 152, 172], ['C-151', 'Rose', 'C', 200, 92, 120], ['C-152', 'Cranberry', 'C', 148, 40, 80], ['C-153', 'Magenta', 'C', 180, 40, 120],
  ['C-160', 'Lavender', 'C', 182, 162, 214], ['C-161', 'Violet', 'C', 120, 80, 170], ['C-162', 'Purple', 'C', 86, 40, 120], ['C-163', 'Plum', 'C', 78, 30, 68],
  ['C-170', 'Pale blue', 'C', 186, 214, 238], ['C-171', 'Sky blue', 'C', 120, 178, 226], ['C-172', 'Medium blue', 'C', 50, 104, 192], ['C-173', 'Cobalt blue', 'C', 30, 50, 150],
  ['C-174', 'Sapphire', 'C', 24, 70, 140], ['C-175', 'Navy', 'C', 22, 30, 82], ['C-176', 'Steel blue', 'C', 96, 130, 160],
  ['C-180', 'Aqua', 'C', 120, 204, 212], ['C-181', 'Turquoise', 'C', 40, 170, 180], ['C-182', 'Teal', 'C', 26, 128, 134], ['C-183', 'Peacock', 'C', 16, 96, 110],
  ['C-190', 'Pale green', 'C', 196, 226, 170], ['C-191', 'Spring green', 'C', 120, 190, 80], ['C-192', 'Grass green', 'C', 70, 150, 60], ['C-193', 'Emerald', 'C', 20, 124, 70],
  ['C-194', 'Moss green', 'C', 96, 120, 50], ['C-195', 'Olive', 'C', 120, 124, 50], ['C-196', 'Forest green', 'C', 26, 74, 40], ['C-197', 'Sea green', 'C', 70, 150, 120],
  ['C-200', 'Light gray', 'C', 176, 180, 182], ['C-201', 'Medium gray', 'C', 124, 126, 128], ['C-202', 'Smoke', 'C', 94, 94, 96], ['C-203', 'Charcoal', 'C', 60, 62, 66],
  ['C-210', 'Champagne', 'C', 226, 198, 170], ['C-211', 'Light bronze', 'C', 170, 140, 110], ['C-212', 'Bronze', 'C', 120, 96, 72], ['C-213', 'Brown', 'C', 110, 68, 38], ['C-214', 'Taupe', 'C', 150, 132, 118],
  // ---- Opalescent (opaque / milky) ----
  ['O-300', 'White opal', 'O', 246, 244, 236], ['O-301', 'Ivory opal', 'O', 240, 230, 200], ['O-302', 'Cream opal', 'O', 236, 220, 176], ['O-303', 'Pearl gray opal', 'O', 206, 206, 202],
  ['O-304', 'Gray opal', 'O', 150, 150, 148], ['O-305', 'Black opal', 'O', 22, 22, 24],
  ['O-310', 'Flesh pink opal', 'O', 236, 192, 176], ['O-311', 'Peach opal', 'O', 242, 186, 140], ['O-312', 'Tan opal', 'O', 200, 166, 124], ['O-313', 'Caramel opal', 'O', 176, 120, 70],
  ['O-314', 'Chocolate opal', 'O', 86, 52, 32], ['O-315', 'Sandstone opal', 'O', 214, 190, 150], ['O-316', 'Auburn opal', 'O', 150, 72, 40],
  ['O-320', 'Butter yellow opal', 'O', 246, 224, 120], ['O-321', 'Sunflower opal', 'O', 244, 196, 40], ['O-322', 'Tangerine opal', 'O', 240, 140, 50], ['O-323', 'Coral opal', 'O', 236, 120, 100],
  ['O-324', 'Red opal', 'O', 196, 40, 40], ['O-325', 'Burgundy opal', 'O', 120, 30, 40],
  ['O-330', 'Pink opal', 'O', 240, 172, 190], ['O-331', 'Mauve opal', 'O', 186, 140, 160], ['O-332', 'Lilac opal', 'O', 196, 178, 214], ['O-333', 'Purple opal', 'O', 110, 70, 140],
  ['O-340', 'Powder blue opal', 'O', 176, 206, 230], ['O-341', 'Sky blue opal', 'O', 120, 170, 214], ['O-342', 'Cornflower opal', 'O', 90, 120, 200], ['O-343', 'Royal blue opal', 'O', 40, 70, 160], ['O-344', 'Navy opal', 'O', 30, 40, 90],
  ['O-350', 'Turquoise opal', 'O', 64, 186, 190], ['O-351', 'Teal opal', 'O', 30, 120, 120], ['O-352', 'Mint opal', 'O', 170, 220, 190],
  ['O-360', 'Sage opal', 'O', 150, 170, 120], ['O-361', 'Leaf green opal', 'O', 96, 160, 70], ['O-362', 'Kelly green opal', 'O', 30, 140, 70], ['O-363', 'Hunter green opal', 'O', 30, 80, 50], ['O-364', 'Olive opal', 'O', 120, 120, 60],
  // ---- Streaky / wispy (two colours in one sheet) ----
  ['S-400', 'White wispy on clear', 'S', 232, 234, 228, [255, 255, 255]], ['S-401', 'Cloud gray streaky', 'S', 200, 204, 208, [240, 240, 240]], ['S-402', 'Black & white streaky', 'S', 120, 120, 120, [235, 235, 235]],
  ['S-410', 'Amber & white streaky', 'S', 220, 170, 100, [245, 235, 210]], ['S-411', 'Woodgrain brown streaky', 'S', 140, 90, 50, [200, 140, 70]], ['S-412', 'Fleshtone wispy', 'S', 232, 190, 160, [250, 230, 215]],
  ['S-420', 'Red-orange streaky', 'S', 220, 90, 40, [245, 170, 40]], ['S-421', 'Sunset streaky', 'S', 238, 150, 90, [240, 110, 130]], ['S-422', 'Pink & white wispy', 'S', 240, 190, 200, [255, 245, 245]],
  ['S-430', 'Purple & white streaky', 'S', 160, 130, 190, [235, 225, 240]], ['S-440', 'Sky streaky (blue/white)', 'S', 150, 190, 230, [240, 245, 250]], ['S-441', 'Deep blue streaky', 'S', 50, 80, 160, [110, 150, 210]],
  ['S-442', 'Water streaky (teal/blue)', 'S', 50, 140, 170, [40, 90, 160]], ['S-450', 'Green & white wispy', 'S', 170, 210, 160, [240, 248, 236]], ['S-451', 'Leaf streaky (green/amber)', 'S', 120, 140, 60, [190, 150, 50]],
];
if (typeof module !== 'undefined' && module.exports) module.exports = { GLASS_CATALOG, GLASS_FAMILIES };
