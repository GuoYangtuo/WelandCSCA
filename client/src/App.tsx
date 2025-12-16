import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Home from './pages/Home';
import BasicTest from './pages/BasicTest';
import MockTest from './pages/MockTest';
import Study from './pages/Study';
import QuestionUpload from './pages/QuestionUpload';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import './App.css'; 

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/basic-test" element={<BasicTest />} />
              <Route path="/mock-test" element={<MockTest />} />
              <Route path="/study" element={<Study />} />
              <Route path="/question-upload" element={<QuestionUpload />} />
              <Route path="/admin" element={<Admin />} />
              {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

