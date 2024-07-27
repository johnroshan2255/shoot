document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        if (username) {
            window.location.href = `/game?username=${encodeURIComponent(username)}`;
        } else {
            alert('Please enter a name');
        }
    });
});