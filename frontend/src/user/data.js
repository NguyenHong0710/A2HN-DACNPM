// src/data.js

export const products = [
  // --- RAU (Vegetables) ---
  { 
    id: 1, 
    name: "Cà chua Đà Lạt", 
    category: "Rau", 
    price: 25000, 
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80", 
    images: [
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=400&q=80"
    ],
    desc: "Cà chua tươi ngon, giàu vitamin A, C. Trồng theo tiêu chuẩn VietGAP.",
    isFeatured: true,      // Sản phẩm Nổi bật
    isBestSeller: false
  },
  { 
    id: 2, 
    name: "Bắp cải xanh", 
    category: "Rau", 
    price: 15000, 
    image: "https://images.unsplash.com/photo-1668548205329-2f6435d4c349?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
    images: [
      "https://images.unsplash.com/photo-1668548205329-2f6435d4c349?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=400&q=80"
    ],
    desc: "Bắp cải giòn ngọt, thích hợp làm salad hoặc xào.",
    isFeatured: false,
    isBestSeller: true     // Sản phẩm Bán chạy
  },
  { 
    id: 5, 
    name: "Súp lơ xanh", 
    category: "Rau", 
    price: 35000, 
    image: "https://images.unsplash.com/photo-1583663848850-46af132dc08e?auto=format&fit=crop&w=400&q=80", 
    images: [
      "https://images.unsplash.com/photo-1583663848850-46af132dc08e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1512621820108-64d4b53ea36f?auto=format&fit=crop&w=400&q=80"
    ],
    desc: "Bông cải xanh tươi, rất tốt cho sức khỏe tim mạch.",
    isFeatured: false,
    isBestSeller: true
  },
  
  // --- CỦ (Tubers/Roots) ---
  { 
    id: 4, 
    name: "Khoai tây vàng", 
    category: "Củ", 
    price: 30000, 
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80", 
    images: [
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1508313880080-c4bef0730395?auto=format&fit=crop&w=400&q=80"
    ],
    desc: "Khoai tây dẻo, bùi, chuyên dùng nấu canh hoặc chiên.",
    isFeatured: true,
    isBestSeller: false
  },
  { 
    id: 6, 
    name: "Cà rốt tươi", 
    category: "Củ", 
    price: 20000, 
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80", 
    images: [
      "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1445282768818-728615cc910a?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=400&q=80"
    ],
    desc: "Cà rốt Đà Lạt ngọt tự nhiên, không chất bảo quản.",
    isFeatured: true,
    isBestSeller: false
  },

  // --- QUẢ (Fruits) ---
  { 
    id: 3, 
    name: "Dâu tây Mộc Châu", 
    category: "Quả", 
    price: 150000, 
    image: "https://images.unsplash.com/photo-1518635017498-87f514b751ba?auto=format&fit=crop&w=400&q=80", 
    images: [
      "https://images.unsplash.com/photo-1518635017498-87f514b751ba?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=400&q=80"
    ],
    desc: "Dâu tây chín mọng, vị chua ngọt tự nhiên.",
    isFeatured: true,
    isBestSeller: true 
  },
  { 
    id: 7, 
    name: "Dưa hấu đỏ", 
    category: "Quả", 
    price: 12000, 
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80", 
    images: [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1563114773-84221bd62baa?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80"
    ],
    desc: "Dưa hấu ruột đỏ, ngọt mát, giải nhiệt mùa hè.",
    isFeatured: false,
    isBestSeller: true
  },
  { 
    id: 8, 
    name: "Cam sành", 
    category: "Quả", 
    price: 40000, 
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80", 
    images: [
      "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=400&q=80"
    ],
    desc: "Cam mọng nước, nhiều vitamin C, tăng cường đề kháng.",
    isFeatured: true,
    isBestSeller: false
  }
];
