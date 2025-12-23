// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const recipeGrid = document.getElementById('recipe-grid');
const loading = document.getElementById('loading');
const notFound = document.getElementById('not-found');
const scrollBtn = document.getElementById('scroll-to-top');
const resultTitle = document.getElementById('result-title');
const categoryBtns = document.querySelectorAll('.cat-btn');
const recipeModal = document.getElementById('recipe-modal');
const modalContent = document.getElementById('modal-content');
const closeModal = document.getElementById('close-modal');
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

// Initial Load
window.onload = () => {
    fetchRecipes('chicken'); // Default search
    lucide.createIcons();
};

// Mobile Menu Toggle
menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    // Optional: Toggle icon between menu and x
    const icon = mobileMenu.classList.contains('hidden') ? 'menu' : 'x';
    menuBtn.innerHTML = `<i data-lucide="${icon}" size="28"></i>`;
    lucide.createIcons();
});

// Scroll Logic
window.onscroll = () => {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        scrollBtn.style.display = "block";
    } else {
        scrollBtn.style.display = "none";
    }
};

scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Search Functionality
const handleSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
        fetchRecipes(query);
    }
};

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Category Filter Functionality
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        categoryBtns.forEach(b => b.classList.remove('bg-orange-500', 'text-white'));
        btn.classList.add('bg-orange-500', 'text-white');
        
        if (cat === 'all') {
            fetchRecipes('egg');
        } else {
            fetchRecipes(cat);
        }
    });
});

// Fetch Recipes from API
async function fetchRecipes() {
    recipeGrid.innerHTML = '';
    loading.classList.remove('hidden');
    notFound.classList.add('hidden');
    resultTitle.innerText = `Results for ""...`;

    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=`);
        const data = await response.json();
        
        loading.classList.add('hidden');

        if (data.meals) {
            displayRecipes(data.meals);
        } else {
            notFound.classList.remove('hidden');
        }
    } catch (error) {
        console.error("API Fetch Error:", error);
        loading.classList.add('hidden');
    }
}

// Display Recipe Cards
function displayRecipes(meals) {
    meals.forEach(meal => {
        const description = meal.strInstructions ? meal.strInstructions.substring(0, 100) + "..." : "No description available.";
        
        const card = document.createElement('div');
        card.className = "recipe-card bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer";
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

// Open Recipe Details in Modal
async function openDetails(id) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await response.json();
        const meal = data.meals[0];

        // Get Ingredients
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) {
                ingredients.push(`${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}`);
            }
        }

        modalContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 lg:p-10">
                <div>
                    <img src="${meal.strMealThumb}" class="w-full rounded-2xl shadow-lg mb-6" alt="${meal.strMeal}">
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-bold">${meal.strCategory}</span>
                        <span class="bg-slate-100 text-slate-700 px-4 py-1 rounded-full text-sm font-bold">${meal.strArea}</span>
                    </div>
                    <h5 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <i data-lucide="list-checks" class="text-orange-500"></i> Ingredients:
                    </h5>
                    <ul class="grid grid-cols-1 gap-2 text-slate-600">
                        ${ingredients.map(ing => `<li class="flex items-center gap-2 bg-slate-50 p-2 rounded-lg"><i data-lucide="check-circle-2" class="text-green-500" size="16"></i> ${ing}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h2 class="text-3xl font-extrabold text-slate-900 mb-6">${meal.strMeal}</h2>
                    <h5 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <i data-lucide="chef-hat" class="text-orange-500"></i> Instructions:
                    </h5>
                    <p class="text-slate-600 leading-relaxed whitespace-pre-line mb-8">
                        ${meal.strInstructions}
                    </p>
                    ${meal.strYoutube ? `
                        <a href="${meal.strYoutube}" target="_blank" class="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition shadow-lg">
                            <i data-lucide="youtube"></i> Watch Video Tutorial
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
        
        recipeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        lucide.createIcons();
    } catch (error) {
        console.error("Detail Fetch Error:", error);
    }
}

// Close Modal
closeModal.addEventListener('click', () => {
    recipeModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        recipeModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
});