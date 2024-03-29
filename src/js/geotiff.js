const options = {
    geotiff: {
        bbox: [5.046, 42.9342, 7.2733, 44.1586], // Côte d'Azur
        // bbox: [-1.406250, 40.647304, 22.236328, 54.007769], // Europe
        resolution: [100, 100],
        // url: 'https://eox-ideas.s3.eu-central-1.amazonaws.com/GHS_POP_E2020_GLOBE_R2023A_4326_3ss_V1_0_3857_COG_DEFLATE_cutout.tif',
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
/*
(async () => {
    console.log('hello');
    
    const image = await loadGeoTiff(options.geotiff.url);

    // Convert geographic coordinates to distances using EPSG:3857
    const bbox = options.geotiff.bbox;
    const xmin = proj4(options.geotiff.projection, 'EPSG:3857', [bbox[0], bbox[1]]);
    const xmax = proj4(options.geotiff.projection, 'EPSG:3857', [bbox[2], bbox[3]]);

    const xDistance = xmax[0] - xmin[0];
    const yDistance = xmax[1] - xmin[1];

    // compute the width of a single hex (gameSize), divided by 2 but multiply by ~1.155 to
    // account for the below mentioned hexagon wider than taller
    gameSize = 20;

    // Adjust board dimensions based on actual distances
    width = gameSize;
    height = gameSize;
    // Read the GeoTIFF data into a 1-dimensional array
    const [oX, oY] = image.getOrigin();
    const [imageResX, imageResY] = image.getResolution(image);

    let wnd = [
        Math.round((bbox[0] - oX) / imageResX),
        Math.round((bbox[1] - oY) / imageResY),
        Math.round((bbox[2] - oX) / imageResX),
        Math.round((bbox[3] - oY) / imageResY),
    ];
    console.log(wnd);
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
    const testArray = [pointsData[0], pointsData[pointsData.length - 1]];
    //console.log(pointsData);

      const N = 6000;
    const gData = [...Array(N).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 180 * 0.9,
      lng: (Math.random() - 0.5) * 360 / 1,
    }));
      const globeEntity = document.getElementById('globe');
      globeEntity.setAttribute('globe', {
        pointsData,
        //pointAltitude: 3,
        //pointColor: 'color',
      });

})().catch(err => {
    console.error(err);
});

*/
