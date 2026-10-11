"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { getLanguage, isSupportedLanguage, type LanguageConfig } from "@/config/locales";
import { localeForLanguage } from "@/lib/format";
import {
  createPersistentStore,
  parseNullableString,
  usePersistentStore,
} from "@/lib/persistent-store";
import { useCountry } from "./CountryContext";

/** UI chrome translations. Product content is localised by the backend. */
type Dictionary = Record<string, string>;

const TRANSLATIONS: Record<string, Dictionary> = {
  en: {
    search_placeholder: "Search products, brands and categories",
    search: "Search",
    all_categories: "All categories",
    deliver_to: "Deliver to",
    language: "Language",
    currency: "Currency",
    cart: "Cart",
    account: "Account",
    wishlist: "Wishlist",
    home: "Home",
    shops: "Stores",
    deals: "Deals",
    filters: "Filters",
    sort: "Sort",
    results: "results",
    no_products: "No products found.",
    loading_products: "Loading products…",
    load_error: "Unable to load products. Try again.",
    retry: "Try again",
    add_to_cart: "Add to cart",
    quick_view: "Quick view",
    in_stock: "In stock",
    out_of_stock: "Out of stock",
    featured: "Featured for you",
  },
  ne: {
    search_placeholder: "उत्पादन, ब्रान्ड र श्रेणी खोज्नुहोस्",
    search: "खोज्नुहोस्",
    all_categories: "सबै श्रेणीहरू",
    deliver_to: "डेलिभरी",
    language: "भाषा",
    currency: "मुद्रा",
    cart: "कार्ट",
    account: "खाता",
    wishlist: "इच्छा सूची",
    home: "गृहपृष्ठ",
    shops: "पसलहरू",
    deals: "अफरहरू",
    filters: "फिल्टर",
    sort: "क्रम",
    results: "नतिजा",
    no_products: "कुनै उत्पादन भेटिएन।",
    loading_products: "उत्पादनहरू लोड हुँदैछ…",
    load_error: "उत्पादन लोड गर्न सकिएन। पुनः प्रयास गर्नुहोस्।",
    retry: "पुनः प्रयास",
    add_to_cart: "कार्टमा थप्नुहोस्",
    quick_view: "छिटो हेर्नुहोस्",
    in_stock: "स्टकमा",
    out_of_stock: "स्टक छैन",
    featured: "तपाईंका लागि",
  },
  bn: {
    search_placeholder: "পণ্য, ব্র্যান্ড ও বিভাগ খুঁজুন",
    search: "খুঁজুন",
    all_categories: "সব বিভাগ",
    deliver_to: "ডেলিভারি",
    language: "ভাষা",
    currency: "মুদ্রা",
    cart: "কার্ট",
    account: "অ্যাকাউন্ট",
    wishlist: "ইচ্ছেতালিকা",
    home: "হোম",
    shops: "স্টোর",
    deals: "ডিল",
    filters: "ফিল্টার",
    sort: "সাজান",
    results: "ফলাফল",
    no_products: "কোনো পণ্য পাওয়া যায়নি।",
    loading_products: "পণ্য লোড হচ্ছে…",
    load_error: "পণ্য লোড করা যায়নি। আবার চেষ্টা করুন।",
    retry: "আবার চেষ্টা",
    add_to_cart: "কার্টে যোগ করুন",
    quick_view: "দ্রুত দেখুন",
    in_stock: "স্টকে আছে",
    out_of_stock: "স্টকে নেই",
    featured: "আপনার জন্য",
  },
  zh: {
    search_placeholder: "搜索商品、品牌和分类",
    search: "搜索",
    all_categories: "全部分类",
    deliver_to: "配送至",
    language: "语言",
    currency: "货币",
    cart: "购物车",
    account: "账户",
    wishlist: "收藏",
    home: "首页",
    shops: "店铺",
    deals: "优惠",
    filters: "筛选",
    sort: "排序",
    results: "个结果",
    no_products: "未找到商品。",
    loading_products: "正在加载商品…",
    load_error: "无法加载商品，请重试。",
    retry: "重试",
    add_to_cart: "加入购物车",
    quick_view: "快速查看",
    in_stock: "有货",
    out_of_stock: "缺货",
    featured: "为你推荐",
  },
  hi: {
    search_placeholder: "उत्पाद, ब्रांड और श्रेणियाँ खोजें",
    search: "खोजें",
    all_categories: "सभी श्रेणियाँ",
    deliver_to: "डिलीवरी",
    language: "भाषा",
    currency: "मुद्रा",
    cart: "कार्ट",
    account: "खाता",
    wishlist: "विशलिस्ट",
    home: "होम",
    shops: "स्टोर",
    deals: "डील",
    filters: "फ़िल्टर",
    sort: "क्रम",
    results: "परिणाम",
    no_products: "कोई उत्पाद नहीं मिला।",
    loading_products: "उत्पाद लोड हो रहे हैं…",
    load_error: "उत्पाद लोड नहीं हो सके। पुनः प्रयास करें।",
    retry: "पुनः प्रयास",
    add_to_cart: "कार्ट में डालें",
    quick_view: "त्वरित देखें",
    in_stock: "स्टॉक में",
    out_of_stock: "स्टॉक में नहीं",
    featured: "आपके लिए",
  },
};

interface LocaleContextValue {
  language: string;
  languageConfig: LanguageConfig;
  locale: string;
  dir: "ltr" | "rtl";
  availableLanguages: LanguageConfig[];
  setLanguage: (code: string) => void;
  t: (key: string, fallback?: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "sukilo.language";

const languageStore = createPersistentStore<string | null>(
  STORAGE_KEY,
  null,
  (raw) => (raw && isSupportedLanguage(raw) ? parseNullableString(raw) : null),
);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { country } = useCountry();
  const stored = usePersistentStore(languageStore);

  // A stored language only applies if the active country offers it; otherwise
  // fall back to the country's default. Deriving avoids a sync effect.
  const language =
    stored && country.languages.includes(stored) ? stored : country.defaultLanguage;

  const setLanguage = useCallback((code: string) => {
    if (!isSupportedLanguage(code)) return;
    languageStore.set(code);
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const config = getLanguage(language);
    const dictionary = TRANSLATIONS[language] ?? {};
    const fallbackDictionary = TRANSLATIONS.en;
    return {
      language,
      languageConfig: config,
      locale: localeForLanguage(language),
      dir: config.dir,
      availableLanguages: country.languages.map(getLanguage),
      setLanguage,
      t: (key, fallback) => dictionary[key] ?? fallbackDictionary[key] ?? fallback ?? key,
    };
  }, [language, country.languages, setLanguage]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
