# jour-un: AI-Powered Health & Goal Tracker

**jour-un** is a modern Progressive Web App (PWA) designed to help users set, track, and achieve their physical, dietary, and lifestyle goals. It leverages AI-powered interfaces for personalized insights and a seamless user experience.

![jour-un Dashboard Mockup]

## 📑 Table of Contents

1. [Core Features](#-core-features)
2. [Tech Stack](#-tech-stack)
3. [Getting Started](#-getting-started)
4. [Environment Setup](#-environment-setup)
5. [Supabase Setup](#-supabase-setup)
6. [Google Gemini API Setup](#-google-gemini-api-setup)
7. [Project Structure](#-project-structure)
8. [Development](#-development)
9. [API Documentation](#-api-documentation)
10. [Deployment](#-deployment)
11. [Contributing](#-contributing)
12. [Troubleshooting](#-troubleshooting)

## 🔹 Core Features

* **User Authentication**: Secure sign-up and login via Email/Password and Google OAuth.
* **Personalized Profile**: Users can set their physical characteristics (age, weight, height, etc.) for accurate activity calculations.
* **Goal Setting & Onboarding**: Users can define and edit their physical, nutrition, and activity goals.
* **AI-Powered Food Logging**: Upload a photo of a meal, and the Gemini API identifies the food, estimates portion size, and provides nutritional information.
* **Voice-Enabled Activity Logging**: Describe your workout using your voice; the app uses Gemini to analyze the activity and calculate calories burned based on your profile.
* **"Should I Eat This?"**: Get an AI-generated grade (A-F) for a food item based on your personal goals and recent history.
* **Dashboard & Timeline**: Visualize progress, achievements, and historical entries.
* **PWA Enabled**: Installable on any device for an app-like experience with offline capabilities.
* **Theme Aware**: Automatic light/dark mode based on system preferences.

### Additional Features
* **Real-time Data Sync**: Instant updates across devices
* **Offline Support**: Core features work without internet
* **Voice Commands**: Natural language input for quick logging
* **Smart Notifications**: AI-powered reminders based on habits
* **Progress Insights**: Weekly and monthly trend analysis
* **Social Sharing**: Share achievements (optional)
* **Export Data**: Download personal health data in CSV/JSON

## 🛠 Tech Stack

| Category          | Technology / Library                                                                                             | Purpose                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Framework** | [Next.js](https://nextjs.org/) (App Router)                                                                      | React framework for building the frontend & backend |
| **Backend & DB** | [Supabase](https://supabase.com/)                                                                                | Auth, Postgres Database, File Storage            |
| **AI / Generative**| [Google Gemini API](https://ai.google.dev/)                                                                      | Image recognition, nutritional analysis, text generation |
| **Styling** | [@emotion/react](https://emotion.sh/docs/introduction) + [@emotion/styled](https://emotion.sh/docs/styled)         | CSS-in-JS for component styling & theming        |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) & [Lottie-react](https://github.com/gamestole/lottie-react)        | UI transitions and complex animations            |
| **PWA** | [next-pwa](https://www.npmjs.com/package/next-pwa)                                                               | Progressive Web App configuration                |
| **State Mgmt** | React Context                                                                                                    | Global state for Authentication & Theme          |
| **Voice Input** | [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition)                               | Wrapper for the Web Speech API                   |
| **File Handling** | [react-dropzone](https://react-dropzone.js.org/), [browser-image-compression](https://www.npmjs.com/package/browser-image-compression) | Image selection and pre-upload compression       |
| **HTTP Client** | [axios](https://axios-http.com/)                                                                                 | Making requests to our internal API routes       |
| **Validation** | [Zod](https://zod.dev/)                                                                                          | Schema validation for forms and API data         |
| **Utilities** | `date-fns`, `uuid`, `clsx`                                                                                       | Date/time, unique IDs, conditional classes       |
| **Deployment** | [Vercel](https://vercel.com/)                                                                                    | Hosting, CI/CD, and Analytics                    |

### Development Tools
| Category | Technology | Purpose |
|----------|------------|----------|
| **Testing** | Jest, React Testing Library | Unit and integration testing |
| **Linting** | ESLint, Prettier | Code quality and formatting |
| **Analytics** | Vercel Analytics | Usage tracking and performance monitoring |
| **Error Tracking** | Sentry | Real-time error tracking and monitoring |

## 🚀 Getting Started

Follow these instructions to set up the project on your local machine.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18.x or later)
* [Git](https://git-scm.com/)
* A package manager like `npm` or `yarn`

### System Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux
- **Memory**: 4GB RAM minimum
- **Storage**: 1GB free space
- **Browser**: Chrome 80+, Firefox 72+, Safari 13.1+, Edge 80+

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/jour-un.git](https://github.com/your-username/jour-un.git)
    cd jour-un
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a new file named `.env.local` in the root of the project and add the following, replacing the placeholder values:
    ```env
    # Supabase Project Credentials
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

    # Google Gemini API Key
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

---

## ⚙️ Environment Setup

```env
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key

# Optional Environment Variables
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_ID=your_analytics_id
```

## 🐘 Supabase Setup

Supabase is the backbone of this application. A correct setup is crucial.

### 1. Project & API Keys

1.  Go to [supabase.com](https://supabase.com) and create a new project.
2.  Navigate to your project's **Settings > API**.
3.  Find your **Project URL** and the **`anon` public key**.
4.  Copy these values into your `.env.local` file.

### 2. Database Schema

The database schema includes the following tables:
* `profiles` - User profiles and goals
* `user_profiles` - Detailed physical characteristics for activity calculations
* `food_entries` - Food logging and nutritional data
* `activity_entries` - Exercise and physical activity tracking
* `sleep_entries` - Sleep duration and quality tracking

Run the following scripts in your Supabase SQL Editor:

```sql
-- User Profiles for Activity Calculations
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  weight_kg DECIMAL,
  height_cm INTEGER,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

3.  Run the entire script. This will:
    * Create the `profiles`, `food_entries`, `sleep_entries`, and `activity_entries` tables.
    * Set up a trigger to automatically create a user `profile` on signup.
    * Enable **Row Level Security (RLS)** and apply policies that ensure users can only access their own data.

### 3. Authentication Providers

1.  Navigate to **Authentication > Providers** in your Supabase dashboard.
2.  **Email/Password** is enabled by default. You can configure its settings here.
3.  **Enable Google OAuth**:
    * Toggle the Google provider to **On**.
    * Follow the Supabase documentation to get your `Client ID` and `Client Secret` from the Google Cloud Console.
    * **Crucially**, copy the **Callback URL** provided by Supabase and paste it into your Google Cloud OAuth consent screen settings under "Authorized redirect URIs". The default local callback is `http://localhost:3000/auth/callback`.

### 4. File Storage

The setup script also creates a storage bucket for food images.
* **Bucket Name**: `food_images`
* **Public Access**: This bucket is configured to be private.
* **Policies**: RLS policies are in place to allow authenticated users to upload images and view their own images via generated URLs.

---

## ✨ Google Gemini API Setup

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Log in and click **"Get API key"**.
3.  Create a new API key for this project.
4.  Copy the key and paste it into the `GEMINI_API_KEY` variable in your `.env.local` file.

---

## 📂 Project Structure

The `src` directory is organized to keep the codebase modular and maintainable.


src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── [...routes]/    # Application routes
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── features/      # Feature-specific components
├── context/           # React Context providers
├── hooks/             # Custom React hooks
├── lib/              # Core libraries and configs
├── styles/           # Global styles and themes
├── types/            # TypeScript type definitions
└── utils/            # Utility functions


---

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Run linting
npm run lint

# Format code
npm run format
```

### Code Style Guide
- Use functional components with hooks
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Document complex functions and components

## 🔧 Troubleshooting

Common issues and solutions:

1. **Camera not working**
   - Ensure HTTPS in production
   - Check browser permissions
   - Try different browsers

2. **Voice recognition issues**
   - Must use Chrome/Edge on desktop
   - Check microphone permissions
   - Ensure stable internet connection

3. **Image upload failing**
   - Check file size (max 5MB)
   - Verify supported formats (jpg/png)
   - Ensure storage bucket permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Review Process
- All PRs require review
- Must pass automated checks
- Follow the contribution guidelines
- Include tests for new features

## 📜 API Documentation

The app uses server-side API routes within Next.js to securely interact with the Gemini API.

* `POST /api/analyze-food`: Accepts an image file, sends it to Gemini, and returns a JSON object with `foodName`, `calories`, etc.
* `POST /api/analyze-activity`: Accepts a text description of a workout and user profile data, sends it to Gemini, and returns activity analysis including estimated calories burned based on the user's physical characteristics.
* `POST /api/should-i-eat`: Accepts a food description, fetches user context (goals) from Supabase, and returns an AI-generated grade and recommendation.

---

## 📦 Deployment

This project is configured for seamless deployment on **Vercel**.

1.  Push your code to a Git repository (GitHub, GitLab, etc.).
2.  Create a new project on Vercel and import your repository.
3.  Vercel will automatically detect the Next.js framework.
4.  **Configure Environment Variables**: In your Vercel project's **Settings > Environment Variables**, add the same keys and values from your `.env.local` file. This is a critical step for the deployed app to function.
5.  Click **Deploy**. Vercel will build and deploy your application. Subsequent pushes to the main branch will trigger automatic redeployments.

Supabase script --- Create Profiles table to store user-specific data and goals
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  -- Goals
  physical_goal TEXT,
  nutrition_goal TEXT,
  activity_goal TEXT,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Function to create a profile for a new user automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Create Food Entries table
CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER,
  portion_size TEXT,
  notes TEXT,
  image_url TEXT
);

-- Create Sleep Entries table
CREATE TABLE sleep_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_hours DECIMAL(4, 2) -- e.g., 7.50 hours
);

-- Create Activity Entries table
CREATE TABLE activity_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  description TEXT,
  calories_burned INTEGER
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can manage their own profile.
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);

-- Users can manage their own entries.
CREATE POLICY "Users can manage their own food entries." ON food_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sleep entries." ON sleep_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own activity entries." ON activity_entries FOR ALL USING (auth.uid() = user_id);

-- Create storage bucket for food images
INSERT INTO storage.buckets (id, name, public)
VALUES ('food_images', 'food_images', false);

-- Create policies for storage
CREATE POLICY "Users can upload food images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'food_images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own food images" ON storage.objects
FOR SELECT USING (bucket_id = 'food_images' AND owner = auth.uid());