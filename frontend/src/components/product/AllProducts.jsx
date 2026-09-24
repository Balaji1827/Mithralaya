import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Filter from "./Filter";
import ProductCard from "./ProductCard";
import {
  getProducts,
  getTextileProducts,
  getTextileFilters
} from "../../services/productService";

import "../../css/Allproduct.css";

const AllProducts = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);       // URL-scoped (trending/new/bestseller/search)
  const [allProducts, setAllProducts] = useState([]); // full catalog — filter use panna idha base-a
  const [filterOptions, setFilterOptions] = useState({});
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [pendingFilters, setPendingFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState("");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [filterOpen, setFilterOpen] = useState(false);

  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 10000
  });

  useEffect(() => {
    setSelectedTag("ALL");
    setActiveFilters({});
    setPendingFilters({});

    loadProducts();
    loadFilterOptions();
  }, [location.search]);

  useEffect(() => {
    document.body.style.overflow = filterOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterOpen]);

  const loadProducts = async () => {
    try {
      const qs = new URLSearchParams(location.search);
      const params = {};

      const search = qs.get('search');
      if (search) params.search = search;

      const category = qs.get('category');
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

      // Rendu fetches parallel-a:
      // 1. scoped — URL params-oda (trending/new/bestseller/search etc.)
      // 2. full catalog — filter apply pannumbodhu base-a use panna
      const [legacyData, textileData, allLegacy, allTextile] = await Promise.all([
        getProducts(params),
        getTextileProducts(params),
        getProducts({}),
        getTextileProducts({})
      ]);

      const combined = [
        ...(textileData.products || []),
        ...(legacyData.products || [])
      ];

      const combinedAll = [
        ...(allTextile.products || []),
        ...(allLegacy.products || [])
      ];

      setProducts(combined);
      setAllProducts(combinedAll);

      // slider max — full catalog price base-la
      const highest =
        combinedAll.length > 0
          ? Math.max(...combinedAll.map((p) => p.price || 0))
          : 10000;

      setMaxPrice(highest);
      setPriceRange({ min: 0, max: highest });

    } catch (err) {
      console.error(err);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const data = await getTextileFilters();
      setFilterOptions(data || {});
    } catch (err) {
      console.error(err);
    }
  };

  const filterProducts = (list, filters) => {
    return list.filter((product) => {
      return Object.entries(filters).every(([key, values]) => {
        if (!values.length) return true;

        const productValue = product[key];

        if (Array.isArray(productValue)) {
          return values.some((v) => productValue.includes(v));
        }

        return values.includes(productValue);
      });
    });
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;
  const priceActive = priceRange.min > 0 || priceRange.max < maxPrice;

  const baseProducts = (hasActiveFilters || priceActive) ? allProducts : products;

  const filteredProducts = filterProducts(baseProducts, activeFilters);

  const tagFilteredProducts = filteredProducts
    .filter((product) => {
      if (selectedTag === "ALL") return true;

      return (
        product.sleeveOrStyle === selectedTag ||
        product.productType === selectedTag ||
        product.subCategory === selectedTag
      );
    })
    .filter((product) => {
      return (
        product.price >= priceRange.min &&
        product.price <= priceRange.max
      );
    });

  let displayProducts = [...tagFilteredProducts];

  switch (sortBy) {
    case "low":
      displayProducts.sort((a, b) => a.price - b.price);
      break;

    case "high":
      displayProducts.sort((a, b) => b.price - a.price);
      break;

    case "new":
      displayProducts.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      break;

    default:
      break;
  }

  return (
    <>

      <div className="products-page">
        {filterOpen && (
          <div
            className="filter-backdrop"
            onClick={() => setFilterOpen(false)}
          />
        )}

        <aside className={`products-sidebar ${filterOpen ? "products-sidebar-open" : ""}`}>
          <Filter
            totalProducts={displayProducts.length}
            onFilterPreview={setPendingFilters}
            onFilterChange={setActiveFilters}
            isOpen={filterOpen}
            onClose={() => setFilterOpen(false)}
            maxPrice={maxPrice}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
          />
        </aside>

        <section className="products-content">
          <div className="products-header">
            <button
              type="button"
              className="mobile-filter-btn"
              onClick={() => setFilterOpen(true)}
            >
              Filters
            </button>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Sort</option>
              <option value="low">Price Low to High</option>
              <option value="high">Price High to Low</option>
              <option value="new">Newest First</option>
            </select>
          </div>

          {/* <div className="category-tags">
          <button
            className={selectedTag === "ALL" ? "active" : ""}
            onClick={() => setSelectedTag("ALL")}
          >
            ALL
          </button>

          {filterOptions.productType?.map((item) => (
            <button
              key={item}
              className={selectedTag === item ? "active" : ""}
              onClick={() => setSelectedTag(item)}
            >
              {item}
            </button>
          ))}

          {filterOptions.sleeveOrStyle?.map((item) => (
            <button
              key={item}
              className={selectedTag === item ? "active" : ""}
              onClick={() => setSelectedTag(item)}
            >
              {item}
            </button>
          ))}
        </div> */}

          <div className="products-grid">
            {displayProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        </section>
      </div>
      {displayProducts.length === 0 && (
        <div className="no-results">
          <p>😕 No products found</p>
          <p style={{ color: "#888" }}>
            Try different keywords like
            <strong> plain shirt</strong>,
            <strong> cotton pant</strong>,
            <strong> checked shirt</strong>
          </p>
        </div>
      )}
    </>

  );
};

export default AllProducts;