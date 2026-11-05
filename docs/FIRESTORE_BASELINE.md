# ChemChamp Firestore Baseline Measurement Report

**Date:** 2026-11-06  
**Environment:** Dev & Source Analysis (`import.meta.env.DEV`)  
**Scope:** 11 Key User & Admin Flows  
**Objective:** Measure exact baseline Firestore reads, writes, and active listeners prior to optimization.

---

## ১. ফ্লো-ভিত্তিক বেইজলাইন টেবিল (Baseline Measurements Table)

| ফ্লো / স্ক্রিন (Flow) | ফাইল ও কোড রেফারেন্স | অপারেশন ও কুয়েরি বিশ্লেষণ | বেইজলাইন রিড (Reads) | বেইজলাইন রাইট (Writes) | লিসেনার (Listeners) | প্রধান সমস্যা / হটস্পট (Root Bottleneck) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **১. Landing Load** (`/`) | `src/pages/Landing.jsx` (L31), `landingConfigService.js` (L273, L332) | `getDoc('landingSettings/config')` + `onSnapshot('landingSettings/config')` | **২** | **০** | **১** (রিয়েলটাইম) | একই `useEffect`-এ ডুপ্লিকেট রিড; বেনামী ভিজিটরদের জন্য লাইভ অন-স্ন্যাপশট কানেকশন ওপেন রাখা। |
| **২. Login Flow** (`/login`) | `src/context/AuthContext.jsx` (L191, L196, L259) | `getDoc('users/{uid}')` (+ নতুন ইউজার হলে বা অ্যাডমিন সিঙ্ক হলে `setDoc`) | **১** | **০ - ১** | **০** | সফল লগইনে ১ রিড; রোল পরিবর্তন বা ফার্স্ট-টাইম লগইনে ১ রাইট। |
| **৩. Dashboard** (`/dashboard`) | `GlobalAnnouncementBanner.jsx` (L30), `AdmissionEdgeCard.jsx` (L25), `MorningCapsuleCard.jsx` (L83) | `getDocs('announcements')` (আনলিমিটেড) + `getDoc('admissionEdge/config')` + `getDocs('questions', limit(15))` | **১৭ - ২১** | **০** (বা ১ যদি স্ট্রিক আপডেট হয়) | **০** | নোটিশ ও অ্যাডমিশন এজ কনফিগ আনক্যাশড; প্রতিবার ড্যাশবোর্ডে ১৫টি প্রশ্ন রিড। |
| **৪. StudyHub** (`/study`) | `src/pages/StudyHub.jsx` (L176, L184, L259) | `getDocs('chapters')` + `getDocs('topics')` + `getDocs('subtopics')` N+1 লুপে | **২৬ - ৫২** | **০** | **০** | **মারাত্মক N+1 কুয়েরি লুপ:** চ্যাপ্টারের প্রতিটা টপিকের জন্য আলাদা আলাদা সাবটপিক কুয়েরি ফায়ার হয়। |
| **৫. One Lesson** (Reader/Practice) | `LessonReaderModal.jsx` (L240, L244, L338) | `getDocs('questions', where topicId)` (আনলিমিটেড) | **১০ - ৩০** | **১** (XP/Stats সিঙ্ক) | **০** | টপিকের সব প্রশ্ন আনক্যাশড রিড; লেসন শেষ হলে তাৎক্ষণিক আন-ডিবাউন্সড রাইট। |
| **৬. Exams List** (`/exams`) | `src/pages/Exams.jsx` (L222, L235, L247), `mistakeService.js` (L42) | `getDocs('chapters')` + `getDocs('questions')` **(সম্পূর্ণ কালেকশন!)** + `getDocs('mockExams')` + `getDocs('mistakeBox')` | **৫০০ - ২,০০০+** *(কোল্ড ক্যাশ)* | **০** | **০** | **কোটা ধ্বংসকারী হটস্পট:** কোনো লিমিট ছাড়া সম্পূর্ণ `questions` কালেকশন ক্লায়েন্টে নামিয়ে আনে! |
| **৭. One Exam Submit** | `examHistoryService.js` (L63), `mistakeService.js` (L90), `AuthContext.jsx` (L153) | `setDoc('examAttempts/{id}')` + `setDoc('mistakeBox/{id}')` লুপে + `syncUserProfile()` | **০** | **৩ - ৭+** | **০** | ভুল হওয়া প্রতিটি প্রশ্নের জন্য লুপের মধ্যে আলাদা আলাদা সিকুয়েনশিয়াল `setDoc` (আন-ব্যাচড)। |
| **৮. Vault** (`/vault`) | `src/pages/Vault.jsx` (L60, L67, L76) | `getDocs('flashcards')` + `getDocs('periodicElements')` + `getDocs('formulas')` | **১৯৮ - ২৬৮** *(কোল্ড ক্যাশ)* | **০** | **০** | পর্যায় সারণীর ১১৮টি এলিমেন্ট, সব ফ্ল্যাশকার্ড ও ফর্মুলা আনলিমিটেড রিড। |
| **৯. Leaderboard** (`/leaderboard`) | `src/pages/Leaderboard.jsx` (L92, L130) | `getDocs('users', limit(60))` + `getDocs('questions', limit(60))` | **১২০** | **০** | **০** | ১v১ অ্যারেনার জন্য অপ্রয়োজনে ৬০টি প্রশ্ন পেজ লোডেই ফেচ হয়; ৬০টি ইউজার ডাটাবেজ লেভেলে আন-সর্টেড। |
| **১০. Profile** (`/profile`) | `src/pages/Profile.jsx` (L141) | `getDocs('doubtBox', where studentUid)` | **০ - ১৫** | **০** (প্রোফাইল সেভ করলে ১) | **০** | স্টুডেন্টের ডাউট লিস্ট আনক্যাশড ও আনলিমিটেড রিড। |
| **১১. Admin Overview** (`/admin/overview`) | `AdminOverview.jsx` (L79, L108, L117, L126) | `getDocs('users')` + `getDocs('questions')` + `getDocs('chapters')` + `getDocs('doubtBox')` | **১,৫০০ - ৫,০০০+** | **০** | **০** | **সর্বোচ্চ খরচের স্ক্রিন:** শুধুমাত্র সংখ্যা বা কাউন্ট পাওয়ার জন্য সম্পূর্ণ ৪টি কালেকশন মেমোরিতে ডাউনলোড করে! |

---

## ২. প্রধান প্রধান আর্কিটেকচারাল হটস্পট ও অপচয় বিশ্লেষণ

### ১) কাউন্ট পাওয়ার জন্য পুরো কালেকশন ডাউনলোড (`AdminOverview.jsx`)
- মোট শিক্ষার্থী সংখ্যা, মোট প্রশ্ন সংখ্যা, মোট অধ্যায় জানার জন্য `getDocs()` দিয়ে হাজার হাজার ডকুমেন্ট ডাউনলোড করা হচ্ছে।
- `studentDocs.slice(0, 5)` করার জন্য পুরো ইউজার ডাটাবেজ ফেচ হচ্ছে।
- **প্রভাব:** এডমিন ড্যাশবোর্ড একবার রিফ্রেশ করলেই ৩,০০০ থেকে ৫,০০০ রিড নষ্ট হয়।

### ২) আনলিমিটেড কুয়েরি ও কোটা স্পাইক (`Exams.jsx`)
- `getDocs(collection(db, "questions"))` কোনো `limit()` বা ফিল্টারিং ছাড়া সম্পূর্ণ প্রশ্নব্যাংক নামিয়ে আনে।
- প্রশ্নব্যাংকে ১,০০০ প্রশ্ন থাকলে প্রতিবার ক্যাশ এক্সপায়ার হলে ১,০০০ রিড খরচ হয়।

### ৩) অপ্রয়োজনীয় প্রশ্ন লোড (`Leaderboard.jsx`)
- লিডারবোর্ড লোড করার সময় ৬০ জন ইউজারের পাশাপাশি ৬০টি প্রশ্ন নামানো হচ্ছে (`getDocs('questions', limit(60))`), যদিও শিক্ষার্থী হয়তো ১v১ ডুয়েল ট্যাবেই যাবে না।
- ইউজারদের কুয়েরিতে কোনো `orderBy('gamification.currentXP', 'desc')` নেই; ফলে প্রথম ৬০ জন র্যান্ডম ইউজার এনে ক্লায়েন্ট মেমোরিতে সর্ট করা হচ্ছে, যা আসল টপ-৫০ নয়।

### ৪) N+1 সাবটপিক লুপ (`StudyHub.jsx`)
- অধ্যায় ওপেন করার পর প্রতিটি টপিকের জন্য আলাদা আলাদা `getDocs(subtopics)` ফায়ার হয়। ১০টি টপিক থাকলে ১০টি আলাদা নেটওয়ার্ক রিকোয়েস্ট যায়।

### ৫) আন-ব্যাচড ও ঘনঘন রাইট (`AuthContext.jsx` & `mistakeService.js`)
- `syncUserProfile` প্রতি ছোট পরিবর্তনে সাথে সাথে `setDoc` কল করে।
- পরীক্ষায় ৫টি ভুল হলে `mistakeService.js` ৫ বার আলাদা আলাদা `setDoc` কল করে লুপের মধ্যে।

### ৬) পাবলিক পেজে লাইভ অন-স্ন্যাপশট কানেকশন (`Landing.jsx`)
- হোমপেজে আসা যেকোনো সাধারণ ভিজিটরের জন্য ফায়ারস্টোর রিয়েলটাইম লিসেনার ওপেন থাকে এবং একই সাথে `getDoc` ও `onSnapshot` দুটোই ফায়ার হয়ে একই ডকুমেন্ট দুবার রিড হয়।

---

## ৩. পরবর্তী মাইলস্টোন (MILESTONE 2) বাস্তবায়ন পরিকল্পনা

১. **`AdminOverview.jsx`:** `getCountFromServer()` অ্যাগ্রিগেট কুয়েরি ব্যবহার (০ ডকুমেন্ট রিড, ১ অ্যাগ্রিগেট কল), ১০ মিনিট ক্যাশ, এবং সাম্প্রতিক ৫ জন শিক্ষার্থীর জন্য `orderBy(createdAt, 'desc') + limit(5)`।
২. **`Leaderboard.jsx`:** `orderBy('gamification.currentXP', 'desc') + limit(50)` ইনডেক্সড কুয়েরি; অপ্রয়োজনীয় ৬০টি প্রশ্নের ফেচ লিডারবোর্ড লোড থেকে সম্পূর্ণ বাদ দেওয়া।
৩. **`Exams.jsx`, `StudyHub.jsx`, `Vault.jsx`:** হার্ড লিমিট ও পেজিনেশন; স্ট্যাটিক ডেটা (কারিকুলাম, ফ্ল্যাশকার্ড, ফর্মুলা) ২৪ ঘণ্টা ক্যাশ।
৪. **`landingConfigService.js` & `featureFlagService.js`:** পাবলিক রুটে `onSnapshot` বন্ধ করে ১ ঘণ্টার টিটিএল ক্যাশ সহ সিঙ্গেল `getDoc`।
৫. **`AuthContext.jsx`:** ৩০-৬০ সেকেন্ডের ডিবাউন্সড ব্যাচড রাইটার এবং `beforeunload`/`pagehide` সিঙ্ক; অপরিবর্তিত থাকলে লগইনে রাইট পরিহার।
৬. **`examHistoryService.js` & `mistakeService.js`:** সাবমিশনে `writeBatch` ব্যবহার করে একবারে সব ভুল সেভ করা।

