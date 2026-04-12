import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { useListStores } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, Clock, Star, Store as StoreIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["Grocery", "Vegetables", "Fruits", "Meat", "Dairy", "Pharmacy"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");

  const { data: stores, isLoading } = useListStores({ search: search || undefined, category: category || undefined });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:px-6">
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-orange-400 p-6 sm:p-8 md:p-10 shadow-lg mb-6">
            <div className="relative z-10 text-primary-foreground max-w-2xl">
              <h1 className="text-3xl font-bold font-serif sm:text-4xl md:text-5xl mb-2">Bazaar at your doorstep.</h1>
              <p className="text-primary-foreground/90 text-lg mb-6 max-w-xl">Fresh groceries from Banda's trusted local shops. Fast, reliable, and supporting local business.</p>
              <div className="relative max-w-md bg-white rounded-xl shadow-md p-1">
                <div className="flex items-center px-3">
                  <Search className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
                  <Input 
                    type="search" 
                    placeholder="Search for stores or items..." 
                    className="border-0 shadow-none focus-visible:ring-0 text-foreground h-10 px-0"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* Decorative background element */}
            <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
              <StoreIcon className="w-64 h-64" />
            </div>
          </div>

          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
             <button
                onClick={() => setCategory("")}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors shadow-sm border ${
                  category === "" 
                    ? "bg-secondary text-secondary-foreground border-secondary" 
                    : "bg-card text-card-foreground border-border hover:bg-accent"
                }`}
              >
                All
              </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors shadow-sm border ${
                  category === c 
                    ? "bg-secondary text-secondary-foreground border-secondary" 
                    : "bg-card text-card-foreground border-border hover:bg-accent"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 font-serif text-foreground">Nearby Stores</h2>
          
          {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
               {[1,2,3,4].map(i => (
                 <div key={i} className="flex flex-col space-y-3 bg-card rounded-xl border p-4">
                   <Skeleton className="h-32 w-full rounded-lg" />
                   <Skeleton className="h-6 w-3/4" />
                   <Skeleton className="h-4 w-1/2" />
                 </div>
               ))}
             </div>
          ) : stores && stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {stores.map((store) => (
                <Link key={store.id} href={`/store/${store.id}`}>
                  <div className="group relative flex flex-col bg-card rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden h-full">
                    {/* Store Image Placeholder / Header */}
                    <div className="h-32 bg-muted relative flex items-center justify-center border-b">
                      {store.imageUrl ? (
                        <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <StoreIcon className="h-12 w-12 text-muted-foreground/30" />
                      )}
                      {!store.isOpen && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-[1px]">
                          <Badge variant="destructive" className="text-sm shadow-md">CLOSED</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">{store.name}</h3>
                        {store.rating ? (
                          <div className="flex items-center bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-bold shadow-xs">
                            <span className="mr-0.5">{store.rating.toFixed(1)}</span>
                            <Star className="h-3 w-3 fill-current" />
                          </div>
                        ) : null}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 flex items-center">
                        <span className="truncate">{store.category}</span>
                      </p>
                      
                      <div className="mt-auto pt-3 border-t flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center text-muted-foreground">
                           <Clock className="h-3.5 w-3.5 mr-1" />
                           {store.deliveryTimeMinutes ? `${store.deliveryTimeMinutes} mins` : '30-45 mins'}
                        </div>
                        <div className="text-muted-foreground">
                           Min. <span className="font-sans font-bold">₹{store.minOrderAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 border rounded-2xl bg-card border-dashed">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <StoreIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-1">No stores found</h3>
              <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
