'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, Share2, ShoppingCart, Star, Plus, Minus, Truck, Shield, RotateCcw, Check, ChevronLeft, ChevronRight, ZoomIn as Zoom, Package, Clock, MapPin, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ProductCard } from '@/components/product-card';
import { useAuth } from '@/lib/auth';
import { useCartStore } from '@/lib/stores/cart-store';
import { supabase, Product, ProductVariant } from '@/lib/supabase';
import { toast } from 'sonner';

export function ProductClient({ initialProduct }: { initialProduct: Product | null }) {
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialProduct);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState<boolean>(false);
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);
  
  const { user } = useAuth();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!initialProduct) {
      loadProduct();
    } else {
      loadRelatedProducts();
    }
  }, []);

  const loadProduct = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const slug = window.location.pathname.split('/').pop();
      
      if (!slug) {
        router.push('/404');
        return;
      }

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (productError) {
        if (productError.code === 'PGRST116') {
          router.push('/404');
          return;
        }
        throw productError;
      }

      setProduct(productData);

      if (productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }

      await loadRelatedProducts(productData.category_id);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async (categoryId?: string) => {
    if (!categoryId && !product?.category_id) return;
    
    try {
      const { data: relatedData } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*)
        `)
        .eq('category_id', categoryId || product?.category_id)
        .neq('id', product?.id || initialProduct?.id)
        .eq('is_active', true)
        .limit(4);

      if (relatedData) {
        setRelatedProducts(relatedData);
      }
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      toast.error('Please sign in to add items to cart');
      router.push('/auth/signin');
      return;
    }

    setAddingToCart(true);
    try {
      await addItem(
        product.id,
        quantity,
        selectedVariant?.id
      );
      toast.success(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please sign in to add items to wishlist');
      return;
    }

    setIsWishlistLoading(true);
    // TODO: Implement wishlist functionality
    setTimeout(() => {
      setIsWishlistLoading(false);
      toast.success('Item added to wishlist');
    }, 1000);
  };

  const nextImage = () => {
    if (product?.images) {
      setSelectedImageIndex((prev) => 
        prev === product.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.images) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? product.images!.length - 1 : prev - 1
      );
    }
  };

  const currentPrice = selectedVariant?.price || product?.price || 0;
  const comparePrice = selectedVariant?.compare_price || product?.compare_price;
  const discountPercentage = comparePrice && comparePrice > currentPrice
    ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
    : 0;

  const isInStock = (selectedVariant?.inventory_quantity || product?.inventory_quantity || 0) > 0;
  const stockLevel = selectedVariant?.inventory_quantity || product?.inventory_quantity || 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-xl" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link 
                href={`/categories/${product.category.slug}`} 
                className="hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative group">
              <div 
                className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 border-2 border-gray-200 dark:border-gray-700 cursor-zoom-in"
                onClick={() => setIsImageZoomed(!isImageZoomed)}
              >
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[selectedImageIndex]?.url || '/placeholder-product.jpg'}
                    alt={product.images[selectedImageIndex]?.alt_text || product.name}
                    fill
                    className={`object-cover transition-transform duration-500 ${
                      isImageZoomed ? 'scale-150' : 'scale-100 group-hover:scale-105'
                    }`}
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <Package className="h-16 w-16" />
                  </div>
                )}
                
                {/* Discount Badge */}
                {discountPercentage > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute top-4 left-4 text-sm font-bold px-3 py-1"
                  >
                    -{discountPercentage}%
                  </Badge>
                )}

                {/* Navigation Arrows */}
                {product.images && product.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {/* Zoom Icon */}
                <div className="absolute bottom-4 right-4 bg-white/80 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Zoom className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      index === selectedImageIndex 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt_text || `${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Product Title & Rating */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.is_featured && (
                  <Badge variant="secondary" className="text-xs">
                    Featured
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {product.category?.name || 'Uncategorized'}
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  4.8 (124 reviews)
                </span>
                <span className="text-sm text-green-600 font-medium">
                  8 items sold in last 3 days
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-green-600">
                  ${currentPrice.toFixed(2)}
                </span>
                {comparePrice && comparePrice > currentPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${comparePrice.toFixed(2)}
                  </span>
                )}
                {discountPercentage > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    Save ${(comparePrice! - currentPrice).toFixed(2)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  FREE DELIVERY
                </Badge>
                <span className="text-muted-foreground">on orders over $50</span>
              </div>
            </div>

            {/* Promotional Banner */}
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                    🎁
                  </div>
                  <span className="font-medium">
                    Buy 3 or more t-shirts and enjoy an instant 5% discount! Use code{' '}
                    <code className="bg-orange-200 px-1 rounded font-bold">BOHURUPI</code>{' '}
                    at checkout.
                  </span>
                  <Info className="h-4 w-4 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    Color <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedVariant?.id}
                    onValueChange={(value) => {
                      const variant = product.variants?.find(v => v.id === value);
                      if (variant) handleVariantSelect(variant);
                    }}
                  >
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue placeholder="Select Color" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-medium">
                    Size <span className="text-red-500">*</span>
                  </Label>
                  <Select defaultValue="">
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue placeholder="Select Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s">Small</SelectItem>
                      <SelectItem value="m">Medium</SelectItem>
                      <SelectItem value="l">Large</SelectItem>
                      <SelectItem value="xl">X-Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-12 w-12 rounded-r-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-16 text-center font-medium">{quantity}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= stockLevel}
                    className="h-12 w-12 rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={addingToCart || !isInStock}
                    className="flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {addingToCart ? 'Adding...' : 'ADD TO CART'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-12 bg-green-600 text-white border-green-600 hover:bg-green-700 px-8"
                  >
                    BUY NOW
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleAddToWishlist}
                disabled={isWishlistLoading}
                className="w-full h-12"
              >
                <Heart className="mr-2 h-4 w-4" />
                {isWishlistLoading ? 'Adding...' : 'Add to Wishlist'}
              </Button>
            </div>

            {/* Delivery Information */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Free Delivery to</span>
                  <span className="text-green-600 font-medium">Antisara, Hooghly</span>
                  <Button variant="link" className="p-0 h-auto text-blue-600">
                    Check another Pincode
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estimated delivery in 2-3 days</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Expected between</span>
                  <span className="font-medium">July 2, 2025</span>
                  <span>and</span>
                  <span className="font-medium">July 3, 2025</span>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium mb-1">Size Guide</h4>
                  <p className="text-sm text-muted-foreground">(Important)</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <RotateCcw className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium mb-1">Return/Replacement</h4>
                  <p className="text-sm text-muted-foreground">Policy</p>
                </CardContent>
              </Card>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                {stockLevel > 10 ? 'In Stock' : `Only ${stockLevel} left in stock`}
              </span>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="description" className="text-base">Description</TabsTrigger>
              <TabsTrigger value="specifications" className="text-base">Specifications</TabsTrigger>
              <TabsTrigger value="reviews" className="text-base">Reviews (124)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-8">
              <Card>
                <CardContent className="p-8">
                  <div className="prose max-w-none">
                    <p className="text-lg leading-relaxed">
                      {product.description || product.short_description || 'No description available for this product.'}
                    </p>
                    
                    <h3 className="text-xl font-semibold mt-6 mb-4">Features</h3>
                    <ul className="space-y-2">
                      <li>• Premium quality materials</li>
                      <li>• Comfortable fit for all-day wear</li>
                      <li>• Durable construction</li>
                      <li>• Easy care instructions</li>
                      <li>• Available in multiple sizes</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-8">
              <Card>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Product Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SKU:</span>
                          <span>{product.sku || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Weight:</span>
                          <span>{product.weight ? `${product.weight} lbs` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dimensions:</span>
                          <span>{product.dimensions || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{product.category?.name || 'Uncategorized'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Shipping & Returns</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping:</span>
                          <span>{product.requires_shipping ? 'Required' : 'Not Required'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxable:</span>
                          <span>{product.taxable ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Return Policy:</span>
                          <span>30 days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-8">
              <Card>
                <CardContent className="p-8">
                  <div className="text-center py-12">
                    <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Be the first to review this product and help other customers make informed decisions.
                    </p>
                    <Button>Write a Review</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">You may also like</h2>
              <Button variant="outline" asChild>
                <Link href="/products">View All Products</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}