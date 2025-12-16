import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  Info,
  CheckCircle2,
  Globe2,
  Calendar,
  Upload,
  CreditCard,
  Shield,
  Clock,
  BookOpen,
  FileText,
  BarChart3,
  ChevronDown,
  Sparkles,
  Target,
  FlaskConical,
  Calculator,
  Languages,
  Bot,
  Library,
  TrendingUp,
  Brain,
  Globe,
  Zap
} from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // 处理下载大纲点击
  const handleSyllabusClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLoginModal();
    }
    // 如果已登录，链接会正常跳转
  };

  const subjects = [
    {
      name: '专业中文',
      icon: Languages,
      description: '分为文科中文和理科中文两类',
      details: '申请中文授课本科专业需根据专业类别参加相应测试；申请全英文授课本科无需参加；持有效期内HSK四级可免考',
      color: '#E74C3C'
    },
    {
      name: '数学',
      icon: Calculator,
      description: '所有申请人必考科目',
      details: '考察基础学业和逻辑思维能力的重要依据，涵盖等差/等比数列、椭圆、函数、斜率等知识点',
      color: '#3498DB'
    },
    {
      name: '物理',
      icon: Target,
      description: '选考科目',
      details: '申请理、工、农、医类专业需至少选择物理或化学其中一门',
      color: '#9B59B6'
    },
    {
      name: '化学',
      icon: FlaskConical,
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
          <h1 className="hero-title">
            <span className="title-highlight">Weland-CSCA在线培训平台</span>
            <span className="title-line">全球首家AI辅助系统</span>
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
                  <ArrowRight size={18} />
                </Link>
                <Link to="/study" className="btn btn-outline-light">
                  学习训练
                </Link>
              </>
            ) : (
              <p className="hero-login-hint">
                <Info size={18} />
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
            <h2 className="section-title">为什么选择 Weland-CSCA？</h2>
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
              <p>
              <strong>Weland Global Education 作为全球AI教育平台，为全球学者提供定制化、高效率的CSCA考试培训和模拟测试服务。帮助学者快速提升CSCA考试成绩，提高被中国大学录取的几率。Weland-CSCA是Weland平台官方项目之一</strong>
              </p>
              <div className="about-highlights">
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4>标准化评估</h4>
                    <p>统一的学术能力测试标准</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <Globe2 size={22} />
                  </div>
                  <div>
                    <h4>全球认可</h4>
                    <p>307所中国高校认可</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h4>灵活安排</h4>
                    <p>每年5次考试机会</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-sidebar">
              <div className="platform-advantages">
                <h3 className="advantages-title">
                  <Sparkles size={20} />
                  平台核心优势
                </h3>
                <div className="advantages-list">
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Bot size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>AI智能辅助</h4>
                      <p>AI智能小助手，实时解答学习疑问</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Library size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>海量真题题库</h4>
                      <p>紧贴官方考试大纲的专业题库</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Brain size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>智能错题分析</h4>
                      <p>自动分析薄弱环节，针对性训练</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <TrendingUp size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>学习进度追踪</h4>
                      <p>AI小助手追踪学习情况，实时掌握备考进度</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Globe size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>多语言支持</h4>
                      <p>多国语言界面，全球适用</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Zap size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>模拟考试系统</h4>
                      <p>还原真实考试环境与节奏</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="timeline-card">
                <h4>考试发展历程</h4>
                <ul>
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
            <h2 className="section-title">四大核心科目</h2>
            <p className="section-desc">根据申请专业选择相应的考试科目组合</p>
          </div>
          <div className="subjects-grid">
            {subjects.map((subject, index) => {
              const IconComponent = subject.icon;
              return (
                <div 
                  key={index} 
                  className="subject-card"
                  style={{ '--accent-color': subject.color } as React.CSSProperties}
                >
                  <div className="subject-icon">
                    <IconComponent size={32} strokeWidth={1.5} />
                  </div>
                  <h3>{subject.name}</h3>
                  <p className="subject-type">{subject.description}</p>
                  <p className="subject-details">{subject.details}</p>
                  <div className="subject-decoration"></div>
                </div>
              );
            })}
          </div>
          <div className="subjects-note">
            <Info size={18} />
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
            <h2 className="section-title">考试时间</h2>
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
            <h2 className="section-title">报名与费用</h2>
          </div>
          <div className="reg-grid">
            <div className="reg-card">
              <div className="reg-icon">
                <Upload size={24} />
              </div>
              <h4>报名方式</h4>
              <p>通过CSCA官网 <strong>www.csca.cn</strong> 完成线上报名，支持中英文双语操作</p>
            </div>
            <div className="reg-card">
              <div className="reg-icon">
                <CreditCard size={24} />
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
                <Shield size={24} />
              </div>
              <h4>支付方式</h4>
              <p>支持支付宝、微信、银联以及VISA和MasterCard等境内外主流支付方式</p>
            </div>
            <div className="reg-card">
              <div className="reg-icon">
                <Clock size={24} />
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
                    <ChevronDown size={20} />
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
                <BookOpen size={20} />
                <span>分章节系统学习</span>
              </div>
              <div className="cta-feature">
                <FileText size={20} />
                <span>真题模拟练习</span>
              </div>
              <div className="cta-feature">
                <BarChart3 size={20} />
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
                <li><a href="https://www.campuschina.org" target="_blank" rel="noopener noreferrer">Campus China</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>考试大纲下载</h4>
              <ul>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012552383445.pdf" target="_blank" rel="noopener noreferrer" onClick={(e) => handleSyllabusClick(e, 'https://www.cucas.cn/uploads/school/2025/1021/1761012552383445.pdf')}>文科中文考试大纲</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012641117574.pdf" target="_blank" rel="noopener noreferrer" onClick={(e) => handleSyllabusClick(e, 'https://www.cucas.cn/uploads/school/2025/1021/1761012641117574.pdf')}>理科中文考试大纲</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012714447954.pdf" target="_blank" rel="noopener noreferrer" onClick={(e) => handleSyllabusClick(e, 'https://www.cucas.cn/uploads/school/2025/1021/1761012714447954.pdf')}>数学考试大纲</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012768231238.pdf" target="_blank" rel="noopener noreferrer" onClick={(e) => handleSyllabusClick(e, 'https://www.cucas.cn/uploads/school/2025/1021/1761012768231238.pdf')}>物理考试大纲</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012823663162.pdf" target="_blank" rel="noopener noreferrer" onClick={(e) => handleSyllabusClick(e, 'https://www.cucas.cn/uploads/school/2025/1021/1761012823663162.pdf')}>化学考试大纲</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
