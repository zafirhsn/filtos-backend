const {library, artists, trackFeatures} = require("../fetch");
const queryString = require("query-string");
const {timeout} = require('../util/index');
const filter = require("../filter");
require("dotenv").config();

module.exports = async (access_token, next) => {

  let offset = Number(queryString.parseUrl(next).query.offset);
  let market = queryString.parseUrl(next).query.market;

  let rawLib = await library(access_token, market, offset);
  await timeout(5000);

  let nextURL = rawLib[rawLib.length - 1].next;

  let rawArtists = await artists(access_token, rawLib);
  await timeout(5000);

  let rawFeatures  = await trackFeatures(access_token, rawLib);
  await timeout(5000);

  let filteredData = filter(rawLib, rawArtists, rawFeatures);

  let data = {
    data: filteredData,
    next: nextURL
  }
  return data;
}