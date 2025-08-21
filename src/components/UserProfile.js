function UserProfile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    weight_kg: '',
    height_cm: '',
    age: '',
    gender: '',
    physical_goal: '',
    nutrition_goal_calories: '',
    activity_goal_minutes: '',
    sleep_goal_hours: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({ ...data, email: user.email });
      }
    } catch (err) {
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { email, ...profileData } = profile;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to save profile changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const fileName = `${user.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileError) throw profileError;
      setProfile(p => ({ ...p, avatar_url: publicUrl }));
      setSuccess('Avatar updated!');
    } catch (err) {
      setError('Failed to update avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }
  if (!user) {
    return <div>Please sign in to view your profile.</div>;
  }
  return (
    <ProfileContainer>
      <Header>
        <AvatarWrapper>
          <AvatarImage
            src={profile.avatar_url || '/icons/icon-192x192.png'}
            alt="Avatar"
            width={80}
            height={80}
          />
          <AvatarUploadButton htmlFor="avatar-upload">
            <FiUpload />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={avatarUploading}
              style={{ display: 'none' }}
            />
          </AvatarUploadButton>
        </AvatarWrapper>
        <UserInfo>
          <h1>{profile.full_name || 'User'}</h1>
          <p>{profile.email}</p>
        </UserInfo>
      </Header>

      <Form onSubmit={handleSubmit}>
        {error && <Message type="error">{error}</Message>}
        {success && <Message type="success">{success}</Message>}

        <FormSection>
          <SectionTitle><FiUser /> Personal Info</SectionTitle>
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" type="text" value={profile.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
          
          <Label htmlFor="weight_kg">Weight (kg)</Label>
          <Input id="weight_kg" type="number" value={profile.weight_kg || ''} onChange={e => setProfile({ ...profile, weight_kg: e.target.value })} />
          
          <Label htmlFor="height_cm">Height (cm)</Label>
          <Input id="height_cm" type="number" value={profile.height_cm || ''} onChange={e => setProfile({ ...profile, height_cm: e.target.value })} />
          
          <Label htmlFor="age">Age</Label>
          <Input id="age" type="number" value={profile.age || ''} onChange={e => setProfile({ ...profile, age: e.target.value })} />
          
          <Label htmlFor="gender">Gender</Label>
          <Select id="gender" value={profile.gender || ''} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </FormSection>

        <FormSection>
          <SectionTitle><FiTarget /> Goals</SectionTitle>
          <Label htmlFor="physical_goal">Primary Goal</Label>
          <Select id="physical_goal" value={profile.physical_goal || ''} onChange={e => setProfile({ ...profile, physical_goal: e.target.value })}>
            <option value="lose_weight">Lose Weight</option>
            <option value="gain_weight">Gain Weight</option>
            <option value="build_muscle">Build Muscle</option>
          </Select>

          <Label htmlFor="nutrition_goal_calories">Daily Calorie Goal</Label>
          <Input id="nutrition_goal_calories" type="number" value={profile.nutrition_goal_calories || ''} onChange={e => setProfile({ ...profile, nutrition_goal_calories: e.target.value })} />
          
          <Label htmlFor="activity_goal_minutes">Daily Activity Goal (minutes)</Label>
          <Input id="activity_goal_minutes" type="number" value={profile.activity_goal_minutes || ''} onChange={e => setProfile({ ...profile, activity_goal_minutes: e.target.value })} />
          
          <Label htmlFor="sleep_goal_hours">Nightly Sleep Goal (hours)</Label>
          <Input id="sleep_goal_hours" type="number" step="0.5" value={profile.sleep_goal_hours || ''} onChange={e => setProfile({ ...profile, sleep_goal_hours: e.target.value })} />
        </FormSection>

        <ButtonContainer>
          <LogoutButton onClick={handleLogout}>
            <FiLogOut /> Logout
          </LogoutButton>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </ButtonContainer>
        <DangerZone>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setDangerOpen(v => !v)}>
            Danger Zone {dangerOpen ? '▲' : '▼'}
          </div>
          {dangerOpen && (
            <>
              <div style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Deleting your account will permanently erase all your data. This action cannot be undone.
              </div>
              <SubtleDeleteButton type="button" onClick={async () => {
                if (!window.confirm('Are you absolutely sure? This will permanently delete your account and all data.')) return;
                try {
                  const res = await fetch('/api/delete-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                  });
                  if (res.ok) {
                    alert('Your account and data have been deleted.');
                    await signOut();
                    router.push('/signup');
                  } else {
                    const err = await res.json();
                    alert('Error deleting account: ' + (err.error || 'Unknown error'));
                  }
                } catch (err) {
                  alert('Error deleting account: ' + err.message);
                }
              }}>
                Delete my account
              </SubtleDeleteButton>
            </>
          )}
        </DangerZone>
      </Form>
    </ProfileContainer>
  );
}
export default UserProfile;