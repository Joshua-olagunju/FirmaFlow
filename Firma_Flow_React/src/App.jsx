import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/auth/Signup';
import EmailVerification from './pages/auth/EmailVerification';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard/>} />
      </Routes>
  );
}

export default App;
