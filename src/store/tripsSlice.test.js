import reducer, {
  addTrip,
  deleteTrip,
  fetchTrips,
  updateTrip
} from './tripsSlice';

describe('trips reducer', () => {
  test('tracks loading and stores fetched trips', () => {
    const loadingState = reducer(undefined, { type: fetchTrips.pending.type });
    expect(loadingState.loading).toBe(true);
    expect(loadingState.error).toBeNull();

    const trips = [{ _id: 'trip-1', destination: 'Tokyo' }];
    const loadedState = reducer(loadingState, {
      type: fetchTrips.fulfilled.type,
      payload: trips
    });

    expect(loadedState.loading).toBe(false);
    expect(loadedState.items).toEqual(trips);
  });

  test('adds and updates a trip', () => {
    const original = { _id: 'trip-1', destination: 'Tokyo' };
    const addedState = reducer(undefined, {
      type: addTrip.fulfilled.type,
      payload: original
    });

    const updated = { ...original, destination: 'Kyoto' };
    const updatedState = reducer(addedState, {
      type: updateTrip.fulfilled.type,
      payload: updated
    });

    expect(updatedState.items).toEqual([updated]);
  });

  test('removes a deleted trip', () => {
    const state = {
      items: [
        { _id: 'trip-1', destination: 'Tokyo' },
        { _id: 'trip-2', destination: 'Rome' }
      ],
      loading: false,
      error: null
    };

    const nextState = reducer(state, {
      type: deleteTrip.fulfilled.type,
      payload: 'trip-1'
    });

    expect(nextState.items).toEqual([{ _id: 'trip-2', destination: 'Rome' }]);
  });

  test('stores a rejected request error', () => {
    const nextState = reducer(undefined, {
      type: fetchTrips.rejected.type,
      error: { message: 'Network error' }
    });

    expect(nextState.loading).toBe(false);
    expect(nextState.error).toBe('Network error');
  });
});
