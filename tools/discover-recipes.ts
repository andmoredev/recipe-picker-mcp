/**
 * Tool: discover-recipes
 *
 * Filters the recipe catalog by cuisine and/or dietary preferences.
 * Returns a summary list (not full details) — keeps responses small
 * and lets the LLM decide which recipe to drill into.
 */

import { recipes } from "./data/recipes.js";

export interface DiscoverRecipesInput {
  cuisine?: string;    // e.g. "italian", "mexican"
  dietary?: string;    // e.g. "vegetarian", "gluten-free"
  maxResults?: number; // limit results, defaults to 5
}

export interface RecipeSummary {
  id: string;
  name: string;
  cuisine: string;
  dietary: string[];
  totalTimeMinutes: number;
  description: string;
}

export function discoverRecipes(input: DiscoverRecipesInput): RecipeSummary[] {
  const { cuisine, dietary, maxResults = 5 } = input;

  let results = recipes;

  // Filter by cuisine (case-insensitive)
  if (cuisine) {
    const cuisineLower = cuisine.toLowerCase();
    results = results.filter((r) => r.cuisine.toLowerCase() === cuisineLower);
  }

  // Filter by dietary preference (recipe must include the tag)
  if (dietary) {
    const dietaryLower = dietary.toLowerCase();
    results = results.filter((r) =>
      r.dietary.some((d) => d.toLowerCase() === dietaryLower)
    );
  }

  // Map to summary (don't expose full ingredients/steps here)
  return results.slice(0, maxResults).map((r) => ({
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    dietary: r.dietary,
    totalTimeMinutes: r.prepTimeMinutes + r.cookTimeMinutes,
    description: r.description,
  }));
}
