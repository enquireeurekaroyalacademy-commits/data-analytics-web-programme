// ==================== FIREBASE & EMAILJS IMPORTS ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ==================== CONFIGURATION ====================

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBllGl4m6ezxYddxmqwFsNFpi0gqYw0SqU",
  authDomain: "data-analytics-by-christiana.firebaseapp.com",
  projectId: "data-analytics-by-christiana",
  storageBucket: "data-analytics-by-christiana.firebasestorage.app",
  messagingSenderId: "65003292325",
  appId: "1:65003292325:web:0067c3c041e43dd1382f4c"
};

// Student Email Configuration (Your existing EmailJS account)
const STUDENT_EMAILJS_SERVICE = 'service_rascnun';
const STUDENT_EMAILJS_TEMPLATE = 'template_ysdp0h5';
const STUDENT_EMAILJS_PUBLIC_KEY = 'B6RAC2pe1ODQ1uR37';

// Referrer Email Configuration (Your NEW EmailJS account)
const REFERRER_EMAILJS_SERVICE = 'service_31owzoe';
const REFERRER_EMAILJS_TEMPLATE = 'template_dgyhzsu';
const REFERRER_EMAILJS_PUBLIC_KEY = 'nbEhnQS3ZDZUHRO40';

// Bank Details Form Link
const BANK_DETAILS_LINK = 'https://forms.gle/ukvpbZSEyb7Lax1P8';

// ==================== INITIALIZE FIREBASE ====================
console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log('✅ Firebase initialized successfully');

// ==================== UTILITY FUNCTIONS ====================

/**
 * Extract URL query parameters
 */
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

/**
 * Update page message
 */
function setMessage(text, isError = false) {
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.innerText = text;
    messageEl.style.color = isError ? '#ef4444' : '#10b981';
  } else {
    console.warn("No element with id 'message' found");
  }
  console.log(isError ? '❌' : '✅', text);
}

/**
 * Format current date
 */
function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// ==================== COURSE ID GENERATION ====================

/**
 * Generate unique course ID using Firebase transaction
 * Format: ch_da_01, ch_da_02, etc.
 */
async function generateCustomId() {
  try {
    console.log('🔢 Generating course ID...');
    
    const counterRef = doc(db, "counters", "paymentsCounter");
    
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
    
    console.log('✅ Course ID generated:', generated);
    return generated;
    
  } catch (error) {
    console.error('❌ Error generating course ID:', error);
    throw error;
  }
}

// ==================== EMAIL FUNCTIONS ====================

/**
 * Send email to student with course ID
 */
async function sendStudentEmail(name, email, courseId, amount) {
  try {
    console.log('📧 Sending email to student:', email);
    
    if (!window.emailjs || typeof window.emailjs.send !== "function") {
      throw new Error('EmailJS not available');
    }
    
    // Re-initialize with STUDENT credentials
    console.log('🔧 Initializing EmailJS with STUDENT account');
    window.emailjs.init(STUDENT_EMAILJS_PUBLIC_KEY);
    
    const templateParams = {
      name: name || "Student",
      email: email || "",
      course_id: courseId,
      amount: amount || "11,500"
    };
    
    console.log('📤 Sending with template:', STUDENT_EMAILJS_TEMPLATE);
    
    await window.emailjs.send(
      STUDENT_EMAILJS_SERVICE,
      STUDENT_EMAILJS_TEMPLATE,
      templateParams
    );
    
    console.log('✅ Student email sent successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error sending student email:', error);
    console.error('Error details:', error.text || error.message || error);
    return false;
  }
}

/**
 * Send email to referrer notifying them of commission
 * CRITICAL: Must use correct template ID and recipient email
 */
async function sendReferrerEmail(referrerName, referrerEmail, studentName, studentEmail, amount) {
  try {
    console.log('📧 Attempting to send referrer email...');
    console.log('   Referrer Name:', referrerName);
    console.log('   Referrer Email:', referrerEmail);
    console.log('   Student Name:', studentName);
    console.log('   Student Email:', studentEmail);
    
    if (!window.emailjs || typeof window.emailjs.send !== "function") {
      throw new Error('EmailJS not available');
    }
    
    // Re-initialize with REFERRER credentials
    console.log('🔧 Initializing EmailJS with REFERRER account');
    console.log('   Service ID:', REFERRER_EMAILJS_SERVICE);
    console.log('   Template ID:', REFERRER_EMAILJS_TEMPLATE);
    console.log('   Public Key:', REFERRER_EMAILJS_PUBLIC_KEY);
    
    window.emailjs.init(REFERRER_EMAILJS_PUBLIC_KEY);
    
    const templateParams = {
      to_email: referrerEmail,  // ← CRITICAL: Explicitly set recipient
      referrer_name: referrerName,
      student_name: studentName,
      student_email: studentEmail,
      amount: amount || "11,500",
      payment_date: formatDate(),
      bank_details_link: BANK_DETAILS_LINK
    };
    
    console.log('📤 Template parameters:', JSON.stringify(templateParams, null, 2));
    
    // Send email
    const response = await window.emailjs.send(
      REFERRER_EMAILJS_SERVICE,
      REFERRER_EMAILJS_TEMPLATE,
      templateParams
    );
    
    console.log('✅ Referrer email sent successfully!');
    console.log('   Response:', response);
    return true;
    
  } catch (error) {
    console.error('❌ REFERRER EMAIL FAILED!');
    console.error('   Error:', error);
    console.error('   Error text:', error.text);
    console.error('   Error message:', error.message);
    console.error('   Full error object:', JSON.stringify(error, null, 2));
    return false;
  }
}

// ==================== FIRESTORE SAVE FUNCTION ====================

/**
 * Save payment data to Firestore
 */
async function savePaymentToFirestore(paymentData) {
  try {
    console.log('💾 Saving payment to Firestore...');
    
    await addDoc(collection(db, "payments"), paymentData);
    
    console.log('✅ Payment saved to Firestore successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error saving to Firestore:', error);
    throw error;
  }
}

// ==================== MAIN PAYMENT PROCESSING ====================

/**
 * Main function to process successful payment
 */
async function savePayment() {
  try {
    console.log('🚀 Starting payment processing...');
    
    // Get payment data from URL
    const data = getQueryParams();
    console.log('📊 Payment data from URL:', data);
    
    // Get referrer data from sessionStorage
    const referrerName = sessionStorage.getItem('referrer_name');
    const referrerEmail = sessionStorage.getItem('referrer_email');
    
    if (referrerName && referrerEmail) {
      console.log('👥 Referrer found:', referrerName, referrerEmail);
    } else {
      console.log('👤 No referrer - direct enrollment');
    }
    
    // Validate payment status
    const status = String(data.status || "").toLowerCase();
    
    if (!status.includes("success")) {
      console.warn('⚠️ Payment not successful, status:', status);
      setMessage("❌ Payment not successful. Please try again or contact support.", true);
      return;
    }
    
    // Show processing message
    setMessage("⏳ Processing your payment... Please wait.");
    
    // Generate course ID
    const customId = await generateCustomId();
    
    // Prepare payment data for Firestore
    const paymentData = {
      status: data.status,
      amount: data.amount,
      name: data.name,
      email: data.email,
      tx_ref: data.tx_ref,
      transaction_id: data.transaction_id,
      custom_id: customId,
      timestamp: serverTimestamp()
    };
    
    // Add referrer data if exists
    if (referrerName && referrerEmail) {
      paymentData.referrer_name = referrerName;
      paymentData.referrer_email = referrerEmail;
      paymentData.commission_owed = 1000;
      paymentData.commission_paid = false;
      console.log('✅ Referrer data added to payment record');
    }
    
    // Save to Firestore
    await savePaymentToFirestore(paymentData);
    
    // Update success message
    setMessage(`✅ Thank you, ${data.name || "dear user"}! Your payment was successful. Your Course ID is ${customId}`);
    
    // Send email to student
    const studentEmailSent = await sendStudentEmail(
      data.name,
      data.email,
      customId,
      data.amount
    );
    
    if (studentEmailSent) {
      console.log('✅ Student email sent');
    } else {
      console.warn('⚠️ Student email failed - but payment was successful');
    }
    
    // Send email to referrer
    if (referrerName && referrerEmail) {
      console.log('🔄 Preparing to send referrer email...');
      
      // Add a small delay to ensure EmailJS has reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const referrerEmailSent = await sendReferrerEmail(
        referrerName,
        referrerEmail,
        data.name,
        data.email,
        data.amount
      );
      
      if (referrerEmailSent) {
        console.log('✅ Referrer email sent successfully');
      } else {
        console.warn('⚠️ Referrer email failed - commission is still recorded in database');
      }
    }
    
    // Clear sessionStorage
    sessionStorage.removeItem('referrer_name');
    sessionStorage.removeItem('referrer_email');
    console.log('🧹 SessionStorage cleared');
    
    console.log('🎉 Payment processing completed!');
    
  } catch (error) {
    console.error('❌ Fatal error in payment processing:', error);
    setMessage(
      "❌ There was an error processing your payment. Your payment was received, but please contact support with your transaction details.",
      true
    );
  }
}

// ==================== INITIALIZE ON PAGE LOAD ====================

console.log('📄 Thank you page script loaded');
console.log('🔧 Configuration check:');
console.log('  - Student EmailJS Service:', STUDENT_EMAILJS_SERVICE);
console.log('  - Student EmailJS Template:', STUDENT_EMAILJS_TEMPLATE);
console.log('  - Referrer EmailJS Service:', REFERRER_EMAILJS_SERVICE);
console.log('  - Referrer EmailJS Template:', REFERRER_EMAILJS_TEMPLATE);
console.log('  - Bank Details Link:', BANK_DETAILS_LINK);

// Run payment processing when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  console.log('🏁 DOM loaded - starting payment processing');
  savePayment();
});
