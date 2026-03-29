export interface EventMetadata {
  title: string;
  date: string;
  location: string;
  externalLink: string;
  description: string;
  image: string;
  status: 'published' | 'draft';
  slug: string;
}

export interface Event extends EventMetadata {
  content: string;
}
