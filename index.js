require("dotenv").config();
const admin = require("firebase-admin");
const express = require("express");
const nanoid = require("nanoid").nanoid;
const yup = require("yup");

const serviceAccount = require("./firebase/serviceAccountKey.json");
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