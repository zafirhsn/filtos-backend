const express = require("express");
const router = express.Router();
const { me, next, savePlaylist } = require("../controllers/index");
const tokenChecker = require("../utils/tokenChecker")
// const {library, artists, trackFeatures } = require('../fetchtest');
// const fetch = require("../fetch");
// const { timeout } = require("../util");
// const fsPromise = require('fs').promises;

router.get('/testServer', async (req, res, next) => {
  return res.status(200).send("Server is working...");
});
router.get('/me', me);
router.post('/next', tokenChecker, next)
router.post('/save', tokenChecker, savePlaylist);

/* 
  !Sequence Diagram 
  1. User authorizes app scopes and is redirected to redirect_uri
  2. Frontend takes "code" parameter from query string get data from backend
  4. Backend uses code to ask for access_token and refresh token, gives each a timestamp
  5. Access token is used to get initial library data and profile
  6. Data is sent to frontend with (access token, refresh token, profile, and data) 
  7. Frontend stores access, refresh, and profile in localStorage
  8. If there is more data to get, frontend sends access and refresh token to backend
  9. Backend tries getting data using access token, if fails, uses refresh token
  10. Backend sends back data with new access and refresh tokens if necessary 
  11. User chooses songs to be saved in a playlist
  12. Frontend requests playlist to be made in user's spotify and sends access and refresh tokens
  13. Backend saves playlist and send access and refresh token back if necessary


  Backend Endpoints
  1. Initial Data (GET /me)
  2. More data (POST /next)
  3. Save playlist (POST /save)

  Backend Middleware
  1. Token checker, it takes an access token and refresh token, if access token is valid, will continue, else, the refresh token is used to ask for another token, new access token and refresh token are given new timestamp and added to response body, otherwise tokens in body is null

*/

module.exports = router;