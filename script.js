const apiKey = "92cf896d674746e9b22c1a0c561637cd";

const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
url.search = new URLSearchParams({
  query: "pasta",
  addRecipeInformation: true,
  apiKey: apiKey,
});

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log(data);
  });
