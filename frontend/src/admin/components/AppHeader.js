import React, { useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CDropdownHeader,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilContrast,
  cilMenu,
  cilMoon,
  cilSun,
  cilSettings,
  cilPuzzle,
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-vendor-template-theme')
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    }
    document.addEventListener('scroll', handleScroll)
    
    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        {/* Nút đóng mở Sidebar */}
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        {/* Menu điều hướng chính */}
        <CHeaderNav className="d-none d-md-flex">
          <CNavItem>
            <CNavLink to="/vendor/dashboard" as={NavLink}>Dashboard</CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink to="/vendor/products" as={NavLink}>Sản phẩm</CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink to="/vendor/revenue" as={NavLink}>Doanh thu</CNavLink>
          </CNavItem>
        </CHeaderNav>

        <CHeaderNav className="ms-auto align-items-center">
          {/* Dropdown Cài đặt hệ thống */}
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false} className="py-0 px-2">
              <CIcon icon={cilSettings} size="lg" />
            </CDropdownToggle>
            <CDropdownMenu className="pt-0" style={{ minWidth: '200px' }}>
              <CDropdownHeader className="bg-body-secondary fw-semibold">Hệ thống</CDropdownHeader>
              <CDropdownItem 
                onClick={() => navigate('/vendor/plugins')} 
                style={{ cursor: 'pointer' }}
                className="d-flex align-items-center"
              >
                <CIcon icon={cilPuzzle} className="me-2" /> Plugins giải trí
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CHeaderNav>

        <CHeaderNav>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

          {/* Bộ chọn giao diện Sáng/Tối */}
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false}>
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem active={colorMode === 'light'} as="button" type="button" onClick={() => setColorMode('light')}>
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem active={colorMode === 'dark'} as="button" type="button" onClick={() => setColorMode('dark')}>
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem active={colorMode === 'auto'} as="button" type="button" onClick={() => setColorMode('auto')}>
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>

          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

          {/* User Profile Dropdown */}
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>

      {/* Thanh Breadcrumb (Đường dẫn trang) */}
      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader