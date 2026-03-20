# EatWell — Claude Code Guide

## What this project is
Single-household meal planner web app. No auth, one shared URL. Minimal, opinionated UI (Nikita Bier-style: one action per screen, large typography, no clutter).

## Stack
- **Next.js 14** (App Router) — `app/` directory
- **Tailwind CSS** — utility-first styling, no component library
- **Prisma 5.7 + Neon Postgres** — cloud DB via Vercel integration
- **Vercel Blob** — image storage for meal photos
- **Anthropic SDK** — Claude claude-sonnet-4-6 for meal suggestions + prefill, claude-haiku-4-5 for shopping list canonicalization

## Running the app

**Node 20 required** — system default is Node 18 which is too old for Next.js 14.

```bash
# Load Node 20 via nvm (required every new shell session)
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20

# Start dev server
npm run dev
```

App runs at `http://localhost:3000`

## Environment setup
Copy `.env.example` to `.env` and fill in:
```
POSTGRES_PRISMA_URL="..."         # pooled connection (from Vercel Neon integration)
POSTGRES_URL_NON_POOLING="..."    # direct connection (from Vercel Neon integration)
ANTHROPIC_API_KEY="sk-ant-..."
BLOB_READ_WRITE_TOKEN="..."       # from Vercel Blob integration (optional locally)
```

Image upload falls back to `public/uploads/` locally when `BLOB_READ_WRITE_TOKEN` is not set.

## Database
```bash
# Apply schema changes
npx prisma db push

# Browse data in GUI
npx prisma studio
```

Postgres notes:
- `ingredients` and `nutrition` are stored as JSON strings (String fields), parsed in `lib/db.ts` via `parseMeal()`
- MealType (BREAKFAST/LUNCH/DINNER) and DayOfWeek (MON–SUN) are plain strings, not enums
- `createMany` is avoided — use `Promise.all(items.map(item => prisma.x.create(...)))` instead
- Meal `type` supports multiple types stored as comma-separated string e.g. `"BREAKFAST,DINNER"`

## Deployment
Hosted on Vercel. Pushes to `main` auto-deploy via GitHub integration.
```bash
vercel --prod --yes   # manual deploy if needed
```

## Project structure
```
app/
  page.tsx                  → redirects to /week
  week/page.tsx             → 7-day meal grid (home screen)
  shopping/page.tsx         → shopping list with pantry integration + prices
  meals/page.tsx            → meal library with filters
  pantry/page.tsx           → pantry stock tracker
  api/
    meals/route.ts          → GET all meals, POST create meal
    meals/[id]/route.ts     → PATCH edit meal, DELETE meal
    week/route.ts           → GET/POST/DELETE week plan slots
    shopping/route.ts       → GET list, POST regenerate (AI dedup), PUT add custom item,
                              DELETE remove item, PATCH toggle/edit/clear
    suggest/route.ts        → POST → calls Claude → returns 3 suggestions
    prefill/route.ts        → POST { name } → calls Claude → returns ingredients/nutrition/tags
    upload/route.ts         → POST multipart → Vercel Blob (prod) or public/uploads/ (dev)
    pantry/route.ts         → GET/POST/PATCH/DELETE pantry items
    settings/route.ts       → GET/PUT household people count

components/
  NavBar.tsx                → sticky bottom 4-tab nav (Week / Shopping / Pantry / Meals)
  MealCard.tsx              → meal card used in library grid
  MealImage.tsx             → image with letter-fallback placeholder
  MealDetailModal.tsx       → ingredient/nutrition detail sheet with edit button
  SuggestModal.tsx          → AI suggest + library picker (shown when tapping + in week)
  AddMealForm.tsx           → add/edit meal form with AI prefill (✨ Fill button)

lib/
  db.ts                     → Prisma client singleton + parseMeal() helper
  claude.ts                 → suggestMeals(), prefillMeal(), canonicalizeIngredients()
  week.ts                   → getWeekStart(), day/meal type labels, constants
```

## Data model
```
Meal          id, name, type (comma-separated: "BREAKFAST,DINNER"), ingredients (JSON string),
              nutrition (JSON string), tags, emoji, imageUrl, servings, createdAt

WeekPlan      id, weekStart (YYYY-MM-DD Monday), day, mealType, mealId → Meal

ShoppingItem  id, weekStart, name, amount, unit, category, checked, price (Float), custom (Boolean)
              custom=true items survive shopping list regeneration

PantryItem    id, name, amount, unit, category, status ("ok" | "low" | "out")

Settings      id ("household"), people (Int, default 2)
```

Week starts on Monday. `getWeekStart()` in `lib/week.ts` always returns the current Monday's date.

## Key behaviors

### Week planner
- Tapping a filled slot → `MealDetailModal` (ingredients, nutrition, remove button)
- Tapping an empty slot → `SuggestModal` (AI tab + Library tab filtered to that meal type)
- Library tab shows meals matching ANY of their types (multi-type meals appear in relevant slots)
- Assigning/removing a meal regenerates the shopping list immediately (awaited)

### Meals library
- Multi-type meals: type selector allows selecting multiple (stored as "BREAKFAST,LUNCH")
- AI prefill: type meal name → tap ✨ Fill → ingredients/nutrition/tags auto-populated
- Image: upload file (Vercel Blob) or paste URL
- Filter by meal type — matches any of a meal's types

### Shopping list
- Auto-generated from week plan ingredients, scaled by `householdPeople / 2` (base = 2 people)
- AI canonicalization (claude-haiku) merges fuzzy duplicates on each regeneration
- Unit normalization before AI step (grams→g, tablespoons→tbsp, etc.)
- Custom items (+ Add button): persist through regenerations, have × delete button
- Pantry integration: green dot = in stock, yellow dot = running low (from Pantry tab)
- Restock section: shows pantry items marked low or out
- Tap any item to edit quantity, unit, price (₦)
- Estimated total shown at bottom when prices are set
- Household size control regenerates list with correct scaling

### Pantry
- Track stock with status: ok (black dot) / low (yellow dot) / out (gray dot)
- Tap dot to cycle through statuses
- Items feed into shopping list indicators

## GitHub
Repo: `https://github.com/grantxdev/eatwell`
Push via SSH — key is already configured.
```bash
git add <files>
git commit -m "message"
git push
```
