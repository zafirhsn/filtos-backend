const request = require("request");
const requestPromise = require("request-promise-native");
const queryString = require("query-string");
const fsPromise = require("fs").promises;
const { timeout } = require("./util");
const { write } = require("fs");
const { time } = require("console");
const { retry } = require('./retry');


module.exports = {
  async profile (access_token) {
    let url = "https://api.spotify.com/v1/me"
    let response = await requestPromise.get(url, { headers: { 'Authorization': `Bearer ${access_token}`}});
    response = JSON.parse(response);
    return response;
  },
  async library(access_token, country, next) {
    const RETRIES = 5;
    let hrstart = process.hrtime();
    let url = "https://api.spotify.com/v1/me/tracks?" + queryString.stringify({
      "limit": 50,
      "offset": next,
      "market": country
    });
  
    // Try this first request, if it fails, use retry after header to retry up to 5 times, then send error to client
    let response = await retry(RETRIES, access_token, url);
    let data = [response];
    response = JSON.parse(response);

    const TOTAL = response.total;
    // Make 50 requests each request asking for 50 songs, for a total of 2500 songs, if they exist
    let count = 0;
    for (let offset = next+50; count < 50; offset += 50) {
      url = "https://api.spotify.com/v1/me/tracks?" + queryString.stringify({
        "limit": 50,
        "offset": offset,
        "market": country
      });
      // If the offset >= total, break the loop
      if (offset >= TOTAL) break;

      let res = await retry(RETRIES, access_token, url)
      data.push(res);
      count++;
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = JSON.parse(data[i]);
    }
    let end = process.hrtime(hrstart);
    console.log(`Library-Execution time(hr): ${end[0]}s ${end[1] / 1000000}ms`);
    return data;
  },

  // ! WARNING, this may cause problems
  /* 
    This function will get every unique artist from the supplied library object and batch 50 requests to Spotify, each request containing 50 or less artists. The number of artists within the library object is indeterminate at the point of calling the function. Meaning, given a library with 2500 songs (50 requests), the number of artists for those songs can exceed 2500 given that a song can have multiple artists. This means it is possible for this function to make more than 50 requests in one batch and thus increase the likelihood of a 429 status from Spotify (Rate limit exceeded). 
  */
  async artists(access_token, library) {
    let artistSet = new Set();
    for (let req of library) {
      for (let item of req.items) {
        for (let artist of item.track.artists) {
          artistSet.add(artist.id);
        }
      }
    }
    let url = "https://api.spotify.com/v1/artists?ids=";
    let reqArr = [];
    let idArr = [];
    let data = [];
    let count = 0;
    for (let id of artistSet) {
      if (idArr.length === 50) {
        let str = idArr.join(",");
        url += str;
        reqArr.push(url);
        idArr = [];
        url = "https://api.spotify.com/v1/artists?ids=";
      }
      idArr.push(id);
    }
    if (idArr.length) {
      let str = idArr.join(",");
      url += str;
      reqArr.push(url);
      idArr = [];
      url = "https://api.spotify.com/v1/artists?ids=";
    }
    for (let req of reqArr) {
      let res = await retry(5, access_token, req);
      data.push(res);   
    }
  
    for (let i = 0; i < data.length; i++) {
      data[i] = JSON.parse(data[i]);
    }
    return data;
  },
  async trackFeatures(access_token, library) {
    let trackSet = new Set();
    for (let req of library) {
      for (let item of req.items) {
        if (item.track.linked_from) trackSet.add(item.track.linked_from.id)
        else trackSet.add(item.track.id);
      }
    }
    let url = "https://api.spotify.com/v1/audio-features?ids=";
    let reqArr = [];
    let idArr = [];
    let data = [];
    let count = 0;
    for (let id of trackSet) {
      if (idArr.length === 100) {
        let str = idArr.join(",");
        url += str;
        reqArr.push(url);
        idArr = [];
        url = "https://api.spotify.com/v1/audio-features?ids=";
      }
      idArr.push(id);
    }
    if (idArr.length) {
      let str = idArr.join(",");
      url += str;
      reqArr.push(url);
      idArr = [];
      url = "https://api.spotify.com/v1/audio-features?ids=";
    }
    for (let req of reqArr) {
      let res = await retry(5, access_token, req);
      data.push(res);
    }

    for (let i = 0; i< data.length; i++) {
      data[i] = JSON.parse(data[i]);
    }
  
    return data;
  
  },

} 

async function main() {
  let lib = await module.exports.library(access_token, "US", 0);
  let a = await module.exports.artists(access_token, lib);
  let t = await module.exports.trackFeatures(access_token, lib);

  await fsPromise.writeFile('./data/library-raw.json', JSON.stringify(lib));
  await fsPromise.writeFile('./data/artists-raw.json', JSON.stringify(a));
  await fsPromise.writeFile('./data/trackfeatures-raw.json', JSON.stringify(t));
}

// main().then().catch();
