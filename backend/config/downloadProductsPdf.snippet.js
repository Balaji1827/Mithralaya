    // ============================================================
// ADD THIS TO textileProductController.js
// ============================================================
//
// 1. npm install pdfkit --save   (in your backend folder)
// 2. Add near the top of textileProductController.js:
//      const PDFDocument = require('pdfkit');
// 3. Paste the function below anywhere among your other exported
//    handlers (e.g. right after downloadProductsCreatedByExcel).
// 4. Add `downloadProductsPdf` to the module.exports list at the
//    bottom of the file.
// 5. Wire a route for it — same pattern as your existing Excel
//    report route, e.g. in your product routes file:
//      router.get(
//        '/textile/report/products/pdf',
//        protect, admin,
//        downloadProductsPdf
//      );
//    (adjust the path/middleware names to match whatever you used
//    for the existing '.../created-by/excel' route.)
// ============================================================

// Product Information PDF — lists every active textile product with its
// ID, name, unit price, stock quantity, and supplier, styled to match the
// reference design (colored logo squares top-right, light lavender header
// row, orange Product ID column, clean row separators).
//
// Price and stock live on ProductVariant, not the top-level product (same
// fact already established for the Excel report and the storefront price
// display) — so for each product we take the lowest active variant's
// retail price as "Unit Price" and sum stockAvailable across variants for
// "Stock Qty", exactly like listTextileProducts already does for the
// storefront/admin table.
const downloadProductsPdf = asyncHandler(async (req, res) => {
  const products = await TextileProduct.find({ status: { $ne: 'DELETED' } })
    .sort({ createdAt: -1 })
    .lean();

  const productIds = products.map((p) => p._id);
  const variants = await ProductVariant.find({
    productId: { $in: productIds },
    status: 'ACTIVE'
  }).lean();

  const variantsByProduct = new Map();
  variants.forEach((v) => {
    const key = v.productId.toString();
    if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
    variantsByProduct.get(key).push(v);
  });

  const rows = products.map((product) => {
    const pv = variantsByProduct.get(product._id.toString()) || [];
    const prices = pv.map((v) => Number(v.retailPrice) || 0).filter(Boolean);
    const unitPrice = prices.length ? Math.min(...prices) : 0;
    const stockQty = pv.reduce((sum, v) => sum + (Number(v.stockAvailable) || 0), 0);
    const supplier = pv[0]?.supplierName || product.supplierName || 'N/A';

    return {
      id: product._id.toString().slice(-6).toUpperCase(),
      name: product.name,
      unitPrice,
      stockQty,
      supplier
    };
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=product-information.pdf');

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  // ---- header: title + 4-square logo mark ----
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const headerY = doc.y;

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#1a1a1a')
    .text('Product Information', doc.page.margins.left, headerY);

  // small 2x2 colored logo squares, top-right, mirroring the reference image
  const logoSize = 10;
  const logoGap = 2;
  const logoX = doc.page.margins.left + pageWidth - (logoSize * 2 + logoGap) - 55;
  const logoY = headerY;
  const logoColors = ['#e53935', '#fbc02d', '#43a047', '#1e88e5']; // red, yellow, green, blue
  [
    [logoX, logoY],
    [logoX + logoSize + logoGap, logoY],
    [logoX, logoY + logoSize + logoGap],
    [logoX + logoSize + logoGap, logoY + logoSize + logoGap]
  ].forEach(([x, y], i) => {
    doc.rect(x, y, logoSize, logoSize).fill(logoColors[i]);
  });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#555')
    .text('Logo', logoX + (logoSize * 2 + logoGap) + 6, logoY + 2);

  doc.moveDown(2.5);

  // ---- table ----
  const colWidths = { id: 70, name: 150, price: 90, stock: 80, supplier: pageWidth - 70 - 150 - 90 - 80 };
  const startX = doc.page.margins.left;
  let y = doc.y + 10;

  const drawHeaderRow = (rowY) => {
    doc.rect(startX, rowY, pageWidth, 22).fill('#eceaf6');
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#2b2140');
    let x = startX + 8;
    doc.text('Product ID', x, rowY + 6, { width: colWidths.id });
    x += colWidths.id;
    doc.text('Product Name', x, rowY + 6, { width: colWidths.name });
    x += colWidths.name;
    doc.text('Unit Price', x, rowY + 6, { width: colWidths.price });
    x += colWidths.price;
    doc.text('Stock Qty', x, rowY + 6, { width: colWidths.stock });
    x += colWidths.stock;
    doc.text('Supplier', x, rowY + 6, { width: colWidths.supplier });
    return rowY + 22;
  };

  y = drawHeaderRow(y);
  doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#ddd').stroke();

  const rowHeight = 24;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  rows.forEach((row) => {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      y = drawHeaderRow(y);
      doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#ddd').stroke();
    }

    let x = startX + 8;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#e07a1f');
    doc.text(row.id, x, y + 7, { width: colWidths.id });

    x += colWidths.id;
    doc.font('Helvetica').fontSize(9.5).fillColor('#222');
    doc.text(row.name, x, y + 7, { width: colWidths.name });

    x += colWidths.name;
    doc.text(`$${row.unitPrice.toFixed(2)}`, x, y + 7, { width: colWidths.price });

    x += colWidths.price;
    doc.text(String(row.stockQty), x, y + 7, { width: colWidths.stock });

    x += colWidths.stock;
    doc.fillColor('#444').text(row.supplier, x, y + 7, { width: colWidths.supplier });

    y += rowHeight;
    doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#eee').stroke();
  });

  doc.end();
});

// Don't forget to add `downloadProductsPdf` to module.exports at the
// bottom of textileProductController.js, alongside downloadProductsCreatedByExcel.