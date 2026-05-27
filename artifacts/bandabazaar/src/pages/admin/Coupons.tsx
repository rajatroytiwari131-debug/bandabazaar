import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { useListAdminCoupons, useCreateAdminCoupon, useUpdateAdminCoupon, useDeleteAdminCoupon, getListAdminCouponsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Ticket, Plus, Trash2, Percent, IndianRupee, Globe, Store, RefreshCw } from "lucide-react";
import type { Coupon } from "@workspace/api-client-react";

export default function AdminCoupons() {
  const [, setLocation] = useLocation();
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

  useEffect(() => {
    const session = localStorage.getItem("bb_admin_authed");
    if (session !== "true") setLocation("/admin");
  }, [setLocation]);

  const { data: coupons, isLoading } = useListAdminCoupons();
  const createCoupon = useCreateAdminCoupon();
  const updateCoupon = useUpdateAdminCoupon();
  const deleteCoupon = useDeleteAdminCoupon();

  const globalCoupons = coupons?.filter(c => c.storeId == null) ?? [];
  const storeCoupons = coupons?.filter(c => c.storeId != null) ?? [];

  const resetForm = () => {
    setCode(""); setType("percent"); setValue(""); setMinOrderAmount("");
    setMaxDiscount(""); setUsageLimit(""); setExpiresAt(""); setDescription(""); setIsActive(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) { toast({ title: "Code and value are required", variant: "destructive" }); return; }

    createCoupon.mutate({
      data: {
        code: code.toUpperCase(), type, value: parseFloat(value),
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        expiresAt: expiresAt || null,
        description: description || null,
        isActive,
      },
    }, {
      onSuccess: () => {
        toast({ title: "Platform coupon created!" });
        queryClient.invalidateQueries({ queryKey: getListAdminCouponsQueryKey() });
        setIsAddOpen(false);
        resetForm();
      },
      onError: (err: any) => toast({ title: err?.response?.data?.error ?? "Failed to create coupon", variant: "destructive" }),
    });
  };

  const handleToggle = (coupon: Coupon) => {
    updateCoupon.mutate({ code: coupon.code, data: { isActive: !coupon.isActive } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAdminCouponsQueryKey() }),
    });
  };

  const handleDelete = (couponCode: string) => {
    if (!confirm(`Delete coupon ${couponCode}? This cannot be undone.`)) return;
    deleteCoupon.mutate({ code: couponCode }, {
      onSuccess: () => {
        toast({ title: "Coupon deleted" });
        queryClient.invalidateQueries({ queryKey: getListAdminCouponsQueryKey() });
      },
    });
  };

  const CouponRow = ({ c }: { c: Coupon }) => (
    <tr className={`hover:bg-muted/30 transition-colors ${!c.isActive ? "opacity-60" : ""}`}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.type === "percent" ? "bg-purple-100 text-purple-600" : "bg-amber-100 text-amber-600"}`}>
            {c.type === "percent" ? <Percent className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm">{c.code}</span>
              {c.storeId == null ? (
                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" /> Platform</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] flex items-center gap-0.5"><Store className="h-2.5 w-2.5" /> Store #{c.storeId}</Badge>
              )}
            </div>
            {c.description && <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">{c.description}</p>}
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-sm">
        <span className="font-bold">{c.type === "percent" ? `${c.value}%` : `₹${c.value}`}</span>
        {c.type === "percent" && c.maxDiscount && <span className="text-muted-foreground text-xs"> (max ₹{c.maxDiscount})</span>}
      </td>
      <td className="px-5 py-4 text-sm text-muted-foreground">
        {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "None"}
      </td>
      <td className="px-5 py-4 text-sm">
        <span className={`font-medium ${c.usageLimit ? "text-foreground" : "text-muted-foreground"}`}>
          {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : " used"}
        </span>
      </td>
      <td className="px-5 py-4">
        <Badge variant={c.isActive ? "default" : "secondary"} className="text-xs">
          {c.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {c.storeId == null && (
            <Switch checked={c.isActive} onCheckedChange={() => handleToggle(c)} />
          )}
          {c.storeId == null && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(c.code)} disabled={deleteCoupon.isPending}>
              <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-zinc-50 pb-12">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Ticket className="h-6 w-6 text-primary" /> Coupon Management
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Create and manage platform-wide discount codes</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Platform Coupon
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Coupons", value: coupons?.length ?? 0, icon: Ticket },
            { label: "Platform-wide", value: globalCoupons.length, icon: Globe },
            { label: "Store-specific", value: storeCoupons.length, icon: Store },
            { label: "Active", value: coupons?.filter(c => c.isActive).length ?? 0, icon: RefreshCw },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-zinc-500">{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center animate-pulse text-zinc-400">Loading coupons...</div>
          ) : !coupons || coupons.length === 0 ? (
            <div className="py-16 text-center">
              <Ticket className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="font-bold text-zinc-700">No coupons yet</p>
              <p className="text-zinc-500 text-sm">Create platform-wide coupons to boost sales</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                  <tr>
                    <th className="px-5 py-4">Coupon</th>
                    <th className="px-5 py-4">Discount</th>
                    <th className="px-5 py-4">Min Order</th>
                    <th className="px-5 py-4">Usage</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {coupons.map(c => <CouponRow key={c.id} c={c} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Platform Coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Coupon Code *</Label>
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. BANDA50" className="uppercase font-mono" required />
                <p className="text-xs text-muted-foreground">Will be automatically uppercased. Customers enter this code.</p>
              </div>
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select value={type} onValueChange={v => setType(v as "percent" | "fixed")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{type === "percent" ? "Percentage" : "Amount (₹)"} *</Label>
                <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={type === "percent" ? "e.g. 10" : "e.g. 50"} min="0" required />
              </div>
              <div className="space-y-2">
                <Label>Min. Order Amount (₹)</Label>
                <Input type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} placeholder="0 = no minimum" min="0" />
              </div>
              {type === "percent" && (
                <div className="space-y-2">
                  <Label>Max Discount (₹)</Label>
                  <Input type="number" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} placeholder="No cap" min="0" />
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
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 10% off for all new users" />
              </div>
              <div className="col-span-2 flex items-center justify-between border rounded-lg p-3">
                <div><Label>Active immediately</Label></div>
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
