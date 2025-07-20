'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    revenue: {
      current: 0,
      previous: 0,
      growth: 0,
      data: [] as { day: string; revenue: number }[]
    },
    orders: {
      current: 0,
      previous: 0,
      growth: 0,
      data: [] as { day: string; orders: number }[]
    },
    customers: {
      current: 0,
      previous: 0,
      growth: 0
    },
    products: {
      current: 0,
      topSelling: [] as { name: string; sales: number }[]
    },
    categoryBreakdown: [] as { name: string; value: number }[]
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get current month data
      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      // Revenue analytics
      const { data: currentRevenue } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: previousRevenue } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'paid')
        .gte('created_at', previousMonth.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      // Customer analytics
      const { data: currentCustomers } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'customer')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: previousCustomers } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'customer')
        .gte('created_at', previousMonth.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      // Product analytics
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('is_active', true);

      // Category breakdown
      const { data: categories } = await supabase
        .from('categories')
        .select(`
          name,
          products(id)
        `)
        .eq('is_active', true);

      // Calculate metrics
      const currentRevenueTotal = currentRevenue?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const previousRevenueTotal = previousRevenue?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const revenueGrowth = previousRevenueTotal > 0 
        ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100 
        : 0;

      const ordersGrowth = (previousRevenue?.length || 0) > 0 
        ? ((currentRevenue?.length || 0) - (previousRevenue?.length || 0)) / (previousRevenue?.length || 1) * 100 
        : 0;

      const customersGrowth = (previousCustomers?.length || 0) > 0 
        ? ((currentCustomers?.length || 0) - (previousCustomers?.length || 0)) / (previousCustomers?.length || 1) * 100 
        : 0;

      // Generate sample chart data
      const revenueData = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        revenue: Math.floor(Math.random() * 1000) + 500
      }));

      const ordersData = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        orders: Math.floor(Math.random() * 20) + 10
      }));

      const categoryBreakdown = categories?.map(category => ({
        name: category.name,
        value: category.products?.length || 0
      })) || [];

      setAnalytics({
        revenue: {
          current: currentRevenueTotal,
          previous: previousRevenueTotal,
          growth: revenueGrowth,
          data: revenueData
        },
        orders: {
          current: currentRevenue?.length || 0,
          previous: previousRevenue?.length || 0,
          growth: ordersGrowth,
          data: ordersData
        },
        customers: {
          current: currentCustomers?.length || 0,
          previous: previousCustomers?.length || 0,
          growth: customersGrowth
        },
        products: {
          current: products?.length || 0,
          topSelling: [
            { name: 'Wireless Headphones', sales: 45 },
            { name: 'Cotton T-Shirt', sales: 32 },
            { name: 'JavaScript Book', sales: 28 },
            { name: 'Security Camera', sales: 21 },
            { name: 'Yoga Mat', sales: 18 }
          ]
        },
        categoryBreakdown
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-8 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your store's performance and growth
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.current.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.revenue.growth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(analytics.revenue.growth).toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.orders.current}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.orders.growth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(analytics.orders.growth).toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.customers.current}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.customers.growth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(analytics.customers.growth).toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.products.current}</div>
            <div className="text-xs text-muted-foreground">
              Active products in catalog
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenue.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.orders.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.products.topSelling.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{product.sales} sales</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}