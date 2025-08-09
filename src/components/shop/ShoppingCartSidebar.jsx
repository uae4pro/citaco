
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { CartItem } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ShoppingCartSidebar({ open, onClose, cartItems, parts, onUpdateCart, user }) {
  const [updating, setUpdating] = useState({});

  const getPartDetails = (cartItem) => {
    return parts.find(part => part.id === cartItem.spare_part_id);
  };

  const updateQuantity = async (cartItem, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(cartItem);
      return;
    }

    setUpdating(prev => ({ ...prev, [cartItem.id]: true }));
    try {
      await CartItem.update(cartItem.id, { quantity: newQuantity });
      await onUpdateCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
    setUpdating(prev => ({ ...prev, [cartItem.id]: false }));
  };

  const removeItem = async (cartItem) => {
    setUpdating(prev => ({ ...prev, [cartItem.id]: true }));
    try {
      await CartItem.delete(cartItem.id);
      await onUpdateCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
    setUpdating(prev => ({ ...prev, [cartItem.id]: false }));
  };

  const cartTotal = cartItems.reduce((total, cartItem) => {
    const part = getPartDetails(cartItem);
    return total + (part ? part.price * cartItem.quantity : 0);
  }, 0);

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Shopping Cart</h2>
                <p className="text-sm text-slate-500">{totalItems} items</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Your cart is empty</h3>
                  <p className="text-slate-600 mb-4">Add some parts to get started</p>
                  <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((cartItem) => {
                    const part = getPartDetails(cartItem);
                    if (!part) return null;

                    const isUpdating = updating[cartItem.id];

                    return (
                      <motion.div
                        key={cartItem.id}
                        layout
                        className="bg-slate-50 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border">
                            {part.image_url ? (
                              <img 
                                src={part.image_url} 
                                alt={part.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <ShoppingBag className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 text-sm line-clamp-2">
                              {part.name}
                            </h4>
                            <p className="text-xs text-slate-500">#{part.part_number}</p>
                            <p className="text-sm font-bold text-slate-900 mt-1">
                              ${part.price.toFixed(2)}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(cartItem)}
                            disabled={isUpdating}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(cartItem, cartItem.quantity - 1)}
                              disabled={isUpdating}
                              className="w-8 h-8"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {cartItem.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(cartItem, cartItem.quantity + 1)}
                              disabled={isUpdating || cartItem.quantity >= part.stock_quantity}
                              className="w-8 h-8"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <p className="font-bold text-slate-900">
                            AED {(part.price * cartItem.quantity).toFixed(2)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-200 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-900">Total:</span>
                  <span className="text-xl font-bold text-slate-900">
                    AED {cartTotal.toFixed(2)}
                  </span>
                </div>

                <Link to={createPageUrl("Checkout")} className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onClose}>
                    Proceed to Checkout
                  </Button>
                </Link>

                <Button variant="outline" className="w-full" onClick={onClose}>
                  Continue Shopping
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
