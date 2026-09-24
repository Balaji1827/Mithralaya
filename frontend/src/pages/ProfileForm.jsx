 import React, { useState } from "react";
import "../css/userDashboard.css";

const ProfileForm = ({ user, onSave }) => {
  const [form, setForm] = useState(user);

  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <div className="profile-content">
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>My Profile</h2>

      <label className="input-label">Full Name*</label>
      <input className="input-box" value={form.name} onChange={(e) => updateField("name", e.target.value)} />

      <label className="input-label">Email Id*</label>
      <input className="input-box" value={form.email} disabled />

      <label className="input-label">Mobile*</label>
      <input className="input-box" value={form.mobile} onChange={(e) => updateField("mobile", e.target.value)} />

      <label className="input-label">Gender*</label>
      <div className="gender-buttons">
        {["Male", "Female", "Other"].map((g) => (
          <div
            key={g}
            className={`gender-btn ${form.gender === g ? "active" : ""}`}
            onClick={() => updateField("gender", g)}
          >
            {g}
          </div>
        ))}
      </div>

      <label className="input-label">Date of birth*</label>
      <input type="date" className="input-box" value={form.dob} onChange={(e) => updateField("dob", e.target.value)} />

      <label>
        <input type="checkbox" checked={form.whatsappOptIn} onChange={(e) => updateField("whatsappOptIn", e.target.checked)} />
        &nbsp; I want to receive order updates on WhatsApp
      </label>

      <button className="save-btn" onClick={() => onSave(form)}>Save</button>
    </div>
  );
};

export default ProfileForm;
