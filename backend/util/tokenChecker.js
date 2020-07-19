const request = require("request");
const requestPromise = require("request-promise-native");
require("dotenv").config();

module.exports = async (req, res, next) => {

  if (!req.signedCookies._session) {
    res.sendStatus(401);
  }

  else {
    let cookie = req.signedCookies._session;
    let obj = JSON.parse(cookie);
    let refresh_token = obj.tokens.refresh_token;
    let access_token = obj.tokens.access_token;
    let created = obj.tokens.created / 1000;
    let profile = obj.profile;

    let timestamp = new Date().getTime() / 1000;

    if (timestamp - created >= 86400) {
      let response = await requestPromise.post("https://accounts.spotify.com/api/token", {
        headers: {
          "Authorization": `Basic ${process.env.BASE64AUTH}`
        },
        form: {
          "grant_type": "refresh_token",
          "refresh_token": refresh_token
        }
      })
      response = JSON.parse(response);


      let timestamp = new Date().getTime();

      let data = {
        profile,
        tokens: {
          access_token: response.access_token,
          refresh_token: refresh_token,
          created: timestamp
        }
      }
      let expires = 1000*60*60*24
      res.cookie("_session", JSON.stringify(data), {
        signed: true,
        maxAge: expires
      })

      req.body.profile = profile;
      req.body.access_token = response.access_token;
      next();
    }
    else {
      req.body.profile = profile;
      req.body.access_token = access_token;
      next();
    }
  } 
}