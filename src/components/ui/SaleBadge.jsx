import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDiscountPercentage } from '@/utils/pricing';

/**
 * SaleBadge component for displaying discount information
 * @param {number} discountPercentage - Discount percentage (0-100)
 * @param {string} className - Additional CSS classes
 * @param {string} variant - Badge variant (default: destructive for red color)
 * @param {string} size - Badge size
 * @param {boolean} showText - Whether to show "OFF" text
 * @returns {JSX.Element|null} Sale badge component or null if no discount
 */
export default function SaleBadge({ 
  discountPercentage, 
  className = "", 
  variant = "destructive",
  size = "default",
  showText = true
}) {
  // Don't render if no valid discount
  if (!discountPercentage || discountPercentage <= 0) {
    return null;
  }
  
  const formattedPercentage = formatDiscountPercentage(discountPercentage);
  const displayText = showText ? `${formattedPercentage} OFF` : formattedPercentage;
  
  return (
    <Badge 
      variant={variant}
      className={`bg-red-500 hover:bg-red-600 text-white font-bold border-red-500 ${className}`}
    >
      -{displayText}
    </Badge>
  );
}

/**
 * Large sale badge for prominent display
 */
export function LargeSaleBadge({ discountPercentage, className = "" }) {
  return (
    <SaleBadge 
      discountPercentage={discountPercentage}
      className={`text-lg px-3 py-1 ${className}`}
      showText={true}
    />
  );
}

/**
 * Small sale badge for compact display
 */
export function SmallSaleBadge({ discountPercentage, className = "" }) {
  return (
    <SaleBadge 
      discountPercentage={discountPercentage}
      className={`text-xs px-2 py-0.5 ${className}`}
      showText={false}
    />
  );
}

/**
 * Sale countdown badge showing time remaining
 */
export function SaleCountdownBadge({ saleEndDate, className = "" }) {
  const [timeRemaining, setTimeRemaining] = React.useState(null);
  
  React.useEffect(() => {
    if (!saleEndDate) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(saleEndDate);
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeRemaining({ expired: true });
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining({ hours, minutes, expired: false });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [saleEndDate]);
  
  if (!timeRemaining || timeRemaining.expired) {
    return null;
  }
  
  const { hours, minutes } = timeRemaining;
  let displayText = '';
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    displayText = `${days}d left`;
  } else if (hours > 0) {
    displayText = `${hours}h ${minutes}m left`;
  } else {
    displayText = `${minutes}m left`;
  }
  
  return (
    <Badge 
      variant="outline"
      className={`bg-orange-100 text-orange-800 border-orange-300 font-medium ${className}`}
    >
      ⏰ {displayText}
    </Badge>
  );
}
