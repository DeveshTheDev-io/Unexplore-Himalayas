/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export interface Destination {
  id: string;
  name: string;
  region: string;
  image: string;
  season: string;
  description: string;
}

export interface Package {
  id: string;
  name: string;
  price: string;
  color: 'white' | 'teal' | 'periwinkle';
  accent: string;
  features: string[];
}

export interface User {
  id: string;
  email?: string; // Kept for internal auth ref
  username: string;
  full_name?: string;
  address?: string;
  phone?: string;
  role?: 'user' | 'admin';
}

export interface WishlistItem {
  id: string;
  package_id: string;
  package_data?: Package; // Joined data
}

export enum Section {
  HERO = 'hero',
  DESTINATIONS = 'destinations',
  EXPERIENCE = 'experience',
  PACKAGES = 'packages',
}

export interface BookingData {
  name: string;
  phone: string;
  travelers: number;
  date: string;
  package: string;
  notes: string;
}