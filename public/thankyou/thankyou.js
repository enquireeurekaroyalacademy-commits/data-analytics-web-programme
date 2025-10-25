// ✅ Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Initialize EmailJS (make sure the EmailJS script is loaded before this module runs)
if (window.emailjs && typeof window.emailjs.init === "function") {
  window.emailjs.init("B6RAC2pe1ODQ1uR37");
}

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBllGl4m6ezxYddxmqwFsNFpi0gqYw0SqU",
  authDomain: "data-analytics-by-christiana.firebaseapp.com",
  projectId: "data-analytics-by-christiana",
  storageBucket: "data-analytics-by-christiana.firebasestorage.app",
  messagingSenderId: "65003292325",
  appId: "1:65003292325:web:0067c3c041e43dd1382f4c"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Function to extract query params from the URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    tx_ref: params.get("tx_ref"),
    transaction_id: params.get("transaction_id"),
    status: params.get("status"),
    amount: params.get("amount"),
    name: params.get("name"),
    email: params.get("email"),
  };
}

// ✅ Transactional ID generation to avoid race conditions
async function generateCustomId() {
  const counterRef = doc(db, "counters", "paymentsCounter");
  // runTransaction ensures atomic increment
  const generated = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let count = 1;
    if (!counterSnap.exists()) {
      transaction.set(counterRef, { count: 1 });
      count = 1;
    } else {
      const current = counterSnap.data().count || 0;
      count = current + 1;
      transaction.update(counterRef, { count });
    }
    return `ch_da_${count.toString().padStart(2, "0")}`;
  });
  return generated;
}

// ✅ Main function to save payment and send email
async function savePayment() {
  const data = getQueryParams();
  const messageEl = document.getElementById("message");

  // Defensive: ensure message element exists
  const setMessage = (text) => {
    if (messageEl) messageEl.innerText = text;
    else console.warn("No element with id 'message' found to show status.");
  };

  // Normalize and guard status check
  const status = String(data.status || "").toLowerCase();

  if (status.includes("success")) {
    try {
      const customId = await generateCustomId();

      // ✅ Save payment data in Firestore with server timestamp
      await addDoc(collection(db, "payments"), {
        ...data,
        custom_id: customId,
        timestamp: serverTimestamp(), // server-side timestamp
      });

      // ✅ Show message on page
      setMessage(`✅ Thank you, ${data.name || "dear user"}! Your payment was successful. Your ID is ${customId}`);

      // ✅ Send thank-you email via EmailJS (if available)
      if (window.emailjs && typeof window.emailjs.send === "function") {
        emailjs.send("service_rascnun", "template_ysdp0h5", {
          name: data.name || "",
          email: data.email || "",
          course_id: customId,
          amount: data.amount || ""
        })
        .then(() => {
          console.log("Email sent successfully!");
        })
        .catch((error) => {
          console.error("Error sending email:", error);
        });
      } else {
        console.warn("EmailJS not available — make sure the EmailJS SDK script is loaded before this module.");
      }

    } catch (err) {
      console.error("Error saving payment:", err);
      setMessage("❌ There was an error saving your payment. Please contact support.");
    }
  } else {
    setMessage("❌ Payment not successful. Please try again.");
  }
}

// ✅ Run when page loads
window.addEventListener("DOMContentLoaded", savePayment);
