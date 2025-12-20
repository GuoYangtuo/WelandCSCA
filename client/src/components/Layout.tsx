import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { languageNames, Language } from '../i18n';
import { ChevronDown, Globe } from 'lucide-react';
import AuthModal from './AuthModal';

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
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // 判断是否隐藏导航栏
  const hideHeader = HIDE_HEADER_PATHS.includes(location.pathname);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLangDropdown(false);
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
              {/* 语言选择下拉菜单 */}
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
              
              {isAuthenticated ? (
                <>
                  <span className="username">{t.nav.welcome}, {user?.username}</span>
                  <button onClick={logout} className="btn btn-outline">
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
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
    </div>
  );
};

export default Layout;
