import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { institutionAPI } from '../services/api';
import {
  Building2,
  Users,
  Copy,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  Clock,
  TrendingUp,
  UserPlus,
  Calendar,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Package
} from 'lucide-react';
import './InstitutionAdmin.css';

interface Student {
  id: string;
  username: string;
  email: string;
  nationality: string;
  user_created_at: string;
  bound_at: string;
}

interface Stats {
  totalStudents: number;
  newStudentsThisWeek: number;
  newStudentsThisMonth: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrderItem {
  card_type_id: number;
  quantity: number;
  price: number;
  card_name: string;
}

interface StudentOrder {
  order_id: number;
  order_code: string;
  order_items: OrderItem[];
  total_price: number;
  status: string;
  order_created_at: string;
  approved_at: string;
  student_id: string;
  student_username: string;
  student_email: string;
}

interface CommissionData {
  quarterInfo: {
    year: number;
    quarter: number;
    startDate: string;
    endDate: string;
  };
  quarterStats: {
    totalCards: number;
    commissionPerCard: number;
    totalCommission: number;
  };
  allTimeStats: {
    totalCards: number;
    totalCommission: number;
  };
}

const InstitutionAdmin: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isInstitution, setIsInstitution] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 机构码相关
  const [institutionCode, setInstitutionCode] = useState<string>('');
  const [nextUpdateTime, setNextUpdateTime] = useState<string>('');
  const [countdown, setCountdown] = useState<string>('');

  // 统计数据
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    newStudentsThisWeek: 0,
    newStudentsThisMonth: 0
  });

  // 学生列表
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  // 学生购买记录
  const [studentOrders, setStudentOrders] = useState<StudentOrder[]>([]);
  const [ordersPagination, setOrdersPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // 佣金统计
  const [commission, setCommission] = useState<CommissionData | null>(null);

  // 检查机构用户身份
  useEffect(() => {
    const checkInstitution = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        navigate('/');
        return;
      }

      try {
        const response = await api.get('/institution/check');
        if (response.data.success && response.data.isInstitution) {
          setIsInstitution(true);
        } else {
          setIsInstitution(false);
        }
      } catch (error) {
        setIsInstitution(false);
      } finally {
        setLoading(false);
      }
    };

    checkInstitution();
  }, [isAuthenticated, authLoading, navigate]);

  // 加载机构码
  const loadInstitutionCode = useCallback(async () => {
    try {
      const response = await api.get('/institution/code');
      if (response.data.success) {
        setInstitutionCode(response.data.data.code);
        setNextUpdateTime(response.data.data.nextUpdateTime);
      }
    } catch (error) {
      console.error('加载机构码失败:', error);
    }
  }, []);

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/institution/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, []);

  // 加载学生列表
  const loadStudents = useCallback(async (page = 1) => {
    try {
      const response = await api.get('/institution/students', {
        params: { page, limit: pagination.limit, search: studentSearch }
      });
      if (response.data.success) {
        setStudents(response.data.data.students);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('加载学生列表失败:', error);
    }
  }, [studentSearch, pagination.limit]);

  // 加载学生购买记录
  const loadStudentOrders = useCallback(async (page = 1) => {
    try {
      const response = await institutionAPI.getStudentOrders({ page, limit: ordersPagination.limit });
      if (response.success) {
        setStudentOrders(response.data.orders);
        setOrdersPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('加载学生购买记录失败:', error);
    }
  }, [ordersPagination.limit]);

  // 加载佣金统计
  const loadCommission = useCallback(async () => {
    try {
      const response = await institutionAPI.getCommission();
      if (response.success) {
        setCommission(response.data);
      }
    } catch (error) {
      console.error('加载佣金统计失败:', error);
    }
  }, []);

  // 初始化加载数据
  useEffect(() => {
    if (isInstitution) {
      loadInstitutionCode();
      loadStats();
      loadStudents();
      loadStudentOrders();
      loadCommission();
    }
  }, [isInstitution, loadInstitutionCode, loadStats, loadStudents, loadStudentOrders, loadCommission]);

  // 更新倒计时
  useEffect(() => {
    if (!nextUpdateTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(nextUpdateTime);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('即将更新');
        // 重新加载机构码
        loadInstitutionCode();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}天 ${hours}小时 ${minutes}分钟`);
      } else if (hours > 0) {
        setCountdown(`${hours}小时 ${minutes}分钟 ${seconds}秒`);
      } else {
        setCountdown(`${minutes}分钟 ${seconds}秒`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextUpdateTime, loadInstitutionCode]);

  // 复制机构码
  const handleCopyCode = () => {
    navigator.clipboard.writeText(institutionCode);
    setMessage({ type: 'success', text: '机构码已复制到剪贴板' });
    setTimeout(() => setMessage(null), 3000);
  };

  // 搜索学生
  const handleSearch = () => {
    loadStudents(1);
  };

  // 渲染加载状态
  if (authLoading || loading) {
    return (
      <div className="institution-page">
        <div className="loading-container">
          <Loader className="spin" size={48} />
          <p>验证权限中...</p>
        </div>
      </div>
    );
  }

  // 渲染拒绝访问
  if (!isInstitution) {
    return (
      <div className="institution-page">
        <div className="access-denied">
          <Building2 size={64} />
          <h2>访问被拒绝</h2>
          <p>此页面仅限机构用户访问</p>
          <p className="hint">当前用户: {user?.username}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="institution-page">
      <div className="institution-container">
        {/* Header + Stats 整合 */}
        <header className="institution-header-combined">
          <div className="header-left">
            <div className="header-title">
              <Building2 size={24} />
              <h1>机构管理后台</h1>
            <span className="institution-badge">{user?.username}</span>
            </div>
          </div>
          <div className="header-stats">
            <div className="mini-stat total">
              <Users size={18} />
              <span className="mini-stat-value">{stats.totalStudents}</span>
              <span className="mini-stat-label">总学生</span>
            </div>
            <div className="mini-stat week">
              <TrendingUp size={18} />
              <span className="mini-stat-value">{stats.newStudentsThisWeek}</span>
              <span className="mini-stat-label">本周新增</span>
            </div>
            <div className="mini-stat month">
              <UserPlus size={18} />
              <span className="mini-stat-value">{stats.newStudentsThisMonth}</span>
              <span className="mini-stat-label">本月新增</span>
            </div>
          </div>
        </header>

        {/* Message */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* 机构码卡片 - 紧凑版 */}
        <section className="code-section-compact">
          <div className="code-card-compact">
            <div className="code-info">
              <h3>机构专属码</h3>
              <p>学生注册时填写即可绑定</p>
            </div>
            <div className="code-display-compact">
              <div className="code-value-compact">
                {institutionCode.split('').map((char, index) => (
                  <span key={index} className="code-char-compact">{char}</span>
                ))}
              </div>
              <button className="btn-copy-compact" onClick={handleCopyCode} title="复制机构码">
                <Copy size={16} />
              </button>
            </div>
            <div className="code-countdown">
              <Clock size={14} />
              <span>距离下次更新: {countdown}</span>
              <button className="btn-refresh-mini" onClick={loadInstitutionCode}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* 佣金统计卡片 */}
        {commission && (
          <section className="commission-section">
            <div className="commission-card">
              <div className="commission-main">
                <div className="commission-icon">
                  <DollarSign size={28} />
                </div>
                <div className="commission-info">
                  <h3>本季度预计佣金</h3>
                  <p className="commission-quarter">
                    {commission.quarterInfo.year}年 Q{commission.quarterInfo.quarter}
                  </p>
                </div>
                <div className="commission-amount">
                  <span className="currency">¥</span>
                  <span className="value">{commission.quarterStats.totalCommission.toFixed(2)}</span>
                </div>
              </div>
              <div className="commission-details">
                <div className="commission-detail-item">
                  <CreditCard size={16} />
                  <span>本季度成交卡数</span>
                  <strong>{commission.quarterStats.totalCards} 张</strong>
                </div>
                <div className="commission-detail-item">
                  <Package size={16} />
                  <span>单卡返佣</span>
                  <strong>¥{commission.quarterStats.commissionPerCard}</strong>
                </div>
                <div className="commission-detail-item total">
                  <TrendingUp size={16} />
                  <span>累计总佣金</span>
                  <strong>¥{commission.allTimeStats.totalCommission.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 学生购买记录 */}
        <section className="orders-section">
          <div className="section-header">
            <h2>
              <ShoppingCart size={22} />
              学生购买记录
            </h2>
            <span className="status-badge approved">已审核通过</span>
          </div>

          {studentOrders.length > 0 ? (
            <>
              <div className="data-table-wrapper">
                <table className="data-table orders-table">
                  <thead>
                    <tr>
                      <th>订单号</th>
                      <th>学生</th>
                      <th>购买内容</th>
                      <th>订单金额</th>
                      <th>返佣</th>
                      <th>审核时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentOrders.map((order) => {
                      const totalQuantity = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
                      const commission = totalQuantity * 10;
                      return (
                        <tr key={order.order_id}>
                          <td className="order-code-cell">{order.order_code}</td>
                          <td>
                            <div className="student-info">
                              <span className="student-name">{order.student_username}</span>
                              <span className="student-email">{order.student_email}</span>
                            </div>
                          </td>
                          <td>
                            <div className="order-items">
                              {order.order_items.map((item, idx) => (
                                <span key={idx} className="order-item-tag">
                                  {item.card_name} ×{item.quantity}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="price-cell">¥{Number(order.total_price).toFixed(2)}</td>
                          <td className="commission-cell">+¥{commission.toFixed(2)}</td>
                          <td>
                            <div className="date-cell">
                              <Calendar size={14} />
                              {new Date(order.approved_at).toLocaleDateString('zh-CN')}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <span>共 {ordersPagination.total} 条记录</span>
                <div className="pagination-btns">
                  <button
                    disabled={ordersPagination.page <= 1}
                    onClick={() => loadStudentOrders(ordersPagination.page - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>{ordersPagination.page} / {ordersPagination.totalPages}</span>
                  <button
                    disabled={ordersPagination.page >= ordersPagination.totalPages}
                    onClick={() => loadStudentOrders(ordersPagination.page + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <ShoppingCart size={48} />
              <p>暂无学生购买记录</p>
              <p className="hint">学生购买卡片并审核通过后将显示在这里</p>
            </div>
          )}
        </section>

        {/* 学生列表 */}
        <section className="students-section">
          <div className="section-header">
            <h2>
              <Users size={22} />
              绑定学生列表
            </h2>
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-search" onClick={handleSearch}>搜索</button>
            </div>
          </div>

          {students.length > 0 ? (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>用户名</th>
                      <th>邮箱</th>
                      <th>国籍</th>
                      <th>注册时间</th>
                      <th>绑定时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="username-cell">{student.username}</td>
                        <td>{student.email}</td>
                        <td>{student.nationality || '-'}</td>
                        <td>
                          <div className="date-cell">
                            <Calendar size={14} />
                            {new Date(student.user_created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            <Clock size={14} />
                            {new Date(student.bound_at).toLocaleDateString('zh-CN')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <span>共 {pagination.total} 名学生</span>
                <div className="pagination-btns">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => loadStudents(pagination.page - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>{pagination.page} / {pagination.totalPages}</span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadStudents(pagination.page + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Users size={48} />
              <p>暂无绑定的学生</p>
              <p className="hint">将您的机构码分享给学生，学生注册时填写即可自动绑定</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InstitutionAdmin;

