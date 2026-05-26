export interface Volunteer {
  name: string;
  linkedin: string;
  isSpeaker?: boolean;
  talkTitle?: string;
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
  volunteers?: Volunteer[];
}

export interface Event extends EventMetadata {
  content: string;
}
