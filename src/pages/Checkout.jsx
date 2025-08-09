import React, { useState, useEffect } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/useClerkAuth";
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ShoppingBag, CreditCard, Truck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shipping_address: {
      full_name: '',
      phone: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      country: 'UAE'
    },
    billing_address: {
      full_name: '',
      phone: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      country: 'UAE'
    },
    payment_method: 'cash_on_delivery',
    notes: '',
    use_shipping_for_billing: true
  });

  useEffect(() => {
    if (user?.clerk_user_id) {
      loadCartItems();
    }
  }, [user]);

  const loadCartItems = async () => {
    try {
      setIsLoading(true);
      const cartData = await supabaseHelpers.cart.getItems(user.clerk_user_id);
      setCartItems(cartData);
      
      if (cartData.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Your cart is empty. Add some items first.",
          variant: "destructive",
        });
        navigate(createPageUrl("BrowseParts"));
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      toast({
        title: "Error",
        description: "Could not load cart items.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.spare_parts?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    const taxRate = 0.05; // 5% VAT
    const taxAmount = subtotal * taxRate;
    const shippingCost = subtotal >= 100 ? 0 : 25; // Free shipping over AED 100
    const total = subtotal + taxAmount + shippingCost;
    
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const totals = calculateTotals();
      const billingAddress = formData.use_shipping_for_billing 
        ? formData.shipping_address 
        : formData.billing_address;

      // Create simplified order data with only essential fields
      const orderData = {
        clerk_user_id: user.clerk_user_id,
        user_email: user.email,
        total_amount: parseFloat(totals.total),
        status: 'pending',
        // Store address and payment info in a single notes field for now
        notes: `Payment: ${formData.payment_method}\nShipping: ${JSON.stringify(formData.shipping_address)}\nOrder Notes: ${formData.notes || 'None'}`
      };

      const order = await supabaseHelpers.orders.create(orderData);
      
      // Create order items
      for (const item of cartItems) {
        await supabaseHelpers.orders.createOrderItem({
          order_id: order.id,
          spare_part_id: item.spare_part_id,
          quantity: item.quantity,
          unit_price: item.spare_parts.price,
          total_price: item.spare_parts.price * item.quantity,
          part_name: item.spare_parts.name,
          part_number: item.spare_parts.part_number
        });
      }

      // Clear cart
      await supabaseHelpers.cart.clearCart(user.clerk_user_id);

      toast({
        title: "Order Placed Successfully!",
        description: `Your order has been placed. Order ID: ${order.id}`,
      });

      navigate(createPageUrl("MyOrders"));
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Order Failed",
        description: "Could not place your order. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading checkout...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const totals = calculateTotals();

  return (
    <ProtectedRoute>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to={createPageUrl("Cart")} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Checkout</h1>
            <p className="text-slate-600">Complete your order</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Order Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shipping_full_name">Full Name</Label>
                        <Input
                          id="shipping_full_name"
                          value={formData.shipping_address.full_name}
                          onChange={(e) => handleInputChange('shipping_address', 'full_name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping_phone">Phone</Label>
                        <Input
                          id="shipping_phone"
                          value={formData.shipping_address.phone}
                          onChange={(e) => handleInputChange('shipping_address', 'phone', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="shipping_address_1">Address Line 1</Label>
                      <Input
                        id="shipping_address_1"
                        value={formData.shipping_address.address_line_1}
                        onChange={(e) => handleInputChange('shipping_address', 'address_line_1', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipping_address_2">Address Line 2 (Optional)</Label>
                      <Input
                        id="shipping_address_2"
                        value={formData.shipping_address.address_line_2}
                        onChange={(e) => handleInputChange('shipping_address', 'address_line_2', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shipping_city">City</Label>
                        <Input
                          id="shipping_city"
                          value={formData.shipping_address.city}
                          onChange={(e) => handleInputChange('shipping_address', 'city', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping_state">State/Emirate</Label>
                        <Input
                          id="shipping_state"
                          value={formData.shipping_address.state}
                          onChange={(e) => handleInputChange('shipping_address', 'state', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="payment_method"
                          value="cash_on_delivery"
                          checked={formData.payment_method === 'cash_on_delivery'}
                          onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span>Cash on Delivery</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="payment_method"
                          value="bank_transfer"
                          checked={formData.payment_method === 'bank_transfer'}
                          onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span>Bank Transfer</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Notes */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Order Notes (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Any special instructions for your order..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg sticky top-8">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cart Items */}
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex-1">
                            <p className="font-medium">{item.spare_parts?.name}</p>
                            <p className="text-slate-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">AED {(item.spare_parts?.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>AED {totals.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT (5%):</span>
                        <span>AED {totals.taxAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>AED {totals.shippingCost}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>AED {totals.total}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-green-600 hover:bg-green-700 mt-6"
                    >
                      {isSubmitting ? "Placing Order..." : "Place Order"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
