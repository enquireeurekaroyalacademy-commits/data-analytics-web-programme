// ✅ Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

<script src="https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js"></script>

// Initialize EmailJS
window.emailjs.init("B6RAC2pe1ODQ1uR37");


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

// ✅ Function to generate a custom ID
async function generateCustomId() {
  const snapshot = await getDocs(collection(db, "payments"));
  const count = snapshot.size + 1;
  return `ch_da_${count.toString().padStart(2, "0")}`;
}

// ✅ Main function to save payment and send email
async function savePayment() {
  const data = getQueryParams();

  if (data.status === "successful") {
    const customId = await generateCustomId();

    // ✅ Save payment data in Firestore
    await addDoc(collection(db, "payments"), {
      ...data,
      custom_id: customId,
      timestamp: new Date().toISOString(),
    });

    // ✅ Show message on page
    document.getElementById("message").innerText = 
      `✅ Thank you, ${data.name || "dear user"}! Your payment was successful. Your ID is ${customId}`;

    // ✅ Send thank-you email via EmailJS
    emailjs.send("service_rascnun", "template_ysdp0h5", {
      name: data.name,
      email: data.email,
      course_id: customId,
      amount: data.amount,
    })
    .then(() => {
      console.log("Email sent successfully!");
    })
    .catch((error) => {
      console.error("Error sending email:", error);
    });

  } else {
    document.getElementById("message").innerText = 
      "❌ Payment not successful. Please try again.";
  }
}

// ✅ Run when page loads
window.addEventListener("DOMContentLoaded", savePayment);
