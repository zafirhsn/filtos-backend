const savePlaylistService = require("../services/savePlaylistService.js")


module.exports = async (req, res, next) => {
  try {
    await savePlaylistService(req.body.access_token, req.body.profile.id, req.body.name, req.body.description, req.body.tracks);

    return res.sendStatus(200);
  } catch (e) {
    console.log("Error statusCode: ", e.statusCode);
    console.log("Error message: ", e.message);
    console.log("Request options: ", e.options);

    if (e.statusCode === 429) {
      return res.status(429).send("Too many requests");
    } else {
      return res.sendStatus(500);
    }
  }
}