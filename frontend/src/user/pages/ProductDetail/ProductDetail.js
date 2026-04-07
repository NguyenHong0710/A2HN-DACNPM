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
        if (!images) return 'https://placehold.jp/24/c5a059/ffffff/500x500.png?text=Lumina+Jewelry';

        // 1. Parse JSON nếu images là chuỗi (dạng '["path/to/img.jpg"]')
        const parsed = typeof images === 'string' && (images.startsWith('[') || images.startsWith('{')) 
            ? JSON.parse(images) 
            : images;
        
        // Lấy đường dẫn ảnh (nếu là mảng thì lấy cái đầu tiên, nếu là chuỗi thì dùng luôn)
        let targetPath = Array.isArray(parsed) ? parsed[0] : parsed;
        
        if (!targetPath) return 'https://placehold.jp/24/c5a059/ffffff/500x500.png?text=Lumina+Jewelry';

        // 2. Nếu đã là link đầy đủ (http...) thì trả về luôn
        if (targetPath.startsWith('http')) return targetPath;
        
        // 3. Xử lý đường dẫn tương đối
        // Loại bỏ dấu gạch chéo ở đầu nếu có để tránh lặp //
        const cleanPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
        
        // QUAN TRỌNG: Phải có chữ /storage/ ở giữa domain và path
        return `http://127.0.0.1:8000/storage/${cleanPath}`;
    } catch (e) {
        console.error("Lỗi xử lý ảnh:", e);
        // Nếu lỗi parse nhưng targetPath là chuỗi thô, thử nối storage luôn
        if (typeof images === 'string' && !images.startsWith('[')) {
             return `http://127.0.0.1:8000/storage/${images}`;
        }
    }
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
  .filter(p => {
    // Nếu cả hai đều null (chưa phân loại) thì vẫn coi là cùng nhóm
    const cat1 = p.category || "Chưa phân loại";
    const cat2 = mainProduct.category || "Chưa phân loại";
    return cat1 === cat2 && p.id !== mainProduct.id;
  })
  .slice(0, 4);
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
  // Xử lý danh sách ảnh an toàn
  const productImages = (() => {
    if (!product.images && !product.image) return [];
    
    const rawData = product.images || product.image;
    if (Array.isArray(rawData)) return rawData;
    
    try {
      if (typeof rawData === 'string' && rawData.startsWith('[')) {
        return JSON.parse(rawData);
      }
    } catch (e) {
      console.error("Lỗi parse mảng ảnh:", e);
    }
    
    return [rawData]; // Trả về mảng 1 phần tử nếu là chuỗi đơn
  })();
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
  Danh mục: 
  <Link 
    to={`/shop?category=${product.category || 'Chưa phân loại'}`} 
    style={{ color: '#c5a059', fontWeight: 'bold' }}
  >
    {product.category || 'Chưa phân loại'}
  </Link>
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
              <button className="btn-add-cart" onClick={() => {
    // Log thử xem biến product hiện tại có ảnh không
    console.log("Product gốc từ API:", product);

    const productToCart = {
        ...product,
        // Ép trường image lấy từ productImages mà bạn đã xử lý ở dòng 104
        image: Array.isArray(productImages) ? productImages[0] : (product.image || product.images)
    };
    
    console.log("Dữ liệu sẽ bay vào giỏ:", productToCart);
    addToCart(productToCart, quantity);
}}>
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
                        <div className="card-category">{item.category || 'Chưa phân loại'}</div>
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