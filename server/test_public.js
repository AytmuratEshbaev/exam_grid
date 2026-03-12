async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/public/today-exams');
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err.message);
  }
}
test();
