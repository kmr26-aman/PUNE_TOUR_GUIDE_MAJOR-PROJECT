import { Request, Response } from 'express';
import axios from 'axios';
import { getCachedData, setCachedData } from '../services/cacheService';

let memoryWeather = 'Sunny';
let memoryTemp = 30;

const PUNE_LAT = 18.5204;
const PUNE_LON = 73.8567;

export const getWeather = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'places:weather:live';
    const cached = await getCachedData<{ weather: string; temp: number }>(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    // Fetch live weather data for Pune from Open-Meteo
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${PUNE_LAT}&longitude=${PUNE_LON}&current=temperature_2m,weather_code`
    );

    const current = response.data?.current;
    if (current) {
      const rawTemp = current.temperature_2m;
      const code = current.weather_code;

      // Map WMO codes: rain/drizzle/thunderstorm -> 'Rainy', else -> 'Sunny'
      const isRainy = [
        51, 53, 55, 56, 57, // Drizzle
        61, 63, 65, 66, 67, // Rain
        80, 81, 82,         // Rain showers
        85, 86,             // Snow showers
        95, 96, 99          // Thunderstorm
      ].includes(code);

      const weather = isRainy ? 'Rainy' : 'Sunny';
      const temp = Math.round(rawTemp);

      memoryWeather = weather;
      memoryTemp = temp;

      const weatherResult = { weather, temp };
      
      // Cache for 15 minutes (900 seconds)
      await setCachedData(cacheKey, weatherResult, 900);

      return res.json(weatherResult);
    }

    res.json({ weather: memoryWeather, temp: memoryTemp });
  } catch (error) {
    console.error('Failed to fetch live weather from Open-Meteo:', error);
    res.json({ weather: memoryWeather, temp: memoryTemp });
  }
};
