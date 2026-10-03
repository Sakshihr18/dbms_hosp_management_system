const styles = {
  Scheduled: 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-600',
  Pending: 'bg-amber-50 text-amber-700',
  Paid: 'bg-emerald-50 text-emerald-700',
  Admitted: 'bg-teal-50 text-teal-700',
  Discharged: 'bg-slate-100 text-slate-600',
  Ordered: 'bg-amber-50 text-amber-700',
};

export default function Badge({ value }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[value] || 'bg-slate-100 text-slate-700'}`}>
      {value}
    </span>
  );
}
