import { useState, useMemo } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { useGetStore, useListProducts } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, MapPin, Search, Plus, Minus, ShoppingCart, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StorePage() {
  const [match, params] = useRoute("/store/:storeId");
  const storeId = parseInt(params?.storeId || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { data: store, isLoading: isLoadingStore } = useGetStore(storeId, { query: { enabled: !!storeId } });
  const { data: products, isLoading: isLoadingProducts } = useListProducts(storeId, { search: search || undefined }, { query: { enabled: !!storeId } });

  const { items, addItem, removeItem, updateQuantity, storeId: cartStoreId } = useCart();

  const categories = useMemo(() => {
    if (!products) return ["All"];
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ["All", ...cats.sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeCategory === "All") return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (isLoadingStore) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-48 bg-muted animate-pulse" />
        <div className="container mx-auto px-4 -mt-10 relative z-10">
          <Skeleton className="h-32 w-full rounded-xl bg-card border shadow-sm" />
          <div className="mt-6 flex space-x-2">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <Skeleton className="h-32 w-full rounded-xl" />
             <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Store not found</h2>
          <Button onClick={() => setLocation("/")}>Back to Bazaar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      {/* Store Header Banner */}
      <div className="h-48 md:h-64 relative bg-muted">
         {store.imageUrl ? (
           <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
         ) : (
           <div className="w-full h-full bg-gradient-to-r from-orange-200 to-amber-200" />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
         
         <div className="absolute top-4 left-4 z-10">
            <Button variant="secondary" size="icon" className="rounded-full bg-white/90 shadow-md hover:bg-white" asChild>
              <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
         </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-16 relative z-10">
        {/* Store Info Card */}
        <div className="bg-card rounded-xl p-5 md:p-6 shadow-md border mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <div className="flex items-center gap-3 mb-1">
               <h1 className="text-2xl md:text-3xl font-bold font-serif">{store.name}</h1>
               {!store.isOpen && <Badge variant="destructive">CLOSED</Badge>}
             </div>
             <p className="text-muted-foreground text-sm flex items-center mb-3">
               <MapPin className="h-3.5 w-3.5 mr-1" /> {store.address}
             </p>
             <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm font-medium">
               <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                  <Star className="h-4 w-4 fill-current mr-1" /> 
                  {store.rating ? store.rating.toFixed(1) : "New"} 
                  {store.totalRatings ? <span className="text-muted-foreground ml-1 text-xs">({store.totalRatings})</span> : null}
               </div>
               <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1.5" /> 
                  {store.deliveryTimeMinutes ? `${store.deliveryTimeMinutes} mins` : '30-45 mins'}
               </div>
               <div className="text-muted-foreground">
                  Min. <span className="font-bold text-foreground">₹{store.minOrderAmount}</span>
               </div>
             </div>
           </div>
           
           <div className="relative w-full md:w-64 shrink-0">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search items..." 
               className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 sticky top-16 z-30 bg-background/95 backdrop-blur py-2">
           {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors shadow-sm border ${
                  activeCategory === c 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card text-card-foreground border-border hover:bg-accent"
                }`}
              >
                {c}
              </button>
            ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {isLoadingProducts ? (
             [1,2,3,4,5,6].map(i => (
               <Skeleton key={i} className="h-32 w-full rounded-xl" />
             ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const cartItem = items.find(i => i.productId === product.id);
              const qty = cartItem?.quantity || 0;
              
              return (
                <div key={product.id} className={`flex bg-card rounded-xl border p-3 shadow-sm ${!product.inStock || !store.isOpen ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                   <div className="w-20 h-20 bg-muted rounded-lg shrink-0 mr-3 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-2xl opacity-20 font-serif font-bold text-primary">{product.name.charAt(0)}</div>
                      )}
                   </div>
                   <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.name}</h3>
                          {!product.inStock && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Out of stock</Badge>}
                        </div>
                        {product.nameHindi && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{product.nameHindi}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{product.unit || '1 unit'}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold">₹{product.price}</span>
                        
                        {store.isOpen && product.inStock ? (
                          qty > 0 ? (
                            <div className="flex items-center bg-primary text-primary-foreground rounded-lg overflow-hidden h-8 shadow-sm">
                               <button 
                                 className="px-2.5 h-full hover:bg-black/10 active:bg-black/20 transition-colors"
                                 onClick={() => updateQuantity(product.id, qty - 1)}
                               >
                                 <Minus className="h-3 w-3" />
                               </button>
                               <span className="text-sm font-bold w-6 text-center">{qty}</span>
                               <button 
                                 className="px-2.5 h-full hover:bg-black/10 active:bg-black/20 transition-colors"
                                 onClick={() => updateQuantity(product.id, qty + 1)}
                               >
                                 <Plus className="h-3 w-3" />
                               </button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground font-bold shadow-sm"
                              onClick={() => {
                                if (cartStoreId && cartStoreId !== storeId) {
                                  toast({
                                    title: "Clear cart?",
                                    description: "Adding items from a different store will clear your current cart.",
                                    action: (
                                      <Button variant="destructive" size="sm" onClick={() => addItem({ productId: product.id, productName: product.name, price: product.price, quantity: 1, storeId })}>
                                        Clear & Add
                                      </Button>
                                    )
                                  });
                                } else {
                                  addItem({ productId: product.id, productName: product.name, price: product.price, quantity: 1, storeId });
                                }
                              }}
                            >
                              ADD
                            </Button>
                          )
                        ) : null}
                      </div>
                   </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed rounded-xl">
              <p className="text-muted-foreground">No products found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Bar */}
      {cartItemCount > 0 && cartStoreId === storeId && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40 animate-in slide-in-from-bottom-5">
          <Link href="/cart">
            <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-xl flex items-center justify-between cursor-pointer hover:bg-primary/95 transition-colors border border-black/10">
               <div className="flex items-center">
                 <div className="relative mr-3">
                   <ShoppingCart className="h-6 w-6" />
                   <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                     {cartItemCount}
                   </span>
                 </div>
                 <div>
                   <p className="font-bold text-sm">{cartItemCount} items</p>
                   <p className="text-xs text-primary-foreground/80 font-medium">₹{cartTotal} plus taxes</p>
                 </div>
               </div>
               <div className="flex items-center font-bold text-sm">
                 View Cart <ChevronLeft className="h-4 w-4 rotate-180 ml-1" />
               </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
