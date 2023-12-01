import create from 'zustand';

interface UndoState {
	addedFeatureIds: string[];
  removedFeatureIds: {id: string, feature: string}[];

	addFeatureId: (id: string) => void;
	onUndoFeatureId: (feature: string) => void;
	onRedoFeatureId: () => void;
}

export const useUndoStore = create<UndoState>((set) => ({
	addedFeatureIds: [],
	removedFeatureIds: [],

	addFeatureId: (id: string) => {
		set((state) => ({
			addedFeatureIds: [...state.addedFeatureIds, id],
		}));
	},

	onUndoFeatureId: (feature) => {
		set((state) => {
      if (state.addedFeatureIds.length > 0) {
        const lastFeatureId =
					state.addedFeatureIds[state.addedFeatureIds.length - 1];
				return {
					addedFeatureIds: state.addedFeatureIds.slice(0, -1),
					removedFeatureIds: [
						...state.removedFeatureIds,
						{
							id: lastFeatureId,
              feature,
						},
					],
				};
      } else {
        return {
					addedFeatureIds: state.addedFeatureIds,
					removedFeatureIds: state.removedFeatureIds,
				};
      }
		});
	},

	onRedoFeatureId: () => {
		set((state) => {
      if (state.removedFeatureIds.length > 0) {
        const lastFeatureId =
					state.removedFeatureIds[state.removedFeatureIds.length - 1].id;
        return {
					addedFeatureIds: [...state.addedFeatureIds, lastFeatureId],
					removedFeatureIds: state.removedFeatureIds.slice(0, -1),
				};
      } else {
        return {
					addedFeatureIds: state.addedFeatureIds,
					removedFeatureIds: state.removedFeatureIds,
				};
      }
		});
	},
}));
