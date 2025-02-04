import React, { useState, useEffect } from "react";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import "./App.css";

export default function PetAdoption() {
  const [adoptedPets, setAdoptedPets] = useState({});
  const [showForm, setShowForm] = useState({});
  const [adopteeName, setAdopteeName] = useState("");
  const [userIp, setUserIp] = useState("");
  const [pets, setPets] = useState([]);
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

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
            adopted[pet.id] = pet.adopted_by;
          }
        });
        setAdoptedPets(adopted);
        setPets(data);
      })
      .catch((error) => console.error("Error fetching adoption status:", error));

    fetch("http://localhost:5000/page-details")
      .then((response) => response.json())
      .then((data) => {
        setPageTitle(data.title);
        setPageDescription(data.description);
      })
      .catch((error) => console.error("Error fetching page details:", error));

    fetch("http://localhost:5000/website-title")
      .then((response) => response.json())
      .then((data) => {
        setWebsiteTitle(data.title);
      })
      .catch((error) => console.error("Error fetching website title:", error));
  }, []);

  const handleAdoptClick = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/check-adoption/${userIp}`);
      const data = await response.json();

      if (data.hasAdopted) {
        alert("You have already adopted a pet");
        return;
      }

      setShowForm((prev) => ({ ...prev, [id]: true }));
    } catch (error) {
      console.error("Error checking adoption status:", error);
      alert("Error checking adoption status. Please try again.");
    }
  };

  const handleAdoptSubmit = async (id, petName) => {
    if (!adopteeName.trim()) {
      alert("Please enter your name to adopt.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adopteeName }),
      });

      const text = await response.text();
      console.log(text);
      const data = JSON.parse(text);

      if (!response.ok) {
        alert(data.error);
        return;
      }

      const petsResponse = await fetch("http://localhost:5000/pets");
      const petsData = await petsResponse.json();
      const adopted = {};
      petsData.forEach((pet) => {
        if (pet.adopted_by) {
          adopted[pet.id] = pet.adopted_by;
        }
      });
      setAdoptedPets(adopted);
      setShowForm((prev) => ({ ...prev, [id]: false }));
      setAdopteeName("");

      setShowConfetti(true);
    } catch (error) {
      alert("Error adopting pet: " + error.message);
    }
  };

  const handleBackClick = (id) => {
    setShowForm((prev) => ({ ...prev, [id]: false }));
  };

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
      <div className="grid-container">
        {pets.map((pet) => (
          <div key={pet.id} className={`card ${adoptedPets[pet.id] ? "adopted" : ""}`}>
            {adoptedPets[pet.id] && <div className="overlay">Adopted<div className="emoji">😊</div></div>}
            {showForm[pet.id] ? (
              <form
                className="adoption-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdoptSubmit(pet.id, pet.name);
                }}
              >
                <input
                  type="text"
                  placeholder="Your Name"
                  value={adopteeName}
                  onChange={(e) => setAdopteeName(e.target.value)}
                />
                <button type="submit">Submit</button>
                <button type="button" onClick={() => handleBackClick(pet.id)}>Back</button>
              </form>
            ) : (
              <>
                <img src={pet.image} alt={pet.name} />
                <h3>{pet.name}</h3>
                <p>{pet.description}</p>
                {!adoptedPets[pet.id] && <button onClick={() => handleAdoptClick(pet.id)}>Adopt</button>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}