import { supabase } from './supabase.js';

// Generate a random 6-character invite code (uppercase alphanumeric)
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed confusing chars like O,0,1,I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new family
export async function createFamily(name) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Generate unique invite code (retry if collision)
  let inviteCode;
  let attempts = 0;
  while (attempts < 5) {
    inviteCode = generateInviteCode();
    const { data: existing } = await supabase
      .from('families')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();
    if (!existing) break;
    attempts++;
  }

  // Create family
  const { data: family, error } = await supabase
    .from('families')
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select()
    .single();
  if (error) throw error;

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({ family_id: family.id, user_id: user.id, role: 'admin' });
  if (memberError) throw memberError;

  return family;
}

// Join a family using invite code
export async function joinFamily(inviteCode) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Find family by invite code
  const { data: family, error: findError } = await supabase
    .from('families')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single();
  if (findError || !family) throw new Error('유효하지 않은 초대 코드입니다.');

  // Check if already a member
  const { data: existing } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', family.id)
    .eq('user_id', user.id)
    .single();
  if (existing) throw new Error('이미 가족 구성원입니다.');

  // Join as pending member (requires admin approval)
  const { error: joinError } = await supabase
    .from('family_members')
    .insert({ family_id: family.id, user_id: user.id, role: 'pending' });
  if (joinError) throw joinError;

  return family;
}

// Get current user's family (returns first family they belong to)
export async function getMyFamily() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership, error } = await supabase
    .from('family_members')
    .select('family_id, role, families(*)')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  if (error || !membership) return null;

  return {
    ...membership.families,
    myRole: membership.role,
  };
}

// Helper to fetch profiles for members
async function attachProfiles(members) {
  if (!members || members.length === 0) return members;
  const userIds = members.map(m => m.user_id);
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url')
    .in('id', userIds);
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return members.map(m => ({ ...m, profiles: null }));
  }

  const profileMap = {};
  profiles.forEach(p => profileMap[p.id] = p);
  return members.map(m => ({ ...m, profiles: profileMap[m.user_id] || null }));
}

// Get family members with their profiles
export async function getFamilyMembers(familyId) {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return attachProfiles(data);
}

// Leave family
export async function leaveFamily(familyId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('family_id', familyId)
    .eq('user_id', user.id);
  if (error) throw error;
}

// Get family invite code
export async function getFamilyInviteCode(familyId) {
  const { data, error } = await supabase
    .from('families')
    .select('invite_code')
    .eq('id', familyId)
    .single();
  if (error) throw error;
  return data.invite_code;
}

// Get pending family members
export async function getPendingMembers(familyId) {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .eq('role', 'pending')
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return attachProfiles(data);
}

// Approve pending member
export async function approveMember(familyId, userId) {
  const { error } = await supabase
    .from('family_members')
    .update({ role: 'member' })
    .eq('family_id', familyId)
    .eq('user_id', userId);
  if (error) throw error;
}

// Reject pending member
export async function rejectMember(familyId, userId) {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('family_id', familyId)
    .eq('user_id', userId);
  if (error) throw error;
}
