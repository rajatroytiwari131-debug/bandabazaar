import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { OwnerHeader } from "@/components/layout/OwnerHeader";
import { useListStores, useListOrders, useGetStoreStats, useUpdateOrderStatus, useUpdateStore, getListOrdersQueryKey, getGetStoreStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Package, TrendingUp, IndianRupee, Clock, CheckCircle2, Truck } from "lucide-react";
import { format } from "date-fns";

export default function OwnerDashboard() {
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const session = localStorage.getItem("bb_owner_phone");
    if (!session) {
      setLocation("/owner");
    } else {
      setPhone(session);
    }
  }, [setLocation]);

  const { data: stores, isLoading: isLoadingStore } = useListStores({ search: phone }, { query: { enabled: phone.length >= 10 } });
  const store = stores?.[0];

  const { data: stats } = useGetStoreStats(store?.id || 0, { query: { enabled: !!store?.id } });
  const { data: orders, isLoading: isLoadingOrders } = useListOrders({ storeId: store?.id }, { query: { enabled: !!store?.id } });

  const updateStore = useUpdateStore();
  const updateStatus = useUpdateOrderStatus();

  const handleToggleOpen = (isOpen: boolean) => {
    if (!store) return;
    updateStore.mutate({ storeId: store.id, data: { isOpen } }, {
      onSuccess: () => {
        toast({ title: isOpen ? "Store is now open" : "Store is closed" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleUpdateStatus = (orderId: number, status: 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled') => {
    updateStatus.mutate({ orderId, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Order status updated to ${status.replace('_', ' ')}` });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ storeId: store?.id }) });
        queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey(store?.id || 0) });
      }
    });
  };

  if (isLoadingStore) return <div className="min-h-screen bg-muted/30"><OwnerHeader /><div className="p-8 text-center animate-pulse">Loading...</div></div>;

  if (!store && phone) {
    // If they have a phone but no store, they should be registering
    setLocation("/owner/register");
    return null;
  }

  if (store?.status === 'pending') {
    return (
      <div className="min-h-screen bg-muted/30">
        <OwnerHeader />
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
          <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Approval Pending</h2>
          <p className="text-muted-foreground mb-8 text-lg">Your store registration is being reviewed by BandaBazaar admins. We will notify you once approved.</p>
        </div>
      </div>
    );
  }

  if (store?.status === 'rejected' || store?.status === 'blocked') {
    return (
      <div className="min-h-screen bg-muted/30">
        <OwnerHeader />
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
          <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-destructive">Account {store.status}</h2>
          <p className="text-muted-foreground mb-8">Please contact admin support for more information.</p>
        </div>
      </div>
    );
  }

  const pendingOrders = orders?.filter(o => ['placed', 'confirmed', 'out_for_delivery'].includes(o.status)) || [];
  const pastOrders = orders?.filter(o => ['delivered', 'cancelled'].includes(o.status)) || [];

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <OwnerHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif">{store?.name}</h1>
            <p className="text-muted-foreground text-sm">Dashboard Overview</p>
          </div>
          
          <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-lg border shadow-sm">
            <Label htmlFor="store-open" className="font-bold text-sm">Accepting Orders</Label>
            <Switch 
              id="store-open" 
              checked={store?.isOpen} 
              onCheckedChange={handleToggleOpen} 
              disabled={updateStore.isPending}
            />
            <Badge variant={store?.isOpen ? "default" : "destructive"} className={store?.isOpen ? "bg-green-600 hover:bg-green-700" : ""}>
              {store?.isOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.netEarnings || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total revenue minus 8% commission</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.completedOrders || 0} completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">₹{stats?.totalCommission || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">8% platform fee</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.pendingOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires action</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <h2 className="text-xl font-bold mb-4 font-serif">Active Orders</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {isLoadingOrders ? (
            [1,2,3].map(i => <div key={i} className="h-64 bg-card border rounded-xl animate-pulse" />)
          ) : pendingOrders.length > 0 ? (
            pendingOrders.map(order => (
              <div key={order.id} className="bg-card rounded-xl border shadow-sm p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4 border-b pb-4">
                  <div>
                    <h3 className="font-bold text-lg">#{order.id}</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "p")}</p>
                  </div>
                  <Badge variant={order.status === 'placed' ? 'destructive' : 'secondary'} className={order.status === 'placed' ? 'animate-pulse' : ''}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <p className="font-bold text-sm mb-2">Customer Details</p>
                  <p className="text-sm">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{order.customerAddress}</p>
                </div>
                
                <div className="mb-6 flex-1">
                  <p className="font-bold text-sm mb-2">Items</p>
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.productName}</span>
                        <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t font-bold">
                    <span>Total (COD)</span>
                    <span className="text-lg text-primary">₹{order.subtotal}</span>
                  </div>
                </div>
                
                <div className="mt-auto grid grid-cols-2 gap-2">
                  {order.status === 'placed' && (
                    <>
                      <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleUpdateStatus(order.id, 'cancelled')}>Reject</Button>
                      <Button onClick={() => handleUpdateStatus(order.id, 'confirmed')} className="bg-primary">Confirm</Button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <Button className="col-span-2 w-full" onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}>
                      <Truck className="w-4 h-4 mr-2" /> Mark Out for Delivery
                    </Button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <Button className="col-span-2 w-full bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border rounded-xl bg-card border-dashed">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-lg font-bold">No active orders</p>
              <p className="text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
