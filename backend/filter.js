
module.exports = (lib, artists, features) => {

    let artistTable = {};
    let featureTable = {};

    for (let req of artists) {
      for (let artist of req.artists) {
        if (artist === null) continue;
        if (artist.id === null) continue;
        artistTable[artist.id] = artist.genres;
      }
    }

    for (let req of features) {
      for (let track of req.audio_features) {
        if (track === null) continue;
        if (track.id === null) continue;
        featureTable[track.id] = {
          danceability: track.danceability,
          energy: track.energy,
          acousticness: track.acousticness,
          instrumentalness: track.instrumentalness,
          liveness: track.liveness,
          valence: track.valence,
          tempo: track.tempo
        }
      }
    }

    let filteredData = {
      total: lib[0].total,
      items: []
    };
    for (let req of lib) {
      for (let item of req.items) {
        let obj = {
          name: item.track.name,
          duration_ms: item.track.duration_ms,
          popularity: item.track.popularity,
          artists: []
        }

        if (item.track.preview_url) {
          obj.preview_url = item.track.preview_url;
        } else {
          obj.preview_url = null;
        }

        if (item.track.linked_from) {
          obj.id = item.track.linked_from.id;
        } else { obj.id = item.track.id; }

        let genres = [];
        for (let artist of item.track.artists) {
          let artistObj = {
            id: artist.id,
            name: artist.name
          }
          obj.artists.push(artistObj);
          genres.push(...artistTable[artist.id])
        }
        obj.genres = genres;


        obj.features = featureTable[obj.id];

        filteredData.items.push(obj);
      }
    }

    return filteredData;

}

