import React, { useEffect, useState } from 'react';

const Main = () => {
  const [notification, setNotification] = useState('');
  useEffect(() => {

    // SSE 연결을 설정
    const eventSource = new EventSource("/sse/subscribe/1",{withCredentials: true,} );

    // SSE 이벤트 핸들러
    eventSource.onmessage = (event) => {
      setNotification(event.data);  // 서버로부터 수신한 메시지를 상태에 저장
      console.log(event.data);
    };

    eventSource.onerror = (error) => {
      console.error('Error occurred:', error);

      // 에러 객체에서 추가적인 세부 정보 기록
      console.error('Error details:', {
        type: error.type,
        target: error.target,
        eventPhase: error.eventPhase,
        // 필요한 경우 더 많은 속성 추가
      });
    };

    // 컴포넌트가 언마운트 될 때 EventSource를 닫음
    return () => {
      eventSource.close();
    };
  }, []); // 빈 배열을 전달하여 컴포넌트가 마운트 될 때만 실행

  return (
    <div className="main-page">
      <h1>Welcome to My Main Page</h1>
      <p>This is a simple example of a functional component for the main page.</p>

      {/* 알림 메시지가 있을 경우 표시 */}
      {notification && (
        <div className="notification">
          <strong>Notification:</strong> {notification}
        </div>
      )}
    </div>
  );
};

export default Main;
