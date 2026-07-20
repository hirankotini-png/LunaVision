import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { MissionProvider } from './context/MissionContext';
import { ThemeProvider } from './context/ThemeContext';
import { Loader2 } from 'lucide-react';

const Home = React.lazy(() => import('./pages/Home'));
const Upload = React.lazy(() => import('./pages/Upload'));
const Analysis = React.lazy(() => import('./pages/Analysis'));
const MissionReport = React.lazy(() => import('./pages/MissionReport'));
const AIAssistant = React.lazy(() => import('./pages/AIAssistant'));
const About = React.lazy(() => import('./pages/About'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <MissionProvider>
        <Router>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/report" element={<MissionReport />} />
                <Route path="/ai" element={<AIAssistant />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </MissionProvider>
    </ThemeProvider>
  );
}

export default App;
