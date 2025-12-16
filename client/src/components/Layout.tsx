import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated, showAuthModal, authMode, openLoginModal, openRegisterModal, closeAuthModal, switchAuthMode } = useAuth();
  const location = useLocation();

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src="/LOGO.png" alt="Weland" className="logo-image" />
            <h1>CSCA.weland.group</h1>
          </Link>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              首页
            </Link>
            <Link to="/basic-test" className={location.pathname === '/basic-test' ? 'active' : ''}>
              基础测试
            </Link>
            <Link to="/study" className={location.pathname === '/study' ? 'active' : ''}>
              学习训练
            </Link>
            <Link to="/mock-test" className={location.pathname === '/mock-test' ? 'active' : ''}>
              模拟测试
            </Link>
          </nav>
          <div className="user-section">
            {isAuthenticated ? (
              <>
                <span className="username">欢迎, {user?.username}</span>
                <button onClick={logout} className="btn btn-outline">
                  退出
                </button>
              </>
            ) : (
              <>
                <button onClick={openLoginModal} className="btn btn-outline">
                  登录
                </button>
                <button onClick={openRegisterModal} className="btn btn-primary">
                  注册
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={closeAuthModal}
          onSwitchMode={switchAuthMode}
        />
      )}
    </div>
  );
};

export default Layout;


