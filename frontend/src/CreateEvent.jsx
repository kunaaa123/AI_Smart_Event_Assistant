import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateEvent.css";

const CreateEvent = ({ onSuccess, onError, isPopup }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_image: null,
    imagePreview: "",
    organizer_id: "",
    venue_id: "",
    venue_option: "select",
    price: "",
    custom_venue: {
      name: "",
      location: "",
      venue_type: "",
      price_range: "",
      description: "",
      latitude: "",
      longitude: ""
    }
  });

  const [organizers, setOrganizers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [creatingVenue, setCreatingVenue] = useState(false);

  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 13.7563, lng: 100.5018 });
  const [selectedLocation, setSelectedLocation] = useState(null);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8080/organizers")
      .then((res) => res.json())
      .then((data) => setOrganizers(data))
      .catch(() => setOrganizers([]));

    fetch("http://localhost:8080/venues")
      .then((res) => res.json())
      .then((data) => setVenues(Array.isArray(data) ? data : []))
      .catch(() => setVenues([]));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCustomVenueChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      custom_venue: {
        ...form.custom_venue,
        [name]: value
      }
    });
  };

  const createCustomVenue = async () => {
    const { custom_venue } = form;

    if (!custom_venue.name.trim()) throw new Error("กรุณาใส่ชื่อสถานที่");
    if (!custom_venue.location.trim()) throw new Error("กรุณาใส่ที่อยู่สถานที่");
    if (!custom_venue.venue_type.trim()) throw new Error("กรุณาใส่ประเภทสถานที่");

    const venueData = {
      name: custom_venue.name.trim(),
      location: custom_venue.location.trim(),
      venue_type: custom_venue.venue_type.trim(),
      price_range: custom_venue.price_range.trim() || "ไม่ระบุ",
      description: custom_venue.description.trim() || `สถานที่จัดงาน ${custom_venue.name}`,
      latitude: parseFloat(custom_venue.latitude) || 0,
      longitude: parseFloat(custom_venue.longitude) || 0,
      rating: 0,
      review_count: 0
    };

    const response = await fetch("http://localhost:8080/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venueData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "ไม่สามารถสร้างสถานที่ได้");
    }

    const newVenue = await response.json();
    return newVenue.venue_id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.organizer_id || form.organizer_id === "0") {
      setAlert({ show: true, message: "กรุณาเลือกผู้จัดงาน", type: "danger" });
      onError?.("กรุณาเลือกผู้จัดงาน");
      return;
    }

    // ถ้าเลือกตัวเอง: ห้ามสร้างแถว organizer ใน DB ที่ฝั่ง frontend
    // ส่ง flag ไปให้ backend แทน แล้วไม่ส่ง organizer_id เพื่อหลีกเลี่ยง FK error
    let sendOrganizerSelf = false;
    let finalOrganizerId = null;
    if (form.organizer_id === "self") {
      if (!user?.user_id) {
        setAlert({ show: true, message: "กรุณาเข้าสู่ระบบเพื่อเลือกตัวเองเป็นผู้จัด", type: "danger" });
        onError?.("กรุณาเข้าสู่ระบบ");
        return;
      }
      sendOrganizerSelf = true;
    } else {
      finalOrganizerId = form.organizer_id;
    }

    setCreatingVenue(true);
    try {
      let venueId = null;

      if (form.venue_option === "create") {
        venueId = await createCustomVenue();
        setAlert({ show: true, message: "สร้างสถานที่สำเร็จ!", type: "success" });
      } else if (form.venue_id) {
        venueId = form.venue_id;
      }

      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      if (finalOrganizerId) {
        data.append("organizer_id", String(finalOrganizerId));
      } else if (sendOrganizerSelf) {
        // แทนการสร้าง organizer, แจ้ง backend ว่าใช้ข้อมูล user เป็นผู้จัด (backend ต้องรองรับ)
        data.append("organizer_self", "true");
      }
      data.append("user_id", user.user_id);
      if (form.price !== "" && form.price !== null) {
        data.append("price", String(form.price));
      }
      if (venueId) data.append("venue_id", venueId);

      let eventId = null;
      const res = await fetch("http://localhost:8080/events", { method: "POST", body: data });
      if (res.ok) {
        const event = await res.json();
        eventId = event.event_id;
      } else {
        throw new Error("เกิดข้อผิดพลาดในการสร้างอีเว้นท์");
      }

      if (eventId && coverImage) {
        const coverData = new FormData();
        coverData.append("images", coverImage);
        coverData.append("is_cover", "true");
        await fetch(`http://localhost:8080/events/${eventId}/images`, { method: "POST", body: coverData });
      }

      if (eventId && galleryImages.length > 0) {
        const galleryData = new FormData();
        galleryImages.forEach((img) => galleryData.append("images", img));
        galleryData.append("is_cover", "false");
        await fetch(`http://localhost:8080/events/${eventId}/images`, { method: "POST", body: galleryData });
      }

      setAlert({ show: true, message: "สร้างอีเว้นท์สำเร็จ! 🎉", type: "success" });
      onSuccess?.();
      if (!isPopup) setTimeout(() => navigate("/my-events"), 1200);
    } catch (error) {
      console.error("Error:", error);
      setAlert({ show: true, message: error.message || "เกิดข้อผิดพลาดในการสร้าง", type: "danger" });
      onError?.(error.message);
    } finally {
      setCreatingVenue(false);
    }
  };

  // Map modal handlers
  const openMapModal = () => {
    if (form.custom_venue.latitude && form.custom_venue.longitude) {
      const lat = parseFloat(form.custom_venue.latitude);
      const lng = parseFloat(form.custom_venue.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter({ lat, lng });
        setSelectedLocation({ lat, lng });
      }
    }
    setShowMapModal(true);
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      setForm({
        ...form,
        custom_venue: {
          ...form.custom_venue,
          latitude: selectedLocation.lat.toFixed(6),
          longitude: selectedLocation.lng.toFixed(6),
        },
      });
      setShowMapModal(false);
      setAlert({
        show: true,
        message: `✅ บันทึกพิกัด: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`,
        type: "success",
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter({ lat, lng });
          setSelectedLocation({ lat, lng });
          setAlert({ show: true, message: "🗺️ ใช้ตำแหน่งปัจจุบันของคุณ", type: "success" });
        },
        () => {
          setAlert({ show: true, message: "❌ ไม่สามารถหาตำแหน่งปัจจุบันได้", type: "danger" });
        }
      );
    } else {
      setAlert({ show: true, message: "❌ เบราว์เซอร์ไม่รองรับ GPS", type: "danger" });
    }
  };

  const searchLocation = async (query) => {
    if (!query.trim()) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          query + " Thailand"
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.results.length > 0) {
          const result = data.results[0];
          const lat = result.geometry.location.lat;
          const lng = result.geometry.location.lng;
          setMapCenter({ lat, lng });
          setSelectedLocation({ lat, lng });
          setAlert({ show: true, message: `🔍 พบ: ${result.formatted_address}`, type: "success" });
        } else {
          setAlert({ show: true, message: "❌ ไม่พบสถานที่ที่ค้นหา", type: "danger" });
        }
      }
    } catch {
      setAlert({ show: true, message: "❌ เกิดข้อผิดพลาดในการค้นหา", type: "danger" });
    }
  };

  // Drag & drop cover
  const handleCoverDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("CEVN-drag-over");
  };
  const handleCoverDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("CEVN-drag-over");
  };
  const handleCoverDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("CEVN-drag-over");
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith("image/")) {
      const file = files[0];
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Drag & drop gallery
  const handleGalleryDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("CEVN-drag-over");
  };
  const handleGalleryDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("CEVN-drag-over");
  };
  const handleGalleryDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("CEVN-drag-over");
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      const newFiles = [...galleryImages, ...files];
      const newPreviews = [...galleryPreviews, ...files.map((file) => URL.createObjectURL(file))];
      setGalleryImages(newFiles);
      setGalleryPreviews(newPreviews);
    }
  };

  const removeGalleryImage = (index) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryImages(newImages);
    setGalleryPreviews(newPreviews);
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...galleryImages, ...files];
    const newPreviews = [...galleryPreviews, ...files.map((file) => URL.createObjectURL(file))];
    setGalleryImages(newFiles);
    setGalleryPreviews(newPreviews);
  };

  return (
    <div className="CEVN-create-event-container">
      <div className="CEVN-create-event-header-outer">
        <h2 className="CEVN-create-event-page-title">สร้างอีเว้นท์ใหม่</h2>
      </div>

      {/* ฟอร์มหลัก (มีแค่อันเดียว) */}
      <form className="CEVN-create-event-main-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="CEVN-create-event-field-group">
          <label>ชื่ออีเว้นท์</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={creatingVenue}
            placeholder="ชื่องานสุดพิเศษของคุณ..."
          />
        </div>

        <div className="CEVN-create-event-field-group">
          <label>รายละเอียด</label>
          <textarea name="description" value={form.description} onChange={handleChange} required disabled={creatingVenue} />
        </div>

        <div className="CEVN-create-event-field-group">
          <label>เลือกผู้จัดงาน (Organizer)</label>
          <select name="organizer_id" value={form.organizer_id} onChange={handleChange} required disabled={creatingVenue}>
            <option value="">-- เลือกผู้จัดงาน --</option>
            <option value="self">🧑‍💼 ผู้ใช้เป็นผู้จัดงาน (ตัวเอง)</option>
            {organizers.map((org) => (
              <option key={org.organizer_id} value={org.organizer_id}>
                {org.first_name} {org.last_name} ({org.expertise || "ไม่ระบุ"})
              </option>
            ))}
          </select>
        </div>

        <div className="CEVN-create-event-field-group">
          <label>ราคา (บาท)</label>
          <input
            name="price"
            type="number"
            step="any"
            value={form.price}
            onChange={handleChange}
            placeholder="เช่น 1500 หรือเว้นว่างถ้าไม่ต้องการระบุ"
            disabled={creatingVenue}
          />
        </div>

        {/* สถานที่จัดงาน */}
        <div className="CEVN-create-event-field-group">
          <label>สถานที่จัดงาน</label>
          <div className="CEVN-create-event-venue-selector">
            <div className="CEVN-create-event-venue-tabs">
              <button
                type="button"
                className={`CEVN-create-event-venue-tab ${form.venue_option === "select" ? "CEVN-active" : ""}`}
                onClick={() => setForm({ ...form, venue_option: "select", venue_id: "" })}
                disabled={creatingVenue}
              >
                📋 เลือกจากรายการ
              </button>
              <button
                type="button"
                className={`CEVN-create-event-venue-tab ${form.venue_option === "create" ? "CEVN-active" : ""}`}
                onClick={() => setForm({ ...form, venue_option: "create", venue_id: "" })}
                disabled={creatingVenue}
              >
                ➕ สร้างสถานที่ใหม่
              </button>
            </div>

            {form.venue_option === "select" ? (
              <select
                name="venue_id"
                value={form.venue_id}
                onChange={handleChange}
                disabled={creatingVenue}
                className="CEVN-create-event-venue-select"
              >
                <option value="">-- เลือกสถานที่ (ไม่บังคับ) --</option>
                {venues.map((venue) => (
                  <option key={venue.venue_id} value={venue.venue_id}>
                    📍 {venue.name} - {venue.location}
                  </option>
                ))}
              </select>
            ) : (
              <div className="CEVN-create-event-custom-venue-form">
                <div className="CEVN-create-event-venue-row">
                  <div className="CEVN-create-event-venue-col">
                    <label>ชื่อสถานที่ *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.custom_venue.name}
                      onChange={handleCustomVenueChange}
                      placeholder="เช่น โรงแรม ABC, สวนสวย Resort"
                      disabled={creatingVenue}
                      required
                    />
                  </div>
                  <div className="CEVN-create-event-venue-col">
                    <label>ประเภทสถานที่ *</label>
                    <select
                      name="venue_type"
                      value={form.custom_venue.venue_type}
                      onChange={handleCustomVenueChange}
                      disabled={creatingVenue}
                      required
                    >
                      <option value="">-- เลือกประเภท --</option>
                      <option value="โรงแรม">โรงแรม</option>
                      <option value="รีสอร์ท">รีสอร์ท</option>
                      <option value="ศูนย์ประชุม">ศูนย์ประชุม</option>
                      <option value="ลานกิจกรรม">ลานกิจกรรม</option>
                      <option value="ร้านอาหาร">ร้านอาหาร</option>
                      <option value="สวนสาธารณะ">สวนสาธารณะ</option>
                      <option value="บ้านส่วนตัว">บ้านส่วนตัว</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                </div>

                <div className="CEVN-create-event-venue-full">
                  <label>ที่อยู่ / สถานที่ตั้ง *</label>
                  <input
                    type="text"
                    name="location"
                    value={form.custom_venue.location}
                    onChange={handleCustomVenueChange}
                    placeholder="เช่น 123 ถ.สุขุมวิท กรุงเทพฯ หรือ อำเภอเมือง จ.เชียงใหม่"
                    disabled={creatingVenue}
                    required
                  />
                </div>

                <div className="CEVN-create-event-venue-row">
                  <div className="CEVN-create-event-venue-col">
                    <label>ช่วงราคา</label>
                    <input
                      type="text"
                      name="price_range"
                      value={form.custom_venue.price_range}
                      onChange={handleCustomVenueChange}
                      placeholder="เช่น 20,000-50,000 บาท"
                      disabled={creatingVenue}
                    />
                  </div>
                  <div className="CEVN-create-event-venue-col">
                    <label>คำอธิบาย</label>
                    <input
                      type="text"
                      name="description"
                      value={form.custom_venue.description}
                      onChange={handleCustomVenueChange}
                      placeholder="เช่น ห้องจัดเลี้ยงขนาดใหญ่ บรรยากาศดี"
                      disabled={creatingVenue}
                    />
                  </div>
                </div>

                {/* พิกัด GPS */}
                <div className="CEVN-create-event-coordinates">
                  <label>🗺️ พิกัด GPS (ไม่บังคับ)</label>

                  <div className="CEVN-create-event-current-coordinates">
                    {form.custom_venue.latitude && form.custom_venue.longitude ? (
                      <div className="CEVN-coordinate-display">
                        <span className="CEVN-coord-label">📍 พิกัดที่เลือก:</span>
                        <span className="CEVN-coord-value">
                          {parseFloat(form.custom_venue.latitude).toFixed(4)}, {parseFloat(form.custom_venue.longitude).toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      <div className="CEVN-coordinate-empty">
                        <span>📍 ยังไม่ได้เลือกพิกัด</span>
                      </div>
                    )}
                  </div>

                  <div className="CEVN-create-event-coordinate-actions">
                    <button type="button" className="CEVN-coordinate-action-btn CEVN-map-btn" onClick={openMapModal} disabled={creatingVenue}>
                      🗺️ เลือกจากแผนที่
                    </button>
                    <button type="button" className="CEVN-coordinate-action-btn CEVN-gps-btn" onClick={getCurrentLocation} disabled={creatingVenue}>
                      📍 ตำแหน่งปัจจุบัน
                    </button>
                    {(form.custom_venue.latitude || form.custom_venue.longitude) && (
                      <button
                        type="button"
                        className="CEVN-coordinate-action-btn CEVN-clear-btn"
                        onClick={() =>
                          setForm({
                            ...form,
                            custom_venue: { ...form.custom_venue, latitude: "", longitude: "" },
                          })
                        }
                        disabled={creatingVenue}
                      >
                        🗑️ ลบพิกัด
                      </button>
                    )}
                  </div>

                  <details className="CEVN-coordinate-manual-input">
                    <summary>✏️ ใส่พิกัดด้วยตัวเอง</summary>
                    <div className="CEVN-create-event-coordinate-inputs">
                      <input
                        type="number"
                        name="latitude"
                        value={form.custom_venue.latitude}
                        onChange={handleCustomVenueChange}
                        placeholder="Latitude เช่น 13.7563"
                        step="any"
                        disabled={creatingVenue}
                      />
                      <input
                        type="number"
                        name="longitude"
                        value={form.custom_venue.longitude}
                        onChange={handleCustomVenueChange}
                        placeholder="Longitude เช่น 100.5018"
                        step="any"
                        disabled={creatingVenue}
                      />
                    </div>
                  </details>

                  <small>💡 เลือกพิกัดเพื่อแสดงตำแหน่งบนแผนที่ในระบบ</small>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ภาพปก */}
        <div className="CEVN-create-event-field-group">
          <label>ภาพปก (Cover Image)</label>
          <div
            className={`CEVN-create-event-image_upload_box CEVN-cover_upload ${coverPreview ? "CEVN-has_image" : ""}`}
            onClick={() => coverInputRef.current?.click()}
            onDragOver={handleCoverDragOver}
            onDragLeave={handleCoverDragLeave}
            onDrop={handleCoverDrop}
          >
            {coverPreview ? (
              <div className="CEVN-create-event-image-preview-container">
                <img src={coverPreview} alt="cover" className="CEVN-create-event-cover-preview" />
                <div className="CEVN-create-event-image-overlay">
                  <div className="CEVN-create-event-image-actions">
                    <button
                      type="button"
                      className="CEVN-create-event-image-action-btn CEVN-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(coverPreview, "_blank");
                      }}
                      title="ดูรูปเต็มขนาด"
                    >
                      🔍
                    </button>
                    <button
                      type="button"
                      className="CEVN-create-event-image-action-btn CEVN-change-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        coverInputRef.current?.click();
                      }}
                      title="เปลี่ยนรูป"
                    >
                      🔄
                    </button>
                    <button
                      type="button"
                      className="CEVN-create-event-image-action-btn CEVN-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverImage(null);
                        setCoverPreview("");
                        if (coverInputRef.current) coverInputRef.current.value = "";
                      }}
                      title="ลบรูป"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="CEVN-create-event-image-label">รูปปก</div>
              </div>
            ) : (
              <div className="CEVN-create-event-image-placeholder">
                <div className="CEVN-create-event-upload-icon">📸</div>
                <div className="CEVN-create-event-upload-title">เลือกภาพปกสำหรับอีเว้นท์</div>
                <div className="CEVN-create-event-upload-subtitle">คลิกเพื่อเลือกไฟล์ หรือลากรูปมาวาง</div>
                <div className="CEVN-create-event-upload-info">รองรับไฟล์: JPG, PNG, GIF (สูงสุด 10MB)</div>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setCoverImage(file);
                  setCoverPreview(URL.createObjectURL(file));
                }
              }}
              disabled={creatingVenue}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* แกลเลอรี */}
        <div className="CEVN-create-event-field-group">
          <label>
            รูปภาพเพิ่มเติม (Gallery) <span className="CEVN-create-event-optional-text">(เลือกได้หลายรูป)</span>
          </label>

          <div
            className="CEVN-create-event-gallery-upload-area"
            onClick={() => galleryInputRef.current?.click()}
            onDragOver={handleGalleryDragOver}
            onDragLeave={handleGalleryDragLeave}
            onDrop={handleGalleryDrop}
          >
            <div className="CEVN-create-event-gallery-upload-content">
              <div className="CEVN-create-event-upload-icon">🖼️</div>
              <div className="CEVN-create-event-upload-title">เพิ่มรูปภาพในแกลเลอรี</div>
              <div className="CEVN-create-event-upload-subtitle">คลิกเพื่อเลือกหลายไฟล์พร้อมกัน หรือลากรูปมาวาง</div>
              <div className="CEVN-create-event-upload-button">📁 เลือกรูปภาพ</div>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryChange}
              disabled={creatingVenue}
              style={{ display: "none" }}
            />
          </div>

          {galleryPreviews.length > 0 && (
            <div className="CEVN-create-event-gallery-preview">
              <div className="CEVN-create-event-gallery-header">
                <span>รูปที่เลือกแล้ว ({galleryPreviews.length} รูป)</span>
                <button
                  type="button"
                  className="CEVN-create-event-clear-all-btn"
                  onClick={() => {
                    setGalleryImages([]);
                    setGalleryPreviews([]);
                    if (galleryInputRef.current) galleryInputRef.current.value = "";
                  }}
                  title="ลบรูปทั้งหมด"
                >
                  🗑️ ลบทั้งหมด
                </button>
              </div>
              <div className="CEVN-create-event-gallery-grid">
                {galleryPreviews.map((src, idx) => (
                  <div key={idx} className="CEVN-create-event-gallery-item">
                    <img src={src} alt={`gallery-${idx}`} className="CEVN-create-event-gallery-thumbnail" />
                    <div className="CEVN-create-event-gallery-overlay">
                      <div className="CEVN-create-event-gallery-actions">
                        <button
                          type="button"
                          className="CEVN-create-event-gallery-action-btn CEVN-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(src, "_blank");
                          }}
                          title="ดูรูปเต็มขนาด"
                        >
                          🔍
                        </button>
                        <button
                          type="button"
                          className="CEVN-create-event-gallery-action-btn CEVN-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGalleryImage(idx);
                          }}
                          title="ลบรูปนี้"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                    <div className="CEVN-create-event-gallery-number">{idx + 1}</div>
                  </div>
                ))}

                <div className="CEVN-create-event-gallery-add-more" onClick={() => galleryInputRef.current?.click()}>
                  <div className="CEVN-create-event-add-more-content">
                    <div className="CEVN-create-event-add-more-icon">➕</div>
                    <div className="CEVN-create-event-add-more-text">เพิ่มรูป</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button className="CEVN-create-event-submit-btn" type="submit" disabled={creatingVenue}>
          {creatingVenue ? <>⏳ กำลังสร้าง...</> : <>🎉 สร้างอีเว้นท์</>}
        </button>

        {alert.show && <div className={`CEVN-create-event-alert ${alert.type}`}>{alert.message}</div>}
      </form>

      {/* Modal แผนที่ (อยู่นอกฟอร์ม ไม่ซ้อนฟอร์ม) */}
      {showMapModal && (
        <div className="CEVN-map-modal-overlay">
          <div className="CEVN-map-modal-content">
            <div className="CEVN-map-modal-header">
              <h3>🗺️ เลือกตำแหน่งบนแผนที่</h3>
              <button className="CEVN-map-modal-close" onClick={() => setShowMapModal(false)}>
                ✕
              </button>
            </div>

            <div className="CEVN-map-search-container">
              <input
                type="text"
                className="CEVN-map-search-input"
                placeholder="🔍 ค้นหาสถานที่... เช่น สยามพารากอน, MBK"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchLocation(e.target.value);
                  }
                }}
              />
              <button
                type="button"
                className="CEVN-map-search-btn"
                onClick={() => {
                  const input = document.querySelector(".CEVN-map-search-input");
                  searchLocation(input?.value || "");
                }}
              >
                🔍
              </button>
            </div>

            <div className="CEVN-map-container">
              <MapComponent center={mapCenter} selectedLocation={selectedLocation} onLocationSelect={setSelectedLocation} />
            </div>

            <div className="CEVN-map-coordinate-info">
              {selectedLocation ? (
                <div className="CEVN-selected-coordinates">
                  <span>📍 พิกัดที่เลือก:</span>
                  <strong>
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </strong>
                </div>
              ) : (
                <div className="CEVN-no-selection">👆 คลิกบนแผนที่เพื่อเลือกตำแหน่ง</div>
              )}
            </div>

            <div className="CEVN-map-modal-actions">
              <button
                type="button"
                className="CEVN-map-action-btn CEVN-cancel-btn"
                onClick={() => {
                  setShowMapModal(false);
                  setSelectedLocation(null);
                }}
                style={{ display: "flex", alignItems: "center" }}
              >
                <span style={{ marginRight: "8px" }}>❌</span>
                ยกเลิก
              </button>

              <button
                type="button"
                className="CEVN-map-action-btn CEVN-confirm-btn"
                onClick={confirmLocation}
                disabled={!selectedLocation}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: selectedLocation ? undefined : "#9ca3af",
                }}
              >
                <span style={{ marginRight: "8px" }}>✅</span>
                {selectedLocation ? "ยืนยันพิกัดนี้" : "เลือกตำแหน่งก่อน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// แยก MapComponent ไว้ในไฟล์เดียวกัน (ไม่มีฟอร์มซ้อน)
const MapComponent = ({ center, selectedLocation, onLocationSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);

  useEffect(() => {
    let timeoutId;
    let intervalId;

    const initializeMap = async () => {
      try {
        if (!window.google || !window.google.maps) throw new Error("Google Maps API not loaded");
        if (!mapRef.current) throw new Error("Map container not ready");

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          mapId: "DEMO_MAP_ID",
        });

        infoWindowRef.current = new window.google.maps.InfoWindow({ maxWidth: 350 });

        const calculateDistance = (lat1, lng1, lat2, lng2) => {
          const R = 6371;
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLng = ((lng2 - lng1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          return Math.round(distance * 1000);
        };

        const createMarker = async (position, title, isSelected = false) => {
          try {
            if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
              const pinElement = document.createElement("div");
              pinElement.innerHTML = isSelected ? "📍" : "📌";
              pinElement.style.cssText = `
                font-size: 24px;
                background: ${isSelected ? "#ef4444" : "#3b82f6"};
                border: 2px solid white;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              `;
              return new window.google.maps.marker.AdvancedMarkerElement({ position, map, title, content: pinElement });
            }
            return new window.google.maps.Marker({
              position,
              map,
              title,
              animation: window.google.maps.Animation.DROP,
            });
          } catch {
            return new window.google.maps.Marker({ position, map, title, animation: window.google.maps.Animation.DROP });
          }
        };

        const getPlaceDetails = async (lat, lng) => {
          setIsLoadingPlace(true);
          try {
            const geocoder = new window.google.maps.Geocoder();
            return new Promise((resolve) => {
              geocoder.geocode({ location: { lat, lng } }, async (results, status) => {
                if (status === "OK" && results[0]) {
                  const geocodeResult = results[0];
                  try {
                    const service = new window.google.maps.places.PlacesService(map);
                    const textSearchRequest = { query: geocodeResult.formatted_address, location: { lat, lng }, radius: 100 };
                    service.textSearch(textSearchRequest, (places, searchStatus) => {
                      let placeInfo;
                      if (searchStatus === window.google.maps.places.PlacesServiceStatus.OK && places.length > 0) {
                        const place = places[0];
                        placeInfo = {
                          name: place.name || "สถานที่ที่เลือก",
                          address: place.formatted_address || geocodeResult.formatted_address,
                          types: place.types || ["establishment"],
                          rating: place.rating || null,
                          totalRatings: place.user_ratings_total || 0,
                          priceLevel: place.price_level || null,
                          place_id: place.place_id,
                          geometry: {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng(),
                          },
                          exactLocation: {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng(),
                          },
                          distance: calculateDistance(lat, lng, place.geometry.location.lat(), place.geometry.location.lng()),
                        };
                      } else {
                        placeInfo = {
                          name: "ตำแหน่งที่เลือก",
                          address: geocodeResult.formatted_address,
                          types: geocodeResult.types || ["coordinate"],
                          place_id: geocodeResult.place_id || null,
                          exactLocation: { lat, lng },
                        };
                      }
                      setIsLoadingPlace(false);
                      resolve(placeInfo);
                    });
                  } catch {
                    const placeInfo = {
                      name: "ตำแหน่งที่เลือก",
                      address: geocodeResult.formatted_address,
                      types: geocodeResult.types || ["coordinate"],
                      place_id: geocodeResult.place_id || null,
                      exactLocation: { lat, lng },
                    };
                    setIsLoadingPlace(false);
                    resolve(placeInfo);
                  }
                } else {
                  const placeInfo = {
                    name: "ตำแหน่งที่เลือก",
                    address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    types: ["coordinate"],
                    place_id: null,
                    exactLocation: { lat, lng },
                  };
                  setIsLoadingPlace(false);
                  resolve(placeInfo);
                }
              });
            });
          } catch {
            setIsLoadingPlace(false);
            return {
              name: "ตำแหน่งที่เลือก",
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              types: ["coordinate"],
              place_id: null,
              exactLocation: { lat, lng },
            };
          }
        };

        const createInfoWindowContent = (placeInfo, lat, lng) => {
          let content = `
            <div style="font-family: 'Prompt', sans-serif; max-width: 320px; padding: 12px;">
              <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${placeInfo.name}</h4>
                <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.4;">📍 ${placeInfo.address}</p>
              </div>
          `;
          if (placeInfo.rating && placeInfo.totalRatings > 0) {
            const stars = "⭐".repeat(Math.round(placeInfo.rating));
            content += `<p style="margin: 4px 0; color: #f59e0b; font-size: 13px; font-weight: 500;">${stars} ${placeInfo.rating}/5 (${placeInfo.totalRatings.toLocaleString()} รีวิว)</p>`;
          }
          if (placeInfo.distance !== undefined) {
            const distanceText = placeInfo.distance < 1000 ? `${placeInfo.distance} ม.` : `${(placeInfo.distance / 1000).toFixed(1)} กม.`;
            content += `<p style="margin: 4px 0; color: #059669; font-size: 12px;">📏 ห่างจากจุดคลิก: ${distanceText}</p>`;
          }
          content += `
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <small style="color: #9ca3af; font-size: 11px;">พิกัด: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
            </div>
          </div>`;
          return content;
        };

        map.addListener("click", async (event) => {
          const clickLat = event.latLng.lat();
          const clickLng = event.latLng.lng();

          if (markerRef.current) {
            if (markerRef.current.setMap) markerRef.current.setMap(null);
            else if (markerRef.current.map) markerRef.current.map = null;
          }

          try {
            markerRef.current = await createMarker({ lat: clickLat, lng: clickLng }, "กำลังค้นหาข้อมูล...", false);

            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(`
                <div style="padding: 16px; text-align: center; font-family: 'Prompt', sans-serif;">
                  <div style="margin-bottom: 8px;">🔍</div>
                  <div style="font-size: 14px; color: #4b5563;">กำลังค้นหาข้อมูลสถานที่...</div>
                </div>
              `);
              infoWindowRef.current.setPosition({ lat: clickLat, lng: clickLng });
              infoWindowRef.current.open(map);
            }

            const placeInfo = await getPlaceDetails(clickLat, clickLng);

            let finalLat = placeInfo.geometry?.lat ?? placeInfo.exactLocation?.lat ?? clickLat;
            let finalLng = placeInfo.geometry?.lng ?? placeInfo.exactLocation?.lng ?? clickLng;

            if (markerRef.current) {
              if (markerRef.current.setMap) markerRef.current.setMap(null);
              else if (markerRef.current.map) markerRef.current.map = null;
            }

            markerRef.current = await createMarker({ lat: finalLat, lng: finalLng }, placeInfo.name, true);

            const infoContent = createInfoWindowContent(placeInfo, finalLat, finalLng);
            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(infoContent);
              infoWindowRef.current.setPosition({ lat: finalLat, lng: finalLng });
            }

            onLocationSelect({ lat: finalLat, lng: finalLng, placeInfo });
          } catch (error) {
            console.error("Error handling map click:", error);
            try {
              markerRef.current = await createMarker({ lat: clickLat, lng: clickLng }, "ตำแหน่งที่เลือก", true);
            } catch {
              // ignore marker creation errors
            }

            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(`
                <div style="padding: 12px; font-family: 'Prompt', sans-serif;">
                  <div style="color: #dc2626; font-size: 14px; margin-bottom: 4px;">⚠️ ไม่สามารถค้นหาข้อมูลได้</div>
                  <div style="font-size: 12px; color: #6b7280;">พิกัด: ${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}</div>
                </div>
              `);
              infoWindowRef.current.setPosition({ lat: clickLat, lng: clickLng });
            }

            onLocationSelect({
              lat: clickLat,
              lng: clickLng,
              placeInfo: {
                name: "ตำแหน่งที่เลือก",
                address: `${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}`,
                types: ["coordinate"],
                exactLocation: { lat: clickLat, lng: clickLng },
              },
            });
          }
        });

        if (selectedLocation) {
          try {
            markerRef.current = await createMarker(
              { lat: selectedLocation.lat, lng: selectedLocation.lng },
              selectedLocation.placeInfo?.name || "ตำแหน่งที่เลือก",
              true
            );

            if (selectedLocation.placeInfo && infoWindowRef.current) {
              const infoContent = createInfoWindowContent(selectedLocation.placeInfo, selectedLocation.lat, selectedLocation.lng);
              infoWindowRef.current.setContent(infoContent);
              infoWindowRef.current.setPosition({ lat: selectedLocation.lat, lng: selectedLocation.lng });
              infoWindowRef.current.open(map);
            }
          } catch {
            // ignore marker creation errors
          }
        }

        mapInstanceRef.current = map;
        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error("Error creating map:", err);
        setError(err.message);
        setIsReady(false);
      }
    };

    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && mapRef.current) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        initializeMap();
      }
    };

    if (window.google && window.google.maps && mapRef.current) {
      initializeMap();
    } else {
      intervalId = setInterval(checkGoogleMaps, 100);
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        if (!window.google || !window.google.maps) setError("ไม่สามารถโหลด Google Maps API ได้");
      }, 20000);
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      if (markerRef.current) {
        if (markerRef.current.setMap) markerRef.current.setMap(null);
        else if (markerRef.current.map) markerRef.current.map = null;
      }
      if (infoWindowRef.current) infoWindowRef.current.close();
    };
  }, [center.lat, center.lng, selectedLocation, onLocationSelect]);

  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter({ lat: center.lat, lng: center.lng });
      mapInstanceRef.current.setZoom(15);
    }
  }, [center]);

  return (
    <div className="CEVN-map-wrapper" style={{ height: "300px", width: "100%", position: "relative" }}>
      <div ref={mapRef} className="CEVN-google-map" style={{ height: "100%", width: "100%" }} />

      {!isReady && (
        <div className="CEVN-map-loading-overlay">
          <div className="CEVN-map-loading-content">
            {error ? (
              <>
                <div className="CEVN-map-error-icon">❌</div>
                <div className="CEVN-map-error-text">
                  เกิดข้อผิดพลาด: {error}
                  <br />
                  <small>กรุณาใส่พิกัดด้วยตัวเอง</small>
                </div>
              </>
            ) : (
              <>
                <div className="CEVN-map-loading-spinner">🗺️</div>
                <div className="CEVN-map-loading-text">
                  กำลังโหลด Google Maps...
                  <br />
                  <small>รอสักครู่</small>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isReady && (
        <div
          className="CEVN-map-instructions"
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#4b5563",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
          }}
        >
          👆 คลิกบนแผนที่เพื่อเลือกตำแหน่ง
        </div>
      )}

      {isLoadingPlace && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            zIndex: 1000,
          }}
        >
          🔍 กำลังค้นหาข้อมูลสถานที่...
        </div>
      )}
    </div>
  );
};

export default CreateEvent;