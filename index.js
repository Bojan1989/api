import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const scoresCollection = db.collection("scores");

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint za dodavanje score-a
app.post("/scores", async (req, res) => {
  try {
    const score = req.body;
    const docRef = await scoresCollection.add(score);
    res.status(201).json({ id: docRef.id, ...score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add score" });
  }
});

// Endpoint za listu top 10 score-ova
app.get("/scores", async (req, res) => {
  try {
    const snapshot = await scoresCollection
      .orderBy("points", "asc")     // Prvo po poenima (manje = bolje)
      .orderBy("attempts", "asc")   // Ako su poeni isti, manje pokušaja = bolje
      .limit(10)
      .get();

    const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

app.get("/scores/cleanup", async (req, res) => {
  try {
    // Preuzmi sve rezultate sortirane po poenima (manje poene = bolje)
    const snapshot = await scoresCollection.orderBy("points", "asc").get();
    const total = snapshot.size;

    // Ako ima 20 ili manje, ne radi ništa
    if (total <= 20) {
      return res.json({ message: "Manje od 20 rezultata — ništa nije obrisano." });
    }

    // Ukloni sve osim prvih 20 sa najmanje poena
    const docsToDelete = snapshot.docs.slice(20);
    const batch = db.batch();

    docsToDelete.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({
      message: `Obrisano ${docsToDelete.length} rezultata, ostavljeno prvih 20 sa najmanje poena.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neuspešno brisanje rezultata." });
  }
});


app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));






