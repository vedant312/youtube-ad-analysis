// import './popup/style.css';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  async main(ctx) {
    let uiInstance: any = null;

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'SHOW_LOADER') {
        mountAnalysisUI(ctx, { loading: true });
      } else if (message.type === 'ANALYSIS_RESULT') {
        mountAnalysisUI(ctx, { loading: false, data: message.data });
      }
    });

    async function mountAnalysisUI(
      ctx: any,
      props: { loading: boolean; data?: any },
    ) {
      if (uiInstance) {
        updateUIContent(props);
        return;
      }

      // Fix: Use 'overlay' instead of 'fixed'
      // Fix: Use 'last' or 'first' instead of 'body' for append
      uiInstance = await createShadowRootUi(ctx, {
        name: 'ad-analysis-popup',
        position: 'overlay',
        anchor: 'body',
        append: 'last',
        onMount: (container) => {
          const wrapper = document.createElement('div');
          wrapper.id = 'analysis-root';
          container.append(wrapper);
          updateUIContent(props);
        },
      });

      uiInstance.mount();
    }

    function updateUIContent(props: { loading: boolean; data?: any }) {
      const root = document
        .querySelector('ad-analysis-popup')
        ?.shadowRoot?.getElementById('analysis-root');
      if (!root) return;

      const { loading, data } = props;

      // Position logic is now handled in the inline CSS of the inner div
      root.innerHTML = `
        <div style="
          position: fixed; 
          bottom: 24px; 
          right: 24px; 
          width: 340px; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 12px 32px rgba(0,0,0,0.15); 
          font-family: system-ui, -apple-system, sans-serif; 
          border: 1px solid #e5e7eb; 
          z-index: 9999;
          overflow: hidden;
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <div style="background: #065fd4; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 14px;">Ad Transparency AI</span>
            <button id="close-ui" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 0 4px;">&times;</button>
          </div>
          
          <div style="padding: 16px; max-height: 450px; overflow-y: auto;">
            ${
              loading
                ? `
              <div style="text-align: center; padding: 30px 0;">
                <div class="loader"></div>
                <p style="color: #4b5563; font-size: 14px; margin-top: 12px;">Analyzing with GPT-4...</p>
              </div>
            `
                : renderData(data)
            }
          </div>
        </div>
        <style>
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .loader { 
            border: 3px solid #f3f3f3; 
            border-top: 3px solid #065fd4; 
            border-radius: 50%; 
            width: 28px; 
            height: 28px; 
            animation: spin 0.8s linear infinite; 
            margin: 0 auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `;

      root.querySelector('#close-ui')?.addEventListener('click', () => {
        uiInstance?.remove();
        uiInstance = null;
      });
    }

    function renderData(data: any) {
      // 1. Validation for the new data structure
      if (!data || data.error || !data[0]) {
        return `<p style="color: #dc2626; font-size: 14px;">Failed to analyze this ad. Please try again.</p>`;
      }

      // Pathing: Extract the root video info and the nested analysis
      const videoInfo = data[0];
      const item = videoInfo.analysis_output?.output;

      if (!item) {
        return `<p style="color: #dc2626; font-size: 14px;">Analysis data missing.</p>`;
      }

      return `
    <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <p style="margin: 0; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600;">YouTube Context</p>
        <span style="background: #ecfdf5; color: #065f46; font-size: 9px; padding: 2px 6px; border-radius: 10px; font-weight: 700; border: 1px solid #a7f3d0;">
          VERIFIED CACHE
        </span>
      </div>
      <h4 style="margin: 4px 0 2px 0; font-size: 13px; color: #111827; font-weight: 700; line-height: 1.3;">
        ${videoInfo.video_title}
      </h4>
      <p style="margin: 0; font-size: 12px; color: #065fd4; font-weight: 500;">
        ${videoInfo.channel_name}
      </p>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="background: #065fd4; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
          ${item.brand_identity?.industry || 'Brand'}
        </span>
      </div>
      <h3 style="margin: 0; font-size: 18px; color: #111827; font-weight: 800; line-height: 1.2;">
        ${item.brand_identity?.name || 'Advertisement'}
      </h3>
    </div>

    <div style="background: #f0f7ff; border-radius: 10px; padding: 12px; margin-bottom: 16px; border: 1px solid #dbeafe;">
      <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">
        📊 Market Intelligence
      </h4>
      <div style="display: grid; gap: 8px; font-size: 12px; color: #1e3a8a;">
        <div><strong>💰 Pricing:</strong> ${item.market_intelligence?.pricing_info || 'N/A'}</div>
        <div><strong>📈 Stats:</strong> ${item.market_intelligence?.popularity_metrics || 'N/A'}</div>
        <div><strong>⚔️ Edge:</strong> ${item.market_intelligence?.competitive_edge || 'N/A'}</div>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">
        🔍 Truth vs. Hype
      </h4>
      <div style="display: grid; gap: 10px;">
        ${item.transparency_audit?.claims_vs_reality
          ?.map(
            (f: { claim: string; reality: string }) => `
          <div style="padding: 10px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; border-left: 4px solid #065fd4;">
            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #111827;">"${f.claim}"</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #4b5563; line-height: 1.4;">${f.reality}</p>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>

    <div style="background: #111827; border-radius: 10px; padding: 12px; color: white;">
      <h4 style="margin: 0 0 4px 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">
        AI Recommendation
      </h4>
      <p style="margin: 0; font-size: 12px; line-height: 1.4; font-weight: 500;">
        ${item.decision_summary}
      </p>
    </div>

    <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f3f4f6;">
      <span style="font-size: 11px; color: #6b7280; font-weight: 500;">Trust Score</span>
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 60px; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
          <div style="width: ${item.transparency_audit?.transparency_score * 10 || 0}%; height: 100%; background: #065fd4;"></div>
        </div>
        <span style="font-weight: 700; font-size: 13px; color: #111827;">
          ${item.transparency_audit?.transparency_score}/10
        </span>
      </div>
    </div>
  `;
    }
  },
});
