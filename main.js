document.getElementById('topSearchBtn').addEventListener('click', () => {
    const val = document.getElementById('topInput').value.trim();
    if(val) {
        // переходим на страницу поиска с параметром q
        window.location.href = `search.html?q=${encodeURIComponent(val)}`;
    }
});
