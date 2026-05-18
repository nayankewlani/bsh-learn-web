import axios from "axios";
import React from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BuyCourse: React.FC = () => {

  const payNow = async (): Promise<void> => {

    const order = await axios.post("http://localhost:8000/api/create-order");

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.data.amount,
      currency: "INR",
      order_id: order.data.id,

      handler: function () {
        alert("Payment successful");
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button onClick={payNow}>
      Buy Course
    </button>
  );
};

export default BuyCourse;