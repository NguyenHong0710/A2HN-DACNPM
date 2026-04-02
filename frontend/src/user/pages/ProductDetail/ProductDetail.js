import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from "../../store/CartContext";
import { FaStar, FaShieldAlt, FaTruck, FaSearchPlus, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiStar, FiShoppingBag, FiMessageSquare } from 'react-icons/fi';
import './ProductDetail.css';
import { API_BASE as API_BASE_URL } from "../../../config"; // Đảm bảo đường dẫn này đúng

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // 1. Hàm xử lý URL ảnh (Giống bên Home/Shop)
  const getImageUrl = (images) => {
    try {
        // 1. Parse JSON nếu images là chuỗi, nếu là mảng thì giữ nguyên
        const parsed = typeof images === 'string' ? JSON.parse(images) : images;
        
        if (Array.isArray(parsed) && parsed.length > 0) {
            const firstImage = parsed[0];
            
            // 2. Nếu đã là link đầy đủ (http...) thì trả về luôn
            if (firstImage.startsWith('http')) return firstImage;
            
            // 3. Nếu là đường dẫn tương đối, nối với URL Backend
            // Đảm bảo không bị lặp chữ "storage/"
            const cleanPath = firstImage.startsWith('/') ? firstImage.substring(1) : firstImage;
            return `http://127.0.0.1:8000/${cleanPath}`;
        }
    } catch (e) {
        console.error("Lỗi parse ảnh:", e);
    }
    
    // 4. Fallback khi không có ảnh (Đổi sang placehold.jp để tránh lỗi Connection Closed)
    return 'https://placehold.jp/24/c5a059/ffffff/500x500.png?text=Lumina+Jewelry';
};
  // 2. Lấy dữ liệu sản phẩm từ API
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        // Lấy chi tiết sản phẩm hiện tại
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        const result = await res.json();
        const mainProduct = result.data || result;
        setProduct(mainProduct);

        // Lấy tất cả sản phẩm để lọc sản phẩm tương tự
        const allRes = await fetch(`${API_BASE_URL}/products`);
        const allData = await allRes.json();
        const allProducts = allData.data || allData;

        if (mainProduct && Array.isArray(allProducts)) {
          const related = allProducts
            .filter(p => p.category === mainProduct.category && p.id !== mainProduct.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Lỗi lấy dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi đổi ID
  }, [id]);

  if (loading) return <div className="not-found">Đang tải sản phẩm...</div>;
  if (!product) return <div className="not-found">Không tìm thấy sản phẩm! <Link to="/">Về trang chủ</Link></div>;

  // Xử lý danh sách ảnh
  const productImages = product.images 
    ? (typeof product.images === 'string' && product.images.startsWith('[') ? JSON.parse(product.images) : [product.image])
    : [product.image];

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  return (
    <div className="pd-page-container">
      <div className="pd-top-section">
        {/* CỘT TRÁI: ẢNH */}
        <div className="pd-image-gallery">
          <div className="pd-main-image" onClick={() => setIsZoomed(true)}>
            <img src={getImageUrl(productImages[currentImageIndex])} alt={product.name} />
            <button className="img-nav-btn prev-btn" onClick={handlePrevImage}><FaChevronLeft /></button>
            <button className="img-nav-btn next-btn" onClick={handleNextImage}><FaChevronRight /></button>
            <div className="zoom-hint"><FaSearchPlus /> Phóng to</div>
          </div>
          <div className="pd-thumbnails">
            {productImages.map((img, index) => (
              <div 
                key={index} 
                className={`thumb-item ${currentImageIndex === index ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img src={getImageUrl(img)} alt="thumb" />
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN */}
        <div className="pd-info-box">
          <div className="pd-category-tag">
            Danh mục: <Link to={`/shop?category=${product.category}`} style={{ color: '#c5a059', fontWeight: 'bold' }}>{product.category}</Link>
          </div>
          <h1 className="pd-title">{product.name}</h1>
          
          <div className="pd-rating">
            <span className="stars">
                {[...Array(5)].map((_, i) => <FaStar key={i} color="#ffc107" />)}
            </span>
            <span className="review-count">(5.0) | Đã kiểm định</span>
          </div>

          <div className="pd-price-box">
            <span className="current-price">{Number(product.price).toLocaleString()} ₫</span>
          </div>

          <div className="pd-actions">
            <div className="qty-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <input type="number" value={quantity} readOnly />
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="btn-add-cart" onClick={() => addToCart(product, quantity)}>
              <FiShoppingBag /> Thêm vào giỏ
            </button>
          </div>

          <div className="pd-policy">
             <div className="policy-item"><FaShieldAlt color="#c5a059"/> <span>Bảo hành trọn đời</span></div>
             <div className="policy-item"><FaTruck color="#c5a059"/> <span>Giao hàng hỏa tốc</span></div>
          </div>
        </div>
      </div>

      {/* MÔ TẢ */}
      <div className="pd-bottom-section">
        <div className="pd-description">
            <div className="desc-header">MÔ TẢ SẢN PHẨM</div>
            <div className={`desc-content ${isExpanded ? 'expanded' : ''}`}>
                <p>{product.description || "Thông tin sản phẩm đang được cập nhật..."}</p>
            </div>
            <button className="btn-toggle-desc" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Thu gọn ▲' : 'Xem thêm ▼'}
            </button>
        </div>
      </div>

      {/* SẢN PHẨM TƯƠNG TỰ */}
      {relatedProducts.length > 0 && (
        <div className="related-section">
            <h2 className="related-title">SẢN PHẨM TƯƠNG TỰ</h2>
            <div className="products-grid">
                {relatedProducts.map(item => (
                    <div key={item.id} className="modern-product-card">
                      <Link to={`/product/${item.id}`} className="card-img-link">
                        <img src={getImageUrl(item.images || item.image)} alt={item.name} />
                      </Link>
                      <div className="card-body">
                        <div className="card-category">{item.category}</div>
                        <Link to={`/product/${item.id}`} className="card-title">{item.name}</Link>
                        <div className="card-price-row">
                          <span className="current-price">{Number(item.price).toLocaleString()}đ</span>
                          <button className="btn-add-cart-icon" onClick={() => addToCart(item)}><FiShoppingBag /></button>
                        </div>
                      </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;