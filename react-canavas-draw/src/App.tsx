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
import { useUndoStore } from './hooks/useUndoStore';
import { getStyle, writeCircleGeometry } from './utils/tools';
import Transform from 'ol-ext/interaction/Transform';
import { shiftKeyOnly } from 'ol/events/condition';
import { Fill, RegularShape, Stroke, Style, Text } from 'ol/style';

let draw: Draw;

const interaction = new Transform({
	enableRotatedTransform: true,
	addCondition: shiftKeyOnly,
	hitTolerance: 2,
	translateFeature: true,
	scale: true,
	rotate: true,
	keepAspectRatio: undefined,
	keepRectangle: false,
	translate: false,
	stretch: true,
	pointRadius: function (f) {
		const radius = f.get('radius') || 10;
		return [radius, radius];
	},
});

const raster = new TileLayer({
	source: new XYZ(),
});
raster.setBackground('black');


const source = new VectorSource({
	url: 'https://res.cloudinary.com/drh6sa2x5/raw/upload/v1701333403/kmlData_kbpxhd.kml',
	format: new KML(),
});

const vector = new VectorLayer({
	source: source,
  // style: getStyle as any,
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
	const {
		addedFeatureIds,
		removedFeatureIds,
		addFeatureId,
		onUndoFeatureId,
		onRedoFeatureId,
	} = useUndoStore();
	const { yArray, handleAddData, removeById, removeAll } = useYjsStore('WINU-0725');

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
					circleFeature.setId(featureData.id ?? '');
					source.addFeature(circleFeature);
				} else {
					const feature = new GeoJSON().readFeature(data);
					source.addFeature(feature as any);
				}
			});
		});

		event.changes.deleted.forEach((deleted) => {
			const data = deleted.content.getContent()[0];

			const featureData = JSON.parse(data);
			const drawType = featureData.geometry.type;

			if (drawType === 'Circle') {
				const featureId = featureData.id ?? '';

				const deletedFeature = source.getFeatureById(featureId);
				if (deletedFeature && !isArray(deletedFeature)) {
					source.removeFeature(deletedFeature);
				}
			} else {
				const feature: any = new GeoJSON().readFeature(data);
				const featureId = feature.getId();

				const deletedFeature = source.getFeatureById(featureId);

				if (deletedFeature && !isArray(deletedFeature))
					source.removeFeature(deletedFeature);
			}
		});
	});

	const addInteraction = (
		value?: 'Point' | 'Draw' | 'LineString' | 'Polygon' | 'Circle' | 'Select'
	) => {
		if (value === 'Select') {
			map.getInteractions().pop();
      map.addInteraction(interaction);
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
					type: value ?? 'Point',
				});
			}
			map.addInteraction(draw);
		}

		draw.on(
			'drawend',
			(event: { feature: { [x: string]: any; getGeometry: () => any } }) => {
				const featureId = uuid.v4();
				event.feature.setId(featureId);

				addFeatureId(featureId);
				const drawType = event.feature.getGeometry().getType();

				if (drawType === 'Circle') {
					const geojson = writeCircleGeometry(event.feature.getGeometry());
					const featureData = JSON.parse(geojson);
					featureData.id = featureId;
					handleAddData(JSON.stringify(featureData));
				} else {
					handleAddData(new GeoJSON().writeFeature(event.feature as any));
				}
			}
		);
	};

  const setHandleStyle = () => {
		// Style the rotate handle
		const circle = new RegularShape({
			fill: new Fill({ color: [255, 255, 255, 0.01] }),
			stroke: new Stroke({ width: 1, color: [0, 0, 0, 0.01] }),
			radius: 8,
			points: 10,
		});
		interaction.setStyle(
			'rotate',
			new Style({
				text: new Text({
					text: '\uf0e2',
					font: '16px Fontawesome',
					textAlign: 'left',
					fill: new Fill({ color: 'red' }),
				}),
				image: circle,
			})
		);
		// Center of rotation
		interaction.setStyle(
			'rotate0',
			new Style({
				text: new Text({
					text: '\uf0e2',
					font: '20px Fontawesome',
					fill: new Fill({ color: [255, 255, 255, 0.8] }),
					stroke: new Stroke({ width: 2, color: 'red' }),
				}),
			})
		);
		// Style the move handle
		interaction.setStyle(
			'translate',
			new Style({
				text: new Text({
					text: '\uf047',
					font: '20px Fontawesome',
					fill: new Fill({ color: [255, 255, 255, 0.8] }),
					stroke: new Stroke({ width: 2, color: 'red' }),
				}),
			})
		);
		// Refresh
		interaction.set('translate', interaction.get('translate'));
	}

	const handleChange = (
		value: 'Point' | 'Draw' | 'LineString' | 'Polygon' | 'Circle' | 'Select'
	) => {
		map.removeInteraction(draw);
		addInteraction(value);
	};

	const onUndo = () => {
		const featureId = addedFeatureIds[addedFeatureIds.length - 1];

		if (featureId) {
			const feature: any = source.getFeatureById(featureId);
			const drawType = feature.getGeometry().getType();

			removeById(featureId);

			if (drawType === 'Circle') {
				const geometry = feature?.getGeometry();
				const geojson = writeCircleGeometry(geometry);
				const featureData = JSON.parse(geojson);
				featureData.id = featureId;
				onUndoFeatureId(JSON.stringify(featureData));
			} else {
				onUndoFeatureId(new GeoJSON().writeFeature(feature));
			}
		}
	};

	const onRedo = () => {
		const featureId = removedFeatureIds[removedFeatureIds.length - 1]?.id;

		if (featureId) {
			const feature = removedFeatureIds[removedFeatureIds.length - 1].feature;
			handleAddData(feature);
			onRedoFeatureId();
		}
	};

	const onRemove = () => {
		addedFeatureIds?.map((featureId) => {
			if (featureId) {
				const feature: any = source.getFeatureById(featureId);
				const drawType = feature.getGeometry().getType();

				removeById(featureId);
				if (drawType === 'Circle') {
					const geometry = feature?.getGeometry();
					const geojson = writeCircleGeometry(geometry);
					const featureData = JSON.parse(geojson);
					featureData.id = featureId;
					onUndoFeatureId(JSON.stringify(featureData));
				} else {
					onUndoFeatureId(new GeoJSON().writeFeature(feature));
				}
			}
		});

    // clear all shapes
    removeAll();
    source.refresh()
	};

	useEffect(() => {
		addInteraction();
    setHandleStyle();
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
						{ value: 'Select', label: 'Select' },
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
