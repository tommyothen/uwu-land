require("dotenv").config();
const admin = require("firebase-admin");
const express = require("express");
const nanoid = require("nanoid").nanoid;
const yup = require("yup");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const credentials = {
  type: process.env.type,
  project_id: process.env.project_id,
  private_key_id: process.env.private_key_id,
  private_key: process.env.private_key,
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url
};

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});
const db = admin.firestore();

const app = express();
app.enable('trust proxy');
app.use(express.json());
app.use(helmet());
app.use(morgan('common'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45
});

const speedLimiter = slowDown({
  windowMs: 30 * 1000,
  delayAfter: 5,
  delayMs: 100
});

const publicLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 10
});

const publicSpeedLimiter = slowDown({
  windowMs: 30 * 1000,
  delayAfter: 1,
  delayMs: 200
});

const schema = yup.object().shape({
  id: yup.string().trim().matches(/^[\w\-]+$/i),
  url: yup.string().trim().url().required()
});

app.get("/", (req, res) => {
  res.redirect(process.env.NODE_ENV == "production" ? `https://${process.env.SISTER_DOMAIN}` : `http://localhost:${process.env.SISTER_PORT || 8081}`);
});

app.get("/robots.txt", (req, res) => {
  res.sendFile("robots.txt", {
    root: __dirname
  });
});

const makeLink = async (req, res, next) => {
  try {
    let id = req.headers.id;
    let url = req.headers.url;
    if (!url) throw new Error("Header param 'url' not given. 🎁");
    if (url.includes(process.env.SELF_DOMAIN)) throw new Error("Stop 🛑");

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

    if (req.get("X-API-KEY")) {
      const ownerRef = db.collection('apikeys').doc(req.get("X-API-KEY"));
      const ownerDoc = await ownerRef.get();

      if (ownerDoc.exists) {
        const ownerUID = ownerDoc.data().author;
        const logURLRef = db.collection('users').doc(ownerUID).collection('urls').doc(id);

        await logURLRef.set({
          id,
          url,
        });
      }
    }

    res.json({
      id,
      url,
      "shortened": `https://${process.env.SELF_DOMAIN}/${id}`
    });
  } catch (error) {
    next(error);
  }
};

const whitelist = [`https://${process.env.SISTER_DOMAIN}`, `http://${process.env.HOST || 'localhost'}:${process.env.SISTER_PORT || 8081}`];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.options('/public', cors(corsOptions));
app.post("/public", publicLimiter, publicSpeedLimiter, cors(corsOptions), async (req, res, next) => {
  makeLink(req, res, next);
});

app.options('/api', cors({
  origin: "*"
}));
app.post("/api", limiter, speedLimiter, cors({
  origin: "*"
}), async (req, res, next) => {
  try {
    const key = req.get("X-API-KEY");

    if (!key) {
      throw new Error("Invalid API Key. 🔐");
    }

    let keysRef = db.collection('apikeys').doc(key);
    let doc = await keysRef.get();
    if (doc.exists) {
      next();
    } else {
      throw new Error("Invalid API Key. 🔐");
    }
  } catch (error) {
    next(error);
  }
}, async (req, res, next) => {
  makeLink(req, res, next);
});

app.use("/:id", limiter, speedLimiter, async (req, res, next) => {
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

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`App live at http://localhost:${port}`);
});