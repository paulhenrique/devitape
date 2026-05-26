import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug, getAllEvents } from "@/lib/events";
import EventPageClient from "./EventPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: "Evento não encontrado | devitape",
    };
  }

  return {
    title: `${event.title} | devitape`,
    description: event.description,
  };
}

export async function generateStaticParams() {
  const events = await getAllEvents();
  return events.map((event) => ({
    slug: event.slug,
  }));
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return <EventPageClient event={event} />;
}
