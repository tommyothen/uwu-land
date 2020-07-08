require("dotenv").config();
const admin = require("firebase-admin");
const express = require("express");
const nanoid = require("nanoid").nanoid;
const yup = require("yup");

const serviceAccount = require("./token/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
app.enable('trust proxy');
app.use(express.json());

const schema = yup.object().shape({
  id: yup.string().trim().matches(/^[\w\-]+$/i),
  url: yup.string().trim().url().required()
});

app.get("/", (req, res) => {
  res.redirect(process.env.NODE_ENV == "production" ? "https://app.uwu.land" : `http://localhost:${process.env.APP_PORT || 4551}`);
});

app.post("/api", async (req, res, next) => {
  try {
    let id = req.headers.id;
    let url = req.headers.url;
    if (!url) throw new Error("Header param 'url' not given. 🎁");
    if (url.includes("uwu.land")) throw new Error("Stop 🛑");
    if (!id) id = nanoid(5);

    let urlsRef = db.collection('urls').doc(id);
    let doc = await urlsRef.get();
    if (doc.exists) throw new Error("ID already taken. 🚄");

    await schema.validate({
      id,
      url
    });

    await urlsRef.set({
      id,
      url,
      "total clicks": 0
    });

    res.json({
      id,
      url,
      "total clicks": 0
    });
  } catch (error) {
    next(error);
  }
});

app.use("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let urlsRef = db.collection('urls').doc(id);

    let doc = await urlsRef.get();

    if (doc.exists) {
      res.redirect(doc.data().url);
      urlsRef.update({
        "total clicks": admin.firestore.FieldValue.increment(1)
      });
    } else {
      throw new Error("URL not found. 🔎");
    }
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
  });
});

const port = process.env.PORT || 4550;
app.listen(port, () => {
  console.log(`App live at http://localhost:${port}`);
});