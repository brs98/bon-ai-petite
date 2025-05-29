# 🧠 Recipe Generation Service: Infrastructure & Strategy

## 🔍 System Overview

### Goal

Build a robust AI-powered recipe generation pipeline tailored to individual user profiles, ensuring nutritional accuracy, variety, and personalization.

### Key Features

- Personalized prompt creation
- Multi-recipe generation and ranking
- Nutritional validation
- Feedback-based refinement
- Ingredient parsing for shopping integration

---

## 🧠 A. Recipe Generation Pipeline

```
User Profile → Prompt Builder → AI Model → Recipe Validator → User UI
```

### 1. User Profile Data

- Calories, macros, allergies
- Preferences (vegan, gluten-free, cuisine)
- Goals (lose/gain/maintain weight/muscle)

### 2. Prompt Builder

Crafts high-context prompts for the model. Example template:

```
Create a [Mediterranean, gluten-free] dinner recipe for a [28-year-old male, 6'1", 190lbs] who wants to gain muscle.
Target ~700 kcal, with at least 40g protein, 60g carbs, and less than 25g fat.
Use accessible ingredients. Provide a name, ingredients list with quantities, and clear cooking instructions.
```

- Uses few-shot learning with recipe examples
- Incorporates feedback from user decline data

---

## ⚙️ B. AI Model Strategy

### 1. Model Options

- **OpenAI GPT-4 Turbo** (default)
- **Custom fine-tuned model** (optional, trained on real recipe corpora)

### 2. Post-Processing

- **Nutritional Validation**:

  - APIs: Edamam, Spoonacular, USDA
  - Match recipe output against user macro/calorie goals

- **Ingredient Parsing**:

  - Extract name, quantity, unit
  - Normalize for matching in Instacart

- **Instruction Scoring**:

  - NLP checks for clarity, step ordering, and completeness

---

## 📊 C. Evaluation & Feedback Loop

### 1. User Feedback

- "Like / Dislike" buttons
- Reasons for rejection: Too complex, disliked ingredients, etc.
- Stored for use in future generations

### 2. Recipe Re-ranking (optional)

- Generate 3–5 candidates
- Rank by:

  - Nutritional match
  - Ingredient availability
  - User preference history
  - Complexity score (steps, prep time)

---

## 🧪 D. Example Implementation Strategy

### Tech Stack

- **Prompt Builder & Pipeline**: TypeScript (Next.js/Node.js)
- **AI**: AI SDK with OpenAI provider (@ai-sdk/openai)
- **Validation**: Zod for schema validation
- **Nutrition APIs**: Edamam, Spoonacular, USDA
- **Storage**: MongoDB / PostgreSQL for recipes + feedback

### Service Flow (Simplified)

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const RecipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string()
  })),
  instructions: z.array(z.string()),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number()
  })
});

async function generateRecipe(userProfile: UserProfile): Promise<Recipe> {
  const prompt = buildPrompt(userProfile);
  
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: 'You are a professional chef and nutritionist. Generate recipes that match exact nutritional requirements.',
    prompt,
  });

  const recipe = parseRecipe(text);
  
  if (!validateNutrition(recipe, userProfile.goals)) {
    return generateRecipe(userProfile); // retry or tweak
  }

  return recipe;
}
```

---

## �� Bonus Features for Delight

- **Smart Suggestions**: Ingredient swaps based on preferences
- **Trending Recipes**: Popular options among similar users
- **Skill Level Filter**: Recipes by cooking ability
- **Video Mode**: Auto-linked instructional videos
