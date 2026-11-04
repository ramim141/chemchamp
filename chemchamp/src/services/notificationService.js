// Browser Notification & Streak Reminder Service

class NotificationService {
  constructor() {
    this.supported = typeof window !== "undefined" && "Notification" in window;
  }

  isSupported() {
    return this.supported;
  }

  getPermission() {
    if (!this.supported) return "unsupported";
    return Notification.permission; // "default" | "granted" | "denied"
  }

  async requestPermission() {
    if (!this.supported) return false;
    try {
      const result = await Notification.requestPermission();
      try {
        localStorage.setItem("chemchamp_notification_status", result);
      } catch {
        // ignore
      }
      if (result === "granted") {
        this.sendNotification(
          "ChemChamp নোটিফিকেশন চালু হয়েছে! 🎉",
          "আপনার স্ট্রিক রক্ষা ও দৈনিক পড়াশোনার রিমাইন্ডার এখন থেকে সময়মতো পৌঁছে যাবে।"
        );
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Notification permission error:", e);
      return false;
    }
  }

  sendNotification(title, body, options = {}) {
    if (!this.supported || Notification.permission !== "granted") return;
    try {
      const notif = new Notification(title, {
        body,
        icon: "/vite.svg",
        badge: "/vite.svg",
        tag: options.tag || "chemchamp-reminder",
        renotify: true,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
      };
    } catch (e) {
      console.warn("Error triggering notification:", e);
    }
  }

  // Trigger evening streak protection check
  checkAndSendStreakReminder(streakCount = 1, isMissionPending = true) {
    if (this.getPermission() !== "granted" || !isMissionPending) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const reminderSentKey = `chemchamp_reminder_sent_${todayStr}`;

    try {
      if (localStorage.getItem(reminderSentKey) === "true") return;

      const hours = new Date().getHours();
      // Remind in the evening after 6 PM (18:00)
      if (hours >= 18) {
        this.sendNotification(
          `🔥 আপনার ${streakCount} দিনের স্ট্রিক ঝুঁকির মুখে!`,
          "আজকের অন্তত ১টি কেমিস্ট্রি মিশন সম্পন্ন করে স্ট্রিক সক্রিয় রাখুন। ক্লিক করে মিশন শেষ করুন।",
          { url: "/dashboard" }
        );
        localStorage.setItem(reminderSentKey, "true");
      }
    } catch {
      // ignore
    }
  }
}

export const notificationService = new NotificationService();

