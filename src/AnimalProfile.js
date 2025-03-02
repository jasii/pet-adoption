import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { formatDate } from "./PetAdoption";
import "./App.css";

export default function AnimalProfile() {
  const { name } = useParams();
  const [animal, setAnimal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/${name}`)
      .then((res) => res.json())
      .then((data) => setAnimal(data))
      .catch((error) => console.error("Error fetching animal details:", error));
  }, [name]);

  if (!animal) {
    return <div>Loading...</div>;
  }

  return (
    <div className="animal-profile-container">
      <div className="animal-profile">
        <img src={animal.image} alt={animal.name} />
        <h2>{animal.name}</h2>
        <ReactMarkdown>{animal.long_description}</ReactMarkdown>
        {animal.adopted_at && <p>Adopted: {formatDate(animal.adopted_at)}</p>}
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
}