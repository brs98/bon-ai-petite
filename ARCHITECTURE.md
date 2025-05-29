# 🏗️ Recipe Generation Service: Detailed Architecture

## 🔍 Current App Context

**Existing Tech Stack:**

- Next.js 15 with App Router
- TypeScript + Zod validation
- Drizzle ORM + PostgreSQL
- Stripe payments (Essential/Premium plans)
- Authentication with JWTs
- shadcn/ui + Tailwind CSS
- Protected dashboard routes

**Current Structure:**

```
app/
├── (dashboard)/          # Protected routes
├── (login)/             # Auth routes
├── pricing/             # Public pricing
├── profile/             # User management
└── api/                 # API endpoints
```

---

## 🎯 Integration Strategy

### A. Service Integration Points

**1. User Experience Flow:**

```
Dashboard → Recipe Generator → Generated Recipe → Shopping List Integration
```

**2. Subscription-Based Access:**

- **Essential Plan**: Basic recipe generation (3 recipes/day)
- **Premium Plan**: Advanced features (unlimited + meal planning)

**3. Data Flow Integration:**

```
User Profile (existing) → Recipe Preferences → AI Generation → Recipe Storage → Shopping Integration
```

---

## 🏛️ Detailed Architecture

### 1. Route Structure Extension

```
app/
├── (dashboard)/
│   ├── recipes/                    # NEW: Recipe hub
│   │   ├── page.tsx               # Recipe dashboard
│   │   ├── generate/              # Recipe generation flow
│   │   │   ├── page.tsx          # Main generator
│   │   │   └── preferences/       # Dietary preferences setup
│   │   ├── saved/                 # User's saved recipes
│   │   ├── meal-planning/         # Premium: Meal plans
│   │   └── shopping/              # Shopping list integration
│   └── settings/
│       └── nutrition/             # User nutrition profile
└── api/
    ├── recipes/                   # NEW: Recipe API routes
    │   ├── generate/              # AI generation endpoint
    │   ├── save/                  # Save recipe
    │   ├── feedback/              # User feedback
    │   └── nutrition/             # Nutrition validation
    └── integrations/              # NEW: External integrations
        ├── instacart/            # Shopping integration
        └── nutrition-apis/       # Edamam, Spoonacular
```

### 2. Database Schema Extensions

```typescript
// New tables to add to existing Drizzle schema

// User nutrition profile (extends existing user)
export const nutritionProfiles = pgTable('nutrition_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  age: integer('age'),
  height: integer('height_cm'),
  weight: integer('weight_kg'),
  activityLevel: varchar('activity_level', { length: 20 }),
  goals: varchar('goals', { length: 50 }), // lose_weight, gain_muscle, maintain
  dailyCalories: integer('daily_calories'),
  macroProtein: integer('macro_protein_g'),
  macroCarbs: integer('macro_carbs_g'),
  macroFat: integer('macro_fat_g'),
  allergies: text('allergies').array(),
  dietaryRestrictions: text('dietary_restrictions').array(),
  cuisinePreferences: text('cuisine_preferences').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Generated recipes storage
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  ingredients: jsonb('ingredients'), // [{ name, quantity, unit }]
  instructions: text('instructions').array(),
  nutrition: jsonb('nutrition'), // { calories, protein, carbs, fat }
  prepTime: integer('prep_time_minutes'),
  cookTime: integer('cook_time_minutes'),
  servings: integer('servings'),
  difficulty: varchar('difficulty', { length: 20 }),
  cuisineType: varchar('cuisine_type', { length: 50 }),
  mealType: varchar('meal_type', { length: 20 }), // breakfast, lunch, dinner, snack
  tags: text('tags').array(),
  isSaved: boolean('is_saved').default(false),
  rating: integer('rating'), // 1-5 stars
  createdAt: timestamp('created_at').defaultNow(),
});

// Recipe generation feedback
export const recipeFeedback = pgTable('recipe_feedback', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id),
  userId: integer('user_id').references(() => users.id),
  liked: boolean('liked'),
  feedback: text('feedback'), // reasons for dislike
  reportedIssues: text('reported_issues').array(), // too_complex, bad_ingredients, etc
  createdAt: timestamp('created_at').defaultNow(),
});

// Usage tracking for subscription limits
export const usageTracking = pgTable('usage_tracking', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }), // recipe_generation, meal_plan_creation
  date: date('date'),
  count: integer('count').default(1),
});
```

### 3. Service Layer Architecture

```
lib/
├── ai/                           # NEW: AI integration layer
│   ├── recipe-generator.ts       # Core AI recipe generation
│   ├── prompt-builder.ts         # Intelligent prompt construction
│   ├── nutrition-validator.ts    # Nutrition API integration
│   └── feedback-processor.ts     # Process user feedback for improvements
├── recipes/                      # NEW: Recipe business logic
│   ├── recipe-service.ts         # CRUD operations
│   ├── meal-planner.ts          # Premium: Meal planning logic
│   ├── shopping-integration.ts   # Instacart/shopping APIs
│   └── nutrition-calculator.ts   # Nutrition analysis
├── subscriptions/               # Extend existing
│   └── usage-limits.ts          # Track/enforce subscription limits
└── integrations/                # NEW: External APIs
    ├── edamam.ts               # Nutrition database
    ├── spoonacular.ts          # Recipe enrichment
    └── instacart.ts            # Shopping integration
```

### 4. Component Architecture

```
components/
├── recipes/                     # NEW: Recipe-specific components
│   ├── RecipeGenerator/
│   │   ├── GeneratorForm.tsx    # Main generation interface
│   │   ├── PreferencesWizard.tsx # First-time setup
│   │   └── GenerationProgress.tsx # Loading states
│   ├── RecipeCard/
│   │   ├── RecipeCard.tsx       # Display recipe
│   │   ├── NutritionBadge.tsx   # Nutrition info
│   │   └── FeedbackButtons.tsx  # Like/dislike
│   ├── RecipeDetail/
│   │   ├── IngredientsList.tsx  # Ingredients with shopping
│   │   ├── InstructionsView.tsx # Step-by-step cooking
│   │   └── NutritionPanel.tsx   # Detailed nutrition
│   └── MealPlanning/            # Premium features
│       ├── WeeklyPlanner.tsx    # Meal calendar
│       └── ShoppingList.tsx     # Generated shopping lists
├── nutrition/                   # NEW: Nutrition components
│   ├── ProfileSetup.tsx         # Nutrition profile wizard
│   ├── MacroTracker.tsx         # Visual macro display
│   └── GoalsSelector.tsx        # Weight/fitness goals
└── ui/                         # Extend existing
    ├── progress-ring.tsx        # Macro progress visuals
    └── recipe-skeleton.tsx      # Loading states
```

---

## 🔄 Core Workflows

### 1. First-Time User Setup

```
New User → Nutrition Profile Setup → Preference Selection → First Recipe Generation
```

**Pages:**

- `/dashboard/settings/nutrition` - Initial profile setup
- `/dashboard/recipes/generate/preferences` - Dietary preferences
- `/dashboard/recipes/generate` - First generation experience

### 2. Daily Recipe Generation

```
Dashboard → Recipe Generator → AI Processing → Nutrition Validation → Recipe Display
```

**API Flow:**

```typescript
// API Route: /api/recipes/generate
POST {
  userId: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  preferences?: Partial<UserPreferences>
}

→ Check subscription limits
→ Build contextualized prompt
→ Call AI SDK (generateText)
→ Parse and validate response
→ Validate nutrition against user goals
→ Store recipe
→ Return structured recipe data
```

### 3. Premium Meal Planning (Premium Only)

```
Weekly View → Auto-Generate Week → Manual Adjustments → Shopping List Export
```

### 4. Shopping Integration

```
Recipe View → Add to Shopping List → Instacart Integration → Order Placement
```

---

## 🔐 Access Control & Limits

### Subscription Tiers

**Essential Plan:**

- 3 recipe generations per day
- Basic nutrition tracking
- Save up to 20 recipes

**Premium Plan:**

- Unlimited recipe generation
- Weekly meal planning
- Shopping list integration
- Advanced nutrition analysis
- Priority AI processing

### Implementation

```typescript
// lib/subscriptions/usage-limits.ts
export async function checkUsageLimit(
  userId: string,
  action: string,
): Promise<boolean> {
  const subscription = await getSubscription(userId);
  const todayUsage = await getTodayUsage(userId, action);

  const limits = {
    essential: { recipe_generation: 3 },
    premium: { recipe_generation: -1 }, // unlimited
  };

  return (
    limits[subscription.plan][action] === -1 ||
    todayUsage < limits[subscription.plan][action]
  );
}
```

---

## 📊 Analytics & Monitoring

### Key Metrics to Track

**User Engagement:**

- Recipe generation frequency
- Save/like rates
- Time spent on recipe pages
- Shopping list usage (Premium)

**AI Performance:**

- Generation success rate
- Nutrition accuracy
- User satisfaction scores
- Common feedback patterns

**Business Metrics:**

- Feature usage by subscription tier
- Conversion from Essential to Premium
- Recipe-related churn analysis

### Implementation Points

```typescript
// lib/analytics/recipe-events.ts
export const trackRecipeEvent = (event: {
  userId: string;
  action: 'generated' | 'saved' | 'liked' | 'shopping_list';
  recipeId?: string;
  metadata?: Record<string, any>;
}) => {
  // Track in existing analytics system
};
```

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- Database schema migration
- Basic AI integration setup
- Recipe generation API endpoint
- Simple recipe display UI

### Phase 2: User Experience (Week 3-4)

- Nutrition profile setup
- Recipe generator interface
- Save/feedback functionality
- Basic nutrition validation

### Phase 3: Premium Features (Week 5-6)

- Meal planning interface
- Shopping integration
- Advanced nutrition analysis
- Usage limit enforcement

### Phase 4: Optimization (Week 7-8)

- Performance optimization
- Advanced prompt engineering
- Analytics implementation
- User feedback integration

---

## 🔧 Technical Considerations

### AI SDK Integration

```typescript
// Example service structure
export class RecipeGeneratorService {
  private aiClient: AIClient;
  private nutritionValidator: NutritionValidator;
  private promptBuilder: PromptBuilder;

  async generateRecipe(request: RecipeGenerationRequest): Promise<Recipe> {
    // Implementation following AI SDK patterns
  }
}
```

### Error Handling Strategy

- Graceful AI API failures with fallback recipes
- Nutrition validation errors with user feedback
- Rate limiting with clear user communication
- Subscription limit handling with upgrade prompts

### Performance Optimization

- Recipe caching for similar requests
- Nutrition data caching
- Optimistic UI updates
- Background recipe pre-generation for power users

This architecture leverages your existing Next.js SaaS foundation while adding
sophisticated AI-powered recipe generation that scales with your subscription
model.
