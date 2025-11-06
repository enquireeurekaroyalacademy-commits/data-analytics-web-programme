export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const signature = req.headers["verif-hash"];
  const expectedSig = process.env.FLUTTERWAVE_SECRET; // we’ll add this in Vercel later

  if (expectedSig && signature !== expectedSig) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  const event = req.body;
  const status = event?.data?.status;
  const amount = Number(event?.data?.amount || 0);
  const email = event?.data?.customer?.email || null;

  if (status === "successful" && amount === 10000) {
    console.log(`✅ Payment confirmed for ${email}`);
    return res.status(200).json({ success: true });
  }

  return res.status(200).json({ message: "ignored" });
}
