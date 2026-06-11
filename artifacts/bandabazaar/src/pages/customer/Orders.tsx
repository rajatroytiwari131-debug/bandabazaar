import { Link } from "wouter";
import { useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, Clock, ChevronRight, ShoppingBag,
  CheckCircle2, Truck, XCircle, AlertCircle, RotateCcw
} from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  placed:           { label: "Order Placed",      icon: <Clock className="h-4 w-4" />,         color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  confirmed:        { label: "Confirmed",          icon: <CheckCircle2 className="h-4 w-4" />,  color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  out_for_delivery: { label: "Out for Delivery",   icon: <Truck className="h-4 w-4" />,         color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  delivered:        { label: "Delivered",          icon: <CheckCircle2 className="h-4 w-4" />,  color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  cancelled:        { label: "Cancelled",          icon: <XCircle className="h-4 w-4" />,       color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

export default function Orders() {
  const { user, openAuthModal } = useAuth();

  const { data: orders, isLoading, refetch } = useListOrders(
    { customerPhone: user?.phone },
    { query: { enabled: !!user?.phone } as any }
  );

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Apna Orders Dekhein</h2>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              Login karein apne saare orders ek jagah dekhne ke liye — status, delivery updates, aur order history.
            </p>
            <Button className="w-full" onClick={() => openAuthModal("login")}>
              Login to View Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-12">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Your Orders</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{user.name} · {user.phone}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeOrders  = orders?.filter(o => ["placed", "confirmed", "out_for_delivery"].includes(o.status)) ?? [];
  const pastOrders    = orders?.filter(o => ["delivered", "cancelled"].includes(o.status)) ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-12">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Your Orders</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{user.name} · {user.phone}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
        </div>

        {/* No orders at all */}
        {(!orders || orders.length === 0) && (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/20">
            <Package className="h-14 w-14 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Koi order nahi mila</h3>
            <p className="text-muted-foreground text-sm mb-5">Abhi tak koi order place nahi kiya — pehla order dein!</p>
            <Link href="/">
              <Button><ShoppingBag className="h-4 w-4 mr-2" /> Stores Browse Karo</Button>
            </Link>
          </div>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-bold text-base">Active Orders</h2>
              <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-primary text-white rounded-full">{activeOrders.length}</span>
            </div>
            <div className="space-y-3">
              {activeOrders.map(order => {
                const s = STATUS_CONFIG[order.status];
                return (
                  <Link key={order.id} href={`/order/${order.id}`}>
                    <div className="bg-card rounded-2xl border shadow-sm p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{order.storeName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {order.items.map(i => `${i.quantity}× ${i.productName}`).join(", ")}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s?.bg} ${s?.color}`}>
                          {s?.icon} {s?.label}
                        </span>
                        <div className="text-right">
                          <p className="font-bold text-base">₹{order.subtotal}</p>
                          <p className="text-[11px] text-muted-foreground">Order #{order.id}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <section>
            <h2 className="font-bold text-base mb-3 text-muted-foreground">Order History</h2>
            <div className="space-y-2">
              {pastOrders.map(order => {
                const s = STATUS_CONFIG[order.status];
                return (
                  <Link key={order.id} href={`/order/${order.id}`}>
                    <div className="bg-card rounded-2xl border p-4 hover:border-primary/30 transition-all cursor-pointer group flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm truncate">{order.storeName}</p>
                          <p className="font-bold text-sm shrink-0">₹{order.subtotal}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {order.items.map(i => `${i.quantity}× ${i.productName}`).join(", ")}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${s?.bg} ${s?.color}`}>
                            {s?.icon} {s?.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {format(new Date(order.createdAt), "d MMM yyyy 'at' p")} · #{order.id}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
