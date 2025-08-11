
'use client';

import type { Order, Restaurant } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { format } from 'date-fns';
import {
  User,
  Phone,
  Printer,
  CircleDollarSign,
  BadgeCent,
  Check,
  Bike,
  ChefHat,
  Package,
  MessageSquareQuote,
  X,
  ChevronDown
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  restaurant: Restaurant;
  isUpdating: boolean;
  onStatusChange: (orderId: string, status: Order['status']) => void;
  onAssignDelivery: (orderId: string, deliveryBoyId: string) => void;
  onMarkAsPaid: (orderId: string) => void;
  onPrintKOT: (order: Order) => void;
}

const statusActions: {
  status: Order['status'];
  label: string;
  nextStatus: Order['status'];
  icon: React.ElementType;
}[] = [
  { status: 'pending', label: 'Accept', nextStatus: 'accepted', icon: Package },
  { status: 'accepted', label: 'Mark as Preparing', nextStatus: 'preparing', icon: ChefHat },
  { status: 'preparing', label: 'Assign for Delivery', nextStatus: 'out-for-delivery', icon: Bike },
];

export function OrderCard({
  order,
  restaurant,
  isUpdating,
  onStatusChange,
  onAssignDelivery,
  onMarkAsPaid,
  onPrintKOT,
}: OrderCardProps) {

  const handleNextAction = () => {
    const currentAction = statusActions.find(a => a.status === order.status);
    if (currentAction && currentAction.nextStatus !== 'out-for-delivery') {
      onStatusChange(order.id, currentAction.nextStatus);
    }
  };

  const renderPaymentInfo = () => (
    <div className="text-xs">
      <div className="flex items-center gap-2 capitalize mb-1">
        {order.paymentMethod === 'cash' ? <CircleDollarSign className="h-4 w-4" /> : <BadgeCent className="h-4 w-4" />}
        <span>{order.paymentMethod}</span>
        <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'} className="h-5">{order.paymentStatus}</Badge>
      </div>
      {order.paymentMethod === 'upi' && order.paymentStatus === 'pending' && (
        <Button size="xs" variant="outline" className="h-6 mt-1" onClick={() => onMarkAsPaid(order.id)} disabled={isUpdating}>
          <Check className="mr-1 h-3 w-3" /> Mark as Paid
        </Button>
      )}
    </div>
  );

  const renderPrimaryAction = () => {
    const currentAction = statusActions.find(a => a.status === order.status);
    if (!currentAction) return null;

    if (currentAction.nextStatus === 'out-for-delivery') {
        if (!restaurant.deliveryBoys || restaurant.deliveryBoys.length === 0) {
            return <p className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded-md">Add delivery staff to assign orders.</p>
        }
      return (
        <Select onValueChange={(val) => onAssignDelivery(order.id, val)} disabled={isUpdating}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Assign Delivery" />
          </SelectTrigger>
          <SelectContent>
            {restaurant.deliveryBoys?.map(boy => (
              <SelectItem key={boy.id} value={boy.id}>{boy.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Button className="w-full h-9" onClick={handleNextAction} disabled={isUpdating}>
        <currentAction.icon className="mr-2 h-4 w-4" /> {currentAction.label}
      </Button>
    );
  };
  
  const popoverContent = (
    <div className="space-y-3">
        <div>
            <h4 className="font-semibold text-xs mb-1">Customer Details</h4>
            <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-2"><User className="h-3 w-3" /> {order.customerName}</p>
                <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {order.customerPhone}</p>
            </div>
        </div>
        <Separator />
         <div>
            <h4 className="font-semibold text-xs mb-1">Order Summary</h4>
            <ul className="list-disc pl-4 text-xs text-muted-foreground">
                {order.items.map(item => (
                    <li key={item.id}>{item.name} x {item.quantity}</li>
                ))}
            </ul>
        </div>
        {order.notes && (
             <>
                <Separator />
                <div>
                    <h4 className="font-semibold text-xs mb-1">Special Instructions</h4>
                    <p className="text-xs text-muted-foreground bg-background p-2 rounded-md">{order.notes}</p>
                </div>
            </>
        )}
    </div>
  );

  return (
    <Card className="bg-card shadow-md flex flex-col">
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
            <CardTitle className="text-base">#{order.id.substring(0, 6)}</CardTitle>
            <div className="text-right">
                <p className="font-bold text-base">${order.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{format(order.createdAt.toDate(), 'h:mm a')}</p>
            </div>
        </div>
         <CardDescription className="text-sm font-semibold pt-1">{order.customerName}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-grow">
          <div className="flex items-center justify-between text-xs">
            {renderPaymentInfo()}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPrintKOT(order)}>
                <Printer className="h-4 w-4" />
            </Button>
          </div>
      </CardContent>
      <CardFooter className={cn("p-3 flex gap-2", order.status === 'pending' ? 'flex-col' : 'flex-row')}>
            {order.status === 'pending' && (
                 <Button className="w-full h-9" onClick={handleNextAction} disabled={isUpdating}>
                    <Package className="mr-2 h-4 w-4" /> Accept Order
                </Button>
            )}
            {order.status !== 'pending' && renderPrimaryAction()}
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="secondary" size={order.status === 'pending' ? 'sm' : 'icon'} className={cn(order.status === 'pending' ? 'w-full h-8 text-xs' : 'h-9 w-9 flex-shrink-0')}>
                        {order.status !== 'pending' ? <ChevronDown className="h-4 w-4" /> : 'More Info'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" side="bottom" align="end">
                   {popoverContent}
                </PopoverContent>
            </Popover>
            {order.status !== 'out-for-delivery' && (
                <Button variant="destructive-outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => onStatusChange(order.id, 'cancelled')} disabled={isUpdating}>
                    <X className="h-4 w-4" />
                </Button>
            )}
      </CardFooter>
    </Card>
  );
}
