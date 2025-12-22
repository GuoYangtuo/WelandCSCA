import React, { useState } from 'react';
import { X, CreditCard, ShoppingCart, Package, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './CardWalletModal.css';

interface CardWalletModalProps {
  onClose: () => void;
}

// 卡片类型
export type CardType = 'arts_chinese' | 'science_chinese' | 'math' | 'physics' | 'chemistry';

// 卡片数据接口
interface Card {
  id: CardType;
  name: string;
  price: number;
  description: string;
  features: string[];
}

// 组合卡包接口
interface ComboPackage {
  id: string;
  name: string;
  cards: CardType[];
  originalPrice: number;
  price: number;
  discount: string;
}

const CardWalletModal: React.FC<CardWalletModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'wallet' | 'purchase'>('wallet');
  
  // 模拟用户拥有的卡片数据（实际应该从后端获取）
  const [userCards] = useState<Record<CardType, number>>({
    arts_chinese: 5,
    science_chinese: 3,
    math: 10,
    physics: 0,
    chemistry: 2,
  });

  // 卡片数据
  const cards: Card[] = [
    {
      id: 'arts_chinese',
      name: t.cardWallet?.cards?.artsChinese || '文科中文测试卡',
      price: 29.9,
      description: t.cardWallet?.cardDescription || '每张卡可用于一次完整测试',
      features: [
        t.cardWallet?.features?.aiTest || 'AI组题考试',
        t.cardWallet?.features?.onlineTest || '在线测试',
        t.cardWallet?.features?.aiAnalysis || 'AI智能分析提分策略',
      ],
    },
    {
      id: 'science_chinese',
      name: t.cardWallet?.cards?.scienceChinese || '理科中文测试卡',
      price: 29.9,
      description: t.cardWallet?.cardDescription || '每张卡可用于一次完整测试',
      features: [
        t.cardWallet?.features?.aiTest || 'AI组题考试',
        t.cardWallet?.features?.onlineTest || '在线测试',
        t.cardWallet?.features?.aiAnalysis || 'AI智能分析提分策略',
      ],
    },
    {
      id: 'math',
      name: t.cardWallet?.cards?.math || '数学测试卡',
      price: 29.9,
      description: t.cardWallet?.cardDescription || '每张卡可用于一次完整测试',
      features: [
        t.cardWallet?.features?.aiTest || 'AI组题考试',
        t.cardWallet?.features?.onlineTest || '在线测试',
        t.cardWallet?.features?.aiAnalysis || 'AI智能分析提分策略',
      ],
    },
    {
      id: 'physics',
      name: t.cardWallet?.cards?.physics || '物理测试卡',
      price: 29.9,
      description: t.cardWallet?.cardDescription || '每张卡可用于一次完整测试',
      features: [
        t.cardWallet?.features?.aiTest || 'AI组题考试',
        t.cardWallet?.features?.onlineTest || '在线测试',
        t.cardWallet?.features?.aiAnalysis || 'AI智能分析提分策略',
      ],
    },
    {
      id: 'chemistry',
      name: t.cardWallet?.cards?.chemistry || '化学测试卡',
      price: 29.9,
      description: t.cardWallet?.cardDescription || '每张卡可用于一次完整测试',
      features: [
        t.cardWallet?.features?.aiTest || 'AI组题考试',
        t.cardWallet?.features?.onlineTest || '在线测试',
        t.cardWallet?.features?.aiAnalysis || 'AI智能分析提分策略',
      ],
    },
  ];

  // 组合卡包
  const comboPackages: ComboPackage[] = [
    {
      id: 'full_package',
      name: t.cardWallet?.combos?.fullPackage || '五科全能套餐',
      cards: ['arts_chinese', 'science_chinese', 'math', 'physics', 'chemistry'],
      originalPrice: 149.5,
      price: 99.9,
      discount: '33%',
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card-wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <CreditCard size={24} />
            {t.cardWallet?.title || '我的卡包'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
          >
            <CreditCard size={18} />
            {t.cardWallet?.tabs?.myCards || '我的卡片'}
          </button>
          <button
            className={`tab-btn ${activeTab === 'purchase' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchase')}
          >
            <ShoppingCart size={18} />
            {t.cardWallet?.tabs?.purchaseCards || '购买卡片'}
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'wallet' ? (
            <div className="wallet-content">
              <div className="wallet-summary">
                <h3>{t.cardWallet?.myCardsTitle || '您拥有的测试卡'}</h3>
                <p className="wallet-hint">
                  {t.cardWallet?.walletHint || '每张测试卡可用于一次完整的科目测试'}
                </p>
              </div>
              <div className="cards-grid">
                {cards.map((card) => (
                  <div key={card.id} className="wallet-card">
                    <div className="card-header">
                      <h4>{card.name}</h4>
                      <span className="card-count">
                        x{userCards[card.id]}
                      </span>
                    </div>
                    <div className="card-features">
                      {card.features.map((feature, index) => (
                        <div key={index} className="feature-item">
                          <Check size={14} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    {userCards[card.id] === 0 && (
                      <div className="no-cards-hint">
                        {t.cardWallet?.noCards || '暂无此卡，去购买吧'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="purchase-content">
              {/* 组合卡包 */}
              <div className="combo-section">
                <div className="section-header">
                  <Package size={20} />
                  <h3>{t.cardWallet?.comboTitle || '超值组合套餐'}</h3>
                </div>
                <div className="combo-cards">
                  {comboPackages.map((combo) => (
                    <div key={combo.id} className="combo-card">
                      <div className="combo-badge">
                        {t.cardWallet?.save || '省'} {combo.discount}
                      </div>
                      <h4>{combo.name}</h4>
                      <p className="combo-description">
                        {t.cardWallet?.comboDescription || '包含所有科目测试卡各1张'}
                      </p>
                      <div className="combo-items">
                        {combo.cards.map((cardId) => {
                          const card = cards.find((c) => c.id === cardId);
                          return card ? (
                            <span key={cardId} className="combo-item">
                              {card.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                      <div className="combo-price">
                        <span className="original-price">¥{combo.originalPrice}</span>
                        <span className="current-price">¥{combo.price}</span>
                      </div>
                      <button className="buy-btn combo">
                        {t.cardWallet?.buyNow || '立即购买'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 单科卡片 */}
              <div className="single-cards-section">
                <div className="section-header">
                  <CreditCard size={20} />
                  <h3>{t.cardWallet?.singleCardsTitle || '单科测试卡'}</h3>
                </div>
                <div className="cards-grid">
                  {cards.map((card) => (
                    <div key={card.id} className="purchase-card">
                      <h4>{card.name}</h4>
                      <p className="card-description">{card.description}</p>
                      <div className="card-features">
                        {card.features.map((feature, index) => (
                          <div key={index} className="feature-item">
                            <Check size={14} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="card-price">
                        <span className="price">¥{card.price}</span>
                        <span className="price-unit">/{t.cardWallet?.perCard || '张'}</span>
                      </div>
                      <button className="buy-btn">
                        {t.cardWallet?.buyNow || '立即购买'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardWalletModal;

