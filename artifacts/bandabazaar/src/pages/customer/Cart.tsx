import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useGetStore, useCreateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, User, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

export default function Cart() {
  const { items, storeId, updateQuantity, removeItem, clearCart, total } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const { data: store } = useGetStore(storeId!, { query: { enabled: !!storeId } });
  const createOrder = useCreateOrder();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add items from your favorite local stores.</p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/">Browse Stores</Link>
          </Button>
        </div>
      </div>
    );
  }

  const minOrder = store?.minOrderAmount || 0;
  const isBelowMin = total < minOrder;

  const handlePlaceOrder = () => {
    if (isBelowMin) {
      toast({
        title: "Minimum order not met",
        description: `Please add items worth ₹${minOrder - total} more.`,
        variant: "destructive"
      });
      return;
    }
    if (!name || !phone || !address || phone.length < 10) {
      toast({
        title: "Incomplete details",
        description: "Please fill in all delivery details correctly.",
        variant: "destructive"
      });
      return;
    }

    createOrder.mutate({
      data: {
        storeId: storeId!,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod: "cod",
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      }
    }, {
      onSuccess: (order) => {
        clearCart();
        toast({
          title: "Order Placed!",
          description: "Your order has been sent to the store."
        });
        setLocation(`/order/${order.id}`);
      },
      onError: (err: any) => {
        toast({
          title: "Failed to place order",
          description: err.message || "An error occurred.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold font-serif mb-6 flex items-center">
          <ShoppingBag className="mr-2 h-6 w-6 text-primary" /> 
          Review Cart
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Items List */}
            <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <div>
                  <h2 className="font-bold text-lg">{store?.name || "Store"}</h2>
                  <p className="text-sm text-muted-foreground">{items.length} items</p>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-2" /> Clear
                </Button>
              </div>

              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm md:text-base leading-tight">{item.productName}</p>
                      <p className="text-muted-foreground text-sm mt-1">₹{item.price}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-bold">₹{item.price * item.quantity}</p>
                      <div className="flex items-center bg-muted rounded-lg overflow-hidden h-8">
                        <button 
                          className="px-2.5 h-full hover:bg-black/10 transition-colors"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button 
                          className="px-2.5 h-full hover:bg-black/10 transition-colors"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <Link href={`/store/${storeId}`}>
                  <Button variant="outline" className="w-full text-primary border-primary/20 hover:bg-primary/5">
                    <Plus className="h-4 w-4 mr-2" /> Add more items
                  </Button>
                </Link>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
              <h2 className="font-bold text-lg mb-4">Delivery Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} className="pl-9" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="pl-9" placeholder="9876543210" maxLength={10} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Complete Address (in Banda)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea id="address" value={address} onChange={e => setAddress(e.target.value)} className="pl-9 min-h-[100px]" placeholder="House No, Street, Landmark..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Details */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Bill Summary</h2>
              
              <div className="space-y-3 text-sm mb-4 pb-4 border-b">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Total</span>
                  <span className="font-medium">₹{total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg">To Pay</span>
                <span className="font-bold text-xl">₹{total}</span>
              </div>
              
              {isBelowMin && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4 font-medium">
                  Add items worth ₹{minOrder - total} more to reach minimum order of ₹{minOrder}.
                </div>
              )}
              
              <Button 
                className="w-full rounded-full h-12 text-lg font-bold shadow-md" 
                size="lg"
                disabled={isBelowMin || createOrder.isPending}
                onClick={handlePlaceOrder}
              >
                {createOrder.isPending ? "Processing..." : (
                  <>
                    <span className="mr-2">Place Order</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                Cash on Delivery (COD) only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
