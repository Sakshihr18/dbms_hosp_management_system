export default function Table({ columns, rows, empty = 'No records found.' }) {
  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2 font-medium">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || row.appointment_id || row.patient_id || row.bill_id || idx} className="border-b border-slate-100">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-3 text-slate-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
