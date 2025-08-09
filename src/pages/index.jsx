import Layout from "./Layout.jsx";

import BrowseParts from "./BrowseParts";

import Cart from "./Cart";

import Checkout from "./Checkout";

import MyOrders from "./MyOrders";

import ProductDetails from "./ProductDetails";

import SignIn from "./SignIn";

import SignUp from "./SignUp";

import AdminDashboard from "./AdminDashboard";

import ManageParts from "./ManageParts";

import ManageCategories from "./ManageCategories";

import ManageUsers from "./ManageUsers";

import AdminOrders from "./AdminOrders";

import AdminSettings from "./AdminSettings";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    BrowseParts: BrowseParts,
    
    Cart: Cart,

    Checkout: Checkout,

    MyOrders: MyOrders,

    ProductDetails: ProductDetails,

    SignIn: SignIn,

    SignUp: SignUp,
    
    AdminDashboard: AdminDashboard,
    
    ManageParts: ManageParts,

    ManageCategories: ManageCategories,

    ManageUsers: ManageUsers,
    
    AdminOrders: AdminOrders,
    
    AdminSettings: AdminSettings,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    // Auth pages should not be wrapped in Layout
    if (location.pathname === '/sign-in' || location.pathname === '/sign-up' || location.pathname.startsWith('/sign-in/')) {
        return (
            <Routes>
                <Route path="/sign-in/*" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
            </Routes>
        );
    }

    return (
        <Layout currentPageName={currentPage}>
            <Routes>

                    {/* Public home page - Browse Parts */}
                    <Route path="/" element={<BrowseParts />} />


                <Route path="/BrowseParts" element={<BrowseParts />} />

                {/* Public cart - accessible to guests */}
                <Route path="/Cart" element={<Cart />} />

                <Route path="/Checkout" element={<Checkout />} />

                <Route path="/MyOrders" element={<MyOrders />} />

                {/* Public product details - accessible to guests */}
                <Route path="/ProductDetails" element={<ProductDetails />} />

                <Route path="/AdminDashboard" element={<AdminDashboard />} />

                <Route path="/ManageParts" element={<ManageParts />} />

                <Route path="/ManageCategories" element={<ManageCategories />} />

                <Route path="/ManageUsers" element={<ManageUsers />} />

                <Route path="/AdminOrders" element={<AdminOrders />} />

                <Route path="/AdminSettings" element={<AdminSettings />} />

            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}