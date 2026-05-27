import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useGetStore, useCreateOrder, useValidateCoupon } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Phone, User, ShoppingBag, Plus, Minus, Trash2,
  ArrowRight, Tag, CheckCircle, X, Ticket
} from "lucide-react";

export default function Cart() {
  const { items, storeId, updateQuantity, removeItem, clearCart, total } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState("");

  const { data: store } = useGetStore(storeId!, { query: { enabled: !!storeId } as any });
  const createOrder = useCreateOrder();
  const validateCoupon = useValidateCoupon();

  // Auto-promotions
  const MIN_ORDER_PROMO_THRESHOLD = 400;
  const MIN_ORDER_PROMO_DISCOUNT = 30;
  const autoPromoActive = total >= MIN_ORDER_PROMO_THRESHOLD && !appliedCoupon;

  const discountAmount = appliedCoupon?.discountAmount ?? (autoPromoActive ? MIN_ORDER_PROMO_DISCOUNT : 0);
  const finalTotal = Math.max(0, total - discountAmount);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add items from your favourite local stores.</p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/">Browse Stores</Link>
          </Button>
        </div>
      </div>
    );
  }

  const minOrder = store?.minOrderAmount || 0;
  const isBelowMin = finalTotal < minOrder && !appliedCoupon;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setCouponError("");

    validateCoupon.mutate(
      { data: { code: couponCode.trim(), orderAmount: total, storeId: storeId ?? null } },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setAppliedCoupon({
              code: result.code,
              discountAmount: result.discountAmount,
              message: result.message ?? `₹${result.discountAmount} off applied!`,
            });
            setCouponCode("");
            setCouponError("");
          } else {
            setCouponError(result.message ?? "Invalid coupon");
          }
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? err.message ?? "Invalid coupon";
          setCouponError(msg);
        },
      }
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handlePlaceOrder = () => {
    if (total < minOrder) {
      toast({
        title: "Minimum order not met",
        description: `Please add items worth ₹${minOrder - total} more.`,
        variant: "destructive",
      });
      return;
    }
    if (!name || !phone || !address || phone.length < 10) {
      toast({
        title: "Incomplete details",
        description: "Please fill in all delivery details correctly.",
        variant: "destructive",
      });
      return;
    }

    createOrder.mutate(
      {
        data: {
          storeId: storeId!,
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          paymentMethod: "cod",
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          toast({ title: "Order Placed!", description: "Your order has been sent to the store." });
          setLocation(`/order/${order.id}`);
        },
        onError: (err: any) => {
          toast({
            title: "Failed to place order",
            description: err.message || "An error occurred.",
            variant: "destructive",
          });
        },
      }
    );
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
          <div className="md:col-span-2 space-y-4">
            {/* Items */}
            <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <div>
                  <h2 className="font-bold text-lg">{store?.name || "Store"}</h2>
                  <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-2" /> Clear
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base leading-tight">{item.productName}</p>
                      {item.variantLabel && (
                        <span className="inline-block text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full mt-0.5">
                          {item.variantLabel}
                        </span>
                      )}
                      {item.customNote && (
                        <p className="text-xs text-muted-foreground mt-1 italic">📝 {item.customNote}</p>
                      )}
                      <p className="text-muted-foreground text-sm mt-1">₹{item.price} each</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="font-bold">₹{item.price * item.quantity}</p>
                      <div className="flex items-center bg-muted rounded-lg overflow-hidden h-8">
                        <button className="px-2.5 h-full hover:bg-black/10 transition-colors" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button className="px-2.5 h-full hover:bg-black/10 transition-colors" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
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

            {/* Auto-Promotion Banner */}
            {!appliedCoupon && total < MIN_ORDER_PROMO_THRESHOLD && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <Tag className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  Add items worth ₹{MIN_ORDER_PROMO_THRESHOLD - total} more to get <span className="font-bold">₹{MIN_ORDER_PROMO_DISCOUNT} OFF</span> automatically!
                </p>
              </div>
            )}
            {autoPromoActive && (
              <div className="bg-primary/8 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-primary font-semibold">
                  🎉 Auto-discount applied: ₹{MIN_ORDER_PROMO_DISCOUNT} off on order above ₹{MIN_ORDER_PROMO_THRESHOLD}!
                </p>
              </div>
            )}

            {/* Coupon Input */}
            <div className="bg-card rounded-xl border shadow-sm p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-base">Apply Coupon</h2>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-primary/8 border border-primary/20 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-bold text-sm text-primary">{appliedCoupon.code}</p>
                      <p className="text-xs text-muted-foreground">{appliedCoupon.message}</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code (e.g. WELCOME10)"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="uppercase font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || validateCoupon.isPending}
                      className="text-primary border-primary/30 hover:bg-primary hover:text-white shrink-0"
                    >
                      {validateCoupon.isPending ? "..." : "Apply"}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                      <X className="h-3 w-3" /> {couponError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Try: <button className="text-primary font-semibold hover:underline" onClick={() => setCouponCode("WELCOME10")}>WELCOME10</button>
                    {" · "}
                    <button className="text-primary font-semibold hover:underline" onClick={() => setCouponCode("BANDA50")}>BANDA50</button>
                  </p>
                </div>
              )}
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
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" placeholder="Ramesh Kumar" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="9876543210" maxLength={10} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Complete Address (in Banda)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9 min-h-[90px]" placeholder="House No, Street, Landmark..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Summary */}
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
                  <span className="text-primary font-medium">FREE</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span className="flex items-center gap-1 font-medium">
                      <Tag className="h-3.5 w-3.5" />
                      {appliedCoupon ? appliedCoupon.code : "Auto Discount"}
                    </span>
                    <span className="font-bold">− ₹{discountAmount}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg">To Pay</span>
                <div className="text-right">
                  {discountAmount > 0 && (
                    <span className="text-xs text-muted-foreground line-through block">₹{total}</span>
                  )}
                  <span className="font-bold text-xl text-primary">₹{finalTotal}</span>
                </div>
              </div>

              {total < minOrder && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4 font-medium">
                  Add items worth ₹{minOrder - total} more to reach minimum order of ₹{minOrder}.
                </div>
              )}

              <Button
                className="w-full rounded-full h-12 text-base font-bold shadow-md"
                size="lg"
                disabled={total < minOrder || createOrder.isPending}
                onClick={handlePlaceOrder}
              >
                {createOrder.isPending ? "Processing..." : (
                  <>Place Order <ArrowRight className="h-5 w-5 ml-2" /></>
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
