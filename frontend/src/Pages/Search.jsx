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

  const fetchRooms = () => {
    setLoading(true);
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
  };

  const [activeTab, setActiveTab] = useState("Search");
  const [myBookings, setMyBookings] = useState([]);
  const [cancelModal, setCancelModal] = useState(null);   // holds booking object to cancel
  const [cancellingId, setCancellingId] = useState(null);  // loading state
  const [cancelSuccess, setCancelSuccess] = useState("");  // toast message

  // --- Edit booking states ---
  const [editModal, setEditModal] = useState(null);        // holds booking object to edit
  const [editingId, setEditingId] = useState(null);        // loading state
  const [editForm, setEditForm] = useState({
    roomId: "",
    startTime: "",
    endTime: "",
    date: ""
  });

  // Re-fetch timeline + quota every time the user switches to Search tab
  useEffect(() => {
    if (activeTab === "Search") {
      fetchRooms();
      fetchQuota();
    }
  }, [activeTab]);
  // --- REAL DATA LOGIC END ---

  const fetchMyBookings = () => {
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
  };

  useEffect(() => {
    if (activeTab === "My Bookings") {
      fetchMyBookings();
      fetchRooms();
    }
  }, [activeTab]);

  // --- Cancel booking handler ---
  const handleCancelBooking = async (booking) => {
    const savedUser = localStorage.getItem("user");
    const userObj = savedUser ? JSON.parse(savedUser) : null;

    setCancellingId(booking.booking_id);

    try {
      const res = await fetch(`http://localhost:3000/api/bookings/${booking.booking_id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userObj ? userObj.id : undefined })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCancelSuccess(data.message);
        fetchMyBookings();        // refresh the bookings list
        fetchRooms();             // refresh timeline (cancelled slot → green)
        fetchQuota();             // refresh fair-use bar
        setTimeout(() => setCancelSuccess(""), 4000);
      } else {
        alert(data.error || "Cancellation failed.");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Server error while cancelling.");
    } finally {
      setCancellingId(null);
      setCancelModal(null);
    }
  };

  // --- Edit booking handler ---
  const handleEditBooking = async () => {
    if (!editForm.roomId || !editForm.startTime || !editForm.endTime || !editForm.date) {
      alert("Please choose room, date, and time.");
      return;
    }

    try {
      setEditingId(editModal.booking_id);

      const savedUser = localStorage.getItem("user");
      const userObj = savedUser ? JSON.parse(savedUser) : null;

      const payload = {
        userId: userObj.id,
        roomId: Number(editForm.roomId),
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        date: editForm.date
      };

      const res = await fetch(`http://localhost:3000/api/bookings/${editModal.booking_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Edit failed");
        return;
      }

      fetchMyBookings();        // refresh updated bookings list
      fetchRooms();             // refresh timeline
      fetchQuota();             // refresh fair-use bar

      setEditModal(null);
      alert("Booking updated successfully!");
    } catch (err) {
      console.error("Edit error:", err);
      alert("Server error while editing.");
    } finally {
      setEditingId(null);
    }
  };

  // --- Edit booking timeline helpers ---
  const getEditStartHour = () => {
    return editForm.startTime ? parseInt(editForm.startTime.split(":")[0], 10) : null;
  };

  const getEditEndHour = () => {
    return editForm.endTime ? parseInt(editForm.endTime.split(":")[0], 10) : null;
  };

  const selectedEditRoom = rooms.find((room) => room.id === Number(editForm.roomId));

  const isEditSlotBooked = (hr) => {
    if (!selectedEditRoom) return false;

    const booking = selectedEditRoom.bookings?.find((b) => {
      const start = parseInt(b.start_hour, 10);
      const end = b.end_hour ? parseInt(b.end_hour, 10) : start + 1;

      // allow the current booking time while editing
      if (editModal && b.booking_id === editModal.booking_id) {
        return false;
      }

      return hr >= start && hr < end;
    });

    return !!booking;
  };

  const handleEditSlotClick = (hr) => {
    if (!editForm.roomId) {
      alert("Please select a room first.");
      return;
    }

    if (isEditSlotBooked(hr)) return;

    const currentStart = getEditStartHour();

    if (currentStart === null || hr < currentStart) {
      setEditForm({
        ...editForm,
        startTime: `${hr.toString().padStart(2, "0")}:00`,
        endTime: `${(hr + 1).toString().padStart(2, "0")}:00`
      });
      return;
    }

    const newEnd = hr + 1;

    if (newEnd - currentStart > 4) {
      alert("Cannot book more than 4 hours.");
      return;
    }

    for (let i = currentStart; i < newEnd; i++) {
      if (isEditSlotBooked(i)) {
        alert("Selection contains booked slots.");
        return;
      }
    }

    setEditForm({
      ...editForm,
      endTime: `${newEnd.toString().padStart(2, "0")}:00`
    });
  };

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

  const fetchQuota = () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      const tzoffset = new Date().getTimezoneOffset() * 60000;
      const todayDate = new Date(Date.now() - tzoffset).toISOString().split("T")[0];

      fetch(`http://localhost:3000/api/bookings/quota/${userObj.id}/${todayDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUsedHours(data.usedHours);
          }
        })
        .catch(err => console.error("Quota fetch error", err));
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchQuota();
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
          (room.technology || "").toLowerCase().includes(feature.toLowerCase().split(" ")[0])
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
          <button className={`search-menu-item ${activeTab === "Search" ? "active" : ""}`} onClick={() => setActiveTab("Search")}>Search</button>
          <button className={`search-menu-item ${activeTab === "My Bookings" ? "active" : ""}`} onClick={() => setActiveTab("My Bookings")}>My Bookings</button>
          <button className="search-menu-item">Public Rooms</button>
          <button className="search-menu-item" onClick={() => { localStorage.removeItem("user"); navigate("/"); }}>Logout</button>
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

                {/* Suggestions section */}
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

        {/* THIS IS THE FIXED "MY BOOKINGS" BLOCK! */}
        {activeTab === "My Bookings" && (
          <div className="my-bookings-container" style={{ padding: "20px" }}>
            <h1 style={{ marginBottom: "20px", fontSize: "2rem", color: "#1e293b" }}>My Registered Rooms</h1>

            {/* Cancellation success toast */}
            {cancelSuccess && (
              <div className="cancel-success-toast">
                <span className="cancel-toast-icon">✓</span>
                {cancelSuccess}
              </div>
            )}

            <div className="search-rooms-grid">
              {myBookings.length > 0 ? (
                myBookings.map((b) => {
                  const isCancelled = b.status === "Cancelled";

                  return (
                    <div className={`search-room-card ${isCancelled ? "booking-cancelled" : ""}`} key={b.booking_id}>
                      <div className="search-room-top">
                        <span
                          className="search-status-badge"
                          style={{
                            backgroundColor: isCancelled ? "#94a3b8" : "#3b82f6",
                            color: "white"
                          }}
                        >
                          {isCancelled ? "Cancelled" : "Confirmed"}
                        </span>
                      </div>

                      <h3>{b.room_name}</h3>
                      <p className="search-room-location">Date: {b.date}</p>
                      <p className="search-room-location">Time: {b.start_time} — {b.end_time}</p>

                      <div className="search-room-features" style={{ marginTop: "15px" }}>
                        <span>Cap: {b.capacity}</span>
                        <span style={{ marginLeft: "10px" }}>Tech: {b.technology}</span>
                      </div>

                      {/* Edit button — only for confirmed bookings */}
                      {!isCancelled && (
                        <button
                          className="search-slot-btn"
                          style={{ marginBottom: "10px" }}
                          onClick={() => {
                            setEditModal(b);

                            setEditForm({
                              roomId: b.room_id || "",
                              startTime: b.start_time || "",
                              endTime: b.end_time || "",
                              date: b.date || ""
                            });
                          }}
                        >
                          Edit Booking
                        </button>
                      )}

                      {/* Cancel button — only for confirmed bookings */}
                      {!isCancelled && (
                        <button
                          className="cancel-booking-btn"
                          onClick={() => setCancelModal(b)}
                          disabled={cancellingId === b.booking_id}
                        >
                          {cancellingId === b.booking_id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="search-empty-state" style={{ gridColumn: "1 / -1", padding: "60px 20px" }}>
                  <h3 style={{ fontSize: "1.5rem", color: "#334155" }}>No bookings found</h3>
                  <p style={{ color: "#64748b" }}>You haven't registered any rooms yet. Head over to the Search tab!</p>
                </div>
              )}
            </div>

            {/* ---- Edit Booking Modal ---- */}
            {editModal && (
              <div className="cancel-modal-overlay" onClick={() => setEditModal(null)}>
                <div className="cancel-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px" }}>
                  <h2>Edit Booking</h2>

                  <label style={{ display: "block", textAlign: "left", marginBottom: "6px", fontWeight: "700" }}>
                    Room
                  </label>

                  <select
                    value={editForm.roomId}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        roomId: e.target.value,
                        startTime: "",
                        endTime: ""
                      })
                    }
                    style={{ width: "100%", marginBottom: "15px", padding: "12px", borderRadius: "8px" }}
                  >
                    <option value="">Select room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.room_name} — Capacity: {room.capacity} — {room.technology}
                      </option>
                    ))}
                  </select>

                  <label style={{ display: "block", textAlign: "left", marginBottom: "6px", fontWeight: "700" }}>
                    Date
                  </label>

                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    style={{ width: "100%", marginBottom: "20px", padding: "12px", borderRadius: "8px" }}
                  />

                  <h3 style={{ textAlign: "left", marginBottom: "8px" }}>Select New Time</h3>

                  <div style={{ display: "flex", gap: "2px", height: "40px", marginBottom: "25px", background: "#eee", borderRadius: "6px", overflow: "hidden" }}>
                    {Array.from({ length: 24 }, (_, hr) => {
                      const isBooked = isEditSlotBooked(hr);
                      const start = getEditStartHour();
                      const end = getEditEndHour();
                      const isSelected = start !== null && end !== null && hr >= start && hr < end;

                      let bgColor = "#16a34a"; // free
                      if (isBooked) bgColor = "#dc2626"; // booked
                      if (isSelected) bgColor = "#2563eb"; // selected

                      return (
                        <div
                          key={hr}
                          onClick={() => handleEditSlotClick(hr)}
                          title={`${hr}:00`}
                          style={{
                            flex: 1,
                            backgroundColor: bgColor,
                            cursor: isBooked ? "not-allowed" : "pointer"
                          }}
                        />
                      );
                    })}
                  </div>

                  <p style={{ marginBottom: "15px", fontWeight: "700" }}>
                    Selected:{" "}
                    {editForm.startTime && editForm.endTime
                      ? `${editForm.startTime} — ${editForm.endTime}`
                      : "No time selected"}
                  </p>

                  <div className="cancel-modal-actions">
                    <button className="cancel-modal-keep" onClick={() => setEditModal(null)}>
                      Cancel
                    </button>

                    <button className="cancel-modal-confirm" onClick={handleEditBooking} disabled={editingId}>
                      {editingId ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Confirmation Modal ---- */}
            {cancelModal && (
              <div className="cancel-modal-overlay" onClick={() => setCancelModal(null)}>
                <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="cancel-modal-icon">⚠</div>
                  <h2>Cancel Reservation?</h2>
                  <p>
                    Are you sure you want to cancel your booking for
                    <strong> {cancelModal.room_name}</strong> on
                    <strong> {cancelModal.date}</strong> from
                    <strong> {cancelModal.start_time}</strong> to
                    <strong> {cancelModal.end_time}</strong>?
                  </p>
                  <p className="cancel-modal-sub">This will free the time slot for other users.</p>

                  <div className="cancel-modal-actions">
                    <button className="cancel-modal-keep" onClick={() => setCancelModal(null)}>
                      Keep Booking
                    </button>

                    <button
                      className="cancel-modal-confirm"
                      onClick={() => handleCancelBooking(cancelModal)}
                      disabled={cancellingId === cancelModal.booking_id}
                    >
                      {cancellingId === cancelModal.booking_id ? "Processing..." : "Yes, Cancel It"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Search;
