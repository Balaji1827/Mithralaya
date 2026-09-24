import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../css/Poster.css";

// Shows only the hero banner whose "order" is 1. Place this component
// wherever the first poster slot belongs on the page.
const POSTER_ORDER = 1;

// resolve stored /uploads/... paths against the API's origin
const API_ORIGIN = (
  process.env.REACT_APP_API_URL ||
  (api?.defaults?.baseURL || '').replace(/\/api\/?$/, '')
).replace(/\/$/, '');

const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
};

const Poster = () => {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanner = async () => {
      try {
        const { data } = await api.get('/hero-banners');
        const match = (data || []).find(
          (b) => b.isActive && Number(b.order) === POSTER_ORDER
        );
        setBanner(match || null);
      } catch (err) {
        console.error('Failed to load hero banner', err);
      } finally {
        setLoading(false);
      }
    };
    loadBanner();
  }, []);

  if (loading || !banner) return null;

  const handleCtaClick = () => {
    const target = banner.ctaPrimaryLink;
    if (target) {
      if (/^https?:\/\//.test(target)) {
        window.location.href = target;
      } else {
        navigate(target);
      }
    } else {
      navigate('/all-product');
    }
  };

  return (
    <section className="poster-section">
      <div className="poster-banner">
        <img
          src={resolveMediaUrl(banner.image)}
          alt={banner.title}
          className="poster-banner-image"
        />

        <div className="poster-overlay" />

        <div className="poster-caption">
          <h1 className="poster-heading">{banner.title}</h1>

          {banner.subtitle && (
            <button
              type="button"
              className="poster-cta-strip"
              onClick={handleCtaClick}
            >
              {banner.subtitle}
            </button>
          )}
        </div>

        <div className="poster-view-all">
          <button
            type="button"
            className="poster-view-all-btn"
            onClick={() => navigate('/all-product')}
          >
            View All <span className="poster-view-all-arrow">&rarr;</span>
          </button>
        </div>

        <div className="poster-baseline" />
      </div>
    </section>
  );
};

export default Poster;
