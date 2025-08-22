import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';

export async function uploadImage(file) {
  try {
    // Compress image before upload
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024
    });

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('food_images')
      .upload(`public/${fileName}`, compressedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('food_images')
      .getPublicUrl(`public/${fileName}`);

    return publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
}