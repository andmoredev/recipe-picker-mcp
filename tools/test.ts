/**
 * Local test script — verifies tool logic without deploying.
 *
 * Run with: npm test
 */

import { discoverRecipes } from "./discover-recipes.js";
import { getRecipeDetails } from "./get-recipe-details.js";
import { getGroceryList } from "./get-grocery-list.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
  }
}

// --- discover_recipes ---
console.log("\n🔍 discover_recipes");

const italian = discoverRecipes({ cuisine: "italian" });
assert(italian.length === 2, "finds 2 italian recipes");
assert(italian.every((r) => r.cuisine === "italian"), "all results are italian");

const vegetarian = discoverRecipes({ dietary: "vegetarian" });
assert(vegetarian.length === 2, "finds 2 vegetarian recipes");
assert(
  vegetarian.every((r) => r.dietary.includes("vegetarian")),
  "all results have vegetarian tag"
);

const all = discoverRecipes({});
assert(all.length === 5, "returns max 5 by default");

const limited = discoverRecipes({ maxResults: 2 });
assert(limited.length === 2, "respects maxResults limit");

// --- get_recipe_details ---
console.log("\n📖 get_recipe_details");

const carbonara = getRecipeDetails({ recipeId: "spaghetti-carbonara" });
assert(carbonara.found === true, "finds spaghetti-carbonara");
assert(carbonara.recipe?.ingredients.length === 5, "has 5 ingredients");
assert(carbonara.recipe?.steps.length === 6, "has 6 steps");

const notFound = getRecipeDetails({ recipeId: "does-not-exist" });
assert(notFound.found === false, "returns found=false for unknown ID");
assert(notFound.error !== undefined, "includes error message for unknown ID");

// --- get_grocery_list ---
console.log("\n🛒 get_grocery_list");

const singleRecipe = getGroceryList({ recipeIds: ["spaghetti-carbonara"] });
assert(singleRecipe.items.length === 5, "single recipe has 5 items");
assert(singleRecipe.recipesIncluded.length === 1, "tracks 1 included recipe");
assert(singleRecipe.recipesNotFound.length === 0, "no recipes not found");

const multiRecipe = getGroceryList({
  recipeIds: ["spaghetti-carbonara", "margherita-pizza"],
});
assert(multiRecipe.items.length === 12, "2 recipes produce 12 unique ingredients");
assert(multiRecipe.recipesIncluded.length === 2, "tracks 2 included recipes");

const withMissing = getGroceryList({
  recipeIds: ["spaghetti-carbonara", "fake-recipe"],
});
assert(withMissing.recipesNotFound.length === 1, "tracks 1 not-found recipe");
assert(
  withMissing.recipesNotFound[0] === "fake-recipe",
  "identifies the missing recipe ID"
);

// --- Summary ---
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
