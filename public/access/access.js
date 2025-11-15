// access.js - Improved version with full integration
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get DOM elements
const accessForm = document.getElementById("accessForm");
const accessBtn = document.getElementById("accessBtn");
const accessIdInput = document.getElementById("accessId");
const errorEl = document.getElementById("error");
const successEl = document.getElementById("success");
const courseContentEl = document.getElementById("course-content");

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
 * Shows error message with animation
 */
function showError(message) {
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
function showSuccess(message) {
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
function clearMessages() {
  errorEl.classList.remove('show');
  successEl.classList.remove('show');
}

/**
 * Sets button loading state
 */
function setButtonLoading(isLoading) {
  if (isLoading) {
    accessBtn.disabled = true;
    accessBtn.innerHTML = 'Verifying... <span class="spinner"></span>';
  } else {
    accessBtn.disabled = false;
    accessBtn.innerHTML = originalButtonText;
  }
}

/**
 * Hides course content
 */
function hideCourseContent() {
  courseContentEl.classList.remove('show');
  // Wait for animation to complete before hiding
  setTimeout(() => {
    courseContentEl.style.display = 'none';
  }, 300);
}

/**
 * Shows course content with animation
 */
function showCourseContent() {
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
 * Main access verification function
 */
async function verifyAccess(accessId) {
  try {
    // Query Firestore for matching custom_id
    const q = query(
      collection(db, "payments"),
      where("custom_id", "==", accessId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showError("Invalid Course ID. Please check your email and try again.");
      hideCourseContent();
      return false;
    }
    
    // Access granted - get user data
    const userData = snapshot.docs[0].data();
    console.log("Access granted for:", userData.email);
    
    // Show success message
    showSuccess("Access granted! Loading your course...");
    
    // Show course content after brief delay
    setTimeout(() => {
      showCourseContent();
    }, 1000);
    
    return true;
    
  } catch (err) {
    console.error("Access verification error:", err);
    
    // Provide user-friendly error messages based on error type
    if (err.code === 'permission-denied') {
      showError("Database access denied. Please contact support.");
    } else if (err.code === 'unavailable') {
      showError("Service temporarily unavailable. Please try again in a moment.");
    } else {
      showError("Something went wrong. Please try again or contact support.");
    }
    
    hideCourseContent();
    return false;
  }
}

/**
 * Form submission handler
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Get and clean input
  const accessId = accessIdInput.value.trim().toLowerCase();
  
  // Clear previous messages
  clearMessages();
  
  // Validate input exists
  if (!accessId) {
    showError("Please enter your Course ID.");
    accessIdInput.focus();
    return;
  }
  
  // Validate format
  if (!isValidCourseIdFormat(accessId)) {
    showError("Invalid format. Course ID should look like: ch_da_07");
    accessIdInput.focus();
    return;
  }
  
  // Set loading state
  setButtonLoading(true);
  
  // Verify access
  const isValid = await verifyAccess(accessId);
  
  // Reset button state
  setButtonLoading(false);
  
  // Clear input if access was granted
  if (isValid) {
    accessIdInput.value = '';
  }
}

/**
 * Input field real-time validation
 */
function handleInputChange() {
  const value = accessIdInput.value.trim();
  
  // Clear error message as user types
  if (value.length > 0) {
    errorEl.classList.remove('show');
  }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Form submission
  accessForm.addEventListener("submit", handleFormSubmit);
  
  // Input field changes
  accessIdInput.addEventListener("input", handleInputChange);
  
  // Format input to lowercase as user types
  accessIdInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.toLowerCase();
  });
  
  // Clear messages when input gains focus
  accessIdInput.addEventListener("focus", () => {
    clearMessages();
  });
  
  // Handle Enter key in input field
  accessIdInput.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      accessForm.dispatchEvent(new Event('submit'));
    }
  });
}

/**
 * Check if user is already accessing course (from URL parameter)
 * Useful if you want to share direct links
 */
function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  
  if (courseId) {
    accessIdInput.value = courseId;
    // Auto-verify after short delay
    setTimeout(() => {
      accessForm.dispatchEvent(new Event('submit'));
    }, 500);
  }
}

/**
 * Initialize the application
 */
function init() {
  console.log("Course Access System initialized");
  
  // Set up event listeners
  initializeEventListeners();
  
  // Check URL parameters
  checkUrlParameters();
  
  // Focus input field on page load
  accessIdInput.focus();
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export functions for testing (optional)
export { verifyAccess, isValidCourseIdFormat };
