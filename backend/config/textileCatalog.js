const leaf = (...values) => values.reduce((tree, value) => ({ ...tree, [value]: null }), {});

const textileCategoryTree = {
  WOMEN: {
    Saree: {
      'Pattu Sarees': leaf(
        'Kanjivarm Pattu',
        'Arani Pattu',
        'Banarasi Pattu',
        'Venkatagiri Pattu',
        'Mangala Giri Pattu',
        'Narayanpet Pattu'
      ),
      'Cotton Sarees': leaf(
        'All-over Printed',
        'Plain Saree',
        'Stripes Saree',
        'Paisley Saree',
        'Elampillai Saree',
        'Pochampalli Saree',
        'Kalamkari Saree',
        'Chettinadu Saree'
      ),
      'Silk Sarees': leaf('Mysore Silk', 'Kanchipuram Silk', 'Dola Silk', 'Tussar Silk'),
      'Fancy Sarees': leaf(
        'Chiffon Saree',
        'Bomkai Saree',
        'Gadwal Saree',
        'Katan Saree',
        'Leheriya Saree',
        'Georgette Saree',
        'Patola Saree'
      ),
      '100% Polyester Sarees': leaf('Printed', 'Plain', 'Paisley Print', 'Stripes'),
      // NOTE: your screenshot was cropped right after "Stripes" for this row —
      // if there were more items below it, add them here.
      '100% Rayon / Viscose Sarees': leaf('Printed', 'Plain', 'Stripes')
    },
    Kurti: leaf('Cotton', 'Rayon', 'Printed', 'Embroidery'),
    'Churidar Set': leaf('Alia Cut', 'Churidar Set', 'Anarkali Set', 'Sharara Set', 'Gowns'),
    'Short Tops': leaf('Casual', 'Printed', 'Formal', 'Party Wear'),
    'T-Shirt': leaf('Round Neck', 'V Neck', 'Collar', 'Full Hand Sleeved'),
    Bottoms: leaf('Leggins', 'Elephant Pants', 'Palazzo', 'Skirt', 'Pants', 'Jeans'),
    Nightwears: leaf('Nighty', 'Night Suits', 'Pyjama Set', 'Short Sets'),

  },
  KIDS: {
    Boys: leaf('Shirt', 'T-Shirt', 'Jeans', 'Pant', 'Shorts', 'Track Pant', 'Hoodie', 'Innerwear'),
    Girls: leaf('Frock', 'Top', 'Leggings', 'Skirt', 'Jeans', 'T-Shirt', 'Gown', 'Innerwear'),
    Baby: leaf('Romper', 'Jabla', 'Night Suit', 'T-Shirt', 'Pant', 'Cap', 'Socks')
  }
};

const materials = [
  'Cotton', 'Linen', 'Rayon', 'Polyester', 'Poly Cotton', 'Denim',
  'Lycra', 'Viscose', 'Silk', 'Wool', 'Satin', 'Blended Fabric'
];

const colors = [
  'Black', 'White', 'Blue', 'Navy Blue', 'Sky Blue', 'Grey', 'Dark Grey',
  'Brown', 'Coffee', 'Green', 'Olive', 'Maroon', 'Wine', 'Red', 'Pink',
  'Purple', 'Yellow', 'Orange', 'Cream', 'Beige'
];

const sizeRules = {
  WOMEN_ALPHA: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  WOMEN_NUMERIC: ['28', '30', '32', '34', '36', '38', '40', '42'],
  KIDS: ['0-3M', '3-6M', '6-12M', '1Y', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '11Y', '12Y', '13Y', '14Y', '15Y', '16Y']
};

const explicitCodes = {
  'T-Shirt': 'TSHIRT',
  'Party Wear': 'PTY',
  Printed: 'PRT',
  Embroidery: 'EMB',
  Cotton: 'COT',
  Linen: 'LIN',
  Rayon: 'RAY',
  Polyester: 'POL',
  'Poly Cotton': 'PC',
  Denim: 'DEN',
  Lycra: 'LYC',
  Viscose: 'VIS',
  Silk: 'SLK',
  Wool: 'WOL',
  Satin: 'SAT',
  'Blended Fabric': 'BLD',
  Black: 'BLK',
  White: 'WHT',
  Blue: 'BLU',
  'Navy Blue': 'NVY',
  'Sky Blue': 'SKY',
  Grey: 'GRY',
  'Dark Grey': 'DGY',
  Brown: 'BRN',
  Coffee: 'COF',
  Green: 'GRN',
  Olive: 'OLV',
  Maroon: 'MRN',
  Wine: 'WIN',
  Red: 'RED',
  Pink: 'PNK',
  Purple: 'PUR',
  Yellow: 'YLW',
  Orange: 'ORG',
  Cream: 'CRM',
  Beige: 'BEI',
  'Churidar Set': 'CHDST',
  'Umbrella Set / Anarkali Set': 'UMBST',
  'Sharara Set': 'SHRST',
  'Alia Cut': 'ALIA',
  'Round Neck': 'RNK',
  'V Neck': 'VNK',
  Collar: 'COL',
  'Full Hand Sleeved': 'FHSL',
  Bottoms: 'BTM',
  Leggins: 'LGN',
  'Elephant Pants': 'ELPNT',
  Pants: 'PNT',
  Nightwears: 'NGWR',
  'Night Suits': 'NGST',
  'Pyjama Set': 'PYST',
  'Short Sets': 'SHST',
  'Short Tops': 'STOP',

  // ---- Sarees (new) ----
  'Pattu Sarees': 'PATTU',
  'Cotton Sarees': 'COTSR',
  'Silk Sarees': 'SLKSR',
  'Fancy Sarees': 'FCYSR',
  '100% Polyester Sarees': 'POLSR',
  '100% Rayon / Viscose Sarees': 'RAYSR',

  'Kanjivarm Pattu': 'KANJI',
  'Arani Pattu': 'ARANI',
  'Banarasi Pattu': 'BANAR',
  'Venkatagiri Pattu': 'VENKT',
  'Mangala Giri Pattu': 'MNGGR',
  'Narayanpet Pattu': 'NARYP',

  'All-over Printed': 'ALPRT',
  'Plain Saree': 'PLNSR',
  'Stripes Saree': 'STRSR',
  'Paisley Saree': 'PSYSR',
  'Elampillai Saree': 'ELAMP',
  'Pochampalli Saree': 'POCHM',
  'Kalamkari Saree': 'KALAM',
  'Chettinadu Saree': 'CHETT',

  'Mysore Silk': 'MYSLK',
  'Kanchipuram Silk': 'KNCSLK',
  'Dola Silk': 'DOLSLK',
  'Tussar Silk': 'TUSSLK',

  'Chiffon Saree': 'CHIFF',
  'Bomkai Saree': 'BOMKAI',
  'Gadwal Saree': 'GADWAL',
  'Katan Saree': 'KATAN',
  'Leheriya Saree': 'LEHER',
  'Georgette Saree': 'GEORG',
  'Patola Saree': 'PATOLA',

  'Paisley Print': 'PSYPRT',
  Plain: 'PLN',
  Stripes: 'STRP'
};

const codeFor = (value, fallbackLength = 4) => {
  if (!value) return '';
  if (explicitCodes[value]) return explicitCodes[value];
  return String(value).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, fallbackLength);
};

const getSizeOptions = ({ category, subCategory, productType }) => {
  if (category === 'KIDS') return sizeRules.KIDS;

  // WOMEN (default): bottoms -> numeric sizes, else alpha sizes
  const numericTypes = ['Jeans', 'Pant', 'Leggings', 'Palazzo', 'Skirt', 'Bottoms'];
  return numericTypes.includes(subCategory) || numericTypes.includes(productType)
    ? sizeRules.WOMEN_NUMERIC
    : sizeRules.WOMEN_ALPHA;
};

module.exports = {
  textileCategoryTree,
  materials,
  colors,
  sizeRules,
  explicitCodes,
  codeFor,
  getSizeOptions
};