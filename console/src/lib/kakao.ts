/** 카카오 공유 — @kit/kakao 소비. VITE_KAKAO_JS_KEY 설정 시 활성화. */
import { createKakaoShare } from "@kit/kakao";
import { HOME_URL } from "./config";

const share = createKakaoShare(import.meta.env.VITE_KAKAO_JS_KEY as string | undefined);

export const kakaoEnabled = share.enabled;

export function shareToKakao(text: string, url = HOME_URL): Promise<boolean> {
  return share.shareText(text, url);
}
