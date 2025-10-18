const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

// HTTP Cloud Function to receive Flutterwave webhook events
exports.flutterwaveWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const signature = req.headers["verif-hash"]; // optional verification header
    const expectedSig = functions.config().flutterwave?.secret || null;
    if (expectedSig && signature !== expectedSig) {
      console.warn("Invalid webhook signature");
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    // Flutterwave may send different structures; handle common ones safely
    const tx_ref = event?.data?.tx_ref || event?.tx_ref || event?.data?.reference;
    const amount = Number(event?.data?.amount || event?.amount || 0);
    const status = event?.status || event?.event || event?.data?.status;
    const email = event?.data?.customer?.email || event?.customer?.email || event?.data?.customer_email;

    if (status === "successful" || status === "charge.completed") {
      if (amount !== 10000) {
        console.log("Amount mismatch:", amount);
        // store attempted payment for records (optional)
        await admin.firestore().collection("payments_attempts").doc(tx_ref || Date.now().toString()).set({
          email: email || null,
          amount,
          raw: event,
          receivedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.status(400).send("Incorrect amount");
      }

      // generate Course ID
      const courseId = "COURSE-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Save to Firestore
      await admin.firestore().collection("payments").doc(tx_ref).set({
        email,
        amount,
        courseId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        raw: event
      }, { merge: true });

      console.log(`Payment saved: ${email} → ${courseId}`);
      return res.status(200).send("ok");
    }

    // not a success event — respond 200 so flutterwave won't retry repeatedly
    return res.status(200).send("ignored");
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("internal error");
  }
});
