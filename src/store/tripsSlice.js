import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

// Redux slice for trips
// A "slice" bundles together the state, the reducers (functions that change
// the state), and the actions for one feature - here, the trips.
// We use Redux Toolkit, which is the modern, recommended way to write Redux.

// Async thunks
// A "thunk" lets us do async work (API calls) inside Redux.
// Each thunk automatically creates 3 actions: pending / fulfilled / rejected,
// which we handle in extraReducers below to track loading and errors.

// Fetch all trips for the logged-in user
export const fetchTrips = createAsyncThunk('trips/fetchTrips', async () => {
    const response = await api.get('/trips');
    return response.data; // becomes action.payload in the "fulfilled" case
});

// Create a new trip
export const addTrip = createAsyncThunk('trips/addTrip', async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data;
});

// Delete a trip by id
export const deleteTrip = createAsyncThunk('trips/deleteTrip', async (tripId) => {
    await api.delete(`/trips/${tripId}`);
    return tripId; // we return the id so the reducer knows which one to remove
});

const tripsSlice = createSlice({
    name: 'trips',
    // The shape of this slice of the store.
    initialState: {
        items: [],        // the list of trips
        loading: false,   // true while a request is in flight (for loading UI)
        error: null       // holds an error message if a request fails
    },
    // Synchronous reducers would go here. We don't need any right now.
    reducers: {},
    // extraReducers handle the actions created by the thunks above.
    extraReducers: (builder) => {
        builder
            // fetchTrips
            .addCase(fetchTrips.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTrips.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload; // replace the list with the fetched trips
            })
            .addCase(fetchTrips.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // addTrip
            .addCase(addTrip.fulfilled, (state, action) => {
                state.items.push(action.payload); // add the new trip to the list
            })
            // deleteTrip
            .addCase(deleteTrip.fulfilled, (state, action) => {
                // action.payload is the deleted trip id; keep everything except it
                state.items = state.items.filter((trip) => trip._id !== action.payload);
            });
    }
});

export default tripsSlice.reducer;