import { useState, useEffect } from 'react';

export const useFavorites = (userID) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    if (!userID) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/favorites/user/${userID}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
    setLoading(false);
  };

  const addToFavorites = async (eventID) => {
    // เพิ่มการ debug
    console.log('Adding to favorites:', { userID, eventID });
    
    if (!userID || !eventID) {
      console.error('Missing userID or eventID:', { userID, eventID });
      return false;
    }
    
    try {
      const payload = { 
        user_id: parseInt(userID), 
        event_id: parseInt(eventID) 
      };
      
      console.log('Sending payload:', payload);
      
      const res = await fetch('http://localhost:8080/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', res.status);
      
      if (res.ok) {
        await fetchFavorites(); // รีเฟรชรายการ
        return true;
      } else {
        const errorData = await res.text();
        console.error('API Error:', errorData);
      }
    } catch (error) {
      console.error('Failed to add to favorites:', error);
    }
    return false;
  };

  const removeFromFavorites = async (eventID) => {
    // เพิ่มการ debug
    console.log('Removing from favorites:', { userID, eventID });
    
    if (!userID || !eventID) {
      console.error('Missing userID or eventID:', { userID, eventID });
      return false;
    }
    
    try {
      const payload = { 
        user_id: parseInt(userID), 
        event_id: parseInt(eventID) 
      };
      
      console.log('Sending remove payload:', payload);
      
      const res = await fetch('http://localhost:8080/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('Remove response status:', res.status);
      
      if (res.ok) {
        await fetchFavorites(); // รีเฟรชรายการ
        return true;
      } else {
        const errorData = await res.text();
        console.error('API Remove Error:', errorData);
      }
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
    }
    return false;
  };

  const checkIsFavorite = (eventID) => {
    return favorites.some(fav => fav.event_id === parseInt(eventID));
  };

  useEffect(() => {
    fetchFavorites();
  }, [userID]);

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    checkIsFavorite,
    fetchFavorites,
  };
};