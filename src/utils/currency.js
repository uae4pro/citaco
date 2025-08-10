// Currency formatting utility for AED
export const formatCurrency = (amount, options = {}) => {
  const {
    showSymbol = true,
    useNewSymbol = false, // Set to true to use ₯ symbol
    locale = 'en-AE' // UAE English locale
  } = options;

  // Handle null, undefined, or invalid amounts
  if (amount === null || amount === undefined || isNaN(amount)) {
    return useNewSymbol ? '₯0.00' : 'AED 0.00';
  }

  const numAmount = Number(amount);

  if (useNewSymbol) {
    // Using new AED symbol ₯
    return `₯${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount)}`;
  } else {
    // Using traditional "AED" text
    return `AED ${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount)}`;
  }
};

// Alternative: Just the number with AED prefix (backward compatibility)
export const formatAED = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'AED 0.00';
  }
  return `AED ${Number(amount).toFixed(2)}`;
};

// Format currency for different contexts
export const formatCurrencyCompact = (amount, options = {}) => {
  const { useNewSymbol = false } = options;
  
  if (amount === null || amount === undefined || isNaN(amount)) {
    return useNewSymbol ? '₯0' : 'AED 0';
  }

  const numAmount = Number(amount);
  
  if (numAmount >= 1000000) {
    const millions = numAmount / 1000000;
    return useNewSymbol 
      ? `₯${millions.toFixed(1)}M` 
      : `AED ${millions.toFixed(1)}M`;
  } else if (numAmount >= 1000) {
    const thousands = numAmount / 1000;
    return useNewSymbol 
      ? `₯${thousands.toFixed(1)}K` 
      : `AED ${thousands.toFixed(1)}K`;
  } else {
    return formatCurrency(numAmount, options);
  }
};

// Get currency symbol only
export const getCurrencySymbol = (useNewSymbol = false) => {
  return useNewSymbol ? '₯' : 'AED';
};

// Parse currency string back to number
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remove currency symbols and text, keep only numbers and decimal point
  const cleanString = currencyString
    .replace(/[₯AEDاد.إ]/g, '')
    .replace(/[^\d.-]/g, '')
    .trim();
    
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};
