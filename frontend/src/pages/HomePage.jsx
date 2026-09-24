import React, { useEffect, useState } from 'react';
import CategoryStrip from '../components/home/CategoryStrip';
import ProductGridSection from '../components/home/ProductGridSection';
import ProductCard from '../components/product/ProductCard';
import {
  getCategories,
  getProducts,
  getTextileProducts
} from '../services/productService';
import MarqueeStrip from "../components/home/MarqueeStrip";
import ExclusiveStrip from '../components/home/ExclusiveStrip';
import { useNavigate } from 'react-router-dom';
import "../css/home.css";
// import Advertisement from '../components/Advertisement/Advertisement';
import Vedio from '../components/home/Vedio';
import Poster from '../components/home/Poster';
import BannerSlider from '../components/home/BannerSlider';
import Poster2 from '../components/home/Poster2';
import Poster3 from '../components/home/Poster3';
import Reels from '../components/home/Reels';

const NEW_ARRIVALS_LIMIT = 15;
const BEST_SELLERS_LIMIT = 15;
const TRENDING_LIMIT = 15;

const SHIRT_SUBS = [
  'Casual Shirts',
  'Plain Shirts',
  'Flannel Shirts',
  'Checked Shirts',
  'Cotton Shirts'
];

const TSHIRT_SUBS = [
  'Plain T-Shirts',
  'Printed T-Shirts',
  'Regular Fit T-Shirts',
  'Oversized T-Shirts',
  'Polo T-Shirts',
  'Plus Size T-Shirts',
  'Full Sleeve T-Shirts'
];


const getSubCategories = (filter) => {
  switch (filter) {
    case 'shirts':
      return SHIRT_SUBS;
    case 'trousers':
      return ['Trousers'];
    case 'tshirts':
      return TSHIRT_SUBS;
    case 'polos':
      return ['Polo T-Shirts', 'Polos'];
    default:
      return [];
  }
};

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [trending, setTrending] = useState([])

  const [newFilter, setNewFilter] = useState('all'); // 'all' | 'shirts' | 'trousers' | 'tshirts' | 'polos'

  const navigate = useNavigate();
  const allproducts = () => {
    navigate('/all-product');
  }
  const viewAllNewArrivals = () => {
    navigate('/all-product');
  }

  const viewAllBestSellers = () => {
    navigate('/all-product');
  }

  const viewAllTrending = () => {
    navigate('/all-product');
  }
  useEffect(() => {
    const load = async () => {
      try {
        const cats = await getCategories();
        setCategories(Array.isArray(cats) ? cats : []);

        const [bestLegacy, bestTextile] = await Promise.all([
          getProducts({ bestseller: "true" }),
          getTextileProducts({ bestseller: "true" })
        ]);

        setBestSellers([
          ...(bestTextile.products || []),
          ...(bestLegacy.products || [])
        ].slice(0, BEST_SELLERS_LIMIT));

        const [trendLegacy, trendTextile] = await Promise.all([
          getProducts({ trending: "true" }),
          getTextileProducts({ trending: "true" })
        ]);

        setTrending([
          ...(trendTextile.products || []),
          ...(trendLegacy.products || [])
        ].slice(0, TRENDING_LIMIT));
      } catch (error) {
        console.error('Error loading homepage data:', error);
        setCategories([]);
        setBestSellers([]);
        setTrending([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      const subCategories = getSubCategories(newFilter);
      const query = { new: 'true' };
      if (subCategories.length > 0) {
        query.subCategory = subCategories.join(',');
      }
      try {
        const [legacyData, textileData] = await Promise.all([
          getProducts(query),
          getTextileProducts(query)
        ]);

        const allProducts = [
          ...(textileData.products || []),
          ...(legacyData.products || [])
        ];

        setNewArrivals(allProducts.slice(0, NEW_ARRIVALS_LIMIT));
      } catch (error) {
        console.error('Error loading new arrivals:', error);
        setNewArrivals([]);
      }
    };
    fetchNewArrivals();
  }, [newFilter]);


  return (
    <div className="home-page">

      <BannerSlider />

      <CategoryStrip categories={categories} />

      <ExclusiveStrip />
      <Poster />

      <section className="grid-section">
        <div className="section-header new-arrivals-header">
          <h2 className='ticket-title'>NEW ARRIVALS </h2>

        </div>


        <div className="section-divider" >
          {newArrivals.length > 0 ? (
            <div className="product-grid">
              {newArrivals.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="no-new-arrivals">
              <img src="https://img.freepik.com/free-vector/coming-soon-promo-background-stay-tuned-new-arrival_1017-57503.jpg?semt=ais_hybrid&w=740&q=80" alt="No New Arrivals" height="250px" width="50%" />
              <h3>No New Arrivals Found</h3>
              <p>Check back later for the latest additions!</p>
            </div>
          )}</div>
        <button className="view-all-link" onClick={viewAllNewArrivals}>
          View all <span className="view-all-arrow">&rarr;</span>
        </button>
      </section>
      <center>
        <Reels />

        <Poster2 />

        <h2>BEST SELLERS</h2></center>
      <div className="section-divider-bestseller" >
        <ProductGridSection
          products={bestSellers}
        /></div>
      <button className="view-all-link" onClick={viewAllBestSellers}>
        View all <span className="view-all-arrow">&rarr;</span>
      </button>
      <Poster3 />

      <center>
        <h2>TRENDING</h2></center>
      <div className="section-divider-bestseller" >
        <ProductGridSection
          products={trending}
        /></div>
      <button className="view-all-link" onClick={viewAllTrending}>
        View all <span className="view-all-arrow">&rarr;</span>
      </button>


    </div>
  );
};

export default HomePage;
