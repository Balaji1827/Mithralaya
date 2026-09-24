// frontend/src/pages/ProductListPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getProducts, getTextileProducts } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import { ThreeDot } from 'react-loading-indicators';
import '../css/product.css';

const ProductListPage = () => {
  const { slug } = useParams();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const params = {};
        const qs = new URLSearchParams(search);

        const category = qs.get('category');
        if (slug) params.category = slug;
        if (category) params.category = category;

        const subCategory = qs.get('subCategory');
        if (subCategory) params.subCategory = subCategory;

        const productType = qs.get('productType');
        if (productType) params.productType = productType;

        const sleeveOrStyle = qs.get('sleeveOrStyle');
        if (sleeveOrStyle) params.sleeveOrStyle = sleeveOrStyle;

        if (qs.get('new') === 'true') params.new = 'true';
        if (qs.get('bestseller') === 'true') params.bestseller = 'true';
        if (qs.get('trending') === 'true') params.trending = 'true';

        const searchQuery = qs.get('search');
        if (searchQuery) params.search = searchQuery;

        // Was previously an either/or based on ?textile=true, which none of
        // the header links ever set — meaning this only ever queried the
        // legacy catalog and silently skipped every textile product, no
        // matter what filter was active. Query both and merge, same as
        // HomePage/CategoryPage already do.
        const [legacyData, textileData] = await Promise.all([
          getProducts(params),
          getTextileProducts(params)
        ]);
        const merged = [
          ...(Array.isArray(textileData.products) ? textileData.products : []),
          ...(Array.isArray(legacyData.products) ? legacyData.products : [])
        ];

        const combined = Array.from(
          new Map(merged.map((item) => [item._id, item])).values()
        );

        setProducts(combined);

        setProducts(combined);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, search]);

  return (
    <div className="product-list-page">
      <h1 className="page-title">
        {qs.get('new') === 'true'
          ? 'NEW ARRIVALS'
          : qs.get('trending') === 'true'
            ? 'TRENDING NOW'
            : qs.get('bestseller') === 'true'
              ? 'BEST SELLERS'
              : qs.get('search')
                ? `Search results for "${qs.get('search')}"`
                : qs.get('category') || qs.get('subCategory')
                  ? [qs.get('category'), qs.get('subCategory'), qs.get('productType'), qs.get('sleeveOrStyle')]
                    .filter(Boolean)
                    .join(' / ')
                  : slug
                    ? slug.toUpperCase()
                    : 'PRODUCTS'}
      </h1>

      {loading ? (
        <div className="loading"><center><ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#ffbf00ff"]} /></center></div>
      ) : products.length === 0 ? (
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
    </div>
  );
};

export default ProductListPage;
