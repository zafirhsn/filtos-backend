const request = require("request");
const requestPromise = require("request-promise-native");
const {timeout} = require('./util/index');

module.exports = {
  async retry (num, access_token, url) {
    let r = async (num, access_token, url, t) => {
      if (num <= 0) throw "Too many retries"
      try {
        let res = await requestPromise.get(url, {headers: {'Authorization': `Bearer ${access_token}`} });
        // console.log("good after: ", ++t);
        return res;
      } catch(e) {
        // console.log("id:", id, e.response.headers['retry-after']);
        console.log(e.statusCode); 
        // console.log(e.message);
        if (e.statusCode === 429) {
          await timeout((Number(e.response.headers['retry-after']) + 1) * 1000);
        }
        return await r(num - 1, access_token, url, ++t);
      }
    }

    return await r(num, access_token, url, 0);

  }
}
