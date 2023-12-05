import { Feature } from 'ol';
import { Fill, RegularShape, Stroke, Style } from 'ol/style';

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

// Style
const getStyle = (feature: Feature) => {
	return [
		new Style({
			image: new RegularShape({
				fill: new Fill({ color: [0, 0, 255, 0.4] }),
				stroke: new Stroke({ color: [0, 0, 255, 1], width: 1 }),
				radius: feature.get('radius') || 10,
				points: 3,
				angle: feature.get('angle') || 0,
			}),
			fill: new Fill({ color: [0, 0, 255, 0.4] }),
			stroke: new Stroke({ color: [0, 0, 255, 1], width: 1 }),
		}),
	];
};

export { writeCircleGeometry, getStyle };
