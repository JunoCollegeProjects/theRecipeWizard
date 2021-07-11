// === PSEUDO CODE ===
// User types ingredients one at a time, pressing ENTER in between.
// Ingredients are added to an "ingredient pool".
// When user presses submit, send data with API call.
// API will return recipes as an array.
// Loop through array and for each item, generate html for a recipe card and attach to DOM.
// When user clicks on card, open up recipe in a modal.
// When user presses the close button, the modal closes.

// Create namespaced object
const app = {};
app.apiUrl = "https://api.spoonacular.com/recipes/findByIngredients";
app.apiKey = "92cf896d674746e9b22c1a0c561637cd";

app.getRecipe = function (userInput) {
  // Establish connection with API
  const url = new URL(app.apiUrl);
  url.search = new URLSearchParams({
    ingredients: userInput,
    number: 6,
    apiKey: app.apiKey,
  });

  // returns a promise
  return fetch(url).then(res => res.json());
};

app.displayRecipeCards = () => {};

// Init method that kicks everything off
app.init = () => {
  console.log("Woohoo initialized!");
  const recipeSearch = document.querySelector("#recipeSearch");
  recipeSearch.addEventListener("submit", e => {
    e.preventDefault();
    const recipe = document.querySelector("#recipe").value.trim();
    app.getRecipe(recipe).then(data => {
      console.log(data);
    });
  });
};

// Calling init function
document.addEventListener("DOMContentLoaded", function () {
  app.init();
});