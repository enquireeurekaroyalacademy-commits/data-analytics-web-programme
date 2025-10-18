const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const event = req.body;

    const tx_ref = event?.data?.tx_ref || event?.tx_ref;
    const amount = Number(event?.data?.amount || event?.amount || 0);
    const status = event?.status || event?.event || event?.data?.status;
    const email = event?.data?.customer?.email || event?.customer?.email;

    if (status === "successful" || status === "charge.completed") {
      if (amount !== 10000) {
        await db.collection("payments_attempts").doc(tx_ref || Date.now().toString()).set({
          email: email || null,
          amount,
          raw: event,
          receivedAt: new Date().toISOString(),
        });
        return res.status(400).send("Incorrect amount");
      }

      const courseId = "COURSE-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      await db.collection("payments").doc(tx_ref).set({
        email,
        amount,
        courseId,
        paidAt: new Date().toISOString(),
        raw: event
      });

      console.log(`✅ Payment saved for ${email}`);
      return res.status(200).send("ok");
    }

    return res.status(200).send("ignored");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
