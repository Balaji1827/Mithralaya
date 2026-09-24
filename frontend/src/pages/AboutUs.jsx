import React from "react";
import "../css/AboutUs.css";
import {
  FaAward,
  FaHeart,
  FaBullseye,
  FaTshirt,
} from "react-icons/fa";

const AboutUs = () => {
  return (
    <div className="about-page">

      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <span className="about-tag">WELCOME TO BULLRISE</span>

          <h1>About Bullrise</h1>

          <p>
            At <strong>Bullrise</strong>, we make clothing for people who are
            always moving forward.
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="about-content container">

        <div className="about-card">

          <h2>Our Story</h2>

          <p>
            Our name comes from the <strong>bull</strong> — a symbol of
            <strong> strength</strong>, determination, and momentum. That same
            energy inspires every piece we create.
          </p>

          <p>
            We design clothes that are comfortable, durable, and effortless to
            wear every day. Whether you're working, working out, travelling, or
            simply enjoying life, Bullrise moves with you.
          </p>

        </div>

        <h2 className="section-title">
          What We Believe
        </h2>

        <div className="values-grid">

          <div className="value-card">
            <FaAward />

            <h3>Quality</h3>

            <p>
              Premium fabrics and strong stitching designed to last, wash after
              wash.
            </p>
          </div>

          <div className="value-card">
            <FaHeart />

            <h3>Comfort</h3>

            <p>
              Soft, breathable materials that feel as good as they look,
              throughout the day.
            </p>
          </div>

          <div className="value-card">
            <FaBullseye />

            <h3>Simplicity</h3>

            <p>
              Clean, timeless designs without unnecessary noise or distractions.
            </p>
          </div>

        </div>

        <div className="mission-card">

          <FaTshirt />

          <h2>Our Mission</h2>

          <p>
            Bullrise is for anyone who wants to look good, feel confident, and
            keep moving forward. Every collection is designed to combine
            everyday comfort with modern style, helping you wear confidence
            wherever life takes you.
          </p>

        </div>

      </section>

    </div>
  );
};

export default AboutUs;