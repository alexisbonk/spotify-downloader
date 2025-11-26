import { useState, useEffect, useRef } from 'react';
import * as spotifyApi from '../api/spotifyApi';

export default function useQueue(refreshInterval = 5000, autoRefresh = true) {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef();

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await spotifyApi.fetchQueue();
      setQueue(res.data);
    } catch (e) {
      console.error('Error fetching queue:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchQueue, refreshInterval);
      return () => clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshInterval, autoRefresh]);

  return { queue, isLoading, fetchQueue };
}
