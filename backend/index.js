const fsPromise = require("fs").promises;
const express = require('express');
const app = express();
const routes = require("./routes")
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const compression = require("compression");
const http = require('http')
require("dotenv").config();

const PORT = process.env.PORT || 3000;

app.use(cookieParser(`${process.env.COOKIE_SECRET}`))
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

app.use("/", (req, res, next)=> {
  res.set({
    "Access-Control-Allow-Origin": `${process.env.FRONTEND_URL}`,
    "Access-Control-Allow-Headers":"Content-Type,Access-Control-Allow-Headers, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": true
  });
  next();
})

app.use('/', routes);


app.listen(PORT, ()=> {
  console.log("listening on port: ", PORT);
})


