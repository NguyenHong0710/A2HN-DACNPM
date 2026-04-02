/* src/App.js */
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Layout
import Header from './components/Layout/Header.js'; 
import Footer from './components/Layout/Footer.js';
import Chatbox from './components/UI/Chatbox.js';
import ScrollToTop from './components/UI/ScrollToTop.js';

// Import các trang chức năng
import Home from './pages/Home/Home.js';
import About from './pages/About/About.js'; 
import ProductDetail from './pages/ProductDetail/ProductDetail.js';
import Cart from './pages/Cart/Cart.js';
import Checkout from './pages/Checkout/Checkout.js';
import Contact from './pages/Contact/Contact.js';
import Support from './pages/Support/Support.js';
import Voucher from './pages/Voucher/Voucher.js';
import NotificationPage from './pages/Notification/NotificationPage.js';

// Import nhóm Auth (Bao gồm 3 trang mới)
import Login from './pages/Auth/Login.js';
import Register from './pages/Auth/Register.js';
import Profile from './pages/User/Profile.js';
import ForgotPassword from './pages/Auth/ForgotPassword.js';
import VerifyOtp from './pages/Auth/VerifyOtp.js';       
import ResetPassword from './pages/Auth/ResetPassword.js'; 
import Shop from './pages/Shop/Shop.js';

// 👇 THÊM IMPORT TRANG THEO DÕI ĐƠN HÀNG Ở ĐÂY 👇
import OrderHistory from './pages/Orders/OrderHistory.js';
import Messages from './pages/Messages/Messages.js';

function App() {
  return (
    <div className="App">
      <ScrollToTop />
      <Header />

      <div style={{ minHeight: '80vh', backgroundColor: '#f5f5f5', paddingBottom: '20px' }}>
        <Routes>
          {/* --- TRANG CHỦ & SẢN PHẨM --- */}
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/shop" element={<Shop />} />

          {/* --- CÁC TRANG THÔNG TIN --- */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Support />} />
          <Route path="/voucher" element={<Voucher />} />

          {/* --- TÀI KHOẢN & QUÊN MẬT KHẨU --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Quy trình lấy lại mật khẩu */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* --- MUA HÀNG & ĐƠN HÀNG --- */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          {/* 👇 THÊM ROUTE CHO TRANG THEO DÕI ĐƠN HÀNG 👇 */}
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/messages" element={<Messages />} />
          
          {/* --- KHÁC --- */}
          <Route path="/notifications" element={<NotificationPage />} />
        </Routes>
      </div>

      <Footer />
      <Chatbox />
    </div>
  );
}

export default App;
