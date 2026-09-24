import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTextileNavigation } from "../../services/productService";
import "../../css/headerDropdown.css";

/* ============================================================
   MITHRALAYA — WOMENS & KIDS header dropdown
   - WOMEN subcategories shown as individual nav items
   - KIDS shown as ONE nav item with Boys / Girls / Baby columns
   - Header height auto-measure: bar epavum header-oda keezha
     gap illama ottikkum (--header-height CSS variable)

   FIX (2026-08-18): ALLOWED_WOMEN_MENUS must exactly match the
   WOMEN keys in categories.js (now fixed to be quoted display
   strings — 'Churidar Set', 'Short Tops', 'T-Shirt', etc). This
   list was previously out of sync ("Churidar Set" vs the old
   "ChuridarSet" key, "Tops" vs the renamed "Short Tops" key),
   which silently dropped those menus from the nav. "Leggings"
   and "Gown" removed for now since they aren't top-level WOMEN
   keys in categories.js (Gown only exists as a subtype under
   Churidar Set) — add them back here once/if they're added as
   top-level entries in the tree.

   UPDATE (2026-08-25): Saree is now a 3-level entry in
   categories.js — Saree -> group (eg "Pattu Sarees") -> specific
   type (eg "Kanjivarm Pattu") — instead of the old flat list.
   The WOMEN mega-menu below now detects whether a subcategory's
   groups carry children and, if so, renders one column per group
   with its types listed underneath (group name is a plain label,
   not a link, since there's no product field for the group level
   itself — only for the specific type). Subcategories that stay
   flat (Kurti, Bottoms, etc) render exactly as before.

   UPDATE (2026-09-15): exported so Header.jsx's mobile drawer can
   reuse this exact list for its "Ladies" section instead of
   keeping a second copy that can drift out of sync the same way
   the FIX above had to correct.
============================================================ */

// WOMEN nav-la enna items kaatanum — inga add/remove pannunga.
export const ALLOWED_WOMEN_MENUS = [
  "Saree",
  "Kurti",
  "Churidar Set",
  "Short Tops",
  "T-Shirt",
  "Bottoms",
  "Nightwears"
];

// Flat variant list-ah (Cotton, Silk, ...) column-ah pirikka
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const HeaderDropdown = () => {
  const [navigation, setNavigation] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);

  // Header height-ah measure panni CSS variable-la set pannum —
  // entha screen size-layum bar header-oda gap illama ottikkum
  useEffect(() => {
    const header = document.querySelector('.header');
    if (!header) return;

    const setHeight = () =>
      document.documentElement.style.setProperty(
        '--header-height',
        `${header.offsetHeight}px`
      );

    setHeight();

    const ro = new ResizeObserver(setHeight);
    ro.observe(header);
    window.addEventListener('resize', setHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setHeight);
    };
  }, []);

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        const data = await getTextileNavigation();
        if (!data?.categoryTree) return;

        const nav = Object.entries(data.categoryTree).map(
          ([category, subCategories]) => ({
            category,
            subCategories: Object.entries(subCategories || {}).map(
              ([subName, groupObj]) => ({
                name: subName,
                groups: Object.entries(groupObj || {}).map(
                  ([groupName, patterns]) => ({
                    name: groupName,
                    children:
                      patterns && typeof patterns === "object"
                        ? Object.keys(patterns)
                        : []
                  })
                )
              })
            )
          })
        );

        setNavigation(nav);
      } catch (err) {
        console.log(err);
      }
    };

    loadNavigation();
  }, []);

  if (!navigation.length) return null;

  const womenCategory = navigation.find(
    (item) => item.category.toUpperCase() === "WOMEN"
  );
  const kidsCategory = navigation.find(
    (item) => item.category.toUpperCase() === "KIDS"
  );

  if (!womenCategory && !kidsCategory) return null;

  const womenMenus = (womenCategory?.subCategories || []).filter((item) =>
    ALLOWED_WOMEN_MENUS.includes(item.name)
  );

  // NOTE: backend filter param — women/kids variant-ku "productType"
  // use pannirukken. Unga API vera field expect panna
  // (eg: material / style), intha oru variable-ah maathina podhum.
  const VARIANT_PARAM = "productType";

  const buildLink = (subName, variant) => {
    const q = new URLSearchParams({ subCategory: subName });
    if (variant) q.set(VARIANT_PARAM, variant);
    return `/all-product?${q.toString()}`;
  };

  return (
    <div className="bnav-bar">
      <nav className="bnav-list">

        {/* ---------- WOMEN menus ---------- */}
        {womenMenus.map((sub, index) => {
          // Flat subcategories (Kurti, Bottoms, ...) have groups with no
          // children — those render as a single flat variant list like
          // before. Nested subcategories (Saree) have groups whose
          // children hold the actual specific types — those render as
          // one column per group, group name as a label + its types below.
          const isNested = sub.groups.some(
            (g) => g.children && g.children.length > 0
          );
          const hasDropdown = sub.groups.length > 0;
          const alignRight = index >= Math.ceil(womenMenus.length / 2);

          return (
            <div
              key={sub.name}
              className="bnav-item"
              onMouseEnter={() => setActiveMenu(sub.name)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <Link className="bnav-link" to={buildLink(sub.name)}>
                {sub.name.toUpperCase()}
                {hasDropdown && <span className="bnav-caret">▾</span>}
              </Link>

              {activeMenu === sub.name && hasDropdown && (
                <div
                  className={`bnav-mega ${alignRight ? "bnav-mega-right" : ""}`}
                >
                  <div className="bnav-mega-inner">
                    {isNested
                      ? sub.groups.map((g) => (
                          <div className="bnav-col" key={g.name}>
                            <span className="bnav-col-title">{g.name}</span>
                            {g.children.map((child) => (
                              <Link
                                key={child}
                                to={buildLink(sub.name, child)}
                                className="bnav-col-link"
                                onClick={() => setActiveMenu(null)}
                              >
                                {child}
                              </Link>
                            ))}
                          </div>
                        ))
                      : chunk(
                          sub.groups.map((g) => g.name),
                          6
                        ).map((col, ci) => (
                          <div className="bnav-col" key={ci}>
                            {col.map((variant) => (
                              <Link
                                key={variant}
                                to={buildLink(sub.name, variant)}
                                className="bnav-col-link"
                                onClick={() => setActiveMenu(null)}
                              >
                                {variant}
                              </Link>
                            ))}
                          </div>
                        ))}

                    <div className="bnav-col bnav-viewall-col">
                      <Link
                        className="bnav-viewall"
                        to={buildLink(sub.name)}
                        onClick={() => setActiveMenu(null)}
                      >
                        View All {sub.name} →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ---------- KIDS — one nav item, Boys/Girls/Baby columns ---------- */}
        {kidsCategory && kidsCategory.subCategories.length > 0 && (
          <div
            className="bnav-item"
            onMouseEnter={() => setActiveMenu("__KIDS__")}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <Link className="bnav-link" to="/all-product?category=KIDS">
              KIDS
              <span className="bnav-caret">▾</span>
            </Link>

            {activeMenu === "__KIDS__" && (
              <div className="bnav-mega bnav-mega-right">
                <div className="bnav-mega-inner">
                  {kidsCategory.subCategories.map((sub) => (
                    <div className="bnav-col" key={sub.name}>
                      <Link
                        className="bnav-col-title"
                        to={buildLink(sub.name)}
                        onClick={() => setActiveMenu(null)}
                      >
                        {sub.name}
                      </Link>

                      {sub.groups.map((g) => (
                        <Link
                          key={g.name}
                          to={buildLink(sub.name, g.name)}
                          className="bnav-col-link"
                          onClick={() => setActiveMenu(null)}
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  ))}

                  <div className="bnav-col bnav-viewall-col">
                    <Link
                      className="bnav-viewall"
                      to="/all-product?category=KIDS"
                      onClick={() => setActiveMenu(null)}
                    >
                      View All Kids →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- special links ---------- */}
        <div className="bnav-item">
          <Link
            to="/all-product?new=true"
            className="bnav-link bnav-special bnav-new"
            onClick={() => setActiveMenu(null)}
          >
            New Arrivals
          </Link>
        </div>

        <div className="bnav-item">
          <Link
            to="/all-product?trending=true"
            className="bnav-link bnav-special bnav-trending"
            onClick={() => setActiveMenu(null)}
          >
            Trending
          </Link>
        </div>

        <div className="bnav-item">
          <Link
            to="/all-product?bestseller=true"
            className="bnav-link bnav-special bnav-best"
            onClick={() => setActiveMenu(null)}
          >
            Best Sellers
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default HeaderDropdown;
