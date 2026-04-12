import { useEffect } from "react";
import { useLocation } from "wouter";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, IndianRupee, Activity, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const session = localStorage.getItem("bb_admin_authed");
    if (session !== "true") {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-zinc-200 animate-pulse rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-200 animate-pulse rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-zinc-200 animate-pulse rounded-xl" />
            <div className="h-96 bg-zinc-200 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-12">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Platform Dashboard</h1>
          <p className="text-zinc-500 text-sm">Overview of BandaBazaar operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-md shadow-zinc-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">₹{dashboard?.totalRevenue || 0}</div>
              <p className="text-xs text-zinc-500 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" /> Lifetime gross volume
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md shadow-zinc-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Commission</CardTitle>
              <IndianRupee className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">₹{dashboard?.totalCommission || 0}</div>
              <p className="text-xs text-zinc-500 mt-1">Platform earnings (8%)</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md shadow-zinc-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">{dashboard?.totalOrders || 0}</div>
              <p className="text-xs text-zinc-500 mt-1">Successfully placed</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md shadow-zinc-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Active Stores</CardTitle>
              <Store className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-zinc-900">{dashboard?.totalStores || 0}</div>
                {dashboard?.pendingStores ? (
                   <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                     {dashboard.pendingStores} pending
                   </Badge>
                ) : null}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Registered partners</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Stores */}
          <Card className="border-none shadow-md shadow-zinc-200/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Activity className="h-5 w-5 mr-2 text-primary" /> Top Performing Stores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dashboard?.topStores && dashboard.topStores.length > 0 ? (
                  dashboard.topStores.map((store, i) => (
                    <div key={store.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-zinc-900">{store.name}</p>
                          <p className="text-xs text-zinc-500">{store.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-zinc-50 text-zinc-700 font-medium">
                          {store.rating ? `${store.rating.toFixed(1)} ★` : 'New'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 py-4 text-center">No store data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="border-none shadow-md shadow-zinc-200/50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2 text-primary" /> Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
                  dashboard.recentOrders.map(order => (
                    <div key={order.id} className="flex items-start justify-between border-b border-zinc-100 last:border-0 pb-4 last:pb-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-zinc-900">#{order.id}</span>
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-600 font-medium mb-0.5">{order.storeName}</p>
                        <p className="text-xs text-zinc-400">{format(new Date(order.createdAt), "MMM d, p")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-zinc-900">₹{order.subtotal}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-1">Fee: ₹{order.commissionAmount}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 py-4 text-center">No recent orders</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
