import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from "../../store/CartContext";
import { FaStar, FaShieldAlt, FaTruck, FaSearchPlus, FaChevronLeft, FaChevronRight, FaCheckCircle, FaUndoAlt } from 'react-icons/fa';
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
  const [isZoomed, setIsZoomed] = useState(false);
  
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [isPurchased, setIsPurchased] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contentRef = useRef(null);
  const token = localStorage.getItem('token');

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

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}/reviews`);
      const result = await res.json();
      setReviews(result.reviews || []);
      setAvgRating(result.average_rating || 0);
    } catch (err) { console.error("Lỗi lấy đánh giá:", err); }
  };

  const checkPurchaseStatus = async (currentProduct) => {
    if (!token || !currentProduct) {
        setIsPurchased(false);
        return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/my-invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const invoices = data.data || data;
      const purchased = Array.isArray(invoices) && invoices.some(inv => {
        const status = (inv.deliveryStatus || inv.vanchuyen || "").trim();
        return status === 'Đã giao' && 
          inv.chi_tiet_hoadons?.some(item => 
            String(item.name).trim() === String(currentProduct.name).trim()
          );
      });
      setIsPurchased(purchased);
    } catch (err) { 
      setIsPurchased(false);
    }
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
            .filter(p => String(p.category || "").trim().toLowerCase() === mainCat && String(p.id) !== String(id))
            .slice(0, 4);
          setRelatedProducts(related);
        }
        fetchReviews();
        checkPurchaseStatus(mainProduct);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchProductData();
    window.scrollTo(0, 0); 
  }, [id]);

  useEffect(() => {
    if (product && contentRef.current) {
        setShowReadMoreBtn(contentRef.current.scrollHeight > 150);
    }
  }, [product, loading]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!userComment.trim() || userComment.trim().length < 5) return alert("Nội dung đánh giá quá ngắn!");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ product_id: id, rating: userRating, comment: userComment })
      });
      if (res.ok) {
        alert("Cảm ơn bạn đã đánh giá!");
        setUserComment("");
        fetchReviews();
      }
    } catch (err) { alert("Lỗi kết nối"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="lumina-loading-screen">Đang chuẩn bị tuyệt tác...</div>;
  if (!product) return <div className="not-found">Sản phẩm không tồn tại.</div>;

  const productImages = (() => {
    const rawData = product.images || product.image;
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    try { if (typeof rawData === 'string' && rawData.startsWith('[')) return JSON.parse(rawData); } catch (e) {}
    return [rawData];
  })();

  return (
    <div className="lumina-pd-wrapper">
      <div className="pd-main-content">
        {/* Gallery */}
        <div className="pd-gallery">
          <div className="pd-main-img" onClick={() => setIsZoomed(true)}>
            <img src={getImageUrl(productImages[currentImageIndex])} alt={product.name} />
            <div className="pd-zoom-icon"><FaSearchPlus /> Click để phóng to</div>
            {productImages.length > 1 && (
              <>
                <button className="pd-nav-btn prev" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(currentImageIndex === 0 ? productImages.length -1 : currentImageIndex -1)}}><FaChevronLeft /></button>
                <button className="pd-nav-btn next" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(currentImageIndex === productImages.length -1 ? 0 : currentImageIndex +1)}}><FaChevronRight /></button>
              </>
            )}
          </div>
          <div className="pd-thumbnails">
            {productImages.map((img, i) => (
              <div key={i} className={`pd-thumb-item ${currentImageIndex === i ? 'active' : ''}`} onClick={() => setCurrentImageIndex(i)}>
                <img src={getImageUrl(img)} alt="thumb" />
              </div>
            ))}
          </div>
        </div>

        {/* Essentials Info */}
        <div className="pd-essentials">
          <nav className="pd-breadcrumb">
            <Link to="/">Trang chủ</Link> / <Link to="/shop">{product.category}</Link>
          </nav>
          
          <h1 className="pd-title">{product.name}</h1>
          
          <div className="pd-rating-box">
            <div className="pd-stars">
              {[...Array(5)].map((_, i) => <FaStar key={i} className={i < Math.round(avgRating) ? 'active' : ''} />)}
            </div>
            <span className="pd-rating-text">({avgRating}/5 - {reviews.length} đánh giá)</span>
          </div>

          <div className="pd-price">{Number(product.price).toLocaleString()} ₫</div>

          <div className="pd-actions">
            <div className="pd-quantity">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="pd-add-btn" onClick={() => addToCart({...product, image: productImages[0]}, quantity)}>
              <FiShoppingBag /> THÊM VÀO GIỎ HÀNG
            </button>
          </div>

          <div className="pd-trust-badges">
            <div className="badge"><FaShieldAlt /> Bảo hành vĩnh viễn</div>
            <div className="badge"><FaTruck /> Miễn phí giao hàng</div>
            <div className="badge"><FaUndoAlt /> Đổi trả 7 ngày</div>
          </div>
        </div>
      </div>

      {/* Tabs & Reviews Section */}
      <div className="pd-bottom-details">
        <div className="pd-tabs-header">
          <div className="tab-title">THÔNG TIN CHI TIẾT</div>
        </div>
        
        <div className="pd-description">
          <div ref={contentRef} className={`pd-desc-text ${isExpanded ? 'expanded' : ''}`}>
             {product.description || "Nội dung đang được cập nhật..."}
          </div>
          {showReadMoreBtn && (
            <button className="pd-expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'THU GỌN' : 'XEM THÊM NỘI DUNG'}
            </button>
          )}
        </div>

        {/* Review Section */}
        <div className="pd-reviews-section">
          <h2 className="pd-section-heading">KHÁCH HÀNG NÓI GÌ VỀ LUMINA</h2>
          
          <div className="pd-reviews-container">
            {isPurchased && (
              <div className="pd-review-form">
                <h3>Đánh giá của bạn</h3>
                <div className="pd-star-input">
                  {[1,2,3,4,5].map(n => (
                    <FaStar key={n} className={n <= userRating ? 'active' : ''} onClick={() => setUserRating(n)} />
                  ))}
                </div>
                <textarea 
                  placeholder="Cảm nhận của bạn về sản phẩm..." 
                  value={userComment} 
                  onChange={e => setUserComment(e.target.value)} 
                />
                <button onClick={handleSubmitReview} disabled={submitting}>
                  {submitting ? 'ĐANG GỬI...' : 'GỬI ĐÁNH GIÁ'}
                </button>
              </div>
            )}

            <div className="pd-reviews-list">
              {reviews.length > 0 ? reviews.map(rev => (
                <div key={rev.id} className="pd-review-card">
                  <div className="pd-rev-header">
                    <span className="pd-rev-user">{rev.user?.name} <FaCheckCircle className="pd-v-icon" /></span>
                    <span className="pd-rev-date">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="pd-rev-stars">
                    {[...Array(5)].map((_, i) => <FaStar key={i} className={i < rev.rating ? 'active' : ''} />)}
                  </div>
                  <p className="pd-rev-comment">{rev.comment}</p>
                  {rev.reply && (
                    <div className="pd-admin-reply">
                      <strong>Lumina Jewelry:</strong> {rev.reply}
                    </div>
                  )}
                </div>
              )) : (
                <div className="pd-no-reviews">Chưa có đánh giá nào cho sản phẩm này.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Section */}
      {relatedProducts.length > 0 && (
        <div className="pd-related">
          <h2 className="pd-section-heading">CÓ THỂ BẠN CŨNG YÊU THÍCH</h2>
          <div className="pd-related-grid">
            {relatedProducts.map(item => (
              <Link to={`/product/${item.id}`} key={item.id} className="pd-related-card">
                <div className="card-img">
                  <img src={getImageUrl(item.images || item.image)} alt={item.name} />
                </div>
                <div className="card-info">
                  <div className="card-cat">{item.category}</div>
                  <div className="card-name">{item.name}</div>
                  <div className="card-price">{Number(item.price).toLocaleString()}đ</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div className="pd-zoom-overlay" onClick={() => setIsZoomed(false)}>
          <div className="pd-zoom-inner">
            <img src={getImageUrl(productImages[currentImageIndex])} alt="Zoom" />
            <button className="pd-close-zoom">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;