import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Payment from './components/pages/PaymentPage/RequestPay';
import Main from './components/pages/MainPage/Main';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element = {<Main />}/>
        <Route path="/payment" element={<Payment />} />
        {/* 다른 라우트들도 추가할 수 있음 */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
