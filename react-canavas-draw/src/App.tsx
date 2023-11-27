import * as React from 'react';
import { useEffect, } from 'react';
import { io } from 'socket.io-client';
import Draw from 'ol/interaction/Draw.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Circle } from 'ol/geom';
import KML from 'ol/format/KML.js';
import { Feature } from 'ol';

export const socket = io('ws://localhost:1337');

let draw: Draw;

const raster = new TileLayer({
	source: new OSM(),
});

const source = new VectorSource({
    url: "src/data/kmlData.kml",
    format: new KML(),
  })

const vector = new VectorLayer({
	source: source,
});

const map = new Map({
	layers: [raster, vector],
	target: 'map',
	view: new View({
		center: [876970.8463461736, 5859807.853963373],
		projection: 'EPSG:3857',
		zoom: 10,
	}),
});

const typeSelect = document.getElementById('type') as any;

	function addInteraction() {
		const value = typeSelect.value;
		if (value !== 'None') {
			if (value === 'Draw') {
				draw = new Draw({
					source: source,
					type: 'LineString',
					freehand: true,
				});
			} else {
				draw = new Draw({
					source: source,
					type: typeSelect.value,
				});
			}
			map.addInteraction(draw);
		}

    const writeCircleGeometry = (geometry: { getCenter: () => number; getRadius: () => number }) => {
			const geometryData = {
				type: 'Circle',
				center: geometry.getCenter(),
				radius: geometry.getRadius(),
			};

      const geojson = {
				type: 'Feature',
				geometry: geometryData,
				properties: null,
			};

			return JSON.stringify(geojson);
		};

		draw.on('drawend', (event: { feature: { getGeometry: () => any } }) => {
      const drawType = event.feature.getGeometry().getType();

      const geojson =
				drawType === 'Circle'
          ? writeCircleGeometry(event.feature.getGeometry())
					: new GeoJSON().writeFeature(event.feature as any);

			socket.emit('send-geometry', geojson);
		});
	}
	addInteraction();

	typeSelect.onchange = function () {
		map.removeInteraction(draw);
		addInteraction();
	};

function App() {
  useEffect(() => {
    socket.emit('join', {name: 'WINU-0725'});
    socket.on('geometry', (data) => {
      const featureData = JSON.parse(data);
      const drawType = featureData.geometry.type;
      
      if (drawType === 'Circle') {
        const circle = new Circle(featureData.geometry.center, featureData.geometry.radius);
        const circleFeature = new Feature(circle);

         source.addFeature(circleFeature);
      } else {
        const feature =  new GeoJSON().readFeature(data);
        source.addFeature(feature as any);
      }
    });

    return () => {
      socket.off('geometry', (data) => {
				console.log(data);
			});
    };
  }, []);

  return (
    <></>
  );
}

export default App;
