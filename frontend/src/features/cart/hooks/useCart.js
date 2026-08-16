import { useCartStore } from '../store/cartStore'

export const useCart = () => {
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  
  const totalItems = useCartStore((state) => {
    return state.items.reduce((total, item) => total + (item.quantity || 1), 0)
  })
  
  const totalPrice = useCartStore((state) => {
    return state.items.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0)
  })

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isEmpty: items.length === 0,
  }
}