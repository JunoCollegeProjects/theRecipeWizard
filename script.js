// === PSEUDO CODE ===
// User types ingredients one at a time, pressing ENTER in between.
// Ingredients are added to an "ingredient pool".
// When user presses submit, send data with API call.
// API will return recipes as an array.
// Loop through array and for each item, generate html for a recipe card and attach to DOM.
// When user clicks on card, open up recipe in a modal.
// When user presses the close button, the modal closes.
// Return no results found

// Create namespaced object
const app = {};
app.apiUrl = "https://api.spoonacular.com/recipes/findByIngredients";
app.apiKey = "92cf896d674746e9b22c1a0c561637cd";

app.getRecipe = userInput => {
  // Establish connection with API
  const url = new URL(app.apiUrl);
  url.search = new URLSearchParams({
    ingredients: userInput,
    number: 6,
    apiKey: app.apiKey,
    ranking: 2,
  });

  // returns a promise
  return fetch(url).then(res => res.json());
};

app.addIngredientToContainer = e => {
  e.preventDefault();
  const ingredientContainerUl = document.querySelector("#searchContainer ul");
  const ingredientLiElement = document.createElement("li");
  const inputField = e.target.querySelector("input");
  const ingredient = inputField.value;
  ingredientLiElement.textContent = ingredient;
  ingredientContainerUl.appendChild(ingredientLiElement);
  inputField.value = "";
};

app.parseIngredientsToQuery = () => {
  // Grabs search parameters in the form of an array
  const searchParams = document.querySelectorAll("#searchContainer ul li");
  let searchQuery = "";
  for (i = 0; i < searchParams.length; i++) {
    searchQuery += searchParams[i].textContent;
    if (i < searchParams.length - 1) {
      searchQuery += ",";
    }
  }
  console.log(searchQuery);
};

app.displayRecipeCards = resultArray => {
  const cardContainer = document.querySelector(".recipeResults");
  cardContainer.innerHTML = "";
  for (item of resultArray) {
    const recipeLiElement = document.createElement("li");
    recipeLiElement.innerHTML = `
      <img src=${item.image} alt="test alt">
      <h3>${item.title}</h3>
      <button class="openModal">Recipe</button>
    `;
    cardContainer.appendChild(recipeLiElement);
  }
  // add event listeners to each button
  const openModalButtons = document.querySelectorAll(".openModal");
  console.log(openModalButtons);
  for (button of openModalButtons) {
    button.addEventListener("click", app.displayModal);
  }
};

app.displayModal = () => {
  const modalRoot = document.querySelector(".modalRoot");
  console.log("button clicked");
  modalRoot.innerHTML = `
    <div class="modal">
      <h2> Test Modal, Yo! </h2>
      <p>This is a test of the emergency broadcast system</p>
      <button class="closeModal">Close</button>
    </div>
  `;
  // add class to modalRoot to display
  modalRoot.classList.add("show");
  // target modal, and add an event listener for the closeModal button
  const closeModalButton = modalRoot.querySelector(".closeModal");
  closeModalButton.addEventListener("click", app.closeModal);
};

app.closeModal = () => {
  const modalRoot = document.querySelector(".modalRoot");
  modalRoot.classList.add("show");
  modalRoot.innerHTML = "";
};

// Init method that kicks everything off
app.init = () => {
  console.log("Woohoo initialized!");
  const recipeSearch = document.querySelector("#searchContainer");

  const addButton = document.querySelector("#addIngredient");
  addButton.addEventListener("submit", app.addIngredientToContainer);

  recipeSearch.addEventListener("submit", e => {
    e.preventDefault();
    const recipe = document.querySelector("#recipe").value.trim();
    app.getRecipe(recipe).then(data => {
      console.log(data);
      app.parseIngredientsToQuery();
      app.displayRecipeCards(data);
    });
  });
};

// Calling init function
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
