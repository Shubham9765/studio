
'use client';

import type { Order, Restaurant } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
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
  ChevronDown,
  CheckCircle2,
  PhoneCall,
  MapPin,
  XCircle,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface OrderCardProps {
  order: Order;
  restaurant: Restaurant;
  isUpdating: boolean;
  onStatusChange: (status: Order['status']) => void;
  onCancelOrder: () => void;
  onAssignDelivery: (deliveryBoyId: string) => void;
  onMarkAsPaid: () => void;
  onPrintKOT: () => void;
}

function VegNonVegIcon({ type }: { type: 'veg' | 'non-veg' }) {
    const isVeg = type === 'veg';
    return (
        <div className={cn("w-4 h-4 rounded-sm border flex items-center justify-center mr-2", isVeg ? "border-green-600" : "border-red-600")}>
            <div className={cn("w-2 h-2 rounded-full", isVeg ? "bg-green-600" : "bg-red-600")}></div>
        </div>
    )
}

const statusTimeline: { status: Order['status']; label: string }[] = [
  { status: 'pending', label: 'Placed' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'out-for-delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
];

export function OrderCard({
  order,
  restaurant,
  isUpdating,
  onStatusChange,
  onCancelOrder,
  onAssignDelivery,
  onMarkAsPaid,
  onPrintKOT,
}: OrderCardProps) {
  
  const getNextAction = () => {
    switch (order.status) {
        case 'pending':
            return {
                label: `Accept Order`,
                action: () => onStatusChange('accepted'),
                disabled: isUpdating,
                icon: Package
            }
        case 'accepted':
        case 'preparing':
             return {
                label: `Food is Ready`,
                action: () => onStatusChange('out-for-delivery'),
                disabled: isUpdating || !restaurant.deliveryBoys || restaurant.deliveryBoys.length === 0,
                icon: ChefHat
            }
        default:
            return null;
    }
  }

  const PrimaryAction = () => {
      const action = getNextAction();
      if(!action) return null;

      if (order.status === 'preparing' || order.status === 'accepted') {
        if (!restaurant.deliveryBoys || restaurant.deliveryBoys.length === 0) {
            return <p className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded-md">Add delivery staff to assign orders.</p>
        }
        return (
            <Select onValueChange={onAssignDelivery} disabled={isUpdating}>
              <SelectTrigger>
                <SelectValue placeholder="Assign Delivery Person" />
              </SelectTrigger>
              <SelectContent>
                {restaurant.deliveryBoys?.map(boy => (
                  <SelectItem key={boy.id} value={boy.id}>{boy.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        )
      }

      const ActionIcon = action.icon;
      return (
        <div className="flex gap-2">
            <Button onClick={action.action} disabled={action.disabled} className="w-full h-12 text-base">
                <ActionIcon className="mr-2 h-5 w-5" />
                {action.label}
            </Button>
            {order.status === 'pending' && (
                <Button variant="destructive-outline" onClick={onCancelOrder} disabled={isUpdating} className="w-full h-12 text-base">
                    <XCircle className="mr-2 h-5 w-5" />
                    Cancel
                </Button>
            )}
        </div>
      )
  }

  const currentStatusIndex = statusTimeline.findIndex(s => s.status === order.status);

  return (
    <Card className="bg-card shadow-sm flex flex-col">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Order Details */}
        <div className="space-y-3">
            <Badge variant="outline" className="text-primary border-primary">SELF DELIVERY</Badge>
            <h3 className="font-bold text-lg">{restaurant.name}</h3>
            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
            <Separator />
            <div>
                <p className="font-bold">ID: {order.id.substring(0, 12).replace(/(.{6})/, "$1 ")}</p>
                <p className="text-sm text-muted-foreground flex justify-between items-center">
                    <span>{order.customerName}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><PhoneCall/></Button>
                </p>
            </div>
            <div className="space-y-2">
                {statusTimeline.map((s, index) => {
                    const isActive = index <= currentStatusIndex;
                    if (!isActive && index > currentStatusIndex + 1) return null; // only show current and next
                    
                    return (
                        <div key={s.status} className={cn("flex items-center gap-3 text-sm", isActive ? "text-foreground" : "text-muted-foreground opacity-60")}>
                            <CheckCircle2 className={cn("h-5 w-5", isActive ? "text-green-500" : "text-muted-foreground")}/>
                            <span className="font-medium flex-grow">{s.label}</span>
                            <span className="text-xs">{format(order.createdAt.toDate(), 'p')}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Middle Column: Item List & Bill */}
        <div className="space-y-4">
            {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                        <VegNonVegIcon type={item.type} />
                        <span>{item.quantity} x {item.name}</span>
                    </div>
                    <span className="font-medium">Rs.{(item.price * item.quantity).toFixed(2)}</span>
                </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center font-bold">
                 <Popover>
                    <PopoverTrigger asChild>
                         <Button variant="ghost" className="p-0 h-auto">
                            Total Bill
                            <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'destructive'} className="ml-2 uppercase">{order.paymentStatus}</Badge>
                            <span className="mx-2">Rs.{order.total.toFixed(2)}</span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 text-sm space-y-2">
                        <div className="flex justify-between"><span>Subtotal</span> <span>Rs.{(order.total - (restaurant.deliveryCharge || 0)).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Delivery</span> <span>Rs.{(restaurant.deliveryCharge || 0).toFixed(2)}</span></div>
                    </PopoverContent>
                </Popover>
                 <Button variant="ghost" onClick={onPrintKOT}>
                    <Printer className="mr-2 h-4 w-4" /> Print Bill
                </Button>
            </div>
             <PrimaryAction />
        </div>

        {/* Right Column: Delivery Details */}
        <div className="space-y-3">
             <h4 className="font-semibold">Delivery address</h4>
             <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
             <div className="flex gap-2">
                 <Button variant="outline" size="icon"><PhoneCall/></Button>
                 <Button variant="outline" size="icon"><MapPin/></Button>
             </div>
             <Separator/>
             <Button variant="ghost" className="text-muted-foreground">Support</Button>
        </div>
      </CardContent>
    </Card>
  );
}
