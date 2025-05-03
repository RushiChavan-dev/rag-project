// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Chatbot from "./components/Chatbot";
import LeftSidePanel from "./components/LeftSidePanel";
import OcrPage from "./pages/OcrPage";
import logo from "./assets/images/logo.svg";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen w-full">
        <LeftSidePanel />

        <div className="flex flex-col min-h-full w-full max-w-3xl mx-auto px-4">
          <header className="sticky top-0 z-20 bg-white flex items-center justify-between p-4">
            {/* Logo → Home */}
            <Link to="/">
              <img src={logo} className="w-32" alt="logo" />
            </Link>

            {/* Nav links */}
            <nav className="space-x-4">
              <Link to="/" className="font-medium hover:underline">
                Home
              </Link>
              <Link to="/ocr" className="font-medium hover:underline">
                OCR
              </Link>
            </nav>
          </header>

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Chatbot />} />
              <Route path="/ocr" element={<OcrPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
