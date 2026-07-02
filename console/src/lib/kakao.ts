/** 카카오 공유하기 — VITE_KAKAO_JS_KEY가 설정된 경우에만 활성화.
 *  키 발급: developers.kakao.com → 앱 생성 → JavaScript 키 + 플랫폼(Web) 도메인 등록. */

interface KakaoShare {
  sendDefault(options: {
    objectType: "text";
    text: string;
    link: { webUrl: string; mobileWebUrl: string };
  }): void;
}

interface KakaoSDK {
  init(key: string): void;
  isInitialized(): boolean;
  Share: KakaoShare;
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

const KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;

export const kakaoEnabled = Boolean(KEY);

let loader: Promise<KakaoSDK | null> | null = null;

function loadKakao(): Promise<KakaoSDK | null> {
  if (!KEY) return Promise.resolve(null);
  if (window.Kakao?.isInitialized()) return Promise.resolve(window.Kakao);
  if (!loader) {
    loader = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js";
      s.async = true;
      s.onload = () => {
        try {
          if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(KEY);
          resolve(window.Kakao ?? null);
        } catch {
          resolve(null);
        }
      };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return loader;
}

/** 텍스트를 카카오톡 대화방으로 공유(대화방 선택 UI가 뜸). 텍스트 템플릿은 200자 내외 권장. */
export async function shareToKakao(text: string, url = "https://home.qtuniv.com"): Promise<boolean> {
  const kakao = await loadKakao();
  if (!kakao) return false;
  kakao.Share.sendDefault({
    objectType: "text",
    text,
    link: { webUrl: url, mobileWebUrl: url },
  });
  return true;
}
