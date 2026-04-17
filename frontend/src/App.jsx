import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Search from "./Pages/Search";

function App() {
  return (
    <Routes>
      {/* Landing page is Login */}
      <Route path="/" element={<Login />} />
      
      {/* Auth Routes */}
      <Route path="/signup" element={<Signup />} />
      
      {/* The Dashboard: Both paths now lead to your real 
         search page with the 24-hour timeline 
      */}
      <Route path="/home" element={<Search />} />
      <Route path="/search" element={<Search />} />
    </Routes>
  );
}

export default App;
