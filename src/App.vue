<script setup>
import { ref, onMounted } from 'vue';

import * as GeoTIFF from 'geotiff';
import proj4 from 'proj4';
import createColormap from 'colormap';

// Returns a range-limited number {n} between {min} and {max}
// @param {number} n - Current Value
// @param {number} min - Minimum Value
// @param {number} max - Maximum Value
// @returns {number}

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const options = {
  geotiff: {
      //bbox: [5.046, 42.9342, 7.2733, 44.1586], // Côte d'Azur
      bbox: [-1.406250, 40.647304, 22.236328, 54.007769], // Europe
      //bbox: [1.351318,48.494768,3.339844,49.260635], // Paris(ish)
      //bbox: [-51.108398,52.241256,-11.821289,54.316523], // Tiny bit of UK, Ireland and a bit of the Atlantic
      resolution: [100, 100],
      //url: 'https://eox-ideas.s3.eu-central-1.amazonaws.com/ideas_data/AR2_wildlife_simplify_COG_b1_t_final.tif',
      url: 'https://eox-ideas.s3.eu-central-1.amazonaws.com/GHS_POP_E2020_GLOBE_R2023A_4326_3ss_V1_0_3857_COG_DEFLATE_cutout.tif',
      //url: 'https://eox-ideas.s3.eu-central-1.amazonaws.com/gfs_waves_test.tif',
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

  return color;
}

function convertRasterToGlobePoints(rasterValues, bounds, dimensions) {
  const [west, south, east, north] = bounds;
  const [width, height] = dimensions;

  // Calculate the step size for each pixel.
  const latStep = (north - south) / height;
  const lngStep = (east - west) / width;

  const annotatedRaster = [];

  // Get the data array
  let data = rasterValues[0];
  let flippedData = new Array(data.length);

  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
          const value = data[y * width + (width - 1 - x)];
          flippedData[y * width + x] = value;

          // Calculate the latitude and longitude for the current pixel.
          const lat = south + (y * latStep);
          const lng = west + (x * lngStep);
          
          if (!isNaN(value)) {
              annotatedRaster.push({
                  value,
                  lat,
                  lng,
                  size: value * 0.1,
                  color: getColor(value),
              });
          }
      }
  }

  console.log(annotatedRaster);

  return annotatedRaster;
}

onMounted(async () => {
  const image = await loadGeoTiff(options.geotiff.url);

  // Convert geographic coordinates to distances using EPSG:3857
  const bbox = options.geotiff.bbox;

  console.log(image.geoKeys.ProjectedCSTypeGeoKey);

  if (image.geoKeys.ProjectedCSTypeGeoKey !== 3857) {
    const xmin = proj4(options.geotiff.projection, 'EPSG:3857', [bbox[0], bbox[1]]);
    const xmax = proj4(options.geotiff.projection, 'EPSG:3857', [bbox[2], bbox[3]]);

    bbox[0] = xmin[0];
    bbox[1] = xmin[1];
    bbox[2] = xmax[0];
    bbox[3] = xmax[1];
  }

  var gameSize = 20;
  var width = gameSize;
  var height = gameSize;

  // Read the GeoTIFF data into a 1-dimensional array
  const [oX, oY] = image.getOrigin();
  const [imageResX, imageResY] = image.getResolution(image);

  let wnd = [
      Math.round((bbox[0] - oX) / imageResX),
      Math.round((bbox[1] - oY) / imageResY),
      Math.round((bbox[2] - oX) / imageResX),
      Math.round((bbox[3] - oY) / imageResY),
  ];
  
  wnd = [
    Math.min(wnd[0], wnd[2]),
    Math.min(wnd[1], wnd[3]),
    Math.max(wnd[0], wnd[2]),
    Math.max(wnd[1], wnd[3]),
  ];

  console.log(wnd);

  let raster = await image.readRasters({
    window: wnd,
    width: width,
    height: height,
  });
  
  console.log(raster);

  const pointsData = convertRasterToGlobePoints(raster, options.geotiff.bbox, [options.geotiff.width, options.geotiff.height]);

  document.getElementById('globe').setAttribute('globe', {
    pointsData,
    pointAltitude: 'size',
    pointColor: 'color',
  });
})
</script>

<template>
  <a-scene
      vr-mode-ui="enabled: false;"
      stats
      arjs="trackingMethod: best; sourceType: webcam; debugUIEnabled: false;"
    >
      <a-entity camera></a-entity>

      <a-marker type="pattern" url="./patterns/hiro.patt">
        <a-entity id="globe" scale="0.025 0.025 0.025" globe="
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
