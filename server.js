const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = '';
  req.on('data', (data) => {
    reqBody += data;
  });

  req.on('end', () => {
    // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case 'application/json':
          req.body = JSON.parse(reqBody);
          break;
        case 'application/x-www-form-urlencoded':
          req.body = reqBody
            .split('&')
            .map((keyValuePair) => keyValuePair.split('='))
            .map(([key, value]) => [key, value.replace(/\+/g, ' ')])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    let urlParts = req.url.split('/');
    // get all artists
    if (req.method == 'GET' && req.url == '/artists') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(artists));
      return res.end();
    }

    if (req.url.startsWith('/artists/') && urlParts.length == 3) {
      // get a single artist
      if (req.method == 'GET') {
        let artistId = urlParts[2];
        let artist = artists[artistId];
        if (artist) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(artist));
          return res.end();
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.write(
            JSON.stringify({
              message: 'artist not found',
              statusCode: 404,
            })
          );
          return res.end();
        }
      }

      // change an artist
      if (req.method == 'PUT') {
        let { name } = req.body;
        let artistId = urlParts[2];
        let artist = artists[artistId];
        if (artist) {
          artist.name = name;
          artist.updatedAt = Date.now();
          artists[artistId] = artist;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(artist));
          return res.end();
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.write(
            JSON.stringify({
              message: 'Cannot find the artist',
              statusCode: 404,
            })
          );
          return res.end();
        }
      }

      // if (req.method == 'POST') {
      //   let artistId = urlParts[2];
      //   let artist = artists[artistId];
      //   if (artist) {
      //     res.statusCode = 200;
      //     res.setHeader('Content-Type', 'application/json');
      //     res.write(JSON.stringify(artist));
      //     return res.end();
      //   } else {
      //     res.statusCode = 404;
      //     res.write(
      //       JSON.stringify({
      //         message: 'Artist not found',
      //         statusCode: 404,
      //       })
      //     );
      //     return res.end();
      //   }
      // }

      // delete an artist
      if ((req.method = 'DELETE')) {
        let artistId = urlParts[2];
        if (artists[artistId]) {
          delete artists[artistId];
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(
            JSON.stringify({
              message: 'deleted successfully',
            })
          );
          return res.end();
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.write(
            JSON.stringify({
              message: 'artist does not exist',
              statusCode: 404,
            })
          );
          return res.end();
        }
      }
    }

    // get albums of artists
    if (
      req.method == 'GET' &&
      req.url.startsWith('/artists/') &&
      urlParts.length == 4
    ) {
      let artistId = urlParts[2];
      if (!artists[artistId]) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.write(
          JSON.stringify({
            message: 'Cannot find artist',
            statusCode: 404,
          })
        );
        return res.end();
      }
      if (urlParts[3] == 'albums') {
        let albumsOfArtist = Object.values(albums).filter(
          (album) => album.artistId == parseInt(artistId)
        );
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(albumsOfArtist));
        return res.end();
      }

      if (urlParts[3] == 'songs') {
        let albumsOfArtist = Object.keys(albums).filter(
          (key) => (albums[key].artistId = artistId)
        );
        let songsOfArtist = Object.values(songs).filter((song) =>
          albumsOfArtist.includes(song.albumId.toString())
        );

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(songsOfArtist));
        return res.end();
      }
    }

    //  get album details
    if (
      req.method == 'GET' &&
      req.url.startsWith('/albums') &&
      urlParts.length == 3
    ) {
      let albumId = urlParts[2];
      if (albums[albumId]) {
        let album = Object.assign({}, albums[albumId]);
        album.artist = Object.values(artists).filter(
          (element) => element.artistId == album.artistId
        )[0];
        album.songs = Object.values(songs).filter(
          (song) => song.albumId == albumId
        );
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(album));
        return res.end();
      } else {
        res.statusCode = 404;
        res.write(
          JSON.stringify({
            message: 'Album not found',
            statusCode: 404,
          })
        );
        return res.end();
      }
    }

    //create an artist
    if (req.method == 'POST' && req.url == '/artists') {
      let artist = req.body;
      let artistId = getNewArtistId();
      artist.artistId = artistId;
      artists[artistId] = artist;
      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(artist));
      return res.end();
    }

    // add an album to an artist
    if (
      req.method == 'POST' &&
      req.url.startsWith('/artists/') &&
      urlParts.length == 4 &&
      urlParts[3] == 'albums'
    ) {
      let newAlbumId = getNewAlbumId();
      let { name } = req.body;
      let artistId = urlParts[2];
      let newAlbum = {
        albumId: newAlbumId,
        name: name,
        artistId: artistId,
      };
      albums[newAlbumId] = newAlbum;
      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(newAlbum));
      return res.end();
    }
    // change album
    if (req.url.startsWith('/albums/') && urlParts.length == 3) {
      let albumId = urlParts[2];
      if (!albums[albumId]) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.write(
          JSON.stringify({
            message: 'album not found',
            statusCode: 404,
          })
        );
        return res.end();
      }
      if (req.method == 'PATCH') {
        let { name } = req.body;
        let album = albums[albumId];
        if (album) {
          album.name = name;
          album.updatedAt = Date.now();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(album));
          return res.end();
        }
      }

      // delete an album
      if (req.method == 'DELETE') {
        delete albums[albumId];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(
          JSON.stringify({
            message: 'deleted album successfully',
          })
        );
        return res.end();
      }
    }

    if (
      req.url.startsWith('/albums/') &&
      urlParts.length == 4 &&
      urlParts[3] == 'songs'
    ) {
      let albumId = urlParts[2];
      if (!albums[albumId]) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.write(
          JSON.stringify({
            message: "album doesn't exist",
          })
        );
        return res.end();
      }
      if (req.method == 'GET') {
        let songsInAlbum = Object.values(songs).filter(
          (song) => song.albumId == albumId
        );
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(songsInAlbum));
        return res.end();
      }

      if (req.method == 'POST') {
        let { name, lyrics, trackNumber } = req.body;
        let newSongId = getNewSongId();
        let newSong = {
          songId: newSongId,
          name: name,
          lyrics: lyrics,
          trackNumber: trackNumber,
          albumId: albumId,
        };
        songs[newSongId] = newSong;
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(newSong));
        return res.end();
      }
    }

    // get a song with a track number
    if (
      req.method == 'GET' &&
      req.url.startsWith('/trackNumber') &&
      urlParts.length == 4 &&
      urlParts[3] == 'songs'
    ) {
      let trackNumber = urlParts[2];
      let song = Object.values(songs).find(
        (song) => song.trackNumber == trackNumber
      );
      if (song) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(song));
        return res.end();
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.write(
          JSON.stringify({
            message: 'cannot find the track',
            statusCode: 404,
          })
        );
        return res.end();
      }
    }

    if (req.url.startsWith('/songs/') && urlParts.length == 3) {
      let songId = urlParts[2];

      let song = songs[songId];
      if (!song) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.write(
          JSON.stringify({
            message: 'Unable to find song',
            statusCode: 404,
          })
        );
        return res.end();
      }
      if (req.method == 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(song));
        return res.end();
      }

      if (req.method == 'PATCH') {
        let { name, lyrics, trackNumber } = req.body;
        song.name = name;
        song.lyrics = lyrics;
        song.trackNumber = trackNumber;
        song.updatedAt = Date.now();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(song));
        return res.end();
      }

      if (req.method == 'DELETE') {
        delete songs[songId];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write({
          message: 'song deleted successfully',
        });
        return res.end();
      }
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write('Endpoint not found');
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
