export interface Volunteer {
  name: string;
  linkedin: string;
  isSpeaker?: boolean;
  talkTitle?: string;
  presentationLink?: string;
}

export interface EventMetadata {
  title: string;
  date: string;
  location: string;
  externalLink: string;
  description: string;
  image: string;
  status: 'published' | 'draft';
  slug: string;
  featured?: boolean;
  volunteers?: Volunteer[];
  photosLink?: string;
}

export interface Event extends EventMetadata {
  content: string;
}
