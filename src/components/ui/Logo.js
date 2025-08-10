'use client';
import styled from '@emotion/styled';
import Link from 'next/link';
import Image from 'next/image';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const LogoImage = styled(Image)`
  height: 32px;
  width: auto;
`;

export function Logo() {
  return (
    <Link href="/home">
      <LogoContainer>
        <LogoImage
          src="/icons/logo.png"
          alt="Jour Un Logo"
          width={32}
          height={32}
          priority
        />
      </LogoContainer>
    </Link>
  );
}