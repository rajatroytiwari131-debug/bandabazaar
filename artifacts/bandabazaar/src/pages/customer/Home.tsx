import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { useListStores } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, Star, Store as StoreIcon, MapPin, ChevronRight, Zap, ShieldCheck, Leaf } from "lucide-react";

const CATEGORIES = [
  { name: "All",       emoji: "🏪" },
  { name: "Grocery",   emoji: "🛒" },
  { name: "Vegetables",emoji: "🥦" },
  { name: "Fruits",    emoji: "🍎" },
  { name: "Dairy",     emoji: "🥛" },
  { name: "Snacks",    emoji: "🍿" },
  { name: "Pharmacy",  emoji: "💊" },
  { name: "Beverages", emoji: "🧃" },
  { name: "Meat",      emoji: "🥩" },
];

const TRUST_BADGES = [
  { icon: Zap,         label: "Express Delivery", sub: "25–45 mins" },
  { icon: ShieldCheck, label: "Verified Stores",   sub: "Admin approved" },
  { icon: Leaf,        label: "Fresh & Local",     sub: "Banda's own bazaar" },
];

export default function Home() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("");

  const { data: stores, isLoading } = useListStores({
    search: search || undefined,
    category: category || undefined,
  });

  const openStores   = stores?.filter(s => s.isOpen)   || [];
  const closedStores = stores?.filter(s => !s.isOpen)  || [];
  const sortedStores = [...openStores, ...closedStores];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 md:px-6">

        {/* Hero */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-green-500 to-emerald-600 p-6 sm:p-10 shadow-xl mb-6">
            {/* Decorative circles */}
            <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute right-10 -bottom-16 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10 text-white max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5" /> Banda, UP 210001
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-2 leading-tight">
                Bazaar at your doorstep.
              </h1>
              <p className="text-white/85 text-base mb-6 leading-relaxed">
                Fresh groceries from Banda's trusted kirana stores — delivered fast. <span className="font-semibold text-white">⚡ 25–45 mins</span>
              </p>

              {/* Search bar */}
              <div className="relative bg-white rounded-xl shadow-lg overflow-hidden flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  type="search"
                  placeholder="Search stores, products..."
                  className="border-0 shadow-none focus-visible:ring-0 text-foreground h-12 pl-11 pr-4 text-base"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="pr-3 text-muted-foreground hover:text-foreground text-xs font-medium">
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center bg-card border rounded-xl p-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {CATEGORIES.map(c => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name === "All" ? "" : c.name)}
                className={`whitespace-nowrap flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all border shadow-sm ${
                  (c.name === "All" && category === "") || c.name === category
                    ? "bg-primary text-white border-primary shadow-primary/20 shadow-md"
                    : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <span>{c.emoji}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Store listings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-serif text-foreground">
              {category ? `${category} Stores` : "Nearby Stores"}
              {!isLoading && stores && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({stores.length} {stores.length === 1 ? "store" : "stores"})
                </span>
              )}
            </h2>
            {openStores.length > 0 && !isLoading && (
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {openStores.length} open now
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-card border rounded-2xl overflow-hidden">
                  <Skeleton className="h-36 w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedStores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedStores.map(store => (
                <Link key={store.id} href={`/store/${store.id}`}>
                  <div className={`group flex flex-col bg-card rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full ${!store.isOpen ? "opacity-80" : ""}`}>

                    {/* Image */}
                    <div className="h-36 bg-muted relative overflow-hidden">
                      {store.imageUrl ? (
                        <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-emerald-100 flex items-center justify-center">
                          <StoreIcon className="h-14 w-14 text-primary/30" />
                        </div>
                      )}

                      {/* Delivery badge */}
                      <div className="absolute top-2 left-2">
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-white/95 text-primary px-2 py-0.5 rounded-full shadow-sm border border-primary/10">
                          <Clock className="h-3 w-3" />
                          {store.deliveryTimeMinutes ? `${store.deliveryTimeMinutes} min` : "30–45 min"}
                        </span>
                      </div>

                      {/* Rating */}
                      {store.rating && (
                        <div className="absolute top-2 right-2">
                          <span className="flex items-center gap-0.5 text-[11px] font-bold bg-white/95 text-amber-600 px-2 py-0.5 rounded-full shadow-sm">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {store.rating.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Closed overlay */}
                      {!store.isOpen && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                          <Badge variant="destructive" className="text-xs font-bold shadow-md">CLOSED</Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                          {store.name}
                        </h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors mt-0.5" />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <span className="inline-flex items-center gap-1 bg-primary/8 text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/15">
                          {store.category}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground flex items-start gap-1 mb-3 line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {store.address}
                      </p>

                      <div className="mt-auto pt-2.5 border-t flex items-center justify-between">
                        <div className={`text-xs font-bold flex items-center gap-1 ${store.isOpen ? "text-primary" : "text-muted-foreground"}`}>
                          <span className={`w-2 h-2 rounded-full ${store.isOpen ? "bg-primary" : "bg-muted-foreground"}`} />
                          {store.isOpen ? "Open Now" : "Closed"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Min. <span className="font-bold text-foreground">₹{store.minOrderAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed rounded-2xl bg-card">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <StoreIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-1">No stores found</h3>
              <p className="text-muted-foreground text-sm">Try a different category or clear the search.</p>
              {(search || category) && (
                <button
                  onClick={() => { setSearch(""); setCategory(""); }}
                  className="mt-4 text-sm text-primary font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
