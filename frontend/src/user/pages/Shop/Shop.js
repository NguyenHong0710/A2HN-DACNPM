import React, { useState, useEffect, useCallback } from 'react';
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [quantities, setQuantities] = useState({});

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(5000000); 
  const [filterType, setFilterType] = useState("all");

  const searchQuery = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category');

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory("All");
    }
  }, [categoryFromUrl]); 

  // --- HÀM FETCH DATA TỐI ƯU ---
  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);

      // Đưa category vào params để Backend lọc toàn bộ DB
      if (selectedCategory !== "All") {
        params.append('category', selectedCategory);
      }

      // Đưa sortOrder vào params (để Backend sort thay vì sort thủ công ở React)
      if (sortOrder !== "default") {
        params.append('sort_order', sortOrder);
      }

      let productEndpoint = "";
      if (searchQuery) {
        productEndpoint = `${API_URL}/products/search?q=${encodeURIComponent(searchQuery)}&${params.toString()}`;
      } else {
        if (filterType === 'price') {
          params.append('sort_by', 'price');
          params.append('max_price', maxPrice.toString());
        } else {
          params.append('sort_by', filterType); 
        }
        productEndpoint = `${API_URL}/products?${params.toString()}`;
      }

      const [prodRes, catRes] = await Promise.all([
        fetch(productEndpoint),
        fetch(`${API_URL}/categories`)
      ]);

      if (!prodRes.ok) throw new Error("Lỗi kết nối Server");
      
      const prodResult = await prodRes.json();
      const catResult = await catRes.json();

      setProducts(prodResult.data || []);
      if (prodResult.pagination) setPagination(prodResult.pagination);

      const finalCategories = Array.isArray(catResult) ? catResult : (catResult.data || []);
      setCategories(finalCategories.filter(c => c.status === 1 || c.status === true));

      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError("Không thể tải dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, filterType, maxPrice, sortOrder]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // --- FORMAT DATA ---
  const formatProduct = (product) => {
    const getImgUrl = (imgData) => {
      if (!imgData) return 'https://via.placeholder.com/300x300?text=Lumina+Jewelry';
      try {
        const parsed = typeof imgData === 'string' ? JSON.parse(imgData) : imgData;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstImg = parsed[0];
          return firstImg.startsWith('http') ? firstImg : `${BASE_URL}/storage/${firstImg}`;
        }
      } catch (e) {}
      if (typeof imgData === 'string') {
        if (imgData.startsWith('http')) return imgData;
        return `${BASE_URL}/storage/${imgData.replace(/^storage\//, '')}`;
      }
      return 'https://via.placeholder.com/300x300?text=Lumina+Jewelry';
    };

    return {
      ...product,
      displayImage: getImgUrl(product.image || product.images), 
      displayPrice: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
      displayCategory: product.category?.name || product.category || 'Chưa phân loại',
    };
  };

  // Dữ liệu hiển thị lấy trực tiếp từ Backend (đã lọc chuẩn)
  const displayProducts = products.map(formatProduct);

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
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '4px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', position: 'relative' }}>
            <p style={{ color: '#888' }}>
                Đang hiển thị <strong>{displayProducts.length}</strong> sản phẩm (Tổng <strong>{pagination.total}</strong>)
            </p>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', border: '1px solid #ddd', background: isFilterOpen ? '#111' : '#fff', color: isFilterOpen ? '#c5a059' : '#111', cursor: 'pointer', borderRadius: '4px' }}><FiFilter /> Bộ lọc</button>
                {isFilterOpen && (
                    <div style={{ position: 'absolute', top: '110%', right: 0, width: '250px', background: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, padding: '20px', borderRadius: '4px', border: '1px solid #eee' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase' }}>Khoảng giá (Max 5tr)</h4>
                        <input type="range" min="0" max="5000000" step="100000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ width: '100%', accentColor: '#c5a059' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}><span>0đ</span><span>{Number(maxPrice).toLocaleString()}đ</span></div>
                        <div style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}><input type="radio" checked={filterType === 'all'} onChange={() => setFilterType('all')} /> Mặc định</label>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}><input type="radio" checked={filterType === 'newest'} onChange={() => setFilterType('newest')} /> Mới nhất</label>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}><input type="radio" checked={filterType === 'best-seller'} onChange={() => setFilterType('best-seller')} /> Bán chạy</label>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}><input type="radio" checked={filterType === 'price'} onChange={() => setFilterType('price')} /> Lọc giá</label>
                        </div>
                        <button onClick={() => setIsFilterOpen(false)} style={{ width: '100%', marginTop: '15px', padding: '8px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer' }}>XÁC NHẬN</button>
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
            <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '1.2rem', color: '#888' }}>Đang tải...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#d9534f' }}><p>{error}</p></div>
          ) : displayProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#888', border: '1px dashed #ddd' }}>Không tìm thấy sản phẩm trong mục này.</div>
          ) : (
            <>
              <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '40px 30px' }}>
                {displayProducts.map(product => (
                  <div key={product.id} className="product-card">
                    <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
                        <Link to={`/product/${product.id}`}><img src={product.displayImage} alt={product.name} style={{ width: '100%', height: '300px', objectFit: 'cover' }} className="product-img" /></Link>
                    </div>
                    <div style={{ marginTop: '18px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#c5a059', textTransform: 'uppercase', fontWeight: 'bold' }}>{product.displayCategory}</span>
                        <h4 style={{ margin: '8px 0', fontSize: '1.1rem', fontWeight: '500' }}>{product.name}</h4>
                        <p style={{ fontWeight: '600', marginBottom: '15px' }}>{product.displayPrice.toLocaleString()}đ</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #eee' }}>
                                <button onClick={() => setProductQty(product.id, getProductQty(product.id) - 1)} style={{ border: 'none', background: 'none', padding: '10px', cursor: 'pointer' }}><FiMinus size={12}/></button>
                                <input value={getProductQty(product.id)} readOnly style={{ width: '30px', textAlign: 'center', border: 'none' }} />
                                <button onClick={() => setProductQty(product.id, getProductQty(product.id) + 1)} style={{ border: 'none', background: 'none', padding: '10px', cursor: 'pointer' }}><FiPlus size={12}/></button>
                            </div>
                            <button onClick={() => addToCart(product, getProductQty(product.id))} style={{ flex: 1, backgroundColor: '#111', color: '#c5a059', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}><FiShoppingBag /> MUA</button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.last_page > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '50px', gap: '10px' }}>
                  <button disabled={pagination.current_page === 1} onClick={() => fetchData(pagination.current_page - 1)} style={{ padding: '10px', border: '1px solid #ddd', background: '#fff', cursor: pagination.current_page === 1 ? 'not-allowed' : 'pointer' }}><FiChevronLeft /></button>
                  {[...Array(pagination.last_page).keys()].map((num) => (
                    <button key={num + 1} onClick={() => fetchData(num + 1)} style={{ width: '40px', height: '40px', border: '1px solid #ddd', background: pagination.current_page === num + 1 ? '#111' : '#fff', color: pagination.current_page === num + 1 ? '#c5a059' : '#111', cursor: 'pointer', fontWeight: 'bold' }}>{num + 1}</button>
                  ))}
                  <button disabled={pagination.current_page === pagination.last_page} onClick={() => fetchData(pagination.current_page + 1)} style={{ padding: '10px', border: '1px solid #ddd', background: '#fff', cursor: pagination.current_page === pagination.last_page ? 'not-allowed' : 'pointer' }}><FiChevronRight /></button>
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