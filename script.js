// DOM Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const recipeGrid = document.getElementById("recipe-grid");
const loading = document.getElementById("loading");
const notFound = document.getElementById("not-found");
const scrollBtn = document.getElementById("scroll-to-top");
const resultTitle = document.getElementById("result-title");
const categoryBtns = document.querySelectorAll(".cat-btn");
const recipeModal = document.getElementById("recipe-modal");
const modalContent = document.getElementById("modal-content");
const closeModal = document.getElementById("close-modal");
const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// Pagination Elements
const paginationContainer = document.getElementById("pagination-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageNumbers = document.getElementById("page-numbers");

let currentPage = 1;
let rows = 12; // Items per page
let currentMeals = []; // Store fetched meals for pagination

// Initial Load
window.onload = () => {
  get_all_recipes(); // Initial load strategy: get_all_recipes
  lucide.createIcons();
  highlightFeature(0); // Initialize first feature highlight

  // Set 'All' button as active by default on load
  categoryBtns.forEach((btn) => {
    if (btn.getAttribute("data-cat") === "all") {
      btn.classList.add("active");
    }
  });
};

// Mobile Menu Toggle
menuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
  const icon = mobileMenu.classList.contains("hidden") ? "menu" : "x";
  menuBtn.innerHTML = `<i data-lucide="${icon}" size="28"></i>`;
  lucide.createIcons();
});

// Scroll Logic
window.onscroll = () => {
  if (
    document.body.scrollTop > 300 ||
    document.documentElement.scrollTop > 300
  ) {
    scrollBtn.style.display = "block";
  } else {
    scrollBtn.style.display = "none";
  }
};

scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Search Functionality
const handleSearch = () => {
  const query = searchInput.value.trim();
  if (query) {
    fetchRecipes(query);
    // Clear active category buttons when searching
    categoryBtns.forEach((btn) => btn.classList.remove("active"));
  }
};

searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

// Category Filter Functionality

categoryBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.getAttribute("data-cat");
    // Remove active class from all buttons
    categoryBtns.forEach((b) => b.classList.remove("active"));
    // Add active class to clicked button
    btn.classList.add("active");

    if (cat === "all") {
      get_all_recipes();
    } else {
      fetchRecipes(cat);
    }
  });
});

// New function for initial load and 'All' category
async function get_all_recipes() {
  recipeGrid.innerHTML = "";
  loading.classList.remove("hidden");
  notFound.classList.add("hidden");
  paginationContainer.classList.add("hidden");
  resultTitle.innerText = "All Featured Recipes";

  try {
    const response = await fetch("recipes.json");
    const data = await response.json();

    loading.classList.add("hidden");

    if (data.meals) {
      currentMeals = data.meals;
      currentPage = 1;
      displayRecipes(currentMeals);
      setupPagination(currentMeals);
    } else {
      notFound.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Local Fetch Error:", error);
    loading.classList.add("hidden");
    fetchRecipes("egg", "All Featured Recipes");
  }
}

// Fetch Recipes from API
async function fetchRecipes(query, customTitle = null) {
  recipeGrid.innerHTML = "";
  loading.classList.remove("hidden");
  notFound.classList.add("hidden");
  paginationContainer.classList.add("hidden");
  resultTitle.innerText = customTitle || `Results for "${query}"...`;

  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
    );
    const data = await response.json();

    loading.classList.add("hidden");

    if (data.meals) {
      currentMeals = data.meals;
      currentPage = 1;
      displayRecipes(currentMeals);
      setupPagination(currentMeals);
    } else {
      notFound.classList.remove("hidden");
    }
  } catch (error) {
    console.error("API Fetch Error:", error);
    loading.classList.add("hidden");
  }
}

// Display Recipe Cards with Pagination
function displayRecipes(meals) {
  recipeGrid.innerHTML = "";

  // Calculate start and end index
  const start = (currentPage - 1) * rows;
  const end = start + rows;
  const paginatedItems = meals.slice(start, end);

  paginatedItems.forEach((meal) => {
    const description = meal.strInstructions
      ? meal.strInstructions.substring(0, 100) + "..."
      : "No description available.";

    const card = document.createElement("div");
    card.className =
      "recipe-card bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer";
    card.innerHTML = `
            <div class="relative overflow-hidden h-48">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-full object-cover transition transform hover:scale-110 duration-500">
                <div class="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                    ${meal.strCategory}
                </div>
            </div>
            <div class="p-5">
                <h4 class="text-xl font-bold mb-2 truncate text-slate-800">${meal.strMeal}</h4>
                <div class="flex items-center gap-1 text-slate-500 text-sm mb-2">
                    <i data-lucide="map-pin" size="14"></i>
                    <span>${meal.strArea} Origin</span>
                </div>
                <p class="text-slate-600 text-sm mb-4 line-clamp-2" title="${meal.strInstructions}">${description}</p>
                <button class="w-full py-3 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 font-bold rounded-xl transition flex items-center justify-center gap-2" onclick="openDetails('${meal.idMeal}')">
                    View Recipe <i data-lucide="arrow-right" size="18"></i>
                </button>
            </div>
        `;
    recipeGrid.appendChild(card);
  });
  lucide.createIcons();
}

// Setup Pagination
function setupPagination(items) {
  pageNumbers.innerHTML = "";
  const pageCount = Math.ceil(items.length / rows);

  if (pageCount > 1) {
    paginationContainer.classList.remove("hidden");

    // Prev Button
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        displayRecipes(currentMeals);
        setupPagination(currentMeals);
        // Scroll to top of results, not whole page
        document
          .getElementById("categories")
          .scrollIntoView({ behavior: "smooth" });
      }
    };
    prevBtn.disabled = currentPage === 1;

    // Next Button
    nextBtn.onclick = () => {
      if (currentPage < pageCount) {
        currentPage++;
        displayRecipes(currentMeals);
        setupPagination(currentMeals);
        document
          .getElementById("categories")
          .scrollIntoView({ behavior: "smooth" });
      }
    };
    nextBtn.disabled = currentPage === pageCount;

    // Page Numbers
    for (let i = 1; i <= pageCount; i++) {
      const btn = document.createElement("button");
      btn.innerText = i;
      btn.className = `w-10 h-10 rounded-lg font-bold transition ${
        currentPage === i
          ? "bg-orange-500 text-white"
          : "bg-white text-slate-600 hover:bg-orange-50 border border-slate-200"
      }`;
      btn.addEventListener("click", () => {
        currentPage = i;
        displayRecipes(currentMeals);
        setupPagination(currentMeals);
        document
          .getElementById("categories")
          .scrollIntoView({ behavior: "smooth" });
      });
      pageNumbers.appendChild(btn);
    }
    lucide.createIcons();
  } else {
    paginationContainer.classList.add("hidden");
  }
}

// Open Recipe Details in Modal
async function openDetails(id) {
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
    );
    const data = await response.json();
    const meal = data.meals[0];

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      if (meal[`strIngredient${i}`]) {
        ingredients.push(
          `${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}`
        );
      }
    }

    modalContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 lg:p-10">
                <div>
                    <img src="${
                      meal.strMealThumb
                    }" class="w-full rounded-2xl shadow-lg mb-6" alt="${
      meal.strMeal
    }">
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-bold">${
                          meal.strCategory
                        }</span>
                        <span class="bg-slate-100 text-slate-700 px-4 py-1 rounded-full text-sm font-bold">${
                          meal.strArea
                        }</span>
                    </div>
                    <h5 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <i data-lucide="list-checks" class="text-orange-500"></i> Ingredients:
                    </h5>
                    <ul class="grid grid-cols-1 gap-2 text-slate-600">
                        ${ingredients
                          .map(
                            (ing) =>
                              `<li class="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"><i data-lucide="check-circle-2" class="text-green-500" size="16"></i> ${ing}</li>`
                          )
                          .join("")}
                    </ul>
                </div>
                <div>
                    <h2 class="text-3xl font-extrabold text-slate-900 mb-6">${
                      meal.strMeal
                    }</h2>
                    <h5 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <i data-lucide="chef-hat" class="text-orange-500"></i> Instructions:
                    </h5>
                    <p class="text-slate-600 leading-relaxed whitespace-pre-line mb-8">
                        ${meal.strInstructions}
                    </p>
                    ${
                      meal.strYoutube
                        ? `
                        <a href="${meal.strYoutube}" target="_blank" class="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition shadow-lg">
                            <i data-lucide="youtube"></i> Watch Video Tutorial
                        </a>
                    `
                        : ""
                    }
                </div>
            </div>
        `;

    recipeModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    lucide.createIcons();
  } catch (error) {
    console.error("Detail Fetch Error:", error);
  }
}

// Close Modal
closeModal.addEventListener("click", () => {
  recipeModal.classList.add("hidden");
  document.body.style.overflow = "auto";
});

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    recipeModal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
});

// Feature Highlight Logic
function highlightFeature(index) {
  // Remove selected class from all cards
  document.querySelectorAll(".feature-card").forEach((card, i) => {
    if (i === index) {
      card.classList.add("bg-orange-50", "border-orange-200");
      card.classList.remove("bg-slate-50", "border-slate-100");
    } else {
      card.classList.remove("bg-orange-50", "border-orange-200");
      card.classList.add("bg-slate-50", "border-slate-100");
    }
  });

  // Hide all highlight contents
  document.querySelectorAll(".feature-highlight-content").forEach((content, i) => {
    if (i === index) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });
}

// Stats Counter Animation
const animateStats = () => {
  const stats = document.querySelectorAll(".stat-counter");
  const speed = 200;

  stats.forEach((stat) => {
    const updateCount = () => {
      const target = +stat.getAttribute("data-target");
      const count = +stat.innerText.replace(/,/g, "");
      const inc = target / speed;

      if (count < target) {
        const nextValue = Math.ceil(count + inc);
        stat.innerText = (nextValue > target ? target : nextValue).toLocaleString();
        setTimeout(updateCount, 1);
      } else {
        stat.innerText = target.toLocaleString();
        if (target === 4.9) stat.innerText = "4.9"; // Special case for float
      }
    };
    updateCount();
  });
};

// Intersection Observer for Stats
const statsSection = document.querySelector(".stat-counter");
if (statsSection) {
  const statsObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStats();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  statsObserver.observe(statsSection.parentElement.parentElement);
}

// Scroll Reveal Animation
const revealElements = document.querySelectorAll(".reveal");

const revealCallback = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      observer.unobserve(entry.target);
    }
  });
};

const revealObserver = new IntersectionObserver(revealCallback, {
  root: null,
  threshold: 0.15,
});

revealElements.forEach((el) => revealObserver.observe(el));

// Testimonial Carousel Logic
const testiCarousel = document.getElementById("testimonial-carousel");
const testiPrev = document.getElementById("testi-prev");
const testiNext = document.getElementById("testi-next");
const testiDots = document.getElementById("testi-dots");

if (testiCarousel && testiPrev && testiNext && testiDots) {
  const cards = testiCarousel.querySelectorAll(".testi-card");
  const dots = testiDots.querySelectorAll("button");
  let currentIndex = 0;
  let intervalId;
  const autoPlayDelay = 4000;

  // Get exact scroll position based on card width + gap
  const getScrollPosition = (index) => {
    if (!cards[index]) return 0;
    const cardWidth = cards[index].offsetWidth;
    const gap = 32; // gap-8 = 2rem = 32px
    return index * (cardWidth + gap);
  };

  // Update Dots UI
  const updateDots = (index) => {
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.remove("bg-white/30", "hover:bg-white/50");
        dot.classList.add("bg-orange-500", "scale-125");
      } else {
        dot.classList.add("bg-white/30", "hover:bg-white/50");
        dot.classList.remove("bg-orange-500", "scale-125");
      }
    });
  };

  // Scroll to Slide
  const scrollToSlide = (index) => {
    // Loop logic
    if (index < 0) index = cards.length - 1;
    if (index >= cards.length) index = 0;

    currentIndex = index;
    const pos = getScrollPosition(currentIndex);

    testiCarousel.scrollTo({
      left: pos,
      behavior: "smooth",
    });

    updateDots(currentIndex);
  };

  // Navigation Events
  testiPrev.addEventListener("click", () => {
    scrollToSlide(currentIndex - 1);
    resetAutoPlay();
  });

  testiNext.addEventListener("click", () => {
    scrollToSlide(currentIndex + 1);
    resetAutoPlay();
  });

  // Dot Navigation
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      scrollToSlide(index);
      resetAutoPlay();
    });
  });

  // Auto Play Logic
  const startAutoPlay = () => {
    intervalId = setInterval(() => {
      scrollToSlide(currentIndex + 1);
    }, autoPlayDelay);
  };

  const stopAutoPlay = () => {
    if (intervalId) clearInterval(intervalId);
  };

  const resetAutoPlay = () => {
    stopAutoPlay();
    startAutoPlay();
  };

  // Pause on hover
  testiCarousel.parentElement.addEventListener("mouseenter", stopAutoPlay);
  testiCarousel.parentElement.addEventListener("mouseleave", startAutoPlay);

  // Initial Start
  startAutoPlay();

  // Handle Window Resize to fix scroll positions
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      scrollToSlide(currentIndex);
    }, 200);
  });
}
