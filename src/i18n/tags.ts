import type { Locale } from "./locales";
import { defaultLocale } from "./locales";
import type { CanonicalTag } from "@/lib/tags";
import { CANONICAL_TAGS } from "@/lib/tags";

const tagLabels: Record<Locale, Record<CanonicalTag, string>> = {
  "zh-TW": {
    僑外生: "僑外生",
    留台工作: "留台工作",
    求職面試: "求職面試",
    個人品牌: "個人品牌",
    "AI 實作": "AI 實作",
    聰電站: "聰電站",
    台大創創: "台大創創",
    創業募資: "創業募資",
    "簡報 Pitch": "簡報 Pitch",
    "WPORT 功能": "WPORT 功能",
  },
  "en-US": {
    僑外生: "Overseas students",
    留台工作: "Work & stay",
    求職面試: "Job interviews",
    個人品牌: "Personal brand",
    "AI 實作": "AI hands-on",
    聰電站: "Charging Station",
    台大創創: "NTU TEC",
    創業募資: "Fundraising",
    "簡報 Pitch": "Pitch decks",
    "WPORT 功能": "WPORT features",
  },
  "id-ID": {
    僑外生: "Mahasiswa luar negeri",
    留台工作: "Kerja & tinggal",
    求職面試: "Wawancara kerja",
    個人品牌: "Personal branding",
    "AI 實作": "Praktik AI",
    聰電站: "Charging Station",
    台大創創: "NTU TEC",
    創業募資: "Penggalangan dana",
    "簡報 Pitch": "Pitch deck",
    "WPORT 功能": "Fitur WPORT",
  },
  "vi-VN": {
    僑外生: "Du học sinh",
    留台工作: "Làm việc & ở lại",
    求職面試: "Phỏng vấn xin việc",
    個人品牌: "Thương hiệu cá nhân",
    "AI 實作": "Thực hành AI",
    聰電站: "Charging Station",
    台大創創: "NTU TEC",
    創業募資: "Gọi vốn",
    "簡報 Pitch": "Pitch deck",
    "WPORT 功能": "Tính năng WPORT",
  },
  "th-TH": {
    僑外生: "นักศึกษาต่างชาติ",
    留台工作: "ทำงานและอยู่ต่อ",
    求職面試: "สัมภาษณ์งาน",
    個人品牌: "แบรนด์ส่วนตัว",
    "AI 實作": "AI ภาคปฏิบัติ",
    聰電站: "Charging Station",
    台大創創: "NTU TEC",
    創業募資: "ระดมทุน",
    "簡報 Pitch": "Pitch deck",
    "WPORT 功能": "ฟีเจอร์ WPORT",
  },
};

export function translateTag(locale: Locale, tag: string): string {
  const dict = tagLabels[locale] ?? tagLabels[defaultLocale];
  if ((CANONICAL_TAGS as readonly string[]).includes(tag)) {
    return dict[tag as CanonicalTag] ?? tag;
  }
  return tag;
}

export function translateTags(locale: Locale, tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  return tags.map((tag) => translateTag(locale, tag));
}
