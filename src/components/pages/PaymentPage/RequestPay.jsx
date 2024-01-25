import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RequestPay = () => {
  const [isPaymentRequested, setIsPaymentRequested] = useState(false);
  const [merchantUid, setMerchantUid] = useState(null);

  // 임의의 6자리 숫자를 생성하는 함수
  const generateRandomNumber = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // 결제 요청 함수
  const requestPay = () => {
    window.IMP.request_pay({
      pg: "html5_inicis",
      pay_method: "card",
      merchant_uid: merchantUid,
      name: "스파게티면 200g",
      amount: 200,
      buyer_email: "string@naver.com",
      buyer_name: "string",
      buyer_tel: "string",
      buyer_addr: "string",
      buyer_postcode: "01181"
    }, rsp => {
      if (rsp.success) {
        // 결제 성공 시 로직
        console.log('결제 성공');
        console.log(rsp);
        createOrder(rsp.imp_uid);
      } else {
        // 결제 실패 시 로직
        console.log('결제 실패', rsp.error_msg);
        // 추가로 실행할 로직을 여기에 작성
      }
    });
  };

  // Axios POST 요청 함수 (주문 생성)
  const createOrder = (imp_uid) => {
    console.log(merchantUid);
    axios.post('/api/v1/orders', {
      itemId : 1,
      itemCnt : 1,
      recipientName : "string",
      recipientTel : "string",
      recipientCity : "string",
      recipientStreet : "string",
      recipientDetail : "string",
      recipientZipcode : "string",
      merchantUid : merchantUid,
      totalPrice : 0,
    })
      .then((orderResponse) => {
        console.log(orderResponse);
        if (orderResponse.status === 200) {
          console.log('주문이 성공적으로 생성되었습니다.');
          // 성공한 경우 사후 검증 API 호출
          sendPostVerificationRequest(imp_uid);
        } else {
          console.error('주문 생성 실패');
        }
      })
      .catch((error) => {
        console.error('주문 생성 요청 오류', error);
      });
  };



  // Axios POST 요청 함수 (사전 검증)
  const sendPreVerificationRequest = async () => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');

      const response = await axios.post('/api/v1/orders/preparation', {
          merchantUid: `${year}.${month}.${day}_${generateRandomNumber()}`, // 가맹점 주문번호
          totalPrice: 200 // 결제 예정금액
      });

      if (response.data.resultCode === "SUCCESS") {
        console.log(response);
        // 사전 검증 성공 시 결제 요청 실행
        setIsPaymentRequested(true);
        setMerchantUid(response.data.result.merchantUid);
      } else {
        console.error('사전 검증 실패');
      }
    } catch (error) {
      console.error('사전 검증 요청 오류', error);
    }
  };

  // Axios POST 요청 함수 (사후 검증)
  const sendPostVerificationRequest = async (imp_uid) => {
    try {
      const response = await axios.post('/api/v1/orders/verification', {
        merchantUid : merchantUid,
        impUid : imp_uid
      });

      if (response.data.resultCode === "SUCCESS") {
        alert(response.data.result.msg);
      } else {
        console.error('사후 검증 실패');
      }
    } catch (error) {
      console.error('사후 검증 요청 오류', error);
    }
  };

  useEffect(() => {
    // 외부 스크립트 로드 함수
    const loadScript = (src, callback) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.onload = callback;
      document.head.appendChild(script);
    };

    // 스크립트 로드 후 실행
    loadScript('https://code.jquery.com/jquery-1.12.4.min.js', () => {
      loadScript('https://cdn.iamport.kr/js/iamport.payment-1.2.0.js', () => {
        const IMP = window.IMP;
        // 아임포트 초기화
        IMP.init(process.env.REACT_APP_IMPORT_IMP);
      });
    });

    // 컴포넌트가 언마운트될 때 스크립트를 제거하기 위한 정리 함수
    return () => {
      const scripts = document.querySelectorAll('script[src^="https://"]');
      scripts.forEach((script) => script.remove());
    };
  }, []);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 사전 검증 API 호출
    sendPreVerificationRequest();
  }, []);


  return (
    <div>
      {/* 결제하기 버튼 */}
      <button onClick={requestPay}>지금 결제하기</button>
    </div>
  );
};

export default RequestPay;
