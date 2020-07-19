const { doesNotReject } = require('assert');
const qs = require("query-string");
const assert = require('chai').assert;
const chaiPromise = require("chai-as-promised")
const fsPromise = require("fs").promises;

describe("Raw Library Data", function() {
  let file;

  beforeEach(async function() {
    file = await fsPromise.readFile('./data/library-raw.json');
    file = JSON.parse(file);
  })

  it("should be of type object", function(){
    assert.strictEqual(typeof file, "object");
  })

  it("should have length total / 50 + 1", function() {
    let total = file[0].total;
    
    assert.strictEqual(file.length, Math.ceil(total / 50))
  })

  it("should have total item count equal to total", function(){
    let numTracks = 0;
    let total = file[0].total;
    for (let req of file) {
      numTracks += req.items.length;
    }
    assert.strictEqual(numTracks, total);
  })

  it("should have next hrefs match href of next item", function() {
    for (let i = 0; i < file.length - 1; i++) {
      let next = file[i].next;
      let nextHref = file[i+1].href;
      assert.strictEqual(next, nextHref)
    }
  })

  it("should have previous href match href of previous item", function() {
    for (let i = 1; i < file.length; i++) {
      let prev = file[i].previous;
      let prevHref = file[i-1].href;
      assert.strictEqual(prev, prevHref)
    }
  })

  it("should have length of last req be total % 50", function() {
    let numLast = file[file.length - 1].items.length;
    let total = file[0].total;
    assert.strictEqual(numLast, total % 50 );
  })
}) 

describe("Raw Artist Data", function() {
  let artistFile;
  let libraryFile;

  beforeEach(async function() {
    artistFile = await fsPromise.readFile('./data/artists-raw.json', 'utf8');
    artistFile = JSON.parse(artistFile);

    libraryFile = await fsPromise.readFile('./data/library-raw.json', 'utf8');
    libraryFile = JSON.parse(libraryFile);
  })

  it("should be of type object", function() {
    assert.strictEqual(typeof artistFile, "object");
  })

  it ("should have same number of artists as library file", function() {
    let artistSet = new Set();
    let libArtistSet = new Set();

    for (let req of libraryFile) {
      for (let item of req.items) {
        for (let artist of item.track.artists) {
          libArtistSet.add(artist.id);
        }
      }
    }

    for (let req of artistFile) {
      for (let artist of req.artists) {
        artistSet.add(artist.id);
      }
    }

    assert.strictEqual(artistSet.size, libArtistSet.size);
  })

  it("should have same artists as library file", function() {
    let artistSet = new Set();
    let libArtistSet = new Set();

    for (let req of libraryFile) {
      for (let item of req.items) {
        for (let artist of item.track.artists) {
          libArtistSet.add(artist.id);
        }
      }
    }

    for (let req of artistFile) {
      for (let artist of req.artists) {
        artistSet.add(artist.id);
      }
    }

    for (let id of artistSet) {
      assert.isTrue(libArtistSet.has(id));
    }
  }) 
})

describe("Raw Track Features Data", function() {
  let trackFeaturesFile;
  let libraryFile;

  beforeEach(async function() {
    trackFeaturesFile = await fsPromise.readFile('./data/trackfeatures-raw.json', 'utf8');
    trackFeaturesFile = JSON.parse(trackFeaturesFile);

    libraryFile = await fsPromise.readFile('./data/library-raw.json', 'utf8');
    libraryFile = JSON.parse(libraryFile);
  })

  it("should have same number of tracks as library file", function() {
    let featuresSet = new Set();
    let librarySet = new Set();

    for (let req of trackFeaturesFile) {
      for (let track of req.audio_features) {
        featuresSet.add(track.id);
      }
    }

    for (let req of libraryFile) {
      for (let item of req.items) {
        if (item.track.linked_from) librarySet.add(item.track.linked_from.id);
        else librarySet.add(item.track.id);
      }
    }

    assert.strictEqual(featuresSet.size, librarySet.size);
  })

  it("should have same tracks as library file", function() {
    let featuresSet = new Set();
    let librarySet = new Set();

    for (let req of trackFeaturesFile) {
      for (let track of req.audio_features) {
        featuresSet.add(track.id);
      }
    }

    for (let req of libraryFile) {
      for (let item of req.items) {
        if (item.track.linked_from) librarySet.add(item.track.linked_from.id);
        else librarySet.add(item.track.id);
      }
    }

    for (let id of featuresSet) {
      assert.isTrue(librarySet.has(id));
    }
  })

})


describe("Clean Data Uncompressed", function() {
  let featuresFile;
  let libraryFile;
  let artistsFile;
  let cleanFile;

  let artistTable = {};
  let featureTable = {};

  beforeEach(async function() {
    featuresFile = await fsPromise.readFile('./data/trackfeatures-raw.json', 'utf8');
    libraryFile = await fsPromise.readFile('./data/library-raw.json', 'utf8');
    artistsFile = await fsPromise.readFile('./data/artists-raw.json', 'utf8');
    cleanFile = await fsPromise.readFile('./data/data-clean.json', 'utf8');

    featuresFile = JSON.parse(featuresFile);
    libraryFile = JSON.parse(libraryFile);
    artistsFile = JSON.parse(artistsFile);
    cleanFile = JSON.parse(cleanFile);

    for (let req of artistsFile) {
      for (let artist of req.artists) {
        artistTable[artist.id] = artist.genres;
      }
    }
  
    for (let req of featuresFile) {
      for (let track of req.audio_features) {
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
  })


  it("should have same number of tracks as library file", function() {
    let cleanSet = new Set();
    for (let item of cleanFile.items) {
      cleanSet.add(item.id);
    }
    let libSet = new Set();
    for (let req of libraryFile) {
      for (let item of req.items) {
        if (item.track.linked_from) libSet.add(item.track.linked_from.id)
        else libSet.add(item.track.id);
      }
    }
    assert.strictEqual(cleanSet.size, libSet.size);

  });

  it("should have same tracks as library file", function() {
    let cleanSet = new Set();
    for (let item of cleanFile.items) {
      cleanSet.add(item.id);
    }
    let libSet = new Set();
    for (let req of libraryFile) {
      for (let item of req.items) {
        if (item.track.linked_from) libSet.add(item.track.linked_from.id)
        else libSet.add(item.track.id);
      }
    }

    for (let id of cleanSet) {
      assert.isTrue(libSet.has(id));
    }

  });

  it("should have same artists per track as library", function() {
    let cleanTable = {};
    let libTable = {};

    for (let item of cleanFile.items) {
      cleanTable[item.id] = item.artists;
    }
    for (let req of libraryFile) {
      for (let item of req.items) {
        if (item.track.linked_from) libTable[item.track.linked_from.id] = item.track.artists;
        else libTable[item.track.id] = item.track.artists
      }
    }
    
    // Check for same number of artists
    assert.strictEqual(Object.keys(cleanTable).length, Object.keys(libTable).length);
    for (let id in cleanTable) {
      // Check for same number of artists per track
      assert.strictEqual(cleanTable[id].length, libTable[id].length)
      for (let i = 0; i < cleanTable[id].length; i++) {
        // Check for same artists per track
        assert.strictEqual(cleanTable[id][i].id, libTable[id][i].id);
      }
    }
    
  });

  it("should have same number of artists as library file", function() {
    let cleanSet = new Set();
    for (let item of cleanFile.items) {
      for (let artist of item.artists) {
        cleanSet.add(artist.id);
      }
    }

    let libSet = new Set();
    for (let req of libraryFile) {
      for (let item of req.items) {
        for (let artist of item.track.artists) {
          libSet.add(artist.id);
        }
      }
    }

    assert.strictEqual(cleanSet.size, libSet.size);
  });

  it("should have same artists as library file", function() {
    let cleanSet = new Set();
    for (let item of cleanFile.items) {
      for (let artist of item.artists) {
        cleanSet.add(artist.id);
      }
    }

    let libSet = new Set();
    for (let req of libraryFile) {
      for (let item of req.items) {
        for (let artist of item.track.artists) {
          libSet.add(artist.id);
        }
      }
    }

    for (let id of cleanSet) {
      assert.isTrue(libSet.has(id))
    }
    // assert.strictEqual(cleanSet.size, libSet.size);
  })


})

describe("split-1.json", function() {
  let dataClean;
  let split;

  beforeEach(async function() {
    dataClean = await fsPromise.readFile("./data/data-clean.json", 'utf8');
    split = await fsPromise.readFile("./data/load-testing/split-1.json", 'utf8');

    dataClean = JSON.parse(dataClean);
    split = JSON.parse(split);
  })

  it("should have a total value 10x total of data-clean.json", function() {
    assert.strictEqual(dataClean.total * 10, split.total);
  });
  it("should have 2500 items", function() {
    assert.strictEqual(2500, split.items.length);
  });
  it("should have next url with offset equal to 250", function()  {
    let params = split.next.indexOf("?");
    params = split.next.substring(params);
    let next = qs.parse(params);
    let offset = Number(next.offset);
    assert.strictEqual(250, offset);
  })
})

describe("All splits", function() {
  let dataClean;
  let split6;

  beforeEach(async function() {
    dataClean = await fsPromise.readFile("./data/data-clean.json", 'utf8');
    split6 = await fsPromise.readFile("./data/load-testing/split-6.json", 'utf8');

    dataClean = JSON.parse(dataClean);
    split6 = JSON.parse(split6);
  })

  it("final split should have items.length of total % 250 * 10", function() {
    
    assert.strictEqual(split6.items.length, (dataClean.total % 250) * 10);
  })

  // it("should have Math.ceil(total / 250) number of files", function() {
  //   let counter = 1;
  //   let promiseArr = [];
  //   while (counter <= Math.ceil(dataClean.total / 250)) {
  //     promiseArr.push(fsPromise.readFile(`./data/load-testing/split-${counter}.json`, 'utf8'));
  //   }
  //   return assert.eventually.equal(promiseArr,  

  // })

})