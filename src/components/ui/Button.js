import styled from '@emotion/styled';
import { motion } from 'framer-motion';

export const Button = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ variant, theme }) => 
    variant === 'secondary' 
      ? theme.secondaryButton?.background 
      : variant === 'text'
        ? 'transparent'
        : theme.primaryButton.background};
  color: ${({ variant, theme }) => 
    variant === 'secondary' 
      ? theme.secondaryButton?.text || theme.text.primary
      : variant === 'text'
        ? theme.text.accent
        : '#ffffff'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-1px);
    background: ${({ variant, theme }) => 
      variant === 'secondary' 
        ? theme.secondaryButton?.hover 
        : variant === 'text'
          ? 'transparent'
          : theme.primaryButton.hover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
