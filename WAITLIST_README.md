# Bon AI Petite Waitlist System

A comprehensive waitlist system integrated into the Bon AI Petite platform to
capture user interest and gather feedback for feature prioritization.

## 🚀 Features

### For Users

- **Beautiful Signup Form**: Comprehensive form with feature preferences,
  dietary goals, and restrictions
- **Feature Prioritization**: Users can select which features matter most to
  them
- **Automatic Scoring**: System calculates priority scores based on user
  responses
- **Success Feedback**: Clear confirmation and next steps after signup

### For Admins

- **Admin Dashboard**: View waitlist statistics and entries at `/admin/waitlist`
- **Analytics**: Feature priority analysis and dietary goals breakdown
- **Entry Management**: View and manage waitlist entries with priority scores
- **API Access**: RESTful API for programmatic access to waitlist data

## 📊 Database Schema

The waitlist system uses a `waitlist_entries` table with the following key
fields:

- `email` - User's email address (unique)
- `name` - User's full name
- `reasonForInterest` - Detailed reason for joining (required)
- `featurePriorities` - Array of selected feature priorities
- `dietaryGoals` - Array of health/nutrition goals
- `dietaryRestrictions` - Array of dietary restrictions
- `cookingExperience` - Beginner/Intermediate/Advanced
- `householdSize` - Number of people they cook for
- `priorityScore` - Automatically calculated based on responses
- `status` - waiting/invited/joined/declined

## 🎯 Priority Scoring System

The system automatically calculates priority scores based on:

- **Base Score**: 10 points for joining
- **Detailed Responses**: +5 points for detailed reason (>50 characters)
- **Dietary Goals**: +3 points for specific goals
- **Dietary Restrictions**: +2 points for restrictions
- **Feature Priorities**: +2 points per selected feature
- **Household Size**: +2 points for families (>1 person)
- **Cooking Experience**: +1 point for providing experience level

## 🛠️ Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```bash
ADMIN_API_KEY=your-secure-admin-api-key-here
```

### 2. Database Migration

The waitlist table is already created. If you need to recreate it:

```bash
pnpm db:migrate
```

### 3. Access Points

#### User-facing:

- **Landing Page**: Waitlist section integrated into main page
- **Dedicated Page**: `/waitlist` - Beautiful standalone waitlist page
- **API Endpoint**: `POST /api/waitlist` - Submit waitlist entries

#### Admin-facing:

- **Admin Dashboard**: `/admin/waitlist` - View statistics and entries
- **API Endpoint**: `GET /api/waitlist/admin` - Programmatic access

## 📈 Usage Examples

### View Waitlist Statistics

```bash
curl -H "x-api-key: your-admin-api-key" \
  https://yourdomain.com/api/waitlist/admin
```

### Submit Waitlist Entry

```bash
curl -X POST https://yourdomain.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "reasonForInterest": "I want to improve my nutrition and need help with meal planning",
    "featurePriorities": ["Meal Planning", "Recipe Generation"],
    "dietaryGoals": ["lose_weight", "improve_health"],
    "cookingExperience": "intermediate"
  }'
```

## 🎨 Customization

### Styling

The waitlist system uses your existing design system:

- Tailwind CSS classes
- shadcn/ui components
- Bon AI Petite branding and colors
- Framer Motion animations

### Form Fields

You can easily modify the form fields in `components/WaitlistSignup.tsx`:

- Add/remove feature priorities
- Update dietary goals and restrictions
- Modify validation rules
- Change the priority scoring algorithm

### Admin Dashboard

Customize the admin dashboard in `app/admin/waitlist/page.tsx`:

- Add new analytics views
- Modify the data display format
- Add export functionality
- Implement user management features

## 🔒 Security

- **API Key Protection**: Admin endpoints require API key authentication
- **Input Validation**: All form inputs are validated with Zod schemas
- **SQL Injection Protection**: Uses Drizzle ORM with parameterized queries
- **Rate Limiting**: Consider adding rate limiting for production use

## 📱 Integration

The waitlist system is fully integrated with your existing Bon AI Petite
platform:

- **Landing Page**: Waitlist section with smooth scroll navigation
- **Navigation**: "Join Waitlist" button in hero section
- **Branding**: Consistent Bon AI Petite branding throughout
- **Database**: Uses existing Drizzle setup and PostgreSQL database

## 🚀 Next Steps

1. **Set Admin API Key**: Add `ADMIN_API_KEY` to your environment variables
2. **Test the Flow**: Visit `/waitlist` to test the signup process
3. **Monitor Responses**: Use the admin dashboard to analyze user preferences
4. **Email Integration**: Consider adding email notifications for new signups
5. **Analytics**: Add Google Analytics or similar for conversion tracking

## 📞 Support

The waitlist system is designed to be self-contained and easy to maintain. All
code is well-documented and follows your existing patterns and conventions.
