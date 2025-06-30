import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { ProductClient } from './product-client';

export async function generateStaticParams() {
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true);

  return products?.map(({ slug }) => ({
    slug,
  })) || [];
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*)
    `)
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (!product) {
    notFound();
  }

  return <ProductClient initialProduct={product} />;
}