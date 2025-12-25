// DOM Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const recipeGrid = document.getElementById("recipe-grid");
const popularGrid = document.getElementById("popular-grid"); // Element on popular_recipe.html
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
let currentMeals = []; // Store fetched meals

// --- Favorites Logic ---

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites')) || [];
}

function saveFavorites(favs) {
  localStorage.setItem('favorites', JSON.stringify(favs));
}

function isFavorite(id) {
  const favs = getFavorites();
  return favs.some(meal => meal.idMeal === id);
}

// Function exposed to window for onclick access
window.toggleFavorite = function(id, event) {
  if(event) event.stopPropagation();

  let favs = getFavorites();
  const existingIndex = favs.findIndex(m => m.idMeal === id);

  if (existingIndex !== -1) {
    // Remove from favorites
    favs.splice(existingIndex, 1);
    saveFavorites(favs);
    
    // If we are on the popular page, reload the list
    if (popularGrid) {
      loadFavorites();
    }
  } else {
    // Add to favorites
    // We need to find the meal object. 
    // If on home page, it's in currentMeals.
    const meal = currentMeals.find(m => m.idMeal === id);
    if (meal) {
      favs.push(meal);
      saveFavorites(favs);
    }
  }
  
  // Update button state visually
  updateFavoriteButtonState(id);
};

function updateFavoriteButtonState(id) {
    const isFav = isFavorite(id);
    const btns = document.querySelectorAll(`.fav-btn[data-id="${id}"]`);
    
    btns.forEach(btn => {
        btn.innerHTML = `<i data-lucide="heart" class="${isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'}"></i>`;
    });
    lucide.createIcons();
}

// --- Initial Load ---
window.onload = () => {
  lucide.createIcons();
  
  if (popularGrid) {
      // Logic for Popular Recipes Page
      loadFavorites();
  } else if (recipeGrid) {
      // Logic for Home Page
      get_all_recipes();
      highlightFeature(0); 

      // Set 'All' button as active by default
      if(categoryBtns) {
          categoryBtns.forEach((btn) => {
            if (btn.getAttribute("data-cat") === "all") {
              btn.classList.add("active");
            }
          });
      }
  }
};

// --- Mobile Menu ---
if(menuBtn) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      const icon = mobileMenu.classList.contains("hidden") ? "menu" : "x";
      menuBtn.innerHTML = `<i data-lucide="${icon}" size="28"></i>`;
      lucide.createIcons();
    });
}

// --- Scroll Logic ---
window.onscroll = () => {
  if (
    document.body.scrollTop > 300 ||
    document.documentElement.scrollTop > 300
  ) {
    if(scrollBtn) scrollBtn.style.display = "block";
  } else {
    if(scrollBtn) scrollBtn.style.display = "none";
  }
};

if(scrollBtn) {
    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// --- Search Functionality ---
const handleSearch = () => {
  if(!searchInput) return;
  const query = searchInput.value.trim();
  if (query) {
    fetchRecipes(query);
    // Clear active category buttons
    categoryBtns.forEach((btn) => btn.classList.remove("active"));
  }
};

if(searchBtn) searchBtn.addEventListener("click", handleSearch);
if(searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch();
    });
}

// --- Category Filter ---
if(categoryBtns) {
    categoryBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-cat");
        categoryBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        if (cat === "all") {
          get_all_recipes();
        } else {
          fetchRecipes(cat);
        }
      });
    });
}

// --- Fetch Functions ---

async function get_all_recipes() {
  if(!recipeGrid) return;
  // Fetch from API with empty string to get a variety of recipes
  fetchRecipes("", "All Featured Recipes");
}

async function fetchRecipes(query, customTitle = null) {
  if(!recipeGrid) return;

  recipeGrid.innerHTML = "";
  if(loading) loading.classList.remove("hidden");
  if(notFound) notFound.classList.add("hidden");
  if(paginationContainer) paginationContainer.classList.add("hidden");
  if(resultTitle) resultTitle.innerText = customTitle || `Results for "${query}"...`;

  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
    );
    const data = await response.json();

    if(loading) loading.classList.add("hidden");

    if (data.meals) {
      currentMeals = data.meals;
      currentPage = 1;
      displayRecipes(currentMeals, recipeGrid);
      setupPagination(currentMeals);
    } else {
      if(notFound) notFound.classList.remove("hidden");
    }
  } catch (error) {
    console.error("API Fetch Error:", error);
    if(loading) loading.classList.add("hidden");
  }
}

function loadFavorites() {
    if(!popularGrid) return;
    
    popularGrid.innerHTML = "";
    const favs = getFavorites();
    
    if (favs.length === 0) {
        popularGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <div class="text-6xl mb-4">💔</div>
                <h3 class="text-2xl font-bold mb-2 text-slate-700">No favorites yet!</h3>
                <p class="text-slate-500">Go back to home and add some recipes to your favorites.</p>
                <a href="index.html" class="inline-block mt-6 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition">Browse Recipes</a>
            </div>
        `;
        return;
    }
    
    // For favorites page, we display all (or could add local pagination if needed)
    displayRecipes(favs, popularGrid, false);
}

// --- Display Logic ---

function displayRecipes(meals, container, usePagination = true) {
  if(!container) return;
  container.innerHTML = "";

  let itemsToShow = meals;
  
  // Apply pagination only if requested and container is the main grid
  if (usePagination && container === recipeGrid) {
      const start = (currentPage - 1) * rows;
      const end = start + rows;
      itemsToShow = meals.slice(start, end);
  }

  itemsToShow.forEach((meal) => {
    const description = meal.strInstructions
      ? meal.strInstructions.substring(0, 100) + "..."
      : "No description available.";
      
    const isFav = isFavorite(meal.idMeal);

    const card = document.createElement("div");
    card.className =
      "recipe-card bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer relative group";
    
    // Note: Added Favorite Button in the HTML structure below
    card.innerHTML = `
            <div class="relative overflow-hidden h-48">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-full object-cover transition transform hover:scale-110 duration-500">
                <div class="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                    ${meal.strCategory}
                </div>
                
                <button 
                    class="fav-btn absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-sm z-20 hover:bg-white transition" 
                    data-id="${meal.idMeal}" 
                    onclick="toggleFavorite('${meal.idMeal}', event)"
                    title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}"
                >
                    <i data-lucide="heart" class="${isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'}"></i>
                </button>
            </div>
            <div class="p-5">
                <h4 class="text-xl font-bold mb-2 truncate text-slate-800">${meal.strMeal}</h4>
                <div class="flex items-center gap-1 text-slate-500 text-sm mb-2">
                    <i data-lucide="map-pin" size="14"></i>
                    <span>${meal.strArea} Origin</span>
                </div>
                <p class="text-slate-600 text-sm mb-4 line-clamp-2" title="${meal.strInstructions}">${description}</p>
                <button class="w-full py-3 bg-orange-500 hover:bg-green-500 hover:text-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2" onclick="openDetails('${meal.idMeal}')">
                    View Recipe <i data-lucide="arrow-right" size="18"></i>
                </button>
            </div>
        `;
    container.appendChild(card);
  });
  lucide.createIcons();
}

// --- Pagination ---

function setupPagination(items) {
  if(!paginationContainer) return;
  
  pageNumbers.innerHTML = "";
  const pageCount = Math.ceil(items.length / rows);

  if (pageCount > 1) {
    paginationContainer.classList.remove("hidden");

    // Prev Button
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        displayRecipes(currentMeals, recipeGrid);
        setupPagination(currentMeals);
        document
          .getElementById("categories")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    };
    prevBtn.disabled = currentPage === 1;

    // Next Button
    nextBtn.onclick = () => {
      if (currentPage < pageCount) {
        currentPage++;
        displayRecipes(currentMeals, recipeGrid);
        setupPagination(currentMeals);
        document
          .getElementById("categories")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    };
    nextBtn.disabled = currentPage === pageCount;

    // Page Numbers
    // Simple logic for limited page numbers could be added, but for now showing all
    let maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(pageCount, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement("button");
      btn.innerText = i;
      btn.className = `w-10 h-10 rounded-lg font-bold transition ${
        currentPage === i
          ? "bg-orange-500 text-white"
          : "bg-white text-slate-600 hover:bg-orange-50 border border-slate-200"
      }`;
      btn.addEventListener("click", () => {
        currentPage = i;
        displayRecipes(currentMeals, recipeGrid);
        setupPagination(currentMeals);
        document
          .getElementById("categories")
          ?.scrollIntoView({ behavior: "smooth" });
      });
      pageNumbers.appendChild(btn);
    }
    lucide.createIcons();
  } else {
    paginationContainer.classList.add("hidden");
  }
}

// --- Modal Logic ---

// Function exposed to window
window.openDetails = async function(id) {
  if(!recipeModal || !modalContent) return;

  try {
    // If we have the meal locally in currentMeals, use it?
    // Actually, getting fresh details is better for ingredients which might not be in search results fully sometimes.
    // TheMealDB search results usually contain full details though.
    // Optimization: Check currentMeals or Favorites first.
    
    let meal = currentMeals.find(m => m.idMeal === id);
    if (!meal) {
        // Check favorites
        const favs = getFavorites();
        meal = favs.find(m => m.idMeal === id);
    }

    // If still not found or we want to ensure fresh data (API lookup is cheap):
    if (!meal) {
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        );
        const data = await response.json();
        meal = data.meals[0];
    }
    
    if (!meal) return;

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
        ingredients.push(
          `${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`] || ''}`
        );
      }
    }
    
    // Check if fav for modal button
    const isFav = isFavorite(meal.idMeal);

    modalContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 lg:p-10">
                <div>
                    <img src="${meal.strMealThumb}" class="w-full rounded-2xl shadow-lg mb-6" alt="${meal.strMeal}">
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-bold">${meal.strCategory}</span>
                        <span class="bg-slate-100 text-slate-700 px-4 py-1 rounded-full text-sm font-bold">${meal.strArea}</span>
                    </div>
                    
                    <button 
                        class="fav-btn w-full py-3 mb-6 border-2 border-orange-500 text-orange-600 font-bold rounded-xl transition hover:bg-orange-50 flex items-center justify-center gap-2" 
                        data-id="${meal.idMeal}"
                        onclick="toggleFavorite('${meal.idMeal}', event)"
                    >
                         <i data-lucide="heart" class="${isFav ? 'fill-orange-600 text-orange-600' : ''}"></i> 
                         <span>${isFav ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                    </button>

                    <h5 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <i data-lucide="list-checks" class="text-orange-500"></i> Ingredients:
                    </h5>
                    <ul class="grid grid-cols-1 gap-2 text-slate-600 max-h-64 overflow-y-auto custom-scrollbar">
                        ${ingredients
                          .map(
                            (ing) =>
                              `<li class="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"><i data-lucide="check-circle-2" class="text-green-500" size="16"></i> ${ing}</li>`
                          )
                          .join("")}
                    </ul>
                </div>
                <div>
                    <h2 class="text-3xl font-extrabold text-slate-900 mb-6">${meal.strMeal}</h2>
                    <h5 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <i data-lucide="chef-hat" class="text-orange-500"></i> Instructions:
                    </h5>
                    <p class="text-slate-600 leading-relaxed whitespace-pre-line mb-8 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
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
};

if(closeModal) {
    closeModal.addEventListener("click", () => {
      recipeModal.classList.add("hidden");
      document.body.style.overflow = "auto";
    });
}

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    if(recipeModal) recipeModal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
});

// --- Extras (Stats, Features, Testimonials) ---

function highlightFeature(index) {
  const cards = document.querySelectorAll(".feature-card");
  const contents = document.querySelectorAll(".feature-highlight-content");
  
  if(!cards.length) return;

  cards.forEach((card, i) => {
    if (i === index) {
      card.classList.add("bg-orange-50", "border-orange-200");
      card.classList.remove("bg-slate-50", "border-slate-100");
    } else {
      card.classList.remove("bg-orange-50", "border-orange-200");
      card.classList.add("bg-slate-50", "border-slate-100");
    }
  });

  if(contents.length) {
      contents.forEach((content, i) => {
        if (i === index) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
  }
}

// Stats Counter
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
        if (target === 4.9) stat.innerText = "4.9";
      }
    };
    updateCount();
  });
};

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

// Testimonials
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

  const getScrollPosition = (index) => {
    if (!cards[index]) return 0;
    const cardWidth = cards[index].offsetWidth;
    const gap = 32; 
    return index * (cardWidth + gap);
  };

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

  const scrollToSlide = (index) => {
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

  testiPrev.addEventListener("click", () => {
    scrollToSlide(currentIndex - 1);
    resetAutoPlay();
  });

  testiNext.addEventListener("click", () => {
    scrollToSlide(currentIndex + 1);
    resetAutoPlay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      scrollToSlide(index);
      resetAutoPlay();
    });
  });

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

  testiCarousel.parentElement.addEventListener("mouseenter", stopAutoPlay);
  testiCarousel.parentElement.addEventListener("mouseleave", startAutoPlay);

  startAutoPlay();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      scrollToSlide(currentIndex);
    }, 200);
  });
}

// Reveal Animation on Scroll
const revealElements = document.querySelectorAll(".reveal");
if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.1,
    });
    
    revealElements.forEach((el) => revealObserver.observe(el));
}

// --- FAQ Logic ---
const faqData = [
    {
        question: "Is RecipeApp free to use?",
        answer: "Yes! RecipeApp is completely free for browsing recipes and saving your favorites. We also have a premium subscription for exclusive content.",
        category: "general"
    },
    {
        question: "How do I save a recipe?",
        answer: "Simply click the heart icon on any recipe card. You can view your saved recipes in the 'Popular Recipes' (Favorites) page.",
        category: "recipes"
    },
    {
        question: "Can I submit my own recipes?",
        answer: "Currently, recipe submission is open to verified chefs. You can apply to become a contributor in your account settings.",
        category: "account"
    },
    {
        question: "Where do you source your recipes?",
        answer: "Our recipes come from a curated community of professional chefs and culinary experts from around the world.",
        category: "general"
    },
    {
        question: "I have dietary restrictions. Can I filter recipes?",
        answer: "Yes, use the category buttons on the home page to filter by type (e.g., Vegan, Vegetarian). We are working on more specific allergen filters.",
        category: "recipes"
    },
    {
        question: "How do I reset my password?",
        answer: "Go to the login page and click 'Forgot Password'. Follow the instructions sent to your email.",
        category: "account"
    }
];

const faqList = document.getElementById("faq-list");
const faqSearch = document.getElementById("faq-search");
const faqCatBtns = document.querySelectorAll(".faq-cat-btn");

function renderFAQ(filter = "all", query = "") {
    if (!faqList) return;
    faqList.innerHTML = "";
    
    const filtered = faqData.filter(item => {
        const matchesCat = filter === "all" || item.category === filter;
        const matchesSearch = item.question.toLowerCase().includes(query.toLowerCase()) || 
                              item.answer.toLowerCase().includes(query.toLowerCase());
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        faqList.innerHTML = `<div class="text-center text-slate-500 py-8">No questions found matching your criteria.</div>`;
        return;
    }

    filtered.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-md";
        div.innerHTML = `
            <button class="faq-toggle w-full flex items-center justify-between p-6 text-left font-bold text-slate-900 hover:text-orange-600 transition focus:outline-none">
                <span>${item.question}</span>
                <i data-lucide="chevron-down" class="transform transition-transform duration-300"></i>
            </button>
            <div class="faq-content hidden px-6 pb-6 text-slate-600 leading-relaxed">
                ${item.answer}
            </div>
        `;
        
        // Toggle Logic
        const btn = div.querySelector(".faq-toggle");
        const content = div.querySelector(".faq-content");
        const icon = div.querySelector("i");
        
        btn.addEventListener("click", () => {
            const isOpen = !content.classList.contains("hidden");
            
            // Close all others (accordion style) - Optional, but nice
            document.querySelectorAll(".faq-content").forEach(c => c.classList.add("hidden"));
            document.querySelectorAll(".faq-toggle i").forEach(i => i.classList.remove("rotate-180"));
            
            if (!isOpen) {
                content.classList.remove("hidden");
                icon.classList.add("rotate-180");
            }
        });

        faqList.appendChild(div);
    });
    lucide.createIcons();
}

// Init FAQ
if (faqList) {
    renderFAQ();

    // Search Listener
    faqSearch.addEventListener("input", (e) => {
        const activeCat = document.querySelector(".faq-cat-btn.active").dataset.category;
        renderFAQ(activeCat, e.target.value);
    });

    // Category Listener
    faqCatBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            faqCatBtns.forEach(b => {
                b.classList.remove("active", "bg-orange-500", "text-white", "border-orange-500");
                b.classList.add("bg-white", "text-slate-600", "border-slate-200");
            });
            btn.classList.add("active", "bg-orange-500", "text-white", "border-orange-500");
            btn.classList.remove("bg-white", "text-slate-600", "border-slate-200");
            
            renderFAQ(btn.dataset.category, faqSearch.value);
        });
    });
}
