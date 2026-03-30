import Link from 'next/link';
import { MessageCircle, Camera, Link2, CodeXml } from 'lucide-react';
import { InstagramIcon, LinkedInIcon, GithubIcon, WhatsappIcon } from './Icons';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-12 pb-8">
      <div className="container mx-auto px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-4 block">
              devitape
            </span>
            <p className="text-gray-400 max-w-sm">
              A maior comunidade de desenvolvedores de Itapetininga e região. Unindo talentos, compartilhando conhecimento e fortalecendo o ecossistema tech local.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-foreground">Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/" className="hover:text-purple-400 transition-colors">Home</Link></li>
              <li><Link href="/eventos" className="hover:text-purple-400 transition-colors">Eventos</Link></li>
              <li><Link href="https://chat.whatsapp.com/exemplo" target="_blank" className="hover:text-purple-400 transition-colors">Comunidade</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-foreground">Social</h4>
            <div className="flex space-x-4">
              <Link href="https://instagram.com/devitape" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors" title="Instagram">
                <InstagramIcon className="h-6 w-6" />
              </Link>
              <Link href="https://linkedin.com/company/devitape" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors" title="LinkedIn">
                <LinkedInIcon className="h-6 w-6" />
              </Link>
              <Link href="https://github.com/devitape" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors" title="GitHub">
                <GithubIcon className="h-6 w-6" />
              </Link>
              <Link href="https://chat.whatsapp.com/exemplo" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors" title="WhatsApp">
                <WhatsappIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} devitape. Todos os direitos reservados. Itapetininga/SP.</p>
        </div>
      </div>
    </footer>
  );
}
