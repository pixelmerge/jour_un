'use client';
import { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';
import { useAuth } from '@/context/AuthProvider';

const SettingsButton = styled.button`
  position: fixed;
  top: 1rem;
  right: 1rem;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
  color: ${props => props.theme.text.primary};
  z-index: 100;

  &:hover {
    background: ${props => props.theme.card.background};
  }
`;

const SettingsPanel = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-320px'};
  width: 320px;
  height: 100vh;
  background: ${props => props.theme.card.background};
  border-left: 1px solid ${props => props.theme.card.border};
  padding: 2rem;
  transition: right 0.3s ease;
  z-index: 99;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <>
      <SettingsButton onClick={() => setIsOpen(!isOpen)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </SettingsButton>

      <SettingsPanel isOpen={isOpen}>
        <h2>Settings</h2>
        <Button variant="secondary" onClick={signOut}>
          Sign Out
        </Button>
      </SettingsPanel>
    </>
  );
}
