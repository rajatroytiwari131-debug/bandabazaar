import { useRoute, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle2, Truck, MapPin, Map, Home, ChevronLeft } from "lucide-react";

export default function Order() {
  const [match, params] = useRoute("/order/:orderId");
  const orderId = parseInt(params?.orderId || "0", 10);

  const { data: order, isLoading } = useGetOrder(orderId, { query: { enabled: !!orderId } });

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'placed': return 1;
      case 'confirmed': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const statusStep = order ? getStatusStep(order.status) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Button asChild><Link href="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      
      <div className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4 max-w-2xl">
           <div className="flex items-center mb-4">
             <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 mr-2" asChild>
                <Link href="/orders"><ChevronLeft className="h-5 w-5" /></Link>
             </Button>
             <h1 className="text-2xl font-bold font-serif">Order #{order.id}</h1>
           </div>
           <p className="text-primary-foreground/80 flex items-center">
             <MapPin className="h-4 w-4 mr-1" /> From {order.storeName}
           </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6 -mt-4">
        {/* Status Tracker */}
        <div className="bg-card rounded-xl border shadow-sm p-6 relative z-10">
          <h2 className="font-bold text-lg mb-6">Track Order</h2>
          
          {order.status === 'cancelled' ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start">
               <CheckCircle2 className="h-5 w-5 mr-3 mt-0.5" />
               <div>
                 <p className="font-bold">Order Cancelled</p>
                 <p className="text-sm mt-1">This order was cancelled.</p>
               </div>
            </div>
          ) : (
            <div className="relative">
              {/* Line behind steps */}
              <div className="absolute left-4 top-2 bottom-6 w-0.5 bg-muted"></div>
              <div 
                className="absolute left-4 top-2 w-0.5 bg-primary transition-all duration-500"
                style={{ bottom: `${100 - (statusStep / 4) * 100}%` }}
              ></div>

              <div className="space-y-6 relative">
                {/* Step 1 */}
                <div className={`flex gap-4 ${statusStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${statusStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="pt-1">
                    <p className="font-bold">Order Placed</p>
                    <p className="text-sm text-muted-foreground">We have received your order</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`flex gap-4 ${statusStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${statusStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="pt-1">
                    <p className="font-bold">Order Confirmed</p>
                    <p className="text-sm text-muted-foreground">Store is packing your items</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`flex gap-4 ${statusStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${statusStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="pt-1">
                    <p className="font-bold">Out for Delivery</p>
                    <p className="text-sm text-muted-foreground">Delivery partner is on the way</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`flex gap-4 ${statusStep >= 4 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${statusStep >= 4 ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Home className="h-4 w-4" />
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-green-700 dark:text-green-500">Delivered</p>
                    <p className="text-sm text-muted-foreground">Enjoy your fresh groceries!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
           <h3 className="font-bold text-lg mb-4 pb-4 border-b">Bill Details</h3>
           <div className="space-y-4">
             {order.items.map((item, i) => (
               <div key={i} className="flex justify-between items-center text-sm">
                 <div className="flex items-center">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium mr-3">{item.quantity}x</span>
                    <span>{item.productName}</span>
                 </div>
                 <span className="font-medium">₹{item.price * item.quantity}</span>
               </div>
             ))}
             <div className="border-t pt-4 mt-2">
               <div className="flex justify-between items-center font-bold">
                 <span>Total Paid (COD)</span>
                 <span className="text-lg">₹{order.subtotal}</span>
               </div>
             </div>
           </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
           <h3 className="font-bold text-lg mb-4 pb-4 border-b flex items-center">
             <MapPin className="h-5 w-5 mr-2 text-primary" /> Delivery Details
           </h3>
           <div className="space-y-3 text-sm">
             <div>
               <span className="text-muted-foreground block mb-1">Customer Name</span>
               <span className="font-medium">{order.customerName}</span>
             </div>
             <div>
               <span className="text-muted-foreground block mb-1">Phone Number</span>
               <span className="font-medium">{order.customerPhone}</span>
             </div>
             <div>
               <span className="text-muted-foreground block mb-1">Address</span>
               <span className="font-medium">{order.customerAddress}</span>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
