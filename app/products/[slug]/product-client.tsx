'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus,
  Truck,
  Shield,
  RotateCcw,
  Check
} from 'lucide-react';
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
  
  // Product data helpers
  const mainImage = product?.images?.[0]?.url || '/placeholder-product.jpg';
  const thumbnailImages = product?.images?.map(img => img.url) || [];
  const rating = 0; // Not in type, default to 0
  const reviewCount = 0; // Not in type, default to 0
  const description = product?.description || 'No description available';
  const specifications: any[] = []; // Not in type
  const reviews: any[] = []; // Not in type

  const { user } = useAuth();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!initialProduct) {
      loadProduct();
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

      if (productData.category_id) {
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', productData.category_id)
          .neq('id', productData.id)
          .eq('is_active', true)
          .limit(4);

        if (relatedData) {
          setRelatedProducts(relatedData);
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = async () => {
    if (!product) return;

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to products
      </Button>
      
      {/* Product details */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product images */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 mb-4">
            {product.images?.[selectedImageIndex]?.url ? (
              <Image
                src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {product.images?.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-md ${
                  index === selectedImageIndex ? 'ring-2 ring-primary' : ''
                }`}
              >
                <Image
                  key={image.id}
                  src={image.url}
                  alt={`${product.name} ${index + 1}`}
                  width={100}
                  height={100}
                  className={`w-20 h-20 object-cover rounded-md cursor-pointer ${
                    selectedImageIndex === index ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                />
              </button>
            ))}
          </div>
        </div>
        
        {/* Product info */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          
          <div className="mt-4 flex items-center">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-500">
              ({reviewCount} reviews)
            </span>
          </div>
          
          <p className="mt-4 text-2xl font-medium">
            ${selectedVariant?.price || product.price}
            {selectedVariant?.price && selectedVariant.price < product.price && (
              <span className="text-sm text-gray-500 line-through">
                ${product.price}
              </span>
            )}
          </p>
          
          <p className="mt-4 text-gray-700">{description}</p>
          
          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <Label>Options</Label>
              <Select
                value={selectedVariant?.id}
                onValueChange={(value) => {
                  const variant = product.variants?.find(v => v.id === value);
                  if (variant) handleVariantSelect(variant);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select an option" />
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
          )}
          
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              className="flex-1"
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
            
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="flex items-center">
              <Truck className="mr-2 h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500">Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500">2 Year Warranty</span>
            </div>
            <div className="flex items-center">
              <RotateCcw className="mr-2 h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500">30-day return policy</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product details tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description" className="w-full">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="py-6">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: description }} />
          </TabsContent>
          <TabsContent value="specifications" className="py-6">
            <div className="space-y-4">
              {specifications.map((spec: any) => (
                <div key={spec.name} className="flex">
                  <span className="w-48 font-medium text-gray-900">{spec.name}</span>
                  <span className="text-gray-600">{spec.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="py-6">
            <div className="space-y-8">
              {reviews.map((review: any) => (
                <div key={review.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium">{review.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{review.author}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
              {reviews.length === 0 && (
                <p>No reviews yet. Be the first to review this product!</p>
              )}
              
              <Button variant="outline" className="mt-4">
                Write a Review
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
