export type YStatus = 'disconnected' | 'connecting' | 'connected';

export type FeatureData = {
	geometry: {
		type: string;
		coordinates: number[];
		center?: number[];
		radius?: number;
	};
	properties: {
		radius?: number;
		color?: string;
	} | null;
	id: string;
	type: string;
}