import { useState, useEffect, useRef, useCallback } from 'react';
import * as spotifyApi from '../api/spotifyApi';

export default function useQueue(refreshInterval = 5000, autoRefresh = true) {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const intervalRef = useRef();
  const retryTimeoutRef = useRef();
  const consecutiveFailuresRef = useRef(0);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const res = await spotifyApi.fetchQueue();
      setQueue(res.data);
      setIsBackendOnline(true);
      consecutiveFailuresRef.current = 0;
      
      if (autoRefresh && !intervalRef.current) {
        intervalRef.current = setInterval(fetchQueue, refreshInterval);
      }
    } catch (e) {
      consecutiveFailuresRef.current++;
      
      if (e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED') {
        setIsBackendOnline(false);
        setConnectionError('Backend server is offline. Please start the backend server.');
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        const retryDelay = Math.min(1000 * Math.pow(2, consecutiveFailuresRef.current), 30000);
        retryTimeoutRef.current = setTimeout(() => {
          fetchQueue();
        }, retryDelay);
      } else {
        console.error('Error fetching queue:', e);
        setConnectionError('Failed to fetch queue data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshInterval, autoRefresh]);

  useEffect(() => {
    fetchQueue();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchQueue, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [fetchQueue, refreshInterval, autoRefresh]);

  useEffect(() => {
    if (autoRefresh) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchQueue, refreshInterval);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, fetchQueue]);

  return { queue, isLoading, isBackendOnline, connectionError, fetchQueue };
}
