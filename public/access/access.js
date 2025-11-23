// access.js - Secure Version with Email + Course ID Verification
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBllGl4m6ezxYddxmqwFsNFpi0gqYw0SqU",
  authDomain: "data-analytics-by-christiana.firebaseapp.com",
  projectId: "data-analytics-by-christiana",
  storageBucket: "data-analytics-by-christiana.firebasestorage.app",
  messagingSenderId: "65003292325",
  appId: "1:65003292325:web:0067c3c041e43dd1382f4c"
};

// Initialize Firebase
console.log("🔥 Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase initialized successfully");

// Store original button text
const originalButtonText = "Access Course";

/**
 * Validates Course ID format
 * Expected format: ch_da_XX (where XX is 2 digits)
 */
function isValidCourseIdFormat(id) {
  const regex = /^ch_da_\d{2}$/;
  return regex.test(id);
}

/**
 * Validates Email format
 */
function isValidEmailFormat(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Shows error message with animation
 */
function showError(message, errorEl, successEl) {
  console.log("❌ Error:", message);
  errorEl.textContent = `⚠️ ${message}`;
  errorEl.classList.add('show');
  successEl.classList.remove('show');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorEl.classList.remove('show');
  }, 5000);
}

/**
 * Shows success message with animation
 */
function showSuccess(message, successEl, errorEl) {
  console.log("✅ Success:", message);
  successEl.textContent = `✓ ${message}`;
  successEl.classList.add('show');
  errorEl.classList.remove('show');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    successEl.classList.remove('show');
  }, 3000);
}

/**
 * Clears all messages
 */
function clearMessages(errorEl, successEl) {
  errorEl.classList.remove('show');
  successEl.classList.remove('show');
}

/**
 * Sets button loading state
 */
function setButtonLoading(isLoading, accessBtn) {
  if (isLoading) {
    accessBtn.disabled = true;
    accessBtn.innerHTML = 'Verifying... <span class="spinner"></span>';
    console.log("🔄 Button state: Loading");
  } else {
    accessBtn.disabled = false;
    accessBtn.innerHTML = originalButtonText;
    console.log("🔄 Button state: Ready");
  }
}

/**
 * Hides course content
 */
function hideCourseContent(courseContentEl) {
  courseContentEl.classList.remove('show');
  // Wait for animation to complete before hiding
  setTimeout(() => {
    courseContentEl.style.display = 'none';
  }, 300);
}

/**
 * Shows course content with animation
 */
function showCourseContent(courseContentEl) {
  courseContentEl.style.display = 'block';
  // Trigger animation after display is set
  setTimeout(() => {
    courseContentEl.classList.add('show');
  }, 10);
  
  // Smooth scroll to course content
  setTimeout(() => {
    courseContentEl.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
}

/**
 * Main access verification function - Now checks BOTH email AND course ID
 */
async function verifyAccess(email, accessId, errorEl, successEl, courseContentEl) {
  console.log("🔍 Starting verification for:");
  console.log("   Email:", email);
  console.log("   Course ID:", accessId);
  
  try {
    // Query Firestore for matching BOTH email AND custom_id
    console.log("📡 Querying Firestore database...");
    const q = query(
      collection(db, "payments"),
      where("email", "==", email),
      where("custom_id", "==", accessId)
    );
    
    const snapshot = await getDocs(q);
    
    console.log("📊 Query completed. Documents found:", snapshot.size);
    
    if (snapshot.empty) {
      console.log("⚠️ No matching record found - email and course ID don't match");
      showError("Invalid credentials. Please check if the email you entered is the one you used to make your payment.", errorEl, successEl);
      hideCourseContent(courseContentEl);
      return false;
    }
    
    // Access granted - get user data
    const userData = snapshot.docs[0].data();
    console.log("🎉 Access granted for user:", userData.email);
    console.log("📄 User data:", {
      email: userData.email,
      name: userData.name || 'N/A',
      custom_id: userData.custom_id
    });
    
    // Show success message
    showSuccess("Access granted! Loading your course...", successEl, errorEl);
    
    // Show course content after brief delay
    setTimeout(() => {
      showCourseContent(courseContentEl);
    }, 1000);
    
    return true;
    
  } catch (err) {
    console.error("💥 Access verification error:", err);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    
    // Provide user-friendly error messages based on error type
    if (err.code === 'permission-denied') {
      showError("Database access denied. Please contact support.", errorEl, successEl);
    } else if (err.code === 'unavailable') {
      showError("Service temporarily unavailable. Please try again in a moment.", errorEl, successEl);
    } else if (err.code === 'failed-precondition') {
      showError("Database configuration issue. Please contact support.", errorEl, successEl);
    } else if (err.message && err.message.includes('index')) {
      showError("Database index not ready. Please try again in a moment.", errorEl, successEl);
    } else {
      showError("Something went wrong. Please try again or contact support.", errorEl, successEl);
    }
    
    hideCourseContent(courseContentEl);
    return false;
  }
}

/**
 * Form submission handler - Now handles both email and course ID
 */
async function handleFormSubmit(e, accessEmailInput, accessIdInput, accessBtn, errorEl, successEl, courseContentEl) {
  e.preventDefault();
  console.log("📝 Form submitted");
  
  // Get and clean inputs
  const email = accessEmailInput.value.trim().toLowerCase();
  const accessId = accessIdInput.value.trim().toLowerCase();
  
  console.log("📧 Email entered:", email);
  console.log("🔑 Course ID entered:", accessId);
  
  // Clear previous messages
  clearMessages(errorEl, successEl);
  
  // Validate email exists
  if (!email) {
    console.log("⚠️ Validation failed: Empty email");
    showError("Please enter your email address.", errorEl, successEl);
    accessEmailInput.focus();
    return;
  }
  
  // Validate email format
  if (!isValidEmailFormat(email)) {
    console.log("⚠️ Validation failed: Invalid email format");
    showError("Please enter a valid email address.", errorEl, successEl);
    accessEmailInput.focus();
    return;
  }
  
  // Validate course ID exists
  if (!accessId) {
    console.log("⚠️ Validation failed: Empty course ID");
    showError("Please enter your Course ID.", errorEl, successEl);
    accessIdInput.focus();
    return;
  }
  
  // Validate course ID format
  if (!isValidCourseIdFormat(accessId)) {
    console.log("⚠️ Validation failed: Invalid course ID format");
    showError("Invalid Course ID format. Please check if the email you entered is the one you used to make your payment.", errorEl, successEl);
    accessIdInput.focus();
    return;
  }
  
  console.log("✅ Validation passed for both email and course ID");
  
  // Set loading state
  setButtonLoading(true, accessBtn);
  
  try {
    // Verify access with both email and course ID
    const isValid = await verifyAccess(email, accessId, errorEl, successEl, courseContentEl);
    
    // Clear inputs if access was granted
    if (isValid) {
      accessEmailInput.value = '';
      accessIdInput.value = '';
      console.log("🎊 Access verification complete - Success!");
    } else {
      console.log("❌ Access verification complete - Failed");
    }
  } catch (error) {
    console.error("💥 Unexpected error in form submission:", error);
    showError("An unexpected error occurred. Please try again.", errorEl, successEl);
  } finally {
    // Always reset button state
    setButtonLoading(false, accessBtn);
    console.log("🔄 Form processing complete");
  }
}

/**
 * Initialize the application
 */
function init() {
  console.log("🚀 Course Access System initializing...");
  console.log("🔒 Security: Email + Course ID verification enabled");
  console.log("📅 Current time:", new Date().toLocaleString());
  
  // Get DOM elements - WAIT for them to exist
  const accessForm = document.getElementById("accessForm");
  const accessBtn = document.getElementById("accessBtn");
  const accessEmailInput = document.getElementById("accessEmail");
  const accessIdInput = document.getElementById("accessId");
  const errorEl = document.getElementById("error");
  const successEl = document.getElementById("success");
  const courseContentEl = document.getElementById("course-content");
  
  // Verify all elements exist
  const elementsCheck = {
    accessForm: !!accessForm,
    accessBtn: !!accessBtn,
    accessEmailInput: !!accessEmailInput,
    accessIdInput: !!accessIdInput,
    errorEl: !!errorEl,
    successEl: !!successEl,
    courseContentEl: !!courseContentEl
  };
  
  console.log("🔍 DOM Elements check:", elementsCheck);
  
  if (!accessForm || !accessBtn || !accessEmailInput || !accessIdInput || !errorEl || !successEl || !courseContentEl) {
    console.error("❌ ERROR: Required DOM elements not found!");
    console.error("Missing elements:", 
      Object.entries(elementsCheck)
        .filter(([key, value]) => !value)
        .map(([key]) => key)
    );
    return;
  }
  
  console.log("✅ All DOM elements found successfully");
  
  // Form submission event listener
  accessForm.addEventListener("submit", (e) => {
    console.log("📨 Submit event triggered");
    handleFormSubmit(e, accessEmailInput, accessIdInput, accessBtn, errorEl, successEl, courseContentEl);
  });
  console.log("✅ Form submit listener attached");
  
  // Email input changes - clear error message as user types
  accessEmailInput.addEventListener("input", (e) => {
    // Format to lowercase
    e.target.value = e.target.value.toLowerCase();
    
    // Clear messages if user is typing
    if (e.target.value.trim().length > 0) {
      errorEl.classList.remove('show');
    }
  });
  console.log("✅ Email input change listener attached");
  
  // Course ID input changes - clear error message as user types
  accessIdInput.addEventListener("input", (e) => {
    // Format to lowercase
    e.target.value = e.target.value.toLowerCase();
    
    // Clear messages if user is typing
    if (e.target.value.trim().length > 0) {
      errorEl.classList.remove('show');
    }
  });
  console.log("✅ Course ID input change listener attached");
  
  // Clear messages when inputs gain focus
  accessEmailInput.addEventListener("focus", () => {
    clearMessages(errorEl, successEl);
  });
  
  accessIdInput.addEventListener("focus", () => {
    clearMessages(errorEl, successEl);
  });
  console.log("✅ Input focus listeners attached");
  
  // Check URL parameters for direct access (now supports both email and id)
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  const email = urlParams.get('email');
  
  if (courseId && email) {
    console.log("🔗 Email and Course ID found in URL");
    console.log("   Email:", email);
    console.log("   Course ID:", courseId);
    accessEmailInput.value = email;
    accessIdInput.value = courseId;
    // Auto-verify after short delay
    setTimeout(() => {
      console.log("⏱️ Auto-submitting form from URL parameters");
      accessForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, 500);
  } else if (courseId || email) {
    console.log("⚠️ Incomplete URL parameters - need both email and course ID");
  }
  
  // Focus email input field on page load
  accessEmailInput.focus();
  console.log("✅ Email input field focused");
  
  console.log("🎉 Course Access System initialization complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  console.log("⏳ Waiting for DOM to load...");
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log("✅ DOM already loaded");
  init();
}

// Export functions for testing (optional)
export { verifyAccess, isValidCourseIdFormat, isValidEmailFormat };
