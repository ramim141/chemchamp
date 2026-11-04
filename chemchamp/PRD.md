# 🧪 ChemChamp: কমপ্লিট প্রোডাক্ট স্পেসিফিকেশন ও সফটওয়্যার রিকয়ারমেন্টস ডকুমেন্ট (PRD)

---

## ১. এক্সিকিউটিভ সামারি (Executive Summary)

**ChemChamp** হলো HSC (26/27 ব্যাচ) ও মেডিকেল/ভার্সিটি এডমিশন পরীক্ষার্থীদের জন্য নির্মিত একটি হাইপার-স্পেশালাইজড এডটেক প্রগ্রেসিভ ওয়েব অ্যাপ (PWA)। প্ল্যাটফর্মটির মূল উদ্দেশ্য হলো শিক্ষার্থীদের পড়ার ধারাবাহিকতা (Daily Habit Loop) ধরে রাখা, রসায়নের জটিল বিক্রিয়া ও হিসাব সহজ করা এবং ডাটা-ড্রাইভেন সেলফ-অ্যাসেসমেন্টের মাধ্যমে প্রস্তুতিকে নিখুঁত করা।

অ্যাপ্লিকেশনটি সম্পূর্ণ **সার্ভারলেস (Serverless / Cloudless)** ফ্রন্টএন্ড-ফার্স্ট আর্কিটেকচারে তৈরি, যেখানে ক্লায়েন্ট-সাইড থেকে সরাসরি গুগল ফায়ারস্টোর এবং ইমেজ হোস্টিংয়ের জন্য ImgBB API ব্যবহার করা হয়েছে।

---

## ২. সিস্টেম আর্কিটেকচার ও টেক স্ট্যাক (Tech Stack)

| কম্পোনেন্ট | প্রযুক্তি | ভূমিকা ও দায়িত্ব |
| --- | --- | --- |
| **ফ্রন্টএন্ড ফ্রেমওয়ার্ক** | React 18+ (Vite) | লাইটওয়েট, আল্ট্রা-ফাস্ট সিঙ্গেল পেজ অ্যাপ্লিকেশন (SPA) |
| **স্টাইলিং ও UI** | Tailwind CSS | মোবাইল-ফার্স্ট রেসপনসিভ ডার্ক/লাইট UI ও ট্রানজিশন |
| **আইকন ও ভিজ্যুয়াল** | Lucide React, Canvas-Confetti | মিনিমাল ভেক্টর আইকন ও গেমিফিকেশন অ্যানিমেশন |
| **সমীকরণ রেন্ডারিং** | KaTeX (`react-katex`) | জটিল রাসায়নিক সংকেত, বিক্রিয়া ও ম্যাথ রেন্ডারিং |
| **অথেনটিকেশন** | Firebase Auth | গুগল ওয়ান-ট্যাপ সাইন-ইন (Passwordless Onboarding) |
| **ডাটাবেজ** | Google Cloud Firestore | NoSQL রিয়েল-টাইম ডাটা স্টোরেজ ও অফলাইন ক্যাশিং |
| **মিডিয়া স্টোরেজ** | ImgBB API | চিত্র, সৃজনশীল উদ্দীপক ও ডাউট ইমেজের জন্য ডিরেক্ট ক্লাউড হোস্টিং |
| **লোকাল স্টোরেজ/অফলাইন** | LocalForage / IndexedDB | অফলাইন কুইজ প্যাক সংরক্ষণ ও ব্যাকগ্রাউন্ড ডাটা সিঙ্ক |
| **অ্যাপ্লিকেশন শেল** | Progressive Web App (PWA) | ব্রাউজার থেকে ফুলস্ক্রিন অ্যাপ ইনস্টল ও পুশ নোটিফিকেশন |

---

## ৩. কোর ফাংশনাল রিকয়ারমেন্টস (Module Breakdown)

### মডিউল ১: অথেনটিকেশন, অনবোর্ডিং ও ড্যাশবোর্ড

* **Google Single Sign-On (SSO):** কোনো পাসওয়ার্ডের প্রয়োজন নেই; জিমেইল দিয়ে সরাসরি লগইন।
* **অনবোর্ডিং উইজার্ড:** প্রথমবারের মতো লগইন করলে শিক্ষার্থীর তথ্য সংগ্রহ:
* টার্গেট নির্ধারণ: `HSC 26`, `HSC 27`, অথবা `Admission`।
* পেপার ফোকাস: `১ম পত্র`, `২য় পত্র`, নাকি `উভয় পত্র`।
* দৈনিক পড়ার সময়: `৩০ মিনিট`, `৪৫ মিনিট`, `১ ঘণ্টা`, বা `২ ঘণ্টা`।
* সিলেবাস শেষের সময়সীমা: `৪৫`, `৬০`, `৯০`, বা `১২০ দিন`।


* **লাইভ এক্সাম কাউন্টডাউন:** বোর্ড/এডমিশন পরীক্ষার আর কত দিন, ঘণ্টা ও মিনিট বাকি তার রিয়েল-টাইম ব্যানার।
* **ডেইলি মিশন লুপ (Habit Checklist):** প্রতিদিনের নির্ধারিত ১টি টপিক রিডিং, ১০টি MCQ প্র্যাকটিস এবং ৫টি ফ্ল্যাশকার্ড রিভিশনের চেকলিস্ট।
* **ডেইলি স্ট্রিক (🔥 Streak):** প্রতিদিন অন্তত ১টি মিশন শেষ করলে স্ট্রিক কাউন্ট বাড়বে।
* **মর্নিং কেমিস্ট্রি ক্যাপসুল:** প্রতিদিন সকালে ৩টি বিগত বছরের গুরুত্বপূর্ণ প্রশ্ন প্র্যাকটিসের সুযোগ।
* **শেয়ারযোগ্য উইকলি রিপোর্ট কার্ড:** সোশ্যাল মিডিয়ায় (ফেসবুক/হোয়াটসঅ্যাপ) শেয়ার করার মতো সাপ্তাহিক প্রগ্রেস কার্ড জেনারেশন।

### মডিউল ২: স্মার্ট লার্নিং ও অ্যান্টি-চিট ফোকাস হাব

* **সিকোয়েন্সিয়াল লক-আনলক পাথ:** প্রতিটি অধ্যায়ের শুরুতে "শুরুর আগে" (গাইডলাইন ও সিলেবাস অ্যানালাইসিস) শেষ না করলে মূল টপিক লক থাকবে।
* **২০-মিনিট স্ট্রিক্ট ফোকাস মোড (Anti-Cheat):**
* টপিক পড়ার জন্য ২০ মিনিটের স্ক্রিন কাউন্টডাউন।
* `Page Visibility API` ব্যবহার করে ট্যাব সুইচ বা মিনিমাইজ ট্র্যাক করা। ট্যাব পরিবর্তন করলেই টাইমার পজ হবে এবং স্ক্রিনে ওয়ার্নিং শো করবে।


* **অ্যাডাপটিভ লার্নিং পাথওয়ে (নোট ➡️ ভিডিও ফলব্যাক):**
* টপিক নোট শেষে দুটি অ্যাকশন বাটন:
* *"আলহামদুলিল্লাহ, বুঝেছি"* ➡️ সরাসরি প্র্যাকটিস সেটে প্রবেশ।
* *"কঠিন লাগছে / বুঝতে সমস্যা"* ➡️ এক ক্লিকে টপিকটির নির্ধারিত ইউটিউব লেকচার ভিডিও এক্সপ্যান্ড হবে।




* **টেক্সটবুক হাইলাইটার ইঞ্জিন:** হাজারী-নাগ, সঞ্জিত কুমার গুহ এবং ড. মহসিন স্যারের বইয়ের গুরুত্বপূর্ণ তথ্য ফিল্টার করে পড়ার ব্যবস্থা।
* **অডিও রিক্যাপ (বাস জার্নি মোড):** যাতায়াতের সময় পড়ার জন্য ৩-৫ মিনিটের অডিও লেকচার স্ট্রিমিং ও লোকাল ক্যাশিং।

### মডিউল ৩: কেমিস্ট্রি স্পেশাল ভল্ট (Chemistry Vault)

* **জৈব রসায়ন সোয়াইপ ফ্ল্যাশকার্ড (Swipe / Flip Cards):**
* ফ্রন্ট: বিক্রিয়ক ও প্রভাবক ($R\text{-}X + \text{Na} \xrightarrow{\text{dry ether}}$)।
* ব্যাক: উৎপাদ, মেকানিজম নোট এবং বিক্রিয়ার নাম (উর্টজ বিক্রিয়া)।


* **ইন্টারেক্টিভ মিনি পর্যায় সারণি:** ইলেকট্রন বিন্যাস এবং ব্যতিক্রমী মৌলগুলোতে ($\text{Cr}, \text{Cu}, \text{N}$ বনাম $\text{O}$) বিশেষ অ্যালার্ট ট্যাগ।
* **ফর্মুলা ভল্ট:** গাণিতিক রসায়নের সকল সূত্রাবলি (বাফার, জারণ-বিজারণ, ফ্যারাডে, গ্যাস সূত্র) এক জায়গায় ফিল্টারিং সুবিধা।

### মডিউল ৪: গেমিফিকেশন ও সাইকোলজিক্যাল রিটেনশন

* **কেমিস্ট্রি RPG লেভেল:** পয়েন্ট বৃদ্ধির সাথে প্রোফাইল পদবি আপগ্রেড:

$$\text{Test Tube Novice} \longrightarrow \text{Catalyst Trainee} \longrightarrow \text{Reaction Master} \longrightarrow \text{Nobel Laureate}$$


* **বস ফাইট মডেল টেস্ট (Boss Fight):** চ্যাপ্টার শেষে মেগা টেস্ট; সঠিক উত্তরে বসের HP কমবে, ভুল উত্তরে শিক্ষার্থীর শিল্ড ব্রেক হবে।
* **লাইভ কো-স্টাডি কাউন্টার:** ফোকাস মোডে রিয়েল-টাইমে কতজন শিক্ষার্থী লাইভ পড়ছে তা ড্যাশবোর্ডে প্রদর্শন।

### মডিউল ৫: ইন্টেলিজেন্ট রিভিশন ও অ্যানালিটিক্স

* **স্পেসড রিপিটেশন অ্যালগরিদম (Leitner System):** ভুল হওয়া প্রশ্নগুলো ১ দিন, ৩ দিন, ৭ দিন এবং ২১ দিন পর পর রিভিশন কিউতে পুশ করা।
* **উইকনেস হিটম্যাপ (Color-Coded):** সবল (সবুজ), মাঝারি (হলুদ) এবং দুর্বল (লাল) অধ্যায়/টপিকের ভিজ্যুয়াল ম্যাপ।
* **এরর ক্যাটাগরাইজেশন:** ভুল উত্তরের কারণ মার্ক করার অপশন (থিওরি ল্যাক / ক্যালকুলেশন ভুল / সিলি মিস্টেক / টাইম ম্যানেজমেন্ট)।

### মডিউল ৬: অফলাইন ও ব্যান্ডউইথ অপটিমাইজেশন

* **অফলাইন প্র্যাকটিস প্যাক:** ইন্টারনেটের অনুপস্থিতিতে পড়ার জন্য চ্যাপ্টার নোট ও MCQ লোকাল স্টোরেজে (IndexedDB) সেভ করে রাখা।
* **ব্যাকগ্রাউন্ড অটো-সিঙ্ক:** পুনরায় ইন্টারনেট কানেকশন পেলে অফলাইনের পরীক্ষার ফলাফল সার্ভারে পুশ হওয়া।
* **লো-ব্যান্ডউইথ মোড:** দুর্বল নেটওয়ার্কে মিডিয়া ও ব্যানার ব্লক করে শুধু টেক্সট ও KaTeX লোড করার টগল।

### মডিউল ৭: অ্যাডমিশন স্পেশাল এজ (Admission Edge)

* **নন-ক্যালকুলেটর ম্যাথ হ্যাকস:** ঢাবি ও গুচ্ছের জন্য ক্যালকুলেটর ছাড়া লগারিদম ও দশমিক হিসাবের শর্টকাট।
* **টপিক ফ্রিকোয়েন্সি ম্যাট্রিক্স:** বিগত ২০ বছরের মেডিকেল ও প্রকৌশল ভর্তি পরীক্ষার ট্রেন্ড অ্যানালাইসিস।
* **নেগেটিভ মার্কিং ট্র্যাকার:** -০.২৫ নেগেটিভ মার্কিংসহ প্রেসার টেস্ট।

### মডিউল ৮: অ্যাসেসমেন্ট ইঞ্জিন (MCQ ও CQ)

* **টাইমারভিত্তিক এক্সাম রুম:** নির্দিষ্ট সময়, র্যান্ডম শাফলিং এবং ইনস্ট্যান্ট রেজাল্ট শিট।
* **বোর্ড ও এডমিশন ট্যাগিং:** ফিল্টারিং ট্যাগ (যেমন: `[ঢাকা বোর্ড '২৪]`, `[BUET '২৩]`)।
* **সৃজনশীল (CQ) ব্যাংক:** চিত্রসহ উদ্দীপক ও ড্রপডাউনে "আদর্শ সমাধান দেখুন" টগল।
* **স্মার্ট মিস্টেক বক্স:** ভুল হওয়া প্রশ্নগুলো স্বয়ংক্রিয়ভাবে ফিল্টার হয়ে জমা থাকা।

### মডিউল ৯: সোশ্যাল ও ওয়ান-ক্লিক ডাউট সলভ

* **লাইভ লিডারবোর্ড:** মার্কস ও স্পিডের ওপর ভিত্তি করে দৈনিক ও সাপ্তাহিক র‍্যাঙ্কিং।
* **১v১ কুইজ ব্যাটল:** রুম কোড তৈরি করে বন্ধুদের ৫টি দ্রুত প্রশ্নের চ্যালেঞ্জ পাঠানো।
* **স্যারের কাছে ডাউট (Doubt Box):** প্রশ্ন বা খাতার ছবি তুলে সরাসরি আপলোড করার সুবিধা।

### মডিউল ১০: সুপার অ্যাডমিন প্যানেল (Content Studio)

* **ImgBB ইন্টিগ্রেটেড আপলোডার:** প্রশ্ন বা ব্যাখ্যার ছবি আপলোড করলে সরাসরি ক্লাউড ইউআরএল ও KaTeX মার্কডাউন কোড কপি করার সুবিধা।
* **JSON ব্যাচ বাল্ক আপলোডার:** একসাথে শত শত MCQ/CQ এবং লেকচার ডেটাবেজে ব্যাচ রাইট (`writeBatch`) করার ইন্টারফেস।
* **ডাউট রেসপন্স ডেস্ক:** শিক্ষার্থীদের পাঠানো প্রশ্ন ফিল্টার করে সমাধান বা অডিও/টেক্সট ফিডব্যাক পাঠানোর ড্যাশবোর্ড।

---

## ৪. ফায়ারস্টোর নো-এসকিউএল ডাটাবেজ আর্কিটেকচার (Schema Design)

```
databases/(default)/documents/
│
├── users/ {userId}
│    ├── uid: string
│    ├── name: string
│    ├── email: string
│    ├── photoURL: string
│    ├── role: "student" | "admin"
│    ├── onboardingCompleted: boolean
│    ├── preferences: { target, paper, dailyGoalMinutes, deadlineDays }
│    ├── gamification: { level, currentXP, streakCount, lastActiveDate }
│    ├── stats: { totalSolvedMCQ, accuracyRate, totalStudyMinutes }
│    │
│    └── mistakeBox/ {mistakeId}
│         ├── questionId: string
│         ├── wrongOption: number
│         ├── errorType: string
│         ├── timestamp: timestamp
│         └── nextReviewDate: timestamp
│
├── chapters/ {chapterId}
│    ├── title: string
│    ├── paper: 1 | 2
│    ├── sequenceOrder: number
│    │
│    └── topics/ {topicId}
│         ├── title: string
│         ├── notesMarkdown: string
│         ├── videoUrl: string
│         ├── audioUrl: string
│         ├── minFocusMinutes: number
│         └── bookHighlights: array [{ bookName, text, pageNumber }]
│
├── questions/ {questionId}
│    ├── chapterId: string
│    ├── topicId: string
│    ├── type: "MCQ" | "CQ"
│    ├── tags: array ["DHAKA_BOARD_24", "BUET_23"]
│    ├── content: { stem, options: [], answerIndex, explanationKaTeX }
│    └── cqData: { stimulusImage, subQuestions: [] }
│
├── flashcards/ {cardId}
│    ├── chapter: string
│    ├── topic: string
│    ├── frontReactant: string
│    ├── backProduct: string
│    ├── mechanismNotes: string
│    └── reactionName: string
│
└── doubtBox/ {doubtId}
     ├── studentUid: string
     ├── studentName: string
     ├── questionId: string (optional)
     ├── imageUrl: string
     ├── queryText: string
     ├── status: "pending" | "resolved"
     ├── teacherReply: string
     └── createdAt: timestamp

```

---

## ৫. ফায়ারবেস সিকিউরিটি রুলস স্পেসিফিকেশন (`firestore.rules`)

কোনো কাস্টম ব্যাকএন্ড সার্ভার না থাকায় সম্পূর্ণ ডাটাবেজ লেভেল সিকিউরিটি ফায়ারস্টোর রুলস দিয়ে ম্যানেজ করা হবে:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ইউজার ও সাবকালেকশন রুলস
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId) || isAdmin();
      
      match /mistakeBox/{mistakeId} {
        allow read, write: if isOwner(userId);
      }
    }

    // প্রশ্ন, চ্যাপ্টার ও কনটেন্ট রুলস (ছাত্ররা শুধু পড়বে, অ্যাডমিন লিখবে)
    match /chapters/{chapterId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      
      match /topics/{topicId} {
        allow read: if isAuthenticated();
        allow write: if isAdmin();
      }
    }

    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /flashcards/{cardId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // ডাউট বক্স রুলস
    match /doubtBox/{doubtId} {
      allow create: if isAuthenticated();
      allow read: if isAuthenticated() && (resource.data.studentUid == request.auth.uid || isAdmin());
      allow update: if isAdmin();
    }
  }
}

```

---

## ৬. নন-ফাংশনাল ও পারফরম্যান্স রিকয়ারমেন্টস

1. **ফার্স্ট কনটেন্টফুল পেইন্ট (FCP):** মোবাইল ডিভাইসে ২ সেকেন্ডের নিচে লোড টাইম নিশ্চিত করতে হবে।
2. **KaTeX লোডিং অপটিমাইজেশন:** সমীকরণ রেন্ডার করার সময় যাতে পেজ লেআউট শিফট (CLS) না হয়, সেজন্য ফন্ট প্রি-ফেচিং ব্যবহার করতে হবে।
3. **লোকাল ক্যাশিং পলিসি:** চ্যাপ্টারের টেক্সট কনটেন্ট এবং স্ট্যাটিক ডেটা ব্রাউজার ক্যাশে থাকবে; বারবার ফায়ারস্টোর রিড হবে না, যা ফায়ারবেসের রিড কোটা সাশ্রয় করবে।
4. **অ্যাসেসিবিলিটি ও রেসপনসিভনেস:** সর্বনিম্ন ৩২০ পিক্সেল স্ক্রিন থেকে শুরু করে ফুল ডেসকটপ মনিটরে ফ্লুইড গ্রিড লেআউট বজায় থাকবে।

---

## ৭. ডেভেলপমেন্ট ফেইজ ও ডেলিভারি রোডম্যাপ

```
[Phase 1: Foundation]
  ├── Firebase Auth (Google SSO)
  ├── Global Auth Context & State
  └── Student Onboarding Wizard
           │
           ▼
[Phase 2: Mobile Shell & Core Dashboard]
  ├── Bottom Navigation Bar (Home, Study, Exams, Vault, Profile)
  ├── Exam Countdown Timer
  ├── Daily Habit Checklist & Streak Counter
  └── Capsule MCQ Card
           │
           ▼
[Phase 3: Super Admin Panel]
  ├── ImgBB Direct Uploader (with Markdown Tag copy)
  ├── JSON Batch/Bulk Uploader (Firestore Batch Write)
  └── Content Management Table (Questions/Topics)
           │
           ▼
[Phase 4: Exam & Practice Engine]
  ├── Reusable KaTeX Equation Renderer
  ├── Quiz Runner (-0.25 Negative Marking & Timer)
  └── Auto-Populating Mistake Box
           │
           ▼
[Phase 5: Study Hub & Anti-Cheat System]
  ├── Page Visibility Focus Mode Tracker
  ├── Adaptive Content (Markdown Note ➡️ YouTube Fallback)
  └── Textbook Highlight Lines
           │
           ▼
[Phase 6: Chemistry Vault]
  ├── Reaction Swipe/Flip Cards
  └── Mini Periodic Table with Exceptions
           │
           ▼
[Phase 7: PWA, Offline Engine & Doubt Box]
  ├── Service Worker & Manifest Configuration
  ├── IndexedDB Offline Quiz Caching
  └── Student Doubt Submit & Admin Resolution Desk

```