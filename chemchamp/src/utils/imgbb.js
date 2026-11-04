export const uploadToImgBB = async (imageFile) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("ImgBB API Key পাওয়া যায়নি! .env ফাইলে কী যুক্ত করুন।");
  }

  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.url; // ইমেজের সরাসরি ডিরেক্ট লিঙ্ক
    } else {
      throw new Error(data.error?.message || "Image upload failed");
    }
  } catch (error) {
    console.error("ImgBB Upload Error:", error);
    throw error;
  }
};