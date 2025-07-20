'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Upload, X, Plus, Trash2, Save, Eye, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase, Category, Product } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProductImage {
  id?: string;
  url: string;
  alt_text: string;
  sort_order: number;
  file?: File;
}

interface ProductVariant {
  id?: string;
  name: string;
  price: number;
  compare_price?: number;
  sku: string;
  inventory_quantity: number;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  is_active: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [productData, setProductData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    compare_price: 0,
    sku: '',
    weight: 0,
    dimensions: '',
    category_id: '',
    is_active: true,
    is_featured: false,
    requires_shipping: true,
    taxable: true,
    track_inventory: true,
    inventory_quantity: 0,
    low_stock_threshold: 10,
    seo_title: '',
    seo_description: '',
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [hasVariants, setHasVariants] = useState(false);

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      setProductData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price,
        compare_price: product.compare_price || 0,
        sku: product.sku || '',
        weight: product.weight || 0,
        dimensions: product.dimensions || '',
        category_id: product.category_id || '',
        is_active: product.is_active,
        is_featured: product.is_featured,
        requires_shipping: product.requires_shipping,
        taxable: product.taxable,
        track_inventory: product.track_inventory,
        inventory_quantity: product.inventory_quantity,
        low_stock_threshold: product.low_stock_threshold,
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
      });

      setImages(product.images || []);
      setVariants(product.variants || []);
      setHasVariants((product.variants || []).length > 0);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
      router.push('/admin/products');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ProductImage = {
          url: e.target?.result as string,
          alt_text: productData.name || 'Product image',
          sort_order: images.length + index,
          file,
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = async (index: number) => {
    const image = images[index];

    // If it's an existing image, delete from database
    if (image.id) {
      try {
        const { error } = await supabase
          .from('product_images')
          .delete()
          .eq('id', image.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error('Failed to delete image');
        return;
      }
    }

    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      name: `Variant ${variants.length + 1}`,
      price: productData.price,
      sku: `${productData.sku}-${variants.length + 1}`,
      inventory_quantity: 0,
      is_active: true,
    };
    setVariants(prev => [...prev, newVariant]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setVariants(prev => prev.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const removeVariant = async (index: number) => {
    const variant = variants[index];

    // If it's an existing variant, delete from database
    if (variant.id) {
      try {
        const { error } = await supabase
          .from('product_variants')
          .delete()
          .eq('id', variant.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting variant:', error);
        toast.error('Failed to delete variant');
        return;
      }
    }

    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!productData.name || !productData.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId);

      if (productError) throw productError;

      // Handle new images
      const newImages = images.filter(img => img.file);
      if (newImages.length > 0) {
        const imagePromises = newImages.map(async (image, index) => {
          // In a real app, you'd upload to a storage service
          return supabase
            .from('product_images')
            .insert({
              product_id: productId,
              url: image.url,
              alt_text: image.alt_text,
              sort_order: images.indexOf(image),
            });
        });

        await Promise.all(imagePromises);
      }

      // Handle variants
      if (hasVariants) {
        // Update existing variants
        const existingVariants = variants.filter(v => v.id);
        const newVariants = variants.filter(v => !v.id);

        // Update existing
        const updatePromises = existingVariants.map(variant =>
          supabase
            .from('product_variants')
            .update(variant)
            .eq('id', variant.id)
        );

        // Insert new
        const insertPromises = newVariants.map(variant =>
          supabase
            .from('product_variants')
            .insert({
              ...variant,
              product_id: productId,
            })
        );

        await Promise.all([...updatePromises, ...insertPromises]);
      } else {
        // Delete all variants if variants are disabled
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId);
      }

      toast.success('Product updated successfully');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">
              Update product information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <a href={`/products/${productData.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </a>
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={productData.name}
                      onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={productData.slug}
                      onChange={(e) => setProductData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="product-url-slug"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL: /products/{productData.slug}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description">Short Description</Label>
                    <Textarea
                      id="short_description"
                      value={productData.short_description}
                      onChange={(e) => setProductData(prev => ({ ...prev, short_description: e.target.value }))}
                      placeholder="Brief product description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      value={productData.description}
                      onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed product description"
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Regular Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productData.price}
                        onChange={(e) => setProductData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compare_price">Compare Price</Label>
                      <Input
                        id="compare_price"
                        type="number"
                        step="0.01"
                        value={productData.compare_price}
                        onChange={(e) => setProductData(prev => ({ ...prev, compare_price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {productData.compare_price > productData.price && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">
                        {Math.round(((productData.compare_price - productData.price) / productData.compare_price) * 100)}% OFF
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Save ${(productData.compare_price - productData.price).toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={productData.category_id} onValueChange={(value) => setProductData(prev => ({ ...prev, category_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={productData.sku}
                      onChange={(e) => setProductData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Product SKU"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Product is visible in store
                      </p>
                    </div>
                    <Switch
                      checked={productData.is_active}
                      onCheckedChange={(checked) => setProductData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Featured</Label>
                      <p className="text-sm text-muted-foreground">
                        Show in featured products
                      </p>
                    </div>
                    <Switch
                      checked={productData.is_featured}
                      onCheckedChange={(checked) => setProductData(prev => ({ ...prev, is_featured: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Taxable</Label>
                      <p className="text-sm text-muted-foreground">
                        Apply tax to this product
                      </p>
                    </div>
                    <Switch
                      checked={productData.taxable}
                      onCheckedChange={(checked) => setProductData(prev => ({ ...prev, taxable: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload Product Images</p>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop images here, or click to browse
                  </p>
                </div>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="mt-4 max-w-xs mx-auto"
                />
              </div>

              {images.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Product Images ({images.length})</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag to reorder • First image will be the main image
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden border">
                          <Image
                            src={image.url}
                            alt={image.alt_text}
                            fill
                            className="object-cover"
                          />
                          {index === 0 && (
                            <Badge className="absolute top-2 left-2">
                              Main
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="mt-2 space-y-1">
                          <Input
                            value={image.alt_text}
                            onChange={(e) => {
                              const newImages = [...images];
                              newImages[index].alt_text = e.target.value;
                              setImages(newImages);
                            }}
                            placeholder="Alt text"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Product Variants
                <Switch
                  checked={hasVariants}
                  onCheckedChange={setHasVariants}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasVariants ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Enable variants to create different versions of this product (size, color, etc.)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Create variants for different sizes, colors, or other options
                    </p>
                    <Button onClick={addVariant} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>

                  {variants.map((variant, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Variant {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Variant Name</Label>
                            <Input
                              value={variant.name}
                              onChange={(e) => updateVariant(index, 'name', e.target.value)}
                              placeholder="e.g., Large Red"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>SKU</Label>
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                              placeholder="Variant SKU"
                            />
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Option 1</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={variant.option1_name || ''}
                                onChange={(e) => updateVariant(index, 'option1_name', e.target.value)}
                                placeholder="Name (e.g., Size)"
                              />
                              <Input
                                value={variant.option1_value || ''}
                                onChange={(e) => updateVariant(index, 'option1_value', e.target.value)}
                                placeholder="Value (e.g., Large)"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Option 2</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={variant.option2_name || ''}
                                onChange={(e) => updateVariant(index, 'option2_name', e.target.value)}
                                placeholder="Name (e.g., Color)"
                              />
                              <Input
                                value={variant.option2_value || ''}
                                onChange={(e) => updateVariant(index, 'option2_value', e.target.value)}
                                placeholder="Value (e.g., Red)"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Inventory</Label>
                            <Input
                              type="number"
                              value={variant.inventory_quantity}
                              onChange={(e) => updateVariant(index, 'inventory_quantity', parseInt(e.target.value) || 0)}
                              placeholder="Stock quantity"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {variants.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <p className="text-muted-foreground">
                        No variants created yet. Click "Add Variant" to get started.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Track Inventory</Label>
                  <p className="text-sm text-muted-foreground">
                    Monitor stock levels for this product
                  </p>
                </div>
                <Switch
                  checked={productData.track_inventory}
                  onCheckedChange={(checked) => setProductData(prev => ({ ...prev, track_inventory: checked }))}
                />
              </div>

              {productData.track_inventory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inventory_quantity">Stock Quantity</Label>
                    <Input
                      id="inventory_quantity"
                      type="number"
                      value={productData.inventory_quantity}
                      onChange={(e) => setProductData(prev => ({ ...prev, inventory_quantity: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      value={productData.low_stock_threshold}
                      onChange={(e) => setProductData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Requires Shipping</Label>
                  <p className="text-sm text-muted-foreground">
                    This product needs to be shipped
                  </p>
                </div>
                <Switch
                  checked={productData.requires_shipping}
                  onCheckedChange={(checked) => setProductData(prev => ({ ...prev, requires_shipping: checked }))}
                />
              </div>

              {productData.requires_shipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={productData.weight}
                      onChange={(e) => setProductData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions (L x W x H)</Label>
                    <Input
                      id="dimensions"
                      value={productData.dimensions}
                      onChange={(e) => setProductData(prev => ({ ...prev, dimensions: e.target.value }))}
                      placeholder="12 x 8 x 4 inches"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={productData.seo_title}
                  onChange={(e) => setProductData(prev => ({ ...prev, seo_title: e.target.value }))}
                  placeholder="SEO optimized title"
                />
                <p className="text-xs text-muted-foreground">
                  {productData.seo_title.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">SEO Description</Label>
                <Textarea
                  id="seo_description"
                  value={productData.seo_description}
                  onChange={(e) => setProductData(prev => ({ ...prev, seo_description: e.target.value }))}
                  placeholder="SEO meta description"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {productData.seo_description.length}/160 characters
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Search Preview</h4>
                <div className="space-y-1">
                  <div className="text-blue-600 text-lg">
                    {productData.seo_title || productData.name || 'Product Title'}
                  </div>
                  <div className="text-green-600 text-sm">
                    yourstore.com/products/{productData.slug || 'product-slug'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {productData.seo_description || productData.short_description || 'Product description will appear here...'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}