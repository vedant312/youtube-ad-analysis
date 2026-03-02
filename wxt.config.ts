import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  manifest: ({ browser, manifestVersion, mode, command }) => {
    return {
      manifest_version: 3,
      name: 'Ad Analyzer',
      version: '1.1.0',
      permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
      host_permissions: ['*://*.youtube.com/*'],
      description: 'Analyze ads on web pages.',
      // ...
      action: {
        default_title: 'Some Title',
      },
      web_accessible_resources: [
        {
          matches: ['*://*/*'],
          resources: ['icon/*.png'],
        },
      ],
    };
  },
});
