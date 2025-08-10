'use client';
import { useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import FoodLogger from '@/components/FoodLogger'; // Re-use the food logger for image input

const Container = styled.div`
  padding: 2rem;
  max-width: 700px;
  margin: auto;
`;

const ResultCard = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: ${({ theme }) => theme.cardBg};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.borderColor};
`;

const Grade = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: ${({ grade, theme }) => {
    if (['A', 'B'].includes(grade)) return '#10B981'; // Green
    if (['C', 'D'].includes(grade)) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  }};
`;

// This is a simplified example. You would integrate the image upload
// logic from FoodLogger directly or as a shared component.
export default function ShouldIEatPage() {
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyzeText = async () => {
    if (!textInput) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await axios.post('/api/should-i-eat', { foodDescription: textInput });
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Error analyzing food.');
    } finally {
      setLoading(false);
    }
  };
  
  // You would also implement a function to handle image uploads
  // that calls the same API endpoint.

  return (
    <Container>
      <h1>Should I Eat This?</h1>
      <p>Get an AI-powered recommendation based on your goals and recent intake.</p>
      
      {/* For now, we'll use a text input for simplicity. */}
      {/* You should replace this with a component that accepts text OR image */}
      <input 
        type="text" 
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="e.g., 'a large pepperoni pizza' or 'a bowl of quinoa salad'"
        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
      />
      <button onClick={handleAnalyzeText} disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? 'Analyzing...' : 'Get Advice'}
      </button>

      {result && (
        <ResultCard>
          <Grade grade={result.grade}>{result.grade}</Grade>
          <h3>{result.title}</h3>
          <p>{result.reasoning}</p>
          <h4>Healthier Alternatives:</h4>
          <p>{result.alternatives}</p>
        </ResultCard>
      )}
    </Container>
  );
}