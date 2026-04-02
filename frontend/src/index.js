import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import App from './user/App.js'
import store from './store.js'
import './user/index.css'
import { CartProvider } from './user/store/CartContext.js'
import { NotificationProvider } from './user/store/NotificationContext.js'
import { clearExpiredNonRememberedAuth } from './user/utils/authStorage.js'
import { installApiFetchAdapter } from './user/utils/apiBaseResolver.js'

installApiFetchAdapter()
clearExpiredNonRememberedAuth()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <NotificationProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </NotificationProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
