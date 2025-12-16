import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: () => void;
}

// 从哪里了解到平台的预设选项
const sourceOptions = [
  '请选择',
  '小红书',
  '微信公众号',
  '微博',
  '抖音',
  'B站',
  '朋友推荐',
  '学校/机构推荐',
  '搜索引擎',
  '其他'
];

// 常见国籍选项
const nationalityOptions = [
  '请选择国籍',
  '中国',
  '美国',
  '英国',
  '加拿大',
  '澳大利亚',
  '日本',
  '韩国',
  '德国',
  '法国',
  '新加坡',
  '马来西亚',
  '其他'
];

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSwitchMode }) => {
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nationality: '',
    source: '',
    customSource: '',
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomSource, setShowCustomSource] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        console.log('login', formData.username, formData.password);
        await login(formData.username, formData.password);
      } else {
        if (!formData.email) {
          setError('请填写邮箱');
          setLoading(false);
          return;
        }
        if (!formData.nationality || formData.nationality === '请选择国籍') {
          setError('请选择国籍');
          setLoading(false);
          return;
        }
        if (!formData.source || formData.source === '请选择') {
          setError('请选择从哪里了解到平台');
          setLoading(false);
          return;
        }
        
        // 确定最终的来源值
        const finalSource = formData.source === '其他' ? formData.customSource : formData.source;
        if (formData.source === '其他' && !formData.customSource.trim()) {
          setError('请填写您是从哪里了解到平台的');
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
      setShowCustomSource(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败，请重试');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${mode === 'register' ? 'register-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {mode === 'register' ? (
          <div className="modal-header">
            <h2>成为Weland会员</h2>
            <div className="modal-subtitle">
              <p>Weland-CSCA是Weland官方主导的项目</p>
              <p>联合各大名师和高校联合研发</p>
            </div>
          </div>
        ) : (
          <h2>登录Weland</h2>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              className="login-input"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="请输入用户名"
            />
          </div>
          
          {mode === 'register' && (
            <div className="form-group">
              <label>邮箱</label>
              <input
                className="login-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="请输入邮箱"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>密码</label>
            <input
              className="login-input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="请输入密码"
              minLength={6}
            />
          </div>
          
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>国籍</label>
                <select
                  className="login-input login-select"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                >
                  {nationalityOptions.map((option) => (
                    <option key={option} value={option === '请选择国籍' ? '' : option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>从哪里了解到平台</label>
                <select
                  className="login-input login-select"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                >
                  {sourceOptions.map((option) => (
                    <option key={option} value={option === '请选择' ? '' : option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              
              {showCustomSource && (
                <div className="form-group">
                  <label>请说明来源</label>
                  <input
                    className="login-input"
                    type="text"
                    name="customSource"
                    value={formData.customSource}
                    onChange={handleChange}
                    placeholder="请填写您是从哪里了解到平台的"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>邀请码 <span className="optional-tag">（可选）</span></label>
                <input
                  className="login-input"
                  type="text"
                  name="inviteCode"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  placeholder="如有邀请码请填写"
                />
              </div>
            </>
          )}
          
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
        
        <div className="modal-footer">
          {mode === 'login' ? (
            <p>
              还没有账号？{' '}
              <button type="button" className="link-button" onClick={onSwitchMode}>
                立即注册
              </button>
            </p>
          ) : (
            <p>
              已有账号？{' '}
              <button type="button" className="link-button" onClick={onSwitchMode}>
                立即登录
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
