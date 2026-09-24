import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "./AdminDashboardPage";
import api from "../../services/api";
import "../../css/AdminContactUs.css";
import { Table } from "../../components/Table";
import {
  getContacts,
  deleteContact,
  updateContactStatus,
} from "../../services/contactService";

const AdminContactUs = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [activeContact, setActiveContact] = useState(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);

      const response = await api.get("/contact");

     

      // response.data is already an array
      setContacts(response.data);
      setFilteredContacts(response.data);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const value = search.toLowerCase();

    const filtered = contacts.filter(
      (item) =>
        item.name?.toLowerCase().includes(value) ||
        item.email?.toLowerCase().includes(value) ||
        item.message?.toLowerCase().includes(value)
    );

    setFilteredContacts(filtered);
  };

  const updateStatus = async (id, status) => {
    try {
      await updateContactStatus(id, status);
      fetchContacts();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      await deleteContact(id);
      fetchContacts();
    } catch (err) {
      console.log(err);
    }
  };

  const formatDateShort = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const rows = useMemo(
    () =>
      filteredContacts.map((item, index) => ({
        ...item,
        _serial: index + 1,
      })),
    [filteredContacts]
  );




  const columns = useMemo(
    () => [
      {
        Header: "#",
        id: "slno",
        Cell: ({ row }) => row.index + 1,
      },

      {
        Header: "Customer",
        id: "customer",
        accessor: (c) => c.name,
        Cell: ({ row }) => {
          const c = row.original;

          return (
            <div className="aop-customer-cell">
              <span className="aop-customer-name">{c.name}</span>
              <span className="aop-customer-sub">{c.email}</span>
            </div>
          );
        },
      },

      {
        Header: "Message",
        id: "message",
        accessor: (c) => c.message,
        Cell: ({ row }) => {
          const c = row.original;

          return (
            <div
              style={{
                maxWidth: "450px",
                whiteSpace: "normal",
                lineHeight: "22px",
              }}
            >
              {c.message}
            </div>
          );
        },
      },

      {
        Header: "Status",
        id: "status",
        accessor: (c) => c.status,
        Cell: ({ row }) => {
          const c = row.original;

          return (
            <select
              className={`aop-select aop-pill-select ${c.status === "New"
                  ? "aop-pill-coral"
                  : "aop-pill-green"
                }`}
              value={c.status}
              onChange={(e) =>
                updateStatus(c._id, e.target.value)
              }
            >
              <option value="New">New</option>
              <option value="Read">Read</option>
            </select>
          );
        },
      },

      {
        Header: "Received On",
        id: "createdAt",
        accessor: (c) => c.createdAt,
        Cell: ({ row }) => (
          <div className="aop-total-cell">
            <span className="aop-total-sub">
              {formatDateShort(row.original.createdAt)}
            </span>
          </div>
        ),
      },

      {
        Header: "",
        id: "actions",
        disableSortBy: true,
        Cell: ({ row }) => {
          const c = row.original;

          return (
            <div className="aop-actions-cell">
              <button
                className="aop-view-btn"
                onClick={() => {
                
                  setActiveContact(row.original);
                }}
              >
                View
              </button>

              <button
                className="aop-delete-btn"
                onClick={() => handleDelete(c._id)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          );
        },
      },
    ],
    []
  );
  return (
    <>
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">

          <div className="admin-contact-page">

            <div className="contact-header">

              <h2>Contact Messages</h2>

              <form onSubmit={handleSearch}>

                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <button type="submit">
                  Search
                </button>

              </form>

            </div>

            {loading ? (
              <h3>Loading...</h3>
            ) : (
              <Table
                columns={columns}
                data={rows}
                show
              />
            )}

          </div>
        </div>

      </div>
      {activeContact && (
        <div className="contact-modal">
          <div className="contact-modal-box">
            <h3>{activeContact.name}</h3>

            <p>
              <strong>Email:</strong> {activeContact.email}
            </p>

            <p>
              <strong>Status:</strong> {activeContact.status}
            </p>

            <p>
              <strong>Message:</strong>
            </p>

            <p>{activeContact.message}</p>

            <button onClick={() => setActiveContact(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );

}

export default AdminContactUs
