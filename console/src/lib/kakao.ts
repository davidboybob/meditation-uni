/** 카카오 공유 — @kit/kakao 소비. VITE_KAKAO_JS_KEY 설정 시 활성화. */
import { createKakaoShare } from "@kit/kakao";

const share = createKakaoShare(import.meta.env.VITE_KAKAO_JS_KEY as string | undefined);

export const kakaoEnabled = share.enabled;

export function shareToKakao(text: string, url = "https://home.qtuniv.com"): Promise<boolean> {
  return share.shareText(text, url);
}
