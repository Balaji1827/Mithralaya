import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

import "swiper/css";
import "swiper/css/pagination";

import "../../css/bannerSlider.css";

const BannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Same endpoint the admin Slider page writes to. Only active slides show,
  // ordered the way the admin set via "Order in list".
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const { data } = await api.get('/banner-sliders');
        const active = (data || [])
          .filter((b) => b.isActive)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setBanners(active);
      } catch (err) {
        console.error('Failed to load banner slides', err);
      } finally {
        setLoading(false);
      }
    };
    loadBanners();
  }, []);

  if (loading || banners.length === 0) return null;

  return (
    <section className="banner-wrapper">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={"auto"}
        centeredSlides={true}
        loop={true}
        spaceBetween={25}
        speed={1200}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
        }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner._id}>
          <img
  src={banner.image}
  alt={banner.title}
  onClick={() => navigate(banner.link)}
  style={{ cursor: "pointer" }}
/>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default BannerSlider;
