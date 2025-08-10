'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from '@emotion/styled';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthProvider';
import { v4 as uuidv4 } from 'uuid';

const DropzoneContainer = styled.div`
  border: 2px dashed ${({ theme }) => theme.borderColor};
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease;
  border-radius: 8px;
  margin-bottom: 1rem;

  &:hover {
    border-color: ${({ theme }) => theme.primary};
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: white;
  cursor: pointer;
  font-weight: 500;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.primaryDark};
  }
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.error};
  margin: 0.5rem 0;
`;

const AnalysisResult = styled.div`
  background: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const CameraControls = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  justify-content: center;
  padding: 1rem;
  background: ${({ theme }) => theme.background.secondary};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const CameraPreview = styled.video`
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  margin: 1rem 0;
  background: ${({ theme }) => theme.background.secondary};
  min-height: 300px; // Add minimum height
  object-fit: cover; // Ensure video fills container
  transform: scaleX(-1); // Mirror front camera if needed
`;

const CameraButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  background: ${({ theme, variant }) => 
    variant === 'danger' 
      ? theme.error 
      : theme.primaryButton.background};
  color: #ffffff; // Always white for best contrast
  min-width: 120px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    background: ${({ theme, variant }) => 
      variant === 'danger' 
        ? theme.error 
        : theme.primaryButton.hover};
  }
`;

const LoggerContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: ${({ theme }) => theme.background.secondary};
  padding: 0.5rem;
  border-radius: 8px;
`;

const TabButton = styled.button`
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: none;
  background: ${({ isActive, theme }) => 
    isActive ? theme.primaryButton.background : 'transparent'};
  color: ${({ isActive, theme }) => 
    isActive ? '#ffffff' : theme.text.primary}; // Improved contrast
  cursor: pointer;
  font-weight: ${({ isActive }) => isActive ? '600' : '500'};
  flex: 1;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: ${({ isActive }) => 
    isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};

  &:hover {
    background: ${({ isActive, theme }) => 
      isActive 
        ? theme.primaryButton.hover 
        : theme.background.hover};
    color: ${({ isActive, theme }) => 
      isActive ? '#ffffff' : theme.text.primary};
  }
`;

const InputGroup = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StyledInput = styled.input`
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border.primary};
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.text.primary};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.text.secondary};
  }
`;

const FoodLogger = ({ onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState('camera'); // Changed from 'manual'
  const videoRef = useRef(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const imageFile = acceptedFiles[0];
    if (!imageFile) return;

    setLoading(true);
    setError('');
    setAnalysis(null);
    setPreview(URL.createObjectURL(imageFile));

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(imageFile, options);
      setFile(compressedFile);

      // Convert file to base64 to send to the new API route
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        try {
          const response = await axios.post('/api/food-analyzer', {
            image_data: base64data,
            image_type: compressedFile.type,
          });

          if (response.data.success && response.data.analysis) {
            const { analysis: resAnalysis } = response.data;
            const analysisData = {
              foodName: resAnalysis.food_name,
              calories: resAnalysis.calories,
              portionSize: resAnalysis.portion_size,
              nutrition: {
                protein: `${resAnalysis.protein_g || 0}g`,
                carbs: `${resAnalysis.carbs_g || 0}g`,
                fat: `${resAnalysis.fat_g || 0}g`
              }
            };
            setAnalysis(analysisData);
          } else {
            throw new Error(response.data.error || 'Failed to analyze image');
          }
        } catch (err) {
          console.error('Analysis Error:', err);
          setError(err.response?.data?.error || err.message || 'Failed to analyze image. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Could not read the image file.');
        setLoading(false);
      };
    } catch (err) {
      console.error('Image Compression Error:', err);
      setError('Failed to compress image. Please try a different one.');
      setLoading(false);
    }
  }, []);
  
  const resetState = () => {
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setError('');
  };

  const handleSave = async () => {
    try {
      if (!analysis) {
        throw new Error('No analysis data available');
      }

      // Safely parse calories to prevent database errors
      const caloriesInt = Math.round(parseFloat(analysis.calories)) || 0;

      const entry = {
        food_name: analysis.foodName,
        calories: caloriesInt,
        portion_size: analysis.portionSize,
        notes: '',
        image_url: preview || null,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      console.log('Saving entry:', entry);

      const { error } = await supabase
        .from('food_entries')
        .insert([entry]);

      if (error) throw error;

      // Reset form state
      setPreview(null);
      setAnalysis(null);
      setFile(null);
      setError('');

      // Call onSuccess only if it exists
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving food entry:', err);
      setError(err.message || 'Failed to save food entry');
    }
  };

  const startCamera = async () => {
    try {
      // First check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device/browser');
      }

      // Try environment camera first (back camera)
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { exact: "environment" }
          }
        });
        setStream(mediaStream);
      } catch (backCameraError) {
        // If back camera fails, try any available camera
        console.log('Back camera not available, trying front camera');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        setStream(mediaStream);
      }

      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video is playing
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      await onDrop([file]);
      stopCamera();
    }, 'image/jpeg');
  };

  // Add cleanup for camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Add this effect after your other useEffect
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        setError('Failed to start video stream');
      });
    }
  }, [stream]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  return (
    <LoggerContainer>
      <h3>Log Your Meal</h3>
      
      <TabContainer>
        <TabButton 
          isActive={activeTab === 'camera'} 
          onClick={() => setActiveTab('camera')}
        >
          <span role="img" aria-label="camera">📸</span>
          Take Photo
        </TabButton>
        <TabButton 
          isActive={activeTab === 'upload'} 
          onClick={() => setActiveTab('upload')}
        >
          <span role="img" aria-label="upload">📤</span>
          Upload Photo
        </TabButton>
        <TabButton 
          isActive={activeTab === 'manual'} 
          onClick={() => setActiveTab('manual')}
        >
          <span role="img" aria-label="manual">✍️</span>
          Manual Entry
        </TabButton>
      </TabContainer>

      {activeTab === 'manual' && (
        <div style={{ marginBottom: '1rem' }}>
          <h4>Option 1: Manual Entry</h4>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
              const entry = {
                food_name: formData.get('foodName'),
                calories: parseInt(formData.get('calories')),
                portion_size: formData.get('portionSize'),
                user_id: user.id,
                created_at: new Date().toISOString()
              };

              const { error } = await supabase
                .from('food_entries')
                .insert([entry]);

              if (error) throw error;

              if (typeof onSuccess === 'function') {
                onSuccess();
              }
            } catch (err) {
              setError('Failed to save food entry. Please try again.');
            }
          }}>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
              <StyledInput name="foodName" placeholder="Food Name" required />
              <StyledInput name="calories" type="number" placeholder="Calories" required />
              <StyledInput name="portionSize" placeholder="Portion Size" required />
              <StyledInput name="protein" placeholder="Protein (g)" />
              <StyledInput name="carbs" placeholder="Carbs (g)" />
              <StyledInput name="fat" placeholder="Fat (g)" />
            </div>
            <Button type="submit">Save Manual Entry</Button>
          </form>
        </div>
      )}

      {activeTab === 'upload' && (
        <>
          <h4>Option 2: Upload Photo</h4>
          <DropzoneContainer {...getRootProps()}>
            <input {...getInputProps()} />
            {loading ? (
              <p>Processing...</p>
            ) : (
              <div>
                <p><span role="img" aria-label="upload">📤</span></p>
                <p>Drag & drop a food image here, or click to select one</p>
              </div>
            )}
          </DropzoneContainer>
        </>
      )}

      {activeTab === 'camera' && (
        <div>
          <h4>Take a Photo</h4>
          {!cameraActive ? (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Button 
                onClick={startCamera}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem'
                }}
              >
                <span role="img" aria-label="camera">📸</span> Open Camera
              </Button>
              <p style={{ 
                marginTop: '0.5rem', 
                color: theme => theme.text.secondary,
                fontSize: '0.9rem' 
              }}>
                Make sure to allow camera access when prompted
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}>
              <CameraPreview
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
              <CameraControls>
                <CameraButton onClick={capturePhoto}>
                  <span role="img" aria-label="capture">📸</span> Take Photo
                </CameraButton>
                <CameraButton 
                  variant="danger" 
                  onClick={stopCamera}
                >
                  <span role="img" aria-label="close">❌</span> Close Camera
                </CameraButton>
              </CameraControls>
            </div>
          )}
        </div>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {preview && (
        <div style={{ 
          margin: '1rem 0',
          borderRadius: '8px',
          overflow: 'hidden',
          maxWidth: '300px'
        }}>
          <img 
            src={preview} 
            alt="Food preview" 
            style={{ 
              width: '100%',
              height: 'auto',
              display: 'block'
            }} 
          />
        </div>
      )}

      {analysis && (
        <AnalysisResult>
          <h4>Analysis Results</h4>
          <div style={{ 
            display: 'grid', 
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            marginBottom: '1rem'
          }}>
            <div>
              <strong>Food:</strong>
              <p>{analysis.foodName}</p>
            </div>
            <div>
              <strong>Portion:</strong>
              <p>{analysis.portionSize}</p>
            </div>
            <div>
              <strong>Calories:</strong>
              <p>{analysis.calories} kcal</p>
            </div>
          </div>
          {analysis.nutrition && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Nutrition:</strong>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginTop: '0.5rem'
              }}>
                <div>Protein: {analysis.nutrition.protein}</div>
                <div>Carbs: {analysis.nutrition.carbs}</div>
                <div>Fat: {analysis.nutrition.fat}</div>
              </div>
            </div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Saving...' : 'Save Entry'}
          </Button>
        </AnalysisResult>
      )}
    </LoggerContainer>
  );
};

export default FoodLogger;