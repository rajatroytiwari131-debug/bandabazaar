import { useState } from "react";
import { Link } from "wouter";
import { useListOrders } from "@workspace/api-client-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Clock, Phone } from "lucide-react";
import { format } from "date-fns";

export default function Orders() {
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const { data: orders, isLoading } = useListOrders(
    { customerPhone: searchPhone },
    { query: { enabled: searchPhone.length >= 10 } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setSearchPhone(phone);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-12">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl flex-1">
        <h1 className="text-2xl font-bold font-serif mb-6">Your Orders / Apna Order Dekhein</h1>

        <div className="bg-card border rounded-xl p-6 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Enter your phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="9876543210" 
                  className="pl-9"
                  maxLength={10}
                />
              </div>
            </div>
            <Button type="submit" disabled={phone.length < 10}>
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl border" />
            ))}
          </div>
        ) : searchPhone ? (
          orders && orders.length > 0 ? (
            <div className="space-y-4">
              <h2 className="font-bold text-lg mb-4">Past Orders</h2>
              {orders.map(order => (
                <Link key={order.id} href={`/order/${order.id}`}>
                  <div className="bg-card rounded-xl border shadow-sm p-5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{order.storeName}</h3>
                          <Badge variant={
                            order.status === 'delivered' ? 'default' : 
                            order.status === 'cancelled' ? 'destructive' : 'secondary'
                          } className={order.status === 'delivered' ? 'bg-green-600 hover:bg-green-700' : ''}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> {format(new Date(order.createdAt), "PPP 'at' p")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right md:text-center mt-2 md:mt-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0">
                       <span className="font-bold text-lg">₹{order.subtotal}</span>
                       <span className="text-sm font-medium text-primary flex items-center group-hover:underline">
                         View Details
                       </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-xl border-dashed bg-muted/30">
               <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
               <h3 className="text-lg font-bold mb-1">No orders found</h3>
               <p className="text-muted-foreground">We couldn't find any orders for this number.</p>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
