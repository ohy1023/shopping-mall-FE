// 필요한 라이브러리를 가져옵니다.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// React 앱을 마운트할 HTML 파일의 루트 엘리먼트를 찾습니다.
const rootElement = document.getElementById('root');

// createRoot를 react-dom/client에서 가져와 사용합니다.
const root = ReactDOM.createRoot(rootElement);

// 앱 컴포넌트를 createRoot 호출 내에 감싸줍니다.
root.render(
    <App />
);
