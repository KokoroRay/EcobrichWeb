import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Process from './pages/Process';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import HowItWorks from './pages/HowItWorks';
import Rewards from './pages/Rewards';
import Redeem from './pages/Redeem';
import Vouchers from './pages/Vouchers';
import Admin from './pages/Admin';
import { RewardsProvider } from './context/RewardsContext';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    }
  }
});

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div style={{ background: '#ffffff', minHeight: '100vh', padding: '20px' }}>
          <RewardsProvider>
            <div className="app">
              <Header />
              <main className="main">
                <div style={{ textAlign: 'center', padding: '10px', background: '#f0f0f0', marginBottom: '20px' }}>
                  <span>Xin chào {user?.username}</span>
                  <button onClick={signOut} style={{ marginLeft: '10px', padding: '5px 15px', cursor: 'pointer' }}>
                    Đăng xuất
                  </button>
                </div>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/process" element={<Process />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/redeem" element={<Redeem />} />
                  <Route path="/vouchers" element={<Vouchers />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </RewardsProvider>
        </div>
      )}
    </Authenticator>
  );
}
