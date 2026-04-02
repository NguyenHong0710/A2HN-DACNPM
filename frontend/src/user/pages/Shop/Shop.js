import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiShoppingBag, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../../store/CartContext';
import './Shop.css';

// 1. CẤU HÌNH ĐƯỜNG DẪN API
const BASE_URL = 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api`;

const Shop = () => {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  
  // States dữ liệu
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // States giao diện
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [quantities, setQuantities] = useState({});

  const searchQuery = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category'); // Lấy category từ URL (?category=...)

  // ==========================================
  // PHẦN THÊM VÀO: ĐỒNG BỘ URL VỚI SIDEBAR
  // ==========================================
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory("All");
    }
  }, [categoryFromUrl]); 
  // Chạy lại mỗi khi tham số category trên URL thay đổi
  // ==========================================

  // 2. GỌI API LẤY SẢN PHẨM VÀ DANH MỤC
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productEndpoint = searchQuery 
          ? `${API_URL}/products/search?query=${encodeURIComponent(searchQuery)}`
          : `${API_URL}/products`;

        const [prodRes, catRes] = await Promise.all([
          fetch(productEndpoint),
          fetch(`${API_URL}/categories`)
        ]);

        if (!prodRes.ok || !catRes.ok) {
          throw new Error("Lỗi khi kết nối với máy chủ Backend");
        }

        const prodResult = await prodRes.json();
        const catResult = await catRes.json();

        const finalProducts = Array.isArray(prodResult) ? prodResult : (prodResult.data || []);
        setProducts(finalProducts);

        const finalCategories = Array.isArray(catResult) ? catResult : (catResult.data || []);
        setCategories(finalCategories.filter(c => c.status === 1 || c.status === true));

        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError("Không thể tải dữ liệu. Vui lòng kiểm tra lại Backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  // 3. ĐỊNH DẠNG SẢN PHẨM (Xử lý ảnh và giá)
  const formatProduct = (product) => {
    const getImgUrl = (img) => {
      if (!img) return 'https://via.placeholder.com/300x300?text=Lumina+Jewelry';
      if (img.startsWith('http')) return img;
      return `${BASE_URL}/storage/${img}`;
    };

    return {
      ...product,
      displayImage: getImgUrl(product.image),
      displayPrice: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
      displayCategory: product.category?.name || product.category_name || product.category || 'Trang sức'
    };
  };

  const formattedProducts = products.map(formatProduct);

  // 4. LOGIC LỌC VÀ SẮP XẾP
  let filteredProducts = selectedCategory === "All" 
    ? [...formattedProducts] 
    : formattedProducts.filter(p => p.displayCategory === selectedCategory);

  if (sortOrder === "price-asc") filteredProducts.sort((a, b) => a.displayPrice - b.displayPrice);
  if (sortOrder === "price-desc") filteredProducts.sort((a, b) => b.displayPrice - a.displayPrice);

  // 5. QUẢN LÝ SỐ LƯỢNG KHI THÊM VÀO GIỎ
  const getProductQty = (id) => quantities[id] || 1;
  const setProductQty = (id, val) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, parseInt(val) || 1) }));
  };

  return (
    <div className="shop-container" style={{ minHeight: '80vh' }}>
      <div className="shop-banner" style={{ backgroundColor: '#111', color: '#c5a059', textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: '10px', textTransform: 'uppercase' }}>Bộ Sưu Tập Trang Sức</h1>
        {searchQuery && <p style={{ color: '#fff', letterSpacing: '1px' }}>Kết quả tìm kiếm cho: "{searchQuery}"</p>}
      </div>

      <div className="shop-content" style={{ display: 'flex', padding: '40px 5%', gap: '40px' }}>
        
        <aside className="sidebar" style={{ width: '280px' }}>
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '4px' }}>
            <h3 
              onClick={() => setIsCategoryOpen(!isCategoryOpen)} 
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              Phân loại {isCategoryOpen ? <FiChevronUp /> : <FiChevronDown />}
            </h3>
            {isCategoryOpen && (
              <ul style={{ listStyle: 'none', padding: '15px 0 0 0', margin: 0 }}>
                <li 
                  onClick={() => setSelectedCategory("All")}
                  style={{ 
                    padding: '12px 0', cursor: 'pointer', transition: '0.3s',
                    color: selectedCategory === "All" ? '#c5a059' : '#666', 
                    fontWeight: selectedCategory === "All" ? '600' : '400',
                    borderBottom: '1px solid #f5f5f5'
                  }}
                >
                  Tất cả
                </li>
                {categories.map(cat => (
                  <li 
                    key={cat.id} 
                    onClick={() => setSelectedCategory(cat.name)}
                    style={{ 
                      padding: '12px 0', cursor: 'pointer', transition: '0.3s',
                      color: selectedCategory === cat.name ? '#c5a059' : '#666', 
                      fontWeight: selectedCategory === cat.name ? '600' : '400',
                      borderBottom: '1px solid #f5f5f5'
                    }}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <p style={{ color: '#888' }}>Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm</p>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)} 
              style={{ padding: '10px 15px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '1.2rem', color: '#888' }}>
              Đang tìm kiếm những tuyệt tác...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#d9534f' }}>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 25px', cursor: 'pointer', background: '#111', color: '#fff', border: 'none' }}>Thử lại</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#888', border: '1px dashed #ddd' }}>
              Không tìm thấy sản phẩm nào phù hợp với lựa chọn của bạn.
            </div>
          ) : (
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '40px 30px' }}>
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card" style={{ transition: '0.3s' }}>
                  <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
                    <Link to={`/product/${product.id}`}>
                      <img 
                        src={product.displayImage} 
                        alt={product.name} 
                        style={{ width: '100%', height: '300px', objectFit: 'cover', transition: '0.8s transform' }} 
                        className="product-img"
                      />
                    </Link>
                  </div>
                  <div style={{ marginTop: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#c5a059', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>{product.displayCategory}</span>
                    <h4 style={{ margin: '8px 0', fontSize: '1.1rem', fontWeight: '500', color: '#111' }}>{product.name}</h4>
                    <p style={{ fontWeight: '600', color: '#111', marginBottom: '15px', fontSize: '1.1rem' }}>{product.displayPrice.toLocaleString()}đ</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #eee', borderRadius: '2px' }}>
                        <button onClick={() => setProductQty(product.id, getProductQty(product.id) - 1)} style={{ border: 'none', background: 'none', padding: '10px', cursor: 'pointer' }}><FiMinus size={12}/></button>
                        <input value={getProductQty(product.id)} readOnly style={{ width: '35px', textAlign: 'center', border: 'none', fontSize: '0.9rem', backgroundColor: 'transparent' }} />
                        <button onClick={() => setProductQty(product.id, getProductQty(product.id) + 1)} style={{ border: 'none', background: 'none', padding: '10px', cursor: 'pointer' }}><FiPlus size={12}/></button>
                      </div>
                      <button 
                        onClick={() => addToCart(product, getProductQty(product.id))}
                        className="add-to-cart-btn"
                        style={{ 
                          flex: 1, backgroundColor: '#111', color: '#c5a059', border: 'none', 
                          padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                          justifyContent: 'center', gap: '10px', fontWeight: '600', fontSize: '0.85rem',
                          textTransform: 'uppercase', borderRadius: '2px'
                        }}
                      >
                        <FiShoppingBag /> Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;