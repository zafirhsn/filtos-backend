const nextService = require("../services/nextService.js")


module.exports = async (req, res, next) => {
  try {
    let data = await nextService(req.body.access_token, req.body.next);

    return res.json(data);
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