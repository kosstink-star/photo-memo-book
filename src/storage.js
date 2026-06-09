import { supabase } from './supabase.js';

// Helper: resize image to max dimension, return blob
async function resizeImage(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) { height = (height * maxDimension) / width; width = maxDimension; }
        } else {
          if (height > maxDimension) { width = (width * maxDimension) / height; height = maxDimension; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Blob creation failed')), 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: convert dataURL to File
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

// Upload image to Supabase Storage and save metadata
export async function savePhoto(photoData, familyId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('[savePhoto] Step 1: User authenticated:', user.id);
  console.log('[savePhoto] Family ID:', familyId || photoData.family_id);

  const photoId = photoData.id || crypto.randomUUID();
  
  // Handle image upload - could be File, Blob, or dataURL
  let imageFile, thumbFile;
  
  if (photoData.imageFile) {
    imageFile = await resizeImage(photoData.imageFile, 1200, 0.7);
    thumbFile = await resizeImage(photoData.imageFile, 300, 0.6);
  } else if (photoData.imageDataUrl) {
    const tempFile = dataURLtoFile(photoData.imageDataUrl, 'photo.jpg');
    imageFile = await resizeImage(tempFile, 1200, 0.7);
    thumbFile = photoData.thumbnailDataUrl ? 
      dataURLtoFile(photoData.thumbnailDataUrl, 'thumb.jpg') :
      await resizeImage(tempFile, 300, 0.6);
  }

  console.log('[savePhoto] Step 2: Images prepared, imageFile:', !!imageFile, 'thumbFile:', !!thumbFile);

  let imageUrl = photoData.image_url;
  let thumbnailUrl = photoData.thumbnail_url;

  // Upload to storage if we have new files
  if (imageFile) {
    const imagePath = `${user.id}/${photoId}_full.jpg`;
    console.log('[savePhoto] Step 3a: Uploading image to:', imagePath);
    const { error: imgErr } = await supabase.storage
      .from('photos')
      .upload(imagePath, imageFile, { contentType: 'image/jpeg', upsert: true });
    if (imgErr) {
      console.error('[savePhoto] Storage upload error (image):', imgErr);
      throw new Error('이미지 업로드 실패: ' + imgErr.message);
    }
    const { data: imgUrl } = supabase.storage.from('photos').getPublicUrl(imagePath);
    imageUrl = imgUrl.publicUrl;
    console.log('[savePhoto] Step 3a: Image uploaded OK:', imageUrl);
  }

  if (thumbFile) {
    const thumbPath = `${user.id}/${photoId}_thumb.jpg`;
    console.log('[savePhoto] Step 3b: Uploading thumb to:', thumbPath);
    const { error: thumbErr } = await supabase.storage
      .from('photos')
      .upload(thumbPath, thumbFile, { contentType: 'image/jpeg', upsert: true });
    if (thumbErr) {
      console.error('[savePhoto] Storage upload error (thumb):', thumbErr);
      throw new Error('썸네일 업로드 실패: ' + thumbErr.message);
    }
    const { data: thumbUrl } = supabase.storage.from('photos').getPublicUrl(thumbPath);
    thumbnailUrl = thumbUrl.publicUrl;
    console.log('[savePhoto] Step 3b: Thumb uploaded OK:', thumbnailUrl);
  }

  // Extract hashtags from memo
  const hashtags = (photoData.memo || '').match(/#[A-Za-z0-9가-힣_]+/g) || [];

  const usedFamilyId = familyId || photoData.family_id;

  // Upsert photo metadata
  const record = {
    id: photoId,
    family_id: usedFamilyId,
    uploaded_by: user.id,
    image_url: imageUrl,
    thumbnail_url: thumbnailUrl,
    date: photoData.date || null,
    lat: photoData.lat || null,
    lng: photoData.lng || null,
    address: photoData.address || null,
    memo: photoData.memo || '',
    file_name: photoData.fileName || photoData.file_name || '',
    weather: photoData.weather || null,
    hashtags,
    favorite: photoData.favorite || false,
  };

  console.log('[savePhoto] Step 4: Inserting DB record:', JSON.stringify(record, null, 2));

  const { data, error } = await supabase
    .from('photos')
    .upsert(record)
    .select('*')
    .single();
  
  if (error) {
    console.error('[savePhoto] DB insert error:', error);
    throw new Error('DB 저장 실패: ' + error.message);
  }
  
  console.log('[savePhoto] Step 5: DB insert OK:', data.id);
  return data;
}

// Get all photos for a family
export async function getAllPhotos(familyId) {
  const { data, error } = await supabase
    .from('photos')
    .select('*, photo_likes(count), photo_comments(count)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  // Transform for backward compat
  return data.map(p => ({
    ...p,
    thumbnailDataUrl: p.thumbnail_url,
    imageDataUrl: p.image_url,
    createdAt: new Date(p.created_at).getTime(),
    likesCount: p.photo_likes?.[0]?.count || 0,
    commentsCount: p.photo_comments?.[0]?.count || 0,
    uploaderNickname: '멤버',
    uploaderAvatar: null,
  }));
}

// Get single photo
export async function getPhoto(id) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return {
    ...data,
    thumbnailDataUrl: data.thumbnail_url,
    imageDataUrl: data.image_url,
    createdAt: new Date(data.created_at).getTime(),
    likesCount: 0,
    commentsCount: 0,
    uploaderNickname: '멤버',
    uploaderAvatar: null,
  };
}

// Delete photo (removes storage files too)
export async function deletePhoto(id, familyId) {
  // Get uploader ID to find the correct storage path
  const { data: photo } = await supabase.from('photos').select('uploaded_by').eq('id', id).single();
  
  if (photo) {
    // Delete storage files
    await supabase.storage.from('photos').remove([
      `${photo.uploaded_by}/${id}_full.jpg`,
      `${photo.uploaded_by}/${id}_thumb.jpg`,
    ]);
  }
  
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) throw error;
}

// Get photo count for a family
export async function getPhotoCount(familyId) {
  const { count, error } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', familyId);
  if (error) throw error;
  return count;
}

// Update photo metadata only (no image re-upload)
export async function updatePhoto(id, updates) {
  // Re-extract hashtags if memo changed
  if (updates.memo !== undefined) {
    updates.hashtags = (updates.memo || '').match(/#[A-Za-z0-9가-힣_]+/g) || [];
  }
  
  const { data, error } = await supabase
    .from('photos')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();
    
  if (error) throw error;
  
  if (!data) {
    throw new Error('수정 권한이 없거나(본인 사진만 수정 가능) 사진을 찾을 수 없습니다.');
  }

  const row = data;
  return {
    ...row,
    thumbnailDataUrl: row.thumbnail_url,
    imageDataUrl: row.image_url,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    likesCount: 0,
    commentsCount: 0,
    uploaderNickname: '멤버',
    uploaderAvatar: null,
  };
}

// ── Likes ──
export async function likePhoto(photoId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('photo_likes')
    .insert({ photo_id: photoId, user_id: user.id });
  if (error && error.code !== '23505') throw error; // ignore duplicate
}

export async function unlikePhoto(photoId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('photo_likes')
    .delete()
    .eq('photo_id', photoId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function getPhotoLikes(photoId) {
  const { data, error } = await supabase
    .from('photo_likes')
    .select('*, user:user_id(nickname, avatar_url)')
    .eq('photo_id', photoId);
  if (error) throw error;
  return data;
}

export async function hasUserLiked(photoId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('photo_likes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_id', user.id)
    .maybeSingle();
  return !!data;
}

// ── Comments ──
export async function addComment(photoId, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('photo_comments')
    .insert({ photo_id: photoId, user_id: user.id, content })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getComments(photoId) {
  const { data, error } = await supabase
    .from('photo_comments')
    .select('*')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('photo_comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

export async function updateComment(commentId, newContent) {
  const { error } = await supabase.from('photo_comments').update({ content: newContent }).eq('id', commentId);
  if (error) throw error;
}
