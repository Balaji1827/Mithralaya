const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const TextileProduct = require('../models/TextileProduct');
const ProductVariant = require('../models/ProductVariant');
const StockMovement = require('../models/StockMovement');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ============================================================
// Razorpay setup
// ============================================================
// key_id / key_secret must live in backend/.env — NEVER hardcode them here
// and NEVER send key_secret to the frontend. Only key_id (public) is sent
// back to the client, inside createRazorpayOrder's response.
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ============================================================
// Shared helper: resolve the shipping address to use for an order
// ============================================================
const resolveShippingAddress = (user, addressId) => {
  let selectedAddr = null;
  if (addressId) {
    selectedAddr = user.addresses.id(addressId);
  }
  if (!selectedAddr) {
    selectedAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
  }
  return selectedAddr;
};

// ============================================================
// Shared helper: build orderItems + pricing from the user's current cart.
// Used by BOTH createRazorpayOrder (to know the amount to charge) and
// verifyRazorpayPayment (to persist the order) so the two stay in sync.
//
// NOTE: shippingPrice below (itemsPrice < 999 ? 49 : 0) now matches what
// CheckoutPage.jsx *shows* the customer. The old COD code charged ₹50
// while the UI displayed ₹49 — harmless for COD (no money moved upfront),
// but it would have meant charging customers ₹1 more than the price shown
// once real payment is involved, so it's fixed here.
// ============================================================
const buildOrderItemsAndPricing = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).lean();

  if (!cart || cart.items.length === 0) {
    const err = new Error('No items in cart');
    err.statusCode = 400;
    throw err;
  }

  const legacyIds = cart.items
    .filter((item) => (item.productModel || 'Product') === 'Product')
    .map((item) => item.product);
  const textileIds = cart.items
    .filter((item) => item.productModel === 'TextileProduct')
    .map((item) => item.product);

  const [legacyProducts, textileProducts] = await Promise.all([
    Product.find({ _id: { $in: legacyIds } }).lean(),
    TextileProduct.find({ _id: { $in: textileIds } }).lean()
  ]);
  const legacyMap = new Map(legacyProducts.map((product) => [String(product._id), product]));
  const textileMap = new Map(textileProducts.map((product) => [String(product._id), product]));

  const orderItems = [];
  for (const item of cart.items) {
    const isTextile = item.productModel === 'TextileProduct';
    const product = isTextile
      ? textileMap.get(String(item.product))
      : legacyMap.get(String(item.product));

    if (!product) {
      const err = new Error('A cart product is no longer available');
      err.statusCode = 400;
      throw err;
    }

    if (isTextile) {
      const variant = await ProductVariant.findOne({
        _id: item.variant,
        productId: product._id,
        status: 'ACTIVE'
      });
      if (!variant || variant.stockAvailable < item.qty) {
        const err = new Error(`${product.name} (${item.size}) does not have enough stock`);
        err.statusCode = 400;
        throw err;
      }
      orderItems.push({
        product: product._id,
        productModel: 'TextileProduct',
        variant: variant._id,
        name: product.name,
        qty: item.qty,
        price: variant.retailPrice,
        size: item.size,
        color: item.color,
        image: product.images?.[0]
      });
    } else {
      orderItems.push({
        product: product._id,
        productModel: 'Product',
        name: product.name,
        qty: item.qty,
        price: product.price,
        size: item.size,
        color: item.color,
        image: product.images?.[0]
      });
    }
  }

  const itemsPrice = orderItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  const shippingPrice = itemsPrice < 999 ? 49 : 0;
  const taxPrice = Math.round(itemsPrice * 0.05);

  return { orderItems, itemsPrice, shippingPrice, taxPrice };
};

// Clamp a client-supplied discount to a sane, non-negative range so it can
// never push the payable amount below ₹1 or above the pre-discount total.
// NOTE: this app has no server-side Coupon model yet, so — same as the
// pre-existing behaviour — the discount amount itself is still trusted
// from the client. This clamp only stops it from being abused to create a
// ₹0 / negative order; it does not validate the coupon was legitimately
// earned. If/when a Coupon collection exists, re-derive the discount from
// it here instead of trusting req.body.discount.
const clampDiscount = (discount, preDiscountTotal) => {
  const n = Number(discount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, preDiscountTotal - 1);
};

// ============================================================
// STEP 1 — Create a Razorpay order for the current cart total.
// Frontend calls this first, then opens Razorpay Checkout with the
// returned razorpayOrderId.
// ============================================================
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { addressId, discount } = req.body || {};

  const selectedAddr = resolveShippingAddress(user, addressId);
  if (!selectedAddr) {
    res.status(400);
    throw new Error('Please add a shipping address in your profile first');
  }

  const { itemsPrice, shippingPrice, taxPrice } = await buildOrderItemsAndPricing(req.user._id);
  const preDiscountTotal = itemsPrice + shippingPrice + taxPrice;
  const safeDiscount = clampDiscount(discount, preDiscountTotal);
  const totalPrice = Math.max(preDiscountTotal - safeDiscount, 1);

  const razorpayOrder = await razorpayInstance.orders.create({
    amount: Math.round(totalPrice * 100), // paise
    currency: 'INR',
    receipt: `rcpt_${req.user._id}_${Date.now()}`,
    notes: {
      userId: String(req.user._id),
      addressId: String(selectedAddr._id)
    }
  });

  res.json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discount: safeDiscount,
    totalPrice
  });
});

// ============================================================
// STEP 2 — Verify the Razorpay payment signature, then create the Order.
// The order is ONLY ever created here, after a verified payment — there is
// no more "place order without paying" path, i.e. no COD.
// ============================================================
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    addressId,
    discount,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  } = req.body || {};

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400);
    throw new Error('Online payment verification details are missing');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    res.status(400);
    throw new Error('Payment verification failed. If any amount was deducted, it will be auto-refunded by Razorpay.');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const selectedAddr = resolveShippingAddress(user, addressId);
  if (!selectedAddr) {
    res.status(400);
    throw new Error('Please add a shipping address in your profile first');
  }

  // Recompute from the CURRENT cart — never trust totals from the client.
  const { orderItems, itemsPrice, shippingPrice, taxPrice } = await buildOrderItemsAndPricing(req.user._id);
  const preDiscountTotal = itemsPrice + shippingPrice + taxPrice;
  const safeDiscount = clampDiscount(discount, preDiscountTotal);
  const totalPrice = Math.max(preDiscountTotal - safeDiscount, 1);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  const orderId = `ORD-${dateStr}-${randomStr}`;

  const shippingAddress = {
    fullName: selectedAddr.fullName,
    phone: selectedAddr.phone,
    addressLine1: selectedAddr.address,
    addressLine2: selectedAddr.locality || selectedAddr.landmark || '',
    city: selectedAddr.city,
    state: selectedAddr.state,
    pincode: selectedAddr.pincode,
    addressId: selectedAddr._id?.toString(),
    suggestedName: selectedAddr.suggestedName || ''
  };

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: 'Razorpay',
    paymentResult: {
      id: razorpayPaymentId,
      status: 'captured',
      update_time: new Date().toISOString(),
      email_address: user.email || ''
    },
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    orderId,
    status: 'Placed',
    isPaid: true,
    paidAt: Date.now()
  });

  for (const item of orderItems.filter((orderItem) => orderItem.productModel === 'TextileProduct')) {
    const variant = await ProductVariant.findOneAndUpdate(
      { _id: item.variant, stockAvailable: { $gte: item.qty } },
      { $inc: { stockAvailable: -item.qty } },
      { new: true }
    );
    if (!variant) {
      // Payment already succeeded — do NOT silently delete the order (that
      // would strand a captured payment with no order). Flag it instead so
      // an admin can sort out a partial refund / manual fulfilment.
      order.status = 'Processing';
      order.cancelReason = `Stock changed after payment for ${item.name} (${item.size}) — needs manual review`;
      await order.save();
      continue;
    }
    await StockMovement.create({
      productId: item.product,
      variantId: variant._id,
      warehouseId: variant.warehouseId,
      type: 'ADJUSTMENT_OUT',
      quantity: item.qty,
      balanceAfter: variant.stockAvailable,
      note: `Order ${order.orderId}`,
      createdBy: req.user._id
    });
  }

  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(201).json(order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate({
      path: 'orderItems.product',
      select: 'name images price'
    })
    .sort({ createdAt: -1 });
  res.json(orders);
});

// ============================================================
// Shared search/filter builder — used by getAllOrders, downloadOrdersExcel,
// AND downloadOrdersPdf (what the admin sees on screen, and both export
// formats), so every export always matches whatever's currently
// searched/filtered on screen.
//
// SEARCH SCOPE:
//   - Order ID
//   - Customer name/email — FIX: the old inline filter tried to regex
//     match 'user.name' / 'user.email' directly on Order documents, but
//     `order.user` is just an unpopulated ObjectId reference at query
//     time, so that condition could never match anything (silently
//     broken). Now resolved properly via a User lookup first, same
//     pattern used for the product "created by" search fix.
//   - Guest checkout name — many orders have `user: null` with the
//     customer's name only in `shippingAddress.fullName` (see the sample
//     data — several orders are guest checkouts). Matched directly since
//     it's embedded on the Order document itself.
//   - Items — product name/size/color within orderItems (embedded array,
//     so a direct regex on orderItems.name/size/color works)
//   - Status — direct regex on the status field
//   - Payment method — direct regex
//   - Price — totalPrice / itemsPrice, matched as a string so "899" or
//     partial "89" both work, same approach used for product price search
// ============================================================
const buildOrderFilter = async ({ search, date, month } = {}) => {
  const conditions = [];

  if (search) {
    const words = String(search).trim().split(/\s+/).filter(Boolean);

    for (const word of words) {
      const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Customer: resolve matching Users first (proper fix — see note above)
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: safe, $options: 'i' } },
          { email: { $regex: safe, $options: 'i' } }
        ]
      }).select('_id').lean();
      const matchingUserIds = matchingUsers.map((u) => u._id);

      conditions.push({
        $or: [
          { orderId: { $regex: safe, $options: 'i' } },
          { status: { $regex: safe, $options: 'i' } },
          { paymentMethod: { $regex: safe, $options: 'i' } },
          { 'shippingAddress.fullName': { $regex: safe, $options: 'i' } },
          { 'shippingAddress.phone': { $regex: safe, $options: 'i' } },
          { 'orderItems.name': { $regex: safe, $options: 'i' } },
          { 'orderItems.size': { $regex: safe, $options: 'i' } },
          { 'orderItems.color': { $regex: safe, $options: 'i' } },
          {
            $expr: {
              $regexMatch: { input: { $toString: '$totalPrice' }, regex: safe, options: 'i' }
            }
          },
          {
            $expr: {
              $regexMatch: { input: { $toString: '$itemsPrice' }, regex: safe, options: 'i' }
            }
          },
          ...(matchingUserIds.length ? [{ user: { $in: matchingUserIds } }] : [])
        ]
      });
    }
  }

  const filter = conditions.length ? { $and: conditions } : {};

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    filter.createdAt = { $gte: startDate, $lt: endDate };
  }

  if (month) {
    const [year, monthNum] = month.split('-');
    const startMonth = new Date(year, monthNum - 1, 1);
    const endMonth = new Date(year, monthNum, 1);
    filter.createdAt = { $gte: startMonth, $lt: endMonth };
  }

  return filter;
};

const getAllOrders = asyncHandler(async (req, res) => {
  const { search, date, month } = req.query;
  const filter = await buildOrderFilter({ search, date, month });

  const orders = await Order.find(filter).populate('user', 'name email');
  res.json(orders);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const { isPaid, isDelivered, status } = req.body;

  if (isPaid !== undefined) {
    order.isPaid = isPaid;
    order.paidAt = isPaid ? Date.now() : null;
  }

  if (isDelivered !== undefined) {
    order.isDelivered = isDelivered;
    order.deliveredAt = isDelivered ? Date.now() : null;
  }

  if (status) {
    order.status = status;
    // Auto-update isDelivered if status is Delivered
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
  }

  const updated = await order.save();
  res.json(updated);
});

// ✅ User / admin can cancel an order with a reason
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only owner or admin can cancel
  if (
    !req.user.isAdmin &&
    order.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Prevent cancelling if already shipped / delivered / cancelled
  if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
    res.status(400);
    throw new Error('Order can no longer be cancelled');
  }

  const { reason } = req.body;

  order.status = 'Cancelled';
  order.cancelReason = reason || '';
  order.cancelledAt = Date.now();

  for (const item of order.orderItems.filter(
    (orderItem) => orderItem.productModel === 'TextileProduct' && orderItem.variant
  )) {
    const variant = await ProductVariant.findByIdAndUpdate(
      item.variant,
      { $inc: { stockAvailable: item.qty } },
      { new: true }
    );
    if (variant) {
      await StockMovement.create({
        productId: item.product,
        variantId: variant._id,
        warehouseId: variant.warehouseId,
        type: 'ADJUSTMENT_IN',
        quantity: item.qty,
        balanceAfter: variant.stockAvailable,
        note: `Cancelled order ${order.orderId}`,
        createdBy: req.user._id
      });
    }
  }

  // NOTE: this order was paid online (Razorpay) — cancelling here only
  // updates order status and restocks items. It does NOT issue a refund.
  // Wire up Razorpay's refund API (razorpayInstance.payments.refund) here
  // if you want cancellations to auto-refund.

  const updated = await order.save();
  res.json(updated);
});

const deleteMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  await order.deleteOne();
  res.json({ message: 'Order removed from history' });
});

// ✅ Delete entire order history for current user
const deleteMyOrderHistory = asyncHandler(async (req, res) => {
  await Order.deleteMany({ user: req.user._id });
  res.json({ message: 'Order history cleared' });
});

// ✅ Admin can delete any order
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  await order.deleteOne();
  res.json({ message: 'Order deleted successfully' });
});

// Public: Track order by public orderId (e.g., ORD-20251201-1234)
const trackOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    res.status(400);
    throw new Error('OrderId is required');
  }

  const order = await Order.findOne({ orderId })
    .populate({ path: 'orderItems.product', select: 'name images' })
    .populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Return limited tracking info
  res.json({
    orderId: order.orderId,
    status: order.status,
    isPaid: order.isPaid,
    isDelivered: order.isDelivered,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deliveredAt: order.deliveredAt || null,
    orderItems: order.orderItems.map((it) => ({
      product: it.product?._id || it.product,
      productModel: it.productModel,
      name: it.name,
      qty: it.qty,
      price: it.price,
      size: it.size,
      color: it.color,
      image: it.image
    })),
    shippingAddress: order.shippingAddress,
    itemsPrice: order.itemsPrice,
    shippingPrice: order.shippingPrice,
    taxPrice: order.taxPrice,
    totalPrice: order.totalPrice,
    user: order.user ? { name: order.user.name, email: order.user.email } : null
  });
});

const downloadOrdersExcel = asyncHandler(async (req, res) => {
  const { search, date, month } = req.query;
  const filter = await buildOrderFilter({ search, date, month });

  const orders = await Order.find(filter).populate('user', 'name email');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders');

  worksheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 20 },
    { header: 'User Email', key: 'userEmail', width: 30 },
    { header: 'Total Price', key: 'totalPrice', width: 15 },
    { header: 'Paid', key: 'isPaid', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Placed At', key: 'createdAt', width: 20 },
    { header: 'Cancel Reason', key: 'cancelReason', width: 20 }
  ];

  orders.forEach(order => {
    worksheet.addRow({
      orderId: order.orderId,
      userEmail: order.user?.email || '',
      totalPrice: order.totalPrice,
      isPaid: order.isPaid ? 'Yes' : 'No',
      status: order.status,
      createdAt: new Date(order.createdAt).toLocaleString(),
      cancelReason: order.status === 'Cancelled' ? (order.cancelReason || '') : ''
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

// Orders PDF — same visual design as the Product Information PDF (title +
// 4-square logo mark, lavender header row, landscape layout, filtered
// subtitle) so both reports feel like the same system.
//
// ⭐ Respects the current search/filter/date-range — uses the exact same
// buildOrderFilter() as getAllOrders/downloadOrdersExcel, so if the admin
// has searched or filtered by date/month on screen, only those matching
// orders get exported, not the entire order history every time.
//
// Columns: Order ID, Customer, Items, Payment, Status, Total, Date.
const downloadOrdersPdf = asyncHandler(async (req, res) => {
  const { search, date, month } = req.query;
  const filter = await buildOrderFilter({ search, date, month });

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  const rows = orders.map((order) => {
    const customerName = order.user?.name || order.shippingAddress?.fullName || 'Guest';
    const customerSub = order.user?.email || order.shippingAddress?.phone || '';

    const items = order.orderItems || [];
    const firstItem = items[0];
    const itemsText = firstItem
      ? `${firstItem.name}${firstItem.size ? ` (${firstItem.size})` : ''} x${firstItem.qty}` +
        (items.length > 1 ? `  +${items.length - 1} more` : '')
      : 'No items';

    return {
      orderId: order.orderId,
      customerName,
      customerSub,
      itemsText,
      paymentMethod: order.paymentMethod || '-',
      isPaid: order.isPaid ? 'Paid' : 'Unpaid',
      status: order.status || 'Placed',
      total: Number(order.totalPrice) || 0,
      date: new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
    };
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.pdf');

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;
  const headerY = doc.page.margins.top;

  // ---- title + logo mark (matches Product Information PDF) ----
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor('#1a1a1a')
    .text('Order Report', startX, headerY);

  const logoSize = 9;
  const logoGap = 2;
  const logoX = startX + pageWidth - (logoSize * 2 + logoGap) - 50;
  const logoColors = ['#e53935', '#fbc02d', '#43a047', '#1e88e5'];
  [
    [logoX, headerY],
    [logoX + logoSize + logoGap, headerY],
    [logoX, headerY + logoSize + logoGap],
    [logoX + logoSize + logoGap, headerY + logoSize + logoGap]
  ].forEach(([x, y], i) => {
    doc.rect(x, y, logoSize, logoSize).fill(logoColors[i]);
  });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#555')
    .text('Logo', logoX + (logoSize * 2 + logoGap) + 5, headerY + 1);

  // Subtitle shows active filters so it's clear this may be a filtered export
  const filterBits = [];
  if (search) filterBits.push(`Search: "${String(search).trim()}"`);
  if (date) filterBits.push(`Date: ${date}`);
  if (month) filterBits.push(`Month: ${month}`);
  const filterText = filterBits.length ? ` — ${filterBits.join(', ')}` : '';
  const subtitleText = `Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${filterText} — ${rows.length} orders`;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#888')
    .text(subtitleText, startX, headerY + 24);

  // ---- table column layout ----
  const cols = [
    { key: 'orderId', label: 'Order ID', width: 95 },
    { key: 'customer', label: 'Customer', width: 150 },
    { key: 'items', label: 'Items', width: 190 },
    { key: 'payment', label: 'Payment', width: 90 },
    { key: 'status', label: 'Status', width: 75 },
    { key: 'total', label: 'Total', width: 70 },
    { key: 'date', label: 'Date', width: 75 }
  ];

  let y = headerY + 46;

  const drawHeaderRow = (rowY) => {
    doc.rect(startX, rowY, pageWidth, 20).fill('#eceaf6');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#2b2140');
    let x = startX + 6;
    cols.forEach((col) => {
      doc.text(col.label, x, rowY + 6, { width: col.width - 6 });
      x += col.width;
    });
    return rowY + 20;
  };

  y = drawHeaderRow(y);
  doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#ddd').stroke();

  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  const statusColors = {
    Placed: '#64748b',
    Processing: '#b45309',
    Shipped: '#1d4ed8',
    Delivered: '#15803d',
    Cancelled: '#b91c1c',
    Rejected: '#b91c1c'
  };

  if (rows.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor('#888')
      .text('No orders match this search.', startX, y + 12);
  }

  rows.forEach((row) => {
    doc.font('Helvetica').fontSize(8);
    const itemsHeight = doc.heightOfString(row.itemsText, { width: cols[2].width - 6 });
    doc.font('Helvetica-Bold').fontSize(8.5);
    const customerHeight = doc.heightOfString(row.customerName, { width: cols[1].width - 6 });
    const rowHeight = Math.max(itemsHeight, customerHeight, 14) + 18;

    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      y = drawHeaderRow(y);
      doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#ddd').stroke();
    }

    let x = startX + 6;

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#e07a1f');
    doc.text(row.orderId, x, y + 6, { width: cols[0].width - 6 });
    x += cols[0].width;

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#222');
    doc.text(row.customerName, x, y + 6, { width: cols[1].width - 6 });
    if (row.customerSub) {
      doc.font('Helvetica').fontSize(7).fillColor('#888');
      doc.text(row.customerSub, x, y + 18, { width: cols[1].width - 6 });
    }
    x += cols[1].width;

    doc.font('Helvetica').fontSize(8).fillColor('#444');
    doc.text(row.itemsText, x, y + 6, { width: cols[2].width - 6 });
    x += cols[2].width;

    doc.font('Helvetica').fontSize(8).fillColor('#333');
    doc.text(row.paymentMethod, x, y + 6, { width: cols[3].width - 6 });
    doc.fillColor(row.isPaid === 'Paid' ? '#15803d' : '#b91c1c').fontSize(7.5);
    doc.text(row.isPaid, x, y + 18, { width: cols[3].width - 6 });
    x += cols[3].width;

    doc.font('Helvetica-Bold').fontSize(8).fillColor(statusColors[row.status] || '#64748b');
    doc.text(row.status, x, y + 6, { width: cols[4].width - 6 });
    x += cols[4].width;

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#222');
    doc.text(`Rs.${row.total.toFixed(2)}`, x, y + 6, { width: cols[5].width - 6 });
    x += cols[5].width;

    doc.font('Helvetica').fontSize(8).fillColor('#555');
    doc.text(row.date, x, y + 6, { width: cols[6].width - 6 });

    y += rowHeight;
    doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#eee').stroke();
  });

  doc.end();
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
  cancelOrder,
  deleteMyOrder,
  deleteMyOrderHistory,
  deleteOrder,
  downloadOrdersExcel,
  downloadOrdersPdf
};