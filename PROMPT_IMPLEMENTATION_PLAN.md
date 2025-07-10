# Prompt Builder & Recipe Generator Refactor Implementation Plan

This document outlines the step-by-step plan to generalize and improve the maintainability of hard-coded data in `prompt-builder.ts` and `recipe-generator.ts`.

---

## 1. Default Nutrition Targets

**Goal:** Move default nutrition targets (calories, protein, carbs, fat, servings, time, difficulty, meal type, complexity) from hardcoded values to a configurable location.

**Steps:**
- [ ] Create a new file: `lib/ai/defaultNutritionProfile.ts`.
- [ ] Define and export a `DEFAULT_NUTRITION_PROFILE` object with all default values.
- [ ] Update `prompt-builder.ts` to import and use these defaults in `buildUserPreferencesSection`.
- [ ] (Optional) If admin configurability is desired, design a schema and migration for storing defaults in the database, and add a loader utility.
- [ ] Add/Update tests to ensure defaults are respected and overridable.

**Dependencies:** None (unless DB config is implemented).

---

## 2. Hard-Coded Ingredient & Cuisine Avoidance

**Goal:** Refactor hard-coded avoided ingredients and cuisines to be dynamically sourced.

**Steps:**
- [ ] Move the lists of avoided ingredients and cuisines to a new config file: `lib/ai/varietyConfigDefaults.ts`.
- [ ] Update `buildAvoidRepetitionSection` to accept these via a `VarietyConfig` parameter, falling back to the config file if not provided.
- [ ] Refactor any usages in `recipe-generator.ts` to use the new config.
- [ ] (Optional) Add logic to pull from user feedback or recent meals if available.

**Dependencies:** None.

---

## 3. Cooking Method Keywords

**Goal:** Externalize the array of cooking method keywords.

**Steps:**
- [ ] Create `lib/ai/cookingMethods.ts` and export a `COOKING_METHODS` array.
- [ ] Replace all hardcoded arrays in `prompt-builder.ts` and `recipe-generator.ts` with imports from this file.
- [ ] Add/Update tests to ensure all methods are covered.

**Dependencies:** None.

---

## 4. Recipe Schema Format

**Goal:** Replace the hardcoded Recipe TypeScript schema string in prompt templates with a dynamic import.

**Steps:**
- [ ] Create `lib/ai/promptTemplates.ts` and export a function or constant for the Recipe schema string.
- [ ] Optionally, generate the schema string from the actual TypeScript type (using a tool or manual sync).
- [ ] Update `buildSchemaSection` to import and use this template.
- [ ] Ensure the schema stays in sync with the actual type definition.

**Dependencies:** None (unless auto-generation is implemented).

---

## 5. Static Quality Requirements

**Goal:** Make quality requirements (e.g., prep time, serving size) dynamic.

**Steps:**
- [ ] Refactor `buildFinalQualityCheckSection` to accept parameters for thresholds (e.g., from `request` or `userContext`).
- [ ] Replace hardcoded values (e.g., "20 minutes or less") with dynamic values.
- [ ] Update all call sites to pass the correct values.
- [ ] Add/Update tests for dynamic quality checks.

**Dependencies:** None.

---

## 6. Goal-Based Prompt Content

**Goal:** Extract goal-based prompt content to a config file or make it editable.

**Steps:**
- [ ] Create `lib/ai/goalPrompts.ts` and export a map/object of goal prompt strings.
- [ ] Update `buildGoalSpecificPrompt` to import and use this config.
- [ ] (Optional) Add admin CMS or user profile editing if needed.
- [ ] Add/Update tests for goal prompt selection.

**Dependencies:** None (unless CMS integration is desired).

---

## 7. Weekly Meal Plan Prompt Formatting

**Goal:** Move the weekly meal plan prompt formatting to a reusable template system.

**Steps:**
- [ ] Create or update `lib/ai/promptTemplates.ts` to include a template for weekly meal plan prompts.
- [ ] Refactor `buildWeeklyMealPlanPrompt` to use this template, passing in dynamic values as needed.
- [ ] Ensure all prompt formatting logic is centralized and reusable.
- [ ] Add/Update tests for weekly meal plan prompt generation.

**Dependencies:** None.

---

## General Notes
- All new config and constants files should be documented and exported from a central index if appropriate.
- Update all relevant tests and add new ones for edge cases.
- Ensure all changes follow project conventions and are reviewed for performance and security. 