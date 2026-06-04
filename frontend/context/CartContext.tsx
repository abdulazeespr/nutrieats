"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;          // original price
  discountedPrice: number; // price after discount
  calories: number;
  imageUrl: string;
  restaurantId: string;
  restaurantName: string;
  quantity: number;
}

type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; menuItemId: string }
  | { type: "INCREMENT"; menuItemId: string }
  | { type: "DECREMENT"; menuItemId: string }
  | { type: "CLEAR" };

interface CartState {
  items: CartItem[];
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.menuItemId === action.item.menuItemId
      );
      if (existing) {
        // Enforce single-restaurant rule: if adding from a different restaurant, replace cart
        if (existing.restaurantId !== action.item.restaurantId) {
          return { items: [{ ...action.item, quantity: 1 }] };
        }
        return {
          items: state.items.map((i) =>
            i.menuItemId === action.item.menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      // Different restaurant from existing items → replace cart
      if (
        state.items.length > 0 &&
        state.items[0].restaurantId !== action.item.restaurantId
      ) {
        return { items: [{ ...action.item, quantity: 1 }] };
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => i.menuItemId !== action.menuItemId),
      };
    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      };
    case "DECREMENT":
      return {
        items: state.items
          .map((i) =>
            i.menuItemId === action.menuItemId
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (menuItemId: string) => void;
  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalCalories: number;
  restaurantId: string | null;
  restaurantName: string | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => dispatch({ type: "ADD_ITEM", item }),
    []
  );
  const removeItem = useCallback(
    (menuItemId: string) => dispatch({ type: "REMOVE_ITEM", menuItemId }),
    []
  );
  const increment = useCallback(
    (menuItemId: string) => dispatch({ type: "INCREMENT", menuItemId }),
    []
  );
  const decrement = useCallback(
    (menuItemId: string) => dispatch({ type: "DECREMENT", menuItemId }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );
  const totalPrice = useMemo(
    () => state.items.reduce((sum, i) => sum + i.discountedPrice * i.quantity, 0),
    [state.items]
  );
  const totalCalories = useMemo(
    () => state.items.reduce((sum, i) => sum + i.calories * i.quantity, 0),
    [state.items]
  );
  const restaurantId = state.items[0]?.restaurantId ?? null;
  const restaurantName = state.items[0]?.restaurantName ?? null;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        removeItem,
        increment,
        decrement,
        clearCart,
        totalItems,
        totalPrice,
        totalCalories,
        restaurantId,
        restaurantName,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
