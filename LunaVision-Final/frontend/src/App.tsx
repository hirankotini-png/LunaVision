import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import MissionReport from './pages/MissionReport';
import AIAssistant from './pages/AIAssistant';
import About from './pages/About';
import { MissionProvider } from './context/MissionContext';

function App() {
  return (
    <MissionProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/report" element={<MissionReport />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Layout>
      </Router>
    </MissionProvider>
  );
}

export default App;
