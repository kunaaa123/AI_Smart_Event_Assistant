import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProfileLayout from "./ProfileLayout";
import CreateEvent from "./CreateEvent";
import GlassAlert from "./GlassAlert";
import OrganizerPortfolios from "./OrganizerPortfolios";
import "./MyEvents.css";
import GCFFEConfirm from "./GCFFEConfirm"; // เพิ่ม

const MyEvents = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = (user?.role || "").toLowerCase();

  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [eventImages, setEventImages] = useState({});
  
  // ⭐ เพิ่ม state สำหรับการแก้ไข - ขยายให้ครบ ⭐
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    organizer_id: "",
    venue_id: "",
    venue_option: "select",
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
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // ⭐ เพิ่ม state สำหรับรูปภาพในการแก้ไข ⭐
  const [editCoverImage, setEditCoverImage] = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState("");
  const [editGalleryImages, setEditGalleryImages] = useState([]);
  const [editGalleryPreviews, setEditGalleryPreviews] = useState([]);
  const [currentEventImages, setCurrentEventImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const editCoverInputRef = useRef(null);
  const editGalleryInputRef = useRef(null);

  // Confirm modal (ใช้ GCFFEConfirm)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOpts, setConfirmOpts] = useState({
    title: "ยืนยันการทำรายการ",
    message: "คุณแน่ใจหรือไม่?",
    type: "warning",
    confirmText: "ยืนยัน",
    cancelText: "ยกเลิก",
    closeOnOverlay: true,
  });
  const confirmResolverRef = useRef(null);
  const ask = (opts = {}) =>
    new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmOpts((prev) => ({ ...prev, ...opts }));
      setConfirmOpen(true);
    });
  const onConfirm = () => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(true);
    confirmResolverRef.current = null;
  };
  const onCancel = () => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(false);
    confirmResolverRef.current = null;
  };

  // ปุ่มลัดไปหน้า organizer portfolios สำหรับ admin เท่านั้น
  const isOrganizerOrAdmin = ["organizer", "admin"].includes(role);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.user_id) {
      navigate("/login");
    }
  }, [user?.user_id, navigate]);

  // ดึง event ของ user
  const fetchMyEvents = async () => {
    try {
      const res = await fetch(`http://localhost:8080/events/user/${user.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
    setLoading(false);
  };

  // ดึง organizer ทั้งหมด
  const fetchOrganizers = async () => {
    try {
      const res = await fetch("http://localhost:8080/organizers");
      if (res.ok) {
        const data = await res.json();
        setOrganizers(data);
      }
    } catch {
      setOrganizers([]);
    }
  };

  // ⭐ ดึง venues ทั้งหมด ⭐
  const fetchVenues = async () => {
    try {
      const res = await fetch("http://localhost:8080/venues");
      if (res.ok) {
        const data = await res.json();
        setVenues(Array.isArray(data) ? data : []);
      }
    } catch {
      setVenues([]);
    }
  };

  const fetchEventImages = async (event_id) => {
    try {
      const res = await fetch(`http://localhost:8080/events/${event_id}/images`);
      if (res.ok) {
        const imgs = await res.json();
        setEventImages(prev => ({ ...prev, [event_id]: imgs }));
      }
    } catch (err) {
      console.error("Failed to fetch images for event", event_id, err);
    }
  };

  // กันไม่ให้ useEffect ทำงานเมื่อเป็น organizer
  useEffect(() => {
    if (role === "organizer") return;
    if (user.user_id) fetchMyEvents();
    fetchOrganizers();
    fetchVenues();
  }, [user.user_id, role]);

  const filteredEvents = (events || []).filter(
    (event) =>
      (event?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (event?.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (role === "organizer") return;
    const fetched = new Set();
    filteredEvents.forEach(event => {
      if (!eventImages[event.event_id] && !fetched.has(event.event_id)) {
        fetchEventImages(event.event_id);
        fetched.add(event.event_id);
      }
    });
  }, [filteredEvents, role]);

  // ฟังก์ชันหา organizer name
  const getOrganizerName = (organizer_id) => {
    const org = organizers.find((o) => o.organizer_id === organizer_id);
    if (org) {
      return `${org.first_name} ${org.last_name}`;
    }
    return "ไม่พบชื่อผู้จัด";
  };

  // ⭐ ฟังก์ชันเริ่มแก้ไข - ขยายให้ครบ ⭐
  const handleStartEdit = async (event) => {
    setEditingEvent(event);
    setEditForm({
      name: event.name,
      description: event.description,
      organizer_id: event.organizer_id,
      venue_id: event.venue_id || "",
      venue_option: "select",
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

    // รีเซ็ตรูปภาพ
    setEditCoverImage(null);
    setEditCoverPreview("");
    setEditGalleryImages([]);
    setEditGalleryPreviews([]);
    setImagesToDelete([]);

    // ดึงรูปภาพปัจจุบัน
    try {
      const res = await fetch(`http://localhost:8080/events/${event.event_id}/images`);
      if (res.ok) {
        const images = await res.json();
        setCurrentEventImages(images);
        
        // หารูปปกปัจจุบัน
        const coverImage = images.find(img => img.is_cover);
        if (coverImage) {
          setEditCoverPreview(`http://localhost:8080${coverImage.image_url.replace(/^\./, "")}`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch event images:", error);
      setCurrentEventImages([]);
    }

    setShowEditModal(true);
  };

  // ⭐ ฟังก์ชันจัดการการเปลี่ยนแปลง custom venue ⭐
  const handleEditCustomVenueChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      custom_venue: {
        ...editForm.custom_venue,
        [name]: value
      }
    });
  };

  // ⭐ ฟังก์ชันสร้าง venue ใหม่สำหรับการแก้ไข ⭐
  const createCustomVenueForEdit = async () => {
    const { custom_venue } = editForm;
    
    if (!custom_venue.name.trim()) {
      throw new Error("กรุณาใส่ชื่อสถานที่");
    }
    if (!custom_venue.location.trim()) {
      throw new Error("กรุณาใส่ที่อยู่สถานที่");
    }
    if (!custom_venue.venue_type.trim()) {
      throw new Error("กรุณาใส่ประเภทสถานที่");
    }

    try {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "ไม่สามารถสร้างสถานที่ได้");
      }

      const newVenue = await response.json();
      return newVenue.venue_id;
      
    } catch (error) {
      console.error("Error creating venue:", error);
      throw error;
    }
  };

  // ⭐ ฟังก์ชันจัดการรูปภาพ ⭐
  const handleEditCoverDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleEditCoverDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleEditCoverDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const file = files[0];
      setEditCoverImage(file);
      setEditCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleEditGalleryDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleEditGalleryDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleEditGalleryDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      const newFiles = [...editGalleryImages, ...files];
      const newPreviews = [...editGalleryPreviews, ...files.map(file => URL.createObjectURL(file))];
      setEditGalleryImages(newFiles);
      setEditGalleryPreviews(newPreviews);
    }
  };

  const handleEditGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...editGalleryImages, ...files];
    const newPreviews = [...editGalleryPreviews, ...files.map(file => URL.createObjectURL(file))];
    setEditGalleryImages(newFiles);
    setEditGalleryPreviews(newPreviews);
  };

  const removeEditGalleryImage = (index) => {
    const newImages = editGalleryImages.filter((_, i) => i !== index);
    const newPreviews = editGalleryPreviews.filter((_, i) => i !== index);
    setEditGalleryImages(newImages);
    setEditGalleryPreviews(newPreviews);
  };

  const removeCurrentImage = async (imageId) => {
    const ok = await ask({
      title: "ยืนยันลบรูป",
      message: "ต้องการลบรูปนี้ออกจากอีเว้นท์หรือไม่?",
      type: "danger",
      confirmText: "ลบ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    setImagesToDelete((prev) => [...prev, imageId]);
    setCurrentEventImages((prev) => prev.filter((img) => img.image_id !== imageId));

    const deletedImage = currentEventImages.find((img) => img.image_id === imageId);
    if (deletedImage && deletedImage.is_cover) {
      setEditCoverPreview("");
    }
  };

  // ⭐ ฟังก์ชันบันทึกการแก้ไข - ขยายให้ครบ ⭐
  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      setAlert({ show: true, message: "กรุณาใส่ชื่ออีเว้นท์", type: "danger" });
      return;
    }

    if (!editForm.description.trim()) {
      setAlert({ show: true, message: "กรุณาใส่คำอธิบายอีเว้นท์", type: "danger" });
      return;
    }

    if (!editForm.organizer_id) {
      setAlert({ show: true, message: "กรุณาเลือกผู้จัดงาน", type: "danger" });
      return;
    }

    setUpdating(true);
    try {
      let venueId = editForm.venue_id;

      // ถ้าเลือกสร้างสถานที่ใหม่
      if (editForm.venue_option === "create") {
        venueId = await createCustomVenueForEdit();
      }

      // อัปเดต event
      const eventData = {
        event_id: editingEvent.event_id,
        name: editForm.name,
        description: editForm.description,
        organizer_id: parseInt(editForm.organizer_id),
        venue_id: venueId || null,
        user_id: user.user_id
      };

      const res = await fetch(`http://localhost:8080/events/${editingEvent.event_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`เกิดข้อผิดพลาด: ${errorData}`);
      }

      // ลบรูปภาพที่เลือกลบ
      for (const imageId of imagesToDelete) {
        try {
          await fetch(`http://localhost:8080/events/${editingEvent.event_id}/images/${imageId}`, {
            method: "DELETE",
          });
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      }

      // อัปโหลดรูปปกใหม่ (ถ้ามี)
      if (editCoverImage) {
        const coverData = new FormData();
        coverData.append("images", editCoverImage);
        coverData.append("is_cover", "true");
        await fetch(`http://localhost:8080/events/${editingEvent.event_id}/images`, {
          method: "POST",
          body: coverData,
        });
      }

      // อัปโหลดรูปแกลเลอรีใหม่ (ถ้ามี)
      if (editGalleryImages.length > 0) {
        const galleryData = new FormData();
        editGalleryImages.forEach(img => galleryData.append("images", img));
        galleryData.append("is_cover", "false");
        await fetch(`http://localhost:8080/events/${editingEvent.event_id}/images`, {
          method: "POST",
          body: galleryData,
        });
      }

      // อัปเดตข้อมูลใน state
      setEvents(prev => prev.map(event => 
        event.event_id === editingEvent.event_id 
          ? { 
              ...event, 
              name: editForm.name,
              description: editForm.description,
              organizer_id: parseInt(editForm.organizer_id),
              venue_id: venueId
            }
          : event
      ));

      // รีเฟรชรูปภาพ
      fetchEventImages(editingEvent.event_id);

      setShowEditModal(false);
      setEditingEvent(null);
      setAlert({ show: true, message: "แก้ไขอีเว้นท์สำเร็จ!", type: "success" });

    } catch (error) {
      console.error("Error updating event:", error);
      setAlert({ show: true, message: error.message, type: "danger" });
    }
    setUpdating(false);
  };

  // แทนที่ confirm() เดิมด้วย GCFFEConfirm
  const handleDeleteEvent = async (event) => {
    const ok = await ask({
      title: "ยืนยันลบอีเว้นท์",
      message: `คุณต้องการลบอีเว้นท์ "${event.name}" หรือไม่?`,
      type: "danger",
      confirmText: "ลบ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    setDeleting(event.event_id);
    try {
      const res = await fetch(`http://localhost:8080/events/${event.event_id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.event_id !== event.event_id));
        setAlert({ show: true, message: "ลบอีเว้นท์สำเร็จ!", type: "success" });
      } else {
        const errorData = await res.text();
        setAlert({ show: true, message: `เกิดข้อผิดพลาด: ${errorData}`, type: "danger" });
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      setAlert({ show: true, message: "เกิดข้อผิดพลาดในการลบ", type: "danger" });
    }
  };

  // ถ้าเป็น organizer ให้แสดงหน้า OrganizerPortfolios แทนทั้งหน้า
  if (role === "organizer") {
    return <OrganizerPortfolios />;
  }

  return (
    <ProfileLayout user={user} sectionName="อีเว้นท์ของฉัน">
      {/* GCFFE Confirm */}
      <GCFFEConfirm
        open={confirmOpen}
        title={confirmOpts.title}
        message={confirmOpts.message}
        type={confirmOpts.type}
        confirmText={confirmOpts.confirmText}
        cancelText={confirmOpts.cancelText}
        closeOnOverlay={confirmOpts.closeOnOverlay}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      {/* Header */}
      <div className="my-events-header-outer">
        <h2 className="my-events-title">อีเว้นท์ของฉัน</h2>
        <div className="my-events-actions">
          <input
            className="my-events-search"
            type="text"
            placeholder="Search Event"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="my-events-create-btn"
            onClick={() => setShowCreateModal(true)}
          >
            สร้างอีเว้นท์
          </button>
          {isOrganizerOrAdmin && (
            <button
              className="my-events-organizer-btn"
              onClick={() => navigate("/organizer-portfolios")}
            >
              อีเว้นท์สำหรับผู้จัดทำ
            </button>
          )}
        </div>
      </div>

      {/* Modal สร้างอีเว้นท์ */}
      {showCreateModal && (
        <div className="my-events-modal-overlay">
          <div className="my-events-modal-content">
            <button
              onClick={() => setShowCreateModal(false)}
              className="my-events-modal-close"
              aria-label="close"
            >
              ×
            </button>
            <CreateEvent
              onSuccess={() => {
                setShowCreateModal(false);
                setAlert({ show: true, message: "สร้างอีเว้นท์สำเร็จ!", type: "success" });
                setLoading(true);
                fetchMyEvents();
              }}
              onError={(msg) => setAlert({ show: true, message: msg, type: "danger" })}
              isPopup
            />
          </div>
        </div>
      )}

      {/* ⭐ Modal แก้ไขอีเว้นท์ - ขยายให้ครบ ⭐ */}
      {showEditModal && editingEvent && (
        <div className="my-events-modal-overlay">
          <div className="my-events-modal-content edit-modal">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingEvent(null);
              }}
              className="my-events-modal-close"
              aria-label="close"
            >
              ×
            </button>
            <div className="my-events-edit-form">
              <h3 className="my-events-edit-title">✏️ แก้ไขอีเว้นท์</h3>
              
              {/* ฟิลด์พื้นฐาน */}
              <div className="my-events-form-group">
                <label className="my-events-form-label">ชื่ออีเว้นท์</label>
                <input
                  type="text"
                  className="my-events-form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="ชื่ออีเว้นท์"
                  disabled={updating}
                />
              </div>

              <div className="my-events-form-group">
                <label className="my-events-form-label">คำอธิบาย</label>
                <textarea
                  className="my-events-form-textarea"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="คำอธิบายอีเว้นท์"
                  rows={4}
                  disabled={updating}
                />
              </div>

              <div className="my-events-form-group">
                <label className="my-events-form-label">ผู้จัดงาน</label>
                <select
                  className="my-events-form-select"
                  value={editForm.organizer_id}
                  onChange={(e) => setEditForm({ ...editForm, organizer_id: e.target.value })}
                  disabled={updating}
                >
                  <option value="">เลือกผู้จัดงาน</option>
                  {organizers.map((org) => (
                    <option key={org.organizer_id} value={org.organizer_id}>
                      {`${org.first_name} ${org.last_name}`.trim() || org.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* ส่วนสถานที่ */}
              <div className="my-events-form-group">
                <label className="my-events-form-label">สถานที่จัดงาน</label>
                <div className="edit-venue-selector">
                  <div className="edit-venue-tabs">
                    <button
                      type="button"
                      className={`edit-venue-tab ${editForm.venue_option === "select" ? "active" : ""}`}
                      onClick={() => setEditForm({ ...editForm, venue_option: "select", venue_id: "" })}
                      disabled={updating}
                    >
                      📋 เลือกจากรายการ
                    </button>
                    <button
                      type="button"
                      className={`edit-venue-tab ${editForm.venue_option === "create" ? "active" : ""}`}
                      onClick={() => setEditForm({ ...editForm, venue_option: "create", venue_id: "" })}
                      disabled={updating}
                    >
                      ➕ สร้างสถานที่ใหม่
                    </button>
                  </div>

                  {editForm.venue_option === "select" ? (
                    <select
                      className="my-events-form-select"
                      value={editForm.venue_id}
                      onChange={(e) => setEditForm({ ...editForm, venue_id: e.target.value })}
                      disabled={updating}
                    >
                      <option value="">-- เลือกสถานที่ (ไม่บังคับ) --</option>
                      {venues.map((venue) => (
                        <option key={venue.venue_id} value={venue.venue_id}>
                          📍 {venue.name} - {venue.location}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="edit-custom-venue-form">
                      <div className="edit-venue-row">
                        <div className="edit-venue-col">
                          <label>ชื่อสถานที่ *</label>
                          <input
                            type="text"
                            name="name"
                            value={editForm.custom_venue.name}
                            onChange={handleEditCustomVenueChange}
                            placeholder="เช่น โรงแรม ABC"
                            disabled={updating}
                            required
                          />
                        </div>
                        <div className="edit-venue-col">
                          <label>ประเภทสถานที่ *</label>
                          <select
                            name="venue_type"
                            value={editForm.custom_venue.venue_type}
                            onChange={handleEditCustomVenueChange}
                            disabled={updating}
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
                      
                      <div className="edit-venue-full">
                        <label>ที่อยู่ / สถานที่ตั้ง *</label>
                        <input
                          type="text"
                          name="location"
                          value={editForm.custom_venue.location}
                          onChange={handleEditCustomVenueChange}
                          placeholder="เช่น 123 ถ.สุขุมวิท กรุงเทพฯ"
                          disabled={updating}
                          required
                        />
                      </div>

                      <div className="edit-venue-row">
                        <div className="edit-venue-col">
                          <label>ช่วงราคา</label>
                          <input
                            type="text"
                            name="price_range"
                            value={editForm.custom_venue.price_range}
                            onChange={handleEditCustomVenueChange}
                            placeholder="เช่น 20,000-50,000 บาท"
                            disabled={updating}
                          />
                        </div>
                        <div className="edit-venue-col">
                          <label>คำอธิบาย</label>
                          <input
                            type="text"
                            name="description"
                            value={editForm.custom_venue.description}
                            onChange={handleEditCustomVenueChange}
                            placeholder="เช่น ห้องจัดเลี้ยงขนาดใหญ่"
                            disabled={updating}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ส่วนรูปภาพปัจจุบัน */}
              {currentEventImages.length > 0 && (
                <div className="my-events-form-group">
                  <label className="my-events-form-label">รูปภาพปัจจุบัน</label>
                  <div className="current-images-grid">
                    {currentEventImages.map((img) => (
                      <div key={img.image_id} className="current-image-item">
                        <img
                          src={`http://localhost:8080${img.image_url.replace(/^\./, "")}`}
                          alt="current"
                          className="current-image-thumbnail"
                        />
                        {img.is_cover && <div className="image-cover-badge">ปก</div>}
                        <button
                          type="button"
                          className="current-image-remove-btn"
                          onClick={() => removeCurrentImage(img.image_id)}
                          title="ลบรูปนี้"
                          disabled={updating}
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ส่วนรูปปก */}
              <div className="my-events-form-group">
                <label className="my-events-form-label">เปลี่ยนภาพปก</label>
                <div 
                  className={`edit-image-upload-box ${editCoverPreview ? 'has-image' : ''}`}
                  onClick={() => editCoverInputRef.current?.click()}
                  onDragOver={handleEditCoverDragOver}
                  onDragLeave={handleEditCoverDragLeave}
                  onDrop={handleEditCoverDrop}
                >
                  {editCoverPreview ? (
                    <div className="edit-image-preview-container">
                      <img src={editCoverPreview} alt="cover" className="edit-cover-preview" />
                      <div className="edit-image-overlay">
                        <button 
                          type="button"
                          className="edit-image-action-btn remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditCoverImage(null);
                            setEditCoverPreview("");
                            if (editCoverInputRef.current) {
                              editCoverInputRef.current.value = '';
                            }
                          }}
                          title="ลบรูป"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="edit-image-placeholder">
                      <div className="edit-upload-icon">📸</div>
                      <div className="edit-upload-title">คลิกเพื่อเปลี่ยนภาพปก</div>
                      <div className="edit-upload-subtitle">หรือลากรูปมาวาง</div>
                    </div>
                  )}
                  <input
                    ref={editCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditCoverImage(file);
                        setEditCoverPreview(URL.createObjectURL(file));
                      }
                    }}
                    disabled={updating}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* ส่วนแกลเลอรี */}
              <div className="my-events-form-group">
                <label className="my-events-form-label">เพิ่มรูปภาพใหม่</label>
                <div 
                  className="edit-gallery-upload-area"
                  onClick={() => editGalleryInputRef.current?.click()}
                  onDragOver={handleEditGalleryDragOver}
                  onDragLeave={handleEditGalleryDragLeave}
                  onDrop={handleEditGalleryDrop}
                >
                  <div className="edit-gallery-upload-content">
                    <div className="edit-upload-icon">🖼️</div>
                    <div className="edit-upload-title">เพิ่มรูปภาพในแกลเลอรี</div>
                    <div className="edit-upload-subtitle">คลิกเพื่อเลือกหลายไฟล์ หรือลากรูปมาวาง</div>
                  </div>
                  <input
                    ref={editGalleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditGalleryChange}
                    disabled={updating}
                    style={{ display: 'none' }}
                  />
                </div>

                {editGalleryPreviews.length > 0 && (
                  <div className="edit-gallery-preview">
                    <div className="edit-gallery-header">
                      <span>รูปใหม่ที่เลือก ({editGalleryPreviews.length} รูป)</span>
                      <button
                        type="button"
                        className="edit-clear-all-btn"
                        onClick={async () => {
                          const ok = await ask({
                            title: "ยืนยันลบรูปใหม่ทั้งหมด",
                            message: "ต้องการลบรายการรูปใหม่ที่เลือกทั้งหมดหรือไม่?",
                            type: "warning",
                            confirmText: "ลบทั้งหมด",
                            closeOnOverlay: false,
                          });
                          if (!ok) return;
                          setEditGalleryImages([]);
                          setEditGalleryPreviews([]);
                        }}
                        title="ลบรูปทั้งหมด"
                      >
                        🗑️ ลบทั้งหมด
                      </button>
                    </div>
                    <div className="edit-gallery-grid">
                      {editGalleryPreviews.map((src, idx) => (
                        <div key={idx} className="edit-gallery-item">
                          <img
                            src={src}
                            alt={`gallery-${idx}`}
                            className="edit-gallery-thumbnail"
                          />
                          <button 
                            type="button"
                            className="edit-gallery-remove-btn"
                            onClick={() => removeEditGalleryImage(idx)}
                            title="ลบรูปนี้"
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="my-events-form-actions">
                <button
                  className="my-events-save-btn"
                  onClick={handleSaveEdit}
                  disabled={updating}
                >
                  {updating ? "⏳ กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
                </button>
                <button
                  className="my-events-cancel-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEvent(null);
                  }}
                  disabled={updating}
                >
                  ❌ ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />

      {/* กรอบล้อมเฉพาะรายการอีเว้นท์ */}
      <div className="my-events-main-border">
        <div className="my-events-container">
          {loading ? (
            <div className="my-events-loading">กำลังโหลด...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="my-events-empty">
              <div className="my-events-empty-icon">📅</div>
              <h3>ยังไม่มีอีเว้นท์</h3>
              <p>เริ่มต้นสร้างอีเว้นท์แรกของคุณ</p>
              <button 
                className="my-events-create-btn"
                onClick={() => setShowCreateModal(true)}
              >
                สร้างอีเว้นท์แรก
              </button>
            </div>
          ) : (
            <div className="my-events-list-grid">
              {filteredEvents.map((event) => (
                <div
                  className="my-event-card-grid"
                  key={event.event_id}
                >
                  <div 
                    className="my-event-img-wrap"
                    onClick={() => navigate(`/events/${event.event_id}`)}
                    style={{ cursor: "pointer", position: "relative" }}
                  >
                    <img
                      src={
                        eventImages[event.event_id]
                          ? (
                              eventImages[event.event_id].find(img => img.is_cover) ||
                              eventImages[event.event_id][0]
                            )?.image_url
                            ? `http://localhost:8080${(
                                eventImages[event.event_id].find(img => img.is_cover) ||
                                eventImages[event.event_id][0]
                              ).image_url.replace(/^\./, "")}`
                            : "https://placehold.co/300x180?text=No+Image"
                          : "https://placehold.co/300x180?text=No+Image"
                      }
                      alt={event.name}
                      className="my-event-img"
                      style={event.is_active === false ? { filter: "grayscale(1)", opacity: 0.65 } : undefined}
                    />
                    {event.is_active === false && (
                      <span
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          background: "#ef4444",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 12,
                          padding: "4px 8px",
                          borderRadius: 8,
                          boxShadow: "0 2px 8px rgba(0,0,0,.15)"
                        }}
                        title="อีเวนท์นี้ถูกระงับ"
                      >
                        ระงับอยู่
                      </span>
                    )}
                  </div>
                  <div className="my-event-info">
                    <div 
                      className="my-event-info-title"
                      onClick={() => navigate(`/events/${event.event_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {event.name}
                    </div>
                    <div className="my-event-info-organizer">
                      {getOrganizerName(event.organizer_id)}
                    </div>
                  </div>
                  
                  <div className="my-event-actions">
                    <button 
                      className="my-event-action-btn my-event-edit-btn"
                      onClick={() => handleStartEdit(event)}
                      title="แก้ไขอีเว้นท์"
                      disabled={updating}
                    >
                      <span>✏️</span>
                      แก้ไข
                    </button>
                    <button 
                      className="my-event-action-btn my-event-delete-btn"
                      onClick={() => handleDeleteEvent(event)}
                      title="ลบอีเว้นท์"
                      disabled={deleting === event.event_id}
                    >
                      <span>{deleting === event.event_id ? "⏳" : "🗑️"}</span>
                      {deleting === event.event_id ? "ลบ..." : "ลบ"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default MyEvents;

