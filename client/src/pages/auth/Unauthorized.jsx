export default function Unauthorized() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-semibold">Unauthorized access.</h1>
      <p className="mt-2 text-slate-600">You do not have permission to view this page.</p>
    </div>
  );
}
