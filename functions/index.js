const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

exports.flutterwaveWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // 1️⃣ Flutterwave sends payment data in the request body
    const event = req.body;

    // 2️⃣ Check if payment was successful
    if (event.status === "successful" && event.data.amount === 10000) {
      const email = event.data.customer.email;

      // 3️⃣ Generate a unique course access ID
      const courseId = "COURSE-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      // 4️⃣ Save to Firestore
      await admin.firestore().collection("payments").doc(event.data.tx_ref).set({
        email,
        amount: event.data.amount,
        courseId,
        paidAt: new Date().toISOString(),
      });

      // 5️⃣ (Optional) Send Email here using SendGrid or Firebase extension

      console.log(`✅ Payment verified for ${email}, courseId: ${courseId}`);
      return res.status(200).send("Webhook received successfully");
    } else {
      console.log("❌ Payment failed or incorrect amount.");
      return res.status(400).send("Invalid payment data");
    }
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return res.status(500).send("Internal Server Error");
  }
});
