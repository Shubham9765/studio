
'use client';

import type { Order, Restaurant } from '@/lib/types';
import { format } from 'date-fns';

interface KOTProps {
  order: Order;
  restaurant: Restaurant;
}

export function KOT({ order, restaurant }: KOTProps) {
  return (
    <div className="p-4 bg-white text-black font-sans text-sm">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold uppercase">{restaurant.name}</h1>
        <h2 className="text-lg font-semibold">Kitchen Order Ticket</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-4 mb-4 border-b border-dashed border-black pb-2">
        <p><strong>Order ID:</strong> #{order.id.substring(0, 8)}...</p>
        <p><strong>Date:</strong> {format(order.createdAt.toDate(), 'dd/MM/yyyy HH:mm')}</p>
        <p><strong>Customer:</strong> {order.customerName}</p>
        <p><strong>Type:</strong> Delivery</p>
      </div>

      <table className="w-full mb-4">
        <thead>
          <tr>
            <th className="text-left font-bold pb-2 border-b border-black">QTY</th>
            <th className="text-left font-bold pb-2 border-b border-black">ITEM</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(item => (
            <tr key={item.id} className="border-b border-dashed border-black">
              <td className="py-2 pr-2 align-top">{item.quantity}x</td>
              <td className="py-2">
                <p className="font-bold">{item.name}</p>
                {/* You could add item-specific notes or customizations here if they existed */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="text-center mt-6">
        <p className="font-bold text-lg">*** END OF ORDER ***</p>
      </div>
    </div>
  );
}
