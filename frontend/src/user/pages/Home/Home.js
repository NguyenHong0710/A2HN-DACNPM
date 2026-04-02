import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import Services from './Services';
import { FiArrowRight, FiShoppingBag, FiStar } from 'react-icons/fi';
// Import thêm bộ icon trang sức chuyên dụng
import { GiDiamondRing, GiNecklace, GiDropEarrings, GiGemChain } from 'react-icons/gi';
import './Home.css';
import { API_BASE as API_BASE_URL } from "../../../config";

const Home = () => {
  const { addToCart } = useCart();
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 1. LOGIC KIỂM TRA ĐĂNG NHẬP
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user_info');
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); }
      } else { setUser(null); }
    };
    checkAuth();
    window.addEventListener('login', checkAuth);
    return () => window.removeEventListener('login', checkAuth);
  }, []);

  // 2. GỌI API LẤY SẢN PHẨM THỰC TẾ
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/products`);
        const result = await res.json();
        const data = result.data || result;
        setDbProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 3. BANNER TRƯỢT
  const bannerImages = [
    {
      url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80",
      title: "Lumina Jewelry - Đẳng Cấp Thượng Lưu",
      subtitle: "Tôn vinh vẻ đẹp quý phái và khí chất riêng biệt của bạn."
    },
    {
      url: "https://images.unsplash.com/photo-1605100804763-247f67b6348e?auto=format&fit=crop&w=1920&q=80",
      title: "Bộ Sưu Tập Nhẫn Cưới",
      subtitle: "Minh chứng rực rỡ cho tình yêu vĩnh cửu theo dòng thời gian."
    }
  ];
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // 4. LOGIC XỬ LÝ ẢNH
  const getImageUrl = (images) => {
    try {
      const parsed = typeof images === 'string' ? JSON.parse(images) : images;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return `http://127.0.0.1:8000/storage/${parsed[0]}`;
      }
    } catch (e) {}
    return 'https://via.placeholder.com/300?text=Lumina+Jewelry';
  };

  // 5. DANH MỤC NỔI BẬT (Đã đổi sang Icon và tên chuẩn khớp với filter trang Shop)
  const circleCategories = [
    { name: 'Nhẫn Bạc', icon: <GiDiamondRing /> },
    { name: 'Dây Chuyền Bạc', icon: <GiNecklace /> },
    { name: 'Bông Tai Bạc', icon: <GiDropEarrings /> },
    { name: 'Lắc & Vòng Tay', icon: <GiGemChain /> },
  ];

  return (
    <div className="home-wrapper">
      {/* 1. HERO BANNER */}
      <div className="hero-slider">
        {bannerImages.map((banner, index) => (
          <div 
            key={index}
            className={`hero-slide ${index === currentBanner ? 'active' : ''}`}
            style={{ backgroundImage: `url(${banner.url})` }}
          >
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <span className="hero-badge">Chính hãng 100%</span>
              <h1 className="hero-title">{banner.title}</h1>
              <p className="hero-subtitle">{banner.subtitle}</p>
              <Link to="/shop" className="hero-btn">
                Khám phá ngay <FiArrowRight />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Services />

      <div className="home-container">
        {/* 2. DANH MỤC NỔI BẬT (ICON SANG TRỌNG) */}
        <section className="category-section">
          <div className="section-header">
            <h2 className="section-title">Danh Mục Nổi Bật</h2>
          </div>
          <div className="category-grid-circles">
            {circleCategories.map((cat, idx) => (
              <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} key={idx} className="category-item-circle">
                <div className="circle-icon-wrapper">
                  {cat.icon}
                </div>
                <span className="category-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. SẢN PHẨM NỔI BẬT */}
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title">Khám phá bộ sưu tập</h2>
            <p className="section-subtitle">Tuyệt tác trang sức được chế tác thủ công</p>
          </div>
          
          {loading ? (
            <div className="loading-spinner">Đang tải sản phẩm...</div>
          ) : dbProducts.length === 0 ? (
            <p className="no-data">Sản phẩm đang được cập nhật...</p>
          ) : (
            <div className="product-grid">
              {dbProducts.slice(0, 8).map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrapper">
                    <Link to={`/product/${product.id}`}>
                        <img src={getImageUrl(product.images)} alt={product.name} />
                    </Link>
                    <div className="product-actions">
                      <button onClick={() => addToCart(product)} className="action-btn">
                        <FiShoppingBag />
                      </button>
                    </div>
                  </div>
                  <div className="product-info">
                    <span className="product-cat">{product.category}</span>
                    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className="product-name">{product.name}</h3>
                    </Link>
                    <div className="product-bottom">
                      <span className="product-price">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                      </span>
                      <div className="product-rating">
                        <FiStar className="star-icon" /> 5.0
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="view-all-wrapper">
            <Link to="/shop" className="view-alal-btn">Xem tất cả sản phẩm</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;