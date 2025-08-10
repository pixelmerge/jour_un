import styled from '@emotion/styled';
import { motion } from 'framer-motion';

export const Card = styled(motion.div)`
  background: ${props => props.theme.card.background};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: transform 0.2s ease;

  ${props => props.interactive && `
    cursor: pointer;
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    }
  `}
`;
