import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/auth/Signup';
import EmailVerification from './pages/auth/EmailVerification';
import Login from './pages/auth/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div className="min-h-screen bg-gray-100 flex items-center justify-center pt-24"><h1 className="text-4xl font-bold text-gray-800">Dashboard Coming Soon</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App;
