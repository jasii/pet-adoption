import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import PetAdoption from "./PetAdoption";
import Admin from "./Admin";

function App() {
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");

  useEffect(() => {
    const fetchPageDetails = async () => {
      const response = await fetch("http://localhost:5000/page-details");
      const data = await response.json();
      console.log("Page details:", data); // Log the fetched data
      setPageTitle(data.title);
      setPageDescription(data.description);
    };

    fetchPageDetails();
  }, []);

  useEffect(() => {
    const fetchWebsiteTitle = async () => {
      const response = await fetch("http://localhost:5000/website-title");
      const data = await response.json();
      console.log("Website title:", data); // Log the fetched data
      setWebsiteTitle(data.title);
    };

    fetchWebsiteTitle();
  }, []);

  useEffect(() => {
    console.log("Updating document title:", websiteTitle); // Log the title being set
    document.title = websiteTitle; // Update the document title
  }, [websiteTitle]);

  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/"
          element={
            <>
              <div className="description-section">
                <h2>{pageTitle}</h2>
                <p>{pageDescription}</p>
              </div>
              <PetAdoption />
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;