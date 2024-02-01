import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { TOKEN_COOKIE_NAME } from '../../lib/jwt';
import { httpGet } from '../../lib/http';
import { Spinner } from '../ReactIcons/Spinner.tsx';
import { GoogleIcon } from '../ReactIcons/GoogleIcon.tsx';

type GoogleButtonProps = {};

const GOOGLE_REDIRECT_AT = 'googleRedirectAt';
const GOOGLE_LAST_PAGE = 'googleLastPage';

export function GoogleButton(props: GoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const provider = urlParams.get('provider');

    if (!code || !state || provider !== 'google') {
      return;
    }

    setIsLoading(true);
    httpGet<{ token: string }>(
      `${import.meta.env.PUBLIC_API_URL}/v1-google-callback${
        window.location.search
      }`,
    )
      .then(({ response, error }) => {
        if (!response?.token) {
          setError(error?.message || 'Something went wrong.');
          setIsLoading(false);

          return;
        }

        let redirectUrl = '/';
        const googleRedirectAt = localStorage.getItem(GOOGLE_REDIRECT_AT);
        const lastPageBeforeGoogle = localStorage.getItem(GOOGLE_LAST_PAGE);

        // If the social redirect is there and less than 30 seconds old
        // redirect to the page that user was on before they clicked the github login button
        if (googleRedirectAt && lastPageBeforeGoogle) {
          const socialRedirectAtTime = parseInt(googleRedirectAt, 10);
          const now = Date.now();
          const timeSinceRedirect = now - socialRedirectAtTime;

          if (timeSinceRedirect < 30 * 1000) {
            redirectUrl = lastPageBeforeGoogle;
          }
        }

        const authRedirectUrl = localStorage.getItem('authRedirect');
        if (authRedirectUrl) {
          localStorage.removeItem('authRedirect');
          redirectUrl = authRedirectUrl;
        }

        localStorage.removeItem(GOOGLE_REDIRECT_AT);
        localStorage.removeItem(GOOGLE_LAST_PAGE);
        Cookies.set(TOKEN_COOKIE_NAME, response.token, {
          path: '/',
          expires: 30,
          domain: import.meta.env.DEV ? 'localhost' : '.roadmap.sh',
        });
        window.location.href = redirectUrl;
      })
      .catch((err) => {
        setError('Something went wrong. Please try again later.');
        setIsLoading(false);
      });
  }, []);

  const handleClick = () => {
    setIsLoading(true);
    httpGet<{ loginUrl: string }>(
      `${import.meta.env.PUBLIC_API_URL}/v1-google-login`,
    )
      .then(({ response, error }) => {
        if (!response?.loginUrl) {
          setError(error?.message || 'Something went wrong.');
          setIsLoading(false);

          return;
        }

        // For non authentication pages, we want to redirect back to the page
        // the user was on before they clicked the social login button
        if (!['/login', '/signup'].includes(window.location.pathname)) {
          const pagePath = ['/respond-invite', '/befriend'].includes(
            window.location.pathname,
          )
            ? window.location.pathname + window.location.search
            : window.location.pathname;

          localStorage.setItem(GOOGLE_REDIRECT_AT, Date.now().toString());
          localStorage.setItem(GOOGLE_LAST_PAGE, pagePath);
        }

        window.location.href = response.loginUrl;
      })
      .catch((err) => {
        setError('Something went wrong. Please try again later.');
        setIsLoading(false);
      });
  };

  return (
    <>
      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white p-2 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#333] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        onClick={handleClick}
      >
        {isLoading ? (
          <Spinner className={'h-[18px] w-[18px]'} isDualRing={false} />
        ) : (
          <GoogleIcon className={'h-[18px] w-[18px]'} />
        )}
        Continue with Google
      </button>
      {error && (
        <p className="mb-2 mt-1 text-sm font-medium text-red-600">{error}</p>
      )}
    </>
  );
}
