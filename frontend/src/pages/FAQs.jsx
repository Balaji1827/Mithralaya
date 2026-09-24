import React, { useState } from "react";
import "../css/FAQs.css";
import {
  FaShoppingBag,
  FaTruck,
  FaUndoAlt,
  FaTshirt,
  FaCreditCard,
  FaHeadset,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const faqData = [
  {
    title: "Orders",
    icon: <FaShoppingBag />,
    questions: [
      {
        q: "How do I place an order?",
        a: "Simply browse our collection, select your size and color, add the item to your cart, and proceed to checkout.",
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "Orders can be cancelled or modified before they are shipped. Once dispatched, orders cannot be cancelled and must follow our standard return process. Contact us at admin@bullrise.in as soon as possible.",
      },
      {
        q: "How do I know if my order was placed successfully?",
        a: "You'll receive a WhatsApp message on your registered mobile number once your order is successfully placed.",
      },
      {
        q: "What if I don't receive a confirmation message?",
        a: "Please check your registered mobile number and WhatsApp notifications. If you still haven't received it, contact us at admin@bullrise.in or 9043902239.",
      },
    ],
  },
  {
    title: "Shipping & Delivery",
    icon: <FaTruck />,
    questions: [
      {
        q: "How long does delivery take?",
        a: "Delivery timelines vary depending on your location. Tracking details will be shared once your order is shipped.",
      },
      {
        q: "Do you offer international shipping?",
        a: "Currently, Bullrise ships only within India (Pan India).",
      },
      {
        q: "How can I track my order?",
        a: "You'll receive a tracking link via WhatsApp once your order has been shipped.",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    icon: <FaUndoAlt />,
    questions: [
      {
        q: "What is your return policy?",
        a: "Returns are accepted within 7 days of delivery if the item is unused, unworn, and has original tags and packaging.",
      },
      {
        q: "How long do refunds take?",
        a: "Approved refunds are processed within 7–10 business days.",
      },
      {
        q: "What if I received a damaged item?",
        a: "Contact us within 48 hours at admin@bullrise.in with product photos for a replacement, exchange, or refund.",
      },
      {
        q: "Can I exchange an item?",
        a: "Yes. Exchanges are available for another size or color subject to stock availability.",
      },
    ],
  },
  {
    title: "Sizing & Products",
    icon: <FaTshirt />,
    questions: [
      {
        q: "How do I choose the right size?",
        a: "Please refer to the Size Guide available on every product page.",
      },
      {
        q: "Will the product color match the website?",
        a: "We strive to display accurate colors, but slight variations may occur due to monitor settings and lighting.",
      },
    ],
  },
  {
    title: "Payments",
    icon: <FaCreditCard />,
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI (GPay, PhonePe, Paytm), Debit/Credit Cards and Net Banking.",
      },
      {
        q: "Is it safe to use my card?",
        a: "Yes. All payments are processed through secure encrypted payment gateways.",
      },
      {
        q: "Do you offer Cash on Delivery (COD)?",
        a: "No. Currently all orders must be prepaid.",
      },
    ],
  },
  {
    title: "Account & Support",
    icon: <FaHeadset />,
    questions: [
      {
        q: "Do I need an account?",
        a: "Yes. You'll need to create an account before placing an order.",
      },
      {
        q: "How do I contact support?",
        a: "Email: admin@bullrise.in | Phone: 9043902239",
      },
      {
        q: "Customer support timings?",
        a: "Monday to Saturday : 9:30 AM - 6:00 PM",
      },
    ],
  },
];

const FAQs = () => {
  const [open, setOpen] = useState(null);

  return (
    <div className="faq-page">

      <div className="faq-hero">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p>
            Find answers to the most commonly asked questions about Bullrise
            orders, shipping, returns, payments and more.
          </p>

          <span>Last Updated : 14 July 2026</span>
        </div>
      </div>

      <div className="container">

        {faqData.map((section, sectionIndex) => (
          <div className="faq-section" key={sectionIndex}>

            <h2>
              {section.icon}
              {section.title}
            </h2>

            {section.questions.map((item, index) => {
              const id = `${sectionIndex}-${index}`;

              return (
                <div className="faq-card" key={id}>

                  <button
                    className="faq-question"
                    onClick={() =>
                      setOpen(open === id ? null : id)
                    }
                  >
                    {item.q}

                    {open === id ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </button>

                  {open === id && (
                    <div className="faq-answer">
                      {item.a}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ))}

      </div>
    </div>
  );
};

export default FAQs;