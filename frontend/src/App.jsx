import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Search from "./Pages/Search";

function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Main Page</h1>
      <p>You can build this page later.</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/search" element={<Search />} />
    </Routes>
  );
}

export default App;