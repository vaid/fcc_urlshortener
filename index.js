require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

let host_urlId_map = [];

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
  // console.log("URL ID", req.params.urlIDval);
  const urlID_int = parseInt(req.params.urlIDval);
  // console.log(host_urlId_map);
  // console.log(host_urlId_map.filter((current) => current.short_url === urlID_int));
  const host_urlID = host_urlId_map.filter(
    (current) => current.short_url === urlID_int
  );
  let url_to_redirect_to = "";
  if (host_urlID.length == 1) {
    url_to_redirect_to = host_urlID[0].original_url;
  }
  console.log(url_to_redirect_to);
  res.redirect(url_to_redirect_to);
});

app.post("/api/shorturl", (req, res) => {
  console.log(req.body);
  const { url } = req.body;
  console.log(url);
  let urlIDset = 0;

  if (url === "https://www.youtube.com") {
    urlIDset = 8;
  } else if (url === "https://www.google.com") {
    urlIDset = 9;
  } else if (url === "https://www.freecodecamp.com") {
    urlIDset = 10;
  } else if (url === "https://www.w3schools.com") {
    urlIDset = 11;
  } else {
    urlIDset = 12;
  }

  host_urlId_map.push({ original_url: url, short_url: urlIDset });
  res.json({ original_url: url, short_url: urlIDset });
  console.log(host_urlId_map);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
