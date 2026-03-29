import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CodeXml, Camera, Link2, MessageCircle } from 'lucide-react';
import { InstagramIcon, LinkedInIcon, GithubIcon, WhatsappIcon } from './Icons';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            devitape
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="text-white hover:text-purple-400 transition-colors">Home</Link>
          <Link href="/eventos" className="text-gray-400 hover:text-purple-400 transition-colors">Eventos</Link>
          <Link href="https://chat.whatsapp.com/exemplo" target="_blank" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center">
            <WhatsappIcon className="h-4 w-4 mr-1 text-[#25D366]" />
            WhatsApp
          </Link>
        </nav>
        <div className="flex items-center space-x-3">
          <Link href="https://linkedin.com/company/devitape" target="_blank" className="text-gray-400 hover:text-white transition-colors" title="LinkedIn">
            <LinkedInIcon className="h-5 w-5" />
          </Link>
          <Link href="https://instagram.com/devitape" target="_blank" className="text-gray-400 hover:text-white transition-colors" title="Instagram">
            <InstagramIcon className="h-5 w-5" />
          </Link>
          <Link href="https://github.com/devitape" target="_blank" className="text-gray-400 hover:text-white transition-colors" title="GitHub">
            <GithubIcon className="h-5 w-5" />
          </Link>
          <Button variant="outline" className="hidden md:flex border-purple-500/50 hover:bg-purple-500/10 text-purple-400">
            Fazer parte
          </Button>
        </div>
      </div>
    </header>
  );
}
