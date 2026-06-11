import { useState } from "react";
import { OwnerHeader } from "@/components/layout/OwnerHeader";
import { useAuth } from "@/context/AuthContext";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PackagePlus, Edit, Trash2, Search, Package, Plus, X, Zap, Layers } from "lucide-react";

const CATEGORIES = ["Grocery", "Vegetables", "Fruits", "Meat", "Dairy", "Pharmacy", "Snacks", "Beverages", "Household"];

type Variant = { label: string; priceAdjust: number; inStock: boolean };
type TierPricing = { minQty: number; pricePerUnit: number };

export default function OwnerProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Basic fields
  const [name, setName] = useState("");
  const [nameHindi, setNameHindi] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("1 kg");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [inStock, setInStock] = useState(true);
  const [customNotesEnabled, setCustomNotesEnabled] = useState(false);

  // Variants
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVLabel, setNewVLabel] = useState("");
  const [newVPrice, setNewVPrice] = useState("");
  const [newVInStock, setNewVInStock] = useState(true);

  // Flash sale
  const [flashSalePrice, setFlashSalePrice] = useState("");
  const [flashSaleEndsAt, setFlashSaleEndsAt] = useState("");

  // Tiered pricing
  const [tiers, setTiers] = useState<TierPricing[]>([]);
  const [newTierQty, setNewTierQty] = useState("");
  const [newTierPrice, setNewTierPrice] = useState("");

  const storeId = user?.storeId ?? 0;

  const { data: products, isLoading: isLoadingProducts } = useListProducts(storeId, { search: search || undefined }, { query: { enabled: !!storeId } as any });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const resetForm = () => {
    setName(""); setNameHindi(""); setPrice(""); setUnit("1 kg"); setCategory(""); setImageUrl("");
    setInStock(true); setCustomNotesEnabled(false); setVariants([]); setFlashSalePrice(""); setFlashSaleEndsAt("");
    setTiers([]); setNewVLabel(""); setNewVPrice(""); setNewVInStock(true); setNewTierQty(""); setNewTierPrice("");
    setEditingProduct(null);
  };

  const addVariant = () => {
    if (!newVLabel.trim()) return;
    setVariants(v => [...v, { label: newVLabel.trim(), priceAdjust: parseFloat(newVPrice) || 0, inStock: newVInStock }]);
    setNewVLabel(""); setNewVPrice(""); setNewVInStock(true);
  };

  const removeVariant = (i: number) => setVariants(v => v.filter((_, idx) => idx !== i));

  const addTier = () => {
    if (!newTierQty || !newTierPrice) return;
    setTiers(t => [...t, { minQty: parseInt(newTierQty), pricePerUnit: parseFloat(newTierPrice) }].sort((a, b) => a.minQty - b.minQty));
    setNewTierQty(""); setNewTierPrice("");
  };

  const removeTier = (i: number) => setTiers(t => t.filter((_, idx) => idx !== i));

  const buildProductData = () => ({
    name, nameHindi: nameHindi || null, price: parseFloat(price) || 0, unit: unit || null,
    category, imageUrl: imageUrl || null, inStock, customNotesEnabled,
    variants: variants.length > 0 ? variants : null,
    flashSalePrice: flashSalePrice ? parseFloat(flashSalePrice) : null,
    flashSaleEndsAt: flashSaleEndsAt || null,
    tieredPricing: tiers.length > 0 ? tiers : null,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    createProduct.mutate({ storeId, data: buildProductData() }, {
      onSuccess: () => {
        toast({ title: "Product added!" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(storeId) });
        setIsAddOpen(false); resetForm();
      },
      onError: (err: any) => toast({ title: "Failed to add product", description: err.message, variant: "destructive" }),
    });
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setName(product.name); setNameHindi(product.nameHindi || "");
    setPrice(product.price.toString()); setUnit(product.unit || "");
    setCategory(product.category); setImageUrl(product.imageUrl || "");
    setInStock(product.inStock); setCustomNotesEnabled(product.customNotesEnabled || false);
    setVariants(product.variants || []); setFlashSalePrice(product.flashSalePrice?.toString() || "");
    setFlashSaleEndsAt(product.flashSaleEndsAt ? product.flashSaleEndsAt.slice(0, 16) : "");
    setTiers(product.tieredPricing || []);
    setIsEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name || !price || !category) return;
    updateProduct.mutate({ storeId, productId: editingProduct.id, data: buildProductData() }, {
      onSuccess: () => {
        toast({ title: "Product updated!" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(storeId) });
        setIsEditOpen(false); resetForm();
      },
      onError: (err: any) => toast({ title: "Failed to update product", description: err.message, variant: "destructive" }),
    });
  };

  const handleDelete = (productId: number) => {
    if (confirm("Delete this product?")) {
      deleteProduct.mutate({ storeId, productId }, {
        onSuccess: () => {
          toast({ title: "Product deleted" });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(storeId) });
        },
      });
    }
  };

  const handleToggleStock = (productId: number, newStockStatus: boolean) => {
    updateProduct.mutate({ storeId, productId, data: { inStock: newStockStatus } }, {
      onSuccess: () => {
        toast({ title: newStockStatus ? "Marked In Stock" : "Marked Out of Stock" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(storeId) });
      },
    });
  };

  // Shared form fields for both add/edit dialogs
  const ProductForm = ({ onSubmit, isPending }: { onSubmit: (e: React.FormEvent) => void; isPending: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Product Name (English) *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Product Name (Hindi)</Label>
          <Input value={nameHindi} onChange={e => setNameHindi(e.target.value)} placeholder="हिंदी नाम" />
        </div>
        <div className="space-y-1.5">
          <Label>Base Price (₹) *</Label>
          <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="1 kg, 500g..." />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Image URL</Label>
          <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>

        {/* Toggles */}
        <div className="col-span-2 flex gap-3">
          <div className="flex-1 flex items-center justify-between border rounded-lg p-3">
            <div><Label className="text-sm">In Stock</Label></div>
            <Switch checked={inStock} onCheckedChange={setInStock} />
          </div>
          <div className="flex-1 flex items-center justify-between border rounded-lg p-3">
            <div><Label className="text-sm">Custom Notes</Label><p className="text-xs text-muted-foreground">Allow customer instructions</p></div>
            <Switch checked={customNotesEnabled} onCheckedChange={setCustomNotesEnabled} />
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="border rounded-xl p-3 space-y-3">
        <p className="text-sm font-bold flex items-center gap-1.5"><Layers className="h-4 w-4 text-primary" /> Variants (Sizes / Types)</p>
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => (
              <span key={i} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${!v.inStock ? "opacity-50" : "bg-primary/10 text-primary border-primary/20"}`}>
                {v.label} {v.priceAdjust !== 0 && <span className="text-xs">{v.priceAdjust > 0 ? `+₹${v.priceAdjust}` : `−₹${Math.abs(v.priceAdjust)}`}</span>}
                {!v.inStock && <span className="text-[9px]">(OOS)</span>}
                <button type="button" onClick={() => removeVariant(i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={newVLabel} onChange={e => setNewVLabel(e.target.value)} placeholder="Label (e.g. 500g)" className="flex-1 h-8 text-xs" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addVariant())} />
          <Input type="number" value={newVPrice} onChange={e => setNewVPrice(e.target.value)} placeholder="±Price" className="w-20 h-8 text-xs" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Switch checked={newVInStock} onCheckedChange={setNewVInStock} className="scale-75" /> Stock
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addVariant} className="h-8 text-xs px-2"><Plus className="h-3 w-3" /></Button>
        </div>
        <p className="text-xs text-muted-foreground">Add size variants like 500g, 1kg, 5kg with optional price adjustment</p>
      </div>

      {/* Flash Sale */}
      <div className="border rounded-xl p-3 space-y-3">
        <p className="text-sm font-bold flex items-center gap-1.5"><Zap className="h-4 w-4 text-red-500" /> Flash Sale</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Sale Price (₹)</Label>
            <Input type="number" step="0.01" value={flashSalePrice} onChange={e => setFlashSalePrice(e.target.value)} placeholder="Leave blank to disable" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sale Ends At</Label>
            <Input type="datetime-local" value={flashSaleEndsAt} onChange={e => setFlashSaleEndsAt(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Flash sale price shows a countdown badge to customers</p>
      </div>

      {/* Tiered Pricing */}
      <div className="border rounded-xl p-3 space-y-3">
        <p className="text-sm font-bold flex items-center gap-1.5"><Layers className="h-4 w-4 text-blue-500" /> Bulk / Tiered Pricing</p>
        {tiers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tiers.map((t, i) => (
              <span key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                {t.minQty}+ units → ₹{t.pricePerUnit}/unit
                <button type="button" onClick={() => removeTier(i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input type="number" value={newTierQty} onChange={e => setNewTierQty(e.target.value)} placeholder="Min qty" className="flex-1 h-8 text-xs" />
          <Input type="number" step="0.01" value={newTierPrice} onChange={e => setNewTierPrice(e.target.value)} placeholder="₹/unit" className="flex-1 h-8 text-xs" />
          <Button type="button" size="sm" variant="outline" onClick={addTier} className="h-8 text-xs px-2"><Plus className="h-3 w-3" /></Button>
        </div>
        <p className="text-xs text-muted-foreground">e.g. Buy 5+ get ₹45/unit, buy 10+ get ₹40/unit</p>
      </div>

      <DialogFooter>
        <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Product"}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <OwnerHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif">Product Catalog</h1>
            <p className="text-muted-foreground text-sm">Manage your inventory — add variants, flash sales & bulk pricing</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <Dialog open={isAddOpen} onOpenChange={o => { setIsAddOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><PackagePlus className="w-4 h-4 mr-2" /> Add Item</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                <ProductForm onSubmit={handleAdd} isPending={createProduct.isPending} />
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={o => { setIsEditOpen(o); if (!o) resetForm(); }}>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
                <ProductForm onSubmit={handleEdit} isPending={updateProduct.isPending} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {isLoadingProducts ? (
            <div className="p-8 text-center animate-pulse">Loading products...</div>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Features</th>
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(product => (
                    <tr key={product.id} className={!product.inStock ? "bg-muted/20" : ""}>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded overflow-hidden shrink-0">
                            {product.imageUrl
                              ? <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                              : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="h-5 w-5" /></div>
                            }
                          </div>
                          <div>
                            <div className="font-bold">{product.name}</div>
                            {product.nameHindi && <div className="text-xs text-muted-foreground">{product.nameHindi}</div>}
                            <div className="text-xs text-muted-foreground mt-0.5">{product.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{product.category}</td>
                      <td className="px-6 py-4">
                        {product.flashSalePrice ? (
                          <div>
                            <span className="font-bold text-red-600">₹{product.flashSalePrice}</span>
                            <span className="text-xs text-muted-foreground line-through ml-1">₹{product.price}</span>
                          </div>
                        ) : (
                          <span className="font-bold">₹{product.price}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.variants && product.variants.length > 0 && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">{product.variants.length} variants</Badge>
                          )}
                          {product.flashSalePrice && (
                            <Badge className="text-[10px] bg-red-500">Flash</Badge>
                          )}
                          {product.tieredPricing && product.tieredPricing.length > 0 && (
                            <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">Bulk</Badge>
                          )}
                          {product.customNotesEnabled && (
                            <Badge variant="outline" className="text-[10px]">Notes</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Switch checked={product.inStock} onCheckedChange={val => handleToggleStock(product.id, val)} />
                          <span className={product.inStock ? "text-primary font-medium text-xs" : "text-muted-foreground text-xs"}>
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} disabled={deleteProduct.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-lg font-bold">No products found</p>
              <p className="text-muted-foreground">Add products to your catalog to start selling.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
