const request = require("request");
const requestPromise = require("request-promise-native");

module.exports = async (access_token, id, name, description, tracks) => {

  let res = await requestPromise.post(`https://api.spotify.com/v1/users/${id}/playlists`, {
    headers: {
      "Authorization": `Bearer ${access_token}`
    },
    body: {
      name,
      description, 
    },
    json: true
  })


  let playlist_id = res.id;

  let tracksList = [];
  for (let item of tracks) {
    tracksList.push(`spotify:track:${item}`);
  }

  let res1 = await requestPromise.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
    headers:{
      "Authorization": `Bearer ${access_token}`
    },
    body: {
      uris: tracksList
    },
    json: true
  })

  return;
}