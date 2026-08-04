/**
 * Tool: get-grocery-list
 *
 * Given one or more recipe IDs, aggregates all ingredients into
 * a deduplicated grocery list. Groups by ingredient name so if
 * two recipes both need garlic, you see it listed once with combined amounts.
 */

import { recipes } from "./data/recipes.js";

export interface GetGroceryListInput {
  recipeIds: string[];
}

export interface GroceryItem {
  name: string;
  amounts: string[];  // e.g. ["3 cloves", "4 cloves"] — kept separate since units may differ
}

export interface GroceryListResult {
  items: GroceryItem[];
  recipesIncluded: string[];
  recipesNotFound: string[];
}

export function getGroceryList(input: GetGroceryListInput): GroceryListResult {
  const { recipeIds } = input;

  const recipesIncluded: string[] = [];
  const recipesNotFound: string[] = [];

  // Map: ingredient name → list of "amount unit" strings
  const groceryMap = new Map<string, string[]>();

  for (const id of recipeIds) {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) {
      recipesNotFound.push(id);
      continue;
    }

    recipesIncluded.push(recipe.name);

    for (const ingredient of recipe.ingredients) {
      const key = ingredient.name.toLowerCase();
      const amountStr = `${ingredient.amount} ${ingredient.unit}`;

      if (!groceryMap.has(key)) {
        groceryMap.set(key, []);
      }
      groceryMap.get(key)!.push(amountStr);
    }
  }

  // Convert map to sorted array
  const items: GroceryItem[] = Array.from(groceryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, amounts]) => ({ name, amounts }));

  return { items, recipesIncluded, recipesNotFound };
}
