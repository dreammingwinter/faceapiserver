(function(){
const nav =          document.getElementById('navigationPanel');
const swipeLS =      document.getElementById('swipeLeftSide');

function navChangeWidth(sign, value) {
    if (sign == '+') {
        let v;
        if (nav.style.width.includes('%')) {
            v = window.innerWidth + value;
        } else {
            v = Number(nav.style.width.slice(0,-2)) + value;
        }       
        nav.style.width = (v < 0 ? '0px' : v > window.innerWidth ? "100%" : `${v}px`);
    } else if (sign == '%') {
        nav.style.width = "100%";
    } else if (sign == '=') {
        nav.style.width = "0px";
    }
}

let diff = 50;
let prevTouchX;
let startPoint;
let touchX;
let total;
let startWidth;

[nav, swipeLS].forEach(el => el.addEventListener("touchstart", e => {
    startPoint = e.touches[0].clientX
    prevTouchX = startPoint;
    startWidth = nav.clientWidth < window.innerWidth / 2 ? 0 : 1;
    nav.classList.add('no-trs');
}, {passive: true}));
[nav, swipeLS].forEach(el => el.addEventListener("touchmove", e => {
    touchX = e.changedTouches[0].clientX;
    navChangeWidth('+', touchX - prevTouchX);
    prevTouchX = touchX;
}, {passive: true}));
[nav, swipeLS].forEach(el => el.addEventListener("touchend", () => {
    total = prevTouchX - startPoint;
    nav.classList.remove('no-trs');
    if (Math.abs(total) < diff) {
        if (startWidth) {
            navChangeWidth('%');
        } else{
            navChangeWidth('=');
        }
    } else {
        if (!startWidth && total > 0) {
            navChangeWidth('%');
        } else if (startWidth && total < 0) {
            navChangeWidth('=');
        }
    }
}, {passive: true}));
})();