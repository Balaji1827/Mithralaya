import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminDashboardPage';
import {
  getCategories,
  getProduct,
  createProduct,
  updateProduct
} from '../../services/productService';
import "../../css/adminProductEdit.css";

const AdminProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [categories, setCategories] = useState([]);
const [product, setProduct] = useState({
  name: "",
  slug: "",
  category: "",
  subCategory: "",
  productType: "",
  sleeveOrStyle: "",
  material: "",
  brand: "BullRise",

  purchasePrice: 0,
  wholesalePrice: 0,
  retailPrice: 0,
  mrp: 0,
  gst: 0,
  stock: 0,

  colors: [],
  images: [],
  isNewArrival: false,
  isBestSeller: false,
  isTrending: false
});

  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    const load = async () => {
      const cats = await getCategories();
      setCategories(cats);

      if (!isNew && id) {
        const p = await getProduct(id);

        setProduct({
          _id: p._id,
          name: p.name || "",
          slug: p.slug || "",
          description: p.description || "",

          category: p.category || "",
          subCategory: p.subCategory || "",
          productType: p.productType || "",
          sleeveOrStyle: p.sleeveOrStyle || "",
          material: p.material || "",

          sizes: p.sizes?.join(",") || "",
          colors: p.colors?.join(",") || "",

          images: p.images || [],

          purchasePrice: p.purchasePrice || 0,
          wholesalePrice: p.wholesalePrice || 0,
          retailPrice: p.retailPrice || 0,
          mrp: p.mrp || 0,
          gst: p.gst || 5,

          stock: p.stock || 0,

          supplierName: p.supplierName || "BullRise Textiles",
          warehouseName: p.warehouseName || "BullRise Main Warehouse",
          rackLocation: p.rackLocation || "",

          isTrending: !!p.isTrending,
          isNewArrival: !!p.isNewArrival,
          isBestSeller: !!p.isBestSeller
        });
      }
    };

    load();
  }, [id, isNew]);



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

   
    // CATEGORY CHANGED
    if (name === "category") {
      setProduct((prev) => ({
        ...prev,
        category: value,
        subCategory: "",
        productType: "",
        sleeveOrStyle: "",
        material: ""
      }));
    }

    // SUB CATEGORY CHANGED
    else if (name === "subCategory") {
      setProduct((prev) => ({
        ...prev,
        subCategory: value,
        productType: "",
        sleeveOrStyle: "",
        material: ""
      }));
    }

    // PRODUCT TYPE CHANGED
    else if (name === "productType") {
      setProduct((prev) => ({
        ...prev,
        productType: value,
        sleeveOrStyle: ""
      }));
    }

    // STYLE CHANGED
   else if (name === "sleeveOrStyle") {
    setProduct(prev => ({
        ...prev,
        sleeveOrStyle: value
    }));
}
    // MATERIAL CHANGED
    else if (name === "material") {
      setProduct((prev) => ({
        ...prev,
        material: value
      }));
    }

    // CHECKBOXES & OTHER INPUTS
    else {
      setProduct((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    const url = imageUrlInput.trim();
    if (!url) return;
    setProduct((prev) => ({
      ...prev,
      images: [...(prev.images || []), url]
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (index) => {
    setProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    const payload = {
      name: product.name,
      slug: product.slug,
      description: product.description,

      category: product.category,
      subCategory: product.subCategory,
      productType: product.productType,
      sleeveOrStyle: product.sleeveOrStyle,

      material: product.material,

      purchasePrice: Number(product.purchasePrice),
      wholesalePrice: Number(product.wholesalePrice),
      retailPrice: Number(product.retailPrice),
      mrp: Number(product.mrp),
      gst: Number(product.gst),

      stock: Number(product.stock),

      supplierName: product.supplierName,
      warehouseName: product.warehouseName,
      rackLocation: product.rackLocation,

      images: product.images,

      sizes: product.sizes
        .split(",")
        .map(x => x.trim())
        .filter(Boolean),

      colors: product.colors
        .split(",")
        .map(x => x.trim())
        .filter(Boolean),

      isTrending: product.isTrending,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller
    };


    try {
      if (isNew) {
        await createProduct(payload);
      } else {
        await updateProduct(product._id, payload);
      }
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

const selectedCategory = categories.find(
    (c) => c.name?.trim() === product.category?.trim()
);

const selectedSubCategories = selectedCategory
    ? selectedCategory.subCategories
    : [];

  useEffect(() => {
}, [categories]);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <h1>{isNew ? 'Add Product' : 'Edit Product'}</h1>

        <form className="admin-form" onSubmit={handleSubmit}>
          {/* BASIC INFO */}
          <div className="form-row">
            <label>Name</label>
            <input
              name="name"
              value={product.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Slug (URL-friendly)</label>
            <input
              name="slug"
              value={product.slug}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <label>Sleeve / Style</label>
            <input
              name="sleeveOrStyle"
              value={product.sleeveOrStyle}
              onChange={handleChange}
            />
          </div>

          {/* PRICING & STOCK */}
          <div className="form-row grid">
         

            <div>
              <label>Purchase Price</label>
              <input
                type="number"
                name="purchasePrice"
                value={product.purchasePrice}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Wholesale Price</label>
              <input
                type="number"
                name="wholesalePrice"
                value={product.wholesalePrice}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Retail Price</label>
              <input
                type="number"
                name="retailPrice"
                value={product.retailPrice}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>MRP</label>
              <input
                type="number"
                name="mrp"
                value={product.mrp}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>GST</label>
              <input
                type="number"
                name="gst"
                value={product.gst}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Stock</label>
              <input
                type="number"
                name="stock"
                value={product.stock}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* CATEGORY DROPDOWN */}
          <div className="form-row">
            <label>Category</label>
            <select
              name="category"
              value={product.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>

              {categories.map(category => (
              <option key={category._id} value={category.name}>
    {category.name}
</option>
              ))}
            </select>
          </div>

          {/* SUBCATEGORY */}
          <div className="form-row">
            <label>Sub Category</label>
            <select
              name="subCategory"
              value={product.subCategory}
              onChange={handleChange}
              disabled={!product.category}
              required
            >
              <option value="">Select Sub Category</option>

              {selectedSubCategories.map(sub => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
          {/* PRODUCT */}
          <div className="form-row">
            <label>Product Type</label>
            <input
              name="productType"
              value={product.productType}
              onChange={handleChange}
              placeholder="Optional product type"
            />
          </div>

          {/* STYLE
          <div className="form-row">
            <label>Style</label>
            <input
name="sleeveOrStyle"
value={product.sleeveOrStyle}
onChange={handleChange}
/>
          </div> */}
          <div className="form-row">
            <label>Material</label>
            <input
              name="material"
              value={product.material}
              onChange={handleChange}
              placeholder="Cotton, denim, fleece..."
            />
          </div>

          {/* SIZES & COLORS */}
          <div className="form-row grid">
            <div>
              <label>Sizes (comma separated)</label>
              <input
                name="sizes"
                value={product.sizes}
                onChange={handleChange}
                placeholder="S,M,L,XL"
              />
            </div>
            <div>
              <label>Colors (comma separated)</label>
              <input
                name="colors"
                value={product.colors}
                onChange={handleChange}
                placeholder="Black, White"
              />
            </div>
          </div>

          {/* FLAGS */}
          <div className="form-row">
            <label>Flags</label>
            <div className="checkbox-row">
              <label>
                <input
                  type="checkbox"
                  name="isNewArrival"
                  checked={product.isNewArrival}
                  onChange={handleChange}
                />
                New Arrival
              </label>
              <label>
                <input
                  type="checkbox"
                  name="isBestSeller"
                  checked={product.isBestSeller}
                  onChange={handleChange}
                />
                Best Seller
              </label>
              <label>
                <input
                  type="checkbox"
                  name="isTrending"
                  checked={product.isTrending}
                  onChange={handleChange}
                />
                Trending
              </label>
            </div>
          </div>

          {/* IMAGE URL INPUT INSTEAD OF FILE UPLOAD */}
          <div className="form-row">
            <label>Product Images (External URLs)</label>
            <div
              style={{
                display: 'block',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}
            >
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                style={{ flex: 1 }}
              /><br></br>
              <button className="btn-secondary" onClick={handleAddImageUrl}>
                Add
              </button>
            </div>
            <div className="admin-image-list">
              {product.images?.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt={`product-${i}`} />
                  <button
                    type="button"
                    className="link-button danger"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleRemoveImage(i)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit">
            Save Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProductEditPage;
