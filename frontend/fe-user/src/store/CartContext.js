import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Tạo Context
const CartContext = createContext();

// 2. Tạo Provider (Nhà cung cấp dữ liệu)
export const CartProvider = ({ children }) => {
  // Lấy dữ liệu từ LocalStorage khi mới vào web (để F5 không mất giỏ hàng)
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Mỗi khi cartItems thay đổi, lưu ngay vào LocalStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Hàm thêm vào giỏ
  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        // Nếu đã có, tăng số lượng
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Nếu chưa có, thêm mới
        return [...prev, { ...product, quantity }];
      }
    });
    alert("Đã thêm vào giỏ hàng!");
  };

  // Hàm xóa khỏi giỏ
  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  // Hàm cập nhật số lượng
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Hàm xóa sạch giỏ hàng (dùng khi thanh toán xong)
  const clearCart = () => {
    setCartItems([]);
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
