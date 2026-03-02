import { getDurationInSeconds } from '../helper';
const YOUTUBE_API_KEY = import.meta.env.WXT_YOUTUBE_API_KEY;

export default defineBackground(() => {
  // Runs on installation
  browser.runtime.onInstalled.addListener(() => {
    console.log('YouTube Ad Detector Extension Installed');
  });

  // Optional: Monitor tab updates to re-verify content script status
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
      changeInfo.status === 'complete' &&
      tab.url?.includes('youtube.com/watch')
    ) {
      console.log(`Mapsd to YouTube video: ${tabId}`);
    }
  });

  browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'NEW_AD_DETECTED') {
      const adId = message.data.id;

      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${adId}&key=${YOUTUBE_API_KEY}`,
        );
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const { snippet, contentDetails } = data.items[0];

          // 2. Parse duration and apply the 3-minute filter
          const totalSeconds = getDurationInSeconds(contentDetails.duration);

          if (totalSeconds > 180) {
            console.warn(
              `🛑 Discarded: Video is ${totalSeconds}s (likely not an ad).`,
            );
            return; // Exit here - do not save or broadcast
          }

          const fullAdData = {
            id: adId,
            url: `https://www.youtube.com/watch?v=${adId}`,
            title: snippet.title,
            channel: snippet.channelTitle,
            thumbnail: snippet.thumbnails.medium.url,
            duration: totalSeconds, // Store numeric seconds for data analysis
            timestamp: Date.now(),
          };

          // 1. Save to Storage
          const res = await browser.storage.local.get<{ adHistory?: any[] }>(
            'adHistory',
          );
          const history = res.adHistory || [];
          if (!history.find((a: any) => a.id === adId)) {
            const newHistory = [fullAdData, ...history].slice(0, 20);
            await browser.storage.local.set({ adHistory: newHistory });
          }

          // 2. BROADCAST: Send the ENRICHED data to the popup
          // This ensures the popup only updates once the API data exists
          browser.runtime
            .sendMessage({
              type: 'ENRICHED_AD_READY',
              data: fullAdData,
            })
            .catch(() => {
              // Error is expected if popup is closed, so we ignore it
            });

          console.log('✅ Background: Enriched data sent to Popup');
        }
      } catch (error) {
        console.error('API Fetch Failed:', error);
      }
    }
  });

  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === 'START_ANALYSIS') {
      // 1. Target the specific tab that clicked the button
      const targetTabId = message.tabId || sender.tab?.id;

      if (targetTabId) {
        // 2. Tell the CONTENT SCRIPT in that tab to show the loader
        browser.tabs.sendMessage(targetTabId, { type: 'SHOW_LOADER' });
      }

      try {
        // 3. Call your n8n Webhook
        const response = await fetch(
          'http://localhost:5678/webhook/71ba705a-724c-46e9-851d-3b6c1a1c45a5',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message.data),
          },
        );

        const rawData = await response.json();
        console.log('n8n Response:', rawData);

        // 4. Send the cleaned JSON back to the CONTENT SCRIPT in the same tab
        if (targetTabId) {
          browser.tabs.sendMessage(targetTabId, {
            type: 'ANALYSIS_RESULT',
            data: rawData,
          });
        }
      } catch (err) {
        console.error('n8n Error:', err);
        // Optional: Send error message to UI to stop the loader
        if (targetTabId) {
          browser.tabs.sendMessage(targetTabId, {
            type: 'ANALYSIS_RESULT',
            data: { error: 'Failed to reach agent' },
          });
        }
      }
    }
  });
});
