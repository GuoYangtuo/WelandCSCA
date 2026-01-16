import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShoppingCart, Package, Check, Minus, Plus, ArrowLeft, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ordersAPI } from '../services/api';
import './CardWalletModal.css';

interface CardWalletModalProps {
  onClose: () => void;
}

// 卡片类型
export type CardType = 'wenke_chinese' | 'like_chinese' | 'math' | 'physics' | 'chemistry';

// 卡片数据接口
interface Card {
  id: number;
  code: CardType;
  name: string;
  price: number;
  description: string;
  features: string[];
}

// 购物车项
interface CartItem {
  card_type_id: number;
  code: CardType;
  name: string;
  price: number;
  quantity: number;
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

type ViewMode = 'wallet' | 'purchase' | 'checkout' | 'payment';

const CardWalletModal: React.FC<CardWalletModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'wallet' | 'purchase'>('wallet');
  const [viewMode, setViewMode] = useState<ViewMode>('wallet');
  
  // 用户卡片数据
  const [userCards, setUserCards] = useState<Record<CardType, number>>({
    wenke_chinese: 0,
    like_chinese: 0,
    math: 0,
    physics: 0,
    chemistry: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // 购物车状态
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // 付款弹窗状态
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [orderCreating, setOrderCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const features = [
    t.cardWallet?.features?.aiTest || 'AI Agent根据学生薄弱点从题库针对性抽题组卷',
    t.cardWallet?.features?.onlineTest || '在线模拟测试，移动端支持，随时随地做题',
    t.cardWallet?.features?.aiAnalysis || 'AI Agent把每道题都对应到考纲上具体的知识点，智能分析薄弱点，制定个性化提分策略',
    t.cardWallet?.features?.aiRecommend || 'AI Agent推荐类似题目以及相关联的知识点讲解课程资料',
    t.cardWallet?.features?.knowledgeCourse || '赠送全科知识点讲解课程资料，AI小助手在线解答知识点疑问',
    t.cardWallet?.features?.languageSupport || '题目与解析支持中英双语对照',
    t.cardWallet?.features?.tenLanguagesSupport || 'AI Agent问答支持10种语言，包括汉语，英语，法语，德语，西班牙语，葡萄牙语，意大利语，俄语，日语，韩语',
  ];

  // 卡片数据
  const cards: Card[] = [
    {
      id: 1,
      code: 'wenke_chinese',
      name: t.cardWallet?.cards?.artsChinese || '文科中文测试卡',
      price: 39.9,
      description: t.cardWallet?.cardDescription || '每张卡可提供如下功能 x 1 次',
      features: features,
    },
    {
      id: 2,
      code: 'like_chinese',
      name: t.cardWallet?.cards?.scienceChinese || '理科中文测试卡',
      price: 39.9,
      description: t.cardWallet?.cardDescription || '每张卡可提供如下功能 x 1 次',
      features: features,
    },
    {
      id: 3,
      code: 'math',
      name: t.cardWallet?.cards?.math || '数学测试卡',
      price: 39.9,
      description: t.cardWallet?.cardDescription || '每张卡可提供如下功能 x 1 次',
      features: features,
    },
    {
      id: 4,
      code: 'physics',
      name: t.cardWallet?.cards?.physics || '物理测试卡',
      price: 39.9,
      description: t.cardWallet?.cardDescription || '每张卡可提供如下功能 x 1 次',
      features: features,
    },
    {
      id: 5,
      code: 'chemistry',
      name: t.cardWallet?.cards?.chemistry || '化学测试卡',
      price: 39.9,
      description: t.cardWallet?.cardDescription || '每张卡可提供如下功能 x 1 次',
      features: features,
    },
  ];

  // 组合卡包
  const comboPackages: ComboPackage[] = [
    {
      id: 'full_package',
      name: t.cardWallet?.combos?.fullPackage || '四科全能套餐',
      cards: ['wenke_chinese', 'like_chinese', 'math', 'physics', 'chemistry'],
      originalPrice: 159.6,
      price: 129.9,
      discount: '18%',
    },
  ];

  // 加载用户卡片数据
  useEffect(() => {
    const loadUserCards = async () => {
      try {
        const response = await ordersAPI.getMyCards();
        if (response.success && response.data) {
          const cardsMap: Record<CardType, number> = {
            wenke_chinese: 0,
            like_chinese: 0,
            math: 0,
            physics: 0,
            chemistry: 0,
          };
          response.data.forEach((card: any) => {
            if (card.card_code && cardsMap.hasOwnProperty(card.card_code)) {
              cardsMap[card.card_code as CardType] = card.quantity || 0;
            }
          });
          setUserCards(cardsMap);
        }
      } catch (error) {
        console.error('加载用户卡片失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserCards();
  }, []);

  // 处理Tab切换
  const handleTabChange = (tab: 'wallet' | 'purchase') => {
    setActiveTab(tab);
    setViewMode(tab);
  };

  // 初始化购物车（所有卡片数量为0）
  const initializeCart = () => {
    const initialCart: CartItem[] = cards.map(card => ({
      card_type_id: card.id,
      code: card.code,
      name: card.name,
      price: card.price,
      quantity: 0,
    }));
    setCartItems(initialCart);
  };

  // 点击"立即购买"按钮
  const handleBuyClick = (card?: Card) => {
    initializeCart();
    if (card) {
      // 如果点击的是单张卡片，将该卡片数量设为1
      setCartItems(prev => prev.map(item => 
        item.code === card.code ? { ...item, quantity: 1 } : item
      ));
    }
    setViewMode('checkout');
  };

  // 点击购买组合套餐
  const handleBuyCombo = (combo: ComboPackage) => {
    const comboCart: CartItem[] = cards.map(card => ({
      card_type_id: card.id,
      code: card.code,
      name: card.name,
      price: card.price,
      quantity: combo.cards.includes(card.code) ? 1 : 0,
    }));
    setCartItems(comboCart);
    setViewMode('checkout');
  };

  // 更新购物车数量
  const updateQuantity = (code: CardType, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.code === code) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // 计算总价
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // 获取有效购物车项（数量大于0的）
  const getValidCartItems = () => {
    return cartItems.filter(item => item.quantity > 0);
  };

  // 创建订单并显示付款弹窗
  const handlePayment = async () => {
    const validItems = getValidCartItems();
    if (validItems.length === 0) return;

    setOrderCreating(true);
    try {
      const orderItems = validItems.map(item => ({
        card_type_id: item.card_type_id,
        quantity: item.quantity,
        price: item.price,
        card_name: item.name,
      }));
      
      const response = await ordersAPI.createOrder(orderItems, calculateTotal());
      
      if (response.success) {
        setOrderCode(response.data.order_code);
        setShowPaymentModal(true);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '创建订单失败，请重试');
    } finally {
      setOrderCreating(false);
    }
  };

  // 复制订单码
  const handleCopyOrderCode = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 关闭付款弹窗
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setOrderCode('');
    setCartItems([]);
    setViewMode('wallet');
    setActiveTab('wallet');
  };

  // 返回购买页面
  const handleBackToPurchase = () => {
    setViewMode('purchase');
    setCartItems([]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card-wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {viewMode !== 'checkout' ? (
            <div className="modal-tabs">
              <button
                className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
                onClick={() => handleTabChange('wallet')}
              >
                <CreditCard size={18} />
                {t.cardWallet?.tabs?.myCards || '我的卡片'}
              </button>
              <button
                className={`tab-btn ${activeTab === 'purchase' ? 'active' : ''}`}
                onClick={() => handleTabChange('purchase')}
              >
                <ShoppingCart size={18} />
                {t.cardWallet?.tabs?.purchaseCards || '购买卡片'}
              </button>
            </div>
          ) : (
            <button className="back-btn" onClick={handleBackToPurchase}>
              <ArrowLeft size={18} />
              {t.cardWallet?.backToPurchase || '返回选购'}
            </button>
          )}
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="card-wallet-modal-content">
          {/* 我的卡片 Tab */}
          {viewMode === 'wallet' && (
            <div className="wallet-content">
              <div className="wallet-summary">
                <h3>{t.cardWallet?.myCardsTitle || '您拥有的测试卡'}</h3>
                <p className="wallet-hint">
                  {t.cardWallet?.walletHint || '每张测试卡可用于一次完整的科目测试'}
                </p>
              </div>
              {loading ? (
                <div className="loading-state">加载中...</div>
              ) : (
                <div className="cards-grid">
                  {cards.map((card) => (
                    <div key={card.code} className="wallet-card">
                      <div className="card-header">
                        <h4>{card.name}</h4>
                        <span className="card-count">
                          x{userCards[card.code]}
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
                      {userCards[card.code] === 0 && (
                        <div className="no-cards-hint">
                          {t.cardWallet?.noCards || '暂无此卡，去购买吧'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 购买卡片 Tab */}
          {viewMode === 'purchase' && (
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
                        {combo.cards.map((cardCode, index) => {
                          const card = cards.find((c) => c.code === cardCode);
                          if (!card) return null;
                          
                          const showSeparator = index > 0;
                          const useSeparator = cardCode === 'like_chinese' ? ' / ' : '';
                          
                          return (
                            <React.Fragment key={cardCode}>
                              {showSeparator && !useSeparator && <span className="combo-separator"> </span>}
                              {useSeparator && <span className="combo-or-separator">{useSeparator}</span>}
                              <span className="combo-item">
                                {card.name}
                              </span>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="combo-price">
                        <span className="original-price">¥{combo.originalPrice}</span>
                        <span className="current-price">¥{combo.price}</span>
                      </div>
                      <button className="buy-btn combo" onClick={() => handleBuyCombo(combo)}>
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
                    <div key={card.code} className="purchase-card">
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
                      <button className="buy-btn" onClick={() => handleBuyClick(card)}>
                        {t.cardWallet?.buyNow || '立即购买'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 结算页面 */}
          {viewMode === 'checkout' && (
            <div className="checkout-content">
              <div className="checkout-summary">
                <h3>
                  <ShoppingCart size={20} />
                  {t.cardWallet?.selectCards || '选择卡片数量'}
                </h3>
                <p className="checkout-hint">
                  {t.cardWallet?.checkoutHint || '调整每种卡片的购买数量'}
                </p>
              </div>

              <div className="checkout-items">
                {cards.map((card) => {
                  const cartItem = cartItems.find(item => item.code === card.code);
                  const quantity = cartItem?.quantity || 0;
                  
                  return (
                    <div key={card.code} className={`checkout-item ${quantity > 0 ? 'active' : ''}`}>
                      <div className="checkout-item-info">
                        <h4>{card.name}</h4>
                        <span className="checkout-item-price">¥{card.price}/张</span>
                      </div>
                      <div className="checkout-item-controls">
                        <button 
                          className="qty-btn"
                          onClick={() => updateQuantity(card.code, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="qty-value">{quantity}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => updateQuantity(card.code, 1)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="checkout-item-subtotal">
                        ¥{(card.price * quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-footer">
                <div className="checkout-total">
                  <span className="total-label">{t.cardWallet?.total || '总计'}:</span>
                  <span className="total-amount">¥{calculateTotal().toFixed(2)}</span>
                </div>
                <button 
                  className="pay-btn"
                  onClick={handlePayment}
                  disabled={getValidCartItems().length === 0 || orderCreating}
                >
                  {orderCreating 
                    ? (t.cardWallet?.creating || '创建订单中...')
                    : (t.cardWallet?.payNow || '立即付款')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 付款弹窗 */}
        {showPaymentModal && (
          <div className="payment-modal-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal">
              <div className="payment-modal-header">
                <h3>
                  <CreditCard size={22} />
                  {t.cardWallet?.paymentTitle || '扫码付款'}
                </h3>
                <button className="close-btn" onClick={handleClosePaymentModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="payment-modal-body">
                <div className="order-code-section">
                  <div className="order-code-label">{t.cardWallet?.orderCode || '订单码'}</div>
                  <div className="order-code-value">
                    <span className="order-code">{orderCode}</span>
                    <button className="copy-btn" onClick={handleCopyOrderCode}>
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                      {copied ? (t.cardWallet?.copied || '已复制') : (t.cardWallet?.copy || '复制')}
                    </button>
                  </div>
                </div>

                <div className="payment-amount">
                  <span className="amount-label">{t.cardWallet?.payAmount || '付款金额'}:</span>
                  <span className="amount-value">¥{calculateTotal().toFixed(2)}</span>
                </div>

                <div className="qrcode-section">
                  <img 
                    src="/AliPayQRCode.jpg" 
                    alt="支付宝收款码" 
                    className="payment-qrcode"
                  />
                </div>

                <div className="payment-warning">
                  <AlertCircle size={18} />
                  <div className="warning-text">
                    <p className="warning-title">{t.cardWallet?.importantNotice || '重要提示'}</p>
                    <p className="warning-content">
                      {t.cardWallet?.paymentNote || `付款时请务必在备注中填写订单码：`}
                      <strong>{orderCode}</strong>
                    </p>
                    <p className="warning-sub">
                      {t.cardWallet?.paymentNoteSub || '我们会在收到付款后尽快为您发放卡片'}
                    </p>
                  </div>
                </div>

                <div className="payment-steps">
                  <div className="step">
                    <span className="step-number">1</span>
                    <span className="step-text">{t.cardWallet?.step1 || '打开支付宝扫一扫'}</span>
                  </div>
                  <div className="step">
                    <span className="step-number">2</span>
                    <span className="step-text">{t.cardWallet?.step2 || '扫描上方二维码'}</span>
                  </div>
                  <div className="step">
                    <span className="step-number">3</span>
                    <span className="step-text">{t.cardWallet?.step3 || '付款时备注订单码'}</span>
                  </div>
                </div>
              </div>

              <div className="payment-modal-footer">
                <button className="done-btn" onClick={handleClosePaymentModal}>
                  {t.cardWallet?.paymentDone || '我已完成付款'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardWalletModal;
