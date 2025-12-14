/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { Destination } from '../types';

export const BUCKET_NAME = 'destination-images';
export const TABLE_NAME = 'destinations';

export interface DestinationInput {
  id?: string;
  name: string;
  region: string;
  season: string;
  description: string;
  image?: string; // URL
}

// Exported for Seeding
export const FALLBACK_DESTINATIONS: Destination[] = [
  {
    id: 'd1',
    name: 'Pangong Lake',
    region: 'Ladakh',
    season: 'MAY - SEP',
    image: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&q=80&w=1200',
    description: 'Witness the changing colors of the world\'s highest saltwater lake. A surreal landscape where the sky meets the water in a symphony of blue.'
  },
  {
    id: 'd2',
    name: 'Spiti Valley',
    region: 'Himachal',
    season: 'JUN - OCT',
    image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=1200',
    description: 'The Middle Land. Explore ancient monasteries, fossil-rich villages, and stark desert mountains under a galaxy of stars.'
  },
  {
    id: 'd3',
    name: 'Kedarnath',
    region: 'Uttarakhand',
    season: 'MAY - NOV',
    image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=1200',
    description: 'A spiritual journey to the abode of Lord Shiva. Trek through the majestic Garhwal Himalayas to reach this ancient temple.'
  }
];

// Fetch all destinations (Public)
export const getDestinations = async (): Promise<Destination[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase Fetch Error (Using Fallback Data):', JSON.stringify(error, null, 2));
      return []; // Return empty if error to avoid confusion, or handle specifically
    }

    return data as Destination[];
  } catch (err) {
    console.error('Unexpected error fetching destinations:', err);
    return [];
  }
};

// Upload Image to Storage (Admin)
export const uploadDestinationImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return null;
  }
};

// Create or Update Destination (Admin)
export const saveDestination = async (
  destination: DestinationInput, 
  file: File | null
): Promise<boolean> => {
  try {
    let imageUrl = destination.image;

    // 1. If a new file is provided, upload it first
    if (file) {
      const uploadedUrl = await uploadDestinationImage(file);
      if (!uploadedUrl) return false;
      imageUrl = uploadedUrl;
    }

    // 2. Insert or Update Database
    const payload = {
      name: destination.name,
      region: destination.region,
      season: destination.season,
      description: destination.description,
      image: imageUrl,
    };

    let error;

    if (destination.id) {
      // Update
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update(payload)
        .eq('id', destination.id);
      error = updateError;
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving destination:', JSON.stringify(error, null, 2));
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected save error", err);
    return false;
  }
};

// Delete Destination (Admin)
export const deleteDestination = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting destination:', error);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};
