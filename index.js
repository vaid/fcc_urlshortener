require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const { promisify } = require("util");
// const URL = require("node:url").URL;
const { URL } = require("url");
const { promises } = require("stream");

const app = express();

// Convert dns.lookup into a Promise based function
const dnsLookup = promisify(dns.lookup);

let url_shorturl_map = [];
let short_url_id_counter = 8;

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
  console.log(url_to_redirect_to);
  res.redirect(url_to_redirect_to);
});

app.post("/api/shorturl", async (req, res) => {
  try {
    const { url } = req.body;
    let urlID_to_set = 0;
    const url_obj = new URL(url);
    const hostname = url_obj.hostname;

    await dnsLookup(hostname);

    const found_url_shorturl = url_shorturl_map.filter(
      (current) => current.original_url === url
    );

    // Check if host already mapped
    if (found_url_shorturl.length == 1) {
      urlID_to_set = found_url_shorturl[0].short_url;
    } else {
      urlID_to_set = short_url_id_counter;
      short_url_id_counter += 1;
      url_shorturl_map.push({ original_url: url, short_url: urlID_to_set });
    }

    res.json({ original_url: url, short_url: urlID_to_set });
    console.log(url_shorturl_map);
  } catch (err) {
    console.error("--------ERROR CODE: ", err.code);
    if (err.code === "ENOTFOUND") {
      return res.json({ error: "Invalid Hostname" });
    } else if (err.code === "ERR_INVALID_URL") {
      return res.json({ error: "Invalid URL" });
    }
    console.error("DNS lookup failed:", err);
    res.json({ error: "Internal Server Error" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
