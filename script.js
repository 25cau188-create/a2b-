// --- Navigation Setup ---
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Change navbar background on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// --- Countdown Timer System ---
// Set the date we're counting down to (e.g., March 15, 2026 14:00:00)
// Using a date in the future relative to the current time 2026
const tournamentDate = new Date("March 15, 2026 14:00:00").getTime();

const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = tournamentDate - now;

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the elements
    document.getElementById("days").innerHTML = days < 10 ? '0' + days : days;
    document.getElementById("hours").innerHTML = hours < 10 ? '0' + hours : hours;
    document.getElementById("minutes").innerHTML = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById("seconds").innerHTML = seconds < 10 ? '0' + seconds : seconds;

    // If the count down is finished, write some text
    if (distance < 0) {
        clearInterval(timerInterval);
        document.getElementById("countdown").innerHTML = "<div style='font-family: var(--font-heading); font-size: 2rem; color: var(--accent-primary);'>TOURNAMENT HAS STARTED</div>";
    }
};

// Update the countdown every 1 second
const timerInterval = setInterval(updateCountdown, 1000);
updateCountdown(); // Initial call to avoid graphical pop

// --- Scroll Animation Observer ---
// Using Intersection Observer to trigger CSS animations when elements scroll into view
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Unobserve to play animation only once
        }
    });
}, observerOptions);

// Select all elements that need to animate on scroll
document.addEventListener('DOMContentLoaded', () => {
    const slideUpElements = document.querySelectorAll('.slide-up');
    slideUpElements.forEach(el => observer.observe(el));
});

// --- Fake Form Submission ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = registerForm.querySelector('button');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSING...';
        btn.style.opacity = '0.8';
        btn.disabled = true;

        // Simulate network request
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-check"></i> REDIRECTING TO PAYMENT...';
            btn.style.background = '#4CAF50'; // Green success color
            
            // Here you would normally redirect to a payment gateway
            setTimeout(() => {
                alert("This is a demo. In a real app, you would be redirected to a payment gateway.");
                btn.innerHTML = originalText;
                btn.style.background = ''; // reset to css default
                btn.style.opacity = '1';
                btn.disabled = false;
                registerForm.reset();
            }, 1500);
        }, 1500);
    });
}
