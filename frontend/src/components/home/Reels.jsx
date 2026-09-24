import React, { useEffect, useRef, useState } from "react";
import "../../css/reels.css";
import { getActiveReels, formatViews } from "../../services/reelsServices";

const API_BASE = process.env.REACT_APP_API_URL || ""; // your backend origin, e.g. http://localhost:5001

const resolveUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
};

// if there's no poster image, seek a hair into the video so we don't
// land on a black/blank opening frame
const handleLoadedMetadata = (e, hasThumbnail) => {
  if (hasThumbnail) return;
  try {
    e.currentTarget.currentTime = Math.min(0.3, (e.currentTarget.duration || 1) / 4);
  } catch (err) {
    // ignore — some browsers throw if called too early
  }
};

const AUTO_SLIDE_INTERVAL = 3000; // ms between auto-advances

const Reels = () => {
  const sliderRef = useRef(null);
  const isHoveringRef = useRef(false);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const data = await getActiveReels();
        if (isMounted) setReels(data);
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to load reels");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = (direction) => {
    if (!sliderRef.current) return;
    const card = sliderRef.current.querySelector(".reel-card");
    const scrollAmount = card ? card.offsetWidth + 16 : 300;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // auto-advance the slider, looping back to the start at the end
  useEffect(() => {
    if (reels.length < 2) return;

    const timer = setInterval(() => {
      const slider = sliderRef.current;
      if (!slider || isHoveringRef.current) return;

      const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 4;

      if (atEnd) {
        slider.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scroll("right");
      }
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [reels]);

  if (loading || error || reels.length === 0) {
    // render nothing on the storefront if there's no data / an error,
    // so the section doesn't show a broken empty slider
    return null;
  }

  return (
    <section className="reels-section">
      <h2 className="reels-title">STYLE AND LOVED BY ALL</h2>

      <div className="reels-slider-wrapper">
        <button
          className="reels-arrow reels-arrow-left"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          &#8592;
        </button>

        <div
          className="reels-slider"
          ref={sliderRef}
          onMouseEnter={() => { isHoveringRef.current = true; }}
          onMouseLeave={() => { isHoveringRef.current = false; }}
        >
          {reels.map((reel) => {
            const hasThumbnail = Boolean(reel.thumbnail);
            return (
              <div className="reel-card" key={reel._id}>
                <span className="reel-views">
                  <svg
                    className="reel-eye-icon"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="currentColor"
                  >
                    <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                  {formatViews(reel.views)}
                </span>

                <video
                  className="reel-media"
                  src={resolveUrl(reel.video)}
                  poster={hasThumbnail ? resolveUrl(reel.thumbnail) : undefined}
                  preload="auto"
                  autoPlay
                  muted
                  loop
                  playsInline
                  onLoadedMetadata={(e) => {
                    handleLoadedMetadata(e, hasThumbnail);
                    // some browsers need an explicit play() call even with autoPlay set
                    e.currentTarget.play().catch(() => {});
                  }}
                />
              </div>
            );
          })}
        </div>

        <button
          className="reels-arrow reels-arrow-right"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          &#8594;
        </button>
      </div>
    </section>
  );
};

export default Reels;
