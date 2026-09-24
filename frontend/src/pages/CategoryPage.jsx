import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProducts, getTextileProducts } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import '../css/categoryPage.css';

// ⚠️ Maps the URL slug (from Header.jsx's HEADER_CATEGORIES) to the actual
// `subCategory` value stored on products — confirmed from real product data
// that subCategory is "Shirt" (singular). The rest follow the same singular
// convention but aren't independently confirmed — verify against your
// config/textileCatalog.js categoryTree and adjust any that don't match.
const SLUG_TO_SUBCATEGORY = {
  'shirt': 'Shirt',
  't-shirts': 'T-Shirt',
  'jeans': 'Jeans',
  'trousers': 'Trousers',
  'cargo-pants': 'Cargo Pants',
  'shorts': 'Shorts',
  'knitted-bottom-wear': 'Knitted Bottom Wear'
};

const SLUG_TO_LABEL = {
  'shirt': 'Shirts',
  't-shirts': 'T-Shirts',
  'jeans': 'Jeans',
  'trousers': 'Trousers',
  'cargo-pants': 'Cargo Pants',
  'shorts': 'Shorts',
  'knitted-bottom-wear': 'Knitted Bottom Wear'
};

const CategoryPage = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const subCategory = SLUG_TO_SUBCATEGORY[slug];
  const label = SLUG_TO_LABEL[slug] || slug;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      window.scrollTo(0, 0);

      if (!subCategory) {
        setProducts([]);
        setLoading(false);
        setError(`Unknown category "${slug}"`);
        return;
      }

      try {
        const [legacyData, textileData] = await Promise.all([
          getProducts({ subCategory }),
          getTextileProducts({ subCategory })
        ]);

        const combined = [
          ...(textileData.products || []),
          ...(legacyData.products || [])
        ];

        setProducts(combined);
      } catch (err) {
        console.error('Failed to load category products', err);
        setError('Could not load products for this category.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, subCategory]);

  return (
    <div className="ctp-page">
      <nav className="ctp-breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <span>{label}</span>
      </nav>

      <h1 className="ctp-title">{label}</h1>

      {loading ? (
        <div className="ctp-status">Loading {label.toLowerCase()}...</div>
      ) : error ? (
        <div className="ctp-status ctp-error">{error}</div>
      ) : products.length === 0 ? (
        <div className="ctp-status">No products found in {label}.</div>
      ) : (
        <>
          <p className="ctp-count">{products.length} products</p>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryPage;
