
### **Prayer App Specification**

### **1. Project Preamble & Goals**

**a. Introduction**
This document outlines the specification for a simple web application designed to track prayer hours for a church constituency. The app addresses the need to collectively track hours during prayer campaigns, where the group aims to reach a total number of prayed hours by a specific deadline.

**b. Target Audience**
The initial user base is a single church constituency (20-150 members), who are organized into smaller groups called bacentas. Users will primarily access the application via mobile devices.

**c. Core Objectives**
*   **Simplicity & Speed:** The user experience must be incredibly intuitive and fast. Logging a prayer session should take only a few seconds.
*   **Motivation:** Provide clear, immediate feedback on both individual and collective progress to encourage participation.
*   **Reliability:** Ensure that prayer sessions are tracked accurately, even if the user closes their browser or switches devices.
*   **Rapid Development:** The scope and technology are chosen to facilitate a very tight development turnaround.

---

### **2. Core Technology Stack**

*   **Frontend Framework:** React
*   **Build Tool / Dev Server:** Vite
*   **Routing:** React Router
*   **Data Fetching & State Management:** TanStack Query
*   **Backend & Database:** Supabase (Postgres)

---

### **3. Database Specification (Postgres/Supabase)**

This is the final, corrected schema. The UUIDv7 function is included for optimal primary key performance, and `pg_trgm` is used for efficient text searching.

**SQL Initialization Script:**
```sql
-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. UUID v7 FUNCTION
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid AS $$
DECLARE
  ts_ms bigint; ts_hex varchar; rand_hex varchar; uuid_str varchar;
BEGIN
  ts_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint;
  ts_hex := lpad(to_hex(ts_ms), 12, '0');
  rand_hex := encode(gen_random_bytes(16), 'hex');
  uuid_str := ts_hex || '7' || substr(rand_hex, 2, 3) || to_hex((8 + floor(random() * 4))::int) || substr(rand_hex, 6, 3) || substr(rand_hex, 9, 12);
  RETURN uuid_str::uuid;
END;
$$ LANGUAGE plpgsql;

-- 3. HELPER FUNCTION FOR 'updated_at'
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLES
CREATE TABLE constituencies ( id uuid PRIMARY KEY DEFAULT uuid_generate_v7(), name text NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE bacentas ( id uuid PRIMARY KEY DEFAULT uuid_generate_v7(), name text NOT NULL, constituency_id uuid REFERENCES constituencies(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE members ( id uuid PRIMARY KEY DEFAULT uuid_generate_v7(), first_name text NOT NULL, last_name text NOT NULL, full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED, bacenta_id uuid REFERENCES bacentas(id) ON DELETE SET NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE prayer_campaigns ( id uuid PRIMARY KEY DEFAULT uuid_generate_v7(), name text NOT NULL, target_hours numeric, start_timestamp timestamptz NOT NULL, end_timestamp timestamptz NOT NULL, constituency_id uuid REFERENCES constituencies(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE campaign_members ( member_id uuid REFERENCES members(id) ON DELETE CASCADE, prayer_campaign_id uuid REFERENCES prayer_campaigns(id) ON DELETE CASCADE, individual_target_hours numeric, created_at timestamptz DEFAULT now() NOT NULL, PRIMARY KEY (member_id, prayer_campaign_id) );
CREATE TABLE prayer_sessions ( id uuid PRIMARY KEY DEFAULT uuid_generate_v7(), member_id uuid REFERENCES members(id) ON DELETE CASCADE, prayer_campaign_id uuid REFERENCES prayer_campaigns(id) ON DELETE CASCADE, start_timestamp timestamptz NOT NULL, end_timestamp timestamptz, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL );

-- 5. TRIGGERS
CREATE TRIGGER on_constituencies_update BEFORE UPDATE ON constituencies FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_bacentas_update BEFORE UPDATE ON bacentas FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_members_update BEFORE UPDATE ON members FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_prayer_campaigns_update BEFORE UPDATE ON prayer_campaigns FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_prayer_sessions_update BEFORE UPDATE ON prayer_sessions FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 6. INDEXES
CREATE INDEX idx_members_full_name ON members USING GIN (full_name gin_trgm_ops);
CREATE INDEX idx_prayer_sessions_member_id ON prayer_sessions(member_id);
CREATE INDEX idx_prayer_sessions_campaign_id ON prayer_sessions(prayer_campaign_id);
CREATE INDEX idx_campaign_members_campaign_id ON campaign_members(prayer_campaign_id);

-- 7. ENABLE ROW-LEVEL SECURITY (RLS)
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bacentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;
```

---

### **4. Application Screens & Flows**

#### **a. The Identity Screen**
*   **Purpose:** One-time identification for a user on a new device/browser. This is the entry point if no user is found in `localStorage`.
*   **Layout:** A clean, centered view with the app title and a single search input.
*   **Features:**
    *   **Typeable Search Dropdown:** Fetches all members and filters the list as the user types their name. Uses the `full_name` column for searching.
    *   **Continue Button:** Enabled only after a valid member is selected.
*   **Logic:** Upon selection and continuation, the `{ member_id, first_name }` is stored in `localStorage`, and the user is navigated to the Main Logging Screen.

#### **b. The Main Logging Screen**
*   **Purpose:** The central hub and default screen for returning users. Designed for quick, frequent interactions.
*   **Layout (Top to Bottom):**
    1.  **Identity Header:**
        *   `Welcome, [First Name]! (Not you? Change)`
        *   `Your Progress: [X] / [Y] hours` (e.g., "14.5 / 20 hours"). X is the sum of completed hours. Y is the individual target.
    2.  **Action Zone (Contextual):**
        *   **State A (No Active Session):** A large, primary button: **[ Start Praying Now ]**.
        *   **State B (Active Session):** A card displaying "Prayer in Progress," the start time, a live-ticking duration timer, and a large primary button: **[ End Session ]**.
    3.  **Manual Entry Link:** Text link: `Log a Past Prayer`. Opens the Edit/Add Session Modal.
    4.  **Recent Sessions Feed:** A list of the user's last 3-5 completed sessions, newest first. Each item is tappable, opening the Edit/Add Session Modal for that session.
    5.  **Full Log Button:** A button: **[ See Full Prayer Log ]**. Navigates to the Full Log screen.

#### **c. The Edit/Add Session Modal**
*   **Purpose:** A single interface for manually logging a past prayer or editing an existing one.
*   **Layout:** A modal/pop-up overlay.
*   **Features:** Date, Start Time, and End Time pickers; **[ Save Changes ]** button; **[ Delete Session ]** button (only visible when editing); and a Cancel/Close control.

#### **d. The Full Prayer Activity Log Screen**
*   **Purpose:** A dedicated screen for a user to view their complete prayer history.
*   **Layout:** A standard view with a back navigation link and a complete, chronologically sorted list of their prayer sessions.
*   **Features:** Each session in the list is tappable, opening the Edit/Add Session Modal for corrections.

---

### **5. The Complete User Journey**

**a. First-Time User Punches In:**
1.  User opens the app. `localStorage` is empty, so they are directed to the **Identity Screen**.
2.  They search for and select their name, then click "Continue". Their ID is saved to `localStorage`.
3.  They land on the **Main Logging Screen**. The app queries the DB and finds no active sessions.
4.  The Action Zone shows the **[ Start Praying Now ]** button. The user taps it.
5.  An `INSERT` request creates a new row in `prayer_sessions` with a `start_timestamp` and a `NULL` `end_timestamp`.
6.  The UI instantly re-renders to show the "Active Session" card with a running timer.

**b. Returning User Punches Out & Edits:**
1.  The user re-opens the app. Their ID is found in `localStorage`.
2.  The app loads the **Main Logging Screen**, queries for an active session for that user, and finds one.
3.  The UI renders directly into the "Active Session" state, with the timer accurately reflecting the elapsed time.
4.  The user finishes praying and taps **[ End Session ]**.
5.  An `UPDATE` request sets the `end_timestamp` for the session row in the database.
6.  Upon success, the UI re-renders:
    *   The "Active Session" card disappears, replaced by the **[ Start Praying Now ]** button.
    *   The **"Your Progress"** stat animates as it updates with the duration of the just-completed session.
    *   The new session appears at the top of the **"Recent Sessions"** feed.
7.  The user notices they let the timer run too long. They tap the session in the "Recent" list.
8.  The **Edit/Add Session Modal** opens. They adjust the end time and click "Save Changes".
9.  The modal closes, and the UI updates the "Your Progress" stat and the session duration in the list.