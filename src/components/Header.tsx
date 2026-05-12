'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CodeXml, Camera, Link2, MessageCircle } from 'lucide-react';
import { InstagramIcon, LinkedInIcon, GithubIcon, WhatsappIcon } from './Icons';
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/50 backdrop-blur-md">
      <div className="container mx-auto px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-6 min-[425px]:space-x-3 shrink-0 ">
          <img src="/logo.png" alt="devitape logo" className="h-12 w-auto" />
          <span className="hidden min-[425px]:block text-2xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            devitape
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="text-foreground hover:text-purple-400 transition-colors">Home</Link>
          <Link href="/eventos" className="text-muted-foreground hover:text-purple-400 transition-colors">Eventos</Link>
          <Link href="https://www.sympla.com.br/evento/devitape-wknd/3416021?share_id=copiarlink" target="_blank" className="text-gray-400 hover:text-purple-400 transition-colors flex items-center">
            <WhatsappIcon className="h-4 w-4 mr-1 text-[#25D366]" />
            WhatsApp
          </Link>
        </nav>
        <div className="flex items-center space-x-3">
          <Link href="https://linkedin.com/company/devitape" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors" title="LinkedIn">
            <LinkedInIcon className="h-5 w-5" />
          </Link>
          <Link href="https://instagram.com/dev.itape" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors" title="Instagram">
            <InstagramIcon className="h-5 w-5" />
          </Link>
          <Link href="https://github.com/devitape" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors" title="GitHub">
            <GithubIcon className="h-5 w-5" />
          </Link>
          <div className="h-6 w-px bg-border mx-2" />
          <ThemeToggle />
          <Button variant="outline" className="hidden md:flex border-purple-500/50 hover:bg-purple-500/10 text-purple-400" asChild>
            <Link href="https://www.sympla.com.br/evento/devitape-wknd/3416021?share_id=copiarlink" target="_blank">
              Fazer parte
            </Link>
          </Button>

          {/* Botão hambúrguer */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {/* Menu mobile - dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-6 py-4 flex flex-col space-y-4 text-sm font-medium">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-foreground hover:text-purple-400 transition-colors">Home</Link>
          <Link href="/eventos" onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-purple-400 transition-colors">Eventos</Link>
          <Link href="https://bit.ly/form-devitape" target="_blank" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-purple-400 transition-colors flex items-center">
            <WhatsappIcon className="h-4 w-4 mr-1 text-[#25D366]" />
            WhatsApp
          </Link>
          <Button variant="outline" className="w-full border-purple-500/50 hover:bg-purple-500/10 text-purple-400" asChild>
            <Link href="https://bit.ly/form-devitape" target="_blank" onClick={() => setMenuOpen(false)}>
              Fazer parte
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
