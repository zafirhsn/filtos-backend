const fsPromise = require("fs").promises;
const fs = require("fs");
const filter = require("../filter");


(async function() {
  let artists = await fsPromise.readFile("../data/artists-raw.json");
  let lib = await fsPromise.readFile("../data/library-raw.json");
  let features = await fsPromise.readFile("../data/trackfeatures-raw.json");

  artists = JSON.parse(artists);
  lib = JSON.parse(lib);
  features = JSON.parse(features);

  let filteredData = filter(lib, artists, features);


})();