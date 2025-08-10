
import React, { useState, useEffect } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/useClerkAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Package, Filter, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../components/shop/ProductCard";
import ShoppingCartSidebar from "../components/shop/ShoppingCartSidebar";

export default function BrowseParts() {
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [showCartSidebar, setShowCartSidebar] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const {
    guestCartItems,
    addToGuestCart,
    getGuestCartQuantity,
    transferGuestCartToUser
  } = useGuestCart();

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Load parts data regardless of authentication status
    loadData();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchTerm, selectedCategory, selectedBrand, priceRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [partsData, categoriesData] = await Promise.all([
        supabaseHelpers.parts.getAll(),
        supabaseHelpers.categories.getActive()
      ]);

      // Filter only active parts for customers
      const activeParts = partsData.filter(part => part.is_active);
      setParts(activeParts);
      setCategories(categoriesData);

      // Load cart data only if user is authenticated
      if (user && isAuthenticated) {
        const cartData = await supabaseHelpers.cart.getItems(user.clerk_user_id);
        setCartItems(cartData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const filterParts = () => {
    let filtered = parts;

    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter(part => part.brand === selectedBrand);
    }

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      filtered = filtered.filter(part => {
        if (max) return part.price >= min && part.price <= max;
        return part.price >= min;
      });
    }

    setFilteredParts(filtered);
  };

  const addToCart = async (part, quantity = 1) => {
    try {
      if (!user?.clerk_user_id) {
        // Add to guest cart for unauthenticated users
        addToGuestCart(part, quantity);
        return;
      }

      const existingCartItem = cartItems.find(item => item.spare_part_id === part.id);

      if (existingCartItem) {
        await supabaseHelpers.cart.updateQuantity(user.clerk_user_id, part.id, existingCartItem.quantity + quantity);
      } else {
        await supabaseHelpers.cart.addItem(user.clerk_user_id, user.email, part.id, quantity);
      }

      // Reload cart items
      const cartData = await supabaseHelpers.cart.getItems(user.clerk_user_id);
      setCartItems(cartData);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const getUniqueValues = (field) => {
    const values = parts.map(part => part[field]).filter(Boolean);
    return [...new Set(values)];
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Browse Spare Parts</h1>
            <p className="text-slate-600">Find the perfect parts for your vehicle</p>
          </div>
          <Button
            onClick={() => setShowCartSidebar(true)}
            className="bg-blue-600 hover:bg-blue-700 relative"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart ({cartCount})
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {getUniqueValues('brand').map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-25">$0 - $25</SelectItem>
                  <SelectItem value="25-50">$25 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100-500">$100 - $500</SelectItem>
                  <SelectItem value="500">$500+</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedBrand("all");
                  setPriceRange("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600">
            Showing {filteredParts.length} of {parts.length} parts
          </p>
        </div>

        {/* Parts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="bg-slate-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-slate-200 h-4 rounded mb-2"></div>
                  <div className="bg-slate-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-slate-200 h-6 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParts.map((part) => (
                <ProductCard
                  key={part.id}
                  part={part}
                  onAddToCart={addToCart}
                  cartQuantity={
                    isAuthenticated
                      ? cartItems.find(item => item.spare_part_id === part.id)?.quantity || 0
                      : getGuestCartQuantity(part.id)
                  }
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {filteredParts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No parts found</h3>
            <p className="text-slate-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      <ShoppingCartSidebar
        open={showCartSidebar}
        onClose={() => setShowCartSidebar(false)}
        cartItems={cartItems}
        parts={parts}
        onUpdateCart={loadData}
        user={user}
      />
    </div>
  );
}
