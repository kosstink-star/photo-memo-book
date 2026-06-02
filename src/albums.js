import { supabase } from './supabase.js';

// Create album
export async function createAlbum(familyId, name, description = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('albums')
    .insert({ family_id: familyId, name, description, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get all albums for a family
export async function getAlbums(familyId) {
  const { data, error } = await supabase
    .from('albums')
    .select(`
      *,
      cover_photo:cover_photo_id(id, thumbnail_url),
      album_photos(count),
      creator:created_by(nickname)
    `)
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Get photos in an album
export async function getAlbumPhotos(albumId) {
  const { data, error } = await supabase
    .from('album_photos')
    .select(`
      added_at,
      photos:photo_id(
        *,
        uploader:uploaded_by(nickname, avatar_url),
        photo_likes(count),
        photo_comments(count)
      )
    `)
    .eq('album_id', albumId)
    .order('added_at', { ascending: false });
  if (error) throw error;
  return data.map(ap => ({ ...ap.photos, added_at: ap.added_at }));
}

// Add photo to album
export async function addPhotoToAlbum(albumId, photoId) {
  const { error } = await supabase
    .from('album_photos')
    .insert({ album_id: albumId, photo_id: photoId });
  if (error) {
    if (error.code === '23505') throw new Error('이미 앨범에 추가된 사진입니다.');
    throw error;
  }
}

// Remove photo from album
export async function removePhotoFromAlbum(albumId, photoId) {
  const { error } = await supabase
    .from('album_photos')
    .delete()
    .eq('album_id', albumId)
    .eq('photo_id', photoId);
  if (error) throw error;
}

// Update album
export async function updateAlbum(albumId, updates) {
  const { data, error } = await supabase
    .from('albums')
    .update(updates)
    .eq('id', albumId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete album
export async function deleteAlbum(albumId) {
  const { error } = await supabase
    .from('albums')
    .delete()
    .eq('id', albumId);
  if (error) throw error;
}

// Set album cover
export async function setAlbumCover(albumId, photoId) {
  return updateAlbum(albumId, { cover_photo_id: photoId });
}

// Get albums that contain a specific photo
export async function getPhotoAlbums(photoId) {
  const { data, error } = await supabase
    .from('album_photos')
    .select('album_id, albums:album_id(id, name)')
    .eq('photo_id', photoId);
  if (error) throw error;
  return data.map(ap => ap.albums);
}
