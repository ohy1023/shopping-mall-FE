import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Main.css';

const initialFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  nickName: '',
  userName: '',
  tel: '',
  gender: 'MALE',
  city: '',
  street: '',
  detail: '',
  zipcode: '',
};

const Main = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
      setIsLoggedIn(true);
    }
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (isLogin) {
        console.log('로그인 시도:', {
          email: formData.email,
          password: formData.password,
        });
        try {
          const response = await axios.post('/api/v1/customers/login', {
            email: formData.email,
            password: formData.password,
          });
          console.log('로그인 성공:', response.data);
          alert('로그인 성공!');

          // 회원정보 조회
          const userInfoRes = await axios.get('/api/v1/customers');
          const userData = userInfoRes.data.result;
          // 로컬스토리지에 저장
          localStorage.setItem('userInfo', JSON.stringify(userData));

          setIsLoggedIn(true);
          setUserInfo(userData);
          // 폼 초기화
          setFormData(initialFormData);
        } catch (error) {
          console.error('로그인 실패:', error);
          alert('로그인에 실패했습니다.');
        }
      } else {
        // 회원가입 유효성 검사
        if (formData.password !== formData.confirmPassword) {
          alert('비밀번호가 일치하지 않습니다.');
          return;
        }

        if (formData.password.length < 8) {
          alert('비밀번호는 최소 8자 이상이어야 합니다.');
          return;
        }

        if (
          !/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(
            formData.password
          )
        ) {
          alert('비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.');
          return;
        }

        if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(formData.tel)) {
          alert('전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)');
          return;
        }

        if (!/^\d{5}$/.test(formData.zipcode)) {
          alert('우편번호는 5자리 숫자여야 합니다.');
          return;
        }

        console.log('회원가입 시도:', formData);

        try {
          const joinData = {
            email: formData.email,
            password: formData.password,
            nickName: formData.nickName,
            userName: formData.userName,
            tel: formData.tel,
            gender: formData.gender,
            city: formData.city,
            street: formData.street,
            detail: formData.detail,
            zipcode: formData.zipcode,
          };

          const response = await axios.post('/api/v1/customers/join', joinData);
          console.log('회원가입 성공:', response.data);
          alert('회원가입이 완료되었습니다!');

          // 회원가입 성공 후 로그인 모드로 전환
          setIsLogin(true);
          setFormData(initialFormData);
        } catch (error) {
          console.error('회원가입 실패:', error);
          if (error.response?.data?.message) {
            alert(`회원가입 실패: ${error.response.data.message}`);
          } else {
            alert('회원가입에 실패했습니다.');
          }
        }
      }
    },
    [isLogin, formData]
  );

  const toggleMode = useCallback(() => {
    setIsLogin((prev) => !prev);
    setFormData(initialFormData);
  }, []);

  const handleLogout = useCallback(() => {
    // 쿠키 제거
    ['Authorization', 'Authorization-refresh'].forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    localStorage.clear();

    setIsLoggedIn(false);
    setUserInfo(null);
    alert('로그아웃되었습니다.');
  }, []);

  const handleSinglePurchase = useCallback(() => {
    navigate('/payment');
  }, [navigate]);

  const handleCartTest = useCallback(() => {
    alert('장바구니 테스트 기능은 준비 중입니다.');
  }, []);

  return (
    <div className="main-page">
      <div className="hero-section">
        <h1>오늘의 식탁</h1>
        <h2>프로젝트 결제 테스트용 사이트</h2>
        <p className="description">
          레시피를 보고 필요한 식재료를 구매하는 온라인 쇼핑몰입니다.
          <br />이 사이트는 결제 시스템 테스트를 위한 데모 버전입니다.
        </p>
      </div>

      {!isLoggedIn ? (
        <div className="auth-container">
          <div className="auth-box">
            <h3>{isLogin ? '로그인' : '회원가입'}</h3>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="example@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder={
                    isLogin
                      ? '비밀번호를 입력하세요'
                      : '최소 8자, 대소문자, 숫자, 특수문자 포함'
                  }
                />
              </div>

              {!isLogin && (
                <>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">비밀번호 확인</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="비밀번호를 다시 입력하세요"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nickName">닉네임</label>
                    <input
                      type="text"
                      id="nickName"
                      name="nickName"
                      value={formData.nickName}
                      onChange={handleInputChange}
                      required
                      placeholder="닉네임을 입력하세요"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="userName">이름</label>
                    <input
                      type="text"
                      id="userName"
                      name="userName"
                      value={formData.userName}
                      onChange={handleInputChange}
                      required
                      placeholder="이름을 입력하세요"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tel">전화번호</label>
                    <input
                      type="tel"
                      id="tel"
                      name="tel"
                      value={formData.tel}
                      onChange={handleInputChange}
                      required
                      placeholder="010-1234-5678"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">성별</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="MALE">남성</option>
                      <option value="FEMALE">여성</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">도시</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="서울특별시"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="street">도로명 주소</label>
                    <input
                      type="text"
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                      placeholder="강남대로 123"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="detail">상세 주소</label>
                    <input
                      type="text"
                      id="detail"
                      name="detail"
                      value={formData.detail}
                      onChange={handleInputChange}
                      required
                      placeholder="101동 202호"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="zipcode">우편번호</label>
                    <input
                      type="text"
                      id="zipcode"
                      name="zipcode"
                      value={formData.zipcode}
                      onChange={handleInputChange}
                      required
                      placeholder="12345"
                      maxLength="5"
                    />
                  </div>
                </>
              )}

              <button type="submit" className="submit-btn">
                {isLogin ? '로그인' : '회원가입'}
              </button>
            </form>

            <div className="toggle-mode">
              <p>
                {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="toggle-btn"
                >
                  {isLogin ? '회원가입' : '로그인'}
                </button>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="user-dashboard">
          <div className="user-info">
            <h3>환영합니다, {userInfo?.userName || '사용자'}님!</h3>
            <button onClick={handleLogout} className="logout-btn">
              로그아웃
            </button>
          </div>

          <div className="test-buttons">
            <h3>테스트 기능</h3>
            <div className="button-grid">
              <button
                onClick={handleSinglePurchase}
                className="test-btn primary"
              >
                💳 단건 구매 테스트
              </button>
              <button onClick={handleCartTest} className="test-btn secondary">
                🛒 장바구니 테스트
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
