import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { getTextileNavigation } from '../../services/productService';
import { getMyProfile } from '../../services/userService';
import fallbackTextileNavigation from '../../config/textileNavigation';
import '../../css/header.css';
import { bag, logo1, logo11, logo12, logo_123, user1, wishlist, logo_4, logo_7, mithralaya, mithralaya2 } from '../../assets';
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import AppleIcon from "@mui/icons-material/Apple";
import WindowIcon from "@mui/icons-material/Window";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HeaderDropdown, { ALLOWED_WOMEN_MENUS } from './HeaderDropdown';

// Picks the address to show delivery-to info for: whichever is marked
// isDefault, falling back to the first address on file. Takes a plain
// addresses array (not a user object) since the addresses used here come
// from a separate /user/me fetch, not from AuthContext's stored user.
const getDefaultAddress = (addresses) => {
  if (!addresses?.length) return null;
  return addresses.find((a) => a.isDefault) || addresses[0];
};

// Turns the raw categoryTree from getTextileNavigation() into the same
// { category, subCategories: [{ name, groups: [{ name, children }] }] }
// shape HeaderDropdown builds for the desktop mega-menu, so the mobile
// drawer shows exactly the same WOMEN/KIDS structure — Saree's nested
// group -> type levels included — instead of drifting out of sync with
// two separate transforms.
const buildNavTree = (categoryTree) =>
  Object.entries(categoryTree || {}).map(([category, subCategories]) => ({
    category,
    subCategories: Object.entries(subCategories || {}).map(
      ([subName, groupObj]) => ({
        name: subName,
        groups: Object.entries(groupObj || {}).map(([groupName, patterns]) => ({
          name: groupName,
          children:
            patterns && typeof patterns === 'object' ? Object.keys(patterns) : []
        }))
      })
    )
  }));

const Header = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const [profileopen, setProfileOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [textileNavigation, setTextileNavigation] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenCategory, setMobileOpenCategory] = useState(null);
  const [mobileOpenSub, setMobileOpenSub] = useState(null);

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);
  const wishlistCount = wishlistIds.length;

  const [cartBounce, setCartBounce] = useState(false);
  const [profileAddresses, setProfileAddresses] = useState(null);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProfileAddresses(null);
      return;
    }

    getMyProfile()
      .then((data) => {
        if (active) setProfileAddresses(data?.addresses || []);
      })
      .catch((err) => {
        console.error('Failed to load addresses for header location:', err);
        if (active) setProfileAddresses([]);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const defaultAddress = getDefaultAddress(profileAddresses);
  const deliveryPincode = defaultAddress?.pincode || null;


  const profileLabel = user?.name ? user.name.split(' ')[0] : 'Profile';


  const handleSearch = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    navigate(`/all-product?search=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    if (cartCount > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 400);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileOpenCategory(null);
    setMobileOpenSub(null);
  };

  useEffect(() => {
    let active = true;

    getTextileNavigation()
      .then((data) => {
        if (active && data?.categoryTree) {
          setTextileNavigation(data.categoryTree);
        }
      })
      .catch(() => {
        if (active) setTextileNavigation(fallbackTextileNavigation);
      });

    return () => {
      active = false;
    };
  }, []);

  // Same WOMEN/KIDS shape the desktop dropdown uses, built once per
  // textileNavigation fetch — this is what drives the "LADIES" and
  // "KIDS" sections of the mobile drawer below.
  const { womenMenus, kidsSubCategories } = useMemo(() => {
    const nav = buildNavTree(textileNavigation);
    const women = nav.find((item) => item.category.toUpperCase() === 'WOMEN');
    const kids = nav.find((item) => item.category.toUpperCase() === 'KIDS');

    return {
      womenMenus: (women?.subCategories || []).filter((item) =>
        ALLOWED_WOMEN_MENUS.includes(item.name)
      ),
      kidsSubCategories: kids?.subCategories || []
    };
  }, [textileNavigation]);

  const buildTextileLink = (subName, variant) => {
    const q = new URLSearchParams({ subCategory: subName });
    if (variant) q.set('productType', variant);
    return `/all-product?${q.toString()}`;
  };

  const toggleMobileCategory = (key) => {
    setMobileOpenCategory((prev) => (prev === key ? null : key));
    setMobileOpenSub(null);
  };

  const toggleMobileSub = (key) => {
    setMobileOpenSub((prev) => (prev === key ? null : key));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    navigate(user?.isAdmin ? '/admin' : '/');
  };

  const words = [
    "plain shirt",
    "checked shirt",
    "printed shirt",
    "collar shirt",
  ];

  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;

    const currentWord = words[wordIndex];
    let timeout;

    if (!isDeleting && charIndex <= currentWord.length) {
      timeout = setTimeout(() => {
        setText(currentWord.slice(0, charIndex));
        setCharIndex((prev) => prev + 1);
      }, 100);
    }

    if (isDeleting && charIndex >= 0) {
      timeout = setTimeout(() => {
        setText(currentWord.slice(0, charIndex));
        setCharIndex((prev) => prev - 1);
      }, 60);
    }

    if (charIndex === currentWord.length + 1) {
      timeout = setTimeout(() => setIsDeleting(true), 800);
    }

    if (charIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, wordIndex, isFocused]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".profile-wrapper")) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <>
      <header className="header">
        <div className="header-main">
          <div className="container-fluid">
            <div className="header-main-inner">

              <div className="header-left">
                <button
                  type="button"
                  className="mobile-menu-toggle"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </button>

                <div
                  type="button"
                  className="header-logo"
                  onClick={handleLogoClick}
                >
                  <img src={mithralaya2} className="logo_01" alt="Logo" />
                </div>
              </div>

              <div className="header-center">
                <div className="search-container">
                  <form onSubmit={handleSearch} className="search-box">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder={`Search for "${text}"`}
                    />

                    <button type="submit" className="search-btn">
                      Search
                    </button>
                  </form>
                </div>
              </div>

              <div className="header-right">
                <div className="header-right-wrapper">

                  <div className="header-top-links f5">
                    <span className="nav-item"
                      onClick={() => navigate("/sell-with-us")}
                      style={{ cursor: "pointer" }}>Sell With Us</span>
                    <span>|</span>

                    <span
                      className="nav-item"
                      onClick={() => navigate("/contact")}
                      style={{ cursor: "pointer" }}
                    >
                      Contact Us
                    </span>
                    <span>|</span>

                    <div className="download-app-section">
                      <span>Download App:</span>

                      <PhoneIphoneIcon className="download-icon" />
                      <AppleIcon className="download-icon" />
                      <WindowIcon className="download-icon" />
                    </div>
                  </div>

                  <div className="header-profile">

                    {/* Location — shows "Delivery to <pincode>" using the
                        logged-in user's default saved address (fetched via
                        getMyProfile()/GET /user/me), or the plain
                        "Location" label for guests / no address on file */}
                    <div
                      className="cart-image-btn header-location"
                      title={
                        defaultAddress
                          ? `${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.pincode}`
                          : undefined
                      }
                    >
                      <LocationPinIcon
                        sx={{
                          fontSize: 24,
                          color: "#C4A484"
                        }}
                      />
                      <p>
                        {deliveryPincode ? (
                          <>
                            Delivery to<br />
                            <strong>{deliveryPincode}</strong>
                          </>
                        ) : (
                          'Location'
                        )}
                      </p>
                    </div>

                    <div
                      className="cart-image-btn"
                      onClick={() => navigate("/wishlist")}
                    >
                      <FavoriteBorderIcon
                        sx={{
                          fontSize: 24,
                          color: "#C4A484"
                        }}
                      />
                      <p>Wishlist</p>

                      {wishlistCount > 0 && (
                        <span className="cart-image-badge">
                          {wishlistCount}
                        </span>
                      )}
                    </div>

                    <div
                      className="cart-image-btn"
                      onClick={() => navigate("/cart")}
                    >
                      <ShoppingBagOutlinedIcon
                        sx={{
                          fontSize: 24,
                          color: "#C4A484"
                        }}
                      />

                      <p>Cart</p>

                      {cartCount > 0 && (
                        <span className="cart-image-badge">
                          {cartCount}
                        </span>
                      )}
                    </div>

                    
                    <div className="profile-wrapper">

                      <div
                        className="cart-image-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileOpen(!profileopen);
                        }}
                      >
                        <PersonOutlineIcon
                          sx={{
                            fontSize: 24,
                            color: "#C4A484"
                          }}
                          className="profile-image"
                        />
                        <p>{profileLabel}</p>
                      </div>

                      {profileopen && (
                        <div className="profile-dropdown">
                          {!user ? (
                            <>
                              <button
                                className="dropdown-link"
                                onClick={() => navigate("/auth")}
                              >
                                Login
                              </button>

                              <button
                                className="dropdown-link"
                                onClick={() => navigate("/auth")}
                              >
                                Sign Up
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                to="/account"
                                className="dropdown-link"
                              >
                                My Account
                              </Link>

                              <button
                                className="dropdown-link logout"
                                onClick={handleLogout}
                              >
                                Logout
                              </button>
                            </>
                          )}
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </header>

      <div className="header-nav-row">
        <HeaderDropdown />
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={closeMobileMenu} />
      )}

      <aside className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span>Menu</span>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mobile-menu-links">
          <Link
            to="/all-product?trending=true"
            className="mobile-menu-link"
            onClick={closeMobileMenu}
          >
            Trending Now
          </Link>

          <Link
            to="/all-product?new=true"
            className="mobile-menu-link"
            onClick={closeMobileMenu}
          >
            New Arrivals
          </Link>

          <Link
            to="/all-product?bestseller=true"
            className="mobile-menu-link"
            onClick={closeMobileMenu}
          >
            Best Seller
          </Link>

          {/* ---------- LADIES (WOMEN) ---------- */}
          {womenMenus.length > 0 && (
            <div className="mobile-menu-category">
              <button
                type="button"
                className="mobile-menu-category-toggle"
                onClick={() => toggleMobileCategory('LADIES')}
              >
                Ladies
                <span className={`nav-arrow${mobileOpenCategory === 'LADIES' ? ' open' : ''}`} />
              </button>

              {mobileOpenCategory === 'LADIES' && (
                <div className="mobile-menu-subcategories">
                  {womenMenus.map((sub) => {
                    const subKey = `LADIES::${sub.name}`;
                    const isSubOpen = mobileOpenSub === subKey;
                    const isNested = sub.groups.some(
                      (g) => g.children && g.children.length > 0
                    );

                    return (
                      <div className="mobile-menu-subcategory" key={sub.name}>
                        <button
                          type="button"
                          className="mobile-menu-subcategory-toggle"
                          onClick={() => toggleMobileSub(subKey)}
                        >
                          {sub.name}
                          <span className={`nav-arrow${isSubOpen ? ' open' : ''}`} />
                        </button>

                        {isSubOpen && (
                          <div className="mobile-menu-groups">
                            {isNested
                              ? sub.groups.map((g) => (
                                  <div className="mobile-menu-group" key={g.name}>
                                    <span className="mobile-menu-group-title">{g.name}</span>
                                    {g.children.map((child) => (
                                      <Link
                                        key={child}
                                        to={buildTextileLink(sub.name, child)}
                                        className="mobile-menu-sublink"
                                        onClick={closeMobileMenu}
                                      >
                                        {child}
                                      </Link>
                                    ))}
                                  </div>
                                ))
                              : sub.groups.map((g) => (
                                  <Link
                                    key={g.name}
                                    to={buildTextileLink(sub.name, g.name)}
                                    className="mobile-menu-sublink"
                                    onClick={closeMobileMenu}
                                  >
                                    {g.name}
                                  </Link>
                                ))}

                            <Link
                              to={buildTextileLink(sub.name)}
                              className="mobile-menu-sublink mobile-menu-viewall"
                              onClick={closeMobileMenu}
                            >
                              View All {sub.name}
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---------- KIDS ---------- */}
          {kidsSubCategories.length > 0 && (
            <div className="mobile-menu-category">
              <button
                type="button"
                className="mobile-menu-category-toggle"
                onClick={() => toggleMobileCategory('KIDS')}
              >
                Kids
                <span className={`nav-arrow${mobileOpenCategory === 'KIDS' ? ' open' : ''}`} />
              </button>

              {mobileOpenCategory === 'KIDS' && (
                <div className="mobile-menu-subcategories">
                  {kidsSubCategories.map((sub) => {
                    const subKey = `KIDS::${sub.name}`;
                    const isSubOpen = mobileOpenSub === subKey;

                    return (
                      <div className="mobile-menu-subcategory" key={sub.name}>
                        <button
                          type="button"
                          className="mobile-menu-subcategory-toggle"
                          onClick={() => toggleMobileSub(subKey)}
                        >
                          {sub.name}
                          <span className={`nav-arrow${isSubOpen ? ' open' : ''}`} />
                        </button>

                        {isSubOpen && (
                          <div className="mobile-menu-groups">
                            {sub.groups.map((g) => (
                              <Link
                                key={g.name}
                                to={buildTextileLink(sub.name, g.name)}
                                className="mobile-menu-sublink"
                                onClick={closeMobileMenu}
                              >
                                {g.name}
                              </Link>
                            ))}

                            <Link
                              to={buildTextileLink(sub.name)}
                              className="mobile-menu-sublink mobile-menu-viewall"
                              onClick={closeMobileMenu}
                            >
                              View All {sub.name}
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mobile-menu-footer">
          {!user ? (
            <button
              type="button"
              className="mobile-menu-account-link"
              onClick={() => {
                closeMobileMenu();
                navigate('/auth');
              }}
            >
              Login / Sign Up
            </button>
          ) : (
            <>
              <Link
                to="/account"
                className="mobile-menu-account-link"
                onClick={closeMobileMenu}
              >
                My Account
              </Link>
              <button
                type="button"
                className="mobile-menu-account-link mobile-menu-logout"
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </aside>

    </>
  );
};

export default Header;
