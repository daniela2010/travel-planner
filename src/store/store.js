import { configureStore } from '@reduxjs/toolkit';
import tripsReducer from './tripsSlice';

// The Redux store
// This is the single central "store" that holds the app's shared state.
// configureStore (from Redux Toolkit) sets everything up for us.
// We register our trips reducer under the key "trips", so in components
// we read it with: useSelector((state) => state.trips)
const store = configureStore({
    reducer: {
        trips: tripsReducer
    }
});

export default store;