# Google Services Setup Guide: Firebase, Google Forms & Google Drive

This guide details how to configure Google Cloud and Google Workspace features used by Crema.

---

## 1. Firebase Authentication & Firestore Setup

Crema uses Firebase for persistent user profiles, chat dialogue history, and study progress.

1. **Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com).
   - Create or select your project (e.g. `Crema`).
2. **Enable Authentication**:
   - In the sidebar, navigate to **Build > Authentication > Sign-in method**.
   - Enable **Google** sign-in provider.
   - Add your application domain (or Cloud Run dev URL) to **Authorized domains**.
3. **Enable Cloud Firestore**:
   - Navigate to **Build > Firestore Database**.
   - Create a database in your preferred region.
   - Security rules in `firestore.rules` will automatically protect your collections under `users/{uid}/**`.
4. **Deploy Rules**:
   - You can deploy the rules with the Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules
     ```

---

## 2. Google Forms Exam Import & Published CSV

Students can track exams automatically by filling out a Google Form and having Crema sync exam dates directly.

### Step 1: Create the Google Form
1. Create a new Google Form titled **Exam Schedule & Syllabus**.
2. Add the following fields:
   - **Course / Subject Title** (Short answer)
   - **Exam Date** (Date picker or Short answer)
   - **Syllabus / Topics** (Paragraph)

### Step 2: Link Form to Google Sheets
1. In Google Forms, switch to the **Responses** tab.
2. Click **Link to Sheets** (green spreadsheet icon).
3. A connected Google Sheet will automatically record responses.

### Step 3: Publish Sheet as CSV
1. In the linked Google Sheet, click **File > Share > Publish to web**.
2. Under "Link", choose **Entire Document** (or the specific responses tab) and change the format dropdown from "Web page" to **Comma-separated values (.csv)**.
3. Click **Publish** and copy the generated URL (it will look like `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`).

### Step 4: Add to Environment Variables
1. Open `.env` and set:
   ```env
   GOOGLE_FORMS_EXAMS_CSV_URL="https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv"
   ```
2. In the Crema UI, open **Exam Tracker** and click **Sync Google Forms**. All exams submitted to your form will automatically populate!
3. If this environment variable is omitted, Crema gracefully provides a manual "Paste CSV" box without crashing.

---

## 3. Google Drive Picker & Document Integration (Optional)

To enable picking study notes directly from Google Drive:

1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com).
   - Select your project.
2. **Enable APIs**:
   - Navigate to **APIs & Services > Library**.
   - Enable **Google Drive API** and **Google Picker API**.
3. **Create Credentials**:
   - Navigate to **APIs & Services > Credentials**.
   - Click **Create Credentials > API Key** (set to `VITE_GOOGLE_DRIVE_API_KEY`).
   - Click **Create Credentials > OAuth client ID** (Web application). Add your app URL to Authorized JavaScript origins.
   - Copy the Client ID to `VITE_GOOGLE_CLIENT_ID`.
4. Paste study notes directly into the **Document & File Summarizer** modal or attach files up to 25MB.
