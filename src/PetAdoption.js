import React, { useState, useEffect } from "react";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./App.css";

const colors = ['#f7a5a3', '#a5f7d1', '#a5a3f7', '#f7e3a5', '#f7a5e3', '#a3f7a5', '#d1a5f7', '#f7d1a5'];

function getColor(index) {
  return colors[index % colors.length];
}

export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function PetAdoption() {
  const [adoptedPets, setAdoptedPets] = useState({});
  const [showForm, setShowForm] = useState(""); // Change to store a single string value
  const [adopteeName, setAdopteeName] = useState("");
  const [userIp, setUserIp] = useState("");
  const [pets, setPets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [adoptionCode, setAdoptionCode] = useState('');

  useEffect(() => {
    fetch("http://localhost:5000/get-ip")
      .then((response) => response.json())
      .then((data) => setUserIp(data.ip))
      .catch((error) => console.error("Error fetching IP:", error));

    fetch("http://localhost:5000/pets")
      .then((res) => res.json())
      .then((data) => {
        const adopted = {};
        data.forEach((pet) => {
          if (pet.adopted_by) {
            adopted[pet.name] = { adopted_by: pet.adopted_by, adopted_at: pet.adopted_at };
          }
        });
        setAdoptedPets(adopted);
        setPets(data);
      })
      .catch((error) => console.error("Error fetching adoption status:", error));

    fetch("http://localhost:5000/page-details")
      .then((res) => res.json())
      .then((data) => {
        setPageTitle(data.title);
        setPageDescription(data.description);
      })
      .catch((error) => console.error("Error fetching page details:", error));

    fetch("http://localhost:5000/website-title")
      .then((res) => res.json())
      .then((data) => setWebsiteTitle(data.title))
      .catch((error) => console.error("Error fetching website title:", error));

    fetch("http://localhost:5000/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((error) => console.error("Error fetching categories:", error));
  }, []);

  const handleAdoptClick = async (name) => {
    setShowForm(name); // Set the name of the pet whose form is open
  };

  const handleAdoptSubmit = async (name) => {
    try {
      const response = await fetch("http://localhost:5000/adopt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, adopteeName, adoptionCode }),
      });
      if (!response.ok) {
        throw new Error("Code not valid");
      }
      const data = await response.json();
      setAdoptedPets((prev) => ({ ...prev, [name]: { adopted_by: adopteeName, adopted_at: data.adopted_at } }));
      setShowConfetti(true);
      setShowForm(""); // Close the form after submission
    } catch (error) {
      alert("" + error.message);
    }
  };

  const handleBackClick = () => {
    setShowForm(""); // Close the form
  };

  const groupPetsByCategory = (pets) => {
    return pets.reduce((acc, pet) => {
      if (!acc[pet.category]) {
        acc[pet.category] = [];
      }
      acc[pet.category].push(pet);
      return acc;
    }, {});
  };

  const groupedPets = groupPetsByCategory(pets);

  return (
    <div>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={400}
          tweenDuration={10000}
          gravity={0.03}
          recycle={false}
        />
      )}
      <div className="categories-container">
        {categories.map((category) => (
            <div key={category}>
              <div className="category-section">
              <ReactMarkdown>{category}</ReactMarkdown>
              </div>
            <div className="grid-container">
              {groupedPets[category]?.map((pet, index) => (
                <div key={pet.name} className={`card ${adoptedPets[pet.name] ? "adopted" : ""}`}>
                  {adoptedPets[pet.name] && (
                    <Link to={`/profile/${pet.name}`} className="overlay">
                      Adopted
                      <div className="adopted-at">{formatDate(adoptedPets[pet.name].adopted_at)}</div>
                      <div className="emoji">😊</div>
                    </Link>
                  )}
                  {showForm === pet.name ? (
                    <form
                      className="adoption-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAdoptSubmit(pet.name);
                      }}
                    >
                      <label>
                        Your Name
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={adopteeName}
                          onChange={(e) => setAdopteeName(e.target.value)}
                        />
                      </label>
                      <label>
                        Adoption Token
                        <input
                          type="text"
                          placeholder="Token"
                          value={adoptionCode}
                          onChange={(e) => setAdoptionCode(e.target.value)}
                        />
                      </label>
                      <div className="form-buttons">
                        <button type="submit">Adopt 🤍</button>
                      </div>
                      <button type="button" className="back-button" onClick={handleBackClick}>Back</button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="pet-image-container" style={{ backgroundColor: getColor(index) }}>
                        <img src={pet.image} alt={pet.name} className="pet-image" />
                        <div className="pet-name">{pet.name}</div>
                      </div>
                      <ReactMarkdown>{pet.description}</ReactMarkdown>
                      <div className="card-buttons">
                        <Link to={`/profile/${pet.name}`}>
                          <button>View Profile</button>
                        </Link>
                        {!adoptedPets[pet.name] && (
                          <button onClick={() => handleAdoptClick(pet.name)}>
                            Adopt 🤍
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}