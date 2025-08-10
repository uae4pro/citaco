
import React, { useState, useEffect } from "react";
import { supabaseHelpers } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wrench, Package, DollarSign, Users, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/currency";

// Helper function to safely format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, "MMM d, yyyy");
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
};

const StatCard = ({ title, value, icon: Icon, trend, trendDirection }) => (
  <Card className="shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      <Icon className="h-5 w-5 text-slate-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {trend && (
        <p className={`text-xs ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center gap-1 mt-1`}>
          {trendDirection === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    parts: 0,
    orders: 0,
    revenue: 0,
    users: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockParts, setLowStockParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [partsData, ordersData, usersData] = await Promise.all([
          supabaseHelpers.parts.getAll(),
          supabaseHelpers.orders.getAll({ limit: 5 }),
          supabaseHelpers.users.getAll(),
        ]);

        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0);

        setStats({
          parts: partsData.length,
          orders: ordersData.length,
          revenue: totalRevenue,
          users: usersData.length,
        });

        setRecentOrders(ordersData);

        const lowStock = partsData.filter(part => part.stock_quantity < 10).slice(0, 5);
        setLowStockParts(lowStock);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard title="Total Parts" value={stats.parts} icon={Wrench} trend="+5 this month" trendDirection="up" />
          <StatCard title="Total Orders" value={stats.orders} icon={Package} trend="+12 this month" trendDirection="up" />
          <StatCard title="Total Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} trend="+8% this month" trendDirection="up" />
          <StatCard title="Total Users" value={stats.users} icon={Users} trend="+2 this week" trendDirection="up" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.user_email}</TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell><Badge>{order.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.total_amount || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Low Stock Parts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Part #</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockParts.map(part => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell>{part.part_number}</TableCell>
                      <TableCell className="text-right text-red-600 font-bold">{part.stock_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
