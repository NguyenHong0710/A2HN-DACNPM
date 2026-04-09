import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from "../../store/CartContext";
import { FaStar, FaShieldAlt, FaTruck, FaSearchPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiShoppingBag } from 'react-icons/fi';
import './ProductDetail.css';
import { API_BASE as API_BASE_URL } from "../../../config";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMoreBtn, setShowReadMoreBtn] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false); // Trạng thái phóng to ảnh
  
  const contentRef = useRef(null);

  const getImageUrl = (images) => {
    try {
        if (!images) return 'https://placehold.jp/24/c5a059/ffffff/500x500.png?text=Lumina+Jewelry';
        const parsed = typeof images === 'string' && (images.startsWith('[') || images.startsWith('{')) 
            ? JSON.parse(images) : images;
        let targetPath = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!targetPath) return 'https://placehold.jp/24/c5a059/ffffff/500x500.png?text=Lumina+Jewelry';
        if (targetPath.startsWith('http')) return targetPath;
        const cleanPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
        return `http://127.0.0.1:8000/storage/${cleanPath}`;
    } catch (e) {
        if (typeof images === 'string' && !images.startsWith('[')) {
             return `http://127.0.0.1:8000/storage/${images}`;
        }
    }
    return 'https://placehold.jp/24/c5a059/ffffff/500x500.png?text=Lumina+Jewelry';
  };

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        const result = await res.json();
        const mainProduct = result.data || result;
        setProduct(mainProduct);

        const allRes = await fetch(`${API_BASE_URL}/products?per_page=100`);
        const allData = await allRes.json();
        const allProducts = allData.data || (Array.isArray(allData) ? allData : []);

        if (mainProduct && allProducts.length > 0) {
          const mainCat = String(mainProduct.category || "").trim().toLowerCase();
          const related = allProducts
            .filter(p => {
              const currentCat = String(p.category || "").trim().toLowerCase();
              return currentCat === mainCat && String(p.id) !== String(id);
            })
            .slice(0, 3); // Tăng lên 3 để cân đối giao diện hàng ngang
          
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Lỗi lấy dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0); 
  }, [id]);

  useEffect(() => {
    if (product && contentRef.current) {
        const height = contentRef.current.scrollHeight;
        setShowReadMoreBtn(height > 150);
    }
  }, [product, loading]);

  if (loading) return <div className="not-found">Đang tải sản phẩm...</div>;
  if (!product) return <div className="not-found">Không tìm thấy sản phẩm! <Link to="/">Về trang chủ</Link></div>;

  const productImages = (() => {
    const rawData = product.images || product.image;
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    try {
      if (typeof rawData === 'string' && rawData.startsWith('[')) return JSON.parse(rawData);
    } catch (e) {}
    return [rawData];
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
        <div className="pd-image-gallery">
          {/* Vùng ảnh chính có thể nhấn để phóng to */}
          <div className="pd-main-image" onClick={() => setIsZoomed(true)}>
            <img src={getImageUrl(productImages[currentImageIndex])} alt={product.name} />
            {productImages.length > 1 && (
              <>
                <button className="img-nav-btn prev-btn" onClick={handlePrevImage}><FaChevronLeft /></button>
                <button className="img-nav-btn next-btn" onClick={handleNextImage}><FaChevronRight /></button>
              </>
            )}
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

        <div className="pd-info-box">
          <div className="pd-category-tag">
            Danh mục: 
            <Link to={`/shop?category=${product.category || 'Chưa phân loại'}`} style={{ color: '#c5a059', fontWeight: 'bold', marginLeft: '5px' }}>
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
                const productToCart = {
                    ...product,
                    image: Array.isArray(productImages) ? productImages[0] : (product.image || product.images)
                };
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

      <div className="pd-bottom-section">
        <div className="pd-description">
            <div className="desc-header">MÔ TẢ SẢN PHẨM</div>
            <div 
              ref={contentRef}
              className={`desc-content ${isExpanded ? 'expanded' : ''}`}
              style={{ maxHeight: isExpanded ? 'none' : '150px' }}
            >
                <p>
                  {product.description 
                    ? product.description.trim() 
                    : "Thông tin sản phẩm đang được cập nhật..."}
                </p>
            </div>
            {showReadMoreBtn && (
              <button className="btn-toggle-desc" onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? 'Thu gọn ▲' : 'Xem thêm ▼'}
              </button>
            )}
        </div>
      </div>

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
                          <button className="btn-add-cart-icon" onClick={() => addToCart(item, 1)}>
                            <FiShoppingBag />
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* MODAL PHÓNG TO ẢNH */}
      {isZoomed && (
        <div className="image-zoom-modal" onClick={() => setIsZoomed(false)}>
          <button className="close-modal-btn" onClick={() => setIsZoomed(false)}>&times;</button>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {productImages.length > 1 && (
              <button className="modal-nav-btn prev-btn" onClick={handlePrevImage}>
                <FaChevronLeft />
              </button>
            )}
            <img 
              src={getImageUrl(productImages[currentImageIndex])} 
              alt="Phóng to" 
              className="zoomed-image" 
            />
            {productImages.length > 1 && (
              <button className="modal-nav-btn next-btn" onClick={handleNextImage}>
                <FaChevronRight />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;