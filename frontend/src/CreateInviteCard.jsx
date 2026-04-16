import React, { useState, useRef, useEffect } from "react";
import AiLayout from "./AiLayout";
import SendInvitationEmail from "./SendInvitationEmail";
import GlassAlert from "./GlassAlert";
import InvitationWizard from "./components/InvitationWizard";
import "./CreateInviteCard.css";

function CreateInviteCard() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);

  // Modal รูปใหญ่ + รูปที่เลือก
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // ส่งอีเมล
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [selectedImageForEmail, setSelectedImageForEmail] = useState(null);

  // อัลบั้ม
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // เพิ่ม state ที่ขาด
  const [generatedImages, setGeneratedImages] = useState([]);
  const [matchedOrganizers, setMatchedOrganizers] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [referenceImage, setReferenceImage] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem("user");
      if (!user || user === "undefined") return null;
      return JSON.parse(user);
    } catch {
      return null;
    }
  });

  const fileInputRef = useRef(null);

  const showAlert = (message, type = "success") => setAlert({ show: true, message, type });

  useEffect(() => {
    if (!alert.show) return;
    const t = setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
    return () => clearTimeout(t);
  }, [alert.show]);

  // โหลดรูปจาก DB
  useEffect(() => {
    const loadUserImages = async () => {
      if (!currentUser?.user_id) {
        setGeneratedImages([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:8080/ai-generated-images/user/${currentUser.user_id}/invitation`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.images) {
            const formatted = data.images.map(img => ({
              id: img.id.toString(),
              albumId: img.album_id || img.id.toString(),
              base64: img.base64_data,
              prompt: img.prompt,
              model: img.model_used || "unknown",
              enhanced_prompt: img.enhanced_prompt || "",
              has_reference: img.has_reference,
              createdAt: new Date(img.created_at).toLocaleString("th-TH"),
              variation: img.variation_number,
              isAlbum: img.is_album,
              user_id: currentUser.user_id
            }));
            setGeneratedImages(formatted);
          } else {
            setGeneratedImages([]);
          }
        } else {
          setGeneratedImages([]);
        }
      } catch {
        setGeneratedImages([]);
      }
    };
    loadUserImages();
  }, [currentUser?.user_id]);

  // sync user จาก localStorage
  useEffect(() => {
    const checkAndUpdateUser = () => {
      try {
        const user = localStorage.getItem("user");
        const parsed = user && user !== "undefined" ? JSON.parse(user) : null;
        if (parsed?.user_id !== currentUser?.user_id) setCurrentUser(parsed);
      } catch {
        if (currentUser !== null) setCurrentUser(null);
      }
    };
    checkAndUpdateUser();
    const i = setInterval(checkAndUpdateUser, 2000);
    return () => clearInterval(i);
  }, [currentUser?.user_id]);

  const saveImagesToDatabase = async (images) => {
    if (!currentUser?.user_id || !images.length) return false;
    try {
      const payload = images.map(img => ({
        user_id: currentUser.user_id,
        image_type: "invitation",
        album_id: img.albumId,
        base64_data: img.base64,
        prompt: img.prompt,
        enhanced_prompt: img.enhanced_prompt || "",
        model_used: img.model || "",
        variation_number: img.variation || 1,
        is_album: img.isAlbum || false,
        has_reference: img.has_reference || false
      }));
      const res = await fetch("http://localhost:8080/ai-generated-images/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return false;
      await res.json();
      return true;
    } catch {
      return false;
    }
  };

  const suggestedTags = [
    "บัตรเชิญงานแต่งงาน สีทอง-ขาว หรูหรา",
    "บัตรเชิญงานวันเกิด น่ารัก สีชมพู",
    "บัตรเชิญงานองค์กร สีน้ำเงิน-ขาว"
  ];

  const handleTagClick = (tag) => {
    setPrompt(prev => (prev ? `${prev}, ${tag}` : tag));
    showAlert(`เพิ่มแท็ก "${tag}" ลงในคำอธิบาย`, "info");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadPreview(null);
      setReferenceImage(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      showAlert("กรุณาเลือกไฟล์รูปภาพเท่านั้น", "warning");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert("ขนาดไฟล์ต้องไม่เกิน 5MB", "warning");
      return;
    }
    setUploadPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = String(ev.target.result).split(",")[1];
      setReferenceImage(base64);
    };
    reader.readAsDataURL(file);
    showAlert("อัปโหลดรูปอ้างอิงสำเร็จ! 📸", "success");
  };

  const findMatchingOrganizers = async (p) => {
    if (!p.trim() || !currentUser?.user_id) return;
    setLoadingMatches(true);
    try {
      const res = await fetch("http://localhost:8081/ai-match-organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p.trim(), user_id: currentUser.user_id })
      });
      const data = await res.json();
      setMatchedOrganizers(res.ok && data.success ? (data.matches || []) : []);
    } catch {
      setMatchedOrganizers([]);
    }
    setLoadingMatches(false);
  };

  const handleGenerateWithPrompt = async (customPrompt = null) => {
    const p = customPrompt || prompt;
    if (!currentUser?.user_id) return showAlert("กรุณาเข้าสู่ระบบก่อนใช้งาน", "warning");
    if (!p.trim()) return showAlert("กรุณาใส่คำอธิบายก่อนสร้างบัตรเชิญ", "warning");
    if (p.length > 500) return showAlert("คำอธิบายยาวเกินไป (สูงสุด 500 ตัวอักษร)", "warning");

    setLoading(true);
    setError("");
    showAlert("กำลังสร้างบัตรเชิญ 3 แบบด้วย AI... ⏳", "info");

    try {
      const requestData = {
        prompt: p.trim(),
        count: 3,
        variations: true,
        user_id: currentUser.user_id,
        user_name: currentUser.first_name || currentUser.username || "User",
        ...(referenceImage ? { reference_image: referenceImage } : {})
      };
      const endpoint = referenceImage
        ? "http://localhost:8081/ai-generate-image-with-reference"
        : "http://localhost:8081/ai-generate-invitation-album";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(requestData)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const albumId = Date.now().toString();
        const images = data.images || [data.image_base64];
        const albumImages = images.filter(Boolean).map((base64, i) => ({
          id: `temp_${albumId}_${i}`,
          albumId,
          base64,
          prompt: p.trim(),
          model: data.model_used,
          enhanced_prompt: data.enhanced_prompt,
          has_reference: !!referenceImage,
          createdAt: new Date().toLocaleString("th-TH"),
          variation: i + 1,
          isAlbum: true,
          user_id: currentUser.user_id
        }));

        if (!albumImages.length) throw new Error("ไม่มีภาพที่สร้างสำเร็จ");

        const saved = await saveImagesToDatabase(albumImages);
        if (saved) {
          showAlert(`สร้างและบันทึกบัตรเชิญสำเร็จ ${albumImages.length} แบบ! 🎨✨`, "success");
          const response = await fetch(`http://localhost:8080/ai-generated-images/user/${currentUser.user_id}/invitation`);
          if (response.ok) {
            const refresh = await response.json();
            if (refresh.success && refresh.images) {
              setGeneratedImages(
                refresh.images.map(img => ({
                  id: img.id.toString(),
                  albumId: img.album_id || img.id.toString(),
                  base64: img.base64_data,
                  prompt: img.prompt,
                  model: img.model_used || "unknown",
                  enhanced_prompt: img.enhanced_prompt || "",
                  has_reference: img.has_reference,
                  createdAt: new Date(img.created_at).toLocaleString("th-TH"),
                  variation: img.variation_number,
                  isAlbum: img.is_album,
                  user_id: currentUser.user_id
                }))
              );
            }
          }
          await findMatchingOrganizers(p);
        } else {
          setGeneratedImages(prev => [...albumImages, ...prev]);
          showAlert(`สร้างบัตรเชิญสำเร็จ ${albumImages.length} แบบ! แต่การบันทึกมีปัญหา`, "warning");
        }
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการสร้างบัตรเชิญ");
        showAlert(data.error || "เกิดข้อผิดพลาดในการสร้างบัตรเชิญ", "danger");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      showAlert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ AI ได้", "danger");
    }
    setLoading(false);
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    await handleGenerateWithPrompt();
  };

  const handleImageClick = (image) => { setSelectedImage(image); setShowModal(true); };
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("คุณต้องการลบบัตรเชิญนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`http://localhost:8080/ai-generated-images/${imageId}?user_id=${currentUser.user_id}`, { method: "DELETE" });
      if (res.ok) {
        setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
        showAlert("ลบบัตรเชิญเรียบร้อยแล้ว 🗑️", "success");
      } else {
        showAlert("เกิดข้อผิดพลาดในการลบ", "danger");
      }
    } catch {
      showAlert("เกิดข้อผิดพลาดในการลบ", "danger");
    }
  };
  const handleClearAll = async () => {
    if (!window.confirm("คุณต้องการลบบัตรเชิญทั้งหมดใช่หรือไม่?")) return;
    try {
      const albums = {};
      generatedImages.forEach(img => { if (img.albumId) albums[img.albumId] = true; });
      await Promise.all(Object.keys(albums).map(albumId =>
        fetch(`http://localhost:8080/ai-generated-images/album/${albumId}?user_id=${currentUser.user_id}`, { method: "DELETE" })
      ));
      setGeneratedImages([]);
      setMatchedOrganizers([]);
      showAlert("ลบบัตรเชิญทั้งหมดเรียบร้อยแล้ว 🧹", "success");
    } catch {
      showAlert("เกิดข้อผิดพลาดในการลบ", "danger");
    }
  };
  const handleDownload = (image) => {
    try {
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${image.base64}`;
      a.download = `invitation-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showAlert("ดาวน์โหลดสำเร็จ! 📥", "success");
    } catch {
      showAlert("เกิดข้อผิดพลาดในการดาวน์โหลด", "danger");
    }
  };
  const handleSendEmail = (image) => { setSelectedImageForEmail(image); setShowSendEmail(true); };
  const handleAlbumClick = (albumImages) => { setSelectedAlbum(albumImages); setShowAlbumModal(true); };

  // เพิ่ม: ลบทั้งอัลบั้ม
  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm("คุณต้องการลบอัลบั้มทั้งหมดใช่หรือไม่?")) return;
    try {
      const res = await fetch(`http://localhost:8080/ai-generated-images/album/${albumId}?user_id=${currentUser.user_id}`, { method: "DELETE" });
      if (res.ok) {
        setGeneratedImages(prev => prev.filter(img => img.albumId !== albumId));
        showAlert("ลบอัลบั้มเรียบร้อยแล้ว 🗑️", "success");
      } else {
        showAlert("ลบอัลบั้มไม่สำเร็จ", "danger");
      }
    } catch {
      showAlert("เกิดข้อผิดพลาดในการลบอัลบั้ม", "danger");
    }
  };

  const closeImageModal = () => setShowModal(false);
  const openSendEmail = (image) => { setShowModal(false); setSelectedImageForEmail(image); setShowSendEmail(true); };

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e) => { if (e.key === "Escape") setShowModal(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModal]);

  if (!currentUser) {
    return (
      <AiLayout>
        <div className="ai-invite-container ai-invite-container--narrow">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", flexDirection: "column", gap: "16px", gridColumn: "span 2" }}>
            <div style={{ fontSize: "2rem" }}>🔄</div>
            <div>กำลังโหลดข้อมูลผู้ใช้...</div>
            <div style={{ fontSize: "0.8rem", color: "#666" }}>
              หากยังไม่ได้เข้าสู่ระบบ กรุณา <a href="/login">เข้าสู่ระบบ</a>
            </div>
          </div>
        </div>
      </AiLayout>
    );
  }

  return (
    <AiLayout>
      <GlassAlert show={alert.show} message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, show: false })} />

      <InvitationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onGenerate={async (wizardPrompt, autoGenerate = false) => {
          setPrompt(wizardPrompt);
          showAlert("ใช้ข้อมูลจากตัวช่วยสร้างบัตรเชิญ! 🎨", "success");
          if (autoGenerate) await handleGenerateWithPrompt(wizardPrompt);
        }}
      />

      {showSendEmail && (
        <SendInvitationEmail
          isOpen={showSendEmail}
          onClose={() => setShowSendEmail(false)}
          imageData={selectedImageForEmail}
          // เพิ่ม callback สำหรับ "ลบ/ยกเลิกการส่งเมล"
          onDiscard={() => {
            setShowSendEmail(false);
            setSelectedImageForEmail(null);
            showAlert("ยกเลิกการส่งอีเมลแล้ว", "info");
          }}
        />
      )}

      <div className="ai-invite-container ai-invite-container--narrow">
        {/* ซ้าย: กล่องอินพุต */}
        <div className="ai-invite-input-card ai-invite-input-card--narrow">
          <div className="ai-invite-upload-box" onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer" }}>
            {uploadPreview ? (
              <img src={uploadPreview} alt="preview" className="ai-invite-upload-preview" />
            ) : (
              <div className="ai-invite-upload-placeholder">
                <span role="img" aria-label="upload" style={{ fontSize: 38 }}>🎨</span>
                <div className="ai-invite-upload-label">อัปโหลดรูปบัตรเชิญอ้างอิง</div>
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageChange} />
          </div>

          <button type="button" onClick={() => setShowWizard(true)} className="ai-invite-wizard-btn" style={{ marginBottom: "16px" }}>
            🧙‍♂️ ใช้ตัวช่วยสร้างบัตรเชิญ
          </button>

          <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "8px", textAlign: "center", padding: "4px 8px", background: currentUser.user_id ? "#e8f5e8" : "#fff3cd", borderRadius: "8px" }}>
            👤 {currentUser.first_name || currentUser.username || "User"}
            <span style={{ fontSize: "0.7rem", opacity: 0.7 }}> (ID: {currentUser.user_id || "guest"})</span>
          </div>

          <label className="ai-invite-prompt-label" htmlFor="prompt-input">prompt</label>
          <textarea
            id="prompt-input"
            className="ai-invite-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={uploadPreview ? "อยากได้บัตรเชิญตามสไตล์รูปที่ให้" : "บัตรเชิญงานแต่งงาน สีทอง-ขาว หรูหรา, บัตรเชิญงานวันเกิดน่ารัก"}
            maxLength={500}
          />
          <div className="ai-invite-tags">
            {suggestedTags.map(tag => (
              <div key={tag} className="ai-invite-tag" onClick={() => handleTagClick(tag)}>{tag}</div>
            ))}
          </div>
          <button className="ai-invite-generate-btn" onClick={handleGenerate} disabled={loading || !prompt.trim() || !currentUser?.user_id}>
            {loading ? "กำลังสร้าง..." : "Generate"}
          </button>
          {error && <div className="ai-invite-error">❌ {error}</div>}
        </div>

        {/* ขวา: แกลเลอรี */}
        <div className="ai-invite-preview-card ai-invite-preview-card--narrow">
          <div className="ai-invite-gallery-header">
            <h3 className="ai-invite-title">
              ผลลัพธ์ ({generatedImages.length})
              {currentUser?.user_id && <span style={{ fontSize: "0.7rem", opacity: 0.7, marginLeft: "8px" }}>- User: {currentUser.user_id}</span>}
            </h3>
            {generatedImages.length > 0 && (
              <button className="ai-invite-clear-btn" onClick={handleClearAll} title="ลบรูปทั้งหมด">🗑️ ล้างทั้งหมด</button>
            )}
          </div>

          <div className="ai-invite-preview-content">
            {loading ? (
              <div className="ai-invite-loading">
                <div className="ai-invite-loading-spinner">🔄</div>
                <div className="ai-invite-loading-text">กำลังสร้างบัตรเชิญ...</div>
              </div>
            ) : generatedImages.length > 0 ? (
              <>
                <div className="ai-invite-gallery-container">
                  <div className="ai-invite-gallery">
                    {(() => {
                      const { albums, singleImages } = groupImagesByAlbum(generatedImages);
                      const albumKeys = Object.keys(albums).sort((a, b) => parseInt(b) - parseInt(a));
                      return (
                        <>
                          {albumKeys.map(albumId => {
                            const albumImages = albums[albumId].sort((a, b) => a.variation - b.variation);
                            const coverImage = albumImages[0];
                            return (
                              <div key={`album-${albumId}`} className="ai-invite-gallery-item ai-invite-album-cover">
                                <div className="ai-invite-album-badge">📸 {albumImages.length} รูป</div>
                                <div
                                  className="ai-invite-image-wrap"
                                  onClick={() => handleAlbumClick(albumImages)}
                                  title={`คลิกเพื่อดูอัลบั้ม ${albumImages.length} รูป`}
                                >
                                  <img
                                    src={`data:image/png;base64,${coverImage.base64}`}
                                    alt="Album Cover"
                                    className="ai-invite-gallery-thumbnail"
                                  />
                                  <div className="ai-invite-thumb-overlay">
                                    <button
                                      className="ai-invite-thumb-btn"
                                      title="ส่งอีเมล (ภาพหน้าปก)"
                                      onClick={(e) => { e.stopPropagation(); handleSendEmail(coverImage); }}
                                    >📧</button>
                                    <button
                                      className="ai-invite-thumb-btn danger"
                                      title="ลบอัลบั้ม"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(albumId); }}
                                    >🗑️</button>
                                  </div>
                                </div>
                                <div className="ai-invite-gallery-info">
                                  <div className="ai-invite-gallery-prompt" title={coverImage.prompt}>
                                    🎨 อัลบั้ม: {coverImage.prompt.length > 25 ? `${coverImage.prompt.slice(0, 25)}...` : coverImage.prompt}
                                  </div>
                                  <div className="ai-invite-gallery-actions">
                                    <div className="ai-invite-gallery-time">{coverImage.createdAt}</div>
                                    <div className="ai-invite-action-buttons">
                                      <button onClick={(e) => { e.stopPropagation(); handleAlbumClick(albumImages); }} className="ai-invite-view-album-btn" title="ดูอัลบั้ม">👁️</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {singleImages.map(image => (
                            <div key={image.id} className="ai-invite-gallery-item">
                              <div
                                className="ai-invite-image-wrap"
                                onClick={() => handleImageClick(image)}
                                title="คลิกเพื่อดูรูปใหญ่"
                              >
                                <img
                                  src={`data:image/png;base64,${image.base64}`}
                                  alt="Generated Invitation"
                                  className="ai-invite-gallery-thumbnail"
                                />
                                <div className="ai-invite-thumb-overlay">
                                  <button
                                    className="ai-invite-thumb-btn"
                                    title="ส่งอีเมล"
                                    onClick={(e) => { e.stopPropagation(); handleSendEmail(image); }}
                                  >📧</button>
                                  <button
                                    className="ai-invite-thumb-btn danger"
                                    title="ลบรูป"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(image.id); }}
                                  >🗑️</button>
                                </div>
                              </div>
                              <div className="ai-invite-gallery-info">
                                <div className="ai-invite-gallery-prompt" title={image.prompt}>
                                  {image.prompt.length > 30 ? `${image.prompt.slice(0, 30)}...` : image.prompt}
                                </div>
                                <div className="ai-invite-gallery-actions">
                                  <div className="ai-invite-gallery-time">{image.createdAt}</div>
                                  <div className="ai-invite-action-buttons">
                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(image); }} className="ai-invite-download-btn" title="ดาวน์โหลด">📥</button>
                                  </div>
                                </div>
                              </div>
                              <button className="ai-invite-gallery-delete" onClick={(e) => { e.stopPropagation(); handleDeleteImage(image.id); }} title="ลบรูป">✕</button>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {(matchedOrganizers.length > 0 || loadingMatches) && (
                  <div className="ai-invite-matching-container">
                    <div className="ai-invite-matching-section">
                      <h4 className="ai-invite-matching-title">🎯 ผู้จัดอีเว้นต์ที่แนะนำ</h4>
                      {loadingMatches ? (
                        <div className="ai-invite-matching-loading">
                          <div className="ai-invite-loading-spinner">🔄</div>
                          <span>กำลังหาผู้จัดอีเว้นต์ที่เหมาะสม...</span>
                        </div>
                      ) : matchedOrganizers.length === 0 ? (
                        <div className="ai-invite-no-matches">
                          <p>❌ ไม่พบผู้จัดอีเว้นต์ที่เหมาะสม</p>
                          <p style={{ fontSize: "0.75rem", color: "#666" }}>ลองใช้คำอธิบายที่ละเอียดมากขึ้น</p>
                        </div>
                      ) : (
                        <div className="ai-invite-matching-horizontal">
                          {matchedOrganizers.map(organizer => (
                            <div
                              key={organizer.organizer_id}
                              className="ai-invite-organizer-card-horizontal"
                              onClick={() => {
                                showAlert(`เปิดโปรไฟล์ ${organizer.first_name || organizer.name}`, "info");
                                window.open(`/organizers/${organizer.organizer_id}`, "_blank");
                              }}
                            >
                              <div className="ai-invite-organizer-image-horizontal">
                                <img
                                  src={
                                    organizer.profile_image
                                      ? (organizer.profile_image.startsWith("http") ? organizer.profile_image : `http://localhost:8080${organizer.profile_image.replace(/^\./, "")}`)
                                      : organizer.portfolio_img
                                      ? (organizer.portfolio_img.startsWith("http") ? organizer.portfolio_img : `http://localhost:8080${organizer.portfolio_img.replace(/^\./, "")}`)
                                      : "https://placehold.co/80x80?text=👤"
                                  }
                                  alt={organizer.name || `${organizer.first_name} ${organizer.last_name}`}
                                  className="ai-invite-organizer-avatar-horizontal"
                                  onError={(e) => {
                                    if (organizer.portfolio_img && !e.currentTarget.src.includes(organizer.portfolio_img)) {
                                      e.currentTarget.src = organizer.portfolio_img.startsWith("http")
                                        ? organizer.portfolio_img
                                        : `http://localhost:8080${organizer.portfolio_img.replace(/^\./, "")}`;
                                    } else {
                                      e.currentTarget.src = "https://placehold.co/80x80?text=👤";
                                    }
                                  }}
                                />
                                <div className="ai-invite-match-badge-horizontal">
                                  {organizer.match_percentage || Math.round((organizer.similarity_score || 0) * 100)}%
                                </div>
                              </div>
                              <div className="ai-invite-organizer-name-horizontal">
                                {organizer.name || `${organizer.first_name} ${organizer.last_name}`}
                              </div>
                              <div className="ai-invite-organizer-expertise-horizontal">
                                {organizer.expertise}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="ai-invite-suggestions">
                <div className="ai-invite-suggestions-title">ยังไม่มีบัตรเชิญ</div>
                <div className="ai-invite-suggestions-subtitle">
                  กรุณาใส่คำอธิบายและกด Generate<br />เพื่อสร้างบัตรเชิญที่สวยงาม ✨
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Album Modal */}
        {showAlbumModal && selectedAlbum && (
          <div className="ai-invite-album-modal" onClick={() => setShowAlbumModal(false)} style={{ zIndex: 9000 }}>
            <div className="ai-invite-album-modal-content" onClick={(e) => e.stopPropagation()} style={{ zIndex: 9001 }}>
              <div className="ai-invite-album-modal-header">
                <h3>🎨 อัลบั้มบัตรเชิญ ({selectedAlbum.length} แบบ)</h3>
                <button className="ai-invite-album-modal-close" onClick={() => setShowAlbumModal(false)}>✕</button>
              </div>

              <div className="ai-invite-album-modal-grid">
                {selectedAlbum.map((image) => (
                  <div key={image.id} className="ai-invite-album-modal-image-item">
                    <div className="ai-invite-album-modal-image-container">
                      <img
                        src={`data:image/png;base64,${image.base64}`}
                        alt={`Variation ${image.variation}`}
                        className="ai-invite-album-modal-image"
                        onClick={() => { setSelectedImage(image); setShowModal(true); setShowAlbumModal(false); }}
                      />
                      <div className="ai-invite-album-modal-overlay">
                        <div className="ai-invite-album-modal-variation">แบบที่ {image.variation}</div>
                        <div className="ai-invite-album-modal-actions">
                          <button onClick={(e) => { e.stopPropagation(); handleDownload(image); }} className="ai-invite-album-modal-action-btn" title="ดาวน์โหลด">📥</button>
                          <button onClick={(e) => { e.stopPropagation(); setShowAlbumModal(false); setTimeout(() => { handleSendEmail(image); }, 200); }} className="ai-invite-album-modal-action-btn" title="ส่งอีเมล">📧</button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedImage(image); setShowModal(true); setShowAlbumModal(false); }} className="ai-invite-album-modal-action-btn" title="ดูรูปใหญ่">🔍</button>
                        </div>
                      </div>
                    </div>
                    <div className="ai-invite-album-modal-image-info">
                      <div className="ai-invite-album-modal-prompt">
                        {image.prompt.length > 40 ? `${image.prompt.slice(0, 40)}...` : image.prompt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ai-invite-album-modal-footer">
                <div className="ai-invite-album-modal-info">
                  <strong>Created:</strong> {selectedAlbum[0]?.createdAt} | <strong> Model:</strong> {selectedAlbum[0]?.model}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal รูปใหญ่ */}
        {showModal && selectedImage && (
          <div className="ai-invite-modal" role="dialog" aria-modal="true" onClick={closeImageModal}>
            <div className="ai-invite-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="ai-invite-modal-header">
                <div className="ai-invite-modal-title">รูปตัวอย่างใหญ่</div>
                <button className="ai-invite-modal-close-btn" onClick={closeImageModal} aria-label="Close" title="ปิด">✕</button>
              </div>
              <div className="ai-invite-modal-body">
                <img src={`data:image/png;base64,${selectedImage.base64}`} alt="AI Generated Invitation Large" className="ai-invite-modal-img" draggable={false} />
              </div>
              <div className="ai-invite-modal-footer">
                <button className="ai-invite-modal-action" onClick={() => { const a = document.createElement("a"); a.href = `data:image/png;base64,${selectedImage.base64}`; a.download = `invitation_${selectedImage.variation || "1"}.png`; a.click(); }} title="ดาวน์โหลด">📥 ดาวน์โหลด</button>
                <button className="ai-invite-modal-action ai-invite-modal-action--primary" onClick={() => openSendEmail(selectedImage)} title="ส่งอีเมล">📧 ส่งอีเมล</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AiLayout>
  );
}

// ฟังก์ชันจัดกลุ่มภาพเป็นอัลบั้ม
const groupImagesByAlbum = (images) => {
  const albums = {};
  const singleImages = [];
  images.forEach(image => {
    if (image.isAlbum && image.albumId) {
      if (!albums[image.albumId]) albums[image.albumId] = [];
      albums[image.albumId].push(image);
    } else {
      singleImages.push(image);
    }
  });
  return { albums, singleImages };
};

export default CreateInviteCard;