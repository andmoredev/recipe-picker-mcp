/**
 * Static recipe data — the "database" for our MCP tools.
 *
 * In a real app this would come from DynamoDB or an API.
 * For the demo, hardcoded data means zero setup and zero cost.
 */

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  dietary: string[];          // e.g. ["vegetarian", "gluten-free"]
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
}

export const recipes: Recipe[] = [
  {
    id: "spaghetti-carbonara",
    name: "Spaghetti Carbonara",
    cuisine: "italian",
    dietary: [],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 4,
    description: "Classic Roman pasta with eggs, cheese, pancetta, and black pepper.",
    ingredients: [
      { name: "spaghetti", amount: "400", unit: "g" },
      { name: "pancetta", amount: "200", unit: "g" },
      { name: "egg yolks", amount: "6", unit: "large" },
      { name: "pecorino romano", amount: "100", unit: "g" },
      { name: "black pepper", amount: "2", unit: "tsp" },
    ],
    steps: [
      "Bring a large pot of salted water to boil and cook spaghetti until al dente.",
      "While pasta cooks, cut pancetta into small cubes and cook in a large skillet over medium heat until crispy.",
      "Whisk egg yolks with grated pecorino and plenty of black pepper in a bowl.",
      "Drain pasta, reserving 1 cup of pasta water.",
      "Toss hot pasta with pancetta (off heat), then quickly stir in the egg mixture, adding pasta water as needed to create a creamy sauce.",
      "Serve immediately with extra pecorino and black pepper.",
    ],
  },
  {
    id: "chicken-tikka-masala",
    name: "Chicken Tikka Masala",
    cuisine: "indian",
    dietary: ["gluten-free"],
    prepTimeMinutes: 30,
    cookTimeMinutes: 40,
    servings: 4,
    description: "Tender marinated chicken pieces in a rich, spiced tomato-cream sauce.",
    ingredients: [
      { name: "chicken breast", amount: "600", unit: "g" },
      { name: "yogurt", amount: "200", unit: "ml" },
      { name: "garam masala", amount: "2", unit: "tbsp" },
      { name: "canned tomatoes", amount: "400", unit: "g" },
      { name: "heavy cream", amount: "200", unit: "ml" },
      { name: "onion", amount: "2", unit: "medium" },
      { name: "garlic", amount: "4", unit: "cloves" },
      { name: "ginger", amount: "1", unit: "tbsp" },
      { name: "cumin", amount: "1", unit: "tsp" },
      { name: "turmeric", amount: "1", unit: "tsp" },
    ],
    steps: [
      "Cut chicken into bite-sized pieces and marinate in yogurt, half the garam masala, and salt for at least 30 minutes.",
      "Thread chicken onto skewers and grill or broil until charred and cooked through.",
      "Sauté diced onions until golden, then add minced garlic, ginger, cumin, and turmeric.",
      "Add canned tomatoes and simmer for 15 minutes until thickened.",
      "Stir in cream and remaining garam masala, then add the grilled chicken pieces.",
      "Simmer for 10 minutes and serve with basmati rice or naan.",
    ],
  },
  {
    id: "veggie-stir-fry",
    name: "Veggie Stir Fry",
    cuisine: "chinese",
    dietary: ["vegetarian", "vegan"],
    prepTimeMinutes: 15,
    cookTimeMinutes: 10,
    servings: 2,
    description: "Quick and colorful vegetable stir fry with a savory soy-ginger sauce.",
    ingredients: [
      { name: "broccoli", amount: "200", unit: "g" },
      { name: "bell pepper", amount: "2", unit: "medium" },
      { name: "snap peas", amount: "150", unit: "g" },
      { name: "carrots", amount: "2", unit: "medium" },
      { name: "soy sauce", amount: "3", unit: "tbsp" },
      { name: "sesame oil", amount: "1", unit: "tbsp" },
      { name: "ginger", amount: "1", unit: "tbsp" },
      { name: "garlic", amount: "3", unit: "cloves" },
      { name: "cornstarch", amount: "1", unit: "tsp" },
    ],
    steps: [
      "Cut all vegetables into bite-sized pieces.",
      "Mix soy sauce, sesame oil, minced ginger, minced garlic, and cornstarch into a sauce.",
      "Heat a wok or large skillet over high heat with a splash of oil.",
      "Add carrots and broccoli first (they take longest), stir fry for 2 minutes.",
      "Add bell peppers and snap peas, stir fry another 2 minutes.",
      "Pour sauce over vegetables, toss to coat, and cook 1 more minute until glossy.",
      "Serve over steamed rice or noodles.",
    ],
  },
  {
    id: "tacos-al-pastor",
    name: "Tacos al Pastor",
    cuisine: "mexican",
    dietary: [],
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    servings: 4,
    description: "Marinated pork tacos with pineapple, cilantro, and onion on corn tortillas.",
    ingredients: [
      { name: "pork shoulder", amount: "500", unit: "g" },
      { name: "pineapple", amount: "200", unit: "g" },
      { name: "corn tortillas", amount: "12", unit: "small" },
      { name: "onion", amount: "1", unit: "medium" },
      { name: "cilantro", amount: "1", unit: "bunch" },
      { name: "achiote paste", amount: "2", unit: "tbsp" },
      { name: "lime", amount: "3", unit: "whole" },
      { name: "guajillo chiles", amount: "3", unit: "dried" },
    ],
    steps: [
      "Blend achiote paste, rehydrated guajillo chiles, pineapple juice, and spices into a marinade.",
      "Slice pork thinly and marinate for at least 2 hours (overnight is best).",
      "Cook marinated pork on a hot griddle or skillet until charred at edges.",
      "Dice fresh pineapple and cook on the griddle until caramelized.",
      "Warm corn tortillas on the griddle.",
      "Assemble tacos with pork, grilled pineapple, diced onion, cilantro, and a squeeze of lime.",
    ],
  },
  {
    id: "margherita-pizza",
    name: "Margherita Pizza",
    cuisine: "italian",
    dietary: ["vegetarian"],
    prepTimeMinutes: 90,
    cookTimeMinutes: 12,
    servings: 2,
    description: "Simple Neapolitan pizza with San Marzano tomatoes, fresh mozzarella, and basil.",
    ingredients: [
      { name: "bread flour", amount: "300", unit: "g" },
      { name: "yeast", amount: "1", unit: "tsp" },
      { name: "San Marzano tomatoes", amount: "200", unit: "g" },
      { name: "fresh mozzarella", amount: "200", unit: "g" },
      { name: "fresh basil", amount: "10", unit: "leaves" },
      { name: "olive oil", amount: "2", unit: "tbsp" },
      { name: "salt", amount: "1", unit: "tsp" },
    ],
    steps: [
      "Mix flour, yeast, salt, and water to form a dough. Knead for 10 minutes.",
      "Let dough rise for at least 1 hour until doubled in size.",
      "Crush San Marzano tomatoes by hand with a pinch of salt for the sauce.",
      "Preheat oven to the highest setting (250°C/480°F) with a pizza stone or inverted baking sheet.",
      "Stretch dough into a thin round, spread tomato sauce, and top with torn mozzarella.",
      "Bake for 10-12 minutes until crust is charred and cheese is bubbling.",
      "Top with fresh basil leaves and a drizzle of olive oil before serving.",
    ],
  },
  {
    id: "thai-green-curry",
    name: "Thai Green Curry",
    cuisine: "thai",
    dietary: ["gluten-free"],
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    servings: 4,
    description: "Aromatic coconut curry with green curry paste, vegetables, and your choice of protein.",
    ingredients: [
      { name: "coconut milk", amount: "400", unit: "ml" },
      { name: "green curry paste", amount: "3", unit: "tbsp" },
      { name: "chicken thigh", amount: "400", unit: "g" },
      { name: "bamboo shoots", amount: "100", unit: "g" },
      { name: "Thai basil", amount: "1", unit: "cup" },
      { name: "fish sauce", amount: "2", unit: "tbsp" },
      { name: "palm sugar", amount: "1", unit: "tbsp" },
      { name: "Thai eggplant", amount: "4", unit: "whole" },
      { name: "kaffir lime leaves", amount: "4", unit: "leaves" },
    ],
    steps: [
      "Heat a splash of coconut milk in a wok until oil separates.",
      "Fry green curry paste in the coconut oil for 1-2 minutes until fragrant.",
      "Add sliced chicken and cook until sealed on the outside.",
      "Pour in remaining coconut milk, fish sauce, and palm sugar.",
      "Add quartered Thai eggplant and bamboo shoots, simmer for 15 minutes.",
      "Tear in kaffir lime leaves and Thai basil just before serving.",
      "Serve over jasmine rice.",
    ],
  },
];
