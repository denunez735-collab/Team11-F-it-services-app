/* ============================================================
   MACROFIT COACH — Visitor Counter
   Cloud Computing Capstone Project 2026

   How it works:
   1. On page load, this script sends a POST request to the
      Azure Functions Python API endpoint.
   2. The API reads the current count from Cosmos DB,
      increments it by 1, saves it, and returns the new count.
   3. The count is displayed with an animated count-up effect.
   4. If the API is unavailable (e.g., not yet deployed),
      a cached value from localStorage is used as a fallback.

   To connect to your live API:
   Replace COUNTER_API_URL with your deployed Azure Function URL.
   Example: https://macrofit-visitor-api.azurewebsites.net/api/visitor_counter
   ============================================================ */

'use strict';

/* ---- Configuration ---- */

// Replace this URL after deploying your Azure Function
const COUNTER_API_URL = 'https://macrofit-visitor-api.azurewebsites.net/api/visitor_counter';

// localStorage key for caching the last known count
const CACHE_KEY = 'mfc_visitor_count';

/* ============================================================
   COUNT-UP ANIMATION
   Smoothly animates a number from 0 to the target value
   ============================================================ */

/**
 * Animate a numeric count-up on a DOM element.
 * @param {HTMLElement} el     - Target element to update
 * @param {number}      target - Final count value to display
 * @param {number}      [ms=2000] - Animation duration in milliseconds
 */
function animateCount(el, target, ms = 2000) {
    const startTime = performance.now();

    function step(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / ms, 1);

        // Ease-out cubic — fast start, slow finish
        const eased  = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);

        // Format with commas (e.g. 1,247)
        el.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = target.toLocaleString();
        }
    }

    requestAnimationFrame(step);
}

/* ============================================================
   FETCH VISITOR COUNT FROM API
   ============================================================ */

/**
 * Call the serverless visitor counter API, increment the count,
 * and display the result with an animated count-up.
 *
 * Falls back to a cached / demo value if the API is unreachable.
 */
async function fetchVisitorCount() {
    const countEl = document.getElementById('visitorCount');
    const subEl   = document.getElementById('counterSub');
    if (!countEl) return;

    try {
        /*
         * POST to the API endpoint.
         * POST signals "this is a new visit — increment the counter."
         * The API returns: { "count": <integer>, "status": "ok" }
         */
        const response = await fetch(COUNTER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 8-second timeout — don't block the page too long
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data  = await response.json();
        // Support both response shapes: { count } or { visitor_count }
        const count = Number(data.count ?? data.visitor_count ?? 0);

        // Cache for future fallback
        localStorage.setItem(CACHE_KEY, count);

        // Clear the spinner and animate the count
        countEl.innerHTML = '';
        animateCount(countEl, count);

    } catch (err) {
        console.warn('[MacroFit] Visitor counter API unavailable:', err.message);

        // Fallback: use cached count or a demo seed value
        const cached = parseInt(localStorage.getItem(CACHE_KEY)) || 1247;

        countEl.innerHTML = '';
        animateCount(countEl, cached);

        // Let the user know this is demo/offline mode
        if (subEl) {
            subEl.textContent = 'Demo mode — API not yet connected';
            subEl.style.color = '#f59e0b'; // amber warning color
        }
    }
}

/* ============================================================
   INIT — run after DOM is ready
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Small delay so the page renders first (better UX)
    setTimeout(fetchVisitorCount, 600);
});
