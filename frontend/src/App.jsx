import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Search from "./Pages/Search";
import RoomBooking from "./Pages/RoomBooking";

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
      <Route path="/room/:id/book" element={<RoomBooking />} />
    </Routes>
  );
}

export default App;
