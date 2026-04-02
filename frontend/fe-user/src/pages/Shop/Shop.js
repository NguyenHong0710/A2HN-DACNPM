import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiStar, FiShoppingBag } from 'react-icons/fi';
import { products } from '../../data'; 
import { useCart } from '../../store/CartContext';
import './Shop.css';

const Shop = () => {
  const { addToCart } = useCart();
  const [category, setCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);

  // --- CẤU HÌNH DANH MỤC ---
  const categories = [
    { id: 'All', name: 'Tất cả' },
    { id: 'Rau', name: 'Rau xanh' },
    { id: 'Củ',  name: 'Củ quả' },
    { id: 'Quả', name: 'Trái cây' }
  ];

  // Logic lọc sản phẩm
  let filteredProducts = category === "All" 
    ? [...products] 
    : products.filter(p => p.category === category);

  // Logic sắp xếp sản phẩm
  if (sortOrder === "price-asc") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-desc") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  // Lấy tên hiển thị hiện tại để hiện lên tiêu đề
  const currentCategoryName = categories.find(c => c.id === category)?.name;

  return (
    <div className="shop-container">
      {/* Banner phụ */}
      <div className="shop-banner">
        <h1>Cửa Hàng Nông Sản</h1>
        <p>Trang chủ / Cửa hàng</p>
      </div>

      <div className="shop-content">
        {/* --- SIDEBAR (MENU TRÁI) --- */}
        <div className="sidebar">
          <h3 
            className="sidebar-title" 
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
          >
            Danh mục
            <span className="toggle-icon">
              {isCategoryOpen ? <FiChevronUp /> : <FiChevronDown />}
            </span>
          </h3>
          
          <div className={`category-list-wrapper ${isCategoryOpen ? 'open' : ''}`}>
            <ul className="category-list">
              {categories.map((cat) => (
                <li 
                  key={cat.id}
                  className={category === cat.id ? "active" : ""} 
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --- DANH SÁCH SẢN PHẨM --- */}
        <div className="product-list-container">
            <div className="list-header">
              <h2 className="cat-title">{currentCategoryName}</h2>
              <div className="sort-container">
                <label htmlFor="sort">Sắp xếp theo: </label>
                <select 
                  id="sort" 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="sort-select"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến cao</option>
                  <option value="price-desc">Giá: Cao đến thấp</option>
                </select>
              </div>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="modern-product-card">
                      <div className="card-badges">
                        <span className="badge-discount">-15%</span>
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
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: '#666', background: '#f9f9f9', borderRadius: '12px'}}>
                <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty" style={{width: '100px', opacity: 0.5, marginBottom: '20px'}} />
                <p style={{fontSize: '18px', marginBottom: '15px'}}>Không tìm thấy sản phẩm nào trong danh mục này.</p>
                <button 
                  onClick={() => setCategory("All")} 
                  style={{
                    background: '#2e7d32', color: 'white', border: 'none', 
                    padding: '10px 20px', borderRadius: '25px', cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                    Xem tất cả sản phẩm
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
