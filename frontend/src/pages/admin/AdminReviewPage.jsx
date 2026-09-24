import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "./AdminDashboardPage";
import "../../css/adminReview.css";
// Table.jsx lives at src/components/Table.jsx
import { Table } from "../../components/Table";

import {
  getAllReviews,
  approveReview,
  rejectReview,
  replyReview,
  deleteReview,
} from "../../services/reviewService";

const AdminReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

const loadReviews = async () => {
  try {
    setLoading(true);

    const res = await getAllReviews();


setReviews(res.data.data);
  } catch (err) {
    console.error("ERROR:", err);
    console.error("ERROR RESPONSE:", err.response);
  } finally {
    setLoading(false);
  }
};

  const handleApprove = async (id) => {
    try {
      await approveReview(id);
      loadReviews();
    } catch (err) {
      console.error(err);
      alert("Unable to approve review");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectReview(id);
      loadReviews();
    } catch (err) {
      console.error(err);
      alert("Unable to reject review");
    }
  };

  const handleReply = async (id) => {
    const reply = window.prompt("Enter reply");

    if (!reply) return;

    try {
      await replyReview(id, reply);
      loadReviews();
    } catch (err) {
      console.error(err);
      alert("Unable to send reply");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;

    try {
      await deleteReview(id);
      loadReviews();
    } catch (err) {
      console.error(err);
      alert("Unable to delete review");
    }
  };

  const stars = (rating) => "⭐".repeat(rating);

  // Table.jsx's Cell only receives the row's data, not its index, so the
  // serial number is baked into the row objects up front instead.
  const rows = useMemo(
    () => reviews.map((r, i) => ({ ...r, _serial: i + 1 })),
    [reviews]
  );

  const columns = useMemo(
    () => [
      { Header: '#', accessor: '_serial', disableSortBy: true },
      { Header: 'Customer', accessor: 'customerName' },
      {
        Header: 'Product',
        id: 'product',
        accessor: (r) => r.product?.name || '-'
      },
      {
        Header: 'Rating',
        id: 'rating',
        accessor: (r) => r.rating,
        Cell: ({ row }) => stars(row.original.rating)
      },
      { Header: 'Title', accessor: 'title' },
      {
        Header: 'Review',
        id: 'comment',
        disableSortBy: true,
        Cell: ({ row }) => <span className="arv-comment">{row.original.comment}</span>
      },
      {
        Header: 'Status',
        id: 'status',
        Cell: ({ row }) => (
          <span className={`arv-status arv-status-${row.original.status.toLowerCase()}`}>
            {row.original.status}
          </span>
        )
      },
      {
        Header: 'Reply',
        id: 'reply',
        disableSortBy: true,
        accessor: (r) => r.adminReply || '-'
      },
      {
  Header: "Verified",
  id: "verifiedPurchase",
  Cell: ({ row }) => (
    row.original.verifiedPurchase ? (
      <span className="verified-badge">✔ Yes</span>
    ) : (
      <span className="not-verified-badge">✖ No</span>
    )
  )
},
      {
        Header: 'Date',
        id: 'date',
        accessor: (r) => new Date(r.createdAt).getTime(),
        Cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
      },
      {
        Header: 'Actions',
        id: 'actions',
        disableSortBy: true,
        Cell: ({ row }) => {
          const review = row.original;
          return (
            <div className="arv-actions">
              <button
                className="arv-btn-approve"
                onClick={() => handleApprove(review._id)}
                disabled={review.status === "Approved"}
              >
                Approve
              </button>

              <button
                className="arv-btn-reject"
                onClick={() => handleReject(review._id)}
                disabled={review.status === "Rejected"}
              >
                Reject
              </button>

              <button className="arv-btn-reply" onClick={() => handleReply(review._id)}>
                Reply
              </button>

              <button className="arv-btn-delete" onClick={() => handleDelete(review._id)}>
                Delete
              </button>
            </div>
          );
        }
      }
    ],
    []
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
       <div className="admin-content">

      <div className="admin-review-page">
        <div className="arv-header">
          <h1>Customer Reviews</h1>
        </div>

        {loading ? (
          <h3>Loading...</h3>
        ) : reviews.length === 0 ? (
          <div className="arv-empty">No Reviews Found</div>
        ) : (
          <Table columns={columns} data={rows} show />
        )}
      </div>
</div>
    </div>
  );
};

export default AdminReviewPage;
