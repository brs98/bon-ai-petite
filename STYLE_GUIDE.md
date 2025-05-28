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
  <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
    <ChefHat className="h-6 w-6 text-primary-foreground" />
  </div>
  <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
    AI Petite
  </span>
</Link>
```

### Logo Variations

#### Header Logo (Smaller)
```tsx
<div className="w-8 h-8 bg-gradient-to-r from-primary to-primary rounded-lg flex items-center justify-center">
  <ChefHat className="h-5 w-5 text-primary-foreground" />
</div>
<span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
  AI Petite
</span>
```

#### Icon Only
```tsx
<div className="w-16 h-16 bg-gradient-to-r from-primary to-primary rounded-2xl flex items-center justify-center">
  <ChefHat className="h-8 w-8 text-primary-foreground" />
</div>
```

## 🌈 Color Palette

### Semantic Colors
All colors use semantic naming for consistency and maintainability:

- **Primary**: Main brand color (red-based)
- **Secondary**: Light background tints
- **Accent**: Warm accent color (orange-based)
- **Muted**: Subtle text and backgrounds
- **Destructive**: Error states
- **Foreground**: Main text color
- **Background**: Page backgrounds
- **Border**: Borders and dividers

### Gradient Combinations
```css
/* Primary Brand Gradient */
bg-gradient-to-r from-primary to-primary

/* Logo Text Gradient */
bg-gradient-to-r from-primary to-accent

/* Background Gradient */
bg-gradient-to-br from-secondary via-background to-secondary

/* Button Hover Gradient */
hover:from-primary/90 hover:to-primary/90
```

### Status Colors
- **Success**: `text-primary`
- **Warning**: `text-accent`
- **Error**: `text-destructive`
- **Info**: `text-accent`

## 📝 Typography

### Font Family
**Primary**: Manrope (defined in `globals.css`)
```css
font-family: "Manrope", Arial, Helvetica, sans-serif;
```

### Heading Hierarchy
```css
/* H1 - Hero Titles */
text-5xl lg:text-7xl font-bold text-foreground

/* H2 - Section Titles */
text-4xl font-bold text-foreground

/* H3 - Subsection Titles */
text-2xl font-bold text-foreground

/* H4 - Card Titles */
text-xl font-semibold text-foreground
```

### Body Text
```css
/* Large Body */
text-xl text-muted-foreground

/* Regular Body */
text-base text-muted-foreground

/* Small Text */
text-sm text-muted-foreground
```

## 🧩 Component Styles

### Buttons

#### Primary Button
```tsx
<Button className="bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-primary-foreground px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
  Button Text
</Button>
```

#### Secondary Button
```tsx
<Button 
  variant="outline"
  className="border-2 border-border hover:border-primary text-muted-foreground hover:text-primary px-8 py-4 text-lg rounded-xl transition-all duration-200"
>
  Button Text
</Button>
```

#### CTA Button (White on colored background)
```tsx
<Button className="bg-background text-primary hover:bg-background/90 px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
  Button Text
</Button>
```

### Form Elements

#### Input Fields
```tsx
<Input className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors duration-200" />
```

#### Labels
```tsx
<Label className="block text-sm font-medium text-foreground mb-2">
  Label Text
</Label>
```

### Cards

#### Primary Card
```tsx
<div className="bg-card rounded-3xl shadow-xl p-8 border border-border">
  {/* Card content */}
</div>
```

#### Feature Card
```tsx
<div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
  {/* Card content */}
</div>
```

#### Pricing Card
```tsx
<div className="relative bg-card rounded-3xl shadow-xl border border-border p-8">
  {/* Card content */}
</div>
```

#### Popular Pricing Card
```tsx
<div className="relative bg-card rounded-3xl shadow-xl border border-primary/20 ring-2 ring-primary p-8">
  {/* Popular badge */}
  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center">
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
<div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-primary text-primary-foreground mb-6 flex items-center justify-center">
  <Sparkles className="h-8 w-8" />
</div>

// Small accent icons
<CheckCircle className="h-5 w-5 text-primary mr-2" />

// Navigation icons
<ChefHat className="h-5 w-5 text-primary-foreground" />
```

## 🏗️ Layout Patterns

### Page Structure
```tsx
<main className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary">
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
bg-gradient-to-br from-secondary via-background to-secondary
```

### Section Backgrounds
```css
/* Card sections */
bg-card

/* Light accent sections */
bg-gradient-to-r from-primary/10 to-accent/10

/* CTA sections */
bg-gradient-to-r from-primary to-primary/90
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
All colors are defined in `globals.css` using CSS custom properties with semantic naming. Always use semantic classes like `text-primary`, `bg-card`, `border-border`, etc. rather than specific color names or hardcoded hex values.

### Font Configuration
The Manrope font is configured in `globals.css` and applied globally to the body element.

## 📚 Usage Examples

### Page Header
```tsx
<header className="border-b border-border bg-background">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
    {/* Logo */}
    {/* Navigation */}
  </div>
</header>
```

### Hero Section
```tsx
<section className="relative py-20 lg:py-32 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10"></div>
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Hero content */}
  </div>
</section>
```

### Feature Section
```tsx
<section className="py-20 bg-background">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Feature content */}
  </div>
</section>
```

---

## 🎯 Quick Reference

### Semantic Color Classes
- Primary: `text-primary` / `bg-primary`
- Secondary: `text-secondary-foreground` / `bg-secondary`
- Accent: `text-accent` / `bg-accent`
- Text: `text-foreground`
- Muted: `text-muted-foreground`
- Background: `bg-background`
- Card: `bg-card`
- Border: `border-border`

### Key Components
- Logo: ChefHat + "AI Petite" gradient text
- Buttons: Primary gradients with `rounded-xl`
- Cards: Card background with `shadow-xl` and `rounded-3xl`
- Inputs: Ring focus states with `rounded-xl`

### Typography Classes
- Font: Manrope (defined in globals.css)
- Headings: `font-bold text-foreground`
- Body: `text-muted-foreground`
- Small: `text-muted-foreground text-sm`

This style guide should be referenced for all new pages and components to maintain visual consistency across the AI Petite application. 