# CineStream Architecture & Streaming Analysis: NetMirror Web vs Mobile App

---

## 1. Executive Summary

This document explains the technical findings regarding **NetMirror's streaming architecture**, why content plays in a logged-in browser vs. fails on automated server backends, how the **NetMirror Mobile APK** bypasses login entirely, and how **CineStream** manages native playback, multi-language dubs, and server fallback.

---

## 2. Problem Statement & User Investigation

### User Observation
- In Google Chrome (`Profile 4`), the movie **Vishwanath & Sons** (TMDB ID `1408162`) played without issue on `https://net77.cc/home` for the full runtime of **2 hours 40 minutes 21 seconds (`2:40:21`)**.
- On CineStream's Server 2, the player previously displayed a 10-minute warning bumper:
  > *"Too Many Requests in Short Period of Time - STOP Abuse - You Just Need to Wait Few Minutes - Visit Now Netmirror.app"*

### Core Questions Addressed
1. Why does NetMirror play the real movie in the user's browser, but serves a 10-minute warning bumper to CineStream's backend?
2. Why does the official NetMirror Mobile APK allow users to watch without any login, whereas the website enforces Google authentication or Cloudflare verification?
3. How does CineStream handle this cleanly and reliably for users?

---

## 3. Technical Root Cause Analysis

### A. Web Version (`net77.cc`) vs. Automated Server Fetch
| Aspect | User's Chrome Browser | CineStream Backend Server |
| :--- | :--- | :--- |
| **Authentication** | Active Google OAuth session (`login-status?google=yes`) | None (Anonymous server-side HTTP fetch) |
| **Cookies Sent** | `t_hash_p`, `cf_clearance`, `user_token` | None |
| **Stream Parameter** | `in=aff78250...::kp::p::e023873...` (Signed token) | `in=unknown::kp` (Unsigned/fallback) |
| **Video Delivered** | Full Movie Stream (**2:40:21**, 9621s) | **10-minute Warning Bumper** (`files/220884`, ~599.7s) |

#### What Happens Under the Hood:
1. When a user logs in on `net77.cc`, NetMirror sets an authenticated cookie (`t_hash_p`) and links the session to the client's IP.
2. When the video player requests `/playlist.php?id=82034837`, NetMirror's backend generates a signed token.
3. When CineStream's backend server sends a request without the user's Google session, NetMirror's anti-scraping system activates:
   - It does not return an HTTP `403 Forbidden` error.
   - Instead, it serves an HLS manifest pointing to `/files/220884/1080p/1080p.m3u8` — a pre-recorded **10-minute anti-abuse bumper** designed to confuse scrapers and advertise their mobile app.

---

### B. Why the NetMirror Mobile App Does Not Require Login

The difference between NetMirror's Web platform and Mobile App comes down to **monetization and bot protection**:

1. **AdMob & Unity Ads Native Monetization:**
   - **On Web (`net77.cc`):** Most desktop users use Ad-blockers (Brave, uBlock Origin, AdGuard), preventing NetMirror from earning ad revenue while consuming expensive CDN bandwidth. To counter this, NetMirror forces Google Sign-In and Cloudflare verification to deter scrapers.
   - **On Mobile App (Android APK):** The app includes native Google AdMob and Unity Ads SDKs compiled directly into the binary. Mobile ads cannot be easily bypassed by browser extensions. Before and during playback, full-screen interstitial and rewarded video ads run, guaranteeing revenue without requiring user login.
2. **App-Level API Authentication:**
   - The APK uses internal device fingerprinting and communicates via `https://mobidetect.art/check.php?platform=android`.
   - The app passes `app=1` and `platform=android` along with an internal signature, allowing the API to issue an app session token without requiring Google OAuth.

---

### C. Audio vs. Video Stream Segregation

Our analysis revealed an architectural characteristic of NetMirror's CDN:
- **Audio Dubs Are Unrestricted:**
  NetMirror stores multi-language audio tracks (`hin`, `tam`, `tel`, `kan`, `mal`) on open edge CDNs (e.g., `s88.freecdn201.top/s22.nm-cdn11.top/files/82034837/a/0/0.m3u8`).
  Even when requests are unauthenticated, **audio tracks are NOT blocked** and provide the full 160-minute duration.
- **Video Tracks Are Gated:**
  Video streams are disguised as font files (`.woff2`) or restricted behind dynamic tokens (`in=...::kp`).

---

## 4. CineStream Implementation Architecture

To ensure a seamless, high-performance user experience, CineStream implements the following solutions:

### Strategy 1: Hybrid Audio-Video Fusion Engine
For titles available on Global CDNs (e.g., *Harry Potter* TMDB `674`, *Inception*, *Interstellar*):
- **Video Source:** Clean 1080p Ultra HD stream from Server 1 (VixSrc / Global CDN) with zero ads, high bitrate, and no rate limits.
- **Audio Source:** High-quality Hindi, English, and regional dubs extracted from NetMirror.
- **Player Fusion:** CineStream's player dynamically binds both tracks together, giving the user clean 1080p video with full multi-language audio switching.

### Strategy 2: Intelligent Server Probing (`probeAvailableServers`)
- Before rendering server selector buttons, CineStream's backend probes available sources.
- If Server 2 returns the 10-minute anti-abuse bumper (`files/220884` or duration ~599.7s), CineStream identifies it as a rate-limited bumper.
- If Server 1 is also unavailable for that specific title (such as brand-new regional cinema not yet on global CDNs), CineStream hides the non-functional server rather than playing the warning video.

### Strategy 3: Zero Third-Party Iframes
- All third-party iframe embeds (`vidlink.pro`, `vidsrc.to`) have been removed.
- All playback runs exclusively on CineStream's native custom HLS Player, eliminating external ads, redirects, and unauthorized trackers.

### Strategy 4: Future Roadmap — Regional Fast Fallbacks (Server 3 & 4)
- Integrate dedicated direct-stream endpoints for regional Indian content (e.g., SuperEmbed, 2Embed, AutoEmbed) so that newly released regional movies play instantly on Server 3/4 even before Global CDNs index them.

---

## 5. Verification Summary

| Feature | Status | Verification Detail |
| :--- | :---: | :--- |
| **Harry Potter (`674`)** | **Verified** | Server 1 & Server 2 active with English, Hindi, and Italian audio dubs on CineStream native player. |
| **Anti-Abuse Bumper Filter** | **Verified** | Manifest durations ~599.7s flagged as `isAbuseVideo`, preventing misleading warning bumpers. |
| **Dynamic Server Selector** | **Verified** | Only servers with genuine verified streams are displayed on the watch page. |
| **Native Ad-Free Player** | **Verified** | 100% native HTML5/HLS.js player without 3rd-party embed iframes. |
