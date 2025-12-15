import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const subjects = [
    {
      name: '专业中文',
      icon: '文',
      description: '分为文科中文和理科中文两类',
      details: '申请中文授课本科专业需根据专业类别参加相应测试；申请全英文授课本科无需参加；持有效期内HSK四级可免考',
      color: '#E74C3C'
    },
    {
      name: '数学',
      icon: '∑',
      description: '所有申请人必考科目',
      details: '考察基础学业和逻辑思维能力的重要依据，涵盖等差/等比数列、椭圆、函数、斜率等知识点',
      color: '#3498DB'
    },
    {
      name: '物理',
      icon: 'Φ',
      description: '选考科目',
      details: '申请理、工、农、医类专业需至少选择物理或化学其中一门',
      color: '#9B59B6'
    },
    {
      name: '化学',
      icon: '⚗',
      description: '选考科目',
      details: '涵盖分子式、化学反应、氧化物等基础知识与概念',
      color: '#27AE60'
    }
  ];

  const timeline = [
    {
      date: '2025年12月21日',
      title: '全球首次CSCA考试',
      description: '居家网考为主，越南、泰国设线下考点',
      status: 'upcoming'
    },
    {
      date: '2026年1月25日',
      title: '2026年首场考试',
      description: '报名时间：2025年12月23日-2026年1月10日',
      status: 'future'
    },
    {
      date: '2026年3月15日',
      title: '第二场考试',
      description: '主要面向欧美地区考生',
      status: 'future'
    },
    {
      date: '2026年起',
      title: '常态化考试',
      description: '每年5场：1月、3月、4月、6月、12月',
      status: 'future'
    }
  ];

  const faqs = [
    {
      question: 'CSCA中的汉语考试成绩可以取代HSK证书吗？',
      answer: '根据目前的信息来看，是不可以的，但是它可以增加您被所申请大学录取的几率。'
    },
    {
      question: 'CSCA的考试成绩多久内有效？',
      answer: '自获得成绩证书后的2年内有效。'
    },
    {
      question: '如果我更换了申请的专业或大学，需要重新参加考试吗？',
      answer: '如果您之前参加的科目成绩仍然有效，且新专业的要求已涵盖在内，通常不需要重新参加已考科目。但如果新专业要求额外科目，则需要补考相应科目。'
    },
    {
      question: '所有中国大学都要求提供CSCA考试成绩吗？',
      answer: '并非所有中国大学都要求。目前2026年，只有307所中国政府奖学金院校要求申请者参加CSCA考试，且此要求仅适用于本科项目。'
    },
    {
      question: 'CSCA考试有年龄限制吗？',
      answer: '没有年龄限制，但14周岁以下考生必须由监护人同意并协助完成报名。'
    }
  ];

  const stats = [
    { value: '307+', label: '要求院校' },
    { value: '4', label: '考试科目' },
    { value: '5', label: '年度场次' },
    { value: '2年', label: '成绩有效期' }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">CSCA 官方授权培训平台</div>
          <h1 className="hero-title">
            <span className="title-line">来华留学本科入学</span>
            <span className="title-highlight">学业水平测试</span>
          </h1>
          <p className="hero-subtitle">
            China Scholastic Certificate for Admission
          </p>
          <p className="hero-description">
            自2026年起，所有申请中国政府奖学金院校本科项目的国际学生，
            须在提交申请前参加该考试，考试成绩单将作为大学录取审核的必备材料之一。
          </p>
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/basic-test" className="btn btn-gold">
                  <span>开始测试</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link to="/study" className="btn btn-outline-light">
                  学习训练
                </Link>
              </>
            ) : (
              <p className="hero-login-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                请先登录以开始学习和测试
              </p>
            )}
          </div>
        </div>
        <div className="hero-decoration">
          <div className="deco-circle deco-1"></div>
          <div className="deco-circle deco-2"></div>
          <div className="deco-circle deco-3"></div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">关于考试</span>
            <h2 className="section-title">什么是 CSCA？</h2>
          </div>
          <div className="about-content">
            <div className="about-main">
              <p className="about-lead">
                <strong>China CSCA</strong>（来华留学本科入学学业水平测试）是一项专为申请中国大学本科课程的国际学生设计的标准化学术能力测试。
              </p>
              <p>
                它评估学生在中文、数学、物理和化学方面的能力，以确保他们符合中国大学的入学标准。
                该考试于2025年正式确立，旨在为来华留学本科生制定统一、权威的录取标准，确保公平公正，提高质量控制水平，提升"留学中国"品牌。
              </p>
              <div className="about-highlights">
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <h4>标准化评估</h4>
                    <p>统一的学术能力测试标准</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div>
                    <h4>全球认可</h4>
                    <p>307所中国高校认可</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <h4>灵活安排</h4>
                    <p>每年5次考试机会</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-timeline-preview">
              <div className="timeline-card">
                <h4>考试发展历程</h4>
                <ul>
                  <li><span>2019年</span>开始重视生源质量</li>
                  <li><span>2021年</span>启动考试准备工作</li>
                  <li><span>2025年</span>正式确立CSCA政策</li>
                  <li><span>2026年</span>全面实施</li>
                  <li><span>2028年</span>计划扩展至所有本科申请者</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="subjects-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">考试科目</span>
            <h2 className="section-title">四大核心科目</h2>
            <p className="section-desc">根据申请专业选择相应的考试科目组合</p>
          </div>
          <div className="subjects-grid">
            {subjects.map((subject, index) => (
              <div 
                key={index} 
                className="subject-card"
                style={{ '--accent-color': subject.color } as React.CSSProperties}
              >
                <div className="subject-icon">
                  {subject.icon}
                </div>
                <h3>{subject.name}</h3>
                <p className="subject-type">{subject.description}</p>
                <p className="subject-details">{subject.details}</p>
                <div className="subject-decoration"></div>
              </div>
            ))}
          </div>
          <div className="subjects-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <p>
              <strong>试卷语言：</strong>数学、物理和化学均提供中英文试卷，申请人可根据授课语言或目标学校要求选择试卷语种。
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header light">
            <span className="section-tag">考试时间</span>
            <h2 className="section-title">重要日期</h2>
            <p className="section-desc">规划您的备考时间表</p>
          </div>
          <div className="timeline">
            {timeline.map((item, index) => (
              <div key={index} className={`timeline-item ${item.status}`}>
                <div className="timeline-marker">
                  <div className="marker-dot"></div>
                </div>
                <div className="timeline-content">
                  <span className="timeline-date">{item.date}</span>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="exam-schedule">
            <h4>考试时间安排（北京时间）</h4>
            <div className="schedule-table">
              <div className="schedule-row header">
                <span>科目</span>
                <span>时间</span>
                <span>时长</span>
              </div>
              <div className="schedule-row">
                <span>专业中文</span>
                <span>08:30 - 10:30</span>
                <span>120分钟</span>
              </div>
              <div className="schedule-row">
                <span>数学</span>
                <span>11:00 - 13:00</span>
                <span>120分钟</span>
              </div>
              <div className="schedule-row">
                <span>物理</span>
                <span>14:30 - 15:30</span>
                <span>60分钟</span>
              </div>
              <div className="schedule-row">
                <span>化学</span>
                <span>16:00 - 17:00</span>
                <span>60分钟</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section className="registration-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">报名信息</span>
            <h2 className="section-title">报名与费用</h2>
          </div>
          <div className="reg-grid">
            <div className="reg-card">
              <div className="reg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h4>报名方式</h4>
              <p>通过CSCA官网 <strong>www.csca.cn</strong> 完成线上报名，支持中英文双语操作</p>
            </div>
            <div className="reg-card">
              <div className="reg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <h4>考试费用</h4>
              <div className="price-info">
                <div className="price-item">
                  <span className="price">¥450</span>
                  <span className="price-label">单科</span>
                </div>
                <div className="price-divider"></div>
                <div className="price-item">
                  <span className="price">¥700</span>
                  <span className="price-label">两科及以上</span>
                </div>
              </div>
            </div>
            <div className="reg-card">
              <div className="reg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h4>支付方式</h4>
              <p>支持支付宝、微信、银联以及VISA和MasterCard等境内外主流支付方式</p>
            </div>
            <div className="reg-card">
              <div className="reg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h4>成绩公布</h4>
              <p>居家网考和机考成绩 <strong>7个工作日</strong> 内公布，纸笔考试 <strong>14个工作日</strong> 内公布</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">常见问题</span>
            <h2 className="section-title">FAQ</h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeFaq === index ? 'active' : ''}`}
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div className="faq-question">
                  <h4>{faq.question}</h4>
                  <span className="faq-toggle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </span>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>准备好开始您的CSCA备考之旅了吗？</h2>
            <p>我们提供全面的学习资源和模拟测试，助您高效备考</p>
            <div className="cta-features">
              <div className="cta-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>分章节系统学习</span>
              </div>
              <div className="cta-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>真题模拟练习</span>
              </div>
              <div className="cta-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>智能进度追踪</span>
              </div>
            </div>
            {isAuthenticated ? (
              <div className="cta-actions">
                <Link to="/study" className="btn btn-gold btn-lg">
                  开始学习训练
                </Link>
                <Link to="/basic-test" className="btn btn-outline-gold btn-lg">
                  进入基础测试
                </Link>
                <Link to="/mock-test" className="btn btn-outline-gold btn-lg">
                  模拟测试
                </Link>
              </div>
            ) : (
              <div className="cta-login">
                <p>登录后即可开始学习和测试</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="footer-info">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>考试要求</h4>
              <ul>
                <li>Windows 7 SP1及以上64位系统</li>
                <li>分辨率不低于1366×768</li>
                <li>内存不少于4GB</li>
                <li>带宽不低于20Mbps</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>官方资源</h4>
              <ul>
                <li><a href="https://www.csca.cn" target="_blank" rel="noopener noreferrer">CSCA官网</a></li>
                <li><a href="https://www.cucas.cn/cn/csca" target="_blank" rel="noopener noreferrer">CUCAS CSCA专页</a></li>
                <li><a href="https://www.campuschina.org" target="_blank" rel="noopener noreferrer">Campus China</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>考试大纲下载</h4>
              <ul>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012552383445.pdf" target="_blank" rel="noopener noreferrer">文科中文考试大纲</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012641117574.pdf" target="_blank" rel="noopener noreferrer">理科中文考试大纲</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012714447954.pdf" target="_blank" rel="noopener noreferrer">数学考试大纲</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012768231238.pdf" target="_blank" rel="noopener noreferrer">物理考试大纲</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012823663162.pdf" target="_blank" rel="noopener noreferrer">化学考试大纲</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
