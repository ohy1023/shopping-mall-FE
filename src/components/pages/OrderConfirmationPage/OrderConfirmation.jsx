import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderConfirmation.css';

const OrderDetailsDisplay = React.memo(
  ({ orderDetails, onGoHome, onCancelOrder }) => (
    <div className="order-confirmation-container">
      <h2>주문 확인</h2>
      <p>고객님의 주문이 성공적으로 접수되었습니다.</p>

      <div className="order-details-card">
        <h3>주문 상세 정보</h3>

        <div className="order-info-section">
          <h4>주문 요약</h4>
          <div className="info-row">
            <span className="info-label">주문 번호 : </span>
            <span className="info-value">{orderDetails.merchantUid}</span>
          </div>
          {orderDetails.orderDate && (
            <div className="info-row">
              <span className="info-label">주문 일시 : </span>
              <span className="info-value">{orderDetails.orderDate}</span>
            </div>
          )}
          {orderDetails.orderStatus && (
            <div className="info-row">
              <span className="info-label">주문 상태 : </span>
              <span className="info-value">{orderDetails.orderStatus}</span>
            </div>
          )}
        </div>

        <div className="order-info-section">
          <h4>상품 정보</h4>
          {orderDetails.itemName && (
            <div className="info-row">
              <span className="info-label">상품명 : </span>
              <span className="info-value">{orderDetails.itemName}</span>
            </div>
          )}
          {orderDetails.brandName && (
            <div className="info-row">
              <span className="info-label">브랜드 : </span>
              <span className="info-value">{orderDetails.brandName}</span>
            </div>
          )}
          {typeof orderDetails.totalPrice === 'number' && (
            <div className="info-row">
              <span className="info-label">결제 금액 : </span>
              <span className="info-value">
                {orderDetails.totalPrice.toLocaleString('ko-KR')} 원
              </span>
            </div>
          )}
        </div>

        <div className="order-info-section">
          <h4>주문자 정보</h4>
          {orderDetails.orderCustomerName && (
            <div className="info-row">
              <span className="info-label">이름 : </span>
              <span className="info-value">
                {orderDetails.orderCustomerName}
              </span>
            </div>
          )}
          {orderDetails.orderCustomerTel && (
            <div className="info-row">
              <span className="info-label">연락처 : </span>
              <span className="info-value">
                {orderDetails.orderCustomerTel}
              </span>
            </div>
          )}
        </div>

        <div className="order-info-section">
          <h4>배송 정보</h4>
          {orderDetails.deliveryStatus && (
            <div className="info-row">
              <span className="info-label">배송 상태 : </span>
              <span className="info-value">{orderDetails.deliveryStatus}</span>
            </div>
          )}
          {orderDetails.recipientName && (
            <div className="info-row">
              <span className="info-label">받는 분 : </span>
              <span className="info-value">{orderDetails.recipientName}</span>
            </div>
          )}
          {orderDetails.recipientTel && (
            <div className="info-row">
              <span className="info-label">연락처 : </span>
              <span className="info-value">{orderDetails.recipientTel}</span>
            </div>
          )}
          {orderDetails.recipientAddress && (
            <div className="info-row">
              <span className="info-label">배송 주소 : </span>
              <span className="info-value">
                {`(${orderDetails.zipcode}) ${orderDetails.recipientAddress}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="button-group">
        <button className="home-btn" onClick={onGoHome}>
          홈으로
        </button>
        <button className="cancel-btn" onClick={onCancelOrder}>
          주문 취소
        </button>
      </div>
    </div>
  )
);

const OrderConfirmation = () => {
  const { merchantUid } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!merchantUid) return;
    try {
      const response = await axios.get(`/api/v1/orders/${merchantUid}`);
      if (response.data.resultCode === 'SUCCESS') {
        setOrderDetails(response.data.result);
      } else {
        setError(
          '주문 정보를 가져오는데 실패했습니다: ' +
            (response.data.result?.message || '')
        );
      }
    } catch (err) {
      setError('주문 정보를 가져오는 중 오류가 발생했습니다.');
      console.error(err);
    }
  }, [merchantUid]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleCancelOrder = useCallback(async () => {
    const confirmCancel = window.confirm('정말로 주문을 취소하시겠습니까?');
    if (confirmCancel) {
      try {
        const response = await axios.delete(`/api/v1/orders/${merchantUid}`, {
          data: {
            itemUuid: orderDetails.itemUuid,
          },
        });

        if (response.data.resultCode === 'SUCCESS') {
          alert('주문이 성공적으로 취소되었습니다.');
          navigate('/');
        } else {
          alert(
            '주문 취소에 실패했습니다: ' + (response.data.result?.message || '')
          );
        }
      } catch (err) {
        alert('주문 취소 처리 중 오류가 발생했습니다.');
        console.error(err);
      }
    }
  }, [merchantUid, navigate, orderDetails]);

  if (error) {
    return (
      <div className="order-confirmation-container">
        <h2>오류</h2>
        <p>{error}</p>
        <button onClick={handleGoHome}>홈으로</button>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="order-confirmation-container">
        <p>주문 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <OrderDetailsDisplay
      orderDetails={orderDetails}
      onGoHome={handleGoHome}
      onCancelOrder={handleCancelOrder}
    />
  );
};

export default OrderConfirmation;
