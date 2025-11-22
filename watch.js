// --- CONFIGURATION (Global) ---
const config = {
    discordServerId: "1422384816472457288"
};

// Global variable to hold the selected affiliate link
window.currentAffiliateLink = "https://amzn.to/44dBQJe"; // Default Global

// ==================================================
// 1. ADVANCED GEO-TARGETING & AFFILIATE LOGIC
// ==================================================

const OFFERS_BY_COUNTRY = {
    "US": [
        "https://record.webpartners.co/_QUm2k2WIfIo1bkozPnn1SmNd7ZgqdRLk/1/", 
        "https://record.webpartners.co/_QUm2k2WIfIoBfkWNuc6vQmNd7ZgqdRLk/1/"
    ],
    "GB": [
        "https://amzn.to/4a1LYZh"
    ],
    "CA": [
        "https://record.betsson.com/_Ipto0Q-i5zSwcAgXsjz1uGNd7ZgqdRLk/1/",
        "https://record.betsson.com/_Ipto0Q-i5zSMxelRx-4u3GNd7ZgqdRLk/1/",
        "https://record.webpartners.co/_QUm2k2WIfIo1bkozPnn1SmNd7ZgqdRLk/1/"
    ],
    "BR": [
        "https://1wksrw.com/?open=register&p=h8zt"
    ],
    // Fallback
    "Global": [
        "https://1wksrw.com/betting?open=register&p=xctu",
        "https://1wksrw.com/?open=register&p=h8zt"
    ]
};

const CROSS_BORDER_RULES = {
    "https://1wksrw.com/betting?open=register&p=xctu": ["BR", "RU", "IN"], 
    "https://1wksrw.com/?open=register&p=h8zt": ["BD", "PH", "AR"],
    "https://record.betsson.com/_Ipto0Q-i5zR7HLc7-ZUbAGNd7ZgqdRLk/1/": ["AR", "BR", "CO", "GR"],
    "https://record.webpartners.co/_QUm2k2WIfIo1bkozPnn1SmNd7ZgqdRLk/1/": ["DE", "NO", "NZ", "PR", "PT", "AR", "CL", "PH", "SG"]
};

// --- NEW: HIGH TRAFFIC GEO-DETECTION (GITHUB PAGES OPTIMIZED - OPTION A) ---
async function getHighTrafficCountry() {
    
    // Method 1: GeoJS (Primary)
    // Pros: Currently unlimited free requests (Client-side), Fast, CORS-friendly.
    try {
        // We add a timestamp to prevent browser caching stale results
        const res = await fetch('https://get.geojs.io/v1/ip/country.json?_=' + new Date().getTime());
        if (!res.ok) throw new Error('GeoJS error');
        const data = await res.json();
        if (data.country) {
            return data.country.toUpperCase();
        }
    } catch (e) {
        console.warn("GeoJS failed, switching to backup...");
    }

    // Method 2: Country.is (Backup)
    // Pros: Hosted on Cloudflare, highly scalable API for static sites.
    try {
        const res = await fetch('https://api.country.is');
        if (!res.ok) throw new Error('Country.is error');
        const data = await res.json();
        if (data.country) {
            return data.country.toUpperCase();
        }
    } catch (e) {
        console.error("All Geo methods failed.");
    }

    // Default Fallback
    return "Global";
}

async function getSmartAffiliateLink() {
    let userCountry = await getHighTrafficCountry();
    let linkPool = [];

    if (OFFERS_BY_COUNTRY[userCountry]) {
        linkPool = linkPool.concat(OFFERS_BY_COUNTRY[userCountry]);
    }

    for (const [linkUrl, allowedCountries] of Object.entries(CROSS_BORDER_RULES)) {
        if (allowedCountries.includes(userCountry)) {
            linkPool.push(linkUrl);
        }
    }

    if (linkPool.length === 0) {
        linkPool = OFFERS_BY_COUNTRY["Global"];
    }

    const randomIndex = Math.floor(Math.random() * linkPool.length);
    return linkPool[randomIndex];
}

async function updateAdLinks() {
    const finalLink = await getSmartAffiliateLink();
    window.currentAffiliateLink = finalLink; // Store for In-Feed Ad

    // Update all dynamic elements (NOT footer)
    const adElements = document.querySelectorAll('.dynamic-affiliate-link');
    adElements.forEach(el => {
        el.href = finalLink;
    });
}

// ==================================================
// 2. WATCH PAGE LOGIC
// ==================================================

function parseUrlFromHash() {
    const hash = window.location.hash.substring(1); 
    if (!hash) return null;
    const pathParts = hash.replace(/^\//, '').split('/');
    if (pathParts.length < 3) return null;
    const [matchId, sourceName, streamIdentifier] = pathParts;
    const quality = streamIdentifier.substring(0, 2);
    const streamNumber = parseInt(streamIdentifier.substring(2), 10);
    if (!matchId || !sourceName || !['hd', 'sd'].includes(quality) || isNaN(streamNumber)) return null;
    return { matchId, sourceName, quality, streamNumber };
}

function renderStreamRow(stream, index, match, activeStream) {
    if (!activeStream) activeStream = {};
    const isActive = stream.source === activeStream.source &&
    (stream.hd ? 'hd' : 'sd') === (activeStream.hd ? 'hd' : 'sd') &&
    stream.streamNo === activeStream.streamNo;

    const row = isActive ? document.createElement("div") : document.createElement("a");
    row.className = "stream-row";
    if (isActive) {
        row.classList.add("active");
    } else {
        const quality = stream.hd ? 'hd' : 'sd';
        row.href = `#/${match.id}/${stream.source}/${quality}${stream.streamNo}`;
    }

    const qualityTagClass = stream.hd ? "hd" : "sd";
    const qualityText = stream.hd ? "HD" : "SD";
    const viewersHTML = stream.viewers > 0 ? `<div class="viewers-count"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>${stream.viewers}</div>` : '';
    const languageHTML = `<div class="stream-lang"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>${stream.language || "English"}</div>`;
    const statusIcon = isActive ? `<span class="status-running">Running</span>` : `<span class="open-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>`;

    row.innerHTML = `
        <div class="stream-label">
            <span class="quality-tag ${qualityTagClass}">${qualityText}</span>
            <span>Stream ${index + 1}</span>
            ${statusIcon}
        </div>
        <div class="stream-meta">${viewersHTML}${languageHTML}</div>`;
    return row;
}

async function renderStreamSource(source, match, activeStream) {
    const description = "Reliable streams";
    try {
        const res = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
        if (!res.ok) return null;
        let streams = await res.json();
        if (!streams || streams.length === 0) return null;
        
        streams.sort((a, b) => (b.hd - a.hd) || ((b.viewers || 0) - (a.viewers || 0)));
        
        const sourceContainer = document.createElement("div");
        sourceContainer.className = "stream-source";
        if (streams.some(s => s.id === activeStream.id)) sourceContainer.dataset.containsActive = "true";

        sourceContainer.innerHTML = `<div class="source-header"><span class="source-name">${source.source.charAt(0).toUpperCase() + source.source.slice(1)}</span><span class="source-count">${streams.length} streams</span></div><small class="source-desc">✨ ${description}</small>`;
        
        const fragment = document.createDocumentFragment();
        streams.forEach((stream, i) => fragment.appendChild(renderStreamRow(stream, i, match, activeStream)));
        sourceContainer.appendChild(fragment);
        return sourceContainer;
    } catch (err) { return null; }
}

function createInFeedAd() {
    const adDiv = document.createElement('div');
    adDiv.className = 'stream-infeed-ad';
    adDiv.innerHTML = `
        <a href="${window.currentAffiliateLink}" target="_blank" class="infeed-content dynamic-affiliate-link">
            <div class="infeed-left">
                <span class="rec-tag"><i class="fa-solid fa-star"></i> REC</span>
                <span style="font-weight:bold;">High Speed Server</span>
            </div>
            <div class="infeed-btn">Watch <i class="fa-solid fa-play"></i></div>
        </a>
    `;
    return adDiv;
}

async function initializeWatchPage() {
    const urlData = parseUrlFromHash();
    const titleEl = document.getElementById("watch-title");
    const playerEl = document.getElementById("stream-player");
    const playerContainerEl = document.getElementById("stream-player-container");
    const streamsContainer = document.getElementById("streams-container");
    const sourcesSummaryEl = document.getElementById('sources-summary');
    const showAllBtn = document.getElementById("show-all-sources-btn");
    
    if (!urlData) {
        titleEl.textContent = "Error: Invalid Stream Link";
        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
        playerContainerEl.innerHTML = `<div class="error-message">Invalid stream URL hash.</div>`;
        return;
    }

    titleEl.textContent = ''; 
    titleEl.classList.add('skeleton'); 
    playerContainerEl.classList.add('skeleton');
    playerEl.src = 'about:blank';
    streamsContainer.innerHTML = '<div class="stream-source is-loading"><div class="source-header"><span class="source-name">&nbsp;</span><span class="source-count">&nbsp;</span></div><small class="source-desc">&nbsp;</small><div class="stream-row"></div><div class="stream-row"></div></div>';
    sourcesSummaryEl.textContent = ''; sourcesSummaryEl.classList.add('skeleton');

    try {
        const { matchId, sourceName, quality, streamNumber } = urlData;
        const res = await fetch("https://streamed.pk/api/matches/all");
        if (!res.ok) throw new Error("Could not fetch match list");
        const allMatches = await res.json();
        const match = allMatches.find(m => String(m.id) === String(matchId));
        if (!match) throw new Error("Match not found");

        const sourceForStream = match.sources.find(s => s.source === sourceName);
        if (!sourceForStream) throw new Error("Source not found for this match");

        const streamRes = await fetch(`https://streamed.pk/api/stream/${sourceForStream.source}/${sourceForStream.id}`);
        if (!streamRes.ok) throw new Error(`Could not fetch streams from source: ${sourceName}`);
        
        const streams = await streamRes.json();
        const activeStream = streams.find(s => (s.hd ? 'hd' : 'sd') === quality && s.streamNo === streamNumber);
        if (!activeStream) throw new Error("Stream not found.");

        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
        
        const qualityLabel = activeStream.hd ? "HD" : "SD";
        const pageTitle = `Live ${match.title} Stream Link (${activeStream.source.charAt(0).toUpperCase() + activeStream.source.slice(1)} ${qualityLabel} ${activeStream.streamNo})`;
        document.title = pageTitle;
        titleEl.textContent = pageTitle;
        playerEl.src = activeStream.embedUrl;

        // --- AD INJECTION START ---
        streamsContainer.innerHTML = "";
        streamsContainer.appendChild(createInFeedAd());
        // --- AD INJECTION END ---

        if (match.sources && match.sources.length > 0) {
            const sourcePromises = match.sources.map(source => renderStreamSource(source, match, activeStream));
            const sourceElements = (await Promise.all(sourcePromises)).filter(Boolean);
            
            const totalSources = sourceElements.length;
            if (totalSources === 0) {
                streamsContainer.innerHTML = `<p class="no-results">No other active streams found.</p>`;
                sourcesSummaryEl.textContent = 'No other sources available';
                return;
            }
            
            // LOGIC: Move Active Source to Top, then Show 3 / Hide Rest
            const activeSourceIndex = sourceElements.findIndex(el => el.dataset.containsActive === "true");
            if (activeSourceIndex > -1) {
                const activeEl = sourceElements.splice(activeSourceIndex, 1)[0];
                sourceElements.unshift(activeEl);
            }

            const INITIAL_LIMIT = 3;

            if (totalSources <= INITIAL_LIMIT) {
                // Case: 3 or fewer sources -> Show all, Hide button
                sourceElements.forEach(el => streamsContainer.appendChild(el));
                sourcesSummaryEl.textContent = `Showing all the ${totalSources} sources below`;
                showAllBtn.classList.add('hidden');
            } else {
                // Case: More than 3 sources -> Show 3, Hide rest
                sourceElements.forEach((el, index) => {
                    if (index >= INITIAL_LIMIT) el.classList.add('hidden-source');
                    streamsContainer.appendChild(el);
                });
                
                const hiddenCount = totalSources - INITIAL_LIMIT;
                sourcesSummaryEl.textContent = `Showing ${INITIAL_LIMIT} sources, Total available sources ${totalSources}`;
                
                showAllBtn.classList.remove('hidden');
                showAllBtn.textContent = `Show ${hiddenCount} more sources`;
                
                showAllBtn.onclick = () => {
                    document.querySelectorAll('.hidden-source').forEach(e => e.classList.remove('hidden-source'));
                    sourcesSummaryEl.textContent = `Showing all the ${totalSources} sources below`;
                    showAllBtn.classList.add('hidden');
                };
            }

        } else {
            sourcesSummaryEl.textContent = 'No sources available';
            streamsContainer.innerHTML = `<p class="no-results">No stream sources found for this match.</p>`;
        }
    } catch (err) {
        console.error("Error loading watch page:", err);
        titleEl.textContent = "Error Loading Stream";
        playerContainerEl.innerHTML = `<div class="error-message">${err.message}</div>`;
        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
    }
}

async function loadDiscordWidget() {
    try {
        const res = await fetch(`https://discord.com/api/guilds/${config.discordServerId}/widget.json`);
        if (!res.ok) throw new Error('Failed to fetch Discord widget data');
        const data = await res.json(); // Fixed: now using 'res' instead of 'response'
        
        document.getElementById("discord-online-count").textContent = data.presence_count || '0';
        if (data.instant_invite) document.getElementById("discord-join-button").href = data.instant_invite;
        const membersListEl = document.getElementById("discord-members-list");
        membersListEl.innerHTML = '';
        if (data.members && data.members.length > 0) {
            data.members.slice(0, 3).forEach(member => {
                const li = document.createElement('li');
                const avatar = member.avatar_url ? member.avatar_url : 'https://cdn.discordapp.com/embed/avatars/0.png';
                li.innerHTML = `<div class="member-wrapper"><img class="member-avatar" src="${avatar}" alt="${member.username}"><span class="member-status"></span></div><span class="member-name">${member.username}</span>`;
                membersListEl.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Discord Widget Error:", error);
        const container = document.getElementById('discord-widget-container');
        if(container) container.innerHTML = `
            <div class="discord-header">
                <div class="header-text"><h3>Community</h3></div>
                <a href="#" class="discord-btn">Join</a>
            </div>
            <div style="padding:10px;text-align:center;color:#777;font-size:12px;">Widget Unavailable</div>
        `;
    }
}

function initOverlay() {
    const overlay = document.getElementById('video-overlay-ad');
    if(overlay) {
        overlay.addEventListener('click', () => {
            window.open(window.currentAffiliateLink || '#', '_blank');
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Ads First
    updateAdLinks();
    initOverlay();
    
    // 2. Load Page Content
    initializeWatchPage();
    loadDiscordWidget();
});

window.addEventListener('hashchange', initializeWatchPage);


