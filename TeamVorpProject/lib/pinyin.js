import { pinyin } from "pinyin-pro";


export function toPinyin(text) {
  try {
    return pinyin(text, { toneType: "symbol", type: "array" })
      .filter((s) => /[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(s))
      .join(" ");
  } catch (e) {
    return "";
  }
}