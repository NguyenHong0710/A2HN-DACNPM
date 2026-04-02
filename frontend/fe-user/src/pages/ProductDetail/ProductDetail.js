import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from "../../store/CartContext";
import { products } from '../../data';
import { FaStar, FaCheckCircle, FaTruck, FaShieldAlt, FaSearchPlus, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiStar, FiShoppingBag, FiMessageSquare } from 'react-icons/fi';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedType, setSelectedType] = useState('1kg');
  const [selectedArea, setSelectedArea] = useState('Hà Nội');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 1. Tìm sản phẩm hiện tại
  const product = products.find(p => p.id === parseInt(id));

  // 2. State lưu ảnh chính và trạng thái zoom
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([
    { id: 1, user: 'Nguyễn Văn A', rating: 5, comment: 'Sản phẩm rất tươi ngon, giao hàng nhanh!', date: '15/03/2026' },
    { id: 2, user: 'Trần Thị B', rating: 4, comment: 'Đóng gói cẩn thận, chất lượng tốt.', date: '10/03/2026' }
  ]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  // 3. Logic reset khi đổi sản phẩm (quan trọng khi bấm vào sản phẩm tương tự)
  useEffect(() => {
    if (product) {
        setCurrentImageIndex(0);
        setQuantity(1);
        setIsExpanded(false); // Thu gọn mô tả lại
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); // Cuộn lên đầu
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 10);
    }
  }, [product, id]);

  if (!product) {
    return <div className="not-found">Không tìm thấy sản phẩm! <Link to="/">Về trang chủ</Link></div>;
  }

  // 4. LỌC SẢN PHẨM TƯƠNG TỰ (Cùng category, khác ID hiện tại)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4); // Lấy tối đa 4 sản phẩm

  // Tạo mảng ảnh giả lập (trong thực tế sẽ lấy từ data)
  const productImages = product.images || [
    product.image, 
    product.image, 
    product.image, 
    product.image
  ];

  const handleQuantity = (num) => {
    if (quantity + num >= 1) setQuantity(quantity + num);
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (newReview.comment.trim() === '') return;
    
    const review = {
      id: Date.now(),
      user: 'Khách hàng',
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toLocaleDateString('vi-VN')
    };
    
    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, comment: '' });
  };

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
      {/* --- PHẦN 1: THÔNG TIN TRÊN --- */}
      <div className="pd-top-section">
        {/* CỘT TRÁI: ẢNH */}
        <div className="pd-image-gallery">
          <div className="pd-main-image" onClick={() => setIsZoomed(true)}>
            <span className="discount-badge">-15%</span>
            <img src={productImages[currentImageIndex]} alt={product.name} />
            
            <button className="img-nav-btn prev-btn" onClick={handlePrevImage}>
              <FaChevronLeft />
            </button>
            <button className="img-nav-btn next-btn" onClick={handleNextImage}>
              <FaChevronRight />
            </button>
            
            <div className="zoom-hint">
              <FaSearchPlus /> Phóng to
            </div>
          </div>
          <div className="pd-thumbnails">
            {productImages.map((img, index) => (
              <div 
                key={index} 
                className={`thumb-item ${currentImageIndex === index ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img src={img} alt={`thumb-${index}`} />
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN */}
        <div className="pd-info-box">
          <div className="pd-category-tag">
            Danh mục: <Link to="/shop" style={{ color: '#2e7d32', fontWeight: 'bold', textDecoration: 'none' }}>{product.category}</Link>
          </div>
          <h1 className="pd-title">{product.name} - AgriMarket</h1>
          
          <div className="pd-rating">
            <span className="stars">
                {[...Array(5)].map((_, i) => <FaStar key={i} color="#ffc107" />)}
            </span>
            <span className="review-count">(19 đánh giá) | 120 đã bán</span>
          </div>

          <div className="pd-price-box">
            <span className="current-price">{product.price.toLocaleString()} ₫</span>
            <span className="old-price">{(product.price * 1.15).toLocaleString()} ₫</span>
          </div>

          <div className="pd-option-row">
            <span className="opt-label">Khu vực:</span>
            <div className="opt-values">
                {['Hà Nội', 'Hồ Chí Minh'].map(area => (
                    <button 
                        key={area}
                        className={`opt-btn ${selectedArea === area ? 'selected' : ''}`}
                        onClick={() => setSelectedArea(area)}
                    >{area}</button>
                ))}
            </div>
          </div>

          <div className="pd-option-row">
            <span className="opt-label">Trọng lượng:</span>
            <div className="opt-values">
                {['500 G', '1 kg'].map(type => (
                    <button 
                        key={type}
                        className={`opt-btn ${selectedType === type ? 'selected' : ''}`}
                        onClick={() => setSelectedType(type)}
                    >{type}</button>
                ))}
            </div>
          </div>

          <div className="pd-actions">
            <div className="qty-control">
                <button onClick={() => handleQuantity(-1)}>-</button>
                <input type="text" value={quantity} readOnly />
                <button onClick={() => handleQuantity(1)}>+</button>
            </div>
            <button className="btn-add-cart" onClick={() => addToCart(product, quantity)}>Thêm vào giỏ</button>
            <button className="btn-buy-now">Mua ngay</button>
          </div>

          <div className="vendor-info-box">
             <div className="vendor-avatar">N</div>
             <div className="vendor-details">
                <span className="vendor-name">Nông Trại Đà Lạt</span>
                <span className="vendor-status">Online 5 phút trước</span>
             </div>
             <Link to="/messages" className="btn-chat-vendor">
                <FiMessageSquare /> Chat ngay
             </Link>
          </div>

          <div className="pd-policy">
             <div className="policy-item"><FaCheckCircle color="green"/> <span>100% Tươi sạch</span></div>
             <div className="policy-item"><FaShieldAlt color="green"/> <span>Hoàn tiền nếu hỏng</span></div>
             <div className="policy-item"><FaTruck color="green"/> <span>Giao nhanh 2h</span></div>
          </div>
        </div>
      </div>

      {/* --- PHẦN 2: MÔ TẢ & ĐÁNH GIÁ --- */}
      <div className="pd-tabs-section">
        <div className="pd-tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Mô tả sản phẩm
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Đánh giá ({reviews.length})
          </button>
        </div>

        <div className="pd-tabs-content">
          {activeTab === 'description' && (
            <div className="pd-bottom-section">
              <div className="pd-description">
                  <div className={`desc-content ${isExpanded ? 'expanded' : ''}`}>
                      <div className="toc-box">
                          <h3>📖 Mục lục</h3>
                          <ol>
                              <li>{product.name} là gì?</li>
                              <li>Nguồn gốc, đặc điểm</li>
                              <li>Giá trị dinh dưỡng</li>
                              <li>Cách chế biến</li>
                          </ol>
                      </div>
                      <h3>1. {product.name} là gì?</h3>
                      <p>{product.desc}</p>
                      <p>Sản phẩm được trồng theo tiêu chuẩn VietGAP, đảm bảo an toàn vệ sinh thực phẩm.</p>
                      <h3>2. Giá trị dinh dưỡng</h3>
                      <p>Cung cấp nhiều chất xơ, vitamin và khoáng chất thiết yếu cho cơ thể.</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                  </div>
                  <button className="btn-toggle-desc" onClick={() => setIsExpanded(!isExpanded)}>
                      {isExpanded ? 'Thu gọn ▲' : 'Xem thêm ▼'}
                  </button>
              </div>

              <div className="pd-sidebar">
                  <div className="sidebar-header">THÔNG TIN CHI TIẾT</div>
                  <table className="specs-table">
                      <tbody>
                          <tr><td>Trọng lượng</td><td>{selectedType}</td></tr>
                          <tr><td>Xuất xứ</td><td>Việt Nam</td></tr>
                          <tr><td>Bảo quản</td><td>Tủ lạnh</td></tr>
                      </tbody>
                  </table>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="pd-reviews-section">
              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="review-user-info">
                        <div className="review-avatar">{review.user.charAt(0)}</div>
                        <div>
                          <span className="review-user">{review.user}</span>
                          <span className="review-date">{review.date}</span>
                        </div>
                      </div>
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={`star-icon ${i < review.rating ? 'filled' : ''}`} />
                        ))}
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>

              <div className="review-form-container">
                <h3>Viết đánh giá của bạn</h3>
                <form onSubmit={handleReviewSubmit} className="review-form">
                  <div className="form-group">
                    <label>Đánh giá:</label>
                    <div className="rating-select">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FiStar 
                          key={star} 
                          className={`star-icon ${star <= newReview.rating ? 'filled' : ''} interactive`}
                          onClick={() => setNewReview({...newReview, rating: star})}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Nhận xét:</label>
                    <textarea 
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                      rows="4"
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn-submit-review">Gửi đánh giá</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- PHẦN 3: SẢN PHẨM TƯƠNG TỰ (MỚI THÊM) --- */}
      {relatedProducts.length > 0 && (
        <div className="related-section">
            <h2 className="related-title">SẢN PHẨM TƯƠNG TỰ</h2>
            <div className="products-grid">
                {relatedProducts.map(item => (
                    <div key={item.id} className="modern-product-card">
                      <div className="card-badges">
                        <span className="badge-discount">-15%</span>
                      </div>
                      
                      <Link to={`/product/${item.id}`} className="card-img-link">
                        <img src={item.image} alt={item.name} />
                      </Link>
                      
                      <div className="card-body">
                        <div className="card-category">{item.category}</div>
                        <div className="card-rating">
                          <FiStar className="star-icon filled" />
                          <FiStar className="star-icon filled" />
                          <FiStar className="star-icon filled" />
                          <FiStar className="star-icon filled" />
                          <FiStar className="star-icon filled" />
                          <span>(4.5)</span>
                        </div>
                        
                        <Link to={`/product/${item.id}`} className="card-title">
                          {item.name}
                        </Link>
                        
                        <div className="card-price-row">
                          <div className="price-info">
                            <span className="current-price">{item.price.toLocaleString()}đ</span>
                            <span className="old-price">{(item.price * 1.15).toLocaleString()}đ</span>
                          </div>
                          <button 
                            className="btn-add-cart-icon"
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(item);
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
      )}

      {/* --- IMAGE ZOOM MODAL --- */}
      {isZoomed && (
        <div className="image-zoom-modal" onClick={() => setIsZoomed(false)}>
          <button className="close-modal-btn" onClick={() => setIsZoomed(false)}>
            <FaTimes />
          </button>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={productImages[currentImageIndex]} alt={product.name} className="zoomed-image" />
            <button className="modal-nav-btn prev-btn" onClick={handlePrevImage}>
              <FaChevronLeft />
            </button>
            <button className="modal-nav-btn next-btn" onClick={handleNextImage}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetail;
