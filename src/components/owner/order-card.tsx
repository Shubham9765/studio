

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
  ChevronDown,
  CheckCircle2,
  XCircle,
  Package,
  ChefHat,
  Bike,
  MapPin
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface OrderCardProps {
  order: Order;
  restaurant: Restaurant;
  isUpdating: boolean;
  onStatusChange: (orderId: string, status: Order['status']) => void;
  onCancelOrder: (orderId: string) => void;
  onAssignDelivery: (orderId: string, deliveryBoyId: string) => void;
  onMarkAsPaid: (orderId: string) => void;
  onPrintKOT: (order: Order) => void;
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
                action: () => onStatusChange(order.id, 'accepted'),
                disabled: isUpdating,
                icon: Package
            }
        case 'accepted':
             return {
                label: `Food is Preparing`,
                action: () => onStatusChange(order.id, 'preparing'),
                disabled: isUpdating,
                icon: ChefHat
            }
        case 'preparing':
             return {
                label: `Assign for Delivery`,
                action: () => {}, // Action is handled by Select dropdown
                disabled: isUpdating || !restaurant.deliveryBoys || restaurant.deliveryBoys.length === 0,
                icon: Bike
            }
        default:
            return null;
    }
  }

  const PrimaryAction = () => {
      const action = getNextAction();
      if(!action) return null;

      if (order.status === 'preparing') {
        if (!restaurant.deliveryBoys || restaurant.deliveryBoys.length === 0) {
            return <p className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded-md">Add delivery staff to assign orders.</p>
        }
        return (
            <Select onValueChange={(deliveryBoyId) => onAssignDelivery(order.id, deliveryBoyId)} disabled={isUpdating}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={
                    <span className="flex items-center gap-2">
                        <Bike className="h-5 w-5" />
                        Assign for Delivery
                    </span>
                } />
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
                <Button variant="destructive-outline" onClick={() => onCancelOrder(order.id)} disabled={isUpdating} className="w-full h-12 text-base">
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
                    <span>Order Time</span>
                    <span>{format(order.createdAt.toDate(), 'p')}</span>
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
            <div className="flex justify-between items-center">
                 <Popover>
                    <PopoverTrigger asChild>
                         <div className="cursor-pointer">
                            <div className="flex items-center text-sm font-normal text-muted-foreground">
                                Total Bill
                                <ChevronDown className="h-4 w-4 ml-1" />
                            </div>
                            <div className="flex items-center">
                                <span className="font-extrabold text-lg mr-2">Rs.{order.total.toFixed(2)}</span>
                                <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'destructive'} className="uppercase">{order.paymentStatus}</Badge>
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 text-sm space-y-2">
                        <div className="flex justify-between"><span>Subtotal</span> <span>Rs.{(order.total - (restaurant.deliveryCharge || 0)).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Delivery</span> <span>Rs.{(restaurant.deliveryCharge || 0).toFixed(2)}</span></div>
                    </PopoverContent>
                </Popover>
                 <Button variant="ghost" onClick={() => onPrintKOT(order)}>
                    <Printer className="mr-2 h-4 w-4" /> Print Bill
                </Button>
            </div>
             <PrimaryAction />
        </div>

        {/* Right Column: Delivery Details */}
        <div className="space-y-3">
             <h4 className="font-semibold">Delivery to</h4>
              <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-muted-foreground" /> {order.customerName}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {order.customerPhone}</p>
                  <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" /> {order.deliveryAddress}</p>
              </div>
             <div className="flex gap-2">
                 <Button variant="outline" size="icon"><Phone/></Button>
                 <Button variant="outline" size="icon"><MapPin/></Button>
             </div>
             <Separator/>
             <Button variant="ghost" className="text-muted-foreground">Support</Button>
        </div>
      </CardContent>
    </Card>
  );
}
