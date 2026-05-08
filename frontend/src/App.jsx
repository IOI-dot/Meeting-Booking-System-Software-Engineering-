import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Search from "./Pages/Search";
import RoomBooking from "./Pages/RoomBooking";
import Mybookings from "./Pages/Mybookings"; // Make sure this file exists in src/Pages/

function App() {
  return (
    <Routes>
      {/* Landing page is Login */}
      <Route path="/" element={<Login />} />
      
      {/* Auth Routes */}
      <Route path="/signup" element={<Signup />} />
      
      {/* App Routes */}
      <Route path="/home" element={<Search />} />
      <Route path="/search" element={<Search />} />
      
      {/* Booking Flow */}
      <Route path="/room/:id/book" element={<RoomBooking />} />
      
      {/* User Reservations & Edit/Cancel (User Story 11) */}
      <Route path="/my-bookings" element={<Mybookings />} />
    </Routes>
  );
}

export default App;