import { useState } from "react";
import "../App.css";
import AUC from "../assets/AUC.jpg";

function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ role, email, password });
  };

  return (
    <div className="login-page">
<div
  className="login-left"
  style={{ backgroundImage: `url(${AUC})` }}
>        <div className="overlay">
          <div className="left-content">
            <h1>
              AUC booking
              <br />
              system
            </h1>

            <p>
              Reserve your study space, connect with others, 
              and stay organized throughout your academic journey.
            </p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="form-box">
          <h2>Welcome Back</h2>
          <p className="subtitle">
            Select your current role and enter your credentials to access the
            booking portal.
          </p>

          <p className="section-label">I AM LOGGING IN AS</p>

          <div className="role-buttons">
            <button
              type="button"
              className={role === "student" ? "role-card active" : "role-card"}
              onClick={() => setRole("student")}
            >
              Student
            </button>

            <button
              type="button"
              className={role === "ta" ? "role-card active" : "role-card"}
              onClick={() => setRole("ta")}
            >
              Graduate TA
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="alex.rivers@university.edu"
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

            <button type="submit" className="login-btn">
              Log In
            </button>
          </form>

          <p className="signup-text">
            New here? <a href="/">Create an institutional account</a>
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