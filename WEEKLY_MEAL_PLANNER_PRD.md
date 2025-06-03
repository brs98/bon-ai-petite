# 🗓️ Weekly Meal Planner: Product Requirements Document

## 📋 Overview

### Feature Summary
A comprehensive weekly meal planning wizard that allows users to generate complete meal plans for an entire week, with customizable meal counts per category, step-by-step generation process, and integrated shopping list creation.

### Target Users
- **Primary**: Premium subscribers who want comprehensive meal planning
- **Secondary**: Essential users (with limited access) who want to try advanced planning

### Business Goals
- Increase Premium subscription conversions
- Improve user engagement and retention
- Differentiate from basic recipe generation
- Build foundation for grocery delivery integrations

---

## 🎯 Core Requirements

### 1. Meal Selection Interface

**User Story**: As a user, I want to specify how many meals I need for each category so I can plan my week according to my schedule.

**Requirements**:
- Allow selection of 0-7 meals for each category:
  - Breakfasts
  - Lunches 
  - Dinners
  - Snacks
- Display clear visual indicators of selections
- Show total meal count and estimated planning time
- Validate selections (at least 1 meal total required)

**Acceptance Criteria**:
- [ ] User can adjust meal counts with increment/decrement buttons
- [ ] Maximum of 7 meals per category enforced
- [ ] Visual feedback shows selected counts clearly
- [ ] "Continue" button only enabled when valid selection made

### 2. Wizard-Based Generation Flow

**User Story**: As a user, I want a guided step-by-step process so I can systematically generate meals for each category without feeling overwhelmed.

**Requirements**:
- Sequential processing: Breakfasts → Lunches → Dinners → Snacks
- Skip categories with 0 selected meals
- Clear progress indication throughout wizard
- Ability to navigate back to previous steps
- Save progress and resume later capability

**Acceptance Criteria**:
- [ ] Progress bar shows current step and remaining steps
- [ ] Clear category headers and day labels
- [ ] Back/Next navigation with validation
- [ ] Session persistence across browser refreshes

### 3. Meal Card Generation System

**User Story**: As a user, I want to see individual cards for each meal day so I can focus on one meal at a time and make specific customizations.

**Requirements**:
- Generate cards based on selected meal counts (e.g., 4 breakfast cards for 4 selected breakfasts)
- Label cards with day indicators (Day 1, Day 2, etc.)
- Show generation status for each card (pending, generating, generated, locked)
- Allow individual meal customization before generation

**Acceptance Criteria**:
- [ ] Cards display in logical grid layout
- [ ] Clear visual states for each generation status
- [ ] Day labels are prominent and clear
- [ ] Cards maintain state throughout wizard process

### 4. Preference Override System

**User Story**: As a user, I want to customize meal preferences before generation so I can ensure variety or accommodate specific needs for certain days.

**Requirements**:
- Default to user's existing nutrition profile preferences
- Allow global overrides for entire meal category
- Allow individual meal overrides per card
- Override options include:
  - Cuisine type
  - Dietary restrictions
  - Macro targets (calories, protein, carbs, fat)
  - Cooking complexity
  - Prep time preferences

**Acceptance Criteria**:
- [ ] Clear indication when using default vs. custom preferences
- [ ] Global override affects all meals in current category
- [ ] Individual overrides only affect specific meal card
- [ ] Preference changes are visually distinct from defaults

### 5. Generation Control & Lock-in Process

**User Story**: As a user, I want control over when meals generate and the ability to regenerate until satisfied so I can ensure I'm happy with all meal choices.

**Requirements**:
- Manual trigger for meal generation (not automatic)
- Individual regeneration capability per meal card
- Lock-in mechanism to confirm satisfaction with meal
- Progress tracking showing locked vs. unlocked meals
- Category completion requirement before advancing

**Acceptance Criteria**:
- [ ] "Generate" button triggers individual meal creation
- [ ] "Regenerate" option available until meal is locked
- [ ] "Lock In" button confirms meal selection
- [ ] Cannot proceed to next category until all meals locked
- [ ] Clear visual feedback for locked vs. unlocked state

### 6. Shopping List Generation

**User Story**: As a user, I want an automatic shopping list created from my meal plan so I can efficiently purchase all needed ingredients.

**Requirements**:
- Consolidate ingredients across all generated meals
- Organize by grocery store categories (produce, dairy, meat, etc.)
- Handle quantity calculations and unit conversions
- Remove duplicate ingredients with quantity summing
- Prepare data structure for future import integrations
- Allow editing and customization of shopping list

**Acceptance Criteria**:
- [ ] All meal ingredients automatically included
- [ ] Quantities properly summed for duplicate ingredients
- [ ] Organized in logical shopping categories
- [ ] Users can check off purchased items
- [ ] Export functionality (JSON/CSV for future integrations)
- [ ] Manual add/remove/edit capability

---

## 🔒 Access Control & Limits

### Subscription Tiers

**Essential Plan**:
- Limited to 1 weekly meal plan per week
- Maximum 10 total meals per plan
- Basic shopping list functionality

**Premium Plan**:
- Unlimited weekly meal plans
- Up to 28 total meals per plan (7x4 categories)
- Advanced shopping list with export capabilities
- Priority generation processing

### Usage Tracking
- Track weekly meal plan generations
- Monitor shopping list creations
- Log user completion rates by category

---

## 🎨 User Experience Requirements

### Design Principles
- **Progressive Disclosure**: Show only relevant information at each step
- **Clear Progress**: Always indicate current position and next steps
- **Forgiving Flow**: Allow back navigation and correction
- **Visual Hierarchy**: Distinguish between categories, days, and individual meals

### Key Interactions
- **Smooth Transitions**: Animated progression between wizard steps
- **Optimistic UI**: Show generating state immediately on user action
- **Error Recovery**: Clear error messages with actionable next steps
- **Mobile Responsive**: Full functionality on mobile devices

### Loading States
- Meal generation progress indicators
- Skeleton loading for meal cards
- Shopping list compilation progress
- Clear timeout handling for long operations

---

## 🔧 Technical Requirements

### Data Structure
```typescript
interface WeeklyMealPlan {
  id: string;
  userId: string;
  planName: string;
  mealCounts: {
    breakfasts: number;
    lunches: number;
    dinners: number;
    snacks: number;
  };
  meals: MealPlanItem[];
  shoppingList: ShoppingListItem[];
  status: 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

interface MealPlanItem {
  id: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dayNumber: number;
  recipeId?: string;
  customPreferences?: Partial<NutritionPreferences>;
  status: 'pending' | 'generating' | 'generated' | 'locked';
  generatedAt?: Date;
  lockedAt?: Date;
}
```

### API Endpoints Required
- `POST /api/meal-plans/weekly/create` - Start new weekly plan
- `PUT /api/meal-plans/weekly/{id}/meals/{mealId}/generate` - Generate specific meal
- `PUT /api/meal-plans/weekly/{id}/meals/{mealId}/lock` - Lock meal selection
- `POST /api/meal-plans/weekly/{id}/shopping-list` - Generate shopping list
- `GET /api/meal-plans/weekly/{id}` - Retrieve plan progress

### Performance Considerations
- Batch meal generation where possible
- Cache common preference combinations
- Optimize shopping list consolidation algorithms
- Implement request debouncing for rapid regenerations

---

## 📊 Success Metrics

### Primary KPIs
- **Completion Rate**: % of users who complete entire weekly plan
- **Lock-in Rate**: % of generated meals that get locked without regeneration
- **Shopping List Usage**: % of completed plans that generate shopping lists
- **Time to Complete**: Average time from start to finished plan

### Secondary KPIs
- **Premium Conversion**: Essential users upgrading after trying feature
- **Plan Variety**: Distribution of meal counts across categories
- **Regeneration Rate**: Average regenerations per meal before lock-in
- **Category Completion**: Drop-off rates by meal category

### User Satisfaction
- Feature satisfaction surveys
- Weekly plan usage frequency
- Shopping list export rates
- Support ticket volume related to feature

---

## 🚀 Implementation Phases

### Phase 1: Core Wizard Infrastructure
- Meal selection interface
- Wizard navigation system
- Basic meal card generation
- Progress persistence

### Phase 2: Generation & Preferences
- Preference override system
- Meal generation integration
- Lock-in mechanism
- Category progression logic

### Phase 3: Shopping List Integration
- Ingredient consolidation
- Shopping list generation
- Basic shopping list UI
- Export preparation for future integrations

### Phase 4: Polish & Optimization
- Performance optimization
- Advanced error handling
- Mobile responsiveness
- Analytics integration

---

## 🔮 Future Enhancements

### Phase 2+ Features
- **Template Plans**: Save and reuse successful meal plans
- **Smart Suggestions**: AI-powered meal recommendations based on past preferences
- **Collaborative Planning**: Share and collaborate on meal plans with family
- **Calendar Integration**: Export meal plans to calendar applications

### Integration Roadmap
- **Instacart API**: Direct shopping list import
- **Amazon Fresh**: Grocery delivery integration
- **Meal Kit Services**: Option to convert recipes to meal kit orders
- **Nutrition Tracking**: Integration with fitness apps for macro tracking 