import api from "./api";

export const sendContact = async (data) => {
  const response = await api.post("/contact", data);
  return response.data;
};

export const getContacts = async () => {
  const response = await api.get("/contact");
  return response.data;
};

export const updateContactStatus = async (id, status) => {
  const response = await api.put(`/contact/${id}/status`, {
    status,
  });

  return response.data;
};

export const deleteContact = async (id) => {
  const response = await api.delete(`/contact/${id}`);
  return response.data;
};