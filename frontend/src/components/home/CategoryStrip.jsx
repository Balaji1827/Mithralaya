import React from "react";
import { Link } from "react-router-dom";
import "../../css/home.css";
import {
  sarees,
  churidar,
  kurtis,
  shorttops,
  tshirtwomens,
  bottoms_womens,
  nightwears,
  kids,
} from "../../assets";

const categoryTiles = [
  { key: "half-hand", label: "SAREES", link: "/all-product?subCategory=Saree", image: sarees },
  { key: "oversized", label: "KURTI", link: "/all-product?subCategory=Kurti", image: kurtis },
  { key: "winterwear", label: "CHURIDAR", link: "/all-product?subCategory=Churidar+Set", image: churidar },
  { key: "jeans", label: "SHORT TOPS", link: "/all-product?subCategory=Short+Tops", image: shorttops },
  { key: "cargos", label: "T-SHIRT", link: "/all-product?subCategory=T-Shirt", image: tshirtwomens },
  { key: "polos", label: "BOTTOMS", link: "/all-product?subCategory=Bottoms", image: bottoms_womens },
  { key: "joggers", label: "NIGHTWEAR", link: "/all-product?subCategory=Nightwears", image: nightwears },
  { key: "trousers", label: "KIDS", link: "/all-product?category=KIDS", image: kids },
];

const CategoryStrip = () => {
  return (
    <section className="category-strip">
      <div className="category-strip-header">
        <h2 className="ticket-title">SAREE &amp; CHURIDAR TOP COLLECTIONS</h2>
      </div>

      <div className="category-icon-grid">
        {categoryTiles.map((tile) => (
          <Link key={tile.key} to={tile.link} className="category-icon">
            <span className="category-icon-label">{tile.label}</span>
            <img src={tile.image} alt={tile.label} />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryStrip;
