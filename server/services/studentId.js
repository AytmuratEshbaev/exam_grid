function normalizeStudentId(value, required = false) {
  if (value == null || value === '') {
    if (required) throw new Error('ID majburiy va faqat raqamlardan iborat bo‘lishi kerak');
    return null;
  }
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new Error('ID ni Excel faylida matn formatida saqlang');
  }
  const id = String(value).trim();
  if (!/^[0-9]{1,20}$/.test(id)) {
    throw new Error('ID faqat raqamlardan iborat va 20 belgidan oshmagan bo‘lishi kerak');
  }
  return id;
}

module.exports = { normalizeStudentId };
