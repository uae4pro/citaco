import React, { useState, useEffect } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useClerkAuth.jsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, Calendar, Coins, Truck, Eye, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/utils/currency";

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      if (!user?.clerk_user_id) {
        setIsLoading(false);
        return;
      }

      const ordersData = await supabaseHelpers.orders.getUserOrders(user.clerk_user_id);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
      // Fallback to empty array if no orders
      setOrders([]);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Using imported formatCurrency utility

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">My Orders</h1>
            <p className="text-slate-600">Track your order history and status</p>
          </div>

          {orders.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-16">
                <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No orders yet</h3>
                <p className="text-slate-600 mb-6">Start shopping to see your orders here</p>
                <Link to={createPageUrl("BrowseParts")}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Browse Parts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          Order #{order.order_number}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(order.created_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4" />
                            {formatCurrency(order.total_amount)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        {order.status === 'shipped' && (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Truck className="w-4 h-4" />
                            Tracking available
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900">Items ({order.items?.length || 0})</h4>
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                          <div>
                            <p className="font-medium text-slate-900">{item.part_name}</p>
                            <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                      
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
                          <span>Tax:</span>
                          <span>{formatCurrency(order.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                          <span>Shipping:</span>
                          <span>{formatCurrency(order.shipping_cost)}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold text-slate-900 text-lg border-t border-slate-200 pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
