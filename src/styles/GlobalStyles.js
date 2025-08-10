import { Global, css } from '@emotion/react';

const GlobalStyles = () => (
  <Global
    styles={theme => css`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        background: ${theme.background.primary};
        color: ${theme.text.primary};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                     Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
                     sans-serif;
        line-height: 1.5;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      button {
        font-family: inherit;
      }
    `}
  />
);

export default GlobalStyles;