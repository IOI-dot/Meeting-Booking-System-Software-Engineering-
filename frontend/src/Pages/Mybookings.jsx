import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const user = JSON.parse(localStorage.getItem("user")) || { id: 1 };
  const navigate = useNavigate();

  // 1. Fetch bookings on mount
  useEffect(() => {
    fetch(`http://localhost:3000/api/bookings/my-bookings/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBookings(data.bookings);
        }
      })
      .catch(err => console.error("Error fetching bookings:", err));
  }, [user.id]);

  // 2. Handle Edit (Find alternatives for Story 7/11)
  const handleEdit = async (booking) => {
    setSelectedBooking(booking);
    try {
      const res = await fetch(`http://localhost:3000/api/bookings/${booking.bookingID}/alternatives`);
      const data = await res.json();
      setAlternatives(data.rooms || []);
      setShowEditModal(true);
    } catch (err) {
      alert("Could not load alternatives.");
    }
  };

  // 3. Confirm Atomic Swap
  const confirmChange = async (newRoomId) => {
    const res = await fetch(`http://localhost:3000/api/bookings/${selectedBooking.bookingID}/change-room`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newRoomId })
    });
    const data = await res.json();
    if (data.success) {
      alert("Room Updated successfully!");
      window.location.reload();
    } else {
      alert(data.error || "Swap failed.");
    }
  };

  // 4. Handle Cancellation
  const handleCancel = async (bookingID) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/bookings/${bookingID}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert("Booking cancelled.");
        setBookings(bookings.filter(b => b.bookingID !== bookingID));
      } else {
        alert(data.error || "Cancellation failed.");
      }
    } catch (err) {
      alert("Server error during cancellation.");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '30px', color: '#0d1b3f' }}>My Registered Rooms</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {bookings.length > 0 ? bookings.map(b => (
          <div key={b.bookingID} className="search-room-card" style={{ padding: '25px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '20px', right: '20px', background: '#2563eb', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>
              Confirmed
            </span>
            
            <h3 style={{ margin: '0 0 15px 0' }}>{b.room_name}</h3>
            
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
               <p style={{ margin: '4px 0' }}><strong>DATE:</strong> {b.date}</p>
               <p style={{ margin: '4px 0' }}><strong>TIME:</strong> {b.startTime}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                Cap: <strong>{b.capacity}</strong>
              </span>
              <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                Tech: <strong>{b.technology}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => handleEdit(b)} 
                  className="login-btn" 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#eef2f8', color: '#2563eb', border: '1px solid #d9deea' }}
                >
                  Edit Booking
                </button>
                <button 
                  onClick={() => handleCancel(b.bookingID)} 
                  style={{ width: '100%', padding: '12px', color: '#dc2626', background: 'white', border: '1px solid #fee2e2', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel Booking
                </button>
            </div>
          </div>
        )) : (
          <p style={{ color: '#64748b' }}>No active reservations found.</p>
        )}
      </div>

      {/* Edit Modal for Alternatives */}
      {showEditModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 1000 }}>
          <div style={{ background:'white', padding:'30px', borderRadius:'12px', width:'450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0 }}>Alternative Rooms</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Found these rooms available for your exact time slot ({selectedBooking?.startTime}):</p>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', margin: '20px 0' }}>
              {alternatives.length > 0 ? alternatives.map(r => (
                <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{r.room_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Cap: {r.capacity} | {r.technology}</div>
                  </div>
                  <button 
                    onClick={() => confirmChange(r.id)}
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Swap
                  </button>
                </div>
              )) : <p style={{ textAlign: 'center', padding: '20px' }}>No suitable alternatives available.</p>}
            </div>
            
            <button 
              onClick={() => setShowEditModal(false)} 
              style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;