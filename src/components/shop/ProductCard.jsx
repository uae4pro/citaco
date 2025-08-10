
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package } from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { getSaleStatus } from "@/utils/pricing";
import SaleBadge from "@/components/ui/SaleBadge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProductCard({ part, onAddToCart, cartQuantity, isAuthenticated = true }) {
  const navigate = useNavigate();
  const saleStatus = getSaleStatus(part);

  const categoryColors = {
    engine: "bg-red-100 text-red-800",
    transmission: "bg-blue-100 text-blue-800",
    brakes: "bg-orange-100 text-orange-800",
    suspension: "bg-purple-100 text-purple-800",
    electrical: "bg-yellow-100 text-yellow-800",
    body: "bg-green-100 text-green-800",
    interior: "bg-pink-100 text-pink-800",
    exhaust: "bg-gray-100 text-gray-800",
    cooling: "bg-cyan-100 text-cyan-800",
    fuel_system: "bg-indigo-100 text-indigo-800",
    accessory: "bg-emerald-100 text-emerald-800"
  };

  const isLowStock = part.stock_quantity < 5;
  const isOutOfStock = part.stock_quantity === 0;

  const handleCardClick = () => {
    navigate(createPageUrl(`ProductDetails?id=${part.id}`));
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    onAddToCart(part);
  };

  const imageUrl = part.image_urls && part.image_urls.length > 0 ? part.image_urls[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className="cursor-pointer"
    >
      <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-0 overflow-hidden flex flex-col">
        <CardHeader className="p-0">
          <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-xl flex items-center justify-center">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={part.name}
                className="w-full h-full object-cover rounded-t-xl"
              />
            ) : (
              <Package className="w-16 h-16 text-slate-400" />
            )}
            
            <div className="absolute top-3 left-3">
              {isOutOfStock ? (
                <Badge className="bg-red-500 text-white">Out of Stock</Badge>
              ) : isLowStock ? (
                <Badge className="bg-orange-500 text-white">Low Stock</Badge>
              ) : null}
            </div>

            <div className="absolute top-3 right-3">
              <Badge className={`${categoryColors[part.category] || 'bg-gray-100 text-gray-800'}`}>
                {part.category.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-grow flex flex-col">
          <div className="flex-grow">
            <div className="mb-4">
              <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-2">
                {part.name}
              </h3>
              <p className="text-sm text-slate-500 mb-2">Part #{part.part_number}</p>
              {part.brand && (
                <p className="text-sm font-medium text-blue-600">{part.brand}</p>
              )}
            </div>

            {part.description && (
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {part.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                {saleStatus.isOnSale && saleStatus.isActive ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(part.price)}
                      </p>
                      <SaleBadge discountPercentage={part.discount_percentage} />
                    </div>
                    <p className="text-lg text-slate-500 line-through">
                      {formatCurrency(part.original_price)}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      You save {formatCurrency(saleStatus.savings)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(part.original_price || part.price)}
                  </p>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  Stock: {part.stock_quantity}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mt-auto">
            <Button
              onClick={handleAddToCartClick}
              disabled={isOutOfStock}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            
            {cartQuantity > 0 && (
              <p className="text-center text-sm text-green-600 font-medium">
                {cartQuantity} in cart
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
