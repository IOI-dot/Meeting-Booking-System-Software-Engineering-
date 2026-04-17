import { useMemo, useState } from "react";
import "../App.css";

function Search() {
  const roomsData = [
    {
      id: 1,
      name: "Conference Room 402",
      location: "Science Block · Level 3",
      capacity: 12,
      features: ["4K Display", "Video Hub"],
      availability: "08:00 — 20:00",
      slot: "Select 2h Slot",
      status: "Available Now",
    },
    {
      id: 2,
      name: "The Da Vinci Studio",
      location: "Arts Pavilion · Level 1",
      capacity: 6,
      features: ["4K Display", "Drawing Wall"],
      availability: "08:00 — 20:00",
      slot: "Select 1h Slot",
      status: "Available Now",
    },
    {
      id: 3,
      name: "Main Library 402",
      location: "Library Wing · 5 min walk",
      capacity: 10,
      features: ["Projector", "Whiteboards"],
      availability: "09:00 — 18:00",
      slot: "Select 1h Slot",
      status: "Available",
    },
    {
      id: 4,
      name: "The Hive Pod 09",
      location: "Student Union · 8 min walk",
      capacity: 4,
      features: ["Dual Monitor"],
      availability: "10:00 — 16:00",
      slot: "Select 30m Slot",
      status: "Available",
    },
  ];

  const [searchText, setSearchText] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [role, setRole] = useState("Student");
  const [filters, setFilters] = useState({
    display4k: true,
    whiteboards: false,
    projector: false,
    videoConf: true,
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

  const filteredRooms = useMemo(() => {
    return roomsData.filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(searchText.toLowerCase()) ||
        room.location.toLowerCase().includes(searchText.toLowerCase());

      const matchesCapacity = room.capacity >= Number(capacity);

      const matchesFeatures =
        activeFeatures.length === 0 ||
        activeFeatures.every((feature) => room.features.includes(feature));

      return matchesSearch && matchesCapacity && matchesFeatures;
    });
  }, [searchText, capacity, activeFeatures]);

  const suggestions = roomsData.filter((room) => {
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
                  className={
                    role === "Student"
                      ? "search-role-btn active-role"
                      : "search-role-btn"
                  }
                  onClick={() => setRole("Student")}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={
                    role === "TA / Faculty"
                      ? "search-role-btn active-role"
                      : "search-role-btn"
                  }
                  onClick={() => setRole("TA / Faculty")}
                >
                  TA / Faculty
                </button>
              </div>

              <label className="search-filter-label">
                Technology Requirements
              </label>
              <div className="search-checkbox-list">
                <label>
                  <input
                    type="checkbox"
                    checked={filters.display4k}
                    onChange={() => toggleFilter("display4k")}
                  />
                  4K Display
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={filters.whiteboards}
                    onChange={() => toggleFilter("whiteboards")}
                  />
                  Whiteboards
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={filters.projector}
                    onChange={() => toggleFilter("projector")}
                  />
                  Projector
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={filters.videoConf}
                    onChange={() => toggleFilter("videoConf")}
                  />
                  Video Conf.
                </label>
              </div>

              <button
                type="button"
                className="search-reset-btn"
                onClick={() =>
                  setFilters({
                    display4k: false,
                    whiteboards: false,
                    projector: false,
                    videoConf: false,
                  })
                }
              >
                Reset All Filters
              </button>
            </div>

            <div className="search-card search-quota-card">
              <h4>Fair Use Limit</h4>
              <p>
                You have used <strong>{usedHours} / {dailyQuota} hours</strong>{" "}
                of your daily booking quota.
              </p>
              <div className="search-progress-bar">
                <div
                  className="search-progress-fill"
                  style={{ width: `${(usedHours / dailyQuota) * 100}%` }}
                ></div>
              </div>
            </div>
          </section>

          <section className="search-results-panel">
            <div className="search-results-header">
              <div>
                <h2>Available Spaces</h2>
                <p>
                  Found <strong>{filteredRooms.length}</strong> rooms matching
                  your exact criteria.
                </p>
              </div>

              <div className="search-active-tags">
                {activeFeatures.map((feature, index) => (
                  <span key={index} className="search-filter-tag">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="search-rooms-grid">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <div className="search-room-card" key={room.id}>
                    <div className="search-room-top">
                      <span className="search-status-badge">{room.status}</span>
                    </div>

                    <h3>{room.name}</h3>
                    <p className="search-room-location">{room.location}</p>

                    <div className="search-room-features">
                      <span>Cap: {room.capacity}</span>
                      {room.features.map((feature, index) => (
                        <span key={index}>{feature}</span>
                      ))}
                    </div>

                    <div className="search-availability-section">
                      <div className="search-availability-head">
                        <span>Today’s Availability</span>
                        <span>{room.availability}</span>
                      </div>

                      <div className="search-timeline">
                        <div className="search-timeline-bar"></div>
                        <div className="search-timeline-slot slot1"></div>
                        <div className="search-timeline-slot slot2"></div>
                      </div>
                    </div>

                    <button type="button" className="search-slot-btn">
                      {room.slot}
                    </button>
                  </div>
                ))
              ) : (
                <div className="search-empty-state">
                  <h3>No exact matches found</h3>
                  <p>Try changing the filters or search text.</p>
                </div>
              )}
            </div>

            <div className="search-suggestion-box">
              <h3>Exhausted Exact Matches</h3>
              <p>
                No rooms match your specific{" "}
                <strong>Technology Requirements</strong>. We found nearby
                alternatives for you.
              </p>

              <div className="search-suggested-grid">
                {suggestions.slice(0, 2).map((room) => (
                  <div className="search-suggested-card" key={room.id}>
                    <div className="search-suggested-image"></div>
                    <div>
                      <h4>{room.name}</h4>
                      <p>{room.location}</p>
                      <div className="search-mini-tags">
                        {room.features.map((feature, index) => (
                          <span key={index}>{feature}</span>
                        ))}
                        <span>Cap: {room.capacity}</span>
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