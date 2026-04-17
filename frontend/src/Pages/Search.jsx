import { useMemo, useState, useEffect } from "react"; // Added useEffect
import "../App.css";

function Search() {
  // --- REAL DATA LOGIC START ---
  const [rooms, setRooms] = useState([]); // This replaces the fake roomsData array
  const [loading, setLoading] = useState(true);

  // Generate 24 hours for the real timeline
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => {
    return `${i.toString().padStart(2, "0")}:00`;
  });

  useEffect(() => {
    // Fetch from your PostgreSQL backend
    fetch("http://localhost:3000/api/timeline")
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching rooms:", err);
        setLoading(false);
      });
  }, []);
  // --- REAL DATA LOGIC END ---

  const [searchText, setSearchText] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [role, setRole] = useState("Student");
  const [filters, setFilters] = useState({
  display4k: false,    // Change to false
  whiteboards: false,
  projector: false,
  videoConf: false,    // Change to false
});

  const usedHours = 2.5;
  const dailyQuota = 4.0;

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
          <button className="search-menu-item active">Search</button>
          <button className="search-menu-item">My Bookings</button>
          <button className="search-menu-item">Public Rooms</button>
          <button className="search-menu-item">Profile</button>
        </nav>

        <button className="search-book-room-btn">Book a Room</button>
      </aside>

      <main className="search-main">
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
              <p>You have used <strong>{usedHours} / {dailyQuota} hours</strong> of your daily booking quota.</p>
              <div className="search-progress-bar">
                <div className="search-progress-fill" style={{ width: `${(usedHours / dailyQuota) * 100}%` }}></div>
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
                           const booking = room.bookings?.find(b => parseInt(b.start_hour, 10) === currentHourNum);
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

                    <button type="button" className="search-slot-btn">Book Now</button>
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
      </main>
    </div>
  );
}

export default Search;
