import React from 'react';
import ProductCard from '../product/ProductCard';
import "../../css/product.css";

const ProductGridSection = ({ title, products }) => {
  return (
    <section className="grid-section">
      <div className="section-header">
        <h2>{title}</h2>
      </div>

      {(!products || products.length === 0) ? (
        <div className="coming-soon-box">
          <p className="coming-soon-text">🚀 More products coming soon…</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGridSection;
