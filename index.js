import express from "express";
import cors from "cors";
import admin from "firebase-admin";

// Ovo će čitati service account JSON iz environment varijable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

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
  try {
    const score = req.body; // { name: string, points: number }
    const docRef = await scoresCollection.add(score);
    res.status(201).json({ id: docRef.id, ...score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add score" });
  }
});

// GET /scores - top 10 score-ova
app.get("/scores", async (req, res) => {
  try {
    const snapshot = await scoresCollection.orderBy("points", "desc").limit(10).get();
    const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
