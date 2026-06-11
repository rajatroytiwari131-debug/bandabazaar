import { AdminHeader } from "@/components/layout/AdminHeader";
import { useGetAdminDashboard, useListCommissions, useAdminListStores } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, IndianRupee, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  placed: { label: "Placed", color: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmed", color: "bg-amber-100 text-amber-700" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();
  const { data: allCommissions } = useListCommissions({});
  const { data: allStores } = useAdminListStores({});

  // Build store-wise revenue + commission map
  const storeStats = (() => {
    if (!allCommissions || !allStores) return [];
    const map: Record<number, { storeId: number; storeName: string; totalSales: number; totalCommission: number; orderCount: number }> = {};
    for (const c of allCommissions) {
      if (!map[c.storeId]) {
        map[c.storeId] = { storeId: c.storeId, storeName: c.storeName, totalSales: 0, totalCommission: 0, orderCount: 0 };
      }
      map[c.storeId].totalSales += c.orderAmount;
      map[c.storeId].totalCommission += c.commissionAmount;
      map[c.storeId].orderCount += 1;
    }
    return Object.values(map).sort((a, b) => b.totalSales - a.totalSales);
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-200 animate-pulse rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Platform Dashboard</h1>
          <p className="text-zinc-500 text-sm">BandaBazaar ka poora hisaab-kitaab</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">₹{(dashboard?.totalRevenue || 0).toFixed(2)}</div>
              <p className="text-xs text-zinc-500 mt-1">Delivered orders ka total</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Platform Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">₹{(dashboard?.totalCommission || 0).toFixed(2)}</div>
              <p className="text-xs text-zinc-500 mt-1">Aapki kamai (8%)</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">{dashboard?.totalOrders || 0}</div>
              <p className="text-xs text-zinc-500 mt-1">Sare orders</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Stores</CardTitle>
              <Store className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-zinc-900">{dashboard?.totalStores || 0}</div>
                {(dashboard?.pendingStores ?? 0) > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">
                    {dashboard?.pendingStores} pending
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Registered stores</p>
            </CardContent>
          </Card>
        </div>

        {/* Store-wise Revenue Table */}
        <Card className="border-none shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="h-5 w-5 text-primary" />
              Store-wise Sales & Commission
            </CardTitle>
            <p className="text-sm text-zinc-500">Har store se kitna bikaa aur kitna commission mila</p>
          </CardHeader>
          <CardContent className="p-0">
            {storeStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-zinc-50 border-y border-zinc-200 text-zinc-500">
                    <tr>
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Store Name</th>
                      <th className="px-6 py-3">Orders</th>
                      <th className="px-6 py-3">Total Sales</th>
                      <th className="px-6 py-3">Commission (8%)</th>
                      <th className="px-6 py-3">Store Ka Hissa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {storeStats.map((s, i) => (
                      <tr key={s.storeId} className="hover:bg-zinc-50/70">
                        <td className="px-6 py-4 text-zinc-500 font-medium">{i + 1}</td>
                        <td className="px-6 py-4 font-bold text-zinc-900">{s.storeName}</td>
                        <td className="px-6 py-4 text-zinc-600">{s.orderCount}</td>
                        <td className="px-6 py-4 font-bold text-zinc-900">₹{s.totalSales.toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">₹{s.totalCommission.toFixed(2)}</td>
                        <td className="px-6 py-4 text-zinc-600">₹{(s.totalSales - s.totalCommission).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-zinc-300 bg-zinc-50">
                    <tr>
                      <td className="px-6 py-3 font-bold text-zinc-700" colSpan={2}>TOTAL</td>
                      <td className="px-6 py-3 font-bold text-zinc-900">{storeStats.reduce((s, r) => s + r.orderCount, 0)}</td>
                      <td className="px-6 py-3 font-bold text-zinc-900">₹{storeStats.reduce((s, r) => s + r.totalSales, 0).toFixed(2)}</td>
                      <td className="px-6 py-3 font-bold text-emerald-600">₹{storeStats.reduce((s, r) => s + r.totalCommission, 0).toFixed(2)}</td>
                      <td className="px-6 py-3 font-bold text-zinc-900">₹{storeStats.reduce((s, r) => s + r.totalSales - r.totalCommission, 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-400">
                <Package className="h-10 w-10 mx-auto mb-2" />
                <p>Abhi koi delivered order nahi hai</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders + Top Stores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" /> Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
                  dashboard.recentOrders.map(order => {
                    const s = STATUS_LABELS[order.status] || { label: order.status, color: "bg-zinc-100 text-zinc-600" };
                    return (
                      <div key={order.id} className="flex items-start justify-between border-b border-zinc-100 last:border-0 pb-3 last:pb-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-zinc-900">#{order.id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                          </div>
                          <p className="text-xs text-zinc-600 font-medium">{order.storeName}</p>
                          <p className="text-xs text-zinc-400">{order.customerName} · {format(new Date(order.createdAt), "MMM d, p")}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold text-sm text-zinc-900">₹{order.subtotal}</p>
                          <p className="text-xs text-emerald-600 font-medium">Comm: ₹{order.commissionAmount}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500 py-6 text-center">Koi order nahi</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stores Status */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5 text-primary" /> All Stores Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allStores && allStores.length > 0 ? (
                  allStores.map(store => (
                    <div key={store.id} className="flex items-center justify-between border-b border-zinc-100 last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{store.name}</p>
                        <p className="text-xs text-zinc-500">{store.category} · {store.address.split(",")[0]}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {store.status === "approved" && store.isOpen && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Open
                          </span>
                        )}
                        {store.status === "approved" && !store.isOpen && (
                          <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">Closed</span>
                        )}
                        {store.status === "pending" && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertCircle className="h-3 w-3" /> Pending
                          </span>
                        )}
                        {store.status === "blocked" && (
                          <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Blocked</span>
                        )}
                        {store.status === "rejected" && (
                          <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">Rejected</span>
                        )}
                        {store.rating && (
                          <span className="text-xs text-zinc-500">{Number(store.rating).toFixed(1)} ★</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 py-6 text-center">Koi store registered nahi</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
