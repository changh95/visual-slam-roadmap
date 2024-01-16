import Cookies from 'js-cookie';
import { TOKEN_COOKIE_NAME } from '../../lib/jwt';

export function logout() {
  Cookies.remove(TOKEN_COOKIE_NAME, {
    path: '/',
    domain: import.meta.env.DEV ? 'localhost' : '.roadmap.sh',
  });

  // Reloading will automatically redirect the user if required
  window.location.reload();
}

function bindEvents() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const dataset = {
      ...target.dataset,
      ...target.closest('button')?.dataset,
    };

    const accountDropdown = document.querySelector('[data-account-dropdown]');

    // If the user clicks on the logout button, remove the token cookie
    if (dataset.logoutButton !== undefined) {
      e.preventDefault();
      logout();
    } else if (dataset.showMobileNav !== undefined) {
      document.querySelector('[data-mobile-nav]')?.classList.remove('hidden');
    } else if (dataset.closeMobileNav !== undefined) {
      document.querySelector('[data-mobile-nav]')?.classList.add('hidden');
    } else if (
      accountDropdown &&
      !target?.closest('[data-account-dropdown]') &&
      !accountDropdown.classList.contains('hidden')
    ) {
      accountDropdown.classList.add('hidden');
    }
  });

  document
    .querySelector('[data-account-button]')
    ?.addEventListener('click', (e) => {
      e.stopPropagation();
      document
        .querySelector('[data-account-dropdown]')
        ?.classList.toggle('hidden');
    });

  document
    .querySelector('[data-command-menu]')
    ?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('command.k'));
    });
}

bindEvents();
