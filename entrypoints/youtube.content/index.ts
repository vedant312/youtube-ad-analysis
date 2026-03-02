// entrypoints/youtube.content.ts

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  // world: 'MAIN',
  main() {
    let lastAdId = '';

    const scrapeStats = () => {
      // 1. URL GUARD: If we are on the home page or search results, STOP.
      if (!window.location.pathname.includes('/watch')) {
        console.log('⚠️ Scrape aborted: Not on a watch page.');
        return;
      }
      const player = document.getElementById('movie_player') as any;
      if (!player || !player.classList.contains('ad-showing')) return;

      // 1. ADD A DELAY: Wait 1 second for YouTube's internal state to switch to the Ad
      setTimeout(() => {
        // Dispatch right-click to open "Stats for Nerds"
        player.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window,
            buttons: 2,
          }),
        );

        // 2. Small delay to let the context menu render
        setTimeout(() => {
          const menuItems = document.querySelectorAll('.ytp-menuitem');
          const statsBtn = Array.from(menuItems).find((i) =>
            i.textContent?.includes('Stats for nerds'),
          ) as HTMLElement;

          if (statsBtn) {
            statsBtn.click(); // Open the panel

            requestAnimationFrame(() => {
              const panel = document.querySelector('.ytp-sfn') as HTMLElement;
              if (panel) {
                panel.style.visibility = 'hidden';
                panel.style.position = 'absolute';
                panel.style.left = '-9999px';

                const idSpan = panel.querySelector('.ytp-sfn-cpn');
                if (idSpan?.textContent) {
                  const adId = idSpan.textContent.split(' / ')[0].trim();

                  // CRITICAL FIX: Get the actual Video ID from the URL
                  const urlParams = new URLSearchParams(window.location.search);
                  const mainContentId = urlParams.get('v');

                  if (adId && adId !== mainContentId && adId !== lastAdId) {
                    lastAdId = adId;

                    const adData = {
                      id: adId,
                      url: `https://www.youtube.com/watch?v=${adId}`,
                      timestamp: Date.now(),
                    };

                    window.postMessage(
                      { type: 'NEW_AD_DETECTED', data: adData },
                      '*',
                    );
                    console.log('✅ Accurate Ad Data Captured:', adData);
                  }
                }
                (panel.querySelector('.ytp-sfn-close') as HTMLElement)?.click();
              }
            });
          }
          const contextMenu = document.querySelector(
            '.ytp-contextmenu',
          ) as HTMLElement;
          if (contextMenu) contextMenu.style.display = 'none';
        }, 100);
      }, 1000); // 1 second wait for state transition
    };

    // Observer and Setup remain the same...
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          const isAdShowing = (
            mutation.target as HTMLElement
          ).classList.contains('ad-showing');
          if (isAdShowing && lastAdId === '') {
            // Only scrape once per ad
            scrapeStats();
          }
        }
      }
    });

    const setup = () => {
      const player = document.getElementById('movie_player');
      if (player) {
        observer.observe(player, {
          attributes: true,
          attributeFilter: ['class'],
        });
      } else {
        setTimeout(setup, 5000);
      }
    };
    setup();
  },
});

// Message Forwarder
window.addEventListener('message', (event) => {
  if (event.data.type === 'NEW_AD_DETECTED') {
    browser.runtime.sendMessage(event.data);
  }
});
