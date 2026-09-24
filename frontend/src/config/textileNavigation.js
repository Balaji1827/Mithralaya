const leaf = (...values) =>
  values.reduce((tree, value) => ({ ...tree, [value]: null }), {});

const textileNavigation = {
  MEN: {
    Shirt: {
      'Full Sleeve': leaf('Plain', 'Checked', 'Printed', 'Striped', 'Denim', 'Party Wear', 'Casual', 'Formal'),
      'Half Sleeve': leaf('Plain', 'Checked', 'Printed', 'Striped', 'Denim', 'Party Wear', 'Casual', 'Formal')
    },
    'T-Shirt': leaf('Round Neck', 'Polo', 'V Neck', 'Oversized', 'Printed', 'Plain', 'Collar', 'Sports'),
    Pant: leaf('Formal Pant', 'Casual Pant', 'Chino', 'Cotton Pant', 'Stretch Pant', 'Cargo Pant'),
    Jeans: leaf('Slim Fit', 'Regular Fit', 'Skinny', 'Straight Fit', 'Relaxed Fit'),
    Trouser: leaf('Office', 'Casual', 'Stretch', 'Cotton'),
    Shorts: null,
    Jacket: null,
    Hoodie: null,
    Blazer: null,
    Innerwear: null,
    Socks: null,
    Vest: null,
    'Night Wear': null
  },
  WOMEN: {
    Saree: leaf('Cotton', 'Silk', 'Linen', 'Fancy', 'Designer'),
    Kurti: leaf('Cotton', 'Rayon', 'Printed', 'Embroidery', 'Party Wear'),
    'Churidar Set': null,
    Salwar: null,
    Leggings: null,
    Palazzo: null,
    Tops: leaf('Casual', 'Printed', 'Formal', 'Party Wear'),
    'T-Shirt': null,
    Jeans: null,
    Pant: null,
    Skirt: null,
    Gown: null,
    Nighty: null,
    Jacket: null,
    Dupatta: null,
    Innerwear: null,
    Shawl: null
  },
  KIDS: {
    Boys: leaf('Shirt', 'T-Shirt', 'Jeans', 'Pant', 'Shorts', 'Track Pant', 'Hoodie', 'Innerwear'),
    Girls: leaf('Frock', 'Top', 'Leggings', 'Skirt', 'Jeans', 'T-Shirt', 'Gown', 'Innerwear'),
    Baby: leaf('Romper', 'Jabla', 'Night Suit', 'T-Shirt', 'Pant', 'Cap', 'Socks')
  }
};

export default textileNavigation;
