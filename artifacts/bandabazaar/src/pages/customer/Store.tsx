import { useState, useMemo, useCallback } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { useGetStore, useListProducts } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock, Star, MapPin, Search, Plus, Minus, ShoppingCart,
  ChevronLeft, SlidersHorizontal, X, ChevronDown, ChevronUp,
  ArrowUpDown, Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

const PRODUCTS_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: "default",    label: "Default" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc",   label: "Name: A → Z" },
  { value: "name_desc",  label: "Name: Z → A" },
];

const RATING_OPTIONS = [
  { value: 0, label: "All Ratings" },
  { value: 4, label: "4★ & above" },
  { value: 3, label: "3★ & above" },
  { value: 2, label: "2★ & above" },
];

function StarDisplay({ rating, size = "sm" }: { rating?: number | null; size?: "sm" | "md" }) {
  const r = rating ?? 0;
  return (
    <div className={`flex items-center gap-0.5 ${size === "md" ? "text-sm" : "text-xs"}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${size === "md" ? "h-4 w-4" : "h-3 w-3"} ${i <= Math.round(r) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"}`}
        />
      ))}
      {r > 0 && <span className="ml-1 text-muted-foreground font-medium">{r.toFixed(1)}</span>}
    </div>
  );
}

function ProductCard({
  product,
  store,
  qty,
  onAdd,
  onInc,
  onDec,
}: {
  product: Product;
  store: { isOpen: boolean; id: number };
  qty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const canBuy = store.isOpen && product.inStock;

  return (
    <div className={`group relative bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${!canBuy ? "opacity-60 grayscale-[0.4]" : ""}`}>
      {/* Product Image */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
            <span className="text-5xl font-bold font-serif text-primary/20">{product.name.charAt(0)}</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Badge variant="secondary" className="font-bold">Out of Stock</Badge>
          </div>
        )}

        {/* Hover Add to Cart — sticky on hover */}
        {canBuy && qty === 0 && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <button
              onClick={onAdd}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:bg-primary/80 transition-colors"
            >
              + Add to Cart
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-sm leading-snug line-clamp-2 mb-0.5">{product.name}</h3>
          {product.nameHindi && (
            <p className="text-xs text-muted-foreground font-medium mb-1">{product.nameHindi}</p>
          )}
          <p className="text-xs text-muted-foreground mb-1.5">{product.unit || "1 unit"}</p>
          <StarDisplay rating={null} />
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-base font-bold text-foreground">₹{product.price}</span>

          {canBuy ? (
            qty > 0 ? (
              <div className="flex items-center bg-primary text-primary-foreground rounded-lg overflow-hidden h-8 shadow-sm">
                <button className="px-2.5 h-full hover:bg-black/10 active:bg-black/20 transition-colors" onClick={onDec}>
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-6 text-center">{qty}</span>
                <button className="px-2.5 h-full hover:bg-black/10 active:bg-black/20 transition-colors" onClick={onInc}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground font-bold"
                onClick={onAdd}
              >
                ADD
              </Button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-sm font-bold text-zinc-900 mb-2 hover:text-primary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

export default function StorePage() {
  const [match, params] = useRoute("/store/:storeId");
  const storeId = parseInt(params?.storeId || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Search & Sort
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Filters
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [minRating, setMinRating] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);

  const { data: store, isLoading: isLoadingStore } = useGetStore(storeId, { query: { enabled: !!storeId } });
  const { data: products, isLoading: isLoadingProducts } = useListProducts(storeId, { search: search || undefined }, { query: { enabled: !!storeId } });

  const { items, addItem, removeItem, updateQuantity, storeId: cartStoreId } = useCart();

  const categories = useMemo(() => {
    if (!products) return [];
    return Array.from(new Set(products.map(p => p.category))).sort();
  }, [products]);

  const maxPrice = useMemo(() => {
    if (!products || products.length === 0) return 2000;
    return Math.ceil(Math.max(...products.map(p => p.price)) / 100) * 100;
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    // Price range filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Rating filter (using 0 since products don't have ratings from API, skip for now)
    // minRating filter would apply if products had ratings

    // Sort
    if (sortBy === "price_asc")  result.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name_asc")   result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc")  result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }, [products, selectedCategories, priceRange, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredAndSorted.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddToCart = useCallback((product: Product) => {
    if (cartStoreId && cartStoreId !== storeId) {
      toast({
        title: "Cart mein alag store ka saman hai",
        description: "Naya item add karne pe purana cart saaf ho jaayega.",
        action: (
          <Button variant="destructive" size="sm" onClick={() => addItem({ productId: product.id, productName: product.name, price: product.price, quantity: 1, storeId })}>
            Clear & Add
          </Button>
        ),
      });
    } else {
      addItem({ productId: product.id, productName: product.name, price: product.price, quantity: 1, storeId });
    }
  }, [cartStoreId, storeId, addItem, toast]);

  const toggleCategory = (cat: string) => {
    setPage(1);
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const activeFilterCount =
    selectedCategories.length +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setSortBy("default");
    setPage(1);
  };

  if (isLoadingStore) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-48 bg-muted animate-pulse" />
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-32 w-full rounded-xl mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
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
    <div className="min-h-screen bg-background pb-28">
      <Header />

      {/* Store Banner */}
      <div className="h-44 md:h-56 relative bg-muted">
        {store.imageUrl ? (
          <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-200 to-amber-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 left-4 z-10">
          <Button variant="secondary" size="icon" className="rounded-full bg-white/90 shadow hover:bg-white" asChild>
            <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-14 relative z-10">
        {/* Store Info */}
        <div className="bg-card rounded-2xl p-5 shadow-md border mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold font-serif">{store.name}</h1>
                {!store.isOpen && <Badge variant="destructive">CLOSED</Badge>}
              </div>
              <p className="text-muted-foreground text-sm flex items-center mb-2">
                <MapPin className="h-3.5 w-3.5 mr-1" /> {store.address}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 font-medium">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  {store.rating ? store.rating.toFixed(1) : "New"}
                  {store.totalRatings ? <span className="text-muted-foreground ml-1 text-xs">({store.totalRatings})</span> : null}
                </span>
                <span className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {store.deliveryTimeMinutes ? `${store.deliveryTimeMinutes} mins` : "30-45 mins"}
                </span>
                <span className="text-muted-foreground">
                  Min. <span className="font-bold text-foreground">₹{store.minOrderAmount}</span>
                </span>
              </div>
            </div>

            {/* Search + Sort row */}
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9 bg-muted/40 border-0"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: filter toggle + sort + result count */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={sidebarOpen ? "default" : "outline"}
              size="sm"
              className="gap-1.5 relative"
              onClick={() => setSidebarOpen(o => !o)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
            <span className="text-xs text-muted-foreground hidden sm:block">
              {filteredAndSorted.length} product{filteredAndSorted.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="w-44 h-9 text-sm bg-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main layout: Sidebar + Grid */}
        <div className="flex gap-6">

          {/* Collapsible Sidebar */}
          {sidebarOpen && (
            <aside className="w-56 shrink-0 hidden md:block">
              <div className="bg-card rounded-2xl border shadow-sm p-4 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-sm text-zinc-900">Filters</h2>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Reset</button>
                  )}
                </div>

                {/* Category Filter */}
                <FilterSection title="Category">
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="rounded border-zinc-300 text-primary accent-primary w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-sm group-hover:text-primary transition-colors ${selectedCategories.includes(cat) ? "font-semibold text-primary" : "text-zinc-700"}`}>
                          {cat}
                        </span>
                      </label>
                    ))}
                    {categories.length === 0 && <p className="text-xs text-muted-foreground">No categories</p>}
                  </div>
                </FilterSection>

                {/* Price Range */}
                <FilterSection title="Price Range">
                  <div className="px-1">
                    <Slider
                      min={0}
                      max={maxPrice || 2000}
                      step={10}
                      value={priceRange}
                      onValueChange={(v) => { setPriceRange(v as [number, number]); setPage(1); }}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-xs font-medium text-zinc-700">
                      <span className="bg-zinc-100 px-2 py-1 rounded">₹{priceRange[0]}</span>
                      <span className="bg-zinc-100 px-2 py-1 rounded">₹{priceRange[1]}</span>
                    </div>
                  </div>
                </FilterSection>

                {/* Rating Filter */}
                <FilterSection title="Min. Rating">
                  <div className="space-y-2">
                    {RATING_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="rating"
                          checked={minRating === opt.value}
                          onChange={() => { setMinRating(opt.value); setPage(1); }}
                          className="accent-primary w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-sm transition-colors ${minRating === opt.value ? "font-semibold text-primary" : "text-zinc-700"}`}>
                          {opt.value > 0 ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {opt.label}
                            </span>
                          ) : opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </aside>
          )}

          {/* Mobile: Filter drawer chips */}
          {sidebarOpen && (
            <div className="md:hidden w-full mb-4 bg-card rounded-xl border p-3 flex flex-col gap-3">
              {/* Categories mobile */}
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${selectedCategories.includes(cat) ? "bg-primary text-white border-primary" : "bg-zinc-50 text-zinc-700 border-zinc-200"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              {/* Price range mobile */}
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Price: ₹{priceRange[0]} – ₹{priceRange[1]}</p>
                <Slider
                  min={0}
                  max={maxPrice || 2000}
                  step={10}
                  value={priceRange}
                  onValueChange={(v) => { setPriceRange(v as [number, number]); setPage(1); }}
                />
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {paginatedProducts.map(product => {
                    const cartItem = items.find(i => i.productId === product.id);
                    const qty = cartItem?.quantity || 0;
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        store={{ isOpen: store.isOpen, id: storeId }}
                        qty={qty}
                        onAdd={() => handleAddToCart(product)}
                        onInc={() => updateQuantity(product.id, qty + 1)}
                        onDec={() => updateQuantity(product.id, qty - 1)}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border hover:bg-accent text-zinc-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                )}

                <p className="text-center text-xs text-muted-foreground mt-3">
                  Showing {(page - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(page * PRODUCTS_PER_PAGE, filteredAndSorted.length)} of {filteredAndSorted.length} products
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl">
                <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="font-bold text-lg text-zinc-900">No products found</p>
                <p className="text-muted-foreground text-sm">Try changing filters or search term</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                    <X className="h-4 w-4 mr-1" /> Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Bar */}
      {cartItemCount > 0 && cartStoreId === storeId && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-5">
          <Link href="/cart">
            <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-2xl flex items-center justify-between cursor-pointer hover:bg-primary/95 transition-colors border border-black/10">
              <div className="flex items-center">
                <div className="relative mr-3">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm">{cartItemCount} items in cart</p>
                  <p className="text-xs text-primary-foreground/80">₹{cartTotal} total</p>
                </div>
              </div>
              <span className="font-bold text-sm flex items-center">
                View Cart <ChevronLeft className="h-4 w-4 rotate-180 ml-1" />
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
