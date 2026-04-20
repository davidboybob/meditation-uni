import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold opacity-20">404</p>
        <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
        <Link to="/" className="inline-block px-6 py-2 rounded-lg text-sm font-medium text-white bg-accent">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
