# 📋 Recipe Generation Service: Implementation Tasks

> **Checklist updated as of June 2024 after deep codebase review. Most core
> infrastructure, API, and main UI components are complete. Remaining items are
> polish, analytics, and advanced features.**

# 🔎 User Testing Feedback & Action Items (May 2024)

- [x] Error page is shown after creating weekly meal plan (refresh seems to fix
      it) <!-- TODO: Needs further testing -->
- [x] Sometimes, the shopping list isn't created along with the meals (might be
      related to above) <!-- TODO: Needs further testing -->
- [ ] Update landing page so it doesn't look like 12 items in cart (confusing)
      <!-- TODO: UI polish -->
- [ ] Update landing page to give better idea of what somebody is buying (show
      process: profile creation → meal planning generation → shopping list
      creation) <!-- TODO: UI polish -->
- [x] Add 'None' option for nutrition profile setup <!-- TODO: UI polish -->
- [ ] Macro targets might not be desired (indicate it's to help the AI model do
      healthy meals for your body) <!-- TODO: UI copy -->
- [ ] Add button on nutrition profile summary to link to generate meal plans and
      generate a single recipe <!-- TODO: UI polish -->
- [x] Recipe page should look different if there are no meals to display
      <!-- TODO: UI polish -->
- [ ] Custom nutrition targets feels weird (make it a little more hidden via a
      drop down or something) <!-- TODO: UI polish -->
- [ ] Make nutrition targets be daily not weekly <!-- TODO: UI logic -->
- [x] Make save recipe button on recipe page stand out more
      <!-- TODO: UI polish -->
- [x] Add 'generate another recipe' button on recipe page
      <!-- TODO: UI polish -->
- [ ] Make recipe prompt include a healthy balance (base - rice, pasta, quinoa,
      etc, vegetables, protein) <!-- TODO: Prompt tweak -->
- [x] Recently generated recipes don't display <!-- TODO: Bug -->
- [ ] More in-depth quiz at profile setup to generate meals closer to user taste
      (like Hello Fresh, specify foods you do/don't like) <!-- TODO: Feature -->
- [ ] Only generate meals that match user preferences (e.g., Moroccan and Thai
      generated even if not listed) <!-- TODO: Prompt/logic -->
- [ ] Optimize weekly meal plan query so meals are aware of each other (avoid
      all meals being the same cuisine) <!-- TODO: Logic -->
- [ ] Regenerate one-by-one with loading state instead of selecting all to
      regenerate <!-- TODO: UI/logic -->
- [ ] In recipe, when disliked, allow feedback like (select ingredients you
      didn't like, or other reasons) <!-- TODO: UI/logic -->
- [ ] Allow ability to iterate on a recipe (e.g., add a sauce, substitutions)
      <!-- TODO: Feature -->
- [ ] Weekly meal plan: ability to set and organize by day
      <!-- TODO: UI/logic -->
- [ ] Shopping list: can't check off items <!-- TODO: UI polish -->
- [ ] Some items are not put in the correct bucket (produce, canned, etc)
      <!-- TODO: Logic -->
- [ ] Items get duplicated in shopping list <!-- TODO: Logic -->
- [ ] Items should prefer cups, tbsp, etc instead of grams <!-- TODO: Logic -->
- [ ] Maybe lower temperature of AI? <!-- TODO: Prompt/config -->
- [ ] Add ability to create meal plans based off previous meals that you saved
      or liked (mix generated with saved) <!-- TODO: Feature -->
- [x] Dashboard: This week's meal plan is not displaying <!-- TODO: Bug -->
- [x] What is 00 on "your preferences" <!-- TODO: UI bug -->
- [ ] Remove "your activity" section and "quick actions"
      <!-- TODO: UI polish -->
- [ ] Weekly meal plan can still be used after switching to base account
      <!-- TODO: Subscription logic -->

## 🚀 Phase 1: Core Infrastructure (Week 1-2)

### Database Schema & Migrations

- [x] **Create nutrition profiles table migration**

  - [x] Add `nutrition_profiles` table with all fields from architecture
  - [x] Set up foreign key relationship to existing `users` table
  - [x] Add indexes on `userId` and `createdAt`
  - [x] Test migration in development environment

- [x] **Create recipes table migration**

  - [x] Add `recipes` table with all fields including JSONB for
        ingredients/nutrition
  - [x] Set up foreign key relationship to existing `users` table
  - [x] Add indexes on `userId`, `mealType`, `createdAt`, `isSaved`
  - [x] Add text search index on `name` and `description` fields

- [x] **Create recipe feedback table migration**

  - [x] Add `recipe_feedback` table with recipe and user relationships
  - [x] Set up foreign keys to `recipes` and `users` tables
  - [x] Add composite index on `(recipeId, userId)`

- [x] **Create usage tracking table migration**

  - [x] Add `usage_tracking` table for subscription limit enforcement
  - [x] Set up foreign key to `users` table
  - [x] Add composite index on `(userId, date, action)`

- [x] **Update Drizzle schema files**
  - [x] Add all new table definitions to `lib/db/schema.ts`
  - [x] Export new table types for TypeScript usage
  - [x] Run `pnpm db:generate` to create migration files
  - [x] Run `pnpm db:migrate` to apply migrations

### AI SDK Integration Setup

- [x] **Install AI SDK dependencies**

  - [x] Add `ai` package to dependencies
  - [x] Add `@ai-sdk/openai` package
  - [x] Add `zod` if not already present (already in package.json)
  - [x] Update package.json and run `pnpm install`

- [x] **Environment configuration**

  - [x] Add `OPENAI_API_KEY` to environment variables
  - [x] Add AI-related config to existing environment setup
  - [x] Update `.env.example` with new required variables
  - [x] Document API key setup in README

- [x] **Create basic AI service structure**
  - [x] Create `lib/ai/` directory
  - [x] Create `lib/ai/recipe-generator.ts` with basic generateText integration
  - [x] Create `lib/ai/prompt-builder.ts` with initial prompt templates
  - [x] Add basic TypeScript interfaces for recipe generation

### Core API Routes

- [x] **Create recipe generation API endpoint**

  - [x] Create `app/api/recipes/generate/route.ts`
  - [x] Implement POST handler with user authentication
  - [x] Add basic request validation with Zod schemas
  - [x] Integrate with AI SDK generateText function
  - [x] Add error handling and response formatting

- [x] **Create recipe save API endpoint**

  - [x] Create `app/api/recipes/save/route.ts`
  - [x] Implement POST handler to save recipes to database
  - [x] Add validation for recipe data structure
  - [x] Handle duplicate recipe checking

- [x] **Create recipe feedback API endpoint**
  - [x] Create `app/api/recipes/feedback/route.ts`
  - [x] Implement POST handler for like/dislike actions
  - [x] Store feedback in database with proper relationships

### Basic UI Foundation

- [x] **Create recipe types and schemas**

  - [x] Create `types/recipe.ts` with all TypeScript interfaces
  - [x] Create Zod schemas for recipe validation
  - [x] Export types for component usage

- [x] **Create basic recipe components**

  - [x] Create `components/recipes/` directory
  - [x] Create `components/recipes/RecipeCard/RecipeCard.tsx` basic component
  - [x] Create `components/recipes/RecipeCard/NutritionBadge.tsx`
  - [x] Add basic styling with Tailwind classes

- [x] **Create recipe dashboard route**
  - [x] Create `app/(dashboard)/dashboard/recipes/` directory
  - [x] Create `app/(dashboard)/dashboard/recipes/page.tsx` basic layout
  - [x] Add navigation link to main dashboard
  - [x] Test route protection with existing auth middleware

## 🎨 Phase 2: User Experience (Week 3-4)

### Nutrition Profile System

- [x] **Create nutrition profile API routes**

  - [x] Create `app/api/nutrition/profile/route.ts`
  - [x] Implement GET/POST/PUT handlers for profile management
  - [x] Add validation for nutrition data
  - [x] Handle profile creation and updates

- [x] **Create nutrition profile components**

  - [x] Create `components/nutrition/ProfileSetup.tsx`
  - [x] Create `components/nutrition/GoalsSelector.tsx` with preset options
  - [x] Create `components/nutrition/MacroTracker.tsx` visual component
  - [x] Add form components for height, weight, activity level

- [x] **Create nutrition profile setup pages**
  - [x] Create `app/(dashboard)/dashboard/settings/nutrition/page.tsx`
  - [x] Build multi-step form for user profile setup
  - [x] Add form validation with Zod schemas
  - [x] Integrate with database to store/update profiles

### Recipe Generator Interface

- [x] **Create recipe generator components**

  - [x] Create `components/recipes/RecipeGenerator/GeneratorForm.tsx`
  - [x] Create `components/recipes/RecipeGenerator/GenerationProgress.tsx`
  - [x] Add loading states and progress indicators
  - [x] Add error handling UI components

- [x] **Create recipe generation page**

  - [x] Create `app/(dashboard)/dashboard/recipes/generate/page.tsx`
  - [x] Build main recipe generation interface
  - [x] Add meal type selector (breakfast, lunch, dinner, snack)
  - [x] Add quick preference toggles (cuisine, dietary restrictions)

- [x] **Create preferences setup flow**
  - [x] Create `app/(dashboard)/dashboard/recipes/generate/preferences/page.tsx`
  - [x] Create `components/recipes/RecipeGenerator/PreferencesWizard.tsx`
  - [x] Build step-by-step preference collection
  - [x] Store preferences and redirect to generator

### Recipe Display & Management

- [x] **Enhance recipe card components**

  - [x] Update `RecipeCard.tsx` with full recipe display
  - [x] Create `components/recipes/RecipeCard/FeedbackButtons.tsx`
  - [x] Add save/unsave functionality
  - [x] Add quick action buttons (regenerate, share)

- [x] **Create recipe detail view**

  - [x] Create `app/(dashboard)/dashboard/recipes/[id]/page.tsx`
  - [x] Create `components/recipes/RecipeDetail/RecipeDetail.tsx` (comprehensive
        component)
  - [x] Add ingredients list display
  - [x] Add instructions view with step numbering
  - [x] Add nutrition panel with detailed breakdown

- [x] **Create saved recipes page**
  - [x] Create `app/(dashboard)/dashboard/recipes/saved/page.tsx`
  - [x] Add recipe filtering and search functionality
  - [x] Add pagination for large recipe collections
  - [x] Add API route for fetching saved recipes with filters

### Enhanced AI Integration

- [x] **Improve prompt engineering**

  - [x] Enhance `lib/ai/prompt-builder.ts` with context-aware prompts
  - [x] Add few-shot learning examples
  - [x] Implement user preference integration
  - [x] Add nutritional target incorporation

- [x] **Add recipe parsing and validation**

  - [x] Create `lib/ai/recipe-parser.ts`
  - [x] Add structured parsing of AI responses
  - [x] Implement nutrition validation logic
  - [x] Add ingredient quantity normalization

- [x] **Create feedback processing system**
  - [x] Create `lib/ai/feedback-processor.ts`
  - [x] Implement feedback analysis for prompt improvement
  - [x] Add user preference learning from feedback
  - [x] Store processed insights for future generations

## 🚀 Phase 3: Premium Features (Week 5-6)

### Subscription Limits & Access Control

- [x] **Create usage tracking system**

  - [x] Create `lib/subscriptions/usage-limits.ts`
  - [x] Implement daily usage tracking functions
  - [x] Add subscription tier checking functions
  - [x] Create usage limit enforcement middleware

- [x] **Update API routes with usage limits**

  - [x] Add usage checking to recipe generation endpoint
  - [x] Implement graceful limit exceeded responses
  - [x] Add upgrade prompts for Essential users
  - [x] Track usage in database for all actions

- [x] **Create usage dashboard components**
  - [x] Add usage display to recipe dashboard
  - [x] Create usage limit warnings and notifications
  - [x] Add upgrade call-to-action components
  - [x] Show usage statistics for Premium users

### Meal Planning System (Premium Only)

- [x] **Create meal planning API routes**

  - [x] Create `app/api/meal-plans/route.ts`
  - [x] Implement CRUD operations for meal plans
  - [x] Add weekly plan generation endpoint
  - [x] Create shopping list generation from meal plans

- [x] **Create meal planning service layer**

  - [x] Create `lib/meal-planning/weekly-meal-planner.ts`
  - [x] Implement plan creation and management functions
  - [x] Add meal category processing logic (breakfast → lunch → dinner → snacks)
  - [x] Create plan validation and completion checking
  - [x] Add plan archiving and cleanup functionality

- [x] **Create meal planning components**

  - [x] Create `components/meal-planning/MealCountSelector.tsx`
  - [x] Create `components/meal-planning/WizardNavigation.tsx`
  - [x] Create `components/meal-planning/MealPlanCard.tsx`
  - [x] Create `components/meal-planning/PreferenceOverride.tsx`
  - [x] Create `components/meal-planning/ShoppingList.tsx`

- [x] **Create meal planning pages**
  - [x] Create `app/(dashboard)/dashboard/recipes/meal-planning/page.tsx`
  - [x] Add premium access gate component
  - [x] Build weekly calendar interface
  - [x] Add drag-and-drop meal assignment

### External API Integrations

- [ ] **Set up nutrition APIs** <!-- NOT STARTED -->

  - [ ] Create `lib/integrations/edamam.ts`
  - [ ] Create `lib/integrations/spoonacular.ts`
  - [ ] Add API key configuration
  - [ ] Implement nutrition data fetching

- [ ] **Create nutrition validation system** <!-- NOT STARTED -->

  - [ ] Create `lib/ai/nutrition-validator.ts`
  - [ ] Implement recipe nutrition verification
  - [ ] Add ingredient nutrition lookup
  - [ ] Create nutrition accuracy scoring

- [ ] **Create shopping integration foundation** <!-- NOT STARTED -->
  - [ ] Create `lib/integrations/instacart.ts` (or grocery API)
  - [ ] Research and implement grocery delivery API
  - [ ] Create ingredient-to-product mapping
  - [ ] Add shopping list export functionality

### Advanced Recipe Features

- [ ] **Create recipe enhancement system** <!-- NOT STARTED -->

  - [ ] Add recipe difficulty calculation
  - [ ] Implement cooking time estimation
  - [ ] Add recipe tagging and categorization
  - [ ] Create recipe variation suggestions

- [ ] **Create advanced search and filtering** <!-- NOT STARTED -->
  - [ ] Add full-text search for recipes
  - [ ] Create advanced filtering options
  - [ ] Add recipe recommendation engine
  - [ ] Implement trending recipes feature

## 🔧 Phase 4: Optimization & Polish (Week 7-8)

### Performance Optimization

- [ ] **Implement caching strategies** <!-- NOT STARTED -->

  - [ ] Add recipe caching for similar requests
  - [ ] Implement nutrition data caching
  - [ ] Add user preference caching
  - [ ] Create intelligent cache invalidation

- [ ] **Optimize AI API usage** <!-- NOT STARTED -->

  - [ ] Implement request deduplication
  - [ ] Add response streaming for long generations
  - [ ] Create background recipe pre-generation
  - [ ] Add retry logic with exponential backoff

- [ ] **Database optimization** <!-- NOT STARTED -->
  - [ ] Add database query optimization
  - [ ] Implement connection pooling
  - [ ] Add database indexes for common queries
  - [ ] Create database backup and migration strategies

### Analytics & Monitoring

- [ ] **Create analytics tracking system** <!-- NOT STARTED -->

  - [ ] Create `lib/analytics/recipe-events.ts`
  - [ ] Implement event tracking for all user actions
  - [ ] Add performance monitoring
  - [ ] Create error tracking and reporting

- [ ] **Create analytics dashboard** <!-- NOT STARTED -->

  - [ ] Add admin analytics views (if applicable)
  - [ ] Create user engagement metrics
  - [ ] Add AI performance monitoring
  - [ ] Implement conversion tracking

- [ ] **Set up monitoring and alerts** <!-- NOT STARTED -->
  - [ ] Add error rate monitoring
  - [ ] Create API performance alerts
  - [ ] Set up database health monitoring
  - [ ] Add usage spike detection

### Testing & Quality Assurance

- [x] **Create comprehensive test suite**

  - [x] Add unit tests for all service functions
  - [x] Create integration tests for API routes
  - [x] Add component tests for UI elements
  - [x] Create end-to-end user journey tests

- [x] **Create test data and fixtures**

  - [x] Add test recipes and user profiles
  - [x] Create mock AI responses for testing
  - [x] Add test nutrition data
  - [x] Create performance test scenarios

- [ ] **Security and validation review** <!-- TODO: Final audit -->
  - [ ] Audit all API endpoints for security
  - [ ] Review data validation schemas
  - [ ] Test subscription access controls
  - [ ] Validate user data privacy compliance

### Documentation & Deployment

- [ ] **Create comprehensive documentation** <!-- TODO: Final docs -->

  - [ ] Document all API endpoints
  - [ ] Create component usage documentation
  - [ ] Add deployment and setup guides
  - [ ] Create troubleshooting documentation

- [ ] **Prepare for production deployment** <!-- TODO: Final prep -->

  - [ ] Set up production environment variables
  - [ ] Configure production database
  - [ ] Set up monitoring and logging
  - [ ] Create deployment scripts and CI/CD

- [ ] **User onboarding and help** <!-- TODO: Final polish -->
  - [ ] Create user onboarding flow
  - [ ] Add in-app help and tooltips
  - [ ] Create FAQ and support documentation
  - [ ] Add user feedback collection system

## 🔄 Ongoing Tasks

### Maintenance & Iteration

- [ ] **Regular prompt optimization** <!-- Ongoing -->

  - [ ] Analyze user feedback patterns
  - [ ] Update prompts based on performance data
  - [ ] A/B test different prompt strategies
  - [ ] Monitor AI model updates and improvements

- [ ] **Feature iteration based on usage** <!-- Ongoing -->

  - [ ] Analyze user behavior and preferences
  - [ ] Iterate on UI/UX based on feedback
  - [ ] Add new cuisine types and dietary options
  - [ ] Expand integration partnerships

- [ ] **Performance monitoring and optimization** <!-- Ongoing -->
  - [ ] Regular performance audits
  - [ ] Database query optimization
  - [ ] API response time improvements
  - [ ] User experience optimization

---

## 📝 Notes

**Dependencies & Prerequisites:**

- OpenAI API access and billing setup
- Nutrition API keys (Edamam, Spoonacular)
- Shopping API research and integration planning
- Database migration testing in staging environment

**Testing Strategy:**

- Each phase should include comprehensive testing before moving to next phase
- User acceptance testing should be conducted after Phase 2
- Performance testing should be done throughout Phase 4

**Risk Mitigation:**

- AI API rate limiting and fallback strategies
- Database migration rollback plans
- Feature flagging for gradual rollout
- User data backup and recovery procedures

---

## 🗓️ WEEKLY MEAL PLANNER FEATURE (Premium)

### 📊 Database Schema for Weekly Meal Planning

- [x] **Create weekly meal plans table migration** ⚠️ BLOCKS: All weekly meal
      planning functionality

  - [x] Add `weekly_meal_plans` table with plan metadata
  - [x] Include meal counts for all categories (breakfasts, lunches, dinners,
        snacks)
  - [x] Add plan status tracking (in_progress, completed, archived)
  - [x] Set up foreign key relationship to existing `users` table
  - [x] Add indexes on `userId`, `status`, and `createdAt`

- [x] **Create meal plan items table migration** ⚠️ BLOCKS: Individual meal card
      functionality, meal generation API 🔗 DEPENDS ON: Weekly meal plans table
      migration

  - [x] Add `meal_plan_items` table for individual meals within plans
  - [x] Include category, day number, and status fields
  - [x] Add custom preferences JSONB field for overrides
  - [x] Set up foreign keys to `weekly_meal_plans` and `recipes` tables
  - [x] Add indexes on plan_id, category, and status

- [x] **Create shopping lists table migration** ⚠️ BLOCKS: Shopping list
      functionality 🔗 DEPENDS ON: Weekly meal plans table migration

  - [x] Add `shopping_lists` table linked to meal plans
  - [x] Include consolidated ingredients with quantities and categories
  - [x] Add export metadata for future integrations
  - [x] Set up foreign key to `weekly_meal_plans` table
  - [x] Add indexes on plan_id and category

- [x] **Update Drizzle schema for weekly meal planning** ⚠️ BLOCKS: All weekly
      meal planning development 🔗 DEPENDS ON: All meal planning table
      migrations
  - [x] Add all new table definitions to `lib/db/schema.ts`
  - [x] Export new types for TypeScript usage throughout application
  - [x] Run schema generation and migration commands
  - [x] Test migrations in development environment

### 🎯 Weekly Meal Planning API Infrastructure

- [x] **Create weekly meal plan CRUD API routes** ⚠️ BLOCKS: Weekly meal
      planning wizard UI 🔗 DEPENDS ON: Weekly meal planning database schema

  - [x] Create `app/api/meal-plans/weekly/route.ts` for plan creation/listing
  - [x] Implement POST handler for creating new weekly plans
  - [x] Implement GET handler for retrieving user's meal plans
  - [x] Add request validation with Zod schemas
  - [x] Include subscription limit checking for Premium feature

- [x] **Create individual meal generation API endpoint** ⚠️ BLOCKS: Meal card
      generation, individual meal customization 🔗 DEPENDS ON: Weekly meal plan
      CRUD API, existing recipe generation infrastructure

  - [x] Create `app/api/meal-plans/weekly/[id]/meals/[mealId]/generate/route.ts`
  - [x] Implement PUT handler for generating specific meal within plan
  - [x] Integrate with existing AI recipe generation service
  - [x] Handle custom preference overrides per meal
  - [x] Add proper error handling and status updates

- [x] **Create meal lock-in API endpoint** ⚠️ BLOCKS: Meal confirmation
      functionality, wizard progression 🔗 DEPENDS ON: Individual meal
      generation API

  - [x] Create `app/api/meal-plans/weekly/[id]/meals/[mealId]/lock/route.ts`
  - [x] Implement PUT handler for confirming meal selection
  - [x] Update meal status and lock timestamp
  - [x] Validate category completion for wizard progression
  - [x] Add unlocking capability for regeneration

- [x] **Create shopping list generation API endpoint** ⚠️ BLOCKS: Shopping list
      functionality 🔗 DEPENDS ON: Shopping lists table migration, meal lock-in
      API

  - [x] Create `app/api/meal-plans/weekly/[id]/shopping-list/route.ts`
  - [x] Implement POST handler for generating consolidated shopping list
  - [x] Create ingredient consolidation and quantity calculation logic
  - [x] Add grocery category organization (produce, dairy, meat, etc.)
  - [x] Prepare data structure for future import integrations

### 🧠 Weekly Meal Planning Service Layer

- [x] **Create weekly meal planning service** ⚠️ BLOCKS: Complex meal planning
      business logic 🔗 DEPENDS ON: Weekly meal planning API infrastructure

  - [x] Create `lib/meal-planning/weekly-meal-planner.ts`
  - [x] Implement plan creation and management functions
  - [x] Add meal category processing logic (breakfast → lunch → dinner → snacks)
  - [x] Create plan validation and completion checking
  - [x] Add plan archiving and cleanup functionality

- [x] **Create ingredient consolidation service** ⚠️ BLOCKS: Shopping list
      generation 🔗 DEPENDS ON: Shopping list generation API, existing recipe
      parsing

  - [x] Create `lib/meal-planning/ingredient-consolidator.ts`
  - [x] Implement ingredient parsing and normalization
  - [x] Add quantity summation for duplicate ingredients
  - [x] Create unit conversion logic (cups to oz, etc.)
  - [x] Add grocery category classification system

- [x] **Create meal preference override system** ⚠️ BLOCKS: Custom meal
      preferences, flexible meal generation 🔗 DEPENDS ON: Individual meal
      generation API, existing nutrition profile system

  - [x] Create `lib/meal-planning/preference-override.ts`
  - [x] Implement global override application for meal categories
  - [x] Add individual meal override handling
  - [x] Create preference merging logic with user defaults
  - [x] Add validation for override parameters

### 🎨 Weekly Meal Planning UI Components

- [x] **Create meal count selection component** ⚠️ BLOCKS: Weekly meal planning
      wizard entry point 🔗 DEPENDS ON: Weekly meal planning service

  - [x] Create `components/meal-planning/MealCountSelector.tsx`
  - [x] Add increment/decrement controls for each meal category
  - [x] Implement 0-7 limit validation per category
  - [x] Add visual feedback and total meal count display
  - [x] Include estimated time and complexity indicators

- [x] **Create wizard navigation component** ⚠️ BLOCKS: Wizard user experience,
      step progression 🔗 DEPENDS ON: Meal count selection component

  - [x] Create `components/meal-planning/WizardNavigation.tsx`
  - [x] Implement progress bar with step indicators
  - [x] Add back/next navigation with validation
  - [x] Create skip logic for categories with 0 meals
  - [x] Add save progress and resume functionality

- [x] **Create meal planning card component** ⚠️ BLOCKS: Individual meal display
      and interaction 🔗 DEPENDS ON: Individual meal generation API, meal
      preference override system

  - [x] Create `components/meal-planning/MealPlanCard.tsx`
  - [x] Implement meal generation states (pending, generating, generated,
        locked)
  - [x] Add day labeling and category indicators
  - [x] Create generate/regenerate/lock action buttons
  - [x] Add custom preference override interface

- [x] **Create preference override component** ⚠️ BLOCKS: Meal customization
      functionality 🔗 DEPENDS ON: Meal preference override system, existing
      nutrition components

  - [x] Create `components/meal-planning/PreferenceOverride.tsx`
  - [x] Add global override interface for entire meal category
  - [x] Implement individual meal override controls
  - [x] Create visual distinction between default and custom preferences
  - [x] Add preset override combinations (low-carb day, quick meals, etc.)

- [x] **Create shopping list component** ⚠️ BLOCKS: Shopping list display and
      management 🔗 DEPENDS ON: Shopping list generation API, ingredient
      consolidation service

  - [x] Create `components/meal-planning/ShoppingList.tsx`
  - [x] Implement organized ingredient display by category
  - [x] Add check-off functionality for purchased items
  - [x] Create manual add/edit/remove ingredient capabilities
  - [x] Add export preparation for future integrations

### 📱 Weekly Meal Planning Pages

- [x] **Create weekly meal planning entry page** ⚠️ BLOCKS: User access to
      weekly meal planning feature 🔗 DEPENDS ON: Meal count selection
      component, usage tracking system for Premium access

  - [x] Create `app/(dashboard)/dashboard/meal-planning/weekly/page.tsx`
  - [x] Add Premium access gate and subscription checking (TODO: Usage tracking
        implementation needed)
  - [x] Implement meal count selection interface
  - [x] Add existing plan resumption functionality
  - [x] Create plan history and management interface

- [x] **Create weekly meal planning wizard page** ⚠️ BLOCKS: Complete wizard
      user experience 🔗 DEPENDS ON: All weekly meal planning UI components,
      wizard navigation component

  - [x] Create `app/(dashboard)/dashboard/meal-planning/weekly/[id]/page.tsx`
  - [x] Implement complete wizard flow with step management
  - [x] Add category processing (breakfast → lunch → dinner → snacks)
  - [x] Create meal card grid layouts for each category
  - [x] Add progress persistence and error recovery
  - ⚠️ NOTE: Some TypeScript type mismatches with component props need fixing

- [x] **Create shopping list page** ⚠️ BLOCKS: Shopping list user interface 🔗
      DEPENDS ON: Shopping list component, shopping list generation API

  - [x] Create
        `app/(dashboard)/dashboard/meal-planning/weekly/[id]/shopping-list/page.tsx`
  - [x] Implement comprehensive shopping list interface
  - [x] Add print-friendly formatting
  - [x] Create export functionality for future integrations
  - [x] Add sharing capabilities for family meal planning
  - ⚠️ NOTE: ShoppingList component props interface needs alignment

### 🔐 Premium Access & Usage Tracking

- [ ] **Update usage tracking for weekly meal planning** ⚠️ BLOCKS: Premium
      feature enforcement 🔗 DEPENDS ON: Existing usage tracking system, weekly
      meal planning API infrastructure

  - [ ] Add weekly meal plan tracking to existing usage system
  - [ ] Implement Essential plan limits (1 plan/week, 10 meals max)
  - [ ] Add Premium plan unlimited access
  - [ ] Create usage analytics for business metrics
  - [ ] Add upgrade prompts for Essential users hitting limits

- [ ] **Create weekly meal planning premium gates** ⚠️ BLOCKS: Premium access
      control 🔗 DEPENDS ON: Updated usage tracking, weekly meal planning pages

  - [ ] Add subscription checking to all weekly meal planning routes
  - [ ] Implement feature limits enforcement in UI components
  - [ ] Add upgrade call-to-action components
  - [ ] Create graceful degradation for Essential users
  - [ ] Add Premium feature highlighting in marketing materials

### 📊 Analytics & Monitoring

- [ ] **Add weekly meal planning analytics tracking** 🔗 DEPENDS ON: All weekly
      meal planning functionality completed

  - [ ] Track plan creation and completion rates
  - [ ] Monitor meal regeneration patterns
  - [ ] Add shopping list generation and usage metrics
  - [ ] Create conversion tracking from Essential to Premium
  - [ ] Implement A/B testing framework for wizard improvements

- [ ] **Create weekly meal planning performance monitoring** 🔗 DEPENDS ON:
      Weekly meal planning analytics tracking

  - [ ] Add API endpoint performance monitoring
  - [ ] Monitor AI generation success rates for batch requests
  - [ ] Track user drop-off points in wizard
  - [ ] Create alerts for high failure rates
  - [ ] Add database performance monitoring for complex queries

### 🧪 Testing & Quality Assurance

- [ ] **Create comprehensive test suite for weekly meal planning** 🔗 DEPENDS
      ON: All weekly meal planning functionality completed

  - [ ] Add unit tests for all service functions
  - [ ] Create integration tests for wizard flow
  - [ ] Add component tests for UI interactions
  - [ ] Create end-to-end tests for complete user journeys
  - [ ] Add performance tests for batch meal generation

- [ ] **Create weekly meal planning test data and fixtures** 🔗 DEPENDS ON:
      Weekly meal planning database schema

  - [ ] Add test meal plans and user scenarios
  - [ ] Create mock meal generation responses
  - [ ] Add test shopping list data
  - [ ] Create subscription tier test scenarios
  - [ ] Add edge case test data (empty plans, max limits, etc.)

---

## 🚀 Phase 2: User Experience (Week 3-4)

// ... existing code ...
