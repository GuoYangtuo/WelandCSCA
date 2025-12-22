import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { languageNames, Language } from '../i18n';
import { ChevronDown, Globe, User, LogOut, ChevronRight, CreditCard } from 'lucide-react';
import AuthModal from './AuthModal';
import CardWalletModal from './CardWalletModal';

interface LayoutProps {
  children: ReactNode;
}

// 需要隐藏导航栏的页面路径
const HIDE_HEADER_PATHS = ['/question-upload', '/course-upload'];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated, showAuthModal, authMode, openLoginModal, openRegisterModal, closeAuthModal, switchAuthMode } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangSubmenu, setShowLangSubmenu] = useState(false);
  const [showCardWalletModal, setShowCardWalletModal] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // 判断是否隐藏导航栏
  const hideHeader = HIDE_HEADER_PATHS.includes(location.pathname);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
        setShowLangSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLangDropdown(false);
  };

  const handleLanguageChangeInUserMenu = (lang: Language) => {
    setLanguage(lang);
    setShowLangSubmenu(false);
    setShowUserDropdown(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
  };

  const handleOpenCardWallet = () => {
    setShowCardWalletModal(true);
    setShowUserDropdown(false);
  };

  return (
    <div className={`app ${hideHeader ? 'no-header' : ''}`}>
      {!hideHeader && (
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">
              <img src="/LOGO.png" alt="Weland" className="logo-image" />
              <h1>CSCA.weland.group</h1>
            </Link>
            <nav className="nav">
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                {t.nav.home}
              </Link>
              <Link to="/basic-test" className={location.pathname === '/basic-test' ? 'active' : ''}>
                {t.nav.basicTest}
              </Link>
              <Link to="/study" className={location.pathname === '/study' ? 'active' : ''}>
                {t.nav.study}
              </Link>
              <Link to="/mock-test" className={location.pathname === '/mock-test' ? 'active' : ''}>
                {t.nav.mockTest}
              </Link>
            </nav>
            <div className="user-section">
              {isAuthenticated ? (
                <>
                  {/* 登录后：用户下拉菜单 */}
                  <div className="user-menu" ref={userDropdownRef}>
                    <button 
                      className="user-menu-btn"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                      <User size={16} />
                      <span>{user?.username}</span>
                      <ChevronDown size={14} className={showUserDropdown ? 'rotated' : ''} />
                    </button>
                    {showUserDropdown && (
                      <div className="user-dropdown">
                        {/* 我的卡包 */}
                        <button 
                          className="user-dropdown-item"
                          onClick={handleOpenCardWallet}
                        >
                          <CreditCard size={16} />
                          <span>{t.nav.myCardWallet || '我的卡包'}</span>
                        </button>
                        
                        {/* 语言切换 - 二级菜单 */}
                        <div 
                          className="user-dropdown-item with-submenu"
                          onMouseEnter={() => setShowLangSubmenu(true)}
                          onMouseLeave={() => setShowLangSubmenu(false)}
                        >
                          <div className="dropdown-item-content">
                            <Globe size={16} />
                            <span>{t.nav.language || '语言'}</span>
                            <ChevronRight size={14} className="submenu-arrow" />
                          </div>
                          {showLangSubmenu && (
                            <div className="language-submenu">
                              {(Object.keys(languageNames) as Language[]).map((lang) => (
                                <button
                                  key={lang}
                                  className={`language-option ${language === lang ? 'active' : ''}`}
                                  onClick={() => handleLanguageChangeInUserMenu(lang)}
                                >
                                  {languageNames[lang]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* 退出登录 */}
                        <button 
                          className="user-dropdown-item logout"
                          onClick={handleLogout}
                        >
                          <LogOut size={16} />
                          <span>{t.nav.logout}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* 未登录：语言选择下拉菜单 */}
                  <div className="language-selector" ref={langDropdownRef}>
                    <button 
                      className="language-btn"
                      onClick={() => setShowLangDropdown(!showLangDropdown)}
                    >
                      <Globe size={16} />
                      <span>{languageNames[language]}</span>
                      <ChevronDown size={14} className={showLangDropdown ? 'rotated' : ''} />
                    </button>
                    {showLangDropdown && (
                      <div className="language-dropdown">
                        {(Object.keys(languageNames) as Language[]).map((lang) => (
                          <button
                            key={lang}
                            className={`language-option ${language === lang ? 'active' : ''}`}
                            onClick={() => handleLanguageChange(lang)}
                          >
                            {languageNames[lang]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button onClick={openLoginModal} className="btn btn-outline">
                    {t.nav.login}
                  </button>
                  <button onClick={openRegisterModal} className="btn btn-primary">
                    {t.nav.register}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}
      <main className={`main-content ${hideHeader ? 'full-height' : ''}`}>{children}</main>
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={closeAuthModal}
          onSwitchMode={switchAuthMode}
        />
      )}
      {showCardWalletModal && (
        <CardWalletModal
          onClose={() => setShowCardWalletModal(false)}
        />
      )}
    </div>
  );
};

export default Layout;
