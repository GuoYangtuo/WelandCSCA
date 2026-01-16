import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './AuthModal.css';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: () => void;
}

type RegisterType = 'student' | 'institution';

// ===== 临时关闭学生注册通道（改为 false 即可重新开放）=====
const STUDENT_REGISTRATION_ENABLED = true;
// ===== 临时关闭学生注册通道 END =====

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSwitchMode }) => {
  const { login, register, registerInstitution } = useAuth();
  const { t } = useLanguage();
  const [registerType, setRegisterType] = useState<RegisterType>('student');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nationality: '',
    source: '',
    customSource: '',
    inviteCode: ''
  });
  // 机构注册表单数据
  const [institutionFormData, setInstitutionFormData] = useState({
    username: '',
    email: '',
    password: '',
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomSource, setShowCustomSource] = useState(false);

  // 从哪里了解到平台的预设选项
  const sourceOptions = [
    { value: '', label: t.auth.sourceOptions.select },
    { value: '小红书', label: t.auth.sourceOptions.xiaohongshu },
    { value: '微信公众号', label: t.auth.sourceOptions.wechat },
    { value: '微博', label: t.auth.sourceOptions.weibo },
    { value: '抖音', label: t.auth.sourceOptions.douyin },
    { value: 'B站', label: t.auth.sourceOptions.bilibili },
    { value: '朋友推荐', label: t.auth.sourceOptions.friendRecommend },
    { value: '学校/机构推荐', label: t.auth.sourceOptions.schoolRecommend },
    { value: '搜索引擎', label: t.auth.sourceOptions.searchEngine },
    { value: '其他', label: t.auth.sourceOptions.other },
  ];

  // 常见国籍选项
  const nationalityOptions = [
    { value: '', label: t.auth.nationalityOptions.select },
    { value: '中国', label: t.auth.nationalityOptions.china },
    { value: '美国', label: t.auth.nationalityOptions.usa },
    { value: '英国', label: t.auth.nationalityOptions.uk },
    { value: '加拿大', label: t.auth.nationalityOptions.canada },
    { value: '澳大利亚', label: t.auth.nationalityOptions.australia },
    { value: '日本', label: t.auth.nationalityOptions.japan },
    { value: '韩国', label: t.auth.nationalityOptions.korea },
    { value: '德国', label: t.auth.nationalityOptions.germany },
    { value: '法国', label: t.auth.nationalityOptions.france },
    { value: '新加坡', label: t.auth.nationalityOptions.singapore },
    { value: '马来西亚', label: t.auth.nationalityOptions.malaysia },
    { value: '其他', label: t.auth.nationalityOptions.other },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        console.log('login', formData.username, formData.password);
        await login(formData.username, formData.password);
      } else if (registerType === 'institution') {
        // 机构注册验证
        if (!institutionFormData.username) {
          setError(t.auth.pleaseEnterUsernameMsg);
          setLoading(false);
          return;
        }
        if (!institutionFormData.email) {
          setError(t.auth.pleaseEnterEmailMsg);
          setLoading(false);
          return;
        }
        if (!institutionFormData.password) {
          setError(t.auth.pleaseEnterPasswordMsg);
          setLoading(false);
          return;
        }
        if (!institutionFormData.inviteCode) {
          setError(t.auth.institutionNeedsInviteCode);
          setLoading(false);
          return;
        }
        
        await registerInstitution(
          institutionFormData.username,
          institutionFormData.email,
          institutionFormData.password,
          institutionFormData.inviteCode
        );
      } else {
        // 学生注册验证
        if (!formData.email) {
          setError(t.auth.pleaseEnterEmailMsg);
          setLoading(false);
          return;
        }
        if (!formData.nationality) {
          setError(t.auth.pleaseSelectNationality);
          setLoading(false);
          return;
        }
        if (!formData.source) {
          setError(t.auth.pleaseSelectSource);
          setLoading(false);
          return;
        }
        
        // 确定最终的来源值
        const finalSource = formData.source === '其他' ? formData.customSource : formData.source;
        if (formData.source === '其他' && !formData.customSource.trim()) {
          setError(t.auth.pleaseDescribeSourceMsg);
          setLoading(false);
          return;
        }
        
        await register(
          formData.username, 
          formData.email, 
          formData.password,
          formData.nationality,
          finalSource,
          formData.inviteCode || undefined
        );
      }
      onClose();
      setFormData({ 
        username: '', 
        email: '', 
        password: '',
        nationality: '',
        source: '',
        customSource: '',
        inviteCode: ''
      });
      setInstitutionFormData({
        username: '',
        email: '',
        password: '',
        inviteCode: ''
      });
      setShowCustomSource(false);
      setRegisterType('student');
    } catch (err: any) {
      setError(err.response?.data?.message || t.auth.operationFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 当选择"其他"时显示自定义输入框
    if (name === 'source') {
      setShowCustomSource(value === '其他');
    }
  };

  const handleInstitutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInstitutionFormData({
      ...institutionFormData,
      [name]: value
    });
  };

  // 切换注册类型
  const switchToInstitution = () => {
    setRegisterType('institution');
    setError('');
  };

  const switchToStudent = () => {
    setRegisterType('student');
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${mode === 'register' ? 'register-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {mode === 'register' ? (
          <div className="modal-header">
            <h2>{registerType === 'institution' ? t.auth.institutionRegister : t.auth.becomeWelandMember}</h2>
            <div className="modal-subtitle">
              {registerType === 'institution' ? (
                <p>{t.auth.welcomeToWeland}</p>
              ) : (
                <>
                  <p>{t.auth.subtitle1}</p>
                  <p>{t.auth.subtitle2}</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <h2>{t.auth.login}</h2>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        {/* 登录表单 */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t.auth.username}</label>
              <input
                className="login-input"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder={t.auth.pleaseEnterUsername}
              />
            </div>
            
            <div className="form-group">
              <label>{t.auth.password}</label>
              <input
                className="login-input"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t.auth.pleaseEnterPassword}
                minLength={6}
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? t.auth.processing : t.auth.login}
            </button>
            <div className="login-warning">
              <span className="login-warning-icon">⚠️</span>
              <div className="login-warning-text">
                <strong>{t.auth.loginWarning}</strong>
                <p>{t.auth.loginWarningDetail}</p>
              </div>
            </div>
          </form>
        )}

        {/* 学生注册表单 */}
        {mode === 'register' && registerType === 'student' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t.auth.username}</label>
              <input
                className="login-input"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder={t.auth.pleaseEnterUsername}
              />
            </div>
            
            <div className="form-group">
              <label>{t.auth.email}</label>
              <input
                className="login-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={t.auth.pleaseEnterEmail}
              />
            </div>
            
            <div className="form-group">
              <label>{t.auth.password}</label>
              <input
                className="login-input"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t.auth.pleaseEnterPassword}
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label>{t.auth.nationality}</label>
              <select
                className="login-input login-select"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                required
              >
                {nationalityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>{t.auth.sourceLabel}</label>
              <select
                className="login-input login-select"
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {showCustomSource && (
              <div className="form-group">
                <label>{t.auth.customSourceLabel}</label>
                <input
                  className="login-input"
                  type="text"
                  name="customSource"
                  value={formData.customSource}
                  onChange={handleChange}
                  placeholder={t.auth.pleaseDescribeSource}
                />
              </div>
            )}
            
            <div className="form-group">
              <label>{t.auth.inviteCode} <span className="optional-tag">{t.auth.optional}</span></label>
              <input
                className="login-input"
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                placeholder={t.auth.ifHasInviteCode}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading || !STUDENT_REGISTRATION_ENABLED}
            >
              {loading ? t.auth.processing : (STUDENT_REGISTRATION_ENABLED ? t.auth.register : t.auth.studentRegNotOpen)}
            </button>
          </form>
        )}

        {/* 机构注册表单 */}
        {mode === 'register' && registerType === 'institution' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t.auth.username}</label>
              <input
                className="login-input"
                type="text"
                name="username"
                value={institutionFormData.username}
                onChange={handleInstitutionChange}
                required
                placeholder={t.auth.pleaseEnterUsernameOrInstitution}
              />
            </div>
            
            <div className="form-group">
              <label>{t.auth.email}</label>
              <input
                className="login-input"
                type="email"
                name="email"
                value={institutionFormData.email}
                onChange={handleInstitutionChange}
                required
                placeholder={t.auth.pleaseEnterEmail}
              />
            </div>
            
            <div className="form-group">
              <label>{t.auth.password}</label>
              <input
                className="login-input"
                type="password"
                name="password"
                value={institutionFormData.password}
                onChange={handleInstitutionChange}
                required
                placeholder={t.auth.pleaseEnterPassword}
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label>{t.auth.inviteCode}</label>
              <input
                className="login-input"
                type="text"
                name="inviteCode"
                value={institutionFormData.inviteCode}
                onChange={handleInstitutionChange}
                required
                placeholder={t.auth.pleaseEnterInviteCode}
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? t.auth.processing : t.auth.institutionRegister}
            </button>
          </form>
        )}
        
        <div className="modal-footer">
          {mode === 'login' ? (
            <p>
              {t.auth.noAccount}{' '}
              <button type="button" className="link-button" onClick={onSwitchMode}>
                {t.auth.registerNow}
              </button>
            </p>
          ) : (
            <p className="register-footer-links">
              <span>
                {t.auth.hasAccount}{' '}
                <button type="button" className="link-button" onClick={onSwitchMode}>
                  {t.auth.loginNow}
                </button>
              </span>
              <span className="footer-divider">|</span>
              <span>
                {registerType === 'student' ? (
                  <>
                    {t.auth.isInstitution}{' '}
                    <button type="button" className="link-button" onClick={switchToInstitution}>
                      {t.auth.institutionReg}
                    </button>
                  </>
                ) : (
                  <>
                    {t.auth.isPersonal}{' '}
                    <button type="button" className="link-button" onClick={switchToStudent}>
                      {t.auth.studentReg}
                    </button>
                  </>
                )}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
