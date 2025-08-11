
'use client';

import type { Order, Restaurant } from '@/lib/types';
import { format } from 'date-fns';

interface KOTProps {
  order: Order;
  restaurant: Restaurant;
}

export function KOT({ order, restaurant }: KOTProps) {
  const deliveryCharge = restaurant?.deliveryCharge || 0;
  const gstEnabled = restaurant?.gstEnabled || false;
  
  const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gstAmount = gstEnabled ? subtotal * 0.05 : 0;
  const total = subtotal + deliveryCharge + gstAmount;

  return (
    <div className="p-4 bg-white text-black font-sans text-xs w-[300px]">
      <style type="text/css" media="print">
        {`
          @page { size: 80mm auto; margin: 0mm; }
          body { margin: 0; }
          .print-container {
            width: 72mm;
            margin: auto;
          }
        `}
      </style>
      <div className="print-container">
        <div className="text-center mb-2">
          <h1 className="text-lg font-bold uppercase">{restaurant.name}</h1>
          <p className="text-sm">{restaurant.address}</p>
          <h2 className="text-md font-semibold mt-2">** ORDER TICKET **</h2>
        </div>

        <div className="grid grid-cols-2 gap-x-2 mb-2 border-y border-dashed border-black py-1">
          <p><strong>Order ID:</strong> #{order.id.substring(0, 8)}</p>
          <p><strong>Date:</strong> {format(order.createdAt.toDate(), 'dd/MM/yy HH:mm')}</p>
          <p><strong>Type:</strong> Delivery</p>
          <p><strong>Payment:</strong> {order.paymentMethod.toUpperCase()} / {order.paymentStatus.toUpperCase()}</p>
        </div>
        
        <div className="mb-2">
            <h3 className="text-sm font-bold uppercase border-b border-black mb-1">Customer</h3>
            <p><strong>To:</strong> {order.customerName}</p>
            <p><strong>Phone:</strong> {order.customerPhone}</p>
            <p><strong>Address:</strong> {order.deliveryAddress}</p>
        </div>

        <h3 className="text-sm font-bold uppercase border-b border-black mb-1">Items</h3>
        <table className="w-full mb-2">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left font-bold pb-1">QTY</th>
              <th className="text-left font-bold pb-1">ITEM</th>
              <th className="text-right font-bold pb-1">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-b border-dashed border-black align-top">
                <td className="py-1 pr-1">{item.quantity}x</td>
                <td className="py-1">
                  <p className="font-semibold">{item.name}</p>
                </td>
                <td className="py-1 text-right">Rs.{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-2 text-sm">
            <div className="w-1/2">
                  <div className="flex justify-between">
                      <span className="font-semibold">Subtotal:</span>
                      <span>Rs.{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="font-semibold">Delivery:</span>
                      <span>Rs.{deliveryCharge.toFixed(2)}</span>
                  </div>
                  {gstEnabled && (
                    <>
                        <div className="flex justify-between">
                          <span className="font-semibold">CGST (2.5%):</span>
                          <span>Rs.{(gstAmount / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">SGST (2.5%):</span>
                          <span>Rs.{(gstAmount / 2).toFixed(2)}</span>
                        </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold border-t border-black mt-1 pt-1">
                      <span>Grand Total:</span>
                      <span>Rs.{order.total.toFixed(2)}</span>
                  </div>
            </div>
        </div>
        
        {order.notes && (
            <div className="mt-4 border-t border-dashed pt-2">
                  <h3 className="text-sm font-bold uppercase">Notes:</h3>
                  <p>{order.notes}</p>
            </div>
        )}

        <div className="text-center mt-4">
          <p className="font-bold text-md">*** Thank You! ***</p>
        </div>
      </div>
    </div>
  );
}
