"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstagramIcon, LinkedInIcon, GithubIcon, WhatsappIcon } from './Icons';
import { ThemeToggle } from "./ThemeToggle";
import { cn } from '@/lib/utils';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/eventos", label: "Eventos" },
    { href: "/equipe", label: "Equipe" },
    { href: "/go/c4p", label: "Call for Papers", external: true },
  ];

  const socialLinks = [
    { href: "https://linkedin.com/company/devitape", icon: LinkedInIcon, label: "LinkedIn" },
    { href: "https://instagram.com/dev.itape", icon: InstagramIcon, label: "Instagram" },
    { href: "https://github.com/devitape", icon: GithubIcon, label: "GitHub" },
  ];

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border transition-colors duration-300",
      isMenuOpen ? "bg-background" : "bg-background/80 backdrop-blur-md md:bg-background/50"
    )}>
      <div className="container mx-auto px-6 md:px-10 lg:px-16 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 z-50" onClick={() => setIsMenuOpen(false)}>
          <Image 
            src="/logo.png" 
            alt="devitape logo" 
            width={48} 
            height={48} 
            className="h-10 md:h-12 w-auto"
            priority
          />
          <span className="text-xl md:text-2xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            devitape
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              target={link.external ? "_blank" : undefined}
              className="text-muted-foreground hover:text-purple-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/go/whatsapp" target="_blank" className="text-muted-foreground hover:text-purple-400 transition-colors flex items-center">
            <WhatsappIcon className="h-4 w-4 mr-1 text-[#25D366]" />
            WhatsApp
          </Link>
        </nav>

        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Desktop Social Icons */}
          <div className="hidden md:flex items-center space-x-3">
            {socialLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                target="_blank" 
                className="text-muted-foreground hover:text-foreground transition-colors" 
                title={link.label}
              >
                <link.icon className="h-5 w-5" />
              </Link>
            ))}
            <div className="h-6 w-px bg-border mx-2" />
          </div>
          
          <ThemeToggle />
          
          <Button variant="outline" className="hidden md:flex border-purple-500/50 hover:bg-purple-500/10 text-purple-400" asChild>
            <Link href="https://www.sympla.com.br/evento/devitape-wknd/3416021?share_id=copiarlink" target="_blank">
              Fazer parte
            </Link>
          </Button>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground z-50 rounded-md bg-secondary border border-border shadow-sm hover:bg-secondary/80 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6 stroke-[2.5]" /> : <Menu className="h-6 w-6 stroke-[2.5]" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 z-40 bg-background md:hidden transition-all duration-300 ease-in-out flex flex-col pt-24 px-6",
        isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}>
        <nav className="flex flex-col space-y-4 text-xl font-bold">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              target={link.external ? "_blank" : undefined}
              className="text-foreground hover:text-purple-400 transition-colors py-4 border-b border-border"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link 
            href="/go/whatsapp" 
            target="_blank" 
            className="text-foreground hover:text-purple-400 transition-colors flex items-center py-4 border-b border-border"
            onClick={() => setIsMenuOpen(false)}
          >
            <WhatsappIcon className="h-6 w-6 mr-3 text-[#25D366]" />
            WhatsApp
          </Link>
          
          <div className="pt-8 flex flex-col space-y-8">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Siga-nos</span>
              <div className="flex space-x-6">
                {socialLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    target="_blank" 
                    className="text-foreground hover:text-purple-400 transition-colors" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <link.icon className="h-7 w-7" />
                  </Link>
                ))}
              </div>
            </div>
            
            <Button className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg" asChild>
              <Link href="https://www.sympla.com.br/evento/devitape-wknd/3416021?share_id=copiarlink" target="_blank" onClick={() => setIsMenuOpen(false)}>
                Fazer parte do evento
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
