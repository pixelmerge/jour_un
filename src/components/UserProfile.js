'use client';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { FiTarget, FiLogOut, FiUpload, FiUser, FiActivity, FiMoon, FiHeart, FiEdit3, FiSave, FiX, FiCamera, FiSettings, FiTrash2, FiArrowLeft, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const ProfileContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f8fd 0%, #e9f2ff 100%);
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 2px solid #e1e8ed;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
  
  &:hover {
    border-color: #667eea;
    background: #667eea;
    color: white;
    transform: translateY(-2px);
  }
`;

const ContentWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    text-align: left;
    padding: 2.5rem 2rem;
  }
`;

const AvatarSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const AvatarWrapper = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 4px;
  
  @media (min-width: 768px) {
    width: 100px;
    height: 100px;
  }
`;

const AvatarImage = styled(Image)`
  border-radius: 50%;
  object-fit: cover;
  background: white;
`;

const AvatarUploadButton = styled.label`
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px solid white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
`;

const UserInfo = styled.div`
  flex: 1;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: #1a1a1a;
    
    @media (min-width: 768px) {
      font-size: 2.25rem;
    }
  }
  
  p {
    color: #666;
    margin: 0;
    font-size: 1rem;
  }
`;

const ProfileActions = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e1e8ed;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
`;

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-radius: 16px;
  border: 2px solid #e1e8ed;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  
  &:hover {
    border-color: #667eea;
    background: #667eea;
    color: white;
    transform: translateY(-2px);
  }
`;

const DeleteAccountSection = styled.div`
  text-align: center;
  margin-top: 1rem;
`;

const ExpandToggle = styled.button`
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0 auto;
  
  &:hover {
    background: #f8fafc;
    color: #374151;
  }
`;

const CollapsibleContent = styled.div`
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  max-height: ${props => props.isOpen ? '200px' : '0'};
  opacity: ${props => props.isOpen ? '1' : '0'};
  transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
`;

const DeleteAccountText = styled.p`
  font-size: 0.75rem;
  color: #64748b;
  margin: 1rem 0 0.5rem;
  line-height: 1.4;
  padding: 0 1rem;
`;

const DeleteAccountButton = styled.button`
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.75rem;
  text-decoration: underline;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #fef2f2;
    text-decoration: none;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
  
  @media (min-width: 768px) {
    padding: 2.5rem 2rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  color: #1a1a1a;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 2px solid #e1e8ed;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    background: #667eea;
    color: white;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 16px;
  background: #f8fafc;
  color: #1a1a1a;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    background: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 16px;
  background: #f8fafc;
  color: #1a1a1a;
  font-size: 1rem;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    background-color: white;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    background: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 16px;
  text-align: center;
  
  .value {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
  }
  
  .label {
    font-size: 0.9rem;
    opacity: 0.9;
    margin: 0;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  
  @media (max-width: 767px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  border-radius: 16px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 56px;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }
    
    &:disabled {
      opacity: 0.6;
      transform: none;
      box-shadow: none;
      cursor: not-allowed;
    }
  ` : props.variant === 'secondary' ? `
    background: #f8fafc;
    color: #374151;
    border: 2px solid #e1e8ed;
    
    &:hover {
      background: white;
      border-color: #667eea;
      color: #667eea;
    }
  ` : `
    background: #fef2f2;
    color: #dc2626;
    border: 2px solid #fecaca;
    
    &:hover {
      background: #dc2626;
      color: white;
      border-color: #dc2626;
    }
  `}
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 2px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 2px solid #bbf7d0;
  color: #166534;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
  setProfile(data);
  setAiConsent(!!data.ai_consent);
      } else {
        // Create a new profile if one doesn't exist
        await createUserProfile();
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          id: user.id,
          email: userData.user?.email,
          full_name: userData.user?.user_metadata?.full_name || userData.user?.email || 'User',
          avatar_url: userData.user?.user_metadata?.avatar_url || null
        }])
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('user_profiles')
        .update(profile)
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setSuccess('Avatar updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // Call the delete account API
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Sign out the user
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
    }
  };

  const toggleAiConsent = async (value) => {
    try {
      setAiConsent(value);
      const { error } = await supabase
        .from('user_profiles')
        .update({ ai_consent: value })
        .eq('id', user.id);
      if (error) throw error;
      // record audit via server route
      try {
        await fetch('/api/ai-consent-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, oldValue: !value, newValue: value }),
        });
      } catch (auditErr) {
        console.error('Failed to send audit:', auditErr);
      }

      setSuccess('Preference saved');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Failed to update AI consent:', err);
      setError('Failed to update preference');
      setAiConsent(!value); // revert UI
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <ProfileContainer>
        <ContentWrapper>
          <BackButton onClick={() => router.push('/')}>
            <FiArrowLeft /> Back to Home
          </BackButton>
          
          <Card>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '1rem', color: '#666' }}>Loading your profile...</p>
            </div>
          </Card>
        </ContentWrapper>
      </ProfileContainer>
    );
  }

  if (!profile) {
    return (
      <ProfileContainer>
        <ContentWrapper>
          <BackButton onClick={() => router.push('/')}>
            <FiArrowLeft /> Back to Home
          </BackButton>
          
          <Card>
            <ErrorMessage>
              <FiX /> Failed to load profile. Please try refreshing the page.
            </ErrorMessage>
          </Card>
        </ContentWrapper>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <ContentWrapper>
        <BackButton onClick={() => router.push('/')}>
          <FiArrowLeft /> Back to Home
        </BackButton>
        
        {error && (
          <ErrorMessage>
            <FiX /> {error}
          </ErrorMessage>
        )}
        
        {success && (
          <SuccessMessage>
            <FiSave /> {success}
          </SuccessMessage>
        )}

        <Header>
          <AvatarSection>
            <AvatarWrapper>
              <AvatarImage
                src={profile.avatar_url || '/default-avatar.png'}
                alt="Profile"
                width={120}
                height={120}
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name || profile.email}&backgroundColor=667eea`;
                }}
              />
              <AvatarUploadButton htmlFor="avatar-upload">
                {uploading ? <LoadingSpinner /> : <FiCamera />}
              </AvatarUploadButton>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </AvatarWrapper>
          </AvatarSection>

          <UserInfo>
            <h1>{profile.full_name || 'Welcome!'}</h1>
            <p>{profile.email}</p>
          </UserInfo>
        </Header>

        <Card>
          <SectionHeader>
            <SectionTitle>
              <FiTarget /> Your Goals
            </SectionTitle>
          </SectionHeader>
          
          <StatsGrid>
            <StatCard>
              <p className="value">{profile.daily_calorie_target || 2000}</p>
              <p className="label">Daily Calories</p>
            </StatCard>
            <StatCard>
              <p className="value">{profile.activity_minutes_target || 30}</p>
              <p className="label">Weekly Activity (min)</p>
            </StatCard>
            <StatCard>
              <p className="value">{profile.sleep_target_hours || 8}</p>
              <p className="label">Sleep Goal (hrs)</p>
            </StatCard>
          </StatsGrid>
        </Card>

        <Card>
          <SectionHeader>
            <SectionTitle>
              <FiUser /> Personal Information
            </SectionTitle>
            <EditButton onClick={() => setEditing(!editing)}>
              {editing ? <><FiX /> Cancel</> : <><FiEdit3 /> Edit</>}
            </EditButton>
          </SectionHeader>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="full_name">
                <FiUser /> Full Name
              </Label>
              <Input
                id="full_name"
                type="text"
                disabled={!editing}
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                disabled={!editing}
                value={profile.age || ''}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                placeholder="25"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="height_cm">Height (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                disabled={!editing}
                value={profile.height_cm || ''}
                onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                placeholder="170"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="weight_kg">Weight (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                disabled={!editing}
                value={profile.weight_kg || ''}
                onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                placeholder="70"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="gender">Gender</Label>
              <Select
                id="gender"
                disabled={!editing}
                value={profile.gender || 'other'}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="activity_level">Activity Level</Label>
              <Select
                id="activity_level"
                disabled={!editing}
                value={profile.activity_level || 'moderately_active'}
                onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
              >
                <option value="sedentary">Sedentary</option>
                <option value="lightly_active">Lightly Active</option>
                <option value="moderately_active">Moderately Active</option>
                <option value="very_active">Very Active</option>
                <option value="super_active">Super Active</option>
              </Select>
            </FormGroup>
          </Form>
        </Card>

        <Card>
          <SectionHeader>
            <SectionTitle>
              <FiTarget /> Daily Targets
            </SectionTitle>
            <EditButton onClick={() => setEditing(!editing)}>
              {editing ? <><FiX /> Cancel</> : <><FiEdit3 /> Edit</>}
            </EditButton>
          </SectionHeader>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="daily_calorie_target">
                <FiHeart /> Daily Calorie Goal
              </Label>
              <Input
                id="daily_calorie_target"
                type="number"
                disabled={!editing}
                value={profile.daily_calorie_target || ''}
                onChange={(e) => setProfile({ ...profile, daily_calorie_target: e.target.value })}
                placeholder="2000"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="activity_minutes_target">
                <FiActivity /> Weekly Activity Goal (minutes)
              </Label>
              <Input
                id="activity_minutes_target"
                type="number"
                disabled={!editing}
                value={profile.activity_minutes_target || ''}
                onChange={(e) => setProfile({ ...profile, activity_minutes_target: e.target.value })}
                placeholder="210"
              />
            </FormGroup>

            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label htmlFor="sleep_target_hours">
                <FiMoon /> Nightly Sleep Goal (hours)
              </Label>
              <Input
                id="sleep_target_hours"
                type="number"
                step="0.5"
                disabled={!editing}
                value={profile.sleep_target_hours || ''}
                onChange={(e) => setProfile({ ...profile, sleep_target_hours: e.target.value })}
                placeholder="8"
              />
            </FormGroup>

            {editing && (
              <ButtonContainer style={{ gridColumn: '1 / -1' }}>
                <Button variant="secondary" type="button" onClick={() => setEditing(false)}>
                  <FiX /> Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? <LoadingSpinner /> : <FiSave />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </ButtonContainer>
            )}
          </Form>
        </Card>

        <ProfileActions>
          <SignOutButton onClick={handleLogout}>
            <FiLogOut /> Sign Out
          </SignOutButton>
          
          <DeleteAccountSection>
            <ExpandToggle onClick={() => setShowDeleteSection(!showDeleteSection)}>
              {showDeleteSection ? <FiChevronUp /> : <FiChevronDown />}
              {showDeleteSection ? 'Hide' : 'Advanced options'}
            </ExpandToggle>
            
            <CollapsibleContent isOpen={showDeleteSection}>
                <div style={{ padding: '0 1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>Allow AI processing</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Allow the app to analyze your inputs using AI to provide personalized insights. You can change this later.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiConsent}
                      onChange={(e) => toggleAiConsent(e.target.checked)}
                      aria-label="AI consent"
                    />
                  </label>

                  <DeleteAccountText>
                    Need to leave? You can permanently delete your account and all associated data.
                    <br />
                    <strong>⚠️ This action cannot be undone.</strong>
                  </DeleteAccountText>
                  <DeleteAccountButton onClick={handleDeleteAccount}>
                    Delete my account
                  </DeleteAccountButton>
                </div>
            </CollapsibleContent>
          </DeleteAccountSection>
        </ProfileActions>
      </ContentWrapper>
    </ProfileContainer>
  );
}