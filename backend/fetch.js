const request = require("request");
const requestPromise = require("request-promise-native");
const queryString = require("query-string");
const fsPromise = require("fs").promises;
const { timeout } = require("./utils");
const { write } = require("fs");


module.exports = {
  async profile (access_token) {
    let url = "https://api.spotify.com/v1/me"
    let response = await requestPromise.get(url, { headers: { 'Authorization': `Bearer ${access_token}`}});
    response = JSON.parse(response);
    return response;
  },
  async library(access_token, country, next) {

    let url = "https://api.spotify.com/v1/me/tracks?" + queryString.stringify({
      "limit": 50,
      "offset": next,
      "market": country
    });
  
    // Try this first request, if it fails, use retry after header to retry up to 5 times, then send error to client
    let response;
    try {
      response = await requestPromise.get(url, { headers: {'Authorization': `Bearer ${access_token}` }});
    } catch(e) {
  
      let tries = 1;
      while(e && tries < 3) {
        // If there is a rate limit err, use retry after header 
        if (e.statusCode === 429) {
          let retryms = Number(e.response.headers["retry-after"]) * 1000;
          await timeout(retryms + 500);
          response = await requestPromise.get(url, { headers: {'Authorization': `Bearer ${access_token}` }});
          if (response.name !== "StatusCodeError") e = false;
          else tries++;
        }
        // If there is any other error, throw it, controller will log it and send 500 error to user
        else {
          throw e;
        }
      }
    }
    let data = [response];
    response = JSON.parse(response);

    const TOTAL = response.total;
    // Make 50 requests each request asking for 50 songs, for a total of 2500 songs, if they exist
    let requestsArray = [];
    for (let offset = next+50; requestsArray.length < 50; offset += 50) {
      url = "https://api.spotify.com/v1/me/tracks?" + queryString.stringify({
        "limit": 50,
        "offset": offset,
        "market": country
      });
      // If the offset >= total, break the loop
      if (offset >= TOTAL) break;


      requestsArray.push(requestPromise.get(url, {headers: {'Authorization': `Bearer ${access_token}`} }))
      
    }
    let responseArray = await Promise.all(requestsArray);
    console.log("requestArray.length for library", requestsArray.length);
    data.push(...responseArray);
    // await timeout(5000);

    for (let i = 0; i < data.length; i++) {
      data[i] = JSON.parse(data[i]);
    }
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
    let idArr = [];
    let requestsArray = [];
    let data = [];
    for (let id of artistSet) {
      // if (requestsArray.length === 50) {
      //   let responseArray = await Promise.all(requestsArray);
      //   console.log("requestArray.length", requestsArray.length);
      //   data.push(...responseArray);
      //   requestsArray = [];
      //   // await timeout(5000);
      // }
  
      if (idArr.length === 50) {
        let str = idArr.join(",");
        url += str;
        // console.log(url);
        requestsArray.push(requestPromise.get(url, {headers: {'Authorization': `Bearer ${access_token}`}}))
        idArr = [];
        url = "https://api.spotify.com/v1/artists?ids=";
      }
      idArr.push(id);
    }
    if (idArr.length) {
      let str = idArr.join(",");
      url += str;
      requestsArray.push(requestPromise.get(url, {headers: {'Authorization': `Bearer ${access_token}`}}))
      idArr = [];
      url = "https://api.spotify.com/v1/artists?ids=";
    }
    let responseArray = await Promise.all(requestsArray);
    console.log("requestsArray.length for artists: ", requestsArray.length);
    data.push(...responseArray);
    // await timeout(5000);
  
  
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
    let idArr = [];
    let requestsArray = [];
    let data = [];
    for (let id of trackSet) {
      if (requestsArray.length === 50) {
        let responseArray = await Promise.all(requestsArray);
        console.log("requestsArray.length", requestsArray.length);
        data.push(...responseArray);
        requestsArray = [];
        // await timeout(5000);
      }
  
      if (idArr.length === 100) {
        let str = idArr.join(",");
        url += str;
        // console.log(url);
        requestsArray.push(requestPromise.get(url, {headers: {'Authorization': `Bearer ${access_token}`}}))
        idArr = [];
        url = "https://api.spotify.com/v1/audio-features?ids=";
      }
      idArr.push(id);
    }
    if (idArr.length) {
      let str = idArr.join(",");
      url += str;
      requestsArray.push(requestPromise.get(url, {headers: {'Authorization': `Bearer ${access_token}`}}))
      idArr = [];
      url = "https://api.spotify.com/v1/audio-features?ids=";
    }
    if (requestsArray.length) {
      let responseArray = await Promise.all(requestsArray);
      console.log("requestsArray.length for features: ", requestsArray.length);
      data.push(...responseArray);
      // await timeout(5000);
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
