/* ============================================================
   MACROFIT COACH — Main JavaScript
   Cloud Computing Capstone Project 2026

   Covers:
   - Navbar scroll + mobile hamburger
   - Dark / Light theme toggle (localStorage)
   - Macro Tracker (form + live card updates + localStorage)
   - Workout Tracker (sample data, add/delete rows, localStorage)
   - Contact form (simulated API call + success state)
   - Scroll Reveal animations
   - Toast notifications
   ============================================================ */

'use strict';

/* ============================================================
   SAMPLE WORKOUT DATA
   Loaded on first visit; replaced by localStorage on return visits
   ============================================================ */
const SAMPLE_WORKOUTS = [
    { name: 'Bench Press',           sets: 4, reps: 8,  weight: 185, cardio: 0,  notes: 'Felt strong' },
    { name: 'Incline Dumbbell Press',sets: 3, reps: 10, weight: 65,  cardio: 0,  notes: '' },
    { name: 'Cable Fly',             sets: 3, reps: 12, weight: 40,  cardio: 0,  notes: 'Slow negatives' },
    { name: 'Shoulder Press',        sets: 4, reps: 8,  weight: 135, cardio: 0,  notes: '' },
    { name: 'Treadmill HIIT',        sets: 0, reps: 0,  weight: 0,   cardio: 20, notes: 'Level 8 intensity' },
];

/* ============================================================
   MACRO GOALS (coach-set targets)
   ============================================================ */
const MACRO_GOALS = {
    calories: 2500,
    protein:  180,
    carbs:    250,
    fats:     80,
    water:    8,
};

/* ============================================================
   STATE — loaded from localStorage or seeded with defaults
   ============================================================ */
let macros   = JSON.parse(localStorage.getItem('mfc_macros'))   || { calories: 1847, protein: 142, carbs: 210, fats: 58, water: 6 };
let workouts = JSON.parse(localStorage.getItem('mfc_workouts')) || [...SAMPLE_WORKOUTS];

/* ============================================================
   NAVBAR — scroll shrink + mobile drawer
   ============================================================ */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

/* Shrink navbar on scroll */
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* Toggle mobile drawer */
hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

/* Close drawer when any nav link is clicked */
navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
});

/* ============================================================
   THEME TOGGLE — dark / light (persisted in localStorage)
   ============================================================ */
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const htmlEl      = document.documentElement;

// Apply saved theme on page load
applyTheme(localStorage.getItem('mfc_theme') || 'dark');

themeToggle?.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mfc_theme', next);
    applyTheme(next);
});

/**
 * Apply a theme to the root element and update the icon.
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    if (themeIcon) {
        // Sun icon when dark (click = switch to light), Moon icon when light (click = switch to dark)
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

/* ============================================================
   TODAY'S DATE — shown in the workout plan card
   ============================================================ */
const todayDateEl = document.getElementById('todayDate');
if (todayDateEl) {
    todayDateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

/* ============================================================
   MACRO TRACKER
   ============================================================ */

/**
 * Re-render all five macro cards from the current `macros` state object.
 */
function renderMacroCards() {
    const items = [
        { key: 'calories', valId: 'calValue',   goalId: 'calGoal',  barId: 'calBar',  pctId: 'calPct',  suffix: '',       goalSuffix: '' },
        { key: 'protein',  valId: 'protValue',  goalId: 'protGoal', barId: 'protBar', pctId: 'protPct', suffix: 'g',      goalSuffix: 'g' },
        { key: 'carbs',    valId: 'carbValue',  goalId: 'carbGoal', barId: 'carbBar', pctId: 'carbPct', suffix: 'g',      goalSuffix: 'g' },
        { key: 'fats',     valId: 'fatValue',   goalId: 'fatGoal',  barId: 'fatBar',  pctId: 'fatPct',  suffix: 'g',      goalSuffix: 'g' },
        { key: 'water',    valId: 'waterValue', goalId: 'waterGoal',barId: 'waterBar',pctId: 'waterPct',suffix: ' cups',  goalSuffix: ' cups' },
    ];

    items.forEach(({ key, valId, goalId, barId, pctId, suffix, goalSuffix }) => {
        const val  = macros[key];
        const goal = MACRO_GOALS[key];
        const pct  = Math.min(Math.round((val / goal) * 100), 100);

        const valEl  = document.getElementById(valId);
        const goalEl = document.getElementById(goalId);
        const barEl  = document.getElementById(barId);
        const pctEl  = document.getElementById(pctId);

        if (valEl)  valEl.textContent  = Number(val).toLocaleString() + suffix;
        if (goalEl) goalEl.textContent = Number(goal).toLocaleString() + goalSuffix;
        if (barEl)  barEl.style.width  = pct + '%';
        if (pctEl)  pctEl.textContent  = pct + '%';
    });
}

/* Handle macro log form submission */
const macroForm = document.getElementById('macroForm');
macroForm?.addEventListener('submit', e => {
    e.preventDefault();

    // Read form values; fall back to current values if field is empty
    const cal   = parseInt(document.getElementById('inputCal').value)   || macros.calories;
    const prot  = parseInt(document.getElementById('inputProt').value)  || macros.protein;
    const carb  = parseInt(document.getElementById('inputCarb').value)  || macros.carbs;
    const fat   = parseInt(document.getElementById('inputFat').value)   || macros.fats;
    const water = parseInt(document.getElementById('inputWater').value) || macros.water;

    macros = { calories: cal, protein: prot, carbs: carb, fats: fat, water: water };
    localStorage.setItem('mfc_macros', JSON.stringify(macros));

    renderMacroCards();
    macroForm.reset();
    showToast('Macros updated! Keep it up. 💪');
});

// Initial render
renderMacroCards();

/* ============================================================
   WORKOUT TRACKER
   ============================================================ */

/**
 * Calculate and display workout stats from the workouts array.
 *
 * Formulas:
 * - Total Volume = SUM(sets × reps × weight) for each exercise
 * - Total Sets = SUM(sets) across all exercises
 * - Total Cardio = SUM(cardio) minutes across all exercises
 * - Exercises = number of entries in log
 * - Est. Time = (total sets × 2 min per set) + cardio minutes + (exercises × 1.5 min rest)
 * - Est. Calories = (volume × 0.05 kcal per lb) + (cardio × 8 kcal per min)
 *   Note: 0.05 kcal/lb is a conservative estimate for resistance training.
 *   8 kcal/min is moderate-intensity cardio (~6-8 METs).
 */
function updateWorkoutStats() {
    let totalVolume  = 0;
    let totalSets    = 0;
    let totalCardio  = 0;
    const exerciseCount = workouts.length;

    workouts.forEach(w => {
        const sets   = w.sets   || 0;
        const reps   = w.reps   || 0;
        const weight = w.weight || 0;
        const cardio = w.cardio || 0;

        totalVolume += sets * reps * weight;
        totalSets   += sets;
        totalCardio += cardio;
    });

    // Estimated time: ~2 min per set + cardio + ~1.5 min rest between exercises
    const estTime = Math.round((totalSets * 2) + totalCardio + (exerciseCount * 1.5));

    // Estimated calories: resistance (volume-based) + cardio (time-based)
    const estCalories = Math.round((totalVolume * 0.05) + (totalCardio * 8));

    // Update Today's Plan card
    const planEx   = document.getElementById('planExercises');
    const planSets = document.getElementById('planSets');
    const planCard = document.getElementById('planCardio');
    const planTime = document.getElementById('planTime');
    if (planEx)   planEx.textContent   = exerciseCount;
    if (planSets) planSets.textContent = totalSets;
    if (planCard) planCard.textContent = totalCardio;
    if (planTime) planTime.textContent = estTime;

    // Update Weekly Progress cards
    const statEx   = document.getElementById('statExercises');
    const statVol  = document.getElementById('statVolume');
    const statCal  = document.getElementById('statCalories');
    const statCar  = document.getElementById('statCardio');
    if (statEx)  statEx.textContent  = exerciseCount;
    if (statVol) statVol.textContent = totalVolume.toLocaleString() + ' lbs';
    if (statCal) statCal.textContent = estCalories.toLocaleString() + ' kcal';
    if (statCar) statCar.textContent = totalCardio + ' min';
}

/**
 * Render the workout log table from the `workouts` array.
 * Escapes all user-supplied strings to prevent XSS.
 */
function renderWorkoutTable() {
    const tbody = document.getElementById('workoutTableBody');
    if (!tbody) return;

    // Recalculate stats from actual data
    updateWorkoutStats();

    if (workouts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:var(--text-muted); padding:40px 20px;">
                    No exercises logged yet. Click <strong>Add Exercise</strong> to get started.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = workouts.map((w, i) => `
        <tr>
            <td class="ex-name">${escapeHtml(w.name)}</td>
            <td>${w.sets  || '&mdash;'}</td>
            <td>${w.reps  || '&mdash;'}</td>
            <td>${w.weight ? w.weight + ' lbs' : '&mdash;'}</td>
            <td>${w.cardio ? w.cardio + ' min' : '&mdash;'}</td>
            <td>${escapeHtml(w.notes) || '&mdash;'}</td>
            <td>
                <button class="delete-row" onclick="deleteWorkout(${i})" aria-label="Remove ${escapeHtml(w.name)}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>`).join('');
}

/**
 * Remove a workout entry by index.
 * @param {number} index
 */
function deleteWorkout(index) {
    workouts.splice(index, 1);
    localStorage.setItem('mfc_workouts', JSON.stringify(workouts));
    renderWorkoutTable();
    showToast('Exercise removed from log.');
}

// Expose deleteWorkout globally (called inline from table rows)
window.deleteWorkout = deleteWorkout;

/* Add Workout form toggle */
const addWorkoutBtn    = document.getElementById('addWorkoutBtn');
const workoutFormCard  = document.getElementById('workoutFormCard');
const cancelWorkoutBtn = document.getElementById('cancelWorkoutBtn');

addWorkoutBtn?.addEventListener('click', () => {
    const isHidden = workoutFormCard.style.display === 'none' || workoutFormCard.style.display === '';
    workoutFormCard.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        workoutFormCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

cancelWorkoutBtn?.addEventListener('click', () => {
    workoutFormCard.style.display = 'none';
});

/* Add Exercise form submission */
const addExerciseForm = document.getElementById('addExerciseForm');
addExerciseForm?.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('exName').value.trim();
    if (!name) return;

    const exercise = {
        name,
        sets:   parseInt(document.getElementById('exSets').value)   || 0,
        reps:   parseInt(document.getElementById('exReps').value)   || 0,
        weight: parseInt(document.getElementById('exWeight').value) || 0,
        cardio: parseInt(document.getElementById('exCardio').value) || 0,
        notes:  document.getElementById('exNotes').value.trim(),
    };

    workouts.push(exercise);
    localStorage.setItem('mfc_workouts', JSON.stringify(workouts));

    renderWorkoutTable();
    addExerciseForm.reset();
    workoutFormCard.style.display = 'none';
    showToast('Exercise added to your log! 🏋️');
});

// Initial render
renderWorkoutTable();

/* ============================================================
   HEALTH CALCULATOR — BMI, TDEE, macros, hydration
   Uses Mifflin-St Jeor equation
   ============================================================ */
const calcForm = document.getElementById('calcForm');
calcForm?.addEventListener('submit', e => {
    e.preventDefault();

    let weightKg = parseFloat(document.getElementById('bodyWeight').value);
    const weightUnit = document.getElementById('weightUnit').value;
    if (weightUnit === 'lb') weightKg = weightKg * 0.453592;

    const heightCm    = parseFloat(document.getElementById('heightCm').value);
    const age         = parseInt(document.getElementById('calcAge').value);
    const sex         = document.getElementById('calcSex').value;
    const activity    = parseFloat(document.getElementById('activityLevel').value);
    const goalFactor  = parseFloat(document.getElementById('calcGoal').value);
    const protPerKg   = parseFloat(document.getElementById('proteinPerKg').value) || 2.0;
    const fatPerKg    = parseFloat(document.getElementById('fatPerKg').value) || 0.9;

    // Guard against invalid inputs
    if (!weightKg || weightKg <= 0 || !heightCm || heightCm <= 0 || !age || age <= 0) {
        showToast('Please enter valid weight, height, and age.');
        return;
    }

    // BMI
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    let bmiLabel = 'Normal';
    let bmiClass = 'normal';
    if (bmi < 18.5)      { bmiLabel = 'Underweight'; bmiClass = 'underweight'; }
    else if (bmi < 25)   { bmiLabel = 'Normal';      bmiClass = 'normal'; }
    else if (bmi < 30)   { bmiLabel = 'Overweight';   bmiClass = 'overweight'; }
    else                  { bmiLabel = 'Obese';        bmiClass = 'obese'; }

    document.getElementById('calcBMI').textContent = bmi.toFixed(1);
    document.getElementById('bmiCategory').textContent = bmiLabel;
    const indicator = document.getElementById('bmiIndicator');
    indicator.className = 'bmi-indicator ' + bmiClass;

    // Mifflin-St Jeor TDEE
    let bmr;
    if (sex === 'male') {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }
    const tdee = Math.round(bmr * activity);
    const targetCal = Math.round(tdee * goalFactor);

    // Goal labels
    let goalLabel = 'Maintain';
    let adjustLabel = '0 kcal';
    if (goalFactor < 1) {
        goalLabel = 'Cutting';
        adjustLabel = '-' + (tdee - targetCal) + ' kcal';
    } else if (goalFactor > 1) {
        goalLabel = 'Bulking';
        adjustLabel = '+' + (targetCal - tdee) + ' kcal';
    }

    // Macros
    const proteinG = Math.round(protPerKg * weightKg);
    const fatG     = Math.round(fatPerKg * weightKg);
    const protCal  = proteinG * 4;
    const fatCal   = fatG * 9;
    const carbCal  = Math.max(targetCal - protCal - fatCal, 0);
    const carbG    = Math.round(carbCal / 4);

    // Warn if protein + fat exceed calorie target (carbs would be 0)
    if (carbCal === 0) {
        showToast('Warning: protein + fat exceed your calorie target. Lower g/kg or increase calories.');
    }

    // Hydration (roughly 0.033L per kg)
    const waterL = (weightKg * 0.033).toFixed(1);

    // Update DOM
    document.getElementById('calcCalories').textContent   = targetCal.toLocaleString() + ' kcal';
    document.getElementById('goalAdjustment').textContent  = adjustLabel;
    document.getElementById('calcWaterIntake').textContent  = waterL + ' L';
    document.getElementById('goalStatus').textContent      = goalLabel;
    document.getElementById('calcProtein').textContent     = proteinG + 'g';
    document.getElementById('calcCarbs').textContent       = carbG + 'g';
    document.getElementById('calcFats').textContent        = fatG + 'g';
    document.getElementById('calcTDEE').textContent         = tdee.toLocaleString() + ' kcal';

    showToast('Health dashboard updated!');
});

/* ============================================================
   FOOD SEARCH — USDA FoodData Central + Open Food Facts
   USDA key: https://fdc.nal.usda.gov/api-key-signup
   Open Food Facts: no key needed
   ============================================================ */
const USDA_API_KEY = 'DEMO_KEY'; // Replace with your free API key for higher rate limits
const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const OFF_SEARCH_URL  = 'https://world.openfoodfacts.org/cgi/search.pl';

let foodSearchSource = 'usda';

const foodSearchForm    = document.getElementById('foodSearchForm');
const foodSearchInput   = document.getElementById('foodSearchInput');
const foodSearchResults = document.getElementById('foodSearchResults');
const foodSearchBtn     = document.getElementById('foodSearchBtn');

/* Source toggle buttons */
document.querySelectorAll('.source-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        foodSearchSource = btn.dataset.source;
        foodSearchResults.innerHTML = '';
        foodSearchInput.placeholder = foodSearchSource === 'usda'
            ? 'e.g. chicken breast, oatmeal, banana'
            : 'e.g. Coca-Cola, Nutella, chips';
    });
});

/* Search handler */
foodSearchForm?.addEventListener('submit', async e => {
    e.preventDefault();

    const query = foodSearchInput.value.trim();
    if (!query) return;

    foodSearchBtn.disabled = true;
    foodSearchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    const sourceLabel = foodSearchSource === 'usda' ? 'USDA' : 'Open Food Facts';
    foodSearchResults.innerHTML = `<div class="food-search-status"><i class="fas fa-spinner fa-spin"></i>Searching ${sourceLabel}...</div>`;

    try {
        let cards;
        if (foodSearchSource === 'usda') {
            cards = await searchUSDA(query);
        } else {
            cards = await searchOpenFoodFacts(query);
        }

        if (cards.length === 0) {
            foodSearchResults.innerHTML = `<div class="food-search-status"><i class="fas fa-search"></i>No results found on ${sourceLabel}. Try the other database or a different term.</div>`;
            return;
        }

        foodSearchResults.innerHTML = '<div class="food-results-grid">' +
            cards.map(renderFoodCard).join('') + '</div>';

    } catch (err) {
        console.warn(`[MacroFit] ${sourceLabel} search failed:`, err.message);
        foodSearchResults.innerHTML = `<div class="food-search-status"><i class="fas fa-exclamation-triangle"></i>Could not reach ${sourceLabel}. Try again later.</div>`;
    } finally {
        foodSearchBtn.disabled = false;
        foodSearchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
    }
});

/**
 * Search USDA FoodData Central. Returns normalized food objects.
 */
async function searchUSDA(query) {
    const response = await fetch(
        `${USDA_SEARCH_URL}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=8&dataType=Foundation,SR Legacy,Branded`,
        { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    return (data.foods || []).map(food => {
        const n = {};
        (food.foodNutrients || []).forEach(fn => {
            if (fn.nutrientId === 1008 || fn.nutrientName === 'Energy') n.cal = Math.round(fn.value || 0);
            if (fn.nutrientId === 1003 || fn.nutrientName === 'Protein') n.prot = Math.round(fn.value || 0);
            if (fn.nutrientId === 1005 || fn.nutrientName === 'Carbohydrate, by difference') n.carb = Math.round(fn.value || 0);
            if (fn.nutrientId === 1004 || fn.nutrientName === 'Total lipid (fat)') n.fat = Math.round(fn.value || 0);
        });
        return {
            name: food.description || 'Unknown',
            brand: food.brandOwner || '',
            cal: n.cal || 0, prot: n.prot || 0, carb: n.carb || 0, fat: n.fat || 0,
            serving: food.servingSize ? `Per ${food.servingSize}${food.servingSizeUnit || 'g'}` : 'Per 100g',
            source: 'USDA',
        };
    });
}

/**
 * Search Open Food Facts. Returns normalized food objects.
 */
async function searchOpenFoodFacts(query) {
    const response = await fetch(
        `${OFF_SEARCH_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,nutriments,serving_size`,
        { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    return (data.products || [])
        .filter(p => p.product_name)
        .map(p => {
            const nm = p.nutriments || {};
            return {
                name: p.product_name || 'Unknown',
                brand: p.brands || '',
                cal:  Math.round(nm['energy-kcal_100g'] || nm['energy-kcal'] || 0),
                prot: Math.round(nm.proteins_100g || nm.proteins || 0),
                carb: Math.round(nm.carbohydrates_100g || nm.carbohydrates || 0),
                fat:  Math.round(nm.fat_100g || nm.fat || 0),
                serving: p.serving_size ? `Per ${p.serving_size}` : 'Per 100g',
                source: 'OFF',
            };
        });
}

/**
 * Render a normalized food object as an HTML card.
 */
function renderFoodCard(food) {
    const name    = escapeHtml(food.name);
    const brand   = food.brand ? escapeHtml(food.brand) : 'Generic';
    const serving = escapeHtml(food.serving);
    const badges  = { USDA: 'USDA', OFF: 'Open Food Facts', LABEL: 'Label Scan' };
    const badge   = badges[food.source] || food.source;

    return `
        <div class="food-result-card">
            <div class="food-result-name">${name}</div>
            <div class="food-result-brand">${brand} &middot; <em>${badge}</em></div>
            <div class="food-result-macros">
                <div class="food-macro cal"><span>Cal</span><strong>${food.cal}</strong></div>
                <div class="food-macro prot"><span>Protein</span><strong>${food.prot}g</strong></div>
                <div class="food-macro carb"><span>Carbs</span><strong>${food.carb}g</strong></div>
                <div class="food-macro fat"><span>Fat</span><strong>${food.fat}g</strong></div>
            </div>
            <div class="food-result-serving">${serving}</div>
        </div>`;
}

/* ============================================================
   BARCODE SCANNER — html5-qrcode + Open Food Facts lookup
   ============================================================ */
const scanBarcodeBtn    = document.getElementById('scanBarcodeBtn');
const closeScannerBtn   = document.getElementById('closeScannerBtn');
const barcodeScannerWrap = document.getElementById('barcodeScannerWrap');
const scannerLockFill   = document.getElementById('scannerLockFill');
const scannerStatusIcon = document.querySelector('.scanner-status-icon');
const scannerStatusText = document.querySelector('.scanner-status-text');

let html5QrCode = null;
let scannerRunning = false;

// Lock-on state: require CONFIRM_THRESHOLD consecutive matching reads
const CONFIRM_THRESHOLD = 3;
let lastScannedCode = '';
let matchCount = 0;
let scanLocked = false;

function resetScannerStatus() {
    lastScannedCode = '';
    matchCount = 0;
    scanLocked = false;
    if (scannerLockFill) scannerLockFill.style.width = '0%';
    if (scannerStatusIcon) {
        scannerStatusIcon.className = 'scanner-status-icon';
        scannerStatusIcon.innerHTML = '<i class="fas fa-crosshairs"></i>';
    }
    if (scannerStatusText) scannerStatusText.textContent = 'Align barcode in frame';
}

scanBarcodeBtn?.addEventListener('click', () => {
    if (typeof Html5Qrcode === 'undefined') {
        showToast('Scanner library not loaded. Check your connection.');
        return;
    }

    barcodeScannerWrap.style.display = 'block';
    barcodeScannerWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    resetScannerStatus();

    if (scannerRunning) return;

    html5QrCode = new Html5Qrcode('barcodeReader');
    scannerRunning = true;

    html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.5 },
        onBarcodeDetected,
        () => {
            // No barcode in frame — reset if we had a partial lock
            if (matchCount > 0 && !scanLocked) {
                matchCount = Math.max(matchCount - 1, 0);
                const pct = Math.round((matchCount / CONFIRM_THRESHOLD) * 100);
                if (scannerLockFill) scannerLockFill.style.width = pct + '%';
                if (matchCount === 0) {
                    lastScannedCode = '';
                    if (scannerStatusIcon) {
                        scannerStatusIcon.className = 'scanner-status-icon';
                        scannerStatusIcon.innerHTML = '<i class="fas fa-crosshairs"></i>';
                    }
                    if (scannerStatusText) scannerStatusText.textContent = 'Align barcode in frame';
                }
            }
        }
    ).catch(err => {
        console.warn('[MacroFit] Camera error:', err);
        barcodeScannerWrap.style.display = 'none';
        scannerRunning = false;
        showToast('Could not access camera. Check permissions.');
    });
});

closeScannerBtn?.addEventListener('click', stopScanner);

function stopScanner() {
    if (html5QrCode && scannerRunning) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            scannerRunning = false;
        }).catch(() => {
            scannerRunning = false;
        });
    }
    barcodeScannerWrap.style.display = 'none';
    resetScannerStatus();
}

/**
 * Called on every successful frame read.
 * Builds confidence over CONFIRM_THRESHOLD consecutive matching reads.
 */
function onBarcodeDetected(code) {
    if (scanLocked) return; // Already captured, ignore further reads

    if (code === lastScannedCode) {
        matchCount++;
    } else {
        lastScannedCode = code;
        matchCount = 1;
    }

    const pct = Math.round((matchCount / CONFIRM_THRESHOLD) * 100);
    if (scannerLockFill) scannerLockFill.style.width = Math.min(pct, 100) + '%';

    // Update status visuals
    if (matchCount < CONFIRM_THRESHOLD) {
        if (scannerStatusIcon) {
            scannerStatusIcon.className = 'scanner-status-icon detecting';
            scannerStatusIcon.innerHTML = '<i class="fas fa-barcode"></i>';
        }
        if (scannerStatusText) scannerStatusText.textContent = 'Detecting... hold steady';
    }

    // Confirmed — lock on and fire
    if (matchCount >= CONFIRM_THRESHOLD) {
        scanLocked = true;
        if (scannerStatusIcon) {
            scannerStatusIcon.className = 'scanner-status-icon locked';
            scannerStatusIcon.innerHTML = '<i class="fas fa-check"></i>';
        }
        if (scannerStatusText) scannerStatusText.textContent = 'Captured! Looking up product...';
        if (scannerLockFill) scannerLockFill.style.width = '100%';

        // Short delay so the user sees the "Captured!" state
        setTimeout(() => onBarcodeScanned(code), 500);
    }
}

/**
 * Called when a barcode is successfully scanned.
 * Looks up the product on Open Food Facts by barcode.
 */
async function onBarcodeScanned(barcode) {
    stopScanner();
    showToast('Barcode detected: ' + barcode);

    foodSearchResults.innerHTML = '<div class="food-search-status"><i class="fas fa-spinner fa-spin"></i>Looking up barcode on Open Food Facts...</div>';

    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
            { signal: AbortSignal.timeout(10000) }
        );
        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const data = await response.json();

        if (data.status !== 1 || !data.product) {
            foodSearchResults.innerHTML = `<div class="food-search-status"><i class="fas fa-box-open"></i>Product not found (barcode: ${escapeHtml(barcode)}).<br>Try searching by name instead.</div>`;
            return;
        }

        const p = data.product;
        const nm = p.nutriments || {};
        const food = {
            name: p.product_name || 'Unknown Product',
            brand: p.brands || '',
            cal:  Math.round(nm['energy-kcal_100g'] || nm['energy-kcal'] || 0),
            prot: Math.round(nm.proteins_100g || nm.proteins || 0),
            carb: Math.round(nm.carbohydrates_100g || nm.carbohydrates || 0),
            fat:  Math.round(nm.fat_100g || nm.fat || 0),
            serving: p.serving_size ? `Per ${p.serving_size}` : 'Per 100g',
            source: 'OFF',
        };

        foodSearchResults.innerHTML = '<div class="food-results-grid">' + renderFoodCard(food) + '</div>';
        showToast('Product found!');

    } catch (err) {
        console.warn('[MacroFit] Barcode lookup failed:', err.message);
        foodSearchResults.innerHTML = '<div class="food-search-status"><i class="fas fa-exclamation-triangle"></i>Lookup failed. Try searching by name instead.</div>';
    }
}

/* ============================================================
   NUTRITION LABEL SCANNER — Camera + Tesseract.js OCR
   ============================================================ */
const scanLabelBtn     = document.getElementById('scanLabelBtn');
const closeLabelBtn    = document.getElementById('closeLabelBtn');
const labelScannerWrap = document.getElementById('labelScannerWrap');
const takeLabelPhoto   = document.getElementById('takeLabelPhoto');
const labelFileInput   = document.getElementById('labelFileInput');
const ocrProgress      = document.getElementById('ocrProgress');
const ocrProgressText  = document.getElementById('ocrProgressText');
const labelResultArea  = document.getElementById('labelResultArea');
const labelPreviewImg  = document.getElementById('labelPreviewImg');
const saveLabelResult  = document.getElementById('saveLabelResult');

scanLabelBtn?.addEventListener('click', () => {
    labelScannerWrap.style.display = 'block';
    labelResultArea.style.display = 'none';
    ocrProgress.style.display = 'none';
    labelScannerWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

closeLabelBtn?.addEventListener('click', () => {
    labelScannerWrap.style.display = 'none';
});

takeLabelPhoto?.addEventListener('click', () => {
    labelFileInput.click();
});

labelFileInput?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const imageUrl = URL.createObjectURL(file);
    labelPreviewImg.src = imageUrl;

    // Show progress, hide previous results
    ocrProgress.style.display = 'block';
    labelResultArea.style.display = 'none';
    ocrProgressText.textContent = 'Loading OCR engine...';

    try {
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js not loaded');
        }

        const result = await Tesseract.recognize(file, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const pct = Math.round((m.progress || 0) * 100);
                    ocrProgressText.textContent = `Reading text... ${pct}%`;
                }
            }
        });

        const text = result.data.text || '';
        console.log('[MacroFit] OCR raw text:', text);

        // Parse nutrition values from OCR text
        const parsed = parseNutritionLabel(text);

        // Populate fields
        document.getElementById('labelCal').value  = parsed.calories || '';
        document.getElementById('labelProt').value  = parsed.protein || '';
        document.getElementById('labelCarb').value  = parsed.carbs || '';
        document.getElementById('labelFat').value   = parsed.fat || '';
        document.getElementById('labelServing').value = parsed.serving || '';
        document.getElementById('labelName').value  = '';

        ocrProgress.style.display = 'none';
        labelResultArea.style.display = 'block';

        const foundCount = [parsed.calories, parsed.protein, parsed.carbs, parsed.fat].filter(v => v > 0).length;
        if (foundCount >= 2) {
            showToast(`Found ${foundCount}/4 nutrition values. Verify and edit if needed.`);
        } else {
            showToast('Could not read label clearly. Please enter values manually.');
        }

    } catch (err) {
        console.warn('[MacroFit] OCR failed:', err.message);
        ocrProgress.style.display = 'none';
        labelResultArea.style.display = 'block';
        // Clear fields for manual entry
        document.getElementById('labelCal').value = '';
        document.getElementById('labelProt').value = '';
        document.getElementById('labelCarb').value = '';
        document.getElementById('labelFat').value = '';
        document.getElementById('labelServing').value = '';
        document.getElementById('labelName').value = '';
        showToast('OCR unavailable. Enter values manually from the label.');
    }

    // Reset file input so same file can be re-selected
    labelFileInput.value = '';
});

/**
 * Parse US nutrition label text for common fields.
 * Handles variations like "Calories 240", "Total Fat 8g", "Protein 5 g"
 */
function parseNutritionLabel(text) {
    const clean = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    function extractValue(patterns) {
        for (const pattern of patterns) {
            const match = clean.match(pattern);
            if (match) {
                const val = parseFloat(match[1]);
                if (!isNaN(val) && val >= 0 && val < 10000) return Math.round(val);
            }
        }
        return 0;
    }

    const calories = extractValue([
        /[Cc]alories\s*(\d+)/,
        /[Cc]alories\s*[:\s]\s*(\d+)/,
        /[Cc]al(?:ories|\.?)\s+(\d+)/,
        /(\d+)\s*[Cc]alories/,
    ]);

    const fat = extractValue([
        /[Tt]otal\s*[Ff]at\s*(\d+\.?\d*)\s*g/,
        /[Ff]at\s*(\d+\.?\d*)\s*g/,
        /[Tt]otal\s*[Ff]at\s*[:\s]\s*(\d+\.?\d*)/,
    ]);

    const carbs = extractValue([
        /[Tt]otal\s*[Cc]arb(?:ohydrate|s|\.?)?\s*(\d+\.?\d*)\s*g/,
        /[Cc]arb(?:ohydrate|s|\.?)?\s*(\d+\.?\d*)\s*g/,
        /[Tt]otal\s*[Cc]arb\w*\s*[:\s]\s*(\d+\.?\d*)/,
    ]);

    const protein = extractValue([
        /[Pp]rotein\s*(\d+\.?\d*)\s*g/,
        /[Pp]rotein\s*[:\s]\s*(\d+\.?\d*)/,
    ]);

    // Serving size — grab the text after "Serving Size" or "Serv. Size"
    let serving = '';
    const servMatch = clean.match(/[Ss]erv(?:ing|\.)\s*[Ss]ize\s*[:\s]?\s*([^\d]*\d+[^\n,]{0,30})/);
    if (servMatch) serving = servMatch[1].trim().substring(0, 50);

    return { calories, protein, carbs, fat, serving };
}

/**
 * "Show Nutrition Card" button — takes the edited values and renders a food card.
 */
saveLabelResult?.addEventListener('click', () => {
    const food = {
        name: document.getElementById('labelName').value.trim() || 'Scanned Product',
        brand: 'Nutrition Label Scan',
        cal:  parseInt(document.getElementById('labelCal').value) || 0,
        prot: parseInt(document.getElementById('labelProt').value) || 0,
        carb: parseInt(document.getElementById('labelCarb').value) || 0,
        fat:  parseInt(document.getElementById('labelFat').value) || 0,
        serving: document.getElementById('labelServing').value.trim() || 'Per serving',
        source: 'LABEL',
    };

    foodSearchResults.innerHTML = '<div class="food-results-grid">' + renderFoodCard(food) + '</div>';
    labelScannerWrap.style.display = 'none';
    showToast('Nutrition card created from label!');
});

/* ============================================================
   CONTACT FORM — simulated serverless API call
   ============================================================ */
const contactForm    = document.getElementById('contactForm');
const contactSuccess = document.getElementById('contactSuccess');

contactForm?.addEventListener('submit', e => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    /*
     * TODO: Replace the setTimeout below with a real fetch() call to your
     * serverless function endpoint. Example:
     *
     * fetch('https://your-function.azurewebsites.net/api/contact', {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify({ name, email, goal, message })
     * });
     */
    setTimeout(() => {
        contactForm.style.display = 'none';
        contactSuccess.style.display = 'block';
    }, 1600);
});

/* ============================================================
   SCROLL REVEAL — IntersectionObserver
   ============================================================ */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ============================================================
   SMOOTH SCROLL — anchor links (offsets for fixed navbar)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */

/**
 * Display a brief toast message at the bottom-right of the screen.
 * @param {string} message
 */
function showToast(message) {
    const existing = document.getElementById('mfc-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'mfc-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        background: var(--accent-green);
        color: #fff;
        padding: 14px 22px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(99,102,241,0.35);
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        max-width: 300px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity  = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

/* ============================================================
   UTILITY — Escape HTML to prevent XSS injection
   ============================================================ */

/**
 * Safely escape a string for insertion into innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}
