import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";

export default function CodeGenerator() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [useCount, setUseCount] = useState(1); // New state for use count
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const response = await fetch("http://localhost:5000/codes");
    const data = await response.json();
    setCodes(data);
  };

  const handleAddCode = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5000/add-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, code, useCount }), // Include useCount in the request body
    });
    if (response.ok) {
      fetchCodes();
      setName("");
      setCode("");
      setUseCount(1); // Reset use count
    } else {
      alert("Error adding code");
    }
  };

  const handleDeleteCode = async (id) => {
    const response = await fetch(`http://localhost:5000/delete-code/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      fetchCodes();
    } else {
      alert("Error deleting code");
    }
  };

  return (
    <div className="admin-page">
      <Link to="/admin" className="back-link">Back to Admin</Link>
      <h2>Code Generator/Viewer</h2>
      <form onSubmit={handleAddCode}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <br />
        <input
          type="text"
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <br />
        <input
          type="number"
          placeholder="Use Count"
          value={useCount}
          onChange={(e) => setUseCount(e.target.value)}
          min="1"
        />
        <br />
        <button type="submit">Add Code</button>
      </form>
      <div className="code-list">
        <h3>Active Codes</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Use Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id}>
                <td>{code.name}</td>
                <td>{code.code}</td>
                <td>{code.use_count}</td>
                <td>
                  <button onClick={() => handleDeleteCode(code.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}