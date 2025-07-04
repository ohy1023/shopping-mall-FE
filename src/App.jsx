import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Payment from './components/pages/PaymentPage/RequestPay';
import Main from './components/pages/MainPage/Main';
import OrderConfirmation from './components/pages/OrderConfirmationPage/OrderConfirmation';
import Cart from './components/pages/CartPage/Cart';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/payment" element={<Payment />} />
        <Route
          path="/order/complete/:merchantUid"
          element={<OrderConfirmation />}
        />
        <Route path="/cart" element={<Cart />} />
        {/* 다른 라우트들도 추가할 수 있음 */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
