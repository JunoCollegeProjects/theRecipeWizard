// === PSEUDO CODE ===
// User types ingredients one at a time, pressing ENTER in between.
// Ingredients are added to an "ingredient container".
// When user presses submit, send data with API call.
// API will return recipes as an array.
// Return error if no results found
// Loop through array and for each item, generate html for a recipe card and attach to DOM.
// When user clicks on card, open up recipe in a modal.
// When user presses the close button, the modal closes.

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
  const inputField = e.target.querySelector("input");
  // create an array for possible multiple inputs, split by commas and trim each item of any whitespace
  const ingredientArray = inputField.value.split(",").map(item => item.trim());
  console.log(ingredientArray);
  for (ingredient of ingredientArray) {
    if (ingredient != "") {
      console.log(ingredient);
      const ingredientLiElement = document.createElement("li");
      ingredientLiElement.innerText = ingredient;
      const deleteIngredientButton = document.createElement("span");
      deleteIngredientButton.classList.add("deleteButton");
      deleteIngredientButton.innerHTML = '<i class="far fa-times-circle"></i>';
      ingredientLiElement.append(deleteIngredientButton);
      ingredientContainerUl.appendChild(ingredientLiElement);
      deleteIngredientButton.addEventListener("click", app.removeLiElement);
    }
  }
  // clear the input no matter what
  inputField.value = "";
};

// Function to remove ingredient when user clicks on ingredient li element
app.removeLiElement = e => {
  const liElement = e.target.closest("li");
  liElement.remove();
};

// ### Function to remove all ingredients from the query ST 7/14/2021
app.clearIngredientList = () => {
  const ul = document.querySelector("#searchContainer ul")
  ul.innerHTML = "";
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
  return searchQuery;
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

app.displayModal = e => {
  const modalRoot = document.querySelector(".modalRoot");

  modalRoot.innerHTML = `
    <div class="modal">
      <h2> Test Modal, Yo! </h2>
      <p>This is a test of the emergency broadcast system</p>
      <button class="closeModal">Close</button>
    </div>
  `;
  // add class to modalRoot to display
  modalRoot.classList.add("show");

  // event listener for the closeModal button
  const closeModalButton = modalRoot.querySelector(".closeModal");
  closeModalButton.addEventListener("click", app.closeModal);
  // event listener for clicking off the modal
  const currentModal = modalRoot.querySelector(".modal");
  document.addEventListener("click", app.clickOffToCloseModal);
  // event listener for ESC Key
  document.addEventListener("keydown", app.ESCKeyToCloseModal);
};

app.clickOffToCloseModal = e => {
  if (e.target.closest(".modal") === null && e.target.closest(".openModal") === null) {
    app.closeModal();
  }
};

app.ESCKeyToCloseModal = e => {
  console.log(e);
  if (e.key.toLowerCase() === "escape") {
    app.closeModal();
  }
};

app.closeModal = () => {
  const modalRoot = document.querySelector(".modalRoot");
  modalRoot.classList.remove("show");
  // remove event listeners (3)
  modalRoot.querySelector(".closeModal").removeEventListener("click", app.closeModal);
  document.removeEventListener("click", app.clickOffToCloseModal);
  document.removeEventListener("keydown", app.ESCKeyToCloseModal);
};

// Init method that kicks everything off
app.init = () => {
  const recipeSearch = document.querySelector("#searchContainer");

  const addButton = document.querySelector("#addIngredient");
  addButton.addEventListener("submit", app.addIngredientToContainer);

  // ### ST NEW 7/14/2021
  const removeAllButton = document.querySelector("#searchContainer");
  removeAllButton.addEventListener("reset", app.clearIngredientList);

  recipeSearch.addEventListener("submit", e => {
    e.preventDefault();
    const recipe = app.parseIngredientsToQuery();
    app
      .getRecipe(recipe)
      .then(data => {
        if (data.length > 0) {
          console.log(data);
          app.displayRecipeCards(data);
        } else {
          throw new Error("No Results Found. Try some different ingredients?");
        }
      })
      .catch(error => {
        const cardContainer = document.querySelector(".recipeResults");
        cardContainer.innerHTML = `<li>${error}</li>`;
        console.log(error);
      });
  });
};

// Calling init function
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
