const formatPrice = (value) => {
  const number = Number(value);

  if (isNaN(number)) {
    return '₹0.00'; // ✅ safe fallback
  }

  return `₹${number.toFixed(2)}`;
};

export default formatPrice;
