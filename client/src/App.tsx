import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import BasicTest from './pages/BasicTest';
import MockTest from './pages/MockTest';
import Study from './pages/Study';
import QuestionUpload from './pages/QuestionUpload';
import CourseUpload from './pages/CourseUpload';
import Admin from './pages/Admin';
import InstitutionAdmin from './pages/InstitutionAdmin';
import ExamHistory from './pages/ExamHistory';
import ExamAnalysis from './pages/ExamAnalysis';
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
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/basic-test" element={<BasicTest />} />
              <Route path="/mock-test" element={<MockTest />} />
              <Route path="/study" element={<Study />} />
              <Route path="/question-upload" element={<QuestionUpload />} />
              <Route path="/course-upload" element={<CourseUpload />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/institution-admin" element={<InstitutionAdmin />} />
              <Route path="/exam-history" element={<ExamHistory />} />
              <Route path="/exam-analysis/:id" element={<ExamAnalysis />} />
              {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

