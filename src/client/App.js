/* eslint-disable no-restricted-syntax */
import './App.css';
import React, {useState, useEffect} from 'react';

import {ResponsiveLineCanvas} from '@nivo/line';

const refresh = onDone => {
  return fetch('/api/fit').then(async response => {
    if (response.ok) {
      const responseData = await response.json();
      onDone(responseData);
    } else {
      throw Error(`${response.status}: ${response.statusText}`);
    }
  });
};
export default function App() {
  const [data, setData] = useState([]);
  useEffect(() => {
    refresh(setData);
  }, []);

  console.log({data});
  return (
    <span className="app-container">
      <FileUploader onSetFileData={setData} />
      {data.length > 0 ? (
        <ResponsiveLineCanvas
          data={data}
          yScale={{
            type: 'linear',
            min: 'auto'
          }}
          curve="cardinal"
          enablePoints={false}
          xScale={{
            type: 'linear'
            // format: '%s',
            // precision: 'second'
          }}
          margin={{
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
          }}
          // gridXValues={[0, 20, 40, 60, 80, 100, 120]}
          // gridYValues={[60, 80, 100, 120, 140, 160, 180]}
          axisBottom={{
            // tickValues: 'every 50 seconds',
            // tickSize: 1
            tickPadding: 10
            // tickRotation: 0,
            // format: '.2f',
            // legend: 'price',
            // legendOffset: 36,
            // legendPosition: 'middle'
          }}
        />
      ) : null}
    </span>
  );
}

const FileUploader = ({onSetFileData}) => {
  const [files, setFiles] = useState();
  return (
    <span className="file-uploader">
      <input
        type="file"
        name="file"
        accept=".fit"
        multiple="multiple"
        onChange={event => {
          setFiles(event.target.files);
        }}
      />
      <button
        type="button"
        onClick={() => {
          if (files !== null) {
            const formData = new FormData();
            for (const file of files) {
              formData.append(`files`, file);
            }

            fetch('/api/upload', {
              // Your POST endpoint
              method: 'POST',
              body: formData // This is your file object
            })
              // .then(response => response.json())
              .then(success => {
                console.log(success); // Handle the success response object
                refresh(onSetFileData);
              })
              .catch(
                error => console.log(error) // Handle the error response object
              );
          } else {
            console.error('Tried to upload an empty file');
          }
        }}>
        Upload
      </button>
    </span>
  );
};
