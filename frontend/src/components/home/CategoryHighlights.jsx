import React from 'react';
import { Link } from 'react-router-dom';
import '../../css/categoryHighlights.css';
import { churidar, sarees } from '../../assets';


// ⚠️ Replace these with your own product/lifestyle photography — these are
// placeholder paths only. Square images work best since they get cropped
// into circles via CSS.
const CATEGORIES = [
  {
    label: 'Trending Now',
    image: {sarees},
    link: '/products?trending=true'
  },
  {
    label: 'New Arrival',
  image: {churidar},
    link: '/products?new=true'
  },
  {
    label: 'T-Shirt',
    image: '/images/category-tshirt.jpg',
    link: '/products?category=t-shirts'
  },
  {
    label: 'Shirt',
    image: '/images/category-shirt.jpg',
    link: '/products?category=shirt'
  },
  {
    label: 'Bottoms',
    // ⚠️ No single "Bottoms" category exists in your HEADER_CATEGORIES list
    // (it's split into Jeans / Trousers / Cargo Pants / Shorts / Knitted
    // Bottom Wear) — this links to Trousers as the closest match. Point it
    // at whichever makes more sense, or change it to a specific subcategory.
    image: '/images/category-bottoms.jpg',
    link: '/products?category=trousers'
  }
];

const CategoryHighlights = () => (
  <section className="chl-section">
    <div className="chl-row">
      {CATEGORIES.map((cat) => (
        <Link to={cat.link} className="chl-item" key={cat.label}>
          <span className="chl-circle">
            <img src={cat.image} alt={cat.label} />
          </span>
          <span className="chl-label">{cat.label}</span>
        </Link>
      ))}
    </div>
  </section>
);

export default CategoryHighlights;
