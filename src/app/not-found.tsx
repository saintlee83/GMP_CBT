import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-extrabold text-brand-600">404</div>
        <h1 className="mt-4 text-xl font-bold text-slate-800">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-700 transition"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
