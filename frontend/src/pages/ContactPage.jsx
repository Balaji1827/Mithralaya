// src/pages/ContactPage.jsx
import React from 'react';
import '../css/ContactPage.css';

import { useState } from "react";
import { sendContact } from "../services/contactService";

const ContactPage = () => {

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await sendContact(formData);

            alert(res.message);

            setFormData({
                name: "",
                email: "",
                message: "",
            });
        } catch (err) {
            alert(err.response?.data?.message || "Something went wrong");
        }
    };
    return (
        <div className="contact-page">
            <header className="contact-banner">
                <div className="banner-inner">
                    <div className="banner-text">
                        <h1>Contact Us</h1>
                        <p>We’re here to help you — reach out anytime</p>
                    </div>
                </div>
            </header>
            <div className="contact-content">
                <div className="contact-info">
                    <h2>Get in Touch</h2>

                    <div className="contact-item">
                        <div className="contact-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#0073e6" />
                            </svg>
                        </div>
                        <div>
                            <strong>Address:</strong>
                            <span>
                                No.72, Ground Floor, Varadharaj Flats, Thenuganapathy Nagar, 3rd Cross Street, Madambakkam, Chennai-600126.
                            </span>
                        </div>
                    </div>

                    <div className="contact-item">
                        <div className="contact-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#0073e6" />
                            </svg>
                        </div>
                        <div>
                            <strong>Email:</strong>
                            <a href="mailto:admin@bullrise.in">admin@bullrise.in</a>
                        </div>
                    </div>

                    <div className="contact-item">
                        <div className="contact-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#0073e6" />
                            </svg>
                        </div>
                        <div>
                            <strong>Phone:</strong>
                            <a href="tel:9043902239">9043902239</a>
                        </div>
                    </div>

                    <p className="contact-note">
                        For any queries, complaints, or support — feel free to reach out. We will get back to you as soon as possible.
                    </p>
                </div>

                <div className="contact-form">
                    <h2>Send us a Message</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button type="submit" className="submit-btn">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
