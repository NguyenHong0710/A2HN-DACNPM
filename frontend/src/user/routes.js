import Home from './pages/Home/Home.js';
import About from './pages/About/About.js';
import ProductDetail from './pages/ProductDetail/ProductDetail.js';
import Cart from './pages/Cart/Cart.js';
import Checkout from './pages/Checkout/Checkout.js';
import Contact from './pages/Contact/Contact.js';
import Support from './pages/Support/Support.js';
import Voucher from './pages/Voucher/Voucher.js';
import NotificationPage from './pages/Notification/NotificationPage.js';
import Login from './pages/Auth/Login.js';
import Register from './pages/Auth/Register.js';
import Profile from './pages/User/Profile.js';
import ForgotPassword from './pages/Auth/ForgotPassword.js';
import VerifyOtp from './pages/Auth/VerifyOtp.js';
import ResetPassword from './pages/Auth/ResetPassword.js';
import Shop from './pages/Shop/Shop.js';
import OrderHistory from './pages/Orders/OrderHistory.js';

const routes = [
  { path: '/', name: 'Home', element: Home },
  { path: '/product/:id', name: 'Product Detail', element: ProductDetail },
  { path: '/shop', name: 'Shop', element: Shop },
  { path: '/about', name: 'About', element: About },
  { path: '/contact', name: 'Contact', element: Contact },
  { path: '/support', name: 'Support', element: Support },
  { path: '/voucher', name: 'Voucher', element: Voucher },
  { path: '/login', name: 'Login', element: Login },
  { path: '/register', name: 'Register', element: Register },
  { path: '/profile', name: 'Profile', element: Profile },
  { path: '/forgot-password', name: 'Forgot Password', element: ForgotPassword },
  { path: '/verify-otp', name: 'Verify OTP', element: VerifyOtp },
  { path: '/reset-password', name: 'Reset Password', element: ResetPassword },
  { path: '/cart', name: 'Cart', element: Cart },
  { path: '/checkout', name: 'Checkout', element: Checkout },
  { path: '/orders', name: 'Order History', element: OrderHistory },
  { path: '/notifications', name: 'Notifications', element: NotificationPage },
];

export default routes;
