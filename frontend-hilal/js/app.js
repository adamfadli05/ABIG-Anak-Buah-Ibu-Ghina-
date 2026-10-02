const foodGrid = document.getElementById("foodGrid");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category-btn");
const emptyMessage = document.getElementById("emptyMessage");
let selectedCategory = "semua";

function renderFoods() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filteredFoods = foodData.filter(food => {
    const matchesCategory = selectedCategory === "semua" || food.category === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(keyword) || food.address.toLowerCase().includes(keyword);
    return matchesCategory && matchesSearch;
  });

  foodGrid.innerHTML = filteredFoods.map(food => `
    <article class="food-card">
      <div class="food-photo" role="img" aria-label="Foto ${food.name}"></div>
      <h2 class="food-name">${food.name}</h2>
      <div class="food-location">
        <span class="pin" aria-hidden="true">📍</span>
        <span>${food.address}</span>
      </div>
      <div class="food-meta">
        <span class="food-price">${food.price}</span>
        <span class="food-rating"><span class="star">★</span>${food.rating}</span>
      </div>
    </article>
  `).join("");

  emptyMessage.hidden = filteredFoods.length !== 0;
}

searchInput.addEventListener("input", renderFoods);
categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    categoryButtons.forEach(item => item.classList.toggle("active", item === button));
    renderFoods();
  });
});

renderFoods();
