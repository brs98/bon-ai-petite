import { type GroceryCategory, type Ingredient } from '@/types/recipe';

/**
 * Interface for a consolidated ingredient with additional shopping list properties
 */
export interface ConsolidatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
  checked: boolean;
  originalIngredients?: Ingredient[]; // Track source ingredients for debugging
}

/**
 * Interface for unit conversion rules
 */
interface UnitConversion {
  from: string;
  to: string;
  factor: number;
}

/**
 * Service for consolidating and organizing recipe ingredients for shopping lists
 */
export class IngredientConsolidatorService {
  private readonly unitMappings: Record<string, string> = {
    // Volume units
    cups: 'cup',
    c: 'cup',
    cup: 'cup',
    tablespoons: 'tbsp',
    tablespoon: 'tbsp',
    tbsp: 'tbsp',
    tbs: 'tbsp',
    teaspoons: 'tsp',
    teaspoon: 'tsp',
    tsp: 'tsp',
    milliliters: 'ml',
    milliliter: 'ml',
    ml: 'ml',
    liters: 'l',
    liter: 'l',
    l: 'l',
    'fluid ounces': 'fl oz',
    'fluid ounce': 'fl oz',
    'fl oz': 'fl oz',
    pints: 'pt',
    pint: 'pt',
    pt: 'pt',
    quarts: 'qt',
    quart: 'qt',
    qt: 'qt',
    gallons: 'gal',
    gallon: 'gal',
    gal: 'gal',

    // Weight units
    pounds: 'lb',
    pound: 'lb',
    lb: 'lb',
    lbs: 'lb',
    ounces: 'oz',
    ounce: 'oz',
    oz: 'oz',
    grams: 'g',
    gram: 'g',
    g: 'g',
    kilograms: 'kg',
    kilogram: 'kg',
    kg: 'kg',

    // Count units
    pieces: 'piece',
    piece: 'piece',
    pcs: 'piece',
    pc: 'piece',
    items: 'item',
    item: 'item',
    cloves: 'clove',
    clove: 'clove',
    slices: 'slice',
    slice: 'slice',
    strips: 'strip',
    strip: 'strip',
    sprigs: 'sprig',
    sprig: 'sprig',
    leaves: 'leaf',
    leaf: 'leaf',
    stalks: 'stalk',
    stalk: 'stalk',
    heads: 'head',
    head: 'head',
    bunches: 'bunch',
    bunch: 'bunch',

    // Special units
    pinches: 'pinch',
    pinch: 'pinch',
    dashes: 'dash',
    dash: 'dash',
    drops: 'drop',
    drop: 'drop',
    whole: 'whole',
    halves: 'half',
    half: 'half',
    quarters: 'quarter',
    quarter: 'quarter',
  };

  private readonly unitConversions: UnitConversion[] = [
    // Volume conversions (to ml as base)
    { from: 'tsp', to: 'ml', factor: 4.92892 },
    { from: 'tbsp', to: 'ml', factor: 14.7868 },
    { from: 'cup', to: 'ml', factor: 236.588 },
    { from: 'fl oz', to: 'ml', factor: 29.5735 },
    { from: 'pt', to: 'ml', factor: 473.176 },
    { from: 'qt', to: 'ml', factor: 946.353 },
    { from: 'gal', to: 'ml', factor: 3785.41 },
    { from: 'l', to: 'ml', factor: 1000 },

    // Weight conversions (to g as base)
    { from: 'oz', to: 'g', factor: 28.3495 },
    { from: 'lb', to: 'g', factor: 453.592 },
    { from: 'kg', to: 'g', factor: 1000 },
  ];

  private readonly groceryCategories: Record<string, string[]> = {
    // Produce
    produce: [
      'apple',
      'apples',
      'banana',
      'bananas',
      'orange',
      'oranges',
      'lemon',
      'lemons',
      'lime',
      'limes',
      'avocado',
      'avocados',
      'tomato',
      'tomatoes',
      'onion',
      'onions',
      'garlic',
      'carrot',
      'carrots',
      'celery',
      'lettuce',
      'spinach',
      'kale',
      'arugula',
      'cabbage',
      'broccoli',
      'cauliflower',
      'bell pepper',
      'bell peppers',
      'jalapeño',
      'jalapeños',
      'cucumber',
      'cucumbers',
      'zucchini',
      'potato',
      'potatoes',
      'sweet potato',
      'sweet potatoes',
      'mushroom',
      'mushrooms',
      'herbs',
      'basil',
      'parsley',
      'cilantro',
      'oregano',
      'thyme',
      'rosemary',
      'sage',
      'mint',
      'ginger',
      'fresh ginger',
      'green onions',
      'scallions',
      'shallots',
      'leeks',
      'radish',
      'radishes',
      'turnip',
      'turnips',
      'beets',
      'asparagus',
      'green beans',
      'peas',
      'corn',
      'eggplant',
      'squash',
      'pumpkin',
      'berries',
      'strawberries',
      'blueberries',
    ],

    // Dairy
    dairy: [
      'milk',
      'whole milk',
      'skim milk',
      '2% milk',
      'almond milk',
      'soy milk',
      'oat milk',
      'cream',
      'heavy cream',
      'half and half',
      'sour cream',
      'buttermilk',
      'cheese',
      'cheddar cheese',
      'mozzarella cheese',
      'parmesan cheese',
      'swiss cheese',
      'feta cheese',
      'goat cheese',
      'cream cheese',
      'cottage cheese',
      'ricotta cheese',
      'butter',
      'unsalted butter',
      'salted butter',
      'margarine',
      'yogurt',
      'greek yogurt',
      'plain yogurt',
      'vanilla yogurt',
      'eggs',
      'egg',
      'egg whites',
      'egg yolks',
    ],

    // Meat
    meat: [
      'beef',
      'ground beef',
      'steak',
      'beef roast',
      'beef stew meat',
      'beef brisket',
      'pork',
      'ground pork',
      'pork chops',
      'pork tenderloin',
      'pork shoulder',
      'pork ribs',
      'lamb',
      'ground lamb',
      'lamb chops',
      'leg of lamb',
      'bacon',
      'pancetta',
      'prosciutto',
      'ham',
      'sausage',
      'chorizo',
      'bratwurst',
      'hot dogs',
      'deli meat',
      'salami',
      'pepperoni',
    ],

    // Poultry
    poultry: [
      'chicken',
      'chicken breast',
      'chicken thighs',
      'chicken wings',
      'whole chicken',
      'ground chicken',
      'chicken tenders',
      'rotisserie chicken',
      'turkey',
      'ground turkey',
      'turkey breast',
      'turkey thighs',
      'duck',
      'duck breast',
      'cornish hen',
    ],

    // Seafood
    seafood: [
      'fish',
      'salmon',
      'tuna',
      'cod',
      'halibut',
      'tilapia',
      'mahi mahi',
      'sea bass',
      'trout',
      'mackerel',
      'sardines',
      'anchovies',
      'canned tuna',
      'canned salmon',
      'shrimp',
      'prawns',
      'crab',
      'crab meat',
      'lobster',
      'scallops',
      'mussels',
      'clams',
      'oysters',
      'calamari',
      'squid',
      'octopus',
    ],

    // Bakery
    bakery: [
      'bread',
      'white bread',
      'whole wheat bread',
      'sourdough bread',
      'rye bread',
      'bagels',
      'english muffins',
      'croissants',
      'muffins',
      'dinner rolls',
      'hamburger buns',
      'hot dog buns',
      'pita bread',
      'naan',
      'tortillas',
      'pie crust',
      'pizza dough',
      'breadcrumbs',
      'croutons',
    ],

    // Frozen
    frozen: [
      'frozen',
      'ice cream',
      'frozen yogurt',
      'sorbet',
      'frozen vegetables',
      'frozen fruits',
      'frozen berries',
      'frozen meals',
      'frozen pizza',
      'frozen fish',
      'frozen shrimp',
      'frozen chicken',
      'ice',
      'ice cubes',
    ],

    // Spices
    spices: [
      'salt',
      'black pepper',
      'white pepper',
      'red pepper flakes',
      'cayenne pepper',
      'paprika',
      'cumin',
      'coriander',
      'turmeric',
      'curry powder',
      'garam masala',
      'cinnamon',
      'nutmeg',
      'allspice',
      'cloves',
      'cardamom',
      'star anise',
      'bay leaves',
      'dried oregano',
      'dried thyme',
      'dried basil',
      'dried rosemary',
      'garlic powder',
      'onion powder',
      'chili powder',
      'smoked paprika',
      'vanilla extract',
      'almond extract',
      'baking powder',
      'baking soda',
      'yeast',
      'active dry yeast',
      'instant yeast',
    ],

    // Beverages
    beverages: [
      'water',
      'sparkling water',
      'juice',
      'orange juice',
      'apple juice',
      'cranberry juice',
      'coffee',
      'ground coffee',
      'coffee beans',
      'instant coffee',
      'tea',
      'green tea',
      'black tea',
      'herbal tea',
      'soda',
      'cola',
      'ginger ale',
      'beer',
      'wine',
      'white wine',
      'red wine',
      'cooking wine',
      'vinegar',
      'balsamic vinegar',
      'apple cider vinegar',
      'white vinegar',
      'rice vinegar',
    ],

    // Pantry (default category for dry goods, oils, condiments, etc.)
    pantry: [
      'flour',
      'all-purpose flour',
      'whole wheat flour',
      'bread flour',
      'cake flour',
      'sugar',
      'brown sugar',
      'powdered sugar',
      'honey',
      'maple syrup',
      'molasses',
      'rice',
      'white rice',
      'brown rice',
      'jasmine rice',
      'basmati rice',
      'wild rice',
      'pasta',
      'spaghetti',
      'penne',
      'fusilli',
      'linguine',
      'macaroni',
      'lasagna noodles',
      'quinoa',
      'barley',
      'oats',
      'rolled oats',
      'steel cut oats',
      'bulgur',
      'couscous',
      'beans',
      'black beans',
      'kidney beans',
      'chickpeas',
      'lentils',
      'split peas',
      'canned beans',
      'canned tomatoes',
      'tomato paste',
      'tomato sauce',
      'tomato puree',
      'olive oil',
      'vegetable oil',
      'canola oil',
      'coconut oil',
      'sesame oil',
      'soy sauce',
      'worcestershire sauce',
      'hot sauce',
      'ketchup',
      'mustard',
      'mayonnaise',
      'ranch dressing',
      'italian dressing',
      'balsamic dressing',
      'nuts',
      'almonds',
      'walnuts',
      'pecans',
      'cashews',
      'peanuts',
      'pine nuts',
      'seeds',
      'sesame seeds',
      'sunflower seeds',
      'pumpkin seeds',
      'chia seeds',
      'dried fruits',
      'raisins',
      'dates',
      'cranberries',
      'apricots',
      'coconut',
      'shredded coconut',
      'coconut milk',
      'coconut cream',
      'broth',
      'chicken broth',
      'beef broth',
      'vegetable broth',
      'stock',
    ],
  };

  /**
   * Consolidate ingredients from multiple recipes into a shopping list
   */
  consolidateIngredients(
    ingredientLists: Ingredient[][],
  ): ConsolidatedIngredient[] {
    const allIngredients = ingredientLists.flat();
    return this.consolidateIngredientArray(allIngredients);
  }

  /**
   * Consolidate a single array of ingredients
   */
  consolidateIngredientArray(
    ingredients: Ingredient[],
  ): ConsolidatedIngredient[] {
    const consolidationMap = new Map<string, ConsolidatedIngredient>();

    for (const ingredient of ingredients) {
      const normalized = this.normalizeIngredient(ingredient);
      const key = this.createConsolidationKey(normalized.name, normalized.unit);

      if (consolidationMap.has(key)) {
        const existing = consolidationMap.get(key)!;
        existing.quantity += normalized.quantity;
        existing.originalIngredients?.push(ingredient);
      } else {
        consolidationMap.set(key, {
          name: normalized.name,
          quantity: normalized.quantity,
          unit: normalized.unit,
          category: this.categorizeIngredient(normalized.name),
          checked: false,
          originalIngredients: [ingredient],
        });
      }
    }

    // Convert map to array and sort by name
    return Array.from(consolidationMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  /**
   * Organize consolidated ingredients by grocery category
   */
  organizeByCategory(
    consolidatedIngredients: ConsolidatedIngredient[],
  ): Record<GroceryCategory, ConsolidatedIngredient[]> {
    const organized: Record<GroceryCategory, ConsolidatedIngredient[]> = {
      produce: [],
      dairy: [],
      meat: [],
      poultry: [],
      seafood: [],
      bakery: [],
      deli: [],
      frozen: [],
      pantry: [],
      spices: [],
      beverages: [],
      snacks: [],
      health: [],
      other: [],
    };

    for (const ingredient of consolidatedIngredients) {
      organized[ingredient.category].push(ingredient);
    }

    // Sort ingredients within each category
    for (const category in organized) {
      organized[category as GroceryCategory].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }

    return organized;
  }

  /**
   * Normalize ingredient name, quantity, and unit
   */
  private normalizeIngredient(ingredient: Ingredient): {
    name: string;
    quantity: number;
    unit: string;
  } {
    const normalizedName = this.normalizeIngredientName(ingredient.name);
    const normalizedUnit = this.normalizeUnit(ingredient.unit);

    // Try to convert to common unit if possible
    const convertedIngredient = this.tryUnitConversion({
      ...ingredient,
      name: normalizedName,
      unit: normalizedUnit,
    });

    return convertedIngredient;
  }

  /**
   * Normalize ingredient name by removing extra spaces and standardizing case
   */
  private normalizeIngredientName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/,$/, '') // Remove trailing comma
      .replace(/\(.*?\)/g, '') // Remove parenthetical notes
      .trim();
  }

  /**
   * Normalize unit names using mapping table
   */
  private normalizeUnit(unit: string): string {
    const normalized = unit.toLowerCase().trim();
    return this.unitMappings[normalized] || normalized;
  }

  /**
   * Try to convert ingredients to common units for better consolidation
   */
  private tryUnitConversion(ingredient: {
    name: string;
    quantity: number;
    unit: string;
  }): { name: string; quantity: number; unit: string } {
    // Find applicable conversion
    const conversion = this.unitConversions.find(
      c => c.from === ingredient.unit,
    );

    if (conversion) {
      // Check if another ingredient with the same name uses the target unit
      // This is a simplified approach - in practice, you might want to check
      // against a database of existing ingredients
      return {
        name: ingredient.name,
        quantity: ingredient.quantity * conversion.factor,
        unit: conversion.to,
      };
    }

    return ingredient;
  }

  /**
   * Create a key for ingredient consolidation based on name and unit
   */
  private createConsolidationKey(name: string, unit: string): string {
    return `${name}|${unit}`;
  }

  /**
   * Categorize ingredient into grocery store category
   */
  private categorizeIngredient(ingredientName: string): GroceryCategory {
    const name = ingredientName.toLowerCase();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(this.groceryCategories)) {
      for (const keyword of keywords) {
        if (name.includes(keyword)) {
          return category as GroceryCategory;
        }
      }
    }

    // Check for additional patterns not in the main categories
    if (this.isDeli(name)) return 'deli';
    if (this.isSnack(name)) return 'snacks';
    if (this.isHealth(name)) return 'health';

    // Default to pantry for unrecognized items
    return 'pantry';
  }

  /**
   * Check if ingredient belongs to deli category
   */
  private isDeli(name: string): boolean {
    const deliKeywords = [
      'sliced',
      'deli',
      'sandwich meat',
      'lunch meat',
      'cold cuts',
      'smoked',
      'cured',
      'prepared salads',
      'hummus',
      'guacamole',
    ];
    return deliKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if ingredient belongs to snacks category
   */
  private isSnack(name: string): boolean {
    const snackKeywords = [
      'chips',
      'crackers',
      'cookies',
      'candy',
      'chocolate',
      'granola bars',
      'trail mix',
      'popcorn',
      'pretzels',
      'nuts',
      'dried fruit',
    ];
    return snackKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if ingredient belongs to health category
   */
  private isHealth(name: string): boolean {
    const healthKeywords = [
      'protein powder',
      'vitamins',
      'supplements',
      'probiotics',
      'organic',
      'gluten-free',
      'sugar-free',
      'low-sodium',
    ];
    return healthKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Calculate shopping list statistics
   */
  calculateShoppingListStats(
    consolidatedIngredients: ConsolidatedIngredient[],
  ): {
    totalItems: number;
    checkedItems: number;
    itemsByCategory: Record<GroceryCategory, number>;
    completionPercentage: number;
  } {
    const totalItems = consolidatedIngredients.length;
    const checkedItems = consolidatedIngredients.filter(
      item => item.checked,
    ).length;
    const organized = this.organizeByCategory(consolidatedIngredients);

    const itemsByCategory: Record<GroceryCategory, number> = {
      produce: organized.produce.length,
      dairy: organized.dairy.length,
      meat: organized.meat.length,
      poultry: organized.poultry.length,
      seafood: organized.seafood.length,
      bakery: organized.bakery.length,
      deli: organized.deli.length,
      frozen: organized.frozen.length,
      pantry: organized.pantry.length,
      spices: organized.spices.length,
      beverages: organized.beverages.length,
      snacks: organized.snacks.length,
      health: organized.health.length,
      other: organized.other.length,
    };

    const completionPercentage =
      totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

    return {
      totalItems,
      checkedItems,
      itemsByCategory,
      completionPercentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Format quantity for display (remove unnecessary decimals)
   */
  formatQuantity(quantity: number): string {
    // If it's a whole number, don't show decimals
    if (quantity % 1 === 0) {
      return quantity.toString();
    }

    // For fractions, show up to 2 decimal places
    return quantity.toFixed(2).replace(/\.?0+$/, '');
  }

  /**
   * Convert ingredient back to display format
   */
  formatIngredientForDisplay(ingredient: ConsolidatedIngredient): string {
    const quantity = this.formatQuantity(ingredient.quantity);
    return `${quantity} ${ingredient.unit} ${ingredient.name}`;
  }
}

// Export singleton instance
export const ingredientConsolidatorService =
  new IngredientConsolidatorService();
