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
app.apiKey = "92cf896d674746e9b22c1a0c561637cd"; //gavynholt@gmail.com
// app.apiKey = "4cf2ce5f469347068595ffb2fdb1bde9"; //gholtdrums@gmail.com
// app.apiKey = "b3d56d5ae01547b1a1ab1a556e0974fb"; // sherryyyt@gmail.com

// Recipe Card Result Array
app.recipeObjectsArray = [];

app.getRecipe = (userInput) => {
  // Establish connection with API
  const url = new URL(app.apiUrl);
  url.search = new URLSearchParams({
    ingredients: userInput,
    number: 6,
    apiKey: app.apiKey,
    ranking: 2,
  });

  // returns a promise
  return fetch(url).then((res) => res.json());
};

// access API for more detailed recipe info, for use with Modal
app.getRecipeInfoByID = (id) => {
  const url = new URL(`https://api.spoonacular.com/recipes/${id}/information`);
  url.search = new URLSearchParams({
    apiKey: app.apiKey,
    includeNutrition: true,
  });

  // returns a promise
  return fetch(url).then((res) => res.json());
};

app.handleSearchForm = (e) => {
  e.preventDefault();
  // parse individual <li>'s into a CSV for the API
  const recipe = app.parseIngredientsToQuery();
  app
    .getRecipe(recipe)
    .then((data) => {
      if (data.length > 0) {
        app.recipeObjectsArray = data;
        app.displayRecipeCards(data);
      } else {
        throw new Error("No Results Found. Try some different ingredients?");
      }
    })
    .catch((error) => {
      const cardContainer = document.querySelector(".recipeResults");
      cardContainer.innerHTML = `<li>${error}</li>`;
    });
};

app.addIngredientToContainer = (e) => {
  e.preventDefault();
  const ingredientContainerUl = document.querySelector("#searchContainer ul");
  const inputField = e.target.querySelector("input");
  // create an array for possible multiple inputs, split by commas and trim each item of any whitespace
  const ingredientArray = inputField.value.split(",").map((item) => item.trim());
  for (ingredient of ingredientArray) {
    // if ingredient contains text, make an li with content
    if (ingredient != "") {
      const ingredientLiElement = document.createElement("li");
      ingredientLiElement.setAttribute("tabindex", 0);
      ingredientLiElement.innerText = ingredient;
      const deleteIngredientButton = document.createElement("span");
      deleteIngredientButton.classList.add("deleteButton");
      deleteIngredientButton.innerHTML = '<i class="far fa-times-circle"></i>';
      ingredientLiElement.append(deleteIngredientButton);
      ingredientContainerUl.appendChild(ingredientLiElement);
      // event listener for red delete button click
      deleteIngredientButton.addEventListener("click", app.removeLiElement);
      // event listener for DELETE keydown press to delete li
      ingredientLiElement.addEventListener("keydown", function (e) {
        if (e.key.toLowerCase() == "delete") {
          // if ul has a next sibling, move focus forward before deleting current li (? mark prevents error for case of single li)
          e.target.nextElementSibling?.focus();
          app.removeLiElement(e);
        }
      });
    }
  }
  // clear the input no matter what
  inputField.value = "";
};

// Function to remove ingredient when user clicks on ingredient li element
app.removeLiElement = (e) => {
  const liElement = e.target.closest("li");
  liElement.remove();
};

// ### Function to remove all ingredients from the query ST 7/14/2021
app.clearIngredientList = () => {
  const ul = document.querySelector("#searchContainer ul");
  ul.innerHTML = "";
};

// Function to parse ingredient li's to API readable CSV (Comma Separated Values)
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
  return searchQuery;
};

app.displayRecipeCards = (resultArray) => {
  const cardContainer = document.querySelector(".recipeResults");
  cardContainer.innerHTML = "";

  for (i = 0; i < resultArray.length; i++) {
    if (resultArray[i].usedIngredientCount > 0) {
      const parseIngredientNames = (ingredientName) => {
        const ingredientsArray = [];
        for ({ name } of resultArray[i][ingredientName]) {
          ingredientsArray.push(name);
        }
        return ingredientsArray.join(", ");
      };
      const usedIngredients = parseIngredientNames("usedIngredients");
      const missedIngredients = parseIngredientNames("missedIngredients");

      const recipeLiElement = document.createElement("li");
      recipeLiElement.innerHTML = `
        <img src="${resultArray[i].image}" alt="Recipe Card image for: ${resultArray[i].title}">
        <h3>${resultArray[i].title}</h3>
        <h4>Ingredients included from search:</h4> 
        <p>${usedIngredients}</p>
        <h4>Also needs:</h4> 
        <p>${missedIngredients}</p>
        <button class="openModal">Recipe</button>
      `;
      recipeLiElement.setAttribute("data-id", i);
      cardContainer.appendChild(recipeLiElement);
    }
  }

  // add event listeners to each button
  const openModalButtons = document.querySelectorAll(".openModal");
  for (button of openModalButtons) {
    button.addEventListener("click", app.displayModal);
  }
};

app.displayModal = async (e) => {
  const modalRoot = document.querySelector(".modalRoot");
  // get index to use with recipeObjectsArray
  const index = e.target.closest("li").dataset.id;
  // get recipe ID for a new API call
  const recipeID = app.recipeObjectsArray[index].id;

  // Make API call to retrieve detailed recipe info for Modal
  const recipeObj = await app.getRecipeInfoByID(recipeID);

  //create a ul of ingredient items for display under "Ingredients" heading
  const nutritionUlElement = document.createElement("ul");
  for ({ amount, unit, name } of recipeObj.nutrition.ingredients) {
    const nutritionLiElement = document.createElement("li");
    nutritionLiElement.textContent = `${amount}${unit} of ${name}`;
    nutritionUlElement.appendChild(nutritionLiElement);
  }

  // create a ul of selected nutrients only, displayed under "Nutrients at a Glance"
  const nutrientsUlElement = document.createElement("ul");
  const nutrientsArray = ["Calories", "Protein", "Fat", "Carbohydrates"];
  for ({ amount, unit, name } of recipeObj.nutrition.nutrients) {
    if (nutrientsArray.includes(name)) {
      const nutrientsLiElement = document.createElement("li");
      nutrientsLiElement.textContent = `${amount}${unit} of ${name}`;
      nutrientsUlElement.appendChild(nutrientsLiElement);
    }
  }

  // Function to convert mins to hours
  const convertMinutes = (readyInMinutes) => {
    if (readyInMinutes >= 60) {
      const hour = Math.floor(readyInMinutes / 60);
      const minute = readyInMinutes % 60;
      const hourString = hour > 1 ? "hours" : "hour";
      const minuteString = minute == 1 ? "minute" : "minutes";
      return `${hour} ${hourString} and ${minute} ${minuteString}`;
    } else {
      const minuteString = readyInMinutes == 1 ? "minute" : "minutes";
      return `${readyInMinutes} ${minuteString}`;
    }
  };
  const stringHoursMinutes = convertMinutes(recipeObj.readyInMinutes);

  modalRoot.innerHTML = `
    <div class="modal">
      <h2>${recipeObj.title}</h2>
      <img src=${recipeObj.image} alt="image for recipe: ${recipeObj.title}">
      <p>Time to make: ${stringHoursMinutes}</p>
      <p>Servings: ${recipeObj.servings}</p>
      <h3>Ingredients</h3>
      ${nutritionUlElement.outerHTML}
      <h3>Nutrients at a Glance</h3>
      ${nutrientsUlElement.outerHTML}
      <h3>Summary</h3>
      <p>${recipeObj.summary}</p>
      <h3>Instructions</h3>
      <p>${recipeObj.instructions}</p>
      <a href="${recipeObj.spoonacularSourceUrl}" target="_blank" class="noPrint">Click Here for link to full recipe</a>
      <button class="closeModal noPrint">Close</button>
      <button class="printModal noPrint">Print</button>
    </div>
  `;

  // cache some nodes after modal display
  const currentModal = modalRoot.querySelector(".modal");
  const closeModalButton = modalRoot.querySelector(".closeModal");
  const printButton = modalRoot.querySelector(".printModal");

  // set Modal position to current window scroll height
  currentModal.style.top = `${Math.round(window.scrollY)}px`;
  // add class to modalRoot to display
  modalRoot.classList.add("show");

  // Functions for Event Listeners
  const updateModalPosition = () => {
    const currentScrollPosition = Math.round(window.scrollY);
    const modalScrollPosition = parseInt(currentModal.style.top, 10);
    // if user scrolls up the page, move the modal with it
    if (currentScrollPosition < modalScrollPosition) {
      currentModal.style.top = `${currentScrollPosition}px`;
    }
  };

  const printRecipe = () => {
    newWin = window.open("");
    newWin.document.write('<head><link rel="stylesheet" href="./styles/styles.css" /></head>');
    newWin.document.write(modalRoot.outerHTML);
    newWin.print();
    newWin.close();
  };

  const clickOffToCloseModal = (e) => {
    if (e.target.closest(".modal") === null && e.target.closest(".openModal") === null) {
      closeModal();
    }
  };

  const ESCKeyToCloseModal = (e) => {
    if (e.key.toLowerCase() === "escape") {
      closeModal();
    }
  };

  const closeModal = () => {
    modalRoot.classList.remove("show");
    // remove event listeners (5)
    modalRoot.querySelector(".closeModal").removeEventListener("click", closeModal);
    document.removeEventListener("click", clickOffToCloseModal);
    document.removeEventListener("keydown", ESCKeyToCloseModal);
    printButton.removeEventListener("click", printRecipe);
    document.removeEventListener("scroll", updateModalPosition);
  };

  // Modal Event Listeners (5)
  // event listener to handle scrolling upwards for modals
  document.addEventListener("scroll", updateModalPosition);
  // event listener for print button
  printButton.addEventListener("click", printRecipe);
  // event listener for the closeModal button
  closeModalButton.addEventListener("click", closeModal);
  // event listener for clicking off the modal
  document.addEventListener("click", clickOffToCloseModal);
  // event listener for ESC Key
  document.addEventListener("keydown", ESCKeyToCloseModal);
};

// Init method that kicks everything off
app.init = () => {
  // event listener for add ingredient button
  const addButton = document.querySelector("#addIngredient");
  addButton.addEventListener("submit", app.addIngredientToContainer);

  // event listener to remove all ingredient li's
  const removeAllButton = document.querySelector("#searchContainer");
  removeAllButton.addEventListener("reset", app.clearIngredientList);

  // event listener to search for recipes
  const recipeSearch = document.querySelector("#searchContainer");
  recipeSearch.addEventListener("submit", app.handleSearchForm);

  // event listener for input field to listen for enter key
  const inputField = document.querySelector("#recipe");
  // used function() format instead of () => format to allow use of "this" to target input field
  inputField.addEventListener("keydown", function (e) {
    const ingredientLiCount = document.querySelector("#searchContainer ul").getElementsByTagName("li").length;
    // if enter is pressed and input field is empty and container has li's(ingredients), search for recipes
    if (e.key.toLowerCase() === "enter" && this.value == "" && ingredientLiCount > 0) {
      app.handleSearchForm(e);
    }
  });
};

// Calling init function
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
