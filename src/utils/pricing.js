// Pricing utility functions for discount and sale management

/**
 * Calculate discounted price based on original price and discount percentage
 * @param {number} originalPrice - The original price before discount
 * @param {number} discountPercentage - Discount percentage (0-100)
 * @param {boolean} isOnSale - Whether the item is currently on sale
 * @returns {number} The discounted price
 */
export const calculateDiscountedPrice = (originalPrice, discountPercentage, isOnSale = false) => {
  if (!isOnSale || !discountPercentage || discountPercentage <= 0) {
    return originalPrice;
  }
  
  const discount = Math.min(Math.max(discountPercentage, 0), 100); // Ensure 0-100 range
  return originalPrice * (1 - (discount / 100));
};

/**
 * Check if a sale is currently active based on start and end dates
 * @param {string|Date} saleStartDate - Sale start date
 * @param {string|Date} saleEndDate - Sale end date
 * @returns {boolean} Whether the sale is currently active
 */
export const isSaleActive = (saleStartDate, saleEndDate) => {
  const now = new Date();
  
  // If no dates are set, sale is always active when enabled
  if (!saleStartDate && !saleEndDate) return true;
  
  const start = saleStartDate ? new Date(saleStartDate) : null;
  const end = saleEndDate ? new Date(saleEndDate) : null;
  
  // Check if current time is before start date
  if (start && now < start) return false;
  
  // Check if current time is after end date
  if (end && now > end) return false;
  
  return true;
};

/**
 * Calculate the amount saved from original price to sale price
 * @param {number} originalPrice - Original price
 * @param {number} salePrice - Sale price
 * @returns {number} Amount saved
 */
export const calculateSavings = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || salePrice >= originalPrice) return 0;
  return originalPrice - salePrice;
};

/**
 * Get comprehensive sale status for a product
 * @param {Object} part - Product/part object
 * @returns {Object} Sale status information
 */
export const getSaleStatus = (part) => {
  if (!part) {
    return { 
      isOnSale: false, 
      isActive: false, 
      discountPercentage: 0, 
      savings: 0,
      originalPrice: 0,
      salePrice: 0
    };
  }

  const isOnSale = Boolean(part.is_on_sale);
  
  if (!isOnSale) {
    return {
      isOnSale: false,
      isActive: false,
      discountPercentage: 0,
      savings: 0,
      originalPrice: part.original_price || part.price || 0,
      salePrice: part.price || 0
    };
  }
  
  const isActive = isSaleActive(part.sale_start_date, part.sale_end_date);
  const originalPrice = part.original_price || part.price || 0;
  const salePrice = part.price || 0;
  const discountPercentage = part.discount_percentage || 0;
  const savings = calculateSavings(originalPrice, salePrice);
  
  return {
    isOnSale: true,
    isActive,
    discountPercentage,
    savings,
    originalPrice,
    salePrice,
    startDate: part.sale_start_date,
    endDate: part.sale_end_date
  };
};

/**
 * Format discount percentage for display
 * @param {number} percentage - Discount percentage
 * @returns {string} Formatted percentage string
 */
export const formatDiscountPercentage = (percentage) => {
  if (!percentage || percentage <= 0) return '';
  return `${Math.round(percentage)}%`;
};

/**
 * Check if a sale is ending soon (within 24 hours)
 * @param {string|Date} saleEndDate - Sale end date
 * @returns {boolean} Whether sale is ending soon
 */
export const isSaleEndingSoon = (saleEndDate) => {
  if (!saleEndDate) return false;
  
  const now = new Date();
  const end = new Date(saleEndDate);
  const hoursUntilEnd = (end - now) / (1000 * 60 * 60);
  
  return hoursUntilEnd > 0 && hoursUntilEnd <= 24;
};

/**
 * Get time remaining until sale ends
 * @param {string|Date} saleEndDate - Sale end date
 * @returns {Object} Time remaining object
 */
export const getTimeUntilSaleEnds = (saleEndDate) => {
  if (!saleEndDate) return null;
  
  const now = new Date();
  const end = new Date(saleEndDate);
  const diff = end - now;
  
  if (diff <= 0) return { expired: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    expired: false,
    days,
    hours,
    minutes,
    totalHours: Math.floor(diff / (1000 * 60 * 60))
  };
};
