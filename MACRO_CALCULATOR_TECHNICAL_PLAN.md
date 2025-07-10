# 🥗 Macro Calculator Technical Plan

## Overview

This document outlines the technical plan for implementing a modern macro
calculator in the AI Petite app. The calculator will provide personalized daily
calorie and macronutrient (protein, carbs, fat) recommendations based on user
profile data, activity, and goals, using industry-standard formulas and best
practices.

---

## 1. Requirements

- **Inputs:**
  - Age
  - Gender (male, female, other/unspecified)
  - Height (cm or ft/in)
  - Weight (kg or lbs)
  - Activity level (sedentary, lightly active, moderately active, very active,
    super active)
  - Goal (lose, maintain, gain)
  - (Optional) Preferred macro split or dietary goal (e.g., keto, high-protein)
- **Outputs:**
  - Total daily calories (TDEE, adjusted for goal)
  - Grams of protein, carbs, fat per day
  - Visual breakdown (pie chart/bar)
  - (Optional) Download/export, meal suggestions

---

## 2. Calculation Steps

### Step 1: Calculate BMR (Basal Metabolic Rate)

- **Mifflin-St Jeor Equation:**
  - Men: `BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5`
  - Women: `BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161`
  - Other/Unspecified: Use average of male/female or prompt user

### Step 2: Calculate TDEE (Total Daily Energy Expenditure)

- Multiply BMR by activity multiplier:
  - Sedentary: 1.2
  - Lightly active: 1.375
  - Moderately active: 1.55
  - Very active: 1.725
  - Super active: 1.9

### Step 3: Adjust for Goal

- Lose Weight: TDEE − 10–20% (caloric deficit)
- Maintain: TDEE
- Gain Muscle: TDEE + 10–20% (caloric surplus)

### Step 4: Set Macro Ratios

- Default splits (by goal or dietary preference):
  - Balanced: 30% protein / 40% carbs / 30% fat
  - Low-carb/Keto: 25% protein / 5% carbs / 70% fat
  - Muscle Gain: 35% protein / 45% carbs / 20% fat
  - Fat Loss: 40% protein / 30% carbs / 30% fat
- Or, base protein on grams per body weight:
  - Protein: 1.6–2.2g/kg (0.8–1g/lb) of lean body mass
  - Fat: 0.8–1g/kg (or 20–35% of calories)
  - Carbs: Remaining calories
- **Macro calories per gram:**
  - Protein: 4 kcal/g
  - Carbs: 4 kcal/g
  - Fat: 9 kcal/g

---

## 3. Schema & Type Changes

- Add `gender` field to nutrition profile (enum: 'male', 'female', 'other',
  'unspecified')
- (Optional) Add custom macro split or dietary goal field
- Update TypeScript types and Zod schema
- Update Drizzle schema and generate migration

---

## 4. API & Backend Logic

- Update nutrition profile API to accept, validate, and store `gender`
- Refactor macro calculation logic:
  - Use Mifflin-St Jeor for BMR
  - Apply activity multiplier for TDEE
  - Adjust for goal (deficit/surplus)
  - Apply macro split (default or user-selected)
- Support for dietary presets (e.g., keto, high-protein)
- Return calculated macros and calories in API responses

---

## 5. UI/UX

- Add gender selection to profile setup (radio/select)
- Show macro breakdown visually (pie chart/bar)
- Display calculation steps and explanations
- (Optional) Allow user to select/customize macro split
- Update review/summary screens to show new data

---

## 6. Testing

- Add unit tests for macro calculation (BMR, TDEE, goal adjustment, macro split)
- Update integration tests for nutrition profile API (with gender)
- Add UI tests for new profile setup and macro display

---

## 7. Documentation

- Update user-facing help/docs to explain macro calculation, gender impact, and
  macro splits
- Update developer docs for new schema, API, and calculation logic

---

## 8. Future Enhancements (Optional)

- Body fat % estimation or input
- Custom macro ratios
- Weekly check-in to update weight/progress
- Suggest daily meals that hit macros
- Save/export profile

---

## 9. Example Calculation

**Person:**

- Sex: Male
- Age: 30
- Height: 180 cm
- Weight: 75 kg
- Activity: Moderate (1.55)
- Goal: Maintenance

**Step 1 (BMR):** 10×75 + 6.25×180 − 5×30 + 5 = 1,733 kcal

**Step 2 (TDEE):** 1,733 × 1.55 ≈ 2,686 kcal

**Step 3 (Goal):** Maintain = 2,686 kcal

**Step 4 (Macro Ratio = 30/40/30):**

- Protein: 30% of 2,686 = 805.8 kcal → ÷4 = 201g
- Carbs: 40% = 1,074.4 kcal → ÷4 = 269g
- Fat: 30% = 805.8 kcal → ÷9 = 89.5g
