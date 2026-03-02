import React, { useEffect, useState } from 'react';

interface AdEntry {
    id: string;
    url: string;
    title: string;
    channel: string;
    timestamp: number;
    thumbnail: string;
}

export default function App() {
    const [ads, setAds] = useState<AdEntry[]>([]);

    useEffect(() => {
        // 1. Initial Load from Storage
        browser.storage.local.get("adHistory").then((res) => {
            const history = res.adHistory as AdEntry[] | undefined;
            if (history && Array.isArray(history)) {
                setAds(history);
            }
        });

        // 2. Listen for the ENRICHED message from Background, NOT the content script
        const listener = (message: any) => {
            if (message.type === "ENRICHED_AD_READY") {
                setAds((prev) => {
                    const isDuplicate = prev.some(ad => ad.id === message.data.id);
                    if (isDuplicate) return prev;
                    // Prepend the new enriched ad to the list
                    return [message.data, ...prev].slice(0, 10);
                });
            }
        };

        browser.runtime.onMessage.addListener(listener);
        return () => browser.runtime.onMessage.removeListener(listener);
    }, []);

    console.log('Rendering ads:', ads);

    const analyzeAd = async (ad: AdEntry) => {
        // Get active tab to tell background where to show the ShadowRoot UI
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        browser.runtime.sendMessage({
            type: "START_ANALYSIS",
            tabId: tab.id, // Pass this explicitly
            data: { adId: ad.id, adTitle: ad.title, channelName: ad.channel }
        });
    };

    return (
        <div style={{ width: 350, padding: 15, fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: 18, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
                📺 Recent YouTube Ads
            </h2>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {ads.length === 0 ? (
                    <p style={{ color: '#666' }}>No ads detected yet. Start watching!</p>
                ) : (
                    ads.map((ad) => (
                        <div key={ad.timestamp} style={cardStyle}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <img
                                    src={ad.thumbnail}
                                    style={{ width: '100px', borderRadius: '4px', objectFit: 'cover' }}
                                    alt="thumbnail"
                                />
                                <button
                                    onClick={() => analyzeAd(ad)}
                                    className="mt-2 text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded transition-colors"
                                >
                                    Analyze Transparency →
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const cardStyle = {
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee'
};

const linkStyle = {
    display: 'block',
    marginTop: '8px',
    fontSize: '11px',
    color: '#065fd4',
    textDecoration: 'none'
};