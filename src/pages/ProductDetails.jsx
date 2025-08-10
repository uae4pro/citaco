
import React, { useState, useEffect } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/useClerkAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package, ChevronLeft, Plus, Minus, CheckCircle, XCircle, Wrench, PackageCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { formatCurrency } from "@/utils/currency";

export default function ProductDetails() {
  const [part, setPart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const {
    addToGuestCart,
    getGuestCartQuantity
  } = useGuestCart();

  const urlParams = new URLSearchParams(window.location.search);
  const partId = urlParams.get('id');

  useEffect(() => {
    const loadData = async () => {
      if (!partId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const partData = await supabaseHelpers.parts.getById(partId);
        setPart(partData);
        // Added safe navigation operator for partData.image_urls
        if (partData?.image_urls?.length > 0) {
          setSelectedImage(partData.image_urls[0]);
        }

        // Load cart data only if user is authenticated
        if (user?.clerk_user_id) {
          const cartData = await supabaseHelpers.cart.getItems(user.clerk_user_id);
          setCartItems(cartData);
        }
        // For guest users, cart quantity will be handled by getGuestCartQuantity
      } catch (error) {
        console.error("Error loading product details:", error);
      }
      setIsLoading(false);
    };

    loadData();
  }, [partId, user]);

  const handleQuantityChange = (amount) => {
    setQuantity(prev => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (part && newQuantity > part.stock_quantity) return part.stock_quantity;
      return newQuantity;
    });
  };

  const addToCart = async () => {
    if (!part) {
      toast({
        title: "Error",
        description: "Product information not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (user?.clerk_user_id) {
        // Authenticated user - add to database cart
        const existingCartItem = cartItems.find(item => item.spare_part_id === part.id);

        if (existingCartItem) {
          await supabaseHelpers.cart.updateQuantity(user.clerk_user_id, part.id, existingCartItem.quantity + quantity);
        } else {
          await supabaseHelpers.cart.addItem(user.clerk_user_id, user.email, part.id, quantity);
        }

        // Reload cart items state
        const updatedCartData = await supabaseHelpers.cart.getItems(user.clerk_user_id);
        setCartItems(updatedCartData);
      } else {
        // Guest user - add to local storage cart
        addToGuestCart(part, quantity);
      }

      toast({
        title: "Added to Cart",
        description: `${quantity} x ${part.name} added to cart.`,
      });

    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Could not add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLowStock = part && part.stock_quantity > 0 && part.stock_quantity < 5;
  const isOutOfStock = part && part.stock_quantity === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="container mx-auto">
          <Skeleton className="h-8 w-48 mb-12" />
          <div className="grid md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-16 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 flex-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-center p-8">
        <div>
          <Package className="w-24 h-24 text-slate-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
          <p className="text-slate-600 mb-6">The part you're looking for doesn't exist.</p>
          <Link to={createPageUrl("BrowseParts")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to All Parts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="mb-8">
            <Link to={createPageUrl("BrowseParts")}>
              <Button variant="ghost">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to All Parts
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Image Column */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-8">
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mb-4">
                  {selectedImage ? (
                    <img 
                      src={selectedImage} 
                      alt={part.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : part.image_urls && part.image_urls.length > 0 ? ( // Added fallback for when selectedImage is null
                    <img
                      src={part.image_urls[0]}
                      alt={part.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package className="w-24 h-24 text-slate-400" />
                  )}
                </div>
                {/* Preserved 'overflow-x-auto pb-2' on parent and 'flex-shrink-0' on child to maintain horizontal scroll and prevent image shrinking */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {part.image_urls && part.image_urls.map((url, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-16 h-16 rounded-md cursor-pointer border-2 ${selectedImage === url ? 'border-blue-500' : 'border-transparent'}`}
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Details Column */}
            <div className="md:col-span-3">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {part.brand}
                  </Badge>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant="secondary">
                    {part.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
                
                <h1 className="text-4xl font-bold text-slate-900">{part.name}</h1>
                <p className="text-slate-500">Part #{part.part_number}</p>
                <p className="text-4xl font-bold text-blue-600">{formatCurrency(part.price)}</p>

                <p className="text-slate-600 text-lg leading-relaxed">
                  {part.description}
                </p>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Specifications</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="font-medium text-slate-500">Weight:</span> {part.weight} Kgs</div>
                        <div><span className="font-medium text-slate-500">Dimensions:</span> {part.dimensions}</div>
                        <div className="col-span-2">
                          <span className="font-medium text-slate-500">Compatibility:</span> {part.compatibility}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                <div className="flex items-center gap-2">
                  {isOutOfStock ? (
                    <Badge variant="destructive" className="text-base py-1 px-3">
                      <XCircle className="w-4 h-4 mr-2" /> Out of Stock
                    </Badge>
                  ) : isLowStock ? (
                    <Badge className="bg-orange-500 text-white text-base py-1 px-3">
                      <Wrench className="w-4 h-4 mr-2" /> Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-base py-1 px-3">
                      <PackageCheck className="w-4 h-4 mr-2" /> In Stock ({part.stock_quantity} available)
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2 border rounded-lg p-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={isOutOfStock}
                      className="w-10 h-10"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(1)}
                      disabled={isOutOfStock || quantity >= part.stock_quantity}
                      className="w-10 h-10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    onClick={addToCart}
                    disabled={isOutOfStock}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300"
                  >
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
