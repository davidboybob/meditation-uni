import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-accent-soft">404</p>
        <h1 className="text-xl font-bold text-accent-deep">페이지를 찾을 수 없습니다</h1>
        <Link to="/" className="inline-block px-6 py-2 rounded-2xl text-sm font-semibold text-white bg-accent hover:bg-accent-deep shadow-button transition">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
