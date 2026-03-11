const bcrypt = require('bcrypt');

async function test() {
    const hash = '$2b$10$wE4l3fI1Z5B29qP1Q1yO1eIuNj3dFfMxO30l6ZqNj6P8z6Q1yO1eI';
    const match = await bcrypt.compare('admin123', hash);
    console.log('Match:', match);
    
    if (!match) {
        const newHash = await bcrypt.hash('admin123', 10);
        console.log('New hash for admin123:', newHash);
    }
}

test();
