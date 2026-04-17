import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Search() {
  // --- REAL DATA LOGIC START ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Generate 24 hours for the real timeline
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => {
    return `${i.toString().padStart(2, "0")}:00`;
  });

  useEffect(() => {
    // Fetch from your PostgreSQL backend
    fetch("http://localhost:3000/api/timeline")
      .then((res) => {
        if (!res.ok) throw new Error("Backend error");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
            setRooms(data);
        } else {
            setRooms([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching rooms:", err);
        setLoading(false);
      });
  }, []);
  // --- REAL DATA LOGIC END ---

  const [activeTab, setActiveTab] = useState("Search");
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    if (activeTab === "My Bookings") {
       const savedUser = localStorage.getItem("user");
       if (savedUser) {
          const userObj = JSON.parse(savedUser);
          fetch(`http://localhost:3000/api/bookings/my-bookings/${userObj.id}`)
            .then(res => res.json())
            .then(data => {
               if (data.success) {
                   setMyBookings(data.bookings);
               }
            })
            .catch(err => console.error("My Bookings fetch error", err));
       }
    }
  }, [activeTab]);

  const [searchText, setSearchText] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [role, setRole] = useState("Student");
  const [filters, setFilters] = useState({
    display4k: false,
    whiteboards: false,
    projector: false,
    videoConf: false,
  });

  const [usedHours, setUsedHours] = useState(0);
  const dailyQuota = 4.0;

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
       const userObj = JSON.parse(savedUser);
       // Simple local date to match database Date format
       const tzoffset = (new Date()).getTimezoneOffset() * 60000;
       const todayDate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
       
       fetch(`http://localhost:3000/api/bookings/quota/${userObj.id}/${todayDate}`)
         .then(res => res.json())
         .then(data => {
            if (data.success) {
                setUsedHours(data.usedHours);
            }
         })
         .catch(err => console.error("Quota fetch error", err));
    }
  }, []);

  const toggleFilter = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const activeFeatures = useMemo(() => {
    const list = [];
    if (filters.display4k) list.push("4K Display");
    if (filters.whiteboards) list.push("Whiteboards");
    if (filters.projector) list.push("Projector");
    if (filters.videoConf) list.push("Video Hub");
    return list;
  }, [filters]);

  // Updated to use the REAL 'rooms' state from database
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.room_name.toLowerCase().includes(searchText.toLowerCase());

      const matchesCapacity = room.capacity >= Number(capacity);

      // Simple check for technology tags
      const matchesFeatures =
        activeFeatures.length === 0 ||
        activeFeatures.every((feature) => 
          (room.technology || "").toLowerCase().includes(feature.toLowerCase().split(' ')[0])
        );

      return matchesSearch && matchesCapacity && matchesFeatures;
    });
  }, [rooms, searchText, capacity, activeFeatures]);

  const suggestions = rooms.filter((room) => {
    return (
      room.capacity >= Number(capacity) &&
      !filteredRooms.some((matchedRoom) => matchedRoom.id === room.id)
    );
  });

  return (
    <div className="search-page">
      <aside className="search-sidebar">
        <div className="search-logo-box">
          <h2>AUC booking system</h2>
          <p>UNIVERSITY RESOURCE HUB</p>
        </div>

        <nav className="search-sidebar-menu">
          <button className={`search-menu-item ${activeTab === 'Search' ? 'active' : ''}`} onClick={() => setActiveTab('Search')}>Search</button>
          <button className={`search-menu-item ${activeTab === 'My Bookings' ? 'active' : ''}`} onClick={() => setActiveTab('My Bookings')}>My Bookings</button>
          <button className="search-menu-item">Public Rooms</button>
          <button className="search-menu-item">Profile</button>
        </nav>

        <button className="search-book-room-btn">Book a Room</button>
      </aside>

      <main className="search-main">
        {activeTab === "Search" && (
          <>
            <div className="search-top-bar">
              <h1>Search Results</h1>
              <input
                type="text"
                placeholder="Quick search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-quick-input"
              />
            </div>

            <div className="search-layout">
          <section className="search-filters-panel">
            <div className="search-card">
              <h3>Refine Search</h3>

              <label className="search-filter-label">Minimum Capacity</label>
              <div className="search-capacity-row">
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="search-capacity-input"
                />
                <span>People</span>
              </div>

              <label className="search-filter-label">Your Role</label>
              <div className="search-role-buttons">
                <button
                  type="button"
                  className={role === "Student" ? "search-role-btn active-role" : "search-role-btn"}
                  onClick={() => setRole("Student")}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={role === "TA / Faculty" ? "search-role-btn active-role" : "search-role-btn"}
                  onClick={() => setRole("TA / Faculty")}
                >
                  TA / Faculty
                </button>
              </div>

              <label className="search-filter-label">Technology Requirements</label>
              <div className="search-checkbox-list">
                <label><input type="checkbox" checked={filters.display4k} onChange={() => toggleFilter("display4k")} /> 4K Display</label>
                <label><input type="checkbox" checked={filters.whiteboards} onChange={() => toggleFilter("whiteboards")} /> Whiteboards</label>
                <label><input type="checkbox" checked={filters.projector} onChange={() => toggleFilter("projector")} /> Projector</label>
                <label><input type="checkbox" checked={filters.videoConf} onChange={() => toggleFilter("videoConf")} /> Video Conf.</label>
              </div>

              <button
                type="button"
                className="search-reset-btn"
                onClick={() => setFilters({ display4k: false, whiteboards: false, projector: false, videoConf: false })}
              >
                Reset All Filters
              </button>
            </div>

            <div className="search-card search-quota-card">
              <h4>Fair Use Limit</h4>
              {usedHours >= dailyQuota ? (
                  <p style={{ color: "#dc2626", fontWeight: "bold" }}>You have reached the use limit for today.</p>
              ) : (
                  <p>You have used <strong>{usedHours} / {dailyQuota} hours</strong> of your daily booking quota.</p>
              )}
              <div className="search-progress-bar" style={{ backgroundColor: "#e2e8f0", overflow: "hidden", borderRadius: "8px" }}>
                <div 
                  className="search-progress-fill" 
                  style={{ 
                    width: `${Math.min((usedHours / dailyQuota) * 100, 100)}%`,
                    backgroundColor: usedHours >= dailyQuota ? "#dc2626" : "#2563eb",
                    height: "100%",
                    transition: "all 0.5s ease"
                  }}
                ></div>
              </div>
            </div>
          </section>

          <section className="search-results-panel">
            <div className="search-results-header">
              <div>
                <h2>Available Spaces</h2>
                <p>Found <strong>{filteredRooms.length}</strong> rooms matching your exact criteria.</p>
              </div>

              <div className="search-active-tags">
                {activeFeatures.map((feature, index) => (
                  <span key={index} className="search-filter-tag">{feature}</span>
                ))}
              </div>
            </div>

            <div className="search-rooms-grid">
              {loading ? <p>Loading Database...</p> : filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <div className="search-room-card" key={room.id}>
                    <div className="search-room-top">
                      <span className="search-status-badge">Available Now</span>
                    </div>

                    <h3>{room.room_name}</h3>
                    <p className="search-room-location">AUC Campus · {room.technology}</p>

                    <div className="search-room-features">
                      <span>Cap: {room.capacity}</span>
                    </div>

                    <div className="search-availability-section">
                      <div className="search-availability-head">
                        <span>24-Hour Timeline</span>
                        <span>00:00 — 23:00</span>
                      </div>

                      {/* --- FIX: INSERTING THE REAL TIMELINE BAR --- */}
                      <div className="search-timeline" style={{ height: "20px", display: "flex", gap: "1px", background: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                        {hoursOfDay.map((hour) => {
                           const currentHourNum = parseInt(hour.split(":")[0], 10);
                           const booking = room.bookings?.find(b => {
                             const start = parseInt(b.start_hour, 10);
                             const end = b.end_hour ? parseInt(b.end_hour, 10) : start + 1;
                             return currentHourNum >= start && currentHourNum < end;
                           });
                           const isBooked = !!booking;
                           return (
                             <div 
                               key={hour} 
                               title={isBooked ? `Booked at ${hour}` : `Free at ${hour}`}
                               style={{ flex: 1, backgroundColor: isBooked ? "#dc2626" : "#16a34a" }} 
                             />
                           );
                        })}
                      </div>
                      {/* --- END FIX --- */}
                    </div>

                    <button type="button" className="search-slot-btn" onClick={() => navigate(`/room/${room.id}/book`, { state: { room } })}>Book Now</button>
                  </div>
                ))
              ) : (
                <div className="search-empty-state">
                  <h3>No exact matches found</h3>
                  <p>Try changing the filters or search text.</p>
                </div>
              )}
            </div>

            {/* Suggestions section kept exactly as requested */}
            <div className="search-suggestion-box">
              <h3>Exhausted Exact Matches</h3>
              <p>No rooms match your specific <strong>Technology Requirements</strong>. We found nearby alternatives for you.</p>
              <div className="search-suggested-grid">
                {suggestions.slice(0, 2).map((room) => (
                  <div className="search-suggested-card" key={room.id}>
                    <div className="search-suggested-image"></div>
                    <div>
                      <h4>{room.room_name}</h4>
                      <p>Capacity: {room.capacity}</p>
                      <div className="search-mini-tags">
                        <span>{room.technology}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </section>
          </div>
        </>
        )}
        
        {activeTab === "My Bookings" && (
          <div className="my-bookings-container" style={{ padding: "20px" }}>
            <h1 style={{ marginBottom: "20px", fontSize: "2rem", color: "#1e293b" }}>My Registered Rooms</h1>
            <div className="search-rooms-grid">
              {myBookings.length > 0 ? (
                myBookings.map((b) => (
                  <div className="search-room-card" key={b.id || Math.random()}>
                    <div className="search-room-top">
                      <span className="search-status-badge" style={{ backgroundColor: "#3b82f6", color: "white" }}>Confirmed</span>
                    </div>

                    <h3>Room {b.roomName}</h3>
                    <p className="search-room-location">Date: {b.date}</p>
                    <p className="search-room-location">Time: {b.startTime} — {b.endTime}</p>

                    <div className="search-room-features" style={{ marginTop: "15px" }}>
                      <span>Cap: {b.roomCapacity}</span>
                      <span style={{ marginLeft: "10px" }}>Tech: {b.roomTechnology}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-empty-state">
                  <h3>No bookings found</h3>
                  <p>You haven't registered any rooms yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Search;
