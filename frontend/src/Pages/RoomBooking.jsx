import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

function RoomBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { room } = location.state || {};
  
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!room) {
    return <div style={{ padding: '20px' }}>No room selected. <button onClick={() => navigate('/search')}>Go Back</button></div>;
  }

  const hoursOfDay = Array.from({ length: 24 }, (_, i) => i);

  const getSlotStatus = (hr) => {
    const booking = room.bookings?.find(b => {
      const start = parseInt(b.start_hour, 10);
      const end = b.end_hour ? parseInt(b.end_hour, 10) : start + 1;
      return hr >= start && hr < end;
    });
    return !!booking;
  };

  const handleSlotClick = (hr) => {
    if (getSlotStatus(hr)) return; // prevent clicking booked
    
    // logic to select range
    if (startHour === null) {
      setStartHour(hr);
      setEndHour(hr + 1);
    } else {
      // If clicking before start, reset start
      if (hr < startHour) {
         setStartHour(hr);
         setEndHour(hr + 1);
      } else {
         // Valid end selection
         const newEnd = hr + 1;
         if (newEnd - startHour > 4) {
             setError("Cannot book more than 4 hours.");
             setTimeout(() => setError(""), 3000);
         } else {
             // check for booked slots in between
             let conflict = false;
             for (let i = startHour; i < newEnd; i++) {
                 if (getSlotStatus(i)) conflict = true;
             }
             if (conflict) {
                 setError("Selection contains booked slots.");
                 setTimeout(() => setError(""), 3000);
                 setStartHour(hr);
                 setEndHour(hr + 1);
             } else {
                 setEndHour(newEnd);
             }
         }
      }
    }
  };

  const handleConfirm = async () => {
    if (startHour === null) {
      setError("Please select a time slot on the bar.");
      return;
    }
    
    try {
      const payload = {
        roomId: room.id,
        userId: user ? user.id : 1, // hardcode fallback if no login
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        date: new Date().toISOString().split('T')[0] // today's date
      };

      const res = await fetch("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed");
        return;
      }
      
      setSuccess("Registration confirmed!");
      setTimeout(() => {
        navigate("/search");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Server error.");
    }
  };

  return (
    <div className="search-page" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
       <button onClick={() => navigate('/search')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}>← Back to Search</button>
       
       <div className="search-room-card" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
         <h1 style={{ marginBottom: '10px' }}>{room.room_name}</h1>
         <p style={{ color: '#666', marginBottom: '20px' }}>Capacity: {room.capacity} | Tech: {room.technology}</p>
         
         <h3 style={{ marginBottom: '5px' }}>Select Time Slot (Max 4 hrs)</h3>
         <p style={{ fontSize: '0.9em', color: '#555', marginBottom: '15px' }}>
           Click a block to start, then click another to select range.
         </p>
         
         <div style={{ display: 'flex', gap: '2px', height: '40px', marginBottom: '30px', borderRadius: '4px', overflow: 'hidden', background: '#eee' }}>
           {hoursOfDay.map(hr => {
              const isBooked = getSlotStatus(hr);
              const isSelected = startHour !== null && hr >= startHour && hr < endHour;
              
              let bgColor = '#16a34a'; // free
              if (isBooked) bgColor = '#dc2626'; // booked
              else if (isSelected) bgColor = '#2563eb'; // selected
              
              return (
                <div 
                  key={hr}
                  onMouseDown={() => handleSlotClick(hr)}
                  style={{
                    flex: 1, 
                    backgroundColor: bgColor,
                    cursor: isBooked ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  title={`${hr}:00`}
                >
                  <span style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: '0', 
                      fontSize: '11px', 
                      marginTop: '4px',
                      color: '#666',
                      transform: 'translateX(-50%)'
                    }}>
                    {hr % 4 === 0 ? `${hr}:00` : ''}
                  </span>
                </div>
              );
           })}
         </div>

         <div style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '6px' }}>
           {startHour !== null ? (
             <p style={{ fontWeight: 'bold', fontSize: '1.1em', margin: 0 }}>
               Selected: <span style={{ color: '#2563eb' }}>{startHour.toString().padStart(2, '0')}:00 - {endHour.toString().padStart(2, '0')}:00 </span> 
               <span style={{ color: '#64748b', fontWeight: 'normal', marginLeft: '5px' }}>({endHour - startHour} hour{endHour - startHour > 1 ? 's' : ''})</span>
             </p>
           ) : (
             <p style={{ margin: 0, color: '#64748b' }}>No slot selected.</p>
           )}
         </div>

         {error && <p style={{ color: '#dc2626', marginTop: '10px', fontWeight: '500' }}>{error}</p>}
         {success && <p style={{ color: '#16a34a', marginTop: '10px', fontWeight: '500' }}>{success}</p>}

         <button 
           onClick={handleConfirm}
           disabled={startHour === null || !!success}
           style={{ 
             padding: '12px 24px', 
             fontSize: '1.1em', 
             marginTop: '10px',
             backgroundColor: startHour === null || !!success ? '#94a3b8' : '#2563eb',
             color: 'white',
             border: 'none',
             borderRadius: '6px',
             cursor: startHour === null || !!success ? 'not-allowed' : 'pointer',
             fontWeight: '600',
             transition: 'background-color 0.2s'
           }}
         >
           {success ? '✓ Confirmed' : 'Confirm Registration'}
         </button>
       </div>
    </div>
  );
}

export default RoomBooking;
