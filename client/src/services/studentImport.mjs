// Keep credentials as text; a missing password column preserves existing passwords.
export function parseStudentImportRows(rows) {
  return rows.map(row => {
    const keys = Object.keys(row);
    const find = pattern => keys.find(key => pattern.test(key.trim().toLowerCase()));
    const nameKey = find(/name|ism|fio/);
    const classKey = find(/class|sinf/);
    const loginKey = find(/login/) || find(/code|kod/) || keys[2];
    const passwordKey = find(/password|parol/);
    return {
      full_name: String(row[nameKey || keys[0]] ?? '').trim(),
      class_name: String(row[classKey || keys[1]] ?? '').trim(),
      student_code: String(row[loginKey] ?? '').trim(),
      ...(passwordKey ? { student_password: String(row[passwordKey] ?? '') } : {}),
    };
  }).filter(student => student.full_name && student.class_name && student.student_code);
}
