import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import BasicTest from './pages/BasicTest';
import MockTest from './pages/MockTest';
import Study from './pages/Study';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/basic-test" element={<BasicTest />} />
            <Route path="/mock-test" element={<MockTest />} />
            <Route path="/study" element={<Study />} />
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;

