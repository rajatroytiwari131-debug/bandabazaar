import { useState } from "react";
import { OwnerHeader } from "@/components/layout/OwnerHeader";
import { useAuth } from "@/context/AuthContext";
import { useListStoreCoupons, useCreateStoreCoupon, useUpdateStoreCoupon, useDeleteStoreCoupon, getListStoreCouponsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Ticket, Plus, Trash2, Tag, Percent, IndianRupee } from "lucide-react";

export default function OwnerPromotions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const storeId = user?.storeId ?? 0;

  const { data: coupons, isLoading } = useListStoreCoupons(storeId, { query: { enabled: !!storeId } as any });
  const createCoupon = useCreateStoreCoupon();
  const updateCoupon = useUpdateStoreCoupon();
  const deleteCoupon = useDeleteStoreCoupon();

  const storeCoupons = coupons?.filter(c => c.storeId === storeId) ?? [];
  const globalCoupons = coupons?.filter(c => c.storeId == null) ?? [];

  const resetForm = () => {
    setCode(""); setType("percent"); setValue(""); setMinOrderAmount("");
    setMaxDiscount(""); setUsageLimit(""); setExpiresAt(""); setDescription(""); setIsActive(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) { toast({ title: "Code and value are required", variant: "destructive" }); return; }

    createCoupon.mutate({
      storeId,
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        expiresAt: expiresAt || null,
        description: description || null,
        isActive,
      },
    }, {
      onSuccess: () => {
        toast({ title: "Coupon created!" });
        queryClient.invalidateQueries({ queryKey: getListStoreCouponsQueryKey(storeId) });
        setIsAddOpen(false);
        resetForm();
      },
      onError: (err: any) => toast({ title: err?.response?.data?.error ?? "Failed to create coupon", variant: "destructive" }),
    });
  };

  const handleToggle = (couponCode: string, currentIsActive: boolean) => {
    updateCoupon.mutate({ storeId, code: couponCode, data: { isActive: !currentIsActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStoreCouponsQueryKey(storeId) });
      },
    });
  };

  const handleDelete = (couponCode: string) => {
    if (!confirm(`Delete coupon ${couponCode}?`)) return;
    deleteCoupon.mutate({ storeId, code: couponCode }, {
      onSuccess: () => {
        toast({ title: "Coupon deleted" });
        queryClient.invalidateQueries({ queryKey: getListStoreCouponsQueryKey(storeId) });
      },
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <OwnerHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
              <Ticket className="h-6 w-6 text-primary" /> Promotions & Coupons
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Create discount codes for your customers</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Coupon
          </Button>
        </div>

        {/* Auto-promotion info card */}
        <div className="bg-primary/8 border border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-foreground mb-1">Automatic Platform Promotion (always active)</p>
              <p className="text-sm text-muted-foreground">Customers get <span className="font-bold text-foreground">₹30 off</span> automatically on orders above <span className="font-bold text-foreground">₹400</span>. This is applied by the platform and does not count as your store coupon.</p>
            </div>
          </div>
        </div>

        {/* Store Coupons */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-bold text-base">Your Store Coupons</h2>
            <Badge variant="secondary">{storeCoupons.length}</Badge>
          </div>
          {isLoading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading...</div>
          ) : storeCoupons.length === 0 ? (
            <div className="py-12 text-center">
              <Ticket className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-bold text-zinc-700">No coupons yet</p>
              <p className="text-sm text-muted-foreground">Create your first coupon to attract customers</p>
            </div>
          ) : (
            <div className="divide-y">
              {storeCoupons.map(c => (
                <div key={c.id} className={`px-6 py-4 flex items-center justify-between gap-4 ${!c.isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.type === "percent" ? "bg-purple-100 text-purple-600" : "bg-amber-100 text-amber-600"}`}>
                      {c.type === "percent" ? <Percent className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm">{c.code}</span>
                        <Badge variant={c.isActive ? "default" : "secondary"} className="text-[10px]">
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                        {c.minOrderAmount > 0 && ` · Min ₹${c.minOrderAmount}`}
                        {c.maxDiscount && ` · Max ₹${c.maxDiscount}`}
                        {c.usageLimit && ` · ${c.usedCount}/${c.usageLimit} used`}
                      </p>
                      {c.description && <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-1">{c.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={c.isActive} onCheckedChange={() => handleToggle(c.code, c.isActive)} />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.code)} disabled={deleteCoupon.isPending}>
                      <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform coupons (read-only) */}
        {globalCoupons.length > 0 && (
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
              <h2 className="font-bold text-base">Platform Coupons (All Stores)</h2>
              <Badge variant="outline">{globalCoupons.length}</Badge>
            </div>
            <div className="divide-y">
              {globalCoupons.map(c => (
                <div key={c.id} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm">{c.code}</span>
                      <Badge variant={c.isActive ? "default" : "secondary"} className="text-[10px]">{c.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                      {c.minOrderAmount > 0 && ` · Min ₹${c.minOrderAmount}`}
                    </p>
                    {c.description && <p className="text-xs text-muted-foreground italic">{c.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Coupon Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Coupon Code *</Label>
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER20" className="uppercase font-mono" required />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={type} onValueChange={v => setType(v as "percent" | "fixed")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{type === "percent" ? "Discount %" : "Discount ₹"} *</Label>
                <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={type === "percent" ? "10" : "50"} min="0" required />
              </div>
              <div className="space-y-2">
                <Label>Min. Order Amount (₹)</Label>
                <Input type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} placeholder="0" min="0" />
              </div>
              {type === "percent" && (
                <div className="space-y-2">
                  <Label>Max Discount (₹)</Label>
                  <Input type="number" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} placeholder="No limit" min="0" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="Unlimited" min="1" />
              </div>
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description (shown to customers)</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 10% off on all orders" />
              </div>
              <div className="col-span-2 flex items-center justify-between border rounded-lg p-3">
                <div><Label>Active</Label><p className="text-xs text-muted-foreground">Coupon can be used immediately</p></div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
              <Button type="submit" disabled={createCoupon.isPending}>
                {createCoupon.isPending ? "Creating..." : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
