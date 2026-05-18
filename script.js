const timeElement = document.getElementById("time");
const dateElement = document.getElementById("date");

function updateClock() {
  const now = new Date();

  timeElement.textContent = now.toLocaleTimeString("zh-CN", {
    hour12: false,
  });

  dateElement.textContent = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

updateClock();
setInterval(updateClock, 1000);
