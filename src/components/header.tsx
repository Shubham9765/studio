import { UtensilsCrossed, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold font-headline text-primary">Village Eats</h1>
        </div>
        <div className="hidden md:flex flex-1 max-w-md items-center relative">
          <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search restaurants..." className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">Login</Button>
          <Button size="sm">Sign Up</Button>
        </div>
      </div>
    </header>
  );
}
