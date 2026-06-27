import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

// Redux slice for trips.
// A "slice" bundles the state, reducers, and actions for one feature.
// Redux Toolkit is the modern, recommended way to write Redux.

// --- Async thunks ---
// A thunk lets us do async work (API calls) inside Redux.
// Each thunk auto-generates three actions: pending / fulfilled / rejected.
// We handle all three in extraReducers so the UI can react to every stage.

// Fetch all trips belonging to the logged-in user
export const fetchTrips = createAsyncThunk('trips/fetchTrips', async () => {
    const response = await api.get('/trips');
    return response.data; // becomes action.payload in the "fulfilled" case
});

// Create a new trip
export const addTrip = createAsyncThunk('trips/addTrip', async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data;
});

// Update an existing trip
export const updateTrip = createAsyncThunk('trips/updateTrip', async ({ id, tripData }) => {
    const response = await api.put(`/trips/${id}`, tripData);
    return response.data;
});

// Delete a trip by id
export const deleteTrip = createAsyncThunk('trips/deleteTrip', async (tripId) => {
    await api.delete(`/trips/${tripId}`);
    return tripId; // return the id so the reducer knows which item to remove
});

const tripsSlice = createSlice({
    name: 'trips',
    initialState: {
        items: [],      // the list of trips shown in the UI
        loading: false, // true while fetchTrips is in flight
        error: null     // holds an error message when any operation fails
    },
    reducers: {
        // Synchronous action to clear the error banner from the UI.
        // Dispatched by Dashboard on mount so stale errors don't linger.
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // --- fetchTrips ---
            .addCase(fetchTrips.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTrips.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchTrips.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // --- addTrip ---
            .addCase(addTrip.fulfilled, (state, action) => {
                state.error = null;
                state.items.push(action.payload);
            })
            .addCase(addTrip.rejected, (state, action) => {
                state.error = action.error.message;
            })

            // --- updateTrip ---
            .addCase(updateTrip.fulfilled, (state, action) => {
                state.error = null;
                const index = state.items.findIndex((t) => t._id === action.payload._id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(updateTrip.rejected, (state, action) => {
                state.error = action.error.message;
            })

            // --- deleteTrip ---
            .addCase(deleteTrip.fulfilled, (state, action) => {
                state.error = null;
                state.items = state.items.filter((t) => t._id !== action.payload);
            })
            .addCase(deleteTrip.rejected, (state, action) => {
                state.error = action.error.message;
            });
    }
});

export const { clearError } = tripsSlice.actions;
export default tripsSlice.reducer;