import React, { useEffect, useState } from "react";
import { getTextileFilters } from "../../services/productService";
import "../../css/Filter.css";

const Filter = ({
  onFilterChange,
  onFilterPreview,
  totalProducts = 0,
  isOpen = false,
  onClose,
  maxPrice = 10000,
  priceRange,
  onPriceChange
}) => {
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState({});
  const [openSections, setOpenSections] = useState({});

  // local price state — slider smooth-a move aaga
  // NOTE: these can now briefly hold '' while the user is typing (see the
  // input onChange handlers below), so they're typed as number | ''.
  const [minVal, setMinVal] = useState(priceRange?.min ?? 0);
  const [maxVal, setMaxVal] = useState(priceRange?.max ?? maxPrice);

  useEffect(() => {
    loadFilters();
  }, []);

  // parent maxPrice update aana (products load aana appuram) sync pannu
  useEffect(() => {
    setMinVal(priceRange?.min ?? 0);
    setMaxVal(priceRange?.max ?? maxPrice);
  }, [priceRange?.min, priceRange?.max, maxPrice]);

  const loadFilters = async () => {
    try {
      const data = await getTextileFilters();

      // priceRange string array backend-la irundhu varudhu — adhu checkbox
      // section-a varakoodadhu, namma slider than adhukku
      const { priceRange: _ignore, ...rest } = data || {};
      setFilters(rest);

      const initialOpen = {};
      Object.keys(rest).forEach((key, index) => {
        initialOpen[key] = index === 0;
      });
      setOpenSections(initialOpen);
    } catch (error) {
      console.error("Filter Load Error:", error);
    }
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // ✅ Direct filtering — checkbox click panna odane apply aagum
  const handleChange = (type, value) => {
    const updated = { ...selected };

    if (!updated[type]) {
      updated[type] = [];
    }

    if (updated[type].includes(value)) {
      updated[type] = updated[type].filter((v) => v !== value);
      if (!updated[type].length) {
        delete updated[type];
      }
    } else {
      updated[type] = [...updated[type], value];
    }

    setSelected(updated);
    onFilterPreview?.(updated);
    onFilterChange?.(updated);
  };

  const removeFilter = (type, value) => {
    handleChange(type, value);
  };

  const clearAll = () => {
    setSelected({});
    onFilterPreview?.({});
    onFilterChange?.({});
    // price-um reset
    setMinVal(0);
    setMaxVal(maxPrice);
    onPriceChange?.({ min: 0, max: maxPrice });
  };

  // ---------- price handlers ----------
  const commitPrice = (min, max) => {
    onPriceChange?.({ min, max });
  };

  // ✅ Direct filtering for price too now — every drag/click on the slider
  // updates the local thumb position AND pushes the new min/max straight
  // to the parent, same "odane apply aagum" behaviour as the checkboxes
  // above. No more waiting for mouseUp/touchEnd to actually filter.
  const handleMinSlider = (value) => {
    const v = Math.min(Number(value), maxVal - 1);
    setMinVal(v);
    commitPrice(v, maxVal);
  };

  const handleMaxSlider = (value) => {
    const v = Math.max(Number(value), minVal + 1);
    setMaxVal(v);
    commitPrice(minVal, v);
  };

  const handleMinInput = (value) => {
    const v = Math.max(0, Math.min(Number(value) || 0, maxVal - 1));
    setMinVal(v);
    commitPrice(v, maxVal);
  };

  const handleMaxInput = (value) => {
    const v = Math.min(maxPrice, Math.max(Number(value) || 0, minVal + 1));
    setMaxVal(v);
    commitPrice(minVal, v);
  };

  const selectedCount = Object.values(selected).flat().length;
  const priceActive = minVal > 0 || maxVal < maxPrice;

  // slider track fill position (percentage) — guard against '' while the
  // input is mid-edit so the fill math doesn't briefly compute NaN%
  const minPercent = ((Number(minVal) || 0) / maxPrice) * 100;
  const maxPercent = ((maxVal === '' ? maxPrice : Number(maxVal)) / maxPrice) * 100;

  return (
    <div className="brf-sidebar">
      <div className="brf-header-row">
        <h3 className="brf-title">
          FILTERS
          {(selectedCount > 0 || priceActive) && (
            <span className="brf-count-badge">
              {selectedCount + (priceActive ? 1 : 0)}
            </span>
          )}
        </h3>
        <button
          type="button"
          className="brf-close-btn"
          onClick={onClose}
          aria-label="Close filters"
        >
          ×
        </button>
      </div>

      {/* Selected filter chips */}
      {(selectedCount > 0 || priceActive) && (
        <div className="brf-chips">
          {Object.entries(selected).map(([type, values]) =>
            values.map((value) => (
              <button
                key={`${type}-${value}`}
                className="brf-chip"
                onClick={() => removeFilter(type, value)}
                title="Remove filter"
              >
                {value} <span className="brf-chip-x">×</span>
              </button>
            ))
          )}
          {priceActive && (
            <button
              className="brf-chip"
              onClick={() => {
                setMinVal(0);
                setMaxVal(maxPrice);
                commitPrice(0, maxPrice);
              }}
              title="Remove price filter"
            >
              ₹{minVal} - ₹{maxVal} <span className="brf-chip-x">×</span>
            </button>
          )}
          <button className="brf-chip brf-chip-clear" onClick={clearAll}>
            Clear All
          </button>
        </div>
      )}

      {/* ========== PRICE FILTER ==========
          No collapse/expand toggle here anymore — price is always visible
          since it's one of the most-used filters. */}
      <div className="brf-section">
        <div className="brf-section-head brf-section-head-static">
          <span>PRICE</span>
        </div>

        <div className="brf-price">
          {/* Min / Max inputs */}
          <div className="brf-price-inputs">
            <div className="brf-price-group">
              <label>Min. Amount</label>
              <div className="brf-price-box">
                <span className="brf-rupee">₹</span>
                <input
                  type="number"
                  min="0"
                  max={maxVal - 1}
                  value={minVal}

                  onChange={(e) =>
                    setMinVal(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  onBlur={(e) => handleMinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMinInput(e.target.value)}
                />
              </div>
            </div>

            <div className="brf-price-group">
              <label>Max. Amount</label>
              <div className="brf-price-box">
                <span className="brf-rupee">₹</span>
                <input
                  type="number"
                  min={minVal + 1}
                  max={maxPrice}
                  value={maxVal}
                  // Same fix as Min. Amount above — allow '' while typing.
                  onChange={(e) =>
                    setMaxVal(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  onBlur={(e) => handleMaxInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMaxInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dual range slider */}
          <div className="brf-slider-wrap">
            <div className="brf-slider-track" />
            <div
              className="brf-slider-fill"
              style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
            />
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={minVal === '' ? 0 : minVal}
              onChange={(e) => handleMinSlider(e.target.value)}
              className="brf-range brf-range-min"
            />
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={maxVal === '' ? maxPrice : maxVal}
              onChange={(e) => handleMaxSlider(e.target.value)}
              className="brf-range brf-range-max"
            />
          </div>
        </div>
      </div>

      {/* ========== CHECKBOX FILTERS ========== */}
      {Object.entries(filters).map(([key, values]) => (
        <div className="brf-section" key={key}>
          <div className="brf-section-head" onClick={() => toggleSection(key)}>
            <span>
              {key.toUpperCase()}
              {selected[key]?.length > 0 && (
                <span className="brf-section-count"> ({selected[key].length})</span>
              )}
            </span>
            <span className="brf-toggle-icon">
              {openSections[key] ? "−" : "+"}
            </span>
          </div>

          {openSections[key] && (
            <div className="brf-options">
              {values?.map((item) => (
                <label className="brf-option" key={item}>
                  <input
                    type="checkbox"
                    checked={selected[key]?.includes(item) || false}
                    onChange={() => handleChange(key, item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* mobile drawer close */}
      {onClose && (
        <div className="brf-actions">
          <button className="brf-apply-btn" onClick={onClose}>
            VIEW {totalProducts} PRODUCTS
          </button>
        </div>
      )}
    </div>
  );
};

export default Filter;
