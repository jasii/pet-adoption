import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import PetAdoption from "./PetAdoption";
import Admin from "./Admin";
import AnimalProfile from "./AnimalProfile";
import CodeGenerator from "./CodeGenerator"; // Import the new component
import ReactMarkdown from "react-markdown";
import "./App.css"; // Import the CSS file

function App() {
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");

  useEffect(() => {
    const fetchPageDetails = async () => {
      const response = await fetch("http://localhost:5000/page-details");
      const data = await response.json();
      setPageTitle(data.title);
      setPageDescription(data.description);
    };

    fetchPageDetails();
  }, []);

  useEffect(() => {
    const fetchWebsiteTitle = async () => {
      const response = await fetch("http://localhost:5000/website-title");
      const data = await response.json();
      setWebsiteTitle(data.title);
    };

    fetchWebsiteTitle();
  }, []);

  useEffect(() => {
    document.title = websiteTitle; // Update the document title
  }, [websiteTitle]);

  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile/:name" element={<AnimalProfile />} />
        <Route path="/code-generator" element={<CodeGenerator />} /> {/* Add the new route */}
        <Route
          path="/"
          element={
            <div className="page-container">
              <div className="main-container">
                <div className="description-section">
                  <div class="logo-container">
                    <div>
                      <img src="/images/logo.png" alt="Logo" id="logo" />
                    </div>
                  </div>
                  <ReactMarkdown>{pageTitle}</ReactMarkdown>
                  <ReactMarkdown>{pageDescription}</ReactMarkdown>
                </div>
                <div className="pet-adoption-section">
                  <PetAdoption />
                </div>
                <Link to="/admin" className="admin-link">Admin</Link>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;