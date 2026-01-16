import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // 处理下载大纲点击
  const handleSyllabusClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLoginModal();
    }
    // 如果已登录，链接会正常跳转
  };

  const subjects = [
    {
      name: t.home.subjects.chinese.name,
      icon: Languages,
      description: t.home.subjects.chinese.description,
      details: t.home.subjects.chinese.details,
      color: '#E74C3C'
    },
    {
      name: t.home.subjects.math.name,
      icon: Calculator,
      description: t.home.subjects.math.description,
      details: t.home.subjects.math.details,
      color: '#3498DB'
    },
    {
      name: t.home.subjects.physics.name,
      icon: Target,
      description: t.home.subjects.physics.description,
      details: t.home.subjects.physics.details,
      color: '#9B59B6'
    },
    {
      name: t.home.subjects.chemistry.name,
      icon: FlaskConical,
      description: t.home.subjects.chemistry.description,
      details: t.home.subjects.chemistry.details,
      color: '#27AE60'
    }
  ];

  const timeline = [
    {
      date: t.home.timeline.first.date,
      title: t.home.timeline.first.title,
      description: t.home.timeline.first.description,
      status: 'upcoming'
    },
    {
      date: t.home.timeline.second.date,
      title: t.home.timeline.second.title,
      description: t.home.timeline.second.description,
      status: 'future'
    },
    {
      date: t.home.timeline.third.date,
      title: t.home.timeline.third.title,
      description: t.home.timeline.third.description,
      status: 'future'
    },
    {
      date: t.home.timeline.fourth.date,
      title: t.home.timeline.fourth.title,
      description: t.home.timeline.fourth.description,
      status: 'future'
    }
  ];

  const faqs = [
    {
      question: t.home.faq.q1,
      answer: t.home.faq.a1
    },
    {
      question: t.home.faq.q2,
      answer: t.home.faq.a2
    },
    {
      question: t.home.faq.q3,
      answer: t.home.faq.a3
    },
    {
      question: t.home.faq.q4,
      answer: t.home.faq.a4
    },
    {
      question: t.home.faq.q5,
      answer: t.home.faq.a5
    }
  ];

  const stats = [
    { value: '307+', label: t.home.stats.universities },
    { value: '4', label: t.home.stats.subjects },
    { value: '5', label: t.home.stats.sessions },
    { value: '2年', label: t.home.stats.validity }
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
            <span className="title-highlight">{t.home.heroTitle}</span>
            <span className="title-line">{t.home.heroSubtitle}</span>
          </h1>
          <p className="hero-description">
            {t.home.heroDescription}
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/basic-test" className="btn btn-gold">
                  <span>{t.home.startTest}</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/study" className="btn btn-outline-light">
                  {t.home.studyTraining}
                </Link>
              </>
            ) : (
              <p className="hero-login-hint">
                <Info size={18} />
                {t.home.pleaseLoginHint}
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
            <h2 className="section-title">{t.home.whyChooseUs}</h2>
          </div>
          <div className="about-content">
            <div className="about-main">
              <p className="about-lead">
                <strong>China CSCA</strong>{t.home.aboutLead}
              </p>
              <p>
                {t.home.aboutP1}
              </p>
              <p>
              <strong>Weland Global Education {t.home.aboutP2}</strong>
              </p>
              <div className="about-highlights">
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4>{t.home.standardizedEvaluation}</h4>
                    <p>{t.home.standardizedEvaluationDesc}</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <Globe2 size={22} />
                  </div>
                  <div>
                    <h4>{t.home.globalRecognition}</h4>
                    <p>{t.home.globalRecognitionDesc}</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h4>{t.home.flexibleSchedule}</h4>
                    <p>{t.home.flexibleScheduleDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-sidebar">
              <div className="platform-advantages">
                <h3 className="advantages-title">
                  <Sparkles size={20} />
                  {t.home.platformAdvantages}
                </h3>
                <div className="advantages-list">
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Bot size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>{t.home.aiAssistant}</h4>
                      <p>{t.home.aiAssistantDesc}</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Library size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>{t.home.massiveQuestions}</h4>
                      <p>{t.home.massiveQuestionsDesc}</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Brain size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>{t.home.smartAnalysis}</h4>
                      <p>{t.home.smartAnalysisDesc}</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <TrendingUp size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>{t.home.progressTracking}</h4>
                      <p>{t.home.progressTrackingDesc}</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Globe size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>{t.home.multiLanguage}</h4>
                      <p>{t.home.multiLanguageDesc}</p>
                    </div>
                  </div>
                  <div className="advantage-item">
                    <div className="advantage-icon">
                      <Zap size={18} />
                    </div>
                    <div className="advantage-content">
                      <h4>{t.home.mockExamSystem}</h4>
                      <p>{t.home.mockExamSystemDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="timeline-card">
                <h4>{t.home.examDevelopment}</h4>
                <ul>
                  <li><span>{t.home.year2025}</span>{t.home.established}</li>
                  <li><span>{t.home.year2026}</span>{t.home.fullImplementation}</li>
                  <li><span>{t.home.year2028}</span>{t.home.expandPlan}</li>
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
            <h2 className="section-title">{t.home.fourCoreSubjects}</h2>
            <p className="section-desc">{t.home.subjectsDesc}</p>
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
              <strong>{t.home.paperLanguage}</strong>{t.home.subjectsNote}
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header light">
            <h2 className="section-title">{t.home.examSchedule}</h2>
            <p className="section-desc">{t.home.planYourSchedule}</p>
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
            <h4>{t.home.examTimeArrangement}</h4>
            <div className="schedule-table">
              <div className="schedule-row header">
                <span>{t.home.scheduleHeader.subject}</span>
                <span>{t.home.scheduleHeader.time}</span>
                <span>{t.home.scheduleHeader.duration}</span>
              </div>
              <div className="schedule-row">
                <span>{t.home.schedule.chinese}</span>
                <span>08:30 - 10:30</span>
                <span>120{t.home.schedule.minutes}</span>
              </div>
              <div className="schedule-row">
                <span>{t.home.schedule.math}</span>
                <span>11:00 - 13:00</span>
                <span>120{t.home.schedule.minutes}</span>
              </div>
              <div className="schedule-row">
                <span>{t.home.schedule.physics}</span>
                <span>14:30 - 15:30</span>
                <span>60{t.home.schedule.minutes}</span>
              </div>
              <div className="schedule-row">
                <span>{t.home.schedule.chemistry}</span>
                <span>16:00 - 17:00</span>
                <span>60{t.home.schedule.minutes}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section className="registration-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.home.registrationAndFee}</h2>
          </div>
          <div className="reg-grid">
            <div className="reg-card">
              <div className="reg-icon">
                <Upload size={24} />
              </div>
              <h4>{t.home.registration.method}</h4>
              <p dangerouslySetInnerHTML={{ __html: t.home.registration.methodDesc }}></p>
            </div>
            <div className="reg-card">
              <div className="reg-icon">
                <CreditCard size={24} />
              </div>
              <h4>{t.home.registration.fee}</h4>
              <div className="price-info">
                <div className="price-item">
                  <span className="price">¥450</span>
                  <span className="price-label">{t.home.registration.single}</span>
                </div>
                <div className="price-divider"></div>
                <div className="price-item">
                  <span className="price">¥700</span>
                  <span className="price-label">{t.home.registration.twoOrMore}</span>
                </div>
              </div>
            </div>
            <div className="reg-card">
              <div className="reg-icon">
                <Shield size={24} />
              </div>
              <h4>{t.home.registration.payment}</h4>
              <p>{t.home.registration.paymentDesc}</p>
            </div>
            <div className="reg-card">
              <div className="reg-icon">
                <Clock size={24} />
              </div>
              <h4>{t.home.registration.scoreRelease}</h4>
              <p dangerouslySetInnerHTML={{ __html: t.home.registration.scoreReleaseDesc }}></p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t.home.faqTag}</span>
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
            <h2>{t.home.readyToStart}</h2>
            <p>{t.home.ctaDesc}</p>
            <div className="cta-features">
              <div className="cta-feature">
                <BookOpen size={20} />
                <span>{t.home.ctaFeatures.systematicLearning}</span>
              </div>
              <div className="cta-feature">
                <FileText size={20} />
                <span>{t.home.ctaFeatures.mockPractice}</span>
              </div>
              <div className="cta-feature">
                <BarChart3 size={20} />
                <span>{t.home.ctaFeatures.smartTracking}</span>
              </div>
            </div>
            {isAuthenticated ? (
              <div className="cta-actions">
                <Link to="/study" className="btn btn-gold btn-lg">
                  {t.home.startStudyTraining}
                </Link>
                <Link to="/basic-test" className="btn btn-outline-gold btn-lg">
                  {t.home.goToBasicTest}
                </Link>
                <Link to="/mock-test" className="btn btn-outline-gold btn-lg">
                  {t.home.mockTestBtn}
                </Link>
              </div>
            ) : (
              <div className="cta-login">
                <p>{t.home.loginToStart}</p>
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
              <h4>{t.home.examRequirements}</h4>
              <ul>
                <li>{t.home.requirements.os}</li>
                <li>{t.home.requirements.resolution}</li>
                <li>{t.home.requirements.memory}</li>
                <li>{t.home.requirements.bandwidth}</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{t.home.officialResources}</h4>
              <ul>
                <li><a href="https://www.csca.cn" target="_blank" rel="noopener noreferrer" onClick={handleSyllabusClick}>{t.home.cscaWebsite}</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012552383445.pdf" target="_blank" rel="noopener noreferrer" onClick={handleSyllabusClick}>{t.home.syllabus.artsChinese}</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012641117574.pdf" target="_blank" rel="noopener noreferrer" onClick={handleSyllabusClick}>{t.home.syllabus.scienceChinese}</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012714447954.pdf" target="_blank" rel="noopener noreferrer" onClick={handleSyllabusClick}>{t.home.syllabus.math}</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012768231238.pdf" target="_blank" rel="noopener noreferrer" onClick={handleSyllabusClick}>{t.home.syllabus.physics}</a></li>
                <li><a href="https://www.cucas.cn/uploads/school/2025/1021/1761012823663162.pdf" target="_blank" rel="noopener noreferrer" onClick={handleSyllabusClick}>{t.home.syllabus.chemistry}</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{t.home.contactUs}</h4>
              <ul>
                <li><strong>{t.home.contact.email}:</strong> <a href="mailto:csca@weland.group">csca@weland.group</a></li>
                <li><strong>{t.home.contact.address}:</strong></li>
                <li>{t.home.contact.addressLine1}</li>
                <li>{t.home.contact.addressLine2}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
