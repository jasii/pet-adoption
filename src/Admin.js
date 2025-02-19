import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD; // Use environment variable for admin password

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [editAnimal, setEditAnimal] = useState(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");

  useEffect(() => {
    fetchPageDetails();
    fetchWebsiteTitle();
  }, []);

  useEffect(() => {
    document.title = websiteTitle; // Update the document title
  }, [websiteTitle]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchAnimals();
    } else {
      alert("Incorrect password");
    }
  };

  const fetchAnimals = async () => {
    const response = await fetch("http://localhost:5000/pets");
    const data = await response.json();
    setAnimals(data);
  };

  const fetchPageDetails = async () => {
    const response = await fetch("http://localhost:5000/page-details");
    const data = await response.json();
    setPageTitle(data.title);
    setPageDescription(data.description);
  };

  const fetchWebsiteTitle = async () => {
    const response = await fetch("http://localhost:5000/website-title");
    const data = await response.json();
    setWebsiteTitle(data.title);
  };

  const handleAddAnimal = async (e) => {
    e.preventDefault(); // Prevent form submission from causing a page reload

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("image", imageFile);

    const response = await fetch("http://localhost:5000/add-animal", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      fetchAnimals();
      setName("");
      setDescription("");
      setImageFile(null);
    } else {
      alert("Error adding animal");
    }
  };

  const handleRemoveAnimal = async (id) => {
    const response = await fetch(`http://localhost:5000/remove-animal/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      fetchAnimals();
    } else {
      alert("Error removing animal");
    }
  };

  const handleEditAnimal = (animal) => {
    setEditAnimal(animal);
    setName(animal.name);
    setDescription(animal.description);
    setImageFile(null);
  };

  const handleUpdateAnimal = async (e) => {
    e.preventDefault(); // Prevent form submission from causing a page reload

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await fetch(`http://localhost:5000/update-animal/${editAnimal.id}`, {
      method: "PUT",
      body: formData,
    });
    if (response.ok) {
      fetchAnimals();
      setEditAnimal(null);
      setName("");
      setDescription("");
      setImageFile(null);
    } else {
      alert("Error updating animal");
    }
  };

  const handleUpdatePageDetails = async () => {
    const response = await fetch("http://localhost:5000/update-page-details", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: pageTitle, description: pageDescription }),
    });
    if (response.ok) {
      alert("Page details updated successfully");
    } else {
      alert("Error updating page details");
    }
  };

  const handleUpdateWebsiteTitle = async () => {
    const response = await fetch("http://localhost:5000/update-website-title", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: websiteTitle }),
    });
    if (response.ok) {
      alert("Website title updated successfully");
    } else {
      alert("Error updating website title");
    }
  };

  const handleUnadoptAnimal = async (id) => {
    const response = await fetch(`http://localhost:5000/unadopt-animal/${id}`, {
      method: "PUT",
    });
    if (response.ok) {
      fetchAnimals();
    } else {
      alert("Error marking animal as not adopted");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <Link to="/" className="back-link">Back to Home</Link>
        <h2>Admin Login</h2>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Link to="/" className="back-link">Back to Home</Link>
      <h2>Admin Page</h2>
      <div className="page-details-form">
        <h3>Edit Website Title</h3>
        <input
          type="text"
          placeholder="Website Title"
          value={websiteTitle}
          onChange={(e) => setWebsiteTitle(e.target.value)}
        />
        <button onClick={handleUpdateWebsiteTitle}>Update Website Title</button>
      </div>
      <div className="page-details-form">
        <h3>Edit Page Details</h3>
        <input
          type="text"
          placeholder="Page Title"
          value={pageTitle}
          onChange={(e) => setPageTitle(e.target.value)}
        />
        <textarea
          placeholder="Page Description"
          value={pageDescription}
          onChange={(e) => setPageDescription(e.target.value)}
        />
        <button onClick={handleUpdatePageDetails}>Update Page Details</button>
      </div>
      <div className="add-animal-form">
        <h3>{editAnimal ? "Edit Animal" : "Add Animal"}</h3>
        <form onSubmit={editAnimal ? handleUpdateAnimal : handleAddAnimal}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="file"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
          <button type="submit">
            {editAnimal ? "Update Animal" : "Add Animal"}
          </button>
          {editAnimal && (
            <button type="button" onClick={() => setEditAnimal(null)}>Cancel</button>
          )}
        </form>
      </div>
      <div className="animal-list">
        <h3>Animal List</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Adopted</th>
              <th>Adopted By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {animals.map((animal) => (
              <tr key={animal.id}>
                <td>{animal.name}</td>
                <td>{animal.description}</td>
                <td>{animal.adopted_by ? "Yes" : "No"}</td>
                <td>{animal.adopted_by || "N/A"}</td>
                <td>
                  <button onClick={() => handleEditAnimal(animal)}>Edit</button>
                  <button onClick={() => handleRemoveAnimal(animal.id)}>Remove</button>
                  {animal.adopted_by && (
                    <button onClick={() => handleUnadoptAnimal(animal.id)}>Unadopt</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}