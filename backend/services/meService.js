const request = require("request");
const requestPromise = require("request-promise-native");
const {profile, library, artists, trackFeatures } = require('../fetch');
const { timeout } = require("../util");
const filter = require("../filter");
require("dotenv").config();

module.exports = async (code) => {
  let data = {};
  
  let response = await requestPromise.post("https://accounts.spotify.com/api/token", {
    headers: {
      "Authorization": `Basic ${process.env.BASE64AUTH}`
    },
    form: {
      "grant_type": "authorization_code",
      "code": code,
      "redirect_uri": `${process.env.FRONTEND_URL}/home`
    }
  })

  response = JSON.parse(response);

  let access_token = response.access_token;
  let refresh_token = response.refresh_token;
  let created = new Date().getTime();

  let rawProfile = await profile(access_token);

  data.profile = {
    display_name: rawProfile.display_name,
    country: rawProfile.country,
    id: rawProfile.id    
  }

  if (rawProfile.images.length) {
    data.profile.images = rawProfile.images[0].url;
  } else {
    data.profile.images = "https://picsum.photos/200";
  }


  let country = rawProfile.country;

  let rawLib = await library(access_token, country, 0);
  await timeout(5000);

  let next = rawLib[rawLib.length - 1].next
  data.next = next;

  let rawArtists = await artists(access_token, rawLib);
  await timeout(5000);

  let rawFeatures = await trackFeatures(access_token, rawLib) 
  await timeout(5000);

  let filteredData = filter(rawLib, rawArtists, rawFeatures);

  data.data = filteredData;

  let cookie = {
    tokens: {
      access_token,
      refresh_token,
      created,
    },
    profile: {
      id: rawProfile.id 
    }
  }

  return { data, cookie };
}