import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

// Custom hook: useFetch
// Encapsulates the repeating pattern of "call the API + track loading + track error"
// into one reusable function. Any component can fetch data with a single line:
//
//   const { data, loading, error, refetch } = useFetch('/trips/123');
//
// This keeps components clean and guarantees every fetch has proper
// loading and error states (a UX grading requirement).
export const useFetch = (url) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useCallback keeps the function reference stable so the effect below
    // only re-runs when the URL actually changes.
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(url);
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false); // always runs — success or failure
        }
    }, [url]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // refetch lets the caller manually reload the data (e.g. after an update)
    return { data, loading, error, refetch: fetchData };
};
