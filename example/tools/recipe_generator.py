from typing import List
from pydantic import BaseModel, Field
import random

class RecipeRequest(BaseModel):
    cuisine: str = Field(
        default="any",
        description="The type of cuisine (italian, mexican, asian, etc.)",
    )
    dietary_restrictions: str = Field(
        default="none",
        description="Any dietary restrictions (vegetarian, vegan, gluten-free, etc.)",
    )

def recipe_generator(cuisine: str = "any", dietary_restrictions: str = "none") -> str:
    """
    Generate a random recipe based on cuisine type and dietary restrictions
    
    Args:
        cuisine (str): The type of cuisine requested
        dietary_restrictions (str): Any dietary restrictions to consider
        
    Returns:
        str: A complete recipe with ingredients and instructions
    """
    
    # Base recipes organized by cuisine
    recipes = {
        "italian": [
            {
                "name": "Classic Spaghetti Carbonara",
                "ingredients": [
                    "400g spaghetti",
                    "200g pancetta or bacon, diced",
                    "4 large eggs",
                    "100g Parmesan cheese, grated",
                    "Black pepper to taste",
                    "Salt for pasta water"
                ],
                "instructions": [
                    "Bring a large pot of salted water to boil and cook spaghetti according to package directions",
                    "While pasta cooks, fry pancetta in a large pan until crispy",
                    "In a bowl, whisk eggs with grated Parmesan and black pepper",
                    "Drain pasta, reserving 1 cup pasta water",
                    "Add hot pasta to pan with pancetta, remove from heat",
                    "Pour egg mixture over pasta, tossing quickly to create creamy sauce",
                    "Add pasta water as needed to achieve silky consistency",
                    "Serve immediately with extra Parmesan"
                ]
            },
            {
                "name": "Margherita Pizza",
                "ingredients": [
                    "1 pizza dough ball",
                    "200g crushed tomatoes",
                    "250g fresh mozzarella, sliced",
                    "Fresh basil leaves",
                    "2 cloves garlic, minced",
                    "Olive oil",
                    "Salt and pepper"
                ],
                "instructions": [
                    "Preheat oven to 475°F (245°C)",
                    "Roll out pizza dough on floured surface",
                    "Mix crushed tomatoes with minced garlic, salt, and pepper",
                    "Spread sauce evenly on dough, leaving border for crust",
                    "Add mozzarella slices evenly across pizza",
                    "Drizzle with olive oil",
                    "Bake for 12-15 minutes until crust is golden and cheese bubbles",
                    "Top with fresh basil leaves before serving"
                ]
            }
        ],
        "mexican": [
            {
                "name": "Chicken Tacos",
                "ingredients": [
                    "500g chicken thighs, boneless",
                    "8 corn tortillas",
                    "1 onion, diced",
                    "2 tomatoes, diced",
                    "1 avocado, sliced",
                    "Cilantro, chopped",
                    "Lime wedges",
                    "Cumin, chili powder, salt"
                ],
                "instructions": [
                    "Season chicken with cumin, chili powder, and salt",
                    "Cook chicken in hot skillet for 6-8 minutes per side until done",
                    "Rest chicken 5 minutes, then shred with forks",
                    "Warm tortillas in dry skillet or microwave",
                    "Fill tortillas with shredded chicken",
                    "Top with diced onion, tomatoes, and avocado",
                    "Garnish with cilantro and serve with lime wedges"
                ]
            }
        ],
        "asian": [
            {
                "name": "Vegetable Fried Rice",
                "ingredients": [
                    "3 cups cooked rice, preferably day-old",
                    "3 eggs, beaten",
                    "2 carrots, diced",
                    "1 cup frozen peas",
                    "3 green onions, chopped",
                    "3 cloves garlic, minced",
                    "2 tbsp soy sauce",
                    "1 tbsp sesame oil",
                    "Vegetable oil for cooking"
                ],
                "instructions": [
                    "Heat oil in large wok or skillet over high heat",
                    "Add beaten eggs, scramble and remove from pan",
                    "Add more oil, then garlic and carrots, stir-fry 2 minutes",
                    "Add rice, breaking up clumps with spatula",
                    "Add peas and cook until heated through",
                    "Return eggs to pan with soy sauce and sesame oil",
                    "Stir in green onions and serve immediately"
                ]
            }
        ]
    }
    
    # Default/any cuisine recipes
    default_recipes = [
        {
            "name": "Simple Green Salad",
            "ingredients": [
                "Mixed salad greens",
                "Cherry tomatoes, halved",
                "Cucumber, sliced",
                "Olive oil",
                "Lemon juice",
                "Salt and pepper"
            ],
            "instructions": [
                "Combine greens, tomatoes, and cucumber in large bowl",
                "Whisk olive oil and lemon juice with salt and pepper",
                "Toss salad with dressing just before serving"
            ]
        }
    ]
    
    # Select recipe based on cuisine
    if cuisine.lower() in recipes:
        selected_recipe = random.choice(recipes[cuisine.lower()])
    else:
        selected_recipe = random.choice(default_recipes)
    
    # Format the recipe output
    output = f"# {selected_recipe['name']}\n\n"
    output += "## Ingredients:\n"
    for ingredient in selected_recipe['ingredients']:
        output += f"- {ingredient}\n"
    
    output += "\n## Instructions:\n"
    for i, instruction in enumerate(selected_recipe['instructions'], 1):
        output += f"{i}. {instruction}\n"
    
    # Add dietary note if specified
    if dietary_restrictions != "none":
        output += f"\n*Note: This recipe can be adapted for {dietary_restrictions} dietary needs with appropriate substitutions.*"
    
    return output