const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Order = require('../models/Order');

// GET /api/users/me  (current user profile)
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
});

// PUT /api/users/me  (update current user profile)
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, mobile, gender, dateOfBirth, whatsappOptIn } = req.body;

  if (name !== undefined) user.name = name;
  if (mobile !== undefined) user.mobile = mobile;
  if (gender !== undefined) user.gender = gender;
  if (dateOfBirth !== undefined) {
    user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
  }
  if (whatsappOptIn !== undefined) user.whatsappOptIn = whatsappOptIn;

  const updated = await user.save();
  const sanitized = updated.toObject();
  delete sanitized.password;

  res.json(sanitized);
});

const getUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;

  let filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  if (role === "admin") {
    filter.isAdmin = true;
  }

  if (role === "user") {
    filter.isAdmin = false;
  }

  const users = await User.find(filter).select("-password");

  res.json(users);
});

// Shared filter for the Customers report — mirrors AdminCustomer.jsx's
// client-side search box, which matches name/email/phone/address/city/
// state/pincode. getUsers above only searches name/email; this extends
// that same idea to the other fields so the PDF export reflects what the
// admin is actually able to filter for on screen.
const buildCustomerFilter = (search) => {
  const base = { isAdmin: false };
  if (!search) return base;

  const safe = String(search).trim();
  return {
    ...base,
    $or: [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
      { phone: { $regex: safe, $options: 'i' } },
      { 'addresses.pincode': { $regex: safe, $options: 'i' } },
      { 'addresses.city': { $regex: safe, $options: 'i' } },
      { 'addresses.state': { $regex: safe, $options: 'i' } },
      { 'addresses.address': { $regex: safe, $options: 'i' } }
    ]
  };
};

// Picks the default address if one is marked, otherwise the first
// address on file — same logic as getPrimaryAddress in AdminCustomer.jsx.
const getPrimaryAddress = (customer) => {
  if (!customer.addresses?.length) return null;
  return customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
};

// Customer Report PDF — same visual design as the Product Information and
// Order Report PDFs (title + 4-square logo, lavender header row, landscape
// layout, filtered subtitle).
//
// ⭐ Respects the current search — reuses buildCustomerFilter so if the
// admin searched for something on the Customers page, the export only
// contains matching customers, not everyone.
//
// Columns: Name, Email, Phone, DOB, Address, Pincode, Orders, Joined.
// Order count/total per customer is pulled from the Order collection
// (matched by order.user, same as AdminCustomer.jsx's client-side
// loadOrderCounts) since that data doesn't live on the User document.
const downloadCustomersPdf = asyncHandler(async (req, res) => {
  const filter = buildCustomerFilter(req.query.search);

  const customers = await User.find(filter).select('-password').lean();
  const customerIds = customers.map((c) => c._id);

  const orders = await Order.find({ user: { $in: customerIds } })
    .select('user totalPrice')
    .lean();

  const orderStats = {};
  orders.forEach((order) => {
    const uid = String(order.user);
    if (!orderStats[uid]) orderStats[uid] = { count: 0, total: 0 };
    orderStats[uid].count += 1;
    orderStats[uid].total += order.totalPrice || 0;
  });

  const rows = customers.map((c) => {
    const addr = getPrimaryAddress(c);
    const stats = orderStats[String(c._id)];
    return {
      name: c.name || '-',
      email: c.email || '-',
      phone: c.phone || '-',
      dob: c.dateOfBirth
        ? new Date(c.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-',
      address: addr?.address || '-',
      cityState: addr ? [addr.city, addr.state].filter(Boolean).join(', ') : '',
      pincode: addr?.pincode || '-',
      ordersText: stats ? `${stats.count} · Rs.${stats.total.toFixed(2)}` : '0',
      joined: c.createdAt
        ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-'
    };
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=customer-report.pdf');

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;
  const headerY = doc.page.margins.top;

  // ---- title + logo mark (matches Product Information / Order Report PDFs) ----
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor('#1a1a1a')
    .text('Customer Report', startX, headerY);

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

  const searchTerm = req.query.search ? String(req.query.search).trim() : '';
  const subtitleText = searchTerm
    ? `Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — Search: "${searchTerm}" — ${rows.length} customers`
    : `Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — ${rows.length} customers`;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#888')
    .text(subtitleText, startX, headerY + 24);

  // ---- table column layout ----
  const cols = [
    { key: 'name', label: 'Name', width: 90 },
    { key: 'email', label: 'Email', width: 145 },
    { key: 'phone', label: 'Phone', width: 75 },
    { key: 'dob', label: 'Date of Birth', width: 80 },
    { key: 'address', label: 'Address', width: 165 },
    { key: 'pincode', label: 'Pincode', width: 55 },
    { key: 'orders', label: 'Orders', width: 90 },
    { key: 'joined', label: 'Joined', width: 75 }
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

  if (rows.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor('#888')
      .text('No customers match this search.', startX, y + 12);
  }

  rows.forEach((row) => {
    doc.font('Helvetica').fontSize(8);
    const addressHeight = doc.heightOfString(row.address, { width: cols[4].width - 6 });
    const rowHeight = Math.max(addressHeight, 14) + (row.cityState ? 26 : 18);

    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      y = drawHeaderRow(y);
      doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#ddd').stroke();
    }

    let x = startX + 6;

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#222');
    doc.text(row.name, x, y + 6, { width: cols[0].width - 6 });
    x += cols[0].width;

    doc.font('Helvetica').fontSize(7.8).fillColor('#333');
    doc.text(row.email, x, y + 6, { width: cols[1].width - 6 });
    x += cols[1].width;

    doc.text(row.phone, x, y + 6, { width: cols[2].width - 6 });
    x += cols[2].width;

    doc.text(row.dob, x, y + 6, { width: cols[3].width - 6 });
    x += cols[3].width;

    doc.text(row.address, x, y + 6, { width: cols[4].width - 6 });
    if (row.cityState) {
      doc.fillColor('#888').fontSize(7);
      doc.text(row.cityState, x, y + 6 + addressHeight + 2, { width: cols[4].width - 6 });
    }
    x += cols[4].width;

    doc.font('Helvetica').fontSize(7.8).fillColor('#333');
    doc.text(row.pincode, x, y + 6, { width: cols[5].width - 6 });
    x += cols[5].width;

    doc.font('Helvetica-Bold').fontSize(7.8).fillColor('#1e5f2e');
    doc.text(row.ordersText, x, y + 6, { width: cols[6].width - 6 });
    x += cols[6].width;

    doc.font('Helvetica').fontSize(7.8).fillColor('#555');
    doc.text(row.joined, x, y + 6, { width: cols[7].width - 6 });

    y += rowHeight;
    doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#eee').stroke();
  });

  doc.end();
});

module.exports = {
  // ... your existing exports
  getMe,
  updateMe,
  getUsers,
  downloadCustomersPdf
};