/**
 * Tool: get-recipe-details
 *
 * Given a recipe ID (from discover-recipes), returns the full recipe
 * including ingredients and step-by-step instructions.
 */

import { recipes, type Recipe } from "./data/recipes.js";

export interface GetRecipeDetailsInput {
  recipeId: string;
}

export interface RecipeDetails {
  found: boolean;
  recipe?: Recipe;
  error?: string;
}

export function getRecipeDetails(input: GetRecipeDetailsInput): RecipeDetails {
  const { recipeId } = input;

  const recipe = recipes.find((r) => r.id === recipeId);

  if (!recipe) {
    return {
      found: false,
      error: `Recipe "${recipeId}" not found. Use discover-recipes to browse available recipes.`,
    };
  }

  return { found: true, recipe };
}
