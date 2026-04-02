import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, hasValidAuthSession, getStoredUser } from '../../utils/authStorage.js'; // 👈 Đã thêm getStoredUser vào đây

// 1. Tạo Context
const CartContext = createContext();

// 2. Tạo Provider (Nhà cung cấp dữ liệu)
export const CartProvider = ({ children }) => {
  const normalizeQuantity = (value, fallback = 1) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(1, parsed);
  };

  const requireCartLogin = () => {
    if (hasValidAuthSession()) return true;

    alert('Vui lòng đăng nhập để sử dụng giỏ hàng.');
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/login?redirect=${returnTo}`);
    return false;
  };

  // 🛠 ĐÃ SỬA: Lấy userId trực tiếp từ thông tin user đã lưu, không dùng 'atob' lỗi nữa
  const getUserIdFromToken = () => {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const user = getStoredUser();
      return user ? user.id : null; 
    } catch (e) {
      console.error('Failed to get user ID from stored session', e);
      return null;
    }
  };

  const userId = getUserIdFromToken();
  const storageKey = userId ? `cartItems_${userId}` : 'cartItems';

  // Initialize cart from localStorage, considering user-specific key
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  // When token (and thus userId) changes, reload cart from appropriate key
  useEffect(() => {
    const handleUserChange = () => {
      const newUserId = getUserIdFromToken();
      const newKey = newUserId ? `cartItems_${newUserId}` : 'cartItems';
      if (newKey !== storageKey) {
        const saved = localStorage.getItem(newKey);
        setCartItems(saved ? JSON.parse(saved) : []);
      }
    };

    window.addEventListener('login', handleUserChange);
    window.addEventListener('logout', handleUserChange);
    window.addEventListener('storage', handleUserChange);
    return () => {
      window.removeEventListener('login', handleUserChange);
      window.removeEventListener('logout', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, [storageKey]);

  // Mỗi khi cartItems thay đổi, lưu vào key phù hợp
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, storageKey]);

  // Hàm thêm vào giỏ
  const addToCart = (product, quantity = 1) => {
    if (!requireCartLogin()) return false;

    const safeQty = normalizeQuantity(quantity);

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        // Nếu đã có, tăng số lượng
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: normalizeQuantity(item.quantity + safeQty) }
            : item
        );
      } else {
        // Nếu chưa có, thêm mới
        return [...prev, { ...product, quantity: safeQty }];
      }
    });
    alert("Đã thêm vào giỏ hàng!");
    return true;
  };

  // Hàm xóa khỏi giỏ
  const removeFromCart = (productId) => {
    if (!requireCartLogin()) return false;
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    return true;
  };

  // Hàm cập nhật số lượng
  const updateQuantity = (productId, newQuantity) => {
    if (!requireCartLogin()) return false;
    const safeQty = normalizeQuantity(newQuantity);
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: safeQty } : item
      )
    );
    return true;
  };

  // Hàm xóa sạch giỏ hàng (dùng khi thanh toán xong)
  const clearCart = () => {
    if (!requireCartLogin()) return false;
    setCartItems([]);
    return true;
  };

  // Tính tổng số lượng sản phẩm (để hiện số đỏ trên icon giỏ hàng)
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Tính tổng tiền
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      totalItems,
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

// 3. Hook để các trang khác gọi dùng
export const useCart = () => {
  return useContext(CartContext);
};