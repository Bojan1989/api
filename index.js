import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const db = admin.firestore();
const scoresCollection = db.collection("scores");

const app = express();
app.use(cors());
app.use(express.json());

// POST /scores - dodavanje score-a
app.post("/scores", async (req, res) => {
  const { name, points } = req.body;
  if (!name || points == null) {
    return res.status(400).json({ error: "Missing name or points" });
  }
  try {
    const docRef = await scoresCollection.add({ name, points });
    res.status(201).json({ id: docRef.id, name, points });
  } catch (err) {
    console.error("Greska prilikom dodavanja score-a:", err);
    res.status(500).json({ error: "Failed to add score" });
  }
});

// GET /scores - top 10 score-ova
app.get("/scores", async (req, res) => {
  try {
    const snapshot = await scoresCollection
      .orderBy("points", "desc")
      .limit(10)
      .get();
    const scores = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(scores);
  } catch (err) {
    console.error("Greska prilikom dohvatanja score-ova:", err);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

// Port koji Render koristi
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

