// src/features/cart/store/cartStore.js

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const items = get().items
        const existingItem = items.find((item) => item.id === product.id)

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          })
        } else {
          // seller را از آبجکت product بگیر
          const sellerId = typeof product.seller === 'object' ? product.seller?.id : product.seller
          
          const newItem = {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.final_price || product.price,
            image: product.primary_image,
            quantity: quantity,
            seller_id: sellerId || product.seller_id,
            category_name: product.category_name,
            brand_name: product.brand_name,
            stock_quantity: product.stock_quantity || 99,
          }
          set({ items: [...items, newItem] })
        }
        toast.success(`${product.name} به سبد خرید اضافه شد`)
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) })
        toast.success('محصول از سبد خرید حذف شد')
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 1), 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0)
      },

      getItemsGroupedBySeller: () => {
        const grouped = {}
        get().items.forEach((item) => {
          const sellerId = item.seller_id
          if (!sellerId) return  // اگر seller_id نداشت، skip کن
          if (!grouped[sellerId]) {
            grouped[sellerId] = { seller_id: sellerId, items: [] }
          }
          grouped[sellerId].items.push({
            product: item.id,
            quantity: item.quantity,
            unit_price: item.price,
          })
        })
        return Object.values(grouped)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)