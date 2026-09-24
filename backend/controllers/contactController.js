const asyncHandler = require("express-async-handler");
const Contact = require("../models/Contact");

// POST
const createContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  const contact = await Contact.create({
    name,
    email,
    message,
  });

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: contact,
  });
});

// GET ALL
const getContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });

  res.json(contacts);
});

// DELETE

const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  await contact.deleteOne();

  res.json({
    success: true,
    message: "Deleted Successfully",
  });
});

module.exports = {
  createContact,
  getContacts,
  deleteContact,
};