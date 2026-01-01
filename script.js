// --- Configuration ---
const SEGMENT_COUNT = 24; // Number of segments in the tracker ring
const RADIUS = 140;
const INNER_RADIUS = 90;
const CENTER = 150;

// --- State Management ---
const inputs = ['pitfalls', 'core-practices', 'dial-mode', 'zoom-out'];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTracker();
    loadData();
    setupAutoSave();
});

// --- SVG Tracker Generator ---
function initTracker() {
    const container = document.getElementById('tracker-container');
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    // Set ViewBox based on radius
    svg.setAttribute("viewBox", "0 0 300 300");
    svg.setAttribute("class", "w-full h-full");

    const anglePerSegment = 360 / SEGMENT_COUNT;
    const gap = 2; // Gap between segments in degrees

    for (let i = 0; i < SEGMENT_COUNT; i++) {
        const startAngle = (i * anglePerSegment) + (gap / 2);
        const endAngle = ((i + 1) * anglePerSegment) - (gap / 2);

        // Calculate coordinates
        const pathData = describeArc(CENTER, CENTER, RADIUS, INNER_RADIUS, startAngle, endAngle);

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pathData);
        path.setAttribute("class", "tracker-segment");
        path.setAttribute("data-index", i);
        path.onclick = (e) => toggleSegment(i, e.target);

        svg.appendChild(path);
    }

    container.appendChild(svg);
}

// Helper to calculate SVG path for an arc
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, outerRadius, innerRadius, startAngle, endAngle) {
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");

    return d;
}

// --- Interaction Logic ---

function toggleSegment(index, element) {
    element.classList.toggle('active');
    saveTrackerState();
}

function resetTracker() {
    if (confirm("Are you sure you want to clear the tracker ring?")) {
        document.querySelectorAll('.tracker-segment').forEach(el => el.classList.remove('active'));
        saveTrackerState();
    }
}

// --- Persistence (Local Storage) ---

function saveTrackerState() {
    const activeIndices = [];
    document.querySelectorAll('.tracker-segment').forEach((el, index) => {
        if (el.classList.contains('active')) {
            activeIndices.push(index);
        }
    });
    localStorage.setItem('nf_tracker_state', JSON.stringify(activeIndices));
    showToast();
}

function setupAutoSave() {
    inputs.forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', () => {
            localStorage.setItem(`nf_text_${id}`, el.value);
            // Debounce toast for text input
            clearTimeout(window.saveTimeout);
            window.saveTimeout = setTimeout(showToast, 1000);
        });
    });
}

function loadData() {
    // Load Text Areas
    inputs.forEach(id => {
        const saved = localStorage.getItem(`nf_text_${id}`);
        if (saved) document.getElementById(id).value = saved;
    });

    // Load Tracker
    const savedTracker = JSON.parse(localStorage.getItem('nf_tracker_state') || '[]');
    const segments = document.querySelectorAll('.tracker-segment');
    savedTracker.forEach(index => {
        if (segments[index]) segments[index].classList.add('active');
    });
}

// --- UI Feedback ---
function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2000);
}
