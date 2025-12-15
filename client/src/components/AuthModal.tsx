import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSwitchMode }) => {
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        await register(formData.username, formData.email, formData.password);
      }
      onClose();
      setFormData({ username: '', email: '', password: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{mode === 'login' ? '登录' : '注册'}</h2>
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


