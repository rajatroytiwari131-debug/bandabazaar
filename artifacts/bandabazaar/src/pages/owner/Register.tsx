import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { OwnerHeader } from "@/components/layout/OwnerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateStore, useListStores } from "@workspace/api-client-react";

const CATEGORIES = ["Grocery", "Vegetables", "Fruits", "Meat", "Dairy", "Pharmacy", "General Store"];

export default function OwnerRegister() {
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  const [minOrder, setMinOrder] = useState("100");
  const [deliveryTime, setDeliveryTime] = useState("45");
  const [imageUrl, setImageUrl] = useState("");

  const createStore = useCreateStore();
  const { data: stores, refetch } = useListStores({ search: phone }, { query: { enabled: false } });

  useEffect(() => {
    const session = localStorage.getItem("bb_owner_phone");
    if (!session) {
      setLocation("/owner");
    } else {
      setPhone(session);
      refetch();
    }
  }, [setLocation, refetch]);

  useEffect(() => {
    if (stores && stores.length > 0) {
      setLocation("/owner/dashboard");
    }
  }, [stores, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !category) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    createStore.mutate({
      data: {
        name,
        ownerPhone: phone,
        address,
        category,
        minOrderAmount: parseInt(minOrder, 10) || 0,
        deliveryTimeMinutes: parseInt(deliveryTime, 10) || 30,
        imageUrl: imageUrl || null
      }
    }, {
      onSuccess: () => {
        toast({ title: "Store registered successfully!", description: "Waiting for admin approval." });
        setLocation("/owner/dashboard");
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <OwnerHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card rounded-xl border shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-serif">Register Your Store</h1>
            <p className="text-muted-foreground mt-1">Join BandaBazaar and start receiving orders online.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Gupta General Store" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Full Address (in Banda) *</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Shop No, Street, Landmark..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrder">Min Order Amount (₹)</Label>
                  <Input id="minOrder" type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime">Est. Delivery Time (mins)</Label>
                  <Input id="deliveryTime" type="number" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Store Image URL (Optional)</Label>
                <Input id="image" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={createStore.isPending}>
              {createStore.isPending ? "Registering..." : "Register Store"}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              By registering, you agree to a standard 8% commission on all orders.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
