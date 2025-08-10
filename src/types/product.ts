export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  ingredients?: string[];
  preparationTime?: number;
  available: boolean;
  rating?: number;
  hasAddons?: boolean;
}
export interface Extra {
  id: string;
  name: string;
  price: number;
  active?: boolean;
}

export interface SelectedExtra {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem extends Product {
  quantity: number;
  observations?: string;
  selectedExtras?: SelectedExtra[];
  cartLineId?: string;
}
export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}