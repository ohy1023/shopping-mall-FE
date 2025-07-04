import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Cart.css';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  // 1. 페이지 진입 시 init-cart-items 호출 및 장바구니 목록 조회
  useEffect(() => {
    const initCart = async () => {
      try {
        const resInit = await axios.post('/api/v1/carts/init-cart-items');
        if (resInit.data?.resultCode !== 'SUCCESS') {
          alert('장바구니 초기화에 실패했습니다.');
          navigate('/');
          return;
        }
        const res = await axios.get('/api/v1/carts');
        const result = res.data.result.content;
        const items = Array.isArray(result) ? result : [];
        setCartItems(items);
        // 모든 아이템을 체크된 상태로 초기화
        setCheckedItems(items.map((item) => item.itemUuid));
      } catch (err) {
        alert('장바구니 정보를 불러오지 못했습니다.');
      }
    };
    initCart();
  }, [navigate]);

  // 아임포트 스크립트 로딩
  useEffect(() => {
    const scriptsAdded = [];
    const loadScript = (src, callback) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.onload = callback;
      document.head.appendChild(script);
      scriptsAdded.push(script);
    };
    loadScript('https://code.jquery.com/jquery-1.12.4.min.js', () => {
      loadScript('https://cdn.iamport.kr/js/iamport.payment-1.2.0.js', () => {
        if (window.IMP) {
          window.IMP.init(process.env.REACT_APP_IMPORT_IMP);
        }
      });
    });
    return () => {
      scriptsAdded.forEach((script) => script.remove());
    };
  }, []);

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/api/v1/customers');
      setUserInfo(response.data.result);
    } catch (error) {
      // 예외 처리
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // 체크박스 핸들러
  const handleCheck = (itemUuid) => {
    setCheckedItems((prev) =>
      prev.includes(itemUuid)
        ? prev.filter((id) => id !== itemUuid)
        : [...prev, itemUuid]
    );
  };

  // 실제 주문 처리
  const handleOrder = async () => {
    let merchantUid = '';
    try {
      console.log('주문 처리 시작');
      console.log('사용자 정보:', userInfo);
      console.log('선택된 아이템:', checkedItems);
      console.log('총 금액:', discountedTotal);

      // 1. 사전 검증
      console.log('사전 검증 요청 시작');
      const prepRes = await axios.post('/api/v1/orders/preparation', {
        totalPrice: discountedTotal,
      });
      console.log('사전 검증 응답:', prepRes.data);
      if (prepRes.data.resultCode !== 'SUCCESS') {
        alert('사전 검증 실패');
        return;
      }
      merchantUid = prepRes.data.result.merchantUid;
      console.log('merchantUid:', merchantUid);

      // 2. 주문 생성 - 아이템 정보를 올바른 형식으로 전달
      const orderItems = cartItems
        .filter((item) => checkedItems.includes(item.itemUuid))
        .map((item) => ({
          itemUuid: item.itemUuid,
          itemCnt: item.itemCnt,
        }));

      const requestData = {
        recipientName: userInfo?.userName || '',
        recipientTel: userInfo?.tel || '',
        recipientCity: userInfo?.address?.city || '',
        recipientStreet: userInfo?.address?.street || '',
        recipientDetail: userInfo?.address?.detail || '',
        recipientZipcode: userInfo?.address?.zipcode || '',
        orderItems: orderItems,
        merchantUid: merchantUid,
      };

      console.log('주문 생성 요청 데이터:', requestData);
      console.log('사용자 정보 상세:', userInfo);
      console.log('주소 정보:', userInfo?.address);
      console.log('orderItems 상세:', orderItems);

      console.log('주문 생성 요청 시작');
      const orderRes = await axios.post('/api/v1/orders/cart', requestData);
      console.log('주문 생성 응답:', orderRes.data);
      if (orderRes.data.resultCode !== 'SUCCESS') {
        alert('주문 생성 실패');
        return;
      }

      // 3. 결제창 띄우기 (아임포트)
      if (!window.IMP) {
        alert('결제 모듈이 준비되지 않았습니다.');
        return;
      }
      // 결제창에 표시할 상품명 가공
      const checkedOrderItems = cartItems.filter((item) =>
        checkedItems.includes(item.itemUuid)
      );
      let payName = '';
      if (checkedOrderItems.length === 1) {
        payName = checkedOrderItems[0].itemName;
      } else if (checkedOrderItems.length > 1) {
        payName = `${checkedOrderItems[0].itemName} 외 ${
          checkedOrderItems.length - 1
        }건`;
      }
      window.IMP.request_pay(
        {
          pg: 'html5_inicis',
          pay_method: 'card',
          merchant_uid: merchantUid,
          name: payName,
          amount: discountedTotal,
          buyer_email: userInfo.email,
          buyer_name: userInfo.userName,
          buyer_tel: userInfo.tel,
          buyer_addr: `${userInfo.address.city} ${userInfo.address.street} ${userInfo.address.detail}`,
          buyer_postcode: userInfo.address.zipcode,
        },
        async function (rsp) {
          if (rsp.success) {
            // 4. 사후 검증
            try {
              const postRes = await axios.post('/api/v1/orders/verification', {
                merchantUid: merchantUid,
                impUid: rsp.imp_uid,
              });
              if (postRes.data.resultCode === 'SUCCESS') {
                alert('결제 완료');
                navigate(`/order/complete/${merchantUid}`);
              } else {
                // 사후 검증 실패 시 결제 취소
                const itemUuidList = cartItems
                  .filter((item) => checkedItems.includes(item.itemUuid))
                  .map((item) => item.itemUuid);
                await axios.delete(`/api/v1/orders/${merchantUid}`, {
                  data: {
                    impUid: rsp.imp_uid,
                    itemUuidList: itemUuidList,
                  },
                });
                alert('사후 검증 실패로 인한 결제 취소');
              }
            } catch (error) {
              // 사후 검증 자체가 404 등으로 실패한 경우에도 결제 취소
              const itemUuidList = cartItems
                .filter((item) => checkedItems.includes(item.itemUuid))
                .map((item) => item.itemUuid);
              await axios.delete(`/api/v1/orders/${merchantUid}`, {
                data: {
                  impUid: rsp.imp_uid,
                  itemUuidList: itemUuidList,
                },
              });
              alert('사후 검증 실패로 인한 결제 취소');
            }
          } else {
            // 결제 실패 시 롤백
            try {
              await axios.post('/api/v1/orders/rollback', {
                merchantUid: merchantUid,
              });
            } catch (error) {}
          }
        }
      );
    } catch (err) {
      console.error('주문 처리 중 오류:', err);
      console.error('에러 응답:', err.response?.data);
      console.error('에러 상태:', err.response?.status);
      console.error('에러 URL:', err.config?.url);

      if (err.response?.status === 404) {
        alert(`404 에러: ${err.config?.url} 엔드포인트를 찾을 수 없습니다.`);
      } else {
        alert(
          `주문 처리 중 오류: ${err.response?.data?.message || err.message}`
        );
      }

      if (merchantUid) {
        try {
          await axios.post('/api/v1/orders/rollback', { merchantUid });
        } catch (rollbackErr) {
          console.error('롤백 실패:', rollbackErr);
        }
      }
    }
  };

  // 체크된 상품의 총합(멤버십 할인 적용)
  const discountRate = userInfo?.discountRate || 0;
  const checkedTotal = cartItems
    .filter((item) => checkedItems.includes(item.itemUuid))
    .reduce((sum, item) => sum + (item.price || 0) * item.itemCnt, 0);
  const discountedTotal = Math.round(checkedTotal * (1 - discountRate));

  return (
    <div className="cart-page">
      <h2>장바구니</h2>
      {/* 내 정보 카드 */}
      {userInfo && (
        <div className="user-info-card">
          <div className="user-info-row">
            <span className="user-label">이름</span>
            <span className="user-value">{userInfo.userName}</span>
          </div>
          <div className="user-info-row">
            <span className="user-label">이메일</span>
            <span className="user-value">{userInfo.email}</span>
          </div>
          <div className="user-info-row">
            <span className="user-label">멤버십</span>
            <span className="user-value">
              {userInfo.membershipName || '일반 회원'}
            </span>
          </div>
          <div className="user-info-row">
            <span className="user-label">할인률</span>
            <span className="user-value">{discountRate}%</span>
          </div>
          <div className="user-info-row">
            <span className="user-label">전화번호</span>
            <span className="user-value">{userInfo.tel}</span>
          </div>
          <div className="user-info-row">
            <span className="user-label">주소</span>
            <span className="user-value">
              {userInfo.address?.city} {userInfo.address?.street}{' '}
              {userInfo.address?.detail} ({userInfo.address?.zipcode})
            </span>
          </div>
        </div>
      )}
      {Array.isArray(cartItems) && cartItems.length === 0 ? (
        <p>장바구니에 담긴 상품이 없습니다.</p>
      ) : (
        <form>
          <ul className="cart-list">
            {Array.isArray(cartItems) &&
              cartItems.map((item) => (
                <li key={item.itemUuid} className="cart-item">
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(item.itemUuid)}
                    onChange={() => handleCheck(item.itemUuid)}
                  />
                  <img
                    src={item.thumbnail}
                    alt={item.itemName}
                    width={60}
                    style={{ marginRight: 8 }}
                  />
                  <span>
                    {item.itemName} (수량: {item.itemCnt})
                  </span>
                  <span style={{ marginLeft: 8 }}>
                    {item.price?.toLocaleString()}원
                  </span>
                </li>
              ))}
          </ul>
          {/* 총합 표시 */}
          <div
            className="cart-total-row"
            style={{ flexDirection: 'column', alignItems: 'flex-end' }}
          >
            <div>
              <span style={{ color: '#888' }}>선택 상품 총합(할인 전): </span>
              <span style={{ fontWeight: 700, color: '#333', marginLeft: 8 }}>
                {checkedTotal.toLocaleString()}원
              </span>
            </div>
            <div>
              <span style={{ color: '#888' }}>멤버십 할인 적용 후: </span>
              <span
                style={{ fontWeight: 700, color: '#f5576c', marginLeft: 8 }}
              >
                {discountedTotal.toLocaleString()}원
                {discountRate > 0 && (
                  <span
                    style={{
                      color: '#667eea',
                      fontSize: '0.95em',
                      marginLeft: 8,
                    }}
                  >
                    (할인 적용)
                  </span>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="buy-btn"
            onClick={handleOrder}
            disabled={checkedItems.length === 0}
          >
            구매하기
          </button>
        </form>
      )}
    </div>
  );
};

export default Cart;
