import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import AUC_main from "../assets/AUC_main.jpg";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword: password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
  console.log("Signup error:", data);

  if (data.message === "Validation failed.") {
    setError(data.errors?.[0] || "Validation failed.");
  } else {
    setError(data.message || "Signup failed");
  }

  return;
}

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="signup-page">
      <div
        className="signup-left"
        style={{ backgroundImage: `url(${AUC_main})` }}
      >
        <div className="overlay">
          <div className="brand-row">
            <div className="brand-icon">🏛️</div>
            <span>AUC booking system</span>
          </div>

          <div className="left-content signup-left-content">
            <h1>
              Your campus, 
              <br />
              organized
            </h1>

            <p>
              Easily reserve campus spaces, connect with classmates,
              and manage your academic activities at AUC.
            </p>


          </div>
        </div>
      </div>

      <div className="signup-right">
        <div className="signup-form-box">
          <h2>Create your account</h2>
          <p className="subtitle">
            Join the academic community at Atheneum.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Dr. Elena Rodriguez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <label>University Email</label>
            <input
              type="email"
              placeholder="name@aucegypt.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="helper-text">
              Must be a valid .edu or institutional domain
            </p>

            <label>Identify Your Role</label>
            <div className="role-buttons">
              <button
                type="button"
                className={role === "student" ? "role-card active" : "role-card"}
                onClick={() => setRole("student")}
              >
                <strong>Student</strong>
                <span>Undergrad or Graduate pursuit</span>
              </button>

              <button
                type="button"
                className={role === "ta" ? "role-card active" : "role-card"}
                onClick={() => setRole("ta")}
              >
                <strong>Graduate TA</strong>
                <span>Teaching and research access</span>
              </button>
            </div>

            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}

            <button type="submit" className="signup-btn">
              Create Account →
            </button>
          </form>

          <p className="signup-text">
            Already have an account? <Link to="/">Log In</Link>
          </p>

          <div className="footer-links">
            <a href="/">Privacy</a>
            <a href="/">Terms</a>
            <a href="/">Security</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;