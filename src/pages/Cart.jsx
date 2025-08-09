
import React, { useState, useEffect } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/useClerkAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const { user, isAuthenticated } = useAuth();
  const {
    guestCartItems,
    updateGuestCartQuantity,
    removeFromGuestCart,
    getGuestCartTotal
  } = useGuestCart();

  useEffect(() => {
    if (user?.clerk_user_id) {
      loadData();
    } else {
      // For guest users, we'll use guestCartItems directly
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!user?.clerk_user_id) {
        setIsLoading(false);
        return;
      }

      const cartData = await supabaseHelpers.cart.getItems(user.clerk_user_id);
      setCartItems(cartData);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
    setIsLoading(false);
  };

  const getPartDetails = (cartItem) => {
    // Cart items from Supabase already include part details
    return cartItem.spare_parts;
  };

  const updateQuantity = async (cartItem, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(cartItem);
      return;
    }

    setUpdating(prev => ({ ...prev, [cartItem.id]: true }));
    try {
      await supabaseHelpers.cart.updateQuantity(user.clerk_user_id, cartItem.spare_part_id, newQuantity);
      await loadData();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
    setUpdating(prev => ({ ...prev, [cartItem.id]: false }));
  };

  const removeItem = async (cartItem) => {
    setUpdating(prev => ({ ...prev, [cartItem.id]: true }));
    try {
      await supabaseHelpers.cart.removeItem(user.clerk_user_id, cartItem.spare_part_id);
      await loadData();
    } catch (error) {
      console.error("Error removing item:", error);
    }
    setUpdating(prev => ({ ...prev, [cartItem.id]: false }));
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border-b">
                <div className="w-16 h-16 bg-slate-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Use guest cart for unauthenticated users, regular cart for authenticated users
  const displayCartItems = isAuthenticated ? cartItems : guestCartItems;
  const cartTotal = isAuthenticated
    ? cartItems.reduce((total, cartItem) => {
        const part = getPartDetails(cartItem);
        return total + (part ? part.price * cartItem.quantity : 0);
      }, 0)
    : getGuestCartTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Shopping Cart</h1>
          <p className="text-slate-600">Review your selected parts</p>
        </div>

        {displayCartItems.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="text-center py-16">
              <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h3>
              <p className="text-slate-600 mb-6">Browse our catalog to find the parts you need</p>
              <Link to={createPageUrl("BrowseParts")}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Browse Parts
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Cart Items ({displayCartItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {displayCartItems.map((cartItem) => {
                    const part = isAuthenticated ? getPartDetails(cartItem) : {
                      id: cartItem.spare_part_id,
                      name: cartItem.part_name,
                      price: cartItem.part_price,
                      image_url: cartItem.part_image
                    };
                    if (!part) return null;

                    const isUpdating = updating[cartItem.id || cartItem.spare_part_id];

                    return (
                      <div key={cartItem.id} className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border">
                          {part.image_url ? (
                            <img 
                              src={part.image_url} 
                              alt={part.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <ShoppingBag className="w-8 h-8 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900">{part.name}</h4>
                          <p className="text-sm text-slate-500">Part #{part.part_number}</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">
                            AED {part.price.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => isAuthenticated
                                ? updateQuantity(cartItem, cartItem.quantity - 1)
                                : updateGuestCartQuantity(cartItem.spare_part_id, cartItem.quantity - 1)
                              }
                              disabled={isUpdating}
                              className="w-8 h-8"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {cartItem.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => isAuthenticated
                                ? updateQuantity(cartItem, cartItem.quantity + 1)
                                : updateGuestCartQuantity(cartItem.spare_part_id, cartItem.quantity + 1)
                              }
                              disabled={isUpdating}
                              className="w-8 h-8"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              AED {(part.price * cartItem.quantity).toFixed(2)}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => isAuthenticated
                              ? removeItem(cartItem)
                              : removeFromGuestCart(cartItem.spare_part_id)
                            }
                            disabled={isUpdating}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="shadow-lg sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">AED {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="font-semibold">Free</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-xl font-bold text-blue-600">
                        AED {cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {isAuthenticated ? (
                    <Link to={createPageUrl("Checkout")} className="block">
                      <Button className="w-full bg-green-600 hover:bg-green-700 mt-4">
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/sign-in" className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                        Sign In to Checkout
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}

                  <Link to={createPageUrl("BrowseParts")}>
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
