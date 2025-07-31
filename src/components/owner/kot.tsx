
'use client';

import type { Order, Restaurant } from '@/lib/types';
import { format } from 'date-fns';

interface KOTProps {
  order: Order;
  restaurant: Restaurant;
}

export function KOT({ order, restaurant }: KOTProps) {
  return (
    <div className="p-4 bg-white text-black font-sans text-xs">
      <div className="text-center mb-2">
        <h1 className="text-lg font-bold uppercase">{restaurant.name}</h1>
        <h2 className="text-md font-semibold">Order Ticket</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-4 mb-2 border-y border-dashed border-black py-2">
        <p><strong>Order ID:</strong> #{order.id.substring(0, 8)}...</p>
        <p><strong>Date:</strong> {format(order.createdAt.toDate(), 'dd/MM/yy HH:mm')}</p>
        <p><strong>Type:</strong> Delivery</p>
        <p><strong>Payment:</strong> {order.paymentMethod.toUpperCase()} / {order.paymentStatus.toUpperCase()}</p>
      </div>
      
       <div className="mb-2">
          <h3 className="text-sm font-bold uppercase border-b border-black mb-1">Delivery Details</h3>
          <p><strong>Customer:</strong> {order.customerName}</p>
          <p><strong>Phone:</strong> {order.customerPhone}</p>
          <p><strong>Address:</strong> {order.deliveryAddress}</p>
      </div>

      <h3 className="text-sm font-bold uppercase border-b border-black mb-1">Order Items</h3>
      <table className="w-full mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left font-bold pb-1">QTY</th>
            <th className="text-left font-bold pb-1">ITEM</th>
            <th className="text-right font-bold pb-1">PRICE</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(item => (
            <tr key={item.id} className="border-b border-dashed border-black align-top">
              <td className="py-1 pr-2">{item.quantity}x</td>
              <td className="py-1">
                <p className="font-semibold">{item.name}</p>
              </td>
               <td className="py-1 text-right">${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

       <div className="flex justify-end mt-2 text-sm">
           <div className="w-1/2">
                <div className="flex justify-between">
                    <span className="font-semibold">Subtotal:</span>
                    <span>${(order.total - (restaurant.deliveryCharge || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold">Delivery:</span>
                    <span>${(restaurant.deliveryCharge || 0).toFixed(2)}</span>
                </div>
                 <div className="flex justify-between font-bold border-t border-black mt-1 pt-1">
                    <span>Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                </div>
           </div>
       </div>
      
      <div className="text-center mt-4">
        <p className="font-bold text-md">*** Thank You! ***</p>
      </div>
    </div>
  );
}
