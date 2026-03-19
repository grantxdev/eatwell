# EatWell — Claude Code Guide

## What this project is
Single-household meal planner web app. No auth, one shared URL. Minimal, opinionated UI (Nikita Bier-style: one action per screen, large typography, no clutter).

## Stack
- **Next.js 14** (App Router) — `app/` directory
- **Tailwind CSS** — utility-first styling, no component library
- **Prisma 5.7 + SQLite** — local DB at `prisma/dev.db`
- **Anthropic SDK** — Claude claude-sonnet-4-6 for meal suggestions (`lib/claude.ts`)

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
Copy `.env.example` to `.env` and fill in your key:
```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
```

## Database
```bash
# Apply schema changes
npx prisma db push

# Browse data in GUI
npx prisma studio
```

SQLite limitations to be aware of:
- No native `Json` field type — ingredients and nutrition are stored as JSON strings, parsed in `lib/db.ts`
- No enums — MealType (BREAKFAST/LUNCH/DINNER) and DayOfWeek (MON–SUN) are plain strings
- `createMany` is not supported — use `Promise.all(items.map(item => prisma.x.create(...)))` instead

## Project structure
```
app/
  page.tsx              → redirects to /week
  week/page.tsx         → 7-day meal grid (home screen)
  shopping/page.tsx     → auto-generated shopping list
  meals/page.tsx        → meal library
  api/
    meals/route.ts      → GET all meals, POST create meal
    meals/[id]/route.ts → DELETE meal
    week/route.ts       → GET/POST/DELETE week plan slots
    shopping/route.ts   → GET list, POST regenerate, PATCH toggle/clear
    suggest/route.ts    → POST → calls Claude → returns 3 suggestions

components/
  NavBar.tsx            → sticky bottom 3-tab nav
  MealCard.tsx          → meal card used in library
  MealDetailModal.tsx   → ingredient/nutrition detail sheet
  SuggestModal.tsx      → AI suggest + library picker (shown when tapping +)
  AddMealForm.tsx       → manual meal creation form

lib/
  db.ts                 → Prisma client singleton + parseMeal() helper
  claude.ts             → suggestMeals() — calls Claude API
  week.ts               → getWeekStart(), day/meal type labels, constants
```

## Data model
```
Meal          id, name, type, ingredients (JSON string), nutrition (JSON string), tags, emoji
WeekPlan      id, weekStart (YYYY-MM-DD Monday), day, mealType, mealId → Meal
ShoppingItem  id, weekStart, name, amount, unit, category, checked
```

Week starts on Monday. `getWeekStart()` in `lib/week.ts` always returns the current Monday's date.

## Key behaviors
- Tapping a filled slot → `MealDetailModal` (shows ingredients, nutrition, remove button)
- Tapping an empty `+` slot → `SuggestModal` (AI tab loads suggestions from `/api/suggest`, Library tab shows filtered saved meals)
- AI suggestions are saved to the Meal library automatically when selected
- Shopping list regenerates (via `POST /api/shopping`) whenever a meal is assigned or removed from the week
- Checked shopping items persist in DB across refreshes

## GitHub
Repo: `https://github.com/grantxdev/eatwell`
Push via SSH — key is already configured.
```bash
git add <files>
git commit -m "message"
git push
```
