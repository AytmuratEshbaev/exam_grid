const idHeader = /^(?:student[\s_-]*)?id$/i;
const readId = value => {
  const id = String(value ?? '').trim();
  if (!/^[0-9]{1,20}$/.test(id)) throw new Error('ID faqat raqamlardan iborat bo‘lishi kerak (1–20 belgi)');
  return id;
};

// Keep credentials and IDs as text so leading zeros survive Excel imports.
export function parseStudentImportRows(rows) {
  return rows.map(row => {
    const keys = Object.keys(row);
    const find = pattern => keys.find(key => pattern.test(key.trim().toLowerCase()));
    const nameKey = find(/name|ism|fio/);
    const classKey = find(/class|sinf/);
    const loginKey = find(/login/) || find(/code|kod/) || keys[2];
    const passwordKey = find(/password|parol/);
    const idKey = find(idHeader);
    return {
      full_name: String(row[nameKey || keys[0]] ?? '').trim(),
      class_name: String(row[classKey || keys[1]] ?? '').trim(),
      student_code: String(row[loginKey] ?? '').trim(),
      ...(passwordKey ? { student_password: String(row[passwordKey] ?? '') } : {}),
      ...(idKey ? { student_id: readId(row[idKey]) } : {}),
    };
  }).filter(student => student.full_name && student.class_name && student.student_code);
}

export function parseCredentialUpdateRows(rows) {
  return rows.map((row, index) => {
    const keys = Object.keys(row);
    const idKey = keys.find(key => idHeader.test(key.trim()));
    const loginKey = keys.find(key => /login|code|kod/i.test(key));
    const passwordKey = keys.find(key => /password|parol/i.test(key));
    if (!idKey || !loginKey || !passwordKey) throw new Error('ID, Login va Password ustunlari kerak');
    const student_id = readId(row[idKey]);
    const student_code = String(row[loginKey] ?? '').trim();
    const student_password = String(row[passwordKey] ?? '');
    if (!student_code || !student_password.trim()) throw new Error(`${index + 2}-qatorda Login yoki Password bo‘sh`);
    return { student_id, student_code, student_password };
  });
}
