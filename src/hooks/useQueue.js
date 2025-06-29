import { useState, useEffect, useRef } from 'react';
import * as spotifyApi from '../api/spotifyApi';

export default function useQueue(refreshInterval = 5000) {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef();

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await spotifyApi.fetchQueue();
      setQueue(res.data);
    } catch (e) {
      // Optionally handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    intervalRef.current = setInterval(fetchQueue, refreshInterval);
    return () => clearInterval(intervalRef.current);
  }, [refreshInterval]);

  return { queue, isLoading, fetchQueue };
}
