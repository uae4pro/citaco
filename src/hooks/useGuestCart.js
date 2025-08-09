import { useState, useEffect } from 'react';

const GUEST_CART_KEY = 'citaco_guest_cart';

export const useGuestCart = () => {
  const [guestCartItems, setGuestCartItems] = useState([]);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);
    if (savedCart) {
      try {
        setGuestCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading guest cart:', error);
        localStorage.removeItem(GUEST_CART_KEY);
      }
    }
  }, []);

  // Save guest cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCartItems));
  }, [guestCartItems]);

  const addToGuestCart = (part, quantity = 1) => {
    setGuestCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.spare_part_id === part.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.spare_part_id === part.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, {
          spare_part_id: part.id,
          part_name: part.name,
          part_price: part.price,
          part_image: part.image_urls?.[0] || null,
          quantity: quantity,
          added_date: new Date().toISOString()
        }];
      }
    });
  };

  const updateGuestCartQuantity = (partId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromGuestCart(partId);
      return;
    }

    setGuestCartItems(prevItems =>
      prevItems.map(item =>
        item.spare_part_id === partId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromGuestCart = (partId) => {
    setGuestCartItems(prevItems =>
      prevItems.filter(item => item.spare_part_id !== partId)
    );
  };

  const clearGuestCart = () => {
    setGuestCartItems([]);
    localStorage.removeItem(GUEST_CART_KEY);
  };

  const getGuestCartTotal = () => {
    return guestCartItems.reduce((total, item) => {
      return total + (item.part_price * item.quantity);
    }, 0);
  };

  const getGuestCartItemCount = () => {
    return guestCartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getGuestCartQuantity = (partId) => {
    const item = guestCartItems.find(item => item.spare_part_id === partId);
    return item ? item.quantity : 0;
  };

  // Transfer guest cart to authenticated user cart
  const transferGuestCartToUser = async (supabaseHelpers, userId, userEmail) => {
    try {
      for (const item of guestCartItems) {
        await supabaseHelpers.cart.addItem(
          userId, 
          userEmail, 
          item.spare_part_id, 
          item.quantity
        );
      }
      clearGuestCart();
      console.log('✅ Guest cart transferred to user account');
    } catch (error) {
      console.error('❌ Error transferring guest cart:', error);
      throw error;
    }
  };

  return {
    guestCartItems,
    addToGuestCart,
    updateGuestCartQuantity,
    removeFromGuestCart,
    clearGuestCart,
    getGuestCartTotal,
    getGuestCartItemCount,
    getGuestCartQuantity,
    transferGuestCartToUser
  };
};
