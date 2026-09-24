import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminSidebar } from './AdminDashboardPage';
import { useToast } from '../../contexts/ToastContext';
import Papa from "papaparse";
import {
  createTextileProduct,
  getTextileConfig,
  getTextileProduct,
  updateTextileProduct,
  updateTextileVariant
} from '../../services/productService';
import '../../css/admintextileproduct.css';

const EMPTY_BASE = {
  name: '',
  slug: '',
  category: '',
  subCategory: '',
  productType: '',
  sleeveOrStyle: '',
  material: '',
  brand: 'Mithralaya',
  colors: [],
  description: '',
  images: [],

  isNewArrival: false,
  isBestSeller: false,
  isTrending: false,

  status: 'ACTIVE'
};
const EMPTY_APPLY = {
  quantity: '',
  purchasePrice: '',
  wholesalePrice: '',
  retailPrice: '',
  mrp: '',
  gst: '',
  purchaseDate: '',
  manufacturingDate: '',
  supplierName: '',
  warehouseName: '',
  barcode: '',
  rackLocation: ''
};

// Fields in the "Apply To All Sizes" grid that are dates, not numbers —
// used both for the input's type and to skip the numeric min/max props.
const DATE_FIELDS = ['purchaseDate', 'manufacturingDate'];

const codeMap = {
  // common
  'T-Shirt': 'TSHIRT', Plain: 'PLN', Checked: 'CHK', Printed: 'PRT',
  Oversized: 'OVS', Embroidery: 'EMB', 'Party Wear': 'PTY',
  // women
  Saree: 'SAR', Kurti: 'KUR', 'Churidar Set': 'CHU', Salwar: 'SLW',
  Leggings: 'LEG', Palazzo: 'PLZ', Tops: 'TOP', Skirt: 'SKT',
  Gown: 'GWN', Nighty: 'NGT', Dupatta: 'DUP', Shawl: 'SHL',
  'Free Size': 'FS',
  // women — saree groups (2026-08-25)
  'Pattu Sarees': 'PATTU', 'Cotton Sarees': 'COTSR', 'Silk Sarees': 'SLKSR',
  'Fancy Sarees': 'FCYSR', '100% Polyester Sarees': 'POLSR',
  '100% Rayon / Viscose Sarees': 'RAYSR',
  // women — saree types (2026-08-25)
  'Kanjivarm Pattu': 'KANJI', 'Arani Pattu': 'ARANI', 'Banarasi Pattu': 'BANAR',
  'Venkatagiri Pattu': 'VENKT', 'Mangala Giri Pattu': 'MNGGR', 'Narayanpet Pattu': 'NARYP',
  'All-over Printed': 'ALPRT', 'Plain Saree': 'PLNSR', 'Stripes Saree': 'STRSR',
  'Paisley Saree': 'PSYSR', 'Elampillai Saree': 'ELAMP', 'Pochampalli Saree': 'POCHM',
  'Kalamkari Saree': 'KALAM', 'Chettinadu Saree': 'CHETT',
  'Mysore Silk': 'MYSLK', 'Kanchipuram Silk': 'KNCSLK', 'Dola Silk': 'DOLSLK', 'Tussar Silk': 'TUSSLK',
  'Chiffon Saree': 'CHIFF', 'Bomkai Saree': 'BOMKAI', 'Gadwal Saree': 'GADWAL', 'Katan Saree': 'KATAN',
  'Leheriya Saree': 'LEHER', 'Georgette Saree': 'GEORG', 'Patola Saree': 'PATOLA',
  'Paisley Print': 'PSYPRT', Stripes: 'STRP',
  // kids
  Boys: 'BOY', Girls: 'GRL', Baby: 'BBY', Frock: 'FRK',
  Romper: 'RMP', Jabla: 'JBL', 'Night Suit': 'NSU', 'Track Pant': 'TRK',
  // materials
  Cotton: 'COT', Linen: 'LIN', Rayon: 'RAY', 'Poly Cotton': 'PC',
  Denim: 'DEN', Silk: 'SLK', Satin: 'SAT', Viscose: 'VIS',
  Lycra: 'LYC', Wool: 'WOL', Polyester: 'POL', 'Blended Fabric': 'BLD',
  // colors
  Black: 'BLK', White: 'WHT', Blue: 'BLU', 'Navy Blue': 'NVY',
  'Sky Blue': 'SKY', Grey: 'GRY', 'Dark Grey': 'DGY', Brown: 'BRN',
  Coffee: 'COF', Red: 'RED', Pink: 'PNK', Green: 'GRN', Olive: 'OLV',
  Maroon: 'MRN', Wine: 'WIN', Purple: 'PUR', Yellow: 'YLW',
  Orange: 'ORG', Cream: 'CRM', Beige: 'BEI'
};

const codeFor = (value, length = 5) =>
  codeMap[value] || String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, length);

const getChildren = (node) => node && typeof node === 'object' ? Object.keys(node) : [];

/* ============================================================
   UPDATE (2026-08-18): Client asked to remove the Nighty free-size
   special case — Nighty should now get the normal WOMEN alpha size
   grid (XS/S/M/L/...) like every other Nightwears productType
   (Night Suits, Pyjama Set, Short Sets), instead of a single
   "Free Size" option. Only Saree / Dupatta / Shawl stay free-size.
============================================================ */
const getSizeOptions = (config, base) => {
  if (!config?.sizeRules || !base.category) return [];

  // Free-size items — single option, size grid select panna vendam
  const freeSizeSubCategories = ['Saree', 'Dupatta', 'Shawl'];
  if (freeSizeSubCategories.includes(base.subCategory)) return ['Free Size'];

  if (base.category === 'KIDS') return config.sizeRules.KIDS || [];

  // WOMEN (default): bottoms -> numeric, else alpha
  const numeric = ['Jeans', 'Pant', 'Leggings', 'Palazzo', 'Skirt'];
  return numeric.includes(base.subCategory) || numeric.includes(base.productType)
    ? config.sizeRules.WOMEN_NUMERIC || []
    : config.sizeRules.WOMEN_ALPHA || [];
};



const skuPreview = (base, size) => [
  'MTH',
  codeFor(base.category),
  codeFor(base.subCategory, 8),
  codeFor(base.productType, 6),
  codeFor(base.sleeveOrStyle, 4),
  codeFor(base.material),
  ...base.colors.map((color) => codeFor(color)),
  size
].filter(Boolean).join('-');

const AdminTextileProductPage = () => {

  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [config, setConfig] = useState(null);
  const [base, setBase] = useState(EMPTY_BASE);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [applyValues, setApplyValues] = useState(EMPTY_APPLY);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const colorDropdownRef = useRef(null);
  const [colorPicker, setColorPicker] = useState("#000000");
  const [colorName, setColorName] = useState("");

  // Close the color dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setColorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorSwatch = (color) => color.toLowerCase().replace(/\s+/g, '');

  useEffect(() => {
    const load = async () => {
      try {
        const textileConfig = await getTextileConfig();

        if (!textileConfig?.categoryTree) {
          throw new Error('Textile catalog configuration is unavailable');
        }

        setConfig(textileConfig);
        const defaults = {
          ...EMPTY_APPLY,
          supplierName: textileConfig.suppliers?.[0]?.name || '',
          warehouseName: textileConfig.warehouses?.[0]?.name || ''
        };
        setApplyValues(defaults);

        if (isEdit) {
          const product = await getTextileProduct(id);
          setBase({
            name: product.name || '',
            slug: product.slug || '',
            category: product.category || '',
            subCategory: product.subCategory || '',
            productType: product.productType || '',
            sleeveOrStyle: product.sleeveOrStyle || '',
            material: product.material || '',
            brand: product.brand || '',
            colors: product.colors?.length
              ? product.colors
              : product.color
                ? [product.color]
                : [],
            description: product.description || '',
            images: product.images || [],
            isNewArrival: Boolean(product.isNewArrival),
            isBestSeller: Boolean(product.isBestSeller),
            isTrending: Boolean(product.isTrending),
            status: product.status || 'ACTIVE'
          });
          setSelectedSizes(product.variants.map((variant) => variant.size));
          setVariants(product.variants.map((variant) => ({
            ...variant,
            supplierName: variant.supplierName || variant.supplierId?.name || '',
            warehouseName: variant.warehouseName || variant.warehouseId?.name || ''
          })));
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Unable to load textile catalog';
        setLoadError(message);
        addToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, addToast]);



  const categoryNode = config?.categoryTree?.[base.category];
  const subCategoryOptions = getChildren(categoryNode);
  const subCategoryNode = categoryNode?.[base.subCategory];
  const productTypeOptions = getChildren(subCategoryNode);
  const productTypeNode = productTypeOptions.length ? subCategoryNode?.[base.productType] : null;
  const styleOptions = getChildren(productTypeNode);
  const sizeOptions = useMemo(() => getSizeOptions(config, base), [config, base]);

  // Saree now goes one level deeper than the other WOMEN subcategories
  // (Saree -> group, eg "Pattu Sarees" -> specific type, eg "Kanjivarm
  // Pattu"), reusing the same category/subCategory/productType/style
  // fields every other product already uses — just relabeled so the
  // form reads naturally for a saree instead of a t-shirt.
  const isSaree = base.category === 'WOMEN' && base.subCategory === 'Saree';
  const productTypeLabel = isSaree ? 'Saree Category' : 'Product Type';
  const styleLabel = isSaree ? 'Saree Type' : 'Sleeve / Style';

  const updateBase = (name, value) => {
    setBase((current) => {
      const next = { ...current, [name]: value };
      if (name === 'category') Object.assign(next, { subCategory: '', productType: '', sleeveOrStyle: '' });
      if (name === 'subCategory') Object.assign(next, { productType: '', sleeveOrStyle: '' });
      if (name === 'productType') next.sleeveOrStyle = '';
      return next;
    });
    if (['category', 'subCategory', 'productType'].includes(name)) {
      setSelectedSizes([]);
      if (!isEdit) setVariants([]);
    }
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const toggleSize = (size) => {
    if (isEdit) return;
    setSelectedSizes((current) => {
      const selected = current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size];
      setVariants((rows) => selected.map((selectedSize) => {
        const existing = rows.find((row) => row.size === selectedSize);
        return existing || {
          ...applyValues,
          size: selectedSize,
          quantity: applyValues.quantity,
          stockAvailable:
            applyValues.quantity === ''
              ? ''
              : Number(applyValues.quantity)
        };
      }));
      return selected;
    });
  };

  const toggleColor = (color) => {
    setBase((current) => ({
      ...current,
      colors: current.colors.includes(color)
        ? current.colors.filter((item) => item !== color)
        : [...current.colors, color]
    }));
    setErrors((current) => ({ ...current, colors: '' }));
  };

  const applyToAll = () => {
    const totalQty = Number(applyValues.quantity) || 0;

    setVariants((rows) => {
      const count = rows.length;

      if (count === 0) return rows;

      const eachQty = Math.floor(totalQty / count);
      const balance = totalQty % count;

      return rows.map((row, index) => ({
        ...row,
        purchasePrice: applyValues.purchasePrice,
        wholesalePrice: applyValues.wholesalePrice,
        retailPrice: applyValues.retailPrice,
        mrp: applyValues.mrp,
        gst: applyValues.gst,
        purchaseDate: applyValues.purchaseDate,
        manufacturingDate: applyValues.manufacturingDate,
        supplierName: applyValues.supplierName,
        warehouseName: applyValues.warehouseName,
        rackLocation: applyValues.rackLocation,

        quantity:
          applyValues.quantity === ''
            ? ''
            : index === 0
              ? eachQty + balance
              : eachQty,

        stockAvailable:
          applyValues.quantity === ''
            ? ''
            : index === 0
              ? eachQty + balance
              : eachQty
      }));
    });

    addToast("Applied to all sizes");
  };

  const updateVariant = (index, field, value) => {
    setVariants((rows) => rows.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      const next = { ...row, [field]: value };
      if (field === 'quantity' && !isEdit) {
        next.stockAvailable = value === '' ? '' : Number(value);
      }
      return next;
    }));
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;

    try {
      new URL(url);
    } catch {
      addToast('Enter a valid image URL', 'error');
      return;
    }

    if (base.images.includes(url)) {
      addToast('This image URL is already added', 'error');
      return;
    }

    setBase((current) => ({
      ...current,
      images: [...(current.images || []), url]
    }));
    setImageUrl('');
  };

  const addCustomColor = () => {

    if (!colorName.trim()) {
      addToast("Enter color name", "error");
      return;
    }

    if (base.colors.includes(colorName)) {
      addToast("Color already added", "error");
      return;
    }

    setBase((prev) => ({
      ...prev,
      colors: [...prev.colors, colorName]
    }));

    setColorName("");
    setColorPicker("#000000");
  };

  const removeColor = (color) => {
    setBase((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color)
    }));
  };

  const removeImageUrl = (index) => {
    setBase((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index)
    }));
  };


  const validate = () => {
    const nextErrors = {};
    ['name', 'category', 'subCategory', 'material', 'brand'].forEach((field) => {
      if (!String(base[field] || '').trim()) nextErrors[field] = 'Required';
    });
    if (base.colors.length === 0) nextErrors.colors = 'Select at least one color';
    if (productTypeOptions.length && !base.productType) nextErrors.productType = 'Required';
    if (styleOptions.length && !base.sleeveOrStyle) nextErrors.sleeveOrStyle = 'Required';
    if (!isEdit && variants.length === 0) nextErrors.sizes = 'Select at least one size';

    variants.forEach((variant, index) => {
      const purchase = Number(variant.purchasePrice);
      const wholesale = Number(variant.wholesalePrice);
      const retail = Number(variant.retailPrice);
      const mrp = Number(variant.mrp);
      const gst = Number(variant.gst);
      if (Number(variant.quantity) < 0) nextErrors[`variant-${index}`] = 'Quantity cannot be negative';
      else if (wholesale < purchase) nextErrors[`variant-${index}`] = 'Wholesale must be >= purchase';
      else if (retail < wholesale) nextErrors[`variant-${index}`] = 'Retail must be >= wholesale';
      else if (mrp < retail) nextErrors[`variant-${index}`] = 'MRP must be >= retail';
      else if (gst < 0 || gst > 28) nextErrors[`variant-${index}`] = 'GST must be 0-28';
      else if (!variant.supplierName?.trim() || !variant.warehouseName?.trim()) nextErrors[`variant-${index}`] = 'Supplier and warehouse are required';
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCsvSelect = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleCsvUpload = () => {
    if (!csvFile) {
      addToast("Select CSV file", "error");
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,

      complete: async (results) => {
        try {


          for (const product of results.data) {
            const categoryNode =
              config?.categoryTree?.[product.category];

            if (!categoryNode) {
              console.error(
                "Invalid category:",
                product.category
              );
              continue;
            }

            if (!categoryNode[product.subCategory]) {
              console.error(
                "Invalid subCategory:",
                product.subCategory,
                "for category:",
                product.category
              );
              continue;
            }
            await createTextileProduct({
              ...product,
              colors: product.colors
                ? product.colors.split("|")
                : [],
              sizes: product.sizes
                ? product.sizes.split("|")
                : [],
              purchasePrice: Number(product.purchasePrice),
              wholesalePrice: Number(product.wholesalePrice),
              retailPrice: Number(product.retailPrice),
              mrp: Number(product.mrp),
              gst: Number(product.gst),
              stock: Number(product.stock)
            });
          }
          addToast("CSV imported successfully");
        } catch (err) {
          console.error(err);
          addToast("CSV import failed", "error");
        }
      }
    });
  };
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      addToast('Please correct the highlighted product details', 'error');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateTextileProduct(id, base);
        await Promise.all(
          variants.map((variant) =>
            updateTextileVariant(variant._id, {
              quantity: Number(variant.quantity || 0),
              stockAvailable: Number(variant.stockAvailable || variant.quantity || 0),
              purchasePrice: Number(variant.purchasePrice || 0),
              wholesalePrice: Number(variant.wholesalePrice || 0),
              retailPrice: Number(variant.retailPrice || 0),
              mrp: Number(variant.mrp || 0),
              gst: Number(variant.gst || 0),
              purchaseDate: variant.purchaseDate || '',
              manufacturingDate: variant.manufacturingDate || '',
              supplierName: variant.supplierName,
              warehouseName: variant.warehouseName,
              barcode: variant.barcode,
              rackLocation: variant.rackLocation,
              status: variant.status,
              stockNote: 'Updated from textile product editor'
            })
          )
        );
        addToast('Textile product updated');
      } else {
        const firstVariant = variants[0] || {};
        const payload = {
          ...base,
          sizes: selectedSizes,
          purchasePrice: Number(firstVariant.purchasePrice || 0),
          wholesalePrice: Number(firstVariant.wholesalePrice || 0),
          retailPrice: Number(firstVariant.retailPrice || 0),
          mrp: Number(firstVariant.mrp || 0),
          gst: Number(firstVariant.gst || 0),
          stock: variants.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
          ),
          supplierName: firstVariant.supplierName || '',
          warehouseName: firstVariant.warehouseName || '',
          rackLocation: firstVariant.rackLocation || '',
          variants: variants.map((variant) => ({
            ...variant,
            quantity: Number(variant.quantity),
            stockAvailable: Number(
              variant.stockAvailable || variant.quantity || 0
            ),
            purchasePrice: Number(variant.purchasePrice),
            wholesalePrice: Number(variant.wholesalePrice),
            retailPrice: Number(variant.retailPrice),
            mrp: Number(variant.mrp),
            gst: Number(variant.gst)
          }))
        };

        console.log(
          'TEXTILE CREATE PAYLOAD',
          JSON.stringify(payload, null, 2)
        );
        await createTextileProduct(payload);
        addToast('Textile product and stock variants created');
      }
      navigate('/admin/products');
    } catch (error) {
      console.error(error);
      addToast(
        error.response?.data?.message ||
        'Failed to save textile product',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="admin-layout"><AdminSidebar /><div className="admin-content">Loading textile catalog...</div></div>;
  }

  if (!config?.categoryTree) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <div className="atp-load-error">
            <h1>Textile catalog unavailable</h1>
            <p>{loadError || 'Restart the backend server and try again.'}</p>
            <div className="atp-actions">
              <button type="button" className="atp-btn-secondary" onClick={() => navigate('/admin/products')}>
                Back to Products
              </button>
              <button type="button" className="atp-btn-primary" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content atp-page">

        <div className="atp-heading">
          <div>
            <h1>{isEdit ? 'Edit Textile Product' : 'Add Textile Product'}</h1>
            <p>Create the product once, then manage stock and pricing for every selected size.</p>
          </div>
          <button type="button" className="atp-btn-secondary" onClick={() => navigate('/admin/products')}>Back</button>
        </div>
        <div className="atp-csv-upload">
          <label>Import Products CSV</label>

          <input
            type="file"
            accept=".csv"
            onChange={handleCsvSelect}
          />

          <button
            type="button"
            className="atp-btn-primary"
            onClick={handleCsvUpload}
          >
            Upload CSV
          </button>
        </div>

        <form className="atp-form" onSubmit={handleSubmit}>
          <section className="atp-section">
            <h2>Product Details</h2>
            <div className="atp-grid">
              <label>Name<input value={base.name} onChange={(e) => updateBase('name', e.target.value)} />{errors.name && <small className="atp-field-error">{errors.name}</small>}</label>
              <label>Category<select value={base.category} onChange={(e) => updateBase('category', e.target.value)}><option value="">Select category</option>{Object.keys(config.categoryTree).map((item) => <option key={item}>{item}</option>)}</select>{errors.category && <small className="atp-field-error">{errors.category}</small>}</label>
              <label>Sub Category<select value={base.subCategory} disabled={!base.category} onChange={(e) => updateBase('subCategory', e.target.value)}><option value="">Select sub category</option>{subCategoryOptions.map((item) => <option key={item}>{item}</option>)}</select>{errors.subCategory && <small className="atp-field-error">{errors.subCategory}</small>}</label>
              {productTypeOptions.length > 0 && <label>{productTypeLabel}<select value={base.productType} onChange={(e) => updateBase('productType', e.target.value)}><option value="">Select {productTypeLabel.toLowerCase()}</option>{productTypeOptions.map((item) => <option key={item}>{item}</option>)}</select>{errors.productType && <small className="atp-field-error">{errors.productType}</small>}</label>}
              {styleOptions.length > 0 && <label>{styleLabel}<select value={base.sleeveOrStyle} onChange={(e) => updateBase('sleeveOrStyle', e.target.value)}><option value="">Select {styleLabel.toLowerCase()}</option>{styleOptions.map((item) => <option key={item}>{item}</option>)}</select>{errors.sleeveOrStyle && <small className="atp-field-error">{errors.sleeveOrStyle}</small>}</label>}
              <label>Material<select value={base.material} onChange={(e) => updateBase('material', e.target.value)}><option value="">Select material</option>{(config.materials || []).map((item) => <option key={item}>{item}</option>)}</select>{errors.material && <small className="atp-field-error">{errors.material}</small>}</label>
              <label>Brand<input value={base.brand} onChange={(e) => updateBase('brand', e.target.value)} />{errors.brand && <small className="atp-field-error">{errors.brand}</small>}</label>
              <div className="atp-color-field" ref={colorDropdownRef}>
                <label>Colors</label>
                <button
                  type="button"
                  className={`atp-color-trigger ${colorDropdownOpen ? 'open' : ''}`}
                  onClick={() => setColorDropdownOpen((open) => !open)}
                >
                  <span className="atp-color-trigger-text">
                    {base.colors.length
                      ? `${base.colors.length} color${base.colors.length > 1 ? 's' : ''} selected`
                      : 'Select colors'}
                  </span>
                  <span className="atp-color-trigger-arrow" />
                </button>

                {base.colors.length > 0 && (
                  <div className="atp-color-chips">
                    {base.colors.map((color) => (
                      <span className="atp-color-chip" key={color}>
                        <span
                          className="atp-color-chip-dot"
                          style={{ backgroundColor: colorSwatch(color) }}
                        />
                        {color}
                        <button type="button" onClick={() => toggleColor(color)} aria-label={`Remove ${color}`}>
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className={`atp-color-dropdown ${colorDropdownOpen ? 'open' : ''}`}>
                  <div className="atp-color-swatch-grid">
                    {(config.colors || []).map((color) => {
                      const selected = base.colors.includes(color);
                      return (
                        <button
                          type="button"
                          key={color}
                          className={`atp-color-swatch-btn ${selected ? 'selected' : ''}`}
                          onClick={() => toggleColor(color)}
                        >
                          <span
                            className="atp-color-swatch"
                            style={{ backgroundColor: colorSwatch(color) }}
                          >
                            {selected && <span className="atp-color-check">&#10003;</span>}
                          </span>
                          <span className="atp-color-swatch-label">{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {errors.colors && <small className="atp-field-error">{errors.colors}</small>}
              </div>
              <label>Status<select value={base.status} onChange={(e) => updateBase('status', e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
              <div className="atp-flags">
                <label>
                  <input
                    type="checkbox"
                    checked={base.isNewArrival}
                    onChange={(e) =>
                      updateBase("isNewArrival", e.target.checked)
                    }
                  />
                  New Arrival
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={base.isBestSeller}
                    onChange={(e) =>
                      updateBase("isBestSeller", e.target.checked)
                    }
                  />
                  Best Seller
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={base.isTrending}
                    onChange={(e) =>
                      updateBase("isTrending", e.target.checked)
                    }
                  />
                  Trending
                </label>

              </div>
            </div>
            <label className="atp-description">Description<textarea rows="3" value={base.description} onChange={(e) => updateBase('description', e.target.value)} /></label>

            <div className="atp-images-field">
              <label>Product Image URLs</label>
              <div className="atp-image-entry">
                <input
                  type="url"
                  value={imageUrl}
                  placeholder="https://example.com/product-image.jpg"
                  onChange={(event) => setImageUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <button type="button" className="atp-btn-secondary" onClick={addImageUrl}>
                  Add Image
                </button>
              </div>

              {base.images.length > 0 && (
                <div className="atp-image-list">
                  {base.images.map((url, index) => (
                    <div className="atp-image-item" key={`${url}-${index}`}>
                      <img src={url} alt={`${base.name || 'Product'} ${index + 1}`} />
                      <div>
                        <span>{url}</span>
                        <button type="button" onClick={() => removeImageUrl(index)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {!isEdit && (
            <section className="atp-section">
              <h2>Sizes</h2>
              <div className="atp-size-select">
                {sizeOptions.map((size) => (
                  <label key={size} className={selectedSizes.includes(size) ? 'selected' : ''}>
                    <input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} />
                    {size}
                  </label>
                ))}
              </div>
              {errors.sizes && <small className="atp-field-error">{errors.sizes}</small>}
            </section>
          )}

          {variants.length > 0 && (
            <>
              <section className="atp-section">
                <div className="atp-section-title-row"><h2>Apply To All Sizes</h2><button type="button" className="atp-btn-secondary" onClick={applyToAll}>Apply to all sizes</button></div>
                <div className="atp-apply-grid">
                  {['quantity', 'purchasePrice', 'wholesalePrice', 'retailPrice', 'mrp', 'gst', 'purchaseDate', 'manufacturingDate', 'rackLocation'].map((field) => (
                    <label key={field}>{field.replace(/([A-Z])/g, ' $1')}<input type={field === 'rackLocation' ? 'text' : DATE_FIELDS.includes(field) ? 'date' : 'number'} min={field === 'gst' ? 0 : undefined} max={field === 'gst' ? 28 : undefined} value={applyValues[field] ?? ''} onChange={(e) => setApplyValues((current) => ({ ...current, [field]: e.target.value }))} /></label>
                  ))}
                  <label>Supplier<input value={applyValues.supplierName} placeholder="Enter supplier name" onChange={(e) => setApplyValues((current) => ({ ...current, supplierName: e.target.value }))} /></label>
                  <label>Warehouse<input value={applyValues.warehouseName} placeholder="Enter warehouse name" onChange={(e) => setApplyValues((current) => ({ ...current, warehouseName: e.target.value }))} /></label>
                </div>
              </section>

              <section className="atp-section">
                <h2>Variant Stock</h2>
                <div className="atp-variant-wrap">
                  <table className="atp-variant-table">
                    <thead><tr><th>Size</th><th>SKU Preview</th><th>Qty</th>{isEdit && <th>Available</th>}<th>Purchase</th><th>Wholesale</th><th>Retail</th><th>MRP</th><th>GST</th><th>Purchase Date</th><th>Mfg Date</th><th>Supplier</th><th>Warehouse</th><th>Barcode</th><th>Rack</th></tr></thead>
                    <tbody>
                      {variants.map((variant, index) => (
                        <tr key={variant._id || variant.size}>
                          <td><strong>{variant.size}</strong>{errors[`variant-${index}`] && <small className="atp-field-error">{errors[`variant-${index}`]}</small>}</td>
                          <td className="atp-sku-cell">{variant.sku || skuPreview(base, variant.size)}</td>
                          <td><input type="number" min="0" value={variant.quantity ?? ''} onChange={(e) => updateVariant(index, 'quantity', e.target.value)} /></td>
                          {isEdit && <td><input type="number" min="0" value={variant.stockAvailable ?? ''} onChange={(e) => updateVariant(index, 'stockAvailable', e.target.value)} /></td>}
                          {['purchasePrice', 'wholesalePrice', 'retailPrice', 'mrp', 'gst'].map((field) => (
                            <td key={field}>
                              <input
                                type="number"
                                min="0"
                                max={field === 'gst' ? 28 : undefined}
                                value={variant[field] ?? ''}
                                onChange={(e) => updateVariant(index, field, e.target.value)}
                              />
                            </td>
                          ))}
                          <td><input type="date" value={variant.purchaseDate ? String(variant.purchaseDate).slice(0, 10) : ''} onChange={(e) => updateVariant(index, 'purchaseDate', e.target.value)} /></td>
                          <td><input type="date" value={variant.manufacturingDate ? String(variant.manufacturingDate).slice(0, 10) : ''} onChange={(e) => updateVariant(index, 'manufacturingDate', e.target.value)} /></td>
                          <td><input value={variant.supplierName || ''} placeholder="Supplier" onChange={(e) => updateVariant(index, 'supplierName', e.target.value)} /></td>
                          <td><input value={variant.warehouseName || ''} placeholder="Warehouse" onChange={(e) => updateVariant(index, 'warehouseName', e.target.value)} /></td>
                          <td><input value={variant.barcode || ''} placeholder="Auto generate" onChange={(e) => updateVariant(index, 'barcode', e.target.value)} /></td>
                          <td><input value={variant.rackLocation || ''} onChange={(e) => updateVariant(index, 'rackLocation', e.target.value)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          <div className="atp-actions">
            <button type="button" className="atp-btn-secondary" onClick={() => navigate('/admin/products')}>Cancel</button>
            <button type="submit" className="atp-btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product & Stock'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminTextileProductPage;
