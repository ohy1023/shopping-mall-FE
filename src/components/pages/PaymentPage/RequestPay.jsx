import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import './RequestPay.css';
import { useNavigate } from 'react-router-dom';

const RequestPay = () => {
  const [itemData, setItemData] = useState(null);
  const [itemCnt, setItemCnt] = useState(1);
  const [userInfo, setUserInfo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  const discountRate = useMemo(() => userInfo?.discountRate || 0, [userInfo]);
  const discountedPrice = useMemo(
    () => (itemData ? itemData.price * itemCnt * (1 - discountRate) : 0),
    [itemData, itemCnt, discountRate]
  );

  // 이미지 슬라이드 함수들
  const nextImage = useCallback(() => {
    if (itemData && itemData.imageList && itemData.imageList.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === itemData.imageList.length - 1 ? 0 : prevIndex + 1
      );
    }
  }, [itemData]);

  const prevImage = useCallback(() => {
    if (itemData && itemData.imageList && itemData.imageList.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? itemData.imageList.length - 1 : prevIndex - 1
      );
    }
  }, [itemData]);

  // 아이템 정보를 가져오는 함수
  const fetchItemData = useCallback(async () => {
    try {
      const response = await axios.get(
        '/api/v1/items/cffb8f4d-2be3-11f0-bff7-453261748c60'
      );
      console.log('아이템 데이터:', response.data.result);
      setItemData(response.data.result);
    } catch (error) {
      console.error('아이템 데이터 가져오기 실패:', error);
    }
  }, []);

  // 사용자 정보를 가져오는 함수
  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/customers');
      const userData = response.data.result;
      setUserInfo(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      // 로컬스토리지에서 기존 정보 가져오기
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    }
  }, []);

  // 결제 요청 함수
  const requestPay = useCallback(async () => {
    if (!itemData || !userInfo) {
      console.error('아이템 데이터 또는 유저 정보가 없습니다.');
      alert('로그인 정보가 없습니다. 메인에서 다시 로그인 해주세요.');
      return;
    }

    // 1. 사전 등록 먼저 실행
    let merchantUid = null;
    try {
      const preRes = await axios.post('/api/v1/orders/preparation', {
        totalPrice: discountedPrice,
      });
      if (preRes.data.resultCode !== 'SUCCESS') {
        alert('사전 등록 실패: ' + (preRes.data.result?.msg || ''));
        return;
      }
      console.log('사전 등록 성공');
      merchantUid = preRes.data.result.merchantUid;
    } catch (error) {
      alert('사전 등록 요청 오류');
      console.error('사전 등록 요청 오류', error);
      return;
    }

    // 2. 주문 생성
    try {
      const orderRes = await axios.post('/api/v1/orders', {
        itemUuid: itemData.uuid,
        merchantUid: merchantUid,
        itemCnt: itemCnt,
        recipientName: userInfo.userName,
        recipientTel: userInfo.tel,
        recipientCity: userInfo.address.city,
        recipientStreet: userInfo.address.street,
        recipientDetail: userInfo.address.detail,
        recipientZipcode: userInfo.address.zipcode,
      });

      if (orderRes.data.resultCode !== 'SUCCESS') {
        alert('주문 생성 실패');
        return;
      }
      console.log('주문 생성 성공');

      // 3. 결제창 띄우기
      window.IMP.request_pay(
        {
          pg: 'html5_inicis',
          pay_method: 'card',
          merchant_uid: merchantUid,
          name: itemData.itemName,
          amount: discountedPrice,
          buyer_email: userInfo.email,
          buyer_name: userInfo.userName,
          buyer_tel: userInfo.tel,
          buyer_addr: `${userInfo.address.city} ${userInfo.address.street} ${userInfo.address.detail}`,
          buyer_postcode: userInfo.address.zipcode,
        },
        async function (rsp) {
          if (rsp.success) {
            // 4. 결제 성공 시 사후 검증
            try {
              const postRes = await axios.post('/api/v1/orders/verification', {
                merchantUid: merchantUid,
                impUid: rsp.imp_uid,
              });
              if (postRes.data.resultCode === 'SUCCESS') {
                alert('결제 완료 되었습니다.');
                navigate(`/order/complete/${merchantUid}`);
              } else {
                // 5. 사후 검증 실패
                alert('사후 검증 실패되었습니다.');
              }
            } catch (error) {
              alert('사후 검증 실패되었습니다.');
              console.error('사후 검증 요청 오류', error);
            }
          } else {
            try {
              await axios.post('/api/v1/orders/rollback', {
                merchantUid: merchantUid,
              });
              console.log('미결제 주문 취소 API 호출 완료');
            } catch (error) {
              console.error('미결제 주문 취소 API 호출 실패', error);
            }
          }
        }
      );
    } catch (error) {
      alert('주문 생성 요청 오류');
      console.error('주문 생성 요청 오류', error);
    }
  }, [itemData, userInfo, itemCnt, discountedPrice, navigate]);

  useEffect(() => {
    const scriptsAdded = [];
    // 외부 스크립트 로드 함수
    const loadScript = (src, callback) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.onload = callback;
      document.head.appendChild(script);
      scriptsAdded.push(script);
    };

    // 스크립트 로드 후 실행
    loadScript('https://code.jquery.com/jquery-1.12.4.min.js', () => {
      loadScript('https://cdn.iamport.kr/js/iamport.payment-1.2.0.js', () => {
        if (window.IMP) {
          const IMP = window.IMP;
          // 아임포트 초기화
          IMP.init(process.env.REACT_APP_IMPORT_IMP);
        }
      });
    });

    // 컴포넌트가 언마운트될 때 추가된 스크립트만 제거
    return () => {
      scriptsAdded.forEach((script) => script.remove());
    };
  }, []);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 아이템 데이터와 사용자 정보 가져오기
    fetchItemData();
    fetchUserInfo();
  }, [fetchItemData, fetchUserInfo]);

  return (
    <div className="pay-page-bg">
      <div className="pay-container">
        {/* 회원정보 표시 */}
        {userInfo && (
          <div className="user-info-card">
            <h3>회원정보</h3>
            <div className="user-info-grid">
              <div className="user-info-item">
                <label>이름:</label>
                <span>{userInfo.userName || '정보 없음'}</span>
              </div>
              <div className="user-info-item">
                <label>닉네임:</label>
                <span>{userInfo.nickName || '정보 없음'}</span>
              </div>
              <div className="user-info-item">
                <label>이메일:</label>
                <span>{userInfo.email || '정보 없음'}</span>
              </div>
              <div className="user-info-item">
                <label>전화번호:</label>
                <span>{userInfo.tel || '정보 없음'}</span>
              </div>
            </div>

            {/* 멤버십 정보 */}
            <div className="membership-section">
              <h4>멤버십 정보</h4>
              <div className="membership-card">
                <div className="membership-name">
                  {userInfo.membershipName || '일반 회원'}
                </div>
                <div className="membership-discount">
                  할인률: {userInfo.discountRate || 0}%
                </div>
              </div>
            </div>

            {/* 배송지 정보 */}
            <div className="shipping-section">
              <h4>배송지 정보</h4>
              <div className="shipping-address">
                <div className="address-item">
                  <label>도시:</label>
                  <span>{userInfo.address.city || '정보 없음'}</span>
                </div>
                <div className="address-item">
                  <label>도로명 주소:</label>
                  <span>{userInfo.address.street || '정보 없음'}</span>
                </div>
                <div className="address-item">
                  <label>상세 주소:</label>
                  <span>{userInfo.address.detail || '정보 없음'}</span>
                </div>
                <div className="address-item">
                  <label>우편번호:</label>
                  <span>{userInfo.address.zipcode || '정보 없음'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {itemData && (
          <div className="item-card">
            <h3>상품 정보</h3>
            <div className="item-info-row">
              <span className="item-label">상품명</span>
              <span className="item-value">{itemData.itemName}</span>
            </div>
            <div className="item-info-row">
              <span className="item-label">브랜드</span>
              <span className="item-value">{itemData.brandName}</span>
            </div>
            <div className="item-info-row">
              <span className="item-label">가격</span>
              <span className="item-value">{itemData.price}원</span>
            </div>
            <div className="item-info-row">
              <span className="item-label">구매 수량</span>
              <span className="item-value">
                <button
                  className="cnt-btn"
                  onClick={() => setItemCnt((cnt) => Math.max(1, cnt - 1))}
                >
                  -
                </button>
                <span className="cnt-value">{itemCnt}</span>
                <button
                  className="cnt-btn"
                  onClick={() => setItemCnt((cnt) => cnt + 1)}
                >
                  +
                </button>
              </span>
            </div>
            <div className="item-info-row">
              <span className="item-label">총 결제금액</span>
              <span className="item-value">{discountedPrice}원</span>
            </div>
            {itemData.imageList && itemData.imageList.length > 0 && (
              <div className="item-images">
                <button className="img-btn" onClick={prevImage}>
                  &lt;
                </button>
                <div className="image-container">
                  <img
                    src={itemData.imageList[currentImageIndex]}
                    alt={`상품 이미지 ${currentImageIndex + 1}`}
                    className="item-img"
                  />
                  {itemData.imageList.length > 1 && (
                    <div className="image-indicators">
                      {itemData.imageList.map((_, index) => (
                        <span
                          key={index}
                          className={`indicator ${
                            index === currentImageIndex ? 'active' : ''
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button className="img-btn" onClick={nextImage}>
                  &gt;
                </button>
              </div>
            )}
            {/* 결제하기 버튼 */}
            <button
              className="pay-btn"
              onClick={requestPay}
              disabled={!itemData}
            >
              지금 결제하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestPay;
