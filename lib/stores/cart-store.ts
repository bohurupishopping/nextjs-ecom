import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, CartItem, Product } from '../supabase';

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: (userId: string) => Promise<void>;
  getItemCount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: async (productId: string, quantity = 1, variantId?: string) => {
        set({ isLoading: true });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          // Check if item already exists
          const existingItem = get().items.find(
            item => item.product_id === productId && item.variant_id === variantId
          );

          if (existingItem) {
            await get().updateQuantity(existingItem.id, existingItem.quantity + quantity);
          } else {
            const { data, error } = await supabase
              .from('carts')
              .insert({
                user_id: user.id,
                product_id: productId,
                variant_id: variantId,
                quantity,
              })
              .select(`
                *,
                product:products(*),
                variant:product_variants(*)
              `)
              .single();

            if (error) throw error;

            set(state => ({
              items: [...state.items, data],
              isLoading: false,
            }));
          }
        } catch (error) {
          console.error('Error adding item to cart:', error);
          set({ isLoading: false });
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          await get().removeItem(itemId);
          return;
        }

        try {
          const { error } = await supabase
            .from('carts')
            .update({ quantity })
            .eq('id', itemId);

          if (error) throw error;

          set(state => ({
            items: state.items.map(item =>
              item.id === itemId ? { ...item, quantity } : item
            ),
          }));
        } catch (error) {
          console.error('Error updating cart item:', error);
        }
      },

      removeItem: async (itemId: string) => {
        try {
          const { error } = await supabase
            .from('carts')
            .delete()
            .eq('id', itemId);

          if (error) throw error;

          set(state => ({
            items: state.items.filter(item => item.id !== itemId),
          }));
        } catch (error) {
          console.error('Error removing cart item:', error);
        }
      },

      clearCart: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase
            .from('carts')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;

          set({ items: [] });
        } catch (error) {
          console.error('Error clearing cart:', error);
        }
      },

      loadCart: async (userId: string) => {
        set({ isLoading: true });
        
        try {
          const { data, error } = await supabase
            .from('carts')
            .select(`
              *,
              product:products(*),
              variant:product_variants(*)
            `)
            .eq('user_id', userId);

          if (error) throw error;

          set({ items: data || [], isLoading: false });
        } catch (error) {
          console.error('Error loading cart:', error);
          set({ isLoading: false });
        }
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.variant?.price || item.product?.price || 0;
          return total + (price * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);