import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../css/exclusive.css";

const ExclusiveStrip = () => {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(
    window.innerWidth <= 640 ? 1 : window.innerWidth <= 1024 ? 2 : 4
  );

  // Pull banners from the same endpoint the admin panel writes to, keep only
  // the ones marked active, and order them the way the admin set via "order".
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const { data } = await api.get('/exclusive-banners');
        const active = (data || [])
          .filter((b) => b.isActive)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setBanners(active);
      } catch (err) {
        console.error('Failed to load exclusive banners', err);
      } finally {
        setLoading(false);
      }
    };
    loadBanners();
  }, []);

  // Keep cardsPerView in sync with window width instead of only reading it
  // once at first render.
  useEffect(() => {
    const handleResize = () => {
      setCardsPerView(window.innerWidth <= 640 ? 1 : window.innerWidth <= 1024 ? 2 : 4);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalCards = banners.length;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalCards);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);

  useEffect(() => {
    if (isHovered || totalCards === 0) return;
    const interval = setInterval(nextSlide, 1500);
    return () => clearInterval(interval);
  }, [isHovered, totalCards]);

  if (loading || totalCards === 0) return null;

  // Calculate visible slides
  const visibleSlides = [];
  for (let i = 0; i < Math.min(cardsPerView, totalCards); i++) {
    visibleSlides.push(banners[(currentIndex + i) % totalCards]);
  }

  return (
    <section className="exclusive-strip premium">
      <div className="exclusive-header">
        <h2>METRO EXCLUSIVE</h2>
      </div>

      <div
        className="exclusive-slider"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button className="exclusive-arrow left" onClick={prevSlide}>‹</button>

        <div className="exclusive-viewport">
          <div className="exclusive-track">
            {visibleSlides.map((item, idx) => (
              <div key={item._id || idx} className={`exclusive-card ${idx === Math.floor(cardsPerView / 2) ? "active" : "side"}`}>
                <div className="exclusive-card-bg" style={{ backgroundImage: `url(${item.image})` }}>
                  <div className="exclusive-card-overlay" />
                  <div className="exclusive-card-content">
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                    <button className="exclusive-cta" onClick={() => navigate(item.link)}>Shop Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="exclusive-arrow right" onClick={nextSlide}>›</button>

        <div className="exclusive-dots">
          {banners.map((item, idx) => (
            <span key={item._id || idx} className={idx === currentIndex ? "dot active-dot" : "dot"} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExclusiveStrip;
