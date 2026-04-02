import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { products } from '../../data';
import Services from './Services';
import { FiArrowRight, FiShoppingBag, FiStar, FiTrendingUp } from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const { addToCart } = useCart();

  // --- LOGIC BANNER TRƯỢT ---
  const bannerImages = [
    {
      url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80",
      title: "AgriMarket - Tươi Sạch 100%",
      subtitle: "Mang hương vị thiên nhiên từ nông trại đến bàn ăn gia đình bạn."
    },
    {
      url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1920&q=80",
      title: "Trái Cây Theo Mùa",
      subtitle: "Thưởng thức vị ngọt tự nhiên, giàu vitamin mỗi ngày."
    },
    {
      url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1920&q=80",
      title: "Thực Phẩm Hữu Cơ",
      subtitle: "Bảo vệ sức khỏe gia đình với nguồn thực phẩm an toàn."
    }
  ];
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- DỮ LIỆU GIAO DIỆN ---
  const circleCategories = [
    { id: 1, name: "Rau xanh", img: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=150&q=80", color: "bg-green" },
    { id: 2, name: "Thịt tươi sống", img: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=150&q=80", color: "bg-red" },
    { id: 3, name: "Thực phẩm khô", img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=150&q=80", color: "bg-yellow" },
    { id: 4, name: "Trái cây", img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=150&q=80", color: "bg-purple" },
    { id: 5, name: "Trứng và bơ", img: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=150&q=80", color: "bg-orange" },
    { id: 6, name: "Đồ uống", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=150&q=80", color: "bg-blue" }
  ];

  const newsList = [
    { id: 1, title: "Đi chợ online: Xu hướng lên ngôi", date: "30/06/2026", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400", category: "Xu hướng" },
    { id: 2, title: "Cách chọn rau củ quả sạch tươi ngon", date: "28/06/2026", img: "https://images.unsplash.com/photo-1596162954151-cdcb4c0f70a8?w=400", category: "Mẹo vặt" },
    { id: 3, title: "Các loại ngũ cốc tốt cho sức khỏe", date: "25/06/2026", img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400", category: "Sức khỏe" }
  ];

  const dealProducts = products.slice(0, 4);
  const trendingProducts = products.slice(4, 8);

  return (
    <div className="home-wrapper">
      
      {/* 1. HERO BANNER TRƯỢT */}
      <div className="hero-slider">
        {bannerImages.map((banner, index) => (
          <div 
            key={index}
            className={`hero-slide ${index === currentBanner ? 'active' : ''}`}
            style={{ backgroundImage: `url(${banner.url})` }}
          >
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <span className="hero-badge">100% Organic</span>
              <h1 className="hero-title">{banner.title}</h1>
              <p className="hero-subtitle">{banner.subtitle}</p>
              <Link to="/shop" className="hero-btn">
                Khám phá ngay <FiArrowRight />
              </Link>
            </div>
          </div>
        ))}
        
        <div className="hero-dots">
          {bannerImages.map((_, index) => (
            <button 
              key={index} 
              className={`hero-dot ${index === currentBanner ? 'active' : ''}`} 
              onClick={() => setCurrentBanner(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <Services />

      <div className="home-container">
        
        {/* 2. DANH MỤC SẢN PHẨM */}
        <div className="section-header">
          <h2 className="section-title">Khám phá danh mục</h2>
          <p className="section-subtitle">Sản phẩm tươi ngon được chọn lọc kỹ càng</p>
        </div>
        
        <div className="category-showcase">
          {circleCategories.map(cat => (
            <Link to="/shop" key={cat.id} className="category-card">
              <div className={`category-img-wrap ${cat.color}`}>
                <img src={cat.img} alt={cat.name} />
              </div>
              <h3 className="category-name">{cat.name}</h3>
            </Link>
          ))}
        </div>

        {/* 3. ƯU ĐÃI TRONG TUẦN */}
        <div className="deals-section">
          <div className="deals-header">
            <div className="deals-title-wrap">
              <span className="fire-icon">🔥</span>
              <h2>Siêu sale trong tuần</h2>
            </div>
            <div className="countdown-timer">
              <div className="time-block"><span>03</span><small>Ngày</small></div>
              <div className="time-block"><span>15</span><small>Giờ</small></div>
              <div className="time-block"><span>45</span><small>Phút</small></div>
            </div>
          </div>
          
          <div className="product-grid">
            {dealProducts.map(product => (
              <div key={product.id} className="modern-product-card">
                <div className="card-badges">
                  <span className="badge-discount">-15%</span>
                  <span className="badge-hot">Hot</span>
                </div>
                
                <Link to={`/product/${product.id}`} className="card-img-link">
                  <img src={product.image} alt={product.name} />
                </Link>
                
                <div className="card-body">
                  <div className="card-category">{product.category}</div>
                  <div className="card-rating">
                    <FiStar className="star-icon filled" />
                    <FiStar className="star-icon filled" />
                    <FiStar className="star-icon filled" />
                    <FiStar className="star-icon filled" />
                    <FiStar className="star-icon filled" />
                    <span>(4.5)</span>
                  </div>
                  
                  <Link to={`/product/${product.id}`} className="card-title">
                    {product.name}
                  </Link>
                  
                  <div className="card-price-row">
                    <div className="price-info">
                      <span className="current-price">{product.price.toLocaleString()}đ</span>
                      <span className="old-price">{(product.price * 1.15).toLocaleString()}đ</span>
                    </div>
                    <button 
                      className="btn-add-cart-icon"
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(product);
                      }}
                      title="Thêm vào giỏ"
                    >
                      <FiShoppingBag />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. BANNERS ĐÔI */}
        <div className="promo-banners">
          <div className="promo-card promo-green">
            <div className="promo-content">
              <span className="promo-tag">Hữu cơ 100%</span>
              <h3>Rau củ quả tươi sạch mỗi ngày</h3>
              <p>Giảm ngay 20% cho đơn hàng đầu tiên</p>
              <Link to="/shop" className="promo-btn">Mua ngay <FiArrowRight /></Link>
            </div>
            <div className="promo-img-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80')" }}></div>
          </div>
          
          <div className="promo-card promo-orange">
            <div className="promo-content">
              <span className="promo-tag">Giải khát mùa hè</span>
              <h3>Nước ép trái cây nguyên chất</h3>
              <p>Combo 3 chai chỉ từ 99.000đ</p>
              <Link to="/shop" className="promo-btn">Mua ngay <FiArrowRight /></Link>
            </div>
            <div className="promo-img-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80')" }}></div>
          </div>
        </div>

        {/* 5. SẢN PHẨM NỔI BẬT */}
        <div className="section-header">
          <div className="header-with-icon">
            <FiTrendingUp className="section-icon text-green" />
            <h2 className="section-title">Sản phẩm nổi bật</h2>
          </div>
          <Link to="/shop" className="view-all-link">Xem tất cả <FiArrowRight /></Link>
        </div>
        
        <div className="product-grid">
          {trendingProducts.map(product => (
            <div key={product.id} className="modern-product-card">
              <Link to={`/product/${product.id}`} className="card-img-link">
                <img src={product.image} alt={product.name} />
              </Link>
              
              <div className="card-body">
                <div className="card-category">{product.category}</div>
                <Link to={`/product/${product.id}`} className="card-title">
                  {product.name}
                </Link>
                
                <div className="card-price-row">
                  <div className="price-info">
                    <span className="current-price">{product.price.toLocaleString()}đ</span>
                  </div>
                  <button 
                    className="btn-add-cart-icon outline"
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product);
                    }}
                  >
                    <FiShoppingBag />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 6. BANNER DỊCH VỤ ĐẶC BIỆT */}
        <div className="special-service-banner">
          <div className="service-content">
            <span className="service-subtitle">Dịch vụ giao hàng</span>
            <h2>Giao hàng hỏa tốc trong 2 giờ</h2>
            <p>Đảm bảo độ tươi ngon tuyệt đối khi đến tay khách hàng. Miễn phí giao hàng cho đơn từ 500.000đ.</p>
            <Link to="/shop" className="btn-solid-white">Trải nghiệm ngay</Link>
          </div>
        </div>

        {/* 7. TIN TỨC & BÀI VIẾT */}
        <div className="section-header center">
          <h2 className="section-title">Góc ẩm thực & Sức khỏe</h2>
          <p className="section-subtitle">Cập nhật những thông tin hữu ích mỗi ngày</p>
        </div>
        
        <div className="blog-grid">
          {newsList.map(news => (
            <div key={news.id} className="blog-card">
              <div className="blog-img-wrap">
                <img src={news.img} alt={news.title} />
                <span className="blog-category">{news.category}</span>
              </div>
              <div className="blog-content">
                <div className="blog-meta">
                  <span>{news.date}</span>
                  <span className="dot-separator">•</span>
                  <span>Bởi vendor</span>
                </div>
                <h3 className="blog-title">{news.title}</h3>
                <Link to="#" className="blog-read-more">Đọc tiếp <FiArrowRight /></Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Home;
