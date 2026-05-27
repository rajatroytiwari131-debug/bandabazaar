import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { OwnerHeader } from "@/components/layout/OwnerHeader";
import {
  useListStores, useListOrders, useGetStoreStats,
  useUpdateOrderStatus, useUpdateStore,
  getListOrdersQueryKey, getGetStoreStatsQueryKey
} from "@workspace/api-client-react";
import type { Order, OrderItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package, TrendingUp, IndianRupee, Clock,
  CheckCircle2, Truck, XCircle, History, PhoneCall, MapPin
} from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  placed:            { label: "Naya Order",        color: "bg-blue-100 text-blue-700" },
  confirmed:         { label: "Confirmed",          color: "bg-amber-100 text-amber-700" },
  out_for_delivery:  { label: "Out for Delivery",   color: "bg-orange-100 text-orange-700" },
  delivered:         { label: "Delivered",           color: "bg-green-100 text-green-700" },
  cancelled:         { label: "Cancelled",           color: "bg-red-100 text-red-700" },
};

export default function OwnerDashboard() {
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("bb_owner_phone");
    if (!session) { setLocation("/owner"); } else { setPhone(session); }
  }, [setLocation]);

  const { data: stores, isLoading: isLoadingStore } = useListStores(
    { search: phone }, { query: { enabled: phone.length >= 10 } as any }
  );
  const store = stores?.[0];

  const { data: stats } = useGetStoreStats(store?.id || 0, { query: { enabled: !!store?.id } as any });
  const { data: orders, isLoading: isLoadingOrders } = useListOrders(
    { storeId: store?.id }, { query: { enabled: !!store?.id } as any }
  );

  const updateStore = useUpdateStore();
  const updateStatus = useUpdateOrderStatus();

  const handleToggleOpen = (isOpen: boolean) => {
    if (!store) return;
    updateStore.mutate({ storeId: store.id, data: { isOpen } }, {
      onSuccess: () => {
        toast({ title: isOpen ? "Store ab OPEN hai" : "Store CLOSED kar diya" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ storeId: store.id }) });
      },
    });
  };

  const handleUpdateStatus = (orderId: number, status: "confirmed" | "out_for_delivery" | "delivered" | "cancelled") => {
    updateStatus.mutate({ orderId, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Order #${orderId} — ${STATUS_CONFIG[status]?.label}` });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ storeId: store?.id }) });
        queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey(store?.id || 0) });
      },
    });
  };

  if (isLoadingStore) {
    return (
      <div className="min-h-screen bg-muted/30">
        <OwnerHeader />
        <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!store && phone) { setLocation("/owner/register"); return null; }

  if (store?.status === "pending") {
    return (
      <div className="min-h-screen bg-muted/30">
        <OwnerHeader />
        <div className="container mx-auto px-4 py-12 max-w-lg text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Approval Pending</h2>
          <p className="text-muted-foreground">Aapki store registration review mein hai. Admin approve karte hi aapko pata chalega.</p>
        </div>
      </div>
    );
  }

  if (store?.status === "rejected" || store?.status === "blocked") {
    return (
      <div className="min-h-screen bg-muted/30">
        <OwnerHeader />
        <div className="container mx-auto px-4 py-12 max-w-lg text-center">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-destructive">Account {store.status}</h2>
          <p className="text-muted-foreground">Admin se contact karein.</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders?.filter(o => ["placed", "confirmed", "out_for_delivery"].includes(o.status)) || [];
  const pastOrders   = orders?.filter(o => ["delivered", "cancelled"].includes(o.status)) || [];

  // Revenue breakdown
  const totalRevenue     = orders?.filter((o: Order) => o.status === "delivered").reduce((s: number, o: Order) => s + o.subtotal, 0) || 0;
  const todayRevenue     = orders?.filter((o: Order) => o.status === "delivered" && new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((s: number, o: Order) => s + o.subtotal, 0) || 0;
  const todayCommission  = todayRevenue * 0.08;

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <OwnerHeader />
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif">{store?.name}</h1>
            <p className="text-muted-foreground text-sm">{store?.address}</p>
          </div>
          <div className="flex items-center gap-3 bg-card px-4 py-2.5 rounded-xl border shadow-sm">
            <Label htmlFor="store-open" className="font-semibold text-sm cursor-pointer">Orders Accept Karo</Label>
            <Switch id="store-open" checked={store?.isOpen} onCheckedChange={handleToggleOpen} disabled={updateStore.isPending} />
            <Badge className={store?.isOpen ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}>
              {store?.isOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Aaj Ki Kamai</CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{todayRevenue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Commission: ₹{todayCommission.toFixed(0)}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Net Kamai (Total)</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">₹{(stats?.netEarnings || 0).toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">8% commission ke baad</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.completedOrders || 0} delivered</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Commission Kata</CardTitle>
              <IndianRupee className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">₹{(stats?.totalCommission || 0).toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Platform fee (8%)</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown Card */}
        <Card className="border-none shadow-sm mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Gross Sales</p>
                <p className="text-xl font-bold text-zinc-900">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Commission (8%)</p>
                <p className="text-xl font-bold text-red-500">- ₹{(totalRevenue * 0.08).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Aapko Milega</p>
                <p className="text-xl font-bold text-emerald-600">₹{(totalRevenue * 0.92).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-serif">
            Active Orders
            {activeOrders.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-primary text-white rounded-full">{activeOrders.length}</span>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
          {isLoadingOrders ? (
            [1, 2].map(i => <div key={i} className="h-64 bg-card border rounded-xl animate-pulse" />)
          ) : activeOrders.length > 0 ? (
            activeOrders.map((order: Order) => (
              <div key={order.id} className="bg-card rounded-xl border shadow-sm p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg">Order #{order.id}</h3>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "d MMM, p")}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_CONFIG[order.status]?.color}`}>
                    {STATUS_CONFIG[order.status]?.label}
                  </span>
                </div>

                <div className="mb-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold">{order.customerName}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PhoneCall className="h-3.5 w-3.5" /> {order.customerPhone}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {order.customerAddress}
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Items</p>
                  <div className="space-y-1">
                    {order.items.map((item: OrderItem, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.productName}</span>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t font-bold">
                    <span>Total (COD)</span>
                    <span className="text-lg text-primary">₹{order.subtotal}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  {order.status === "placed" && (
                    <>
                      <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-sm" onClick={() => handleUpdateStatus(order.id, "cancelled")}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                      <Button className="text-sm" onClick={() => handleUpdateStatus(order.id, "confirmed")}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm
                      </Button>
                    </>
                  )}
                  {order.status === "confirmed" && (
                    <Button className="col-span-2 text-sm" onClick={() => handleUpdateStatus(order.id, "out_for_delivery")}>
                      <Truck className="w-4 h-4 mr-2" /> Delivery Pe Bheja
                    </Button>
                  )}
                  {order.status === "out_for_delivery" && (
                    <Button className="col-span-2 text-sm bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(order.id, "delivered")}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Delivered Mark Karo
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border rounded-xl bg-card border-dashed">
              <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-bold text-lg">Koi active order nahi</p>
              <p className="text-muted-foreground text-sm">Sab orders complete ho gaye!</p>
            </div>
          )}
        </div>

        {/* Past Orders */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2">
            <History className="h-5 w-5" /> Order History
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(h => !h)}>
            {showHistory ? "Chhupaao" : `Dekho (${pastOrders.length})`}
          </Button>
        </div>

        {showHistory && (
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            {pastOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Commission</th>
                      <th className="px-5 py-3">Aapko Mila</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pastOrders.map((order: Order) => {
                      const commission = order.subtotal * 0.08;
                      const net = order.subtotal - commission;
                      const s = STATUS_CONFIG[order.status];
                      return (
                        <tr key={order.id} className="hover:bg-muted/30">
                          <td className="px-5 py-3 font-bold">#{order.id}</td>
                          <td className="px-5 py-3">
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {order.items.map((i: OrderItem) => `${i.quantity}x ${i.productName}`).join(", ")}
                          </td>
                          <td className="px-5 py-3 font-bold">₹{order.subtotal}</td>
                          <td className="px-5 py-3 text-red-500 font-medium">₹{commission.toFixed(2)}</td>
                          <td className="px-5 py-3 text-emerald-600 font-bold">₹{net.toFixed(2)}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s?.color}`}>{s?.label}</span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground text-xs">{format(new Date(order.createdAt), "d MMM yyyy")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 bg-muted/30">
                    <tr>
                      <td className="px-5 py-3 font-bold" colSpan={3}>TOTAL</td>
                      <td className="px-5 py-3 font-bold">₹{pastOrders.reduce((s: number, o: Order) => s + o.subtotal, 0).toFixed(2)}</td>
                      <td className="px-5 py-3 font-bold text-red-500">₹{pastOrders.reduce((s: number, o: Order) => s + o.subtotal * 0.08, 0).toFixed(2)}</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">₹{pastOrders.reduce((s: number, o: Order) => s + o.subtotal * 0.92, 0).toFixed(2)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Abhi koi past order nahi</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
