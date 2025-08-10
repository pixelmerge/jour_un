import Link from 'next/link';
import styled from '@emotion/styled';
import { useAuth } from '@/context/AuthProvider';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeProvider';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 1rem;
  background: ${({ theme }) => theme.background.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.border.primary};
  z-index: 100;
`;

const NavItems = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenu = styled(motion.div)`
  display: none;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.background.secondary};
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border.primary};

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
`;

const NavLink = styled.a`
  padding: 0.5rem 1rem;
  color: ${({ theme }) => theme.text.primary};
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background: ${({ theme }) => theme.background.hover};
  }

  &.active {
    background: ${({ theme }) => theme.primaryButton.background};
    color: ${({ theme }) => theme.primaryButton.text};
  }
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${({ theme }) => theme.text.primary};
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: block;
  }
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid ${({ theme }) => theme.border.primary};
  border-radius: 6px;
  color: ${({ theme }) => theme.text.primary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.background.hover};
  }
`;

const ThemeToggle = styled.button`
  padding: 0.5rem;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.background.hover};
  color: ${({ theme }) => theme.text.primary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

export function Navigation() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const navItems = [];

  return (
    <>
      <Nav>
        <Link href="/" passHref>
          <NavLink style={{ fontWeight: 'bold' }}>jour-un</NavLink>
        </Link>

        <NavItems>
          {navItems.map(({ path, label }) => (
            <Link key={path} href={path} passHref>
              <NavLink className={currentPath === path ? 'active' : ''}>
                {label}
              </NavLink>
            </Link>
          ))}
        </NavItems>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle onClick={toggleTheme}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </ThemeToggle>

          {user ? (
            <Link href="/profile" passHref>
              <ProfileButton>
                <img 
                  src={user.user_metadata?.avatar_url || '/default-avatar.png'} 
                  alt="Profile" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
              </ProfileButton>
            </Link>
          ) : (
            <Link href="/login" passHref>
              <NavLink>Login</NavLink>
            </Link>
          )}

          <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </MenuButton>
        </div>
      </Nav>

      <AnimatePresence>
        {isMenuOpen && (
          <MobileMenu
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {navItems.map(({ path, label }) => (
              <Link key={path} href={path} passHref>
                <NavLink 
                  className={currentPath === path ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </NavLink>
              </Link>
            ))}
          </MobileMenu>
        )}
      </AnimatePresence>
    </>
  );
}