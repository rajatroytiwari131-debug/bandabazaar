import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { OwnerHeader } from "@/components/layout/OwnerHeader";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useListStores, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PackagePlus, Edit, Trash2, Search, Package } from "lucide-react";

const CATEGORIES = ["Grocery", "Vegetables", "Fruits", "Meat", "Dairy", "Pharmacy", "Snacks", "Beverages", "Household"];

export default function OwnerProducts() {
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [nameHindi, setNameHindi] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("1 kg");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [inStock, setInStock] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("bb_owner_phone");
    if (!session) {
      setLocation("/owner");
    } else {
      setPhone(session);
    }
  }, [setLocation]);

  const { data: stores, isLoading: isLoadingStore } = useListStores({ search: phone }, { query: { enabled: phone.length >= 10 } });
  const storeId = stores?.[0]?.id || 0;

  const { data: products, isLoading: isLoadingProducts } = useListProducts(storeId, { search: search || undefined }, { query: { enabled: !!storeId } });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const resetForm = () => {
    setName("");
    setNameHindi("");
    setPrice("");
    setUnit("1 kg");
    setCategory("");
    setImageUrl("");
    setInStock(true);
    setEditingProduct(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    createProduct.mutate({
      storeId,
      data: {
        name,
        nameHindi: nameHindi || null,
        price: parseFloat(price) || 0,
        unit: unit || null,
        category,
        imageUrl: imageUrl || null,
        inStock
      }
    }, {
      onSuccess: () => {
        toast({ title: "Product added successfully" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(storeId) });
        setIsAddOpen(false);
        resetForm();
      },
      onError: (err: any) => {
        toast({ title: "Failed to add product", description: err.message, variant: "destructive" });
      }
    });
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setName(product.name);
    setNameHindi(product.nameHindi || "");
    setPrice(product.price.toString());
    setUnit(product.unit || "");
    setCategory(product.category);
    setImageUrl(product.imageUrl || "");
    setInStock(product.inStock);
    setIsEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name || !price || !category) return;

    updateProduct.mutate({
      storeId,
      productId: editingProduct.id,
      data: {
        name,
        nameHindi: nameHindi || null,
        price: parseFloat(price) || 0,
        unit: unit || null,
        category,
        imageUrl: imageUrl || null,
        inStock
      }
    }, {
      onSuccess: () => {
        toast({ title: "Product updated successfully" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(storeId) });
        setIsEditOpen(false);
        resetForm();
      },
      onError: (err: any) => {
        toast({ title: "Failed to update product", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ storeId, productId }, {
        onSuccess: () => {
          toast({ title: "Product deleted" });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(storeId) });
        }
      });
    }
  };

  const handleToggleStock = (productId: number, newStockStatus: boolean) => {
     updateProduct.mutate({
      storeId,
      productId,
      data: { inStock: newStockStatus }
    }, {
      onSuccess: () => {
        toast({ title: newStockStatus ? "Item marked In Stock" : "Item marked Out of Stock" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(storeId) });
      }
    });
  };

  if (isLoadingStore && !storeId) return <div className="min-h-screen bg-muted/30"><OwnerHeader /></div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <OwnerHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif">Product Catalog</h1>
            <p className="text-muted-foreground text-sm">Manage your inventory</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button><PackagePlus className="w-4 h-4 mr-2" /> Add Item</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="name">Product Name (English) *</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="nameHindi">Product Name (Hindi)</Label>
                      <Input id="nameHindi" value={nameHindi} onChange={e => setNameHindi(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit (e.g. 1 kg, 500g)</Label>
                      <Input id="unit" value={unit} onChange={e => setUnit(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                      <Input id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2 flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <Label>In Stock</Label>
                        <p className="text-xs text-muted-foreground">Available for customers to buy</p>
                      </div>
                      <Switch checked={inStock} onCheckedChange={setInStock} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={createProduct.isPending}>Save Product</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(open) => {
              setIsEditOpen(open);
              if (!open) resetForm();
            }}>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEdit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="edit-name">Product Name (English) *</Label>
                      <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="edit-nameHindi">Product Name (Hindi)</Label>
                      <Input id="edit-nameHindi" value={nameHindi} onChange={e => setNameHindi(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price (₹) *</Label>
                      <Input id="edit-price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-unit">Unit</Label>
                      <Input id="edit-unit" value={unit} onChange={e => setUnit(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="edit-imageUrl">Image URL</Label>
                      <Input id="edit-imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={updateProduct.isPending}>Update Product</Button>
                  </DialogFooter>
                </form>
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
                    <th className="px-6 py-3">Stock Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className={!product.inStock ? 'bg-muted/20' : ''}>
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded overflow-hidden shrink-0">
                           {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="h-5 w-5" /></div>}
                        </div>
                        <div>
                          <div className="font-bold">{product.name}</div>
                          {product.nameHindi && <div className="text-xs text-muted-foreground">{product.nameHindi}</div>}
                          <div className="text-xs text-muted-foreground mt-0.5">{product.unit}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{product.category}</td>
                      <td className="px-6 py-4 font-bold">₹{product.price}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={product.inStock} 
                            onCheckedChange={(val) => handleToggleStock(product.id, val)} 
                          />
                          <span className={product.inStock ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
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
