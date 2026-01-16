import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CardWalletModal from '../components/CardWalletModal';
import {
  Check,
  Sparkles,
  Brain,
  Smartphone,
  Target,
  BookOpen,
  Languages,
  Globe,
  Gift,
  ArrowRight,
  Zap
} from 'lucide-react';
import './Pricing.css';

const Pricing: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Brain,
      titleKey: 'aiTargetedQuestions',
      descKey: 'aiTargetedQuestionsDesc',
      image: '/pricing/ai-question.png',
      imageAlt: 'AI智能组卷'
    },
    {
      icon: Smartphone,
      titleKey: 'mobileSupport',
      descKey: 'mobileSupportDesc',
      image: '/pricing/mobile-test.png',
      imageAlt: '移动端支持'
    },
    {
      icon: Target,
      titleKey: 'smartAnalysis',
      descKey: 'smartAnalysisDesc',
      image: '/pricing/smart-analysis.png',
      imageAlt: '智能分析'
    },
    {
      icon: BookOpen,
      titleKey: 'aiRecommend',
      descKey: 'aiRecommendDesc',
      image: '/pricing/ai-recommend.png',
      imageAlt: 'AI推荐'
    },
    {
      icon: Languages,
      titleKey: 'bilingualSupport',
      descKey: 'bilingualSupportDesc',
      image: '/pricing/bilingual.png',
      imageAlt: '中英双语'
    },
    {
      icon: Globe,
      titleKey: 'multiLanguageAI',
      descKey: 'multiLanguageAIDesc',
      image: '/pricing/multi-language.png',
      imageAlt: '多语言AI'
    }
  ];

  return (
    <div className="pricing-page">
      {/* Hero Section */}
      <section className="pricing-hero">
        <div className="pricing-hero-bg">
          <div className="pricing-hero-pattern"></div>
        </div>
        <div className="pricing-hero-content">
          <div className="pricing-badge">
            <Sparkles size={16} />
            <span>{t.pricing?.badge || '定价策略'}</span>
          </div>
          <h1 className="pricing-title">
            {t.pricing?.heroTitle || 'Weland-CSCA 产品定价'}
          </h1>
          <p className="pricing-subtitle">
            {t.pricing?.heroSubtitle || '为您的CSCA备考之旅提供最专业的支持'}
          </p>
        </div>
        <div className="pricing-hero-decoration">
          <div className="deco-circle deco-1"></div>
          <div className="deco-circle deco-2"></div>
        </div>
      </section>

      {/* Free Section */}
      <section className="pricing-free-section">
        <div className="container">
          <div className="free-card">
            <div className="free-card-icon">
              <Gift size={32} />
            </div>
            <div className="free-card-content">
              <h2>{t.pricing?.freeTestTitle || '基础中文水平测试'}</h2>
              <div className="free-price">
                <span className="price-value">{t.pricing?.free || '免费'}</span>
                <span className="price-note">{t.pricing?.comingSoon || '（暂未可用）'}</span>
              </div>
              <p className="free-desc">
                {t.pricing?.freeTestDesc || '帮助您了解自己的中文水平基础，为后续学习做好准备'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Test Card Section */}
      <section className="pricing-card-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.pricing?.testCardTitle || '测试卡'}</h2>
            <p className="section-desc">{t.pricing?.testCardDesc || '一张测试卡包含以下完整服务'}</p>
          </div>
          
          <div className="card-includes">
            <div className="include-item">
              <div className="include-icon">
                <Zap size={24} />
              </div>
              <div className="include-content">
                <h3>{t.pricing?.onlineTest || '在线测试 1 次'}</h3>
                <p>{t.pricing?.onlineTestDesc || 'AI从题库针对性抽题组卷，模拟真实考试环境'}</p>
              </div>
            </div>
            <div className="include-item">
              <div className="include-icon">
                <Brain size={24} />
              </div>
              <div className="include-content">
                <h3>{t.pricing?.aiAnalysis || 'AI分析 1 次'}</h3>
                <p>{t.pricing?.aiAnalysisDesc || '智能分析薄弱点，制定个性化提分策略'}</p>
              </div>
            </div>
            <div className="include-item bonus">
              <div className="include-icon">
                <BookOpen size={24} />
              </div>
              <div className="include-content">
                <h3>{t.pricing?.freeCourse || '免费课程资料'}</h3>
                <p>{t.pricing?.freeCourseDesc || '购买测试卡后可免费查看课程资料（包括各科知识点和考试指南）'}</p>
              </div>
              <div className="bonus-tag">{t.pricing?.bonusTag || '赠送'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pricing-features-section">
        <div className="container">
          <div className="section-header light">
            <h2 className="section-title">{t.pricing?.featuresTitle || '测试与AI分析功能详解'}</h2>
            <p className="section-desc">{t.pricing?.featuresDesc || '我们提供全方位的AI智能备考支持'}</p>
          </div>

          <div className="features-list">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const isEven = index % 2 === 1;
              const featuresData = t.pricing?.features as Record<string, string | string[]> | undefined;
              const title = featuresData?.[feature.titleKey] as string || feature.titleKey;
              const description = featuresData?.[feature.descKey] as string || feature.descKey;
              const highlights = featuresData?.[`${feature.titleKey}Highlights`] as string[] || [];
              return (
                <div key={index} className={`feature-row ${isEven ? 'reverse' : ''}`}>
                  <div className="feature-content">
                    <div className="feature-icon-wrapper">
                      <IconComponent size={28} />
                    </div>
                    <h3 className="feature-title">
                      {title}
                    </h3>
                    <p className="feature-description">
                      {description}
                    </p>
                    <ul className="feature-highlights">
                      {highlights.map((highlight: string, idx: number) => (
                        <li key={idx}>
                          <Check size={16} />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="feature-image">
                    <div className="image-placeholder">
                      <IconComponent size={64} />
                      <span>{t.pricing?.imagePlaceholder || '功能展示图'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pricing-cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>{t.pricing?.ctaTitle || '准备好开始您的CSCA备考之旅了吗？'}</h2>
            <p>{t.pricing?.ctaDesc || '立即注册，体验AI智能备考的全新方式'}</p>
            <div className="cta-actions">
              <a href="/mock-test" className="btn btn-gold btn-lg">
                <span>{t.pricing?.ctaButton || '开始测试'}</span>
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;

