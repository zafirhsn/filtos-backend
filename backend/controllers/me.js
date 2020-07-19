const meService = require("../services/meService.js")
require("dotenv").config();


module.exports = async (req, res, next) => {
  try {
    let { data, cookie } = await meService(req.query.code);
    
    res.cookie("_session", JSON.stringify(cookie), {
      signed: true,
      maxAge: (1000*60*60*24),
      sameSite: `${process.env.SAME_SITE}`,
      secure: Boolean(process.env.SECURE),
      domain: `${process.env.DOMAIN}`
    })

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