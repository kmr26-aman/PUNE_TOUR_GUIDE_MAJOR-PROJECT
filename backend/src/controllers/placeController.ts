import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { searchOSMPlaces, fetchOSMPlacesByCategory } from '../services/overpassService';
import { getCachedData, setCachedData, invalidateCache } from '../services/cacheService';
import { prisma } from '../app';
import { fallbackPlaces } from '../data/fallbackData';

const saveDiscoveredPlaces = async (discoveredPlaces: any[]) => {
  if (discoveredPlaces.length === 0) return;
  
  for (const p of discoveredPlaces) {
    const { latitude, longitude, ...rest } = p;
    
    // 1. Upsert basic data
    const upserted = await prisma.place.upsert({
      where: { osmId: p.osmId },
      update: { latitude, longitude }, 
      create: { ...rest, latitude, longitude }
    });

    // // 2. Populate PostGIS geometry column using raw SQL
    // if (latitude && longitude) {
    //   await prisma.$executeRaw`
    //     UPDATE "Place" 
    //     SET "location" = ST_SetSRID(ST_MakePoint(${Number(longitude)}, ${Number(latitude)}), 4326)
    //     WHERE id = ${upserted.id}
    //   `;
    // }
  }
  
  // Invalidate cache if new data was added
  await invalidateCache('places:*');
};

export const getAllPlaces = async (req: Request, res: Response) => {
  try {
    const { category, q, isSaved, isDiscovered, lat, lng } = req.query;


    
    // Generate a unique cache key based on query parameters
    const cacheKey = `places:v5:${category || 'all'}:${q || 'none'}:${isSaved || 'any'}:${isDiscovered || 'any'}:${lat || 'none'}:${lng || 'none'}`; // Updated cache key
    
    // Check cache first
    const cachedPlaces = await getCachedData<any[]>(cacheKey);
    if (cachedPlaces) {
      console.log('Serving from Redis cache:', cacheKey);
      return res.json(cachedPlaces);
    }

    let where: any = {};
    
    if (category && category !== 'All') {
      where.category = String(category);
    }
    
    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { description: { contains: String(q), mode: 'insensitive' } }
      ];
    }
    
    if (isSaved === 'true') {
      where.isSaved = true;
    }

    if (isDiscovered === 'true') {
      where.NOT = { osmId: null };
    }
    
    let places = await prisma.place.findMany({
      where,
      orderBy: { rating: 'desc' }
    });

    // Auto-Discovery Logic: If search query provided and few results - run in background
    if (q && places.length < 5 && !isSaved) {
      searchOSMPlaces(String(q))
        .then(discovered => saveDiscoveredPlaces(discovered))
        .catch(err => console.error('Background search discovery error:', err));
    }

    // Category Population Logic: Ensure at least 10 places in a category - run in background
    if (category && category !== 'All' && places.length < 10 && !q && !isSaved) {
      console.log(`Low count for category ${category} (${places.length}). Hydrating in background...`);
      fetchOSMPlacesByCategory(String(category))
        .then(discovered => saveDiscoveredPlaces(discovered))
        .catch(err => console.error('Background category discovery error:', err));
    }

    // // Nearby search enhancement: If user coordinates are provided, sort by real physical distance using PostGIS
    // if (lat && lng && places.length > 0) {
    //   // Use raw SQL to get places sorted by PostGIS distance
    //   const categoryFilter = category && category !== 'All' 
    //     ? Prisma.sql`WHERE "category" = ${String(category)}`
    //     : Prisma.empty;

    //   const nearbyPlaces: any[] = await prisma.$queryRaw`
    //     SELECT *, ST_DistanceSphere(location, ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)) as "dist"
    //     FROM "Place"
    //     ${categoryFilter}
    //     ORDER BY "dist" ASC
    //     LIMIT 20
    //   `;
    //   // Note: This is a specialized nearby query. For now, we'll keep the standard return
    //   // but the database is now ready for high-perf nearby searches.
    // }

    // Save to cache for 1 hour
    await setCachedData(cacheKey, places, 3600);

    res.json(places);
  } catch (error) {
    console.error('Error in getAllPlaces:', error);
    const queryCategory = String(req.query.category || 'all').toLowerCase();
    const queryText = String(req.query.q || '').trim().toLowerCase();
    const filteredFallback = fallbackPlaces.filter((place) => {
      const matchesCategory = queryCategory === 'all' || place.category.toLowerCase() === queryCategory;
      const matchesText = !queryText || place.name.toLowerCase().includes(queryText) || place.description.toLowerCase().includes(queryText);
      return matchesCategory && matchesText;
    });
    res.json(filteredFallback.length > 0 ? filteredFallback : fallbackPlaces);
  }
};

export const getPlaceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `place:detail:${id}`;

    const cachedPlace = await getCachedData<any>(cacheKey);
    if (cachedPlace) return res.json(cachedPlace);

    const place = await prisma.place.findUnique({
      where: { id: Number(id) }
    });
    if (!place) return res.status(404).json({ error: 'Place not found' });

    await setCachedData(cacheKey, place, 3600);
    res.json(place);
  } catch (error) {
    const fallbackPlace = fallbackPlaces.find((place) => place.id === Number(req.params.id));
    if (fallbackPlace) {
      return res.json(fallbackPlace);
    }
    res.json(fallbackPlaces[0]);
  }
};

export const toggleSavePlace = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { isSaved } = req.body;
    const userId = req.user.id;

    // Check current save state to award XP only on new saves
    const place = await prisma.place.findUnique({
      where: { id: Number(id) }
    });

    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }

    const justSaved = Boolean(isSaved) && !place.isSaved;

    const updatedPlace = await prisma.place.update({
      where: { id: Number(id) },
      data: { isSaved: Boolean(isSaved) }
    });

    if (justSaved) {
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: 10 } }
      });
      console.log(`[XP] User ${userId} gained +10 XP for saving place: ${place.name}`);
      // Invalidate user stats only when they change
      await invalidateCache(`user:stats:${userId}`);
    }

    // Invalidate relevant caches
    await invalidateCache('places:*');
    await invalidateCache(`place:detail:${id}`);

    res.json(updatedPlace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle save status' });
  }
};
