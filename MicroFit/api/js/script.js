const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const navMenu = document.getElementById('navMenu');
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
const visitorCountElement = document.getElementById('visitorCount');
const visitorStatus = document.getElementById('visitorStatus');
const macroForm = document.getElementById('macroForm');
const workoutForm = document.getElementById('workoutForm');
const contactForm = document.getElementById('contactForm');

// Initialize AOS (Animate On Scroll)
if (typeof AOS !== 'undefined') {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out-cubic',
        once: true,
        offset: 100,
        delay: 0,
        disable: function() {
            return window.innerWidth < 768;
        }
    });
}

// Animated counter for metric cards
function animateCounter() {
    const counters = document.querySelectorAll('.counter-value[data-target]');
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const isDecimal = target % 1 !== 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuad = 1 - Math.pow(1 - progress, 2);
            const current = target * easeOutQuad;

            if (isDecimal) {
                counter.textContent = current.toFixed(1);
            } else {
                counter.textContent = Math.round(current);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    });
}

// Trigger counter animation when hero section is visible
if (typeof IntersectionObserver !== 'undefined') {
    const heroMetrics = document.querySelector('.hero-metrics');
    if (heroMetrics) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        observer.observe(heroMetrics);
    }
}

const savedTheme = localStorage.getItem('macrofit-theme') || 'dark';
if (savedTheme === 'light') {
    body.classList.add('light-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('macrofit-theme', isLight ? 'light' : 'dark');
    themeToggle.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

hamburger.addEventListener('click', () => {
    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
});

navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        const href = event.currentTarget.getAttribute('href');
        if (href.startsWith('#')) {
            event.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        if (window.innerWidth <= 768) {
            navMenu.style.display = 'none';
        }
    });
});

// Handle auth button clicks to close hamburger menu
function setupAuthButtonListeners() {
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    const logoutBtn = document.querySelector('.logout-btn');

    [loginBtn, registerBtn, logoutBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navMenu.style.display = 'none';
                }
            });
        }
    });
}

// Setup auth listeners on page load and when auth state changes
document.addEventListener('DOMContentLoaded', () => {
    setupAuthButtonListeners();
});

// Also setup when auth UI is initialized
const originalInitializeAuthUI = MicroFitAuth.prototype.initializeAuthUI;
MicroFitAuth.prototype.initializeAuthUI = function() {
    originalInitializeAuthUI.call(this);
    setTimeout(setupAuthButtonListeners, 0);
};

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 140;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

function handleResize() {
    if (window.innerWidth > 768) {
        navMenu.style.display = 'flex';
    } else {
        navMenu.style.display = 'none';
    }
}

window.addEventListener('resize', handleResize);
handleResize();

// Visitor counter
const apiUrl = 'https://YOUR_API_URL_HERE/api/visitor';
const fallbackKey = 'macrofit-visitor-fallback';

async function loadVisitorCounter() {
    if (!visitorCountElement || !visitorStatus) return;

    visitorStatus.textContent = 'Loading visitor count...';
    try {
        const response = await fetch(apiUrl, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        const data = await response.json();
        const count = data.visitorCount ?? data.count ?? null;
        if (count === null) throw new Error('Invalid response');
        visitorCountElement.textContent = count.toLocaleString();
        visitorStatus.textContent = 'Live cloud counter is online.';
        localStorage.setItem(fallbackKey, String(count));
    } catch (error) {
        const fallback = localStorage.getItem(fallbackKey) || '1200';
        visitorCountElement.textContent = fallback;
        visitorStatus.textContent = 'Cloud API unavailable. Showing fallback count.';
        console.warn('Visitor counter error:', error);
    }
}

loadVisitorCounter();

// Macro tracker
const macroValues = {
    calories: document.getElementById('calories'),
    protein: document.getElementById('protein'),
    carbs: document.getElementById('carbs'),
    fats: document.getElementById('fats'),
    water: document.getElementById('water'),
};

const macroDisplay = {
    calories: document.getElementById('calorieValue'),
    protein: document.getElementById('proteinValue'),
    carbs: document.getElementById('carbsValue'),
    fats: document.getElementById('fatValue'),
    water: document.getElementById('waterValue'),
};

const macroStorage = 'macrofit-macros';

function renderMacros(values) {
    macroDisplay.calories.textContent = values.calories.toLocaleString();
    macroDisplay.protein.textContent = `${values.protein}g`;
    macroDisplay.carbs.textContent = `${values.carbs}g`;
    macroDisplay.fats.textContent = `${values.fats}g`;
    macroDisplay.water.textContent = `${values.water}L`;
}

function saveMacroValues(values) {
    localStorage.setItem(macroStorage, JSON.stringify(values));
}

function loadMacroValues() {
    const saved = localStorage.getItem(macroStorage);
    if (saved) {
        return JSON.parse(saved);
    }
    return { calories: 2100, protein: 150, carbs: 210, fats: 72, water: 2.3 };
}

function updateMacros() {
    const values = {
        calories: Math.max(0, Number(macroValues.calories.value) || 0),
        protein: Math.max(0, Number(macroValues.protein.value) || 0),
        carbs: Math.max(0, Number(macroValues.carbs.value) || 0),
        fats: Math.max(0, Number(macroValues.fats.value) || 0),
        water: Math.max(0, Number(macroValues.water.value) || 0),
    };
    renderMacros(values);
    saveMacroValues(values);
}

if (macroForm) {
    const savedMacros = loadMacroValues();
    macroValues.calories.value = savedMacros.calories;
    macroValues.protein.value = savedMacros.protein;
    macroValues.carbs.value = savedMacros.carbs;
    macroValues.fats.value = savedMacros.fats;
    macroValues.water.value = savedMacros.water;
    renderMacros(savedMacros);

    Object.values(macroValues).forEach(input => {
        input.addEventListener('input', updateMacros);
    });

    macroForm.addEventListener('submit', event => {
        event.preventDefault();
        updateMacros();
        const button = macroForm.querySelector('button');
        button.textContent = 'Updated!';
        setTimeout(() => {
            button.textContent = 'Update Dashboard';
        }, 1500);
    });
}

// Workout tracker
const workoutTableBody = document.getElementById('workoutTableBody');
const workoutFields = {
    exercise: document.getElementById('exercise'),
    sets: document.getElementById('sets'),
    reps: document.getElementById('reps'),
    weight: document.getElementById('weight'),
    cardio: document.getElementById('cardio'),
    notes: document.getElementById('workoutNotes'),
};
const workoutStorage = 'macrofit-workouts';
let workoutEntries = [];

function loadWorkouts() {
    const saved = localStorage.getItem(workoutStorage);
    if (saved) {
        return JSON.parse(saved);
    }
    return [
        { date: '2026-05-21', exercise: 'Goblet squat', sets: 3, reps: 12, weight: '40kg', cardio: '10 min' },
        { date: '2026-05-20', exercise: 'Dumbbell row', sets: 4, reps: 10, weight: '22kg', cardio: '8 min' },
    ];
}

function saveWorkouts() {
    localStorage.setItem(workoutStorage, JSON.stringify(workoutEntries));
}

function renderWorkouts() {
    if (!workoutTableBody) return;
    workoutTableBody.innerHTML = workoutEntries.map(entry => `
        <tr>
            <td>${entry.date}</td>
            <td>${entry.exercise}</td>
            <td>${entry.sets}</td>
            <td>${entry.reps}</td>
            <td>${entry.weight}</td>
            <td>${entry.cardio}</td>
            <td>${entry.notes || ''}</td>
        </tr>
    `).join('');
}

if (workoutForm) {
    workoutEntries = loadWorkouts();
    renderWorkouts();

    workoutForm.addEventListener('submit', event => {
        event.preventDefault();
        const newEntry = {
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            exercise: workoutFields.exercise.value || 'Unnamed exercise',
            sets: Number(workoutFields.sets.value) || 0,
            reps: Number(workoutFields.reps.value) || 0,
            weight: workoutFields.weight.value || 'bodyweight',
            cardio: workoutFields.cardio.value ? `${workoutFields.cardio.value} min` : '0 min',
            notes: workoutFields.notes.value || '',
        };
        workoutEntries.unshift(newEntry);
        if (workoutEntries.length > 10) workoutEntries.pop();
        saveWorkouts();
        renderWorkouts();
        workoutForm.reset();
        workoutFields.sets.value = 3;
        workoutFields.reps.value = 12;
        const button = workoutForm.querySelector('button');
        button.textContent = 'Added!';
        setTimeout(() => {
            button.textContent = 'Add Workout Entry';
        }, 1200);
    });
}

// Contact form
if (contactForm) {
    contactForm.addEventListener('submit', event => {
        event.preventDefault();
        const button = contactForm.querySelector('button');
        button.textContent = 'Sent!';
        button.disabled = true;
        setTimeout(() => {
            contactForm.reset();
            button.textContent = 'Send Inquiry';
            button.disabled = false;
        }, 2500);
    });
}

// Reveal animations
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.2, rootMargin: '0px 0px -100px 0px' });

document.querySelectorAll('.feature-card, .tracker-card, .summary-card, .path-card, .contact-card, .counter-card').forEach(el => {
    el.classList.add('reveal-hidden');
    revealObserver.observe(el);
});

// Calories & Macros Calculator
const calcForm = document.getElementById('calcForm');
const calcFields = {
    bodyWeight: document.getElementById('bodyWeight'),
    heightCm: document.getElementById('heightCm'),
    weightUnit: document.getElementById('weightUnit'),
    activityLevel: document.getElementById('activityLevel'),
    goal: document.getElementById('goal'),
    proteinPerKg: document.getElementById('proteinPerKg'),
    fatPerKg: document.getElementById('fatPerKg')
};
const calcDisplay = {
    calories: document.getElementById('calcCalories'),
    protein: document.getElementById('calcProtein'),
    fats: document.getElementById('calcFats'),
    carbs: document.getElementById('calcCarbs'),
    bmi: document.getElementById('calcBMI'),
    height: document.getElementById('calcHeight'),
    note: document.getElementById('calcNote'),
    bmiCategory: document.getElementById('bmiCategory'),
    bmiStatus: document.getElementById('bmiStatus'),
    waterIntake: document.getElementById('waterIntake'),
    goalAdjustment: document.getElementById('goalAdjustment'),
    goalStatus: document.getElementById('goalStatus')
};

function toKg(value, unit) {
    const v = Number(value) || 0;
    if (unit === 'lb') return v * 0.45359237;
    return v;
}

function round(n) {
    return Math.round(n);
}

function calculateAndRender() {
    if (!calcFields.bodyWeight) return;
    const weightInput = Number(calcFields.bodyWeight.value) || 0;
    const unit = calcFields.weightUnit.value || 'kg';
    const activity = Number(calcFields.activityLevel.value) || 1.55;
    const goalFactor = Number(calcFields.goal.value) || 1.0;
    const proteinPerKg = Number(calcFields.proteinPerKg.value) || 2.0;
    const fatPerKg = Number(calcFields.fatPerKg.value) || 0.9;

    const weightKg = toKg(weightInput, unit);
    const heightCm = Number(calcFields.heightCm?.value) || 0;
    const heightM = heightCm > 0 ? heightCm / 100 : 0;

    // Calculate BMI
    const bmi = heightM > 0 ? Math.round((weightKg / (heightM * heightM)) * 10) / 10 : 0;
    
    // Determine BMI category
    let bmiCat = '--';
    let bmiStatusClass = '';
    let statusEmoji = '⊘';
    
    if (bmi > 0) {
        if (bmi < 18.5) {
            bmiCat = 'Underweight';
            bmiStatusClass = 'underweight';
            statusEmoji = '💙';
        } else if (bmi < 25) {
            bmiCat = 'Healthy';
            bmiStatusClass = 'healthy';
            statusEmoji = '💚';
        } else if (bmi < 30) {
            bmiCat = 'Overweight';
            bmiStatusClass = 'overweight';
            statusEmoji = '💛';
        } else {
            bmiCat = 'Obese';
            bmiStatusClass = 'obese';
            statusEmoji = '❤️';
        }
    }

    // Simple maintenance estimate: weightKg * 24 * activity
    const maintenance = weightKg * 24 * activity;
    const targetCalories = Math.max(0, maintenance * goalFactor);

    // Calculate water intake (35ml per kg bodyweight)
    const waterML = weightKg * 35;
    const waterL = (waterML / 1000).toFixed(1);

    // Goal adjustment text
    let goalText = 'Maintain';
    if (goalFactor < 1) goalText = '-10% Deficit';
    if (goalFactor > 1) goalText = '+15% Surplus';

    const proteinG = proteinPerKg * weightKg;
    const fatsG = fatPerKg * weightKg;

    const proteinCal = proteinG * 4;
    const fatsCal = fatsG * 9;
    let carbsCal = targetCalories - (proteinCal + fatsCal);
    if (carbsCal < 0) carbsCal = 0;
    const carbsG = carbsCal / 4;

    // Render dashboard
    if (calcDisplay.calories) calcDisplay.calories.textContent = `${round(targetCalories)} kcal`;
    if (calcDisplay.protein) calcDisplay.protein.textContent = `${round(proteinG)} g`;
    if (calcDisplay.fats) calcDisplay.fats.textContent = `${round(fatsG)} g`;
    if (calcDisplay.carbs) calcDisplay.carbs.textContent = `${round(carbsG)} g`;
    
    // BMI display
    if (calcDisplay.bmi) {
        calcDisplay.bmi.textContent = bmi > 0 ? `${bmi}` : '--';
    }
    if (calcDisplay.bmiCategory) {
        calcDisplay.bmiCategory.textContent = bmiCat;
    }
    if (calcDisplay.bmiStatus) {
        calcDisplay.bmiStatus.className = `status-indicator ${bmiStatusClass}`;
        calcDisplay.bmiStatus.textContent = statusEmoji;
    }
    
    // Water intake
    if (calcDisplay.waterIntake) {
        calcDisplay.waterIntake.textContent = `${waterL}L`;
    }
    
    // Goal adjustment
    if (calcDisplay.goalAdjustment) {
        calcDisplay.goalAdjustment.textContent = goalText;
    }
    
    // Goal status
    if (calcDisplay.goalStatus) {
        calcDisplay.goalStatus.textContent = bmiCat !== '--' ? bmiCat : '--';
    }
    
    if (calcDisplay.height) {
        calcDisplay.height.textContent = heightCm > 0 ? `${round(heightCm)} cm` : '--';
    }
    
    if (calcDisplay.note) {
        calcDisplay.note.textContent = `Based on ${round(weightKg)} kg bodyweight, activity x${activity}, goal factor x${goalFactor}.`;
    }

    // Save last inputs
    try {
        const saved = {
            weightInput, unit, activity, goalFactor, proteinPerKg, fatPerKg, heightCm
        };
        localStorage.setItem('microfit-calc', JSON.stringify(saved));
    } catch (e) {
        // ignore storage errors
    }
}

// Restore saved
if (calcForm) {
    const saved = localStorage.getItem('microfit-calc');
    if (saved) {
        try {
            const p = JSON.parse(saved);
            if (p.weightInput) calcFields.bodyWeight.value = p.weightInput;
            if (p.unit) calcFields.weightUnit.value = p.unit;
            if (p.activity) calcFields.activityLevel.value = p.activity;
            if (p.goalFactor) calcFields.goal.value = p.goalFactor;
            if (p.proteinPerKg) calcFields.proteinPerKg.value = p.proteinPerKg;
            if (p.fatPerKg) calcFields.fatPerKg.value = p.fatPerKg;
            if (p.heightCm) calcFields.heightCm.value = p.heightCm;
        } catch (e) {}
    }

    // initial render
    calculateAndRender();

    calcForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateAndRender();
        const btn = calcForm.querySelector('button');
        const orig = btn.textContent;
        btn.textContent = 'Calculated';
        setTimeout(() => { btn.textContent = orig; }, 1200);
    });

    // live updates
    Object.values(calcFields).forEach(f => {
        if (!f) return;
        f.addEventListener('input', () => calculateAndRender());
    });
}
