import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEffect, useMemo } from 'react';
import { useUsers } from 'y-presence';

export default function useYjsStore(drillHoleId: string) {
	const doc = useMemo(() => new Y.Doc(), [drillHoleId]);
	const wsProvider = useMemo(() => {
		return new WebsocketProvider(
			'ws://localhost:1337',
			drillHoleId,
			doc,
			{
				connect: false,
			}
		);
	}, [drillHoleId]);
	const users = useUsers(wsProvider.awareness);
	// console.log('users', users);
	useEffect(() => {
		wsProvider.connect();
	}, []);
	const yGeojsons: Y.Map<string> = doc.getMap('geojson');
	const undoManager = new Y.UndoManager([yGeojsons]);

	return {
		doc,
		wsProvider,
		yGeojsons,
		undoManager,
		users,
	};
}
