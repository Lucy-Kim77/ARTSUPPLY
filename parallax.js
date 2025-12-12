// Simple scroll-based parallax for elements with data-parallax + data-speed

const parallaxEls = document.querySelectorAll("[data-parallax]");

function handleScroll() {
  const y = window.scrollY;

  parallaxEls.forEach((el) => {
    const speed = parseFloat(el.dataset.speed || "0");
    const offset = y * speed * -0.15; // tweak multiplier if you want stronger/weaker effect
    el.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
}

window.addEventListener("scroll", handleScroll);
handleScroll();
