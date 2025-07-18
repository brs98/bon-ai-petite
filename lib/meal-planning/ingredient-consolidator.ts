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
      'mixed greens',
      'mixed vegetables',
      'mixed berries',
      'cherry tomatoes',
      'bell pepper',
      'bell peppers',
      'cucumber sticks',
      'carrot sticks',
      'celery sticks',
      'basil leaves',
      'basil pesto',
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
      'can of tomatoes',
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
   * Consolidate a single array of ingredients with improved unit conversion
   */
  consolidateIngredientArray(
    ingredients: Ingredient[],
  ): ConsolidatedIngredient[] {
    // First pass: normalize all ingredients
    const normalizedIngredients = ingredients.map(ingredient => 
      this.normalizeIngredient(ingredient)
    );

    // Group ingredients by name to handle unit conversions
    const ingredientsByName = new Map<string, Array<{
      name: string;
      quantity: number;
      unit: string;
      originalIngredient: Ingredient;
    }>>();

    for (let i = 0; i < normalizedIngredients.length; i++) {
      const normalized = normalizedIngredients[i];
      const original = ingredients[i];
      const name = normalized.name.toLowerCase().trim();
      
      // Try to find a similar existing group with improved logic
      const existingGroup = this.findSimilarIngredientGroup(ingredientsByName, name);
      const groupKey = existingGroup || name;
      
      if (!ingredientsByName.has(groupKey)) {
        ingredientsByName.set(groupKey, []);
      }
      ingredientsByName.get(groupKey)!.push({
        ...normalized,
        originalIngredient: original,
      });
    }

    // Second pass: consolidate each group with smart unit selection
    const consolidated: ConsolidatedIngredient[] = [];

    for (const [ingredientName, ingredientGroup] of ingredientsByName) {
      if (ingredientGroup.length === 1) {
        // Single ingredient, no consolidation needed
        const ingredient = ingredientGroup[0];
        consolidated.push({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: this.categorizeIngredient(ingredient.name),
          checked: false,
          originalIngredients: [ingredient.originalIngredient],
        });
        continue;
      }

      // Multiple ingredients with same name, need to consolidate
      const consolidatedGroup = this.consolidateIngredientGroup(ingredientGroup);
      consolidated.push(...consolidatedGroup); // Flatten the array of consolidated groups
    }

    // Sort by name
    return consolidated.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Consolidate a group of ingredients with the same name but potentially different units
   */
  private consolidateIngredientGroup(
    ingredientGroup: Array<{
      name: string;
      quantity: number;
      unit: string;
      originalIngredient: Ingredient;
    }>,
  ): ConsolidatedIngredient[] {
    // Group by unit first
    const byUnit = new Map<string, Array<{
      name: string;
      quantity: number;
      unit: string;
      originalIngredient: Ingredient;
    }>>();

    for (const ingredient of ingredientGroup) {
      if (!byUnit.has(ingredient.unit)) {
        byUnit.set(ingredient.unit, []);
      }
      byUnit.get(ingredient.unit)!.push(ingredient);
    }

    // If all ingredients have the same unit, simple consolidation
    if (byUnit.size === 1) {
      const unit = Array.from(byUnit.keys())[0];
      const ingredients = byUnit.get(unit)!;
      const totalQuantity = ingredients.reduce((sum, i) => sum + i.quantity, 0);
      
      return [{
        name: ingredients[0].name,
        quantity: totalQuantity,
        unit,
        category: this.categorizeIngredient(ingredients[0].name),
        checked: false,
        originalIngredients: ingredients.map(i => i.originalIngredient),
      }];
    }

    // Different units - try to convert and consolidate
    const targetUnit = this.selectBestTargetUnit(ingredientGroup);
    const convertedIngredients: Array<{
      quantity: number;
      originalIngredient: Ingredient;
      success: boolean;
    }> = [];

    for (const ingredient of ingredientGroup) {
      const convertedQuantity = this.convertToUnit(
        ingredient.quantity,
        ingredient.unit,
        targetUnit,
        ingredient.name // Pass ingredient name for context-aware conversion
      );
      
      if (convertedQuantity !== null) {
        convertedIngredients.push({
          quantity: convertedQuantity,
          originalIngredient: ingredient.originalIngredient,
          success: true,
        });
      } else {
        // Conversion failed, keep original
        convertedIngredients.push({
          quantity: ingredient.quantity,
          originalIngredient: ingredient.originalIngredient,
          success: false,
        });
      }
    }

    // Check if all conversions were successful
    const allSuccessful = convertedIngredients.every(i => i.success);
    
    if (allSuccessful) {
      // All ingredients can be converted to the same unit
      const totalQuantity = convertedIngredients.reduce((sum, i) => sum + i.quantity, 0);
      
      return [{
        name: ingredientGroup[0].name,
        quantity: totalQuantity,
        unit: targetUnit,
        category: this.categorizeIngredient(ingredientGroup[0].name),
        checked: false,
        originalIngredients: convertedIngredients.map(i => i.originalIngredient),
      }];
    } else {
      // Some conversions failed, keep separate entries by unit
      const result: ConsolidatedIngredient[] = [];
      
      for (const [unit, ingredients] of byUnit) {
        const totalQuantity = ingredients.reduce((sum, i) => sum + i.quantity, 0);
        
        result.push({
          name: ingredients[0].name,
          quantity: totalQuantity,
          unit,
          category: this.categorizeIngredient(ingredients[0].name),
          checked: false,
          originalIngredients: ingredients.map(i => i.originalIngredient),
        });
      }
      
      return result;
    }
  }

  /**
   * Select the best target unit for consolidation based on the ingredient group
   */
  private selectBestTargetUnit(
    ingredientGroup: Array<{
      name: string;
      quantity: number;
      unit: string;
      originalIngredient: Ingredient;
    }>,
  ): string {
    // Count units by frequency
    const unitCounts = new Map<string, number>();
    for (const ingredient of ingredientGroup) {
      unitCounts.set(ingredient.unit, (unitCounts.get(ingredient.unit) || 0) + 1);
    }

    // Get the ingredient name for context
    const ingredientName = ingredientGroup[0].name.toLowerCase();

    // Check if this ingredient has specific unit preferences
    const preferredUnit = this.getPreferredUnitForIngredient(ingredientName);
    if (preferredUnit && unitCounts.has(preferredUnit)) {
      return preferredUnit;
    }

    // If one unit is used more frequently, prefer it
    const mostFrequentUnit = Array.from(unitCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];

    // For volume units, prefer larger units (cup > tbsp > tsp)
    // For weight units, prefer smaller units (g > oz > lb)
    const volumeUnits = ['tsp', 'tbsp', 'cup', 'ml', 'l', 'fl oz'];
    const weightUnits = ['g', 'kg', 'oz', 'lb'];
    
    const volumeOrder = ['tsp', 'tbsp', 'cup', 'ml', 'l', 'fl oz'];
    const weightOrder = ['g', 'oz', 'lb', 'kg'];

    // Check if all units are volume or all are weight
    const allUnits = Array.from(unitCounts.keys());
    const allVolume = allUnits.every(unit => volumeUnits.includes(unit));
    const allWeight = allUnits.every(unit => weightUnits.includes(unit));

    // Only convert if all units are of the same type (all volume or all weight)
    if (allVolume) {
      // For volume, prefer the largest unit that's commonly used
      for (let i = volumeOrder.length - 1; i >= 0; i--) {
        const unit = volumeOrder[i];
        if (unitCounts.has(unit)) {
          return unit;
        }
      }
    } else if (allWeight) {
      // For weight, prefer the smallest unit that's commonly used
      for (const unit of weightOrder) {
        if (unitCounts.has(unit)) {
          return unit;
        }
      }
    }

    // If units are mixed types (e.g., some volume, some weight, some count),
    // don't convert - just use the most frequent unit
    return mostFrequentUnit;
  }

  /**
   * Get the preferred unit for a specific ingredient based on common usage
   */
  private getPreferredUnitForIngredient(ingredientName: string): string | null {
    // Solid foods that should never be converted to liquid units
    const solidFoods = [
      'broccoli', 'carrot', 'celery', 'cucumber', 'quinoa', 'rice', 'pasta',
      'bread', 'croutons', 'cheese', 'parmesan', 'mozzarella', 'cheddar',
      'chicken', 'turkey', 'beef', 'pork', 'salmon', 'fish', 'shrimp',
      'egg', 'eggs', 'garlic', 'onion', 'tomato', 'bell pepper', 'asparagus',
      'lettuce', 'spinach', 'kale', 'basil', 'parsley', 'cilantro', 'ginger',
      'salt', 'pepper', 'chili powder', 'red pepper flakes', 'cumin',
      'oregano', 'thyme', 'rosemary', 'cinnamon', 'nutmeg', 'paprika',
      'turmeric', 'cardamom', 'black pepper', 'white pepper', 'cayenne',
      'garlic powder', 'onion powder', 'italian seasoning', 'herbs',
      'mixed vegetables', 'mixed berries', 'berries', 'strawberries',
      'blueberries', 'raspberries', 'blackberries'
    ];

    // Check if this is a solid food
    for (const solidFood of solidFoods) {
      if (ingredientName.includes(solidFood)) {
        // For solid foods, prefer count units or weight units, never liquid
        return null; // Let the system use the most frequent unit without conversion
      }
    }

    // Liquid foods that can be converted to volume units
    const liquidFoods = [
      'oil', 'olive oil', 'vegetable oil', 'sesame oil', 'coconut oil',
      'sauce', 'alfredo sauce', 'tomato sauce', 'marinara sauce',
      'dressing', 'caesar dressing', 'vinaigrette', 'ranch dressing',
      'juice', 'lemon juice', 'lime juice', 'orange juice',
      'milk', 'cream', 'yogurt', 'greek yogurt',
      'broth', 'stock', 'chicken broth', 'beef broth', 'vegetable broth',
      'water', 'vinegar', 'balsamic', 'soy sauce', 'honey', 'syrup',
      'glaze', 'balsamic glaze'
    ];

    // Check if this is a liquid food
    for (const liquidFood of liquidFoods) {
      if (ingredientName.includes(liquidFood)) {
        // For liquids, prefer volume units
        return 'tbsp'; // Default to tablespoons for most liquids
      }
    }

    return null; // No specific preference
  }

  /**
   * Convert quantity from one unit to another
   */
  private convertToUnit(
    quantity: number,
    fromUnit: string,
    toUnit: string,
    ingredientName: string = '', // Added ingredientName for context-aware conversion
  ): number | null {
    // If units are the same, no conversion needed
    if (fromUnit === toUnit) {
      return quantity;
    }

    // Don't convert between different unit types (volume vs weight vs count)
    const volumeUnits = ['tsp', 'tbsp', 'cup', 'ml', 'l', 'fl oz'];
    const weightUnits = ['g', 'kg', 'oz', 'lb'];
    const countUnits = ['piece', 'slice', 'clove', 'leaf', 'bunch', 'can', 'large', 'medium', 'small'];

    const fromIsVolume = volumeUnits.includes(fromUnit);
    const toIsVolume = volumeUnits.includes(toUnit);
    const fromIsWeight = weightUnits.includes(fromUnit);
    const toIsWeight = weightUnits.includes(toUnit);
    const fromIsCount = countUnits.includes(fromUnit);
    const toIsCount = countUnits.includes(toUnit);

    // Special cases where we can convert between unit types
    const specialConversions = [
      // Bell pepper: cup to piece (approximate)
      { from: 'cup', to: 'piece', factor: 0.5, ingredient: 'bell pepper' },
      { from: 'piece', to: 'cup', factor: 2, ingredient: 'bell pepper' },
      
      // Mozzarella: various forms conversion
      { from: 'cup', to: 'slice', factor: 4, ingredient: 'mozzarella' }, // 1 cup shredded = ~4 slices
      { from: 'slice', to: 'cup', factor: 0.25, ingredient: 'mozzarella' }, // 1 slice = ~1/4 cup shredded
      { from: 'piece', to: 'cup', factor: 0.1, ingredient: 'mozzarella' }, // 1 ball ≈ 0.1 cup shredded
      { from: 'cup', to: 'piece', factor: 10, ingredient: 'mozzarella' }, // 1 cup shredded ≈ 10 balls
      { from: 'piece', to: 'slice', factor: 0.4, ingredient: 'mozzarella' }, // 1 ball ≈ 0.4 slices
      { from: 'slice', to: 'piece', factor: 2.5, ingredient: 'mozzarella' }, // 1 slice ≈ 2.5 balls
      
      // Cucumber: piece to cup (approximate)
      { from: 'piece', to: 'cup', factor: 1, ingredient: 'cucumber' },
      { from: 'cup', to: 'piece', factor: 1, ingredient: 'cucumber' },
      
      // Regular tomato conversions (only within same form)
      { from: 'medium', to: 'piece', factor: 1, ingredient: 'tomato' }, // medium = piece
      { from: 'piece', to: 'medium', factor: 1, ingredient: 'tomato' }, // piece = medium
      
      // Cherry tomato conversions (separate from regular tomatoes)
      { from: 'piece', to: 'cup', factor: 0.0625, ingredient: 'cherry tomato' }, // 1 cherry tomato ≈ 1/16 cup
      { from: 'cup', to: 'piece', factor: 16, ingredient: 'cherry tomato' }, // 1 cup ≈ 16 cherry tomatoes
    ];

    // Check for special conversions first
    for (const conversion of specialConversions) {
      if (conversion.from === fromUnit && conversion.to === toUnit && 
          ingredientName.toLowerCase().includes(conversion.ingredient)) {
        // Special handling for tomato types to avoid cross-contamination
        if (conversion.ingredient === 'tomato' && ingredientName.toLowerCase().includes('cherry')) {
          // Skip regular tomato conversions for cherry tomatoes
          continue;
        }
        if (conversion.ingredient === 'cherry tomato' && !ingredientName.toLowerCase().includes('cherry')) {
          // Skip cherry tomato conversions for regular tomatoes
          continue;
        }
        if (conversion.ingredient === 'tomato' && ingredientName.toLowerCase().includes('can of tomatoes')) {
          // Skip regular tomato conversions for canned tomatoes
          continue;
        }
        return quantity * conversion.factor;
      }
    }

    // Don't convert between different unit types unless it's a special case
    if ((fromIsVolume && !toIsVolume) || 
        (fromIsWeight && !toIsWeight) || 
        (fromIsCount && !toIsCount)) {
      return null;
    }

    // Find conversion path
    const conversion = this.unitConversions.find(
      c => c.from === fromUnit && c.to === toUnit
    );

    if (conversion) {
      return quantity * conversion.factor;
    }

    // Try reverse conversion
    const reverseConversion = this.unitConversions.find(
      c => c.from === toUnit && c.to === fromUnit
    );

    if (reverseConversion) {
      return quantity / reverseConversion.factor;
    }

    // Try converting through a common base unit
    const baseUnit = this.findCommonBaseUnit(fromUnit, toUnit);
    if (baseUnit) {
      const toBase = this.convertToUnit(quantity, fromUnit, baseUnit, ingredientName);
      if (toBase !== null) {
        return this.convertToUnit(toBase, baseUnit, toUnit, ingredientName);
      }
    }

    // No conversion possible
    return null;
  }

  /**
   * Find a common base unit for conversion between two units
   */
  private findCommonBaseUnit(fromUnit: string, toUnit: string): string | null {
    const volumeUnits = ['tsp', 'tbsp', 'cup', 'ml', 'l', 'fl oz'];
    const weightUnits = ['g', 'kg', 'oz', 'lb'];

    const fromIsVolume = volumeUnits.includes(fromUnit);
    const toIsVolume = volumeUnits.includes(toUnit);
    const fromIsWeight = weightUnits.includes(fromUnit);
    const toIsWeight = weightUnits.includes(toUnit);

    if (fromIsVolume && toIsVolume) {
      return 'ml'; // Use ml as base for volume
    }

    if (fromIsWeight && toIsWeight) {
      return 'g'; // Use g as base for weight
    }

    return null; // No common base unit
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
  normalizeIngredient(ingredient: Ingredient): {
    name: string;
    quantity: number;
    unit: string;
  } {
    const normalizedName = this.normalizeIngredientName(ingredient.name);
    const normalizedUnit = this.normalizeUnit(ingredient.unit);

    // Don't convert units during normalization - let consolidation handle that
    return {
      name: normalizedName,
      quantity: ingredient.quantity,
      unit: normalizedUnit,
    };
  }

  /**
   * Normalize ingredient name by removing extra spaces and standardizing case
   */
  public normalizeIngredientName(name: string): string {
    let normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/,$/, '') // Remove trailing comma
      .replace(/\(.*?\)/g, '') // Remove parenthetical notes
      .trim();

    // Special handling for canned tomatoes - keep them as "can of tomatoes"
    if (normalized.includes('tomato') && (normalized.includes('can') || normalized.includes('canned'))) {
      return 'can of tomatoes';
    }

    // Handle common singular/plural variations
    normalized = this.normalizeSingularPlural(normalized);
    
    // Handle other common variations
    normalized = this.normalizeCommonVariations(normalized);

    return normalized;
  }

  /**
   * Normalize singular/plural variations
   */
  private normalizeSingularPlural(name: string): string {
    // Common singular/plural mappings
    const singularPluralMap: Record<string, string> = {
      'eggs': 'egg',
      'tomatoes': 'tomato',
      'potatoes': 'potato',
      'onions': 'onion',
      'carrots': 'carrot',
      'cucumbers': 'cucumber',
      'peppers': 'pepper',
      'bell peppers': 'bell pepper',
      'mushrooms': 'mushroom',
      'apples': 'apple',
      'bananas': 'banana',
      'oranges': 'orange',
      'lemons': 'lemon',
      'limes': 'lime',
      'avocados': 'avocado',
      'garlic cloves': 'garlic',
      'cloves': 'garlic',
      'herbs': 'herb',
      'berries': 'berry',
      'strawberries': 'strawberry',
      'blueberries': 'blueberry',
      'raspberries': 'raspberry',
      'blackberries': 'blackberry',
      'beans': 'bean',
      'black beans': 'black bean',
      'kidney beans': 'kidney bean',
      'chicken breasts': 'chicken breast',
      'turkey breasts': 'turkey breast',
      'salmon fillets': 'salmon fillet',
      'fish fillets': 'fish fillet',
      'shrimp': 'shrimp', // Same singular/plural
      'bread slices': 'bread slice',
      'cheese slices': 'cheese slice',
      'mozzarella slices': 'mozzarella slice',
      'parmesan cheese': 'parmesan',
      'cheddar cheese': 'cheddar',
      'swiss cheese': 'swiss',
      'feta cheese': 'feta',
      'goat cheese': 'goat cheese',
      'cream cheese': 'cream cheese',
      'cottage cheese': 'cottage cheese',
      'ricotta cheese': 'ricotta',
      'greek yogurt': 'greek yogurt',
      'plain yogurt': 'plain yogurt',
      'vanilla yogurt': 'vanilla yogurt',
      'whole milk': 'whole milk',
      'skim milk': 'skim milk',
      '2% milk': '2% milk',
      'almond milk': 'almond milk',
      'soy milk': 'soy milk',
      'oat milk': 'oat milk',
      'heavy cream': 'heavy cream',
      'half and half': 'half and half',
      'sour cream': 'sour cream',
      'buttermilk': 'buttermilk',
      'unsalted butter': 'unsalted butter',
      'salted butter': 'salted butter',
      'margarine': 'margarine',
      'olive oil': 'olive oil',
      'vegetable oil': 'vegetable oil',
      'sesame oil': 'sesame oil',
      'coconut oil': 'coconut oil',
      'caesar dressing': 'caesar dressing',
      'ranch dressing': 'ranch dressing',
      'vinaigrette': 'vinaigrette',
      'balsamic vinegar': 'balsamic vinegar',
      'balsamic glaze': 'balsamic glaze',
      'soy sauce': 'soy sauce',
      'tomato sauce': 'tomato sauce',
      'marinara sauce': 'marinara sauce',
      'alfredo sauce': 'alfredo sauce',
      'chicken broth': 'chicken broth',
      'beef broth': 'beef broth',
      'vegetable broth': 'vegetable broth',
      'lemon juice': 'lemon juice',
      'lime juice': 'lime juice',
      'orange juice': 'orange juice',
      'mixed vegetables': 'mixed vegetables',
      'mixed berries': 'mixed berries',
      'fresh basil': 'basil',
      'fresh parsley': 'parsley',
      'fresh cilantro': 'cilantro',
      'fresh ginger': 'ginger',
      'fresh garlic': 'garlic',
      'red pepper flakes': 'red pepper flakes',
      'black pepper': 'black pepper',
      'white pepper': 'white pepper',
      'chili powder': 'chili powder',
      'garlic powder': 'garlic powder',
      'onion powder': 'onion powder',
      'italian seasoning': 'italian seasoning',
      'whole grain bread': 'whole grain bread',
      'white bread': 'white bread',
      'wheat bread': 'wheat bread',
      'sourdough bread': 'sourdough bread',
      'croutons': 'crouton',
      'crackers': 'cracker',
      'chips': 'chip',
      'cookies': 'cookie',
      'candy': 'candy',
      'chocolate': 'chocolate',
      'granola bars': 'granola bar',
      'trail mix': 'trail mix',
      'popcorn': 'popcorn',
      'pretzels': 'pretzel',
      'nuts': 'nut',
      'dried fruit': 'dried fruit',
    };

    // Check for exact matches first
    if (singularPluralMap[name]) {
      return singularPluralMap[name];
    }

    // Handle common plural patterns
    if (name.endsWith('s')) {
      const singular = name.slice(0, -1);
      if (singularPluralMap[singular + 's']) {
        return singularPluralMap[singular + 's'];
      }
    }

    return name;
  }

  /**
   * Normalize other common variations
   */
  private normalizeCommonVariations(name: string): string {
    // Remove common prefixes/suffixes that don't change the ingredient
    const variations: Record<string, string> = {
      'fresh ': '',
      'dried ': '',
      'canned ': '',
      'frozen ': '',
      'organic ': '',
      'large ': '',
      'medium ': '',
      'small ': '',
      ' extra virgin': '',
      ' virgin': '',
      ' pure': '',
      ' natural': '',
      ' unsweetened': '',
      ' sweetened': '',
      ' low fat': '',
      ' fat free': '',
      ' reduced fat': '',
      ' whole': '',
      ' skim': '',
      ' 2%': '',
      ' 1%': '',
    };

    let normalized = name;
    for (const [pattern, replacement] of Object.entries(variations)) {
      normalized = normalized.replace(new RegExp(pattern, 'gi'), replacement);
    }

    // Handle common abbreviations
    const abbreviations: Record<string, string> = {
      'tbsp': 'tablespoon',
      'tsp': 'teaspoon',
      'cup': 'cup',
      'oz': 'ounce',
      'lb': 'pound',
      'g': 'gram',
      'kg': 'kilogram',
      'ml': 'milliliter',
      'l': 'liter',
    };

    // Only apply abbreviations if they're standalone (not part of a larger word)
    for (const [abbr, full] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      normalized = normalized.replace(regex, full);
    }

    return normalized.trim();
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
   * @deprecated Use consolidateIngredientArray instead for better unit conversion
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

  /**
   * Find a similar ingredient group to merge with
   */
  private findSimilarIngredientGroup(
    ingredientsByName: Map<string, Array<{
      name: string;
      quantity: number;
      unit: string;
      originalIngredient: Ingredient;
    }>>,
    name: string,
  ): string | null {
    // Check for exact matches first
    if (ingredientsByName.has(name)) {
      return name;
    }

    // Check for similar names with improved logic
    for (const existingName of ingredientsByName.keys()) {
      if (this.areIngredientNamesSimilar(name, existingName)) {
        return existingName;
      }
    }

    // Additional check for common variations that might be missed
    const normalizedName = this.normalizeIngredientName(name);
    for (const existingName of ingredientsByName.keys()) {
      const normalizedExisting = this.normalizeIngredientName(existingName);
      if (normalizedName === normalizedExisting) {
        return existingName;
      }
    }

    return null;
  }

  /**
   * Check if two ingredient names are similar enough to be consolidated
   */
  public areIngredientNamesSimilar(name1: string, name2: string): boolean {
    // Normalize both names for comparison
    const normalized1 = this.normalizeIngredientName(name1);
    const normalized2 = this.normalizeIngredientName(name2);
    
    // Exact match after normalization
    if (normalized1 === normalized2) return true;

    // Check if one is a subset of the other (e.g., "egg" vs "large egg")
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      // But avoid false positives for very short words
      if (Math.min(normalized1.length, normalized2.length) >= 3) {
        // Special case: don't consolidate different tomato types
        if ((normalized1.includes('cherry') && normalized2.includes('tomato') && !normalized2.includes('cherry')) ||
            (normalized2.includes('cherry') && normalized1.includes('tomato') && !normalized1.includes('cherry'))) {
          return false;
        }
        
        // Don't consolidate "can of tomatoes" with regular tomatoes
        if ((normalized1 === 'can of tomatoes' && normalized2 === 'tomato') ||
            (normalized2 === 'can of tomatoes' && normalized1 === 'tomato')) {
          return false;
        }
        return true;
      }
    }

    // Check for common variations
    const variations = [
      ['egg', 'eggs'],
      ['tomato', 'tomatoes'],
      ['onion', 'onions'],
      ['garlic', 'garlic cloves'],
      ['basil', 'fresh basil', 'basil leaves'],
      ['parsley', 'fresh parsley'],
      ['ginger', 'fresh ginger'],
      ['cheese', 'parmesan cheese', 'mozzarella cheese'],
      ['mozzarella', 'mozzarella cheese', 'mozzarella balls'],
      ['parmesan', 'parmesan cheese'],
      ['bread', 'whole grain bread'],
      ['milk', 'whole milk'],
      ['yogurt', 'greek yogurt'],
      ['oil', 'olive oil'],
      ['sauce', 'tomato sauce'],
      ['broth', 'chicken broth'],
      ['juice', 'lemon juice'],
      ['vegetables', 'mixed vegetables'],
      ['berries', 'mixed berries', 'berry'],
      ['cucumber', 'cucumber sticks'],
      ['carrot', 'carrot sticks'],
      ['celery', 'celery sticks'],
      ['bell pepper', 'bell peppers'],
      ['bean', 'black bean', 'kidney bean'],
      ['nuts', 'mixed nuts', 'almonds'],
      ['greens', 'mixed greens'],
      ['pasta', 'whole wheat pasta'],
      ['chicken', 'chicken breast', 'chicken thighs'],
      ['turkey', 'ground turkey'],
      ['salmon', 'salmon fillet'],
      ['asparagus', 'asparagus spears'],
      ['spinach', 'baby spinach'],
      ['quinoa', 'cooked quinoa'],
      ['oats', 'rolled oats', 'steel cut oats'],
      ['honey', 'raw honey'],
      ['vinegar', 'balsamic vinegar'],
      ['dressing', 'vinaigrette'],
      ['pesto', 'basil pesto'],
      ['hummus', 'chickpea hummus'],
      ['granola', 'homemade granola'],
      ['seeds', 'chia seeds', 'sunflower seeds'],
      ['powder', 'cocoa powder', 'garlic powder'],
      ['glaze', 'balsamic glaze'],
      // Add more specific variations for better consolidation
      ['tomato', 'tomatoes'], // Regular tomatoes only
      ['cherry tomato', 'cherry tomatoes'], // Cherry tomatoes only
      ['roma tomato', 'roma tomatoes'], // Roma tomatoes only
      ['grape tomato', 'grape tomatoes'], // Grape tomatoes only
      ['beefsteak tomato', 'beefsteak tomatoes'], // Beefsteak tomatoes only
      ['can of tomatoes', 'canned tomatoes', 'tomato can'], // Canned tomatoes only
      ['mozzarella', 'mozzarella cheese', 'mozzarella balls', 'mozzarella ball'],
      ['bell pepper', 'bell peppers', 'red bell pepper', 'green bell pepper'],
      ['mixed greens', 'greens', 'salad greens', 'lettuce'],
      ['olive oil', 'oil', 'extra virgin olive oil'],
      ['balsamic glaze', 'balsamic', 'balsamic vinegar'],
      ['basil pesto', 'pesto'],
      ['whole wheat pasta', 'pasta', 'spaghetti', 'penne'],
      ['greek yogurt', 'yogurt', 'plain yogurt'],
      ['mixed berries', 'berries', 'strawberries', 'blueberries'],
      ['mixed nuts', 'nuts', 'almonds', 'walnuts'],
      ['chia seeds', 'seeds', 'chia'],
      ['cocoa powder', 'powder', 'cocoa'],
      ['honey', 'raw honey', 'organic honey'],
      ['quinoa', 'cooked quinoa', 'white quinoa'],
      ['oats', 'rolled oats', 'steel cut oats', 'oatmeal'],
      ['hummus', 'chickpea hummus', 'homemade hummus'],
      ['granola', 'homemade granola', 'organic granola'],
      ['vinaigrette', 'dressing', 'salad dressing'],
      ['parmesan', 'parmesan cheese', 'grated parmesan'],
    ];

    for (const variationGroup of variations) {
      if (variationGroup.includes(normalized1) && variationGroup.includes(normalized2)) {
        return true;
      }
    }

    // Check for high similarity using simple string similarity
    const similarity = this.calculateStringSimilarity(normalized1, normalized2);
    return similarity > 0.8; // 80% similarity threshold
  }

  /**
   * Calculate simple string similarity (0-1)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

// Export singleton instance
export const ingredientConsolidatorService =
  new IngredientConsolidatorService();
