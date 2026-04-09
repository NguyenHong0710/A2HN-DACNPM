import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiShoppingBag, FiMinus, FiPlus, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCart } from '../../store/CartContext';
import './Shop.css';

const BASE_URL = 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api`;

const Shop = () => {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [quantities, setQuantities] = useState({});

  const abortControllerRef = useRef(null);

  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, total: 0, per_page: 15
  });

  // --- STATE BỘ LỌC ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Giá trị tạm thời (để kéo mượt mà trên UI)
  const [tempPrice, setTempPrice] = useState({ min: 0, max: 5000000 });
  const [tempFilterType, setTempFilterType] = useState("all");
  
  // Giá trị thực tế (chỉ dùng để gọi API khi nhấn XÁC NHẬN)
  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: 0,
    maxPrice: 5000000,
    filterType: "all"
  });

  const searchQuery = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`);
        const catResult = await res.json();
        const finalCategories = Array.isArray(catResult) ? catResult : (catResult.data || []);
        setCategories(finalCategories.filter(c => c.status === 1 || c.status === true));
      } catch (err) { console.error("Lỗi tải danh mục:", err); }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl || "All");
  }, [categoryFromUrl]);

  // FETCH DATA: Chỉ phụ thuộc vào appliedFilters
  const fetchData = useCallback(async (page = 1) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        category: selectedCategory,
        sort_order: sortOrder,
        sort_by: appliedFilters.filterType,
        min_price: appliedFilters.minPrice,
        max_price: appliedFilters.maxPrice
      });

      const endpoint = searchQuery 
        ? `${API_URL}/products/search?q=${encodeURIComponent(searchQuery)}&${params.toString()}`
        : `${API_URL}/products?${params.toString()}`;

      const prodRes = await fetch(endpoint, { signal: abortControllerRef.current.signal });
      if (!prodRes.ok) throw new Error("Lỗi kết nối Server");
      
      const prodResult = await prodRes.json();
      setProducts(prodResult.data || []);
      if (prodResult.pagination) setPagination(prodResult.pagination);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') setError("Không thể tải dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, appliedFilters, sortOrder]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // HÀM XÁC NHẬN: Chốt giá trị từ temp sang applied
  const handleConfirmFilter = () => {
    setAppliedFilters({
      minPrice: tempPrice.min,
      maxPrice: tempPrice.max,
      filterType: tempFilterType
    });
    setIsFilterOpen(false);
  };

  const getProductImg = (product) => {
    const imgData = product.image || product.images;
    if (!imgData) return 'https://via.placeholder.com/300x300';
    try {
      const parsed = typeof imgData === 'string' ? JSON.parse(imgData) : imgData;
      const firstImg = Array.isArray(parsed) ? parsed[0] : parsed;
      return firstImg?.startsWith('http') ? firstImg : `${BASE_URL}/storage/${firstImg}`;
    } catch {
      return imgData.startsWith('http') ? imgData : `${BASE_URL}/storage/${imgData}`;
    }
  };

  const getProductQty = (id) => quantities[id] || 1;
  const setProductQty = (id, val) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, parseInt(val) || 1) }));
  };

  return (
    <div className="shop-container" style={{ minHeight: '80vh' }}>
      <div className="shop-banner" style={{ backgroundColor: '#111', color: '#c5a059', textAlign: 'center', padding: '60px 20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: '10px', textTransform: 'uppercase' }}>Bộ Sưu Tập Trang Sức</h1>
        {searchQuery && <p style={{ color: '#fff' }}>Kết quả tìm kiếm cho: "{searchQuery}"</p>}
      </div>

      <div className="shop-content" style={{ display: 'flex', padding: '40px 5%', gap: '40px' }}>
        <aside className="sidebar" style={{ width: '280px' }}>
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '4px', position: 'sticky', top: '20px' }}>
            <h3 onClick={() => setIsCategoryOpen(!isCategoryOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', textTransform: 'uppercase' }}>
              Phân loại {isCategoryOpen ? <FiChevronUp /> : <FiChevronDown />}
            </h3>
            {isCategoryOpen && (
              <ul style={{ listStyle: 'none', padding: '15px 0 0 0', margin: 0 }}>
                <li onClick={() => setSelectedCategory("All")} style={{ padding: '12px 0', cursor: 'pointer', color: selectedCategory === "All" ? '#c5a059' : '#666', fontWeight: selectedCategory === "All" ? '600' : '400', borderBottom: '1px solid #f5f5f5' }}>Tất cả</li>
                {categories.map(cat => (
                  <li key={cat.id} onClick={() => setSelectedCategory(cat.name)} style={{ padding: '12px 0', cursor: 'pointer', color: selectedCategory === cat.name ? '#c5a059' : '#666', fontWeight: selectedCategory === cat.name ? '600' : '400', borderBottom: '1px solid #f5f5f5' }}>{cat.name}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <p style={{ color: '#888' }}>
              Hiển thị <strong>{products.length}</strong>/{pagination.total} sản phẩm
            </p>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', border: '1px solid #ddd', background: isFilterOpen ? '#111' : '#fff', color: isFilterOpen ? '#c5a059' : '#111', cursor: 'pointer', borderRadius: '4px' }}><FiFilter /> Bộ lọc</button>
                
                {isFilterOpen && (
                    <div className="filter-popover" style={{ position: 'absolute', top: '110%', right: 0, width: '300px', background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, padding: '20px', borderRadius: '4px', border: '1px solid #eee' }}>
                        <h4 style={{ fontSize: '0.85rem', marginBottom: '15px', textTransform: 'uppercase' }}>
                          Khoảng giá: <span style={{color: '#c5a059'}}>{tempPrice.min.toLocaleString()}đ - {tempPrice.max.toLocaleString()}đ</span>
                        </h4>
                        
                        {/* DUAL RANGE SLIDER */}
                        <div className="range-slider-wrapper">
                          <input 
                            type="range" min="0" max="5000000" step="100000" 
                            value={tempPrice.min} 
                            onChange={(e) => {
                              const val = Math.min(Number(e.target.value), tempPrice.max - 200000);
                              setTempPrice(prev => ({ ...prev, min: val }));
                            }} 
                            className="range-input min-range"
                          />
                          <input 
                            type="range" min="0" max="5000000" step="100000" 
                            value={tempPrice.max} 
                            onChange={(e) => {
                              const val = Math.max(Number(e.target.value), tempPrice.min + 200000);
                              setTempPrice(prev => ({ ...prev, max: val }));
                            }} 
                            className="range-input max-range"
                          />
                          <div className="range-track"></div>
                        </div>
                        
                        <div style={{ marginTop: '25px' }}>
                            {['all', 'newest', 'best-seller'].map(type => (
                              <label key={type} style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', cursor: 'pointer' }}>
                                <input 
                                  type="radio" name="filterType"
                                  checked={tempFilterType === type} 
                                  onChange={() => setTempFilterType(type)} 
                                  style={{marginRight: '8px'}}
                                /> 
                                {type === 'all' ? 'Mặc định' : type === 'newest' ? 'Mới nhất' : 'Bán chạy'}
                              </label>
                            ))}
                        </div>

                        <button onClick={handleConfirmFilter} style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#111', color: '#c5a059', border: 'none', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>XÁC NHẬN</button>
                    </div>
                )}
              </div>

              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '10px 15px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                  <option value="default">Sắp xếp: Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến cao</option>
                  <option value="price-desc">Giá: Cao đến thấp</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải...</div>
          ) : (
            <>
              <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '40px 30px' }}>
                {products.length > 0 ? products.map(product => (
                  <div key={product.id} className="product-card">
                    <Link to={`/product/${product.id}`}>
                      <img src={getProductImg(product)} alt={product.name} style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
                    </Link>
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                      <h4 style={{ margin: '8px 0', fontSize: '1rem' }}>{product.name}</h4>
                      <p style={{ fontWeight: 'bold', color: '#c5a059' }}>{Number(product.price).toLocaleString()}đ</p>
                      <button onClick={() => addToCart(product, getProductQty(product.id))} style={{ width: '100%', padding: '10px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FiShoppingBag /> MUA NGAY
                      </button>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#888' }}>Không tìm thấy sản phẩm nào phù hợp.</div>
                )}
              </div>

              {pagination.last_page > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', gap: '10px' }}>
                  <button disabled={pagination.current_page === 1} onClick={() => fetchData(pagination.current_page - 1)} style={{ padding: '10px', border: '1px solid #ddd', background: '#fff' }}><FiChevronLeft /></button>
                  {[...Array(pagination.last_page)].map((_, i) => (
                    <button key={i+1} onClick={() => fetchData(i+1)} style={{ width: '40px', height: '40px', background: pagination.current_page === i+1 ? '#111' : '#fff', color: pagination.current_page === i+1 ? '#c5a059' : '#111', border: '1px solid #ddd' }}>{i+1}</button>
                  ))}
                  <button disabled={pagination.current_page === pagination.last_page} onClick={() => fetchData(pagination.current_page + 1)} style={{ padding: '10px', border: '1px solid #ddd', background: '#fff' }}><FiChevronRight /></button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;