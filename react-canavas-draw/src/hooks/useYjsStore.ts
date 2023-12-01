import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEffect, useMemo } from 'react';
import { useUsers } from 'y-presence';

export default function useYjsStore(drillHoleId: string) {
	const doc = useMemo(() => new Y.Doc(), [drillHoleId]);
	const wsProvider = useMemo(() => {
		return new WebsocketProvider(
			'wss://165.227.178.43/',
			drillHoleId,
			doc,
			{
				connect: false,
			}
		);
	}, [drillHoleId]);

	const users = useUsers(wsProvider.awareness);
	// console.log('users', users);

  const yArray: Y.Array<string> = doc.getArray('features'); 

  const undoManager = new Y.UndoManager(yArray);

	function undo() {
    if (undoManager.undoStack.length > 0) {
      undoManager.undo();
		}
	}

	function redo() {
		if (undoManager.redoStack.length > 0) {
			undoManager.redo();
		}
	}

  function handleRemoveData() {
		yArray.delete(0, yArray.length);
	}

  function handleAddData(data: string) {
    yArray.push([data]);
  }

  function removeById(id: string) {
    yArray.forEach((element, index) => {
      const featureData = JSON.parse(element);
      const featureId = featureData.id ?? '';

      if (featureId === id) {
        yArray.delete(index, 1);
      }
    });
	}

  useEffect(() => {
    wsProvider.connect();
  }, []);

	return {
		doc,
		wsProvider,
		yArray,
		handleAddData,
		undo,
		redo,
		handleRemoveData,
		removeById,
		users,
		undoManager,
	};
}
