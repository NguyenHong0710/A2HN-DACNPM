import React from 'react'
import ReactDOM from 'react-dom/client'
import App from "./App.js";
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './store/CartContext.js';
import { NotificationProvider } from './store/NotificationContext.js'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  // Tạm thời comment StrictMode nếu bạn muốn test tốc độ thực tế của API
  // <React.StrictMode> 
    <BrowserRouter>
      <NotificationProvider> 
        <CartProvider>  
          <App />
        </CartProvider>
      </NotificationProvider>
    </BrowserRouter>
  // </React.StrictMode>,
)