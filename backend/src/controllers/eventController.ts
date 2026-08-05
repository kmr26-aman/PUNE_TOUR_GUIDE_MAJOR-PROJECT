import { Request, Response } from 'express';
import { prisma } from '../app';
import { fallbackEvents } from '../data/fallbackData';

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(events);
  } catch (error) {
    console.error('Failed to fetch events, serving fallback data:', error);
    res.json(fallbackEvents);
  }
};
