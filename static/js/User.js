document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Login successful');
        localStorage.setItem('token', data.token);  // Store JWT token
        window.location.href = 'dash.html';   // Redirect to dashboard
      } else {
        alert(data.error || 'Login failed. Please check your credentials.');
      }

    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred. Please try again later.');
    }
  });
