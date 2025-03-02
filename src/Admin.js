import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import "./Admin.css";

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD; // Use environment variable for admin password

const ItemType = {
  CATEGORY: 'category',
};

const DraggableCategory = ({ category, index, moveCategory, deleteCategory }) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: ItemType.CATEGORY,
    hover(item) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      moveCategory(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.CATEGORY,
    item: { type: ItemType.CATEGORY, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <li ref={ref} style={{ opacity: isDragging ? 0.5 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {category}
      <button onClick={() => deleteCategory(category)}>Delete</button>
    </li>
  );
};

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [editAnimal, setEditAnimal] = useState(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");

  useEffect(() => {
    fetchPageDetails();
    fetchWebsiteTitle();
    fetchCategories();
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
    try {
      const response = await fetch("http://localhost:5000/pets");
      if (!response.ok) {
        throw new Error("Failed to fetch animals");
      }
      const data = await response.json();
      console.log("Fetched animals:", data); // Add this line for debugging
      setAnimals(data);
    } catch (error) {
      console.error("Error fetching animals:", error);
    }
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

  const fetchCategories = async () => {
    const response = await fetch("http://localhost:5000/categories");
    const data = await response.json();
    setCategories(data);
  };

  const handleAddAnimal = async (e) => {
    e.preventDefault(); // Prevent form submission from causing a page reload

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("long_description", longDescription);
    formData.append("category", category || newCategory);
    formData.append("image", imageFile);

    const response = await fetch("http://localhost:5000/add-animal", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      fetchAnimals();
      setName("");
      setDescription("");
      setLongDescription("");
      setCategory("");
      setNewCategory("");
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
    setLongDescription(animal.long_description);
    setCategory(animal.category);
    setImageFile(null);
  };

  const handleUpdateAnimal = async (e) => {
    e.preventDefault(); // Prevent form submission from causing a page reload

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("long_description", longDescription);
    formData.append("category", category || newCategory);
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
      setLongDescription("");
      setCategory("");
      setNewCategory("");
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

  const moveCategory = (dragIndex, hoverIndex) => {
    const reorderedCategories = Array.from(categories);
    const [movedCategory] = reorderedCategories.splice(dragIndex, 1);
    reorderedCategories.splice(hoverIndex, 0, movedCategory);
    setCategories(reorderedCategories);
  };

  const saveCategoryOrder = async () => {
    const response = await fetch("http://localhost:5000/update-category-order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories }),
    });
    if (response.ok) {
      alert("Category order updated successfully");
    } else {
      alert("Error updating category order");
    }
  };

  const deleteCategory = async (category) => {
    const response = await fetch(`http://localhost:5000/delete-category/${category}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setCategories(categories.filter((cat) => cat !== category));
      alert("Category deleted successfully");
    } else {
      alert("Error deleting category");
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
      <Link to="/code-generator" className="CodeLink">Code Generator/Viewer</Link>
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
          <textarea
            placeholder="Long Description"
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="New Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
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
      <div className="category-list">
        <h3>Category List</h3>
        <DndProvider backend={HTML5Backend}>
          <ul>
            {categories.map((cat, index) => (
              <DraggableCategory
                key={cat}
                category={cat}
                index={index}
                moveCategory={moveCategory}
                deleteCategory={deleteCategory}
              />
            ))}
          </ul>
        </DndProvider>
        <button onClick={saveCategoryOrder}>Save Category Order</button>
      </div>
      <div className="animal-list">
        <h3>Animal List</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Long Description</th>
              <th>Category</th>
              <th>Adopted</th>
              <th>Adopted By</th>
              <th>Adopted At</th>
              <th>Adopter IP</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {animals.map((animal) => (
              <tr key={animal.id}>
                <td>{animal.name}</td>
                <td>{animal.description}</td>
                <td>{animal.long_description}</td>
                <td>{animal.category}</td>
                <td>{animal.adopted_by ? "Yes" : "No"}</td>
                <td>{animal.adopted_by || "N/A"}</td>
                <td>{animal.adopted_at || "N/A"}</td>
                <td>{animal.adopter_ip || "N/A"}</td>
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