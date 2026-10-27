const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const XLSX = require('../../client/node_modules/xlsx');

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/examgrid_test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters';
const app = require('../app');
const db = require('../database/db');
const originalQuery = db.query;
const originalConnect = db.pool.connect;
let server, baseUrl;

before(async () => {
  server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterEach(() => { db.query = originalQuery; db.pool.connect = originalConnect; });
after(async () => {
  await new Promise(resolve => server.close(resolve));
  await db.pool.end();
});
const request = (url, role, body, method = 'POST') => fetch(baseUrl + url, {
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(role ? { Authorization: `Bearer ${jwt.sign({ id: 1, role }, process.env.JWT_SECRET)}` } : {}),
  },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

test('manual student creation and editing persist the exact external password', async () => {
  const student = { full_name: 'Test Student', student_code: '00123', student_password: ' #abc 09 ', class_id: null };
  db.query = async (sql, params) => {
    if (sql.startsWith('INSERT INTO students')) {
      assert.match(sql, /student_password/);
      assert.equal(params[5], student.student_password);
      return { rows: [{ id: 7, ...student }] };
    }
    if (sql.startsWith('SELECT class_id')) return { rows: [{ class_id: null }] };
    assert.match(sql, /student_password=COALESCE/);
    assert.equal(params[3], 'updated-password');
    assert.equal(params[5], '7');
    return { rows: [{ id: 7, ...student, student_password: params[3] }] };
  };
  let response = await request('/api/admin/students', 'superadmin', student);
  assert.equal(response.status, 201);
  assert.equal((await response.json()).student_password, student.student_password);
  response = await request('/api/admin/students/7', 'superadmin', {...student, student_password:'updated-password'}, 'PUT');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).student_password, 'updated-password');
});

test('Excel headers support legacy Code and new Login/Password without damaging text credentials', async () => {
  const { parseStudentImportRows } = await import('../../client/src/services/studentImport.mjs');
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Full Name','Class','Code','password'],
    ['Test Student','5-C','00123',' #test 09 '],
  ]);
  const [student] = parseStudentImportRows(XLSX.utils.sheet_to_json(worksheet, {raw:false}));
  assert.equal(student.student_code, '00123');
  assert.equal(student.student_password, ' #test 09 ');
  const [newFormat] = parseStudentImportRows([{'Full Name':'Test Student',Class:'5-C',Login:'abc',Parol:'secret'}]);
  assert.equal(newFormat.student_password,'secret');
  const [legacy] = parseStudentImportRows([{'Full Name':'Test Student',Class:'5-C',Code:'abc'}]);
  assert.equal(legacy.student_password,undefined);
});

test('import sends passwords to the transactional insert and updates credentials for existing logins', async () => {
  const inserted = [];
  let committed = false, released = false;
  db.pool.connect = async () => ({
    query: async (sql, params) => {
      if (sql.startsWith('SELECT id FROM classes')) return { rows: [{id:3}] };
      if (sql.startsWith('INSERT INTO students')) {
        assert.match(sql, /ON CONFLICT \(student_code\) DO UPDATE/);
        assert.match(sql, /COALESCE\(EXCLUDED.student_password, students.student_password\)/);
        inserted.push(params);
      }
      if (sql === 'COMMIT') committed = true;
      return { rows: [] };
    },
    release: () => { released = true; },
  });
  const response = await request('/api/admin/students/import','superadmin',{students:[
    {full_name:'Test Student',class_name:'5-C',student_code:'00123',student_password:' #test '},
    {full_name:'Legacy Student',class_name:'5-C',student_code:'00456'},
  ]});
  assert.equal(response.status,200);
  assert.equal(inserted[0][3],' #test ');
  assert.equal(inserted[1][3],null);
  assert.ok(committed && released);
});

test('only staff can read student credentials; invigilators cannot change them', async () => {
  db.query = async (sql) => {
    assert.match(sql,/s\.student_password/);
    return { rows: [{full_name:'Test Student',student_code:'00123',student_password:'secret'}] };
  };
  let response = await request('/api/admin/assignments/1','invigilator',null,'GET');
  assert.equal(response.status,200);
  assert.equal((await response.json())[0].student_password,'secret');
  response = await request('/api/admin/assignments/1',null,null,'GET');
  assert.equal(response.status,401);
  response = await request('/api/admin/students','invigilator',{full_name:'Unauthorized'});
  assert.equal(response.status,403);
});

test('public exam and search queries never select logins or passwords', async () => {
  db.query = async (sql) => {
    const selection = sql.split(/\bFROM\b/i)[0];
    assert.doesNotMatch(selection,/student_code|student_password|s\.\*/i);
    if (/SELECT \* FROM exams/.test(sql)) return {rows:[{id:1,name:'Test Exam'}]};
    return {rows:[]};
  };
  for (const path of ['/api/public/today-exams','/api/public/search?query=Test','/api/public/exam/1','/api/public/exam/1/rooms']) {
    const response = await fetch(baseUrl+path);
    assert.equal(response.status,200,path);
    assert.doesNotMatch(await response.text(),/student_code|student_password/);
  }
});

test('numeric permanent IDs import as text with leading zeros and reject letters', async () => {
  const {parseStudentImportRows,parseCredentialUpdateRows} = await import('../../client/src/services/studentImport.mjs');
  const [student] = parseStudentImportRows([{'Full Name':'Test Student',Class:'5-A',Login:'a',Password:'p',ID:'000123'}]);
  assert.equal(student.student_id,'000123');
  assert.throws(()=>parseStudentImportRows([{'Full Name':'Test',Class:'5-A',Login:'a',ID:'ID123'}]), /ID/);
  const [update] = parseCredentialUpdateRows([{ID:'000123',Login:'new-login',Password:' #new-password '}]);
  assert.deepEqual(update,{student_id:'000123',student_code:'new-login',student_password:' #new-password '});
  assert.throws(()=>parseCredentialUpdateRows([{ID:'123',Login:'new-login'}]), /Password/);
  assert.throws(()=>parseCredentialUpdateRows([{ID:'123',Login:'new-login',Password:''}]), /Password/);
  db.query = async () => {throw new Error('Invalid ID must not reach the database');};
  let response = await request('/api/admin/students','superadmin',{full_name:'Test',student_code:'a',student_id:'ID123'});
  assert.equal(response.status,400);
  response = await request('/api/admin/students/1','superadmin',{student_id:'1.5'},'PUT');
  assert.equal(response.status,400);
});

test('create and edit pass permanent numeric IDs to the database without losing zeros', async () => {
  db.query = async (sql,params) => {
    if(sql.startsWith('SELECT class_id'))return {rows:[{class_id:null}]};
    if(sql.startsWith('INSERT'))assert.equal(params[3],'000123');
    else {
      assert.match(sql,/student_id=COALESCE/);
      assert.equal(params[4],'000456');
      assert.equal(params[5],'1');
    }
    return {rows:[{id:1,student_id:sql.startsWith('INSERT')?'000123':'000456'}]};
  };
  const student={full_name:'Test',class_id:null,student_code:'a',student_id:'000123'};
  assert.equal((await request('/api/admin/students','superadmin',student)).status,201);
  assert.equal((await request('/api/admin/students/1','superadmin',{...student,student_id:'000456'},'PUT')).status,200);
});

test('credential batch matches permanent IDs, supports swapped logins, and rolls back on conflicts', async () => {
  let records=[
    {student_id:'001',student_code:'alpha',student_password:'old-a'},
    {student_id:'002',student_code:'beta',student_password:'old-b'},
    {student_id:'003',student_code:'other',student_password:'old-c'},
  ];
  let snapshot;
  db.pool.connect=async()=>({
    query:async(sql,params)=>{
      if(sql==='BEGIN'){snapshot=structuredClone(records);return {rows:[]};}
      if(sql==='ROLLBACK'){records=snapshot;return {rows:[]};}
      if(sql==='COMMIT')return {rows:[]};
      if(sql.includes('SET student_code = NULL')){
        for(const row of records)if(params[0].includes(row.student_id))row.student_code=null;
        return {rowCount:records.length};
      }
      assert.match(sql,/SET student_code = \$1, student_password = \$2 WHERE student_id = \$3/);
      const [login,password,id]=params;
      const row=records.find(row=>row.student_id===id);
      if(!row)return {rowCount:0};
      if(records.some(other=>other!==row&&other.student_code===login))throw new Error('Login already exists');
      row.student_code=login;row.student_password=password;
      return {rowCount:1};
    },release:()=>{},
  });
  let response=await request('/api/admin/students/update-logins','superadmin',{entries:[
    {student_id:'001',student_code:'beta',student_password:'new-a'},
    {student_id:'002',student_code:'alpha',student_password:'new-b'},
    {student_id:'999',student_code:'missing',student_password:'new-missing'},
  ]});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.updated,2);assert.deepEqual(body.notFoundList,['999']);
  assert.equal(records[0].student_code,'beta');assert.equal(records[0].student_password,'new-a');
  assert.equal(records[1].student_code,'alpha');assert.equal(records[1].student_password,'new-b');
  const saved=structuredClone(records);
  response=await request('/api/admin/students/update-logins','superadmin',{entries:[
    {student_id:'001',student_code:'free',student_password:'temporary'},
    {student_id:'002',student_code:'other',student_password:'conflict'},
  ]});
  assert.equal(response.status,500);
  assert.deepEqual(records,saved);
});

test('credential updates reject malformed or duplicate IDs and missing passwords before writing', async () => {
  db.pool.connect=async()=>{throw new Error('Invalid batches must not connect');};
  const valid={student_id:'001',student_code:'alpha',student_password:'new-password'};
  for(const entries of [
    [{...valid,student_id:'ID001'}],
    [{student_id:'001',student_code:'alpha'}],
    [valid,{...valid,student_code:'beta'}],
    [valid,{...valid,student_id:'002'}],
  ]){
    assert.equal((await request('/api/admin/students/update-logins','superadmin',{entries})).status,400);
  }
  assert.equal((await request('/api/admin/students/update-logins','invigilator',{entries:[valid]})).status,403);
});
