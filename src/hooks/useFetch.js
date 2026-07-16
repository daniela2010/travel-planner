import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

/**
 * Fetches API data and tracks loading and error state.
 * @param {string} url API path relative to the configured Axios base URL.
 * @returns {{data: any, loading: boolean, error: string|null, refetch: Function}}
 */
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
