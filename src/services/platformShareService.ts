export interface ShareData {
  mealName: string;
  caption: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const platformShareService = {
  shareToInstagram: (data: ShareData) => {
    const text = `${data.mealName}\n\n${data.caption}\n\n📊 Nutrition:\nCalories: ${data.calories} kcal\nProtein: ${Math.round(data.protein)}g\nCarbs: ${Math.round(data.carbs)}g\nFats: ${Math.round(data.fats)}g`;

    if (data.imageUrl) {
      const shareUrl = `https://www.instagram.com/?url=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
      window.open(shareUrl, '_blank', 'width=600,height=600');
    } else {
      alert('Please add an image to share on Instagram');
    }
  },

  shareToFacebook: (data: ShareData) => {
    const url = encodeURIComponent(window.location.href);
    const quote = encodeURIComponent(`${data.mealName}\n\n${data.caption}\n\nCalories: ${data.calories} kcal`);
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`;
    window.open(facebookShareUrl, '_blank', 'width=600,height=400');
  },

  shareToSnapchat: (data: ShareData) => {
    const text = `${data.mealName} - ${data.calories} kcal\n${data.caption}`;
    const snapchatShareUrl = `https://www.snapchat.com/share?text=${encodeURIComponent(text)}`;
    window.open(snapchatShareUrl, '_blank', 'width=600,height=600');
  },

  shareToTwitter: (data: ShareData) => {
    const text = `Just logged: ${data.mealName} (${data.calories} kcal)\n\n📊 ${Math.round(data.protein)}g protein | ${Math.round(data.carbs)}g carbs | ${Math.round(data.fats)}g fat\n\n${data.caption}`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterShareUrl, '_blank', 'width=600,height=400');
  },

  copyToClipboard: async (data: ShareData) => {
    const text = `${data.mealName}\n\nCalories: ${data.calories} kcal\nProtein: ${Math.round(data.protein)}g\nCarbs: ${Math.round(data.carbs)}g\nFats: ${Math.round(data.fats)}g\n\n${data.caption}`;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  },

  generateShareText: (data: ShareData): string => {
    return `${data.mealName}\n\n📊 Nutrition:\nCalories: ${data.calories} kcal\nProtein: ${Math.round(data.protein)}g\nCarbs: ${Math.round(data.carbs)}g\nFats: ${Math.round(data.fats)}g\n\n${data.caption}`;
  }
};
