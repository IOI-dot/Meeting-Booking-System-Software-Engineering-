import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Search from "./Pages/Search";
import RoomBooking from "./Pages/RoomBooking";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Search />} />
      <Route path="/search" element={<Search />} />
      <Route path="/room/:id/book" element={<RoomBooking />} />
    </Routes>
  );
}

export default App;
