
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Settings, ShoppingCart, Package, Users, BarChart3, Home, Search, User as UserIcon, Cog, LogIn, FolderOpen } from "lucide-react";
import { supabaseHelpers } from "@/lib/supabase";
import { useAuth } from "@/hooks/useClerkAuth.jsx";
import { UserButton, useUser } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/auth/AuthModal";
import UserMenu from "@/components/auth/UserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();

  // Debug logging
  console.log('Layout Debug:', {
    user,
    isAuthenticated,
    isLoading,
    clerkUser: clerkUser?.id,
    isLoaded
  });
  const [siteName, setSiteName] = useState("CITACO");
  const [siteSubtitle, setSiteSubtitle] = useState("Your trusted source for quality spare parts");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    document.title = `${siteName} | ${currentPageName || 'Welcome'}`;
  }, [currentPageName, siteName]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const settingsData = await supabaseHelpers.settings.getCurrent();
        if (settingsData && settingsData.store_name) {
          setSiteName(settingsData.store_name);
        }
      } catch (error) {
        console.error("Could not load app settings", error);
      }
    };
    loadData();
  }, [location.key]); // Re-fetch on navigation to update title

  const isAdmin = user?.role === 'admin' || clerkUser?.publicMetadata?.role === 'admin';

  const userNavItems = [
    { title: "Browse Parts", url: createPageUrl("BrowseParts"), icon: Search },
    { title: "My Cart", url: createPageUrl("Cart"), icon: ShoppingCart },
    { title: "My Orders", url: createPageUrl("MyOrders"), icon: Package },
  ];

  const adminNavItems = [
    { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: BarChart3 },
    { title: "Manage Parts", url: createPageUrl("ManageParts"), icon: Package },
    { title: "Categories", url: createPageUrl("ManageCategories"), icon: FolderOpen },
    { title: "Orders", url: createPageUrl("AdminOrders"), icon: ShoppingCart },
    { title: "Users", url: createPageUrl("ManageUsers"), icon: Users },
    { title: "Site Settings", url: createPageUrl("AdminSettings"), icon: Cog },
  ];

  // Admin users get access to ALL pages (both admin and user pages)
  const allNavItems = [
    // Admin-specific pages
    { title: "Admin Dashboard", url: createPageUrl("AdminDashboard"), icon: BarChart3, section: "admin" },
    { title: "Manage Parts", url: createPageUrl("ManageParts"), icon: Package, section: "admin" },
    { title: "Manage Categories", url: createPageUrl("ManageCategories"), icon: FolderOpen, section: "admin" },
    { title: "Manage Orders", url: createPageUrl("AdminOrders"), icon: ShoppingCart, section: "admin" },
    { title: "Manage Users", url: createPageUrl("ManageUsers"), icon: Users, section: "admin" },
    { title: "Site Settings", url: createPageUrl("AdminSettings"), icon: Cog, section: "admin" },
    // User pages that admin can also access
    { title: "Browse Parts", url: createPageUrl("BrowseParts"), icon: Search, section: "shop" },
    { title: "My Cart", url: createPageUrl("Cart"), icon: ShoppingCart, section: "shop" },
    { title: "My Orders", url: createPageUrl("MyOrders"), icon: Package, section: "shop" },
  ];

  const navigationItems = isAdmin ? allNavItems : userNavItems;

  // Show loading state while checking authentication
  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow public access - only show sign-in prompt for protected routes
  const isPublicRoute = location.pathname === '/BrowseParts' || location.pathname === '/' || location.pathname === '/Cart' || location.pathname === '/ProductDetails';

  if (!clerkUser && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{siteName}</h1>
          <p className="text-slate-600 mb-8">{siteSubtitle}</p>
          <div className="space-y-4">
            <Link to="/sign-in">
              <Button className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium mr-4">
                Sign In
              </Button>
            </Link>
            <Link to="/BrowseParts">
              <Button variant="outline" className="px-8 py-3 rounded-xl transition-colors font-medium">
                Browse Parts
              </Button>
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    );
  }

  // Public layout for unauthenticated users
  if (!clerkUser && isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Public Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{siteName}</h1>
                <p className="text-sm text-slate-500">Auto Parts Store</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/Cart">
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="outline" className="px-4 py-2">
                  Sign In
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button className="px-4 py-2 bg-blue-600 hover:bg-blue-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Public Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{siteName}</h2>
                <p className="text-sm text-slate-500">{isAdmin ? 'Admin Panel' : 'Customer Panel'}</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            {isAdmin ? (
              // Admin users see grouped sections
              <>
                {/* Admin Section */}
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                    Administration
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navigationItems.filter(item => item.section === 'admin').map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 ${
                              location.pathname === item.url ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Shopping Section */}
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                    Shopping
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navigationItems.filter(item => item.section === 'shop').map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 ${
                              location.pathname === item.url ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            ) : (
              // Regular users see single section
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Shopping
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {user?.name || clerkUser?.fullName || clerkUser?.firstName || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email || clerkUser?.emailAddresses?.[0]?.emailAddress}
                  </p>
                </div>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard: "shadow-lg border border-slate-200",
                      userButtonPopoverActionButton: "hover:bg-slate-50"
                    }
                  }}
                  showName={false}
                  userProfileMode="navigation"
                  userProfileUrl="/user-profile"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/sign-in">
                  <Button className="w-full" size="sm">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="outline" className="w-full" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-900">{siteName}</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </SidebarProvider>
  );
}
