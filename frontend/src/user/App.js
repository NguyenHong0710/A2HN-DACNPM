/* src/App.js */
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import Layout
import Header from './components/Layout/Header.js'; 
import Footer from './components/Layout/Footer.js';
import Chatbox from './components/UI/Chatbox.js';
import ScrollToTop from './components/UI/ScrollToTop.js';
import userRoutes from './routes.js';
import ProtectedvendorRoute from './components/ProtectedAdminRoute.js';
import { hasValidAuthSession } from './utils/authStorage.js';

import AdminLayout from "../admin/layout/DefaultLayout.js";
import adminCoreStyles from "../admin/scss/style.scss?inline";
import adminExampleStyles from "../admin/scss/examples.scss?inline";

import NewsDetail from './pages/About/NewsDetail';
// ✅ Đã đổi sang admin
const admin_BASE_PATH = '/admin';

const AUTH_REQUIRED_USER_PATHS = new Set(['/cart', '/checkout', '/messages', '/orders']);

function App() {
  const location = useLocation();
  const shouldShowFloatingChatbox = location.pathname !== '/messages';
     
  React.useEffect(() => {
    const isAdminPath =
      location.pathname === admin_BASE_PATH ||
      location.pathname.startsWith(`${admin_BASE_PATH}/`);

    const adminStyleId = 'admin-dynamic-style';
    const combinedAdminStyles = `${adminCoreStyles}\n${adminExampleStyles}`;

    let adminStyleEl = document.getElementById(adminStyleId);

    if (isAdminPath) {
      document.body.classList.add('admin-mode');

      if (!adminStyleEl) {
        adminStyleEl = document.createElement('style');
        adminStyleEl.id = adminStyleId;
        adminStyleEl.type = 'text/css';
        adminStyleEl.appendChild(document.createTextNode(combinedAdminStyles));
        document.head.appendChild(adminStyleEl);
      }

      return;
    }

    document.body.classList.remove('admin-mode');

    if (adminStyleEl) {
      adminStyleEl.remove();
    }
  }, [location.pathname]);

  return (
    <div className="App">
      <ScrollToTop />
      
      <Routes>
        {/* ✅ ADMIN ROOT */}
        <Route
          path="/admin"
          element={
            <ProtectedvendorRoute
              allowedRoles={['admin']}
              element={<Navigate to="/admin/dashboard" replace />}
            />
          }
        />

        {/* ✅ ADMIN LAYOUT */}
        <Route
          path="/admin/*"
          element={
            <ProtectedvendorRoute
              allowedRoles={['admin']}
              element={<AdminLayout />}
            />
          }
        />

        {/* 👇 USER ROUTES */}
        <Route
          path="*"
          element={
            <>
              <Header />
              <div
                style={{
                  minHeight: '80vh',
                  backgroundColor: '#f5f5f5',
                  paddingBottom: '20px'
                }}
              >
                <Routes>
                  <Route path="/news/:id" element={<NewsDetail />} />
                  {userRoutes.map((route) => {
                    const Component = route.element;
                    const requiresAuth = AUTH_REQUIRED_USER_PATHS.has(route.path);

                    if (!requiresAuth) {
                      return (
                        <Route
                          key={route.path}
                          path={route.path}
                          element={<Component />}
                        />
                      );
                    }

                    return (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={
                          hasValidAuthSession()
                            ? <Component />
                            : (
                              <Navigate
                                to={`/login?redirect=${encodeURIComponent(
                                  location.pathname + location.search
                                )}`}
                                replace
                              />
                            )
                        }
                      />
                    );
                  })}
                </Routes>
              </div>
              <Footer />
              {shouldShowFloatingChatbox ? <Chatbox /> : null}
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;