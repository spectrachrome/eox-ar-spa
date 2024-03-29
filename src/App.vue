<script setup>
//import aframe from 'aframe';
//import 'aframe-ar';

import HelloWorld from './components/HelloWorld.vue'

const options = {
    geotiff: {
        bbox: [5.046, 42.9342, 7.2733, 44.1586], // Côte d'Azur
        resolution: [100, 100],
        url: 'https://eox-ideas.s3.eu-central-1.amazonaws.com/ideas_data/AR2_wildlife_simplify_COG_b1_t_final.tif',
        projection: 'EPSG:4326',
        width: 20,
        height: 10,
    },
};

async function loadGeoTiff(url) {
    const tiff = await GeoTIFF.fromUrl(url);
    const image = await tiff.getImage();
    return image;
}

function toGeoCoords(x_pixel, y_pixel, GT) {
    const longitude = GT[0] + x_pixel * GT[1] + y_pixel * GT[2];
    const latitude = GT[3] + x_pixel * GT[4] + y_pixel * GT[5];
    return [longitude, latitude];
}

function getColorStops(name, min, max, steps, reverse) {
  const stops = new Array(steps);
  const colors = createColormap({
    colormap: name, nshades: steps, format: 'hex',
  });
  if (reverse) {
    colors.reverse();
  }
  for (let i = 0; i < steps; i++) {
    stops[i] = colors[i];
  }
  return stops;
}

function getColor(value) {
  const steps = 10;
  const min = 0;
  const max = 15;
  const testcm = getColorStops('viridis', 0, 1, steps);

  const f = clamp((value - min) / (max - min), 0, 1);
  const color = testcm[Math.round(f * (steps - 1))];
  console.log(color);
}

function convertRasterToGlobePoints(rasterValues, bounds, dimensions) {
  const [west, south, east, north] = bounds;
  const [width, height] = dimensions;

  console.log(width);
  console.log(height);

  // Calculate the step size for each pixel.
  const latStep = (north - south) / height;
  const lngStep = (east - west) / width;

  console.log(latStep);
  console.log(lngStep);

  const annotatedRaster = [];

  // Get the data array
  let data = rasterValues[0];
  let flippedData = new Array(data.length);

  for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < width; x++) {
          const value = data[y * width + (width - 1 - x)];
          flippedData[y * width + x] = value;

          // Calculate the latitude and longitude for the current pixel.
          const lat = south + (y * latStep);
          const lng = west + (x * lngStep);

          // console.log(`north: ${north}, rowIndex: ${rowIndex}, colIndex: ${Math.floor(colIndex / width)}, lat: ${lat}, lng: ${lng}`)
          
          if (!isNaN(value)) {
              annotatedRaster.push({
                  value,
                  lat,
                  lng,
                  size: Math.random() / 3,
                  color: getColor(value),
                  //color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)],
              });
          }
      }
  }

  console.log(flippedData)

  return annotatedRaster;
}
</script>

<template>
  <a-scene
      vr-mode-ui="enabled: false;"
      stats
      arjs="trackingMethod: best; sourceType: webcam; debugUIEnabled: false;"
    >
      <a-entity camera></a-entity>

      <a-marker type="pattern" url="./patterns/hiro.patt">
        <a-entity id="globe" scale="0.006 0.006 0.006" globe="
        globe-image-url: //unpkg.com/three-globe/example/img/earth-dark.jpg;
        bump-image-url: //unpkg.com/three-globe/example/img/earth-topology.png;
      "></a-entity>
      </a-marker>
    </a-scene>
</template>

<script>

</script>


<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
