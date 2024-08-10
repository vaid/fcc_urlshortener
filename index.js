require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const url_module = require("url");

const app = express();

let host_urlId_map = [];
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
  let urlID_to_set = 0;

  const url_obj = url_module.parse(url);
  const hostname = url_obj.hostname;
  console.log("Hostname: ", hostname);
  console.log("Parsed URL: ", url_obj);
  // dns.lookup(hostname, (err, address, family) => {
  //   console.log("DNS Lookup details: ", err, address, family);
  // });

  const host_urlID = host_urlId_map.filter(
    (current) => current.original_url === url
  );
  if (host_urlID.length == 1) {
    urlID_to_set = host_urlID[0].short_url;
  } else {
    urlID_to_set = short_url_id_counter;
    short_url_id_counter += 1;
    host_urlId_map.push({ original_url: url, short_url: urlID_to_set });
  }

  res.json({ original_url: url, short_url: urlID_to_set });
  console.log(host_urlId_map);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
