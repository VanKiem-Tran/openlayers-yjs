import * as React from 'react';
import { useEffect } from 'react';
import Draw from 'ol/interaction/Draw.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { Vector as VectorSource, XYZ } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import KML from 'ol/format/KML.js';
import { Circle } from 'ol/geom';
import { Feature } from 'ol';
import useYjsStore from './hooks/useYjsStore';
import { Select, Button } from 'antd'
import * as uuid from 'uuid';
import { isArray } from 'lodash-es';

let draw: Draw;

const raster = new TileLayer({
	source: new XYZ(),
});
raster.setBackground('black');


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
		center: [0, 0],
		projection: 'EPSG:3857',
		zoom: 10,
	}),
});

function App() {
  const { yArray, push, redo, undo, remove, undoManager } =
		useYjsStore('WINU-0725');

  yArray.observe((event) => {
    event.changes.added.forEach((added) => {
			const allFeatures = added.content.getContent();
      allFeatures.map((data) => {
        const featureData = JSON.parse(data);
				const drawType = featureData.geometry.type;

				if (drawType === 'Circle') {
					const circle = new Circle(
						featureData.geometry.center,
						featureData.geometry.radius
					);
					const circleFeature = new Feature(circle);
					source.addFeature(circleFeature);
				} else {
					const feature = new GeoJSON().readFeature(data);
					source.addFeature(feature as any);
				}
      });
		});

    event.changes.deleted.forEach((deleted) => {
      const allFeatures = deleted.content.getContent();

      allFeatures.map((data) => {
				const feature: any = new GeoJSON().readFeature(data);
        const featureId = feature.getId();

        const deletedFeature = source.getFeatureById(featureId);

        if (deletedFeature && !isArray(deletedFeature))
					source.removeFeature(deletedFeature);
			});
		});
  });

  undoManager.on('stack-item-updated', (event: any) => {
		console.log(event.stackItem);
	});

  const addInteraction = (
		value: 'Point' | 'Draw' | 'LineString' | 'Polygon' | 'Circle' | 'None'
	) => {
		if (value === 'None') {
      map.getInteractions().pop();
		} else {
      if (value === 'Draw') {
				draw = new Draw({
					source: source,
					type: 'LineString',
					freehand: true,
				});
			} else {
				draw = new Draw({
					source: source,
					type: value,
				});
			}
			map.addInteraction(draw);
    }
	};

  const writeCircleGeometry = (geometry: {
		getCenter: () => number;
		getRadius: () => number;
	}) => {
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

  const handleChange = (
		value: 'Point' | 'Draw' | 'LineString' | 'Polygon' | 'Circle' | 'None'
	) => {
		map.removeInteraction(draw);
		addInteraction(value);
	};

  const onRedo = () => {
    redo();
  };

  const onUndo = () => {
		undo();
	};

  const onRemove = () => {
		remove();
    source.refresh();
	};

  useEffect(() => {
		addInteraction('Point');
    draw.on('drawend', (event: { feature: {[x: string]: any; getGeometry: () => any } }) => {
      event.feature.setId(uuid.v4());
			const drawType = event.feature.getGeometry().getType();
			const geojson =
				drawType === 'Circle'
					? writeCircleGeometry(event.feature.getGeometry())
					: new GeoJSON().writeFeature(event.feature as any);

			push(geojson);
		});
	}, []);

  return (
		<>
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'black',
					padding: '10px',
				}}
			>
				<div
					style={{
						color: 'white',
						fontSize: '20px',
						fontWeight: 'bold',
						marginRight: '10px',
					}}
				>
					Geometry type:
				</div>
				<Select
					defaultValue="Point"
					style={{ width: 180 }}
					onChange={handleChange}
					options={[
						{ value: 'Point', label: 'Point' },
						{ value: 'Draw', label: 'Draw' },
						{ value: 'LineString', label: 'LineString' },
						{ value: 'Polygon', label: 'Polygon' },
						{ value: 'Circle', label: 'Circle' },
						{ value: 'None', label: 'None' },
					]}
				/>
				<Button onClick={onUndo}>Undo</Button>
				<Button onClick={onRedo}>Redo</Button>
				<Button onClick={onRemove}>Remove</Button>
			</div>
		</>
	);
}

export default App;
