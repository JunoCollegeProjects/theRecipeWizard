// Create namespaced object
const app = {};
app.apiUrl = 'https://api.spoonacular.com/recipes/findByIngredients';
// app.apiKey = "92cf896d674746e9b22c1a0c561637cd";
// app.apiKey = "4cf2ce5f469347068595ffb2fdb1bde9";
app.apiKey = 'b3d56d5ae01547b1a1ab1a556e0974fb';

// Recipe Card Result Array
app.recipeObjectsArray = [];

// Function to access API for general recipe card information
app.getRecipe = (userInput) => {
  // Establish connection with API
  const url = new URL(app.apiUrl);
  url.search = new URLSearchParams({
    ingredients: userInput,
    number: 6,
    apiKey: app.apiKey,
    ranking: 2,
  });

  return fetch(url).then((res) => res.json());
};

// Function to access API for more detailed recipe info, for use with Modal
app.getRecipeInfoByID = (id) => {
  const url = new URL(`https://api.spoonacular.com/recipes/${id}/information`);
  url.search = new URLSearchParams({
    apiKey: app.apiKey,
    includeNutrition: true,
  });

  return fetch(url).then((res) => res.json());
};

// Function to handle form submission, catching any errors
app.handleSearchForm = (e) => {
  e.preventDefault();
  // Parse individual li's into a CSV for the API
  const recipe = app.parseIngredientsToQuery();
  app
    .getRecipe(recipe)
    .then((data) => {
      if (data.length > 0) {
        app.recipeObjectsArray = data;
        app.displayRecipeCards(data);
      } else {
        throw new Error('No Results Found. Try some different ingredients?');
      }
    })
    .catch((error) => {
      console.log(error);
      const cardContainer = document.querySelector('.recipeResults');
      cardContainer.innerHTML = `<li>${error}</li>`;
    });
};

// Function to add an ingredient li to the search container ul to prepare for search
app.addIngredientToContainer = (e) => {
  e.preventDefault();
  const ingredientContainerUl = document.querySelector('.searchContainer ul');
  const inputField = e.target.querySelector('input');
  // Create an array for possible multiple inputs, split by commas and trim each item of any whitespace
  const ingredientArray = inputField.value.split(',').map((item) => item.trim());
  for (ingredient of ingredientArray) {
    // If ingredient contains text, make an li with content
    if (ingredient != '') {
      const ingredientLiElement = document.createElement('li');
      ingredientLiElement.setAttribute('tabindex', 0);
      ingredientLiElement.innerText = ingredient;
      const deleteIngredientButton = document.createElement('span');
      deleteIngredientButton.classList.add('deleteButton');
      deleteIngredientButton.innerHTML = `<i class="far fa-times-circle" aria-label="Delete Ingredient: ${ingredient}"></i>`;
      ingredientLiElement.append(deleteIngredientButton);
      ingredientContainerUl.appendChild(ingredientLiElement);
      // Event listener for red delete button click
      deleteIngredientButton.addEventListener('click', app.removeLiElement);
      // Event listener for DELETE keydown press to delete li
      ingredientLiElement.addEventListener('keydown', function (e) {
        if (e.key.toLowerCase() == 'delete') {
          // If ul has a next sibling, move focus forward before deleting current li (? mark prevents error for case of single li)
          e.target.nextElementSibling?.focus();
          app.removeLiElement(e);
        }
      });
    }
  }
  // Clear the input no matter what
  inputField.value = '';
};

// Function to remove ingredient when user clicks on ingredient li element
app.removeLiElement = (e) => {
  const liElement = e.target.closest('li');
  liElement.remove();
};

// Function to remove all ingredients from the query
app.clearIngredientList = () => {
  const ul = document.querySelector('.searchContainer ul');
  ul.innerHTML = '';
};

// Function to parse ingredient li's to API readable CSV (Comma Separated Values)
app.parseIngredientsToQuery = () => {
  // Grabs search parameters in the form of an array
  const searchParams = document.querySelectorAll('.searchContainer ul li');
  let searchQuery = '';
  for (i = 0; i < searchParams.length; i++) {
    searchQuery += searchParams[i].textContent;
    if (i < searchParams.length - 1) {
      searchQuery += ',';
    }
  }
  return searchQuery;
};

// Function to display recipe card after API data is received
app.displayRecipeCards = (resultArray) => {
  const cardContainer = document.querySelector('.recipeResults');
  cardContainer.innerHTML = '';

  for (i = 0; i < resultArray.length; i++) {
    if (resultArray[i].usedIngredientCount > 0) {
      const parseIngredientNames = (ingredientName) => {
        const ingredientsArray = [];
        for ({ name } of resultArray[i][ingredientName]) {
          ingredientsArray.push(name);
        }
        return ingredientsArray.join(', ');
      };
      const usedIngredients = parseIngredientNames('usedIngredients');
      const missedIngredients = parseIngredientNames('missedIngredients');

      const recipeLiElement = document.createElement('li');
      recipeLiElement.innerHTML = `
        <div class="recipeLiContainer">
          <img src="${resultArray[i].image}" alt="Recipe Card image for: ${resultArray[i].title}">
          <h3>${resultArray[i].title}</h3>
          <h4>Ingredients included from search:</h4> 
          <p>${usedIngredients}</p>
          <h4>Also needs:</h4> 
          <p>${missedIngredients}</p>
          <button class="openModal">Recipe</button>
        </div>
      `;
      recipeLiElement.setAttribute('data-id', i);
      cardContainer.appendChild(recipeLiElement);
    }
  }

  // Add event listeners to each "Recipe" button
  const openModalButtons = document.querySelectorAll('.openModal');
  for (button of openModalButtons) {
    button.addEventListener('click', app.displayModal);
  }
};

// Function to open a Modal and display recipe in greater detail
app.displayModal = async (e) => {
  const modalRoot = document.querySelector('.modalRoot');
  // Get index to use with recipeObjectsArray
  const index = e.target.closest('li').dataset.id;
  // Get recipe ID for a new API call
  const recipeID = app.recipeObjectsArray[index].id;

  // Make API call to retrieve detailed recipe info for Modal
  const recipeObj = await app.getRecipeInfoByID(recipeID);

  // Create a ul of ingredient items for display under "Ingredients" heading
  const nutritionUlElement = document.createElement('ul');
  for ({ amount, unit, name } of recipeObj.nutrition.ingredients) {
    const nutritionLiElement = document.createElement('li');
    nutritionLiElement.textContent = `${amount}${unit} of ${name}`;
    nutritionUlElement.appendChild(nutritionLiElement);
  }

  // Create a ul of selected nutrients only, displayed under "Nutrients at a Glance"
  const nutrientsUlElement = document.createElement('ul');
  const nutrientsArray = ['Calories', 'Protein', 'Fat', 'Carbohydrates'];
  for ({ amount, unit, name } of recipeObj.nutrition.nutrients) {
    if (nutrientsArray.includes(name)) {
      const nutrientsLiElement = document.createElement('li');
      nutrientsLiElement.textContent = `${amount}${unit} of ${name}`;
      nutrientsUlElement.appendChild(nutrientsLiElement);
    }
  }

  // Function to convert mins to hours
  const convertMinutes = (readyInMinutes) => {
    if (readyInMinutes >= 60) {
      const hour = Math.floor(readyInMinutes / 60);
      const minute = readyInMinutes % 60;
      const hourString = hour > 1 ? 'hours' : 'hour';
      const minuteString = minute == 1 ? 'minute' : 'minutes';
      return `${hour} ${hourString} and ${minute} ${minuteString}`;
    } else {
      const minuteString = readyInMinutes == 1 ? 'minute' : 'minutes';
      return `${readyInMinutes} ${minuteString}`;
    }
  };
  const stringHoursMinutes = convertMinutes(recipeObj.readyInMinutes);

  // Create modal element, and populate HTML with above info
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.innerHTML = `
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
  `;
  modalRoot.appendChild(modal);

  // Cache some HTML elements after modal display for event listener use
  const currentModal = modalRoot.querySelector('.modal');
  const closeModalButton = modalRoot.querySelector('.closeModal');
  const printButton = modalRoot.querySelector('.printModal');

  // Set Modal position to current window scroll height
  currentModal.style.top = `${Math.round(window.scrollY)}px`;

  // Functions for Event Listeners (5)
  const updateModalPosition = () => {
    const currentScrollPosition = Math.round(window.scrollY);
    const modalScrollPosition = parseInt(currentModal.style.top, 10);
    // If user scrolls up the page, move the modal with it
    if (currentScrollPosition < modalScrollPosition) {
      currentModal.style.top = `${currentScrollPosition}px`;
    }
  };

  const printRecipe = () => {
    newWin = window.open('');
    newWin.document.write('<head><link rel="stylesheet" href="./styles/styles.css" /></head>');
    newWin.document.write(modalRoot.outerHTML);
    newWin.print();
    newWin.close();
  };

  const clickOffToCloseModal = (e) => {
    if (e.target.closest('.modal') === null && e.target.closest('.openModal') === null) {
      closeModal();
    }
  };

  const ESCKeyToCloseModal = (e) => {
    if (e.key.toLowerCase() === 'escape') {
      closeModal();
    }
  };

  const closeModal = () => {
    modal.remove();
    // Remove event listeners (5)
    closeModalButton.removeEventListener('click', closeModal);
    document.removeEventListener('click', clickOffToCloseModal);
    document.removeEventListener('keydown', ESCKeyToCloseModal);
    printButton.removeEventListener('click', printRecipe);
    document.removeEventListener('scroll', updateModalPosition);
  };

  // Modal Event Listeners (5)
  // Event listener to handle scrolling upwards for modals
  document.addEventListener('scroll', updateModalPosition);
  // Event listener for print button
  printButton.addEventListener('click', printRecipe);
  // Event listener for the closeModal button
  closeModalButton.addEventListener('click', closeModal);
  // Event listener for clicking off the modal
  document.addEventListener('click', clickOffToCloseModal);
  // Event listener for ESC Key
  document.addEventListener('keydown', ESCKeyToCloseModal);
};

// Init method that kicks everything off
app.init = () => {
  // Event listener for add ingredient button
  const addButton = document.querySelector('.addIngredient');
  addButton.addEventListener('submit', app.addIngredientToContainer);

  // Event listener to remove all ingredient li's
  const removeAllButton = document.querySelector('.searchContainer');
  removeAllButton.addEventListener('reset', app.clearIngredientList);

  // Event listener to search for recipes
  const recipeSearch = document.querySelector('.searchContainer');
  recipeSearch.addEventListener('submit', app.handleSearchForm);

  // Event listener for input field to listen for ENTER key
  const inputField = document.querySelector('#recipe');

  // Used function() format instead of () => format to allow use of "this" to target input field
  inputField.addEventListener('keydown', function (e) {
    const ingredientLiCount = document.querySelector('.searchContainer ul').getElementsByTagName('li').length;
    // If enter is pressed and input field is empty and container has li's (ingredients), search for recipes
    if (e.key.toLowerCase() === 'enter' && this.value == '' && ingredientLiCount > 0) {
      app.handleSearchForm(e);
    }
  });
};

// Calling init function
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
