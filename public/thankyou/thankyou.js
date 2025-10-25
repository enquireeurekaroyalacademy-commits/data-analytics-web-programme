// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase config (replace with your real config from Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSyBllGl4m6ezxYddxmqwFsNFpi0gqYw0SqU",
  authDomain: "data-analytics-by-christiana.firebaseapp.com",
  projectId: "data-analytics-by-christiana",
  storageBucket: "data-analytics-by-christiana.firebasestorage.app",
  messagingSenderId: "65003292325",
  appId: "1:65003292325:web:0067c3c041e43dd1382f4c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to extract query params from the URL
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

// Function to generate a custom ID like ch_da_01, ch_da_02, etc.
async function generateCustomId() {
  const snapshot = await getDocs(collection(db, "payments"));
  const count = snapshot.size + 1;
  return `ch_da_${count.toString().padStart(2, "0")}`;
}

// Main function to save payment data
async function savePayment() {
  const data = getQueryParams();

  if (data.status === "successful") {
    const customId = await generateCustomId();

    await addDoc(collection(db, "payments"), {
      ...data,
      custom_id: customId,
      timestamp: new Date().toISOString(),
    });

    document.getElementById("message").innerText = 
      `✅ Thank you, ${data.name || "dear user"}! Your payment was successful. Your ID is ${customId}`;
  } else {
    document.getElementById("message").innerText = 
      "❌ Payment not successful. Please try again.";
  }
}

// Run when page loads
window.addEventListener("DOMContentLoaded", savePayment);
