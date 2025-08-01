
import { UtensilsCrossed, Search, User, Shield, Crown, Package, UserCog, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { AuthDialog } from '@/components/auth-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }
  
  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-accent" />;
      case 'owner':
        return <Shield className="w-4 h-4 text-primary" />;
      case 'delivery':
        return <Bike className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-primary">Village Eats</h1>
          </Link>
          <div className="hidden md:flex flex-1 max-w-sm items-center relative">
            <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search restaurants..." className="pl-10 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'customer' && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/my-orders">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                         <div className="flex items-center gap-2">
                           {getRoleIcon()}
                           <p className="text-sm font-medium leading-none">{user.displayName}</p>
                         </div>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        {user.role && <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize w-fit">{user.role}</Badge>}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role !== 'delivery' && (
                        <DropdownMenuItem onClick={() => router.push('/profile')}>
                          <UserCog className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => setAuthDialogOpen(true)}>Login</Button>
                <Button size="sm" onClick={() => setAuthDialogOpen(true)}>Sign Up</Button>
              </>
            )}
             <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
