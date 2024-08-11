require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const { promisify } = require("util");
// const URL = require("node:url").URL;
const { URL } = require("url");
const { promises } = require("stream");
let mongoose = require("mongoose");

const app = express();

mongoose.connect(process.env.MONGO_DB_URI);

const urlShortenerSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number,
    required: true,
  },
});

const URLShortener = mongoose.model("URLShortener", urlShortenerSchema);

const createAndSaveURLShortener = async (p_original_url, p_short_url, done) => {
  const newURLShortener = new URLShortener({
    original_url: p_original_url,
    short_url: p_short_url,
  });

  try {
    const data = await newURLShortener.save();
    console.log("Data saved: ", data);
    done(null, data);
  } catch (error) {
    console.log("Error in saving data");
    console.log(error);
    console.log("------------------------------------");
    done(error);
  }
};

const findOneByURL = async (p_original_url, done) => {
  try {
    const data = await URLShortener.findOne({ original_url: p_original_url });
    done(null, data);
  } catch (error) {
    console.log("Error in searching data");
    console.log(error);
    console.log("------------------------------------");
    done(error);
  }
};

const findOneWithHighestShortURLId = async () => {
  const highestID = await URLShortener.find()
    .sort({ short_url: -1 })
    .limit(1)
    .select({ short_url: 1 })
    .exec();
  if (highestID.length > 0) {
    return highestID[0].short_url;
  } else {
    return null;
  }
};

// Convert dns.lookup into a Promise based function
const dnsLookup = promisify(dns.lookup);

let url_shorturl_map = [];

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/shorturl/:urlIDval", (req, res) => {
  const urlID_int = parseInt(req.params.urlIDval);
  const found_url_shorturl = url_shorturl_map.filter(
    (current) => current.short_url === urlID_int
  );
  let url_to_redirect_to = "";
  if (found_url_shorturl.length == 1) {
    url_to_redirect_to = found_url_shorturl[0].original_url;
  }
  // console.log(url_to_redirect_to);
  res.redirect(url_to_redirect_to);
});

app.post("/api/shorturl", async (req, res) => {
  try {
    const { url } = req.body;
    const url_obj = new URL(url);
    const hostname = url_obj.hostname;

    await dnsLookup(hostname);

    await findOneByURL(url, async (err, data) => {
      if (err) {
        res.json({ error: "Error in searching in mongoDB" });
      } else {
        if (data) {
          console.log("Record already found in MongoDB: ", data);
          res.json({
            original_url: data.original_url,
            short_url: data.short_url,
          });
        } else {
          let highestID = await findOneWithHighestShortURLId();
          console.log("Highest ID Found: ", highestID);
          if (highestID == null) {
            highestID = 8;
          } else {
            highestID += 1;
          }
          console.log("Highest ID Final: ", highestID);

          await createAndSaveURLShortener(url, highestID, (err, data) => {
            if (err) {
              res.json({ error: "Error in saving in mongoDB" });
            } else {
              if (data) {
                console.log("New Record created in MongoDB: ", data);
                res.json({
                  original_url: data.original_url,
                  short_url: data.short_url,
                });
              } else
                res.json({
                  error:
                    "No error, but looks like data is not saved in MongoDB",
                });
            }
          });
        }
      }
    });
  } catch (err) {
    console.error("--------ERROR CODE: ", err.code);
    if (err.code === "ENOTFOUND") {
      return res.json({ error: "Invalid Hostname" });
    } else if (err.code === "ERR_INVALID_URL") {
      return res.json({ error: "Invalid URL" });
    }
    res.json({ error: "Internal Server Error" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
