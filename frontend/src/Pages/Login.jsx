import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import AUC from "../assets/AUC.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

/*if (!response.ok) {
  if (!email.trim() || !password.trim()) {
    setError("Validation failed.");
  } else {
    setError("Invalid email or password.");
  }
  return;
}*/
if (!response.ok) {
  setError(data.message);
  return;
}
      setSuccess("Login successful!");
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        navigate("/search");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div
        className="login-left"
        style={{ backgroundImage: `url(${AUC})` }}
      >
        <div className="overlay">
          <div className="left-content">
            <h1>
              AUC booking
              <br />
              system
            </h1>

            <p>
              Reserve your study space, connect with others, and stay organized
              throughout your academic journey.
            </p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="form-box">
          <h2>Welcome Back</h2>
          <p className="subtitle">
            Enter your credentials to access the booking portal.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@aucegypt.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="password-row">
              <label>Password</label>
              <a href="/">Forgot password?</a>
            </div>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}

            <button type="submit" className="login-btn">
              Log In
            </button>
          </form>

          <p className="signup-text">
            New here? <Link to="/signup">Create an institutional account</Link>
            </p>

          <div className="footer-links">
            <a href="/">Privacy Policy</a>
            <a href="/">Terms of Service</a>
            <a href="/">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
