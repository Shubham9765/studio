export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  image: string;
  dataAiHint?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  ownerId?: string;
}
