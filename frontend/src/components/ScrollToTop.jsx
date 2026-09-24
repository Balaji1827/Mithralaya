import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Drop this once inside your <Router>, above your <Routes>. It renders
 * nothing — it just watches the URL and scrolls back to the top every
 * time the path changes.
 *
 * It resets THREE possible scroll owners, because different app layouts
 * put the scrollbar in different places:
 *   1. window / documentElement / body — the normal case
 *   2. any element carrying a `data-scroll-container` attribute — add
 *      this attribute to your layout's scrollable wrapper div if your
 *      header/footer are fixed and only an inner content area scrolls
 *   3. the element matched by SCROLL_CONTAINER_SELECTOR below, as a
 *      fallback if you'd rather target it by class/id than add an
 *      attribute
 *
 * If scrolling still doesn't reset, open devtools, click on the footer,
 * inspect which element actually has the scrollbar (Elements panel →
 * look for the ancestor with overflow-y: auto/scroll and a scrollTop
 * that changes as you drag it), and either add data-scroll-container to
 * it or update SCROLL_CONTAINER_SELECTOR to match it.
 *
 * Usage in App.jsx:
 *
 *   <BrowserRouter>
 *     <ScrollToTop />
 *     <Routes>
 *       ...
 *     </Routes>
 *   </BrowserRouter>
 */

// Adjust this if your layout's scrollable wrapper has a known class/id
// instead of (or in addition to) a data-scroll-container attribute.
const SCROLL_CONTAINER_SELECTOR = '.app-content, .admin-content, #scroll-root';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. window-level scroll (covers the normal, most common layout)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0; // Safari

    // 2 & 3. any inner container that owns its own scrollbar
    const containers = document.querySelectorAll(
      `[data-scroll-container], ${SCROLL_CONTAINER_SELECTOR}`
    );
    containers.forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
