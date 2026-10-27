// Use only in authenticated staff views. Public APIs never return these values.
const StudentCredentials = ({ student }) => (
  <dl className="text-xs space-y-1 min-w-0">
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-slate-500">ID</dt>
      <dd className="font-mono text-slate-700 break-all">{student.student_id || '—'}</dd>
    </div>
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-slate-500">Login</dt>
      <dd className="font-mono text-slate-700 break-all">{student.student_code || '—'}</dd>
    </div>
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-slate-500">Password</dt>
      <dd className="font-mono text-slate-700 break-all">{student.student_password || '—'}</dd>
    </div>
  </dl>
);

export default StudentCredentials;
