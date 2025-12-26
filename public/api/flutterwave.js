export default async function handler(req, res) {
  try {
    // 🛑 1️⃣ Allow only POST requests
    if (req.method !== "POST") {
      console.warn("Rejected non-POST request");
      return res.status(405).json({ message: "Method not allowed" });
    }

    // 🧠 2️⃣ Verify Flutterwave signature for security
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = req.headers["verif-hash"];
    if (!signature || signature !== secretHash) {
      console.warn("❌ Invalid Flutterwave signature or missing header");
      return res.status(401).json({ message: "Invalid signature" });
    }

    // 🧩 3️⃣ Parse and normalize webhook data safely
    const event = req.body || {};
    const data = event.data || {};

    const tx_ref =
      data.tx_ref || event.tx_ref || data.reference || "UNKNOWN_REF";
    const status =
      data.status || event.status || event.event || "unknown_status";
    const amount =
      Number(data.amount || event.amount || 0);
    const email =
      data.customer?.email ||
      event.customer?.email ||
      data.customer_email ||
      "unknown_email";
    const name =
      data.customer?.name ||
      event.customer?.name ||
      "unknown_name";
    const currency = data.currency || "NGN";

    // 🔒 4️⃣ Basic sanity checks
    if (!tx_ref || !email) {
      console.warn("Missing critical fields", { tx_ref, email });
      return res.status(400).json({ message: "Missing critical fields" });
    }

    // 💰 5️⃣ Only handle successful ₦10,000 payments
    if (
      (status === "successful" || status === "charge.completed") &&
      amount === 10500 &&
      currency === "NGN"
    ) {
      console.log(
        `✅ Verified payment for ${email}\n` +
        `→ Amount: ₦${amount}\n` +
        `→ Ref: ${tx_ref}\n` +
        `→ Status: ${status}\n` +
        `→ Name: ${name}`
      );

      // 🧾 Optional: Here you can save to database or send confirmation email

      return res.status(200).json({ message: "Payment verified" });
    } else {
      console.log("⚠️ Ignored event — not successful ₦10,000 NGN payment", {
        status,
        amount,
        currency,
      });
    }

    // ✅ 6️⃣ Always respond 200 so Flutterwave doesn’t retry repeatedly
    return res.status(200).json({ received: true });
  } catch (err) {
    // 🚨 7️⃣ Catch unexpected errors
    console.error("💥 Webhook handler error:", err);
    return res.status(500).json({ message: "Internal error" });
  }
}
