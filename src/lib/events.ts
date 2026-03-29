import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { EventMetadata, Event } from '@/types/event';

const eventsDirectory = path.join(process.cwd(), 'content/events');

export async function getAllEvents(): Promise<EventMetadata[]> {
  if (!fs.existsSync(eventsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(eventsDirectory);
  const allEventsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(eventsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        ...(data as Omit<EventMetadata, 'slug'>),
      } as EventMetadata;
    })
    .filter((event) => event.status === 'published');

  // Sort events by date (newest first)
  return allEventsData.sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const fullPath = path.join(eventsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    content,
    ...(data as Omit<EventMetadata, 'slug'>),
  } as Event;
}

export async function getLatestEvent(): Promise<EventMetadata | null> {
  const events = await getAllEvents();
  const now = new Date();
  
  // Find the next upcoming event
  const upcoming = events
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcoming.length > 0) return upcoming[0];

  // If no upcoming, return the most recent past event
  return events[0] || null;
}
