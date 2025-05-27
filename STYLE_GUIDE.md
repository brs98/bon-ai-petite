# AI Petite Style Guide

This document outlines the visual design system and branding guidelines for AI Petite, ensuring consistency across all pages and components.

## 🎨 Brand Identity

### Brand Name
**AI Petite** - Your Personal AI Nutritionist

### Brand Mission
Transform eating habits with AI-powered meal planning, personalized nutrition plans, and seamless grocery delivery integration.

### Brand Personality
- **Professional** yet approachable
- **Health-focused** and wellness-oriented
- **Modern** and tech-forward
- **Trustworthy** and reliable
- **Efficient** and time-saving

## 🎯 Logo & Branding

### Primary Logo
```tsx
<Link href="/" className="flex items-center group">
  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
    <ChefHat className="h-6 w-6 text-white" />
  </div>
  <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
    AI Petite
  </span>
</Link>
```

### Logo Variations

#### Header Logo (Smaller)
```tsx
<div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
  <ChefHat className="h-5 w-5 text-white" />
</div>
<span className="ml-3 text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
  AI Petite
</span>
```

#### Icon Only
```tsx
<div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
  <ChefHat className="h-8 w-8 text-white" />
</div>
```

## 🌈 Color Palette

### Primary Colors
- **Emerald 500**: Primary brand color
- **Emerald 600**: Primary dark
- **Emerald 700**: Primary darker

### Secondary Colors
- **Blue 500**: Secondary accent
- **Blue 600**: Secondary dark

### Gradient Combinations
```css
/* Primary Brand Gradient */
bg-gradient-to-r from-emerald-500 to-emerald-600

/* Logo Text Gradient */
bg-gradient-to-r from-emerald-600 to-blue-600

/* Background Gradient */
bg-gradient-to-br from-emerald-50 via-white to-blue-50

/* Button Hover Gradient */
hover:from-emerald-700 hover:to-emerald-800
```

### Neutral Colors
- **Gray 50**: Light background
- **Gray 100**: Card borders
- **Gray 200**: Dividers
- **Gray 300**: Input borders
- **Gray 500**: Secondary text
- **Gray 600**: Body text
- **Gray 700**: Dark text
- **Gray 900**: Headings

### Status Colors
- **Success**: `text-emerald-500`
- **Warning**: `text-amber-500`
- **Error**: `text-red-500`
- **Info**: `text-blue-500`

## 📝 Typography

### Font Family
**Primary**: Manrope (defined in `globals.css`)
```css
font-family: "Manrope", Arial, Helvetica, sans-serif;
```

### Heading Hierarchy
```css
/* H1 - Hero Titles */
text-5xl lg:text-7xl font-bold text-gray-900

/* H2 - Section Titles */
text-4xl font-bold text-gray-900

/* H3 - Subsection Titles */
text-2xl font-bold text-gray-900

/* H4 - Card Titles */
text-xl font-semibold text-gray-900
```

### Body Text
```css
/* Large Body */
text-xl text-gray-600

/* Regular Body */
text-base text-gray-600

/* Small Text */
text-sm text-gray-500
```

## 🧩 Component Styles

### Buttons

#### Primary Button
```tsx
<Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
  Button Text
</Button>
```

#### Secondary Button
```tsx
<Button 
  variant="outline"
  className="border-2 border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-700 px-8 py-4 text-lg rounded-xl transition-all duration-200"
>
  Button Text
</Button>
```

#### CTA Button (White on colored background)
```tsx
<Button className="bg-white text-emerald-600 hover:bg-gray-50 px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
  Button Text
</Button>
```

### Form Elements

#### Input Fields
```tsx
<Input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200" />
```

#### Labels
```tsx
<Label className="block text-sm font-medium text-gray-700 mb-2">
  Label Text
</Label>
```

### Cards

#### Primary Card
```tsx
<div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
  {/* Card content */}
</div>
```

#### Feature Card
```tsx
<div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
  {/* Card content */}
</div>
```

#### Pricing Card
```tsx
<div className="relative bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
  {/* Card content */}
</div>
```

#### Popular Pricing Card
```tsx
<div className="relative bg-white rounded-3xl shadow-xl border border-emerald-200 ring-2 ring-emerald-500 p-8">
  {/* Popular badge */}
  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
      <Sparkles className="h-4 w-4 mr-1" />
      Most Popular
    </div>
  </div>
  {/* Card content */}
</div>
```

## 🎭 Icons

### Primary Icon
**ChefHat** from Lucide React - Represents cooking, nutrition, and meal planning

### Supporting Icons
- **Sparkles**: AI/Magic features
- **ShoppingCart**: Shopping integration
- **Clock**: Time-saving features
- **Heart**: Health and wellness
- **Users**: Family/community features
- **CheckCircle**: Benefits and confirmations
- **ArrowRight**: Call-to-action arrows

### Icon Usage
```tsx
// Feature icons with colored backgrounds
<div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white mb-6 flex items-center justify-center">
  <Sparkles className="h-8 w-8" />
</div>

// Small accent icons
<CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />

// Navigation icons
<ChefHat className="h-5 w-5 text-white" />
```

## 🏗️ Layout Patterns

### Page Structure
```tsx
<main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
  {/* Page content */}
</main>
```

### Container Widths
```css
/* Full width container */
max-w-7xl

/* Content container */
max-w-4xl

/* Form container */
max-w-md
```

### Section Spacing
```css
/* Large sections */
py-20

/* Medium sections */
py-12

/* Small sections */
py-8
```

## 🎨 Background Patterns

### Primary Background
```css
bg-gradient-to-br from-emerald-50 via-white to-blue-50
```

### Section Backgrounds
```css
/* White sections */
bg-white

/* Light accent sections */
bg-gradient-to-r from-emerald-50 to-blue-50

/* CTA sections */
bg-gradient-to-r from-emerald-600 to-blue-600
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: `< 640px`
- **Tablet**: `640px - 1024px`
- **Desktop**: `> 1024px`

### Mobile-First Approach
Always design for mobile first, then enhance for larger screens using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).

## ✨ Animation & Transitions

### Standard Transitions
```css
transition-all duration-200
```

### Hover Effects
```css
/* Scale on hover */
group-hover:scale-105 transition-transform duration-200

/* Shadow enhancement */
shadow-lg hover:shadow-xl transition-all duration-200
```

### Loading States
```tsx
<Loader2 className="animate-spin mr-2 h-4 w-4" />
```

## 📋 Content Guidelines

### Voice & Tone
- **Professional** but friendly
- **Clear** and concise
- **Benefit-focused** rather than feature-focused
- **Action-oriented** with strong CTAs
- **Health-conscious** language

### Key Messaging
- "AI-powered nutrition"
- "Personalized meal plans"
- "Seamless grocery integration"
- "Transform your eating habits"
- "Your personal AI nutritionist"

### Call-to-Action Text
- "Start Free Trial"
- "Start Your Journey"
- "Get Started"
- "Transform Your Eating"
- "Join Thousands of Users"

## 🔧 Implementation Notes

### Color System
All colors are defined in `globals.css` using CSS custom properties and Tailwind's color system. Use Tailwind classes like `text-emerald-600`, `bg-gray-100`, etc. rather than hardcoded hex values.

### Font Configuration
The Manrope font is configured in `globals.css` and applied globally to the body element.

## 📚 Usage Examples

### Page Header
```tsx
<header className="border-b border-gray-200 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
    {/* Logo */}
    {/* Navigation */}
  </div>
</header>
```

### Hero Section
```tsx
<section className="relative py-20 lg:py-32 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10"></div>
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Hero content */}
  </div>
</section>
```

### Feature Section
```tsx
<section className="py-20 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Feature content */}
  </div>
</section>
```

---

## 🎯 Quick Reference

### Brand Colors (Tailwind Classes)
- Primary: `text-emerald-600` / `bg-emerald-600`
- Secondary: `text-blue-600` / `bg-blue-600`
- Success: `text-emerald-500` / `bg-emerald-500`
- Text: `text-gray-900`

### Key Components
- Logo: ChefHat + "AI Petite" gradient text
- Buttons: Emerald gradients with `rounded-xl`
- Cards: White with `shadow-xl` and `rounded-3xl`
- Inputs: Emerald focus states with `rounded-xl`

### Typography Classes
- Font: Manrope (defined in globals.css)
- Headings: `font-bold text-gray-900`
- Body: `text-gray-600`
- Small: `text-gray-500`

This style guide should be referenced for all new pages and components to maintain visual consistency across the AI Petite application. 