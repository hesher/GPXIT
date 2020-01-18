const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
// const cors = require('cors');
const multer = require('multer');
const {promisfy} = require('promisfy');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileSize: 1000
});

const app = express();
// const gpxParse = require('gpx-parse');
const FitParser = require('fit-file-parser').default;

let savedFiles = null;

function fitParse(content, next, req, res) {
  const fitParser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'km',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'cascade'
  });

  return fitParser.parse(content, (error, data) => {
    // Handle result of parse method
    if (error) {
      next(error);
    } else {
      const {records} = data.activity.sessions[0].laps[0];

      const heartBeats = records.map(record => ({
        y: record.heart_rate,
        x: record.timer_time
      }));
      const chartData = [
        {
          id: 'heart_rate',
          data: heartBeats
        }
      ];
      res.send(chartData);
    }
  });
}

app.use(express.static('dist'));

app.use(bodyParser.json());
// app.use(cors);

app.get('/api/fit', async (req, res, next) => {
  const fitPath = './test.fit';
  if (!fs.existsSync(fitPath)) {
    next(`The file ${fitPath} doesn't exist`);
  }
  if (savedFiles != null) {
    // savedFiles.forEach(file => fitParse(file.buffer, next, req, res));
    const files = savedFiles.map(file => ({
      name: file.originalname,
      content: file.buffer
    }));

    const fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'cascade'
    });

    const parseFit = promisfy(fitParser.parse, fitParser);

    const datumPromises = files.map(file => {
      return parseFit(file.content).then(data => {
        // Handle result of parse method
        const {records} = data.activity.sessions[0].laps[0];

        const heartBeats = records.map(record => ({
          y: record.heart_rate,
          x: record.timer_time
        }));
        return {
          id: file.name,
          data: heartBeats
        };
      });
    });

    Promise.all(datumPromises)
      .then(datum => res.send(datum))
      .catch(next);
  } else {
    return fs.readFile(fitPath, (err, content) => {
      return fitParse(content, next, req, res);
    });
  }
});

app.post('/api/upload', upload.array('files'), async (req, res, next) => {
  if (req.files !== undefined) {
    savedFiles = req.files;
    console.log('test ', req.files);
    res.end();
  } else {
    next('Body was empty');
  }
});

app.listen(process.env.PORT || 8080, () =>
  console.log(`Listening on port ${process.env.PORT || 8080}!`)
);
