// --- CONFIGURATION ---
const config = {
    overlayLink: "https://1wksrw.com/?open=register&p=h8zt", 
    bet365Link: "https://1wksrw.com/?open=register&p=h8zt", 
    discordServerId: "1422384816472457288"
};

// --- 1. OVERLAY AD LOGIC ---
function initOverlay() {
    const overlay = document.getElementById('video-overlay-ad');
    if(overlay) {
        overlay.addEventListener('click', () => {
            window.open(config.overlayLink, '_blank');
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        });
    }
}

// --- 2. IN-FEED AD CREATION (Top Recommended Ad) ---
function createTopAd() {
    const adDiv = document.createElement('div');
    adDiv.className = 'stream-infeed-ad';
    // Simple, compact HTML to ensure mobile responsiveness
    adDiv.innerHTML = `
        <a href="${config.bet365Link}" target="_blank" class="infeed-content">
            <div class="infeed-left">
                <span class="rec-tag"><i class="fa-solid fa-star"></i> REC</span>
                <span style="font-weight:bold;">Bet365: Watch Live</span>
            </div>
            <div class="infeed-btn">Watch <i class="fa-solid fa-play"></i></div>
        </a>
    `;
    return adDiv;
}

// --- 3. STREAM PARSING & RENDERING ---
function parseUrl() {
    const hash = window.location.hash.substring(1); 
    if (!hash) return null;
    const parts = hash.replace(/^\//, '').split('/');
    if (parts.length < 3) return null;
    return { matchId: parts[0], source: parts[1], qual: parts[2].substring(0,2), num: parseInt(parts[2].substring(2)) };
}

async function loadPage() {
    const data = parseUrl();
    const titleEl = document.getElementById("watch-title");
    const playerEl = document.getElementById("stream-player");
    const container = document.getElementById("streams-container");
    
    container.innerHTML = ''; 
    document.querySelectorAll('.skeleton').forEach(e => e.classList.add('skeleton'));

    if (!data) {
        titleEl.textContent = "Select a stream from the schedule.";
        document.querySelectorAll('.skeleton').forEach(e => e.classList.remove('skeleton'));
        return;
    }

    try {
        const res = await fetch("https://streamed.pk/api/matches/all");
        const matches = await res.json();
        const match = matches.find(m => String(m.id) === String(data.matchId));
        
        if (!match) throw new Error("Match not found");

        titleEl.textContent = `${match.title} - Live Stream`;
        document.title = `Watch ${match.title}`;
        document.getElementById("odds-match-title").textContent = match.title.toUpperCase();

        const srcObj = match.sources.find(s => s.source === data.source);
        const streamRes = await fetch(`https://streamed.pk/api/stream/${srcObj.source}/${srcObj.id}`);
        const streams = await streamRes.json();
        const active = streams.find(s => (s.hd?'hd':'sd') === data.qual && s.streamNo === data.num);
        
        playerEl.src = active ? active.embedUrl : 'about:blank';

        document.querySelectorAll('.skeleton').forEach(e => e.classList.remove('skeleton'));

        // --- INJECT ADS & STREAMS ---
        
        // 1. Inject Recommended Ad
        container.appendChild(createTopAd());

        // 2. Render Stream Sources (FIXED BROKEN SECTIONS)
        match.sources.forEach(async (source) => {
            const sDiv = document.createElement('div');
            sDiv.className = 'stream-source';
            
            try {
                const r = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
                const sList = await r.json();
                
                // FIX: Only append if streams exist to avoid broken empty boxes
                if (sList && sList.length > 0) {
                    sDiv.innerHTML = `<div style="margin-bottom:10px; font-weight:bold; text-transform:capitalize;">${source.source} Server</div>`;
                    
                    sList.forEach((st, idx) => {
                        const row = document.createElement('a');
                        row.className = 'stream-row';
                        const q = st.hd ? 'hd' : 'sd';
                        row.href = `#/${match.id}/${source.source}/${q}${st.streamNo}`;
                        row.innerHTML = `
                            <div><span class="quality-tag ${q}">${q.toUpperCase()}</span> Stream ${idx+1}</div>
                            <div style="font-size:12px; color:#888;">${st.viewers || 0} Viewers</div>
                        `;
                        if(st.embedUrl === playerEl.src) row.style.borderColor = '#2ecc71'; 
                        sDiv.appendChild(row);
                    });
                    container.appendChild(sDiv);
                }
            } catch(e) { console.log(e); }
        });

    } catch (err) {
        console.error(err);
        titleEl.textContent = "Stream Offline";
    }
}

// --- 4. OPTIMIZED DISCORD WIDGET ---
async function loadDiscord() {
    const list = document.getElementById('discord-members-list');
    const count = document.getElementById('discord-online-count');
    try {
        const res = await fetch(`https://discord.com/api/guilds/${config.discordServerId}/widget.json`);
        const data = await res.json();
        count.innerText = data.presence_count;
        document.getElementById('discord-join-button').href = data.instant_invite;
        
        list.innerHTML = '';
        
        // Limit to 5 members for clean look
        data.members.slice(0, 5).forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="member-wrapper">
                    <img class="member-avatar" src="${m.avatar_url}" alt="${m.username}">
                    <span class="member-status"></span>
                </div>
                <span class="member-name">${m.username}</span>
            `;
            list.appendChild(li);
        });
    } catch(e) { console.log("Discord Widget Error"); }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initOverlay();
    loadDiscord();
    loadPage();
});
window.addEventListener('hashchange', loadPage);
