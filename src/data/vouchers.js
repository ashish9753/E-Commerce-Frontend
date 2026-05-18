export const vouchers = [
  { code: 'DASHAIN50', discount: 50, type: 'percentage', maxDiscount: 5000, minPurchase: 20000, category: null, expiry: '2025-12-31', usageLimit: 100, used: 42, description: 'Dashain special - 50% off on select appliances' },
  { code: 'WELCOME10', discount: 10, type: 'percentage', maxDiscount: 2000, minPurchase: 5000, category: null, expiry: '2025-12-31', usageLimit: 1000, used: 234, description: 'Welcome offer for new customers' },
  { code: 'FLAT500', discount: 500, type: 'fixed', maxDiscount: 500, minPurchase: 10000, category: null, expiry: '2025-11-30', usageLimit: 500, used: 128, description: 'Flat Rs. 500 off on orders above Rs. 10,000' },
  { code: 'AC20', discount: 20, type: 'percentage', maxDiscount: 8000, minPurchase: 30000, category: 'Air Conditioners', expiry: '2025-10-31', usageLimit: 200, used: 67, description: '20% off on Air Conditioners' },
  { code: 'SUMMER25', discount: 25, type: 'percentage', maxDiscount: 6000, minPurchase: 15000, category: null, expiry: '2025-09-30', usageLimit: 300, used: 89, description: 'Summer sale - 25% off' },
];

export const validateVoucher = (code, cartTotal, category = null) => {
  const voucher = vouchers.find(v => v.code === code.toUpperCase().trim());
  if (!voucher) return { valid: false, error: 'Invalid voucher code' };

  const now = new Date();
  const expiry = new Date(voucher.expiry);
  if (now > expiry) return { valid: false, error: 'Voucher has expired' };

  if (voucher.used >= voucher.usageLimit) return { valid: false, error: 'Voucher usage limit reached' };

  if (cartTotal < voucher.minPurchase) return { valid: false, error: `Minimum purchase of Rs. ${voucher.minPurchase.toLocaleString()} required` };

  if (voucher.category && category && voucher.category !== category) return { valid: false, error: `This voucher is only for ${voucher.category}` };

  let discountAmount = 0;
  if (voucher.type === 'percentage') {
    discountAmount = Math.min((cartTotal * voucher.discount) / 100, voucher.maxDiscount);
  } else {
    discountAmount = voucher.discount;
  }

  return { valid: true, discount: Math.round(discountAmount), voucher };
};
